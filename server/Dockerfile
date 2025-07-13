# Multi-stage Dockerfile for Node.js backend

# Development stage
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Expose port
EXPOSE 5001

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start command
CMD ["node", "index.js"]

# Production stage
FROM node:18-alpine AS production

# Set environment
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create logs directory with proper permissions
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs /app

# Remove unnecessary files
RUN rm -rf .git .gitignore README.md docker-compose.yml

# Expose port
EXPOSE 5001

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start command
CMD ["node", "index.js"]