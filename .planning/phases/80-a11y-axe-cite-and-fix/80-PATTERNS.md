# Phase 80: A11Y Axe Cite-and-Fix — Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 7 (5 modified + 2 new — artifacts excluded from analog mapping)
**Analogs found:** 7 / 7 (every code surface has an in-repo precedent)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts` (NEW) | context-module | static-detection (set-once, read-once at component init) | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` | role-match (precedent uses richer setter/getter API; Phase 80 uses bare Symbol export) |
| `apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte` (MOD) | shared Svelte component (ARIA structural) | render-time DOM/ARIA | itself (in-place edit; the file IS the analog) + `Drawer.svelte` for `getComponentContext()` shape if `t` were needed (it is NOT here) | exact (self) |
| `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte` (MOD) | shared Svelte component (conditional ARIA wrap) | render-time DOM/ARIA + module-context read | itself (in-place edit) + `filterContext.svelte.ts:18-21` `getContext(CONTEXT_KEY)` consumer pattern | exact (self) for shape; precedent for `getContext` call-site |
| `apps/frontend/src/lib/components/button/Button.svelte` (MOD line 183) | shared Svelte component (aria-label conditional) | render-time attribute derivation | itself — Phase 80 EXTENDS the existing `variant === 'icon'` conditional already at line 183 | exact (self) |
| `apps/frontend/src/lib/components/modal/drawer/Drawer.svelte` (MOD line 99) | shared Svelte component (i18n key swap on Button prop) | compile-time Paraglide key resolution + render-time prop | itself — `Drawer.svelte:92` already uses `t('common.closeDialog')` for the non-floating sr-only label; Phase 80 makes the floating branch CONSISTENT with it | exact (sibling line in same file) |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` (MOD test bodies in UNLOCATED_ROUTES + LOCATED_ROUTES) | E2E test spec (axe regression gate) | Playwright + axe-core analyze → filtered toHaveLength(0) assertions | itself (Phase 76 P03 first-run framing; Phase 80 TIGHTENS assertions in same file) | exact (self) |
| `.planning/phases/80-a11y-axe-cite-and-fix/80-A11Y-BASELINE.md` (NEW artifact) | doc artifact | manual — captures post-fix 0-violation state | `.planning/milestones/v2.9-phases/76-profile-a11y/76-A11Y-BASELINE.md` | exact (sibling baseline) |

**Excluded from analog mapping:** `.planning/phases/80-a11y-axe-cite-and-fix/80-VERIFICATION.md` — created at Plan close, follows the Phase 76 verdict shape (5 SCs assessed); no code excerpts needed.

## Pattern Assignments

### `navGroupContext.ts` (context-module, static-detection)

**Analog:** `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts`

**Symbol-keyed module-scoped context constant** (filterContext.svelte.ts:8):
```typescript
const CONTEXT_KEY = Symbol();
```

**Why this is the precedent:** This is the canonical project pattern for Svelte context keys — a module-scoped `Symbol()` (collision-free; never accidentally shared between contexts). `filterContext` then exports `getFilterContext()` / `initFilterContext()` accessors around the bare key. Phase 80's navGroupContext is structurally simpler — it only needs the key itself, since callers use bare `setContext` / `getContext` directly (no setter/getter helper layer needed for a `true` constant marker).

**Phase 80 adaptation** — export the key directly with `unique symbol` typing (RESEARCH §Code Example 2; CONTEXT D-03 §Specifics):
```typescript
// apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts (NEW)

/**
 * Module-scoped Symbol key — collision-free; `unique symbol` lets TypeScript
 * track the exact symbol identity for type-narrowing if needed downstream.
 *
 * Phase 80 D-03: NavGroup pushes `true` via setContext; NavItem reads via
 * getContext at component init to decide whether to render the wrapping
 * <div role="listitem">. The auto-detect propagates structurally to all
 * VoterNav / CandidateNav / AdminNav orphan close-buttons without per-consumer
 * prop drilling.
 */
