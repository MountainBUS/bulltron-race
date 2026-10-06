/**
 * Trägt beim Rennteam 2-Takt Monkeys Fahrzeug, Ergebnisse, frühere Erfolge und
 * kommende Termine nach.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/team-2-takt-monkeys-fahrzeug.ts
 *
 * Eigenes Skript statt einer Erweiterung von `team-2-takt-monkeys.ts`, weil der
 * Eintrag auf der Dev längst steht: Das Anlegeskript steigt bei vorhandenem
 * Team aus, damit ein zweiter Lauf keine redaktionelle Arbeit überschreibt.
 * Auf einer frischen Instanz laufen beide nacheinander, erst anlegen, dann das
 * hier.
 *
 * MEHRFACH AUSFÜHRBAR, und zwar vorsichtig: Jeder Block wird nur geschrieben,
 * wenn er im Backend noch leer ist. Hat jemand dort inzwischen etwas eingetragen
 * oder geändert, bleibt es unangetastet; das Skript sagt am Ende, was es
 * übersprungen hat.
 *
 * QUELLE ist die Zuschrift des Teams vom 06.10.2026. Die Texte stehen so da,
 * wie das Team sie geschrieben hat; geändert habe ich nur offensichtliche
 * Tippfehler („Spax Fahrwerk,m Sonderanfertigung").
 *
 * ZWEI ANGABEN HAT MARCO ENTSCHIEDEN, weil sie aus der Zuschrift nicht
 * hervorgingen:
 *   - Die Batterie ist in der Zuschrift nur als „Race 55Ah" genannt. Es gibt
 *     zwei Modelle mit 55 Ah, 1400 A und 6,5 kg, die sich allein im Gehäuse
 *     unterscheiden. Marco hat das L1-Gehäuse bestätigt.
 *   - Bei den früheren Erfolgen stand „Trabantrennen Pausa 2029 — Platz 12".
 *     2029 liegt in der Zukunft und kann als vergangener Erfolg nicht stimmen;
 *     gemeint war 2019, von Marco bestätigt.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const payload = await getPayload({ config })

const team = (
  await payload.find({
    collection: 'teams',
    where: { slug: { equals: '2-takt-monkeys' } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
).docs[0] as Record<string, any> | undefined

if (!team) {
  payload.logger.error('2-Takt Monkeys steht nicht im Backend — bitte zuerst team-2-takt-monkeys.ts ausführen.')
  process.exit(1)
}

/* Die Batterie wird über die Artikelnummer gesucht, nicht über den Namen:
   Namen ändern sich redaktionell, die SKU nicht. Fehlt das Produkt wider
   Erwarten, trägt das Freitextfeld die Angabe, damit die Seite nicht ohne
   Batterieangabe dasteht. */
const SKU = 'LI55B1400-12-RL1'
const batterie = (
  await payload.find({ collection: 'products', where: { sku: { equals: SKU } }, limit: 1, depth: 0, overrideAccess: true })
).docs[0]?.id as number | undefined
if (!batterie) payload.logger.warn(`Produkt ${SKU} nicht gefunden — die Batterie wird als Freitext eingetragen.`)

const fahrzeug = {
  manufacturer: 'Trabant',
  model: 'P601S',
  /* „ca." steht hier bewusst: Das Team hat es selbst so angegeben, weil der
     Wagen aus zwei defekten Fahrzeugen aufgebaut wurde und das Baujahr noch
     nachgesehen werden muss. */
  year: 'ca. 1978',
  engine: '2-Zylinder-Zweitakter, 595 ccm, ca. 55–60 PS (serienmäßig 26 PS)',
  modifications: [
    'Komplettumbau: Käfig, Karosserie verstärkt, keine Lichtmaschine — gefahren wird rein mit Batteriespannung,',
    'Spax-Fahrwerk als Sonderanfertigung, umgeschweißte Felgen, Getriebe mit geänderter Übersetzung,',
    'nahezu alle Komponenten verstärkt.',
  ].join(' '),
  ...(batterie ? { battery: batterie } : { batteryOther: 'Race 55 Ah L1' }),
  since: '2026',
  reason:
    'Der Trabant ist vorn deutlich schwerer als hinten, da vorn Motor, Tank und Batterie sitzen. Dadurch fährt er sehr kopflastig. Es gab die Überlegung, die Batterie in den Innenraum zu setzen, aber dank des Gewichts der Bulltron ist das nicht mehr nötig.',
  experience:
    'Die Batterie macht absolut keine Probleme und kommt auch mit der relativ einfachen Elektronik super klar. Plug and Play.',
}

