FROM node:20-alpine AS base

# Install ffmpeg and other required tools
RUN apk add --no-cache \
    ffmpeg \
    imagemagick \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --only=production

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM base AS build
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Final stage ─────────────────────────────────────────────────────────────
FROM base AS final
COPY --from=build /app/dist ./dist

# Verify ffmpeg is available
RUN ffmpeg -version | head -1

EXPOSE 8080

# Cloud Run sends PORT env var
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
