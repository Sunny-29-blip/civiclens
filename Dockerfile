# ==============================================================================
# CivicLens - Multi-stage Google Cloud Run Dockerfile
# Stage 1: Build React Frontend
# Stage 2: Run Python FastAPI Backend + Serve Production Assets
# ==============================================================================

# --- Stage 1: Frontend Build ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production Python Backend ---
FROM python:3.12-slim AS runner

WORKDIR /app

# Install system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies using pre-compiled binary wheels
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --only-binary :all: -r requirements.txt || pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ /app/backend/

# Copy built frontend assets into frontend/dist for single-container serving
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

WORKDIR /app/backend

# Cloud Run default port is 8080
ENV PORT=8080
ENV HOST=0.0.0.0

EXPOSE 8080

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
