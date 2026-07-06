FROM node:20-alpine AS builder
WORKDIR /app
COPY packages/shared/package.json packages/shared/
COPY services/tracking/package.json services/tracking/
WORKDIR /app/packages/shared
COPY packages/shared/ .
RUN npm install && npm run build
WORKDIR /app/services/tracking
COPY services/tracking/ .
RUN npm install && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/tracking/dist ./dist
COPY --from=builder /app/services/tracking/package.json ./
COPY --from=builder /app/services/tracking/node_modules ./node_modules
EXPOSE 4010
CMD ["node", "dist/index.js"]
