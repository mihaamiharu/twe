# Deployment Guide

This guide describes how to deploy the application to a VPS (Virtual Private Server) using Docker.

## 1. VPS Prerequisites

Before deploying, ensure your server is properly configured.

### A. System Configuration

**Hostname**
Set a descriptive hostname for your server (e.g., `twe-production`).

```bash
sudo hostnamectl set-hostname twe-production
```

**Swap Space (Critical)**
For a server with 4GB RAM, it is **highly recommended to add 4GB of swap space**. This prevents "Out of Memory" errors during builds.

```bash
# Check existing swap
free -h

# Create a 4GB swap file
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make it permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### B. Install Dependencies

You only need **Git** and **Docker** (or Podman).

**Ubuntu/Debian (Docker):**

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose (if not included)
sudo apt install -y docker-compose-plugin
```

## 2. Server Setup

### A. Clone Repository

Connect to your VPS via SSH and clone the repository:

```bash
git clone https://github.com/mihaamiharu/twe.git
cd twe
```

### B. Configure Environment

Create the production environment file:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and fill in your secrets (Database URL, Auth Secrets, etc.):

```bash
nano .env.production
```

> [!IMPORTANT]
> Ensure `DATABASE_URL` points to your production database. If you are using the containerized Postgres (defined in `docker-compose.prod.yml`), you can often use the default.

## 3. Deploy

We have a helper script that pulls the latest code, builds the images, runs migrations, and starts the services.

Run the deployment script:

```bash
./scripts/deploy-vps.sh
```

## 4. Troubleshooting

**Check Logs**

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

**Restart Manually**

```bash
docker compose -f docker-compose.prod.yml restart
```
