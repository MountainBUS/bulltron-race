# Redaktionshandbuch BULLTRON RACE

Kurzanleitung für alle, die Inhalte auf bulltron-race.de pflegen.
Backend: `https://www.bulltron-race.de/admin`

---

## Aufbau des Backends

Links in der Navigation stehen vier Bereiche:

- **Inhalte** — Startseite, Seiten (Datenschutz, Impressum, AGB), Medien, Website-Einstellungen
- **Shop** — Produkte, Kategorien, Händler, Bestellungen
- **System** — Benutzerkonten

Jede Änderung wird mit „Speichern“ oben rechts sofort veröffentlicht.

---

## Produkt anlegen oder ändern

`Shop → Produkte → Neu`

Die Eingabemaske ist in Reiter aufgeteilt:

**Überblick**
- *Produktname* — erscheint als Überschrift, z. B. „Race 27 Ah“
- *Untertitel* — die Zeile darunter, z. B. „12 V Lithium-Starterbatterie“
- *Badge* — kleines Label auf der Kachel („Bestseller“). Leer lassen heißt: kein Label
- *Kurzbeschreibung* — zwei bis drei Sätze, erscheinen auf der Detailseite und in der Google-Vorschau
- *Eckdaten* — Spannung, Kapazität, Strom, Gewicht. Diese vier Werte erscheinen als Kästchen auf jeder Produktkachel
- *Highlights* — die Häkchenliste auf der Detailseite

**Preis & Versand**
- *Preis* — Bruttopreis in Euro, mit Komma, z. B. `499`
- *Streichpreis* — optional; wird durchgestrichen daneben angezeigt
- *Verfügbarkeit* — steuert die Anzeige und ob der Kaufen-Button aktiv ist. „Ausverkauft“ deaktiviert den Kauf, auch wenn jemand den Artikel noch im Warenkorb hat

**Bilder & Video**
- *Hauptbild* — freigestelltes Produktfoto, am besten als PNG mit transparentem Hintergrund
- *Weitere Bilder* — erscheinen als kleine Vorschaubilder unter dem Hauptbild
- *YouTube-Video* — Link einfügen, egal in welcher Form: `https://youtu.be/ABC`, `https://www.youtube.com/watch?v=ABC` oder nur `ABC`. Das *Vorschaubild* ist das Standbild vor dem Klick. Ohne Video bleibt der Bereich auf der Seite komplett aus

**Beschreibung & Daten**
- *Ausführliche Beschreibung* — Fließtext mit Zwischenüberschriften und Listen
- *Technische Daten* — Zeile für Zeile: links die Bezeichnung, rechts der Wert. Ergibt die Datenblatt-Tabelle
- *Downloads* — Titel und Link, etwa auf ein PDF-Datenblatt

**Rechte Spalte**
- *Status* — „Entwurf“ nimmt das Produkt sofort von der Seite, ohne es zu löschen
- *Kategorie* — bestimmt, auf welcher Übersichtsseite das Produkt erscheint
- *Reihenfolge* — kleinere Zahl steht weiter vorn
- *Auf der Startseite hervorheben* — nimmt das Produkt in die Bestseller-Reihe auf

---

## Startseite bearbeiten

`Inhalte → Startseite`

- **Hero** — Überschrift, der grün hervorgehobene Textteil (muss genau so in der Überschrift vorkommen), Fließtext, zwei Buttons, Produktbild, Kennzahlenleiste
- **Teaser** — der Block mit Bild und Text. Über „Teaser anzeigen“ komplett ein- oder ausblendbar
- **Kategorien** — welche drei Kategorien als Kacheln erscheinen
- **Produkte** — Überschrift und Auswahl der Bestseller. Bleibt die Auswahl leer, erscheinen automatisch alle Produkte mit dem Haken „Auf der Startseite hervorheben“
- **Videos** — bis zu drei YouTube-Videos mit Titel, Kurztext und Vorschaubild
- **Vorteile & Partner** — Kacheln mit auswählbarem Symbol, Partnerlogos, Abschluss-Banner

---

## Kategorieseite bearbeiten

`Shop → Kategorien`

Überschrift, Einleitung und Kopfbild stehen im Reiter *Kopfbereich*. Im Reiter *Inhalt*
stehen die drei Argumente-Kacheln, der Fließtext unterhalb der Produkte und der
FAQ-Bereich. Die Produkte selbst erscheinen automatisch — es genügt, sie im Produkt der
Kategorie zuzuordnen.

Eine neue Kategorie ist sofort unter `bulltron-race.de/<name-der-kategorie>` erreichbar.
Damit sie in der Navigation auftaucht, muss sie unter *Website-Einstellungen → Navigation*
ergänzt werden.

---

## Rechtstexte und weitere Seiten

`Inhalte → Seiten`

