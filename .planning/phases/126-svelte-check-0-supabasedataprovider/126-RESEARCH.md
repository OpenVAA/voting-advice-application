# Phase 126: svelte-check → 0 — supabaseDataProvider - Research

**Researched:** 2026-07-16
**Domain:** TypeScript type-correctness against generated Supabase types (frontend data-adapter layer); no runtime behavior change
**Confidence:** HIGH (regen + svelte-check executed against the live schema this session; file restored)

## Summary

This phase clears the 79 svelte-check errors in `supabaseDataProvider.ts` by regenerating the stale `packages/supabase-types/src/database.ts` (D-01) so the `get_nominations` RPC becomes fully typed, then finishing the small residual by hand (D-03/D-04). I **executed the real regen against the running local Supabase this session, ran `yarn check`, captured the exact post-regen error inventory, and restored the generated file via `git checkout`** — so the numbers below are measured, not predicted.

**Headline measured result:** the regen alone (provider code untouched) takes svelte-check from **133 → 50 errors**. It clears **75 of the 79** target-file errors and — as an unavoidable side effect of fixing the same root staleness — **~9 Phase-127-scope errors in `supabaseDataWriter.ts` / `supabaseAdminWriter.ts`** as well. The **4 residual** target-file errors (259, 260, 374, 549) are then cleared by the provider-typing work, landing the phase at **≈46 errors** with `supabaseDataProvider.ts` at 0 — **not the ~54 the CONTEXT arithmetic implied.** The `~54` assumed only the 79 target errors clear; in reality the root-cause regen's blast radius reaches the writer cluster too.

**Primary recommendation:** Plan three atomic commits — (1) `yarn db:types` regen (measure 133→50 around it), (2) provider typing to clear residual 259/260/374/549 (target file → 0, count → ~46), (3) qs-shim deletion (count unchanged). Pin the exact post-regen number empirically at plan time; my measurement is **50 after regen, 46 after provider work**. Two important corrections to CONTEXT assumptions are in `## Common Pitfalls`.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 — Regenerate the Supabase types.** Run `yarn db:types` to regenerate `packages/supabase-types/src/database.ts`. Root-cause fix: the schema already defines `get_nominations` with a complete `RETURNS TABLE`, so regeneration adds a fully typed `Returns` row array and collapses most of the 79 errors at the source. Do NOT hand-write a duplicate RPC row interface.
- **D-02 — Commit the full regen output as its own atomic commit.** No hand-trimming of the regen diff. If regeneration introduces **net-new svelte-check errors elsewhere, fix them in-phase**. Capture before/after counts around the regen commit.
- **D-03 — Light refactor allowed in `_getNominationData`.** Small structural cleanups permitted where the typed row makes the current shape awkward — strictly behavior-neutral, E2E-verified. Remove null-guards/casts the typed row makes redundant.
- **D-04 — Fix the two TS2352 casts properly** (`entity as AnyEntityVariantData` 374:33 and `... as AnyQuestionVariantData` 549:14): narrow to the correct variant type at the construction site. Do not fall back to the `as unknown as X // reason:` idiom for these two.
- **D-05 — Generify `toDataObject` NOW**, backward-compatibly — `supabaseDataWriter.ts` and other Phase-127-scope call sites must keep compiling UNCHANGED (e.g. generic parameter defaulting to `Record<string, unknown>`). Update `toDataObject`'s own tests as needed; do not edit Phase-127 files.
- **D-06 — Full acceptance gate:** build + unit tests + svelte-check showing all 79 supabaseDataProvider.ts (non-test) errors gone with no net-new (133 → exact number pinned at plan time) + **one full E2E suite run** as the behavior-neutrality trust signal (cardinal rule). E2E prereqs: fresh dev server on :5173 + clean DB (`yarn db:reset`).
- **D-07 — Delete `declare module 'qs';`** from `global.d.ts:13`; acceptance = svelte-check error set unchanged by that deletion.

### Claude's Discretion
- Commit granularity beyond D-02's regen-is-atomic rule — prefer per-cluster atomic commits (regen / provider typing / toDataObject generification / qs-shim) for clean bisects.
- The exact generic signature for `toDataObject` (constraint shape, default parameter), as long as D-05's backward-compatibility constraint holds.
- Whether `_getNominationData` cleanups extract helpers into the file or into `utils/`.
- How to verify the regenerated `get_nominations` Returns shape matches what the adapter reads (spot-check against 503-entity-rpcs.sql is cheap and recommended). — **Done in this research; see below.**

