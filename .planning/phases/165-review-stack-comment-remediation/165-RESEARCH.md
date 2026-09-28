# Phase 165: Review-Stack Comment Remediation - Research

**Researched:** 2026-09-27
**Domain:** Multi-surface review remediation: the Supabase schema and RLS, the SvelteKit frontend, dev-seed, experimental packages, CI, and comment hygiene
**Confidence:** HIGH. Every disposition below was checked at the stack tip with a command that was actually run. Two tip defects were also reproduced against the running local database, inside rolled-back transactions.

## Summary

All 78 comments are dispositioned below, each against the tip state: `HEAD` = `ship/v2.15-13-review-fixes`, whose tree equals `ship/v2.15-12-planning` (`8efd20606`) plus the phase-165 docs commit.

| Disposition | Count |
|---|---|
| fix | 50 |
| split-artifact | 25 |
| already-fixed | 1 |
| wont-fix (Copilot, concrete reason, one assumption for the maintainer to confirm) | 1 |
| deferred (maintainer, D-03) | 1 |

Copilot's "caller still uses the old API" / "module does not exist" findings are split artifacts in every case checked. Its schema-authorization, CI, test-harness and prose-regression findings are mostly real.

Two defects are **security-relevant and proven live** (rolled-back probes against `supabase_db_openvaa-local`, whose `user_can` body matches the tip):

1. **Cross-tenant takeover through a type-blind entity id.** A project admin of project Q can insert a *candidate* that reuses the UUID of an *organization* in project P. After that, `user_can('entity', <P's org id>, 'entity.edit_answers')` returns `t` for the Q admin. `private.entity_project_id` resolves the shared id to Q, because the candidates arm of its `UNION ALL … LIMIT 1` comes first. This is Copilot C-4080520234, and it is the concrete reason behind the maintainer's C-4094736695 ("require the entity type as a parameter"). Both land in one schema plan.
2. **Orphan feedback manufactured at insert time.** Anon can `INSERT INTO feedback (rating, description)` with no `project_id`, and the row lands with `project_id IS NULL`. The "global-scope admin reads orphans" disjunct then exposes it.

Comment hygiene is **not** a small tail task:

- `hygiene-grep-report.sh --assert-clean` is **RED repo-wide at the tip**: 7 failing rows, 184 files. So D-04's per-changed-file scoping is the only workable gate, and the repo-wide assert cannot be used as the pass condition.
- The codemod misses whole classes of planning references (`162-08`, `T-157-06`, `**C4**`, `D-DISC-1`, `CR-05`), and its mechanical deletions leave rubble (`REVIEW-EDGE-04` → `REVIEW-`).
- The files this phase must touch carry heavy narrative prose. The schema files alone hold about 1,300 comment lines.
- Use the codemod as a **dry-run detector only**. Do every rewrite by hand, and prove each hygiene-only commit is code-identical after comment-blanking.

**Primary recommendation:** run three schema plans sequentially first:

1. entity-type-aware authorization;
2. `is_generated` removal plus the candidates column reorder;
3. the feedback insert guard plus column documentation and schema-file hygiene.

Each regenerates `00001_initial_schema.sql` → `yarn db:reset` → `yarn db:types`. Then run file-disjoint frontend/package/CI plans in parallel, and finish with a per-changed-file hygiene gate plus the full cardinal gate set.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Entity-scope authorization (`user_can`, RLS) | Database / Storage | API (PostgREST RPC signatures) | Authority is decided only in SQL; the frontend adapter passes ids and types |
| Column removal / reorder / column docs | Database / Storage | dev-seed (producer), supabase-types (generated) | The schema is the source; the regenerated migration, types and seed follow |
| Feedback insert guard | Database / Storage | — | A trigger or policy on `public.feedback` |
| Provider keyword rename (`*-ftn`) | Frontend Server (SSR: `/api/oidc/*`) | Edge Function (`identity-callback`) | Both read the provider-type env var; they must agree (`check:env-pairs-agree`) |
| `safeGetSession` per-request memo | Frontend Server (hooks) | — | `event.locals` lifetime is one request |
| Style-block inlining, QuestionChoices | Browser / Client (Svelte components) | — | Presentation only |
| Frontend-local grant types + parity test | Frontend (lib/auth) | Supabase adapter (the test lives there) | Keeps the frontend adapter-agnostic, with parity asserted at the adapter boundary |
| Local-adapter filter parity | Frontend Server (`lib/server/api/adapters/local`) | — | The server-side local DataProvider |
| CI env keys for E2E | CI (`.github/workflows/main.yaml`) | — | Runner configuration |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### D-01 — Triage: many Copilot comments are split artifacts
The maintainer's words: "many of these, tho, are artifacts resulting from the 12-way split PR". Copilot reviewed each slice **in isolation against its base**, so a large share of its findings will look like one of these:
- "caller X still uses the old API"
- "module Y does not exist"
- "alias not registered"

In those cases the other half of the change is in a **later** slice. Examples of this shape: #879's `lib/routes/route` imports, #881's `$layouts` alias, #877's `get_nominations`/`p_project_id` and `merge_question_custom_data` callers, and the `grants` vs `user_roles` claim consumers.

Every comment gets exactly one disposition:
- `fix` — the defect is real at the stack tip.
- `split-artifact` — the defect exists only in an intermediate slice, and the tip is correct. This **must be proven at the tip** with a grep, file read, test or run, never assumed from the comment's shape.
- `already-fixed` — a later commit in the stack or a quick task already resolved it. Cite the commit or the tip evidence. Partial fixes count as `fix`: for example, QuestionChoices is only half done at the tip, since the consts are `UNPICKED_DOT*`, not the requested `UNPICKED_RADIO`/`UNPICKED_CHECKBOX`, and the "is no longer here" narrative survives near the style block.
- `deferred` — **only** where the maintainer said so (D-03).
- `wont-fix` — only with a concrete technical reason. For a maintainer comment, this is a `checkpoint:decision`, never unilateral.

Copilot findings that are real at the tip are fixed like any other defect. Copilot comments about **comment/prose regressions** from the codemod reflow are real defects wherever they persist at the tip. Examples: #878 FeedbackGenerator grammar and the QuestionCategoriesGenerator header; #885 collapsed JSDoc examples in argument-condensation, llm and promptRegistry; #886 `keygen.ts` usage backslashes.

#### D-02 — Every maintainer comment is addressed as written
The 19 `kaljarv` inline comments are instructions, not suggestions. Several are broad and must be implemented at their stated breadth, not just at the anchored line:
- **#877 `102-entities.sql`**: same column order as `organizations` for **all related tables**.
- **#877 `101-elections.sql:13`**: check whether the column is used for anything that can't be recovered from `external_id`. If not, remove it from **all tables and seed data with no historical traces**.
- **#877 `100-tenancy.sql`**: add a concise comment (or other docs) on **every** table column that isn't completely self-evident, **especially the JSONB shape** (e.g. localised strings).
- **#877 `503-entity-rpcs.sql:105`**: examine requiring the entity type as a parameter for **all** such id-taking functions.
- **#880 `supabaseDataProvider.ts:60`**: move helpers (and possibly consts) out into `supabase/utils` or sibling files so the provider file stays focused on the DataProvider implementation.
- **#880 `idura.ts`**: rename provider keywords `idura`→`idura-ftn` and `signicat`→`signicat-ftn` in configs, and mark every Finnish-specific config as such (e.g. `IDURA_AUTH_CONFIG`→`IDURA_FTN_AUTH_CONFIG`). The provider implementations stay generic.
- **#880 `PasswordValidator.svelte`**: if password validation is used only in the frontend, move it from `app-shared` to `apps/frontend/src/lib/utils/password-validation/`.
- **#880 `ImagePart.svelte`**: inline these classes.
- **#880 `roles.ts`**: keep the frontend adapter-agnostic. **Audit the whole repo** for `supabase-types` imports outside the Supabase adapter. Define the frontend types in place, and assert they match the Supabase types in a test colocated with the Supabase adapter.
- **#880 `QuestionChoices.svelte`**: never include historical narrative; no link to the line above; use `cn` rather than interpolation; rename to `UNPICKED_RADIO` / `UNPICKED_CHECKBOX`.
- **#880 `prepareDataWriter.ts`**: check whether caching the data writer (here or in `createDataWriter`) has any use; remove it if not.
- **#880 `voterContext.svelte.ts:545`**: move to `contexts/utils` and remove the historical narrative.
- **#880 `Header.svelte`**: inline styles as Tailwind classes as much as possible, **for all `<style>` blocks in components**. This is repo-wide across component libraries, not just Header.
- **#880 `utils/components.ts:22`**: check whether the duplication can go by using different theme variables in `app.css` while keeping the `p-xs` semantics.
- **#880 `focusNavigationTarget.ts:61`**: can auto-focus be cancelled by listening to any pointer event without disturbing other interactions? If not, lower the timeout to 5000 ms.
- **#880 `logLevel.ts`**: far too much prose. State the point and stop.

Investigation-shaped comments ("check whether", "examine whether", "is it possible") end in a recorded verdict **and** the resulting change. If the verdict is "no change", the ledger carries the evidence.

#### D-03 — Deferred by the maintainer: adapter-selection entrypoints
#880 `apps/frontend/src/lib/api/dataProvider.ts:1` (comment 4105438045) asks for:
- static-settings adapter selection with lazy-loaded Supabase modules,
- build-time/env adapter registration,
- self-registered capabilities,
- adapter hooks replacing adapter-specific imports like `SUPABASE_COOKIE_PREFIX` in route loaders.

The maintainer explicitly said: "let's do this on a follow up phase after the initial ship". Disposition: `deferred`. Record it as a pending todo (or backlog item) carrying the comment's full requirements list. **Do not implement it in this phase.**

#### D-04 — Comment hygiene applies to EVERY changed file (maintainer, 2026-09-27)
"Make sure the comment hygiene rules for the repo are applied to all changes files." Every file this branch changes must satisfy the repo's comment-hygiene rules, including files touched only incidentally (renames, moved helpers, inlined styles). The rule sources:
- The `ship-review-stack` skill's hygiene mechanism: `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` (deterministic rules, dry-run by default) and `hygiene-grep-report.sh --assert-clean`. Together they strip planning references: phase numbers, `D-NN` decision ids, task ids, milestone tags, and `.planning/` paths in shipped source. The one allowed survivor form is `see phase N`. Scope is `apps/ packages/ tests/`. `CLAUDE.md`, `.agents/`, `.claude/` and `.planning/` are exempt.
- The maintainer's rules stated in these threads: **no historical narrative in comments, ever** ("is no longer here", "was moved from", "previously…"); **no excess prose**; comments state the point; no linking to the adjacent line.
- The codemod-reflow regressions Copilot flagged (collapsed multiline JSDoc examples, `//` comments swallowing code on one line, shell-continuation backslashes followed by text, broken sentences). Hygiene edits must never produce these.
- `.agents/code-review-checklist.md` for everything else.

Enforcement must be **per changed file**: derive the set from `git diff --name-only ship/v2.15-12-planning...HEAD` at run time, then run the codemod plus a residue pass (agent read) over exactly that set. `hygiene-grep-report.sh --assert-clean` is a floor, not the whole check.

#### D-05 — Branch and commit discipline
- All work lands on `ship/v2.15-13-review-fixes`. Do not rewrite the twelve ship branches. Do not push without the maintainer's go-ahead: pushing and opening PR 13/13 is outward-facing.
- One atomic commit per logical fix (or a tight cluster) so each GitHub thread can be answered with a single commit link.
- An uncommitted, unrelated working-tree edit to `apps/frontend/src/lib/layouts/main/MainContent.svelte` (`flex-grow`→`grow`) predates this phase. It is not ours: never stage it with a phase commit. If the Header/style-inlining work touches that file, stop and ask.

#### D-06 — Gates (cardinal)
`yarn build`, `yarn lint:check`, `yarn format:check`, `yarn test:unit`, pgTAP, `yarn db:lint:sql` and the **full** E2E suite (`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`) must all pass: 0 failed, 0 flaky, 0 did-not-run. Schema changes (column reorder, column removal, entity-type parameters) need `yarn db:types` regeneration and a dev-seed/template update in the same change. Read gate exit status directly, never through a pipe.

### Claude's Discretion
- Plan decomposition and wave order. Schema changes likely go first because types, seed and frontend follow from them; the repo-wide style-block inlining and supabase-types audit are large enough to be their own plans.
- Exact mechanism for the supabase-types parity test, provided it lives next to the Supabase adapter and fails on drift.
- Ledger file format, provided every one of the 78 comment ids appears exactly once with a disposition and evidence.

