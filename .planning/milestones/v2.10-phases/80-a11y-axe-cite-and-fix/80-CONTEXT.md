# Phase 80: A11Y Axe Cite-and-Fix - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve the 5 first-run WCAG 2.1 AA violations baselined by Phase 76's A11Y-03 axe smoke (`.planning/milestones/v2.9-phases/76-profile-a11y/76-A11Y-BASELINE.md`) — 3 distinct rule-IDs across 2 routes:

- `aria-required-parent` × 4 nodes (results × 2 + voter-detail-drawer × 2)
- `list` × 2 nodes (results × 1 + voter-detail-drawer × 1)
- `button-name` × 1 node (voter-detail-drawer)

Root-caused during discuss-phase scout to TWO shared-component surfaces:

1. **`NavGroup` + `NavItem`** (`apps/frontend/src/lib/dynamic-components/navigation/`). NavGroup renders `<section role="list">` containing an optional `<h4>` title — the heading is a non-listitem child of `role="list"`, which trips the `list` rule. NavItem renders `<div role="listitem">` unconditionally — when used outside a NavGroup (e.g., `VoterNav.svelte:57`, `CandidateNav.svelte:40`, `AdminNav.svelte:37` orphan close-buttons), the listitem has no `role="list"` parent, which trips `aria-required-parent`. Same shared component drives both violations on both routes (results + drawer have the menu drawer rendered in the DOM behind them).

2. **`Button` floating-icon variant + `Drawer` close button** (`apps/frontend/src/lib/components/button/Button.svelte:183` + `apps/frontend/src/lib/components/modal/drawer/Drawer.svelte:96-102`). Button's aria-label branch fires only for `variant === 'icon'`; the `'floating-icon'` variant hides the text label (Button.svelte:201) AND gets no aria-label, so the icon-only floating close button has no accessible name — trips `button-name`. Compounding: Drawer.svelte:99 passes a hard-coded English `text="close"` (not an i18n key) so even if Button gained the aria-label branch, the announced name would not be localized.

After Phase 80: `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` reports 0 violations across all 6 baselined routes (home + elections-selector + constituencies-selector + questions + results + voter-detail-drawer); per-rule regression assertions for `aria-required-parent` + `list` + `button-name` PLUS a global zero-violation gate guard against recurrence; `80-A11Y-BASELINE.md` documents the post-fix state.

Phase 80 is shared-component a11y cite-and-fix on stable surfaces — NOT new product behavior, NOT framework migration. Component changes touch shared `NavGroup` / `NavItem` / `Button` (consumed by voter / candidate / admin nav surfaces AND every Drawer in the app) — verification MUST confirm the Phase 79 v2.10 anchor (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE at SHA `ff0334f856…`) holds through these changes. Phase 79 is a HARD prerequisite (closed 2026-05-13 passed-with-deferral). Structurally independent of DETERM-05 constants regen.

</domain>

<decisions>
## Implementation Decisions

### Structural fix for `aria-required-parent` + `list` (resolves 6 of 7 violation nodes)

