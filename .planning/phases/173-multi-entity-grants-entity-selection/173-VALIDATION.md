---
phase: "173"
slug: "multi-entity-grants-entity-selection"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-06"
---

# Phase 173 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Thirteen plans, thirteen serial
> waves, 52 tasks. Every task has an automated verify command with a stated failing direction; no task
> depends on a manual check to close.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frameworks** | Vitest (frontend, packages, the tests' own utilities), pgTAP (`supabase test db`), Playwright with `@axe-core/playwright` |
| **Config files** | `apps/frontend/vitest.config.ts`, `tests/vitest.config.ts`, `apps/supabase/supabase/tests/database/*.test.sql`, `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend vitest run <file filter>` · `yarn vitest run --config tests/vitest.config.ts <filter>` · `yarn workspace @openvaa/supabase test:db` |
| **Full suite command** | `bash .planning/phases/173-multi-entity-grants-entity-selection/173-gates.sh <label> [--rows <names>]` (twelve gate rows by default, or a named subset) then `bash .planning/phases/173-multi-entity-grants-entity-selection/173-e2e.sh <label>` (one full default E2E run through `tests/scripts/e2e-run.sh --no-db-reset`) |
| **Verdict commands** | `node .planning/phases/173-multi-entity-grants-entity-selection/173-verdict.mjs gates <label> [--rows <names>]` · `… e2e <label> [--min-total-of <label2>] [--same-projects-as <label2> [--except <project>=<delta>]…] [--expect-project <name>]…` · `… greps` · `… exemptions` |
| **Estimated runtime** | targeted Vitest filter 10–60 s; frontend typecheck about 60–90 s; pgTAP about 60 s; gate set about 5–10 min; full E2E about 5–8 min (both long runs are launched in the background and polled) |

The two drivers and the verdict script are created by 173-01 Task 2; they do not exist before it.

**How a run is compared with another.** `--min-total-of` means "not below": the run has at least the other
run's test count. `--same-projects-as` is the per-project comparison: every project has exactly its total
in the other run, except a project named in `--except`, which is that many tests above it (an integer) or
above it by any amount (`+`). A plan uses the second wherever it claims equality or a stated delta, and the
first only where "not below" is what is meant.

---

## Sampling Rate

- **After every task commit:** the task's own `<automated>` command — a targeted Vitest filter, the frontend
  typecheck or svelte-check, pgTAP, or a guard script. Each runs in the foreground in under about two minutes.
- **After every plan (every wave):** see the run schedule below.
- **Before `/gsd-verify-work`:** the closing gate of 173-13 Task 4 on one tree: the gate set, the
  adapter-level integration test, the four closing searches, the exemption count and one full E2E run.
- **Max feedback latency:** about 120 seconds per task; about 20 minutes per plan close.
- **Never:** a retry until green, a skipped test, a status read through a pipe, a foreground command over
  about eight minutes, a deletion under `tests/e2e-runs/`.

### Run schedule

Ten plans close on the twelve-row gate set and a full E2E run. Three close on a subset of gate rows and
their own targeted checks, with no E2E run of their own, and name the next behavioural plan's full run as
their boundary proof.

| Plan | Gate rows at close | Full E2E at close | E2E comparison | Boundary proof for |
|------|--------------------|-------------------|----------------|--------------------|
| 173-01 | twelve | yes (`173-01-baseline`) | — (the baseline) | — |
| 173-02 | twelve | yes | not below the baseline | — |
| 173-03 | twelve | yes | not below the baseline | — |
| 173-04 | `typecheck,lint,unit,check-frontend` | no | — | — |
| 173-05 | twelve | yes | not below the baseline | 173-04 |
| 173-06 | `typecheck,lint,unit` + the tests-utility Vitest | no | — | — |
| 173-07 | twelve | yes | every project equal to the baseline | 173-06 |
| 173-08 | twelve | yes | every project equal to the baseline | — |
| 173-09 | `typecheck,lint,unit,check-frontend,docs-links` | no | — | — |
| 173-10 | twelve | yes | not below the baseline | 173-09 |
| 173-11 | twelve | yes | every project equal to the baseline | — |
| 173-12 | twelve | yes (after a slice of the new project) | every project equal to `173-11-base`, except the three new projects | — |
| 173-13 | twelve | yes (after a slice of the scan project) | every project equal to `173-12-spec`, except the scan project at exactly six more | — |

173-05, 173-07 and 173-10 each state, in their closing task, which failures of their run point back to the
plan before.

---

## Per-Task Verification Map

`T-173-NN` are the threat ids of the plans' `<threat_model>` blocks. "W0" marks a test file the plan itself
creates before the task that needs it.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 173-01-01 | 01 | 1 | ENT-03, GEN-02 | T-173-01 | every assumed fact is re-measured before use; the record files are read, never edited | doc check | `grep` of the name map's headings and A1–A13 rows; PLAN and SUMMARY counts above 0 and equal for 171 and 172; `git diff --quiet` of the three record files against the tree read | ❌ W0 (`173-NAME-MAP.md`) | ⬜ pending |
| 173-01-02 | 01 | 1 | ENT-03, GEN-02 | T-173-02 | a verdict refuses a stale, partial or subset run | gate + E2E | `bash -n` both drivers; `node …/173-verdict.mjs gates 173-01-baseline && … e2e 173-01-baseline` | ❌ W0 (drivers) | ⬜ pending |
| 173-02-01 | 02 | 2 | ENT-03, GEN-02 | T-173-03, T-173-05, T-173-07 | both functions are invoker, refuse `anon`, carry no default; the old function is gone | catalogue + unit | `yarn assert:schema-migration-parity && yarn assert:rpc-nullability && yarn assert:project-scoped-queries && yarn assert:adapter-casts && yarn db:lint:sql && command -v psql && psql "${DATABASE_URL:-<local default>}" … pg_proc check`; `yarn workspace @openvaa/frontend vitest run supabaseDataWriter userEntities` | ✅ writer test · ❌ W0 `userEntities.test.ts` | ⬜ pending |
| 173-02-02 | 02 | 2 | ENT-03, GEN-02 | T-173-03, T-173-04, T-173-06, T-173-07, T-173-08 | no row and no raise for an entity that is not the caller's; list equals what can be read, both stale-token directions | pgTAP | `yarn workspace @openvaa/supabase test:db` | ✅ `36-entity-identity.test.sql` (rewritten) | ⬜ pending |
| 173-02-03 | 02 | 2 | GEN-02 | T-173-54, T-173-55, T-173-56 | a row update, `upsert_answers` and a storage upload are each refused for an entity the caller does not edit (nine cells: four cited, five added) | pgTAP | `yarn workspace @openvaa/supabase test:db` + the nine rows of `## Write refusals` in the name map | ✅ `18-entity-policies`, `10-schema-migrations`, `20-storage-authority` (extended) | ⬜ pending |
| 173-02-04 | 02 | 2 | ENT-03 | T-173-09 | the name gate keeps one exemption | guard | `node scripts/assert-no-candidate-app-names.mjs --self-test && node scripts/assert-no-candidate-app-names.mjs && node …/173-verdict.mjs exemptions` + two zero-hit searches | ✅ | ⬜ pending |
| 173-02-05 | 02 | 2 | ENT-03, GEN-02 | — | N/A | gate + E2E | `node …/173-verdict.mjs gates 173-02-schema && … e2e 173-02-schema --min-total-of 173-01-baseline` | ✅ | ⬜ pending |
| 173-03-01 | 03 | 3 | GEN-02 | T-173-10, T-173-12, T-173-13 | an unserved type throws by name in all three writers | unit | `yarn workspace @openvaa/frontend vitest run supabaseDataWriter && yarn workspace @openvaa/frontend typecheck && yarn assert:project-scoped-queries && yarn assert:adapter-casts` | ✅ | ⬜ pending |
| 173-03-02 | 03 | 3 | GEN-02 | T-173-11 | a save targets the loaded entity's own type and id | unit | `yarn workspace @openvaa/frontend typecheck && yarn workspace @openvaa/frontend vitest run contestantUserDataState supabaseDataWriter` | ✅ | ⬜ pending |
| 173-03-03 | 03 | 3 | GEN-02 | T-173-12 | the served filter is applied once; a failed list is a failed read | unit | `yarn workspace @openvaa/frontend typecheck && yarn workspace @openvaa/frontend vitest run layout.server.test contestantUserDataState contestantContext` + a zero-hit search for the old names in routes and the context | ✅ | ⬜ pending |
| 173-03-04 | 03 | 3 | GEN-02 | — | N/A | unit + search | `yarn workspace @openvaa/frontend typecheck && yarn workspace @openvaa/frontend vitest run contestantUserDataState contestantContext supabaseDataWriter supabaseAdapter.concurrency layout.server.test && yarn assert:project-scoped-queries` + a zero-hit search for the four retired names | ✅ | ⬜ pending |
| 173-03-05 | 03 | 3 | GEN-02 | T-173-14, T-173-57 | the real writer saves an organization through the caller's own session and is refused six writes to entities the caller does not edit | integration | `node -e` over `tests/e2e-runs/173-gates/173-03-integration.json` (passed ≥ 7, failed 0, pending 0) | ❌ W0 (`supabaseDataWriter.integration.test.ts`) | ⬜ pending |
| 173-03-06 | 03 | 3 | GEN-02 | — | N/A | gate + E2E | `node …/173-verdict.mjs gates 173-03-writer && … e2e 173-03-writer --min-total-of 173-01-baseline` | ✅ | ⬜ pending |
| 173-04-01 | 04 | 4 | ENT-02 | T-173-17 | an empty prefix cannot clear the storage | unit | `yarn workspace @openvaa/frontend vitest run persistedState` | ✅ | ⬜ pending |
| 173-04-02 | 04 | 4 | ENT-02 | T-173-15, T-173-16 | a draft is never shown for or saved to another entity; logout clears every entity's draft | unit | `yarn workspace @openvaa/frontend vitest run contestantUserDataState contestantContext && yarn workspace @openvaa/frontend check` + zero-hit search for the fixed key | ✅ | ⬜ pending |
| 173-04-03 | 04 | 4 | ENT-02 | — | N/A | gate subset | `node …/173-verdict.mjs gates 173-04-store --rows typecheck,lint,unit,check-frontend` (no E2E; boundary proof 173-05) | ✅ | ⬜ pending |
| 173-05-01 | 05 | 5 | ENT-03 | T-173-21 | a foreign type or a malformed id never reaches a load | unit | `yarn workspace @openvaa/frontend vitest run src/params && yarn workspace @openvaa/frontend typecheck` | ❌ W0 (three matcher tests) | ⬜ pending |
| 173-05-02 | 05 | 5 | ENT-03 | T-173-18, T-173-19, T-173-20 | the entry gate admits two shapes exactly; an admin grant is never masked | unit | `yarn workspace @openvaa/frontend vitest run passwordLogin requireAdminIdentity supabaseDataWriter layout.server.test && yarn workspace @openvaa/frontend typecheck && node scripts/assert-no-candidate-app-names.mjs` | ✅ | ⬜ pending |
| 173-05-03 | 05 | 5 | ENT-03 | — | N/A | unit | `yarn workspace @openvaa/frontend vitest run contestantContext supabaseDataWriter contestantUserDataState && yarn workspace @openvaa/frontend check && bash .claude/scripts/audit-skill-links.sh components` | ✅ | ⬜ pending |
| 173-05-04 | 05 | 5 | ENT-03 | — | N/A | gate + E2E | `node …/173-verdict.mjs gates 173-05-prep && … e2e 173-05-prep --min-total-of 173-01-baseline` (also the boundary proof of 173-04) | ✅ | ⬜ pending |
| 173-06-01 | 06 | 6 | ENT-01, ENT-02 | T-173-22, T-173-23 | the tests' builder throws on an unfilled param | unit (tests utils) | `yarn vitest run --config tests/vitest.config.ts buildRoute contestantEntityUrl && yarn typecheck:tests` | ❌ W0 (`buildRoute.test.ts`, `contestantEntityUrl.test.ts`) | ⬜ pending |
| 173-06-02 | 06 | 6 | ENT-01, ENT-02 | T-173-23 | no hand-written pattern for a protected path remains in a spec | lint + search | `yarn typecheck:tests && node_modules/.bin/eslint <spec dirs>` + zero-hit search | ✅ | ⬜ pending |
| 173-06-03 | 06 | 6 | ENT-01, ENT-02 | — | N/A | gate subset + unit | `yarn vitest run --config tests/vitest.config.ts buildRoute contestantEntityUrl && node …/173-verdict.mjs gates 173-06-harness --rows typecheck,lint,unit` (no E2E; boundary proof 173-07) | ✅ | ⬜ pending |
| 173-07-01 | 07 | 7 | ENT-02 | — | N/A | unit | `yarn workspace @openvaa/frontend vitest run routeConsistency route.test contestantHome && yarn workspace @openvaa/frontend typecheck` | ✅ | ⬜ pending |
| 173-07-02 | 07 | 7 | ENT-02 | T-173-25, T-173-26 | no session in a load's return; the user-level load reads no `url`, `route` or param | unit | `yarn workspace @openvaa/frontend typecheck && yarn workspace @openvaa/frontend vitest run layout.server.test layout.tracking signOutToLogin termsOfUseLayout && yarn assert:no-session-in-loads` | ✅ user-level test · ❌ W0 guard, helper test | ⬜ pending |
| 173-07-03 | 07 | 7 | ENT-02 | T-173-24, T-173-26, T-173-27 | a gated user's entity is never read; the entity-level load awaits its parent and reads no `url` | unit | `yarn workspace @openvaa/frontend vitest run layout.server.test layout.tracking termsOfUseLayout signOutToLogin && yarn workspace @openvaa/frontend check && yarn assert:no-session-in-loads` | ❌ W0 entity-level test and guard | ⬜ pending |
| 173-07-04 | 07 | 7 | ENT-02 | — | N/A | unit | `yarn workspace @openvaa/frontend vitest run contestantHomeRoute contestantContext && yarn workspace @openvaa/frontend check` | ❌ W0 (`contestantHomeRoute.test.ts`) | ⬜ pending |
| 173-07-05 | 07 | 7 | ENT-02 | — | N/A | gate + E2E | `node …/173-verdict.mjs gates 173-07-split && … e2e 173-07-split --same-projects-as 173-01-baseline` (also the boundary proof of 173-06) | ✅ | ⬜ pending |
| 173-08-01 | 08 | 8 | ENT-01, ENT-02 | — | N/A | unit | `yarn workspace @openvaa/frontend vitest run routeConsistency route.test contestantHome && yarn workspace @openvaa/frontend typecheck` | ✅ | ⬜ pending |
| 173-08-02 | 08 | 8 | ENT-01, ENT-02 | T-173-31, T-173-32 | no redirect while a gate is pending; the root reads no `url` and no param, held by a guard | unit | `yarn workspace @openvaa/frontend vitest run page.server.test page.tracking layout.server.test layout.tracking routeConsistency && yarn assert:no-session-in-loads` | ❌ W0 (root `page.server.test.ts`, `page.tracking.test.ts`) | ⬜ pending |
| 173-08-03 | 08 | 8 | ENT-01, ENT-02 | T-173-30, T-173-32 | the resolver's target is built from validated parts; it reads `page` alone, held by a guard; it never signs out | unit | `yarn workspace @openvaa/frontend vitest run page.server.test page.tracking loginRedirectTarget routeConsistency && yarn assert:no-session-in-loads` | ❌ W0 (resolver `page.server.test.ts`, `page.tracking.test.ts`) | ⬜ pending |
| 173-08-04 | 08 | 8 | ENT-01, ENT-02 | T-173-28, T-173-29, T-173-31 | another user's entity id, an unserved type and a stale grant are refused with one identical redirect | unit | `yarn workspace @openvaa/frontend vitest run layout.server.test layout.tracking ContestantNav && yarn workspace @openvaa/frontend check` | ✅ load tests · ❌ W0 `ContestantNav.svelte.test.ts` | ⬜ pending |
| 173-08-05 | 08 | 8 | ENT-01, ENT-02 | — | N/A | gate + E2E | `yarn vitest run --config tests/vitest.config.ts contestantEntityUrl && node …/173-verdict.mjs gates 173-08-move && … e2e 173-08-move --same-projects-as 173-01-baseline` | ✅ | ⬜ pending |
| 173-09-01 | 09 | 9 | ENT-01 | T-173-37 | default-off props leave every existing card unchanged | component | `yarn workspace @openvaa/frontend vitest run EntityCard hoverShadedRule && yarn workspace @openvaa/frontend check` | ❌ W0 (`EntityCard.svelte.test.ts`) | ⬜ pending |
| 173-09-02 | 09 | 9 | ENT-01 | — | N/A | unit | `yarn workspace @openvaa/frontend vitest run translations && yarn assert:i18n-catalog-namespaces && yarn workspace @openvaa/frontend typecheck && yarn typecheck:tests` + the fourteen message files and the generated key | ✅ | ⬜ pending |
| 173-09-03 | 09 | 9 | ENT-01 | T-173-35, T-173-36, T-173-38 | the email is escaped text, never hyphenated or translated; omitted whole when absent | component | `yarn workspace @openvaa/frontend vitest run ContactSupport NothingToEdit && yarn workspace @openvaa/frontend check` | ❌ W0 (two component tests) | ⬜ pending |
| 173-09-04 | 09 | 9 | ENT-01 | — | N/A | gate subset | `node …/173-verdict.mjs gates 173-09-parts --rows typecheck,lint,unit,check-frontend,docs-links` (no E2E; boundary proof 173-10) | ✅ | ⬜ pending |
| 173-10-01 | 10 | 10 | ENT-01 | T-173-41 | the root never signs a user out; zero entities is a view; the root's guard still holds | unit | `yarn workspace @openvaa/frontend vitest run page.server.test page.tracking layout.tracking && yarn workspace @openvaa/frontend typecheck` | ✅ | ⬜ pending |
| 173-10-02 | 10 | 10 | ENT-01 | T-173-39, T-173-40, T-173-43 | H shows no notice and lists only the caller's entities | component + unit | `yarn workspace @openvaa/frontend vitest run entitySelection userEntityDisplayName page.svelte.test && yarn workspace @openvaa/frontend check` | ❌ W0 (three test files) | ⬜ pending |
| 173-10-03 | 10 | 10 | ENT-01 | T-173-42 | a retired code has no producer | unit + guard | `yarn workspace @openvaa/frontend typecheck && yarn workspace @openvaa/frontend vitest run translations && yarn assert:i18n-catalog-namespaces && node scripts/assert-no-candidate-app-names.mjs --self-test` + zero-hit search | ✅ | ⬜ pending |
| 173-10-04 | 10 | 10 | ENT-01, ENT-02 | — | N/A | component + gate + E2E | `yarn workspace @openvaa/frontend vitest run ContestantNav && node …/173-verdict.mjs greps && … gates 173-10-screens && … e2e 173-10-screens --min-total-of 173-01-baseline` (also the boundary proof of 173-09) | ✅ | ⬜ pending |
| 173-11-01 | 11 | 11 | ENT-01 | T-173-44 | the three rows are unconfirmed and invisible to voters | unit | `yarn workspace @openvaa/dev-seed test:unit && yarn typecheck:tests` | ✅ | ⬜ pending |
| 173-11-02 | 11 | 11 | ENT-01, GEN-02 | T-173-45 | a name pin is changed to the exact name, never loosened | unit + visual | `yarn workspace @openvaa/dev-seed test:unit && yarn typecheck:tests` + `node -e` check of `BASE_APP_SETTINGS` + the visual run directory | ✅ | ⬜ pending |
| 173-11-03 | 11 | 11 | ENT-01, GEN-02 | — | N/A | gate + E2E | `node …/173-verdict.mjs gates 173-11-base && … e2e 173-11-base --same-projects-as 173-01-baseline` | ✅ | ⬜ pending |
| 173-12-01 | 12 | 12 | ENT-03 | T-173-46 | a candidate with an editor is refused by name; grants stay inside the suite's project | type + lint | `yarn typecheck:tests && node_modules/.bin/eslint <harness files>` | ✅ | ⬜ pending |
| 173-12-02 | 12 | 12 | ENT-01, ENT-03 | T-173-47 | the scan wiring guard still passes; the zero-entity setup revokes its grant | guard + lint | `yarn assert:a11y-scan-wiring && yarn typecheck:tests && node_modules/.bin/eslint tests/tests/setup/contestant tests/playwright.config.ts` | ❌ W0 (setup, teardown) | ⬜ pending |
| 173-12-03 | 12 | 12 | ENT-01, ENT-02 | T-173-47, T-173-48 | the spec signs out no stored session and writes to no voter-visible row | lint + list | `yarn typecheck:tests && node_modules/.bin/eslint <spec and fixtures> && yarn playwright test -c ./tests/playwright.config.ts --list --project contestant-entity-selection` | ❌ W0 (spec, two page fixtures) · ✅ `navMenu.fixture.ts` (extended) | ⬜ pending |
| 173-12-04 | 12 | 12 | ENT-01, ENT-02, ENT-03 | T-173-49 | both new projects are in the run with every test passed, and no other project's count moved | gate + E2E | `node …/173-verdict.mjs gates 173-12-spec && … e2e 173-12-spec --same-projects-as 173-11-base --except data-setup-entity-selection=+ --except data-teardown-entity-selection=+ --except contestant-entity-selection=+ --expect-project data-setup-entity-selection --expect-project contestant-entity-selection` | ✅ | ⬜ pending |
| 173-13-01 | 13 | 13 | ENT-01 | T-173-50, T-173-52 | each scan proves its reach by its own marker; nothing is excluded; exactly six scans are added | E2E (axe) | `yarn assert:a11y-scan-wiring && yarn typecheck:tests && node …/173-verdict.mjs e2e 173-13-axe-slice --allow-slice --expect-project contestant-a11y-scan --same-projects-as 173-12-spec --except contestant-a11y-scan=6` | ✅ `contestant-a11y.spec.ts` (new entries) | ⬜ pending |
| 173-13-02 | 13 | 13 | ENT-01, ENT-02, ENT-03, GEN-02 | — | N/A | docs + guard | `yarn workspace @openvaa/docs validate:links --check && bash .claude/scripts/audit-skill-links.sh components && node scripts/assert-no-candidate-app-names.mjs && yarn assert:comment-hygiene` | ✅ | ⬜ pending |
| 173-13-03 | 13 | 13 | ENT-03 | — | N/A | doc check | `grep` of the pending todos and the name map's obligations rows | ✅ | ⬜ pending |
| 173-13-04 | 13 | 13 | ENT-01, ENT-02, ENT-03, GEN-02 | T-173-51, T-173-53 | every closing run describes one tree; the scan project is exactly six above its previous total and no other project moved | gate + integration + E2E | `node …/173-verdict.mjs gates 173-13-final && … greps && … exemptions && … e2e 173-13-final --same-projects-as 173-12-spec --except contestant-a11y-scan=6 --expect-project contestant-entity-selection --expect-project contestant-a11y-scan --expect-project contestant-journey` + `node -e` over the integration report (passed ≥ 7) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Requirement → Evidence Map

| Requirement | Behaviour | Where it is proven |
|-------------|-----------|--------------------|
| ENT-03 | Several editor grants per user; no raise; the index kept | pgTAP `36-entity-identity` (173-02-02); catalogue check (173-02-01); the entry gate's unit cases (173-05-02); the multi-grant user signing in (173-12) |
| GEN-02 | Reader and writer serve an organization, and only the entity's own editor | pgTAP organization arm (173-02-02); the nine write-refusal cells in pgTAP (173-02-03); writer unit cases (173-03-01); store cases (173-03-02); the integration test against the local database: one save and six refused writes (173-03-05, re-run in 173-13-04) |
| ENT-01 | H for several, never for one, a view for none | root load cases (173-10-01); page and helper cases (173-10-02); the spec's choosing, one-entity and nothing-to-edit groups (173-12-03); axe (173-13-01) |
| ENT-02 | Switch without signing out; never the previous entity's data | store cases (173-04-02); load and guard cases for all four loads (173-07-02, 173-07-03, 173-08-02, 173-08-03, 173-08-04); menu cases (173-10-04); the spec's draft, save and switch groups (173-12-03) |
| E2E-03 | Full suite green at close | the ten full runs of the schedule above; the closing gate (173-13-04) |

---

## Wave 0 Requirements

Test files and drivers that do not exist before the phase. Each is created by the plan and task named, ahead
of the first task whose verify command runs it.

- [ ] `.planning/phases/173-multi-entity-grants-entity-selection/173-NAME-MAP.md` — 173-01 Task 1
- [ ] `173-gates.sh`, `173-e2e.sh`, `173-verdict.mjs` — 173-01 Task 2
- [ ] `apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.test.ts` — 173-02 Task 1
- [ ] `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts` — 173-03 Task 5
- [ ] `apps/frontend/src/params/{servedEntityType,uuid,contestantEntityPage}.test.ts` — 173-05 Task 1
- [ ] `tests/tests/utils/buildRoute.test.ts`, `tests/tests/utils/contestantEntityUrl.test.ts` — 173-06 Task 1
- [ ] `signOutToLogin.test.ts` and the user-level `layout.tracking.test.ts` — 173-07 Task 2
- [ ] the entity-level `layout.server.test.ts` and `layout.tracking.test.ts` — 173-07 Task 3
- [ ] `contestantHomeRoute.test.ts` — 173-07 Task 4
- [ ] the root's `page.server.test.ts` and `page.tracking.test.ts` — 173-08 Task 2
- [ ] the resolver's `page.server.test.ts` and `page.tracking.test.ts` — 173-08 Task 3
- [ ] `ContestantNav.svelte.test.ts` — 173-08 Task 4
- [ ] `EntityCard.svelte.test.ts`, `ContactSupport.svelte.test.ts`, `NothingToEdit.svelte.test.ts` — 173-09 Tasks 1 and 3
- [ ] `page.svelte.test.ts`, `entitySelection.helpers.test.ts`, `userEntityDisplayName.test.ts` — 173-10 Task 2
- [ ] `entity-selection.setup.ts`, `entity-selection.teardown.ts`, two page fixtures, `contestant-entity-selection.spec.ts` — 173-12 Tasks 2 and 3

No framework is installed, no package is added and no pgTAP file is added: the write-refusal cases of
173-02 Task 3 extend three existing files.

---

## Manual-Only Verifications

Automated verification exists for every task. The items below are the UI-SPEC's backstop considerations and
one language review; each is carried in a plan's `must_haves` as `{ statement, verification: backstop }` and
abstains to human review when no explicit evidence is found.

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A long display name wraps inside an H card at 320px without horizontal scroll or clipping | ENT-01 | a visual property of real content at one viewport | sign in as the multi-grant user at a 320px-wide viewport; give one entity a long name; inspect the card |
| A long entity name wraps within the menu drawer and is not truncated at 320px | ENT-02 | as above | on an entity page at 320px, open the menu; inspect the group title |
| The H title, the switch item and the "nothing to edit" paragraphs render without clipping in every locale at 320px | ENT-01 | seven locales by one viewport, judged by eye | switch the language through each of `da, en, et, fi, fr, lb, sv` on H, on an entity page's menu and on the view |
| Button labels of Contact support and Log Out wrap inside full-width buttons; neither is under 44px tall | ENT-01 | as above | on the "nothing to edit" view in each locale at 320px, measure both buttons |
| Keyboard focus on an H card is visibly indicated in light and dark | ENT-01 | focus visibility is not an axe rule the scan gates | tab to a card on H in each theme |
| The six constructed translations of the eight new strings read naturally | ENT-01 | grammaticality cannot be asserted | a native speaker reads the strings; filed as a todo by 173-13 Task 3 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency per task under about 120 s; long runs backgrounded and polled
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