### Deferred Ideas (OUT OF SCOPE)
None raised. Explicitly NOT in scope: `supabaseDataProvider.test.ts` errors (10, Phase 128/TYPE-08), `supabaseDataWriter.ts` remainder + contexts (Phase 127/TYPE-05/06), long-tail/docs (Phase 128), gate flip (Phase 132). Cluster-scoped discipline: do not fix neighboring-phase errors beyond what the regen unavoidably clears.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TYPE-04 | `supabaseDataProvider.ts` typed against generated Supabase types — its 79 errors (untyped `Json`/row shapes, possibly-null) cleared without changing runtime behavior | Measured: regen clears 75/79; residual 4 (259/260 null→undefined, 374/549 variant narrowing) cleared by provider work. Runtime guards (`parseStoredImage`/`parseAnswers`/`localizeRow`) confirmed still required (JSONB stays `Json`). |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| RPC/row type contracts | Database / Storage (generated `Database` type) | — | Types are generated from Postgres schema; single source of truth is `apps/supabase/supabase/schema` → migrations → `supabase gen types` |
| Row → domain-object mapping | API / Backend adapter (`SupabaseDataProvider`, `toDataObject`) | — | Adapter transforms raw DB rows into `@openvaa/data` domain shapes; typing lives here |
| Runtime JSONB shape validation | API / Backend adapter (`parseStoredImage`, `parseAnswers`, `getLocalized`) | — | JSONB columns type as opaque `Json`; runtime guards are the only place that narrows them safely |
| Type generation tooling | Build / tooling (`@openvaa/supabase-types` `generate` script) | — | Raw-source package, no compile; `supabase gen types --local` reads the running DB |

## Standard Stack

No new packages. All tooling already present.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `supabase` CLI | v2.83.0 (installed; v2.109.1 available — do NOT upgrade in this phase) | `supabase gen types typescript --local` regenerates `database.ts` | Official Supabase type-gen; already the project's `db:types` mechanism |
| `prettier` | catalog pin | Formats the generated file (`generate` script runs `prettier --write`) | Generated file is NOT in `.prettierignore`; regen output is already repo-formatted |
| `svelte-check` (`yarn check`) | project pin | Before/after error measurement | Established baseline tool; scriptable `COMPLETED … ERRORS …` summary line |
| `vitest` | project pin | `toDataObject.test.ts` unit gate | D-05 test updates |
| `@playwright/test` | project pin | Full E2E suite = behavior-neutrality signal (D-06) | Cardinal rule; last green 125/0/0 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `yarn db:types` regen (D-01) | Hand-write a `get_nominations` RPC row interface | Rejected by D-01 — drifts from schema, duplicates source of truth. Regen is root-cause. |

**Regen command (exact):**
```bash
yarn db:types
# → yarn workspace @openvaa/supabase-types generate
# → supabase gen types typescript --local --workdir ../../apps/supabase > src/database.ts && prettier --write src/database.ts
```

## Package Legitimacy Audit

**None — this phase installs no external packages.** All tooling (`supabase` CLI, `prettier`, `svelte-check`, `vitest`, Playwright) is already in the repo. No audit required.

## Regen Path — Verified Mechanics (D-01)

**Measured this session.** All claims `[VERIFIED: executed 2026-07-16, file restored via git checkout]` unless noted.

