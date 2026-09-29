---
phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity
plan: "08"
subsystem: testing
tags: [playwright, visual-regression, docker, egress-block, determinism, fonts, negative-control]

requires:
  - phase: 146-07
    provides: the four re-captured baselines, the D-16 re-scope, and the production-build request trace
  - phase: 146-05
    provides: self-hosted Inter, the `staticSettings.font.url` default, and `guardThirdPartyFonts`
  - phase: 146-04
    provides: '`maxDiffPixels: 200` in `tests/playwright.config.ts`'
  - phase: 146-01
    provides: '`visual-container.sh`, `tcp-forward.mjs`, and the 29-row register opened before any measurement'
provides:
  - VGATE-04 discharged by observation — the full visual project green in-container with both font hosts blackholed at the runner, behind a `curl` control that failed first in the same session
  - VGATE-06's consecutive-run proof — five strict runs at `--workers=1 --retries=0` plus one at CI's literal invocation, all green, zero retries consumed
  - the two structural rows that make those greens mean something — the served-application gate byte-identical across the phase, and the baselines compared rather than re-recorded
  - a complete `146-NEGATIVE-CONTROL.md` — 29 rows, 0 placeholder cells, corpus asserted about itself, with Gates, Final counts, Pairs, Non-pair rows and Residue written
affects: [146-09, gsd-verify-work, ci-visual-job]

actuals:
  tokens: 19000
  tasks: 4
  commits: 4

tech-stack:
  added: []
  patterns:
    - 'Control-before-claim: a must-FAIL control taken in the same container session immediately before the green it licenses, enforced structurally by an exit-6 abort rather than by procedure'
    - 'Latency-excursion decomposition: when a green run is anomalously slow, split its trace into Before Hooks / verdict step / After Hooks against a normal sibling run, so "slow" is attributed rather than shrugged at'
    - 'Anchored placeholder counting: a self-documenting ledger must count its placeholder cells with a row-anchored pattern, because a bare match counts the documentation of the convention as unfinished work'

key-files:
  created: []
  modified:
    - .planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/146-NEGATIVE-CONTROL.md
    - .planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/deferred-items.md

key-decisions:
  - 'REQUIREMENTS.md was deliberately NOT flipped here. The plan prohibits record edits ("Record corrections land in 146-09, after these gates are green — the Phase-144 ordering") and declares exactly one modified file. VGATE-04 and VGATE-06 are now dischargeable on the evidence; the flip belongs to 146-09 alongside the ROADMAP close.'
  - 'Run 04''s +23 s excursion was diagnosed rather than annotated: decomposed from its own trace to context teardown (15,501 ms vs 1,175 ms), with `re-dialled=0` ruling out the phase''s known dropped-SYN defect. Host I/O contention on the instrument, not a product or gate defect.'
  - 'The misinvoked first `--ci-literal` attempt was retained on disk and disclosed in the register rather than deleted, and is counted neither as `D17-CI` nor among the five strict runs.'
  - 'The plan''s own `<verify>` placeholder check is over-broad and was replaced with the register''s documented row-anchored form; the defect is carried to 146-09 rather than worked around by mangling the register''s prose.'

patterns-established:
  - 'Two-directional integrity proof: a range `git diff --exit-code` AND a blob-identity comparison, because a range diff only says the endpoints match and would miss an edit-then-revert.'
  - 'Compared-not-re-recorded, proven three ways: porcelain status, blob identity, and the absence of `--update-snapshots` in every recorded invocation.'

requirements-completed: []

