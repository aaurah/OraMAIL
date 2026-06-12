import { pgTable, serial, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const domainStatusEnum = pgEnum("domain_status", ["unverified", "pending", "verified", "failed"]);

export const domainsTable = pgTable("domains", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull().unique(),
  status: domainStatusEnum("status").notNull().default("unverified"),
  spfVerified: boolean("spf_verified").notNull().default(false),
  dkimVerified: boolean("dkim_verified").notNull().default(false),
  dmarcRecord: text("dmarc_record"),
  returnPath: text("return_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDomainSchema = createInsertSchema(domainsTable).omit({ id: true, createdAt: true, status: true, spfVerified: true, dkimVerified: true });
export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Domain = typeof domainsTable.$inferSelect;
