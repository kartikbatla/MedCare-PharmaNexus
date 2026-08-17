# Multi-stage Dockerfile for MedCare & PharmaNexus Control Tower
# Stage 1: Build React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY pharma_nexus_frontend/package*.json ./
RUN npm install
COPY pharma_nexus_frontend ./
RUN npm run build

# Stage 2: Python FastAPI Backend + Serve Static UI
FROM python:3.10-slim
WORKDIR /app

# Install system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project source code
COPY . .

# Copy compiled frontend build dist into static directory
COPY --from=frontend-builder /app/frontend/dist /app/dashboard/dist

# Expose backend API port
EXPOSE 8000

# Start FastAPI server via Uvicorn
CMD ["python", "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
