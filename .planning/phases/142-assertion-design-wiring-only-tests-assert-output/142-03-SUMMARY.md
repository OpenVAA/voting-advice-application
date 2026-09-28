---
phase: 142-assertion-design-wiring-only-tests-assert-output
plan: 03
subsystem: testing
tags: [vitest, negative-control, assertion-design, dev-seed, faker, expect-soft, injection-hygiene]

# Dependency graph
requires:
  - phase: 139-single-source-sweep-findings-confirm-or-withdraw
    provides: "The corpus of 12 confirmed findings, the HYGIENE-LOOP (§ 3.1), the verbatim injection diffs (§ 5.N.2), the recorded OLD-half greens (§ 5.N.4), the pre-specified regressions (§ 5.N.6), and the ten prohibited injection designs (§ 8.3)"
  - phase: 141-package-unit-test-coverage-test-unit-invariant-guard
    provides: "The `test:unit` script on `packages/dev-seed` used as this plan's package-level gate, and `141-ASSERT10-LEDGER.md` as the ledger document skeleton"
provides:
  - "142-NEGATIVE-CONTROL-LEDGER.md — the phase's evidence ledger, all 12 corpus rows plus supplementary row 5s, written before the phase's first injection"
  - "F20-4 remediated: exact-string assertion on the recorded `.select(...)` argument, with a measured RED under 139 § 5.13.2"
  - "F18 remediated: locale-block-boundary assertion against freshly-seeded per-locale Fakers, with a measured RED on two independent axes under 139 § 5.6.2"
  - "Proven loop mechanics (pre-gate → inject by content → run to an out-of-repo log → revert → three-condition post-gate → ledger row) for the eleven remaining findings"
affects: [142-02, 142-05, 142-01, 142-04, 142-06]

actuals:
  tokens: 15900
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "expect.soft — introduced to this repository for the first time, so one run reports every broken assertion axis instead of aborting at the first"
    - "Injection-independent index derivation: derive boundary indices from the generated corpus, never from the constant the injection mutates"
    - "Evidence ordering: place a strengthened assertion AFTER its redundant siblings so an injected run measures, rather than merely asserts, that the siblings pass and only the new assertion reds"

key-files:
  created:
    - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-NEGATIVE-CONTROL-LEDGER.md
  modified:
    - packages/dev-seed/tests/supabaseAdminClient.test.ts
    - packages/dev-seed/tests/templates/default.test.ts

key-decisions:
  - "F20-4's exact-column assertion lands as `toBe` on a string, not `toEqual` on an array — resolved by measurement (`selectCalls` is `Array<string>`; the builder stub pushes the raw `cols` string), per A-01/D-11 E4"
  - "The three sibling `toContain` matchers at F20-4's site were kept and moved AHEAD of the exact match, converting the zero-collateral claim from a citation into a measurement. Approved by the coordinator as an improvement on the plan and adopted as the phase pattern"
  - "F18's boundary indices derive from `rows.length / 3`, never from `LOCALE_BLOCK_SIZE` — a reasoned exception to D-11 E2's letter that satisfies its intent, recorded inline in the test and in ledger row 6"
  - "`expect.soft` introduced (zero prior uses in the repo) so F18's two independent injection axes are both observable in a single run"
  - "Logs use the plan's `${TMPDIR:-/tmp}/gsd-142` convention rather than the session scratchpad, per the ledger's provenance block; confirmed canonical for the phase by the coordinator"

patterns-established:
  - "Ledger-before-work: all 12 rows written with `pending` measurement cells before the phase's first injection (D-09's ordering guarantee — a finding may be visibly unfilled, never silently absent)"
  - "Citation-vs-measurement clause: every ledger row states whether its OLD half is `cited` (naming 139 § 5.N.4) or `re-run` (naming a log path), so a citation can never read as a measurement taken here"
  - "Axis discipline: only a red naming the strengthened assertion may fill the `NEW-assertion outcome` cell; a TypeError, a sibling, or a collection error is a FAIL to record, not a pass to credit"

requirements-completed: [ASSERT-07]

