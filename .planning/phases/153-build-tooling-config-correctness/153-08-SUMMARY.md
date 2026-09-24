---
phase: 153-build-tooling-config-correctness
plan: 08
subsystem: build-tooling
tags:
  [skill-drift, ci-gate, bash-portability, set-e, arithmetic-command, agent-docs, REVIEW-CFG-05, D-B1, D9, D-N2, OQ-1, negative-control]
status: complete
requires:
  - '153-07 (ordering only — 153-08 must run last among the skill-touching plans)'
provides:
  - '`.claude/scripts/audit-skill-drift.sh` — runs to completion under bash 5, which it could not do before (four post-increment sites corrected)'
  - '`153-BASH5-REPRODUCTION.md` — the measured root cause, verdict CONFIRMED, both shells side by side'
  - '`153-NC-ROW-5-CFG-05.md` — the Row 5 evidence fragment, six parts plus 1b and 4b'
  - '`.claude/skills/database/SKILL.md` — one genuinely stale security claim corrected, three new sections, pgTAP counts re-measured'
  - '`.claude/skills/data/SKILL.md` — reviewed no-change, with the evidence that makes it a review rather than a touch'
  - '`.claude/skills/ship-review-stack/SKILL.md` — two earned shell-portability conventions'
  - '`2026-08-28-153-cfg-05-ci-observation-blocked-on-pr-to-main.md` — the blocked half, with a sharpened three-part discharge condition'
  - '`2026-08-28-153-skill-drift-gate-trigger-sensitivity.md` — OQ-1''s design question, filed with its evidence'
affects:
  - 'the `skill-drift-check` job at `.github/workflows/main.yaml:34` — it can now produce output on a runner'
  - 'Phase 160 (`agent-docs-skills-refresh`, wave H) — inherits `filters` and `matching`, attributed and measured'
  - '153-03''s CFG-02 filing — its forward reference to this plan''s sibling todo is now true'
  - '153-09 — Row 5 is ready to assemble into `153-NEGATIVE-CONTROL.md`; REVIEW-CFG-05 stays Pending'
tech-stack:
  added: []
  patterns:
    - 'gate a fix behind a measured reproduction, with a written falsification branch that halts the plan'
    - 'reproduce a version-dependent shell defect in a container already on disk rather than pulling an image'
    - 'resolve a drift gate by READING the drifting commits and recording the read, never by touching the file'
    - 'order commits so a self-reddening edit precedes its own freshness record, then assert the ancestry'
    - 'capture a script''s exit status without a pipe — `| tail` reports tail''s status'
key-files:
  created:
    - .planning/phases/153-build-tooling-config-correctness/153-BASH5-REPRODUCTION.md
    - .planning/phases/153-build-tooling-config-correctness/153-NC-ROW-5-CFG-05.md
    - .planning/todos/pending/2026-08-28-153-cfg-05-ci-observation-blocked-on-pr-to-main.md
    - .planning/todos/pending/2026-08-28-153-skill-drift-gate-trigger-sensitivity.md
  modified:
    - .claude/scripts/audit-skill-drift.sh
    - .claude/skills/data/SKILL.md
    - .claude/skills/database/SKILL.md
    - .claude/skills/ship-review-stack/SKILL.md
    - .planning/todos/pending/2026-08-28-153-cfg-02-ci-observation-blocked-on-pr-to-main.md
