---
phase: 172
review: 172-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: deferred
    title: "Terms-of-use acceptance is enforced only by the Contestant App's layout. No server-side write or publication path requires it"
  - id: WR-02
    severity: warning
    disposition: deferred
    title: "No role other than the accepting user can read an acceptance, so acceptance cannot be audited and TOU-03/TOU-F01 cannot be built on this table"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "A failed acceptance read is turned into \"not accepted\", which loops the user on the gate with no error"
  - id: WR-04
    severity: warning
    disposition: deferred
    title: "The project-blind INSERT policy lets any signed-in user write rows into any tenant, and tells them which project ids exist"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "`TermsOfUseGate`'s Logout stays in its loading state if `logout()` rejects"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "An `invalidateAll()` failure after a recorded acceptance is reported as \"save failed\""
  - id: IN-03
    severity: info
    disposition: deferred
    title: "The acceptance does not record which terms were accepted"
open: 0
total: 7
recorded: 2026-10-22T20:04:28.966Z
---

# Phase 172: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | deferred | operator decision (D-05/D-13) |
| WR-02 | warning | deferred | a9ef05df5 documented; operator decision (TOU-F01) |
| WR-03 | warning | fixed | ebd9af1aa |
| WR-04 | warning | deferred | a9ef05df5 documented; operator decision (D-05) |
| IN-01 | info | fixed | 749931cc0 |
| IN-02 | info | fixed | 27c9e3176 |
| IN-03 | info | deferred | operator decision (D-03) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
