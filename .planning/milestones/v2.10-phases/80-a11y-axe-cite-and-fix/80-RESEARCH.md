# Phase 80: A11Y Axe Cite-and-Fix — Research

**Researched:** 2026-05-13
**Domain:** WCAG 2.1 AA a11y cite-and-fix on Svelte 5 shared components + axe-core/playwright regression assertions
**Confidence:** HIGH (all critical claims verified against the in-repo codebase + Svelte 5 official docs)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01** — Keep `role="list"` / `role="listitem"` (list semantics ARE screen-reader-friendly). Native `<ul>`/`<li>` REJECTED; "drop list semantics" REJECTED. Rationale: WAI-ARIA APG / GOV.UK / GitHub / MDN convention for primary nav menus; Safari `list-style: none` quirk means even native `<ul>` needs explicit `role="list"` to survive.
- **D-02** — NavGroup hoists `<h4>` outside the `role="list"` element + `aria-labelledby` link. `<section>` element preserved for `:before` CSS line separator. `role="list"` migrates from `<section>` to an inner `<div>`. `titleId` generation idiom: planner picks at PLAN.md time.
- **D-03** — NavItem auto-detects NavGroup context via Svelte `setContext` / `getContext` — renders `<div role="listitem">` only when inside a NavGroup. Use Symbol-keyed module-scoped context in `navGroupContext.ts` (mirrors `filterContext.svelte.ts` precedent — but note: existing precedent lives at `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts`, not at `apps/frontend/src/lib/voter/state/filterContext.svelte.ts`; the CONTEXT.md path is inaccurate. **[VERIFIED: filesystem grep]**).
- **D-04** — No consumer-side sweep — D-03 auto-resolves voter/candidate/admin orphan close-buttons.
- **D-05** — (A) Button.svelte:183 extend `aria-label` conditional from `variant === 'icon'` to `variant === 'icon' || variant === 'floating-icon'`. (B) Drawer.svelte:99 change `text="close"` to `text={t('common.closeDialog')}`.
- **D-06** — a11y-smoke.spec.ts gets BOTH global zero (`expect(violations).toHaveLength(0)`) AND per-rule trio (filter for `aria-required-parent` / `list` / `button-name`) assertions per route.
- **D-07** — New phase-local `80-A11Y-BASELINE.md` + backward cross-link to `76-A11Y-BASELINE.md`.
- **D-08** — Default 1 bundled plan; planner may split into 2 if scope warrants.
- **D-09** — Inherit Phase 76 D-09 axe smoke determinism contract (2-run identical violation lists).
- **D-10** — Inherit Phase 76 D-10 conditional parity-script regen; Phase 80 does NOT add tests to the default baseline; verify the Phase 79 v2.10 anchor SHA `ff0334f856…` (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE) holds.
- **D-11** — Vite-cache wipe before 3-run cold-start gate (`yarn db:reset && yarn db:seed --template e2e && yarn dev:clean`).
- **D-12** — Parity-script self-identity smoke before regen decision (`npx tsx tests/scripts/diff-playwright-reports.ts`).
- **D-13** — Phase 80 does NOT touch IMGPROXY_TIED_TITLES surfaces.
- **D-14** — Role/aria locators; no new test-ids expected.
- **D-15** — Verified locator-safe (no `getByRole('listitem')` reliance in tests). **[RE-VERIFIED: grep across `/tests/` returned ZERO matches for `getByRole('listitem')`.]**

### Claude's Discretion

- Svelte 5 idiom for `titleId` generation in NavGroup (D-02). Options: `$props.id()` (Svelte 5.20.0+), `crypto.randomUUID()` via existing `getUUID()` helper, module-scoped counter. **Research recommends `$props.id()`** — see §Standard Stack.
- Test-name prefix on regression assertions (D-06): rename `A11Y-03` → `A11Y-04`. Default: rename.
- Plan count (D-08): default 1 bundled plan; planner may split into 2 if scope warrants.
- `setContext` / `getContext` form (D-03): Symbol-keyed module-scoped context (mirrors `filterContext` precedent).
- 1-line `// reason:` comment on NavGroup.svelte `<section>` preservation (D-02): default YES.

### Deferred Ideas (OUT OF SCOPE)

- Multi-locale axe coverage (en only matches Phase 76 baseline locale; 4-locale axe extension is v2.11+).
- CI gating promotion (axe smoke stays `PLAYWRIGHT_A11Y=1` opt-in after Phase 80).
- Native `<ul>`/`<li>` refactor of NavGroup / NavItem (D-01 REJECTED option).
- Axe smoke extension to candidate-app + admin-app routes.
- JSON-serialized axe results for downstream tooling integration (current `testInfo.attach(...)` serves this).
- Heading-level audit across voter/candidate/admin nav (latent risk; if surfaces, follow-up todo OR small in-phase fix).
- Visual regression sanity check after Drawer floating-icon `text` prop change (invisible change; PLAYWRIGHT_VISUAL not in Phase 80 gates).
- `getByRole('listitem')` lint guard (D-15 verified locator-safety; trivial follow-up todo if it surfaces).

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| A11Y-04 | The 5 first-run WCAG 2.1 AA violations baselined in Phase 76 are resolved (`aria-required-parent` × 4, `list` × 2, `button-name` × 1); post-fix the axe smoke reports 0 violations across all 6 routes; per-rule regression assertions added to `a11y-smoke.spec.ts`; successor baseline artifact (or update to `76-A11Y-BASELINE.md`) documents the 0-violation post-fix state. | §Architectural Responsibility Map (component-tier ownership); §Standard Stack (`$props.id()` for D-02 titleId, `setContext`/`getContext` for D-03 NavGroup detection); §Architecture Patterns 1-3 (heading-hoist + aria-labelledby pattern, Symbol-keyed module context, conditional listitem wrap); §Common Pitfalls (latent heading-order axe risk, getContext-in-attribute hydration bug, context call site rules); §Code Examples (verified Svelte 5 patterns); §Validation Architecture (per-rule + global-zero assertion shape, 3-run determinism gate, parity-script self-identity smoke). |

</phase_requirements>

## Summary

Phase 80 is a **5-violation cite-and-fix on Svelte 5 shared components** with a tightly-bounded surface: 4 component files (`NavGroup.svelte`, `NavItem.svelte`, `Button.svelte`, `Drawer.svelte`) + 1 new context module (`navGroupContext.ts`) + 1 spec file (`a11y-smoke.spec.ts`) + 1 new artifact (`80-A11Y-BASELINE.md`). All structural decisions are locked in CONTEXT.md (D-01..D-15). Research focus was confirming Svelte 5 idiom availability + verifying claims CONTEXT.md asserted but did not double-check + auditing latent risks the global-zero axe gate could surface.

**Critical confirmations:**

