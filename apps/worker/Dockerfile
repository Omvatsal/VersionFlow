FROM node:22-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/worker/package.json apps/worker/tsconfig.json ./apps/worker/
COPY packages/contracts/package.json packages/contracts/tsconfig.json ./packages/contracts/
COPY packages/database/package.json packages/database/tsconfig.json ./packages/database/
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
RUN pnpm install --frozen-lockfile
COPY apps/worker ./apps/worker
COPY packages/contracts ./packages/contracts
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
RUN pnpm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /workspace
RUN groupadd --system versionflow && useradd --system --gid versionflow versionflow
COPY --from=build --chown=versionflow:versionflow /workspace/node_modules ./node_modules
COPY --from=build --chown=versionflow:versionflow /workspace/apps/worker/package.json ./apps/worker/package.json
COPY --from=build --chown=versionflow:versionflow /workspace/apps/worker/dist ./apps/worker/dist
COPY --from=build --chown=versionflow:versionflow /workspace/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build --chown=versionflow:versionflow /workspace/packages/contracts/dist ./packages/contracts/dist
COPY --from=build --chown=versionflow:versionflow /workspace/packages/database/package.json ./packages/database/package.json
COPY --from=build --chown=versionflow:versionflow /workspace/packages/database/dist ./packages/database/dist
COPY --from=build --chown=versionflow:versionflow /workspace/packages/shared/package.json ./packages/shared/package.json
COPY --from=build --chown=versionflow:versionflow /workspace/packages/shared/dist ./packages/shared/dist
USER versionflow
CMD ["node", "apps/worker/dist/index.js"]
