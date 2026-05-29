const { chromium } = require('playwright');
(async () => {
  const url = (process.env.E2E_BASE_URL || 'http://localhost:5173').trim();
  const target = new URL('/agent', url).toString();
  console.log('Inspect run base:', url);
  console.log('Inspect run target:', target);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    console.log('[console]', msg.type(), msg.text());
  });
  page.on('pageerror', err => {
    console.error('[pageerror]', err && err.stack ? err.stack : String(err));
  });
  page.on('requestfailed', req => {
    console.warn('[requestfailed]', req.url(), req.failure() && req.failure().errorText);
  });

  try {
    const resp = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Main navigation status:', resp && resp.status());

    // wait a little for SPA routing/hydration
    await page.waitForTimeout(1000);

    // capture localStorage
    const ls = await page.evaluate(() => {
      try { return JSON.stringify(window.localStorage); } catch (e) { return 'ERR:' + String(e); }
    });
    console.log('localStorage snapshot:', ls);

    // capture body innerHTML length
    const bodyHtml = await page.evaluate(() => document.body ? document.body.innerHTML.slice(0, 1000) : 'no-body');
    console.log('body snippet:', bodyHtml.replace(/\n/g, '').slice(0,500));

    // screenshot
    const out = 'test-results/inspect-agent-screenshot.png';
    await page.screenshot({ path: out, fullPage: true });
    console.log('Screenshot saved to', out);

  } catch (e) {
    console.error('Inspect run failed:', e && e.stack ? e.stack : String(e));
  } finally {
    await browser.close();
  }
})();
