CREATE TYPE "public"."github_account_type" AS ENUM('user', 'organization');--> statement-breakpoint
CREATE TYPE "public"."github_installation_state" AS ENUM('active', 'suspended', 'revoked');--> statement-breakpoint
CREATE TABLE "github_installations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_installation_id" integer NOT NULL,
	"github_account_id" integer NOT NULL,
	"github_account_login" text NOT NULL,
	"account_type" "github_account_type" NOT NULL,
	"state" "github_installation_state" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_repository_id" integer NOT NULL,
	"full_name" text NOT NULL,
	"owner_login" text NOT NULL,
	"repository_url" text NOT NULL,
	"default_branch" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"last_synchronized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_github_repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"installation_id" uuid NOT NULL,
	"default_branch" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"selected_specification_paths" text[] DEFAULT '{}' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_github_repositories" ADD CONSTRAINT "project_github_repositories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_github_repositories" ADD CONSTRAINT "project_github_repositories_repository_id_github_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."github_repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_github_repositories" ADD CONSTRAINT "project_github_repositories_installation_id_github_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."github_installations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_github_repositories" ADD CONSTRAINT "project_github_repositories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_installation_id_unique" ON "github_installations" USING btree ("github_installation_id");--> statement-breakpoint
CREATE INDEX "github_installation_account_idx" ON "github_installations" USING btree ("github_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "github_repository_id_unique" ON "github_repositories" USING btree ("github_repository_id");--> statement-breakpoint
CREATE INDEX "github_repository_full_name_idx" ON "github_repositories" USING btree ("full_name");--> statement-breakpoint
CREATE UNIQUE INDEX "project_github_repository_unique" ON "project_github_repositories" USING btree ("project_id","repository_id");--> statement-breakpoint
CREATE INDEX "project_github_project_idx" ON "project_github_repositories" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_github_installation_idx" ON "project_github_repositories" USING btree ("installation_id");