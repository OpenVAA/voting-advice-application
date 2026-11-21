---
phase: 181-deployability-and-migration-model
plan: 05
subsystem: infra
tags: [env-templates, render, docker-compose, adapter-node, supabase-config, edge-functions, verify-jwt, vitest]

# Dependency graph
requires:
  - phase: 181-01
    provides: node_modules installed under Node 24.21.0, and the rule that a status is read from the command itself
provides:
  - packages/dev-seed/tests/deploymentTemplates.test.ts, the spec over the three templates and the config.toml section
  - PUBLIC_PROJECT_ID, ORIGIN, ADDRESS_HEADER and XFF_DEPTH in render.example.yaml and in docker-compose.dev.yml (each with a default there)
  - ORIGIN, ADDRESS_HEADER and XFF_DEPTH as commented lines in .env.example, in a section of their own
  - "[functions.identity-callback] with verify_jwt = false in apps/supabase/supabase/config.toml"
  - evidence/181-05-templates-red.md, the spec failing on the unchanged templates
affects: [181-09, 181-13, 181-16, 182, 184, 185, 189]

# Actuals (#2632)
# tokens is chars/4 over the diff plan_head_before..plan_head_after (16099 characters, six files).
# commits is measured when this summary was written: git rev-list --count plan_head_before..HEAD.
# The commit of this summary and the state commit come after it and are not in the count.
actuals:
  tokens: 4025
  tasks: 3
  commits: 3
plan_head_before: 1b5021fb2535454a7db492639d21f92f388e1d92
plan_head_after: ff08e4af5811da62af68ff41d323159b8a24b8cb

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A spec over a template file isolates the part it means (the environment map of a Compose file, one section of config.toml) before it matches a name"
    - "A case that cannot be seen failing against the file gets a control case over a literal beside it"
    - "A variable that must not be live in .env.example is listed as a commented line, and a spec fails on a live one"

key-files:
  created:
    - packages/dev-seed/tests/deploymentTemplates.test.ts
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-05-templates-red.md
  modified:
    - .env.example
    - render.example.yaml
    - docker-compose.dev.yml
    - apps/supabase/supabase/config.toml

key-decisions:
  - "181-05: the three templates name the variables the production start needs. render.example.yaml declares PUBLIC_PROJECT_ID (sync: false) and ORIGIN, ADDRESS_HEADER and XFF_DEPTH (each marked Check; ORIGIN is https://<INSTANCE_DOMAIN>, the header is x-forwarded-for, the depth is 1). docker-compose.dev.yml passes the same four with defaults: the default project id, http://localhost:3000, an empty ADDRESS_HEADER and 1. .env.example lists the three proxy variables as commented lines only."
  - "181-05: config.toml declares [functions.identity-callback] with verify_jwt = false. No stack was started, stopped or reset, so the running local stack still serves the function as before; the setting takes effect when a stack is next started from this worktree."
  - "181-05: the spec's check for a live line in .env.example also refuses leading whitespace and an export prefix, which is wider than the plan's 'no line begins VARIABLE='. Three of its cases pass before the change and have no red run against the file; a control case over literals stands in for one."
  - "181-05: DEPLOYMENT_DIAGNOSTICS and BUILD_SHA were not added to any template. The plan lists neither."

patterns-established:
  - "Proxy variables are kept commented in .env.example; the reason is written above them in the file"
  - "A new variable of docker-compose.dev.yml takes the ${NAME:-default} form, and the spec refuses the bare ${NAME} form for the four it knows"

