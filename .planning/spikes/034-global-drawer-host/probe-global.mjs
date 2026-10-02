// Spike 034 debug: does the host close when the nomination page unmounts?
import { chromium } from 'playwright';
const BASE = 'http://localhost:5180';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 420, height: 860 } });
await ctx.addInitScript(() => localStorage.setItem('redrawLab', JSON.stringify({ vt: 'hardened', loader: 'fixed', drawer: 'global', slowmo: false })));
await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '[data-testid=redraw-lab]{display:none!important}'; document.head.append(s); }));
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message.slice(0, 400)));
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console.' + m.type(), m.text().slice(0, 300)); });
await p.goto(`${BASE}/results`, { waitUntil: 'networkidle' });
if (p.url().includes('/constituencies')) {
  await p.getByTestId('voter-constituencies-list').getByRole('combobox').first().click();
  await p.getByRole('listbox').getByRole('option').first().click();
  await p.getByTestId('voter-constituencies-continue').click();
}
await p.getByTestId('voter-results-list').waitFor();
await p.waitForTimeout(500);
await p.evaluate(() => window.__redrawLab.clear());
await p.getByTestId('voter-results-list').locator('a[href]').nth(1).click();
await p.waitForTimeout(800);
const state = () => p.evaluate(() => ({ url: location.pathname.split('/').slice(-2).join('/'), hostOpen: document.querySelector('dialog.drawer-host')?.open, hostVisible: document.querySelector('dialog.drawer-host')?.classList.contains('visible') }));
console.log('after open', await state());
// A → B inside the open drawer: the candidate's party link (cross-type drawer).
const partyLink = p.locator('dialog.drawer-host a[href*="/organization/"]').first();
console.log('party links', await p.locator('dialog.drawer-host a[href*="/organization/"]').count());
if (await partyLink.count()) {
  await partyLink.click();
  await p.waitForTimeout(120);
  await p.screenshot({ path: '../031-results-nav-flicker-forensics/out/global-swap-a120.png' });
  await p.waitForTimeout(700);
  console.log('after swap', await state(), await p.locator('dialog.drawer-host').getAttribute('aria-label'));
}
await p.locator('dialog.drawer-host').getByRole('button', { name: /close/i }).first().click();
await p.waitForTimeout(100);
await p.screenshot({ path: '../031-results-nav-flicker-forensics/out/global-close-a100.png' });
await p.waitForTimeout(800);
console.log('after close', await state());
console.log((await p.evaluate(() => window.__redrawLab.events)).filter(e => e.cat !== 'focus').map(e => `${e.t} ${e.cat} ${e.msg}`).join('\n'));
// Question info through the same host.
await p.goto(`${BASE}/questions${new URL(p.url()).search}`, { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const info = p.getByTestId('voter-questions-popup-info-button');
console.log('info buttons', await info.count(), p.url());
if (await info.count()) {
  await info.first().click();
  await p.waitForTimeout(600);
  console.log('question info', await state(), await p.locator('dialog.drawer-host').getAttribute('data-testid'));
  await p.screenshot({ path: '../031-results-nav-flicker-forensics/out/global-question-info.png' });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(600);
  console.log('after escape', await state());
}
await b.close();
