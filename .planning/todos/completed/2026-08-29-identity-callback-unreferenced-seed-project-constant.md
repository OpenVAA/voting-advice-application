---
created: 2026-08-29T07:15:00.000Z
title: DEFAULT_SEED_PROJECT_ID is declared and never referenced after Phase 155 removed the fallback — left in place deliberately, handed to Phase 161
area: apps/supabase — identity-callback Edge Function
severity: low
source: Phase 155 (edge-function-hardening) Plan 03 side effect, filed by Plan 06 — Phase 161 owns the constant, so this phase left it
files:
  - apps/supabase/supabase/functions/identity-callback/index.ts
---

## Problem

Phase 155 Plan 03 (`465cc4bdd`) removed the seed-project fallback from the project-id expression, so
an unset `DEFAULT_PROJECT_ID` now throws `ERR_ENV_UNCONFIGURED` naming the variable instead of
silently seeding candidates into the demo tenant. That was the right change and it discharged
criterion-2 site 2.

**Its side effect is that the constant the fallback used is now declared and referenced nowhere.**

Measured 2026-08-29 at HEAD `f1f575b62`:

```
apps/supabase/supabase/functions/identity-callback/index.ts:33
  const DEFAULT_SEED_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
```

```bash
$ git grep -n "DEFAULT_SEED_PROJECT_ID" -- apps packages tests scripts
apps/supabase/supabase/functions/identity-callback/index.ts:33:const DEFAULT_SEED_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
```

**Exactly one hit: its own declaration.**

**Nothing in the repository will flag it.** ESLint does not reach `apps/supabase/supabase/functions/`
— measured during Phase 155 research, and the reason `scripts/assert-edge-env-defaults.mjs` exists as
a standalone Node guard at all. No `tsc` project includes the Deno tree either (the modules import
from `https://deno.land` and `https://esm.sh`, which is why the phase's testable logic was extracted
into URL-import-free sibling modules). So `no-unused-vars` and `noUnusedLocals` both miss it, and it
will sit there silently until someone reads the file.

**Line-number warning for whoever picks this up:** this constant has moved three times in three
plans. `155-CONTEXT.md` fact 27 says `:31`; Plan 01 measured `:30`; Plan 03 measured `:31`; it is
`:33` today. Navigate by symbol, not by line.

## Solution

**Phase 155 deliberately left it in place.** `REQUIREMENTS.md` **PRESHIP-01** names this exact
constant as the value a future `PROJECT_ID` environment variable replaces, and `155-PATTERNS.md`
§ *Boundaries Respected* records it as read-context only: *"Phase 161 owns it; no pattern in this
document targets it."* Plan 03's own acceptance criteria pinned it as untouchable. Deleting it in
Phase 155 would have been a small unilateral edit inside another phase's declared boundary.

For **Phase 161**, which owns both this constant and the variable-name convergence, there are two
routes and they are genuinely different:

**(a) Delete it.** Correct if `PROJECT_ID` will be read from the environment with no literal
fallback — which is what PRESHIP-01 describes, and what the ordering note in that requirement assumes
(*"REVIEW-EDGE-02 makes `identity-callback` throw on a missing `DEFAULT_PROJECT_ID`, so this
parameterisation arrives at a call site that already fails loudly"*). Under route (a) the constant has
no future use and is just residue.

**(b) Keep it and give it a reference.** Correct if Phase 161 decides the seed tenant should be a
named, documented default *somewhere* — e.g. in `.env.example` as the value to copy, or as a test
fixture. In that case it should be exported or moved rather than left as a private unused binding.

Whichever route: **do not leave it as it is**. A declared-and-unused constant holding a real tenant
UUID reads to the next person like a fallback that is still live, which is precisely the thing Plan 03
removed.

## Related

- `.planning/REQUIREMENTS.md` PRESHIP-01 — names this constant as the value `PROJECT_ID` replaces
- `.planning/phases/155-edge-function-hardening-env-jwt-provider-identity/155-03-SUMMARY.md` — the plan that removed the fallback
- `.planning/phases/155-edge-function-hardening-env-jwt-provider-identity/155-PATTERNS.md` § Boundaries Respected — the boundary Phase 155 honoured
- `.planning/phases/155-edge-function-hardening-env-jwt-provider-identity/155-PORT-LOCALHOST-SWEEP.md` § 7

---

## Closed — 2026-09-05 (Phase 161, plan 09)

Discharged and measured, not assumed. `git grep -n "DEFAULT_SEED_PROJECT_ID" -- apps packages tests scripts`
returns NOTHING at this HEAD: the constant is gone from source entirely, and `identity-callback`
now reads the same `PUBLIC_PROJECT_ID` its two sibling consumers read, with no fallback. Every
remaining occurrence of the old name in the repository is under `.planning/`, i.e. historical record.

Carried forward rather than closed with it: the Edge Function validates that the variable is PRESENT
but not that it is a canonical uuid, unlike `resolveProjectId` and `resolveE2eProjectId`. That is a
separate defect with its own todo-worthy shape and is recorded in the phase verification report.
