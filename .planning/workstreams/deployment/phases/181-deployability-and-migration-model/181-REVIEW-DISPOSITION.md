---
phase: 181
review: 181-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "The start-up check passes a malformed required value, and `/api/health` then reports a server that fails every page as healthy"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Since the freeze, no automatic gate keeps `schema/` and `migrations/` in step, and the TypeScript parity tests now read the file the database never applies"
  - id: WR-03
    severity: warning
    disposition: open
    title: "`isolated-instance.sh` redacts secrets case-sensitively, unlike the copy of the same helper in `check-drift.sh`"
  - id: WR-04
    severity: warning
    disposition: open
    title: "The `--sigterm` leg of the proxy check reuses whatever image carries the name, so its verdict may describe another commit"
  - id: WR-05
    severity: warning
    disposition: open
    title: "The deployment guide now contradicts the shipped code"
  - id: IN-01
    severity: info
    disposition: open
    title: "The freeze checker accepts a baseline whose version is not `00001`"
  - id: IN-02
    severity: info
    disposition: open
    title: "The checker never validates the shape of `sha256`"
  - id: IN-03
    severity: info
    disposition: open
    title: "No supported deployment path supplies `BUILD_SHA`"
  - id: IN-04
    severity: info
    disposition: open
    title: "`check-seed.sql` gives the same exit status for \"seed data found\" and \"the check could not run\""
  - id: IN-05
    severity: info
    disposition: open
    title: "`DEPLOYMENT_DIAGNOSTICS` is in no template"
  - id: IN-06
    severity: info
    disposition: open
    title: "In the Render blueprint, `ORIGIN` names the custom domain while the frontend URLs name the `onrender.com` host"
  - id: IN-07
    severity: info
    disposition: open
    title: "Shell helpers duplicated across the four new scripts"
  - id: IN-08
    severity: info
    disposition: open
    title: "Historical wording in the parity guard"
open: 13
total: 13
recorded: 2026-10-21T07:10:01.483Z
---

# Phase 181: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |
| IN-08 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
