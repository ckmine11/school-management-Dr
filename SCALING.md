# Scaling, Backup & High Availability Guide

---

## 1. Keep the App Always Running

### One-Time Server Setup

Run this once after deploying on a fresh server:

```bash
cd /home/ubuntu/school-management-Dr
sudo bash scripts/setup-server.sh
```

This automatically configures:

| What | Details |
|---|---|
| Docker auto-start | Starts on every server reboot |
| App auto-restart | Restarts within 15 seconds after a crash |
| Daily backup | Runs at 2:00 AM every night |
| Health check | Every 5 minutes — auto-restarts if API fails |
| Log rotation | Keeps 14 days of logs, older ones deleted |

---

### Verify the Setup

```bash
# Check service status
sudo systemctl status school-app

# Check cron jobs are registered
crontab -u ubuntu -l

# Test server reboot recovery
sudo reboot
# Wait 2-3 minutes, then open the app in browser — it should be running
```

---

### Container Restart Policy (already set in docker-compose.yml)

```yaml
restart: unless-stopped
```

| Scenario | Behaviour |
|---|---|
| Container crashes | Auto-restarts within 5 seconds |
| Server reboots | Docker starts → containers start automatically |
| `docker-compose down` | Stops manually (will not auto-restart until next reboot or manual start) |
| API health check fails | Auto-restarts within 5 minutes |

---

## 2. Daily Backup

### Where Backups Are Stored

```
/home/ubuntu/backups/school-db/
├── 2026-05-26_02-00.tar.gz    ← Monday backup
├── 2026-05-27_02-00.tar.gz    ← Tuesday backup
├── 2026-05-28_02-00.tar.gz
...
(last 7 days kept — older backups deleted automatically)
```

### Run a Manual Backup (anytime)

```bash
bash /home/ubuntu/school-management-Dr/scripts/backup.sh
```

### Backup File Size

For a typical school with 500 students:
- Single daily backup: 1–5 MB (compressed)
- 7 days total: approximately 10–35 MB
- Oracle Cloud free storage (200 GB) can hold thousands of backups

### View Backup Logs

```bash
tail -f /home/ubuntu/logs/backup.log
```

---

## 3. Restore from a Backup

```bash
# List available backups
ls /home/ubuntu/backups/school-db/

# Restore from a specific date
bash /home/ubuntu/school-management-Dr/scripts/restore.sh 2026-05-26_02-00
```

The restore script:
- Asks for confirmation before proceeding (type `yes`)
- Drops the current database
- Restores data from the selected backup

---

## 4. DB Scaling

### Current Setup — Single Node MongoDB

Single-node MongoDB is sufficient for most schools:

| Students | Teachers | Records/year | Single Node |
|---|---|---|---|
| Up to 2,000 | Up to 100 | Up to 500,000 | Sufficient |
| 2,000 – 10,000 | 100 – 500 | 500K – 2M | Works fine |
| More than 10,000 | More than 500 | More than 2M | Consider scaling |

**For a typical school, single-node MongoDB will comfortably serve for many years.**

---

### Scaling Options

#### Option A — Optimize MongoDB Indexes (Free — Already Done)

All required indexes are already created:

| Index | Used For |
|---|---|
| `studentId + date` | Attendance lookups |
| `class + section` | Bulk class queries |
| `status` | Active student filters |
| `parentPhone` | WhatsApp broadcast targets |
| `year + month` | Fee reports |

No action needed — this is already in place.

---

#### Option B — MongoDB Atlas (Cloud Hosted)

Move the database to a managed cloud service:

```env
# Change in .env:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/schoolmanagement
```

| Plan | Storage | Cost | Suitable For |
|---|---|---|---|
| M0 Free | 512 MB | Free | Demo only |
| M2 | 2 GB | $9/month | Small school |
| M10 | Dedicated | $57/month | Large school |

---

#### Option C — Separate Oracle VM for MongoDB (Free)

Create a second free Oracle ARM VM and run MongoDB there:

```env
# Change in .env:
MONGODB_URI=mongodb://SECOND_VM_PRIVATE_IP:27017/schoolmanagement
```

> Note: Keep MongoDB port 27017 accessible only on the internal private network — never expose it to the public internet.

---

## 5. Health Check Monitoring

### View Logs

```bash
# Health check log (is the API up or down?)
tail -f /home/ubuntu/logs/healthcheck.log

# App log (docker-compose output)
tail -f /home/ubuntu/logs/app.log

# Container status
docker-compose ps

# Live CPU and RAM usage per container
docker stats
```

### Sample healthcheck.log

```
[2026-05-26 02:00:01] OK — API responding (HTTP 200)
[2026-05-26 02:05:01] OK — API responding (HTTP 200)
[2026-05-26 03:15:02] WARNING — API not responding (HTTP 000). Checking containers...
[2026-05-26 03:15:02]   school-mongodb: running
[2026-05-26 03:15:02]   school-backend: restarting
[2026-05-26 03:15:02]   school-frontend: running
[2026-05-26 03:15:03] Restarting docker-compose...
[2026-05-26 03:20:01] OK — API responding (HTTP 200)
```

---

## 6. Oracle Cloud Free Tier — Resource Limits

| Resource | Free Limit | Our Usage |
|---|---|---|
| OCPU | 4 | App + DB — more than enough |
| RAM | 24 GB | WhatsApp (2 GB) + MongoDB (2 GB) + plenty remaining |
| Boot Storage | 200 GB total | 100 GB boot volume |
| Object Storage | 20 GB | Available for offsite backups |
| Network Bandwidth | 10 TB/month | Far more than a school needs |

---

## 7. Production Setup Checklist

```bash
# One-time setup after first deploy:
sudo bash scripts/setup-server.sh

# Verify:
sudo systemctl status school-app        # should show: active (running)
crontab -u ubuntu -l                    # backup + healthcheck crons should appear
ls /home/ubuntu/backups/school-db/      # first backup file should exist

# Daily monitoring:
tail -5 /home/ubuntu/logs/backup.log        # did the backup run?
tail -5 /home/ubuntu/logs/healthcheck.log   # is the app healthy?
docker-compose ps                           # all containers running?
```

---

*With this setup, the application runs 24/7, data is backed up daily, and any failure recovers automatically within 5 minutes.*