- **D-01 — Targeted ARIA fix; keep `role="list"` / `role="listitem"` (list semantics ARE screen-reader-friendly).** Discussion validated that list semantics — `role="list"` + `role="listitem"` — give screen readers a meaningful count + position announcement ("List with 6 items. 1 of 6, Home") that is the WAI-ARIA APG / GOV.UK / GitHub / MDN convention for primary navigation menus. Dropping list semantics would leave the `<nav>` landmark intact but lose the count/position signal. The Safari `list-style: none` quirk (Scott O'Hara, 2019) means even native `<ul>` needs explicit `role="list"` to survive — so the ARIA bridge is not redundant; it is defensive. **REJECTED:** "drop list semantics entirely" (reduces SR-friendliness); "native `<ul>` / `<li>` refactor" (functionally equivalent SR experience; larger refactor that breaks NavGroup's flexible-children contract; the NavItem.svelte:50 design comment about "we can't change ActionItem's role" still applies — wrapping in `<li>` is technically valid HTML but constrains NavGroup's child set unnecessarily).

- **D-02 — NavGroup: hoist `<h4>` outside `role="list"` element + link via `aria-labelledby`.** When `title` is set (LanguageSelection.svelte:33 passes it), the heading is rendered as a sibling of the `role="list"` div, not a child. The `role="list"` div gets `aria-labelledby={titleId}` pointing at the heading so screen readers still announce the group's label. The wrapping `<section>` element is preserved (it carries the `:before` CSS pseudo-element that draws the visual separator line at NavGroup.svelte:41) — but `role="list"` migrates from the `<section>` to an inner `<div>`. Concrete shape:

  ```svelte
  <section {...concatClass(restProps, 'before:content-[""]...')}>
    {#if title}
      <h4 id={titleId} class="small-label py-sm flex items-center pl-[2.75rem]">{title}</h4>
    {/if}
    <div role="list" aria-labelledby={title ? titleId : undefined}>
      {@render children?.()}
    </div>
  </section>
  ```

  `titleId` is generated per-instance (e.g., `crypto.randomUUID()` OR Svelte's `$props.id()` / `useId`-equivalent — planner picks the canonical Svelte 5 idiom at PLAN.md time; if no built-in, use a module-scoped counter like the existing `menuId` pattern at `voters/+layout.svelte:72`).

- **D-03 — NavItem: auto-detect NavGroup context via `setContext` / `getContext` — render `<div role="listitem">` only when inside a NavGroup; render the inner `<a>` / `<button>` directly when standalone.** NavGroup pushes a context marker (e.g., `setContext(NAV_GROUP_CONTEXT_KEY, true)`); NavItem reads it (`const inNavGroup = getContext(NAV_GROUP_CONTEXT_KEY) === true`) to decide whether to wrap. **ZERO consumer-side changes** — VoterNav.svelte:57 / CandidateNav.svelte:40 / AdminNav.svelte:37 orphan close-buttons all resolve automatically without explicit props. The auto-detect is structural (a NavItem's containment in a NavGroup is fixed at render time; never changes reactively at runtime) so context is the natural mechanism. Concrete shape:

  ```svelte
  <!-- NavItem.svelte -->
  <script lang="ts">
    import { getContext } from 'svelte';
    import { NAV_GROUP_CONTEXT_KEY } from './navGroupContext';
    // ...existing prop destructuring + classes derivation
    const inNavGroup = getContext(NAV_GROUP_CONTEXT_KEY) === true;
  </script>

  {#if inNavGroup}
    <div role="listitem">
      <svelte:element this={href == null ? 'button' : 'a'} {...}>...</svelte:element>
    </div>
  {:else}
    <svelte:element this={href == null ? 'button' : 'a'} {...}>...</svelte:element>
  {/if}
  ```

  And NavGroup pushes the context once: `setContext(NAV_GROUP_CONTEXT_KEY, true)` in the `<script>` block.

  **REJECTED:** "explicit `standalone` prop at each consumer-site" — duplicated 3× across VoterNav / CandidateNav / AdminNav; auto-detect is cleaner and propagates to any future nav consumer (admin-app extensions, future plugin nav) without touching them.

- **D-04 — No consumer-side sweep required.** The auto-detect approach in D-03 means the orphan close-button violations in CandidateNav.svelte:40 + AdminNav.svelte:37 auto-resolve alongside the voter-side fix. Phase 80's axe-baselined surface is voter-side only (6 voter routes per Phase 76 CONTEXT D-07), but the structural fix eliminates the same root cause in candidate / admin routes too — closing adjacent surfaces "while we're here" matches v2.9 hygiene-sweep precedent (Phase 70 svelte-ignore sweep, Phase 71 ESLint sweep). Bonus: future axe-smoke extension to candidate-app / admin-app routes will start green for these rule-IDs.

### `button-name` fix on `Drawer` floating-icon close (resolves 1 of 7 nodes)

- **D-05 — Generalize `Button.svelte:183` aria-label branch + i18n at `Drawer.svelte:99` call site.** Two-part fix at the right layer for each problem:

  **(A) `Button.svelte:183`** — extend the aria-label conditional from `variant === 'icon'` to `variant === 'icon' || variant === 'floating-icon'` so EVERY icon-only Button variant gets an accessible name from the `text` prop. Concrete change:

  ```svelte
  <!-- Before (Button.svelte:183) -->
  aria-label={variant === 'icon' ? effectiveText : undefined}

  <!-- After -->
  aria-label={variant === 'icon' || variant === 'floating-icon' ? effectiveText : undefined}
  ```

  Note: `'responsive-icon'` does NOT need the aria-label branch — its label renders via `sr-only sm:not-sr-only` (Button.svelte:165), so screen readers already have an accessible name from the text node. Only `'icon'` and `'floating-icon'` hide the label entirely.

  **(B) `Drawer.svelte:99`** — change `text="close"` to `text={t('common.closeDialog')}` so the announced accessible name is localized. The `common.closeDialog` i18n key already exists in all 4 locales (verified: `apps/frontend/messages/en/common.json:20` plus fi/sv/da equivalents — Phase 78 CLEAN-04 tightened the i18n wrapper to `TranslationKey` union so the planner can rely on type-narrowing to catch typos). The non-floating Drawer branch at Drawer.svelte:92 already uses this key for its sr-only label — Phase 80 just makes the floating-icon branch consistent with it. Concrete change:

  ```svelte
  <!-- Before (Drawer.svelte:96-102) -->
  <Button
    type="button"
    variant="floating-icon"
    text="close"
    icon="close"
    onclick={() => closeModal()}
    class="!absolute right-0 bottom-0 z-10" />

  <!-- After -->
  <Button
    type="button"
    variant="floating-icon"
    text={t('common.closeDialog')}
    icon="close"
    onclick={() => closeModal()}
    class="!absolute right-0 bottom-0 z-10" />
  ```

  The `t` callable is already available via `getComponentContext()` at Drawer.svelte:65 (line is `const { t } = getComponentContext();`) — no new import needed.

  **REJECTED:** "call-site aria-label only at Drawer" (leaves the Button variant a known footgun for any future floating-icon consumer); "Button-only fix; preserve `text='close'`" (ships a hidden i18n regression — fi/sv/da users hear "close" in English; CLAUDE.md "Localization — all user-facing strings must support multiple locales" is non-negotiable).

### Regression assertions in `a11y-smoke.spec.ts`

- **D-06 — Both global zero AND per-rule trio assertions, per route.** ROADMAP SC #4 has two clauses ("0 violations across all 6 routes" AND "per-rule regression assertions") — Phase 80 satisfies both literally. Per route:
  1. Three per-rule filter assertions for the Phase 76 baselined rule-IDs — `aria-required-parent`, `list`, `button-name` — cite the original findings explicitly in the test so future readers can map test → original bug without re-reading the Phase 76 baseline.
  2. A global `expect(results.violations).toHaveLength(0)` — catches ANY new violation (new rule-IDs, regressions on rules we haven't seen yet).

  Smoke is `PLAYWRIGHT_A11Y=1` opt-in (NOT default CI per Phase 76 D-04); brittleness on the global-zero gate is acceptable — if a future change introduces a new violation, the opt-in smoke will surface it but won't block default CI runs. The per-rule trio documents intent permanently.

  Concrete shape:

  ```typescript
  test(`A11Y-04 axe smoke — ${route.name}`, async ({ page }, testInfo) => {
    await navigateAndSettle(page, route);  // existing prefill + settle helpers
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    await testInfo.attach(`axe-violations-${route.name}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json'
    });
    // Phase 80 — cite-and-fix gate. Phase 76 baselined 5 violations across 3 rule-IDs:
    //   aria-required-parent × 4, list × 2, button-name × 1 (76-A11Y-BASELINE.md).
    expect(results.violations.filter(v => v.id === 'aria-required-parent')).toHaveLength(0);
    expect(results.violations.filter(v => v.id === 'list')).toHaveLength(0);
    expect(results.violations.filter(v => v.id === 'button-name')).toHaveLength(0);
    // SC #4 global zero gate — "0 violations across all 6 routes".
    expect(results.violations).toHaveLength(0);
  });
  ```

  Existing `console.log(...)` debug call removed (replaced by deterministic assertions); the `testInfo.attach(...)` JSON attachment is preserved so debug artifacts remain available on failure.

  The spec's `A11Y-03` test-name prefix MAY be renumbered to `A11Y-04` to reflect the current requirement ID — planner's call at PLAN.md time (Claude's Discretion); the test-id registry / dedup audit is unaffected.

### Post-fix baseline artifact

- **D-07 — New phase-local `80-A11Y-BASELINE.md` + cross-link backward to `76-A11Y-BASELINE.md`.** Phase 80 produces its own baseline artifact at `.planning/phases/80-a11y-axe-cite-and-fix/80-A11Y-BASELINE.md` documenting the 0-violation post-fix state across all 6 routes. Cross-links backward to `.planning/milestones/v2.9-phases/76-profile-a11y/76-A11Y-BASELINE.md` (preserves the original first-run baseline as historical evidence — never mutated). Matches the Phase 73 `73-PARITY-BASELINE.md` / Phase 76 baseline phase-local-artifact precedent. **REJECTED:** "in-place update to 76-A11Y-BASELINE.md" (rewrites Phase 76 history; conflates two phases' verification states); "promote to project-level `.planning/A11Y-BASELINE.md`" (premature — only 1 a11y baseline shipped so far; Phase 76 deferred promotion to a downstream phase with 2+ baselines).

### Plan grouping / sequence (Claude's Discretion — user did not select this gray area)

- **D-08 — Default: 1 bundled plan; planner may split into 2 if scope exceeds per-plan ceiling.** User did not select "Plan grouping / sequence" as a gray area — defaulting to the cite-and-fix-todo recommendation (`.planning/todos/pending/2026-05-12-a11y-axe-first-run-violations.md` §"Total effort estimate" — "1-2 plans"). Concrete default:

  - **Plan 01 — Structural fix + button-name fix + regression assertions + post-fix baseline + verification gate.** All component changes (NavGroup hoist h4, NavItem auto-detect context, Button aria-label branch, Drawer i18n key) + a11y-smoke.spec.ts assertion tightening + `80-A11Y-BASELINE.md` + 3-run cold-start determinism verification (per D-11 below) + parity-script self-identity smoke (per D-12) — bundled into a single plan because the changes are small (~30-50 LOC total across 4 component files + 1 spec file + 1 artifact file) and tightly coupled (the spec assertion gate FAILS until all 4 component fixes land; splitting them creates a dependency chain that adds friction).

  Planner may split into 2 plans if PLAN.md authoring surfaces scope concerns (e.g., if the NavGroup `titleId` generation requires a non-trivial Svelte 5 idiom that warrants its own plan). Default: 1 plan.

### Determinism + parity considerations

- **D-09 — Inherit Phase 76 D-09 axe smoke determinism contract:** 2 successive `PLAYWRIGHT_A11Y=1` runs on the same baseline must produce byte-identical per-route per-rule violation counts. Phase 80's verification step re-runs the smoke 2× post-fix to confirm the 0-violation state is deterministic.

- **D-10 — Inherit Phase 76 D-10 conditional parity-script regen:** Phase 80 does NOT add tests to the default baseline (the a11y-smoke is `PLAYWRIGHT_A11Y=1` opt-in per Phase 76 D-04; NOT in the default `yarn test:e2e` project set). Component changes to shared `NavGroup` / `NavItem` / `Button` MAY perturb existing voter / candidate / admin tests — verification MUST confirm the Phase 79 v2.10 anchor (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE at SHA `ff0334f856…`) holds. If 3-run cold-start surfaces ANY pre-existing test transitioning between PASS_LOCKED / DATA_RACE / CASCADE pools, parity-script constants regen is required via the Phase 73 P06 path (`regen-constants.mjs` OR in-place edit at `tests/scripts/diff-playwright-reports.ts`).

- **D-11 — Vite-cache wipe before 3-run gate.** Per v2.6 P64 + Phase 73 P06 + Phase 76 D-11 + Phase 78 CLEAN-01: `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean` (or the imperative equivalent if `dev:clean` is unavailable for any reason — Phase 78 landed the `dev:clean` script and the deprecated `dev:*` aliases survive through v2.10 close). The 3-run cold-start verification at Plan 01 close runs against the post-cache-wipe baseline.

- **D-12 — Parity-script self-identity smoke before regen decision.** Per Phase 79 D-13: `npx tsx tests/scripts/diff-playwright-reports.ts | diff <expected-template> -` — must produce zero diff at HEAD-pre-changes; re-run post-fix to confirm constants regen is not required (or to surface the delta if it is). Phase 79 Plan 03 verified the script restores cleanly post-v2.9 close; Phase 80 inherits.

### IMGPROXY_TIED_TITLES safety

- **D-13 — Phase 80 does NOT touch entity-card / entity-list image-upload paths.** Per `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:11-32` (the bound IMGPROXY_TIED_TITLES list) — the structurally-fragile titles are entity-image-upload-related. Phase 80's surface (NavGroup / NavItem / Button.svelte aria-label / Drawer text prop) does NOT collide with any IMGPROXY_TIED_TITLES entry; the 15-entry DATA_RACE pool remains structurally bound.

### Locator + lint convention

- **D-14 — Inherits Phase 76 D-11a / Phase 75 D-06 / Phase 73 IN-03.** Role/aria locators by default. NO new test-id additions expected — the existing `testIds.candidate.profile.*` / `testIds.voter.*` / `nav-menu-item` registry covers everything Phase 80 needs. `playwright/no-raw-locators` lint rule at `'error'` is non-negotiable; the modified a11y-smoke spec MUST pass `yarn lint:check`.

### Out-of-scope test-locator audit

- **D-15 — Verified during scout: NO test specs rely on `getByRole('listitem')` for orphan NavItems.** Tests use `data-testid="nav-menu-item"` (set on the inner `<svelte:element>` in `NavItem.svelte:60`, NOT on the wrapping `<div role="listitem">`). Removing the wrapping div for orphan NavItems (per D-03 auto-detect) is locator-safe. The `getByRole('list')` settle waits in `a11y-smoke.spec.ts:100` + `:109` match a visible `<ul>` on /results (likely the EntityDetails Tabs component at `apps/frontend/src/lib/components/tabs/Tabs.svelte:38`, OR an InfoAnswer `<ol>` rendered inside the drawer at `InfoAnswer.svelte:105`) — those match surfaces remain unchanged by Phase 80. Planner re-verifies at Plan 01 start if the settle waits regress.

### Claude's Discretion

- **Svelte 5 idiom for `titleId` generation in NavGroup** (D-02): planner picks at PLAN.md time. Options: `$props.id()` (if Svelte 5 exposes it), `crypto.randomUUID()` (browser-native, SSR-safe via the SSR polyfill), a module-scoped incrementing counter (matches the existing `menuId` pattern). Default: whatever the Svelte 5 idiomatic recommendation is per the framework's docs at PLAN.md time.
- **Test-name prefix on regression assertions** (D-06): rename `A11Y-03` → `A11Y-04` in the spec test names to reflect the current requirement ID, OR preserve the historical Phase 76 `A11Y-03` prefix (since the spec FILE was authored under that requirement). Default: rename to `A11Y-04` — the per-rule regression assertion IS Phase 80's deliverable, not Phase 76's. The Phase 76 first-run-baseline test framing migrates to the post-fix-gate framing.
- **Plan count** (D-08): default 1 bundled plan; planner may split into 2 if scope exceeds per-plan ceiling. The cite-and-fix-todo estimates "1-2 plans" — bundling 3 fixes + spec tightening + baseline + verification into 1 plan is defensible because individual change sizes are small and tightly coupled.
- **Whether to use Svelte 5 `setContext` / `getContext` (component-level) or a module-scoped key constant for the NavGroup context** (D-03): planner picks at PLAN.md time. The standard Svelte idiom is a module-scoped `Symbol()` key constant exported from `./navGroupContext.ts` (mirrors the `filterContext` precedent at `apps/frontend/src/lib/voter/state/filterContext.svelte.ts` from v2.6 Phase 64 — Symbol-keyed module-scoped context, scoped per consumer).
- **Whether to add a "section role unchanged" comment to NavGroup.svelte explaining why the `<section>` element survives the fix** (D-02): default YES — a 1-line comment at NavGroup.svelte:37 anchoring "section preserved for `:before` line-separator styling; role=list migrated to inner div for axe `list` rule compliance" preserves the structural intent. Matches the v2.7 P67 / Phase 73 IN-03 inline-`// reason:` convention.

