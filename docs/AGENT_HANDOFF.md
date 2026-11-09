# Agent Handoff

The repository contains the Phase 0 foundation. Start PostgreSQL and Redis with `docker compose up -d`, copy `.env.example` to `.env`, then run `pnpm install` and `pnpm run build`.

The API health endpoints are under `/api/v1/health`. The worker starts a BullMQ worker against Redis. The web app uses the typed client in `apps/web/lib/api-client.ts`.

Before declaring Phase 0 complete, add and run real Vitest coverage, add Playwright smoke tests, and complete lint configuration/verification. Do not add product tables or authentication without an explicit next-phase decision.
