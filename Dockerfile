# Stage 1: Build frontend assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Run production API server and serve built assets
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/api-lib ./api-lib
COPY --from=builder /app/dev-server.js ./dev-server.js

EXPOSE 3001
CMD ["node", "dev-server.js"]
