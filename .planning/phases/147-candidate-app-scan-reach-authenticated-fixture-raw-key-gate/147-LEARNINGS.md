---
phase: 147
phase_name: 'candidate-app-scan-reach-authenticated-fixture-raw-key-gate'
project: 'OpenVAA Framework Evolution'
generated: '2026-08-27'
counts:
  decisions: 12
  lessons: 12
  patterns: 12
  surprises: 11
missing_artifacts:
  - 'UAT.md'
---

# Phase 147 Learnings: Candidate-App Scan Reach — Blocking Axe + Raw-Key Gate

## Decisions

### One shared scan core, not two parallel specs

`tests/tests/utils/axeScan.ts` became the sole home of `WCAG_TAGS`, `assertAxeGates`, `awaitAnimationsSettled`, `assertDarkThemeApplied`, the route-entry types and `assertAxeScan`. Both `a11y-smoke.spec.ts` (voter) and `candidate-a11y.spec.ts` (candidate) import it; neither declares a gate of its own.

**Rationale:** Criterion 6 asks that candidate strictness be "identical" to voter strictness. Two tables that agree today can drift tomorrow; one gate function that takes no per-surface relaxation parameter makes parity a structural property of the code rather than a claim in a docblock.
**Source:** 147-03-SUMMARY.md, confirmed independently in 147-VERIFICATION.md and 147-REVIEW.md

### Decision (B) implemented by changing the reporting, not the detection

`collectRawI18nKeyFindings` was extracted verbatim from `assertNoRawI18nKeys`; the throwing wrapper was kept and now delegates. The shared scan body calls the collector and reports via `expect.soft`, so `assertAxeGates` always runs afterwards.

**Rationale:** The ordering doc said to make the assertion return its findings; the plan's prohibitions said the function must not change, because `147-04` re-runs `147-01`'s injections against it. The prohibition's stated reason was entirely about _detection_, so the reading that satisfies both is "change the reporting, not the detection." A byte-literal reading would have forced a duplicated finding loop — the exact drift the phase exists to eliminate.
**Source:** 147-03-SUMMARY.md § Decisions Made 1

### Wiring W3 selected by a rule written before the deciding measurement

`147-ORDERING.md` carried an if-X-then-Y table naming the wiring for each possible `ORD-PERTURB` outcome, written and committed _before_ the run, and retained verbatim afterwards.

