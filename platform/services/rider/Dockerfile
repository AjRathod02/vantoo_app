FROM node:20-alpine AS builder
WORKDIR /app
COPY packages/shared/package.json packages/shared/
COPY services/rider/package.json services/rider/
WORKDIR /app/packages/shared
COPY packages/shared/ .
RUN npm install && npm run build
WORKDIR /app/services/rider
COPY services/rider/ .
RUN npm install && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/rider/dist ./dist
COPY --from=builder /app/services/rider/package.json ./
COPY --from=builder /app/services/rider/node_modules ./node_modules
EXPOSE 4005
CMD ["node", "dist/index.js"]
