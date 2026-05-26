#!/bin/bash
# ─────────────────────────────────────────────────────
# School Management System — One-time Server Setup
# Run this ONCE after deploying on a fresh Linux server
# Usage: sudo bash setup-server.sh
# ─────────────────────────────────────────────────────

set -e

APP_DIR="/home/ubuntu/school-management-Dr"
BACKUP_DIR="/home/ubuntu/backups/school-db"
LOG_DIR="/home/ubuntu/logs"
SCRIPTS_DIR="$APP_DIR/scripts"

echo "======================================"
echo " School Management System — Setup"
echo "======================================"

# Step 1: Create required directories
echo "[1/5] Creating directories..."
mkdir -p "$BACKUP_DIR" "$LOG_DIR"
chmod +x "$SCRIPTS_DIR"/*.sh
echo "  ✓ Directories created"

# Step 2: Enable Docker on boot
echo "[2/5] Enabling Docker auto-start..."
systemctl enable docker
echo "  ✓ Docker enabled on boot"

# Step 3: Create systemd service for auto-start
echo "[3/5] Creating systemd service..."
cat > /etc/systemd/system/school-app.service << EOF
[Unit]
Description=School Management System
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker-compose up
ExecStop=/usr/bin/docker-compose down
Restart=always
RestartSec=15
User=ubuntu
StandardOutput=append:$LOG_DIR/app.log
StandardError=append:$LOG_DIR/app-error.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable school-app
echo "  ✓ Auto-start service created"

# Step 4: Setup daily backup cron (runs at 2:00 AM)
echo "[4/5] Setting up daily backup cron..."
CRON_BACKUP="0 2 * * * $SCRIPTS_DIR/backup.sh >> $LOG_DIR/backup.log 2>&1"
CRON_HEALTH="*/5 * * * * $SCRIPTS_DIR/healthcheck.sh"

# Add crons for ubuntu user (won't duplicate if already exists)
(crontab -u ubuntu -l 2>/dev/null | grep -v "backup.sh" | grep -v "healthcheck.sh"; \
 echo "$CRON_BACKUP"; echo "$CRON_HEALTH") | crontab -u ubuntu -
echo "  ✓ Daily backup at 2:00 AM configured"
echo "  ✓ Health check every 5 minutes configured"

# Step 5: Set log rotation
echo "[5/5] Configuring log rotation..."
cat > /etc/logrotate.d/school-app << EOF
$LOG_DIR/*.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
    copytruncate
}
EOF
echo "  ✓ Log rotation configured (14 days)"

echo ""
echo "======================================"
echo " Setup Complete!"
echo "======================================"
echo ""
echo " Backup location : $BACKUP_DIR"
echo " Logs location   : $LOG_DIR"
echo " Backup schedule : Daily at 2:00 AM"
echo " Health check    : Every 5 minutes"
echo " Auto-start      : On server reboot"
echo ""
echo " Run backup manually : bash $SCRIPTS_DIR/backup.sh"
echo " Restore backup      : bash $SCRIPTS_DIR/restore.sh <date>"
echo " View health log     : tail -f $LOG_DIR/healthcheck.log"
echo " View app log        : tail -f $LOG_DIR/app.log"
echo ""
