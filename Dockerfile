# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.19.5

# ---- deps: install full dependency tree (needed for build) ----
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: generate prisma client and compile TypeScript ----
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummy value: prisma.config.ts requires DATABASE_URL to be set at import time,
# but `prisma generate` never connects to a database, only reads schema.prisma.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build_only"
RUN npm run prisma:generate
RUN npm run build

# ---- prod-deps: production dependencies only (includes the prisma CLI,
# needed at container startup to run `prisma migrate deploy`) ----
FROM node:${NODE_VERSION}-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runner: minimal runtime image ----
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json prisma.config.ts docker-entrypoint.sh ./

RUN mkdir -p /app/logs \
  && chown -R nodejs:nodejs /app/logs \
  && chmod +x /app/docker-entrypoint.sh

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health-check', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
