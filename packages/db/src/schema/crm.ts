import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { contacts } from "./contacts";

export const dealStatusEnum = pgEnum("deal_status", ["open", "won", "lost"]);
export const stageKindEnum = pgEnum("stage_kind", ["open", "won", "lost"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "normal", "high"]);
export const activityTypeEnum = pgEnum("activity_type", ["call", "meeting"]);
export const activityDirectionEnum = pgEnum("activity_direction", ["inbound", "outbound"]);

export const pipelines = pgTable(
  "pipelines",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    default_currency: varchar("default_currency", { length: 3 }).default("USD").notNull(),
    is_default: boolean("is_default").default(false).notNull(),
    archived_at: timestamp("archived_at", { withTimezone: true }),
    created_by: varchar("created_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("pipelines_created_by_idx").on(table.created_by)]
);

export const pipeline_stages = pgTable(
  "pipeline_stages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    pipeline_id: varchar("pipeline_id", { length: 36 })
      .notNull()
      .references(() => pipelines.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    position: integer("position").notNull(),
    kind: stageKindEnum("kind").default("open").notNull(),
    probability: integer("probability").default(0).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("pipeline_stages_pipeline_id_idx").on(table.pipeline_id)]
);

export const deals = pgTable(
  "deals",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    contact_id: varchar("contact_id", { length: 36 })
      .notNull()
      .references(() => contacts.id, { onDelete: "restrict" }),
    pipeline_id: varchar("pipeline_id", { length: 36 })
      .notNull()
      .references(() => pipelines.id, { onDelete: "restrict" }),
    stage_id: varchar("stage_id", { length: 36 })
      .notNull()
      .references(() => pipeline_stages.id, { onDelete: "restrict" }),
    value: bigint("value", { mode: "number" }),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    probability: integer("probability").default(0).notNull(),
    owner_id: varchar("owner_id", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    expected_close_date: date("expected_close_date"),
    status: dealStatusEnum("status").default("open").notNull(),
    closed_at: timestamp("closed_at", { withTimezone: true }),
    close_reason: text("close_reason"),
    created_by: varchar("created_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("deals_contact_id_idx").on(table.contact_id),
    index("deals_pipeline_id_idx").on(table.pipeline_id),
    index("deals_stage_id_idx").on(table.stage_id),
    index("deals_owner_id_idx").on(table.owner_id),
    index("deals_status_idx").on(table.status),
  ]
);

export const crm_notes = pgTable(
  "crm_notes",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    contact_id: varchar("contact_id", { length: 36 })
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    deal_id: varchar("deal_id", { length: 36 }).references(() => deals.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    author_id: varchar("author_id", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    author_name: varchar("author_name", { length: 200 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("crm_notes_contact_id_idx").on(table.contact_id),
    index("crm_notes_deal_id_idx").on(table.deal_id),
  ]
);

export const crm_tasks = pgTable(
  "crm_tasks",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    details: text("details"),
    assignee_id: varchar("assignee_id", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    due_at: timestamp("due_at", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    completed_by: varchar("completed_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    priority: taskPriorityEnum("priority").default("normal").notNull(),
    contact_id: varchar("contact_id", { length: 36 }).references(() => contacts.id, {
      onDelete: "set null",
    }),
    deal_id: varchar("deal_id", { length: 36 }).references(() => deals.id, {
      onDelete: "set null",
    }),
    created_by: varchar("created_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("crm_tasks_contact_id_idx").on(table.contact_id),
    index("crm_tasks_deal_id_idx").on(table.deal_id),
    index("crm_tasks_assignee_id_idx").on(table.assignee_id),
    index("crm_tasks_due_at_idx").on(table.due_at),
  ]
);

export const crm_activities = pgTable(
  "crm_activities",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    contact_id: varchar("contact_id", { length: 36 })
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    deal_id: varchar("deal_id", { length: 36 }).references(() => deals.id, {
      onDelete: "set null",
    }),
    type: activityTypeEnum("type").notNull(),
    direction: activityDirectionEnum("direction").notNull(),
    subject: varchar("subject", { length: 200 }),
    notes: text("notes"),
    occurred_at: timestamp("occurred_at", { withTimezone: true }).notNull(),
    duration_minutes: integer("duration_minutes"),
    logged_by: varchar("logged_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("crm_activities_contact_id_idx").on(table.contact_id),
    index("crm_activities_deal_id_idx").on(table.deal_id),
    index("crm_activities_occurred_at_idx").on(table.occurred_at),
  ]
);
