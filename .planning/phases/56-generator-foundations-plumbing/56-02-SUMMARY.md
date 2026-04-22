---
phase: 56-generator-foundations-plumbing
plan: 02
subsystem: dev-seed
tags: [supabase, admin-client, bulk-import, rpc, split]
requires: [56-01]
provides:
  - "@openvaa/dev-seed#SupabaseAdminClient (base, bulk-write surface)"
  - "@openvaa/dev-seed#TEST_PROJECT_ID"
  - "@openvaa/dev-seed#FindDataResult"
affects:
  - "tests/tests/utils/supabaseAdminClient.ts (will be rewritten as subclass in plan 56-10)"
tech-stack:
  added: []
  patterns:
    - "Protected-field subclass-reuse pattern (client/projectId exposed for tests/ subclass)"
    - "Thin RPC wrapper pattern — routing enforcement deferred to Writer (plan 56-04)"
key-files:
  created:
    - packages/dev-seed/src/supabaseAdminClient.ts
  modified: []
decisions:
  - "Protected (not private) client/projectId fields — RESEARCH finding 5, avoids duplicating Supabase client in tests/ subclass"
  - "Env-var fallbacks preserved — env enforcement is Writer's job per D-15, not base client's"
  - "FindDataResult interface exported here even though findData() stays in tests/ — so tests/ can re-export it cleanly from @openvaa/dev-seed"
  - "Line count deviates from plan's ≤400 bound (actual 485) — verbatim preservation of source methods + JSDoc outweighs arbitrary line budget; documented below"
metrics:
  duration: "~25 minutes"
  completed: 2026-04-22
  plan_tasks: 1
  plan_tasks_completed: 1
---

# Phase 56 Plan 02: Admin-client base split Summary

**One-liner:** Bulk-write surface of the 858-line `tests/tests/utils/supabaseAdminClient.ts` extracted into `@openvaa/dev-seed/src/supabaseAdminClient.ts` per D-24, with `protected` fields so plan 56-10's tests/ subclass can reuse the Supabase REST client for its auth/email helpers.

## What Was Built

A single new file, `packages/dev-seed/src/supabaseAdminClient.ts` (485 lines), containing:

**Module-level exports:**
- `TEST_PROJECT_ID` — stable default project UUID (copy of source line 26)
- `FindDataResult` interface — consumed by `findData()` in the tests/ subclass (plan 56-10 re-exports via `export type { FindDataResult } from '@openvaa/dev-seed'`)
- `SupabaseAdminClient` class

