---
phase: 169-dependency-bump-to-latest-safe-versions
plan: RULINGS
subsystem: infra
tags: [postgres-17, plpgsql_check, eslint-10, eslint-plugin-svelte, svelte5-bindable, a11y, wcag-2.4.3, focus-management, vite-8-browser-target]

requires:
  - phase: 169-07
    provides: "group-5b tree (supabase-js 2.117.2, ssr 0.12.7, exact Deno pins), 12/12 gates, E2E 171/171; HEAD 59be299ca"
  - phase: 169-06
    provides: "the parked PG17 patches (t2-option-a-stable.patch, t2-pg17-config.patch) and the plpgsql_check probe evidence"
  - phase: 169-03
    provides: "the parked ESLint 10 patch (t2c-eslint10-config.patch), the 15 ESLint-10 source fixes (14b62f26c), the planted import-rule proof"
provides:
  - "public.is_valid_choice_id marked STABLE in schema and migration; valid on Postgres 15 and 17"
  - "local Supabase on Postgres 17.6: clean reset, db:types no diff, pgTAP 1335/1335, db:lint:sql 0, full E2E 171/171"
  - "ESLint 10.11.0 / @eslint/js 10.0.1 with the config-lookup flag removed at all 21 sites; three scoped no-useless-assignment disables (eslint-plugin-svelte#1478)"
  - "Layout drawer focus return wired (Header drawerOpenElement $bindable), with a mount-level component test of both close paths"
  - "Vite 8 default build target accepted as the browser floor (recorded, no code)"
affects: [169-08, 169-13]

actuals:
  tokens: 10184   # chars/4 over the realized code diff 59be299ca..bf47b1e96 excluding yarn.lock (40735 chars); 15562 with the lockfile diff (62248 chars)
  tasks: 4        # R1-R4 applied; optional R5 examined and left deferred
  commits: 6      # git rev-list --count 59be299ca..bf47b1e96 (the docs close-out commit follows)
plan_head_before: 59be299caad061b70b6be839ceb156b864a7de96
plan_head_after: bf47b1e967944dea019656717f22d8903302d875

tech-stack:
  added: [eslint 10.11.0, "@eslint/js 10.0.1", "postgres 17.6 (local image postgres:17.6.1.171)"]
  patterns:
    - "A Svelte 5 child that owns an element the parent needs exposes it as a $bindable() prop, and the parent binds it into $state"
    - "A lint false positive with an open upstream issue is absorbed only by a per-line disable that names the issue and is tracked by a removal todo, never by turning the rule off"
    - "A layout component is tested by mounting it for real against fake contexts; jsdom gaps (media playback) are stubbed on the prototype, and fake context state that the component binds to is $state"

key-files:
  created:
    - apps/frontend/src/lib/layouts/main/Layout.svelte.test.ts
    - .planning/todos/pending/2026-10-03-remove-bindable-no-useless-assignment-disables.md
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-RULINGS-SUMMARY.md
  modified:
    - apps/supabase/supabase/schema/011-validation-functions.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/config.toml
    - apps/frontend/src/lib/layouts/main/Layout.svelte
    - apps/frontend/src/lib/layouts/main/Header.svelte
    - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte
    - apps/frontend/src/lib/components/video/Video.svelte
    - apps/frontend/src/lib/dynamic-components/entityList/EntityList.svelte
    - .yarnrc.yml
    - yarn.lock
    - .lintstagedrc.json
    - package.json
    - packages/README.md
    - apps/frontend/package.json
    - "apps/frontend/src/lib/_guards/eslint-{adapter-boundary,adapter-singleton,parse-posture,store}-guard.test.ts"
    - "packages/{app-shared,argument-condensation,core,data,dev-seed,dev-tools,filters,llm,matching,question-info}/package.json"
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-EVIDENCE.md
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/deferred-items.md
    - .planning/REQUIREMENTS.md
    - .planning/HANDOFF.json
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/.continue-here.md

