# Phase 181: Deployability and Migration Model - Context

**Gathered:** 2026-10-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Without any cloud account, the application and the schema are made ready to deploy. The server reports its
health and its build, refuses to start half-configured, behaves correctly behind a reverse proxy, and passes
`SIGTERM` to Node. The single migration is frozen as a named baseline with append-only numbered migrations
after it (SUPA-10). A bootstrap script and a seed check exist and are shown locally.

The phase closes SUPA-10 and builds toward INFRA-04, INFRA-05, INFRA-06, INFRA-09, SUPA-04, SUPA-05, SUPA-06
and PIPE-07. Nothing is pushed to a hosted project here; that is phase 184. Pipeline wiring is phase 187.

All decisions below come from the operator's fill of
`.planning/workstreams/deployment/v2.17-181-183-DISCUSSION-POINTS.md` on 2026-10-11. Every decision of this
phase took its ★ RECOMMENDED option; one note was added (D-16).

</domain>

<decisions>
## Implementation Decisions

### Baseline freeze and migration model (SUPA-10)

- **D-01 (181-1):** The freeze is a committed hash manifest: each frozen migration with its sha256, the
  baseline's name and the commit it came from. The guard recomputes the hashes and accepts added entries only.
  Known and accepted: an edit to a file and its manifest line in one commit passes the guard and shows in
  review. — **Reversibility:** one-way — after the first hosted push (phase 184) the recorded baseline version
  cannot be re-pushed; `db push` skips a version it has recorded.
- **D-02 (181-1):** With the freeze, `yarn schema:regenerate` is removed or made to refuse. Frozen files leave
  prettier and `assert:comment-hygiene`, so a later rule change cannot redden a file nobody may edit. The guard
  gets injectable paths and a fixture, so it is seen failing without editing the real file.
- **D-03 (181-2):** `schema/` stays the hand-edited current view of the schema. After the freeze each schema
  change is a `schema/` edit plus a numbered migration in one commit. Byte parity is replaced by an equivalence
  check between two built databases (one from `schema/`, one from the migrations). That check needs a running
  stack, so it sits outside the Node-only `lint:check` chain. The method that covers grants and policies is a
  research question. The guards that read `schema/` as the current schema
  (`assert-rpc-return-nullability.mjs`, `assert-grant-permission-enum.mjs`) keep working unchanged.
- **D-04 (181-3):** The cutover commit is after the v2.16 stream's phase 177.1 lands in place. v2.16's phases
  177 and 177.1 keep their planned in-place mechanics; 178 and 179 append. Criterion 4 of this phase and the
  first persistent push (184) wait for 177 and 177.1; the rest of this phase does not wait. The freeze is one
  commit both branches contain, carrying the bucket insert and the rewritten guard. Until v2.16 has the new
  guard, its `schema:regenerate` still rewrites `00001`. — **Reversibility:** one-way — binds the v2.16 stream
  from that commit on.
- **D-05 (181-4):** Appended migrations use a five-digit sequence continuing the baseline
  (`00002_<name>.sql`). The guard rejects duplicate or non-increasing versions. A stream that has not pushed
  renumbers at merge. — **Reversibility:** costly — a rename after a hosted push changes recorded versions.
- **D-06 (pre-freeze list):** These land in `schema/` and the single migration before the freeze: the bucket
  insert (D-07); the comment corrections (D-08); and the schema change of phase 182 that gives a signed-out
  reader of a project not open for voters the `analytics` member (ruling 182-12, owned and written by phase
  182). The plan that freezes depends on all three.
- **D-07 (181-5):** Both buckets (`public-assets`, `private-assets`) are inserted in `schema/400-storage.sql`
  with the properties the `[storage.buckets.*]` blocks of `config.toml` declare, and the blocks are kept.
  Whether the CLI tolerates the existing rows is measured before the freeze. If it does not, the blocks are
  deleted.
