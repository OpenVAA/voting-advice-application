---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c
plan: 06
subsystem: testing
tags: [playwright, e2e, teardown, assertions, negative-control, supabase, dev-seed]

# Dependency graph
requires:
  - phase: 140-05
    provides: "`runTeardownAsserted` shared helper carrying the pre-change matcher, `SupabaseAdminClient.countRowsByPrefix` probe, `ALLOWED_TEARDOWN_TABLES` export, the 27-site codemod, and `140-MEASUREMENT.md`'s 26-observation table"
  - phase: 140-01
    provides: "`140-NEGATIVE-CONTROL.md` and its § 5.4 two-column table conventions"
  - phase: 137
    provides: "`tests/scripts/e2e-run.sh` and the served-application preflight that makes every run in this plan evidence"
provides:
  - "The final F3 matcher: a before/after invariant in `assertTeardown.ts` that fails when a teardown's delete accounts for none of the rows present, naming the prefix and both counts"
  - "The adjudication (`140-MEASUREMENT.md` § 8) — branch A chosen against the measured table, with each rejected shape costed in reddened rows"
  - "The F3 two-run control at three structurally distinct teardown shapes (`140-NEGATIVE-CONTROL.md` Part IV)"
  - "The Phase 140 gate, verdict for all five ROADMAP criteria, and the phase-level not-discharged list (Part V §§ 20-23)"
  - "`140-VALIDATION.md` closed out: status validated, nyquist_compliant true"
affects: [141-package-unit-test-coverage, 142-assertion-design, teardown-authoring, e2e-harness]

actuals:
  tokens: 14542
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Before/after invariant for prefix-scoped deletes: count, delete, count; assert the delete accounted for everything and nothing survived"
    - "Scoped-invocation sampling — choose a `--project` whose dependency subset makes the target teardown's setup terminal, so `before > 0` at a site the full suite would reach with 0 rows"
    - "Observation-only probe kept in BOTH control halves so the blind half's silent pass is falsifiable"

key-files:
  created: []
  modified:
    - tests/tests/setup/shared/assertTeardown.ts
    - .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-MEASUREMENT.md
    - .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-NEGATIVE-CONTROL.md
    - .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-VALIDATION.md

key-decisions:
  - "Branch A adopted: `rowsDeleted === before` held at 26/26 measured observations and `after === 0` at 26/26, so the before/after invariant was taken without relaxation"
  - "A uniform positivity floor was rejected against data, not against a prediction — it would have reddened 25 of the 26 executed sites; the per-site expected constant 25 of 26; residue-only would redden 0 but is candidates-table-only and carries no accounting clause"
  - "The plan's claim that the invariant catches a call-site PREFIX typo was CORRECTED, not repeated: one prefix argument feeds both the count and the delete, so a typo presents as a legitimate 0/0/0"
  - "The before-count/RPC race window was recorded as a known unobserved property rather than traded away by relaxing the accounting clause"
  - "Shape 3 (bank-auth) was reached through its data lane (`--project data-setup-bank-auth-journey`) instead of being filed as a named gap; the narrower remaining gap (the journey spec's browser leg) is named with its cause"

patterns-established:
  - "Adjudication-against-data: a matcher choice records which measured rows support it AND how many rows each rejected shape would have reddened"
  - "Correction-over-satisfaction: when a pre-specified grep predicts N and measures N+k because prose names the symbol, verify intent with a stronger code-site check and record the correction — never delete prose"

requirements-completed: [ASSERT-02]