export const NAV_GROUP_CONTEXT_KEY: unique symbol = Symbol('nav-group');
```

**Divergence from precedent:** `filterContext` uses `Symbol()` (untyped); Phase 80 uses `unique symbol` typing for slightly stronger type-narrowing on consumer reads. The descriptive label `'nav-group'` aids DevTools inspection (Symbol description is debug-only).

---

### `NavGroup.svelte` (D-02 hoist h4 outside role="list" + setContext)

**Analog:** Self (in-place ARIA refactor). The file currently has `role="list"` on `<section>` with `<h4>` as a non-listitem child — that IS the violation pattern. The fix is a localized refactor of lines 32-47.

**Current structure** (NavGroup.svelte:32-47):
```svelte
<!-- We use a <section> with an Aria role instead of a <ul> or similar
  because otherwise generic content passed via the slot might include
  invalid content for such an element. See:
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/listitem_role -->

<section
  role="list"
  {...concatClass(
    restProps,
    'before:content-[""] before:mx-16 before:my-md before:block before:border-t-md before:border-t-[var(--line-color)]'
  )}>
  {#if title}
    <h4 class="small-label py-sm flex items-center pl-[2.75rem]">{title}</h4>
  {/if}
  {@render children?.()}
</section>
```

**Phase 80 target structure** (RESEARCH §Pattern 1 + CONTEXT D-02):
```svelte
<script lang="ts">
  import { setContext } from 'svelte';
  import { concatClass } from '$lib/utils/components';
  import { NAV_GROUP_CONTEXT_KEY } from './navGroupContext';
  import type { NavGroupProps } from './NavGroup.type';

  let { title, children, ...restProps }: NavGroupProps = $props();

  // SSR-safe per-instance ID — Svelte 5.20.0+. Hydration-consistent (server-
  // rendered value matches client-rendered value).
  const titleId = $props.id();

  // reason: Top-level call — runs during component init when current_component
  // is bound (RESEARCH §Pitfall 3). Pushes parent-marker context BEFORE
  // children render so NavItem can read it.
  setContext(NAV_GROUP_CONTEXT_KEY, true);
</script>

<!-- reason: <section> preserved for `:before` line-separator CSS; role="list"
     migrated to inner <div> for axe `list` rule compliance (Phase 80 D-02). -->
<section
  {...concatClass(
    restProps,
    'before:content-[""] before:mx-16 before:my-md before:block before:border-t-md before:border-t-[var(--line-color)]'
  )}>
  {#if title}
    <h4 id={titleId} class="small-label py-sm flex items-center pl-[2.75rem]">{title}</h4>
  {/if}
  <div role="list" aria-labelledby={title ? titleId : undefined}>
    {@render children?.()}
  </div>
</section>
```

**Key delta points for planner:**
1. NEW imports: `setContext` from `'svelte'` + `NAV_GROUP_CONTEXT_KEY` from `'./navGroupContext'`.
2. NEW `$props.id()` rune call (Svelte 5.20.0+; project at ^5.53.12 per RESEARCH §Standard Stack).
3. NEW `setContext(NAV_GROUP_CONTEXT_KEY, true)` at script top-level.
4. `<section role="list">` → `<section>` (drop role from outer element).
5. NEW inner `<div role="list" aria-labelledby={title ? titleId : undefined}>` wraps `{@render children?.()}`.
6. `<h4>` gets `id={titleId}` so `aria-labelledby` resolves.
7. The existing block comment at lines 32-35 about why `<section>` + role is used should be REPLACED by the `// reason:` comment about `:before` CSS preservation + `role="list"` migration to inner div (Open Question 1 in RESEARCH).

---

### `NavItem.svelte` (D-03 conditional listitem wrap via getContext)

**Analog (self for shape):** NavItem.svelte:50-68 — currently unconditional `<div role="listitem">` wrap.

**Analog (consumer pattern for `getContext`):** `filterContext.svelte.ts:18-21`:
```typescript
export function getFilterContext(): FilterContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getFilterContext() called before initFilterContext()');
  return getContext<FilterContext>(CONTEXT_KEY);
}
```

**Why the consumer pattern matters:** `filterContext` calls `getContext` inside an exported accessor function (NOT inside an element attribute). Phase 80's NavItem follows the SAME discipline — call `getContext(NAV_GROUP_CONTEXT_KEY)` at the TOP LEVEL of the `<script>` block, bind to a local `const`, then reference the local var inside the `{#if}` template block (RESEARCH §Pitfall 2 — Svelte issue #7549; calling getContext inside an element attribute expression returns undefined during hydration).

**Current structure** (NavItem.svelte:27-68):
```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Icon } from '$lib/components/icon';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { concatClass } from '$lib/utils/components';
  import type { NavItemProps } from './NavItem.type';

  let { autoCloseNav = true, disabled, href, icon, text, children, ...restProps }: NavItemProps = $props();

  const { navigation } = getLayoutContext(onDestroy);

  // Create classes
  const classes = $derived.by(() => { /* unchanged */ });
</script>

<!-- We use a div with an Aria role instead of a `<li>` ... -->
<div role="listitem">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <svelte:element
    this={href == null ? 'button' : 'a'}
    {href}
    onclick={() => { if (autoCloseNav && navigation.close) navigation.close(); }}
    disabled={disabled || undefined}
    data-testid="nav-menu-item"
    {...concatClass(restProps, classes)}>
    {#if icon}<Icon name={icon} />{/if}
    <span class="uc-first">{text}</span>
    {@render children?.()}
  </svelte:element>
</div>
```

**Phase 80 target structure** (RESEARCH §Pattern 2 + CONTEXT D-03):
```svelte
<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { Icon } from '$lib/components/icon';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { concatClass } from '$lib/utils/components';
  import { NAV_GROUP_CONTEXT_KEY } from './navGroupContext';
  import type { NavItemProps } from './NavItem.type';

  let { autoCloseNav = true, disabled, href, icon, text, children, ...restProps }: NavItemProps = $props();

  const { navigation } = getLayoutContext(onDestroy);

  // reason: Top-level getContext read — NOT inside an element attribute
  // (Svelte issue #7549; RESEARCH §Pitfall 2). Static structural detection:
  // NavItem's containment in a NavGroup is fixed at component creation.
  const inNavGroup = getContext(NAV_GROUP_CONTEXT_KEY) === true;

  const classes = $derived.by(() => { /* unchanged */ });
</script>

{#if inNavGroup}
  <div role="listitem">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <svelte:element
      this={href == null ? 'button' : 'a'}
      {href}
      onclick={() => { if (autoCloseNav && navigation.close) navigation.close(); }}
      disabled={disabled || undefined}
      data-testid="nav-menu-item"
      {...concatClass(restProps, classes)}>
      {#if icon}<Icon name={icon} />{/if}
      <span class="uc-first">{text}</span>
      {@render children?.()}
    </svelte:element>
  </div>
{:else}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <svelte:element
    this={href == null ? 'button' : 'a'}
    {href}
    onclick={() => { if (autoCloseNav && navigation.close) navigation.close(); }}
    disabled={disabled || undefined}
    data-testid="nav-menu-item"
    {...concatClass(restProps, classes)}>
    {#if icon}<Icon name={icon} />{/if}
    <span class="uc-first">{text}</span>
    {@render children?.()}
  </svelte:element>
{/if}
```

**Key delta points for planner:**
1. NEW imports: `getContext` from `'svelte'` (already imports `onDestroy`) + `NAV_GROUP_CONTEXT_KEY` from `'./navGroupContext'`.
2. NEW `const inNavGroup = getContext(NAV_GROUP_CONTEXT_KEY) === true;` at script top-level.
3. Wrap-conditional `{#if inNavGroup}` / `{:else}` around the `<svelte:element>` block. The two branches' `<svelte:element>` body is IDENTICAL — Pattern 2 trade-off accepted (RESEARCH §Pattern 2 commentary: ~10 LOC of duplication; a `{#snippet}` extraction is planner's discretion).
4. The block-comment at NavItem.svelte:50 about "we don't place items within a valid parent" becomes STALE post-D-03 — RESEARCH Open Question 1 recommends planner updates it to reflect the new conditional-wrap reality.
5. `data-testid="nav-menu-item"` stays on the inner `<svelte:element>` in BOTH branches (D-15 verified locator-safe).

---

### `Button.svelte` (D-05A extend aria-label conditional)

**Analog:** Self — Button.svelte:183 already has `aria-label={variant === 'icon' ? effectiveText : undefined}`. Phase 80 extends it to include `'floating-icon'`.

**Current** (Button.svelte:178-186):
```svelte
<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:element
  this={href == null ? 'button' : 'a'}
  role="button"
  tabindex={disabled ? -1 : 0}
  href={disabled ? undefined : href}
  aria-label={variant === 'icon' ? effectiveText : undefined}
  title={variant === 'icon' || variant === 'responsive-icon' ? effectiveText : undefined}
  disabled={disabled || loading || undefined}
  {...concatClass(restProps, classes)}>
```

**Phase 80 target** (RESEARCH §Code Example 3 + CONTEXT D-05A):
```svelte
<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:element
  this={href == null ? 'button' : 'a'}
  role="button"
  tabindex={disabled ? -1 : 0}
  href={disabled ? undefined : href}
  aria-label={variant === 'icon' || variant === 'floating-icon' ? effectiveText : undefined}
  title={variant === 'icon' || variant === 'responsive-icon' ? effectiveText : undefined}
  disabled={disabled || loading || undefined}
  {...concatClass(restProps, classes)}>
```

**Key delta:** Single-character-class change on line 183 — `variant === 'icon'` → `variant === 'icon' || variant === 'floating-icon'`. The adjacent `title` conditional at line 184 stays UNCHANGED (the `'responsive-icon'` variant renders visible text via `sr-only sm:not-sr-only` per Button.svelte:165 — no aria-label needed; the `title` attribute provides hover-tooltip behavior). RESEARCH §Confirmation 3 verified `floating-icon` has exactly ONE consumer (Drawer.svelte:98) — zero blast radius.

**Planner consideration** (Phase 80 §Established Patterns "Inline `// reason:` justification"): MAY add a `// reason:` block above line 183 explaining the floating-icon extension if planner judges it load-bearing (RESEARCH §Pattern 1 / §Established Patterns). Default: no comment — the diff is self-explanatory.

---

### `Drawer.svelte` (D-05B i18n key swap on Button text prop)

**Analog (sibling-line in same file):** Drawer.svelte:88-94 — the non-floating close-button branch already uses `t('common.closeDialog')` for its sr-only label:
```svelte
{#if !showFloatingCloseButton}
  <form method="dialog">
    <button class="btn btn-circle btn-ghost btn-sm absolute top-2 right-2">
      <span aria-hidden="true">✕</span>
      <span class="sr-only">{t('common.closeDialog')}</span>
    </button>
  </form>
{:else}
  <Button
    type="button"
    variant="floating-icon"
    text="close"               <!-- ← Phase 80 changes this line -->
    icon="close"
    onclick={() => closeModal()}
    class="!absolute right-0 bottom-0 z-10" />
{/if}
```

**Why the sibling-line is the perfect analog:** The non-floating branch (Drawer.svelte:92) already does the right thing — `t('common.closeDialog')` against a `<span class="sr-only">`. Phase 80's job is to make the floating-icon branch CONSISTENT with it. The `t` callable is already in scope at Drawer.svelte:65 (`const { t } = getComponentContext();`) — no new import.

**Phase 80 target** (RESEARCH §Code Example 3 + CONTEXT D-05B):
```svelte
<Button
  type="button"
  variant="floating-icon"
  text={t('common.closeDialog')}
  icon="close"
  onclick={() => closeModal()}
  class="!absolute right-0 bottom-0 z-10" />
```

**Key delta:** Single-property change on line 99 — `text="close"` → `text={t('common.closeDialog')}`. RESEARCH §Confirmation 2 verified `common.closeDialog` exists in ALL 7 project locales (en/fi/sv/da/lb/fr/et — CONTEXT.md claimed 4; reality is 7) AND is a member of the `TranslationKey` union at `apps/frontend/src/lib/types/generated/translationKey.ts:305`. Type-narrowing catches typos at compile time (Phase 78 CLEAN-04 wrapper tightening).

**Required by CLAUDE.md:** "Localization — all user-facing strings must support multiple locales." The accessible name announced to screen readers IS a user-facing string. The pre-fix `text="close"` ships English to fi/sv/da/lb/fr/et users — non-negotiable fix.

---

### `a11y-smoke.spec.ts` (D-06 per-rule trio + global zero assertions)

**Analog:** Self — Phase 76 P03 authored the spec with first-run-baseline framing (`console.log` + `testInfo.attach`). Phase 80 TIGHTENS the assertions in the same file. The for-loop dispatcher pattern (module-level for…of, satisfies `playwright/no-conditional-in-test`) is preserved.

**Current test body shape** (a11y-smoke.spec.ts:158-178 — UNLOCATED_ROUTES; LOCATED_ROUTES at 181-199 mirrors):
```typescript
for (const route of UNLOCATED_ROUTES) {
  test(`A11Y-03 axe smoke — ${route.name}`, async ({ page }, testInfo) => {
    await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
    await route.settle(page);

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    // First-run baseline ONLY — log + attach raw violations JSON for Plan 04 baseline artifact.
    // Do NOT assert results.violations.length === 0; that's the cite-and-fix downstream phase's job.

    console.log(`[A11Y-03] ${route.name}: ${results.violations.length} violations`);

    await testInfo.attach(`axe-violations-${route.name}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json'
    });

    // Defensive sanity check — analyze() returned a result object with the expected shape.
    expect(results).toHaveProperty('violations');
    expect(Array.isArray(results.violations)).toBe(true);
  });
}
```

**Phase 80 target test body** (RESEARCH §Code Example 4 + CONTEXT D-06):
```typescript
for (const route of UNLOCATED_ROUTES) {
  test(`A11Y-04 axe smoke — ${route.name}`, async ({ page }, testInfo) => {
    await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
    await route.settle(page);

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    // Preserve debug attachment for failure triage (RESEARCH §Pitfall 6 —
    // the global-zero gate doesn't itemize rule-IDs; the JSON attachment is
    // the fastest path to root cause when a new violation surfaces).
    await testInfo.attach(`axe-violations-${route.name}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json'
    });

    // Phase 80 cite-and-fix gate. Phase 76 baselined 5 violations across 3
    // rule-IDs: aria-required-parent × 4, list × 2, button-name × 1
    // (76-A11Y-BASELINE.md). The per-rule trio documents intent permanently.
    expect(results.violations.filter((v) => v.id === 'aria-required-parent')).toHaveLength(0);
    expect(results.violations.filter((v) => v.id === 'list')).toHaveLength(0);
    expect(results.violations.filter((v) => v.id === 'button-name')).toHaveLength(0);

    // SC #4 global zero gate — "0 violations across all 6 routes". Catches
    // new rule-IDs the per-rule trio doesn't name (e.g., heading-order from
    // a latent h4-hoist outline gap; RESEARCH §Pitfall 1).
    expect(results.violations).toHaveLength(0);
  });
}
```

**Key delta points for planner:**
1. Test-name prefix `A11Y-03` → `A11Y-04` (Claude's Discretion in CONTEXT D-06; default rename per CONTEXT.md final §Claude's Discretion). Apply to both for-loops.
2. REMOVE `console.log(...)` call (replaced by deterministic assertions per CONTEXT D-06).
3. PRESERVE `testInfo.attach(violations.json)` (CONTEXT D-06 + RESEARCH §Anti-Patterns — required for failure triage).
4. PRESERVE the trailing defensive `expect(results).toHaveProperty('violations')` + `expect(Array.isArray(results.violations)).toBe(true)` per RESEARCH Open Question 3 recommendation (costs nothing; defends against AxeBuilder API breakage on future axe-core upgrades). Planner may remove if judged redundant — Claude's Discretion.
5. INSERT three `expect(results.violations.filter((v) => v.id === '<rule>')).toHaveLength(0)` lines for `aria-required-parent`, `list`, `button-name`.
6. INSERT one `expect(results.violations).toHaveLength(0)` global gate (must come AFTER the per-rule trio — order matters for triager-friendly failure output per RESEARCH §Pitfall 6).
7. Apply the SAME transformation to the LOCATED_ROUTES for-loop body (lines 181-199).

**Header comment update:** The top-of-file JSDoc at lines 1-34 references "A11Y-03" + "wiring + first-run baseline only" — planner updates these references to "A11Y-04" + "cite-and-fix regression gate" per CONTEXT D-06 framing migration. The STATE PREFILL paragraph (lines 22-33) stays accurate — Phase 80 doesn't change the URL prefill recipe.

---

### `80-A11Y-BASELINE.md` (new artifact)

**Analog:** `.planning/milestones/v2.9-phases/76-profile-a11y/76-A11Y-BASELINE.md` (full file — 90+ lines; see header excerpt below).

**Header / Run conditions shape** (76-A11Y-BASELINE.md:1-13):
```markdown
# Phase 76 Axe Smoke — First-Run Baseline (2026-05-12)

## Run conditions

- **Command:** `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1 --reporter=json`
- **HEAD at capture:** `<sha>` (post-Task-2 parity-output commit; pre-Task-3 baseline commit).
- **Frontend:** vite dev server on `localhost:5173` (restarted post-vite-cache wipe + post-build).
- **Backend:** Supabase local (CLI v2.83.0); e2e template seeded via `yarn supabase:reset && yarn dev:seed --template e2e` (22 questions, 18 candidates, 22 nominations).
- **WCAG tags applied:** `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.
- **Axe-core version:** 4.11.4 (transitive of `@axe-core/playwright@4.11.3`).
- **Determinism check:** 2 successive PLAYWRIGHT_A11Y=1 runs produced byte-identical per-route per-rule violation counts.
- **Total violations across all routes:** 5 (results=2 + voter-detail-drawer=3; all other 4 routes=0).
```

**Per-route violation breakdown table shape** (76-A11Y-BASELINE.md:33-50):
```markdown
### Route: results

| Rule ID                | Impact   | Count (nodes) | helpUrl                                                                                |
|------------------------|----------|---------------|----------------------------------------------------------------------------------------|
| `aria-required-parent` | critical | 2             | https://dequeuniversity.com/rules/axe/4.11/aria-required-parent?application=playwright |
| `list`                 | serious  | 1             | https://dequeuniversity.com/rules/axe/4.11/list?application=playwright                 |

**Total: 2 violations (3 nodes).**
```

**Sanitization note** (76-A11Y-BASELINE.md:67-69) — Phase 80 MUST mirror this verbatim:
```markdown
## Sanitization note

Per Plan 03 T-76-03-01 input-value sanitization: this baseline records `rule-id` + `impact` + `node-count` + `helpUrl` ONLY. Raw `node.html` snippets from `axe.violations[].nodes[].html` are NOT committed — they could contain candidate display names, biographies, or other seeded fixture data.
```

**Phase 80 adaptation:**
1. Title: `# Phase 80 Axe Smoke — Post-Fix Baseline (2026-05-XX)` (date filled at Plan 01 close).
2. Run conditions: SAME shape; update HEAD SHA + replace `dev:seed` with canonical `db:seed` per Phase 78 CLEAN-01 (RESEARCH §Project Constraints item 6); use `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean` per D-11.
3. Per-route violation table: ALL 6 routes show `(0 violations — clean post-fix baseline)`.
4. NEW section: **Resolved in Phase 80** cross-reference table mapping original violation rule-ID → fix decision (D-02/D-03/D-05A/D-05B) → modified file → modified line range (CONTEXT §Specifics + D-07).
5. NEW section: **Cross-Links — backward to 76-A11Y-BASELINE.md** (D-07 — preserves Phase 76 history as immutable evidence).
6. Sanitization note: PRESERVED verbatim (Phase 80 inherits Phase 76's sanitization contract).
7. Determinism check outcome: 2-run identical 0-violation lists (per CONTEXT D-09).

---

## Shared Patterns

### Pattern: Svelte 5 `setContext` / `getContext` lifecycle discipline

**Source:** `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:8-21` + Svelte 5 official docs (svelte.dev/docs/svelte/context).

**Apply to:** `NavGroup.svelte` (provider) + `NavItem.svelte` (consumer) + `navGroupContext.ts` (key module).

**Rules (RESEARCH §Pitfalls 2 + 3):**
1. **Provider:** Call `setContext(KEY, value)` at TOP LEVEL of `<script>` block — never inside `$derived`, `$effect`, event handlers, or any post-init code (Svelte issue #5147 — silent no-op).
2. **Consumer:** Call `getContext(KEY)` at TOP LEVEL of `<script>` block — never inside an HTML element attribute expression (Svelte issue #7549 — returns `undefined` during hydration). Bind result to a local `const`; reference the local var inside the template.
3. **Key:** Always `Symbol()` (or `unique symbol` for tighter typing) module-scoped. NEVER use string keys — they collide silently across the app.

**Reference excerpt** (filterContext.svelte.ts:8 + :18-21):
```typescript
const CONTEXT_KEY = Symbol();
// …
export function getFilterContext(): FilterContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getFilterContext() called before initFilterContext()');
  return getContext<FilterContext>(CONTEXT_KEY);
}
```

---

### Pattern: Inline `// reason:` justification for non-obvious ARIA / structural choices

**Source:** v2.7 P67 / v2.8 P70 / v2.8 P71 / Phase 73 IN-03 (CLAUDE.md §"Svelte Warning-Accepted Format" extends this; `// reason:` is the general lint-rule / design-choice variant).

**Apply to:**
- `NavGroup.svelte` — `<section>` preservation comment (Phase 80 §Claude's Discretion default YES; RESEARCH §Pattern 1 example).
- `NavItem.svelte` — `getContext` top-level-only rationale comment (RESEARCH §Pitfall 2).
- `Button.svelte:183` (optional, planner's discretion) — `floating-icon` aria-label extension rationale.

**Excerpt** (RESEARCH §Pattern 1):
```svelte
<!-- reason: <section> preserved for `:before` line-separator CSS; role="list"
     migrated to inner <div> for axe `list` rule compliance (Phase 80 D-02). -->
```

```typescript
// reason: Top-level getContext read — NOT inside an element attribute
// (Svelte issue #7549; RESEARCH §Pitfall 2). Static structural detection:
// NavItem's containment in a NavGroup is fixed at component creation.
const inNavGroup = getContext(NAV_GROUP_CONTEXT_KEY) === true;
```

---

### Pattern: i18n key reuse via `t(TranslationKey)` (Paraglide compile-time bundle)

**Source:** `apps/frontend/src/lib/components/modal/drawer/Drawer.svelte:65` (`getComponentContext()` `t` callable) + Drawer.svelte:92 (`t('common.closeDialog')` sibling-line precedent) + `apps/frontend/src/lib/i18n/wrapper.ts:22` (`TranslationKey` type-narrowing per Phase 78 CLEAN-04).

**Apply to:** `Drawer.svelte:99` D-05B i18n key swap.

**Why reuse, not coin a new key:** CONTEXT §Established Patterns + RESEARCH §Confirmation 2 verified `common.closeDialog` exists in ALL 7 project locales AND is a `TranslationKey` union member. Coining `common.closeFloatingDialog` (or similar) would (a) bloat the message bundle, (b) require 7 locale translation passes, (c) miss the semantic equivalence — both the non-floating and floating drawer-close buttons mean "close this dialog" to the user. v2.9 P75/P76 precedent: reuse `t('components.input.error.*')` rather than coin new keys.

**Excerpt** (Drawer.svelte:92 — the analog being made consistent at line 99):
```svelte
<span class="sr-only">{t('common.closeDialog')}</span>
```

---

### Pattern: Per-rule + global-zero axe assertion (cite-and-fix gate)

**Source:** NEW with Phase 80 (mirrors industry a11y CI conventions — Deque, GitHub, GOV.UK examples).

**Apply to:** `a11y-smoke.spec.ts` UNLOCATED_ROUTES + LOCATED_ROUTES test bodies.

**Excerpt** (RESEARCH §Code Example 4):
```typescript
expect(results.violations.filter((v) => v.id === 'aria-required-parent')).toHaveLength(0);
expect(results.violations.filter((v) => v.id === 'list')).toHaveLength(0);
expect(results.violations.filter((v) => v.id === 'button-name')).toHaveLength(0);
expect(results.violations).toHaveLength(0);
```

**Rules:**
1. Per-rule trio MUST come BEFORE the global gate (Playwright/Jest fail-fast order — triagers see the named rule first; RESEARCH §Pitfall 6).
2. Preserve `testInfo.attach(violations.json)` for failure triage (RESEARCH §Anti-Patterns).
3. Cite the original baseline finding in an inline comment so future readers can map `test → original bug` without re-reading 76-A11Y-BASELINE.md.

---

### Pattern: Phase-local baseline artifact with backward cross-link

**Source:** `.planning/milestones/v2.9-phases/73-determinism-baseline/73-PARITY-BASELINE.md` + `.planning/milestones/v2.9-phases/76-profile-a11y/76-A11Y-BASELINE.md`.

**Apply to:** `80-A11Y-BASELINE.md`.

**Rules (CONTEXT D-07):**
1. NEW file at `.planning/phases/80-a11y-axe-cite-and-fix/80-A11Y-BASELINE.md` — phase-local artifact (NOT in-place edit to Phase 76's file; preserves Phase 76 history as immutable evidence).
2. Cross-link backward to `76-A11Y-BASELINE.md` in a §Cross-Links section.
3. Mirror Phase 76's header structure (Run conditions / Per-route table / Determinism check / Sanitization note).
4. Add NEW §"Resolved in Phase 80" table mapping rule-ID → decision → file → line range.
5. Do NOT promote to project-level `.planning/A11Y-BASELINE.md` (CONTEXT D-07 REJECTED — premature with only 1 baseline shipped; defer to future phase with 2+ baselines).

---

## No Analog Found

**None.** Every Phase 80 surface has a strong in-repo precedent:

| File | Precedent Found |
|------|-----------------|
| `navGroupContext.ts` | `filterContext.svelte.ts` (Symbol-keyed module context) |
| `NavGroup.svelte` | Self + RESEARCH §Pattern 1 official Svelte docs |
| `NavItem.svelte` | Self + `filterContext.getContext` consumer shape |
| `Button.svelte` | Self (line 183 extension) |
| `Drawer.svelte` | Self (line 92 sibling-line precedent) |
| `a11y-smoke.spec.ts` | Self (Phase 76 P03 wiring + RESEARCH §Code Example 4) |
| `80-A11Y-BASELINE.md` | `76-A11Y-BASELINE.md` (sibling artifact) |

The Phase 80 surface is unusually well-served by existing primitives — every fix decision maps to either an in-repo precedent or a Svelte 5 official idiom. The planner does NOT need to invent new patterns; this is a structural-cite-and-fix phase.

---

## Metadata

**Analog search scope:**
- `apps/frontend/src/lib/dynamic-components/navigation/` (NavGroup, NavItem, Navigation, voter/candidate/admin nav consumers)
- `apps/frontend/src/lib/components/button/` (Button.svelte)
- `apps/frontend/src/lib/components/modal/drawer/` (Drawer.svelte)
- `apps/frontend/src/lib/contexts/` (filter, layout, candidate, voter — Symbol-keyed module-context precedents)
- `tests/tests/specs/a11y/` (a11y-smoke.spec.ts — Phase 76 P03 source)
- `.planning/milestones/v2.9-phases/76-profile-a11y/` (76-A11Y-BASELINE.md artifact precedent)

**Files scanned:** 7 primary analogs + 3 cross-reference precedents (filterContext.svelte.ts, Drawer.svelte sibling-line, 76-A11Y-BASELINE.md).

**Pattern extraction date:** 2026-05-13

**Confidence:** HIGH — all analogs verified in-repo; all Svelte 5 rune idioms (`$props.id()`, `setContext`/`getContext`) verified against project Svelte version (^5.53.12 catalog entry, well past 5.20.0 required for `$props.id()`); all i18n keys verified in `TranslationKey` union + 7 locale message bundles.