- **D-08 (things the freeze makes permanent):** Comments that describe manual steps the bootstrap replaces
  (for example `107-feedback.sql`: "sets it once in the SQL editor") are corrected before the freeze.
  `schema/900-test-helpers.sql` stays in the baseline; its removal is recorded as a future appended migration.

### Bootstrap script, seed check, drift check (SUPA-06, SUPA-10)

- **D-09 (181-6):** The bootstrap is one SQL file run by `psql` as `postgres` over a direct connection, with
  values taken from the operator's environment at run time. The key is never passed with `-v`, because it would
  sit on the command line. The script holds no secret and is idempotent (criterion 5: run twice, one account,
  one project, the `storage_config` row and `behind_cloudflare`).
- **D-10 (181-6 sub-rulings):** The account id is fixed at `00000000-0000-0000-0000-000000000001`, because
  dev-seed's `ensureProject` hard-codes it. The bootstrap also creates the `app_settings` row (with
  `open_for_voters`), though SUPA-06 does not list it. The first admin is not created by the bootstrap; it is a
  documented one-off step.
- **D-11 (181-7):** The drift check and the seed check are committed scripts that set their own exit status.
  Each is shown once locally and recorded: reset without seed, bootstrap twice, count rows, seed check green;
  the seeded stack as the seed check's red control; planted DDL as the drift check's red. Exit status is read
  directly, never through a pipe. No CI job is added here; pipeline wiring stays in phase 187.

### Server deployability (INFRA-04, INFRA-05, INFRA-06, INFRA-09)

- **D-12 (181-8):** Health is `routes/api/health/+server.ts`, returning a status and the build id. It answers
  200 with Supabase unreachable. `kit.version.name` is set from a Docker build argument, so the SHA is also at
  `/_app/version.json`; with no argument the name stays time-based as today.
