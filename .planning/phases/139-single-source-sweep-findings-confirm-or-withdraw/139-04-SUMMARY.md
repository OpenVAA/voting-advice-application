---
phase: 139-single-source-sweep-findings-confirm-or-withdraw
plan: 04
subsystem: testing
tags: [vitest, oidc, jose, idura, jar, private-key-jwt, assertion-quality, audit]

# Dependency graph
requires:
  - phase: 139-01
    provides: "The verdict apparatus — HYGIENE-LOOP (§ 3.1), TWO-COLUMN RULE (§ 3.2), COLLATERAL RULE (§ 3.3), the 15-row enumeration and the § 4 summary table"
  - phase: 139-02
    provides: "The in-band positive-control pattern and the § 8.3 rejected-design ledger (R-1)"
  - phase: 139-03
    provides: "The un-injectability precedent (R-2) and the disqualified-control rule (R-4, R-5)"
provides:
  - "139-VERDICTS.md § 5.7 — F19a confirmed, assertion PASS / file FAIL, verbatim failure block"
  - "139-VERDICTS.md § 5.8 — F19b confirmed, same shared injection, own invocation and outcome"
  - "139-VERDICTS.md § 5.9 — F19c confirmed on two injections, absence and malformation measured separately"
  - "139-VERDICTS.md § 4 rows 7-9 with distinct assertion and file outcome cells"
  - "139-VERDICTS.md § 8.1 C-2, C-3, C-4 — seven collateral reds recorded, none verdict-bearing"
  - "139-VERDICTS.md § 8.3 R-6 — a third distinct injection-design failure mode (right site, wrong axis)"
  - "Pre-specified Phase 142 negative controls for all three F19 sites, with the stronger toMatch form named"
affects: [139-05, 139-06, 139-07, 140-assert-03-matcher-repairs, 142-assert-07-assertion-redesign]

actuals:
  tokens: 15200
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Two-column observation recording (assertion outcome vs file outcome) for divergent sites"
    - "Two-injection records where the first injection's axis proves not to match the finding's named mechanism"

key-files:
  created:
    - .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-04-SUMMARY.md
  modified:
    - .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md

key-decisions:
  - "[Phase 139 plan 04] All three F19 findings are confirmed, not withdrawn — the verdict cites the assertion column (PASS, blind), not the process exit code (FAIL), per D-02 and the TWO-COLUMN RULE"
  - "[Phase 139 plan 04] F19c required a second injection: the plan's mandated `undefined as unknown as string` serialises to the string \"undefined\" via URLSearchParams, so it models malformation rather than absence; deleting the entry produces the null the finding names"
  - "[Phase 139 plan 04] Phase 142's F19c negative control is injection B (entry deleted), and the recommended repair is `toMatch(/^[\\w-]+\\.[\\w-]+\\.[\\w-]+$/)` rather than the audit's `.not.toBeNull()`, because the latter closes only one of the two measured axes"
  - "[Phase 139 plan 04] No positive control was run at any F19 site — controls interpret green injection runs; all three runs came back red at the predicted line, which establishes liveness directly"

patterns-established:
  - "Divergent-outcome record: four distinct recorded facts per site (assertion outcome, file outcome, failing file:line, verbatim runner block), with the verdict citing the assertion"
  - "Injection-axis check: before accepting a red run as evidence, confirm the injection varies the detail the finding names rather than a neighbouring one"

requirements-completed: []
---

# Phase 139 Plan 04: The Three F19 Sites Summary

The three `toBeDefined()`-on-a-`null`-returning-API findings are **confirmed**, each on a run whose
assertion passed inside a file that went red — the divergence the phase's TWO-COLUMN RULE was written
to survive.

## What was done

Two authentication-material injections were applied to
`apps/frontend/src/lib/api/utils/auth/providers/idura.ts`, run against the tests that claim to guard
them, and reverted inside the tasks that created them.

