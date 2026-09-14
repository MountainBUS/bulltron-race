import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets')
fs.mkdirSync(dir, { recursive: true })

const GREEN = '#5aa62e'
const RED = '#e03e51'

/** Stylisiertes Batterie-Rendering im Bulltron-CI als Platzhalter. */
function batterySvg({ capacity, voltage, current, wide = false }) {
  const W = 1200
  const H = 900
  const bw = wide ? 720 : 520
  const bh = wide ? 430 : 520
  const x = (W - bw) / 2
  const y = (H - bh) / 2 + 40
  const depth = 58

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="face" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#242f35"/>
      <stop offset="0.55" stop-color="#161e22"/>
      <stop offset="1" stop-color="#0d1316"/>
    </linearGradient>
    <linearGradient id="top" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2d3a41"/>
      <stop offset="1" stop-color="#1b2429"/>
    </linearGradient>
    <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#111a1e"/>
      <stop offset="1" stop-color="#080c0e"/>
    </linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${RED}"/>
      <stop offset="1" stop-color="#a02539"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.13"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0.02"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="34" stdDeviation="30" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <ellipse cx="${W / 2}" cy="${y + bh + 34}" rx="${bw * 0.56}" ry="26" fill="#000" opacity="0.42"/>

  <g filter="url(#shadow)">
    <!-- Deckel -->
    <path d="M${x} ${y} L${x + depth} ${y - depth} L${x + bw + depth} ${y - depth} L${x + bw} ${y} Z" fill="url(#top)"/>
    <!-- Seite -->
    <path d="M${x + bw} ${y} L${x + bw + depth} ${y - depth} L${x + bw + depth} ${y + bh - depth} L${x + bw} ${y + bh} Z" fill="url(#side)"/>
    <!-- Front -->
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="14" fill="url(#face)"/>
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="14" fill="url(#sheen)"/>
    <rect x="${x + 0.5}" y="${y + 0.5}" width="${bw - 1}" height="${bh - 1}" rx="14" fill="none" stroke="#3a4950" stroke-width="1.5"/>

    <!-- Polklemmen -->
    <g>
      <rect x="${x + bw - 168}" y="${y - depth - 26}" width="52" height="34" rx="6" fill="#8d949a"/>
      <rect x="${x + bw - 168}" y="${y - depth - 26}" width="52" height="12" rx="6" fill="#c3c9cd"/>
      <rect x="${x + 116}" y="${y - depth - 26}" width="52" height="34" rx="6" fill="#8d949a"/>
      <rect x="${x + 116}" y="${y - depth - 26}" width="52" height="12" rx="6" fill="#c3c9cd"/>
      <text x="${x + bw - 142}" y="${y - depth + 30}" font-family="Arial Narrow, Arial" font-size="26" font-weight="bold" fill="#9aa7ac" text-anchor="middle">−</text>
      <text x="${x + 142}" y="${y - depth + 30}" font-family="Arial Narrow, Arial" font-size="26" font-weight="bold" fill="${RED}" text-anchor="middle">+</text>
    </g>

    <!-- Label -->
    <rect x="${x + 34}" y="${y + 44}" width="${bw - 68}" height="8" fill="url(#band)"/>
    <text x="${x + 34}" y="${y + 118}" font-family="Arial Narrow, Arial" font-size="52" font-weight="bold" letter-spacing="3" fill="#eef2f3">BULLTRON</text>
    <text x="${x + 34}" y="${y + 168}" font-family="Arial Narrow, Arial" font-size="52" font-weight="bold" letter-spacing="14" fill="${RED}">RACE</text>

    <text x="${x + 34}" y="${y + bh - 116}" font-family="Arial Narrow, Arial" font-size="96" font-weight="bold" fill="#ffffff">${capacity}</text>
    <text x="${x + 34}" y="${y + bh - 74}" font-family="Arial, Helvetica" font-size="25" letter-spacing="5" fill="#8fa0a7">${voltage} LITHIUM</text>

    <rect x="${x + 34}" y="${y + bh - 56}" width="${Math.min(bw - 68, 286)}" height="30" fill="${GREEN}"/>
    <text x="${x + 48}" y="${y + bh - 34}" font-family="Arial, Helvetica" font-size="19" font-weight="bold" letter-spacing="2" fill="#06210b">${current}</text>

    <text x="${x + bw - 34}" y="${y + bh - 74}" font-family="Arial, Helvetica" font-size="16" letter-spacing="3" fill="#5c6a70" text-anchor="end">MADE IN GERMANY</text>
  </g>
</svg>`
}

function coverSvg({ title, sub, tint = RED }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#131b1f"/>
      <stop offset="1" stop-color="#070a0c"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.68" cy="0.34" r="0.62">
      <stop offset="0" stop-color="${tint}" stop-opacity="0.26"/>
      <stop offset="1" stop-color="${tint}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
      <line x1="0" y1="0" x2="0" y2="46" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)"/>
  <rect width="1600" height="1000" fill="url(#grid)"/>
  <rect width="1600" height="1000" fill="url(#halo)"/>
  <g opacity="0.9">
    <path d="M0 700 L520 700 L640 560 L1600 560" stroke="${tint}" stroke-width="3" fill="none" opacity="0.5"/>
    <path d="M0 760 L470 760 L590 620 L1600 620" stroke="${GREEN}" stroke-width="3" fill="none" opacity="0.35"/>
  </g>
</svg>`
}

