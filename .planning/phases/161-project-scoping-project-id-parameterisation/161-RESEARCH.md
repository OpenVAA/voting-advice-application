# Phase 161: Project Scoping — `PROJECT_ID` Parameterisation - Research

**Researched:** 2026-08-28
**Domain:** SvelteKit env resolution · Supabase/PostgREST query scoping · Playwright suite lifecycle · repo lint-gate guards
**Confidence:** HIGH on the mechanics (everything load-bearing was opened and, where possible, executed); MEDIUM on the two places the planner must still choose (variable-name convergence, teardown posture)
**Branch/HEAD:** `integration/ship-12-squash`, working tree as of 2026-08-28

## Summary

The phase is smaller than the roadmap's "31 references" suggests on the write side and **much** larger on the read side, and its hardest problem is not the queries at all — it is **env plumbing that does not exist**. Three facts, all measured this session, reshape the plan:

1. **A bare `PROJECT_ID` cannot reach the browser.** `svelte.config.js` does not override `kit.env.publicPrefix`, so SvelteKit's default `'PUBLIC_'` applies (verified in `node_modules/@sveltejs/kit/src/core/config/options.js`). The Supabase adapter constructs a **browser** client (`supabaseAdapter.ts:36-44`), so the id must be `PUBLIC_`-prefixed. Criterion 1's literal wording ("a `PROJECT_ID` environment variable") is not satisfiable as written for the frontend; the planner must record the deviation.
2. **The repo-root `.env` does not reach the frontend at all today.** Measured: `yarn workspace @openvaa/frontend …` runs with cwd `apps/frontend`; SvelteKit reads env from `loadEnv(mode, kit.env.dir = process.cwd(), '')`; `loadEnv` from `apps/frontend` yields exactly `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` (from the untracked local `apps/frontend/.env`), while `loadEnv` from the repo root yields ten `PUBLIC_*`/`FRONTEND_PORT` keys. So criterion 1's "documented in `.env.example`" is **necessary but not sufficient** — a plumbing task must accompany it, or the variable is documented in a file the application never reads.
3. **`get_nominations` is not project-scoped and its joins do not scope it transitively** (`503-entity-rpcs.sql:74-89`). With both parameters defaulting to `NULL` — which is exactly what the voter app sends before an election is chosen (`supabaseDataProvider.ts:~238-252` fans out `[null]`) — it returns nominations from **every** project. O-3's step-4 question has a definite answer: it needs a project parameter.

On the guard: the naive predicate ("every `.from('x')` chain carries `.eq('project_id', …)`") is **not expressible** against this code. Four measured call shapes defeat it — a `let`-bound builder reassigned across an `if` (`:139-148`), a `.from(table)` whose argument is a loop variable over a typed union (`:471`), and `this.supabase.storage.from('public-assets')` (`supabaseDataWriter.ts:299,349`), which is a *bucket*, not a table. The tractable design inverts the predicate into a **forbidden call shape**, which is trivially checkable and stronger.

On E2E: the test-side plumbing is already almost entirely built. `packages/dev-seed/src/supabaseAdminClient.ts` scopes **every** query by `this.projectId` (10 measured `.eq('project_id', this.projectId)` sites) and all **51** `new SupabaseAdminClient()` construction sites pass no argument, so one default-resolution edit at `:145` re-points the whole suite. What genuinely does not exist is project **creation** and the frontend's knowledge of which project the run is using.

**Primary recommendation:** converge on **one** variable name, `PUBLIC_PROJECT_ID`, resolved at **one** site — `supabaseAdapterMixin.init()` — with fail-fast; make the guard a `scripts/assert-project-scoped-queries.mjs` in the house idiom enforcing *"no bare `this.supabase.from(<declared scoped table>)` in the adapter — use the scoped helper"*; and make the E2E lifecycle **create-if-absent, never delete the project row**, so the `app_settings` FK gap (O-1) never fires and Phase 156 is not blocked on.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Resolving which project this deployment serves | Frontend Server (SSR) + Browser | — | The adapter runs in both (`supabaseAdapter.ts:34-51`); the value must therefore be `PUBLIC_`-prefixed and present in both environments. |
| Applying the project filter to reads | API/adapter boundary (`dataProvider/`) | Database (RLS, defence in depth) | D-J1 rejected RLS as the *guard*; RLS stays as depth. The filter itself belongs in the adapter, where it can fail loudly. |
| Applying the project filter to writes | API/adapter boundary (three writers) | Database (RLS `can_access_project`) | The writers today *derive* project ids by extra round-trips; centralised resolution removes three queries. |
| Project scoping inside RPCs | Database (SQL function bodies) | — | A static source guard cannot see inside `get_nominations`; the parameter must exist in SQL. |
| Creating/serving the E2E project | Test harness (`globalSetup` + admin client) | Database (service role bypasses RLS) | D-J2 locks `globalSetup`; the service-role client already bypasses `projects`' deny-by-default RLS. |
| Delivering the E2E project id to the running dev server | Shell/process env at dev-server spawn | Build config (`vite.config.ts` plumbing) | The dev server starts **before** Playwright; only its own process env can carry the value. |
| Documenting the prerequisite | Live docs (`CLAUDE.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md`) | — | Criterion 4. |

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-J1 — the guard (roadmap criterion 2). Won: option (a), by default (★ RECOMMENDED, unticked).**

> **(a) An ESLint/source rule asserting every `.from(<project-scoped table>)` chain in the adapter carries a `project_id` filter, with the scoped-table list declared explicitly.**

Winning rationale (verbatim): *"criterion 2 says 'caught by a guard rather than by a reviewer'; a declared table list is readable and fails at the call site. Same enforcement shape as F4a, so one mechanism covers both."*

Rejected and not to be re-proposed:
- **(b) Rely on RLS** — *"defence in depth and impossible to bypass; RLS returns empty results rather than failing, so an unparameterised query is silently wrong exactly where the phase wants it loud."* **RLS is not the guard.** It may remain as defence in depth; it does not discharge criterion 2.
- **(c) Review-only, no guard** — *"the criterion names the guard as the deliverable."*

Binding: the guard is **static**, fails **at the call site**, reads from an **explicitly declared list of project-scoped tables**, and runs inside **`yarn lint:check`**. It must cover the **read** path as well as the write path — a guard scoped to "where `project_id` already appears" would pass a completely unscoped provider.

**D-J2 — E2E project lifecycle (criterion 3). Won: option (a), by default.**

> **(a) A fixed `E2E_PROJECT_ID`, created by Playwright global setup if absent and torn down after.**

Winning rationale (verbatim): *"deterministic, debuggable (the same id every run), composes with the existing preflight in global setup, and satisfies 'green twice in a row without an intervening reset' by construction. Note the known interaction: seed teardown must unregister invited auth users (already fixed 2026-06-02) or the second run hits 'already registered'."*

Rejected: **(b) fresh uuid per run** — *"leaks a project per crashed run and makes a failed run's data unfindable"*; **(c) one project per worker** — *"multiplies seed cost by the worker count and complicates every fixture."*

Lifecycle constraints: the id must be **fixed**, **distinct** from `00000000-0000-0000-0000-000000000001`; creation is **idempotent** (present → reuse, absent → create); it happens in **`globalSetup`**, after the preflight; teardown **MAY** be a no-op leaving the row in place, but the planner **must state which it is**.

**D-D3 — the 155/161 boundary on `identity-callback:197`. Won: option (a), by default.**

> **(a) Throw in 155 on missing `DEFAULT_PROJECT_ID`; let 161 rename/converge the variable.**

Ownership: `:197`'s `||` chain → **Phase 155**. `:31`'s `DEFAULT_SEED_PROJECT_ID` constant → **Phase 161**. The **name** → **Phase 161**.

**Cross-cutting (§ N, all unticked → ★ wins):**
- **D-N1 (a):** Phase 152's comment-hygiene scan lands in `yarn lint:check` and runs *before* 161. Every comment 161 writes is authored under the post-152 convention — no planning-artifact paths, no phase/plan numbers, no decision ids, no historical narrative in source comments.
- **D-N2 (a):** Follow-ups 161 uncovers but does not fix are filed as `.planning/todos/pending/` entries **during this phase**.
- **D-N3 (a):** `161-CONTEXT.md` is the phase's context; `.planning/v2.15-DISCUSSION-POINTS.md` § J / § D3 / § 0 / § N is the citation.

### Claude's Discretion

- The concrete guard mechanism for D-J1 (custom ESLint rule vs. `scripts/assert-*.mjs`), provided it runs in `yarn lint:check` and reads from an explicitly declared table list.
- The literal value of the fixed `E2E_PROJECT_ID` uuid, provided it is not `00000000-0000-0000-0000-000000000001`.
- Whether teardown deletes the E2E project row or leaves it for idempotent reuse — **the choice must be stated** and must survive the twice-in-a-row proof.
- Module layout of the project-create/teardown helper and where it sits relative to `tests/tests/utils/supabaseAdminClient.ts`.
- Exact wording of the `CLAUDE.md` / `tests/README.md` edits, within the site list in F11.

### Deferred Ideas (OUT OF SCOPE)

- The permissions/grants model itself (Phase 162 — and note that Phase 162 is **deferred from this planning run** entirely; `.planning/REQUIREMENTS.md:314`).
- Multi-project *serving* / tenant switching.
- Phase 155's `identity-callback` env-default hardening (`:197`).
- Any change to the E2E preflight (Phase 137's `globalSetup` gate) — 161 **composes** with it.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRESHIP-01 | *"Every project-scoped query names the project it is for, and an E2E run creates its own project instead of requiring the whole local database to be reset. A `PROJECT_ID` environment variable exists — it does not today … The adapter's 31 `project_id` references are the baseline to convert, and a query missing the parameter is caught by a guard rather than by a reviewer. `yarn test:e2e` runs green twice in a row with no intervening `yarn db:reset` … and `CLAUDE.md` plus `tests/README.md` match."* — `.planning/REQUIREMENTS.md:167` | R1 (§ 1) resolves the variable name and the plumbing gap; R2 (§ 2) supplies a guard design that is expressible against the measured call shapes, plus the RPC answer; R6 (§ 6) supplies the resolution site and the full work map; R4 (§ 4) supplies the E2E lifecycle including the missing create capability; R5 (§ 5) resolves the freshness probe; R7 (§ 7) supplies the twice-in-a-row procedure and its cost; R8 (§ 8) supplies the doc-site list. |

**⚠ Correction to CONTEXT.md O-5.** O-5 states *"PRESHIP-01 is not a registered requirement — `.planning/REQUIREMENTS.md` contains **no** `PRESHIP-*` (nor `REVIEW-*`) ids."* **That is now false.** `.planning/REQUIREMENTS.md:83` carries a block *"Added 2026-08-28. REVIEW-\* and PRESHIP-\* below are the acceptance surface for the review-remediation phases 152–162"*; `PRESHIP-01` is defined at **`:167`**, rolled up at **`:313`** (`| PRESHIP-01 | Phase 161 … | Pending |`) and at **`:342`** (`| 161 … | PRESHIP-01 | 1 |`). O-5 was measured before the requirements file was updated in the same session. **The traceability gap is closed; the verifier should not treat it as open.** `[VERIFIED: .planning/REQUIREMENTS.md:83,167,313,342]`
</phase_requirements>

---

## Standard Stack

No new runtime dependency is required by this phase. Everything it needs is already in the tree.

### Core (all already present — no installs)

| Library / mechanism | Version | Purpose | Why standard here |
|---------|---------|---------|--------------|
| `@sveltejs/kit` `$env/dynamic/public` | catalog `^2.55.0` (`.yarnrc.yml`) | Runtime public env in browser + server | Already the sole env path (`apps/frontend/src/lib/utils/constants.ts:1`) `[VERIFIED: apps/frontend/src/lib/utils/constants.ts:1-15]` |
| `vite` `loadEnv` | `^6.4.1` (`apps/frontend/package.json:50`) | Reading the repo-root `.env` for a named prefix | Already used for exactly this at `apps/frontend/vite.config.ts:17`, with an in-file comment explaining the prefix mechanism `[VERIFIED: apps/frontend/vite.config.ts:12-18]` |
| Node built-ins (`node:fs`, `node:path`, `node:url`) | Node ≥22 | The guard script | House idiom — all three existing `scripts/assert-*.mjs` are Node-built-ins-only `[VERIFIED: scripts/assert-a11y-scan-wiring.mjs:44-47,61-63]` |
| `@supabase/supabase-js` service-role client | catalog `^2.49.4` | Creating/reading the E2E project row | Already the admin client's transport (`packages/dev-seed/src/supabaseAdminClient.ts:22`) `[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:22]` |
| `@playwright/test` `globalSetup` | catalog `^1.58.2` | Project creation hook | D-J2 locks it; the preflight already lives there `[VERIFIED: tests/playwright.config.ts:~317 `globalSetup: './global-setup.ts'`]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `scripts/assert-project-scoped-queries.mjs` | A custom ESLint rule in a new local plugin | `packages/shared-config/` contains **no** `src/` and no plugin module — only `eslint.config.mjs`, `package.json`, `prettier.config.mjs`, `README.md`, `tsconfig.base.json` `[VERIFIED: ls packages/shared-config/]`. A custom rule needs new plugin infrastructure plus a rule-unit-test harness; the `.mjs` script has **three** committed precedents (`package.json:25-27`) and a fourth landing in Phase 152. |
| A regex/text guard | An AST guard (`typescript` compiler API, already a dependency) | An AST read is genuinely better *if* the predicate is "absence of a chain link" — but § 2 recommends inverting the predicate so that a text read suffices. If the planner rejects the inversion, an AST read becomes mandatory (see § 2 option table). |
| `PUBLIC_PROJECT_ID` | `PROJECT_ID` | Cannot reach the browser — see § 1. |

**Installation:** none. `[VERIFIED: no new package required — every mechanism above is already declared in the tree]`

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** Every mechanism named above is already a declared dependency of this repo (`package.json:46-73`, `apps/frontend/package.json:20-79`, `.yarnrc.yml` catalog). No registry lookup was performed because no new name was introduced.

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

---

## R1 — The variable's name, and the plumbing gap nobody has named (O-2)

### 1.1 MEASURED: SvelteKit's public prefix is `PUBLIC_`, and it is not overridden

`node_modules/@sveltejs/kit/src/core/config/options.js` — the config-defaults object:

```js
env: object({
    dir: string(process.cwd()),
    publicPrefix: string('PUBLIC_'),
    privatePrefix: string('')
}),
```

`[VERIFIED: node_modules/@sveltejs/kit/src/core/config/options.js — `env: object({ dir: string(process.cwd()), publicPrefix: string('PUBLIC_'), privatePrefix: string('') })`]`

`apps/frontend/svelte.config.js` sets `kit.adapter`, `kit.alias` and `kit.version` only — **no `kit.env` block at all** `[VERIFIED: apps/frontend/svelte.config.js:9-19]`. So all three defaults apply verbatim.

And the env is loaded by:

```js
const env = loadEnv(mode, env_config.dir, '');
```

`[VERIFIED: node_modules/@sveltejs/kit/src/exports/vite/utils.js:71 — `const env = loadEnv(mode, env_config.dir, '');`]`

**Consequences, each decisive:**

- A variable named `PROJECT_ID` (no prefix) is classified **private** (`privatePrefix: ''` matches everything not starting with `PUBLIC_`). It is reachable via `$env/dynamic/private` on the **server only**. It can never reach `$env/dynamic/public`, and importing `$env/dynamic/private` from a module that also runs in the browser is a SvelteKit build error.
- The Supabase adapter runs in the browser: `supabaseAdapter.ts:36-44` branches on `browser` and calls `createBrowserClient<Database>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, …)` `[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts:36-44]`. Adapters are re-`init()`ed from universal `+layout.ts` load functions (e.g. `apps/frontend/src/routes/+layout.ts:20`, `routes/(voters)/(located)/+layout.ts:97`) which run on **both** sides `[VERIFIED: grep of `.init({` — 23 production sites, listed in § 6.3]`.
- **Therefore the frontend's project id MUST be `PUBLIC_`-prefixed.** There is no configuration that avoids this short of setting `kit.env.publicPrefix` to `''`, which would publish every private variable in the root `.env` (including `IDENTITY_PROVIDER_CLIENT_SECRET` and `IDURA_SIGNING_JWKS`) to the browser. **Do not do that.**

### 1.2 MEASURED: the repo-root `.env` does not reach the frontend

Three executed measurements:

```
$ yarn workspace @openvaa/frontend node -e "console.log(process.cwd()); console.log(process.env.PUBLIC_SUPABASE_URL); console.log(process.env.FRONTEND_PORT)"
cwd= /Users/…/voting-advice-application-gsd/apps/frontend
PUBLIC_SUPABASE_URL= undefined
FRONTEND_PORT= undefined
```

```
$ cd apps/frontend && node -e "loadEnv('development', process.cwd(), '')  vs  loadEnv('development', repoRoot, '')"
{
 "frontendDir": ["PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_ANON_KEY"],
 "rootDir": ["PUBLIC_SUPABASE_URL","PUBLIC_SUPABASE_ANON_KEY","PUBLIC_BROWSER_FRONTEND_URL",
             "PUBLIC_SERVER_FRONTEND_URL","FRONTEND_PORT","PUBLIC_CACHE_ENABLED",
             "PUBLIC_IDENTITY_PROVIDER_TYPE","PUBLIC_IDENTITY_PROVIDER_CLIENT_ID",
             "PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT","PUBLIC_DEBUG"]
}
```

```
$ cd apps/frontend && PUBLIC_PROJECT_ID=deadbeef node -e "loadEnv('development', process.cwd(), '').PUBLIC_PROJECT_ID"
via shell prefix -> "deadbeef"
```

`[VERIFIED: executed this session in the working tree]`

**Reading these together:**

| Fact | Consequence for criterion 1 |
|---|---|
| The frontend dev server's cwd is `apps/frontend`, and `kit.env.dir` defaults to `process.cwd()` | SvelteKit reads `apps/frontend/.env`, **not** the repo-root `.env` |
| The local (untracked) `apps/frontend/.env` supplies only `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY`; the repo-root `.env` supplies ten keys | Six `PUBLIC_*` constants in `constants.ts` are silently `''` in a `yarn dev` session today — that is a pre-existing condition, not something 161 introduces, but it is the same mechanism |
| `apps/frontend/.env.example` says, verbatim: *"## Disclaimer: You most likely don't need this file / ## unless you're running the front separately outside of Docker. / ## Use the .env.example file in project root for a template"* `[VERIFIED: git show HEAD:apps/frontend/.env.example]` | The documentation points at the root file. The **runtime** points at the workspace file. They disagree. |
| A shell-prefixed value reaches `loadEnv(dir, '')` (measured above) | The `PUBLIC_PROJECT_ID=… yarn dev` escape hatch **works** without any config change |

**⚠ This is the single biggest hidden cost in the phase.** Criterion 1 says the variable is *"documented in `.env.example`"*. Documenting it in the repo-root `.env.example` — which is what `git show HEAD:.env.example` shows is the canonical template, and what CI copies (`.github/workflows/main.yaml:249-250` — `run: cp .env.example .env`) `[VERIFIED: .github/workflows/main.yaml:249-250]` — **does not make the application read it.** A plan that stops at "add the line to `.env.example`" ships a criterion that is textually satisfied and functionally dead.

### 1.3 MEASURED: O-6 is resolved — the root `.env.example` was read

CONTEXT.md O-6 records `.env.example` as unreadable last session. It is still blocked to direct file reads in this session (`Permission to use Bash with command cat .env.example … denied`; the `Read` tool returns *"File is in a directory that is denied by your permission settings"*), **but the file is tracked**, so `git show HEAD:.env.example` reads it. Full contents captured. Relevant structure:

- Sectioned with `####` banners: *Supabase configuration*, *Frontend configuration*, *Cache settings*, *Local data adapter*, *Identity Provider Configuration*, *LLM settings*, *Debugging*.
- Contains `PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, `PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>`, `SUPABASE_ANON_KEY=…` (documented as duplicated *"because the opt-in bank-auth E2E specs read the unprefixed name"*), `FRONTEND_PORT=5173`, `PUBLIC_DEBUG=false`.
- **No `PROJECT_ID`, `PUBLIC_PROJECT_ID` or `DEFAULT_PROJECT_ID` line exists.** `[VERIFIED: git show HEAD:.env.example]` — confirming F1/fact 27 from a second angle.

The natural home for the new line is a new `#### Project scoping` banner immediately after the Supabase block, or inside the Supabase block. The `SUPABASE_ANON_KEY` precedent (one physical value, two documented names, with the reason stated inline) is **exactly** the pattern to copy if the planner chooses two names.

