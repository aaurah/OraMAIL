import { Router } from "express";
import { db } from "@workspace/db";
import { emailsTable, activityTable } from "@workspace/db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import { SendEmailBody, ListEmailsQueryParams, GetEmailParams } from "@workspace/api-zod";
import { getPostmarkClient, isPostmarkConfigured } from "../lib/postmark";

const router = Router();

router.get("/emails", async (req, res) => {
  const query = ListEmailsQueryParams.parse(req.query);
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  let whereClause = undefined as ReturnType<typeof eq> | undefined;

  if (query.status) {
    whereClause = eq(emailsTable.status, query.status as typeof emailsTable.status._.data);
  }
  if (query.search) {
    const search = `%${query.search}%`;
    whereClause = or(
      ilike(emailsTable.to, search),
      ilike(emailsTable.from, search),
      ilike(emailsTable.subject, search),
    ) as ReturnType<typeof eq>;
  }

  const [emails, countResult] = await Promise.all([
    db
      .select()
      .from(emailsTable)
      .where(whereClause)
      .orderBy(desc(emailsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(emailsTable)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  res.json({
    emails: emails.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      sentAt: e.sentAt?.toISOString() ?? null,
    })),
    total,
    page,
    limit,
  });
});

router.post("/emails", async (req, res) => {
  const body = SendEmailBody.parse(req.body);

  const [email] = await db
    .insert(emailsTable)
    .values({
      from: body.from,
      to: body.to,
      subject: body.subject,
      htmlBody: body.htmlBody,
      textBody: body.textBody,
      templateId: body.templateId,
      tag: body.tag,
      trackOpens: body.trackOpens ?? true,
      trackLinks: body.trackLinks ?? true,
      status: "queued",
    })
    .returning();

  let sentStatus: "sent" | "queued" = "queued";
  let messageId: string | null = null;

  if (isPostmarkConfigured()) {
    try {
      const client = getPostmarkClient();
      const result = await client.sendEmail({
        From: body.from,
        To: body.to,
        Subject: body.subject,
        HtmlBody: body.htmlBody,
        TextBody: body.textBody,
        Tag: body.tag,
        TrackOpens: body.trackOpens ?? true,
        TrackLinks: (body.trackLinks ? "HtmlAndText" : "None") as unknown as import("postmark/dist/client/models/message/SupportingTypes.js").LinkTrackingOptions,
      });
      sentStatus = "sent";
      messageId = result.MessageID;
    } catch (err) {
      req.log.error({ err }, "Postmark send failed");
    }
  }

  const [updated] = await db
    .update(emailsTable)
    .set({
      status: sentStatus,
      sentAt: sentStatus === "sent" ? new Date() : null,
      messageId,
    })
    .where(eq(emailsTable.id, email.id))
    .returning();

  await db.insert(activityTable).values({
    type: sentStatus === "sent" ? "sent" : "sent",
    email: body.to,
    subject: body.subject,
    description: `Email ${sentStatus === "sent" ? "sent" : "queued"} to ${body.to}`,
  });

  res.status(201).json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    sentAt: updated.sentAt?.toISOString() ?? null,
  });
});

router.get("/emails/:id", async (req, res) => {
  const { id } = GetEmailParams.parse(req.params);
  const email = await db.select().from(emailsTable).where(eq(emailsTable.id, id)).limit(1);

  if (!email[0]) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  const e = email[0];
  res.json({
    ...e,
    createdAt: e.createdAt.toISOString(),
    sentAt: e.sentAt?.toISOString() ?? null,
  });
});

export default router;
