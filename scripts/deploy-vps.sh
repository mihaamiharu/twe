#!/bin/bash

# Configuration
APP_NAME="twe-app"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

echo "🚀 Starting deployment of $APP_NAME..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# 2. Build images first
echo "🛠️ Building containers..."
docker compose -f $DOCKER_COMPOSE_FILE build

# 3. Run migrations inside a temporary container
# We use 'run --rm' to start a temporary container just for the migration
# This ensures we use the exact environment defined in the Dockerfile
echo "🔄 Running database migrations..."
docker compose -f $DOCKER_COMPOSE_FILE run --rm app bun run db:migrate

# 4. Start the application
echo "🚀 Starting application..."
docker compose -f $DOCKER_COMPOSE_FILE up -d

# 4. Cleanup old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "✅ Deployment successful! Your app is running on port 3000."
