---
phase: 136-real-guards-visual-repair-sweep-remediation
plan: 06
subsystem: testing
tags: [verification-gate, e2e, determinism, visual-regression, docker, requirements, ci]
status: complete

# Dependency graph
requires:
  - phase: 136-01
    provides: 'The re-pointed results performance budget + the shared voter fixture with the 10s dead wait removed'
  - phase: 136-02
    provides: 'Eleven subset matchers converted to exact equality; the dataWriter File->path assertion'
  - phase: 136-03
    provides: 'The blocking dev-seed-integration CI job; 4 orphaned probe specs deleted + the orphan-probe config guard'
  - phase: 136-04
    provides: 'The catalog-derived raw-i18n-key scanner on all 14 a11y surfaces'
  - phase: 136-05
    provides: 'The repaired, now-BLOCKING visual-regression project with container-generated baselines'
provides:
  - 'A 3x determinism gate over the combined phase result: 134 passed / 0 failed / 0 did-not-run, with port identity asserted by RESPONSE CONTENT rather than process type'
  - 'The visual gate verified in the CI-matching container 4/4 (3 stability runs + 1 CI-exact form), baselines byte-untouched'
  - 'REAL-01..04 flipped against measured evidence, each carrying its own coverage boundary in the requirement text'
  - 'A previously unrecorded CI hole: @openvaa/data and @openvaa/filters unit tests are reached by no CI command (D-136-06-1)'
  - 'Two todos: the deferred sweep findings, and the data/filters CI exclusion'
affects:
  [
    milestone-close,
    any-future-fake-guard-sweep-phase,
    ci-unit-test-wiring,
    candidate-app-a11y-coverage,
    visual-baseline-maintenance
  ]

actuals:
  tokens: 21000
  tasks: 2
  commits: 1

tech-stack:
  added: []
  patterns:
    - 'Assert the SERVED APPLICATION by response content before trusting any E2E result — process-type checks are defeated by any other Vite project on the machine'
    - 'Hold a mutual-exclusion lock around a gate run: two concurrent suites against one shared DB produce garbage that looks like a test failure'
    - 'Run a containerised verification with the served-app assertion made from INSIDE the container, not only from the host'
    - 'Corroborate a prior plan negative control with fresh gate measurements rather than restating its numbers'

key-files:
  created:
    - .planning/todos/pending/2026-08-12-fake-guard-sweep-deferred-findings.md
    - .planning/todos/pending/2026-08-12-data-filters-unit-tests-not-in-ci.md
    - .planning/phases/136-real-guards-visual-repair-sweep-remediation/136-06-SUMMARY.md
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/phases/136-real-guards-visual-repair-sweep-remediation/deferred-items.md

key-decisions:
  - 'Ran the gate at FRONTEND_PORT=5174 rather than evicting the sibling checkout container holding :5173 — killing another project\_s container is a side effect a verification gate has no business causing, and the port workaround is documented and was already exercised in plan 01'
  - 'Discarded the first run1 attempt rather than counting it: my own harness bug left two concurrent suites hitting one DB. Logged as an operator error, not an environment wedge and not a test failure'
  - 'Ran the visual project 4x (3 stability + 1 CI-exact) rather than the single run the plan required — the job is now blocking, so one green run is the weakest evidence that would still let it be called verified'
  - 'Did NOT fix the data/filters CI hole at the gate. It has a real prerequisite (D-136-02-1 makes yarn test:unit red) and the fix is a product decision about a locale-dependent formatter, not bookkeeping'
  - 'Restarted the dev server with --host 0.0.0.0 for the container runs rather than changing any repo config: it is a local accommodation for a containerised browser, and CI needs nothing of the kind'
  - 'Put every coverage boundary inside the requirement annotation rather than only in this summary — a boundary that lives only in a summary is invisible at ship time'

patterns-established:
  - 'A verification gate that discovers a new hole should NAME it in the requirement it qualifies, not absorb it into a green result. REAL-02 is flipped AND carries the fact that its own assertions do not run in CI.'
  - 'Concurrency is a failure mode of the gate harness itself. Lock the run.'

requirements-completed: [REAL-01, REAL-02, REAL-03, REAL-04]

