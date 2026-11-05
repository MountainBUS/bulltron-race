/**
 * Nachtrag zu Ehlich Motorsport aus dem Formular „Unsere Rennteams" vom
 * 04.11.2026. Der Eintrag selbst steht seit dem 07.10.2026 im Backend
 * (team-ehlich-motorsport.ts) und war nicht veröffentlicht, weil zwei Dinge
 * fehlten. Beide liefert das Formular jetzt:
 *
 *   1. das Batteriemodell: Race 12 Ah 12,8 V LiFePO4 -> LI12B1000-12-R
 *   2. die Einwilligung zur Nutzung der Bilder und Logos (Haken gesetzt)
 *
 * Dazu die Freigabe „Ja, mit Name und E-Mail-Adresse" für den Ansprechpartner.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/team-ehlich-motorsport-nachtrag.ts
 *
 * MEHRFACH AUSFÜHRBAR: Steht der Nachtrag schon in der internen Notiz,
 * passiert nichts.
 *
 * WAS GEÄNDERT WIRD — und nur das:
 *   - published: an
 *   - contactPublic: an
 *   - am Radical SR3: Batterie verknüpft, „seit" 25.10.2026, „Warum Bulltron"
 *     durch die ausführlichere Antwort aus dem Formular ersetzt, bei den
 *     Umbauten „Karosserie aus GFK und Carbon" ergänzt
 *   - interne Notiz: Nachtrag oben, die alte Notiz bleibt darunter stehen
 *
 * Alles andere — Vorstellung, Fahrzeugdaten, Bilder, zweites Fahrzeug —
 * bleibt, wie es im Backend steht, auch wenn dort inzwischen jemand von Hand
 * etwas geändert hat. Die Arrays werden mit ihren IDs zurückgeschrieben.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const MARKE = 'NACHTRAG 05.11.2026'

const payload = await getPayload({ config })

const treffer = await payload.find({
  collection: 'teams',
  where: { slug: { equals: 'ehlich-motorsport' } },
  limit: 1,
  depth: 0,
  overrideAccess: true,
})
const team = treffer.docs[0] as Record<string, any> | undefined
if (!team) {
  payload.logger.error('Ehlich Motorsport steht nicht im Backend. Zuerst team-ehlich-motorsport.ts ausführen.')
  process.exit(1)
}
if (String(team.internalNote ?? '').includes(MARKE)) {
  payload.logger.info('Der Nachtrag ist bereits eingetragen — es wird nichts geändert.')
  process.exit(0)
}

const produkt = await payload.find({
  collection: 'products',
  where: { sku: { equals: 'LI12B1000-12-R' } },
  limit: 1,
  depth: 0,
  overrideAccess: true,
})
const batterie = produkt.docs[0]?.id as number | undefined
if (!batterie) payload.logger.warn('Produkt LI12B1000-12-R nicht gefunden — Batterie wird als Freitext eingetragen.')

const fahrzeuge = (team.vehicles ?? []) as Record<string, any>[]
const radical = fahrzeuge.findIndex((f) => f.manufacturer === 'Radical')
if (radical === -1) {
  payload.logger.error('Am Eintrag steht kein Fahrzeug des Herstellers Radical — abgebrochen, ohne etwas zu ändern.')
  process.exit(1)
}

const umbau = String(fahrzeuge[radical].modifications ?? '').trim()
const zusatz = 'Karosserie aus GFK und Carbon.'

fahrzeuge[radical] = {
  ...fahrzeuge[radical],
  ...(batterie ? { battery: batterie, batteryOther: null } : { batteryOther: 'Race 12 Ah, 12,8 V LiFePO4' }),
  since: '25.10.2026',
  reason:
    'Die Preis-Leistung hat uns überzeugt. Wir haben die Batterie bei einem Rennwochenende bei Time Attack im Einsatz gesehen und wollten Gewicht reduzieren, durch das kleine Gewicht von 1,3 kg war die Batterie die perfekte Wahl.',
  modifications: umbau.includes('GFK') ? umbau : [umbau, zusatz].filter(Boolean).join(' '),
}

const nachtrag = [
  `${MARKE} aus dem Formular „Unsere Rennteams", Eingang 04.11.2026:`,
  '',
  '- VERÖFFENTLICHT. Die beiden Gründe vom 07.10. sind erledigt: Batteriemodell genannt (Race 12 Ah, 12,8 V LiFePO4, verknüpft mit LI12B1000-12-R, im Einsatz seit 25.10.2026), Einwilligung zur Bildnutzung im Formular bestätigt.',
  '- Ansprechpartner öffentlich: im Formular „Ja, mit Name und E-Mail-Adresse".',
  '- „Warum Bulltron" durch die neue, ausführlichere Antwort ersetzt. Geändert nur „Preis Leistung" → „Preis-Leistung", „TimeAttack" → „Time Attack", „1,3kg" → „1,3 kg". Die 1,3 kg stimmen mit den Produktdaten überein.',
  '- Bildnachweis laut Formular: „Ring Race Shoot – Rebekka Winter" und eigene Fotos. Welches Bild von wem ist, steht nicht dabei — deshalb an keinem Bild eingetragen. Neue Bilder kommen per E-Mail an info@bulltron-race.de; wer darauf zu sehen ist, schreibt das Team dazu.',
  '- Rennserie im Formular: „Rundstrecke-Sportwagen Sprint / Race-Taxi". Das Feld bleibt beim bisherigen, ausführlicheren Wortlaut.',
  '',
  'Nicht übernommen:',
  '- Erfahrungen: „Wir haben 1 1/5 Jahre Erfahrung im Sportwagen Sprint und 1 Jahr im Taxifahrten Bereich." — „1 1/5" ist unklar (wohl 1,5) und die Antwort betrifft das Team, nicht die Batterie. Bitte nachfragen.',
  '- Webseite: im Formular https://ehlichmotorsport.de. Am 07.10. lieferte die Adresse keine Seite aus; am 05.11. von hier aus nicht prüfbar. Bitte im Browser ansehen und erst dann eintragen.',
  '- Kurzvorstellung aus dem Formular ist eine Kurzfassung der bestehenden und ändert nichts.',
  '',
  '--- Notiz vom 07.10.2026 (Stand damals) ---',
  '',
].join('\n')

await payload.update({
  collection: 'teams',
  id: team.id,
  overrideAccess: true,
  data: {
    published: true,
    contactPublic: true,
    vehicles: fahrzeuge,
    internalNote: nachtrag + String(team.internalNote ?? ''),
  } as never,
})

payload.logger.info(
  `Ehlich Motorsport (ID ${team.id}) aktualisiert und veröffentlicht: Batterie ${batterie ? 'verknüpft' : 'als Freitext'}, Ansprechpartner öffentlich.`,
)
process.exit(0)
