FROM node:20-alpine AS builder

WORKDIR /app

COPY packages/shared/package.json packages/shared/
COPY services/auth/package.json services/auth/

WORKDIR /app/packages/shared
COPY packages/shared/ .
RUN npm install && npm run build

WORKDIR /app/services/auth
COPY services/auth/ .
RUN npm install && npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/services/auth/dist ./dist
COPY --from=builder /app/services/auth/package.json ./
COPY --from=builder /app/services/auth/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ../packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ../packages/shared/

EXPOSE 4001

CMD ["node", "dist/index.js"]
