# Implementation Map

## Google OAuth

- `apps/api/src/auth/auth.service.ts`: Google OAuth URL generation, authorization-code exchange, ID-token validation, linked-account lookup, first-time transactional user/organization creation, and VersionFlow token issuance.
- `apps/api/src/auth/auth.controller.ts`: `GET /auth/google` initiation, CSRF state cookie, callback validation, secure VersionFlow auth cookies, logout cookie revocation, and frontend redirect.
- `apps/api/src/auth/auth.guard.ts`: accepts the existing bearer access token and the OAuth callback access-token cookie.
- `apps/api/src/auth/auth.module.ts`: registers the existing auth service/guard/controller.
- `apps/api/src/config/env.ts`: centralized Google OAuth and frontend URL validation with root-workspace `.env` discovery.
- `apps/api/package.json`: pins `google-auth-library` and its type package.

## Frontend integration

- `apps/web/components/auth-form.tsx`: Continue with Google action on login and registration screens.
- `apps/web/lib/api-client.ts`: sends credentials and existing bearer tokens to the backend.
- `apps/web/components/dashboard-shell.tsx`: authenticated application shell, top-level organization selector, organization switching, organization creation, and logout.
- `apps/web/components/workspace-dashboard.tsx`: organization-scoped project listing, search-ready project surface, project creation, loading/error/empty states, and backend-backed organization selection.
- `apps/web/components/project-workspace-shell.tsx`: persistent project-level navigation, breadcrumb, project feature groups, responsive mobile disclosure, and active route state.
- `apps/web/components/project-workspace-layout.tsx`: loads the authorized project name and keeps the project workspace shell mounted across child routes.
- `apps/web/components/project-dashboard.tsx`: backend-backed project summary, API registry, version counts, collaborators count, and API registration.
- `apps/web/components/version-timeline.tsx`: project-scoped API selector, lifecycle/date filters, grouped all-API history, and interactive vertical version cards backed by the analytics versions endpoint.
- `apps/web/components/contract-viewer.tsx`: version-scoped contract drawer showing endpoint details, schemas, security, checksum, and original source.
- `apps/web/components/dependency-graph.tsx`: project-scoped SVG dependency graph with directed multi-edges, lifecycle/relationship filters, focus mode, layout controls, node/edge detail panels, and graph analytics.
- `apps/api/src/organizations/organizations.controller.ts`: authorized organization details with backend-computed project API, version, and dependency counts.
- `apps/web/app/dashboard/projects/[projectId]/layout.tsx`: nested project workspace layout.
- `apps/web/app/dashboard/projects/[projectId]/page.tsx`: default Project Dashboard destination.
- `apps/web/app/dashboard/projects/[projectId]/[...section]/page.tsx`: project-level destinations; implemented API registry route and honest placeholders for unfinished features.
- `apps/web/app/globals.css`: preserved VersionFlow tokens and dashboard styling, with organization selector and persistent project workspace styles.

## Navigation structure

- `/dashboard`: organization-scoped project listing; selected organization is stored locally and restored only if it remains in the backend organization list.
- `/dashboard/projects/[projectId]`: Project Dashboard inside the persistent project workspace.
- `/dashboard/projects/[projectId]/apis`: existing API registry workflow inside the same project workspace.
- `/dashboard/projects/[projectId]/versions`: API Version timeline with searchable API selection and grouped history.
- `/dashboard/projects/[projectId]/dependencies/graph`: interactive project dependency graph.
- `/dashboard/projects/[projectId]/apis/import`, `/manual`, `/versions`, `/dependencies`, `/analysis`, `/integrations`, `/settings`, and `/members`: routed project destinations with honest not-yet-implemented states where backend/UI functionality is not available.
- Organization or project switching clears stale project navigation by returning to `/dashboard` when the organization changes.

### Project administration

- `apps/api/src/projects/projects.controller.ts`: project settings retrieval/update, collaborator listing, eligible organization members, collaborator role changes, and removal with project-admin authorization and last-admin protection.
- `apps/web/lib/api-client.ts`: typed project settings and collaborator client methods.
- `apps/web/components/project-settings.tsx`: backend-backed general settings, read-only ownership context, honest integration status, and safe danger-zone messaging.
- `apps/web/components/project-members.tsx`: searchable collaborator list, member detail panel, organization-member add flow, role changes, and confirmed removal.
- `apps/web/app/project-admin.css`: responsive settings and members presentation styles.
- `apps/web/app/dashboard/projects/[projectId]/[...section]/page.tsx`: routes `settings` and `members` to the implemented project administration pages.

