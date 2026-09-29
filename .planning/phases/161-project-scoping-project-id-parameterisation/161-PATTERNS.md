# Phase 161: Project Scoping — `PROJECT_ID` Parameterisation - Pattern Map

**Mapped:** 2026-08-28
**Files analyzed:** 18 (5 created, 13 modified)
**Analogs found:** 17 / 18

Source of the file list: `161-CONTEXT.md` (D-J1, D-J2, D-D3, F10, F11) and `161-RESEARCH.md`
§ "Recommended file layout (deltas only)", § 6.3 work map, § 4.6, § 7.2, § 8.1.

> **Comment-convention warning that governs every excerpt below.** Phase 152's comment-hygiene scan
> lands in `yarn lint:check` before this phase. Several of the best structural analogs in this repo
> carry comments that will NOT pass it — planning-artifact paths, phase numbers, requirement ids,
> historical narrative. Each such excerpt is marked **STRUCTURE-ONLY (non-model prose)**. Copy the
> shape, not the sentences.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/assert-project-scoped-queries.mjs` *(new)* | guard script (CLI) | file-I/O / batch | `scripts/assert-a11y-scan-wiring.mjs` | exact |
| `package.json` (`assert:*` + `lint:check`) | config | — | `package.json:26-27,35` | exact |
| `packages/dev-seed/tests/projectScopingGate.test.ts` *(new)* | test | file-I/O | `packages/dev-seed/tests/ciTypecheckGate.test.ts:72-85` | exact |
| `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` | service (mixin) | request-response | itself (`get supabase()` guard, `:57-60`) + `packages/dev-seed/src/writer.ts:92-106` | exact |
| `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts` | model (types) | — | itself `:9-16` | exact |
| `apps/frontend/src/lib/utils/constants.ts` | config | — | itself `:1-15` | exact |
| `…/dataProvider/supabaseDataProvider.ts` (9 sites) | service | CRUD (read) | `…/dataWriter/supabaseDataWriter.ts` (already-scoped writes) | role-match |
| `…/dataWriter/supabaseDataWriter.ts` (scope 3, delete 4 derivations) | service | CRUD (write) | `…/adminWriter/supabaseAdminWriter.ts:38-55` | exact |
| `…/adminWriter/supabaseAdminWriter.ts` (scope 1, delete 1) | service | CRUD (write) | same as above | exact |
| `…/feedbackWriter/supabaseFeedbackWriter.ts` (scope 1, delete 1) | service | CRUD (write) | `…/adminWriter/supabaseAdminWriter.ts:38-55` | exact |
| `apps/frontend/vite.config.ts` | config | — | itself `:12-17` (the `FRONTEND_PORT` `loadEnv`) | exact |
| `.env.example` | config | — | itself, `SUPABASE_ANON_KEY` dual-name block | exact |
| `apps/supabase/supabase/functions/identity-callback/index.ts:22,31,197` | service (Deno fn) | request-response | itself `:18-25` env docblock | exact |
| `apps/supabase/supabase/schema/503-entity-rpcs.sql` + `migrations/00001_initial_schema.sql` | migration/SQL | CRUD | `501-bulk-operations.sql` `bulk_delete` (`WHERE project_id = $1`) | role-match |
| `packages/dev-seed/src/supabaseAdminClient.ts` (`ensureProject()`, `:145` default) | service (admin client) | CRUD | `apps/supabase/supabase/seed.sql:23-41` (SQL) + `updateAppSettings` (`:595`) | exact |
| `tests/global-setup.ts` | test harness (hook) | event-driven | itself `:29-53` | exact |
| `tests/scripts/e2e-run.sh` (`--no-db-reset`, spawn env) | shell script | batch | itself `:126-153` arg loop, `:274-280` reset | exact |
| `tests/tests/setup/shared/setupFromTemplate.ts` (`BASELINE_SEED_PREFIX` / probe fate) | test helper | batch | itself `:70-128` | exact |
| Doc edits: `CLAUDE.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md` | docs | — | see § Doc-Edit Targets | n/a |

---

## Pattern Assignments

### 1. `scripts/assert-project-scoped-queries.mjs` (guard script, file-I/O)

**Analog:** `scripts/assert-a11y-scan-wiring.mjs` (231 lines) — the newest and closest of the three;
`scripts/assert-i18n-catalog-namespaces.mjs` (170) is the analog for the **declared-list** half.

**Shebang + docblock + exit-code contract** (`assert-a11y-scan-wiring.mjs:1-59`) —
**STRUCTURE-ONLY (non-model prose):** its docblock names `phase 147`, `CSCAN-02/03`, and
`147-ORDERING.md`. Keep the *sections* (what the guard exists for, an enumerated list of checks, the
"deliberately NOT an AST parse" rationale, `Usage:`, `Exit codes:`); drop every phase/requirement/
planning-path token.

```js
#!/usr/bin/env node

