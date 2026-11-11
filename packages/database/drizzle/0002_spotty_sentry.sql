CREATE TYPE "public"."specification_format" AS ENUM('openapi-json', 'openapi-yaml', 'swagger-json', 'swagger-yaml', 'wsdl-xml');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('preview', 'registered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."dependency_review_status" AS ENUM('pending', 'confirmed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."dependency_direction" AS ENUM('source-to-target');--> statement-breakpoint
CREATE TABLE "specification_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"original_filename" text NOT NULL,
	"format" "specification_format" NOT NULL,
	"source_specification_version" text,
	"checksum" text NOT NULL,
	"content" text,
	"status" "import_status" DEFAULT 'preview' NOT NULL,
	"validation_result" jsonb,
	"registered_api_id" uuid,
	"registered_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_dependencies" ADD COLUMN "source_endpoint_id" uuid;--> statement-breakpoint
ALTER TABLE "api_dependencies" ADD COLUMN "target_endpoint_id" uuid;--> statement-breakpoint
ALTER TABLE "api_dependencies" ADD COLUMN "direction" "dependency_direction" DEFAULT 'source-to-target' NOT NULL;--> statement-breakpoint
ALTER TABLE "api_dependencies" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "api_dependencies" ADD COLUMN "evidence" text;--> statement-breakpoint
ALTER TABLE "api_dependencies" ADD COLUMN "review_status" "dependency_review_status" DEFAULT 'confirmed' NOT NULL;--> statement-breakpoint
ALTER TABLE "api_endpoints" ADD COLUMN "operation_id" text;--> statement-breakpoint
ALTER TABLE "api_endpoints" ADD COLUMN "parameters" jsonb;--> statement-breakpoint
ALTER TABLE "api_endpoints" ADD COLUMN "request_schema" jsonb;--> statement-breakpoint
ALTER TABLE "api_endpoints" ADD COLUMN "response_schema" jsonb;--> statement-breakpoint
ALTER TABLE "api_endpoints" ADD COLUMN "security" jsonb;--> statement-breakpoint
ALTER TABLE "api_endpoints" ADD COLUMN "expected_status_codes" jsonb;--> statement-breakpoint
ALTER TABLE "api_versions" ADD COLUMN "source_specification_version" text;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "base_url" text;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "protocol" text;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "documentation_url" text;--> statement-breakpoint
ALTER TABLE "apis" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "specification_imports" ADD CONSTRAINT "specification_imports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specification_imports" ADD CONSTRAINT "specification_imports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specification_imports" ADD CONSTRAINT "specification_imports_registered_api_id_apis_id_fk" FOREIGN KEY ("registered_api_id") REFERENCES "public"."apis"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specification_imports" ADD CONSTRAINT "specification_imports_registered_version_id_api_versions_id_fk" FOREIGN KEY ("registered_version_id") REFERENCES "public"."api_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "specification_import_project_checksum_unique" ON "specification_imports" USING btree ("project_id","checksum");--> statement-breakpoint
CREATE INDEX "specification_import_project_idx" ON "specification_imports" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "specification_import_status_idx" ON "specification_imports" USING btree ("status");--> statement-breakpoint
ALTER TABLE "api_dependencies" ADD CONSTRAINT "api_dependencies_source_endpoint_id_api_endpoints_id_fk" FOREIGN KEY ("source_endpoint_id") REFERENCES "public"."api_endpoints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_dependencies" ADD CONSTRAINT "api_dependencies_target_endpoint_id_api_endpoints_id_fk" FOREIGN KEY ("target_endpoint_id") REFERENCES "public"."api_endpoints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_dependencies_dedupe_idx" ON "api_dependencies" USING btree ("source_api_version_id","target_api_version_id","target_api_id","relationship");