1. **Command:** `yarn db:types` runs `supabase gen types typescript --local --workdir ../../apps/supabase > src/database.ts && prettier --write src/database.ts` (from `packages/supabase-types/package.json:14`).
2. **Requires local Supabase DB running.** It connects to `postgresql://…:54322/postgres`. During this research the DB was up (`supabase_db_openvaa-local`); edge-runtime/pooler being stopped did **not** block type-gen (only the Postgres container is read). If the DB is down, `db:start` first. A `db:reset` guarantees the RPC exists — `get_nominations` is defined in migrations `00001_initial_schema.sql` and `00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql` (source of truth: `apps/supabase/supabase/schema/503-entity-rpcs.sql:11`).
3. **Output is prettier-formatted.** The `generate` script runs `prettier --write`; `database.ts` is not in `.prettierignore` and no eslint ignore targets it. So the committed regen is already lint/format-clean — **no separate format step, and `yarn format:check` won't flag it.** [VERIFIED: .prettierignore inspected]
4. **No downstream rebuild needed.** `@openvaa/supabase-types` is **raw `.ts` source** — its `build` script is `echo 'Raw .ts source — no build step needed'`, and it exports `./src/index.ts` / `./src/database.js` directly. The frontend imports `@openvaa/supabase-types` and svelte-check reads the source. **No `yarn build --filter=@openvaa/supabase-types` is required for new types to propagate.** [VERIFIED: package.json + index.ts inspected] (pitfall #7 resolved)
5. **No test snapshots the generated types.** `toDataObject.test.ts` tests runtime behavior only; no type-snapshot test of `database.ts` exists. [VERIFIED: grep]

### Regenerated `get_nominations` shape (spot-checked against 503-entity-rpcs.sql)
`Returns` is a **33-column row array** (`{ … }[]`) matching the SQL `RETURNS TABLE` exactly. JSONB columns type as `Json`, uuid/text as `string`, integer as `number`, and `entity_type` as `Database["public"]["Enums"]["entity_type"]`:
```
Args: { p_constituency_id?: string; p_election_id?: string; p_include_unconfirmed?: boolean }
Returns: {
  id: string; name: Json; short_name: Json; info: Json; color: Json; image: Json;
  sort_order: number; subtype: string; custom_data: Json;
  entity_type: Enums['entity_type'];
  candidate_id: string; organization_id: string; faction_id: string; alliance_id: string;
  election_id: string; constituency_id: string; election_round: number; election_symbol: string;
  parent_nomination_id: string;
  entity_id: string; entity_name: Json; entity_short_name: Json; entity_info: Json;
  entity_color: Json; entity_image: Json; entity_sort_order: number; entity_subtype: string;
  entity_custom_data: Json; entity_answers: Json;
  entity_first_name: string; entity_last_name: string; entity_organization_id: string;
}[]
```
Every column the adapter reads in `_getNominationData` (288–371) is present, so the TS2339 "property does not exist" and TS18047/18048 "possibly null" clusters collapse: `results.flatMap((r) => r.data ?? [])` yields `Array<Row>`, and `row` is `Row` (non-null) with typed fields. [VERIFIED]

## Drift Surface (D-02) — Measured

The committed `database.ts` was last generated **2026-03-22** ("v2.0 Branch Integration") — it predates even the 2026-03-31 `00001_initial_schema.sql`. It is materially stale. Regen diff = **170 insertions / 18 deletions**. [VERIFIED: git diff --stat before restore]

### Functions ADDED by regen (7)
`get_nominations`, `get_candidate_user_data`, `is_localized_string`, `is_valid_choice_id`, `jsonb_recursive_merge`, `merge_custom_data`, `merge_jsonb_column`. None removed.

### Tables ADDED by regen (1)
`admin_jobs`. None removed. (Present in schema `108-admin-jobs.sql` + migration `00001`, absent from stale types.)

### Function-arg renames (all gained a `p_` prefix)
`has_role` (`check_role`→`p_check_role`), `upsert_answers` (`answers/entity_id/overwrite`→`p_*`), `bulk_import` (`data`→`p_data`), `custom_access_token_hook` (`event`→`p_event`), `delete_storage_object` (`bucket/file_path`→`p_*`), `merge_custom_data` (`p_patch/p_question_id`).

**Critical:** the frontend `.rpc()` call sites **already pass `p_`-prefixed arg names** (they were written against the real DB). So these renames **FIX** existing mismatches (e.g. writer `upsert_answers` 318 error was "'p_entity_id' does not exist… Did you mean 'entity_id'?"), they do **not** create new ones. `has_role` is never called from the frontend via `.rpc()` (it is an RLS-internal function), so its rename is inert to frontend typechecking. [VERIFIED: grep of all frontend `.rpc(` calls]

### Net-new errors introduced by regen — CONTAINED
Comparing the full before/after error inventories: **the only net-new errors appear inside the target file** at `supabaseDataProvider.ts:259` and `:260` (`p_election_id`/`p_constituency_id` are now typed `string | undefined`, but the code passes `eid`/`cid` typed `string | null` from `Array<string | null>`). **No net-new errors appeared anywhere outside the target file** — the `admin_jobs` addition and any table-column nullability changes did **not** break any `.from()` read across the frontend. Table drift is safe. [VERIFIED: full svelte-check inventories diffed]

## Exact Error Accounting (measured)

**Baseline:** `COMPLETED 2090 FILES 133 ERRORS 1 WARNINGS`.
**After regen alone (provider code UNCHANGED):** `COMPLETED 2090 FILES 50 ERRORS 1 WARNINGS`.

| File | Baseline | After regen | Cleared by regen | Notes |
|------|----------|-------------|------------------|-------|
| `supabaseDataProvider.ts` (target) | 79 | **4** | 75 | residual = 259, 260 (net-new null/undefined), 374, 549 (TS2352, D-04) |
| `supabaseDataWriter.ts` (Phase 127) | 11 | 3 | 8 | cleared: get_candidate_user_data cluster (211/223/224/225/227/238) + merge_custom_data (396) + admin_jobs (415→shifted); residual: 242 `['Row']` code bug, 319 answers→Json, 415 JobMessage/project_id column mismatch |
| `supabaseAdminWriter.ts` (Phase 127) | 2 | 1 | 1 | cleared merge_custom_data (26); residual 49 JobMessage/project_id column mismatch |
| all other files | 41 | 41 | 0 | **unchanged** — provider.test (10), adminContext (8), candidateContext (6), authContext (4), writer.test (4), settings (2), layout.server (2), + 5 singletons |

**Target-file residual after regen (the 4 the provider work must clear):**
- `259:11` + `260:11` — `Type 'string | null' is not assignable to type 'string | undefined'` (net-new; RPC args now `string | undefined`). Fix: coerce null→undefined at the call — `p_election_id: eid ?? undefined` (or change the local `electionIds`/`constituencyIds` array types to `Array<string | undefined>`). **Behavior-neutral:** omitting the arg / passing `undefined` triggers the SQL `DEFAULT NULL` — identical to passing `null` (both mean "no filter").
- `374:33` — `entity as AnyEntityVariantData` (TS2352). **Does NOT auto-dissolve** (see Pitfall 1). D-04 narrowing required.
- `549:14` — `... as AnyQuestionVariantData` (TS2352). D-04 narrowing required.

**Predicted final count after provider work clears those 4:** `50 − 4 = ` **≈46 errors / 1 warning**, `supabaseDataProvider.ts` at 0. **Pin exactly at plan time; measured value = 46.** qs-shim deletion (D-07) does not change the count.

> **Planner action:** update D-06's "133 → ~54" expectation to **133 → ~46**. The `~54` figure assumed only the 79 target errors clear; the root-cause regen unavoidably also clears ~9 writer/adminWriter errors (permitted under D-02's "no hand-trimming"). This is error-*reduction*, not net-new, so it satisfies the cardinal accounting — but the narrative must acknowledge the cross-file blast radius so Phase 127's remaining scope (writer 242/319/415, adminWriter 49, the `Promise<UniversalDataWriter>` context errors) is correctly re-scoped downward.