**Module-level private constants / helpers:**
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` with env-var fallbacks for tests/ E2E backward-compat
- `COLLECTION_MAP` = `{ ...TABLE_MAP, parties: 'organizations', questionTypes: 'question_types' }`
- `FIELD_MAP` = `{ ...PROPERTY_MAP, documentId: 'id' }`
- `resolveCollectionName` / `resolveFieldName`

**Class surface (5 public async methods + ctor):**
- `constructor(url?, serviceRoleKey?, projectId?)`
- `async bulkImport(data)` — RPC wrapper with field-stripping (source lines 158–198)
- `async bulkDelete(collections)` — RPC wrapper (source lines 207–218)
- `async importAnswers(data)` — question external_id → UUID resolution (source lines 234–305)
- `async linkJoinTables(data)` — three join tables + question_category.election_ids (source lines 322–480)
- `async updateAppSettings(partialSettings)` — merge_jsonb_column RPC (source lines 495–514)

## Method-by-Method Provenance

| Method / Constant | Source lines (`tests/tests/utils/supabaseAdminClient.ts`) | Status |
|---|---|---|
| `TEST_PROJECT_ID` | 26 | verbatim |
| `SUPABASE_URL` fallback | 31 | verbatim |
| `SUPABASE_SERVICE_ROLE_KEY` fallback | 37–39 | verbatim |
| `COLLECTION_MAP` | 45–50 | verbatim |
| `FIELD_MAP` | 56–60 | verbatim |
| `FindDataResult` interface | 65–69 | verbatim |
| `resolveCollectionName` | 75–77 | verbatim |
| `resolveFieldName` | 83–85 | verbatim |
| `client` / `projectId` fields | 88–89 | **DIVERGED**: `private` → `protected` (RESEARCH finding 5) |
| `constructor` | 91–96 | verbatim |
| `bulkImport` | 158–198 | verbatim logic; formatting touched by prettier |
| `bulkDelete` | 207–218 | verbatim |
| `importAnswers` | 234–305 | verbatim |
| `linkJoinTables` | 322–480 | verbatim; two local variable annotations added to satisfy strict TS (see Deviations) |
| `updateAppSettings` | 495–514 | verbatim |

**Not ported** (stay in tests/ per D-24, plan 56-10 keeps them in the subclass):
`fixGoTrueNulls`, `safeListUsers`, `findData`, `query`, `update`, `setPassword`, `forceRegister`, `unregisterCandidate`, `sendEmail`, `sendForgotPassword`, `deleteAllTestUsers`.

## D-11 Routing Note Carried to JSDoc

The file-header JSDoc now carries the routing constraint from D-11 verbatim:

> `bulk_import` RPC's `processing_order` accepts exactly 11 of 16 non-system tables. `accounts`, `projects`, `feedback`, `constituency_group_constituencies`, `election_constituency_groups` are NOT in that list. Callers must route those elsewhere (writer strips accounts/projects, feedback via direct upsert, joins via `linkJoinTables`). This file does not enforce the routing — it is a thin RPC wrapper.

This lets the Writer (plan 56-04) land without re-litigating the routing split; any future caller reading the dev-seed file finds the constraint inline.

## Acceptance Criteria — Verification Matrix

| Criterion | Result |
|---|---|
| `test -f packages/dev-seed/src/supabaseAdminClient.ts` | PASS |
| `grep -q 'protected client: SupabaseClient'` | PASS |
| `grep -q 'protected projectId'` | PASS |
| `grep -q "export const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000001'"` | PASS |
| `grep -q "export class SupabaseAdminClient"` | PASS |
| `grep -q "export interface FindDataResult"` | PASS |
| `grep -q "async bulkImport"` | PASS |
| `grep -q "async bulkDelete"` | PASS |
| `grep -q "async importAnswers"` | PASS |
| `grep -q "async linkJoinTables"` | PASS |
| `grep -q "async updateAppSettings"` | PASS |
| `grep -q "rpc('bulk_import'"` | PASS |
| `grep -q "from '@supabase/supabase-js'"` | PASS |
| `grep -q "from '@openvaa/supabase-types'"` | PASS |
| `grep -q "NON_COLUMN_FIELDS"` + nomination polymorphism workaround | PASS |
| Forbidden methods absent (`setPassword`/`forceRegister`/`sendEmail`/`findData`/`fixGoTrueNulls`) | PASS |
| `yarn workspace @openvaa/dev-seed typecheck` exits 0 | PASS |
| `yarn workspace @openvaa/dev-seed lint` exits 0 | PASS |
| `grep -c 'async' ≥ 5` | PASS (exactly 5) |
| Line count ≥ 250 | PASS (485) |
| Line count ≤ 400 | **DEVIATION** (485) — see below |

Line-count delta vs 858-line source: **485 lines kept**, 373 lines excised (43% reduction — the auth/email/query helpers + JSDoc for them).

## Deviations from Plan

### 1. [Rule 3 – Blocking issue] Strict-TS type annotations added to `linkJoinTables` locals

**Found during:** Task 1 typecheck after first verbatim paste.
**Issue:** The dev-seed package has strict TypeScript enabled. Two local variables inside `linkJoinTables` (`cgRefs` in the election→constituency_groups block, `constRefs` in the constituency_group→constituencies block) used an implicit union type `Array<{ external_id: string }> | Array<Record<string, string>>` that strict TS narrowed against later reads like `cgRef.externalId` / `constRef.externalId`, producing `TS2551: Property 'externalId' does not exist on type '{ external_id: string }'`.
**Why it didn't error in the source:** `tests/` has no tsconfig.json — Playwright transpiles TS ad-hoc with loose inference, so the type narrowing never ran.
**Fix:** Added explicit annotation `const cgRefs: Array<Record<string, string>> | undefined = …` and `const constRefs: Array<Record<string, string>> | undefined = …`. Both collapse the union to the superset so the later `cgRef.externalId ?? cgRef.external_id` fallback reads stay type-clean. **Runtime semantics identical** — `Record<string, string>` is a structural supertype of `{ external_id: string }`.
**Files modified:** `packages/dev-seed/src/supabaseAdminClient.ts`
**Commit:** included in `f7b1f3fcc`

### 2. [Plan-internal contradiction] Line count exceeds the plan's `≤400` upper bound

**Found during:** Task 1 final verification.
**Issue:** Plan acceptance criterion says `[ $(wc -l < …) -le 400 ]`, but actual file is 485 lines.
**Root cause:** The plan simultaneously mandates "preserve existing method logic **verbatim**" and "Do NOT 'clean up' or 'simplify'" (non-negotiable per executor context) while also imposing a `≤400` upper bound. The source methods being copied span ~344 lines of bare code (ctor 6 + helpers 14 + bulkImport 41 + bulkDelete 12 + importAnswers 72 + linkJoinTables 159 + updateAppSettings 20 + class scaffolding 20); adding the file-header + per-method JSDoc (which the source also has) lands the file in the 470–500 range inevitably.
**Decision:** Honor the verbatim mandate (marked non-negotiable, directly impacts downstream plan 56-04's ability to consume the file without re-testing) over the line budget (single grep-style test, no downstream consumer depends on it). The `min_lines ≥ 250` lower bound in must_haves.artifacts and the `contains: "protected client"` contract-level constraint both pass.
**Files modified:** None (the deviation is a documented acceptance-criterion carve-out, not a code change).
**Commit:** N/A
**Recommendation for future plans:** Either (a) relax the line budget when the task is "narrow extract + verbatim copy," or (b) pre-strip JSDoc from the counted range. Not worth re-opening this plan for.

### 3. [Trivial] Prettier reformatting on commit

**Found during:** Task 1 commit hook.
**Issue:** The repo's `lint-staged` config ran `prettier --write` on the staged file, producing minor formatting changes (import reordering, `type` keyword placement, wrapped long lines). File grew from 481 → 485 lines post-prettier.
**Fix:** None needed — this is the intended dev-loop behavior; formatting is stable for future commits.
**Files modified:** `packages/dev-seed/src/supabaseAdminClient.ts` (via pre-commit hook)
**Commit:** `f7b1f3fcc`

## Private → Protected Field Visibility Change (RESEARCH Finding 5)

The only semantic divergence from source:

```diff
- private client: SupabaseClient;
- private projectId: string;
+ protected client: SupabaseClient;
+ protected projectId: string;
```

This is the enabling change for D-24's subclass pattern: plan 56-10's tests/ subclass will call `this.client.auth.admin.*` (for `setPassword`, `forceRegister`, etc.) and `this.client.from(...)` (for `findData`, `query`, `update`). Making the fields `protected` avoids duplicating the Supabase client in the subclass.

No external API surface change — subclass-only reach; consumers of the public class methods see zero behavior change.

## Next

- **Plan 56-03:** Template schema + types (TMPL-01, TMPL-02, TMPL-08, TMPL-09) — independent of this file.
- **Plan 56-04 (Writer):** Will `import { SupabaseAdminClient, TEST_PROJECT_ID } from './supabaseAdminClient'` and call `bulkImport` / `importAnswers` / `linkJoinTables` / `updateAppSettings` in sequence. This file is ready.
- **Plan 56-10 (tests/ rewrite):** Will `extends SupabaseAdminClient` and layer auth/email + legacy E2E query helpers on top. Can access `this.client` and `this.projectId` via the `protected` visibility enabled here.

## Self-Check: PASSED

- File exists: `packages/dev-seed/src/supabaseAdminClient.ts` — FOUND
- Commit exists: `f7b1f3fcc` — FOUND
- All 16 grep-style acceptance criteria — PASS
- `yarn workspace @openvaa/dev-seed typecheck` — clean
- `yarn workspace @openvaa/dev-seed lint` — clean
- `yarn workspace @openvaa/dev-seed test:unit` — clean (no test files yet, `--passWithNoTests` baseline)
- Documented deviations: 3 (1 Rule-3 strict-TS fix, 1 plan-internal line-count contradiction, 1 trivial prettier reformat)
