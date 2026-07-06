FROM node:20-alpine AS builder
WORKDIR /app
COPY packages/shared/package.json packages/shared/
COPY services/notification/package.json services/notification/
WORKDIR /app/packages/shared
COPY packages/shared/ .
RUN npm install && npm run build
WORKDIR /app/services/notification
COPY services/notification/ .
RUN npm install && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/notification/dist ./dist
COPY --from=builder /app/services/notification/package.json ./
COPY --from=builder /app/services/notification/node_modules ./node_modules
EXPOSE 4009
CMD ["node", "dist/index.js"]
