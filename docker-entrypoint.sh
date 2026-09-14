#!/bin/sh
#
# Startreihenfolge im Container:
#   1. Datenbankschema auf den aktuellen Stand bringen
#   2. optional beim allerersten Start die Inhalte anlegen
#   3. Anwendung starten
#
set -e

echo "[start] Migrationen anwenden"
node_modules/.bin/payload migrate

# Beim ersten Deploy einmal SEED_ON_START=true setzen, danach wieder entfernen.
# Der Seed leert Produkte, Kategorien, Seiten und Medien vorher — er darf
# deshalb nie versehentlich ein zweites Mal laufen.
if [ "${SEED_ON_START}" = "true" ]; then
  echo "[start] SEED_ON_START ist gesetzt — Inhalte werden neu angelegt"
  node_modules/.bin/payload run src/seed/index.ts
fi

echo "[start] Anwendung startet auf Port ${PORT:-3000}"
exec node node_modules/next/dist/bin/next start -p "${PORT:-3000}"
