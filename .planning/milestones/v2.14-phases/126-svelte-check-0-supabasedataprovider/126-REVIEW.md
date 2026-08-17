---
phase: 126-svelte-check-0-supabasedataprovider
reviewed: 2026-07-16T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.test.ts
  - apps/frontend/src/lib/types/global.d.ts
  - packages/supabase-types/src/database.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 126: Code Review Report

**Reviewed:** 2026-07-16
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Phase 126 retyped `supabaseDataProvider.ts` against regenerated Supabase types with a
behavior-neutral mandate (E2E 125/0/0). I traced the diff against the pre-phase state
(`git diff 42a02044f~1..HEAD`) to separate genuine changes from context.

**Verdict on the type-hygiene work: it holds up.** The removed casts are genuinely
behavior-neutral:

- The `_getNominationData` entity builder was rewritten from an untyped
  `Record<string, unknown>` accumulator into per-variant object literals over a shared
  `base`. I diffed the resulting key set against the old `{ ...entityObj, ... }` spread —
  no fields are dropped and none are added (image/answers still overridden, org name still
  defaulted to `''`). The union now resolves structurally without a suppressing cast.
- The `parent_nomination_id as string | null | undefined` cast is **correctly** defensive:
  the generated `nominations` **table** row types it `string | null` (`database.ts:705`),
  but the `get_nominations` **RPC** return types it non-null `string` (`database.ts:1226`).
  That regen nullability gap is real, and the cast preserves the downstream null-guard that
  keeps the Nomination "either both or neither" invariant intact.
- The single retained `as AnyQuestionVariantData` cast is documented and the forbidden
  double-cast is absent.

No security issues (RPC calls are parameterized; no secrets — the test `test-anon-key` is a
mock literal), no injection surface, no data-loss risk. `database.ts` is `supabase gen types`
output and contains nothing suspicious.

The findings below are correctness edges and consistency notes I surfaced while tracing the
logic. **None block this phase's type-hygiene deliverable.** WR-01 and IN-01/IN-02 are
pre-existing issues visible in the reviewed code, flagged per the "flag any real bug you see"
mandate; WR-02 is the one point where the phase's own defensiveness is internally
inconsistent (though I verified it is behavior-neutral today).

## Structural Findings (fallow)

No `<structural_findings>` block was provided with this review.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: `_getQuestionData` returns ALL questions unfiltered when the electionId filter empties the category list

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:537-543`
**Issue:** After the client-side `electionId` category filter (lines 522-534), the code
derives `categoryIds` from the *filtered* categories and only applies the `.in('category_id', …)`
constraint when `categoryIds.length > 0`:

```ts
const categoryIds = categories.map((c) => c.id);
let qQuery = this.supabase.from('questions').select('*').order('sort_order');
if (categoryIds.length > 0) {
  qQuery = qQuery.in('category_id', categoryIds);
}
```

If a caller passes an `electionId` whose categories all get filtered out (e.g. every category
carries a non-matching `electionIds` and there is no global/null-`electionIds` category), then
`categoryIds` is `[]`, the `.in` guard is skipped, and **every question in the table is
returned** — each with a `categoryId` pointing at a category that is *not* in the returned
`categories` array. Downstream `DataRoot` assembly then receives orphan questions. This is the
classic "empty `IN ()` degrades to no filter" trap. Reachability is data-dependent (global
categories usually keep the set non-empty), which is why E2E did not catch it, but it is a real
correctness gap. Pre-existing — not introduced by Phase 126 — but visible in the reviewed code.
**Fix:** Short-circuit to an empty result when the filter yields no categories, rather than
falling through to an unfiltered fetch:
```ts
if (options?.electionId && categoryIds.length === 0) {
  return { categories, questions: [] };
}
let qQuery = this.supabase.from('questions').select('*').order('sort_order');
qQuery = qQuery.in('category_id', categoryIds);
```

### WR-02: Inconsistent nullability defensiveness in `_getNominationData` — runtime guard dropped on `id`/`entity_type` while `parent_nomination_id` keeps its defensive `| null` cast

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:291-294`
**Issue:** The phase removed the runtime null-guard when building the parent-type map:

