import nodemailer from "nodemailer";
import { db } from "@workspace/db";
import { adminSettingsTable, DEFAULT_ADMIN_SETTINGS } from "@workspace/db";

async function getSmtpSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(adminSettingsTable);
  const stored: Record<string, string> = {};
  for (const row of rows) stored[row.key] = row.value;
  return { ...DEFAULT_ADMIN_SETTINGS, ...stored };
}

function buildTransport(settings: Record<string, string>) {
  const user = settings.smtp_user || process.env.ORAMAIL_API_TOKEN || "";
  const pass = settings.smtp_pass || process.env.ORAMAIL_API_TOKEN || "";
  return nodemailer.createTransport({
    host: settings.smtp_host,
    port: parseInt(settings.smtp_port, 10),
    secure: settings.smtp_secure === "true",
    auth: user ? { user, pass } : undefined,
  });
}

export interface SendOptions {
  from: string;
  fromName?: string | null;
  to: string;
  cc?: string | null;
  bcc?: string | null;
  replyTo?: string | null;
  subject: string;
  html?: string | null;
  text?: string | null;
}

export async function sendEmailViaSMTP(opts: SendOptions): Promise<{ messageId: string }> {
  const settings = await getSmtpSettings();
  const transport = buildTransport(settings);

  const fromAddress = settings.smtp_from_email || opts.from;
  const fromName = opts.fromName || settings.smtp_from_name || "OraMAIL";

  const result = await transport.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: opts.to,
    cc: opts.cc || undefined,
    bcc: opts.bcc || undefined,
    replyTo: opts.replyTo || undefined,
    subject: opts.subject,
    html: opts.html || undefined,
    text: opts.text || undefined,
  });

  return { messageId: result.messageId };
}

export async function isEmailConfigured(): Promise<boolean> {
  const settings = await getSmtpSettings();
  const hasHost = !!settings.smtp_host;
  const hasUser = !!(settings.smtp_user || process.env.ORAMAIL_API_TOKEN);
  return hasHost && hasUser;
}

export async function testSmtpConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getSmtpSettings();
    const transport = buildTransport(settings);
    await transport.verify();
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
