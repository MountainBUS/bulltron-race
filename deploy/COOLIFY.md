# Deployment auf dem Hetzner-Server mit Coolify

Der Server, auf dem second.place läuft, kann diese Anwendung mitführen. Sie bringt
ihr eigenes Dockerfile mit und braucht weder Datenbankserver noch Redis.

---

## Was die Anwendung verbraucht

Gemessen an der fertigen Anwendung, nicht geschätzt:

| Posten                        | Wert                                  |
|-------------------------------|---------------------------------------|
| Arbeitsspeicher im Betrieb    | rund 170 MB                           |
| Arbeitsspeicher beim Build    | kurzzeitig etwa 2 GB                  |
| Image-Größe                   | rund 1,5 GB                           |
| Datenvolume (Start)           | rund 6 MB, wächst mit den Produktbildern |

Vor dem ersten Deploy kurz prüfen, ob der Server das trägt:

```bash
ssh root@178.105.197.247
free -h          # freier Arbeitsspeicher
df -h /          # freier Plattenplatz
docker system df # wie viel Docker belegt
```

Der Build läuft auf dem Server. Wenn dort wenig frei ist, kann er zeitgleich
laufende Dienste verdrängen — zur Sicherheit außerhalb der Hauptzeit deployen.

---

## Warum das Image so groß ist

Bewusste Entscheidung: Im Image bleiben die vollständigen `node_modules`, damit die
Payload-CLI im Container verfügbar ist. Nur dadurch lassen sich Migrationen beim
Start ausführen und der Seed einmalig starten. Ein schlankeres Standalone-Image
könnte das nicht.

---

## Weg 1: über Git (empfohlen)

Coolify ist auf Git gebaut — Deploy per Push, Rollback per Klick, Build-Logs in der
Oberfläche. Der Aufwand liegt einmalig bei etwa zehn Minuten.

1. Privates Repository anlegen (GitHub oder eine andere Quelle, die Coolify kennt)
2. Projektinhalt hineinlegen und pushen:

   ```bash
   cd bulltron-race
   git init
   git add .
   git commit -m "Bulltron Race — Erststand"
   git remote add origin git@github.com:DEIN-KONTO/bulltron-race.git
   git push -u origin main
   ```

   `.gitignore` ist dabei: `.env`, Datenbank und hochgeladene Bilder bleiben außen vor.

3. In Coolify: **New Resource → Application → Private Repository**
4. Build Pack auf **Dockerfile** stellen, Dockerfile-Pfad `/Dockerfile`
5. Port auf **3000** setzen
6. Domain eintragen: `https://dev.bulltron-race.de` — Coolify holt das Zertifikat selbst
7. Umgebungsvariablen setzen (siehe unten). **Vor dem ersten Deploy**, denn zwei
   davon wirken nur zur Bauzeit
8. Persistent Storage anlegen: Pfad im Container **`/data`**
9. Deploy starten

---

## Weg 2: ohne Git, per ZIP

Funktioniert, ist aber Handarbeit bei jedem Update.

```bash
scp bulltron-race-shop.zip root@178.105.197.247:/root/
ssh root@178.105.197.247

mkdir -p /opt/bulltron-race && cd /opt/bulltron-race
unzip -o /root/bulltron-race-shop.zip
cd bulltron-race

cat > .env <<'ENV'
PAYLOAD_SECRET=HIER-EIN-ZUFALLSSTRING
NEXT_PUBLIC_SERVER_URL=https://dev.bulltron-race.de
NEXT_PUBLIC_SHOP_ENABLED=false
DEV_AUTH_USER=bulltron
DEV_AUTH_PASSWORD=HIER-EIN-PASSWORT
ENV

docker compose up -d --build
```

Der Container hört dann auf `127.0.0.1:3001`. Damit er über die Domain erreichbar
wird, muss er an den Proxy von Coolify angebunden werden. Den Netzwerknamen und die
Entrypoint-Bezeichnungen vorher am laufenden System ablesen — sie unterscheiden sich
je nach Coolify-Installation:

```bash
docker inspect coolify-proxy --format '{{json .NetworkSettings.Networks}}' | head -c 400
docker inspect coolify-proxy --format '{{range .Config.Cmd}}{{println .}}{{end}}' | grep entryPoints
```