1. **`$props.id()` IS available** — Svelte 5.20.0+; project at `^5.53.12` (catalog) — far past 5.20.0. SSR-safe with hydration consistency. **[VERIFIED: svelte.dev/docs/svelte/$props + .yarnrc.yml catalog entry].** Recommended for D-02 `titleId` over `crypto.randomUUID()` / module-scoped counter; idiomatic, hydration-safe, no helper file needed.
2. **`common.closeDialog` i18n key exists in ALL 7 locales** (en/fi/sv/da/lb/fr/et) — CONTEXT.md claimed 4 locales; verification surfaces 7. The `TranslationKey` type union at `apps/frontend/src/lib/types/generated/translationKey.ts:305` includes the key. **D-05 (B) type-safe and i18n-complete. [VERIFIED: grep on `apps/frontend/messages/*/common.json` + `translationKey.ts`].**
3. **`floating-icon` variant has exactly ONE consumer** (Drawer.svelte:98). D-05 (A) Button.svelte:183 aria-label extension has zero blast radius outside Drawer. **[VERIFIED: grep on `variant="floating-icon"` across `apps/` + `packages/`].**
4. **Settle-wait surfaces are stable** — `getByRole('list')` in a11y-smoke.spec.ts:100 + :109 matches `<ul>` in Tabs.svelte:38 + `<ol>` in InfoAnswer.svelte:105. Phase 80 touches NEITHER file. **[VERIFIED: grep on `<ul`/`<ol`/`role="list"` in those components].**
5. **No existing `getByRole('listitem')` usage in tests** — D-15 re-confirmed. Removing the wrapping `<div role="listitem">` for orphan NavItems is locator-safe. **[VERIFIED: grep returned zero matches in `/tests/`].**
6. **Heading hierarchy on `/results` is well-formed** — `h3` at results/+layout.svelte:390 (entity section heading). NavGroup `<h4>` lives inside the closed drawer (`role="dialog"`) on results route. Hoisting `<h4>` outside the `role="list"` div on the LanguageSelection group (the only titled NavGroup) does NOT introduce a heading-order violation because the drawer's heading subtree is structurally separate from the main route's outline. **Latent risk acknowledged but LOW probability — global-zero gate catches it if it surfaces.**

**Primary recommendation:** Use `$props.id()` for the D-02 titleId (idiomatic + SSR-safe + zero ceremony); use Symbol-keyed module-scoped context per the existing `filterContext` precedent (CORRECTED path: `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts`); plan 1 bundled plan as CONTEXT.md D-08 defaults to.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| ARIA list semantics (`role="list"` + `role="listitem"` heading hoist) | Browser / Client (Svelte component DOM) | — | Pure DOM/ARIA — fix lives in the component render tree; no API/server involvement. |
| NavGroup → NavItem context propagation | Browser / Client (Svelte runtime `setContext`/`getContext`) | — | Structural component-tree mechanism; not URL state, not API state. |
| `aria-label` accessible name for icon-only buttons | Browser / Client (Svelte component prop derivation) | — | Read by the browser AT API; no backend involvement. |
| i18n key resolution for accessible names | Browser / Client (Paraglide compile-time bundle) | Frontend Server (SSR uses same compiled bundle) | Paraglide compiles messages to client-side JS; SSR uses same bundle for hydration consistency. |
| Axe-core violation scanning + assertion | Test runner (Playwright + `@axe-core/playwright`) | — | E2E test surface; runs in Playwright's browser context against the rendered DOM. |
| Determinism gate (3-run cold-start + parity-script self-identity) | Test runner | Frontend Server (build artifact stability) + Database (e2e seed) | Inherits Phase 73/76/79 determinism contract; vite-cache wipe + e2e re-seed are upstream stability inputs. |

**Why this matters:** Every capability owned by Phase 80 lives in the browser/client tier or the test-runner tier. NO API, NO database, NO frontend-server changes. This bounds the verification surface tightly — the only cross-tier dependencies are (a) the e2e seed must be reproducible, and (b) the compiled Paraglide bundle must include `common.closeDialog`. Both are pre-existing invariants confirmed in §Code Context above and §Standard Stack below.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `svelte` | `^5.53.12` (catalog) | Component framework with runes API | Project standard; far past 5.20.0 — all features needed by Phase 80 are available. **[VERIFIED: .yarnrc.yml]** |
| `@axe-core/playwright` | `^4.11.3` (devDep) | Axe-core violation scanning bound to Playwright pages | Already wired in Phase 76 P03; Phase 80 reuses the existing `AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()` call shape. **[VERIFIED: package.json:50]** |
| `axe-core` | `4.11.4` (transitive) | WCAG rule engine | Pinned by `@axe-core/playwright@4.11.3` transitive; same engine as Phase 76 baseline so per-rule deltas remain semantically meaningful. **[VERIFIED: 76-A11Y-BASELINE.md:11]** |
| `@playwright/test` | `^1.58.2` (catalog) | E2E test runner; `PLAYWRIGHT_A11Y=1` opt-in project | Project standard; Phase 80 reuses the existing `a11y-smoke` project configuration unchanged. **[VERIFIED: .yarnrc.yml]** |
| Paraglide (`$lib/paraglide`) | bundled | Compile-time i18n keys; `TranslationKey` union type | Project standard since Phase 78 CLEAN-04 tightened the `t()` wrapper to require `TranslationKey`. **[VERIFIED: apps/frontend/src/lib/i18n/wrapper.ts:22]** |

### Supporting
| Library / Idiom | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `$props.id()` | Svelte 5.20.0+ | SSR-safe, hydration-stable per-instance unique ID | **D-02 `titleId` generation.** Idiomatic, no helper file. **[VERIFIED: svelte.dev/docs/svelte/$props]** |
| `setContext` / `getContext` from `'svelte'` | Svelte 5 (unchanged from Svelte 4 API; behavior + lifecycle preserved) | Component-tree-scoped state without prop drilling | **D-03 NavGroup → NavItem detection.** Must be called at top-level of component init (NOT inside `<svelte:element>` attributes — see §Common Pitfalls). **[VERIFIED: svelte.dev/docs/svelte/context]** |
| `Symbol()` module-scoped context key | TypeScript stdlib | Type-safe, collision-free context key | Project precedent at `filterContext.svelte.ts:8` (`const CONTEXT_KEY = Symbol();`). **[VERIFIED: filesystem]** |
| `getUUID()` helper at `apps/frontend/src/lib/utils/components.ts:3` | Existing utility | `crypto.randomUUID()` with deterministic fallback | NOT recommended for D-02 — `$props.id()` is more idiomatic. Listed for reference only. **[VERIFIED: filesystem]** |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `$props.id()` for D-02 titleId | `getUUID()` helper (`crypto.randomUUID()`) | More verbose; needs explicit import; `getUUID()` is NOT hydration-stable (the SSR-rendered ID will differ from the client-rendered ID, causing hydration mismatch). **REJECTED for D-02.** |
| `$props.id()` for D-02 titleId | Module-scoped counter (matches `voters/+layout.svelte:72` `menuId` pattern) | Counter resets on HMR; multiple NavGroup instances on one page (the LanguageSelection group is the only current titled one, but adding more would collide); not hydration-stable across SSR vs client. **REJECTED.** |
| Symbol-keyed context | `createContext()` helper (mentioned in Svelte docs) | `createContext` is a sugar wrapper that returns `{ get, set }`; the project uses the bare `setContext` / `getContext` + Symbol pattern consistently (5 existing contexts: app / candidate / auth / layout / admin / filter). Matching precedent is more important than sugar. **REJECTED for consistency.** |
| Explicit `standalone` prop on each NavItem consumer | D-03 auto-detect | Per CONTEXT.md REJECTED — duplicated 3× across consumers; auto-detect propagates to future consumers without touching them. (No re-research needed.) |

