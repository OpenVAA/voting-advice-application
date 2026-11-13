---
phase: 170
review: 170-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "The logout endpoint answers success when the sign-out failed, and its caller ignores the answer, so the httpOnly session cookies can survive a \"logout\""
  - id: IN-01
    severity: info
    disposition: fixed
    title: "The rename codemod rewrote a historical codemod's mapping table and the agent spike sources into names that never existed"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "The admin login page's error parameter is documented as `ContestantLoginError` and is looked up with `in`"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "The per-app notification spec's \"strict cross-route absence\" checks only the dialog already filtered to the route's own marker"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "The app-name search gate skips a tracked file it cannot read, without saying so"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "The rename changed a public template key, and the comment justifying its retention names consumers that do not exist"
open: 0
total: 6
recorded: 2026-10-22T20:04:28.647Z
---

# Phase 170: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | eeea064cf |
| IN-01 | info | fixed | 049a7f5d7, 0836d228e (records marked) |
| IN-02 | info | fixed | eeea064cf |
| IN-03 | info | fixed | 21f7eeb36 |
| IN-04 | info | fixed | 0a9ac0b04 |
| IN-05 | info | fixed | 5c6dc4258 (comment; template removal is an operator decision) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