# The plan's frontmatter lists SUPA-10 as the phase's closing requirement, and the template orders the
# list to be copied. This plan closes nothing: SUPA-10 is NOT closed and was not marked complete
# (requirements.ready-ids answered "0/1 requirement(s) ready to mark complete").
requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "render.example.yaml and docker-compose.dev.yml name PUBLIC_PROJECT_ID, ORIGIN, ADDRESS_HEADER and XFF_DEPTH; in the Compose file each has a default"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/deploymentTemplates.test.ts, blocks 'render.example.yaml' and 'docker-compose.dev.yml' (12 cases; 8 of them failed on the unchanged tree)"
        status: pass
      - kind: other
        ref: "docker compose -f docker-compose.dev.yml config --quiet: exit 0"
        status: pass
    human_judgment: true
    rationale: "Only the text of the two files is checked. No image was built and no container was started with them, so that the production server starts and accepts a form post with these values is not observed here. The depth 1 on Render is unmeasured and the entry says so. Plans 181-09 and 181-13 observe the built server."
  - id: D2
    description: ".env.example lists ORIGIN, ADDRESS_HEADER and XFF_DEPTH as commented lines and has no live line for any of them"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/deploymentTemplates.test.ts, block '.env.example' (8 cases; 3 of them failed on the unchanged tree)"
        status: pass
      - kind: other
        ref: "node scripts/assert-env-pair-registry.mjs: exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "config.toml declares verify_jwt = false for identity-callback"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/deploymentTemplates.test.ts, block 'apps/supabase/supabase/config.toml' (3 cases; 2 of them failed on the unchanged tree)"
        status: pass
      - kind: other
        ref: "node scripts/assert-auth-signup-closed.mjs: exit 0"
        status: pass
    human_judgment: true
    rationale: "The declaration is checked as text, and the pinned CLI loads the file. What the gateway does with an unauthenticated request to the function was not measured: no stack was restarted. Plan 181-16 measures the local effect. The value rests on follow-up 181-R3, which the operator has not ruled on."
  - id: D4
    description: "The spec was seen failing on the unchanged templates, and the record is committed"
    verification:
      - kind: other
        ref: "Task 1 <verify><automated> of 181-05-PLAN.md, run verbatim: exit 0 (SPEC_EXIT_BEFORE=1, 13 of 23 cases failed)"
        status: pass
    human_judgment: false

# Metrics
duration: 6min
completed: 2026-10-12
status: complete
---

# Phase 181 Plan 05: Template Variables and the JWT Setting of identity-callback Summary

**`render.example.yaml` and `docker-compose.dev.yml` now name `PUBLIC_PROJECT_ID`, `ORIGIN`, `ADDRESS_HEADER` and `XFF_DEPTH`, `.env.example` lists the three proxy variables commented out, and `config.toml` declares `verify_jwt = false` for `identity-callback`, all behind a spec that failed with 13 of 23 cases on the unchanged tree. Everything is checked as text: no image was built, no container was started with the new values, and no stack was restarted, so the running local stack still serves the function as it did.**

## Performance

- **Duration:** 6 min for the three tasks and their checks
- **Started:** 2026-10-12T17:31:05Z
- **Completed:** 2026-10-12T17:37:27Z
- **Tasks:** 3 of 3
- **Files modified:** 6 (2 new, 4 changed)

## Accomplishments

- `packages/dev-seed/tests/deploymentTemplates.test.ts` has 23 cases in four blocks, one per file. Each block starts with a case that the file was read and is not empty.
- `render.example.yaml`: `- key: PUBLIC_PROJECT_ID` with `sync: false`, directly after the `PUBLIC_SUPABASE_ANON_KEY` entry. After the `PUBLIC_SERVER_FRONTEND_URL` entry, a group of three: `- key: ORIGIN # Check` with `value: https://<INSTANCE_DOMAIN>`, `- key: ADDRESS_HEADER # Check` with `value: x-forwarded-for`, `- key: XFF_DEPTH # Check` with `value: '1'`. One comment line above the two address entries says the depth on Render has not been measured.
- `docker-compose.dev.yml`: four new `environment` entries, each in the `${NAME:-default}` form. The `PUBLIC_SUPABASE_URL` line is unchanged.
- `.env.example`: a new section, `# Reverse proxy (production server only)`, between `# Frontend configuration` and `# Local data adapter (optional)`. It holds three commented lines and a comment that says why they stay commented. The cross-runtime pair block is untouched.
- `apps/supabase/supabase/config.toml`: `[functions.identity-callback]` directly after the `[edge_runtime.secrets]` block, with three comment lines and `verify_jwt = false`. Nothing is declared for `account-access` or `send-email`.

## Recorded statuses

Every status was read from `$?` of the command itself, with the output sent to a file under `tmp/181-05/` (ignored by git). No status was read through a pipe. None of these commands goes through turbo: the workspace script is `vitest run`, and the others call `node`, `eslint`, `tsc`, `prettier` and `docker compose` directly.

