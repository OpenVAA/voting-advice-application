---
phase: 117-dataroot-cold-entry-reactivity-fix
plan: 01
subsystem: ui
tags: [svelte5, runes, derived, referential-equality, dataroot, version-bridge, reactivity, e2e, playwright, cold-entry]

# Dependency graph
requires:
  - phase: 113-context-handle-flatten
    provides: "bare reactive dataRoot accessor (FLATTEN-02) whose alias-indirection exposes this bug"
  - phase: 116-milestone-close
    provides: "the GATE-01 full-suite green gate this fix unblocks (run in Plan 02)"
provides:
  - "12 dataRoot read-consumer sites rewritten to direct ctx.dataRoot.<prop> reads (alias-indirection removed)"
  - "CLAUDE.md Context Destructuring Rule carve-out documenting the dataRoot #version-bridge alias hole"
  - "cold-entry-dataroot Playwright project + spec (negative-control-proven cold/direct-URL regression coverage)"
  - "testIds.voter.info.electionList data-dependent anchor on the info election region"
affects: [117-02, dataRoot consumers, Svelte 5 reactive-accessor consumption patterns]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Direct ctx.dataRoot.<prop> read inside the consuming tracking scope (never an intermediate $derived alias) for identity-stable #version-bridge accessors"
    - "Cold/direct-URL-entry E2E coverage as a data-setup-base-dependent LEAF project, negative-control-proven"

key-files:
  created:
    - tests/tests/specs/voter/cold-entry-dataroot.spec.ts
  modified:
    - apps/frontend/src/routes/(voters)/elections/+page.svelte
    - apps/frontend/src/routes/(voters)/constituencies/+page.svelte
    - apps/frontend/src/routes/(voters)/info/+page.svelte
    - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
    - apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte
    - apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
    - apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
    - apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.svelte
    - apps/frontend/src/routes/admin/(protected)/question-info/+page.svelte
    - CLAUDE.md
    - tests/playwright.config.ts
    - tests/tests/utils/testIds.ts

key-decisions:
  - "Narrow codemod (dataRoot only) — appSettings/locale/array accessors left unchanged (Spike 024 proved them unaffected)"
  - "Cold-entry coverage as a dedicated LEAF spec/project (not extending serial voter-journey) so the negative-control re-run stays cheap and isolated"
  - "Info election-region testid merged into the EXISTING testIds.voter.info block (not a new duplicate block)"

patterns-established:
  - "Identity-stable #version-bridge accessor reads MUST be direct ctx.dataRoot.<prop> in the tracking scope — documented as a CLAUDE.md carve-out"

requirements-completed: [COLD-01, COLD-02, COLD-03]

# Metrics
duration: ~25min
completed: 2026-06-13
---

# Phase 117 Plan 01: dataRoot Cold-Entry Reactivity Fix Summary

**Removed the `const dataRoot = $derived(ctx.dataRoot)` alias-indirection in 12 consumer sites so cold/direct-URL entry to /elections, /info (and the candidate/admin election regions) renders populated data, documented the #version-bridge hole in CLAUDE.md, and added negative-control-proven cold-entry E2E coverage.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 3
- **Files modified:** 16 (13 source + CLAUDE.md + 2 test-config + 1 new spec)

## Accomplishments
- COLD-01: rewrote 11 dataRoot read-consumer sites to direct `ctx.dataRoot.<prop>` reads inside their tracking scopes and captured the operator's pre-applied elections fix; left the 2 imperative-writer aliases untouched. Static grep gate clean; `yarn build --filter=@openvaa/frontend` + `yarn lint:check` green.
- COLD-02: added a Context Destructuring Rule carve-out to CLAUDE.md documenting the dataRoot `#version`-bridge alias hole and the safe direct-read shape, citing (not duplicating) Spike 024, CONVENTIONS §9, and the debug doc.
- COLD-03 (authoring): new `cold-entry-dataroot` Playwright project + spec asserting data-dependent regions on cold `/en/elections` and `/en/info`, plus a `voter-info-election-list` testid. Negative control proves the spec RED-fails on the aliased (pre-fix) shape and passes on the fix.

## Task Commits

Each task was committed atomically:

