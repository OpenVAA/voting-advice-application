---
phase: 175
review: 175-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: deferred
    title: "Under the shipped settings an organization with no candidate visible under it is hidden from voters, whatever it answered, and is not told"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Editing the colour throws when the stored colour has no `normal`, a value the new database rule accepts"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "The image branches `_updateEntityProperties` kept are unreachable, and one would store the wrong shape"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "A save that partly succeeds leaves stored properties staged, so a retry uploads the logo again and the user is told nothing was saved"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "Saving an organization's colour discards the stored dark-theme colour"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "One hex-colour normalisation written three times, with four regexes"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "Whether an entity type has names by locale is read from the write-permission map"
  - id: IN-04
    severity: info
    disposition: no_change_needed
    title: "`saved.shortName` is `undefined` where its type says `null`"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "The colour picker carries no description or invalid state"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "`questionsReady` stays false for good when a nominated election is missing from the data root"
open: 0
total: 10
recorded: 2026-10-22T20:04:29.458Z
---

# Phase 175: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | deferred | operator decision (hideIfMissingAnswers default) |
| WR-02 | warning | fixed | b9321736c |
| WR-03 | warning | fixed | 3a93612a4 |
| WR-04 | warning | fixed | fdfc20fe3 |
| IN-01 | info | fixed | 4076471ba (docs; keeping dark colour reverses D-04) |
| IN-02 | info | fixed | b3fca93a2 |
| IN-03 | info | fixed | 65a161c57 |
| IN-04 | info | no_change_needed | getLocalized returns string or null |
| IN-05 | info | fixed | 99dacd267 |
| IN-06 | info | fixed | 267bb8254 |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