coverage:
  - id: D1
    description: 'The full E2E suite passes three consecutive times with a fresh, identity-verified dev server and a clean DB per run'
    requirement: REAL-01, REAL-02, REAL-03, REAL-04
    verification:
      - kind: e2e
        ref: 'yarn test:e2e x3 -> 134 passed (10.4m) / 134 passed (10.3m) / 134 passed (10.3m); exit 0 each; 0 failed, 0 did-not-run, 0 flaky'
        status: pass
      - kind: e2e
        ref: "Per-run served-app assertion by response content: curl -s http://localhost:5174/ -> '<title>Election Compass</title>' before each suite"
        status: pass
      - kind: e2e
        ref: 'Suite size --list -> Total: 134 tests in 88 files, identical to the Phase-135 baseline'
        status: pass
    human_judgment: false
  - id: D2
    description: 'The visual project passes in the CI-matching container, since it is now a blocking gate'
    requirement: REAL-01
    verification:
      - kind: automated_ui
        ref: 'mcr.microsoft.com/playwright:v1.58.2-noble --platform linux/amd64 (Ubuntu 24.04.3 / x86_64 / node v24.13.0): 3 stability runs --project=visual-regression --workers=1, 7 passed (1.2m) each'
        status: pass
      - kind: automated_ui
        ref: 'CI-exact form (CI=true, --grep "@visual"): 7 passed (1.2m); git status --short tests/tests/specs/visual/ empty afterwards'
        status: pass
    human_judgment: false
  - id: D3
    description: 'REAL-01..04 are flipped only against recorded evidence, with every coverage boundary carried in the requirement text'
    requirement: REAL-01, REAL-02, REAL-03, REAL-04
    verification:
      - kind: manual
        ref: '.planning/REQUIREMENTS.md — four [x] flips + four mapping rows; five carry-forward boundaries plus one newly discovered, each inside the requirement annotation'
        status: pass
    human_judgment: true
    rationale: 'Whether an annotation states a boundary honestly rather than decoratively is a judgment about wording, not a machine check. The underlying numbers each annotation cites are machine-verified above.'

# Metrics
duration: 47min
completed: 2026-08-12
---

# Phase 136 Plan 06: Verification Gate + Requirement Flips Summary

The combined Phase-136 result holds: three consecutive full-suite runs at **134 passed / 0 failed /
0 did-not-run**, the now-blocking visual project green 4/4 in the CI-matching container, and
REAL-01..04 flipped against measured evidence. The gate also found one hole nobody had recorded — the
eleven F12 assertions this phase tightened are executed by **no CI command** — which is named inside
REAL-02 rather than smoothed over.

## What was verified

### The 3x E2E determinism gate

Canonical command throughout: `yarn test:e2e` (carries `--grep-invert @probe`; a bare
`npx playwright test` pulls in the perm-seeded `_probes` project and fails spuriously, as plan 04
discovered).

| Run | DB provenance                                                     | Served-app check (response content)          | Result                       | Duration        |
| --- | ----------------------------------------------------------------- | -------------------------------------------- | ---------------------------- | --------------- |
| 1   | `yarn db:reset` exit 0, 29s; `storage.buckets` = private + **public-assets** | `<title>Election Compass</title>` on :5174 | **134 passed**, 0 failed, 0 did-not-run, 0 flaky | 625 s (10.4 m) |
| 2   | `yarn db:reset` exit 0, 30s; `storage.buckets` = **public-assets** + private | `<title>Election Compass</title>` on :5174 | **134 passed**, 0 failed, 0 did-not-run, 0 flaky | 621 s (10.3 m) |
| 3   | `yarn db:reset` exit 0, 30s; `storage.buckets` = **public-assets** + private | `<title>Election Compass</title>` on :5174 | **134 passed**, 0 failed, 0 did-not-run, 0 flaky | 621 s (10.3 m) |

Before each run: previous dev server and its descendants killed, `yarn db:reset` (migrations +
`seed.sql`), `storage.buckets` asserted to contain `public-assets` (the imgproxy/storage-502 wedge
tripwire), `yarn dev:clean` for a cold Vite cache, then a fresh dev server. The seed of the
`e2e/base` dataset itself is done by the suite's own `data-setup-base` project, and its teardown
completes each run — `[134/134] [data-teardown-base] › delete base dataset` is the last line of all
three.