1. **Task 1: Narrow dataRoot alias→direct codemod (COLD-01)** - `4c132968d` (fix)
2. **Task 2: CLAUDE.md carve-out (COLD-02)** - `b4e41483f` (docs)
3. **Task 3: Cold-entry spec + project + info testid + negative control (COLD-03)** - `fde533603` (test)

## Files Created/Modified

**Codemod (COLD-01) — 12 read consumers rewritten to direct `ctx.dataRoot.<prop>`:**
- `(voters)/elections/+page.svelte` — operator's pre-applied fix, confirmed + committed (canonical analog)
- `(voters)/constituencies/+page.svelte` — `voterCtx.dataRoot.constituencyGroups` (useSingleGroup thunk) + `voterCtx.dataRoot.elections` (elections derived)
- `(voters)/info/+page.svelte` — `ctx.dataRoot.elections` direct in template; also carries the COLD-03 testid
- `(voters)/(located)/questions/+layout.svelte` — `voterCtx.dataRoot.getQuestion`
- `(voters)/(located)/questions/category/[categoryId]/+page.svelte` — `voterCtx.dataRoot.getQuestionCategory`
- `lib/dynamic-components/entityDetails/EntityInfo.svelte` — `ctx.dataRoot.elections.length`
- `lib/dynamic-components/questionHeading/QuestionHeading.svelte` — `ctx.dataRoot.elections` (fallback branch)
- `lib/dynamic-components/entityCard/EntityCard.svelte` — `ctx.dataRoot` passed directly into `getCardQuestions` inside the `parsed` `$derived.by`
- `candidate/preregister/(authenticated)/elections/+page.svelte` — `candCtx.dataRoot.elections`
- `candidate/(protected)/profile/+page.svelte` — `candCtx.dataRoot.getElection/getConstituency`
- `candidate/(protected)/questions/[questionId]/+page.svelte` — `candCtx.dataRoot.getQuestion`
- `admin/(protected)/argument-condensation/+page.svelte` — `ctx.dataRoot.getElection/findQuestions` ($effect) + `ctx.dataRoot.elections` (template)
- `admin/(protected)/question-info/+page.svelte` — `ctx.dataRoot.getElection/findQuestions` ($effect) + `ctx.dataRoot.elections` (template)

**Left unchanged (imperative writers, per scope fence 2):**
- `(voters)/(located)/+layout.svelte:38` — the WRITER/gate
- `candidate/(protected)/preview/+page.svelte:32` — the candidate WRITER

**Docs (COLD-02):**
- `CLAUDE.md` — Context Destructuring Rule carve-out for the dataRoot `#version`-bridge hole

**Tests (COLD-03):**
- `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` — new cold-entry regression spec (2 hard-nav tests)
- `tests/playwright.config.ts` — new `cold-entry-dataroot` LEAF project (`dependencies: ['data-setup-base']`)
- `tests/tests/utils/testIds.ts` — `testIds.voter.info.electionList = 'voter-info-election-list'`

## Static grep gate (COLD-01) — final output

```
$ grep -rn '\$derived(.*\.dataRoot)' apps/frontend/src/routes apps/frontend/src/lib
apps/frontend/src/routes/candidate/(protected)/preview/+page.svelte:32:  const dataRoot = $derived(ctx.dataRoot);
apps/frontend/src/routes/(voters)/(located)/+layout.svelte:38:  const dataRoot = $derived(voterCtx.dataRoot);
```

Exactly the 2 allowed imperative-writer sites remain; zero alias-then-read shapes elsewhere (non-writer count = 0). The carve-out comments were worded to avoid the literal `$derived(...dataRoot)` text so they do not trip the gate.

## Negative-control RED→GREEN evidence (COLD-03)

**Mechanism:** the cold spec asserts data-dependent regions (`voter-elections-list`/`voter-elections-option`, `voter-info-election-list`) after a bare `page.goto` — these are gated/empty when `dataRoot.<prop>` is stale.

