import {
  boolean,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const api_keys = pgTable(
  "api_keys",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    key_hash: varchar("key_hash", { length: 255 }).unique().notNull(),
    key_prefix: varchar("key_prefix", { length: 10 }).notNull(),
    permissions: jsonb("permissions").$type<string[]>().default([]),
    rate_limit: integer("rate_limit").default(1000).notNull(),
    last_used_at: timestamp("last_used_at", { withTimezone: true }),
    expires_at: timestamp("expires_at", { withTimezone: true }),
    is_active: boolean("is_active").default(true).notNull(),
    created_by: varchar("created_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("api_keys_key_hash_idx").on(table.key_hash),
    index("api_keys_is_active_idx").on(table.is_active),
  ]
);

export const webhooks = pgTable(
  "webhooks",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    url: varchar("url", { length: 500 }).notNull(),
    events: jsonb("events").$type<string[]>().default([]),
    secret: varchar("secret", { length: 255 }),
    is_active: boolean("is_active").default(true).notNull(),
    last_triggered_at: timestamp("last_triggered_at", { withTimezone: true }),
    failure_count: integer("failure_count").default(0).notNull(),
    created_by: varchar("created_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("webhooks_is_active_idx").on(table.is_active),
    index("webhooks_events_idx").using("gin", table.events),
  ]
);

export const webhook_deliveries = pgTable(
  "webhook_deliveries",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    webhook_id: varchar("webhook_id", { length: 36 })
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    event_type: varchar("event_type", { length: 100 }).notNull(),
    payload: jsonb("payload").$type<unknown>().notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    last_error: text("last_error"),
    response_status: integer("response_status"),
    response_body: text("response_body"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    delivered_at: timestamp("delivered_at", { withTimezone: true }),
  },
  (table) => [
    index("webhook_deliveries_webhook_id_idx").on(table.webhook_id),
    index("webhook_deliveries_status_idx").on(table.status),
    index("webhook_deliveries_event_type_idx").on(table.event_type),
  ]
);

export const outbox_jobs = pgTable(
  "outbox_jobs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    job_type: varchar("job_type", { length: 100 }).notNull(),
    payload: jsonb("payload").$type<unknown>().notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    priority: integer("priority").default(0).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    max_attempts: integer("max_attempts").default(5).notNull(),
    next_run_at: timestamp("next_run_at", { withTimezone: true }).defaultNow().notNull(),
    last_error: text("last_error"),
    idempotency_key: varchar("idempotency_key", { length: 255 }).unique(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    started_at: timestamp("started_at", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("outbox_jobs_status_idx").on(table.status),
    index("outbox_jobs_job_type_idx").on(table.job_type),
    index("outbox_jobs_next_run_at_idx").on(table.next_run_at),
    index("outbox_jobs_priority_status_idx").on(table.priority, table.status),
  ]
);