/**
 * ...
 * This is a plain text/regex read of the three source files, matching the
 * house style of `scripts/assert-unit-test-coverage.mjs` (Node built-ins
 * only, no build step, exit 1 naming the specific problem). It is
 * deliberately NOT an AST parse: these are single-sourced, hand-authored
 * config/source files with one occurrence of each pattern, and a regex read
 * is the cheapest thing that can name the violation precisely.
 *
 * Usage:
 *   node scripts/assert-a11y-scan-wiring.mjs
 *
 * Exit codes:
 *   0 - all four checks clean
 *   1 - at least one violation, or a named precondition failure (a file
 *       missing or unreadable)
 */
```

**Imports + repo-root + target-path resolution** (`assert-a11y-scan-wiring.mjs:61-72`) — copy verbatim
in shape; note `REPO_ROOT` is derived from `import.meta.url`, never `__dirname`:

```js
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'scripts/assert-a11y-scan-wiring.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

const PLAYWRIGHT_CONFIG = path.resolve(REPO_ROOT, 'tests', 'playwright.config.ts');
const AXE_SCAN_UTIL = path.resolve(REPO_ROOT, 'tests', 'tests', 'utils', 'axeScan.ts');
```

**Fail-closed file read** (`assert-a11y-scan-wiring.mjs:74-85`) — this is the pattern that stops an
unreadable file from being a silent pass. The guard must reuse it for each adapter source file:

```js
function readSource(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(
      `[ERROR] ${SELF}: could not read '${path.relative(REPO_ROOT, filePath)}' (${error.message}). ` +
        'A file this guard cannot read is wiring it cannot verify — this fails closed.'
    );
    return null;
```

**Declared-list iteration + per-item error** — the shape for `PROJECT_SCOPED_TABLES`
(`assert-i18n-catalog-namespaces.mjs:125-136`); note the declared constant (`NAMESPACE_FLOORS`) is
module-level with a docblock justifying its contents, exactly what D-J1 requires of the table list:

```js
for (const { label, prefix, floor } of NAMESPACE_FLOORS) {
  const count = [...keys].filter((key) => key.startsWith(prefix)).length;
  if (count < floor) {
    violations++;
    console.error(
      `[ERROR] ${SELF}: namespace '${label}' has only ${count} catalog key(s), below its floor of ` +
        `${floor}. ...`
    );
  }
}
```

**Terminal summary + exit code** — both scripts end identically; copy this exactly (a positive
summary line even on success is the house evidence convention):

```js
console.log(`A11y-scan wiring guard (…) — ${violations} violation(s).`);
process.exitCode = violations > 0 ? 1 : 0;
}

main();
```

**Completeness-check pattern (non-negotiable per RESEARCH § 2.2).** In-tree precedent lives in
`tests/playwright.config.ts` (`unparsedTeardownPrefixFiles`); its structure — collect the sites the
guard could NOT parse, then throw naming them and explaining that an unparsed site is an uncovered
site — is what the guard needs for `this.supabase.from(<non-literal>)` (e.g.
`supabaseDataProvider.ts:471`). **STRUCTURE-ONLY (non-model prose):** the in-tree message cites a
review finding id.

**False-positive exclusion measured in the target file** — the guard must not match
`this.supabase.storage.from('public-assets')` (`supabaseDataWriter.ts:298-299` and `:348-349`):

```ts
const { error: uploadError } = await this.supabase.storage
  .from('public-assets')
  .upload(storagePath, file, { cacheControl: '3600', upsert: true });
