---
phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity
plan: "01"
subsystem: testing
tags: [playwright, docker, visual-regression, node-net, tcp-forwarder, negative-control, ledger, bash]

requires:
  - phase: 137-e2e-preflight
    provides: the served-application preflight (`preflight.ts:429-444`) whose strict absolute-path equality forces the identical-path mount
  - phase: 136-visual-regression-gate
    provides: the v2.14 `MatchScore.svelte:30` injection, the 19,484 / 19,545 px numbers, and the `candidate-preview` 0 px prior data
  - phase: 145-default-seed-template-repair
    provides: the negative-control ledger shape — header field set, nine-column register, `pending` discipline, `## Completeness` self-assertion
provides:
  - "`tests/scripts/tcp-forward.mjs` — dependency-free dual-stack Node TCP relay replacing the socat step the pinned image cannot run"
  - "`tests/scripts/visual-container.sh` — the executable container recipe: digest-pinned, identical-path mount, name-scoped egress block with a must-fail curl control, refuses to pull"
  - "`146-NEGATIVE-CONTROL.md` — 29 register rows, 145 placeholder cells, opened before the phase's first measurement and first product byte"
  - "`146-VISUAL-NOISE-LEDGER.md` — the 40-cell noise matrix enumerated up front, the D-05 arithmetic written before the number exists, the four recomputed ratio budgets"
affects: [146-02, 146-03, 146-04, 146-05, 146-06, 146-07, 146-08, 146-09]

actuals:
  tokens: 27177
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Committed executable container recipe under `tests/scripts/`, replacing prose restated in three places"
    - "Dependency-free `node:net` dual-stack TCP relay as the container↔host bridge (first `node:net` usage in the repo)"
    - "Ledger-first commit ordering as a property of the commit graph: corpora enumerated before any measurement and before any product byte"

key-files:
  created:
    - tests/scripts/tcp-forward.mjs
    - tests/scripts/visual-container.sh
    - .planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/146-NEGATIVE-CONTROL.md
    - .planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/146-VISUAL-NOISE-LEDGER.md
  modified: []

key-decisions:
  - "The forwarder binds with `server.listen(port)` and NO host argument — dual-stack observed on this host over both 127.0.0.1 and [::1] from a single IPv6 wildcard listener, which is the host half of research assumption A2"
  - "The in-container entrypoint is written INTO the run directory rather than passed as a `bash -c` string: bash's parser mis-handles a heredoc inside `$( )`, and the identical-path mount makes the written path resolve on both sides — so the run's evidence directory now contains the byte-exact program that produced its results"
  - "`--run-dir` must resolve inside the repo root (exit 2 otherwise): the repo root is the only mount, so a run dir outside it would be discarded with the `--rm` container, taking the run's whole evidence with it"
  - "`console.info` throughout `tcp-forward.mjs` rather than `console.log`: same stream, but this repo's `no-console` rule allows only warn/error/info and `yarn lint:check` covers `tests/`"
  - "Both ledgers carry their own header block and their own `## Completeness`; neither file's corpus assertion covers the other's rows"

patterns-established:
  - "Anchored-grep corpus assertion: each ledger states the exact `grep -cE` / `grep -o … | wc -l` that checks its own row and placeholder counts, so the count is checked rather than asserted"
  - "Behavioural verification of a docker wrapper against a `docker` stub on PATH — proves the flag surface and exit codes 2/3/4 without starting a container"

requirements-completed: []

