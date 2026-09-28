---
phase: 141-package-unit-test-coverage-test-unit-invariant-guard
plan: 05
subsystem: testing
tags: [turbo, vitest, playwright, ci, git-ancestry, negative-control, gate]

requires:
  - phase: 141-01
    provides: 141-MEASUREMENT.md (the UNIT-03 pre-wiring record whose ancestry Gate 5 re-derives) and the three BLINDNESS halves in 141-NEGATIVE-CONTROL.md
  - phase: 141-02
    provides: the five wired `test:unit` scripts whose wiring commits are Gate 5's ancestry targets, and the UNIT-01/UNIT-02 catch halves
  - phase: 141-03
    provides: scripts/assert-unit-test-coverage.mjs and the root `test:unit` wrapper that Gates 1-3 exercise
  - phase: 141-04
    provides: 141-ASSERT10-LEDGER.md (the nine-row ASSERT-10 evidence Gate 6 checks for completeness), and the two open items this plan closed
provides:
  - 141-GATES.md — eight numbered gates run against ONE tree state, each with a verbatim command, raw integer counts and a PASS/FAIL verdict
  - The phase's full-E2E discharge of the CLAUDE.md cardinal rule: 135/135, 0 failed, 0 flaky, 0 did-not-run
  - UNIT-03's measure-before-wire ordering re-derived by git ancestry (not timestamp) under both readings of the amended record commit
  - Proof that all four control-bearing requirements carry BOTH halves of their two-run negative control
  - ASSERT-10 marked complete on both REQUIREMENTS.md surfaces, and ROADMAP Phase 141 criterion 5 corrected
affects: [142, 143, 146, 149, gsd-verify-work, gsd-ship]

actuals:
  tokens: 10500
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Gate document as the phase's terminal artefact: numbered sections, verbatim command, raw integer counts, explicit PASS/FAIL — never a prose verdict"
    - "Git ancestry (`git merge-base --is-ancestor` + hash distinctness) as the ordering oracle, replacing commit timestamps"
    - "Ambiguous-oracle hardening: assert a property under EVERY defensible resolution of an ambiguous input rather than picking one"

key-files:
  created:
    - .planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-GATES.md
  modified:
    - .planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-VALIDATION.md
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md

key-decisions:
  - "Gate 5's oracle is ancestry, not timestamp — dates are rebase-/amend-mutable and carry no ordering guarantee; the commit DAG does. The seeded `git log --format='%H %ad'` command in 141-VALIDATION.md was refined accordingly, and the refinement recorded in the map row rather than silently swapped."
  - "The UNIT-03 property is asserted under BOTH resolutions of 'the record commit' (6c10d63d0, the adding commit; 0ab014b30, the amendment) — 10 pairs rather than 5 — so the verdict does not depend on which oracle a later reader picks."
  - "Gate 7 diffs the two read-only files against the PRE-PHASE commit bbe0b231f, not merely against HEAD: `git diff --exit-code` alone proves the working tree matches HEAD, which a committed modification would also satisfy. Blob-hash identity is what discharges D-15."
  - "Gate 4 records what `yarn lint:check` does NOT cover (the new .mjs guard, via the `mjssvelte` lint-staged token and the absence of a root `lint` script) so a green result is not misread as coverage of the new file; `npx prettier --check` on that one path is what discharges it."
  - "Gate 8's counts come from the HTML report's embedded report.json and are independently re-tallied from files[].tests[].outcome, not read off the console tail."
  - "`status: draft` was left untouched in 141-VALIDATION.md front matter despite all evidence supporting `validated` — that transition is owned by /gsd-validate-phase §6, not by an executor. The gap is stated in the file so audit-milestone §5.5 is not misled."

