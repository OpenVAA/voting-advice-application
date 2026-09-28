---
phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity
plan: '09'
subsystem: testing
tags: [record-correction, visual-regression, playwright, self-hosted-fonts, roadmap, requirements]

requires:
  - phase: 146-08
    provides: all gates green at one HEAD — the evidence every correction here cites
  - phase: 146-07
    provides: the D-16 re-scope, PT1-PRODTRACE, and the re-baseline these corrections describe
  - phase: 146-06
    provides: F2-BOGUS-RED / F3-BOGUS-GREEN — the measured disproof of the fifth stale claim
provides:
  - thirteen record corrections in 146-NEGATIVE-CONTROL.md § Record corrections, each citing a file+line, a commit or a ledger row
  - seven filed todos under .planning/todos/pending/2026-08-26-146-*.md
  - a closed ROADMAP § Phase 146 with the plan list, the delivered summary, the unsoftened D-16 verdict and a known-remaining statement
  - all six VGATE requirements ticked, with VGATE-01/04/05's wording corrected before their status was decided
affects: [phase-147, phase-149, apps/docs vendoring, dev-seed portrait assignment, ship-time PR to main]

actuals:
  tokens: 20000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - 'one executable recipe, zero prose copies: visual-container.sh is the single source and README/workflow/docblock all point at it'
    - 'correct a requirement''s wording BEFORE deciding its status — a tick against a wrong criterion is worse than a pending'
    - 'file adjacent work rather than pad a phase with it — seven todos, none folded in'

key-files:
  created:
    - .planning/todos/pending/2026-08-26-146-docs-site-google-fonts-link.md
    - .planning/todos/pending/2026-08-26-146-dead-font-weight-utility-classes.md
    - .planning/todos/pending/2026-08-26-146-claude-md-app-shared-esm-only.md
    - .planning/todos/pending/2026-08-26-146-e2e-base-empty-external-id-prefix.md
    - .planning/todos/pending/2026-08-26-146-ledger-row-escaped-pipe-breaks-awk.md
    - .planning/todos/pending/2026-08-26-146-docker-desktop-container-egress-syn-drops.md
    - .planning/todos/pending/2026-08-26-146-select-election-walk-path-nondeterministic.md
  modified:
    - tests/README.md
    - .github/workflows/main.yaml
    - tests/tests/specs/visual/visual-regression.spec.ts
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
    - .planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/146-NEGATIVE-CONTROL.md

key-decisions:
  - 'Thirteen corrections, not the five the plan chartered. Where a correction contradicted 146-09-PLAN.md''s own text, the plan''s expectation was recorded as SUPERSEDED rather than restated.'
  - 'All six VGATE requirements ticked. VGATE-01, VGATE-04 and VGATE-05 had their wording corrected first; each tick carries its scope boundary inline.'
  - 'No dev-server restart step was added to visual-container.sh or tests/README.md — 146-07 recorded no reproduction, and the plan forbids inventing a remedy for an unconfirmed hypothesis.'
  - 'The full E2E suite was NOT re-run. The plan''s <polarity> block prohibits re-running a gate to confirm a documentation change; --list enumerated 137 default / 142 with PLAYWRIGHT_VISUAL, unchanged, and settleFonts'' body is proven byte-identical.'
  - 'The 146-08 <verify> over-breadth is recorded as a defect in the check, not worked around by mangling the register''s prose.'

status: complete
completed: 2026-08-26
---

# Phase 146 Plan 09: Record Corrections, Filed Todos, ROADMAP Closure — Summary

Thirteen record claims this phase falsified are corrected — each citing a file and line, a commit, or
a ledger row rather than asserting the correction — seven adjacent items are filed rather than
absorbed, and all six VGATE requirements are ticked with VGATE-01/04/05's wording repaired **before**
their status was decided.

## What was done

### Task 1 — `tests/README.md` and `.github/workflows/main.yaml` (`04e91b221`)

Three of the four D-18 items. Comments and documentation only; `git diff -U0` over `main.yaml`
returns **no non-comment line**.

### Task 2 — both docblocks in `visual-regression.spec.ts` (`e25a78de5`)

The file docblock's `## Re-baselining` subsection and the `settleFonts` docblock, replaced. Verified
mechanically: `settleFonts`' body still matches on both `document.fonts.ready` and
`document.fonts.check('1em Inter')`; `grep -c "await guardThirdPartyFonts(page)"` still returns **4**;
the non-comment diff over the whole file is **empty**.

