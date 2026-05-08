---
phase: 65-svelte-5-audit-sweeps
plan: 02
subsystem: ui
tags: [svelte5, key, context-destructure, claude-md, audit, frontend, hygiene, runes]

# Dependency graph
requires:
  - phase: 61-voter-app-question-flow
    provides: "Phase 61-03 root-cause analysis (61-03-DIAGNOSIS.md) for the destructure-staleness bug class"
  - phase: 62-voter-results-refactor
    provides: "Phase 62 D-14 scope-tuple `${activeElectionId}:${activeEntityType}` filter-state-reset rationale"
  - phase: 64-voter-results-reactivity-completion
    provides: "Phase 64 removal of `{#key item}` defensive remount inside `{#each}` (EntityList.svelte) — no Pattern A residue to find"
  - phase: 65-svelte-5-audit-sweeps Plan 01
    provides: "bind:* audit baseline; the {#key} + destructure audits land on the same surface"
provides:
  - "2 retained `{#key}` blocks carry inline `{#key}: keep — …` justification (questions/[questionId]/+page.svelte:243; (voters)/results/+layout.svelte:372)"
  - "1 Pattern B keyed `{#each}` conversion (candidate profile editable infoQuestions block) with annotation"
  - "6 reactive-accessor destructure rewrites across candidate routes (4 mixed-site splits + 2 preventive single-name splits)"
  - "CLAUDE.md `### Context Destructuring Rule (Svelte 5)` subsection (anchored on Code Example 7 from RESEARCH; 22-name reactive-accessor catalog; canonical pattern citation; diagnostic origin citation; $store auto-subscribe caveat)"
  - "CLAUDE.md line 293 broken `docs/code-review-checklist.md` link fixed to `.agents/code-review-checklist.md` + 'check that your code against' typo cleaned to 'check your code against'"
affects:
  - 65-03-verification-and-smoke (provides the rule + edits the smoke must validate)
  - future Svelte 5 hygiene phases (the CLAUDE.md rule is now the canonical reference for destructure decisions)
  - any future destructure violations discovered (the catalog doubles as a lint-rule blueprint)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Context-destructure split shape: `const ctx = getX(); const { stable } = ctx; const reactive = $derived(ctx.X);` (canonical at (voters)/results/+layout.svelte:61-79)"
    - "Inline `<!-- {#key}: keep — reason -->` annotation comment on retained `{#key}` blocks (extends the Plan 65-01 inline-justification convention to control-flow constructs)"
    - "Inline `<!-- {#each}: keyed — reason -->` annotation comment on positional-reuse-hazard {#each} blocks converted to keyed each"

key-files:
  created:
    - .planning/phases/65-svelte-5-audit-sweeps/65-02-SUMMARY.md
  modified:
    - CLAUDE.md
    - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte
    - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
    - apps/frontend/src/routes/candidate/login/+page.svelte
    - apps/frontend/src/routes/candidate/preregister/+page.svelte
    - apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte
    - apps/frontend/src/routes/candidate/preregister/(authenticated)/constituencies/+page.svelte
    - apps/frontend/src/routes/candidate/register/password/+page.svelte

key-decisions:
  - "Preventive (not symptom-driven) destructure rewrite per RESEARCH Open Question 2 — every reactive-accessor name found in a destructure form was rewritten, even where the symptom was latent. Cost is small; latent-bug risk meaningfully lowered."
  - "Pattern B keyed each conversion limited to 1 site — only the candidate profile editable infoQuestions block at line 276. The locked variant at :214 renders display-only; the {#each candCtx.questionBlocks ...} blocks at questions/+page.svelte render Buttons + display-mode OpinionQuestionInput (no per-item form state). Pattern C (positional reuse correct) is the dominant idiom in tree (~30 sites)."
  - "isAuthenticated treated as reactive (it is — `$derived(!!page.data.session)` per authContext.svelte.ts:25). The two in-tree destructures inside contexts/{candidate,admin}/Context.svelte.ts are dead code (unused locally; `...authContext` spread re-captures the value at construction time) — flagged as deferred but not fixed. Out of scope for the consumer-side audit."
  - "CLAUDE.md catalog includes isAuthenticated and isPreregistered (not in RESEARCH §Code Example 7 draft) — both are reactive accessors that surfaced in the audit and need to be in the rule for consumer guidance."