| Check | Command | Commit or tree | Status |
|-------|---------|----------------|--------|
| Red control | `yarn workspace @openvaa/dev-seed test:unit tests/deploymentTemplates.test.ts` | `1b5021fb2`, templates unchanged, the spec untracked | **1** (13 failed, 10 passed), as required |
| Task 1 verify | the plan's command, verbatim | working tree before `c60cc0bf9` | 0 |
| Task 2 verify | the plan's chained command, verbatim: `localSupabaseUrl.test.ts`, `assert-env-pair-registry.mjs`, `docker compose -f docker-compose.dev.yml config --quiet` | working tree before `8278d3f1f` | 0 (63 tests passed) |
| The spec between Task 2 and Task 3 | the spec alone | `8278d3f1f` | 1 (2 failed, 21 passed): only the two `config.toml` cases |
| Task 3 verify | the plan's chained command, verbatim: the spec, `localSupabaseUrl.test.ts`, `assert-auth-signup-closed.mjs` | working tree before `ff08e4af5` | 0 (2 files, 86 tests passed) |
| The spec alone, after Task 3 | the spec alone | working tree before `ff08e4af5` | 0 (23 passed) |
| Plan-level verification | the spec, `localSupabaseUrl.test.ts`, `assertEnvPairRegistryGate.test.ts`, `ciDockerImageBuildGate.test.ts` in one Vitest run | `ff08e4af5`, no tracked change | 0 (4 files, 97 tests passed) |
| | `node scripts/assert-env-pair-registry.mjs` | `ff08e4af5` | 0 |
| | `node scripts/assert-auth-signup-closed.mjs` | `ff08e4af5` | 0 (3 keys hold) |
| | `node scripts/assert-comment-hygiene.mjs` | `ff08e4af5` | 0 (0 violations) |
| | `docker compose -f docker-compose.dev.yml config --quiet` | `ff08e4af5` | 0 |
| dev-seed type check | `yarn workspace @openvaa/dev-seed typecheck` (its include list holds `tests/**`) | `ff08e4af5` | 0 |
| eslint, the spec | `yarn workspace @openvaa/dev-seed exec eslint tests/deploymentTemplates.test.ts` | `ff08e4af5` | 0 |
| prettier, whole repository | `yarn prettier --check .` (the middle link of `format:check`, run alone) | `ff08e4af5` | 0 |

**Not run:** `yarn build`, an image build, `docker compose up`, `yarn test:unit` at the root, the whole dev-seed suite, `yarn lint:check`, `yarn format:check` as a whole, any `supabase start`, `supabase stop` or `yarn db:*` command. The whole dev-seed suite was left out on purpose: with a root `.env` its integration tier seeds the shared database, and this plan needs no database.

`prettier` has no parser for `config.toml` (it exits 2 with "No parser could be inferred" when the file is named to it), and `.prettierignore` excludes `.env.*`, so of the four changed files only the two YAML files are format-checked.

### Acceptance criteria

All were checked by command.

- **Task 1.** The spec names the three templates and `apps/supabase/supabase/config.toml`. The record holds `SPEC_EXIT_BEFORE=1` and failing cases for all four files. The spec's only expectations on a count are "greater than 0" and the one match of the `PUBLIC_SUPABASE_URL` pattern; the variables come from the two lists it iterates.
- **Task 2.** The nine quoted lines are in the three files, and the `PUBLIC_SUPABASE_URL` line is byte-for-byte as before. `git show --stat --format= 8278d3f1f` lists exactly `.env.example`, `docker-compose.dev.yml` and `render.example.yaml` (20, 4 and 10 added lines). The diff of that commit over the three files has no removed line. `localSupabaseUrl.test.ts` passes. No line beginning `SUPABASE_URL=` or `PUBLIC_SUPABASE_URL=` was added.
- **Task 3.** `[functions.identity-callback]` is followed by `verify_jwt = false` before the next header. `grep -c '^\[functions\.'` prints 1. The diff of `config.toml` has six added lines, no removed line, and does not touch the `[storage.buckets.*]` blocks. The spec exits 0 where Task 1 recorded 1. `docker ps --format '{{.Names}}'` gave the same 24 names, 13 of them `_openvaa-local`, before the plan, after Task 3's edit and after its commit.

## Task Commits

1. **Task 1: Write the template spec and see it fail on the unchanged tree** - `c60cc0bf9` (test)
2. **Task 2: Add the variables to the three templates** - `8278d3f1f` (feat)
3. **Task 3: Declare the JWT setting of identity-callback in config.toml** - `ff08e4af5` (feat)