coverage:
  - id: D1
    description: 'The full visual project completes green in-container with egress to both Google font hosts blackholed at the runner, behind a curl control proven to fail first in the same session'
    requirement: VGATE-04
    verification:
      - kind: automated_ui
        ref: 'tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-egress-green --block-egress → exit 0, 7/7, 0 unexpected, 0 flaky, 74,429 ms'
        status: pass
      - kind: integration
        ref: 'tests/e2e-runs/146-egress-green/curl-control.log → `curl: (7) Failed to connect to fonts.googleapis.com port 443 after 10 ms`, written 21:10:43, 4 s before results.json startTime 21:10:47'
        status: pass
  - id: D2
    description: 'The visual project passes green across five consecutive runs stricter than CI, plus one run at CI''s literal invocation'
    requirement: VGATE-06
    verification:
      - kind: automated_ui
        ref: '146-det-run01..05 at --workers=1 --retries=0 → exit 0 each, 35/35 tests, 0 unexpected, 0 flaky, 0 retries consumed'
        status: pass
      - kind: automated_ui
        ref: '146-det-ci via --ci-literal (CI=true, --grep "@visual", no --project) → exit 0, 7/7, config.workers 1 and visual-regression retries 3 read back from results.json'
        status: pass
  - id: D3
    description: 'The served-application integrity gate was never weakened to make any of the phase''s runs possible'
    verification:
      - kind: other
        ref: 'git diff --exit-code 512aacc1e~1..HEAD -- tests/tests/support/preflight.ts tests/global-setup.ts → exit 0; git hash-object → 389197f038e3b53a6836ea467444d6097e134429 and 1c4a29d3326ae8c4a2573a0678fe84e6f3b40fab, equal to 146-01''s restoration table'
        status: pass
  - id: D4
    description: 'The gate compared against its committed baselines rather than re-recording them'
    verification:
      - kind: other
        ref: 'git status --short tests/tests/specs/visual/ → empty; four baseline blobs unmoved; grep -l update-snapshots across all eight run dirs → no match'
        status: pass
  - id: D5
    description: 'The self-hosted-font default did not perturb the default E2E suite'
    verification:
      - kind: e2e
        ref: 'yarn test:e2e → 135 passed (11.0m), exit 0, 0 failed / 0 skipped / 0 flaky / 0 did-not-run; --list → Total: 135 tests in 89 files'
        status: pass

status: complete
---

# Phase 146 Plan 08: The Gates Summary

Everything Phase 146 built is now an observed gate result: the visual project runs green with the
runner's egress to both Google font hosts blackholed, across six further runs at a strictness CI does
not demand, with the served-application check and the four reference PNGs proven untouched throughout.

## What was proven

**VGATE-04 — the egress-blocked green.** One container session, `--block-egress`, no snapshot-update
flag. The `curl` control ran first and **failed with exit 7** (`Failed to connect to
fonts.googleapis.com port 443 after 10 ms` — connect, not resolve, which is the signature of a name
pointed at loopback with nothing listening). The ordering is proven by timestamp rather than by
assertion: `curl-control.log` was written at 21:10:43 and `results.json`'s `startTime` is 21:10:47 —
four seconds later, in the same `--rm` container. Then the full project ran **7/7 green, exit 0**,
behind `/etc/hosts` lines this run wrote its own provenance for. Seven tests, not four: the three
dependency projects ran too.

The positive half research Pitfall 3 insists on is recorded explicitly. A green egress-blocked run
that made *no* `/fonts/inter.css` request would be a warning, not a success — it would mean the page
never asked for a font and the capture is fallback glyphs. `guardThirdPartyFonts` passed on all four
captures, and it is three assertions: zero third-party font resource entries, `/fonts/inter.css`
**present** in `performance.getEntriesByType('resource')`, and that stylesheet returning **200**.

**VGATE-06 — the determinism sweep.** Five consecutive runs at `--workers=1 --retries=0`, all at one
pinned HEAD, all green, **zero retries consumed** (every result carries `retry 0`, so nothing here is
a second attempt reported as a first). Then one run at CI's literal invocation — `CI=true`,
`--grep "@visual"`, **no** `--project=` — which yielded the predicted **7** tests, with
`config.workers` = 1 and the `visual-regression` project's `retries` = 3 read back out of its own
`results.json` rather than restated from the config.

| Run | Exit | Tests | Retries used | Duration |
|---|---|---|---|---|
| `D17-R01` | 0 | 7/7 | 0 | 71,164 ms |
| `D17-R02` | 0 | 7/7 | 0 | 71,827 ms |
| `D17-R03` | 0 | 7/7 | 0 | 74,616 ms |
| `D17-R04` | 0 | 7/7 | 0 | **108,063 ms** |
| `D17-R05` | 0 | 7/7 | 0 | 82,964 ms |
| `D17-CI` | 0 | 7/7 | 0 of 3 available | 81,584 ms |

## The one thing that needed diagnosing

Run 04 — the index the v2.14 anomaly occupied — took 108 s against the sweep's 71–83 s band, with
`Voter Results - Desktop` at **45,382 ms** against a 22,239–25,306 ms band. Under the E2E Hard Rule a
green with an unexplained excursion at that index is exactly what not to wave through.