## Database

- `packages/database/src/schema/identity.ts`: `oauth_accounts` table and provider uniqueness constraints.
- `packages/database/drizzle/`: generated migration for the OAuth provider enum and identity table.
- `packages/database/src/migrate.ts`: loads root or package-local environment files before opening PostgreSQL.

## Specification import and dependency management

- `packages/database/src/schema/registry.ts`: import records, API metadata, endpoint metadata, dependency review/provenance fields, and indexes.
- `packages/database/drizzle/0002_spotty_sentry.sql`: migration for specification imports and registry/dependency metadata.
- `apps/api/src/registry/specification.service.ts`: safe format detection and normalization for OpenAPI 3, Swagger 2, and WSDL 1.1/2.0; rejects unsupported XML, limits input size, and reports external references without fetching them.
- `apps/api/src/registry/registry.controller.ts`: protected manual API/version/endpoint routes plus import preview and transactional selected-operation registration.
- `apps/api/src/registry/registry.module.ts`: provides the specification parser.
- `apps/api/src/dependencies/dependencies.controller.ts`: protected dependency list/create/delete routes with project, version, endpoint and self-dependency validation.
- `apps/api/src/dependencies/dependencies.module.ts`: dependency module registration.
- `apps/api/src/registry/specification.service.spec.ts`: parser coverage for OpenAPI JSON/YAML, Swagger JSON, WSDL XML and invalid documents.
- `apps/web/components/specification-import.tsx`: file upload, preview, operation selection, validation feedback and selected-operation registration.
- `apps/web/components/dependency-registry.tsx`: project-scoped dependency listing, creation and removal.
- `apps/web/app/dashboard/projects/[projectId]/[...section]/page.tsx`: wires import and dependency destinations into the persistent project workspace.
### Analytics milestone

- `apps/api/src/analytics/analytics.module.ts`: Nest module.
- `apps/api/src/analytics/analytics.controller.ts`: authorized project analytics routes.
- `apps/api/src/analytics/analytics.service.ts`: database-backed metrics, lifecycle distribution, growth, activity, and honest impact availability.
- `apps/web/components/charts.tsx`: reusable CSS/SVG-free chart primitives.
- `apps/web/components/project-analytics.tsx`: project overview dashboard.
- `packages/database/src/schema/registry.ts`: activity event schema.
- `packages/database/src/seed.ts`: opt-in, idempotent Acme fixture seed (`SEED_DEMO=true`).
### Rich demo seed

- `packages/database/src/seed-account-demo.ts`: idempotent Acme Commerce Platform ecosystem seed with real API/version/endpoint/dependency/activity/change/impact records and post-seed validation report.

### Change intelligence foundation

- `packages/database/src/schema/registry.ts`: `api_changes` and `api_impact_findings` tables, lifecycle enums, idempotency indexes, and project/API/version/dependency foreign keys.
- `packages/database/drizzle/0005_sad_sentinel.sql`: migration for change records and impact findings.
- `apps/api/src/changes/changes.service.ts`: authorized persisted-contract comparison, idempotent change persistence, and dependency-evidence impact analysis.
- `apps/api/src/changes/changes.controller.ts`: `GET /projects/:projectId/changes`, `POST /projects/:projectId/changes/compare`, `GET /projects/:projectId/changes/impacts`, and `POST /projects/:projectId/changes/:changeId/analyze`.
- `apps/api/src/changes/changes.module.ts`: registers the change intelligence module.
- `apps/api/src/analytics/analytics.service.ts`: exposes persisted change and impact summaries through the existing project analytics route.
- `packages/database/drizzle/0006_futuristic_thunderball.sql`: propagation depth and impact status-history audit records.
- `apps/api/src/changes/changes.service.ts`: bulk project analytics and cycle-safe downstream traversal using shortest recorded propagation depth.
- `apps/web/components/change-intelligence.tsx`: shared API, severity, impact-type, and date filters plus the four-section visual intelligence workspace.
- `apps/web/components/impact-visualizations.tsx`: propagation graph, severity doughnut, time trend, direct/transitive chart, bubble chart, treemap, category/severity chart, depth chart, risk matrix, and resolution timeline.
- `apps/web/components/breaking-dependencies.tsx`: separate breaking-dependency review queue with evidence, confidence, lifecycle filters, finding details, and focused propagation graph.
- `apps/web/app/impact-intelligence.css`: responsive chart styling mapped to the existing VersionFlow design tokens.