### 1.4 MEASURED: how the Edge Function gets env — and the trap 155 is about to arm

- `apps/supabase/supabase/functions/identity-callback/index.ts:22` documents `DEFAULT_PROJECT_ID: Project to assign self-registered candidates to`; read at `:197`. `[VERIFIED: apps/supabase/supabase/functions/identity-callback/index.ts:22, :197]`
- `:197` verbatim: `const projectId = project_id || Deno.env.get('DEFAULT_PROJECT_ID') || DEFAULT_SEED_PROJECT_ID;` `[VERIFIED: identity-callback/index.ts:197]`
- `:31` verbatim: `const DEFAULT_SEED_PROJECT_ID = '00000000-0000-0000-0000-000000000001';` `[VERIFIED: identity-callback/index.ts:31]`
- **Deno imposes no prefix restriction.** `Deno.env.get('<any name>')` is legal; the `PUBLIC_` convention is a SvelteKit-ism only. `[VERIFIED: identity-callback/index.ts — `Deno.env.get` used for `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `SUPABASE_URL`, `SITE_URL`, none prefixed]`
- **Local wiring for function env does not exist.** `apps/supabase/supabase/config.toml:379-380` has `# [edge_runtime.secrets]` / `# secret_key = "env(SECRET_VALUE)"` — **commented out** `[VERIFIED: apps/supabase/supabase/config.toml:379-380]`. There is **no** `apps/supabase/supabase/functions/.env` (`ls` shows only `identity-callback/`, `invite-candidate/`, `send-email/`) `[VERIFIED: ls apps/supabase/supabase/functions/]`. `apps/supabase/supabase/.gitignore` ignores `.env.keys`, `.env.local`, `.env.*.local` — so a `functions/.env` would be tracked, not ignored `[VERIFIED: apps/supabase/supabase/.gitignore:1-8]`.

**⚠ Sequencing landmine.** `DEFAULT_PROJECT_ID` is **unset locally today** and the function silently falls through to the `:31` constant. Phase 155's D2 makes `:197` **throw** on a missing `DEFAULT_PROJECT_ID`. The moment 155 lands, the local `identity-callback` function **throws on every invocation** unless the Edge-Function env is wired. That wiring is not in 155's criteria and is not in 161's. Whoever plans 161 must either (i) claim the wiring, or (ii) file it as a `.planning/todos/pending/` item per D-N2 and flag it back to 155.

Blast radius today: the `bank-auth` and `bank-auth-journey` Playwright projects are **opt-in** (`PLAYWRIGHT_BANK_AUTH`) and excluded from the default `yarn test:e2e` run `[VERIFIED: tests/playwright.config.ts:526-530, 565-567, 604-622 — all gated by `...(process.env.PLAYWRIGHT_BANK_AUTH ? [...] : [])`]`, so it will **not** break the twice-in-a-row proof. It will break the Idura runbook.

### 1.5 MEASURED: the frontend already fails to pass a project id to the Edge Function

`apps/frontend/src/routes/api/candidate/preregister/+server.ts:16-17`:

```ts
const { data, error: fnError } = await locals.supabase.functions.invoke('identity-callback', {
  body: { id_token: idToken }
});
```

`[VERIFIED: apps/frontend/src/routes/api/candidate/preregister/+server.ts:16-17]`

No `project_id` in the body. So the *only* live path to `:197`'s `project_id` branch is a direct call by a third party — and this function is documented as reachable with the public anon key (`identity-callback/index.ts:204-207` comment: *"This endpoint is served --no-verify-jwt and is reachable with the public anon key"*) `[VERIFIED: identity-callback/index.ts:204-207]`.

**Security note for the planner (see § Security Domain):** `project_id` is currently **caller-supplied and unvalidated**, so an unauthenticated caller can direct a self-registration into any project uuid it knows. Phase 161's parameterisation is the natural moment to make the Edge Function *validate* `project_id` against its own configured value rather than trust it. This is a pre-existing defect, not one 161 creates; it belongs in-scope-if-cheap, else filed per D-N2.

### 1.6 RECOMMENDATION — the name

**Recommended: one physical name, `PUBLIC_PROJECT_ID`, used by the frontend AND the Edge Function.** `E2E_PROJECT_ID` is a *separate* variable that exists only for the test harness and is never read by application code.

| Option | Frontend | Edge Function | Verdict |
|---|---|---|---|
| **(A) ★ One name: `PUBLIC_PROJECT_ID`** | `constants.PUBLIC_PROJECT_ID` via `$env/dynamic/public` | rename the read at `:197` to `Deno.env.get('PUBLIC_PROJECT_ID')` | **Recommended.** Delivers D-D3's "rename/converge" literally — one name, one grep, one `.env.example` line. `PUBLIC_` is semantically honest: the id appears in every client query and every storage path (`${projectId}/candidates/…`, `packages/dev-seed/src/supabaseAdminClient.ts:700`), so it is genuinely not a secret. Survives 155: 155's guard forbids `Deno.env.get(...)` followed by `??`/`||`, which a rename does not reintroduce. |
| **(B) Two names: `PUBLIC_PROJECT_ID` + `DEFAULT_PROJECT_ID`** | as (A) | unchanged | Honest and zero-risk on the Deno side, but leaves the "one id, two names" problem O-2 flags, and criterion 1's singular *"a `PROJECT_ID` environment variable"* becomes two. Precedent exists in-tree (`SUPABASE_ANON_KEY` duplicated with an inline reason, root `.env.example`). Take this if the planner wants to keep 155's surface byte-stable. |
| **(C) One name `PROJECT_ID`, unprefixed** | **impossible** — cannot reach the browser (§ 1.1) | fine | **Rejected on measurement.** |
| **(D) Frontend passes `project_id` in the invoke body; Edge Function reads no env** | as (A) | no env at all | **Rejected.** The endpoint is anon-reachable and `--no-verify-jwt`; making the body authoritative removes the last server-side statement of which project this deployment is. It is also the direction *away from* criterion 1. |

**Recorded consequence of (A) or (B):** criterion 1's literal string `PROJECT_ID` is not the variable's name. The planner must state that deviation explicitly in the plan, with § 1.1's evidence, so the verifier does not read a `PUBLIC_`-prefixed name as a missed criterion. The name is the interface Phase 162 will be planned against (though 162 is deferred from this run — `.planning/REQUIREMENTS.md:314`).

### 1.7 RECOMMENDATION — the plumbing (three routes, pick one)

| Route | Change | Cost / risk |
|---|---|---|
| **(P1) ★ Extend the existing root-`.env` read in `vite.config.ts`** | `loadEnv(mode, repoRoot, 'FRONTEND_PORT')` becomes `loadEnv(mode, repoRoot, ['FRONTEND_PORT', 'PUBLIC_PROJECT_ID'])`, and inside the config factory the value is pushed into `process.env` when absent, so SvelteKit's own `loadEnv(cwd,'')` (which merges `process.env` — measured § 1.2) picks it up. | **Recommended.** Surgical, single file, and the file *already* carries a comment block explaining exactly this prefix mechanism (`apps/frontend/vite.config.ts:13-17`). Widens the root-`.env` surface by exactly one named key — no secret exposure. Must be careful that a shell prefix still wins (the existing comment states `loadEnv` overlays `process.env` **after** the parsed file, so write with `??=`, not `=`). |
| **(P2) Set `kit.env.dir` / vite `envDir` to the repo root** | one line in `svelte.config.js` (+ vite `envDir`) | Broad. `privatePrefix` is `''`, so this newly publishes the root `.env`'s **private** keys (`IDENTITY_PROVIDER_CLIENT_SECRET`, `IDURA_SIGNING_JWKS`, `LLM_OPENAI_API_KEY`) to `$env/dynamic/private` and every root `PUBLIC_*` to the browser. That is arguably *correct* and would fix six silently-empty constants — but it is a behaviour change far larger than this phase, touching auth. **Do not fold it in; file it per D-N2.** |
| **(P3) Document `apps/frontend/.env` as the home** | none | Contradicts `apps/frontend/.env.example`'s own text and criterion 1's `.env.example`, and the file is untracked so CI never gets it. **Rejected.** |

## R2 — The guard (D-J1) and the RPC question (O-3)

### 2.1 MEASURED: the four call shapes, and why the naive predicate fails

Every `.from(` / `.rpc(` site in the adapter, enumerated:

