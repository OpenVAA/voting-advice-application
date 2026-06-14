---
phase: 118-e2e-coverage-audit-coverage-plan
plan: 01
subsystem: e2e-coverage-planning
tags: [e2e, audit, coverage-plan, eperm, likert-only, documentation]
requires:
  - "tests/ E2E catalog (repo-root, post-Phase-93/94 layout)"
  - ".planning/REQUIREMENTS.md EPERM definitions"
provides:
  - ".planning/v2.14-E2E-COVERAGE-PLAN.md (header + grounded inventory + EPERM map + --likert-only cross-cutting finding)"
affects:
  - "Phases 120 (EPERM specs), 119 (--likert-only removal + fixtures), 130 (alliance/EPERM-03 slice)"
tech-stack:
  added: []
  patterns: ["per-requirement coverage table (covered/partial/missing + confirming spec path + action)"]
key-files:
  created:
    - ".planning/v2.14-E2E-COVERAGE-PLAN.md"
  modified: []
decisions:
  - "EPERM-01/02/08 confirmed covered, no new code (verified against cited specs, not NOTEs)"
  - "EPERM-03/04 alliance slices DEFERRED -> Phase 130 (alliances unrendered, UNBLK-06)"
  - "EPERM-10 confirmed MISSING (zero organizationMatching refs in tests/)"
  - "EPERM-11 underMaintenance global flag is a net-new gap (per-app gating covered)"
  - "--likert-only: complete removal, NO shim, NO fixture change, lands Phase 119"
metrics:
  duration: "~20m"
  completed: "2026-06-14"
  tasks: 3
  files: 1
---

# Phase 118 Plan 01: EPERM Coverage Map + `--likert-only` Audit Summary

Created the v2.14 E2E coverage-plan deliverable and completed the first audit cluster: grounded the catalog inventory against the real repo-root `tests/` tree, classified every EPERM-01..11 against read spec evidence (A5), and recorded the `--likert-only` complete-removal verdict as the highest-leverage cross-cutting finding.

## What was built

`.planning/v2.14-E2E-COVERAGE-PLAN.md` with:
1. **Header** — purpose (Phase 118 operator approval gate), the 4 verbatim ROADMAP success criteria, the CRITICAL path correction (suite at repo-root `tests/`, not `apps/frontend/tests/`), and the strict serial project-DAG note (each spec = its own project + setup/teardown triad).
2. **Grounded catalog inventory** — journey specs, all 22 perm specs (enumerated from `ls`), specialized projects, key fixtures/helpers — every path confirmed on disk.
3. **EPERM Coverage Map** — all 11 requirements classified with a verified verdict, a real confirming/target spec path, an action, and line-level evidence.
4. **Cross-Cutting Findings** — the `--likert-only` complete-removal verdict + deletion-surface table + the separate unused-helper hygiene call; placeholder subsections for Plan 04.
5. **Labelled anchors** for Plans 02–04 (EFLOW/EQTYP maps, build list, extension-scope pins, deferred markers).

## EPERM verdicts (grounded)

| Req | Verdict | Action |
|-----|---------|--------|
| EPERM-01 | COVERED (confirmed, no new code) | none |
| EPERM-02 | COVERED (confirmed, no new code) | none |
| EPERM-03 | PARTIAL (cand/org COVERED) | extend; alliance slice DEFERRED → 130 |
| EPERM-04 | PARTIAL | extend; alliance tab DEFERRED → 130 |
| EPERM-05 | PARTIAL | extend (org/alliance missing markers) |
| EPERM-06 | PARTIAL (hideHero covered) | new (hideVideo dedicated test) |
| EPERM-07 | PARTIAL (static expander seen) | new (popup-modal + static-expander both modes) |
| EPERM-08 | COVERED (confirmed, no new code) | none |
| EPERM-09 | PARTIAL | extend existing feedback perm |
| EPERM-10 | MISSING | new (About-page disclosure per mode) |
| EPERM-11 | PARTIAL (per-app gating covered) | extend (global underMaintenance) |

Notable refutation of the RESEARCH.md starting hypothesis: EPERM-11 was the operator's "should be already covered" item, but the audit found the **global `access.underMaintenance`** flag is untested (only `voterApp`/`candidateApp` per-app gating is covered) → classified PARTIAL with a net-new extension, not fully closed.

## `--likert-only` finding

Verified by inspection: (a) CLI-only with zero spec/setup/fixture consumers (grep + `setupFromTemplate.ts:13-15` "not supported"); (b) `voter-journey.fixture.ts` already answers boolean/categorical/number opinion types natively (per-question scoped `choiceCount`, pick min/max by index, skip when count==0). Verdict: pure deletion + doc-scrub (no shim, no fixture change), lands Phase 119. Deletion-surface table reproduced. Separately confirmed `walkToQuestion`/`waitForNextQuestion`/`clickThroughIntroPages`/`walkToQuestionsIntro` have zero callers (deletion candidates) while `navigateToFirstQuestion` is USED (keep).

## Deviations from Plan

None — plan executed exactly as written. (The labelled Plan 02–04 anchors specified in Task 1's action were added in the Task 3 commit alongside the cross-cutting section, because EPERM rows in Task 2 forward-reference §Extension-Scope Pins; functionally identical placement.)

## Scope confirmation

No test, fixture, or seed code was written — only `.planning/v2.14-E2E-COVERAGE-PLAN.md` was created (`git diff --name-only` over all three commits shows nothing outside `.planning/`). Every EPERM verdict cites a spec path verified to exist on disk.

## Commits

- `3d7ce79ea` docs(118-01): create deliverable with header + grounded catalog inventory
- `dcc981e80` docs(118-01): audit + classify EPERM-01..11 with verified verdicts
- `0bad282a9` docs(118-01): record --likert-only removal cross-cutting finding (A1)

## Self-Check: PASSED

- FOUND: .planning/v2.14-E2E-COVERAGE-PLAN.md
- FOUND commit 3d7ce79ea, dcc981e80, 0bad282a9
- All 11 EPERM rows present; "confirmed covered, no new code" present; Cross-Cutting Findings + `--likert-only` "pure deletion" present
- All cited EPERM spec paths exist on disk
