---
phase: 181-deployability-and-migration-model
verified: 2026-10-21T08:30:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - ".env.example"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-01-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-01-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-02-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-02-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-03-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-03-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-04-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-04-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-05-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-05-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-06-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-06-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-07-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-07-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-08-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-08-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-09-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-09-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-10-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-10-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-11-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-11-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-12-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-12-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-13-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-13-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-14-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-14-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-15-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-15-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-16-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-16-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-17-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-17-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-18-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-18-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-19-PLAN.md"
  - ".planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-19-SUMMARY.md"
  - "apps/frontend/Dockerfile"
  - "apps/frontend/src/hooks.server.ts"
  - "apps/frontend/src/lib/server/startup/requiredEnv.ts"
  - "apps/frontend/src/routes/api/diagnostics/+server.ts"
  - "apps/frontend/src/routes/api/health/+server.ts"
  - "apps/frontend/svelte.config.js"
  - "apps/supabase/scripts/check-schema-equivalence.sh"
  - "apps/supabase/scripts/isolated-instance.sh"
  - "apps/supabase/supabase/config.toml"
  - "apps/supabase/supabase/migrations.manifest.json"
  - "apps/supabase/supabase/migrations/00001_initial_schema.sql"
  - "apps/supabase/supabase/schema/400-storage.sql"
  - "docker-compose.dev.yml"
  - "infra/local/check-proxy-topology.sh"
  - "infra/local/docker-compose.proxy.yml"
  - "infra/scripts/bootstrap.sql"
  - "infra/scripts/check-drift.sh"
  - "infra/scripts/check-seed.sql"
  - "package.json"
  - "render.example.yaml"
  - "scripts/assert-schema-migration-parity.mjs"
covered_digest: "v3:sha256:da858610ffd3919d8834ee4c210f38b4b5bfb1632cda45c25fa8320c5d301694"
behavior_unverified: 0
overrides_applied: 0
deferred:
  - truth: "The deployment guide and the environment-variable reference describe the shipped code (buckets inserted by the migration, bootstrap script, `PUBLIC_PROJECT_ID` in the template, `ORIGIN` / `ADDRESS_HEADER` / `XFF_DEPTH`) (review WR-05)"
    addressed_in: "Phase 189"
    evidence: "Phase 189 success criterion 1: 'The deployment guide follows the Terraform and Supabase-as-code path ... The environment-variable reference covers the proxy variables, the analytics variables and `PUBLIC_PROJECT_ID`' (DOCS-01, DOCS-04). Also recorded in this phase's deferred-items.md (181-08)."
coincidental_reliance_items:
  - truth: "A SIGTERM sent to the container reaches Node, which finishes the request in flight before it exits (criterion 3)"
    reason: incidental-ordering
    harden: "The exit after the drain holds only because nothing keeps Node's event loop alive: adapter-node never calls process.exit, and the 181-14 record says 'this application holds nothing open after that'. No code or test enforces that. Phase 182 has since attached a `sveltekit:shutdown` listener (its flush timer is unref'd) and the leg was not re-run on that tree. Re-run `yarn check:proxy-topology --sigterm` on the final tree when phase 185 re-runs the topology (D-15), or add a test that pins the exit."
---

# Phase 181: Deployability and Migration Model Verification Report

**Phase Goal:** The application and the schema are ready to be deployed before any cloud account is touched: the server reports its health and its build, refuses to start half-configured, behaves correctly behind a proxy, and the migration model survives a first push.
**Verified:** 2026-10-21T08:30:00Z
**Status:** passed
**Re-verification:** No, initial verification

Method. SUMMARY claims were not taken as evidence. For each criterion I read the code that implements it, ran the guard and the unit slices that exercise it, and read the recorded observation runs (`evidence/`) for the parts that need Docker or an isolated database, which the constraints of this verification forbade me to start. The read-only constraints held: no stack, E2E run or Docker command was run, and no `.env` was read.

## Goal Achievement

