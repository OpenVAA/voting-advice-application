---
phase: 59-e2e-fixture-migration
d: D-59-12
artifact: fix-forward-blocker
date: 2026-04-24
blocker_id: D-59-12-FIX-01
status: BLOCKED — requires user decision (Rule 4 architectural change)
---

# D-59-12 Fix-Forward: Fix #1 Blocker — `externalIdPrefix: 'test-'` refactor

## Status

**Fix #1 is BLOCKED. Fix #2 and Fix #3 landed cleanly.**

- Fix #2 (CAND-12 comment-field) — COMMITTED in `341e4ab0d`
- Fix #3 (baseline summary snake_case) — COMMITTED in `b15429c54`
- **Fix #1 (externalIdPrefix: 'test-')** — **BLOCKED**; documented here.

This blocker surfaces a design asymmetry in the current dev-seed pipeline + e2e-template pairing. Applying the triage's recommended one-line change (`externalIdPrefix: '' → 'test-'`) without the accompanying cross-file convention refactor would break `bulk_import` ref resolution for every row seeded by the e2e template.

## Why Fix #1 is not a single-file change

The triage in `post-swap/diff.md` recommends:

> **Option A (template-side, minimal invasive):** Set `externalIdPrefix: 'test-'` on the `e2e` template in `packages/dev-seed/src/templates/e2e.ts`. This stamps every generator-emitted row (synthetic + default-filled hand-authored rows) with the prefix. May require auditing the template's `fixed[]` entries to ensure they don't double-prefix.

### The pipeline's external_id handling (discovered during execution)

Every generator's `fixed[]` pass-through applies the prefix literally:

```ts
// packages/dev-seed/src/generators/CandidatesGenerator.ts:85 (representative)
for (const fx of fragment.fixed ?? []) {
  rows.push({
    ...fx,
    external_id: `${externalIdPrefix}${fx.external_id}`,
    project_id: fx.project_id ?? projectId
  });
}
```

There is **no de-duplication** of the prefix when `fx.external_id` already starts with it. A template author who sets `externalIdPrefix: 'test-'` AND writes `fx.external_id = 'test-candidate-alpha'` gets a DB row with `external_id = 'test-test-candidate-alpha'` — double-prefixed.

### Refs resolve against full DB external_id, not authored literal

`bulk_import`'s `resolve_external_ref` (schema/501-bulk-operations.sql:48-57) looks up:

```sql
SELECT id FROM public.%I WHERE project_id = $1 AND external_id = $2
```

So a ref `{ external_id: 'test-party-a' }` matches only if some row has `external_id = 'test-party-a'` verbatim. If the organization rows were emitted with `'test-test-party-a'` (double-prefixed), this ref errors:

```
External reference not found: external_id "test-party-a" in table "organizations"
```

### The intended authoring convention (implied by precedent)

The default template (`packages/dev-seed/src/templates/default.ts`) uses `externalIdPrefix: 'seed_'` + unprefixed `fx.external_id: 'election_default'` → DB row `seed_election_default`. The authoring convention is:

- `fixed[].external_id`: **unprefixed authoring form** (`'candidate-alpha'`) — generator re-prefixes
- `{ external_id: ... }` refs: **prefixed final-DB form** (`'test-candidate-alpha'`) — bulk_import resolves verbatim server-side
- `answersByExternalId` keys: **prefixed final-DB form** (`'test-question-1'`) — importAnswers queries by external_id directly

This is the asymmetric pattern that `nominationsOverride.ts:104` demonstrates:
```ts
candidate: { external_id: cand.external_id } // cand.external_id is already prefixed
```
because `ctx.refs.candidates` carries the POST-prefix external_ids after CandidatesGenerator ran.

## The scope of "reconcile so the prefix isn't duplicated"

Applying the fix correctly requires:

1. **`packages/dev-seed/src/templates/e2e.ts`** — strip `test-` from every top-level `external_id:` literal (~65 locations); KEEP `test-` on every `{ external_id: 'test-...' }` ref (~85 locations) and every `answersByExternalId` key.
2. **`packages/dev-seed/tests/templates/e2e.test.ts`** — update:
   - `REQUIRED_EXTERNAL_IDS` + `FORBIDDEN_EXTERNAL_IDS` to list unprefixed ids (lists assert on top-level `external_id`).
   - The ordinal-question expected set (~16 ids) to unprefixed form.
   - All `.find((r) => r.external_id === 'test-...')` comparisons to unprefixed form.
   - `expect(cands[0]?.external_id).toBe('test-candidate-alpha')` → `'candidate-alpha'`.
   - The `externalIdPrefix` shape test from `.toBe('')` → `.toBe('test-')`.
   - `candIds` / `orgIds` set-membership check for nominations — must prefix the set from top-level ids before the `candIds.has(ref)` check, because the ref side is in DB-prefixed form. Example fix:
     ```ts
     const prefix = e2eTemplate.externalIdPrefix ?? '';
     const candIds = new Set(
       (fragmentOf('candidates')?.fixed ?? []).map((c) => `${prefix}${c.external_id as string}`)
     );
     ```
   - Lines 356-357 (election/constituency ref checks) — KEEP prefixed form (those are refs).
   - Line 472 (`answersByExternalId?.['test-question-text']`) — KEEP prefixed form.
