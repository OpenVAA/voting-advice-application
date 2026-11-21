---
phase: "181"
slug: "deployability-and-migration-model"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
threats_total: 63
threats_closed: 63
unregistered_flags: 5
audited_at_head: fd731f7cc
created: "2026-10-21"
---

# Phase 181 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register source: the `<threat_model>` blocks of 181-01..19-PLAN.md (62 numbered threats, T-181-01..62, plus the shared supply-chain entry T-181-SC, which every plan declares and which is counted once).
> Verification depth: ASVS L1 (mitigation present in the cited file or evidence record). Config: `workflow.security_asvs_level` = 1, `workflow.security_block_on` = high.
> Every status below was checked against the tree at `fd731f7cc`. The tree the closing E2E gate ran on (`4c9fba56b`) and the tree the local gates ran on (`58cf7a564`) both equal HEAD outside `.planning/` (`git diff --quiet` exit 0), and the frozen baseline and its manifest are unchanged since the freeze commit `12c98aa5c`.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| package registry → workstation | `yarn install` restores the dependency set the committed lockfile names | third-party code |
| harness → Docker host | `isolated-instance.sh` starts and removes containers on a host that runs other Supabase stacks | container lifecycle |
| harness / CLI output → evidence | CLI status output can carry the local anon and service-role keys | local credentials |
| client → (proxy →) Node server | `Host`, `Origin`, `X-Forwarded-For` are caller-set; the proxy appends one address | request metadata, client address |
| deployment environment → Node server | Configuration arrives as environment variables; a missing one must stop the start | configuration |
| load balancer → Node server | Unauthenticated health requests with no cookie or forwarded header | none |
| Node server → Supabase | The health answer must not depend on this hop | none |
| build pipeline → image | The build argument names the commit | public commit sha |
| template → deployment | A deployer copies `render.example.yaml` / `.env.example`; a default becomes running config | configuration |
| gateway → Edge Function | `verify_jwt = false` passes unauthenticated requests to `identity-callback` | provider id_token |
| committer → frozen migrations | A change to a pushed migration is skipped silently by `db push` | schema DDL |
| guard configuration → scanned files | An exclusion removes files from a gate | source paths |
| `schema/` → migrations | After the freeze both are hand-written in one commit and can disagree | schema DDL, privileges, policies |
| migration → hosted database | The baseline is what phase 184 pushes | schema, bucket rows |
| operator shell → hosted database | The bootstrap carries the service-role key into a table | service-role key |
| local seed → hosted database | `seed.sql` holds known passwords and the public demo key | credentials |
| repository → deployed database | The database can hold a schema or history the repository does not describe | schema, migration history |
| image registry → workstation | The proxy image is pulled from a public registry | third-party image |
| container runtime → Node process | The stop signal must reach the process holding open requests | signals |
| script key → database it connects to | `check:*` keys run against whatever the `PG*` variables name | database access |
| this session → shared local stack | A stop/reset here acts on the database another session uses | local database state |
| this stream ↔ v2.16 stream | Both regenerate the same baseline until the freeze | schema files |
| documentation → developer | A document teaching the old model leads to an edit of the frozen baseline | guidance |
| scratch checkout → working tree | An edit of the real baseline must not leak into the shared tree | baseline bytes |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation / Evidence | Status |
|-----------|----------|-----------|----------|-------------|-----------------------|--------|
| T-181-01 | Tampering | `yarn install` | medium | mitigate | `yarn install --immutable`; `evidence/181-01-toolchain.md` (`INSTALL_EXIT=0`, `TREE_CLEAN_BEFORE_INSTALL=yes`, `TREE_CLEAN_AFTER_INSTALL=yes`) | closed |
| T-181-02 | Information disclosure | evidence records | low | accept | See Accepted Risks Log AR-181-01. Toolchain record holds version strings and statuses only; JWT-shaped scan of all 20 evidence files: 0 matches | closed |
| T-181-03 | Denial of service | `isolated-instance.sh start`/`stop` | high | mitigate | `apps/supabase/scripts/isolated-instance.sh`: `refuse()` → status 4; `assert_isolated_project_id` (refuses `openvaa-local` and the source config's id), `assert_outside_repo` (work dir under `$REPO_ROOT`), port loop (`port_has_listener`, shared-stack ports) all run before the CLI `start`/`db start`; every acting CLI call carries `--workdir "$STATE_DIR"`; no `--all`. `evidence/181-02-harness-spike.md` `SHARED_STACK_UNTOUCHED=yes` | closed |
| T-181-04 | Information disclosure | spike record | medium | mitigate | `cmd_env` prints `PG*`/`ISO_*` lines only, no API key; `print_redacted` drops key/secret lines; JWT scan of `evidence/181-02-harness-spike.md`: 0 | closed |
| T-181-05 | Tampering | temporary state directory | low | accept | See AR-181-02 | closed |
| T-181-06 | Spoofing | origin from `Host` when `ORIGIN` unset | high | mitigate | `apps/frontend/src/lib/server/startup/requiredEnv.ts` `REQUIRED_ENV` includes `'ORIGIN'`; `apps/frontend/src/hooks.server.ts` `export const init` throws when `missingRequiredEnv(...)` is non-empty (skipped only for `dev`/`building`) | closed |
| T-181-07 | Information disclosure | start-up error | medium | mitigate | `missingRequiredEnv` returns names only (`analyticsStartupProblems` also maps to `variable`); `requiredEnv.test.ts` asserts `missing` does not contain any value of the env | closed |
| T-181-08 | Information disclosure | `/api/diagnostics` left on | medium | mitigate | `apps/frontend/src/routes/api/diagnostics/+server.ts`: `error(404)` unless `isEnabled(env.DEPLOYMENT_DIAGNOSTICS)`; header allow-list `FORWARDING_HEADERS` (no `cookie`/`authorization`); `server.test.ts` 404 cases (unset, empty, `false`, `1`) first, credential-header exclusion test. Note: `isEnabled` accepts `true` case-insensitively and trimmed (`' TRUE '` is test-pinned) rather than byte-exact; not a bypass, the switch is deployer-set | closed |
| T-181-09 | Information disclosure | visitor address in a log | medium | mitigate | No `console`/`log` call in the diagnostics handler; `server.test.ts` "writes nothing to the console" spies on the four console methods | closed |
| T-181-10 | Denial of service | health route depending on an upstream | high | mitigate | `apps/frontend/src/routes/api/health/+server.ts` `GET()` takes no event, returns `{status:'ok', build: version}`; `server.test.ts` trapped-event case (`locals`, `getClientAddress` throw); `appGateHandle` skips API routes, so no session round trip | closed |
| T-181-11 | Information disclosure | build id in public response | low | accept | See AR-181-03 | closed |
| T-181-12 | Denial of service | `SIGTERM` not reaching Node | medium | mitigate | `apps/frontend/Dockerfile` production stage `CMD ["node", "./apps/frontend/build/index.js"]` (exec form); observed in `evidence/181-14-sigterm.md` (`sigterm.pid1` PASS) | closed |
| T-181-13 | Spoofing | spoofed `X-Forwarded-For` at unmeasured depth | medium | mitigate | `render.example.yaml`: `ADDRESS_HEADER # Check` = `x-forwarded-for`, `XFF_DEPTH # Check` = `'1'`, with the "proxy depth on Render has not been measured" comment | closed |
| T-181-14 | Spoofing | unauthenticated `identity-callback` endpoint | medium | accept | See AR-181-04 | closed |
| T-181-15 | Denial of service | live `ORIGIN` copied from `.env.example` | medium | mitigate | `.env.example`: `# ORIGIN=`, `# ADDRESS_HEADER=`, `# XFF_DEPTH=` commented with a KEEP THEM COMMENTED OUT note; `packages/dev-seed/tests/deploymentTemplates.test.ts` "has no live line for %s" over `PROXY_VARIABLES` | closed |
| T-181-16 | Tampering | frozen migration edited after push | high | mitigate | `scripts/assert-schema-migration-parity.mjs` `checkFrozenMigrations`: `createHash('sha256')` from `node:crypto`, rule `file-hash` → `EDITED FROZEN MIGRATION`; `selfTestFrozenChecker` withholds the verdict when a fixture stops producing its findings; `lint:check` chain includes `yarn assert:schema-migration-parity`. Run at audit: exit 0, 16 fixtures, 15 rules | closed |
| T-181-17 | Tampering | file and manifest line edited in one commit | medium | accept | See AR-181-05 | closed |
| T-181-18 | Repudiation | guard pointed at a fixture | medium | mitigate | `MIGRATIONS_DIR`/`MANIFEST_FILE` are constants; only `--write`/`--self-test` flags exist; `package.json` `assert:schema-migration-parity` = `node scripts/assert-schema-migration-parity.mjs`; `schemaMigrationFreezeGate.test.ts` asserts the exact command and lint:check membership | closed |
| T-181-19 | Tampering | exclusion silently widening | medium | mitigate | `scripts/assert-comment-hygiene.mjs` `FROZEN_MIGRATIONS_PREFIX = 'apps/supabase/supabase/migrations/'` with `startsWith`; fail-closed when `frozenMigrations.length === 0`; summary clause "applied migrations excluded by prefix"; `evidence/181-07-hygiene-exclusion-red.md` | closed |
| T-181-20 | Repudiation | test green on an unapplied function body | medium | mitigate | `permittedKeys.test.ts` (`SCHEMA_SQL`) and `allowedTeardownTables.test.ts` (`BULK_OPERATIONS_SCHEMA_FILE`) both read `schema/501-bulk-operations.sql`; built-database equivalence via `check-schema-equivalence.sh` (T-181-27) | closed |
| T-181-21 | Elevation of privilege | `private-assets` created public | high | mitigate | `schema/400-storage.sql` and baseline `00001_initial_schema.sql`: `INSERT INTO storage.buckets ... ('private-assets','private-assets', false, 524288000)`; `evidence/181-08-buckets.md` reads `private-assets\|f` and the public route answers "Bucket not found". Residual note: `ON CONFLICT (id) DO NOTHING` leaves a pre-existing row unchanged | closed |
| T-181-22 | Denial of service | hosted project with no buckets | high | mitigate | Zero-row control `evidence/181-02-harness-spike.md` `BUCKET_ROWS_UNCHANGED_TREE=0`; after insert on a database-only build `evidence/181-08-buckets.md` `BUCKET_ROWS_DB_ONLY=2` | closed |
| T-181-23 | Information disclosure | service-role key in bucket record | medium | mitigate | JWT-shaped and `sb_secret_`/`sb_publishable_` scan of `evidence/181-08-buckets.md`: 0 | closed |
| T-181-24 | Spoofing | start without `ORIGIN` | high | mitigate | `evidence/181-09-production-start.md` `MISSING_ORIGIN_EXIT=1`, message names `ORIGIN`; empty `ORIGIN=` refused by adapter-node (status 1) | closed |
| T-181-25 | Denial of service | health failing when Supabase unreachable | high | mitigate | `evidence/181-09-production-start.md` `STUB_REQUESTS_FROM_HEALTH=0` vs `STUB_REQUESTS_FROM_ROUTE=6`, `UPSTREAM_CONNECT_CURL_EXIT=7`, `HEALTH_SUPABASE_UNREACHABLE_HTTP=200`; `supabaseHandle` constructs the client without a network call | closed |
| T-181-26 | Information disclosure | value in start-up error | medium | mitigate | `evidence/181-09-production-start.md` "No value in any output" (grep -F of each given value over all start outputs) | closed |
| T-181-27 | Elevation of privilege | grant/policy lost between `schema/` and migration | high | mitigate | `apps/supabase/scripts/check-schema-equivalence.sh`: schema-only `pg_dump` per side, `diff -u`, exit 1 on difference; `evidence/181-10-equivalence.md` `RED_COLUMN_GRANT_EXIT=1`, `RED_POLICY_EXIT=1` | closed |
| T-181-28 | Repudiation | empty comparison reported equal | medium | mitigate | `census_and_floor` → `FLOOR:` fatal status 2 (no `CREATE TABLE public.`, or under `MIN_TABLES`/`MIN_POLICIES`/`MIN_FUNCTIONS`); `RED_FLOOR_EXIT=2` | closed |
| T-181-29 | Tampering | bucket made public / role setting changed | medium | mitigate | Catalog queries appended to each snapshot: `pg_db_role_setting`, `pg_extension`, rows of `storage.buckets`, `private.deployment_settings`; `RED_BUCKET_ROW_EXIT=1`, `RED_ROLE_SETTING_EXIT=1` | closed |
| T-181-30 | Information disclosure | key in the process list | high | mitigate | `infra/scripts/bootstrap.sql`: `\unset service_role_key` then `\getenv service_role_key SUPABASE_SERVICE_ROLE_KEY`; header rule 2 forbids `-v` and URL arguments; run command `psql -X -f`; connection from `PG*` | closed |
| T-181-31 | Information disclosure | key in server log via failed statement | high | mitigate | `SET log_parameter_max_length_on_error = 0`; key only as `$1` with `\bind :service_role_key`; `evidence/181-11-bootstrap-and-seed-check.md` `KEY_OCCURRENCES_IN_SERVER_LOG=0` with forced failure, positive control `..._UNBOUND_COPY=1` | closed |
| T-181-32 | Elevation of privilege | seed users / demo key on hosted DB | high | mitigate | `infra/scripts/check-seed.sql`: seed domain/ids, local `supabase_url`, `supabase-demo` issuer → `RAISE EXCEPTION 'check-seed: ...'` (psql status 3); `SEED_CHECK_SEEDED_EXIT=3` naming user, URL, demo key | closed |
| T-181-33 | Tampering | rerun overwriting admin changes | medium | mitigate | `ON CONFLICT (id) DO NOTHING` for accounts, projects; `ON CONFLICT (project_id) DO NOTHING` for app_settings; `SECOND_RUN_KEEPS_OPEN_FOR_VOTERS=yes`, `ADMIN_CHANGES_KEPT=yes` | closed |
| T-181-34 | Information disclosure | secret committed in script | high | mitigate | Audit scan of `infra/scripts/bootstrap.sql`: 0 JWT-shaped literals, 0 `http(s)://` | closed |
| T-181-35 | Tampering | schema changed outside a migration | high | mitigate | `infra/scripts/check-drift.sh` schema part: `db diff --output-format text` to a file, `-s` size test → `SCHEMA DRIFT`, exit 1; `DRIFT_PLANTED_DDL_EXIT=1` | closed |
| T-181-36 | Repudiation | migration never pushed / pushed but not in repo | high | mitigate | History part: manifest versions vs `supabase_migrations.schema_migrations` with `cmp -s`, one-sided versions named; `DRIFT_HISTORY_MISSING_EXIT=1`, `DRIFT_HISTORY_EXTRA_EXIT=1` | closed |
| T-181-37 | Repudiation | green read from a filter's status | medium | mitigate | CLI output to `$DIFF_SQL` file (no pipe), size tested; empty only clean with `No schema changes found`; JSON output → status 2; `DRIFT_CANNOT_RUN_EXIT=2` | closed |
| T-181-38 | Information disclosure | password on a command line | medium | mitigate | No `--db-url` flag and no URL in `check-drift.sh` (grep exit 1); connection from `PG*`; local target refuses non-loopback `PGHOST` / wrong `PGPORT` | closed |
| T-181-39 | Tampering | column privilege revoked, unseen by diff | medium | accept | See AR-181-06 | closed |
| T-181-40 | Spoofing | spoofed `X-Forwarded-For` | high | mitigate | `infra/local/docker-compose.proxy.yml` `ADDRESS_HEADER` / `XFF_DEPTH` defaults `x-forwarded-for` / `1`; `nginx.conf` `$proxy_add_x_forwarded_for`; `evidence/181-13-proxy-topology.md` `spoof.depth-1.client-address` PASS (not the spoofed address), `spoof.control.depth-2` PASS (spoofed) | closed |
| T-181-41 | Spoofing | cross-site form post accepted | high | mitigate | `ORIGIN` set in the compose file; `form-post.control.foreign-origin.status` 403 PASS before `form-post.public-origin.status` non-403 PASS | closed |
| T-181-42 | Tampering | proxy image changing under its tag | medium | mitigate | `image: nginx@sha256:0985e772...` with tag/version comment | closed |
| T-181-43 | Information disclosure | anon key / seed password in record | low | mitigate | `check-proxy-topology.sh` redacts `eyJ...`; JWT scan of `evidence/181-13-proxy-topology.md`: 0 | closed |
| T-181-44 | Denial of service | requests cut off on rollout | high | mitigate | Exec-form `CMD`; `evidence/181-14-sigterm.md` `sigterm.pid1` = node, `IN_FLIGHT_HTTP=200`, `CONTAINER_EXIT_CODE=0` | closed |
| T-181-45 | Denial of service | task lingering to kill timeout | medium | mitigate | Measured: `SECONDS_TO_EXIT=9.1`, `EXITS_AFTER_DRAIN=yes`, `SHUTDOWN_HANDLER=not-needed` (conditional listener not required) | closed |
| T-181-46 | Denial of service | shutdown task never settling | low | mitigate | Conditional on the T-181-45 listener branch, which was not taken (`SHUTDOWN_HANDLER=not-needed`); no phase-181 `sveltekit:shutdown` listener exists. The phase-182 analytics flush listener (`registerShutdownFlush`) is outside this register | closed (n/a — branch not taken) |
| T-181-47 | Tampering | write command against wrong DB via key | medium | mitigate | `package.json` has no key that runs `bootstrap.sql`; `deploymentChecksWiring.test.ts` "keeps the bootstrap script present and run by no script key" | closed |
| T-181-48 | Repudiation | DB-dependent check silently skipped in `lint:check` | medium | mitigate | `check:*` keys outside the chain; `deploymentChecksWiring.test.ts` asserts no `lint:check` link contains any check key or file | closed |
| T-181-49 | Denial of service | other session's DB reset on stale confirmation | high | mitigate | `evidence/181-16-e2e-gate.md` `OPERATOR_CONFIRMED_STACK_FREE=yes attempt=20261016T160424Z.54dc259ada5d head=5a11cb4e4…` = `E2E_HEAD`; prior voided answer recorded; record ends telling the v2.16 session to `yarn db:reset` | closed |
| T-181-50 | Repudiation | void/partial/earlier run counted green | high | mitigate | `E2E_WRAPPER_EXIT=0`, `E2E_FAILED=0`, `E2E_DID_NOT_RUN=0`, run dir `tests/e2e-runs/181-16-<attempt id>` | closed |
| T-181-51 | Information disclosure | local keys in record | medium | mitigate | Env file recorded by presence only (`ENV_FILE=present`); JWT scan of `evidence/181-16-e2e-gate.md`: 0 | closed |
| T-181-52 | Spoofing | `identity-callback` reachable without gateway JWT | medium | accept | See AR-181-04 (measured: `VERIFY_JWT_BEFORE_HTTP=401`, `VERIFY_JWT_AFTER_HTTP=400 Missing or invalid id_token`) | closed |
| T-181-53 | Tampering | baseline edited after push | critical | mitigate | `apps/supabase/supabase/migrations.manifest.json` sha256 `79bed444…` = audit-time `shasum` of `00001_initial_schema.sql`; guard in `lint:check`; missing manifest → `MALFORMED MANIFEST` (no other mode); scratch-checkout red in `evidence/181-18-frozen-model-observations.md` | closed |
| T-181-54 | Tampering | freeze on unshared tree / stale decision | high | mitigate | `evidence/181-17-freeze-readiness.md` `SCHEMA_IDENTICAL_BOTH_BRANCHES=yes`, `OPERATOR_DECISION=freeze attempt=… head=81e6a3f22…`; `git log` confirms `12c98aa5c` parent = `81e6a3f22` | closed |
| T-181-55 | Repudiation | manifest names a commit without hashed bytes | medium | mitigate | Audit-time: `git show 81e6a3f22:…/00001_initial_schema.sql \| shasum -a 256` = manifest value `79bed444…` | closed |
| T-181-56 | Tampering | file and manifest line edited in one commit | medium | accept | See AR-181-05 | closed |
| T-181-57 | Tampering | frozen guard never seen failing on real file | high | mitigate | `evidence/181-18-frozen-model-observations.md` `LINT_CHECK_EDITED_BASELINE_EXIT=1` with `EDITED FROZEN MIGRATION: 00001_initial_schema.sql …` | closed |
| T-181-58 | Tampering | baseline edit left in working tree | medium | mitigate | Detached scratch worktree removed (`git worktree remove --force`, not in `git worktree list` at audit); `TREE_CLEAN_AFTER=yes`; audit-time `git status --porcelain -- apps/supabase` empty | closed |
| T-181-59 | Repudiation | docs still describing a generated migration | medium | mitigate | `apps/supabase/README.md`, `.claude/skills/database/SKILL.md`, docs backend intro `+page.md` state `yarn schema:regenerate` writes nothing / refuses; no tracked doc teaches regeneration | closed |
| T-181-60 | Denial of service | other session's DB reset on stale confirmation | high | mitigate | `evidence/181-19-closing-e2e-gate.md` `OPERATOR_CONFIRMED_STACK_FREE=yes attempt=20261021T064028Z.c8096615aa8f head=4c9fba56b…` = `E2E_HEAD` | closed |
| T-181-61 | Repudiation | phase closed on stale gate run | high | mitigate | `FREEZE_COMMIT_IS_ANCESTOR_OF_HEAD=yes`, `LOCAL_GATES_DIFF_OUTSIDE_PLANNING_EXIT=0`, `E2E_WRAPPER_EXIT=0`, 548 passed / 0 failed / 0 did not run; audit-time `git diff --quiet 4c9fba56b HEAD -- . ':!.planning'` exit 0 | closed |
| T-181-62 | Tampering | red gate "fixed" by editing frozen baseline | high | mitigate | `181-19-PLAN.md` verify runs `assert-schema-migration-parity.mjs`; audit-time guard exit 0 and baseline/manifest unchanged since `12c98aa5c` | closed |
| T-181-SC | Tampering | npm/pip/cargo installs (all 19 plans) | high | mitigate | No `yarn.lock` change in the phase range; the only `package.json` change (`6f9a5124a`) adds four `check:*` script keys, no dependency; proxy image pinned by digest; Dockerfile still `yarn install --immutable` | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-181-01 | T-181-02 | Evidence records hold version strings and exit statuses only; no command of 181-01 prints a key. Audit scan of every evidence file for JWT-shaped strings: 0. | Plan-time register, 181-01 | 2026-10-21 (logged at audit) |
| AR-181-02 | T-181-05 | The harness state directory is under the user's own `TMPDIR`, holds copies of tracked files only, and is removed by `stop`; `assert_outside_repo` keeps it out of the repository. | Plan-time register, 181-02 | 2026-10-21 (logged at audit) |
| AR-181-03 | T-181-11 | The build id is the commit sha of a public repository (`BUILD_SHA` → kit `version.name`) and is already served at `/_app/version.json`. | Plan-time register, 181-04 | 2026-10-21 (logged at audit) |
| AR-181-04 | T-181-14, T-181-52 | `identity-callback` is served with `verify_jwt = false`; the function verifies the provider's token itself with `jose.jwtVerify` and binds audience and issuer on every call through `requireVerifyClaimBinding` (throws when unset). Measured locally in 181-16: 401 at the gateway before, 400 from the function after. | Operator ruling 181-R3 (ticked in `v2.17-181-183-RESEARCH-FOLLOWUPS.md`) | 2026-10-20 (commit 43ee00532) |
| AR-181-05 | T-181-17, T-181-56 | An edit to a frozen file together with its manifest line in one commit passes the guard and shows in review. The manifest is an integrity record against accident, not against a committer. | Operator ruling D-01 (`181-CONTEXT.md`) | 2026-10-11 (commit d0e2c9293) |
| AR-181-06 | T-181-39 | `supabase db diff` does not report column privileges (also rows, comments, role settings). Named in the `check-drift.sh` header and recorded by control 5 (`DRIFT_COLUMN_REVOKE_EXIT=0`, `BLIND_SPOT_COLUMN_PRIVILEGE=confirmed`); `check-schema-equivalence.sh` covers it between `schema/` and migrations, and a later conformance probe covers the deployed database. | Plan-time register, 181-12 | 2026-10-21 (logged at audit) |

*Accepted risks do not resurface in future audit runs.*

---

## Unregistered Flags (from SUMMARY `## Threat Flags`, no threat ID mapping)

Non-blocking warnings. Each is new attack surface the executor reported that the plan registers do not name.

| Flag | Source | File | Description | Disposition note |
|------|--------|------|-------------|------------------|
| UF-181-01 network-listener | 181-02-SUMMARY | `apps/supabase/scripts/isolated-instance.sh` | While an instance runs the CLI publishes its Postgres port (and the gateway in `full` mode) on `0.0.0.0` with the CLI's public local password and keys | Local-only tooling, lifetime of an instance; same exposure as the shared stack. Candidate for an `accept` entry |
| UF-181-02 information-disclosure | 181-11-SUMMARY | `infra/scripts/bootstrap.sql` | A server set to log parameters of successful or slow statements logs the bound service-role key; T-181-31 covers the failed-statement path only | The script cannot set the superuser-only parameter-logging settings; header documents it and defers to phase 184. Should be registered there |
| UF-181-03 network-listener | 181-12-SUMMARY | `infra/scripts/check-drift.sh` | `db diff` publishes a shadow Postgres on all interfaces with the public local password for the length of the diff; a `SIGKILL` leaves it running | Seconds-long, local; interrupt trap stops it. Candidate for `accept` |
| UF-181-04 file-write-outside-repository | 181-12-SUMMARY | `infra/scripts/check-drift.sh` | The CLI's diff writes a cache file into the invoking user's home directory | Low impact; candidate for `accept` |
| UF-181-05 network-listener | 181-13-SUMMARY | `infra/local/docker-compose.proxy.yml` | Proxy listens on `127.0.0.1:8181` (loopback only); the frontend container reaches any `host.docker.internal` port via `extra_hosts` | By design for the local check; candidate for `accept` |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-21 | 63 | 63 | 0 | gsd-security-auditor (ASVS L1, block_on high, HEAD fd731f7cc) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-21
