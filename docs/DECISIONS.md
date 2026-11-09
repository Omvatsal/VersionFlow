# Decisions

- Use a modular monolith with independently executable web, API, and worker applications.
- Use pnpm workspaces and recursive pnpm scripts for repository orchestration.
- Keep API contracts in a shared package so the frontend and backend compile against the same types.
- Use PostgreSQL with Drizzle ORM and Redis with BullMQ.
- Keep Phase 0 schema-free apart from `system_meta`; do not speculate about product tables.
- Keep authentication and API registry functionality out of Phase 0.
