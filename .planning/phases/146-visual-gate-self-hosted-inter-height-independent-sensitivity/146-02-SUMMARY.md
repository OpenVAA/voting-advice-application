---
phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity
plan: "02"
subsystem: testing
tags: [docker, playwright, preflight, visual-regression, egress-block, chromium, curl, negative-control]

requires:
  - phase: 146-01
    provides: "`tests/scripts/visual-container.sh` and `tests/scripts/tcp-forward.mjs` — the container recipe and the relay, both structurally verified but never run against a real container; plus the 29-row register with 145 placeholders"
  - phase: 137-e2e-preflight
    provides: "`tests/tests/support/preflight.ts:429-444` — the strict absolute-path identity clause the identical-path mount exists to satisfy"
provides:
  - "`D14-OBS` — an observed preflight-PASSING container run: the identical-path mount lets `preflight.ts` clear from inside the pinned image with zero preflight edits"
  - "the container half of research assumption A2 — `tcp-forward.mjs` carried live traffic from inside the container to the host dev server, so the `apt-get install -y socat` fallback (which would have cost the pinned digest) is not needed"
  - "`E1-CURL` / `E2-CHROMIUM` — the D-11 font-egress blackhole proven live at resolver level (curl exit 7) and at browser level (`net::ERR_CONNECTION_REFUSED`), before any suite has run behind it"
  - "`tests/scripts/visual-container.sh --egress-control-only` — a controls-only mode plus a browser-level probe, so the D-11 controls can be taken without presupposing the suite they license"
  - "the register's complete container `Machine` provenance and the host dev server's recorded identity (port/PID/start/HEAD), which `146-07`'s D-16 continuous-uptime control depends on"
affects: [146-03, 146-04, 146-05, 146-06, 146-07, 146-08, 146-09]

actuals:
  tokens: 7331
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Controls-only container mode: a falsifiable network control that stops *before* the run it licenses, so the proof never presupposes its own conclusion"
    - "Inline `node -e` browser probe using the image's bundled Playwright, so a one-off control never becomes a permanent member of the suite"

key-files:
  created: []
  modified:
    - .planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/146-NEGATIVE-CONTROL.md
    - tests/scripts/visual-container.sh

key-decisions:
  - "The D-14 observation was run WITHOUT `--block-egress`: one job, one variable, so a failure could only have been the mount or the forwarder"
  - "The Chromium control reuses exit code 6 rather than introducing a tenth code — a successful navigation and a successful curl are the same claim (the block is not applied)"
  - "The controls-only run writes `controls-exit`, never `exit`: `exit` means Playwright's status everywhere else in this phase and a controls-only run never reaches Playwright"
  - "`--egress-control-only` requires `--block-egress` and is a usage error alongside any selection or snapshot flag — a control run that also runs a suite is exactly what D-11 forbids"

patterns-established:
  - "Defect-disclosure in the ledger itself: the script gap, the fix, and the failed first attempt are a named subsection of the register, not a silent correction to the prior plan"

requirements-completed: []