### Folded Todos

None folded. The keyword-matched todos surfaced by `gsd-sdk query todo.match-phase 80` (30 matches) route to OTHER phases per `.planning/STATE.md §"Deferred Items"` — see Reviewed Todos under `<deferred>` below. Phase 80's scope is bounded by REQUIREMENTS A11Y-04 (1 requirement); folding peripheral todos would create scope conflict.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 80 anchors (REQUIREMENTS / ROADMAP / STATE / PROJECT)

- `.planning/REQUIREMENTS.md` §A11Y-04 — locked success criteria; the per-requirement-ID contract listing all 3 distinct rule-IDs + per-rule fix shape hints.
- `.planning/ROADMAP.md` §"Phase 80: A11Y Axe Cite-and-Fix" (lines 130-141) — phase goal + dependencies + 5 success criteria + plan estimate (TBD; defaulted to 1 plan via D-08).
- `.planning/STATE.md` — v2.10 milestone state; Phase 79 closed 2026-05-13; Phase 80 ready to plan.
- `.planning/PROJECT.md` §"Current Milestone: v2.10" — milestone framing + 5-phase shape + Phase 80 is the MEDIUM-priority a11y cite-and-fix anchor.
- `.planning/todos/pending/2026-05-12-a11y-axe-first-run-violations.md` — original cite-and-fix scope document (filed at Phase 76 Plan 04 close); per-rule effort sizing + total estimate ("1-2 plans"). Phase 80 IS this todo's resolution.