coverage:
  - id: D1
    description: "142-NEGATIVE-CONTROL-LEDGER.md exists with all 12 corpus rows (plus supplementary row 5s), D-09's nine columns, F17's pre-filled `N/A — by construction` cell, the three `re-run` dispositions, the citation-vs-measurement clause, and a withdrawal count of 0 — committed before the phase's first injection"
    requirement: ASSERT-07
    verification:
      - kind: automated_ui
        ref: "test -f 142-NEGATIVE-CONTROL-LEDGER.md && test -f COVERAGE.md && grep for all 12 finding IDs && grep 'NEW-assertion outcome' && grep 'File outcome' → LEDGER_OK"
        status: pass
      - kind: other
        ref: "grep -nE '^\\| (1|7|9) \\|' → `re-run`; rows 2,3,4,6,8,10,11,12 → `cited — 139 § 5.N.4`; 'Running count: 0'"
        status: pass
    human_judgment: false
  - id: D2
    description: "F20-4 remediated — the exact selected-column string is pinned, and 139 § 5.13.2's recorded injection drives it RED on its own axis"
    requirement: ASSERT-07
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/supabaseAdminClient.test.ts#queries candidates table with project_id eq + external_id like prefix + order by external_id asc"
        status: pass
      - kind: other
        ref: "${TMPDIR}/gsd-142/F20-4-NEW-1.log — AssertionError at supabaseAdminClient.test.ts:169:40, expected/received column-string diff, exit 1 (the negative control; RED is the success signal)"
        status: pass
    human_judgment: false
  - id: D3
    description: "F18 remediated — the locale block boundary is asserted against freshly-seeded per-locale Fakers, and 139 § 5.6.2's recorded injection drives it RED on two independent axes"
    requirement: ASSERT-07
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/templates/default.test.ts#Test 10: faker locale cycling — three equal locale blocks (en/fi/sv), asserted at the boundary"
        status: pass
      - kind: other
        ref: "${TMPDIR}/gsd-142/F18-NEW-1.log — AssertionError at default.test.ts:151:36 (327 vs 109) and :167:43/:168:42 ('Maurice'/'Stokes' vs 'Mikael'/'Hiltunen'), exit 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "Injection hygiene held across both loop iterations: every injection reverted, three-condition post-gate passed before the next began, and the package suite is green on the reverted tree"
    requirement: ASSERT-07
    verification:
      - kind: integration
        ref: "yarn workspace @openvaa/dev-seed test:unit → 43 files / 446 tests passed, exit 0"
        status: pass
      - kind: other
        ref: "git status --porcelain -- apps tests packages → empty; grep -rn 'INJECTED (142)' apps packages tests → no hits"
        status: pass
    human_judgment: false

duration: 12 min
completed: 2026-08-20
status: complete
---

# Phase 142 Plan 03: dev-seed — Ledger + F20-4 + F18 Summary

