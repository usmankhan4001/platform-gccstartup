import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { contacts } from "./contacts";
import { users } from "./auth";

export const emailCategoryEnum = pgEnum("email_category", [
  "marketing",
  "transactional",
  "flow",
  "notification",
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "sending",
  "paused",
  "sent",
  "cancelled",
  "failed",
]);

export const sendStatusEnum = pgEnum("send_status", [
  "queued",
  "sent",
  "delivered",
  "bounced",
  "complained",
  "failed",
]);

export const bounceTypeEnum = pgEnum("bounce_type", ["hard", "soft"]);

export const suppressionReasonEnum = pgEnum("suppression_reason", [
  "hard_bounce",
  "complaint",
  "manual",
  "invalid",
]);

export const email_templates = pgTable(
  "email_templates",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 200 }).unique().notNull(),
    description: text("description"),
    subject: varchar("subject", { length: 500 }).notNull(),
    html_body: text("html_body").notNull(),
    text_body: text("text_body"),
    blocks: jsonb("blocks").$type<unknown[]>().default([]),
    variables: jsonb("variables").$type<string[]>().default([]),
    category: emailCategoryEnum("category").default("marketing").notNull(),
    is_active: boolean("is_active").default(true).notNull(),
    created_by: varchar("created_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    updated_by: varchar("updated_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("email_templates_name_idx").on(table.name),
    index("email_templates_category_idx").on(table.category),
  ]
);

export const email_campaigns = pgTable(
  "email_campaigns",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    template_id: varchar("template_id", { length: 36 })
      .notNull()
      .references(() => email_templates.id, { onDelete: "restrict" }),
    audience_filter: jsonb("audience_filter").$type<unknown>(),
    status: campaignStatusEnum("status").default("draft").notNull(),
    scheduled_at: timestamp("scheduled_at", { withTimezone: true }),
    started_at: timestamp("started_at", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    recipient_count: integer("recipient_count"),
    variant_b_subject: varchar("variant_b_subject", { length: 500 }),
    variant_b_template_id: varchar("variant_b_template_id", { length: 36 }),
    test_split_percent: integer("test_split_percent"),
    winner_criteria: varchar("winner_criteria", { length: 50 }),
    winner_variant: varchar("winner_variant", { length: 1 }),
    error: text("error"),
    created_by: varchar("created_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    updated_by: varchar("updated_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("email_campaigns_template_id_idx").on(table.template_id),
    index("email_campaigns_status_idx").on(table.status),
    index("email_campaigns_scheduled_at_idx").on(table.scheduled_at),
  ]
);

export const email_sends = pgTable(
  "email_sends",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    message_ref: varchar("message_ref", { length: 100 }).unique().notNull(),
    contact_id: varchar("contact_id", { length: 36 }).references(() => contacts.id, {
      onDelete: "set null",
    }),
    campaign_id: varchar("campaign_id", { length: 36 })
      .notNull()
      .references(() => email_campaigns.id, { onDelete: "cascade" }),
    template_id: varchar("template_id", { length: 36 }).references(
      () => email_templates.id,
      { onDelete: "set null" }
    ),
    to_email: varchar("to_email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    status: sendStatusEnum("status").default("queued").notNull(),
    provider: varchar("provider", { length: 50 }),
    provider_message_id: varchar("provider_message_id", { length: 255 }),
    sent_at: timestamp("sent_at", { withTimezone: true }),
    delivered_at: timestamp("delivered_at", { withTimezone: true }),
    first_opened_at: timestamp("first_opened_at", { withTimezone: true }),
    first_clicked_at: timestamp("first_clicked_at", { withTimezone: true }),
    open_count: integer("open_count").default(0).notNull(),
    click_count: integer("click_count").default(0).notNull(),
    bounced_at: timestamp("bounced_at", { withTimezone: true }),
    bounce_type: bounceTypeEnum("bounce_type"),
    complained_at: timestamp("complained_at", { withTimezone: true }),
    unsubscribed_at: timestamp("unsubscribed_at", { withTimezone: true }),
    failure_reason: text("failure_reason"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("email_sends_contact_id_idx").on(table.contact_id),
    index("email_sends_campaign_id_idx").on(table.campaign_id),
    index("email_sends_status_idx").on(table.status),
    index("email_sends_to_email_idx").on(table.to_email),
    index("email_sends_sent_at_idx").on(table.sent_at),
  ]
);

export const email_suppressions = pgTable(
  "email_suppressions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    reason: suppressionReasonEnum("reason").notNull(),
    source: varchar("source", { length: 100 }),
    detail: text("detail"),
    contact_id: varchar("contact_id", { length: 36 }).references(() => contacts.id, {
      onDelete: "set null",
    }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("email_suppressions_email_idx").on(table.email),
    index("email_suppressions_reason_idx").on(table.reason),
  ]
);
