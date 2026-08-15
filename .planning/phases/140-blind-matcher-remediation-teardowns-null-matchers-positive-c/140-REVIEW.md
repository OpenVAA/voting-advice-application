---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c
reviewed: 2026-08-15T18:45:00Z
depth: standard
files_reviewed: 40
files_reviewed_list:
  - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts
  - packages/dev-seed/src/cli/teardown.ts
  - packages/dev-seed/src/index.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-hide-election-tags.ts
  - tests/playwright.config.ts
  - tests/tests/setup/candidate/bank-auth-journey.teardown.ts
  - tests/tests/setup/perm/perm-1e1cg1co.teardown.ts
  - tests/tests/setup/perm/perm-2e-asymmetric.teardown.ts
  - tests/tests/setup/perm/perm-2e-shared.teardown.ts
  - tests/tests/setup/perm/perm-access-disable.teardown.ts
  - tests/tests/setup/perm/perm-analytics-tracking.teardown.ts
  - tests/tests/setup/perm/perm-answers-locked.teardown.ts
  - tests/tests/setup/perm/perm-disable-allow-open.teardown.ts
  - tests/tests/setup/perm/perm-disable-election-1co.teardown.ts
  - tests/tests/setup/perm/perm-disable-election-2co.teardown.ts
  - tests/tests/setup/perm/perm-disjoint-1co.teardown.ts
  - tests/tests/setup/perm/perm-header-show-help.teardown.ts
  - tests/tests/setup/perm/perm-hide-all-nominations.teardown.ts
  - tests/tests/setup/perm/perm-hide-category-tags.teardown.ts
  - tests/tests/setup/perm/perm-hide-election-tags.teardown.ts
  - tests/tests/setup/perm/perm-hide-hero.teardown.ts
  - tests/tests/setup/perm/perm-hide-if-missing-answers.teardown.ts
  - tests/tests/setup/perm/perm-interactive-info.teardown.ts
  - tests/tests/setup/perm/perm-localisation-positive.teardown.ts
  - tests/tests/setup/perm/perm-missing-nominations.teardown.ts
  - tests/tests/setup/perm/perm-not-located-2e2cg.teardown.ts
  - tests/tests/setup/perm/perm-org-matching.teardown.ts
  - tests/tests/setup/perm/perm-per-app-notifications.teardown.ts
  - tests/tests/setup/perm/perm-question-video.teardown.ts
  - tests/tests/setup/perm/perm-show-feedback-survey.teardown.ts
  - tests/tests/setup/perm/perm-startfromcg.teardown.ts
  - tests/tests/setup/shared/assertTeardown.ts
  - tests/tests/setup/shared/base.teardown.ts
  - tests/tests/specs/perm/perm-hide-category-tags.spec.ts
  - tests/tests/specs/perm/perm-hide-election-tags.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/utils/supabaseAdminClient.ts
findings:
  critical: 2
  warning: 8
  info: 4
  total: 14
status: issues_found
---

# Phase 140: Code Review Report

**Reviewed:** 2026-08-15T18:45:00Z
**Depth:** standard
**Files Reviewed:** 40
**Status:** issues_found

## Summary

Phase 140 remediated four "blind matcher" findings. The three null-blind auth matchers (F19) are
correctly repaired — `toEqual(expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/))` genuinely reds on
`null` where `toBeDefined()` did not, and the regex is *stricter* than the `split('.').length === 3`
check it replaced. Verified green: `yarn vitest run` over the three files, 32/32 pass. The
config-load soft-assertion budget guard is real (the declared 136 is the file's true occurrence
count, verified by independent grep) and the config loads cleanly (`--list` → 143 tests in 94 files,
no throw). `eslint --flag v10_config_lookup_from_file tests` and `tsc -p tests/tsconfig.json` are
both clean; dev-seed unit tests 444/444 pass. Both template edits are sound — I traced
`getElectionsToShow` → `QuestionHeading.svelte:81`, the perm baseline `shared.ts:110`
(`showElectionTags: true`), and the elections page default-select-all
(`elections/+page.svelte:66-68`) and confirmed the two positive-control preconditions actually hold.
I also verified against `00001_initial_schema.sql:2886-2894` that the probe's `LIKE prefix || '%'`
+ `project_id` scoping is byte-identical to what `bulk_delete` executes, and that `nominations`'
self-referential `ON DELETE CASCADE` (`:738`) cannot undercount `ROW_COUNT` (RI cascade triggers
fire *after* the outer statement completes).

