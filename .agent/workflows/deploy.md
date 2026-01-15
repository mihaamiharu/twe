---
description: Deploy TWE to VPS (Production or QA environment)
---

# TWE Deployment Workflow

// turbo-all

## Deploy QA (First-time or Update)

```bash
ssh deploy@YOUR_VPS_IP
cd ~/apps/twe
git pull origin main
docker compose -f docker-compose.qa.yml up -d --build
docker exec -it twe-qa bun run db:migrate
curl -f http://localhost:3001/
```

---

## Transition: QA → Production

> [!CAUTION]
> This wipes all QA data and starts fresh for production!

1. Stop QA:

```bash
docker compose -f docker-compose.qa.yml down
```

1. Reset DB in **Supabase Dashboard**: Settings → Database → Reset

2. Switch env:

```bash
cp .env.qa .env.production
nano .env.production  # Change BETTER_AUTH_URL to https://testingwithekki.com
```

1. Start Production:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker exec -it twe-app bun run db:migrate
docker exec -it twe-app bun run db:sync
```

1. Update Nginx:

```bash
sudo rm /etc/nginx/sites-enabled/twe-qa
sudo ln -s /etc/nginx/sites-available/twe /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d testingwithekki.com -d www.testingwithekki.com
```

---

## Update Production

```bash
ssh deploy@YOUR_VPS_IP
cd ~/apps/twe
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker exec -it twe-app bun run db:migrate
```

---

## Logs & Debug

```bash
docker logs -f twe-app   # Production
docker logs -f twe-qa    # QA
docker ps
```
