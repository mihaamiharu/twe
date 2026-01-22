---
description: Build locally and deploy artifacts to VPS (Bypass VPS resource limits)
---

# Deploy with Local Build

This workflow builds the application on your local machine and transfers the artifacts to the VPS, avoiding high memory usage on the server.

// turbo-all

## 1. Build Locally

```bash
bun run build
```

## 2. Compress Output

```bash
tar -czf deployment.tar.gz dist content drizzle scripts src package.json bun.lock tsconfig.json Dockerfile.deploy .dockerignore
```

## 3. Upload to VPS

```bash
scp -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no deployment.tar.gz root@103.235.75.99:~/apps/twe/
```

## 4. Deploy on VPS

Run these commands on the VPS (via SSH):

```bash
ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no root@103.235.75.99 << 'EOF'
  cd ~/apps/twe
  
  # Extract artifacts
  tar -xzf deployment.tar.gz
  
  # Build and restart with the deployment Dockerfile
  # Note: -f Dockerfile.deploy tells it to use our pre-built image config
  docker build -f Dockerfile.deploy -t twe-app-prebuilt .
  
  # Update docker-compose.qa.yml (or prod) to use this image or just force recreate
  # For now, let's just stop the old container and run the new one properly
  # But ideally we update compose. Let's start simple:
  
  # Option A: Standalone run (Simplest for testing)
  # docker stop twe-qa || true
  # docker rm twe-qa || true
  # docker run -d --name twe-qa --env-file .env.qa -p 3000:3000 twe-app-prebuilt

  # Option B: Integration with Compose (Recommended)
  # We need to tell compose to build from Dockerfile.deploy
  # Let's override the build context temporarily
  export DOCKER_BUILDKIT=1
  docker compose -f docker-compose.qa.yml build --no-cache app
  docker compose -f docker-compose.qa.yml up -d
  
  # Cleanup
  rm deployment.tar.gz
EOF
```

> **Note:** For Option B to work with `Dockerfile.deploy`, we need to update `docker-compose.qa.yml` to point to it, OR we can just overwrite the main `Dockerfile` on the server temporarily. 

**Simplified Strategy**: In step 4, we will overwrite the `Dockerfile` on the VPS with `Dockerfile.deploy` before running compose.

```bash
ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no root@103.235.75.99 << 'EOF'
  cd ~/apps/twe
  tar -xzf deployment.tar.gz
  
  # Overwrite main Dockerfile with deploy version
  mv Dockerfile.deploy Dockerfile
  
  # Now compose will use the "copy .output" strategy
  docker compose -f docker-compose.qa.yml up -d --build app
  
  rm deployment.tar.gz
EOF
```
