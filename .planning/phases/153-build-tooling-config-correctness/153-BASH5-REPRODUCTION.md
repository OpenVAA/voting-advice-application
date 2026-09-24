# 153-BASH5-REPRODUCTION — measuring the `((VAR++))` abort of `audit-skill-drift.sh`

- **Phase:** 153-build-tooling-config-correctness
- **Plan:** 153-08, Task 1
- **Subject:** `.claude/scripts/audit-skill-drift.sh` — why it aborted after its banner in CI run `32058994754` while completing on this host
- **Status of the diagnosis before this document:** UNMEASURED. `153-RESEARCH.md` § G.3 records the bash-5 half as inference only, and § Assumptions Log row **A1** says so in terms: *"the bash-5 reproduction is **unmeasured** (no bash ≥ 4 installed; Docker daemon down) … Treat the mechanism as a strong, log-consistent hypothesis, and have the plan confirm it on a Linux runner before fixing."*
- **Verdict of this document:** **CONFIRMED**

## Environment

```
date (UTC)      2026-08-29T18:24:49Z
repo root       /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD        d7edc3da29f15456f16cdf5acd21e7639e929ad6
git branch      integration/ship-12-squash
OS              macOS 26.5.1 arm64
Node            v24.14.1
Yarn            4.13.0
Docker          Docker version 29.7.2, build a7dcaa6  (daemon server version 29.7.2)
host bash       GNU bash, version 3.2.57(1)-release (arm64-apple-darwin25)
```

Caveat: `git status` readings in this document are **scoped** (`git status --porcelain -- <path>`).
The tree carries other in-flight phase work; an unscoped clean tree is not claimed.

---

## 1. Route taken, and why the other two were not

`153-08` Task 1 offers three routes in cost order: (1) Docker, (2) a locally installed bash ≥ 4,
(3) a throwaway CI branch.

**Route 1 (Docker) was used.** Both the minimal reproduction *and the whole real script against real
git* were run under bash 5 in a container — the stronger of the two forms the task describes, because
it exercises the actual call site at `:122` rather than a model of it.

- **Route 2 (install a local bash ≥ 4) was not needed.** It is only preferred when Docker is down.
- **Route 3 (throwaway CI branch) was not needed and not used.** Nothing was pushed to the remote;
  `.github/workflows/main.yaml` was not touched. T-153-35 therefore does not arise.

### A falsified premise about the environment — recorded rather than propagated

`153-RESEARCH.md` § G.3 records the Docker daemon as **down** (`docker info` times out), and the plan
repeats that as a reason to expect route 2. **That is no longer true, and my own first probe of it was
itself a false negative.** The probe I ran was:

```
timeout 20 docker info >/dev/null 2>&1 && echo "DOCKER UP" || echo "DOCKER DOWN/slow"
```

which printed `DOCKER DOWN/slow`. The tool shell is `zsh` and has **no `timeout` binary**
(`(eval):1: command not found: timeout`), so the left operand of the `&&` failed for a reason that had
nothing to do with Docker. Re-probed directly:

```
$ docker info --format '{{.ServerVersion}}'
29.7.2
```

The daemon is **up**. This is a textbook instance of the standing hazard that a scan can report a
clean-looking answer while examining nothing — here, a wrapper that does not exist swallowing the
measurement. The corrected reading is what routed this task to Docker.

Secondary note: `docker pull bash:5` from Docker Hub did not complete (still at
`Unable to find image 'bash:5' locally` after 5 minutes). It was **not needed** — two images already
present on this host from the Supabase stack ship bash 5.2, one musl and one glibc, and both were used:

| Image (already local) | bash | libc |
|---|---|---|
| `public.ecr.aws/supabase/postgres:17.6.1.095` | `GNU bash, version 5.2.37(1)-release (aarch64-alpine-linux-musl)` | musl |
| `public.ecr.aws/supabase/edge-runtime:v1.73.0` | `GNU bash, version 5.2.15(1)-release (aarch64-unknown-linux-gnu)` | glibc |

