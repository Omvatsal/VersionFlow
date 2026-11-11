CREATE TABLE "api_contract_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_version_id" uuid NOT NULL,
	"original_filename" text,
	"specification_format" text NOT NULL,
	"source_specification_version" text,
	"checksum" text NOT NULL,
	"original_document" text,
	"normalized_contract" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_contract_snapshots" ADD CONSTRAINT "api_contract_snapshots_api_version_id_api_versions_id_fk" FOREIGN KEY ("api_version_id") REFERENCES "public"."api_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_contract_version_unique" ON "api_contract_snapshots" USING btree ("api_version_id");--> statement-breakpoint
CREATE INDEX "api_contract_checksum_idx" ON "api_contract_snapshots" USING btree ("checksum");