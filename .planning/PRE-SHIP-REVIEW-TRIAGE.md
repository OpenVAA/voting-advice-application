# Pre-Ship Review Triage — the 12-PR stack and `PRE-SHIP-REFACTORING.md`

_Generated 2026-08-28 from the review comments on PRs #863–#874._

## Provenance

| Source | Count |
|---|---:|
| Review line comments by `kaljarv` | 103 |
| Review line comments by `Copilot` | 28 |
| **Total line comments** | **131** |
| `PRE-SHIP-REFACTORING.md` top-level items | 3 |
| `PRE-SHIP-REFACTORING.md` permissions block | 1 (large) |

Every one of the 131 comments is assigned to exactly one phase below; the classifier reported
**0 unclassified**, and the per-bucket counts sum to 131. Two comments are cross-listed where they
carry two asks (noted inline).

## Phase map

| Phase | Title | Comments | Chief source |
|---|---|---:|---|
| 152 | Comment & Naming Hygiene Sweep | 19 | #865, #866, #869, #870 |
| 153 | Build & Tooling Config Correctness | 17 | #865, #866, #873 |
| 154 | dev-seed Determinism & Template Validation | 6 | #867 |
| 155 | Edge Function Hardening — env, JWT, provider identity | 8 | #866 |
| 156 | Supabase Schema Corrections — naming, constraints, grants | 18 | #866 |
| 157 | Adapter Boundary & Typing | 14 | #869 |
| 158 | Routing & Auth Surface Harmonisation | 27 | #870 |
| 159 | Component & Context Consolidation | 14 | #869 |
| 160 | Agent Docs & Skills Refresh | 8 | #874 |
| 161 | Project Scoping — `PROJECT_ID` Parameterisation | — | PRE-SHIP-REFACTORING.md § item 1 |
| 162 | Permissions & Auth Model Refactor | — | PRE-SHIP-REFACTORING.md § Permissions refactoring |
| 163 | CI Gates — SQL Lint/Format + Secrets & Vulnerability Scanning | — | _was Phase 149_ |
| 164 | `RETURNS TABLE` Nullability — Audit + Single Override Mechanism | — | _was Phase 150_ |

---

## Phase 152: Comment & Naming Hygiene Sweep

Line-break-free multiline comments, no historical narrative, no planning references, no encoded dashes, and the file/symbol renames. `(voters)/+layout.svelte` is the worked exemplar: the reviewer marked keep vs remove line by line there, so it defines the target style rather than merely being an instance of it.

**19 comments.**

- **`packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts:11`** — PR #865 (kaljarv)
  > Rename to `quartenaryChoices`
- **`packages/data/src/utils/formatAnswer.ts:6`** — PR #865 (kaljarv)
  > Remove forced line breaks from comments
- **`packages/filters/src/filter/enumerated/enumeratedFilter.ts:86`** — PR #865 (kaljarv)
  > Rem line breaks
- **`packages/filters/tests/filter.test.ts:315`** — PR #865 (kaljarv)
  > Never use planning references in test names. Also rem line breaks from comment
- **`apps/supabase/supabase/functions/identity-callback/index.ts:255`** — PR #866 (kaljarv)
  > Rem line breaks from comments
- **`apps/supabase/supabase/functions/send-email/index.ts:130`** — PR #866 (kaljarv)
  > Rem line breaks from comments
- **`apps/supabase/supabase/schema/000-enums.sql:17`** — PR #866 (kaljarv)
  > Slightly unrelated, check the whole repo's symbol naming for whether it follows UK or US spelling. If there are any UK variants, change them to US ones for consistency.
- **`apps/frontend/src/lib/api/adapters/apiRoute/apiRouteAdapter.ts:13`** — PR #869 (kaljarv)
  > Remove line breaks from multiline comments everywhere.
- **`apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:9`** — PR #869 (kaljarv)
  > Remove historical narrative and line breaks.
- **`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:361`** — PR #869 (kaljarv)
  > Aren't the fields already typed by toDataObject? They should be. Also, remove line breaks from comment.
- **`apps/frontend/src/lib/components/input/Input.svelte:316`** — PR #869 (kaljarv)
  > Remove comment, the frontend components should not reference data provider implementations.
- **`apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts:1`** — PR #869 (kaljarv)
  > Rename this and the test file to settingsOverlay
- **`apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:126`** — PR #869 (kaljarv)
  > Don't use variable names as terse as this (and scs etc.). The only place to use such is in small ad hoc closures like .filter((o) => o.foo)).
- **`apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte:12`** — PR #869 (kaljarv)
  > Don't encode dashes in comments, just use a hyphen
- **`apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts:1`** — PR #869 (kaljarv)
  > Rename to just helpers.ts
- **`apps/frontend/src/routes/(voters)/+layout.svelte:36`** — PR #870 (kaljarv)
  > Make sure that in the comment cleanup phase, extended prose like this is removed, perhaps completely. We can use this file as an example of what the code should look like afterwards.
