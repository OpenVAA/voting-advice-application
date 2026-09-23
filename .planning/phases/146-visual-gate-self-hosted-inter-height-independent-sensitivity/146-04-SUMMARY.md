---
phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity
plan: "04"
subsystem: testing
tags: [playwright, visual-regression, screenshot-diff, maxDiffPixels, height-independence, negative-control]

requires:
  - phase: 146-01
    provides: "`tests/scripts/visual-container.sh` (+ `--config`, added in `146-03`) and `tcp-forward.mjs`; the 29-row register and the 40-cell ledger, both enumerated before any run"
  - phase: 146-02
    provides: "`D14-OBS` — the served-application preflight observed passing from inside the pinned container; the host dev server's recorded identity"
  - phase: 146-03
    provides: "`B1-OLD`/`B2-OLD` (the blindness half) and § *Derivation (D-05)* — `cap = 200`, via the floor branch over a measured-zero noise floor"
  - debug: tied-match-order-churn
    provides: "`53002b6a9` + `dbb704bd4` — the tie-break fixes that removed the churn, and with it the stale-baseline offset this plan had to work around"
provides:
  - "`tests/playwright.config.ts` — `maxDiffPixels: 200`, **the phase's first product byte**, with its derivation, the `Math.min` rule and the small-baseline-floor re-documentation legible at the point of use"
  - "`C1-NEW`/`C2-NEW` — the catch half: the same injected blob that PASSED under the ratio-only budget now FAILS both voter baselines under the cap. ROADMAP criterion 2 discharged in both directions"
  - "`H0-GROWTH`/`H1-SHORT`/`H2-LONG` — the D-06 height-independence control: identical absolute damage at two page heights, both budgets, eight verdicts, no fifth baseline. ROADMAP criterion 3 discharged by measurement"
  - "the measured fact that the injection's damage against CURRENT baselines is ~4,783 px — two orders below every ratio budget in the suite, so the old configuration is blind to it on BOTH voter baselines, not just desktop"
affects:
  - "`146-06` — its font-delta measurement is now taken against the cap already in force, so 'did the pixels move?' and 'did the verdict move?' are no longer confounded"
  - "`146-07` — still owns the one committed re-baseline; nothing here was committed to `__screenshots__/`"

tech-stack:
  added: []
  patterns:
    - "throwaway Playwright overlay under `tests/e2e-runs/` with `snapshotPathTemplate` redirected, `globalSetup` absolutised (F-146-P1) and every inherited project's `testDir` absolutised (F-146-P2)"
    - "pass mode carried in a throwaway `mode.json` beside the overlay rather than through the container harness's env allow-list"

key-files:
  created: []
  modified:
    - "tests/playwright.config.ts — `maxDiffPixels: 200` + a 24-line derivation comment"
    - ".planning/phases/146-…/146-NEGATIVE-CONTROL.md — 5 rows filled, 3 disclosure sections added"

decisions:
  - "the config comment states that the FLOOR set the 200, not the measurements — the ledger's own § *Read step 3 honestly* framing, carried into the file every future run obeys"
  - "the comment records the ratio as DORMANT on all four current baselines rather than as the binding knob on `candidate-preview-mobile`, because at `cap = 200` the cap binds everywhere (ledger § *Which knob binds where*)"
  - "the stale committed voter baselines were refreshed IN THE WORKING TREE ONLY before the catch run (operator-approved) and fully reverted, because under `cap = 200` they fail with no injection at all and the catch proof would have been vacuous"
  - "two passes beyond the planned three were taken for the D-06 control, to place a defect inside the window the page's own growth opens; the negative result at the injection-sized damage level is recorded alongside the positive one"

metrics:
  duration: "~1h05m"
  completed: "2026-08-26"

actuals:
  tokens: 6800
  tasks: 3
  commits: 3

status: complete
---

# Phase 146 Plan 04: Install the cap, prove it catches, prove it stays flat — Summary

`maxDiffPixels: 200` is in `tests/playwright.config.ts` with its derivation legible at the point of
use; the same injected blob that the ratio-only budget passed at 41 % of budget now fails both voter
baselines; and the same absolute damage, measured at two page heights against its own throwaway
references, fails identically under the cap while flipping green as the page grows under the old
budget.

## What landed

### Task 1 — the cap (`badae5c04`)

`expect.toHaveScreenshot` now reads `{ threshold: 0.2, maxDiffPixels: 200, maxDiffPixelRatio: 0.01 }`.
`threshold` and the ratio are untouched; nothing else in the file moved; no per-assertion override
exists anywhere (`grep -rn maxDiffPixels tests/tests/` → no matches).

The comment block above it says, in the file's own house style:

- **Which knob is primary** — the cap is the operative budget on all four baselines; the ratio is
  retained as the **small-baseline floor** and is **dormant** on every baseline the suite has today.
- **Why keeping both is safe** — `comparators.js:88-96` computes
  `maxDiffPixels2 = width × height × maxDiffPixelRatio` and then `Math.min(…)`, so an absolute cap is
  monotonically strictness-increasing and `min(cap, 0.01 × area)` is bounded by `cap` at any height.
