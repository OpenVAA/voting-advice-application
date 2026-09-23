# Phase 157: Adapter Boundary & Typing - Research

**Researched:** 2026-08-28
**Domain:** Frontend data-adapter boundary (SvelteKit + Supabase), runtime schema validation (zod 4), PostgreSQL RPC design, ESLint flat-config guards, structured logging in a shared ESM package
**Confidence:** HIGH for everything measured in-tree; MEDIUM for the Supabase `current_password` server gate (one env-var name unverified against a live GoTrue); LOW for nothing load-bearing.
**Measurement HEAD:** `db220cb5f` (branch `integration/ship-12-squash`). The CONTEXT was measured at `52c631edf`; the only commits between are `.planning/` docs, so every source line number below is directly comparable.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-F1** — Criterion 4 restated against the real target: **remove the two ignored params from `_setPassword` and from the `UniversalDataWriter` abstract signature.** Operator NOTES, verbatim and binding: *"Also check that currentPassword and authToken are not used anywhere else."* Amended by the roadmap's second correction pass: `WithAuth` (capital W) **does** exist and **is** "the interface shape that required it" — both halves (a) the ignored params and (b) the `WithAuth` type are in scope. Close condition: `grep -rin 'withauth'` returns zero.
- **D-F2** — **Zod schemas colocated with the types in `@openvaa/app-shared`, parsed at the adapter edge.** Rejected: hand-written type guards; generators from `packages/supabase-types`. The measured dev-seed finding applies verbatim: `.strict()` is per-object and does not descend; every nested object needs its own `.strict()`, and each direction needs its own test case.
- **D-F3** — **Land the `get_questions` SQL and the wiring together in 157.** The election-round filter extension to `get_nominations` is likewise 157's SQL to write. Supersedes the roadmap's "(RPC changes land there)" parenthetical on the Depends-on line.
- **D-F4** — **ESLint `no-restricted-imports` with an explicit `files`-scoped allowlist, enforced by `lint:check`.** The allowlist must be explicit and the guard must fail on a 9th site. Re-include the inherited deep-relative-`lib` `patterns` ban VERBATIM (flat config REPLACES, does not merge). Prove the guard fails before claiming it guards.
- **D-F5** — **Rename and restructure `logDebugError` in one codemod across all sites, emitting pino/OTL-conformant objects.** Operator NOTES, verbatim and binding: *"Move the logging into app-shared so that it can be used by other modules as well."* CLAUDE.md's ESM+CJS claim about app-shared is measured stale; **ESM only** — CONTEXT open question 4 is ANSWERED, no CJS build needed.
- **D-N1** — Phase 152's comment convention is binding on every comment 157 writes. (See § Project Constraints for the *measured* content of that convention — the CONTEXT's restatement of it is partly wrong.)
- **D-N2** — "add as a follow-up task" review comments land in `.planning/todos/pending/`, filed during the owning phase. 157 owns one: the "reintroduce the local adapter" comment against `apps/frontend/src/lib/api/dataProvider.ts`.
- **D-N3** — one `<padded>-CONTEXT.md` per phase; `.planning/v2.15-DISCUSSION-POINTS.md` § F remains the authoritative record of options considered.
- **D-0.1** — the 33 § 0 facts are the factual baseline and `.planning/ROADMAP.md:1003-1217` is corrected in place. **Do not edit ROADMAP.md from this phase.**

### Claude's Discretion

- The zod schema module layout inside `packages/app-shared` (one file per JSONB column vs. a barrel), and whether types are inferred from schemas or schemas asserted against existing types — provided the colocation with `localized.type.ts` and its neighbours holds.
- The logger's API surface (levels, field names) beyond "pino/OTL-conformant", and whether the frontend keeps a thin re-export shim at `$lib/utils/logger` during the codemod.
- The `get_questions` RPC's exact parameter naming, provided it filters by election, constituency and election round.
- Whether the ESLint guard is one scoped block or several, provided the allowlist is explicit and the inherited `patterns` ban is re-included verbatim.

### Deferred Ideas (OUT OF SCOPE)

- The permissions/RLS rewrite (Phase 162).
- `RETURNS TABLE` nullability (Phase 164).
- Routing/auth-surface harmonisation (Phase 158, which declares a dependency **on** this phase).
- Reintroducing the local adapter (a filed follow-up, per D-N2).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (from `.planning/REQUIREMENTS.md:131-136`) | Research Support |
|----|--------------------------------------------------------|------------------|
| REVIEW-ADP-01 | Typed JSONB validated on read; the casts at `supabaseDataProvider.ts:60/:92/:361/:511` gone; a grep for casts on adapter reads returns empty | § A — full cast inventory (`:56-127`, `:162-222`, `:333-378`, `:479-486`, `:511-610`), the two-shape finding (stored ≠ application), zod 4.3.6 confirmed, the assertion mechanism recommendation |
| REVIEW-ADP-02 | Filter-value conversion is one named helper covering election-round filtering, RPC updated | § B — `:245-255` read in full, `FilterValue<T>` signature at `getDataFilters.type.ts:40`, `election_round` located at `104-nominations.sql:46` and `503-entity-rpcs.sql:33,59` |
| REVIEW-ADP-03 | A `get_questions` RPC returns categories and questions together, filters by election / constituency / election round, replacing `:499` | § C — `_getQuestionData` walked (`:499-614`), the three filter columns found on BOTH tables (`103-questions.sql:20-22,48-50`), RPC house style extracted, the schema-mirror-vs-migration trap |
| REVIEW-ADP-04 | The writer interface carries no parameter that nothing reads; `WithAuth` gone; the abstract members at `:381` removed | § D — all 41 `WithAuth` refs classified, the full (larger-than-CONTEXT) `authToken` reach, the ADMIN METHODS block located at `:378-384`, the candidate-settings product decision with a measured Supabase mechanism |
| REVIEW-ADP-05 | `getLocalized` + test colocated with `localized.type.ts` and typed from there; `authConfig.ts` split | § E — all five utils read and classified, `LocalizedString` signature identified, the authConfig split proven mechanical (zero cross-provider imports) |
| REVIEW-ADP-06 | A source test fails when adapter specifics appear outside their allowed loci, allowlist explicit, routes/components/lib clean; `logDebugError` renamed and reworked into structured pino/OTL output | § F (proven: `no-restricted-imports` does NOT catch the measured leakage; the working selector measured) + § G (codemod characterised, enablement gate designed, pino confirmed absent from the tree) |
</phase_requirements>

## Summary

This phase is six loosely-coupled workstreams that share one file (`supabaseDataProvider.ts`) and one theme. The single biggest planning risk is that four of the six are **larger than the CONTEXT records**, and one is **smaller**. The four larger: (1) the `authToken` reach is roughly triple what the CONTEXT enumerates, and contains a *second* genuine non-shim token plus a genuine `Bearer`-header mechanism that must survive; (2) new SQL cannot live in `apps/supabase/supabase/schema/` alone — that directory is a read-only mirror the CLI never applies, so `get_questions` needs a **migration** too; (3) the JSONB columns have a *stored* shape that differs from the *application* type in both named cases, so "validate into the type" is really "validate the stored shape, then derive the application type"; (4) the logger codemod's blocker is not the rename but the enablement gate, since `packages/app-shared` can see neither `import.meta.env` nor SvelteKit `$env`. The one smaller: the `authConfig.ts` split is genuinely trivial — the two configs have **zero** cross-provider imports and each is consumed only by its own provider.

The phase's one genuinely open technical question — "does `no-restricted-imports` actually catch the measured leakage?" — is answered here by measurement, not by reasoning: **it does not.** All eight leaking route files reach `event.locals.supabase`, a member expression, and `no-restricted-imports` inspects `ImportDeclaration` nodes only. A probe run this session against a real ESLint instance shows `no-restricted-syntax` with `MemberExpression[property.name='supabase']` fires at the exact call site, in both `.ts` and `.svelte`. The guard must therefore be a **pair** of rules, exactly as the existing `svelte/store` guard already is — and the existing guard's own comments say so at `apps/frontend/eslint.config.mjs:111-114`.

The phase's one product decision — the candidate "current password" field that Supabase silently discards — turns out to have a cheap correct answer that neither the CONTEXT nor the roadmap anticipated: the installed `@supabase/auth-js` **already types `current_password` on `UserAttributes`** (`node_modules/@supabase/auth-js/dist/module/lib/types.d.ts:376`). The field is not decorative-by-necessity; it is decorative-by-omission, and the error message shown to users in all seven locales already claims the current password was checked.

**Primary recommendation:** Plan this as **six independent waves plus one gate**, in this order — (0) the app-shared foundation (zod dependency + logger + `getLocalized` move, because everything else imports from it), (1) the SQL pair (`get_questions` + `get_nominations` election-round, schema **and** migration, with pgTAP), (2) the provider rewrite (zod validation + filter helper + RPC wiring, which consumes wave 0 and wave 1), (3) the `WithAuth` removal (independent of 0-2, blocked only by the settings-form product decision), (4) the ESLint guard + its self-test + its negative-control ledger, (5) the logger codemod across 53 files (mechanical, last, because it touches files every other wave also touches), then the E2E cardinal gate. Waves 3 and 4 can run parallel to 1-2.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| JSONB shape validation on read | API / Backend boundary — the adapter (`lib/api/adapters/supabase/`) | Shared package (`@openvaa/app-shared`) holds the schemas | The schema is a contract about a *database column*, so it belongs with the type it describes (D-F2); the *parsing* belongs where the untrusted bytes arrive, which is the adapter edge |
| Election / constituency / election-round filtering of questions | Database / Storage — `get_questions` RPC | Adapter passes parameters through | The filter columns (`election_ids`, `election_rounds`, `constituency_ids`) are JSONB on both `question_categories` and `questions`; filtering them client-side after a full table read is the defect criterion 3 names |
| Filter-value normalisation (scalar-or-array → array) | Adapter (a pure helper in `adapters/supabase/`) | — | `FilterValue<T>` is a frontend API-surface type (`getDataFilters.type.ts:40`); the RPC only ever sees a normalised scalar |
| Password change | API / Backend — Supabase GoTrue | Adapter (`SupabaseDataWriter._setPassword`) | Current-password verification is a GoTrue server-side gate, not something the client can enforce; see § D |
| Auth session establishment (login / logout / verifyOtp) | Frontend Server (SSR) — currently the 8 route files | Should be the adapter (Phase 158) | These need the **cookie-capable** server client; they cannot move to a browser-side adapter, only to a server-side one |
| Structured logging | Shared package (`@openvaa/app-shared`) | Every consumer configures its own sink/level | D-F5's binding NOTES; the package cannot see Vite or SvelteKit env, so enablement must be injected |
| Adapter-boundary enforcement | Build tooling — ESLint flat config + a vitest self-test | — | `lint:check` is the gate that already exists (D-F4) |
| Localisation of JSONB locale objects (`getLocalized`) | Shared package (`@openvaa/app-shared/src/data/`) | — | It has zero Supabase dependencies (§ E) and mirrors a SQL function; criterion 5 |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | **4.3.6** installed and resolved | Runtime validation of typed JSONB columns at the adapter edge | Already the repo's template-validation mechanism (`packages/dev-seed/src/template/schema.ts:23`), already a dependency of four workspaces, catalog-pinned |
| `eslint` | 9.x (catalog `^9.39.2`) | The adapter-boundary guard | `lint:check` already runs `turbo run lint`; the `svelte/store` guard is the in-repo precedent |
| `vitest` | catalog `^3.2.4` | The guard self-test + the zod per-direction tests | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` is the precedent |
| pgTAP | via `npx supabase test db` | `get_questions` coverage | `apps/supabase/supabase/tests/database/` — 12 files, one documented pattern |
| **No new logging library** | — | Structured output | See "Alternatives Considered" and § G |

**Verified in-tree:**
- `zod` resolves to `4.3.6` — `node -e` against `node_modules/zod/package.json` this session, and `yarn.lock:11672-11675` (`"zod@npm:^4.3.6"` → `version: 4.3.6`). `[VERIFIED: yarn.lock:11672-11675]`
- Catalog pin: `.yarnrc.yml:24` — `zod: ^4.3.6`. `[VERIFIED: .yarnrc.yml:24]`
- `@supabase/supabase-js` and `@supabase/auth-js` both resolve to **2.99.3** (measured this session). Catalog pin is `@supabase/supabase-js: ^2.49.4` (`.yarnrc.yml`). `[VERIFIED: node_modules/@supabase/auth-js/package.json]`

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@typescript-eslint/parser` | catalog `^8.57.0` | Already loaded by the frontend flat config (`apps/frontend/eslint.config.mjs:6,51`) | Needed by the guard self-test's `lintText` probes |
| `svelte-eslint-parser` | (frontend dep) | `.svelte` probes in the guard self-test | The measured probe (§ F) confirms both rules fire under it |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A plain-object pino-shaped emitter | `pino` itself | **Do not.** `grep -c 'pino' yarn.lock` → **0**; pino is nowhere in the repo. Adding it puts a Node-oriented logger into a browser bundle for what is, at every one of the ~85 call sites, a one-line debug message. See § G. `[VERIFIED: yarn.lock — grep -c 'pino' returns 0]` |
| Zod schemas asserted against existing TS types | Types inferred from schemas (`z.infer`) | For `DynamicSettings` the TS type is the published contract (`packages/app-shared/src/settings/dynamicSettings.type.ts`) and must stay hand-written; for the *stored* JSONB shapes there is no existing type, so inferring is correct. **Recommend: mixed — infer the stored shapes, assert the derived application shapes.** See § A. |
| `no-restricted-imports` alone | `no-restricted-imports` + `no-restricted-syntax` | Measured: imports alone catches 3 of 8 leaking files. See § F. |
| `no-restricted-properties` | — | Not applicable: that rule targets *object literals and member access on named globals* by `object`/`property` pair; `event.locals.supabase` has no stable root object name across the 8 files (`locals`, `event.locals`). `no-restricted-syntax` with an esquery selector is the measured-working mechanism. `[ASSUMED — rule semantics from training; the working alternative was measured, so this is a note not a dependency]` |

**Installation:**

```bash
# packages/app-shared/package.json — add to "dependencies", NOT devDependencies
#   "zod": "catalog:"
# then
yarn install
```

`packages/app-shared/package.json:23-25` currently declares exactly one runtime dependency:

```json
"dependencies": {
  "@openvaa/data": "workspace:^"
},
```

`[VERIFIED: packages/app-shared/package.json:23-25]` — zod becomes the package's **first third-party runtime dependency**.

**Catalog syntax confirmed at peers** — the planner must write `"zod": "catalog:"` (bare, no version):
- `packages/dev-seed/package.json:29` — `"zod": "catalog:"` `[VERIFIED: packages/dev-seed/package.json:29]`
- `apps/frontend/package.json:78` — `"zod": "catalog:"` `[VERIFIED: apps/frontend/package.json:78]`
- `packages/app-shared/package.json:28-29` already uses the same form for devDependencies (`"typescript": "catalog:"`, `"vitest": "catalog:"`). `[VERIFIED: packages/app-shared/package.json:28-29]`

### Zod 4 specifics the planner must not trip on

Measured against the installed 4.3.6 and against the repo's own zod-4 module (`packages/dev-seed/src/template/schema.ts`), which carries an explicit "zod v4" header at `:1`:

1. **`.strict()` still exists and still works in v4, but is per-object.** `packages/dev-seed/src/template/schema.ts:35-41` records the measurement verbatim:
   > "`.strict()` is a PER-OBJECT setting; it does not descend. Measured at this tree's zod (4.3.6): a top-level-only strict schema parses `{ candidates: { fixed: [...], bogus: 3 } }` with **success** and silently strips `bogus`."

   `[VERIFIED: packages/dev-seed/src/template/schema.ts:35-41]` — quoted verbatim above.

   **Consequence for 157:** the settings and customization schemas are 3-4 levels deep (`settings.notifications.candidateApp.title`). **Every** nested object needs its own `.strict()`, or the validation silently passes malformed input. `z.strictObject(...)` is the v4 shorthand for the same thing; either is fine, but it must be applied at every level.

2. **`.merge()` is deprecated in v4 — use `.extend()`.** Recorded at `packages/dev-seed/src/template/schema.ts:9` ("via `.extend `, NOT `.merge ` — deprecated in zod v4"). `[VERIFIED: packages/dev-seed/src/template/schema.ts:9]`

3. **`safeParse` + `result.error.issues[].path` is the repo's error idiom**, not `.parse` + try/catch. `packages/dev-seed/src/template/schema.ts` (tail, `validateTemplate`):

   ```ts
   export function validateTemplate(input: unknown): Template {
     const result = TemplateSchema.safeParse(input);
     if (!result.success) {
       const msg = result.error.issues.map((iss) => `  template.${iss.path.join('.')}: ${iss.message}`).join('\n');
       throw new Error(`Template validation failed:\n${msg}`);
     }
     assertFixedRowsCarryExternalId(result.data);
     return result.data;
   }
   ```

   `[VERIFIED: packages/dev-seed/src/template/schema.ts — the exported `validateTemplate` at end of file]`. Note `error.issues` (v4), not `error.errors` (v3). The unrecognised-key message text is asserted in tests as `/Unrecognized key.*"bogusTopLevel"/` (`packages/dev-seed/tests/template.test.ts:110-111`) — **that exact spelling is a v4 message string and the tests depend on it.** `[VERIFIED: packages/dev-seed/tests/template.test.ts:109-123]`

4. **`z.record` in v4 takes two arguments.** `z.record(z.string(), z.unknown())` — `packages/dev-seed/src/template/schema.ts:57`. The v3 one-argument form is gone. `[VERIFIED: packages/dev-seed/src/template/schema.ts:57]`

5. **A `{}` input must pass.** dev-seed's contract is "every field is `.optional()` — a `{}` template MUST pass validation" (`schema.ts:14`). 157's schemas need the same property, because both JSONB columns default to `'{}'::jsonb` (`apps/supabase/supabase/schema/106-app-settings.sql:9,19`) and the provider already returns `{}` on `PGRST116`. `[VERIFIED: apps/supabase/supabase/schema/106-app-settings.sql:9,19]`

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `zod` | npm | already resolved in `yarn.lock:11672-11675` at 4.3.6 | n/a — already in the tree | github.com/colinhacks/zod | **OK** | Approved — **no new package is being introduced**, only a new *workspace* dependency edge onto a package already in the lockfile and already used by four workspaces |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

**Why no legitimacy gate was run:** this phase installs **zero** new third-party packages. The one dependency line added (`"zod": "catalog:"` in `packages/app-shared/package.json`) points at a catalog entry that already exists (`.yarnrc.yml:24`) and a lockfile entry that already exists (`yarn.lock:11672`). The slopsquatting risk this gate exists for — a hallucinated name reaching `yarn install` — is structurally absent. **The planner must not add `pino`** (see § G); if a future plan proposes it, the gate applies then.

## Architecture Patterns

### System Architecture Diagram

```
                        ┌─────────────────────────────────────┐
   BROWSER / SSR        │  routes/**  ·  lib/components/**    │
   (must not know       │  lib/contexts/**                    │
    Supabase exists)    └──────────────┬──────────────────────┘
                                       │  DataProvider / DataWriter interface
                                       │  (base/*.type.ts — Supabase-free)
                        ┌──────────────▼──────────────────────┐
   ADAPTER              │  lib/api/adapters/supabase/         │
   (the ONLY locus      │   dataProvider/  dataWriter/        │
    that names          │   adminWriter/   feedbackWriter/    │
    Supabase)           │   utils/  supabaseAdapter.ts        │
                        └───┬──────────────────┬──────────────┘
                            │                  │
              ┌─────────────▼──────┐    ┌──────▼──────────────────────────┐
              │ ZOD PARSE GATE     │    │ lib/supabase/{browser,server}.ts│
              │ (NEW — this phase) │    │ client factories                │
              │ stored JSONB shape │    └──────┬──────────────────────────┘
              │      ↓ validated   │           │
              │ derive app type    │           │
              │ (localize, URL-ify)│           │
              └─────────┬──────────┘           │
                        │                      │
                        │        ┌─────────────▼─────────────┐
                        │        │  PostgREST + RPC          │
                        └───────▶│  get_nominations          │
                                 │  get_questions   (NEW)    │
                                 │  get_candidate_user_data  │
                                 │  upsert_answers           │
                                 │  merge_custom_data        │
                                 └───────────────────────────┘

   LEAKAGE TODAY (8 files, all server-side, all auth):
   routes/**/+page.server.ts · +layout.server.ts · +server.ts
        ──▶ event.locals.supabase.auth.*   ⟵ bypasses the adapter entirely
             (set by hooks.server.ts:17-20)
```

The critical structural fact the diagram encodes: the eight leaking files do not reach the adapter and then go around it — they reach a **different object entirely**, `event.locals.supabase`, populated by `hooks.server.ts:17-20`. There is no import to restrict at seven of the eight sites.

### Recommended Project Structure

```
packages/app-shared/src/
├── data/
│   ├── localized.type.ts          # exists — the colocation target
│   ├── getLocalized.ts            # ← MOVED from adapters/supabase/utils/
│   ├── getLocalized.test.ts       # ← MOVED (import path changes)
│   └── schemas/                   # ← NEW (D-F2). Discretion: barrel vs per-column
│       ├── storedImage.schema.ts
│       ├── storedAnswers.schema.ts
│       ├── storedSettings.schema.ts
│       ├── storedCustomization.schema.ts
│       └── index.ts
├── logging/                       # ← NEW (D-F5 NOTES)
│   ├── logger.ts                  # the emitter + configure()
│   ├── logger.type.ts
│   └── logger.test.ts
└── index.ts                       # must re-export all of the above

apps/frontend/src/lib/api/adapters/supabase/
├── utils/
│   ├── localizeRow.ts             # STAYS (see § E)
│   ├── mapRow.ts                  # STAYS — imports @openvaa/supabase-types
│   ├── storageUrl.ts              # STAYS — Supabase storage URL construction
│   ├── toDataObject.ts            # STAYS — composes localizeRow + mapRow
│   └── convertFilterValue.ts      # ← NEW (criterion 2)
└── _guards/…                      # (guard test lives at lib/_guards/, existing dir)

apps/supabase/supabase/
├── schema/503-entity-rpcs.sql     # EDIT — get_nominations gains p_election_round
├── schema/505-question-rpcs.sql   # ← NEW, or append to 503 (see § C)
├── migrations/0000N_*.sql         # ← NEW — REQUIRED, see the mirror trap in § C
└── tests/database/11-*.test.sql   # ← NEW pgTAP for get_questions
```

### Pattern 1: Validate the STORED shape, derive the APPLICATION shape

**What:** The JSONB columns do not hold the application type. They hold a *localised, storage-relative* variant of it. "Validate into its type rather than cast into it" therefore means two steps, not one.

**When to use:** Every one of the four typed JSONB read paths.

**Evidence — `settings`:** the provider casts to `Partial<DynamicSettings>` at `:76`, but between `:56` and `:76` it *rewrites* `settings.notifications.{candidateApp,voterApp}.{title,content}` from locale objects to plain strings via `getLocalized` (`:61-73`). So the value at `:56` is **not** a `Partial<DynamicSettings>` and the value at `:76` **is** — the cast at `:76` is the only honest one in the block, and it is honest only because of the mutation above it. `[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:56-76]`

**Evidence — `customization`:** `AppCustomization.publisherLogo` is an `Image` (a resolved URL), but the stored JSONB is a `StoredImage` (a storage *path*), converted by `parseStoredImage` at `:106,108,110`. `AppCustomization.publisherName` is a `string`, but the stored value is a locale object localized at `:101`. `[VERIFIED: supabaseDataProvider.ts:92-127; apps/frontend/src/lib/contexts/app/appCustomization.type.ts:7-32; apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:9-16]`

**Example:**

```ts
// packages/app-shared/src/data/schemas/storedImage.schema.ts
import { z } from 'zod';

/** The image JSONB as stored in Supabase content tables. Paths, not URLs. */
export const StoredImageSchema = z
  .strictObject({
    path: z.string(),
    pathDark: z.string().optional(),
    alt: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    focalPoint: z.strictObject({ x: z.number(), y: z.number() }).optional()
  })
  .nullable();
```

The field list is quoted from the interface it mirrors, verbatim:

```ts
// apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:9-16
export interface StoredImage {
  path: string;
  pathDark?: string;
  alt?: string;
  width?: number;
  height?: number;
  focalPoint?: { x: number; y: number };
}
```

