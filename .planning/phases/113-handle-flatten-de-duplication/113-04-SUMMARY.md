---
phase: 113-handle-flatten-de-duplication
plan: 04
subsystem: frontend-contexts
tags: [svelte5, refactor, flatten, reactive-accessor, defineProperty, spread-safety, codemod, claude-md-contract]
requires:
  - "113-03 (zero production destructure-trap sites for appSettings/dataRoot/locale)"
  - "113-01 (idempotent flatten-current codemod, 3-handle allowlist)"
provides:
  - "appContext.appSettings / appContext.locale / dataContext.dataRoot (forwarded by appContext) as BARE own-enumerable reactive accessors (Object.defineProperty enumerable:true) — spread-safe across the 3 downstream { ...appContext } spreads"
  - "All ~152 consumer .current reads on the 3 handles flattened to bare ctx.X reads (codemod + by-hand member/orchestrator reads)"
  - "trackingService/surveyLink ReactiveHandle<AppSettings> input contract preserved via a { get current() } call-site wrap (consumer surface bare, producer input unchanged)"
  - "flatten-current codemod hardened: # added to negative-lookbehind + _spikes path skip → true on-tree idempotency (0 rewrites on re-run, both globs)"
affects:
  - "FLATTEN-02 success criterion 2 (consumer .current → bare class-field reads) — DELIVERED in code; back-compat writable appSettings handle removed from producer"
  - "Phase 114 (*Store→*State rename) + Phase 115 (svelte/store clearance) inherit a bare-field appSettings/dataRoot/locale surface"
tech-stack:
  added: []
  patterns:
    - "Bare own-enumerable reactive accessor = Object.defineProperty(this, name, { get(){...}, enumerable: true, configurable: true }) in the constructor — makes 'bare field' + 'survives { ...instance } spread' coexist (a prototype getter would be dropped by the spread)"
    - "Producer-input boundary wrap: keep ReactiveHandle<T> producer inputs unchanged by wrapping the now-bare field in a { get current() } handle at the call site (minimal blast radius; research Open Q#2)"
    - "Orchestrator value-captured handle field → private GETTER (get #appSettings(){ return this.#appContext.appSettings }) so the bare reactive accessor is re-read each access (a field initializer would snapshot once and lose reactivity)"
    - "Codemod negative-lookbehind MUST include # to skip this.#handle.current private-field producer reads (else over-reaches + non-idempotent on .ts)"
key-files:
  created: []
  modified:
    - "apps/frontend/src/lib/contexts/app/appContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/app/appContext.type.ts"
    - "apps/frontend/src/lib/contexts/data/dataContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/data/dataContext.type.ts"
    - "apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts"
    - "apps/frontend/src/lib/contexts/app/survey.svelte.test.ts"
    - "apps/frontend/scripts/flatten-current-codemod.mjs"
    - "apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte"
    - "CLAUDE.md"
    - "(+ 49 consumer .svelte/.ts files flattened by the codemod)"
decisions:
  - "The former writable { current, set, update } appSettings handle had ZERO external set/update callers (grep clean) — internal writes already go through the private #appSettingsValue $state (re-merge $effects + field initializer). So the public surface is bare READ-ONLY, no setAppSettings() method added."
  - "Orchestrator-internal reroute went DEEPER than the plan's 'convert .X.current → .X by hand': voter/candidate captured this.#appContext.appSettings into a VALUE field then read .current. After flatten that field would snapshot the bare value once at construction and lose reactivity — so the 3 fields became private GETTERS (re-read the bare accessor each access). All .current reads off them flattened to bare."
  - "Codemod hardened (Rule 1 bug fix): the original negative-lookbehind [\\w$.] did NOT exclude #, so it over-reached into this.#appSettings.current producer-internal ReactiveHandle reads (survey/tracking) and was NOT idempotent on the .ts glob. Added # to the class + a _spikes path skip (frozen design fixtures, research A3). Both globs now report 0 on re-run."
  - "getRoute.current Pitfall-1 guard measured by OCCURRENCES (grep -o = 151, unchanged HEAD→now), not line-count (grep -c jumped 147→148 purely because prettier wrapped a 2-call ternary across 3 lines). Zero getRoute occurrences added/removed/corrupted."
metrics:
  duration: "~75 min"
  completed: "2026-06-13"
  tasks: 3
  files_changed: 60