- **D-13 (181-9):** The start-up check is an `init` export in `hooks.server.ts`, on production start only. One
  error names every unset variable. Required: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`,
  `PUBLIC_PROJECT_ID`, `ORIGIN`. Settled by reading adapter-node 5.5.7: the mechanism is `ORIGIN` (kit 2.70.3
  has no `paths.origin`), and with `ORIGIN` set the protocol and host headers are never read. Phase 182 adds
  its own entry to this check (`posthog` with no key fails it).
- **D-14 (181-10):** A diagnostics response, off unless a deployment variable enables it, returns the resolved
  client address and the forwarded headers the container received. It gives criterion 3 its observable and
  phase 185 the frontend half of OBS-04. It must be shown to be off by default. No visitor address is written
  to a log.
- **D-15 (181-11):** `CMD` in the production image takes the exec form (a JSON array), so Node is the
  container's first process; `SIGTERM` delivery is still observed. The proxy topology check is a committed
  compose file plus a scripted check with negative controls, run on demand, outside the gate suite. Phase 185
  re-runs it when the CDN changes the proxy depth.

### Templates

- **D-16 (181-12):** This phase changes variables only: `PUBLIC_PROJECT_ID` and the proxy variables are added
  to `render.example.yaml` and the root `docker-compose.dev.yml`, and the proxy variables to `.env.example`.
  Retiring the orphan `apps/frontend/docker-compose.dev.yml` and the wording stay with phase 189 (DOCS-07).
  Operator's note: phase 189 also checks whether the root compose file can be retired, and whether the test
  that reads it is needed. That note is recorded in the roadmap under phase 189 and is not acted on here.

### Claude's Discretion

- The file names and locations of the manifest, the guard fixture, the bootstrap SQL and the two check scripts.
- The name of the variable that enables the diagnostics response, and its route.
- The shape of the health response body beyond "a status and the build id".
- The reverse proxy used in the local topology compose file.

</decisions>

<research_amendments>
## Amendments after research (2026-10-11)

`181-RESEARCH.md` corrected parts of this file and raised questions for the operator. Each question below is
planned on its recommended answer. The operator has not ruled on them; they are listed for the operator in
`.planning/workstreams/deployment/v2.17-181-183-RESEARCH-FOLLOWUPS.md`. Where an amendment and a decision above
differ, the amendment wins.

- **A-01 (D-04, fact corrected):** The v2.16 branch has changed the schema since the branch point: its phase
  177 is executed (19 files under `apps/supabase`, the regenerated `00001` among them); 177.1 is not started.
  The manifest holds one baseline hash, so before the freeze one branch merges the other's `schema/`. The two
  git commands are run again before the freeze is planned in detail.
- **A-02 (D-01, D-04):** A commit cannot hold its own hash. The pre-freeze changes (D-06) land in earlier
  commits; the freeze commit leaves the baseline bytes unchanged, and the manifest names the freeze commit's
  parent as the commit the baseline came from.
- **A-03 (shared local stack):** This worktree and the v2.16 worktree use the same local Supabase instance
  (`project_id = "openvaa-local"`, the same ports). Every database observation of this phase runs on an
  isolated CLI instance (temporary work directory, own project id and ports). The E2E gate needs the real
  ports and so needs a window agreed with the v2.16 session; that is a checkpoint.
- **A-04 (D-03):** The equivalence check is a `pg_dump --schema-only` text comparison of two CLI-built
  databases, with `--restrict-key` pinned, plus catalog queries for what `pg_dump` omits (role settings,
  extensions, named data rows). `supabase db diff` is not used for it: it does not capture column privileges,
  rows, comments or role settings.
- **A-05 (D-11):** `supabase db diff` exits 0 with or without a difference, so the drift script sets its own
  status from the output and a migration-history query. Whether the diff is empty on a clean build of this
  baseline is measured first.
- **A-06 (D-07, criterion 5):** A local `db reset` seeds buckets from `config.toml` after the reset, so
  listing buckets on the normal stack proves nothing about the migration. The bucket observation uses a
  database-only build.
- **A-07 (D-03):** Two tests read the baseline as the current schema and are re-pointed at `schema/` in the
  freeze work: `permittedKeys.test.ts` and `allowedTeardownTables.test.ts`.
- **A-08 (D-02, D-09):** The baseline is already in `.prettierignore`. Appended migrations and the bootstrap
  SQL file are added to it (the SQL plugin cannot parse psql meta-commands). `assert-comment-hygiene.mjs` has
  no exclusion mechanism and gets a named constant for the frozen files.
- **A-09 (D-10, facts corrected):** `open_for_voters` is a column of `public.projects`, not of `app_settings`.
  The bootstrap takes it from the environment, defaults it to `false`, and never changes it on a second run.
  `storage_config` holds two rows per deployment (`supabase_url`, `service_role_key`).
- **A-10 (SUPA-05):** `config.toml` has no `[functions.*]` section today. `verify_jwt` for
  `identity-callback` is declared `false`, following the milestone research and the function's own comments.
  This changes how the local stack serves that function.
- **A-11 (D-14, criterion 3):** The application issues no absolute redirect of its own, so the diagnostics
  response also reports `url.origin`, and the login form post is followed through the proxy.
- **A-12 (D-16):** The proxy depth on Render is unmeasured. `render.example.yaml` gets the variables with a
  comment that says so.
- **A-13 (D-13, facts):** An empty or invalid `ORIGIN` is refused by adapter-node before `init` runs; only an
  absent one reaches `init`. `kit.version.name` accepts an empty string, so an unset build argument is coerced
  to `undefined`. On `SIGTERM` adapter-node drains but never calls `process.exit`; whether the process exits
  is measured.
- **A-14 (environment):** This worktree has no `node_modules`, and the shell's default Node is below
  `engines`. Executors run `yarn install` under Node 24.21.0 (installed under nvm) first.

</research_amendments>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Rulings and scope
- `.planning/workstreams/deployment/v2.17-181-183-DISCUSSION-POINTS.md` — the decisions of this phase with
  their evidence and rejected options; "Rulings as read, 2026-10-11" at the end is authoritative
- `.planning/workstreams/deployment/v2.17-DISCUSSION-POINTS.md` — the 28 milestone rulings (C1 for the
  migration model, A5 for the templates)
- `.planning/workstreams/deployment/ROADMAP.md` § Phase 181 — goal, five success criteria, standing rules
- `.planning/workstreams/deployment/REQUIREMENTS.md` — SUPA-10, SUPA-04, SUPA-05, SUPA-06, INFRA-04, INFRA-05,
  INFRA-06, INFRA-09, PIPE-07

### Research
- `.planning/workstreams/deployment/research/SUMMARY.md` — the phase sketch and the research flags
- `.planning/workstreams/deployment/research/PITFALLS.md` — `db push` skipping a recorded version; the single
  regenerated migration
- `.planning/workstreams/deployment/research/ARCHITECTURE.md` and `STACK.md` — adapter-node, the Docker image

### Code named by the decisions
- `scripts/assert-schema-migration-parity.mjs` — the guard that is rewritten
- `scripts/assert-rpc-return-nullability.mjs`, `scripts/assert-grant-permission-enum.mjs` — read `schema/` as
  the current schema
- `apps/supabase/supabase/schema/400-storage.sql`, `107-feedback.sql`, `900-test-helpers.sql`,
  `000-enums.sql`; `apps/supabase/supabase/config.toml` (`[storage.buckets.*]`, the JWT setting of
  `identity-callback`)
- `apps/frontend/src/hooks.server.ts`, `apps/frontend/svelte.config.js`, `apps/frontend/Dockerfile`
- `render.example.yaml`, `docker-compose.dev.yml`, `.env.example`
- `packages/dev-seed` — `ensureProject` and the fixed account id

Paths under `apps/supabase` and `scripts/` are as the discussion document cites them; the researcher confirms
each by content before a plan relies on it.

</canonical_refs>

<code_context>
## Existing Code Insights

Taken from the discussion document, whose grounding was three read-only analyses of the tree at `a5a1cf6e3`.
The orchestrator did not re-verify them; the researcher does.

### Reusable Assets
- The `assert:*` guard family in `lint:check`: Node-only scripts with self-tests. The rewritten parity guard
  follows it.
- API routes already skip the session gate, so `routes/api/health` needs no change to the hooks.
- `zod` is already a dependency.

### Established Patterns
- `main.yaml` has `fetch-depth: 0` only in `secret-scan`, which is why a git-comparison guard was not chosen.
- `private.deployment_settings` is writable only by the table owner (`REVOKE ALL … FROM PUBLIC, anon,
  authenticated, service_role`), which is why the bootstrap runs as `postgres`.
- Nothing in the frontend calls `getClientAddress()` today.
- The baseline is about 377 KB.

### Integration Points
- The v2.16 stream (`feat/entity-signup-multi-grant`): see A-01 above. The freeze commit must be in both
  branches.
- Phase 182 adds a schema change before the freeze (D-06) and variables to the same templates and to the
  start-up check.
- Phase 184 pushes the baseline; phase 185 re-runs the topology check and reads the diagnostics response.

</code_context>

<specifics>
## Specific Ideas

- A guard, a check or a probe counts once it has been seen failing (standing rule of the roadmap). Every check
  this phase adds needs a planned red control.
- The phase changes the application, so it closes on a green local E2E suite; a test that did not run counts
  as failed.
- `tests/scripts/e2e-run.sh` is not edited (the v2.16 stream changed it).

</specifics>

<deferred>
## Deferred Ideas

- Retiring the orphan `apps/frontend/docker-compose.dev.yml`, and the operator's question whether the root
  `docker-compose.dev.yml` and its test can go too — phase 189 (recorded in the roadmap).
- Removing `schema/900-test-helpers.sql` from the schema — a future appended migration.
- A CI job that repeats the drift and seed checks on a fresh stack — not asked for; pipeline wiring is 187.

### Reviewed Todos (not folded)
The todo matcher returned only keyword matches unrelated to this phase's scope (UI styling, auth adapter
refactors). None was folded.

</deferred>

---

*Phase: 181-Deployability and Migration Model*
*Context gathered: 2026-10-11*