3. **`tests/tests/setup/templates/variant-multi-election.ts`** — strip `test-` from ~8 top-level `external_id:` literals, KEEP on refs. Variants call `base.externalIdPrefix` so they inherit the same convention.
4. **`tests/tests/setup/templates/variant-constituency.ts`** — same.
5. **`tests/tests/setup/templates/variant-startfromcg.ts`** — same.
6. **`tests/tests/utils/e2eFixtureRefs.ts`** — the module reads `template.candidates.fixed` directly; its filters (`startsWith('test-candidate-unregistered')`, etc.) and its invariant check (`alpha.external_id !== 'test-candidate-alpha'`) target top-level authored form. All 4 prefix filters + 2 comparison literals need rewriting to unprefixed form.
7. **`tests/tests/specs/voter/voter-matching.spec.ts`** — lines 41, 43 filter `E2E_QUESTIONS` by `startsWith('test-voter-')`; the 3 `.find((c) => c.external_id === 'test-voter-cand-*')` lookups at lines 123-125 target top-level. All need unprefixed form.
8. **`tests/tests/specs/voter/voter-detail.spec.ts`** — line 27 `E2E_CANDIDATES.find((c) => c.external_id === 'test-candidate-alpha')` needs unprefixed form.
9. **Possibly more `tests/tests/specs/**/*.spec.ts`** — a full grep-audit is needed (not performed in this fix-forward attempt because scope is already too wide).

## The teardown bug this was supposed to fix

The original triage hypothesis: "synthetic rows inherit externalIdPrefix: '' + generator defaults → no `test-` prefix → teardown filter misses them."

**Investigation during Fix #1 attempt contradicts this hypothesis:** the e2e template declares `count: 0` on every table (verified — `grep -n 'count:' packages/dev-seed/src/templates/e2e.ts` returns 8 lines, all `count: 0`), so no synthetic rows are emitted. Every seeded row comes from an explicit `fixed[]` entry with a literal `test-*` external_id.

That means after Fix #1 (with the full refactor), DB external_ids would be identical to pre-fix: `'' + 'test-candidate-alpha' = 'test-candidate-alpha'` (pre) vs `'test-' + 'candidate-alpha' = 'test-candidate-alpha'` (post). **The teardown query `external_id LIKE 'test-%'` matches the same set of rows either way.**

The actual root cause of "runTeardown deleted zero rows" in the post-swap run is therefore **unknown from static analysis alone**. Plausible alternatives:

- The variant-data.teardown ran first and deleted the test-* rows, then data.teardown saw an empty DB (both teardowns filter the same prefix, so whichever runs second returns 0). Pre-swap: the old data.teardown asserted `toBeTruthy()` on the result object — any non-empty JSON passes even if `{ elections: { deleted: 0 }, ... }`. Post-swap's stricter `rowsDeleted > 0` surfaces this latent ordering issue.
- Some spec in the candidate-app-mutation chain may have called `client.bulkDelete` directly (worth grepping — not done).
- A `supabaseAdminClient` race/retry dropped the rows before teardown (unlikely but possible).

**None of these are fixed by the externalIdPrefix change.** The triage author may have been working from an older version of the e2e template where synthetic counts existed, or conflated a separate concern.

## Recommendation to orchestrator (Rule 4 — architectural decision)

Options for Plan 59-08 (or equivalent follow-up):

### Option A — Full refactor (Fix #1 as scoped, plus transitive changes)

Execute items 1-8 above (and any grep-audit findings under item 9) in a single coherent commit. Net DB state unchanged; the benefit is alignment with the implicit authoring convention used by `default.ts` + `nominationsOverride.ts`. But: still doesn't fix the teardown zero-rows symptom (see "actual root cause" above), so may not unblock the parity gate on its own.

### Option B — Investigate the real teardown root cause

Before touching template shape:
- `git show 58d86fa7f` — compare old vs new data.teardown (done in this attempt; the old test's `toBeTruthy()` passes with zero deletes, new test's `rowsDeleted > 0` asserts actual work).
- Run the Playwright suite locally with `DEBUG=*` on the teardown projects to capture bulk_delete response bodies.
- Confirm variant-data.teardown vs data.teardown ordering via `playwright.config.ts` dependency graph — if one precedes the other, the later one runs on an empty DB.
- Consider relaxing `rowsDeleted > 0` to `rowsDeleted >= 0` (i.e., `toBeGreaterThanOrEqual(0)`) or moving the assertion to `data.setup.ts` (verify seeding wrote rows, which is what "teardown found zero" implies a failure of). Masks root cause but restores parity gate.

