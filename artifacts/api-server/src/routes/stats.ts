import { Router } from "express";
import { db } from "@workspace/db";
import { emailsTable, inboundEmailsTable, activityTable } from "@workspace/db";
import { eq, sql, gte } from "drizzle-orm";
import { GetDeliveryStatsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/stats/overview", async (_req, res) => {
  const [emailStats] = await db
    .select({
      totalSent: sql<number>`count(*)`,
      delivered: sql<number>`count(*) filter (where status in ('sent','opened','clicked'))`,
      bounced: sql<number>`count(*) filter (where status = 'bounced')`,
      opened: sql<number>`count(*) filter (where status = 'opened' or opens > 0)`,
      clicked: sql<number>`count(*) filter (where status = 'clicked' or clicks > 0)`,
      spam: sql<number>`count(*) filter (where status = 'spam')`,
    })
    .from(emailsTable);

  const [inboundStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(inboundEmailsTable);

  const totalSent = Number(emailStats?.totalSent ?? 0);
  const delivered = Number(emailStats?.delivered ?? 0);
  const bounced = Number(emailStats?.bounced ?? 0);
  const opened = Number(emailStats?.opened ?? 0);
  const clicked = Number(emailStats?.clicked ?? 0);
  const spam = Number(emailStats?.spam ?? 0);
  const inboundReceived = Number(inboundStats?.count ?? 0);

  res.json({
    totalSent,
    delivered,
    bounced,
    opened,
    clicked,
    spamComplaints: spam,
    inboundReceived,
    deliveryRate: totalSent > 0 ? Math.round((delivered / totalSent) * 1000) / 10 : 0,
    openRate: delivered > 0 ? Math.round((opened / delivered) * 1000) / 10 : 0,
    clickRate: delivered > 0 ? Math.round((clicked / delivered) * 1000) / 10 : 0,
  });
});

router.get("/stats/delivery", async (req, res) => {
  const query = GetDeliveryStatsQueryParams.parse(req.query);
  const days = query.days ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', created_at)::date::text`,
      sent: sql<number>`count(*)`,
      delivered: sql<number>`count(*) filter (where status in ('sent','opened','clicked'))`,
      bounced: sql<number>`count(*) filter (where status = 'bounced')`,
      opened: sql<number>`count(*) filter (where status = 'opened' or opens > 0)`,
      clicked: sql<number>`count(*) filter (where status = 'clicked' or clicks > 0)`,
    })
    .from(emailsTable)
    .where(gte(emailsTable.createdAt, since))
    .groupBy(sql`date_trunc('day', created_at)`)
    .orderBy(sql`date_trunc('day', created_at)`);

  res.json(rows.map((r) => ({
    date: r.date,
    sent: Number(r.sent),
    delivered: Number(r.delivered),
    bounced: Number(r.bounced),
    opened: Number(r.opened),
    clicked: Number(r.clicked),
  })));
});

router.get("/stats/bounces", async (_req, res) => {
  const [stats] = await db
    .select({
      hard: sql<number>`count(*) filter (where status = 'bounced')`,
      spam: sql<number>`count(*) filter (where status = 'spam')`,
      unsubscribed: sql<number>`count(*) filter (where status = 'unsubscribed')`,
    })
    .from(emailsTable);

  res.json({
    hardBounces: Number(stats?.hard ?? 0),
    softBounces: Number(stats?.spam ?? 0),
    spamComplaints: Number(stats?.spam ?? 0),
    unsubscribes: Number(stats?.unsubscribed ?? 0),
  });
});

export default router;
