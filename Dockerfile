# syntax=docker/dockerfile:1
#
# Bulltron Race — Next.js 16 mit Payload CMS 3
#
# Bewusst kein "standalone"-Build: im Image bleiben die vollständigen
# node_modules, damit die Payload-CLI im Container verfügbar ist. Nur so lässt
# sich der Seed einmalig ausführen und später `payload migrate` nachziehen.
# Das Image ist dadurch größer, aber betreibbar.

FROM node:22-bookworm-slim AS base
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates openssl curl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- Abhängigkeiten -------------------------------------------------------
# NODE_ENV bleibt hier absichtlich unproduktiv: mit NODE_ENV=production würde
# npm die devDependencies überspringen und der Build scheitert an TypeScript.
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- Build ----------------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Alles mit dem Praefix NEXT_PUBLIC_ schreibt Next beim Build fest in den Code.
# Zur Laufzeit gesetzt haben diese Werte keine Wirkung mehr — sie muessen hier
# als Build-Argument ankommen. In Coolify heisst der Schalter dafuer
# "Build Variable?" und muss bei genau diesen beiden Variablen an sein.
#
# Der Standard fuer den Shop ist bewusst "false": wer die Build-Variable
# vergisst, bekommt eine Seite ohne Warenkorb und ohne Kasse. Andersherum
# stuende ein Shop online, dem die Stripe-Schluessel fehlen.
ARG NEXT_PUBLIC_SERVER_URL=http://localhost:3000
ARG NEXT_PUBLIC_SHOP_ENABLED=false
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL \
    NEXT_PUBLIC_SHOP_ENABLED=$NEXT_PUBLIC_SHOP_ENABLED

# Payload verlangt beim Build ein Secret. Der echte Wert kommt zur Laufzeit
# aus der Umgebung und hat mit diesem hier nichts zu tun.
ENV PAYLOAD_SECRET=nur-fuer-den-build
ENV DATABASE_URI=file:/tmp/build.db
RUN npm run build \
 # Der Turbopack-Cache macht mehrere hundert Megabyte aus und wird zur
 # Laufzeit nicht gebraucht.
 && rm -rf .next/cache

# ---- Laufzeit -------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URI=file:/data/bulltron.db \
    MEDIA_DIR=/data/media

RUN useradd --system --uid 1001 --create-home bulltron
COPY --from=build --chown=bulltron:bulltron /app /app
RUN chmod +x /app/docker-entrypoint.sh

# /data wird als Volume eingebunden und überlebt jedes neue Image:
# darin liegen die Datenbank und alle hochgeladenen Bilder.
RUN mkdir -p /data/media && chown -R bulltron:bulltron /data
VOLUME ["/data"]

USER bulltron
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/shop/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