### Option C — Teardown-side fix

Switch teardown from prefix-based to project_id-based deletion (triage's Option B):

```ts
// pseudocode — requires an admin-client method that deletes by project_id scope
await client.bulkDeleteByProject(TEST_PROJECT_ID);
```

Decoupled from the template authoring convention. Covers synthetic rows, addendum rows, and any row at `TEST_PROJECT_ID` regardless of prefix. Requires a new admin-client surface (`@openvaa/dev-seed` public API change) and carries a larger safety-blast radius — the `--prefix` guard was the primary safeguard against `supabase:reset`-style mass deletes.

### Option D — Parity gate acceptance adjustment

Treat the 2 teardown failures as an environmental/infrastructure issue, not a parity regression. Update the diff script to exclude them from the regression count (`IGNORED_TESTS = [data.teardown, variant-data.teardown]`), proceed with Plan 59-06 (fixture deletion) if the 20+18 = 38 cascade regressions from Fix #2 also clear. **NOT RECOMMENDED** without independent verification that the teardown is actually idempotent (empty-DB teardown is fine iff preceding teardown or pre-clear did its job).

**My recommendation:** Option B first (surface the actual root cause), then apply either Option A or Option C based on what B reveals. Option A without B may restore template convention hygiene but won't flip the parity gate green.

## Summary of committed work this session

1. `b15429c54` — Fix #3: baseline summary `termsOfUseAccepted` → `terms_of_use_accepted` snake_case rename. Clears the 1 false-positive "new test appeared post-swap" diff flag.
2. `341e4ab0d` — Fix #2: 7 additional `custom_data: { allowOpen: true }` additions on `test-question-2..8` in the e2e template. Enables the candidate-questions-comment textarea to render for any opinion question at index 2 (or any index within the Economy/Social categories). Unblocks CAND-12 persist-comment test → collapses the 18-test cascade chain.

Expected post-re-run parity gate delta from the 2 committed fixes (vs the current post-swap FAIL):
- `candidate-app :: CAND-12 persist comment text`: fail → pass
- 18 cascaded tests (candidate-app-mutation × 7, re-auth-setup × 1, candidate-app-password × 2, candidate-app-settings × 8): cascade → pass (assuming data-setup + candidate-app pass end-to-end)
- `voter-matching :: should NOT show hidden candidate (no terms_of_use_accepted)`: flag cleared (cosmetic fix in baseline summary)

**Residual regressions likely to remain after re-run (until Fix #1's blocker is resolved):**
- `data-teardown :: data.teardown.ts > delete test dataset` — 0 rows, same asserted fail
- `data-teardown :: variant-data.teardown.ts > delete variant test dataset` — 0 rows, same asserted fail
- Possibly the 1 residual data-race failure (`voter-app-settings > category checkboxes`) — already in data-race pool pre-swap.

Net expected: 41 → 40 or 41 pass / 2 or 3 fail / 46 cascade (if the 2 teardowns continue to fail deterministically). Delta vs baseline: `pass -2 or -1, fail -7 to -8, cascade -8 to +0` — directionally much healthier than current `-21 / +3 / +18` but still not PARITY PASS without Fix #1 resolution.

## Files touched during Fix #1 attempt (all reverted)

All reverted to pre-Fix-#1 state before committing this blocker doc. `git diff --stat` against `341e4ab0d` (latest committed fix) shows only the new `fix-forward.md` file added.

- `packages/dev-seed/src/templates/e2e.ts` — reverted; Fix #2's 7 `custom_data` additions remain via `341e4ab0d`
- `packages/dev-seed/tests/templates/e2e.test.ts` — reverted
- `tests/tests/setup/templates/variant-multi-election.ts` — reverted
- `tests/tests/setup/templates/variant-constituency.ts` — reverted
- `tests/tests/setup/templates/variant-startfromcg.ts` — reverted
- `tests/tests/utils/e2eFixtureRefs.ts` — reverted
- `tests/tests/specs/voter/voter-matching.spec.ts` — reverted

---

**References:**
- `post-swap/diff.md` — FAIL verdict + triage
- `post-swap/playwright-report.json` — raw report
- `59-04-SUMMARY.md` — swap commit wrap
- `packages/dev-seed/src/generators/CandidatesGenerator.ts:74-88` — canonical fixed[] pass-through pattern
- `packages/dev-seed/src/templates/defaults/nominations-override.ts:78-114` — canonical refs-use-prefixed-ids precedent
- `apps/supabase/supabase/schema/501-bulk-operations.sql:48-57` — `resolve_external_ref` SQL contract
