# Phase 146 — Visual Noise Ledger: the per-baseline run-to-run noise the threshold is derived from

**Forty cells, enumerated before a single run happens.** At zero tolerance a genuinely-noiseless
baseline **passes and emits no message**, so a ledger built by harvesting failure text records ten
rows for the noisy baselines and *nothing at all* for the quiet ones — and then derives its maximum
from however many happened to fail. Enumerating `{baseline} × {run}` up front is what makes a passing
cell a recorded **`0`** instead of a silent absence. That is research Pitfall 1, and it is the single
most likely way for this measurement to come out wrong.

**The placeholder word in this ledger is the single lower-case word `pending`.** It is the only legal
value for a measurement cell whose run has not happened yet. Filling a cell means replacing that word
with a count **this phase** observed, read out of that run's own `results.json`.

- **Phase:** 146 (visual-gate-self-hosted-inter-height-independent-sensitivity)
- **Requirements:** **VGATE-03** primarily; **VGATE-01 / VGATE-02** consume the number it derives.
- **Opened by:** `146-01-PLAN.md` (wave 1, Task 3). **Every cell is enumerated here, before the
  phase's first measurement, and before the phase's first product byte** (which lands in `146-04`).
  `146-01` runs no container and takes no measurement.
- **Corpus:** exactly **40 measurement cells** (4 baselines × 10 runs) **+ 1 `max` row + 1 § Font
  delta section**, asserted in this file's own § Completeness table. The sibling register
  `146-NEGATIVE-CONTROL.md` asserts its **own** corpus (29 rows) about itself; **neither file's corpus
  assertion covers the other's.**
- **Protocol source:** `.planning/REQUIREMENTS.md:7-13` and D-04 — *n* = 10 consecutive captures per
  baseline, in-container, at zero tolerance, recording **every** run's per-baseline count rather than
  only the maximum, so the threshold is **re-derivable rather than re-guessed**. *n* = 3 gives a number
  with no shape, which is exactly what VGATE-03 exists to stop.
- **Baseline for prior data:**
  `.planning/milestones/v2.14-phases/136-*/136-VISUAL-DISCRIMINATION-EVIDENCE.md` records the
  `candidate-preview` pair at exactly **0 px** across both v2.14 runs. That is cited as **context for
  what to expect**, never as a cell value. **No cell in this matrix may be filled from a document,
  from a prior session, or from `146-RESEARCH.md`'s measurement tables.**
- **Run date:** 2026-08-25 (ledger opened). **Matrix measured 2026-08-26** — see § *The first matrix
  is VOID* below; the 2026-08-25 matrix measured a product defect and has been replaced, not appended to.
- **HEAD at ledger creation:** `0c3a26ab6` — branch `feat-gsd-roadmap`.
- **HEAD the matrix below was measured at:** `e5ff31740` — branch `feat-gsd-roadmap`, which contains
  the two tie-break fixes `53002b6a9` (dev-seed persists nomination emission order as `sort_order`) and
  `dbb704bd4` (`/results` tie-breaks with `compareMaybeWrappedEntities`). All ten completed runs are
  taken at **one HEAD**, on the untouched product tree, before the cap exists.
