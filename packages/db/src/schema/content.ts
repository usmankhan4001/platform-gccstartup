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
import { timestampColumns } from "./_shared";
import { users } from "./auth";

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "published",
  "scheduled",
]);

export const entityTypeEnum = pgEnum("entity_type", ["page", "post"]);

export const pages = pgTable(
  "pages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).unique().notNull(),
    blocks: jsonb("blocks").$type<unknown[]>().default([]),
    status: contentStatusEnum("status").default("draft").notNull(),
    publish_at: timestamp("publish_at", { withTimezone: true }),
    unpublish_at: timestamp("unpublish_at", { withTimezone: true }),
    seo_title: varchar("seo_title", { length: 200 }),
    seo_description: text("seo_description"),
    seo_og_image: text("seo_og_image"),
    seo_no_index: boolean("seo_no_index").default(false).notNull(),
    seo_keywords: text("seo_keywords"),
    aeo_answer: text("aeo_answer"),
    author: varchar("author", { length: 200 }),
    created_by: varchar("created_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    updated_by: varchar("updated_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestampColumns(),
  },
  (table) => [
    index("pages_slug_idx").on(table.slug),
    index("pages_status_idx").on(table.status),
  ]
);

export const posts = pgTable(
  "posts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).unique().notNull(),
    excerpt: text("excerpt"),
    cover_image: text("cover_image"),
    published_at: timestamp("published_at", { withTimezone: true }),
    category: varchar("category", { length: 100 }),
    tags: jsonb("tags").$type<string[]>().default([]),
    reading_time: integer("reading_time"),
    blocks: jsonb("blocks").$type<unknown[]>().default([]),
    status: contentStatusEnum("status").default("draft").notNull(),
    publish_at: timestamp("publish_at", { withTimezone: true }),
    unpublish_at: timestamp("unpublish_at", { withTimezone: true }),
    seo_title: varchar("seo_title", { length: 200 }),
    seo_description: text("seo_description"),
    seo_og_image: text("seo_og_image"),
    seo_no_index: boolean("seo_no_index").default(false).notNull(),
    seo_keywords: text("seo_keywords"),
    aeo_answer: text("aeo_answer"),
    author: varchar("author", { length: 200 }),
    created_by: varchar("created_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    updated_by: varchar("updated_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestampColumns(),
  },
  (table) => [
    index("posts_slug_idx").on(table.slug),
    index("posts_status_idx").on(table.status),
    index("posts_category_idx").on(table.category),
    index("posts_tags_idx").using("gin", table.tags),
  ]
);

export const revisions = pgTable(
  "revisions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    entity_type: entityTypeEnum("entity_type").notNull(),
    entity_id: varchar("entity_id", { length: 36 }).notNull(),
    data: jsonb("data").$type<unknown>().notNull(),
    author_id: varchar("author_id", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    author_name: varchar("author_name", { length: 200 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("revisions_entity_type_entity_id_idx").on(
      table.entity_type,
      table.entity_id
    ),
  ]
);