## Files Created/Modified

- `packages/dev-seed/tests/deploymentTemplates.test.ts` - the spec; local helpers `read`, `capture`, `composeEnvironment`, `composeEntriesWithDefault`, `liveLines`, `commentedLines`
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-05-templates-red.md` - `SPEC_EXIT_BEFORE=1`, the date, the commit, the 13 failing cases as Vitest prints them, and the 10 cases that passed with the reason for each
- `.env.example` - the section `# Reverse proxy (production server only)`
- `render.example.yaml` - four `envVars` entries and one comment line
- `docker-compose.dev.yml` - four `environment` entries
- `apps/supabase/supabase/config.toml` - the section `[functions.identity-callback]`

## Decisions Made

- **The Compose cases read the `environment` map, not the whole file.** `composeEnvironment` takes the lines indented deeper than the first `environment:` key. A name that appeared only in a comment or under another key would not satisfy a case.
- **A commented `- key:` line does not satisfy the Render cases.** The pattern allows only whitespace before `- key:`, so `# - key: ORIGIN` is not a match.
- **The live-line check is wider than the plan's wording.** The plan says no line begins `VARIABLE=`. The spec also refuses leading whitespace and an `export` prefix, because dotenv and Compose read both as assignments.
- **Two control cases over literals.** The three `has no live line` cases pass on the unchanged tree, because the file did not name the variables at all, so they were never seen failing against the file. A control case shows that the matcher finds `ORIGIN=…` and `export ORIGIN = …` and does not find `# ORIGIN=…`. A second control shows that the Compose matcher refuses `ORIGIN: ${ORIGIN}` and accepts `ORIGIN: ${ORIGIN:-}`.
- **The `verify_jwt` case expects exactly one assignment in the section, with the value `false`.** A second `verify_jwt` line in the section fails it.
- **Where the entries went.** In the Compose file `PUBLIC_PROJECT_ID` follows `PUBLIC_SUPABASE_ANON_KEY`, as in the Render file, and the three proxy entries are at the end of the map. The plan fixes the places in the Render file and leaves the Compose file open.

## Deviations from Plan

None in what was built: the three tasks were executed as written, and no Rule 1 to 4 case arose.

### Checks added to the plan's verify commands

These changed no tracked file.

- **The Compose file resolved with an empty env file.** `docker compose --env-file /dev/null -f docker-compose.dev.yml config`, with none of the four variables set in the shell, gave `PUBLIC_PROJECT_ID: 00000000-0000-0000-0000-000000000001`, `ORIGIN: http://localhost:3000`, `ADDRESS_HEADER: ""` and `XFF_DEPTH: "1"`. The empty env file keeps Compose from reading the root `.env` for this observation.
- **The pinned CLI loads the edited `config.toml`.** `supabase status --workdir apps/supabase` exited 0 before and after the edit, with its standard output discarded because it holds keys. Two controls on a scratch copy under `tmp/181-05/cfg/`: with `verify_jwt = "not-a-boolean"` the same command exits 1 with `StatusConfigLoadError` / `failed to read config: CliConfigParseError`, and with the copy unmodified it exits 0. So the loader of CLI 2.118.0 reads the new key and checks its type. `supabase status` reads Docker and changes nothing; the container names were the same afterwards.
- **The dev-seed type check, eslint on the spec, the comment-hygiene guard and `prettier --check .`**, in the table above.

## Issues Encountered

- **A command that should not have been run.** One shell line held `git stash list >/dev/null 2>&1`. It had no purpose there. The executor rules forbid every `git stash` subcommand in a shared checkout. `list` reads and writes nothing, its output was discarded, and no stash was created, applied or dropped. It is reported so the record is complete.
- **The plan's Compose check reads the root `.env`.** `docker compose -f docker-compose.dev.yml config --quiet` is the plan's own verify command, and Compose loads `.env` from the project directory by itself to substitute variables. With `--quiet` it prints nothing, and nothing was printed. No other command of this plan opened that file, and it was not listed or changed.

## What a later plan must know

