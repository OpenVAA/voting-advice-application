import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 420, height: 860 } });
await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '[data-testid=redraw-lab]{display:none!important}'; document.head.append(s); }));
const p = await ctx.newPage();
await p.goto('http://localhost:5180/results', { waitUntil: 'networkidle' });
if (p.url().includes('/constituencies')) {
  await p.getByTestId('voter-constituencies-list').getByRole('combobox').first().click();
  await p.getByRole('listbox').getByRole('option').first().click();
  await p.getByTestId('voter-constituencies-continue').click();
}
await p.getByTestId('voter-results-list').waitFor();
const search = new URL(p.url()).search;
await p.goto(`http://localhost:5180/questions${search}`, { waitUntil: 'networkidle' });
const start = p.getByRole('link', { name: /start|begin|aloita/i }).or(p.getByRole('button', { name: /start|begin|aloita/i })).first();
if (await start.count()) await start.click();
await p.waitForTimeout(2000);
console.log(p.url(), 'info buttons:', await p.getByTestId('voter-questions-popup-info-button').count(),
  'interactiveInfo:', await p.evaluate(() => JSON.stringify(window.__redrawLab ? 'lab ok' : 'no lab')));
await b.close();
