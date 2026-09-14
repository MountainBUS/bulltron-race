#!/usr/bin/env bash
#
# Update mit einem neuen ZIP, ohne Inhalte und Bilder zu verlieren.
#
#   bash update.sh /root/bulltron-race-shop.zip
#
set -euo pipefail

APP_DIR="/var/www/bulltron-race"
APP_USER="bulltron"
ZIP_PATH="${1:?Pfad zum ZIP angeben, z. B. /root/bulltron-race-shop.zip}"
STAMP=$(date +%Y%m%d-%H%M%S)

echo "==> Sicherung nach /var/backups/bulltron-race-${STAMP}"
mkdir -p "/var/backups/bulltron-race-${STAMP}"
cp "$APP_DIR/bulltron.db" "/var/backups/bulltron-race-${STAMP}/" 2>/dev/null || true
cp "$APP_DIR/.env"        "/var/backups/bulltron-race-${STAMP}/" 2>/dev/null || true
tar -czf "/var/backups/bulltron-race-${STAMP}/media.tar.gz" -C "$APP_DIR" public/media 2>/dev/null || true

echo "==> Neuen Code entpacken"
TMP=$(mktemp -d)
unzip -q "$ZIP_PATH" -d "$TMP"

# Diese drei Dinge gehören dem Server, nicht dem ZIP:
#   .env            Konfiguration inklusive Stripe-Schlüssel
#   bulltron.db     alle Inhalte und Bestellungen
#   public/media    die hochgeladenen Bilder
rsync -a --delete \
  --exclude '.env' \
  --exclude 'bulltron.db' \
  --exclude 'bulltron.db-*' \
  --exclude 'public/media' \
  --exclude 'node_modules' \
  "$TMP/bulltron-race/" "$APP_DIR/"
rm -rf "$TMP"

echo "==> Abhängigkeiten und Build"
cd "$APP_DIR"
npm ci --no-audit --no-fund
npm run build
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

echo "==> Neustart"
systemctl restart bulltron-race
sleep 4
systemctl is-active --quiet bulltron-race && echo "Läuft." || {
  echo "FEHLER: Dienst startet nicht. Log: journalctl -u bulltron-race -n 50" >&2
  exit 1
}
