FROM node:22-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/tsconfig.json apps/api/nest-cli.json ./apps/api/
COPY packages/contracts/package.json packages/contracts/tsconfig.json ./packages/contracts/
COPY packages/database/package.json packages/database/tsconfig.json ./packages/database/
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
RUN pnpm install --frozen-lockfile
COPY apps/api ./apps/api
COPY packages/contracts ./packages/contracts
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
RUN pnpm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /workspace
RUN groupadd --system versionflow && useradd --system --gid versionflow versionflow
COPY --from=build --chown=versionflow:versionflow /workspace/node_modules ./node_modules
COPY --from=build --chown=versionflow:versionflow /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=versionflow:versionflow /workspace/apps/api/dist ./apps/api/dist
COPY --from=build --chown=versionflow:versionflow /workspace/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build --chown=versionflow:versionflow /workspace/packages/contracts/dist ./packages/contracts/dist
COPY --from=build --chown=versionflow:versionflow /workspace/packages/database/package.json ./packages/database/package.json
COPY --from=build --chown=versionflow:versionflow /workspace/packages/database/dist ./packages/database/dist
COPY --from=build --chown=versionflow:versionflow /workspace/packages/database/drizzle ./packages/database/drizzle
COPY --from=build --chown=versionflow:versionflow /workspace/packages/shared/package.json ./packages/shared/package.json
COPY --from=build --chown=versionflow:versionflow /workspace/packages/shared/dist ./packages/shared/dist
USER versionflow
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