```

---

### 2. `package.json` wiring (config)

**Analog:** `package.json:25-27,35`. Add the script alias beside its three siblings, then **append**
the link to `lint:check` (never rewrite — 152 and 153 are appending concurrently):

```json
"assert:unit-coverage": "node scripts/assert-unit-test-coverage.mjs",
"assert:i18n-catalog-namespaces": "node scripts/assert-i18n-catalog-namespaces.mjs",
"assert:a11y-scan-wiring": "node scripts/assert-a11y-scan-wiring.mjs",
```

```json
"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring",
```

**Trap, measured:** `assert:unit-coverage` is in `test:unit` (`:28`), **not** in `lint:check`. Do not
copy that precedent. Note `test:e2e` (`:30`) also chains the two `assert:*` guards — decide
explicitly whether the new guard joins it (152's plan explicitly declined).

---

### 3. `packages/dev-seed/tests/projectScopingGate.test.ts` (test, file-I/O)

**Analog:** `packages/dev-seed/tests/ciTypecheckGate.test.ts:72-85` — the codified Phase-144
membership-not-position precedent. Copy the split/trim/`toContain` shape verbatim:

```ts
const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
expect(links).toContain('yarn typecheck');
expect(ROOT_PACKAGE_JSON.scripts['lint:check']).toContain('yarn typecheck:tests');
```

Forbidden assertion shapes (from the same file's own comment, which is a **model** for rationale
style but **STRUCTURE-ONLY** because it names Phase 147): never `endsWith`, never `toBe` on the whole
`lint:check` string, never an index comparison, never a link count.

---

### 4. `supabaseAdapter.ts` — `#projectId`, `get projectId()`, `scopedFrom()` (service/mixin, request-response)

**Analog:** the file itself — the mixin already holds three private fields behind getters and
initialises them in one `init()`. The new state is a fourth member of exactly this shape.

**Private-field + getter + init pattern** (`supabaseAdapter.ts:26-68`):

```ts
export function supabaseAdapterMixin<TBase extends Constructor>(base: TBase): Constructor<SupabaseAdapter> & TBase {
  abstract class WithMixin extends base {
    #supabase: SupabaseClient<Database> | undefined;
    #locale = '';
    #defaultLocale = 'en';

    init(config: SupabaseAdapterConfig): this {
      super.init(config);
      ...
      if (config.locale) this.#locale = config.locale;
      if (config.defaultLocale) this.#defaultLocale = config.defaultLocale;
      return this;
    }

    get supabase(): SupabaseClient<Database> {
      if (!this.#supabase) throw new Error('Supabase client not initialized. Call init() first.');
      return this.#supabase;
    }

    get locale(): string {
      return this.#locale;
    }
```

**Env-source pattern already in this file** (`:40-44`) — the project id resolves from the same
`constants` object, in the same place:

```ts
this.#supabase = createBrowserClient<Database>(
  constants.PUBLIC_SUPABASE_URL,
  constants.PUBLIC_SUPABASE_ANON_KEY,
  { global: { fetch: config.fetch! } }
);
```

**Fail-fast throw message shape** — `packages/dev-seed/src/writer.ts:92-97` is the in-tree model
(names the variable, the remedy, and the expected format). The new throw should name
`PUBLIC_PROJECT_ID`, where to set it, and the default project uuid:

```ts
if (!process.env.SUPABASE_URL) {
  throw new Error(
    'SUPABASE_URL env var is required but not set. ' +
      'Did you forget to run `supabase start`? ' +
      'Expected format: http://127.0.0.1:54321'
  );
}
```

**Comment convention note:** this file's `// reason:` block at `:10-15` cites
`shared-config/eslint.config.mjs:98-102` — an in-tree source path, which is acceptable; it names no
phase/plan/decision. It is a **model** for how to justify a deliberate deviation.

---

### 5. `supabaseAdapter.type.ts` (model/types)

**Analog:** itself. Add an optional `projectId?: string` override to `SupabaseAdapterConfig` and a
`readonly projectId: string` to `SupabaseAdapter`, matching the existing one-line-docblock-per-member
style (`:9-27`):

```ts
export interface SupabaseAdapterConfig extends AdapterConfig {
  /** Current locale for JSONB localization extraction. */
  locale?: string;
  /** Default locale fallback (from projects.default_locale). */
  defaultLocale?: string;
  /** Pre-built server-side SupabaseClient (e.g., from hooks.server.ts). When provided, skips createClient(). */
  serverClient?: SupabaseClient<Database>;
}

export interface SupabaseAdapter {
  /** The typed Supabase client instance. */
  readonly supabase: SupabaseClient<Database>;
  /** The current locale for data extraction. */
  readonly locale: string;
  /** The default locale for fallback. */
  readonly defaultLocale: string;
}
```

Note `defaultLocale`'s doc already says *"from projects.default_locale"* — the config type already
anticipates project-derived state.

---

### 6. `constants.ts` (config)

**Analog:** itself, `:1-15`. Add an eleventh key in the same flat `env.X ?? ''` idiom:

```ts
import { env } from '$env/dynamic/public';

export const constants = {
  ...
  PUBLIC_SUPABASE_URL: env.PUBLIC_SUPABASE_URL ?? '',
  PUBLIC_SUPABASE_ANON_KEY: env.PUBLIC_SUPABASE_ANON_KEY ?? ''
};
```

