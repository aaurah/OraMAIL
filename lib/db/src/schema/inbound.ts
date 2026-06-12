import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inboundEmailsTable = pgTable("inbound_emails", {
  id: serial("id").primaryKey(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  htmlBody: text("html_body"),
  textBody: text("text_body"),
  headers: text("headers"),
  attachments: integer("attachments").notNull().default(0),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
});

export const insertInboundEmailSchema = createInsertSchema(inboundEmailsTable).omit({ id: true });
export type InsertInboundEmail = z.infer<typeof insertInboundEmailSchema>;
export type InboundEmail = typeof inboundEmailsTable.$inferSelect;