### Observable Truths (ROADMAP success criteria, the contract)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | With Supabase unreachable, the health endpoint of the production build answers 200, and the served build names the commit it was built from | ✓ VERIFIED | `apps/frontend/src/routes/api/health/+server.ts` returns `json({status:'ok', build: version})` with `no-store`; it reads no request, `locals` or upstream. `svelte.config.js` sets `kit.version.name = process.env.BUILD_SHA \|\| undefined` (the `\|\| undefined` is the load-bearing coercion); the `Dockerfile` takes `ARG BUILD_SHA` and exports it as `ENV`. Unit tests pass (health, diagnostics, svelte.config: 4 files, 41 tests, run by me). Observed on the production build: `HEALTH_SUPABASE_UNREACHABLE_HTTP=200` with a page route in the same state discriminated by 0 inlined upstream answers (181-09); `BUILD_ID_SET` equals the given sha at `/api/health`, `/_app/version.json` and inside the container (181-13); the no-argument control gives a timestamp. |
| 2 | A production start with a required variable unset exits with an error that names the variable, and the environment templates list `PUBLIC_PROJECT_ID` and the proxy variables | ✓ VERIFIED | `hooks.server.ts` exports `init` (skipped in `dev` / `building`) that throws `Required environment variables are not set: <names>` from `missingRequiredEnv`; `REQUIRED_ENV` is the four variables of D-13, names only, no value. Observed on the built server: each of the four unset gives exit 1 and a message naming it, two unset name both, all set listens (181-09). Templates: `PUBLIC_PROJECT_ID` is in `.env.example`, `render.example.yaml` and `docker-compose.dev.yml`; `ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH` are in all three (commented in `.env.example` by design, so a CI copy to `.env` does not set a live `ORIGIN`). Spec `deploymentTemplates.test.ts` passes (run by me) and was seen failing first (181-05). Caveat: the check tests presence, not shape (WR-01, below). |
| 3 | Behind a local reverse proxy: a form post succeeds, a redirect is built on the public origin, a spoofed `X-Forwarded-For` is not attributed to the spoofed address, and a `SIGTERM` reaches the Node process, which finishes the request in flight before it exits | ✓ VERIFIED (coincidental-reliance, advisory) | `Dockerfile` ends `CMD ["node", "./apps/frontend/build/index.js"]`; `infra/local/{docker-compose.proxy.yml,nginx.conf,check-proxy-topology.sh}` and `/api/diagnostics` (404 unless `DEPLOYMENT_DIAGNOSTICS`) exist. Recorded run 181-13 (exit 0, nginx pinned by digest): public-origin post passes the origin check (400 = the action's own `fail`), foreign-origin post 403 as control; login 303 `Location: http://vaa.example.test:8181/contestant`, followed to 200; with `XFF_DEPTH=1` a spoofed request is attributed to the proxy-appended `172.21.0.1`, control with depth 2 sees `203.0.113.99`; diagnostics 404 by default, 200 enabled. Recorded run 181-14 (exit 0): PID 1 is `node`; a 12 s in-flight request ended 200 across `docker stop`; container exit code 0 after 9.1 s (not 137). I did not re-run Docker legs. See Advisory. |
| 4 | The single migration is frozen as a named baseline at the agreed cutover commit; `yarn lint:check` fails when the baseline is edited and passes when a numbered migration is appended; after a push to a local database the drift check exits non-zero on a drift planted on purpose and zero on a clean one, with the exit status read directly (SUPA-10) | ✓ VERIFIED | Manifest `migrations.manifest.json` names baseline `initial_schema`, `00001_initial_schema.sql`, commit `81e6a3f2…` (the freeze commit's parent, per A-02); the file's sha256 (`79bed444…`) equals the manifest entry (recomputed by me). `node scripts/assert-schema-migration-parity.mjs` exits 0 on the real tree (run by me): 1 migration matched, 16 fixtures, 15 rules each with a fixture. Freeze commit `12c98aa5c` changed no baseline or `schema/` byte (181-17). Operator gave the freeze decision for an attempt-bound head after the readiness record showed v2.16 phase 177.1 landed and the v2.16 tip equal to this branch. `yarn schema:regenerate` now refuses (exit 1, tree unchanged). Observed once each on a scratch checkout at 78fa17897 (181-18): `lint:check` red on an edited baseline (`EDITED FROZEN MIGRATION`, exit 1), green with an appended `00002_probe.sql` plus manifest line (exit 0, every link ran), plus unlisted, duplicate-version and timestamp-name controls (each exit 1). Drift check on the real manifest: clean exit 0, planted `ADD COLUMN planted_drift` exit 1 with the statement named; status read from files, never a pipe. `check:schema-equivalence` (181-17 readiness) reports the schema-built and migration-built databases EQUAL. No non-`.planning` file differs between 58cf7a564 (gates) and HEAD, checked by me. Known limits, recorded in 181-12: the CLI diff cannot see rows, column privileges, comments or role settings (`DRIFT_COLUMN_REVOKE_EXIT=0` confirms the blind spot); see WR-02 on the equivalence check not being in CI. |
| 5 | A database built from the migrations alone holds both buckets. Running the bootstrap twice leaves one account, one project, the `storage_config` row and `behind_cloudflare`, and the script holds no secret. A check fails when a seed user or a local URL is present, seen once. `config.toml` declares the JWT setting of `identity-callback` | ✓ VERIFIED | `schema/400-storage.sql` and the baseline (lines 5400-5410) both contain the `INSERT INTO storage.buckets ... ('public-assets', true), ('private-assets', false), 524288000 ... ON CONFLICT DO NOTHING`; database-only build holds 2 rows, rows match the CLI's, upload 200 to both, pgTAP green with seed (181-08). `config.toml` line 428-432: `[functions.identity-callback] verify_jwt = false`. `infra/scripts/bootstrap.sql` reads the environment with `\getenv`, binds the key as a parameter, holds no secret (my grep for JWT, `sb_secret`, `sb_publishable` shapes finds none in the bootstrap or seed check). Observed on an isolated instance (181-11): run 1 and run 2 exit 0, rows `accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1` after both, `open_for_voters` unchanged on the second run, `behind_cloudflare` true, key in the server log 0 times; seed check clean exit 0 on the bootstrapped database, **3 on the seeded one naming the user, the local URL and the demo key** (red control), 6 of 6 local addresses refused, 2 of 2 hosted accepted. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|--------------|----------|
| 1 | Deployment guide and env-var reference now contradict the shipped code (WR-05: buckets by hand, SQL-editor steps, "template does not list PUBLIC_PROJECT_ID", no `ORIGIN`) | Phase 189 | Phase 189 criterion 1 (DOCS-01, DOCS-04): guide rewritten around the Terraform path; env-var reference covers the proxy variables and `PUBLIC_PROJECT_ID`. 181 `deferred-items.md` records the buckets and `behind_cloudflare` rewrite for 189. `ORIGIN` is not yet named in that list; it falls under DOCS-04's "proxy variables". |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/frontend/src/routes/api/health/+server.ts` | Health + build id | ✓ VERIFIED | 14 lines, substantive; SvelteKit API route, no gate needed. Wired by route convention; tested. |
| `apps/frontend/src/lib/server/startup/requiredEnv.ts` + `hooks.server.ts` `init` | Start-up check | ✓ VERIFIED | Imported by `init`; rules list also holds phase 182's analytics rule; tests pass. |
| `apps/frontend/src/routes/api/diagnostics/+server.ts` | Off-by-default diagnostics | ✓ VERIFIED | 404 by default (observed), tests pass. |
| `apps/frontend/svelte.config.js`, `Dockerfile` | Build id from `BUILD_SHA`, exec-form `CMD` | ✓ VERIFIED | Both read directly. |
| `infra/local/*` | Proxy topology compose, nginx, check | ✓ VERIFIED | Run, exit 0, with negative controls (181-13/14). |
| `migrations.manifest.json`, `scripts/assert-schema-migration-parity.mjs`, 16 fixtures | Freeze model | ✓ VERIFIED | Guard exit 0; wired into `lint:check` via `assert:schema-migration-parity`; gate test passes (28 cases, run by me via the three-file slice). |
| `infra/scripts/check-drift.sh`, `check-seed.sql`, `bootstrap.sql` | Drift check, seed check, bootstrap | ✓ VERIFIED | Present, exposed as `check:migration-drift`, `check:seed`; each seen failing once. Not wired to CI by design (D-11, phase 187). |
| `apps/supabase/scripts/{check-schema-equivalence,isolated-instance}.sh` | Equivalence check, harness | ✓ VERIFIED | `check:schema-equivalence` in `package.json`; deliberately outside `lint:check` (D-03). |
| `config.toml` `[functions.identity-callback]`, `400-storage.sql` bucket insert | SUPA-05, SUPA-04 builds-toward | ✓ VERIFIED | Read directly. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `hooks.server.ts` `init` | `missingRequiredEnv` / `STARTUP_RULES` | import + call with `{...privateEnv, ...publicEnv}` | WIRED | Throws one error naming all missing variables. |
| `svelte.config.js` | `$app/environment` `version` → `/api/health` | `kit.version.name` | WIRED | Same value observed at `/api/health` and `/_app/version.json`. |
| `package.json` `lint:check` | freeze guard | `assert:schema-migration-parity` | WIRED | Red and green seen in 181-18. |
| `package.json` | drift / seed / equivalence / topology checks | `check:*` scripts | WIRED | Scripts resolve to the committed files; `deploymentChecksWiring.test.ts` passes. |
| baseline `00001` | `schema/` | equivalence check | WIRED, not automatic | Equal at the freeze; no CI step keeps them equal (WR-02). |

### Data-Flow Trace (Level 4)

Not applicable: the phase renders no dynamic UI data. The only value that flows to a response is the build id, traced from `BUILD_SHA` (Docker `ARG` → `ENV` → `svelte.config.js` → `$app/environment` → health body and `version.json`) and observed end to end.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Freeze guard on the real tree | `node scripts/assert-schema-migration-parity.mjs` | exit 0, manifest matches, self-test 16 fixtures / 15 rules | ✓ PASS |
| Baseline hash equals manifest | `shasum -a 256 …/00001_initial_schema.sql` | `79bed444…ed8`, equal | ✓ PASS |
| Health, diagnostics, start-up rules, kit version name | `vitest run` of the four named files in `apps/frontend` | 4 files, 41 tests passed | ✓ PASS |
| Phase 182 shared surface (analytics, `api/*`, start-up) | `vitest run src/lib/server/analytics src/routes/api src/lib/server/startup` | 15 files, 250 tests passed | ✓ PASS |
| Freeze gate, templates, checks wiring | `vitest run` of the three named files in `packages/dev-seed` | 3 files, 64 tests passed | ✓ PASS |
| Docker / isolated-database legs (topology, SIGTERM, equivalence, bootstrap, drift) | not run here (constraint) | recorded runs with exit statuses read from files | ? SKIP, covered by recorded evidence |

The full E2E suite was not run by me; the closing gate (181-19) on `4c9fba56b` records 548 passed, 0 failed, 0 did not run, not void, and no non-`.planning` file has changed since (`git diff --name-only 4c9fba56b..HEAD -- . ':!.planning'` is empty, checked by me).

### Probe Execution

No `scripts/*/tests/probe-*.sh` probe is declared by any plan of this phase; its executable checks are the `check:*` scripts above, which need Docker or an isolated database and were not run by me. No `MISSING_PROBE`.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| SUPA-10 | 181-01 to 181-19 (all declare `requirements: [SUPA-10]`) | Schema deployable after its first push: single migration frozen as a named baseline at the agreed cutover commit, later changes append-only numbered, parity guard enforces both, drift check after deploy reads its exit status directly | ✓ SATISFIED | Truth 4; REQUIREMENTS.md already marks it `[x]` / Complete. |

No orphaned requirement: REQUIREMENTS.md maps only SUPA-10 to Phase 181. INFRA-04, INFRA-05, INFRA-06, INFRA-09, SUPA-04, SUPA-05, SUPA-06 and PIPE-07 are "builds toward" items closed by phases 184, 185 and 187, and are correctly not claimed here.

### Decisions Honored (181-CONTEXT)

D-01 hash manifest (yes); D-02 `schema:regenerate` refuses, frozen files out of prettier and comment-hygiene (guard and gate test); D-03 equivalence check outside `lint:check` (yes, `check:schema-equivalence`); D-05 five-digit versions with duplicate / non-increasing rejection (fixtures and 181-18 controls); D-07 buckets inserted, config blocks kept after measurement; D-09/D-10 bootstrap as one `psql` file, fixed account id, `open_for_voters` never overwritten; D-11 scripts set their own exit status, no CI job added; D-12 to D-15 health, start-up check, diagnostics, exec-form `CMD`; D-16 variables only. A-02: the baseline came from the parent of the freeze commit, as planned.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (phase files) | - | `TBD` / `FIXME` / `XXX` debt markers | none found | Grep over the non-`.planning`, non-fixture files changed since the phase began finds no marker. |
| `apps/frontend/src/lib/server/startup/requiredEnv.ts` | 41-54 | Presence-only check (review WR-01) | ⚠️ Warning | A malformed `PUBLIC_PROJECT_ID` or `ORIGIN` starts, answers `/api/health` 200 and fails every page. Success criterion 2 (a variable unset) is met; the goal sentence "refuses to start half-configured" is met for absent, not for malformed, values. |
| `package.json`, `.github/workflows/main.yaml` | - | Equivalence check not in CI (review WR-02) | ⚠️ Warning | After the freeze nothing automatic keeps `schema/` and the migrations in step, and two unit tests read `schema/`, which the database never applies. The check itself is green and was designed to sit outside `lint:check` (D-03); CI wiring is not claimed by this phase, but it leaves the append-only model enforced only by a manual check. |
| `apps/supabase/scripts/isolated-instance.sh` | 260-266 | Case-sensitive redactor (WR-03) | ⚠️ Warning | Failure-path output of a throwaway local instance may print a key-shaped line. Local only. |
| `infra/local/check-proxy-topology.sh` | 463-469 | `--sigterm` reuses a stale image (WR-04) | ⚠️ Warning | The SIGTERM leg can describe another commit; the 181-14 record names its image's `BUILD_SHA` (`d2c6ae678`), so the recorded verdict is traceable. |
| `apps/docs/.../deployment/+page.md` | 18, 19, 26-28, 48 | Guide contradicts code (WR-05) | ⚠️ Warning, deferred | See Deferred Items. |

IN-01 to IN-08 of the code review are informational (checker accepts a non-`00001` baseline version, `sha256` shape unchecked, no deployment path supplies `BUILD_SHA`, seed check exit-status ambiguity, `DEPLOYMENT_DIAGNOSTICS` in no template, `ORIGIN` custom domain note in the Render blueprint, duplicated shell helpers, historical wording in a root script). None blocks a truth. `181-REVIEW-DISPOSITION.md` records all 13 as `open`; no critical finding, and `181-SECURITY.md` records `threats_open: 0`.

### Phase 182 Regression Check

`182-VERIFICATION.md` (status passed, 5/5) now reads `stale` through `verification.status`: files it covers (for example `.env.example`, `hooks.server.ts`, `requiredEnv.ts`) changed after it ran, which is expected, since the two phases share them and 181's work landed in between. Regression evidence on the current tree: the analytics, `api/*` and start-up unit slices pass (250 tests), the phase-182 rule is still in `STARTUP_RULES`, and the closing E2E gate (548 passed) includes the phase-182 specs, among them `voter-pageview-only`. No 182 truth was found regressed. The 182 report should be refreshed by its own workflow.

### Human Verification Required

None. Nothing in the five criteria is visual, real-time against an external service, or a UX judgement. The Docker-backed observations are recorded runs with exit statuses read from files and with their negative controls; they are not reproduced here only because of this verification's constraints.

### Advisory (does not change the status)

1. **SIGTERM / proxy runs describe an earlier tree.** Runs 181-13 and 181-14 are on `d2c6ae678`. `apps/frontend/Dockerfile`, `svelte.config.js` and `infra/local/` are unchanged since the SIGTERM leg was added (`ff73c68e2`), but phase 182 later added `hooks.server.ts` code and a `sveltekit:shutdown` flush listener whose timer is `unref()`'d (`queue.ts`), so I expect no change. The verdict that Node exits by itself rests on nothing holding the event loop open, which is the coincidental-reliance item in the frontmatter. Phase 185 re-runs the topology (D-15); re-run `check:proxy-topology --sigterm` then.
2. **Cutover agreement.** The freeze followed the operator's attempt-bound `freeze` reply, with the v2.16 tip equal to this branch's head. Follow-up X-1 (merge the freeze commit into the v2.16 branch before its next schema change) is a hand-off, not a phase 181 deliverable, and is still open on the other session's side.
3. **Worth fixing before the first hosted push, not blocking:** WR-01 (shape checks in `requiredEnv.ts`) and WR-02 (run `check:schema-equivalence` in CI) most directly serve the phase goal's words "refuses to start half-configured" and "survives a first push".

### Gaps Summary

No gaps. All five roadmap success criteria hold in the tree: the health and build routes, the start-up refusal, the proxy and signal behaviour (on recorded runs), the frozen baseline with its guard and drift check, and the buckets, bootstrap, seed check and `verify_jwt` setting. SUPA-10 is accounted for in every plan and in REQUIREMENTS.md. Five code-review warnings stay open and are listed above; none contradicts a success criterion as worded.

---

_Verified: 2026-10-21T08:30:00Z_
_Verifier: Claude (gsd-verifier)_
