---
phase: 141-package-unit-test-coverage-test-unit-invariant-guard
gate_run: 2026-08-18T18:24:45Z
head: 282443a91
gates_owed: 8
gates_discharged: 8
status: all_green
e2e_run: "135 executed / 135 passed / 0 failed / 0 flaky / 0 did-not-run (628.331 s) — cardinal-clean"
e2e_evidence: tests/playwright-report (gitignored — local only); counts from the embedded report.json
plan: 141-05-PLAN.md (wave 4)
requirements: UNIT-01, UNIT-02, UNIT-03, UNIT-04, ASSERT-10
---

# Phase 141 — Gate Discharge

Every earlier plan in this phase proved its own slice on a **different** tree. Plan 01
measured an unwired tree (`6c10d63d0`), plan 02 an unguarded one, plan 03 the tree the
guard first landed on (`84a9a2745`), plan 04 a tests-tree carrying live scratch
injections (`9b6d939a1`). **None of them observed the state this phase ships.** This
document does: all eight gates below are run against ONE tree state, `282443a91`, and
every verdict carries the verbatim command and raw integer counts rather than an
adjective.

A phase whose parts were each green at a different commit has not been shown to be green.

## Environment

```
date (UTC):   2026-08-18T18:24:45Z
repo root:    /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:     282443a91  docs(141-03): complete test:unit invariant guard plan
git branch:   feat-gsd-roadmap
pre-phase:    bbe0b231f  docs(141): fold F-140-01 into Phase 141 as ASSERT-10
OS:           macOS 26.5.1 / Darwin 25.5.0
Node:         v24.14.1
Yarn:         4.13.0
turbo:        2.8.17
vitest:       3.2.4
Playwright:   1.58.2
```

---

## Gate 1 — build and unit suite

**Commands (verbatim, in order):**

```
yarn build
yarn test:unit
```

**Exit codes:** `yarn build` → **0**. `yarn test:unit` → **0**.

**`yarn build` turbo totals (final three lines, verbatim):**

```
 Tasks:    14 successful, 14 total
Cached:    14 cached, 14 total
  Time:    113ms >>> FULL TURBO
```

**`yarn test:unit` turbo totals (final three lines, verbatim):**

```
 Tasks:    26 successful, 26 total
Cached:    14 cached, 26 total
  Time:    16.947s
```

26 = 12 `test:unit` tasks + 14 `build` tasks pulled in by `turbo.json`'s
`test:unit: { dependsOn: ["build"] }` edge. The 12 is the number Gate 2 enumerates
by name.

**Guard-before-turbo ordering — the property `"test:unit": "yarn assert:unit-coverage && turbo run test:unit"` exists to produce.** The guard's summary is **line 1** of the run; the first turbo line is **line 2**:

```
1: Unit-test coverage guard (phase 141: UNIT-04, UNIT-02) — Check 1 (declared coverage): 0 violation(s); Check 2 (turbo execution): 0 violation(s), 12 workspace(s) executed, 3 unwired. Scanned 15 workspace(s) under packages, apps; 0 non-workspace director(ies) skipped. Total: 0 violation(s).
2: • turbo 2.8.17
```

The guard therefore runs *ahead of* the suite it protects, not alongside it: an orphaned
package aborts before a single test executes, which is what makes the failure legible as
a coverage hole rather than a test failure.

**Note on `--continue` (a correction carried into this gate, not a finding of it):**
`turbo run` defaults to `--continue=never`, so a run with two independent failures names
only the **first**. A single-name output is turbo's abort policy, **not** evidence of
masking and not evidence of an unfailable gate. Where both names were needed — the
UNIT-01 two-package plant — `141-NEGATIVE-CONTROL.md` Row 5 § Observation C measured it
explicitly rather than inferring it.

**VERDICT: PASS.**

---

## Gate 2 — turbo census (UNIT-02 cross-check on the shipped tree)

**Command (verbatim):**

```
npx turbo run test:unit --dry=json
```

filtered on `tasks[].task === 'test:unit'`, partitioned by `command !== '<NONEXISTENT>'`.

**Totals:** 15 `test:unit` tasks in the graph — **12 executed**, **3 unwired**.

**Executed (12, sorted):**

