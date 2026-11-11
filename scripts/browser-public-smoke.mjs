import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const origin = process.env.SKILLED_BROWSER_ORIGIN ?? 'http://127.0.0.1:3212';
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/, 'Smoke tests require a local disposable frontend');
const browser = await chromium.launch({ headless: true });
let pages = 0;
try {
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    try {
      const page = await context.newPage();
      for (const pathname of ['/', '/login', '/register']) {
        const response = await page.goto(origin + pathname, { waitUntil: 'domcontentloaded' });
        assert.equal(response.status(), 200, pathname);
        await page.locator('h1').first().waitFor({ state: 'visible' });
        assert.match(await page.title(), /Skilled/);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false,
          `${pathname} overflows at ${viewport.width}px`);
        pages++;
      }
      const response = await context.request.get(origin + '/manifest.webmanifest');
      assert.equal(response.status(), 200);
      const manifest = await response.json();
      assert.equal(manifest.name, 'SkilledAt.Work');
      assert.equal(manifest.icons.length, 3);
      for (const icon of manifest.icons) {
        const asset = await context.request.get(origin + icon.src);
        assert.equal(asset.status(), 200, icon.src);
        assert.ok((await asset.body()).length > 0, icon.src);
      }
    } finally { await context.close(); }
  }
  assert.equal(pages, 6);
  console.log('PASS: six desktop/mobile public pages, manifest and install icons');
} finally { await browser.close(); }
