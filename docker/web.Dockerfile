# ── Stage 1: Build ──
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

ARG BACKEND_API_URL
ARG AUTH_SECRET
ARG SESSION_SECRET

ENV BACKEND_API_URL=$BACKEND_API_URL
ENV AUTH_SECRET=$AUTH_SECRET
ENV SESSION_SECRET=$SESSION_SECRET

RUN pnpm turbo build --filter=@nhcs/web

# ── Stage 2: Run ──
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]

