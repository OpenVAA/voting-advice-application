---
phase: 168-docs-site-rewrite-strapi-to-supabase
plan: 04
subsystem: docs-content
status: complete
tags: [docs, quick-start, environment-variables, deployment, render, supabase-cloud, troubleshooting, claims-ledger]

requires:
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-02: the twelve pages at their final URLs with their final H1s, redirect stubs for the five merged sources"
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-01: validate-links --check/--scope, check-claims.mjs ledger/commands, base-rev.txt"
  - phase: 167-origin-main-vestige-cleanup
    provides: "single repo-root .env, no cache proxy, no BACKEND_API_TOKEN or PUBLIC_*_BACKEND_URL, the Render operator note"
provides:
  - "Quick start: yarn install -> root .env (PUBLIC_PROJECT_ID, local keys) -> yarn dev -> yarn db:seed:default"
  - "Architecture: the 15 workspaces from their manifests, the dependency graph, and the adapter -> Supabase data flow"
  - "Development section: Requirements, Running the development environment (db:* vs dev:*), Monorepo and Turborepo, Testing (unit, pgTAP, Edge Function, E2E + preflight)"
  - "Configuration overview, Environment variables (post-167 env model), Static settings, App customization"
  - "Deployment (Render frontend container + Supabase Cloud) and Troubleshooting (Supabase / dev-server sections)"
  - "168-04-CLAIMS.md: 17 page verdicts, 442 content-anchored claims (check-claims ledger exit 0), findings F1-F8, two sweep-exception rows"
affects: [168-05, 168-06, 168-07, 168-08, 169]

estimate:
  tokens: 75000
actuals:
  tokens: 45243
  tasks: 3
  commits: 3
plan_head_before: 7e3ea7377723378beb2a53ff649f7651a212064f
plan_head_after: ea45b9a8fbc8eed89f081f4fe93232bbadc658a9

tech-stack:
  added: []
  patterns:
    - "A removed-configuration note (167's Render clean-up) names the removed keys by family (`CACHE_*`, `PUBLIC_*_BACKEND_URL`) so the page teaches removal without spelling a 167-removed name the sweeps forbid"
    - "Claims rows inserted by a small node script at a row anchor, so the table stays one contiguous block and check-claims re-reads it after every addition"

key-files:
  created:
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-04-CLAIMS.md
  modified:
    - "apps/docs/src/routes/(content)/developers-guide/quick-start/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/architecture/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/development/requirements/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/development/running-the-development-environment/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/development/monorepo/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/development/testing/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/configuration/intro/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/configuration/static-settings/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/configuration/app-customization/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/deployment/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/troubleshooting/+page.md"

key-decisions:
  - "Quick start tells the reader to fill the Supabase anon and service-role keys from `supabase status -o env`, not only PUBLIC_PROJECT_ID: the template's keys are placeholders, so the app and db:seed cannot work without them; PUBLIC_PROJECT_ID is already preset"
  - "The 167 Render operator note sits on the Deployment page as an 'Upgrading an older Render service' paragraph that names the removed keys by family (CACHE_*, PUBLIC_CACHE_*, PUBLIC_*_BACKEND_URL, a backend API token) and the /var/data/cache disk, so the 167-removed-name grep stays at exit 1"
  - "Deployment tells operators to add PUBLIC_PROJECT_ID, which render.example.yaml omits; the template gap is finding F1, not fixed (D-18)"
  - "The old Testing recipe (`yarn dev` then `yarn test:e2e`) was wrong for the post-scoping suite and is replaced by e2e-run.sh and a dev server started with the suite's PUBLIC_PROJECT_ID"
  - "Costs section of Deployment dropped: its figures were for the Strapi + Render Postgres + AWS stack and no Supabase-era figure exists in the repo"
  - "backend/preparing-backend-dependencies recorded as merged (its one still-true point, build the shared packages before running a workspace alone, is the `yarn build` step of 'The frontend only')"

patterns-established:
  - "Negative facts a content anchor cannot prove (no bucket creation, no admin customization editor, an unread env pair) go to ## Findings for todos with the grep that proves them"

requirements-completed: []

