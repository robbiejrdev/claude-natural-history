/* shot.mjs — render still frames of the film for visual checking.
 * Usage: node build/shot.mjs 5 12 30 44 ... */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const times = process.argv.slice(2).map(Number);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'build', 'shots');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

for (const t of times) {
  await page.goto(`file://${path.join(ROOT, 'index.html')}?t=${t}`);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, `t${String(t).replace('.', '_')}.png`) });
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