The GitHub runner is Ubuntu 24.04 (glibc, bash 5.2.21). The glibc 5.2.15 image is the closer analogue;
both were run to show the behaviour is a bash-version property, not a libc one.

---

## 2. The reproduction source, verbatim

`/tmp/…/scratchpad/repro.sh` — a minimal model of `audit-skill-drift.sh` `:6` (`set -euo pipefail`),
`:58` (`((CHECKED++))` as a function's first statement, counter at 0) and `:122` (the function as the
**final** operand of an AND-list, the one position `set -e`'s AND-list exemption does not cover):

```bash
#!/usr/bin/env bash
# Minimal model of .claude/scripts/audit-skill-drift.sh:6/:58/:122
set -euo pipefail

CHECKED=0

audit_skill() {
  local skill_dir="$1"
  ((CHECKED++))
  printf "  PER-SKILL LINE reached for %s (CHECKED=%d)\n" "$skill_dir" "$CHECKED"
}

echo "Skill Drift Audit"
echo "================="

# The exact call shape: function as the FINAL operand of an AND-list.
skill_dir="/tmp"
[[ -d "$skill_dir" ]] && audit_skill "$skill_dir"

echo "---"
echo "TRAILER Checked: $CHECKED"
```

---

## 3. Minimal reproduction — measured output and exit code, both shells

### 3a. Host, `GNU bash, version 3.2.57(1)-release (arm64-apple-darwin25)` — does **not** abort

```
$ bash --version | head -1
GNU bash, version 3.2.57(1)-release (arm64-apple-darwin25)
$ bash repro.sh; echo "EXIT=$?"
Skill Drift Audit
=================
  PER-SKILL LINE reached for /tmp (CHECKED=1)
---
TRAILER Checked: 1
EXIT=0
```

**Exit code 0.** The function's `printf` was reached; the trailer was reached.

### 3b. Container, `GNU bash, version 5.2.37(1)-release (aarch64-alpine-linux-musl)` — **aborts**

```
$ docker run --rm --entrypoint /bin/bash -v "$SCR/repro.sh:/repro.sh:ro" \
    public.ecr.aws/supabase/postgres:17.6.1.095 /repro.sh; echo "EXIT=$?"
Skill Drift Audit
=================
EXIT=1
```

**Exit code 1.** Neither the function's `printf` nor the trailer was reached.

### 3c. Container, `GNU bash, version 5.2.15(1)-release (aarch64-unknown-linux-gnu)` — **aborts**

```
$ docker run --rm --entrypoint /bin/bash -v "$SCR/repro.sh:/repro.sh:ro" \
    public.ecr.aws/supabase/edge-runtime:v1.73.0 /repro.sh; echo "EXIT=$?"
Skill Drift Audit
=================
EXIT=1
```

**Exit code 1.** Identical on glibc and on musl.

---

## 4. The whole real script under bash 5, with real git — the stronger evidence

The worktree was mounted read-only into the bash-5.2.37 container together with the parent
repository's `.git` (this checkout is a **linked worktree**: `.git` is a file pointing at
`…/voting-advice-application/.git/worktrees/voting-advice-application-gsd`), and `git` was installed
in the container so the script's `git log` / `git rev-list` / `git diff` calls execute for real:

```
$ docker run --rm --entrypoint /bin/sh \
    -v "$GSD:/repo:ro" -v "$PARENT/.git:/parentgit:ro" -w /repo \
    -e GIT_DIR=/parentgit/worktrees/voting-advice-application-gsd \
    -e GIT_WORK_TREE=/repo \
    -e GIT_CONFIG_COUNT=1 -e GIT_CONFIG_KEY_0=safe.directory -e 'GIT_CONFIG_VALUE_0=*' \
    public.ecr.aws/supabase/postgres:17.6.1.095 \
    -c 'apk add --no-cache git >/dev/null 2>&1; bash .claude/scripts/audit-skill-drift.sh; echo "EXIT=$?"'
```