**Read path — `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (616 lines, `grep -c 'project_id'` = 0):**

| Line | Shape | Naive-matcher outcome |
|---|---|---|
| `:49` | `await this.supabase.from('app_settings').select('settings').limit(1).single();` | matchable (single-line chain) |
| `:85` | `await this.supabase.from('app_settings').select('customization').limit(1).single();` | matchable |
| `:139-148` | `let query = this.supabase\n  .from('elections')\n  .select(…)\n  .order(…);` then `if (options?.id) { query = … query.eq('id', …) }` then `await query` | **defeats a regex** — the chain is broken by a `let` binding and conditionally reassigned across statements |
| `:180-186` | same shape for `constituency_groups` | **defeats a regex** |
| `:205-207` | `await this.supabase.from('constituencies').select('*').order('sort_order')` (multi-line, no reassignment) | matchable only with a multi-line matcher |
| `:259` | `this.supabase.rpc('get_nominations', { p_election_id, p_constituency_id, p_include_unconfirmed })` inside a `flatMap` | **has no `.from()` at all** |
| `:471` | `let query = this.supabase.from(table).select('*').order('sort_order');` where `table` is the loop variable of `for (const { table, entityType } of types)` and `types: Array<{ table: 'candidates' \| 'organizations'; … }>` | **defeats every literal matcher** — the table name is a variable |
| `:505-508` | `this.supabase.from('question_categories').select('*').order('sort_order')` | matchable |
| `:539` | `let qQuery = this.supabase.from('questions').select('*').order('sort_order');` then conditional `.in('category_id', …)` | **defeats a regex** |

`[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:49,85,139-148,180-186,205-207,259,471-474,505-508,539-542 — all opened]`

**Write path:**

| File:line | Shape | Note |
|---|---|---|
| `dataWriter/supabaseDataWriter.ts:125` | `.from('elections').select('project_id')…` | a *derivation* query, not a scoped read |
| `…:134` | `this.supabase.functions.invoke('invite-candidate', …)` | not a table access |
| `…:207` | `.rpc('get_candidate_user_data', { p_entity_type: 'candidate' })` | RPC |
| `…:230` | `.from('nominations')` | table |
| `…:287, :339` | `.from('candidates').select('project_id')…` | derivation |
| `…:299, :349` | **`this.supabase.storage.from('public-assets')`** | **a storage BUCKET, not a table** — a naive `.from(` matcher reports a false positive |
| `…:310` | `.rpc('upsert_answers', …)` | RPC |
| `…:365` | `.from('candidates')` | table |
| `…:388` | `.rpc('merge_custom_data', …)` | RPC |
| `…:400` | `.from('elections').select('project_id')` | derivation |
| `…:407` | `this.supabase.from('admin_jobs').insert({ project_id: election.project_id, … })` | insert carrying a derived id |
| `adminWriter/supabaseAdminWriter.ts:26` | `.rpc('merge_custom_data', …)` | RPC |
| `…:42` | `.from('elections').select('project_id')` | derivation |
| `…:49` | `.from('admin_jobs').insert({ project_id: election.project_id, … })` | insert |
| `…:81` | `.functions.invoke('send-email', …)` | not a table access |
| `feedbackWriter/supabaseFeedbackWriter.ts:15-19` | `.from('app_settings').select('project_id').limit(1).single()` | derivation |
| `…:23` | `.from('feedback').insert({ project_id: settings.project_id, … })` | insert |

`[VERIFIED: grep of `\.from(\|\.rpc(\|\.functions\.invoke\|storage\.from` over the three writer files, plus the full read of `supabaseFeedbackWriter.ts` (35 lines)]`

**Four defeats of the naive "chain carries `.eq('project_id', …)`" predicate, each measured:**
1. **`let`-bound builders** reassigned across `if` statements (5 sites) — no lexical chain to inspect.
2. **A dynamic table argument** (`:471`) — the union-typed loop variable.
3. **`storage.from(<bucket>)`** (2 sites) — a false positive class.
4. **RPCs** (5 call sites, 4 distinct functions) — no `.from()` to see.

### 2.2 RECOMMENDATION — invert the predicate

Instead of asserting *"a `.from(x)` chain **contains** `.eq('project_id', …)`"* (an absence check over a dataflow-dependent chain), assert *"a bare `this.supabase.from(<declared project-scoped table>)` **does not appear** in the adapter — the scoped helper is used instead."*

The scoped helper lives on `supabaseAdapterMixin` (§ 6.1), beside `get supabase()`:

```ts
/** Every read/write against a project-scoped table goes through here. */
scopedFrom<TTable extends ProjectScopedTable>(table: TTable) {
  return this.supabase.from(table).eq('project_id', this.projectId);
}
```

**Why this is strictly better than the literal D-J1 predicate, without violating it:**

| D-J1's binding | Satisfied? |
|---|---|
| static | yes — a source read, no runtime |
| fails at the call site | yes — the error names the offending `file:line` and the table |
| reads an **explicitly declared list of project-scoped tables** | yes — the list is the guard's own `PROJECT_SCOPED_TABLES` constant, mirrored by the TS `ProjectScopedTable` union |
| runs inside `yarn lint:check` | yes (§ 2.4) |
| covers the **read** path | yes — and it covers it *by construction*: a brand-new unscoped `.from('elections')` in `dataProvider/` is a violation whether or not `project_id` already appears anywhere in the file. This is the exact property D-J1's scope note demands. |

And it dissolves all four defeats: `storage.from(` does not match `this.supabase.from(`; `let query = this.supabase.from('elections')` **does** match (the forbidden shape is present regardless of what happens downstream); `this.supabase.from(table)` with a non-literal argument is caught by a **completeness check** (see below) rather than silently skipped; RPCs are handled by a second, separate check.

**Completeness check — non-negotiable.** `tests/playwright.config.ts` already establishes the house pattern: the teardown-prefix guard collects `unparsedTeardownPrefixFiles` and throws when a file *calls* the guarded API but the guard could not parse its declaration, with the rationale *"an enumeration guard with no completeness check is the same failure mode as fake-guard finding F4"* `[VERIFIED: tests/playwright.config.ts — the `unparsedTeardownPrefixFiles` block and its `review WR-03` rationale]`. Apply the same: any `this.supabase.from(` whose argument is **not** a string literal is a hard failure naming the site, so `:471`'s dynamic table cannot slip past. (In practice `:471` will be rewritten to `this.scopedFrom(table)`, which is legal because `table` is already typed `'candidates' | 'organizations'`.)

### 2.3 RECOMMENDATION — the RPC half (O-3), answered from the SQL

**MEASURED: `get_nominations` is not project-scoped and its joins do not scope it transitively.**

`apps/supabase/supabase/schema/503-entity-rpcs.sql:74-89` — the entire `WHERE`:

```sql
  FROM public.nominations n
  LEFT JOIN public.candidates c ON n.candidate_id = c.id
  LEFT JOIN public.organizations o ON n.organization_id = o.id
  LEFT JOIN public.factions f ON n.faction_id = f.id
  LEFT JOIN public.alliances a ON n.alliance_id = a.id
  WHERE (p_election_id IS NULL OR n.election_id = p_election_id)
    AND (p_constituency_id IS NULL OR n.constituency_id = p_constituency_id)
    AND (p_include_unconfirmed OR NOT COALESCE(n.unconfirmed, false))
    AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL
```

`[VERIFIED: apps/supabase/supabase/schema/503-entity-rpcs.sql:74-89]`

Every join is on an **entity id**, never on `project_id`. With both parameters `NULL` the predicate degenerates to "all confirmed nominations whose entity is visible". `nominations` **does** carry `project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE` (`104-nominations.sql:17`) `[VERIFIED: apps/supabase/supabase/schema/104-nominations.sql:17]`, so the column exists and the fix is cheap.

And the `NULL, NULL` case is **live, not hypothetical**: `supabaseDataProvider.ts` builds `electionIds` / `constituencyIds` as `[null]` when the caller passes nothing, and fans out one RPC per pair `[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:~232-252 — `: [null];` on both locals, then `electionIds.flatMap(eid => constituencyIds.map(cid => this.supabase.rpc('get_nominations', {…})))`]`.

**Recommendation:** add a **required** `p_project_id uuid` (first parameter, no `DEFAULT NULL` — a defaulted-NULL parameter re-creates the silent-fallback shape this phase exists to remove) with `AND n.project_id = p_project_id`. Note this changes the function signature, so the existing `GRANT EXECUTE ON FUNCTION public.get_nominations(uuid, uuid, boolean) TO anon, authenticated;` (`503-entity-rpcs.sql:92`) must be re-issued for the new arity, and `yarn db:types` re-run.

**The other three RPCs, dispositioned:**

| RPC | Scoping today | Disposition |
|---|---|---|
| `get_candidate_user_data` (`503:97-137`) | `WHERE c.auth_user_id = (SELECT auth.uid())` — scoped by **identity**, and it already **returns** `project_id` in its result columns (`:102`, `:121`) `[VERIFIED: 503-entity-rpcs.sql:100-136]` | No parameter needed. **Recommend** the adapter cross-checks the returned `project_id` against `this.projectId` and throws on mismatch — a cheap runtime assertion that catches a mis-provisioned deployment. |
| `upsert_answers` (`503:147-187`) | `WHERE id = p_entity_id`, `SECURITY INVOKER`, RLS enforces ownership `[VERIFIED: 503-entity-rpcs.sql:147-187]` | Scoped by entity id + RLS. **Declare as `scoped-by-identity`** in the guard's RPC table with the reason recorded; no SQL change. |
| `merge_custom_data` (`504-admin-rpcs.sql:12-35`) | `WHERE id = p_question_id`, `SECURITY INVOKER`; the docblock states *"the existing admin_update_questions RLS policy enforces that only admins with can_access_project() can update questions"* `[VERIFIED: apps/supabase/supabase/schema/504-admin-rpcs.sql:6-35]` | Scoped by row id + RLS. **Declare as `scoped-by-identity`.** Note Phase 156 criterion 6 may **rename** this to `merge_question_custom_data` — the guard's RPC list must be written expecting that. |

**Phase 157's incoming `get_questions` RPC:** 157 criterion 3 lands *"A `get_questions` RPC [that] returns categories and their questions together and supports filtering by election, constituency and election round"* `[VERIFIED: .planning/ROADMAP.md Phase 157 criterion 3]`, and 156's `D-F3 (a)` records that *"the `get_questions` RPC lands **whole in 157**, SQL and wiring together"* `[VERIFIED: .planning/phases/156-supabase-schema-corrections-naming-constraints-grants/156-CONTEXT.md:326]`. **157 runs before 161.** 161 therefore inherits it, and the guard's declared RPC list is the mechanism that forces a decision on it rather than letting it arrive unnoticed. **Recommend the planner reads `get_questions`' actual signature at planning time and either adds `p_project_id` to it in 161 or files the request into 157's surface.**

**Guard design consequence:** the guard needs **two** declared lists, both auditable:

```
PROJECT_SCOPED_TABLES = [ elections, constituency_groups, constituencies, candidates,
                          organizations, factions, alliances, questions,
                          question_categories, nominations, app_settings,
                          feedback, admin_jobs ]        // the 13 project_id FK holders
PROJECT_SCOPED_RPCS   = { get_nominations: 'requires p_project_id',
                          get_questions:   'requires p_project_id',   // pending 157
                          get_candidate_user_data: 'scoped-by-identity: auth.uid()',
                          upsert_answers:  'scoped-by-identity: entity id + RLS',
                          merge_custom_data: 'scoped-by-identity: row id + RLS' }
```

The 13-table list is measured, not guessed — see § 3.1.

### 2.4 MEASURED: the `lint:check` chain as it stands now, and what 152/153 add

**Now** (`package.json:35`, verbatim):

```
"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring"
```

`[VERIFIED: package.json:35]` — **six links.** Note `assert:unit-coverage` (`package.json:25`) is in **`test:unit`** (`:28`), **not** in `lint:check` — a trap for a planner copying the wrong precedent.

**Existing guard scripts** (`package.json:25-27`): `assert:unit-coverage` → `scripts/assert-unit-test-coverage.mjs` (809 lines), `assert:i18n-catalog-namespaces` → `scripts/assert-i18n-catalog-namespaces.mjs` (170), `assert:a11y-scan-wiring` → `scripts/assert-a11y-scan-wiring.mjs` (231). `[VERIFIED: package.json:25-27; wc -l scripts/*.mjs]`

**What lands before 161 — both phases are already PLANNED (PLAN.md files on disk):**

| Phase | Link added | Evidence |
|---|---|---|
| 152 (7 plans) | `yarn assert:comment-hygiene` → `node scripts/assert-comment-hygiene.mjs`, as *"a seventh link after `yarn assert:a11y-scan-wiring`"*; explicitly **not** added to `test:e2e` | `[VERIFIED: .planning/phases/152-comment-naming-hygiene-sweep/152-01-PLAN.md:164]` |
| 153 (3 plans) | `yarn assert:declared-binaries` → `node scripts/assert-declared-binaries.mjs` | `[VERIFIED: .planning/phases/153-build-tooling-config-correctness/153-01-PLAN.md:53-54, :220]` |
| 153-02 | possibly `yarn assert:node-engine` — gated behind an operator approval question in the plan (*"Does this reversal have your approval?"*) | `[VERIFIED: .planning/phases/153-build-tooling-config-correctness/153-02-PLAN.md:109, :115]` |

So 161 is appending link **#8 or #9**, to a chain that will have changed twice. Both plans already anticipate the collision: 153-01's criterion reads *"is a member of the `lint:check` `&&` chain, **and the chain's other links — including any link a sibling phase appended — are all still present after the edit**"* and 153-03 mandates the edit be *"by append, never by rewrite"* `[VERIFIED: 153-01-PLAN.md:35; 153-03-PLAN.md:111]`.

**Phase 144's precedent — membership, not position — is live and codified.** 152-01's chain-membership spec asserts *"an array **containing** `'yarn assert:comment-hygiene'`"* and forbids *"never `endsWith`, never a `toBe` on the whole `lint:check` string, never an index comparison, never a link count"* `[VERIFIED: 152-01-PLAN.md:200, 152-03/153-01 chain assertions; 153-01-PLAN.md:322,334]`. The existing home for such specs is `packages/dev-seed/tests/ciTypecheckGate.test.ts`, which already asserts `yarn typecheck` / `yarn typecheck:tests` membership `[VERIFIED: packages/dev-seed/tests/ciTypecheckGate.test.ts:72-85]`; 153-01 creates a sibling `packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts` `[VERIFIED: 153-01-PLAN.md:92]`. **161 should follow that shape exactly.**

### 2.5 RECOMMENDATION — mechanism

**Recommended: a committed `scripts/assert-project-scoped-queries.mjs`, Node-built-ins only, exit 1 naming the `file:line` and the table/RPC, wired as an append-only link in `lint:check`, with a `packages/dev-seed/tests/…Gate.test.ts` sibling asserting chain membership.**

| Option | For | Against |
|---|---|---|
| **★ `scripts/assert-*.mjs` (text/regex read + literal-argument completeness check)** | Three (soon four) in-tree precedents; no new infra; the house style is documented in `assert-a11y-scan-wiring.mjs`'s own header (*"deliberately NOT an AST parse: these are single-sourced, hand-authored config/source files … a regex read is the cheapest thing that can name the violation precisely"*); the inverted predicate (§ 2.2) is exactly the kind a text read handles well | A text read cannot follow dataflow — which is precisely why the predicate is inverted. Must include the completeness check or it becomes a fake guard. |
| Custom ESLint rule | Fails at the call site with an editor squiggle; `no-restricted-syntax` could express the forbidden shape as an ESQuery selector without new plugin code | `packages/shared-config/` has no plugin module to host a *custom* rule (`ls` = 5 files, no `src/`). A `no-restricted-syntax` selector **could** work (`CallExpression[callee.property.name='from'][callee.object.property.name='supabase']`) but cannot read a declared table list from a shared constant, cannot express the completeness check, and produces a message that cannot enumerate. |
| AST guard via the `typescript` compiler API | Would allow the *literal* D-J1 predicate with dataflow | Substantially more code than the whole rest of the phase; no in-tree precedent; only necessary if the planner rejects the inversion. |

**Escalation note:** if the planner rejects § 2.2's inversion and insists on the literal "chain carries `.eq('project_id')`" predicate, the `.mjs` route is **not viable** and the AST route becomes mandatory — the five `let`-bound builder sites make it so. That is a scope question worth raising before planning tasks.

---

## R3 — The `app_settings` cascade gap (O-1)

### 3.1 MEASURED: the 13 FKs, and the one exception — confirmed in **two** places

```
apps/supabase/supabase/schema/101-elections.sql:5,30,50      … ON DELETE CASCADE
apps/supabase/supabase/schema/102-entities.sql:5,26,54,74    … ON DELETE CASCADE
apps/supabase/supabase/schema/103-questions.sql:7,32         … ON DELETE CASCADE
apps/supabase/supabase/schema/104-nominations.sql:17         … ON DELETE CASCADE
apps/supabase/supabase/schema/107-feedback.sql:24            … ON DELETE CASCADE
apps/supabase/supabase/schema/108-admin-jobs.sql:9           … ON DELETE CASCADE
apps/supabase/supabase/schema/106-app-settings.sql:8         project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id),   ← no cascade
```

`[VERIFIED: grep -rn "REFERENCES public.projects" apps/supabase/supabase/schema/ — 13 hits, 12 with ON DELETE CASCADE]`

**F9 is confirmed, and extended:** the same defect exists a **second** time, in the applied migration. `apps/supabase/supabase/migrations/00001_initial_schema.sql:916` is `project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id),` while the other twelve migration lines (`:410,435,455,490,511,539,559,582,607,706,951,1030`) all carry `ON DELETE CASCADE` `[VERIFIED: grep -rn "REFERENCES public.projects" apps/supabase/supabase/migrations/ — 13 hits, same 12/1 split]`. **`schema/` files are not what builds the database** — `config.toml:58` has `schema_paths = []` and `db.migrations.enabled = true` with `sql_paths = ["./seed.sql"]` `[VERIFIED: apps/supabase/supabase/config.toml:53-65]`, and `migrations/` holds three files (`00001_initial_schema.sql`, `00002_…`, `00003_…`) `[VERIFIED: ls apps/supabase/supabase/migrations/]`. So any schema fix must touch **both** trees — which is exactly Phase 156 criterion 1's stated posture (*"Migrations and schemata are rewritten together — no backwards compatibility is owed"*).

### 3.2 MEASURED: Phase 156 has NOT taken this fix, and is NOT yet planned

- `grep -in "cascade\|app_settings\|app-settings" .planning/phases/156-…/156-CONTEXT.md` → **zero hits.** `[VERIFIED: executed this session — no output]`
- 156's eight roadmap criteria name: the `party`→`organization` rename, auth-table role enums, the `104-nominations.sql` `>= 1` constraint, an `is_image` utility, `303-column-grants.sql`, `503-entity-rpcs.sql:147`/`504-admin-rpcs.sql:12`, the `102-entities.sql:27` `name`/`short_name` conflict, and the criterion-8 dispositions. **None mentions `app_settings` or a cascade.** `[VERIFIED: .planning/ROADMAP.md Phase 156 criteria 1-8]`
- 156's decisions are `D-E1`…`D-E6` plus the § N set; `D-E5` covers *"the five 'investigate' items in criterion 8"* and lands as **(a)** — *"dispositioned rather than silently dropped"*, producing a `156-DISPOSITIONS.md` `[VERIFIED: 156-CONTEXT.md:246-282, :92, :539-544]`.
- 156's directory contains **only** `156-CONTEXT.md` and `156-DISCUSSION-LOG.md` — **no PLAN.md**. It is discussed, not planned. `[VERIFIED: ls .planning/phases/156-supabase-schema-corrections-naming-constraints-grants/]`

**Verdict: 161 must not assume the cascade exists.** There is no commitment to it anywhere.

### 3.3 MEASURED: nothing else blocks `DELETE FROM public.projects`

Checked exhaustively, so the planner does not discover a second blocker at teardown time:

| Potential blocker | Finding |
|---|---|
| Triggers on `projects` | Only `set_updated_at BEFORE UPDATE` (`100-tenancy.sql:25-27`). **No BEFORE/AFTER DELETE trigger.** `[VERIFIED: apps/supabase/supabase/schema/100-tenancy.sql:25-27; grep -rn "ON public.projects" schema/ — the only other hits are an index and five RLS policies]` |
| RLS on `projects` | Enabled, deny-by-default, with `authenticated_select/insert/update/delete` policies (`302-rls.sql:46-70`). **The service-role key bypasses RLS entirely**, and the admin client uses it (`packages/dev-seed/src/supabaseAdminClient.ts:44-50` — `SUPABASE_SERVICE_ROLE_KEY`). `seed.sql:5-6` states the same for the bootstrap inserts. `[VERIFIED: apps/supabase/supabase/schema/302-rls.sql:46-70; packages/dev-seed/src/supabaseAdminClient.ts:44-50; apps/supabase/supabase/seed.sql:5-6]` |
| `projects.account_id NOT NULL` parent | `account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE` (`100-tenancy.sql:18`). **The E2E project can simply reuse the existing default account** `00000000-0000-0000-0000-000000000001`, seeded unconditionally by `seed.sql:24-26`. **No new `accounts` row is required.** `[VERIFIED: apps/supabase/supabase/schema/100-tenancy.sql:16-23; apps/supabase/supabase/seed.sql:23-26]` |
| `user_roles.scope_id` pointing at a project | `scope_id uuid` with **no FK** (`300-auth-tables.sql:15` — `scope_id uuid, -- NULL for super_admin (global scope)`). No referential blocker. `[VERIFIED: apps/supabase/supabase/schema/300-auth-tables.sql:12-17]` |
| Storage objects under `${projectId}/` | Path convention `{project_id}/{entity_type}/{entity_id}/filename.ext` (`config.toml:114-115`); the admin client already lists/removes under `${this.projectId}/candidates` (`packages/dev-seed/src/supabaseAdminClient.ts:700,756`). Not an FK blocker; already project-scoped. `[VERIFIED: apps/supabase/supabase/config.toml:114-115; packages/dev-seed/src/supabaseAdminClient.ts:700,756,759]` |

**So exactly one blocker exists: `app_settings`.** `DELETE FROM public.projects WHERE id = <E2E id>` fails with a foreign-key violation raised by `app_settings_project_id_fkey` — and, because `app_settings.project_id` is `NOT NULL`, `ON DELETE SET NULL` is not an option either.

### 3.4 RECOMMENDATION — do not delete the project row at all

| Route | Consequence |
|---|---|
| **(R3-a) ★ Teardown leaves the project row in place; only its content is torn down by the existing prefix teardowns** | **Recommended.** D-J2 explicitly permits this: *"Because `E2E_PROJECT_ID` is fixed and creation is idempotent, teardown MAY be a no-op that leaves the project row in place between runs."* It makes O-1 **moot for this phase** — `DELETE FROM projects` never runs, so the FK never fires, and 161 does not cross the 156/161 schema boundary. It is also the posture that makes the twice-in-a-row proof cheapest: run *N+1* finds the project already there and reuses it, which is the same code path as steady state. Cost: one `projects` row and one `app_settings` row persist in the local DB between runs — 2 rows, invisible to the default project's own data. The choice must be **stated** in the plan (D-J2 requires it). |
| (R3-b) Ask Phase 156 to add the cascade | Cleanest schema, but 156 is **not planned** and does not name the item; requesting it now adds a cross-phase dependency to a phase whose own discussion produced six decisions without touching this. If the planner wants it, the right vehicle is `156-DISPOSITIONS.md` (which D-E5(a) creates) plus a `.planning/todos/pending/` entry per D-N2 — **not** a blocking edge. |
| (R3-c) 161 adds the cascade itself | Crosses the schema boundary into 156's domain, and must edit **both** `schema/106-app-settings.sql:8` **and** `migrations/00001_initial_schema.sql:916` (§ 3.1) — where 156's `D-E2` (rewrite migrations in place vs. add a migration) has not yet been resolved. Doing this before 156 decides risks a conflict with 156's own rewrite. **Not recommended.** |
| (R3-d) Teardown deletes `app_settings` first, then the project | Works, no schema change — but it means "delete the project" is not self-sufficient, and the *next* table added without a cascade silently reopens the class. Keep as the **contingency** if the planner rejects (a) for a reason not visible here. |

**File per D-N2 either way:** a `.planning/todos/pending/` entry recording the `app_settings` cascade asymmetry (both file:line sites), so it is not lost regardless of which route the teardown takes.

---

## R4 — The E2E lifecycle: creation, delivery, and what is already built (O-7, criterion 3)

### 4.1 MEASURED: the setup/teardown graph is large but uniform

- **29 `*.setup.ts`** and **28 `*.teardown.ts`** files under `tests/tests/setup/{shared,candidate,perm,voter}/`. `[VERIFIED: find tests/tests/setup -name '*.setup.ts' | wc -l → 29; -name '*.teardown.ts' → 28]`
- **30 files import `setupFromTemplate`** `[VERIFIED: grep -rln "setupFromTemplate" tests/tests/setup | wc -l → 30]`. That single helper (`tests/tests/setup/shared/setupFromTemplate.ts`, 289 lines) is the **one** place the seed pipeline is driven from: teardown → pipeline → `fanOutLocales` → `Writer.write` → authoritative `app_settings` REPLACE + exact assertion → optional overlay → optional post-seed hook → cleanup closure. `[VERIFIED: tests/tests/setup/shared/setupFromTemplate.ts:139-289 — read in full]`
- **51 `new SupabaseAdminClient()` sites** across `tests/` and `packages/dev-seed/src`, **every one of them argument-less** (spot-checked 20; the constructor is `constructor(url?, serviceRoleKey?, projectId?)` with `this.projectId = projectId ?? TEST_PROJECT_ID`). `[VERIFIED: grep -rn "new SupabaseAdminClient(" tests/tests packages/dev-seed/src | wc -l → 51; packages/dev-seed/src/supabaseAdminClient.ts:141,145]`
- Playwright projects: ~90 declared, in three families — the base/journey chain, the 19-deep serial `perm-*` chain, and the specialised set (`performance`, `a11y-smoke`, `candidate-a11y-scan` default-on; `visual-regression`, `bank-auth`, `bank-auth-journey` opt-in). `[VERIFIED: tests/playwright.config.ts — `name: '…'` enumeration]`

### 4.2 ✅ MEASURED: the test-side query layer is ALREADY project-scoped

This is the phase's largest existing enabler and CONTEXT.md does not record it.

`packages/dev-seed/src/supabaseAdminClient.ts` carries `.eq('project_id', this.projectId)` at **`:341, :378, :414, :496, :554, :600, :645, :677`** and writes `project_id: this.projectId` at **`:282`**; the storage helpers build paths from `${this.projectId}` at **`:700, :756, :759`**. `[VERIFIED: grep -n "projectId\|project_id" packages/dev-seed/src/supabaseAdminClient.ts]`

The `tests/` subclass adds more of the same: `findData` at **`:169`**, `query()` at **`:197`** (`return this.client.from(tableName).select('*').eq('project_id', this.projectId);`), `getAppSettings` at **`:230`**, and further scoped queries at **`:296, :359, :549`**. `[VERIFIED: grep -n over tests/tests/utils/supabaseAdminClient.ts]`

**Consequence:** re-pointing the entire E2E suite at a different project is, on the query side, a **one-line default change** at `packages/dev-seed/src/supabaseAdminClient.ts:145`. All 51 construction sites, the freshness probe, `replaceAppSettings`, `getAppSettings`, `countRowsByPrefix`, `selectQuestionExternalIds`, the storage cleanup and `runTeardownAsserted`'s row counting follow automatically.

The seed *writer* side has the same shape: `Writer` takes `opts.projectId` and forwards it to the admin client (`writer.ts:105-111`); `buildCtx` resolves `projectId: template.projectId ?? '00000000-0000-0000-0000-000000000001'` (`ctx.ts:88`); the template schema validates `projectId` (`template/schema.ts:124`). `[VERIFIED: packages/dev-seed/src/writer.ts:68-74,105-111; packages/dev-seed/src/ctx.ts:32,67,88]` — F7 confirmed.

**⚠ MEASURED: no template sets `projectId`.** `grep -rn "projectId" packages/dev-seed/src/templates/` returns **only** `ctx.projectId` *reads* inside the four `defaults/*-override.ts` generators (`alliances-override.ts:117,130`, `nominations-override.ts:108,173,205,239`, `questions-override.ts:142,157`, `candidates-override.ts:139,175`). **Not one of the 40 template files declares `projectId:`** — including `e2e/base.ts` and all 30 `e2e/perm/*.ts`. `[VERIFIED: find packages/dev-seed/src/templates -name '*.ts' | sort (40 files); grep -rn "projectId" packages/dev-seed/src/templates/]`

So the planner has a choice: set `projectId` per-template (40 files, or a shared helper), or resolve it once in `ctx.ts:88` / `supabaseAdminClient.ts:145` from `process.env.E2E_PROJECT_ID`. **Recommend the latter** — one edit, no template churn, and it keeps templates portable.

### 4.3 ⚠ MEASURED: project CREATION is genuinely new capability

F8 confirmed and sharpened:

- `packages/dev-seed/src/supabaseAdminClient.ts:14-19` (the module docblock, verbatim): *"Bulk-import routing note: `bulk_import` RPC's `processing_order` accepts exactly 11 of 16 non-system tables. `accounts`, `projects`, `feedback`, `constituency_group_constituencies`, `election_constituency_groups` are NOT in that list. Callers must route those elsewhere (writer strips accounts/projects, feedback via direct upsert, joins via linkJoinTables)."* `[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:14-19]`
- `Writer.write` executes `delete bulkData.accounts; delete bulkData.projects;` with the comment *"strip pass-through tables. `accounts` / `projects` are bootstrapped by seed.sql; dev-seed never writes them."* `[VERIFIED: packages/dev-seed/src/writer.ts:~155-159]`
- `bulk_delete` requires a top-level `project_id` and deletes `WHERE project_id = $1 AND external_id LIKE $2` (`501-bulk-operations.sql:353-386`) — already project-scoped, and its `allowed_collections` excludes `projects` `[VERIFIED: apps/supabase/supabase/schema/501-bulk-operations.sql:353-357,383-386; packages/dev-seed/src/cli/teardown.ts:24-29,69-80]`.
- `runTeardown(prefix, client)` deletes by `external_id` prefix across the 10 `ALLOWED_TEARDOWN_TABLES` plus storage portraits — **no notion of a project** beyond what the client's `projectId` already scopes `[VERIFIED: packages/dev-seed/src/cli/teardown.ts:69-80,135-140]`.

**What must be built:** a service-role `ensureProject(id)` that does the equivalent of `seed.sql:29-41` — an idempotent `INSERT … ON CONFLICT (id) DO NOTHING` into `public.projects` **plus** its `app_settings` bootstrap row. **`seed.sql` is the template to copy, verbatim:**

```sql
INSERT INTO projects (id, account_id, name, default_locale)
VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Default Project','en')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_settings (project_id, settings)
VALUES ('00000000-0000-0000-0000-000000000001', '{}'::jsonb)
ON CONFLICT (project_id) DO NOTHING;
```

`[VERIFIED: apps/supabase/supabase/seed.sql:28-41 — quoted verbatim]`

Note that the `app_settings` bootstrap row is **required**, not optional: `setupFromTemplate` calls `client.replaceAppSettings(...)` then `client.getAppSettings()` and asserts `expect(persisted, 'post-seed app_settings row should exist').toBeTruthy()` `[VERIFIED: tests/tests/setup/shared/setupFromTemplate.ts:259-265]`, and `SupabaseFeedbackWriter._postFeedback` throws *"failed to resolve project_id: … no app_settings row"* without it `[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts:20-21]`. **Creating the project without its `app_settings` row breaks the suite immediately.**

**Where it should live:** as a public method on `packages/dev-seed/src/supabaseAdminClient.ts` (the base class), beside the existing `updateAppSettings`. Rationale: (i) it needs `this.client` (service role) and `this.projectId`, both already `protected` there for exactly this reason — the file's own docblock says they are `protected` *"so the tests/ subclass can reuse the Supabase REST client … without re-creating a second client"* `[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:133-136]`; (ii) `tests/tests/utils/supabaseAdminClient.ts` inherits it for free, so `globalSetup` calls it with zero new wiring; (iii) `db:seed` gets project creation too, which is what makes a fresh clone able to seed a non-default project at all. **Do not** put it in `tests/` — that would leave `yarn db:seed --template … --project-id …` unable to bootstrap.

### 4.4 MEASURED: `globalSetup` is a thin adapter with an obvious insertion point

`tests/global-setup.ts` is 53 lines: derive `baseURL` from the resolved config (with an explicit *"READ the target; never recompute it"* comment), derive `repoRoot` from `TESTS_DIR`, pick a deadline, then `await assertServedApp({ baseURL, repoRoot, deadlineMs });` `[VERIFIED: tests/global-setup.ts:29-53]`.

Project creation goes **immediately after** `assertServedApp` — so an identity failure is still the first thing reported, per D-J2's structural note and CONTEXT F15. `[VERIFIED: tests/global-setup.ts:52 is the last statement]`

**On `globalTeardown`:** none is configured today (`grep` finds only `globalSetup:` in `playwright.config.ts`). Under recommendation R3-a (§ 3.4) **no `globalTeardown` is needed at all** — the per-family `teardown:` projects already clear the content, and the project row is deliberately kept. If the planner instead takes R3-d, a `globalTeardown` becomes necessary and must delete `app_settings` before `projects`.

### 4.5 O-7 — delivering the id to the running dev server

The constraint chain, all measured:

1. `yarn dev` starts **before** the suite; there is no Playwright `webServer` for the main suite, and `tests/scripts/e2e-run.sh`'s header states that adding one is **FORBIDDEN**, because *"it would replace the Phase-137 trust model (a gate that VERIFIES an operator-started server) with one that trusts a Playwright-started one"* `[VERIFIED: tests/scripts/e2e-run.sh — the block above the `set -m` spawn]`.
2. The dev server reads its public env at process start from `loadEnv(apps/frontend, '')`, which merges `process.env` (§ 1.2, measured).
3. A shell-prefixed value therefore reaches `$env/dynamic/public` (§ 1.2, measured: `PUBLIC_PROJECT_ID=deadbeef` → `"deadbeef"`).
4. `e2e-run.sh` **already** spawns the dev server with an explicit env prefix: `(cd "$REPO_ROOT" && FRONTEND_PORT="$FRONTEND_PORT" yarn dev) > "$RUN_DIR/devserver.log" 2>&1 &` `[VERIFIED: tests/scripts/e2e-run.sh — the `set -m` spawn line]`. Adding a second variable there is a one-token edit.

| Option | Effect on criterion 4's prereq list | Verdict |
|---|---|---|
| **(O7-a) ★ `.env.example` documents `PUBLIC_PROJECT_ID=00000000-…-0001` (the DEFAULT project, satisfying criterion 1 verbatim); the E2E run overrides it via the dev-server spawn env** — `PUBLIC_PROJECT_ID="$E2E_PROJECT_ID" yarn dev` in `e2e-run.sh`, and the same one-token prefix in the documented manual prereq | Prereqs get **shorter**: today's `yarn db:reset` (destructive, ~40 s, drives the disk growth) is replaced by a prefix on a command already in the list. Manual `yarn db:reset-with-data && yarn dev` keeps working against the default project. | **Recommended.** |
| (O7-b) Put `PUBLIC_PROJECT_ID=<E2E id>` permanently in the root `.env` | Shortest prereqs (nothing to type) — but a plain `yarn db:reset-with-data && yarn dev` then shows an **empty** app, because `db:seed:default` fills the *default* project. A real DX regression. | Rejected. |
| (O7-c) Default the variable to the E2E project "in dev only" | Magic; two different meanings of `yarn dev`; hard to document truthfully. | Rejected. |
| (O7-d) Restart the dev server from `globalSetup` | Forbidden by the Phase-137 trust model (point 1). | Rejected. |

**⚠ Whichever route is taken, § 1.7's plumbing (P1) is a prerequisite for the `.env.example` half.** Without it the documented line is inert. The shell-prefix half works today with no change.

### 4.6 Consequences for the 30 setup files, enumerated

| Site | What changes under the recommendation |
|---|---|
| `packages/dev-seed/src/supabaseAdminClient.ts:145` | `this.projectId = projectId ?? process.env.E2E_PROJECT_ID ?? TEST_PROJECT_ID` (or a named resolver). **This one edit re-points all 51 construction sites.** |
| `packages/dev-seed/src/ctx.ts:88` | same resolution for the seed pipeline's `projectId` |
| `packages/dev-seed/src/supabaseAdminClient.ts` (new method) | `ensureProject()` per § 4.3 |
| `tests/global-setup.ts` | one `await client.ensureProject()` after `assertServedApp` |
| `tests/tests/setup/shared/setupFromTemplate.ts:77` | `BASELINE_SEED_PREFIX` becomes unnecessary — see § 5 |
| `tests/tests/setup/shared/base.setup.ts:38` | `extraTeardownPrefix: ['e2e-perm-', 'e2e-bankauth-']` **stays** — all families still share **one** project (the E2E project), so cross-family residue is unchanged |
| The other 29 setup/teardown files | **no edit** — they go through `setupFromTemplate` / `new SupabaseAdminClient()` / `runTeardown`, all of which inherit the new default |
| `packages/dev-seed/src/templates/**` (40 files) | **no edit** under the recommended route |
| `tests/scripts/e2e-run.sh` | spawn-env addition (§ 4.5) + the `--no-db-reset` flag (§ 7) |

---

## R5 — `E2E_REQUIRE_FRESH_DB` and `probeFreshDatabasePrecondition` (O-4)

### 5.1 MEASURED: the probe today

`tests/tests/setup/shared/setupFromTemplate.ts:97-128`:

```ts
async function probeFreshDatabasePrecondition(client: SupabaseAdminClient, prefix: string): Promise<void> {
  const requireFresh = process.env.E2E_REQUIRE_FRESH_DB === 'true';
  const candQuery = client.query('candidates');
  const { data: nonTestCands, error: candErr } = await candQuery
    .not('external_id', 'like', `${prefix}%`)
    .not('external_id', 'like', `${BASELINE_SEED_PREFIX}%`)
    .limit(5);
  … if (requireFresh) { throw new Error(message); } console.warn(message);
}
```

with `const BASELINE_SEED_PREFIX = 'seed_';` at `:77`, whose comment reads *"dev-seed `default` template emits `seed_`-prefixed baseline rows into TEST_PROJECT_ID … The freshness probe must NOT treat those auto-seeded baseline rows as 'non-test contamination'."* `[VERIFIED: tests/tests/setup/shared/setupFromTemplate.ts:72-77, 89-128, 173-175]`

**The critical structural fact:** the probe queries through `client.query('candidates')`, which is `this.client.from(tableName).select('*').eq('project_id', this.projectId)` `[VERIFIED: tests/tests/utils/supabaseAdminClient.ts:195-197]`. **The probe is therefore already project-scoped.** Re-pointing the client at `E2E_PROJECT_ID` re-aims the probe for free.

### 5.2 The two todos pull in opposite directions — and per-project scoping resolves the tension

- `.planning/todos/pending/2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md` measures that `yarn test:unit` leaves `elections=1 · question_categories=4 · questions=26 · candidates=328 · nominations=377` under the `seed_` prefix in the live DB; that Phase 144 lost a suite to it (**8 failed / 79 did not run / 48 passed**, recovered to **135 passed / 0 failed** only by re-inserting `db:reset`); and proposes *"option 2: … make `yarn test:e2e` refuse to start against a dirty database (promote the existing freshness probe from a warning to a hard failure)."* `[VERIFIED: .planning/todos/pending/2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md:22-64]`
- The todo also notes the warning *"is easy to read past because it also fires benignly under parallel perm setups"* `[VERIFIED: same file:47-49]` — which is exactly why it was never promoted.

**The resolution the phase makes available:** `test:unit`'s residue lands in the **default** project (`TEST_PROJECT_ID`, via `ctx.ts:88`'s default). An E2E run scoped to `E2E_PROJECT_ID` cannot see it. So `BASELINE_SEED_PREFIX` — the exclusion that existed *only* to hide those rows — becomes dead, and with it the probe's main source of benign noise.

### 5.3 RECOMMENDATION — re-aim, then promote, as two separately-evidenced steps

**Recommended posture:**

1. **Keep** `probeFreshDatabasePrecondition`. Its question is still worth asking; it just changes from *"is the whole database fresh"* to *"is the E2E project free of rows this run does not own"* — a question that is now answerable and actionable.
2. **Delete** `BASELINE_SEED_PREFIX` (`:77`) and both `.not('external_id','like',`${BASELINE_SEED_PREFIX}%`)` clauses (`:104`, `:109`). Its stated reason — hiding `seed_` rows in `TEST_PROJECT_ID` — no longer applies once the client is scoped elsewhere. **This is a load-bearing deletion**: leaving it in place means the probe silently excludes a prefix that can no longer appear, which is the stale-guard class this milestone exists to close.
3. **Retire the env knob's polarity**, but as a **separately measured task**: replace `E2E_REQUIRE_FRESH_DB=true` (opt-in to strictness) with strict-by-default plus an explicit escape (`E2E_ALLOW_DIRTY_PROJECT=true`). This delivers the F13 todo's option 2 without its cost.

**⚠ Do not fuse step 3 into step 2.** The residual benign-noise source is *cross-family* residue **inside** the E2E project: all 19 perm setups, the base chain and the candidate chain still share **one** project, and `base.setup.ts:38`'s `extraTeardownPrefix: ['e2e-perm-','e2e-bankauth-']` exists precisely because *"an aborted run used to silently wedge voter-journey's exact-count assertions in the blocking default suite until an out-of-band `yarn db:reset`"* `[VERIFIED: tests/tests/setup/shared/base.setup.ts:19-38]`. A hard-fail probe would convert that recoverable state into a run that refuses to start. **Sequence it as: land the re-aim, take the twice-in-a-row proof, and only then promote — using the two green runs as the evidence that strictness is affordable.** If the two runs show any probe warning, promotion must be deferred and filed per D-N2.

**Consequences to check when the client is re-pointed:**
- **`BASELINE_SEED_PREFIX`** — deleted (above).
- **`base.setup.ts:38` foreign-namespace pre-wipes** — **keep unchanged.** Same project, same need.
- **Exact-count assertions** — `voter-journey`'s counts are the ones the base-setup comment names. They are computed against the seeded dataset within one project; scoping the *client* does not change what the seed writes. **No count should move** — but this is the highest-risk claim in the section and the twice-in-a-row proof is what tests it. `[INFERRED — from the fact that `Writer.write` seeds into `ctx.projectId` and the assertions read the same project; not independently verified by running the suite]`
- **`runTeardownAsserted`'s before/after accounting** (`tests/tests/setup/shared/assertTeardown.ts`) — reads through `countRowsByPrefix`, which is `.eq('project_id', this.projectId)`-scoped (`packages/dev-seed/src/supabaseAdminClient.ts:665,677`), so it follows automatically. `[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:665,677 — docblock `Filters: project_id = this.projectId AND external_id LIKE ${prefix}%`]`

---

## R6 — Where `PROJECT_ID` resolution lives (O-8)

### 6.1 ★ The single resolution site already exists: `supabaseAdapterMixin.init()`

`apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts:26-71` is a mixin applied to **all four** adapter classes, holding `#supabase`, `#locale`, `#defaultLocale` behind getters and initialising them in one `init(config: SupabaseAdapterConfig)`. `[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts:26-71]`

Its config type already anticipates project-derived state — `SupabaseAdapterConfig.defaultLocale` is documented as *"Default locale fallback (**from projects.default_locale**)."* `[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts:12-13]`

All four classes extend it:
- `SupabaseDataProvider extends supabaseAdapterMixin(UniversalDataProvider)` `[VERIFIED: dataProvider/supabaseDataProvider.ts:42]`
- `SupabaseFeedbackWriter extends supabaseAdapterMixin(UniversalFeedbackWriter)` `[VERIFIED: feedbackWriter/supabaseFeedbackWriter.ts:13]`
- (same shape for `SupabaseDataWriter`, `SupabaseAdminWriter` — both import `supabaseAdapterMixin` from `'../supabaseAdapter'`)

**Recommendation:** add `#projectId` + `get projectId()` + `scopedFrom(table)` here, resolved from `constants.PUBLIC_PROJECT_ID` with a **fail-fast throw** when empty — the F5 todo's step 5, landed at the one site that serves every adapter. The throw's shape should mirror the existing `get supabase()` guard (`"Supabase client not initialized. Call init() first."`, `:58`) and dev-seed's `Writer` constructor, which throws naming the env var and the remedy (`writer.ts:92-106`). `[VERIFIED: supabaseAdapter.ts:57-60; packages/dev-seed/src/writer.ts:92-106]`

### 6.2 Why "thread it from callers" is the wrong answer here

The adapters are **module-level singletons** — `export const dataProvider = new SupabaseDataProvider();` and three siblings `[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/{dataProvider,dataWriter,adminWriter,feedbackWriter}/index.ts — all four read]` — re-`init()`ed per load function. Threading a project id would mean editing **23** production call sites, every one of which would pass the same constant. That is 23 chances to forget, against one enforced site.

### 6.3 MEASURED work map — every file that must change, with site counts

**Adapter construction sites (23 production, `.init({...})`)** — **no edit required** under the recommendation, listed so the planner can confirm the claim rather than take it:

| File | Line |
|---|---|
| `src/lib/contexts/app/appContext.svelte.ts` | 423 (`feedbackWriter.init`) |
| `src/lib/contexts/utils/prepareDataWriter.ts` | 14 |
| `src/lib/auth/getUserData.ts` | 27 |
| `src/lib/admin/utils/loadElectionData.ts` | 28 |
| `src/lib/server/admin/features/condenseArguments.ts` | 48 |
| `src/lib/server/admin/features/generateQuestionInfo.ts` | 59 |
| `src/routes/+layout.ts` | 20 |
| `src/routes/candidate/(protected)/+layout.server.ts` | 33, 75 |
| `src/routes/admin/(protected)/+layout.ts` | 43 |
| `src/routes/admin/(protected)/argument-condensation/+page.server.ts` | 29 |
| `src/routes/admin/(protected)/argument-condensation/+layout.ts` | 12 |
| `src/routes/admin/(protected)/question-info/+page.server.ts` | 54 |
| `src/routes/admin/(protected)/question-info/+layout.ts` | 12 |
| `src/routes/(voters)/nominations/+layout.ts` | 31 |
| `src/routes/(voters)/(located)/+layout.ts` | 97 |
| `src/routes/api/auth/login/+server.ts` | 21 |

(plus 7 sites in `src/lib/api/base/universalAdapter.test.ts`) `[VERIFIED: grep -rn "\.init({" apps/frontend/src tests]`

**Files that DO change:**

| File | Sites | Work |
|---|---|---|
| `apps/frontend/src/lib/utils/constants.ts` | 1 (add a 11th key) | expose `PUBLIC_PROJECT_ID`. **Note the existing `?? ''` idiom on every key** (`:4-14`) — for this key the empty default is the thing that must *not* silently pass, so the throw belongs in the mixin, not here |
| `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` | 1 | `#projectId`, `get projectId()`, `scopedFrom()`, fail-fast |
| `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts` | 1 | optional `projectId` override on the config (for tests) |
| `…/dataProvider/supabaseDataProvider.ts` | **9 query sites** (`:49, :85, :140, :180, :205, :259(rpc), :471, :505, :539`) — currently **0** `project_id` references | the bulk of the read-path work |
| `…/dataWriter/supabaseDataWriter.ts` | 12 `project_id` refs; **4 derivation queries removable** (`:125-139`, `:287-293`, `:339-347`, `:400-408`) | replace derivations with `this.projectId`; scope `:230` (`nominations`), `:365` (`candidates`), `:407` (`admin_jobs`) |
| `…/adminWriter/supabaseAdminWriter.ts` | 4 refs; **1 derivation removable** (`:42-50`) | same |
| `…/feedbackWriter/supabaseFeedbackWriter.ts` | 4 refs; **1 derivation removable** (`:15-21`) | **this one is a live bug**: `.from('app_settings').select('project_id').limit(1).single()` returns PostgREST error `PGRST116` the moment a second project exists — which is exactly what this phase creates. Feedback would break on the E2E project unless this is fixed. |
| `…/dataProvider/supabaseDataProvider.test.ts` | (1696 lines) | mocks must supply a project id |
| `…/dataWriter/supabaseDataWriter.test.ts` + `…/adminWriter/supabaseAdminWriter.test.ts` | 11 `project_id` refs (F4's test half) | same |
| `apps/supabase/supabase/schema/503-entity-rpcs.sql` + `migrations/00001_initial_schema.sql` | `get_nominations` signature + grant | § 2.3 |
| `packages/supabase-types/` | regenerated | `yarn db:types` after the RPC change |

`[VERIFIED: all line references above opened or grepped this session]`

**⚠ The three "derivation" removals are the phase's best-value change.** Each is an extra round-trip whose only purpose is to answer "which project am I in?" — a question the env now answers. Removing them deletes 6 queries from the hot paths **and** closes the `app_settings.limit(1).single()` multi-project bug in `feedbackWriter` and `_getAppSettings`/`_getAppCustomization` (`supabaseDataProvider.ts:49, :85`), all three of which assume exactly one `app_settings` row exists.

### 6.4 How the candidate/admin paths interact with `can_access_project()`

Measured: `302-rls.sql` declares **80** policies; the `authenticated_*` policies route through `can_access_project(project_id)` (e.g. `authenticated_select_elections USING ((SELECT can_access_project(project_id)) OR published = true)`, `admin_update_elections USING ((SELECT can_access_project(project_id)))`) `[VERIFIED: apps/supabase/supabase/schema/302-rls.sql:78-95; grep -c "CREATE POLICY" → 80]`, and `anon_select_*` policies are `USING (published = true)` with **no project term** — confirming the F5 todo's central claim from the SQL side `[VERIFIED: apps/supabase/supabase/schema/302-rls.sql:78-80]`.

**Interaction:** for an authenticated candidate/admin, RLS *already* restricts rows to projects the user can access, so adding `.eq('project_id', …)` is **redundant but harmless** — it narrows an already-narrow set. For `anon`, RLS does **not** scope at all, so the `.eq()` is the only scoping there is. The F5 todo's scope boundary (*"Voter (anon) paths only … Candidate/admin paths … already have project context via `can_access_project()`"*) is therefore an accurate description of where the *risk* is — but 161's criterion 2 says *every* project-scoped query, and the guard cannot distinguish anon from authenticated call sites statically. **Recommend scoping uniformly**: it is one predicate, it makes the guard expressible, and for authenticated paths it is a no-op at the database.

---

## R7 — The twice-in-a-row proof: cost and procedure

### 7.1 MEASURED: the current numbers

| Quantity | Value | Source |
|---|---|---|
| Spec files | **41** `*.spec.ts` under `tests/tests/specs/` | `[VERIFIED: find tests/tests/specs -name '*.spec.ts' \| wc -l]` |
| Tests in a full gate run | **150** (150 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run) | `[VERIFIED: tests/e2e-runs/147-reach14-suite/summary.json — `"counts": {"total":150,"passed":150,"failed":0,"flaky":0,"skipped":0,"didNotRun":0}`]` |
| Wall clock | **639,306 ms = 10.7 min** | `[VERIFIED: same file — `"wallClockMs": 639306.735, "wallClockHuman": "10.7 min"`]` |
| Date / exit | 2026-08-27T12:07Z, `playwright-exit: 0`, `preflight-ok: 1`, `preflight-fail: 0` | `[VERIFIED: tests/e2e-runs/147-reach14-suite/{provenance.txt,exit}]` |
| Slowest projects | `a11y-smoke` 166.5 s · `perm-show-feedback-survey` 145.8 s · `perm-org-matching` 114.0 s · `voter-journey` 66.7 s | `[VERIFIED: summary.json `byProject`]` |
| Free disk **now** | **23 GiB free of 926 GiB, 98% capacity** | `[VERIFIED: df -h . executed this session]` |
| Docker | Images 15.26 GB (2.115 GB reclaimable), containers 37.47 MB, volumes 1.129 GB | `[VERIFIED: docker system df executed this session]` |
| Headroom burn rate | **~0.5–1 GiB per full-suite `db:reset` cycle**; `147-02` lost **two** runs to ENOSPC | `[VERIFIED: .planning/todos/pending/2026-08-27-147-full-suite-disk-headroom-falling.md:12-25]` |

**Reading:** 23 GiB is the *same* figure the disk todo recorded as the low-water mark on 2026-08-27 — headroom has not recovered. Two runs **without** `db:reset` should cost far less than 2 GiB (the todo attributes the growth to the reset cycles, and measures run directories at 1.8–1.9 MB each). **The proof is affordable, but only because it is the reset-free proof.** A planner who takes preparatory *baseline* runs **with** resets will spend the budget before the evidence run.

### 7.2 ⚠ MEASURED: the evidence harness resets the DB unconditionally

`tests/scripts/e2e-run.sh` (460 lines) accepts exactly **two** flags — `--run-dir` (required) and `--project` (optional) — and its step 3 is an unconditional `yarn db:reset`:

```
if ! (cd "$REPO_ROOT" && yarn db:reset > "$RUN_DIR/db-reset.log" 2>&1); then
  echo "e2e-run.sh: FATAL -- yarn db:reset failed; see $RUN_DIR/db-reset.log" >&2
```

`[VERIFIED: tests/scripts/e2e-run.sh:128-140 (arg parsing — only `--run-dir` and `--project`), :276-278 (the reset), :21,:30,:55 (header)]`
`tests/scripts/determinism-batch.sh` (612 lines) loops it, so **every** iteration resets. `[VERIFIED: tests/scripts/e2e-run.sh header — "Plan 05's determinism batch LOOPS this script"]`

**Consequence:** the canonical, preflight-confirmed evidence path **cannot produce** criterion 3's evidence as it stands. The planner must add a flag (`--no-db-reset`) that skips step 3 while keeping steps 4–9 (readiness poll, port assertion, owned dev-server spawn, preflight-verdict capture, trap teardown, provenance). Hand-driving the second run instead is possible but forfeits `provenance.txt` / `summary.json` / the `preflight-ok` count — the very artefacts the repo's own evidence standard is built on (`tests/README.md` § Preflight: *"it exists so that 'the preflight passed' is a POSITIVE fact rather than the absence of a failure"*) `[VERIFIED: tests/README.md § "Reading a success"]`.

### 7.3 RECOMMENDED procedure, step by step

Preconditions (assert, do not assume):
1. `df -h .` shows **≥ 5 GiB** free. If not, the operator must reclaim from the Docker layer (a host-level `fstrim`/Docker.raw operation an agent cannot perform). **`tests/e2e-runs/` must not be deleted** — the phase registers cite it. `[VERIFIED: disk todo §"What must NOT be reclaimed"]`
2. Nothing is listening on `FRONTEND_PORT` (default 5173). `e2e-run.sh` asserts this itself and exits 5 with the pid list; `yarn dev` fails loudly via `strictPort: true` (`apps/frontend/vite.config.ts:43`). `[VERIFIED: tests/scripts/e2e-run.sh — the `pre_holders` block; apps/frontend/vite.config.ts:38-43]`
3. Working tree clean enough that `provenance.txt`'s cleanliness record is meaningful.

Run:
4. **Run A — the setup run.** `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/161-twice-run1` (with `db:reset` **enabled**, once, to establish a known start). Expect exit 0, 150/150, `preflight-ok: 1`, `preflight-fail: 0`.
5. **Between runs — change nothing and reset nothing.** Record `df -h .` and `docker system df`. Confirm the E2E project row and its content rows are in whatever state run A left (a `select count(*) … where project_id = <E2E id>` per teardown table is the honest check). **Do not** run `yarn test:unit`, `yarn db:seed`, or `yarn db:reset`.
6. **Run B — the proof run.** `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/161-twice-run2 --no-db-reset`. This is the run that discharges criterion 3.
7. **Verdict.** Both runs must be green under the full cardinal definition: `counts.failed == 0` **and** `counts.didNotRun == 0` **and** `counts.flaky == 0`, with `preflight-ok ≥ 1` and `preflight-fail == 0` in each `provenance.txt`. A per-spec smoke, a `--grep`, or a `--project` run **does not** discharge it (CONTEXT F14).
8. **Capture:** both `summary.json`, both `provenance.txt`, both `exit` files, the `df`/`docker system df` readings before/between/after, and the between-runs row counts.

### 7.4 F13's contamination-immunity claim — how to PROVE it rather than assert it

The claim: *"with per-project scoping, `test:unit`'s residue lands in the default project and is invisible to an E2E run scoped to `E2E_PROJECT_ID`."*

**The deliberate-contamination experiment** — this is the exact scenario Phase 144 suffered, replayed on purpose:

1. Reset once and seed nothing (`yarn db:reset`).
2. Run `yarn test:unit` with Supabase up. Verify the residue is present **and in the default project**:
   `select count(*) from candidates where project_id = '00000000-…-0001' and external_id like 'seed_%'` → expect ≈ **328** (the todo's measured figure: `elections=1 · question_categories=4 · questions=26 · candidates=328 · nominations=377`) `[VERIFIED: .planning/todos/pending/2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md:26]`.
3. Verify the same query scoped to `E2E_PROJECT_ID` returns **0**.
4. Run the **full** suite with **no** intervening `db:reset`. Expect 150/150 green.
5. **Negative control — the half that makes it a proof.** Repeat step 4 on the **pre-161 code** (or with the client re-pointed back at `TEST_PROJECT_ID`) and observe the failure. The expected signature is on record: `eperm07-term-trigger` reading `Economy & Taxation  7 questions` where it expected the Base opinion category, and `voter-journey` finding **2** constituency comboboxes where it expected **1** `[VERIFIED: same todo:39-42]`. Without the red half this is a green run, not a demonstration — the repo's standing evidence rule (see 152/153/154's *"the breach is proven real before it is proven fixed"*).

**Cost:** the negative control is a run that is *expected* to fail, so it terminates early — but budget it as a third full-suite slot and re-check disk first.

---

## R8 — Criterion 4's doc surface

### 8.1 MEASURED: F11 confirmed, plus two sites F11 does not list

Full sweep of `db:reset` / `db reset` across live docs and CI:

| Site | Text | Disposition |
|---|---|---|
| `CLAUDE.md:281-285` | the "Running tests after changes" block: `# Full E2E (requires Supabase running)` / `yarn db:reset` / `yarn dev` / `# Wait for services to be healthy` / `yarn test:e2e` | **RETIRE** — the primary instruction |
| `tests/README.md:83` | `yarn db:reset && yarn db:seed --template e2e/base && yarn dev:clean` (the manual reseed chain) | **REWRITE** |
| `tests/README.md:248` | *"Fresh database with only `test-` prefixed rows"* (state assumption) | **REWRITE** — becomes "an E2E project containing only this run's rows" |
| `tests/README.md:276` | *"**`yarn db:reset` in another terminal will wipe the suite mid-run** — the teardown projects are the only legitimate path to clear test data."* | **KEEP, adjusted** — still true, and arguably more important once resets are no longer routine |
| `tests/README.md:7` | `# Prereqs: yarn install && (in another shell) yarn dev` | already correct; **update** if O7-a adds the env prefix |
| **`tests/IDURA-TEST-RUNBOOK.md:396`** | *"server stealing the port) + a **clean DB** (`yarn db:reset`) before the run."* | **⚠ NOT in F11's list. RETIRE.** |
| **`tests/IDURA-TEST-RUNBOOK.md:401`** | `yarn db:reset                              # clean DB first (project-memory prereq)` | **⚠ NOT in F11's list. RETIRE.** |
| `CLAUDE.md:17,81,82,92,93,307,403` | `db:reset` documented as a **command** | **KEEP** — F11's rule: only the *E2E precondition* statements are retired |
| `apps/supabase/README.md:15,45,46` | `db:reset` as the schema/migration command | **KEEP** — not an E2E precondition |
| `packages/dev-seed/README.md:15,20,21,30,342` | `db:reset` in the seeding command map | **KEEP** — not an E2E precondition |

`[VERIFIED: grep -rn "db:reset\|db reset" CLAUDE.md tests/README.md tests/IDURA-TEST-RUNBOOK.md .github/workflows/*.yaml apps/supabase/README.md packages/dev-seed/README.md apps/frontend/README.md README.md — full output reproduced above]`

Phase 137's D-14 scoping applies: **live docs only**; archived `.planning/milestones/**` is the historical record and is untouched. And F11's observation stands — the literal string *"reset the DB first"* appears nowhere; criterion 4's grep is a **class** grep (`db:reset` stated as an E2E precondition), not a literal one.

**Also worth a look while in the file:** `.planning/todos/pending/2026-08-28-claude-md-stale-factual-claims.md` exists and may overlap the `CLAUDE.md` edit — check it before writing, so 161 does not fix half of what that todo describes and leave the rest. `[VERIFIED: ls .planning/todos/pending/]`

### 8.2 MEASURED: CI does NOT run `db:reset` before E2E — no change needed

The `e2e-tests` job is, in order: checkout → `cp .env.example .env` → `supabase/setup-cli@v1` → yarn/node setup → `yarn install --frozen-lockfile` → `yarn playwright install --with-deps` → `yarn build` → `supabase start` (in `apps/supabase`) → `yarn workspace @openvaa/frontend dev &` → `yarn test:e2e` → upload report → `supabase stop`. `[VERIFIED: .github/workflows/main.yaml:247-301]`

There is **no `db:reset` step**; `supabase start` on a fresh runner already applies migrations + `seed.sql`. The `e2e-visual` job has the same shape (`:328-383`). So criterion 4's CI half is already satisfied and **needs no workflow edit** — but two things must be checked:

1. **The `globalSetup` project creation must be idempotent on a virgin database** — on CI the E2E project will never exist, so the "create" branch is the CI path and the "reuse" branch is the local path. Both must work; only one is exercised locally.
2. **⚠ An env observation the planner should verify, not inherit from me.** CI writes the root `.env` (`cp .env.example .env`) but starts the frontend with `yarn workspace @openvaa/frontend dev`, whose cwd is `apps/frontend` and which therefore reads `apps/frontend/.env` — a file that is **gitignored** (`apps/frontend/.gitignore:7-9`) and so does not exist on a CI runner. `apps/frontend/.env.example` is tracked but is not a file `loadEnv` reads. On the measurement in § 1.2 this implies `constants.PUBLIC_SUPABASE_URL` is `''` in CI. I could not resolve how the CI E2E job passes with that, and I did not run CI. **`[ASSUMED — the mechanism is measured; the conclusion that CI is affected is INFERRED and must be checked against a recent green workflow run before the plan relies on it.]`** If it is real, it is a separate defect (file per D-N2), and it also means route (O7-a)'s `.env.example` line would be inert in CI for the same reason — making § 1.7's (P1) plumbing **required**, not optional.

---

## Architecture Patterns

### System Architecture Diagram

```
                          ┌──────────────────────── env sources ─────────────────────────┐
                          │                                                              │
  repo-root .env ─────────┤  read ONLY via vite.config loadEnv(repoRoot,'FRONTEND_PORT') │
  (.env.example: the      │  → today reaches Vite for the PORT only                       │
   documented template,   │  → § 1.7 P1 extends it to carry PUBLIC_PROJECT_ID             │
   copied by CI)          │                                                              │
                          │                                                              │
  apps/frontend/.env  ────┤  read by SvelteKit: loadEnv(mode, kit.env.dir=cwd, '')        │
  (untracked; the ACTUAL  │  publicPrefix 'PUBLIC_' filters → $env/dynamic/public         │
   source today)          │                                                              │
                          │                                                              │
  shell prefix ───────────┤  PUBLIC_PROJECT_ID=… yarn dev   (MEASURED to work)            │
                          └───────────────────────────┬──────────────────────────────────┘
                                                      │
                                      constants.PUBLIC_PROJECT_ID
                                                      │
                            ┌─────────────────────────▼──────────────────────────┐
                            │  supabaseAdapterMixin.init()   ◄── SINGLE RESOLUTION │
                            │    #projectId  (throw if empty)                     │
                            │    get projectId()                                  │
                            │    scopedFrom(table) = from(table).eq('project_id')  │
                            └───┬──────────┬──────────┬──────────┬────────────────┘
                                │          │          │          │
                     DataProvider   DataWriter   AdminWriter   FeedbackWriter
                       9 queries     12 refs      4 refs        4 refs
                       0 scoped      3 derivations removable ───┘
                                │          │
                    ┌───────────┴──┐   ┌───┴────────────────┐
                    │ .from(table) │   │ .rpc(fn, {p_…})    │
                    │  ⇒ scopedFrom│   │  ⇒ p_project_id     │
                    └───────┬──────┘   └────────┬───────────┘
                            │                   │
                            ▼                   ▼
                    PostgREST + RLS      get_nominations  ← NEEDS p_project_id (measured)
                    (anon: published      get_questions   ← arrives from Phase 157
                     only, NO project     get_candidate_user_data ─┐
                     term — depth only)   upsert_answers          ├─ scoped by identity
                                          merge_custom_data       ─┘
                            │
                            ▼
              ┌──────────────────────────────────────────────┐
              │  public.projects                             │
              │    ├─ 12 tables  FK … ON DELETE CASCADE      │
              │    └─ app_settings  FK  (NO CASCADE) ⚠ O-1   │
              └──────────────────────────────────────────────┘
                            ▲
                            │  service role (bypasses RLS)
              ┌─────────────┴──────────────────────────────────────┐
              │ Playwright globalSetup                             │
              │   1. assertServedApp  (Phase 137 preflight)        │
              │   2. ensureProject(E2E_PROJECT_ID)  ← NEW          │
              │        INSERT projects   ON CONFLICT DO NOTHING    │
              │        INSERT app_settings ON CONFLICT DO NOTHING  │
              └─────────────┬──────────────────────────────────────┘
                            │
                  29 *.setup.ts → setupFromTemplate (1 helper)
                  28 *.teardown.ts → runTeardown / runTeardownAsserted
                  51 new SupabaseAdminClient()  ← all argument-less;
                     all inherit projectId from ONE default (line 145)
```

### Recommended file layout (deltas only)

```
scripts/
└── assert-project-scoped-queries.mjs      # NEW — the guard (house idiom)
packages/dev-seed/
├── src/supabaseAdminClient.ts             # +ensureProject(); :145 default resolution
├── src/ctx.ts                             # :88 default resolution
└── tests/projectScopingGate.test.ts       # NEW — lint:check chain MEMBERSHIP spec
apps/frontend/src/lib/
├── utils/constants.ts                     # +PUBLIC_PROJECT_ID
└── api/adapters/supabase/
    ├── supabaseAdapter.ts                 # #projectId, get projectId(), scopedFrom()
    ├── supabaseAdapter.type.ts            # optional projectId on the config
    ├── dataProvider/supabaseDataProvider.ts   # 9 query sites
    ├── dataWriter/supabaseDataWriter.ts       # scope 3, delete 4 derivations
    ├── adminWriter/supabaseAdminWriter.ts     # scope 1, delete 1 derivation
    └── feedbackWriter/supabaseFeedbackWriter.ts # scope 1, delete 1 derivation
apps/frontend/vite.config.ts               # § 1.7 P1 plumbing
apps/supabase/supabase/
├── schema/503-entity-rpcs.sql             # get_nominations p_project_id + grant
└── migrations/00001_initial_schema.sql    # the same, in the applied migration
tests/
├── global-setup.ts                        # ensureProject after the preflight
├── scripts/e2e-run.sh                     # --no-db-reset; spawn-env PUBLIC_PROJECT_ID
└── tests/setup/shared/setupFromTemplate.ts # drop BASELINE_SEED_PREFIX
```

### Pattern 1 — Single-site resolution with fail-fast (the mixin)

**What:** every adapter obtains its project id from one initialiser that throws when the value is absent.
**When to use:** any deployment-wide constant an adapter needs in both browser and server.
**Example (shape drawn from the two in-tree fail-fast precedents):**

```ts
// Source: apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts:57-60 (guard shape)
//         packages/dev-seed/src/writer.ts:92-106 (env-throw message shape)
get supabase(): SupabaseClient<Database> {
  if (!this.#supabase) throw new Error('Supabase client not initialized. Call init() first.');
  return this.#supabase;
}
```

```ts
// Source: packages/dev-seed/src/writer.ts:92-97
if (!process.env.SUPABASE_URL) {
  throw new Error(
    'SUPABASE_URL env var is required but not set. ' +
      'Did you forget to run `supabase start`? ' +
      'Expected format: http://127.0.0.1:54321'
  );
}
```

The new throw should name the variable, say where to set it, and give the default project uuid — the same three elements.

### Pattern 2 — Forbidden call shape + completeness check (the guard)

**What:** assert a forbidden shape's *absence*, and separately assert that every site the guard could not parse is reported rather than skipped.
**When to use:** whenever a "does the chain contain X" predicate would need dataflow.
**Example (the in-tree completeness-check precedent, verbatim in structure):**

```ts
// Source: tests/playwright.config.ts — teardown-prefix guard
if (unparsedTeardownPrefixFiles.length > 0) {
  throw new Error(
    "Teardown prefix guard could not parse a `const PREFIX = '...'` declaration in " +
      `${unparsedTeardownPrefixFiles.join(', ')}, but the file calls runTeardownAsserted — so its ` +
      'prefix is NOT covered by the uniqueness/overlap check below and a collision could reappear ' +
      'silently … Make the declaration match `const PREFIX = \'...\'` …, or widen the regex above.'
  );
}
```

### Pattern 3 — Idempotent bootstrap (project creation)

```sql
-- Source: apps/supabase/supabase/seed.sql:28-41 (verbatim)
INSERT INTO projects (id, account_id, name, default_locale)
VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Default Project','en')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_settings (project_id, settings)
VALUES ('00000000-0000-0000-0000-000000000001', '{}'::jsonb)
ON CONFLICT (project_id) DO NOTHING;
```

### Anti-Patterns to Avoid

- **Documenting `PUBLIC_PROJECT_ID` in `.env.example` and stopping there.** Measured: the frontend does not read that file. § 1.7.
- **Threading the project id through the 23 `.init({ fetch })` call sites.** 23 identical arguments, 23 chances to forget. § 6.2.
- **A `p_project_id uuid DEFAULT NULL` on `get_nominations`.** Re-creates the silent-fallback shape the phase exists to remove — the same defect as `identity-callback:197`'s `||` chain. § 2.3.
- **Matching `.from(` without excluding `.storage.from(`.** Two measured false positives at `supabaseDataWriter.ts:299,349`. § 2.1.
- **Promoting the freshness probe to a hard failure in the same task as the re-aim.** § 5.3.
- **Rewriting the `lint:check` value rather than appending to it.** 152 and 153 are both landing links into it; both plans already forbid rewrites. § 2.4.
- **Editing `schema/*.sql` and forgetting `migrations/00001_initial_schema.sql`.** The schema tree is not what builds the database. § 3.1.
- **Deleting `tests/e2e-runs/` to reclaim disk.** Cited by the phase registers; also not where the space is. § 7.1.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Project-scoped admin queries in tests | A new scoped client | `SupabaseAdminClient` — already `.eq('project_id', this.projectId)` at 10+ sites | § 4.2; 51 call sites inherit it |
| Row teardown for the E2E project | A project-wide `DELETE` | `runTeardown` / `runTeardownAsserted` + the existing `teardown:` projects | Handles the 10-table reverse-dependency order server-side, plus storage portraits, plus the ≥2-char mass-delete guard |
| Idempotent project bootstrap | A `SELECT` then conditional `INSERT` | `INSERT … ON CONFLICT (id) DO NOTHING` | Race-free; already the `seed.sql` idiom |
| Chain-membership assertion for `lint:check` | A new spec file pattern | `packages/dev-seed/tests/ciTypecheckGate.test.ts`'s shape (split on `&&`, trim, `toContain`) | Phase 144's membership-not-position precedent; 152 and 153 both copy it |
| An owned dev server + preflight-confirmed evidence run | A bespoke shell wrapper | `tests/scripts/e2e-run.sh` (extended with `--no-db-reset`) | Already does port assertion, trap teardown, provenance, preflight-verdict counting |
| Locating the repo root from a config file | `__dirname` | `fileURLToPath(new URL('../../', import.meta.url))` | `apps/frontend` is `type: module`; the existing pattern is at `vite.config.ts:10` (and `__dirname` misuse is literally Phase 153 criterion 3) |

**Key insight:** the seed/test half of this phase is ~90% built and mis-described as absent. The genuinely new work is (1) frontend read-path scoping, (2) the guard, (3) `ensureProject`, (4) env plumbing. Everything else is re-pointing defaults.

---

## Runtime State Inventory

This is a scoping/parameterisation phase, not a rename — but it changes what the *running* system considers "its" data, which has the same shape of hazard. Every category answered explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | The local Postgres holds **one** project row (`00000000-…-0001`, from `seed.sql:29-36`) and **one** `app_settings` row (`seed.sql:39-41`). A second project + its `app_settings` row will be created by `globalSetup` and, under recommendation R3-a, **persist between runs**. Also present after any `yarn test:unit`: the whole `default` template (≈328 candidates, 377 nominations) under `seed_` in the **default** project. | Data creation, not migration. The two new rows are the phase's deliberate output. No existing row is rewritten. |
| **Live service config** | **None.** No n8n/Datadog/Tailscale/Cloudflare surface in this repo. Supabase local config is `apps/supabase/supabase/config.toml`, which **is** in git (verified: `git ls-files` does not exclude it; it was read from disk). The one config gap is `[edge_runtime.secrets]`, commented out at `:379-380` — see § 1.4. | Wire the Edge-Function env (or file it), per § 1.4. |
| **OS-registered state** | **None** — verified: no Task Scheduler / launchd / systemd / pm2 surface. Processes are `yarn dev` (foreground/backgrounded) and Docker containers started by `supabase start`. | None. |
| **Secrets / env vars** | `PUBLIC_PROJECT_ID` (new) — root `.env.example` (tracked), local root `.env` (untracked), local `apps/frontend/.env` (untracked). `DEFAULT_PROJECT_ID` — referenced by `identity-callback/index.ts:22,197`; **unset locally**; supplied in production via Supabase secrets. `E2E_PROJECT_ID` (new) — test-harness only. `E2E_REQUIRE_FRESH_DB` — existing, proposed for retirement/inversion (§ 5.3). | Add the new lines to `.env.example`; the operator must add them to their untracked `.env`; § 1.7 plumbing decides which file. |
| **Build artefacts / installed packages** | `packages/supabase-types/` is **generated** (`yarn db:types`) and must be regenerated after the `get_nominations` signature change. `.turbo/` caches typecheck/lint results — a stale cache can mask a type error after the regeneration (Phase 152's plans use `TURBO_FORCE=true` for exactly this). Three tracked `tsbuildinfo` files exist and are Phase 153's to remove. | `yarn db:types` after the RPC change; `TURBO_FORCE=true` on the verification typecheck. |

**The canonical question, answered:** after every source file is scoped, the runtime systems still carrying an unscoped notion of "the project" are — the **Edge Function** (`DEFAULT_PROJECT_ID` unset, falling to a hardcoded constant), the **`get_nominations` RPC** (no project predicate), and the **`anon_select_*` RLS policies** (published-only, no project term, and deliberately left that way as depth).

---

## Common Pitfalls

### Pitfall 1: The `.env.example` line that nothing reads
**What goes wrong:** criterion 1 is marked done because the variable is documented, but every query still resolves an empty project id — or the fail-fast throw fires on every page load.
**Why it happens:** `apps/frontend/.env.example` says to use the root file; SvelteKit reads the workspace file. Measured § 1.2.
**How to avoid:** land the § 1.7 (P1) plumbing in the *same* task as the `.env.example` line, and verify by starting `yarn dev` and observing the value — not by reading the file.
**Warning signs:** `constants.PUBLIC_PROJECT_ID === ''`; a preflight-green run where every list renders empty.

### Pitfall 2: `app_settings.limit(1).single()` starts returning the wrong project's row
**What goes wrong:** the moment a second project exists, `_getAppSettings` (`:49`), `_getAppCustomization` (`:85`) and `SupabaseFeedbackWriter._postFeedback` (`:15-19`) each take an arbitrary row — `limit(1)` with no `order` is non-deterministic in Postgres.
**Why it happens:** all three encode "there is exactly one project" structurally. The `feedbackWriter` docblock says so outright: *"we resolve it from `public.app_settings` (single-project deploy, anon-readable)"* `[VERIFIED: supabaseFeedbackWriter.ts:9-11]`.
**How to avoid:** these three are **not optional** conversions — they must land in the same wave that creates the E2E project.
**Warning signs:** the app rendering the *default* project's settings during an E2E run; feedback inserts landing in the wrong project.

### Pitfall 3: The Edge Function starts throwing after Phase 155
**What goes wrong:** `DEFAULT_PROJECT_ID` is unset locally; 155 makes the missing value throw; `identity-callback` 500s.
**Why it happens:** neither `[edge_runtime.secrets]` nor `functions/.env` exists. § 1.4.
**How to avoid:** wire it or file it; verify against the opt-in `PLAYWRIGHT_BANK_AUTH` path, which is where it surfaces.
**Warning signs:** the Idura runbook failing while `yarn test:e2e` stays green (the bank-auth projects are excluded from the default run).

### Pitfall 4: A guard that passes because it saw nothing
**What goes wrong:** the guard's matcher silently skips `this.supabase.from(table)` (dynamic argument) and reports zero violations on an unscoped file.
**Why it happens:** enumeration guards without completeness checks — the failure mode the repo has already hit twice (fake-guard findings F4 and WR-03, both cited in `tests/playwright.config.ts`).
**How to avoid:** the non-literal-argument hard failure of § 2.2.
**Warning signs:** guard output of `0 violation(s)` on a file you know is unscoped. **Every guard in this repo is expected to be proven by a flip (red before, green after) — 152-01's HYG2/HYG-ESC flips are the template.**

### Pitfall 5: Spending the disk budget on baseline runs
**What goes wrong:** ENOSPC voids a run; under the cardinal rule a voided run is a failure and must be re-taken in full (~10.7 min).
**Why it happens:** 23 GiB free at 98% capacity, and each `db:reset` cycle costs 0.5–1 GiB. `147-02` lost two runs this way.
**How to avoid:** check `df -h` **before** committing to the gate; use `--no-db-reset` for run B; do not delete `tests/e2e-runs/`.

### Pitfall 6: Rewriting `lint:check` instead of appending
**What goes wrong:** 152's or 153's link is dropped, and their membership specs go red — or worse, are edited to match.
**How to avoid:** read the value at execution time, append one `&&` link, assert **membership** of every pre-existing link by name (153-01's criterion already demands exactly this).

### Pitfall 7: Comments written under the pre-152 convention
**What goes wrong:** 161's new comments (the declared table list wants explanation; so does a fixed `E2E_PROJECT_ID`) reference plan numbers or planning paths and fail 152's committed scan — which is a **`lint:check` link by then**.
**Why it happens:** almost every comment quoted in this document (`tests/playwright.config.ts`, `base.setup.ts`, `supabaseDataProvider.ts`) is written in the *old* style with `see phase NNN` references. Those are 152's to purge; 161 must not add more.
**How to avoid:** D-N1. No planning-artifact paths, phase/plan numbers, decision ids, or historical narrative in any comment 161 writes.

---

## Code Examples

### Reading public env (the only supported path)
```ts
// Source: apps/frontend/src/lib/utils/constants.ts:1-15 (verbatim, abridged)
import { env } from '$env/dynamic/public';

export const constants = {
  PUBLIC_SUPABASE_URL: env.PUBLIC_SUPABASE_URL ?? '',
  PUBLIC_SUPABASE_ANON_KEY: env.PUBLIC_SUPABASE_ANON_KEY ?? ''
};
```

### Reading the repo-root `.env` for a named prefix (the existing precedent to extend)
```ts
// Source: apps/frontend/vite.config.ts:12-18 (verbatim)
export default defineConfig(({ mode }) => {
  // The prefix is the literal variable name: `FRONTEND_PORT` carries no `VITE_` prefix, so Vite's
  // default prefix would match nothing, and the empty-string prefix would pull in every entry of a
  // secrets file. `loadEnv` overlays `process.env` AFTER the parsed file, so a one-off shell prefix
  // (`FRONTEND_PORT=5273 yarn dev`) still overrides a persistent value in the root `.env`.
  const env = loadEnv(mode, repoRoot, 'FRONTEND_PORT');
```

### The unscoped read that criterion 2 must convert (representative)
```ts
// Source: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:139-148 (verbatim)
let query = this.supabase
  .from('elections')
  .select('*, election_constituency_groups(constituency_group_id)')
  .order('sort_order');

if (options?.id) {
  query = Array.isArray(options.id) ? query.in('id', options.id) : query.eq('id', options.id);
}
```

### The dynamic-table site that defeats every literal matcher
```ts
// Source: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:459-471 (verbatim, abridged)
const types: Array<{ table: 'candidates' | 'organizations'; entityType: string }> = [];
…
for (const { table, entityType } of types) {
  let query = this.supabase.from(table).select('*').order('sort_order');
```

### The storage `.from()` that is not a table
```ts
// Source: apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:297-299 (verbatim, abridged)
const storagePath = `${projectId}/candidates/${id}/${crypto.randomUUID()}.${ext}`;
…
  .from('public-assets')
```

### The RPC that returns every project's nominations
```sql
-- Source: apps/supabase/supabase/schema/503-entity-rpcs.sql:79-81 (verbatim)
  WHERE (p_election_id IS NULL OR n.election_id = p_election_id)
    AND (p_constituency_id IS NULL OR n.constituency_id = p_constituency_id)
    AND (p_include_unconfirmed OR NOT COALESCE(n.unconfirmed, false))
```

### The already-scoped test-side query layer
```ts
// Source: tests/tests/utils/supabaseAdminClient.ts:195-197 (verbatim)
query(collection: string) {
  const tableName = resolveCollectionName(collection);
  return this.client.from(tableName).select('*').eq('project_id', this.projectId);
}
```

```ts
// Source: packages/dev-seed/src/supabaseAdminClient.ts:141-145 (verbatim, abridged)
constructor(url?: string, serviceRoleKey?: string, projectId?: string) {
  …
  this.projectId = projectId ?? TEST_PROJECT_ID;
```

### The preflight the project creation must sit behind
```ts
// Source: tests/global-setup.ts:52 (verbatim)
  await assertServedApp({ baseURL, repoRoot, deadlineMs });
```

---

## State of the Art

| Old approach (today) | Current approach (after 161) | Impact |
|--------------------|------------------------------|--------|
| One project per database; "the test project" **is** the default project (`TEST_PROJECT_ID === DEFAULT_SEED_PROJECT_ID === '00000000-…-0001'`) | Two projects; the suite owns one | Contamination becomes structurally impossible rather than swept |
| Isolation by `external_id` prefix inside one project | Prefix isolation **within** the E2E project, project isolation **between** the suite and everything else | `BASELINE_SEED_PREFIX` becomes dead; the freshness probe becomes affordable to make strict |
| The writers *derive* their project id by extra `SELECT project_id` round-trips (6 of them) | One resolved value on the mixin | 6 fewer queries; three `limit(1).single()` single-project bugs closed |
| `yarn db:reset` as an E2E precondition | `yarn dev` (with one env token) as the only precondition | ~40 s and 0.5–1 GiB of disk per run reclaimed |
| Project scoping "relies entirely on RLS", which for `anon` is `published = true` only | Adapter-level `.eq('project_id', …)` with a static guard; RLS retained as depth | The failure mode moves from *silently empty* to *loudly refused* — D-J1's decisive argument |

**Deprecated/outdated by this phase:**
- `BASELINE_SEED_PREFIX` (`setupFromTemplate.ts:77`) — its stated reason evaporates.
- `E2E_REQUIRE_FRESH_DB`'s opt-in polarity — see § 5.3.
- The `feedbackWriter` docblock's *"single-project deploy"* premise (`supabaseFeedbackWriter.ts:9-11`) — becomes false the moment the E2E project exists.
- `identity-callback/index.ts:31`'s `DEFAULT_SEED_PROJECT_ID` — criterion 1's named target.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit framework | vitest (catalog `^3.2.4`, `.yarnrc.yml`) — per-workspace `vitest.config.ts` |
| E2E framework | `@playwright/test` (catalog `^1.58.2`), config `tests/playwright.config.ts` |
| SQL framework | pgTAP via `supabase test db` (`apps/supabase/supabase/tests/`) |
| Quick run (unit) | `yarn workspace @openvaa/frontend test:unit` · `yarn workspace @openvaa/dev-seed test:unit` |
| Full unit suite | `yarn test:unit` (= `yarn assert:unit-coverage && turbo run test:unit`) — **⚠ leaves the `default` template in the live DB; never run it between the two proof runs** |
| Full E2E suite | `yarn test:e2e` (= `assert:i18n-catalog-namespaces && assert:a11y-scan-wiring && playwright test … --grep-invert @probe`) |
| Evidence-producing E2E run | `tests/scripts/e2e-run.sh --run-dir <path>` (+ the new `--no-db-reset`) |
| Lint gate | `yarn lint:check` — 6 links today, 8–9 by the time 161 lands |

### Phase Requirements → Test Map

| Criterion | Behaviour | Test type | Automated command | File exists? |
|-----------|-----------|-----------|-------------------|--------------|
| **1** | `PUBLIC_PROJECT_ID` exists and is documented | unit (repo-meta) | `node -e "const s=require('fs').readFileSync('.env.example','utf8'); process.exit(/^PUBLIC_PROJECT_ID=/m.test(s)?0:1)"` | ❌ Wave 0 |
| **1** | The variable actually reaches the running app | integration | start `yarn dev`, then `curl` a page and assert the served project's data — or a vitest over `loadEnv(apps/frontend,'')` asserting the key resolves | ❌ Wave 0 — **this is the criterion's real test**, not the grep above |
| **1** | `DEFAULT_SEED_PROJECT_ID` no longer supplies a silent fallback | unit (source grep) | `! grep -q "DEFAULT_SEED_PROJECT_ID" apps/supabase/supabase/functions/identity-callback/index.ts` | ❌ Wave 0 |
| **2** | An unscoped `.from(<scoped table>)` in the adapter fails the gate | guard + flip | `node scripts/assert-project-scoped-queries.mjs` → 0; then **inject** an unscoped `.from('elections')`, expect exit 1 naming the `file:line`; revert, expect 0 | ❌ Wave 0 |
| **2** | The guard is a blocking link of `lint:check` | unit (repo-meta) | `node -e "const s=require('./package.json').scripts; process.exit(s['lint:check'].split('&&').map(x=>x.trim()).includes('yarn assert:project-scoped-queries')?0:1)"` — **membership, never position** | ❌ Wave 0 (sibling of `ciTypecheckGate.test.ts`) |
| **2** | The guard does not skip a non-literal table argument | guard self-test | fixture pair under `scripts/fixtures/` (152-01's `--self-test` / `--emit-fixtures` pattern) | ❌ Wave 0 |
| **2** | `get_nominations` refuses to return cross-project rows | pgTAP | `supabase test db` — seed two projects, call with project A's id, assert zero project-B rows | ❌ Wave 0 |
| **2** | The adapter's scoped reads return only the configured project | unit (vitest, mocked client) | `yarn workspace @openvaa/frontend test:unit` — extend `supabaseDataProvider.test.ts` (1696 lines) to assert `.eq('project_id', …)` on all 9 sites | ⚠ file exists, cases do not |
| **3** | The E2E project is created idempotently | unit | dev-seed vitest over `ensureProject()` — call twice, assert one row | ❌ Wave 0 |
| **3** | **`yarn test:e2e` green twice in a row with no intervening reset** | **E2E, full suite ×2** | **`tests/scripts/e2e-run.sh --run-dir …/161-twice-run1` then `… --run-dir …/161-twice-run2 --no-db-reset`** — both must report `failed:0, didNotRun:0, flaky:0` and `preflight-fail: 0`. **These two runs ARE the validation of criterion 3; nothing narrower discharges it.** | ✅ harness exists; needs `--no-db-reset` |
| **3** | `test:unit` residue is invisible to the suite | E2E, deliberate contamination + **negative control** | § 7.4 — seed the contamination, run green; then reproduce the Phase-144 red on the unscoped path | ❌ Wave 0 |
| **4** | No live doc states `db:reset` as an E2E precondition | unit (repo-meta grep) | a class grep over `CLAUDE.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md` asserting `db:reset` appears only in command-map / non-precondition contexts | ❌ Wave 0 |

### Sampling rate

- **Per task commit:** the touched workspace's `test:unit` + `node scripts/assert-project-scoped-queries.mjs` (sub-second).
- **Per wave merge:** `yarn lint:check` + `yarn test:unit` + `yarn build`. **Note:** `yarn test:unit` contaminates the default project (§ 5.2) — harmless mid-development, but it must not run between the two proof runs.
- **Phase gate:** `yarn db:reset` → full suite (run A) → **no reset** → full suite (run B) → both green → `/gsd-verify-work`.

### Wave 0 gaps

- [ ] `scripts/assert-project-scoped-queries.mjs` + `scripts/fixtures/assert-project-scoped-queries.*` (guard + self-test fixtures) — criterion 2
- [ ] `packages/dev-seed/tests/projectScopingGate.test.ts` — `lint:check` chain-membership spec, criterion 2
- [ ] `tests/scripts/e2e-run.sh --no-db-reset` — criterion 3's evidence path
- [ ] `ensureProject()` unit coverage in `packages/dev-seed/tests/` — criterion 3
- [ ] pgTAP coverage for `get_nominations(p_project_id, …)` under two projects — criterion 2
- [ ] Extension of `supabaseDataProvider.test.ts` to assert the project filter on all 9 query sites — criterion 2
- [ ] A repo-meta doc-grep spec — criterion 4
- [ ] Framework install: **none needed** — vitest, Playwright and pgTAP are all present

---

## Security Domain

`security_enforcement` is not set to `false` in `.planning/config.json` (the file has no such key), so the section applies.

### Applicable ASVS categories

| ASVS category | Applies | Standard control (in this repo) |
|---------------|---------|-----------------|
| V1 Architecture | yes | Single-project-per-deployment is the stated architecture; this phase makes it explicit and enforced |
| V2 Authentication | partly | Untouched by 161 — `identity-callback` auth is 155's; 161 touches only the project-id branch |
| V3 Session Management | no | Unchanged |
| **V4 Access Control** | **yes — the core of the phase** | Two independent layers: RLS (`302-rls.sql`, 80 policies, `can_access_project()`) as depth, and the adapter's `.eq('project_id', …)` as the loud guard. D-J1 records why RLS alone is insufficient: it returns *empty results* rather than failing |
| V5 Input Validation | yes | The Edge Function's caller-supplied `project_id` (§ 1.5) is unvalidated |
| V6 Cryptography | no | Nothing hand-rolled; no change |
| V7 Error handling / logging | yes | The new fail-fast throws must name the missing variable without leaking the value of secrets; `identity-callback` already has a documented error-oracle discipline (`:204-207`) to imitate |
| V14 Configuration | yes | `PUBLIC_` vs. private prefix, `.env.example`, Edge-Function secrets wiring |

### Known threat patterns

| Pattern | STRIDE | Standard mitigation | Status here |
|---|---|---|---|
| **Cross-tenant data leak via an unscoped read** | Information disclosure | Explicit `project_id` predicate at the adapter, plus RLS | **Live today**: `dataProvider/` has 0 `project_id` references and `anon_select_*` is `published = true` only. This is what criterion 2 fixes. |
| **Cross-tenant leak via an RPC that bypasses the adapter filter** | Information disclosure | Project parameter inside the SQL body | **Live today**: `get_nominations` with `NULL, NULL` returns every project's nominations (§ 2.3), and that is the app's default call shape |
| **Unauthenticated project injection into a `--no-verify-jwt` function** | Tampering / Spoofing | Validate caller-supplied ids against server-side configuration | **Live today**: `identity-callback` accepts `project_id` from the request body unvalidated (`:186-197`) and is anon-reachable by its own docblock (`:204-207`). The frontend does not send it (`preregister/+server.ts:16-17`), so today the field is purely an attacker affordance. **Recommend fixing in 161** (validate `project_id === configured id`, else 400) or filing per D-N2. |
| **Fail-open on missing configuration** | Elevation / Tampering | Throw, never default | `identity-callback:197`'s `\|\|` chain is 155's to fix; `:31`'s constant is 161's. The new frontend resolution must **throw**, not `?? ''` |
| **Widening the public env surface** | Information disclosure | Keep `publicPrefix: 'PUBLIC_'`; never set it to `''` | § 1.7 route (P2) would expose `IDENTITY_PROVIDER_CLIENT_SECRET` / `IDURA_SIGNING_JWKS` / `LLM_OPENAI_API_KEY` to `$env/dynamic/private` (a widening, not a browser leak) — **out of scope; do not fold in** |
| **Mass-delete via an over-broad teardown** | Denial of service | The existing ≥2-char prefix guard (`assertTeardownPrefix`) + project scoping | Already mitigated; project scoping narrows it further |

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | Vite's `loadEnv(dir, '')` merges **all** of `process.env` (not only file contents), which is why a shell prefix works | § 1.2, § 4.5 | Low — the behaviour was **executed and observed** (`PUBLIC_PROJECT_ID=deadbeef` → `"deadbeef"`); only the *general rule* is inferred from that single observation |
| A2 | CI's frontend does not receive the root `.env`'s `PUBLIC_*` values, because `apps/frontend/.env` is gitignored and never created on a runner | § 8.2 | **Medium–high.** The mechanism is measured; the conclusion about CI is not. If true it is a separate live defect and makes § 1.7 (P1) mandatory. **The planner must check a recent green `e2e-tests` workflow run before relying on either branch.** |
| A3 | Re-pointing the admin client's `projectId` will not move any exact-count assertion, because the seed writes into the same project the assertions read | § 5.3 | Medium — the twice-in-a-row proof is what tests it. If counts move, expect it in `voter-journey` first (the base-setup comment names it) |
| A4 | Supabase CLI supplies Edge-Function env locally via `[edge_runtime.secrets]` in `config.toml` and/or a `supabase/functions/.env`; neither exists here | § 1.4 | Medium — the *absence* of both files is measured; the claim about which mechanism the installed CLI (v2.83.0, per `147-reach14-suite/db-reset.log`) honours is from training knowledge and **must be checked against the CLI's docs at planning time** |
| A5 | The `e2e-tests` CI job would need no change beyond idempotent creation | § 8.2 | Low, conditional on A2 |
| A6 | Phase 155 will land before 161 and will have made `identity-callback:197` throw | § 1.4, D-D3 | Low — but 155 has **no PLAN.md** yet (CONTEXT only), so the planner must **verify the line's actual state at planning time**, as D-D3 already instructs |
| A7 | Phase 157's `get_questions` RPC will exist before 161 and will need a project parameter | § 2.3 | Medium — 157 also has no PLAN.md. If it slips, 161 inherits nothing and the guard's RPC list simply omits it |
| A8 | Recommending `PUBLIC_PROJECT_ID` for the Deno function creates no operational problem (Supabase secrets accept the name) | § 1.6 option A | Low; option B is the zero-risk fallback |

---

## Open Questions

1. **Does the CI `e2e-tests` job actually receive `PUBLIC_SUPABASE_URL`?** (A2)
   - What we know: `cp .env.example .env` writes the **root** file; the frontend reads `apps/frontend/.env`, which is gitignored; measured `loadEnv` from `apps/frontend` on this machine yields only two keys, both from the untracked local file.
   - What's unclear: how CI's E2E suite passes with an empty `PUBLIC_SUPABASE_URL`.
   - Recommendation: **planner opens a recent green `e2e-tests` run before writing tasks.** If CI is genuinely affected, § 1.7 (P1) is mandatory and a separate todo is owed per D-N2.

2. **Which `.env` file is the project id's home?** — Follows directly from (1). Criterion 1 names `.env.example` (root); the runtime reads the workspace file. **Planner must decide**, per § 1.7's option table. This is the single most consequential open item in the phase.

3. **One name or two?** (O-2) — § 1.6 recommends one (`PUBLIC_PROJECT_ID` everywhere) and supplies the two-name fallback with its in-tree precedent. **The planner must pick and record it**, and must record the deviation from criterion 1's literal `PROJECT_ID`.

4. **Who wires the Edge-Function env?** (§ 1.4) — 155 arms the throw; nobody has claimed the wiring. Options: 161 claims it; 161 files it per D-N2 and flags it to 155; or 155's plan is amended. **Planner must decide**, and should note the blast radius is limited to the opt-in bank-auth projects.

5. **Does `get_questions` (Phase 157) exist yet, and what is its signature?** (A7) — read at planning time; the guard's declared RPC list must name it or explicitly not.

6. **Does 161 fix the Edge Function's unvalidated caller-supplied `project_id`?** (§ 1.5) — a genuine, live, unauthenticated-reachable weakness sitting in a file the phase already opens. Cheap to fix (one equality check); adjacent to 155's surface. **Planner must decide** in-scope vs. filed.

7. **How strict does the freshness probe become, and when?** (O-4) — § 5.3 recommends re-aim now, promote after the proof. **Planner must state the sequencing**, because promoting early risks converting recoverable cross-family residue into a refusal to start.

8. **Teardown posture** — D-J2 requires the choice be **stated**. § 3.4 recommends "leave the project row; tear down only its content", which moots O-1. **Planner must record it explicitly in the plan**, not leave it implied.

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | local Supabase | ✓ | images 15.26 GB / 28, 24 containers running `[VERIFIED: docker system df]` | none |
| Supabase CLI | `supabase start` / `db reset` / `test db` | ✓ | **v2.83.0** installed; v2.116.0 available `[VERIFIED: tests/e2e-runs/147-reach14-suite/db-reset.log — "A new version of Supabase CLI is available: v2.116.0 (currently installed v2.83.0)"]` | none — **do not upgrade mid-phase**; a CLI bump changes `config.toml` semantics |
| Node | everything | ✓ | ≥22 required (`package.json:74-78` — note it is misspelled `engine`, which is Phase 153 criterion 2) | none |
| Yarn | everything | ✓ | 4.13.0 (`packageManager`, `.yarnrc.yml` `yarnPath`) | none |
| Playwright browsers | E2E | ✓ (last full suite ran 2026-08-27) | `@playwright/test` catalog `^1.58.2` | none |
| **Free disk** | the twice-in-a-row proof | ⚠ **23 GiB / 926 GiB, 98% capacity** `[VERIFIED: df -h .]` | — | reclaim from the Docker layer (host-level; agent cannot) — **not** by deleting `tests/e2e-runs/` |
| Edge-Function env (`DEFAULT_PROJECT_ID`) | `identity-callback` after 155 | ✗ | — | opt-in bank-auth only; § 1.4 |
| `apps/frontend/.env` on CI | frontend public env in CI | ✗ (gitignored, never created) | — | § 8.2 / A2 — unresolved |

**Missing dependencies with no fallback:** none that block planning.
**Missing dependencies with fallback:** disk headroom (reclaim from Docker before the gate); Edge-Function env (scoped to opt-in projects).

---

## Sources

### Primary (HIGH confidence — opened in this session, or executed)

Source files read in full or in the cited ranges:
- `apps/frontend/src/lib/utils/constants.ts` · `apps/frontend/vite.config.ts` · `apps/frontend/svelte.config.js` · `apps/frontend/package.json` · `apps/frontend/src/hooks.server.ts`
- `apps/frontend/src/lib/api/adapters/supabase/{supabaseAdapter.ts, supabaseAdapter.type.ts}` · `dataProvider/supabaseDataProvider.ts` · `feedbackWriter/supabaseFeedbackWriter.ts` · all four `index.ts` barrels · `src/lib/api/base/{universalAdapter.ts, universalAdapter.type.ts}` · `src/routes/api/candidate/preregister/+server.ts`
- `apps/supabase/supabase/{seed.sql, config.toml, .gitignore}` · `schema/{100-tenancy.sql, 106-app-settings.sql, 302-rls.sql (excerpt), 503-entity-rpcs.sql, 504-admin-rpcs.sql (excerpt), 300-auth-tables.sql (excerpt), 501-bulk-operations.sql (excerpt)}` · `functions/identity-callback/index.ts` (`:1-60, :190-215, :355-370`)
- `packages/dev-seed/src/{supabaseAdminClient.ts, writer.ts, ctx.ts, index.ts, cli/teardown.ts}` · `packages/shared-config/eslint.config.mjs`
- `tests/{playwright.config.ts, global-setup.ts, README.md, scripts/e2e-run.sh}` · `tests/tests/setup/shared/{setupFromTemplate.ts, base.setup.ts, base.teardown.ts}` · `tests/tests/utils/supabaseAdminClient.ts`
- `package.json` · `.github/workflows/main.yaml` (`:106-305`) · `.yarnrc.yml` (via `git show`) · `.env.example` and `apps/frontend/.env.example` (via `git show HEAD:…`)
- `node_modules/@sveltejs/kit/src/core/config/options.js` · `node_modules/@sveltejs/kit/src/exports/vite/utils.js:71`

Commands executed this session (results quoted inline):
- `yarn workspace @openvaa/frontend node -e "…"` — cwd and process.env probe
- `node -e "loadEnv(...)"` from `apps/frontend`, twice (frontend dir vs. repo root; then with a shell prefix)
- `df -h .` · `docker system df` · `find`/`grep`/`wc` census commands throughout

Planning artefacts read:
- `.planning/phases/161-…/161-CONTEXT.md` (full) · `.planning/ROADMAP.md` Phases 152–162 · `.planning/REQUIREMENTS.md:83-168, :313-343, :160-200` · `.planning/config.json`
- `.planning/phases/152-…/152-01-PLAN.md`, `152-03-PLAN.md` (chain excerpts) · `153-01/02/03-PLAN.md` (chain excerpts) · `.planning/phases/156-…/156-CONTEXT.md` (decision index, § N, D-F3) · `.planning/phases/157-…/` (dir listing)
- `.planning/todos/pending/{frontend-project-id-scoping.md, 2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md, 2026-08-27-147-full-suite-disk-headroom-falling.md}` (full)
- `tests/e2e-runs/147-reach14-suite/{summary.json, provenance.txt, exit, db-reset.log}`

### Secondary (MEDIUM confidence)

- Vite `loadEnv` prefix semantics — inferred from the executed observation plus the in-tree comment at `apps/frontend/vite.config.ts:13-17` that documents the same mechanism.

### Tertiary (LOW confidence — flagged, not relied on)

- Supabase CLI's Edge-Function env mechanism for `supabase start` (A4) — training knowledge; the file-absence facts are measured, the mechanism claim is not.
- The CI-env conclusion (A2) — mechanism measured, conclusion inferred, **explicitly flagged for the planner to check**.

No external web search was performed: every question this phase raises was answerable from the tree, and the two remaining unknowns (A2, A4) are answerable only by inspecting a CI run and the installed CLI's own docs — neither of which a search would settle authoritatively.

---

## Metadata

**Confidence breakdown:**
- **Env resolution (§ 1):** HIGH — verified against SvelteKit's own source and confirmed by three executed measurements.
- **Guard feasibility (§ 2):** HIGH on the call-shape census (every site opened); MEDIUM on the recommendation to invert the predicate, which is an engineering judgement the planner may overrule (with the AST-guard consequence recorded).
- **`app_settings` / 156 status (§ 3):** HIGH — the FK asymmetry is confirmed in two trees, and 156's silence on it is a measured absence across its CONTEXT.md, its roadmap criteria and its decision index.
- **E2E lifecycle (§ 4):** HIGH on what exists (every helper opened); MEDIUM on the delivery-route recommendation, which depends on the unresolved CI question.
- **Freshness probe (§ 5):** MEDIUM — the mechanism is measured; the "no counts move" claim is inferred and is what the proof runs test.
- **Work map (§ 6):** HIGH — every file and line count grepped or opened.
- **Twice-in-a-row cost (§ 7):** HIGH — 150/150 in 10.7 min and 23 GiB free are both measured; `e2e-run.sh`'s unconditional reset is read from the source.
- **Doc surface (§ 8):** HIGH — full sweep executed; two sites added beyond F11.

**Research date:** 2026-08-28
**Valid until:** ~2026-09-11 (14 days) — shorter than the usual 30 because Phases 152, 153, 155, 156 and 157 all land before 161 and each changes something this document measures: the `lint:check` chain (152, 153), `identity-callback:197` (155), the `party`→`organization` rename and RPC surface (156), and the `get_questions` RPC (157). **Re-verify the `lint:check` value, the `identity-callback` line, the scoped-table names and the RPC list at planning time.**
