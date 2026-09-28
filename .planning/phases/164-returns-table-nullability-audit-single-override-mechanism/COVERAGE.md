# Phase 164 — API Coverage Declaration

**Phase:** 164 — `RETURNS TABLE` Nullability — Audit + Single Override Mechanism
**Requirements:** CIGATE-04, CIGATE-05
**Written:** 2026-08-28, at plan time, by `gsd-planner`.

---

No external API integration: this phase adds no external API, SDK or service. It is type-generation
correctness and CI wiring over code that already exists — it reads
`apps/supabase/supabase/schema/**/*.sql` to derive an enumeration, declares a hand-maintained
TypeScript override in `packages/supabase-types`, removes one ad-hoc cast in the frontend adapter, and
adds one GitHub Actions job that runs the repo's existing `yarn db:types` script.

**Why the detector fires anyway, and why a capability matrix would be a fabrication.** The phase scope
is dense in Supabase vocabulary — `supabase gen types`, `.rpc('get_nominations')`,
`supabase/setup-cli@v1`, `supabase start` — and the deterministic scan cannot distinguish "integrates
an external API" from "operates on the generated types of an already-integrated one". Measured against
the phase's actual surface:

- **No new client, no new endpoint, no new credential.** The Supabase client already exists
  (`apps/frontend/src/app.d.ts:12`, `SupabaseClient<Database>`); this phase changes only the `Database`
  type parameter's `Functions` block. Every `.rpc()` call site is pre-existing.
- **No new SQL and no schema change.** `164-CONTEXT.md` § "Not in scope" excludes changing any RPC's
  SQL body or column list. The schema tree is read, never written. The schema-push gate was considered
  and correctly declined (recorded in each plan's `<gates_considered_and_declined>` block).
- **No package added.** `164-RESEARCH.md` § Package Legitimacy Audit records zero packages installed,
  zero `[SUS]`, zero `[SLOP]`; every instrument uses Node built-ins (`node:fs`, `node:path`,
  `node:url`) and the already-present `vitest` / `turbo` / `typescript` toolchain.
- **The one new CI job invokes an existing repo script** (`yarn db:types` →
  `yarn workspace @openvaa/supabase-types generate`) against a local Supabase started by the same
  `supabase/setup-cli@v1` action four sibling jobs already use. It introduces no new integration
  surface, only a new *check* over an existing one.

There is therefore no capability whose `INTEGRATE` / `OPT-OUT` disposition could be honestly recorded:
a matrix here would invent rows for capabilities the phase does not touch. This reasoned declaration
stands in its place, per the API Coverage Decision Checkpoint's provision for exactly this case.

**One adjacent finding, filed rather than absorbed here.** `164-RESEARCH.md` § R2 measured that the
Deno Edge Function `apps/supabase/supabase/functions/send-email/index.ts` imports `createClient` from
an esm.sh URL (`:1`) and does not import `@openvaa/supabase-types` at all — so no type-level guarantee
from this phase reaches `apps/supabase/supabase/functions/**`. That *is* a genuine external-SDK
boundary, and it is genuinely out of this phase's scope. Plan `164-04` Task 3 files it under
`.planning/todos/pending/` per D-N2, rather than letting it pass unrecorded.
