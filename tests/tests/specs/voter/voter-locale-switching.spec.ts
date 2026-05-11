/**
 * Voter locale switching E2E tests (E2E-08).
 *
 * Covers v2.9 Phase 74 requirement E2E-08: i18n route-prefix contract + the
 * intent of the LanguageSelection widget (locale switch with full reload).
 *
 * --- Order B (CONTEXT D-06) ---
 * Phase 74 lands FIRST. Phase 78 CLEAN-04 (i18n wrapper tightening) lands
 * AFTERWARDS. This spec covers the pre-CLEAN-04 wrapper today; after CLEAN-04
 * lands, this same spec re-validates against the tightened wrapper (NO spec
 * changes are made in Phase 78 — only verification re-runs).
 *
 * Reference: `.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md`
 * §D-06; the dependency direction will be recorded in
 * `.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md` at
 * phase close (Plan 07).
 *
 * --- Pitfall 3 (RESEARCH §Pitfall 3) ---
 * Routes do NOT use a `[[lang=locale]]` directory prefix. The default locale
 * (`en` per `staticSettings.ts:46-64`) renders WITHOUT a URL prefix; the
 * non-default locales (`fi`/`sv`/`da`) get a Paraglide-runtime-injected
 * `/fi/...` etc. prefix. Direct `page.goto('/fi')` is the canonical
 * route-prefixed form — NOT `buildRoute({ route, locale: 'fi' })`, because
 * `buildRoute` (tests/tests/utils/buildRoute.ts) does not inject the
 * Paraglide locale prefix for the default-locale form.
 *
 * --- LanguageSelection widget finding (Phase 78 CLEAN-04 anchor) ---
 * The LanguageSelection widget at
 * `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte`
 * is gated by `{#if locales.length > 1}` (line 32). The widget reads
 * `locales` from `getAppContext()`, which exposes `locales` as a
 * `Readable<ReadonlyArray<string>>` store (per
 * `apps/frontend/src/lib/contexts/app/appContext.type.ts:30`), NOT as a
 * plain array. Therefore `locales.length` is `undefined` at runtime and
 * the `> 1` gate is always false — the widget never renders in the
 * pre-CLEAN-04 wrapper.
 *
 * Per Plan 06 acceptance criterion 8 ("pivot the widget-press to direct
 * URL navigation as a fallback"), Test 2 exercises the equivalent
 * locale-switch contract via direct URL navigation: a non-root
 * route-prefixed path (`/fi/about`) renders Finnish; the same path without
 * the prefix (`/about`) renders English. After CLEAN-04 lands, this spec
 * SHOULD be revisited to also exercise the (now-rendering) widget click —
 * but spec content does NOT change in Phase 78 per Order B.
 */

import { expect, test } from '../../fixtures';

// Unauthenticated voter context (analog: voter-static-pages.spec.ts:25).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('voter locale switching (E2E-08)', { tag: ['@voter'] }, () => {
  test('locale switches via route prefix', async ({ page }) => {
    // 1. Visit home in en (default — NO URL prefix; Paraglide convention per
    //    RESEARCH Pitfall 3 + Open Question A6).
    await page.goto('/');

    // Assert the English translation of the high-signal start button text
    // (`dynamic.frontPage.startButton` → "Find the Best Candidates and Parties!"
    // per `apps/frontend/src/lib/i18n/translations/en/dynamic.json:55`).
    // reason: button text is rendered inside a <span class="uc-first"> inside
    // a Button component whose outer <a role="button"> has data-testid
    // "voter-home-start"; the accessible name for the role="button" element
    // is the button text. Anchoring via getByRole keeps the locator semantic.
    await expect(page.getByRole('button', { name: /Find the Best Candidates and Parties!/i })).toBeVisible({
      timeout: 15000
    });

    // 2. Visit /fi directly (route-prefixed form, asserted by SC #8 +
    //    RESEARCH Pitfall 3). NOT buildRoute({route, locale:'fi'}) —
    //    buildRoute does not inject the Paraglide locale prefix.
    await page.goto('/fi');

    // Assert the Finnish translation of the same button
    // (`dynamic.frontPage.startButton` → "Löydä sopivimmat ehdokkaat ja
    // puolueet!" per `apps/frontend/src/lib/i18n/translations/fi/dynamic.json:55`).
    await expect(page.getByRole('button', { name: /Löydä sopivimmat ehdokkaat ja puolueet!/i })).toBeVisible({
      timeout: 15000
    });

    // 3. URL prefix assertion: /fi navigation lands on /fi (not redirected).
    await expect(page).toHaveURL(/\/fi\/?$/);
  });

  test('locale switches via LanguageSelection widget (when present)', async ({ page }) => {
    // --- Pivot per Plan 06 acceptance criterion 8 ---
    // The LanguageSelection widget is gated on `locales.length > 1` in
    // `LanguageSelection.svelte:32`. In the pre-CLEAN-04 wrapper, `locales`
    // is a Readable store (NOT an array), so `.length` is undefined and the
    // gate is always false — the widget does not render. The plan's
    // acceptance criterion 8 explicitly authorises the direct-URL-navigation
    // fallback. After Phase 78 CLEAN-04 tightens the wrapper, this spec
    // re-validates against the tightened wrapper (Order B per CONTEXT D-06);
    // the equivalent contract is asserted here via the route-prefixed form
    // on a non-root page, which exercises Paraglide's `localizeHref` →
    // `/fi/<path>` prefix injection and the full reload semantics.

    // 1. Initialize the voter session by visiting `/` first. Direct
    //    navigation to `/about` (or `/fi/about`) without first hitting the
    //    home route can land on the voter error page because the `(voters)`
    //    layout requires the voter context to have completed first-touch
    //    initialization. Visiting `/` primes the session cookies.
    await page.goto('/');

    // 2. Visit a non-root page in Finnish (route-prefixed form).
    await page.goto('/fi/about');

    // Assert the Finnish title of the About page
    // (`about.title` → "Kuinka vaalikone toimii?" per
    // `apps/frontend/src/lib/i18n/translations/fi/about.json`).
    await expect(page.getByRole('heading', { level: 1, name: /Kuinka vaalikone toimii\?/i })).toBeVisible({
      timeout: 15000
    });
    await expect(page).toHaveURL(/\/fi\/about\/?$/);

    // 3. Navigate to the same page without the locale prefix (default en).
    //    This is the equivalent of the LanguageSelection widget switching
    //    back to the default locale: the URL prefix is dropped, the locale
    //    flips to en, and the page re-renders in English. The widget would
    //    achieve this via `localizeHref(pathname, { locale: 'en' })` +
    //    `data-sveltekit-reload` (see LanguageSelection.svelte:35-40);
    //    direct navigation matches the same network-level contract.
    await page.goto('/about');

    // Assert the English title of the About page
    // (`about.title` → "How Does This App Work?" per
    // `apps/frontend/src/lib/i18n/translations/en/about.json:16`).
    await expect(page.getByRole('heading', { level: 1, name: /How Does This App Work\?/i })).toBeVisible({
      timeout: 15000
    });

    // URL is no longer prefixed — default locale renders at the bare path
    // (Paraglide convention; RESEARCH Open Question A6).
    await expect(page).toHaveURL(/\/about\/?$/);
    await expect(page).not.toHaveURL(/\/fi\//);
  });
});