- **`apps/frontend/src/routes/(voters)/+layout.svelte:92`** — PR #870 (kaljarv)
  > Here we can leave one short line justifying onMount but no planning details.
- **`apps/frontend/src/routes/(voters)/+layout.svelte:109`** — PR #870 (kaljarv)
  > Remove comment
- **`apps/frontend/src/routes/(voters)/+layout.svelte:116`** — PR #870 (kaljarv)
  > This can be kept, because the logic is a bit slow to read from the if clause

## Phase 153: Build & Tooling Config Correctness

Mechanical, individually verifiable defects in the build and tooling plumbing. Every item is a config-level assertion that can be closed and guarded cheaply; several are latent breakages that no current gate would catch.

**17 comments.**

- **`packages/app-shared/package.json:11`** — PR #865 (Copilot)
  > This package’s build script invokes "tsup", but tsup is not listed in devDependencies. With Yarn workspaces (especially under PnP), the workspace won’t have access to the tsup binary unless it declares it explicitly.
- **`packages/argument-condensation/package.json:12`** — PR #865 (Copilot)
  > This package’s build script invokes "tsup", but tsup is not listed in devDependencies. With Yarn workspaces (especially under PnP), the workspace won’t have access to the tsup binary unless it declares it explicitly.
- **`packages/core/package.json:26`** — PR #865 (Copilot)
  > This package’s build script invokes "tsup", but tsup is not listed in devDependencies. With Yarn workspaces (especially under PnP), the workspace won’t have access to the tsup binary unless it declares it explicitly.
- **`packages/core/src/controller/controller.ts:73`** — PR #865 (Copilot)
  > With the new shared ESLint config, unused parameters only get ignored when prefixed with "_" (unused-imports/no-unused-vars with argsIgnorePattern '^_'). This base implementation doesn’t use its parameters, so it will now lint-warn unless the params are renamed (or explicitly suppressed).
- **`packages/data/package.json:27`** — PR #865 (Copilot)
  > This package’s build script invokes "tsup", but tsup is not listed in devDependencies. With Yarn workspaces (especially under PnP), the workspace won’t have access to the tsup binary unless it declares it explicitly.
- **`packages/filters/package.json:27`** — PR #865 (Copilot)
  > This package’s build script invokes "tsup", but tsup is not listed in devDependencies. With Yarn workspaces (especially under PnP), the workspace won’t have access to the tsup binary unless it declares it explicitly.
- **`packages/llm/package.json:11`** — PR #865 (Copilot)
  > This package’s build script invokes "tsup", but tsup is not listed in devDependencies. With Yarn workspaces (especially under PnP), the workspace won’t have access to the tsup binary unless it declares it explicitly.
- **`packages/matching/package.json:26`** — PR #865 (Copilot)
  > This package’s build script invokes "tsup", but tsup is not listed in devDependencies. With Yarn workspaces (especially under PnP), the workspace won’t have access to the tsup binary unless it declares it explicitly.
- **`packages/question-info/package.json:11`** — PR #865 (Copilot)
  > This package’s build script invokes "tsup", but tsup is not listed in devDependencies. With Yarn workspaces (especially under PnP), the workspace won’t have access to the tsup binary unless it declares it explicitly.
- **`packages/shared-config/README.md:15`** — PR #865 (Copilot)
  > The shared-config package is private and currently versioned as 0.1.0, but this README example suggests installing "@openvaa/shared-config": "^1.0.0". That version doesn’t exist/publish, so the example will mislead consumers inside the monorepo (and external consumers can’t install it at all). Use the workspace protocol (and align the TypeScript versioning with the repo’s catalog usage).
- **`packages/supabase-types/src/index.ts:4`** — PR #866 (Copilot)
  > This package is documented as being consumed directly as TypeScript source (no build step). In this repo, TS-internal relative imports intentionally omit `.js` extensions (see packages/README.md), but this barrel uses `.js` specifiers, which can break TS-source consumption tooling that doesn't remap `.js` -> `.ts`.
- **`packages/supabase-types/tsconfig.tsbuildinfo:1`** — PR #866 (Copilot)
  > `tsconfig.tsbuildinfo` is a TypeScript incremental-build artifact and should not be committed (it is machine-specific and creates noisy diffs). It’s usually gitignored and regenerated locally as needed.
- **`.github/workflows/main.yaml:34`** — PR #873 (Copilot)
  > This workflow runs `.claude/scripts/audit-skill-drift.sh`, but that script does not exist in this PR’s tree. If this workflow is triggered (e.g., on `main` after merge), the job will fail immediately with “file not found”.
- **`.lintstagedrc.json:3`** — PR #873 (Copilot)
  > lint-staged now shells out via `bash -c ...`, which will fail on environments without bash (notably Windows dev shells/CI). The command can be invoked directly without bash-specific quoting. This issue also appears on line 7 of the same file.
