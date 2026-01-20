# Multi-stage Dockerfile for Django Backend (reworked for smaller final image)

# Builder: install build-time packages and build wheels
FROM python:3.12-slim as builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /wheels

# Install build dependencies required to compile some packages (kept only in builder)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    python3-dev \
    libpq-dev \
    libatlas-base-dev \
    libopenblas-dev \
    liblapack-dev \
    libjpeg-dev \
    libboost-all-dev \
    cmake \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements to leverage Docker cache
COPY requirements/prod.txt /wheels/requirements-prod.txt

# Build wheels for all requirements into /wheels
RUN python -m pip install --upgrade pip wheel setuptools && \
    pip wheel -r requirements-prod.txt --wheel-dir /wheels


# Development image
FROM python:3.12-slim as development

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app/backend

# Install system dependencies (minimal runtime requirements)
# Note: dlib/face_recognition dependencies removed - install manually if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    python3-dev \
    libpq-dev \
    libjpeg-dev \
    curl \
    postgresql-client \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libglib2.0-0 \
    libharfbuzz0b \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements files
COPY requirements/ /app/backend/requirements/

# Install development dependencies
RUN pip install --no-cache-dir --upgrade pip wheel setuptools && \
    pip install --no-cache-dir -r requirements/dev.txt

# Copy application code
COPY . /app/backend/

# Expose port
EXPOSE 8000

# CMD is usually overridden by docker-compose, but we provide a default
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]


# Production image: minimal runtime with only required system libs and wheels from builder
FROM python:3.12-slim as production

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app/backend

# Install only runtime system packages (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    libpq5 \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libglib2.0-0 \
    libharfbuzz0b \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy pre-built wheels from builder and install them (no compilation in final image)
COPY --from=builder /wheels /wheels
RUN pip install --upgrade pip && \
    pip install --no-index --find-links=/wheels -r /wheels/requirements-prod.txt && \
    pip install gunicorn

# Copy application code
COPY . /app/backend/

# Create necessary directories and non-root user
RUN mkdir -p /app/backend/staticfiles /app/backend/media && \
    useradd -m -u 1000 nucleiq && \
    chown -R nucleiq:nucleiq /app/backend

USER nucleiq

# Build arguments for metadata
ARG BUILD_DATE
ARG GIT_SHA

# Labels for container metadata
LABEL org.opencontainers.image.title="NucleiQ Backend" \
    org.opencontainers.image.description="Django REST API for NucleiQ Multi-Tenant SaaS" \
    org.opencontainers.image.created="${BUILD_DATE}" \
    org.opencontainers.image.revision="${GIT_SHA}" \
    org.opencontainers.image.vendor="NucleiQ" \
    org.opencontainers.image.source="https://github.com/nucleiq/nucleiq"

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

