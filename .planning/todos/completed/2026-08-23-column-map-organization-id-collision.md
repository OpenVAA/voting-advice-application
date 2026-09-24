---
created: 2026-08-23T17:32:00.000Z
title: COLUMN_MAP maps two columns to organizationId, so FIELD_MAP.organizationId resolves to a column on no table
area: packages
files:
  - packages/supabase-types/src/column-map.ts:17
  - packages/supabase-types/src/column-map.ts:32
  - packages/supabase-types/src/column-map.ts:82
filed_by: Phase 144 (144-07), as residue RES-7 / threat T-144-11
---

## Measurement (taken at HEAD `47ee50054`, 2026-08-23)

`packages/supabase-types/src/column-map.ts` maps **two different columns to the same property name**:

```
:17   organization_id: 'organizationId',
:32   organization_id_nom: 'organizationId',
```

`PROPERTY_MAP` at `:82` is the reversal —

```ts
export const PROPERTY_MAP = Object.fromEntries(Object.entries(COLUMN_MAP).map(([k, v]) => [v, k]))
```

— and **object reversal is last-wins**, so `FIELD_MAP.organizationId` resolves to
`organization_id_nom`.

**That column exists on no table.** Measured both ways:

- `grep -c 'organization_id_nom' packages/supabase-types/src/database.ts` → **0**
- `grep -c 'organization_id_nom' apps/supabase/supabase/schema/*.sql` → **0**

So `resolveFieldName('organizationId')` would send `organization_id_nom` to the RPC and be rejected.

## Current state — pinned, not fixed

Phase 144's `permittedKeys` is derived mechanically from this map, which means it admits
`organizationId` on **no** collection — exactly matching what the pipeline actually does.
`packages/dev-seed/tests/template/permittedKeys.test.ts` **asserts** that, so the behaviour cannot
drift silently while the collision stands.

## Why Phase 144 did not fix it

Fixing the collision is a change to `@openvaa/supabase-types`, a package the frontend adapter also
consumes — a cross-package change outside that phase's scope fence. Renaming either side changes a
public property name.

## Suggested approach

Give `organization_id_nom` its own camel property (e.g. `organizationIdNom`), or drop the entry if the
column is genuinely dead — the two greps above suggest it is. Then re-run the `permittedKeys` assertion,
which is currently pinning the *broken* behaviour and will need its expectation updated deliberately.

---

## CLOSED 2026-09-16 by phase 162 plan 07b

**Fixed at the cause rather than worked around.** The "suggested approach" above offered two routes —
give the suffixed key its own camel property, or drop it if the column is dead. Neither was taken,
because both treat the symptom. The CAUSE was that two tables carried a column called
`organization_id`, and an object literal cannot declare one key twice, so the second was given a
suffix naming a column on no table at all.

162-07b removed `candidates.organization_id` outright (D-13, brief § 11.8): the candidate-to-
organization association was stated twice in this system, once as that column and once as the
`parent_nomination_id` edge `validate_nomination()` already enforces. With one table left carrying
the name, the suffix retired with the problem it worked around and `organization_id: 'organizationId'`
sits in the nominations group as an ordinary entry.

**Measured, before and after:**

| | keys | distinct values | duplicated |
|---|---|---|---|
| before | 40 | 39 | `organizationId` x2 |
| after | 39 | 39 | none |

**The pinned-broken-behaviour assertion was updated deliberately, exactly as this file asked.**
`packages/dev-seed/tests/template/permittedKeys.test.ts` used to assert that `organizationId` was
admitted NOWHERE, with a comment saying the collision was deliberately left open. It now asserts the
closed truth in both directions: not admitted on `candidates` (the column is gone), admitted on
`nominations` and on `factions` (it resolves to a real column on both). That is a WIDENING of a
security-adjacent guard, which is why it is asserted rather than inherited.

**And the closure is guarded standing, not just done.** A new assertion in the same file compares
`COLUMN_MAP`'s key count with its distinct-value count and names every offender in its failure
message, so a future duplicate of ANY property reddens — not only a duplicate of this one. It was
observed RED against the real collision (`organizationId x2`) before the fix, and observed RED again
against a deliberately re-duplicated DIFFERENT property afterwards (`firstName x2`), which is what
makes the standing claim measurable rather than asserted.