### Phase 76 baseline + cite-and-fix evidence

- `.planning/milestones/v2.9-phases/76-profile-a11y/76-A11Y-BASELINE.md` — first-run baseline; PRESERVED as historical evidence (D-07 cross-link target). Source of truth for the 5 violations Phase 80 resolves.
- `.planning/milestones/v2.9-phases/76-profile-a11y/76-CONTEXT.md` D-04 / D-07 / D-08 / D-09 — `PLAYWRIGHT_A11Y` opt-in flag; 5-route smoke surface; axe scan flakiness mitigation; axe smoke determinism contract. Phase 80 inherits.
- `.planning/milestones/v2.9-phases/76-profile-a11y/76-04-PLAN.md` Task 3 — Phase 76 baseline-capture mandate; documents the artifact format Phase 80 mirrors.
- `.planning/milestones/v2.9-phases/76-profile-a11y/76-VERIFICATION.md` — Phase 76 verdict shape (GREEN-WITH-DEFERRAL); Phase 80's `80-VERIFICATION.md` follows the same structure.

### Determinism + parity contract inheritance

- `.planning/milestones/v2.9-phases/73-determinism-baseline/73-CONTEXT.md` D-01..D-10 — binding determinism contract (3-run `--workers=1` cold-start identical pass/fail; vite-cache wipe recipe). Phase 80 inherits via D-09 / D-11.
- `.planning/milestones/v2.9-phases/73-determinism-baseline/73-VERIFICATION.md` — verdict + 3-run SHA-identity. The Phase-73-locked baseline contract Phase 80 MUST preserve.
- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-VERIFICATION.md` — Phase 79 verdict (passed-with-deferral); locks the v2.10 anchor at SHA `ff0334f856…` (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE). Phase 80 verification asserts this anchor holds through component changes.
- `tests/scripts/diff-playwright-reports.ts` — parity-script restored in Phase 73 P06; Phase 80 verification invokes the self-identity smoke (D-12).
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs` — one-shot constants regenerator; bind-source if Phase 80 verification surfaces PASS/DATA_RACE/CASCADE shifts that require regen.
- `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:11-32` — IMGPROXY_TIED_TITLES list; D-13 confirms Phase 80 does not collide with this list.

