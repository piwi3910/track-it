# Multi-stage Dockerfile for Track-It Frontend

# Stage 1: Build the application
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# First, build the shared package
COPY shared/package*.json ./shared/
WORKDIR /app/shared
RUN npm ci
COPY shared/ .
RUN npm run build

# Now build the frontend
WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy all frontend files
COPY frontend/ .

# Fix rollup ARM64 issue and build
RUN npm install @rollup/rollup-linux-arm64-gnu && npx vite build

# Stage 2: Production image with nginx
FROM nginx:stable

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]