- **`apps/frontend/package.json:54`** — PR #873 (Copilot)
  > The Node/Yarn version constraints are under `engine`, but the standard field recognized by package managers is `engines`. With `engine`, these constraints may be ignored.
- **`apps/frontend/vitest.config.ts:6`** — PR #873 (Copilot)
  > `__dirname` is used for alias resolution, but this config file doesn’t define it. Since this package is `type: module` (see `apps/frontend/vite.config.ts`), `__dirname` is not available in ESM and this can crash Vitest config loading.
- **`package.json:70`** — PR #873 (Copilot)
  > The Node/Yarn version constraints are under `engine`, but the standard field recognized by package managers is `engines`. With `engine`, these constraints may be ignored, so CI/dev can drift silently.

## Phase 154: dev-seed Determinism & Template Validation

`faker.date.future()`/`faker.date.recent()` are relative to *now*, so a fixed seed does not yield a fixed dataset across days — a direct breach of the package's stated determinism contract, and the only findings in the stack that falsify a guarantee the repo makes in writing.

**6 comments.**

- **`packages/dev-seed/src/cli/resolve-template.ts:59`** — PR #867 (Copilot)
  > `resolveTemplate()` returns built-in templates without running them through `validateTemplate()`, but the module docstring and the seed CLI both describe built-ins as “validated”. This makes built-in vs filesystem templates behave differently and can let invalid built-ins slip through until much later failures. Validate the built-in before returning it for consistent behavior.
- **`packages/dev-seed/src/emitters/answers.ts:89`** — PR #867 (Copilot)
  > `faker.date.recent()` is relative to “now”, so date-question answers will change over time even with the same seed. Since dev-seed’s core guarantee is reproducibility, prefer generating dates from a fixed reference window.
- **`packages/dev-seed/src/generators/ElectionsGenerator.ts:58`** — PR #867 (Copilot)
  > `faker.date.future()` uses the current time as its reference date by default, so `election_date` will drift over real time even when the Faker seed is fixed. That breaks the package’s determinism contract (same seed should yield the same dataset across runs/days). Use a fixed `refDate` (or a fixed between-range) so the generated date is seed-deterministic across time.
- **`packages/dev-seed/src/template/schema.ts:37`** — PR #867 (Copilot)
  > Template validation currently allows `fixed` rows without an `external_id` (because `fixed` is `z.record(...)`). Most generators assume `fx.external_id` exists and will produce `external_id: "${prefix}undefined"` (or worse) when loading JSON templates. This also conflicts with the public `Fragment<T>` type, which requires `external_id`. Consider requiring `external_id` while still allowing arbitrary extra keys via `.catchall(z.unknown())`.
- **`packages/dev-seed/src/template/types.ts:79`** — PR #867 (Copilot)
  > The “Further reading” list has an incomplete bullet (`- — latent`) which reads like an unfinished edit and makes the docs harder to follow. Point it at the latent emitter docs (or remove the bullet).
- **`packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts:50`** — PR #867 (Copilot)
  > This comment has a dangling “see …” reference (`see phase 120 trace-confirmed; see // )`) which looks like an unfinished edit. It’s better to remove the stub so the rationale reads cleanly.

## Phase 155: Edge Function Hardening — env, JWT, provider identity

Two real defects (base64url JWT segments decoded with `atob()`), the removal of every silent env default in favour of a throw, and the Signicat identity-matching decision: find a pseudonym or hetu, or drop Signicat support, because birthdate-based matching is not unique.

**8 comments.**

- **`apps/supabase/supabase/functions/identity-callback/claimConfig.ts:35`** — PR #866 (kaljarv)
  > Check the current Signicat docs whether there's a pseudonym we can use for identity matching and if not use hetu which should be available. If not, remove Signicat support completely bc b-day-based matching is not unique.
- **`apps/supabase/supabase/functions/identity-callback/index.ts:168`** — PR #866 (kaljarv)
  > Remove default provider
- **`apps/supabase/supabase/functions/identity-callback/index.ts:196`** — PR #866 (kaljarv)
  > Remove this default and throw if the env is not available.
- **`apps/supabase/supabase/functions/identity-callback/index.ts:341`** — PR #866 (kaljarv)
  > Remove defaults or construct from other env vars fully. Search the repo for any hard-coded ports or localhost urls.
- **`apps/supabase/supabase/functions/invite-candidate/index.ts:82`** — PR #866 (Copilot)
  > JWT payload decoding uses atob() on a base64url-encoded segment (JWT uses base64url, not base64). This can fail for tokens containing '-'/'_' and/or missing padding, breaking admin authorization checks. This issue also appears on line 111 of the same file.
- **`apps/supabase/supabase/functions/send-email/index.ts:112`** — PR #866 (Copilot)
  > JWT payload decoding uses atob() on a base64url-encoded segment (JWT uses base64url, not base64). This will fail for tokens containing '-'/'_' and/or missing padding, causing admin checks to break intermittently. This issue also appears on line 114 of the same file.