coverage:
  - id: D1
    description: "Quick start takes a clone to a seeded running app in D-02 order with only real commands; no Docker Compose, port 1337 or admin/admin"
    requirement: "DOCS-01"
    verification:
      - kind: other
        ref: "Task 1 <verify> (validate:links --check --scope /developers-guide/quick-start; check-claims ledger; check-claims commands; prettier --check) exit 0, re-run after commit for the tracer gate"
        status: pass
      - kind: other
        ref: "nohit 1337|admin/admin|docker.compose|strapi|localstack and the version grep on quick-start (exit 1 each); H1 '# Quick start'; first-appearance order yarn install < yarn dev < PUBLIC_PROJECT_ID < yarn db:seed:default"
        status: pass
    human_judgment: false
  - id: D2
    description: "Twelve pages pass every page gate: scoped link check (7 classes, 0 findings), claims ledger, command resolution, prettier, D-21/D-17/167-name/key-value sweeps"
    requirement: "DOCS-03"
    verification:
      - kind: other
        ref: "Task 3 <verify> block 1 over the twelve pages (VERIFY1=0: links 0 findings, ledger 442 rows pass, 121 yarn commands resolve, 1 placeholder skipped, prettier clean)"
        status: pass
      - kind: other
        ref: "Task 3 <verify> block 2 over the twelve pages (VERIFY2=0) and the 167-removed-name grep (exit 1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Claims ledger: 442 content-anchored rows re-verified by script; 17 page verdicts (12 pages + 5 merged sources); every docker hit listed under Sweep exceptions"
    requirement: "DOCS-04"
    verification:
      - kind: other
        ref: "node scripts/check-claims.mjs ledger 168-04-CLAIMS.md (exit 0, 442 rows)"
        status: pass
    human_judgment: true
    rationale: "Anchors prove each cited literal exists; whether every sentence reads its anchor correctly is the 168-08 gsd-doc-verifier's independent pass (D-09)"
  - id: D4
    description: "Env and deployment pages describe the post-167 model and never put the service-role key on the frontend"
    requirement: "DOCS-01"
    verification:
      - kind: other
        ref: "git grep of PUBLIC_CACHE_ENABLED|CACHE_(DIR|TTL|LRU_SIZE|EXPIRATION_INTERVAL)|BACKEND_API_TOKEN|PUBLIC_(BROWSER|SERVER)_BACKEND_URL|flat-cache|/api/cache over the twelve pages exits 1; eyJ/sb_ grep exits 1"
        status: pass
    human_judgment: true
    rationale: "The Supabase Cloud steps (buckets, hook, auth URLs, storage_config, account/project rows) were derived from config.toml, schema and seed.sql but not run against a hosted project; an operator or the verifier should read them as a deployment checklist"

duration: 31min
completed: 2026-10-02
---

# Phase 168 Plan 04: Getting-started and Operations Pages Summary

**The twelve getting-started and operations pages now describe the Supabase-CLI stack and the post-167 env model, with every claim checked against the code: a clone-to-seeded-app Quick start, the dependency graph and data flow, the `db:*`/`dev:*` scripts, unit/pgTAP/Edge-Function/E2E testing, the single repo-root `.env` plus `functions/.env`, and a Render + Supabase Cloud deployment. 442 claims are anchored in code and re-verified by script.**

## Performance

- **Duration:** about 31 min
- **Started:** 2026-10-02T10:22:25Z
- **Completed:** 2026-10-02T10:53:12Z
- **Tasks:** 3 of 3
- **Files modified:** 13 (12 pages, 1 claims ledger)

## Accomplishments

- **Quick start (tracer).**
  - The Docker Compose run, the swapped ports and the Strapi `admin`/`admin` login are gone.
  - It now runs `yarn install`, then `cp .env.example .env`. In the `.env` step, `PUBLIC_PROJECT_ID` is preset to the `seed.sql` project, and the reader fills the anon and service-role keys from `supabase status -o env`.
  - Then `yarn dev` (what it starts, port 5173, `strictPort`), `yarn db:seed:default` or `yarn db:reset-with-data`, and the Studio and email-testing ports.
  - Tracer gate: the run is interactive in end-of-phase mode, and the tracer's `<verify>` is automated only. The verify was re-run on the committed tree (exit 0 and exit 0) before expanding.
- **Architecture.**
  - The 15 workspaces are re-derived from their manifests, each with a role.
  - The dependency graph is read from `dependencies`.
  - The data flow covers `createDataProvider` and the three writer factories over a named Supabase client, RLS and `PUBLIC_PROJECT_ID` scoping, and the Edge Functions.
  - Adapter selection is stated as the code has it: the client always uses the Supabase provider, and `local` only loads the server-side file adapter.
