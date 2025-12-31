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

# Install production dependencies only
COPY requirements/prod.txt /app/backend/requirements.txt
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install gunicorn

# Copy application code
COPY . /app/backend/

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Create non-root user
RUN useradd -m -u 1000 nucleiq && \
    chown -R nucleiq:nucleiq /app/backend

USER nucleiq

# Expose port
EXPOSE 8000

# Run with Gunicorn
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
