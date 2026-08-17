---
phase: 103-current-handle-codemod
plan: B
type: execute
wave: 2
depends_on: ["103-A"]
files_modified:
  - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
  - apps/frontend/src/lib/contexts/app/appContext.type.ts
  - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts
  - apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts
  - apps/frontend/src/lib/contexts/data/dataContext.svelte.ts
  - apps/frontend/src/lib/contexts/data/dataContext.type.ts
  - apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts
  - apps/frontend/src/lib/contexts/layout/layoutContext.type.ts
  - apps/frontend/src/routes/+layout.svelte
  - apps/frontend/src/routes/candidate/+layout.svelte
  - apps/frontend/src/routes/admin/+layout.svelte
  - apps/frontend/src/routes/(voters)/+layout.svelte
  - apps/frontend/src/lib/contexts/app/survey.svelte.test.ts
  - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts
  - CLAUDE.md
autonomous: true
requirements: [HANDLE-02, HANDLE-03]
must_haves:
  truths:
    - "Every migrated handle (A1-A12 read-only, B13-B18 read-write) exposes a context-property getter / get-set accessor pair; consumers read `ctx.x` (not `ctx.x.current`) and write `ctx.x = v` (not `ctx.x.set(v)`)."
    - "Zero residual `.current` on the migrated handles across `apps/frontend/src/**` (E1-E4 retained exceptions + Tween/this/password/event/row/updated false positives are the only allowed residuals)."
    - "Re-running the codemod with --apply is a no-op (git diff empty) — the codemod is idempotent."
    - "The build is green at every commit boundary; the existing E2E suite stays green; auth-gated nav + voter flow still react after the write-surface change."
    - "No folded reactive handle is left destructured out of a context (destructure-trap audit = 0 traps); CLAUDE.md's reactive-accessor list is updated in lockstep."
    - "The `_poc*` scaffolding from Phase 102 is deleted from both appContext.svelte.ts and appContext.type.ts."
  artifacts:
    - path: "apps/frontend/src/lib/contexts/app/appContext.type.ts"
      provides: "Folded handle type members (readonly value types for A-class; bare value types for B-class get/set)"
      contains: "readonly darkMode: boolean"
    - path: "apps/frontend/src/lib/contexts/app/appContext.svelte.ts"
      provides: "Context-property getters / accessor pairs on the setContext return; _poc* deleted"
      contains: "get appType()"
    - path: "CLAUDE.md"
      provides: "Updated Context Destructuring Rule reactive-accessor list (single source of truth for Phase-105 ESLint guard)"
      contains: "appSettings"
  key_links:
    - from: "apps/frontend/src/routes/(voters)/+layout.svelte"
      to: "ctx.appType setter"
      via: "appType = 'voter' (was appType.set('voter'))"
      pattern: "appType = '"
    - from: "apps/frontend/src/lib/contexts/app/appContext.svelte.ts"
      to: "PersistedState handle (userPreferences) + raw $state (appType) + cross-context (darkMode/getRoute)"
      via: "get/set accessor pairs + plain getters on setContext return"
      pattern: "get appType"
---

