import { Router } from "express";
import { db } from "@workspace/db";
import { inboundEmailsTable, activityTable } from "@workspace/db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import { ListInboundQueryParams, GetInboundParams } from "@workspace/api-zod";

const router = Router();

router.get("/inbound", async (req, res) => {
  const query = ListInboundQueryParams.parse(req.query);
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  let whereClause = undefined as ReturnType<typeof eq> | undefined;

  if (query.search) {
    const search = `%${query.search}%`;
    whereClause = or(
      ilike(inboundEmailsTable.from, search),
      ilike(inboundEmailsTable.subject, search),
    ) as ReturnType<typeof eq>;
  }

  const [emails, countResult] = await Promise.all([
    db
      .select()
      .from(inboundEmailsTable)
      .where(whereClause)
      .orderBy(desc(inboundEmailsTable.receivedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(inboundEmailsTable)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  res.json({
    emails: emails.map((e) => ({
      ...e,
      receivedAt: e.receivedAt.toISOString(),
    })),
    total,
    page,
    limit,
  });
});

router.get("/inbound/:id", async (req, res) => {
  const { id } = GetInboundParams.parse(req.params);
  const email = await db.select().from(inboundEmailsTable).where(eq(inboundEmailsTable.id, id)).limit(1);

  if (!email[0]) {
    res.status(404).json({ error: "Inbound email not found" });
    return;
  }

  const e = email[0];
  res.json({ ...e, receivedAt: e.receivedAt.toISOString() });
});

router.post("/inbound/webhook", async (req, res) => {
  const payload = req.body as {
    From?: string;
    To?: string;
    Subject?: string;
    HtmlBody?: string;
    TextBody?: string;
    Headers?: string;
    Attachments?: unknown[];
  };

  if (!payload.From || !payload.To || !payload.Subject) {
    res.json({ status: "ok" });
    return;
  }

  const [inbound] = await db
    .insert(inboundEmailsTable)
    .values({
      from: payload.From,
      to: payload.To,
      subject: payload.Subject,
      htmlBody: payload.HtmlBody ?? null,
      textBody: payload.TextBody ?? null,
      headers: payload.Headers ? JSON.stringify(payload.Headers) : null,
      attachments: payload.Attachments?.length ?? 0,
      receivedAt: new Date(),
    })
    .returning();

  await db.insert(activityTable).values({
    type: "inbound",
    email: payload.From,
    subject: payload.Subject,
    description: `Received email from ${payload.From}`,
  });

  req.log.info({ id: inbound.id }, "Inbound email saved");
  res.json({ status: "ok" });
});

export default router;
