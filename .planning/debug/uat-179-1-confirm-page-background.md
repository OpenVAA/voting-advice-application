---
status: diagnosed
trigger: "uat-179-1-confirm-page-background: On the confirm page, the page background outside the centre column is the same as the column's."
created: 2026-10-31T18:30:00Z
updated: 2026-10-31T19:05:00Z
goal: find_root_cause_only
---

## Current Focus

bug_class: Bohrbug (deterministic styling)
hypothesis: CONFIRMED. app.html's wrapper is `flex flex-col items-center`, so the confirm page's `<main class="bg-base-300 ...">`, a direct flex child with no width class, shrink-wraps to its content. bg-base-300 paints a content-wide strip only and body's bg-base-100 shows on both sides.
test: done; computed style, elementFromPoint and drawn pixels at four widths, both themes and both auth states, then stretching main from either end in the live DOM.
expecting: met
next_action: Diagnose-only session. Hand the root cause to the fix planner; no source edit made here.

## Symptoms

expected: On the confirm page, the page background outside the centre column is the same as the column's.
actual: "Email 2/3: the page bg outside the centre column should be the same as the col". "Email 2/3" means steps 2 and 3 of the mailed-link walkthrough: the confirm page signed out, and signed in to another account.
errors: None reported
reproduction: Test 10 in UAT. To get a link: POST through the UI at http://localhost:5173/contestant/forgot-password with uat-nonom@test.openvaa.local, then read the newest message from Inbucket (http://127.0.0.1:54324/api/v1/messages?limit=1, then /api/v1/message/<ID>) and open its /en/auth/confirm link WITHOUT pressing Continue, so the link is not spent. Direct URL form: /en/auth/confirm?token_hash=x&type=recovery may also render the page; confirm that it does before relying on it. Signed in as another account: uat-multi@test.openvaa.local, password Password1!.
started: Discovered during UAT

## Eliminated

- hypothesis: The seam is a desktop-only effect, because a phone's viewport is narrower than the column
  evidence: magiclink signed out at 375 and 414 draws white on both sides of the strip (0-25 and 349-374 at 375). Only a long enough sentence fills a phone.
  timestamp: 2026-10-31T19:05:00Z

- hypothesis: The page's background comes through Layout's pageStyles, and the route simply never sets it
  evidence: pageStyles.current has one reader, Layout.svelte:70, and `.drawer` is null on /auth/confirm. The page does not call pageStyles.use and calling it would paint nothing. The colour on the strip is main's own class, measured by elementFromPoint and the painter walk.
  timestamp: 2026-10-31T19:05:00Z

## Evidence

- timestamp: 2026-10-31T18:30:00Z
  checked: apps/frontend/src/routes/auth/confirm/+page.svelte, apps/frontend/src/app.html, apps/frontend/src/app.css, apps/frontend/src/routes/+layout.svelte, apps/frontend/src/lib/layouts/main/Layout.svelte and MainContent.svelte, by reading
  found: The page's `<main class="bg-base-300 flex min-h-dvh flex-col">` is rendered under the root layout alone. app.html wraps everything in `<div class="flex min-h-dvh flex-col items-center">`. body is `@apply bg-base-100`. The contestant pages colour their page through pageStyles.use({drawer:{background}}), whose only reader is the `.drawer` div in Layout.svelte, which this route does not mount. MaintenancePage's `<main>` has the same position and carries `w-full`.
  implication: Read from code only. To be measured.

