# =============================================================================
# frontend Dockerfile — two named build stages
#
#   development  (default for docker-compose.yml)
#     Runs the Vite dev server with HMR. Source code is bind-mounted by
#     docker-compose so any file change is reflected instantly.
#
#   production   (used by docker-compose.prod.yml  →  target: production)
#     Runs `npm run build` and serves the resulting static bundle with a
#     minimal nginx image. No Node.js runtime is included in the final image.
# =============================================================================

# ─── Stage 1: install dependencies (shared between dev and prod) ─────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# No lockfile is committed (yet), so run a plain install.  --no-audit and
# --no-fund keep the build output clean and slightly faster; they match the
# same flags used by CI (.github/workflows/ci.yml).  When a package-lock.json
# is eventually committed, switch this back to `npm ci` for reproducibility.
RUN npm install --no-audit --no-fund

# ─── Stage 2: development (default) ─────────────────────────────────────────
FROM deps AS development
COPY . .
EXPOSE 5174
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]

# ─── Stage 3: build (run vite build) ─────────────────────────────────────────
FROM deps AS builder
COPY . .
# VITE_BASE and VITE_CURRENCY are passed as build-args from the compose file
ARG VITE_BASE=/
ARG VITE_CURRENCY=INR
ENV VITE_BASE=${VITE_BASE} VITE_CURRENCY=${VITE_CURRENCY}
RUN npm run build

# ─── Stage 4: production (serve the static bundle with nginx) ────────────────
FROM nginx:1.27-alpine AS production
# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*
# Copy the Vite bundle
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy a minimal nginx config: serve SPA with fallback to index.html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
