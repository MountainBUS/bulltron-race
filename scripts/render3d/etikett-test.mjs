import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 920, height: 2200 } })
const fehler = []
p.on('console', (m) => console.log('  ' + m.text().slice(0,600)))
p.on('pageerror', (e) => fehler.push(e.message))
await p.goto('http://localhost:8077/etikett.html', { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
await p.screenshot({ path: '/tmp/render3d/etiketten.png', fullPage: true })
console.log(fehler.length ? 'FEHLER: ' + fehler.join(' | ') : 'ok')
await b.close()
