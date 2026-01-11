#!/bin/bash

# Configuration
APP_NAME="twe-app"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Starting deployment of $APP_NAME..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin staging # Or main, depending on the phase

# 2. Build and start containers
echo "🛠️ Building and starting containers..."
docker compose -f $DOCKER_COMPOSE_FILE up -d --build

# 3. Running migrations (via Supabase/Bun)
echo "🔄 Running database migrations..."
docker exec $APP_NAME bun run db:migrate

# 4. Cleanup old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "✅ Deployment successful! Your app is running on port 3000."
