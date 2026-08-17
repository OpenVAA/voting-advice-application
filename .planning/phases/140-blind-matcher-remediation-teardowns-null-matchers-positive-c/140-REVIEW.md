---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c
reviewed: 2026-08-15T22:35:00Z
depth: standard
iteration: 3
files_reviewed: 24
files_reviewed_list:
  - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts
  - packages/dev-seed/src/cli/teardown.ts
  - packages/dev-seed/src/index.ts
  - packages/dev-seed/src/templates/index.ts
  - packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-not-located-2e2cg.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-hide-election-tags.ts
  - packages/dev-seed/tests/cli/allowedTeardownTables.test.ts
  - tests/playwright.config.ts
  - tests/tests/setup/candidate/bank-auth-journey.setup.ts
  - tests/tests/setup/candidate/bank-auth-journey.teardown.ts
  - tests/tests/setup/shared/assertTeardown.ts
  - tests/tests/setup/shared/base.setup.ts
  - tests/tests/setup/shared/base.teardown.ts
  - tests/tests/setup/shared/setupFromTemplate.ts
  - tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts
  - tests/tests/specs/perm/perm-hide-category-tags.spec.ts
  - tests/tests/specs/perm/perm-hide-election-tags.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/utils/supabaseAdminClient.ts
findings:
  critical: 1
  warning: 4
  info: 5
  total: 10
status: issues_found
---

# Phase 140: Code Review Report (iteration 3 — final)

**Reviewed:** 2026-08-15T22:35:00Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

Two jobs: adjudicate iteration 2's 13 `fix(140):` commits against `140-REVIEW.iter3.md`, and hunt
for a second compounding regression across the shared spine (`base.setup.ts`, `base.teardown.ts`,
`playwright.config.ts`) that iteration 2 touched.

**Adjudication verdict: 14 of 15 findings genuinely resolved; IN-05 (the owed E2E gates) remains
open and is still open at the end of this iteration.** Verified against the code, not the report:

- **CR-01 — the *stated* defect is fixed, but the chosen fix carries a new regression (see CR-01
  below).** `base.setup.ts` now sweeps `'e2e-bankauth-'`, which is a genuine string-prefix of
  `e2e-bankauth-notloc-`, so an orphaned bank-auth dataset is cleared before the blocking default
  suite seeds. That half is correct and sufficient on its own. The other half — the new
  `dependencies: ['data-setup-base']` edge — is what this review's blocker is about.
- **WR-01 (stale citations) — RESOLVED for the two cited files, then partially re-broken by the
  IN-02 commit one hour later.** See WR-01 below.
- **WR-02 (LIKE metacharacter guard) — RESOLVED and correctly narrowed.** `countRowsByPrefix` now
  rejects only `*`. The reasoning in the rewritten docblock is right: PostgREST's `like` maps a
  literal `*` to SQL `%` while `bulk_delete`'s `external_id LIKE $2`
  (`00001_initial_schema.sql:2890`) does not, whereas `_` and `%` produce byte-identical patterns on
  both sides and both are `project_id`-scoped, so `rowsDeleted === rowsBefore` survives. The
  `seed_`-leaks-its-dataset failure mode the original guard would have created is gone.
- **WR-03 (guard completeness) — RESOLVED.** The `unparsed` check fires on any `*.teardown.ts` that
  calls `runTeardownAsserted(` without a parseable declaration; the regex was widened to accept
  `export const` and `: string`. Verified live: `npx playwright test --list` → **143 tests in 94
  files**, unchanged, so the new throw does not misfire against the current 27 files.
- **WR-04 (`ALLOWED_TEARDOWN_TABLES`) — RESOLVED with a real check, not prose.** I ran
  `npx vitest run tests/cli/allowedTeardownTables.test.ts` — passes. The regex resolves against the
  real migration (`apps/supabase/supabase/migrations/00001_initial_schema.sql:2853`) and
  `allowed_collections` has exactly one declaration in the file, so the non-greedy match cannot
  bind the wrong array. The `expect(allowedCollections.length).toBeGreaterThan(0)` anti-vacuity
  guard is present. This is the strongest single addition of the two fix iterations.