- **Development section.**
  - Requirements: Node per `engines` (checked by `preinstall` and `lint:check`), Yarn per `packageManager` and `yarnPath`, a container runtime for the Supabase CLI, Playwright browsers for E2E only. No version numbers.
  - Running: tables for every `db:*` and `dev:*` script, what `yarn dev` runs step by step, how to run each part alone, ports, and resetting.
  - Monorepo: Turborepo task ordering, and the corrected watch claim.
  - Testing: unit tests (with the coverage assertion), pgTAP, Edge Function tests, and E2E through `e2e-run.sh`, plus the preflight.
- **Configuration.**
  - Overview: the four layers.
  - Environment variables: the env model; the twins and `check:env-local`; `PUBLIC_PROJECT_ID`; the constants-module rule merged from `frontend/environmental-variables`; every variable of the three templates by group.
  - Static settings: written from the type.
  - App customization: `app_settings.customization`, `StoredCustomizationSchema` and `_getAppCustomization`.
- **Deployment.**
  - The Render frontend container: the template, the Dockerfile, the env keys, the missing `PUBLIC_PROJECT_ID`, and that the service-role key never goes on the frontend.
  - Supabase Cloud: migrations, buckets, the access-token hook, auth URLs, SMTP, `max_rows`, the account and project rows, `storage_config`, and the Edge Functions and their secrets.
  - The 167 note for upgrading older Render services.
  - The feedback rate-limit section, kept.
  - The production-build test.
- **Troubleshooting.**
  - The Docker and Strapi sections and the broken self-anchor are gone. The `anchor` class now finds nothing.
  - Ten sections for the Supabase stack and the dev server.
- **Ledger.**
  - 17 verdicts, 442 claims and findings F1–F8.
  - Sweep exceptions: the Requirements Docker line, the Deployment Docker lines, and the removed-variable note.

## Task Commits

1. **Task 1 (tracer): Quick start**, `79e3f68d7` (docs)
2. **Task 2: Architecture and the Development section**, `2c733c6e4` (docs)
3. **Task 3: Configuration, Deployment and Troubleshooting** (plus the Architecture adapter-selection correction and the `db:reset-with-e2e-data` row), `ea45b9a8f` (docs)

**Plan metadata:** the docs commit that adds this summary.

## Files Created/Modified

- `apps/docs/src/routes/(content)/developers-guide/quick-start/+page.md`: clone to a seeded running app
- `apps/docs/src/routes/(content)/developers-guide/architecture/+page.md`: workspaces, dependency graph, data flow
- `apps/docs/src/routes/(content)/developers-guide/development/{requirements,running-the-development-environment,monorepo,testing}/+page.md`: the Development section
- `apps/docs/src/routes/(content)/developers-guide/configuration/{intro,environmental-variables,static-settings,app-customization}/+page.md`: Configuration (not App settings)
- `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md`: Render + Supabase Cloud
- `apps/docs/src/routes/(content)/developers-guide/troubleshooting/+page.md`: Supabase and dev-server problems
- `.planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-04-CLAIMS.md`: verdicts, claims, findings, sweep exceptions

## Decisions Made

See `key-decisions` in the frontmatter. The two that change what a reader does:

- Quick start asks for the local keys as well as `PUBLIC_PROJECT_ID`, because the template ships placeholder keys and both the app and `db:seed` need them.
- Deployment asks for `PUBLIC_PROJECT_ID` on the Render service, although the template omits it. The template gap is recorded as F1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Accuracy] Quick start's `.env` step covers the keys, not only `PUBLIC_PROJECT_ID`**
- **Found during:** Task 1
- **Issue:** The plan names `PUBLIC_PROJECT_ID` as "the one value that must be set". In `.env.example` it is already preset to the `seed.sql` project. The anon and service-role keys are placeholders, and without them the app's Supabase client and `db:seed` cannot work.
- **Fix:** The step keeps `PUBLIC_PROJECT_ID` (preset, what happens if it is unset) and adds `yarn db:start` and `supabase status -o env`, with the key mapping anchored on `tests/scripts/ci-write-local-keys.sh`.
- **Files modified:** quick-start page
- **Committed in:** `79e3f68d7`

