import { Router } from "express";
import { db } from "@workspace/db";
import { emailsTable, activityTable, templatesTable } from "@workspace/db";
import { eq, desc, ilike, or, sql, and } from "drizzle-orm";
import { z } from "zod";
import { sendEmailViaSMTP, isEmailConfigured } from "../lib/postmark";

const router = Router();

const SendBody = z.object({
  from: z.string().email(),
  fromName: z.string().optional(),
  to: z.string(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  replyTo: z.string().optional(),
  subject: z.string().min(1),
  htmlBody: z.string().optional(),
  textBody: z.string().optional(),
  templateId: z.coerce.number().int().optional(),
  tag: z.string().optional(),
  trackOpens: z.boolean().default(true),
  trackLinks: z.boolean().default(true),
});

router.get("/emails", async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;

  let whereClause = undefined as ReturnType<typeof eq> | undefined;

  if (req.query.status) {
    whereClause = eq(emailsTable.status, req.query.status as typeof emailsTable.status._.data);
  }
  if (req.query.search) {
    const search = `%${req.query.search}%`;
    whereClause = or(
      ilike(emailsTable.to, search),
      ilike(emailsTable.from, search),
      ilike(emailsTable.subject, search),
    ) as ReturnType<typeof eq>;
  }

  const [emails, countResult] = await Promise.all([
    db.select().from(emailsTable).where(whereClause).orderBy(desc(emailsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(emailsTable).where(whereClause),
  ]);

  res.json({
    emails: emails.map((e) => ({ ...e, createdAt: e.createdAt.toISOString(), sentAt: e.sentAt?.toISOString() ?? null })),
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit,
  });
});

router.post("/emails", async (req, res) => {
  const body = SendBody.parse(req.body);

  const [email] = await db.insert(emailsTable).values({
    from: body.from,
    fromName: body.fromName ?? null,
    to: body.to,
    cc: body.cc ?? null,
    bcc: body.bcc ?? null,
    replyTo: body.replyTo ?? null,
    subject: body.subject,
    htmlBody: body.htmlBody ?? null,
    textBody: body.textBody ?? null,
    templateId: body.templateId ?? null,
    tag: body.tag ?? null,
    trackOpens: body.trackOpens,
    trackLinks: body.trackLinks,
    status: "queued",
  }).returning();

  let sentStatus: "sent" | "queued" | "failed" = "queued";
  let messageId: string | null = null;
  let errorMessage: string | null = null;

  if (await isEmailConfigured()) {
    try {
      let html = body.htmlBody ?? null;
      let text = body.textBody ?? null;

      if (body.templateId) {
        const [tpl] = await db.select().from(templatesTable).where(eq(templatesTable.id, body.templateId));
        if (tpl) {
          html = tpl.htmlBody ?? html;
          text = tpl.textBody ?? text;
        }
      }

      const result = await sendEmailViaSMTP({
        from: body.from,
        fromName: body.fromName,
        to: body.to,
        cc: body.cc,
        bcc: body.bcc,
        replyTo: body.replyTo,
        subject: body.subject,
        html,
        text,
      });
      sentStatus = "sent";
      messageId = result.messageId;
    } catch (err) {
      sentStatus = "failed";
      errorMessage = err instanceof Error ? err.message : String(err);
      req.log.error({ err }, "Email send failed");
    }
  }

  const [updated] = await db.update(emailsTable).set({
    status: sentStatus,
    sentAt: sentStatus === "sent" ? new Date() : null,
    messageId,
    errorMessage,
  }).where(eq(emailsTable.id, email.id)).returning();

  if (body.templateId) {
    await db.update(templatesTable)
      .set({ usageCount: sql`${templatesTable.usageCount} + 1`, updatedAt: new Date() })
      .where(eq(templatesTable.id, body.templateId));
  }

  await db.insert(activityTable).values({
    type: sentStatus === "sent" ? "sent" : "bounced",
    email: body.to,
    subject: body.subject,
    description: sentStatus === "sent"
      ? `Email sent to ${body.to}`
      : sentStatus === "failed"
      ? `Email failed for ${body.to}: ${errorMessage}`
      : `Email queued for ${body.to}`,
  });

  res.status(201).json({ ...updated, createdAt: updated.createdAt.toISOString(), sentAt: updated.sentAt?.toISOString() ?? null });
});

router.post("/emails/:id/resend", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [email] = await db.select().from(emailsTable).where(eq(emailsTable.id, id));
  if (!email) { res.status(404).json({ error: "Email not found" }); return; }

  let sentStatus: "sent" | "queued" | "failed" = "queued";
  let messageId: string | null = email.messageId;
  let errorMessage: string | null = null;

  if (await isEmailConfigured()) {
    try {
      const result = await sendEmailViaSMTP({
        from: email.from,
        fromName: email.fromName,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        replyTo: email.replyTo,
        subject: email.subject,
        html: email.htmlBody,
        text: email.textBody,
      });
      sentStatus = "sent";
      messageId = result.messageId;
    } catch (err) {
      sentStatus = "failed";
      errorMessage = err instanceof Error ? err.message : String(err);
      req.log.error({ err }, "Email resend failed");
    }
  }

  const [updated] = await db.update(emailsTable).set({
    status: sentStatus,
    sentAt: sentStatus === "sent" ? new Date() : email.sentAt,
    messageId,
    errorMessage,
    retryCount: sql`${emailsTable.retryCount} + 1`,
  }).where(eq(emailsTable.id, id)).returning();

  res.json({ ...updated, createdAt: updated.createdAt.toISOString(), sentAt: updated.sentAt?.toISOString() ?? null });
});

router.get("/emails/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [email] = await db.select().from(emailsTable).where(eq(emailsTable.id, id));
  if (!email) { res.status(404).json({ error: "Email not found" }); return; }

  res.json({ ...email, createdAt: email.createdAt.toISOString(), sentAt: email.sentAt?.toISOString() ?? null });
});

export default router;