patterns-established:
  - "Pattern: Mixed-site split (RESEARCH Code Example 6 shape extended). `const ctx = getX()` first; destructure stable refs; alias reactive accessors via `$derived(ctx.X)`. Mirror at apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:61-79 across the codebase."
  - "Pattern: Reactive accessor inline-pass-through (`elections={candCtx.preregistrationElections}`) — when a reactive value is consumed once at template attribute, prefer direct `ctx.X` over destructure-then-reference; cleaner reactive edge."
  - "Pattern: `{#key}: keep — reason` HTML comment within 1 line above the directive. Verifier helper: `grep -B1 '{#key ' file | grep -E '<!--.*\\{#key\\}: keep'`."

requirements-completed: [SVELTE5-02, SVELTE5-03]

# Metrics
duration: 25min
completed: 2026-04-29
---

# Phase 65 Plan 02: {#key} + Context-Destructure Audit + CLAUDE.md Rule Summary

**Closed SVELTE5-02 (2 `{#key}` annotations + 1 Pattern B keyed each conversion) and SVELTE5-03 (6 reactive-accessor destructure rewrites + new CLAUDE.md rule subsection). Also fixed a stray broken `docs/code-review-checklist.md` link in CLAUDE.md.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-04-29
- **Tasks:** 3 (annotation, destructure rewrite, CLAUDE.md edits)
- **Files modified:** 9 (1 CLAUDE.md, 8 frontend route .svelte)

## Accomplishments

- **2 `{#key}` annotations land** with inline `<!-- {#key}: keep — reason -->` syntax. Verified by `grep -B1` returning 1 match each for both target files. Pattern A residue scan across 62 `{#each}` sites in `apps/frontend/src/`: 0 `{#key item}`-inside-`{#each}` hits (Phase 64 already cleaned this; verified in this plan).
- **1 Pattern B keyed each conversion**: `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:276` editable infoQuestions block converted to `(question.id)` keyed each with annotation. The block renders editable `QuestionInput` per item — items have stable IDs and per-item interactive state (bind:value, focus, draft), so positional reuse on filter/reorder would corrupt state. Other audit candidates (locked infoQuestions at :214, nominations at :234, candidate questions/+page.svelte:137 display-mode questions) are Pattern C (positional reuse correct) and left as-is.
- **6 reactive-accessor destructure rewrites** across candidate routes (preventive per RESEARCH Open Question 2):
  1. `routes/candidate/(protected)/questions/[questionId]/+page.svelte:47` — split out `answersLocked`, `questionBlocks`, `unansweredOpinionQuestions` (the RESEARCH-flagged canonical broken-but-working site).
  2. `routes/candidate/preregister/+page.svelte:28` — split out `constituenciesSelectable`, `electionsSelectable`, `idTokenClaims`, `isPreregistered`. The `steps` array and `nextRoute` const upgraded to `$derived`. Template `{#if idTokenClaims}` reads switched to `candCtx.idTokenClaims`.
  3. `routes/candidate/preregister/(authenticated)/elections/+page.svelte:14` — split `constituenciesSelectable`; `nextRoute` upgraded to `$derived`.
  4. `routes/candidate/preregister/(authenticated)/constituencies/+page.svelte:14` — split `preregistrationElections`; `<ConstituencySelector elections={candCtx.preregistrationElections}>` direct read.
  5. `routes/candidate/login/+page.svelte:45` — split `answersLocked`; `isLoginShown` `$derived` now reads `candCtx.answersLocked` reactively.
  6. `routes/candidate/register/password/+page.svelte:31` — preventive split of `isAuthenticated`; `isInviteFlow` reads `candCtx.isAuthenticated`.
