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
# Database is managed via app for now in QA if needed, otherwise use local staging DB
docker exec -it twe-qa bun run db:migrate
```

---

## Transition: QA → Production

1. Stop QA:

```bash
docker compose -f docker-compose.qa.yml down
```

1. Prepare Production Environment:

```bash
cp .env.qa .env.production
nano .env.production  
# 1. Change BETTER_AUTH_URL to https://testingwithekki.com
# 2. Update DATABASE_URL to: postgresql://twe_user:twe_password@postgres:5432/twe_db
```

1. Start Production (App + Database):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

1. Initialize Database:

```bash
# Wait for DB to be healthy
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

## Database Backups (CRITICAL)

Since we are self-hosting, backups are manual.

**1. Manual Backup:**

```bash
docker exec -t twe-postgres pg_dumpall -c -U twe_user > dump_$(date +%Y-%m-%d).sql
```

**2. Restore:**

```bash
cat dump_file.sql | docker exec -i twe-postgres psql -U twe_user -d twe_db
```

**3. Automated Cron Job (Daily)**
Run `crontab -e` and add:

```bash
0 3 * * * docker exec -t twe-postgres pg_dumpall -c -U twe_user > /home/deploy/backups/twe_backup_$(date +\%Y-\%m-\%d).sql
```

---

## Logs & Debug

```bash
docker logs -f twe-app     # App logs
docker logs -f twe-postgres # Database logs
docker ps                  # Check status
```
