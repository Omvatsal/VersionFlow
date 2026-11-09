# Architecture

VersionFlow is a pnpm workspace with recursive pnpm scripts. It is a modular monolith with three independently executable applications:

- `apps/web`: Next.js App Router frontend.
- `apps/api`: NestJS HTTP API, currently exposing health endpoints under `/api/v1`.
- `apps/worker`: BullMQ worker consuming Redis-backed jobs.

Shared packages provide contracts, Pino logging/environment helpers, and Drizzle/PostgreSQL access. PostgreSQL and Redis run through Docker Compose. No microservices, Kafka, GraphQL, or frontend API routes are part of this foundation.