patterns-established:
  - "Two-halves completeness check as its own gate: a requirement with only one recorded observation (blind OR catching, not both) is a FAIL, cited by ledger heading rather than asserted"
  - "Count reconciliation across differently-scoped commands (143 --list = 135 run + 8 @probe; 94 files = 89 + 5) measured rather than inferred, so a ledger figure from an earlier tree is re-confirmed on the shipped one"
  - "Environment recorded as evidence, not preamble: port checked free BEFORE start and single-listener AFTER, db:reset exit code, preflight line verbatim"

requirements-completed: [UNIT-01, UNIT-02, UNIT-03, UNIT-04, ASSERT-10]

coverage:
  - id: D1
    description: "Gate document 141-GATES.md — eight numbered gates against one tree state, each with verbatim command, raw counts and PASS/FAIL"
    verification:
      - kind: automated_ui
        ref: ".planning/phases/141-.../141-GATES.md (8 gate sections, front matter gates_discharged: 8, status: all_green)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Build + unit suite green on the shipped tree with the guard summary printed ahead of any turbo task line"
    requirement: UNIT-01
    verification:
      - kind: integration
        ref: "yarn build (exit 0, 14/14) && yarn test:unit (exit 0, Tasks: 26 successful, 26 total; guard = line 1, turbo = line 2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Turbo census on the shipped tree is 12 executed / 3 unwired, the three being exactly dev-tools, shared-config, supabase-types"
    requirement: UNIT-02
    verification:
      - kind: integration
        ref: "npx turbo run test:unit --dry=json | filter command !== '<NONEXISTENT>' → executed 12, unwired 3, membership asserted"
        status: pass
    human_judgment: false
  - id: D4
    description: "UNIT-03 measure-before-wire ordering re-derived from the final history by ancestry, under both readings of the record commit"
    requirement: UNIT-03
    verification:
      - kind: integration
        ref: "git merge-base --is-ancestor <record> <wiring> × 5 packages × 2 record readings = 10 exit-0 ancestries, 10 distinct hash pairs"
        status: pass
    human_judgment: false
  - id: D5
    description: "Orphaned-package guard passes standalone with a full summary line including the skipped non-workspace count"
    requirement: UNIT-04
    verification:
      - kind: integration
        ref: "node scripts/assert-unit-test-coverage.mjs → exit 0; Check 1: 0 violations, Check 2: 0 violations, 15 scanned, 0 skipped"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every control-bearing requirement has BOTH halves of its two-run negative control recorded in a committed ledger, cited by heading"
    requirement: ASSERT-10
    verification:
      - kind: other
        ref: "141-GATES.md Gate 6 — 4/4 requirements with both halves; ASSERT-10 ledger rows A and I both `Total: 143 tests in 94 files`"
        status: pass
    human_judgment: false
  - id: D7
    description: "Tree cleanliness: no scratch artefact from any plan survives; playwright.config.ts and turbo.json byte-identical to their pre-phase blobs"
    verification:
      - kind: integration
        ref: "git status --porcelain empty; git diff --exit-code bbe0b231f HEAD -- tests/playwright.config.ts turbo.json exit 0; blob hashes identical; find zz-plant/zz-scratch → 0 matches"
        status: pass
    human_judgment: false
  - id: D8
    description: "Full E2E suite green under the cardinal rule on one fresh dev server with the served-application preflight satisfied"
    verification:
      - kind: e2e
        ref: "yarn test:e2e → report.json { total: 135, expected: 135, unexpected: 0, flaky: 0, skipped: 0, ok: true }; preflight OK against this checkout; 628.331 s"
        status: pass
    human_judgment: false

duration: 41min
completed: 2026-08-18
status: complete
---

# Phase 141 Plan 05: Single-Tree Phase Gate Summary

**All five requirements verified against ONE tree state with recorded integer counts, and the cardinal E2E rule discharged cardinal-clean (135/135, 0 failed, 0 flaky, 0 did-not-run) — a phase whose parts were each green at a different commit is now shown to be green at the commit it ships.**

## Performance