That said, the shared teardown helper — the phase's headline deliverable, and the file whose whole
purpose is to be an *honest* guard — ships two coverage claims that are structurally impossible, and
the newly load-bearing `rowsAfter === 0` assertion turns a pre-existing prefix collision into a
nondeterministic red. Those are the two blockers. Everything else is quality/robustness.

The dominant theme across the findings: the remediation is honest about *some* of its limits
(`assertTeardown.ts:36-39` names the PREFIX-typo hole) but overstates others, and the phase's own
measurement shows the strengthened matcher is 0-vs-0 at ~25 of 27 sites — i.e. it still cannot fail
for the reason it claims at the overwhelming majority of the places it was deployed.

## Critical Issues

### CR-01: `e2e-perm-notloc-` is owned by two unordered teardown projects — the new `rowsAfter === 0` / `rowsDeleted === rowsBefore` assertions make the collision fail nondeterministically

**File:** `tests/tests/setup/candidate/bank-auth-journey.teardown.ts:26,32` and `tests/tests/setup/perm/perm-not-located-2e2cg.teardown.ts:10,14`
**Also:** `tests/tests/setup/shared/assertTeardown.ts:61-78`

**Issue:** Of the 27 routed call sites, 26 prefixes are unique; exactly one is duplicated. Both
`bank-auth-journey.teardown.ts` and `perm-not-located-2e2cg.teardown.ts` declare
`const PREFIX = 'e2e-perm-notloc-'`, and both now run the same before/after accounting through
`runTeardownAsserted`. The two projects are *not* ordered relative to each other:
`data-setup-bank-auth-journey` (`tests/playwright.config.ts:316-320`) declares **no** `dependencies`
and is documented as standing alone ("STANDS ALONE — it pulls ONLY its own data-setup, NOT the perm
serial chain"), while `data-teardown-perm-not-located-2e2cg` is deferred off its own setup. Under
`PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e` both exist, and locally `workers: 6` /
`fullyParallel: true` allow them to be scheduled concurrently.

Two concrete red paths, both new in this phase:

1. Two concurrent teardowns, same prefix. A counts `rowsBefore = N`; B counts `rowsBefore = N`;
   A's `bulk_delete` wins and returns N; B's returns 0. B fails `expect(0).toBe(N)` with a message
   that blames "the delete accounted for none or only some of them" — pointing at a nonexistent
   `bulk_delete` bug.
2. A teardown racing the bank-auth *setup*. `bank-auth-journey.setup.ts:47-50` seeds the same
   `e2e-perm-notloc-` prefix (and pre-clears `['test-', 'e2e-perm-']`, i.e. the entire perm namespace
   plus the base dataset). A seed landing between `runTeardown` and the second
   `countRowsByPrefix` makes `rowsAfter > 0` → red. A pre-clear landing between the *first*
   `countRowsByPrefix` and `runTeardown` makes `rowsDeleted < rowsBefore` → red.

Before this phase the collision was latent — `toBeGreaterThanOrEqual(0)` passed regardless. It is now
load-bearing. Per the project's cardinal E2E rule ("a test that fails intermittently is a real
defect… not skipped, retried-until-green, or annotated as flaky"), shipping a newly flaky teardown
into a gated configuration (the bank-auth 3× determinism gate) is a blocker.

**Fix:** Give the bank-auth journey its own namespace so no two projects can own one prefix, and
stop it wiping the perm/base namespaces it does not own:

```ts
// packages/dev-seed/src/templates/index.ts — register a distinct alias, or
// tests/tests/setup/candidate/bank-auth-journey.setup.ts
await setupFromTemplate('perm-not-located-2e2cg', {
  externalIdPrefix: 'e2e-bankauth-notloc-',   // own namespace, not the perm one
  extraTeardownPrefix: [],                    // do NOT pre-clear 'test-' / 'e2e-perm-'
  appSettingsOverride: { preRegistration: { enabled: true } }
});

// tests/tests/setup/candidate/bank-auth-journey.teardown.ts
const PREFIX = 'e2e-bankauth-notloc-';
```

If re-namespacing is out of scope, the minimum viable fix is to order the two chains
(`dependencies: ['perm-not-located-2e2cg']` on `data-setup-bank-auth-journey`) **and** add a
prefix-uniqueness check to the config alongside the existing ORPHAN-PROBE and SOFT-ASSERTION guards,
so a future duplicate cannot be introduced silently:

```ts
// tests/playwright.config.ts — mirror the two existing config-load guards
const prefixes = fs.readdirSync(..., { recursive: true })
  .filter((f) => f.endsWith('.teardown.ts'))
  .map((f) => [f, /^const PREFIX = '([^']+)'/m.exec(fs.readFileSync(f, 'utf8'))?.[1]]);
// throw when any prefix appears twice, or when one is a string-prefix of another
```

---

### CR-02: `assertTeardown.ts` documents two catches the assertion is structurally incapable of making — a fake-guard claim shipped by the fake-guard-removal phase

**File:** `tests/tests/setup/shared/assertTeardown.ts:33-39` (and `:7-8`)

**Issue:** The docblock's "WHAT IT CATCHES" list is:

> a silently no-opping `bulk_delete`, **a table dropped from `ALLOWED_TEARDOWN_TABLES`**, a scoping
> bug that sends the RPC a different prefix from the one counted.

The middle item cannot happen. `countRowsByPrefix`
(`tests/tests/utils/supabaseAdminClient.ts:263`) iterates *that same constant*, and the design note
at `:245-248` states this explicitly as the drift-prevention rationale ("the SAME list
`runTeardown`'s `bulkDelete` clears — so the probe cannot drift from the delete it measures"). Drop
`nominations` from `ALLOWED_TEARDOWN_TABLES` and: `rowsBefore` stops counting nominations,
`bulk_delete` stops deleting them, `rowsDeleted` drops by the same amount, and `rowsAfter` never
looks at the table. The assertion reads a clean `N/N/0` while every nomination row survives. Sharing
the constant *is* the right call for scope-drift, but it makes this exact failure invisible by
construction, and the docblock asserts the opposite.

The same paragraph's remaining two catches are also conditional on `rowsBefore > 0` — see WR-03 —
which the phase's own measurement puts at 1 of 26 observations.

Second false claim, `:7-8`: "Every `*.teardown.ts` project routes through this function." There are
28 `*.teardown.ts` files in `tests/`; `tests/tests/setup/candidate/candidate-journey.teardown.ts`
does not (correctly — it calls no `runTeardown`). "Covered by construction" for a newly added
project therefore does not follow: a new teardown that forgets `runTeardownAsserted` is exactly as
uncovered as before.

This matters more than a normal comment defect because the file's stated ROLE is to be the single
honest owner of the F3 assertion; a future author will size their trust from this paragraph.

**Fix:** Either close the hole or stop claiming it is closed. To close it, pin the probe to an
independent list and assert the two agree, so a table dropped from one side reds:

```ts
// tests/tests/utils/supabaseAdminClient.ts
/** Independent copy — deliberately NOT the delete's list; the assertion below is what keeps them honest. */
const PROBE_TABLES = [
  'nominations', 'questions', 'question_categories', 'candidates', 'factions',
  'alliances', 'organizations', 'constituencies', 'constituency_groups', 'elections'
] as const;

// tests/tests/setup/shared/assertTeardown.ts (or a unit test)
expect(
  [...PROBE_TABLES].sort(),
  'the row-count probe and bulk_delete must cover the same tables'
).toEqual([...ALLOWED_TEARDOWN_TABLES].sort());
```

To merely stop claiming it, move the item into "WHAT IT DOES NOT CATCH" and say why:

```
 * WHAT IT DOES NOT CATCH: a typo in a call site's `PREFIX` constant … ; and a table removed
 * from `ALLOWED_TEARDOWN_TABLES`, because the probe iterates that same constant — both sides
 * go blind together and the site reports a clean N/N/0.
```

And correct `:7-8` to "Every `*.teardown.ts` project that performs a prefix delete routes through
this function (27 of 28; `candidate-journey.teardown.ts` performs no delete)."

## Warnings

### WR-01: The two new positive controls use a non-retrying `.count()` while their sibling absence assertion auto-retries

**File:** `tests/tests/specs/perm/perm-hide-category-tags.spec.ts:39-43`, `tests/tests/specs/perm/perm-hide-election-tags.spec.ts:39-43`

**Issue:** Line 30/31 uses `await expect(locator).toHaveCount(0)` — Playwright's auto-retrying
web-first assertion. Line 39 then drops to `const count = await locator.count()` followed by a
generic `expect(count).toBeGreaterThan(0)`, which is a **single-shot** DOM query with no retry and
no timeout. Any transient state where the `QuestionHeading` `PreHeading` has not flushed yet reds
the run, and per the project's cardinal rule that is a defect, not an acceptable flake. Both specs
sit on the `advanceClick` stack whose own docblock (`tests/tests/utils/voterNavigation.ts:50-76`)
documents a *residual* timing exposure on exactly this path.

The retry was given up for nothing: Playwright's `expect` accepts a message for locator assertions
too, so the message and the retry are not mutually exclusive.

**Fix:**

```ts
await expect(
  page.getByTestId(testIds.shared.electionTag),
  'ASSERT-05 positive control: the perm-hide-category-tags dataset seeds elections: 2 so the complementary election-tag must render on /questions; with none rendered, the category-tag absence assertion above is vacuously satisfied by a heading that renders no tags at all'
).not.toHaveCount(0);
```

(and the mirrored `categoryTag` form in `perm-hide-election-tags.spec.ts`). This keeps the message,
regains the retry, and drops the intermediate `count` variable.

---

### WR-02: The accounting half is not retry-stable — CI (`retries: 3`) and local (`retries: 0`) reach different verdicts on the same defect

**File:** `tests/tests/setup/shared/assertTeardown.ts:62-71`, `tests/playwright.config.ts:170`

**Issue:** `runTeardownAsserted` mutates the state it asserts on: attempt 1 counts, deletes, counts.
`retries` in `playwright.config.ts` is global (`process.env.CI ? 3 : 0`) and applies to teardown
projects like any other. So for the class of defect where a *second* delete completes what the first
left behind (partial delete, RPC transient, a race such as CR-01), attempt 2 observes
`rowsBefore = 0 → rowsDeleted = 0 → rowsAfter = 0` and passes. The run is green on CI and red
locally, for identical code and identical data. That is precisely the "retried-until-green" shape
CLAUDE.md's cardinal rule forbids, arrived at by configuration rather than by annotation.

**Fix:** Exempt the teardown projects from retries so the assertion is evaluated once against real
state, and record the reason:

```ts
// tests/playwright.config.ts, on each data-teardown-* project
{
  name: 'data-teardown-base',
  testMatch: /base\.teardown\.ts/,
  // reason: the F3 accounting assertion is state-mutating — a retry always observes an
  // already-cleared prefix (0/0/0) and passes, so retries would mask exactly the
  // partial-delete class the assertion exists to catch.
  retries: 0
}
```

---

### WR-03: The strengthened matcher is 0-vs-0 at ~25 of 27 sites — its stated catches are unreachable there

**File:** `tests/tests/setup/shared/assertTeardown.ts:20-39`

**Issue:** The docblock's own evidence paragraph states that a positivity floor "would have reddened
25 of the 26 executed sites, because … make `rowsDeleted === 0` the LEGITIMATE outcome at almost
every site." Read the other way: at 25 of 26 observed sites `rowsBefore === 0`, so both halves
evaluate `0 === 0` and `0 === 0`. At those sites the assertion cannot detect a no-opping
`bulk_delete`, cannot detect a prefix-scoping bug, and cannot detect residue — every one of the
listed catches requires `rowsBefore > 0`. What it *can* still detect there is over-deletion
(`rowsDeleted > 0` with nothing counted), which is a real but much narrower property than the
paragraph implies.

Consequently the F3 remediation's discriminating power rests on a single observation (n = 1), and
the "26/26 held" framing at `:22-24` reads as 26 independent confirmations when 25 of them are
tautological. This is the same over-reading of a green result that produced F3 in the first place.

**Fix:** State the conditionality where the catches are listed, and separate the two evidence
classes:

```
 * WHAT IT CATCHES — all of the following require `rowsBefore > 0` at the site in question,
 * which the measurement observed at 1 of 26 sites (the deferred-teardown + `extraTeardownPrefix`
 * pre-clear make 0 the normal `before`): a silently no-opping `bulk_delete`, a scoping bug that
 * sends the RPC a different prefix from the one counted.
 * WHAT IT CATCHES UNCONDITIONALLY: over-deletion — rows deleted under a prefix the probe counted
 * as empty.
```

Then consider whether a site-specific expectation (e.g. `base.teardown` asserting `rowsBefore > 0`,
since it is the one site that genuinely still owns rows at teardown time) is worth adding, so at
least one site exercises the non-trivial branch by contract rather than by accident.

---

### WR-04: The soft-assertion budget is counted textually, so the guard's own remediation instruction can trip it

**File:** `tests/playwright.config.ts:98,99-107`

**Issue:** `fs.readFileSync(specPath, 'utf8').match(/expect\.soft\(/g)` counts every textual
occurrence, including inside comments and string literals. The guard's failure message (`:103`)
instructs the author to "change the budget in SOFT_ASSERTION_BUDGETS in this file AND state the
reason in that spec's header" — and the most natural way to state that reason is to write
`expect.soft(` in the header, which increments the count and re-trips the guard with a message that
blames "the new assertion". The spec header currently dodges this only by an explicit convention
("The count is deliberately NOT restated here", `voter-journey.spec.ts:17-21`) that the guard itself
does not enforce.

The mirror-image hole: a soft assertion introduced without the literal token (aliasing, e.g.
`const soft = expect.soft; soft(x).toBe(y)`) is *not* counted, so the budget silently over-reports
headroom.

**Fix:** Strip comments and strings before counting, or scope the regex to statement position:

```ts
const source = fs
  .readFileSync(specPath, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments
  .replace(/(^|[^:])\/\/.*$/gm, '$1'); // line comments
const actual = (source.match(/\bexpect\.soft\s*\(/g) ?? []).length;
```

and reword `:103` to "state the reason in that spec's header **without writing the literal
`expect` + `.soft(` token**".

---

### WR-05: Three `runTeardown` call sites remain unasserted, so "covered by construction" does not hold for the delete path as a whole

**File:** `tests/tests/setup/shared/setupFromTemplate.ts:189,196,279` (unchanged this phase), claim at `tests/tests/setup/shared/assertTeardown.ts:9-12`

**Issue:** The RATIONALE paragraph argues that owning the matcher centrally means "a newly added
project is covered by construction". But `setupFromTemplate` performs three unasserted deletes — the
`extraTeardownPrefix` loop (`:189`), the pre-clear (`:196`) and the `cleanup` closure (`:279`) — and
those are the deletes that actually run in the common case (they are why `rowsBefore === 0` at
almost every teardown, per WR-03). The delete path most exercised by the suite carries no assertion
at all, which materially qualifies the "single owner of the F3 assertion" framing at `:1-2`.

**Fix:** Either route the pre-clear through the helper too (it is prefix-scoped and idempotent, so
the same invariant applies), or narrow the claim:

```
 * ROLE: … Every `*.teardown.ts` project's own delete routes through this function. NOTE: the
 * pre-clear + cleanup deletes inside `setupFromTemplate.ts` (:189, :196, :279) are NOT routed
 * and remain unasserted — see WINDOWS.md.
```

---

### WR-06: `countRowsByPrefix` forwards the prefix into `LIKE` unescaped, and PostgREST's `like` is not byte-identical to the RPC's SQL `LIKE`

**File:** `tests/tests/utils/supabaseAdminClient.ts:268`

**Issue:** Two divergence vectors against the "cannot drift from the delete it measures" claim
(`:245-248`):

1. Neither side escapes LIKE metacharacters, so `_` matches any character. Harmless for the 26
   hyphenated E2E prefixes, but the dev-seed CLI's default prefix is `seed_`
   (`packages/dev-seed/src/cli/teardown.ts:176`); if the probe is ever reused on that path it
   over-counts (`seed_` also matches `seedX`), which would make `rowsDeleted === rowsBefore` red for
   a correct delete.
2. PostgREST's `like` operator maps `*` to `%`; `bulk_delete`'s raw `external_id LIKE $2`
   (`00001_initial_schema.sql:2890`) does not. A prefix containing `*` would therefore be counted
   with a wildcard and deleted literally — the exact drift the shared-constant design was meant to
   preclude, reintroduced through the operator rather than the table list.

**Fix:** Escape the prefix for LIKE on the probe side and document that the RPC does not (so the
divergence is a known, single-direction one), or add a cheap guard:

```ts
async countRowsByPrefix(prefix: string): Promise<number> {
  if (/[%_*]/.test(prefix)) {
    throw new Error(
      `countRowsByPrefix: prefix '${prefix}' contains a LIKE metacharacter (% _ *); the probe ` +
        `and bulk_delete do not agree on its meaning, so the count would not measure the delete.`
    );
  }
  …
}
```

---

### WR-07: The row-count probe runs before `runTeardown`'s mass-delete guard, so a 0/1-character prefix triggers ten unbounded `LIKE '%'` scans first

**File:** `tests/tests/setup/shared/assertTeardown.ts:62-63`, `packages/dev-seed/src/cli/teardown.ts:105-108`

**Issue:** The docblock at `:41-43` claims the verbatim forwarding means "`runTeardown`'s
two-character mass-delete guard keeps its full reach". It keeps its reach over the *delete*, but the
helper now performs work *before* the guard can fire: `countRowsByPrefix('')` issues ten
`external_id LIKE '%'` exact-count scans across every content table before `runTeardown` throws.
Read-only, so no data risk — but it inverts the guard's stated intent (refuse before touching the
DB) and, on a large project, is the slowest possible way to reach an error that is decidable from
the argument alone.

**Fix:** Re-check the same invariant in the helper before probing, referencing the owner so the two
cannot drift:

```ts
export async function runTeardownAsserted(prefix: string, client: SupabaseAdminClient): Promise<void> {
  // Mirror of runTeardown's T-58-07-02 guard, re-checked here so the probe below never
  // runs an unbounded `LIKE '%'` scan for an argument the delete will refuse anyway.
  if (!prefix || prefix.length < 2) {
    throw new Error(`runTeardownAsserted: prefix must be at least 2 characters (got '${prefix}').`);
  }
  …
```

---

### WR-08: The two repaired auth files still contain the sibling null-blind pattern the phase set out to remove

**File:** `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:124`, `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts:126,136`

**Issue:** The phase repaired the three `searchParams.get(…)` / `FormData.get(…)` sites, which is
the correct set for a *null*-returning API. But the surrounding tests still lead with
`expect(x).toBeDefined()` on values that could plausibly be `null` from the JSON boundary
(`data.authorizeUrl`, `result.state`, `result.nonce`). These happen to be saved by the *following*
line in each case (`expect(typeof …).toBe('string')`, `expect(result.state!.length)`), so they are
not live defects — but they are the same matcher in the same files, and a future edit that drops the
follow-up line silently restores the blindness. Leaving them means the F19 lane's fix depends on
adjacent lines rather than on the matcher.

Also note the three test bodies swallow the call under test with `try { await POST(event) } catch {}`
(`token-endpoint.test.ts:139-142` and siblings). The `expect(capturedFetchBody).not.toBeNull()`
guard makes this safe today, but an empty catch around the subject of the test is the same
"cannot-fail-for-the-stated-reason" family.

**Fix:** Collapse each pair into one non-blind assertion:

```ts
expect(data.authorizeUrl, 'authorize response is missing authorizeUrl').toEqual(expect.any(String));
expect(result.state, 'getAuthorizeUrl returned no CSRF state').toEqual(expect.stringMatching(/.+/));
expect(result.nonce, 'getAuthorizeUrl returned no replay nonce').toEqual(expect.stringMatching(/.+/));
```

## Info

### IN-01: The guard's error message and the spec header it points at give conflicting instructions

**File:** `tests/playwright.config.ts:103` vs `tests/tests/specs/voter/voter-journey.spec.ts:17-21`
**Issue:** The guard says to "state the reason in that spec's header"; the header says "The count is
deliberately NOT restated here." A reader hitting the guard has to reconcile the two.
**Fix:** Reword `:103` to "…AND record the reason in that spec's header (prose only — do not restate
the number; the header deliberately does not)."

