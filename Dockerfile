# Multi-stage build for INARA Platform
# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci --only=production

# Copy client source
COPY client/ ./

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy Prisma schema
COPY server/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy server source
COPY server/src ./src
COPY server/tsconfig.json ./

# Build backend
RUN npm run build

# Stage 3: Production runtime
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY --from=backend-builder /app/server/node_modules ./server/node_modules
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/prisma ./server/prisma
COPY --from=backend-builder /app/server/package.json ./server/package.json

# Copy frontend build
COPY --from=frontend-builder /app/client/dist ./client/dist

# Create uploads directory
RUN mkdir -p server/public/uploads

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
WORKDIR /app/server
CMD ["node", "dist/index.js"]

