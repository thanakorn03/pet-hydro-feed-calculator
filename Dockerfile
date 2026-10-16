# Use official Node.js runtime as base image
FROM node:20-slim

# Install build dependencies for native modules (e.g. better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests first for optimal caching
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Ensure data directory exists for SQLite storage
RUN mkdir -p /app/data

# Environment defaults
ENV NODE_ENV=production
ENV PORT=8100
ENV DB_PATH=/app/data/pets.db

# Expose default application port
EXPOSE 8100

# Start Express server
CMD ["node", "server.js"]
