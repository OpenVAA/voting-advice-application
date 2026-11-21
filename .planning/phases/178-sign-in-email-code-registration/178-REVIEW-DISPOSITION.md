---
phase: 178
review: 178-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "Sign-in and recovery mails to any invited or registered address are limited to one a minute per project, with no longer window, so an anonymous caller can flood a known address and keep its links from working"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Anyone holding an open registration code can mail any address once a minute without limit and create an auth account for each address"
  - id: WR-03
    severity: warning
    disposition: deferred
    title: "The auth callback consumes a single-use token on a plain cross-site GET, which allows login CSRF (session fixation) and lets mail-link scanners spend the token before the user opens it"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "A request for a sign-in link with a used code spends the claimant's password-attempt budget"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "The code sign-in screen and its action are refused while answers are locked or the code mode is switched off, although they are a sign-in rather than a registration"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "The entry-route gate runs only on server-handled requests"
  - id: IN-04
    severity: info
    disposition: deferred
    title: "Accounts holding only a global or account-level grant have no password recovery path any more"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "The code sign-in probably shares one per-IP auth-service bucket across all users (unverified on hosted)"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "An ESLint allowlist comment edited in this phase has stale counts and breaks the comment-hygiene rules"
open: 0
total: 9
recorded: 2026-10-22T20:04:29.835Z
---

# Phase 178: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 4a32bb33c (= 174 WR-02) |
| WR-02 | warning | fixed | 4a32bb33c (= 174 WR-01) |
| WR-03 | warning | deferred | operator decision U-30 / 178-CONTEXT D-18 |
| IN-01 | info | fixed | 4a32bb33c |
| IN-02 | info | fixed | e18da6138 documented (J5) |
| IN-03 | info | fixed | 0e85f29ed documented |
| IN-04 | info | deferred | operator decision, recovery for global/account-only grants |
| IN-05 | info | fixed | 879d51daf documented residual (= 174 IN-04) |
| IN-06 | info | fixed | af7695c69 |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