**Port identity was asserted by response content, not process type.** `:5173` was held for the whole
session by the sibling checkout's `voting-advice-application-frontend-1` Docker container, so the
gate ran at `FRONTEND_PORT=5174`. The check is the one the superseding todo prescribes —
`curl -s http://localhost:$PORT/ | grep -q '<title>Election Compass</title>'` — and the script
**refuses to start the suite** if it fails, rather than logging a warning. That is not ceremony: the
weaker "assert the listener is a node process" check was defeated during plan 01 by a foreign Vite
server from an unrelated project, and two full runs silently scanned the wrong application before it
was caught.

**Suite size unchanged.** `--list` reports **Total: 134 tests in 88 files** — identical to Phase
135's baseline, so none of this phase's changes moved the count: a 10 s wait removed from the shared
voter fixture, a re-pointed perf spec, 11 unit assertions tightened, 4 probe specs deleted, a raw-key
scanner added to 14 surfaces, and a registered candidate added to `e2e/base`.

**Guards observed doing their job, not merely passing.** Across the three runs the results perf
budget logged `timeToMatches` **1680 / 1378 / 1471 ms** against its 5000 ms budget and
`resultsFetches` **11 / 11 / 11** against `<= 13` — the operation count invariant across all three
runs and across both a 6-card and a 13-card result set, which is the load-independence property
plan 01 designed it for. Each run carried **16 `a11y-smoke` entries** (the 14 axe scans = 7 routes x 2
themes, plus the 2 `navigation-a11y` tests), and the raw-i18n-key scanner runs inside `assertAxeScan`,
so all 14 were scanned for raw keys in every run.

**DEF-135-04 did not recur.** `perm-interactive-info (EPERM-07)` — the undiagnosed 1-in-5 one-off
carried from Phase 135 — executed and passed in all three runs. Three clean runs is evidence of low
frequency, not proof of absence; it stays **OPEN**.

### The visual gate, in-container

The visual job is blocking in CI as of plan 05, so a green E2E gate that ignored it would be exactly
the overclaim this phase exists to eliminate.

Image `mcr.microsoft.com/playwright:v1.58.2-noble`, `--platform linux/amd64`, reporting
`Ubuntu 24.04.3 LTS / x86_64 / node v24.13.0` from inside. The host stack (Vite + Supabase) stayed on
the host; dual-stack socat forwarders put ports 5174 / 54321 / 54324 on the container's own loopback
so URLs, cookies and `storageState` are byte-identical inside and out. **The served-app assertion was
repeated from inside the container** before Playwright was allowed to start.

| Container run  | Invocation                                        | Result           |
| -------------- | ------------------------------------------------- | ---------------- |
| Stability 1    | `--project=visual-regression --workers=1`         | **7 passed** (1.2 m) |
| Stability 2    | `--project=visual-regression --workers=1`         | **7 passed** (1.2 m) |
| Stability 3    | `--project=visual-regression --workers=1`         | **7 passed** (1.2 m) |
| CI-exact form  | `CI=true`, `--grep "@visual"`                     | **7 passed** (1.2 m) |

Retries were disabled for the three stability runs (stricter than CI, which retries 3x). The CI-exact
run additionally re-confirms that `--grep` does not filter out the dependency setup projects — worth
knowing now that the job reddens the build. Afterwards `git status --short tests/tests/specs/visual/`
is **empty**: the gate compared against the committed baselines and did not silently re-record them.

### Static gates

| Gate                                       | Result                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `yarn build`                               | exit 0 — 14/14 tasks                                                                       |
| `yarn workspace @openvaa/frontend check`   | exit 0 — `COMPLETED 2092 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`                   |
| `yarn lint:check`                          | exit 0 — baseline exactly as stated: **1** `playwright/prefer-to-have-length` (`candidate-bank-auth-journey.spec.ts:208`) + **1** `Unused eslint-disable directive` (`mockOidcIssuerEntry.ts:33`); package-level warnings unchanged (core 2, dev-seed 15, frontend 1) |
| `yarn format:check`                        | exit 0 — before and after the doc edits                                                    |
| `yarn typecheck:tests`                     | exit 0                                                                                     |
| `yarn test:unit --force` (quiet)           | exit 0 — 19/19 tasks, 0 cached; dev-seed **444/444**, `[NF-01] seed step elapsed: 6623 ms`  |
| `yarn test:unit --force` (**under load**)  | exit 0 — 19/19 tasks, 0 cached; dev-seed **444/444**, seed elapsed **16627 ms**, 14 CPU burners on a 14-core machine, load average peak **40.86** |

