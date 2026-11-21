---
phase: 179
review: 179-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "`confirm-address` throttle is keyed on a caller-chosen `project_id`, so any identity-provider account can mail any address without limit"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "`identity-callback`'s `email_exists` branch resets an existing account's record, and compares the placeholder case-sensitively"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "A verification of the current-address token that completes the change is treated only as a refusal, and the unproved address stays on the account"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "The registration endpoint saves a party's names while answers are locked"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "The `save` intent accepts names of any size and any keys"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "`deleteOrganization`'s docs name only the grant write as its trigger"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "Comment-hygiene residue in a phase-179-edited comment"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "`IdentityProviderGate`'s Log Out stays in its loading state if `logout()` rejects"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "The OIDC callback leaves the flow cookies in place on the provider-error and missing-code paths"
open: 0
total: 9
recorded: 2026-10-22T16:13:21.824Z
---

# Phase 179: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | b1f981564, e9a6c35e4 (179-REVIEW-FIX.md) |
| WR-01 | warning | fixed | d7a205f6f (179-REVIEW-FIX.md) |
| WR-02 | warning | fixed | ee18547d8, 94ba0a87b (179-REVIEW-FIX.md) |
| IN-01 | info | fixed | cfb998291 |
| IN-02 | info | fixed | 4d3321f4a |
| IN-03 | info | fixed | a839bf02f |
| IN-04 | info | fixed | a756755c0 |
| IN-05 | info | fixed | 59ead4090 |
| IN-06 | info | fixed | 2be5f7e2c |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
