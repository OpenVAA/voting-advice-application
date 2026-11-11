# Phase 184: Hosted Supabase Measurement and Conformance Probe - Research

**Researched:** 2026-10-26
**Domain:** Hosted Supabase operations (CLI push/link/deploy, Management API, Terraform supabase provider 1.11.0, Edge Function SMTP, PostgREST/GoTrue behaviour) and a Node conformance probe
**Confidence:** MEDIUM overall. The repository facts are HIGH (read this session, cited with lines). The CLI connection logic is HIGH (read from the v2.118.0 source). Hosted behaviour is MEDIUM or LOW by nature: it is what this phase measures.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### A — Order and targets

- **D-01 (A-01):** **Throwaway first, every step.** Push, deploy the functions, set the secrets, bootstrap,
  enable SMTP, run the drift check and measure everything on `suxeqyhafjueinxnojge`. Then repeat the same
  commands, unchanged, on the persistent project `cofbsatfrdysyphajsky`. The persistent project gets one clean
  pass. The throwaway is then broken on purpose for the probe's red run (D-17). — **Reversibility:** one-way —
  the persistent project cannot be recreated, so a surprise in its first push cannot be undone. That is why
  the throwaway goes first.
- **D-02 (A-02):** SUPA-01's "one command" is a committed wrapper, `infra/scripts/push-migrations.sh`. It checks
  that the work directory is linked to the ref it is given. It shows `supabase db push --linked --dry-run`
  first, then runs the push and reads the exit status directly, never through a pipe. Then it runs
  `check-drift.sh --target linked`. A second run must print "up to date" and exit 0. Functions, secrets and the
  bootstrap keep their own commands, and the runbook orders them in the PIPE-06 order. Phase 187 owns the
  automated deploy order.
- **D-03 (A-03):** The database connection from the operator's workstation: try the direct connection first and
  record whether it works. If it fails, use the **session-mode** pooler (port 5432) for the push, the
  bootstrap, the drift check and the probe's catalog reads, and record that. The transaction-mode pooler (6543)
  is never used, because it breaks the session settings that `bootstrap.sql` relies on. The IPv4 add-on is not
  bought.

### B — Functions, secrets and mail

- **D-04 (B-01):** `identity-callback` is deployed with `verify_jwt = false` (as declared), with
  `PUBLIC_PROJECT_ID` and `SITE_URL` set and no `IDENTITY_PROVIDER_*` secret. The probe checks that it is
  served and that it refuses a call. Research first confirms that the function fails closed when its provider
  variables are unset. If it does not, that becomes a finding and a fix in this phase. Bank authentication on
  staging stays excluded (A4).
- **D-05 (B-02):** SUPA-14's port is measured with the real `account-access` function on the throwaway project.
  Set `SMTP_PORT=2587` and ask for one link mail to the operator's mailbox, which is verified for the SES
  sandbox (183-19). If no mail arrives, try 587, then 465, then 25. The first port that delivers is written into
  the function secrets and into the Auth `smtp` object of both roots. The failed attempts also serve as the
  OBS-05 "slot released after a failed send" observation.
- **D-06 (B-03):** The DKIM, SPF and DMARC result is read from the operator's mailbox. The operator pastes the
  `Authentication-Results` header (and `Received-SPF` if their provider adds it) of that mail into the evidence
  file. This is a manual operator step, recorded with its date. No external mail tester is used.
- **D-07 (B-04):** Auth's own SMTP setting (SUPA-02) is applied anyway, with the measured port and the same SES
  user, and read back. Without it, a hook that is switched off later would fall back to Supabase's built-in
  mailer. This also resolves the 183 blocker that the first SMTP enablement has never been tried.

### C — Bootstrap, gateway and keys

- **D-08 (C-01):** `behind_cloudflare` is measured first. On the throwaway project, record which forwarded
  headers reach an Edge Function and a PostgREST request (D-19), including whether a `cf-connecting-ip` sent by
  the client is overwritten. Set `BOOTSTRAP_BEHIND_CLOUDFLARE` from that record, and only then bootstrap the
  persistent project.
- **D-09 (C-02):** OBS-03 is measured first. If the gateway refuses a call with the anon key and no user token,
  or if only the legacy JWT shape of the anon key lets it through, declare `verify_jwt = false` for
  `account-access` in `apps/supabase/supabase/config.toml`. The function already makes its own checks, and this
  keeps working when FUT-02 brings publishable keys. The parity guard's table gains the key. The frontend does
  not start sending the anon key as `Authorization: Bearer`. — **Reversibility:** reversible — a single
  `config.toml` entry and a parity-table row.
- **D-10 (C-03):** Before the bootstrap, run the seven `SHOW`s (the list in the 181-11 blocker in STATE.md) on
  each project and record them. Run the bootstrap only if none of them would log a successful or slow
  statement's parameters. Otherwise stop at a checkpoint with the values, and the operator decides. Rotating the
  service-role key afterwards is not the fallback, because rotating a legacy JWT key means rotating the JWT
  secret, which signs every key and session.
- **D-11 (C-04):** The signed-in token check of criterion 2: on the persistent project, create the **first
  administrator** by the documented one-off step, which 185 and 186 need anyway. Sign in with a password over
  `/auth/v1/token` and decode the claims the access-token hook adds. The address is the operator's own; the
  password comes from the operator's password manager and is never written down. On the throwaway project,
  create a disposable user for the same check. Sign-up is off, so users are created with the admin API.
- **D-12 (C-05, ticked):** Record which keys the project issues, the dashboard's state of the legacy keys and any
  retirement date shown. If the legacy keys work for every call shape, stay on them (C5) and add the date to
  the FUT-02 todo. If they **do not** exist or do not work, stop at a checkpoint: pulling FUT-02 forward is a
  scope change for the operator to rule on. Publishable keys are not adopted now.
  - **Operator note:** "Add the todo to be executed immediately after the streams are merged." The todo already
    exists as `.planning/todos/pending/2026-10-11-migrate-to-supabase-publishable-keys-after-streams-merge.md`
    and is queued as the first work after v2.16 and v2.17 merge. This phase appends the observed key model and
    any retirement date to that todo. It does not create a second one. If the observed date falls before the
    merge can happen, raise that at the checkpoint.

### D — The conformance probe (SUPA-07)

- **D-13 (D-01):** The probe is a Node script, `infra/scripts/probe-hosted.mjs`, using Node built-ins only
  (`fetch`, `child_process` for `psql`), as the parity guard does (183 D-14). Each check has a stable name and
  prints `PASS <name>` or `FAIL <name>: <finding>`. The exit status is 0 only when every check passes, 1 on any
  failure and 2 when it could not run. A Vitest spec covers the comparison logic against recorded responses.
- **D-14 (D-02):** The probe reads three sources:
  - the Management API with `SUPABASE_ACCESS_TOKEN`: settings, `max_rows`, the oauth flags, the functions list
    and their `verify_jwt`, and the key model;
  - the public API with the anon key only: `/auth/v1/settings`, a PostgREST read of more than 1000 rows, the
    8 s timeout, and the functions served;
  - the catalog over psql as a read-only role: the buckets, both hook functions, the Postgres major version,
    and `check-seed.sql`.

  It **never** takes the service-role key.
- **D-15 (D-03):** The probe includes: the settings of criterion 2, the oauth flags (`oauth_server_enabled`,
  `oauth_server_allow_dynamic_registration`), both buckets, all three functions served (with
  `identity-callback` unverified), both hooks' functions present, more than 1000 rows read whole, the `anon`
  timeout, Postgres major 17, and the seed check, which runs as a subprocess and is named `no-seed`. The drift
  check stays a separate step after the push, because it needs Docker for a shadow database.
- **D-16 (D-04):** The expected values come from the same files the parity guard reads:
  `infra/modules/supabase/hosted-settings.json`, the tfvars of the target root (site URL, redirect entries) and
  `staticSettings.dataAdapter.pageSize`. The probe has no table of expected values of its own (SUPA-11).
- **D-17 (D-05):** Every check is seen failing with **one batched break** on the throwaway project. All the
  planted faults go in together: settings through a scratch-root apply with overridden values, one bucket
  dropped, one function deleted, a seed-shaped user inserted, and `max_rows` lowered. One probe run must then
  show **every** check as `FAIL`, each with a finding that matches its planted fault and not a cascade such as
  "unreachable". Then the faults are reverted and a green run follows. That is one operator apply for the break
  and one for the revert.
- **D-18 (D-06):** The more-than-1000-rows read on the persistent project: seed the E1 smoke dataset once in
  **this** phase, from the operator's shell with dev-seed, and reuse it in 185 (OBS-08) and 186. Research first
  confirms a template that creates more than 1000 anon-readable rows and **no** auth users, so that `no-seed`
  stays green. If none exists, planning adds a template option rather than relaxing the seed check.
  — **Reversibility:** costly — the dataset sits on the persistent project and 185 and 186 build on it, so
  removing it means a teardown and reseeding there.
- **D-19 (D-07):** The header record that feeds OBS-04 and OBS-10 is made on the **throwaway** only. It uses a
  temporary echo Edge Function and a temporary SQL function that returns `current_setting('request.headers')`.
  Both are created by hand and never committed to `migrations/`, which is append-only since the freeze. Each is
  called with and without a spoofed `x-forwarded-for` and `cf-connecting-ip`. The record is written with its
  date, and both are removed before the probe's green run. The gateway is the platform's, so the throwaway
  stands for the persistent project. The frontend container's side stays in 185.

### E — Records and carry-overs

- **D-20 (E-01):** Raw evidence goes in `184-*/evidence/184-NN-*.md`, as in 183. Each settled observation gets
  one dated row in an **"Observed"** table in `infra/envs/staging/supabase/README.md`, next to its existing "Not
  yet observed" table, and the row moves from one table to the other. Phase 189 writes the documentation from
  that table.
- **D-21 (E-02):** TR-183-01, TR-183-02, AR-183-01 and AR-183-02 (the GitHub OIDC roles' workflow pin, the
  staging Environment's branch policy and numeric id claims, the `ReadOnlyAccess` remainder and the plan role's
  lock write) are re-transferred to **phase 187**, where the workflows exist and the fix can be seen working. The
  re-transfer is recorded in `183-SECURITY.md` with its date.
- **D-22 (E-03):** Before a green drift result is trusted, plant one DDL change on the **throwaway** and see
  `check-drift.sh --target linked` exit 1. Then record whether the default schema set is empty on a clean
  hosted database. If it is not, narrow the set in the script, with that output as evidence. Also add a check
  that the `PG*` connection points at the linked ref. Remove the 51 MB shadow-baseline cache after the run.
  This closes the 181-12 blocker.
- **D-23 (E-04):** The operator deletes the throwaway project in the dashboard after the probe's red and green
  runs and the header record, as 183 D-12 says, and the scratch root's local state is removed. Phases 185 to 187
  plant their red controls on the AWS side.
- **D-24 (E-05):** No pending todo is folded. The five keyword matches are frontend or UI work.

### Claude's Discretion

- The plan split and wave order, as long as D-01's order holds (throwaway, then persistent) and every operator
  step (applies, mailbox reads, the first administrator's password, the throwaway's deletion) is a checkpoint.
- The probe's internal module layout, its check names and the shape of the Vitest fixtures.
- The exact wording of rows in the "Observed" table and of the evidence files.

### Deferred Ideas (OUT OF SCOPE)