- **`apps/supabase/supabase/functions/send-email/index.ts:175`** — PR #866 (kaljarv)
  > Allow spaces like `{{ varname }}`
- **`apps/supabase/supabase/functions/send-email/index.ts:210`** — PR #866 (kaljarv)
  > Remove all defaults and throw if not available, also below.

## Phase 156: Supabase Schema Corrections — naming, constraints, grants

The schema-level corrections that do not depend on the permissions rewrite: `party`→`organization`, enums where strings are used, the missing `>= 1` constraint, `is_image` extraction, the self-editable `sort_order` and system-managed timestamp grants, RPC generalisation, and the hard-coded ports. Migrations and schemata may be rewritten together — no backwards compatibility is owed.

**18 comments.**

- **`apps/supabase/benchmarks/README.md:1`** — PR #866 (kaljarv)
  > Move the results from the benchmarks in a concise format to supabase README and archive the benchmark scripts. You can point to a commit in the history where they'll be available if needed in the future.
- **`apps/supabase/scripts/lint-schema.mjs:1`** — PR #866 (kaljarv)
  > Check if we can write these as pgTap tests instead.
- **`apps/supabase/supabase/config.toml:165`** — PR #866 (kaljarv)
  > Investigate whether this and the other hard-coded ports can be gotten from env. Otherwise make sure that if the where and when the port is changed, this is mentioned as a caveat.
- **`apps/supabase/supabase/schema/000-enums.sql:25`** — PR #866 (kaljarv)
  > Rename party to organization. When making schema changes, we can rewrite both migrations and schemata and not care about bwd compat. Make sure to check db seed scripts as well.
- **`apps/supabase/supabase/schema/011-validation-functions.sql:165`** — PR #866 (kaljarv)
  > Extract the full check into a is_image util.
- **`apps/supabase/supabase/schema/102-entities.sql:27`** — PR #866 (kaljarv)
  > This probably conflicts with first and last name based names, so should be removed. Short_name, tho, is still valid as an override for generated initials.
- **`apps/supabase/supabase/schema/103-questions.sql:20`** — PR #866 (kaljarv)
  > Evaluate whether stricter fkey linkage would be needed for these id-jsonbs, and also in questions. The challenge is that we'll want to extend the logic to support to three options (but not a combination of these): 1. only included in elections with these ids 2. excluded from elections with these ids 3. no filter
- **`apps/supabase/supabase/schema/104-nominations.sql:46`** — PR #866 (kaljarv)
  > Add a constraint >= 1
- **`apps/supabase/supabase/schema/107-feedback.sql:14`** — PR #866 (kaljarv)
  > Investigate in a follow-up task whether there is a way to encrypt the ip address so that it's not recoverable afterwards or use some other non-PII moniker.
- **`apps/supabase/supabase/schema/107-feedback.sql:59`** — PR #866 (Copilot)
  > When inserts happen outside PostgREST, `current_setting('request.headers', true)` is NULL and this falls back to `'unknown'`. That collapses all such inserts into one rate-limit bucket and one advisory-lock key, which can cause unexpected blocking in direct SQL contexts (including tests/maintenance scripts).
- **`apps/supabase/supabase/schema/300-auth-tables.sql:14`** — PR #866 (kaljarv)
  > This should use an enum matching user_role_type prefixes. However, we'll want to refactor the whole auth model a bit. We'll have to do that in a follow-up phase (blocking ship).
- **`apps/supabase/supabase/schema/301-auth-functions.sql:59`** — PR #866 (kaljarv)
  > Use enums
- **`apps/supabase/supabase/schema/302-rls.sql:88`** — PR #866 (kaljarv)
  > We need to separate can_access_project from can_edit_project. For example, all candidates should be able to read the project's data like elections but never edit them.
- **`apps/supabase/supabase/schema/303-column-grants.sql:28`** — PR #866 (kaljarv)
  > sort_order is should not be self-editable.
- **`apps/supabase/supabase/schema/303-column-grants.sql:36`** — PR #866 (Copilot)
  > Granting UPDATE on `created_at` / `updated_at` to the `authenticated` role allows candidates to tamper with timestamps via PostgREST. These are typically system-managed fields (created_at immutable; updated_at via trigger), and allowing user updates can undermine auditability and sorting. This issue also appears on line 52 of the same file.
- **`apps/supabase/supabase/schema/503-entity-rpcs.sql:147`** — PR #866 (kaljarv)
  > This should be extended to affect all entities with answers, i.e. organzations as well.
- **`apps/supabase/supabase/schema/504-admin-rpcs.sql:12`** — PR #866 (kaljarv)
  > Either rename to merge_question_custom_data or make generic to target other such tables as well.
- **`supabase/.branches/_current_branch:1`** — PR #866 (Copilot)
  > This looks like a Supabase CLI local-state file and should not be committed. Keeping it in the repo can cause noisy diffs and conflicts across developers and CI environments. Consider removing it from version control and adding an ignore rule for `supabase/.branches/` (or deleting the stray top-level `supabase/` directory if the real project lives under `apps/supabase/supabase/`).