## Design Guidance — D-05 (generify `toDataObject`)

**Current signature** (`utils/toDataObject.ts:24`):
```ts
export function toDataObject(
  row: Record<string, unknown>,
  locale: string,
  defaultLocale: string = 'en',
  additionalLocalizedFields: Array<string> = []
): Record<string, unknown>
```
**Call sites** (all currently pass `row as Record<string, unknown>`): provider — `_getElectionData:154`, `_getConstituencyData:191,211`, `_getNominationData:316,355`, `_getEntityData:455`, `_getQuestionData:487,522`; **writer (Phase 127, must stay unchanged)** — `supabaseDataWriter.ts`. The internal pipeline (`localizeRow` → `mapRow`) is already generic: `mapRow<TRow extends Record<string, unknown>>`.

**Backward-compatible proposal (Claude's discretion — this shape satisfies D-05):**
```ts
export function toDataObject<TRow extends Record<string, unknown> = Record<string, unknown>>(
  row: TRow,
  locale: string,
  defaultLocale: string = 'en',
  additionalLocalizedFields: Array<string> = []
): Record<string, unknown>
```
- The **defaulted** generic param (`= Record<string, unknown>`) keeps every existing call site — including all writer call sites — compiling **unchanged**. [D-05 constraint satisfied]
- Lets a typed row (the `get_nominations` Row element, or a `.from()` Row) flow in **without** the `as Record<string, unknown>` input cast at provider call sites (a D-03 cleanup).
- **Return type stays `Record<string, unknown>`** because `mapRow` erases the column mapping — so the output narrowing (374/549) is a **separate** concern handled by D-04, not by D-05. Do not over-reach D-05 into typing the return; that would break the backward-compat constraint.
- **Test impact minimal:** `toDataObject.test.ts` passes plain object literals; with a defaulted generic they still compile and pass unchanged. Optionally add one typed-row test to lock the generic. [VERIFIED: test file inspected]

## Design Guidance — D-04 (the two TS2352 casts)

Both `AnyEntityVariantData` and `AnyQuestionVariantData` are **discriminated unions of constructor `data`-argument types** keyed on a `type` discriminant:
- `AnyEntityVariantData = EntityVariantData[keyof …]` — union of Candidate/Faction/Organization/Alliance data. TS2352 says the built object is missing `firstName, lastName, type, id` from `CandidateData`. (`packages/data/src/objects/entities/variants/variants.ts:41`)
- `AnyQuestionVariantData = QuestionVariantData[keyof …]` — union of 9 question-type data shapes. TS2352 says missing `name, categoryId, id` from `MultipleChoiceQuestionData`. (`packages/data/src/objects/questions/variants/variants.ts:106`)

**Why the cast doesn't auto-dissolve:** the object is assembled as `Record<string, unknown>` (entity: line 358) or as a structural literal spreading `...obj` where `obj` is the `Record<string, unknown>` output of `toDataObject` (question: line 550). TS cannot see `id`/`name`/`categoryId`/`type` through `Record<string, unknown>`, so the union isn't structurally satisfied → the cast is required. **Typing the RPC row does not fix the OUTPUT side.**

**Fix approach (D-04, no `as`):** construct an explicitly-typed intermediate that names the required discriminant + identity fields, e.g. pull `id`, `type`/`entityType`, and (for questions) `name`, `categoryId` explicitly from the typed row rather than relying on `...obj` to carry them opaquely. For the entity site, branch on `entityType` (already done at 368 for Candidate fields) and build the variant-specific object so the discriminated union resolves. This is **MEDIUM effort** (not a one-line removal) and pairs naturally with the D-03 light refactor of `_getNominationData`. Effort correction noted in Pitfall 1.

## Common Pitfalls

### Pitfall 1: Assuming the 374 cast "dissolves once the RPC row is typed"
**What goes wrong:** CONTEXT §D-04 says "The 374 cast likely dissolves once the RPC row is typed." **Measured: it does NOT.** After the regen with provider code untouched, both `374:33` and `549:14` TS2352 errors are still present.
**Why:** the casts are on the OUTPUT object (a `Record<string, unknown>`/structural literal), not on the RPC row input. Typing the input row fixes the property-access errors but not the output union-assignment.
**How to avoid:** plan explicit D-04 narrowing work for BOTH casts as a real task (MEDIUM effort), not as a freebie that falls out of the regen.

### Pitfall 2: Expecting "133 → ~54"; the real target is ~46
**What goes wrong:** the CONTEXT's ~54 assumed only the 79 target errors clear. The root-cause regen also clears ~9 writer/adminWriter errors (they share the same staleness), so measured post-phase is ~46.
**How to avoid:** pin the number empirically at plan time (measured: 50 post-regen, 46 post-provider-work). Re-scope Phase 127 downward accordingly. Do NOT treat the extra clearing as a violation of cluster discipline — it's an unavoidable consequence of D-02's "no hand-trimming the regen."

### Pitfall 3: Running regen with the DB down / against an un-migrated DB
**What goes wrong:** `supabase gen types --local` reads the running Postgres. If Supabase is stopped, it fails; if the DB is on an old migration state, `get_nominations` may be absent or wrong.
**How to avoid:** ensure `yarn db:status` shows the DB up (a `db:reset` guarantees migrations `00001`+`00002` applied). The RPC is in both migrations.

### Pitfall 4: Removing the JSONB runtime guards
**What goes wrong:** deleting `parseStoredImage`/`parseAnswers`/`getLocalized`/`localizeRow` calls thinking the typed row makes them redundant.
**Why:** regenerated JSONB columns type as opaque `Json` (`name`, `image`, `color`, `custom_data`, `entity_answers`, etc. are all `Json`) — the typed row gives you `Json`, not a `StoredImage`/`LocalizedAnswers`/localized string. The guards remain the ONLY safe narrowing. [VERIFIED: regenerated Returns shape]
**How to avoid:** keep all runtime guards. The pre-existing `as Json as unknown as StoredImage | null // reason:` idioms at image sites are OUTSIDE the 79-error set and are NOT in scope to churn (D-04 forbids `as unknown as X` only for the two TS2352s at 374/549).

### Pitfall 5: null vs undefined at the RPC call is behavior-changing
**What goes wrong:** worrying that changing `p_election_id: eid` (where `eid` can be `null`) to `eid ?? undefined` alters query behavior.
**Why it's fine:** the RPC signature is `p_election_id uuid DEFAULT NULL`; the SQL filter is `(p_election_id IS NULL OR n.election_id = p_election_id)`. Passing `undefined` omits the key → PostgREST applies the `DEFAULT NULL` → identical to passing `null`. Behavior-neutral. [VERIFIED: 503-entity-rpcs.sql:11-14,79]

## Runtime State Inventory

This is a type-only, behavior-neutral change (regenerate types + annotate code + delete one inert shim). It does not rename any stored key, service config, OS registration, secret, or user-facing string.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no DB records reference any renamed identifier | None |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts / installed packages | `@openvaa/supabase-types` is raw-source (no build); regenerated `database.ts` is picked up directly by svelte-check/frontend — **no rebuild needed** | None (verified by measured `yarn check` picking up regen without a build) |

**Nothing found in any category** — verified by grep + the regen mechanics inspection above.

## Validation Architecture

nyquist_validation key absent in `.planning/config.json` → treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `svelte-check` (type gate) + `vitest` (unit) + `@playwright/test` (E2E behavior-neutrality) |
| Config file | `apps/frontend` workspace scripts |
| Quick run command | `cd apps/frontend && yarn check` (~2–3 min) — the primary count gate |
| Unit command | `yarn test:unit` (covers `toDataObject.test.ts`) |
| Full suite command | `yarn test:e2e` (last green 125/0/0) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | Exists? |
|--------|----------|-----------|-------------------|---------|
| TYPE-04 | `supabaseDataProvider.ts` non-test errors = 0; total = ~46; no net-new | type-check | `cd apps/frontend && yarn check` → assert `supabaseDataProvider.ts` absent from ERROR lines + `COMPLETED … 46 ERRORS` (pin at plan) | ✅ |
| TYPE-04 | `toDataObject` generic change keeps behavior | unit | `yarn test:unit` (toDataObject.test.ts) | ✅ |
| TYPE-04 | No runtime behavior change (D-06 trust signal) | e2e | `yarn db:reset` + fresh dev server on :5173 + `yarn test:e2e` | ✅ |

### Sampling Rate
- **Per task commit:** `yarn check` (target-file error count) + `yarn test:unit`.
- **Around the regen commit (D-02):** capture `COMPLETED … ERRORS` before and after (expect 133 → 50).
- **Phase gate (D-06):** full `yarn build` + `yarn test:unit` + `yarn check` (=~46, provider at 0) + one full `yarn test:e2e` green (cardinal rule; "did not run" = failure). E2E prereqs: `yarn db:reset` + fresh dev server on :5173.

### Wave 0 Gaps
- None — existing test infrastructure (svelte-check, vitest, Playwright) covers all phase requirements. Optionally add a typed-row assertion to `toDataObject.test.ts` when generifying (D-05).

## Security Domain

security_enforcement key absent → treated as enabled. This is a **type-only, behavior-neutral** change with **no new runtime surface**: no new endpoints, no auth/session/access-control logic changes, no new input parsing, no crypto. The `get_nominations` RPC already exists in production with its RLS guard (SECURITY INVOKER + the `COALESCE(c.id,o.id,f.id,a.id) IS NOT NULL` leak guard, migration `00002`) — this phase only makes its TypeScript type visible; it does not alter the SQL or the query.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | unchanged; no auth code touched |
| V3 Session Management | no | unchanged |
| V4 Access Control | no | RLS on `get_nominations` unchanged (SQL not modified) |
| V5 Input Validation | no | no new inputs; JSONB runtime guards (`parseAnswers`/`parseStoredImage`) preserved, not added |
| V6 Cryptography | no | none |

No STRIDE-relevant change: the diff is generated types + type annotations + one inert `declare module` deletion. E2E full-suite green is the sufficient regression guard.

## Sources

### Primary (HIGH confidence — executed this session)
- `yarn db:types` regen against live local Supabase → measured 170/18 diff, 33-column `get_nominations` Returns, function/table additions [VERIFIED, file restored via `git checkout`]
- `cd apps/frontend && yarn check` before/after → 133 → 50 errors, full residual inventory diffed [VERIFIED]
- `apps/supabase/supabase/schema/503-entity-rpcs.sql:11` — `get_nominations` RETURNS TABLE (33 cols) [CITED]
- `packages/supabase-types/{package.json,src/index.ts,src/database.ts}` — raw-source, no build; Functions/Tables lists [VERIFIED]
- `.prettierignore` — generated file not ignored; regen self-prettifies [VERIFIED]
- `packages/data/src/objects/{entities,questions}/variants/variants.ts` — union shapes for D-04 [VERIFIED]
- `apps/frontend/src/lib/api/adapters/supabase/utils/{toDataObject,mapRow,localizeRow,storageUrl}.ts` + `parseAnswers.ts` — helper seam for D-05 + runtime guards [VERIFIED]
- Scratchpad artifacts: `svelte-check-126.txt` (baseline), `database-regen-dryrun.ts`, `svelte-check-after-regen-full.txt`

### Secondary (MEDIUM)
- `.planning/phases/126-svelte-check-0-supabasedataprovider/126-CONTEXT.md` (locked decisions)
- `.planning/REQUIREMENTS.md:101` (TYPE-04)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Provider-typing work clears exactly the 4 residual target errors with no further net-new → final ≈46 | Error Accounting | Low — planner re-measures at gate; number is a target, not a contract. The 259/260 fix + 374/549 narrowing are localized and behavior-neutral. |
| A2 | D-04 narrowing for 374/549 is MEDIUM effort (explicit typed intermediates), not auto-dissolving | D-04 Guidance | Low — measured that both casts persist post-regen; approach is standard discriminated-union narrowing. |

All other claims are `[VERIFIED]` by this session's execution. If A1/A2 shift at plan time, only the pinned count and the D-04 task size change — not the phase shape.

## Open Questions (RESOLVED)

1. **Exact final count after provider work.** — RESOLVED: pinned empirically at the 126-03/126-05 gate (plans assert the measured `yarn check` count in evidence rather than hardcoding 46).
   - What we know: regen → 50 (measured); target residual = 4; provider work clears them → 46.
   - What's unclear: whether the D-04 narrowing or the D-05 generification incidentally shifts any adjacent error by ±1.
   - Recommendation: pin the number empirically in the plan's acceptance step (`yarn check` assertion), stated as "~46, exact TBD at gate," per D-06.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| local Supabase (Postgres :54322) | `yarn db:types` regen | ✓ (up this session) | supabase CLI v2.83.0 | `yarn db:start` / `yarn db:reset` |
| supabase CLI | type generation | ✓ | v2.83.0 (v2.109.1 available — do NOT upgrade in-phase) | — |
| Node/yarn workspace toolchain | build/check/test | ✓ | project pin | — |
| dev server :5173 + clean DB | E2E gate (D-06) | provisioned at gate time | — | `yarn db:reset` + fresh `yarn dev` |

**Missing dependencies with no fallback:** none.

## Metadata

**Confidence breakdown:**
- Regen mechanics & drift: HIGH — executed and measured against live schema, file restored.
- Error accounting (133→50→~46): HIGH — measured; only the final −4 is projected (A1).
- D-04 narrowing approach: MEDIUM — variant shapes verified; exact code left to planner/implementer (Claude's discretion).
- D-05 generic signature: HIGH — backward-compat verified against the helper chain and test.

**Research date:** 2026-07-16
**Valid until:** ~2026-07-30 (30 days; stable — regen output only changes if the schema/migrations change).