/* Ergebnisse und Termine sortiert das Frontend selbst — Ergebnisse nach Datum
   absteigend, Termine aufsteigend und ohne bereits vergangene. Die früheren
   Erfolge nicht, deshalb stehen sie hier aufsteigend, wie beim Team AC Racing. */
const ergebnisse = [
  {
    date: '2026-09-06',
    event: 'Dreschfest Loitzschütz',
    placement: 'Platz 1 im D-Finale, danach Ausfall (Kupplungsschaden)',
  },
]

const erfolge = [
  { year: '2017', title: 'Trabantrennen Pausa — Platz 6' },
  { year: '2019', title: 'Trabantrennen Pausa — Platz 12' },
  { year: '2023', title: 'Dreschfest Loitzschütz — Platz 22' },
  { year: '2024', title: 'Dreschfest Loitzschütz — Platz 30' },
  { year: '2025', title: 'Dreschfest Loitzschütz — Platz 51' },
]

const termine = [
  {
    /* Das Team schreibt „eventuell … (wenn es stattfindet)". Der Vorbehalt
       gehört sichtbar in den Namen, denn das Terminfeld kennt keine Notiz. */
    date: '2027-05-02',
    event: '12hours of Racing Höchstädt (ob die Veranstaltung stattfindet, ist noch offen)',
    track: 'Höchstädt',
  },
  {
    date: '2027-09-05',
    event: 'Dreschfest Loitzschütz — Trabi-Rallye',
    track: 'Loitzschütz',
    /* Am 06.10.2026 abgerufen und erreichbar: „Die Trabi-Rallye (seit 1993) —
       Dreschfestverein Loitzschütz e.V." */
    url: 'https://dreschfest-verein.loitzschuetz.de/dreschfest/trabi-rallye/',
  },
]

/* --- Schreiben, aber nur was leer ist ------------------------------------- */
const leer = (wert: unknown): boolean => !Array.isArray(wert) || wert.length === 0

const daten: Record<string, unknown> = {}
const geschrieben: string[] = []
const uebersprungen: string[] = []

const setzen = (feld: string, wert: unknown[], beschreibung: string) => {
  if (leer(team[feld])) {
    daten[feld] = wert
    geschrieben.push(beschreibung)
  } else {
    uebersprungen.push(`${beschreibung} — im Backend stehen schon ${(team[feld] as unknown[]).length} Einträge`)
  }
}

setzen('vehicles', [fahrzeug], 'Fahrzeug Trabant P601S')
setzen('results', ergebnisse, 'Ergebnis der Saison 2026')
setzen('pastAchievements', erfolge, `${erfolge.length} frühere Erfolge`)
setzen('upcoming', termine, `${termine.length} kommende Termine`)

if (Object.keys(daten).length > 0) {
  await payload.update({ collection: 'teams', id: team.id, data: daten as never, overrideAccess: true })
}

if (geschrieben.length === 0) {
  payload.logger.info('Nichts zu tun — alle vier Blöcke sind im Backend schon gefüllt.')
} else {
  payload.logger.info('Eingetragen:')
  for (const z of geschrieben) payload.logger.info('  - ' + z)
}
for (const z of uebersprungen) payload.logger.warn('Übersprungen: ' + z)

payload.logger.info(
  batterie
    ? `Batterie verknüpft: ${SKU} (Produkt-ID ${batterie}) — die Teamseite verlinkt damit auf das Produkt.`
    : `Batterie als Freitext eingetragen, weil ${SKU} nicht gefunden wurde.`,
)
process.exit(0)