```
@openvaa/app-shared
@openvaa/argument-condensation
@openvaa/core
@openvaa/data
@openvaa/dev-seed
@openvaa/docs
@openvaa/filters
@openvaa/frontend
@openvaa/llm
@openvaa/matching
@openvaa/question-info
@openvaa/supabase
```

**Unwired (3, sorted):**

```
@openvaa/dev-tools
@openvaa/shared-config
@openvaa/supabase-types
```

**Assertion:** executed count is exactly 12 ✅; the sorted unwired list equals
`["@openvaa/dev-tools","@openvaa/shared-config","@openvaa/supabase-types"]` ✅.

**UNIT-02 discharge, in one sentence:** every one of the 15 workspaces in turbo's task
graph appears in exactly one of the two lists above and none is unaccounted for — the
executed 12 are precisely the workspaces carrying test files, and the residual 3 are
legitimately test-free (`dev-tools`, `shared-config`, `supabase-types` contain no
`.test.ts` / `.spec.ts` / `.test.tsx` file, which is why Check 1 reports 0 violations
rather than exempting them by name).

**Why the `<NONEXISTENT>` discriminator matters (research Pitfall 1):** `--dry=json`
lists *all* workspaces, wired or not. A naive diff of `tasks[].package` against the
test-file set is GREEN on an unwired tree — a fake guard of exactly the class this
milestone exists to remove. `141-NEGATIVE-CONTROL.md` Row 3 recorded the naive variant
passing on the unwired tree (7 executed / 8 unwired) and Row 6 recorded the census
transition 7/8 → 12/3 with the naive variant **unmoved** and the discriminating variant
going RED → GREEN. This gate re-derives 12/3 from a fresh payload on the shipped tree.

**VERDICT: PASS.**

---

## Gate 3 — guard standalone

**Command (verbatim):**

```
node scripts/assert-unit-test-coverage.mjs
```

**Exit code:** **0**.

