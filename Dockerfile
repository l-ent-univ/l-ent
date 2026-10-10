# l'ent production image: every university frontend (dist/<id>/) plus the
# Express server, run in multi-tenant mode. See docs/SELF_HOSTING.md.

# --- Build: install everything, build one frontend per university ---
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG TENANTS
RUN npm run build:all

# --- Runtime: production dependencies, sources and built frontends ---
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    MULTI_TENANT=1 \
    PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
# The server imports a few modules from src/ (demo account), so the sources
# stay; only the built frontends come from the build stage.
COPY . .
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/robots.txt" || exit 1
CMD ["node", "server.js"]