decisions:
  - 'Operator ruling D9 applied: the `exit 0` must-have is replaced by "exits 1 with exactly `filters` and `matching` remaining, attributed and filed for Phase 160". Recorded as a named boundary, not as a green tick and not as a plan failure.'
  - 'REVIEW-CFG-05 left **Pending**. `REQUIREMENTS.md` not touched, not hand-edited, no Status cell normalised. The unmet clause is named verbatim.'
  - 'Docker route taken for the bash-5 measurement, using two Supabase images already on disk (bash 5.2.37 musl and 5.2.15 glibc) after `docker pull bash:5` failed to complete. Nothing pushed to the remote; route 3 never used.'
  - 'Pre-increment `((++VAR))` chosen over `VAR=$((VAR + 1))` — same form at all four sites, diff exactly 4/4, file line count unchanged.'
  - '`database`''s stale aud/iss paragraph CORRECTED rather than annotated. A skill that states the opposite of the truth about an authentication path is not a freshness note, it is a defect.'
  - 'The pgTAP count correction attributed as PRE-EXISTING, not blamed on the drift: re-measured at the skill''s own baseline commit it was already 11 files / 264 assertions there.'
  - '`filters` and `matching` given an attribution and a first-pass measurement, explicitly NOT a freshness review — that judgement is Phase 160''s and this plan does not pre-empt it.'
  - '153-03''s CFG-02 todo edited (9 lines) to make its forward reference true, and to record the one asymmetry between the two filings. Deviation Rule 2.'
  - 'No E2E, build or unit run. Derived on this diff: every changed path is under `.claude/` or `.planning/`, both prettier-ignored and both excluded by the comment-hygiene guard''s hard-coded scan roots. Three guards run anyway as a control; all three match baseline exactly.'
metrics:
  duration: ~50 min
  completed: 2026-08-29
  commits: 5
actuals:
  tokens: 23239
  tasks: 3
  commits: 5
  note: 'chars/4 over the authored diff, measured not estimated, on the same scale the estimate used. `d7edc3da2..c48db20ef` is 70 323 chars → 17 581. This SUMMARY is 22 633 chars → 5 658. Total 23 239. Against the plan''s `estimate.tokens: 40000` that is an overestimate of ~1.7×. The estimate budgeted for a three-drift resolution and a green exit; the realised work was one four-line code change plus ~1 000 lines of documentation, and D9 removed two of the four drifts from scope after the estimate was made.'
---

# Phase 153 Plan 08: Skill-Drift Audit CI Step (REVIEW-CFG-05, D-B1, D9) Summary

The skill-drift gate could not run at all on the shell CI uses — measured, not inferred — so it was fixed at four sites, and the two skills this plan owns were brought green by reading their drifting commits rather than by touching their files, which turned up a `database` skill that told every agent the opposite of the truth about an authentication path.

## Commits

| Commit | Message |
| --- | --- |
| `8b42f842a` | `docs(153-08): measure the bash-5 abort of audit-skill-drift.sh -- CONFIRMED` |
| `7d6aaac47` | `fix(153-08): make audit-skill-drift.sh survive bash 5 -- four post-increment sites` |
| `20e61fa40` | `docs(153-08): freshness review of the data and database skills against their drift` |
| `c1f43b30d` | `docs(153-08): ship-review-stack freshness record, after the script edit it follows` |
| `c48db20ef` | `docs(153-08): REVIEW-CFG-05 evidence and the two filings; requirement stays Pending` |

## What was built

### Task 1 — the root cause, measured before any fix was written

RESEARCH assumption **A1** recorded the `((VAR++))` diagnosis as **unmeasured** and asked for
confirmation on a Linux runner before fixing. This project carries a standing lesson that an agent
root-cause diagnosis is flagged UNCONFIRMED and re-tested in isolation before acceptance. Task 1 is
that test, and the plan carried an explicit halt branch had it failed.

| Shell | Minimal reproduction | Whole real script, real git |
| --- | --- | --- |
| `GNU bash, version 3.2.57(1)-release` (host) | prints, exit **0** | eight per-skill lines + trailer |
| `GNU bash, version 5.2.15(1)-release` (glibc) | **aborts**, exit **1** | — |
| `GNU bash, version 5.2.37(1)-release` (musl) | **aborts**, exit **1** | **banner, then nothing, exit 1** |

The bash-5 whole-script run reproduces CI run `32058994754` line for line. Verdict **CONFIRMED**;
Task 2's precondition satisfied.

