import { sql } from "drizzle-orm";
import { pgTable, serial, timestamp, varchar, text, jsonb, integer, index } from "drizzle-orm/pg-core";

// Keep system table (do not delete)
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// Conversations table
export const conversations = pgTable(
  "conversations",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 255 }).notNull().default("New Chat"),
    model_id: varchar("model_id", { length: 100 }).notNull().default("doubao-seed-1-8-251228"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("conversations_created_at_idx").on(table.created_at),
    index("conversations_updated_at_idx").on(table.updated_at),
  ]
);

// Messages table
export const messages = pgTable(
  "messages",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    conversation_id: varchar("conversation_id", { length: 36 }).notNull().references(() => conversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(),
    content: text("content").notNull(),
    model_id: varchar("model_id", { length: 100 }),
    token_count: integer("token_count"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("messages_conversation_id_idx").on(table.conversation_id),
    index("messages_created_at_idx").on(table.created_at),
  ]
);

// Model configurations table
export const model_configs = pgTable(
  "model_configs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    model_id: varchar("model_id", { length: 100 }).notNull().unique(),
    display_name: varchar("display_name", { length: 100 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull(),
    description: text("description"),
    is_enabled: integer("is_enabled").notNull().default(1),
    default_temperature: varchar("default_temperature", { length: 10 }).default("0.7"),
    default_max_tokens: integer("default_max_tokens").default(4096),
    sort_order: integer("sort_order").default(0),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("model_configs_provider_idx").on(table.provider),
    index("model_configs_sort_order_idx").on(table.sort_order),
  ]
);

// API Keys table
export const api_keys = pgTable(
  "api_keys",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    provider: varchar("provider", { length: 50 }).notNull().unique(),
    provider_name: varchar("provider_name", { length: 100 }).notNull(),
    api_key_encrypted: text("api_key_encrypted").notNull(),
    base_url: text("base_url"),
    is_active: integer("is_active").notNull().default(1),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("api_keys_provider_idx").on(table.provider),
  ]
);