**Summary line (verbatim, the guard's only output on success):**

```
Unit-test coverage guard (phase 141: UNIT-04, UNIT-02) — Check 1 (declared coverage): 0 violation(s); Check 2 (turbo execution): 0 violation(s), 12 workspace(s) executed, 3 unwired. Scanned 15 workspace(s) under packages, apps; 0 non-workspace director(ies) skipped. Total: 0 violation(s).
```

Counts extracted: Check 1 violations **0**; Check 2 violations **0**; executed **12**;
unwired **3**; workspaces scanned **15** under roots `packages, apps` (D-16);
non-workspace directories skipped **0**.

The skipped count is 0 and is reported anyway, deliberately: a non-zero value would mean
a directory under `packages/` or `apps/` carries no `package.json` and was passed over,
which is exactly the shape a coverage hole hides in. Reporting it as 0 is a measurement,
not a silence.

**VERDICT: PASS.**

---

## Gate 4 — lint

**Command (verbatim):**

```
yarn lint:check
```

**Exit code:** **0**. Output tail: `✖ 2 problems (0 errors, 2 warnings)` — both
warnings pre-existing and in `tests/` (`playwright/prefer-to-have-length` at
`:223:94`; an unused `eslint-disable` in `tests/tests/support/mockOidcIssuerEntry.ts:33`).
Zero errors; the command's contract is errors, so exit 0 is correct.

**What this gate explicitly does NOT cover — recorded so a clean result is not misread:**

`yarn lint:check` expands to
`turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests`.
None of those three reaches `scripts/assert-unit-test-coverage.mjs`:

1. `turbo run lint` runs each **workspace's** `lint` script. `scripts/` is at the repo
   root and is not a workspace, so no workspace `lint` task sees it.
2. The second clause lints `tests` only.
3. `typecheck:tests` is `tsc -p tests/tsconfig.json`.

There is **no root `lint` script**. Nor does lint-staged catch it: `.lintstagedrc.json:2`
declares the glob `*.{html,js,jsx,cjs,mjssvelte,ts,tsx,cts,mts,xml,yaml,yml}` — the token
**`mjssvelte`** is a missing comma between `mjs` and `svelte`, so **neither `.mjs` nor
`.svelte`** is inside any lint-staged glob. A green Gate 4 is therefore not evidence that
the new guard script is lint-clean; it is evidence that nothing regressed elsewhere.

**What does cover it:** `yarn format` (`prettier --write .`), which has no such glob hole.
Verified directly at this HEAD:

```
npx prettier --check scripts/assert-unit-test-coverage.mjs
→ All matched files use Prettier code style!   (exit 0)
```

`yarn format:check` as a whole is **failing at this HEAD for reasons predating this
phase** — two files unrelated to Phase 141 (`packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts`
and `tests/README.md`) were committed in a state the current prettier config does not
produce. Recorded in `deferred-items.md`; **not** a Phase 141 regression and deliberately
not fixed here (scope boundary). The targeted `--check` above is what discharges the new
file.

**VERDICT: PASS** (with the coverage caveat recorded rather than assumed).

---

## Gate 5 — UNIT-03 measure-before-wire ordering, re-derived from the final history

**Oracle: ancestry, not timestamp.** Committer and author dates are attacker- and
rebase-mutable and carry no ordering guarantee across a rebase, an amend or a merge; the
commit DAG does. Every pair below is asserted with `git merge-base --is-ancestor`, and
each is additionally checked for **distinctness** — a commit is its own ancestor, so
`--is-ancestor` alone would be satisfied by a record and a wiring that were the same
commit, which is precisely the "wired and measured in one breath" shape UNIT-03 forbids.

**Record commit resolution — both readings, because the record was amended.**
`141-MEASUREMENT.md` was added by `6c10d63d0` and amended by `0ab014b30` (the six-file CI
inventory that retired assumption A2). A `git log --diff-filter=A` oracle resolves the
record to `6c10d63d0`; a `git log -1` oracle resolves it to `0ab014b30`. The property is
asserted under **both** readings so the verdict does not depend on which oracle a later
reader picks.

**Wiring commits (one per `packages/*/package.json`, resolved by `git log -1 --`):**

| Package | Wiring commit | Subject |
|---|---|---|
| `@openvaa/argument-condensation` | `5a55733aa` | `feat(141-02): rename test to test:unit in the three Experimental packages` |
| `@openvaa/core` | `38593d4f0` | `feat(141-02): wire @openvaa/core test:unit and prove the exit-code path` |
| `@openvaa/llm` | `5a55733aa` | (same commit as above) |
| `@openvaa/matching` | `2c1838a22` | `feat(141-02): wire @openvaa/matching test:unit and complete UNIT-01's catch half` |
| `@openvaa/question-info` | `5a55733aa` | (same commit as above) |

**Reading A — record = `6c10d63d0` (the adding commit), lexicographic package order:**

| # | Package | REC | WIRE | `--is-ancestor` | REC ≠ WIRE |
|---|---|---|---|---|---|
| 1 | `argument-condensation` | `6c10d63d0` | `5a55733aa` | exit 0 ✅ | yes ✅ |
| 2 | `core` | `6c10d63d0` | `38593d4f0` | exit 0 ✅ | yes ✅ |
| 3 | `llm` | `6c10d63d0` | `5a55733aa` | exit 0 ✅ | yes ✅ |
| 4 | `matching` | `6c10d63d0` | `2c1838a22` | exit 0 ✅ | yes ✅ |
| 5 | `question-info` | `6c10d63d0` | `5a55733aa` | exit 0 ✅ | yes ✅ |

**Reading B — record = `0ab014b30` (the amendment), same order:**

| # | Package | REC | WIRE | `--is-ancestor` | REC ≠ WIRE |
|---|---|---|---|---|---|
| 1 | `argument-condensation` | `0ab014b30` | `5a55733aa` | exit 0 ✅ | yes ✅ |
| 2 | `core` | `0ab014b30` | `38593d4f0` | exit 0 ✅ | yes ✅ |
| 3 | `llm` | `0ab014b30` | `5a55733aa` | exit 0 ✅ | yes ✅ |
| 4 | `matching` | `0ab014b30` | `2c1838a22` | exit 0 ✅ | yes ✅ |
| 5 | `question-info` | `0ab014b30` | `5a55733aa` | exit 0 ✅ | yes ✅ |

**10 pairs, 10 exit-0 ancestries, 10 distinct hash pairs.** The record predates every
wiring commit in the commit graph under either resolution of "the record commit".

**VERDICT: PASS.**

---

## Gate 6 — evidence completeness (both halves, per requirement)

The milestone's standing acceptance rule (`REQUIREMENTS.md:9-12`) is that a guard
observed only green is indistinguishable from a guard that cannot fail. Each requirement
below must therefore carry **two** recorded runs. A requirement with one half is recorded
FAIL and blocks this gate.

| Requirement | BLINDNESS half — ledger heading | CATCH half — ledger heading | Verdict |
|---|---|---|---|
| UNIT-01 | `141-NEGATIVE-CONTROL.md` → `## Row 1 — UNIT-01 / **BLINDNESS**` | `## Row 4 — UNIT-01 / **CATCH**, part 1 — @openvaa/core alone (tracer)` + `## Row 5 — UNIT-01 / **CATCH**, part 2 — both packages planted simultaneously` | **PASS** |
| UNIT-02 | `141-NEGATIVE-CONTROL.md` → `## Row 3 — UNIT-02 / **DISCRIMINATION PROOF** (naive vs. discriminating)` | `## Row 6 — UNIT-02 / **CATCH**, part 1 — the census transition` + `## Row 8 — UNIT-02 / **CATCH**, part 2 — the shipped Check 2, three injections` | **PASS** |
| UNIT-04 | `141-NEGATIVE-CONTROL.md` → `## Row 2 — UNIT-04 / **BLINDNESS**` | `## Row 7 — UNIT-04 / **CATCH** — the shipped guard, four injections` | **PASS** |
| ASSERT-10 | `141-ASSERT10-LEDGER.md` → `## Row A — clean baseline (blindness half)` + `## Row E — the legitimate exclusion (blindness half; the decisive row)` | `## Row B — equality collision (catch half)`, `## Row C — containment overlap, not equality (catch half)`, `## Row D — unparsed-declaration completeness (catch half)`, `## Row F — enumeration scope: outside setup/ (catch half)` | **PASS** |

**UNIT-03 carries no negative control by construction** and is therefore not listed above:
it is a constraint on plan *shape* (D-14), and its oracle is Gate 5's ancestry property,
not an injected regression. Its evidence is `141-MEASUREMENT.md` (the per-package
pass/fail record) plus Gate 5.

**ASSERT-10 ledger self-consistency — rows A and I must record the same suite total.**
Row A (clean baseline, before any injection) and Row I (clean revert, after all nine
rows) both record, verbatim:

```
Total: 143 tests in 94 files
```

Identical ✅. An unreverted scratch teardown would either have thrown (rows B/C/D/F/G1)
or, in the exit-0 shapes, have shifted this file count. Row I additionally recorded
`git status --porcelain -- tests` empty, `git diff --exit-code -- tests/playwright.config.ts`
exit 0, and `find tests -name 'zz-scratch*'` with no matches — the `find` deliberately
broader than the `git status` check, which would miss a staged scratch file.

**Independently re-confirmed at this HEAD:** `find tests -name '*.teardown.ts' | wc -l`
→ **28** files, of which 27 declare a prefix (the 28th is the legitimate prefix-free
exclusion Row E exercised). No `zz-scratch*` file exists anywhere under `tests/`.

**Ledger status tables, quoted from the sources rather than re-asserted here:**
`141-NEGATIVE-CONTROL.md` § Ledger status marks all three UNIT pairs `— complete`;
`141-ASSERT10-LEDGER.md` § Requirement discharge maps all eleven elements of the
ASSERT-10 criterion to rows, "nine rows, nine runs".

**VERDICT: PASS — 4 of 4 control-bearing requirements have both halves recorded; 0 have
a single half.**

---

## Gate 7 — tree cleanliness

**Commands and results (verbatim):**

```
git status --porcelain                                   → (empty)          exit 0
git diff --exit-code -- tests/playwright.config.ts turbo.json               exit 0
git diff --exit-code bbe0b231f HEAD -- tests/playwright.config.ts turbo.json exit 0
```

The third command is the one that actually discharges the D-15 read-only constraint: the
first two only prove the working tree matches HEAD, which a committed modification would
also satisfy. Diffing against the **pre-phase** commit `bbe0b231f` proves the shipped
blobs are byte-identical to what the phase inherited:

| File | blob @ `bbe0b231f` | blob @ HEAD | identical |
|---|---|---|---|
| `tests/playwright.config.ts` | `cecf4be23a49053cacb62413e90eb45b00dfba2e` | `cecf4be23a49053cacb62413e90eb45b00dfba2e` | ✅ |
| `turbo.json` | `e40ea7b153c1d5f7f99e4241d1936be4f1383d62` | `e40ea7b153c1d5f7f99e4241d1936be4f1383d62` | ✅ |

**Scratch-artefact absence (each checked explicitly, not inferred from a clean status):**

| Artefact | Check | Result |
|---|---|---|
| `packages/zz-scratch` | `test ! -e` | absent ✅ |
| `tools/zz-scratch` | `test ! -e` | absent ✅ |
| any `zz-plant*` (the UNIT-01 planted assertions) | `find . -name 'zz-plant*' -not -path './node_modules/*' -not -path './.git/*'` | 0 matches ✅ |
| any `zz-scratch*` anywhere (scratch teardowns, fixtures) | `find . -name 'zz-scratch*' -not -path './node_modules/*' -not -path './.git/*'` | 0 matches ✅ |

`find` is used rather than `git status` alone because `git status` would miss a scratch
file that had been staged, and would miss nothing that `find` misses.

**Also verified absent by Gates 2 and 3 rather than by a path check:** a third element in
`WORKSPACE_ROOTS` (the guard reports roots `packages, apps` — exactly D-16's two), a
removed `turbo.json` `test:unit` task (blob identical, above), and a removed
`packages/llm` `test:unit` key (`llm` appears in Gate 2's executed list).

**VERDICT: PASS.**

---

## Gate 8 — full E2E suite under the cardinal rule

**Why an E2E gate belongs to a phase that changed no test and no application code.**
Plan 04 injected six scratch `*.teardown.ts` files into `tests/tests/setup/` — the very
directory `tests/playwright.config.ts:138-240` enumerates at **config load**. Every
`playwright test` and every `--list` invocation reads that path. `--list` proves the
config still *loads*; it does not prove the suite still *passes*, and it does not prove
that no injected fixture survived in a form that changes what the suite sees. Only a full
run does. That is what this gate is for.

**Environment brought up for this run (in order, each recorded because the cardinal rule
makes a wrong environment indistinguishable from a product defect):**

```
yarn db:reset          → exit 0   (clean database; migrations + seed.sql re-applied,
                                   storage buckets private-assets / public-assets recreated)
lsof -nP -iTCP:5173 -sTCP:LISTEN  → no listener BEFORE start (port genuinely free)
yarn dev               → ONE fresh dev server, VITE v6.4.1 ready in 2300 ms, Local: http://localhost:5173/
lsof -nP -iTCP:5173 -sTCP:LISTEN  → exactly one listener AFTER start: node pid 46866, [::1]:5173
```

Supabase was up and healthy throughout (13 `*_openvaa-local` containers). No stale server
was holding the port at any point — checked before start, not assumed, because a
shadow-bind on `*:5173` is precisely the failure the Phase-137 preflight exists to catch
and `strictPort` does **not** close.

**Command (verbatim):**

```
yarn test:e2e
```

which expands to
`playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe`.

**Port:** 5173 (the default; `FRONTEND_PORT` was not overridden for this run).

**Preflight confirmation line (verbatim, from the run's own global setup — not asserted
separately):**

```
E2E PREFLIGHT OK /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend (verified against /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd)
```

The served application echoed back **this** working tree's absolute path via Vite's
`/@fs` endpoint. The page under test came from this checkout.

**Counts — taken from the HTML report's embedded `report.json`, not from the console
tail** (per the project-memory evidence rule established in Phase 140):

```json
{ "total": 135, "expected": 135, "unexpected": 0,
  "flaky": 0, "skipped": 0, "ok": true }
```

| Metric | Value |
|---|---|
| executed | **135** |
| passed (`expected`) | **135** |
| failed (`unexpected`) | **0** |
| flaky | **0** |
| skipped / did-not-run | **0** |
| exit code | **0** |
| wall clock | **628.331 s (10.5 m)**, `2026-08-18T18:31:23.260Z` → `2026-08-18T18:41:51.590Z` |
| files | 89 |

A per-test tally recomputed from `report.json`'s `files[].tests[].outcome` — rather than
trusting the pre-aggregated `stats` block — returns the same partition:
`{expected: 135, unexpected: 0, flaky: 0, skipped: 0, total: 135}`. Console tail agrees:
`135 passed (10.5m)`.

**`total == expected` with `skipped: 0` is what establishes 0 did-not-run.** In this
repository a test that did not run counts as a **failure**, not as a neutral outcome, so
a non-zero `skipped` — including a cascade skip from an upstream setup-project failure —
would have failed this gate exactly as a red test would. It is zero.

**Cardinal rule applied strictly.** The suite was run **once**. It was not re-run until
green, and nothing was annotated, retried or exempted — there is no known-flaky
allowance in this repository. Had the run been red, the diagnosis would have been
recorded here and treated as blocking; the space below would carry it. It does not,
because there was nothing to diagnose.

**Count reconciliation against the ASSERT-10 ledger (rows A and I).** The ledger's
`--list` total is `143 tests in 94 files`; this run executed 135 in 89. The difference is
the `--grep-invert @probe` filter the suite applies and `--list` does not. Measured at
this HEAD rather than inferred:

```
npx playwright test -c ./tests/playwright.config.ts --list                        → Total: 143 tests in 94 files
npx playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe --list → Total: 135 tests in 89 files
npx playwright test -c ./tests/playwright.config.ts ./tests --grep @probe --list  → Total:   8 tests in  5 files
```

135 + 8 = 143 ✅ and 89 + 5 = 94 ✅. The first of those three commands is also an
independent re-confirmation, on the tree this phase ships, of the exact figure rows A and
I recorded on plan 04's tree: the teardown-prefix guard still loads clean and the
enumeration still sees the same 94 files. No scratch fixture survived.

**Tree after the run:** `git status --porcelain` → **empty**. The suite's own teardowns
left no residue, and no gate artefact other than this document was written to the tree —
`tests/playwright-report/` is ignored by `tests/.gitignore:3` (`playwright*/`), so the
report is local evidence, not a committed file.

**What this gate does NOT discharge — stated explicitly so the green is not over-read:**

1. **CI-side behaviour of the new root `test:unit` wrapper.** This run proves the wrapper
   is correct on a developer Mac. It does not prove GitHub Actions invokes it, or that it
   behaves identically under the runner's environment. `141-MEASUREMENT.md` § CI
   invocation inventory establishes *statically* that the CI entry points route through
   the root script, but only a real CI run observes it. This is the same class of residual
   as Phase 137's open risk **T-137-11**, and lands on the same event: the branch's first
   PR to `main`.
2. **The visual-regression project.** It is not in this run and was never in scope: its
   baselines are container-pinned (`mcr.microsoft.com/playwright:v1.58.2-noble`,
   `--platform linux/amd64`, dev server `--host 0.0.0.0`) and the milestone rule forbids
   capturing or comparing them on a developer Mac. Phase 146 owns it.

**VERDICT: PASS — cardinal-clean. 135 executed / 135 passed / 0 failed / 0 flaky / 0
did-not-run.**

---

## Open items closed by this gate

Plan 04 deliberately surfaced two items rather than silently widening its own diff. Both
are closed here, and both are recorded as **deviations from this plan's declared
`files_modified`** (which named only `141-GATES.md` and `141-VALIDATION.md`).

**1. ASSERT-10's requirement checkbox never flipped.**
`gsd-tools query requirements.mark-complete ASSERT-10` had been returning `not_found`
because the traceability row's Status cell at `.planning/REQUIREMENTS.md:153` read
`Pending (folded in from Phase 140 follow-up F-140-01)` rather than a bare `Pending`.
The row-rewrite matcher missed and — correctly — rolled back rather than half-writing,
which is why the checkbox at `:63` also stayed unticked. Compare the working `UNIT-03`
row at `:132`, whose Status cell is bare.

*Resolution:* the Status cell was normalised to bare `Pending` first. Nothing was lost —
the provenance parenthetical it carried is already stated in full, and more precisely, in
the requirement bullet at `:63`. `requirements.mark-complete ASSERT-10` then reported
`updated: true`, `marked_complete: ["ASSERT-10"]`, with **both** surfaces applied
(`checkbox` and `traceability`) and `write_set_complete: true`. Verified on disk: `:63`
is now `- [x]` and `:153` reads `Complete`. Gate 6 above is the evidence that flipping it
is warranted.

**2. ROADMAP Phase 141 success criterion 5 asserted something the phase had disproved.**
`.planning/ROADMAP.md:445` closed with *"This closes the second half of the remedy Phase
140 recorded but did not build"* — false as written, and false when written. Phase 140
**did** build the guard, in `abe1fabb0`, hardened by `bdb759575` (IN-01) and `c15e444e8`
(IN-02). Leaving it would have propagated the same false premise into every later phase
that reads this criterion — the failure mode the milestone's re-verification lesson exists
to prevent.

*Resolution:* the sentence is replaced with the corrected account — Phase 140 built the
guard; what F-140-01 actually left outstanding was the negative-control evidence; Phase 141
supplies it in `141-ASSERT10-LEDGER.md` and edits no byte of the guard (D-15). The
superseded wording is quoted inside the correction rather than deleted, so a reader who
arrives via a search for the old phrase lands on the correction instead of on nothing.
This is the third record in this chain to be corrected — plan 04 fixed
`REQUIREMENTS.md:63`, `ROADMAP.md:387` (Phase 140's status paragraph) and
`140-VERIFICATION.md`; `ROADMAP.md:445` is the one it flagged and left.

## Code review checklist

`.agents/code-review-checklist.md` is **discharged, not skipped**. Discharging it requires
naming what was changed, so here is this phase's complete file set, derived from
`git diff --name-status bbe0b231f HEAD` rather than recalled:

**Source files changed (7 — the entire non-documentation footprint of Phase 141):**

| File | Change |
|---|---|
| `scripts/assert-unit-test-coverage.mjs` | **added** — the two-check guard (Check 1 declared coverage / UNIT-04, Check 2 turbo execution / UNIT-02) |
| `package.json` (root) | added key `assert:unit-coverage`; modified key `test:unit` to `yarn assert:unit-coverage && turbo run test:unit` |
| `packages/core/package.json` | added key `test:unit` |
| `packages/matching/package.json` | added key `test:unit` |
| `packages/llm/package.json` | key `test` renamed to `test:unit` |
| `packages/question-info/package.json` | key `test` renamed to `test:unit` |
| `packages/argument-condensation/package.json` | key `test` renamed to `test:unit` |

**Documentation changed:** the 18 files under
`.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/`, plus
`.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`,
`.planning/WINDOWS.md`, and `.planning/phases/140-.../140-VERIFICATION.md` (the plan-04
provenance correction). No file outside these two sets was touched.

**The checklist's three conditional sections apply to none of them:**

| Section | Applies when changes touch | This phase's file set | Verdict |
|---|---|---|---|
| **Supabase Backend** | `apps/supabase/` or database-related code | no file under `apps/supabase/`; no migration, RLS policy, `SECURITY DEFINER` function, trigger or pgTAP test changed | **inapplicable** |
| **Supabase Adapter** | `apps/frontend/src/lib/api/adapters/supabase/` | no file under `apps/frontend/` at all | **inapplicable** |
| **Edge Functions** | `apps/supabase/supabase/functions/` | no Edge Function changed | **inapplicable** |

Of the checklist's general items, the ones with teeth here were exercised by the gates
above rather than by inspection: *"Troubleshoot any failing checks"* → Gates 1, 3, 4, 8;
*"repo documentation markdown files are updated if the changes touch upon those"* →
plan 04's three-record provenance correction and this document; *"avoid `any`"* → the
guard script is `.mjs`, untyped by construction, and adds no TypeScript; *"commit history
is clean and linear"* → per-task atomic commits with `{type}(141-NN): …` subjects.
The a11y, Svelte-component, tracking-event and WCAG items have no surface in a change set
consisting of one Node script and six `package.json` script keys.

## Follow-ups surfaced, not fixed

Five items this phase found and deliberately left. Each is recorded here so it is
findable without re-deriving it, and none is a defect introduced by Phase 141.

1. **The `mjssvelte` token in `.lintstagedrc.json:2`.** The glob reads
   `*.{html,js,jsx,cjs,mjssvelte,ts,tsx,cts,mts,xml,yaml,yml}` — a missing comma fuses
   `mjs` and `svelte` into one token that matches nothing, so **`.mjs` and `.svelte`
   files are outside every lint-staged glob**. Surfaced by Gate 4 while establishing what
   a clean `lint:check` does and does not cover. Fixing it is a one-character edit but
   would newly subject every `.svelte` file in the repo to the staged hooks, which is a
   change of blast radius this phase has no mandate for.
2. **The deprecated root `vitest.workspace.ts`.** It contains
   `export default ['packages/**/vitest.config.ts'];` and is deprecated in Vitest 3 in
   favour of the `test.projects` field in a root config. Deliberately **not** used as a
   wiring surface by this phase (`141-MEASUREMENT.md` § `vitest.workspace.ts` is
   deliberately NOT a wiring surface) — wiring through a deprecated mechanism would have
   made the guard's invariant depend on a file scheduled for removal. Migration is its
   own change.
3. **`--passWithNoTests` harmonisation, deferred by D-13.** Five already-wired packages
   (`app-shared`, `data`, `dev-seed`, `filters`, `docs`) carry
   `vitest run --passWithNoTests`, so a package whose tests all vanish still reports
   green — the same blindness class as ASSERT-02/03/05/06. Offered during discussion and
   declined as out of scope; the five were left byte-untouched by this phase.
4. **The shared teardown-prefix registry, deferred by D-06.** Moving all 27 `const PREFIX`
   declarations into one exported module would make collision structurally impossible
   rather than merely detected. Rejected because it edits 27 files the scout showed need
   no edit, and this phase's job was to guard the invariant, not restructure the
   fixtures. Revisit if the guard ever fires in anger.
5. **`.spec.tsx` sits outside the guard's suffix constant.**
   `scripts/assert-unit-test-coverage.mjs:87` declares
   `TEST_FILE_SUFFIXES = ['.test.ts', '.spec.ts', '.test.tsx']`. A workspace whose only
   test file were named `*.spec.tsx` would read as test-free and be silently exempted
   from Check 1. **No such file exists in the repo today** (`find . -name '*.spec.tsx'`
   → 0 matches outside `node_modules`), so the hole is latent, not live; it is recorded
   because the first `.spec.tsx` anyone writes will open it without any signal.

Additionally carried from `deferred-items.md` and repeated here because it is the one
thing at this HEAD that a reader may mistake for a Phase 141 regression: **`yarn
format:check` already fails at HEAD** on `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts`
and `tests/README.md`, both committed pre-phase in a state the current prettier config
does not produce. Pre-existing; a standalone `yarn format` sweep is its home.

## Assumptions carried forward

Two research assumptions this phase relied on and could not eliminate. Both are recorded
with the measurement that bounds the risk, not with reassurance.

- **A4 — turbo's non-existent-script sentinel.** Check 2 and Gate 2 both discriminate on
  `command === '<NONEXISTENT>'` in `turbo run test:unit --dry=json`. That sentinel string
  is **not a documented API** and was observed at **turbo 2.8.17 only**. If a future turbo
  renames or drops it, every task would silently classify as *executed* and the check
  would go permanently green — the exact failure mode it exists to prevent.
  **Mitigation, already shipped:** the guard raises rather than passes when the payload
  shape stops making sense (`scripts/assert-unit-test-coverage.mjs:384-386` names the
  sentinel and instructs updating `TURBO_NONEXISTENT` before trusting a green), and Gate 2
  asserts *exact counts* (12 and 3) plus the exact unwired membership rather than merely
  "no violations" — a sentinel rename would move the census to 15/0 and fail the count
  assertion loudly.
- **A1 — the Vitest workspace-file deprecation timeline.** `vitest.workspace.ts` is
  deprecated in Vitest 3 with no announced removal version pinned by this phase. The
  assumption carried forward is that it keeps working for the life of this milestone.
  **Bounded by:** this phase wires nothing through it (follow-up 2 above), so its removal
  would not break the `test:unit` invariant — it would only orphan a file already marked
  do-not-use.

Both assumptions were **not** discharged by this gate and are stated so a later reader
does not mistake eight green gates for their resolution.