coverage:
  - id: D1
    description: "The F3 matcher, adjudicated against the measured table and landed in the single shared helper, with both assertion messages naming the prefix and both counts"
    requirement: ASSERT-02
    verification:
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/140-f3-smoke --project perm-hide-category-tags (86 passed, exit 0, preflight 1/0)"
        status: pass
      - kind: other
        ref: "yarn lint:check (incl. typecheck:tests) exit 0; prettier --check clean"
        status: pass
    human_judgment: false
  - id: D2
    description: "Two-run control: the adjudicated matcher observed FAILING by name at three structurally distinct teardown shapes under an adversary that makes the delete match nothing while rows are present, and the pre-change form observed PASSING under the byte-identical adversary"
    requirement: ASSERT-02
    verification:
      - kind: e2e
        ref: "140-NEGATIVE-CONTROL.md § 19.4 — six runs at HEAD 15d2e6687; RUN 1a/1b/1c exit 0 all green with 14/142/38 rows undeleted; RUN 2a/2b/2c exit 1, each red at assertTeardown.ts:73:5"
        status: pass
    human_judgment: false
  - id: D3
    description: "Phase gate: build, unit suite, lint and one full preflight-confirmed E2E suite green with zero failed and zero did-not-run; by-construction static coverage executed; no site's teardown outcome changed versus the pre-change measurement"
    verification:
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/140-gate (no --project): 135 passed, unexpected 0, flaky 0, skipped 0, preflight 1/0, exit 0"
        status: pass
      - kind: unit
        ref: "yarn build (14/14) · yarn test:unit (21/21; 773 + 444 tests) · yarn lint:check (11/11) — all exit 0"
        status: pass
      - kind: other
        ref: "140-NEGATIVE-CONTROL.md § 20.2 static coverage + § 20.4 pre/post outcome comparison"
        status: pass
    human_judgment: false
  - id: D4
    description: "The two `verification: backstop` truths — the duplicated `e2e-perm-notloc-` prefix observed on both owning files in one invocation, and tolerance of a genuinely concurrent pre-clear"
    verification: []
    human_judgment: true
    rationale: "Both are reasoned from the matcher's shape plus separate observations, not observed as such. The default suite never runs the two `e2e-perm-notloc-` owners together and never runs a teardown concurrently with another chain's setup, so no run in this phase can confirm them. Surfaced in § 22 with an explicit instruction that a verifier unable to confirm them must abstain to `human_needed` rather than pass them."

duration: 45min
completed: 2026-08-15
status: complete
---

# Phase 140 Plan 06: F3 Matcher Adjudication, Control and Phase Gate Summary

**The 27 unfailable teardown row counts now fail by name — a before/after invariant chosen against a measured 26-row table rather than a guess, observed red at three structurally distinct call sites and green under the byte-identical adversary with the pre-change form, with the whole phase gated on a preflight-confirmed 135-test suite that no site's outcome changed in.**

## Performance

- **Duration:** ~45 min
- **Tasks:** 3 of 3
- **Commits:** 4 (3 task commits + this metadata commit)
- **E2E runs executed:** 8 (1 smoke, 6 control halves, 1 full gate) — every one preflight-confirmed, 1 SUCCESS line and 0 FAILURE lines each

## Accomplishments

### Task 1 — the matcher, adjudicated (`15d2e6687`)

Read all 26 rows of `140-MEASUREMENT.md` § 4 and classified them against the plan's pre-specified
branch rule. **Branch A**: `rowsDeleted === before` holds at 26/26 observations and `after === 0` at
26/26, so assumption A2 is confirmed — `bulk_delete`'s summed per-collection `deleted` counts and the
ten-table `countRowsByPrefix` probe are directly comparable.

`tests/tests/setup/shared/assertTeardown.ts` now brackets `runTeardown` with the probe and asserts
both clauses, each message naming the prefix and both counts. Plan 05's "matcher deliberately
deferred / probe not yet consumed" comments were removed in the same edit — both statements became
false with this change, and leaving them is the drift class this phase exists to close.

`140-MEASUREMENT.md` § 8 records the adjudication, including the load-bearing part: what each
rejected shape would have cost **against the real data**.

| Rejected shape | Rows it would have reddened (of 26) |
|---|---|
| Positivity floor `rowsDeleted > 0` | **25** |
| Per-site expected constant `toBe(N)` | **25** |
| Residue-only (candidates table) | 0 — but blind: 1 of 10 tables, no accounting clause |
| The adopted before/after invariant | **0** |

Research predicted the positivity floor would redden ~26 of 27; the measurement says 25 of the 26
that executed. D-02 is vindicated by a margin, not a technicality.

### Task 2 — both halves observed at three shapes (`9872b5593`)

One mutation, in the one file all 27 teardowns call: force `runTeardown` to a non-matching prefix
while `before` is still counted from the real one. Six runs, all at HEAD `15d2e6687`.

