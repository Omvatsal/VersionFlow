ALTER TYPE "public"."auth_provider" ADD VALUE 'github';--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD COLUMN "provider_username" text;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD COLUMN "profile_url" text;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD COLUMN "avatar_url" text;