**Installation:** All dependencies already installed via Phase 76 P03 + Phase 78 CLEAN-04. NO new packages added by Phase 80. **[VERIFIED: package.json + .yarnrc.yml inspection]**

**Version verification:** Skipped — no new packages to verify. The Svelte catalog entry `^5.53.12` includes `$props.id()` introduced in 5.20.0 (released February 2025 per the changelog cross-link in the Svelte PR #15185). **[VERIFIED: .yarnrc.yml + svelte-changelog.dev]**

## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                       PHASE 80 SCOPE                               │
└────────────────────────────────────────────────────────────────────┘

  COMPONENT TIER (Browser DOM)
  ┌────────────────────────────────────────────────────────────────┐
  │                                                                │
  │   Navigation.svelte  (UNCHANGED — <nav> landmark)              │
  │       │                                                        │
  │       ▼ children                                               │
  │                                                                │
  │   NavGroup.svelte  (D-02 MODIFY)                               │
  │   ├── <section class="...:before...">     (visual separator) │
  │   │   ├── <h4 id={titleId}>{title}</h4>     (HOISTED — was   │
  │   │   │                                       inside list)    │
  │   │   └── <div role="list"                  (NEW WRAPPER)     │
  │   │           aria-labelledby={titleId}>                       │
  │   │       └── {@render children?.()}                           │
  │   │           │                                                │
  │   │           └─→ pushes setContext(NAV_GROUP_KEY, true)       │
  │   │                                                            │
  │   └── {@render children?.()}                                   │
  │                                                                │
  │   NavItem.svelte  (D-03 MODIFY)                                │
  │   ├── const inNavGroup = getContext(NAV_GROUP_KEY) === true   │
  │   ├── {#if inNavGroup}                                         │
  │   │     <div role="listitem">                                  │
  │   │       <svelte:element this={a|button} testid=…>            │
  │   │   {:else}                                                  │
  │   │     <svelte:element this={a|button} testid=…>              │
  │   │   {/if}                                                    │
  │                                                                │
  │   Button.svelte  (D-05A MODIFY @ line 183)                     │
  │   └── aria-label={variant === 'icon'                           │
  │                   || variant === 'floating-icon'               │
  │                   ? effectiveText : undefined}                 │
  │                                                                │
  │   Drawer.svelte  (D-05B MODIFY @ line 99)                      │
  │   └── <Button variant="floating-icon"                          │
  │              text={t('common.closeDialog')}                    │
  │              icon="close" .../>                                │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘
                              │
                              ▼ rendered DOM
  TEST RUNNER TIER (Playwright + axe-core)
  ┌────────────────────────────────────────────────────────────────┐
  │                                                                │
  │   a11y-smoke.spec.ts  (D-06 MODIFY)                            │
  │   ├── PLAYWRIGHT_A11Y=1 gate (env-opt-in project)              │
  │   ├── 6 routes (home, elections, constituencies, questions,    │
  │   │     results, voter-detail-drawer)                          │
  │   ├── per-route: AxeBuilder.withTags(WCAG_TAGS).analyze()      │
  │   ├── per-route: testInfo.attach(violations.json)              │
  │   ├── per-route × 3 rules: filter+toHaveLength(0)              │
  │   │     - aria-required-parent                                 │
  │   │     - list                                                 │
  │   │     - button-name                                          │
  │   └── per-route: expect(violations).toHaveLength(0)            │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘
                              │
                              ▼ verification artifacts
  ARTIFACT TIER
  ┌────────────────────────────────────────────────────────────────┐
  │   80-A11Y-BASELINE.md  (NEW — D-07)                            │
  │   ├── post-fix 0-violation table × 6 routes                    │
  │   ├── resolved-in-Phase-80 cross-reference table               │
  │   │     (rule-ID → decision → file → line range)               │
  │   └── backward cross-link → 76-A11Y-BASELINE.md                │
  │                                                                │
  │   80-VERIFICATION.md  (NEW — Plan close)                       │
  │   ├── 5 SCs assessed                                           │
  │   ├── 3-run determinism record (D-09)                          │
  │   ├── parity-script self-identity smoke (D-12)                 │
  │   └── v2.10 anchor SHA `ff0334f856…` preservation check (D-10) │
  └────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| File | Phase 80 Action | Lines | Decision |
|------|------|-------|----------|
| `apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte` | Modify: hoist h4, add inner `<div role="list">`, push setContext | 32-47 | D-02 |
| `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte` | Modify: conditional `<div role="listitem">` wrap via getContext | 50-68 | D-03 |
| `apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts` | CREATE: Symbol-keyed module-scoped context constant | new file | D-03 |
| `apps/frontend/src/lib/components/button/Button.svelte` | Modify: extend aria-label conditional to include `floating-icon` | 183 | D-05A |
| `apps/frontend/src/lib/components/modal/drawer/Drawer.svelte` | Modify: replace `text="close"` with `text={t('common.closeDialog')}` | 99 | D-05B |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | Modify: replace `console.log` with per-rule trio + global zero assertions | 159-198 | D-06 |
| `.planning/phases/80-a11y-axe-cite-and-fix/80-A11Y-BASELINE.md` | CREATE: post-fix 0-violation baseline + resolved-in-Phase-80 table | new file | D-07 |
| `.planning/phases/80-a11y-axe-cite-and-fix/80-VERIFICATION.md` | CREATE at Plan close: 5-SC assessment + determinism record + anchor check | new file | Plan close |
| `apps/frontend/src/lib/dynamic-components/navigation/Navigation.svelte` | NOT MODIFIED (`<nav>` landmark unchanged) | — | — |
| `apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte` | NOT MODIFIED (D-03 auto-resolves orphan close NavItem) | — | D-04 |
| `apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte` | NOT MODIFIED (D-03 auto-resolves) | — | D-04 |
| `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte` | NOT MODIFIED (D-03 auto-resolves) | — | D-04 |
| `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` | NOT MODIFIED (titled-NavGroup consumer; D-02 fixes its surface) | — | D-02 (implicit) |
| `apps/frontend/src/lib/components/tabs/Tabs.svelte`, `apps/frontend/src/lib/components/infoAnswer/InfoAnswer.svelte` | NOT MODIFIED (settle-wait surfaces — D-15 verified locator-safe) | — | D-15 |
| `tests/playwright.config.ts` | NOT MODIFIED (PLAYWRIGHT_A11Y project unchanged) | — | — |
| `tests/scripts/diff-playwright-reports.ts` | NOT MODIFIED unless constants regen surfaces (conditional per D-10) | — | D-10/D-12 |

### Recommended Project Structure

```
apps/frontend/src/lib/dynamic-components/navigation/
├── Navigation.svelte         # <nav> landmark (UNCHANGED)
├── NavGroup.svelte           # h4 hoist + inner <div role="list"> + setContext
├── NavGroup.type.ts          # (UNCHANGED — props are stable)
├── NavItem.svelte            # conditional listitem wrap via getContext
├── NavItem.type.ts           # (UNCHANGED)
├── navGroupContext.ts        # NEW — Symbol-keyed module-scoped context key
├── voter/VoterNav.svelte     # (UNCHANGED — auto-resolves)
├── candidate/CandidateNav.svelte  # (UNCHANGED — auto-resolves)
├── admin/AdminNav.svelte     # (UNCHANGED — auto-resolves)
└── languages/LanguageSelection.svelte  # (UNCHANGED — D-02 fixes its surface)
```

### Pattern 1: Heading-hoist + aria-labelledby (D-02)

**What:** Move the group's heading OUTSIDE the `role="list"` element and link via `aria-labelledby`, so the heading is no longer a non-listitem child of the list (which trips axe `list` rule).
**When to use:** Any time an ARIA-list-rolled container has a non-listitem heading child.
**Example:**
```svelte
<!-- Source: Svelte 5 + WAI-ARIA APG / axe-core `list` rule docs
     https://dequeuniversity.com/rules/axe/4.11/list -->
<script lang="ts">
  import { setContext } from 'svelte';
  import { concatClass } from '$lib/utils/components';
  import { NAV_GROUP_CONTEXT_KEY } from './navGroupContext';
  import type { NavGroupProps } from './NavGroup.type';

  let { title, children, ...restProps }: NavGroupProps = $props();

  // SSR-safe per-instance ID — Svelte 5.20.0+. Hydration-consistent (server-rendered
  // value matches client-rendered value).
  const titleId = $props.id();

  // Push parent-marker context BEFORE children render so NavItem can read it.
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

### Pattern 2: Symbol-keyed module-scoped context for component-tree detection (D-03)

**What:** Export a `Symbol()` key from a module; provider calls `setContext(KEY, true)`, consumer calls `getContext(KEY)`. The presence of the value at consumer init time signals tree containment.
**When to use:** Static structural detection where containment is fixed at render time and never changes reactively.
**Example:**
```typescript
// Source: apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:8 (project precedent)
// apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts (NEW)
export const NAV_GROUP_CONTEXT_KEY: unique symbol = Symbol('nav-group');
```

```svelte
<!-- NavItem.svelte script block -->
<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { Icon } from '$lib/components/icon';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { concatClass } from '$lib/utils/components';
  import { NAV_GROUP_CONTEXT_KEY } from './navGroupContext';
  import type { NavItemProps } from './NavItem.type';

  let { autoCloseNav = true, disabled, href, icon, text, children, ...restProps }: NavItemProps = $props();

  const { navigation } = getLayoutContext(onDestroy);

  // Top-level call (NOT inside element attributes — see Pitfall 2). Static structural
  // detection: NavItem's containment in a NavGroup is fixed at component creation.
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

**Trade-off considered:** Could use a Svelte snippet (`{#snippet inner()}...{/snippet}`) to deduplicate the two `<svelte:element>` branches. Recommended NO — the duplication is ~10 lines; a snippet adds indirection that obscures the conditional wrap intent. Planner may extract a snippet if they prefer (Claude's Discretion at PLAN.md time).

### Pattern 3: Per-rule + global-zero axe assertion (D-06)

**What:** Run axe once per route; assert `toHaveLength(0)` on filtered subsets for each rule-ID Phase 76 baselined, then a global `toHaveLength(0)` catch-all.
**When to use:** Cite-and-fix gates where you want both fix-stability proof (per-rule) AND new-violation detection (global).
**Example:**
```typescript
// Source: CONTEXT.md D-06 + Phase 76 baseline §"Per-route violation breakdown"
test(`A11Y-04 axe smoke — ${route.name}`, async ({ page }, testInfo) => {
  await page.goto(/* … */);
  await route.settle(page);

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  // Preserve debug attachment for failure triage.
  await testInfo.attach(`axe-violations-${route.name}.json`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json'
  });

  // Phase 80 cite-and-fix gate. Phase 76 baselined 5 violations across 3 rule-IDs:
  //   aria-required-parent × 4, list × 2, button-name × 1 (76-A11Y-BASELINE.md).
  expect(results.violations.filter((v) => v.id === 'aria-required-parent')).toHaveLength(0);
  expect(results.violations.filter((v) => v.id === 'list')).toHaveLength(0);
  expect(results.violations.filter((v) => v.id === 'button-name')).toHaveLength(0);

  // SC #4 global zero gate — "0 violations across all 6 routes". Catches new
  // rule-IDs that the per-rule trio doesn't name (e.g., heading-order from a
  // latent h4-hoist outline gap; see RESEARCH §Common Pitfalls 1).
  expect(results.violations).toHaveLength(0);
});
```

### Anti-Patterns to Avoid

- **Calling `getContext()` inside an HTML attribute expression.** Returns `undefined` during hydration (Svelte issue #7549). **Always read context at the top level of the `<script>` block** and bind the result to a local const. (Already followed by the Pattern 2 example above.)
- **Using `crypto.randomUUID()` (or the `getUUID()` helper) for SSR-rendered IDs.** Server-generated UUID differs from client-generated UUID → hydration mismatch warning. **Use `$props.id()` instead** for the D-02 titleId.
- **Asserting only `toHaveLength(0)` global OR only per-rule.** CONTEXT.md D-06 explicitly mandates BOTH. Per-rule documents intent permanently; global catches latent new violations.
- **Removing the `testInfo.attach(violations.json)` debug artifact.** Required for failure triage even after assertions tighten — when a future change introduces a new violation, the JSON attachment is the fastest path to root cause.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-instance unique ID for ARIA linking | Module-scoped counter / `getUUID()` / `Math.random()` | `$props.id()` (Svelte 5.20.0+) | Only `$props.id()` is hydration-stable across SSR ↔ client. Counters reset on HMR; UUIDs differ between server and client renders. |
| WCAG rule scanner | Hand-rolled DOM walker checking ARIA attributes | `@axe-core/playwright` (already installed) | Axe-core implements 100+ WCAG rules with the canonical Deque mappings; the rule engine is the industry de facto. **Already wired by Phase 76 P03 — no choice required for Phase 80.** |
| Accessible name resolution for an icon-only button | Hand-rolled `sr-only` span | `aria-label` on the interactive element | When the visible text is hidden, `aria-label` is the canonical accessible name source. Button.svelte already implements this for `variant === 'icon'`; Phase 80 extends to `'floating-icon'`. |
| Per-instance unique ID for ARIA linking — fallback if `$props.id()` were unavailable | DIY counter | (Hypothetical) — not needed; project at Svelte 5.53.12 | Listed for completeness; planner does not need a fallback. |

**Key insight:** The Phase 80 surface is unusually well-served by existing primitives. Every fix decision in CONTEXT.md (D-02 / D-03 / D-05A / D-05B / D-06) maps to an existing primitive — Svelte runes, `setContext`/`getContext`, `aria-label`, `t()` + `TranslationKey`, `AxeBuilder.withTags().analyze()`. The phase's complexity is in the **structural reasoning** (where to hoist the heading; how to detect tree containment without prop drilling), NOT in primitive selection.

## Common Pitfalls

### Pitfall 1: Latent `heading-order` axe violation from h4 hoist
**What goes wrong:** D-02 hoists `<h4 id={titleId}>` out of the `role="list"` div. The h4 was previously a child of `<section role="list">`. After hoist, it's a child of `<section>`. The document outline doesn't change — same parent. BUT: in the LanguageSelection NavGroup (the only currently-titled NavGroup), the h4 lives inside the drawer (`role="dialog"`) which on the `/results` route is closed by default. When opened, the dialog's outline starts fresh per ARIA, so the h4 is the top heading inside the dialog — fine. **However:** if any future consumer renders a titled NavGroup OUTSIDE a dialog AND the surrounding page has an h2 or h3 already, the h4 could create a heading-level-skip (h2 → h4) that trips axe's `heading-order` rule.
**Why it happens:** axe's `heading-order` rule checks document-wide heading sequence; an h4 not preceded by h3 (within the same landmark) is a violation under WCAG 2.4.6 (Level AA).
**How to avoid:**
  1. Phase 80 ONLY currently affects the LanguageSelection consumer (inside `role="dialog"` drawer), so the latent risk is LOW.
  2. The D-06 global `toHaveLength(0)` gate CATCHES this if it surfaces — no silent regression.
  3. If the gate fails on `heading-order`, two paths: (a) change the h4 to an h2 inside NavGroup (it's the top heading of its dialog landmark — semantically correct); (b) keep h4 but add `aria-label` instead of visible heading (less SR-friendly, REJECTED by D-01 spirit).
**Warning signs:** Phase 80 verification surfaces a `heading-order` violation on any of the 6 routes during the post-fix re-baseline.

### Pitfall 2: `getContext()` inside element attribute returns `undefined` during hydration
**What goes wrong:** If a consumer writes `<a href={getContext(KEY).href}>...</a>` (calling getContext inside an attribute), the call happens DURING hydration AFTER component init, when the context map is not yet bound. Returns `undefined` even though the value was set by the parent.
**Why it happens:** Svelte's compiler wraps element attributes in update functions; these run outside the init phase where context is established. Documented as Svelte issue #7549.
**How to avoid:** **Always read context at the top of `<script>`.** Bind the result to a local `const`. The D-03 NavItem implementation in Pattern 2 above follows this correctly — `const inNavGroup = getContext(...)` at top level, then `inNavGroup` is referenced inside `{#if}`.
**Warning signs:** NavItem renders without the `<div role="listitem">` wrap even when inside a NavGroup; axe smoke continues to report `aria-required-parent` after the change.

### Pitfall 3: `setContext` outside component initialization silently fails
**What goes wrong:** Calling `setContext` inside a `$derived`, `$effect`, event handler, or any post-init code does NOT bind to the current component instance. Svelte 4 raised an error; Svelte 5 may still allow it without error (issue #5147), but the binding has no effect.
**Why it happens:** `setContext` looks up `current_component`, which is only set during the initialization pass.
**How to avoid:** Place `setContext(NAV_GROUP_CONTEXT_KEY, true)` at the TOP LEVEL of NavGroup's `<script>` block — not inside any reactive scope.
**Warning signs:** Same as Pitfall 2 — NavItem fails to detect containment.

### Pitfall 4: `$props.id()` requires Svelte 5.20.0+
**What goes wrong:** If the project's Svelte version were below 5.20.0, `$props.id()` would be a build error.
**Why it happens:** Rune added in 5.20.0; not polyfilled.
**How to avoid:** Project is at `^5.53.12` (verified) — no action needed. If `yarn.lock` ever pins below 5.20.0, fall back to `getUUID()` (NOT hydration-stable; accept the warning) OR Svelte's older `crypto.randomUUID()` pattern inside an `onMount` (NOT SSR-safe).
**Warning signs:** TypeScript / svelte-check error: "Cannot find name `$props.id`" or runtime hydration mismatch warning.

### Pitfall 5: Settle-wait `getByRole('list')` resolves to a NavGroup `role="list"` instead of the intended results-list `<ul>`
**What goes wrong:** The a11y-smoke spec's `getByRole('list').first()` settle on /results currently matches `<ul>` in Tabs.svelte:38 OR `<ol>` in InfoAnswer.svelte:105 (per CONTEXT.md D-15). After D-02 lands, the closed-drawer's NavGroup also renders `role="list"` on a `<div>` — could `.first()` resolve to one of those instead?
**Why it happens:** `.first()` returns the first DOM-order role match. The drawer's `role="list"` divs are in the DOM (drawer is rendered behind the page on the same route), so DOM order matters.
**How to avoid:** The drawer's `role="list"` divs are INSIDE the closed `role="dialog"` ancestor; Playwright's `getByRole('list')` matches any role-list in the accessibility tree regardless of visibility. **However**, the settle-wait specifies `{ state: 'visible' }`. Closed-drawer NavGroups are `display: none` / `visibility: hidden` (per drawer transition CSS) — `state: 'visible'` filters them out. **The settle-wait remains targeted at the main-route results list.**
**Warning signs:** a11y-smoke `results` test times out at the settle-wait step after Phase 80; investigate whether the drawer's hidden state correctly excludes its `role="list"` divs from visibility matching.

### Pitfall 6: `toHaveLength(0)` global gate runs BEFORE the targeted per-rule assertions fail-fast on a known violation
**What goes wrong:** If a new rule-ID violation surfaces alongside the targeted 3 rules, all four assertions fail simultaneously; the test output reports the global-zero failure first (it's the last assertion). Triagers may overlook which rule-ID surfaced because the global filter doesn't itemize.
**Why it happens:** Jest/Playwright's expect runs sequentially; `.toHaveLength(0)` on the unfiltered array doesn't print which rule-IDs were in the array — just the length.
**How to avoid:** The `testInfo.attach(violations.json)` artifact preserves the per-violation detail. Triagers MUST inspect the attachment, not just the failure message. The per-rule trio also fail-fasts on the 3 known rules so triage is fast for the canonical regression case.
**Warning signs:** Future Phase 80 failure logs that say only "Expected length: 0, Received length: N" without rule context. Triage process: open the attached JSON.

## Code Examples

Verified patterns from in-repo precedents + official Svelte docs:

### Example 1: `$props.id()` for ARIA linking
```svelte
<!-- Source: svelte.dev/docs/svelte/$props (Svelte 5.20.0+) -->
<script lang="ts">
  const titleId = $props.id();
</script>

<section>
  {#if title}
    <h4 id={titleId}>{title}</h4>
  {/if}
  <div role="list" aria-labelledby={title ? titleId : undefined}>
    {@render children?.()}
  </div>
</section>
```

### Example 2: Symbol-keyed context provider/consumer pair
```typescript
// Source: apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:8 (project precedent)
// File: apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts (NEW)
import type { } from 'svelte';

/**
 * Module-scoped Symbol key — collision-free; `unique symbol` lets TypeScript
 * track the exact symbol identity for type-narrowing if needed downstream.
 *
 * Phase 80 D-03: NavGroup pushes `true` via setContext; NavItem reads via
 * getContext at component init to decide whether to render the wrapping
 * `<div role="listitem">`. The auto-detect propagates structurally to all
 * VoterNav / CandidateNav / AdminNav orphan close-buttons without per-consumer
 * prop drilling.
 */
export const NAV_GROUP_CONTEXT_KEY: unique symbol = Symbol('nav-group');
```

```svelte
<!-- Source: NavGroup.svelte script block -->
<script lang="ts">
  import { setContext } from 'svelte';
  import { NAV_GROUP_CONTEXT_KEY } from './navGroupContext';
  // ...other imports

  let { title, children, ...restProps }: NavGroupProps = $props();
  const titleId = $props.id();

  // Top-level call — runs during component init when current_component is bound.
  setContext(NAV_GROUP_CONTEXT_KEY, true);
</script>
```

```svelte
<!-- Source: NavItem.svelte script block -->
<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { NAV_GROUP_CONTEXT_KEY } from './navGroupContext';
  // ...other imports

  let { ... }: NavItemProps = $props();

  // Top-level call — NOT inside an attribute expression (Pitfall 2).
  const inNavGroup = getContext(NAV_GROUP_CONTEXT_KEY) === true;
</script>
```

### Example 3: i18n-aware accessible name on icon-only button
```svelte
<!-- Source: apps/frontend/src/lib/components/modal/drawer/Drawer.svelte:96-102 (after D-05B) -->
<Button
  type="button"
  variant="floating-icon"
  text={t('common.closeDialog')}
  icon="close"
  onclick={() => closeModal()}
  class="!absolute right-0 bottom-0 z-10" />
```

```svelte
<!-- Source: apps/frontend/src/lib/components/button/Button.svelte:183 (after D-05A) -->
<svelte:element
  this={href == null ? 'button' : 'a'}
  role="button"
  tabindex={disabled ? -1 : 0}
  href={disabled ? undefined : href}
  aria-label={variant === 'icon' || variant === 'floating-icon' ? effectiveText : undefined}
  title={variant === 'icon' || variant === 'responsive-icon' ? effectiveText : undefined}
  disabled={disabled || loading || undefined}
  {...concatClass(restProps, classes)}>
  <!-- … -->
</svelte:element>
```

### Example 4: Module-level for-loop test runner (per-route)
```typescript
// Source: tests/tests/specs/a11y/a11y-smoke.spec.ts:158-198 (existing pattern — Phase 80 extends, not refactors)
// Module-level for…of route runner — satisfies playwright/no-conditional-in-test
// (no `if` inside test() bodies; per-route dispatch is module-level).
for (const route of UNLOCATED_ROUTES) {
  test(`A11Y-04 axe smoke — ${route.name}`, async ({ page }, testInfo) => {
    await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
    await route.settle(page);

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    await testInfo.attach(`axe-violations-${route.name}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json'
    });

    expect(results.violations.filter((v) => v.id === 'aria-required-parent')).toHaveLength(0);
    expect(results.violations.filter((v) => v.id === 'list')).toHaveLength(0);
    expect(results.violations.filter((v) => v.id === 'button-name')).toHaveLength(0);
    expect(results.violations).toHaveLength(0);
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Module-scoped counter / `Math.random()` for per-instance IDs | `$props.id()` rune | Svelte 5.20.0 (Feb 2025) | Hydration-consistent across SSR ↔ client; no helper file; canonical for ARIA linking. |
| Hand-rolled WCAG rule checks in Playwright assertions | `@axe-core/playwright` + `AxeBuilder.withTags().analyze()` | axe-core 4.x (ongoing) | 100+ WCAG rules covered; canonical Deque mappings; deterministic on stable DOM. |
| Hard-coded English `aria-label` / `text` values for icon buttons | `t(TranslationKey)` via Paraglide compile-time bundle | Phase 78 CLEAN-04 (this project) | Type-safe key resolution; multi-locale-aware; no runtime overhead. |
| Component-prop drilling for tree-position detection | Symbol-keyed `setContext`/`getContext` | Svelte context API (Svelte 3+); refined for Svelte 5 with `unique symbol` typing | Zero per-consumer changes; structural detection cleanly handles orphan-vs-wrapped cases. |

**Deprecated/outdated:**
- **`crypto.randomUUID()` for SSR-rendered DOM IDs:** still works but produces hydration warnings; superseded by `$props.id()` for component-instance IDs.
- **Native `<ul>`/`<li>` for navigation lists (without `role="list"`):** Safari `list-style: none` quirk removes list semantics from native `<ul>`. ARIA explicit roles are MORE defensive than native HTML for navigation lists; D-01 captures this rationale.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Closed-drawer NavGroups (`display: none` / `visibility: hidden`) are excluded from Playwright's `getByRole('list', { state: 'visible' })` settle-wait, so the existing /results settle remains targeted at the main-route results list after Phase 80 lands. | Pitfall 5 | If wrong, a11y-smoke `results` test times out at the settle step. Mitigation: change the settle-wait to a more specific locator (e.g., `getByTestId('voter-results-list')`). Low risk — Playwright's visibility filter is well-defined; CSS `display: none` reliably hides elements from the accessibility tree. |
| A2 | The closed drawer's heading subtree is structurally separate from the main route's heading outline (h3 on /results), so hoisting NavGroup's h4 outside the inner `role="list"` div does NOT introduce a `heading-order` violation on /results. | Pitfall 1 | If wrong, global-zero gate fails with `heading-order` violation. Mitigation: change h4 → h2 inside NavGroup (semantically correct top heading of its dialog landmark). Low risk — only the LanguageSelection group is titled, and it lives inside the closed drawer. |
| A3 | The vite-cache wipe recipe `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean` produces the same baseline determinism state as the v2.9-era Phase 73 recipe. | D-11 inheritance | If wrong, 3-run cold-start gate surfaces non-deterministic test outcomes. Mitigation: planner falls back to `yarn dev:reset-with-data` (deprecated alias still works through v2.10 per CLAUDE.md). Low risk — Phase 78 CLEAN-01 explicitly tested the `db:*` rename and the e2e suite ran clean. |
| A4 | The Phase 79 v2.10 anchor SHA `ff0334f856…` (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE) holds through Phase 80's component changes without requiring a fresh constants regen. | D-10 inheritance | If wrong, Phase 80 verification surfaces a PASS_LOCKED / DATA_RACE / CASCADE pool shift; planner must invoke `regen-constants.mjs` per D-12. Low risk — Phase 80 modifies ARIA/i18n shape but not test-visible component behavior (no testid changes, no navigation flow changes); the existing tests query by testid not by role. |

## Open Questions

1. **Should Phase 80 also un-suppress the `// reason:` design comment in `NavItem.svelte:50` about "we don't place items within a valid parent for `<li>`"?**
   - What we know: The comment still applies conceptually for the orphan case (NavItem outside NavGroup needs `role="listitem"` only when inside `role="list"`; the auto-detect resolves the orphan case by NOT rendering `role="listitem"` at all).
   - What's unclear: Whether to update the comment to reflect the new conditional-wrap reality or leave as historical context.
   - Recommendation: Planner updates the comment at PLAN.md time — the existing comment becomes stale post-D-03 because the wrapping div now only renders when inside a NavGroup.

2. **Does Phase 80 need a smoke run AGAINST the Phase 76 baseline before fixing, to confirm the 5-violation baseline still holds at HEAD (2026-05-13)?**
   - What we know: CONTEXT.md `<specifics>` mentions "Planner re-baseline at PLAN.md time" — i.e., re-run `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` to confirm the Phase 76 baseline (5 violations across 3 rule-IDs) still reproduces.
   - What's unclear: Whether the planner treats this as a Wave-0 pre-fix sanity check or relies on the Phase 76 baseline as ground truth.
   - Recommendation: Wave-0 pre-fix sanity check is cheap (one PLAYWRIGHT_A11Y=1 run, ~30 sec); if baseline drifted, surface as a Phase 80 blocker before authoring component changes.

3. **Should Plan 01 also remove the existing `console.log(...)` calls + the trailing defensive `expect(results).toHaveProperty('violations')` lines, or leave them as no-op safety nets?**
   - What we know: The `console.log` calls are first-run-baseline framing (Phase 76 P03 intentionally NOT asserting); the `toHaveProperty` check is a defensive sanity that AxeBuilder returned the expected shape.
   - What's unclear: After D-06 tightens to actual assertions, both become redundant. CONTEXT.md D-06 specifies the `console.log` is removed but is silent on `toHaveProperty`.
   - Recommendation: Remove `console.log` (replaced by deterministic assertions). Leave `toHaveProperty` — costs nothing, defends against AxeBuilder API breakage on future axe-core upgrades.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All build / test commands | ✓ | ≥22 (per `engine` in package.json:78) | — |
| Yarn 4 | All workspace commands | ✓ | 4.13.0 | — |
| Supabase CLI | `yarn db:reset` / `yarn db:seed` | ✓ (assumed — Phase 79 P03 used it 6× successfully) | ≥2.83.0 (per 76-A11Y-BASELINE.md) | — |
| Playwright browsers | `yarn test:e2e --project=a11y-smoke` | ✓ (assumed — Phase 79 P03 ran the full suite 6× successfully) | ^1.58.2 | `yarn playwright install` |
| `@axe-core/playwright` | a11y-smoke spec | ✓ (already installed by Phase 76 P03) | ^4.11.3 | — |
| `PLAYWRIGHT_A11Y` env-opt-in project | a11y-smoke spec | ✓ (configured in `tests/playwright.config.ts` per Phase 76 P03) | — | Without the env var, the a11y-smoke project is skipped — the planner MUST set `PLAYWRIGHT_A11Y=1` for verification gates. |
| imgproxy container | NOT required by Phase 80 (D-13 confirmed surface does NOT touch IMGPROXY_TIED_TITLES) | N/A | — | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None — all required tooling is already installed and verified by Phase 79 P03.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (E2E) + Vitest (unit, not applicable for Phase 80) |
| Config file | `tests/playwright.config.ts` (a11y-smoke project conditionally registered when `PLAYWRIGHT_A11Y=1`) |
| Quick run command | `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` |
| Full suite command | `yarn test:e2e` (parity-gate full suite; no a11y-smoke unless `PLAYWRIGHT_A11Y=1` is also set) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| A11Y-04 SC #1 | `aria-required-parent` × 4 violations resolved across /results + voter-detail-drawer | E2E (axe) | `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1 -g "A11Y-04 axe smoke — results"` AND `... -g "voter-detail-drawer"` | ✅ (a11y-smoke.spec.ts — Phase 80 modifies) |
| A11Y-04 SC #2 | `list` × 2 violations resolved | E2E (axe) | Same as SC #1 (per-rule assertion in same per-route test) | ✅ |
| A11Y-04 SC #3 | `button-name` × 1 violation resolved on voter-detail-drawer | E2E (axe) | `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1 -g "voter-detail-drawer"` | ✅ |
| A11Y-04 SC #4 | Re-run reports 0 violations across all 6 routes; per-rule regression assertions added | E2E (axe) | `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` (all 6 routes) | ✅ |
| A11Y-04 SC #5 | Successor baseline artifact documents the 0-violation post-fix state | Manual (doc artifact) | Read `.planning/phases/80-a11y-axe-cite-and-fix/80-A11Y-BASELINE.md` | ❌ Wave 0 — to create |
| Phase 80 determinism gate (D-09) | 2 successive PLAYWRIGHT_A11Y=1 runs identical per-route per-rule violation lists | E2E (axe, 2-run) | Manual: `for i in 1 2; do PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1 --reporter=json > run-$i.json; done && diff <(jq '...' run-1.json) <(jq '...' run-2.json)` | ✅ (spec exists; Phase 80 adds manual 2-run comparison to Plan 01 verification gate) |
| Phase 80 cold-start gate (D-11) | 3-run cold-start identical pass-set on full suite post-fix | E2E (full suite, 3-run) | `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean && yarn test:e2e (×3)` | ✅ (full suite); Phase 80 verification gate; inherits Phase 73 P06 / Phase 79 P03 recipe |
| Phase 80 anchor preservation (D-10) | v2.10 anchor SHA `ff0334f856…` holds (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE) | E2E parity | `npx tsx tests/scripts/diff-playwright-reports.ts <run-3.json> <run-3.json>` self-identity smoke; THEN compare to baseline | ✅ (`tests/scripts/diff-playwright-reports.ts` restored Phase 73 P06; locked Phase 79 P03) |

### Sampling Rate
- **Per task commit:** `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` (~30 sec for 6 routes single-worker).
- **Per wave merge:** Same as per-task — the a11y-smoke is fast enough to run per commit.
- **Phase gate:** Full suite green + a11y-smoke green (0 violations) + 3-run determinism record + parity-script self-identity smoke before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `.planning/phases/80-a11y-axe-cite-and-fix/80-A11Y-BASELINE.md` — NEW artifact (D-07); created at Plan 01 close.
- [ ] `apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts` — NEW context module (D-03).
- [ ] (Optional sanity check) Re-baseline Phase 76 `PLAYWRIGHT_A11Y=1` run at Phase 80 start to confirm 5-violation baseline still holds at HEAD (per Open Question 2).
- [ ] Framework install: none — `@axe-core/playwright` already installed in Phase 76 P03.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 80 does not touch auth paths |
| V3 Session Management | no | Phase 80 does not touch session paths |
| V4 Access Control | no | Phase 80 does not touch RLS or route guards |
| V5 Input Validation | no | Phase 80 does not introduce or modify input handling |
| V6 Cryptography | no | Phase 80 does not handle secrets or crypto |
| V7 Error Handling | no | Phase 80 does not touch error paths |
| V8 Data Protection | partial | i18n key swap (`text="close"` → `t('common.closeDialog')`) ensures accessible name does NOT leak English text into non-English locales. Multi-locale data protection is a UX requirement, not a strict ASVS V8 concern. |
| V11 Business Logic | no | Phase 80 does not touch business logic |
| V14 Configuration | no | Phase 80 does not change deployment config |

### Known Threat Patterns for Svelte 5 + Playwright a11y testing

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via dynamic ARIA attribute values | Tampering | Phase 80 ARIA values are either static literals (`role="list"`, `role="listitem"`) or sourced from `$props.id()` (compiler-generated) / `t()` Paraglide bundle (compile-time). NO user-supplied data flows into ARIA attributes. |
| i18n key collision / accidental exposure | Information Disclosure | Paraglide's compile-time `TranslationKey` union prevents typo-driven exposure; `t('common.closeDialog')` is type-checked. |
| Test-fixture leakage via `testInfo.attach()` JSON | Information Disclosure | Phase 76 baseline artifact (76-A11Y-BASELINE.md §"Sanitization note") established the precedent: record rule-ID + impact + node-count + helpUrl ONLY; do NOT commit raw `node.html` snippets which could contain seeded candidate names / bios. Phase 80's 80-A11Y-BASELINE.md MUST follow the same sanitization rule. **[CITED: 76-A11Y-BASELINE.md:67-69]** |

## Project Constraints (from CLAUDE.md)

Directives extracted from `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/CLAUDE.md` that bear on Phase 80:

1. **WCAG 2.1 AA compliance:** "Test accessibility — app must be WCAG 2.1 AA compliant." This is the BINDING contract for Phase 80; the axe scan uses the WCAG 2.1 AA superset tags (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`).
2. **Localization:** "Localization — all user-facing strings must support multiple locales." Drives D-05 (B) i18n key swap. The accessible name announced to screen readers is a user-facing string.
3. **TypeScript strict + avoid `any`:** Phase 80 introduces no `any` usage; the `NAV_GROUP_CONTEXT_KEY: unique symbol` typing is explicit.
4. **Svelte 5 Context Destructuring Rule:** "Reactive accessors MUST be read via direct property access; stable references can be destructured." Phase 80's NavGroup context is a STABLE primitive (`true` constant — never reactive); destructuring is moot since `getContext(KEY)` returns the raw value, not an object.
5. **Svelte Warning-Accepted Format:** `// svelte-warning: accepted — <rationale>` — Phase 80 does NOT expect any new compiler warnings (changes are additive ARIA + i18n). If a warning surfaces during implementation, use this comment shape with rationale.
6. **`db:*` rename (Phase 78 CLEAN-01):** Phase 80 uses canonical `db:*` commands (e.g., `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean`); deprecated `dev:*` aliases survive through v2.10 close but are NOT used in new artifacts.
7. **Code Review Checklist:** Always check changes against `.agents/code-review-checklist.md`; key items applicable to Phase 80 → see §Code Review Checklist Items below.

### Code Review Checklist Items Applicable to Phase 80

From `.agents/code-review-checklist.md`:

- [ ] (CLAUDE.md baseline) Changes solve the issue the PR is trying to solve partially or fully → 5 violations resolved; per-rule + global-zero assertions guard recurrence.
- [ ] Avoid `any` → confirmed; D-03 context key typed as `unique symbol`.
- [ ] No code is repeated within the PR or elsewhere → conditional wrap pattern uses Svelte snippets if planner judges duplication worth de-duplicating (Pattern 2 trade-off).
- [ ] New components / functions are documented → `navGroupContext.ts` includes a JSDoc on `NAV_GROUP_CONTEXT_KEY` (see Code Example 2).
- [ ] **Changes pass WCAG A and AA requirements** → entire phase IS this directive.
- [ ] **Keyboard navigation + screen reader usability** → D-01 list semantics preserve SR count/position announcement; D-02 hoist preserves heading announcement via `aria-labelledby`; D-05 generalized aria-label provides accessible name for icon-only buttons.
- [ ] Errors handled properly → no error paths added; existing error handling preserved.
- [ ] Commit history clean + linear → planner controls commit shape at Plan 01 close.

## Sources

### Primary (HIGH confidence)
- `apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte` (lines 1-48) — current source, verified.
- `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte` (lines 1-78) — current source, verified.
- `apps/frontend/src/lib/dynamic-components/navigation/Navigation.svelte` (lines 1-63) — current source, verified UNCHANGED.
- `apps/frontend/src/lib/components/button/Button.svelte` (lines 1-100, 170-209) — current source, verified.
- `apps/frontend/src/lib/components/modal/drawer/Drawer.svelte` (lines 60-106) — current source, verified.
- `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` (lines 1-124) — Symbol-keyed context precedent. **CORRECTED PATH from CONTEXT.md** (CONTEXT cited `apps/frontend/src/lib/voter/state/filterContext.svelte.ts`; actual path is `.../contexts/filter/...`).
- `apps/frontend/src/lib/utils/components.ts` (lines 1-55) — existing `getUUID()` helper.
- `apps/frontend/src/lib/i18n/wrapper.ts` (line 22) — `t(key: TranslationKey, ...)` signature confirms compile-time type-narrowing.
- `apps/frontend/src/lib/types/generated/translationKey.ts:305` — `common.closeDialog` is a member of the `TranslationKey` union.
- `apps/frontend/messages/{en,fi,sv,da,lb,fr,et}/common.json:20` — `closeDialog` key exists in ALL 7 locales (not 4 as CONTEXT.md claimed).
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` (lines 1-199) — current spec source.
- `.planning/milestones/v2.9-phases/76-profile-a11y/76-A11Y-BASELINE.md` — Phase 76 first-run baseline; ground truth for the 5 violations.
- `.yarnrc.yml` (catalog) — Svelte `^5.53.12`, Playwright `^1.58.2`.
- `package.json:50` — `@axe-core/playwright: ^4.11.3`.

### Secondary (MEDIUM confidence, cross-verified)
- [Svelte 5 `$props` docs](https://svelte.dev/docs/svelte/$props) — `$props.id()` introduced in 5.20.0; SSR-safe and hydration-consistent.
- [Svelte 5 Context docs](https://svelte.dev/docs/svelte/context) — `setContext`/`getContext` lifecycle rules + reactivity discipline.
- [Deque Axe `list` rule](https://dequeuniversity.com/rules/axe/4.11/list) — `list` rule requires direct children of `role="list"` to be `role="listitem"` (or `<li>`).
- [Deque Axe `aria-required-parent` rule](https://dequeuniversity.com/rules/axe/4.11/aria-required-parent) — `role="listitem"` requires an ancestor with `role="list"`.
- [Deque Axe `button-name` rule](https://dequeuniversity.com/rules/axe/4.11/button-name) — buttons must have an accessible name (visible text, `aria-label`, `aria-labelledby`, or `title`).
- [Svelte PR #15185](https://github.com/sveltejs/svelte/pull/15185) — `$props.id()` introduction PR.
- [Svelte issue #7549](https://github.com/sveltejs/svelte/issues/7549) — `getContext` returns `undefined` when called inside an element attribute expression; warns to read context at script top.
- [Svelte issue #5147](https://github.com/sveltejs/svelte/issues/5147) — `setContext` outside init silently fails.

### Tertiary (LOW confidence, listed for completeness)
- [WAI-ARIA APG: Navigation Menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/) — list-of-links convention for primary nav menus.
- [Scott O'Hara on Safari `list-style: none` quirk](https://www.scottohara.me/blog/2019/01/12/lists-and-safari.html) — historical context for D-01 list-semantics preservation rationale; cited by CONTEXT.md.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Svelte 5.53.12 well past 5.20.0 (`$props.id()` confirmed); `setContext`/`getContext` API unchanged from Svelte 4; `@axe-core/playwright` already wired in Phase 76 P03.
- Architecture: HIGH — All 4 component modifications mapped to existing precedents (filterContext for Symbol-keyed context; aria-labelledby for heading-list linking; aria-label for icon-only accessible names).
- Pitfalls: HIGH — Latent heading-order risk acknowledged with low-probability assessment; getContext-in-attribute and setContext-outside-init are well-documented Svelte issues.
- i18n: HIGH — `common.closeDialog` key verified in 7 locales (exceeds CONTEXT.md's claimed 4-locale support); `TranslationKey` type narrowing verified in `translationKey.ts:305`.
- Determinism inheritance: HIGH — Phase 73/76/79 contract is well-established; Phase 80 inherits via D-09/D-10/D-11/D-12.

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (30 days; stable surface — Svelte 5 API stable, axe-core 4.x stable, no breaking releases expected in the window).
