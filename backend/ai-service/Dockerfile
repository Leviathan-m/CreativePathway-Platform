# CreativePathway ML Service Dockerfile
# Multi-stage build for security and size optimization

FROM python:3.10-slim AS builder

# Set environment variables to reduce Python bytecode and buffer issues
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install build dependencies only in builder stage
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install -r requirements.txt

# Production runtime stage
FROM python:3.10-slim AS runtime

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV TF_CPP_MIN_LOG_LEVEL=2
ENV PATH="/opt/venv/bin:$PATH"

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create non-root user with fixed UID/GID for security
RUN groupadd --gid 1001 mluser && \
    useradd --create-home --shell /bin/bash --uid 1001 --gid 1001 mluser

# Copy virtual environment from builder
COPY --from=builder --chown=mluser:mluser /opt/venv /opt/venv

# Copy application source code
COPY --chown=mluser:mluser . .

# Create necessary directories with proper permissions
RUN mkdir -p models logs && chown -R mluser:mluser models logs /app

# Switch to non-root user
USER mluser

# Expose port
EXPOSE 5000

# Health check with proper timeout and retries
HEALTHCHECK --interval=60s --timeout=30s --start-period=30s --retries=3 \
    CMD curl -f --max-time 10 http://127.0.0.1:5000/api/ml/health || exit 1

# Start the application
CMD ["python", "app.py"]