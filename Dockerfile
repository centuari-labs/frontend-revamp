# Step 1: Install dependencies and build the app
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable pnpm && corepack use pnpm@10.23.0

WORKDIR /app

# Install dependencies
COPY pnpm-lock.yaml ./
COPY package.json ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build-time public env vars baked into the client bundle.
# These MUST be declared as ARG; --build-arg from CI is otherwise ignored.
ARG NEXT_PUBLIC_PRIVY_APP_ID
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_CHAIN_ENV
ARG NEXT_PUBLIC_USE_MOCK
ARG NEXT_PUBLIC_RPC_URL
ARG NEXT_PUBLIC_HUB_DEPOSITOR_ADDRESS
ARG NEXT_PUBLIC_COLLATERAL_MANAGER_ADDRESS
ENV NEXT_PUBLIC_PRIVY_APP_ID=$NEXT_PUBLIC_PRIVY_APP_ID
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_CHAIN_ENV=$NEXT_PUBLIC_CHAIN_ENV
ENV NEXT_PUBLIC_USE_MOCK=$NEXT_PUBLIC_USE_MOCK
ENV NEXT_PUBLIC_RPC_URL=$NEXT_PUBLIC_RPC_URL
ENV NEXT_PUBLIC_HUB_DEPOSITOR_ADDRESS=$NEXT_PUBLIC_HUB_DEPOSITOR_ADDRESS
ENV NEXT_PUBLIC_COLLATERAL_MANAGER_ADDRESS=$NEXT_PUBLIC_COLLATERAL_MANAGER_ADDRESS

# Lint + typecheck run in CI (.github/workflows/deploy.yml `test` job) before
# `docker build`. We don't re-run them inside Docker because: (1) we don't want
# CI failures detected only at image-build time, (2) it doubles build duration,
# and (3) the lockfile hasn't changed between CI checkout and Docker checkout,
# so the CI verification is binding for what gets built here.
# IF you build the image outside CI, run `pnpm run lint && pnpm run typecheck`
# manually before `docker build`.
ENV NEXT_PRIVATE_TURBOPACK=false

# Give Node enough memory for the production build
ENV NODE_OPTIONS=--max-old-space-size=4096

# Build the Next.js app
RUN pnpm build

# Step 2: Run the app using a smaller image
FROM node:22-alpine AS runner

# Install pnpm (optional, only needed if using `pnpm` directly at runtime)
RUN corepack enable pnpm && corepack use pnpm@10.23.0

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3200

CMD ["pnpm", "start", "-p", "3200"]