The whole-script run is the stronger half and it needed real git in a container against a **linked
worktree** — `.git` here is a file pointing into `…/voting-advice-application/.git/worktrees/…`. Solved
by mounting the parent `.git` separately and setting `GIT_DIR` / `GIT_WORK_TREE`, then verifying git
live inside the container (`git rev-parse HEAD` → `d7edc3da29f…`) before trusting the abort as a
finding rather than a missing-binary artefact.

### Task 2 — four sites, four lines

Post-increment evaluates to the counter's *old* value; bash's arithmetic command returns status **1**
when that is 0; `set -euo pipefail` is in force and the function is the **last** operand of the AND-list
at `:122`, the one position `set -e`'s AND-OR exemption does not cover. So the very first skill
audited — `architect`, `targets: []`, taking the `:52-56` branch — killed the script before its first
`printf`.

`git diff --numstat` → **`4 4`**. File stays 135 lines. Zero post-increment forms remain.
`set -euo pipefail` at `:6` and the tail's `exit 1` both intact. No `targets:` parsing, drift-detection
or exit logic touched; no suppression flag or environment variable added.

After the fix, under bash 5.2.37 with real git, the script prints all eight per-skill lines and the
trailer. **That is what this task proves — that it runs to completion.** Under bash 3.2 the output is
byte-identical to the pre-fix baseline.

### Task 3 — the drifts resolved by reading, and the honest half filed

**`database` was genuinely stale, and it is corrected rather than annotated.** Service Patterns § 6
asserted that `identity-callback` binds audience and issuer *"each only when configured"* and that a
deployment configuring neither *"keeps its behaviour instead of failing closed on upgrade"*. Commit
`869a01d60` (155-01, REVIEW-EDGE-05, operator decision O1) made both bindings **unconditional** and
deleted the in-source comment making exactly that argument. The skill was telling every agent that
loads it the opposite of the truth about a publicly reachable authentication path. Rewritten, with the
`jose` presence-vs-value mechanism that makes an optional binding worthless, and a warning not to
reintroduce it. Three new sections (§§ 7–9) cover the rest of the Phase 155 surface the skill had no
account of: `requireEnv` and the byte-identical `envConfig.ts` triplicate, base64url JWT segment
decoding, and the flat-key placeholder contract.

**`data` needed no correction, and the record says why.** `git diff -w <baseline>..HEAD --
packages/data/src/`, comments and blanks filtered, yields **28** changed lines, **every one inside a
`*.test.ts`**. No production source line changed semantically. Recorded as a reviewed no-change with
its evidence — a content-free touch would have reset the audit's baseline while defeating the point of
the audit, which is to make a human look.

**`ship-review-stack` was reddened by this plan's own Task 2** and its record is committed strictly
later, asserted rather than assumed (`git merge-base --is-ancestor 7d6aaac47 c1f43b30d` → true). The
audit was *observed* reporting `ship-review-stack DRIFT 1 commits, 1 files` in between, so the ordering
constraint is demonstrated rather than argued. The record is additive: two earned conventions — never
`((VAR++))` under `set -e`, never read a script's exit status through a pipe.

## Verification