**2. [Rule 1 - Accuracy] Old E2E recipe corrected**
- **Found during:** Task 2
- **Issue:** The base Testing page said to run `yarn dev`, then `yarn test:e2e`. A plain `yarn dev` serves the default project, so the served-project preflight aborts the run (`tests/global-setup.ts`).
- **Fix:** The page now documents `e2e-run.sh`, and a dev server started with `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2`.
- **Committed in:** `2c733c6e4`

**3. [Rule 1 - Accuracy] Architecture's adapter-selection sentence corrected**
- **Found during:** Task 3, while reading `staticSettings.type.ts`
- **Issue:** The Task 2 text said `dataAdapter.type` selects the adapter. The type's documentation and `createDataProvider` show that the client always uses the Supabase provider, and that `local` only loads the server adapter behind `/api/data/[collection]`.
- **Fix:** The sentence was rewritten, and claims rows 436–439 were added.
- **Committed in:** `ea45b9a8f`

### Other deviations

**4. [Convention] Commit subjects use `docs[docs]:`, not the plan's `docs(docs):`.** The contributing guide sets the bracketed package form, and CLAUDE.md makes the review checklist binding. 168-02 made the same change; 168-03 kept the plan's form.

**5. [Plan conflict, resolved by the orchestrator note] The Deployment page carries a disk-detach instruction.**
- **The conflict:** Task 3's acceptance says the page "contains no `cache` disk instruction". The orchestrator's brief says the 167 Render operator note (detach the `/var/data/cache` disk, delete the cache, API-token and backend-URL variables) belongs on the Deployment page.
- **The resolution:** The note is there as removal guidance ("Upgrading an older Render service"). It names the keys by family, so every 167-removed-name grep still exits 1. It is recorded under `## Sweep exceptions` for 168-08.

**6. [Gate invocation] Prettier was run as `yarn exec prettier` inside `apps/docs`.** This is equivalent to `yarn workspace @openvaa/docs exec prettier`. The plan's own verify commands, which use the workspace form, were run unchanged and pass.

---

**Total deviations:** 3 auto-fixed (accuracy), 3 other (convention, plan conflict, invocation form).
**Impact on plan:** None on scope. Only this plan's 12 pages and its claims file were touched.

## Issues Encountered

None blocking. Findings are in `168-04-CLAIMS.md` § Findings for todos and were not fixed (D-18):

- **F1:** `render.example.yaml` and `docker-compose.dev.yml` omit `PUBLIC_PROJECT_ID`. Its effect is UNCONFIRMED (not run).
- **F2:** `PUBLIC_{BROWSER,SERVER}_FRONTEND_URL` are read by no module. Whether they are reserved or dead is UNCONFIRMED.
- **F3, F4:** cross-references to 168-03 F7, F1, F5 and F6.
- **F5:** `apps/frontend/docker-compose.dev.yml` is unreferenced. Whether anyone uses it is UNCONFIRMED.
- **F6:** the migrations create no Storage bucket.
- **F7:** there is no Admin-app customization editor.
- **F8:** the old Husky advice was stale.

## Known Stubs

None. Every page is fully written, with no placeholder or TODO text.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 168-08 can copy the 17 verdicts into `168-DOCS-AUDIT.md`, decide which of F1, F2, F5 and F6 become todos, and read the three sweep-exception rows.
- 168-06 should read F7 for the Admin app page.
- 168-05 owns Data API and adapters, which Architecture links for detail.
- DOCS-01, DOCS-03 and DOCS-04 stay Pending, because they are shared with sibling plans.

## Self-Check: PASSED

- FOUND: all 12 pages and `168-04-CLAIMS.md`.
- FOUND: commits `79e3f68d7`, `2c733c6e4` and `ea45b9a8f`.
- MEASURED: `git rev-list --count 7e3ea7377..HEAD` = 3 before the metadata commit.
- Plan-level verification at `ea45b9a8f`, each exit read directly:
  - Task 3 verify block 1 = 0.
  - Task 3 verify block 2 = 0.
  - The 167-removed-name grep = 1.
  - The troubleshooting `--only anchor` = 0.
  - `check:research-quotes` (two-base form) = 0.
  - Docs `format:check` = 0.
  - Docs `check` = 0 (653 files, 0/0).

---
*Phase: 168-docs-site-rewrite-strapi-to-supabase*
*Completed: 2026-10-02*
