---
schema_version: 1
open_count: 4
waived_count: 0
fixed_count: 0
total_count: 4
last_updated: 2026-08-15T10:46:11.858Z
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
  }
]
````
