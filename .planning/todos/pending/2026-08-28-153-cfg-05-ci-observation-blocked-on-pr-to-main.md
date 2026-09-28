---
title: REVIEW-CFG-05 — the skill-drift audit step has never been observed green on a real workflow run (and the one run it ever had, FAILED before printing a single skill line)
created: 2026-08-29
updated: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 08
priority: medium
suggested_phase: 163-ci-hardening
keywords: [REVIEW-CFG-05, skill-drift-check, audit-skill-drift, main.yaml, ci-trigger, workflow_dispatch, integration-branch, bash5, set-e, D9, D-B1, D-N2, deferred-verification, gh-run-view, phase-160]
---

# The skill-drift audit's first *green* CI run is unobserved

> Filename note: the `2026-08-28-` slug is the name plan `153-08` reserved for this file at planning
> time. It was actually written on **2026-08-29**, which is what the frontmatter dates say.

## Read this first — what is blocked, and what is not

**Blocked: the observation.** REVIEW-CFG-05's own words are *"observed running green against its
script on a real workflow run"*. No workflow run has been observed, so the requirement stays
**Pending** in `.planning/REQUIREMENTS.md`. It was **not** force-marked, per the standard `153-05`
set with `REVIEW-CFG-08`.

**Not blocked, and already discharged on evidence by plan `153-08`:**

- **The script exists and the call is real.** `.claude/scripts/audit-skill-drift.sh`;
  `.github/workflows/main.yaml:34` runs it. The roadmap's premise that it must be "added or removed"
  was already retired before this plan.
- **The script is not inert.** Five of eight skills declare real, existing `targets:` directories;
  two declare `[]` and one omits the key.
- **The script can now run to completion on the CI runner's shell.** It could not before. Commit
  `7d6aaac47` fixed four `((VAR++))` sites that abort under `set -e` on bash 5. Measured, not
  inferred — `153-BASH5-REPRODUCTION.md`, verdict **CONFIRMED**.

## Why "green" is not claimable today, on either half

