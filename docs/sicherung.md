# Sicherung und Wiederherstellung

Alle Daten des Shops liegen in genau einem Docker-Volume, eingehängt unter
`/data`:

| Pfad | Inhalt |
|---|---|
| `/data/bulltron.db` | Bestellungen, Rechnungsdaten, Produkte, Texte, Benutzer |
| `/data/media` | alle hochgeladenen Bilder |
| `/data/media/rechnungen` | die Rechnungs-PDFs |
| `/data/sicherung` | die Sicherungen (von den Skripten angelegt) |

Die Rechnungs-PDFs liegen deshalb unter `media`, weil `INVOICE_DIR` nicht
gesetzt ist und die Sammlung dann auf `MEDIA_DIR/rechnungen` zurückfällt.
**Wird `INVOICE_DIR` jemals gesetzt, muss es innerhalb von `MEDIA_DIR` bleiben**,
sonst fallen die Belege aus der Sicherung. `sicherung-pruefen.ts` schlägt in
diesem Fall Alarm.

## Sichern

```
node_modules/.bin/payload run src/scripts/sicherung.ts
```

Es entstehen zwei Dateien je Lauf:

```
/data/sicherung/bulltron-JJJJ-MM-TT-hhmm.db
/data/sicherung/dateien-JJJJ-MM-TT-hhmm.tar.gz
```

Die Datenbank wird mit `VACUUM INTO` weggeschrieben, nicht kopiert. Ein `cp`
auf eine laufende SQLite-Datei ergibt eine Kopie mitten in einer
Schreiboperation — sie lässt sich oft öffnen und ist trotzdem unvollständig.
`VACUUM INTO` liefert einen in sich geschlossenen Stand, auch während
Bestellungen hereinkommen.

Stellschrauben über Umgebungsvariablen:

| Variable | Vorgabe | Bedeutung |
|---|---|---|
| `SICHERUNG_DIR` | `/data/sicherung` | Wohin |
| `SICHERUNG_KEEP` | `14` | Wie viele Stände bleiben |

Ein Stand ist ein Zeitstempel, also das Paar aus Datenbank und Archiv. Ältere
werden gelöscht, der frisch erzeugte nie.

Das Skript endet mit Rückgabewert 1, wenn Datenbank oder Archiv fehlen. Fehlt
nur das Archiv, ist die Datenbank trotzdem gesichert.

## Prüfen

```
node_modules/.bin/payload run src/scripts/sicherung-pruefen.ts
node_modules/.bin/payload run src/scripts/sicherung-pruefen.ts /data/sicherung/bulltron-2026-10-09-0300.db
```

Ohne Angabe wird der jüngste Stand geprüft. Das Skript öffnet die Kopie, lässt
SQLite die Datei vollständig durchrechnen (`PRAGMA integrity_check`), zählt
Bestellungen, Rechnungen, Produkte, Gutscheine, Teams und Benutzer, nennt die
letzte vergebene Rechnungsnummer und liest das Archiv einmal durch. Es schreibt
nichts.

Die Zahl der Rechnungs-PDFs im Archiv wird gegen die Zahl der Rechnungen in der
Datenbank gehalten. Vor der ersten Bestellung sind null PDFs richtig; sobald
Rechnungen erfasst sind, müssen die Belege mit drin sein.

**Einmal im Monat laufen lassen.** Eine Sicherung, die nie geöffnet wurde, ist
eine Vermutung.

## Nächtlich laufen lassen

In Coolify bei der Anwendung unter *Scheduled Tasks* eine Aufgabe anlegen:

- Name: `Sicherung`
- Befehl: `node_modules/.bin/payload run src/scripts/sicherung.ts`
- Zeitplan: `15 3 * * *`
- Container: der Anwendungscontainer (falls das Feld abgefragt wird, steht der
  Name auf der Übersicht der Anwendung)

Die Uhrzeit liegt bewusst nicht auf der vollen Stunde — dort drängen sich die
geplanten Aufgaben aller Projekte auf dem Server.

## Zweiter Ablageort: All-Inkl per FTPS

`/data/sicherung` liegt auf demselben Volume wie die Daten. Das schützt vor
einer missglückten Migration, einem versehentlichen Löschen und einer kaputten
Einspielung — **nicht vor dem Verlust des Volumes oder des Servers.** Rechnungen
unterliegen in Deutschland einer langen Aufbewahrungspflicht; was genau gilt,
sagt der Steuerberater. Eine einzige Kopie auf demselben Datenträger genügt in
keiner Auslegung.

Ursprünglich war SFTP vorgesehen. All-Inkl gibt SSH erst ab dem Premium-Tarif
her, deshalb jetzt **FTP mit TLS (FTPS, explizit)**: Die Verbindung wird im
Klartext geöffnet und sofort per `AUTH TLS` verschlüsselt. Kann der Server das
nicht, scheitert der Aufbau — es gibt **keinen** Rückfall auf Klartext.