key-decisions:
  - "R1 (operator, in chat, 2026-10-03): local Postgres 17 with option A. is_valid_choice_id is now STABLE in schema and migration, overruling PROH-169-12 for this one reviewed volatility fix. The function calls the STABLE jsonb_agg/jsonb_build_array, so IMMUTABLE was wrong on PG15 too."
  - "R2 (operator, in chat, 2026-10-03): ESLint 10 lands with three one-line eslint-disable-next-line no-useless-assignment comments, one per write-only $bindable prop, each naming eslint-plugin-svelte#1478. PROH-169-07 is overruled for exactly those lines. The rule stays on everywhere else, which is narrower than the todo's option B."
  - "R3 (operator, in chat, 2026-10-03): wire up the drawer focus return. Header's drawerOpenElement is $bindable(), and Layout binds it into $state. That clears ESLint 10's no-unassigned-vars at source and restores WCAG 2.4.3 focus order on close."
  - "R4 (operator, in chat, 2026-10-03): Vite 8's default build target (chrome111/edge111/firefox114/safari16.4/ios16.4) is the accepted browser floor; no build.target override."
  - "Commit order put the R3 fix before the ESLint 10 commit, so every commit is lint-green on its own ESLint version."
  - "R5 (the voter-journey Base-6 slider race) was left deferred. The cause is UNCONFIRMED, and the trace fits a pre-hydration key press, which a bare wait would not fix."
  - "DEPS-08 stays Pending, because 169-13 owns its hosted-Postgres-17 operator todo and the final PG17 gate. DEPS-04 is complete."

patterns-established:
  - "Scoped upstream-false-positive disable: `// eslint-disable-next-line <rule> -- <why>; remove when <issue URL> is fixed`, plus a pending todo that lists every site and how to verify the removal"

requirements-completed: [DEPS-04]

coverage:
  - id: D1
    description: "is_valid_choice_id is STABLE in schema and migration; schema-migration parity holds"
    requirement: DEPS-08
    verification:
      - kind: other
        ref: "yarn assert:schema-migration-parity (exit 0); pg_proc.provolatile = 's' on the PG17 reset"
        status: pass
    human_judgment: false
  - id: D2
    description: "Local Postgres 17.6: clean db:reset, db:types no diff, pgTAP and SQL lint green"
    requirement: DEPS-08
    verification:
      - kind: integration
        ref: "show server_version = 17.6; yarn workspace @openvaa/supabase test:db -> Files=36, Tests=1335, PASS; yarn db:lint:sql exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "ESLint 10.11.0 with the config-lookup flag removed everywhere; lint findings unchanged; guard specs and the planted import-x proof bind on 10"
    requirement: DEPS-04
    verification:
      - kind: other
        ref: "TURBO_FORCE=true yarn lint:check exit 0, normalised list == 07/lint-norm-after.txt; git grep v10_config_lookup -> none; 169-planted-import-rules.sh import-x 4/4; four eslint-*-guard specs 385/385"
        status: pass
    human_judgment: false
  - id: D4
    description: "Closing the navigation drawer returns focus to the menu button that opened it (both close paths)"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/layouts/main/Layout.svelte.test.ts (RED at 05f88a2a6 and against the pre-fix components, GREEN at e3a661517/bf47b1e96)"
        status: pass
      - kind: e2e
        ref: "169-e2e.sh 169-rulings: 171/171 on PG17 (the drawer-using voter, candidate, a11y and perm specs pass)"
        status: pass
    human_judgment: false
  - id: D5
    description: "All twelve D-26 gates and the full E2E suite on the final code HEAD"
    verification:
      - kind: other
        ref: "169-gates.sh 169-rulings-r2 -> 12/12 zero at bf47b1e96"
        status: pass
      - kind: e2e
        ref: "169-e2e.sh 169-rulings -> 171 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run"
        status: pass
    human_judgment: false

duration: 22min
completed: 2026-10-03
status: complete
---

# Phase 169 Operator Rulings (2026-10-03) Summary

**The local stack now runs Postgres 17.6. The one blocker was `is_valid_choice_id` being labelled IMMUTABLE, and it is now STABLE in schema and migration; pgTAP passes 1335/1335 and the SQL lint exits 0. ESLint 10.11.0 replaces 9.39.5, with the config-lookup flag gone from all 21 sites and three per-line disables for an upstream `$bindable` false positive. The navigation drawer now really returns keyboard focus to its menu button, test-first. The twelve gates are 12/12 and the full E2E suite is 171/171 on PG17.**

## Performance

- **Duration:** about 22 min (2026-10-03T15:29Z → 15:51Z)
- **Started:** 2026-10-03T15:29Z
- **Completed:** 2026-10-03T15:51Z
- **Tasks:** 4 rulings applied (R1–R4); optional R5 examined and left deferred
- **Files modified:** 31 code files (`git diff --stat 59be299ca..bf47b1e96`) plus the `.planning` close-out

## Accomplishments

- **R1: local Postgres 17 (option A).**
  - `f1ac8164a`: `is_valid_choice_id` is STABLE in both SQL files, and schema-migration parity holds.
  - `bfdc1afc3`: `major_version = 17`.
  - Only this project's stack was stopped with `--no-backup` and reset. The result:
    - server 17.6;
    - `db:types` no diff;
    - pgTAP `Files=36, Tests=1335` PASS, census file ok;
    - `db:lint:sql` exit 0, with output identical to the PG15 run.
