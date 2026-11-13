---
phase: 173
review: 173-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "Per-entity answer drafts are not scoped to the user and survive every sign-out except the menu's logout, so one organization editor can inherit and save another's unsaved answers"
  - id: IN-01
    severity: info
    disposition: deferred
    title: "A revoked editor grant keeps write access from an already-open entity page until the token is reissued"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "The `uuid` matcher admits upper-case ids, but entity membership is compared case-sensitively"
  - id: IN-03
    severity: info
    disposition: deferred
    title: "A signed-in user with no entity has no way to reach account settings"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "`triggerLogout`'s direct path does not catch a rejected logout"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "Comment-hygiene residue in comments the phase edited"
open: 0
total: 6
recorded: 2026-10-22T20:04:29.090Z
---

# Phase 173: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 038f0c685, a9f7c2511 |
| IN-01 | info | deferred | operator decision (revocation at token refresh) |
| IN-02 | info | fixed | 1ac77f4e7 |
| IN-03 | info | deferred | b7ef8feaf documented; operator decision |
| IN-04 | info | fixed | 6c9cb704c |
| IN-05 | info | fixed | 444778c0e |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