coverage:
  - id: D1
    description: "The identical-path mount lets the served-application preflight pass from inside the pinned container, with zero preflight edits — D-14 discharged by observation"
    requirement: "VGATE-04"
    verification:
      - kind: e2e
        ref: "tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-d14-observe --project visual-regression → exit 0, 7/7 expected, `E2E PREFLIGHT OK <abs>/apps/frontend (verified against <abs>)` in stdout.log"
        status: pass
      - kind: other
        ref: "git diff --exit-code -- tests/tests/support/preflight.ts tests/global-setup.ts (exit 0); blobs 389197f038e3b53a6836ea467444d6097e134429 / 1c4a29d3326ae8c4a2573a0678fe84e6f3b40fab match the register's § Restoration values"
        status: pass
    human_judgment: false
  - id: D2
    description: "The font-egress blackhole is live at resolver level: an in-container curl to the css2 URL fails with exit 7, with the two /etc/hosts blackhole lines recorded alongside"
    requirement: "VGATE-04"
    verification:
      - kind: integration
        ref: "tests/e2e-runs/146-egress-ctl/curl-control.log — `curl: (7) Failed to connect to fonts.googleapis.com port 443 after 10 ms`, exit=7; provenance.txt carries both 127.0.0.1 mappings"
        status: pass
    human_judgment: false
  - id: D3
    description: "The same blackhole is live at browser level: Chromium 145.0.7632.6 navigating to the css2 URL reports net::ERR_CONNECTION_REFUSED, so the browser is not resolving around /etc/hosts"
    requirement: "VGATE-04"
    verification:
      - kind: integration
        ref: "tests/e2e-runs/146-egress-ctl/chromium-control.log — `navigation FAILED: page.goto: net::ERR_CONNECTION_REFUSED at https://fonts.googleapis.com/css2?...`, controls-exit 0 (failure is the pass)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The register's placeholder count fell 145 → 130 — exactly three rows filled, none of them from a document or a prior session"
    verification:
      - kind: other
        ref: "the register's own anchored grep: 29 rows, 130 `pending` occurrences, 9 columns and 0 placeholders in each of D14-OBS / E1-CURL / E2-CHROMIUM"
        status: pass
    human_judgment: false
  - id: D5
    description: "Zero product bytes: nothing under apps/, packages/, tests/tests/, tests/playwright.config.ts, .github/, package.json or yarn.lock changed"
    verification:
      - kind: other
        ref: "git status --porcelain -- apps packages tests .github package.json yarn.lock (empty); git diff --stat b2645370d..HEAD = 146-NEGATIVE-CONTROL.md + tests/scripts/visual-container.sh only"
        status: pass
    human_judgment: false
  - id: D6
    description: "`visual-container.sh` gained a controls-only mode and a browser-level probe without losing any property 146-01 verified"
    verification:
      - kind: other
        ref: "bash -n on script and extracted entrypoint; --help exit 0 with all nine exit codes; usage errors 2 on four illegal flag combinations; digest pin x1, tag x0, mount x2/x2, T-146-03 grep empty, zero bare --update-snapshots emissions"
        status: pass
    human_judgment: true
    rationale: "The flag surface and the two controls are machine-verified, but whether extending a 146-01 artifact mid-phase (rather than deferring) was the right call against the plan's `zero product bytes` posture is a judgment about scope discipline, and it changed a committed executable other plans depend on. A human should confirm the extension is acceptable rather than have it auto-passed by its own tests."

duration: 42min
completed: 2026-08-25
status: complete
---

# Phase 146 Plan 02: The D-14 Observation and the D-11 Egress Controls Summary

**The container harness written blind in `146-01` was run for the first time and it works: the
served-application preflight clears from inside the pinned image with the identical-path mount and
**zero** preflight edits, the Node relay carried live traffic from the container to the host dev
server (closing the container half of assumption A2, so the digest-destroying `socat` fallback is not
needed), and the font-egress blackhole was proven live at both layers — `curl` exit 7 and Chromium
`net::ERR_CONNECTION_REFUSED` — before any suite has run behind it. Register placeholders 145 → 130.**

## Performance

- **Duration:** ~42 min
- **Tasks:** 3 / 3
- **Files modified:** 2 (one ledger, one script)
- **Files created:** 0 committed (two gitignored evidence directories)
- **Commits:** 4

## Accomplishments

### Task 1 — the host stack recorded, not re-run (commit `43ec683d7`)

Task 1 is the plan's operator checkpoint and it had already been discharged by the orchestrator
before this executor was dispatched, so nothing was re-run: no rebuild, no `db:reset`, no server
restart. Its four values are now a `Host dev server` bullet in the register's header:

| Field | Value |
|---|---|
| Port | `5173` (no `FRONTEND_PORT` override; `supabaseAdminClient.ts:585,628` hardcode it) |
| PID | `41925` — the `vite` process; `yarn` wrapper `41918`; Vite v6.4.1 |
| Start | `2026-08-25 22:38:56` local |
| HEAD at build time | `b2645370d` |

Plus the bind (`lsof` → `node 41925 … TCP *:5173 (LISTEN)`, wildcard, **not** loopback), the ordered
prerequisite sequence with its measured seed counts (143 rows, 30 portraits, template `e2e/base`), the
three served-app 200s including the `/@fs` probe URL the preflight actually tests, and the statement
that the process **must remain running and un-restarted for the remainder of the phase**, with any
restart itself recorded — because `146-07`'s D-16 attempts are only valid while it has been
continuously up.