- **R2: ESLint 10.11.0 / `@eslint/js` 10.0.1** (`34ce0d51c`).
  - Age rule re-measured live: 10.12.0 is 0.81 d old.
  - Every peer admits 10.
  - The flag is removed from 21 lines in 18 files; the grep now returns nothing.
  - The guard docblocks were rewritten.
  - There are three scoped disables.
  - `lint:check` returns 0 errors and the same 17 warnings. The normalised list equals 169-07's, so there are zero deltas.
  - The planted import-x proof fired 4/4, and the guard specs passed 385/385, both on 10.
- **R3: drawer focus return (WCAG 2.4.3).**
  - `05f88a2a6` RED: a new mount-level component test covers both close paths.
  - `e3a661517` GREEN: `Header`'s `drawerOpenElement = $bindable()`, and `Layout` uses `$state` + `bind:drawerOpenElement`.
  - `bf47b1e96`: the test's fake `video` context is now reactive, so there are no Svelte dev warnings.
  - This clears ESLint 10's `no-unassigned-vars` at source.
- **R4: browser floor.** The operator accepted Vite 8's default target. This is recorded in EVIDENCE § 7 and HANDOFF; no code changed.
- **Gates:**
  - `169-rulings` at `34ce0d51c`: 12/12.
  - `169-rulings-r2` at the final code HEAD `bf47b1e96`: 12/12.
  - Full E2E `169-rulings` on PG17: 171/171/0/0/0, 4.45 min.

## Task Commits

1. **R1: PG17 with option A.** `f1ac8164a` fix(supabase): mark is_valid_choice_id STABLE; `bfdc1afc3` chore(supabase): local Postgres 17.
2. **R3: drawer focus return (TDD).** `05f88a2a6` test(frontend) RED; `e3a661517` fix(frontend) GREEN; `bf47b1e96` test(frontend), the reactive fake context.
3. **R2: ESLint 10.** `34ce0d51c` chore(lint): move to ESLint 10.
4. **R4: browser floor.** Documentation only, in the close-out commit.

R3 was committed before R2 on purpose. Every commit is lint-green under the ESLint version it ships with: the `no-unassigned-vars` finding is fixed at source before ESLint 10 arrives.

## Files Created/Modified

- `apps/supabase/supabase/schema/011-validation-functions.sql`, `migrations/00001_initial_schema.sql`: `STABLE`.
- `apps/supabase/supabase/config.toml`: `major_version = 17`, with the standing PG15-validity comment.
- `apps/frontend/src/lib/layouts/main/{Layout,Header}.svelte`: the bindable menu-button ref. `Layout.svelte.test.ts` is new.
- `OpinionQuestionInput.svelte`, `Video.svelte`, `EntityList.svelte`: one disable comment each.
- `.yarnrc.yml` catalog, `yarn.lock`, root and workspace `package.json` lint scripts, `.lintstagedrc.json`, the four guard tests, `packages/README.md`: the ESLint 10 move.
- `.planning`:
  - `169-EVIDENCE.md`: § 3 row released, § 4 gate/E2E rows, § 6 rulings section, § 7 resolutions.
  - `deferred-items.md`: R5 note.
  - todos: two moved to `done/` with resolutions, one new pending.
  - `REQUIREMENTS.md`: DEPS-04.
  - `HANDOFF.json`, `.continue-here.md`, `STATE.md`.

## Decisions Made

See `key-decisions` in the frontmatter. All four rulings were given by the operator in chat on 2026-10-03.

## Deviations from the inline plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The saved ESLint 10 patch no longer applied to `.yarnrc.yml`**
- **Found during:** R2.
- **Issue:** later plans (Vitest, Vite and the Supabase catalog entries) had moved the hunk's context.
- **Fix:** `git apply --exclude=.yarnrc.yml` for the other 18 files, then the two catalog lines edited by hand (`eslint ^10.11.0`, `@eslint/js ^10.0.1`).
- **Commit:** `34ce0d51c`.

**2. [Rule 1 - Formatting] The shortened `.lintstagedrc.json` array failed Prettier**
- **Found during:** the R2 pre-commit format check.
- **Fix:** `prettier --write` collapsed the array onto one line.
- **Commit:** `34ce0d51c`.

