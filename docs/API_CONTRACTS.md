# API Contracts

Shared response types live in `packages/contracts` and are consumed by both NestJS and the web client.

Implemented endpoints:

- `GET /api/v1/health`
- `GET /api/v1/health/liveness`
- `GET /api/v1/health/readiness`

Responses use an `ApiResponse<T>` envelope. Product endpoints and authentication contracts do not exist yet.

Authentication and access-controlled endpoints now include:

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- `GET/POST /api/v1/organizations`, `GET /api/v1/organizations/:organizationId`
- `GET /api/v1/projects/:projectId`, `POST /api/v1/projects/organization/:organizationId`, `POST /api/v1/projects/:projectId/collaborators`
- Project-scoped API, version, and endpoint registration under `/api/v1/projects/:projectId/apis`
- `POST /api/v1/projects/:projectId/apis/imports/preview` validates and normalizes OpenAPI 3.0/3.1, Swagger 2.0, and WSDL 1.1/2.0 content without fetching external references.
- `POST /api/v1/projects/:projectId/apis/imports/register` transactionally registers selected preview operations as an immutable API version and endpoints; duplicate API versions are rejected.
- `GET /api/v1/projects/:projectId/apis/:apiId/versions/:versionId/endpoints` lists version-specific endpoint metadata.
- `GET /api/v1/projects/:projectId/apis/:apiId/versions/:versionId/contract` returns the authorized immutable contract snapshot, original document metadata, normalized contract, and version endpoints.
- `GET /api/v1/projects/:projectId/dependencies`, `POST /api/v1/projects/:projectId/dependencies`, and `DELETE /api/v1/projects/:projectId/dependencies/:dependencyId` manage authorized project-scoped dependencies.

Protected endpoints require `Authorization: Bearer <access-token>`. Refresh tokens are sent in `X-Refresh-Token` and are persisted/revocable sessions.

Google OAuth routes:

- `GET /api/v1/auth/google` starts the Authorization Code + OpenID Connect flow.
- `GET /api/v1/auth/google/callback` validates the state cookie, exchanges the one-time code, validates issuer/audience/signature/expiry and verified email, then redirects to `FRONTEND_URL/dashboard`.

The callback sets HTTP-only VersionFlow access and refresh cookies. It does not expose Google tokens or authorization codes to the frontend.
### Project analytics

- `GET /api/v1/projects/:projectId/analytics/overview`
- `GET /api/v1/projects/:projectId/analytics/apis`
- `GET /api/v1/projects/:projectId/analytics/versions`
- `GET /api/v1/projects/:projectId/analytics/dependencies`
- `GET /api/v1/projects/:projectId/analytics/impact`

All analytics routes require the existing access token and project collaborator authorization. Impact analysis currently returns an explicit unavailable response because version comparison is not implemented yet.
## API version timeline

The project workspace timeline uses the existing protected endpoint:

- `GET /api/v1/projects/:projectId/analytics/versions`

The response contains each version, its owning API, and the endpoint count. The backend applies project authorization before returning records. The frontend groups records by API when `All APIs` is selected and filters lifecycle/date values locally without creating or mutating records.

## Dependency graph

- `GET /api/v1/projects/:projectId/dependencies/graph`

Returns every eligible project API exactly once in `nodes`, every valid dependency relationship in `edges`, and calculated `summary` degree/isolated-node statistics. The route authorizes the project before querying, resolves version-targeted dependencies to API nodes, excludes invalid cross-project targets, and preserves distinct dependency IDs as distinct edges.

## Change impact analytics

- `GET /api/v1/projects/:projectId/changes/analytics` returns persisted changes, enriched impact findings, project APIs, dependency evidence, severity counts, daily detection totals, API risk concentration, category/severity totals, propagation depth, dependency matrix cells, and recorded status history.
- `POST /api/v1/projects/:projectId/changes/compare` compares two persisted versions of the same authorized API and stores idempotent change records.
- `POST /api/v1/projects/:projectId/changes/:changeId/analyze` traverses valid project dependencies and stores direct and transitive potential findings.
- `GET /api/v1/projects/:projectId/changes` and `GET /api/v1/projects/:projectId/changes/impacts` list the persisted records.

Unique impacted API totals use distinct dependent API IDs. Direct and transitive API totals are independently deduplicated. Affected endpoints count distinct persisted endpoint IDs. Depth exposes both distinct APIs and finding paths. Transitive reachability is potential impact with insufficient evidence unless a direct relationship contains endpoint evidence.
## Project administration

All routes below require the existing authenticated project access guard. `viewer` can read; only a project `admin` can change settings or membership. The backend verifies that added collaborators belong to the project's organization.

- `GET /projects/:projectId/settings` returns the project, organization summary, caller role, and `canManage` flag.
- `PATCH /projects/:projectId/settings` accepts `{ name, description?, slug? }`. Only project admins may update these safe identity fields; slugs are validated and unique within the organization.
- `GET /projects/:projectId/members` returns real project collaborators and caller permissions.
- `GET /projects/:projectId/members/eligible` returns organization members not yet assigned to the project. Admin-only.
- `POST /projects/:projectId/collaborators` accepts `{ userId, role }` where role is `admin`, `editor`, or `viewer`. The user must already belong to the project organization.
- `PATCH /projects/:projectId/members/:userId` accepts `{ role }`. Admin-only; the last project admin cannot be demoted.
- `DELETE /projects/:projectId/members/:userId` removes the project collaborator only. It does not remove organization membership, and the last project admin cannot be removed.

Project deletion, archival, invitations, GitHub connections, and project-level API configuration are intentionally not exposed because the current schema does not provide safe lifecycle or invitation models for them.
