#!/bin/bash
set -e

# ============================================
# Manufacturer-Lab Deployment Script
# Target: Linode server 172.105.50.16
# ============================================

SERVER="root@172.105.50.16"
APP_DIR="/opt/manufacturer-lab"

echo "=== Step 1: Setting up server ==="
ssh $SERVER << 'SETUP'
# Update system
apt-get update && apt-get upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi

# Install git if not present
if ! command -v git &> /dev/null; then
    apt-get install -y git
fi

# Create app directory
mkdir -p /opt/manufacturer-lab
echo "Server setup complete!"
SETUP

echo "=== Step 2: Syncing project files ==="
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.git' \
    --exclude='uploads/*' \
    -e ssh ./ $SERVER:$APP_DIR/

echo "=== Step 3: Setting up environment ==="
scp .env.production $SERVER:$APP_DIR/.env

echo "=== Step 4: Building and starting containers ==="
ssh $SERVER << DEPLOY
cd $APP_DIR

# Create uploads directory
mkdir -p uploads

# Build and start
docker compose down || true
docker compose build --no-cache
docker compose up -d

# Wait for database to be ready
echo "Waiting for database..."
sleep 5

# Run Prisma migrations
docker compose exec web npx prisma db push --accept-data-loss
docker compose exec web npx prisma generate

# Seed database (optional - first deploy only)
# docker compose exec web npx prisma db seed

echo ""
echo "=== Deployment complete! ==="
echo "App is running at: http://172.105.50.16:3000"
DEPLOY
