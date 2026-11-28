---
created: 2026-08-28
source: Phase 154 (plan 154-02, whitespace boundary)
resolves_phase: null
severity: low
area: packages/dev-seed template validation
---

# A whitespace-only `external_id` passes the dev-seed `fixed[]` row guard

## The hole

`validateTemplate` requires every hand-authored `fixed[]` row to carry a non-empty `external_id`,
and it defines "non-empty" as a **raw** string-length check rather than a **trimmed** one. The guard
is `assertFixedRowsCarryExternalId` in `packages/dev-seed/src/template/schema.ts`, and the condition
is exactly:

```ts
if (typeof externalId !== 'string' || externalId === '') {
  problems.push(`  template.${slot}.fixed[${index}].external_id: Expected a non-empty string`);
}
```

`'   ' === ''` is `false`, so **three spaces pass**. The row validates, the configured
`externalIdPrefix` is prepended to it, and it is written — an id of `seed_` followed by three
spaces. Navigate by the condition text rather than by a line number; every inherited line number in
this phase's paperwork went stale under the comment-hygiene sweep, and this one will too.

The boundary is pinned by a committed characterization case in the template test suite:

> `boundary: a whitespace-only external_id is currently accepted`
> — `packages/dev-seed/tests/template.test.ts`

That case asserts both halves: `validateTemplate` does not throw on the whitespace row, and the
parsed output round-trips the value unchanged. It was flip-tested during plan 154-02 — substituting
the empty string for the three spaces turns it RED — so it is examining the guard's actual boundary
and not merely passing vacuously.

**Measured downstream consequence, so the severity is honest rather than assumed.** `external_id` is
a nullable `text` column with a partial unique index on `(project_id, external_id)`
(`apps/supabase/supabase/migrations/00001_initial_schema.sql:2322-2324` and siblings). There is no
`CHECK` constraint requiring non-emptiness or non-blankness, so a whitespace-only id stores cleanly
and participates in uniqueness like any other string, and the `seed_`-prefix teardown still matches
it. The cost is not a broken write — it is a value that is invisible in logs and dashboards, cannot
be reliably copied or typed back, and silently collides in the reader's eye with any other
whitespace id.

## Why it was not fixed in-phase

**Deliberate defer, recorded rather than absorbed.** Phase 154's brief was date determinism plus
confirming two guards that Phase 144 had already shipped. Nothing in its decision set covers
widening what the external-id guard means by non-empty, and the phase's own prohibitions named
"no tightening of the external-id guard in this phase" explicitly. Plan 154-02 therefore
**characterized** the boundary — measured it, committed a case that pins it, flip-tested that case —
rather than changing it.

The value is also functional rather than a hard failure: the bulk-upsert path's requirement is
non-emptiness, which a whitespace string satisfies. So this is a hygiene defect with a real but
bounded cost, not a live bug, which is why it belongs in the register rather than in a hotfix.

## The decision required

- **Option A — trim before the emptiness check.** **Recommended.** Change the condition to
  `typeof externalId !== 'string' || externalId.trim() === ''`, so an id made only of whitespace is
  rejected with the same field path the absent and empty-string cases already produce
  (`template.<slot>.fixed[<i>].external_id: Expected a non-empty string`). One operator, one line.
  It matches what every reader already believes the guard means, and it costs nothing: no built-in
  template carries a whitespace-only id, so no existing template starts failing.
  The characterization case must be **inverted** in the same commit, not deleted — it becomes the
  assertion that the tightened guard throws, which is what proves the change is live.
- **Option B — leave the boundary as documented behaviour.** Defensible: the value writes and reads
  correctly, and the committed case plus the comment above it already make the boundary explicit
  rather than surprising. Costs nothing now, and leaves a trap for the first author who pads an id
  while editing a template.

Whichever is chosen, the choice should be recorded — the current state is not a choice anyone made,
it is a check nobody looked closely at.

## After the decision

1. If Option A: change the condition in `assertFixedRowsCarryExternalId` to trim before comparing.
2. Invert the characterization case in `packages/dev-seed/tests/template.test.ts` so it asserts the
   throw and the field path, and rename it to say what it now pins. Do not delete it — the case is
   the only thing standing between this boundary and a silent regression.
3. Flip-test the inverted case: revert the source change alone and confirm the case goes RED. A
   guard that has not been observed failing has not been observed at all.
4. Run `yarn workspace @openvaa/dev-seed test:unit` and `yarn test:unit`.
5. If Option B: leave the code and the case as they are, and record the choice in the register entry
   so the next reader knows it was decided rather than missed.
6. Mark `.planning/WINDOWS.md` entry 136 fixed or waived to match the outcome.

## Related

- Phase 154 `154-02-SUMMARY.md` — where the boundary was measured, pinned and handed over
- `.planning/WINDOWS.md` — entry 136, the ledger record of this characterization
- `packages/dev-seed/tests/template.test.ts` — the characterization case and the comment above it
  explaining that the case exists to make the boundary visible, not to endorse it
- Phase 144 — the phase that introduced `assertFixedRowsCarryExternalId` and the `validateTemplate`
  seam this guard lives in
