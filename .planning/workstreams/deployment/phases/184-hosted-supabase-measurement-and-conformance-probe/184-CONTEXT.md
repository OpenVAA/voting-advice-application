# Phase 184: Hosted Supabase Measurement and Conformance Probe - Context

**Gathered:** 2026-10-26
**Status:** Ready for planning

<domain>
## Phase Boundary

The frozen schema, the two storage buckets, the three Edge Functions with their secrets and the bootstrap rows
are on the hosted Supabase project. What the project actually serves is measured and recorded with dates, and a
conformance probe fails by name when any of it drifts. The order is: the throwaway project
`suxeqyhafjueinxnojge` (`openvaa-scratch`) first, then the persistent project `cofbsatfrdysyphajsky`
(`openvaa-staging`, eu-north-1).

The phase closes SUPA-01 to SUPA-07, SUPA-13, SUPA-14, OBS-01, OBS-02, OBS-03, OBS-05 and OBS-07. It builds
toward OBS-04, OBS-09, OBS-10 and PIPE-06. No AWS frontend resource exists in this phase (that is 185), and no
workflow is added (that is 187).

The decisions below come from the operator's fill of `184-DISCUSSION-POINTS.md` on 2026-10-26. Every decision
took its ★ RECOMMENDED option. C-05 was ticked explicitly and carries a note (D-12).

**Settled by earlier rulings, not reopened:** Terraform's `supabase_settings` is the only writer of settings,
and `config push` is used nowhere (C4, 183 D-15). The operator applies, and the agent holds no credential
(183 D-10). Port 2587 is tried first (C6). `open_for_voters` comes from the environment, default `false`
(181-R2). The bootstrap runs as `postgres` over psql (181 D-09). Function code ships with the CLI, and the
secrets go through Terraform's `supabase_edge_function_secrets` (C7, research ARCHITECTURE.md). The throwaway
project is deleted after this phase (183 D-12). Nothing is seeded per run from CI (E1).

</domain>

<decisions>
## Implementation Decisions

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

### Post-research amendments (2026-10-26)

Research (`184-RESEARCH.md` § Corrections) showed that some factual premises behind the decisions above were
wrong. The decisions stand, read with these facts. Where a fact leaves a real choice open, it becomes a
`checkpoint:decision` in the plans, with the recommendation named. These are **not** pre-ruled.

- **D-04:** `identity-callback` already fails closed (`index.ts:157`, catch at `:390-397`). No fix is needed. The
  probe asserts the refusal.
- **D-05:** The SES account has production access (183-19), so any recipient works and no sandbox applies. The
  From address is fixed to `noreply@staging.openvaa.org`. Supabase blocks 25 and 587 for Edge Functions, and
  `secure: false` cannot speak 465, so in practice only 2587 can deliver. The OBS-05 failed-send observation
  therefore needs one **deliberate** failing attempt (for example 587) planned on purpose. A delivery that fails on
  2587 is a stop-and-ask checkpoint.
- **D-09:** supabase-js already sends `Authorization: Bearer <anon>` by default. The parity guard
  (`scripts/assert-hosted-settings-parity.mjs:600-608`) covers only `[api]` and `[auth*]`, so it must be widened
  to `[functions.*]` before it can take the `verify_jwt` row.
- **D-11:** No first-administrator procedure is written down anywhere (`bootstrap.sql:7` only says it is a
  separate step). This phase writes it into the staging runbook as it performs it.
- **D-18:** No dev-seed template puts more than 1000 rows in one table, and dev-seed creates no auth users. Planning
  adds a minimal template with at least 1001 anon-readable rows. Anon reads also need `open_for_voters = true` on
  staging's project. Open question: checkpoint (recommended: open staging for voters, which 185's smoke run needs
  anyway).
- **D-20:** The README already has a dated table named **"Observations"**, right after "Not yet observed". Reuse
  it; do not add a third table.
- **D-23 / scratch root:** There is no scratch Terraform state in this worktree, and the root has no `import`
  block, so a plan would create a new project. The first scratch sitting must locate the old state or re-import
  the project.
- **Linking:** `supabase link` in `apps/supabase` writes `.temp/*-version` files that change the shared local
  stack's images. Push, drift check and deploys run from a dedicated linked work directory.
- **Open questions, raised as checkpoints with recommendations:**
  - **Probe catalog role.** `check-seed.sql` and `storage.buckets` sit behind RLS, so a read-only role sees false
    findings. Recommended: move the bucket check to the Management API or the public storage API.
  - **Staging `PUBLIC_PROJECT_ID`.** Not recorded anywhere. Record it from the bootstrap output.
  - **`open_for_voters`.** See D-18.
  - **Making the `db.postgres-major` check fail** (a project's major version cannot be planted). Recommended: an
    uncommitted override of the expected value for the red run.
  - **Scratch state.** Locate it or re-import.
  - **D-23's scope.** Remove only the scratch state, or the whole scratch root directory (its `main.tf` header says
    the root is removed).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and rulings