**Task 1 — F19a and F19b, one shared injection at `idura.ts:74`.** The JAR request object was dropped
from the authorize URL. Both sites' assertions (`authorize-endpoint.test.ts:144`,
`idura.test.ts:148`) **passed** on `null`; both files went **red** three lines later at
`requestParam!.split('.')` with `TypeError: Cannot read properties of null (reading 'split')` —
`:147:33` and `:151:35` respectively, exactly as research predicted. § 5.7 additionally records the
route-to-provider link empirically (test sets `PUBLIC_IDENTITY_PROVIDER_TYPE: 'idura'` → `+server.ts:25`
`getActiveProvider()` → `providers/index.ts:31-34`) rather than assuming the shared injection reaches
the route handler.

**Task 2 — F19c, its own injection at `idura.ts:101-102`.** Injection A, the diff the plan mandated
(`client_assertion: undefined as unknown as string`), turned out **not to produce absence**:
`URLSearchParams` stringifies record values, so the body carried `client_assertion=undefined` and
`.get()` returned the string `"undefined"`. The assertion at `:167` passed — but because a non-empty
string is defined, not because of the `null` gap F19c names, and the file failed at `:171` on a length
mismatch rather than at `:170` on a `TypeError`. Injection B (deleting the entry, the alternative
RESEARCH already named) produced genuine absence and the predicted result. Both runs are recorded; the
verdict rests on B, and A is kept as a second measured axis.

## Key outcomes

| # | Finding | Assertion | File | Failing line | Verdict |
|---|---|---|---|---|---|
| 7 | F19a | **PASS** (blind) | **FAIL** | `authorize-endpoint.test.ts:147:33` | confirmed |
| 8 | F19b | **PASS** (blind) | **FAIL** | `idura.test.ts:151:35` | confirmed |
| 9 | F19c | **PASS** (blind, inj. B) | **FAIL** | `token-endpoint.test.ts:170:29` | confirmed |

Each verdict states the D-02 reasoning in full: the assertion is structurally incapable of detecting
absence; the file is rescued by an incidental downstream throw on a line that is not a guard; the cost
is diagnosis time rather than coverage; and ROADMAP criterion 2's withdrawal clause is scoped to
findings whose **own assertion** catches the regression, so it does not reach this class. Reading the
exit code here would have withdrawn three valid findings and shrunk ASSERT-03/Phase 140 as well as
ASSERT-07/Phase 142.

## Deviations from Plan

### Design deviation

**1. [Rule 3 — Blocking] F19c needed a second injection, because the mandated one does not model the
finding's mechanism**

- **Found during:** Task 2, before the first run — from reading `URLSearchParams` record-init
  semantics, then confirmed by measurement.
- **Issue:** The plan mandated `client_assertion: undefined as unknown as string` at `idura.ts:102`.
  `new URLSearchParams({ b: undefined })` produces `b=undefined` (the literal string), so `.get()`
  returns `"undefined"`, never `null`. The run would have shown assertion PASS / file FAIL — the right
  shape — while never exercising the `expect(null).toBeDefined()` gap that F19c *is*. A verdict resting
  on it alone would have been evidence about malformation presented as evidence about absence.
- **Fix:** Ran the mandated injection A as specified and recorded it, then ran injection B — deleting
  the `client_assertion` entry, the alternative `139-RESEARCH.md:641` already names — which produces
  genuine absence. Both are in § 5.9.4 with separate verbatim blocks; the verdict cites B.
- **Verification:** Measured the coercion out of band (`node -e` under `${TMPDIR}/gsd-139`, outside the
  repository); the console transcript is pasted in § 5.9.2. Injection B then failed at `:170` with the
  predicted `TypeError`, confirming the value reaching `:166` was `null` despite the `!`.
- **Files modified:** `139-VERDICTS.md` §§ 5.9.2, 5.9.4, 5.9.6, § 4 row 9, § 8.3 R-6.
- **Commit:** `1f1a5a057`
- **Precedent:** §§ 5.4 (F16 A/B) and 5.14 (F20-5 A/B) already carry two-injection records.