**Opened Phase 142 with the full 12-row negative-control ledger, then drove both `packages/dev-seed` findings through the inverted HYGIENE-LOOP end to end — F20-4's exact-column assertion and F18's locale-block-boundary assertion each measured RED under the exact regression Phase 139 recorded them staying green against.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-20T18:30:38Z
- **Completed:** 2026-08-20T18:42:44Z
- **Tasks:** 3 of 3
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- **The ledger exists, in full, before the first injection.** `142-NEGATIVE-CONTROL-LEDGER.md` carries all twelve corpus rows plus supplementary row 5s, with D-09's nine columns verbatim and every measurement cell reading `pending`. This is 139's ordering guarantee made concrete: rows owned by later plans are visibly unfilled, never silently absent.
- **F20-4 carries a complete negative-control pair.** `toContain('id')` — which substring-matched `external_id` and so could not see the `id` column being dropped — is now `toBe('id, external_id, first_name, last_name')`. Under 139 § 5.13.2's recorded injection it fails with an expected/received column-string diff at `supabaseAdminClient.test.ts:169:40`, exit 1. Collateral: none.
- **F18 carries a complete negative-control pair, red on two independent axes.** Test 10's `toBeTruthy()` spot-check — satisfied by every locale pack — is now a boundary assertion against freshly-seeded per-locale Fakers. Under 139 § 5.6.2's recorded injection it reds both at `:151:36` (`expected 327 to be 109`) and at `:167:43`/`:168:42` (`'Maurice'`/`'Stokes'` where `fi`'s `'Mikael'`/`'Hiltunen'` is owed).
- **Loop mechanics are proven for the eleven findings behind this plan.** Both iterations ran the full cycle — pre-gate, inject by content, run to a log outside the repo, revert, three-condition post-gate — and both post-gates passed cleanly.

## Task Commits

1. **Task 1: Write the 12-row negative-control ledger in full** — `70a65ff2a` (docs)
2. **Task 2: TRACER — F20-4 end to end through the inverted loop** — `2372935bf` (test, durable edit) + `4fbb21051` (docs, ledger row 10)
3. **Task 3: F18 — the locale block boundary** — `c456a381f` (test, durable edit) + `6857636c5` (docs, ledger row 6)

Each durable edit was committed **before** its injection ran, per RESEARCH § E.2 — otherwise the next iteration's pre-gate would have failed on this plan's own work.

## Files Created/Modified

- `.planning/phases/142-.../142-NEGATIVE-CONTROL-LEDGER.md` — **created.** The phase evidence ledger: provenance block, the INVERSION statement, the citation-vs-measurement clause, the vitest "not doctored" disclosure, the 12-row register, per-row sections, the ten prohibited injection designs, `Withdrawals` (count 0), and `Scoped exceptions to ROADMAP criterion 1` (F17 only).
- `packages/dev-seed/tests/supabaseAdminClient.test.ts` — **modified.** Exact-string `toBe` on the recorded `.select(...)` argument, an A-09 length guard before the `[0]` dereference, and the three sibling `toContain` matchers reordered ahead of the exact match.
- `packages/dev-seed/tests/templates/default.test.ts` — **modified.** Test 10 rewritten as a locale-block-boundary assertion; imports `LOCALE_BLOCK_SIZE` and `__buildLocaleFakerForTests`; `blockSize` derived from `rows.length / 3`; stale "Shape-only assertion" disclaimer deleted; `expect.soft` used so both axes report.

## Decisions Made

**1. F20-4's matcher form: `toBe` on a string.** D-11 E4 left this to the recorded call shape. Measured: `mockState.selectCalls` is declared `Array<string>` (`:28`) and the builder stub pushes the raw `cols` string (`:69-73`), so `selectCalls[0]` is a `string`. `toEqual` on an array is not applicable — there is no array.

**2. Sibling ordering at F20-4's site (an improvement on the plan, coordinator-approved).** The plan called the three redundant `toContain` siblings "cosmetic and out of scope". I kept them **and moved them ahead of** the exact match. The injected run then executes them, they pass, and only the strengthened assertion reds — which converts 139's zero-collateral *analysis* into a *measurement* taken here. The coordinator approved this and directed it be reused wherever a strengthened assertion sits among siblings. Nothing was removed, so no removal note was owed in the ledger.

**3. F18's boundary indices derive from the corpus, not the constant — a reasoned exception to D-11 E2's letter.** E2 says the block size is asserted *from* the constant and never hard-coded twice. That is satisfied: the constant is imported and asserted, and `109` appears nowhere in executable code (verified, count 0). But the **indices** come from `rows.length / 3`, because 139 § 5.6.2's injection *mutates the constant* — constant-derived indices would move with it and the assertion would either compare the 327th `en` draw against itself and pass, or dereference `rows[327]` and red as a `TypeError` on the wrong axis. Both are rows the ledger could not credit. The reasoning is written **inline in the test** with an explicit instruction not to simplify it back, and again in ledger row 6.

**4. `expect.soft` introduced.** Zero prior uses in the repo (`grep -rn 'expect\.soft' apps packages`). A hard `expect` throws on first failure, so only one of F18's two axes would ever have appeared in a log. Soft assertions make "two independent axes" an observation rather than a claim — the verdict run reports three failures from a single test.

**5. Log location.** Used the plan's `${TMPDIR:-/tmp}/gsd-142` convention (resolved: `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-142`) rather than the session scratchpad, because the plan's acceptance criteria and the ledger's provenance block both name it. Both are outside the repo, so D-07's clean-tree rationale holds either way. Logs are additionally mirrored into the session scratchpad. Confirmed canonical for the phase by the coordinator.

## Deviations from Plan

**1. [Improvement, coordinator-approved] Sibling reordering at F20-4's site**
- **Found during:** Task 2 (TRACER — F20-4)
- **Issue:** The plan treated the redundant siblings as cosmetic, which would have left `behavior` bullet 3 ("the siblings remain satisfied under the injection") supported only by 139's prior analysis, not by a measurement taken here.
- **Fix:** Kept all three siblings and placed them ahead of the strengthened assertion, so the injected run demonstrably passes them before reding on `:169`.
- **Files modified:** `packages/dev-seed/tests/supabaseAdminClient.test.ts`
- **Verification:** `${TMPDIR}/gsd-142/F20-4-NEW-1.log` shows `1 failed | 6 passed (7)` with the failure at `:169:40`.
- **Committed in:** `2372935bf`

**2. [Design choice within Claude's Discretion] `expect.soft` introduced for F18**
- **Found during:** Task 3 (F18)
- **Issue:** The plan requires two independent on-axis reds, but a hard `expect` aborts the test at the first failure, so only the constant-versus-derived axis would have been observable.
- **Fix:** Used `expect.soft` for Test 10's assertions. CONTEXT § Claude's Discretion covers "the concrete Faker-seeding mechanics for D-11 E2, provided the boundary property and the `LOCALE_BLOCK_SIZE`-from-constant rule hold" — both hold.
- **Files modified:** `packages/dev-seed/tests/templates/default.test.ts`
- **Verification:** `${TMPDIR}/gsd-142/F18-NEW-1.log` reports all three failures from one test, exit 1; clean-tree runs still exit 0.
- **Committed in:** `c456a381f`

**3. [Required by acceptance criteria] Test 10's title changed**
- **Found during:** Task 3 (F18)
- **Issue:** The acceptance criterion `grep -vE '^\s*(//|\*|/\*)' … | grep -c '109'` must return 0, but the old title (`'Test 10: faker locale cycling — 109 candidates per locale block (en/fi/sv)'`) is executable code containing `109`.
- **Fix:** Retitled to `'Test 10: faker locale cycling — three equal locale blocks (en/fi/sv), asserted at the boundary'`, preserving the `Test 10` prefix so the `-t 'Test 10'` verdict filter still matches exactly one test (confirmed: `1 passed | 26 skipped`).
- **Files modified:** `packages/dev-seed/tests/templates/default.test.ts`
- **Verification:** non-comment `109` count is 0; isolated filter matched exactly 1 test on both the clean and injected trees.
- **Committed in:** `c456a381f`

---

**Total deviations:** 3 (1 coordinator-approved improvement, 1 discretionary design choice, 1 forced by an acceptance criterion).
**Impact on plan:** No scope creep. No product source durably modified, no package installed, no `any` introduced, no assertion weakened. All three changes strengthen the evidence rather than the convenience.

## Issues Encountered

**None that blocked or altered the plan.** Two observations worth recording honestly:

1. **Pre-existing eslint errors in `supabaseAdminClient.test.ts`, not introduced here and not fixed.** Running eslint directly over the file reports `62:9 func-style` and `120:1 import/first`. Both were verified identical at identical line numbers in the pre-change blob (`git show 70a65ff2a:…`), and both sit far from my edit at `:160-169`. The `import/first` one is deliberate and documented in the file ("Imported AFTER the vi.mock so createClient resolves to the mocked module"). The package's own `lint` script is `eslint … src/`, so test files are outside the lint gate entirely. Out of scope per the executor's SCOPE BOUNDARY rule — recorded, not fixed.
2. **F18's Faker replay matched on the first attempt.** RESEARCH § B.6 warned that a mismatch would indicate a hidden draw and would itself be a finding. It did not occur, so 139 § 5.6.6's weaker `ä`/`ö`/`å` character-class fallback was **not** taken. The replay is exact because `makeCtx()` supplies `refs.questions` as `[]` (`packages/dev-seed/tests/utils.ts:36`), which skips the answer-emitter branch at `candidates-override.ts:149`, leaving the two name draws per row as the only draws.

## Evidence — run logs (outside the repository, per D-07)

Resolved `$TMPDIR`: `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/`. HEAD at plan open: `4a8568d8c`; runs taken at `2372935bf` (F20-4) and `c456a381f` (F18) with the injection live in the working tree.

| Log | Purpose | Result |
|---|---|---|
| `gsd-142/F20-4-NEW-0-cleantree.log` | F20-4 pre-injection green | `7 passed`, exit 0 |
| `gsd-142/F20-4-NEW-1.log` | **F20-4 NEW half — the red** | `1 failed \| 6 passed (7)`, exit 1, `:169:40` |
| `gsd-142/F20-4-postrevert.log` | F20-4 post-revert green | `7 passed`, exit 0 |
| `gsd-142/F18-clean-isolated.log` | F18 pre-injection, isolated | `1 passed \| 26 skipped (27)`, exit 0 |
| `gsd-142/F18-clean-wholefile.log` | F18 pre-injection, whole file | `27 passed`, exit 0 |
| `gsd-142/F18-NEW-1.log` | **F18 NEW half — the verdict run** | `1 failed \| 26 skipped (27)`, exit 1, `:151:36` + `:167:43` + `:168:42` |
| `gsd-142/F18-NEW-collateral-1.log` | F18 whole-file collateral record | `1 failed \| 26 passed (27)`, exit 1 |
| `gsd-142/F18-postrevert.log` | F18 post-revert green | `27 passed`, exit 0 |
| `gsd-142/dev-seed-test-unit.log` | Package gate on the reverted tree | `43 passed (43)` files, `446 passed (446)` tests, exit 0 |

## Plan Verification

| Check | Result |
|---|---|
| `git status --porcelain -- apps tests packages` at plan close | **empty** |
| `grep -rn 'INJECTED (142)' apps packages tests` at plan close | **no hits** |
| `yarn workspace @openvaa/dev-seed test:unit` | **exit 0** — 43 files, 446 tests |
| Ledger has 12 rows; rows 6 and 10 have no `pending` cells | **pass** (0 `pending` in rows 6/10; 11 rows still pending — the 10 unowned + row 5s) |
| Both NEW-half logs name the strengthened assertion, not a `TypeError` | **pass** (`TypeError` count 0 in both) |

## User Setup Required

None — no external service configuration required. `COVERAGE.md` records the phase's no-external-API declaration and the empty package-legitimacy audit; no install task exists in this plan.

## Next Phase Readiness

**Ready for `142-02` (wave 2, `argument-condensation`).** The loop mechanics are proven and the ledger is in place with ten rows awaiting their owners.

Three things the next plan should carry forward:

1. **The sibling-ordering pattern** — place a strengthened assertion after its redundant siblings so an injected run measures, rather than cites, that the red is on the right axis. Directed by the coordinator to be reused.
2. **`expect.soft`** is now available and precedented where a finding has more than one injection axis.
3. **Commit every durable edit before injecting.** The pre-gate asserts a clean tree over a tree that legitimately changes in this phase; batching edits to the end would fail the plan's own gate.

**One caution for `142-02` specifically:** F15-B and F15-C **share** an injection site (`condenser.ts:205`, 139 § 5.2.2 / § 5.3.2). They are separate findings with separate ledger rows and must be run as two complete, separate HYGIENE-LOOP iterations — never both live at once. F20-6 additionally has known collateral at `planValidation.test.ts:94` (139 § 8.1 C-1), so its verdict run must be isolated with `-t` and the whole-file result kept in the `Collateral` cell only.

**No blockers.**

---
*Phase: 142-assertion-design-wiring-only-tests-assert-output*
*Completed: 2026-08-20*

## Self-Check: PASSED

All claims verified against disk and git, not asserted from reasoning:

- **Files** — 4/4 present (`142-NEGATIVE-CONTROL-LEDGER.md`, `142-03-SUMMARY.md`, both edited test files).
- **Commits** — 5/5 resolve in `git log --all`: `70a65ff2a`, `2372935bf`, `4fbb21051`, `c456a381f`, `6857636c5`.
- **Logs** — 9/9 present under `${TMPDIR}/gsd-142/`, each the source of the outcome cell that cites it.
- **Tree** — `git status --porcelain -- apps tests packages` empty; no `INJECTED (142)` markers anywhere under `apps packages tests`.
- **Gate** — `yarn workspace @openvaa/dev-seed test:unit` exit 0 (43 files, 446 tests).

Every outcome recorded in this SUMMARY and in ledger rows 6 and 10 is a measured exit code plus the
assertion text that produced it, with its log path. No outcome here was predicted.
