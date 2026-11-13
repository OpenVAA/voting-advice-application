---
phase: 171
review: 171-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: deferred
    title: "The screens and the database apply the registration rule to different inputs, so one invalid member of `contestantApp` hides registration in the app while the database still honours it"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "The documentation of the anon endpoint understates what it exposes"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "The accessor's input type contradicts the accessor on an absent matrix row"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "The stored-settings schema docblock describes a failure mode the provider no longer has"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "The base dataset's comment states the replace-by-root merge that phase 171 removed"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "`contestant_app_public_config` returns the stored list and matrix subtrees unbounded"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "The help page's settings docblock omits the setting that decides the name it shows"
open: 0
total: 7
recorded: 2026-10-22T20:04:28.840Z
---

# Phase 171: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | deferred | operator decision (reverses D-05/D-08 or 171-A1) |
| WR-02 | warning | fixed | 26dc7d264 (docs) |
| IN-01 | info | fixed | 9a507a3f7 (docs) |
| IN-02 | info | fixed | 9a507a3f7 (docs) |
| IN-03 | info | fixed | 9a507a3f7 (docs) |
| IN-04 | info | fixed | d74a1cc60 |
| IN-05 | info | fixed | 9a507a3f7 (docs) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