**Do not deviate here.** Keep the `?? ''`; the fail-fast throw belongs in the mixin (§ 4), not in
this file — otherwise every module importing `constants` throws at import time, including server-side
modules that never touch the adapter.

---

### 7. `supabaseDataProvider.ts` — 9 read-path sites (service, CRUD-read)

**Analog for the target shape:** the writers, which already carry `project_id`. **Analog for what is
being replaced:** the file itself. All four measured call shapes, so the planner sees exactly what a
`scopedFrom()` rewrite must absorb:

**(a) Single-line chain + `.limit(1).single()`** — `:49` and `:85`. This one is also a latent
multi-project bug: `.limit(1).single()` picks an arbitrary `app_settings` row the moment a second
project exists.

```ts
const { data, error } = await this.supabase.from('app_settings').select('settings').limit(1).single();

if (error) {
  if (error.code === 'PGRST116') return {}; // No rows -- return empty settings
  throw new Error(`getAppSettings: ${error.message}`);
}
```

**(b) `let`-bound builder reassigned across an `if`** — `:139-148` (also `:180-186` for
`constituency_groups`, `:539-542` for `questions`). This is the shape that defeats a naive
"chain contains `.eq('project_id')`" matcher:

```ts
let query = this.supabase
  .from('elections')
  .select('*, election_constituency_groups(constituency_group_id)')
  .order('sort_order');

if (options?.id) {
  query = Array.isArray(options.id) ? query.in('id', options.id) : query.eq('id', options.id);
}

const { data, error } = await query;
if (error) throw new Error(`getElectionData: ${error.message}`);
```

**(c) `.from(table)` with a union-typed loop variable** — `:471`. `table` is
`'candidates' | 'organizations'`, so `this.scopedFrom(table)` type-checks; a literal-argument
completeness check in the guard is what forces this site to be converted rather than skipped:

```ts
for (const { table, entityType } of types) {
  let query = this.supabase.from(table).select('*').order('sort_order');
  if (options?.id) {
    query = Array.isArray(options.id) ? query.in('id', options.id) : query.eq('id', options.id);
  }
  const { data, error } = await query;
  if (error) throw new Error(`getEntityData (${table}): ${error.message}`);
```

**(d) RPC with no `.from()` at all** — `:259`, inside a `flatMap` fan-out over `[null]` defaults:

```ts
const electionIds: Array<string | null> = options?.electionId ? … : [null];
const constituencyIds: Array<string | null> = options?.constituencyId ? … : [null];

const calls = electionIds.flatMap((eid) =>
  constituencyIds.map((cid) =>
    this.supabase.rpc('get_nominations', {
```

**Error-message convention to preserve across every rewrite:**
`` throw new Error(`getElectionData: ${error.message}`) `` — method name, colon, provider message.

---

### 8. The three writers (service, CRUD-write)

**Analog for the derivation being deleted:** `supabaseAdminWriter.ts:38-55` — the cleanest instance
of the pattern that appears four more times in `supabaseDataWriter.ts` (`:125-139`, `:287-293`,
`:339-347`, `:400-408`) and once in `supabaseFeedbackWriter.ts` (`:15-21`):

```ts
async insertJobResult({ data }: InsertJobResultOptions): Promise<DataApiActionResult> {
  // Resolve project_id from election_id (AdminJobRecord doesn't include project_id
  // but the admin_jobs table requires it for RLS)
  const { data: election, error: electionError } = await this.supabase
    .from('elections')
    .select('project_id')
    .eq('id', data.electionId)
    .single();
  if (electionError || !election)
    throw new Error(`Failed to resolve project for election: ${electionError?.message ?? 'not found'}`);

  const { error } = await this.supabase.from('admin_jobs').insert({
    project_id: election.project_id,
    job_id: data.jobId,
    ...
```

Each of these round-trips exists solely to answer *"which project am I in?"* — the question
`this.projectId` now answers. Delete the derivation, keep the `insert({ project_id: … })`.

**`supabaseFeedbackWriter.ts` in full (35 lines) — the one that is a live bug**, because
`.limit(1).single()` returns `PGRST116` the moment this phase creates a second project:

```ts
export class SupabaseFeedbackWriter extends supabaseAdapterMixin(UniversalFeedbackWriter) {
  protected async _postFeedback(data: WithRequired<FeedbackData, 'date'>): Promise<DataApiActionResult> {
    const { data: settings, error: settingsError } = await this.supabase
      .from('app_settings')
      .select('project_id')
      .limit(1)
      .single();
    if (settingsError || !settings)
      throw new Error(`postFeedback: failed to resolve project_id: ${settingsError?.message ?? 'no app_settings row'}`);

    const { error } = await this.supabase.from('feedback').insert({
      project_id: settings.project_id,
      ...
```

