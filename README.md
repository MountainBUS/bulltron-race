# BULLTRON RACE — Shop und Website

Neubau von bulltron-race.de als Next.js-Anwendung mit eingebautem Redaktionssystem
(Payload CMS) und Stripe-Checkout. Frontend, Backend und API liegen in einer einzigen
Anwendung — es gibt keinen zweiten Dienst, der separat betrieben werden muss.

---

## 1. Stack

| Baustein        | Technologie                                   |
|-----------------|-----------------------------------------------|
| Frontend        | Next.js 16 (App Router, React 19)             |
| Redaktion       | Payload CMS 3 (läuft in derselben App)        |
| Datenbank       | SQLite (Standard) oder PostgreSQL             |
| Zahlungen       | Stripe Checkout (Kreditkarte, Apple/Google Pay, Klarna) |
| Schriften       | Barlow / Barlow Condensed, selbst gehostet    |
| Bilder          | Payload-Upload mit automatischen Größen (480 / 900 / 1800 px) |

Keine externen Aufrufe zur Laufzeit außer zu Stripe und — erst nach Klick des Nutzers —
zu YouTube. Schriften kommen vom eigenen Server, es gibt keine Verbindung zu Google Fonts.

---

## 2. Schnellstart

```bash
npm install
cp .env.example .env      # PAYLOAD_SECRET setzen
npm run seed              # Demo-Inhalte, Kategorien, Produkte, Rechtstexte
npm run dev               # http://localhost:3000
```

Backend: `http://localhost:3000/admin`
Zugang nach dem Seed: `admin@bulltron-race.de` / `BulltronRace2026!` — bitte sofort ändern.

### Umgebungsvariablen

```
PAYLOAD_SECRET=            # langer Zufallsstring, z. B. openssl rand -base64 32
DATABASE_URI=file:./bulltron.db
NEXT_PUBLIC_SERVER_URL=https://www.bulltron-race.de
STRIPE_SECRET_KEY=         # sk_live_... bzw. sk_test_...
STRIPE_WEBHOOK_SECRET=     # whsec_...
```

Ohne Stripe-Schlüssel läuft die Seite vollständig; der Checkout meldet dann im Klartext,
dass die Zahlungsanbindung noch fehlt.

---

## 3. Seitenstruktur

| Seite                        | Pfad                        | Quelle im Backend                |
|------------------------------|-----------------------------|----------------------------------|
| Startseite                   | `/`                         | Global „Startseite“              |
| Produktübersicht (alle)      | `/produkte`                 | automatisch aus Produkten        |
| Produktdetailseite           | `/produkte/<slug>`          | Collection „Produkte“            |
| Motorsportbatterien          | `/motorsportbatterien`      | Collection „Kategorien“          |
| Rennsportbatterien           | `/rennsportbatterien`       | Collection „Kategorien“          |
| Motorradbatterien            | `/motorradbatterien`        | Collection „Kategorien“          |
| Datenschutz                  | `/datenschutz`              | Collection „Seiten“              |
| Impressum                    | `/impressum`                | Collection „Seiten“              |
| AGB und Widerrufsbelehrung   | `/agb`                      | Collection „Seiten“              |
| Warenkorb                    | `/warenkorb`                | —                                |
| Kasse (Bestellprüfung)       | `/kasse`                    | —                                |
| Bestellbestätigung           | `/bestellung`               | —                                |
| Backend                      | `/admin`                    | —                                |

Weitere Kategorien oder Textseiten entstehen allein durch Anlegen im Backend; die
zugehörige URL existiert danach automatisch. Kategorien liegen bewusst direkt unter der
Domain (`/motorsportbatterien`), weil das für die Suchmaschinen die stärkere Struktur ist.

`/sitemap.xml` und `/robots.txt` werden aus dem Datenbestand erzeugt.

---

## 4. Was im Backend gepflegt werden kann

**Startseite** (Global): Hero mit Überschrift, hervorgehobenem Wort, Fließtext, zwei
Buttons und Kennzahlenleiste · Teaser-Block mit Bild, Fließtext, Stichpunkten und Button ·
Kategorie-Kacheln · Auswahl der Bestseller-Produkte · bis zu drei YouTube-Videos ·
Vorteilskacheln mit Symbolauswahl · Partner · Abschluss-Banner · SEO.

**Produkte**: Name, Untertitel, Badge, Kurzbeschreibung, Eckdaten (Spannung, Kapazität,
Strom, Gewicht), Highlights, Preis und Streichpreis, Artikelnummer, Verfügbarkeit,
Lieferzeit, Hauptbild und Galerie, **ein YouTube-Video mit Vorschaubild**, ausführliche
Beschreibung, Tabelle technischer Daten, Downloads, SEO.