- `.planning/workstreams/deployment/ROADMAP.md` § Phase 184 — goal, success criteria, research flag, notes
- `.planning/workstreams/deployment/REQUIREMENTS.md` — SUPA-01 to SUPA-07, SUPA-13, SUPA-14, OBS-01 to OBS-05,
  OBS-07, OBS-09, OBS-10, PIPE-06, FUT-02
- `.planning/workstreams/deployment/STATE.md` — open blockers [181-11] (the seven `SHOW`s), [181-12] (the drift
  check never run linked), [183] (hooks on with no functions, SMTP untried, oauth flags no longer sent)
- `.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/184-DISCUSSION-POINTS.md`
  — the operator's fill, with the re-verified factual baseline table
- `.planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/183-CONTEXT.md` — D-10
  (the operator applies), D-12 (throwaway deleted), D-14 (parity guard shape), D-15 (only writer of settings)
- `.planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/183-SECURITY.md` —
  TR-183-01/02 and AR-183-01/02, to be re-transferred (D-21)

### Research
- `.planning/workstreams/deployment/research/SUMMARY.md` — D7 (SES port), the 185 topics measured here
- `.planning/workstreams/deployment/research/ARCHITECTURE.md` — F2 (hook before its function), F5 (keys), C7
  (function secrets through Terraform)
- `.planning/workstreams/deployment/research/PITFALLS.md` — Pitfall 7 (legacy key deprecation)
- `.planning/workstreams/deployment/research/STACK.md`

### Code and config
- `apps/supabase/supabase/migrations.manifest.json` — the frozen baseline and its sha256
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` — `anon` timeout (line ~92), the send-email hook
  that sends no mail (~2150, ~2241)
- `apps/supabase/supabase/config.toml` — `major_version`, the `[functions.*]` `verify_jwt` entries
- `apps/supabase/supabase/functions/{account-access,identity-callback,send-email}/`
- `infra/envs/staging/supabase/` (tfvars, README with the "Not yet observed" table) and `infra/envs/scratch/supabase/`
- `infra/modules/supabase/hosted-settings.json` — the HCL JSON of settings, `max_rows`
- `infra/scripts/bootstrap.sql`, `infra/scripts/check-drift.sh`, `infra/scripts/check-seed.sql`
- `packages/app-shared/src/settings/staticSettings.ts` — `dataAdapter.pageSize`
- `packages/dev-seed/` — templates for the E1 smoke dataset (D-18)

### Todos
- `.planning/todos/pending/2026-10-11-migrate-to-supabase-publishable-keys-after-streams-merge.md` — FUT-02, gets
  the observed key model and retirement date (D-12)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The 183 parity guard: its Node-built-ins-only shape and its sources of expected values are the template for
  `probe-hosted.mjs` (D-13, D-16).
- `check-drift.sh` and `check-seed.sql`: already seen locally. The probe runs the seed check as a subprocess,
  and the push wrapper calls the drift check.
- `bootstrap.sql`: idempotent, run as `postgres` over psql, takes `BOOTSTRAP_*` variables.

### Established Patterns
- Evidence files under `<phase>/evidence/<phase>-NN-*.md`, with dates (183).
- The operator applies Terraform. The agent prepares the change and verifies the read-back.
- Gate exit statuses are read directly, never through a pipe.

### Integration Points
- `infra/envs/{staging,scratch}/supabase` roots: the SMTP object, the function secrets, the settings overrides for
  the red run.
- `config.toml` `[functions.account-access]` and the parity guard's table (D-09).
- `infra/envs/staging/supabase/README.md`: the "Observed" table (D-20).

</code_context>

<specifics>
## Specific Ideas

- The ports are tried in the order 2587, 587, 465, 25. The first that delivers wins.
- A red probe run counts only when every check fails with its own planted cause, never with a cascade.
- The first administrator's password lives only in the operator's password manager.

</specifics>

<deferred>
## Deferred Ideas

- The move to publishable keys (FUT-02): first work after v2.16 and v2.17 merge, per the existing todo.
- The four 183 security items: phase 187 (D-21).
- The frontend container's header record (OBS-04 remainder): phase 185.

### Reviewed Todos (not folded)
- Candidate answer store migration, app header styling after the runes update, moving Supabase auth code to the
  adapters, the `tweened` ban and the `.cjs` store guard. Each matched on a keyword only, and each is frontend
  work outside this phase.

</deferred>

---

*Phase: 184-hosted-supabase-measurement-and-conformance-probe*
*Context gathered: 2026-10-26*
