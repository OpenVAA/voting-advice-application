# 153-NC-ROW-5-CFG-05 — the skill-drift audit CI step

- **Date:** 2026-08-29
- **Plan:** `153-08-PLAN.md` (wave 2, depends on `153-07`)
- **Requirement:** REVIEW-CFG-05 — *"The skill-drift audit CI step is observed **running green against its script on a real workflow run**, so the call is proven live rather than assumed."*
- **Disposition of the requirement: PENDING.** Not marked complete. The unmet clause is named in Part 5.
- **Decisions discharged / applied:** OQ-1 option (b); operator ruling **D9** (`.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § D9), which **replaces** this plan's `exit 0` must-have; D-B1; D-N2
- **Precedent followed:** `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-NEGATIVE-CONTROL.md`; and `153-05`'s handling of `REVIEW-CFG-08`, which was left Pending rather than force-marked
- **Companion measurement:** `153-BASH5-REPRODUCTION.md` (this plan's Task 1)

## Environment

```
date (UTC):        2026-08-29T18:24:49Z
repo root:         /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:          c1f43b30dcb2836beadaa14c63e5ccb5f6907d37  (the ship-review-stack freshness commit)
git branch:        integration/ship-12-squash
OS:                macOS 26.5.1 arm64 (Darwin)
Node:              v24.14.1
Yarn:              4.13.0
Docker:            29.7.2 (daemon up -- see the correction in Part 3)
host bash:         GNU bash, version 3.2.57(1)-release (arm64-apple-darwin25)
container bash:    GNU bash, version 5.2.37(1)-release (aarch64-alpine-linux-musl)
                   GNU bash, version 5.2.15(1)-release (aarch64-unknown-linux-gnu)
CI runner bash:    bash 5.2 (ubuntu-latest / Ubuntu 24.04)
```

> **Why the bare `git status` is not the gate here.** The tree carries other in-flight Phase 153
> work and `.planning/STATE.md` is written by the orchestrator throughout a run, so the bare form is
> never empty mid-phase. Every tree claim below is **scoped** (`git status --porcelain -- .claude`,
> `git diff --numstat <path>`), and each names its path.

---

## Row 5 — REVIEW-CFG-05

### 1. The refutation: the script is not inert

The briefing this phase was planned from treats criterion 5 as *"evidence of the run, not a code
change"* — i.e. as though the script were a formality. It is not. Measured at HEAD `d7edc3da2`, the
per-skill `targets:` frontmatter is:

| Skill | `targets:` | Audited? |
|---|---|---|
| `architect` | `[]` (inline empty) | no — SKIP |
| `components` | `[]` (inline empty) | no — SKIP |
| `data` | `packages/data/src/` | **yes** |
| `database` | `apps/supabase/`, `packages/supabase-types/` | **yes** |
| `filters` | `packages/filters/src/` | **yes** |
| `matching` | `packages/matching/src/` | **yes** |
| `ship-review-stack` | `.agents`, `.claude/scripts`, `.planning/phases/151-ship-v0-2-akita-review-stack/scripts` | **yes** |
| `spike-findings-voting-advice-application-gsd` | key absent | no — SKIP |

**Two empty, one absent, five real, all five pointing at directories that exist.** The script exits
**1** on this tree. Criterion 5 was unfixed work, not a free observation. This is a correction to the
briefing, recorded so a later reader does not re-derive the false premise.

### 1b. A second correction: **four** live drifts, not two

This plan's own `must_haves.truths` says the script *"exits 1 on this tree today with DRIFT for
`data` and `database`"*. **That undercounts.** Measured independently by the orchestrator and
re-measured here, `filters` and `matching` are also drifting:

| Skill | Drift at `d7edc3da2` |
|---|---|
| `data` | 5 commits, 13 files since 2026-08-17 |
| `database` | 21 commits, 69 files since 2026-08-17 |
| `filters` | 2 commits, 1 file since 2026-08-17 |
| `matching` | 1 commit, 3 files since 2026-08-17 |

`Checked: 5 · Drifted: 4 · Skipped: 3`, true exit **1**. `filters` and `matching` are outside this
plan's `files_modified` and cannot be resolved inside it. Operator ruling **D9** therefore
**replaces** this plan's `exit 0` must-have with: *the audit exits 1 with exactly `filters` and
`matching` remaining, both attributed and filed for Phase 160.* Part 4 records that outcome and Part
4b the attribution.

**Also corrected by D9:** this plan's framing that *"153-07's edit to `packages/supabase-types/`
re-reddens `database`"*. `database` was **already** drifting on 21 commits / 69 files, of which
`apps/supabase/` alone is 18 / 66. The ordering constraint stands; the causal claim does not.

### 2. Two failures, and they are not the same failure

**(a) The local failure — the script runs and reports.** At `d7edc3da2`, under the host's bash
3.2.57, verbatim:

```

Skill Drift Audit
=================

  architect       SKIP  (no targets defined)
  components      SKIP  (no targets defined)
  data            DRIFT  5 commits, 13 files since 2026-08-17
    packages/data/src/  (5 commits, 13 files changed)
  database        DRIFT  21 commits, 69 files since 2026-08-17
    apps/supabase/  (18 commits, 66 files changed)
    packages/supabase-types/  (3 commits, 3 files changed)
  filters         DRIFT  2 commits, 1 files since 2026-08-17
    packages/filters/src/  (2 commits, 1 files changed)
  matching        DRIFT  1 commits, 3 files since 2026-08-17
    packages/matching/src/  (1 commits, 3 files changed)
  ship-review-stack  OK    (synced as of 2026-08-28)
  spike-findings-voting-advice-application-gsd  SKIP  (no targets defined)

---
Checked: 5  Drifted: 4  Skipped: 3

Drifted skills may contain outdated information.
Review target changes and update skill files as needed.
```

Exit **1** — eight per-skill lines and a trailer. The script did its job and found real drift.

**(b) The CI failure — the script never ran.** Run **`32058994754`** (PR #860 `feat-gsd-roadmap` →
`main`, 2026-08-17) is the **only** workflow run in which the `skill-drift-check` job has ever
existed. It concluded `failure`. Its log at the point of failure, verbatim:

```
##[group]Run .claude/scripts/audit-skill-drift.sh
.claude/scripts/audit-skill-drift.sh
shell: /usr/bin/bash -e {0}
##[endgroup]

Skill Drift Audit
=================

##[error]Process completed with exit code 1.
```

Banner, blank line, nothing. **No per-skill line, no trailer.** The skills existed on that branch
(all eight directories plus `BOUNDARIES.md`), so the loop ran with real input and died inside
`audit_skill()` before its first `printf`.

**These are different failures and must not be conflated.** (a) is the gate working. (b) is the gate
being unable to start. Reading (b) as "the audit found drift in CI" is the misreading this section
exists to prevent.

### 3. The measured root cause

Quoted from `153-BASH5-REPRODUCTION.md` rather than re-derived. Verdict: **CONFIRMED**.

`((VAR++))` is a post-increment: it evaluates to the counter's *old* value, and bash's arithmetic
command returns exit status **1** when the expression evaluates to 0. With `SKIPPED=0` — the state on
the very first skill audited, `architect`, whose `targets: []` takes the `:52-56` branch —
`((SKIPPED++))` returns 1. Under `set -euo pipefail` (`:6`), with the function as the **last** operand
of the AND-list at `:122` (`[[ -d "$skill_dir" ]] && audit_skill "$skill_dir"`) — the one position
`set -e`'s AND-OR exemption does not cover — that kills the script before its `printf`.

Measured, not inferred:

| Shell | Minimal reproduction | Whole real script, real git |
|---|---|---|
| `GNU bash, version 3.2.57(1)-release` (host) | prints, exits **0** | eight per-skill lines + trailer, exit 1 on real drift |
| `GNU bash, version 5.2.15(1)-release` (glibc) | **aborts**, exits **1** | — |
| `GNU bash, version 5.2.37(1)-release` (musl) | **aborts**, exits **1** | **banner, then nothing, exit 1** |

The bash-5 whole-script output matches the CI log line for line. RESEARCH assumption **A1** — *"the
bash-5 reproduction is unmeasured … Treat the mechanism as a strong, log-consistent hypothesis"* — is
now closed by execution, in line with this project's standing rule that an agent root-cause diagnosis
is flagged UNCONFIRMED and re-tested in isolation before acceptance.

**Site-count correction: four, not three.** RESEARCH § G.3 and OQ-1 both name three sites (`:53`,
`:58`, `:100`). Measured: `grep -n '((.*++))'` returns `:53`, `:58`, `:66`, `:100` — **four**. The
omitted one is the second `((SKIPPED++))` at `:66`, in the *skill-exists-but-has-no-commit-yet*
branch. This plan asserted the correction at planning time and it is **verified exactly as written**:
four sites, those four line numbers, no fifth. (`:89` and `:90` are `$((…))` arithmetic *expansions*,
not arithmetic commands; they are not defects and were not touched.)

**A measurement hazard recorded twice this session.** `audit-skill-drift.sh | tail; echo $?` prints
`0` — that is **`tail`'s** status, not the script's; the true exit is 1. The same class produced a
false `DOCKER DOWN` reading during Task 1, from a `timeout 20 docker info && … || …` whose left
operand failed because this shell has no `timeout` binary. Both are gates that examined nothing and
reported an answer anyway.

### 4. The resolution

**The fix** (commit `7d6aaac47`): all four post-increment sites converted to pre-increment, which
returns the *new* value and so can never be 0 for a counter being incremented.
`git diff --numstat` reports exactly **4 added / 4 removed**; the file stays 135 lines; `set -euo
pipefail` at `:6` and the tail's `exit 1` are untouched; no `targets:` parsing, drift-detection or
exit logic changed; no suppression flag or environment variable added.

**The drift resolution** (commits `20e61fa40`, then `c1f43b30d`): each drifting commit was read
against the skill's claims before the skill file was touched.

- **`database` had a genuinely stale claim and it is corrected, not annotated.** Service Patterns § 6
  asserted that `identity-callback` binds audience and issuer *"each only when configured"* and that a
  deployment configuring neither *"keeps its behaviour instead of failing closed on upgrade"*. Commit
  `869a01d60` (155-01, REVIEW-EDGE-05, operator decision O1) made both bindings **unconditional** and
  deleted the in-source comment making exactly that argument. Rewritten, plus new §§ 7–9 covering the
  Phase 155 surface the skill had no account of. Its pgTAP counts were also corrected (11 files / 264
  planned assertions / ~3,425 lines, versus the claimed "10 test files … 204 tests … ~2,870 lines"),
  and attributed honestly: re-measured **at the skill's own baseline `14afb2d80`** it was already
  11/264 there, so that was a pre-existing inaccuracy rather than something the drift introduced.
- **`data` was reviewed and needed no correction.** Measured: `git diff -w <baseline>..HEAD --
  packages/data/src/`, comments and blanks filtered out, yields **28** changed lines, **every one
  inside a `*.test.ts` file**. No production source line changed semantically. Recorded as a reviewed
  no-change, with the evidence, rather than as a content-free touch.
- **`ship-review-stack`** was reddened by this plan's own `7d6aaac47`, and its record is committed
  **strictly later** (`git merge-base --is-ancestor 7d6aaac47 c1f43b30d` → true). The record is
  additive: two earned shell-portability conventions (never `((VAR++))` under `set -e`; never read a
  script's exit status through a pipe).

**The post-fix run, at HEAD `c1f43b30d`, verbatim, exit captured directly rather than through a
pipe:**

```

Skill Drift Audit
=================

  architect       SKIP  (no targets defined)
  components      SKIP  (no targets defined)
  data            OK    (synced as of 2026-08-29)
  database        OK    (synced as of 2026-08-29)
  filters         DRIFT  2 commits, 1 files since 2026-08-17
    packages/filters/src/  (2 commits, 1 files changed)
  matching        DRIFT  1 commits, 3 files since 2026-08-17
    packages/matching/src/  (1 commits, 3 files changed)
  ship-review-stack  OK    (synced as of 2026-08-29)
  spike-findings-voting-advice-application-gsd  SKIP  (no targets defined)

---
Checked: 5  Drifted: 2  Skipped: 3

Drifted skills may contain outdated information.
Review target changes and update skill files as needed.
```

`TRUE_EXIT=1`. **This is the D9 acceptance, not a shortfall:** the script now *runs to completion*
under bash 5 — the thing the CI run could not do — and exits 1 with **exactly** `filters` and
`matching` remaining, both outside this plan's scope.

**Nothing was weakened, asserted rather than promised.** All eight `targets:` blocks are byte-identical
to their pre-task values (asserted per skill against `git show HEAD:<path>`, and the assertion
flip-tested: a copy with `packages/data/src/` narrowed to `packages/data/src/objects/` turns the gate
red). The empty-`targets:` count is still **2**. `ls .claude/skills/` still lists the same eight
directories plus `BOUNDARIES.md`. The tail's `exit 1` is still present. No suppression flag or
environment variable exists.

### 4b. `filters` and `matching` — attributed, and handed to Phase 160

Per D9, **Phase 160 (`agent-docs-skills-refresh`, wave H) owns these two.** Measured attribution:

| Skill | Drifting commits | Files | Non-comment changed lines |
|---|---|---|---|
| `filters` | `dce80642f` (152-14, unwrap forced line breaks), `87e02f40b` (152-09, comment sweep) | `packages/filters/src/filter/enumerated/enumeratedFilter.ts` | **0** |
| `matching` | `dce80642f` (152-14) | `packages/matching/src/{distance/metric.ts,index.ts,question/categoricalQuestion.ts}` | **0** |

Both drifts originate entirely in **Phase 152's sweeps**, not in anything Phase 153 did, and both are
**zero non-comment changed lines** — comments and line-wrapping only
(`git diff -w <baseline>..HEAD -- <target>` with comment and blank lines filtered). That is an
attribution and a first-pass reading, **not** a freshness review: whether the skills' *content* is
still true is Phase 160's call, and this document does not pre-empt it.

Filed: `.planning/todos/pending/2026-08-28-153-skill-drift-gate-trigger-sensitivity.md`.

### 5. What is NOT observed

**No workflow run has been observed. The step has not been observed running green on a real
workflow run, and this document does not claim that it has.** Criterion 5's own words are *"observed running green against
its script on a real workflow run"*, and that clause is **unmet**. REVIEW-CFG-05 stays **Pending**.
Two distinct reasons, both stated plainly:

1. **No run.** The only run that ever contained the job is `32058994754`, and it failed, in the mode
   Part 2(b) quotes. Nothing has run it since.
2. **Not green.** Even locally, the script exits 1 at this HEAD, by design and by D9 — `filters` and
   `matching` are Phase 160's. So "green" is not claimable on either half today.

**Why no run can be produced from here — the trigger analysis, measured not assumed:**

- `.github/workflows/main.yaml` declares exactly two triggers: `push` to `main`, and `pull_request`
  (`opened`/`synchronize`/`reopened`/`ready_for_review`) with `branches: [main]`. `grep -c
  workflow_dispatch` returns **0**, and adding one is out of scope here (assigned to `163-01` per
  ruling D3).
- The working branch is `integration/ship-12-squash`, **235 commits ahead of `origin/main`**
  (`git rev-list --count origin/main..HEAD` at `c1f43b30d`; the figure is quoted as 222 in the
  sibling CFG-02 filing and 224 in this plan's briefing — both were true when taken, and this is the
  current one).
- The job is called at **`.github/workflows/main.yaml:34`** (`run: .claude/scripts/audit-skill-drift.sh`).
- Of PRs #863–#874, only **#863** targets `main` — as the plan states, and verified. **But the plan's
  implication that a PR onto `main` is unavailable is weaker than stated:** measured via `gh pr list`,
  **#860, #861, #862 and #863 are all open against `main`**, and #875 is merged to `main`.

**Two further facts that make the discharge condition sharper than "the next PR onto `main`":**

- **`origin/main` does not carry the job at all.** `git show origin/main:.github/workflows/main.yaml`
  contains no `skill-drift-check`. A push to `main` therefore would not run it either — which is why
  runs `33043573890` and `32112367906` (both `main` pushes) contain no such job.
- **PR #860 carries the job but also the *unfixed* script.** `git show
  origin/feat-gsd-roadmap:.claude/scripts/audit-skill-drift.sh | grep -c '((.*++))'` returns **4**.
  Re-triggering #860 today would reproduce the same abort. The observation requires a branch carrying
  **both** the job **and** commit `7d6aaac47`.

Filed with its discharge condition:
`.planning/todos/pending/2026-08-28-153-cfg-05-ci-observation-blocked-on-pr-to-main.md`.

### 6. The green is a snapshot at a named HEAD, not a standing property

The audit's baseline for a skill is *the last commit touching that skill's own directory*, so **any**
later commit under a declared target directory reddens it again until a human re-reviews.

- The state in Part 4 is a snapshot at **`c1f43b30d`** on `integration/ship-12-squash`. It is not a
  property of the repository.
- **This phase's own two edits would have reddened it had the commit ordering been different.**
  `7d6aaac47` (`.claude/scripts/`) reddened `ship-review-stack`, and the audit was observed reporting
  `ship-review-stack DRIFT 1 commits, 1 files` between `20e61fa40` and `c1f43b30d`. The ordering is
  mechanical.
- **Phases 152, 163 and 164 all touch declared target directories** — per this plan's own concurrency
  note, 152 renames a fixture under `packages/data/src/` and sweeps comments across `apps/**`, and 163
  and 164 work in `apps/supabase/`. Any of those reddens `data` or `database` again. (Inherited from
  the plan and not re-verified here — those phases are outside this plan's reach; what *is* verified
  is the rest of Phase 153, next bullet.)
- **Verified for the rest of Phase 153:** none of the remaining plans touches a declared target.
  `153-09` writes only `153-NEGATIVE-CONTROL.md`; `153-10` touches `scripts/`, `package.json`,
  `.env.example`, `packages/dev-seed/tests/` and a phase doc; `153-11` touches
  `.planning/phases/152-…/scripts/` (phase **152**, not the phase-**151** path in
  `ship-review-stack`'s targets), `scripts/assert-comment-hygiene.mjs`,
  `apps/frontend/src/app.css`, `.planning/WINDOWS.md` and `.planning/REQUIREMENTS.md`. None is a
  declared target, so the snapshot holds to the phase's close.

Whether a permanently-blocking gate with that trigger sensitivity is the intent at all is a design
question this plan surfaces rather than answers:
`.planning/todos/pending/2026-08-28-153-skill-drift-gate-trigger-sensitivity.md`.
