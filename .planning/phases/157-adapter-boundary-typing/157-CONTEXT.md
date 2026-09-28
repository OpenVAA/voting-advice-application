# Phase 157: Adapter Boundary & Typing - Context

**Gathered:** 2026-08-28
**Status:** Ready for planning
**Derived from:** `.planning/v2.15-DISCUSSION-POINTS.md` — § F (F1–F5), § 0 facts **18, 19, 20**, § N (N1–N3)
**Measurement HEAD:** re-verified this session at `52c631edf` (branch `integration/ship-12-squash`); the
discussion document's own § 0 was measured at `bff94f382`. Source tree unchanged between the two.
**Fill convention (from that document's "How to read / fill" preamble, lines 11–24):** every decision lists
options as checkboxes, exactly one marked `★ RECOMMENDED`; **all boxes unchecked = the ★ option is CHOSEN**,
identical to ticking it; a ticked non-recommended box beats the `★`; and **`**EDIT:**` / `**NOTE:**` /
`**NOTES**:` free text beats every box**. Two such notes exist for this phase (F1, F5) and both are binding
scope, recorded verbatim below.

**Roadmap-vs-fact precedence.** `.planning/ROADMAP.md` § "Phase 157" is being corrected concurrently by
another agent (§ 0.1 was answered **(c)** — "Also correct `.planning/ROADMAP.md:1003-1217` in place"). Per
that answer and the task framing, **where the roadmap and a § 0 fact disagree, the fact wins**. This document
does not edit the roadmap; it records the facts and says so at each divergence.

<domain>
## Phase Boundary

Data crossing the Supabase boundary is **validated into its type rather than cast into it**, and nothing
outside the adapter knows Supabase exists. Delivers, per the six roadmap success criteria:

1. Typed JSONB columns validated on read; the named typecasts in `supabaseDataProvider.ts` gone.
2. The filter-value conversion extracted into a named helper, extended to election-round filtering, RPC
   updated to match.
3. A new `get_questions` RPC returning categories **and** their questions, filterable by election,
   constituency and election round, replacing client-side assembly.
4. The auth-compatibility shim removed — the ignored `currentPassword` / `authToken` parameters — along
   with the interface shape that required it, plus the abstract-interface members flagged in the writer.
5. `getLocalized` + its test colocated with `packages/app-shared/src/data/localized.type.ts` and typed
   from there; `authConfig.ts` split so providers are not interdependent.
6. A source test fails when adapter specifics appear outside their allowed loci; `logDebugError` renamed
   and reworked into structured, pino/OTL-conformant output.

**Package reach.** The roadmap frames this as a frontend-adapter phase. **Two decisions widen it:**
- **F5's operator NOTES put the new logger in `packages/app-shared`**, not in the frontend.
- **F2's winning option puts the zod validation schemas in `packages/app-shared`** too, colocated with the
  types they validate.
- **F3's winning option puts new SQL (`get_questions`) in `apps/supabase/supabase/schema/`**, inside this
  phase rather than in 156.

So the real reach is `apps/frontend/src/lib/api/**` + `packages/app-shared/**` + `apps/supabase/**` +
the ~53 frontend files that call `logDebugError`.

**Requirements**: the roadmap declares `REVIEW-ADP-01..06`. **These IDs do not exist in
`.planning/REQUIREMENTS.md`** (grep returns zero hits) — see `<open>`.

**Depends on**: Phase 156 — see the upstream-dependency section under `<facts>` for exactly what is
consumed. **Note the roadmap's parenthetical "(RPC changes land there)" is superseded by decision D-F3**,
which lands `get_questions` in 157.

**Not in scope:** the permissions/RLS rewrite (Phase 162), `RETURNS TABLE` nullability (Phase 164),
routing/auth-surface harmonisation (Phase 158, which declares a dependency **on** this phase), and
reintroducing the local adapter (a filed follow-up, per N2 — see `<open>`).

</domain>

<decisions>
## Implementation Decisions

Five phase decisions (F1–F5), of which **F1 and F5 were resolved by an explicit tick** and F2, F3, F4 by
the unchecked-means-recommended default. Both ticks also carry binding free-text notes.

---

### D-F1 ⚠ DECIDE — Criterion 4 names a symbol that does not exist

**Question:** criterion 157-4 says "remove the `withAuth` shim". Fact 18: `grep -rn 'withAuth'` returns
**zero hits repo-wide**. What is the criterion actually about?

**Won by TICK — option (a)** (also the ★ RECOMMENDED option):

> **(a) Restate criterion 4 against the real target: remove the two ignored params from `_setPassword`
> and from the `UniversalDataWriter` abstract signature** — preserves the criterion's intent exactly;
> without the restatement a planner searches for `withAuth`, finds nothing, and marks the criterion
> vacuously met.

**Operator NOTES, verbatim and binding:**

> **NOTES**: Also check that currentPassword and authToken are not used anywhere else.

**What this obliges.** The phase is **not** "delete two parameters at two sites". It must include a
**repo-wide reach check for both identifiers** before deletion, and disposition every hit. The reach was
measured this session and is recorded under `<facts>` — it is **20+ sites across 10 files, plus a live
piece of candidate UI**, and it contains at least one **false positive that must not be swept**.

**⚠ Correction to fact 18 that the planner must carry.** Fact 18's grep is **case-sensitive**. The
lower-case spelling `withAuth` indeed has zero hits — but the exported type **`WithAuth` (capital W) DOES
exist**, at `apps/frontend/src/lib/api/base/dataWriter.type.ts:345`, with **41 references across 6 files**.
So the criterion's phrase "the interface shape that required it" has a concrete, real target: the
`WithAuth` type and its `WithOptionalAuth` derivative
(`apps/frontend/src/lib/contexts/admin/adminContext.type.ts:50`). Fact 18 is right that the *shim comment*
is the anchor; it is wrong to conclude no `WithAuth` symbol exists. Do not let a planner re-run the
lower-case grep, get zero, and stop.

---

### D-F2 ⚠ DECIDE — How are typed JSONB columns validated (criterion 1)?

**Question:** criterion 1 demands validation on read and that "a grep for casts on adapter reads returns
empty". By what mechanism?

**Won by DEFAULT — no box ticked, so the ★ RECOMMENDED option (a) is CHOSEN:**

> **(a) Zod schemas colocated with the types in `@openvaa/app-shared`, parsed at the adapter edge** —
> zod is already a dependency and already the template-validation mechanism in dev-seed
> (`packages/dev-seed/src/template/schema.ts`), so this reuses a pattern the repo has measured (including
> the `.strict()`-does-not-descend finding at `schema.ts:35-41`).

Rejected: (b) hand-written type-guard predicates — 64 guards to hand-maintain with nothing keeping them in
sync; (c) generate validators from `packages/supabase-types` — the generated types describe `Json`, not the
*application* shapes (`AppSettings` etc.), so they cannot validate the columns the criterion is about.

**Scoping "a grep for casts on adapter reads returns empty" (fact 19).** `supabaseDataProvider.ts` carries
**64 lines containing ` as `** (87 token occurrences). The criterion cannot mean all 64. The decision's own
words scope it to **casts on adapter reads of typed JSONB columns**, parsed at the adapter edge. The
concrete anchors and their **measured** state are in `<facts>` — **two of the four line numbers the roadmap
names have drifted** and must be restated before a planner greps for them.

**Planner-facing consequences of putting the schemas in app-shared:**
- `packages/app-shared/package.json` has **exactly one runtime dependency** (`@openvaa/data`). Adding zod
  makes it the package's **first third-party runtime dependency**. Catalog pin is `zod: ^4.3.6`
  (`.yarnrc.yml:24`); it is already a dependency of `apps/frontend`, `packages/dev-seed`, `packages/llm`
  and `packages/question-info`, but **not** of `packages/app-shared`.
- The measured dev-seed finding applies verbatim: **`.strict()` is per-object and does not descend**
  (`packages/dev-seed/src/template/schema.ts:35-41`) — a top-level-only strict schema silently strips
  unknown nested keys. Every nested object needs its own `.strict()`, and each direction needs its own test
  case; dev-seed's `tests/template.test.ts` is the precedent to copy.

---

### D-F3 — The new `get_questions` RPC crosses the 156/157 boundary

**Question:** criterion 3 requires a new RPC; 157 declares a dependency on 156 for schema. Who writes the
SQL and who consumes it?

**Won by DEFAULT — no box ticked, so the ★ RECOMMENDED option (a) is CHOSEN:**

> **(a) Land the SQL and the wiring together in 157** — the RPC's shape is driven by the adapter's needs
> (election / constituency / election-round filtering), and splitting it means 156 ships an RPC with no
> consumer and no way to verify its signature is right.

Rejected: (b) SQL in 156, wiring in 157 — 156 cannot test it and 157 discovers the signature is wrong
after 156 is closed.

**Boundary as recorded, explicitly:**

| Artifact | Written by | Consumed by |
|---|---|---|
| `get_questions` RPC — the SQL function definition | **Phase 157** | **Phase 157** (`supabaseDataProvider._getQuestionData`) |
| The RPC's election / constituency / election-round filter signature | **Phase 157** | **Phase 157** |
| `party` → `organization` enum + schema + migration rename | Phase 156 | Phase 157 (adapter reads) |
| `102-entities.sql` `candidates.name` removal | Phase 156 | Phase 157 (adapter reads) |
| `503-entity-rpcs.sql` extension to organizations | Phase 156 | Phase 157 (`get_nominations` shape) |
| `504-admin-rpcs.sql` `merge_custom_data` rename decision | Phase 156 | Phase 157 (two adapter call sites) |

The same option also settles criterion 2's "with the RPC updated to match": the **election-round filter
extension to `get_nominations` is 157's SQL to write**, for the same reason.

**Measured today:** no `get_questions` exists anywhere in `apps/` or `packages/` (zero grep hits). This is
greenfield SQL, not a modification.

---

### D-F4 — The source test keeping adapter specifics out of routes (criterion 6)

**Question:** by what mechanism does a source test fail when adapter specifics appear outside their allowed
loci?

**Won by DEFAULT — no box ticked, so the ★ RECOMMENDED option (a) is CHOSEN:**

> **(a) ESLint `no-restricted-imports` with an explicit `files`-scoped allowlist, enforced by
> `lint:check`** — fails at the import site with the offending path named, runs in the gate that already
> exists, and the allowlist is readable configuration rather than test fixture data.

Rejected: (b) a vitest source test that greps the tree — reports a file list rather than a line, and runs
only when someone runs the unit suite; (c) both — two places to update when the allowlist legitimately
changes.

**The allowlist must be explicit and the guard must fail on a 9th site.** Fact 19: adapter leakage today is
**8 route files, 0 components**. All eight are enumerated in `<facts>` — an implied or wildcard allowlist
does not satisfy criterion 6's "explicit rather than implied".

**In-repo precedent to copy exactly** (this is the closest analog and it is already load-bearing):
- `apps/frontend/eslint.config.mjs:89-110` — the scoped `no-restricted-imports` block (glob
  `src/**/*.{ts,js,mjs,cjs,svelte}` at `:90`), plus the paired `no-restricted-syntax` block from `:111`
  closing the dynamic `import('svelte/store')` form.
- `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` — the **permanent regression self-test**
  proving the guard FIRES rather than merely linting clean by accident (added Phase 124, extended to 30
  cases in Phase 143).
- **The flat-config caveat is documented in-file and is not optional**
  (`apps/frontend/eslint.config.mjs:85-88`, and again at `:115`): flat config **REPLACES rather than
  merges** the `no-restricted-imports` array for in-scope files, so the inherited deep-relative-`lib`
  `patterns` ban (`packages/shared-config/eslint.config.mjs:147-152`) must be **re-included VERBATIM** in
  any new scoped block — it already is, at `apps/frontend/eslint.config.mjs:102-108`. Omitting it silently
  drops that ban for those files.
- The milestone standing rule, already discharged twice in this repo for exactly this rule
  (Phase 143's `143-NEGATIVE-CONTROL-LEDGER.md`): **prove the guard fails before claiming it guards** —
  a negative control at a 9th site, observed red, and observed green with the site removed.

---

### D-F5 — `logDebugError` → structured logging: 82 call sites

**Question:** how is `logDebugError` renamed and reworked into structured, pino/OTL-conformant output
(criterion 6's second half)?

**Won by TICK — option (a)** (also the ★ RECOMMENDED option):

> **(a) Rename and restructure in one codemod across all 82 sites, emitting pino/OTL-conformant objects** —
> the criterion names one rename; a partial migration leaves two logging idioms, which is the shape this
> phase exists to remove elsewhere.

Rejected: (b) introduce alongside and migrate incrementally — guarantees the two-idiom state with no forcing
function to finish; (c) rename only, defer the structured output — the criterion says "renamed **and**
reworked into structured … output", so this meets half of it.

**Operator NOTES, verbatim and binding:**

> **NOTES**: Move the logging into app-shared so that it can be used by other modules as well.

**What this obliges.** The logger's home is **`packages/app-shared`**, not `apps/frontend/src/lib/utils/`.
The current definition (`apps/frontend/src/lib/utils/logger.ts`, 12 lines) is deleted or reduced to a
re-export, and every call site imports from `@openvaa/app-shared`. This is a **package-reach expansion** of
the phase: it moves a frontend utility into a shared workspace so `packages/llm`, `packages/dev-seed`,
`apps/docs` and future modules can use it.

**⚠ Module-format finding the planner must resolve — CLAUDE.md is stale here.** CLAUDE.md states
`@openvaa/app-shared` "Builds to both ESM (frontend) and CommonJS (backend)". **Measured at HEAD, that is no
longer true:**
- `packages/app-shared/tsup.config.ts` → `format: ['esm']` — ESM only.
- `packages/app-shared/package.json:4` description → "**ESM-only** — all current consumers are ESM
  (`type: module`)"; the `exports` map has an `import` condition **and no `require` condition**.
- All six declared consumers (`apps/frontend`, `apps/docs`, `packages/llm`,
  `packages/argument-condensation`, `packages/dev-seed`, and the package itself) are ESM workspaces.

So: the logger must work under **ESM at minimum**, and the decision to add a CJS build (restoring what
CLAUDE.md claims) is **not settled by F5** — see `<open>`. What the note does settle is that the logger
must not depend on frontend-only surface: the existing implementation reads `import.meta.env.DEV` and
`constants.PUBLIC_DEBUG` (`$lib/utils/constants`), **neither of which exists in app-shared**. The
level/enablement mechanism has to be re-founded on something the shared package can see.

**⚠ Correction to fact 20's count.** Fact 20 states "82 call sites", evidenced by
`grep -rn 'logDebugError' apps/frontend/src`. Re-measured this session, that exact command returns
**140 lines**, decomposing as **47 import lines + ~85 invocation sites + 8 comment/doc mentions**, across
**53 files** (31 `.ts`, 22 `.svelte`). The codemod must therefore rewrite **~85 invocations and 47
imports**, not 82 of anything. The largest concentrations: `lib/contexts` (13 files),
`routes/candidate` (11), `routes/admin` (7), `lib/components` (5). The exact number is not load-bearing —
the point is that the import lines are half the diff and must be in the codemod's scope.

---

### Applicable cross-cutting decisions

- **D-N1 (won by default, option (a)):** Phase 152's comment purge runs **first**, and its scan lands in
  `yarn lint:check` so later phases cannot reopen the class. **Binding on 157:** every comment this phase
  writes — and the F5 codemod will touch comments at ~8 sites — must comply with 152's convention (no
  planning references in code comments; no `--` used as a dash). 157 is authored *after* the sweep and the
  guard, so a violation fails `lint:check`.
- **D-N2 (won by default, option (a)):** "add as a follow-up task" review comments land in
  `.planning/todos/pending/`, filed **during the owning phase**. **157 owns one such comment:**
  `apps/frontend/src/lib/api/dataProvider.ts` — *"We should add reintroducing the local adapter as a
  follow-up task"* — which is a todo, not an edit. (The second such comment,
  `apps/frontend/src/lib/auth/getUserData.ts:31` — *"Add a blocking follow-up for renaming and refactoring
  logDebugError"* — needs **no** todo: D-F5 makes it in-scope work for this very phase.)
- **D-N3 (won by default, option (a)):** one `<padded>-CONTEXT.md` per phase generated from the decision
  document, plus a pointer back to it. This file is that artifact for 157; the discussion document
  `.planning/v2.15-DISCUSSION-POINTS.md` § F remains the authoritative record of the options considered.
- **D-0.1 (won by TICK, option (c)):** all 33 § 0 facts are the run's factual baseline **and**
  `.planning/ROADMAP.md:1003-1217` is being corrected in place so it stops carrying false premises. The
  roadmap's Phase 157 entry already carries a "**Corrected 2026-08-28**" preamble for fact 18. **Do not
  edit ROADMAP.md from this phase.**

### Claude's Discretion

- The zod schema module layout inside `packages/app-shared` (one file per JSONB column vs. a barrel), and
  whether types are inferred from schemas or schemas asserted against existing types — provided the
  colocation with `localized.type.ts` and its neighbours (D-F2) holds.
- The logger's API surface (levels, field names) beyond "pino/OTL-conformant", and whether the frontend
  keeps a thin re-export shim at `$lib/utils/logger` during the codemod.
- The `get_questions` RPC's exact parameter naming, provided it filters by election, constituency and
  election round (D-F3).
- Whether the ESLint guard is one scoped block or several, provided the allowlist is explicit and the
  inherited `patterns` ban is re-included verbatim (D-F4).


### Decision index (machine-readable)

One bullet per decision above, in the grammar `plan-phase`'s decision-coverage gate parses.
The sections carry the reasoning and evidence; **this is an index, not a summary — plan from
the sections.** It lives inside `<decisions>` because the parser reads only this block when
one is present, and ignores `###` headings entirely.

- **D-F1:** Criterion 4 names a symbol that does not exist
- **D-F2:** How are typed JSONB columns validated (criterion 1)
- **D-F3:** The new `get_questions` RPC crosses the 156/157 boundary
- **D-F4:** The source test keeping adapter specifics out of routes (criterion 6)
- **D-F5:** `logDebugError` → structured logging: 82 call sites

</decisions>

<facts>
## Measured Facts

All re-verified this session at HEAD `52c631edf`. Line numbers are measured, not carried over.

### The three § 0 facts this phase owns

| # | Fact | Verified |
|---|---|---|
| **18** ⚑ | **`withAuth` does not exist anywhere in the repo** (zero grep hits). The real shim is the ignored `currentPassword` / `authToken` params. | Confirmed: `grep -rn 'withAuth'` hits only `.planning/*.md`. **Amended:** `WithAuth` (capital W) **does** exist — `dataWriter.type.ts:345`, 41 refs / 6 files. |
| **19** | `supabaseDataProvider.ts` carries **64** `as` casts; adapter leakage is **8 route files, 0 components**. | Confirmed: 64 lines match ` as ` (87 token occurrences); 8 route files, 0 component files. |
| **20** | `logDebugError` has **82** call sites. | **Amended:** the cited command returns **140 lines** = 47 imports + ~85 invocations + 8 mentions, over **53 files**. |

### Criterion 4 — the real shim, and its full reach (the D-F1 NOTES obligation)

The shim itself:
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:83` —
  `protected async _setPassword({ password }: { password: string; currentPassword: string; authToken: string })`
- `:84` — `// currentPassword and authToken are WithAuth compatibility shims -- ignored by Supabase.`
  (Note the `--` dash: this comment is also in 152's sweep scope.)
- **The roadmap cites `:82-84`; `:82` is a blank line.** The declaration is `:83`, the comment `:84`.

The interface shape that required it:
- `apps/frontend/src/lib/api/base/dataWriter.type.ts:345` — `export type WithAuth = {` (the definition).
- `apps/frontend/src/lib/api/base/dataWriter.type.ts:153,158` — the abstract `setPassword` signature,
  `opts: WithAuth & { currentPassword: string; password: string }`.
- `apps/frontend/src/lib/api/base/universalDataWriter.ts:147,259` — the same shape on the base class.
- `apps/frontend/src/lib/contexts/admin/adminContext.type.ts:50` — `WithOptionalAuth`, derived from it.

The abstract-interface members flagged by criterion 4's second sentence: the roadmap cites
`supabaseDataWriter.ts:381`. **Measured, `:381` is a comment line**; the block it heads runs
`:378-384` — `// ADMIN METHODS / TODO: Primary access point is SupabaseAdminWriter. These implementations
satisfy the abstract contract on UniversalDataWriter.` — followed by `_updateQuestion` at `:384`. That
TODO block and the methods under it are the target.

**Reach of `currentPassword` (10 hits outside the writer, 5 files):** `authContext.type.ts:39,46,49` ·
`authContext.svelte.ts:97,99,101,102` · `universalDataWriter.ts:147,259` · `dataWriter.type.ts:153,158` ·
`supabaseDataWriter.test.ts:173,179,192`.

**⚠ Plus a live piece of candidate UI:**
`apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte:35,52,64,103,108,109` — a real
"current password" form field the candidate types into, whose value is passed to `setPassword()` and then
**silently discarded by Supabase**. Deleting the parameter forces a product decision about that field; it is
not a mechanical rename. Its E2E/testId surface is `tests/tests/utils/testIds.ts:69`
(`settings-current-password`) and `tests/tests/specs/a11y/candidate-a11y.spec.ts:322`. See `<open>`.

**Reach of `authToken`:** the shim uses — `authContext.svelte.ts:41,74,92,102` ·
`adminContext.svelte.ts:152,153,155,156` · `adminContext.type.ts:50` ·
`candidateUserDataState.svelte.ts:236,253` · `getUserData.ts:29,30` — all pass `authToken: ''` purely to
satisfy the `WithAuth` constraint, and all are in scope.

**⚠ One `authToken` that is NOT the shim and must NOT be swept:**
`apps/frontend/src/lib/server/admin/features/condenseArguments.ts:26,35,42,170,197,217,234` — a genuine
auth token threaded through admin API calls. A blind identifier-wide codemod would break it.

### Criterion 1 — the JSONB casts, with the roadmap's drifted anchors corrected

The roadmap names `supabaseDataProvider.ts:60`, `:92`, `:361`, `:511`. **Two of the four have drifted:**

| Roadmap says | Measured at that line | Real anchor |
|---|---|---|
| `:60` (settings) | `if (settings.notifications && typeof settings.notifications === 'object') {` — a guard, not a cast | **`:56`** — `const settings = (data?.settings ?? {}) as Record<string, unknown>;` (the settings-JSONB cast; the block runs `:56-76`, ending `return settings as Partial<DynamicSettings>` at `:76`) |
| `:92` (customization) | `const raw = (data?.customization ?? {}) as Record<string, unknown>;` — **correct** | `:92`, with the derived casts at `:101,106,108,110` |
| `:361` (entities) | a comment line | **`:368-378`** — the entity-JSONB block: `entityObj.name/shortName/info/color/order/subtype/customData as …` plus `row.entity_image as Json as unknown as StoredImage` (`:376`) and `row.entity_answers as Json as unknown as LocalizedAnswers` (`:378`); `:342` `nominationOut as AnyNominationVariantPublicData` sits in the same read path |
| `:511` (questions) | `const obj = toDataObject(row as Record<string, unknown>, …)` — **correct** | `:511`, with `:517,518,527` in the same block |

The triage's own comment anchors were `:60`, `:92`, `:245`, `:499`, `:511`
(`.planning/PRE-SHIP-REVIEW-TRIAGE.md:214-224`). The `as Json as unknown as X` triple-cast pattern is the
smell criterion 1 calls "smelly typecasts nowhere".

Criterion 2's anchor `:245` **is correct** — `const electionIds: Array<string | null> = options?.electionId
? Array.isArray(options.electionId) ? (options.electionId as Array<string>) : …`, inside the fan-out block
`:236-255`. Criterion 3's anchor `:499` **is correct** —
`protected async _getQuestionData(options?: GetQuestionsOptions)`, with the client-side assembly running
from `:503`.

### Criterion 6 — the eight allowed loci (fact 19)

`grep -rl 'supabase' apps/frontend/src/routes` → exactly these 8, and `apps/frontend/src/lib/components`
+ `lib/dynamic-components` → **0**:

1. `apps/frontend/src/routes/candidate/preregister/+layout.server.ts`
2. `apps/frontend/src/routes/candidate/auth/callback/+server.ts`
3. `apps/frontend/src/routes/candidate/auth/logout/+server.ts`
4. `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts`
5. `apps/frontend/src/routes/candidate/login/+page.server.ts`
6. `apps/frontend/src/routes/admin/login/+page.server.ts`
7. `apps/frontend/src/routes/api/candidate/preregister/+server.ts`
8. `apps/frontend/src/routes/api/auth/logout/+server.ts`

All eight are **server-side** files reaching `event.locals.supabase` for auth (e.g.
`candidate/login/+page.server.ts:25` `locals.supabase.auth.signInWithPassword`,
`api/auth/logout/+server.ts:10` `locals.supabase.auth.signOut()`). None is a client component. Whether
server-side auth access counts as "adapter specifics" is the question under `<open>`.

### Criterion 5 — the colocation targets

- Source: `apps/frontend/src/lib/api/adapters/supabase/utils/getLocalized.ts` **+ `getLocalized.test.ts`**
  (both exist; the directory also holds `localizeRow`, `mapRow`, `storageUrl`, `toDataObject` and their
  tests — the phase must decide whether they follow or stay).
- Destination: `packages/app-shared/src/data/localized.type.ts` (exists), alongside `isLocalized.ts`,
  `customData.type.ts`, `extendedData.type.ts`, `isImage.ts`, `isEmoji.ts`.
- `authConfig.ts` split: `apps/frontend/src/lib/api/utils/auth/providers/authConfig.ts` — per-provider claim
  mapping; the sibling `providers/index.ts:31` carries its own triage item ("Remove the default with no
  historical mentions"), the `PUBLIC_IDENTITY_PROVIDER_TYPE || 'signicat'` default at `:31`. **⚠ This
  collides with Phase 155 criterion 2**, which removes `??`/`||` env defaults in the Edge Functions —
  different tree, same class of defect. Coordinate wording, not code.

### Upstream dependency — what 157 consumes from Phase 156

Phase 156's own decisions (§ E, all resolved to their ★ options **except none ticked** — E1(a), E2(a),
E3(a), E4(a), E5(a), E6(a)) mean a planner for 157 **may assume**:

- **`party` → `organization` is renamed across enums, schema, migrations, dev-seed and frontend** (E1(a),
  criterion 156-1), with **migrations rewritten in place, not additively** (E2(a)) — so there is one
  history, no compatibility alias, and `yarn db:reset-with-data` is the gate. **157's exposed sites:**
  `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:180`
  (`r.role === 'candidate' || r.role === 'party'`) and
  `apps/frontend/src/routes/candidate/login/+page.server.ts:41` (the same predicate). Both read the role
  enum 156 renames. `apps/frontend/src/lib/components/entityTag/EntityTag.svelte:39` maps
  `organization: 'party'` as a *translation key*, not an enum value — verify before touching.
- **`candidates.name` is removed** from `102-entities.sql:27`, `short_name` retained as the
  generated-initials override (E4(a), criterion 156-7). The provider's `entityObj.name` /
  `entityObj.shortName` reads at `supabaseDataProvider.ts:368-369` sit directly on that change.
- **`503-entity-rpcs.sql:147` is extended to all answer-carrying entities, organizations included**
  (criterion 156-6). The adapter's only `get_nominations` call is
  `supabaseDataProvider.ts:259` — its result shape may widen.
- **`504-admin-rpcs.sql:12` `merge_custom_data` is either renamed to `merge_question_custom_data` or
  generalised, with the choice recorded** (criterion 156-6). **157 has two call sites that must follow the
  recorded choice:** `supabaseAdminWriter.ts:26` and `supabaseDataWriter.ts:388`, both
  `this.supabase.rpc('merge_custom_data', …)`.
- **`303-column-grants.sql` no longer grants `authenticated` UPDATE on `sort_order` / `created_at` /
  `updated_at`, on BOTH candidates and organizations** (E3(a), criterion 156-5). Any adapter write path
  touching those columns will start failing.

157 does **not** consume a `get_questions` RPC from 156 — per D-F3 it writes its own.

### Canonical references

**Phase inputs (read before planning):**
- `.planning/v2.15-DISCUSSION-POINTS.md` — the "How to read / fill" preamble (`:11-24`), § 0 (`:30-70`,
  facts 18/19/20), § 0.1, **§ F (`:417-483`)** and § N (`:871-903`). **The single most important ref.**
- `.planning/ROADMAP.md` § "Phase 157" — the six success criteria verbatim, with its
  "Corrected 2026-08-28" preamble. Being edited concurrently; facts win on conflict.
- `.planning/PRE-SHIP-REVIEW-TRIAGE.md:210-241` — all **14** PR #869 review comments this phase answers,
  each with its file:line and reviewer. Includes two the roadmap's criteria do not name:
  `api/README.md:10` ("Not accurate now with local disabled") and
  `adminWriter/supabaseAdminWriter.ts:80` ("Add typing for return results if possible" — the
  `Array<unknown>` in the `send-email` invoke return type at `:80`).

**Surface being changed:**
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — criteria 1, 2, 3.
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — criterion 4.
- `apps/frontend/src/lib/api/base/{dataWriter.type.ts,universalDataWriter.ts}` — the `WithAuth` shape.
- `apps/frontend/src/lib/api/adapters/supabase/utils/getLocalized.{ts,test.ts}` → `packages/app-shared/src/data/`.
- `apps/frontend/src/lib/api/utils/auth/providers/{authConfig.ts,index.ts}` — criterion 5.
- `apps/frontend/src/lib/utils/logger.ts` → `packages/app-shared` (D-F5 NOTES).
- `apps/supabase/supabase/schema/503-entity-rpcs.sql` and a new `get_questions` (D-F3).

**Precedent to copy:**
- `apps/frontend/eslint.config.mjs:77-101` + `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` +
  `packages/shared-config/eslint.config.mjs:144` — the guard shape, the self-test, and the
  flat-config-replaces-not-merges caveat (D-F4).
- `packages/dev-seed/src/template/schema.ts:30-45` + `packages/dev-seed/tests/template.test.ts` — the zod
  pattern and the measured `.strict()`-does-not-descend behaviour (D-F2).
- `packages/README.md` — the canonical package paradigm, if new modules land in app-shared.

**Project conventions:**
- `CLAUDE.md` § "E2E Hard Rule" — cardinal-failure gate. **Also § Architecture, whose
  "Builds to both ESM (frontend) and CommonJS (backend)" claim about `@openvaa/app-shared` is measured
  stale** (see D-F5).
- `CLAUDE.md` § "Context Destructuring Rule" — relevant if the logger move touches context consumers.

</facts>

<open>
## Open Questions — not settled by F1–F5

These are recorded rather than invented. Each needs a planner or operator answer before or during planning.

1. **`REVIEW-ADP-01..06` landed mid-session and restate the drifted line numbers.** When this context was
   first gathered, `grep -rn 'REVIEW-ADP' .planning/REQUIREMENTS.md` returned **zero hits**; the concurrent
   roadmap-correction agent then wrote them in at `.planning/REQUIREMENTS.md:131-136` (still uncommitted at
   the time of writing). **They restate the four cast anchors as `:60`, `:92`, `:361`, `:511`
   (REVIEW-ADP-01), the shim as `supabaseDataWriter.ts:82-84` (REVIEW-ADP-04), and the logger as
   "82 call sites" (REVIEW-ADP-06)** — i.e. they carry the same drifted line numbers and the same count
   corrected under `<facts>` above. Use the measured anchors in this document; treat REQUIREMENTS.md's as
   the *intent*, not the coordinates. `.planning/PRE-SHIP-REVIEW-TRIAGE.md` still has no REVIEW-ADP IDs.

2. **⚠ The candidate settings "current password" field (D-F1's NOTES obligation, product-level).**
   `routes/candidate/(protected)/settings/+page.svelte:35,52,64,103,108,109` collects a current password
   the backend ignores. Removing the `currentPassword` parameter forces a choice: **(a)** delete the field
   (a visible UX change to a security-adjacent form, with `testIds.ts:69` and
   `candidate-a11y.spec.ts:322` to update), **(b)** keep the field and make it actually verify (new work,
   arguably a security improvement, out of this phase's stated scope), or **(c)** keep the field and the
   parameter, contradicting criterion 4. F1's tick settles the *identifier* question, not this one.

3. **⚠ Criterion 6's allowlist composition — grandfather 8, or drive to 0?** The criterion says
   "routes, components and lib are **clean**, and the allowed list is explicit". F4 + fact 19 say the
   allowed-loci list must be explicit and the test must fail on a 9th — which reads as *the 8 are the
   allowlist*. But all 8 are server-side `event.locals.supabase` auth reads, and refactoring them behind
   the adapter is itself substantial work that **Phase 158 declares a dependency on this phase to do**
   ("the adapter boundary must exist before routes can stop reaching through it"). Two readings, one
   phase: decide whether 157 ships an 8-entry allowlist that 158 shrinks, or shrinks it itself.

4. **Does the app-shared logger need a CommonJS build?** D-F5's NOTES say "so that it can be used by other
   modules as well". All six current consumers are ESM and `tsup.config.ts` emits ESM only. If a future
   CJS consumer (or CLAUDE.md's stated contract) is intended, `format: ['esm', 'cjs']` plus a `require`
   condition in the `exports` map is a package-shape change with its own build and typing implications.
   Not settled by F5; CLAUDE.md's claim is stale either way and should be corrected or made true.

5. **What replaces `import.meta.env.DEV` / `constants.PUBLIC_DEBUG` as the logger's enablement gate?**
   `apps/frontend/src/lib/utils/logger.ts` reads both; neither is visible from `packages/app-shared`.
   A shared logger needs a level/enablement mechanism the package can see (injected config, env, or an
   explicit `configure()`), and every consumer must set it.

6. **Do `localizeRow` / `mapRow` / `storageUrl` / `toDataObject` follow `getLocalized` into app-shared?**
   Criterion 5 names only `getLocalized` and its test. Their sibling directory
   (`adapters/supabase/utils/`) is the adapter's private utility layer; `toDataObject` in particular is
   called from the very read paths criterion 1 is rewriting (`supabaseDataProvider.ts:358,511`).

7. **Two triage comments have no matching success criterion** and will otherwise be silently dropped
   (N2 says file rather than drop): `apps/frontend/src/lib/api/README.md:10` — "Not accurate now with local
   disabled" (a one-line doc fix; the README still describes a "local adapter available for static data",
   as does CLAUDE.md); and `adminWriter/supabaseAdminWriter.ts:80` — "Add typing for return results if
   possible", the `Array<unknown>` in the `send-email` invoke return shape. Both sit naturally in this
   phase; neither is in a criterion.

8. **`dataProvider.ts:12` no longer exists.** The triage's "reintroduce the local adapter as a follow-up"
   comment is anchored at `apps/frontend/src/lib/api/dataProvider.ts:12`; the file is now **one line**
   (`export { dataProvider } from './adapters/supabase/dataProvider';`). The N2 todo should be filed
   against the file, not the line.

9. **How is "a grep for casts on adapter reads returns empty" *asserted*?** D-F2 settles the validation
   mechanism but not the proof. Criterion 1's wording implies a standing check; the repo's precedent for
   standing greps-as-tests is the `_guards/` self-test pattern (D-F4). Whether criterion 1 gets its own
   guard, or is proven once by inspection, is unstated.

</open>

---

*Phase: 157-adapter-boundary-typing*
*Context gathered: 2026-08-28 · measured at HEAD `52c631edf`*
*Decision source: `.planning/v2.15-DISCUSSION-POINTS.md` § F (F1–F5), § 0 facts 18/19/20, § N (N1–N3), § 0.1*