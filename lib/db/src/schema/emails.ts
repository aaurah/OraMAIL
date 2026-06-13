import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const emailStatusEnum = pgEnum("email_status", [
  "queued", "sent", "failed", "bounced", "opened", "clicked", "spam", "unsubscribed"
]);

export const emailsTable = pgTable("emails", {
  id: serial("id").primaryKey(),
  from: text("from").notNull(),
  fromName: text("from_name"),
  to: text("to").notNull(),
  cc: text("cc"),
  bcc: text("bcc"),
  replyTo: text("reply_to"),
  subject: text("subject").notNull(),
  htmlBody: text("html_body"),
  textBody: text("text_body"),
  status: emailStatusEnum("status").notNull().default("queued"),
  opens: integer("opens").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  messageId: text("message_id"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  templateId: integer("template_id"),
  tag: text("tag"),
  trackOpens: boolean("track_opens").notNull().default(true),
  trackLinks: boolean("track_links").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),
});

export const insertEmailSchema = createInsertSchema(emailsTable).omit({ id: true, createdAt: true });
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emailsTable.$inferSelect;
