CREATE TYPE "public"."activity_event_type" AS ENUM('api_registered', 'api_updated', 'version_created', 'version_published', 'version_deprecated', 'version_sunset', 'endpoint_added', 'dependency_added', 'dependency_removed');--> statement-breakpoint
CREATE TABLE "api_activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"api_id" uuid,
	"api_version_id" uuid,
	"dependency_id" uuid,
	"actor_user_id" uuid,
	"event_type" "activity_event_type" NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb,
	"seed_key" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_activity_events" ADD CONSTRAINT "api_activity_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_activity_events" ADD CONSTRAINT "api_activity_events_api_id_apis_id_fk" FOREIGN KEY ("api_id") REFERENCES "public"."apis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_activity_events" ADD CONSTRAINT "api_activity_events_api_version_id_api_versions_id_fk" FOREIGN KEY ("api_version_id") REFERENCES "public"."api_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_activity_events" ADD CONSTRAINT "api_activity_events_dependency_id_api_dependencies_id_fk" FOREIGN KEY ("dependency_id") REFERENCES "public"."api_dependencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_activity_events" ADD CONSTRAINT "api_activity_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_activity_seed_key_unique" ON "api_activity_events" USING btree ("seed_key");--> statement-breakpoint
CREATE INDEX "api_activity_project_occurred_idx" ON "api_activity_events" USING btree ("project_id","occurred_at");--> statement-breakpoint
CREATE INDEX "api_activity_api_idx" ON "api_activity_events" USING btree ("api_id");--> statement-breakpoint
CREATE INDEX "api_activity_version_idx" ON "api_activity_events" USING btree ("api_version_id");