| Half | Site | `before/deleted/after` | Exit | **Assertion** | Project | Failing `file:line` |
|---|---|---|---|---|---|---|
| RUN 1a | `perm-1e1cg1co` | 14 / 0 / 14 | 0 | **PASS (blind)** | PASS 11/11 | — |
| RUN 2a | `perm-1e1cg1co` | 14 / 0 / 14 | 1 | **FAIL (caught)** | FAIL 1 of 11 | `assertTeardown.ts:73:5` |
| RUN 1b | `base` | 142 / 0 / 142 | 0 | **PASS (blind)** | PASS 4/4 | — |
| RUN 2b | `base` | 142 / 0 / 142 | 1 | **FAIL (caught)** | FAIL 1 of 4 | `assertTeardown.ts:73:5` |
| RUN 1c | `bank-auth-journey` | 38 / 0 / 38 | 0 | **PASS (blind)** | PASS 2/2 | — |
| RUN 2c | `bank-auth-journey` | 38 / 0 / 38 | 1 | **FAIL (caught)** | FAIL 1 of 2 | `assertTeardown.ts:73:5` |
| boundary | `base` inside the perm chain | 0 / 0 / 0 | — | **PASS in both halves** | PASS both | — |

The failure text, verbatim: `teardown of prefix 'e2e-perm-1e1cg1co-' deleted 0 row(s) but 14 row(s)
were present under that prefix before the delete — the delete accounted for none or only some of
them`. Prefix and both counts, at the helper's own line — criterion 1's "by name".

The boundary row is what makes the matcher demonstrably discriminating rather than always-on: the
same live adversary at a `before === 0` site passes under both forms, because a no-op delete of
nothing is a legitimate teardown outcome and the measurement says it is the common one.

### Task 3 — the gate and the record (`e61663f03`)

| Gate | Exit | Outcome |
|---|---|---|
| `yarn build` | 0 | 14/14 |
| `yarn test:unit` | 0 | 21/21 — 773 frontend + 444 dev-seed tests |
| `yarn lint:check` | 0 | 11/11, 0 errors (incl. `typecheck:tests`) |
| `e2e-run.sh --run-dir tests/e2e-runs/140-gate`, **no `--project`** | 0 | **135 passed**, unexpected 0, flaky 0, skipped 0, preflight 1/0 |

Cardinal rule satisfied: a per-test census of the reporter output finds no test with a status other
than `expected` anywhere in the run — zero failed **and** zero did-not-run.

**Nothing changed versus the pre-change measurement run**: same 135/0/0/0, same 27 `data-teardown-*`
projects, all `expected` in both. That is what makes the order-independence truth evidenced rather
than argued from Playwright's documentation.

`140-NEGATIVE-CONTROL.md` gained §§ 6.2-6.3, Part IV (§§ 17-19), Part V (§§ 20-23), and its § 7.1
verdict rows 1 and 5 were updated in place from "owned by a later plan" / "partially advanced" to
**DISCHARGED**. All five ROADMAP criteria now carry a verdict row. `140-VALIDATION.md` is
`status: validated`, `nyquist_compliant: true`, every requirement row green.

## Deviations from Plan

### Auto-fixed / corrected

**1. [Rule 1 — false acceptance criterion] The direct-call grep predicted 0 and measured 5**

- **Found during:** Task 3 static coverage
- **Issue:** `grep -rl 'runTeardown(' tests/tests/setup --include='*.teardown.ts' | wc -l` was specified to return 0. It returns **5**.
- **Cause:** all five hits are **prose comments** — four instances of `// … runTeardown(PREFIX)` and one docblock sentence in `perm-localisation-positive.teardown.ts:6`.
- **Fix:** no prose deleted. Intent verified with two stronger code-site checks: `grep -rn 'await runTeardown(' … | wc -l` → **0** and `grep -rn "import .*[{ ]runTeardown[ ,}]" … | wc -l` → **0**. Zero teardown files call the library delete directly or import it.
- **Recorded in:** `140-NEGATIVE-CONTROL.md` § 20.2. This is the **fourth** occurrence of the predicted-N/measured-N+k pattern in this phase (plans 03, 04, 05, 06); the plan's own carryover warned about it.

