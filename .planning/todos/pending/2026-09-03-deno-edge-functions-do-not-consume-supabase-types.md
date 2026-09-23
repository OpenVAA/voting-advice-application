---
created: '2026-09-03T09:30:00.000Z'
title: The Deno Edge Functions consume no shared types, so no guarantee from packages/supabase-types reaches them
area: apps/supabase — Edge Functions
severity: medium
source: Phase 164 (returns-table nullability) Plan 04 Task 3, per decision D-N2 — measured during the phase, filed rather than fixed
files:
  - apps/supabase/supabase/functions/send-email/index.ts
  - apps/supabase/supabase/functions/invite-candidate/index.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - packages/supabase-types/src/database.overrides.ts
---

## Problem

**No type-level guarantee from `packages/supabase-types` reaches
`apps/supabase/supabase/functions/**`.**

`apps/supabase/supabase/functions/send-email/index.ts:1` imports its Supabase client straight from a
CDN URL:

    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

That `createClient` is **not** parameterised by our generated `Database` type, and the file does not
import `@openvaa/supabase-types` at all. Measured across the whole tree, neither does anything else
under `functions/`:

    $ grep -rn "@openvaa/supabase-types" apps/supabase/supabase/functions/
    # no output, exit 1

    $ grep -rn "@openvaa/" apps/supabase/supabase/functions/
    # no output, exit 1 — no @openvaa package of any kind is imported

The consequence is concrete at the `resolve_email_variables` call site
(`send-email/index.ts:134`). The rows it returns are read at `:169`
(`recipient.preferred_locale`, twice) and `:177` (`recipient.email`), and **those reads are untyped
by our `Database` regardless of what `packages/supabase-types/src/database.overrides.ts` says.**
Widening a `resolve_email_variables` column in the override locus would change nothing here.

This matters because it is the **second, independent** reason `resolve_email_variables` gains nothing
from an override. Phase 164 recorded the first — the three scalar columns are provably non-null from
the function body, so the RPC has zero override keys **by decision**, written up in
`packages/supabase-types/RPC-NULLABILITY.md`. Someone who later disagrees with that disposition and
adds override keys for it will find they have no effect, and the reason will not be obvious: the
override is correct and the type is correct, but the consumer never sees either.

Without this note a future reader reasonably assumes the override reaches the Edge Functions, because
every other consumer of these RPCs does receive it.

## Why it was out of scope for Phase 164

Closing this means changing **how the Deno functions resolve their dependencies** — moving off the
esm.sh URL import onto a specifier that can also carry `@openvaa/supabase-types`, under Deno's module
resolution rather than the monorepo's. That is a build-and-tooling change to the Edge Functions
tree, not a nullability change, and Phase 164's boundary is explicitly the `RETURNS TABLE` nullability
work.

## Solution

TBD. Sketch, in increasing order of cost:

- **Minimum**: a comment at `send-email/index.ts:1` stating that the client is untyped, so the next
  reader does not assume otherwise. Note the D-N1 constraint — source comments carry no `.planning/**`
  references, so it must state the fact, not point at this file.
- **Real fix**: parameterise the Deno `createClient` with the generated `Database`, which needs
  `@openvaa/supabase-types` reachable from Deno — an import map / `deno.json` entry, or a vendored
  type-only copy with a drift check. The `supabase-types-drift` CI job added by Phase 164 plan 03 is
  the natural place to assert any vendored copy stays current.
- **Check while doing it**: whether `invite-candidate` and `identity-callback` read RPC or table rows
  with the same blind spot. Both are in the same untyped position; only `send-email` was measured in
  detail.

## Context

Measured during Phase 164 plan 04, Task 3, on branch `integration/ship-12-squash` at HEAD
`8c34b5184`. Filed under decision **D-N2** — follow-ups are filed as pending-todo entries during the
owning phase rather than left in source comments.

**Not a duplicate**, though two existing entries in this directory also mention `send-email`:
`2026-08-29-edge-function-non-null-env-assertions.md` is about `Deno.env.get(...)!` non-null
assertions, and `2026-08-29-153-extension-bearing-specifier-class-wider-than-js.md` is about
`.ts`-bearing relative specifiers. Neither states that the functions consume no shared types;
`grep -c "supabase-types"` on the first returns 0.