function videoThumbSvg({ title, sub, tint = RED }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#151d21"/>
      <stop offset="1" stop-color="#070a0c"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stop-color="${tint}" stop-opacity="0.3"/>
      <stop offset="1" stop-color="${tint}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="38" height="38" patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
      <line x1="0" y1="0" x2="0" y2="38" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect width="1280" height="720" fill="url(#grid)"/>
  <rect width="1280" height="720" fill="url(#halo)"/>
  <rect x="0" y="690" width="1280" height="6" fill="${tint}" opacity="0.65"/>
  <rect x="0" y="690" width="420" height="6" fill="${GREEN}" opacity="0.8"/>
  <text x="640" y="560" text-anchor="middle" font-family="Arial Narrow, Arial" font-size="56" font-weight="bold" letter-spacing="3" fill="#eef2f3">${title}</text>
  <text x="640" y="608" text-anchor="middle" font-family="Arial, Helvetica" font-size="22" letter-spacing="7" fill="${tint}">${sub}</text>
</svg>`
}

/* Alle Ausfuehrungen sind 12,8 V LiFePO4 — die Preisliste 08/2026 kennt keine
   zweite Spannungsreihe. Die Kaltstartstroeme stammen aus derselben Liste.
   Die 118 Ah steht nicht mehr im Sortiment und ist hier entfallen. */
const batteries = [
  { file: 'batterie-4ah.png', capacity: '4 Ah', voltage: '12,8 V', current: '500 A KALTSTART' },
  { file: 'batterie-6ah.png', capacity: '6 Ah', voltage: '12,8 V', current: '650 A KALTSTART' },
  { file: 'batterie-12ah.png', capacity: '12 Ah', voltage: '12,8 V', current: '1000 A KALTSTART' },
  { file: 'batterie-27ah.png', capacity: '27 Ah', voltage: '12,8 V', current: '700 A KALTSTART' },
  { file: 'batterie-55ah.png', capacity: '55 Ah', voltage: '12,8 V', current: '1400 A KALTSTART', wide: true },
  { file: 'batterie-27ah-lifepo.png', capacity: '27 Ah', voltage: '12,8 V', current: '700 A KALTSTART' },
  { file: 'batterie-55ah-lifepo.png', capacity: '55 Ah', voltage: '12,8 V', current: '1400 A KALTSTART', wide: true },
]

const covers = [
  { file: 'cover-motorsport.png', title: 'MOTORSPORT', sub: 'STARTERBATTERIEN' },
  { file: 'cover-rennsport.png', title: 'RENNSPORT', sub: 'LEICHTBAU UND LiFePO4' },
  { file: 'cover-motorrad.png', title: 'MOTORRAD', sub: 'KOMPAKT UND VIBRATIONSFEST', tint: GREEN },
]

const videoThumbs = [
  { file: 'video-kaltstart.png', title: 'KALTSTART BEI −15 °C', sub: 'LITHIUM GEGEN BLEI' },
  { file: 'video-einbau.png', title: 'EINBAU IM RENNWAGEN', sub: 'BEFESTIGUNG UND QUERSCHNITT' },
  { file: 'video-fertigung.png', title: 'AUS DER FERTIGUNG', sub: 'VON DER ZELLE BIS ZUR PRUEFUNG', tint: GREEN },
  { file: 'video-produkt.png', title: 'DIE BATTERIE IM EINSATZ', sub: 'AUF DER STRECKE GETESTET' },
]

for (const battery of batteries) {
  await sharp(Buffer.from(batterySvg(battery))).png().toFile(path.join(dir, battery.file))
}
for (const cover of covers) {
  await sharp(Buffer.from(coverSvg(cover))).png().toFile(path.join(dir, cover.file))
}
for (const thumb of videoThumbs) {
  await sharp(Buffer.from(videoThumbSvg(thumb))).png().toFile(path.join(dir, thumb.file))
}

// Teaser: Batterie vor Werks-Hintergrund komponiert
const teaserBg = await sharp(Buffer.from(coverSvg({ title: '', sub: '' }))).resize(1600, 1200, { fit: 'cover' }).png().toBuffer()
const teaserBattery = await sharp(path.join(dir, 'batterie-55ah.png')).resize(1180, 885, { fit: 'inside' }).png().toBuffer()
await sharp(teaserBg)
  .composite([{ input: teaserBattery, gravity: 'center' }])
  .png()
  .toFile(path.join(dir, 'teaser-werk.png'))

console.log(`${batteries.length + covers.length + videoThumbs.length + 1} Bilder erzeugt in ${dir}`)