- **Duration:** 41 min
- **Started:** 2026-08-18T18:24:45Z
- **Completed:** 2026-08-18T19:05:00Z
- **Tasks:** 2 of 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- **`141-GATES.md` created — eight numbered gates, one tree state (`282443a91`).** Every gate carries the verbatim command, raw integer counts and an explicit PASS/FAIL. No gate is recorded with a prose verdict and no numbers, which is the whole point: a "suite green" is unfalsifiable six months later; `{ total: 135, expected: 135, unexpected: 0, flaky: 0, skipped: 0 }` is not.
- **Gate 8 discharged the project's cardinal E2E rule on one run.** 135 executed / 135 passed / 0 failed / 0 flaky / 0 did-not-run in 628.331 s, exit 0, preflight confirmed against this checkout, over a `yarn db:reset` database on exactly one fresh dev server. The suite was run **once** — not re-run until green, nothing annotated as flaky, nothing exempted.
- **UNIT-03's ordering property re-derived from the final history and hardened against an ambiguity nobody had resolved.** `141-MEASUREMENT.md` was amended after it was written, so "the record commit" resolves to `6c10d63d0` under a `--diff-filter=A` oracle and `0ab014b30` under a `git log -1` oracle. Rather than pick one, the gate asserts the property under **both**: 10 pairs, 10 exit-0 ancestries, 10 distinct hash pairs.
- **Gate 6 checked the phase's own evidence for completeness rather than trusting it.** All four control-bearing requirements (UNIT-01, UNIT-02, UNIT-04, ASSERT-10) carry BOTH halves of their two-run control, each cited by ledger heading. A requirement with one half would have been recorded FAIL and blocked the gate.
- **Two items plan 04 deliberately left open were closed** — ASSERT-10's stuck requirement checkbox (a Status-cell shape that made `mark-complete` return `not_found`) and a ROADMAP success criterion that asserted something this phase had already disproved.
- **Gate 4 recorded a negative result as carefully as the positives.** A green `yarn lint:check` does **not** cover `scripts/assert-unit-test-coverage.mjs`; the gate says so, names the two independent reasons, and cites the `prettier --check` run that does cover it. An unexamined green is how the next phase inherits a hole.

## Task Commits

Each task was committed atomically:

1. **Task 1: Unit, lint, census and evidence-completeness gate on the final tree** — `2fccb6b58` (docs)
2. **Task 2: Full E2E suite gate under the cardinal rule** — `32f19fd15` (test)

**Plan metadata:** see the final `docs(141-05)` commit.

## Files Created/Modified

- `.planning/phases/141-.../141-GATES.md` — **created.** The phase's terminal artefact: Gates 1-8, plus `## Open items closed by this gate`, `## Code review checklist`, `## Follow-ups surfaced, not fixed` and `## Assumptions carried forward`.
- `.planning/phases/141-.../141-VALIDATION.md` — **modified.** All five Per-Task Verification Map rows moved to ✅ green with evidence pointers; Wave 0 items and sign-off checkboxes ticked with the measurement that justifies each; `nyquist_compliant: true` and `wave_0_complete: true` set from that evidence; UNIT-03's row command refined to the ancestry oracle with the reason recorded.
- `.planning/REQUIREMENTS.md` — **modified.** ASSERT-10's traceability Status cell normalised, then the requirement marked complete on both surfaces.
- `.planning/ROADMAP.md` — **modified.** Phase 141 success criterion 5's closing false claim corrected.

## Decisions Made

