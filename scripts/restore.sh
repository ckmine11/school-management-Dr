#!/bin/bash
# ─────────────────────────────────────────────────────
# School Management System — MongoDB Restore
# Usage: ./restore.sh 2026-05-26_02-00
# ─────────────────────────────────────────────────────

set -e

BACKUP_DIR="/home/ubuntu/backups/school-db"
CONTAINER="school-mongodb"
DB_NAME="schoolmanagement"

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <backup-date>"
  echo ""
  echo "Available backups:"
  ls "$BACKUP_DIR"/*.tar.gz 2>/dev/null | xargs -I{} basename {} .tar.gz || echo "No backups found"
  exit 1
fi

BACKUP_FILE="$BACKUP_DIR/$1.tar.gz"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup not found: $BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Restoring from: $BACKUP_FILE"
echo "⚠️  WARNING: This will OVERWRITE current database '$DB_NAME'"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Extract backup
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Copy into container
docker cp "$TEMP_DIR/$1" "$CONTAINER:/data/restore_tmp"

# Restore using mongorestore
docker exec "$CONTAINER" mongorestore \
  --db "$DB_NAME" \
  --drop \
  "/data/restore_tmp" \
  --quiet

# Cleanup
docker exec "$CONTAINER" rm -rf /data/restore_tmp
rm -rf "$TEMP_DIR"

echo "[$(date)] Restore complete — database '$DB_NAME' restored from $1"
