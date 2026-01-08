# Multi-stage Dockerfile for React Frontend (Vite)

# Base stage
FROM node:20-alpine as base

WORKDIR /app/frontend

# Development stage
FROM base as development

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start development server with host binding for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base as builder

# Build arguments for environment configuration
ARG VITE_API_URL=http://localhost:8000/api
ARG VITE_WS_URL=ws://localhost:8000/ws

# Set environment variables for the build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy application code
COPY . .

# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine as production

# Labels for container metadata
LABEL org.opencontainers.image.title="NucleIQ Frontend" \
    org.opencontainers.image.description="React SPA for NucleIQ Multi-Tenant SaaS" \
    org.opencontainers.image.vendor="NucleIQ"

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Create non-root user for nginx
RUN adduser -D -u 1000 nucleiq && \
    chown -R nucleiq:nucleiq /usr/share/nginx/html && \
    chown -R nucleiq:nucleiq /var/cache/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nucleiq:nucleiq /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