---

# Phase 113 Plan 04: FLATTEN-02 Part 2 — Bare Conversion + Consumer Codemod Summary

Converted `appContext.appSettings` / `appContext.locale` / `dataContext.dataRoot` (and appContext's forwarded `dataRoot`) from own-enumerable `{ current }` handle objects into BARE own-enumerable reactive accessors (`Object.defineProperty(this, name, { get(){…}, enumerable: true })`), and in the SAME atomic commit ran the idempotent codemod that flattened every consumer `<handle>.current` read to bare `<handle>`. The defineProperty(enumerable:true) install is the load-bearing choice: it makes "bare field" and "survives the three downstream `{ ...appContext }` spreads" coexist (a prototype getter would be silently dropped). Build (14/14), unit (762), svelte-check (151/0), spike-009 PASS-4 audit (0 traps), and on-tree codemod idempotency (0 on re-run, both globs) are all green. The live E2E gate (Task 3 checkpoint) requires an interactive `yarn dev` + seed + dev-server restart and was NOT runnable in this non-interactive context — see "E2E Gate" below.

## What Was Built

**Task 1 — producers to bare own-enumerable reactive accessors (commit 2dafa84ae):**
- `dataContext.svelte.ts`: `dataRoot` from a `{ get current(){ void #version; return dataRoot } }` value-field handle → `Object.defineProperty(this, 'dataRoot', { get(){ void self.#version; return dataRoot }, enumerable: true, configurable: true })`. The `void #version` reactive bridge + `dataRoot.subscribe` bump + `setDataRoot` writer are UNCHANGED.
- `dataContext.type.ts`: `dataRoot: { readonly current: DataRoot }` → `readonly dataRoot: DataRoot`.
- `appContext.svelte.ts`: `appSettings`, `locale`, and the forwarded `dataRoot` installed via `Object.defineProperty(enumerable:true)` (removed from the `Object.assign` forwarding block + the writable-handle constructor install). `locales`/`darkMode`/`appType`/`appCustomization` left AS-IS (`{ current }`, out of scope).
- ReactiveHandle producer-input boundary (research Open Q#2): `trackingService`/`surveyLink` keep their `appSettings: ReactiveHandle<AppSettings>` input. At the call site the now-bare field is wrapped back into a `const appSettingsHandle = { get current(){ return self.#appSettingsValue } }` passed to both producers. The producers' internals are UNCHANGED — they still read `this.#appSettings.current`.
- `appContext.type.ts`: `appSettings` → `readonly appSettings: AppSettings` (writable set/update dropped — no external callers), `locale` → `readonly locale: string`.

**Task 2 — consumer codemod + spread test + gate (commit 2dafa84ae, same atomic boundary):**
- Ran `flatten-current-codemod.mjs --apply` across both globs: **108 appSettings + 39 dataRoot + 5 locale = 152 rewrites** in 47 `.svelte` files, **+4 (.ts, 4 appSettings + 1 locale)** in the orchestrator-internal reads.
- By-hand member-access reads the codemod's `.`-lookbehind deliberately skips (7 `ctx.X.current` / `voterCtx.X.current` reads in candidate/help, voters/nominations ×4, questions/+layout) flattened manually.
- Orchestrator reroute (voter + candidate context): the value-captured `#appSettings`/`#dataRoot`/`#locale` fields became private GETTERS re-reading the bare `this.#appContext.X`; their `.current` reads flattened to bare.
- Spread test (`appContext.spread.svelte.test.ts`): data stub `dataRoot: handle({})` → bare `dataRoot: {}`; Test 2 converted to bare (`spread.appSettings`, `spread.locale === 'en'`) + added the Pitfall-3 guard `expect(Object.keys(spread)).toContain('appSettings'/'dataRoot'/'locale')`.
- One non-handle-named alias fixed by hand: `LanguageSelection.svelte` had `const currentLocale = $derived(ctx.locale)` then read `currentLocale.current` — the codemod only flattens reads named exactly `appSettings`/`dataRoot`/`locale`, so this alias's `.current` was missed (the lone genuinely-new svelte-check error). Fixed to bare `currentLocale`.

**Task 3 — CLAUDE.md finalization (commit 44db0b97e):**
- Removed the FLATTEN-02 transition-window hedging (`ctx.appSettings.current` is no longer valid on the three); one-time init reads now read bare `ctx.appSettings`; dated note updated to "FLATTEN-02 complete, read ctx.X bare".

## Verification Results (gates actually run)

- **Codemod on-tree idempotency:** 2nd dry-run `.svelte` glob = **Total rewrites: 0** ✓; `.ts` glob = **Total rewrites: 0** ✓ (after the codemod hardening — see Deviations).
- **Zero in-scope `.current` reads remain:** grep for `appSettings.current`/`dataRoot.current`/`locale.current` (excl. `_spikes`, `.test.`, the two producer-internal `#appSettings.current` reads, and comments) = **0** ✓.
- **getRoute.current unchanged:** OCCURRENCE count (grep -o) = **151 at HEAD and now** — zero added/removed/corrupted ✓. (Line-count grep -c shows 147→148 purely because prettier wrapped a 2-`getRoute.current`-call ternary across 3 lines in `(voters)/intro/+page.svelte`; not a real change — see Deviations.)
- **spike-009 PASS-4 destructure-trap audit:** `flatten-codemod` PASS-2 = **0 traps**; spike-009 source audit for the 3 names = **0 traps** ✓.
- **yarn build:** **14/14** turbo tasks (client + SSR), `appContext.svelte.js` / `voterContext.svelte.js` / `candidateContext.svelte.js` SSR chunks emitted ✓.
- **yarn svelte-check:** **151 ERRORS, 0 WARNINGS** — exactly the baseline (113-03 = 151). The 6 candidateContext `SupabaseDataWriter`/`Promise<UniversalDataWriter>` errors are PRE-EXISTING (they only shifted line numbers 118→126 etc. because the getter conversion added lines — verified by stash/diff against HEAD) ✓.
- **yarn vitest run (frontend):** **58 files, 762 passed** — matches the 113-03 baseline; `appContext.spread` passes in the bare form (incl. the new `Object.keys(spread)` Pitfall-3 guard); `survey` + `trackingService` producer tests pass (producer-input `.current` retained) ✓.

## E2E Gate (Task 3 — NOT run; requires interactive environment)

Task 3 is a `checkpoint:human-verify` (autonomous: no). The live E2E gate needs: `yarn db:reset && yarn db:seed --template e2e/base --likert-only`, a fresh `yarn dev` with a **mandatory dev-server restart** (project memory `e2e_hmr_staleness_restart` — Phase 113 rewrites large context modules; stale HMR false-greens), then `yarn test:e2e --project=voter-journey --project=candidate --project=a11y-smoke` plus a manual navigation smoke for the reactivity-loss class (settings/dataRoot must update on navigation, not freeze at init). This could NOT be brought up in the non-interactive execution context. **All code tasks + their static gates are green and committed.** At verification time the live E2E must still be run; the destructure-trap class this E2E catches is already pre-empted by 113-03 (zero trap sites) + the spike-009 PASS-4 audit (0 traps) here.

## Deviations from Plan

### [Rule 1 - Bug] Hardened the flatten codemod — it over-reached into `#`-private producer reads and was non-idempotent on `.ts`

- **Found during:** Task 2 idempotency re-check — the 2nd `.ts` dry-run reported 4 rewrites (NOT 0), all `this.#appSettings.current` reads in `survey.svelte.ts` / `trackingService.svelte.ts` / a `_spikes` fixture + a doc comment.
- **Issue:** The codemod's negative-lookbehind `[\w$.]` did NOT exclude `#`, so `this.#appSettings.current` (the producers' KEPT `ReactiveHandle<AppSettings>` input reads) matched. Flattening them would (a) corrupt the producer-input contract and (b) make the codemod re-flatten on every run (not idempotent). I had to manually `git checkout` the 4 producer/spike files after the first apply.
- **Fix:** Added `#` to the negative-lookbehind class (`(?<![\w$.#])`) so private-field reads are skipped, and added a `_spikes[\w-]*/` path skip (frozen design fixtures, research A3 — never rewrite). Reworded one doc comment in `survey.svelte.test.ts` that contained the literal `appSettings.current` prose. Both globs now report `Total rewrites: 0` on re-run.
- **Files modified:** `apps/frontend/scripts/flatten-current-codemod.mjs`, `apps/frontend/src/lib/contexts/app/survey.svelte.test.ts`.
- **Commit:** 2dafa84ae.

### [Rule 2 - Missing critical functionality] Orchestrator value-captured handle fields converted to private getters (deeper than the plan's by-hand `.current → .` note)

- **Found during:** Task 2 pre-implementation read of voter/candidate contexts.
- **Issue:** The plan's Task 2 said to "convert each `.X.current` → `.X` by hand" in the orchestrators. But voter/candidate captured `#appSettings = this.#appContext.appSettings` (a VALUE field) then read `this.#appSettings.current`. After the flatten `this.#appContext.appSettings` is a bare reactive VALUE — a field initializer would snapshot it once at construction and lose reactivity (the exact Phase-61 destructure-trap class). A naive `.current → .` rewrite would type-check but silently freeze settings.
- **Fix:** Converted the 3 fields to private GETTERS (`get #appSettings(){ return this.#appContext.appSettings }`) so the bare accessor is re-read inside the tracking scope on each access, then flattened all `.current` reads off them. Typed the getters via `AppContext['appSettings'|'locale'|'dataRoot']` (already imported) to avoid new `DataRoot`/`AppSettings` imports.
- **Files modified:** `voterContext.svelte.ts`, `candidateContext.svelte.ts`.
- **Commit:** 2dafa84ae.

### [Rule 1 - Bug] `LanguageSelection.svelte` non-handle-named alias `.current` read (the lone new svelte-check error)

- **Found during:** Task 2 svelte-check (152 vs 151 baseline; the single genuinely-new error).
- **Issue:** Plan 03 left `const currentLocale = $derived(ctx.locale)` then `currentLocale.current` in the template. The codemod only flattens reads on the literal names `appSettings`/`dataRoot`/`locale`, so this `currentLocale.current` was missed; after the flatten `currentLocale` is a bare string and `.current` is a type error.
- **Fix:** `disabled={loc === currentLocale}` (bare). svelte-check back to 151.
- **Files modified:** `LanguageSelection.svelte`.
- **Commit:** 2dafa84ae.

### [Note — not a deviation] getRoute.current line-count vs occurrence-count

The plan's Pitfall-1 acceptance grep (`grep -c getRoute.current | wc -l`) read 147 at HEAD and 148 after — but that is a prettier line-wrap artifact (a `… ? getRoute.current('Constituencies') : getRoute.current('Elections')` ternary in `(voters)/intro/+page.svelte` was wrapped across 3 lines, putting its two EXISTING calls on separate lines). The occurrence-accurate count (`grep -oh getRoute.current | wc -l`) is **151 at both HEAD and now** — the codemod touched zero getRoute reads. Documented here so the verifier doesn't read the 147→148 line delta as over-reach.

### appSettings.set/update orphaned-writer check (plan acceptance criterion)

`grep -rn "appSettings.set(\|appSettings.update("` across `apps/frontend/src` = **0 matches** (no producer-boundary wrap uses them either — the wrap is a `{ get current() }` read-only handle). The former writable handle had no external callers; the bare read-only conversion orphaned nothing.

## Known Stubs

None. This plan flattens existing reactive reads and removes a redundant writable surface; it introduces no placeholder data or unwired UI.

## Threat Flags

None. Pure internal frontend refactor — no new network endpoints, auth paths, file access, or schema changes (matches 113-RESEARCH Security Domain: no new surface).

## Self-Check: PASSED

- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` — FOUND (modified; `defineProperty(this, 'appSettings'`/`'locale'`/`'dataRoot'` enumerable:true present)
- `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` — FOUND (modified; `defineProperty(this, 'dataRoot'` + `void self.#version` preserved + `setDataRoot` intact)
- `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts` — FOUND (modified; bare form + `Object.keys(spread)` Pitfall-3 guard)
- `apps/frontend/scripts/flatten-current-codemod.mjs` — FOUND (modified; `#` in lookbehind + `_spikes` skip)
- Commit 2dafa84ae (refactor: bare flatten + codemod, 59 files) — FOUND
- Commit 44db0b97e (docs: CLAUDE.md finalize) — FOUND
- build 14/14, svelte-check 151/0, vitest 762, spike-009 PASS-4 0 traps, codemod idempotent (0 both globs), getRoute occurrences 151 unchanged — all VERIFIED
