# Tapestry Studio: Vite-built React app served by a small Express server with sign-in.
# Build stage
FROM node:24-bookworm AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Run stage (Node 24 for node:sqlite, used by the login module)
FROM node:24-bookworm
LABEL org.opencontainers.image.title="Tapestry Studio" \
      org.opencontainers.image.description="AI-powered knowledge graph editor and problem-solving studio"
ENV NODE_ENV=production \
    PORT=8205 \
    DATA_DIR=/data
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY server/ server/

EXPOSE 8205
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=4s --start-period=8s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8205)+'/readyz').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

# The version built (git describe, passed by scripts/compose.sh), for the
# health endpoints. Last, so a new version only rebuilds this layer.
ARG APP_VERSION=
ENV APP_VERSION=$APP_VERSION

CMD ["node", "server/index.js"]