**Kategorien**: Kopfbereich mit Überschrift, Einleitung und Bild, drei Argumente-Kacheln,
Fließtext unter den Produkten, FAQ-Bereich, SEO.

**Seiten**: freie Textseiten (Datenschutz, Impressum, AGB) mit Editor und Stand-Datum.

**Website-Einstellungen**: Logo, Navigation, Hinweisleiste, Kontaktdaten, Footer-Spalten,
Versandkosten, Freigrenze, Lieferländer, Rechtstext-Verlinkungen.

**Bestellungen**: werden automatisch vom Stripe-Webhook angelegt, mit Positionen,
Adresse, Summen und Status. Zahlungsdaten liegen ausschließlich bei Stripe.

---

## 5. Stripe einrichten

1. Im Stripe-Dashboard den Secret Key kopieren und als `STRIPE_SECRET_KEY` hinterlegen.
2. Webhook-Endpunkt anlegen:
   `https://www.bulltron-race.de/shop/api/stripe-webhook`
   Ereignisse: `checkout.session.completed` und `checkout.session.async_payment_succeeded`.
3. Das dort angezeigte Signing Secret als `STRIPE_WEBHOOK_SECRET` hinterlegen.
4. Zahlungsarten (Karte, Apple Pay, Google Pay, Klarna) im Stripe-Dashboard aktivieren —
   der Code gibt keine Methoden fest vor, Stripe zeigt die aktivierten an.

Lokal testen:

```bash
stripe listen --forward-to localhost:3000/shop/api/stripe-webhook
```

### Wie der Bestellvorgang abläuft

1. Kunde legt Artikel in den Warenkorb (Speicherung im Browser, kein Server-Kontakt).
2. Auf `/kasse` prüft er die Bestellung und bestätigt AGB und Widerrufsbelehrung.
3. Der Button „Zahlungspflichtig bestellen“ ruft `/shop/api/checkout` auf. Dort werden
   **die Preise erneut aus der Datenbank geladen** — Angaben aus dem Browser werden
   ignoriert. Anschließend Weiterleitung zu Stripe.
4. Stripe erhebt Liefer- und Rechnungsadresse, Telefonnummer und die Zahlung.
5. Stripe meldet den Abschluss an den Webhook. Erst dort entsteht die Bestellung im
   Backend — mit Schutz gegen doppelte Zustellung.
6. Der Kunde landet auf `/bestellung`, der Warenkorb wird geleert.

---

## 6. Deployment

Fertige Dateien dafür liegen im Ordner `deploy/`:

| Datei                                | Zweck                                                      |
|--------------------------------------|------------------------------------------------------------|
| `setup-server.sh`                    | Erstinstallation auf einem frischen Debian/Ubuntu-Server    |
| `update.sh`                          | Update mit neuem ZIP, ohne Inhalte und Bilder zu verlieren  |
| `bulltron-race.service`              | systemd-Dienst, startet die App beim Booten neu             |
| `nginx-dev.bulltron-race.de.conf`    | Reverse Proxy inklusive Passwortschutz und noindex          |
| `COOLIFY.md`                         | Deployment auf dem Hetzner-Server mit Coolify               |

Wichtig in der nginx-Konfiguration: der Stripe-Webhook ist vom Passwortschutz
ausgenommen. Ohne diese Ausnahme antwortet der Server Stripe mit 401 und die
Bestellungen kommen nie im Backend an.

**ALL-INKL kann diese Anwendung nicht ausführen.** Weder die Webhosting-Tarife
noch die Managed Server bieten Node.js oder Root-Zugang — ALL-INKL schreibt zu
den Servern ausdrücklich: „Einen Root-Zugang zu dem Server erhalten Sie nicht“.
Die Anwendung braucht einen eigenen Server, etwa einen netcup-VPS. Die Domain
kann weiterhin bei ALL-INKL liegen und per A-Record dorthin zeigen.

Die Anwendung läuft auf jedem Node-Host ab Version 20 (VPS, Docker, Coolify).

```bash
npm ci
npm run build
npm run start          # Port 3000
```

Davor:

- `NEXT_PUBLIC_SERVER_URL` auf die Live-Domain setzen (steuert Canonicals, Sitemap,
  Stripe-Rücksprungadressen).