**1. No run.** The `skill-drift-check` job has existed in exactly **one** workflow run ever:
`32058994754` (PR #860 `feat-gsd-roadmap` → `main`, 2026-08-17), which **failed** — banner, then
`Process completed with exit code 1`, with no per-skill line and no trailer. That is the script
failing to *start*, not the audit reporting drift. Nothing has run it since.

**2. Not green locally either, by design.** At `c1f43b30d` the audit exits **1** with exactly
`filters` and `matching` drifting. Per operator ruling **D9**
(`.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § D9) those two belong to **Phase 160
(`agent-docs-skills-refresh`, wave H)**; they are outside `153-08`'s scope and were deliberately not
touched. Their drift comes from Phase 152's sweeps (`dce80642f`, `87e02f40b`) and is **0 non-comment
changed lines** in both cases.

**So the observation has a prerequisite that is not merely "a PR": Phase 160 must first bring
`filters` and `matching` green, or the run will legitimately be red.**

## Why it cannot be observed from this branch

Measured 2026-08-29, not assumed:

- `.github/workflows/main.yaml` declares exactly two triggers: `push` to `main`, and `pull_request`
  (`opened`/`synchronize`/`reopened`/`ready_for_review`) with `branches: [main]`.
  `grep -c workflow_dispatch .github/workflows/main.yaml` → **0**. Adding one is assigned to `163-01`
  by ruling **D3**, not to Phase 153.
- The branch is `integration/ship-12-squash`, **235 commits** ahead of `origin/main`
  (`git rev-list --count origin/main..HEAD`).

## Two facts that make the discharge condition sharper than "the next PR onto `main`"

Both measured; both would otherwise waste a run.

1. **`origin/main` does not carry the job at all.**
   `git show origin/main:.github/workflows/main.yaml` contains no `skill-drift-check`. A push to
   `main` will not run it. This is why runs `33043573890` and `32112367906` — both `main` pushes —
   contain no such job.
2. **PR #860 carries the job but also the *unfixed* script.**
   `git show origin/feat-gsd-roadmap:.claude/scripts/audit-skill-drift.sh | grep -c '((.*++))'` → **4**.
   Re-triggering #860 as it stands reproduces the same bash-5 abort.

**Discharge condition, in full:** a branch that carries **all three** of — (a) the `skill-drift-check`
job, (b) commit `7d6aaac47` (the four-site fix), and (c) Phase 160's resolution of `filters` and
`matching` — has an open pull request against `main`, or is merged to `main`.

Note that `#860`, `#861`, `#862` and `#863` are all currently open against `main`, so a PR onto
`main` is not itself the scarce thing; carrying (a)+(b)+(c) is.

## What to observe, and how

```bash
# 1. Find the run for the triggering commit
gh run list --repo OpenVAA/voting-advice-application --workflow=main.yaml --limit 10 \
  --json databaseId,headBranch,event,conclusion,headSha

# 2. Confirm the job exists AND concluded success -- both halves
gh run view <run-id> --repo OpenVAA/voting-advice-application --json jobs \
  --jq '.jobs[] | select(.name=="skill-drift-check") | {name, conclusion, url}'

# 3. Capture the step's log verbatim -- the eight per-skill lines and the trailer are the point.
#    An empty log under the banner means the abort is BACK, not that the audit passed silently.
gh run view <run-id> --repo OpenVAA/voting-advice-application --log --job=<job-id>
```

**Read the log, do not just read the conclusion.** The distinguishing evidence is the presence of the
eight per-skill lines and the `Checked: … Drifted: … Skipped: …` trailer. A `success` conclusion with
no per-skill output would mean something else changed.

## Where the observation goes when it is made

Append a CI section to
`.planning/phases/153-build-tooling-config-correctness/153-NEGATIVE-CONTROL.md` (assembled by plan
`153-09`), under **Row 5**. Quote the log verbatim, name the run id and the commit SHA, and state
which of the two "not green" reasons above each observation closes. Then update REVIEW-CFG-05's row
in `.planning/REQUIREMENTS.md` **through the sanctioned tooling** (`requirements mark-complete`) —
never by hand-editing the table — and move this file to `.planning/todos/done/`.

## Cross-links — items that discharge on the same event

- `.planning/todos/pending/2026-08-28-153-cfg-02-ci-observation-blocked-on-pr-to-main.md` — the
  sibling filing for REVIEW-CFG-02, owned by plan `153-03`. **This file is the one it forward-declared
  as "not yet written at the time of this filing"; that note has been updated now that this file
  exists.** The two discharge together: one run produces both observations.
- `.planning/STATE.md` § Deferred Items — the **Phase 137** row (*"Task 2: observed CI run on both
  jobs (E2E + `e2e-visual`)"*), operator-accepted 2026-08-13, blocked on exactly the same trigger
  fact and carrying its own open risk **T-137-11**. Same run discharges it.
- `.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § **D9** — the ruling that hands `filters` and
  `matching` to Phase 160 and replaces `153-08`'s `exit 0` must-have. § **D3** — the ruling assigning
  the trigger change to `163-01`.
- `.planning/phases/153-build-tooling-config-correctness/153-NC-ROW-5-CFG-05.md` — the local evidence
  this filing is the boundary of: the refutation, the two distinguished failures, the measured root
  cause, the resolution, and the snapshot caveat.
- `.planning/phases/153-build-tooling-config-correctness/153-BASH5-REPRODUCTION.md` — the measured
  bash-5 reproduction the fix was gated on.
- `.planning/todos/pending/2026-08-28-153-skill-drift-gate-trigger-sensitivity.md` — the design
  question about whether this gate should be blocking at all. If it is made advisory, **this filing's
  premise changes** and it should be re-read rather than mechanically discharged.

## Tags

`REVIEW-CFG-05` `ci-observation` `deferred-verification` `blocked-on-pr-to-main` `phase-160`
