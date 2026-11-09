# API Contracts

Shared response types live in `packages/contracts` and are consumed by both NestJS and the web client.

Implemented endpoints:

- `GET /api/v1/health`
- `GET /api/v1/health/liveness`
- `GET /api/v1/health/readiness`

Responses use an `ApiResponse<T>` envelope. Product endpoints and authentication contracts do not exist yet.