- **Machine — container provenance, not host provenance.** The measurement is a pixel count, so the
  rasterisation environment is the instrument:
  - Image **RepoDigest**, read on this machine with
    `docker image inspect mcr.microsoft.com/playwright:v1.58.2-noble --format '{{.RepoDigests}}'` →
    `mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d`
    (image `Architecture` `amd64`, `Os` `linux`, size 2,390,436,754 B). Every run is invoked against
    that **digest**, never against the tag.
  - `--platform`: `linux/amd64`. `--workers=1 --retries=0`, read back out of each run's own
    `results.json` (`observed.txt`) rather than restated from the invocation.
  - In-container `uname -m` / `/etc/os-release` / `node -v`: **`x86_64`** /
    **`PRETTY_NAME="Ubuntu 24.04.3 LTS"`** + **`NAME="Ubuntu"`** / **`v24.13.0`**. Carried here so the
    numbers below stay comparable to `136-VISUAL-DISCRIMINATION-EVIDENCE.md`'s, which record the same
    three values. **Filled by `146-03`, not by `146-02`** — see the note below — and read off
    **each of this ledger's own ten completed runs'** `provenance.txt`, written by the entrypoint
    inside the container that took the measurement; all ten are byte-identical on these four lines
    (`md5` of the four-line extract, taken across `run01`…`run06` and `run08`…`run11`, is a single
    value: `e0d2e2a1345e22f8ecbc5b5ff9820dfe`). `x86_64`
    under `--platform linux/amd64` on an arm64 host is Rosetta/QEMU emulation, and it is exactly the
    rasterisation environment every pixel count below was measured in. (The **host** runs Node
    `v24.14.1`; the two differ, which is why the container's is the one recorded.)
  - *Defect carried over from `146-02`, disclosed rather than back-dated:* this bullet was assigned to
    `146-02`, which filled the identical `Machine` fields in the sibling `146-NEGATIVE-CONTROL.md` and
    left **this** ledger's copy at `pending` — a straightforward miss, and a reminder that a corpus
    assertion covers only its own file (each ledger states as much in its own header). It is filled
    here from this plan's own runs rather than copied across from the register, so the value still
    rests on a run that produced the numbers it annotates.
  - Host, for the record only (**no baseline is ever captured here**): macOS 26.5.1 (build 25F80),
    Darwin 25.5.0, arm64, Node v24.14.1, Docker 29.7.2.
- Resolved `$TMPDIR`: `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T`.
- **Raw output is not committed.** Per root `.gitignore`'s `tests/e2e-runs/` stanza, each run's
  stdout, HTML report, traces and `results.json` live under `tests/e2e-runs/146-noise-run01` …
  `146-noise-run11` (plus the void first matrix's `146-noise-VOID-run01` … `-VOID-run10`) and are
  **never** committed; only the derived table below is. The throwaway measurement overlay lives there
  too and is deleted after use.

---

## Why this ledger exists

VGATE-03 does not ask for a threshold. It asks for a threshold that is **re-derivable**: *"the chosen
sensitivity mechanism is selected from **measured** per-baseline run-to-run noise, and those
measurements are recorded so the threshold can be re-derived rather than re-guessed."* A single
reported maximum satisfies neither half — it cannot be re-derived, and it hides whether the maximum is
a stable ceiling or one outlier in ten. So every run's per-baseline count is recorded, including the
zeros.

**Only one of the four baselines has any prior data at all.** The `candidate-preview` pair was
measured at exactly **0 px** across both v2.14 runs. **The voter pair's noise has never been
measured** — not once, at any tolerance, in any phase. That gap is this phase's reason for existing:
the budget currently in force on `voter-results-desktop` is 47,155.2 px, a 19,484 px regression passed
under it, and nobody has ever established what that baseline's *floor* is. A cap cannot be chosen
against an unmeasured floor without guessing, and guessing is the thing VGATE-03 forbids.

**What this ledger does NOT claim.** It does not claim a cap value. The cap does not exist while this
file is being written; it is derived in `146-03` from the forty cells below, by the arithmetic written
out in § Derivation (D-05) **before** any of those cells has a number in it. It also does not claim
anything about the *font*: the variable→static delivery delta is a **separate** measurement, taken
later and against the cap already in force, and it lives in § Font delta (N-1) below — because "did
the pixels move?" and "did the verdict move?" are confounded if they are measured together.

---

## Precedent chain and planner findings

**`146-VISUAL-NOISE-LEDGER.md` → `145-NEGATIVE-CONTROL-LEDGER.md` → `144-NEGATIVE-CONTROL-LEDGER.md` →
`143-NEGATIVE-CONTROL-LEDGER.md` → … → `136-VISUAL-DISCRIMINATION-EVIDENCE.md`** for the header field
set, the `pending` discipline, the arithmetic self-assertion and the `## Completeness` section. The
**matrix** itself has no analog in that chain — 143/144/145 are all nine-column registers — so it is a
second, differently-shaped table, and it is asserted about itself separately.

### F-146-P1 — `globalSetup` is a **relative** path, resolved against the config file's directory

`tests/playwright.config.ts:291` is `globalSetup: './global-setup.ts'`, and the comment at `:285-287`
says so in as many words: *"The path resolves relative to THIS config file's directory."* An overlay
config placed under `tests/e2e-runs/146-noise/` that merely spreads the base config therefore points
`globalSetup` at a file that does not exist. **The failure mode is the dangerous kind**: the served-app
preflight would not run, and a noise measurement taken against an unverified server is not evidence.

**Every overlay in this phase MUST override `globalSetup` to an absolute path** resolved from the
overlay's own `import.meta.url`, and prove it ran by the preflight's own stdout line.

### F-146-P2 — every project's `testDir` is **relative** too

`tests/playwright.config.ts:388` gives the `visual-regression` project `testDir: './tests/specs/visual'`,
and every other project the same shape. Relative project `testDir`s resolve against the config file's
directory, so the same overlay would enumerate **zero** tests and exit 0 — a green run that measured
nothing.

**Every overlay MUST rewrite each project's relative `testDir` to an absolute path** (resolve against
the real `tests/` directory), and prove the rewrite worked with `npx playwright test -c <overlay> --list`
before taking a single measurement.

*Why the overlay is not simply placed at `tests/` root, where both would resolve for free:*
`tests/.gitignore`'s `playwright*/` has a **trailing slash** and matches directories only, so
`tests/playwright.noise.config.ts` would be untracked-but-not-ignored (one `git add -A` from being
committed), **and** typechecked (`tests/tsconfig.json:15` includes `*.ts` at the `tests/` root) **and**
linted with the full Playwright rule set. `tests/e2e-runs/` is ignored wholesale by `.gitignore:44` and
by `tests/eslint.config.mjs:7-11`, and is outside `tests/tsconfig.json`'s include. The gitignore
property wins; F-146-P1/P2 are the price, and they are cheap once named.

**Both findings are properties of the measurement instrument, not of the plan that used it.** They are
carried here verbatim because a reader re-deriving the threshold from these forty cells needs them to
reproduce the run.

---

## The measurement configuration

Reproduced **verbatim** below, exactly as it was written to
`tests/e2e-runs/146-noise/playwright.noise.config.ts` and then deleted at the end of `146-03` Task 2.
The file is gone; this copy is what makes the run reproducible.

**The literal invocation**, once per run for `NN` = `01` … `11` (`run11` is the replacement for the
void `run07`; see § *The `run07` anomaly*):

```
tests/scripts/visual-container.sh \
  --run-dir tests/e2e-runs/146-noise-runNN \
  --project visual-regression \
  --config tests/e2e-runs/146-noise/playwright.noise.config.ts
```

**No `--update-snapshots-all`, and no snapshot-update flag of any kind, appears on any of those eleven
invocations.** Exactly one snapshot-update run exists in this session and it is strictly *before* the
loop — see § *The pre-matrix baseline refresh* immediately below.

which the wrapper turned into (read back from each run's own `pw-args.txt`, not restated):

```
npx playwright test -c tests/e2e-runs/146-noise/playwright.noise.config.ts \
  --project=visual-regression --workers=1 --retries=0 --reporter=html,json
```

`--config` did not exist on `visual-container.sh` when `146-03` began — the config was hardcoded. It
was added in this plan and is disclosed in `146-NEGATIVE-CONTROL.md` § *`--config` was added to
`visual-container.sh` during `146-03`* rather than back-dated into `146-01`.

### ⚠ DEVIATION, operator-approved — the pre-matrix baseline refresh

**This is a deviation from `146-03-PLAN.md` Task 2 as written, and it is disclosed here rather than
absorbed silently.** It changes nothing about what the forty cells below mean, but a reader who does not
know it happened would mis-read them, so it is stated in full.

**Why it was needed.** The two tie-break fixes (`53002b6a9`, `dbb704bd4`) made the results list's
ordering deterministic, but the **committed** voter baselines under
`tests/tests/specs/visual/__screenshots__/` were captured with the OLD arbitrary permutation. Measured
against them, every run now reports a **fixed 16,883 px stale-baseline delta** — a constant, not noise.
Run exactly as written, Task 2 would have produced `max(noise) = 16,883` and halted D-05 a second time
for a reason that has nothing to do with run-to-run variance. The real committed re-baseline belongs to
`146-07`, which must run *after* `146-05`/`146-06` self-host Inter and move the pixels again; it cannot
be pulled forward.

**What was done, exactly.** One snapshot-update run, in-container, through the same harness and the
same zero-tolerance overlay, refreshing the four expected PNGs **in the working tree only**:

```
tests/scripts/visual-container.sh \
  --run-dir tests/e2e-runs/146-noise-rebase \
  --project visual-regression \
  --config tests/e2e-runs/146-noise/playwright.noise.config.ts \
  --update-snapshots-all
```

| Field | Value |
|---|---|
| run dir | `tests/e2e-runs/146-noise-rebase` |
| exit code | **0** (`7 passed`, 2.6m; `observed_workers=1`, `observed_retries=0`, `observed_expected=7`) |
| preflight | `grep -c 'E2E PREFLIGHT OK'` → **1** |

**Why this preserves the measurement's meaning exactly.** The plan's prohibition on snapshot-update
flags exists so that no run *inside* the matrix compares against its own previous output — which would
make each run's expected image a function of the run before it, and would drive every count to 0 by
construction. A single refresh taken **strictly before** the loop preserves that invariant completely:
there is **one fixed expected PNG** and **ten independent actuals**. That is precisely the shape a
run-to-run noise measurement requires. Proof the expected really was fixed for the whole matrix — the
four blobs, hashed after the refresh and again after run11, are identical:

| Baseline | expected blob, for all eleven runs |
|---|---|
| `voter-results-desktop` | `3bc624618faa9c18d18ebda0844c32444338b931` |
| `voter-results-mobile` | `38ddaf0b9a0f993bd5fcfcdf493767c193ae4450` |
| `candidate-preview-desktop` | `3d245ee6f141e7663a357bab6ba9deec91ad3463` |
| `candidate-preview-mobile` | `cb0fcd03a6d51b7bbd6c50e4a1f90f1dce02afc8` |

**What the refresh did to each baseline, measured rather than assumed.** Decoding the refreshed and the
committed PNGs and comparing raw RGBA:

| Baseline | raw-differing px, refreshed vs committed | effect on this measurement |
|---|---|---|
| `voter-results-desktop` | 37,544 | removed the fixed stale-baseline offset (the old tie permutation) |
| `voter-results-mobile` | 37,530 | removed the same offset — this is the 16,883 px the shipped comparator scored |
| `candidate-preview-desktop` | 2,304 | **none** — see below |
| `candidate-preview-mobile` | 2,304 | **none** — see below |

The `candidate-preview` pair's 2,304 raw-differing pixels are **sub-`threshold`**: `threshold` is
pixelmatch's per-pixel colour tolerance and stays at its shipped `0.2`, and that pair scored exactly
**0 px in all 20 of its cells in the *previous*, un-refreshed matrix**. So for those twenty cells the
refresh is provably a **no-op under the comparator that actually runs** — the same 0 either way. Raw
byte equality is not the comparator's question, and the two must not be conflated.

**It was reverted, and the revert is proven.** Immediately after run11:

```
git checkout -- tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/
```

| Baseline | blob after revert | committed blob at `e5ff31740` | |
|---|---|---|---|
| `voter-results-desktop` | `ea8316c5038d1ef9367fd20e9a910a7adec75959` | `ea8316c5038d1ef9367fd20e9a910a7adec75959` | **RESTORED** |
| `voter-results-mobile` | `e42d1d753b1cdc8681a612e254fbbef316b36cec` | `e42d1d753b1cdc8681a612e254fbbef316b36cec` | **RESTORED** |
| `candidate-preview-desktop` | `5b847d227fd0d881a00f2a67ead1e44d443a9496` | `5b847d227fd0d881a00f2a67ead1e44d443a9496` | **RESTORED** |
| `candidate-preview-mobile` | `fc19205d9a7d7eaf35027cfd335100394bd5c1aa` | `fc19205d9a7d7eaf35027cfd335100394bd5c1aa` | **RESTORED** |

`git diff --exit-code -- tests/tests/specs/visual/__screenshots__/` exits **0** and
`git status --porcelain` prints **nothing at all**. **`146-03` keeps its zero-product-bytes posture and
`146-07` keeps its job:** the committed baselines still encode the old permutation, so `146-07`'s
re-baseline is still owed, still one-time, and still has to happen after the font lands.

**F-146-P2 proof, taken BEFORE any measurement.** The overlay's enumeration is byte-identical to the
base config's:

```
$ PLAYWRIGHT_VISUAL=1 npx playwright test \
    -c tests/e2e-runs/146-noise/playwright.noise.config.ts --project=visual-regression --list
Listing tests:
  [auth-setup] > setup/shared/auth.setup.ts:68:1 > register + authenticate as base candidate
  [data-teardown-base] > setup/shared/base.teardown.ts:38:1 > delete base dataset
  [data-setup-base] > setup/shared/base.setup.ts:18:1 > import base dataset
  [visual-regression] > specs/visual/visual-regression.spec.ts:83:3 > Voter Results - Desktop @visual > screenshot matches baseline
  [visual-regression] > specs/visual/visual-regression.spec.ts:104:3 > Voter Results - Mobile @visual > screenshot matches baseline
  [visual-regression] > specs/visual/visual-regression.spec.ts:123:3 > Candidate Preview - Desktop @visual > screenshot matches baseline
  [visual-regression] > specs/visual/visual-regression.spec.ts:149:3 > Candidate Preview - Mobile @visual > screenshot matches baseline
Total: 7 tests in 4 files
```

**7 tests, in 4 files** — and `diff` against the same `--list` taken through the base
`tests/playwright.config.ts` reports **no difference at all** (both captured to
`tests/e2e-runs/146-noise/list-overlay.txt` and `list-base.txt`; the only line excluded from the `diff`
is `dotenv`'s rotating tip banner, which differs run to run on the base config too). Taken **before the
refresh run and before any measurement**, as F-146-P2 requires.

**F-146-P1 proof.** Every one of the runs' `stdout.log` carries the served-application preflight's
own success line, so `globalSetup` was not silently lost and every measurement was taken against
**this** checkout:

```
E2E PREFLIGHT OK /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend (verified against /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd)
```

`grep -c 'E2E PREFLIGHT OK'` returns **1** for the refresh run `146-noise-rebase/stdout.log` and for
each of `146-noise-run01/stdout.log` … `146-noise-run11/stdout.log` — **12 of 12**, including the void
`run07`.

**The overlay, verbatim:**

```ts
/**
 * MEASUREMENT-ONLY overlay — phase 146, plan 146-03 Task 2 (D-04).
 *
 * Purpose: measure each visual baseline's run-to-run noise at ZERO pixel tolerance, so the
 * absolute `maxDiffPixels` cap D-05 derives is computed from measured noise rather than guessed.
 *
 * THIS FILE IS NEVER COMMITTED AND NEVER SHIPPED. It lives under `tests/e2e-runs/`, which the
 * root `.gitignore:44` covers wholesale and which is outside both `tests/tsconfig.json`'s include
 * and `tests/eslint.config.mjs`'s scope. A zero-tolerance budget in `tests/playwright.config.ts`
 * would redden the gate on its own noise; it exists here for the duration of the measurement and
 * is deleted immediately afterwards. Its verbatim text is preserved in
 * `146-VISUAL-NOISE-LEDGER.md` § The measurement configuration so the run stays re-derivable.
 */
import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import base from '../../playwright.config';

// The REAL `tests/` directory — i.e. the directory the base config file itself lives in, which is
// what both of the relative paths below were written against. Resolved from this overlay's own
// location so it is correct no matter where the overlay is invoked from.
const OVERLAY_DIR = path.dirname(fileURLToPath(import.meta.url)); // <repo>/tests/e2e-runs/146-noise
const REAL_TESTS_DIR = path.resolve(OVERLAY_DIR, '..', '..'); // <repo>/tests

export default defineConfig({
  ...base,

  /* (1) THE MEASUREMENT KNOB — and the only behavioural change in this file.
   *
   * `threshold` is spread through from the base config UNCHANGED at its shipped 0.2. It is
   * pixelmatch's PER-PIXEL COLOUR TOLERANCE (playwright-core
   * lib/server/utils/comparators.js:82-84), not part of the pixel budget: it decides which
   * pixels count as different, not how many are allowed. Zeroing it would measure a comparator
   * this repository does not run, and would yield a number about the wrong thing.
   *
   * `maxDiffPixels: 0` alone suffices. When both knobs are present the effective budget is
   * `Math.min(maxDiffPixels, width * height * maxDiffPixelRatio)` (comparators.js:88-97), and
   * `Math.min(0, 0.01 * area) === 0` for all four baselines, so `maxDiffPixelRatio` need not be
   * removed — and leaving it in place keeps this overlay a strict superset-of-strictness over the
   * shipped configuration rather than a differently-shaped one.
   *
   * NOTE (comparators.js:96 uses a strict `count > maxDiffPixels`): a genuinely noiseless
   * baseline PASSES at zero tolerance and emits NO message at all. Its measurement is `0`, and it
   * has to be recorded as `0` rather than harvested from a failure list that will not contain it.
   */
  expect: {
    ...base.expect,
    toHaveScreenshot: {
      ...base.expect?.toHaveScreenshot,
      maxDiffPixels: 0
    }
  },

  /* (2) F-146-P1 — `globalSetup` is RELATIVE in the base config (`'./global-setup.ts'`,
   * tests/playwright.config.ts:291) and Playwright resolves it against THE CONFIG FILE'S OWN
   * DIRECTORY, as the comment at :285-287 states outright. Spread unchanged into an overlay two
   * directories away it would point at `tests/e2e-runs/146-noise/global-setup.ts`, which does not
   * exist — and the served-application preflight would simply not run. That is the dangerous
   * failure mode: a noise measurement taken against an unverified server is not evidence, and the
   * run would still look clean. Absolutised here, and the override is PROVEN by the preflight's
   * own `E2E PREFLIGHT OK …` line in each run's stdout.log.
   */
  globalSetup: path.join(REAL_TESTS_DIR, 'global-setup.ts'),

  /* (3) F-146-P2 — every project's `testDir` is relative too (e.g. `'./tests/specs/visual'`,
   * tests/playwright.config.ts:388) and resolves against the config file's directory for exactly
   * the same reason. Left alone, this overlay would enumerate ZERO tests and exit 0 — a green run
   * that measured nothing, which reads identically to a clean run. Rewritten to absolute paths
   * against the real `tests/` directory, and PROVEN by `--list` enumerating the same 7 tests the
   * base config does before a single measurement is taken.
   *
   * `snapshotPathTemplate` ('{testDir}/__screenshots__/{testFileName}/{arg}{ext}') is deliberately
   * left alone: with absolute project testDirs it resolves to the real
   * tests/tests/specs/visual/__screenshots__/…, which is what this measurement wants — noise is
   * measured against the COMMITTED baselines.
   */
  projects: (base.projects ?? []).map((p) =>
    typeof p.testDir === 'string' && !path.isAbsolute(p.testDir)
      ? { ...p, testDir: path.resolve(REAL_TESTS_DIR, p.testDir) }
      : p
  )
});
```

Three things make this configuration correct, and all three are read from the installed
`playwright-core@1.58.2` rather than from documentation:

1. **`threshold` stays `0.2`.** It is pixelmatch's **per-pixel colour tolerance**
   (`lib/server/utils/comparators.js:82-84`), not part of the pixel budget. Changing it would change
   *which pixels count as different*, which is a different measurement from the one VGATE-03 asks for.
2. **`maxDiffPixels: 0` alone suffices.** When both knobs are set, the effective budget is
   `Math.min(maxDiffPixels, width × height × maxDiffPixelRatio)` (`comparators.js:88-97`), and
   `Math.min(0, 0.01 × area) = 0` for every one of the four baselines. The ratio need not be removed.
3. **The comparison is strict.** `comparators.js:96` uses `count > maxDiffPixels`, so a genuinely
   noiseless baseline **passes silently and emits no message**. Its cell is therefore `0`, **not
   blank** — which is the whole reason the matrix below is enumerated rather than harvested.

**This configuration is measurement-only and is never shipped.** A zero-tolerance knob in
`tests/playwright.config.ts` would redden the gate on its own noise.

---

## Noise matrix

Ten consecutive runs of the `visual-regression` project, one HEAD, one container, `--workers=1
--retries=0`, at zero tolerance. **Each run produces four counts, and every one of them is recorded —
including the zeros.** Counts are read out of that run's own `results.json`, never scraped from stdout:
the JSON already associates the matcher message with test title and project, which is exactly the
association a 240-measurement transcription would otherwise have to re-derive by proximity.

**A run that did not execute leaves its cells at `pending` and contributes nothing to `max`.** It is
never recorded as `0` — under `CLAUDE.md` § E2E Hard Rule a measurement that did not run counts as a
failure, not a pass, and a missing run silently read as a zero would bias the derived cap **downwards**,
which is the direction that reddens the gate on its own noise.

### ⚠ The first matrix is VOID — history preserved, not silently rewritten

A forty-cell matrix was measured on **2026-08-25** and recorded here. **It measured a product defect,
not noise, and it has been replaced.** The record of it is kept because a corpus that can be quietly
re-measured is not evidence:

- **What it measured.** Distance-tied candidates on `/results` permuted between page loads. The
  seeder never persisted the template's declaration order, so `get_nominations`'s
  `ORDER BY n.sort_order NULLS LAST, n.id` collapsed to a `gen_random_uuid()` primary key that was
  re-minted on every run's teardown-and-reseed; `matchingAlgorithm.match()`'s stable, tie-break-less
  sort then left those rows in their random arrival order. The forty cells recorded
  **11,748–15,928 px**, every run different, `candidate-preview` at 0.
- **What invalidated it.** `53002b6a9` — dev-seed persists each nomination's emission index as
  `sort_order`. `dbb704bd4` — `/results` sorts with `compareMaybeWrappedEntities` (`toSorted`, not
  `sort`). Full root-cause record: `.planning/debug/tied-match-order-churn.md`.
- **Its derivation** halted at `max(noise) = 15,928 ≥ 500`. That halt was **correct for the numbers it
  had** and is superseded only because the numbers were wrong.
- **Its evidence** is preserved at `tests/e2e-runs/146-noise-VOID-run01` … `-VOID-run10`
  (`results.json`, `stdout.log`, `observed.txt`, `exit`, `pw-args.txt`, `provenance.txt`; the HTML
  reports and traces were dropped for disk).

The matrix below **replaces** it in place. It is not appended beside it: two matrices in one ledger
would leave `max(noise)` ambiguous, which is the one thing this corpus must not be.

### The matrix

| Run | voter-results-desktop | voter-results-mobile | candidate-preview-desktop | candidate-preview-mobile | run dir | exit |
|---|---|---|---|---|---|---|
| run01 | 0 | 0 | 0 | 0 | `tests/e2e-runs/146-noise-run01` | 0 |
| run02 | 0 | 0 | 0 | 0 | `tests/e2e-runs/146-noise-run02` | 0 |
| run03 | 0 | 0 | 0 | 0 | `tests/e2e-runs/146-noise-run03` | 0 |
| run04 | 0 | 0 | 0 | 0 | `tests/e2e-runs/146-noise-run04` | 0 |
| run05 | 0 | 0 | 0 | 0 | `tests/e2e-runs/146-noise-run05` | 0 |
| run06 | 0 | 0 | 0 | 0 | `tests/e2e-runs/146-noise-run06` | 0 |
| run08 | 0 | 0 | 0 | 0 | `tests/e2e-runs/146-noise-run08` | 0 |
| run09 | 0 | 0 | 0 | 0 | `tests/e2e-runs/146-noise-run09` | 0 |
| run10 | 0 | 0 | 0 | 0 | `tests/e2e-runs/146-noise-run10` | 0 |
| run11 | 0 | 0 | 0 | 0 | `tests/e2e-runs/146-noise-run11` | 0 |
| **max** | 0 | 0 | 0 | 0 | — | — |

**Ten completed observations. `run07` is absent by design** — it is the void row, and `run11` is its
replacement, exactly as this plan's Task 2 instructs (*"take a replacement run so the matrix still
rests on ten completed observations"*). **Row labels match their run directories one-for-one**, because
label↔directory correspondence is what makes a cell auditable back to the JSON it came from.

**`max(noise)` is the largest of the four `max`-row values**, and it is derived from **40 observations**
rather than from however many happened to fail. Here it is **0 px** — every one of the forty cells is
`0`, on all four baselines, in all ten completed runs. There is no single "worst" baseline or run to
name because no cell exceeded any other.

**Every one of those forty zeros is a recorded measurement, not an absence.** All forty captures
**passed** at `maxDiffPixels: 0` and therefore emitted no message at all (`comparators.js:96`, strict
`count > maxDiffPixels`). This is the exact situation research Pitfall 1 predicted, at full strength: a
failure-harvesting ledger would have recorded **nothing whatsoever** here and would have had no corpus
to derive from. The cells are `0` because the matrix was enumerated in `146-01` before any run existed,
and because each cell was read from its run's own `results.json` with an extractor that maps
`status: "passed"` + no message → `0`.

### The `run07` anomaly — the run-4-shaped failure, and it RECURRED

**`tests/e2e-runs/146-noise-run07`, exit 1, `observed_expected=6` / `observed_unexpected=1`.**
`Voter Results - Desktop @visual` ended `status: "timedOut"`:

```
Test timeout of 90000ms exceeded while setting up "answeredVoterPage".
Error: locator.waitFor: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByTestId('voter-questions-category-start')
      .or(getByTestId('question-choice').first())
      .or(getByTestId('question-number-slider').first())
      .first() to be visible
  at fixtures/voter/voter-journey.fixture.ts:336
  at answerAndAdvanceToResults (tests/tests/fixtures/voter/voter-journey.fixture.ts:336:8)
  at Object.answeredVoterPage (tests/tests/fixtures/voter/voter-journey.fixture.ts:572:5)
```

**This is not merely "the same shape" as the intermittent carried out of the tie-break session — it is
the same defect at the same source line.** That earlier sighting
(`tests/e2e-runs/146-verify-tiebreak-3`, one failure in five otherwise-clean runs) reads
`TimeoutError: locator.waitFor: Timeout 10000ms exceeded` at **`voter-journey.fixture.ts:336`**, on the
**same three-way `.or()` locator**, in the **same `answerAndAdvanceToResults` → `answeredVoterPage`
call path**. Only the budget that expired differs: there the locator's own `TIMEOUTS.slowPage` went
first, here the whole 90 s test budget did. The failing wait is the question-flow page never rendering
a category-start button, a choice question or a number slider.

**Two sightings now, both in this session, both in-phase.** `146-07`'s **D-16** is chartered to
reproduce the v2.14 "run-4 anomaly" (*1 unexplained failure in 5 clean runs*); this is a second
independent reproduction with a **named source line**, which is materially more than D-16 had to work
with. Recorded **UNCONFIRMED and OPEN** — it is not diagnosed here, and it is explicitly **not**
written off. Artifacts: `tests/e2e-runs/146-noise-run07/` (`results.json`, `stdout.log`, `observed.txt`,
`exit`, trace).

**Why `run07` contributes nothing to `max` rather than four zeros.** Its other three captures passed at
0, but `voter-results-desktop` **never took a screenshot** — the fixture hung before the page was ever
reached. There is no measurement there. Recording it as `0` would read a did-not-run as a clean pass,
which is the E2E Hard Rule's cardinal error and the exact **inversion** of Pitfall 1; it would also bias
`max(noise)` **downwards**, the direction that reddens the gate on its own noise.

**This trap was live in the instrument and was caught.** The extractor's original fallback was
`m ? {count: N} : {count: 0, note: 'passed silently -> 0'}` — it keyed on *the absence of a diff
message*, not on the status, and so it reported `run07`'s timed-out capture as a clean **`0`**. It was
corrected to branch on `status === 'passed'` and to emit `count: null, 'NO MEASUREMENT — capture did
not complete'` for every other status, which is what `run07` now reads. Had the anomaly landed in a run
where the other three baselines also happened to be quiet, the uncorrected extractor would have
contributed a full row of fabricated zeros to a derivation whose whole output is a maximum.

### What the forty cells say

| | `voter-results-desktop` | `voter-results-mobile` | `candidate-preview-desktop` | `candidate-preview-mobile` |
|---|---|---|---|---|
| min | 0 | 0 | 0 | 0 |
| **max** | **0** | **0** | **0** | **0** |
| spread (max − min) | 0 | 0 | 0 | 0 |
| mean | 0 | 0 | 0 | 0 |
| median | 0 | 0 | 0 | 0 |
| sd | 0 | 0 | 0 | 0 |
| max as % of that baseline's `0.01 × area` budget | 0 % | 0 % | 0 % | 0 % |

**All four baselines held at exactly 0, in all ten completed runs — forty cells of zero.** Against a
fixed expected image, ten independent in-container captures of the same four pages produced not one
differing pixel that pixelmatch scored at the shipped `threshold: 0.2`. Stated as the thing D-05 needs:
**the measured run-to-run noise floor of every baseline in this suite is zero.**

**The `candidate-preview` pair is still the load-bearing control, and it still holds.** Twenty of the
forty zeros are its, matching both the v2.14 record (0 px across both of its runs) and the void first
matrix (0 px across all 20 of its cells there too). Three separate measurement campaigns, three
different HEADs, two different tie-order regimes, and that pair has never moved. It proves the
instrument is sound: zero tolerance really was in force, and the pinned container's rasterisation and
`settleFonts` are deterministic. A matrix of forty zeros is the one result most vulnerable to the
objection *"you measured nothing at all"*, and this pair — together with the `--list` proof of 7 tests
and the preflight line in 12 of 12 stdout logs - is what answers it.

**The voter pair now holds too, and that is the change.** In the void first matrix it swung across
11,748–15,928 px, every run different, desktop and mobile in lockstep to within 28 px. That was the
tie-order churn, and it is gone: `53002b6a9` persists the seed template's declaration order as
`sort_order`, and `dbb704bd4` gives `/results` an explicit tie-break. The independent 5-run
verification recorded in `.planning/debug/tied-match-order-churn.md` saw the same collapse — four
byte-identical **16,883 px** counts where previously every run differed - and that residual 16,883 was
the fixed stale-baseline offset, which the pre-matrix refresh (disclosed above) removes. What remains
after both is **0**.

**The distinction the void matrix turned on is worth keeping.** A count that *varies* run to run against
a fixed expected proves the **actual** differs each run - non-determinism no re-baseline can fix. A
*constant* count against a fixed expected is a stale baseline, which a re-baseline fixes exactly once.
The first matrix was the former; the 16,883 px that replaced it was the latter; and forty zeros are
neither. All three readings come from the same instrument, and telling them apart is the whole reason
every run's count is recorded rather than just the maximum.

**A caveat stated rather than buried.** The expected image these forty cells were measured against is a
capture taken in this same session and container, minutes before the loop — not an independently
committed image. That is the correct instrument for *this* question ("how far do independent captures
drift from a fixed reference capture?") and it is what makes the answer meaningful, but it is not a
measurement of drift against the committed baselines, which still encode the old permutation. Those two
questions are different, and `146-07` owns the second one.

---

## Derivation (D-05)

The rule is locked; the number is not. Written out here **before any cell above has a value**, so that
the arithmetic cannot be reverse-engineered from a number someone liked:

```
cap = max(observed per-baseline noise across all 40 cells) × 10
      floored at 200
      rounded up to a round number
      and strictly < 5,000
```

- **× 10** is headroom over observed noise, not over the regression it must catch.
- **Floored at 200** so that an all-zero matrix does not produce a cap of `0`, which would redden the
  gate on the first sub-pixel of legitimate variance.
- **Strictly < 5,000** because the regression this gate exists to catch measured **19,484 px** on
  `voter-results-desktop` at v2.14 close; a cap of 5,000 is already only ~3.9× below it, and anything
  larger stops being a guard.

**The incompatibility threshold is explicit: `max(noise) ≥ 500`.** At that point `max(noise) × 10`
reaches 5,000 and the two constraints cannot both hold. **If it is reached, stop and record a finding.
Never widen.** A cap chosen by relaxing its own ceiling is a cap chosen to pass.

**D-01's rationale is unaffected either way.** Because the effective budget is
`Math.min(absolute, ratio × area)`, an absolute cap is **monotonically strictness-increasing on every
baseline** — it can never loosen one, whatever value it takes, and it is bounded by the absolute
regardless of page height. That is the mechanism VGATE-02 needs. Only the chosen *number* would be in
question if the incompatibility were reached, never the choice of mechanism.

### The derivation was RUN, and it TERMINATES IN A NUMBER — `146-03`, against the forty cells above

The rule above was applied verbatim to the forty measurements. Every step, with its intermediate value:

| Step | Rule | Value | Verdict |
|---|---|---|---|
| 1 | `max(observed per-baseline noise across all 40 cells)` | **0 px** | measured, from 40 observations |
| 2 | step 1 `× 10` | `0 × 10` = **0 px** | — |
| 3 | floored at 200 | `0 < 200` → **200** | **FLOOR BRANCH: TAKEN** |
| 4 | rounded **up** to a round number | 200 is already round → **200** (no rounding was applied, and none downward) | — |
| 5 | strictly `< 5,000` | `200 < 5,000` ✓ — **25× below the ceiling** | **CEILING: SATISFIED** |

**`cap = 200`.**

**Which baseline and which run produced `max(noise)`.** None in particular, and that is the honest
answer: **all forty cells read `0`**, so the maximum is attained by every cell simultaneously. There is
no worst baseline and no worst run to name. For auditability the maximum can be traced to any of them —
e.g. `voter-results-desktop` in `tests/e2e-runs/146-noise-run11/results.json`, `status: "passed"`, no
diff message, at `maxDiffPixels: 0`.

**`max(noise) = 0 < 500`, so the incompatibility threshold is NOT reached** and the stop-and-record
branch does **not** apply. The void first matrix reached it by a factor of 31.9; this one clears it by
the whole distance. Both outcomes came out of the same unmodified rule, which is the point of having
written the rule down before the numbers existed.

### ⚠ Read step 3 honestly: the floor set this number, not the noise

**The cap is 200 because the floor is 200.** `max(noise) × 10` is `0`, and zero is not a threshold. The
operative rule at step 3 is the **floor**, and the floor is a **design constant chosen in advance**, not
a quantity derived from these measurements. Saying "200 was derived from forty observations" without
that qualification would overstate what the corpus did.

What the forty observations actually contribute is different, and still decisive:

1. **They establish that the noise floor is 0**, so *any* positive cap has complete headroom over
   measured noise. That is the fact VGATE-03 asks for — the threshold rests on measured per-baseline
   noise rather than on a guess — and it is why the floor is safe to take here. Had the matrix come back
   at, say, 40 px, step 2 would have produced 400 and the floor would have been inert.
2. **They are what makes the floor's own rationale check out.** The floor exists, in the ledger's words,
   *"so that an all-zero matrix does not produce a cap of `0`, which would redden the gate on the first
   sub-pixel of legitimate variance."* This matrix **is** that all-zero matrix. The branch was written
   for exactly this case and it fired for exactly this reason.
3. **They bound the risk of taking it.** A 200 px cap sits 200 px above a measured floor of 0 and
   ~16,500 px below the damage it must catch (see the next subsection). Both margins were measured, not
   assumed.

**Nothing was rounded down and no number was chosen between constraints.** Step 4's "round up to a round
number" left 200 unchanged because 200 is already round; rounding it *down* is prohibited and did not
occur. The recorded cap satisfies `cap ≥ max(noise) × 10` (200 ≥ 0).

### Does 200 catch what the gate exists to catch?

Yes, by a wide margin, and the margin is measured rather than assumed:

| Damage the gate must catch | Observed | vs. `cap = 200` |
|---|---|---|
| the v2.14 injection on `voter-results-desktop` | **16,650 px** (`146-NEGATIVE-CONTROL.md` row `B1-OLD`, this phase's companion zero-tolerance run) | **83× the cap** — caught |
| the same injection on `voter-results-mobile` | **16,689 px** (same run, row `B2-OLD`) | **83× the cap** — caught |
| the v2.14 record, for comparability only | 19,484 / 19,545 px | **97× the cap** — caught |

The admissible window is no longer a 722 px sliver between a churning floor and the injection. It is
everything from 200 up to ~16,650 — and the derivation lands at the very bottom of it, which is the
strict end.

*One caveat, stated because it affects how much weight the first two rows can bear:* those companion
counts were taken against the **old, churned** baselines, so each carries the tie-permutation offset as
well as the injection's own damage. That makes them imprecise as a measure of the injection alone. It
does **not** weaken the conclusion here, because the question is only whether the damage clears 200 px,
and it clears it by roughly two orders of magnitude under any decomposition. `146-04`'s `C1-NEW` /
`C2-NEW` re-measure the caught halves under the cap and against current baselines; that is where a
precise figure belongs.

### Which knob binds where, under `cap = 200`

Recorded because `146-04`'s config comment must cite it for D-03. Under
`Math.min(maxDiffPixels, width × height × maxDiffPixelRatio)` (`comparators.js:88-97`) the **smaller**
budget always wins:

| Baseline | `0.01 × area` | `Math.min(200, ratio)` | Operative budget | Ratio is looser by |
|---|---|---|---|---|
| `voter-results-desktop` | 47,155.2 px | 200 | **the cap binds** | 235.8× |
| `voter-results-mobile` | 16,192.8 px | 200 | **the cap binds** | 81.0× |
| `candidate-preview-desktop` | 10,508.8 px | 200 | **the cap binds** | 52.5× |
| `candidate-preview-mobile` | 3,603.6 px | 200 | **the cap binds** | 18.0× |

**At this cap value the ratio binds on NOTHING — it is inert on all four baselines.** This differs from
what the void matrix's derivation anticipated, and the difference is stated rather than glossed: that
analysis reasoned about caps in the interval `(3,603.6, 5,000)`, where `candidate-preview-mobile`'s
3,603.6 px ratio budget is the smaller of the two and keeps binding. A cap of **200** is below *every*
ratio budget in the suite, so `maxDiffPixelRatio: 0.01` never becomes operative anywhere.

**D-03's re-documentation still holds, and is if anything sharpened.** The claim D-03 makes is that
`maxDiffPixelRatio` is the **small-baseline floor** and not "the budget". These four rows are that claim
measured: the ratio's role is to be the *larger*, inert number on every baseline, and it would only
start binding on a baseline whose `0.01 × area` fell below 200 px — i.e. one smaller than 20,000 px of
area, roughly a 140×140 thumbnail. No baseline in this suite is remotely that small. So the honest
formulation for `146-04`'s comment is: **under `cap = 200` the absolute cap is the operative budget on
all four baselines and the ratio is dormant**, retained as a floor for hypothetical very small captures
rather than as a live constraint on these.

### The mechanism, argued against these measurements

The requirement is that the mechanism be argued **against** the forty observations rather than picked
first and rationalised afterwards. So:

**What the forty cells showed.** All four baselines are pixel-perfect across ten consecutive
in-container runs at zero tolerance — forty cells of zero, against a fixed expected image. The suite's
run-to-run noise floor is not "small"; it is **absent**. That is a stronger result than the measurement
was designed to accommodate: the protocol was built to characterise a distribution (min, max, spread,
sd) and the distribution turned out to be a point mass at zero.

**Why `× 10` was the chosen headroom, and what it did here.** It is headroom over *observed noise*, not
over the regression the gate must catch, and it was fixed before any number existed precisely so it
could not be tuned to them. On this matrix it produces `0`, and the floor takes over — which is the
designed behaviour for a clean matrix, not a failure of the multiplier. The multiplier's real service
was rendered on the **void** matrix, where it produced 159,280 px and forced the ceiling to reject a cap
that would have looked authoritative and meant nothing. A rule that yields a number on good data and
refuses on bad data is doing its job in both directions.

**Why the absolute cap is the right mechanism (D-01 A).** `Math.min` makes it **monotonically
strictness-increasing on every baseline whatever its value** (`comparators.js:88-97`) — it can never
loosen a budget, only tighten one — and it is bounded **independently of page height**. That is exactly
the defect VGATE-02 names: a proportional budget over a `fullPage` capture of unbounded height means the
taller the page grows, the blinder the gate becomes. `B1-OLD`/`B2-OLD` measure that blindness rather
than assert it: identical damage, identical configuration, 47,155.2 px of tolerance on desktop against
16,192.8 px on mobile, and opposite verdicts. The forty zeros then establish the other half of the
argument — that clamping all four baselines to 200 px costs nothing in false reds, because there is no
measured variance for a 200 px cap to trip over.

**Why the rejected alternative stays rejected.** Element-scoped capture (D-01 B) buys the same
height-independence by **shrinking what the gate looks at**, trading one blindness for another:
everything outside the chosen element becomes permanently invisible, and unlike a budget that blindness
is silent — nothing reports it and no number bounds it. The absolute cap keeps full-page coverage and
makes the tolerance explicit and auditable, which is the property this entire ledger exists to supply.
The void matrix supplied a second objection that is now partly spent but worth preserving: the churn was
located in the **entity list**, precisely the region an element-scoped capture of `/results` would have
had to include to be worth taking, so scoping would have concentrated the non-determinism rather than
removed it. That churn is fixed, so the objection no longer bites here — but it illustrates the general
hazard, that element scoping does not make a capture more deterministic, it only makes less of the page
observable.

### The ratio budgets the cap is compared against

Computed from the dimensions **measured on disk at ledger creation**, not from the roadmap's or any
prior document's figures:

| Baseline | Dimensions | Area (px) | Ratio budget at `maxDiffPixelRatio: 0.01` |
|---|---|---|---|
| `voter-results-desktop` | 1280×3684 | 4,715,520 | **47,155.2** |
| `voter-results-mobile` | 390×4152 | 1,619,280 | **16,192.8** |
| `candidate-preview-desktop` | 1280×821 | 1,050,880 | **10,508.8** |
| `candidate-preview-mobile` | 390×924 | 360,360 | **3,603.6** |

The 47,155.2 figure on the first row is the blindness itself: it is 2.4× the 19,484 px regression that
passed under it. Under `cap = 200` every one of these four numbers is inert — see § *Which knob binds
where* above.

---


## Font delta (N-1)

**Filled by `146-06` on 2026-08-26 at HEAD `9cd183379`** — four in-container runs, the same pinned image
digest and the same container provenance as the forty cells above (`md5` of each run's four-line
`provenance.txt` extract: `e0d2e2a1345e22f8ecbc5b5ff9820dfe`, identical to the matrix's). The framing
below was written in `146-01`, before any of it was measured, and is left standing.

The switch this phase makes is **variable → static**, not merely "the same two weights".
`css2?family=Inter:wght@400;700` makes Google serve **one variable woff2 for both weights**
(`fvar`/`gvar`/`avar`/`HVAR`/`MVAR` present in its table directory), while the vendored files are
**single-weight static instances**. The rasterisation-neutrality argument behind D-09 (only 400 and 700
are ever emitted, so no new weight renders) is correct about *which weights render* and **silent about
delivery**. Whether FreeType's variable-font instancing and static rasterisation of the same design
agree at these sizes is **unmeasured, and is not to be assumed either way.**

So it is measured: all four baselines, **no `-u` flag at all** (default mode `missing`, compare-only),
after the font lands and after `yarn build`, with **all four diff counts recorded regardless of size** —
including the zeros. Register row `F1-DELTA-PRE` carries the row; the numbers land here.

**The `candidate-preview` pair is the sensitive detector.** It sat at *exactly* 0 px across every v2.14
run, so any non-zero count there is attributable to the delivery switch rather than lost in ambient
noise. The voter pair's own noise floor is unknown until the matrix above is filled, which is why the
delta is measured **after** the cap is in force and not before.

**Ordering is load-bearing and cannot be reordered for convenience:** cap lands → font lands → measure
delta (no `-u`) → re-baseline (`--update-snapshots=all`). A re-baseline taken first **absorbs** the
delta and makes it unrecoverable without reverting the font and re-running. And the re-baseline must
use `--update-snapshots=all`, never the bare flag: bare `--update-snapshots` is mode `changed`, which
**skips images that are within tolerance** — so under the new cap a sub-cap font delta would leave those
baselines carrying pre-font-change pixels while the phase believed they were re-captured (research N-4).

### The four counts

Diff counts read at **zero tolerance** out of each run's own `results.json`, never scraped from stdout,
with `status: "passed"` + no message → `0`. Verdicts read from a separate run through the **shipped**
`tests/playwright.config.ts` (`maxDiffPixels: 200`) at the same HEAD. **No snapshot-update flag of any
kind appears on any of the four invocations** — `grep -c 'update-snapshots'` over each run's own
`pw-args.txt` and `docker-argv.txt` returns **0**, eight files, eight zeros.

| Baseline | Dimensions | Diff px vs. the pre-font baseline, at ZERO tolerance | Verdict at the shipped cap (200) | Run dir |
|---|---|---|---|---|
| `voter-results-desktop` | 1280×3684 | 11615 | **FAIL** — 11,615 > 200 | `tests/e2e-runs/146-fontdelta-zero` (+ `-run02`, `-run03`); verdict from `tests/e2e-runs/146-fontdelta-cap-146-06` |
| `voter-results-mobile` | 390×4152 | 11601 | **FAIL** — 11,601 > 200 | `tests/e2e-runs/146-fontdelta-zero` (+ `-run02`, `-run03`); verdict from `tests/e2e-runs/146-fontdelta-cap-146-06` |
| `candidate-preview-desktop` | 1280×821 | 0 | **PASS** | `tests/e2e-runs/146-fontdelta-zero` (+ `-run02`, `-run03`); verdict from `tests/e2e-runs/146-fontdelta-cap-146-06` |
| `candidate-preview-mobile` | 390×924 | 0 | **PASS** | `tests/e2e-runs/146-fontdelta-zero` (+ `-run02`, `-run03`); verdict from `tests/e2e-runs/146-fontdelta-cap-146-06` |

**The two zeros are measurements, not blanks.** Both `candidate-preview` captures **passed** at
`maxDiffPixels: 0`, so `comparators.js:96`'s strict `count > maxDiffPixels` emitted no message at all —
research Pitfall 1 in its exact predicted form, and the reason the extractor maps `passed` → `0` rather
than harvesting failure text.

**Each of the four numbers reproduced across all four runs**, byte-for-byte identical, so none of them is
a single observation:

| Run | config | voter-desktop | voter-mobile | cand-desktop | cand-mobile | exit | `E2E PREFLIGHT OK` |
|---|---|---|---|---|---|---|---|
| `146-fontdelta-zero` | overlay, `maxDiffPixels: 0` | 11615 | 11601 | 0 | 0 | 1 | 1 |
| `146-fontdelta-zero-run02` | overlay, `maxDiffPixels: 0` | 11615 | 11601 | 0 | 0 | 1 | 1 |
| `146-fontdelta-zero-run03` | overlay, `maxDiffPixels: 0` | 11615 | 11601 | 0 | 0 | 1 | 1 |
| `146-fontdelta-cap-146-06` | shipped, `maxDiffPixels: 200` | 11615 | 11601 | 0 | 0 | 1 | 1 |

The overlay was reconstructed **verbatim** from § *The measurement configuration* above, its
`--list` enumerated the same **7 tests in 4 files** the base config does before any measurement was
taken (F-146-P2), every run carries the preflight's own OK line naming this checkout (F-146-P1), and the
overlay was deleted again at the end of the task.

### The `candidate-preview` pair moved by exactly 0 px — and that is the answer

Research named the falsification criterion in advance and named it precisely: *"any non-zero delta on
the two `candidate-preview` baselines … those two are the project's cleanest signal: if they move at
all, the move is the font."* The claim it would have falsified is D-09 A's rasterisation neutrality.

**The test was run against the still-committed Google-served baselines, and it did not falsify.** Both
of those baselines score **0 px at zero tolerance**, in three consecutive overlay runs and once more
through the shipped config. Their status as the sensitive detector is argued from this ledger's own
§ *Noise matrix* rather than from memory: **twenty of the forty cells are theirs and all twenty are 0**,
matching the void first matrix's twenty zeros and `136-VISUAL-DISCRIMINATION-EVIDENCE.md`'s v2.14
record. That pair has never moved under this instrument, so it has no ambient noise in which a delta
could hide.

**So the variable→static delivery switch moved zero pixels**, on every glyph those two pages render —
including their bold 700 heading and their 400 body text — at the sizes this application uses, in the
pinned `linux/amd64` container. The delta is not "small". It is **0 px**, which under
`maxDiffPixels: 200` is 0 % of the budget. D-09 A's neutrality argument was correct about *which weights
render* and silent about delivery; measured, delivery turns out to cost nothing either. That is a
result, not a non-result: it was an open question that research explicitly refused to pre-answer, and it
is now closed by observation.

**The 0 is a real self-hosted rendering, not a silent fallback to Google.** Every one of these captures
ran through `guardThirdPartyFonts` (`146-05`, D-12) *before* the screenshot, and it passed: zero
third-party font requests were observed on the page, and the same-origin `/fonts/inter.css` was
requested and returned 200. Without that guard a `0` here would be indistinguishable from "the page
quietly loaded Google's font again"; with it, the 0 means what it says.

### The voter pair's 11,615 / 11,601 is NOT a font delta — it is the stale tie permutation, measured

The two voter counts must not be reported as font delta, and the reason is measured rather than
inferred. Decoding `146-fontdelta-zero`'s own actual capture against the committed
`voter-results-desktop.png` gives 29,951 raw-differing pixels distributed over **31 horizontal bands**
the height of a results row, down the whole 3,684-px page. Cropping any one band shows a **different
candidate occupying the same slot** — the committed baseline has *Generic AA Four* with match 6 where
the current rendering has *Generic AA One* with match 3.

That is the old arbitrary tie permutation the committed baselines still encode, disclosed at length in
§ *The pre-matrix baseline refresh* above and fixed in the product by `53002b6a9` + `dbb704bd4`. It is a
**content** difference, not a rasterisation one, and `146-07`'s re-baseline is what clears it. The two
numbers are recorded here because the section's contract is to record every count regardless of size —
not because they measure the font.

### ⚠ CORRECTION — the 856 px reading in `146-05-SUMMARY.md` is NOT the font delta

`146-05-SUMMARY.md:187-202` recorded the `candidate-preview` pair at **856 px** and read it as the
falsification criterion being met — *"they moved, by 856 px … the 856 px figure is the clean signal"*.
That reading is **withdrawn here on measurement**, and the correction is recorded rather than quietly
dropped, because it is the premise `146-07` would otherwise inherit.

Two independent measurements retire it:

1. **The 856 px is entirely a portrait tile.** Decoding that run's own expected/actual pair
   (`146-fontdelta-cap/html/data/d2ae4db5….png` vs `d7a7adcc….png`, the first of which is byte-identical
   to the committed baseline) gives 2,463 raw-differing pixels, of which **2,304 — exactly 48 × 48 —
   lie in the avatar tile at x 373-420, y 178-225**, where the two runs simply seeded a different
   photograph for the same candidate. Re-running `pixelmatch@threshold 0.2` over the pair reproduces
   **856** exactly; masking that one 48×48 tile and re-running it gives **0**. Every scored pixel of the
   856 was the portrait. The remaining 159 raw pixels carry per-channel deltas of 6-7 (max 44) and
   pixelmatch does not score any of them.
2. **It does not reproduce.** The same comparison at current HEAD scores **0** in four consecutive runs.
   A rasterisation delta between two font deliveries is deterministic — it would recur on every run of
   the same page. A difference that appears in one session and is absent in the next four is, by that
   property alone, not a font delta.

**Why the sessions differed at all** (recorded as a finding, not fixed here): the seed writer assigns
`portraits[i % portraits.length]` over candidates in insertion order (`packages/dev-seed/src/writer.ts:293`),
so the photo a given candidate receives is a function of the candidate array's order at upload time. The
voter counts moved the same way across sessions — 16,883 px at 10:45, 16,887 / 16,878 px at 15:45,
11,615 / 11,601 px from 16:28 onward — while being perfectly stable *within* each session (four
identical runs here; ten identical runs in § *Noise matrix*). **Run-to-run noise is 0; session-to-session
seed ordering is not.** That is out of scope for this plan and is filed in the phase's
`deferred-items.md`; it matters to `146-07`, which will bake whatever ordering is live at re-baseline
time into the committed PNGs, and to `146-08`'s determinism runs, which measure within one session and
therefore cannot see it.

### The road not taken, and what it would have cost

`@fontsource-variable/inter` exists and would have been the **delivery-neutral** option: it ships the
same variable face Google serves, so the variable→static question would not have arisen at all. D-09 C
rejected variable faces and that decision is locked; this is a note for the reader who asks *"could we
have avoided the delta?"*, not a re-litigation. The honest accounting is that **choosing static cost
0 px** on the pair sensitive enough to detect it — the alternative would have bought neutrality that the
chosen option turned out to have anyway.

### What `146-07` is therefore absorbing

The re-baseline is **not** absorbing a rasterisation change. On the `candidate-preview` pair it will
re-record pixels that are already identical to the committed ones; on the voter pair it will clear the
old tie permutation, which is a content difference that has been owed since `53002b6a9` landed and is
the reason the re-baseline exists. Both voter baselines are red at the shipped cap by ~58× the budget,
so the re-baseline remains mandatory; both `candidate-preview` baselines are green and would stay green
without it.

---

## Completeness

**This ledger's corpus is exactly 40 measurement cells, 1 `max` row and 1 § Font delta section.** The
count is asserted here, about this document, in the manner 143, 144 and 145 asserted theirs — a corpus
that is not asserted about itself can be quietly extended, and an extended corpus is no longer
evidence. **This assertion covers this file only.** `146-NEGATIVE-CONTROL.md` asserts its own 29 rows
about itself.

| Class | Count | Where |
|---|---|---|
| noise measurement cells | **40** | § Noise matrix — 10 rows × 4 baselines |
| per-run exit cells | **10** | § Noise matrix — one per run row |
| `max`-row cells | **4** | § Noise matrix — the derived row `max(noise)` is taken from |
| font-delta cells | **4** | § Font delta (N-1) |
| **= total measurement cells at creation** | **58** | |

40 + 10 + 4 + 4 = **58** placeholder occurrences across the two tables at creation. The 40 in the first
class are the **derivation corpus**: `max(noise)` must be computed from all forty or not at all.

**Cells owned by each plan:** `146-03` fills the whole noise matrix (54 cells) and the § The
measurement configuration verbatim block; `146-06` fills § Font delta (4 cells). `146-01` fills
nothing — it enumerates, and enumerating before measuring is the only reason the zeros will be
recorded at all.

### Filled by `146-03` — counted, not asserted

| Class | Owed | Filled | Remaining |
|---|---|---|---|
| noise measurement cells | 40 | **40** | 0 |
| per-run exit cells | 10 | **10** | 0 |
| `max`-row cells | 4 | **4** | 0 |
| § The measurement configuration verbatim block | 1 | **1** | 0 |
| § Derivation (D-05) | 1 | **1 — run, and it terminates in `cap = 200` (floor branch)** | 0 |
| font-delta cells | 4 | 0 | **4 — owned by `146-06`** |

### Filled by `146-06` — counted, not asserted

| Class | Owed | Filled | Remaining |
|---|---|---|---|
| font-delta cells | 4 | **4 — `11615` / `11601` / `0` / `0`, all four numerals, zeros included** | 0 |
| at-cap verdict cells | 4 | **4 — FAIL / FAIL / PASS / PASS** | 0 |
| § Font delta (N-1) prose — the N-1 answer | 1 | **1 — measured 0 px on the detector pair; neutrality NOT falsified** | 0 |

**Every measurement class in this ledger is now filled: matrix (40), per-run exits (10), `max` row (4),
§ The measurement configuration, § Derivation (D-05) — run, terminating at `cap = 200` — and
§ Font delta (N-1).** Nothing in this file is outstanding.

```
grep -cE '^\| run[0-9]{2} \|' 146-VISUAL-NOISE-LEDGER.md      # -> 10 matrix data rows
grep -cE '^\| \*\*max\*\* \|'    146-VISUAL-NOISE-LEDGER.md   # -> 2: the matrix's derived
                                                              #    `max` row (the corpus one) plus
                                                              #    the `max` line of the summary
                                                              #    table in § What the forty cells
                                                              #    say. Only the FIRST is a cell
                                                              #    class; the second restates it.
grep -E '^\| (run[0-9]{2}|\*\*max\*\*) \|' 146-VISUAL-NOISE-LEDGER.md \
  | grep -o 'pending' | wc -l                                 # -> 0  (was 54 at creation)
grep -cE '^\| `(voter|candidate)-[a-z-]+` \| pending \|' \
  146-VISUAL-NOISE-LEDGER.md                                  # -> 0 after `146-06`
                                                              #    (was 4: the § Font delta rows)
```

**The row-label pattern widened from `run(0[1-9]|10)` to `run[0-9]{2}`, and why.** The matrix's ten
completed observations are `run01`…`run06` and `run08`…`run11`: `run07` is void (§ *The `run07`
anomaly*) and `run11` is its replacement. The original pattern was written in `146-01` on the
assumption that ten runs would be numbered 1–10 — but this plan's own Task 2 instructs *"take a
replacement run so the matrix still rests on ten completed observations"*, and a replacement necessarily
carries the eleventh number. **Row labels were kept matching their run directories one-for-one** rather
than renumbered to fit the pattern, because label↔directory correspondence is what lets any cell be
audited back to the `results.json` it came from; the pattern was widened instead. Both forms still
assert the same invariant: **exactly ten data rows, forty numeric cells, zero placeholders.**

**Placeholder CELLS remaining in this file: exactly 0.** The last four were the § Font delta (N-1)
table's, and `146-06` filled them from the four runs recorded in that section — measured after the font
landed and **before** `146-07`'s re-baseline, in the one window where the comparison still existed.

**Count `pending` with an anchored pattern, never with a bare `grep -o`.** A bare
`grep -o 'pending' … | wc -l` overcounts here, and every extra is *prose*: the header sentence that
defines the placeholder word, the `146-02` carry-over note, the precedent-chain sentence, the matrix's
did-not-execute rule, the grep examples in this very block (which necessarily contain the word they
search for), and this paragraph itself. The anchored forms above count cells; the bare form counts the
documentation of the convention as if it were unfinished work. The sibling register makes the same
distinction with its own row-anchored pattern, and for the same reason.

**All 40 zeros are measurements, and this matrix is the extreme case of why that matters.** Every one of
the forty captures **passed** at `maxDiffPixels: 0` and emitted no message at all (`comparators.js:96`,
strict `count > maxDiffPixels`). A ledger built by harvesting failure text would have recorded
**nothing at all** here — not a biased subset, an empty one — and would have had no corpus from which to
derive anything. That the cells are `0` rather than absent is entirely due to the 40 having been
enumerated in `146-01` before any run happened. Research Pitfall 1, vindicated at full strength.

**And the inverse trap fired too, in `run07`.** A capture that did **not complete** must not be recorded
as `0`. The extractor originally keyed on the absence of a diff message rather than on the status and so
read `run07`'s timed-out capture as a clean zero; it was corrected to require `status === 'passed'`
before emitting `0`. Both traps are about the same confusion — *no message* means two opposite things
depending on why there is no message — and a matrix of forty zeros is precisely where that confusion is
hardest to spot by eye.

---

*Phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity*
*Opened: 2026-08-25 at HEAD `0c3a26ab6` by `146-01` Task 3 — 40 matrix cells + 1 max row + 1 font-delta section enumerated, 0 measurements, 0 product bytes, no cap value.*
*Measured: 2026-08-25 by `146-03` Tasks 2-3 — 40/40 cells filled; § Derivation RUN and HALTED at `max(noise) = 15,928 px`. **That matrix is VOID:** it measured the tie-order churn fixed by `53002b6a9` + `dbb704bd4`, not noise. Evidence retained at `tests/e2e-runs/146-noise-VOID-run01`…`-VOID-run10`.*
*Re-measured: 2026-08-26 by `146-03` Tasks 2-3 at HEAD `e5ff31740` — 40/40 matrix cells, 10/10 exits and 4/4 max cells filled from ten completed in-container runs at `maxDiffPixels: 0`, **all forty reading 0**; § Derivation RUN and TERMINATING at `max(noise) = 0` → floor branch → **`cap = 200`**, inside `[200, 5000)`. One run (`run07`) voided by a recurrence of the run-4-shaped `voter-journey.fixture.ts:336` timeout and replaced by `run11`; that anomaly is OPEN. Still 0 product bytes: the cap exists as a derivation, and `146-04` installs it.*
*Font delta measured: 2026-08-26 by `146-06` Task 1 at HEAD `9cd183379` — 4/4 font-delta cells and 4/4 at-cap verdicts filled from four in-container runs (three at `maxDiffPixels: 0` through the overlay reconstructed verbatim from § The measurement configuration, one through the shipped config at `maxDiffPixels: 200`), **no snapshot-update flag on any invocation**, against the still-committed Google-served baselines. **N-1 answered: the variable→static switch moved 0 px** on both `candidate-preview` baselines — research's own falsification criterion, not falsified. The voter pair's 11,615 / 11,601 px is the old tie permutation the committed baselines still encode, measured to be a content difference and not a rasterisation one. `146-05-SUMMARY.md`'s 856 px reading is CORRECTED here: masking one 48×48 portrait tile takes that same comparison to 0. Still 0 product bytes.*
