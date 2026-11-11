CREATE TABLE "api_impact_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"finding_id" uuid NOT NULL,
	"from_status" "impact_status",
	"to_status" "impact_status" NOT NULL,
	"changed_by" uuid,
	"note" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_impact_findings" ADD COLUMN "propagation_depth" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "api_impact_status_history" ADD CONSTRAINT "api_impact_status_history_finding_id_api_impact_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."api_impact_findings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_impact_status_history" ADD CONSTRAINT "api_impact_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_impact_history_finding_idx" ON "api_impact_status_history" USING btree ("finding_id");--> statement-breakpoint
CREATE INDEX "api_impact_history_occurred_idx" ON "api_impact_status_history" USING btree ("occurred_at");