- **WR-05 / WR-06 / WR-08 / IN-01 / IN-02 / IN-03 — RESOLVED as written.** WR-08's removal of the
  `updateAppSettings({ preRegistration: { enabled: false } })` write is correct and I traced the
  claim it rests on: `setupFromTemplate` step 3 does an authoritative REPLACE before its own
  overlay, and `ALLOWED_TEARDOWN_TABLES` deliberately excludes `app_settings`, so nothing else was
  restoring it either. Leaving `enabled: true` in the DB after a gate run is harmless because
  `data-setup-base` unconditionally REPLACEs at the head of every suite.
- **WR-07 — RESOLVED for the six cited blocks.** All 6 Idura blocks now use
  `await expect(POST(event), '…').rejects.toThrow()`. Verified not vacuous:
  `npx vitest run src/lib/api/utils/auth` → **59/59 pass**, so `POST` genuinely rejects under the
  mock fixture and the assertion would red if it started resolving. Four structurally identical
  blocks survive in the Signicat describe (WR-04 below).
- **WR-09 — the fix was applied as specified but is now INSUFFICIENT, because CR-01's fix landed in
  the same iteration and removed the precondition WR-09's assertion depends on.** This is the
  compounding regression.
- **IN-04 — RESOLVED, and verified byte-for-byte, not by claim.** I extracted the original template
  object literal from `036d21201` and the factory's `return { … }` body and diffed them: they are
  **identical apart from the opening line and the trailing `};` vs `}`**. Every nested FK reference
  is `${P}`-built, `generateTranslationsForAllLocales: false` is preserved (so 4-locale expansion
  behaviour is unchanged for both consumers), `buildOrganizations()`/`buildQuestionCategories()`
  still emit bare ids the writer prefixes, and both templates are registered in `BUILT_IN_TEMPLATES`
  and re-exported. `tsc -p packages/dev-seed/tsconfig.json --noEmit` clean.

**Static verification performed this iteration:** `npx tsc -p tests/tsconfig.json --noEmit` clean;
`npx tsc -p packages/dev-seed/tsconfig.json --noEmit` clean; `npx playwright test --list` → 143/94;
`PLAYWRIGHT_BANK_AUTH=1 npx playwright test --list --project=bank-auth-journey` → **5 tests in 5
files** (see CR-01 — this is the load-bearing measurement); `vitest` on the auth suite 59/59 and on
the new dev-seed test 1/1; 28 `data-teardown-*` projects and 28 `retries: 0` keys, matched.
I also read Playwright 1.58.2's `createPhasesTask` (`node_modules/playwright/lib/runner/tasks.js:302-320`)
and `buildDependentProjects` (`projectUtils.js:124-146`) directly rather than reasoning from the
docs, because the DAG semantics are what both CR-01 arguments turn on.

**Per the prompt, the `setupFromTemplate` `extraTeardownPrefix` pre-clear race is NOT re-raised** —
iteration 2 disproved it from `140-MEASUREMENT.md` § 5.2.

## Settling the CR-01 disagreement (iteration 1 vs iteration 2 on A4)

**Iteration 2 is right on A4; iteration 1's objection does not apply to the edge that was actually
added.** The two agents were arguing about different edges. Iteration 1 evaluated
`dependencies: ['perm-not-located-2e2cg']` and correctly refused it — that edge pulls the entire
perm serial chain into the isolated gate. Iteration 2 added `dependencies: ['data-setup-base']`,
which is a different edge, and the source of A4 supports it: `122-RESEARCH.md:318` states A4 as
"an opt-in-isolated project (own setup, **like `bank-auth`**), NOT threaded into the perm serial
chain", and the sibling `bank-auth` project has carried `dependencies: ['data-setup-base']` since
Phase 122 (`playwright.config.ts:415`). Nothing in `IDURA-TEST-RUNBOOK.md` Step B-3 forbids a base
dependency; Step B-3's only stated precondition is a fresh dev server plus `yarn db:reset`.

**But A4 was never a claim about data cleanliness, and that is where the edge does damage.** A4
constrains the *project graph*; it says nothing about what rows are in the DB when the journey
walks. Neither agent evaluated that, and it is what CR-01 below is about. Note also that the edge
is **not required** for the self-healing that iteration 2's CR-01 was raised about: `base.setup`'s
new `'e2e-bankauth-'` sweep restores it in the default suite on its own, and the bank-auth setup's
own `setupFromTemplate` step-1b pre-clear (`runTeardown('e2e-bankauth-notloc-')`) already clears the
namespace inside the opt-in run. The edge bought ordering, not sweeping.

## Critical Issues