Its class docblock (`:6-12`) states *"single-project deploy"* — that sentence becomes false and must
be rewritten with the rest of the method.

---

### 9. `apps/frontend/vite.config.ts` — root-`.env` plumbing (config)

**Analog:** itself, `:8-17`. The `FRONTEND_PORT` read is the *exact* precedent — same file, same
mechanism, same repo-root derivation, and the existing comment already explains the prefix semantics
and the `process.env`-overlay ordering the new key depends on:

```ts
// The root `.env` lives two levels above `apps/frontend`. `apps/frontend/package.json` declares
// `type: module`, so `__dirname` is unavailable here — derive the repo root from `import.meta.url`.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig(({ mode }) => {
  // The prefix is the literal variable name: `FRONTEND_PORT` carries no `VITE_` prefix, so Vite's
  // default prefix would match nothing, and the empty-string prefix would pull in every entry of a
  // secrets file. `loadEnv` overlays `process.env` AFTER the parsed file, so a one-off shell prefix
  // (`FRONTEND_PORT=5273 yarn dev`) still overrides a persistent value in the root `.env`.
  const env = loadEnv(mode, repoRoot, 'FRONTEND_PORT');
```

This comment block is a **model** under the post-152 convention: it explains a mechanism, cites no
phase and no planning path. Consumption pattern at `:37`: `port: Number(env.FRONTEND_PORT) || 5173`.

---

### 10. `.env.example` (config)

**Analog:** the tracked file's own Supabase block (read via `git show HEAD:.env.example` — the
working-copy path is permission-blocked). Sectioned `####` banners; a duplicated name carries its
reason inline on the line above — precisely the pattern to copy if the planner lands two names:

```
################################################################
# Supabase configuration (local dev defaults from `supabase start`)
################################################################

PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# Get it with: yarn workspace @openvaa/supabase supabase status -o env
PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
# Anon (publishable) key for the local Supabase stack. Same value as PUBLIC_SUPABASE_ANON_KEY — duplicated because the opt-in bank-auth E2E specs read the unprefixed name and throw at module load without it.
SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

---

### 11. `identity-callback/index.ts` (Deno service, request-response)

**Analog:** itself. The env-documentation convention is a bulleted list in the module docblock
(`:18-25`) — the rename must be reflected there as well as at the read site:

```ts
 * - IDENTITY_PROVIDER_CLIENT_ID: Expected audience in the JWT (checked when set)
 * - IDENTITY_PROVIDER_ISSUER: Expected issuer of the JWT (checked when set)
 * - DEFAULT_PROJECT_ID: Project to assign self-registered candidates to
 * - SUPABASE_URL: Supabase project URL (auto-set by Supabase)
```

The two owned sites, verbatim as they read today (`:31` is 161's; `:197` is 155's — verify its
actual state at planning time, 155 is expected to have made it throw):

```ts
const DEFAULT_SEED_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
```

```ts
const projectId = project_id || Deno.env.get('DEFAULT_PROJECT_ID') || DEFAULT_SEED_PROJECT_ID;
```

**Edge-function env wiring is absent** — `apps/supabase/supabase/config.toml:379-380` is commented
out and there is no `functions/.env`:

```toml
# [edge_runtime.secrets]
# secret_key = "env(SECRET_VALUE)"
```

---

### 12. `ensureProject()` on `packages/dev-seed/src/supabaseAdminClient.ts` (service, CRUD)

**Analog (behaviour):** `apps/supabase/supabase/seed.sql:23-41` — the verbatim bootstrap template,
including the required `app_settings` row and the reusable default account:

```sql
-- Default account for single-tenant deployment
INSERT INTO accounts (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Account')
ON CONFLICT (id) DO NOTHING;

-- Default project for single-tenant deployment
INSERT INTO projects (id, account_id, name, default_locale)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Default Project',
  'en'
)
ON CONFLICT (id) DO NOTHING;

-- Default app_settings for the default project
INSERT INTO app_settings (project_id, settings)
VALUES ('00000000-0000-0000-0000-000000000001', '{}'::jsonb)
ON CONFLICT (project_id) DO NOTHING;
```

**Analog (host class):** the constructor and its default-resolution point — the single edit that
re-points all 51 argument-less construction sites:

```ts
export class SupabaseAdminClient {
  protected client: SupabaseClient;
  protected projectId: string;

