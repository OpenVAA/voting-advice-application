---
schema_version: 1
open_count: 6
waived_count: 0
fixed_count: 0
total_count: 6
last_updated: 2026-08-15T15:24:14.942Z
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
  }
]
````
