
// ---- spike 035 probe (temporary, never committed) ----
test.describe('spike035 probe', () => {
  test('frames during entity drawer close + A→B swap', async ({ page, resultsPage }) => {
    test.setTimeout(TIMEOUTS.testMax);
    await landOnResults(page);
    const card = await resultsPage.getEntityCard((count) => Math.floor(count / 2));
    await card.getByTestId(testIds.voter.results.cardTitle).first().click();
    await expect(page.getByTestId(testIds.voter.results.entityDetails)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await page.waitForTimeout(600);
    const frames = await page.evaluate(async () => {
      const dlg = document.querySelector('dialog.drawer-host') as HTMLDialogElement;
      const panel = dlg.querySelector('.drawer-host-panel') as HTMLElement;
      const out: Array<{ t: number; open: boolean; textLen: number; transform: string; details: number }> = [];
      const t0 = performance.now();
      const sample = () => out.push({ t: Math.round(performance.now() - t0), open: dlg.open, textLen: (panel.innerText || '').trim().length, transform: getComputedStyle(panel).transform, details: panel.querySelectorAll('[data-testid="entity-details"]').length });
      (document.querySelector('dialog.drawer-host button[type="button"].drawer-host-backdrop') as HTMLElement).click();
      await new Promise<void>((res) => { const loop = () => { sample(); if (performance.now() - t0 < 700) requestAnimationFrame(loop); else res(); }; requestAnimationFrame(loop); });
      return out;
    });
    const errors: Array<string> = [];
    page.on('pageerror', (e) => errors.push(e.message));
    console.log('SPIKE035_FRAMES ' + JSON.stringify(frames.filter((_, i) => i % 3 === 0)));
    console.log('SPIKE035_ERRORS ' + JSON.stringify(errors));
    await expect(page.locator('dialog.drawer-host[open]')).toHaveCount(0, { timeout: 5000 });
  });
});
