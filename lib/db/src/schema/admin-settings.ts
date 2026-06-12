import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const adminSettingsTable = pgTable("admin_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const DEFAULT_ADMIN_SETTINGS: Record<string, string> = {
  rate_limit_per_minute: "100",
  max_recipients_per_email: "50",
  webhook_max_retries: "3",
  webhook_timeout_seconds: "30",
  bounce_auto_suppress_threshold: "5",
  inbound_enabled: "true",
  sending_enabled: "true",
  track_opens: "true",
  track_links: "true",
};
