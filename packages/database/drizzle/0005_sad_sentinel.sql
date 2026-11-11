CREATE TYPE "public"."change_classification" AS ENUM('breaking', 'non_breaking', 'potentially_breaking', 'informational');--> statement-breakpoint
CREATE TYPE "public"."change_severity" AS ENUM('critical', 'high', 'medium', 'low', 'informational');--> statement-breakpoint
CREATE TYPE "public"."change_review_status" AS ENUM('unreviewed', 'reviewed', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."impact_type" AS ENUM('direct', 'transitive', 'no_demonstrated_impact');--> statement-breakpoint
CREATE TYPE "public"."impact_confidence" AS ENUM('confirmed_evidence', 'strong_evidence', 'partial_evidence', 'insufficient_evidence');--> statement-breakpoint
CREATE TYPE "public"."impact_status" AS ENUM('open', 'under_review', 'acknowledged', 'resolved', 'accepted_risk');--> statement-breakpoint
CREATE TABLE "api_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"api_id" uuid NOT NULL,
	"source_version_id" uuid NOT NULL,
	"target_version_id" uuid NOT NULL,
	"endpoint_id" uuid,
	"category" text NOT NULL,
	"change_type" text NOT NULL,
	"contract_path" text NOT NULL,
	"previous_value" jsonb,
	"new_value" jsonb,
	"classification" "change_classification" NOT NULL,
	"severity" "change_severity" NOT NULL,
	"explanation" text NOT NULL,
	"review_status" "change_review_status" DEFAULT 'unreviewed' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_impact_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"change_id" uuid NOT NULL,
	"dependency_id" uuid,
	"changed_api_id" uuid NOT NULL,
	"dependent_api_id" uuid NOT NULL,
	"dependent_version_id" uuid,
	"impact" "impact_type" NOT NULL,
	"severity" "change_severity" NOT NULL,
	"confidence" "impact_confidence" NOT NULL,
	"status" "impact_status" DEFAULT 'open' NOT NULL,
	"affected_endpoint_id" uuid,
	"evidence" text NOT NULL,
	"explanation" text NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_changes" ADD CONSTRAINT "api_changes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_changes" ADD CONSTRAINT "api_changes_api_id_apis_id_fk" FOREIGN KEY ("api_id") REFERENCES "public"."apis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_changes" ADD CONSTRAINT "api_changes_source_version_id_api_versions_id_fk" FOREIGN KEY ("source_version_id") REFERENCES "public"."api_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_changes" ADD CONSTRAINT "api_changes_target_version_id_api_versions_id_fk" FOREIGN KEY ("target_version_id") REFERENCES "public"."api_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_changes" ADD CONSTRAINT "api_changes_endpoint_id_api_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."api_endpoints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_changes" ADD CONSTRAINT "api_changes_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_impact_findings" ADD CONSTRAINT "api_impact_findings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_impact_findings" ADD CONSTRAINT "api_impact_findings_change_id_api_changes_id_fk" FOREIGN KEY ("change_id") REFERENCES "public"."api_changes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_impact_findings" ADD CONSTRAINT "api_impact_findings_dependency_id_api_dependencies_id_fk" FOREIGN KEY ("dependency_id") REFERENCES "public"."api_dependencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_impact_findings" ADD CONSTRAINT "api_impact_findings_changed_api_id_apis_id_fk" FOREIGN KEY ("changed_api_id") REFERENCES "public"."apis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_impact_findings" ADD CONSTRAINT "api_impact_findings_dependent_api_id_apis_id_fk" FOREIGN KEY ("dependent_api_id") REFERENCES "public"."apis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_impact_findings" ADD CONSTRAINT "api_impact_findings_dependent_version_id_api_versions_id_fk" FOREIGN KEY ("dependent_version_id") REFERENCES "public"."api_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_impact_findings" ADD CONSTRAINT "api_impact_findings_affected_endpoint_id_api_endpoints_id_fk" FOREIGN KEY ("affected_endpoint_id") REFERENCES "public"."api_endpoints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_changes_comparison_path_unique" ON "api_changes" USING btree ("source_version_id","target_version_id","contract_path","change_type");--> statement-breakpoint
CREATE INDEX "api_changes_project_idx" ON "api_changes" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "api_changes_api_idx" ON "api_changes" USING btree ("api_id");--> statement-breakpoint
CREATE INDEX "api_changes_classification_idx" ON "api_changes" USING btree ("classification");--> statement-breakpoint
CREATE UNIQUE INDEX "api_impact_change_dependency_unique" ON "api_impact_findings" USING btree ("change_id","dependency_id");--> statement-breakpoint
CREATE INDEX "api_impact_project_idx" ON "api_impact_findings" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "api_impact_dependent_api_idx" ON "api_impact_findings" USING btree ("dependent_api_id");--> statement-breakpoint
CREATE INDEX "api_impact_status_idx" ON "api_impact_findings" USING btree ("status");