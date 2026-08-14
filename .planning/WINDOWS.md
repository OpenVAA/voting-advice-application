---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-08-14T13:16:36.218Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 139 | deviation | .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md |  | Plan 06 Rule-3 deviation: § 6's 'not yet written' placeholder converted to an explicit plan-07 reservation to satisfy task 2's repo-wide no-placeholder gate without pre-empting criterion 4 | open |  | 2026-08-14T13:16:36.218Z |  |

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
  }
]
````
