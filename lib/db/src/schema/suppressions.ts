import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const suppressionReasonEnum = pgEnum("suppression_reason", ["bounce", "spam", "unsubscribe", "manual"]);

export const suppressionsTable = pgTable("suppressions", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  reason: suppressionReasonEnum("reason").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSuppressionSchema = createInsertSchema(suppressionsTable).omit({ id: true, createdAt: true });
export type InsertSuppression = z.infer<typeof insertSuppressionSchema>;
export type Suppression = typeof suppressionsTable.$inferSelect;
