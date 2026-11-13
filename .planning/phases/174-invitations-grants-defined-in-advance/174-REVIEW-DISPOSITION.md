---
phase: 174
review: 174-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "`request-link` with a code is an oracle for whether any address is invited to the project or holds a grant in it"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "One open code lets its holder mail any address and create an auth user for it, once a minute, with no lifetime bound"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "The per-address slot alone lets an anonymous caller flood any invitee or grant holder with mail and keep their mailed links invalid"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "Every mailed link also mints a 6-digit OTP for the address, and the claim trusts whoever verifies it"
  - id: WR-04
    severity: warning
    disposition: deferred
    title: "A claimed invitation blocks re-inviting that address to that target forever, and no API role can remove it"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "A new skip reason from the database turns every sign-in link into a forced sign-out"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "The test-only completion witness is accepted from anonymous production requests"
  - id: IN-03
    severity: info
    disposition: deferred
    title: "Invited admins land in the Contestant App"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "The code sign-in password guesses share the edge function's IP-based auth rate limit"
open: 0
total: 9
recorded: 2026-10-22T20:04:29.212Z
---

# Phase 174: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | 4a32bb33c (174-REVIEW-FIX.md) |
| WR-01 | warning | fixed | 4a32bb33c |
| WR-02 | warning | fixed | 4a32bb33c |
| WR-03 | warning | fixed | 0cc944131 |
| WR-04 | warning | deferred | operator decision, reverses 174-CONTEXT D-07/D-08 |
| IN-01 | info | fixed | 04e48ac41 |
| IN-02 | info | fixed | 07e21ef7a |
| IN-03 | info | deferred | operator decision, Admin-app landing is a product change |
| IN-04 | info | fixed | 879d51daf documented residual, measure on hosted |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
