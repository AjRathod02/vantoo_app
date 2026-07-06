FROM node:20-alpine AS builder
WORKDIR /app
COPY packages/shared/package.json packages/shared/
COPY services/vendor/package.json services/vendor/
WORKDIR /app/packages/shared
COPY packages/shared/ .
RUN npm install && npm run build
WORKDIR /app/services/vendor
COPY services/vendor/ .
RUN npm install && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/vendor/dist ./dist
COPY --from=builder /app/services/vendor/package.json ./
COPY --from=builder /app/services/vendor/node_modules ./node_modules
EXPOSE 4004
CMD ["node", "dist/index.js"]