- The move to publishable keys (FUT-02): first work after v2.16 and v2.17 merge, per the existing todo.
- The four 183 security items: phase 187 (D-21).
- The frontend container's header record (OBS-04 remainder): phase 185.

### Reviewed Todos (not folded)
- Candidate answer store migration, app header styling after the runes update, moving Supabase auth code to the
  adapters, the `tweened` ban and the `.cjs` store guard. Each matched on a keyword only, and each is frontend
  work outside this phase.

**Settled by earlier rulings, not reopened** (CONTEXT `<domain>`): Terraform's `supabase_settings` is the only
writer of settings, and `config push` is used nowhere (C4, 183 D-15). The operator applies, and the agent holds
no credential (183 D-10). Port 2587 is tried first (C6). `open_for_voters` comes from the environment, default
`false` (181-R2). The bootstrap runs as `postgres` over psql (181 D-09). Function code ships with the CLI, and the
secrets go through Terraform's `supabase_edge_function_secrets` (C7, research ARCHITECTURE.md). The throwaway
project is deleted after this phase (183 D-12). Nothing is seeded per run from CI (E1).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUPA-01 | One command applies the schema migrations to the linked project and can be repeated safely | § Item 5 (CLI connection resolution, verified in v2.118.0 source), § Pattern 1 (the wrapper), Pitfalls 1, 2, 3 |
| SUPA-02 | Hosted auth settings by Terraform as the only writer: hook on, site URL, two redirects, sign-up off, confirmation on, SMTP | § Item 4 (Management API reads), § Item 12 (the `smtp` object and the two settings resources), Pitfall 9 |
| SUPA-03 | `max_rows` equal to `dataAdapter.pageSize` | `hosted-settings.json:5` and `staticSettings.ts:17` both 50000; probe check `api.max-rows` |
| SUPA-04 | Two buckets created reproducibly by the migration | baseline `00001_initial_schema.sql:5400-5410`; probe check `storage.buckets`; Pitfall 12 (read path under RLS) |
| SUPA-05 | Three functions deployed, secrets from the operator's environment, `identity-callback` JWT setting declared | § Item 1 (fails closed), § Item 12 (`supabase_edge_function_secrets` schema), § Item 3 |
| SUPA-06 | Idempotent bootstrap, no secret committed, `seed.sql` never on a hosted database, check after deploy | § Item 6 (the seven settings), § Item 2 (dev-seed creates no auth users), `db push` has no seed without `--include-seed` |
| SUPA-07 | A probe that fails by name; each check seen failing once on a broken throwaway | § Pattern 3, § Item 10 (planted-fault matrix), Validation Architecture |
| SUPA-13 | Key model measured and recorded; stay on legacy keys if they work | § Item 4 (`/api-keys`, `/api-keys/legacy`), § Item 3, Pitfall 8 |
| SUPA-14 | Mail through SES from a verified domain with DKIM/SPF/DMARC; port measured and used | § Item 9, Pitfall 4 (587 and 25 documented blocked, 465 cannot work with `secure: false`) |
| OBS-01 | Served auth settings and the dashboard's names of the two switches recorded | § Item 4; operator reads the dashboard (manual) |
| OBS-02 | Redirect allowlist behaviour recorded | § Pattern 6 (GoTrue `IsRedirectURLValid` and glob separators, read from upstream source) |
| OBS-03 | Gateway with anon key and no user token recorded; `account-access` works or is changed | § Item 3; supabase-js already sends `Authorization: Bearer <anon key>` (verified in `node_modules`) |
| OBS-05 | Both refusing branches and slot release seen on a served function | § Item 9 (code paths, log lines, how to provoke each, how to read the slot) |
| OBS-07 | >1000 rows not truncated; `anon` 8 s timeout | § Item 2 (template), § Pattern 7 (row read with `count=exact`), § Item 13 (timeout measurement) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Gate exit statuses are read directly, never through a pipe** (project memory, and D-02). Every wrapper and runbook item writes `echo "x_exit=$?"` right after the command.
- **Comment hygiene** applies to every comment under `apps/`, `packages/`, `tests/`: no historical narrative, no `.planning/` paths, no `D-NN` ids, nothing addressed to the reviewer. `infra/` and `scripts/` are outside the guard's scan roots (`scripts/assert-comment-hygiene.mjs:195`, `SCAN_ROOTS = ['apps', 'packages', 'tests']`) but CLAUDE.md's rule reads as code-wide intent; the `config.toml` comment D-09 adds is under `apps/` and is in scope.
- **Never commit sensitive data** (keys, tokens, `.env`). The agent holds no credential (183 D-10).
- **Use TypeScript strictly / avoid `any`**: the probe is `.mjs` by ruling (Node built-ins only, like the parity guard); its Vitest spec may be `.test.ts`.
- **`yarn lint:check`** must stay green; it chains `assert:hosted-settings-parity`, whose "one writer" rule matches the CLI's configuration-push command in any tracked file under `infra/`, `scripts/`, `apps/supabase/` (Pitfall 13).
- **E2E hard rule**: a failing E2E test blocks completion. This phase touches `config.toml` (D-09) and possibly `packages/dev-seed` (D-18); both reach the local stack, so the final gate includes a full E2E run (Validation Architecture).
- **The shared local stack** (`-infra` and `-gsd` share one stack, project memory): linking `apps/supabase` changes the images that stack starts with (Pitfall 1).
- Every shell command given to the operator wraps at 60 characters with `\` continuations and states the expected output (user's global CLAUDE.md).

## Summary

Most of this phase is measurement, so the research answers two different questions: what the repository already guarantees (read this session, with lines), and how each hosted observation can be made so that its result is unambiguous. Five findings change how the plans should be written:

1. **Linking `apps/supabase` would change the local stack.** The v2.118.0 CLI writes `supabase/.temp/{project-ref,pooler-url,postgres-version,rest-version,gotrue-version,storage-version,...}` at link time, and its config loader then replaces the **local** stack's Postgres, PostgREST, GoTrue, Storage and edge-runtime images with the linked project's versions (`apps/cli-go/pkg/config/config.go:833-855`). This worktree shares its local stack with `-gsd`. The push wrapper should therefore operate on a dedicated linked work directory, not on `apps/supabase` (Pattern 2).
2. **The CLI already does the IPv4 fallback, and never in transaction mode.** `supabase db push --linked` dials `db.<ref>.supabase.co:5432` with a 5 s timeout; if that fails it uses the pooler URL saved at link time with the port forced to **5432** (session mode), with the comment "Supavisor transaction mode does not support prepared statement" (`apps/cli-go/internal/utils/connect.go:103-105`, `flags/db_url.go:132-174`). D-03's rule holds by construction for the CLI; psql (bootstrap, drift history, probe catalog) needs its own PG* choice.
3. **Ports 587 and 25 are documented as blocked from Edge Functions, and 465 cannot work with the code as written.** Supabase's limits page: "Outgoing connections to ports `25` and `587` are not allowed." `account-access` builds its transport with `secure: false` (`index.ts:182`), which is STARTTLS only; SES's 465 is TLS Wrapper. So after 2587, the D-05 fallback order yields failures by construction. If 2587 delivers on the first try, there is no failed attempt for OBS-05, and one deliberate failed attempt must be planned.
4. **The probe's "read-only role" cannot run `check-seed.sql` as written unless it bypasses RLS.** `public.storage_config` has RLS enabled and no policy (`00001_initial_schema.sql:5378-5391`), and `check-seed.sql` reads it. A role without `BYPASSRLS` sees no rows and gets a false "no supabase_url row" finding. `storage.buckets` has the same issue. Which role the probe connects as is an open question for the operator (Open Question 1).
5. **No built-in dev-seed template reaches 1000 rows in one table** (default: 327 candidates, about 370 nominations), and the anon read needs the project **open for voters** (every `anon_select_*` policy calls `project_open_for_voters`, `00001_initial_schema.sql:3680-3692`), which the bootstrap writes `false` by default. dev-seed creates **no auth users**, so `no-seed` stays green. A new template (≥1001 nominations, confirmed) plus an explicit openness decision is needed (Item 2).

Several CONTEXT premises are factually off and are corrected in § Corrections. The most consequential: 183-19 recorded production SES access in `eu-north-1` and **no** mailbox identity, so there is no sandbox to verify against; the "documented one-off step" for the first administrator is documented nowhere; the parity guard does not classify `[functions.*]` tables at all; and the frontend **already** sends the anon key as `Authorization: Bearer` through supabase-js.

**Primary recommendation:** Plan the phase as throwaway sittings, each one operator checkpoint with named output lines. Build the probe first, with its comparison logic under Vitest, so that it can run green and red against the throwaway. Do all CLI work from a dedicated linked work directory. Treat ports, keys, headers, the seven logging settings and the drift schema set as measured inputs that later tasks read from the evidence files.

## Corrections to premises in CONTEXT.md

| Premise | What the tree / sources show | Evidence |
|---|---|---|
| D-05: the operator's mailbox "is verified for the SES sandbox (183-19)" | 183-19 recorded `s2a_production=true` for `eu-north-1`, and "**No mailbox identity was created** for the sandbox". The account is out of the sandbox: any recipient works. The From address is restricted to `noreply@staging.openvaa.org` by the SMTP user's policy | `183-19-ses-identity.md` ("Steps 2 and 3 were skipped"); `infra/modules/mail-ses/smtp.tf:24-25` (`variable = "ses:FromAddress"`, `values = ["${var.sender_local_part}@${var.domain}"]`); `mail-ses/variables.tf` `sender_local_part` default `"noreply"`; `dns-mail/terraform.tfvars:5` `domain = "staging.openvaa.org"` [VERIFIED: read this session] |
| D-11: "the documented one-off step" for the first administrator | Not documented anywhere. `bootstrap.sql:7` says only "It does not create the first administrator. That is a separate, one-off step." The deployment guide's step 5 says to create accounts/projects in the SQL editor and says nothing about an administrator | `infra/scripts/bootstrap.sql:7`; `apps/docs/.../deployment/+page.md:26` [VERIFIED] |
| D-09: "The parity guard's table gains the key" | The guard classifies only `[api]`, `[api.tls]`, `[auth]`, `[auth.*]`. `[functions.*]` is outside its family, so adding a row needs the family widened first | `scripts/assert-hosted-settings-parity.mjs:600-608` (`table === 'api' \|\| table === 'api.tls' \|\| table === 'auth' \|\| table.startsWith('auth.')`) [VERIFIED] |
| D-09: "The frontend does not start sending the anon key as `Authorization: Bearer`" | It already does. supabase-js 2.117.2 sets `apikey` and `Authorization: Bearer <session token ?? supabaseKey>` on every request unless `omitApiKeyAsBearer` is set (it is not set in `apps/frontend/src`) | `node_modules/@supabase/supabase-js/dist/index.mjs:290-304` (`const bearer = realToken ?? (allowKeyAsBearer ? supabaseKey : null)`), `:836-840` (`_getAccessToken` falls back to `this.supabaseKey`) [VERIFIED] |
| D-05 order 2587 → 587 → 465 → 25 | 587 and 25 are blocked by the platform; 465 is TLS Wrapper, which `secure: false` cannot speak | Supabase limits page [CITED: supabase.com/docs/guides/functions/limits]; SES ports [CITED: docs.aws.amazon.com/ses/latest/dg/smtp-connect.html]; `account-access/index.ts:182` `secure: false` [VERIFIED] |
| D-20: an "Observed" table next to "Not yet observed" | The README already has a dated table named **"Observations"** (20 rows, 2026-10-22 and 2026-10-23) right after "Not yet observed". Reuse it rather than adding a third table | `infra/envs/staging/supabase/README.md` headings `## Not yet observed` (line 668), `## Observations` (line 680) [VERIFIED] |
| Scratch root state "is removed" at the end (D-23) | There is **no** `terraform.tfstate` and no `.terraform/` in `infra/envs/scratch/supabase/` of this worktree, and a filesystem search found none elsewhere. The scratch root has **no `import` block**, so a plan against an empty state would plan to **create** a new project | `ls -la infra/envs/scratch/supabase` (6 entries: lock file, main.tf, terraform.tfvars, variables.tf); `scratch/supabase/main.tf` has no `import {}` [VERIFIED]; Pitfall 5 |
| Research flag: "whether the hook can be switched on before its function exists (F2)" | The configuration half is already observed: the hosted API accepted both hooks on a project without their functions (README "Observations", 2026-10-23). What remains unobserved is the runtime effect: a sign-in while the hook's function is absent | README Observations row 2026-10-23 [VERIFIED]; runtime effect [ASSUMED: error at token issue] |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Schema, buckets, hook functions, anon role timeout | Database / Storage (hosted Postgres) | — | Delivered only by `db push` of the frozen baseline |
| Bootstrap rows (account, project, `storage_config`, `behind_cloudflare`) | Database | Operator shell (psql as `postgres`) | No migration can hold a deployment's address and key |
| Auth settings, SMTP, `max_rows`, oauth flags | Platform config (Management API) | Terraform `supabase_settings` | Only writer by ruling C4 |
| Function code and `verify_jwt` | Edge runtime | CLI `functions deploy` reads `config.toml` | `[functions.<name>] verify_jwt` is a deploy-time setting |
| Function secrets | Edge runtime env | Terraform `supabase_edge_function_secrets` | C7 |
| Gateway JWT check, forwarded headers | Platform gateway | — | Not configurable beyond `verify_jwt`; measured only |
| Mail delivery | Edge Function → SES SMTP (2587) | Auth SMTP (read back only) | Send-email hook swallows Auth's own mail |
| Conformance verdict | Operator workstation (Node probe) | Management API, public API, catalog | Reads only; never the service-role key |
| Drift verdict | Operator workstation (Docker shadow DB) | CLI `db diff --linked` | Needs Docker; stays outside the probe (D-15) |

