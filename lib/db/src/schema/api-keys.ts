import { pgTable, serial, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const apiKeysTable = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  keyPrefix: varchar("key_prefix", { length: 12 }).notNull(),
  keyHash: varchar("key_hash", { length: 64 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