| Claim | How checked | Result |
| --- | --- | --- |
| Root cause measured on real bash 5 | minimal repro + whole script, two bash-5 images, one bash 3.2 host | **CONFIRMED**, both outputs verbatim in `153-BASH5-REPRODUCTION.md` |
| Diff bounded to four lines | `git diff --numstat .claude/scripts/audit-skill-drift.sh` | `4 4`; 135 lines before and after |
| Zero post-increment forms remain | `grep -c '((.*++))'` | `0` |
| Script runs to completion under bash 5 | container run, real git | eight per-skill lines + trailer |
| No bash-3.2 regression | host run | byte-identical to pre-fix baseline |
| Audit end state | run at `c1f43b30d`, exit captured without a pipe | **exit 1, `Drifted: 2`, exactly `filters` and `matching`** — the D9 acceptance |
| Nothing weakened | per-skill `targets:` block compared against `git show HEAD:<path>` | **all eight byte-identical** |
| Empty-`targets:` count unchanged | node scan | still **2** |
| Skill set unchanged | `ls .claude/skills/` | same eight directories + `BOUNDARIES.md` |
| Tail `exit 1` intact | `grep -q '  exit 1'` | present |
| Ordering | `git merge-base --is-ancestor 7d6aaac47 c1f43b30d` | true |
| Artefacts | four files exist, `not been observed` and `32058994754` present in Row 5 | all present |
| Guards (control, not required) | `assert:comment-hygiene`, `assert:edge-env-defaults`, `assert:declared-binaries` | **1579/0, 17/0, 16/0** — baseline exactly |

### Flip tests — both halves, every gate

House rule: a gate that examines nothing also reports green. Every gate below was run red as well as
green.

| Gate | Green half | Red half |
| --- | --- | --- |
| Task 1 verdict marker | real doc → pass | verdict unbolded → `grep -qE '\*\*(CONFIRMED\|FALSIFIED)\*\*'` fails |
| Task 1 both-shells requirement | real doc → pass | bash-3 line masked → fails; bash-5 line masked → fails |
| Task 2 four-line bound | real diff → `4 4` | one extra line appended → `5 4`, gate red |
| Task 2 post-increment count | fixed script → `0` | pre-fix copy → `4`, gate red |
| Task 2 eight-per-skill-line count | full output → `8` | truncated output → `2`, gate red |
| `targets:` byte-identity | all eight identical | `packages/data/src/` narrowed to `…/objects/` in a copy → gate red |
| D9 acceptance (exactly filters + matching) | post-fix output → pass | pre-fix output (4 drifts) → red; output naming the **wrong two** skills → red |
| Row 5 phrase gate | real doc → pass | phrase reworded → red |

The `targets:` byte-identity gate was **broken on its first run and reported green**: the loop built
`HEAD:.claude/skills/data//SKILL.md` (double slash), every `git show` failed, and each skill compared
against the literal string `<absent>` — so all eight reported "CHANGED" against nothing. Caught,
rewritten, and only then flip-tested. Recorded because it is the same failure class the phase exists
to close.

## D9 — the replaced must-have, and what was NOT chased

This plan's `exit 0` must-have is **unreachable as scoped**, and operator ruling **D9** replaced it.
Measured at `d7edc3da2`: `Checked: 5 · Drifted: 4 · Skipped: 3`, true exit **1** — `data` (5 commits,
13 files), `database` (21/69), `filters` (2/1), `matching` (1/3). This plan's `files_modified` covers
`data`, `database` and `ship-review-stack` only.

**End state: exit 1 with exactly `filters` and `matching` remaining.** Both attributed and filed for
**Phase 160 (`agent-docs-skills-refresh`, wave H)**, which owns them:

| Skill | Drifting commits | Non-comment changed lines |
| --- | --- | --- |
| `filters` | `dce80642f` (152-14 unwrap), `87e02f40b` (152-09 sweep) | **0** |
| `matching` | `dce80642f` (152-14 unwrap) | **0** |

Both originate wholly in Phase 152's sweeps, not in anything Phase 153 did — D9's attribution
verified independently here. Recorded as a **named boundary**, exactly as 153-05 did for
REVIEW-CFG-08: not a green tick, not a plan failure.

**Nothing was silenced to reach it.** No `targets:` emptied, narrowed or repointed; no `exit 1`
removed; no skill deleted or renamed; no suppression added. Asserted mechanically and flip-tested, not
promised.

## Requirement disposition — REVIEW-CFG-05 stays Pending

**Not marked complete.** `REQUIREMENTS.md` untouched: not hand-edited, no Status cell normalised, and
`requirements mark-complete` not invoked.

