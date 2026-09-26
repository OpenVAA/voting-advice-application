// Spike 031 — drive the four reported interactions under each lab config; dump the lab log + mid-transition screenshots.
// Usage: node forensics.mjs [base=http://localhost:5180] [configs=on-keep,on-strip,scoped,off]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:5180';
const ROOT = process.env.ROOT ?? '/results';
const TAG = (process.env.SCROLL ? '-s' + process.env.SCROLL : '') + (ROOT !== '/results' ? '-' + ROOT.slice(1) : '');
// Defaults = the spike-032 hardened fixes. `legacy` = the pre-032 behaviour (tracked loader read + names-kept VTs).
const D = { vt: 'hardened', slowmo: true, drawer: 'local', loader: 'fixed', keepReady: false };
const CONFIGS = {
  'legacy': { ...D, vt: 'legacy', loader: 'current' },
  'hardened': D,
  'hardened-global': { ...D, drawer: 'global' }
};
const pick = (process.argv[3] ?? 'legacy,hardened').split(',');
const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

export async function enterResults(p) {
  await p.goto(`${BASE}/results`, { waitUntil: 'networkidle' });
  if (p.url().includes('/constituencies')) {
    const box = p.getByTestId('voter-constituencies-list').getByRole('combobox').first();
    await box.click();
    await p.getByRole('listbox').getByRole('option').first().click();
    await p.getByTestId('voter-constituencies-continue').click();
  }
  await p.getByTestId('voter-results-list').waitFor({ timeout: 20000 });
  if (ROOT !== '/results') {
    // Same URL in the alternative route tree (spike 033).
    const u = new URL(p.url());
    await p.goto(`${BASE}${u.pathname.replace(/^\/results/, ROOT)}${u.search}`, { waitUntil: 'networkidle' });
    await p.getByTestId('voter-results-list').waitFor({ timeout: 20000 });
    console.log('entered', p.url());
  }
  await p.waitForTimeout(800);
}

const b = await chromium.launch();
for (const name of pick) {
  const cfg = CONFIGS[name];
  const ctx = await b.newContext({ viewport: { width: 420, height: 860 } });
  await ctx.addInitScript((c) => localStorage.setItem('redrawLab', JSON.stringify(c)), cfg);
  await ctx.addInitScript(() =>
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = '[data-testid=redraw-lab]{display:none!important}';
      document.head.append(s);
    })
  );
  const p = await ctx.newPage();
  const shot = (tag) => p.screenshot({ path: `${OUT}${name}${TAG}-${tag}.png` });
  const mid = async (tag, action) => {
    // Screenshots at 150ms and 1000ms into the (slowmo 2s) transition, then settle.
    await action();
    await p.waitForTimeout(150); await shot(`${tag}-a150`);
    await p.waitForTimeout(850); await shot(`${tag}-b1000`);
    await p.waitForTimeout(cfg.slowmo ? 1600 : 500); await shot(`${tag}-c-settled`);
  };
  await enterResults(p);
  await p.evaluate(() => window.__redrawLab.clear());
  const results = {};

  // 1. Entity tab switch
  const tabs = p.getByTestId('voter-results-entity-tabs').getByRole('tab');
  const nTabs = await tabs.count();
  results.tabs = nTabs;
  if (nTabs > 1) {
    await p.evaluate(() => window.__redrawLab.log('info', '### 1 entity tab switch'));
    await mid('1-tab', () => tabs.nth(1).click());
    await tabs.nth(0).click(); await p.waitForTimeout(cfg.slowmo ? 2500 : 500);
  }

  // 2. Scroll into the list and open an entity
  await p.evaluate((y) => window.scrollTo(0, y), Number(process.env.SCROLL ?? 700));
  await p.waitForTimeout(300);
  await p.evaluate(() => window.__redrawLab.log('info', `### 2 open entity (scrollY ${Math.round(scrollY)})`));
  const card = p.getByTestId('voter-results-list').locator('a[href]').nth(3);
  results.scrollBeforeOpen = await p.evaluate(() => scrollY);
  await mid('2-open', () => card.click());
  results.scrollAfterOpen = await p.evaluate(() => scrollY);

  // 4. Switch tab inside the drawer
  const dTabs = p.locator('dialog[open] [role=tab]');
  results.drawerTabs = await dTabs.count();
  if (results.drawerTabs > 1) {
    await p.evaluate(() => window.__redrawLab.log('info', '### 4 drawer tab switch'));
    await mid('4-dtab', () => dTabs.nth(1).click());
  }

  // 3. Close
  await p.evaluate(() => window.__redrawLab.log('info', '### 3 close entity'));
  await mid('3-close', () => p.locator('dialog[open]').getByRole('button', { name: /close/i }).first().click());
  results.scrollAfterClose = await p.evaluate(() => scrollY);

  const log = await p.evaluate(() => window.__redrawLab.events);
  writeFileSync(`${OUT}${name}${TAG}.log`, log.map((e) => `${String(e.t).padStart(6)} ${e.cat.padEnd(6)} ${e.msg}`).join('\n') + '\n\n' + JSON.stringify(results));
  console.log(name, JSON.stringify(results));
  await ctx.close();
}
await b.close();
