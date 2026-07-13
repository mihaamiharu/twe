#!/bin/bash

# TestingWithEkki (TWE) - Automated Migration Script
# Target: deploy@43.133.43.67

set -e

# Configuration
NEW_VPS_IP="43.133.43.67"
APP_DIR="~/apps/twe"
DB_BACKUP_FILE="twe_prod_backup.sql"
ENV_FILE=".env.production"

echo "🚀 Starting migration process for TWE..."

# 1. Prepare Target Server
echo "🛠️  Step 1: Preparing target server environment..."
ssh deploy@$NEW_VPS_IP << 'EOF'
    # Update and Install Docker/Docker-Compose
    if ! command -v docker &> /dev/null; then
        echo "📦 Installing Docker..."
        sudo apt-get update
        sudo apt-get install -y docker.io docker-compose
        sudo systemctl enable --now docker
        sudo usermod -aG docker $USER
    fi

    # Create app directory
    mkdir -p ~/apps/twe
    mkdir -p ~/.config/rclone
EOF

# 2. Transfer Sensitive Configs (Non-versioned)
echo "🔐 Step 2: Transferring sensitive configuration files..."
if [ -f ".env" ]; then
    echo "📤 Transferring .env as .env.production..."
    scp .env deploy@$NEW_VPS_IP:$APP_DIR/.env.production
else
    echo "⚠️  WARNING: .env not found locally. You must manually create .env.production on the server."
fi

if [ -f "rclone-backup.conf" ]; then
    echo "📤 Transferring rclone-backup.conf..."
    scp rclone-backup.conf deploy@$NEW_VPS_IP:~/.config/rclone/rclone.conf
fi

if [ -f "docker-compose.prod.yml" ]; then
    echo "📤 Transferring docker-compose.prod.yml..."
    scp docker-compose.prod.yml deploy@$NEW_VPS_IP:$APP_DIR/
fi

# 3. Database Migration
echo "🗄️  Step 3: Database backup and transfer..."
# This assumes the old server is where you run this script OR you have the dump ready
if [ -f "$DB_BACKUP_FILE" ]; then
    echo "📤 Found existing backup $DB_BACKUP_FILE. Transferring..."
    scp $DB_BACKUP_FILE deploy@$NEW_VPS_IP:$APP_DIR/
else
    echo "🔍 No backup file found. If you are on the OLD server, run:"
    echo "   docker exec twe-postgres pg_dump -U twe_user -d twe_db > $DB_BACKUP_FILE"
    echo "   Then run this script again."
    exit 1
fi

# 4. Bootstrap and Restore
echo "🔄 Step 4: Bootstrapping containers and restoring data..."
ssh deploy@$NEW_VPS_IP << EOF
    cd $APP_DIR
    
    # We need the compose file - if not there, we'll wait for GH Actions or scp it
    if [ ! -f "docker-compose.prod.yml" ]; then
        echo "📥 docker-compose.prod.yml missing. Please ensure you run the GH Action deployment first"
        echo "   or run: scp docker-compose.prod.yml deploy@$NEW_VPS_IP:$APP_DIR/"
    else
        echo "🐘 Starting database container..."
        docker-compose -f docker-compose.prod.yml up -d postgres
        
        echo "⏳ Waiting for database to be ready..."
        until docker exec twe-postgres pg_isready -U \${POSTGRES_USER:-twe_user} &> /dev/null; do
            sleep 2
        done

        echo "💉 Restoring database dump..."
        docker exec -i twe-postgres psql -U \${POSTGRES_USER:-twe_user} -d \${POSTGRES_DB:-twe_db} < $DB_BACKUP_FILE
        
        echo "✅ Database restored!"
    fi
EOF

echo "---"
echo "🎉 Migration Script Finished!"
echo "Next Steps:"
echo "1. Update GitHub Repo Secrets (VPS_HOST=43.133.43.67)."
echo "2. Run 'Deploy to Production' GitHub Action."
echo "3. Update your DNS A Record to 43.133.43.67."
echo "---"