coverage:
  - id: D1
    description: "A dependency-free, dual-stack, signal-clean TCP relay exists at tests/scripts/tcp-forward.mjs, so socat's absence from the pinned image is no longer a blocker"
    requirement: "VGATE-04"
    verification:
      - kind: other
        ref: "node --check tests/scripts/tcp-forward.mjs && test -x tests/scripts/tcp-forward.mjs"
        status: pass
      - kind: integration
        ref: "host round-trip: throwaway HTTP responder -> relay -> curl; body echoed over both 127.0.0.1 and [::1]; SIGTERM exit 0; no-arg exit 2; port-collision exit 5"
        status: pass
    human_judgment: false
  - id: D2
    description: "One executable file encodes the whole container recipe — digest pin, identical-path mount, forwarder, name-scoped egress block, both snapshot modes, both invocation shapes, JSON reporting and exit-code propagation"
    requirement: "VGATE-04"
    verification:
      - kind: other
        ref: "bash -n; test -x; --help exit 0 with all nine exit codes; --nonsense-flag exit 2; missing --run-dir exit 2"
        status: pass
      - kind: integration
        ref: "docker-stub flag-surface matrix: default/--update-snapshots-all/--block-egress/--ci-literal/--grep argv vectors, plus exit 3 (daemon down), exit 4 (image absent), mutual-exclusion exit 2"
        status: pass
      - kind: other
        ref: "source greps: digest pinned x1, tag reference x0, identical-path mount x2, T-146-03 bind-scope grep empty, no yarn dev/vite/supabase start"
        status: pass
    human_judgment: true
    rationale: "The script's END-TO-END behaviour — that a real container run passes the preflight, that the egress blackhole really blocks, that the forwarder works from inside the container — is deliberately NOT verified here. 146-01 runs no container by design (the plan's <polarity> section); 146-02 Task 2 is the D-14 observation whose whole job is to fail loudly if anything written here is wrong. Signing this off as machine-verified would be exactly the borrowed confirmation this phase's ledgers exist to prevent."
  - id: D3
    description: "Both ledgers exist with their full corpus written and nothing measured, in a commit that precedes every run and every product byte in this phase"
    requirement: "VGATE-03"
    verification:
      - kind: other
        ref: "plan <verify> node check: 29 register row IDs present, 10 matrix rows present"
        status: pass
      - kind: other
        ref: "anchored grep: 29 rows, 145 register placeholders, every row exactly 5 placeholders and 9 columns; 40 matrix count cells + 54 matrix placeholders; restoration table 12 rows x 40-char hash"
        status: pass
      - kind: other
        ref: "no cap numeral: grep -nE 'maxDiffPixels\\s*[:=]\\s*[0-9]' matches only the measurement-only `maxDiffPixels: 0`"
        status: pass
    human_judgment: false
  - id: D4
    description: "Zero product bytes: nothing under apps/, packages/, tests/tests/, tests/playwright.config.ts, .github/, package.json or yarn.lock changed"
    verification:
      - kind: other
        ref: "git status --porcelain -- apps packages tests/tests tests/playwright.config.ts .github package.json yarn.lock (empty); git diff --stat 034d894cd^..HEAD (2 files, both tests/scripts/); git diff --exit-code over preflight.ts + global-setup.ts exit 0"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-08-25
status: complete
---

# Phase 146 Plan 01: Container Recipe, Forwarder, and Both Ledger Corpora Summary

**Two committed executables that encode the whole in-container visual-run recipe — a dual-stack Node
TCP relay replacing the socat step the pinned image cannot run, and a digest-pinned wrapper carrying
the identical-path mount that has aborted every run since Phase 137 — plus both ledgers opened with
all 29 register rows and all 40 matrix cells written before a single measurement exists, and zero
product bytes moved.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 3 / 3
- **Files created:** 4 (2 executables, 2 ledgers)
- **Files modified:** 0
- **Commits:** 3

## Accomplishments

### Task 1 — `tests/scripts/tcp-forward.mjs` (commit `034d894cd`, mode 100755)

A ~200-line, zero-dependency ESM relay importing only `node:net` and `node:process`. It relays each
`<listenPort>:<upstreamHost>:<upstreamPort>` triple given on `process.argv`, prints a
`READY`/`ALL READY` handshake the shell waits on instead of sleeping, and exits 0 on `SIGTERM`/`SIGINT`.

