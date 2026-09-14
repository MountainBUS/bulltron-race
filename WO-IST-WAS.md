# Wo ist was?

Dieses Projekt ist eine Next.js-Anwendung. **Es gibt hier bewusst keine `index.html`
und keine einzelnen HTML-Dateien.** Jede Seite ist eine Datei namens `page.tsx`; das
HTML entsteht beim Start der Anwendung. So funktioniert das Routing:
Der Ordnerpfad unterhalb von `src/app/(frontend)/` ist die URL.

## Seite für Seite

| URL im Browser              | Datei im Projekt                                  |
|-----------------------------|---------------------------------------------------|
| `/`                         | `src/app/(frontend)/page.tsx`                     |
| `/produkte`                 | `src/app/(frontend)/produkte/page.tsx`            |
| `/produkte/<slug>`          | `src/app/(frontend)/produkte/[slug]/page.tsx`     |
| `/haendler`                 | `src/app/(frontend)/haendler/page.tsx`            |
| `/motorsportbatterien`      | `src/app/(frontend)/[slug]/page.tsx`              |
| `/rennsportbatterien`       | dieselbe Datei                                    |
| `/motorradbatterien`        | dieselbe Datei                                    |
| `/datenschutz`              | dieselbe Datei                                    |
| `/impressum`                | dieselbe Datei                                    |
| `/agb`                      | dieselbe Datei                                    |
| `/warenkorb`                | `src/app/(frontend)/warenkorb/page.tsx`           |
| `/kasse`                    | `src/app/(frontend)/kasse/page.tsx`               |
| `/bestellung`               | `src/app/(frontend)/bestellung/page.tsx`          |
| `/admin` (Backend)          | `src/app/(payload)/admin/[[...segments]]/page.tsx`|
| 404-Seite                   | `src/app/(frontend)/not-found.tsx`                |
| `/sitemap.xml`              | `src/app/(frontend)/sitemap.ts`                   |
| `/robots.txt`               | `src/app/robots.ts`                               |

Die sechs Seiten in der Mitte teilen sich eine Datei: `[slug]/page.tsx` schaut
nach, ob der aufgerufene Pfad eine Kategorie oder eine Textseite ist, und rendert
entsprechend. Deshalb entsteht jede neue Kategorie und jede neue Textseite allein
durch das Anlegen im Backend — ohne eine Zeile Code.

## Die restlichen Ordner

| Ordner                    | Inhalt                                                        |
|---------------------------|---------------------------------------------------------------|
| `src/app/(frontend)/globals.css` | Das komplette Design-System. Farben, Abstände und Schriftgrößen stehen als CSS-Variablen ganz oben. |
| `src/components/`         | Header, Footer, Produktkachel, Warenkorb, YouTube-Einbindung   |
| `src/collections/`        | Struktur von Produkten, Kategorien, Seiten, Bestellungen — was im Backend als Eingabemaske erscheint |
| `src/globals/`            | Startseite und Website-Einstellungen (die Einzelstücke im Backend) |
| `src/lib/`                | Datenzugriff, Preisformatierung, Stripe, Versandkosten, Geotabelle |
| `public/daten/geo.json`   | Postleitzahlen und Orte für die Umkreissuche der Händlerseite. Wird mit `node scripts/build-geo.mjs` neu erzeugt. |
| `src/seed/`               | Demo-Inhalte, Rechtstexte, Bildgenerator                       |
| `src/app/(frontend)/shop/api/` | Checkout-Aufruf und Stripe-Webhook                        |

Die runden Klammern in `(frontend)` und `(payload)` sind Next.js-Notation: Sie
gruppieren Dateien, tauchen aber in der URL nicht auf. Die eckigen Klammern in
`[slug]` stehen für einen variablen Teil der URL.

## Anschauen, ohne etwas zu installieren

Dafür gibt es das zweite Paket `bulltron-race-ansicht.zip` mit echten HTML-Dateien
zum Doppelklicken. Das ist ein eingefrorener Abzug — nur zum Ansehen, ohne
funktionierenden Warenkorb und ohne Backend.

## Richtig starten

```bash
npm install
cp .env.example .env      # PAYLOAD_SECRET eintragen
npm run seed              # legt Inhalte und Admin-Zugang an
npm run dev
```

Seite: http://localhost:3000 · Backend: http://localhost:3000/admin