## Phase 157: Adapter Boundary & Typing

Replace the typecasts with validated typed JSONB, extract the filter-value conversion, add the missing RPCs, drop the `withAuth` shim, and colocate `getLocalized` with its types. Includes the source test that keeps adapter specifics out of routes and components.

**14 comments.**

- **`apps/frontend/src/lib/api/README.md:10`** — PR #869 (kaljarv)
  > Not accurate now with local disabled.
- **`apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:80`** — PR #869 (kaljarv)
  > Add typing for return results if possible.
- **`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:60`** — PR #869 (kaljarv)
  > Add validation for the settings object (and all other typed jsonbs) so we don't need typecasts.
- **`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:92`** — PR #869 (kaljarv)
  > Ditto
- **`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:245`** — PR #869 (kaljarv)
  > Extract to a convertFilterValue or similar helper. Extend options to include electionRound filtering and edit the rpc.
- **`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:499`** — PR #869 (kaljarv)
  > Enable filtering by election, constituency and election round. Create a get_questions rpc to that effect, which returns both categories and their questions.
- **`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:511`** — PR #869 (kaljarv)
  > Make sure we need these smelly typecasts nowhere.
- **`apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:84`** — PR #869 (kaljarv)
  > Edit the interface shape so that the withAuth shim is no longer needed if it has no use with supabase.
- **`apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:381`** — PR #869 (kaljarv)
  > Remove these from here and the abstract interface.
- **`apps/frontend/src/lib/api/adapters/supabase/utils/getLocalized.ts:1`** — PR #869 (kaljarv)
  > These and the test should be colocated with packages/app-shared/src/data/localized.type.ts and use the types there.
- **`apps/frontend/src/lib/api/dataProvider.ts:12`** — PR #869 (kaljarv)
  > We should add reintroducing the local adapter as a follow-up task.
- **`apps/frontend/src/lib/api/utils/auth/providers/authConfig.ts:1`** — PR #869 (kaljarv)
  > The should be either included in the provider implementations, or split into provider-specific files so they're not interdependent.
- **`apps/frontend/src/lib/api/utils/auth/providers/index.ts:31`** — PR #869 (kaljarv)
  > Remove the default with no historical mentions.
- **`apps/frontend/src/lib/auth/getUserData.ts:31`** — PR #869 (kaljarv)
  > Add a blocking follow-up for renaming and refactoring logDebugError to a smarter method with structured, pino and OTL ready conformant output.

## Phase 158: Routing & Auth Surface Harmonisation

The largest single bucket. Login is implemented three times (admin, candidate, generic API); cookie names are written in several files with no shared const; routes are string-built rather than via `buildRoute`; and `hooks.server.ts` matches `candidate` in a way that breaks on a subpath. Centralise the route locus, define the `(protected)` pattern there, and enforce it with tests.

**27 comments.**

- **`apps/frontend/src/hooks.server.ts:17`** — PR #870 (kaljarv)
  > Paramaterise this dependent on the adapter configuration and rename to dataAdapterHandle if possible.
- **`apps/frontend/src/hooks.server.ts:69`** — PR #870 (kaljarv)
  > The check must be more restrictive because candidate might be used on a subpath. Also, move all path definitions to the centralised routes locus. Define the (protected) pattern there as well and add tests to enforce consistency.
- **`apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:144`** — PR #870 (kaljarv)
  > Add a follow up for a e2e test targeting this behaviour.
- **`apps/frontend/src/routes/(voters)/(located)/questions/+layout.ts:1`** — PR #870 (kaljarv)
  > Try to drop this.
- **`apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte:1`** — PR #870 (kaljarv)
  > Check if this is necessary or if some content from the layout can be moved here with the transitions surviving.
- **`apps/frontend/src/routes/(voters)/+layout.svelte:59`** — PR #870 (kaljarv)
  > As well as this.