**Observed on this host, outside any container** (the plan's acceptance criterion):

| Observation | Result |
|---|---|
| Round-trip body through the relay | `tcp-forward round-trip OK` — the throwaway responder's exact body, `curl` exit 0 |
| Same body over the IPv4 loopback literal | `tcp-forward round-trip OK`, exit 0 |
| Same body over the IPv6 loopback literal `[::1]` | `tcp-forward round-trip OK`, exit 0 |
| Listener as `lsof` sees it | a **single** `IPv6 … TCP *:<port> (LISTEN)` — one dual-stack socket serving both families |
| `kill -TERM` | exit **0**, after `SIGTERM received -- closing 1 listener(s)` |
| No arguments | exit **2**, with a usage block naming the triple form |
| Second forwarder on an occupied port | exit **5**, `FATAL -- could not bind port <n>: EADDRINUSE` |

All three documented exit codes (0 / 2 / 5) were therefore **observed**, not asserted. The dual-stack
result is the **host half** of research assumption A2; the container half is `146-02`'s D-14 run.

### Task 2 — `tests/scripts/visual-container.sh` (commit `0c3a26ab6`, mode 100755)

493 lines following `tests/scripts/e2e-run.sh` verbatim as the house style — `set -euo pipefail`,
`BASH_SOURCE`-derived `SCRIPT_DIR`/`TESTS_DIR`/`REPO_ROOT` with its rationale comment, the
self-extracting `usage()`, the `require_value` guard and the `while`/`case` loop — and diverging
exactly where the plan says it must.

Verified by source grep:

| Property | Check | Result |
|---|---|---|
| Digest pin | `grep -c 'sha256:6446946a…'` | **1** |
| No tag reference that could trigger a pull | `grep -c 'mcr.microsoft.com/playwright:v'` | **0** |
| Identical-path mount (D-14 A) | `grep -c -- '-v "$PWD":"$PWD"'` / `'-w "$PWD"'` | **2** / **2** |
| Bind-scope mitigation (`T-146-03`) | the plan's `-p`/`--publish`/`--publish-all`/`--network host`/`--privileged` grep | **no matches** |
| `--update-snapshots=all` present | `grep -c` | **2** |
| Does not own the dev server | `grep -nE '^[^#]*\b(yarn dev\|vite\|supabase start)\b'` | **no matches** |
| Egress flags | exactly two `--add-host … :127.0.0.1`, only inside the `--block-egress` branch | confirmed |

Verified behaviourally against a `docker` **stub** on `PATH` — no container was started, which the
plan's `<polarity>` section requires:

| Mode | Assembled Playwright argv | Container env / flags |
|---|---|---|
| default | `test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0 --reporter=html,json` | 1 `--add-host` |
| `--update-snapshots-all` | …`--retries=0 --update-snapshots=all --reporter=html,json` | 1 `--add-host` |
| `--block-egress` | (default argv) | **3** `--add-host` — the gateway plus the two blackholes |
| `--ci-literal` | `test -c … --grep @visual --reporter=html,json` — **no** `--project`, **no** worker/retry override | `CI=true` passed |
| `--grep "@visual"` | `… --grep @visual --workers=1 --retries=0 …` | 1 `--add-host` |

And the exit-code table, exercised: `--help` → **0**; unknown flag → **2**; missing `--run-dir` → **2**;
`--run-dir` as the last argument → **2**; `--project` + `--grep` → **2**; `--ci-literal` + `--project`
→ **2**; run dir outside the repo root → **2**; daemon down → **3**; image absent → **4**.

### Task 3 — both ledgers (commit `3b98ca71a`)

`146-NEGATIVE-CONTROL.md`: nine columns in 145's order, **29 rows**, first four cells pre-written, last
five reading `pending`. Measured with the anchored pattern the file itself publishes:

- register rows: **29**
- placeholder occurrences across the register: **145** (the plan's expected number, exactly)
- per-row: **every** row has exactly **5** placeholders and exactly **9** columns
- `## Restoration blob hashes`: **12** rows, each carrying a 40-character `git hash-object` value,
  including both `tests/tests/support/preflight.ts` (`389197f038e3b53a6836ea467444d6097e134429`) and
  `tests/global-setup.ts` (`1c4a29d3326ae8c4a2573a0678fe84e6f3b40fab`) — in the table for the opposite
  reason to the others, because they are the paths that must never change
- `Machine` bullet carries the RepoDigest read on this machine:
  `mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d`
  (`Architecture` `amd64`, `Os` `linux`, 2,390,436,754 B); the in-container `uname -m` /
  `/etc/os-release` / `node -v` fields are left at `pending` for `146-02` to fill from the D-14 run

`146-VISUAL-NOISE-LEDGER.md`: **10** matrix data rows `run01`…`run10` plus a `max` row; **40** count
cells and **54** matrix placeholders (40 counts + 10 exits + 4 max). The four ratio budgets appear as
literal numbers, **recomputed from the dimensions measured on disk at ledger creation** rather than
copied from any prior document:

| Baseline | Dimensions on disk | Area | Ratio budget |
|---|---|---|---|
| `voter-results-desktop` | 1280×3684 | 4,715,520 | 47,155.2 |
| `voter-results-mobile` | 390×4152 | 1,619,280 | 16,192.8 |
| `candidate-preview-desktop` | 1280×821 | 1,050,880 | 10,508.8 |
| `candidate-preview-mobile` | 390×924 | 360,360 | 3,603.6 |

**No cap value exists in either file.** `grep -nE 'maxDiffPixels\s*[:=]\s*[0-9]'` over the noise ledger
returns exactly one line — the measurement-only `maxDiffPixels: 0` inside § The measurement
configuration — and returns nothing at all over the register.

## Verification Results

Every command in the plan's `<verification>` block, re-run at the closing HEAD `3b98ca71a`:

| Check | Result |
|---|---|
| `bash -n tests/scripts/visual-container.sh` | exit **0** |
| `node --check tests/scripts/tcp-forward.mjs` | exit **0** |
| Both files mode 0755 | `-rwxr-xr-x` on both; committed as `100755` |
| `visual-container.sh --help` | exit **0**, all **nine** exit codes present, and the literal `yarn workspace @openvaa/frontend dev --host 0.0.0.0` in the prerequisite block |
| Unknown flag | exit **2** |
| Forwarder host round-trip + clean `SIGTERM` | body echoed, exit **0** (recorded above) |
| `yarn format:check` | exit **0** — *All matched files use Prettier code style!* |
| `yarn lint:check` | exit **0** — 22/22 turbo tasks, `eslint tests` clean, both typechecks clean |
| `npx playwright test -c tests/playwright.config.ts --list` | exit **0** — **137 tests in 90 files**; with `PLAYWRIGHT_VISUAL=1`, **142 tests in 92 files** including the 4 `[visual-regression]` captures |
| Both ledgers: 29 rows / 40 cells, no filled measurement cell, no cap numeral | confirmed (above) |
| `git status --porcelain -- apps packages tests/tests tests/playwright.config.ts .github package.json yarn.lock` | **prints nothing** |

**Zero-product-bytes, stated as the diff:** `git diff --stat 034d894cd^..HEAD` over the whole plan range
is `tests/scripts/tcp-forward.mjs | 207 +` and `tests/scripts/visual-container.sh | 493 +` — two files,
700 insertions, both under `tests/scripts/`, which is test infrastructure. `git diff --exit-code` over
`tests/tests/support/preflight.ts` and `tests/global-setup.ts` across the same range exits **0**: not
one byte of the preflight moved, which is threat `T-146-05`'s mitigation and the pre-condition row
`PF1-UNTOUCHED` will re-assert at the `146-08` gate.

### ⚠ Finding for `146-08`: the standing suite count is **137**, not 134

Research assumption A7 carried "the default suite's test count is still 134" from `136-05-SUMMARY.md`
and flagged it for re-derivation. Re-derived here with `--list` at HEAD `3b98ca71a`: **137 tests in 90
files** (default), **142 in 92** with `PLAYWRIGHT_VISUAL=1`. This is a `--list` enumeration, not a
`yarn test:e2e` pass count — `test:e2e` adds `--grep-invert @probe`, so row `E2E1-SUITE` must still
re-derive its own number from its own run rather than adopt this one.

## Deviations from Plan

### 1. [Rule 1 — Bug in an acceptance criterion] Task 2's bare-`--update-snapshots` regex is over-broad and flags the plan's own mandated flag name

- **Found during:** Task 2, acceptance-criteria verification.
- **Issue:** the criterion's check is
  `[...s.matchAll(/--update-snapshots(?!=all)/g)]` filtered to non-comment lines. The negative
  lookahead excludes `=all` but **not** `-all`, so it matches inside the literal `--update-snapshots-all`
  — which is the **input flag name the same plan mandates** in
  `<artifacts_this_phase_produces>` and in Task 2's own `<action>`. The two requirements cannot both be
  satisfied as written. The check as given fails at exactly **1 site**: line 166, the `case` pattern
  `--update-snapshots-all)`.
- **Not worked around.** The flag was **not** renamed and the `case` pattern was **not** obfuscated to
  dodge the regex — either would be tuning the artifact to pass its own check. The plan's artifact
  specification is authoritative for the deliverable; the regex is a defect in the verification.
- **Disposition:** disclosed rather than deleted, per the norm `145-NEGATIVE-CONTROL-LEDGER.md:873`
  established. The criterion's **stated intent** — *"the script contains no argument that emits
  `--update-snapshots` without `=all`"* — was verified with a corrected check that classifies each
  non-comment occurrence by suffix:

  ```
  --update-snapshots      -> 0 sites   (the failure mode the criterion targets)
  --update-snapshots-all  -> 1 site    (line 166, the INPUT flag name)
  --update-snapshots=all  -> 1 site    (line 281, the ONLY emission)
  ```

  The corrected check exits **0**. Line 281 is the sole emission site, inside
  `if [ "$UPDATE_ALL" = "1" ]; then echo "--update-snapshots=all"; fi`, and the stub run confirmed the
  assembled argv carries `--update-snapshots=all` and never the bare form.
- **Action for later plans:** any plan re-running Task 2's criterion verbatim will see the same single
  false positive. Use the suffix-classifying form above. **No file was changed for this deviation.**

### 2. [Rule 3 — Blocking issue] `no-console` reddened `yarn lint:check` on the new forwarder

- **Found during:** Task 1, before commit.
- **Issue:** `eslint --flag v10_config_lookup_from_file tests` reported 4 errors — this repo's shared
  config permits only `warn`/`error`/`info` under `no-console`, and the forwarder's stdout handshake
  used `console.log`. `yarn lint:check` passing is a plan-level verification criterion.
- **Fix:** switched the four stdout sites to `console.info`, which is the **same stream** in Node, so
  the `READY`/`ALL READY` handshake the shell greps for is byte-identical. A comment above them records
  why, so a future reader does not "simplify" them back and redden the gate.
- **Verification:** `eslint tests` clean for the file; the round-trip, `SIGTERM`, no-arg and
  port-collision observations were **all re-run after the edit** and are the numbers reported above.
- **Files modified:** `tests/scripts/tcp-forward.mjs` (pre-commit). **Commit:** `034d894cd`.

### 3. [Rule 3 — Blocking issue] Bash cannot parse a heredoc inside `$( )`; the entrypoint moved into the run directory

- **Found during:** Task 2, `bash -n`.
- **Issue:** the natural shape for the in-container entrypoint —
  `IN_CONTAINER="$(cat <<'ENTRYPOINT' … ENTRYPOINT)"` — fails `bash -n` with
  *unexpected EOF while looking for matching `'`*. Binary search over truncated prefixes localised it
  to the command substitution at line 291. Notably `--help` still worked, because bash executes
  incrementally and exits before reaching the unparsable region — so this would have survived a
  smoke test and failed on the first real run.
- **Fix:** the entrypoint is written to `"$RUN_DIR/entrypoint.sh"` with a top-level quoted heredoc and
  the container runs `bash "$RUN_DIR/entrypoint.sh"`. The identical-path mount makes that exact
  absolute path resolve on both sides. **This is strictly better than the original shape:** the run's
  evidence directory now contains the byte-exact program that produced its results, which is the same
  *evidence over restatement* rule the `results.json` read-back at the bottom of the script follows.
- **Verification:** `bash -n` on the script **and** on the extracted 106-line entrypoint, both exit 0.
- **Files modified:** `tests/scripts/visual-container.sh` (pre-commit). **Commit:** `0c3a26ab6`.

### 4. [Rule 2 — Missing critical functionality] `--run-dir` must resolve inside the repo root

- **Found during:** Task 2, writing the run-dir resolution.
- **Issue:** `e2e-run.sh` accepts an absolute `--run-dir` anywhere, which is correct for a host-side
  wrapper. For a container wrapper it is not: the repo root is the **only** thing mounted, so a run dir
  outside it is written to the container's ephemeral filesystem and vanishes with `--rm`. The run would
  report an exit code and leave **no evidence at all** — and this phase's entire output is evidence.
- **Fix:** a containment check after resolution; a run dir outside `REPO_ROOT` exits **2** with a
  message naming the mounted tree. Verified: `--run-dir /tmp/outside` → exit 2.
- **Files modified:** `tests/scripts/visual-container.sh` (pre-commit). **Commit:** `0c3a26ab6`.

### 5. [Rule 2 — Missing critical functionality] `mkdir -p` would trip the `T-146-03` bind-scope grep

- **Found during:** Task 2, checking the threat-mitigation criterion.
- **Issue:** the criterion's pattern is
  `(^|[[:space:]])(-p|--publish|--publish-all|--network[[:space:]]+host|--privileged)([[:space:]]|$)`,
  which matches a standalone `-p` **anywhere** — including in `mkdir -p "$RUN_DIR"`. A false positive
  there would either fail the mitigation check or, worse, train a future maintainer to weaken the
  check itself.
- **Fix:** `install -d "$RUN_DIR"` (verified to create nested directories on both macOS and GNU
  coreutils), with an inline comment recording why. Every mention of the forbidden docker flags in
  comments is written in backticks, so the whole-word pattern cannot match them either.
- **Verification:** the criterion's grep returns **no matches** over the finished file.
- **Files modified:** `tests/scripts/visual-container.sh` (pre-commit). **Commit:** `0c3a26ab6`.

**Total deviations:** 5 — 1 disclosed defect in an acceptance criterion (no file changed), 2 Rule-3
blockers, 2 Rule-2 additions. **Impact:** none on the plan's intent. Every deliverable is as specified;
the flag surface, the mount, the digest pin, the egress semantics, the exit-code table, the 29 rows and
the 40 cells are all exactly what the plan asked for.

## Authentication Gates

None.

## Known Stubs

Both ledgers are **deliberately** stub-bearing, and that is this plan's product rather than a defect:

| File | Stub | Resolved by |
|---|---|---|
| `146-NEGATIVE-CONTROL.md` | 145 `pending` cells across 29 register rows | `146-02` … `146-08`, each clearing only its own rows |
| `146-NEGATIVE-CONTROL.md` | `Machine` bullet's in-container `uname -m` / `/etc/os-release` / `node -v` | `146-02`, from the D-14 observation run's `provenance.txt` |
| `146-NEGATIVE-CONTROL.md` | `## Gates`, `## Final counts`, `### Pairs by outcome class`, `### Non-pair rows`, `## Residue` | `146-08` / `146-09` |
| `146-VISUAL-NOISE-LEDGER.md` | 54 `pending` matrix cells (40 counts + 10 exits + 4 max) | `146-03` |
| `146-VISUAL-NOISE-LEDGER.md` | `## The measurement configuration` verbatim overlay block | `146-03` |
| `146-VISUAL-NOISE-LEDGER.md` | `## Font delta (N-1)` — 4 cells | `146-06` |

Writing a measured-looking value into any of these before its run happens is the precise failure this
plan exists to prevent. **No code stub exists**: both executables are complete and were exercised.

## Threat Flags

None. This plan introduces exactly one new listener class (`tcp-forward.mjs`), which is `T-146-03` in
the plan's existing register, and its mitigation — bind scope confined to the container's own network
namespace, because the wrapper publishes no ports — is verified by the grep recorded above. No new
network endpoint, auth path, file-access pattern or schema change was introduced.

## Issues Encountered

None beyond the five deviations above, all resolved before their commits.

## Next Phase Readiness

Ready for `146-02`.

**What `146-02` inherits, and what it must treat as unproven:**

1. **The container half of assumption A2 is still open.** The dual-stack bind is observed on the
   *host*; whether the container resolves `localhost` to `::1`, `127.0.0.1` or both is unmeasured. The
   D-14 observation run is the first thing that would catch a failure here, and it fails loudly — a
   *connection refused* mimicking the D-136-06-2 bind bug. `apt-get install -y socat` stays documented
   in the forwarder's docblock as the fallback, and a derived image must **never** be built for it:
   that would change the digest and destroy the D-07 comparability the phase rests on.
2. **`visual-container.sh` has never run a container.** Its structure, flag surface and exit codes are
   verified; its end-to-end behaviour is not, by design. If `146-02` finds a defect here, the plan's
   `<polarity>` section is explicit: **fix it in `146-02`, with the defect and the fix both recorded** —
   do not retro-edit `146-01` and do not present the fixed script as though it had always worked.
3. **Three register rows and five header fields are `146-02`'s to fill**, and only those: `D14-OBS`,
   `E1-CURL`, `E2-CHROMIUM`, plus the in-container `Machine` fields. The placeholder count should fall
   **145 → 130** at `146-02`'s close, and that arithmetic is itself an assertion.
4. **The host-side sequence is a prerequisite, not the script's job.** `yarn build` →
   `yarn db:reset && yarn db:seed --template e2e/base` →
   `yarn workspace @openvaa/frontend dev --host 0.0.0.0`. The last one is **not** `yarn dev --host …`
   (N-10), and the first is not optional (N-7). A dev server is currently listening on `[::1]:5173`
   from an earlier session; `146-02` needs one bound `0.0.0.0`, so that listener must be replaced, not
   adopted.

**Requirements:** `requirements-completed` is deliberately **empty**. The plan declares
`[VGATE-03, VGATE-04]`, but this plan **measured nothing** — VGATE-03 asks for measured per-baseline
noise and VGATE-04 for a green egress-blocked run, and neither exists yet. `requirements ready-ids`
independently returned **0/2 ready**, since `146-02`/`146-03`/`146-08`/`146-09` also declare those IDs
and have no SUMMARY. Marking either complete here would be exactly the borrowed confirmation this
phase's ledgers exist to prevent.

## Self-Check

- `tests/scripts/tcp-forward.mjs` — FOUND on disk, mode `100755` in the tree
- `tests/scripts/visual-container.sh` — FOUND on disk, mode `100755` in the tree
- `146-NEGATIVE-CONTROL.md` — FOUND on disk
- `146-VISUAL-NOISE-LEDGER.md` — FOUND on disk
- commit `034d894cd` — FOUND (`feat(146-01): add tests/scripts/tcp-forward.mjs …`)
- commit `0c3a26ab6` — FOUND (`feat(146-01): add tests/scripts/visual-container.sh …`)
- commit `3b98ca71a` — FOUND (`docs(146-01): open both ledgers …`)
- all plan `<verification>` commands re-run at the closing HEAD — all pass (table above)
- product-path `git status --porcelain` — empty

## Self-Check: PASSED
