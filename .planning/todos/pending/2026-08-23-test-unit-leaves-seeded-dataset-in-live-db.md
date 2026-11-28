---
created: 2026-08-23T17:34:00.000Z
title: yarn test:unit leaves the whole default template in the live local DB, silently contaminating the next E2E run
area: packages
files:
  - packages/dev-seed/tests/integration/default-template.integration.test.ts:191
  - packages/dev-seed/src/cli/teardown.ts:211
filed_by: Phase 144 (144-07), as residue RES-15 — found by that plan's own gate 7
---

## Measurement (taken at HEAD `47ee50054`, 2026-08-23)

`packages/dev-seed/tests/integration/default-template.integration.test.ts` calls its `runTeardown`
**at line 191 only, inside `beforeAll`**. It is a *pre*-test cleanup with **no post-test counterpart**:

```
$ grep -n 'runTeardown(' packages/dev-seed/tests/integration/default-template.integration.test.ts
139:async function runTeardown(
191:    await runTeardown('seed_', adminClient, readClient);
```

So after any `yarn test:unit` run with Supabase up, the live local database holds the entire `default`
template:

```
elections=1 · question_categories=4 · questions=26 · candidates=328 · nominations=377
```

all carrying the `seed_` prefix that is `packages/dev-seed/src/templates/default.ts:39`'s
`externalIdPrefix`. It is **not** `seed.sql`'s doing — `grep -c 'seed_cand_' apps/supabase/supabase/seed.sql`
→ **0**.

## Why it matters — the symptom is data-shaped, not an error

Phase 144 ran `yarn db:reset` *before* gate 1, then gates 1-6, then the E2E suite. Gate 1 repopulated
the database it had just reset, and the E2E gate came back **8 failed / 79 did not run / 48 passed**
with failures that look nothing like a seeding problem:

- `eperm07-term-trigger` read the category heading as `Economy & Taxation  7 questions` — a `default`
  category — where it expected the Base opinion category;
- `voter-journey` found **2** constituency comboboxes where it expected **1**.

Re-ordering to `gates 1-6 → yarn db:reset → gate 7` produced **135 passed / 0 failed / 0 flaky /
0 skipped / 0 did-not-run** at the same HEAD, with no source change. This cost one full void suite run
to diagnose, and it will cost the next person the same.

**The suite's own advisory does fire** (`[setupFromTemplate] Database is NOT fresh — found N non-test
candidate(s)…`) but it is a console warning inside a passing setup, not a failure, and it is easy to
read past because it also fires benignly under parallel perm setups.

## Sibling

`packages/dev-seed/src/cli/teardown.ts:211` is `const prefix = values.prefix ?? 'seed_';` — the same
class from the other direction: `yarn db:seed:teardown` is a **silent no-op** for any dataset seeded
under a different prefix. Recorded by `144-01` as RES-3.

## Suggested approach — pick one, not all

1. **Add an `afterAll` calling the same `runTeardown`.** Cheapest and most obvious. Note the test's own
   comment explains the pre-test placement was for assertion reliability under async `pg_net` cleanup,
   so an `afterAll` must not race the assertions — it runs after them, so this should be safe, but the
   Pitfall #5 note deserves re-reading first.
2. **Document it as intentional** and make `yarn test:e2e` refuse to start against a dirty database
   (promote the existing `setupFromTemplate` freshness probe from a warning to a hard failure).

Whoever owns the CI `dev-seed-integration` job should decide; Phase 144 filed rather than changed
another package's test contract.
