FROM node:22-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/next.config.ts apps/web/postcss.config.mjs ./apps/web/
COPY packages/contracts/package.json packages/contracts/tsconfig.json ./packages/contracts/
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
RUN pnpm install --frozen-lockfile
COPY apps/web ./apps/web
COPY packages/contracts ./packages/contracts
COPY packages/shared ./packages/shared
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @versionflow/contracts build && pnpm --filter @versionflow/shared build && pnpm --filter @versionflow/web build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /workspace
RUN groupadd --system versionflow && useradd --system --gid versionflow versionflow
COPY --from=build --chown=versionflow:versionflow /workspace/node_modules ./node_modules
COPY --from=build --chown=versionflow:versionflow /workspace/apps/web/package.json ./apps/web/package.json
COPY --from=build --chown=versionflow:versionflow /workspace/apps/web/.next ./apps/web/.next
COPY --from=build --chown=versionflow:versionflow /workspace/apps/web/next.config.ts ./apps/web/next.config.ts
COPY --from=build --chown=versionflow:versionflow /workspace/packages/contracts ./packages/contracts
COPY --from=build --chown=versionflow:versionflow /workspace/packages/shared ./packages/shared
USER versionflow
EXPOSE 3000
CMD ["pnpm", "--dir", "apps/web", "start"]