**2. [Rule 2 — honesty of the record] The plan's typo-catching claim is false and was corrected**

- **Found during:** Task 1
- **Issue:** `140-06-PLAN.md` task 1's branch-C paragraph asserts the before/after invariant "also catches a prefix typo (which a positivity floor cannot)".
- **Cause:** the helper takes ONE `prefix` argument, so a typo'd call-site constant propagates identically to the count and to the delete, yielding a passing `0/0/0`.
- **Fix:** claim corrected in `140-MEASUREMENT.md` § 8.4 and in the helper's own docblock (`WHAT IT CATCHES` / `WHAT IT DOES NOT CATCH`), rather than repeated. Restating a plan's optimistic wording that the code visibly contradicts is the drift class Phase 140 exists to close.

**3. [Improvement] The expected bank-auth named gap became an observation**

- **Found during:** Task 2 sample design
- **Issue:** the plan (and `140-MEASUREMENT.md` § 4.1) expected `bank-auth-journey.teardown.ts` to be recordable only as a named gap, because its journey project is opt-in behind `PLAYWRIGHT_BANK_AUTH` and needs the Idura OIDC environment.
- **Finding:** that is true of the *journey spec*, not of the *data lane*. `data-setup-bank-auth-journey` has no `dependencies` and pulls its teardown via the `teardown:` key, so `PLAYWRIGHT_BANK_AUTH=1 e2e-run.sh --project data-setup-bank-auth-journey` reaches the teardown site with 38 rows present and no browser leg.
- **Result:** shape 3 observed in both halves. The narrower gap that remains — the journey spec's mock-OIDC browser round trip, which needs a separately started server per `tests/IDURA-TEST-RUNBOOK.md` §§ B-1/B-2 — is named with its cause in § 19.6 and § 22, not omitted.

**4. [Scope] The race window in the accounting clause was recorded, not designed away**

The accounting clause compares a count taken *before* `runTeardown` against what `runTeardown`
reports, so an actor removing rows in that interval would red the assertion for a reason that is not
the site's defect. § 5.2's timeline shows the suite never opens that window (every setup completes
before any teardown starts; a `--project` run has one chain). Recorded in `140-MEASUREMENT.md` § 8.4
as a known unobserved property. Relaxing the clause to tolerate it would be exactly the "weaken the
assertion to keep the suite green" move this phase prohibits.

## Known Stubs

None. No placeholder, no `test.skip`, no `test.fixme`, no retry annotation and no env-gated control
mode was added by this plan (`140-NEGATIVE-CONTROL.md` § 20.3, command + output).

## Threat Flags

None. This plan adds no network endpoint, auth path, file-access pattern or schema change. T-140-03
(the helper must never gain delete authority over a prefix it does not own) is mitigated as planned:
the caller's `prefix` is forwarded verbatim with no default, normalisation or fallback,
`runTeardown`'s two-character mass-delete guard is untouched and unwrapped, and the residue clause
makes an over- or under-broad delete visible rather than silent.

## What this plan does NOT discharge

Reproduced from `140-NEGATIVE-CONTROL.md` § 22 so it is not lost between documents:

- **No CI runner has executed any of the four repairs** — the standing Phase-137 gap; discharges on this branch's first PR to `main`.
- **The bank-auth journey SPEC was not run** (its teardown site was).
- **The three sibling `Rigidity contract` drift files are filed, not fixed** (outside ASSERT-06's scope; already in `.planning/WINDOWS.md`).
- **Both `verification: backstop` truths are reasoned, not observed** — the duplicated `e2e-perm-notloc-` prefix was observed on each owning file *separately*, never in one invocation; concurrency tolerance is argued from the `before === 0` path, and no run executed a teardown concurrently with another chain's setup. A verifier that cannot confirm them with explicit evidence must abstain to `human_needed`.
- **The residue clause has never been observed failing in isolation** — the adversary violates both clauses and the accounting clause throws first.
- **One run per half.** No determinism claim for any red or any green.

## Self-Check: PASSED

All five files verified present on disk; all three task commits (`15d2e6687`, `9872b5593`,
`e61663f03`) verified present in `git log`.
