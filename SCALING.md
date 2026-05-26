# Scaling, Backup & High Availability Guide

---

## 1. App कभी बंद न हो — Setup Steps

### Step 1: Server पर एक बार यह चलाएं (deploy के बाद)

```bash
cd /home/ubuntu/school-management-Dr
sudo bash scripts/setup-server.sh
```

यह automatically configure करेगा:
- Docker → server reboot पर auto-start
- App → crash होने पर auto-restart (15 sec में)
- Daily backup → रोज़ रात 2:00 AM
- Health check → हर 5 मिनट (API down हो तो auto-restart)
- Log rotation → 14 दिन

---

### Step 2: Verify करें

```bash
# Service status देखें
sudo systemctl status school-app

# Cron jobs देखें
crontab -u ubuntu -l

# Reboot test करें
sudo reboot
# 2-3 मिनट बाद check करें — app चल रही होगी
```

---

### Container Restart Policy (already set in docker-compose.yml)

```yaml
restart: unless-stopped
```

| Scenario | क्या होगा |
|---|---|
| Container crash | 5 सेकंड में auto-restart |
| Server reboot | Docker start → containers start |
| docker-compose down | Manual stop (restart नहीं होगा) |
| API fail (health check) | 5 min में auto-restart |

---

## 2. Daily Backup

### Backup कहाँ जाता है

```
/home/ubuntu/backups/school-db/
├── 2026-05-26_02-00.tar.gz    ← सोमवार की backup
├── 2026-05-27_02-00.tar.gz    ← मंगलवार की backup
├── 2026-05-28_02-00.tar.gz
...7 दिन की backups रहती हैं, पुरानी auto-delete
```

### Manually Backup लें (जब चाहें)

```bash
bash /home/ubuntu/school-management-Dr/scripts/backup.sh
```

### Backup Size

एक स्कूल (500 students) के लिए backup typically:
- Daily dump: 1–5 MB
- 7 दिन का total: ~10–35 MB
- Oracle Cloud free storage (200GB) में हज़ारों backups आ सकते हैं

### Backup Log देखें

```bash
tail -f /home/ubuntu/logs/backup.log
```

---

## 3. Restore करना (ज़रूरत पड़ने पर)

```bash
# Available backups देखें
ls /home/ubuntu/backups/school-db/

# Restore करें (date से)
bash /home/ubuntu/school-management-Dr/scripts/restore.sh 2026-05-26_02-00
```

Restore script:
- Confirm माँगेगा (yes type करना होगा)
- Current database drop करेगा
- Backup से restore करेगा

---

## 4. DB Scaling

### अभी (Single Node MongoDB) — कब तक काफी है?

| छात्र | Teachers | Records/year | Single Node |
|---|---|---|---|
| < 2,000 | < 100 | < 500,000 | ✅ काफी है |
| 2,000–10,000 | 100–500 | 500K–2M | ✅ ठीक है |
| > 10,000 | > 500 | > 2M | ⚠️ Review करें |

**एक सामान्य स्कूल के लिए single node MongoDB कई सालों तक काफी है।**

---

### अगर बड़ा करना हो — Options

#### Option A: MongoDB Indexes Optimize करें (Free, Already Done)

सभी ज़रूरी indexes पहले से बने हैं:
- `studentId + date` (attendance)
- `class + section` (bulk queries)
- `status` (active students filter)
- `parentPhone` (WhatsApp broadcasts)
- `year + month` (fee reports)

#### Option B: MongoDB Atlas (Cloud Hosted)

अगर database को अलग server पर move करना हो:

```env
# .env में change करें:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/schoolmanagement
```

Plans:
- **M0 Free:** 512MB — demo के लिए ठीक, production के लिए छोटा
- **M2 ($9/month):** 2GB — छोटे स्कूल के लिए काफी
- **M10 ($57/month):** Dedicated — large school

#### Option C: दूसरा Free Oracle VM (MongoDB अलग)

Oracle Cloud पर दूसरा free ARM VM लें, उस पर MongoDB चलाएं:

```env
MONGODB_URI=mongodb://SECOND_VM_IP:27017/schoolmanagement
```

> ⚠️ इस case में MongoDB का port 27017 सिर्फ internal network में खुला रखें, public नहीं।

---

## 5. Health Check Monitoring

### Logs देखें

```bash
# Health check log (app up है या नहीं)
tail -f /home/ubuntu/logs/healthcheck.log

# App log (docker-compose output)
tail -f /home/ubuntu/logs/app.log

# Container status
docker-compose ps

# Live container stats (CPU, RAM)
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

## 6. Oracle Cloud Free Tier — Maximum Configuration

Oracle Cloud ARM Free Tier में यह सब free मिलता है:

| Resource | Free Limit | हमारा Use |
|---|---|---|
| OCPU | 4 | App + DB के लिए काफी |
| RAM | 24 GB | WhatsApp (2GB) + MongoDB (2GB) + बाकी free |
| Boot Storage | 200 GB total | 100 GB boot volume |
| Object Storage | 20 GB | Backups के लिए |
| Network Bandwidth | 10 TB/month | School के लिए बहुत ज़्यादा |

---

## 7. Summary — Production Setup Checklist

```bash
# Server पर पहली बार (one-time):
sudo bash scripts/setup-server.sh

# यह verify करें:
sudo systemctl status school-app     # ✅ active (running)
crontab -u ubuntu -l                 # ✅ backup + healthcheck crons दिखें
ls /home/ubuntu/backups/school-db/   # ✅ first backup दिखे

# रोज़ check करें:
tail -5 /home/ubuntu/logs/backup.log      # backup हुआ?
tail -5 /home/ubuntu/logs/healthcheck.log # app ठीक है?
docker-compose ps                          # सब containers running?
```

---

*इस guide से app 24/7 चलती रहेगी, data safe रहेगा, और कोई भी failure 5 मिनट में auto-recover हो जाएगी।*
