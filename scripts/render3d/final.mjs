import { chromium } from 'playwright'
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const W = 2400, H = 1800
const modelle = ['4ah', '12ah', '27ah']
const stile = { studio: 'studio', dunkel: 'dunkel', flach: 'illustration' }
for (const m of modelle) {
  for (const [v, name] of Object.entries(stile)) {
    const page = await b.newPage({ viewport: { width: W, height: H } })
    const fehler = []
    page.on('pageerror', (e) => fehler.push(e.message))
    await page.goto(`http://localhost:8077/szene.html?m=${m}&v=${v}&w=${W}&h=${H}`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => window.fertig === true, { timeout: 120000 }).catch(() => fehler.push('nicht fertig'))
    await page.waitForTimeout(500)
    const datei = `/mnt/user-data/outputs/bulltron-${m}-3d-${name}.png`
    await page.locator('canvas').screenshot({ path: datei })
    console.log(m, name, fehler.length ? 'FEHLER: ' + fehler.join(' | ') : 'ok')
    await page.close()
  }
}
await b.close()