Datenschutz, Impressum und AGB liegen hier als normale Textseiten. Das Feld *Stand vom*
erscheint in der rechten Spalte der Seite. Neue Seiten sind direkt über den eingetragenen
URL-Pfad erreichbar und können im Footer verlinkt werden.

---

## Händler und Einbaupartner

`Shop → Händler`

Jeder Eintrag erscheint auf `/haendler` in der Liste und in der Umkreissuche.

**Kopfbereich**

- *Name des Betriebs* — Pflicht, steht als Überschrift auf der Karte
- *Auf der Website anzeigen* — Haken raus, und der Eintrag verschwindet aus der Liste,
  ohne dass Daten verloren gehen. So lassen sich Betriebe vorbereiten oder pausieren
- *Hervorheben* — der Eintrag bekommt einen roten Rahmen und steht ohne aktive
  Umkreissuche weiter oben
- *Status* — Mehrfachauswahl aus „Händler“ und „Einbaupartner“. Danach lässt sich
  auf der Seite filtern
- *Zusätzlicher Status (Freitext)* — eigene Bezeichnung, zum Beispiel „Servicepartner“
  oder „Schulungszentrum“. Erscheint als eigenes Etikett und taucht automatisch als
  eigener Filter auf der Seite auf

**Reiter Anschrift**

Straße, PLZ, Ort und Land. Die Koordinaten für die Umkreissuche ermittelt das System
beim Speichern selbst aus der Postleitzahl — für Deutschland, Österreich und die
Schweiz. Sie stehen darunter zur Kontrolle. Sitzt der Betrieb weitab vom Ortsmittel­punkt,
lassen sich Breiten- und Längengrad von Hand eintragen; dann muss der Haken
*Koordinaten von Hand gesetzt* darunter gesetzt werden, sonst überschreibt sie das
System beim nächsten Speichern.

Ohne Koordinaten erscheint ein Eintrag weiterhin in der Gesamtliste, aber nicht in der
Umkreissuche. Ein Hinweis unter der Liste nennt die Zahl solcher Einträge.

**Reiter Kontakt**

Ansprechpartner, E-Mail, Telefon, Webseite und Öffnungszeiten. Telefon und E-Mail
werden auf der Seite zu anklickbaren Links. Bei der Webseite genügt `beispiel.de` —
das `https://` ergänzt das System. Die Öffnungszeiten dürfen mehrzeilig sein; jede
Zeile erscheint als eigene Zeile.

**Reiter Leistungen**

- *Leistungen* — Mehrfachauswahl (Beratung, Einbau, Werkstatt, Abholung möglich,
  Vor-Ort-Service). Erscheinen als grüne Etiketten auf der Karte
- *Kurzbeschreibung* — zwei bis drei Sätze über den Betrieb
- *Logo* — optional
- *Interne Notiz* — nur im Backend sichtbar, erscheint nirgends auf der Website

**Beispieleinträge löschen**

Nach der Einrichtung liegen drei Einträge „Musterwerkstatt Nord (Beispieleintrag)“ und
so weiter in der Liste. Sie zeigen, wie eine gefüllte Karte aussieht, und sollten
gelöscht werden, sobald die ersten echten Betriebe drin stehen.

---

## Versand, Kontaktdaten, Navigation

`Inhalte → Website-Einstellungen`

- *Navigation* — Hauptmenü, Button oben rechts, Hinweisleiste über dem Header
- *Kontakt* — Telefonnummern, E-Mail und Anschrift, erscheinen im Footer
- *Footer* — die drei Linkspalten
- *Shop & Versand* — Versandkosten, Freigrenze, Lieferländer. Änderungen wirken sofort auf
  Warenkorb und Kasse

---

## Bestellungen

`Shop → Bestellungen`

Jede bezahlte Bestellung erscheint automatisch mit Positionen, Liefer­adresse, Summen und
Bestellnummer. Zahlungsdaten liegen ausschließlich bei Stripe und sind hier bewusst nicht
einsehbar. Der *Status* lässt sich auf „In Bearbeitung“, „Versendet“, „Storniert“ oder
„Erstattet“ setzen — er dient der internen Übersicht und verändert die Zahlung nicht.
Rückerstattungen laufen über das Stripe-Dashboard.

---

## Bilder

Empfohlene Formate:

| Zweck                   | Format | Empfohlene Größe |
|-------------------------|--------|------------------|
| Produktbild             | PNG mit Transparenz | ab 1200 × 900 px |
| Kategorie-Kopfbild      | JPG    | ab 1600 × 1000 px |
| Teaserbild Startseite   | JPG    | ab 1600 × 1200 px |
| Video-Vorschaubild      | JPG    | 1280 × 720 px |

Kleinere Varianten erzeugt das System automatisch. Der *Alternativtext* ist Pflicht — er
wird von Suchmaschinen und Screenreadern gelesen und sollte beschreiben, was zu sehen ist.
