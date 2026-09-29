---
phase: 103-current-handle-codemod
plan: A
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/archive/phase-103-current-handle-codemod.mjs
  - apps/frontend/src/lib/contexts/app/appContext.poc.svelte.test.ts
autonomous: true
requirements: [HANDLE-02, HANDLE-03]
must_haves:
  truths:
    - "An idempotent codemod script exists that, given the named-handle allowlist, rewrites consumer `.current` reads, the 5 writes, and the reactive-handle destructures — and is a no-op on re-run."
    - "The PoC unit test asserts the canonical folded idiom (ctx.darkMode / ctx.appType / ctx.getRoute), not the `_poc*` scaffolding, so it survives Plan B's declaration fold."
    - "Both work products exist and pass their own automated checks BEFORE any declaration flip lands (Plan A leaves the production tree's behavior unchanged — only test + script authoring)."
  artifacts:
    - path: ".planning/archive/phase-103-current-handle-codemod.mjs"
      provides: "The idempotent named-handle codemod (4 passes: .current read rewrite, write rewrite, destructure rewrite keyed on context-call, destructure-trap audit)"
      contains: "READ_ONLY"
    - path: "apps/frontend/src/lib/contexts/app/appContext.poc.svelte.test.ts"
      provides: "Canonical-name PoC round-trip test (retargeted off _poc*)"
      contains: "ctx.appType"
  key_links:
    - from: ".planning/archive/phase-103-current-handle-codemod.mjs"
      to: "102-DECISION-RECORD.md allowlist (A1-A12, B13-B18; E1-E4 excluded)"
      via: "READ_ONLY + READ_WRITE const arrays"
      pattern: "const READ_ONLY"
    - from: ".planning/archive/phase-103-current-handle-codemod.mjs"
      to: "CLAUDE.md Context Destructuring Rule REACTIVE_ACCESSORS"
      via: "extended REACTIVE_ACCESSORS set"
      pattern: "REACTIVE_ACCESSORS"
---

<objective>
Author the two hand-built work products that Plan B's atomic mechanical commit consumes: (1) the idempotent named-handle codemod script (extend the proven `spike-009-store-codemod.mjs`), and (2) the retargeted PoC unit test (move assertions off the Phase-102 `_poc*` scaffolding onto the canonical folded names so the test survives the Plan-B declaration fold). This plan delivers the Wave-0 gaps from 103-VALIDATION.md.

Purpose: Plan B's declaration flip + consumer codemod must ride a single atomic commit (Sequence 1 — a single TS property key cannot be both the old `{ readonly current }` object AND the new flat getter, confirmed empirically in the 102 PoC). The codemod script and the canonical-name test are the prerequisites that let that atomic commit land green. This plan does NOT touch any production handle declaration — the tree's runtime behavior is unchanged after Plan A; only a `.planning/` script and a `*.test.ts` file change.

Output:
- `.planning/archive/phase-103-current-handle-codemod.mjs` — the idempotent codemod (D-03 archive location).
- `apps/frontend/src/lib/contexts/app/appContext.poc.svelte.test.ts` — retargeted onto canonical names.
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

# Codemod mechanism, landmines, pass design, per-handle catalog:
@.planning/phases/103-current-handle-codemod/103-RESEARCH.md
@.planning/phases/103-current-handle-codemod/103-PATTERNS.md
@.planning/phases/103-current-handle-codemod/103-VALIDATION.md

# The proven precedent to EXTEND (do not rewrite from scratch):
@.planning/archive/spike-009-store-codemod.mjs

# The destructure-trap contract this codemod MUST preserve:
@.claude/skills/spike-findings-voting-advice-application-gsd/references/consumer-migration-codemod.md
</context>

<artifacts_produced>
## Artifacts this phase produces (Plan A)