Anschließend in der `docker-compose.yml` das Netzwerk des Proxys ergänzen und Labels
nach dem dort abgelesenen Schema setzen. Weil diese Namen von der konkreten
Installation abhängen, steht hier bewusst kein fertiger Block: ein falsch geratenes
Label führt dazu, dass Traefik die Anwendung stillschweigend ignoriert.

Kurz gesagt: Weg 1 ist der Grund, warum man Coolify betreibt. Weg 2 arbeitet dagegen.

---

## Umgebungsvariablen in Coolify

Unter **Configuration → Environment Variables**:

| Variable                    | Wert                                                   | Build Variable? |
|-----------------------------|--------------------------------------------------------|-----------------|
| `NEXT_PUBLIC_SERVER_URL`    | `https://dev.bulltron-race.de`                         | **ja**          |
| `NEXT_PUBLIC_SHOP_ENABLED`  | `false`, bis die Stripe-Schlüssel stehen               | **ja**          |
| `PAYLOAD_SECRET`            | langer Zufallsstring, `openssl rand -base64 32`        | nein            |
| `DATABASE_URI`              | `file:/data/bulltron.db`                               | nein            |
| `MEDIA_DIR`                 | `/data/media`                                          | nein            |
| `DEV_AUTH_USER`             | `bulltron`                                             | nein            |
| `DEV_AUTH_PASSWORD`         | frei gewählt — schützt die gesamte Dev-Instanz         | nein            |
| `STRIPE_SECRET_KEY`         | Testschlüssel `sk_test_…`                              | nein            |
| `STRIPE_WEBHOOK_SECRET`     | `whsec_…` aus dem Stripe-Webhook                       | nein            |
| `SEED_ON_START`             | beim **ersten** Deploy `true`, danach löschen          | nein            |
| `SMTP_HOST`                 | Mailserver, z. B. `smtp.example.de`                    | nein            |
| `SMTP_PORT`                 | `587` (STARTTLS) oder `465` (TLS), Vorgabe `587`       | nein            |
| `SMTP_USER`                 | Postfachkennung                                        | nein            |
| `SMTP_PASSWORD`             | Postfachkennwort                                       | nein            |
| `MAIL_FROM`                 | Absenderadresse, muss zum Postfach passen              | nein            |
| `MAIL_FROM_NAME`            | Absendername, Vorgabe `BULLTRON RACE`                  | nein            |
| `MAIL_SHOP`                 | Empfänger der internen Benachrichtigung; leer = die E-Mail-Adresse aus den Website-Einstellungen | nein |

`DATABASE_URI` und `MEDIA_DIR` sind im Dockerfile bereits so vorbelegt. Sie hier
trotzdem einzutragen macht sichtbar, wo die Daten liegen.

### Ohne SMTP geht keine Bestellbestätigung raus

Fehlt `SMTP_HOST` oder `MAIL_FROM`, bleibt der Mailadapter aus und Payload
schreibt Mails nur ins Protokoll. Für die Entwicklung ist das richtig, für den
Livebetrieb nicht: § 2 Abs. 3 der AGB sagt dem Kunden die Bestätigung des
Bestelleingangs zu, und § 312i Abs. 1 Nr. 3 BGB verlangt sie. Die Quittung, die
Stripe verschicken kann, ist eine Quittung des Zahlungsdienstleisters und
ersetzt sie nicht. Im Testmodus verschickt Stripe ohnehin keine Quittungen —
laut Stripe-Dokumentation lässt sich dort nur von Hand eine auslösen.

Prüfen lässt sich der Versand am Protokoll des Containers: Ohne Zugang steht
dort nach einer Bestellung „kein SMTP-Zugang hinterlegt", bei einem abgelehnten
Login die Meldung des Mailservers. Der Webhook läuft in beiden Fällen sauber
durch — ein Mailproblem darf keine Bestellung verhindern.

### Die beiden Build-Variablen — bitte nicht übergehen