  constructor(url?: string, serviceRoleKey?: string, projectId?: string) {
    this.client = createClient(url ?? SUPABASE_URL, serviceRoleKey ?? SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    this.projectId = projectId ?? TEST_PROJECT_ID;
  }
```

**Analog (method body / scoped query idiom)** — the class's own `.eq('project_id', this.projectId)`
convention, `:337-341` (one of 8 such sites) and the constant at `:34-37`:

```ts
const { data: questions, error: qError } = await this.client
  .from('questions')
  .select('id, external_id')
  .in('external_id', [...questionExtIds])
  .eq('project_id', this.projectId);
```

```ts
/**
 * Stable UUID for the default test project, from seed.sql.
 */
export const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
```

**Placement rationale, from the class docblock at `:133-136`** — `client`/`projectId` are `protected`
so the `tests/` subclass reuses them; putting `ensureProject()` here means
`tests/tests/utils/supabaseAdminClient.ts` inherits it with zero wiring, and `yarn db:seed` gains
project creation too. **STRUCTURE-ONLY (non-model prose):** the docblock says
*"(RESEARCH finding 5)"* and the module header says *"per (see phase 56, 2026-04-22)"* — both are
post-152 violations; do not extend them, and do not imitate them in `ensureProject()`'s own doc.

**Subclass surface convention** — `tests/tests/utils/supabaseAdminClient.ts:13-32` maintains an
explicit "Inherited from `DevSeedAdminClient`" list. Adding a public base method means updating that
list, or it silently drifts.

---

### 13. `tests/global-setup.ts` (test harness hook, event-driven)

**Analog:** itself, `:29-53`. The whole file is a thin adapter; project creation is one `await` after
`assertServedApp` so an identity failure is still the first thing reported. Note the file is
otherwise a **model** for comment style (mechanism-explaining, no plan paths) except its title line
`— the served-application gate (see phase 137)` and the `PLAYWRIGHT_BANK_AUTH` ordering note.

```ts
export default async function globalSetup(config: FullConfig): Promise<void> {
  // READ the target; never recompute it. ...
  const baseURL =
    config.projects[0]?.use?.baseURL ??
    (process.env.FRONTEND_PORT ? `http://localhost:${process.env.FRONTEND_PORT}` : 'http://localhost:5173');

  // `TESTS_DIR` is `<repo-root>/tests/tests`, so the root is two levels up.
  const repoRoot = path.resolve(TESTS_DIR, '..', '..');

  const deadlineMs = process.env.CI ? 120_000 : 30_000;

  await assertServedApp({ baseURL, repoRoot, deadlineMs });
}
```

Insertion point: after `:52`, the last statement. Registered at `tests/playwright.config.ts:298`
(`globalSetup: './global-setup.ts'`); **no `globalTeardown` is configured** — grep confirms only
`globalSetup:` exists, so a teardown hook would be new surface (unnecessary under the
leave-the-row-in-place posture).

---

### 14. `tests/scripts/e2e-run.sh` — `--no-db-reset` (shell, batch)

**Analog:** itself. Three excerpts define everything the new flag must match.

**(a) Value-taking flag parsing + `require_value` guard** (`:110-153`). A boolean flag needs **no**
`require_value` call and a single `shift`:

```sh
# $1 = flag name, $2 = the caller's remaining argument count ($#).
require_value() {
  if [ "$2" -lt 2 ]; then
    echo "e2e-run.sh: $1 requires a value" >&2
    usage >&2
    exit 2
  fi
}

while [ $# -gt 0 ]; do
  case "$1" in
    --run-dir)
      require_value --run-dir $#
      RUN_DIR="$2"
      shift 2
      ;;
    --project)
      require_value --project $#
      PROJECT="$2"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "e2e-run.sh: unknown argument '$1'" >&2
      usage >&2
      exit 2
      ;;
  esac
done
```

**(b) The unconditional reset, step 3** (`:274-280`) — the block the flag guards:

```sh
# --- 3. database reset ---------------------------------------------------------------

echo "e2e-run.sh: yarn db:reset (starts Supabase first) ..."
if ! (cd "$REPO_ROOT" && yarn db:reset > "$RUN_DIR/db-reset.log" 2>&1); then
  echo "e2e-run.sh: FATAL -- yarn db:reset failed; see $RUN_DIR/db-reset.log" >&2
  exit 3
fi
```

⚠ Skipping step 3 also skips *starting Supabase* (the header at `:20` says the script starts Supabase
**via** `yarn db:reset`). A `--no-db-reset` path must still ensure Supabase is up before step 4's
readiness poll, or it converts a clean exit-3 into an exit-4 timeout.

**(c) The header contract that must be updated with the flag** — `usage()` prints the header block
verbatim (`:102-107`), and the exit-code table at `:52-60` is what callers branch on. Adding a flag
means editing the `# Usage:` block, the numbered "The script automatically:" list (item 3), and the
`3  yarn db:reset failed` row. The dev-server spawn (`set -m` at `:353`) is where
`PUBLIC_PROJECT_ID="$E2E_PROJECT_ID"` joins the existing `FRONTEND_PORT="$FRONTEND_PORT"` prefix.

**Env-reading helper already present** (`:284-295`) — reuse it rather than adding a second reader:

```sh
# Read a variable from the environment, falling back to the root .env. Never hardcode a
# key into a committed script (CLAUDE.md: never commit secrets).
read_env_var() {
  local name="$1"
  local value="${!name:-}"
  if [ -z "$value" ] && [ -f "$REPO_ROOT/.env" ]; then
    value="$(grep -E "^${name}=" "$REPO_ROOT/.env" | head -1 | cut -d= -f2- | tr -d '\042\047\r')"
  fi
  printf '%s' "$value"
}
```

---

### 15. `setupFromTemplate.ts` — the freshness probe (test helper, batch)

**Analog:** itself, `:70-128`. The declaration and the probe, verbatim, so the planner can state
their fate (O-4) against the actual text:

```ts
// reason: dev-seed `default` template emits `seed_`-prefixed baseline rows into
// TEST_PROJECT_ID (packages/dev-seed/src/ctx.ts:89 — `externalIdPrefix ?? 'seed_'`).
// The freshness probe must NOT treat those auto-seeded baseline rows as
// "non-test contamination". ...
const BASELINE_SEED_PREFIX = 'seed_';
```

```ts
async function probeFreshDatabasePrecondition(client: SupabaseAdminClient, prefix: string): Promise<void> {
  const requireFresh = process.env.E2E_REQUIRE_FRESH_DB === 'true';
  const candQuery = client.query('candidates');
  const { data: nonTestCands, error: candErr } = await candQuery
    .not('external_id', 'like', `${prefix}%`)
    .not('external_id', 'like', `${BASELINE_SEED_PREFIX}%`)
    .limit(5);
  ...
  if (requireFresh) {
    throw new Error(message);
  }
  console.warn(message);
}
```

**Non-model flag (`base.setup.ts:20-38`).** This is the file the focus brief calls out. Its
`extraTeardownPrefix` comment is a 19-line historical narrative naming `phase 140 CR-01`,
`iteration-2 regression fix`, and an incident chronology (*"used to self-heal … and now would not,
silently wedging voter-journey's exact-count assertions … until an out-of-band `yarn db:reset`"*).
**Do NOT copy this comment style.** The call it documents stays unchanged:

```ts
await setupFromTemplate('e2e/base', { extraTeardownPrefix: ['e2e-perm-', 'e2e-bankauth-'] });
```

If the planner touches that comment at all, the post-152 rewrite states the invariant (*"these two
prefixes belong to other families; wiping them here is idempotent and never touches `test-` rows"*)
without the incident history.

---

## Shared Patterns

### Fail-closed guards
**Source:** `scripts/assert-a11y-scan-wiring.mjs:74-85` (unreadable file → `[ERROR]` + violation),
`tests/playwright.config.ts` (`unparsedTeardownPrefixFiles` → throw).
**Apply to:** the new guard script, both halves (table list and RPC list).
A guard that saw nothing must fail, never pass.

### `[ERROR] ${SELF}: …` message format
**Source:** both existing `assert-*.mjs` scripts.
**Apply to:** every violation the new guard emits — prefix, script path, offending `file:line`, the
declared name that was violated, and one sentence on the consequence.

### Positive summary line + `process.exitCode`
**Source:** `assert-a11y-scan-wiring.mjs:227-229`, `assert-i18n-catalog-namespaces.mjs:157-166`.
**Apply to:** the new guard. `console.log(... — N violation(s).)` then
`process.exitCode = violations > 0 ? 1 : 0;` then `main();`.

### Chain MEMBERSHIP, never position
**Source:** `packages/dev-seed/tests/ciTypecheckGate.test.ts:72-85`.
**Apply to:** the new gate spec and any assertion about `lint:check`. Append to `lint:check`; never
rewrite it (152 and 153 append concurrently).

### Method-name-prefixed error strings
**Source:** `supabaseDataProvider.ts:53,149` / `supabaseFeedbackWriter.ts:21,31`.
**Apply to:** every rewritten adapter query — `` `getElectionData: ${error.message}` ``.

### Repo-root from `import.meta.url`
**Source:** `apps/frontend/vite.config.ts:10`, `scripts/assert-a11y-scan-wiring.mjs:66`.
**Apply to:** the guard script and any new node/config module. Never `__dirname`.

### Idempotent bootstrap
**Source:** `apps/supabase/supabase/seed.sql:23-41`.
**Apply to:** `ensureProject()` — `INSERT … ON CONFLICT (…) DO NOTHING`, never SELECT-then-INSERT.

### Post-152 comment convention — in-tree models vs. non-models

| Model (copy the style) | Non-model (copy structure only) |
|---|---|
| `apps/frontend/vite.config.ts:8-17` — mechanism, no phase/plan tokens | `scripts/assert-a11y-scan-wiring.mjs:3-20` — `phase 147`, `CSCAN-02`, `147-ORDERING.md` |
| `supabaseAdapter.ts:10-15` — `// reason:` citing an in-tree source path only | `scripts/assert-i18n-catalog-namespaces.mjs:3-40` — `phase 147`, `147-VALIDATION gap G1`, `147-NEGATIVE-CONTROL.md` |
| `supabaseAdminClient.ts:14-19` (dev-seed) — the bulk-import routing note, pure mechanism | `packages/dev-seed/src/supabaseAdminClient.ts:4,8` — `per (see phase 56, 2026-04-22)`, `per (NF-02 …)`, `(RESEARCH finding 5)` |
| `tests/global-setup.ts:29-51` body comments | `tests/tests/setup/shared/base.setup.ts:20-38` — incident narrative + `phase 140 CR-01` |
| `ciTypecheckGate.test.ts:72-85` rationale (except its `Phase 147` sentence) | `supabaseDataProvider.ts:238-244` — cites `variant-constituency.spec.ts:237` and prior-shape history |

---

## Doc-Edit Targets (current text, reported not edited)

| Site | Current text |
|---|---|
| `CLAUDE.md:276-286` | ```### Running tests after changes``` … ```# Full E2E (requires Supabase running)``` / `yarn db:reset` / `yarn dev` / `# Wait for services to be healthy` / `yarn test:e2e` — **the primary retired instruction** |
| `tests/README.md:7` | `# Prereqs: yarn install && (in another shell) yarn dev` — already correct, states no reset |
| `tests/README.md:80-83` | *"For a manual reseed of the base dataset before running voter specs, use the manual chain:"* → `yarn db:reset && yarn db:seed --template e2e/base && yarn dev:clean` |
| `tests/README.md:248` | `- Fresh database with only `test-` prefixed rows` (under *"Most specs assume the following baseline established by `data-setup-base`"*) |
| `tests/README.md:276` | `- **`yarn db:reset` in another terminal will wipe the suite mid-run** — the teardown projects are the only legitimate path to clear test data. Don't reset while the suite is running.` |
| `tests/IDURA-TEST-RUNBOOK.md:395-396` | *"The project-memory E2E prereq still applies: **one fresh dev server on `:5173`** … + a **clean DB** (`yarn db:reset`) before the run."* |
| `tests/IDURA-TEST-RUNBOOK.md:401` | `yarn db:reset                              # clean DB first (project-memory prereq)` (inside the Terminal-1 block) |

`CLAUDE.md:17,81,82,92,93,307,403` document `db:reset` as a **command** — those stay. Only the sites
stating it as an **E2E precondition** are retired. Grep scope is live docs only.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `apps/supabase/supabase/schema/503-entity-rpcs.sql` — adding a required `p_project_id` to `get_nominations` + re-issuing the `GRANT` for the new arity, mirrored into `migrations/00001_initial_schema.sql` | migration/SQL | CRUD | No in-tree precedent for *changing an existing RPC's signature* across both the `schema/` tree and the applied migration. The nearest partial analog is `501-bulk-operations.sql`'s `bulk_delete`, which takes a top-level `project_id` and filters `WHERE project_id = $1 AND external_id LIKE $2` — copy its *parameter posture* (required, not `DEFAULT NULL`), not its structure. Phase 156's unresolved D-E2 (rewrite migrations in place vs. add a migration) governs the mechanics; use RESEARCH § 2.3 and § 3.1 instead of a code analog. |

---

## Metadata

**Analog search scope:** `scripts/`, `package.json`, `apps/frontend/src/lib/api/adapters/supabase/**`,
`apps/frontend/src/lib/utils/`, `apps/frontend/vite.config.ts`, `packages/dev-seed/src/`,
`packages/dev-seed/tests/`, `tests/` (global-setup, playwright.config, scripts, setup/shared, utils),
`apps/supabase/supabase/{seed.sql,config.toml,schema,functions}`, `.env.example` (via `git show`).
**Files opened:** 24
**Pattern extraction date:** 2026-08-28
