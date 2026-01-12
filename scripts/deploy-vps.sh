#!/bin/bash

# Configuration
APP_NAME="twe-app"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

echo "🚀 Starting deployment of $APP_NAME..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# 2. Run migrations BEFORE starting containers (uses DIRECT_URL for Supabase)
echo "🔄 Running database migrations..."
set -a
source $ENV_FILE
set +a
bun run db:migrate

# 3. Build and start containers
echo "🛠️ Building and starting containers..."
docker compose -f $DOCKER_COMPOSE_FILE up -d --build

# 4. Cleanup old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "✅ Deployment successful! Your app is running on port 3000."
