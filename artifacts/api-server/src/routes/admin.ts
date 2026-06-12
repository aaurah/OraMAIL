import { Router } from "express";
import { db } from "@workspace/db";
import { adminSettingsTable, DEFAULT_ADMIN_SETTINGS } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(adminSettingsTable);
  const stored: Record<string, string> = {};
  for (const row of rows) {
    stored[row.key] = row.value;
  }
  return { ...DEFAULT_ADMIN_SETTINGS, ...stored };
}

router.get("/admin/settings", async (req, res) => {
  const settings = await getSettings();
  res.json({ settings });
});

router.patch("/admin/settings", async (req, res) => {
  const { key, value } = req.body;

  if (!key || typeof key !== "string" || !(key in DEFAULT_ADMIN_SETTINGS)) {
    return res.status(400).json({ error: "invalid key" });
  }
  if (value === undefined || value === null) {
    return res.status(400).json({ error: "value is required" });
  }

  const strValue = String(value);

  await db
    .insert(adminSettingsTable)
    .values({ key, value: strValue, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: adminSettingsTable.key,
      set: { value: strValue, updatedAt: new Date() },
    });

  res.json({ key, value: strValue });
});

router.get("/admin/stats", async (req, res) => {
  const [emailCount] = await db.execute<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM emails`
  );
  const [inboundCount] = await db.execute<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM inbound_emails`
  );
  const [templateCount] = await db.execute<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM templates`
  );
  const [domainCount] = await db.execute<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM domains`
  );
  const [apiKeyCount] = await db.execute<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM api_keys WHERE is_active = true`
  );

  res.json({
    emails: Number(emailCount?.count ?? 0),
    inboundEmails: Number(inboundCount?.count ?? 0),
    templates: Number(templateCount?.count ?? 0),
    domains: Number(domainCount?.count ?? 0),
    activeApiKeys: Number(apiKeyCount?.count ?? 0),
  });
});

export default router;
