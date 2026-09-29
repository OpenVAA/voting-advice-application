---
phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
plan: 01
subsystem: testing
tags: [vitest, dev-seed, playwright, quarantine, test-gate]

# Dependency graph
requires:
  - phase: 92-e2e-test-infrastructure-hardening
    provides: in-flight Page-Object→fixtures migration on feat-gsd-roadmap
provides:
  - Green dev-seed `test:unit` gate (exit 0) — trustworthy for Waves 1+
  - Pre-rewrite Playwright project-graph baseline (93-PLAYWRIGHT-LIST-BASELINE.txt, 84 tests / 72 files)
affects: [93-02 e2e-template-rewrite, 93-05 playwright-config-rewrite, all Phase 93 downstream waves using dev-seed gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "describe.skip + // reason: quarantine for obsolete-but-not-yet-deletable test suites"
    - "Stand-in const declarations to keep skipped suite bodies parseable after import removal"

key-files:
  created:
    - .planning/phases/93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te/93-PLAYWRIGHT-LIST-BASELINE.txt
  modified:
    - packages/dev-seed/tests/templates/variant-app-settings.test.ts
    - packages/dev-seed/tests/templates/e2e.test.ts

key-decisions:
  - "Quarantined (not deleted) both failing dev-seed test surfaces to preserve audit trail; deletion is owned by later cleanup (variant infra) and Plan 02 (e2e template rewrite)."
  - "Used `cp` of verbatim captured Playwright stdout for the baseline file to preserve exact byte content (semantically equivalent to Write of the captured output)."
  - "Skipped only the single failing e2e.test.ts assertion (it.skip) rather than the whole §Section 7 suite — the other row-count assertions still pass; minimal-skip per plan instruction."

patterns-established:
  - "Wave-0 gate-trust pattern: fix/quarantine pre-existing RED in a shared test run before downstream waves rely on its green exit code."

requirements-completed: [WAVE-0, FLAG-1]

# Metrics
duration: ~3min
completed: 2026-06-03
---

# Phase 93 Plan 01: Wave 0 — dev-seed Gate Trust + Playwright Baseline Summary

**Restored the dev-seed `test:unit` gate to exit 0 by quarantining two pre-existing failures (broken variant-* import + drifted e2e row-count assertion), and captured the pre-rewrite Playwright project graph (84 tests / 72 files) as the Plan 05 attribution baseline.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-03T11:22:03Z
- **Completed:** 2026-06-03T11:25:10Z
- **Tasks:** 3
- **Files modified:** 3 (2 modified, 1 created)

## Accomplishments
- `yarn workspace @openvaa/dev-seed test:unit` now exits 0 (was RED with 2 failures in the same run) — 495 passed / 18 skipped / 513 total.
- `variant-app-settings.test.ts` quarantined: the git-deleted `variant-constituency` (and sibling `variant-*`) imports were failing at module-load; commented out + all 3 `describe` blocks switched to `describe.skip` with `// reason:` rationale, plus stand-in consts so the skipped bodies still parse.
- `e2e.test.ts` stale `questions.fixed.length === 18` assertion (drifted to 25) skipped via `it.skip` + `// reason:`; superseded by Plan 02's D-03 base-dataset rewrite.
- `93-PLAYWRIGHT-LIST-BASELINE.txt` captured pre-config-rewrite (`playwright test --list` exits 0; 84 tests in 72 files).

## Task Commits

Each task was committed atomically:

1. **Task 1: Quarantine variant-app-settings dev-seed test** - `2873701ff` (test)
2. **Task 2: Quarantine stale e2e.test.ts assertion** - `8ca7faca0` (test)
3. **Task 3: Capture pre-rewrite Playwright graph baseline** - `55f093982` (docs)

## Files Created/Modified
- `packages/dev-seed/tests/templates/variant-app-settings.test.ts` - Imports of git-deleted variant-* setup templates commented out; 3 describe blocks → describe.skip; stand-in consts added.
- `packages/dev-seed/tests/templates/e2e.test.ts` - Single drifted row-count assertion (questions 18→25) skipped via it.skip + reason.
- `.planning/phases/93-.../93-PLAYWRIGHT-LIST-BASELINE.txt` - Verbatim `playwright test --list` snapshot (attribution reference for Plan 05 config rewrite).

## Decisions Made
- **Quarantine over delete:** Neither failing surface was deleted — variant infra removal and the e2e-template rewrite (Plan 02 / D-03) own those deletions. Skips preserve the audit trail and avoid pre-empting downstream plans.
- **Minimal skip in e2e.test.ts:** Only the one failing assertion (`it.skip`), since the other §Section 7 row-count assertions (organizations===4, candidates===18, nominations===22) still pass.
- **Stand-in consts in variant-app-settings:** Because the broken imports fail at module-load (not runtime), they had to be commented out; stand-in `const` declarations keep the (now-skipped) suite bodies syntactically valid.
- **Baseline via `cp` of captured stdout:** Preserves the exact byte content of the verified `playwright test --list` output; semantically identical to writing the captured output and re-verified to parse (exit 0).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- **Broken global commit hook:** Normal `git commit` failed (the global hook attempts a `yarn`/translation-key generation step from the wrong directory: "Couldn't find a package.json file in /Users/.../OpenVAA"). Resolved per project memory by committing with `git -c core.hooksPath=/dev/null` (the documented repo workaround). Not a lint/test failure in the changes themselves.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dev-seed `test:unit` gate is green and trustworthy — Waves 1+ can rely on its exit code.
- Pre-rewrite Playwright graph baseline committed — Plan 05's config rewrite has an attribution reference (post-rewrite list must still resolve; project-key renames OK, dropped/orphaned specs not).
- No blockers.

## Self-Check: PASSED

All claimed files exist on disk; all 3 task commits (`2873701ff`, `8ca7faca0`, `55f093982`) present in git history.

---
*Phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te*
*Completed: 2026-06-03*