- **0 reactive-accessor destructure forbidden-form hits** post-rewrite. Plan acceptance grep returns no matches.
- **CLAUDE.md `### Context Destructuring Rule (Svelte 5)` subsection added** under `## Important Implementation Notes`. Includes: 22-name reactive-accessor catalog (extends RESEARCH Code Example 7's draft with `isPreregistered`, `isAuthenticated` discovered during audit); canonical pattern citation; diagnostic-origin citation (61-03-DIAGNOSIS.md); in-tree explanation citation (candidateContext.svelte.ts:106-123); $store auto-subscribe caveat (Pitfall 5).
- **CLAUDE.md broken link fixed**: line 293's `[Code review checklist](docs/code-review-checklist.md)` → `[Code review checklist](/.agents/code-review-checklist.md)` (matches the on-disk path used at line 323's `## Code Review` section). Stray "that your code against" prose tightened to "your code against".
- **No `@openvaa/*` package edits**: `git diff --stat HEAD~3 HEAD -- packages/` empty (Phase 65 D-01 carry-forward).
- **svelte-check baseline preserved**: 160 errors / 12 warnings before and after — all pre-existing in admin/route surfaces outside Phase 65 scope.
- **Unit tests pass**: `yarn test:unit` reports 19/19 tasks successful (483/483 dev-seed tests pass on isolated re-run after the integration test's known sporadic flake).

## Task Commits

1. **Task 1: Annotate {#key} sites + Pattern B keyed each on profile** — `a172e8967` (docs(65-02))
2. **Task 2: Codebase-wide destructure audit + 6 rewrites** — `3985f554c` (fix(65-02))
3. **Task 3: CLAUDE.md rule subsection + line 293 link fix** — `d8e4205b3` (docs(65-02))

**Plan metadata commit:** to follow this SUMMARY.md write.

## Files Created/Modified

**CLAUDE.md** (1 file):
- `CLAUDE.md` — added Context Destructuring Rule subsection; fixed line 293 link to `.agents/code-review-checklist.md`

**Frontend routes** (8 files):
- `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` — `{#key}: keep` annotation at :245; destructure split at :47-54
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` — `{#key}: keep` annotation at :372
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` — `{#each}: keyed` annotation at :278; converted to `(question.id)` keying
- `apps/frontend/src/routes/candidate/login/+page.svelte` — destructure split at :44-49
- `apps/frontend/src/routes/candidate/preregister/+page.svelte` — destructure split at :28-33; `steps`/`nextRoute` upgraded to `$derived`; template `idTokenClaims` reads switched to `candCtx.idTokenClaims`
- `apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte` — destructure split at :13-17; `nextRoute` `$derived`
- `apps/frontend/src/routes/candidate/preregister/(authenticated)/constituencies/+page.svelte` — destructure split at :13-16; `<ConstituencySelector elections={candCtx.preregistrationElections}>`
- `apps/frontend/src/routes/candidate/register/password/+page.svelte` — destructure split at :30-34; `isInviteFlow` reads `candCtx.isAuthenticated`

## Decisions Made

### D-65-02-1: Preventive destructure rewrite (RESEARCH Open Question 2)

The plan's Task 2 acceptance criterion ("every reactive-accessor name from the catalog appears at most in `$derived(ctx.X)` aliases — never in plain `const { X } = ctx` destructure forms") implies preventive rewrite. The RESEARCH §Open Question 2 recommendation was the same. Decision held: every reactive-accessor name found in a destructure was rewritten, even at sites where the destructure was "broken-but-working" (e.g., `register/password/+page.svelte` `isAuthenticated` is read once at component init from `page.data.session`, which is hydrated before the script runs — the destructure happens to capture the right value). Cost: small (per-site Edit). Risk reduction: meaningful (no future-author surprise; lint-rule blueprint when added).

### D-65-02-2: 1 Pattern B keyed each conversion only

Of ~62 `{#each}` sites surveyed:
- **0 Pattern A residue** (Phase 64 already removed the EntityList.svelte instance).
- **1 Pattern B fix applied**: candidate profile editable infoQuestions block at `:276`. Items have stable IDs (`question.id`) and per-item interactive state (`QuestionInput` with `bind:value` chains, focus, uncommitted draft). Positional reuse on filter/reorder would corrupt state.
- **~30 Pattern C sites** confirmed positional-reuse-correct: option lists, tab strips, validation rule rows, info sections, search filter rows, menu items, language selectors, election lists in display mode. Left unannotated (it's the default).
- **Audit candidates rejected**:
  - `profile/+page.svelte:214` (locked infoQuestions) — display-only QuestionInput, no per-item state to corrupt.
  - `profile/+page.svelte:234` (nominations) — display-only locked Input fields, parsed once.
  - `questions/+page.svelte:129/137` (candCtx.questionBlocks blocks → questions) — renders display-mode `OpinionQuestionInput` + nav `Button`, no per-item editable state.
  - All `lib/` `{#each}` blocks (FilterGroup filters, EntityCard subcards, EntityList items, language locales, validation rules, etc.) — all Pattern C.

### D-65-02-3: isAuthenticated and isPreregistered added to CLAUDE.md catalog

RESEARCH Code Example 7 drafted the catalog with `selectedElections`, `opinionQuestions`, `answersLocked`, `unansweredOpinionQuestions`, `matches` as exemplars. The audit surfaced two more reactive-accessor destructure sites that needed splitting: `isPreregistered` (in candidate preregister/+page.svelte) and `isAuthenticated` (in register/password/+page.svelte). Both are `$derived` in their contexts (`isAuthenticated = $derived(!!page.data.session)` in authContext; `isPreregistered` flows through `_isPreregistered` `sessionStorageWritable` + `fromStore` bridge). Added to the CLAUDE.md catalog so future authors don't re-introduce the bug.

### D-65-02-4: Spread-pattern issue inside contexts/ flagged as deferred (Rule 4 boundary)

`...authContext` spread in `candidateContext.svelte.ts:375` and `adminContext.svelte.ts:99` invokes the `isAuthenticated` getter once during context construction, capturing the static return value as a property of the new context object. Strictly per Svelte 5 semantics, this breaks the reactive edge for downstream consumers reading `candCtx.isAuthenticated` or `adminCtx.isAuthenticated`. In practice it works because auth state typically does not change post-mount (page navigation triggers fresh hydration). Fix would require replacing the spread with explicit getter forwarding (`get isAuthenticated() { return authContext.isAuthenticated; }`) — an architectural change to context construction shape, **out of scope for Plan 65-02's consumer-side audit** (Rule 4 boundary). Deferred: surface as a future hygiene item; not a v2.7 blocker.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Extended CLAUDE.md catalog with isAuthenticated and isPreregistered**
- **Found during:** Task 2 (codebase audit)
- **Issue:** RESEARCH §Code Example 7 catalog omits `isAuthenticated` (`$derived(!!page.data.session)` in authContext.svelte.ts:25) and `isPreregistered` (sessionStorage-bridged reactive value in candidateContext). Both were destructured in audit-discovered route files; if catalog doesn't include them, future authors (and any future lint rule) won't recognize them as reactive accessors.
- **Fix:** Added both names to the CLAUDE.md catalog list.
- **Files modified:** CLAUDE.md
- **Verification:** Catalog now contains 22 reactive-accessor names (was 18 in the RESEARCH draft).
- **Committed in:** `d8e4205b3` (Task 3 commit)

**2. [Rule 1 - Bug] candidate/preregister/+page.svelte template idTokenClaims reads were stale**
- **Found during:** Task 2 (destructure audit at preregister/+page.svelte:28)
- **Issue:** The destructure captured `idTokenClaims` at component init. The template later reads `{#if idTokenClaims}` and `t('...title', idTokenClaims)` — both stale references because `idTokenClaims` is a `$derived` in candidateContext (line 57: `const idTokenClaims = $derived(page.data.claims ?? undefined);`). After the destructure rewrite, simply removing the local `idTokenClaims` would have left the template reads broken.
- **Fix:** Switched template reads to `candCtx.idTokenClaims` (live access).
- **Files modified:** apps/frontend/src/routes/candidate/preregister/+page.svelte
- **Verification:** `yarn workspace @openvaa/frontend check` passes; svelte-check error count unchanged from baseline (160).
- **Committed in:** `3985f554c` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 2 missing-critical catalog extension, 1 Rule 1 bug fix during the destructure rewrite cascade)
**Impact on plan:** No scope creep. Both deviations are in-flight refinements of the plan's Task 2 + Task 3 deliverables — they make the rule actually correct (catalog complete) and the rewrite actually safe (template reads not left stale).

## Issues Encountered

- **Spread-pattern context-construction issue** at `candidateContext.svelte.ts:375` and `adminContext.svelte.ts:99` — `...authContext` captures `isAuthenticated` at construction time. Strictly broken per Svelte 5 reactivity semantics; works in practice because auth state is cookie-set before component mount and page navigation triggers re-hydration. Surfaced and documented in D-65-02-4 as a deferred Rule 4 architectural item; not fixed in this plan.
- **Pre-existing dev-seed integration test flake** — first `yarn test:unit` run reported 1 failed test in `@openvaa/dev-seed/tests/integration/default-template.integration.test.ts` (the 6.5s test that exercises real-DB-shape fixtures). Re-run on the isolated package: 483/483 pass. This is a known-flaky integration test (timing-sensitive); not a regression from Plan 65-02 edits.
- **Test runner does not surface failing-test name in turbo aggregate output** — useful diagnostic gap noted but not addressed (out of scope; defer for a future tooling phase).

## A1 Hypothesis Test Outcome (Informational)

Per RESEARCH §Open Question A1: does the `{#key question.id}` block at `[questionId]/+page.svelte:243` paper over the destructure-staleness bug at line 47?

**Verdict (informational, not actioned):** post-Task-2 destructure rewrite, the `{#key}` retains a clear independent purpose: it remounts `OpinionQuestionInput` and `PreventNavigation` so per-question internal `$state` (form input refs, hasUnsaved tracking, transitions) is dropped on URL navigation N → N+1. Without the `{#key}`, the destructure rewrite would not paper over leaked draft state. The annotation justifying retention is unchanged from the planned text. **Not removed in Phase 65** per CONTEXT D-04 ("audit JUSTIFIES retained `{#key}` blocks — does NOT remove them"). Could be re-evaluated in a future hygiene phase as a defensive-vs-observable distinction, but the current behavior is correct.

## Next Phase Readiness

- **Plan 65-03 (verification + smoke) ready.** The voter 9-step + candidate 4-step manual smoke must demonstrate:
  - Zero `binding_property_non_reactive` warnings (precondition from Plan 65-01: Pattern 1 fix on Input.svelte mainInputs landed).
  - Zero behavior regressions on the candidate preregister flow (Plan 65-02 rewrote 4 of the 5 preregister-flow routes — `+page.svelte`, elections, constituencies, email; only the email page wasn't touched).
  - Zero behavior regressions on the candidate login flow (`isLoginShown` is now reactive — should still toggle correctly when answersLocked changes; the original behavior was static).
  - Zero behavior regressions on the candidate question flow (`{questionId}/+page.svelte:47` rewrite; the `{#key}` annotation does not change behavior).
- **CLAUDE.md catalog is the canonical reference** for any future destructure decision. If a future component author destructures a reactive accessor, the rule + catalog + canonical pattern are all in one section.
- **Spread-pattern deferred item** captured for a future phase (probable v2.8 hygiene): replace `...authContext` spread in candidateContext + adminContext with explicit getter forwarding. Low priority (works in practice); medium importance (correctness gap per Svelte 5 semantics).

## Self-Check: PASSED

Verified files exist:
- FOUND: CLAUDE.md
- FOUND: apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
- FOUND: apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte
- FOUND: apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
- FOUND: apps/frontend/src/routes/candidate/login/+page.svelte
- FOUND: apps/frontend/src/routes/candidate/preregister/+page.svelte
- FOUND: apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte
- FOUND: apps/frontend/src/routes/candidate/preregister/(authenticated)/constituencies/+page.svelte
- FOUND: apps/frontend/src/routes/candidate/register/password/+page.svelte
- FOUND: .planning/phases/65-svelte-5-audit-sweeps/65-02-SUMMARY.md (this file)

Verified commits exist:
- FOUND: a172e8967 ({#key} annotations + Pattern B keyed each)
- FOUND: 3985f554c (destructure rewrites)
- FOUND: d8e4205b3 (CLAUDE.md rule + link fix)

Verified verifier results:
- FOUND: 2 `{#key}: keep` annotations (1 per target file)
- FOUND: 0 Pattern A residue sites (`{#key item}`-inside-`{#each}`)
- FOUND: 1 Pattern B keyed each conversion (profile editable infoQuestions)
- FOUND: 0 reactive-accessor destructure forbidden-form hits (excluding the doc-comment in candidateContext.svelte.ts:113)
- FOUND: CLAUDE.md `Context Destructuring Rule` heading present
- FOUND: CLAUDE.md citations to 61-03-DIAGNOSIS.md, voters/results/+layout.svelte, candidateContext.svelte.ts:106-123
- FOUND: CLAUDE.md `Caveat — legacy $store auto-subscribe` block
- NOT FOUND: `[Code review checklist](docs/code-review-checklist.md)` (broken link removed — confirmed)
- FOUND: `[Code review checklist](/.agents/code-review-checklist.md)` (fixed link in place — 1 hit at line 293; line 323's pre-existing reference unchanged)

Verified type check unchanged:
- FOUND: 160 errors / 12 warnings (baseline matches post-edit)

Verified test pass:
- FOUND: 19/19 turbo tasks successful; 483/483 dev-seed tests pass on isolated re-run (flake on first aggregate run; not a regression)

---
*Phase: 65-svelte-5-audit-sweeps*
*Completed: 2026-04-29*