- timestamp: 2026-10-31T18:50:00Z
  checked: Live measurement (scratchpad confirm-bg/measure.mjs, report confirm-bg/report.json). /en/auth/confirm?token_hash=x&type=recovery signed out and signed in as uat-multi, light and dark, 320, 375, 768, 1280 wide. Computed style, elementFromPoint, and the drawn pixels of the rows at y=2 and y=height-3. The direct URL renders the page (auth-confirm-page, data-type=recovery; notice and Cancel present only signed in), and a real mail's link gave the same geometry as the direct URL (recovery, /en/auth/confirm, 1280 light: signed out main x=441.6 w=396.8, signed in x=332 w=616). Continue was never pressed.
  found: At 1280 light, signed out, drawn row is 0-441 255,255,255 | 442-837 209,235,238 | 838-1279 255,255,255. elementFromPoint at both sides resolves to body as the painter, at the centre to main. Dark is the same geometry with 0,0,0 and 31,35,36. Signed in, main is 616 wide (332-947), and at 768 it is 76-691. For recovery at 320 and 375, main fills the viewport, both themes, signed in or out. wrapper computes display flex, align-items center; main computes align-self auto. No `.drawer` in the DOM. scrollWidth equals the viewport everywhere.
  implication: Symptom reproduced. The two colours are main's bg-base-300 and body's bg-base-100, exactly the tokens of staticSettings (#d1ebee and #ffffff, #1f2324 and #000000). main is shrink-wrapped by the wrapper's items-center.

- timestamp: 2026-10-31T18:50:00Z
  checked: Falsification in the live DOM, `w-full` added to main only, same run, all 16 combinations
  found: main becomes the whole viewport, drawn rows are one colour end to end (0-1279 209,235,238; 0-1279 31,35,36; the same at every width), and scrollWidth stays equal to the viewport, so no horizontal overflow.
  implication: Hypothesis confirmed; the class is already compiled.

- timestamp: 2026-10-31T18:50:00Z
  checked: main's width by link type and locale, light, signed out
  found: At 1280 main is 323.6 (magiclink en), 396.8 (recovery en), 448.6 (email_change en), 284.9 (magiclink fi), 299.5 (magiclink sv), 509.6 (recovery fi), and 616 signed in (recovery en). At 375, magiclink en is 323.6 at x=25.7 and magiclink fi 284.9; at 320, magiclink fi is 284.9 and magiclink sv 299.5.
  implication: The "column" is the content's own width, not a designed column. It changes with the sentence, and it shows at phone width too whenever the sentence is short enough, so this is not desktop-only.

- timestamp: 2026-10-31T18:50:00Z
  checked: Siblings in the same run. login, forgot-password, the provider error screen, the root error page (404), each light and dark at 375 and 1280; email-sent reached by asking for a link through forgot-password.
  found: login, forgot-password, provider-error and email-sent all have `.drawer` at x=0 with the viewport's width and computed bg-base-300, and main transparent inside it; bottom rows are one colour end to end. The root error page has no `.drawer`, its main is transparent and also shrink-wrapped (x=312 w=656 at 1280), and the drawn rows are all body colour, 255,255,255 or 0,0,0. Two caveats: email-sent light 1280 was measured during the navigation's view transition (210,235,238, elementFromPoint hits html); and its dark rows were taken by flipping the colour preference in place, because the held request does not survive a reload, so its top row (209,235,238) is header chrome left light by the flip, not the page.
  implication: The wanted treatment exists on all entry-flow siblings, by way of Layout's `.drawer`. The root error page has the same shrink-wrap but paints nothing, so it shows no seam. It is base-100, not the base-300 the UI review says.

- timestamp: 2026-10-31T19:05:00Z
  checked: Second pass (scratchpad confirm-bg/measure2.mjs, report confirm-bg/report2.json). magiclink at 320, 375 and 414, both auth states and themes.
  found: Signed out at 375 the drawn row is 0-25 white | 26-348 base-300 | 349-374 white, and at 414 it is 0-44 | 45-368 | 369-413; dark has the same geometry. At 320 it fills. Signed in it fills at all three, because the notice's sentence is long enough.
  implication: A sign-in link opened signed out shows the seam on an ordinary phone. "Phone width is fine" would be wrong; it depends on the sentence.

- timestamp: 2026-10-31T19:05:00Z
  checked: Control at the other end of the mechanism, 1280 light, recovery. `align-items: stretch` on the wrapper with main's classes untouched; then `self-stretch` on main; then `w-full` on main.
  found: Each gives main x=0 w=1280, row 0-1279 209,235,238, scrollWidth 1280.
  implication: The wrapper's items-center is what sizes main. Stretching removes the seam from either end, so the cause is that one interaction, and the colour classes are not involved.

- timestamp: 2026-10-31T19:05:00Z
  checked: With `w-full` on main. Short viewports 320x300 and 1280x300, both auth states, full-page screenshot rows. axe with tags wcag2a, wcag2aa, wcag21a, wcag21aa, both auth states and themes, 375 and 1280, before and after the class. Before and after screenshots at 1280.
  found: Colour reaches the bottom of a scrolling page (signed in, 320x300: main 386.9 high, page 387, top and bottom rows one colour), no horizontal overflow. axe has no violations before or after, in all 8 combinations. With the class, Continue on the signed-out page grows from the shrink-wrapped column's width (462-818 at 1280) to the 576 max-w-xl (352-928), the width it already has when signed in, because the content is no longer narrowed by main. Signed-in layout at 1280 does not move.
  implication: The class is safe to apply. It has one visible side effect, on the signed-out page's button width, which is a correction toward the signed-in state rather than a regression, but the operator should see it.

- timestamp: 2026-10-31T19:05:00Z
  checked: Routes, readers and history by grep and git. Every `<main>` in apps/frontend/src; pageStyles.current readers; page routes outside (voters), contestant, admin; commit 8763651e1; plan and summary 179.1-11.
  found: Four `<main>`. Layout's sits inside `.drawer`, which has the viewport's width (measured). MaintenancePage's carries `w-full bg-base-300` (read). +error's has no background and no width (measured shrink-wrapped, transparent). The confirm page's has `bg-base-300` and no width. pageStyles.current has one reader, Layout.svelte:70, and Layout is mounted by the (voters), contestant and admin layouts (read). /auth/confirm is the only page route outside those three. `.drawer` is null on /auth/confirm (measured). The `<main>` line is as written in 8763651e1. Plan 179.1-11 told the page to render "under the root layout as +error.svelte is"; the shape was copied from a page that paints nothing and the background was added to it.
  implication: pageStyles.use on the confirm page would paint nothing, so a fix there would look correct in code and do nothing. The unit test's layout mock also accepts pageStyles.use, so it would pass.

- timestamp: 2026-10-31T19:05:00Z
  checked: Tests. grep for bg-base, min-h, classList, class=, toHaveCSS, getComputedStyle and `main` queries in the page's two unit tests and fixture, and toHaveCSS, getComputedStyle, toHaveScreenshot, bg-base in the five specs that reach the page; the visual gate's spec for the page.
  found: No hits. The unit test and fixture work by test id; the E2E specs walk the page, and the two axe scans (auth-confirm-signed-out, auth-confirm-signed-in) read contrast only. tests/tests/specs/visual/visual-regression.spec.ts does not reach the page.
  implication: Nothing is pinned to the current look, so nothing breaks with the fix, and nothing would catch the seam returning. jsdom has no layout, so a real guard has to be in E2E.

- timestamp: 2026-10-31T19:05:00Z
  checked: Side effects of this session
  found: The reproduction's forgot-password request sent one password-reset mail to uat-nonom. That link is the newest message in Inbucket and is unspent; Continue was never pressed by either script. uat-multi was signed in by password in throwaway browser contexts only. No source file edited; the live-DOM class changes were in the test browsers' copies.
  implication: The stack and the working tree are as they were, apart from that mail and this file.

## Resolution

candidate_causes:
  - "code: the confirm page's main carries bg-base-300 and no width, inside app.html's items-center wrapper (CONFIRMED)"
  - "config: wrong theme tokens, or the classes not compiled (ELIMINATED, the drawn colours equal staticSettings' base-100 and base-300 in both themes, and w-full and self-stretch both apply when added)"
  - "environment: a stale dev server (ELIMINATED, the served `<main>` class equals the source, and a real mailed link gives the same geometry)"
  - "data: the link type or the session changes the paint (ELIMINATED, every type and both auth states paint the same two elements; they change only main's width)"
and_gate: "yes, two conditions together, in two files. (1) app.html's wrapper is `items-center`, so a direct child that sets no width is sized to its content. (2) The confirm page's main paints a background and sets no width. +error.svelte has (1) without paint and shows nothing; MaintenancePage paints with w-full and is fine (read). Only condition 2 belongs to this page; the wrapper is the shell of every route and is not what to change."
root_cause: The confirm page's `<main class="bg-base-300 flex min-h-dvh flex-col">` sets no width and is a direct child of app.html's `<div class="flex min-h-dvh flex-col items-center">`, so items-center shrink-wraps it to its content. bg-base-300 therefore paints only a content-wide strip, and body's bg-base-100 shows on both sides. The page renders under the root layout alone, so Layout's full-width `.drawer`, which gives every entry-flow sibling its full-width colour, is not there.
fix:
verification:
files_changed: []
