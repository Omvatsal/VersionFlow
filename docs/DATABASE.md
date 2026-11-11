# Database

PostgreSQL 16 is the development database and is provisioned by `docker-compose.yml`. Drizzle ORM uses the `postgres` driver and reads `DATABASE_URL`.

The schema now includes users and persisted sessions, organizations and memberships, projects and collaborators, and the API registry hierarchy (`apis`, immutable `api_versions`, `api_endpoints`, and `api_dependencies`). APIs retain base URL, protocol, documentation URL and tags; versions retain source specification version and lifecycle timestamps; endpoints retain operation metadata, parameters, schemas, security and expected status codes. `specification_imports` stores project-scoped checksummed import previews and registration status. Dependencies retain direction, relationship, evidence, review status and optional endpoint references. Every record has `created_at` and `updated_at`; versions also support published, deprecated, sunset, and dependency-change timestamps. Foreign keys cascade within an organization/project boundary and indexes cover membership, ownership, version, endpoint, import and dependency lookups.

`oauth_accounts` stores only the provider (`google`), Google subject identifier, verified provider email, owning VersionFlow user, and timestamps. Google access and refresh tokens are not stored. `(provider, provider_account_id)` is unique, and one Google identity cannot map to multiple users.

The same `oauth_accounts` table now supports `github` identities. GitHub account ID, verified email, username, profile URL, and avatar URL are stored; GitHub OAuth access tokens are not stored. Migration `0007_keen_orphan.sql` adds the provider enum value and nullable profile metadata columns.

GitHub App integration uses `github_installations`, `github_repositories`, and `project_github_repositories` from migration `0008_rich_strong_guy.sql`. Installation access tokens are generated temporarily from the App private key and are not persisted. A project connection is unique per `(project_id, repository_id)` and is only created after project-admin authorization.

Run migrations with `pnpm --filter @versionflow/database db:migrate`; generate migrations with `pnpm --filter @versionflow/database db:generate`.

Milestone migration: `packages/database/drizzle/0002_spotty_sentry.sql`.
### Analytics events

`api_activity_events` records project-scoped API lifecycle and dependency activity with an event type, actor, related records, occurrence time, metadata, and optional deterministic seed key. It supports historical dashboard timelines without inferring history from mutable current-state tables. Migration: `drizzle/0003_smooth_morph.sql`.
### Acme Commerce Platform demo dataset

Run `pnpm --filter @versionflow/database db:seed:account-demo` after the demo account exists. The idempotent seed creates or reuses the `Acme Technologies` organization and `Acme Commerce Platform` project, then creates 14 APIs, 35 versions, 105 endpoints, 35 directed dependencies, and 175 activity events. It represents customer breaking-change, payment migration, and inventory reservation migration scenarios. It never deletes or overwrites existing rows.
## Contract snapshots

`api_contract_snapshots` stores one immutable contract record per API version. It retains the original filename, format, source specification version, SHA-256 checksum, original document, and lossless normalized JSONB contract. The version foreign key is unique, so a new version receives a separate snapshot and cannot overwrite an older version. Migration: `drizzle/0004_odd_chat.sql`. Legacy versions without a snapshot are served from their existing version specification and endpoint rows until re-imported or edited.

## API version timeline

No schema migration was required for the timeline. It reads existing `apis`, `api_versions`, and `api_endpoints` records. Lifecycle timestamps (`published_at`, `deprecated_at`, and `sunset_at`) and specification format are displayed from `api_versions`; endpoint totals are counted from `api_endpoints`. Existing activity/event records remain available for future richer change-event presentation.
## Dependency graph

The graph uses existing `apis`, `api_versions`, `api_endpoints`, and `api_dependencies` records; no migration was required. The backend performs batched project-scoped queries for APIs, version endpoint counts, and dependencies, then resolves target API IDs in memory so isolated APIs remain nodes and multiple dependency records remain separate edges.

The account demo seed also persists three request-schema version changes and eleven dependency impact findings for customer, payment, and inventory migration scenarios. It remains idempotent and never deletes existing rows.

## Change and impact intelligence

`api_changes` stores idempotent version-pair contract differences with classification, severity, evidence, review state, and exact contract path. `api_impact_findings` stores direct or transitive dependency findings, propagation depth, confidence, severity, endpoint evidence, and lifecycle state. `api_impact_status_history` stores real finding transitions; the initial open event is written when analysis creates a finding, and missing historical transitions are never inferred. Migrations: `drizzle/0005_sad_sentinel.sql` and `drizzle/0006_futuristic_thunderball.sql`.
## Project administration data

Project access uses the existing normalized identity tables. `projects.organization_id` scopes every project to one organization. `project_collaborators` maps users to projects with the `admin`, `editor`, or `viewer` role and has a unique `(project_id, user_id)` constraint. `organization_memberships` is checked before a collaborator is added, so a project cannot grant access outside its organization. No database migration was required for project settings or members/access; the existing `projects.updated_at` and collaborator timestamps are updated by the new APIs.