- Reverse Proxy (nginx/Caddy/Traefik) mit TLS davorschalten.
- Die Verzeichnisse `public/media` und die Datenbankdatei persistent einbinden — sie
  enthalten die hochgeladenen Bilder und alle Inhalte.

### PostgreSQL statt SQLite

SQLite genügt für diesen Shop problemlos. Wer PostgreSQL bevorzugt:

```bash
npm install @payloadcms/db-postgres
```

In `src/payload.config.ts` `sqliteAdapter` gegen `postgresAdapter` tauschen und
`DATABASE_URI` auf die Verbindungszeichenfolge setzen. Der Rest bleibt unverändert.

### Schemaänderungen

Im Entwicklungsbetrieb schreibt Payload Schemaänderungen automatisch in die Datenbank
(`push: true` in `src/payload.config.ts`). Für den Live-Betrieb sollte das auf `false`
gesetzt und mit Migrationen gearbeitet werden:

```bash
npm run migrate:create
npm run migrate
```

---

## 7. Projektstruktur

```
src/
  app/
    (frontend)/          Öffentliche Seiten, Warenkorb, Kasse, Shop-API
    (payload)/           Backend unter /admin und die Payload-REST-API
    robots.ts            robots.txt
  collections/           Produkte, Kategorien, Seiten, Bestellungen, Medien, Benutzer
  globals/               Startseite, Website-Einstellungen
  components/            Header, Footer, Warenkorb, Produktkarte, YouTube-Einbindung
  fields/                Wiederverwendbare Felder (Slug, SEO)
  lib/                   Datenzugriff, Formatierung, Stripe, Versandkosten
  seed/                  Demo-Inhalte, Rechtstexte, Bildgenerator
  app/(frontend)/globals.css   Das komplette Design-System
```

---

## 8. Design

Farben der Bulltron-CI: `#12171a` Schwarz, `#c1272d` Rot, `#5aa62e` Grün.

Rot ist die Primärfarbe und trägt alles Bedienbare: Buttons, Links, Fokusrahmen,
hervorgehobene Wörter in Überschriften, Kennzahlen. Grün ist die Akzentfarbe für
Bestätigung und technische Signale: Häkchenlisten, Verfügbarkeitspunkte,
Produkt-Badges, Vorteils-Symbole. Warnungen laufen bewusst über ein drittes,
bernsteinfarbenes Signal (`--warn`), weil Rot als Markenfarbe nicht mehr als
Alarmfarbe taugt.

Die Tokens heißen entsprechend `--primary*` und `--accent*` — nicht nach der Farbe,
sondern nach der Rolle. Ein Farbwechsel ist damit ein Eingriff an einer Stelle.
Alle Design-Werte stehen als CSS-Variablen am Anfang von `globals.css` — Farben,
Abstände, Schriftgrößen und Schatten lassen sich dort zentral anpassen.

Schriften: Barlow Condensed für Überschriften und Bedienelemente, Barlow für Fließtext.
Beide werden aus dem Projekt ausgeliefert, nicht von Google.

---

## 9. Vor dem Livegang zu erledigen

1. **Produktfotos austauschen.** Die mitgelieferten Batteriebilder sind erzeugte
   Platzhalter im Markenlook. Im Backend unter „Medien“ bzw. direkt am Produkt ersetzen.
2. **Rechtstexte prüfen lassen.** Impressum, Datenschutzerklärung und AGB sind
   vollständig ausformulierte Entwürfe, in denen die Handelsregister- und
   Umsatzsteuer-Angaben noch als Platzhalter stehen. Vor dem Livegang anwaltlich oder
   über einen Dienst wie eRecht24 prüfen lassen.
3. **Kategoriezuordnung bestätigen.** Aktuell: 4/6/12 Ah als Motorrad, 27/55 Ah (12 V) als
   Motorsport, die LiFePO4-Modelle als Rennsport. Im Backend pro Produkt in einem Klick
   änderbar.
4. **YouTube-Links setzen.** Aktuell stehen Beispiel-Videos in den Feldern.
5. **Stripe-Schlüssel und Webhook** wie unter Punkt 5 beschrieben eintragen.
6. **Admin-Passwort ändern** und weitere Redaktionszugänge anlegen.
7. **Bestellbestätigungs-Mails**: Stripe versendet Zahlungsbelege. Für eine eigene
   Bestellbestätigung im Bulltron-Layout einen E-Mail-Adapter in Payload hinterlegen
   (z. B. Nodemailer über den vorhandenen Postausgang).
8. **Weiterleitungen** der alten URLs auf die neuen Pfade im Reverse Proxy einrichten.