Recorded in the ledger as **R-6**, a third distinct injection-design failure mode: R-1 over-shot
(removed the category), R-2 could not be applied (zero delta), R-6 applies cleanly and reds — on the
wrong axis. It is the subtlest, because the runner output announces nothing; only the failing line
number distinguishes it.

### Corrections to the plan's expectations, recorded rather than restated

- **The benign stderr count on `token-endpoint.test.ts` is ×10, not ×3.** Every test in the file drives
  the handler through the same failing claims extraction. Present identically in baseline and both
  injected runs, so it distinguishes nothing. Recorded in § 5.9.3.
- **No positive control was run at any of the three sites, and none was needed.** The wave-1..3
  carry-forward requires a control where an injection predicts PASS — to separate blindness from a null
  experiment. All three runs here came back **red at the predicted line with the predicted error**,
  which is itself liveness proof; the seven collateral failures are a second one. Stated explicitly in
  §§ 5.7.4, 5.8.4 and 5.9.4 so a later reader does not read the absence as an omission.

## Beyond the plan: the F19 class is wider than three sites

The collateral records (C-2, C-3, C-4) surfaced the same defect **six further times** outside the
audit's enumeration: `authorize-endpoint.test.ts:157,169,189` and `token-endpoint.test.ts:188,207,229`
each write `url.searchParams.get(…)!` / `capturedFetchBody!.get(…)!` — a TypeScript `!` on an
expression the runtime hands back as `null`. Recorded in § 8.1 as a candidate scope item for Phase
140's ASSERT-03 sweep; deliberately **not** folded into any verdict, since none is one of the fifteen
enumerated sites (§ 3.3).

## Authentication-material hygiene

Both injections stripped live OIDC authentication material — the JAR request object and the
`private_key_jwt` client assertion. Neither reached a commit, a branch or a running process, and no
`yarn dev`, `yarn test:e2e` or Playwright command ran at any point.

- `git status --porcelain -- apps tests packages` — empty after every revert and at plan end.
- `grep -rn 'INJECTED (139)' apps packages tests` — no hits. The marker gate was exercised against a
  real marker for the first time in the phase (three injections, three markers) and held.
- `git diff --exit-code -- apps/frontend/src/lib/api/utils/auth/providers/idura.ts` — exits 0.
- The full six-file frontend vehicle is back to its **52 passed** baseline.

## Verification

| Gate | Result |
|---|---|
| Six-file frontend vehicle after final revert | `Test Files 6 passed (6)` / `Tests 52 passed (52)` |
| Two-file vehicle after task 1 revert | 22 passed, no failures |
| `git status --porcelain -- apps tests packages` | empty |
| `grep -rn 'INJECTED (139)' apps packages tests` | no hits |
| `git diff --exit-code -- …/providers/idura.ts` | exit 0 |
| Remaining `not yet run` placeholders | exactly **4** (F17, F20-1, F20-2, F20-3) |
| Remaining `pending` rows in § 4 | **4**, matching |

## Notes for later plans

- **Plan 07 must not mark ASSERT-01 complete on this plan's account.** Eleven of fifteen findings now
  carry verdicts; four remain. The traceability row was updated to `11 of 15` and the checkbox left
  unchecked.
- **§ 6 (withdrawals) still has nothing to record.** Eleven verdicts, eleven `confirmed`, zero
  withdrawn. § 6 must state the zero explicitly rather than being left empty.
- **§ 7 (scope limits) gains one entry from this plan:** F19c's verdict rests on an injection the plan
  did not mandate, for the reason in R-6. That belongs alongside F15-A's substitution as a declared
  limit of the pass.
- **Phase 140 (ASSERT-03) has an expanded candidate scope**: three matcher repairs plus the six
  `!`-on-`null` sites in § 8.1.
