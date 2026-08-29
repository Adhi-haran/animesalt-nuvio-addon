# Multi-stage lightweight Node.js Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7000

# Copy built application
COPY --from=builder /app ./

EXPOSE 7000

USER node
CMD ["node", "server.js"]
