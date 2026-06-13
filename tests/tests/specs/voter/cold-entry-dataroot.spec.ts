/**
 * Cold / direct-URL entry dataRoot reactivity regression (Phase 117 COLD-03).
 *
 * Root cause (LOCKED — debug `dataroot-stale-direct-nav` + Spike 024): an
 * intermediate `const dataRoot = $derived(ctx.dataRoot)` alias over the
 * identity-stable, `#version`-bridge `DataRoot` yields the SAME object reference
 * on every version bump, so Svelte 5's referential-equality rule SKIPS downstream
 * notification. On cold/direct-URL entry (data provided AFTER mount) the
 * downstream consumer keeps the empty pre-mount snapshot → the elections list /
 * info election region never renders.
 *
 * These tests are the negative control for the COLD-01 codemod: they FAIL against
 * the pre-fix (aliased) source (the data-dependent region never appears → timeout)
 * and PASS once each consumer reads `ctx.dataRoot.<prop>` directly in its tracking
 * scope. NO intro→Continue walk — a bare hard navigation IS the cold entry; the
 * warm intro walk MASKS the bug (data present before the alias first computes).
 *
 * Seed: `data-setup-base` (`e2e/base`) — multi-election. Voter routes are public
 * (no auth). Post-hydration mount hazard: the list mounts a beat after navigation,
 * so use the WAITING assertion `toBeVisible({ timeout })`, never one-shot `isVisible()`.
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is HARD — no
 * expect.soft, no try/catch around expect(), no .catch fallback.
 */

import { expect, test } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';

test.describe('cold-entry-dataroot', () => {
  test('cold direct-URL entry to /en/elections renders the populated elections list', async ({ page }) => {
    // COLD: bare hard navigation, no Home→Intro→Continue walk.
    await page.goto('/en/elections');

    // The data-dependent list is gated behind `{#if elections.length}` and is
    // EMPTY when `voterCtx.dataRoot.elections` is stale. WAITING assertion covers
    // the post-hydration mount window.
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });

    // Stronger signal: at least one selectable election option present.
    await expect(page.getByTestId(testIds.voter.elections.option).first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('cold direct-URL entry to /en/info renders the election-data region', async ({ page }) => {
    // COLD: bare hard navigation.
    await page.goto('/en/info');

    // Assert the `{#each ctx.dataRoot.elections}` region (NOT the static
    // `voter-info-content` {@html} div) — this region is empty when
    // `dataRoot.elections` is stale, so it proves the cold-path populate landed.
    await expect(page.getByTestId(testIds.voter.info.electionList)).toBeVisible({ timeout: TIMEOUTS.slowPage });
  });
});
