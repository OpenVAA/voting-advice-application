---
phase: 177
review: 177-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "The whole-set write has no concurrency check, so a stale editor silently deletes or reverts other writers' nominations"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "A nomination's constituency is never checked to belong to its election, and `set_entity_nominations` accepts any constituency of the project"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "The reach is computed twice, in SQL and in TypeScript, and the two disagree on a NULL round, with no test holding the two shape matrices equal"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "`set_entity_nominations` resets the caller's constraint mode to DEFERRED unconditionally"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "`get_nomination_parent_options` accepts an unbounded `p_contests`"
  - id: IN-03
    severity: info
    disposition: deferred
    title: "The answers lock is not enforced on nominations server-side"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "`desiredParentOf` names the parent's type as `parentRule.types[0]`, not the chosen option's type"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "The three RPC-answer parsers are copies of one another"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "The details step swallows lookup errors into a loading state that never ends"
  - id: IN-07
    severity: info
    disposition: fixed
    title: "A `requestedParentOrganization` key with any value, JSON null included, satisfies the parent-required rule"
open: 0
total: 10
recorded: 2026-10-22T20:04:29.714Z
---

# Phase 177: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | a4be1eaaf |
| WR-01 | warning | fixed | a4be1eaaf, 456b5ee17 |
| WR-02 | warning | fixed | a4be1eaaf, 98d66dd33 |
| IN-01 | info | fixed | a4be1eaaf |
| IN-02 | info | fixed | a4be1eaaf |
| IN-03 | info | deferred | operator decision (answers lock frontend-only) |
| IN-04 | info | fixed | effc5d211 |
| IN-05 | info | fixed | 6d144f3f8, a633bf167 |
| IN-06 | info | fixed | 17a714b9d |
| IN-07 | info | fixed | a4be1eaaf |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