### CR-01: The new `data-setup-base` edge seeds a foreign dataset into the bank-auth journey, and the journey selects `.first()` — so the owed 3× determinism gate now preregisters into a base election and WR-09's identity assertion cannot see it

**File:** `tests/playwright.config.ts:439-455` (the `dependencies: ['data-setup-base']` edge),
`tests/tests/fixtures/candidate/candidatePreregisterPage.fixture.ts:93-119`,
`tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts:145-153`
**Introduced by:** commit `c592f3f96` (iteration 2's CR-01 fix), interacting with commit `5e08e0fb0`
(iteration 2's WR-09 fix)

**Issue:** This is the second compounding regression — two fixes from the *same* iteration, each
defensible alone, that cancel each other.

Measured, not inferred:

```
$ PLAYWRIGHT_BANK_AUTH=1 npx playwright test --list --project=bank-auth-journey -c tests/playwright.config.ts
  [data-teardown-bank-auth-journey] › setup/candidate/bank-auth-journey.teardown.ts
  [data-teardown-base]              › setup/shared/base.teardown.ts
  [data-setup-base]                 › setup/shared/base.setup.ts
  [data-setup-bank-auth-journey]    › setup/candidate/bank-auth-journey.setup.ts
  [bank-auth-journey]               › specs/candidate/candidate-bank-auth-journey.spec.ts
Total: 5 tests in 5 files
```

The runbook's isolated gate now seeds the **base dataset** (`test-e2e-base-*`, 2 elections) before
the bank-auth dataset (`e2e-bankauth-notloc-*`, 2 elections). Four elections are then live in the
shared DB when the journey walks. Three facts make that fatal to the gate's meaning:

1. **The preregister page renders every election in `dataRoot`.**
   `preregister/(authenticated)/elections/+page.svelte:31` passes `candCtx.dataRoot.elections`
   straight into `ElectionSelector`, which `{#each}`es all of them.
2. **The fixture selects positionally, not by identity.** `submitElection()` takes
   `list.getByTestId('election-selector-option').first()`; `submitConstituency()` takes
   `selectFirstConstituencyOption` on every combobox. Neither asserts which row it picked.
3. **There is no tiebreak on the ordering.**
   `supabaseDataProvider.ts:140-142` issues `.order('sort_order')` with no secondary key. Base's
   `test-e2e-base-el-reg` has `sort_order: 0` (`base.ts:415`) and the bank-auth template's `el-1`
   has `sort_order: 0` (`notLocated2e2cgShape.ts:72`). Postgres returns tied rows in plan-dependent
   order; with base inserted first, the first option is overwhelmingly likely to be
   `[el-reg] Regional Election` — a row the bank-auth journey does not own.

So the journey preregisters into the **base** election and constituency, and still passes: step 6
(`candidate-bank-auth-journey.spec.ts:195-233`) asserts only that an `auth.users` +
`candidates` + `user_roles` cascade exists, with nothing election-scoped. I confirmed no nomination
row is created by the preregister path (no `nominations` write in
`apps/frontend/src/routes/api/candidate/preregister/+server.ts` or the `identity-callback` Edge
Function), so there is no FK failure to make this loud — it is silent.

**WR-09's fix cannot catch this.** `toContainText('[EL1]')` asserts the bank-auth dataset is
*present in the list*; it says nothing about which option `submitElection()` then checks. The
finding WR-09 raised — "the gate could pass three times without ever exercising the dataset it was
built for" — is now not a hypothetical about a dirty DB. It is the guaranteed steady state of a
clean `yarn db:reset` run, created by a fix committed 20 minutes earlier in the same iteration.

Secondary confirmation from the same root cause: `probeFreshDatabasePrecondition`
(`setupFromTemplate.ts:97-127`) filters only `${prefix}%` and `seed_%`, so the bank-auth setup now
finds base's candidates and organizations on **every** gate run and emits
`[setupFromTemplate] Database is NOT fresh …`. That also means `E2E_REQUIRE_FRESH_DB=true` — the
hardening iteration 2's own review offered as the alternative WR-09 remedy — would now make the
bank-auth setup *throw* and the gate hard-fail. The knob and the gate became mutually exclusive.

Per CLAUDE.md's cardinal rule and this phase's own thesis, shipping a gated E2E journey that cannot
fail for the reason it claims — in the phase whose entire purpose is removing exactly that — is a
blocker.

**Fix (preferred — spec/fixture level, correct with or without the edge):** select by identity, not
by position. This is strictly stronger than the `toContainText` assertion and replaces it.

```ts
// tests/tests/fixtures/candidate/candidatePreregisterPage.fixture.ts
async submitElection(labelSubstring: string): Promise<void> {
  const list = page.getByTestId(testIds.candidate.preregister.electionsList);
  // Select the option whose LABEL identifies the seeded dataset. `.first()` is
  // positional and the provider orders by `sort_order` with no tiebreak, so with
  // any other dataset in the shared DB it silently picks a foreign election
  // (Phase 140 review iter-3 CR-01).
  const option = list
    .getByTestId('election-selector-option-label')
    .filter({ hasText: labelSubstring })
    .getByTestId('election-selector-option');
  await expect(option, `no election matching '${labelSubstring}' is offered`).toHaveCount(1);
  if (!(await option.isDisabled())) await option.check();
  await page.getByTestId(testIds.candidate.preregister.electionsSubmit).click();
}
```

```ts
// candidate-bank-auth-journey.spec.ts, step 2 — replaces the toContainText assertion
await candidatePreregisterPage.submitElection('[EL1]');
```

and apply the same identity scoping in `submitConstituency()` (assert the rendered combobox belongs
to `[CG1]`, or assert the selected option text starts with `[CO1`).

**Alternative (config level, if you prefer to restore the gate's isolation instead):** drop
`dependencies: ['data-setup-base']` and keep `base.setup.ts`'s `'e2e-bankauth-'` sweep, which is the
half that actually fixes iteration 2's CR-01. Be aware this reinstates the pre-iteration-2 state
where `data-setup-base` and `data-setup-bank-auth-journey` share phase 1 under
`PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e` and race on the `app_settings` singleton (WR-03 below), so
prefer the fixture fix if you can only do one. Doing **both** is the correct end state.

## Warnings

### WR-01: The IN-02 commit re-planted a stale line citation in the same docblock the WR-01 commit had just de-lined, one hour earlier, in the same iteration

**File:** `tests/tests/setup/shared/assertTeardown.ts:94-96`

**Issue:** Commit `9d1366c3a` (WR-01) replaced four line citations with symbol references and the
docblock now states, as its own rationale, that "line-number citations into `setupFromTemplate.ts`
go stale on that file's first edit" (`assertTeardown.ts:46-47`). Commit `b5d91844c` (IN-02) then
inserted the exported `assertTeardownPrefix` into `packages/dev-seed/src/cli/teardown.ts` at
lines ~106-126, shifting everything below — and the WHAT IT DOES NOT CATCH paragraph still reads:

> `runTeardown` returns `{ rowsDeleted, storageRemoved }`
> (`packages/dev-seed/src/cli/teardown.ts:126-132`)

Lines 126-132 are now the closing brace of `assertTeardownPrefix` plus the `runTeardown` docblock.
The storage code the sentence points at is at `:155-160`. (The sibling `:65-67` citation in the same
docblock survives by luck — the insertion landed below it.)

This is not cosmetic given the file's stated role. It is the fourth time in three iterations that a
line citation in this one docblock has gone stale, and the third of those was self-inflicted inside
the fix batch that de-lined it.

**Fix:** finish the job the WR-01 commit started — cite by symbol.

```
 *   - Portrait STORAGE cleanup (Phase 140 IN-03). `runTeardown` returns
 *     `{ rowsDeleted, storageRemoved }` (`runTeardown` in
 *     `packages/dev-seed/src/cli/teardown.ts`); this function only destructures
 *     `rowsDeleted`.
```

and likewise for `:65-67` → "`ALLOWED_TEARDOWN_TABLES`'s own docblock in `teardown.ts`".

---

### WR-02: `playwright.config.ts`'s bank-auth block still asserts "STANDS ALONE — it pulls ONLY its own data-setup", which the config it annotates now contradicts

**File:** `tests/playwright.config.ts:425-427`, and the un-updated `tests/IDURA-TEST-RUNBOOK.md`
Step B-3 / `tests/README.md` opt-in table

**Issue:** Fourteen lines above the new `dependencies: ['data-setup-base']` edge, the block comment
still reads:

> OPT-IN (PLAYWRIGHT_BANK_AUTH) and STANDS ALONE — it pulls ONLY its own data-setup, NOT the perm
> serial chain

`--list` disproves the first clause: the gate pulls five projects, including `data-setup-base` and
`data-teardown-base`. The second clause is still true. The new comment on the project entry
(`:441-454`) explains the edge honestly, so the file now says two contradictory things ten lines
apart, and the FALSE one is the one positioned as the block's summary — which is the sentence a
future reader takes their model from. This is the exact defect class CR-02 was raised for in
iteration 1 (a claim positioned to be trusted that the code falsifies), reintroduced.

The operator-facing docs have the same gap: `IDURA-TEST-RUNBOOK.md` Step B-3 describes the gate as
one project run against a `db:reset` DB and does not mention that the base dataset is now seeded
first — which is precisely the fact an operator needs to interpret CR-01's symptom.
`tests/README.md`'s opt-in table never listed `bank-auth-journey` at all.

**Fix:**

```
    // OPT-IN (PLAYWRIGHT_BANK_AUTH). It does NOT join the perm serial chain
    // (RESEARCH A4/Pitfall 3), but as of Phase 140 CR-01 it DOES depend on
    // `data-setup-base` — mirroring the sibling `bank-auth` project — so the
    // isolated `--project=bank-auth-journey` gate runs 5 projects (base setup,
    // this setup, the spec, both teardowns) and the base dataset IS present in
    // the DB while the journey walks. See the spec's election-identity
    // assertions: positional `.first()` selection is not safe under that.
```

and add a one-line note to `IDURA-TEST-RUNBOOK.md` Step B-3 plus a `bank-auth-journey` row to
`tests/README.md`'s opt-in table.

---

### WR-03: The edge moved `data-setup-bank-auth-journey` into the same execution phase as `voter-journey`, so its `app_settings` REPLACE now fires *during* a running spec instead of before it

**File:** `tests/playwright.config.ts:439-455` vs `:533-541` (`voter-journey`), `:382-398`
(`performance`, `a11y-smoke`), `:966-971` (`data-setup-candidate-journey`)

**Issue:** Playwright 1.58.2 groups projects into phases by "all dependencies already processed"
(`node_modules/playwright/lib/runner/tasks.js:302-320`) and dispatches every project in a phase to
the shared worker pool together. Before commit `c592f3f96`, `data-setup-bank-auth-journey` had no
`dependencies` and therefore sat in **phase 1** — it completed before `voter-journey` began. After
the edge, its dependency set is `['data-setup-base']`, which is byte-identical to
`voter-journey`'s, `performance`'s, `a11y-smoke`'s and `data-setup-candidate-journey`'s. All five
now enter the **same phase** and run concurrently at `workers: 6` / `fullyParallel: true`.

Under `PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e` (which `tests/README.md:67` documents, with the
`SUPABASE_*` keys the collection-time throw requires), the bank-auth setup's authoritative
`app_settings.settings` REPLACE + `preRegistration` overlay (`setupFromTemplate.ts` step 3) plus a
2-election / 8-candidate / 16-nomination `bulk_import` now execute *while voter-journey is walking*.
The config's own architecture note (`:191-197`) states that clobbering the `app_settings` JSONB
singleton is the entire reason the perm family is serialised and must not interleave with the
journey chains. The edge created a new interleaving of exactly that shape.

Related: `base.teardown.ts:22-24`'s newly-written safety claim — "every setup completes before any
teardown runs" — is derived from a **default-suite** `results.json` (`140-MEASUREMENT.md` § 5.2) and
does not hold in this invocation, where `data-teardown-bank-auth-journey` fires long before the perm
setups finish. That is harmless today only because the prefixes are disjoint, which is a different
reason from the one the docblock gives.

**Fix:** either declare the combination unsupported and make it fail loudly, or order it. The cheap
correct form is the latter — give the bank-auth setup an ordering edge past the journey leaves when
the full suite is in play, mirroring how the perm family is kept out of the journeys' way:

```ts
{
  name: 'data-setup-bank-auth-journey',
  testMatch: /bank-auth-journey\.setup\.ts/,
  teardown: 'data-teardown-bank-auth-journey',
  // `data-setup-base` alone puts this project in the SAME phase as voter-journey /
  // performance / a11y-smoke (identical dependency set → identical phase, see
  // playwright/lib/runner/tasks.js createPhasesTask), so its authoritative
  // app_settings REPLACE would land mid-spec under `PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e`.
  // Depending on the journey LEAVES orders it after them without joining the perm
  // serial chain (A4 preserved).
  dependencies: ['voter-journey', 'candidate-journey']
}
```

(Note this changes what the isolated `--project=bank-auth-journey` gate pulls, so weigh it against
CR-01's alternative remedy; if you take CR-01's "drop the edge" option instead, record in the block
comment that the phase-1 co-scheduling with `data-setup-base` is a known, accepted limitation of the
undocumented full-suite-plus-bank-auth invocation.)

---

### WR-04: Four `try { await POST(event) } catch {}` swallows remain in `token-endpoint.test.ts`, so one file now treats the identical pattern two different ways

**File:** `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:279-283, 298-302,
317-321, 336-340`

**Issue:** The six Idura blocks were converted to `.rejects.toThrow()`; the four structurally
identical blocks in the Signicat describe were deliberately left, on the grounds that the finding
named six. The result is a single file where the same construct is a hard rejection assertion above
line 260 and a silent swallow below it, with no comment marking the boundary or the reason. A
future author reading the file bottom-up will reasonably copy the swallow.

The substantive gap is unchanged for those four: each discards every rejection from the call under
test, so they cannot distinguish "the handler threw at `getIdTokenClaims` as intended" from "the
handler threw during argument construction before `fetch` was reached", and `:279-283`'s own
`// Expected: getIdTokenClaims fails on mock token` comment asserts the former without checking it.

**Fix:** apply the same conversion; the mechanism is proven (all 10 tests in the file pass with the
6 converted, so `POST` genuinely rejects under this fixture):

```ts
await expect(POST(event), 'POST should reject at getIdTokenClaims on the mock token').rejects.toThrow();
```

If they are intentionally out of scope for this phase, say so at the top of the Signicat describe
with a pointer, so the inconsistency reads as a decision rather than an oversight.

## Info

### IN-01: `allowedTeardownTables.test.ts` checks `allowed_collections`, but `bulk_delete` deletes via `delete_order`

**File:** `packages/dev-seed/tests/cli/allowedTeardownTables.test.ts:44`,
`apps/supabase/supabase/migrations/00001_initial_schema.sql:2845-2858`
**Issue:** `bulk_delete` validates the caller's collection names against `allowed_collections` but
performs the deletes by iterating a *separate* array, `delete_order`. They happen to hold the same
11 names today. If a table were added to `allowed_collections` only, this test would fail and
instruct an author to add it to `ALLOWED_TEARDOWN_TABLES` — after which the probe would count that
table's rows while `bulk_delete` never deletes them, reddening `rowsDeleted === rowsBefore` at every
one of the 27 sites. The check is correct for the drift it was written for, but points at the
declaration that governs *validation* rather than the one that governs *deletion*.
**Fix:** assert against the intersection, and assert the two SQL arrays agree:
`expect(parseArray('delete_order').sort()).toEqual(parseArray('allowed_collections').sort())`.

### IN-02: The teardown-prefix guard only enumerates `tests/tests/setup/**`

**File:** `tests/playwright.config.ts:158-170`
**Issue:** The completeness check WR-03 added closes the "declaration shape it cannot parse" hole,
but the enumeration itself is still directory-scoped to `TESTS_DIR/setup`. The teardown projects'
`testMatch` patterns (e.g. `/base\.teardown\.ts/`) are unanchored and match anywhere under the
inherited `testDir`, so a `*.teardown.ts` placed outside `setup/` would be picked up by Playwright
and invisible to the guard — the same enumeration-drift shape as F4, one level up from where WR-03
fixed it.
**Fix:** enumerate from `TESTS_DIR` rather than `TESTS_DIR/setup`, or throw if any `*.teardown.ts`
exists outside `setup/`.

### IN-03: `.rejects.toThrow()` asserts that *something* threw, not that the documented thing threw

**File:** `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:139, 155, 172, 187,
205, 230`
**Issue:** Applied exactly as iteration 2's review specified, and it is a genuine strengthening (the
test now reds if `POST` starts *resolving*). But the message asserts a specific failure point —
"POST should reject at getIdTokenClaims on the mock token" — that the bare `toThrow()` does not
check. An unrelated early throw satisfies it while the message misattributes the cause.
**Fix:** pass a matcher: `.rejects.toThrow(/id_token|claims|jwt/i)`, or assert the guard first
(`expect(capturedFetchBody).not.toBeNull()`) so a pre-`fetch` throw is distinguishable.

### IN-04: Two residual doc defects in the files this phase rewrote

**File:** `tests/tests/setup/shared/assertTeardown.ts:27`;
`tests/tests/specs/perm/perm-hide-category-tags.spec.ts:45` and
`perm-hide-election-tags.spec.ts:45`
**Issue:** (a) The NOT-covered paragraph says "see WR-03 above", but the `rowsBefore > 0`
conditionality it refers to appears ~40 lines *below* it in the docblock. (b) The two positive-control
comments added in iteration 1 cite `voterNavigation.ts:50-76` by line — accurate today (I checked;
the RESIDUAL EXPOSURE paragraph spans 49-76), but contrary to the cite-by-symbol rule WR-01
established in the same phase.
**Fix:** "see WHAT IT CATCHES ONLY WHEN `rowsBefore > 0` below"; and cite `advanceClick`'s docblock
in `voterNavigation.ts` by symbol.

### IN-05: The E2E gates are owed for the third consecutive iteration

**File:** n/a (process)
**Issue:** No suite run has happened since `036d21201`, across 26 commits and three reviews. Every
verdict in all three reviews — including CR-01 above — is static. CR-01 in particular predicts a
*passing* run that tests the wrong data, so a green gate will not discharge it on its own.
**Fix:** see Residual Risk below.

## Residual Risk

**What a human should look at before this phase closes.**

1. **CR-01 is the only thing that must be decided by a person.** The fix is a choice between two
   shapes (identity-based selection in the preregister fixture, vs. dropping the `data-setup-base`
   edge and accepting phase-1 co-scheduling), and the right answer depends on whether you intend
   `PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e` to be a supported invocation at all. If you decide it is
   not, say so in `playwright.config.ts` and WR-03 collapses to a doc fix.
2. **A green bank-auth gate will not clear CR-01.** The predicted failure mode is a *pass* on the
   wrong dataset. To discharge it empirically you must look at which election the walk selected —
   easiest via a trace (`--trace on`) or by temporarily asserting the selected option's label.
3. **The three doc-truth findings (WR-01, WR-02, IN-04) are cheap and worth doing** precisely
   because this phase's deliverable is "claims that cannot be silently false". Leaving a false
   summary comment on the bank-auth block is the phase contradicting itself in its own artefact.
4. **WR-04 is a judgement call** — either convert the four Signicat blocks or mark them as
   deliberately out of scope. Do not leave the file half-converted and unannotated.
5. **Nothing found in this iteration risks data loss or a security exposure.** The
   `NODE_TLS_REJECT_UNAUTHORIZED=0` and committed self-signed cert remain correctly confined to the
   opt-in run and the scratch env file; no secret, injection, or authz defect was found in the
   reviewed surface.

**E2E commands that must be run to discharge the owed gates (IN-05):**

```bash
# Gate 1 — the blocking default suite. Must be cardinal-clean (no failures, no
# "did not run"). One FRESH dev server on :5173; no stale server stealing the port.
yarn db:reset
yarn dev                      # separate terminal, leave running
yarn test:e2e

# Gate 2 — the bank-auth 3x determinism gate (IDURA-TEST-RUNBOOK.md Step B-3).
# Terminal 1, per Step B-1/B-2:
yarn db:reset
source /tmp/eflow10b.env      # IdP env + scoped TLS bypass, derived from testKeys.ts
yarn dev                      # plus: supabase functions serve --no-verify-jwt (identity-callback)
# Terminal 2, run this THREE times, with `yarn db:reset` between runs:
source /tmp/eflow10b.env
PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth-journey -c tests/playwright.config.ts

# Gate 3 — CR-01-specific. Re-run gate 2 once with a trace and confirm from the
# trace which election-selector option step 2 actually checked:
PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth-journey --trace on -c tests/playwright.config.ts
npx playwright show-trace test-results/*/trace.zip
```

Also worth confirming during gate 2, per iteration 2's own owed list: that `perm-bankauth-notloc`
seeds and tears down cleanly against a real Supabase, that the 28 `retries: 0` additions do not
surface a latent teardown transient, and that removing the `preRegistration` reset from the
bank-auth teardown leaves no stale `true` visible to a subsequent run before `data-setup-base`
REPLACEs.

---

_Reviewed: 2026-08-15T22:35:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard — iteration 3 (final; adjudication + compounding-regression hunt)_
