---
phase: 138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg
verified: 2026-08-14T06:14:27Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 138: DEF-135-04 — `EPERM-07` Root Cause + Cardinal-Rule Waiver Discharge Verification Report

**Phase Goal:** The one standing waiver against the project's cardinal E2E rule is discharged by a **named root cause** and a proven fix — not by absence of reproduction.
**Verified:** 2026-08-14T06:14:27Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A written root cause names the mechanism, and a forcing harness reproduces `EPERM-07` deterministically at least once before any fix is written | ✓ VERIFIED (with disclosed limitation — see judgment below) | `138-DIAGNOSIS.md` § Named root cause: 5-step ordering chain quoted from `node_modules/@sveltejs/kit` `client.js:1759-1824` vs. `voter-journey.spec.ts:186-190`; forced **15/15** across two independently launched blocks (`138-FORCED-REPRO.md` §B.8), commit before the fix (`e96e24a44` did not exist yet). Confirmed the forcing harness code (`eperm07-term-trigger.spec.ts:34-86`) reads `EPERM07_FORCE_BUDGET_MS`/`EPERM07_FORCE_CPU_RATE` with production defaults (`TIMEOUTS.element` = 2000 ms, CPU rate 1) — the file is neutral by construction. |
| 2 | Negative control pair: pre-fix FAILS, post-fix PASSES under the same forcing harness — not "it stopped happening" | ✓ VERIFIED | `138-NEGATIVE-CONTROL.md` §4-5: pre-fix `360927495` **5/5 FAIL** (`headingCount:0, headingText:null, triggerCount:0`), post-fix `e96e24a44` **5/5 PASS** (`headingCount:1`, Base-3 heading text, `triggerCount:1`), byte-identical adversary in both halves (`EPERM07_FORCE_BUDGET_MS=400 EPERM07_FORCE_CPU_RATE=40`), scoped `git status --porcelain tests/ apps/ packages/` empty at both captures. Fix commit `e96e24a44` inspected directly: touches only `tests/tests/helpers/{navigation,index}.ts` and two spec files — zero application code. |
| 3 | At least 16 consecutive full-suite runs, zero `EPERM-07` failures, each preflight-confirmed | ✓ VERIFIED | `138-DETERMINISM-LEDGER.md` § Per-run ledger: 16/16 rows, all on pinned HEAD `8931516356ea4ce9f30ad84aa1e688f1b900bacd`, all `135 executed / 135 passed / 0 failed / 0 flaky / 0 did-not-run`, preflight failures 0. **Independently re-verified from on-disk artifacts** (not the ledger's own prose): read `results.json` directly from `tests/e2e-runs/determinism-batch/run-{01,05,10,16}/` — `stats.expected=135, unexpected=0, flaky=0, skipped=0`, `config.workers=6`, `config.projects[0].retries=0`, `head` file matches the pinned HEAD, `preflight-failures` file reads `0`. Parsed run-01's full `suites` tree and confirmed the EPERM-07 spec's own test result is `passed`. |
| 4 | Waiver marked discharged; no successor waiver; no `test.skip`/retry annotation; no "could not reproduce" closure; cardinal rule back in force unwaived | ✓ VERIFIED | `grep -c '^## Discharged' .planning/v2.14-CARDINAL-RULE-WAIVER.md` → **1**. `ls .planning/*WAIVER*.md \| wc -l` → **1** (no successor). `grep -rnE 'test\.(skip\|fixme\|only)\(\|describe\.(skip\|only)\b' tests/tests --include='*.ts'` → **0 matches**. No non-reproduction closure language found in the waiver or diagnosis docs (every hit on "could not reproduce" is either the grep-pattern itself being documented, or a statement that the phase must NOT close that way — never used as an actual closure). Waiver's closing sentence: "The cardinal E2E rule is back in force, unwaived, with no standing exception anywhere in the project." CLAUDE.md's cardinal-rule text confirmed byte-intact (unmodified, still reads "CARDINAL FAILURE... must pass first, full stop"). |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `138-DIAGNOSIS.md` | Named root cause with file:line chain, hypothesis ledger, U-1 verdict | ✓ VERIFIED | 484 lines; contains the 5-step SvelteKit ordering chain with verbatim `node_modules/@sveltejs/kit` quotes, hypothesis ledger with H1/H2/H3 all `eliminated` with evidence pointers, and an explicit "what this does not explain" section (the ~4s excursion). |
| `138-NEGATIVE-CONTROL.md` | Pre-fix FAIL / post-fix PASS pair, same adversary | ✓ VERIFIED | 490 lines; both halves' `git rev-parse` provenance, scoped porcelain checks, verbatim invocation commands, per-run tri-state JSON, and a discarded-intermediate-block disclosure (§5.6). |
| `138-DETERMINISM-LEDGER.md` | 16-run batch ledger | ✓ VERIFIED | 227 lines; per-run table cross-checked against on-disk `results.json` files for 4 sampled runs — all matched exactly. Discarded first-attempt (5 runs, different HEAD) recorded rather than hidden. |
| `138-FORCED-REPRO.md` | The forcing evidence behind criterion 1 | ✓ VERIFIED | 91KB; spot-checked "15/15" and "97 production-budget runs, zero failures" claims — both text strings present at the cited locations (§B.8, §B.5/§C.2). |
| `.planning/v2.14-CARDINAL-RULE-WAIVER.md` | Marked discharged | ✓ VERIFIED | Original waiver text retained byte-for-byte above a `## Discharged` section that answers all 4 original conditions, cites the 3 evidence docs, and states the open item honestly. |
| Fix commit `e96e24a44` | Test-side settle fix, no app code, no budget bump | ✓ VERIFIED | `git show --stat e96e24a44`: 4 files changed, all under `tests/`. `tests/tests/helpers/timeouts.ts` diff (`b5ac2f471..HEAD`) is empty; `element: 2_000` appears exactly once. |
| Six PLAN/SUMMARY pairs (138-01 .. 138-06) | Wave-based execution record | ✓ VERIFIED | All 6 exist, all `status: complete`, requirements fields (`INTEG-01`/`INTEG-02`/`INTEG-03`) match ROADMAP's phase requirement list exactly, no orphans. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `138-DIAGNOSIS.md` § Named root cause | `node_modules/@sveltejs/kit/src/runtime/client/client.js` | file:line quotes (1759-1760, 1779-1785, 1824) | ✓ WIRED | Root cause is grounded in actual framework source lines, not asserted abstractly. |
| `138-NEGATIVE-CONTROL.md` | fix commit `e96e24a44` | pre/post HEAD provenance (`360927495` → `e96e24a44`) | ✓ WIRED | Both commits exist in `git log`; diff between them is exactly the 4 test files claimed. |
| `138-DETERMINISM-LEDGER.md` | on-disk run artifacts | `tests/e2e-runs/determinism-batch/run-NN/results.json` | ✓ WIRED | Sampled 4 of 16 runs directly from disk; all match the ledger's table row for row-values (exit, executed count, workers, retries, preflight-failures, HEAD). |
| `.planning/v2.14-CARDINAL-RULE-WAIVER.md` § Discharged | `138-DIAGNOSIS.md`, `138-NEGATIVE-CONTROL.md`, `138-DETERMINISM-LEDGER.md` | direct file citations per criterion | ✓ WIRED | Each of the 4 conditions cites a specific evidence document and section. |
| `REQUIREMENTS.md` INTEG-01/02/03 | `138-06-SUMMARY.md`, waiver discharge | checkbox + evidence line | ✓ WIRED | All 3 checked `[x]` with evidence citations matching the actual diagnosis/control/ledger documents. |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|-----------------|--------------|--------|----------|
| INTEG-01 | 138-01, 138-02, 138-03, 138-04 | Named root cause, not stopped-reproduction closure | ✓ SATISFIED | `138-DIAGNOSIS.md` § Named root cause + § How it was forced (15/15) |
| INTEG-02 | 138-04, 138-05 | Fix holds across a determinism run at 2× the observed rate | ✓ SATISFIED | `138-DETERMINISM-LEDGER.md` § Verdict (16/16) + `138-NEGATIVE-CONTROL.md` (5/5 → 0/5) |
| INTEG-03 | 138-06 | Waiver discharged, cardinal rule back in force unwaived | ✓ SATISFIED | `.planning/v2.14-CARDINAL-RULE-WAIVER.md` § Discharged |

No orphaned requirements: `grep -E "Phase 138" .planning/REQUIREMENTS.md` maps exactly INTEG-01/02/03 to this phase, all three declared across the six plans' frontmatter.

### Anti-Patterns Found

None. `grep -nE "TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER"` returned no matches across the seven test-harness files touched by this phase (`navigation.ts`, `index.ts`, `eperm07-term-trigger.spec.ts`, `voter-journey.spec.ts`, `forensicCapture.fixture.ts`, `e2e-run.sh`, `determinism-batch.sh`).

### Behavioral Spot-Checks / Independent Evidence Verification

| Check | Command | Result | Status |
|-------|---------|--------|--------|
| Discharged-heading count | `grep -c '^## Discharged'` | 1 | ✓ PASS |
| Successor-waiver count | `ls .planning/*WAIVER*.md \| wc -l` | 1 | ✓ PASS |
| Forbidden test artefacts | `grep -rnE 'test\.(skip\|fixme\|only)\(\|describe\.(skip\|only)\b' tests/tests` | 0 matches | ✓ PASS |
| Archived v2.14 requirements untouched | `git diff --quiet b5ac2f471..HEAD -- .planning/milestones/v2.14-REQUIREMENTS.md` | no diff | ✓ PASS |
| No app code changed | `git diff --name-only b5ac2f471..HEAD -- apps/ packages/` | empty | ✓ PASS |
| `timeouts.ts` unchanged, `element: 2_000` once | `git diff b5ac2f471..HEAD -- tests/tests/helpers/timeouts.ts` + grep | empty diff; 1 match | ✓ PASS |
| 16-run ledger vs. on-disk `results.json` (runs 01/05/10/16) | direct `results.json` parse | all match ledger table exactly | ✓ PASS |
| EPERM-07 step outcome in run-01 | parsed `suites` tree | `passed` | ✓ PASS |
| `perm-per-app-notifications` quarantine claim (F-1 fix) | read spec + config directly | spec has ordinary `test.describe`, config wires it live in the perm chain — the correction is accurate | ✓ PASS |
| Fix commit touches only `tests/` | `git show --stat e96e24a44` | 4 files, all under `tests/` | ✓ PASS |

### Probe Execution

Not applicable — this phase's "probes" are the E2E forcing-harness runs and the 16-run determinism batch, both already verified above against on-disk `results.json` artifacts rather than re-executed (re-running a 16×11-minute batch is outside verification scope and the on-disk evidence is dispositive).

## Judgment Calls (per explicit instruction)

### 1. Criterion 1 — reproduction only at a 5×-shrunken oracle

**The fact, confirmed directly:** the forcing harness that produced 15/15 failures ran at `EPERM07_FORCE_BUDGET_MS=400` against the production `TIMEOUTS.element = 2000` — a 5× shrink — and this is not a discrepancy I found; it is stated by the phase itself, repeatedly and prominently, including as the operator's own verbatim sentence carried into the permanent waiver record: *"The weakest criterion is 1, because the reproduction was forced only against a 5×-shrunken oracle and never at the production budget."* I independently confirmed the underlying numbers: `138-FORCED-REPRO.md` documents 97 production-budget runs (91 forced-lever across CPU rates 2-80 plus worker pressure, 5 unprefixed, 1 full-suite sample) with **zero** failures, and the diagnosis explains why the strong form was unreachable (reaching 2000 ms would need CPU rate ~130-190, but the throttle itself breaks the measurement instrument above ~80).

**My judgment: criterion 1 is satisfied as literally written, but only just, and the record is honest that it is the weak link.** The ROADMAP text says a forcing harness must "reproduce the `EPERM-07` term-trigger failure deterministically at least once... before any fix is written" — it does not say "at the production budget." Read literally, 15/15 deterministic reproductions before the fix existed satisfies that sentence. The counter-argument — that a failure induced by weakening the assertion's own timeout is reproducing a *different, easier* failure rather than *the* field failure — has real force, and the phase does not pretend otherwise. What tips this into a pass rather than a gap, for me, is that:
- Criterion 2's negative control does NOT depend on this caveat in the same way: it shows the identical adversary (same 400/40 shrink) flipping 5/5-fail to 0/5-fail across exactly one commit that changes nothing but a test settle. That is direct causal evidence the fix moves the observation past the real DOM-swap ordering defect, independent of whether the oracle was weakened.
- Criterion 3's 16/16 clean runs are all at the **production** budget (no forcing knobs set), so the field-relevant claim — "the fix doesn't regress anything and the rate-1-in-8 defect doesn't recur" — is evidenced at full strength, not weakened.
- The gap this caveat actually leaves open — the ~4s field excursion's amplifier — is explicitly NOT claimed as closed anywhere in the record (see judgment 2 below), so no false strength is being claimed.

This is a legitimate discharge with an honestly disclosed weak point, not a stopped-reproduction closure dressed up as one. I record it as VERIFIED with the caveat surfaced, not as a gap, because the criterion's text is met and the weakness is neither hidden nor load-bearing for the fix's validity (criterion 2 carries that weight independently, as the operator's own recorded reasoning states).

### 2. The ~4s excursion — confirmed to be framed as an open judgment, not a resolved finding

I read all three places this appears (`138-DIAGNOSIS.md` § "The one thing this does not explain, stated plainly", `138-NEGATIVE-CONTROL.md` § 6, and the waiver's § "The open item that survives this discharge") and confirm the record consistently:
- States the field occurrence needed ~36× the median window; the phase reached at most ~5.4× by CPU amplification and <2× by contention — an explicit, measured shortfall, not glossed over.
- Labels the dev-server-stall attribution "a JUDGMENT, not a measurement" in bold, with a stated falsifier ("a recurrence of a multi-second excursion... is evidence against it and re-opens the open item").
- Explicitly states "This attribution does not close the item, and this discharge does not rest on it" and "it stays live."
- The item is tracked in `138-06-SUMMARY.md` § Open items as **OPEN**, not resolved.

This is exactly the honest framing the task asked me to confirm. I found no place in the record where this open item is quietly treated as closed or where its status is inconsistent across documents.

## Human Verification Required

None. Both judgment items above were already put through an explicit one-way operator decision checkpoint inside the phase itself (138-04's D-06 fix-tier authorization and 138-06's discharge checkpoint), and the record of that decision — including the operator's verbatim caveat sentence — is what I verified exists in the permanent record. There is no further ambiguity requiring a fresh human check; the phase's own process already routed this exact judgment to a human and recorded the outcome traceably.

## Gaps Summary

None found. All four ROADMAP success criteria are met with on-disk, independently re-derived evidence (not just SUMMARY prose): the root cause is named with framework file:line citations; the negative control pair inverts under a byte-identical adversary across exactly one commit; 16/16 determinism-batch runs are confirmed directly from their `results.json` artifacts; and the waiver's discharge is structurally sound (one `## Discharged` heading, one waiver file, zero forbidden test artefacts, archived records untouched, application code untouched, no timeout budget raised). The one genuine weak point in the evidence chain — criterion 1's reliance on a shrunken-oracle reproduction — is disclosed by the phase itself as its own weakest link and does not, on the literal text of the criterion, constitute a failure to meet it; criterion 2 independently carries the causal weight of proving the fix correct.

---

*Verified: 2026-08-14T06:14:27Z*
*Verifier: Claude (gsd-verifier)*
