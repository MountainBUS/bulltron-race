#!/usr/bin/env bash
#
# Erstinstallation von dev.bulltron-race.de auf einem frischen Debian- oder
# Ubuntu-Server mit Root-Zugang.
#
# Vorher: bulltron-race-shop.zip per SFTP nach /root/ hochladen.
# Dann:   bash setup-server.sh
#
# Das Skript bricht bei jedem Fehler ab, statt halb fertig weiterzulaufen.
set -euo pipefail

DOMAIN="dev.bulltron-race.de"
APP_DIR="/var/www/bulltron-race"
APP_USER="bulltron"
ZIP_PATH="${1:-/root/bulltron-race-shop.zip}"

echo "==> 1/8  Systempakete"
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg unzip nginx apache2-utils certbot python3-certbot-nginx

echo "==> 2/8  Node.js 22"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
node -v

echo "==> 3/8  Benutzer und Verzeichnis"
id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
mkdir -p "$APP_DIR"

echo "==> 4/8  Anwendung entpacken"
if [ ! -f "$ZIP_PATH" ]; then
  echo "FEHLER: $ZIP_PATH nicht gefunden. Das ZIP zuerst per SFTP hochladen." >&2
  exit 1
fi
TMP=$(mktemp -d)
unzip -q "$ZIP_PATH" -d "$TMP"
cp -r "$TMP"/bulltron-race/. "$APP_DIR"/
rm -rf "$TMP"

echo "==> 5/8  Konfiguration"
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  SECRET=$(openssl rand -base64 32)
  sed -i "s|^PAYLOAD_SECRET=.*|PAYLOAD_SECRET=${SECRET}|" "$APP_DIR/.env"
  sed -i "s|^NEXT_PUBLIC_SERVER_URL=.*|NEXT_PUBLIC_SERVER_URL=https://${DOMAIN}|" "$APP_DIR/.env"
  echo "    .env angelegt, PAYLOAD_SECRET erzeugt."
else
  echo "    .env existiert bereits, bleibt unverändert."
fi

echo "==> 6/8  Abhängigkeiten und Build"
cd "$APP_DIR"
npm ci --no-audit --no-fund
if [ ! -f "$APP_DIR/bulltron.db" ]; then
  echo "    Erste Installation — Inhalte werden angelegt."
  npm run seed
else
  echo "    Datenbank vorhanden, Seed wird übersprungen."
fi
npm run build
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

echo "==> 7/8  Dienst einrichten"
cp "$APP_DIR/deploy/bulltron-race.service" /etc/systemd/system/bulltron-race.service
systemctl daemon-reload
systemctl enable --now bulltron-race
sleep 4
systemctl is-active --quiet bulltron-race && echo "    Dienst läuft." || {
  echo "FEHLER: Dienst startet nicht. Log ansehen mit: journalctl -u bulltron-race -n 50" >&2
  exit 1
}

echo "==> 8/8  nginx und Passwortschutz"
if [ ! -f /etc/nginx/.htpasswd-bulltron ]; then
  PASS=$(openssl rand -base64 12)
  htpasswd -bc /etc/nginx/.htpasswd-bulltron bulltron "$PASS" >/dev/null 2>&1
  echo "    Zugangsdaten für die Vorschau:  bulltron / $PASS"
  echo "    (Jetzt notieren — das Passwort steht nirgends sonst.)"
fi
cp "$APP_DIR/deploy/nginx-dev.bulltron-race.de.conf" "/etc/nginx/sites-available/${DOMAIN}"
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo
echo "Fertig. Nächste Schritte:"
echo "  1. In KAS den A-Record von ${DOMAIN} auf die IP dieses Servers setzen."
echo "  2. Warten, bis die Domain auflöst:  dig +short ${DOMAIN}"
echo "  3. TLS holen:  certbot --nginx -d ${DOMAIN}"
echo "  4. Backend:    https://${DOMAIN}/admin"
echo "                 admin@bulltron-race.de / BulltronRace2026!  — sofort ändern."