The load run is the substantive one. At **16627 ms** the seed step ran at **1.66x the 10000 ms
wall-clock budget GUARD-03 deleted** — so the assertion that was removed would have FAILED this very
run, while the operation budget that replaced it passed. That is GUARD-03's load-independence claim
re-measured at this gate rather than restated from Phase 135, and it is also what F5's CI wiring now
puts on `main`.

## What the gate found

### D-136-06-1 — the F12 assertions do not run in CI

`yarn test:unit` is `turbo run test:unit`, which executes only workspaces that **declare a
`test:unit` script**. Measured (`yarn test:unit --force`, 19/19 tasks, 0 cached), the task graph
resolves to `app-shared`, `dev-seed`, `docs`, `frontend`, `supabase` — and nothing else.
`@openvaa/core`, `data`, `filters`, `matching`, `llm`, `question-info` and `argument-condensation`
each ship a working `vitest.config.ts` and **no** `test:unit` script. They run only under a bare root
`vitest` (wired by the root `vitest.config.ts` workspace array), which nothing in
`.github/workflows/main.yaml` invokes.

That means the **eleven** subset matchers plan 02 converted to exact equality — the ones a two-run
negative control proved catch 8 over-inclusion regressions the old matchers could not see — are real
guards that no CI command reaches. Run directly they are green:
`npx vitest run --project @openvaa/data --project @openvaa/filters` -> **265 passed**, plus the
1 pre-existing D-136-02-1 failure.

This is **finding F5's pathology on a different surface** — a guard that looks like coverage and
produces no signal — rediscovered by the gate for the phase whose entire purpose was eliminating
that shape. It was not fixed here because it has a genuine prerequisite: wiring those packages in
makes `yarn test:unit` red on D-136-02-1 (`formatAnswer.test.ts:25` hard-codes an `en-US` rendering
while `formatDateAnswer` falls back to the **ambient machine locale**; this machine is `fi`), and
choosing between "pin the locale in the test" and "make the fallback deterministic" is a product
decision about a formatter whose output depends on its host. Filed as a todo, recorded in
`deferred-items.md`, and carried as a named boundary inside REAL-02.

### D-136-06-2 — the visual gate needs a non-loopback bind locally

Vite binds `127.0.0.1` by default, so the containerised visual run fails at its served-app check with
`socat ... connect(... 192.168.65.254:5174): Connection refused` until the host dev server is started
with `--host 0.0.0.0`. Local re-baselining/verification concern only — in CI the visual job runs
Playwright directly on the runner against localhost — but the failure reads like a networking problem
rather than a bind-address one, and the container recipe in `visual-regression.spec.ts`'s docblock
does not mention it.

## Requirement flips

REAL-01, REAL-02, REAL-03 and REAL-04 are ticked, with mapping rows added (they were absent from the
traceability table entirely). Each annotation cites measured values rather than asserting completion:
the 17 -> 25 stub-failure delta (F12), the 441 -> 6993 ms vs unmoved 55 ms side-by-side (F1), the
reproduced CI green-skip and its `Test Files 1 failed | 41 passed` negative control (F5), the
scanner's 598-key set and its `about.title` negative control naming the offending DOM node (F2), and
the 4/4 in-container visual runs (REAL-01).

**Six boundaries are carried in the requirement text, not just here:**

| Boundary                                                                       | Where it lives  |
| ------------------------------------------------------------------------------ | --------------- |
| The raw-key scanner covers 7 voter surfaces x 2 themes; the **candidate app is not covered** (D-136-04-1) — 2 sites stay blind | REAL-04         |
| The now-blocking visual gate **depends on egress to `fonts.googleapis.com`** (D-136-05-2); self-hosting Inter is the recommended follow-up | REAL-01         |
| F5's CI wiring is **structurally verified but not yet observed**; `supabase status -o env` key names are assumed stable | REAL-03         |
| Sweep findings **F3, F9, F10, F13, F15–F20 remain deferred**, with a todo filed | REAL section note + REAL-02 |
| **DEF-135-04** (`EPERM-07` one-off) remains **OPEN**                            | REAL section note + REAL-02 |
| **NEW:** the F12 assertions **do not run in CI** (D-136-06-1)                   | REAL-02         |

## Deviations from Plan

