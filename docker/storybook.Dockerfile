# ── Stage 1: Build ──
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# Copy everything
COPY . .

# Install and build
RUN pnpm install --frozen-lockfile
RUN cd packages/hcm-ui && pnpm build-storybook

# ── Stage 2: Serve ──
FROM nginx:alpine

COPY --from=builder /app/packages/hcm-ui/storybook-static /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

