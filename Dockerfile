# syntax=docker/dockerfile:1

# Image unique pour tout le service l'ent : frontend(s) Vite buildé(s) +
# serveur Express (auth CAS, proxy ENT, API). Fonctionne en mono-université
# (par défaut) comme en multi-tenant (MULTI_TENANT=1), tous les bundles
# étant présents dans l'image.
ARG NODE_VERSION=22

# --- Dépendances complètes (dev incluses, nécessaires au build Vite) --------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build des frontends ----------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# UNIVERSITY : université servie par défaut (et bundle de dist/).
# TENANTS    : universités buildées dans dist/<id>/ (toutes les non-example
#              si vide).
# BUILD_HASH : identifiant de build affiché dans l'app (SHA du commit en CI).
ARG UNIVERSITY=univ-rennes
ARG TENANTS=""
ARG BUILD_HASH=docker
ENV UNIVERSITY=${UNIVERSITY} \
    TENANTS=${TENANTS} \
    BUILD_HASH=${BUILD_HASH} \
    NODE_ENV=production

# dist/       → bundle mono-université (UNIVERSITY)
# dist/<id>/  → un bundle par université, pour MULTI_TENANT=1
# L'ordre compte : `vite build` vide dist/ avant d'écrire.
RUN npm run build && npm run build:all

# --- Dépendances de production uniquement -----------------------------------
FROM node:${NODE_VERSION}-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# --- Image finale -----------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json LICENSE README.md ./
COPY server.js adeApi.js adeUpcomingResolver.js planningPortalApi.js planningRpc.js ./
COPY server ./server
COPY src ./src
COPY universities ./universities

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# server.js intercepte SIGTERM/SIGINT : pas besoin d'init système.
CMD ["node", "server.js"]