### Task 3 — ROADMAP, REQUIREMENTS, the ledger, seven todos (`01d0ef966`)

`146-NEGATIVE-CONTROL.md` gained a top-level **§ Record corrections** with a 13-row table plus a
negative-result paragraph. § *Residue*'s "Record corrections owed to `146-09`" list was marked
**DISCHARGED** in place and left standing, so a reader sees what was owed as well as what was paid.
`.planning/ROADMAP.md` § Phase 146 was edited with **scoped** replacements — `git diff --stat` shows
**10 insertions / 4 deletions**, not a whole-file rewrite.

## The record claims corrected — old text and new

**Rows 1–5 are the plan's charter (D-18's four plus the fifth). Rows 6–13 are the phase's own
execution, which falsified more than the plan anticipated.**

### 1. `auth-setup` cannot authenticate against the base dataset — *D-18 A, item 1*

- **Old** (`tests/README.md:185`): "`auth-setup` can't authenticate against the base dataset yet (no
  registered base candidate / email)."
- **New**: "Snapshot **portability**, not a blocker: the baselines are Linux/x86_64 PNGs that only
  compare correctly inside the CI-matching container… The retired reason recorded here … has been
  false since **Phase 136**: `tests/tests/setup/shared/auth.setup.ts:82-84` force-registers base
  CA-AA-1 through `SupabaseAdminClient`."
- **Disproof**: `auth.setup.ts:82-84` — `unregisterCandidate` then `forceRegister`.

Two adjacent lines that the correction would have contradicted were fixed in the same edit: the
"(each has a hard blocker —" preamble at `:63` and the "**Opt-in** (… each has a hard blocker):"
table caption. Leaving them would have made the README contradict itself one screen apart.

### 2. The baseline path — *D-18 A, item 2*

