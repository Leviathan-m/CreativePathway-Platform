# CreativePathway API Service Dockerfile
# Multi-stage build for security and size optimization

FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install build dependencies only in builder stage
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files first for better caching
COPY package*.json ./

# Use npm ci for reproducible installs
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS runtime

# Install curl for health checks (minimal runtime dependency)
RUN apk add --no-cache curl && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user with fixed UID/GID for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy installed dependencies from builder stage
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy application source code
COPY --chown=appuser:appgroup . .

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R appuser:appgroup logs

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check with proper timeout and retries
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f --max-time 5 http://127.0.0.1:3000/health || exit 1

# Start the application
CMD ["node", "server.js"]