| Symbol / Path | Kind | Signature / Shape |
|---------------|------|-------------------|
| `.planning/archive/phase-103-current-handle-codemod.mjs` | codemod script | Pure-Node, dependency-free. Exports nothing; CLI: dry-run default, `--apply` writes, `--files <glob>` overrides. |
| `READ_ONLY` (in script) | const string[] | `['locale','locales','darkMode','reactiveAppSettings','reactiveLocale','surveyLink','sessionId','shouldTrack','dataRoot','reactiveDataRoot','routeTitle']` |
| `READ_WRITE` (in script) | const string[] | `['appSettings','appCustomization','appType','userPreferences','sendTrackingEvent','openFeedbackModal']` |
| `WRITE_SITES` rewrite (Pass 2) | regex pass | `<H>.set(v)` → `<H> = v` for `appType`/`sendTrackingEvent`/`openFeedbackModal` consumer sites only (5 sites). |
| getRoute call-form pass | regex pass | `ctx.getRoute.current(` → `ctx.getRoute(` (open-paren lookahead) |
| `REACTIVE_ACCESSORS` (extended set) | const Set | spike-009 set + `darkMode, appSettings, appCustomization, appType, dataRoot, reactiveDataRoot, locale, locales, reactiveAppSettings, reactiveLocale, userPreferences, surveyLink, routeTitle, sessionId, shouldTrack` (getRoute/t stay OFF) |
| Retargeted PoC test | unit test | asserts `ctx.darkMode` (readonly boolean), `ctx.appType`/`ctx.appType = v` round-trip, `ctx.getRoute({})` callable — canonical names, no `_poc*` |
</artifacts_produced>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Retarget the PoC unit test off `_poc*` onto canonical names</name>
  <files>apps/frontend/src/lib/contexts/app/appContext.poc.svelte.test.ts</files>
  <read_first>
    - apps/frontend/src/lib/contexts/app/appContext.poc.svelte.test.ts (the file being modified — it ALREADY uses canonical `ctx.darkMode`/`ctx.appType`/`ctx.getRoute` in its local slice object; confirm and assert that shape is what survives)
    - .planning/phases/103-current-handle-codemod/103-PATTERNS.md (§"appContext.poc.svelte.test.ts (test) — Wave 0 retarget")
    - .planning/phases/103-current-handle-codemod/103-VALIDATION.md (Wave 0 Requirements — retarget bullet)
  </read_first>
  <behavior>
    - The test constructs the minimal appContext slice using CANONICAL property names only: `ctx.darkMode` (readonly plain getter), `ctx.appType`/`ctx.appType = v` (get/set accessor pair over one backing `$state`), `ctx.getRoute` (callable fold). NO `_poc*` identifier appears anywhere in the test.
    - read-write round-trip: `ctx.appType = 'voter'` → `ctx.appType === 'voter'`; `ctx.appType = 'candidate'` → `=== 'candidate'`.
    - read-only reactive read: `typeof ctx.darkMode === 'boolean'`, SSR default `false`.
    - getRoute fold: `typeof ctx.getRoute === 'function'`, `ctx.getRoute({})` returns the stubbed route string.
    - Every reactive accessor is read via `ctx.x`, never destructured (CLAUDE.md contract).
  </behavior>
  <action>
    The existing PoC test's LOCAL slice object already uses canonical `get darkMode()`, `get appType()`/`set appType(v)`, `get getRoute()` (the slice was authored with canonical shapes; only the SUMMARY/scaffolding lived under `_poc*` on the real factory). Verify the test references no `_poc*` token: grep the file. If any `_poc*` reference exists in assertions or imports, rewrite it to the canonical name (`_pocDarkMode`→`darkMode`, `_pocAppType`→`appType`, `_pocGetRoute`→`getRoute`). Keep the `$app/environment` / `$app/state` / `$lib/utils/route` mocks and the `$effect.root` + `flushSync` harness exactly as-is. The intent: this test is the only unit proof of the idiom round-trip and MUST pass against the canonical names AFTER Plan B folds the real factory — so it must assert canonical names NOW (the local slice already models the post-fold shape). Do NOT rename the file in this task (the `.poc.` infix is fine; the test stays excluded from `--apply` by the codemod's `*.poc.*` exclusion). Per D-02 this is a manual-fix commit, separate from any mechanical change.
  </action>
  <verify>
    <automated>cd apps/frontend && yarn test:unit --run appContext.poc 2>&1 | tail -20; grep -c "_poc" src/lib/contexts/app/appContext.poc.svelte.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit --run appContext.poc` → 3 passed.
    - `grep -c "_poc" appContext.poc.svelte.test.ts` → `0` (zero `_poc*` references remain).
    - The three assertions (appType round-trip, darkMode plain-getter read, getRoute callable) all reference canonical names.
  </acceptance_criteria>
  <done>The PoC test asserts the canonical folded idiom (ctx.darkMode / ctx.appType / ctx.getRoute) with zero `_poc*` references, passes 3/3, and will survive Plan B's declaration fold without further edits.</done>
</task>

<task type="auto">
  <name>Task 2: Author the idempotent named-handle codemod (extend spike-009)</name>
  <files>.planning/archive/phase-103-current-handle-codemod.mjs</files>
  <read_first>
    - .planning/archive/spike-009-store-codemod.mjs (the precedent to COPY-AND-EXTEND — config block + idempotency guard lines 44-80, the dedicated open-paren-guarded `$getRoute(` pass lines 126-143, the `m[2]` context-call capture in `detectDestructureTraps` lines 155-171, the `REACTIVE_ACCESSORS` set lines 52-80, dry-run/`--apply` CLI lines 84-88 + 224-227)
    - .planning/phases/102-handle-idiom-spike/102-DECISION-RECORD.md (§A/§B = the allowlist; §"Codemod scope = named-handle allowlist" = the false-positive exclusions Tween/this/password/event/row/updated; E1-E4 = the retained-exception handles NOT to codemod)
    - .planning/phases/103-current-handle-codemod/103-RESEARCH.md (§"Codemod passes (extend spike-009)" = the 4-pass spec; LM-1 glob, LM-2 dual-source disambiguation, LM-7 producer-internal userPreferences.update)
    - .planning/phases/103-current-handle-codemod/103-PATTERNS.md (§"phase-103-current-handle-codemod.mjs" = the four structural pieces to copy + the new Pass 2/Pass 3 forms)
  </read_first>
  <action>
    Copy `spike-009-store-codemod.mjs` to `.planning/archive/phase-103-current-handle-codemod.mjs` (D-03 archive path; Claude's-discretion path per CONTEXT.md — use this name) and extend it into a 4-pass named-handle codemod. Replace the `STORE_REWRITES` config with two const arrays: `READ_ONLY` and `READ_WRITE` (exact membership in the artifacts table above — sourced from 102-DECISION-RECORD §A/§B; E1-E4 popupQueue/candidateUserData/reactiveDataRoot.instance/topBarSettings are NEVER in the allowlist). PASS 1 (read rewrite): for every handle H in READ_ONLY ∪ READ_WRITE, rewrite the `.current` suffix form `\b(<H>)\.current\b` → `$1` (idempotent: bare `<H>` does not re-match `.current`); plus the dedicated getRoute call-form pass `ctx.getRoute.current(` → `ctx.getRoute(` using the `(?=\()` lookahead (mirror spike-009 lines 134-143). CRITICAL for A11: rewrite `reactiveDataRoot.current` → `reactiveDataRoot` but NEVER touch `reactiveDataRoot.instance` (the `\.current\b` suffix guard naturally self-excludes `.instance` — confirm via the regex). PASS 2 (write rewrite, 5 consumer sites only): `\b(<H>)\.set\(([^)]*)\)` → `$1 = $2` for `appType`/`sendTrackingEvent`/`openFeedbackModal`; EXCLUDE `appContext.svelte.ts` from the write pass entirely (LM-7: the 3 `userPreferences.update` sites there are producer-internal on the local PersistedState handle — there are ZERO external `userPreferences` writes). PASS 3 (destructure rewrite — NEW, not in spike-009): match `const\s*\{([\s\S]*?)\}\s*=\s*(get\w+Context)\s*\(` and, for the FOLDED reactive handles only, rewrite `const { x, ...rest } = getAppContext()` → `const ctx = getAppContext(); const x = $derived(ctx.x); const { ...rest } = ctx;`. KEY on `m[2]` the context-call name and ONLY rewrite when `m[2] ∈ {getAppContext, getVoterContext, getCandidateContext, getAdminContext}` — EXCLUDE `getComponentContext` (LM-2: its darkMode/locale/locales are already plain getters; rewriting them is the regression). KEEP `getRoute`/`t`/stable stores destructured (do not move them to `$derived`). Guard against double-introducing `const ctx`. PASS 4 (destructure-trap AUDIT, warn-only — reuse spike-009 `detectDestructureTraps`): EXTEND `REACTIVE_ACCESSORS` with the 15 newly-folded reactive handles (exact list in the artifacts table; getRoute/t stay OFF). Set the glob default `FILES_GLOB` to include BOTH `.svelte` AND `lib/contexts/**/*.svelte.ts` (LM-1 — the ~35 cross-context producer reads), EXCLUDING `*.test.ts` and `*.poc.*` (filter the globbed file list). Keep dry-run default + `--apply` verbatim. Do NOT run `--apply` in this task — authoring + dry-run only.
  </action>
  <verify>
    <automated>node .planning/archive/phase-103-current-handle-codemod.mjs 2>&1 | tail -30 && echo "---ALLOWLIST---" && grep -E "const READ_ONLY|const READ_WRITE|getComponentContext|reactiveDataRoot" .planning/archive/phase-103-current-handle-codemod.mjs</automated>
  </verify>
  <acceptance_criteria>
    - `node .planning/archive/phase-103-current-handle-codemod.mjs` (dry-run) exits 0 and prints a per-handle hit summary covering the migrated handles; the run reports the cross-context `lib/contexts/**/*.svelte.ts` files among files-to-change (LM-1 glob verified).
    - `READ_ONLY` + `READ_WRITE` arrays match the 102-DECISION-RECORD allowlist exactly (11 read-only + 6 read-write); no E1-E4 handle name appears in either array.
    - The script EXCLUDES `getComponentContext` from the Pass-3 destructure rewrite (LM-2) and EXCLUDES `appContext.svelte.ts` from the Pass-2 write rewrite (LM-7); dry-run output shows zero `*.test.ts`/`*.poc.*` files in the change set.
    - `REACTIVE_ACCESSORS` contains all 15 newly-folded handles; `getRoute` and `t` are absent from it.
  </acceptance_criteria>
  <done>The codemod script exists at `.planning/archive/phase-103-current-handle-codemod.mjs`, dry-runs green over the LM-1 glob (`.svelte` + `lib/contexts/**/*.svelte.ts`, excluding tests), implements all 4 passes against the named-handle allowlist, excludes the E1-E4 retained exceptions + the LM-2/LM-7 false positives, and extends `REACTIVE_ACCESSORS` for the Pass-4 audit. It is NOT yet applied (Plan B runs `--apply`).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | This plan authors a `.planning/` script and edits one test file. No runtime trust boundary is crossed, created, or modified; no auth logic, data exposure, network, or input-handling code changes. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-103A-01 | Tampering | codemod script correctness (wrong allowlist → wrong-handle rewrite in Plan B) | mitigate | Allowlist sourced verbatim from the approved 102-DECISION-RECORD; acceptance criteria assert exact membership; dry-run default prevents writes; E1-E4 + LM-2/LM-7 false-positive exclusions are checked. |
| T-103A-02 | Tampering | npm/pip/cargo installs | accept | NONE — the codemod is pure-Node dependency-free (no install step); no package-manager activity; no `## Package Legitimacy Audit` needed. |

**No-new-attack-surface assessment:** This is a mechanical refactor-tooling phase. No new high-severity threat is introduced. The only security-adjacent risk in the milestone is a reactivity regression on auth-gated surfaces (the AdminNav-class destructure trap, LM-3) — that risk materializes in Plan B's apply, mitigated by the Pass-3 destructure rewrite + Pass-4 audit + the K3 E2E auth-nav pass; this plan's contribution is authoring those guards correctly.
</threat_model>

<verification>
- `yarn workspace @openvaa/frontend test:unit --run appContext.poc` → 3 passed, zero `_poc*` references in the test.
- `node .planning/archive/phase-103-current-handle-codemod.mjs` (dry-run) → exits 0, per-handle summary, LM-1 cross-context files present in change set, tests excluded.
- `yarn build --filter=@openvaa/frontend` → exit 0 (the test retarget introduces no build break; no production declaration changed). [LM-4: build is the binding gate, NOT `check` exit 0.]
- No production handle declaration changed in this plan — `git diff --stat` shows only the test file + the `.planning/` script.
</verification>

<success_criteria>
- HANDLE-02 (partial): the PoC test asserts the canonical folded idiom that Plan B's declaration conform must satisfy.
- HANDLE-03 (partial): the idempotent codemod script exists, dry-runs green, implements the allowlist + 4 passes + LM-1 glob + LM-2/LM-7 exclusions, with extended `REACTIVE_ACCESSORS`.
- Build green at the commit boundary (`yarn build --filter=@openvaa/frontend` exit 0); production tree behavior unchanged.
- Two commits (D-02 manual-fix shape): one for the PoC-test retarget, one for the codemod script authoring.
</success_criteria>

<output>
Create `.planning/phases/103-current-handle-codemod/103-A-SUMMARY.md` when done.
</output>