- **Old**: "Screenshot baselines under `tests/specs/__screenshots__/`".
- **New**: "Screenshot baselines live under `tests/tests/specs/visual/__screenshots__/`
  (`snapshotPathTemplate` at `tests/playwright.config.ts:294` over the project's `testDir` at `:415`)."
- **Disproof**: that directory has never existed; `git ls-files` finds all four PNGs at the corrected
  path.

### 3. The `e2e-visual` job's font-egress requirement — *D-18 A, item 3*

- **Old** (`main.yaml:318-319`): "The job needs network access to fonts.googleapis.com: the app loads
  Inter with display=swap and the specs assert it resolved before capturing."
- **New**: "The job needs **NO** third-party font egress. Since Phase 146 the app serves Inter from
  its own origin… Measured, not assumed: the whole visual project ran green in-container with
  `fonts.googleapis.com` and `fonts.gstatic.com` blackholed at the runner, with the curl control
  failing first to prove the block was real — see rows `EG1-CURL` and `EG2-SUITE`… The specs still
  assert the font resolved before capturing, which is why `settleFonts` exists."
- **Note**: this one was **true when written**. It became false at the exact moment VGATE-04 landed —
  the hardest class of stale record to catch, because nothing about it was ever wrong until a change
  made it so.

### 4. The prose container recipe — *D-18 A, item 4*

- **Old**: an indented literal `docker run … -v "$PWD":/work -w /work …` with the instruction
  "forward the host ports onto the container loopback, then:".
- **New**: a subsection naming `tests/scripts/visual-container.sh` as the single executable source,
  the three host-side prerequisites in order, the Linux/x86_64 never-on-a-Mac rule, and
  `--update-snapshots=all` with the reason the bare form is wrong.
- **Disproof**: `tests/global-setup.ts:41` derives `repoRoot` from the test process's own path;
  `tests/tests/support/preflight.ts:429-444` requires strict absolute-path equality. Row `D14-OBS`
  observed the identical-path mount succeeding.

### 5. ⚠ THE FIFTH — `settleFonts` fails an unreachable font host by name

**Not one of the four the user reviewed under D-18. Found by `146-RESEARCH.md` § N-2 after the
discussion closed. A PREMISE correction, not a decision change — D-10 A stands exactly as locked and
`settleFonts`' body is byte-identical.**

- **Old**: "The `check` assertion is deliberate: if a runner cannot reach fonts.googleapis.com,
  `document.fonts.ready` still resolves (with the fallback in place) and the run would fail as an
  inscrutable whole-page pixel diff. This fails it as 'Inter did not load' instead."
- **New**: the measured three-case table — unreachable `src` → `false` → **caught by name**; **zero**
  `@font-face` rules → `true`, `document.fonts.size` 0 → **not caught here**; valid `src` → `true` →
  passes correctly — followed by "The docblock this replaces claimed the middle case failed here by
  name. It never did, at any point in this function's life," and the handover of the uncovered case to
  `guardThirdPartyFonts` **by name**.
- **Disproof**: measured in `mcr.microsoft.com/playwright:v1.58.2-noble`; both directions in rows
  `F2-BOGUS-RED` / `F3-BOGUS-GREEN`.

### 6. N-1 resolved in the **NEGATIVE** — *supersedes the plan's expectation*

- **Old** (`146-05-SUMMARY.md:187-202`): the variable→static Inter switch moved **856 px** on the
  `candidate-preview` pair.
- **New**: the delta is **0 px**. The 856 decoded to a **single 48×48 portrait tile** from a
  differently-seeded photograph; masking `x 373-420, y 178-225` took it to 0. Research's falsification
  criterion was **not met**, so **D-09 A's font-neutrality claim survives measurement**.
- `146-06` already corrected `146-05-SUMMARY.md` in place with a marked `⚠ CORRECTED BY 146-06` block.
  Restated in the ledger so the correction is not visible only to a reader of `146-05`.

### 7. The old configuration was blind on **BOTH** voter baselines

- **Old**: the blindness was framed as `voter-results-desktop`'s alone — the tall baseline — with
  mobile's historic red taken as the gate working.
- **New**: `146-04-SUMMARY.md:99` measures **4,783 px desktop / 4,835 px mobile** — **10.1 %** and
  **29.9 %** of the respective old ratio budgets. Both were blind. Mobile's historic red was carried by
  the **tie-permutation churn**, not by the gate's sensitivity. A sharper indictment than the phase
  originally claimed.

### 8. D-16 is obsolete and was re-scoped — both limits **unsoftened**

- **Old**: the run-4 anomaly is unexplained; leading hypothesis Vite HMR staleness; three bounded
  inject/revert/re-run attempts on a continuously-running dev server.
- **New**: root cause is container egress dropping outbound TCP SYNs (**35,634–68,369 ms** of Linux
  backoff on the connect leg), amplified by `tcp-forward.mjs` dialling once with no deadline. Fixed in
  `4066c2f41` + `351981b4f`; the HMR hypothesis is **falsified**; `146-07` converted D-16 into a
  regression check.
- **Both standing limits recorded unsoftened**: (a) the end-to-end symptom was **never** reproduced
  post-fix, so the chain is **mechanical, not demonstrated**; (b) **CI is a different environment** that
  does not use this relay at all — `D17-CI` used CI's *invocation*, never CI's *environment*.

### 9–10. VGATE-05's two wrong criteria — the criteria, not the implementation

- **(a)** "all four `/fonts/*.woff2` requests appear with status 200" → only **2 of 4** are fetched,
  because the `latin-ext` pair's `unicode-range` is never exercised by the content. Correct browser
  behaviour; subsetting working as designed.
- **(b)** the production trace was assumed to reach `/questions`, `/results` and `/candidate/preview`
  as rendered documents → all three were reached as **307/303 guard redirects**, and three attempts to
  drive election selection through the production UI were abandoned rather than building a second
  fixture harness. `146-08`'s egress-blocked run does **not** improve this — it drives the **dev**
  server through the suite's fixtures, a different instrument.

### 11. `146-08`'s own `<verify>` block is unsatisfiable as written

It counts placeholders with a bare `\bpending\b` over the whole file and demands 0, while the register
documents its own placeholder word in four places. The **row-anchored** count — the register's
documented method — returns **0**. The check's over-breadth is recorded; **the prose was not mangled to
satisfy a broken check**.

### 12. D-146-DEF-1 was refuted

- **Old**: seed ordering varies across sessions via `writer.ts:293` taking candidates in insertion
  order.
- **New**: the seed **is** deterministic — the DB is byte-identical across `db:reset` cycles, and
  `portraitFiles[i % 30]` over 30 candidates is a **bijection** that would have permuted every
  photograph had any reorder occurred. `selectCandidatesForPortraitUpload` carries
  `.order('external_id', ascending)`. The real variance is a **291×17 focus-state band** on the
  election chip, scoring **0 px at `threshold: 0.2`**, fixed **test-only** in `2df2d0b28`.

### 13. VGATE-01's own magnitudes

- **Old** (`REQUIREMENTS.md:22`, propagated from `146-03-PLAN.md:223` through `146-04-PLAN.md:93,317`
  into ROADMAP criterion 2): "~19,500 diff px … previously passed it at 0.41% of its ratio budget".
- **New**: against current baselines the same provably-identical injection measures **4,783 px /
  4,835 px** = **10.1 % / 29.9 %** of the old budgets, and **0.41 %** was a units error — 19,500 of a
  47,155 px budget is **41.4 %**, i.e. the ratio 0.414 printed as a percentage without conversion.

## A negative result, recorded as one

`146-08`'s seven gate runs logged **0 dropped SYNs across ≈1,134 connections**, against `146-07`'s
**33 in 2,239**. The absorb path in `4066c2f41` was **never exercised**. The determinism sweep is
therefore **no new evidence about the SYN fix** — it says the gate is green and stable, nothing more.
The phase record must not imply otherwise, and now does not.

## Todos filed — seven, where the plan chartered three

All under `.planning/todos/pending/`:

| File | Item | Source |
|---|---|---|
| `2026-08-26-146-docs-site-google-fonts-link.md` | `apps/docs/src/app.html:9-11`'s independent Google Fonts `<link>` | D-13, `T-146-06` accept |
| `2026-08-26-146-dead-font-weight-utility-classes.md` | 15 dead `font-medium`/`font-semibold` classes | D-09 |
| `2026-08-26-146-claude-md-app-shared-esm-only.md` | `CLAUDE.md`'s stale ESM/CommonJS claim | research N-7 |
| `2026-08-26-146-e2e-base-empty-external-id-prefix.md` | `externalIdPrefix: ''` → `.like('external_id','%')` would rotate all 30 portraits | debug record, evidence T-140 |
| `2026-08-26-146-ledger-row-escaped-pipe-breaks-awk.md` | `F3-BOGUS-GREEN` splits into **13** awk fields | pre-existing since `146-07` |
| `2026-08-26-146-docker-desktop-container-egress-syn-drops.md` | unfixed, not ours; non-relayed container paths still exposed; rate moves | D-16 re-scope |
| `2026-08-26-146-select-election-walk-path-nondeterministic.md` | landing election non-deterministic by its own docblock | `selectElection.ts:64` |

**One measured correction inside a filed item.** The awk-field todo was expected to record **11**
fields; measurement returns **13** (`F2-BOGUS-RED`, the paired row, is the one at the correct 11). Two
escaped pipes in a `grep -c` alternation, not one. The todo records the measured value and notes the
prior figure was superseded.

## Requirements — what was ticked, and on what

| Req | Ticked | Evidence and scope |
|---|---|---|
| **VGATE-01** | ✅ | `B1-OLD`/`B2-OLD` → `C1-NEW`/`C2-NEW`, caught at **23.9× / 24.2×** the cap, injected blob proven byte-identical across halves. **Wording corrected first** (row 13). Scope stated: the `candidate-preview` pair takes zero damage from this injection, so there is nothing there to catch. |
| **VGATE-02** | ✅ | `H0-GROWTH`/`H1-SHORT`/`H2-LONG`: ratio budget **+54.2 % for zero content**; 59,507 px damage flips **FAIL → pass** under ratio-only, stays FAIL under the cap. |
| **VGATE-03** | ✅ | 40-cell matrix, **0 in all 40**; D-05 floor branch → `cap = 200`; derivation committed in `tests/playwright.config.ts`. |
| **VGATE-04** | ✅ | `EG1-CURL` (`exit=7`, 4 s earlier, same container) + `EG2-SUITE` (**7/7 green, exit 0**). **Wording corrected** to say *in the CI-matching container*, matching ROADMAP criterion 4. **Boundary recorded inline:** no run was taken on a GitHub runner; discharges on the branch's first PR to `main`, per the Phase 137 precedent. |
| **VGATE-05** | ✅ | `PT1-PRODTRACE` — 477 requests, exactly **two** hosts, zero third-party font requests — plus the permanent in-spec guard, green ×4 per run with `/fonts/inter.css` present and 200. **Ticked only after both wrong criteria were corrected in the requirement's own text** (2-of-4 woff2 is correct behaviour; the three located routes were 307/303 redirects). **Scope written into the requirement:** the VAA frontend, **not** the repository. |
| **VGATE-06** | ✅ | Re-baselined in the CI-matching container behind the egress block; `G0-CLEAN` green from a **non-updating** run; six further runs **6/6 green, 42/42, 0 flaky, 0 retries consumed**. Same CI-runner boundary as VGATE-04. |

**Nothing was left silently pending.** The two things this phase cannot claim — the CI-runner
environment, and D-16's end-to-end symptom — are written into VGATE-04/06's text and into the ROADMAP
entry as boundaries on ticks, not as absent evidence hidden behind an unticked box.

## Deviations from Plan

### Superseded plan expectations (recorded, not restated)

**1. "Five stale claims" → thirteen.** The plan's `must_haves` truth *"**Five** stale record claims are
corrected, not four"* is superseded. Five was right at planning time; the phase went on to falsify
eight more between `146-03` and `146-08`. Restating "five" alongside thirteen disproofs is how a
falsified premise survives into the next phase, so the count was corrected rather than preserved.

**2. "Three todos" → seven.** Same shape. The plan's three are all filed; four more surfaced during
execution and are filed rather than absorbed, per the same precedent that produced the three.

**3. The D-16 acceptance criterion is unsatisfiable as written.** It required that if the anomaly did
not reproduce, the entry say **"still unexplained"** with the attempt count. The anomaly **was
explained** — root-caused and fixed two plans before the sweep — so "still unexplained" would be a
false statement. The entry records the re-scope, the root cause, and both standing limits unsoftened
instead. The criterion's premise, not the entry, is what was wrong.

**4. VGATE requirement flips were not in the plan's charter.** `146-08` deliberately left all six
unflipped so that VGATE-05's wording could be corrected first. That work is discharged here.

### Auto-fixed (Rule 2 — correctness of the record)

**5. Two adjacent README lines contradicted the corrected cell.** `tests/README.md:63` and the Opt-in
table caption both asserted "each has a hard blocker", which the corrected cell explicitly denies for
`visual-regression`. Fixed in the same edit; a README that contradicts itself one screen apart is not a
corrected record.

**6. `.planning/REQUIREMENTS.md` was not in the plan's `files_modified`.** It is where five of the six
VGATE checkboxes and three wrong criteria live. Modified.

### Not done, deliberately

**7. No dev-server restart step was added.** The plan conditions it on `146-07` having reproduced the
anomaly. It did not — D-16 was re-scoped, not executed. No remedy was invented for an unconfirmed
hypothesis.

**8. The full E2E suite was not re-run.** The plan's `<polarity>` block prohibits re-running a gate to
confirm a documentation change. What was run instead: `yarn lint:check` (22/22), `yarn format:check`,
`npx playwright test --list` at **137** default and **142** with `PLAYWRIGHT_VISUAL=1` (unchanged), a
non-comment-diff check over both source files returning empty, and a body-shape check proving
`settleFonts` intact.

## Invariants held

| Invariant | Check | Result |
|---|---|---|
| four baseline PNGs untouched | `git ls-files -s tests/tests/specs/visual/__screenshots__/` | `15dabda712…`, `78d8fad28d…`, `402f4bf8d8…`, `8878188644…` — all four unmoved |
| `maxDiffPixels` cap untouched | `git diff 48a08fc37 -- tests/playwright.config.ts` | empty |
| no product bytes | `git status --porcelain -- apps packages package.json yarn.lock` | prints nothing |
| no executable line in `main.yaml` | `git diff -U0` filtered to non-comment lines | empty |
| `settleFonts` body byte-identical | body regex over `document.fonts.ready` + `check('1em Inter')` | intact |
| guard call sites | `grep -c "await guardThirdPartyFonts(page)"` | **4** |
| ROADMAP edited in scope | `git diff --stat -- .planning/ROADMAP.md` | 10 insertions / 4 deletions |

## Known Stubs

None.

## Deferred Issues

- **The CI-runner environment** remains unobserved for VGATE-04 and VGATE-06. Written into both
  requirements as a boundary; discharges on the branch's first PR to `main`, per the Phase 137
  precedent.
- **D-16's end-to-end symptom** was never reproduced post-fix. Recorded as *"did not recur"*, never as
  *"gone"*, in the ledger, the ROADMAP entry and the filed todo.
- **Seven filed todos**, listed above, none folded in.

## Commits

| Task | Commit | Scope |
|---|---|---|
| 1 | `04e91b221` | `tests/README.md`, `.github/workflows/main.yaml` |
| 2 | `e25a78de5` | `tests/tests/specs/visual/visual-regression.spec.ts` (comments only) |
| 3 | `01d0ef966` | `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `146-NEGATIVE-CONTROL.md`, 7 todos |

## Self-Check: PASSED

All seven modified/created record files and all seven filed todos exist and are non-empty; all three
task commits (`04e91b221`, `e25a78de5`, `01d0ef966`) are present in `git log`. `yarn lint:check` and
`yarn format:check` pass at the final tree.
