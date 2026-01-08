# Multi-stage Dockerfile for Django Backend

# Base stage with common dependencies
FROM python:3.12-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    g++ \
    curl \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app/backend

# Development stage
FROM base as development

# Install Python dependencies
COPY requirements/dev.txt /app/backend/requirements.txt
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application code
COPY . /app/backend/

# Expose port
EXPOSE 8000

# Default command (overridden in docker-compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Production stage
FROM base as production

# Build arguments for metadata
ARG BUILD_DATE
ARG GIT_SHA

# Labels for container metadata
LABEL org.opencontainers.image.title="NucleIQ Backend" \
      org.opencontainers.image.description="Django REST API for NucleIQ Multi-Tenant SaaS" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.vendor="NucleIQ" \
      org.opencontainers.image.source="https://github.com/nucleiq/nucleiq"

# Install production dependencies only
COPY requirements/prod.txt /app/backend/requirements.txt
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install gunicorn

# Copy application code
COPY . /app/backend/

# Create necessary directories
RUN mkdir -p /app/backend/staticfiles /app/backend/media

# Create non-root user
RUN useradd -m -u 1000 nucleiq && \
    chown -R nucleiq:nucleiq /app/backend

USER nucleiq

# Expose port
EXPOSE 8000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Run with Gunicorn (optimized for container environments)
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "2", \
     "--threads", "4", \
     "--worker-class", "gthread", \
     "--worker-tmp-dir", "/dev/shm", \
     "--timeout", "120", \
     "--keep-alive", "5", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "50", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--capture-output", \
     "--log-level", "info"]