**Re-verified at plan close:** `ps -o pid,lstart -p 41925` still reports the same PID and the same
`22:38:56` start, with `--host 0.0.0.0` visible in its argv, and the port still answers 200. The server
was never touched by this plan.

### Task 2 — `D14-OBS`: the preflight passes from inside the container (commit `a3b10ff5a`)

One run, no `--block-egress`, no snapshot flag:
`tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-d14-observe --project visual-regression`.

**Observed** (not reasoned — that is D-14's own wording):

```
E2E PREFLIGHT OK /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend (verified against /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd)
```

The echoed frontend root is character-identical to the host's `"$PWD"/apps/frontend`. Every acceptance
criterion checked:

| Criterion | Result |
|---|---|
| `exit` file | `0` (and the wrapper's `status` file `0`) |
| `results.json` test count | **7** — 4 captures + `data-setup-base` + `auth-setup` + `data-teardown-base`; no degenerate zero-test pass |
| `observed.txt`, read back **from `results.json`** | `observed_workers=1`, `observed_retries=0`, `expected=7`, `unexpected=0`, `flaky=0`, `skipped=0`, `duration_ms=72119` |
| `git diff --exit-code` over preflight + global-setup | exit **0**; blobs still `389197f038e3b53a…` / `1c4a29d3326ae8c4…` |
| `D14-OBS` cells | 9 filled, cache verdict `n/a — playwright`, `Assertion outcome` names its log files |
| `Machine` bullet | `uname -m` `x86_64`, `PRETTY_NAME="Ubuntu 24.04.3 LTS"` / `NAME="Ubuntu"`, `node -v` `v24.13.0`, RepoDigest re-confirmed from `docker-argv.txt:19` (contains `sha256:6446946a`) |
| Placeholders | **145 → 140**, down exactly 5 |
| `git status --porcelain -- apps packages tests .github package.json yarn.lock` | prints nothing |

All four captures **passed** against the committed Google-served-Inter baselines under the old
ratio-only budget — the expected clean-tree result, and deliberately kept out of the row's verdict,
which is about the preflight.

**Two facts fell out of the same run that nothing else in this phase would have caught:**

1. **The container half of assumption A2 holds.** `forwarder ready (pid 12)` then
   `host dev server reachable on localhost:5173` — `tcp-forward.mjs`'s no-host `listen()` accepted
   whatever family the container's `localhost` resolves to. The documented `apt-get install -y socat`
   fallback is **not** needed, which matters because installing it would have changed the image and
   destroyed the digest comparability D-07 rests on.
2. **`visual-container.sh` ran a container for the first time and its five-step entrypoint worked
   end to end** — provenance, forwarder handshake, dev-server liveness, Playwright, relay teardown,
   status propagation, and the `results.json` read-back.

### Task 3 — `E1-CURL` and `E2-CHROMIUM`: the blackhole proven at both layers (commits `61b685523`, `15516a78c`)

Both controls taken in one `--block-egress` session into `tests/e2e-runs/146-egress-ctl/`, **before**
any suite has been run behind the block:

| Row | Observation | Verdict |
|---|---|---|
| `E1-CURL` | `curl: (7) Failed to connect to fonts.googleapis.com port 443 after 10 ms: Couldn't connect to server`, `exit=7` | **FAILURE IS THE PASS** |
| `E2-CHROMIUM` | `navigation FAILED: page.goto: net::ERR_CONNECTION_REFUSED at https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap` (Playwright `1.58.2`, Chromium `145.0.7632.6`) | **FAILURE IS THE PASS** |

The mechanism is recorded next to the claim: `provenance.txt` carries the container's own
`/etc/hosts` lines, `127.0.0.1<TAB>fonts.googleapis.com` and `127.0.0.1<TAB>fonts.gstatic.com`, written
by the two `--add-host` flags visible in `docker-argv.txt`.

Two rows, not one, because they are two claims: `curl` proves the **resolver** is blackholed;
Chromium proves the **browser that actually rasterises the captures** is subject to the same blackhole
rather than resolving around `/etc/hosts`. The failure mode in both cases is *connect-refused in ~10 ms
at 127.0.0.1:443*, not a DNS error — which is the signature of a name pointed at the loopback with
nothing listening, and is why the observation is diagnostic rather than anecdotal.

Neither row is traceable to `146-RESEARCH.md` § N-8: each cites a log under
`tests/e2e-runs/146-egress-ctl/` produced by this session's own run, and each carries this session's
HEAD plus the script blob hash it ran. Placeholders **140 → 130**, down exactly 10.

The register also gained the boundary sentence the plan asked for: the block is **name-scoped to
exactly two hosts on purpose**, so npm and everything else stays reachable, and a future maintainer who
hardens it to `--network none` or a broad DNS sink will sever the host stack and see it surface as a
Playwright failure rather than as a network error.

## Task Commits

1. **Task 1: host-stack identity recorded in the register header** — `43ec683d7` (docs)
2. **Task 2: `D14-OBS` filled + `Machine` bullet completed** — `a3b10ff5a` (docs)
3. **Task 3a: `--egress-control-only` added to `visual-container.sh`** — `61b685523` (fix)
4. **Task 3b: `E1-CURL` + `E2-CHROMIUM` filled + disclosure section** — `15516a78c` (docs)

## Files Created/Modified

- `.planning/phases/146-.../146-NEGATIVE-CONTROL.md` — `Host dev server` header bullet; the three
  in-container `Machine` fields plus a RepoDigest re-confirmation; rows `D14-OBS`, `E1-CURL`,
  `E2-CHROMIUM`; two new prose subsections (the egress block's boundary, and the
  `--egress-control-only` disclosure).
- `tests/scripts/visual-container.sh` — `--egress-control-only` (+118 lines): the flag and its four
  usage-error combinations, the `/etc/hosts` capture into `provenance.txt`, the `curl-control.log`
  transcript, and entrypoint step 2b's Chromium probe.
- **Gitignored evidence** (`.gitignore:44`, never committed): `tests/e2e-runs/146-d14-observe/`
  (`stdout.log`, `results.json`, `observed.txt`, `provenance.txt`, `exit`, `status`, `docker-argv.txt`,
  `entrypoint.sh`, `forwarder.log`, `html/`) and `tests/e2e-runs/146-egress-ctl/` (`curl-control.log`,
  `chromium-control.log`, `provenance.txt`, `egress-curl.*`, `controls-exit`, `docker-argv.txt`,
  `entrypoint.sh`).

## Verification Results

Plan `<verification>` block, re-run at the closing HEAD `15516a78c`:

| Check | Result |
|---|---|
| Three rows filled, placeholder count down by exactly 15 | **145 → 130**; 29 rows intact; 9 columns and 0 `pending` in each filled row |
| Preflight passed in-container; `git diff --exit-code` over `preflight.ts` + `global-setup.ts` | `E2E PREFLIGHT OK …` observed; diff exit **0**, both at HEAD and across the whole range `b2645370d..HEAD` |
| `Machine` bullet complete | `x86_64` · `PRETTY_NAME="Ubuntu 24.04.3 LTS"` + `NAME="Ubuntu"` · `v24.13.0` · digest `sha256:6446946a…` |
| Header carries `Host dev server` with port, PID, start, HEAD-at-build | present, plus bind evidence and the un-restarted statement |
| `git status --porcelain -- apps packages tests .github package.json yarn.lock` | prints nothing |
| `yarn lint:check` | exit 0 — 22/22 turbo tasks, `svelte-check` 0 errors 0 warnings |
| `yarn format:check` | exit 0 — *All matched files use Prettier code style!* |

Task-level `<verify>` blocks, both re-run verbatim: Task 2 → **PASS**, Task 3 → **PASS**.

## Decisions Made

- **The D-14 run carried one variable.** No `--block-egress`, no snapshot flag — so a failure could
  only have been the mount or the forwarder, per the plan's `<polarity>`.
- **The Chromium control reuses exit code 6.** A successful Chromium navigation and a successful
  `curl` are the same claim (*the block is not applied*), so the script's nine-code table is unchanged
  rather than extended to ten.
- **A controls-only run writes `controls-exit`, never `exit`.** `exit` means "Playwright's status"
  everywhere else in this phase; overloading it would let a later reader mistake a control for a suite
  result.
- **`--egress-control-only` is a usage error without `--block-egress`** and alongside
  `--project`/`--grep`/`--ci-literal`/`--update-snapshots-all` — a control that also runs a suite is
  precisely what D-11 forbids.

## Deviations from Plan

### 1. [Rule 2 — Missing critical functionality] `visual-container.sh` could not take the D-11 controls at all

- **Found during:** Task 3, before the first run.
- **Issue:** the plan's Task 3 asks for a `--block-egress` invocation "in a mode that exercises its
  step-2 `curl` control and stops there rather than running the suite", plus a browser-level control,
  plus the artifacts `curl-control.log` and `chromium-control.log`. The committed script had **none of
  the three**: no controls-only mode (the only way to reach the `curl` control was to run a suite
  immediately behind it — the exact ordering D-11 forbids, since a control exists to *license* a suite),
  no Chromium probe of any kind, and it emitted `egress-curl.err`/`egress-curl.exit` rather than the two
  named logs.
- **Fix, taken in this plan and not back-dated into `146-01`** (the plan's `<polarity>` instruction):
  `--egress-control-only`, the `/etc/hosts` capture, the `curl-control.log` transcript, and entrypoint
  step 2b's inline Chromium probe using the image's bundled Playwright — no spec file, so a one-off
  control does not become a permanent member of the suite.
- **Nothing `146-01` verified was lost.** Re-checked after the edit: `bash -n` on the script **and** on
  the extracted entrypoint (exit 0 both), `--help` exit 0 carrying all **nine** exit codes, four usage
  errors returning **2** (`--egress-control-only` without `--block-egress`; with `--ci-literal`; with
  `--update-snapshots-all`; with `--project`), digest pin ×1, tag reference ×0, identical-path mount
  ×2/×2, the `T-146-03` bind-scope grep still empty, and **zero** bare `--update-snapshots` emissions.
- **Files modified:** `tests/scripts/visual-container.sh`. **Commit:** `61b685523`. **Disclosed in the
  ledger** as its own `### ⚠` subsection, per the `145-NEGATIVE-CONTROL-LEDGER.md:873` norm.

### 2. [Rule 1 — Bug] The first egress-control run died inside undici, from a shadowed global

- **Found during:** Task 3, first control run.
- **Issue:** the probe declared its target as `const URL = "https://fonts.googleapis.com/…"`, which
  shadows the global `URL` class that node's bundled undici dereferences while loading `fetch`. The run
  died with `ReferenceError: URL is not defined` thrown several frames inside undici, nowhere near
  anything the probe wrote — while `curl` had already correctly reported exit 7.
- **Fix:** renamed to `TARGET`, with a comment recording the mechanism so it is not "simplified" back.
- **Verification:** re-run produced `net::ERR_CONNECTION_REFUSED` and `controls-exit` 0.
- **Committed in:** `61b685523` (pre-commit). **Both rows are filled from the second run; the first
  produced no ledger cell**, and the failed attempt is disclosed in the ledger rather than deleted.

### 3. [Disclosed defect in a prior plan's acceptance criterion — no file changed] The bare-`--update-snapshots` regex

`146-01-SUMMARY.md` records that the criterion's check `/--update-snapshots(?!=all)/` has a lookahead
excluding `=all` but not `-all`, so it flags the literal `--update-snapshots-all` — the input flag name
the same plan mandates. Re-verified here with the suffix-classifying form over non-comment lines:

```
--update-snapshots (bare)   -> 0 sites   (the failure mode the criterion targets)
--update-snapshots-all      -> 1 site    (the INPUT flag name)
--update-snapshots=all      -> 1 site    (the ONLY emission)
```

The flag was **not** renamed and the `case` pattern was **not** obfuscated to dodge the regex. No file
was changed for this item.

---

**Total deviations:** 3 — 1 Rule-2 addition to a `146-01` artifact (disclosed in the ledger), 1 Rule-1
bug in this plan's own probe (fixed before its measurement was recorded), 1 re-confirmation of a
previously-disclosed criterion defect with no file change.
**Impact on plan:** none on intent. Every row the plan owns is filled from an observed run; the two
prohibited paths are byte-identical; zero product bytes moved.

## Authentication Gates

None.

## Known Stubs

The register still carries **130** `pending` cells across its 26 unfilled rows, plus its `## Gates`,
`## Final counts`, `### Pairs by outcome class`, `### Non-pair rows` and `## Residue` stubs, and the
sibling `146-VISUAL-NOISE-LEDGER.md`'s 54 matrix placeholders. **All are deliberate** and belong to
`146-03` … `146-09`; writing a measured-looking value into any of them before its run happens is the
precise failure both ledgers exist to prevent. No code stub exists: `--egress-control-only` is complete
and was exercised, in both its failing and its passing form.

## Threat Flags

None. `T-146-05` (tampering with the preflight) is **mitigated and measured**: `git diff --exit-code`
over `tests/tests/support/preflight.ts` and `tests/global-setup.ts` exits 0 across the whole plan range
`b2645370d..HEAD`, and both blobs still hash to their § Restoration values. `T-146-03` (the relay's
bind scope) is re-confirmed operationally: the run required no published port — `docker-argv.txt`
contains no `-p`/`--publish`/`--network host`/`--privileged` — and the relay lived and died inside the
`--rm` container. The new Chromium probe opens no listener and makes exactly one outbound navigation,
which is the thing being blocked.

## Issues Encountered

Beyond the deviations above, none. The D-14 run passed on its first attempt.

## Next Phase Readiness

Ready for `146-03`.

**What `146-03` inherits:**

1. **A container harness that is now known to work end to end**, not merely structurally verified. Any
   in-container failure from here on is about the thing being measured, not about the mount, the
   forwarder or the recipe.
2. **A host dev server that must not be restarted** — PID `41925` on port `5173`, up since
   `2026-08-25 22:38:56`, re-confirmed alive at this plan's close. `146-07`'s D-16 control depends on
   its continuous uptime; if it dies, the restart must be recorded in the register header.
3. **A proven egress block** — but note that `146-08`'s `EG1-CURL` is still its **own** row and must be
   taken from its **own** immediately-preceding run. `E1-CURL`/`E2-CHROMIUM` prove the *mechanism*, so
   that a failure in `146-08` is unambiguously about the application; they are not a substitute for it.
4. **The register at 130 placeholders.** `146-03` owns `B1-OLD` and `B2-OLD` (and the 40-cell noise
   matrix in the sibling ledger); the count should fall 130 → 120 at its close.
5. **A caution about `B1-OLD`:** the four captures passed cleanly here on an uninjected tree, so the
   baselines and the dataset are good — which means a `B1-OLD` that comes back RED is a real signal
   about the injection or the budget, not about the harness.

**Requirements:** `requirements-completed` is deliberately **empty**. The plan declares `[VGATE-04]`,
whose acceptance is *the visual project completes green with font egress blocked at the runner* — that
run is `146-08`'s `EG2-SUITE` and has not happened. This plan proved the block's **mechanism**, which
is a precondition of VGATE-04, not its discharge. `146-08` and `146-09` also declare VGATE-04 and have
no SUMMARY.

## Self-Check

- `146-NEGATIVE-CONTROL.md` — FOUND on disk; 29 rows, 130 `pending`, three target rows at 9/9 cells
- `tests/scripts/visual-container.sh` — FOUND on disk; `bash -n` exit 0; committed blob
  `4dea5f5cf28fc1f7f185a6644f9e2e71f4890de5` equals the blob the controls actually ran
- `tests/e2e-runs/146-d14-observe/{stdout.log,results.json,observed.txt,provenance.txt,exit}` — all FOUND
- `tests/e2e-runs/146-egress-ctl/{curl-control.log,chromium-control.log,provenance.txt,controls-exit}` — all FOUND
- commit `43ec683d7` — FOUND (`docs(146-02): record the host dev server's identity …`)
- commit `a3b10ff5a` — FOUND (`docs(146-02): fill D14-OBS …`)
- commit `61b685523` — FOUND (`fix(146-02): add --egress-control-only …`)
- commit `15516a78c` — FOUND (`docs(146-02): fill E1-CURL and E2-CHROMIUM …`)
- both task `<verify>` blocks and every plan `<verification>` command re-run at the closing HEAD — all pass
- product-path `git status --porcelain` — empty
- dev server PID `41925` — still running, same `22:38:56` start, still answering 200

## Self-Check: PASSED

---
*Phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity*
*Completed: 2026-08-25*