<objective>
Land the highest-blast-radius change of the milestone in ONE atomic mechanical commit: flip the migrated handle DECLARATIONS (Plan A's two products are the prerequisites) from `{ readonly current; set?; update? }` objects to context-property getters / get-set accessor pairs, AND apply the Plan-A codemod that rewrites all ~423 consumer `.current` reads, the 5 writes, and the reactive-handle destructures — before/after both internally green, no red intermediate (Sequence 1, mirroring v2.11 Phase 97 D-09). Then validate (idempotency + zero-residual + destructure-trap audit), run the single mid-chain E2E pass (K3), hand-fix the excluded test files as separate commits (D-02), update CLAUDE.md's reactive-accessor list, and archive the script.

Purpose: HANDLE-02 (declarations conform — zero `.current` on the folded handles) + HANDLE-03 (idempotent consumer codemod, green at every commit boundary, destructure-trap contract preserved). This is the phase's primary deliverable.

Output: the folded context declarations + codemodded consumers in a single mechanical commit; separate manual-fix commits for the excluded test files + the CLAUDE.md list update; the K3 E2E green proof; the codemod retained at its `.planning/archive/` location (D-03).
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

# Authoritative scope (the named-handle allowlist — do NOT re-decide):
@.planning/phases/102-handle-idiom-spike/102-DECISION-RECORD.md

# Plan A's products this plan consumes (codemod script + retargeted test):
@.planning/phases/103-current-handle-codemod/103-A-PLAN.md

# Declaration-conform mechanics, atomic sequence, per-handle catalog, landmines, validation:
@.planning/phases/103-current-handle-codemod/103-RESEARCH.md
@.planning/phases/103-current-handle-codemod/103-PATTERNS.md
@.planning/phases/103-current-handle-codemod/103-VALIDATION.md

# The proven idiom shapes (production analogs) + the destructure-trap contract:
@apps/frontend/src/lib/contexts/app/appContext.svelte.ts
@apps/frontend/src/lib/contexts/app/appContext.type.ts
@CLAUDE.md
</context>

<artifacts_produced>
## Artifacts this phase produces (Plan B)

| Symbol / Path | Kind | Signature / Shape (after fold) |
|---------------|------|--------------------------------|
| `get locale()` etc. (A1-A12) | context-property getter | read-only plain getter on `setContext` return — `get locale(): string`, `get locales()`, `get darkMode(): boolean`, `get reactiveAppSettings()`, `get reactiveLocale()`, `get getRoute(): RouteBuilder`, `get surveyLink()`, `get sessionId()`, `get shouldTrack()`, `get dataRoot()`, `get reactiveDataRoot()` (`.current` fold only; `.instance` E3 retained), `get routeTitle()` |
| `get appType()/set appType(v)` (B15) | accessor pair | over raw factory `$state` (adminContext.svelte.ts:112-117 shape) |
| `get appSettings()/set appSettings(v)` (B13) | accessor pair | SSR-init merge stays at `$state` init — NOT in accessor (Spike 008) |
| `get appCustomization()/set appCustomization(v)` (B14) | accessor pair | same SSR-init invariant as B13 |
| `get userPreferences()/set userPreferences(v)` (B16) | accessor pair | delegates `get`→`_h.current`, `set`→`_h.set` (candidateContext.svelte.ts:391-396 shape); PersistedState helper kept |
| `get sendTrackingEvent()/set sendTrackingEvent(v)` (B17) | accessor pair | shape `{current; set}` (no update) |
| `get openFeedbackModal()/set openFeedbackModal(v)` (B18) | accessor pair | shape `{current; set}` (no update) |
| Type members (appContext.type.ts etc.) | TS types | `{ readonly current: T }` → `readonly T` (read-only); `{ readonly current; set; update }` → `T` (read-write) |
| `.planning/archive/phase-103-current-handle-codemod.mjs` | retained script | archived in place (D-03); ongoing protection handed to Phase-105 ESLint guard |
| CLAUDE.md reactive-accessor list | doc update | extended with the 15 newly-folded reactive accessors (single source of truth) |

**Deleted:** `_pocDarkMode`/`_pocAppType`/`_pocGetRoute` (appContext.svelte.ts:355-364 + appContext.type.ts:146-150).
**Retained (NOT folded — E1-E4):** `popupQueue`, `candidateUserData`, `reactiveDataRoot.instance`, `topBarSettings`.
</artifacts_produced>

<tasks>

<task type="auto">
  <name>Task 1: Manual-fix commits for non-codemod-reachable breakers (pre-flip, green tree)</name>
  <files>apps/frontend/src/lib/contexts/app/survey.svelte.test.ts, apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts</files>
  <read_first>
    - apps/frontend/src/lib/contexts/app/survey.svelte.test.ts (the excluded test file — find its `.current`/`.set` references to migrated handles)
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts (the excluded test file)
    - .planning/phases/103-current-handle-codemod/103-RESEARCH.md (§Open Questions Q1 — EXCLUDE `*.test.ts` from `--apply`; update test expectations as manual fixes; §"green-at-every-commit sequence" step 1)
    - .planning/phases/102-handle-idiom-spike/102-DECISION-RECORD.md (the allowlist — only migrated-handle references need changing; factory-local handle reads are NOT context-property migration targets)
  </read_first>
  <action>
    These two test files reference migrated handles via `.current`/`.set` but are EXCLUDED from the codemod `--apply` (the `*.test.ts` exclusion), so they could break under the declaration fold if they assert against the assembled CONTEXT shape. They are NOT codemod-reachable, so per Sequence 1 step 1 any real edit lands as a standalone manual-fix commit. RESOLUTION: these are unit tests of the FACTORIES (`createSurvey()` / `createTrackingService()`), which still return `{ current }` / `{ current; set }` handle objects — only the context-property EXPOSURE folds, not the factory return shape. Inspect each via grep: if a `.current`/`.set` is on a locally-constructed factory handle the test itself builds, it is NOT a migration target and STAYS (the factory handle is unchanged). Only rewrite references that assert against the post-fold assembled-context shape (likely none, since these test factories, not the context). If genuinely no change is needed, record "factory-handle reads unaffected — no test change required" in the SUMMARY and skip the edit (no empty commit). Commit any real edit as `test(103-B): retarget <file> off migrated context-handle shape` — one commit per file (D-02 clean revert boundary).
  </action>
  <verify>
    <automated>cd apps/frontend && yarn test:unit --run survey trackingService 2>&1 | tail -15</automated>
  </verify>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit --run survey trackingService` passes against the CURRENT pre-flip tree (factory-local handle reads unaffected by the context-property fold, OR hand-edited to match).
    - Any edit is a separate commit per file (D-02); if no edit is needed, the SUMMARY records the no-change finding.
    - The tree is GREEN before Task 2 (the atomic flip) runs.
  </acceptance_criteria>
  <done>The two excluded test files are confirmed unaffected (factory-local handle reads) or hand-fixed in separate commits; the tree is green and ready for the atomic declaration-flip + codemod commit.</done>
</task>

<task type="auto">
  <name>Task 2: Atomic mechanical commit — flip declarations + apply codemod (Sequence 1)</name>
  <files>apps/frontend/src/lib/contexts/app/appContext.svelte.ts, apps/frontend/src/lib/contexts/app/appContext.type.ts, apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts, apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts, apps/frontend/src/lib/contexts/data/dataContext.svelte.ts, apps/frontend/src/lib/contexts/data/dataContext.type.ts, apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts, apps/frontend/src/lib/contexts/layout/layoutContext.type.ts, apps/frontend/src/routes/+layout.svelte, apps/frontend/src/routes/candidate/+layout.svelte, apps/frontend/src/routes/admin/+layout.svelte, apps/frontend/src/routes/(voters)/+layout.svelte</files>
  <read_first>
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts (the bulk — the `_poc*` surfaces at :355-364, the handle construction, the `setContext({...})` return object, the appSettings/appCustomization init-merge at :88-123 which MUST stay untouched, the producer-internal `userPreferences.update` at :244/254/261)
    - apps/frontend/src/lib/contexts/app/appContext.type.ts (the `{ readonly current }` declarations :25-99 + `_poc*` members :146-150 to delete)
    - .planning/phases/102-handle-idiom-spike/102-DECISION-RECORD.md (§A read-only A1-A12, §B read-write B13-B18, §C retained E1-E4 — the EXACT per-handle target shapes; §getRoute fold verdict)
    - .planning/phases/103-current-handle-codemod/103-PATTERNS.md (§"appContext.{svelte,type}.ts" — Analog 1 `_poc*` shapes, Analog 2 adminContext:112-117 raw-$state pair, Analog 3 candidateContext:391-396 PersistedState-backed pair; the type-file BEFORE/AFTER; SSR-init invariant; retained-exception list)
    - .planning/phases/103-current-handle-codemod/103-RESEARCH.md (§"The green-at-every-commit sequence" Sequence 1; §"Plan A: Declarations Conform" the producer mechanic; §Per-Handle Transformation Catalog B13/B14 SSR-init, B15 appType writes, B16 userPreferences LM-7, B17/B18; LM-1 glob, LM-3 AdminNav class)
    - .planning/archive/phase-103-current-handle-codemod.mjs (Plan A's codemod — the `--apply` target)
  </read_first>
  <action>
    Land this as ONE mechanical commit (D-02) — the declaration flip and the consumer codemod for ALL handles ride together (Sequence 1: a single TS key cannot be both old `{current}` and new flat getter, so additive-then-remove on the same key is impossible; before = old shape + `.current` consumers green, after = flat getters + `ctx.x` consumers green, no red intermediate — exactly Phase 97 D-09). Steps, performed and staged together before committing. STEP 1 FLIP DECLARATIONS: in each producer `.svelte.ts`, replace the spread/assigned handle object property in the `setContext({...})` return with the accessor — read-only A-class becomes `get x()` returning the value (e.g. `get darkMode()` returning `componentCtx.darkMode`, `get getRoute()` returning `getRoute.current`, `get dataRoot()`, `get reactiveDataRoot()` folding only the `.current` read); read-write B-class becomes a `get x()/set x(v)` pair (B15 `appType` over raw `$state` per adminContext:112-117; B16 `userPreferences` delegating get to `_h.current` and set to `_h.set` per candidateContext:391-396, PersistedState helper KEPT; B17/B18 the `{current;set}` shape). For B13 `appSettings` / B14 `appCustomization` expose the read getter plus a setter, but the SSR-init DB-override merge MUST stay at `$state` init / the existing `$effect` reference-equality guard (appContext.svelte.ts:88-123) — do NOT move it into the accessor (Spike 008). DELETE the `_poc*` surfaces (appContext.svelte.ts:355-364 + appContext.type.ts:146-150). In each `.type.ts`, collapse `{ readonly current: T }` to `readonly T` (read-only) and `{ readonly current; set; update }` to `T` (read-write). Do NOT touch E1-E4: `popupQueue` (appContext.type.ts:91), `reactiveDataRoot.instance` (dataContext — fold only the `.current` read to a getter, KEEP the handle object for `.instance`), `topBarSettings` (layoutContext), `candidateUserData`. STEP 2 APPLY CODEMOD: run `node .planning/archive/phase-103-current-handle-codemod.mjs --apply` — it rewrites consumer `.current` reads, the getRoute call form, the 5 writes (`appType.set` to `appType = ` in the 3 app-root layouts, `sendTrackingEvent.set` and `openFeedbackModal.set` to `= ` in `routes/+layout.svelte`), and the reactive-handle destructures across `.svelte` + `lib/contexts/**/*.svelte.ts` (LM-1). STEP 3 BUILD GREEN: `yarn build --filter=@openvaa/frontend` must exit 0 with everything staged; resolve any non-codemod-reachable breakage by hand WITHIN this same staged change (it is the atomic boundary); do NOT introduce migration-era alias names (K1). STEP 4 COMMIT ONCE: `refactor(103-B): fold .current handles to context-property idiom + codemod consumers` — THE mechanical commit (D-02 revert boundary). The codemod already excludes `*.test.ts`/`*.poc.*`. The SSR-init merge, `reactiveDataRoot.instance`, `Tween.current`, and E1-E4 stay exactly as-is.
  </action>
  <verify>
    <automated>node .planning/archive/phase-103-current-handle-codemod.mjs --apply >/dev/null 2>&1; yarn build --filter=@openvaa/frontend 2>&1 | tail -8</automated>
  </verify>
  <acceptance_criteria>
    - `yarn build --filter=@openvaa/frontend` → exit 0 with declarations flipped + codemod applied (green at the commit boundary — HANDLE-03 criterion 3).
    - `_poc*` deleted: `grep -c "_poc" apps/frontend/src/lib/contexts/app/appContext.svelte.ts` and `... appContext.type.ts` → 0 + 0.
    - The 5 writes rewritten: `grep -rn "appType\.set\|sendTrackingEvent\.set\|openFeedbackModal\.set" apps/frontend/src --include="*.svelte" --include="*.ts" | grep -v appContext.svelte.ts` → 0.
    - SSR-init untouched: `appContext.svelte.ts:88-123` init-merge unchanged (no `$effect`-based merge moved into an accessor); the 8 `reactiveDataRoot.instance` reads intact; `Tween.current` intact.
    - Single mechanical commit staging declaration flip + codemod apply together — one revert boundary (D-02).
  </acceptance_criteria>
  <done>All A1-A12 read-only handles are plain context-property getters and all B13-B18 read-write handles are get/set accessor pairs; consumers read `ctx.x` and write `ctx.x = v`; `_poc*` is deleted; E1-E4 + SSR-init invariant preserved; the build is green at this commit boundary; landed as one mechanical commit.</done>
</task>

<task type="auto">
  <name>Task 3: Validate — zero-residual, idempotency, destructure-trap audit + sync CLAUDE.md list</name>
  <files>CLAUDE.md</files>
  <read_first>
    - .planning/phases/103-current-handle-codemod/103-RESEARCH.md (§"Site Discovery & Zero-Residual Assertions" — per-handle zero-residual grep + idempotency assertion; §"Destructure-Trap Preservation" — the two static greps + Pass-4 audit; §"Minimum-sufficient check set")
    - .planning/phases/103-current-handle-codemod/103-VALIDATION.md (Per-Task Verification Map rows for HANDLE-03 idempotency / zero-residual / destructure-trap)
    - CLAUDE.md (the "Context Destructuring Rule (Svelte 5)" reactive-accessor list — the single source of truth Phase-105's ESLint guard reads; class 1 = stable/destructure-safe, class 2 = reactive/read-via-`ctx.X`)
    - .planning/archive/phase-103-current-handle-codemod.mjs (the `--apply` idempotency target + the Pass-4 audit output)
  </read_first>
  <action>
    With Task 2's mechanical commit landed, run the four static guards (no E2E here — that is Task 4) and sync the doc. GUARD A ZERO-RESIDUAL: grep for `.current` on EVERY migrated handle (A1-A12 + B13-B18) across `apps/frontend/src/**` (`*.svelte`+`*.ts`, excluding `.d.ts`/`.test.`) — must be empty for all migrated names; the ALLOWED residuals are `reactiveDataRoot.instance` (8), `popupQueue.current` (4), `candidateUserData.current`, `topBarSettings.current` (E1-E4) plus the Tween/this/password/event/row/updated false positives. The assertion greps ONLY the migrated handle names, NOT all `.current`. GUARD B IDEMPOTENCY: run `node .planning/archive/phase-103-current-handle-codemod.mjs --apply` a SECOND time, then `git diff --quiet` — no diff (HANDLE-03 criterion 2). GUARD C DESTRUCTURE-TRAP: run the two static greps from RESEARCH §Destructure-Trap Preservation — no folded reactive handle left destructured out of `getAppContext`/`getVoterContext`/`getCandidateContext`/`getAdminContext` (`getComponentContext` destructures of darkMode/locale/locales are SAFE, excluded — LM-2), AND the codemod Pass-4 audit reports 0 traps. GUARD D LINT: `yarn lint:check` (D-01 gate) passes. DOC SYNC: extend CLAUDE.md's "Context Destructuring Rule (Svelte 5)" reactive-accessor list (class 2, the read-via-`ctx.X` list) with the 15 newly-folded reactive accessors (`darkMode, appSettings, appCustomization, appType, dataRoot, reactiveDataRoot, locale, locales, reactiveAppSettings, reactiveLocale, userPreferences, surveyLink, routeTitle, sessionId, shouldTrack`) so it matches the codemod's `REACTIVE_ACCESSORS`; keep `getRoute`/`t` in the STABLE (class 1) list. Commit the doc edit separately (D-02 manual fix): `docs(103-B): sync Context Destructuring Rule reactive-accessor list with folded handles`.
  </action>
  <verify>
    <automated>node .planning/archive/phase-103-current-handle-codemod.mjs --apply >/dev/null 2>&1; git diff --quiet && echo IDEMPOTENT-OK || echo NOT-IDEMPOTENT; grep -rnE "\b(locale|locales|darkMode|reactiveAppSettings|reactiveLocale|surveyLink|sessionId|shouldTrack|dataRoot|routeTitle|appSettings|appCustomization|appType|userPreferences|sendTrackingEvent|openFeedbackModal)\.current\b" apps/frontend/src --include="*.svelte" --include="*.ts" | grep -v "\.d\.ts" | grep -v "\.test\." | wc -l</automated>
  </verify>
  <acceptance_criteria>
    - Zero-residual grep over the 17 folded handle names (excluding `reactiveDataRoot` which is checked separately for `.instance`-only) → 0 lines.
    - `node <codemod> --apply` second run + `git diff --quiet` → IDEMPOTENT-OK (HANDLE-03 criterion 2).
    - Destructure-trap static grep (keyed on the 4 real contexts, excluding `getComponentContext`) → 0; codemod Pass-4 audit → 0 traps (HANDLE-03 criterion 4, static half).
    - `yarn lint:check` exits 0 (D-01 gate).
    - CLAUDE.md class-2 reactive list contains all 15 folded accessors; `getRoute`/`t` remain in class 1; committed separately.
  </acceptance_criteria>
  <done>Zero residual `.current` on migrated handles (E1-E4 + false positives the only allowed residuals); the codemod is idempotent; the destructure-trap audit reports 0 traps; lint is green; CLAUDE.md's reactive-accessor list is synced as a separate manual-fix commit.</done>
</task>

<task type="auto">
  <name>Task 4: K3 mid-chain E2E pass + archive confirmation</name>
  <files>.planning/archive/phase-103-current-handle-codemod.mjs</files>
  <read_first>
    - .planning/phases/103-current-handle-codemod/103-VALIDATION.md (§Sampling Rate — the K3 mid-chain pass against a fresh server; LM-5 HMR staleness restart)
    - .planning/phases/103-current-handle-codemod/103-RESEARCH.md (§"Sampling Rate (Nyquist)" — the prioritized specs: voter-journey, candidate-journey + candidate-bank-auth for auth-gated nav AdminNav-class regression, a11y-smoke, the 22 perm-* specs for appSettings-driven feature flags; LM-3 auth nav, LM-5 HMR)
    - .planning/phases/103-current-handle-codemod/103-CONTEXT.md (§Specific Ideas — the UI hint: verify auth state still drives nav rendering + voter question/results flow still reacts after the write-surface change)
    - CLAUDE.md (Database/dev commands — `yarn db:reset`, `yarn dev`, `yarn test:e2e`)
  </read_first>
  <action>
    Run the single mid-chain regression check (K3) — this is the Phase-103 obligation, NOT deferred to GATE-01/Phase 105. Against a FRESH server to avoid HMR staleness (LM-5): `yarn db:reset` (seed the DB), then `yarn dev` (wait until Supabase + Vite are healthy), then `yarn test:e2e`. Prioritize interpreting these specs for the two regression classes this phase risks: (1) auth-gated nav reactivity (AdminNav-class destructure trap, LM-3) — `candidate/candidate-journey.spec.ts`, `candidate-bank-auth.spec.ts`, and the admin-touching perm specs must show auth state still drives nav rendering; (2) voter question/results reactivity after the appSettings/dataRoot fold + the write-surface change — `voter/voter-journey.spec.ts` + the 22 `perm-*` specs (appSettings-driven feature flags). The full suite must be GREEN (match or exceed the v2.11 baseline of 84 passed / 0 skipped; treat any "did not run" as a failure per project policy). If a failure appears, first restart `yarn dev` against `yarn db:reset` (LM-5) and re-run the affected spec before treating it as a real regression. Then CONFIRM the codemod is archived in place at `.planning/archive/phase-103-current-handle-codemod.mjs` (D-03 — it was authored there in Plan A; verify it exists and is committed, with ongoing protection handed to the Phase-105 ESLint guard). No separate move needed (Claude's-discretion path already under `.planning/archive/`).
  </action>
  <verify>
    <automated>yarn db:reset >/dev/null 2>&1 && (yarn dev >/tmp/103-dev.log 2>&1 &) && sleep 45 && yarn test:e2e 2>&1 | tail -25; ls -la .planning/archive/phase-103-current-handle-codemod.mjs</automated>
  </verify>
  <acceptance_criteria>
    - `yarn test:e2e` against a fresh `yarn db:reset` + `yarn dev` → full suite green (≥ 84 passed / 0 skipped; no "did not run" — HANDLE-03 criterion 4, E2E half).
    - Auth-gated nav specs (candidate-journey / candidate-bank-auth / admin perm specs) pass — auth state drives nav rendering (no AdminNav-class regression, LM-3).
    - Voter-journey + perm-* specs pass — voter question/results flow + appSettings-driven feature flags still react after the write-surface change.
    - `.planning/archive/phase-103-current-handle-codemod.mjs` exists and is committed (D-03 archive confirmed).
  </acceptance_criteria>
  <done>The single mid-chain E2E pass (K3) is green against a fresh server — auth-gated nav + voter flow react correctly, no destructure-trap regression; the codemod is archived under `.planning/archive/` (D-03). Phase 103 is complete and ready for verification + Phase 104.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client (consumer `*.svelte`) → context provider (`lib/contexts/**`) | The context-property read/write surface. This phase changes the SHAPE of that surface (`.current` → flat getter, `.set()` → setter) but NOT what crosses it — no new data, no new auth decision, no new input. Same trust posture before and after. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-103B-01 | Tampering | reactive-accessor destructure on auth-gated surface (AdminNav-class, LM-3) | mitigate | Codemod Pass-3 rewrites destructures of folded reactive handles to `$derived(ctx.X)`; Pass-4 audit must report 0 traps; CLAUDE.md reactive list synced; K3 E2E (candidate/admin auth-nav specs) verifies auth state drives nav rendering. This is a correctness/UX regression risk, NOT an authz bypass — no auth DECISION logic changes. |
| T-103B-02 | Information Disclosure | appSettings/appCustomization SSR-init DB-override merge | accept | The SSR-init invariant (Spike 008) is explicitly preserved — the DB-override merge stays at `$state` init, NOT moved into the new accessor. No change to what data is merged or exposed; the fold only changes the read/write idiom. |
| T-103B-03 | Tampering | npm/pip/cargo installs | accept | NONE — pure-Node dependency-free codemod; no package installs; no `## Package Legitimacy Audit` required. |

**No-new-attack-surface assessment:** This is a mechanical idiom fold with NO change to auth logic, data exposure, or trust boundaries. No new high-severity threat is introduced. The only security-adjacent risk is the LM-3 reactivity regression on auth-gated surfaces (a stale destructured snapshot could cause auth state to not drive nav rendering — a correctness/UX bug, NOT a direct authz bypass), fully mitigated by the destructure-trap rewrite + Pass-4 audit + the K3 E2E auth-nav verification.
</threat_model>

<verification>
- `yarn build --filter=@openvaa/frontend` → exit 0 at every commit boundary (the binding green gate; LM-4: NOT `check` exit 0 — 147-error pre-existing baseline).
- Zero-residual grep over the 17 folded handle names → 0 (E1-E4 `.instance`/`.current` + Tween/this/password/event/row/updated the only allowed residuals).
- `node <codemod> --apply` 2nd run + `git diff --quiet` → idempotent.
- Destructure-trap static grep (keyed on the 4 real contexts, excl. `getComponentContext`) + codemod Pass-4 audit → 0 traps.
- `yarn lint:check` → exit 0 (D-01 gate).
- K3 single full E2E pass (`yarn db:reset && yarn dev && yarn test:e2e`) → green (≥ 84/0), auth-gated nav + voter flow react.
- `yarn workspace @openvaa/frontend test:unit --run appContext.poc survey trackingService` → green (no NEW unit failures).
</verification>

<success_criteria>
- HANDLE-02: every migrated handle conforms — read-only A1-A12 expose plain context-property getters (consumers read `ctx.x`, not `ctx.x.current`); read-write B13-B18 expose get/set accessor pairs (`ctx.x` read, `ctx.x = v` write); zero residual `.current` on the folded handles; E1-E4 documented retained exceptions left intact; `_poc*` deleted.
- HANDLE-03: all consumer read/write sites converted by the idempotent codemod (re-run = no-op); build green at every commit boundary; the CLAUDE.md destructure-trap contract preserved (folded reactive handles read via `ctx.X`/`$derived(ctx.X)`, never destructured; audit = 0 traps); the existing E2E suite stays green (K3).
- Commit shape (D-02): ONE mechanical codemod commit (declaration flip + codemod apply) + SEPARATE manual-fix commits (excluded test files if any, CLAUDE.md list sync). Clean revert boundary.
- Codemod archived under `.planning/archive/` (D-03).
</success_criteria>

<output>
Create `.planning/phases/103-current-handle-codemod/103-B-SUMMARY.md` when done.
</output>