- **Ancestry, not timestamp, is UNIT-03's oracle.** The seeded verification command in `141-VALIDATION.md` was a `git log --format='%H %ad'` date comparison. Author and committer dates survive neither a rebase nor an amend with their ordering intact — and this phase's own record *was* amended. `git merge-base --is-ancestor` reads the commit DAG, which cannot be rewritten without rewriting the commits themselves. The distinctness check (`REC ≠ WIRE`) is carried alongside because a commit is its own ancestor, so `--is-ancestor` alone would accept a record and a wiring that were the same commit — the "measured and wired in one breath" shape UNIT-03 exists to forbid.
- **Assert under every defensible oracle when the input is ambiguous.** Two readings of the record commit exist; both are asserted. This costs five extra `merge-base` calls and removes an entire class of "which commit did you mean?" objection.
- **Gate 7 diffs against the pre-phase commit, not against HEAD.** `git diff --exit-code -- tests/playwright.config.ts turbo.json` proves only that the working tree matches HEAD — a committed modification satisfies it just as happily. `git diff bbe0b231f HEAD --` plus blob-hash equality is what actually discharges D-15's read-only constraint.
- **`status: draft` left in place in `141-VALIDATION.md`.** Every piece of evidence supports `validated`, but that transition belongs to `/gsd-validate-phase` §6. Rather than take it or leave the discrepancy silent, the file now states that it is `validated`-eligible on evidence and has not had the transition run, so an audit-milestone §5.5 reader is not misled into NOT-VALIDATED.
- **Gate 8's counts come from `report.json`, not the console tail** — the evidence rule Phase 140 established — and are independently re-tallied from `files[].tests[].outcome` rather than trusting the pre-aggregated `stats` block.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] ASSERT-10's requirement checkbox could not be flipped**

- **Found during:** Task 1 (carried forward from plan 04, which flagged it rather than fixing it)
- **Issue:** `requirements.mark-complete ASSERT-10` returned `not_found`. The traceability row at `.planning/REQUIREMENTS.md:153` had a Status cell reading `Pending (folded in from Phase 140 follow-up F-140-01)` instead of a bare `Pending`, so the row-rewrite matcher missed and — correctly — rolled the whole write back rather than half-writing, leaving the `:63` checkbox unticked too. Compare the working `UNIT-03` row at `:132`.
- **Fix:** Normalised the Status cell to bare `Pending` (losing nothing — the provenance parenthetical is already stated more fully at `:63`), then re-ran `mark-complete`. Result: `updated: true`, `marked_complete: ["ASSERT-10"]`, both surfaces applied, `write_set_complete: true`.
- **Files modified:** `.planning/REQUIREMENTS.md`
- **Verification:** `:63` now reads `- [x]`; `:153` now reads `Complete`.
- **Committed in:** `2fccb6b58`

**2. [Rule 1 - Bug] ROADMAP Phase 141 criterion 5 asserted something this phase had disproved**

- **Found during:** Task 1 (flagged by plan 04, deliberately left for this gate)
- **Issue:** `.planning/ROADMAP.md:445` closed with *"This closes the second half of the remedy Phase 140 recorded but did not build"*. False as written and false when written: Phase 140 **did** build the teardown-prefix guard, in `abe1fabb0`, hardened by `bdb759575` (IN-01) and `c15e444e8` (IN-02). Leaving it would propagate the same false premise into every later phase that reads this criterion — precisely the failure the milestone's re-verification lesson exists to prevent.
- **Fix:** Replaced the sentence with the corrected account (Phase 140 built the guard; what F-140-01 left outstanding was the negative-control evidence; Phase 141 supplies it in `141-ASSERT10-LEDGER.md` and edits no byte of the guard, per D-15). The superseded wording is **quoted inside** the correction rather than deleted, so a reader searching for the old phrase lands on the correction instead of on nothing.
- **Files modified:** `.planning/ROADMAP.md`
- **Verification:** the only surviving occurrence of the old phrase is the one inside the correction (`grep -n` → line 445 only).
- **Committed in:** `2fccb6b58`

---

**Total deviations:** 2 auto-fixed (1 × Rule 1, 1 × Rule 2). Both were items plan 04 explicitly deferred to this gate rather than discoveries of this plan. Both are record corrections; neither touches source. **Impact on plan:** the plan's declared `files_modified` named only `141-GATES.md` and `141-VALIDATION.md`; `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md` were added to the diff, and the widening is recorded in `141-GATES.md` § Open items closed by this gate. No scope creep beyond the two named items.

