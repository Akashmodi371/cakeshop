FROM node:20-alpine AS base
WORKDIR /app

# ── Install deps ──────────────────────────────────────────
FROM base AS deps
COPY package.json ./
RUN npm install

# ── Build ─────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# public folder must exist for standalone build
RUN mkdir -p public

ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=""
ARG NEXT_PUBLIC_SHOP_PHONE="+91-9876543210"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SHOP_PHONE=$NEXT_PUBLIC_SHOP_PHONE
ARG NEXT_PUBLIC_FIREBASE_API_KEY=""
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
ARG NEXT_PUBLIC_FIREBASE_APP_ID=""
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBlDd4bEueRw-q17H_dSbukb5C8SiV9F74
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=agrawal-cake-house-170a6.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=agrawal-cake-house-170a6
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:607405755157:web:d24f73797742a91badf71c

RUN npm run build

# ── Run ───────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# public folder (may be empty, but must exist)
RUN mkdir -p ./public
COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
