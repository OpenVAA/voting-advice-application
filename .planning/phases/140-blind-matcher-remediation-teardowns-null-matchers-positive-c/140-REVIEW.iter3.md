---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c
reviewed: 2026-08-15T21:40:00Z
depth: standard
iteration: 2
files_reviewed: 44
files_reviewed_list:
  - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts
  - packages/dev-seed/src/cli/teardown.ts
  - packages/dev-seed/src/index.ts
  - packages/dev-seed/src/templates/index.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-hide-election-tags.ts
  - tests/playwright.config.ts
  - tests/tests/setup/candidate/bank-auth-journey.setup.ts
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
  - tests/tests/setup/shared/setupFromTemplate.ts
  - tests/tests/specs/perm/perm-hide-category-tags.spec.ts
  - tests/tests/specs/perm/perm-hide-election-tags.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/utils/supabaseAdminClient.ts
findings:
  critical: 1
  warning: 9
  info: 5
  total: 15
status: issues_found
---

# Phase 140: Code Review Report (iteration 2)

**Reviewed:** 2026-08-15T21:40:00Z
**Depth:** standard
**Files Reviewed:** 44
**Status:** issues_found

## Summary

Iteration 2 covers two jobs: adjudicating the 14 findings from `140-REVIEW.iter2.md` against the
13 `fix(140):` commits on top of `036d21201`, and reviewing the new surface those fixes introduced.

**Adjudication verdict: 13 of 14 genuinely resolved; 1 (WR-08) partially resolved with an
acknowledged deferral.** The fixes were verified against the code, not against the fix report:

- **CR-01 — RESOLVED, and better-targeted than the review's own suggestions.** The new
  `perm-bankauth-notloc` template is a faithful clone of `perm-not-located-2e2cg` (verified by diff:
  the two files differ in exactly 3 lines — the `P` constant, the export name, and the default
  export). Every nested FK reference is built from `${P}`, `buildCandidate`/`buildQuestions`/
  `buildElectionConstituencyNoms`/`buildStandardCandidateAnswers` all receive `prefix: P`, and
  `buildOrganizations()` / `buildQuestionCategories()` emit bare `external_id`s that the writer
  prefixes — so the template is internally consistent. `generateTranslationsForAllLocales: false`
  matches the source template (locale-expansion parity preserved). Registered in both
  `BUILT_IN_TEMPLATES` and the re-export block; `BUILT_IN_OVERRIDES` has only a `default` entry so
  there is no override to mirror. `tsc -p packages/dev-seed/tsconfig.json --noEmit` is clean.
  `bank-auth-journey` still stands alone — `data-setup-bank-auth-journey` has no `dependencies` key.
  The new prefix is genuinely collision-free: I enumerated all 27 `const PREFIX` declarations; no
  two are equal and none is a string-prefix of another. The fixer's rejection of the review's
  Option A (runtime prefix override) is *correct* — the template's nested FK strings are pre-baked
  and would have orphaned. **However, the chosen namespace introduces a new regression — see CR-01
  below.**
