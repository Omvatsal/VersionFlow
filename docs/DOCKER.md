# Docker development

VersionFlow uses production images for the Next.js web app, NestJS API, and BullMQ worker. PostgreSQL and Redis run as local Compose services. Render configuration is unchanged.

## Setup

```powershell
Copy-Item .env.docker.example .env.docker
```

Keep browser-facing `NEXT_PUBLIC_API_URL` set to `http://localhost:4000/api/v1`; Docker service names are not usable by the browser.

## Start local PostgreSQL, Redis, API, worker, and web

```powershell
docker compose --env-file .env.docker --profile local up --build
```

Web is at `http://localhost:3000`, API at `http://localhost:4000/api/v1`, PostgreSQL at `localhost:5432`, and Redis at `localhost:6379`.

Run migrations once after PostgreSQL is healthy:

```powershell
docker compose --profile local run --rm api sh -lc "pnpm --filter @versionflow/database db:migrate"
```

Compose does not run migrations automatically from application containers.

## Supabase PostgreSQL with local Redis

Set `DOCKER_DATABASE_URL` in `.env.docker` to the Supabase connection string and keep `DOCKER_REDIS_URL=redis://redis:6379`, then run:

```powershell
docker compose --env-file .env.docker up --build
```

The PostgreSQL service is profile-gated and will not start. Run the migration command only when intentionally targeting that database:

```powershell
docker compose --env-file .env.docker run --rm api sh -lc "pnpm --filter @versionflow/database db:migrate"
```

## Useful commands

```powershell
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f web
docker compose build api
docker compose down
```

Named volumes are preserved by `docker compose down`; do not use `down -v` unless local data should be removed.

## Troubleshooting

- Copy `.env.docker.example` to `.env.docker` if Compose reports a missing environment file.
- Verify `DATABASE_URL` and `REDIS_URL` when API readiness fails.
- Use `localhost` in browser API URLs, not `api`.
- Change host-side port mappings if ports 3000, 4000, 5432, or 6379 are occupied.
- The worker is a separate process and must share the API Redis instance.
