#!/usr/bin/env bash
# Exportiert die laufende Anwendung als statische Seite für den Webspace.
#
# Wichtig: wget schreibt mit --convert-links auch die Asset-Pfade auf relativ
# um. Die Next.js-Laufzeit leitet daraus die Adressen der nachgeladenen
# JavaScript-Chunks ab und findet sie dann nicht mehr — React hydriert nicht,
# und alles Interaktive (mobiles Menü, Galerie, Warenkorb) bleibt tot.
# Deshalb werden die Asset-Pfade hinterher wieder auf absolut gesetzt.
set -euo pipefail

ZIEL="${1:?Zielverzeichnis angeben}"
QUELLE="http://localhost:3000"

rm -rf "$ZIEL" && mkdir -p "$ZIEL" && cd "$ZIEL"

wget --quiet --mirror --page-requisites --adjust-extension --convert-links \
  --no-host-directories --no-parent \
  --reject-regex '/admin|/shop/api|/api/graphql|/warenkorb|/kasse|/bestellung' \
  "$QUELLE/" "$QUELLE/produkte" \
  "$QUELLE/motorsportbatterien" "$QUELLE/rennsportbatterien" "$QUELLE/motorradbatterien" \
  "$QUELLE/datenschutz" "$QUELLE/impressum" "$QUELLE/agb"

curl -s "$QUELLE/sitemap.xml" -o sitemap.xml
curl -s "$QUELLE/gibt-es-nicht" -o 404.html

# Asset-Pfade wieder absolut machen (Seitenlinks bleiben relativ auf .html,
# damit die Navigation auch ohne mod_rewrite funktioniert).
find . -name '*.html' -print0 | xargs -0 sed -i \
  -e 's#\(src\|href\)="\(\.\./\)*_next/#\1="/_next/#g' \
  -e 's#\(src\|href\)="\(\.\./\)*api/media/#\1="/api/media/#g'

echo "Export fertig: $(find . -name '*.html' | wc -l) Seiten, $(find . -type f | wc -l) Dateien"