## Standard Stack

No new package is installed. Every tool is already pinned in the tree or on the operator's workstation.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Supabase CLI (`node_modules/.bin/supabase`) | 2.118.0 | `link`, `db push`, `db diff`, `functions deploy/delete/list` | Pinned by the repo; its connection logic was read from the v2.118.0 tag [VERIFIED: `supabase --version` → 2.118.0; `gh api repos/supabase/cli/git/refs/tags/v2.118.0`] |
| Terraform | 1.16.5 | Scratch and staging Supabase roots | `infra/.terraform-version` = `1.16.5` [VERIFIED] |
| supabase/supabase provider | = 1.11.0 | `supabase_settings`, `supabase_edge_function_secrets` | Pinned exactly in every Supabase root (`main.tf:13`) [VERIFIED] |
| psql | 17.6 | Bootstrap (`\bind`, `\getenv` need psql ≥ 16/15), drift history, seed check, probe catalog | [VERIFIED: `psql --version`] |
| Node | 24.21.0 (engines `>=24.15.0`) | The probe (`fetch`, `child_process`) | [VERIFIED] |
| Vitest | `catalog:` (root devDependency) | The probe's comparison-logic spec | Root `package.json:96`; already used by `test:unit:tests` [VERIFIED] |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Docker | 29.7.2 | Shadow DB for `db diff --linked`; function bundling | Drift check, `functions deploy` (unless `--use-api`) |
| jq / curl | 1.7.1 / 8.7.1 | Operator read-backs in the runbook | Runbook items only; the probe uses `fetch` |
| `@openvaa/dev-seed` | workspace | E1 smoke dataset (D-18) | Once per project, from the operator's shell |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| psql catalog reads for buckets | Management API `GET /v1/projects/{ref}/storage/buckets` | Avoids the RLS problem of a read-only role (Pitfall 12); endpoint shape not read this session [ASSUMED] |
| A hand-made read-only DB role | `POST /v1/projects/{ref}/cli/login-role` `{read_only: true}` (ephemeral role + password) | Needs only the access token; marked **experimental** in the API reference [CITED: supabase.com/docs/reference/api/v1-create-login-role] |
| Terraform apply per SMTP port trial | `supabase secrets set SMTP_PORT=…` | Faster, but a second writer of secrets against C7; the provider's digest check would then plan an update |

**Installation:** none.

## Package Legitimacy Audit

This phase installs no external package. The probe uses Node built-ins only (D-13); Vitest and the Supabase CLI are already pinned in the repository.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 operator shell (holds: access token, DB password, SMTP creds, anon key; agent holds none)
   │
   ├─(1) push-migrations.sh <ref> ──► linked workdir (.temp/project-ref == <ref>?) ──► supabase db push --linked
   │        │                                     │   dial db.<ref>.supabase.co:5432 (5 s)
   │        │                                     ├── ok ─────► direct (IPv6)
   │        │                                     └── fail ───► pooler-url, port forced 5432 (session)
   │        └──► check-drift.sh --target linked ──► history (psql PG*) + db diff (Docker shadow at hosted PG version)
   │
   ├─(2) supabase functions deploy (reads config.toml [functions.*] verify_jwt)
   ├─(3) terraform apply (root): supabase_settings{auth,api} → smtp_secret → edge_function_secrets
   ├─(4) psql -X -f bootstrap.sql  ◄── gated by the seven settings (D-10) and behind_cloudflare record (D-08)
   │
   └─(5) probe-hosted.mjs <root>
          ├─ expected: hosted-settings.json, <root>/terraform.tfvars, staticSettings pageSize, config.toml
          ├─ source A: Management API (token) ─ /config/auth, /postgrest, /functions, /api-keys*, /secrets
          ├─ source B: public API (anon key) ── /auth/v1/settings, /rest/v1/<table> count=exact, /functions/v1/*
          ├─ source C: psql (read-only role) ── pg_roles, pg_proc, server_version_num, storage.buckets, check-seed.sql
          ├─ any source unreachable ──► COULD NOT RUN <source>, exit 2 (no per-check FAIL cascade)
          └─ per check: PASS <name> | FAIL <name>: <finding>  ──► exit 0 / 1
```

### Recommended Project Structure
```
infra/
├── scripts/
│   ├── push-migrations.sh        # SUPA-01 wrapper (D-02)
│   ├── probe-hosted.mjs          # entry: argv, source preflight, printing, exit status
│   ├── probe/                    # pure modules, importable by Vitest (no top-level side effects)
│   │   ├── expected.mjs          # reads hosted-settings.json, tfvars, pageSize, config.toml
│   │   ├── checks.mjs            # one comparison function per check name
│   │   └── sources.mjs           # fetch / psql wrappers, redaction
│   ├── probe-hosted.test.ts      # Vitest over checks.mjs with synthetic recorded responses
│   ├── check-drift.sh            # + linked-ref guard (D-22)
│   └── check-seed.sql            # unchanged
├── vitest.config.ts              # include infra/scripts/**/*.test.ts
└── envs/scratch/supabase/faults.tf   # count = var.plant_faults ? 1 : 0 (D-17)
```
`infra/` is not a workspace. A Vitest suite there must be registered in `NON_WORKSPACE_SUITES` (`scripts/assert-unit-test-coverage.mjs:178`, currently `[{ config: 'tests/vitest.config.ts', script: 'test:unit:tests' }]`), get a root script (e.g. `test:unit:infra`) and be chained into the root `test:unit`, or `yarn test:unit` fails Check 3 [VERIFIED: file read].

### Pattern 1: The push wrapper (D-02)
**What:** Refuse unless the linked ref equals the argument; dry-run; explicit confirmation; push; read status; drift check.
**Facts it rests on:**
- The linked ref is the file `supabase/.temp/project-ref` under the work directory (`apps/cli-go/internal/utils/misc.go:86`, `ProjectRefPath = filepath.Join(TempDir, "project-ref")`) [VERIFIED: CLI v2.118.0 source].
- `db push` without a terminal "prints its [Y/n] question and applies" (STATE.md, 181-12), so the wrapper does its own confirmation and then passes `--yes`.
- The CLI detects an agent caller and answers in JSON; pass `--agent no --output-format text` (181-12; `db push --help` lists both global flags) [VERIFIED].
- In text mode the summary `<Target> is up to date.` goes to **stdout**, diagnostics to stderr (`apps/cli/src/commands/db/push/SIDE_EFFECTS.md`, `db-push-core.ts`) [VERIFIED: source search]. The exact `<Target>` word for `--linked` is [ASSUMED: "Remote database"]: match `is up to date.` only.
- `db push` applies no seed without `--include-seed`, and "Vault secrets from config.toml are updated before migrations unless --skip-vault is set" (`db push --help`). `config.toml` has `[db.vault]` commented out, so pass `--skip-vault` defensively [VERIFIED].
- Password: set `SUPABASE_DB_PASSWORD` from the same `read -rs` as `PGPASSWORD`. Without it the CLI creates a temporary `cli_login_*` role through the Management API and runs `SET SESSION ROLE postgres` (`connect.go:326-344`) [VERIFIED]; with it the push connects as `postgres` directly, the same role the bootstrap assumes.

### Pattern 2: A dedicated linked work directory
**What:** Do not run `supabase link` in `apps/supabase`. Build a work directory outside the shared stack's path whose `supabase/` holds symlinks to the repository's `config.toml`, `migrations/` and `functions/`, and pass `--workdir` to every CLI call (`link`, `db push`, `db diff`, `functions deploy`).
**Why:** `link` writes the linked project's service versions into `.temp/`, and `LoadConfig` then swaps the local images (`config.go:833-855`: `c.Db.Image = replaceImageTag(Images.Pg, string(version))`, `c.Api.Image = …Postgrest…`, `c.Auth.Image = …Gotrue…`, Storage, EdgeRuntime) [VERIFIED]. In `apps/supabase` this would change what `yarn db:start` starts, for both worktrees sharing the stack. `.temp/` is gitignored (`apps/supabase/supabase/.gitignore:3`), so nothing would show in `git status`.
**Side benefit:** in the dedicated directory, `db diff --linked` builds its shadow database from the hosted Postgres version, which is the right comparison.
**Caveat:** that the CLI follows symlinked `migrations/` and `functions/` is [ASSUMED]. Fallback: copy the three paths at the pinned commit and compare their hash with the manifest's sha256 before each push. Alternatively link in `apps/supabase` and remove every `.temp/*-version`, `project-ref` and `pooler-url` file at the end of each sitting (fragile).

### Pattern 3: The probe's three-source shape with a cascade guard
**What:** Preflight each source once (Management API `GET /v1/projects/{ref}` 200, public API `/auth/v1/settings` 200 with the anon key, psql `SELECT 1`). If any preflight fails, print `COULD NOT RUN <source>: <reason>` and exit 2, without printing per-check FAILs. Only when all three answer do the checks run.
**Why:** D-17 requires that each red check names its planted fault, never "unreachable". A preflight turns a source outage into exit 2, and the red run is valid only with every source up.

### Pattern 4: Planting settings faults through the scratch root (D-17)
**What:** A scratch-only file `infra/envs/scratch/supabase/faults.tf` with `variable "plant_faults" { type = bool, default = false }` and a resource `supabase_settings "faults"` with `count = var.plant_faults ? 1 : 0` and `depends_on = [module.supabase]`, sending the planted values (auth: hook off, other site URL and allow list, sign-up open, autoconfirm on, other SMTP port, oauth flags on with the authorization path; api: `max_rows = 500`).
**Revert:** `terraform apply -var plant_faults=false -replace=module.supabase.supabase_settings.this`. Destroying the `faults` resource "changes nothing on the project" (module comment, `main.tf` of the module), so the `-replace` forces the module's resource to send its correct values again whatever the provider's refresh does.
**Facts:** the provider sends only the keys named in the JSON (module comment) [VERIFIED]; `oauth_server_enabled`, `oauth_server_allow_dynamic_registration` and `oauth_server_authorization_path` are all known keys of provider 1.11.0 (`assert-hosted-settings-parity.mjs` `KNOWN_HOSTED_KEYS`) [VERIFIED]; the hosted API refuses the two flags without the path (README Observations, 2026-10-22) [VERIFIED]. Whether provider Read refreshes managed keys from the API is [ASSUMED] (the provider's `auth` description says hashed fields are "preserved from prior state, so out-of-band changes will not appear", implying the others do) — the `-replace` makes the revert independent of it.
**Guard impact:** the parity guard inspects the module's `.tf` files and each root's module call, not root-level resources (`assert-hosted-settings-parity.mjs:1523`, settings blocks are read from the module files). `infra-validate` in CI validates `infra/envs/*/*/` (`main.yaml:792`), so `faults.tf` must validate with the default.

### Pattern 5: Function secrets in Terraform
**What:** `supabase_edge_function_secrets` with `project_ref` and a `secrets` set of `{ name, value }` (value sensitive). Names: `PUBLIC_PROJECT_ID`, `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASS`. No `SUPABASE_*` name (reserved; apply fails). No `IDENTITY_PROVIDER_*` on staging (D-04).
**Where:** if the resource goes into the module, its variables must not have a type that holds `map` or `any` — the parity guard fails on such a module variable (`assert-hosted-settings-parity.mjs:73`). Use an `object({...})` with named attributes, or put the resource in the roots.

### Pattern 6: Reading the redirect allowlist (OBS-02)
Ask `GET <url>/auth/v1/verify?token=x&type=magiclink&redirect_to=<candidate>` with `apikey`, no redirect following, and compare the `Location` origin+path with the candidate (exactly what `account-access/signInLink.ts:95-111` does). Upstream GoTrue (master, read this session): a redirect is admitted when **scheme, host and port** equal the site URL's (port skipped only for loopback), otherwise when an allow-list glob matches; globs are compiled with separators `.` and `/` (`internal/conf/configuration.go:1283`, `glob.MustCompile(uri, '.', '/')`), so `*` matches one path segment and never crosses `/` [VERIFIED: github.com/supabase/auth master]. Which GoTrue version the hosted project runs, and so whether "the site URL's host on other ports" is admitted, is exactly OBS-02's measurement [ASSUMED until measured]. Consequence for OBS-05: with `SITE_URL` equal to the auth site URL's origin, the redirect check passes for **any** path, whatever the allow list holds.

Cases to record: `<origin>/en/api/auth/callback` (expect admitted), `<origin>/en/x/api/auth/callback` (two segments), `<origin>:8443/en/api/auth/callback` (other port), `https://refused.invalid/en/api/auth/callback` (expect refused: `Location` is the site URL with an error fragment).