### Direct-precedent context references

- `.planning/milestones/v2.9-phases/74-high-leverage-e2e-coverage/74-CONTEXT.md` D-09..D-13 — determinism contract + vite-cache wipe + locator convention + spec file layout. Phase 80 inherits verbatim.
- `.planning/milestones/v2.9-phases/75-question-rendering-specs/75-CONTEXT.md` D-04 / D-06 — scope-marked filenames; role/aria + `// reason:` test-id convention. Phase 80 follows.
- `.planning/milestones/v2.9-phases/78-cleanup-hygiene-phase/78-CONTEXT.md` (CLEAN-01 / CLEAN-04 surfaces) — `db:*` rename + i18n wrapper `TranslationKey` tightening. Phase 80 uses canonical `db:*` commands; relies on `TranslationKey` typing for D-05 i18n key swap safety.

### Component fix surfaces (Phase 80 will modify)

- `apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte:32-47` — `<section role="list">` + optional `<h4>` title. Phase 80 D-02 modifies: hoist `<h4>` outside `role="list"` div + `aria-labelledby` link + push `setContext(NAV_GROUP_CONTEXT_KEY, true)` to enable NavItem auto-detect.
- `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte:50-68` — `<div role="listitem">` wrapper. Phase 80 D-03 modifies: conditional wrap via `getContext(NAV_GROUP_CONTEXT_KEY)` auto-detect.
- `apps/frontend/src/lib/dynamic-components/navigation/Navigation.svelte:56-62` — `<nav>` element (landmark). NOT modified — landmark semantics survive Phase 80.
- `apps/frontend/src/lib/components/button/Button.svelte:183` — aria-label conditional. Phase 80 D-05 (A) modifies: extend from `variant === 'icon'` to include `'floating-icon'`.
- `apps/frontend/src/lib/components/button/Button.svelte:201` — text-label render conditional. NOT modified — Phase 80 keeps text-label hidden for floating-icon (the variant's visual semantics); aria-label is the SR-accessible name.
- `apps/frontend/src/lib/components/modal/drawer/Drawer.svelte:96-102` — `<Button variant="floating-icon" text="close">`. Phase 80 D-05 (B) modifies: `text="close"` → `text={t('common.closeDialog')}` (the `t` callable is already in scope via `getComponentContext()` at Drawer.svelte:65).
- `apps/frontend/src/lib/components/modal/drawer/Drawer.svelte:89-94` — non-floating close button reference. NOT modified — already uses `t('common.closeDialog')` for its sr-only label. Phase 80 makes the floating variant consistent.
- `apps/frontend/messages/en/common.json:20` (+ fi/sv/da equivalents) — `common.closeDialog` i18n key. EXISTS; Phase 80 reuses without adding new keys.
- `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte:33` — passes `title={t('common.language.select')}` to NavGroup (the ONLY consumer that exercises the titled-NavGroup path Phase 80 fixes). Phase 80's D-02 fix specifically resolves this surface.

### Consumer-side surfaces (NOT modified — auto-resolved via D-03)

- `apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte:57` — orphan close NavItem. Auto-resolves via D-03 NavItem context-detect.
- `apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte:40` — orphan close NavItem. Auto-resolves.
- `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte:37` — orphan close NavItem. Auto-resolves.

### Test surface (Phase 80 will modify)

- `tests/tests/specs/a11y/a11y-smoke.spec.ts:159-177` (UNLOCATED_ROUTES test body) + `:182-200` (LOCATED_ROUTES test body) — current `console.log(...)` + `testInfo.attach(...)` first-run-baseline framing. Phase 80 D-06 modifies: replace `console.log` with per-rule trio + global zero assertions; preserve `testInfo.attach(...)` for debug artifacts.

### Phase artifact (Phase 80 will create)

- `.planning/phases/80-a11y-axe-cite-and-fix/80-A11Y-BASELINE.md` — NEW artifact (D-07). Documents post-fix 0-violation state across all 6 routes; cross-links backward to `76-A11Y-BASELINE.md`.
- `.planning/phases/80-a11y-axe-cite-and-fix/80-VERIFICATION.md` — NEW artifact at Plan 01 close. Follows Phase 76 verdict shape (5 SCs assessed + verdict + follow-up todos if any).

### Context / mechanism references

- `apps/frontend/src/lib/voter/state/filterContext.svelte.ts` — v2.6 P64 Symbol-keyed module-scoped Svelte context precedent. Phase 80 D-03 NavGroup context mirrors the pattern (module-scoped Symbol key in `apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts`).
- `apps/frontend/src/routes/(voters)/+layout.svelte:72` — `menuId` constant pattern; alternative reference for NavGroup `titleId` generation if Svelte 5 idiom (`$props.id()` / `useId`) is not preferred.

### Settle-wait dependency surfaces (verified locator-safe — NOT modified)

- `apps/frontend/src/lib/components/tabs/Tabs.svelte:38` — `<ul>` host for EntityDetails tabs. The `getByRole('list')` settle wait at `a11y-smoke.spec.ts:100` + `:109` likely matches this surface on /results + voter-detail-drawer. Phase 80 does NOT modify; settle waits remain stable.
- `apps/frontend/src/lib/components/infoAnswer/InfoAnswer.svelte:105` — `<ol>` host for info answers. Alternative settle-wait match surface in the drawer route. NOT modified.
- `tests/tests/utils/testIds.ts:150-151` — `nav-menu` / `nav-menu-item` registry. NOT modified — Phase 80 needs no new test-ids.

### Project-level conventions

- `CLAUDE.md` §"Development Commands" + §"Single Test Development" — `yarn test:e2e` invocation; Phase 78-landed `db:*` aliases are the canonical form Phase 80 uses.
- `CLAUDE.md` §"Important Implementation Notes" — "Localization — all user-facing strings must support multiple locales" (drives D-05 (B) i18n key swap); "Test accessibility — app must be WCAG 2.1 AA compliant" (drives the entire phase).
- `CLAUDE.md` §"Svelte Warning-Accepted Format" — applies if any Phase 80 component change triggers a vite-plugin-svelte warning; use `// svelte-warning: accepted — <rationale>` inline. Not expected — fixes are additive ARIA + i18n changes.
- `.agents/code-review-checklist.md` — apply at PLAN.md authoring time + per-plan close.
- `tests/eslint.config.mjs` — post-Phase-73 lint config with 7 `playwright/*` rules at `'error'`. The modified a11y-smoke spec MUST pass `yarn lint:check`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`getComponentContext()` `t` callable** — already in scope at `Drawer.svelte:65`; no new import needed for D-05 (B) i18n key swap.
- **`common.closeDialog` i18n key** — exists in all 4 locales (en/fi/sv/da) at `apps/frontend/messages/en/common.json:20` (+ fi/sv/da equivalents). Reused for the floating-icon close button accessible name.
- **`testIds.candidate.profile.*` + `nav-menu-item` test-id registry** — covers all test-locator needs; NO new test-id additions expected (D-14).
- **`filterContext.svelte.ts` Symbol-keyed module-scoped context pattern** (v2.6 P64) — direct precedent for D-03 NavGroup context.
- **`menuId` module-scoped constant pattern** (`voters/+layout.svelte:72`) — alternative reference for D-02 `titleId` generation if Svelte 5 idiom is not preferred.
- **`PLAYWRIGHT_A11Y` opt-in env-gated project** (Phase 76 P03 — `tests/playwright.config.ts`) — Phase 80 inherits unchanged; the regression assertion gate runs under the same opt-in flag.
- **`AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()`** (a11y-smoke.spec.ts:163 + :186) — existing pattern; Phase 80 keeps the call; only tightens the post-analyze assertions.

### Established Patterns

- **Shared-component fix propagates to all consumers** (v2.8 P69 ALLIANCE-01 widening EntityCard's "subentities" branch — single component change, downstream tabs all benefit). Phase 80 D-03 follows: NavItem context-detect propagates to voter/candidate/admin orphan close-buttons without per-consumer edits.
- **i18n key reuse where canonical key already exists** (v2.9 P75 + P76 `t('components.input.error.*')` reuse). Phase 80 D-05 (B) reuses `common.closeDialog` rather than coining a new key.
- **Inline `// reason:` justification** (v2.8 P70 / v2.8 P71 / Phase 73 IN-03). Phase 80 may use `// reason:` blocks on Button.svelte:183 aria-label extension OR NavGroup.svelte:37 `<section>`-preservation if planner judges them load-bearing.
- **3-run cold-start determinism gate** (Phase 73 P06 / Phase 74 D-09 / Phase 75 D-07 / Phase 76 D-09). Phase 80's Plan 01 close runs this gate post-component-change verification.
- **Vite-cache wipe before parity verification** (Phase 73 P06 + Phase 76 D-11 + Phase 78 CLEAN-01). Phase 80 D-11 inherits.
- **Phase-local baseline artifact** (Phase 73 `73-PARITY-BASELINE.md` + Phase 76 `76-A11Y-BASELINE.md`). Phase 80 D-07 follows: `80-A11Y-BASELINE.md` phase-local with backward cross-link.
- **Per-rule + global assertion mix** (NEW pattern Phase 80 introduces — first cite-and-fix gate in the project; mirrors industry a11y CI conventions).

### Integration Points

- **`apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte`** — Plan 01 modifies (D-02 hoist + setContext).
- **`apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte`** — Plan 01 modifies (D-03 conditional listitem wrap).
- **`apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts`** — NEW file (D-03 Symbol-keyed context module).
- **`apps/frontend/src/lib/components/button/Button.svelte`** — Plan 01 modifies (D-05 (A) aria-label branch).
- **`apps/frontend/src/lib/components/modal/drawer/Drawer.svelte`** — Plan 01 modifies (D-05 (B) text prop i18n key swap).
- **`tests/tests/specs/a11y/a11y-smoke.spec.ts`** — Plan 01 modifies (D-06 per-rule trio + global zero assertions; test-name prefix `A11Y-03` → `A11Y-04` per Claude's Discretion).
- **`.planning/phases/80-a11y-axe-cite-and-fix/80-A11Y-BASELINE.md`** — NEW artifact (D-07).
- **`.planning/phases/80-a11y-axe-cite-and-fix/80-VERIFICATION.md`** — NEW artifact at Plan 01 close.
- **NO changes to:** `VoterNav.svelte` / `CandidateNav.svelte` / `AdminNav.svelte` (orphan close buttons auto-resolve via D-03 context-detect); `LanguageSelection.svelte` (its titled-NavGroup usage gets fixed automatically via NavGroup's D-02 hoist); `Navigation.svelte` (`<nav>` landmark unchanged); `Tabs.svelte` / `InfoAnswer.svelte` (settle-wait surfaces — D-15 verified locator-safe); `playwright.config.ts` (PLAYWRIGHT_A11Y project unchanged); `tests/package.json` (`@axe-core/playwright` dep already landed in Phase 76 P03); `tests/scripts/diff-playwright-reports.ts` (no constants change expected; conditional regen per D-10).

</code_context>

<specifics>
## Specific Ideas

- **Symbol-keyed module-scoped NavGroup context (D-03):**
  ```typescript
  // apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts
  export const NAV_GROUP_CONTEXT_KEY: unique symbol = Symbol('nav-group');
  ```
  ```svelte
  <!-- NavGroup.svelte (script block) -->
  <script lang="ts">
    import { setContext } from 'svelte';
    import { NAV_GROUP_CONTEXT_KEY } from './navGroupContext';
    // ...existing props
    setContext(NAV_GROUP_CONTEXT_KEY, true);
  </script>
  ```
  ```svelte
  <!-- NavItem.svelte (script block) -->
  <script lang="ts">
    import { getContext } from 'svelte';
    import { NAV_GROUP_CONTEXT_KEY } from './navGroupContext';
    // ...existing props
    const inNavGroup = getContext(NAV_GROUP_CONTEXT_KEY) === true;
  </script>
  ```

- **Per-rule + global-zero assertion shape (D-06):** captured in CONTEXT under Decisions §D-06. Planner refines exact import/helper structure at PLAN.md time (e.g., extracting `assertNoA11yViolations(results, route)` helper if the assertion block reads heavy across 6 routes — Claude's Discretion).

- **`80-A11Y-BASELINE.md` shape:** mirrors Phase 76's structure (header + run conditions + per-route table + determinism check) but with all rows showing "0 violations — clean post-fix baseline" + a "Resolved in Phase 80" cross-reference table that maps each original violation rule-ID → fix decision (D-02/D-03/D-05) → modified file → modified line range.

- **Planner re-baseline at PLAN.md time:** Re-run `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` at Phase 80 start to confirm the Phase 76 baseline still holds (5 violations across 3 rule-IDs). If the baseline drifted between Phase 76 close (2026-05-12) and Phase 80 start (2026-05-13+), surface as a Phase 80 blocker before authoring the fix. Mirrors Phase 76 specifics last item.

- **Risk of latent post-fix violations:** When the structural fix lands, axe MAY surface NEW violations that were previously masked (e.g., the heading-outside-list change could trigger a heading-level-skip rule if the document outline becomes inconsistent). The global-zero gate (D-06) catches these; planner is empowered to widen Plan 01 if 1-2 small follow-on fixes surface OR file follow-up todos for anything that requires non-trivial work.

</specifics>

<deferred>
## Deferred Ideas

- **Multi-locale axe coverage** (inherited from Phase 76 D-07 Claude's Discretion): Phase 80 verifies en only (matches the Phase 76 first-run baseline locale). 4-locale axe extension is a future a11y phase candidate; out of v2.10 scope.
- **CI gating promotion** (inherited from Phase 76 D-04 alternative): The axe smoke remains `PLAYWRIGHT_A11Y=1` opt-in after Phase 80 closes. Promoting the smoke to default CI (i.e., gating every CI run) is a future decision once the baseline holds for ≥1 milestone without regression. Routed to v2.11+.
- **Native `<ul>` / `<li>` refactor of NavGroup / NavItem** (D-01 REJECTED option): If the targeted ARIA fix accumulates additional axe findings in future phases (e.g., screen-reader behavior diverges across SR engines), the native-HTML refactor remains a future candidate. Out of Phase 80 scope.
- **Axe smoke extension to candidate-app + admin-app routes** (D-04 adjacent surfaces): Phase 80 fixes the root cause (NavItem auto-detect) which propagates to all 3 nav consumers, but the smoke surface remains the 5+1 voter routes per Phase 76 CONTEXT D-07. Extending the smoke to candidate / admin routes is a future a11y phase; out of v2.10 scope.
- **JSON-serialized axe results for downstream tooling integration** (Phase 76 D-07 Claude's Discretion alternative): The `testInfo.attach(...)` JSON attachment in the existing spec already serves this — Phase 80 preserves it. Promoting to a dedicated CI artifact pipeline is a future enhancement.
- **Heading-level audit across voter / candidate / admin nav** (latent post-fix risk per `<specifics>`): If the hoisted h4 in NavGroup creates a document-outline gap (e.g., h2 → h4 skip), Phase 80 may surface a `heading-order` violation. The global-zero gate catches this; remediation could be in-phase (small) OR a follow-up todo (larger refactor).
- **Visual regression sanity check after Drawer floating-icon `text` prop change** (D-05 (B)): The `text` prop changing from `"close"` to `t('common.closeDialog')` ("Close dialog") is INVISIBLE to the user (floating-icon variant hides the text label per Button.svelte:201). No visual regression expected. PLAYWRIGHT_VISUAL is opt-in and not part of Phase 80's verification — but planner MAY run it as a courtesy sanity check.
- **`getByRole('listitem')` lint guard** (D-15 verified locator-safety): If future specs accidentally rely on `getByRole('listitem')` matching the NavItem wrappers (which Phase 80 makes conditional), a custom lint rule could prevent it. Out of v2.10 scope; trivial follow-up todo if it surfaces.

### Reviewed Todos (not folded)

All 30 keyword-matched todos surfaced by `gsd-sdk query todo.match-phase 80` are routed to OTHER phases per `.planning/STATE.md §"Deferred Items"`. Folding any of them into Phase 80 would create scope conflict.

- `2026-05-12-a11y-01-product-gap-cells.md` — Phase 81 / A11Y-05+06 (email/url) + Phase 82 / A11Y-07 (required-empty). Distinct surface from Phase 80 (form validation, not navigation structure).
- `2026-05-13-candidate-profile-image-upload-cascade.md` — Phase 83 / DETERM-06. Test-reliability, not a11y.
- `2026-05-13-voter-matching-detail-flakes.md` — Phase 83 / DETERM-07. Test-reliability, not a11y.
- `2026-05-12-settings-02-voter-authoring-product-gap.md` — re-deferred to v2.11+ per `.planning/STATE.md`.
- `2026-05-12-settings-03-voter-required-product-gap.md` — re-deferred to v2.11+.
- `2026-05-12-voters-layout-non-reactive-appsettings.md` — re-deferred to v2.11+.
- `2026-05-13-filtergroup-or-mode-ui-product-gap.md` — re-deferred to v2.11+.
- `2026-05-13-constituency-filter-product-gap.md` — re-deferred to v2.11+.
- `2026-04-25-normalise-app-shared-paradigm.md` — closed in v2.8 P72; obsolete match.
- `2026-04-25-remove-mergesettings-reexports.md` — closed in v2.8 P72; obsolete match.
- `2026-04-30-alliance-tab-rendering-and-sections-config.md` — closed in v2.8 P69; obsolete match.
- `2026-05-08-cleanup-65-01-bind-rationale-comments.md` — closed in v2.8 P70; obsolete match.
- `2026-05-11-e2e-01-single-locale-runtime-override.md` — Phase 74 D-04 deferral; future runtime-override capability. NOT a11y.
- `2026-05-12-58-e2e-audit-addendum-qspec.md` — Phase 75 follow-up; NOT a11y.
- `2026-05-12-qspec-01-i18n-hardening.md` — Phase 75 follow-up; NOT a11y.
- `2026-05-12-qspec-02-multi-choice-categorical-variant.md` — v2.10+ matching/question-spec feature; NOT a11y.
- `2026-05-12-candidate-profile-cascading-race.md` — closed in v2.10 P79; obsolete match.
- `2026-05-09-rewrite-parent-answer-imputation.md` — matching-package internal; future milestone.
- `frontend-project-id-scoping.md` — v2.11+ candidate (re-deferred from v2.10).
- `password-reset-code-method.md` — Strapi-era leftover; obsolete.
- `register-page-registrationkey-method.md` — Strapi-era leftover; obsolete.
- `results-url-refactor-followups.md` — v2.11+ candidate.
- `2026-03-28-generalize-candidate-app-to-party-app.md` — v2.11+ architectural change.
- `2026-03-28-investigate-migrating-candidate-answer-store.md` — architectural investigation; future milestone.
- `sql-linting-formatting.md` — CI hygiene; not a11y.
- `adapter-package-loading.md` — not v2.10.
- `rename-admin-writer.md` — dev-seed internal API hygiene; low priority.
- `configurable-mock-data.md` — medium-priority; not v2.10.

Phase 80 is bounded to A11Y-04 (the 5 first-run violations baselined in Phase 76). Cleanup / architectural / non-a11y work belongs in other phases.

</deferred>

---

*Phase: 80-A11Y Axe Cite-and-Fix*
*Context gathered: 2026-05-13*
