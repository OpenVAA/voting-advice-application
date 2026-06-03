# Phase 94: Final E2E suite polish — de-planning + reformat + README triage - Research

**Researched:** 2026-06-03
**Domain:** Mechanical source hygiene — comment/title de-archaeologization + 4 code-review follow-ups across the Playwright E2E suite + dev-seed templates
**Confidence:** HIGH (all findings verified by direct grep/read of the working tree; no external/library dependencies; no training-data reliance)

## Summary

Phase 94 is a **mechanical, parallelizable cleanup phase** with no architecture changes. Two workstreams: (A) four scoped code-review follow-ups (WR-01..04) from Phase 93's REVIEW.md, each with an exact file+line and a precise target; (B) a de-archaeologization sweep that reformats `test()`/`describe()`/`test.step()` titles to plain-language behaviour descriptions, strips planning/phase/decision-tag references from comments while preserving functional rationale, collapses manually wrapped comment prose, and triages the suite READMEs.

The residual-token inventory (this document's most important output) confirms the ROADMAP's "~152 files" estimate: **123 files in `tests/`** (excluding untracked artifacts) and **33 files in `packages/dev-seed/src/templates`** carry planning tokens — 156 total. The work splits cleanly along directory boundaries into parallelizable buckets. No test title is used as a cross-file `--grep` anchor, so reformatting titles is safe. The baseline gates are all currently satisfiable: `yarn typecheck:tests` exits 0, `npx playwright test --list` reports **84 tests in 72 files** (works without the dev server), and the `mega`/`baseV1` gate tokens are **already at zero** (cleaned in Phase 93).

**Two scope ambiguities must be resolved by the planner/operator before execution** (see Open Questions): (1) the verification gate says "grep empty in `packages/dev-seed/src`" but the scope statement says "`packages/dev-seed/src/templates` *only*" — the wider tree has ~42 additional files of `D-XX`/`Phase NN` docstrings outside `templates/`; (2) `tests/scripts/diff-playwright-reports.ts` lives inside `tests/` and carries 107 archaeology tokens, but it is a *functional* determinism/parity artifact whose entire purpose is project history — gutting it to satisfy a literal `tests/`-wide grep would destroy a working tool.

**Primary recommendation:** Carve into ~7 parallel waves by directory (perm-setup, perm-specs, fixtures-voter, fixtures-candidate, journey-specs+utils, dev-seed-templates, READMEs), plus one small sequential wave for WR-01..04. Lock the two scope ambiguities at planning time. Use the title-reformat pattern table below. Treat the gate grep pattern as `Phase|Plan|D-[0-9]|FLAG-|TIR|baseV1|mega` with documented carve-outs for functional string literals (`test-e2e-base-`, `e2e/base`, `e2e-perm-*`, `test-perm-*`, `INFO_QUESTION_ANSWERS` keys) and for `diff-playwright-reports.ts`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Title reformat (`test`/`describe`/`test.step`) | Test specs (`tests/tests/specs/`) | — | Titles are authored in spec files; flatten through Playwright's `--list` |
| Comment de-archaeologization | All `tests/tests/**` + `dev-seed/src/templates/**` | — | Pure source-comment edits; no runtime effect |
| Playwright project graph (WR-02) | `tests/playwright.config.ts` | perm setup/teardown/spec files | Project dependency wiring is config-tier; removing projects requires repointing the downstream `dependencies` array |
| Teardown-prefix guard (WR-03) | `tests/tests/setup/shared/setupFromTemplate.ts` | — | Test-infra seed/teardown plumbing |
| Default-answer data model (WR-04) | `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` | — | Seed-template helper logic |
| README triage | `tests/README.md`, `tests/tests/helpers/README.md` (+ 2 spec READMEs) | — | Documentation artifacts |

## Standard Stack

No new libraries. This phase edits existing source only. Relevant existing tooling:

| Tool | Version | Purpose | Role in Phase 94 |
|------|---------|---------|------------------|
| Playwright | (repo-pinned) | E2E runner | `--list` is the "no dropped specs" gate; titles flatten through it |
| Vitest | (repo-pinned) | dev-seed unit tests | `buildMinimal.test.ts` / `base.test.ts` guard WR-04 |
| TypeScript `tsc` | (repo-pinned) | `yarn typecheck:tests` gate | `tsc -p tests/tsconfig.json --noEmit` |
| ESLint (flat config) | (repo-pinned) | lint gate | `lint:check` runs `eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests` |

**Verification commands (verified to work at baseline):**
```bash
yarn typecheck:tests                          # exit 0 confirmed  [VERIFIED: ran in session]
cd tests && npx playwright test --list        # "Total: 84 tests in 72 files", exit 0, NO dev server needed  [VERIFIED: ran in session]
```

## Package Legitimacy Audit

Not applicable — **this phase installs zero external packages.** All work is source edits to existing files. No registry verification needed.

## Architecture Patterns

This is not an architecture phase. The only structural artifact touched is the Playwright project graph (WR-02), documented precisely in **WR-02 Playwright Project Graph** below.

### Anti-Patterns to Avoid
- **Blind `sed` across the gate token list.** Functional string literals contain matchable substrings (`e2e/base`, `test-e2e-base-`, `test-qu-info-*`, `e2e-perm-*`). A regex replace on `D-[0-9]` or `Phase` that touches strings would corrupt seed prefixes and break teardown isolation. See **Common Pitfalls** + **Risks/Landmines**.
- **Deleting `// reason:` rationale.** 51 `// reason:` blocks exist (Phase 70 convention). These explain *current intent* and MUST be kept — only their embedded phase/plan citations should be removed, not the rationale itself.
- **Over-cleaning `diff-playwright-reports.ts`.** Its archaeology *is* its function. See Open Question #2.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| "No dropped specs" verification | Custom test counter | `npx playwright test --list` + compare `Total:` line to baseline | Authoritative; flattens describe+test+step; works without dev server |
| Residual-token detection | Per-file manual scan | The gate grep `Phase\|Plan\|D-[0-9]\|FLAG-\|TIR\|baseV1\|mega` with carve-outs | Already the ROADMAP gate; reproducible |
| WR-04 median-choice picking | New util | Mirror the categorical branch already in `buildMinimal.ts:173-177` | Pattern exists in the same function |

## Residual-Token Inventory

**Gate pattern (from ROADMAP):** `Phase|Plan|D-[0-9]|FLAG-|TIR|baseV1|mega`
**Scope:** `tests/` (excluding `node_modules`, `playwright-report*`, `playwright-results*`, untracked `tests/.planning`, `tests/playwright/`) + `packages/dev-seed/src/templates`.

> **Pre-cleaned tokens:** `mega` and `baseV1` already return **0 matches** across the entire scope `[VERIFIED: grep, session]` — Phase 93 renamed `voter-mega-journey`→`voter-journey` and `baseV1`→`e2e/base`. These two gate tokens are satisfied before Phase 94 starts; the live archaeology is `Phase`, `Plan`, `D-[0-9]`, `TIR`, plus secondary markers (`A11Y-0`, `QSPEC`, `SETTINGS-0`, `LAYOUT-0`, `E2E-0`, `CLEAN-0`, `DETERM`, `CONF-0`, `PERM-L10N`, `refactor-doc:NNN`, `NEW/MOVE`, `MOVED`, `Risk #N`).

### Per-directory wave buckets (file counts) `[VERIFIED: grep, session]`

| Bucket | Directory | Files w/ tokens | Token character |
|--------|-----------|-----------------|-----------------|
| **B1 perm setup/teardown** | `tests/tests/setup/perm/` | 44 | 2-3 tokens each: docstring `— Phase NN Plan NN (TIRn:…)` headers |
| **B2 perm specs** | `tests/tests/specs/perm/` | 22 | mostly comments + a few `test()` titles (`TIR5:52-95`, `D-90-07`) |
| **B3 fixtures (candidate)** | `tests/tests/fixtures/candidate/` | 12 | docstring/inline phase citations |
| **B4 fixtures (voter)** | `tests/tests/fixtures/voter/` | 10 | docstring/inline phase citations |
| **B5 utils** | `tests/tests/utils/` | 7 | inline `// Phase NN Plan NN (…)` comments (testIds=16, voterNavigation=10, candidateJourneyConstants=9) |
| **B6 helpers** | `tests/tests/helpers/` | 6 | docstrings citing `Phase 86.1/86.2 RESEARCH §…`; **helpers/README.md** |
| **B7 fixtures (shared)** | `tests/tests/fixtures/shared/` | 4 | docstring citations |
| **B8 setup (shared)** | `tests/tests/setup/shared/` | 4 | `setupFromTemplate.ts`(7), `base.teardown.ts`(4), `auth.setup.ts`(4), `base.setup.ts`(3) |
| **B9 journey specs** | `tests/tests/specs/{voter,candidate}/` | 5 | **HIGH title density** — `test.step()` titles + heavy docstrings; voter-journey.spec=37, candidate-journey.spec=13 |
| **B10 a11y/visual/perf specs** | `tests/tests/specs/{a11y,visual,perf}/` | 3 | a11y=13 (`A11Y-04` title), visual=4, perf=2 |
| **B11 setup (candidate)** | `tests/tests/setup/candidate/` | 2 | docstring citations |
| **B12 root tests/** | `tests/seed-test-data.ts`(1), `tests/README.md`(10), `tests/vitest.config.ts`(1) | 3 | README archaeology + 1-token configs |
| **B13 dev-seed templates** | `packages/dev-seed/src/templates/` | 33 | `e2e/perm/*`=23, `e2e/base.ts`+`defaults/*`+`_helpers/*`+`default.ts`+`index.ts`=10 |
| **(scope flag)** | `tests/scripts/diff-playwright-reports.ts` | 1 | **107 tokens — functional artifact; see Open Q#2** |
| **(scope flag)** | spec READMEs: `voter-journey.README.md`(79), `candidate-journey.README.md`(11) | 2 | **Not named in ROADMAP scope; see Open Q#3** |

**Tests/ total (tracked source + md):** 123 files. **dev-seed/src/templates total:** 33 files. **Combined:** 156 (≈ ROADMAP "~152"). `[VERIFIED: grep, session]`

### Token category split (where the tokens live)

| Category | Where | Action | Notes |
|----------|-------|--------|-------|
| `test()` / `describe()` / `test.step()` **titles** | journey specs (B9), a11y (`A11Y-04`), perm-localisation (`TIR5:52-95`), candidate-journey step `TIR6:16-22` | **Reformat to plain language** | See Title-Reformat Patterns |
| **Comments** (block docstrings + inline) | every bucket | **Remove if history; keep+de-cite if rationale** | All `D-[0-9]` matches in source are in comments — none functional `[VERIFIED]` |
| **`// reason:` blocks** | 51 instances across tests | **Keep rationale, strip phase citation** | Phase 70 convention; functional intent |
| **Functional string literals** | `e2e/base`, `test-e2e-base-`, `e2e-perm-*`, `test-perm-*`, `INFO_QUESTION_ANSWERS` `test-qu-info-*` keys (80 files) | **DO NOT TOUCH** | Don't match the gate tokens directly, but a careless edit could break them |
| **README prose** | `tests/README.md`, `helpers/README.md` (+2 spec READMEs) | **Rewrite / triage** | See README State |

## WR-01..04 Exact Locations

### WR-01 — Delete vacuously-skipped husk
- **File:** `packages/dev-seed/tests/templates/variant-app-settings.test.ts` (9687 bytes, git-tracked) `[VERIFIED]`
- **Current state:** All 3 `describe.skip` blocks; real imports replaced with no-op stubs (`const mergeSettings = (..._args) => ({})`, `E2E_BASE_APP_SETTINGS = {}`). Exercises zero production code.
- **No other references** to `variant-app-settings` anywhere in `packages/dev-seed` `[VERIFIED: grep]`.
- **Target:** Delete the file outright (`git rm`). Surviving base contract is covered by `base-app-settings.test.ts`. (Optional fallback per REVIEW: replace body with a single `it.todo(...)`, but delete is the recommended disposition.)
- **Verify:** `yarn workspace @openvaa/dev-seed test:unit` still green; vitest report no longer lists the skipped husk.

### WR-02 — Remove dead `perm-per-app-notifications` projects + rewire downstream dep
- **Skipped spec:** `tests/tests/specs/perm/perm-per-app-notifications.spec.ts:33` → `test.describe.skip('perm-per-app-notifications', …)` (documented runes-migration quarantine) `[VERIFIED]`
- **Config projects (`tests/playwright.config.ts:554-572`):** three live projects —
  - `data-setup-perm-per-app-notifications` (line 556; `dependencies: ['perm-disable-candidate-app']`, `teardown: 'data-teardown-perm-per-app-notifications'`)
  - `data-teardown-perm-per-app-notifications` (line 562)
  - `perm-per-app-notifications` (line 566; `dependencies: ['data-setup-perm-per-app-notifications']`)
- **The ONLY downstream consumer** of the skipped spec project: `data-setup-perm-missing-nominations` at **line 582** → `dependencies: ['perm-per-app-notifications']` `[VERIFIED: grep — only one match for `'perm-per-app-notifications'` as a dependency]`
- **Files referencing the name** (for full removal): `playwright.config.ts`, the spec, `setup/perm/perm-per-app-notifications.setup.ts`, `…teardown.ts`, `templates/e2e/perm/perm-per-app-notifications.ts`, `templates/index.ts` `[VERIFIED: grep]`
- **Target (default per ROADMAP = remove dead projects):**
  1. Delete the 3 config project blocks (lines 554-572).
  2. **Repoint** `data-setup-perm-missing-nominations.dependencies` from `['perm-per-app-notifications']` to `['perm-disable-candidate-app']` (the project the notif chain previously chained off). This preserves the serial perm-chain ordering (HIGH-2 app_settings-singleton invariant) without the dead link.
  3. Decide disposition of the now-orphaned spec/setup/teardown/template files + `index.ts` registration. **Recommendation:** keep the spec + template files (the tracking todo expects re-enable on runes-migration) but remove their *project wiring*; OR delete them and restore in the re-enable PR. **This is the one decision with real wiring risk — flag for the planner to lock at discuss-phase.**
- **Verify:** `npx playwright test --list` still parses (no "unknown project dependency" error); total drops by exactly the notif spec's test count (the spec is fully skipped so it contributes 0 *runnable* tests but its 2 step-titles appear in `--list`; confirm the post-edit `Total:` against the locked baseline — see Open Q#1).

### WR-03 — Explicit empty-prefix teardown guard
- **File/line:** `tests/tests/setup/shared/setupFromTemplate.ts:166` `[VERIFIED]`
- **Current code:**
  ```ts
  const teardownPrefix = prefix.length >= 2 ? prefix : 'test-e2e-base-';
  ```
  (`prefix` derived at line 158: `const prefix = template!.externalIdPrefix ?? '';`). `templateName` is in scope (used at line 150).
- **Target (REVIEW.md §WR-03 recommended form):**
  ```ts
  const teardownPrefix =
    prefix.length >= 2 ? prefix
    : templateName === 'e2e/base' ? 'test-e2e-base-'
    : (() => { throw new Error(`Empty externalIdPrefix for '${templateName}' has no teardown-prefix fallback`); })();
  ```
- **Verify:** `e2e/base` setup still teardown-prefixes `test-e2e-base-`; a synthetic empty-prefix non-base template throws loudly. Full `test:e2e` still green (no behaviour change for the only current empty-prefix template).

### WR-04 — Data-driven ordinal default answer
- **File/lines:** `packages/dev-seed/src/templates/_helpers/buildMinimal.ts:163-167` (the ordinal branch) `[VERIFIED]`
- **Pattern to mirror — the categorical branch already data-driven (lines 171-177):**
  ```ts
  // Categorical (or any other choice-based question): pick the first
  // choice's id when available; otherwise fall back to empty string.
  const choices = question.choices as Array<{ id: string }> | undefined;
  if (Array.isArray(choices) && choices.length > 0) {
    return { value: choices[0].id };
  }
  return { value: '' };
  ```
- **Hardcoded ordinal branch to replace (lines 163-167):**
  ```ts
  if (type === 'singleChoiceOrdinal') {
    // Likert5 neutral by id-convention; helper uses LIKERT_5_EN where the
    // neutral choice is id '3'.
    return { value: '3' };
  }
  ```
- **Target (REVIEW.md §WR-04 — median-choice, fallback to '3'):**
  ```ts
  if (type === 'singleChoiceOrdinal') {
    const choices = question.choices as Array<{ id: string }> | undefined;
    if (Array.isArray(choices) && choices.length > 0) {
      return { value: choices[Math.floor((choices.length - 1) / 2)].id };
    }
    return { value: '3' };
  }
  ```
- **Verify:** `buildMinimal.test.ts` + `base.test.ts` green; the median pick for a Likert-5 (`['1','2','3','4','5']`) still yields `'3'` (index `floor(4/2)=2`), preserving current behaviour for the only ordinal shape in use.

## Title-Reformat Patterns

Sampled real titles `[VERIFIED: grep, session]`. No title is referenced as a `--grep` anchor elsewhere — the only cross-file matches for `TIR5:52-95` / the localisation title are in *comments*, not grep targets `[VERIFIED]`. Reformatting is safe.

| File:line | Before | After (suggested) |
|-----------|--------|-------------------|
| `voter-journey.spec.ts:314` | `static: home page renders + start button (MOVED 9.1.1)` | `home page renders with a start button` |
| `voter-journey.spec.ts:331` | `static: about → back button returns to home (NEW/MOVE refactor-doc:212)` | `about page back button returns to home` |
| `voter-journey.spec.ts:381` | `elections: continue disabled when no election selected (Risk #2)` | `continue is disabled until an election is selected` |
| `voter-journey.spec.ts:424` | `constituencies: only municipalities shown (Risk #7 — hierarchical CG)` | `constituency selector shows only municipalities` |
| `voter-journey.spec.ts:508` | `hero: QG-Opin-Base category intro renders image hero (Phase 89 Plan 01 — TIR4:32)` | `opinion-question category intro renders the image hero` |
| `voter-journey.spec.ts:662` | `result-card-contents (Phase 88 Plan 04 T5 — fixtures + test-qu-info-text + 4 score-gauges + election-symbol 10)` | `result card shows info text, four score gauges, and the election symbol` |
| `voter-journey.spec.ts:964` | `filters: text (Phase 88 Plan 04 T8 — polar → 2 cards Polar-Max + Polar-Min, clear)` | `text filter narrows the result list and clears` |
| `candidate-journey.spec.ts:504` | `13.5. profile: invalid URL into Link-type question surfaces invalidUrl error (TIR6:16-22)` | `profile rejects an invalid URL in a link question with an inline error` |
| `perm-localisation-positive.spec.ts:102` | `locales=[en,fi,sv]: full TIR5:52-95 walk including voter-side cross-check` | `localisation walk across en/fi/sv with voter-side cross-check` |
| `a11y-smoke.spec.ts:118` | `A11Y-04 axe smoke — ${route.name}` | `axe accessibility scan — ${route.name}` |

**Rule for executors:** keep the *behavioural meaning* and any leading semantic prefix that aids readability (e.g. `home page renders…`), strip the parenthetical archaeology (`(Phase … Plan … TIR… refactor-doc… MOVED… NEW/MOVE… Risk #…)`), strip leading numeric step labels (`9.1.1`, `13.5.`) unless they encode genuine ordering the reader needs. Functional substrings inside titles that are *test data* (e.g. `test-qu-info-text`, `Polar-Max`) describe the assertion and may be kept or plain-languaged at author discretion — they are not gate tokens.

## README State

### `tests/README.md` (10 tokens) `[VERIFIED: read, session]`
- **Current:** A genuinely good current-state suite doc — Run commands, concurrency model, project inventory tables, datasets reference, fixture taxonomy, pitfalls. **High value; rewrite-in-place, do not delete.**
- **Archaeology to strip:** `--grep "DETERM-12"` example (line 11 → use a generic grep example); "rewritten in Phase 93 Plan 04" (line 54); "Phase 93 Plan 04 D-06" (line 102); "Phase 93 Plan 04/05 D-04" (line 128); "Phase 93 Plan 02 D-01" (line 137); "Phase 93 reorganised…" (line 156); "Phase 92 Plan 04" (line 202); the entire **"Where to look next"** section (lines 208-213) which points to `.planning/phases/` "search for the relevant DETERM-* / SETTINGS-* …" and to the PASS_LOCKED/CASCADE/SKIPPED classification arrays — replace with forward-looking pointers (CLAUDE.md, dev-seed README) only.
- **Clean rewrite should cover:** suite purpose; how to run (full + per-project + opt-in env-gated projects + likert-only manual chain); concurrency/dependency model; project inventory (base/journey + perm families + opt-in); datasets reference (`e2e/base` + `e2e/perm/*` + modifiers); fixture/setup taxonomy; common pitfalls (keep the missing-nominations modal pitfall — it's functional). **Zero** mentions of Phase/Plan/D-/version history.

### `tests/tests/helpers/README.md` (5 tokens) `[VERIFIED: read, session]`
- **Current:** Explains the helpers/utils boundary, "when to add a helper" criteria, page-object boundary, and pitfall references. The *boundary guidance is genuinely useful*; the *framing* is pure archaeology ("extracted from Phase 86.1 post-fix inline patterns", "before Phase 86.3 authors 8 new tests", "cite Phase N post-fix RCA", "See 86.2-RESEARCH.md §…").
- **Recommendation: REWRITE (keep, do not delete).** It adds value as a maintainer guide. Strip every Phase/RESEARCH-doc citation; reframe "Intent", "When to add a new helper" criterion #3 (drop "lineage…Phase N post-fix RCA citation"), the Pitfall references (keep the *contracts* — `settleNetworkIdle` doesn't swallow timeouts; `iterateSelectOptions` cites the `combobox+listbox` ARIA contract; `walkVoterIteration` default `maxSteps=6` — drop the Phase 86.1 RCA framing), and delete the "Cite" section (lines 77-80).

### Out-of-named-scope spec READMEs (planner must decide — see Open Q#3)
- `tests/tests/specs/voter/voter-journey.README.md` — **79 tokens**, densest archaeology file in the suite (a refactor-doc map).
- `tests/tests/specs/candidate/candidate-journey.README.md` — 11 tokens.
- The ROADMAP scope statement names only `tests/README.md` + `helpers/README.md`. These two spec READMEs are inside `tests/` so they fall under the residual-grep gate. **Flag for the planner: either include them in the README workstream or carve them out of the gate explicitly.**

## Runtime State Inventory

This is a comment/title source-edit phase. There is no stored data, live-service config, OS-registered state, secret, or build artifact that embeds the strings being removed — the tokens are *human-readable comments and test titles*, not runtime keys.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None** — the planning tokens (`Phase`, `D-NN`, `TIR`) are comment/title text, never DB keys. The DB-key strings (`test-e2e-base-*`, `e2e-perm-*`) are functional and explicitly OUT of scope. | None |
| Live service config | **None** — no external service stores these tokens. | None |
| OS-registered state | **None.** | None |
| Secrets/env vars | **None** — `PLAYWRIGHT_VISUAL/PERF/A11Y/BANK_AUTH`, `E2E_REQUIRE_FRESH_DB`, `STORAGE_STATE`, `SUPABASE_*` env names are unchanged. | None |
| Build artifacts | **WR-01 only:** deleting `variant-app-settings.test.ts` removes it from the vitest report. No compiled/installed artifact carries it. WR-02 project removal changes `playwright test --list` output (the "no dropped specs" baseline). | Re-capture the `--list` baseline after WR-02 (Open Q#1). |

**The canonical question — after every file is updated, what runtime systems still cache the old string?** Answer: **none.** Titles/comments have no runtime effect. The only runtime-visible changes are (a) the Playwright project graph (WR-02) and (b) the vitest test list (WR-01) — both verified by the existing `--list` / `test:unit` gates.

## Common Pitfalls

### Pitfall 1: Blind regex replace corrupts functional seed prefixes
**What goes wrong:** A `sed`/global-replace targeting `D-[0-9]`, `Phase`, or `e2e` substrings touches functional string literals — `e2e/base`, `test-e2e-base-`, `e2e-perm-*`, `test-perm-*`, `INFO_QUESTION_ANSWERS` `test-qu-info-*` keys — and breaks teardown isolation or template resolution.
**Why it happens:** 80 files contain these functional literals `[VERIFIED]`; they share substrings with archaeology tokens.
**How to avoid:** Edit comments and titles by hand or with comment-scoped tooling; never run a token replace across whole lines. The gate pattern `Phase|Plan|D-[0-9]|FLAG-|TIR|baseV1|mega` does **not** match `e2e/base` or `test-e2e-base-` directly — but `Phase`-adjacent edits can still clobber a nearby literal on the same line.
**Warning signs:** `test:e2e` perm-chain failures with "fresh DB precondition" or cross-dataset wipe; `--template` resolution errors.

### Pitfall 2: Deleting functional `// reason:` rationale
**What goes wrong:** Treating a `// reason:` block as archaeology and deleting it removes the *current* justification for an accepted lint/framework deviation.
**Why it happens:** 51 `// reason:` blocks exist `[VERIFIED]`, many with a trailing Phase citation.
**How to avoid:** Keep the rationale sentence; strip only the `(Phase NN Plan NN …)` citation tail. Same for `// svelte-warning: accepted —` blocks (none currently carry tokens `[VERIFIED]`, but the rule stands).

### Pitfall 3: WR-02 breaks the `--list` parse via dangling dependency
**What goes wrong:** Removing the 3 notif projects without repointing `data-setup-perm-missing-nominations.dependencies` leaves a dangling `'perm-per-app-notifications'` reference → Playwright config error.
**How to avoid:** Repoint to `['perm-disable-candidate-app']` in the same edit (WR-02 step 2 above). Run `npx playwright test --list` immediately after.
**Warning signs:** `--list` exits non-zero with "project … has unknown dependency".

### Pitfall 4: README "no dropped specs" target drifts after WR-02
**What goes wrong:** The 84/72 baseline includes the skipped notif spec's step-titles in `--list`. After WR-02 removes the 3 projects, the count changes — comparing against the stale 84/72 fails the gate.
**How to avoid:** Re-capture the post-WR-02 `--list` baseline as the new "no dropped specs" target (Open Q#1). The gate is "no *unintended* drops", not "exactly 84".

## Code Examples

The exact before/after code for WR-03 and WR-04 is in **WR-01..04 Exact Locations** above (quoted from the live tree). No external code patterns needed.

## State of the Art

Not applicable — no library/framework currency question. This is a one-time hygiene pass over the repo's own source.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The ROADMAP "default to removing the dead projects" directive for WR-02 means **remove project wiring + repoint downstream dep**, keeping the spec/template files for the future re-enable PR | WR-02 | If operator wants full file deletion instead, the orphaned spec/template/setup/teardown + `index.ts` registration also need removal — larger blast radius |
| A2 | No `test()`/`describe()` title is consumed as a `--grep` anchor in CI or scripts | Title-Reformat | If a CI job greps a title, reformatting silently de-selects that test. Mitigated: searched repo, only comment matches found `[VERIFIED]` — but did not inspect CI YAML |
| A3 | `diff-playwright-reports.ts` is not run in any active CI gate (no `package.json`/CI reference found) | Open Q#2 | If it IS wired into a gate, "cleaning" it would break the gate |
| A4 | The 2 spec READMEs (`voter-journey.README.md`, `candidate-journey.README.md`) are intended to fall under this phase's README workstream | README State / Open Q#3 | If excluded, the `tests/`-wide residual grep stays non-empty and the gate fails |
| A5 | WR-04 median formula `floor((len-1)/2)` preserves current Likert-5 behaviour (yields id `'3'`) | WR-04 | Verified by arithmetic; if `choices` ids aren't `'1'..'5'` the median-by-index still picks the middle id, which is the intended generalization |

## Open Questions

1. **Post-WR-02 `--list` baseline — what is the binding "no dropped specs" number?**
   - What we know: current baseline is **84 tests / 72 files** `[VERIFIED]`. WR-02 removes 3 projects whose spec is fully `describe.skip`ped (contributes step-titles to `--list` but 0 runnable tests).
   - What's unclear: the exact post-WR-02 `Total:` line. The ROADMAP cites "84 tests/72 files" as the gate, but that's the *pre*-WR-02 number.
   - Recommendation: have Wave 0 re-capture `npx playwright test --list` after WR-02 lands and pin THAT as the gate baseline (store alongside `93-PLAYWRIGHT-LIST-BASELINE.txt`). The gate is "no *unintended* drop", reconciled against WR-02's known removal.

2. **`tests/scripts/diff-playwright-reports.ts` (107 tokens) — clean, carve-out, or leave?**
   - What we know: it lives in `tests/` (so the literal `tests/`-wide grep would flag it), but it is a *functional* parity/determinism tool whose PASS_LOCKED/CASCADE/DATA_RACE/SKIPPED arrays + anchor SHAs + Phase narrative are its working content. No active CI reference found `[VERIFIED: grep]`.
   - What's unclear: whether the ROADMAP author intends the de-planning sweep to touch it. Gutting it would destroy a working artifact; leaving it makes the `tests/`-wide grep non-empty.
   - Recommendation: **carve it out of the residual-grep gate explicitly** (the gate becomes "empty in `tests/` excluding `tests/scripts/diff-playwright-reports.ts`"), OR scope-confirm at discuss-phase that this file is out of scope. Do NOT clean it blindly. **Lock at planning time.**

3. **Scope boundary: `packages/dev-seed/src/templates` only vs whole `packages/dev-seed/src`?**
   - What we know: the **scope statement** says "`packages/dev-seed/src/templates` *only* (~152 files)"; the **verification gate** says "grep empty in `packages/dev-seed/src`". The wider `packages/dev-seed/src` tree has **75 files** with gate-pattern matches vs **33** in `templates/` `[VERIFIED]` — i.e. ~42 additional files (generators, emitters, writer, pipeline, CLI) carry `D-XX`/`Phase 56/58` *design docstrings* (e.g. `writer.ts` D-11 write-sequence doc).
   - What's unclear: whether the gate's "`packages/dev-seed/src`" is a typo for "`…/src/templates`", or an intentional wider sweep.
   - Recommendation: **lock to `packages/dev-seed/src/templates` only** (matches the scope statement + the "~152 files" count) and **scope the verification grep to `packages/dev-seed/src/templates`** accordingly — OR expand the phase to the whole `src/` tree if the operator wants it (adds ~42 files, ~1 more wave). The two statements are contradictory; the planner/operator must pick one. **Lock at planning time.**

4. **WR-02 file disposition** (see A1): keep orphaned spec/template files (recommended) or delete them now? Lock at discuss-phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `tsc` (`yarn typecheck:tests`) | typecheck gate | ✓ (exit 0 confirmed) | repo-pinned | — |
| Playwright (`--list`) | "no dropped specs" gate | ✓ (works without dev server) | repo-pinned | — |
| Vitest (`yarn workspace @openvaa/dev-seed test:unit`) | WR-01/WR-04 verification | ✓ (assumed; standard repo tooling) | repo-pinned | — |
| Supabase local + `yarn dev` | full `yarn test:e2e` green gate | **not verified running this session** | — | `--list` + `typecheck` + per-package vitest cover most verification; full `test:e2e` is the final gate and requires the operator's running stack |

**Missing dependencies with no fallback:** none for the bulk of the work (`--list` + `typecheck` + vitest run without the stack).
**Missing dependencies with fallback:** full `yarn test:e2e` green requires `yarn dev` + local Supabase running — the operator runs this as the final phase gate; it is not needed per-wave.

## Validation Architecture

> `.planning/config.json` does not set `workflow.nyquist_validation: false` — treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (E2E) + Vitest (dev-seed unit) + `tsc` (typecheck) |
| Config file | `tests/playwright.config.ts`, `tests/vitest.config.ts`, `tests/tsconfig.json` |
| Quick run command | `yarn typecheck:tests` (exit 0) + `cd tests && npx playwright test --list` |
| Full suite command | `yarn test:e2e` (requires `yarn dev`) + `yarn workspace @openvaa/dev-seed test:unit` |

### Phase Requirements → Test Map
| Req | Behavior | Test Type | Automated Command | File Exists? |
|-----|----------|-----------|-------------------|-------------|
| WR-01 | husk deleted, unit suite green | unit | `yarn workspace @openvaa/dev-seed test:unit` | ✅ |
| WR-02 | project graph parses, no dangling dep, count reconciled | smoke | `cd tests && npx playwright test --list` | ✅ |
| WR-03 | empty-prefix non-base throws; `e2e/base` still maps | e2e/unit | `yarn test:e2e` (base + perm chains green) | ✅ |
| WR-04 | median ordinal default; Likert-5 still `'3'` | unit | `yarn workspace @openvaa/dev-seed test:unit` (`buildMinimal.test.ts`, `base.test.ts`) | ✅ |
| de-planning | residual-grep empty (with carve-outs); titles plain | grep + list | gate grep + `--list` count reconciled | ✅ |
| typecheck | no type regressions from edits | typecheck | `yarn typecheck:tests` | ✅ |

### Sampling Rate
- **Per task commit:** `yarn typecheck:tests` (fast, exit 0).
- **Per wave merge:** scoped residual grep on the wave's directory; `--list` parses.
- **Phase gate:** `yarn typecheck:tests` exit 0 · `npx playwright test --list` count reconciled vs post-WR-02 baseline · residual grep empty (with locked carve-outs) · full `yarn test:e2e` green · `dev-seed test:unit` green.

### Wave 0 Gaps
- [ ] Re-capture `npx playwright test --list` AFTER WR-02 → pin new "no dropped specs" baseline (Open Q#1).
- [ ] Lock the two scope ambiguities (Open Q#2, Q#3) before any sweep wave starts.
- [ ] No new test infrastructure needed — all gates already exist.

## Project Constraints (from CLAUDE.md)

- **Likert-only canonical chain** is the manual reseed path (`yarn db:reset && yarn db:seed --template e2e/base --likert-only && yarn dev:clean`) — README rewrite must preserve this guidance (it's functional, not archaeology). Do not "simplify" the `--likert-only` caveat away.
- **`db:seed --template e2e/base`** is the canonical E2E dataset — the functional template name `e2e/base` is OUT of scope for token removal.
- **Commits in this repo must use** `git -c core.hooksPath=/dev/null` (from MEMORY — `project_gsd_repo_hook_workaround.md`).
- **Use TypeScript strictly; avoid `any`** — WR-03's IIFE-throw and WR-04's `choices` cast follow the existing `as Array<{ id: string }> | undefined` pattern already in `buildMinimal.ts`.
- **`// reason:` and `// svelte-warning: accepted —`** comment conventions are functional — preserve the rationale, de-cite the phase.
- **Worktree-commit + state-corruption GSD gotchas** (MEMORY `project_gsd_execute_phase_quirks.md`) — relevant to the orchestrator, not the edits.

## Security Domain

Not applicable in the ASVS sense — this phase makes no authentication, session, access-control, input-validation, or cryptography changes. It edits comments, test titles, one Playwright config dependency array, one teardown-prefix guard (which makes the existing isolation *stricter* by failing loudly), one seed-default helper, and READMEs. WR-03 is mildly security-positive: it converts a silent cross-dataset-wipe foot-gun into a loud throw. No new threat surface introduced.

## Sources

### Primary (HIGH confidence)
- Working tree — direct `grep`/`Read`/`playwright --list`/`yarn typecheck:tests` this session (all `[VERIFIED]` claims)
- `.planning/phases/93-…/93-REVIEW.md` — WR-01..04 + IN-01..03 definitions (verbatim file/line/fix)
- `.planning/ROADMAP.md` lines 517-585 — Phase 93 + Phase 94 scope, constraints, gates
- `tests/playwright.config.ts:540-620` — perm-chain project graph (WR-02)
- `tests/tests/setup/shared/setupFromTemplate.ts:150-194` — WR-03
- `packages/dev-seed/src/templates/_helpers/buildMinimal.ts:150-178` — WR-04
- `tests/README.md`, `tests/tests/helpers/README.md` — README state

### Secondary / Tertiary
- None — no web/Context7 lookups needed (no external dependencies).

## Metadata

**Confidence breakdown:**
- Residual-token inventory: HIGH — direct grep with counts per directory and per file.
- WR-01..04 locations: HIGH — exact file/line read and quoted from live tree.
- WR-02 wiring: HIGH — full dependency graph traced; single downstream consumer identified.
- Title-reformat patterns: HIGH — sampled from live titles; anchor-safety verified.
- Scope ambiguities: HIGH that they exist (the two statements literally contradict); the *resolution* is an operator decision (Open Q#2, Q#3).

**Research date:** 2026-06-03
**Valid until:** ~30 days (stable — repo-internal hygiene; only invalidated by further edits to `tests/` or `dev-seed/src/templates`).