### IN-02: `assertTeardown.ts` duplicates ~25 lines of measurement narrative that will drift from `140-MEASUREMENT.md`

**File:** `tests/tests/setup/shared/assertTeardown.ts:20-39`
**Issue:** Counts (26 observations, 25/26, the `setupFromTemplate.ts:184-196` line reference) are
restated in-tree. Line-number citations in particular go stale on the first edit to that file — and
a stale number in a docblock is precisely the F10 failure mode this phase closed elsewhere.
**Fix:** Keep the *conclusion* and the decision-rule branch in-tree; replace the restated figures
with a single pointer to `140-MEASUREMENT.md § 4 / § Adjudication`.

### IN-03: `runTeardownAsserted` discards `storageRemoved`

**File:** `tests/tests/setup/shared/assertTeardown.ts:63`
**Issue:** `runTeardown` returns `{ rowsDeleted, storageRemoved }`; only the first is destructured.
Portrait-storage cleanup (`packages/dev-seed/src/cli/teardown.ts:126-132`) is therefore still
completely unasserted at all 27 sites — a silent regression in `listCandidatePortraitPaths` /
`removePortraitStorageObjects` leaks storage objects across every run with no signal. Matches the
prior behaviour, so not a regression, but the phase's own framing ("the delete accounted for every
row that was present… and none survived it") reads as broader coverage than shipped.
**Fix:** Either assert it (`expect(storageRemoved).toBe(expectedPortraits)` needs a probe that does
not exist yet) or name the gap in the WHAT IT DOES NOT CATCH paragraph.

### IN-04: `tests/e2e-runs/` holds 1.7 GB of untracked local evidence artifacts

**File:** `tests/e2e-runs/140-f3-measure/`, `140-f9-*/` (untracked)
**Issue:** Not committed (correctly), but 1.7 GB of traces/videos now sit in the worktree from this
phase's five instrumented runs. Worth confirming `.gitignore` coverage is intentional and pruning,
so a future `git add -A` or a Docker build context does not pick them up.
**Fix:** Confirm the ignore rule, and prune runs older than the ones cited in `140-MEASUREMENT.md`.

---

_Reviewed: 2026-08-15T18:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
