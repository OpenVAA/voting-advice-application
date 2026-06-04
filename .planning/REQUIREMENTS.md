# Requirements: OpenVAA — v2.11 Svelte 5 Runes Migration + View Transitions

**Defined:** 2026-06-04
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Backed by:** the `spike-findings-voting-advice-application-gsd` skill (16 browser-verified spikes — production landing map, proven patterns, non-negotiable requirements). Each requirement cites its source spike(s).

> **Binding design constraints (from spike requirements — apply to every migration commit):**
> no `svelte/store` import in migrated contexts (`writable`/`readable`/`derived`/`toStore`/`fromStore`/`get`); no `$store.X` template auto-subscribe in consumers; no `get(store)` imperative reads in producers; `untrack()` around write-after-read in `$effect`-scoped helpers; appSettings/appCustomization DB-override merge at `$state` init (NOT in `$effect` — `$effect` doesn't run on the server); `mergeAppSettings` must be pure; destructure-trap preserved per the CLAUDE.md "Context Destructuring Rule"; migration order respects dependency direction (Tier 1 → Tier 2 → consumers → cleanup).
>
> **No back-compat at milestone end (user constraint, 2026-06-04 — applies milestone-wide):** every temporary bridge/shim introduced to keep consumers working during Waves 1–3 is fully removed by Wave 4. Rune-native replacements adopt a **clean permanent name with no migration-era prefix** — no `rune`/`-native` suffixes lingering in shipped code; in particular the new persistent-storage helpers ship as **`localStorageState` / `sessionStorageState`** (NOT `runeLocalStorage` / `runeSessionStorage`, which were spike-scratch names). **No persistence-format migration shims** — stale old-format `localStorage` payloads are simply ignored/overwritten (acceptable loss of locally-cached answers).

## Milestone v2.11 Requirements

Requirements for this milestone. Each maps to exactly one roadmap phase.

### Domain A — Context Rune Migration (CTX) — Waves 1 & 2

- [ ] **CTX-01**: `appContext` is pure runes — no `svelte/store` import; reactive values exposed via getters; `appSettings` + `appCustomization` DB-override merge happens at `$state` init (closes the real SSR gap where the `$effect`-only merge skipped the override on the server); `mergeAppSettings` is pure (`{ ...target, ...nonNull }`, no shared-ref mutation); effective-settings merge `merge(staticSettings, dynamicSettings, page.data.appSettingsData)` reactive on the third input with a reference-equality guard. _(spikes 001, 008)_
- [ ] **CTX-02**: `dataContext` is pure runes — `writable(dataRoot)` bridge and `get(dataRootStore)` infinite-loop workaround removed; `current`/`instance` handle split with `untrack()` around write-after-read; sequential-population semantics (`provideElectionData → … → provideNominationData`) still trigger downstream `$derived` re-evaluation via the version counter. _(spike 002)_
- [ ] **CTX-03**: voter `answerStore` + candidate `candidateUserDataStore` persist through a single shared `localStorageState<T>(key, default)` helper (the spike-scratch `runeLocalStorage` renamed per the no-migration-era-prefix constraint) mirroring `localStorageWritable`'s versioned-payload format (`{ version, data }`); the three-layer `$state → localStorageWritable → fromStore` bridge is gone at both callsites. **No format-migration shim** — the format may change freely and stale old-format payloads are ignored/overwritten. _(spikes 003, 005)_
- [ ] **CTX-04**: layout overlay system uses a token-keyed registry + declarative `use*()` consumer API; `StackedState` (`implements Readable<T>`) and the `getLayoutContext(onDestroy)` index-revert plumbing are removed; `$effect` cleanup replaces `onDestroy`; robust against out-of-order mount/unmount. _(spike 006)_
- [ ] **CTX-05**: `popupStore` is pure runes following the queue-shaped Pattern-1 shape (no `toStore(() => firstItem)` + `subscribe` getter). _(spike 010)_
- [ ] **CTX-06**: `survey` + `trackingService` secondary bridges are pure runes (no `fromStore`/`toStore` over appSettings / sessionId / userPreferences). _(spike 010)_
- [ ] **CTX-07**: `voterContext` + `candidateContext` are rune-native factories composing Tier-1 contexts via `getXContext()` and exposing their 18+/30+ reactive accessors as getters; a `sessionStorageState` sibling helper (spike-scratch `runeSessionStorage`, renamed) backs `voterContext`'s `firstQuestionId`; the destructure-trap reproduces identically and is preserved per the CLAUDE.md rule. _(spikes 007, 010)_
- [ ] **CTX-08**: `getRoute` is rune-native — pure `$derived.by` reading `page.params` / `page.route` / `page.url` as separate fields (never `page` as a single value inside a tracking scope), bypassing the `toStore` short-circuit trap; the custom `afterNavigate` republish workaround is removed. _(spike 012 — Wave 3 unblocker)_

### Domain A — Consumer Migration (CONS) — Wave 3

- [ ] **CONS-01**: all 146 `$store.X` template auto-subscribe sites across 45 `.svelte` files are rewritten to `ctx.current.X` / local `$derived` aliases via the pure-Node codemod (idempotent, dry-run by default). _(spike 009)_
- [ ] **CONS-02**: all 134 `$getRoute(opts)` call sites are migrated to the rune-native `getRoute`. _(spikes 009, 012)_
- [ ] **CONS-03**: the destructure-trap audit pass fixes the `AdminNav.svelte:33` `isAuthenticated` destructure production bug and the `adminContext.svelte.ts:97` spread-of-context anti-pattern that de-reactivates auth-context `$derived` accessors. _(spike 009)_

### Domain A — Cleanup (CLEAN) — Wave 4

- [ ] **CLEAN-01**: `persistedState.svelte.ts` and `StackedState.svelte.ts` are deleted; `Readable<T>` is dropped from the relevant `.type.ts` files; zero `svelte/store` imports remain anywhere in `lib/contexts/**` and `routes/**`. _(spikes 003, 005, 006, 010)_
- [ ] **CLEAN-02**: an ESLint guard rule prevents reintroducing `svelte/store` imports in migrated context files. _(optional, derived from the codemod — spike 009)_

### Domain B — View Transitions (VT) — Wave A

- [ ] **VT-01**: the root layout couples navigation to the View Transitions API via `onNavigate(navigation => new Promise(resolve => startViewTransition(async () => { resolve(); await navigation.complete; })))`, reading `navigation.to?.url` (NOT `page.url`) for destination-based decisions. _(spike 015)_
- [ ] **VT-02**: `view-transition-name`s are assigned so element-stable cross-fades replace the perceived full-page redraw. **Scope expanded per user decision 99-1 (2026-06-04)** beyond the 4 spike-proven elements (Header / MainContent / hero / QuestionActions) to also cover, where applicable: **results election-switching, entity tabs in results, tabs in entity details, `QuestionHeading`, and the candidate-app `/questions` route.** _(spike 015 + user 99-1)_
- [ ] **VT-03**: `prefers-reduced-motion` is honored on BOTH layers — `matchMedia` short-circuits `startViewTransition` in JS, and a CSS `@media (prefers-reduced-motion: reduce) { :global(...) }` block (correct Svelte-parser form) nulls any escaping animation. _(spike 015)_

### Domain B — Navigation a11y (NAVA11Y) — Wave A

- [ ] **NAVA11Y-01**: a dedicated `aria-live="polite"` route announcer whose text derives from `page.params.X` announces route changes (NOT `<svelte:head><title>` updates — SPA title-change announcement is unreliable on NVDA/JAWS). _(spike 016)_
- [ ] **NAVA11Y-02**: focus is reset explicitly on navigation — `afterNavigate` → `requestAnimationFrame(() => target.focus({ preventScroll: true }))` (preventScroll MANDATORY to not fight `goto({ noScroll: true })`); the question heading carries `data-focus-on-nav` / `tabindex="-1"`. _(spike 016)_
- [ ] **NAVA11Y-03**: the transition stack passes the WCAG 2.1 AA gate (focus management + aria-live announcer + reduced-motion) under the existing `@axe-core/playwright` env-gated smoke. _(spike 016)_

### Domain B — Questions Layout Restructure (QLAYOUT) — Wave B

- [ ] **QLAYOUT-01**: `/questions` rendering is hoisted from `[questionId]/+page.svelte` into the parent `questions/+layout.svelte` (unified-layout-with-empty-leaf, mirroring the existing production `results/[[electionTab]]/+layout.svelte` pattern); `[questionId]/+page.svelte` becomes an empty stub. _(spikes 014a, 014b)_
- [ ] **QLAYOUT-02**: variant remount uses `{#key question.type}` (NOT `{#key question.id}`) — the input stays mounted within a run of same-variant questions and remounts cleanly only at Likert↔open-text↔slider boundaries; layout-owned `$state` answers survive Q→Q nav. _(spike 014b, 016)_

### Suite (SUITE)

- [ ] **SUITE-01**: the 2 quarantined `perm-per-app-notifications` E2E tests are re-enabled (the quarantine was explicitly gated on this migration), and the full E2E + unit suites are green with no behavior regression vs the v2.10 ship baseline.

## Future Requirements

Deferred beyond this milestone.

- **165 intra-package circular deps** (`@openvaa/data` / `matching` / `filters` `internal.ts` barrel pattern) — dedicated structural-refactor milestone.
- Backlog todos carried forward to v2.11+ that are NOT runes/transitions (party-app generalization, `rename-admin-writer`, `configurable-mock-data`, `adapter-package-loading`, `sql-linting-formatting`, Strapi-era leftovers, Luxembourg/Danish reconciliation, sharable-URLs/multi-tenant pair) — triage via `/gsd-review-backlog`.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Migrating `matchStore` / `nominationAndQuestionStore` | Already rune-native — zero migration work (spike 004 runtime-proven). |
| Re-architecting the context paradigm | Svelte 5 runes are a strict superset of what these stores did — the migration is mechanical, not a redesign (spike findings). |
| Net-new transition *choreography* beyond cross-fades | The milestone ships the proven View-Transitions **cross-fade** + a11y gate. Per user 99-1 the cross-fade is applied to additional surfaces (results election-switch, entity/detail tabs, `QuestionHeading`, candidate `/questions`), but bespoke per-route animation choreography beyond the cross-fade remains out of scope. |
| Structural remount fix for "redraw on Q→Q" | Disproven premise — SvelteKit already reuses `+page.svelte` across param-only URL changes (spike 013); the fix is the swap animation, not remounting. |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CTX-01 | Phase 95 | Pending |
| CTX-02 | Phase 95 | Pending |
| CTX-03 | Phase 95 | Pending |
| CTX-04 | Phase 95 | Pending |
| CTX-05 | Phase 95 | Pending |
| CTX-06 | Phase 96 | Pending |
| CTX-07 | Phase 96 | Pending |
| CTX-08 | Phase 97 | Pending |
| CONS-01 | Phase 97 | Pending |
| CONS-02 | Phase 97 | Pending |
| CONS-03 | Phase 97 | Pending |
| CLEAN-01 | Phase 98 | Pending |
| CLEAN-02 | Phase 98 | Pending |
| VT-01 | Phase 99 | Pending |
| VT-02 | Phase 99 | Pending |
| VT-03 | Phase 99 | Pending |
| NAVA11Y-01 | Phase 99 | Pending |
| NAVA11Y-02 | Phase 99 | Pending |
| NAVA11Y-03 | Phase 99 | Pending |
| QLAYOUT-01 | Phase 100 | Pending |
| QLAYOUT-02 | Phase 100 | Pending |
| SUITE-01 | Phase 101 | Pending |

**Coverage:**
- v2.11 requirements: 22 total
- Mapped to phases: 22 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-04*
*Last updated: 2026-06-04 — folded in batch-discussion decisions (`v2.11-DISCUSSION-POINTS.md`): K1 no-back-compat + helper renames (`localStorageState`/`sessionStorageState`), CTX-03 no-shim, VT-02 scope expansion (99-1), out-of-scope reframe.*