### Deferred Ideas (OUT OF SCOPE)
- Adapter-selection entrypoints, lazy-loaded Supabase modules, adapter self-registration and hooks (#880 comment 4105438045) — follow-up phase after the initial ship, per the maintainer.
</user_constraints>

<phase_requirements>
## Phase Requirements

No REQ-IDs are mapped (a review-remediation phase). The requirement population is the **78 `### C-<id>` entries in `165-REVIEW-COMMENTS.md`**: 59 from Copilot and 19 from `kaljarv`. The count was verified at run time: `grep -c '^### C-' 165-REVIEW-COMMENTS.md` → `78`, and there are no duplicate ids. The full triage table below maps every id to a disposition and a plan.

ROADMAP criterion 1 also says "every non-empty review body". The 12 Copilot overview bodies and the maintainer's "Checked."/"Check passed."/"Review skipped as non-critical." bodies are listed at the end of `165-REVIEW-COMMENTS.md` as non-actionable. The recommendation is a short second ledger section with one row per PR review body, disposition `no-action (summary of inline comments)`. That satisfies the ROADMAP wording without touching the 78-row completeness check.
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **E2E cardinal rule:** no task completes while any E2E test fails. Flaky tests count as failures, and so do did-not-run tests. Prefer a full-suite run: `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`.
- **E2E preflight:** the served app must be this checkout and must be scoped to the suite's project. The wrapper starts its own dev server. A plain `yarn dev` serves the default project.
- **Context Destructuring Rule (Svelte 5):** never destructure a reactive accessor. Never bind `dataRoot` to a read alias. This is relevant when `sameRefs` moves out of `voterContext.svelte.ts`.
- **Svelte warning-accepted format:** `// svelte-warning: accepted — <rationale>`, placed immediately above the triggering line.
- **After a schema change:** run `yarn db:types`, and lint the applied DB with `yarn db:lint:sql` (needs a running local Postgres).
- **Use TypeScript strictly.** Avoid `any`.
- **WCAG 2.1 AA.** The a11y axe scan must stay green. This matters for style inlining and for the focus-cancellation change.
- **Localization:** user-facing strings go through `t()`.
- **Missing values:** use `MISSING_VALUE` in matching contexts.
- **Code Review Checklist** (`.agents/code-review-checklist.md`), notably:
  - trigger naming `set_updated_at` / `validate_{thing}` / `enforce_{constraint}`;
  - SECURITY DEFINER functions set `search_path = ''`;
  - RLS policies use `(SELECT auth.jwt())` and name `TO anon|authenticated`;
  - pgTAP runs inside a BEGIN/ROLLBACK;
  - adapters use COLUMN_MAP/PROPERTY_MAP;
  - route guards use `safeGetSession()`.
- **Never commit sensitive data.** `.env` files are secret-guarded, and this research could not read them.
- **Memory-derived constraints:**
  - Never read a gate's status through a pipe.
  - `tests/e2e-runs/` must not be deleted.
  - This host runs a SECOND unrelated Supabase stack (`supabase_db_next-supabase-skimle2`), so do not restart Docker.
  - On ENOSPC, try `docker builder prune -af` first.
  - The worktree's `core.hooksPath=/dev/null`, so plain commits work.
  - Restart the dev server if HMR looks stale.

## Standard Stack

No new packages are needed. Every fix uses dependencies already in the tree.

### Core (already installed; versions read this session)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwind-merge | 3.7.0 [VERIFIED: node_modules/tailwind-merge/package.json] | `cn` conflict resolution | Already the project's merge engine |
| clsx | ^2.1.1 [VERIFIED: apps/frontend/package.json] | `cn` input flattening | Already used |
| vitest | 3.2.4 [VERIFIED: vitest run banner] | Unit tests + `expectTypeOf` for the type-parity test | Already the test runner |
| Supabase CLI | 2.83.0 [VERIFIED: `yarn workspace @openvaa/supabase supabase --version`] | `db reset`, `gen types`, `test db`, `db lint` | Pinned workspace devDependency |
| Vite | 6.4.1 [VERIFIED: node_modules/vite/package.json] | `loadEnv` (C-4080502860) | Frontend bundler |
| Node | v24.14.1 [VERIFIED: `node --version`] | `engines.node: ">=22"` satisfied | Runtime |

**Installation:** none.

## Package Legitimacy Audit

No external package is installed by this phase, so no legitimacy check was needed.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## The 78-comment triage table (verified at tip)

Legend:
- **fix** = real at the tip.
- **split** = split-artifact, proven at the tip.
- **af** = already-fixed.
- **wf** = wont-fix.
- **def** = deferred.

The "Plan" column refers to the proposed decomposition further down. Anchors are content anchors, not line numbers. Where a line number appears, it is **evidence of what was read this session** and must be re-derived at execution time.

### PR #876 — shared packages

| # | Comment id | Author | Anchor | Disp. | Evidence (run this session) | Change / reply | Plan |
|---|---|---|---|---|---|---|---|
| 1 | C-4080507169 | Copilot | `getLocalized.ts` fallback tiers | **fix** | `getLocalized.ts` returns `value[locale]`, `value[defaultLocale]`, `value[keys[0]]` with no type check after the container guard, so `{ en: 42 }` returns `42` despite `string \| null` | Return a tier only when `typeof v === 'string'`. The first-key tier must pick the first **string-valued** key. Otherwise `null`. Add cases to `getLocalized.test.ts` (`{en:42}`, `{en:null,fi:'x'}`). Hygiene: the in-function comment cites `T-157-06` and "this phase's stated posture"; rewrite it concisely. | P06 |
| 2 | C-4080507215 | Copilot | `sendEmailResult.schema.ts` `success` | **fix** | `send-email/index.ts` returns `success` and `dry_run` on all three branches (`success: true, dry_run: true`; `success: false … dry_run: false`; `success: true … dry_run: false`), but the schema has `success: z.boolean().optional()` and `dry_run: z.boolean().optional()`. The test `accepts an empty \`results\` array` parses `{ sent: 0, failed: 0, results: [] }` | Make `success` and `dry_run` required. Update the four schema tests that omit them, plus the `supabaseAdminWriter.test.ts` mocks of the invoke payload. Hygiene: the docblock says "the phase's theme in miniature". | P06 |
| 3 | C-4080507248 | Copilot | `staticSettings.ts` `pageSize: 50000` | split | `apps/supabase/supabase/config.toml` has `max_rows = 50000`. `git log -S "max_rows = 50000"` shows it was introduced by `5f2ffe900` (#877), a later slice | Reply: the cap is set to 50000 in #877's `config.toml`. | ledger |
| 4 | C-4080507280 | Copilot | `staticSettings.ts` `font.url` | split | `apps/frontend/static/fonts/inter.css` + 4 woff2 are tracked, and `git log -- …/inter.css` shows `2a2cce8ed` (#882) | Reply: the asset ships in #882. | ledger |

### PR #877 — schema, RLS, pgTAP

| # | Comment id | Author | Anchor | Disp. | Evidence | Change / reply | Plan |
|---|---|---|---|---|---|---|---|
| 5 | C-4080520022 | Copilot | `config.toml` `additional_redirect_urls` | split | The route exists: `apps/frontend/src/routes/api/candidate/auth/callback/+server.ts` (ls exit 0). `route.ts`: `CandAppAuthCallback: '/api/candidate/auth/callback'`. The allowlist has `…/api/candidate/auth/callback` and `…/*/api/candidate/auth/callback` (locale prefix) | Reply: the callback moved to `/api/candidate/auth/callback` in #880/#881. | ledger |
| 6 | C-4080520062 | Copilot | `claimConfig.ts` Signicat `sub` | **wf** | No Supabase identity-callback has ever shipped: `git cat-file -e origin/main:apps/supabase` → exit 128 (`origin/main` still carries the Strapi `backend/`). `apps/supabase/supabase/seed.sql` (the default-project comment) states "no database has been published, so there are no deployed rows to transform". No user keyed on `birthdate` can exist to be orphaned | No rekey migration. Reply with the evidence. **Assumption A1:** no hosted pre-release Supabase project holds Signicat users. Confirm with the maintainer (a light `checkpoint:human-verify`, since this is a Copilot comment). Note: `claimConfig.ts` is touched by the `*-ftn` rename (P08), so its hygiene debt is paid there (`.planning/…` path, `Phase 142.1`, `REVIEW-EDGE-04`). | P08 (hygiene) / ledger |
| 7 | C-4080520102 | Copilot | `send-email` template shape | **fix** | The edge function's `SendEmailRequest.templates: Record<string, { subject: string; body: string }>` validates `tmpl.body`. The adapter's `SupabaseAdminWriter.sendEmail` declares `templates: Record<string, { subject: string; text: string; html: string }>`. The mismatch is **present at the stack base too** (`cb763388a`). There is no production caller of `sendEmail` (grep: definition + tests only) | Align the adapter to the function contract, `{ subject: string; body: string }` (the function renders both text and html from `body`). Update `supabaseAdminWriter.test.ts` fixtures (`{ subject: 's', text: 't', html: 'h' }` → `{ subject: 's', body: 'b' }`). Latent, small blast radius. | P06 |
| 8 | C-4080520123 | Copilot | `send-email` `project_id` | split | `supabaseAdminWriter.ts` `sendEmail` sends `project_id: this.projectId` | Reply: threaded in #880. | ledger |
| 9 | C-4080520167 | Copilot | `107-feedback.sql` nullable `project_id` | **fix** | **Live probe** (rolled back): `SET LOCAL ROLE anon; INSERT INTO public.feedback (rating, description) VALUES (5,'probe orphan')` → `INSERT 0 1`, then `orphan_rows_inserted_by_anon = 1`. Policies `anon_insert_feedback` / `authenticated_insert_feedback` are `WITH CHECK (true)` | Recommended: a `BEFORE INSERT` trigger `enforce_feedback_project` that raises `not_null_violation` when `NEW.project_id IS NULL`. This keeps both INSERT policies byte-identical to the operator-ratified `WITH CHECK (true)` (the pgTAP `22-content-policies` "Section 11" block records that ruling). NULL then stays reachable only via `ON DELETE SET NULL`. Add a pgTAP `throws_ok` for anon and authenticated NULL inserts. Alternative (`WITH CHECK (project_id IS NOT NULL)`) contradicts the recorded ruling, so it needs a `checkpoint:decision`. | P03 |
| 10 | C-4080520206 | Copilot | `301-auth-functions.sql` `grants` claim | split | No product reader of `user_roles` (`git grep user_roles` outside tests = comments only). Readers use `readGrants` (`lib/auth/roles.ts`), `passwordLogin.ts` (`hasAnyGrant(readGrants(...))`), `supabaseDataWriter.ts` (`readGrants(session.access_token)`) | Reply: consumers migrate in #880. | ledger |
| 11 | C-4080520234 | Copilot | `user_can` entity equality | **fix** | **Live probe** (rolled back): created account/project Q, then `INSERT INTO candidates (id, …)` reusing organization `0fe6c609-…`'s id (project `…0001`). Results: `private.entity_project_id(org_id)` → `2222…` (Q), and `user_can('entity', org_id, 'entity.edit_answers')` with a Q project-admin claim → **`t`**. The precondition holds: `admin_insert_candidates` checks only `user_can('project', project_id, 'project.edit_entities')`, and `303-column-grants.sql` has no INSERT column grant on entity tables, so a project admin can choose `id` | Make entity reach type-aware (see "Entity-type-aware authorization" below). Negative control in pgTAP: a candidate and an organization sharing a UUID across projects. | P01 |
| 12 | C-4080520279 | Copilot | `get_nominations` `p_project_id` | split | `supabaseDataProvider.ts` `.rpc('get_nominations', { p_project_id: this.projectId, … })` | Reply: the provider passes it (#880). | ledger |
| 13 | C-4080520322 | Copilot | `get_nominations` `c.name` | **af** | `git show 5f2ffe900:…/503-entity-rpcs.sql \| grep c.name` → no output, and the tip grep exits 1. The stack base `cb763388a` had `COALESCE(c.name, o.name, …)`, so the reviewed slice itself removed it. Copilot read the diff's removed line | Reply: `entity_name` is `COALESCE(o.name, f.name, a.name)` in this very slice. Candidates use `entity_first_name`/`entity_last_name`. | ledger |
| 14 | C-4080520354 | Copilot | `get_candidate_user_data` `p_project_id` | split | `supabaseDataWriter.ts` `.rpc('get_candidate_user_data', { p_project_id: this.projectId, p_entity_type: 'candidate' })` | Reply: #880. | ledger |
| 15 | C-4080520386 | Copilot | `merge_question_custom_data` | split | `supabaseAdminWriter.ts` `.rpc('merge_question_custom_data', …)`, and its test asserts the name. `supabase-types` has `merge_question_custom_data` | Reply: #880. | ledger |
| 16 | C-4080520413 | Copilot | `elections.election_type` retype | split | `ElectionsGenerator.ts` `election_type: 'candidate_only'`, `default.ts` `election_type: 'organization_list'`. `git grep "election_type: '(general\|local)'"` exit 1 | Reply: #878 updates the producers. | ledger |
| 17 | C-4080520453 | Copilot | `501-bulk-operations.sql` candidate relationship | split | `permittedKeys.ts` `COLLECTION_NON_COLUMN_LIST = { candidates: ['email', 'organization'], …` strips the key before the write (the `CandidatesGenerator.ts` header documents why it survives in memory) | Reply: #878 strips it. | ledger |
| 18 | C-4094521874 | kaljarv | `102-entities.sql` column order | **fix** | Organizations order: `id, project_id, auth_user_id, name, short_name, info, color, image, sort_order, subtype, custom_data, is_generated, confirmed, created_at, updated_at, answers, external_id`. Candidates diverge: `auth_user_id`, `first_name`, `last_name`, `terms_of_use_accepted` sit after `updated_at`. Factions and alliances already match (factions carry `organization_id` in the third slot) | See "Column order" below. There are no positional INSERTs (`git grep -iE "insert into …(candidates\|…) (values\|select)"` → none), no `%ROWTYPE`/`SETOF` on entity tables, pgTAP uses `has_column` only (order-insensitive), and generated types sort alphabetically. | P02 |
| 19 | C-4094555940 | kaljarv | `101-elections.sql` line 13 = `is_generated boolean DEFAULT false` | **fix** (verdict: remove) | Anchor confirmed: `git show 5f2ffe900:…/101-elections.sql` line 13 is `is_generated`. No product reader: the frontend reads it only via `column-map.ts` → `isGenerated`, which `@openvaa/data` uses solely to skip `root.checkId(id)` (`dataObject.ts`), and UUIDs pass `checkId` (`isValidId`, `autoIdPrefix = '__'`). dev-seed teardown keys on the `external_id` prefix (`cli/teardown.ts`), not `is_generated`. The live DB has the column on **10** tables | Remove from all 10 tables. See "is_generated removal surface" below. | P02 |
| 20 | C-4094600054 | kaljarv | `100-tenancy.sql` column docs | **fix** | `git grep -i "COMMENT ON" apps/supabase/supabase/schema` → 0 files. The repo convention is inline `--` comments above a column (e.g. `elections.election_type`) | Add a concise one-line `--` comment above every non-self-evident column in every table (inventory below), with the JSONB shape spelled out. | P03 |
| 21 | C-4094736695 | kaljarv | `503-entity-rpcs.sql` `get_entity_basic_data(p_entity_id)` | **fix** (verdict: yes, require the type) | Type-blind id-taking functions at the tip: `private.entity_project_id(uuid)`, `public.user_can` (entity scope), `private.is_child_nominee` (child side), `public.get_entity_basic_data(uuid)`, `public.upsert_answers(uuid, jsonb, boolean)` (its own comment admits "Disjointness is a convention this function relies on and does not check"). Row 11 proves the consequence | Add an `entity_type` parameter to all five (see below). | P01 |

### PR #878 — dev-seed

| # | Comment id | Author | Anchor | Disp. | Evidence | Change / reply | Plan |
|---|---|---|---|---|---|---|---|
| 22 | C-4080515679 | Copilot | `assertKnownRowProps.ts` `unknownPropertyMessage` | **fix** | The message says "silently dropped" and points only to `LINK_SENTINELS or COLLECTION_NON_COLUMNS`. `permittedKeys.ts` also declares `TABLE_COLUMNS` and `RELATIONSHIP_REFS`. `tests/assertKnownRowProps.test.ts` asserts `/silently dropped/` | Reword: an unknown key is forwarded to `_bulk_upsert_record` and fails there as an unknown column. Name `TABLE_COLUMNS` (new DB column), `RELATIONSHIP_REFS` (FK ref), `LINK_SENTINELS`, `COLLECTION_NON_COLUMNS`. Update the test regex. | P10 |
| 23 | C-4080515718 | Copilot | `perm-closed-project.ts` `openForVoters: false` | split | `tests/tests/setup/shared/setupFromTemplate.ts`: `await writer.write(rows, prefix, { openForVoters: template!.openForVoters });` | Reply: #879 wires it. | ledger |
| 24 | C-4080515735 | Copilot | `cli/summary.ts` example | **fix** | Header line reads `Applied template: default (built-in) Seed: 42 … Elapsed: 6.21s Portraits uploaded: 100` on one line. The implementation pushes three separate lines | Restore the three-line example inside a fenced ```` ```text ```` block (required: see Pitfall 1). | P10 |
| 25 | C-4080515761 | Copilot | `FeedbackGenerator.ts` grammar | **fix** | "That limitation stands for as long as feedback seeding becomes useful." is present | "That limitation remains until feedback seeding becomes useful." Same file: "(migration lines 949–961)" (stale line ref), "per Claude's Discretion" (planning ref), "apply — see ElectionsGenerator.ts … (external_id prefix) does NOT apply" (broken reflow), "No `is_generated` column" (moot after P02). | P10 (+P02 touches) |
| 26 | C-4080515791 | Copilot | `QuestionCategoriesGenerator.test.ts` header | **fix** | "…spot-check The `_elections` join sentinel…" is present | Restore the sentence break. | P10 |

### PR #879 — E2E suite

| # | Comment id | Author | Anchor | Disp. | Evidence | Change / reply | Plan |
|---|---|---|---|---|---|---|---|
| 27 | C-4080508297 | Copilot | `emailBucket.fixture.ts` callback path | split | The route exists at `routes/api/candidate/auth/callback/+server.ts` (see row 5) | Reply. | ledger |
| 28 | C-4080508343 | Copilot | `admin-auth.setup.ts` grants vs `user_roles` | split | See row 10 (`passwordLogin.ts` gates on `readGrants`) | Reply. | ledger |
| 29 | C-4080508380 | Copilot | `perm-closed-project.teardown.ts` | **fix** | The body runs `unregisterCandidate` → `runTeardownAsserted` → `ensureProject()` with no `try/finally` | Wrap the deletes in `try { … } finally { await client.ensureProject(); }`. Hygiene: the header cites `162.1 D-21`, `162.1-05`. | P10 |
| 30 | C-4080508426 | Copilot | `admin-access.spec.ts` sentinel | split | `routes/+layout.server.ts` (added in `fa320cc33`, #881) returns `supabaseCookies` (name + value of every `sb-*` cookie), which is serialised into the page, so the `sb-*` NAME is in `page.content()`. The spec passed in the closing full-suite runs recorded in STATE (155/155) | Reply: #881's root loader serialises the Supabase auth cookies by design (they are `httpOnly: false`). The final E2E gate re-proves it. | ledger |
| 31 | C-4080508462 | Copilot | `axeScan.ts` import | split | `apps/frontend/src/lib/routes/route.ts` exists (ls) | Reply: `lib/routes/` lands in #880. | ledger |
| 32 | C-4080508490 | Copilot | `buildRoute.ts` imports | split | Same | Reply. | ledger |
| 33 | C-4080508533 | Copilot | `supabaseAdminClient.ts` roles import | split | `apps/frontend/src/lib/auth/roles.ts` exists and exports `ADMIN_GRANTS` | Reply. **P05 must keep the `ADMIN_GRANTS` export** (this E2E util imports its type). | ledger |

### PR #880 — frontend library layer

| # | Comment id | Author | Anchor | Disp. | Evidence | Change / reply | Plan |
|---|---|---|---|---|---|---|---|
| 34 | C-4080514940 | Copilot | `dataWriter.ts` singleton removal | split | `git grep "import { dataWriter\|dataWriter as dataWriterPromise" -- apps/frontend/src/routes` exit 1. The routes import `createDataWriter` | Reply: #881 converts the routes. | ledger |
| 35 | C-4080514990 | Copilot | `PasswordSetter.type.ts` `onValidityChange` | split | All three `<PasswordSetter` callers (settings, password-reset, register/password) pass `onValidityChange={({ valid, errorMessage }) => …}`. `bind:valid`/`bind:errorMessage` grep on those routes exit 1 | Reply. | ledger |
| 36 | C-4080515025 | Copilot | `authContext.type.ts` `setPassword` | split | `git grep currentPassword -- apps/frontend/src` exit 1. The callers pass `setPassword({ password })` | Reply. | ledger |
| 37 | C-4080515081 | Copilot | `requireVerifiedAdmin` not used | split | 6/6 `routes/api/admin/jobs/**/+server.ts` import and call `requireVerifiedAdmin(` | Reply. | ledger |
| 38 | C-4080515115 | Copilot | `convertFilterValue` throws on `[]` | split | `(voters)/(located)/+layout.ts`: `return value != null && (!Array.isArray(value) \|\| value.length > 0);`. `layout.load.test.ts` 4/4 pass (run this session) | Reply: #881 normalises at the route boundary. | ledger |
| 39 | C-4080515146 | Copilot | `electionRound` in nomination options | **fix** | `localServerDataProvider.getNominationData` destructures only `{ constituencyId, electionId, locale }`, and `warnIfUnsupported` checks only `includeUnconfirmed` | Filter `nominations` by `electionRound` (data field `electionRound`) when given. | P06 |
| 40 | C-4080515180 | Copilot | `constituencyId`/`electionRound` in question options | **fix** | `getQuestionData` reads only `electionId` | Apply the `get_questions` semantics to categories and questions independently: a row whose `constituencyIds`/`electionRounds` is null or empty applies to all (`filterData(… { includeMissing: true })`). Add unit tests. | P06 |
| 41 | C-4105280581 | kaljarv | `supabaseDataProvider.ts` helpers | **fix** | Top-level non-DP members: types `QuestionCategoryRow`, `QuestionRow`, `GetQuestionsPayload`; `function bySortOrderThenId` (the anchored line); `CUSTOMIZATION_PARSE_FAILURE_MESSAGE`, `SETTINGS_PARSE_FAILURE_MESSAGE`; `function parseStoredCustomization`. There are no helpers nested inside the methods | Move `bySortOrderThenId` → `supabase/utils/bySortOrderThenId.ts` (+ test). Move `parseStoredCustomization` + the two message consts → `supabase/utils/parseStoredCustomization.ts` (or a `dataProvider/` sibling). Move the row/payload types → `supabaseDataProvider.type.ts`. **Every new non-test adapter source must be added to `GUARDED_SOURCES` in `scripts/assert-project-scoped-queries.mjs`** (Check 5). | P06 |
| 42 | C-4105374348 | kaljarv | `idura.ts` keyword rename | **fix** | `types.ts` `export type ProviderType = 'signicat' \| 'idura';`. `constants.ts` `PUBLIC_IDENTITY_PROVIDER_TYPE: env.PUBLIC_IDENTITY_PROVIDER_TYPE ?? 'signicat'`. `IDURA_AUTH_CONFIG` / `SIGNICAT_AUTH_CONFIG` (FTN claims `hetu`, `birthdate`, `country`). Edge `PROVIDER_CONFIGS = { signicat: …, idura: … }` | See "Provider keyword rename surface" below. | P08 |
| 43 | C-4105438045 | kaljarv | `dataProvider.ts` adapter selection | **def** | The maintainer: "let's do this on a follow up phase after the initial ship" | File the todo (see "Deferred item"). No code. | P11 |
| 44 | C-4106561819 | kaljarv | `PasswordValidator.svelte` / app-shared `passwordValidation` | **fix** (verdict: frontend-only) | The only consumer is `PasswordValidator.svelte`: `import { minPasswordLength, validatePasswordDetails } from '@openvaa/app-shared';`. No supabase functions, dev-seed or tests import it (grep). The docs page claims "the backend also validates the password using the same `validatePassword` function", which is stale (Strapi era) | `git mv packages/app-shared/src/utils/passwordValidation{,.test}.ts apps/frontend/src/lib/utils/password-validation/`, drop the `app-shared` barrel line `export * from './utils/passwordValidation';`, update the import, and update the docs page (`candidate-user-management/password-validation/+page.md`: path links + remove the backend claim). Kebab-case directory precedent: `lib/dynamic-components`. | P05 |
| 45 | C-4106608766 | kaljarv | `ImagePart.svelte` style block | **fix** | `.locked-badge {text-secondary}`, `.required-badge {text-warning}`, `> span {sr-only}`, the same block duplicated in `Input.svelte` and `SelectMultiplePart.svelte` | Inline `text-secondary` / `text-warning` on the badge `div`s and `sr-only` on the `span`s. Delete the style block in all three files. | P04 |
| 46 | C-4106633861 | kaljarv | `roles.ts` supabase-types | **fix** | Audit (below): 8 frontend files import `@openvaa/supabase-types` outside `lib/api/adapters/supabase/` | Frontend-local `GrantScope`/`GrantRole`/`EntityType` literal unions in `roles.ts`, plus a parity test in `lib/api/adapters/supabase/` (mechanism below). | P05 |
| 47 | C-4106666404 | kaljarv | `QuestionChoices.svelte` narrative | **fix** (partial fix in quick 260922-dd8) | The const docblock says "This used to be a pair of stacked pseudo-class rules…". The style block says "NB. the styling of an option nobody picked is no longer here — …" | Delete both narratives. The docblock states only what the const is. | P04 |
| 48 | C-4106671920 | kaljarv | `QuestionChoices.svelte` link + interpolation | **fix** | `/** The checkbox form of {@link UNPICKED_DOT}: … */` and `const UNPICKED_DOT_CHECKBOX = \`${UNPICKED_DOT} rounded-sm\`;` | Remove the `{@link}` to the adjacent line. Build the checkbox form with `cn(UNPICKED_RADIO, 'rounded-sm')`. | P04 |
| 49 | C-4106679567 | kaljarv | `QuestionChoices.svelte` naming | **fix** | Consts are `UNPICKED_DOT`, `UNPICKED_DOT_CHECKBOX`. The only references are within the file (`git grep UNPICKED_DOT` outside `.planning` → QuestionChoices.svelte only) | Rename to `UNPICKED_RADIO`, `UNPICKED_CHECKBOX`. | P04 |
| 50 | C-4106737701 | kaljarv | `prepareDataWriter.ts` caching | **fix** (verdict: no writer cache exists or is useful; docstring change only) | `prepareDataWriter()` returns `createDataWriter({ fetch, browser: true })`, and `createDataWriter` returns `new SupabaseDataWriter(resolveAdapterConfig(source))`, so every call is FRESH. The only memo on the path is the per-tab Supabase client (`lib/supabase/browser.ts` `let browserClient`, over `@supabase/ssr`'s own `cachedBrowserClient`), which must stay. A writer cache would buy nothing in the browser (construction is trivial, with no I/O) and would reintroduce the cross-request singleton hazard server-side, since `createDataWriter` also serves server loads (`resolveAdapterConfig`'s `locals` arm) | Record the verdict. Tighten both docstrings (drop "nineteen call sites" count prose and the "older justification … is false: … Do not restore it" narrative in `dataWriter.ts`). | P06 |
| 51 | C-4106783651 | kaljarv | `voterContext.svelte.ts` `sameRefs` | **fix** | Module-level `function sameRefs` with a long narrative comment ("Svelte 4 stores absorbed this via `writable.set()`'s no-op-write skip; …observed in the browser as…"). 2 call sites in `voterContext.svelte.ts` | Move to `lib/contexts/utils/sameRefs.ts` (+ `sameRefs.test.ts`) with a one-line docblock (shallow reference equality for arrays). Import in `voterContext`. | P07 |
| 52 | C-4106826598 | kaljarv | `Header.svelte` style blocks, repo-wide | **fix** | Inventory below: 22 component files + 4 route files with `<style>` | Inline per the classification. Genuine-CSS residue stays. | P04 |
| 53 | C-4106923157 | kaljarv | `utils/components.ts` `SPACING_WORD_NAMES` duplication | **fix** (verdict: not removable via theme variables; replace the manual obligation with a drift test) | tailwind-merge 3.7.0's default theme: `spacing: ['px', isNumber]` (`node_modules/tailwind-merge/dist/bundle-mjs.mjs`, `const themeSpacing = fromTheme('spacing')`). Every spacing group resolves through it, so a word-named class like `p-xs` is unrecognised unless declared. `app.css` defines `--spacing-xs: 0.25rem` etc. Any rename that tailwind-merge could recognise without declaration would have to be numeric, which changes the `p-xs` class name the codebase uses | Keep the lists. Add a test in `components.test.ts` that parses `app.css`'s `--spacing-*` and `--border-width-*` word names and asserts set-equality with `SPACING_WORD_NAMES` / `BORDER_WIDTH_WORD_NAMES`. Remove the "STANDING MAINTENANCE OBLIGATION" prose (now enforced). Flag this verdict to the maintainer in the ledger reply. | P07 |
| 54 | C-4106942130 | kaljarv | `focusNavigationTarget.ts` cancel on pointer | **fix** (verdict: feasible) | The wait is cancelled only by focus change or timeout (`FOCUS_TARGET_WAIT_MS = 10_000`). A capture-phase **passive** `pointerdown` listener on `doc` that only calls `cancel()`, never `preventDefault`/`stopPropagation`, cannot alter any other handler or default action [CITED: developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener: `passive` listeners cannot call `preventDefault()`; a listener that does not stop propagation leaves dispatch to other listeners unchanged] | Add `doc.addEventListener('pointerdown', cancel, { capture: true, passive: true, once: true })` when the wait begins, and remove it in `cancel()`. Use `pointerdown` only, not `pointermove` (hover jitter would cancel for mouse users who do not interact). Keep 10 s (the 5 s fallback applies only "if not possible"). Tests: pointerdown during the wait → a later-rendered target is not focused; a sibling listener still receives the event with `defaultPrevented === false`. | P07 |
| 55 | C-4106960010 | kaljarv | `logLevel.ts` prose | **fix** | Docblocks cite `157.1-02-PLAN.md`, `157.1-RESEARCH.md § …`, `D-DISC-1/2`, `C3`, `P3`, `T-157.1-04`, `D9`, "this phase exists to close" | Rewrite every comment to one or two sentences stating the contract (the four emittable levels, missing vs invalid, never throws, configure-then-emit order). | P07 |

### PR #881 — routes

| # | Comment id | Author | Anchor | Disp. | Evidence | Change / reply | Plan |
|---|---|---|---|---|---|---|---|
| 56 | C-4080520474 | Copilot | `layout.load.test.ts` mock | **fix** (Copilot's "fails at link" is wrong, but the mock is stale) | The test passes 4/4 at the tip (vitest run this session): vitest mocks throw only on *access* of a missing export, and the redirect paths never touch the provider. The mock still exports only the removed `dataProvider` singleton, while `+layout.ts` imports `{ createDataProvider, createSupabaseUniversalClient }`. The `getQuestionData`/`getNominationData` spies are dead | Mock `createDataProvider: () => ({ getQuestionData, getNominationData })` and `createSupabaseUniversalClient: vi.fn()`, so a regression that falls through the guard fails on the spy assertion rather than on "No export defined on mock". Rewrite the `REGRESSION (157 review, Lot B CR-05)` header. | P09 |
| 57 | C-4080520522 | Copilot | `$layouts` alias | split | `svelte.config.js` `alias: { …, $layouts: path.resolve('./src/lib/layouts') }` and `vitest.config.ts` `{ find: '$layouts', … }` | Reply: #882 registers it. | ledger |
| 58 | C-4080520561 | Copilot | `$layouts` alias | split | Same | Reply. | ledger |

### PR #882 — app shell

| # | Comment id | Author | Anchor | Disp. | Evidence | Change / reply | Plan |
|---|---|---|---|---|---|---|---|
| 59 | C-4080502788 | Copilot | `apps/frontend/.env.example` → root `PUBLIC_PROJECT_ID` | split | Root `.env.example`: `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001`, added in `95eecbc26` (#886) | Reply. | ledger |
| 60 | C-4080502829 | Copilot | `hooks.server.ts` double `safeGetSession` | **fix** | `supabaseHandle` defines `safeGetSession` with no memo (`getSession()` then a network `getUser()`). The gate calls it, and `admin/+layout.server.ts` (`const { session, user } = await locals.safeGetSession();`) calls it again | Memoise the **`getUser()` verification per access token**: call `getSession()` (local, cheap) every time, and cache `{ token → Promise<verified result> }` in the closure. **Do NOT memoise the whole result.** The login action calls `context.getSession()` *after* `signInWithPassword` in the same request (`passwordLogin.ts`), after the hook already saw `session: null` on that route. Add a unit test in `hooks.server` tests or a small extracted helper: two calls → one `getUser`; a token change between calls → re-verify. | P09 |
| 61 | C-4080502860 | Copilot | `vite.projectIdEnv.ts` `loadEnv` overlay | **fix** | Vite 6.4.1 `loadEnv` (`node_modules/vite/dist/node/chunks/config.js`): `for (const key in process.env) if (prefixes.some(…)) env[key] = process.env[key];` runs **after** the parsed files, so `PUBLIC_PROJECT_ID=''` in the shell shadows the file value | Before `loadEnv`, delete the two keys from the env overlay when they are `''` (or parse the env files directly with `node:util` `parseEnv` in Vite's precedence order). Add a test that sets `process.env.PUBLIC_PROJECT_ID = ''`. Also fix the stale docstring, which claims `kit.env.dir` defaults to `process.cwd()` although `svelte.config.js` pins `env: { dir: repoRoot }`. | P09 |

### PR #883 — i18n: no inline comments.

### PR #884 — docs

| # | Comment id | Author | Anchor | Disp. | Evidence | Change / reply | Plan |
|---|---|---|---|---|---|---|---|
| 62 | C-4080518476 | Copilot | `routing/+page.md` `$getRoute` | **fix** | The page links `contexts/app/getRoute.ts` and shows `$getRoute('Results')`. The tip has `getRoute.svelte.ts`, and `appContext.type.ts` declares `getRoute: { readonly current: RouteBuilder };` | Link `getRoute.svelte.ts`. Use `getRoute.current('Results')` / `getRoute.current({ route: 'Results', electionId: [...] })`. Drop "and `lang`" (the locale is a Paraglide URL strategy, not a route param). | P10 |

### PR #885 — experimental packages

| # | Comment id | Author | Anchor | Disp. | Evidence | Change / reply | Plan |
|---|---|---|---|---|---|---|---|
| 63 | C-4080487670 | Copilot | `condenseQuestions.test.ts` `.flat()` | **fix** | `Condenser.run()` returns `data: { arguments: currentData as Array<Argument> }` where `currentData` may be `Array<Array<Argument>>`. The test's own comment says "nested one level deeper than its declared `Array<Argument>` type … a known defect of the product path … deliberately NOT fixed". The frontend consumer (`condenseArguments.ts`) maps `({ id, text })` | Flatten in `Condenser.run()` before `setFinalArguments` and before the return (a guard: `Array.isArray(x[0]) ? x.flat() : x`). Remove `.flat()` and the comment block from the test. Add an assertion that the MAP-terminated path returns a flat array. | P10 |
| 64 | C-4080487730 | Copilot | `generateBoth.yaml` coverage | **fix** | `questionTypes.test.ts` already has a request-capturing helper (`generateObjectParallel.mock.calls[0]` → `request.messages[0].content`), but the mixed-question test only checks ids/sections | In the "both operations" mixed test, capture the composed prompts and assert each contains its question type and joined choice labels. | P10 |
| 65 | C-4080487775 | Copilot | `api.ts` `handleQuestion` example | **fix** | The JSDoc has `@example import { handleQuestion } … import type { HasAnswers } …` on one line and `// 1. Set up … // You'll most likely … const question = new BooleanQuestion({` | Restore from the stack base `git show cb763388a:packages/argument-condensation/src/api.ts` (multiline), **inside a ```` ```ts ```` fence**. | P10 |
| 66 | C-4080487819 | Copilot | `condenser.ts` example | **fix** | `@example import { Condenser } … import type { CondensationRunInput } …` collapsed | Same method. | P10 |
| 67 | C-4080487851 | Copilot | `condensationInput.ts` examples | **fix** | `id: '123', entityId: '456', entityAnswer: 1, // number or string text: 'This is a comment' };` and three more collapsed examples in the same file (the Copilot note mentions line 26) | Same method, all examples in the file. | P10 |
| 68 | C-4080487884 | Copilot | `condensationResult.ts` example | **fix** | `… totalTokens: 13500 } // Optional: reasoningTokens, cachedInputTokens }, success: true, …` | Same method. | P10 |
| 69 | C-4080487924 | Copilot | `promptRegistry.ts` examples | **fix** | Three collapsed `@example`s (`// In feature's prompts.ts: registerPrompts({`, `// Anywhere in the feature code: const { promptText } = …`, `@example // In packages/my-feature/src/prompts.ts: import …`) | Same method. **Same class also in `packages/llm/src/prompts/index.ts`** (`@example // Register prompts … import { registerPrompts, …`). Fix it too. A class scan (`git grep -P '^\s*\*\s.*//\s.*\b(const\|import\|await\|let)\s'`) finds 9 lines, all in these 6 files. | P10 |

### PR #886 — root tooling

| # | Comment id | Author | Anchor | Disp. | Evidence | Change / reply | Plan |
|---|---|---|---|---|---|---|---|
| 70 | C-4080504623 | Copilot | `.env.example` anon-key placeholder | **fix** | `.env.example`: `PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>`, `SUPABASE_ANON_KEY=<your-supabase-anon-key>` (`git log -S` → `95eecbc26`; the base had the demo JWT). The `main.yaml` E2E jobs run `cp .env.example .env` → `supabase start` → `yarn workspace @openvaa/frontend dev &` with no key export. Only the integration job exports `supabase status -o env` keys | In both E2E jobs, add a step after `supabase start` that reads `supabase status -o env` (`ANON_KEY`, `SERVICE_ROLE_KEY`, guarded by `test -n`, the same shape as the integration job) and rewrites the placeholder lines in `.env` (and exports them to `$GITHUB_ENV`). Keep the placeholders in `.env.example`: the demo JWT was replaced, presumably for the secret-scan gate (A5). | P10 |
| 71 | C-4080504664 | Copilot | `.env.example` service-role placeholder | **fix** | `SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>`. The same two jobs | Same step (one commit answers both threads). | P10 |
| 72 | C-4080504697 | Copilot | `assert-edge-function-env.mjs` `TS_FAMILY` | **fix** | `const TS_FAMILY = { slash: true, blockC: true, template: true };`. The classifier reads only `fam.c`/`fam.sql`/`fam.hash`/`fam.html` (`scripts/lib/comment-spans.mjs`). **Probe:** `commentMapOf('const a = 1; // Deno.env.get("X")\n/* Deno.env.get("Y") */', TS_FAMILY).spans` → `[]`; with `{c:true}` → `[[13,33],[34,57]]` | `const TS_FAMILY = { c: true };`. Re-run `yarn assert:edge-function-env` and check the derived required-name set (it may shrink if some names were only in comments). Add a self-test fixture line. | P10 |
| 73 | C-4080504728 | Copilot | `keygen.ts` usage backslashes | **fix** | Tip: `--kid <id> \ [--alg <name>] \ [--size <bits>]   Default: …`. The base had one option per line | Restore one option per line inside a ```` ```sh ```` fence (the unfenced form re-collapses under `assert:comment-hygiene` Rule 2; see Pitfall 1). | P10 |

### PR #887 — planning record (`.planning/` is hygiene-exempt, but the factual errors are real)

| # | Comment id | Author | Anchor | Disp. | Evidence | Change / reply | Plan |
|---|---|---|---|---|---|---|---|
| 74 | C-4080515788 | Copilot | `163-VALIDATION.md` untouched template | **fix** | The table still reads `{pytest 7.x / jest 29.x / vitest / go test / other}`, `` `{quick command}` ``, `~{N} seconds` | Fill it from 163's actual commands (`yarn db:lint:sql`, `yarn lint:check`, secret-scan and audit jobs) or record explicitly that Nyquist validation was not performed. | P11 |
| 75 | C-4080515841 | Copilot | `…-empty-answer-candidate-states-unscanned.md` premise | **fix** (correct the evidence) | The todo claims "every `e2e/base` candidate carries answers — measured: `grep 'answersByExternalId: {}'` … 0 hits", but `base.ts`'s unregistered candidate has `NO answersByExternalId`. That candidate has no auth user, so it cannot drive the logged-in `/candidate/questions` scan, and the conclusion (a *registered* answerless candidate is needed) stands | Rewrite the evidence line. | P11 |
| 76 | C-4080515881 | Copilot | `…-scan-determinism-is-a-bound-not-an-absence.md` math | **fix** | "Three green runs clear a 1-in-20 defect with probability ≈ 0.86 — i.e. … roughly a one-in-seven chance of hiding". 0.95³ ≈ 0.857 is the probability of **hiding**; four runs → 0.95⁴ ≈ 0.81 | Correct the numbers and conclusion. | P11 |
| 77 | C-4080515920 | Copilot | `…-ci-frontend-does-not-read-root-env.md` | **fix** | Premise "`kit.env.dir` defaults to `process.cwd()`". `svelte.config.js` sets `env: { dir: repoRoot }` | Move to `todos/completed/` (or `done/`) with a resolution note. The residual anon-key point is rows 70/71. | P11 |
| 78 | C-4080515954 | Copilot | `2026-09-03-ci-e2e-ssr-500.md` trigger claim | **fix** | "`main.yaml` only triggers on `main`". `main.yaml` `on.push.branches` includes `"ci-evidence/**"` | Reword to state both triggers. | P11 |

**Counts (derived from the table above):**

| Disposition | Rows |
|---|---|
| fix | 50 (rows 1, 2, 7, 9, 11, 18–22, 24–26, 29, 39–42, 44–56, 60–78) |
| split-artifact | 25 (rows 3, 4, 5, 8, 10, 12, 14, 15, 16, 17, 23, 27, 28, 30–38, 57, 58, 59) |
| already-fixed | 1 (row 13) |
| wont-fix | 1 (row 6) |
| deferred | 1 (row 43) |

## Architecture Patterns

### System Architecture Diagram (data flow of the three schema changes)

```
 PostgREST request (anon / authenticated JWT with `grants` claim)
        │
        ▼
 RLS policy on {candidates|organizations|factions|alliances}
   user_can('entity', id, perm)                    ◀── TODAY: type-blind
   user_can('entity', id, perm, '<table type>')    ◀── P01: type passed as literal per table
        │
        ▼
 user_can ── g_scope global/account/project ──▶ private.entity_project_id(type, id)  (CASE per table, no UNION)
          └─ g_scope entity ──▶ g_target_type = p_target_type AND g_target_id = p_target_id
                               └─ nomination.read branch ─▶ is_child_nominee(parent_type, parent_id, child_type, child_id)
        │
        ▼
 RPCs: get_entity_basic_data(type,id) · upsert_answers(type,id,answers,overwrite)
        ▲
        └── frontend SupabaseDataWriter._setAnswers passes p_entity_type (it already has target.type)

 schema/*.sql ──yarn schema:regenerate──▶ migrations/00001_initial_schema.sql ──yarn db:reset──▶ local DB
        ──yarn db:types──▶ packages/supabase-types/src/database.ts ──▶ dev-seed (TablesInsert), adapter, column-map
```

### Recommended Project Structure (new/moved files only)

```
apps/frontend/src/lib/
├── api/adapters/supabase/
│   ├── utils/bySortOrderThenId.ts (+ .test.ts)         # from supabaseDataProvider.ts (C-4105280581)
│   ├── utils/parseStoredCustomization.ts (+ .test.ts)  # helper + 2 message consts
│   └── supabaseTypes.parity.test.ts                    # frontend grant/entity types vs Enums/Constants (C-4106633861)
├── contexts/utils/sameRefs.ts (+ .test.ts)             # from voterContext.svelte.ts (C-4106783651)
└── utils/password-validation/passwordValidation.ts (+ .test.ts)   # from packages/app-shared (C-4106561819)
.planning/todos/pending/2026-09-27-adapter-selection-entrypoints.md  # D-03
.planning/phases/165-…/165-LEDGER.md                              # 78 rows + review-body section
.planning/phases/165-…/scripts/hygiene-changed-files.sh           # per-changed-file gate (phase-local, exempt)
```

### Entity-type-aware authorization (rows 11 + 21, plan P01)

What changes, with the call-site census verified this session:

1. `public.user_can(p_scope, p_target_id, p_permission, p_target_type public.entity_type DEFAULT NULL)`.
   - At `p_scope = 'entity'`: deny when `p_target_type IS NULL`.
   - Entity grant reach becomes `g_target_type = p_target_type::text AND p_target_id = g_target_id`.
   - Global/account/project arms call the typed `entity_project_id`.
   - Named branch 1 (project-read) uses `g_target_type` (the grant's own type).
   - Named branch 2 passes `p_target_type` as the child type.
2. `private.entity_project_id(p_entity_type, p_entity_id)` becomes a `CASE p_entity_type WHEN 'candidate' THEN (SELECT … FROM candidates …) …`, with no `UNION ALL … LIMIT 1`.
3. `private.is_child_nominee(p_parent_type, p_parent_id, p_child_type, p_child_id)` matches the child's FK column by type.
4. `public.get_entity_basic_data(p_entity_type, p_entity_id)` becomes a single typed probe. There is no frontend caller (grep: tests only).
5. `public.upsert_answers(p_entity_type, p_entity_id, p_answers, p_overwrite)` updates only the named table (candidates/organizations; other types raise). The frontend `supabaseDataWriter._setAnswers` already has `target: { type, id }` and passes `p_entity_type: type`. Update the `upsert_answers` disposition text in `scripts/assert-project-scoped-queries.mjs` (`upsert_answers: 'scoped-by-identity: entity id + RLS'`) and in `user_can`'s entry.

Call sites to update:
- **20** `user_can('entity', …)` in `schema/` (verified count). These sit in 302-rls.sql (14 policies: pass the table's literal type), 011-validation-functions.sql (2, inside `enforce_entity_immutability`: map `TG_TABLE_NAME` → type), 400-storage.sql (`v_type`), 503-entity-rpcs.sql (2), plus comment mentions.
- `entity_project_id` call sites: 302-rls.sql (3, nominations policies: pass `entity_type` of the nomination row, which is a generated column) and 502-email-helpers.sql (1: `g.target_type`).
- pgTAP files touching these functions: 05, 07, 10, 12, 17, 18, 19, 20, 25, 28, 29.
- **Structural tests parse policy text:**
  - `22-content-policies` has a policy-to-permission map;
  - `25-matrix-conformance`;
  - `29-authenticated-disjunct-order`.

  Their regexes must learn the 4-arg shape.
- Add a **collision negative control**: two projects, a candidate and an organization sharing one UUID, and `user_can` for each side's admin/entity grant denies the other.
- Regenerate the migration + `yarn db:types`. Run `yarn assert:rpc-nullability`, `yarn assert:grant-permission-enum` and `yarn assert:project-scoped-queries` (all part of `lint:check`).

[VERIFIED: rolled-back psql probe against `supabase_db_openvaa-local`, whose `user_can` source contains the tip's `Half 2: reach` and `NAMED BRANCH 2` comment strings]

### is_generated removal surface (row 19, plan P02) — "no historical traces"

`git grep -c is_generated` census (excluding `.planning`):

- **Schema:** `101-elections.sql` (3 tables), `102-entities.sql` (4), `103-questions.sql` (2), `104-nominations.sql` (1) = 10 tables (matches the live DB count `10`). Also the comment lists in `303-column-grants.sql` (4) and `503-entity-rpcs.sql` ("Withheld today: … is_generated …").
- **Migration:** `apps/supabase/supabase/migrations/00001_initial_schema.sql`, regenerated with `yarn schema:regenerate`. Never hand-edit it.
- **Types:** `packages/supabase-types/src/database.ts` (regenerated) and `packages/supabase-types/src/column-map.ts` (`is_generated: 'isGenerated'`, remove).
- **dev-seed:**
  - 9 generators (`is_generated: true`);
  - `template/permittedKeys.ts` (10 table lists);
  - `templates/default.ts` (19), `templates/e2e/base.ts` (81), 13 `templates/e2e/perm/*.ts`, `templates/_helpers/buildMinimal.ts`, 3 `templates/defaults/*-override.ts`;
  - tests `locales.test.ts`, `templates/default.test.ts`, and 4 `tests/fixtures/negctl-*.ts`;
  - `FeedbackGenerator.ts` comment.
- **pgTAP:** `09-column-restrictions.test.sql` (2 assertions + header list). Adjust the `plan(N)`.
- **Frontend:** `apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.test.ts` (2).
- **Agent docs (exempt from hygiene but must stay true):** `.claude/skills/database/schema-reference.md` (11), `SKILL.md` (3), `extension-patterns.md` (1).
- **KEEP** `@openvaa/data`'s `isGenerated`. It is a data-model concept (generated implied alliances/nominations: `nomination.ts`, `allianceNomination.ts`, `factionNomination.ts`) and is independent of the DB column.
- **Runtime:** `yarn db:reset` (local and E2E DBs carry the column until reset).

### Column order (row 18, plan P02)

Keep organizations as the reference, minus `is_generated`:

```
id, project_id, auth_user_id, name, short_name, info, color, image, sort_order, subtype, custom_data, confirmed, created_at, updated_at, answers, external_id
```

- **Candidates:** `id, project_id, auth_user_id, first_name, last_name, short_name, info, color, image, sort_order, subtype, custom_data, confirmed, terms_of_use_accepted, created_at, updated_at, answers, external_id`. The placement of `terms_of_use_accepted` right after `confirmed` is at the planner's discretion.
- **Factions:** `id, project_id, organization_id, name, …, custom_data, confirmed, created_at, updated_at, external_id`.
- **Alliances:** already conform once `is_generated` goes.

PostgreSQL cannot reorder columns in place. That is acceptable because no database has been published (`seed.sql` comment), so the single regenerated initial migration is the whole change.

### Column documentation inventory (row 20, plan P03)

Convention: one concise `--` line directly above the column. No `COMMENT ON` exists in the repo. Name the JSONB shape by its app-shared schema or type. Tables (17): `accounts`, `projects`, `elections`, `constituency_groups`, `constituencies`, `organizations`, `candidates`, `factions`, `alliances`, `question_categories`, `questions`, `nominations`, `app_settings`, `feedback`, `admin_jobs`, `grants`, `storage_config` (+ `private.feedback_rate_limits`).

- **JSONB, by shape:**
  - `name`/`short_name`/`info` on 9 content tables + nominations: localized string `{ "<locale>": string }`.
  - `constituencies.keywords`: a localized string of comma-separated keywords (split in `supabaseDataProvider`).
  - `color`: the `Colors` object (`packages/data/src/core/colors.type.ts`).
  - `image`: `StoredImage` (app-shared `storedImage.schema.ts`).
  - `custom_data`: a free-form object, per table.
  - `answers` (candidates, organizations): `StoredAnswers`, keyed by question id (`storedAnswers.schema.ts`).
  - `questions.choices`: the array of choice objects.
  - `questions.settings`: per-type settings.
  - `election_ids`/`constituency_ids` on questions and categories: a uuid array. `election_rounds`: an int array. `entity_type`: an array of `entity_type`. For all four, null or empty means "applies to all".
  - `app_settings.settings`: `StoredSettings`. `app_settings.customization`: `StoredCustomization`.
  - `admin_jobs.input/output/messages/metadata`.
- **Non-self-evident scalars:**
  - `projects.default_locale`, `open_for_voters`, `lock_nominations`;
  - `*.sort_order`, `*.subtype`, `*.external_id` (the idempotent-import key, immutable);
  - `elections.election_date`/`election_start_date`/`multiple_rounds`/`current_round`/`election_type` (nomination_shape);
  - `constituencies.parent_id`;
  - `*.auth_user_id`, `*.confirmed`, `candidates.terms_of_use_accepted`;
  - `nominations.created_by`/`entity_type` (generated)/`election_round`/`election_symbol`/`parent_nomination_id`;
  - `question_categories.category_type`;
  - `questions.type`/`allow_open`/`required`;
  - `feedback.date` vs `created_at`;
  - `admin_jobs.job_id`/`job_type`/`author`/`end_status`;
  - `grants.scope`/`target_type`/`target_id`/`role`.
- Also restore the **collapsed header lists** in SQL files (a reflow regression class): `000-enums.sql` header, `301-auth-functions.sql` "Functions:" header, `303-column-grants.sql` per-table protected-column lists, `400-storage.sql` "Depends on", `503-entity-rpcs.sql` "Functions:". Use `-- - item` bullets so Rule 2 (`NEXT_IS_LIST_ITEM`) keeps them on separate lines.

### supabase-types import audit (row 46, plan P05)

`git grep "@openvaa/supabase-types"` outside `lib/api/adapters/supabase/` and `packages/supabase-types`:

- **Frontend (8 files):**
  - `src/app.d.ts` (`Database`, for `Locals.supabase`);
  - `src/lib/api/dataProvider.ts` (`Database`);
  - `src/lib/auth/roles.ts` (`Enums`);
  - `src/lib/supabase/{anon,browser,job,server,universal}.ts` (`Database`, typing the Supabase client factories).
- **dev-seed:** about 35 files. Seeding is Supabase-bound by design (it writes via the Supabase admin client). Keep it.
- **E2E:** `tests/tests/utils/supabaseAdminClient.ts` (`PROPERTY_MAP, TABLE_MAP`). This is the E2E Supabase admin client. Keep it.
- **Docs:** `apps/docs/…/app-and-repo-structure/+page.md` (a mention only).

Recommendations:

- **`roles.ts`:** define `GRANT_SCOPES = ['global','account','project','entity'] as const`, `GRANT_ROLES = ['admin','editor'] as const` and `ENTITY_TYPES = ['candidate','organization','faction','alliance'] as const` (or reuse `@openvaa/data`'s entity-type union if one exists as a runtime value), with the types derived from them. Keep the exports `ADMIN_GRANTS`, `CANDIDATE_GRANTS`, `GrantClaim`, `GrantShape`, `readGrants`, `hasAnyGrant` (`tests/tests/utils/supabaseAdminClient.ts` imports `ADMIN_GRANTS`).
- **Parity test**, e.g. `lib/api/adapters/supabase/supabaseTypes.parity.test.ts`:
  - (a) runtime: `expect([...GRANT_SCOPES].sort()).toEqual([...Constants.public.Enums.grant_scope_type].sort())` and likewise for the other two. `Constants` is exported by `@openvaa/supabase-types` and has `entity_type: ['candidate', 'organization', 'faction', 'alliance']`.
  - (b) type-level: `expectTypeOf<GrantScope>().toEqualTypeOf<Enums<'grant_scope_type'>>()`. This is enforced by `svelte-check` in `yarn typecheck`, which covers `src/**/*.ts` including tests. There is no `expectTypeOf` precedent in the repo, so (a) is the load-bearing half.
- **`app.d.ts`, `lib/api/dataProvider.ts`, `lib/supabase/*`:** these type Supabase *clients*. They are Supabase plumbing by nature, not domain types. Recommended: re-export a `SupabaseDatabase`/client-type alias from the adapter (`lib/api/adapters/supabase/supabaseAdapter.type.ts`), so non-adapter code imports the adapter module rather than `supabase-types`. Record in the ledger that moving `lib/supabase/` and `Locals.supabase` behind the adapter belongs to the deferred D-03 adapter-selection work. **Open question Q2:** confirm this boundary with the maintainer.

### Style-block inventory (row 52, plan P04)

26 real blocks. The two `.test.ts` hits contain the string only. Classification (inlinable ✓ / partial ◐ / genuine-CSS ✗):

| File | Content | Class | Inline form |
|---|---|---|---|
| components/alert/Alert.svelte | `.vaa-alert-hidden` translate/opacity | ✓ | `translate-y-full opacity-0` via `cn(hidden && …)` |
| components/button/Button.svelte | label dimmed under `[disabled]`/`[aria-disabled]`/`.disabled` parent | ✓ | `group` on the button; label `group-disabled:text-neutral/20 group-aria-disabled:text-neutral/20 group-[.disabled]:text-neutral/20` |
| components/expander/Expander.svelte | rotate/transition; DaisyUI collapse padding + min-height overrides | ◐ | `rotate-90`/`rotate-270 transition-transform duration-200 ease-linear`; `min-h-0`; the `.collapse … input:checked ~ .collapse-content` padding may need `peer`/arbitrary variant or stay |
| components/input/Input.svelte, input/parts/ImagePart.svelte, input/parts/SelectMultiplePart.svelte | badge colours + `> span` sr-only | ✓ | classes on the elements |
| components/input/InputGroup.svelte | `:global(.vaa-input-container > :not(:first-child) .vaa-group-join-item)` rounded | ◐ | arbitrary variant on the container `[&>:not(:first-child)_.vaa-group-join-item]:rounded-t-none` (readability trade-off) |
| components/questions/NumberScaleInput.svelte | `input[type=range]` height/cursor; `.marker` | ✓ | classes on the input and markers (`disabled:cursor-default`) |
| components/questions/QuestionChoices.svelte | fieldset/label grid variants by `.vertical`; `.display-label` variants; `input.entitySelected:disabled:not(:checked)` double inset shadow | ◐ | conditional `cn(vertical ? … : …)`; the shadow is expressible as `shadow-[inset_0_0_0_4px_var(--color-base-100),inset_0_0_0_4px_var(--color-base-100)]` on a predicate |
| components/questions/QuestionOpenAnswer.svelte | `before:` gradient when collapsed | ✓ | conditional `before:*` classes |
| components/scoreGauge/ScoreGauge.svelte | `--progress-color` light/dark media, vendor `::-moz-progress-bar`/`::-webkit-progress-value`, DaisyUI `.radial-progress:before` gradient override, lg custom props | ✗/◐ | the custom props → `[--progress-color:var(--meter-color)] dark:[--progress-color:var(--meter-color-dark)]` (Tailwind v4 `dark:` = `prefers-color-scheme`); **keep** the `radial-progress:before` gradient and vendor pseudo-elements as CSS |
| components/toggle/Toggle.svelte | `label:has(input:checked)` | ✓ | `has-checked:bg-neutral has-checked:text-primary-content` |
| components/video/Video.svelte | `:global(video::cue)`, webkit media text-track pseudo-elements, `.video-transcript` descendant styling of injected HTML | ✗ | keep (global/pseudo-element styling of content the component does not author) |
| dynamic-components/entityCard/EntityCard.svelte | `after:` border; `.hover-shaded` | ✓ | classes; `class:hover-shaded` → `cn(shadeOnHover && '…')`. **`entityCard/tests/hoverShadedRule.test.ts` asserts `.hover-shaded {` is declared in a style block. It must be rewritten to assert the classes on the element, or retired.** |
| dynamic-components/entityDetails/{EntityDetails,EntityInfo,InfoItem}.svelte | `after:` border; group layout; grid variants | ✓ | classes |
| dynamic-components/navigation/NavItem.svelte | disabled states | ✓ | `disabled:`, `aria-disabled:`, `[&.disabled]:` variants |
| layouts/main/Banner.svelte | `:global(.vaa-basicPage-actions > a:not([aria-disabled]) …)` colour | ◐ | arbitrary variant on the actions container, if Banner owns it; else keep |
| layouts/main/Header.svelte | progress `border-radius: 0` (+3 vendor pseudo), top-bar min-height transitions, prominent background-image from CSS vars, inner-actions bg transition | ◐ | `transition-[min-height] duration-250 ease-out`, `min-h-[40vh] items-start bg-(image:--image) bg-size-(--background-size) bg-position-(--background-position) bg-no-repeat`, `bg-base-300 bg-(--background-color) transition-colors duration-500`; `rounded-none` + `[&::-webkit-progress-bar]:rounded-none` etc. |
| routes/+layout.svelte | reduced-motion `::view-transition-*` | ✗ | keep (the file's own "LANDMINE" note stands) |
| routes/(voters)/privacy/+page.svelte | `h2` spacing | ✓ | classes on the `h2`s (or a `[&_h2]` variant on the wrapper if the markup is injected) |
| routes/candidate/(protected)/profile/+page.svelte | `section` spacing | ✓ | classes |
| routes/candidate/(protected)/questions/+page.svelte | `.grid-line-x` `before:` border line | ✓ | classes |

Sizing:
- About 19 of 26 are fully or mostly inlinable.
- 3 stay CSS: `+layout.svelte`, Video, the ScoreGauge core.
- About 4 are partial.
- `MainContent.svelte` has **no** style block, so D-05's stop condition does not fire.
- Visual risk lives in the E2E visual/a11y projects. Run the full suite after this plan.

### Provider keyword rename surface (row 42, plan P08)

- **Values:** `'idura'` → `'idura-ftn'`, `'signicat'` → `'signicat-ftn'`. They appear in:
  - `providers/types.ts` (`ProviderType`);
  - `idura.ts`/`signicat.ts` (`type:` literals);
  - `providers/index.ts` (switch + error text);
  - `lib/utils/constants.ts` (default `'signicat'`);
  - `routes/candidate/preregister/+page.svelte` (`=== 'idura'`);
  - `oidcFailure.ts` (docs);
  - `identity-callback/claimConfig.ts` (`PROVIDER_CONFIGS` keys) and `identity-callback/index.ts` (validation/docs, stored `app_metadata.identity_provider`);
  - root `.env.example` (`PUBLIC_IDENTITY_PROVIDER_TYPE=signicat`, `IDENTITY_PROVIDER_TYPE=signicat`, section headers);
  - `apps/supabase/supabase/functions/.env.example` (`IDENTITY_PROVIDER_TYPE=idura`);
  - `tests/IDURA-TEST-RUNBOOK.md` (6);
  - E2E `candidate-bank-auth(-journey).spec.ts` (`toBe('idura')`);
  - unit tests (`idura.test.ts`, `signicat.test.ts`, `claimConfig.test.ts`, `token-endpoint.test.ts`, `authorize-endpoint.test.ts`, `authorize-fail-closed.test.ts`, `oidcFailure.test.ts`, `decryptAndVerifyIdToken.test.ts`, fixtures).
- **Finnish-specific configs:** `IDURA_AUTH_CONFIG` → `IDURA_FTN_AUTH_CONFIG` and `SIGNICAT_AUTH_CONFIG` → `SIGNICAT_FTN_AUTH_CONFIG` (claims `hetu`, `birthdate`, `country` are FTN-specific). The edge `PROVIDER_CONFIGS` entries are keyed by the new keywords.
- **Stay generic:** `iduraProvider`/`signicatProvider`, the file names, and `IDURA_DOMAIN`/`IDURA_SIGNING_JWKS`/`IDURA_SIGNING_KEY_KID` (Idura-broker settings, not FTN-specific).
- `yarn check:env-pairs-agree` / `assert:env-pair-registry` compare the PUBLIC_ and un-prefixed twins, so both example files must change together.

### Anti-Patterns to Avoid

- **Running `hygiene-codemod.mjs --apply`.** Its deletions leave rubble: `REVIEW-EDGE-04` → `REVIEW-` (dry-run, this session, on `claimConfig.ts`: `task-id "EDGE-04"`). Use it as a detector; rewrite by hand.
- **Unfenced multi-line examples in comments.** `assert:comment-hygiene` Rule 2 fails any unterminated line followed by a same-indent line, unless it is fenced, a list item, a table, an indented code sample, or a JSDoc tag. Restored examples must be fenced.
- **Memoising `safeGetSession`'s whole result per request.** It breaks password login (see row 60).
- **Changing the feedback INSERT policies' `WITH CHECK (true)`** without a decision. That text is a recorded operator ruling, asserted in pgTAP `22-content-policies` Section 11.
- **Adding adapter files without registering them** in `GUARDED_SOURCES` (`scripts/assert-project-scoped-queries.mjs` Check 5). `lint:check` goes red.
- **Staging `apps/frontend/src/lib/layouts/main/MainContent.svelte`.** Use explicit `git add <paths>`, never `git add -A`/`.`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Initial migration update | Hand-edit `00001_initial_schema.sql` | `yarn schema:regenerate` | `assert:schema-migration-parity` (in `lint:check`) requires byte-identity with `cat schema/*.sql` |
| Supabase types | Hand-edit `database.ts` | `yarn db:types` after `yarn db:reset` | CI re-generates and diffs |
| Comment classification for proofs | New regex comment stripper | `commentMapOf` (`scripts/assert-env-pair-registry.mjs`) + `familyFor` (`scripts/lib/comment-spans.mjs`) | The shared classifier handles strings and template literals |
| Class merging | String interpolation | `cn()` from `$lib/utils/components` | Configured for the replaced theme scales |
| Enum parity data | A transcribed list in the test | `Constants.public.Enums` from `@openvaa/supabase-types` | Generated from the DB |
| Env-file parsing (row 61) | A custom parser | `node:util` `parseEnv`, or Vite `loadEnv` with the empty keys removed first | Edge cases (quotes, comments) |

**Key insight:** every schema change has four regenerated or derived artifacts: the migration, the types, the dev-seed permitted keys, and the pgTAP plan counts. There are also three gate scripts that encode schema facts (rpc-nullability, project-scoped-queries, grant-enum). Plans must regenerate them rather than edit them.

## Runtime State Inventory

The phase contains renames and removals: `idura`/`signicat` → `*-ftn`, `is_generated` removal, the candidates column reorder, and the password-validation module move.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | (a) `auth.users.app_metadata.identity_provider` = `'idura'`/`'signicat'` in local/E2E DBs only. (b) The `is_generated` column + values in the local and E2E DBs (the live DB has it on 10 tables). (c) Candidate column order in the live local DB. No deployed database exists (`seed.sql`: "no database has been published") [A1] | Code edit + `yarn db:reset`. No data migration. |
| Live service config | Idura/Signicat dashboards do not store the provider *keyword* (it is internal config), so redirect URIs are unaffected. Any hosted Supabase project's function secrets `IDENTITY_PROVIDER_TYPE` would need the new value; none is known to exist [A1] | None beyond A1 confirmation |
| OS-registered state | None. No task scheduler, pm2 or launchd entries reference these names (the only OS-level item is the Docker Supabase stack, reset via `yarn db:reset`) | None |
| Secrets/env vars | Developers' untracked `.env` (root) and `apps/supabase/supabase/functions/.env` carry `PUBLIC_IDENTITY_PROVIDER_TYPE`/`IDENTITY_PROVIDER_TYPE` values. **Not observed:** the secret-file guard blocked reading them this session. After the rename, an old value throws in `getActiveProvider()` and is rejected by identity-callback | The operator updates their local env files to `signicat-ftn`/`idura-ftn`. The planner adds a `checkpoint:human-action` after P08 (precedent: the mandatory `PUBLIC_PROJECT_ID` env rename in memory) |
| Build artifacts | `packages/app-shared/dist` still contains `passwordValidation` exports until rebuilt. The turbo cache is safe. Generated `supabase-types` `database.ts` | `yarn build` (turbo) after P05; `yarn db:types` after P01/P02 |

## Common Pitfalls

### Pitfall 1: The comment-hygiene lint guard re-collapses restored examples
**What goes wrong:** Restoring a multi-line JSDoc example or shell usage block unfenced turns `yarn lint:check` red.
**Why it happens:** `scripts/assert-comment-hygiene.mjs` Rule 2 flags a comment line without terminal punctuation followed by a same-indent line. That same rule is what joined them in the first place (the phase-152 sweep).
**How to avoid:** Wrap code in ```` ```ts ```` / ```` ```sh ```` / ```` ```text ```` fences (`CODE_FENCE` exclusion), use `- ` list items (`NEXT_IS_LIST_ITEM`), or indent strictly as an `INDENTED_CODE_SAMPLE`.
**Warning signs:** `Comment hygiene guard … N violation(s)` in `lint:check`.

### Pitfall 2: The codemod cannot open bracketed route paths
**What goes wrong:** `--files 'apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte'` matches nothing, and the codemod exits 1 ("No files matched").
**Why it happens:** `node:fs` `globSync` treats `[…]` as a character class, and backslash escaping did not work (tested this session).
**How to avoid:** Rewrite `[` → `[[]` and `]` → `[]]` per path. Tested: `class-wrap` matched the file. Parentheses are literal and work.
**Warning signs:** exit 1 with "No files matched" or "No scannable tracked files matched". Untracked (not yet `git add`ed) files are also skipped, because the codemod intersects with `git ls-files`.

### Pitfall 3: The repo-wide hygiene assert is red at the tip
**What goes wrong:** Using `hygiene-grep-report.sh --assert-clean` as the phase gate can never pass. Measured: phase-ref bare 66, spike-ref bare 41, decision-id-bare 363, section-anchor 58, planning-path 21, plan-number 2, task-id 119; 184 files; exit 1.
**How to avoid:** Run the same patterns over the per-changed-file list only (gate script below). Report the repo-wide number as information.

### Pitfall 4: The codemod's pattern set misses most of this repo's planning references
**What goes wrong:** The dry-run reported 0 hits on `getLocalized.ts` (`T-157-06`, "this phase") and `503-entity-rpcs.sql` (`162-08`, `162-REVIEW CR-02`, `162-16`).
**How to avoid:** An extended residue grep (below) plus a full agent read of every changed file.

### Pitfall 5: A comment rewrite accidentally changes code
**What goes wrong:** A hand-edit of a 1,400-line SQL file's comments drops a clause or a comma.
**How to avoid:** Keep hygiene-only commits separate from behaviour commits. Prove each hygiene commit is code-identical: blank comments with `commentMapOf`, normalise whitespace, drop empty lines, compare before and after. For SQL, also `yarn schema:regenerate` + `yarn db:reset` + pgTAP.

### Pitfall 6: A schema change without a reset leaves the E2E and pgTAP runs against the old DB
**How to avoid:** Order: `yarn schema:regenerate` → `yarn db:reset` → `yarn db:types` → `yarn workspace @openvaa/supabase test:db` → `yarn db:lint:sql` → dev-seed tests → E2E. The E2E wrapper is run with `--no-db-reset`, so the reset must precede it. Memory flags a db:reset/storage 502 wedge gotcha: if storage 502s after a reset, restart the Supabase stack only, never Docker.

### Pitfall 7: The structural pgTAP suites parse policy text
**What goes wrong:** Adding a 4th argument to `user_can` in 14 policies reddens the policy-map, matrix-conformance and disjunct-order tests (22, 25, 29), even though behaviour is correct.
**How to avoid:** Update those structural regexes in the same commit as the policy change.

### Pitfall 8: The E2E disk sink
**What goes wrong:** ENOSPC voids full-suite runs.
**How to avoid:** Try `docker builder prune -af` first. Never delete `tests/e2e-runs/`. The host currently has 213 GiB free.

## Code Examples

### Per-changed-file hygiene gate (P12; phase-local script, bash)

```bash
#!/usr/bin/env bash
# .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
BASE=ship/v2.15-12-planning
mapfile -t FILES < <(git diff --name-only --diff-filter=d "$BASE"...HEAD -- apps packages tests scripts .github .env.example \
  | grep -v -E '^(\.planning/|\.claude/|\.agents/|CLAUDE\.md$)')
[ "${#FILES[@]}" -gt 0 ] || { echo "no changed files"; exit 1; }
ERR=0
# 1. codemod as a DETECTOR (dry-run) over apps/packages/tests files; bracket-wrap each path.
ARGS=(); for f in "${FILES[@]}"; do case "$f" in apps/*|packages/*|tests/*)
  g="${f//\[/[[]}"; g="${g//\]/[]]}"; g="${g//\[\[\[\]\]/[[]}"; ARGS+=(--files "$g");; esac; done
node .claude/skills/ship-review-stack/sources/hygiene-codemod.mjs "${ARGS[@]}" --quiet --json-out /tmp/165-hyg.json
node -e 'const s=require("/tmp/165-hyg.json"); if (s.totalHits) { console.error("codemod hits:", s.totalHits); process.exit(1); }' || ERR=1
# 2. the grep-report strip rows + survivor rows, scoped to the changed set
for pat in '\bD-\d{2,3}-\d{2}\b' '\bD-\d{2}\b(?!-\d{2})' '§' '\.planning/' '(?i)\bplans?\s+\d+[-.]\d+' '\b[A-Z]{3,}-\d{2}\b' \
           '(?i)(?<!see\s)\bphases?\s+\d+' '(?i)(?<!see\s)\bspikes?[\s\-/]\d+'; do
  if git grep -I -n -P "$pat" -- "${FILES[@]}"; then ERR=1; fi
done
# 3. extended residue (REPORT — every hit needs an agent disposition, most are rewrites)
git grep -I -n -P '\b1\d{2}(\.\d+)?-\d{2}\b|\b1\d{2}(\.\d+)?-[A-Z]{3,}\b|\bT-\d{3}(\.\d+)?-\d{2}\b|\*\*[A-Z]\d+(\([a-z]\))?\*\*|\bD-[A-Z]+-\d+\b|\b(CR|WR|IN)-\d{2}\b' -- "${FILES[@]}" || true
git grep -I -n -i -P '\b(used to|no longer|previously|was moved|moved (here|out)|this phase|this plan|formerly|originally|before this (fix|change|phase))\b' -- "${FILES[@]}" || true
exit "$ERR"
```

The bracket substitution above is illustrative. Implement the `[`→`[[]`, `]`→`[]]` mapping in a small node helper, since bash substitution order is fiddly. Note that `.env.example`, `.github/` and `scripts/` are outside the codemod's scope, but their residue is still greppable and agent-read.

### Code-identity proof for a hygiene-only commit (node)

```js
// usage: node code-identity.mjs <rev-a> <rev-b> <path...>
import { execFileSync } from 'node:child_process';
import { commentMapOf } from './scripts/assert-env-pair-registry.mjs';
import { familyFor } from './scripts/lib/comment-spans.mjs';
const [a, b, ...paths] = process.argv.slice(2);
const code = (rev, p) => {
  const t = execFileSync('git', ['show', `${rev}:${p}`]).toString();
  const fam = familyFor(p) ?? {};
  const chars = [...t];
  for (const [s, e] of commentMapOf(t, fam).spans) for (let i = s; i < e; i++) if (chars[i] !== '\n') chars[i] = ' ';
  return chars.join('').split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
};
let bad = 0;
for (const p of paths) if (code(a, p) !== code(b, p)) { console.error('CODE CHANGED:', p); bad = 1; }
process.exit(bad);
```

For `.svelte` files, the family includes `html` comments, so markup comments are also blanked. `familyFor` returns `undefined` for unknown extensions; treat those as prose files and review them by eye.

### Ledger completeness check (P11/P12)

```bash
cd .planning/phases/165-review-stack-comment-remediation
diff <(grep -oE '^### C-[0-9]+' 165-REVIEW-COMMENTS.md | sed 's/^### //' | sort) \
     <(grep -oE '^\| *C-[0-9]+' 165-LEDGER.md | grep -oE 'C-[0-9]+' | sort)   # exit 0 = same set
test -z "$(grep -oE '^\| *C-[0-9]+' 165-LEDGER.md | grep -oE 'C-[0-9]+' | sort | uniq -d)"  # no duplicates
# every row carries one of the allowed dispositions
awk -F'|' '/^\| *C-[0-9]+/{d=$6; gsub(/ /,"",d); if (d !~ /^(fix|split-artifact|already-fixed|deferred|wont-fix)$/) {print "BAD:",$2,d; bad=1}} END{exit bad}' 165-LEDGER.md
```

(Adjust the column index to the final ledger layout.)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Signicat identity keyed on `birthdate` | `sub` (hashed persistent subject) | #877 slice | Row 6: no users to rekey |
| `user_roles` claim | `grants` claim + `user_can` | #877/#880 | Rows 10, 28 |
| Hand-maintained `concatClass` string concat | `cn` = `twMerge(clsx())` | quick 260922-dd8 | Rows 47–49, 52 |
| `kit.env.dir` = cwd | `kit.env.dir` = repo root | #882 | Rows 61, 77 |

**Deprecated/outdated:** the docs' `$getRoute` store syntax (row 62), and the docs' "backend also validates the password" (row 44).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No hosted (pre-release) Supabase project holds real Signicat- or Idura-authenticated users or deployed function secrets | Row 6; Runtime State Inventory | If one exists, `birthdate`-keyed users would be duplicated on next login (row 6 becomes a fix: a one-time rekey), and its function secret `IDENTITY_PROVIDER_TYPE` must change with P08 |
| A2 | Keeping the feedback INSERT policies byte-identical (trigger instead) is preferable to editing the ratified `WITH CHECK (true)` | Row 9 | If the maintainer prefers the policy form, P03 swaps to `WITH CHECK (project_id IS NOT NULL)` and rewrites pgTAP Section 11 |
| A3 | "Related tables" for the column order = candidates, factions, alliances (the 102-entities tables) | Row 18 | If it also means nominations/questions, they need reordering too (no functional risk, more churn) |
| A4 | `terms_of_use_accepted` goes after `confirmed` in candidates | Column order | Cosmetic |
| A5 | The `.env.example` anon/service keys were replaced by placeholders deliberately (secret-scan hygiene), so the fix belongs in CI, not in restoring demo JWTs | Rows 70–71 | If demo keys are acceptable in the template, restoring them is a one-line alternative |
| A6 | Moving `lib/supabase/*` client factories behind the adapter belongs to the deferred D-03 work, not to this phase | supabase-types audit | If the maintainer wants it now, P05 grows by 5 files + `app.d.ts` + `hooks.server.ts` |

## Open Questions (RESOLVED — see 165-CONTEXT D-07..D-11)

1. **Q1 — Review bodies in the ledger?** ROADMAP criterion 1 says "every non-empty review body". CONTEXT says the 78 inline comments are the population. Recommendation: add a 12-row review-body appendix marked `no-action`.
2. **Q2 — supabase-types boundary.** Is typing the Supabase *client* (`Database`) outside the adapter acceptable until D-03? Recommendation: the alias re-export now, the full move deferred (A6).
3. **Q3 — components.ts verdict.** The duplication cannot be removed without renaming `p-xs`-style classes. Is the drift test an acceptable resolution? This needs the maintainer's acknowledgement via the ledger reply.
4. **Q4 — Style-block residue.** Video, ScoreGauge core and root `+layout.svelte` keep CSS. The partial cases (InputGroup, Banner, Expander) produce long arbitrary-variant classes. The planner should let the executor keep CSS where arbitrary variants are less readable, and record each kept rule in the ledger reply.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | all | ✓ | v24.14.1 (engines `>=22`) | — |
| Yarn | all | ✓ | 4.13.0 | — |
| Supabase CLI (workspace) | db reset/types/test/lint | ✓ | 2.83.0 | — |
| Local Supabase stack `openvaa-local` | pgTAP, db:lint:sql, E2E | ✓ running (pooler stopped) | — | `yarn db:start` |
| Docker | Supabase | ✓ | server 29.7.2 | — (do not restart; second stack present) |
| psql | ad-hoc probes | ✓ | postgresql@17 client | `docker exec` |
| Playwright | E2E | ✓ | 1.58.2 | `yarn playwright install` |
| Disk | E2E artifacts | ✓ | 213 GiB free | `docker builder prune -af` |

Baseline at the tip, run this session:
- `yarn build` → exit 0.
- `yarn test:unit` → exit 0 (25/25 turbo tasks; frontend 102 files / 1828 tests).
- `yarn lint:check` → exit 0 (all 18 assertions 0 violations, svelte-check 0/0).
- Not run this session: pgTAP, `db:lint:sql`, `format:check`, E2E. The last recorded full suite is 155/155 in STATE.

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 (packages + frontend), pgTAP via `supabase test db`, Playwright 1.58.2 (E2E) |
| Config file | per-workspace `vitest.config.ts`; `tests/playwright.config.ts`; `apps/supabase/supabase/tests/database/*.test.sql` |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` / `cd packages/<pkg> && yarn test:unit` / `yarn workspace @openvaa/supabase test:db` |
| Full suite command | `yarn build && yarn lint:check && yarn format:check && yarn test:unit && yarn workspace @openvaa/supabase test:db && yarn db:lint:sql && tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-close --no-db-reset` (each run separately; read each exit status directly) |

### Phase "Requirements" → Test Map (by plan)
| Plan | Behaviour | Test Type | Automated Command | File Exists? |
|------|-----------|-----------|-------------------|-------------|
| P01 | Entity-id collision across types/projects denies reach; typed RPCs | pgTAP | `yarn workspace @openvaa/supabase test:db` | ❌ new collision case in `12-user-can.test.sql` (or a new file) |
| P01 | Writer passes `p_entity_type` | unit | `yarn workspace @openvaa/frontend test:unit -- supabaseDataWriter` | ✅ update |
| P02 | No `is_generated` anywhere; candidates order | grep + pgTAP + dev-seed | `git grep -n is_generated -- apps packages tests ':!**/data/**'` → exit 1 (except `@openvaa/data` `isGenerated`); `cd packages/dev-seed && yarn test:unit` | ✅ |
| P03 | Anon/authenticated NULL-project feedback insert throws | pgTAP | `test:db` | ❌ new `throws_ok` |
| P04 | Style inlining keeps visuals/a11y | E2E (visual + a11y projects) + unit | full E2E; `hoverShadedRule.test.ts` rewritten | ✅ update |
| P05 | Frontend enums ≡ DB enums | unit + typecheck | `yarn workspace @openvaa/frontend test:unit -- parity` + `yarn typecheck` | ❌ Wave 0 |
| P06 | getLocalized non-string; sendEmail schema; local filters; moved helpers | unit | frontend + app-shared `test:unit` | ✅ extend / ❌ new helper tests |
| P07 | sameRefs; pointer-cancel focus; spacing-name parity | unit | frontend `test:unit` | ❌ new cases |
| P08 | `*-ftn` provider selection + claim configs | unit + E2E (bank-auth specs run only under the runbook) | frontend + supabase `test:unit` | ✅ update |
| P09 | safeGetSession per-token memo; env empty-shadow; layout mock | unit | frontend `test:unit` | ❌ new |
| P10 | condenser flat result; generateBoth prompt; edge-env family; teardown finally | unit + lint | package `test:unit`; `yarn assert:edge-function-env` | ✅ extend |
| P12 | Ledger complete; hygiene per changed file; all gates | script | the ledger check + `hygiene-changed-files.sh` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** the touched workspace's `test:unit`, plus `yarn workspace @openvaa/supabase test:db` for schema tasks.
- **Per wave merge:** `yarn build && yarn lint:check && yarn test:unit`; after schema waves, also pgTAP + `db:lint:sql`.
- **Phase gate:** the full set in D-06, including one full E2E run on the final tip (0 failed / 0 flaky / 0 did-not-run), plus the ledger completeness check and the per-changed-file hygiene gate.

### Wave 0 Gaps
- [ ] `.planning/phases/165-…/scripts/hygiene-changed-files.sh` + `code-identity.mjs` (phase-local)
- [ ] `165-LEDGER.md` skeleton with all 78 ids (generated from `165-REVIEW-COMMENTS.md`) + the review-body appendix
- [ ] New test files listed ❌ above (they belong to their plans, not a separate wave)

## Security Domain

`security_enforcement` is absent from `.planning/config.json`, so it is treated as enabled.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | OIDC provider selection (`*-ftn` rename must fail closed on unknown values; it already throws) |
| V3 Session Management | yes | `safeGetSession` memo must re-verify per token (row 60) |
| V4 Access Control | **yes, primary** | `user_can` type-aware entity reach (rows 11, 21); feedback orphan guard (row 9) |
| V5 Input Validation | yes | zod `SendEmailResultSchema` required discriminators (row 2); `getLocalized` JSONB value types (row 1) |
| V6 Cryptography | no | — |
| V14 Configuration | yes | CI keys taken from `supabase status`, never committed (rows 70–71) |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-tenant object reference via a shared UUID across entity tables (proven) | Elevation of privilege | Type-qualified reach in `user_can`, typed `entity_project_id` CASE, typed RPCs; a pgTAP negative control |
| Orphan row injection bypassing tenancy (proven) | Tampering / Info disclosure | Insert-time NOT-NULL enforcement for `project_id` |
| Stale-session reuse from memoisation | Spoofing | Per-access-token memo of `getUser()` only |
| Malformed JSONB crashing page load | DoS | Type-checked tiers returning `null` |

## Proposed Plan Decomposition

| Wave | Plan | Scope (rows) | Notes |
|---|---|---|---|
| 1 | **P01** Entity-type-aware authorization | 11, 21 | schema 301/302/011/400/502/503 + pgTAP + writer + guard dispositions + regen/reset/types. Commit per function group. |
| 2 | **P02** `is_generated` removal + candidates column order | 18, 19 (+25's `is_generated` sentence) | schema 101–104/303/503 comments, dev-seed, types, column-map, mapRow test, pgTAP 09, skills docs |
| 3 | **P03** Feedback insert guard + column documentation + schema-file hygiene | 9, 20 | Last schema plan: it rewrites comments across **all** schema files and restores the collapsed SQL header lists; code-identity proof per file |
| 4 (parallel, file-disjoint) | **P04** Style-block inlining + QuestionChoices | 45, 47, 48, 49, 52 | Must not touch `MainContent.svelte` |
| 4 | **P05** Frontend-local grant types + parity test + supabase-types audit + password-validation move | 44, 46 | Keep `ADMIN_GRANTS` export; `yarn build` for app-shared |
| 4 | **P06** Supabase adapter + app-shared fixes | 1, 2, 7, 39, 40, 41, 50 | Register new files in `GUARDED_SOURCES` |
| 4 | **P07** Contexts/utils | 51, 53, 54, 55 | |
| 4 | **P08** `*-ftn` provider rename | 42 (+6 hygiene in `claimConfig.ts`) | Ends with a `checkpoint:human-action` for local `.env` values |
| 4 | **P09** App shell | 56, 60, 61 | `hooks.server.ts`, `vite.projectIdEnv.ts`, located layout test |
| 4 | **P10** dev-seed, E2E teardown, experimental packages, root tooling, CI, docs | 22, 24, 25, 26, 29, 62, 63–69, 70–73 | P02 also edits `FeedbackGenerator.ts`, so run P10 after P02 (true by wave order) |
| 5 | **P11** Planning-record fixes + deferred todo + ledger with draft replies | 74–78, 43, and all split/af/wf rows | |
| 6 | **P12** Per-changed-file hygiene gate + residue pass + full cardinal gates | all | Final E2E run; ledger completeness; code-identity proofs |

Parallel-safety check for wave 4:
- P06 and P01 both touch `supabaseDataWriter.ts`; P01 is earlier.
- P05 touches `lib/api/dataProvider.ts` and adds a file in the adapter dir. P06 touches `supabaseDataProvider.ts`, `adminWriter`, `utils/`, and `scripts/assert-project-scoped-queries.mjs` (`GUARDED_SOURCES`). **P05's parity test is a `.test.ts`, so it is not a guarded source**, and the two plans do not collide on the guard script.
- P08 and P10 both touch root `.env.example` only if P10 edits comments there. Keep the CI fix inside `main.yaml`.

## Deferred item (row 43)

Confirmed `deferred` (D-03). Todo convention: `.planning/todos/pending/YYYY-MM-DD-<slug>.md` with YAML frontmatter (`created`, `title`, `area`, `severity`, `files`), as in `2026-09-21-preregister-route-discards-email-and-nominations.md`.

Proposed file: `.planning/todos/pending/2026-09-27-adapter-selection-entrypoints.md`. It carries the full list from the comment:
1. Static-settings adapter check in the data provider, writer and feedbackWriter entrypoints; use the local adapter when chosen.
2. Lazy-load the Supabase modules per the chosen adapter.
3. Consider build-time/env adapter registration.
4. Adapters self-register their capabilities.
5. Adapters register hooks, so route loaders stop importing adapter-specific values such as `import { SUPABASE_COOKIE_PREFIX } from '$lib/api/dataProvider';`.

Cross-link the related pending todos:
- `2026-08-28-reintroduce-the-local-data-adapter.md`
- `2026-06-05-migrate-supabase-auth-code-from-routes-to-adapters.md`
- `2026-08-28-hooks-supabase-handle-parameterisation.md`
- `2026-08-28-admin-login-supabase-independence.md`

Also add A6 (the `lib/supabase/*` relocation) as an item.

## Sources

### Primary (HIGH confidence, verified this session)
- `165-CONTEXT.md`, `165-REVIEW-COMMENTS.md` (78 ids, counted)
- Tip files read: `301-auth-functions.sql`, `503-entity-rpcs.sql`, `102-entities.sql`, `101-elections.sql`, `107-feedback.sql`, `302-rls.sql` (feedback + organizations policies), `000-enums.sql`, `roles.ts`, `providers/types.ts`, `idura.ts`, `providers/index.ts`, `claimConfig.ts`, `getLocalized.ts`, `sendEmailResult.schema.ts`, `send-email/index.ts`, `supabaseAdminWriter.ts`, `supabaseDataProvider.ts`, `prepareDataWriter.ts`, `dataWriter.ts`, `focusNavigationTarget.ts`, `logLevel.ts`, `components.ts`, `QuestionChoices.svelte`, all 26 `<style>` blocks, `vite.projectIdEnv.ts`, `vite.config.ts`, `hooks.server.ts`, `passwordLogin.ts`, `assert-comment-hygiene.mjs`, `assert-project-scoped-queries.mjs`, `assert-env-pair-registry.mjs`, `comment-spans.mjs`, `hygiene-codemod.mjs`, `hygiene-grep-report.sh`, `ship-review-stack/SKILL.md`
- Live probes (rolled back) on `supabase_db_openvaa-local`: the `user_can` collision and the orphan feedback insert
- Runs: `hygiene-grep-report.sh --assert-clean` (exit 1), codemod dry-run, the `commentMapOf` family probe, the `globSync` bracket probe, `yarn build` / `test:unit` / `lint:check` (exit 0), `layout.load.test.ts` (4/4)
- Third-party source read: `node_modules/tailwind-merge/dist/bundle-mjs.mjs` (`spacing: ['px', isNumber]`), `node_modules/vite/dist/node/chunks/config.js` (`loadEnv` process-env overlay)

### Secondary (MEDIUM)
- MDN `addEventListener` (passive/capture semantics) [CITED: developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener]

### Tertiary (LOW)
- None relied on.

## Metadata

**Confidence breakdown:**
- Triage dispositions: HIGH. Every row has a tip command or read, and two defects were reproduced live.
- Schema change designs: HIGH on the need, MEDIUM on exact signatures (the planner and executor refine them against the pgTAP estate).
- Style inlining classification: MEDIUM. Per-rule feasibility is clear, but visual equivalence is only provable by the E2E visual suite.
- Hygiene mechanism: HIGH. Tool behaviour was measured, including its blind spots.

**Research date:** 2026-09-27
**Valid until:** as long as the tip is unchanged. Re-verify any row whose files a later commit touches.