### Pattern 7: The >1000-row read (OBS-07)
`GET <url>/rest/v1/nominations?select=id&project_id=eq.<PUBLIC_PROJECT_ID>` with `apikey`, `Authorization: Bearer <anon>` and `Prefer: count=exact`. Pass when `Content-Range` is `0-(N-1)/N`, `N > 1000` and the body holds N rows. With `max_rows = 500` the range reads `0-499/N`, and the finding names the truncation. Nominations are the realistic case (config.toml's `max_rows` comment cites 1000 of 1510 nominations returned with HTTP 200) [VERIFIED: `config.toml` `[api]` comment].

### Anti-Patterns to Avoid
- **Linking `apps/supabase`** (Pattern 2).
- **`--db-url` or `psql "postgres://…:pw@…"`**: puts the password on the command line, against `bootstrap.sql:16` and `check-drift.sh:37`.
- **Printing a Management API body**: `/postgrest` returns `jwt_secret` [CITED: v1-get-postgrest-service-config], `/api-keys` returns `api_key` values, `/config/auth` returns `smtp_pass` (hashed by the provider's note). Extract named fields only; never write raw responses into fixtures.
- **One FAIL per check when a source is down** (Pattern 3).
- **A hand-written expected-values table in the probe** (D-16, SUPA-11).

## Findings for the research items assigned by CONTEXT

### Item 1 (D-04): `identity-callback` fails closed without `IDENTITY_PROVIDER_*` — YES, no fix needed

- The first statement in the request `try` is `const providerType = requireEnv('IDENTITY_PROVIDER_TYPE', Deno.env.get('IDENTITY_PROVIDER_TYPE'));` (`identity-callback/index.ts:157`), before the body is parsed and before any client exists. `requireEnv` throws `ERR_ENV_UNCONFIGURED` for `undefined` or `''` (`identity-callback/envConfig.ts:23-30`) [VERIFIED].
- The outer `catch` answers `500` with the fixed body `{"error":"Internal server error"}` (`index.ts:390-397`) [VERIFIED]. Nothing is written: user creation is at line 275, after token verification.
- `OPTIONS` answers `200 'ok'` and any non-POST answers `405 {"error":"Method not allowed"}` (`index.ts:143-153`), both before the env read [VERIFIED].
- **Probe checks:** `functions.identity-callback.served` = `GET` without `Authorization` → `405` with that body (proves the function, not the gateway, answered, and that the gateway did not demand a JWT); `functions.identity-callback.refuses` = `POST {}` → `500 {"error":"Internal server error"}`. A deleted function answers from the gateway (404) [ASSUMED: body `{"code":"NOT_FOUND",…}`], and a gateway refusal answers 401 with a gateway body; both differ from the function's own bodies.
- `scripts/assert-edge-function-env.mjs <env-file>` would fail on a staging secrets file, because it requires the `IDENTITY_PROVIDER_*` names that D-04 leaves unset. Do not use it as a gate for the staging secrets.

### Item 2 (D-18): dev-seed template — none qualifies; add one

- dev-seed creates **no auth users**: `packages/dev-seed/src` contains no `createUser`, `auth.admin` or `openvaa.test` outside tests [VERIFIED: grep]. It writes no `storage_config` row (only the writer's portrait upload to Storage). So `no-seed` stays green with any template.
- Built-ins: `default` has `candidates.count: 327` and `nominations.count: 327` plus organisation/alliance nominations (`templates/default.ts`, header: "327 candidates") and its candidates override throws unless there are exactly 8 organisations and the weights sum to 327 (`defaults/candidates-override.ts` header); `e2e/base` and `perm-*` are smaller. **No built-in template puts more than 1000 rows in one anon-readable table** [VERIFIED].
- Anon visibility needs `project_open_for_voters(project_id)` and `confirmed` (`00001_initial_schema.sql:3680-3692` for candidates, `:4147-4157` for nominations) [VERIFIED]. dev-seed writes `confirmed` on every entity and nomination (`supabaseAdminClient.ts:324`) [VERIFIED]. It never creates a project row, and changes openness only when the template sets `openForVoters` (`template/types.ts:45-46`) [VERIFIED].
- **Recommendation:** a new built-in template (for example `smoke`) registered in `BUILT_IN_TEMPLATES` (`templates/index.ts`) and in the hard-coded list of `cli/help.ts` ("Adding a built-in => update this file in the same commit", line 6), with generator defaults (no count-locked overrides), `candidates.count ≥ 1001` and `nominations.count ≥ 1001`, a small question set, and `projectId` equal to the staging `PUBLIC_PROJECT_ID` when that is not the canonical `00000000-0000-0000-0000-000000000001` (Open Question 2).
- **Openness:** either the bootstrap runs with `BOOTSTRAP_OPEN_FOR_VOTERS=true` on staging (allowed by 181-R2, value from the environment), or the template sets `openForVoters: true`. Without one of them the anon read returns 0 rows. 185's smoke run ("renders a voter page from hosted data") needs an open project too (Open Question 3).
- **Targeting a hosted project:** `SUPABASE_URL` (falls back to `PUBLIC_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`, and `--allow-remote` or `DEV_SEED_ALLOW_REMOTE=1` per invocation, never in `.env` (`cli/help.ts:24-52`) [VERIFIED]. The repo-root `.env` is auto-loaded, so the operator's shell must override both variables explicitly, or the seed lands on the local stack. The service-role key is used here by the operator only, never by the probe.
- The writer uploads one portrait per candidate to Storage (`writer.ts`, Pass 4); about 1000+ uploads per seed run.

### Item 3 (D-09/OBS-03): gateway, `verify_jwt` and keys

- Hosted default is `verify_jwt = true`: "The default is `verify_jwt = true`, so the platform validates the JWT before your handler runs" [CITED: supabase.com/docs/guides/functions/auth]. `config.toml` declares it only for `identity-callback` (`config.toml:428-432`: `[functions.identity-callback]` … `verify_jwt = false`), and `supabase functions deploy` reads that setting (the comment at line 431) [VERIFIED].
- Publishable keys: "the `verify_jwt` platform check accepts them on either header, but passing that check doesn't authenticate the caller" [CITED: supabase.com/docs/guides/api/api-keys]. This contradicts the DISCUSSION-POINTS premise "With a publishable key it would not"; it is a docs reading, not an observation.
- The frontend's call shape (supabase-js 2.117.2, no session): `apikey: <anon>` **and** `Authorization: Bearer <anon>` (see Corrections) [VERIFIED].
- **Measure three shapes per function** on the throwaway, after deploy: (a) `apikey` only; (b) `apikey` + `Authorization: Bearer <legacy anon JWT>` (the frontend's shape); (c) with a publishable key in both headers if the project issues one. A `check-code` request with a random code is the harmless call for `account-access` (`{"operation":"check-code","project_id":"<id>","code":"x"}` → `200 {"status":"unknown"}`).
- D-09's trigger reads: "if the gateway refuses (a), or only the legacy JWT shape lets it through". Since (a) is expected to be refused with verification on [ASSUMED], plan for the `config.toml` change as the likely outcome: add `[functions.account-access]` `verify_jwt = false`, redeploy, re-measure (a) and (b).
- **The parity-guard change is larger than a row:** widen `inFamily` (`assert-hosted-settings-parity.mjs:600-608`) to `functions.*`, then classify both `functions.identity-callback/verify_jwt` and `functions.account-access/verify_jwt` (class "not compared": the CLI deploys them from this very file, and the probe compares the served value through the Management API), and add self-test cases (`CASES`, line 2175). Once widened, a future `[functions.X]` key fails until classified, which is the point.
- `send-email` stays verify-on (it is called with a user session). Probe shape for it: `GET` with Bearer anon → `405 {"error":"Method not allowed"}` (`send-email/index.ts:36-40`).

### Item 4 (D-14): Management API endpoints

| Read | Endpoint | Fields used | Source |
|---|---|---|---|
| Auth settings | `GET /v1/projects/{ref}/config/auth` | `site_url`, `uri_allow_list`, `disable_signup`, `mailer_autoconfirm`, `hook_custom_access_token_enabled/uri`, `hook_send_email_enabled/uri`, `smtp_host/port/admin_email/sender_name`, `smtp_user` (presence only), `oauth_server_enabled`, `oauth_server_allow_dynamic_registration` | Observed 200 with top-level fields (README Observations 2026-10-23) [VERIFIED]; field list [CITED: v1-get-auth-service-config] |
| PostgREST | `GET /v1/projects/{ref}/postgrest` | `max_rows`, `db_schema`, `db_extra_search_path` (**response also holds `jwt_secret`**) | [VERIFIED observed 200]; [CITED: v1-get-postgrest-service-config] |
| Functions | `GET /v1/projects/{ref}/functions` | `slug`, `status` (`ACTIVE`), `verify_jwt`, `version` | [CITED: v1-list-all-functions] |
| Keys | `GET /v1/projects/{ref}/api-keys?reveal=false` | `type` (`legacy` seen in the example), `name`, `prefix`; discard `api_key` | [CITED: v1-get-project-api-keys]; whether legacy `api_key` is masked without `reveal` is [ASSUMED: not masked] |
| Legacy enabled | `GET /v1/projects/{ref}/api-keys/legacy` | `{"enabled": true}`; "will be removed in the future … signaled by an HTTP 404" | [CITED: v1-get-project-legacy-api-keys] |
| Project | `GET /v1/projects/{ref}` | `database.version`, `status`, `region` | [CITED: v1-get-project] |
| Secrets | `GET /v1/projects/{ref}/secrets` | names and SHA-256 digests (no values) | Provider docs: "the Supabase API only returns SHA-256 digests" [CITED: terraform-provider-supabase docs/resources/edge_function_secrets.md] |

- The oauth flags are served by `/config/auth` (a new project held both `false` and no `oauth_server_authorization_path`, README Observations 2026-10-22) [VERIFIED].
- **Secret digests give SUPA-05 a cheap probe check:** compare the `SMTP_PORT` digest with `sha256("2587")` (the root's tfvars `smtp.port`), `SITE_URL` with `sha256(public_origin)`, `PUBLIC_PROJECT_ID` with `sha256(<id>)`, without reading a value [ASSUMED: digest is hex SHA-256 of the raw value, per the provider docs].
- Naming alignment: the probe reads expected names from `hosted-settings.json` groups `api`, `auth`, `auth_hook`, `auth_send_email_hook`, `redirect_callback_paths` (the five groups, `assert-hosted-settings-parity.mjs:523`) and builds `uri_allow_list` exactly as the module does: `join(",", [for p in paths : "${public_origin}${p}"])` (`modules/supabase/settings.tf`, `auth_origin`) [VERIFIED].

### Item 5 (D-03): connection strings, and why 6543 breaks the bootstrap

- Direct: "Direct connections are on IPv6, or on IPv4 if the project has the IPv4 add-on" [CITED: supabase.com/docs/guides/database/connecting-to-postgres]. Host `db.<ref>.supabase.co`, port 5432, user `postgres` (the CLI's own default, `flags/db_url.go:133-139`) [VERIFIED].
- Session pooler: `postgresql://postgres.[PROJECT-REF]:[PW]@aws-[INDEX]-[REGION].pooler.supabase.com:5432/postgres`; "Copy the host from the Connect dialog", it cannot be built from the region [CITED: same page].
- Transaction pooler (6543): "Session-level state is lost between transactions … `set`/`reset`" and no prepared statements [CITED]. `bootstrap.sql:39` runs `SET log_parameter_max_length_on_error = 0;` as a session `SET` outside the script's transaction (which begins at line 134) and then sends the key with `\bind` (`:161-163`, extended protocol). Under transaction pooling the protective `SET` can land on a different backend than the keyed statement [VERIFIED: file; mechanism CITED].
- CLI: `--linked` dials direct (5 s), else the pooler URL saved by `link` with port forced to 5432 (see Summary item 2). `link --skip-pooler` saves no pooler URL ("Use direct connection instead of pooler", `link --help`) [VERIFIED]. So "try direct first" for the CLI is automatic; to **record** which path was used, run with `--debug`, whose log prints `Resolved DNS: <addr>` for direct or `Using connection pooler: <url>` (`connect.go:103`, `db_url.go:146`) — the pooler line holds the URL with `[YOUR-PASSWORD]` placeholder removed, so redact before pasting.
- psql (bootstrap, drift history, probe catalog): direct = `PGHOST=db.<ref>.supabase.co PGUSER=postgres PGPORT=5432`; session pooler = `PGHOST=<pooler host> PGUSER=postgres.<ref> PGPORT=5432`.
- Indicative only: from this host the agent's shell had no IPv6 route on 2026-10-26 (`curl -6 https://ipv6.google.com` → `000`, while IPv4 reached `api.supabase.com`). The sandbox may cause this; the operator's own attempt is the measurement.

### Item 6 (D-10): the seven settings, and which values are safe

Read with `current_setting(name, true)` instead of `SHOW`: a module that is not loaded makes `SHOW pgaudit.log` raise "unrecognized configuration parameter", while `current_setting(…, true)` returns NULL.

| Setting | Safe when | Unsafe when |
|---|---|---|
| `log_statement` | `none` or `ddl` (the bootstrap's statements are `INSERT … ON CONFLICT`, class `mod`) | `mod` or `all`, **and** `log_parameter_max_length` ≠ 0 |
| `log_parameter_max_length` | `0` (no bind values in statement/duration logs) | `-1` (whole value) or > 0 (prefix) combined with any line above/below |
| `log_min_duration_statement` | `-1` | ≥ 0 with `log_parameter_max_length` ≠ 0 (a statement slower than the threshold is logged with its parameters) |
| `pgaudit.log` | NULL (not loaded), `none`, or classes without `write`/`all` | includes `write` or `all`, **and** `pgaudit.log_parameter = on` |
| `pgaudit.log_parameter` | `off` / NULL | `on` with the line above |
| `auto_explain.log_min_duration` | `-1` / NULL | ≥ 0 with `auto_explain.log_parameter_max_length` ≠ 0 |
| `auto_explain.log_parameter_max_length` | `0` / NULL | `-1` or > 0 with the line above |

[ASSUMED: the interaction rules are from training knowledge of the PostgreSQL 13+ logging GUCs and pgaudit/auto_explain docs; not re-read this session.]
- **The local values would already fail D-10's letter:** "Locally they are ddl, -1, -1, , off, 10000 and -1" (STATE.md) → `auto_explain.log_min_duration = 10000` with `auto_explain.log_parameter_max_length = -1` logs a statement slower than 10 s with its parameters. If the hosted values match, the D-10 checkpoint fires; the operator decides whether a 10 s threshold on a millisecond transaction is acceptable. Plan the checkpoint as likely, not exceptional.
- Also unobserved there and worth one line each in the same sitting (STATE.md): `postgres` owns the five tables (`SELECT tableowner FROM pg_tables WHERE …`), and `postgres` may read `auth.users`.

### Item 7 (D-22/E-03): `check-drift.sh --target linked`

- **Shadow DB:** the schema part runs `"$CLI" db diff "--$TARGET" --workdir "$WORKDIR" --agent no --output-format text` (`check-drift.sh:368`). The shadow is built by the CLI from `<workdir>/supabase/migrations`, in Docker, on the `shadow_port` of the workdir's `config.toml` (54320, `config.toml:42`) and labelled with its `project_id` (`openvaa-local`, `config.toml:8`) (`check-drift.sh:44`) [VERIFIED]. With a linked work directory the shadow image follows `.temp/postgres-version` (Pattern 2).
- **Default schema set:** no `--schema` is passed, so the CLI's default set applies; locally it covered `public`, `private`, policies on `storage.objects` and a hand-made schema (`check-drift.sh:13`, 181-12). What it holds on a clean **hosted** database (platform schemas, extension objects such as `pg_net` in `extensions`) is the D-22 measurement.
- **Cache:** `~/.supabase/cache/shadow-baseline/shadow-baseline-ee4907d4966e767c.tar`, 53,090,304 bytes, dated 20 Oct [VERIFIED: `ls -la` this session]. A linked diff at another Postgres version will likely add a second file [ASSUMED]; remove the directory's contents after the run.
- **Where the ref check goes:** beside the `local` guard at `check-drift.sh:247-259`, a `linked` branch that (1) reads `<workdir>/supabase/.temp/project-ref`, (2) requires 20 lowercase letters, (3) requires either `PGHOST = db.<ref>.supabase.co` with `PGUSER = postgres`, or `PGHOST` ending in `.pooler.supabase.com` with `PGUSER` ending in `.<ref>`, and (4) refuses `PGPORT = 6543`. Update the header's prerequisite 4 ("For `--target linked` it cannot tell", line 45) and add red controls (wrong ref, port 6543) to its evidence.
- **The planted DDL** can be the D-19 temporary SQL function: a function is reported by the diff (181-12 measured coverage) [VERIFIED: STATE.md 181-12]. Run the drift check while it exists (expect 1, naming it), then after its removal (expect 0). One sitting covers D-19 and D-22's red control.
- **Blind spots stay:** rows, column privileges, comments and role settings are invisible to the diff (`check-drift.sh:15-20`). The `anon` timeout is a role setting, so only the probe sees it.

### Item 8 (D-11): first administrator and the hook's claims

- Not documented (Corrections). The phase has to write the step, in the staging Supabase README. Recommended shape:
  1. The operator creates the user in the dashboard (Authentication → Users → Add user → create, with auto-confirm), with the address and a password from the password manager. The admin API is what the dashboard calls, so sign-up being off does not block it [ASSUMED: dashboard labels]. Do not use "Send invitation": the send-email hook swallows Auth's own mail.
  2. As `postgres` over psql, one grant row, in the shape `seed.sql:196-215` uses: `INSERT INTO public.grants (user_id, scope, target_type, target_id, role) VALUES ((SELECT id FROM auth.users WHERE email = lower(:'admin_email')), 'project', NULL, :'project_id'::uuid, 'admin') ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING;` with the values read by `\getenv`, never `-v`. Project-scope `admin` is what `seed.sql` gives its admin; an account-scope admin would add the three `account.*` permissions (docs `authentication/+page.md:83-86`). Which scope is the operator's choice [ASSUMED: project scope].
  3. Sign in: `POST <url>/auth/v1/token?grant_type=password` with `apikey`, body `{"email","password"}` from `read -rs`, the answer written to a file in `$L`.
  4. Decode only the payload segment and print only the claim names and the `grants` array (its objects are `{scope, target_type, target_id, role}`, `00001_initial_schema.sql:2197-2222`). Never paste the token.
- The hook reads `public.grants` as `supabase_auth_admin` (`GRANT … ON TABLE public.grants TO supabase_auth_admin`, line 2076) [VERIFIED].
- **F2 runtime half:** on the throwaway, before the push, the disposable user's sign-in shows what a token issue does while the hook's function is absent [ASSUMED: an error naming the hook]. One request, recorded; it also tells the operator what the persistent project does today.

### Item 9 (D-05/OBS-05): `account-access` refusals and the slot release

- **Order** (`linkIssue.ts:126-175`): sign-up check → redirect check → eligibility (takes the slot) → user/token/link/mail → on any failure in the last step, release.
- **Refusal 1** (`linkIssue.ts:131-134`): `public sign-up is not disabled on this deployment; no link issued`, when `/auth/v1/settings` does not hold `disable_signup: true` **and** `mailer_autoconfirm: false` (`deploymentChecks.ts:21-25`). A positive answer is remembered per worker for 60 s (`SIGN_UP_CHECK_TTL_MS = 60000`, line 10).
- **Refusal 2** (`linkIssue.ts:136-141`): `SITE_URL is not admitted by the auth redirect allowlist; no link issued`. Remembered 10 min per callback URL (`REDIRECT_CHECK_TTL_MS = 600000`, line 13). Per Pattern 6 it fires only when the `SITE_URL` secret's origin differs from the auth `site_url` origin **and** no allow-list glob matches.
- Every log line has the prefix `account-access:` (`index.ts:52`); read them in the function's logs.
- **How to provoke each on the throwaway:** refusal 1 during the D-17 break (sign-up opened by the fault resource), then wait out the 60 s memory; refusal 2 in its own state: the `SITE_URL` secret set to an origin the auth service does not admit (for example `https://refused.invalid`), one request, then restored. The two cannot share a state, because the sign-up check runs first.
- **Slot release** (`linkIssue.ts:166-173`): log `a link could not be issued or mailed; its slot is given back`, then `invitation_link_release` deletes the row of `private.invitation_throttle` keyed `'link:' || <project> || ':' || sha256(lower(btrim(email)))` (`00001_initial_schema.sql:9164-9200`). Observe it three ways: the log line; a psql read as `postgres` of `SELECT count(*) FROM private.invitation_throttle WHERE key LIKE 'link:<project>:%'` (0 after the failed send); and the witness: `SELECT public.invitation_link_witness_open();` as `postgres`, pass the id as `witness` in the request, then `SELECT public.invitation_link_witness('<id>');` → `not-sent` (`:9315-9353`).
- **Eligibility:** a request is mailed only to an address with an open invitation in the project or a grant in it (`invitation_link_request`, `:9080-9160`). The disposable user on the throwaway, with the operator's address and a project grant, is eligible.
- **SMTP failure timing:** each SMTP phase times out after 10 s (`SMTP_TIMEOUT_MS = 10000`, `index.ts:64`), well inside the 400 s worker limit of paid plans [CITED: functions/limits].
- **If 2587 delivers first**, plan one deliberate attempt on 587 (documented blocked) to get the OBS-05 failed send, then restore 2587. *(Corrected 2026-11-11: 587 delivered; the failed send was made on 2465, see Pitfall 4.)* If 2587 does **not** deliver, the remaining D-05 ports are expected to fail by construction (Pitfall 4): stop at a checkpoint rather than iterate.
- **Sender and host:** `SMTP_FROM=noreply@staging.openvaa.org`, `SMTP_HOST=email-smtp.eu-north-1.amazonaws.com` (`mail-ses/outputs.tf:16-23`), `SMTP_USER`/`SMTP_PASS` from the `dns-mail` root's `smtp_username`/`smtp_password` outputs; the password is region-bound (`outputs.tf` description) [VERIFIED].

### Item 10 (D-17): planted faults, their reverts, and the cascade test

| Check (suggested name) | Planted fault on the throwaway | Expected finding | Revert |
|---|---|---|---|
| `auth.access-token-hook` | fault resource: `hook_custom_access_token_enabled = false` | enabled false | `-replace` revert apply |
| `auth.site-url` | fault: `site_url = "https://planted.invalid"` | served ≠ tfvars `public_origin` | same |
| `auth.redirects` | fault: `uri_allow_list` with one entry | served list ≠ built list | same |
| `auth.signup-closed` | fault: `disable_signup = false` | `false` served | same |
| `auth.email-confirm` | fault: `mailer_autoconfirm = true` | `true` served | same |
| `auth.public-settings` (anon `/auth/v1/settings`) | same two faults, other source | served pair not (true, false) | same |
| `auth.smtp` | fault: `smtp_port = "2465"` | port ≠ tfvars `smtp.port` | same |
| `auth.oauth-server` | fault: both flags `true` + `oauth_server_authorization_path` | flags not false | same |
| `api.max-rows` | fault api: `max_rows = 500` | 500 ≠ 50000 = pageSize | same |
| `rows.read-whole` | same `max_rows` fault | `Content-Range 0-499/N` | same |
| `storage.buckets` | dashboard: delete the empty `private-assets` bucket | bucket missing | psql as `postgres`: re-run the baseline's `INSERT INTO storage.buckets …` (lines 5400-5410) for that row |
| `functions.deployed` | `supabase functions delete send-email` | slug missing | `supabase functions deploy send-email` |
| `functions.served` | same deletion | gateway 404 for `send-email` | same |
| `functions.identity-callback-unverified` | Management API PATCH `verify_jwt: true` for `identity-callback`, or deploy it from a work dir without the entry | `verify_jwt` true; no-auth `GET` now refused by gateway | redeploy from the linked work dir |
| `db.hook-functions` | psql: `ALTER FUNCTION public.custom_access_token_hook(jsonb) RENAME TO custom_access_token_hook_planted;` | function missing | rename back (grants survive a rename) |
| `db.anon-timeout` | psql: `ALTER ROLE anon SET statement_timeout = '3s';` | `3s` ≠ `8s` | `ALTER ROLE anon SET statement_timeout = '8s'; NOTIFY pgrst, 'reload config';` |
| `db.postgres-major` | **cannot be planted on a project** | — | see below |
| `no-seed` | dashboard: create user `planted@openvaa.test` | check-seed exit 3 naming it | delete the user |
| `functions.secrets` (if added) | fault in the scratch secrets: `SMTP_PORT` ≠ tfvars | digest mismatch | revert apply |

- **Postgres major** is a property of the project; no break can make it 16. The honest red control is on the expectation side: for the red run only, an uncommitted working-tree edit of `config.toml` `major_version = 16`, so the probe reads 17 against 16 and fails by name; revert, and record the deviation from "the project broken on purpose". This needs the operator's acceptance (Open Question 4).
- **Cascade test for the red run:** every FAIL line must quote its planted value, and the three source preflights must have passed (Pattern 3).
- Deleting a bucket by SQL may be refused on current Storage versions (a protective trigger on direct deletes) [ASSUMED]; the dashboard deletion avoids it. A bucket that holds objects must be emptied first; `private-assets` holds nothing unless something uploaded to it.
- The access-token hook pointing at a renamed function breaks sign-ins on the throwaway for the duration, which is acceptable there.
- That is **more than one apply-equivalent**: one Terraform apply for settings (and secrets), plus CLI and psql steps. Each is an operator step, so the break and the revert are each one checkpoint with several commands.

### Item 11 (D-20): the "Not yet observed" table

`infra/envs/staging/supabase/README.md:668-678` holds three rows, and `## Observations` (line 680) follows with 20 dated rows [VERIFIED]:
| Statement | Checked by |
|---|---|
| Whether two settings resources work side by side for one project, each keeping only its own keys | A later stage of the deployment work, when the SMTP settings are applied |
| While the send-email hook is on, the hosted auth service sends no mail of its own | A later stage of the deployment work, with the first mail the function sends |
| With the project already in state, the root's `import` block plans nothing | The next plan of the persistent root, which must still read "No changes" |

All three are settled by this phase (SMTP apply; first function mail; the persistent root's next plan). New "not yet observed" rows of this phase (direct vs pooler, the seven settings, the key model, headers, redirect cases, the timeout, the drift schema set) are added there first and moved to "Observations" when measured.

### Item 12: `supabase_edge_function_secrets` and the `smtp` object

Read from the provider 1.11.0 schema with `terraform providers schema -json` (plugin dir of the staging root) [VERIFIED]:
- `supabase_edge_function_secrets`: `project_ref` (required), `secrets` (required, set of nested `{ name: string required, value: string required **sensitive** }`), `secret_digests` (computed map: "SHA-256 hex digest … if the digest returned by the API no longer matches … the provider marks the affected secret value as null so Terraform will plan an update"), `id`. Name description: "Must not start with the `SUPABASE_` prefix".
- Provider docs [CITED: terraform-provider-supabase docs/resources/edge_function_secrets.md]: "the plaintext `value` is stored in state"; on apply it deletes remote secrets that are in state but missing from `secrets`; secrets never in state are left alone; "The docs recommend one resource per project"; import leaves values null.
- **Sensitivity:** values are plaintext in state. Staging state is in the encrypted, versioned bucket under `hand/` (README Observations 2026-10-23); scratch state is local and gitignored (`.gitignore:115`, `*.tfstate`). `SMTP_PASS` is already in state through `supabase_settings.smtp_secret`.
- `supabase_settings`: attributes `api`, `auth`, `database`, `network`, `pooler`, `storage` (JSON strings), `ssl_enforcement`, `project_ref`. The `auth` description lists `smtp_pass` among fields "returned as a hash by the API … The provider preserves these fields from prior state, so out-of-band changes will not appear in `terraform plan`".
- The module's `smtp` variable: `object({ host = string, port = string, admin_email = string, sender_name = string })`, null by default; `smtp_user`/`smtp_password` required when `smtp` is set (validations) (`modules/supabase/variables.tf`) [VERIFIED]. The scratch root passes neither `smtp` nor `auth_rate_limits` today (`scratch/supabase/main.tf:23-33`); it needs the same variables as staging to rehearse D-07.
- First SMTP enablement: the module sends host/port/admin/sender in `supabase_settings.this` and user/pass second in `smtp_secret` (`depends_on`). Whether the API accepts the first half alone is the 183 blocker; the throwaway apply is the measurement. If refused, the fallback is a module change sending all six in one PATCH, at the cost of a masked diff (Pitfall 9).

### Item 13: Validation (see the full section below)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IPv4/IPv6 fallback for the push | A reachability test + `--db-url` | The CLI's own `--linked` resolution (direct, else session pooler) | Already implemented and forces port 5432 (`db_url.go:132-174`) |
| Linked-ref detection | Parsing `supabase status` output | `<workdir>/supabase/.temp/project-ref` | A file the CLI writes and reads itself (`misc.go:86`) |
| Seed detection | New SQL in the probe | `infra/scripts/check-seed.sql` as a subprocess, status 0/3/2 | Already shown red and green (181-11) |
| Redirect admission logic | A reimplementation in the probe | Ask `/auth/v1/verify` with `redirect_to` and read `Location` (as `signInLink.ts:95-111`) | The served GoTrue version decides |
| Secret drift | Reading secret values | Management API digests | Values never leave the platform |
| Expected values | A table in the probe | `hosted-settings.json`, root tfvars, `staticSettings.ts`, `config.toml` | D-16, SUPA-11 |

**Key insight:** every hard part here already exists in the CLI, GoTrue or a committed script; the phase's own code is the glue and the comparisons, which is why the comparisons are the part Vitest covers.

## Runtime and out-of-band state

Not a rename phase, but several pieces of state live outside git and decide outcomes:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Throwaway: settings only, no schema yet. Persistent: hooks on, no functions, no schema | Push both; seed both (D-18); throwaway deleted at end |
| Live service config | Hosted auth/API settings (Terraform state holds them); function secrets (new) | Applies are operator checkpoints |
| OS-registered state | `~/.supabase/cache/shadow-baseline/shadow-baseline-ee4907d4966e767c.tar` (53 MB) | Remove after the linked drift run (D-22) |
| Secrets/env vars | `SUPABASE_ACCESS_TOKEN`, `TF_VAR_database_password`, `PGPASSWORD`/`SUPABASE_DB_PASSWORD`, `TF_VAR_smtp_user/password`, anon key, service-role key (bootstrap + dev-seed only) | `read -rs` per sitting; never in files |
| Build artifacts / local files | `supabase/.temp/*` of whichever work dir is linked; scratch `terraform.tfstate` (absent in this worktree) | Pattern 2; locate or re-import scratch state before any scratch plan (Pitfall 5) |

## Common Pitfalls

### Pitfall 1: Linking `apps/supabase` swaps the shared local stack's images
**What goes wrong:** after `supabase link` in `apps/supabase`, the next `yarn db:start` (from this worktree) starts hosted-version images.
**Why:** `config.go:833-855` reads `.temp/*-version` files [VERIFIED].
**How to avoid:** Pattern 2. **Warning signs:** `ls apps/supabase/supabase/.temp` shows `project-ref` or `*-version` files.

### Pitfall 2: A pipe hides the push status, or the prompt applies by itself
**What goes wrong:** `supabase db push … | tee` reports tee's status; in text mode without a terminal the `[Y/n]` question applies (STATE.md 181-12).
**How to avoid:** status read on the next line; explicit confirmation in the wrapper, then `--yes`.

### Pitfall 3: JSON output for agent callers
**What goes wrong:** CLI answers in JSON when it detects an agent; a text match for "up to date" fails.
**How to avoid:** `--agent no --output-format text` on every CLI call in scripts (181-12; `check-drift.sh:11`).

### Pitfall 4: SMTP fallback ports that cannot work
**What goes wrong:** 587 and 25 are blocked [CITED: functions/limits]; 465 is TLS Wrapper and the transport is `secure: false` (`index.ts:182`), so the client waits for a plain greeting and times out.
**How to avoid:** expect 2587; if it fails, checkpoint (a code change to `secure: port === 465 || port === 2465` would be the remedy, and it is a scope decision). Use 587 deliberately once for OBS-05.

**Correction (measured 2026-11-11, plan 184-16):** the "587 is blocked" half did not hold. On the throwaway, with 587 served to `account-access` and the function redeployed, a link mail was sent and delivered. The same apply-and-redeploy sequence with 2465 then failed with `ETIMEDOUT` and gave its slot back, which shows that the redeployed function uses the changed port. So 587 is open from a hosted Edge Function (25 was not tried), and the half about 465 and 2465 is confirmed for 2465. The deliberate failed send for OBS-05 was therefore made on 2465 (operator ruling `SLOT_PROOF=port-2465`, 2026-11-11). 2587 stays the port in use. Evidence: `evidence/184-16-throwaway-mail-redirects-slot.md` § 9 and 10.

### Pitfall 5: A scratch plan without state plans a new project
**What goes wrong:** the scratch root has no `import` block; with no state in this worktree, `terraform plan` shows `supabase_project.this` to be **created**.
**How to avoid:** first scratch sitting: find the state the operator used in 183 (another checkout?), or re-run the README's Step 2 imports (`terraform import module.supabase.supabase_project.this <ref>` and `…supabase_settings.this <ref>`). Never apply a scratch plan that shows a creation.

### Pitfall 6: Management API bodies carry secrets
`/postgrest` returns `jwt_secret`; `/api-keys` returns key values; `/config/auth` carries `smtp_pass`. The probe extracts named fields; fixtures are synthesized, never captured raw; the runbook's existing secret-word filter (`(^|_)(secret|secrets|pass|passwd|password|key|keys|token|tokens)$`) stays.

### Pitfall 7: Anon reads return nothing on a closed project
Every anon policy requires `project_open_for_voters`; the bootstrap writes `open_for_voters = false` by default (`bootstrap.sql:28`, `:142-150`, and only at creation). A `rows.read-whole` FAIL with `0/0` means "closed", not "truncated". Make the probe's finding say which.

### Pitfall 8: The legacy-keys endpoint can vanish
`/api-keys/legacy` "will be removed in the future … signaled by an HTTP 404" [CITED]. The probe should treat 404 there as a finding of its own ("legacy-keys endpoint gone"), not as "could not run".

### Pitfall 9: First SMTP enablement in two writes
The 183 module splits SMTP into two settings resources; the API may refuse `smtp_host` without credentials. Throwaway first; fallback is a module change.

### Pitfall 10: The seven settings — `SHOW` of an unloaded module errors
Use `current_setting(name, true)`.

### Pitfall 11: Temporary objects left on the throwaway skew the green run
The D-19 echo function and SQL function, the timeout sleep function, the renamed hook function, the planted user. The probe's `functions.deployed` should fail on **any** slug other than the three (catches a leftover echo function), and the drift check catches a leftover SQL function.

### Pitfall 12: A read-only role sees no rows under RLS
`public.storage_config` (`:5381`) and `storage.buckets` have RLS on; `check-seed.sql` reads `storage_config` (`:67`, `:77`). A role without `BYPASSRLS` yields a false "no supabase_url row" finding. Hosted `supabase_read_only_user` may have `BYPASSRLS` [ASSUMED]; measure on the throwaway (Open Question 1). Note that any role able to run `check-seed.sql` can read the `service_role_key` row's value; the check reads it into a variable and never prints it (`check-seed.sql:77-93`).

### Pitfall 13: The parity guard matches the push command in comments
The "one writer" rule matches the CLI's configuration-push command "however it is spelled" in every tracked file under `infra/`, `scripts/`, `apps/supabase/`, `tests/scripts/` (`assert-hosted-settings-parity.mjs` header). A wrapper or runbook comment that names it fails `lint:check`. Say "configuration push" in words, as the README does.

### Pitfall 14: `.env` auto-loading points dev-seed at the local stack
dev-seed auto-loads the repo-root `.env` (`cli/help.ts:51-52`). Export `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` explicitly in the seeding shell.

## Code Examples

### The seven settings (D-10), as `postgres`
```sql
-- Source: PostgreSQL current_setting(text, boolean); names from STATE.md blocker 181-11
SELECT s.name, current_setting(s.name, true) AS value
FROM (VALUES ('log_statement'), ('log_parameter_max_length'),
             ('log_min_duration_statement'), ('pgaudit.log'),
             ('pgaudit.log_parameter'), ('auto_explain.log_min_duration'),
             ('auto_explain.log_parameter_max_length')) AS s(name);
```

### Probe catalog reads (any role)
```sql
SELECT current_setting('server_version_num')::int / 10000 AS major;
SELECT rolconfig FROM pg_roles WHERE rolname = 'anon';           -- expect {statement_timeout=8s}
SELECT to_regprocedure('public.custom_access_token_hook(jsonb)') IS NOT NULL,
       to_regprocedure('public.send_email_hook(jsonb)') IS NOT NULL;
```
The `8s` literal is the baseline's value (`00001_initial_schema.sql:90-92`: `ALTER ROLE anon SET statement_timeout = '8s';`) [VERIFIED]. Expected function names come from `hosted-settings.json:33,37` (`pg-functions://postgres/public/custom_access_token_hook`, `…/send_email_hook`) [VERIFIED].

### Source preflight and status mapping (probe skeleton)
```js
// Node built-ins only. No value read from a response is ever printed whole.
import { spawnSync } from 'node:child_process';

export function seedCheckVerdict(status) {
  if (status === 0) return { pass: true };
  if (status === 3) return { pass: false, finding: 'check-seed reported a finding (see its message)' };
  return { couldNotRun: `check-seed exited ${status}` };   // 2 = no connection
}

const run = spawnSync('psql', ['-X', '-f', 'infra/scripts/check-seed.sql'], { encoding: 'utf8' });
// status semantics from infra/scripts/check-seed.sql:15-18 (0 clean, 2 connection, 3 finding)
```

### The anon timeout measured live (throwaway only, temporary, as `postgres`)
```sql
CREATE FUNCTION public.probe_sleep(seconds double precision) RETURNS void
  LANGUAGE sql AS $$ SELECT pg_sleep(seconds) $$;
GRANT EXECUTE ON FUNCTION public.probe_sleep(double precision) TO anon;
-- POST /rest/v1/rpc/probe_sleep {"seconds": 9} as anon -> expect SQLSTATE 57014 after about 8 s
-- {"seconds": 7} -> success. Then:
DROP FUNCTION public.probe_sleep(double precision);
```
[ASSUMED: PostgREST applies the impersonated role's `statement_timeout` per request; the baseline relies on it, `:84-96`.]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct DB host on IPv4 | Direct host IPv6 only; Supavisor pooler on IPv4 | 2024 [CITED: supabase changelog "PGBouncer and IPv4 deprecation"] | Session pooler is the IPv4 path |
| CLI link without pooler | `link` saves a pooler URL; `--skip-pooler` opts out | CLI ≥ 1.136.3 [CITED: github.com/orgs/supabase/discussions/20955] | Fallback is automatic |
| Legacy `anon`/`service_role` JWTs | Publishable `sb_publishable_…` and secret `sb_secret_…` keys | Deprecation "by the end of 2026" [CITED: api-keys docs] | FUT-02; record the dashboard's date |
| `verify_jwt` demands a JWT | Platform check also accepts publishable keys, "passing that check doesn't authenticate the caller" | [CITED: api-keys docs] | `verify_jwt = false` + in-function checks is the stable choice |

**Deprecated/outdated:** `/v1/projects/{ref}/api-keys/legacy` is announced for removal (404 when gone).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The CLI follows symlinked `migrations/`, `functions/`, `config.toml` in a dedicated work dir | Pattern 2 | Use copies verified against the manifest sha256 |
| A2 | `db push --linked` text summary reads "Remote database is up to date." | Pattern 1 | Match only `is up to date.` |
| A3 | Provider Read refreshes managed settings keys | Pattern 4 | `-replace` on revert removes the dependency |
| A4 | `/api-keys` without `reveal` still returns legacy key values | Item 4 | Probe discards `api_key` anyway |
| A5 | Secret digests are hex SHA-256 of the raw value | Item 4 | Drop the digest check |
| A6 | The logging-GUC interaction rules in the D-10 table | Item 6 | Checkpoint shows raw values; operator decides |
| A7 | Hosted `supabase_read_only_user` (or a CLI read-only login role) bypasses RLS | Pitfall 12 | `no-seed` and buckets need `postgres` or the Management API |
| A8 | Dashboard labels "Add user" / auto-confirm | Item 8 | Operator follows what the dashboard shows |
| A9 | Gateway refuses `apikey`-only calls with `verify_jwt` on, and answers 404 for a deleted function | Items 1, 3 | Measured in the same sitting |
| A10 | Direct SQL delete of a bucket is blocked by a Storage trigger | Item 10 | Dashboard deletion is the plan either way |
| A11 | Sign-in with the hook on and its function absent errors | Item 8 | Recorded as observed |
| A12 | First administrator gets a project-scope `admin` grant | Item 8 | Operator chooses the scope |
| A13 | PostgREST applies the anon role's `statement_timeout` per request | Code Examples | The live measurement settles it |

## Open Questions

1. **Which role does the probe's catalog half connect as?** (D-14 "a read-only role")
   - Known: `check-seed.sql` and `storage.buckets` need RLS bypass; pg_roles, pg_proc and `server_version_num` do not.
   - Unclear: whether a read-only role exists on hosted that bypasses RLS and that the operator can log in as.
   - Recommendation: measure on the throwaway with the CLI's read-only login role (`POST /v1/projects/{ref}/cli/login-role {"read_only": true}`, experimental) and with `postgres`; checkpoint the choice. Buckets can move to the Management API either way.
2. **What is staging's `PUBLIC_PROJECT_ID`?** Not recorded anywhere in `infra/`. It goes into the bootstrap, the function secrets, the dev-seed template and 185's frontend. Recommendation: decide before the persistent bootstrap; the canonical `00000000-0000-0000-0000-000000000001` keeps dev-seed's default.
3. **Is staging open for voters at creation?** The anon row read and 185's smoke run need it; 181-R2's default is `false`. Recommendation: `BOOTSTRAP_OPEN_FOR_VOTERS=true` for staging, recorded as an operator decision.
4. **How is `db.postgres-major` seen red?** Not plantable on a project. Recommendation: expectation-side red (uncommitted `config.toml` edit) or the Vitest fixture alone, with the operator's acceptance.
5. **Is the scratch root's state anywhere?** If not, the first scratch sitting re-imports (Pitfall 5).
6. **Does D-23 remove the scratch root directory or only its state?** `scratch/supabase/main.tf:3-4` says "The root is removed once the throwaway project is deleted"; D-23 says the local state is removed. A committed `faults.tf` goes with the directory if it is removed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase CLI | push, link, diff, deploy | ✓ | 2.118.0 | — |
| Docker | `db diff` shadow, function bundling | ✓ | 29.7.2 | `functions deploy --use-api` for bundling only |
| psql | bootstrap (`\bind`, `\getenv`), drift, seed check, probe | ✓ | 17.6 | — |
| Node | probe | ✓ | 24.21.0 | — |
| Terraform | scratch/staging roots | ✓ | 1.16.5 (= pin) | — |
| AWS CLI | staging state bucket, `dns-mail` outputs | ✓ | 2.34.7 | — |
| jq, curl | runbook read-backs | ✓ | 1.7.1, 8.7.1 | — |
| IPv6 route | direct DB connection | ✗ in the agent's shell (`curl -6` → 000) | — | Session pooler (automatic for the CLI) |
| Scratch Terraform state | any scratch apply | ✗ in this worktree | — | Re-import (README Step 2) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** IPv6 (pooler); scratch state (re-import).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (root `catalog:` version), new non-workspace suite |
| Config file | `infra/vitest.config.ts` — Wave 0 |
| Quick run command | `yarn vitest run --config infra/vitest.config.ts` |
| Full suite command | `yarn test:unit` (after chaining `test:unit:infra`), plus `yarn lint:check` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUPA-07 | Each comparison returns PASS on a conforming fixture and FAIL with its own finding on a broken one; source failure → could-not-run | unit | `yarn vitest run --config infra/vitest.config.ts` | ❌ Wave 0 |
| SUPA-07 | Probe green on throwaway, red (every check) after the batched break, green after revert; green on persistent | live, operator-run | `node infra/scripts/probe-hosted.mjs --root infra/envs/<root>/supabase; echo "probe_exit=$?"` | ❌ |
| SUPA-01 | Wrapper refuses a wrong ref; push exit 0; second run "is up to date." exit 0 | live + red control | `infra/scripts/push-migrations.sh <ref>; echo "push_exit=$?"` | ❌ |
| SUPA-01/D-22 | Drift exit 1 with planted DDL, 0 clean; refuses wrong ref / port 6543 | live + red controls | `infra/scripts/check-drift.sh --target linked --workdir <dir>; echo "drift_exit=$?"` | ✅ script, ❌ linked guard |
| SUPA-02/03 | Served settings equal HCL | live (probe) | probe | ❌ |
| SUPA-04/06 | Buckets present; bootstrap twice → same rows; `no-seed` 0 | live | `psql -X -f infra/scripts/bootstrap.sql; echo "boot_exit=$?"` (twice) + counts | ✅ scripts |
| SUPA-05 | Three functions ACTIVE, `verify_jwt` as declared, secrets digests | live (probe) | probe | ❌ |
| SUPA-11 (kept) | Guard still green after the `[functions.*]` widening; self-test covers new rows | unit | `node scripts/assert-hosted-settings-parity.mjs --self-test; echo $?` and `yarn assert:hosted-settings-parity` | ✅ guard |
| D-18 | New template validates and has ≥1001 nominations and no auth users | unit | `yarn workspace @openvaa/dev-seed test:unit` | ❌ test for new template |
| SUPA-13, SUPA-14, OBS-01..03, OBS-05 | Key model, mail headers, dashboard names, redirect cases, gateway shapes, refusals, slot release | manual-only (operator observations with dates) | named output lines in evidence files | — |
| OBS-07 | >1000 rows whole; anon 8 s | live (probe) + one manual timeout measurement | probe; `probe_sleep` calls | ❌ |

### Sampling Rate
- **Per task commit:** the quick Vitest command and `yarn assert:hosted-settings-parity` (exit read directly).
- **Per wave merge:** `yarn lint:check` and `yarn test:unit` (the unit gate needs the shared stack running, project memory).
- **Phase gate:** full unit suite green, `lint:check` green, and a full E2E run (`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`) because `config.toml` and dev-seed change; plus the probe's recorded red and green runs.

### Wave 0 Gaps
- [ ] `infra/vitest.config.ts` and `infra/scripts/probe-hosted.test.ts` — covers SUPA-07 comparisons
- [ ] Root script `test:unit:infra`, chained in `test:unit`; entry in `NON_WORKSPACE_SUITES` (`scripts/assert-unit-test-coverage.mjs:178`)
- [ ] Synthetic fixtures per source (no captured bodies)
- [ ] dev-seed test for the new template

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Admin-API user creation by the operator; password from the password manager via `read -rs`; sign-up off verified by probe |
| V3 Session Management | yes | Access tokens decoded locally, never pasted; claims checked |
| V4 Access Control | yes | `verify_jwt` per function; RLS for anon reads; service-role key kept out of the probe |
| V5 Input Validation | yes | Probe parses JSON defensively; functions' own contracts unchanged |
| V6 Cryptography | yes | SES over STARTTLS (2587), certificate verification kept on the credentialed path (`index.ts:187-192`) |
| V7 Error Handling & Logging | yes | D-10 parameter-logging gate; `identity-callback` opaque 500 |
| V8 Data Protection | yes | Terraform state holds secret values (encrypted bucket / local gitignored); redaction of Management API bodies |
| V14 Configuration | yes | Settings only through Terraform; drift check; probe |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Service-role key in server logs via bound parameters | Information disclosure | D-10 gate; `SET log_parameter_max_length_on_error = 0` (`bootstrap.sql:39`) |
| Secret exposure through Management API responses or fixtures | Information disclosure | Named-field extraction; synthetic fixtures; runbook secret-word filter |
| Password on a command line | Information disclosure | `PG*`/`SUPABASE_DB_PASSWORD` env only; no `--db-url`, no `-v` |
| Pushing to the wrong project | Tampering | Wrapper ref check; drift PG* ref check |
| Unverified function as an oracle | Information disclosure | `identity-callback` fails closed with a fixed body (Item 1); `account-access` answers never depend on existence |
| Spoofed `cf-connecting-ip` choosing a rate-limit bucket | Spoofing | Measure headers before setting `behind_cloudflare` (D-08) |
| Seed users with a published password on a hosted DB | Elevation of privilege | `no-seed` in the probe; dev-seed creates no users |
| Leftover temporary echo endpoints | Information disclosure | Probe fails on unexpected function slugs; drift catches SQL functions |

## Sources

### Primary (HIGH confidence)
- Repository files read this session (cited inline with lines): `identity-callback/index.ts`, `envConfig.ts`, `verifyConfig.ts`; `account-access/index.ts`, `linkIssue.ts`, `deploymentChecks.ts`, `signInLink.ts`, `contract.ts`; `send-email/index.ts`; `00001_initial_schema.sql`; `config.toml`; `infra/scripts/{bootstrap.sql,check-drift.sh,check-seed.sql}`; `infra/modules/supabase/*`; `infra/envs/{staging,scratch}/supabase/*`; `scripts/assert-hosted-settings-parity.mjs`; `scripts/assert-unit-test-coverage.mjs`; `packages/dev-seed/src/*`; supabase-js 2.117.2 `dist/index.mjs`.
- Supabase CLI v2.118.0 source via `gh api` (tag `3a7ba11e`): `apps/cli-go/internal/utils/connect.go`, `internal/utils/flags/db_url.go`, `internal/utils/misc.go`, `pkg/config/config.go`.
- Provider 1.11.0 schema via `terraform providers schema -json`.
- supabase/auth (GoTrue) master: `internal/utilities/request.go` (`IsRedirectURLValid`), `internal/conf/configuration.go:1283`.

### Secondary (MEDIUM confidence)
- [Edge Functions limits](https://supabase.com/docs/guides/functions/limits) — ports 25 and 587 blocked, 400 s paid wall clock
- [Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres) — direct IPv6, pooler formats, transaction-mode limits
- [API keys](https://supabase.com/docs/guides/api/api-keys) — deprecation "by the end of 2026", publishable keys and `verify_jwt`
- [Functions auth](https://supabase.com/docs/guides/functions/auth) — `verify_jwt` default true
- Management API reference: [list functions](https://supabase.com/docs/reference/api/v1-list-all-functions), [api-keys](https://supabase.com/docs/reference/api/v1-get-project-api-keys), [legacy api-keys](https://supabase.com/docs/reference/api/v1-get-project-legacy-api-keys), [postgrest config](https://supabase.com/docs/reference/api/v1-get-postgrest-service-config), [auth config](https://supabase.com/docs/reference/api/v1-get-auth-service-config), [project](https://supabase.com/docs/reference/api/v1-get-project), [login role](https://supabase.com/docs/reference/api/v1-create-login-role), [run a query](https://supabase.com/docs/reference/api/v1-run-a-query)
- [SES SMTP connect](https://docs.aws.amazon.com/ses/latest/dg/smtp-connect.html) — STARTTLS 25/587/2587, TLS Wrapper 465/2465
- [terraform-provider-supabase edge_function_secrets docs](https://github.com/supabase/terraform-provider-supabase/blob/main/docs/resources/edge_function_secrets.md)

### Tertiary (LOW confidence)
- [Supabase CLI SASL troubleshooting](https://supabase.com/docs/guides/troubleshooting/supabase-cli-failed-sasl-auth-or-invalid-scram-server-final-message), [PGBouncer and IPv4 deprecation](https://supabase.com/changelog/17817-pgbouncer-and-ipv4-deprecation), [discussion #20955](https://github.com/orgs/supabase/discussions/20955) — search results, consistent with the source reading

## Metadata

**Confidence breakdown:**
- Repository facts (functions, scripts, guard, dev-seed, schema): HIGH — read with lines this session
- CLI connection and link behaviour: HIGH — read in the pinned version's source
- Hosted behaviour (gateway, headers, logging settings, key model, redirect version): LOW-MEDIUM — that is what the phase measures
- Pitfalls: MEDIUM-HIGH — most rest on read source; A1-A13 flagged

**Research date:** 2026-10-26
**Valid until:** 2026-11-09 for hosted-platform claims (fast-moving: keys, CLI); repository facts until the next change to the cited files.