Git was verified live in that container before the run (`git rev-parse HEAD` →
`d7edc3da29f15456f16cdf5acd21e7639e929ad6`; `git log -1 --format=%H -- .claude/skills/data/` →
`14afb2d80a9eaf47f8e1e1424ac07f65d1500e2a`), so the abort below is not a missing-git artefact.

**Verbatim output, PRE-FIX, bash 5.2.37, real git:**

```

Skill Drift Audit
=================

EXIT=1
```

**Compare the CI log from run `32058994754` (PR #860 → `main`, 2026-08-17), verbatim from
`153-RESEARCH.md` § G.3:**

```
##[group]Run .claude/scripts/audit-skill-drift.sh
.claude/scripts/audit-skill-drift.sh
shell: /usr/bin/bash -e {0}
##[endgroup]

Skill Drift Audit
=================

##[error]Process completed with exit code 1.
```

Banner, blank line, nothing else, exit 1 — the reproduction matches the CI failure line for line.

**Verbatim output, PRE-FIX, host bash 3.2.57, same tree, same HEAD:**

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

Exit code **1** — but a *different* exit 1: eight per-skill lines and a trailer, i.e. the script ran to
completion and reported real findings. The two failures must not be conflated.

---

## 5. Mechanism, now measured rather than inferred

`((VAR++))` is a **post**-increment: it evaluates to the counter's *old* value. Bash's arithmetic
command returns exit status 1 when the expression evaluates to 0. With `SKIPPED=0` — which is the state
on the very first skill audited (`architect`, `targets: []`, taking the `:52-56` branch) — `((SKIPPED++))`
evaluates to `0` and therefore **returns 1**.

`set -euo pipefail` is in force at `:6`. The call site at `:122` is

```bash
[[ -d "$skill_dir" ]] && audit_skill "$skill_dir"
```

where `audit_skill` is the **last** command of the AND-list. `set -e`'s exemption covers every operand
of an AND-OR list *except* the last, so errexit is live inside the function body — and the failing
arithmetic command kills the script before its `printf`.

**What is version-dependent** is whether errexit propagates into a function body invoked from that
position. Bash 3.2 does not abort (3a); bash 5.2 does (3b, 3c, and § 4). Ubuntu 24.04 runners ship
bash 5.2, so CI takes the aborting path and this host does not — which is exactly why the defect was
invisible locally for as long as it was.

### Site count: **four**, not three — a correction to the research write-up

`153-RESEARCH.md` § G.3 and OQ-1 both name *three* sites (`:53`, `:58`, `:100`). Re-measured on this
tree at HEAD `d7edc3da2`:

```
$ grep -n '((.*++))' .claude/scripts/audit-skill-drift.sh
53:    ((SKIPPED++))
58:  ((CHECKED++))
66:    ((SKIPPED++))
100:    ((DRIFTED++))
$ grep -c '((.*++))' .claude/scripts/audit-skill-drift.sh
4
```

There are **four**. The omitted one is the second `((SKIPPED++))` at `:66`, in the
*skill-exists-but-has-no-commit-yet* branch. The count and the line numbers assert in this plan's
`must_haves.truths` are both **verified exactly as written** — `:53`, `:58`, `:66`, `:100`, four sites,
no fifth. (`:89` and `:90` are `$((…))` arithmetic *expansions*, not arithmetic commands, and their
value is never the script's exit status; they are not defects and are not touched.)

---

## 6. Verdict

**CONFIRMED**

Bash 5.2 aborts, on both musl and glibc, in the minimal reproduction *and* in the real script against
real git, producing byte-for-byte the CI failure shape; bash 3.2 does not. The diagnosis in
`153-RESEARCH.md` § G.3 is measured and upheld, its unmeasured link (A1) is now closed, and its site
count is corrected from three to four.

Because the verdict is CONFIRMED and not FALSIFIED, `153-08` Task 2's precondition is satisfied and the
plan proceeds. Had it been FALSIFIED, Task 2 would not have run.

Scoped tree check for this task — nothing under `.claude/` was modified while producing this document:

```
$ git status --porcelain -- .claude
(empty)
```