- **CR-02 — RESOLVED as written.** The review explicitly offered "stop claiming it is closed" as one
  of two remedies; the fixer applied it faithfully (`assertTeardown.ts:74-85` now carries the item
  under WHAT IT DOES NOT CATCH with the mechanism spelled out, and `:10-12` is corrected to "27 of
  28"). This is not a renaming — the false claim is gone and the true limitation is stated. The
  residual (the hole itself is still open and undetectable by construction) is carried forward as
  WR-04 below, not re-raised as a blocker.
- **WR-01 — RESOLVED.** `await expect(locator, msg).not.toHaveCount(0)` in both specs; auto-retry
  regained, message preserved, `tsc -p tests/tsconfig.json` clean.
- **WR-02 — RESOLVED, and the "could this newly hard-fail CI?" concern does not materialise for the
  race class.** `retries` is a valid per-project key and project-level wins over the top-level
  `retries: process.env.CI ? 3 : 0`, so there is no conflict. Crucially, CI runs `workers: 1`
  (`playwright.config.ts:250`), so concurrency-driven teardown flakes cannot occur on CI at all; and
  locally `retries` was already 0. The change therefore only removes retry-masking for genuine
  partial-delete / transient-RPC failures, which is the intent. Applied uniformly to all 28
  `data-teardown-*` projects with a per-project reason comment.
- **WR-03 / WR-05 — RESOLVED as written; underlying weakness survives BY DESIGN and is now honestly
  stated.** I checked whether the narrowing was a dodge and concluded it is not: `140-MEASUREMENT.md`
  § 4 shows a positivity floor would have reddened 25 of 26 sites, so behaviour could not be changed.
  Note that the review's own follow-on suggestion (make `base.teardown` assert `rowsBefore > 0`) was
  *wrong* and the fixer was right to skip it — the measurement shows `base.teardown` observed
  `before = 0`; the single `before > 0` site was `perm-analytics-tracking`, and § 5.3(4) records that
  this is a property of chain ORDER, not of the site. The WR-05 narrowing did, however, introduce
  three stale line citations (WR-01 below).
- **WR-04 + IN-01 — RESOLVED.** Comment-stripping verified empirically: raw count 136, stripped count
  136, and `npx playwright test --list` loads the config and reports **143 tests in 94 files** —
  matching the recorded baseline, so none of the three config-load guards throws. Guard/header wording
  now agree. Residual half carried as WR-05 below.
- **WR-06 — RESOLVED behaviourally, but the guard's stated rationale is wrong** — see WR-02 below.
- **WR-07 — RESOLVED.** The mirrored guard is byte-faithful to `runTeardown`'s
  (`!prefix || prefix.length < 2`, `packages/dev-seed/src/cli/teardown.ts:112-114`).
- **WR-08 — PARTIALLY RESOLVED.** The primary matcher collapse is applied correctly in both files.
  The deferred `try { await POST(event) } catch {}` sub-item is confirmed unchanged — **six** such
  blocks in `token-endpoint.test.ts` (the fix report says five siblings plus the named one; the count
  is six). Carried forward as WR-07 below.
- **IN-02 / IN-03 / IN-04 — RESOLVED.** `tests/e2e-runs/` ignore coverage confirmed
  (`.gitignore:44`).

**Where I disagree with the fix report's framing:** its Note 3 says "No finding's fix weakened,
skipped, or made retry-dependent any assertion." That is true of the assertions, but the CR-01 fix
changed *dataset ownership* in a way that removes a self-healing property the old prefix had, and
that is the one blocker this iteration.

**One hypothesis I formed and then disproved, recorded so it is not re-raised:** I suspected the
`extraTeardownPrefix: ['test-', 'e2e-perm-']` pre-clear in `setupFromTemplate.ts:187-194` could race
a concurrently-running perm teardown (the file's own comment at `:177-183` asserts exactly that
overlap), which would make the newly-hard before/after accounting nondeterministic at all 19 perm
sites. `140-MEASUREMENT.md` § 5.2 settles it empirically from `results.json` start times: **every
setup in the suite runs before any teardown does** — teardowns fire back-to-back in the final ~22 s.
The `teardown:` deferral is transitive over the serial perm chain, so the window does not exist in
the default suite. The in-tree comment at `setupFromTemplate.ts:177-183` is therefore stale/incorrect,
but harmlessly so. No finding raised.

Static verification performed this iteration: `npx tsc -p tests/tsconfig.json --noEmit` clean;
`npx tsc -p packages/dev-seed/tsconfig.json --noEmit` clean; `npx playwright test --list` → 143/94.
**The E2E full-suite gate and the `PLAYWRIGHT_BANK_AUTH=1` 3× determinism gate are still owed** — see
IN-05.

## Critical Issues

### CR-01: The new `e2e-bankauth-notloc-` namespace sits outside every pre-clear, so a failed or aborted bank-auth teardown silently wedges the blocking default suite with no self-healing

**File:** `tests/tests/setup/candidate/bank-auth-journey.setup.ts:67-73`,
`tests/tests/setup/candidate/bank-auth-journey.teardown.ts:32`,
`packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts:51`
**Introduced by:** commit `abe1fabb0` (the CR-01 fix)

**Issue:** The fix did two things together, and the second one is unremarked. It moved the
bank-auth dataset to `e2e-bankauth-notloc-` **and** deleted the
`extraTeardownPrefix: ['test-', 'e2e-perm-']` pre-clear. Deleting the pre-clear is correct (the
project should not wipe namespaces it does not own). But the prefix choice removes the dataset from
every sweep in the suite:

| pre-clear | declared in | matches `e2e-bankauth-notloc-`? |
|---|---|---|
| `'e2e-perm-'` | `shared/base.setup.ts:27` | no |
| `['test-', 'e2e-perm-']` | 19 × `perm/*.setup.ts` | no |
| `'e2e-bankauth-notloc-'` | `setupFromTemplate.ts:201` (step 1b) | yes — but only when the opt-in project runs |

Under the old `e2e-perm-notloc-` prefix, orphaned rows were swept automatically by the next perm
setup's `e2e-perm-` pre-clear. Under the new prefix nothing sweeps them. The trigger is not exotic:
`data-teardown-bank-auth-journey` now runs with `retries: 0` (WR-02's fix), the bank-auth run
depends on an operator-managed dev server plus a served identity-callback Edge Function, and the
runbook's Step B-3 3× determinism gate is a hand-driven loop — a Ctrl-C, a hard teardown failure, or
a dev-server drop between the spec and the teardown all leave the rows in place.

The consequence is not confined to bank-auth runs. The leaked dataset contributes 2 elections, 2
organizations, 8 candidates, 16 nominations and a full question set to the shared single DB, and
**nothing in a subsequent default `yarn test:e2e` removes them**. `voter-journey.spec.ts` asserts
exact filter/entity counts (the config's own note at `:606-614` cites "exact 13/0/13 counts"), so the
blocking gate suite starts failing on data the run did not seed and cannot clean, with no diagnostic
pointing at the cause. `probeFreshDatabasePrecondition` (`setupFromTemplate.ts:112-127`) only
`console.warn`s unless `E2E_REQUIRE_FRESH_DB=true`, so there is no signal. Recovery requires an
out-of-band `yarn db:reset` — which the operator has no reason to suspect is needed.

Per CLAUDE.md's cardinal rule, converting a self-healing state into one that silently wedges the
gate is a blocker.

**Fix (preferred — matches an existing precedent in the same file):** give
`data-setup-bank-auth-journey` the same `data-setup-base` edge its sibling `bank-auth` project
already carries (`playwright.config.ts:368`). This orders the two setups, makes the DB state
deterministic for the journey, and does **not** pull in the perm serial chain, so A4 and the
runbook's isolated gate both survive:

```ts
// tests/playwright.config.ts
{
  name: 'data-setup-bank-auth-journey',
  testMatch: /bank-auth-journey\.setup\.ts/,
  teardown: 'data-teardown-bank-auth-journey',
  // A4 preserved: base only, NOT the perm chain — mirrors the sibling
  // `bank-auth` project's wiring. Ordering base first also lets base.setup
  // sweep a leaked bank-auth dataset (see the extraTeardownPrefix below).
  dependencies: ['data-setup-base']
}
```

```ts
// tests/tests/setup/shared/base.setup.ts
// 'e2e-bankauth-' sweeps a dataset left behind by an aborted opt-in
// PLAYWRIGHT_BANK_AUTH run — nothing else in the suite owns that namespace,
// so without this an orphaned bank-auth seed persists until `yarn db:reset`
// and breaks voter-journey's exact-count assertions.
await setupFromTemplate('e2e/base', { extraTeardownPrefix: ['e2e-perm-', 'e2e-bankauth-'] });
```

**Alternative (one-line, no DAG change):** rename the prefix to `e2e-perm-bankauth-notloc-`. It is
still unique and still non-overlapping with `e2e-perm-notloc-`, so the CR-01 collision stays fixed
and the prefix-uniqueness guard still passes — but it re-enters the `e2e-perm-` sweep. Reject this
only if you positively want the dataset to survive a concurrent perm setup under
`PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e`; if so, record that reason in the template docblock, because
right now the tradeoff is invisible.

## Warnings

### WR-01: The WR-05 fix planted three stale line citations in the same docblock the IN-02 fix had just cleaned of stale line citations

**File:** `tests/tests/setup/shared/assertTeardown.ts:22-23` (and `:75`)

**Issue:** `assertTeardown.ts:40-43` now states, as this phase's own rationale, that
"line-number citations into `setupFromTemplate.ts` go stale on that file's first edit". Eleven lines
earlier, the WR-05 fix cites `:189`, `:196` and `:279` in that exact file — and commit `b3796a07c`
made them stale in the act of writing them, because the same commit inserted the six comment lines
that shifted every one of them:

```
cited     actual (grep -n 'runTeardown(' setupFromTemplate.ts)
 :189  →  :192
 :196  →  :201
 :279  →  :285
```

The same fix batch also left `assertTeardown.ts:75`, which cites
`tests/tests/utils/supabaseAdminClient.ts:263` for `countRowsByPrefix`; commit `4a727e800` added 21
lines above that method, so it is now at `:275`.

Every one of the four citations is wrong today, in the one file whose stated job is to be the honest
owner of the F3 assertion.

**Fix:** cite by symbol, not by line — the symbols are unique in their files and cannot drift:

```
 * NOT covered (Phase 140 WR-05): `setupFromTemplate.ts` performs three prefix-scoped deletes
 * of its own that do NOT route through this function — the `extraTeardownPrefix` pre-clear
 * loop, the template's own step-1b pre-clear, and the `cleanup` closure returned to callers.
```

and `` `countRowsByPrefix` in `tests/tests/utils/supabaseAdminClient.ts` `` at `:75`.

---

### WR-02: The new LIKE-metacharacter guard rejects three characters on a rationale that is only true for one of them, and it makes the asserted teardown path strictly less capable than the unasserted one

**File:** `tests/tests/utils/supabaseAdminClient.ts:257-266, 276-282`
**Introduced by:** commit `4a727e800` (the WR-06 fix)

**Issue:** The guard throws on `%`, `_` and `*`, and both the docblock and the runtime error message
justify it identically: *"the probe and bulk_delete do not agree on its meaning … so the count would
not measure the same rows the delete touches."* That is true for `*` only.

- `*` — PostgREST's `like` operator maps a literal `*` to SQL `%`; `bulk_delete`'s raw
  `external_id LIKE $2` does not. **Genuine divergence.** Correctly rejected.
- `_` — both sides emit the identical SQL pattern (`'seed_%'`), and SQL `LIKE` treats `_` as a
  single-character wildcard on *both* sides. The probe over-matches, `bulk_delete` over-matches by
  exactly the same set, and `rowsDeleted === rowsBefore` still holds. **No divergence.**
- `%` — same: `'se%ed' || '%'` on the RPC side and `'se%ed%'` on the probe side are the same pattern.
  **No divergence.**

So the guard ships a stated justification that is false for two of the three characters it enforces —
the precise defect class (a claim that cannot be true) this phase exists to remove, reintroduced by
one of its remediations.

The behavioural consequence is not cosmetic. Because `runTeardownAsserted` probes *before* deleting,
a prefix containing `_` now makes the whole teardown **throw and delete nothing**, where plain
`runTeardown` would have deleted correctly and the probe would have measured it accurately. The
docblock names `seed_` — the dev-seed CLI's default prefix — as the motivating case; under this guard
a teardown adopting that prefix leaks its entire dataset instead of being merely imprecise.

**Fix:** reject only the character that actually diverges, and describe the other two accurately:

```ts
if (prefix.includes('*')) {
  throw new Error(
    `countRowsByPrefix: prefix '${prefix}' contains '*'. PostgREST's \`like\` filter maps '*' to ` +
      `SQL '%', but bulk_delete's raw \`external_id LIKE $2\` does not — the probe would count a ` +
      `wildcard match while the delete matched the literal, so the count would not measure the delete.`
  );
}
// NOTE: '%' and '_' are NOT rejected. Both sides emit the identical SQL LIKE pattern, so both
// over-match by the same set and `rowsDeleted === rowsBefore` still holds. They make the prefix
// imprecise, not the accounting wrong.
```

If you prefer to keep `_`/`%` rejected as a *hygiene* rule, keep the throw but rewrite both the
docblock and the message to say "over-matches unrelated rows" rather than "the probe and the delete
disagree", and state that the cost of tripping it is a skipped delete.

---

### WR-03: The new prefix-uniqueness guard silently skips any teardown file whose declaration it fails to parse — an enumeration guard with no completeness check, which is the F4 failure mode its sibling guard exists to prevent

**File:** `tests/playwright.config.ts:145-156`
**Introduced by:** commit `abe1fabb0`

**Issue:** The guard collects prefixes with `/^const PREFIX = ['"]([^'"]+)['"]/m` and, when the regex
misses, `if (match)` drops the file with no record. Anything other than an exactly-shaped
declaration is invisible to it:

- `export const PREFIX = '…'` (a plausible refactor when a spec wants to import the prefix)
- an indented or re-wrapped declaration
- `const PREFIX: string = '…'`
- a template literal, e.g. `` const PREFIX = `e2e-perm-${SUFFIX}-` ``
- a file that passes a literal directly: `runTeardownAsserted('e2e-perm-foo-', client)`

In every one of those cases a duplicate prefix is reintroduced and the guard stays green — the
"comment asking future authors to pick a distinct prefix" the docblock at `:135-139` says it exists
to replace. This is structurally the same defect as fake-guard finding F4 (the orphan-probe
enumeration), whose remediation sits 100 lines above it in the same file and *does* carry a
completeness check.

The counts happen to line up today (27 `*.teardown.ts` files call `runTeardownAsserted`, 27 declare a
matching `const PREFIX`, verified) — which is exactly the state F4 was in before it drifted.

**Fix:** assert completeness, don't just collect. Every file that calls `runTeardownAsserted` must
have yielded a parsed prefix:

```ts
const unparsed: Array<string> = [];
for (const rel of files) {
  const source = fs.readFileSync(path.join(teardownDir, rel), 'utf8');
  const match = /^\s*(?:export\s+)?const PREFIX(?:\s*:\s*string)?\s*=\s*['"]([^'"]+)['"]/m.exec(source);
  if (match) teardownPrefixDeclarations.push({ file: rel, prefix: match[1] });
  else if (source.includes('runTeardownAsserted(')) unparsed.push(rel);
}
if (unparsed.length > 0) {
  throw new Error(
    `Teardown prefix guard could not parse a \`const PREFIX = '...'\` declaration in ` +
      `${unparsed.join(', ')}, but the file calls runTeardownAsserted — so its prefix is NOT ` +
      `covered by the uniqueness check below and a collision could reappear silently ` +
      `(Phase 140 review CR-01; same enumeration-drift shape as fake-guard finding F4).`
  );
}
```

---

### WR-04: CR-02's coverage hole was closed with prose, in a phase whose whole thesis is that prose cannot fail — and a cheap check was available

**File:** `tests/tests/setup/shared/assertTeardown.ts:74-85`, `packages/dev-seed/src/cli/teardown.ts:69-81`

**Issue:** This is the residual of CR-02, recorded rather than re-raised: the fix is legitimate (the
review offered it), but the gap it documents is real and now permanently unguarded. Drop a table from
`ALLOWED_TEARDOWN_TABLES` and the probe, the delete and the residue check all go blind together; the
site reports a clean `N/N/0` while every row in the dropped table survives and leaks forward into the
shared DB.

The fixer's reason for not adding the review's independent `PROBE_TABLES` list is sound — a second
hand-maintained copy is the drift this phase closed. But that argument rules out *duplication*, not
*checking*. The constant's own docblock (`teardown.ts:56-64`) states the invariant precisely: it is
"10 tables in schema's `allowed_collections`, minus `app_settings`". That is a checkable fact against
the schema, not a second copy of the list, and a dev-seed unit test can assert it without any
duplication of the table names into `tests/`:

```ts
// packages/dev-seed/tests/... — asserts the constant against the schema, not against a copy
it('ALLOWED_TEARDOWN_TABLES covers every allowed_collection except app_settings', () => {
  const allowed = parseAllowedCollections('apps/supabase/migrations/00001_initial_schema.sql');
  expect([...ALLOWED_TEARDOWN_TABLES].sort()).toEqual(allowed.filter((t) => t !== 'app_settings').sort());
});
```

Without something of this shape, the phase's headline deliverable ends with a documented,
permanently-invisible coverage hole in the exact table set it clears.

---

### WR-05: The soft-assertion budget guard's failure message claims a string-literal exclusion the code does not implement, and the aliasing under-count hole the review named is unaddressed

**File:** `tests/playwright.config.ts:103-116`

**Issue:** Residual of WR-04. The fix strips block and line comments, which closes the
self-tripping direction. But:

1. `:111` tells the reader the count was taken *"outside comments/strings"*. Strings are **not**
   stripped — `const s = 'expect.soft('` in a spec still increments the count. The message asserts a
   property of the counter that the counter does not have; a maintainer debugging a divergence will
   look everywhere except the string literal that caused it.
2. The mirror-image hole the original WR-04 named — a soft assertion introduced without the literal
   token (`const soft = expect.soft; soft(x).toBe(y)`) — is still uncounted, so the budget
   over-reports headroom in the direction that matters (silent growth), which is the direction that
   produced F10 in the first place.
3. The line-comment regex `/(^|[^:])\/\/.*$/gm` does not strip a comment preceded by `:` (e.g.
   `foo: // note`), so the self-tripping case is closed only for most positions, not all.

**Fix:** correct the message to what the code does, and close (2) with a second, cheap check:

```ts
// :111
`carries ${actual} (counted outside comments; string literals are NOT excluded). Convert the ` +
```

```ts
// after the count comparison — the under-count direction
if (/\bexpect\s*\.\s*soft\b(?!\s*\()/.test(source)) {
  throw new Error(
    `${rel} references \`expect.soft\` without calling it directly (an alias or a destructure). ` +
      `The budget above counts call sites textually, so an aliased soft assertion is invisible to ` +
      `it — call \`expect.soft(...)\` inline, or the budget silently over-reports headroom.`
  );
}
```

---

### WR-06: `base.teardown.ts` claims sole ownership of the base namespace, which the phase's own measurement disproves

**File:** `tests/tests/setup/shared/base.teardown.ts:16-20`

**Issue:** The docblock states: *"this teardown is the SOLE owner of the base namespace … No other
setup writes bare `test-` rows, so narrowing the wipe from `test-` to `test-e2e-base-` orphans
nothing."* The sentence is built on "writes", but the property that matters for a before/after
accounting assertion is *deletes*, and 19 perm setups delete into this namespace every run via
`extraTeardownPrefix: ['test-', 'e2e-perm-']` — `'test-'` matches `test-e2e-base-%`.

This is not speculative. `140-MEASUREMENT.md` § 5.2 records it as a confirmed mechanism: *"a perm
setup wipes the BASE dataset's rows too (`test-e2e-base-` is prefixed by `test-`)"*, and it is the
stated reason `base.teardown` observed `before = 0` at observation 26. So the one file that declares
itself the sole owner of a namespace is the file whose rows are routinely deleted by 19 other
projects, and the docblock is what a future author will size their trust from — the same failure mode
CR-02 was raised for.

Note this is *safe today* only because of the transitive `teardown:` deferral (§ 5.2: every setup runs
before any teardown). The docblock does not mention that dependency, so the safety looks like a
property of ownership when it is actually a property of scheduling.

**Fix:**

```
 * Teardown-ownership: this teardown is the sole *writer* of the `test-e2e-base-` namespace, but
 * NOT its sole deleter — all 19 perm setups pass `extraTeardownPrefix: ['test-', 'e2e-perm-']`,
 * and `'test-'` matches `test-e2e-base-%`, so a perm setup wipes this dataset before seeding its
 * own (`140-MEASUREMENT.md` § 5.2, confirmed empirically). That is safe only because Playwright's
 * `teardown:` deferral is transitive over the serial perm chain, so every setup completes before
 * any teardown runs; it is NOT safe by namespace ownership. Breaking that ordering would make this
 * site's `runTeardownAsserted` accounting race the perm pre-clears.
