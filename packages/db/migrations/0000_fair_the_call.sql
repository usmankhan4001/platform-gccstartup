CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'completed', 'cancelled', 'paused');--> statement-breakpoint
CREATE TYPE "public"."flow_status" AS ENUM('draft', 'active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."log_status" AS ENUM('pending', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."step_type" AS ENUM('send_email', 'send_whatsapp', 'wait', 'condition', 'update_contact', 'update_deal', 'notify_team', 'add_tag', 'remove_tag', 'enroll_flow', 'create_task');--> statement-breakpoint
CREATE TYPE "public"."trigger_type" AS ENUM('manual', 'lead_created', 'form_submitted', 'tag_added', 'deal_stage_changed', 'date_based', 'event_based');--> statement-breakpoint
CREATE TYPE "public"."consent_status" AS ENUM('unknown', 'granted', 'denied');--> statement-breakpoint
CREATE TYPE "public"."lifecycle_stage" AS ENUM('lead', 'subscriber', 'prospect', 'client', 'churned');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'published', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('page', 'post');--> statement-breakpoint
CREATE TYPE "public"."activity_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('call', 'meeting');--> statement-breakpoint
CREATE TYPE "public"."deal_status" AS ENUM('open', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."stage_kind" AS ENUM('open', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'normal', 'high');--> statement-breakpoint
CREATE TYPE "public"."bounce_type" AS ENUM('hard', 'soft');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'paused', 'sent', 'cancelled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."email_category" AS ENUM('marketing', 'transactional', 'flow', 'notification');--> statement-breakpoint
CREATE TYPE "public"."send_status" AS ENUM('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed');--> statement-breakpoint
CREATE TYPE "public"."suppression_reason" AS ENUM('hard_bounce', 'complaint', 'manual', 'invalid');--> statement-breakpoint
CREATE TYPE "public"."sink_status" AS ENUM('pending', 'delivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."channel" AS ENUM('whatsapp', 'web_chat', 'email', 'ticket');--> statement-breakpoint
CREATE TYPE "public"."conversation_state" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."message_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('queued', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."template_category" AS ENUM('marketing', 'utility', 'authentication');--> statement-breakpoint
CREATE TYPE "public"."template_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."author_type" AS ENUM('customer', 'staff', 'system');--> statement-breakpoint
CREATE TYPE "public"."ticket_channel" AS ENUM('portal', 'email', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'pending', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"password" text,
	"access_token" text,
	"refresh_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"password_hash" text,
	"role_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flow_enrollments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"flow_id" varchar(36) NOT NULL,
	"contact_id" varchar(36) NOT NULL,
	"enrollment_key" varchar(200) NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"next_run_at" timestamp with time zone,
	"variables" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flow_logs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"enrollment_id" varchar(36) NOT NULL,
	"step_index" integer NOT NULL,
	"status" "log_status" DEFAULT 'pending' NOT NULL,
	"result" jsonb DEFAULT '{}'::jsonb,
	"error" text,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flow_steps" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"flow_id" varchar(36) NOT NULL,
	"step_index" integer NOT NULL,
	"step_type" "step_type" NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flows" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"status" "flow_status" DEFAULT 'draft' NOT NULL,
	"trigger_type" "trigger_type" NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb,
	"nodes" jsonb DEFAULT '[]'::jsonb,
	"edges" jsonb DEFAULT '[]'::jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"display_name" varchar(200),
	"company" varchar(200),
	"job_title" varchar(200),
	"lifecycle_stage" "lifecycle_stage" DEFAULT 'lead' NOT NULL,
	"owner_id" varchar(36),
	"source" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"email_consent" "consent_status" DEFAULT 'unknown' NOT NULL,
	"email_consent_at" timestamp with time zone,
	"whatsapp_consent" "consent_status" DEFAULT 'unknown' NOT NULL,
	"whatsapp_consent_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"publish_at" timestamp with time zone,
	"unpublish_at" timestamp with time zone,
	"seo_title" varchar(200),
	"seo_description" text,
	"seo_og_image" text,
	"seo_no_index" boolean DEFAULT false NOT NULL,
	"seo_keywords" text,
	"aeo_answer" text,
	"author" varchar(200),
	"created_by" varchar(36),
	"updated_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"excerpt" text,
	"cover_image" text,
	"published_at" timestamp with time zone,
	"category" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"reading_time" integer,
	"blocks" jsonb DEFAULT '[]'::jsonb,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"publish_at" timestamp with time zone,
	"unpublish_at" timestamp with time zone,
	"seo_title" varchar(200),
	"seo_description" text,
	"seo_og_image" text,
	"seo_no_index" boolean DEFAULT false NOT NULL,
	"seo_keywords" text,
	"aeo_answer" text,
	"author" varchar(200),
	"created_by" varchar(36),
	"updated_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "revisions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" varchar(36) NOT NULL,
	"data" jsonb NOT NULL,
	"author_id" varchar(36),
	"author_name" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_activities" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"contact_id" varchar(36) NOT NULL,
	"deal_id" varchar(36),
	"type" "activity_type" NOT NULL,
	"direction" "activity_direction" NOT NULL,
	"subject" varchar(200),
	"notes" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer,
	"logged_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_notes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"contact_id" varchar(36) NOT NULL,
	"deal_id" varchar(36),
	"body" text NOT NULL,
	"author_id" varchar(36),
	"author_name" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_tasks" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"details" text,
	"assignee_id" varchar(36),
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"completed_by" varchar(36),
	"priority" "task_priority" DEFAULT 'normal' NOT NULL,
	"contact_id" varchar(36),
	"deal_id" varchar(36),
	"created_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"contact_id" varchar(36) NOT NULL,
	"pipeline_id" varchar(36) NOT NULL,
	"stage_id" varchar(36) NOT NULL,
	"value" bigint,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"probability" integer DEFAULT 0 NOT NULL,
	"owner_id" varchar(36),
	"expected_close_date" date,
	"status" "deal_status" DEFAULT 'open' NOT NULL,
	"closed_at" timestamp with time zone,
	"close_reason" text,
	"created_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"pipeline_id" varchar(36) NOT NULL,
	"name" varchar(200) NOT NULL,
	"position" integer NOT NULL,
	"kind" "stage_kind" DEFAULT 'open' NOT NULL,
	"probability" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipelines" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"default_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"template_id" varchar(36) NOT NULL,
	"audience_filter" jsonb,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"recipient_count" integer,
	"variant_b_subject" varchar(500),
	"variant_b_template_id" varchar(36),
	"test_split_percent" integer,
	"winner_criteria" varchar(50),
	"winner_variant" varchar(1),
	"error" text,
	"created_by" varchar(36),
	"updated_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_sends" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"message_ref" varchar(100) NOT NULL,
	"contact_id" varchar(36),
	"campaign_id" varchar(36) NOT NULL,
	"template_id" varchar(36),
	"to_email" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"status" "send_status" DEFAULT 'queued' NOT NULL,
	"provider" varchar(50),
	"provider_message_id" varchar(255),
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"first_opened_at" timestamp with time zone,
	"first_clicked_at" timestamp with time zone,
	"open_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"bounced_at" timestamp with time zone,
	"bounce_type" "bounce_type",
	"complained_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_sends_message_ref_unique" UNIQUE("message_ref")
);
--> statement-breakpoint
CREATE TABLE "email_suppressions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"reason" "suppression_reason" NOT NULL,
	"source" varchar(100),
	"detail" text,
	"contact_id" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_suppressions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"subject" varchar(500) NOT NULL,
	"html_body" text NOT NULL,
	"text_body" text,
	"blocks" jsonb DEFAULT '[]'::jsonb,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"category" "email_category" DEFAULT 'marketing' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(36),
	"updated_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "event_sinks" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"event_id" varchar(36) NOT NULL,
	"sink_name" varchar(100) NOT NULL,
	"status" "sink_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"source" varchar(100),
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" varchar(36) NOT NULL,
	"permission_id" varchar(36) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"r2_key" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"alt_text" text,
	"folder_id" varchar(36),
	"uploaded_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_folders" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"parent_id" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"source" varchar(500) NOT NULL,
	"destination" varchar(500) NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redirects_source_unique" UNIQUE("source")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"site_name" varchar(200),
	"site_tagline" varchar(300),
	"site_url" varchar(500),
	"default_og_image" text,
	"logo_url" text,
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"social_facebook" varchar(500),
	"social_instagram" varchar(500),
	"social_linkedin" varchar(500),
	"social_x" varchar(500),
	"google_site_verification" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"contact_id" varchar(36) NOT NULL,
	"channel" "channel" NOT NULL,
	"last_inbound_at" timestamp with time zone,
	"last_outbound_at" timestamp with time zone,
	"last_message_at" timestamp with time zone,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"state" "conversation_state" DEFAULT 'open' NOT NULL,
	"closed_at" timestamp with time zone,
	"assigned_to" varchar(36),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"body" text NOT NULL,
	"header" text,
	"footer" text,
	"placeholder_count" integer DEFAULT 0 NOT NULL,
	"category" "template_category" DEFAULT 'utility' NOT NULL,
	"status" "template_status" DEFAULT 'draft' NOT NULL,
	"provider_template_id" varchar(255),
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"created_by" varchar(36),
	"updated_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"conversation_id" varchar(36) NOT NULL,
	"direction" "message_direction" NOT NULL,
	"body" text NOT NULL,
	"media_url" text,
	"message_ref" varchar(100) NOT NULL,
	"provider_message_id" varchar(255),
	"status" "message_status" DEFAULT 'queued' NOT NULL,
	"failure_reason" text,
	"template_id" varchar(36),
	"occurred_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_message_ref_unique" UNIQUE("message_ref")
);
--> statement-breakpoint
CREATE TABLE "canned_responses" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"shortcut" varchar(50),
	"content" text NOT NULL,
	"category" varchar(100),
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ticket_id" varchar(36) NOT NULL,
	"author_type" "author_type" NOT NULL,
	"author_id" varchar(36),
	"author_name" varchar(200),
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ticket_number" varchar(50) NOT NULL,
	"contact_id" varchar(36) NOT NULL,
	"subject" varchar(300) NOT NULL,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"priority" "ticket_priority" DEFAULT 'normal' NOT NULL,
	"channel" "ticket_channel" DEFAULT 'portal' NOT NULL,
	"assigned_to" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"key_prefix" varchar(10) NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"rate_limit" integer DEFAULT 1000 NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "outbox_jobs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"job_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"next_run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error" text,
	"idempotency_key" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_jobs_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"webhook_id" varchar(36) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"response_status" integer,
	"response_body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"url" varchar(500) NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb,
	"secret" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_enrollments" ADD CONSTRAINT "flow_enrollments_flow_id_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_enrollments" ADD CONSTRAINT "flow_enrollments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_logs" ADD CONSTRAINT "flow_logs_enrollment_id_flow_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."flow_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_steps" ADD CONSTRAINT "flow_steps_flow_id_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_suppressions" ADD CONSTRAINT "email_suppressions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sinks" ADD CONSTRAINT "event_sinks_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_media_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."media_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "flow_enrollments_flow_id_idx" ON "flow_enrollments" USING btree ("flow_id");--> statement-breakpoint
CREATE INDEX "flow_enrollments_contact_id_idx" ON "flow_enrollments" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "flow_enrollments_status_idx" ON "flow_enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "flow_enrollments_next_run_at_idx" ON "flow_enrollments" USING btree ("next_run_at");--> statement-breakpoint
CREATE UNIQUE INDEX "flow_enrollments_enrollment_key_idx" ON "flow_enrollments" USING btree ("enrollment_key");--> statement-breakpoint
CREATE INDEX "flow_logs_enrollment_id_idx" ON "flow_logs" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "flow_logs_status_idx" ON "flow_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "flow_steps_flow_id_idx" ON "flow_steps" USING btree ("flow_id");--> statement-breakpoint
CREATE INDEX "flow_steps_flow_id_step_index_idx" ON "flow_steps" USING btree ("flow_id","step_index");--> statement-breakpoint
CREATE INDEX "flows_status_idx" ON "flows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "flows_trigger_type_idx" ON "flows" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "contacts_owner_id_idx" ON "contacts" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "contacts_lifecycle_stage_idx" ON "contacts" USING btree ("lifecycle_stage");--> statement-breakpoint
CREATE INDEX "contacts_deleted_at_idx" ON "contacts" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "contacts_tags_idx" ON "contacts" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "pages_status_idx" ON "pages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "posts_category_idx" ON "posts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "posts_tags_idx" ON "posts" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "revisions_entity_type_entity_id_idx" ON "revisions" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "crm_activities_contact_id_idx" ON "crm_activities" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "crm_activities_deal_id_idx" ON "crm_activities" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "crm_activities_occurred_at_idx" ON "crm_activities" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "crm_notes_contact_id_idx" ON "crm_notes" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "crm_notes_deal_id_idx" ON "crm_notes" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "crm_tasks_contact_id_idx" ON "crm_tasks" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "crm_tasks_deal_id_idx" ON "crm_tasks" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "crm_tasks_assignee_id_idx" ON "crm_tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "crm_tasks_due_at_idx" ON "crm_tasks" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "deals_contact_id_idx" ON "deals" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "deals_pipeline_id_idx" ON "deals" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "deals_stage_id_idx" ON "deals" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "deals_owner_id_idx" ON "deals" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "deals_status_idx" ON "deals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pipeline_stages_pipeline_id_idx" ON "pipeline_stages" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "pipelines_created_by_idx" ON "pipelines" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "email_campaigns_template_id_idx" ON "email_campaigns" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_campaigns_scheduled_at_idx" ON "email_campaigns" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "email_sends_contact_id_idx" ON "email_sends" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "email_sends_campaign_id_idx" ON "email_sends" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "email_sends_status_idx" ON "email_sends" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_sends_to_email_idx" ON "email_sends" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX "email_sends_sent_at_idx" ON "email_sends" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "email_suppressions_email_idx" ON "email_suppressions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "email_suppressions_reason_idx" ON "email_suppressions" USING btree ("reason");--> statement-breakpoint
CREATE INDEX "email_templates_name_idx" ON "email_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "email_templates_category_idx" ON "email_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "event_sinks_event_id_idx" ON "event_sinks" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_sinks_sink_name_idx" ON "event_sinks" USING btree ("sink_name");--> statement-breakpoint
CREATE INDEX "event_sinks_status_idx" ON "event_sinks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_event_type_idx" ON "events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "events_source_idx" ON "events" USING btree ("source");--> statement-breakpoint
CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "permissions_name_idx" ON "permissions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "roles_name_idx" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "media_folder_id_idx" ON "media" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "media_r2_key_idx" ON "media" USING btree ("r2_key");--> statement-breakpoint
CREATE INDEX "media_mime_type_idx" ON "media" USING btree ("mime_type");--> statement-breakpoint
CREATE INDEX "media_folders_parent_id_idx" ON "media_folders" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "redirects_source_idx" ON "redirects" USING btree ("source");--> statement-breakpoint
CREATE INDEX "redirects_enabled_idx" ON "redirects" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "conversations_contact_id_idx" ON "conversations" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "conversations_channel_idx" ON "conversations" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "conversations_state_idx" ON "conversations" USING btree ("state");--> statement-breakpoint
CREATE INDEX "conversations_assigned_to_idx" ON "conversations" USING btree ("assigned_to");--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_contact_channel_idx" ON "conversations" USING btree ("contact_id","channel");--> statement-breakpoint
CREATE INDEX "message_templates_name_idx" ON "message_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "message_templates_language_idx" ON "message_templates" USING btree ("language");--> statement-breakpoint
CREATE UNIQUE INDEX "message_templates_name_language_idx" ON "message_templates" USING btree ("name","language");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_direction_idx" ON "messages" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "messages_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_occurred_at_idx" ON "messages" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "canned_responses_shortcut_idx" ON "canned_responses" USING btree ("shortcut");--> statement-breakpoint
CREATE INDEX "canned_responses_category_idx" ON "canned_responses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ticket_messages_ticket_id_idx" ON "ticket_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_messages_author_type_idx" ON "ticket_messages" USING btree ("author_type");--> statement-breakpoint
CREATE INDEX "tickets_contact_id_idx" ON "tickets" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tickets_priority_idx" ON "tickets" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "tickets_assigned_to_idx" ON "tickets" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "tickets_ticket_number_idx" ON "tickets" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_is_active_idx" ON "api_keys" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "outbox_jobs_status_idx" ON "outbox_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "outbox_jobs_job_type_idx" ON "outbox_jobs" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "outbox_jobs_next_run_at_idx" ON "outbox_jobs" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "outbox_jobs_priority_status_idx" ON "outbox_jobs" USING btree ("priority","status");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_webhook_id_idx" ON "webhook_deliveries" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_event_type_idx" ON "webhook_deliveries" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "webhooks_is_active_idx" ON "webhooks" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "webhooks_events_idx" ON "webhooks" USING gin ("events");