Decomposed from its own `test.trace` against run 01's: `Before Hooks` 24,145 ms vs 19,674 ms (+4.5 s)
and **`After Hooks` 15,564 ms vs 1,182 ms** (+14.4 s), of which `Fixture "context"` teardown is
**15,501 ms** against 1,175 ms. The excursion lands in **context teardown** — the trace-zip flush
across the bind mount — and in setup. The verdict-bearing step itself,
`Expect toHaveScreenshot(voter-results-desktop.png)`, took 3,463 ms and **passed**.

It is **not** the phase's known dropped-SYN defect: the forwarder reports `re-dialled=0 gave-up=0`.
Diagnosis: host I/O/CPU contention on the measuring apparatus, recorded as an observation about the
instrument rather than absorbed into the gate's verdict.

**A negative result worth stating.** Across all seven container runs this plan took, the forwarders
recorded **0 dropped SYNs in ≈1,134 connections** — against `146-07`'s 33 in 2,239 (1.47 %). The
absorb path was never exercised, so these runs are **no new evidence** for or against the `4066c2f41`
fix. They are evidence the gate is green and stable, which is the claim VGATE-06 actually makes.

## The two structural rows

These do not measure the application. They measure whether the greens above were earned.

- **`PF1-UNTOUCHED`** — both proofs, not one. `git diff --exit-code 512aacc1e~1..HEAD` over
  `tests/tests/support/preflight.ts` and `tests/global-setup.ts` exits **0** across the phase's full
  commit range; and because a range diff only says the endpoints match, `git hash-object` on both at
  HEAD returns `389197f038e3b53a6836ea467444d6097e134429` and `1c4a29d3326ae8c4a2573a0678fe84e6f3b40fab`
  — character-for-character the values `146-01` recorded before any run existed. Every
  `E2E PREFLIGHT OK` line quoted anywhere in this phase came from that byte-identical preflight.
- **`SS1-EMPTY`** — proven three ways. `git status --short tests/tests/specs/visual/` is empty; the
  four baseline blobs are unmoved (`15dabda7…`, `78d8fad2…`, `402f4bf8…`, `8878188…`); and **no run in
  `146-08` passed `--update-snapshots` in any form**, checked across all eight run directories. A gate
  that silently re-records its references reports a perfect green and asserts nothing — this is the
  row that rules that out.

## The cardinal gate

`yarn test:e2e` → **135 passed (11.0 m), exit 0, 0 failed / 0 skipped / 0 flaky / 0 did-not-run**,
after `yarn db:reset` against dev server PID `31124`. One `E2E PREFLIGHT OK`, zero
`E2E PREFLIGHT FAILED`.

The count was **re-derived, not assumed**: `--list` → `Total: 135 tests in 89 files`, against
`136-05-SUMMARY.md`'s recorded **134**. The +1 is neither drift nor this phase —
`137-VALIDATION.md:99-101` already recorded that Phase 138 raised it to 135 by shipping
`eperm07-term-trigger` as a permanent LEAF regression guard. Phase 146 added, removed and renamed zero
default-suite tests.

The visual project is excluded from `yarn test:e2e` by construction (`playwright.config.ts:388,411`
declare it only under `PLAYWRIGHT_VISUAL`), which is exactly why this run is the guard it is: this
phase changed a **global** default that every route in both apps renders under, so "the visual
baselines still match" would be a weak claim on its own.

## Gates

All at HEAD `03d793717`, product tree clean before the first and after the last, turbo-mediated gates
forced (`0 cached`) because a replayed exit code is a claim about a previous tree.

| Gate | Command | Exit | Result |
|---|---|---|---|
| build | `TURBO_FORCE=true yarn build` | 0 | 14/14, `0 cached, 14 total` |
| lint + typecheck | `TURBO_FORCE=true yarn lint:check` | 0 | 22/22, `0 cached`, **0 errors**, 20 pre-existing warnings (core 2, dev-seed 15, frontend 1, root tests 2), svelte-check 0/0 |
| format | `yarn format:check` | 0 | all matched files |
| unit | `TURBO_FORCE=true yarn test:unit` | 0 | 25/25, `0 cached`, 173 files, **1,832 tests**, 0 failed, 0 skipped |
| egress-blocked visual | `visual-container.sh --block-egress` | 0 | 7/7 behind a control that failed first |
| determinism ×5 | `visual-container.sh` at `--retries=0` | 0 ×5 | 35/35, 0 retries consumed |
| determinism CI-literal | `visual-container.sh --ci-literal` | 0 | 7/7, workers 1 / retries 3 read back |
| preflight untouched | `git diff --exit-code` + `git hash-object` | 0 | both proofs |
| baselines compared | `git status --short tests/tests/specs/visual/` | 0 | empty |
| no dependency added | `git diff --exit-code 512aacc1e~1..HEAD -- package.json yarn.lock` | 0 | no output — `T-146-SC` discharged; the woff2 files are vendored static assets, not a runtime dependency |
| clean tree | `git status --porcelain -- apps packages tests .github package.json yarn.lock` | 0 | empty |
| **E2E, cardinal, last** | `yarn test:e2e` | 0 | **135 passed** |