```

---

### WR-07: WR-08's deferred sub-item — six `try { await POST(event) } catch {}` swallows still wrap the subject of the test

**File:** `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:139-143, 159-163, 180-184, 199-203, 221-225, 250-254`

**Issue:** Carried forward per the fix report's own "Deferred / Partial-Fix Follow-ups" section, and
confirmed unchanged in the working tree. The count is **six** blocks, not the five the report states.
Each swallows every rejection from the call under test, so the tests cannot distinguish "the handler
threw for the intended reason (mock token fails `getIdTokenClaims`)" from "the handler threw during
argument construction, before `fetch` was ever reached, for an unrelated reason". The
`expect(capturedFetchBody).not.toBeNull()` guard rescues the first three; the last three then do
`capturedFetchBody!.get('client_assertion')!`, where a missing key yields a runtime `null` typed as
`string` and surfaces as an opaque TypeError rather than a named assertion failure.

The deferral reasoning (needs a designed assertion on the thrown error, and the repo's test-integrity
rule argues against a blind edit) is legitimate. Recording it so it is not lost between iterations.

**Fix:** assert the shape of the expected rejection instead of discarding it, e.g.

```ts
await expect(POST(event), 'POST should reject at getIdTokenClaims on the mock token').rejects.toThrow();
expect(capturedFetchBody, 'the token request was never issued').not.toBeNull();
```

or, if a 401 `Response` is returned rather than thrown in some cases, branch explicitly rather than
catching everything.

---

### WR-08: `bank-auth-journey.teardown.ts` writes the shared `app_settings` singleton at a point in the DAG where the perm chain is still executing

**File:** `tests/tests/setup/candidate/bank-auth-journey.teardown.ts:55-60`

**Issue:** Step 3 calls `client.updateAppSettings({ preRegistration: { enabled: false } })`.
`data-teardown-bank-auth-journey` is deferred only past `bank-auth-journey`, which depends solely on
`data-setup-bank-auth-journey` (no `dependencies` on base or perm). Under the supported
`PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e` invocation the bank-auth chain therefore completes early and
this teardown fires **while the base journeys and the perm serial chain are still running**, mutating
the `app_settings` JSONB singleton that `playwright.config.ts:191-197` documents as the single reason
the entire perm family is serialised.

The file's docblock claims idempotent safety ("safe across cold-starts, warm-starts, and re-runs"),
which is true of steps 1 and 2 but not of step 3 — an additive merge into a singleton another
project is reading is not idempotent with respect to that reader. This predates the phase, but the
CR-01 fix has just made this project's isolation the load-bearing argument for leaving it unordered,
so the remaining shared-state write should be named.

**Fix:** make it conditional on this project actually owning the singleton, or order the write. The
cheapest correct form is to give `data-setup-bank-auth-journey` the `data-setup-base` dependency from
CR-01's fix and to skip step 3 when the perm family is in the run:

```ts
// 3. Restore the scoped preregistration flag — ONLY when this project owns the
//    app_settings singleton. Under a full `PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e`
//    the perm chain is still mid-run here and owns the singleton; writing to it
//    would clobber the perm setup's authoritative REPLACE (playwright.config.ts
//    § perm family serialisation).
if (!process.env.PLAYWRIGHT_FULL_SUITE) {
  await client.updateAppSettings({ preRegistration: { enabled: false } });
}
```

(or, preferably, drop step 3 entirely and let the next `setupFromTemplate` REPLACE own the reset —
every setup already does a full authoritative overwrite at `setupFromTemplate.ts:242-266`.)

---

### WR-09: Dropping the pre-clear changed the bank-auth journey's data precondition from "only my dataset" to "mine plus whatever is in the DB", and the journey picks the *first* election with no identity check

**File:** `tests/tests/setup/candidate/bank-auth-journey.setup.ts:67-73`,
`tests/tests/fixtures/candidate/candidatePreregisterPage.fixture.ts:93-119`

**Issue:** The other half of commit `abe1fabb0`. Removing `extraTeardownPrefix: ['test-', 'e2e-perm-']`
is right in principle, but it also removed the only mechanism that normalised the DB before this
journey ran. `submitElection()` checks `list.getByTestId('election-selector-option').first()` and
`submitConstituency()` takes `selectFirstConstituencyOption` on every combobox — neither asserts
*which* election it selected. So when any other dataset is present (a prior full-suite run's base
rows, a `db:seed` default template, a leaked perm dataset), the journey silently preregisters into a
foreign election and still passes, because step 6 asserts only that an `auth.users` + `candidates` +
`user_roles` cascade exists.

`probeFreshDatabasePrecondition` warns rather than throws unless `E2E_REQUIRE_FRESH_DB=true`
(`setupFromTemplate.ts:112-127`), so there is no signal. That turns the runbook's 3× determinism gate
into a gate that can pass three times without ever exercising the dataset it was built for — the
"cannot fail for the stated reason" family this phase exists to remove.

**Fix:** assert the seeded dataset's identity where the journey selects it, so the walk cannot
silently run on foreign data:

```ts
// candidate-bank-auth-journey.spec.ts, step 2 — the seeded template's own elections
await expect(
  page.getByTestId(testIds.candidate.preregister.electionsList),
  'the preregister election selector must offer the perm-bankauth-notloc dataset (EL1/EL2); a ' +
    'different set means the DB carries another dataset and this walk is not exercising D-04'
).toContainText('[EL1]');
```

and/or set `E2E_REQUIRE_FRESH_DB=true` for this setup so a non-fresh DB fails loudly at seed time
rather than producing a green run on the wrong data.

## Info

### IN-01: The new prefix-uniqueness guard lacks the `fs.existsSync` precondition its sibling guard has

**File:** `tests/playwright.config.ts:145-150`
**Issue:** The ORPHAN-PROBE guard wraps its `readdirSync` in `if (fs.existsSync(probesDir))`
(`:35`); the new guard calls `fs.readdirSync(teardownDir, …)` unconditionally. If `tests/tests/setup`
is ever absent or renamed, every `playwright test` and `--list` invocation dies with a raw ENOENT
instead of a named message — the opposite of the "fails immediately and by name" property the
docblock claims at `:139`.
**Fix:** mirror the sibling's `existsSync` check, or catch and rethrow with the directory named.

### IN-02: The WR-07 fix duplicates `runTeardown`'s 2-character invariant with no check that the two copies agree

**File:** `tests/tests/setup/shared/assertTeardown.ts:135-137` vs `packages/dev-seed/src/cli/teardown.ts:112-114`
**Issue:** The two guards are byte-equivalent today (verified). But `teardown.ts:65-67` is the recorded
decision this phase used to *reject* a second hand-maintained copy of a fact under `tests/` — and
WR-07's fix creates exactly that for the length constant. If the owner ever relaxes to `>= 3` or adds
a trim, the mirror keeps enforcing the old rule with a message attributing it to `runTeardown`.
**Fix:** export the guard from dev-seed (`assertTeardownPrefix(prefix)`) and call it from both sites,
so there is one implementation and the mirror comment becomes unnecessary.

### IN-03: Stale comment in the bank-auth journey spec still names the old template

**File:** `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts:136`
**Issue:** `// Land on the election selector (perm-not-located-2e2cg seeds 2 elections).` — the
project now seeds `perm-bankauth-notloc`. Missed by the CR-01 fix, which updated every other
reference.
**Fix:** `// Land on the election selector (perm-bankauth-notloc seeds 2 elections).`

