---
schema_version: 1
open_count: 11
waived_count: 0
fixed_count: 0
total_count: 11
last_updated: 2026-08-17T07:05:45.533Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 139 | deviation | .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md |  | Plan 06 Rule-3 deviation: § 6's 'not yet written' placeholder converted to an explicit plan-07 reservation to satisfy task 2's repo-wide no-placeholder gate without pre-empting criterion 4 | open |  | 2026-08-14T13:16:36.218Z |  |
| 2 | 140 | deviation | tests/tests/specs/candidate/candidate-journey.spec.ts | 47 | Rigidity contract drift: header declares '0 expect.soft' but the file carries 3 (measured at 568b1dfe). Out of ASSERT-06 scope (voter-journey.spec.ts only); filed by 140-01 rather than absorbed. | open |  | 2026-08-15T10:46:11.569Z |  |
| 3 | 140 | deviation | tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts | 43 | Rigidity contract drift: header declares 'NO expect.soft' but the file carries 6 (measured at 568b1dfe). Out of ASSERT-06 scope; filed by 140-01. | open |  | 2026-08-15T10:46:11.715Z |  |
| 4 | 140 | deviation | tests/tests/fixtures/candidate/candidateHomePage.fixture.ts | 23 | Rigidity contract drift: header declares 'NO expect.soft' but the file carries 4 (measured at 568b1dfe). Out of ASSERT-06 scope; filed by 140-01. | open |  | 2026-08-15T10:46:11.858Z |  |
| 5 | 140 | unrun-verify | tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts |  | Bank-auth journey SPEC not run in Phase 140's F3 control; only its teardown data lane was exercised (140-NEGATIVE-CONTROL.md § 19.6, § 22) | open |  | 2026-08-15T15:24:14.808Z |  |
| 6 | 140 | unrun-verify | .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-06-PLAN.md |  | Both verification:backstop truths (duplicated e2e-perm-notloc- prefix in one invocation; concurrent pre-clear tolerance) are reasoned, not observed (140-NEGATIVE-CONTROL.md § 22) | open |  | 2026-08-15T15:24:14.942Z |  |
| 7 | 151 | lint-warning | packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts | 30 | prettier printWidth: hand-wrapped declaration; format:check red at 151-03 baseline, DEFERRED per PD-03 | open |  | 2026-08-16T20:58:28.880Z |  |
| 8 | 151 | lint-warning | tests/README.md | 182 | prettier markdown table alignment: columns 3-5 under-padded; format:check red at 151-03 baseline, DEFERRED per PD-03 | open |  | 2026-08-16T20:58:29.034Z |  |
| 9 | 151 | unmet-truth | .planning/phases/151-ship-v0-2-akita-review-stack/151-HYGIENE-REPORT.md |  | 151-07 must-have 'surviving phase/spike references appear only in the collapsed short-pointer form' is NOT met: 108 attributive references (e.g. 'the Phase 64 fix') were deliberately reported instead of collapsed, because 'the see phase 64 fix' is ungrammatical. phase-ref/spike-ref gate rows stay red until plan 151-08. | open |  | 2026-08-17T07:05:45.227Z |  |
| 10 | 151 | deviation | .planning/phases/151-ship-v0-2-akita-review-stack/151-HYGIENE-REPORT.md |  | 151-07 Task 3 acceptance criteria 1 and 2 (zero '.planning/' paths, zero 'Plan NN-NN') are not met: 5 + 2 occurrences survive in Markdown prose and in an ESLint rule message string, both classes the same plan routes to the 151-08 agent pass. Plan-internal contradiction, enumerated in 151-HYGIENE-REPORT.md. | open |  | 2026-08-17T07:05:45.402Z |  |
| 11 | 151 | deviation | .planning/phases/151-ship-v0-2-akita-review-stack/151-hygiene-prose-queue.tsv |  | 7 comment lines were rewritten correctly (reference removed) but read badly after a mid-sentence deletion, e.g. 'See for the trace.' Enumerated as 151-08's prose-polish queue. | open |  | 2026-08-17T07:05:45.533Z |  |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "139",
    "file": ".planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md",
    "line": null,
    "description": "Plan 06 Rule-3 deviation: § 6's 'not yet written' placeholder converted to an explicit plan-07 reservation to satisfy task 2's repo-wide no-placeholder gate without pre-empting criterion 4",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-14T13:16:36.218Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "deviation",
    "phase": "140",
    "file": "tests/tests/specs/candidate/candidate-journey.spec.ts",
    "line": 47,
    "description": "Rigidity contract drift: header declares '0 expect.soft' but the file carries 3 (measured at 568b1dfe). Out of ASSERT-06 scope (voter-journey.spec.ts only); filed by 140-01 rather than absorbed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-15T10:46:11.569Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "140",
    "file": "tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts",
    "line": 43,
    "description": "Rigidity contract drift: header declares 'NO expect.soft' but the file carries 6 (measured at 568b1dfe). Out of ASSERT-06 scope; filed by 140-01.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-15T10:46:11.715Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "140",
    "file": "tests/tests/fixtures/candidate/candidateHomePage.fixture.ts",
    "line": 23,
    "description": "Rigidity contract drift: header declares 'NO expect.soft' but the file carries 4 (measured at 568b1dfe). Out of ASSERT-06 scope; filed by 140-01.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-15T10:46:11.858Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "unrun-verify",
    "phase": "140",
    "file": "tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts",
    "line": null,
    "description": "Bank-auth journey SPEC not run in Phase 140's F3 control; only its teardown data lane was exercised (140-NEGATIVE-CONTROL.md § 19.6, § 22)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-15T15:24:14.808Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "unrun-verify",
    "phase": "140",
    "file": ".planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-06-PLAN.md",
    "line": null,
    "description": "Both verification:backstop truths (duplicated e2e-perm-notloc- prefix in one invocation; concurrent pre-clear tolerance) are reasoned, not observed (140-NEGATIVE-CONTROL.md § 22)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-15T15:24:14.942Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "lint-warning",
    "phase": "151",
    "file": "packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts",
    "line": 30,
    "description": "prettier printWidth: hand-wrapped declaration; format:check red at 151-03 baseline, DEFERRED per PD-03",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-16T20:58:28.880Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "lint-warning",
    "phase": "151",
    "file": "tests/README.md",
    "line": 182,
    "description": "prettier markdown table alignment: columns 3-5 under-padded; format:check red at 151-03 baseline, DEFERRED per PD-03",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-16T20:58:29.034Z",
    "resolved_at": null
  },
  {
    "id": 9,
    "kind": "unmet-truth",
    "phase": "151",
    "file": ".planning/phases/151-ship-v0-2-akita-review-stack/151-HYGIENE-REPORT.md",
    "line": null,
    "description": "151-07 must-have 'surviving phase/spike references appear only in the collapsed short-pointer form' is NOT met: 108 attributive references (e.g. 'the Phase 64 fix') were deliberately reported instead of collapsed, because 'the see phase 64 fix' is ungrammatical. phase-ref/spike-ref gate rows stay red until plan 151-08.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T07:05:45.227Z",
    "resolved_at": null
  },
  {
    "id": 10,
    "kind": "deviation",
    "phase": "151",
    "file": ".planning/phases/151-ship-v0-2-akita-review-stack/151-HYGIENE-REPORT.md",
    "line": null,
    "description": "151-07 Task 3 acceptance criteria 1 and 2 (zero '.planning/' paths, zero 'Plan NN-NN') are not met: 5 + 2 occurrences survive in Markdown prose and in an ESLint rule message string, both classes the same plan routes to the 151-08 agent pass. Plan-internal contradiction, enumerated in 151-HYGIENE-REPORT.md.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T07:05:45.402Z",
    "resolved_at": null
  },
  {
    "id": 11,
    "kind": "deviation",
    "phase": "151",
    "file": ".planning/phases/151-ship-v0-2-akita-review-stack/151-hygiene-prose-queue.tsv",
    "line": null,
    "description": "7 comment lines were rewritten correctly (reference removed) but read badly after a mid-sentence deletion, e.g. 'See for the trace.' Enumerated as 151-08's prose-polish queue.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T07:05:45.533Z",
    "resolved_at": null
  }
]
````
