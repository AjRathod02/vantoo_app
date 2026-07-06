FROM node:20-alpine AS builder
WORKDIR /app
COPY packages/shared/package.json packages/shared/
COPY services/catalog/package.json services/catalog/
WORKDIR /app/packages/shared
COPY packages/shared/ .
RUN npm install && npm run build
WORKDIR /app/services/catalog
COPY services/catalog/ .
RUN npm install && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/catalog/dist ./dist
COPY --from=builder /app/services/catalog/package.json ./
COPY --from=builder /app/services/catalog/node_modules ./node_modules
EXPOSE 4002
CMD ["node", "dist/index.js"]