| Variable | Pflicht | Bedeutung |
|---|---|---|
| `SICHERUNG_FTP_HOST` | ja | z. B. `w0176ba0.kasserver.com` |
| `SICHERUNG_FTP_USER` | ja | ein FTP-Benutzer aus dem KAS |
| `SICHERUNG_FTP_PASSWORD` | ja | dessen Passwort |
| `SICHERUNG_FTP_DIR` | nein | Zielverzeichnis, Vorgabe `/sicherung` |
| `SICHERUNG_FTP_PORT` | nein | Vorgabe 21 |
| `SICHERUNG_FTP_TLS_UNGEPRUEFT` | nein | `1` nimmt ein Zertifikat an, das nicht zum Namen passt |

Die alten Namen `SICHERUNG_SFTP_*` werden weiterhin gelesen, damit eine
bestehende Einrichtung nicht stillschweigend aufhört zu arbeiten. Das Protokoll
sagt es, wenn sie greifen. Bei Gelegenheit umbenennen.

Fehlen Host, Benutzer oder Passwort, bleibt es bei der Kopie auf dem Server und
das Protokoll sagt das. Scheitert der Upload, obwohl er eingerichtet ist, endet
der Lauf mit 1 — die lokale Sicherung ist dann trotzdem geschrieben.

### Erst die Verbindung prüfen

Eine Zugangsdatenprüfung soll keine 90 MB kosten:

```
SICHERUNG_TEST=1 node_modules/.bin/payload run src/scripts/sicherung.ts
```

Das baut nur die Verbindung auf, nennt das Startverzeichnis, legt das
Zielverzeichnis an und listet es. Es entsteht keine Sicherung.

Als Umgebungsvariable und nicht als Argument, weil `payload run` keine
Argumente an das Skript durchreicht — `process.argv` enthält dort nur den
Node-Pfad und den Pfad der Payload-CLI.

Das ausgegebene Startverzeichnis sagt auch, wie `SICHERUNG_FTP_DIR` gemeint
ist: Steht dort `/`, ist der Pfad relativ zum FTP-Heimatverzeichnis.

### Zwei Dinge, die hier schiefgehen

**Das Zielverzeichnis darf nicht im Web-Verzeichnis liegen.** In der Sicherung
stehen Namen, Anschriften und E-Mail-Adressen aller Kunden. Läge sie unter
`htdocs`, könnte sie jeder herunterladen, der den Dateinamen errät. Also ein
Verzeichnis *neben* dem Web-Verzeichnis.

**Das Zertifikat.** Passt das ausgelieferte Zertifikat nicht zum Hostnamen,
bricht der Aufbau mit einer Zertifikatsmeldung ab. Erst dann ist
`SICHERUNG_FTP_TLS_UNGEPRUEFT=1` ein Thema — die Verbindung bleibt verschlüsselt,
nur nicht mehr überprüft, und das Protokoll weist in jedem Lauf darauf hin.
Nicht vorsorglich setzen.

Empfehlenswert ist ein eigener FTP-Benutzer im KAS, der nur auf das
Sicherungsverzeichnis darf, statt des Haupt-FTP-Zugangs.

## Wiederherstellen

Nur mit angehaltener Anwendung. Eine SQLite-Datei unter einem laufenden Prozess
auszutauschen, hinterlässt einen Stand, den niemand mehr auseinandersortiert.

1. In Coolify **Stop** drücken und warten, bis der Container wirklich steht.
2. Den bestehenden Stand beiseitelegen, nicht überschreiben — er ist die einzige
   Spur dessen, was zwischen der Sicherung und dem Schaden passiert ist:
   ```
   mv /data/bulltron.db /data/bulltron.db.vor-wiederherstellung
   mv /data/media       /data/media.vor-wiederherstellung
   ```
3. Den gewünschten Stand zurückspielen:
   ```
   cp /data/sicherung/bulltron-JJJJ-MM-TT-hhmm.db /data/bulltron.db
   tar -xzf /data/sicherung/dateien-JJJJ-MM-TT-hhmm.tar.gz -C /data
   ```
   Das Archiv enthält den Ordner `media/` als obersten Eintrag, `-C /data` legt
   ihn also wieder an die richtige Stelle.
4. **Start** drücken.
5. Danach im Backend die letzte Rechnungsnummer ansehen. Alles, was nach dem
   Zeitpunkt der Sicherung bestellt wurde, fehlt jetzt — die Zahlungen stehen
   aber weiter in Stripe. Diese Bestellungen lassen sich aus Stripe
   nachvollziehen und von Hand nachtragen.

Punkt 5 ist der Grund für die nächtliche Sicherung: Der Verlust beträgt im
schlimmsten Fall einen Tag Bestellungen, und für die gibt es in Stripe eine
zweite Spur.
