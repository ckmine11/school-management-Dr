#!/bin/bash
# ─────────────────────────────────────────────────────
# School Management System — Health Monitor
# Run as cron: */5 * * * * /home/ubuntu/school-management-Dr/scripts/healthcheck.sh
# ─────────────────────────────────────────────────────

APP_DIR="/home/ubuntu/school-management-Dr"
LOG_FILE="/home/ubuntu/logs/healthcheck.log"
API_URL="http://localhost/api/health"

mkdir -p "$(dirname $LOG_FILE)"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check API health endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" --max-time 10 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
  log "OK — API responding (HTTP $HTTP_CODE)"
  exit 0
fi

log "WARNING — API not responding (HTTP $HTTP_CODE). Checking containers..."

# Check each container
for CONTAINER in school-mongodb school-backend school-frontend; do
  STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo "not found")
  log "  $CONTAINER: $STATUS"
done

log "Restarting docker-compose..."
cd "$APP_DIR" && docker-compose up -d >> "$LOG_FILE" 2>&1

log "Restart triggered. Will check again in 5 minutes."

# Keep only last 1000 lines of log
tail -n 1000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