### Discarded run (logged, not counted)

**1. Two concurrent suites against one DB — operator error, not an environment wedge**

- **Found during:** Task 1, first `run1` attempt.
- **Issue:** My runner script used `setsid`, which does not exist on macOS, so the dev-server launch
  failed and the attempt sat in its served-app poll loop. I started a replacement run while the first
  was still polling; when the replacement's dev server came up, the *first* attempt's poll succeeded
  too and it launched a **second concurrent `yarn test:e2e`** against the same database and the same
  log path. The result — `1 failed [data-setup-base] / 106 did not run / 27 passed` interleaved with a
  second `Running 134 tests` banner — looked like a base-dataset failure and was nothing of the kind.
- **Fix:** Replaced `setsid` with a plain background launch plus `pkill -P` descendant cleanup, and
  put a `mkdir`-based mutual-exclusion lock around the whole cycle so a second run cannot start.
- **Disposition:** the attempt was **discarded and quarantined**
  (`DISCARDED-run1-concurrent.e2e.log`), and the count started at zero. It is logged here because a
  discarded run that goes unmentioned is indistinguishable from one that never happened.

### Auto-fixed issues

**2. [Rule 3 - Blocking] `DOCKER_CONFIG` override broke docker context resolution**

- **Found during:** Task 1, first container invocation.
- **Issue:** Plan 05's workaround for the wedged `docker-credential-desktop` helper is a scratch
  `DOCKER_CONFIG` with no `credsStore`. But the docker CLI also resolves its **context** from that
  directory, so an empty scratch config silently falls back to the `default` context and fails with
  `dial unix /var/run/docker.sock: no such file or directory` — Docker Desktop's socket is at
  `~/.docker/run/docker.sock` via the `desktop-linux` context.
- **Fix:** Pass `DOCKER_HOST=unix:///Users/kallejarvenpaa/.docker/run/docker.sock` alongside the
  scratch `DOCKER_CONFIG`. (The image was already present locally, so no pull — and therefore no
  credential lookup — was needed at all.)

**3. [Rule 3 - Blocking] Container could not reach the host dev server**

- **Found during:** Task 1, first successful container start.
- **Issue:** `connect(... 192.168.65.254:5174): Connection refused` — Vite binds loopback only.
- **Fix:** Restarted the host dev server with `--host 0.0.0.0`. No repo config was changed; CI needs
  nothing of the kind. Recorded as D-136-06-2.

**4. [Rule 2 - Missing record] The traceability table had no REAL rows**

- **Found during:** Task 2.
- **Issue:** `.planning/REQUIREMENTS.md`'s requirement -> phase mapping table stopped at FIX-03; the
  four REAL requirements had never been added, so ticking the checkboxes alone would have left them
  unmapped.
- **Fix:** Added four `| REAL-0n | Phase 136 | Complete (2026-08-12) |` rows.

### Scope boundaries respected

STATE.md and ROADMAP.md were **not** touched (orchestrator-owned). The data/filters CI hole was
**not** fixed — see D-136-06-1 for why that is a decision rather than an omission.

## Environment notes

- `:5173` was held all session by the sibling checkout's `voting-advice-application-frontend-1`
  container. The gate ran at `FRONTEND_PORT=5174` rather than evicting another project's container.
- No storage 502, no imgproxy 502, no `cookies.set` dev-server kill (DEF-135-02) occurred. The
  `public-assets` bucket was asserted present after every `db:reset`.
- Working tree after the gate: clean apart from `supabase/.temp/cli-latest`.

## Commits

| Task | Commit      | What                                                                 |
| ---- | ----------- | -------------------------------------------------------------------- |
| 1    | —           | Verification only; produced evidence, no tracked artifact to commit   |
| 2    | `64beb3d23` | REAL-01..04 flips + mapping rows, 2 todos, deferred-items entries      |

## Self-Check: PASSED

- `.planning/todos/pending/2026-08-12-fake-guard-sweep-deferred-findings.md` — FOUND
- `.planning/todos/pending/2026-08-12-data-filters-unit-tests-not-in-ci.md` — FOUND
- `.planning/REQUIREMENTS.md` — 4/4 REAL requirements read `[x]`, 4/4 mapping rows present
- commit `64beb3d23` — FOUND in `git log`; `git diff --diff-filter=D HEAD~1 HEAD` reports no deletions
