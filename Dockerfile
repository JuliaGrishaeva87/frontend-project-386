# syntax=docker/dockerfile:1

# --- Stage 1: build the frontend (Vite) and the backend (tsc) ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

COPY . .
RUN npm run build --workspace frontend
RUN npm run build --workspace backend

# --- Stage 2: production runtime, single Fastify process ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --omit=dev --workspace backend --include-workspace-root

COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/frontend/dist ./public

EXPOSE 3000
CMD ["node", "backend/dist/server.js"]