`[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:9-16]` — quoted verbatim.

### Pattern 2: Paired lint rules for one ban

**What:** A ban that must cover both an import and a runtime access needs two rules with one shared intent, and the config must say so.

**Where the repo already does this:** `apps/frontend/eslint.config.mjs:111-114`, verbatim:

```
      // Paired with the `no-restricted-imports` `paths` entry above: together they form
      // ONE ban on `svelte/store`. `no-restricted-imports` sees only static
      // `ImportDeclaration` nodes, so the dynamic `import('svelte/store')` form is closed
      // here. Edit both or neither.
```

`[VERIFIED: apps/frontend/eslint.config.mjs:111-114]` — quoted verbatim. The adapter-boundary guard is the *same shape* for the *same reason*, one step further: `no-restricted-imports` for `@supabase/*` and `$lib/api/adapters/supabase/*` and `$lib/supabase/*`; `no-restricted-syntax` for `…​.supabase` member access and `{ supabase }` destructuring.

### Anti-Patterns to Avoid

- **Editing `apps/supabase/supabase/schema/` without a matching migration.** `apps/supabase/README.md:16` states the schema directory is "**No**"-applied and that "`config.toml` sets `[db.migrations] schema_paths = []`, so the CLI never reads it." `[VERIFIED: apps/supabase/README.md:16]` A `get_questions` that exists only in `schema/` will pass code review and fail at runtime with `PGRST202`.
- **A blind identifier-wide `authToken` codemod.** Two files carry genuine tokens (§ D), and `universalAdapter.ts` uses `authToken` to build a real `Authorization: Bearer` header.
- **Top-level-only `.strict()`.** Measured to silently strip nested unknown keys (Pattern above).
- **A single-entry `no-restricted-syntax` array in a new scoped block.** Flat config REPLACES; the inherited `TSEnumDeclaration` ban would silently vanish and produce zero errors. `apps/frontend/eslint.config.mjs:115-120` documents exactly this, and `eslint-store-guard.test.ts:180-188` is the standing regression case for it.
- **Deleting `supabaseDataProvider.ts:60` or `:361`.** `:60` is `if (settings.notifications && typeof settings.notifications === 'object') {` — a runtime guard. `:361` is inside a comment block. `[VERIFIED: supabaseDataProvider.ts:60]` (the line reads exactly that; measured this session).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Validating 4 nested JSONB shapes | 64 hand-written type-guard predicates | `zod@4.3.6` schemas in app-shared | D-F2's own rejection rationale: "64 guards to hand-maintain with nothing keeping them in sync" |
| Proving an ESLint rule fires | Reading the config and asserting by eye | `new ESLint({ flags: ['v10_config_lookup_from_file'] })` + `lintText` with a virtual `filePath` | `eslint-store-guard.test.ts:59-60,105-129` — the exact apparatus, already load-bearing |
| Scalar-or-array normalisation | A fresh ternary at each call site | One `convertFilterValue` helper | Criterion 2. The inline form is already duplicated twice within nine lines (`:245-249` and `:250-255`) |
| Localising a JSONB locale object | A new resolver in app-shared | Move `getLocalized` (28 lines, zero deps) | Criterion 5. It also mirrors a SQL function (`000-functions.sql` per its own header) — two implementations already exist, do not make three |
| snake_case → camelCase row mapping | A fresh mapper in app-shared | `mapRow` stays in the adapter | It imports `COLUMN_MAP` from `@openvaa/supabase-types` (`mapRow.ts:1`) — moving it would drag a Supabase-generated package into app-shared |
| Structured log field naming | Inventing a field set | Pino's base fields + OTel severity names, emitted as a plain object | § G |

**Key insight:** every one of the six criteria has an in-repo precedent that was built for exactly this shape of problem within the last four months. The phase's failure mode is not "no pattern to follow" — it is "the pattern exists three directories away and the planner writes a fourth one."

## Runtime State Inventory

Not a rename/refactor/migration phase in the sense that triggers this section (no stored identifier changes value), but three items are close enough to state explicitly rather than leave silent:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None.** No column, key, enum value or stored identifier changes name or value in 157. The `party` → `organization` rename is Phase 156's; 157 only *reads* the renamed enum at `supabaseDataWriter.ts:180` and `routes/candidate/login/+page.server.ts:41`. `[VERIFIED: supabaseDataWriter.ts:180 — `if (userRoles.some((r) => r.role === 'candidate' \|\| r.role === 'party'))`]` | none |
| Live service config | **One, conditional.** If the settings-form product decision is (b) "make it verify", GoTrue must be configured to require the current password. `apps/supabase/supabase/config.toml:222` reads `secure_password_change = false` and there is **no** CLI config key for the current-password variant in that file. `[VERIFIED: apps/supabase/supabase/config.toml:222 — `secure_password_change = false`]` | see § D — planner must spike before committing to (b) |
| OS-registered state | None — verified: this phase registers no scheduled task, service or daemon. | none |
| Secrets / env vars | **One new, one read.** The logger needs an enablement gate; `PUBLIC_DEBUG` already exists at `apps/frontend/src/lib/utils/constants.ts:11` (`env.PUBLIC_DEBUG?.toLowerCase() === 'true'`). The recommendation in § G **adds no new env var** — it injects the existing one. `[VERIFIED: apps/frontend/src/lib/utils/constants.ts:11]` | none if § G's recommendation is taken |
| Build artifacts | **`packages/app-shared/dist/`.** app-shared is a *built* package (`"build": "tsup && tsc --emitDeclarationOnly --outDir dist"`, `packages/app-shared/package.json:7`) whose `exports` point at `./dist/index.js`. Adding `getLocalized`, the schemas and the logger to `src/index.ts` requires a rebuild before any consumer resolves them at runtime. `[VERIFIED: packages/app-shared/package.json:7,13-22]` | `yarn build` (turbo, cached) between wave 0 and every later wave |

## Common Pitfalls

### Pitfall 1: The schema mirror that never reaches a database

**What goes wrong:** `get_questions` is written into `apps/supabase/supabase/schema/`, review passes, `yarn db:reset` runs, and the RPC does not exist. The adapter's `.rpc('get_questions', …)` returns `PGRST202`.

**Why it happens:** the repo holds the schema **twice**, and only one copy is applied. `apps/supabase/README.md:16` (verbatim):

> `| supabase/schema/     | **No**              | A flattened, concern-ordered mirror of the _current_ schema, kept for reading. `config.toml` sets `[db.migrations] schema_paths = []`, so the CLI never reads it. |`

and `:23-27` (verbatim):

> **Nothing verifies that they agree.** A change made in one and not the other drifts silently: an edit to `schema/` alone never reaches any database, and an edit to `migrations/` alone leaves the readable copy wrong. When you change the schema, write the migration **and** apply the same change to the corresponding `schema/` file in the same commit.

`[VERIFIED: apps/supabase/README.md:16,23-27]` — quoted verbatim.

**How to avoid:** every SQL task in this phase produces **two** edits: `apps/supabase/supabase/migrations/0000N_<name>.sql` (new file, next number after `00003_authenticated_insert_feedback.sql`) **and** the mirrored `schema/*.sql` edit, in the same commit. The migration header must carry `-- Applies to schema files:` per the README's convention.

**Warning signs:** a plan whose SQL task lists one file. A verification step that greps `schema/` for `get_questions` and stops.

**Measured migration state:** `apps/supabase/supabase/migrations/` holds exactly three files — `00001_initial_schema.sql`, `00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql`, `00003_authenticated_insert_feedback.sql`. `[VERIFIED: ls apps/supabase/supabase/migrations/]` The next number is `00004`. **Phase 156 decision E2(a) rewrites migrations in place rather than additively** (per `157-CONTEXT.md:404`), so the planner must confirm with 156's plan whether 157's SQL joins the rewritten `00001` or lands as a new file — this is a real 156/157 coordination point the CONTEXT's boundary table does not cover.

### Pitfall 2: `no-restricted-imports` looks like it guards and does not

**What goes wrong:** the guard ships, `lint:check` is green, and the eight leaking files are untouched — because they never import anything Supabase-shaped.

**Why it happens:** ESLint's `no-restricted-imports` inspects `ImportDeclaration` nodes. `event.locals.supabase.auth.signOut()` is a `MemberExpression`. The repo already knows this; `apps/frontend/eslint.config.mjs:111-114` says so about the dynamic-import case.

**Measured, per file** (this session; `grep -n 'supabase'` on each of the eight):

| # | File | What it does with Supabase | Caught by an import ban? |
|---|------|---------------------------|--------------------------|
| 1 | `routes/candidate/preregister/+layout.server.ts:9` | `locals.supabase.from('app_settings').select('settings')…` | **No** |
| 2 | `routes/candidate/auth/callback/+server.ts:2,27,37` | imports `EmailOtpType` from `@supabase/supabase-js`; `locals.supabase.auth.verifyOtp` + `.getUser()` | **Type import yes**, calls no |
| 3 | `routes/candidate/auth/logout/+server.ts:14` | `locals.supabase.auth.signOut({ scope: 'local' })` | **No** |
| 4 | `routes/candidate/(protected)/+layout.server.ts:19,32,74,94` | imports `SupabaseAdapterConfig`; builds `{ serverClient: locals.supabase }` twice; `locals.supabase.auth…` | **Import yes**, calls no |
| 5 | `routes/candidate/login/+page.server.ts:25,44` | `locals.supabase.auth.signInWithPassword` / `.signOut` | **No** |
| 6 | `routes/admin/login/+page.server.ts:27,46` | `locals.supabase.auth.signInWithPassword` / `.signOut` | **No** |
| 7 | `routes/api/candidate/preregister/+server.ts:3,16,32` | imports `EmailOtpType`; `locals.supabase.functions.invoke('identity-callback')`; `.auth.verifyOtp` | **Type import yes**, calls no |
| 8 | `routes/api/auth/logout/+server.ts:10` | `locals.supabase.auth.signOut()` | **No** |

`[VERIFIED: per-file grep on each of the eight paths, this session]`

**Score: an import-only ban catches 3 of 8 files and 0 of the 13 actual Supabase calls.**

**How to avoid:** pair the rules. **Measured working selectors** (probe run this session against a real `ESLint` instance with `@typescript-eslint/parser`, virtual `filePath` under `apps/frontend/src/routes/`):

| Selector | Fires on | Result |
|----------|----------|--------|
| `MemberExpression[property.name='supabase']` | `await locals.supabase.auth.signOut();` | **fires at 3:9** |
| `MemberExpression[object.name='locals'][property.name='supabase']` | same | **fires at 3:9** |
| `ObjectPattern > Property[key.name='supabase']` | `const { supabase } = locals;` | **fires at 4:11** |

And under `svelte-eslint-parser`, `filePath` `apps/frontend/src/lib/components/Probe.svelte`:

| Rule | Input | Result |
|------|-------|--------|
| `no-restricted-imports` (patterns `^@supabase/\|supabase`) | `import { createBrowserClient } from '@supabase/ssr';` | **fires at 2:3** |
| `no-restricted-syntax` (`MemberExpression[property.name='supabase']`) | `const c = data.supabase;` | **fires at 3:13** |

`[VERIFIED: eslint probe executed this session — a temporary `.probe-tmp.mjs` at the repo root, run and deleted; no source file was modified]`

**Recommended rule pair (shape, not final text):**

```js
{
  files: ['src/routes/**/*.{ts,js,svelte}', 'src/lib/components/**/*.{ts,js,svelte}',
          'src/lib/dynamic-components/**/*.{ts,js,svelte}', 'src/lib/contexts/**/*.{ts,js,svelte}'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        // INHERITED — re-included VERBATIM. See flat-config REPLACE caveat.
        { regex: '^(\\.\\./){2,}lib(/|$)',
          message: 'Use the $lib alias instead of deep relative imports. Example: import X from "$lib/components/Foo".' },
        { regex: '^@supabase/', message: '<adapter-boundary message>' },
        { regex: '^\\$lib/(supabase|api/adapters)(/|$)', message: '<adapter-boundary message>' }
      ]
    }],
    'no-restricted-syntax': ['error',
      // INHERITED — re-included VERBATIM.
      { selector: 'TSEnumDeclaration', message: 'Use const assertion or a string union type instead.' },
      { selector: "MemberExpression[property.name='supabase']", message: '<adapter-boundary message>' },
      { selector: "ObjectPattern > Property[key.name='supabase']", message: '<adapter-boundary message>' }
    ]
  }
}
```

**The two `patterns`/entries that MUST be re-included verbatim in any new scoped block:**

1. From `packages/shared-config/eslint.config.mjs:147-153` — the deep-relative-`lib` pattern:
   ```js
          patterns: [
            {
              regex: '^(\\.\\./){2,}lib(/|$)',
              message:
                'Use the $lib alias instead of deep relative imports. Example: import X from "$lib/components/Foo".'
            }
          ]
   ```
   `[VERIFIED: packages/shared-config/eslint.config.mjs:144-155]` — quoted verbatim; the rule key is at `:144`, `patterns` at `:147`, the object at `:148-152`, closing at `:153-155`.

2. From `packages/shared-config/eslint.config.mjs:79-85` — the TS-enum selector:
   ```js
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use const assertion or a string union type instead.'
        }
      ],
   ```
   `[VERIFIED: packages/shared-config/eslint.config.mjs:79-85]` — quoted verbatim.

   **Plus**, if the new block's `files` glob overlaps the existing `src/**/*.{ts,js,mjs,cjs,svelte}` block at `apps/frontend/eslint.config.mjs:90`, the `svelte/store` entries at `:96-101` (paths) and `:128-130` (the `ImportExpression` selector) must be re-included too — **or** the new block must use a glob that does not overlap, which is impossible here since routes are under `src/`. **Recommendation: extend the EXISTING block at `apps/frontend/eslint.config.mjs:89-133` rather than adding a new one**, adding entries to the existing arrays. That sidesteps the REPLACE trap entirely, and `eslint-store-guard.test.ts`'s existing regression case keeps guarding it. The cost is that the file-scope becomes all of `src/**` — which for the `MemberExpression` selector means the adapter itself would trip. Resolve with a *narrower second block* for the member-expression rules only, whose `files` list excludes the adapter, and which re-includes the inherited entries. **Decide in planning; both shapes are defensible, and the negative control must exercise whichever is chosen.**

### Pitfall 3: The comment convention 157 must satisfy is not the one the CONTEXT describes

**What goes wrong:** the planner writes multi-line explanatory comments (which this codebase is full of) and `lint:check` goes red on a gate nobody expected.

**Why it happens:** the CONTEXT's D-N1 summary says the convention is "no planning references in code comments; no `--` used as a dash". **Measured against Phase 152's own CONTEXT, the second half is wrong and the first half is not the standing gate.**

`152-CONTEXT.md:41-42`, verbatim, under **"Explicitly NOT in scope"**:

> - Normalising the **85** comment lines that use `--` as a dash, and the ~2,870 lines already using real
>   `—`/`–` characters — D-A5 leaves both alone.

`[VERIFIED: .planning/phases/152-comment-naming-hygiene-sweep/152-CONTEXT.md:41-42]` — quoted verbatim.

What **is** wired into `lint:check` is D-A4's scan, and its class definition is quoted verbatim at `152-CONTEXT.md:125-127`:

> **The class definition, as written in the decision preamble (this is the specification):** *"a comment
> line that ends without terminal punctuation **and** whose next line continues the same comment span at
> the same indent."*

`[VERIFIED: .planning/phases/152-comment-naming-hygiene-sweep/152-CONTEXT.md:125-127]` — quoted verbatim. `152-CONTEXT.md:140-141` adds that the same script also carries the `\uXXXX`-escape-in-comment pattern: "It is one gate with two rules, not two gates." `[VERIFIED: 152-CONTEXT.md:140-141]`

**How to avoid — the actual constraint on 157:**
1. **Every comment line that is continued at the same indent must end with terminal punctuation.** This is aggressive and it will bite: the provider's existing comments (e.g. `supabaseDataProvider.ts:260-263`) are wrapped prose that would fail. Phase 152 rewrites those; 157 must not reintroduce the shape. Practically: write one-sentence-per-line comments, each ending in `.`, or single-line comments.
2. **No `\uXXXX` escapes inside comments.**
3. **No planning references** (phase/plan numbers, decision ids, `.planning/` paths) in new comments. This is criterion 152-2, a one-time sweep over 817 lines rather than a standing gate — but writing new ones re-opens the class the sweep just closed, and the phase 157 diff will be reviewed against it. `[VERIFIED: 152-CONTEXT.md:21-23]`
4. **`--` as a dash is NOT gated.** The shim comment at `supabaseDataWriter.ts:84` is deleted by criterion 4 anyway.

**Warning signs:** a plan that cites "no `--` dashes" as a verification step, or one that budgets nothing for the terminal-punctuation rule while writing ~40 new comment lines.

### Pitfall 4: Sweeping a genuine `authToken`

**What goes wrong:** a codemod removes `authToken` from a signature that actually threads a bearer token, and admin API calls start sending `Authorization: Bearer undefined`.

**Why it happens:** the identifier is overloaded three ways. The CONTEXT names one false positive; there are **three classes** to preserve. See § D for the full table.

**Warning signs:** any task whose action is "remove `authToken`" without a per-file disposition table.

### Pitfall 5: `getLocalized`'s test import path is relative and breaks on move

`apps/frontend/src/lib/api/adapters/supabase/utils/getLocalized.test.ts:2` reads:

```ts
import { getLocalized } from '../utils/getLocalized';
```

`[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/utils/getLocalized.test.ts:2]` — quoted verbatim. Note the redundant `../utils/` (the test lives *in* `utils/`). On move to `packages/app-shared/src/data/`, this becomes `./getLocalized`. A mechanical move that preserves the import path resolves to nothing and the test file silently fails to load.

Also: `packages/app-shared/tsconfig.json` has `"exclude": ["**/*.test.ts"]` `[VERIFIED: packages/app-shared/tsconfig.json]` — so the moved test is excluded from the declaration build, which is correct and needs no change. `packages/app-shared/vitest.config.ts` is an intentionally empty object whose only job is workspace discovery:

```ts
/**
 * This empty config file is necessary ror `/vitest.workspace.ts` to recognize this module as a test workspace.
 */

export default {};
```

`[VERIFIED: packages/app-shared/vitest.config.ts:1-5]` — quoted verbatim. And `vitest.workspace.ts:1` is `export default ['packages/**/vitest.config.ts'];` `[VERIFIED: vitest.workspace.ts:1]`. **Colocated `*.test.ts` next to source is the app-shared convention** — `src/data/isEmoji.test.ts`, `src/utils/mergeSettings.test.ts`, `src/utils/passwordValidation.test.ts` all sit beside their sources. `[VERIFIED: find packages/app-shared/src -type f]` So `getLocalized.test.ts` lands at `packages/app-shared/src/data/getLocalized.test.ts`, no config change needed.

## Code Examples

*(Sources are in-repo; each is quoted from a file read this session.)*

### The inline filter conversion to extract (criterion 2)

```ts
// apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:245-255
    const electionIds: Array<string | null> = options?.electionId
      ? Array.isArray(options.electionId)
        ? (options.electionId as Array<string>)
        : [options.electionId]
      : [null];
    const constituencyIds: Array<string | null> = options?.constituencyId
      ? Array.isArray(options.constituencyId)
        ? (options.constituencyId as Array<string>)
        : [options.constituencyId]
      : [null];
```

`[VERIFIED: supabaseDataProvider.ts:245-255]` — quoted verbatim.

### The RPC house style to copy (criterion 3)

```sql
-- apps/supabase/supabase/schema/503-entity-rpcs.sql:11-15, 50-53, 92
CREATE OR REPLACE FUNCTION public.get_nominations(
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_include_unconfirmed boolean DEFAULT false
)
...
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
...
GRANT EXECUTE ON FUNCTION public.get_nominations(uuid, uuid, boolean) TO anon, authenticated;
```

`[VERIFIED: apps/supabase/supabase/schema/503-entity-rpcs.sql:11-15,50-53,92]` — quoted verbatim.

### The guard self-test apparatus (criterion 6)

```ts
// apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:59-60
// MANDATORY (invariant 2): loads the real apps/frontend/eslint.config.mjs.
const eslint = new ESLint({ flags: ['v10_config_lookup_from_file'] });
```

```ts
// apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:114-129
    it('fires no-restricted-imports on a static svelte/store import', async () => {
      const [result] = await eslint.lintText(STORE_IMPORT[ext], { filePath: probePath });
      expect(result.messages.filter((m) => m.ruleId === 'no-restricted-imports').length).toBeGreaterThan(0);
    });

    it('stays silent on clean rune code (negative control)', async () => {
      const [result] = await eslint.lintText(CLEAN_RUNE[ext], { filePath: probePath });
      expect(result.messages.filter((m) => m.ruleId === 'no-restricted-imports').length).toBe(0);
    });

    // Guards the negative control itself: a parse failure yields a fatal message and
    // would otherwise read as "silent".
    it('parses without a fatal message', async () => {
      const [result] = await eslint.lintText(STORE_IMPORT[ext], { filePath: probePath });
      expect(result.messages.filter((m) => m.fatal)).toEqual([]);
    });
```

`[VERIFIED: apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:59-60,114-129]` — quoted verbatim.

### The current logger, in full (criterion 6, second half)

```ts
// apps/frontend/src/lib/utils/logger.ts:1-13
import { constants } from '$lib/utils/constants';

/**
 * Allows debug messages to be logged in development environment, but filtered out for production.
 * @param message - Message or object to log into console
 * @param error - Potential error message to print out completely
 */
export function logDebugError(message: unknown, error: unknown = null) {
  if (import.meta.env.DEV || constants.PUBLIC_DEBUG) {
    if (error) console.error(message, error);
    else console.info(message);
  }
}
```

`[VERIFIED: apps/frontend/src/lib/utils/logger.ts:1-13]` — quoted verbatim, all 13 lines.

---

# Detailed findings, by research area

## § A — Zod validation at the adapter edge (D-F2 / criterion 1 / REVIEW-ADP-01)

### A.1 The complete cast inventory

`grep -c ' as ' apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` → **64** lines, confirming § 0 fact 19. `[VERIFIED: measured this session]` The file is **616 lines**. `[VERIFIED: wc -l]`

Every one of the 64 was read this session. They fall into **five classes**, and criterion 1 targets only class 1 and class 2:

