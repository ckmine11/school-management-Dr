#!/bin/bash
# ─────────────────────────────────────────────────────
# School Management System — Daily MongoDB Backup
# Run as cron: 0 2 * * * /home/ubuntu/school-management-Dr/scripts/backup.sh
# ─────────────────────────────────────────────────────

set -e

BACKUP_DIR="/home/ubuntu/backups/school-db"
DATE=$(date +"%Y-%m-%d_%H-%M")
BACKUP_PATH="$BACKUP_DIR/$DATE"
KEEP_DAYS=7   # delete backups older than 7 days
CONTAINER="school-mongodb"
DB_NAME="schoolmanagement"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup → $BACKUP_PATH"

# Dump MongoDB from inside the container
docker exec "$CONTAINER" mongodump \
  --db "$DB_NAME" \
  --out "/data/backup_tmp" \
  --quiet

# Copy dump out of container to host
docker cp "$CONTAINER:/data/backup_tmp/$DB_NAME" "$BACKUP_PATH"

# Clean temp inside container
docker exec "$CONTAINER" rm -rf /data/backup_tmp

# Compress the backup
tar -czf "${BACKUP_PATH}.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_PATH"

echo "[$(date)] Backup saved → ${BACKUP_PATH}.tar.gz"
echo "[$(date)] Size: $(du -sh ${BACKUP_PATH}.tar.gz | cut -f1)"

# Delete backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$KEEP_DAYS -delete
echo "[$(date)] Old backups (>${KEEP_DAYS} days) deleted"

# Show remaining backups
echo "[$(date)] Current backups:"
ls -lh "$BACKUP_DIR"

echo "[$(date)] Done."