- **`apps/frontend/src/routes/+layout.svelte:212`** — PR #870 (kaljarv)
  > {t('dynamic.appName')} {#if underMaintenance} – {t('maintenance.title')} {/if}
- **`apps/frontend/src/routes/+layout.svelte:215`** — PR #870 (kaljarv)
  > Remove the defaults from theme-colors.
- **`apps/frontend/src/routes/Banner.svelte:9`** — PR #870 (kaljarv)
  > Add this is as a follow up task.
- **`apps/frontend/src/routes/Header.svelte:44`** — PR #870 (kaljarv)
  > Add as a follow up task, refactoring the header style settings.
- **`apps/frontend/src/routes/admin/login/+page.server.ts:27`** — PR #870 (kaljarv)
  > Add as a blocking follow-up task a way to make this supabase independent in routes. It should be handled by the SupabaseAdapter. We can structure the abstracted model on supabase, though. Also, add a source test for ensuring that no adapter-specifics find their way into routes, components or anywhere not especially allowed, such as the specific adapter's implementation and hand-picked locations.
- **`apps/frontend/src/routes/admin/login/+page.server.ts:43`** — PR #870 (kaljarv)
  > This should be extracted to a /lib/auth or so utility for centralised permissions mapping.
- **`apps/frontend/src/routes/api/auth/login/+server.ts:1`** — PR #870 (kaljarv)
  > Consider this also as part of the login harmonisation.
- **`apps/frontend/src/routes/api/auth/logout/+server.ts:10`** — PR #870 (kaljarv)
  > And this as well.
- **`apps/frontend/src/routes/api/candidate/preregister/+server.ts:16`** — PR #870 (kaljarv)
  > Check.
- **`apps/frontend/src/routes/api/oidc/authorize/+server.ts:31`** — PR #870 (kaljarv)
  > Move cookie names into a const so that they match between files. Check all cookies written by the app and move those in the same const as well and place it in lib/cookies or so that we can make sure cookie names never overlap.
- **`apps/frontend/src/routes/api/oidc/callback/+server.ts:30`** — PR #870 (kaljarv)
  > Get the return route from the centralised routes.
- **`apps/frontend/src/routes/api/oidc/callback/+server.ts:35`** — PR #870 (kaljarv)
  > Check whether we could use strict type for the error parameters.
- **`apps/frontend/src/routes/candidate/(protected)/+page.svelte:38`** — PR #870 (kaljarv)
  > Rewrite this to be easier to read such that each prop gets a default at start or at the end and then we spefcify overrides per case. Define the possible badges at the same time so that later below only the precomputed props are referenced in the if blocks.
- **`apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:281`** — PR #870 (kaljarv)
  > NEVER add an element just for testid purposes. Put the testid in the parent and use that + a child selector in the test instead.
- **`apps/frontend/src/routes/candidate/auth/callback/+server.ts:8`** — PR #870 (kaljarv)
  > Check supabase specifics. Also, we should move this to the generic /api routes because we'll be needing some of the same functions for admins as well.
- **`apps/frontend/src/routes/candidate/auth/callback/+server.ts:31`** — PR #870 (kaljarv)
  > Construct routes using buildRoute
- **`apps/frontend/src/routes/candidate/auth/logout/+server.ts:1`** — PR #870 (kaljarv)
  > Use the generic api route.
- **`apps/frontend/src/routes/candidate/login/+page.server.ts:1`** — PR #870 (kaljarv)
  > See earlier comment on admin login. Also, extract the common logic from both to reduce duplication. If this leaves the generic /api login route unused, delete it.
- **`apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte:1`** — PR #870 (kaljarv)
  > Add a follow-up task: harmonise election and constituency selection logic with the Voter App (mainly startFromConstituencyGroup option).
- **`apps/frontend/src/routes/candidate/preregister/+layout.server.ts:9`** — PR #870 (kaljarv)
  > Extract this to the adapter and use the typing provided with no ad hoc casts.
- **`apps/frontend/src/routes/loginRedirectTarget.ts:1`** — PR #870 (kaljarv)
  > Move this to lib/routes

## Phase 159: Component & Context Consolidation

Audit `$effect` for cases that should be `$derived`, fold `MultipleTextInput` into `Input` with multilingual support, replace `EntityCardAction` with a snippet, collapse the two tracking-service layers, and share the duplicated block between voter and candidate contexts.

**14 comments.**

- **`apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte:55`** — PR #869 (kaljarv)
  > Check if these could be $deriveds. If they can, check all other $effect calls for similar patterns.
- **`apps/frontend/src/lib/components/alert/Alert.svelte:117`** — PR #869 (kaljarv)
  > Use closest available semantic class, e.g. top-sm.
- **`apps/frontend/src/lib/components/input/MultipleTextInput.svelte:1`** — PR #869 (kaljarv)
  > This should be either incorporated into Input like the other types or only the input part extracted and imported into Input and the same extraction done to other more complicated types in Input. The multilingual option should also be implemented at the same time such that each text item behaves much the same as a normal multilingual text item.
- **`apps/frontend/src/lib/components/questions/QuestionChoices.svelte:1`** — PR #869 (kaljarv)
  > Add as a follow-up blocking task for me to UAT: - BooleanInput - multi-select choices
- **`apps/frontend/src/lib/contexts/app/appContext.svelte.ts:335`** — PR #869 (kaljarv)
  > This ad hoc rollup is fixed in the last branch of the stack.
- **`apps/frontend/src/lib/contexts/app/reactiveHandle.type.ts:1`** — PR #869 (kaljarv)
  > The more logical place for these could be in contexts/utils
- **`apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts:17`** — PR #869 (kaljarv)
  > Investigate whether we can have just one tracking service type and implementation and not have these two layers. Any properties only used by the tracking service internally need not necessarily be easily accessible. Therefore we can consider making the consumer facing interfaces' definition narrower. The sessionId, for example, need not be used by the consumers, just the service internally.
- **`apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:355`** — PR #869 (kaljarv)
  > Is it possible to use a common utility for this and the same block in VoterContext?
- **`apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:37`** — PR #869 (kaljarv)
  > Move to the bottom of the file or in utils.
- **`apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:220`** — PR #869 (kaljarv)
  > EntityCardAction is a pre-snipper era workaround, so see if we can just use a snippet here and remove the separate component.
- **`apps/frontend/src/lib/i18n/init.ts:52`** — PR #869 (kaljarv)
  > Check whether these utils are any longer needed after the extraction of translation utils to app-shared in an earlier review comment.
- **`apps/frontend/src/lib/utils/constants.ts:10`** — PR #869 (kaljarv)
  > Remove default.
- **`apps/frontend/src/lib/utils/getAllianceSummary.ts:1`** — PR #869 (kaljarv)
  > Rename to alliances.ts
- **`apps/frontend/src/lib/utils/multiChoiceValidity.ts:8`** — PR #869 (kaljarv)
  > If so, minSelection should be checked to be > 0.

## Phase 160: Agent Docs & Skills Refresh

The object-model additions, the missing extension-pattern steps (dev-seed templates, E2E filter coverage, skill self-check), and the two evidence-based evaluations the reviewer attached: progressive disclosure vs direct reading, and the 288-run ablation finding no correctness gain from persistent context files.

**8 comments.**

- **`.claude/skills/data/SKILL.md:1`** — PR #874 (kaljarv)
  > Check and possibly refactor all of the existing skills with these recent findings in mind: Testing Agent-Skills-style progressive disclosure against raw-document navigation and a classical hybrid retriever — across three harnesses, three model families, and InfiniteBench — the authors find disclosure only pays off once the corpus exceeds what the agent can navigate by direct reading. Their sharpest result is about depth: a second routing level never helps and sometimes breaks accuracy outright. One brief description layer pointing at files is the ceiling; nesting indexes under indexes just gives the agent more chances to route wrong before it ever sees content. For CLAUDE.md / AGENTS.md, the practical translation is to treat the file as a single flat routing layer, not a document tree. Give each area of the repo (or each workflow) a one-to-two-line description plus a direct pointer to the relevant file or directory, and stop there — don't build docs/index.md → docs/backend/index.md → actual content chains, and don't have CLAUDE.md point at intermediate "overview" files whose only job is to point somewhere else. Every intermediate hop is a routing decision the model can fumble, and the paper found those fumbles outweigh any organizational benefit. Inline the small amount of always-relevant content (conventions, build commands) directly, and route to the rest in one hop. The same rule applies to skills. A SKILL.md's frontmatter description is the routing layer; the body should either contain the instructions or point directly at concrete resource files (references/api.md, scripts/build.py) — not at a second index inside the skill. If a skill has grown a table of contents that links to sub-tables of contents, flatten it: more, smaller skills with sharp one-line descriptions beat one mega-skill with internal hierarchy, because selection happens once at the description layer where the model is most reliable. Spend your effort making those one-liners discriminative (when to use this skill vs. its neighbors) rather than organizing the interior. The other half of the result is knowing when disclosure is worth anything at all: it "buys context, not intelligence." On a single-document scale, a strong harness that greps and reads on its own gets near-zero benefit from a curated index — so for a small repo, an elaborate CLAUDE.md routing section is mostly wasted effort. The crossover comes when the corpus grows past what direct navigation can handle (multi-repo setups, large internal doc collections): there, raw navigation collapses while one-level disclosure degrades slowly and pulls ahead. A reasonable default: small codebase, keep CLAUDE.md to conventions and commands; large or multi-repo corpus, invest in the flat index — and in both cases, never go deeper than one level. [arXiv:2607.17598](https://arxiv.org/abs/2607.17598)
- **`.claude/skills/data/object-model.md:134`** — PR #874 (kaljarv)
  > Perhaps add in a succinct way: - The voter can also choose one constituency per election - In multi-elections settings, the constituency selections cannot be contradictory when multiple elections share the same constituency group or the constituencies are nested
- **`.claude/skills/data/object-model.md:135`** — PR #874 (kaljarv)
  > Perhaps add: this allows the user to select only the child constiuency and we can imply the parent.
- **`.claude/skills/data/object-model.md:138`** — PR #874 (kaljarv)
  > Perhaps add: A very common pattern is a party list of candidates which is an OrganizationNomination with CandidateNominations as children.
- **`.claude/skills/database/extension-patterns.md:75`** — PR #874 (kaljarv)
  > Also, add a step for checking the dev-seed templates whether they need updating as well.
- **`.claude/skills/filters/extension-patterns.md:57`** — PR #874 (kaljarv)
  > Add step: Add e2e tests for the filter, preferably in the full voter journey if applicable.
- **`.claude/skills/matching/SKILL.md:1`** — PR #874 (kaljarv)
  > If it's necessary, add a note to the extension patterns in all skills that the skill itself should be checked afterwards bc they contain listings.
- **`CLAUDE.md:1`** — PR #874 (kaljarv)
  > Evaluate and possibly refactor based on these two findings: ## Evidence check: context files (AGENTS.md/CLAUDE.md) don't improve correctness A 288-run ablation across Claude Code and Codex on real repositories found no measurable correctness gain from persistent context files. The study (arXiv, July 28) ran 17 real tasks across 3 repos with gold-standard test grading, comparing runs with and without context files — including each repo's actual human-written AGENTS.md. No configuration converted failures into passes; equivalence testing bounds any effect at ≤10–15 points. The failure analysis is the useful part: agents don't fail from missing repo knowledge (they recover conventions by reading code), they fail on implementation skill — design choices, pattern selection, exact wiring. Practical takeaway: keep context files lean (build/test commands, hard conventions) and stop expecting correctness from prose; invest instead in task decomposition and verification loops (tests, oracles), which target the real failure mode. Code and data are released if you want to reproduce it on your own repos. [Paper](https://arxiv.org/abs/2607.27250) ## Flat hierarchy Testing Agent-Skills-style progressive disclosure against raw-document navigation and a classical hybrid retriever — across three harnesses, three model families, and InfiniteBench — the authors find disclosure only pays off once the corpus exceeds what the agent can navigate by direct reading. Their sharpest result is about depth: a second routing level never helps and sometimes breaks accuracy outright. One brief description layer pointing at files is the ceiling; nesting indexes under indexes just gives the agent more chances to route wrong before it ever sees content. For CLAUDE.md / AGENTS.md, the practical translation is to treat the file as a single flat routing layer, not a document tree. Give each area of the repo (or each workflow) a one-to-two-line description plus a direct pointer to the relevant file or directory, and stop there — don't build docs/index.md → docs/backend/index.md → actual content chains, and don't have CLAUDE.md point at intermediate "overview" files whose only job is to point somewhere else. Every intermediate hop is a routing decision the model can fumble, and the paper found those fumbles outweigh any organizational benefit. Inline the small amount of always-relevant content (conventions, build commands) directly, and route to the rest in one hop. The same rule applies to skills. A SKILL.md's frontmatter description is the routing layer; the body should either contain the instructions or point directly at concrete resource files (references/api.md, scripts/build.py) — not at a second index inside the skill. If a skill has grown a table of contents that links to sub-tables of contents, flatten it: more, smaller skills with sharp one-line descriptions beat one mega-skill with internal hierarchy, because selection happens once at the description layer where the model is most reliable. Spend your effort making those one-liners discriminative (when to use this skill vs. its neighbors) rather than organizing the interior. The other half of the result is knowing when disclosure is worth anything at all: it "buys context, not intelligence." On a single-document scale, a strong harness that greps and reads on its own gets near-zero benefit from a curated index — so for a small repo, an elaborate CLAUDE.md routing section is mostly wasted effort. The crossover comes when the corpus grows past what direct navigation can handle (multi-repo setups, large internal doc collections): there, raw navigation collapses while one-level disclosure degrades slowly and pulls ahead. A reasonable default: small codebase, keep CLAUDE.md to conventions and commands; large or multi-repo corpus, invest in the flat index — and in both cases, never go deeper than one level. [arXiv:2607.17598](https://arxiv.org/abs/2607.17598)

## Phase 161: Project Scoping — `PROJECT_ID` Parameterisation

A `PROJECT_ID` env defaulting to the default project, every query parameterised by it, and E2E creating its own project under a test project id — which removes the full local DB reset from the E2E prerequisites.

**Source:** PRE-SHIP-REFACTORING.md § item 1

## Phase 162: Permissions & Auth Model Refactor

The grants matrix: `grants` keyed `user_id × scope × target_id × role`; scopes global/account/project/entity; roles admin/owner/editor; `can_access_project` split from `can_edit_project`; the `is_child_nominee` predicate; per-project settings governing candidate self-edit and nomination approval; read grants for unpublished projects; and the same `user_can(scope, uuid, verb)` helpers extended to storage. The document itself calls this a follow-up phase and marks it **blocking ship**.

**Source:** PRE-SHIP-REFACTORING.md § Permissions refactoring + PR#866 comments on 300-auth-tables.sql / 301-auth-functions.sql / 302-rls.sql

## Phases moved to the end

Per the operator instruction of 2026-08-28, the two unstarted CI phases run **after** all review
remediation, so that the gates they add are asserted against the post-remediation tree rather than
against a tree still carrying 131 known findings.

- **Phase 163** (was 149): CI Gates — SQL Lint/Format + Secrets & Vulnerability Scanning (CIGATE-01/02/03)
- **Phase 164** (was 150): `RETURNS TABLE` Nullability — Audit + Single Override Mechanism (CIGATE-04/05)

