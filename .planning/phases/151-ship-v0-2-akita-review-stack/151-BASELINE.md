---
phase: 151-ship-v0-2-akita-review-stack
plan: 03
artifact: baseline
captured: 2026-08-16

# --- Task 1: the criterion-5 pin (D-01, C-11) ---
pre_sweep_tip: fe91f3099e923039837bf88516f8ce14ded4078c
context_snapshot_sha: 94be73a61c8facf33770a845c8ed67cbe3ff15af
snapshot_is_ancestor: true
snapshot_drift_commits: 15
snapshot_drift_touches_source: false
backup_worktree_path: /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd-backup
backup_head_detached: true
hooks_path: /dev/null
worktrees_before: 7
worktrees_after: 8
---

# Phase 151 — Baseline Record

**Everything this phase later calls "fixed" is measured against this file.** It is captured before
any plan mutates `feat-gsd-roadmap`, so a value recorded here cannot have been influenced by the
work it will be used to judge.

Every number below carries the command that produced it. A value without a command is an
assumption, and this phase has already been bitten twice by inheriting one (C-5's mis-attributed
725; A5's unmeasured lint state).

---

## The pin (criterion 5, D-01)

| Field | Value |
|---|---|
| Pre-sweep tip (**resolved at execution time**) | `fe91f3099e923039837bf88516f8ce14ded4078c` |
| `151-CONTEXT.md` D-01 snapshot | `94be73a61c8facf33770a845c8ed67cbe3ff15af` |
| Snapshot is an ancestor of the pin | **yes** (`git merge-base --is-ancestor` → exit 0) |
| Commits of drift between them | **15** |
| Backup worktree | `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd-backup` |
| Backup HEAD state | detached (`git symbolic-ref -q HEAD` → exit 1) |
| Backup working tree | clean (`git status --porcelain` → empty) |
| `core.hooksPath` in this checkout | `/dev/null` (worktree-local override) |

### Producing commands

```
$ git rev-parse feat-gsd-roadmap
fe91f3099e923039837bf88516f8ce14ded4078c

$ git rev-parse 94be73a61
94be73a61c8facf33770a845c8ed67cbe3ff15af

$ git merge-base --is-ancestor 94be73a61 feat-gsd-roadmap; echo $?
0

$ git rev-list --count 94be73a61..fe91f3099
15

$ git worktree add --detach ../voting-advice-application-gsd-backup fe91f3099e923039837bf88516f8ce14ded4078c
Preparing worktree (detached HEAD fe91f3099)
HEAD is now at fe91f3099 docs(151-02): complete Wave-0 verification and report tooling plan

$ git -C ../voting-advice-application-gsd-backup rev-parse HEAD
fe91f3099e923039837bf88516f8ce14ded4078c

$ git -C ../voting-advice-application-gsd-backup symbolic-ref -q HEAD; echo $?
1                                   # non-zero == detached, which is the requirement

$ git -C ../voting-advice-application-gsd-backup status --porcelain
                                    # empty

$ git config --get core.hooksPath
/dev/null

$ git worktree list | wc -l         # before: 7   after: 8
```

`git worktree list` after the add — all seven pre-existing paths still present, four agent
worktrees still **locked** and untouched, one new entry:

```
/Users/…/voting-advice-application                             5b48cab39 [deploy-young-votes-mockup-vaa]
/Users/…/voting-advice-application-gsd                         fe91f3099 [feat-gsd-roadmap]
/Users/…/voting-advice-application-gsd-2                       6a5209148 [deploy-nuorten-vaalikone-2025]
/Users/…/voting-advice-application-gsd-backup                  fe91f3099 (detached HEAD)      ← new
/Users/…/.claude/worktrees/agent-a37e1f33985fba46d             e20151769 […] locked
/Users/…/.claude/worktrees/agent-a5b3afe4607f057a9             0c3cea154 […] locked
/Users/…/.claude/worktrees/agent-ae553bd6b747d72a8             8148e01f4 […] locked
/Users/…/.claude/worktrees/agent-af0317d08d973c05e             39d97da2a […] locked
```

### Why the two SHAs differ, and why the difference is harmless

C-11 anticipated drift and forbade hard-coding `94be73a61`. The drift is real — 15 commits — but
its **content** is the reassuring part. All fifteen are Phase 151's own planning and tooling
commits:

```
$ git log --oneline 94be73a61..fe91f3099
fe91f3099 docs(151-02): complete Wave-0 verification and report tooling plan
e4cf979f9 feat(151-02): add slice-overlap-matrix.sh for criterion 6
5816cac31 feat(151-02): add hygiene-grep-report.sh for criterion 3
b9570dc6c feat(151-02): encode criterion 4.1-4.6 as verify-commit-taxonomy.sh
c83472e65 docs(151-01): complete byte-identity tracer plan
b4eeeea6d docs(151-01): summarize byte-identity tracer plan
bb9b57941 docs(151-01): record the dry-run byte-identity proof
698ffc98d feat(151-01): add stack-construction scripts and prove the pipeline end to end
ca10b9736 docs(151): create phase plan
52d5d9f48 docs(151): create phase plan — 19 plans, tracer-first, 17 waves
f8af2d779 docs(151): map phase patterns to in-repo analogs
01624f828 docs(151): add validation strategy
f34bdf51e docs(151): research phase domain
55415cf5a docs(state): record phase 151 context session
41d23af71 docs(151): capture phase context
```

Not one of them touches shipped source:

```
$ git diff --name-only 94be73a61..fe91f3099 -- . ':(exclude).planning'
.planning/phases/151-…/scripts/…      # (only the phase-local scripts, all under .planning/)
```

So the pin is a **strict superset** of D-01's intent: it contains everything `94be73a61` contained,
plus this phase's own paperwork, and **zero** sweep edits. The reiterative history criterion 5
exists to preserve is fully inside it.

**Deviation from the plan's precondition, recorded rather than waved through.** Task 1's
precondition reads "`feat-gsd-roadmap` is the current branch and Phase 150 is complete". The first
clause holds. The second does **not**: `.planning/phases/` contains 137–140 and 151 only — phases
141–150 have no directories and have not run. The precondition's stated *reason* ("so the tip about
to be pinned is the real pre-sweep tip rather than a mid-phase state") is nonetheless satisfied, and
by a stronger route than the one it assumed: the working tree is clean, no phase is mid-execution,
and the 15 drift commits are provably source-free. Proceeding was therefore correct on the
precondition's own logic, but the literal clause is false and is recorded here so no later reader
infers that phases 141–150 ran.

**Consequence to be aware of:** if phases 141–150 are executed *after* this pin and *before* the
sweep, this backup will not contain their commits. The pin would then need re-taking. It does not
need re-taking for work that lands after the sweep begins — that is what criterion 7's byte-identity
proof against the post-sweep tip covers.