**RED (pre-fix shape):** temporarily reintroduced `const dataRoot = $derived(ctx.dataRoot)` in `info/+page.svelte` and reverted the template to read through the alias (testid kept on the now-empty region). `yarn test:e2e --project=cold-entry-dataroot`:
```
1) /en/info renders the election-data region — FAILED
   getByTestId('voter-info-election-list') — Expected: visible, Received: hidden (10000ms timeout)
   "14 × locator resolved to <div data-testid="voter-info-election-list">… unexpected value 'hidden'"
1 failed (/en/info), 3 passed (incl. /en/elections — already fixed + setup/teardown)
```
The region was present in the DOM but never populated → `{#if dataRoot.elections}` stayed empty (hidden) on cold entry — exactly the staleness this phase fixes.

**GREEN (fix restored):** reverted `info/+page.svelte` to the committed direct-read form (`git diff` empty vs HEAD), re-ran the project:
```
4 passed (5.5s)   # both cold tests + setup + teardown
```

This proves the spec is falsifiable and exercises the regression.

## Decisions Made
- Narrow codemod scope (dataRoot only). `appSettings`/`locale`/array accessors (`selectedElections`/`opinionQuestions`/`matches`) were NOT touched — Spike 024 proved they propagate through a `$derived` alias correctly. Diff is dataRoot-consumers only.
- Dedicated cold-entry LEAF spec/project rather than extending the serial `voter-journey` (keeps the cold contract isolated and the negative-control re-run cheap; per Claude's Discretion in CONTEXT.md).
- `electionList` testid merged into the pre-existing `testIds.voter.info` block (a separate new `info` block caused a TS1117 duplicate-key error — see Deviations).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Duplicate `info` key in testIds.ts**
- **Found during:** Task 3 (testid wiring)
- **Issue:** The plan said to add a new `info: { electionList: ... }` block under `testIds.voter`, but a `testIds.voter.info` block already existed (line 237, `content`/`returnButton`). The new block produced `TS1117: An object literal cannot have multiple properties with the same name` and `TS2339` on `electionList`, failing `yarn typecheck:tests`.
- **Fix:** Removed the duplicate block and added `electionList: 'voter-info-election-list'` (with the planned comment) to the EXISTING `testIds.voter.info` block instead.
- **Files modified:** tests/tests/utils/testIds.ts
- **Verification:** `yarn typecheck:tests` clean; `grep voter-info-election-list` PASS-WIRING.
- **Committed in:** `fde533603` (Task 3 commit)

**2. [Rule 3 - Blocking] Carve-out comment text tripping the COLD-01 grep gate**
- **Found during:** Task 1 (codemod verify)
- **Issue:** The in-file anti-pattern comments I added on `constituencies` and `info` contained the literal string `$derived(voterCtx.dataRoot)` / `$derived(ctx.dataRoot)` inside backticks, so the blunt `grep -rn '\$derived(.*\.dataRoot)'` gate matched them (reported 2 non-writer hits → FAIL-ALIAS-REMAINS) even though they are comments, not alias code.
- **Fix:** Reworded those two comments to "NEVER bind it to an intermediate $derived alias" (no `(...dataRoot)` parens), so the gate matches only real code. Other site comments already used the parens-free phrasing.
- **Files modified:** apps/frontend/src/routes/(voters)/constituencies/+page.svelte, apps/frontend/src/routes/(voters)/info/+page.svelte
- **Verification:** grep gate non-writer count = 0; only the 2 writer sites remain.
- **Committed in:** `4c132968d` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking)
**Impact on plan:** Both were mechanical blockers to the planned verification gates (typecheck + grep). No scope change; the planned outcome is unchanged.

## Issues Encountered
- None beyond the two Rule-3 blockers above. The `package.json` working-tree change noted in the environment preamble was left untouched (not staged in any commit).

## Next Phase Readiness
- COLD-01/02/03 (authoring) complete; the cold-entry regression is locked and proven.
- Wave 2 (Plan 02) owns the full-suite green gate (Phase 116 GATE-01: full `yarn test:e2e` + `yarn test:unit` + `yarn lint:check`). Phase 117 status is intentionally NOT flipped to complete/verified here — the orchestrator owns phase-level state between waves.
- The new `cold-entry-dataroot` project is part of the default `yarn test:e2e` run (LEAF on `data-setup-base`); it will be exercised by the Wave 2 full-suite gate.

## Self-Check: PASSED

- All created files exist on disk (117-01-SUMMARY.md, cold-entry-dataroot.spec.ts).
- All three task commits present in git history (4c132968d, b4e41483f, fde533603).