## Issues Encountered

- **Extracting Gate 8's counts from the HTML report.** `tests/playwright.config.ts` configures the `html` reporter only, with no `json` reporter, so there is no standalone `report.json` on disk. The counts live in a base64 zip embedded in `index.html` under a `<script id="playwrightReportBase64">` tag. A naive regex over the whole file matched the *bundled JS references* to that id rather than the payload. Resolved by seeking the **last** `data:application/zip;base64,` marker and slicing to the next `<`, then unzipping. The console tail (`135 passed (10.5m)`) agrees with the extracted stats, so the two independent readings corroborate.
- **The plan's task-1 `<automated>` verify includes `git status --porcelain | wc -l | grep -qx '0'`**, which cannot pass while the gate document it just wrote is still uncommitted. Run scoped to exclude `.planning` pre-commit, then re-run unscoped after the commit — `git status --porcelain` is empty at both task commits.
- **`yarn format:check` fails at this HEAD** on `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts` and `tests/README.md`. **Pre-existing, not a Phase 141 regression** — both were committed before this phase in a state the current prettier config does not produce. Already logged in `deferred-items.md`; repeated in the gate document so a later reader does not attribute it here. Not fixed (scope boundary); a standalone `yarn format` sweep is its home.

## Known Stubs

None. This plan wrote no source code — it changed one new document and three existing ones. A stub scan over the plan's complete added diff (`TODO`, `FIXME`, `placeholder`, "coming soon", "not available") returns zero matches.

## Threat Flags

None. This plan added no network endpoint, auth path, file-access pattern or schema change. Its entire diff is Markdown under `.planning/`.

## Follow-ups carried out of this phase

Recorded in full in `141-GATES.md` § Follow-ups surfaced, not fixed — surfaced by this phase, none of them defects it introduced:

1. `.lintstagedrc.json:2` — the `mjssvelte` token is a missing comma, putting **both** `.mjs` and `.svelte` outside every lint-staged glob.
2. The deprecated root `vitest.workspace.ts` and its migration to Vitest's `test.projects` field.
3. `--passWithNoTests` harmonisation across the five already-wired packages (deferred by D-13).
4. The shared teardown-prefix registry (deferred by D-06).
5. `.spec.tsx` sitting outside `TEST_FILE_SUFFIXES` — latent, not live: no such file exists in the repo today.

Plus the pre-existing `yarn format:check` drift already in `deferred-items.md`.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Phase 141 is complete and gated.** All five requirements (UNIT-01, UNIT-02, UNIT-03, UNIT-04, ASSERT-10) are marked complete in `REQUIREMENTS.md`, each backed by a two-run negative control where one applies, and all verified against the single tree state the phase ships.

Ready for `/gsd-verify-work`, then Phase 142 (which the roadmap sequences after 141 precisely so the AI-package tests it repairs actually run in CI — they now do: `@openvaa/llm`, `@openvaa/question-info` and `@openvaa/argument-condensation` are all in Gate 2's executed list).

**Two residuals a later phase inherits, both stated in Gate 8:**

1. **CI-side behaviour of the new root `test:unit` wrapper is unobserved.** `141-MEASUREMENT.md` establishes statically that the CI entry points route through the root script, but only a real CI run observes it. Same class as Phase 137's open risk **T-137-11**, and lands on the same event: this branch's first PR to `main`.
2. **The visual-regression project was not exercised and was never in scope** — its baselines are container-pinned and the milestone rule forbids capturing them on a developer Mac. Phase 146 owns it.

Neither blocks phase closure; both are recorded so eight green gates are not over-read.

## Self-Check: PASSED

All five files named in this summary exist on disk, and all three commit hashes
(`2fccb6b58`, `32f19fd15`, `b28bf1c5e`) resolve in `git log`. No missing items.

---
*Phase: 141-package-unit-test-coverage-test-unit-invariant-guard*
*Completed: 2026-08-18*
