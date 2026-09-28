---
phase: 260607-cd0-clean-up-e2e-test-folder
plan: 01
status: complete
completed_on: 2026-06-07
scope_note: "Analysis-only by design — produced catalogue + overlap verdicts + a consolidation proposal. Deprecating the duplicates was explicitly deferred to a follow-up run, so the absence of code changes is the delivered scope, not an incomplete one."
subsystem: e2e-test-infra
tags: [analysis, e2e, playwright, dead-code, catalogue]
requires: []
provides: [E2E module→spec catalogue, overlap verdicts, mechanically-executable consolidation proposal]
affects: [tests/tests/]
tech-stack:
  added: []
  patterns: [triple-grep importer mapping, barrel-trap resolution, Playwright project-graph cataloguing]
key-files:
  created:
    - .planning/quick/260607-cd0-clean-up-e2e-test-folder-catalogue-fixtu/260607-cd0-E2E-CLEANUP-REPORT.md
  modified: []
decisions:
  - "helpers/ vs utils/ split: KEEP (do not unify) — real semantic axis, documented tie-breaker, load-bearing README contracts."
  - "Lead the cleanup with 5 dead-code removals, not the scouted name-pairs (3 of the 4 are not duplicates)."
  - "emailHelper consolidation is D3-superseded + gated on a 2-spec fixture migration — NOT a free delete."
metrics:
  duration: "~25m"
  completed: 2026-06-07
---

# Quick Task 260607-cd0: Clean up e2e test folder (catalogue + overlap + proposal) Summary

One-liner: Evidence-based catalogue of all 46 in-scope `tests/tests/` code modules + 49-file setup project graph, with body-level overlap verdicts that refute 3 of 4 scouted "duplicate" pairs and surface 5 genuine dead-code items (3 NEW beyond research) — delivered as a single analysis-only report; nothing under `tests/` changed.

## What was done

Executed all 3 plan tasks, all writing to the single deliverable `260607-cd0-E2E-CLEANUP-REPORT.md` (sections 0–5):

- **Task 1 (Catalogue):** Restated the in-tree taxonomy verbatim (fixture/helper/util/setup + 4-step classifier). Built the full module→importer map for 26 fixtures, 6 helpers + barrel, 13 utils, and the `setupFromTemplate` driver using the triple-grep recipe (module path + every exported symbol + barrel destructure resolution). Catalogued the 49 setup files via the Playwright project graph (not import grep). Flagged dead modules. Cross-checked all RESEARCH §5 spot-checks and recorded divergences.
- **Task 2 (Overlap):** Stated the D1/D2/D3 tiers, then rendered a per-pair verdict for all four scouted signals with body-level evidence (read both module bodies). Led the 5 dead-code findings as the real win. Gave a substantiated KEEP recommendation for the helpers/utils split.
- **Task 3 (Proposal):** Wrote a mechanically-executable, dead-code-first deprecation plan — each item with canonical target + files-to-delete + import-sites-to-rewrite. emailHelper gated on its 2-spec fixture migration. DO-NOT-consolidate guardrail list included. Stray-artifact section gives the IDURA keep-vs-ignore user decision and confirms output dirs are gitignored. §5 checkpoint records analysis-only status.

## Key findings (beyond RESEARCH)

- **3 NEW dead-code items** the scout/research did not flag: `helpers/db-precondition.helper.ts` (`assertDbRowCount`, 0 consumers, barrel-only), `helpers/voter-iteration.helper.ts` (`walkVoterIteration`, 0 consumers, barrel-only — the README claim that it backs `answeredVoterPage` is STALE; the fixture uses local `walkUntilQuestionsIntro`+`answerAndAdvanceToResults`), and `gotoAndSettle` (dead export inside the otherwise-live `settle.helper.ts`).
- **Confirmed dead set:** `translations.ts` (0), `paths.ts` (1 cascade — only `translations.ts`), `answerQuestion.ts` (0).
- **emailHelper ↔ emailBucket:** confirmed D1 constant/plumbing duplication (`MAILPIT_URL`, Mailpit interfaces, fetch body) but D3-superseded with 2 live importers — migration, not delete.
- **navigation / voter-intro / i18n pairs:** refuted as duplicates with docstring + LOC + layer evidence.
- **Spot-check divergences:** `supabaseAdminClient` 39 (vs 34 expected), `buildRoute` 14 (vs 12), `missingNominations` 2 live specs (vs 1), `setupFromTemplate` 23 (vs ~24) — all still LIVE; recorded as findings.

## Deviations from Plan

None — plan executed exactly as written. ANALYSIS-ONLY constraint honored: zero source/test files deleted, moved, rewritten, or @deprecated.

## Verification

- All three task automated-verify checks PASS (report exists; §1 has ≥40 `tests/tests/` refs — 67; §2 has D1/D2/D3 + translations.ts + KEEP; §3/§4 have canonical-target + IDURA).
- Plan-level non-destructive gate PASS: `git status --porcelain tests/` shows only the two **pre-existing** entries (`M tests/tests/specs/voter/voter-journey.spec.ts`, `?? tests/IDURA-TEST-RUNBOOK.md`) — both predate this run and were not touched by it.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: `.planning/quick/260607-cd0-clean-up-e2e-test-folder-catalogue-fixtu/260607-cd0-E2E-CLEANUP-REPORT.md` (284 lines, sections 0–5 present).
- No commits to verify — this task produces only a docs artifact (committed by the orchestrator per task constraints); no per-task code commits expected.
