FROM node:20-alpine AS builder
WORKDIR /app
COPY packages/shared/package.json packages/shared/
COPY services/order/package.json services/order/
WORKDIR /app/packages/shared
COPY packages/shared/ .
RUN npm install && npm run build
WORKDIR /app/services/order
COPY services/order/ .
RUN npm install && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/order/dist ./dist
COPY --from=builder /app/services/order/package.json ./
COPY --from=builder /app/services/order/node_modules ./node_modules
EXPOSE 4003
CMD ["node", "dist/index.js"]
