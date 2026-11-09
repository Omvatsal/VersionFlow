# Database

PostgreSQL 16 is the development database and is provisioned by `docker-compose.yml`. Drizzle ORM uses the `postgres` driver and reads `DATABASE_URL`.

The only Phase 0 table is `system_meta`, a minimal key/value table used for system metadata and migration validation. No product-domain tables have been introduced.

Run migrations with `pnpm --filter @versionflow/database db:migrate`; generate migrations with `pnpm --filter @versionflow/database db:generate`.
