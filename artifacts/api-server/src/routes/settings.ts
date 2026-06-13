import { Router } from "express";
import { db } from "@workspace/db";
import { adminSettingsTable, DEFAULT_ADMIN_SETTINGS } from "@workspace/db";
import { testSmtpConnection } from "../lib/postmark";

const router = Router();

async function getAdminSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(adminSettingsTable);
  const stored: Record<string, string> = {};
  for (const row of rows) stored[row.key] = row.value;
  return { ...DEFAULT_ADMIN_SETTINGS, ...stored };
}

router.get("/settings", async (_req, res) => {
  const settings = await getAdminSettings();

  const apiToken = process.env.ORAMAIL_API_TOKEN ?? "";
  const smtpUser = settings.smtp_user || apiToken;
  const tokenConfigured = smtpUser.length > 0;
  const tokenMasked = tokenConfigured ? smtpUser.slice(0, 8) + "••••••••••••••••••••••••" : null;

  res.json({
    smtp: {
      host: settings.smtp_host,
      port: parseInt(settings.smtp_port, 10),
      secure: settings.smtp_secure === "true",
      username: tokenConfigured ? tokenMasked : null,
      password: tokenConfigured ? tokenMasked : null,
      fromName: settings.smtp_from_name,
      fromEmail: settings.smtp_from_email,
      note: "Configure your SMTP provider credentials in the Server Settings section below.",
    },
    inbound: {
      webhookPath: "/api/inbound/webhook",
      note: "Configure this URL in OraMAIL → Inbound Stream → Webhook URL.",
    },
    server: {
      tokenConfigured,
      smtpHost: settings.smtp_host,
      smtpPort: parseInt(settings.smtp_port, 10),
      smtpSecure: settings.smtp_secure === "true",
      smtpFromName: settings.smtp_from_name,
      smtpFromEmail: settings.smtp_from_email,
    },
  });
});

router.post("/settings/test-smtp", async (_req, res) => {
  const result = await testSmtpConnection();
  res.json(result);
});

export default router;