- **The derivation, written out and read honestly** — `max(observed noise) × 10`, floored at 200,
  strictly `< 5,000`; the measured noise was **0 px in all 40 cells**, so `0 × 10 = 0` and **the floor —
  a constant fixed in advance — set the value**. The measurements' contribution is stated as what it is:
  a licence to take the floor, because a zero noise floor gives any positive cap complete headroom.
- **Where the ratio would bind, concretely** — only under ~20,000 px² of area; the smallest baseline,
  `candidate-preview-mobile` at 390×924, has a 3,603.6 px ratio budget, still 18× above the cap.

**Divergence from the plan, written rather than restated.** Task 1's brief asked for
`candidate-preview-mobile`'s 3,603 px to be named as *"the case where the floor is the stricter knob."*
At `cap = 200` that is false — the cap is below every ratio budget in the suite, so the ratio binds on
nothing. The comment names the same baseline and the same number, but as the **smallest** ratio budget
and as the measure of how far the ratio is from binding. The ledger flagged this divergence in
§ *Which knob binds where, under `cap = 200`*; it is carried into the file rather than glossed.

### Task 2 — the catch half (`d788e4a43`)

One run, `tests/e2e-runs/146-negctl-c`, shipped config, no `--config`, no `--block-egress`, no update
flag. Exit **1**, `observed_expected=5`, `observed_unexpected=2`.

| Row | Baseline | Verdict | Count | vs. cap |
|---|---|---|---|---|
| `C1-NEW` | `voter-results-desktop` | **failed** | **4,783 px** | 23.9× |
| `C2-NEW` | `voter-results-mobile` | **failed** | **4,835 px** | 24.2× |
| — | `candidate-preview-desktop` | passed | — | cap above the noise floor |
| — | `candidate-preview-mobile` | passed | — | cap above the noise floor |

The instrument is **provably** the one `146-03` used: the injected `MatchScore.svelte` hashes to
`65a16a56667be18e653a231c994af15f110d4f10`, byte-identical to the blob `B1-OLD` records.

### Task 3 — the D-06 height control (`7be721491`)

Five in-container passes through a throwaway overlay whose references never touched `__screenshots__/`.
`--list` enumerated 5 tests in 4 files before any capture; every pass carries `E2E PREFLIGHT OK`.

| | short (1280×3684) | long (1280×5684) |
|---|---|---|
| ratio budget (`0.01 × area`) | 47,155.2 px | **72,755.2 px** (+54.2 % for zero content) |
| cap | 200 px | **200 px** |
| `matchscore` damage | 4,783 px | **4,783 px** — identical |
| … under the cap / under ratio-only | FAIL / pass | FAIL / pass |
| `patch` damage (calibrated) | 59,507 px | **59,507 px** — identical |
| … under the cap / under ratio-only | FAIL / **FAIL** | FAIL / **pass** ← the flip |

`scrollHeight` 3,684 → 5,684, asserted `after > before` in-band, and the long PNG's own header agrees
(5,684 = 3,684 + 2,000), so the *capture* grew and not merely the DOM.

## Deviations from Plan

### 1. [Operator-approved] The pre-catch baseline refresh — Task 2

**Why.** `dbb704bd4` changed the voter-results render order, so the committed voter baselines encode the
pre-fix ordering and differ from a current capture by a fixed ~16,883 px. Under `cap = 200` the voter
pair fails **with no injection at all**, so Task 2's "both fail" would have been trivially true and
would have proven nothing about the cap catching the injection.

**What was done.** One in-container snapshot-update run on a **clean** tree
(`tests/e2e-runs/146-negctl-c-rebase`, exit 0, 7/7 passed) refreshing the four expected PNGs **in the
working tree only**. It rewrote exactly two files — the voter pair; both `candidate-preview` PNGs came
back byte-identical to their committed blobs.

**Reverted, proven.** `git checkout --` over the injection path and `__screenshots__/`;
`git diff --exit-code` exit 0; 4/4 PNG blobs back to their § *Restoration blob hashes* values;
`git status --short tests/tests/specs/visual/` empty. `146-07` still owns the real re-baseline.

**The caveat, recorded not papered over.** `B1-OLD`'s 16,650 px and `C1-NEW`'s 4,783 px are **11,867 px
apart** — the plan's expectation that they would be near-identical does not hold, because `B1-OLD` was
measured against churned baselines and carries the tie-permutation offset on top of the injection, while
`C1-NEW` is the injection alone. The catch proof does not rest on that comparison: it rests on the
**verdict flip** and the **blob-hash instrument identity**, both intact. One arithmetic consequence,
stated as arithmetic: 4,783 px is 10.1 % of the old 47,155.2 px budget, so the old configuration would
have passed this regression against the refreshed baselines too — and 4,835 px is 29.9 % of mobile's
old budget, so **with current baselines the old configuration is blind on both voter baselines**, not
just desktop. Mobile's historic red was carried by the churn.

### 2. [Rule 2 — missing record] The dev server's PID change was undisclosed in the register