**Rationale:** Makes the selection auditable as prospective rather than fitted to the result. W3 (perm head names the scan directly) was taken over W2 (perm head anchored on `candidate-journey`, which only incidentally shares the scan's phase); W2 is recorded as the one rejection reasonable to overturn.
**Source:** 147-02-SUMMARY.md, 147-ORDERING.md § Decision (A)

### Both verdicts in one test body, at a measured cost for the alternative

Rather than reporting the raw-key verdict as its own Playwright test, both verdicts are computed and reported inside one scan body.

**Rationale:** The separate-test alternative was priced at ≤ +138 s (+21 % suite wall clock), derived from `BASE-GREEN`'s own per-test durations split by fixture kind (a11y-smoke 130.2 s / 16 tests = 14 axe scans at 116.0 s + 2 navigation at 14.2 s). Flagged explicitly as satisfying criterion 5's _purpose_ but not the scout's literal "reported as its own test" — the one place in the phase where the evidence does not force the answer.
**Source:** 147-02-SUMMARY.md § Decision (B); re-surfaced in 147-03-SUMMARY.md

### Injections deleted from the RUNTIME catalogue only

The two i18n keys were removed from `apps/frontend/messages/en/` but never from the type-gen source or the generated key union.

**Rationale:** Deleting them from both would have removed them from the scanner's three-source key union at the same instant they began rendering raw — the scan would have gone green on the very defect it exists to catch, and the blindness claim would have been vacuous rather than measured.
**Source:** 147-01-SUMMARY.md § Decisions Made

### `image-alt` chosen as the axe injection

A visible `<img>` with no `alt` in the candidate `(protected)` shared layout.

**Rationale:** Real under the gate's own tag set (`wcag2a`), present on all six leaf routes via the shared layout, and provably outside every container the suite's two existing image-role matchers scope to — so no existing assertion could accidentally catch it.
**Source:** 147-01-SUMMARY.md § Decisions Made

### A phase-local run wrapper instead of `tests/scripts/e2e-run.sh`

`tests/e2e-runs/147/` (gitignored) carries `devserver.sh`, `run-suite.sh`, `summarize.mjs`, `identity-probe.mts`; the wrapper's start-gate calls the suite's own `assertServedApp` rather than reimplementing it.

**Rationale:** The repo wrapper spawns and owns its own dev server and refuses to adopt a foreign listener; two owners of port 5173 would void the register's dev-server audit trail. Its proven Playwright invocation was reused verbatim. Reusing `assertServedApp` means helper and preflight cannot drift.
**Source:** 147-01-SUMMARY.md § Decisions Made

### `trace: 'on'` → `retain-on-failure`

Changed in `tests/playwright.config.ts` as an unblocking prerequisite, outside `147-02`'s stated file list.

**Rationale:** `trace: 'on'` retained a trace for every _passing_ test — 260–340 MB per full-suite run, and the same bytes again in every archived run because `e2e-run.sh` writes its HTML report into the run directory. This was one half of the disk pressure that voided two prior `ORD-PERTURB` attempts. Verified live: `playwright-results` sat at 14 MB where it would have held ~280 MB.
**Source:** 147-02-SUMMARY.md

### Both the new project _and_ its perm-anchor dependency entry gated on `PLAYWRIGHT_NO_A11Y`

The ordering checklist was silent on this interaction, and both silent readings are wrong: an unconditional project silently runs 14 a11y scans under a documented opt-out; a gated project with an unconditional anchor entry makes `PLAYWRIGHT_NO_A11Y=1` fail at config _load_.

**Rationale:** Resolved by applying the config file's own existing opt-out convention to both, introducing no new mechanism, and recording the gap in the checklist rather than deciding it quietly.
**Source:** 147-03-SUMMARY.md § Decisions Made 2

### Four full-suite runs rather than three

`E2E1-SUITE` was taken into its own run directory, and `DET-RUNS` is three _further_ consecutive runs, each preceded by `yarn db:reset`.

**Rationale:** Taking `E2E1-SUITE` as `det01` would have satisfied a looser reading and saved ~11 min, but the cardinal-rule gate and the determinism gate would then share a single run's luck.
**Source:** 147-04-SUMMARY.md § Decisions Made 2

### `AX1-NEW`'s unreproducible blob hash recorded rather than smoothed over

The register's own permitted alternative (record your own injected-state hash) was taken, and instrument identity carried instead by four substitute equalities: equal clean blob hash, byte-identical element line, identical compiled location `191:2` read from the served `/@fs` module, and axe's `"html"` field equal to the `AX1-OLD` trace DOM node.

**Rationale:** `147-01` committed zero product bytes by design, so the blob is not in the object database; the hash covers a 6-line comment recorded nowhere; and the Svelte compiler strips markup comments, so it is not in the traces either. Flagged `human_judgment: true` rather than presented as a machine check.
**Source:** 147-04-SUMMARY.md § Decisions Made 1

### REAL-04 retired as a WORDING correction that refuses to look like a recount

The correction leads with "nothing was recomputed, because there was never anything to recompute," and supplies the decomposition (`candidateApp` 161 + `adminApp` 121 + voter/shared 316 = 598) purely so the claim is checkable.

**Rationale:** `loadCatalogKeys()` already flattened every `*.json` in each source directory, so the union has been application-wide since it was written. Writing a correction that _looked_ like work — new totals, a recount table — would have replaced one false record with another, and a later phase would have inherited the belief that a recount had happened. The record was also not condemned wholesale: REAL-04's own boundary note scoped the gap to _surface reach_ and was accurate; only the later restatement is retired.
**Source:** 147-05-SUMMARY.md § Decisions Made 1–2

---

## Lessons

### A green gate on an already-green surface is the least informative possible result

The scout measured the candidate surfaces at 0 axe violations across 42 scans _before a byte moved_. Standing the gate up and observing a green proves nothing; only `AX1-NEW` — the identical defect, in the identical file at the identical compiled location, missed by a 135/0 suite and now failing 14 of 14 scans — separates a live gate from a vacuous one.

**Context:** This is why the phase is built as a register of blind/catch pairs rather than as an implementation with a passing suite, and why `CSCAN-02` is ticked against `AX1-NEW` read against `AX1-OLD` — "the flip is the evidence and the green is not."
**Source:** 147-04-SUMMARY.md, 147-05-SUMMARY.md, 147-VERIFICATION.md

### Plan-supplied `<verify>` scripts measure a proxy for the claim — four instances across three plans

`147-03`'s title filter `/candidate-a11y|cand-/` over-counted by matching an unrelated perm test. `147-04`'s two scripts matched the corpus summary table instead of the register row, and counted every `TBD-147` string including the six prose sentences defining the placeholder. `147-05`'s script asserted a decomposition with bare `/161/`, `/121/`, `/316/` substring tests that occur incidentally throughout a 265-line file — it would have passed _without the decomposition being present_.

**Context:** Named as a defect class only at `147-05`, because each earlier plan recorded its instance as a per-plan deviation and nothing aggregated them. Root cause: scripts authored against a human summary of the artefact rather than the addressing convention the artefact itself defines, and never executed against a known-correct tree. Filed as `2026-08-27-147-plan-supplied-verify-scripts-measure-a-proxy.md`.
**Source:** 147-05-SUMMARY.md § Checkpoint; 147-03-SUMMARY.md and 147-04-SUMMARY.md deviations

### A single-trace probe produces a false zero

The first check for the injected `AX1-OLD` element searched only the _largest_ trace and returned 0 occurrences — which would have meant the injection never rendered and the whole measurement was vacuous. The largest trace belongs to a `perm-*` test that never visits a candidate route. Searching all 135 traces found 29 occurrences across 13 traces.

**Context:** Recorded in the register as a disclosed near-miss rather than deleted.
**Source:** 147-01-SUMMARY.md, deviation 3

### A backgrounded dev server inherits the caller's stdout pipe and hangs piped callers

`devserver.sh restart | tail` never returned: the backgrounded server held the pipe open, so `tail` waited for an EOF that would only arrive when the server died. The restart itself had succeeded. Fixed by redirecting the spawn subshell's own stdout/stderr to the log and adding `</dev/null`.

**Context:** With eight restarts in `147-01` alone, this would have recurred constantly and each time looked like a failed restart.
**Source:** 147-01-SUMMARY.md, deviation 2

### The throwing raw-key assertion suppressed the axe verdict on the same surface

An axe failure could not hide a raw-key failure (ordering), but a raw-key failure _did_ suppress the axe result. That asymmetry is the actual defect criterion 5 gestures at, and it is what Decision (B) removes.

**Context:** Discovered while reading the shared scan body during `147-02`'s ordering work, before any candidate spec existed.
**Source:** 147-02-SUMMARY.md § Findings worth carrying forward

### `a11y-smoke` had no `testMatch`, so a new spec in its directory would have run unauthenticated _and green_

Without an explicit `testMatch`, adding a candidate spec under `tests/specs/a11y/` makes `a11y-smoke` collect it and run it without the stored session — every route 307s to login and the scan reports a clean zero about a login page. "Silently wrong AND green."

**Context:** Caught in `147-02`, closed by the explicit `testMatch` in `147-03`, and pinned by guard G2 in the validation audit so it cannot regress.
**Source:** 147-02-SUMMARY.md; 147-VALIDATION.md gap table

### A promise that an injection is "recoverable from this plan's commit range" is unkeepable when the plan commits zero product bytes

`147-01`'s register made exactly that promise about `AX1-OLD`. Three independent checks say it is not recoverable: the blob is not in the object database, the hash covers a comment whose text is recorded nowhere, and the Svelte compiler strips markup comments so it is absent from the traces too.

**Context:** A record-quality defect, not a measurement one. Filed as `2026-08-27-147-register-convention-record-injection-text-verbatim.md`: injection text must be written verbatim into the register at the time it is applied.
**Source:** 147-04-SUMMARY.md; 147-05-SUMMARY.md § Residue

### Any detail table with backticked IDs in its left column inflates the register's own row count

`147-04`'s revert table pushed the anchored count from 13 to 15; `147-05`'s per-gate HEAD table pushed it from 13 to 22. Both fixed by prefixing the left column with `row `, the precaution `147-01` had already documented.

**Context:** The same trap sprung twice after being documented once — the convention needs to be stated _in the table template_, not only in prose.
**Source:** 147-04-SUMMARY.md deviation 3; 147-05-SUMMARY.md deviation 4

### A requirement's own wording can be falsified by the phase's measurement

`CSCAN-03` reads "the two named blind sites … now fail." They do not: the scan fails, the two sites still pass, and both remain blind _by design_ — because the criterion itself says patching them is not the fix.

**Context:** The tick strikes the false clause inline (`~~…~~`, so the original stays recoverable) with the falsification attached at the clause, rather than silently satisfying the sentence.
**Source:** 147-05-SUMMARY.md; verified in 147-VERIFICATION.md

### Placement is part of a correction

The caveat correcting `CSCAN-03` was emphatic and correct but sat ten lines below the clause it corrected. `.planning/REQUIREMENTS.md` is live and forward-read, skimmed by its first clause, so the false clause would have been the first and possibly only thing a later phase read.

**Context:** The operator's single correction at the `checkpoint:human-verify` gate. The archive convention (preserve original wording, correct beneath it) is right for `v2.14-REQUIREMENTS.md` and wrong for a live brief — the convention depends on how the document is read.
**Source:** 147-05-SUMMARY.md § Checkpoint

### Reach and theme proofs must run inside `settle`, after `reach` and before the scan

`assertDarkThemeApplied` reads persistent header chrome with `querySelector`; immediately after `goto` that chrome is not in the document yet, so an early call compares against `null`. And for `cand-question` / `cand-nav-menu` the scan target is not the URL that was opened.

**Context:** Composing both proofs into the tail of `settle` fixes both and keeps them before the scan, so a lost session fails by name instead of reporting a confident zero about a login form.
**Source:** 147-03-SUMMARY.md § Decisions Made 3

### A dedicated record-correction pass still missed a docblock describing the very mechanism it changed

Commit `a882f24b5` corrected five in-code records in `a11y-smoke.spec.ts` and its siblings under a message claiming "the tree does not carry a comment that lies" — and left line 65 naming `assertNoRawI18nKeys` (the old throwing, short-circuiting entry point) as the raw-key gate.

**Context:** Found by the code review as WR-01 and fixed in `761a97671`. The review's second finding (WR-02, a login-URL regex unanchored against the query string — a false-_fail_ risk) was filed as a todo rather than fixed.
**Source:** 147-REVIEW.md

---

## Patterns

### The blind-half / catch-half negative-control register

A 13-row register with every row ID pre-written before any measurement, each gate paired with an injected-defect control: `*-OLD` (defect live, suite blind) and `*-NEW` (same defect, gate catches). Completeness arithmetic and an empty Residue section declared up front.

**When to use:** Any phase whose deliverable is a gate, guard, or check — especially where the surface under test is _already green_, so a passing suite is not evidence.
**Source:** 147-01-SUMMARY.md; 147-NEGATIVE-CONTROL.md

### Injection-took proof before every verdict

Read the compiled Paraglide export count before and after each catalogue deletion (598 → 597, with the specific mangled export gone), and restart the dev server between injection and verdict.

**When to use:** Any negative control where the "defect" is a source edit — an unread verdict about an injection that never took is worse than no measurement.
**Source:** 147-01-SUMMARY.md § patterns-established

### Two-proof revert

`git diff --exit-code` at 0 **and** `git hash-object` equality against pre-recorded clean hashes — both, never one. Plus a post-revert confirmation _run_ for defects that alter behaviour.

**When to use:** Whenever a measurement deliberately breaks the product in the working tree. Six injections, six reverts in this phase, each proven twice; 15/15 paths byte-identical across the full phase range.
**Source:** 147-01-SUMMARY.md, 147-04-SUMMARY.md

### Pre-registered decision rule

Write the if-X-then-Y table _before_ the deciding measurement, commit it, and retain it verbatim afterwards.

**When to use:** When a plan's choice depends on a measurement it is about to take. It converts "we chose W3 and here is why" into "the rule chose W3, and here is the rule as it stood before we knew."
**Source:** 147-02-SUMMARY.md § patterns-established

### Proof composed at the runner, not declared per entry

`toScanEntry` composes `assertCandidateReach` onto every route entry's `settle`; entries declare `reach`, never `settle`. A scan entry therefore _cannot_ be declared without its reach proof.

**When to use:** When every item in a table must carry a property and you want the impossibility of omission rather than a review checklist.
**Source:** 147-03-SUMMARY.md § patterns-established

### Two verdicts per surface, neither short-circuiting the other

Compute both verdicts, report the first with `expect.soft` and the second with hard gates, so a finding in one never suppresses the other's result.

**When to use:** Any check that runs two independent detectors over the same captured state. Pinned as a standing invariant by validation guard G4, which fails _closed_ if the four expected calls are not found.
**Source:** 147-03-SUMMARY.md, 147-VALIDATION.md

### Simultaneity by construction, not by argument

Two opposite verdicts taken from ONE Playwright invocation over two projects — the scan fails naming the key while the named matcher passes in the same run.

**When to use:** When a claim's whole content is that two things hold _at the same time_. Two separate runs would have to be argued comparable; one invocation makes simultaneity a property of the run. Required making `run-suite.sh --project` repeatable.
**Source:** 147-04-SUMMARY.md § patterns-established

### Guards proven to catch, not merely to pass

Every guard added by the validation audit got its own negative control, and the orchestrator ran additional controls _after_ the auditor returned, deliberately choosing mutations the auditor had not tried, to check the guards were not fitted to their own controls.

**When to use:** Whenever adding a standing guard. The phase's own blind/catch standard applied reflexively to the tooling.
**Source:** 147-VALIDATION.md § Gaps Found and Filled

### Cost the alternative from the run's own durations

Decision (B)'s ≤ +138 s figure came from `BASE-GREEN`'s `results.json`, split by fixture kind, not from an estimate. This is why `147-01` added `--reporter=html,json` — the repo's HTML-only reporter is not machine-mineable.

**When to use:** Any trade-off between a cheaper and a more literal mechanism where the suite has already run once.
**Source:** 147-02-SUMMARY.md § patterns-established, 147-01-SUMMARY.md deviation 1

### Record cross-instrument differences as differences

`RK1-OLD` counted 15 raw-key occurrences in a trace, the scout counted 22 card actions carrying the label, and the scan reports 11 visible sightings. Three instruments, three datasets — stated rather than reconciled, because the rows assert the key's presence _by name_, which all three agree on.

**When to use:** When numbers from different instruments disagree and nothing you are claiming depends on them matching. Reconciling them away invents a precision the evidence does not have.
**Source:** 147-04-SUMMARY.md § patterns-established

### Records corrected after their gates, never before

`147-05` took no measurement, ran no suite and filled no register cell by design; every claim it makes cites an observation an earlier plan took.

**When to use:** Sequencing a phase that ends in record corrections — a correction written ahead of its gate can describe a state that turns out not to hold.
**Source:** 147-05-SUMMARY.md § patterns-established

### Gaps filed one-todo-per-lever

Six unscanned states became five todos, not six and not one — the questions-intro and logout-modal states share one lever (an answerless candidate) so they are one todo; `answersLocked` is alone because its lever would move the scan project back inside the ordering hazards `147-02` measured its way out of. Test applied throughout: _can a future reader act on one without reading the others?_

**When to use:** Filing residue at phase close. Twelve todos here, each actionable alone, cross-referenced from the register's § Residue.
**Source:** 147-05-SUMMARY.md § Decisions Made 6

---

## Surprises

### Ungating `auth-setup` perturbed nothing at all

`ORD-PERTURB` returned 136 passed / 0 failed, +1 test (the declared setup itself), 80 → 80 phases, and **0 of 89 projects moved phase**.

**Impact:** Unblocked a register row that two prior runs had voided, and made W3 available without an ordering hazard on either axis. The prediction instrument then held against a run it had not seen — 0 mismatches over 91 scheduled projects in `147-03`.
**Source:** 147-02-SUMMARY.md

### `a11y-smoke`'s summed per-test time varies by a factor of ~2.3 run to run

The same project on the same tree measured 130.2 s, 166.5 s, 194.9 s and 301.4 s across four runs — two of them _before_ the change under suspicion.

**Impact:** A +36.3 s reading was recorded as UNATTRIBUTED rather than explained away, because a single-run comparison cannot carry a causal claim in either direction at that variance. The number that matters under the cardinal rule is the suite wall clock: 10.8 → 10.7 min.
**Source:** 147-03-SUMMARY.md § Issues Encountered

### The new work did not hide entirely inside the existing critical path

Phase 3 grew +4.9 s (27.3 → 32.2 s) rather than the predicted flat zero: the scan's 10.3 s window does not fit entirely inside `candidate-journey`'s 24.2 s.

**Impact:** The prediction holds in direction with a small residue; suite total unchanged. Recorded in the register rather than rounded to zero.
**Source:** 147-03-SUMMARY.md § Issues Encountered

### Two-thirds of the disk blocker was never measured

`Docker.raw` occupies 60 GiB of allocated host blocks against ~7.5 GB of live content — ~52 GiB of never-TRIMmed sparse bloat. Reclaiming it destroys nothing.

**Impact:** Recorded, not taken — it is an operator decision about a daemon running other projects' containers. `tests/e2e-runs/` is a further 6.8 GB but is cited by path in the 140 and 146 registers, so it must not be deleted.
**Source:** 147-02-SUMMARY.md § Findings worth carrying forward

### Disk headroom falls ~0.5–1 GiB per full-suite run, and it is not the run directories

Headroom fell ~25 → ~23 GiB across four runs; the run dirs are 1.8–1.9 MB each. It tracks the `db:reset` cycles (Docker/Postgres growth).

**Impact:** No run was voided, but this repository has voided full-suite runs on ENOSPC before and `147-02` lost two to it. Filed as `2026-08-27-147-full-suite-disk-headroom-falling.md`.
**Source:** 147-04-SUMMARY.md § Issues Encountered

### The Svelte compiler already flagged the injected defect, and it reddened nothing

`a11y_missing_attribute` at `+layout.svelte:191:2` fired on the `AX1` injection throughout the blind measurement.

**Impact:** A compiler warning that no gate reads is its own small instance of the pattern the phase exists to close.
**Source:** 147-01-SUMMARY.md § Findings worth carrying forward

### The 400-key floor would pass with an entire namespace deleted

`rawKeyScan.ts`'s `MIN_EXPECTED_KEYS = 400` was the only guard on the catalog union. The union is 598 = 161 `candidateApp.*` + 121 `adminApp.*` + 316 voter/shared, so deleting **all** `adminApp*.json` leaves 477 and passes.

**Impact:** Drove guard G1 (`assert-i18n-catalog-namespaces.mjs`), which asserts per-namespace floors rather than a total, and additionally pins the two specific keys the phase's own controls inject against.
**Source:** 147-VALIDATION.md § Gaps Found and Filled

### The out-of-family route count was wrong in its own source

`147-SCOUT-INVENTORY.md` says "11 further unscanned candidate surfaces" while _naming twelve_; `find` over the route tree returns twelve.

**Impact:** The enumeration was right and the count was an arithmetic slip — corrected to 12 (measured) rather than propagated, in a plan whose first task was spent retiring exactly this shape of premise.
**Source:** 147-05-SUMMARY.md deviation 5

### A fourth live record carried the drifted citations

The plan named three records to correct; a grep across `.planning/` found `.planning/PROJECT.md:19` carrying the same stale `:921` / `:174` line numbers — a live project brief, among the first documents read when planning starts.

**Impact:** Corrected as a Rule 2 deviation. Historical records that carry the old citations _as history_ (the scout's own "roadmap says → actual" table, `147-01-PLAN.md`, the 136-era summaries) were deliberately left alone — correcting those would falsify the record of what was believed at the time.
**Source:** 147-05-SUMMARY.md deviation 1, § Decisions Made 3

### A register row's owner was recorded inconsistently by the register itself

`REV1-CLEAN` is assigned to `147-04` by the corpus table and by § Completeness, and to `147-05` by the Gates table.

**Impact:** Resolved _against_ the Gates table on three counts (corpus authority, independent Completeness count, and `147-04` actually took the measurement) — the wrong record is named rather than the two quietly made to agree.
**Source:** 147-04-SUMMARY.md, 147-05-SUMMARY.md § Decisions Made 5

### The tests directory's own unit tests run in no automated command

`tests/vitest.config.ts` is in neither `vitest.workspace.ts` nor any turbo workspace (`tests/` has no `package.json`), and `scripts/assert-unit-test-coverage.mjs` scans only `packages/*` and `apps/*`. Its three test files run nowhere.

**Impact:** Pre-existing, not introduced by Phase 147 — and the same incident shape that coverage guard exists to prevent, in the one directory it cannot see. It is why both new guards were placed in `scripts/` rather than there. Filed as `2026-08-27-147-tests-vitest-config-runs-in-no-command.md`.
**Source:** 147-VALIDATION.md § Residue R1