```ts
// before: if (row.id != null && row.entity_type != null) nominationTypeById.set(row.id as string, row.entity_type as string);
const nominationTypeById = new Map<string, string>();
for (const row of data) {
  nominationTypeById.set(row.id, row.entity_type);
}
```

This trusts the regenerated `get_nominations` return types (`id: string`,
`entity_type: enum`, both non-null) — yet three lines earlier the same method deliberately
*distrusts* the same regen output by casting `parent_nomination_id as string | null | undefined`
because the RPC types over-promise non-nullability. The two decisions are internally
inconsistent about how much to trust the generated RPC row shape. I verified the guard removal
is **behavior-neutral today**: even if `entity_type` were null, storing `set(id, null)` vs. not
storing produces the same `nominationTypeById.get(parent) ?? null → null → clear parentId`
outcome, and `id`/`entity_type` are genuinely NOT NULL in the schema. So this is not a live bug
— but it is a latent-robustness / consistency defect: a future RPC change that makes
`entity_type` nullable would silently store `null` type strings instead of skipping, and the
inconsistency invites confusion about which regen fields are trusted.
**Fix:** Either restore the guard for symmetry with the `parent_nomination_id` treatment, or
add a one-line comment stating that `id`/`entity_type` are schema-guaranteed NOT NULL (unlike
`parent_nomination_id`) so the asymmetry is intentional and documented:
```ts
// id + entity_type are NOT NULL in the schema (unlike parent_nomination_id, cast | null
// below to cover the RPC regen nullability gap), so no runtime guard is needed here.
for (const row of data) nominationTypeById.set(row.id, row.entity_type);
```

## Info

### IN-01: `getLocalized` can return `null` typed as `string` when a locale value is explicitly null

**File:** `apps/frontend/src/lib/api/adapters/supabase/utils/getLocalized.ts:21-25`
**Issue:** The function's `key in value` checks (`if (locale in value) return value[locale]`)
match keys whose value is `null`, so a JSONB payload like `{ "en": null }` returns `null` even
though the declared return type is `string | null` — callers such as `_getAppCustomization`
(`?? undefined`) and `_getQuestionData` (`?? ''`) mostly absorb it, but `_getConstituencyData`
keyword splitting and FAQ mapping rely on the truthiness fallback rather than the `key in`
branch, so the presence of a null-valued locale key silently short-circuits the 3-tier fallback
(default locale / first-available never consulted). Pre-existing; not touched by this phase.
**Fix:** Test the resolved value, not key presence:
`if (value[locale] != null) return value[locale];` (and likewise for `defaultLocale`), so a
null-valued preferred locale falls through to the next tier.

### IN-02: `.limit(1).single()` on `app_settings` only handles the no-rows error, not the multiple-rows error

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:49-53, 85-89`
**Issue:** Both `_getAppSettings` and `_getAppCustomization` special-case `PGRST116` (no rows →
return empty). `.single()` also errors when the result set has **more than one** row, but with a
different code, so a duplicate `app_settings` row would throw the generic
`getAppSettings: <message>` instead of degrading gracefully. Low impact (`app_settings` is
effectively a singleton and `.limit(1)` caps the set) — noting for completeness. Pre-existing.
**Fix:** If a singleton is guaranteed, drop `.limit(1)` (it is redundant with `.single()`); if
not, use `.maybeSingle()` and treat absence as empty.

### IN-03: `nomObj.parentNominationId` in the "has-parent" branch relies on COLUMN_MAP mapping rather than an explicit set

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:328-341`
**Issue:** When a parent resolves, `nominationOut` spreads `...nomObj` and sets
`parentNominationType` but does **not** re-assert `parentNominationId`; it depends on
`toDataObject` having mapped `parent_nomination_id → parentNominationId` via COLUMN_MAP
(confirmed present at `column-map.ts:39`). The only-explicit `parentNominationId` write is the
clearing (`= null`) in the else branch. This is correct and covered by tests, but the asymmetry
(one edge explicit, the other implicit-via-mapping) makes the invariant harder to audit at a
glance. Suggestion only — no change required.
**Fix:** For symmetry/readability, set `parentNominationId` explicitly in the has-parent branch
too: `nominationOut.parentNominationId = parentNominationId;`.

---

_Reviewed: 2026-07-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