- **Nothing here was observed on a running server.** That the production image starts with the Compose defaults, that `ORIGIN=http://localhost:3000` lets a form post through on port 3000, and that the client address is read with depth 1 are for plans 181-09 and 181-13.
- **The Compose file passes `ADDRESS_HEADER` as an empty string when it is unset**, not as an absent variable. In adapter-node 5.5.7 the handler reads `env('ADDRESS_HEADER', '')` and tests the result for truthiness, so an empty value is the same as none. That was read in `node_modules/@sveltejs/adapter-node/files/handler.js`, not observed on a server.
- **A live `ORIGIN` in the root `.env` reaches the Compose service**, since the entry is `${ORIGIN:-http://localhost:3000}` and Compose reads `.env`. That is the reason for the commented lines. Whether the operator's own `.env` has such a line was not looked at.
- **In `render.example.yaml` two defaults name different hosts.** `ORIGIN` is `https://<INSTANCE_DOMAIN>`, as the plan orders, while `PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL` are still `https://<INSTANCE_NAME>-frontend.onrender.com`. A deployment reached at its `onrender.com` address with `ORIGIN` set to the custom domain would have its form posts refused, by the mechanism the comment in `.env.example` describes. All three entries are marked `# Check`. Wording and reordering of the template stay with phase 189.
- **`verify_jwt = false` is not in effect on the running local stack.** The edge runtime reads `config.toml` when a stack starts. Until a stack is started from this worktree, the function is served as before, with the gateway verifying. The sibling worktree has its own `config.toml` on its own branch, without this section, so which worktree starts the shared stack decides how the function is served. Plan 181-16 restarts and measures.
- **The value `false` rests on follow-up 181-R3**, and the address entries of `render.example.yaml` on 181-R5. The operator has ruled on neither. If 181-R3 is overruled, the value becomes `true`, the `verify_jwt` case of the spec changes with it, and the function's comments, `.env.example` (its Identity Provider section says the endpoint "is served `--no-verify-jwt`") and the runbook are corrected. If 181-R5 is overruled, `ADDRESS_HEADER` and `XFF_DEPTH` leave `render.example.yaml` and the spec's Render cases shrink to `PUBLIC_PROJECT_ID` and `ORIGIN`: `SERVER_VARIABLES` drives both the Render and the Compose block, so the lists have to be split.
- **Phase 182 adds its variables to the same three templates.** The spec asserts presence only, so added entries do not disturb it. A new entry of the Compose file should take the `${NAME:-default}` form.
- **Three variables of earlier plans are still in no template:** `DEPLOYMENT_DIAGNOSTICS` (181-03) and `BUILD_SHA` (181-04) are named in none of the three files, and this plan's list holds neither. `ORIGIN` is now in all three. `/api/health` and `/api/diagnostics` are in no document.
- **`.planning/PROJECT.md` was read in part:** its opening, Context and Constraints sections. A search of the rest for `verify_jwt`, `ADDRESS_HEADER`, `XFF_DEPTH`, `render.example`, `.env.example` and `ORIGIN` found nothing. `181-RESEARCH.md` was read at Q7, Q8, Pitfall 8 and "The JWT setting"; `181-PATTERNS.md` at the two assignments this plan names; `181-CONTEXT.md` at D-16, A-10 and A-12.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Plans 181-09 and 181-13 can start the production server from `docker-compose.dev.yml` with the four variables supplied by default.
- Plan 181-16 finds the JWT setting declared and measures its local effect.
- Not closed here: SUPA-10 stays open until the last plan of the phase. INFRA-05, INFRA-06 and SUPA-05 are built toward and closed by phases 184 and 185.

## Self-Check: PASSED

- The six files of the plan exist.
- Commits `c60cc0bf9`, `8278d3f1f` and `ff08e4af5` are ancestors of `HEAD`.
- `commits: 3` is `git rev-list --count 1b5021fb2..HEAD` at the time of writing, with `HEAD` at `ff08e4af5`.
- The four changed template and configuration files have no removed line over `1b5021fb2..HEAD`.
- The must-have artifacts hold: the spec contains `functions.identity-callback]`, `config.toml` contains `[functions.identity-callback]`, the record contains `SPEC_EXIT_BEFORE=`, and `docker-compose.dev.yml` has one line matching `ORIGIN: ${ORIGIN:-`.
- The plan-level verification holds: the spec failed before the edits (recorded) and passes after them; `localSupabaseUrl.test.ts`, `assert-env-pair-registry.mjs` and `assert-auth-signup-closed.mjs` pass; the shared stack was not restarted.
- No stub pattern was found in the files this plan created or changed.

---
*Phase: 181-deployability-and-migration-model*
*Completed: 2026-10-12*