## The ledger

`146-NEGATIVE-CONTROL.md` is closed: **29 rows, 0 placeholder cells**, corpus asserted about itself,
with `## Gates`, `## Final counts`, `### Pairs by outcome class`, `### Non-pair rows`,
`## Completeness` and `## Residue` written.

The placeholder count fell **145 → 130 → 120 → 95 → 80 → 55 → 45 → 15 → 0**, and every intermediate
value was **read back out of the commit graph** with `git show <commit>:<this file>` piped through the
row-anchored pattern — not copied from a plan summary. Five pairs, ten halves, nineteen non-pair rows;
zero borrowed observations, zero cache replays admitted as evidence, zero deferred rows.

`146-VISUAL-NOISE-LEDGER.md` was already complete as of `146-06` (0 placeholder cells) and needed
nothing here.

## Deviations from Plan

### `[Rule 3 — Blocking]` The plan's placeholder check cannot pass as written

The plan's Task 4 `<verify>` counts placeholders with a bare `\bpending\b` match over the whole file
and requires 0. That can never return 0, because the register **documents its own placeholder word**
in four places — the header sentence defining it, the precedent-chain sentence, § Register's
`29 × 5 = 145` arithmetic, and the grep example in that block, which necessarily contains the word it
searches for.

Satisfying it would have meant mangling the prose the register needs, which is the same move the
prompt forbids for VGATE-05's woff2 criterion. Instead the **row-anchored** count was used — the
register's own documented method, and the one `146-VISUAL-NOISE-LEDGER.md` independently arrived at
for the identical reason. It returns **0**. The check's over-breadth is recorded in § Residue as a
third wrong acceptance criterion for `146-09`.

### `[Rule 3 — Blocking]` Executor slip: the first `D17-CI` attempt omitted `--ci-literal`

The first run into `tests/e2e-runs/146-det-ci` was invoked without the flag, so it executed as a plain
`--project=visual-regression --workers=1 --retries=0` run — `CI` unset, no `--grep`, `retries` 0.
Caught by reading `pw-args.txt` back rather than trusting the invocation. It was green (7/7, exit 0,
82 s) and is **retained unaltered** at `tests/e2e-runs/146-det-ci-MISINVOKED/`, counted neither as
`D17-CI` nor among the five. The correctly-invoked replacement is the row. Disclosed in § Residue
under the norm `145-NEGATIVE-CONTROL-LEDGER.md` established: silence about a discarded run is exactly
what makes a green arguable.

### Deliberate non-action: `REQUIREMENTS.md` was not flipped

The default executor step marks the plan's frontmatter requirements complete. It was **not** taken
here. The plan prohibits record edits in this wave — *"Record corrections land in `146-09`, after these
gates are green — the Phase-144 ordering"* — and declares exactly one `files_modified` entry. Flipping
VGATE-04/06 while VGATE-01/02/03/05 stay pending would also produce precisely the half-state that
ordering exists to avoid, and `146-09` must correct VGATE-05's wording in the same pass. The evidence
for both is now in the register; the flip is `146-09`'s.

## Task 1 — the reset and restart

The plan's Task 1 is a `checkpoint:human-action`; the launching prompt pre-authorised the restart and
supplied the outgoing PID, so it was performed directly and recorded in the ledger header's restart
history (appended, never overwritten):

`94791` → **`31124`**, started `2026-08-26 21:08:32` local (yarn wrapper `31121`), Vite v6.4.1, port
`5173`, no `FRONTEND_PORT` override, bind `node 31124 … TCP *:5173 (LISTEN)` — wildcard, **exactly one
listener**. Sequence, in order: `yarn build` (14/14, all cached at HEAD `5bb95083e` on a clean tree,
`app-shared/dist/index.js` carrying `/fonts/inter.css` and **zero** `inter-alt`), `yarn db:reset`,
`yarn db:seed --template e2e/base` (143 rows + 30 portraits, seed 42), then
`yarn workspace @openvaa/frontend dev --host 0.0.0.0`. Served-app sanity all 200 on `/`,
`/fonts/inter.css`, and the `/@fs/…/+layout.svelte` clause the preflight actually tests. The header
also records that the D-16 continuous-uptime constraint **lapsed with `146-07`**, so this restart was
required rather than merely permitted.