Alles mit dem Präfix `NEXT_PUBLIC_` schreibt Next.js **beim Build** fest in den
erzeugten Code. Zur Laufzeit gesetzt haben diese Werte keine Wirkung mehr. In
Coolify gibt es dafür je Variable den Schalter **„Build Variable?"** — bei diesen
beiden muss er an sein, sonst baut der Container mit den Vorgabewerten aus dem
Dockerfile.

Nachgeprüft am erzeugten Build: `shopEnabled` steht dort als fester Wert im Code,
nicht als Abfrage der Umgebung. Ohne die Build-Variable stünde ein Shop mit
Warenkorb und Kasse online, dem die Stripe-Schlüssel fehlen. Der Vorgabewert im
Dockerfile ist deshalb `false` — wer den Schalter vergisst, bekommt eine Seite
ohne Kasse statt einer kaputten Kasse.

Zwei Folgen daraus:

- **Domainwechsel heißt Rebuild.** Wenn aus `dev.bulltron-race.de` später
  `www.bulltron-race.de` wird, reicht das Ändern der Variablen nicht. Erst
  `NEXT_PUBLIC_SERVER_URL` anpassen, dann **Advanced → Force Rebuild**.
- **Shop scharf schalten heißt Rebuild.** `NEXT_PUBLIC_SHOP_ENABLED` auf `true`
  setzen und neu bauen lassen, sonst bleibt der Warenkorb aus.

Prüfen lässt sich das nach dem Deploy ohne Umweg:

```bash
curl -s https://dev.bulltron-race.de/produkte | grep -c "In den Warenkorb"
# 0 = Shop aus, >0 = Shop an
```

---

## Persistent Storage

Ohne dieses Volume sind nach jedem Deploy alle Inhalte und Bilder weg.

- **Name:** `bulltron-data`
- **Mount Path im Container:** `/data`

Darin liegen `bulltron.db` und der Ordner `media`.

---

## Der erste Start

Der Container führt beim Hochfahren selbst aus:

1. `payload migrate` — legt das Datenbankschema an oder zieht es nach
2. bei gesetztem `SEED_ON_START=true` den Seed mit Kategorien, Produkten und Rechtstexten
3. `next start`

**Nach dem ersten erfolgreichen Deploy `SEED_ON_START` wieder entfernen.** Der Seed
löscht Produkte, Kategorien, Seiten und Medien, bevor er sie neu anlegt — ein zweiter
Lauf würde alle inzwischen gepflegten Inhalte verwerfen.

Prüfen, ob alles läuft:

```bash
curl -s https://dev.bulltron-race.de/shop/api/health
# {"status":"ok","time":"..."}
```

Der Healthcheck prüft nicht nur den Node-Prozess, sondern auch die Datenbank. Er ist
absichtlich vom Passwortschutz ausgenommen, damit Docker und Coolify ihn erreichen.

---

## Passwortschutz

Der Schutz sitzt in der Anwendung (`src/middleware.ts`), nicht im Proxy. Sobald
`DEV_AUTH_USER` und `DEV_AUTH_PASSWORD` gesetzt sind, verlangt jede Seite eine
Anmeldung — inklusive `/admin`. Ausgenommen bleiben nur:

- `/shop/api/stripe-webhook` — Stripe kann keine Zugangsdaten mitschicken
- `/shop/api/health` — sonst gilt der Container dauerhaft als ungesund

Zusätzlich sendet jede Antwort `X-Robots-Tag: noindex, nofollow, noarchive`.

Für die spätere Live-Instanz beide Variablen einfach leer lassen: dann ist die Seite
offen und die Middleware tut nichts.

---

## Updates

Bei Weg 1: `git push`, Coolify baut automatisch. Bei Änderungen an `package.json`
vorher lokal `npm install` laufen lassen und `package-lock.json` mitcommitten —
sonst bricht `npm ci` im Container ab.

Bei Weg 2: neues ZIP hochladen, entpacken, `docker compose up -d --build`.

Datenbank und Bilder bleiben in beiden Fällen im Volume und werden nicht angefasst.

---

## Sicherung

```bash
docker run --rm -v bulltron-data:/data -v /root/backups:/backup alpine \
  tar -czf /backup/bulltron-$(date +%F).tar.gz -C /data .
```

Zusätzlich die Umgebungsvariablen aus Coolify sichern — die liegen nicht im Volume.