### IN-04: `perm-bankauth-notloc.ts` is a 231-line verbatim clone that will drift from its source

**File:** `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts`
**Issue:** The two templates differ in exactly three lines (the `P` constant and two identifier
names). The docblock explains why a *runtime* prefix override is unsafe — correctly — but the
conclusion drawn (duplicate the whole file) is stronger than the premise requires: the nested FK
strings are all built from `${P}`, so a shared factory `buildNotLocated2e2cgTemplate(prefix)` returning
the object would have preserved internal consistency with one copy of the topology. As written, a fix
to the shape (e.g. adding a constituency) must be applied twice, and nothing detects the omission.
**Fix:** extract the shape into a `(prefix: string) => Template` factory in the same directory and
have both templates call it; the `P` constants stay where they are.

### IN-05: The E2E gates are still owed and CR-01's fix is unverified against a live DB

**File:** n/a (process)
**Issue:** No suite run has happened since `036d21201`. Everything above is a static verdict.
Specifically unverified: that `perm-bankauth-notloc` seeds and tears down cleanly against a real
Supabase, that the journey's election/constituency selectors still render under the new dataset, and
that the 28 `retries: 0` additions do not surface a latent teardown transient.
**Fix:** run `yarn db:reset && yarn dev` then `yarn test:e2e` (full suite), and separately the
`PLAYWRIGHT_BANK_AUTH=1 --project=bank-auth-journey` 3× determinism gate per
`tests/IDURA-TEST-RUNBOOK.md` Step B-3, before closing Phase 140.

---

_Reviewed: 2026-08-15T21:40:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard — iteration 2 (adjudication + new-surface review)_
