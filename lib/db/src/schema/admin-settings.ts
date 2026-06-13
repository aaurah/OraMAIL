import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const adminSettingsTable = pgTable("admin_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const DEFAULT_ADMIN_SETTINGS: Record<string, string> = {
  // Sending controls
  sending_enabled: "true",
  track_opens: "true",
  track_links: "true",
  // Rate limits
  rate_limit_per_minute: "100",
  max_recipients_per_email: "50",
  // Bounce handling
  bounce_auto_suppress_threshold: "5",
  // Inbound
  inbound_enabled: "true",
  // Webhook retry
  webhook_max_retries: "3",
  webhook_timeout_seconds: "30",
  // SMTP configuration (provider-agnostic)
  smtp_host: "smtp.postmarkapp.com",
  smtp_port: "587",
  smtp_secure: "false",
  smtp_user: "",
  smtp_pass: "",
  smtp_from_name: "OraMAIL",
  smtp_from_email: "",
};