## Requirements status

| Req | Dischargeable on this plan's evidence? | Why |
|---|---|---|
| **VGATE-04** | **Yes** | `EG1-CURL` (must-fail control, exit 7, same session, 4 s earlier) + `EG2-SUITE` (7/7 green behind the blackhole, applied at the runner by `--add-host`, not simulated). Scope limit: the pinned container on this host, **not** a GitHub runner. |
| **VGATE-06** | **Yes** | Baselines re-captured in the CI-matching container (`146-07`), and the full visual project green across **six** further runs here — five stricter than CI, one at CI's literal invocation. |
| VGATE-01/02/03 | Not this plan's | Discharged by `146-03`/`146-04`'s rows (`B1-OLD`/`C1-NEW`, `B2-OLD`/`C2-NEW`, `H0`/`H1`/`H2`, the 40-cell noise matrix). |
| **VGATE-05** | **No — its criteria are wrong as written** | `146-07`'s production trace fetched **2 of 4** woff2 files (the `latin-ext` pair's `unicode-range` is never exercised by the content — correct browser behaviour, mistaken criterion), and reached `/questions`, `/results`, `/candidate/preview` as **307/303 guard redirects** rather than as located/authenticated documents. This plan's egress-blocked run does **not** improve that: it drives the **dev** server via the suite's fixtures, a different instrument. Both carried to `146-09`. |

The flips themselves belong to `146-09`, per the plan's record-ordering prohibition.

## Residue carried forward

- **The CI runner half** of criterion 4 and of `D17-CI` remains unobserved on this branch (`main.yaml`
  triggers on push/PR to `main`; this branch is far ahead of a stale `origin/main`). `D17-CI` is CI's
  **invocation**, not CI's **environment** — the register says so explicitly. Discharges on the
  branch's first PR, per the Phase 137 precedent.
- **D-16's chartered claim.** Re-scoped, not executed. The original end-to-end symptom was **never
  reproduced after the fix**, so the chain from "the stall is bounded to ≤ 4 s" to "the fixture no
  longer fails" is **mechanical rather than demonstrated**. Six further runs gave it another chance and
  it did not appear — but with 0 dropped SYNs, they add no evidence about the absorb path either.
  Recorded as "did not recur", never as "gone".
- **VGATE-05's two wrong criteria** and **the plan's over-broad placeholder check** — three record
  corrections for `146-09`.
- Known-remaining by decision (todos filed in `146-09`): `apps/docs`'s own hardcoded Google Fonts
  `<link>`, `cloud.umami.is` analytics references, the 15 dead weight classes, `CLAUDE.md`'s stale
  ESM/CommonJS claim.

## Deferred Issues

- `F3-BOGUS-GREEN` splits into 11 fields under a naive `awk -F'|'` cell count, because its
  `Assertion outcome` contains an escaped pipe inside a code span. Markdown renders it correctly.
  **Pre-existing** — it already read 11 at `146-07`'s HEAD — so it is outside this plan's scope
  boundary. Logged in `deferred-items.md`; not fixed.

## Known Stubs

None. This plan writes no product bytes — every run compares, none records.

## Commits

| Task | Commit | What |
|---|---|---|
| 1 | `bffc8fde7` | the reset and dev-server restart, appended to the ledger header |
| 2 | `2e29bf632` | `EG1-CURL` + `EG2-SUITE` — VGATE-04 |
| 3 | `03d793717` | `D17-R01`…`R05` + `D17-CI` — the determinism sweep |
| 4 | `552a6f898` | `PF1-UNTOUCHED`, `SS1-EMPTY`, `E2E1-SUITE` and every closing section |

**Dev server for the next plan: PID `31124`**, `*:5173`, wildcard bind, one listener.

## Self-Check: PASSED

All claimed files exist on disk (SUMMARY, register, and the seven `results.json` files for the
egress-blocked run, the five strict runs, the CI-literal run and the retained misinvoked run). All
four task commits — `bffc8fde7`, `2e29bf632`, `03d793717`, `552a6f898` — are present in the commit
graph.
