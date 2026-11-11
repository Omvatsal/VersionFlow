# VersionFlow UX Contract

## Authenticated navigation

- Successful password or Google authentication enters `/dashboard`.
- `/dashboard` is the organization and project home. It loads only organizations available to the authenticated user.
- Selecting an organization persists the selection locally and loads that organization's members and projects.
- Opening a project navigates to `/dashboard/projects/:projectId`, where project metadata and its API registry are loaded from the protected backend.
- Expired or invalid authentication returns the user to `/auth/login` without displaying workspace data.

## Create flows

- Creating an organization refreshes the organization list and selects the new organization.
- Creating a project refreshes the selected organization's project list.
- Registering an API refreshes the open project's registry.
- Forms retain entered values on server failure, prevent duplicate submission, and show an inline actionable error.

## Async states

- Initial organization and project loads have stable loading states.
- Empty organizations, projects, and registries explain the next available action.
- Request failures remain inline on the affected page and preserve navigation.

## Canonical ownership

- Visual tokens and shared product styling: `DESIGN.md` and `apps/web/app/globals.css`.
- API response normalization and typed frontend access: `apps/web/lib/api-client.ts`.
- Authenticated shell and route protection: `apps/web/components/dashboard-shell.tsx` backed by server authorization.
- Organization/project workflow: `apps/web/components/workspace-dashboard.tsx`.
- Project registry workflow: `apps/web/components/project-dashboard.tsx`.