**The exact unmet clause:** *"observed running green against its script on a real workflow run"*.
Unmet twice over, and both halves are stated in the evidence fragment:

1. **No run.** The `skill-drift-check` job has existed in exactly one workflow run ever
   (`32058994754`, PR #860 → `main`, 2026-08-17) and it **failed**, in the abort mode above. Nothing
   has run it since.
2. **Not green, by design.** The audit legitimately exits 1 until Phase 160 resolves `filters` and
   `matching`.

Filed with a discharge condition, per D-N2:
`.planning/todos/pending/2026-08-28-153-cfg-05-ci-observation-blocked-on-pr-to-main.md`.

## Deviations from Plan and falsified premises

Every measurement below overrides an inherited claim. None was papered over.

**1. [D9 — operator ruling] The `exit 0` must-have was replaced mid-flight.**
Covered in full above. 153-07 had already flagged it; D9 ruled it. The plan's truth *"exits 1 … with
DRIFT for `data` and `database`"* undercounts by two.

**2. [Falsified premise] The Docker daemon is UP, and my own first probe of it was a false negative.**
`153-RESEARCH.md` records the daemon as down. My probe —
`timeout 20 docker info >/dev/null 2>&1 && echo UP || echo DOWN` — printed `DOWN`, because this shell
has **no `timeout` binary** (`(eval):1: command not found: timeout`), so the left operand failed for a
reason unrelated to Docker. Re-probed directly: `docker info --format '{{.ServerVersion}}'` → `29.7.2`.
The corrected reading is what routed Task 1 to the cheapest and strongest route. Same failure class as
the `| tail` hazard: a wrapper that does not exist swallowing the measurement.

**3. [Verified as asserted] Four post-increment sites, at `:53`, `:58`, `:66`, `:100`.**
The plan asserted this as a *correction* to RESEARCH § G.3 and OQ-1, which both name three. Re-measured
independently: exactly four, exactly those line numbers, no fifth. (`:89`/`:90` are `$((…))`
*expansions*, not arithmetic commands.) The plan's correction stands as written.

**4. [Falsified premise] "153-07's edit re-reddens `database`" is far weaker than stated.**
`database` was already drifting on 21 commits / 69 files, of which `apps/supabase/` alone is 18 / 66 —
mostly Phase 155's Edge Function work. 153-07's four-line barrel change is a rounding error in it. The
ordering constraint stands; the causal framing does not. (D9 says the same; verified here.)

**5. [Falsified premise] The PR situation is more open than the plan implies.**
The plan's *"of PRs #863-#874 only #863 targets `main`"* is true **for that range**, but measured via
`gh pr list`, **#860, #861, #862 and #863 are all open against `main`** and #875 is merged to `main`. A
PR onto `main` is not the scarce thing. What actually blocks the observation is sharper and was not in
the plan at all:
- **`origin/main` carries no `skill-drift-check` job**, so a push to `main` would not run it either —
  which is why the two `main`-push runs contain no such job;
- **PR #860 carries the job but the *unfixed* script** — `git show
  origin/feat-gsd-roadmap:.claude/scripts/audit-skill-drift.sh | grep -c '((.*++))'` → **4**, so
  re-triggering it today reproduces the same abort.

The discharge condition in the filed todo is rewritten around those two facts: a branch carrying the
job **and** `7d6aaac47` **and** Phase 160's resolution.

**6. [Falsified premise] Commit distance from `origin/main` is 235, not 224.**
`git rev-list --count origin/main..HEAD` at `c1f43b30d`. The briefing says 224 and the sibling CFG-02
filing says 222. All three were true when taken; the evidence fragment records 235 and says so.

**7. [Rule 2 — self-invalidating gate, caught before commit] The plan's own Task 3 verify would have
been red on a correct document.**
It greps Row 5 for `not been observed`. The draft's negation read *"No workflow run **has been
observed**"* — true, emphatic, and not containing the phrase the gate looks for. Fixed by stating the
claim in the gate's own words (*"The step has not been observed running green on a real workflow
run"*), then flip-tested. This is the third instance of the self-invalidating-gate class in this phase,
after 153-06's unanchored `grep -P` and 153-03's bare-string count.

**8. [Rule 2] 153-03's CFG-02 todo edited to make its forward reference true.**
It cross-linked this plan's CFG-05 filing as *"Not yet written at the time of this filing"*. Leaving
that would have created exactly the stale-claim class this phase closes. Updated (9 lines), and the one
**asymmetry** between the two filings recorded: CFG-02's only blocker is the trigger, while CFG-05 has a
second — Phase 160. A run obtained before Phase 160 lands discharges CFG-02 and **not** CFG-05.

**9. [Pre-existing, attributed] `database`'s pgTAP counts were already wrong at its own baseline.**
Claimed "10 test files … 204 tests … ~2,870 lines" while its own Key Source Locations entry said 11
files. Measured today: 11 files, 264 planned assertions, ~3,425 lines. Measured **at the baseline commit
`14afb2d80`**: already 11 files / 264 assertions. Corrected, and attributed as pre-existing rather than
blamed on the drift.

## E2E decision — derived on this diff, not inherited

**No E2E run, and no build or unit run.** Derived independently: `git diff --name-only
d7edc3da2..HEAD` yields **9 files, every one under `.claude/` or `.planning/`**. Both trees are in
`.prettierignore` (lines 1 and 37) and both are excluded by `assert-comment-hygiene.mjs`'s hard-coded
scan roots. `lint:check`'s remaining links — `turbo run lint`, `eslint tests`, the two typechecks, and
the i18n / a11y / edge-env / declared-binaries / node-engine guards — scan paths this diff does not
touch. Zero product code changed.

Three guards were run anyway, as a control against that reasoning rather than because the diff required
it: `1579/0`, `17/0`, `16/0` — baseline exactly.

The phase-close full-suite run is 153-09's, per ruling D1.

`yarn db:lint:sql` not run: pre-existing red, never scored here.

## Known Stubs

None. No stub, placeholder, skipped test or unrun `<verify>` was introduced. Both task verifies were
executed; Task 3's was executed clause by clause with the two D9-superseded clauses reported explicitly
rather than silently dropped.

## Threat Flags

None. The four-line change is bounded and reversible in one revert (T-153-32 mitigated as planned).
T-153-31 (satisfying the criterion by weakening its subject) and T-153-33 (reporting an unobserved run
as observed) were both mitigated and asserted mechanically. T-153-35 does not arise: route 3 was never
used and nothing was pushed to the remote.

## For 153-09 — what Row 5 hands you

- `153-NC-ROW-5-CFG-05.md` is complete and needs no editing to assemble; its Parts 1b and 4b are
  D9-specific and should survive into `153-NEGATIVE-CONTROL.md` intact.
- **REVIEW-CFG-05 must stay Pending.** Do not mark it on the strength of the local run.
- `153-09-PLAN.md` reportedly still carries the older wording *"REVIEW-CFG-02's binding observation"*,
  which the CFG-02 filing itself says is wrong. That correction is 153-09's, flagged here because Row 5
  and Row 6 are assembled into the same document.
- The green recorded is a snapshot at `c1f43b30d`. Verified at execute time: **none** of 153-09, 153-10
  or 153-11 touches a declared skill target, so it holds to the phase's close. 153-11's
  `.planning/phases/152-…/scripts/` path is phase **152**, not the phase-**151** path in
  `ship-review-stack`'s `targets:`.

## Self-Check: PASSED

All five created artefacts exist on disk; all five commit hashes resolve in `git log`.
`.planning/STATE.md` deliberately **not** touched — the operator owns it and reconciles between
plans.