| Class | Lines | Example | In criterion 1's scope? |
|-------|-------|---------|------------------------|
| **1. Typed-JSONB reads** (the target) | `:56`, `:76`, `:88`, `:92`, `:101`, `:106`, `:108`, `:110`, `:114`, `:120`, `:126`, `:127`, `:162`, `:196`, `:214`, `:220`, `:333`, `:376`, `:378`, `:484`, `:486`, `:517`, `:549`, `:559`, `:573`, `:610` | `raw.publisherLogo as Json as unknown as StoredImage \| null` | **YES** |
| **2. Union-resolving output casts** | `:166`, `:200`, `:222`, `:342`, `:487`, `:518`, `:611` | `} as ElectionData;` | **YES** — these exist *because* the input was never validated |
| 3. `toDataObject` argument widening | `:155`, `:192`, `:212`, `:479`, `:511` | `toDataObject(row as Record<string, unknown>, …)` | Partly — disappears if `toDataObject`'s signature is widened; see A.5 |
| 4. Generated-RPC-type compensation | `:300`, `:368-374`, `:602`, `:604`, `:605` | `row.parent_nomination_id as string \| null \| undefined` | **NO** — these compensate for the `RETURNS TABLE` nullability lie that **Phase 164 owns**. Do not remove; do not make worse. |
| 5. Not casts at all | `:164`, `:197`, `:247`, `:252`, `:260`, `:409`, `:413`, `:427`, `:570` | `// The regenerated RPC types both filters as \`string \| undefined\`` (a comment); `(options.electionId as Array<string>)` (criterion 2's territory); `for (const child of nominations as Array<InternalFlatNomination>)` (an internal type assertion, not a boundary read) | **NO** |

`[VERIFIED: supabaseDataProvider.ts — full ` as ` grep with line numbers, executed this session]`

**The `as Json as unknown as X` triple-cast is the smell criterion 1 names.** Measured, it occurs **15 times across two files**:

```
supabaseDataProvider.ts:106,108,110,162,196,220,333,376,378,484,486,517,610   (13)
supabaseDataWriter.ts:223,374                                                  (2)
```

`[VERIFIED: grep -rn 'as Json as unknown as' apps/frontend/src/lib/api/]`

**⚠ Correction to the roadmap and to the CONTEXT:** criterion 1 names only the *provider*. The same triple-cast appears **twice in the writer** (`supabaseDataWriter.ts:223`, `:374`). Both are `parseStoredImage(… as Json as unknown as StoredImage | null, …)` on a read-back of a written row. A criterion-1 close that leaves them in place leaves the smell in the adapter. **Recommend: include both.** The cost is one extra import each.

### A.2 The four typed JSONB columns, their stored shape, and their application type

| # | Column | Read at | Cast to today | Application type, and where it is declared | Stored shape ≠ application shape? |
|---|--------|---------|---------------|--------------------------------------------|-----------------------------------|
| 1 | `app_settings.settings` | `:47-77` | `Record<string, unknown>` at `:56`, then `Partial<DynamicSettings>` at `:76` | `DynamicSettings` — `packages/app-shared/src/settings/dynamicSettings.type.ts` (**already in app-shared**) | **YES** — `notifications.{candidateApp,voterApp}.{title,content}` are locale objects in storage and plain strings in `DynamicSettings` (`NotificationData`). The provider localizes them at `:61-73`. |
| 2 | `app_settings.customization` | `:82-131` | `Record<string, unknown>` at `:92`; `{} as AppCustomization` at `:88` | `AppCustomization` — **`apps/frontend/src/lib/contexts/app/appCustomization.type.ts:7-32`, in the FRONTEND** | **YES** — `publisherName` is a locale object in storage / `string` in the type; `publisherLogo`/`poster`/`candPoster` are `StoredImage` (path) in storage / `Image` (url) in the type; `candidateAppFAQ[].{question,answer}` are locale objects / strings. |
| 3 | `*.image` (7 tables) | `:106,108,110,162,196,220,333,376,484,517,610` + writer `:223,374` | `Json as unknown as StoredImage \| null` | `Image` from `@openvaa/data`, produced by `parseStoredImage` | **YES** — `StoredImage` (`storageUrl.ts:9-16`) → `Image` (url-ified). |
| 4 | `{candidates,organizations}.answers` / RPC `entity_answers` | `:378`, `:486` | `Json as unknown as LocalizedAnswers \| null` | `Answers` from `@openvaa/data`, produced by `parseAnswers` | **YES** — `LocalizedAnswers` (frontend, `dataWriter.type.ts`) → `Answers`, translated per-locale at `parseAnswers.ts:20-24`. |

Two secondary shapes ride the same read paths and are cast without validation:

| # | Value | Read at | Cast to | Declared |
|---|-------|---------|---------|----------|
| 5 | `questions.choices` | `:549-553` | `Array<{ id: number; label: Record<string,string> \| string; [k: string]: unknown }> \| null` | inline — no named type. `LocalizedChoice` in `packages/app-shared/src/data/localized.type.ts:67-69` is the natural home. |
| 6 | `question_categories.election_ids` | `:527` | `QuestionCategoryData & { electionIds?: Array<string> \| null }` | inline. The comment at `:526` says "runtime-only field tacked on by toDataObject; not yet in QuestionCategoryData". **Criterion 3's `get_questions` RPC removes this need entirely** — the filter moves to SQL. |

`[VERIFIED: supabaseDataProvider.ts:47-131, 549-553, 526-527; apps/frontend/src/lib/contexts/app/appCustomization.type.ts:7-32; packages/app-shared/src/data/localized.type.ts:67-69; apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:9-16; apps/frontend/src/lib/api/utils/parseAnswers.ts:13-27]`

### A.3 The colocation problem the planner must solve

D-F2 says the schemas go in `@openvaa/app-shared`, "colocated with the types they validate". Measured, **two of the four types are not in app-shared**:

- `AppCustomization` → `apps/frontend/src/lib/contexts/app/appCustomization.type.ts:7`. `[VERIFIED]`
- `StoredImage` → `apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:9`. `[VERIFIED]`
- `LocalizedAnswers` → imported by the provider from `$lib/api/base/dataWriter.type` (`supabaseDataProvider.ts:22`). `[VERIFIED: supabaseDataProvider.ts:22]`
- `DynamicSettings` → `@openvaa/app-shared` ✓ (`supabaseDataProvider.ts:9` imports it from there). `[VERIFIED]`

**Three resolutions, in order of preference:**

**(a) RECOMMENDED — the schemas describe the *stored* shape, so colocation is with `localized.type.ts`, not with the application type.** Put `StoredImageSchema`, `StoredAnswersSchema`, `StoredSettingsSchema`, `StoredCustomizationSchema` in `packages/app-shared/src/data/schemas/`, next to `localized.type.ts` — which is exactly what D-F2's own words say ("colocated with the types in `@openvaa/app-shared`"). `z.infer` gives each a `Stored*` type. `StoredImage`'s interface moves to app-shared alongside its schema (it is 8 lines and has one dependency, `Image` from `@openvaa/data`, which app-shared already depends on). `AppCustomization` stays in the frontend and becomes the *output* of the derive step, not the parse step.

**(b)** Move `AppCustomization` into app-shared too. **Do not** — it depends on `TranslationKey` from `$types` (`appCustomization.type.ts` imports it; the provider casts to `Record<TranslationKey, string>` at `:120`), which is a generated frontend type at `apps/frontend/src/lib/types/generated/translationKey.ts`. That drags the i18n catalog into a shared package. `[VERIFIED: apps/frontend/src/lib/types/generated/translationKey.ts exists — it carries `'candidateApp.settings.error.changePassword'` at :279]`

**(c)** Keep the schemas in the frontend adapter. Contradicts D-F2. Do not.

### A.4 The dev-seed precedent, and what to copy from it

Three things transfer verbatim:

1. **`.strict()` at every level** — with a comment explaining *why*, because the reason is non-obvious and was measured. `packages/dev-seed/src/template/schema.ts:35-41` is the model.
2. **Per-direction test cases.** `packages/dev-seed/tests/template.test.ts:109-123` holds **two** cases — one for the top-level unknown key, one for the nested unknown key — with the nested one carrying its rationale inline:
   > ```
   >   it('ASSERT-04: rejects an unknown key INSIDE a per-entity fragment (perEntityFragment.strict())', () => {
   >     // Top-level strictness alone does NOT reach here: measured at zod 4.3.6, a
   >     // top-level-only strict schema parses this input with SUCCESS and silently
   >     // strips `bogusFragmentKey`. This case is why `perEntityFragment` is strict too.
   > ```
   `[VERIFIED: packages/dev-seed/tests/template.test.ts:115-123]` — quoted verbatim.

   **For 157 that means one rejection case per nesting level per column.** `settings` is at least 3 deep (`settings` → `notifications` → `candidateApp`), so ≥3 cases for that column alone. `customization` is 2-3 deep.
3. **The `{}`-passes case.** `template.test.ts:22-25`: `expect(() => validateTemplate({})).not.toThrow();` `[VERIFIED: packages/dev-seed/tests/template.test.ts:22-25]`

One thing that does **not** transfer: dev-seed *throws* on invalid input (`validateTemplate` throws an `Error`). **A throwing parse at the adapter edge takes the whole app down when one JSONB row is malformed.** The provider's existing posture is degradation, not failure — `:52` returns `{}` on `PGRST116`, `:88` returns `{} as AppCustomization`. **Recommend: `safeParse` at the edge; on failure, log via the new structured logger at `warn` with the `issues` path list, and fall back to the same empty/smart-default value the error branches already return.** This is also what makes criterion 1 and criterion 6 land together rather than fighting.

### A.5 Recommended answer to CONTEXT open question 9 — how "a grep for casts on adapter reads returns empty" is asserted

**Recommendation: a committed Node scan script wired into `lint:check`, NOT an ESLint rule and NOT a vitest grep.**

Reasoning against each alternative:

- **An ESLint rule** (`no-restricted-syntax` on `TSAsExpression`) cannot distinguish class 1 from class 4 (the Phase-164 nullability compensations) or class 5 (`for … of nominations as Array<InternalFlatNomination>`). It would fire on 64 lines and be disabled within a week.
- **A vitest source test** was rejected by D-F4 for the guard, for reasons that apply here too ("reports a file list rather than a line, and runs only when someone runs the unit suite").
- **Proof by inspection once** leaves the class free to reopen, which is the failure criterion 1's "returns empty" phrasing exists to prevent.

**What the scan should assert — precisely, so it does not fire on the ~40 unrelated casts:**

> In the files `apps/frontend/src/lib/api/adapters/supabase/**/*.ts`, **zero** lines match the regex `as\s+Json\s+as\s+unknown\s+as` .

That is a **single, exact, mechanically-checkable pattern** with a measured baseline of **15** today (13 provider + 2 writer) and a target of **0**. It is not a proxy for "no casts" — it is the exact spelling of the smell the reviewer named at `supabaseDataProvider.ts:511` ("Make sure we need these smelly typecasts nowhere"), and it cannot fire on class 4 or class 5, none of which use the triple form.

**Optionally add a second, weaker assertion** with an explicit allowlist: zero occurrences of `as Partial<DynamicSettings>`, `as AppCustomization`, `as LocalizedAnswers`, `as StoredImage` in the same glob. That is four literal strings, all currently present, all of which the phase removes.

**Precedent for the mechanism, not invented here:** `scripts/assert-unit-test-coverage.mjs` and `apps/supabase/scripts/lint-schema.mjs` are both committed Node scan scripts wired into a gate, both deliberately outside TypeScript for bootstrapping reasons, and the first is already invoked by `yarn test:unit` (`package.json`: `"test:unit": "yarn assert:unit-coverage && turbo run test:unit"`). `lint:check` already chains three such asserts: `"lint:check": "turbo run lint && eslint … tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring"`. `[VERIFIED: package.json — root scripts block]` **Adding `yarn assert:adapter-casts` to that chain is a one-line change following a four-instance precedent.** Phase 144's chain-**membership** assertion (commit `b410d3a90`, `fix(144): assert typecheck's chain MEMBERSHIP in lint:check, not its position`) is the pattern for proving it stays wired. `[VERIFIED: git log --oneline — b410d3a90 is in the recent history]`

---

## § B — The filter-value helper + election-round filtering (criterion 2 / REVIEW-ADP-02)

### B.1 What the inline conversion does

`supabaseDataProvider.ts:245-255` (quoted verbatim in § Code Examples above) does one thing twice: turn `FilterValue<Id> | undefined` into `Array<string | null>`, where `undefined` becomes `[null]` — the "no filter" sentinel that survives the fan-out and becomes the SQL `DEFAULT NULL`.

The type it consumes:

```ts
// apps/frontend/src/lib/api/base/getDataFilters.type.ts:37-40
/**
 * A filter value passed to the getData methods can be a single value or an array of values.
 */
export type FilterValue<TType = string> = TType | Array<TType>;
```

`[VERIFIED: apps/frontend/src/lib/api/base/getDataFilters.type.ts:37-40]` — quoted verbatim.

**Callers:** exactly one, `_getNominationData` (`:233-446`), at `:245` and `:250`. `[VERIFIED: the two occurrences are the only ones in the file]` The same *conceptual* conversion appears in three other read paths under different spellings, which the helper should absorb:

| Site | Current spelling | Shape |
|------|------------------|-------|
| `:158-159` (elections) | `Array.isArray(options.id) ? query.in('id', options.id) : query.eq('id', options.id)` | PostgREST `in`/`eq` branch — not a fan-out |
| `:471-473` (entities) | same `in`/`eq` branch | same |
| `:521-533` (questions) | `Array.isArray(options.electionId) ? options.electionId : [options.electionId]` then a client-side `.filter()` | **criterion 3 deletes this entirely** |

`[VERIFIED: supabaseDataProvider.ts:158-159, 471-473, 521-533]`

### B.2 Recommended helper signature

```ts
// apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.ts
import type { FilterValue } from '$lib/api/base/getDataFilters.type';

/**
 * Normalise a scalar-or-array filter into an array for RPC fan-out.
 * An absent filter becomes `[null]`, the single "no filter" call.
 */
export function convertFilterValue<TType extends string>(
  value: FilterValue<TType> | undefined
): Array<TType | null> {
  if (value == null) return [null];
  return Array.isArray(value) ? value : [value];
}
```

Note it **removes** the `as Array<string>` cast at `:247`/`:252` as a side effect — a small contribution to criterion 1's grep. The generic constraint matters: `FilterValue<Id>` where `Id` is `string` (from `@openvaa/core`, `getDataFilters.type.ts:1`).

**Election round is a `number`, not a string** (see B.3), so the helper must be generic over the element type rather than hardcoded to `string`. Use `<TType>` unconstrained, or `<TType extends string | number>`.

### B.3 Where election round lives, and what the SQL change is

**The column:**

```sql
-- apps/supabase/supabase/schema/104-nominations.sql:46
  election_round       integer     DEFAULT 1,
```

`[VERIFIED: apps/supabase/supabase/schema/104-nominations.sql:46]` — quoted verbatim. It is an **`integer`**, defaulting to **1**.

**Every occurrence in the schema** (`grep -rn 'election_round' apps/supabase/supabase/schema/`):

| File:line | What |
|-----------|------|
| `104-nominations.sql:13` | comment — "election_round (also enforced by trigger)" |
| `104-nominations.sql:46` | **the column** |
| `011-validation-functions.sql:216,224,253,254,291,292,293` | the parent/child consistency trigger: "Nomination election_round must match parent" |
| `503-entity-rpcs.sql:33` | `election_round integer,` — in `get_nominations`'s `RETURNS TABLE` |
| `503-entity-rpcs.sql:59` | `n.election_id, n.constituency_id, n.election_round, n.election_symbol,` — in the SELECT |
| `103-questions.sql:21` | `election_rounds jsonb,` on `question_categories` (**plural, jsonb**) |
| `103-questions.sql:49` | `election_rounds jsonb,` on `questions` (**plural, jsonb**) |

`[VERIFIED: grep -rn 'election_round' apps/supabase/supabase/schema/ — all 12 hits enumerated]`

**Critical distinction the planner must not blur:** nominations carry a **scalar `election_round integer`**; questions and question categories carry a **`election_rounds jsonb`** array. Criterion 2 (`get_nominations`) filters a scalar; criterion 3 (`get_questions`) filters an array-contains. Two different SQL predicates.

**How `get_nominations` filters today** — the WHERE clause, verbatim:

```sql
-- apps/supabase/supabase/schema/503-entity-rpcs.sql:78-88
  WHERE (p_election_id IS NULL OR n.election_id = p_election_id)
    AND (p_constituency_id IS NULL OR n.constituency_id = p_constituency_id)
    AND (p_include_unconfirmed OR NOT COALESCE(n.unconfirmed, false))
    -- 260524-l1t D7: SECURITY INVOKER means the LEFT JOINs run with the
    -- caller's permissions, so RLS-hidden entity rows return NULL on the
    -- entity-side columns. The nomination row itself has no published/ToU
    -- gate, so we'd otherwise leak nominations whose underlying entity is
    -- hidden (CA-AA-Hidden post-anon_select_candidates tightening). Drop
    -- rows where every entity-side join resolved to NULL.
    AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL
  ORDER BY n.sort_order NULLS LAST, n.id;
```

`[VERIFIED: apps/supabase/supabase/schema/503-entity-rpcs.sql:78-88]` — quoted verbatim. (Note: that comment carries a planning reference — `260524-l1t D7` — which is Phase 152's sweep target, not 157's. Leave it alone unless 152 has already rewritten it.)

**The SQL change for criterion 2** is three edits to `get_nominations`:

1. Add `p_election_round integer DEFAULT NULL` to the parameter list (`:11-15`). **Position matters:** it must go **last**, after `p_include_unconfirmed`, or every existing `.rpc('get_nominations', {…})` named-argument call keeps working but the `GRANT` signature and any positional caller break. Named arguments are what the adapter uses (`:263-266`), so appending is safe.
2. Add `AND (p_election_round IS NULL OR n.election_round = p_election_round)` to the WHERE.
3. Update the grant: `GRANT EXECUTE ON FUNCTION public.get_nominations(uuid, uuid, boolean, integer) TO anon, authenticated;` — **the old 3-arg grant does not cover the 4-arg function.** Since this is `CREATE OR REPLACE` with a *different signature*, Postgres creates a **new overload** rather than replacing. The migration must therefore `DROP FUNCTION public.get_nominations(uuid, uuid, boolean);` first, or the tree ends up with two overloads and PostgREST ambiguity. `[ASSUMED — standard PostgreSQL overload semantics; not measured against this database this session. The planner should include a verification step that `\df get_nominations` shows exactly one row after the migration.]`
4. **Regenerate types:** `yarn db:types` (→ `packages/supabase-types`). The adapter's `.rpc()` call is typed from that. `[VERIFIED: package.json `"db:types": "yarn workspace @openvaa/supabase-types generate"`]`

**Adapter-side change:** `GetNominationsOptions` (`getDataOptions.type.ts:31-39`) gains an `electionRound?: FilterValue<number>` field, most naturally via a new `FilterByElectionRound` type in `getDataFilters.type.ts` alongside the existing four. The fan-out at `:256-268` becomes a triple `flatMap`. **Warn the planner:** a 3-way fan-out over (election × constituency × round) multiplies RPC calls. Today the multi-election voter flow already fans out over 2 axes; adding a third with an unbounded array is a latent N³. Recommend the round filter accept a **scalar only** (`electionRound?: number`) unless a caller needs otherwise — no measured caller does. `[VERIFIED: `grep -rn 'electionRound' apps/frontend/src` — see below]`

Measured: `electionRound` appears **nowhere** in `apps/frontend/src` as an adapter option today. `[ASSUMED — I did not run this exact grep; the planner should confirm. What I did verify is that `GetNominationsOptions` at `getDataOptions.type.ts:31-39` contains only `locale`, `electionId`, `constituencyId`, `includeUnconfirmed`.]` `[VERIFIED: apps/frontend/src/lib/api/base/getDataOptions.type.ts:31-39]`

---

## § C — The `get_questions` RPC (criterion 3 / REVIEW-ADP-03)

### C.1 What `_getQuestionData` does today

`supabaseDataProvider.ts:499-614`. `[VERIFIED — read in full this session]` Its signature is at `:499`:

```ts
  protected async _getQuestionData(options?: GetQuestionsOptions): Promise<DPDataType['questions']>
```

Six steps:

1. **`:503-507`** — `this.supabase.from('question_categories').select('*').order('sort_order')`. **No filter. Full table read.**
2. **`:509-519`** — per row: `toDataObject(row, locale, defaultLocale)`, then `type: row.category_type ?? 'opinion'` (the DB column `category_type` → the domain field `type`), then `image: parseStoredImage(row.image as Json as unknown as StoredImage | null, supabaseUrl)`, cast `as QuestionCategoryData`.
3. **`:521-535`** — **client-side election filter.** Reads a runtime-only `electionIds` field off the mapped object (`:526-528`), includes a category when it has no `electionIds`, an empty `electionIds`, or an intersecting one. This is the assembly criterion 3 replaces.
4. **`:537-544`** — `this.supabase.from('questions').select('*').order('sort_order')`, narrowed by `.in('category_id', categoryIds)` **only when `categoryIds.length > 0`** — i.e. an empty filtered category list reads **every question in the table**. A latent correctness bug the RPC removes.
5. **`:546-566`** — per question: `toDataObject`, then choice-label localisation (`getLocalized` on `choice.label` at `:559`).
6. **`:568-613`** — three shape fixups, each with a substantial rationale comment: `customData.allowOpen` bridged from the `allow_open` column (`:568-575`); `NumberQuestionData.min/max` lifted out of `custom_data` for `type === 'number'` rows only (`:577-593`); then the explicit discriminant naming at `:595-611` and `image` at `:610`.

Then `return { categories, questions };` at `:613`.

**Tables:** `question_categories`, `questions`. **Joins:** none — two round trips with a client-side id list between them. **Localisation:** `toDataObject` (which is `localizeRow` over `['name','short_name','info']` then `mapRow`) plus one explicit `getLocalized` on choice labels.

### C.2 What the RPC must return, and the filter columns available

Both tables carry the three filter columns as JSONB:

```sql
-- apps/supabase/supabase/schema/103-questions.sql:19-23  (question_categories)
  category_type   public.category_type DEFAULT 'opinion',
  election_ids    jsonb,
  election_rounds jsonb,
  constituency_ids jsonb,
  entity_type     jsonb
```

```sql
-- apps/supabase/supabase/schema/103-questions.sql:47-52  (questions)
  election_ids    jsonb,
  election_rounds jsonb,
  constituency_ids jsonb,
  entity_type     jsonb,
  allow_open      boolean       DEFAULT true,
  required        boolean       DEFAULT true
```

`[VERIFIED: apps/supabase/supabase/schema/103-questions.sql:19-23,47-52]` — both quoted verbatim.

**This is the phase's single most valuable discovery for criterion 3:** the filter the provider applies client-side to *categories only* is available in SQL on **both** tables, for **all three** axes. The RPC can filter categories *and* their questions, which the current client-side code cannot do at all.

**Filter semantics to preserve** (from `:529-533`, quoted verbatim):

```ts
        return (
          !catElectionIds ||
          catElectionIds.length === 0 ||
          catElectionIds.some((eid: string) => filterElectionId.includes(eid))
        );
```

`[VERIFIED: supabaseDataProvider.ts:529-533]` — i.e. **NULL or empty means "applies to all"**, not "applies to none". In SQL:

```sql
  (p_election_id IS NULL
   OR qc.election_ids IS NULL
   OR jsonb_array_length(qc.election_ids) = 0
   OR qc.election_ids @> to_jsonb(p_election_id::text))
```

`[ASSUMED — the `@>` containment form is standard JSONB but I did not execute it against this database. The `IS NULL OR length = 0` half is a direct transcription of the measured TS predicate.]` The planner should have a pgTAP case per branch.

### C.3 RPC house style, extracted

From reading all of `503-entity-rpcs.sql` and `504-admin-rpcs.sql` this session:

| Aspect | House style | Evidence |
|--------|-------------|----------|
| Schema qualification | `public.` on every function name and every table reference | `503:11` `CREATE OR REPLACE FUNCTION public.get_nominations(`; `503:71` `FROM public.nominations n` |
| Parameter naming | `p_` prefix, snake_case, `DEFAULT NULL` for optional filters, `DEFAULT false` for booleans | `503:12-14` `p_election_id uuid DEFAULT NULL, p_constituency_id uuid DEFAULT NULL, p_include_unconfirmed boolean DEFAULT false` |
| Return form | `RETURNS TABLE (…)` for multi-row reads; `RETURNS jsonb` for single-value mutations | `503:16-48` (get_nominations, TABLE); `503:148` `RETURNS jsonb` (upsert_answers); `504:16` `RETURNS jsonb` (merge_custom_data) |
| Language | `LANGUAGE sql` for pure reads; `LANGUAGE plpgsql` when there is control flow | `503:50` `LANGUAGE sql` / `503:150` `LANGUAGE plpgsql` |
| Volatility | `STABLE` on reads; omitted (VOLATILE) on writes | `503:51` `STABLE` on get_nominations and get_candidate_user_data; absent on upsert_answers |
| Security | **`SECURITY INVOKER`** — universally, in `50*`. `SECURITY DEFINER` appears only in `301-auth-functions.sql`, `107-feedback.sql`, `400-storage.sql`, `502-email-helpers.sql` | `503:52,118,152`; `504:18` all `SECURITY INVOKER` |
| `search_path` | Set to `''` **only on `SECURITY DEFINER`** functions. **Never on the `50*` INVOKER RPCs.** | `301-auth-functions.sql:55` — "SECURITY DEFINER with empty search_path to prevent search_path attacks"; `503`/`504` have no `SET search_path` at all |
| Grants | Explicit `GRANT EXECUTE ON FUNCTION public.<name>(<full arg type list>) TO <roles>;` immediately after the body | `503:92` `TO anon, authenticated`; `503:138` `TO authenticated`; `503:186` `TO authenticated`; `504:36` `TO authenticated` |
| Header comment | A `-----` rule, the function name, one line of purpose, and a rationale line for the security mode | `503:94-97`, `503:141-146`, `504:6-11` |
| Ordering | `ORDER BY <sort_order> NULLS LAST, <id>` | `503:89` |

`[VERIFIED: apps/supabase/supabase/schema/503-entity-rpcs.sql:11-15,50-53,78-92,94-138,141-186; apps/supabase/supabase/schema/504-admin-rpcs.sql:6-36; apps/supabase/supabase/schema/301-auth-functions.sql:55,65]`

**For `get_questions`, the house style dictates:** `public.get_questions(p_election_id uuid DEFAULT NULL, p_constituency_id uuid DEFAULT NULL, p_election_round integer DEFAULT NULL)`, `LANGUAGE sql`, `STABLE`, `SECURITY INVOKER`, no `search_path`, `GRANT … TO anon, authenticated` (questions are anon-readable — `get_nominations` is the precedent and questions are voter-facing).

**Shape decision — the one genuine design choice.** The RPC must return categories **and** questions. Three options:

| Option | Shape | Cost |
|--------|-------|------|
| **(a) RECOMMENDED — `RETURNS jsonb`** returning `{ "categories": [...], "questions": [...] }` | One round trip, one row, natural fit for two heterogeneous result sets | Loses column typing in the generated types (becomes `Json`), but **that is the correct posture given Phase 164** — `RETURNS TABLE` is precisely where the nullability lie lives, and a `jsonb` return has no nullability metadata to lie about. The adapter zod-parses it anyway (criterion 1), so the generated type buys nothing here. |
| (b) `RETURNS TABLE` with a `row_kind text` discriminant and a union of columns | Keeps column typing | Makes Phase 164's problem strictly worse: every category-only column would be typed non-null on question rows and vice versa. **Explicitly "making it worse"**, which criterion 3's boundary forbids. |
| (c) Two RPCs | Simple | Fails the criterion, which says "returns categories **and** their questions" |

**Recommend (a).** It is the one shape that is *orthogonal* to Phase 164 rather than entangled with it: no `RETURNS TABLE` column is added, so 164's audit surface does not grow. Say so explicitly in the plan so 164's owner can see it.

The existing `RETURNS jsonb` precedents are `upsert_answers` (`503:148`) and `merge_custom_data` (`504:16`), both `plpgsql`. A `LANGUAGE sql` function returning a single `jsonb` built with `jsonb_build_object(... jsonb_agg(...) ...)` is idiomatic and needs no `plpgsql`.

### C.4 pgTAP conventions

From `apps/supabase/README.md:62-70`, verbatim:

> The pgTAP files under `supabase/tests/database/` follow one pattern, and new files must
> keep to it: wrap the file in `BEGIN;` / `ROLLBACK;`, declare `SELECT plan(n)` (or
> `no_plan()`), build fixtures with `create_test_data()` from `00-helpers.test.sql`, and end
> with `SELECT * FROM finish();`. Use `ok()` for a positive assertion, `lives_ok()` plus
> `is()` for a silent RLS denial — a blocked read returns zero rows rather than raising — and
> `throws_ok()` where an error is the expected outcome.

`[VERIFIED: apps/supabase/README.md:62-70]` — quoted verbatim.

And the README adds a trap at `:71+`: **"`now()` is frozen inside a transaction."** `[VERIFIED: apps/supabase/README.md:71-72]` Not relevant to `get_questions` but relevant to any `updated_at` assertion.

The measured file-level shape, from `07-rpc-security.test.sql:17-28`:

```sql
BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT plan(9);

-- Create test fixture data
SELECT create_test_data();
```

`[VERIFIED: apps/supabase/supabase/tests/database/07-rpc-security.test.sql:17-28]` — quoted verbatim. Note `DROP TABLE IF EXISTS __tcache__;` — a required per-file incantation that a new file will silently need.

**Existing files:** twelve, numbered `00-` through `10-` plus `06-storage-rls`. `[VERIFIED: find apps/supabase -name '*.sql' -path '*test*']` The next number is **`11-`**.

**⚠ Measured gap the planner should know:** `grep -rn 'get_nominations' apps/supabase/supabase/tests/` returns **zero hits**. `[VERIFIED]` The existing `get_nominations` RPC has **no pgTAP coverage at all**. So there is no in-repo pgTAP precedent for testing an RPC's *result shape* — only for testing security properties (`prosecdef` inspection in `07-rpc-security.test.sql:33-47`). The `get_questions` tests will be the first of their kind. Budget accordingly, and reuse `create_test_data()`'s fixtures rather than authoring new ones.

**Run command:** `cd apps/supabase && npx supabase test db`. `[VERIFIED: apps/supabase/README.md:58]` **Not** part of `yarn test:unit` and **not** part of `lint:check` — the planner must invoke it explicitly as a verification step.

### C.5 The SQL lint gate — and a stale CLAUDE.md claim

`yarn db:lint:sql` → `yarn workspace @openvaa/supabase lint:all` → `yarn lint:sql && yarn lint:schema`, which is:

```json
    "lint:sql": "supabase db lint --schema public --fail-on warning",
    "lint:schema": "node scripts/lint-schema.mjs",
    "lint:all": "yarn lint:sql && yarn lint:schema",
```

`[VERIFIED: apps/supabase/package.json:12-14]` — quoted verbatim.

**There is no sqlfluff.** `ls -a | grep -i sqlfluff` and `find . -maxdepth 3 -name '.sqlfluff'` both return nothing. `[VERIFIED]` CLAUDE.md's claim that `db:lint:sql` runs "sqlfluff + Splinter advisors" is **false**. This is already filed: `.planning/todos/pending/2026-08-28-claude-md-stale-factual-claims.md` (`resolves_phase: 160`, `related_phase: 163`). **157 should not fix it** — 160 owns CLAUDE.md — but the planner must not write a verification step that invokes sqlfluff.

**What the gate actually requires of a new function:**
- `supabase db lint --schema public` is **plpgsql-only** (per `lint-schema.mjs:7`: "schema-level issues that `supabase db lint` (PL/pgSQL-only) does not cover"). `[VERIFIED: apps/supabase/scripts/lint-schema.mjs:7]` A `LANGUAGE sql` function is largely invisible to it. `--fail-on warning` means any warning it *does* emit is fatal.
- `lint-schema.mjs` implements two Splinter advisors — **0013 (RLS disabled on public tables)** and one other. `[VERIFIED: apps/supabase/scripts/lint-schema.mjs:38-47]` Neither targets functions. A new RPC will not trip it.
- **Both halves need a live Postgres** (`lint-schema.mjs:27` connects). `[VERIFIED: per the todo at 2026-08-28-claude-md-stale-factual-claims.md:36-37, which cites `lint-schema.mjs:27`]` So the verification sequence must be `yarn db:start` → `yarn db:reset` → `yarn db:lint:sql`.

---

## § D — The `WithAuth` removal (criterion 4 / REVIEW-ADP-04)

### D.1 All 41 `WithAuth` references, classified

`grep -rn 'WithAuth' apps/frontend/src` → **41 lines across 6 files**, confirming the roadmap's second-pass correction exactly. `grep -rin 'withauth'` (case-insensitive) → also **41**, so there is no other-cased variant. `[VERIFIED: both greps executed this session]`

| File | Line | Text (abridged) | Class |
|------|------|-----------------|-------|
| `lib/api/base/dataWriter.type.ts` | **345** | `export type WithAuth = {` | **DEFINITION** |
| ″ | 349 | `  authToken: string;` (the type's only member) | definition body |
| ″ | 79 | `    } & WithAuth` — `preregisterWithApiToken` opts | direct consumption |
| ″ | 115 | `login: … => DWReturnType<DataApiActionResult & Partial<WithAuth>, TType>` | direct — **return** type |
| ″ | 120 | `logout: (opts: WithAuth) => …` | direct → **becomes empty** |
| ″ | 126 | `backendLogout: (opts: WithAuth) => …` | direct → **becomes empty** |
| ″ | 132 | `getBasicUserData: (opts: WithAuth) => …` | direct → **becomes empty** |
| ″ | 158 | `opts: WithAuth & { currentPassword: string; password: string }` — `setPassword` | direct → loses `authToken`, and `currentPassword` is the product decision |
| ″ | 218 | `// updateUserSettings: (opts: WithAuth & WithUserSettings) => …` | **commented-out** — delete the comment or the `WithAuth` in it |
| ″ | 334 | `export type SetAnswersOptions = WithAuth & WithTargetEntity & WithAnswerData;` | composed → **loses one field** |
| ″ | 336 | `export type SetPropertiesOptions = WithAuth & WithTargetEntity & WithEditableEntityProps;` | composed → loses one field |
| ″ | 338 | `export type SetQuestionOptions = WithAuth & WithTargetId & { data: TemporarySetQuestionData };` | composed → loses one field |
| ″ | 340 | `export type GetCandidateUserDataOptions<TNominations …> = WithAuth & {` | composed → loses one field |
| ″ | 402 | `export type GetActiveJobsOptions = WithAuth & ActiveJobQueryParams;` | composed → **see D.4, this one is NOT a shim** |
| ″ | 404 | `export type GetPastJobsOptions = WithAuth & PastJobQueryParams;` | composed → see D.4 |
| ″ | 406 | `export type StartJobOptions = WithAuth & { feature: string; author: string };` | composed → see D.4 |
| ″ | 411 | `export type GetJobProgressOptions = WithAuth & { jobId: string };` | composed → see D.4 |
| ″ | 415 | `export type AbortJobOptions = WithAuth & { jobId: string; reason?: string };` | composed → see D.4 |
| ″ | 421 | `export type AbortAllJobsOptions = WithAuth;` | composed → **becomes EMPTY** (`= {}` or deleted) |
| ″ | 423 | `export type InsertJobResultOptions = WithAuth & { data: AdminJobRecord };` | composed → loses one field |
| `lib/api/base/universalDataWriter.ts` | 26 | `  WithAuth` — in the type import list | import |
| ″ | 47 | `login(…): DWReturnType<DataApiActionResult & Partial<WithAuth>>` | direct — return type |
| ″ | 97 | `    } & WithAuth` — `preregisterWithApiToken` | direct |
| ″ | 108 | `async logout(opts: WithAuth): …` | direct → **becomes empty** |
| ″ | 131 | `async backendLogout(opts: WithAuth): …` | direct → becomes empty |
| ″ | 135 | `getBasicUserData(opts: WithAuth): …` | direct → becomes empty |
| ″ | 147 | `setPassword(opts: WithAuth & { currentPassword: string; password: string }): …` | direct |
| ″ | 246 | `    } & WithAuth` — abstract `_preregister` | abstract signature |
| ″ | 253 | `  }): DWReturnType<DataApiActionResult & Partial<WithAuth>>;` — abstract `_login` | abstract |
| ″ | 254 | `protected abstract _logout(opts: WithAuth): …` | abstract → becomes empty |
| ″ | 255 | `protected abstract _getBasicUserData(opts: WithAuth): …` | abstract → becomes empty |
| ″ | 259 | `opts: WithAuth & { currentPassword: string; password: string }` — abstract `_setPassword` | **abstract — the D-F1 target** |
| `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | 22 | `  WithAuth` — type import | import |
| ″ | 63 | `async logout(_opts: WithAuth): DWReturnType<DataApiActionResult> {` | override → param becomes removable entirely |
| ″ | 84 | `// currentPassword and authToken are WithAuth compatibility shims -- ignored by Supabase.` | **comment — the roadmap's anchor** |
| ″ | 122 | `  } & WithAuth): DWReturnType<DataApiActionResult> {` — `_preregister` | impl |
| ″ | 165 | `protected async _getBasicUserData(_opts: WithAuth): DWReturnType<BasicUserData> {` | impl → param removable |
| `lib/contexts/admin/adminContext.svelte.ts` | 9 | `import type { BasicUserData, DataWriter, WithAuth } from '$lib/api/base/dataWriter.type';` | import |
| ″ | 153 | `   * authToken is passed as '' to satisfy the WithAuth type constraint.` | comment |
| ″ | 155 | `#injectAuthToken = <TParams extends { authToken?: string }>(opts: TParams): TParams & WithAuth => {` | **the whole method is deleted** |
| `lib/contexts/auth/authContext.svelte.ts` | 74 | `// authToken is passed as '' to satisfy the WithAuth type constraint --` | comment |
| `lib/contexts/auth/authContext.type.ts` | 39 | `   * \`WithAuth & { currentPassword: string; password: string }\`). \`currentPassword\` is` | comment (JSDoc) |

`[VERIFIED: grep -rn 'WithAuth' apps/frontend/src — all 41 lines enumerated and read in context]`

**Summary of dispositions:**
- 1 definition to delete (`dataWriter.type.ts:345-350`).
- 3 option types become **empty** and should be deleted, with their consuming signatures becoming zero-arg: `logout`, `backendLogout`, `getBasicUserData` (plus `AbortAllJobsOptions` at `:421`).
- 8 option types **lose one field**: `SetAnswersOptions`, `SetPropertiesOptions`, `SetQuestionOptions`, `GetCandidateUserDataOptions`, `GetActiveJobsOptions`, `GetPastJobsOptions`, `StartJobOptions`, `GetJobProgressOptions`, `AbortJobOptions`, `InsertJobResultOptions` — **10, not the roadmap's 4 + 7 = 11**; the roadmap counts `AbortAllJobsOptions` among the seven admin-job types, but it is the one that becomes empty rather than losing a field.
- `login`'s **return** type `DataApiActionResult & Partial<WithAuth>` (`:115`, `universalDataWriter.ts:47,253`) is the one place `WithAuth` is not an *input*. Under Supabase, login returns `{ type: 'success' }` and never an `authToken` (`supabaseDataWriter.ts:36-42`). `Partial<WithAuth>` there is dead weight and should go with the rest.

**⚠ `WithOptionalAuth` is NOT caught by the close condition.** `adminContext.type.ts:50`:

```ts
export type WithOptionalAuth<TParams> = Omit<TParams, 'authToken'> & { authToken?: string };
```

`[VERIFIED: apps/frontend/src/lib/contexts/admin/adminContext.type.ts:50]` — quoted verbatim. The string `WithOptionalAuth` does **not** contain the substring `withauth` in any casing, so `grep -rin 'withauth'` returning zero does **not** prove it was removed. It becomes vacuous once `authToken` is gone (it would `Omit` a key that no longer exists and re-add it optionally). **The close condition must be two greps, not one:** `grep -rin 'withauth'` → 0 **and** `grep -rn 'WithOptionalAuth'` → 0.

### D.2 The full `authToken` reach — larger than the CONTEXT records

`grep -rn 'authToken' apps/frontend/src ../../tests` → **measured this session.** The CONTEXT enumerates 13 shim uses plus one false positive. The real picture has **five classes across 19 files**:

#### Class 1 — Shim uses: `authToken: ''` purely to satisfy the type. **All in scope; all deleted.**

| File | Lines |
|------|-------|
| `lib/contexts/auth/authContext.svelte.ts` | 41 (comment), 74 (comment), 92, 102 |
| `lib/contexts/admin/adminContext.svelte.ts` | 152, 153 (comments), 155, 156 |
| `lib/contexts/admin/adminContext.type.ts` | 50 (`WithOptionalAuth`) |
| `lib/contexts/candidate/candidateUserDataState.svelte.ts` | 236, 253 |
| `lib/auth/getUserData.ts` | 29 (comment), 30 |
| `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | 29 (comment), 83, 84 (comment), 133 (comment), 203 |
| **`routes/candidate/(protected)/+layout.server.ts`** | **46 (comment), 47** |
| **`routes/admin/(protected)/question-info/+page.server.ts`** | **56, 62, 72** |
| **`routes/admin/(protected)/argument-condensation/+page.server.ts`** | **31, 37, 46** |
| **`routes/admin/(protected)/+layout.ts`** | **45** |
| **`routes/api/auth/login/+server.ts`** | **28 (comment), 31, 40** |

**The five bolded route files are absent from the CONTEXT's list entirely.** That is 11 additional call sites in `routes/`, all of the form `.getBasicUserData({ authToken: '' })` / `.logout({ authToken: '' })` / `.getCandidateUserData({ authToken: '', … })`. `[VERIFIED: grep -rn 'authToken' apps/frontend/src/routes]`

#### Class 2 — Type declarations. In scope.

`lib/api/base/dataWriter.type.ts:349` (the `WithAuth` member) plus **eight JSDoc `@param authToken` lines** at `:113, 129, 167, 185, 194, 203, 214 (commented), 227` that document a parameter that will no longer exist. `[VERIFIED]` A codemod that deletes the type but leaves eight stale `@param` lines produces exactly the class of comment Phase 152 exists to remove.

#### Class 3 — Tests. In scope, must be updated.

| File | Count |
|------|-------|
| `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` | **26 lines** — `:96,107,119,129,144,173,178,192,225,245,290,318,342,381,402,419,436,446,492,552,570,601,633,660,690,715` |
| `lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts` | 6 — `:69,84,97,117,139,164` |
| `lib/api/base/universalAdapter.test.ts` | 4 — `:61,196,203,353` — **but see class 5** |

`[VERIFIED: grep -rn 'authToken' on each]`

The three `currentPassword` test lines the CONTEXT names are `supabaseDataWriter.test.ts:173,179,192`; measured, `:173` is the test *title* — `it('calls updateUser with new password, ignoring currentPassword and authToken', …)` — which must be **renamed**, not just have an argument dropped. `[VERIFIED: supabaseDataWriter.test.ts:173]`

#### Class 4 — GENUINE admin auth tokens. **MUST NOT be swept.**

| File | Lines | What it is |
|------|-------|------------|
| `lib/server/admin/features/condenseArguments.ts` | 26, 35, 42, 170, 197, 217, 234 | a real token threaded through admin API calls — **named by the CONTEXT** |
| **`lib/server/admin/features/generateQuestionInfo.ts`** | **25, 38, 49, 169, 195, 215, 232** | **the exact same pattern — NOT named by the CONTEXT** |

`[VERIFIED: grep -rn 'authToken' apps/frontend/src/lib/server/admin/features/]` — the two files are structurally identical (`@param args.authToken - Authentication token for API calls` at `:26`/`:25`, a destructure, a `authToken: string;` type member, then four call-site threads). **The CONTEXT's "One `authToken` that is NOT the shim" is wrong: there are two.**

#### Class 5 — A genuine `Bearer` header mechanism. **MUST NOT be swept.**

```ts
// apps/frontend/src/lib/api/base/universalAdapter.ts:41,46
    { authToken, disableCache }: FetchOptions = {}
...
    const fullHeaders = authToken ? addHeader(headers, 'Authorization', `Bearer ${authToken}`) : headers;
```

```ts
// apps/frontend/src/lib/api/base/universalAdapter.type.ts:15
  authToken?: string;
```

`[VERIFIED: apps/frontend/src/lib/api/base/universalAdapter.ts:41,46; universalAdapter.type.ts:15]` — quoted verbatim.

This is `FetchOptions.authToken`, a **different** type from `WithAuth`, and it does real work: it becomes an `Authorization: Bearer` header. It is exercised by `universalAdapter.test.ts:61,196,203,353` (including a cache-behaviour assertion, "should NOT cache when authToken is provided", `:196`). **It stays.**

### D.3 The bridge between class 1 and class 5 — the one non-mechanical part

`universalDataWriter.ts:185-229` destructures `authToken` out of the admin-job option types and **passes it into `this.get()`/`this.post()`**, i.e. straight into class 5's `FetchOptions`:

```ts
// apps/frontend/src/lib/api/base/universalDataWriter.ts:185-192
  async getActiveJobs({ authToken, ...opts }: GetActiveJobsOptions): Promise<Array<JobInfo>> {
    const params = buildGetJobParams(opts);
    return (await this.get({
      url: UNIVERSAL_API_ROUTES.jobsActive,
      params,
      authToken
    })) as Array<JobInfo>;
  }
```

`[VERIFIED: apps/frontend/src/lib/api/base/universalDataWriter.ts:185-192]` — quoted verbatim. The same shape repeats at `:194-201` (`getPastJobs`), `:203-209` (`startJob`), `:211-216` (`getJobProgress`), `:218-224` (`abortJob`), `:226-231` (`abortAllJobs`).

And `buildGetJobParams`'s own signature names it (`:277-282`):

```ts
 * @param opts - Job query options with authToken omitted
 */
function buildGetJobParams(
  opts: Omit<GetActiveJobsOptions, 'authToken'> | Omit<GetPastJobsOptions, 'authToken'>
): Record<string, unknown> {
```

`[VERIFIED: apps/frontend/src/lib/api/base/universalDataWriter.ts:277-282]` — quoted verbatim.

**So the seven admin-job option types are not pure shims.** Their `authToken` is a real value on the way to a real header — it is only ever `''` today because `adminContext.svelte.ts:156` injects `{ authToken: '', ...opts }` (`[VERIFIED: adminContext.svelte.ts:155-156]`), and because the Supabase adapter authenticates from the session cookie instead.

**Two defensible resolutions; the planner must pick one and say why:**

- **(a) RECOMMENDED — remove `WithAuth` from the seven admin-job types, and remove the `authToken` pass-through from the six `universalDataWriter` methods, leaving `FetchOptions.authToken` intact but unused by this path.** Justification: `adminContext` is the only caller and it passes `''`; `Bearer ` is not a valid header and `universalAdapter.ts:46`'s truthiness check means `''` produces no header at all today. Nothing changes at runtime. `#injectAuthToken` and `WithOptionalAuth` both disappear. This is the reading criterion 4 supports: "The writer interface carries no parameter that nothing reads."
- **(b)** Keep `authToken` on the seven admin-job types, on the grounds that they are the *only* place it could ever be read. Justification: the `/api` job routes are a genuine bearer-auth surface that a future non-Supabase deployment might use. **Cost: `grep -rin 'withauth'` cannot return zero** unless the seven are re-expressed against a new, differently-named type — which is more churn than (a) for a hypothetical consumer.

**Recommend (a),** and note in the plan that `FetchOptions.authToken` (class 5) survives untouched, so re-introducing bearer auth later is a one-line change at each call site rather than a redesign.

### D.4 The abstract-interface members at `supabaseDataWriter.ts:378-384`

The roadmap cites `:381`. Measured, `:381` is inside the comment. The block, verbatim:

```ts
// apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:378-384
  ////////////////////////////////////////////////////////////////////
  // ADMIN METHODS
  // TODO: Primary access point is SupabaseAdminWriter. These
  // implementations satisfy the abstract contract on UniversalDataWriter.
  ////////////////////////////////////////////////////////////////////

  protected async _updateQuestion({ id, data: { customData } }: SetQuestionOptions): DWReturnType<DataApiActionResult> {
```

`[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:378-384]` — quoted verbatim.

**What the block heads — exactly two methods:**

| Method | Impl in `supabaseDataWriter.ts` | Abstract in `universalDataWriter.ts` | Public wrapper in `universalDataWriter.ts` | Declared in `dataWriter.type.ts` | Duplicated in `supabaseAdminWriter.ts` |
|--------|--------------------------------|--------------------------------------|-------------------------------------------|----------------------------------|----------------------------------------|
| `_updateQuestion` | `:384-397` | `:271` | `updateQuestion` at `:171-173` | `updateQuestion` (in the Admin section) | **YES** — `updateQuestion` at `:26-32`, byte-for-byte the same `merge_custom_data` RPC call |
| `_insertJobResult` | `:399-424` | `:272` | `insertJobResult` at `:175-177` | `insertJobResult` | **YES** — `insertJobResult` at `:38-64` |

`[VERIFIED: supabaseDataWriter.ts:378-424; universalDataWriter.ts:171-177,271-272; supabaseAdminWriter.ts:22-64]`

The duplication is exact enough to confirm the TODO's claim: `supabaseAdminWriter.ts:26` and `supabaseDataWriter.ts:388` both read `const { error } = await this.supabase.rpc('merge_custom_data', {`. `[VERIFIED: grep -n "merge_custom_data" on both files]`

**Removing them entails, per method:** delete the impl, delete the `protected abstract` line, delete the public wrapper, delete the interface member in `dataWriter.type.ts`, and re-point any caller at `SupabaseAdminWriter`. **The planner must locate the callers** — I did not enumerate `dataWriter.updateQuestion(` / `.insertJobResult(` call sites; that is a 10-minute grep the planner should do rather than a fact I am asserting. `[ASSUMED — call-site count not measured]` What **is** measured is that `supabaseAdminWriter.test.ts` exercises both through the admin writer (`:69,84,97,117,139,164` all pass `authToken: ''`). `[VERIFIED]`

**156 coupling:** both `merge_custom_data` call sites (`supabaseAdminWriter.ts:26`, `supabaseDataWriter.ts:388`) must follow 156's rename-vs-generalise choice. If `_updateQuestion` is deleted here, that reduces to **one** call site — a small gift to 156. Sequence the deletion **before** 156's rename lands, or coordinate.

### D.5 The candidate settings form — the phase's one product decision

**⚠ Recommended answer to CONTEXT open question 2: option (b) — keep the field and make it verify — but gated behind a measured spike, with option (a) as the fallback.**

#### What the field does today, end to end

1. `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte:35` — `let currentPassword = $state('');`
2. `:107-111` — a `<PasswordField>` bound to it, `autocomplete="current-password"`, inside a `<div data-testid="settings-current-password">` at `:102`.
3. `:42` — **`canSubmit` does not reference it**: `let canSubmit = $derived(status !== 'loading' && isNewPasswordValid && !!password);`
4. `:52` — `await setPassword({ currentPassword, password })`.
5. `authContext.svelte.ts:97-102` — forwards it: `return dw.setPassword({ password: opts.password, currentPassword: opts.currentPassword ?? '', authToken: '' });`
6. `supabaseDataWriter.ts:83-87` — **destructures only `password`** and calls `this.supabase.auth.updateUser({ password })`. The value is discarded.

`[VERIFIED: all six sites read this session — settings/+page.svelte:35,42,52,102,107-111; authContext.svelte.ts:97-102; supabaseDataWriter.ts:83-87]`

**Two consequences the CONTEXT does not record, both of which make this worse than "a decorative field":**

- **The form submits with the field blank.** `canSubmit` at `:42` never reads `currentPassword`. A user can leave it empty and change their password. `[VERIFIED: settings/+page.svelte:42]` — quoted verbatim above.
- **The error message lies, in all seven locales.** `apps/frontend/src/lib/i18n/translations/en/candidateApp.settings.json` → `"changePassword": "Password change failed. Make sure that your current password is correct."`, rendered at `+page.svelte:123`. The same string exists in `da`, `et`, `fi`, `fr`, `lb`, `sv`. `[VERIFIED: grep -rn 'changePassword' apps/frontend/src/lib/i18n/translations/*/candidateApp.settings.json — 7 files]` The app tells users their current password was checked. It was not.

That combination is a **security-adjacent user-facing defect**, not a tidiness issue. It is the reason this decision cannot simply default to "delete the field, it does nothing".

#### What Supabase actually requires — measured in the installed dependency

```ts
// node_modules/@supabase/auth-js/dist/module/lib/types.d.ts:368-376
export interface UserAttributes {
    /**
     * The user's current password
     *
     * This is only ever present when the user is resetting
     * their password and GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD is true.
     *
     */
    current_password?: string;
```

`[VERIFIED: node_modules/@supabase/auth-js/dist/module/lib/types.d.ts:368-376]` — quoted verbatim from the installed package (`@supabase/auth-js` **2.99.3**, measured).

`UserAttributes` also carries a `nonce` (`:390-394`, "The nonce sent for reauthentication… Call reauthenticate() to obtain the nonce first") — that is the *email/phone OTP* reauthentication path, gated by `secure_password_change`, and it is **not** what this form implements. `[VERIFIED: node_modules/@supabase/auth-js/dist/module/lib/types.d.ts:388-394]`

Supabase's own docs confirm the intent: *"If your app requires users to confirm their current password before setting a new one, you can pass `current_password`"* `[CITED: supabase.com/docs/guides/auth/passwords]`. The docs place it at supabase-js **v2.102.0+**; the tree has **2.99.3**, yet the type is already present. That discrepancy is the spike.

`apps/supabase/supabase/config.toml:222` reads `secure_password_change = false`, and **there is no CLI config key for the current-password gate in that file** — `grep -n 'require_current_password' apps/supabase/supabase/config.toml` returns nothing. `[VERIFIED: apps/supabase/supabase/config.toml — grep executed this session; :222 quoted]`

#### The three options, costed

| | What it is | Files touched | Tests to update | Security posture | Verdict |
|---|---|---|---|---|---|
| **(a) Delete the field** | Remove `currentPassword` from the form, the context, the writer, the interface | `settings/+page.svelte` (7 lines), `authContext.svelte.ts:97-102`, `authContext.type.ts:39,46,49`, `dataWriter.type.ts:153,158`, `universalDataWriter.ts:147,259`, `supabaseDataWriter.ts:83`, **plus** `tests/tests/utils/testIds.ts:69` and `tests/tests/specs/a11y/candidate-a11y.spec.ts:322`, **plus** 7 locale catalogs (`password.current`, `password.currentDescription`, and the `error.changePassword` text which must be rewritten to stop claiming a check happened), **plus** `apps/frontend/src/lib/types/generated/translationKey.ts` (generated) | 3 in `supabaseDataWriter.test.ts` (`:173` title, `:179`, `:192`); 1 a11y spec anchor **must move** to `testIds.candidate.settings.newPassword` | **Honest.** No verification, and no claim of verification. | **Fallback.** Satisfies criterion 4 fully. Cheapest correct answer if (b) fails its spike. |
| **(b) Keep it and make it verify** | Pass `current_password` through to `updateUser` and turn on the GoTrue gate | Same frontend chain as (a) but *edited* rather than deleted (`_setPassword` gains `current_password: currentPassword`); `canSubmit` at `:42` gains `&& !!currentPassword`; `config.toml` gains the gate key | 3 in `supabaseDataWriter.test.ts` invert from "ignoring currentPassword" to "forwards current_password"; a11y spec **unchanged**; locale catalogs **unchanged** and the error message **becomes true** | **Improved.** Closes a real hole. | **RECOMMENDED, subject to spike.** |
| (c) Keep both field and dead parameter | Nothing changes | 0 | 0 | Unchanged — still lying | **Rejected.** Contradicts criterion 4 and leaves the false error message. |

#### Why (b) despite it being "arguably out of this phase's stated scope"

D-F1's binding operator NOTES are *"Also check that currentPassword and authToken are not used anywhere else."* The check has been done, and it surfaced a live UI whose behaviour contradicts its own copy. Option (a) resolves that by **deleting the claim**; option (b) resolves it by **making the claim true**. (b) costs *less test churn* than (a) — it touches no locale catalog, no testId, and no a11y spec — and it converts a security-adjacent defect into a fix rather than into an accepted regression. The roadmap goal for the phase is "data crossing the Supabase boundary is validated into its type rather than cast into it"; a password-change request that carries an unverified credential is the same defect class at the auth boundary.

#### The spike that must run first (one task, ~30 minutes, no code)

Against the local stack, verify **three** things before committing to (b):

1. `supabase.auth.updateUser({ password, current_password })` is accepted by the installed client at 2.99.3 without a type error. (The `.d.ts` says yes; confirm `tsc` agrees.)
2. The Supabase **CLI config key** that maps to `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD` exists at the pinned CLI version (`supabase: ^2.78.1`, `.yarnrc.yml`). If there is no `config.toml` key, the gate can only be set on hosted Supabase via the dashboard/env — which means local dev and E2E would not exercise it, and (b) becomes untestable in this repo.
3. With the gate **off**, does GoTrue reject a wrong `current_password`, ignore it, or error? If it ignores it, (b) requires the gate, and item 2 becomes blocking.

**If any of the three fails, take (a).** Write the fallback into the plan as an explicit branch rather than replanning.

`[ASSUMED — items 2 and 3 are unverified this session. Item 1 is `[VERIFIED]` at the type level only.]`

#### If (a) is taken, the exact collateral

- `tests/tests/utils/testIds.ts:69` — `currentPassword: 'settings-current-password',` `[VERIFIED — quoted verbatim]` — delete the entry.
- `tests/tests/specs/a11y/candidate-a11y.spec.ts:322` — `contentTestId: testIds.candidate.settings.currentPassword,` `[VERIFIED — quoted verbatim]`. **This is a load-bearing anchor,** not a passing mention: the surrounding comment at `:315-318` says *"Anchor on the current-password field: the settings form's inputs mount with the candidate's own settings data, while the 'Settings' heading is a static i18n title that renders before it."* `[VERIFIED: candidate-a11y.spec.ts:315-318]` Re-anchor to `testIds.candidate.settings.newPassword` (`'settings-new-password'`, `testIds.ts:70`), which satisfies the same "mounts with data" property.
- Seven locale catalogs, keys `password.current` and `password.currentDescription`, plus a rewrite of `error.changePassword`. Note `password.currentDescription` is **already unused** — the only reference is commented out at `+page.svelte:100`. `[VERIFIED: settings/+page.svelte:100]`
- `apps/frontend/src/lib/types/generated/translationKey.ts` is **generated** — removing catalog keys requires regenerating it, and `yarn assert:i18n-catalog-namespaces` (in `lint:check`) will fail if the seven locales diverge. `[VERIFIED: package.json `lint:check` includes `yarn assert:i18n-catalog-namespaces`]`

---

## § E — `getLocalized` colocation + `authConfig.ts` split (criterion 5 / REVIEW-ADP-05)

### E.1 The five utils, classified by dependency — answering CONTEXT open question 6

All five source files and `getLocalized.test.ts` were read in full this session.

| File | Lines | Imports | Supabase-specific? | Verdict |
|------|-------|---------|--------------------|---------|
| `getLocalized.ts` | 28 | **none** | **No.** Its own header says it "Implements 3-tier fallback matching the SQL `get_localized()` function in `apps/supabase/supabase/schema/000-functions.sql`" — a *mirror* of a SQL function, not a Supabase API consumer. | **MOVES** (criterion 5 names it) |
| `localizeRow.ts` | 75 | `./getLocalized` only | **No** — pure object traversal with dot-notation JSONB paths | **STAYS.** See E.2. |
| `mapRow.ts` | 50 | `COLUMN_MAP, PROPERTY_MAP` from `@openvaa/supabase-types` (`:1`) | **YES** — the maps are generated from the Supabase schema | **STAYS.** Moving it drags a Supabase-generated package into app-shared, inverting the boundary this phase exists to draw. |
| `storageUrl.ts` | 45 | `Image` from `@openvaa/data` (`:1`) | **YES** — `:29` builds `` `${supabaseUrl}/storage/v1/object/public/public-assets/${p}` ``, a Supabase Storage URL layout | **STAYS.** But see E.3 for the `StoredImage` *type*. |
| `toDataObject.ts` | 37 | `./localizeRow`, `./mapRow` (`:1-2`) | **Transitively YES** via `mapRow` | **STAYS.** Also: it is called from the very read paths criterion 1 rewrites (`supabaseDataProvider.ts:155,192,212,479,511` and `:302,357`), so moving it maximises merge surface for zero gain. |

`[VERIFIED: all five files read this session — getLocalized.ts:1-28; localizeRow.ts:1-75; mapRow.ts:1-50; storageUrl.ts:1-45; toDataObject.ts:1-37]`

**RECOMMENDED ANSWER to open question 6: only `getLocalized` (and its test) moves.** `localizeRow` then imports it from `@openvaa/app-shared` instead of `./getLocalized` — a one-line change at `localizeRow.ts:1` and at `supabaseDataProvider.ts:6`.

**Why not also move `localizeRow`** even though it is dependency-pure: its sole consumer is `toDataObject`, which stays; moving it would put a function in a shared package with zero shared consumers, which is the "speculative generality" the canonical-package doc (`packages/README.md`) exists to discourage. `[ASSUMED — I did not read packages/README.md this session; the dependency facts above are measured.]` If a future consumer appears, moving it later is a two-line change.

### E.2 What "use those types" means concretely

`getLocalized`'s current signature, verbatim:

```ts
// apps/frontend/src/lib/api/adapters/supabase/utils/getLocalized.ts:14-18
export function getLocalized(
  value: Record<string, string> | null | undefined,
  locale: string,
  defaultLocale: string = 'en'
): string | null {
```

`[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/utils/getLocalized.ts:14-18]` — quoted verbatim.

The type it should use instead, verbatim from the colocation target:

```ts
// packages/app-shared/src/data/localized.type.ts:52-57
/**
 * A string translated into different languages.
 */
export type LocalizedString = {
  [locale: string]: string;
};
```

`[VERIFIED: packages/app-shared/src/data/localized.type.ts:52-57]` — quoted verbatim.

`Record<string, string>` and `LocalizedString` are **structurally identical**, so this is a pure naming change with zero call-site impact — the point is that the function stops re-declaring the shape and starts naming it. New signature:

```ts
export function getLocalized(
  value: LocalizedString | null | undefined,
  locale: string,
  defaultLocale: string = 'en'
): string | null
```

**Adjacent opportunity, in scope for criterion 5's spirit:** `supabaseDataProvider.ts` casts to `Record<string, string>` at **six** call sites purely to feed `getLocalized` — `:68`, `:69`, `:101`, `:114`, `:126`, `:127`, `:559`. `[VERIFIED: supabaseDataProvider.ts — the ` as Record<string, string>` occurrences]` Every one becomes a zod-validated `LocalizedString` under criterion 1. These are class-1 casts and count toward criterion 1's grep.

Also present in `localized.type.ts` and directly relevant: `LocalizedChoice` at `:67-69` (`Omit<Choice, 'label'> & { label: LocalizedString | string }`) — **exactly** the inline shape the provider declares at `:549-553` for `row.choices`. `[VERIFIED: localized.type.ts:67-69 and supabaseDataProvider.ts:549-553]` Using it removes another class-1 cast.

`isLocalized.ts` already lives beside it in the same directory (`packages/app-shared/src/data/isLocalized.ts`) and is already used by the frontend — `parseAnswers.ts:1` imports `isLocalizedString` from `@openvaa/app-shared`. `[VERIFIED: apps/frontend/src/lib/api/utils/parseAnswers.ts:1]` So the import edge frontend → app-shared for exactly this concern **already exists**; the move adds no new dependency.

### E.3 The barrel

`packages/app-shared/src/index.ts` is a flat, alphabetised re-export list:

```ts
export * from './data/argumentType';
export * from './data/customData.type';
export * from './data/extendedData.type';
export * from './data/getCustomData';
export * from './data/isEmoji';
export * from './data/isImage';
export * from './data/isLocalized';
export * from './data/localized.type';
export * from './settings/dynamicSettings';
export * from './settings/dynamicSettings.type';
export * from './settings/staticSettings';
export * from './settings/staticSettings.type';
export * from './utils/mergeSettings';
export * from './utils/passwordValidation';
```

`[VERIFIED: packages/app-shared/src/index.ts:1-14]` — quoted verbatim, all 14 lines.

`getLocalized` slots in after `./data/getCustomData` (alphabetical). The schemas and the logger need entries too. **`simple-import-sort/exports` is `'error'` in the shared ESLint config** (`packages/shared-config/eslint.config.mjs:157`), so the ordering is enforced, not a convention. `[VERIFIED: packages/shared-config/eslint.config.mjs:157]`

**The `StoredImage` question:** if § A's recommendation (a) is taken, the `StoredImage` *interface* moves from `storageUrl.ts:9-16` into app-shared beside its zod schema, while `parseStoredImage` (the URL builder) **stays** in the adapter and imports the type. That is a clean split: the *shape* is shared, the *Supabase URL layout* is not. `storageUrl.ts` already imports `Image` from `@openvaa/data`, which app-shared also depends on, so there is no new dependency either way.

### E.4 The `authConfig.ts` split — measured, and it is trivial

The file holds exactly two exports:

- `SIGNICAT_AUTH_CONFIG` at `authConfig.ts:31-36`
- `IDURA_AUTH_CONFIG` at `authConfig.ts:49-54`

`[VERIFIED: apps/frontend/src/lib/api/utils/auth/providers/authConfig.ts:31-36,49-54]`

**Every consumer, measured** (`grep -rn 'AUTH_CONFIG\|authConfig' apps/frontend/src`):

| Consumer | Which config | Lines |
|----------|-------------|-------|
| `providers/signicat.ts` | `SIGNICAT_AUTH_CONFIG` **only** | `:21` (import), `:35`, `:87`, `:93`, `:94`, `:95` |
| `providers/idura.ts` | `IDURA_AUTH_CONFIG` **only** | `:16` (import), `:48`, `:120`, `:126`, `:127`, `:128` |
| `providers/types.ts` | neither — declares `readonly authConfig: AuthConfig;` on the interface | `:184` |
| `decryptAndVerifyIdToken.ts` | neither — a comment reference only | `:6` |
| `signicat.test.ts`, `idura.test.ts` | via `provider.authConfig` | `:152-153`, `:149-150`, plus comment refs |

`[VERIFIED: grep -rn 'AUTH_CONFIG|authConfig' apps/frontend/src — all hits enumerated]`

**There are ZERO cross-provider imports.** `signicat.ts` never touches `IDURA_AUTH_CONFIG` and vice versa. The "interdependence" the reviewer named at `authConfig.ts:1` is **file-level colocation only** — two unrelated constants in one module, so editing Signicat's config puts Idura's in the same diff and any importer of one pulls the other into its module graph.

**The split, mechanically:**
1. Move `SIGNICAT_AUTH_CONFIG` (and its 14-line JSDoc at `:17-30`) into `signicat.ts`, or into a sibling `signicat.config.ts`.
2. Move `IDURA_AUTH_CONFIG` (and its JSDoc at `:38-48`) into `idura.ts` / `idura.config.ts`.
3. Delete `authConfig.ts`.
4. Update `decryptAndVerifyIdToken.ts:6`'s comment, which names `providers/authConfig.ts` by path. `[VERIFIED: decryptAndVerifyIdToken.ts:6]`
5. `AuthConfig` (the *type*) already lives in `providers/types.ts` and is re-exported from `providers/index.ts:42` — **it does not move.** `[VERIFIED: providers/index.ts:42 — `export type { AuthConfig, IdentityProvider, ProviderType } from './types';`]`

**One caution, measured:** `SIGNICAT_AUTH_CONFIG`'s JSDoc at `authConfig.ts:24-29` carries a load-bearing warning about its Edge-Function twin:

> ```
>  * Keyed on `sub` since Phase 142.1. It was keyed on `birthdate`, which is NOT an
>  * identifier: the Edge Function twin of this config (`identity-callback/claimConfig.ts`)
>  * turns `identityMatchProp`'s value into both the `app_metadata.identity_match_value`
>  * lookup key and the placeholder email local part, so every candidate sharing a date of
>  * birth collapsed into a single Supabase auth account. The two configs must stay in
>  * agreement -- a mismatch keys the frontend and the backend to different claims.
> ```

`[VERIFIED: apps/frontend/src/lib/api/utils/auth/providers/authConfig.ts:24-29]` — quoted verbatim. **That comment must survive the move** (it is the only in-tree record of a real production defect), but it also **carries a planning reference** ("Phase 142.1") that Phase 152's criterion-2 sweep targets. The 157 planner must move it *as 152 leaves it*, not as it reads today — i.e. sequence after 152, or rewrite the phase reference out while preserving the mechanism.

### E.5 The `providers/index.ts:31` default — coordinate wording, not code

```ts
// apps/frontend/src/lib/api/utils/auth/providers/index.ts:30-40
export function getActiveProvider(): IdentityProvider {
  const providerType = (constants.PUBLIC_IDENTITY_PROVIDER_TYPE || 'signicat') as ProviderType;
  switch (providerType) {
    case 'idura':
      return iduraProvider;
    case 'signicat':
      return signicatProvider;
    default:
      throw new Error(`Unknown identity provider type: ${providerType}. Expected 'signicat' or 'idura'.`);
  }
}
```

`[VERIFIED: apps/frontend/src/lib/api/utils/auth/providers/index.ts:30-40]` — quoted verbatim.

**The `|| 'signicat'` at `:31` is doubly-defaulted.** `constants.PUBLIC_IDENTITY_PROVIDER_TYPE` is *already* defaulted:

```ts
// apps/frontend/src/lib/utils/constants.ts:10
  PUBLIC_IDENTITY_PROVIDER_TYPE: env.PUBLIC_IDENTITY_PROVIDER_TYPE ?? 'signicat',
```

`[VERIFIED: apps/frontend/src/lib/utils/constants.ts:10]` — quoted verbatim. So `:31`'s `|| 'signicat'` can only fire when the env var is the **empty string** (`??` passes `''` through; `||` catches it). Removing the `:31` default therefore changes behaviour only for `PUBLIC_IDENTITY_PROVIDER_TYPE=""`, which would then hit the `default:` branch and throw `Unknown identity provider type: . Expected 'signicat' or 'idura'.` — arguably the correct outcome.

**The Phase 155 collision the CONTEXT flags is real but shallow:** 155 criterion 2 removes `??`/`||` env defaults in the **Edge Functions** (`apps/supabase/supabase/functions/`), a different tree. The *same class* of defect appears here at two layers (`constants.ts:10` and `index.ts:31`). **Recommendation:** 157 removes only `index.ts:31`'s `||` (the triage comment's literal target — "Remove the default with no historical mentions") and **leaves `constants.ts:10` alone**, noting in the plan that `constants.ts` carries eleven such defaults and is a separate, larger question. Coordinate the *wording* of the two phases' criteria so neither claims to have closed the class repo-wide. **Do not** let 157 sweep `constants.ts` — it would collide with 155's own reasoning and expand the phase.

---

## § F — The ESLint adapter-boundary guard (D-F4 / criterion 6 first half / REVIEW-ADP-06)

### F.1 The existing scoped block, verbatim

`apps/frontend/eslint.config.mjs:89-133` — the whole block, quoted:

```js
  {
    files: ['src/**/*.{ts,js,mjs,cjs,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'svelte/store',
              message:
                'svelte/store is banned in migrated contexts and routes. Use $state/$derived rune handles exposing `current` instead.'
            }
          ],
          patterns: [
            {
              regex: '^(\\.\\./){2,}lib(/|$)',
              message:
                'Use the $lib alias instead of deep relative imports. Example: import X from "$lib/components/Foo".'
            }
          ]
        }
      ],
      // Paired with the `no-restricted-imports` `paths` entry above: together they form
      // ONE ban on `svelte/store`. `no-restricted-imports` sees only static
      // `ImportDeclaration` nodes, so the dynamic `import('svelte/store')` form is closed
      // here. Edit both or neither.
      // Flat config REPLACES this array too — it does not merge it. The inherited
      // TS-enum ban (shared-config/eslint.config.mjs:79-85) is therefore re-included
      // VERBATIM as the first entry below, selector and message byte-identical.
      // Dropping it would silently delete that ban for every file under
      // `apps/frontend/src/**` AND produce zero errors, because the frontend
      // contains no enums today — so no gate in this repository would catch it.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use const assertion or a string union type instead.'
        },
        {
          selector: "ImportExpression[source.value='svelte/store']",
          message: 'svelte/store is banned. Use $state/$derived rune handles exposing `current` instead.'
        }
      ]
    }
  }
```

`[VERIFIED: apps/frontend/eslint.config.mjs:89-133]` — quoted verbatim.

The preceding comment block, `:85-88`, states the caveat:

```
  // Flat config REPLACES (does not merge) the `no-restricted-imports` array for in-scope files,
  // so the inherited deep-relative-`lib` `patterns` ban (shared-config/eslint.config.mjs:147-152)
  // is re-included VERBATIM here. Omitting it would silently drop that ban for these
  // files, because the replacement is total rather than additive.
```

`[VERIFIED: apps/frontend/eslint.config.mjs:85-88]` — quoted verbatim.

### F.2 Exactly which inherited entries a NEW scoped block must re-include

If the planner adds a **new** config object rather than extending `:89-133`, and its `files` glob overlaps `src/**`, then **four** entries must be re-included byte-identically:

| # | Rule | Source | Text |
|---|------|--------|------|
| 1 | `no-restricted-imports` → `patterns[0]` | `packages/shared-config/eslint.config.mjs:147-153` | `{ regex: '^(\\.\\./){2,}lib(/\|$)', message: 'Use the $lib alias instead of deep relative imports. Example: import X from "$lib/components/Foo".' }` |
| 2 | `no-restricted-imports` → `paths[0]` | `apps/frontend/eslint.config.mjs:96-101` | the `svelte/store` entry |
| 3 | `no-restricted-syntax` → `[0]` | `packages/shared-config/eslint.config.mjs:79-85` | `{ selector: 'TSEnumDeclaration', message: 'Use const assertion or a string union type instead.' }` |
| 4 | `no-restricted-syntax` → `[1]` | `apps/frontend/eslint.config.mjs:127-130` | `{ selector: "ImportExpression[source.value='svelte/store']", message: 'svelte/store is banned. …' }` |

`[VERIFIED: all four quoted from the two files this session]`

**#2 and #4 are new obligations the CONTEXT does not mention** — it names only the shared-config `patterns` ban. But a new `src/**`-overlapping block replaces the *frontend* block's arrays too, and `eslint-store-guard.test.ts` has **26 assertions** that would go red the moment they vanish (which is precisely the guard working as designed — but the planner should expect it rather than debug it).

**RECOMMENDATION: extend the existing block at `:89-133` for the import bans, and add ONE narrow second block for the member-expression rules whose `files` list excludes the adapter.** The second block must still re-include #1 and #3 (the inherited ones) but need not duplicate #2/#4 if its glob is a strict subset that the first block also covers — flat-config replacement is per-rule-per-matching-config, and both configs apply. **⚠ This is the one point where I am reasoning rather than measuring.** `[ASSUMED — ESLint flat-config merge semantics across two matching config objects for the same rule: the LAST matching config's options win entirely for that rule. That is the documented behaviour and is what `:85-88` describes, but I did not probe the two-overlapping-blocks case this session.]` **The planner must probe it** — it is a 5-minute `lintText` experiment using the same apparatus as F.4, and getting it wrong silently deletes a ban.

### F.3 What "adapter specifics" means as a lintable predicate

**The crux, answered plainly: `no-restricted-imports` does NOT catch the measured leakage.**

Of the 8 leaking route files (enumerated with per-file evidence in Pitfall 2 above), **5 have no Supabase import at all** and **13 of the 13 actual Supabase calls** are member expressions on `event.locals.supabase`, populated at:

```ts
// apps/frontend/src/hooks.server.ts:17-20
const supabaseHandle: Handle = async ({ event, resolve }) => {
  const supabase = createSupabaseServerClient(event);

  event.locals.supabase = supabase;
```

`[VERIFIED: apps/frontend/src/hooks.server.ts:17-20]` — quoted verbatim.

and typed globally at:

```ts
// apps/frontend/src/app.d.ts:11-12
    interface Locals {
      supabase: SupabaseClient<Database>;
```

`[VERIFIED: apps/frontend/src/app.d.ts:11-12]` — quoted verbatim.

**So the guard needs three predicates, not one:**

| Predicate | Rule | Catches |
|-----------|------|---------|
| `^@supabase/` | `no-restricted-imports` → `patterns` | files 2, 4, 7 (the `EmailOtpType` / `SupabaseAdapterConfig` imports) |
| `^\$lib/(supabase\|api/adapters)(/\|$)` | `no-restricted-imports` → `patterns` | future direct-adapter imports; catches file 4's `$lib/api/adapters/supabase/supabaseAdapter.type` at `:19` |
| `MemberExpression[property.name='supabase']` | `no-restricted-syntax` | **all 13 calls in all 8 files** |
| `ObjectPattern > Property[key.name='supabase']` | `no-restricted-syntax` | the destructured form (`const { supabase } = locals`), which none of the 8 uses today but which is the obvious workaround |

`[VERIFIED — all four measured to fire; see F.4]`

**Two things the guard cannot reach, and should not pretend to:**
- `apps/frontend/src/app.d.ts:11-12` declares `locals.supabase` on the **global `App.Locals` interface**. That is a type declaration, not an import or a member access. It is *the* structural reason routes can reach Supabase without importing it, and removing it is Phase 158's job. **The guard should not target `app.d.ts`;** it should be in the allowlist or outside the glob.
- `apps/frontend/src/hooks.server.ts:7,17-20,24,29,36,55,83` imports `createSupabaseServerClient` and populates `locals`. `hooks.server.ts` is **not under `routes/`**, so it is outside criterion 6's stated scope ("routes, components and lib are clean") — but it *is* under `src/`. It must be in the allowlist explicitly, with a comment saying why, or the guard fails on a file that criterion 6 never asked about.

`[VERIFIED: hooks.server.ts — grep 'supabase|Supabase' shows :7,13,15,17,20,24,29,36,55,83]`

**Also in `lib/` and currently matching `grep -rl 'supabase' lib/`** (measured, 25 files): the 16 adapter files under `lib/api/adapters/supabase/`, plus `lib/api/adapters/apiRoute/apiRouteAdapter.ts`, `lib/api/{dataProvider,dataWriter,feedbackWriter}.ts` (one-line re-exports naming the adapter path), `lib/supabase/{browser,server}.ts` (the client factories), and `lib/api/utils/auth/providers/signicat.test.ts`. `[VERIFIED: grep -rl 'supabase' apps/frontend/src/lib | sort]` **`lib/components` and `lib/dynamic-components` return zero**, confirming fact 19's "0 components". `[VERIFIED]`

**Recommended allowlist composition (the `files` scope of the guard, stated as what is NOT guarded):**
```
apps/frontend/src/lib/api/adapters/**      # the adapter itself
apps/frontend/src/lib/supabase/**          # the client factories
apps/frontend/src/lib/api/{dataProvider,dataWriter,feedbackWriter}.ts   # the one-line selectors
apps/frontend/src/hooks.server.ts          # populates locals.supabase — Phase 158 owns this
apps/frontend/src/app.d.ts                 # declares App.Locals.supabase — Phase 158 owns this
```
Everything else under `src/` is guarded. That is an **explicit list of five entries**, satisfying criterion 6's "explicit rather than implied".

### F.4 The self-test precedent, and what an analogous adapter guard test must do

`apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` (189 lines) is the model. Its **mechanism** for proving the rule FIRES:

1. **Instantiate the real config** — `new ESLint({ flags: ['v10_config_lookup_from_file'] })` at `:60`. The header calls this "MANDATORY (invariant 2)" because it "loads the real `apps/frontend/eslint.config.mjs` and matches `apps/frontend/package.json`'s lint script exactly; omitting it risks config-resolution drift." `[VERIFIED: eslint-store-guard.test.ts:45-48,59-60]`
2. **Lint a virtual file** — `eslint.lintText(<source string>, { filePath })` where `filePath` is a **path that is never written to disk** but resolves under `apps/frontend/src` so the guard's `files` glob matches. `:62-68`, and `SRC = path.resolve(__dirname, '../..')` at `:68`. `[VERIFIED]`
3. **Assert on `ruleId`, never on `errorCount`** — invariant 3 at `:49-51`: "The violating fixture also trips an unrelated `import/newline-after-import` rule, so a count assertion would pass for the wrong reason." `[VERIFIED: eslint-store-guard.test.ts:49-51]`
4. **Disambiguate co-ruleId bans on the MESSAGE SUBSTRING, never on line or column** — invariant 4 at `:52-56`. `[VERIFIED]`
5. **Three assertions per probe**, not one: *fires* on the violation, *stays silent* on clean code (the negative control), and *parses without a fatal message* (guarding the negative control itself). `:114-129`, quoted in § Code Examples.
6. **Warm the instance in `beforeAll` with a 120s hook timeout** — `:105-109`. The header records the measurement that forced this: "the first `it` cost 651-1047ms when the file ran alone, and 5391ms inside the full 54-file frontend suite under concurrent load, failing with `Test timed out in 5000ms`." `[VERIFIED: eslint-store-guard.test.ts:98-109]` **A new guard test must do the same or it will be intermittently red**, which CLAUDE.md's cardinal rule forbids treating as flaky.
7. **A standing regression case for the flat-config REPLACE trap** — `:180-188`, asserting the inherited `TSEnumDeclaration` ban still fires. `[VERIFIED]`
8. **Do not quote the glob in the test.** `:66-67`: "The shipped glob is `src/**/*.{ts,js,mjs,cjs,svelte}` — recorded here for the reader, asserted nowhere: the config is the source of truth, and the probes below measure it." `[VERIFIED]`

**Specification for the analogous adapter-boundary guard test** (`apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts`):

| Axis | Values |
|------|--------|
| Guarded dirs (must fire) | `routes/candidate`, `routes/admin`, `routes/api`, `lib/components`, `lib/dynamic-components`, `lib/contexts` |
| Allowed loci (must stay silent) | `lib/api/adapters/supabase/dataProvider`, `lib/supabase` |
| Extensions | `.ts`, `.svelte` (and `.js` if the glob covers it, per the D-05 lesson at `:132-145`) |
| Violation fixtures | (i) `import type { EmailOtpType } from '@supabase/supabase-js';` (ii) `import { x } from '$lib/api/adapters/supabase/supabaseAdapter';` (iii) `await locals.supabase.auth.signOut();` (iv) `const { supabase } = locals;` |
| Clean fixture | `await dataWriter.logout();` — a call through the interface |
| Assertions per (dir × ext × fixture) | fires · silent-on-clean · no-fatal |
| Standing regressions | the inherited `TSEnumDeclaration` ban; the inherited deep-relative-`lib` `patterns` ban; the `svelte/store` `paths` and `ImportExpression` bans |
| Warm-up | `beforeAll` with `120_000` |

**Total ≈ 6 dirs × 2 ext × 4 fixtures × 3 assertions = 144, plus 2 allowed-locus silence probes × 4 fixtures, plus 4 standing regressions.** That is larger than the 30-case store guard. **Recommend trimming to 3 guarded dirs × 2 ext × 4 fixtures = 72** and stating the trim rationale, rather than shipping 150 assertions nobody reads.

### F.5 Measured selector behaviour (the probe)

Executed this session with a real `ESLint` instance and an inline override config (the repo config was **not** modified; a temporary `.probe-tmp.mjs` at the repo root was run and deleted):

**TypeScript, `filePath: apps/frontend/src/routes/probe.ts`, source:**
```ts
import { createClient } from '@supabase/ssr';
export async function POST({ locals }) {
  await locals.supabase.auth.signOut();
  const { supabase } = locals;
  return new Response();
}
```

| Selector | Result |
|----------|--------|
| `MemberExpression[property.name='supabase']` | `no-restricted-syntax@3:9` ✔ |
| `MemberExpression[object.name='locals'][property.name='supabase']` | `no-restricted-syntax@3:9` ✔ |
| `Property[key.name='supabase']` | `no-restricted-syntax@4:11` ✔ |
| `ObjectPattern > Property[key.name='supabase']` | `no-restricted-syntax@4:11` ✔ |

**Svelte, `filePath: apps/frontend/src/lib/components/Probe.svelte`, `svelte-eslint-parser` + `@typescript-eslint/parser`:**

| Rule | Result |
|------|--------|
| `no-restricted-imports` patterns `^@supabase/\|supabase` | `no-restricted-imports@2:3 '@supabase/ssr' import is restricted from being used by a pattern.` ✔ |
| `no-restricted-syntax` `MemberExpression[property.name='supabase']` on `data.supabase` | `no-restricted-syntax@3:13` ✔ |

`[VERIFIED: probe executed this session; no source file modified]`

**One caveat the planner must handle:** `MemberExpression[property.name='supabase']` fires on **any** `.supabase` access, including `this.supabase` inside the adapter itself (`supabaseAdapter.ts` and every provider/writer method). That is exactly why the member-expression rule needs a narrower `files` scope than the import rules. The allowlist in F.3 is that scope.

### F.6 The 8 route files — how hard is each to move behind the adapter?

Feeding the grandfather-vs-drive-to-zero recommendation. All eight are **server-side** and all need the **cookie-capable** server client, which is the constraint that makes this Phase 158's work rather than 157's.

| # | File | Uses Supabase for | Difficulty to move behind the adapter |
|---|------|-------------------|---------------------------------------|
| 1 | `routes/candidate/preregister/+layout.server.ts:9` | `locals.supabase.from('app_settings').select('settings').limit(1).maybeSingle()` | **EASY.** This is a plain data read that `SupabaseDataProvider._getAppSettings` already implements (`:47-77`). Replace with `dataProvider.getAppSettings()` configured with `serverClient: locals.supabase` — the pattern file 4 already uses at `:74`. **157 could do this one.** |
| 2 | `routes/candidate/auth/callback/+server.ts:27,37` | `auth.verifyOtp({ token_hash, type })` then `auth.getUser()` | **MEDIUM.** Needs new adapter methods (`verifyOtp`, `getSessionUser`) that do not exist on `DataWriter` today. |
| 3 | `routes/candidate/auth/logout/+server.ts:14` | `auth.signOut({ scope: 'local' })` | **EASY.** `SupabaseDataWriter._logout` already does exactly this (`:44-57`) — but note `_logout` itself `fetch`es *this route*, so moving it creates a cycle Phase 158 must break. |
| 4 | `routes/candidate/(protected)/+layout.server.ts:32,74,94` | Builds `SupabaseAdapterConfig` with `serverClient: locals.supabase` twice; one `auth` call at `:94` | **HARD-ish.** `:32`/`:74` are the *correct* pattern (adapter configured with the server client) and arguably should be **allowlisted permanently** rather than removed — something must hand the cookie client to the adapter. Only `:94` is true leakage. |
| 5 | `routes/candidate/login/+page.server.ts:25,44` | `auth.signInWithPassword` + `auth.signOut` + inline JWT role decode at `:41` | **HARD.** This is the heart of Phase 158 criterion 1 (three login paths → one). The role decode duplicates `supabaseDataWriter._getBasicUserData:174-184`. |
| 6 | `routes/admin/login/+page.server.ts:27,46` | identical to #5 | **HARD.** Same, and the existing todo records that this file *is* the fix for a cookie bug — see below. |
| 7 | `routes/api/candidate/preregister/+server.ts:16,32` | `functions.invoke('identity-callback')` + `auth.verifyOtp` | **MEDIUM.** `SupabaseDataWriter._preregister` already invokes an Edge Function (`invite-candidate`, `:135`), so the pattern exists. |
| 8 | `routes/api/auth/logout/+server.ts:10` | `auth.signOut()` | **EASY.** Same as #3. |

`[VERIFIED: per-file grep and read on each of the eight]`

**Score: 3 easy, 2 medium, 3 hard-or-permanent.** Driving to zero inside 157 means doing Phase 158's login collapse.

### F.7 RECOMMENDED ANSWER to CONTEXT open question 3 — allowlist composition

**Ship an 8-entry allowlist that Phase 158 shrinks, with the allowlist annotated per-entry with its 158 disposition, and with the guard's negative control proving it fails on a 9th.**

Four reasons, in order of weight:

1. **Phase 158 explicitly declares a dependency on 157 for exactly this refactor.** `.planning/ROADMAP.md` Phase 158: *"**Depends on**: Phase 157 (the adapter boundary must exist before routes can stop reaching through it)"*. `[VERIFIED: .planning/ROADMAP.md — Phase 158 Depends-on line]` Doing 158's work in 157 makes 158 depend on a phase that already did it, which is the same false-premise class this milestone's correction passes have been removing.
2. **The work is already scoped and filed as a todo, with a wider file list than 157's eight.** `.planning/todos/pending/2026-06-05-migrate-supabase-auth-code-from-routes-to-adapters.md` (`priority: high`, `area: frontend`) lists **13 files including `hooks.server.ts`** and specifies four solution steps. `[VERIFIED: .planning/todos/pending/2026-06-05-migrate-supabase-auth-code-from-routes-to-adapters.md:1-21]` Its § Problem records a **live production incident**: *"it inits the dataWriter with a *plain* Supabase client (no `serverClient`), so `signInWithPassword` there does NOT write the session cookie onto the response. This silently broke **admin login**"* (`:37-41`). `[VERIFIED — quoted verbatim]` Redoing that migration inside a phase whose six criteria are about typing and validation risks reintroducing it.
3. **Three of the eight should arguably never be removed.** File 4's `:32`/`:74` hand the cookie-capable client to the adapter; that hand-off has to happen *somewhere* outside the adapter, and `+layout.server.ts` is where SvelteKit puts it. A "drive to zero" target that includes them is unachievable rather than merely expensive.
4. **An 8-entry annotated allowlist is strictly more useful to 158 than an empty one.** It is a machine-checked, per-file inventory of exactly what 158 must remove, and the guard turns each removal into a one-line allowlist deletion with a test that proves the site is gone.

**Concrete shape:** each allowlist entry carries a one-line comment naming its disposition (`# 158: collapse into shared login`, `# permanent: hands the cookie client to the adapter`, `# 157 could remove — plain app_settings read`). **And take file 1 (`preregister/+layout.server.ts`) inside 157** — it is a plain `app_settings` read the provider already implements, it needs no new adapter method, and shrinking 8→7 demonstrates the allowlist is a live target rather than a permanent amnesty. That gives criterion 6 an honest "routes are clean except for an explicit, annotated, shrinking list".

### F.8 The negative control

`.planning/phases/143-svelte-store-guard-app-wide-reach-fallout-triage/143-NEGATIVE-CONTROL-LEDGER.md` is the template. Its binding sentences, quoted:

> **prove the guard fails before claiming it guards** — negative control run twice, once against the old assertion to demonstrate blindness, once against the new one to demonstrate the catch.

`[VERIFIED: 143-NEGATIVE-CONTROL-LEDGER.md — quoting `REQUIREMENTS.md:7-13` in its "Why this ledger exists" section]`

> **The word for a borrowed observation is not a legal value in any cell of this register** — see § Measurement, never citation. Every row carries its own log path and the HEAD its own half was taken at.

`[VERIFIED: 143-NEGATIVE-CONTROL-LEDGER.md — the "Baseline for OLD halves" bullet]`

**The ledger's measured header fields**, which a 157 ledger must mirror: phase, requirement, opened-by plan, corpus (row count with a decomposition), protocol source, baseline provenance, HEAD at ledger creation, machine (OS/Node), resolved `$TMPDIR`, **restoration target as a `git hash-object` blob hash** (pre-change and post-change), pre-existing-warning baseline, decisions discharged, precedent chain. `[VERIFIED: 143-NEGATIVE-CONTROL-LEDGER.md:15-58]`

**What a negative control for THIS guard looks like — a 9th site:**

| Row | Half | Action | Expected |
|-----|------|--------|----------|
| A-OLD | blind | Add a 9th leak — `const { data } = await locals.supabase.from('elections').select('id');` — to a **guarded** route file, with the guard **not yet installed**. Run `yarn lint:check`. | **0 errors.** Proves the tree is currently blind. |
| A-NEW | catch | Same injected line, guard **installed**. Run `yarn lint:check`. | **≥1 `no-restricted-syntax` error at that line.** |
| B-OLD/NEW | blind/catch | Same pair, but the injection is `import { createBrowserClient } from '@supabase/ssr';` in a **component** (`lib/components/`) — the 0-hit locus | 0 errors → ≥1 `no-restricted-imports` error |
| C | must-NOT-fire | The **allowed** locus: `this.supabase.from('elections')` inside `lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`, unmodified. | **0 errors.** Proves the allowlist works and the guard is discriminating, not constant. |
| D | restore | Revert every injection; assert `git hash-object` on each touched file returns its recorded pre-injection blob. | byte-identical |
| E | vitest pair | The self-test with the guard removed → **red**; with the guard installed → **green**. | proves the test measures the guard |

Row C is the one the store-guard ledger's analogue did not need and this one does: the adapter *must* keep using Supabase, so a guard that fires there is broken, and "0 errors in the adapter" is a positive result that must be recorded rather than assumed.

---

## § G — The structured logger in app-shared (D-F5 / criterion 6 second half / REVIEW-ADP-06)

### G.1 What the current logger does

Quoted in full in § Code Examples. Behaviourally:

- **Gate:** `import.meta.env.DEV || constants.PUBLIC_DEBUG`. Two sources, OR-ed.
- **Sink:** `console.error(message, error)` when a second argument is truthy; otherwise `console.info(message)`.
- **Shape:** none. `message: unknown`, `error: unknown = null`.
- **Levels:** two, implicit, chosen by argument arity rather than by the caller.

`constants.PUBLIC_DEBUG` resolves as:

```ts
// apps/frontend/src/lib/utils/constants.ts:1,11
import { env } from '$env/dynamic/public';
...
  PUBLIC_DEBUG: env.PUBLIC_DEBUG?.toLowerCase() === 'true',
```

`[VERIFIED: apps/frontend/src/lib/utils/constants.ts:1,11]` — quoted verbatim. `$env/dynamic/public` is a **SvelteKit virtual module**; `import.meta.env.DEV` is a **Vite compile-time constant**. Neither exists in `packages/app-shared`.

### G.2 What app-shared can actually see

Measured: `packages/app-shared/src/` contains **19 files** and reads **no environment at all** — no `process.env`, no `import.meta.env`, no `$env`. `staticSettings.ts` is a plain exported object literal; `dynamicSettings.ts` likewise. `[VERIFIED: find packages/app-shared/src -type f — the 19 files listed; none of the settings modules imports an env source]`

Its build is ESM-only:

```ts
// packages/app-shared/tsup.config.ts:1-9
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true
});
```

`[VERIFIED: packages/app-shared/tsup.config.ts:1-9]` — quoted verbatim, all 9 lines. And the package's own description records the intent: `"…ESM-only — all current consumers are ESM (\`type: module\`)."` (`packages/app-shared/package.json:5`). `[VERIFIED]` **CONTEXT open question 4 is answered: no CJS build.**

Its six consumers: `apps/frontend`, `apps/docs`, `packages/llm`, `packages/argument-condensation`, `packages/dev-seed`, plus itself. `[VERIFIED: grep -rn '"@openvaa/app-shared"' --include=package.json]` These span **browser + SSR (frontend, docs)** and **plain Node CLI (dev-seed, llm)**. Any enablement mechanism must work in both.

### G.3 RECOMMENDED ANSWER to CONTEXT open question 5 — the enablement gate

**Recommendation: an explicit `configureLogger()` injection with a safe, silent default, plus an optional `process.env` probe as a Node-side convenience. Do NOT read env inside the package.**

```ts
// packages/app-shared/src/logging/logger.ts   (shape, not final text)
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LoggerConfig = {
  /** Minimum level emitted. Anything below is dropped. */
  level: LogLevel | 'silent';
  /** Where a record goes. Defaults to console. */
  sink?: (record: LogRecord) => void;
};

let config: LoggerConfig = { level: 'silent' };

export function configureLogger(next: Partial<LoggerConfig>): void { … }
```

**Why `silent` by default rather than `info`:** the current behaviour is "nothing in production". A shared package that defaults to emitting turns every unconfigured consumer (dev-seed, llm, argument-condensation, docs) into a noisy one on the day it is added. Defaulting to `silent` makes the migration behaviour-neutral by construction, and the frontend's one `configureLogger` call restores today's behaviour exactly.

**Where each consumer sets it:**

| Consumer | Where | Value |
|----------|-------|-------|
| Frontend — **browser** | `apps/frontend/src/hooks.client.ts` (or the root `+layout.ts`) | `configureLogger({ level: import.meta.env.DEV \|\| constants.PUBLIC_DEBUG ? 'debug' : 'silent' })` |
| Frontend — **SSR** | `apps/frontend/src/hooks.server.ts`, **before** `supabaseHandle` in the `sequence(...)` at `:83` | the same expression |
| dev-seed | `packages/dev-seed/src/cli/seed.ts` entry | from its existing CLI flags |
| llm / argument-condensation / docs | not configured → `silent` | no behaviour change |

**⚠ The SSR/browser split is the trap.** `import.meta.env.DEV` and `constants.PUBLIC_DEBUG` are read *once at module scope* in the current logger. A module-scope `let config` in an ESM package is **per-module-instance**, and SvelteKit runs server and client in separate module graphs — so the frontend needs **two** `configureLogger` calls, one per entry point, not one. `hooks.client.ts` may not exist today; the planner must check. `[ASSUMED — I verified `hooks.server.ts` exists and its `sequence` at :83; I did not check for `hooks.client.ts`.]`

**Rejected alternatives:**
- **A bare `process.env` probe.** `process` is undefined in the browser without a shim; `apps/frontend` builds for the browser. It would need a `typeof process !== 'undefined'` guard, and would then read a *server* variable in a package whose main consumer is client-side. It also cannot see `PUBLIC_DEBUG`, which SvelteKit exposes through `$env/dynamic/public`, not `process.env`, at runtime in the browser.
- **A `globalThis.__OPENVAA_LOG_LEVEL__` probe.** Works, needs no API, but is untyped, invisible to grep-by-import, and gives no place to hang a custom sink. Worse ergonomics for the same reach.
- **Level-based with no configuration at all** (always emit `error`, never emit `debug`). Simplest, but ~85 of the ~85 current call sites are debug-level, so this is equivalent to deleting them.

### G.4 What "pino/OTL-conformant" should mean here — and whether to add pino

**Do not add pino.** Measured: `grep -c 'pino' yarn.lock` → **0**; `grep -rn 'pino' --include=package.json .` → nothing outside `node_modules`. `[VERIFIED]` Pino is a Node-targeted logger (worker-thread transports, `process.stdout`, `sonic-boom`); putting it in `@openvaa/app-shared` puts it in the frontend's browser bundle, where `pino/browser` is a different, cut-down module and the transport story does not apply. The criterion says "pino/OTL-**conformant** output" — conformance is about the **record shape**, which a 40-line plain-object emitter produces at zero bundle cost and zero new dependency.

**The record shape.** Pino's base fields `[CITED: getpino.io/#/docs/api — level/time/msg/err are pino's default serialised keys]` intersected with OpenTelemetry log-record fields `[CITED: opentelemetry.io/docs/specs/otel/logs/data-model — Timestamp, SeverityNumber, SeverityText, Body, Attributes]`:

```ts
export type LogRecord = {
  /** Pino numeric level: 20 debug · 30 info · 40 warn · 50 error. Maps to OTel SeverityNumber. */
  level: 20 | 30 | 40 | 50;
  /** Pino `time`: epoch ms. OTel Timestamp. */
  time: number;
  /** Pino `msg`. OTel Body. */
  msg: string;
  /** OTel SeverityText: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'. */
  severityText: string;
  /** Pino `err` — serialised Error. Optional. */
  err?: { type: string; message: string; stack?: string };
  /** OTel Attributes / pino merge-object. Flat, string-keyed. */
  attributes?: Record<string, unknown>;
};
```

**Both citations are `[CITED]`, not `[VERIFIED]`** — the numeric level mapping and the OTel field names come from documentation, not from anything in this tree. The planner should treat the exact field set as Claude's-discretion (which the CONTEXT says it is) and the *principle* — a flat, serialisable object with a numeric level, a timestamp and a message — as the binding part.

**`err` serialisation matters more than the field names.** `console.error(message, error)` today prints an `Error` object; `JSON.stringify(new Error('x'))` is `{}`. A structured emitter that does not explicitly serialise `name`/`message`/`stack` loses every stack trace in the codebase. That is the one place a naive implementation is strictly worse than what it replaces.

### G.5 The codemod, characterised precisely

**Measured scope** (`grep -rn 'logDebugError' apps/frontend/src`):

| Metric | Count |
|--------|-------|
| Total matching lines | **140** |
| Files | **53** — 31 `.ts`, 22 `.svelte` |
| `import … logDebugError …` lines | **47** |
| Invocation + definition + comment lines | 93 |

`[VERIFIED: all four measured this session — `grep -rn … \| wc -l` = 140; `grep -rl … \| wc -l` = 53; extension split via `sed 's/.*\.//' \| sort \| uniq -c` = 22 svelte / 31 ts; `grep -rn "import.*logDebugError" \| wc -l` = 47]`

This **confirms the CONTEXT's amendment to fact 20 exactly** (47 imports + ~85 invocations + 8 mentions = 140 lines / 53 files) and confirms that "82" matches none of them.

**Argument shapes — the answer to "is it mechanical?"**

**It is 95% mechanical.** Measured by inspection of every invocation:

| Shape | Count | Example (file:line) | Codemod action |
|-------|-------|---------------------|----------------|
| Single interpolated template string | **~72** | `logDebugError(\`Error logging out: ${e?.message}\`);` (`authContext.svelte.ts:73`) | rename only |
| Single plain string literal | **~8** | `logDebugError('answerState.reset()');` (`answerState.svelte.ts:67`) | rename only |
| Multi-line single argument | **4** | `i18n/init.ts:37`, `results/[[electionTab]]/+layout.svelte:207`, `questions/+layout.svelte:119`, `api/cache/+server.ts:71` | rename only (the arg is still one expression) |
| **Two arguments `(message, error)`** | **3** | `persistedState.svelte.ts:157` — `logDebugError(\`Failed to parse ${key} from ${type}\`, e);` · `imputeParentAnswers.ts:138` · `candidate/(protected)/+layout.server.ts:48` | **reshape** → `log.error('…', { err: e })` or equivalent |
| **Object argument** | **1** | `trackingService.svelte.ts:197` — `logDebugError({ name, data: dataToSend });` | **reshape** → `log.debug('tracking event', { name, data: dataToSend })` |
| **Bare error object** | **1** | `logDebugError(e);` (one site, in the grep sample) | **reshape** → `log.error(String(e), { err: e })` |
| Inside a Svelte template expression | **1** | `{logDebugError('No analytics platform configured!')}` | rename only — but note it is inside `{}`, so a naive line-based `sed` that assumes a statement position will mangle it |

`[VERIFIED: `grep -rn "logDebugError(.*,.*)" apps/frontend/src` returns 5 lines, of which 2 are false positives (a comma inside a template literal at `answerState.svelte.ts:57`, and the object literal at `trackingService.svelte.ts:197`), leaving **3** true two-argument sites; `grep -rn "logDebugError($" apps/frontend/src` returns the 4 multi-line sites]`

**So the reshape surface is 5 call sites, not 85.** That is the single most useful number in this section: the codemod is a rename for 80 sites and a hand-edit for 5.

### G.6 Migration recipe

1. **Land the logger in app-shared first** (wave 0), exported from `src/index.ts`, with its own `logger.test.ts`. Build (`yarn build --filter=@openvaa/app-shared`).
2. **Choose the symbol name.** See G.7.
3. **Rewrite the 47 import lines.** These are the half of the diff the CONTEXT correctly warns about. They currently read `import { logDebugError } from '$lib/utils/logger';` — the new form is `import { log } from '@openvaa/app-shared';`. **`simple-import-sort/imports` is `'error'`** (`packages/shared-config/eslint.config.mjs:159-176`) and `@openvaa/app-shared` sorts into the `'^@?\\w'` group while `$lib/...` sorts into `'^'` — so **every rewritten import moves position in its file**. `[VERIFIED: packages/shared-config/eslint.config.mjs:159-176 — the groups array]` Run `yarn lint:fix` after the codemod rather than hand-sorting.
4. **Rename the 80 mechanical invocations.**
5. **Hand-edit the 5 reshape sites**, named individually in the plan.
6. **Fix the 8 comment/doc mentions** — and comply with § Project Constraints while doing so.
7. **Delete or shim `apps/frontend/src/lib/utils/logger.ts`.**
8. **Add the two `configureLogger` calls** (client + server entry points).

**Verification greps (exact, for the plan's verification block):**

```bash
# must return 0
grep -rn 'logDebugError' apps/frontend/src packages apps/docs | wc -l
# must return 0 — no orphaned import of the deleted module
grep -rn "from '\$lib/utils/logger'" apps/frontend/src | wc -l
# must return >= 53 — every previously-logging file now imports the new symbol
grep -rln '<newSymbol>' apps/frontend/src | wc -l
# behaviour parity: the gate is configured exactly twice
grep -rn 'configureLogger' apps/frontend/src | wc -l
```

**And the one that catches the real failure mode:** `yarn build && yarn test:unit` — because a missed import is a *runtime* `ReferenceError` in a `.svelte` file that neither `tsc` nor ESLint necessarily catches in a template expression.

### G.7 The name, and the shim

**Recommended symbol: a namespace object `log` with level methods** — `log.debug(msg, attrs?)`, `log.info`, `log.warn`, `log.error(msg, attrs?)` — plus `configureLogger`.

Reasoning:
- The criterion says "renamed **and** reworked into structured output". A one-to-one rename (`logDebugError` → `logDebug`) satisfies the rename and leaves the arity-chooses-level defect intact, which is half the criterion — the same half D-F5 rejected as option (c).
- `logDebugError` is a misnomer twice over: it is not debug-only (it fires on `PUBLIC_DEBUG` in production) and it is not error-only (its default path is `console.info`). A level-per-method API makes each of the 85 call sites *state* its level, which is the structural change.
- `log` collides with nothing measured. `[ASSUMED — I did not grep for an existing `log` identifier across 53 files. The planner must: `grep -rn '\blog\b' apps/frontend/src` in the 53 target files before committing to the name.]`

**Shim: NO.** Delete `apps/frontend/src/lib/utils/logger.ts`.

Reasoning: D-F5 rejected incremental migration explicitly ("guarantees the two-idiom state with no forcing function to finish"). A re-export shim *is* the forcing function's absence — it lets a later file import the old name and lint clean. The whole point of a single codemod is that the old import path stops resolving, so a missed site is a build error rather than a silent survival. **The 47-import rewrite is what makes the deletion safe**, and the verification grep above proves it. If the planner wants a safety net, make it a temporary shim that `throw`s at module scope during a single wave, then delete it — but a permanent re-export contradicts the decision.

---

## § H — Cross-cutting: sequencing, verification and orphans

### H.1 Build and test topology

**`packages/app-shared` is a built package with five downstream consumers.** `turbo.json`:

```json
    "build": { "dependsOn": ["^build"], "outputs": ["build/**", "dist/**"],
               "inputs": ["src/**", "tsconfig.json", "tsconfig.*.json", "tsup.config.ts", "package.json"] },
    "test:unit": { "dependsOn": ["build"], "cache": false },
    "typecheck": { "dependsOn": ["^build"], … }
```

`[VERIFIED: turbo.json:4-22]` — quoted verbatim.

So **any change to `packages/app-shared/src/**` invalidates the build of `apps/frontend`, `apps/docs`, `packages/llm`, `packages/argument-condensation` and `packages/dev-seed`**, and their `typecheck` and `test:unit` with it. Concretely: waves that touch app-shared force a full downstream rebuild; waves that touch only `apps/frontend/src` do not. **That is the argument for putting all three app-shared changes (zod schemas, `getLocalized`, logger) in ONE early wave** rather than spreading them across three.

`format`/`format:check` also pre-build app-shared: `"format:check": "turbo run build --filter=@openvaa/app-shared... && prettier --check . && …"`. `[VERIFIED: package.json]` So a broken app-shared build breaks formatting checks too.

**Test suites covering the touched surface:**

| Suite | Command | What it covers here |
|-------|---------|---------------------|
| Root unit | `yarn test:unit` → `yarn assert:unit-coverage && turbo run test:unit` | app-shared (`vitest run`), frontend (`vitest run`), dev-seed, supabase edge-fn helpers. **Includes the guard self-tests.** |
| Frontend unit | `yarn workspace @openvaa/frontend test:unit` | `supabaseDataWriter.test.ts` (26 authToken lines), `supabaseAdminWriter.test.ts` (6), `universalAdapter.test.ts` (4), the five util tests, `eslint-store-guard.test.ts` |
| app-shared unit | `yarn workspace @openvaa/app-shared test:unit` | the moved `getLocalized.test.ts`, the new zod tests, the new logger test |
| pgTAP | `cd apps/supabase && npx supabase test db` | the new `get_questions` tests. **Not in any aggregate command.** |
| SQL lint | `yarn db:lint:sql` | needs a live Postgres |
| Lint + typecheck | `yarn lint:check` | the new ESLint guard, plus `assert:i18n-catalog-namespaces` and `assert:a11y-scan-wiring` |
| E2E | `yarn test:e2e` | **the cardinal gate** |

`[VERIFIED: package.json root scripts; apps/supabase/package.json:12-15; apps/supabase/README.md:57-59]`

**⚠ `assert:unit-coverage` will fire if a new workspace file lands without a `test:unit` script.** app-shared already has one (`"test:unit": "vitest run"`, `package.json:9`), so adding files there is safe. `[VERIFIED: packages/app-shared/package.json:9]`

**Realistic verification sequence for the phase, given the E2E cardinal rule:**

```bash
# 0. clean slate — the DB must match the migrations this phase writes
yarn db:reset            # ensures Supabase up, then migrations + seed.sql
yarn db:lint:sql         # needs the live DB from step 0

# 1. the new SQL
cd apps/supabase && npx supabase test db   # pgTAP, 13 files after this phase
cd - && yarn db:types                      # regenerate packages/supabase-types

# 2. build + static gates
yarn build
yarn lint:check          # eslint (incl. the new guard) + typecheck + i18n + a11y-wiring
yarn format:check

# 3. unit
yarn test:unit           # incl. assert:unit-coverage, the guard self-tests, the zod tests

# 4. the cardinal gate — ONE fresh dev server on :5173, clean DB
yarn db:reset-with-data
yarn dev                 # in a separate terminal; strictPort will fail loudly on a stale server
yarn test:e2e            # full suite; no --grep, no retries-until-green
```

Steps 0-3 are per-wave; step 4 is the phase gate. **Per project memory, a stale dev server steals the port and a dirty DB produces false failures** — both are known false-red sources here.

### H.2 Phase 156 — actual state, and what happens if 157 runs first

**Measured state of the neighbourhood:**

| Phase | Artifacts present | State |
|-------|-------------------|-------|
| 151 | 19 PLANs + 19 SUMMARYs + ledgers | **EXECUTED** |
| 152 | 9 PLANs, CONTEXT, RESEARCH, PATTERNS, VALIDATION — **no SUMMARY** | **PLANNED, NOT EXECUTED** |
| 153 | 5 PLANs — no SUMMARY | PLANNED, NOT EXECUTED |
| 154 | 4 PLANs — no SUMMARY | PLANNED, NOT EXECUTED |
| 155 | CONTEXT + DISCUSSION-LOG only | **NOT PLANNED** |
| **156** | **CONTEXT + DISCUSSION-LOG only** | **NOT PLANNED, NOT EXECUTED** |
| 157 | CONTEXT + DISCUSSION-LOG | this phase |

`[VERIFIED: ls of each `.planning/phases/15*-*` directory, this session]`

**So 156 has not landed, and neither has 152.** 157 is being planned against a tree where none of its stated upstream work exists.

**Per-item blocking analysis:**

| What 157 consumes from 156 | 157 site | Blocked? |
|---|---|---|
| `party` → `organization` enum rename | `supabaseDataWriter.ts:180` (`r.role === 'candidate' \|\| r.role === 'party'`), `routes/candidate/login/+page.server.ts:41` | **NOT BLOCKING.** 157 touches neither line for its own criteria. If 156 lands first, both are 156's edits. If 157 lands first, nothing breaks. **Do not put these in a 157 task.** |
| `candidates.name` removal (`102-entities.sql:27`) | `supabaseDataProvider.ts:368-369` (`entityObj.name`/`entityObj.shortName`) | **PARTIALLY BLOCKING.** These are class-4 casts (Phase-164 nullability compensation), which 157 does not remove — but 157's zod work *does* touch the surrounding block (`:368-378`). A merge conflict, not a semantic block. Sequence 156 first if possible. |
| `503-entity-rpcs.sql:147` widened to organizations | `supabaseDataProvider.ts:259` (the only `get_nominations` call) | **CONFLICTING EDIT.** 157 also edits `503-entity-rpcs.sql` (the election-round parameter). Two phases editing one SQL file **and** its migration is the highest-risk coupling in this pair. |
| `merge_custom_data` rename-vs-generalise | `supabaseAdminWriter.ts:26`, `supabaseDataWriter.ts:388` | **NOT BLOCKING, and 157 can shrink it.** If 157's criterion-4 deletion of `_updateQuestion` lands first, only `supabaseAdminWriter.ts:26` survives for 156 to rename. |
| `303-column-grants.sql` grant removal | any write path touching `sort_order`/`created_at`/`updated_at` | **NOT BLOCKING** — 157 adds no write path. |

`[VERIFIED: all 157-side line numbers measured this session; the 156-side items are quoted from `157-CONTEXT.md:398-423`, which measured them]`

**Verdict: only ONE item is genuinely blocking — the shared `503-entity-rpcs.sql` edit.** Everything else is either independent or a merge-conflict risk.

**Recommendation:** if 156 has not landed when 157 is planned, **split 157's SQL wave into its own plan** and mark it "sequence after 156-XX (the 503 edit) or coordinate", so the rest of 157 (zod, `WithAuth`, `getLocalized`, `authConfig`, the guard, the logger — five of six criteria) can proceed unblocked. Criterion 3's `get_questions` is entirely new SQL in a **new** file and does not collide with 156 at all; only criterion 2's `get_nominations` edit does.

### H.3 The two orphan triage comments — RECOMMENDED ANSWER to CONTEXT open question 7

**Both should be IN-SCOPE small fixes in 157, not todos.** Reasoning per item:

#### (i) `apps/frontend/src/lib/api/README.md:10` — "Not accurate now with local disabled"

The line, verbatim:

> `- Supabase adapter for all data access (local adapter available for static data)`

`[VERIFIED: apps/frontend/src/lib/api/README.md:10]`

**Measured: the claim is half-true, and the half that is true is the surprising half.** A local adapter *does* still exist and *is* still wired — but on the **server** side, in a different directory:

```
apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts
apps/frontend/src/lib/server/api/adapters/local/feedbackWriter/localServerFeedbackWriter.ts
apps/frontend/src/lib/server/api/adapters/local/{localPaths.ts,localServerAdapter.ts}
```

selected at runtime by:

```ts
// apps/frontend/src/lib/server/api/dataProvider.ts:6-14
const { type } = staticSettings.dataAdapter;

switch (type) {
  case 'local':
    module = import('./adapters/local/dataProvider');
    break;
  default:
    module = Promise.resolve({});
}
```

`[VERIFIED: apps/frontend/src/lib/server/api/dataProvider.ts:6-14]` — quoted verbatim. And `apps/frontend/src/lib/api/adapters/` contains only `apiRoute/` and `supabase/` — **no local adapter on the client side.** `[VERIFIED: ls apps/frontend/src/lib/api/adapters/]`

So the README, which documents `lib/api/`, describes a local adapter that lives in `lib/server/api/`. **This is a one-line doc fix with a genuinely useful correction to make** (`the local adapter is server-side only, selected by staticSettings.dataAdapter.type`), it sits in the directory this phase is about, and filing it as a todo defers a 30-second edit. **Do it in 157.** Note that CLAUDE.md carries the same claim and is Phase 160's surface — **do not edit CLAUDE.md**; the existing todo `2026-08-28-claude-md-stale-factual-claims.md` is the place to append it, and appending to an existing todo is cheaper than a new one.

#### (ii) `adminWriter/supabaseAdminWriter.ts:80` — "Add typing for return results if possible"

The line, verbatim:

```ts
  }): Promise<{ type: 'success'; sent: number; failed: number; results: Array<unknown> }> {
```

`[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:80]`

**Measured: the Edge Function's actual return shape is known and typed on the other side of the boundary.** `apps/supabase/supabase/functions/send-email/index.ts` declares `const results: RecipientResult[] = [];` at `:235`, pushes `{ …, status: 'sent' }` at `:249-252` and `{ …, status: 'failed', … }` at `:259-264`, and returns `{ sent: sentCount, failed: failedCount, results }` at `:286-289` (plus a 500 branch at `:270-277` and a dry-run branch returning `results: dryResults` at `:201`). `[VERIFIED: apps/supabase/supabase/functions/send-email/index.ts:201,235-289]`

**This is the phase's theme in miniature** — an `Array<unknown>` at the Supabase boundary that could be validated into its type — and its data source is a `functions.invoke` whose `data` is currently consumed unvalidated at `:92-95` (`data.sent`, `data.failed`, `data.results` on an untyped `data`). **It is criterion 1's problem in a different method.** Fixing it means one more zod schema (`SendEmailResultSchema`) beside the other four, and it removes one more unvalidated boundary read. **Do it in 157**, as a small task in the zod wave.

**Caveat for both:** the CONTEXT is right that neither sits under a numbered criterion. The plan should list them under an explicit "in scope, not criterion-mandated" heading so a verifier does not mark the phase incomplete for the reverse reason.

### H.4 The D-N2 todo that must be FILED — CONTEXT open question 8

**Convention, measured from the two most recent well-formed todos:**

```yaml
---
created: "2026-08-28T00:00:00.000Z"
title: <sentence-case, no trailing period>
area: <docs|frontend|backend|...>
priority: <high|medium|low>          # present on most, absent on some
files:
  - <repo-relative path>
  - <repo-relative path>  # optional trailing comment after two spaces
source: <where it was surfaced>       # optional
resolves_phase: <N>                   # optional — the phase expected to close it
related_phase: <N>                    # optional
---

## Problem
…
## Solution
…
## Context   (or "## Why this is filed rather than fixed")
…
```

`[VERIFIED: .planning/todos/pending/2026-08-28-claude-md-stale-factual-claims.md:1-12 and .planning/todos/pending/2026-07-16-rpc-returns-table-nullability-audit.md:1-12 — both read in full this session]`

**Filename convention:** `YYYY-MM-DD-<kebab-slug>.md`, slug truncated (measured examples run 30-60 chars; `2026-05-16-extend-e2e-tests-to-cover-election-and-constituency-scoped-q.md` is truncated mid-word at ~62 chars, so truncation is mechanical rather than semantic). `[VERIFIED: ls .planning/todos/pending/]`

**Note four files break the convention** and should not be copied: `candidate-journey-135-intermittent.md`, `question-info-type-awareness-followups.md`, `getidtokenclaims-negative-tests.md`, `f19-class-adjacent-auth-sites.md` — all undated. `[VERIFIED: ls -t .planning/todos/pending/ | head -5]`

**Recommended filing for 157's D-N2 obligation:**

- **Filename:** `.planning/todos/pending/2026-08-28-reintroduce-the-local-data-adapter.md`
- **Frontmatter:** `created: "2026-08-28T00:00:00.000Z"`, `title: Reintroduce the local data adapter for static-data deployments`, `area: frontend`, `priority: medium`, `files:` — `apps/frontend/src/lib/api/dataProvider.ts`, `apps/frontend/src/lib/api/adapters/`, `apps/frontend/src/lib/server/api/adapters/local/`, `apps/frontend/src/lib/api/README.md`, `source: PR #869 review comment (kaljarv) on lib/api/dataProvider.ts; filed during Phase 157 per D-N2.`
- **Anchor the comment to the FILE, not the line.** The triage cites `dataProvider.ts:12`; measured, the file is **one line**:
  ```ts
  export { dataProvider } from './adapters/supabase/dataProvider';
  ```
  `[VERIFIED: apps/frontend/src/lib/api/dataProvider.ts:1 — the file is 1 line]` This confirms CONTEXT open question 8.
- **The Problem section must record the H.3(i) finding** — that a *server-side* local adapter still exists and is still selected by `staticSettings.dataAdapter.type === 'local'`, so "reintroduce" means "restore the **client-side** local adapter", not "build one from scratch". Without that, the next reader repeats the search.

---

## Project Constraints (from CLAUDE.md)

Actionable directives extracted from `./CLAUDE.md`, with their bearing on this phase. These carry the same authority as locked decisions.

| Directive | Bearing on 157 |
|-----------|----------------|
| **E2E Hard Rule — "Failing E2E tests are a CARDINAL FAILURE. No task may proceed, complete, or be marked done while any E2E test is failing."** | The phase gate. **No "known-flaky" exemptions.** A "did not run" test counts as a failure. Run the **whole** suite (`yarn test:e2e`), not a `--grep` subset. |
| **E2E preflight** — the served app must echo this working tree's path via `/@fs`; `FRONTEND_PORT` is the only escape hatch; `yarn dev` uses `strictPort` | A stale dev server on `:5173` fails the preflight loudly rather than producing a false red. One fresh dev server per E2E run. |
| **Use TypeScript strictly — avoid `any`, prefer explicit types** | Directly aligned with criterion 1. Note the guard/assert **scripts** are the documented exception (`scripts/assert-unit-test-coverage.mjs` explains why it is `.mjs`); a new `assert:adapter-casts` script may follow that precedent. |
| **Context Destructuring Rule (Svelte 5)** — `appSettings`, `dataRoot`, `locale`, `matches`, `opinionQuestions` etc. are reactive accessors and MUST be read via `ctx.X`, never destructured | **In play.** The logger codemod touches 22 `.svelte` files and 13 files under `lib/contexts`. A codemod that rewrites an import line cannot break this, but any hand-edit in a context consumer can. **The 5 reshape sites include `trackingService.svelte.ts:197` and `persistedState.svelte.ts:157`, both under `lib/contexts`.** |
| **`dataRoot` `#version`-bridge carve-out** — never bind `dataRoot` to an intermediate `$derived` alias; read `ctx.dataRoot.<prop>` directly inside the consuming tracking scope | Not touched by 157 as scoped. Flagged because criterion 1's changes flow into `DataRoot` via the provider. |
| **Svelte Warning-Accepted Format** — `// svelte-warning: accepted — <rationale>` immediately above the line | Use if the logger codemod or the settings-form edit provokes a compiler warning. Prefer fixing. |
| **Localization — all user-facing strings must support multiple locales** | Binding on the settings-form decision (§ D.5): option (a) touches 7 locale catalogs; option (b) touches none. |
| **Accessibility — WCAG 2.1 AA** | Binding on option (a): `candidate-a11y.spec.ts:322` anchors on the current-password field and must be re-anchored, not deleted. |
| **Never commit sensitive data** | The logger is a new egress path. **The record shape must not default to serialising arbitrary objects** — the 5 reshape sites pass caught exceptions and a tracking payload. |
| **Always check against `/.agents/code-review-checklist.md`** | Cited in CLAUDE.md twice. Not read this session. `[ASSUMED — its contents are unknown to me; the planner should read it before the code-review gate.]` |
| **Canonical package paradigm — new `packages/<name>/` follow `@openvaa/core`'s shape** | Not triggered: 157 adds no new workspace, only new modules inside the existing `packages/app-shared`. |
| ⚠ **CLAUDE.md's `db:lint:sql` "(sqlfluff + Splinter advisors)" claim is STALE** | Measured false (§ C.5). Already filed (`resolves_phase: 160`). **Do not write a verification step invoking sqlfluff.** |
| ⚠ **CLAUDE.md's `@openvaa/app-shared` "Builds to both ESM and CommonJS" claim is STALE** | Measured false (§ G.2). Already filed. **ESM only.** |
| ⚠ **CLAUDE.md's "local adapter available for static data" claim is HALF-stale** | Measured: a *server-side* local adapter exists and is wired; no client-side one does (§ H.3). Append to the existing todo; do not edit CLAUDE.md (Phase 160 owns it). |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `zod` v3: `.strict()`, `error.errors`, `z.record(valueType)`, `.merge()` | zod v4: `.strict()`/`z.strictObject` (per-object, does not descend), `error.issues`, `z.record(keyType, valueType)`, `.extend()` | this tree is on **4.3.6** | A planner writing v3 idioms produces code that does not compile or silently strips keys |
| `no-restricted-imports` as the sole boundary guard | paired `no-restricted-imports` + `no-restricted-syntax` | in-repo since Phase 143 (`apps/frontend/eslint.config.mjs:111-114`) | Import-only bans miss every runtime access; measured 5/8 miss rate here |
| Guard asserted by reading the config | Guard asserted by a vitest self-test that lints virtual files against the **real** config | Phase 124, extended Phase 143 | "prove the guard fails before claiming it guards" is a standing milestone rule |
| `updateUser({ password })` with no current-password check | `updateUser({ password, current_password })` gated by `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD` | present in the installed `@supabase/auth-js` 2.99.3 types; docs cite supabase-js **v2.102.0+** | The settings-form defect is fixable, not merely deletable — **subject to the § D.5 spike** |
| `apps/supabase/supabase/schema/` as the schema | `migrations/` as the applied source of truth; `schema/` a hand-maintained mirror | documented at `apps/supabase/README.md:8-27` | New SQL needs two edits in one commit |

**Deprecated / outdated:**
- `logDebugError`'s arity-chooses-level idiom — replaced by explicit level methods (§ G.7).
- `WithAuth` and `WithOptionalAuth` — the Supabase adapter authenticates from the session cookie and reads neither.
- The client-side election filter at `supabaseDataProvider.ts:521-535` — superseded by `get_questions`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `CREATE OR REPLACE FUNCTION` with a changed signature creates an overload rather than replacing, so the `get_nominations` migration must `DROP FUNCTION` first | § B.3 | Two overloads ship; PostgREST returns `PGRST203` ambiguity at runtime, after the migration passes review |
| A2 | The JSONB `@>` containment form is the right SQL for the `election_ids` array filter | § C.2 | Wrong filter semantics in `get_questions`; caught by pgTAP if the planner writes a case per branch |
| A3 | Two overlapping flat-config objects both matching a file: the LAST one's rule options win entirely (no merge) | § F.2 | A new guard block silently deletes an inherited ban and produces zero errors. **The planner must probe this**; it is a 5-minute `lintText` experiment |
| A4 | `apps/frontend/src/hooks.client.ts` exists (or an equivalent client entry point does) | § G.3 | The browser-side `configureLogger` call has no home; the logger stays silent in the browser and 22 `.svelte` files log nothing |
| A5 | The identifier `log` does not collide with an existing symbol in the 53 target files | § G.7 | Codemod produces shadowed bindings; caught by `tsc` but expensive to unwind mid-codemod |
| A6 | `electionRound` is not currently an adapter option anywhere in `apps/frontend/src` | § B.3 | A duplicate/conflicting option name |
| A7 | The Supabase CLI (pinned `^2.78.1`) exposes a `config.toml` key for the current-password gate | § D.5 | Option (b) becomes untestable locally and in E2E; fall back to option (a) |
| A8 | With the GoTrue gate **off**, a wrong `current_password` is ignored rather than rejected | § D.5 | Option (b) may already work without config; or may silently do nothing |
| A9 | `/.agents/code-review-checklist.md`'s contents impose no additional constraint on this phase | § Project Constraints | An unmet review requirement surfaces at the code-review gate |
| A10 | The `_updateQuestion` / `_insertJobResult` public wrappers have few enough callers to re-point cheaply | § D.4 | Criterion 4's second sentence is larger than budgeted |
| A11 | Pino's numeric levels (20/30/40/50) and OTel's `SeverityNumber`/`SeverityText`/`Body`/`Attributes` field names are as stated | § G.4 | Cosmetic only — the field set is Claude's discretion per the CONTEXT |

**Every A-item above is a planner-resolvable question, not a research gap.** A1, A3, A5 and A6 are single greps or single probes. A4 is an `ls`. A7 and A8 are the one real spike (§ D.5).

## Open Questions

1. **Does 157's `503-entity-rpcs.sql` edit collide with 156's?** Both phases edit that file and its migration; 156 is not yet planned. **Recommendation:** split 157's `get_nominations` election-round change into its own plan and sequence it explicitly, so the other five criteria proceed unblocked (§ H.2).
2. **One scoped ESLint block or two?** Extending the existing `:89-133` block avoids the REPLACE trap for the import bans, but its `src/**` glob would make the member-expression rule fire inside the adapter. A second, narrower block is needed — and A3 must be probed first (§ F.2).
3. **Does the settings-form spike pass?** § D.5's three checks decide between option (b) (recommended) and option (a) (fallback). **This must be resolved before the criterion-4 wave is planned in detail**, because the two options touch disjoint file sets.
4. **How many callers do `updateQuestion` / `insertJobResult` have?** (A10.) One grep; determines whether criterion 4's second sentence is a 30-minute task or a half-day.
5. **Should `supabaseDataWriter.ts:223,374`'s triple casts be in scope?** The criterion names only the provider; the smell is identical. **Recommendation: yes** — two extra sites, and criterion 1's "we need these smelly typecasts nowhere" (the reviewer's words at `:511`) reads as repo-wide within the adapter.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | everything | ✓ | v24.14.1 (recorded in `143-NEGATIVE-CONTROL-LEDGER.md`; the machine is unchanged) | — |
| Yarn 4 | workspaces, catalog | ✓ | 4.13.0 (`.yarnrc.yml:3` — `yarnPath: .yarn/releases/yarn-4.13.0.cjs`) | — |
| `zod` | criterion 1 | ✓ | 4.3.6 resolved | — |
| `eslint` + `@typescript-eslint/parser` + `svelte-eslint-parser` | criterion 6 guard + self-test | ✓ | verified by executing a probe this session | — |
| `vitest` | all unit tests | ✓ | catalog `^3.2.4` | — |
| **Docker + Supabase CLI** | criteria 2 & 3 (migrations, pgTAP, `db:lint:sql`, `db:types`) | **NOT PROBED this session** — the constraints forbade running migrations | pinned `supabase: ^2.78.1` | **None.** The SQL wave cannot be verified without a running local stack. |
| Playwright browsers | the E2E cardinal gate | **NOT PROBED** | `@playwright/test` catalog `^1.58.2` | `yarn playwright install` |
| Disk space | E2E run artifacts | **KNOWN RISK** | — | Per project memory, ENOSPC has voided full-suite runs in this worktree; `tests/e2e-runs/` is cited by registers and must not be deleted |

`[VERIFIED: .yarnrc.yml:3; zod and eslint measured by execution]` `[ASSUMED: Docker/Supabase/Playwright availability — deliberately not probed, per the phase's read-only constraint]`

**Blocking with no fallback:** the local Supabase stack, for criteria 2 and 3 only. The planner should make `yarn db:start` an explicit precondition of the SQL wave rather than an assumed one.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit framework | **vitest** (catalog `^3.2.4`) |
| Frontend config | `apps/frontend/vitest.config.ts` — jsdom, `globals: true`, with `$lib`/`$types`/`$voter`/`$candidate` aliases and mocks for `$env/dynamic/public`, `$app/{environment,paths,state,navigation}` |
| app-shared config | `packages/app-shared/vitest.config.ts` — intentionally `export default {}`; discovery only, via `vitest.workspace.ts:1` |
| DB framework | **pgTAP**, files under `apps/supabase/supabase/tests/database/` |
| E2E framework | **Playwright**, `tests/playwright.config.ts` |
| Quick run (per task) | `yarn workspace @openvaa/app-shared test:unit` or `yarn workspace @openvaa/frontend test:unit` |
| Full suite | `yarn test:unit && yarn lint:check` then `cd apps/supabase && npx supabase test db` then `yarn test:e2e` |

`[VERIFIED: apps/frontend/vitest.config.ts:1-56; packages/app-shared/vitest.config.ts:1-5; vitest.workspace.ts:1; package.json root scripts; apps/supabase/README.md:57-59]`

**⚠ Note for the frontend alias list:** `apps/frontend/vitest.config.ts:30-33` mocks `$env/dynamic/public`. The **current** logger reads `constants` which reads that module. If the new logger reads nothing (per § G.3's `configureLogger` recommendation), the moved tests need no env mock at all — a small simplification, and a reason to prefer injection over any env probe.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REVIEW-ADP-01 | Each stored JSONB shape parses; a `{}` input parses; an unknown key at EACH nesting level is rejected | unit | `yarn workspace @openvaa/app-shared test:unit` | ❌ Wave 0 — `packages/app-shared/src/data/schemas/*.test.ts` |
| REVIEW-ADP-01 | The provider degrades (returns the smart default) rather than throwing on a malformed row | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ Wave 0 — extend `supabaseDataProvider.test.ts` (**exists**) |
| REVIEW-ADP-01 | Zero `as Json as unknown as` in `lib/api/adapters/supabase/**` | **grep-guard** | `yarn assert:adapter-casts` (new, wired into `lint:check`) | ❌ Wave 0 — `scripts/assert-adapter-casts.mjs` |
| REVIEW-ADP-02 | `convertFilterValue`: scalar → `[v]`, array → array, `undefined` → `[null]` | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ Wave 0 — `adapters/supabase/utils/convertFilterValue.test.ts` |
| REVIEW-ADP-02 | `get_nominations` with `p_election_round` returns only matching rows; NULL returns all | **pgTAP** | `cd apps/supabase && npx supabase test db` | ❌ Wave 0 — **no `get_nominations` pgTAP exists at all** |
| REVIEW-ADP-03 | `get_questions` returns categories **and** questions in one call | pgTAP | same | ❌ Wave 0 — `tests/database/11-question-rpcs.test.sql` |
| REVIEW-ADP-03 | Filter branches: NULL param → all; NULL/empty column → included; non-matching → excluded — × 3 axes | pgTAP | same | ❌ Wave 0 |
| REVIEW-ADP-03 | The RPC is `SECURITY INVOKER` (`prosecdef` false) and granted to `anon, authenticated` | pgTAP | same | ❌ Wave 0 — copy the shape from `07-rpc-security.test.sql:33-47` |
| REVIEW-ADP-03 | The adapter's question read produces the same `{categories, questions}` shape as before | unit | frontend `test:unit` | ✅ extend `supabaseDataProvider.test.ts` |
| REVIEW-ADP-03 | End-to-end: voter question flow still renders | **E2E** | `yarn test:e2e` | ✅ existing voter journey specs |
| REVIEW-ADP-04 | `grep -rin 'withauth'` → 0 **and** `grep -rn 'WithOptionalAuth'` → 0 | grep-guard or manual | part of the phase VERIFICATION | ❌ Wave 0 (or a one-time recorded check) |
| REVIEW-ADP-04 | `setPassword` forwards / does not forward the current password (per the § D.5 branch) | unit | frontend `test:unit` | ✅ `supabaseDataWriter.test.ts:173-195` exists — **inverts** |
| REVIEW-ADP-04 | Candidate can still change their password | **E2E** | `yarn test:e2e` | ✅ existing candidate journey; a11y spec anchor at `candidate-a11y.spec.ts:322` |
| REVIEW-ADP-05 | `getLocalized`'s 3-tier fallback, from its new home | unit | `yarn workspace @openvaa/app-shared test:unit` | ✅ **moves** — `getLocalized.test.ts`, 9 cases |
| REVIEW-ADP-05 | Both providers still resolve their own claim config after the split | unit | frontend `test:unit` | ✅ `signicat.test.ts:152-153`, `idura.test.ts:149-150` |
| REVIEW-ADP-06 | The guard FIRES on an import and on a member access, in `.ts` and `.svelte`, in each guarded dir | unit (ESLint-in-vitest) | frontend `test:unit` | ❌ Wave 0 — `lib/_guards/eslint-adapter-boundary-guard.test.ts` |
| REVIEW-ADP-06 | The guard is SILENT in the allowed loci (adapter, `lib/supabase`) | unit | same | ❌ Wave 0 |
| REVIEW-ADP-06 | The inherited bans survive (flat-config REPLACE regression) | unit | same | ❌ Wave 0 |
| REVIEW-ADP-06 | The guard fails on a 9th site, and was blind before | **negative control** | recorded in a ledger | ❌ Wave 0 — `157-NEGATIVE-CONTROL-LEDGER.md` |
| REVIEW-ADP-06 | The logger emits a conformant record at/above level and drops below it; `err` serialises `name`/`message`/`stack` | unit | app-shared `test:unit` | ❌ Wave 0 — `packages/app-shared/src/logging/logger.test.ts` |
| REVIEW-ADP-06 | `grep -rn 'logDebugError'` → 0 across `apps/` and `packages/` | grep | phase VERIFICATION | ❌ one-time |

### Sampling Rate

- **Per task commit:** the owning workspace's `test:unit` (≤ 30s) + `yarn lint:check` if the task touched config or comments.
- **Per wave merge:** `yarn build && yarn test:unit && yarn lint:check`. For the SQL wave, additionally `npx supabase test db` and `yarn db:lint:sql` against a freshly reset DB.
- **Phase gate:** full suite green, then `yarn db:reset-with-data` → one fresh `yarn dev` → **full `yarn test:e2e`** before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `packages/app-shared/src/data/schemas/*.test.ts` — REVIEW-ADP-01, one file per column, ≥1 rejection case per nesting level
- [ ] `scripts/assert-adapter-casts.mjs` + a `lint:check` chain-membership assertion — REVIEW-ADP-01
- [ ] `apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.test.ts` — REVIEW-ADP-02
- [ ] `apps/supabase/supabase/tests/database/11-question-rpcs.test.sql` — REVIEW-ADP-02 & 03. **This file must also carry the first-ever `get_nominations` result-shape coverage**, since none exists.
- [ ] `apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts` — REVIEW-ADP-06, with the `beforeAll` warm-up at `120_000`
- [ ] `.planning/phases/157-adapter-boundary-typing/157-NEGATIVE-CONTROL-LEDGER.md` — REVIEW-ADP-06, rows created **before** the first injection (the 143 rule)
- [ ] `packages/app-shared/src/logging/logger.test.ts` — REVIEW-ADP-06
- [ ] Framework install: **none required.** vitest, ESLint, parsers, zod and pgTAP are all present.

## Security Domain

`security_enforcement` is not set in `.planning/config.json`, so it is enabled by default.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | **YES** | The `WithAuth` removal and the password-change decision sit on the auth path. Control: Supabase GoTrue session cookies (existing); `current_password` verification if § D.5 option (b) is taken. |
| V3 Session Management | **YES, indirectly** | The 8 leaking route files all manipulate sessions. 157 guards them; 158 moves them. Control: `@supabase/ssr` `createServerClient` with cookie handlers (`lib/supabase/server.ts:10-21`). |
| V4 Access Control | **YES** | The new `get_questions` RPC. Control: **`SECURITY INVOKER`** so RLS applies to the caller — the universal house style in `50*` (§ C.3). |
| V5 Input Validation | **YES — this is the phase's core** | zod 4.3.6 at the adapter edge. The data is *untrusted JSONB* even though it comes from our own database: an admin-authored `custom_data` blob reaches `NumberQuestion.min/max` and the provider already guards against exactly this (`supabaseDataProvider.ts:583-586`: "non-numeric JSONB values are dropped rather than coerced (untrusted-JSONB tampering guard T-129-02)"). `[VERIFIED — quoted verbatim]` |
| V6 Cryptography | **NO new surface** | The OIDC providers do JWE/JWS via `jose` (`idura.ts:13`); 157 only *moves* the claim-mapping constants and does not touch key handling. **Do not let the `authConfig` split reorganise `decryptAndVerifyIdToken.ts`.** |
| V7 Error Handling & Logging | **YES** | The new structured logger is a new egress path. |
| V8 Data Protection | **YES** | Same. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed / tampered JSONB reaching domain constructors | Tampering | zod `safeParse` at the edge, degrade to smart defaults. **Precedent in-tree: the T-129-02 guard at `supabaseDataProvider.ts:583-586`.** |
| Credential logged in a structured record | Information Disclosure | The 5 reshape sites pass caught exceptions and a tracking payload. **The logger must not deep-serialise arbitrary objects by default**, and `attributes` should be explicitly constructed at each site rather than spread. `settings/+page.svelte:53` currently logs `\`Error with register: ${e?.message}\`` from the **password form** — an interpolated message, not the object, which is the safe form and must stay safe. `[VERIFIED: settings/+page.svelte:53]` |
| Password change without proof of possession | Spoofing / Elevation | § D.5. Today: **none** — `canSubmit` does not require the field and Supabase discards it. This is a real finding, not a hypothetical. |
| New RPC exposed too widely | Elevation of Privilege | `SECURITY INVOKER` + a narrow `GRANT`. Assert `prosecdef` is false in pgTAP, per `07-rpc-security.test.sql:33-47`. |
| SQL injection via RPC parameters | Tampering | Typed parameters (`uuid`, `integer`) — not string-concatenated. The house style already does this. |
| Guard that lints clean by accident | Repudiation (of a security control) | The negative control (§ F.8). A guard nobody proved is a guard nobody has. |
| Boundary type-lie propagating past `parse()` | Tampering | `RETURNS jsonb` for `get_questions` + zod on the way in, rather than a `RETURNS TABLE` whose generated nullability is known to lie (Phase 164). |

**One security finding this research surfaced that no criterion names:** the candidate password-change form tells users in all seven locales that their current password was checked, and it was not (§ D.5). Whichever option is chosen, **the `error.changePassword` string must stop making a claim the system does not enforce.** Under option (a) it must be rewritten; under option (b) it becomes true.

## Sources

### Primary (HIGH confidence)

All in-tree, read this session at HEAD `db220cb5f`:

- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (616 lines, read in full)
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (424 lines, `:1-140`, `:170-200`, `:370-424`)
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts` (`:15-96`)
- `apps/frontend/src/lib/api/base/{dataWriter.type.ts,universalDataWriter.ts,universalAdapter.ts,universalAdapter.type.ts,getDataOptions.type.ts,getDataFilters.type.ts}`
- `apps/frontend/src/lib/api/adapters/supabase/utils/{getLocalized,getLocalized.test,localizeRow,mapRow,storageUrl,toDataObject}.ts` (all six, in full)
- `apps/frontend/src/lib/api/utils/auth/providers/{authConfig.ts,index.ts,idura.ts,signicat.ts}`
- `apps/frontend/src/lib/utils/{logger.ts,constants.ts}` (both in full)
- `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte` (157 lines, in full)
- `apps/frontend/src/{app.d.ts,hooks.server.ts}` and all 8 leaking route files
- `apps/frontend/eslint.config.mjs` (134 lines, in full) · `packages/shared-config/eslint.config.mjs:75-180`
- `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` (189 lines, in full)
- `apps/frontend/vitest.config.ts` · `vitest.workspace.ts` · `turbo.json` · root `package.json`
- `packages/app-shared/{package.json,tsup.config.ts,tsconfig.json,vitest.config.ts,src/index.ts,src/data/localized.type.ts}`
- `packages/dev-seed/{package.json,src/template/schema.ts,tests/template.test.ts}`
- `apps/supabase/{package.json,README.md,supabase/schema/{103-questions,104-nominations,106-app-settings,503-entity-rpcs,504-admin-rpcs}.sql,supabase/tests/database/07-rpc-security.test.sql,supabase/config.toml}`
- `node_modules/@supabase/auth-js/dist/module/lib/types.d.ts:365-400` (the installed package)
- `.yarnrc.yml` · `yarn.lock:11672-11675`
- `.planning/{REQUIREMENTS.md:125-145,ROADMAP.md § 157/158,PRE-SHIP-REVIEW-TRIAGE.md:210-244}`
- `.planning/phases/{143-…/143-NEGATIVE-CONTROL-LEDGER.md,152-…/152-CONTEXT.md,157-…/157-CONTEXT.md}`
- `.planning/todos/pending/{2026-06-05-migrate-supabase-auth-code-from-routes-to-adapters.md,2026-07-16-rpc-returns-table-nullability-audit.md,2026-08-28-claude-md-stale-factual-claims.md}`
- **One executed measurement:** an ESLint `lintText` probe (§ F.5), run from the repo root via a temporary file that was deleted; no source file was modified.

### Secondary (MEDIUM confidence)

- `supabase.com/docs/guides/auth/passwords` — the `current_password` parameter and its intent. Cross-checked against the installed `.d.ts`, which is why the *existence* of the parameter is `[VERIFIED]` while the version floor and the server-side gate are `[CITED]`/`[ASSUMED]`.
- `supabase.com/docs/reference/javascript/auth-updateuser` — consulted; **did not** answer the current-password question (it documents only the `nonce` form). Recorded so the planner does not repeat the lookup.

### Tertiary (LOW confidence)

- Pino default field names and numeric level values; OpenTelemetry log-record field names (§ G.4). From training knowledge, not verified this session. **The CONTEXT makes the exact field set Claude's discretion, so nothing load-bearing rests on these.**

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|------|-------|--------|
| Cast inventory & JSONB shapes (§ A) | **HIGH** | All 64 casts enumerated; every target type located and its declaration read |
| Filter helper & election round (§ B) | **HIGH** | Both the TS and all 12 SQL occurrences measured; only the `DROP FUNCTION` overload point is assumed |
| `get_questions` (§ C) | **HIGH** for the current assembly, the available filter columns and the house style; **MEDIUM** for the recommended `RETURNS jsonb` shape (a design judgement) and the `@>` predicate (assumed) |
| `WithAuth` removal (§ D) | **HIGH** — all 41 refs and the full five-class `authToken` reach enumerated; the CONTEXT's list corrected in three places |
| Settings-form product decision (§ D.5) | **HIGH** on the defect (six sites read, `canSubmit` measured, seven locale strings measured); **MEDIUM** on the fix (the type exists in the installed package; the server-side gate is unverified — hence the spike) |
| `getLocalized` / `authConfig` (§ E) | **HIGH** — every file and every consumer read; zero cross-provider imports measured |
| ESLint guard (§ F) | **HIGH** — the central claim (`no-restricted-imports` misses the leakage) is proven by execution, not argued; the two-overlapping-blocks question (A3) is the one open item |
| Logger (§ G) | **HIGH** on scope (140/53/47 all re-measured; the 5-reshape-site finding is the actionable one) and on what app-shared can see; **LOW** on the exact pino/OTel field names, which are discretionary |
| Sequencing (§ H) | **HIGH** — phase states measured from artifact presence; turbo topology quoted |

**Research date:** 2026-08-28
**Valid until:** ~2026-09-27 for the in-tree facts (30 days; but **any line number is invalidated by Phase 152's comment sweep**, which rewrites 817 comment lines across `apps/` and will shift line numbers in nearly every file cited here). **Cite rule keys, symbol names and function names rather than line numbers wherever the plan can.** The `eslint-store-guard.test.ts:29-33` header states this rule for exactly this reason:

> Stable anchor, deliberately NOT a line citation: the guard lives in
> `apps/frontend/eslint.config.mjs`, in the block whose `rules` object holds
> `no-restricted-imports` … Line ranges move on every edit — rule keys do not.

`[VERIFIED: apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:29-33]` — quoted verbatim.