**3. [Rule 1 - Test hygiene] Svelte `binding_property_non_reactive` warnings in the new test**
- **Found during:** the first gate run's `08-unit` log.
- **Issue:** the fake layout context's `video` was a plain object; `Layout` binds `video.player` / `video.mode` to it.
- **Fix:** made it a `$state` object. Re-verified RED against the pre-fix components and GREEN with no stderr.
- **Commit:** `bf47b1e96`.
- **Effect:** the gate set was re-run on the final code HEAD as `169-rulings-r2`.

**4. [Order] R3 committed before R2.** This keeps every commit lint-green on its own ESLint version. Every ruling was still applied exactly as given.

**5. [Population] 21 flag sites, not 19.** The live `git grep` found 21 lines in 18 files; 169-03 had counted 19. All were removed.

### R5 (optional) not applied

- The voter-journey Base-6 slider race stays in `deferred-items.md`, with a re-examination note.
- `NumberScaleInput` persists in its `change` handler, and `End` fires `change` synchronously. So the trace fits a press that landed before hydration rather than a commit lag.
- A bare wait for `question-delete` would not fix that. The assertion-preserving fix, a `toPass` retry block, needs the race confirmed first.
- The cause is UNCONFIRMED, so the spec was not changed.

**6. [Process slip] `bf47b1e96` also carries the two todo renames**
- **What:** the `git mv` of the PG17 and ESLint-10-held todos from `pending/` to `done/` was still staged when `bf47b1e96` was committed. So that test commit also contains the two pure renames, with 0 changed lines. Their resolution text lands in the docs close-out commit.
- **Why it was left as is:** `bf47b1e96` is the HEAD that the `169-rulings-r2` gate run and the E2E run measured. Rewriting it would orphan those references, and the renames do not touch code.

**Total deviations:** 3 auto-fixed, 1 ordering choice, 1 population correction, 1 process slip (documented, not rewritten); R5 left deferred by its own rule.

## Requirement changes

- **DEPS-04 → Complete.** Every clause is now met:
  - import-x with the planted proof before and after;
  - ESLint 10 with the flag gone and FlatCompat gone;
  - eslint-plugin-svelte 3;
  - the formatter majors with their reformats.
- **DEPS-08 stays Pending.** Its local parts are done: `major_version = 17`, a clean reset, `show server_version`, `database.ts`, pgTAP on 17, and the PG15-validity constraint stated in `config.toml`. But 169-13 lists DEPS-08 and owns the hosted-upgrade operator todo plus the final PG17 gate on one HEAD.

## Issues Encountered

- `timeout` does not exist on this macOS host. Commands ran without it.

## User Setup Required

Once, on every developer machine whose local Supabase volume is still PG15:
`yarn db:stop && yarn workspace @openvaa/supabase exec supabase stop --no-backup && yarn db:reset`.
Local data is re-seeded, not migrated.

## Known Stubs

None.

## Threat Flags

None. No new network endpoint, auth path, file access or trust-boundary schema change. The volatility label does not change who can call the function or what it returns.

## Next Phase Readiness

- **169-08 (group 6, `@faker-js/faker` 10):** starts from `bf47b1e96` plus this close-out, with the local stack on PG17.6 and ESLint 10.11.0 (no flag).
  - A new lint finding must not be absorbed with a disable (PROH-169-07 still holds outside the three ruled lines).
- **nodemailer 10:** still held until 2026-10-04T07:51Z (todo unchanged).
- **169-13:**
  - The PG17 gate is unblocked.
  - The browser-floor confirmation todo is no longer needed.
  - The `@eslint/eslintrc` `via` text in the audit baseline is now stale.
  - Hosted databases that already applied `00001` keep the IMMUTABLE label until they are re-created or a later migration re-declares the function. That is harmless on PG15.
- **Still open for the operator:**
  - the `braces` baseline row (explained, awaiting confirmation; recommended: accept);
  - the Docker credential helper;
  - hosted Postgres 17.

## Self-Check: PASSED

- Files exist: `apps/frontend/src/lib/layouts/main/Layout.svelte.test.ts`, `.planning/todos/pending/2026-10-03-remove-bindable-no-useless-assignment-disables.md`, `.planning/todos/done/2026-10-03-pg17-local-blocked-on-is-valid-choice-id-volatility.md`, `.planning/todos/done/2026-10-03-eslint-10-held-on-bindable-no-useless-assignment.md`, `tests/e2e-runs/169-gates/169-rulings-r2/summary.tsv` (12 rows, all 0), `tests/e2e-runs/169-e2e/169-rulings/summary.json`.
- Commits in `git log`: `f1ac8164a`, `bfdc1afc3`, `05f88a2a6`, `e3a661517`, `34ce0d51c`, `bf47b1e96`.

---
*Phase: 169-dependency-bump-to-latest-safe-versions*
*Completed: 2026-10-03*