The register header records PID `41925` and states that any restart is recorded there. The server has
been `82314` since `146-03`, disclosed only in that plan's summary. A § disclosure was added rather
than back-editing the header: PID `82314`, started 2026-08-26 10:42:42, wildcard bind `*:5173`,
**not restarted by this plan** (4 h 46 m unbroken at close, `/` → 200, the `/@fs/…/+layout.svelte`
clause the preflight tests → 200, Supabase REST → 200). D-16's continuous-uptime window is intact from
`82314` forward. The served application was verified current before any run:
`git diff --stat dbb704bd4..HEAD -- apps packages` is empty.

### 3. [Plan expectation not met, recorded as a finding] Criterion 3 does not flip at the injection-sized damage

The plan's three passes produced 4 of 8 verdicts and **no flip**: at 4,783 px the damage is two orders
below both ratio budgets and passes at both heights. A flip requires a defect inside
`(0.01 × A_short, 0.01 × A_long)` = (47,155.2, 72,755.2) px — a window the page's own growth opens. Two
further passes (`146-height-p4`, `-p5`) placed a **calibrated, disclosed** defect there: a solid
1280×47 px opaque patch, measuring 59,507 px against a geometric 60,160 px (98.9 %, which doubles as a
comparator calibration check). The flip was then observed. **Both results are recorded** — reporting
only the second would misrepresent what the injection-sized defect does.

### 4. [Mechanical] Pass mode carried in `mode.json`, not the environment

`visual-container.sh` forwards only `FRONTEND_PORT` / `PLAYWRIGHT_VISUAL` / `VC_*` into the container,
by design. Editing that committed script to smuggle a control's knob through would have been a product
byte the control does not need, so the throwaway overlay reads its mode from a throwaway JSON file
beside it. No committed script changed.

## Findings worth carrying forward

1. **The CSS reproduction of the injection is exact.** `H1-SHORT`'s `matchscore` count is **4,783 px** —
   the same integer `C1-NEW` measured for the git-level edit against the real baseline. Different
   mechanism, different reference image, same number.
2. **A3 is falsified in the safe direction.** `D_short` and `D_long` are not "within a few pixels";
   they are **identical integers** at both damage levels. The filler perturbed nothing above the fold.
3. **The injection is smaller than the record suggests.** Against current baselines it is ~4,800 px,
   not ~19,500. Every future statement of the form "the gate must catch ~19,500 px" should be read as
   "~4,800 px against current baselines"; the cap clears both by 24× and 97× respectively.
4. **The `candidate-preview` pair passed at the 200 px cap against its committed, unrefreshed images** —
   a fourth independent confirmation of its zero drift, and `T-146-14` discharged by observation.

## Verification

| Gate | Result |
|---|---|
| cap in config equals the ledger's derivation | **200 = 200** (Task 1's automated check) |
| `threshold: 0.2` / `maxDiffPixelRatio: 0.01` intact | both present, unchanged |
| `grep -rn maxDiffPixels tests/tests/` | no matches — no per-assertion override |
| Task 2 automated verify | `diff failures: ["4783","4835"]` |
| Task 3 automated verify | `OK H0/H1/H2 filled`; control dir absent; `__screenshots__` status empty |
| `git diff --exit-code` MatchScore / preflight / global-setup | exit **0**; preflight `389197f03…`, global-setup `1c4a29d33…` |
| register placeholder count | **95** — down exactly 25 from `146-03`'s 120 |
| `yarn lint:check` / `yarn format:check` | exit **0** / exit **0** |
| `npx playwright test -c tests/playwright.config.ts --list` | **142 tests in 92 files** |
| `git status --porcelain -- apps packages tests .github package.json yarn.lock` | prints nothing |
| dev server | PID **82314**, 4 h 46 m, never restarted |

Every container run this plan took reached Playwright and completed; the three non-zero exits
(`146-negctl-c`, `146-height-p2`, `-p4`, `-p5`) are the designed failures of injected captures. No run
failed for an unexplained reason, so nothing here falls under the E2E Hard Rule's cardinal class.

## Known Stubs

None introduced. The register's remaining `pending` cells (95) belong to `146-06` … `146-09`; the
ledger's 4 belong to `146-06`. All deliberate.

## Threat Flags

None. `T-146-12` (a convenience-chosen cap) is mitigated by the mechanical ledger-equality check;
`T-146-13` (a fifth committed baseline) by the redirected `snapshotPathTemplate` plus the empty
`git status --short tests/tests/specs/visual/`; `T-146-09` (a botched revert) by the three-way proof;
`T-146-14` (a cap under the noise floor) by the two `candidate-preview` passes; `T-146-05` by the two
untouched blobs.

## Self-Check: PASSED

- `tests/playwright.config.ts` — FOUND, carries `maxDiffPixels: 200`
- `.planning/phases/146-…/146-NEGATIVE-CONTROL.md` — FOUND, `C1-NEW`/`C2-NEW`/`H0-GROWTH`/`H1-SHORT`/`H2-LONG` filled
- `tests/e2e-runs/146-height-control/` — correctly **ABSENT**
- commits `badae5c04`, `d788e4a43`, `7be721491` — all FOUND in `git log`
- product-path `git status --porcelain` — empty
- committed baseline blobs — 4/4 at their § Restoration values
