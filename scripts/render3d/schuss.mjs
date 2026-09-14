import { chromium } from 'playwright'
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const [modell = '12ah', ...varianten] = process.argv.slice(2)
const liste = varianten.length ? varianten : ['studio']
for (const v of liste) {
  const page = await b.newPage({ viewport: { width: 1800, height: 1350 } })
  const fehler = []
  page.on('pageerror', (e) => fehler.push(e.message))
  await page.goto(`http://localhost:8077/szene.html?m=${modell}&v=${v}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.fertig === true, { timeout: 90000 }).catch(() => fehler.push('nicht fertig'))
  await page.waitForTimeout(500)
  await page.locator('canvas').screenshot({ path: `/tmp/render3d/out-${modell}-${v}.png` })
  console.log(modell, v, fehler.length ? 'FEHLER: ' + fehler.join(' | ') : 'ok')
  await page.close()
}
await b.close()
