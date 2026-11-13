---
phase: "177"
slug: "define-nominations"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-10"
---

# Phase 177 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Seeded by plan-phase from
> `177-RESEARCH.md` § Validation Architecture; the planner fills the per-task map and sets
> `nyquist_compliant` when every task has a verify command with a stated failing direction.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frameworks** | vitest 5.0.2 (packages and frontend, unit and component); pgTAP 1.3.3 through `supabase test db`; Playwright 1.63.0 through the wrapper |
| **Config** | each workspace's `vitest.config.*`; `tests/playwright.config.ts`; `apps/supabase/supabase/tests/database/` |
| **Quick run command** | `yarn workspace @openvaa/data test:unit` · `yarn workspace @openvaa/frontend vitest run <file>` · `yarn workspace @openvaa/dev-seed test:unit` |
| **Full suite command** | `yarn test:unit` · `yarn db:reset && yarn workspace @openvaa/supabase test:db` · `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` |
| **Phase gate** | the rows of `176-gates.sh`, carried into this phase's own driver; then one full E2E run; then the new spec three times in isolation — every status read directly, never through a pipe |

---

## Sampling Rate

- **After every task commit:** the quick run of the workspace touched; for a schema task `yarn db:reset`, the changed pgTAP file, `yarn db:lint:sql`
- **After every plan wave:** `yarn test:unit`, the whole pgTAP suite on a reset database, `yarn workspace @openvaa/frontend check`
- **After every surface plan:** one full wrapper E2E run
- **Before `/gsd-verify-work`:** the gate rows, one full run and the new spec three times in isolation, all green
- **Max feedback latency:** a workspace's quick run; a full E2E run is the slowest sample and closes a surface plan, not a task

---

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOM-03 | the matrix: nominable, parent types, required — every cell | unit | `yarn workspace @openvaa/data test:unit` | ❌ Wave 0 (beside `election.test.ts`) |
| NOM-03 | the adapter maps the shape; `subtype` still from its own column | unit | `yarn workspace @openvaa/frontend vitest run supabaseDataProvider` | ✅ extended |
| NOM-03 | which step is shown, with and without `startFromConstituencyGroup`; the skip; `disallowSelection` not read | unit | `yarn workspace @openvaa/frontend vitest run <ordering module>` | ❌ Wave 0 |
| NOM-03 | the voter's two loads behave as before | unit + E2E | the existing voter specs, `perm-startfromcg` included, unchanged | ✅ |
| NOM-03 | the guard reads `params` and `parent` alone | unit | a `layout.tracking.test.ts` beside it | ❌ Wave 0 |
| NOM-03 | the three rows of D-16's table; the contestant side of `startFromConstituencyGroup` | E2E | `contestant-nominations.spec.ts`; `perm-startfromcg.spec.ts` (`@nomination-definition`) | ❌ / ✅ extended |
| NOM-04 | the shape grid: every cell × entity user, admin, service role, each refusal by code and message | pgTAP | `08-triggers.test.sql` | ✅ extended |
| NOM-04 | the deferred rule: lone row refused, three statements pass, the key satisfies, forced and restored | pgTAP | `08-triggers.test.sql` | ✅ extended |
| NOM-04 | the symbol: own row yes, placeholder no, locked no, the edit unconfirms | pgTAP | `23-nominations-write.test.sql` | ✅ extended |
| NOM-04 | the widened parent policy: each guard and each pairing with its negative control; the cap over alliance rows | pgTAP | `23-nominations-write.test.sql`, `25-matrix-conformance.test.sql`, `12-user-can.test.sql` | ✅ extended |
| NOM-04 | the selector: a named radio group, one tab stop, arrows, required, "Other" does not move focus | component | `EntitySelector` test | ❌ Wave 0 |
| NOM-04 | the parent options: allow-list keys, who is listed, NULL for every other caller; the census at ten | pgTAP | a new file; `07-rpc-security.test.sql` | ❌ Wave 0 / ✅ |
| NOM-05 | "Other": the key written, no parent, other keys kept, the key removed on a listed choice | pgTAP + integration | the write function's file; `supabaseDataWriter.integration.test.ts` | ❌ Wave 0 / ✅ extended |
| NOM-06 | one transaction: a refusal stores nothing; unchanged rows keep `confirmed` and `updated_at`; a zero-row statement raises | pgTAP | the write function's file | ❌ Wave 0 |
| NOM-06 | the delete policy: own row, unlocked, not a placeholder; the foreign-key refusal by name | pgTAP | `23-nominations-write.test.sql` | ✅ extended |
| NOM-06 | the named refusals as the client sees them (`code`, message start) | integration | `yarn workspace @openvaa/frontend vitest run supabaseDataWriter.integration` (the gate's row) | ✅ extended |
| NOM-06 | the task's target; J's six states; Edit; the note under either lock | unit + component + E2E | `taskState.test.ts`, J's `page.svelte.test.ts`, the new spec | ✅ extended / ❌ |
| NOM-08 | an answer outside the applicable set changes nothing (D-14) | unit | `taskState.test.ts` | ✅ extended |
| NOM-08 | after a save, with no full load: home, J, the counts and every Continue follow | component + E2E | the details page's component test; the new spec | ❌ Wave 0 |
| F6 | `current` keeps its identity under the lock with nothing to clear | unit | `contestantUserDataState.svelte.test.ts` | ✅ extended |
| RQ-1 | every built-in template seeds on the new rule | pipeline + E2E | the census as a dev-seed test; every setup project of the full run | ❌ Wave 0 |

---

## Per-Task Verification Map

*Filled by the planner from the plans' tasks, 2026-10-10, for plans 177-01 to 177-21: fifty-six tasks.
Every task below has an `<automated>` verify with a stated failing direction (`<fails_when>`), so
`nyquist_compliant` is `true`; the command column names the decisive stage of that chain, which is read
whole from the plan. `P` is the phase directory. "W0" in the last-but-one column means the task itself
creates the test file first, red. A "full, uncommitted tree" run is judged by the plan's own comparison
of the run's summary with its predecessor's, since the `control` sub-command judges a one-project run.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 177-01-T1 | 01 | 1 | NOM-04, NOM-06 | T-177-01, T-177-02 | a verdict is never read from a stale, partial or void run; the baseline is of this tree and a full run | script | the driver checks, then `node $P/177-verdict.mjs hygiene` and `scope` | ❌ W0 (the drivers) | ⬜ pending |
| 177-01-T2 | 01 | 1 | NOM-04, NOM-06 | T-177-03 | an operator's reply is read by a fixed rule; a tick off the recommended option halts | script | `node $P/177-read-rulings.mjs <doc> <letters>` | ❌ W0 | ⬜ pending |
| 177-01-T3 | 01 | 1 | NOM-04 | T-177-05 | no probe object is left in the database | SQL lint + catalogue | `yarn db:lint:sql` (three runs), then the `psql` catalogue counts | ✅ | ⬜ pending |
| 177-02-T1 | 02 | 2 | NOM-04 | T-177-07 | the applied schema equals the schema files | pgTAP + gates | `node $P/177-verdict.mjs gates 177-02-db --rows db-reset,types-regen,types-clean,pgtap,sql-lint` | ✅ extended (`15-visibility-flags`) | ⬜ pending |
| 177-02-T2 | 02 | 2 | NOM-04 | T-177-06 | no built-in dataset seeds a row the rule refuses | unit | `yarn workspace @openvaa/dev-seed test:unit` | ❌ W0 (`nominationShapeCensus.builtins.test.ts`) | ⬜ pending |
| 177-02-T3 | 02 | 2 | NOM-04 | T-177-06 | — | gates + E2E | `node $P/177-verdict.mjs e2e 177-02-close --same-projects-as <baseline>` | ✅ | ⬜ pending |
| 177-03-T1 | 03 | 3 | NOM-04 | T-177-09 to T-177-12 | the rule binds every role; the deferred rule is forced and restored | pgTAP (red first) | the red run `177-unit/177-03-pgtap-red.*` | ✅ extended (`08-triggers`) | ⬜ pending |
| 177-03-T2 | 03 | 3 | NOM-04 | T-177-09 to T-177-11 | a nomination the election's type forbids is refused for every writer | pgTAP + SQL lint | `node $P/177-verdict.mjs gates 177-03-db --rows db-reset,types-regen,types-clean,pgtap,sql-lint` | ✅ | ⬜ pending |
| 177-03-T3 | 03 | 3 | NOM-04 | T-177-09 | every dataset still imports | gates + E2E | `node $P/177-verdict.mjs e2e 177-03-close --same-projects-as 177-02-close` | ✅ | ⬜ pending |
| 177-04-T1 | 04 | 4 | NOM-04, NOM-06 | T-177-14 to T-177-18 | each guard has a negative control | pgTAP (red first) | the red run `177-unit/177-04-pgtap-red.*` | ✅ extended (`23-nominations-write`) | ⬜ pending |
| 177-04-T2 | 04 | 4 | NOM-04, NOM-06 | T-177-14 to T-177-18 | the symbol on the caller's own row only; delete of the caller's own row only, unlocked | pgTAP + SQL lint | `node $P/177-verdict.mjs gates 177-04-db --rows db-reset,types-regen,types-clean,pgtap,sql-lint` | ✅ | ⬜ pending |
| 177-05-T1 | 05 | 5 | NOM-04 | T-177-19, T-177-20, T-177-21 | the two crossed pairings are refused; the cap counts both parent types | pgTAP (red first) | the red run `177-unit/177-05-pgtap-red.*` | ✅ extended (files 12, 23, 25) | ⬜ pending |
| 177-05-T2 | 05 | 5 | NOM-04 | T-177-19 to T-177-24 | the widened parent policy keeps every guard | pgTAP + SQL lint | `node $P/177-verdict.mjs gates 177-05-db --rows db-reset,types-regen,types-clean,pgtap,sql-lint` | ✅ | ⬜ pending |
| 177-06-T1 | 06 | 6 | NOM-04 | T-177-25 to T-177-29 | an allow-listed projection; NULL for every other caller; the census | pgTAP (red first) | the red run `177-unit/177-06-pgtap-red.*` | ❌ W0 (`44-nomination-parent-options`) / ✅ extended (07, 42) | ⬜ pending |
| 177-06-T2 | 06 | 6 | NOM-04 | T-177-25 to T-177-28 | basic data alone, of the caller's own project alone | pgTAP + SQL lint + typecheck | `node $P/177-verdict.mjs gates 177-06-db --rows db-reset,types-regen,types-clean,pgtap,sql-lint,typecheck` | ✅ | ⬜ pending |
| 177-07-T1 | 07 | 7 | NOM-04, NOM-05, NOM-06, NOM-08 | T-177-30 to T-177-35 | one transaction; a zero-row statement raises; the mode is restored | pgTAP (red first) | the red run `177-unit/177-07-pgtap-red.*` | ❌ W0 (`43-set-entity-nominations`) | ⬜ pending |
| 177-07-T2 | 07 | 7 | NOM-04, NOM-05, NOM-06, NOM-08 | T-177-30 to T-177-35 | an INVOKER function that adds no authority | pgTAP + SQL lint + typecheck | `node $P/177-verdict.mjs gates 177-07-db --rows db-reset,types-regen,types-clean,pgtap,sql-lint,typecheck` | ✅ | ⬜ pending |
| 177-07-T3 | 07 | 7 | NOM-04, NOM-06 | T-177-30 | — | gates + E2E | `node $P/177-verdict.mjs e2e 177-07-close --same-projects-as 177-03-close` | ✅ | ⬜ pending |
| 177-08-T1 | 08 | 8 | NOM-03, NOM-04 | T-177-37 | the matrix in TypeScript, every cell | unit | `yarn workspace @openvaa/data test:unit` | ❌ W0 (`nominationShape.test.ts`) | ⬜ pending |
| 177-08-T2 | 08 | 8 | NOM-03, NOM-04 | T-177-37, T-177-38 | the data package's shapes equal the generated enum | unit + gates | `node $P/177-verdict.mjs gates 177-08-close --rows typecheck,lint,unit,build,format` | ✅ extended (`supabaseDataProvider.test.ts`) | ⬜ pending |
| 177-09-T1 | 09 | 9 | NOM-04, NOM-05, NOM-06 | T-177-40, T-177-41 | answers narrowed by a schema; NULL is not an empty list | unit | `yarn workspace @openvaa/frontend vitest run src/lib/api/adapters/supabase/utils` | ❌ W0 (two parse tests) / ✅ extended | ⬜ pending |
| 177-09-T2 | 09 | 9 | NOM-04, NOM-05, NOM-06 | T-177-39, T-177-43 | a refusal's text is never returned; one call, no statement of its own | unit + gates | `yarn workspace @openvaa/frontend vitest run src/lib/api`; `yarn assert:project-scoped-queries` | ✅ extended | ⬜ pending |
| 177-09-T3 | 09 | 9 | NOM-05, NOM-06 | T-177-42 | the named refusals as the stack produces them | integration | `node $P/177-verdict.mjs gates 177-09-close --rows …,integration,…` | ✅ extended | ⬜ pending |
| 177-10-T1 | 10 | 10 | NOM-03, NOM-04, NOM-06, NOM-08 | T-177-46 | the dataset holds no refused row | unit | `yarn workspace @openvaa/dev-seed test:unit` | ❌ W0 (the template) | ⬜ pending |
| 177-10-T2 | 10 | 10 | NOM-03, NOM-04, NOM-06, NOM-08 | T-177-44, T-177-45 | state steps reach the dataset's own rows only | typecheck + gate | `yarn typecheck:tests`; `yarn assert:a11y-scan-wiring` | ❌ W0 (fixture, setup pair, spec) | ⬜ pending |
| 177-10-T3 | 10 | 10 | NOM-06, NOM-08 | T-177-47 | the spec is committed only after a green run of the uncommitted tree | E2E | `node $P/177-verdict.mjs control 177-10-precommit … --green`; `… e2e 177-10-close …` | ✅ | ⬜ pending |
| 177-11-T1 | 11 | 11 | NOM-03, NOM-04, NOM-05, NOM-06 | T-177-48 | — | typecheck | `yarn typecheck:tests` | ❌ W0 (`contestantNominationEditor.fixture.ts`) | ⬜ pending |
| 177-11-T2 | 11 | 11 | NOM-06 | T-177-49 | no existing step asserts something else | gates | `node $P/177-verdict.mjs gates 177-11-close --rows typecheck,lint,unit,format` | ✅ extended | ⬜ pending |
| 177-12-T1 | 12 | 12 | NOM-03 to NOM-06 | T-177-50 | every key in seven locales with one placeholder set | script + unit | the key-set script of the plan; `yarn assert:i18n-catalog-namespaces` | ✅ extended | ⬜ pending |
| 177-12-T2 | 12 | 12 | NOM-04, NOM-06 | T-177-50 | — | unit + component + gates | `node $P/177-verdict.mjs gates 177-12-close --rows typecheck,lint,unit,check-frontend,build,format,docs-links` | ✅ extended | ⬜ pending |
| 177-13-T1 | 13 | 13 | NOM-03 | T-177-54, T-177-55 | `disallowSelection` is honoured only on the caller's word | unit | `yarn workspace @openvaa/frontend vitest run src/lib/routes` | ❌ W0 (`selectionOrder.test.ts`, `impliedParams.test.ts`) | ⬜ pending |
| 177-13-T2 | 13 | 13 | NOM-03 | T-177-52, T-177-53 | the voter's flow is unchanged; the `(located)` load is untouched | E2E (full, uncommitted tree) | the summary comparison of `177-13-precommit` with `177-10-close` | ✅ | ⬜ pending |
| 177-13-T3 | 13 | 13 | NOM-03 | T-177-52 | — | gates + E2E | `node $P/177-verdict.mjs e2e 177-13-close --same-projects-as 177-10-close` | ✅ | ⬜ pending |
| 177-14-T1 | 14 | 14 | NOM-04 | T-177-58 | a named radio group; a name is text | component | `yarn workspace @openvaa/frontend vitest run src/lib/dynamic-components/entitySelector` | ❌ W0 (`EntitySelector.svelte.test.ts`) | ⬜ pending |
| 177-14-T2 | 14 | 14 | NOM-04, NOM-05, NOM-06 | T-177-56, T-177-57, T-177-59 | an untouched group is an error, never independence; every nomination in reach has a card | unit + gates | `node $P/177-verdict.mjs gates 177-14-close --rows typecheck,lint,unit,check-frontend,build,format,docs-links` | ❌ W0 (two tests) | ⬜ pending |
| 177-15-T1 | 15 | 15 | NOM-03 to NOM-06 | T-177-61 | — | E2E (negative control) | `node $P/177-verdict.mjs control 177-15-control … --red "define:"` | ✅ extended (the spec) | ⬜ pending |
| 177-15-T2 | 15 | 15 | NOM-03 to NOM-06 | T-177-60 to T-177-65 | the guard reads `params` and `parent` alone; ids are matched before use; one write | unit + component + E2E | `node $P/177-verdict.mjs control 177-15-precommit … --green --were-red-in 177-15-control` | ❌ W0 (`layout.tracking.test.ts`, `stepLoads.test.ts`, `layout.test.ts`) | ⬜ pending |
| 177-15-T3 | 15 | 15 | NOM-03 to NOM-06 | T-177-64 | — | gates + E2E | `node $P/177-verdict.mjs e2e 177-15-close --same-projects-as 177-13-close --except perm-contestant-nominations=1` | ✅ | ⬜ pending |
| 177-16-T1 | 16 | 16 | NOM-03 | T-177-66, T-177-67, T-177-69 | a voter's setting never chooses an entity's elections | E2E (negative control) | `node $P/177-verdict.mjs control 177-16-control … --red "contestant: a constituency with no election"` | ✅ extended (two specs) | ⬜ pending |
| 177-16-T2 | 16 | 16 | NOM-03 | T-177-68 | the voter tests of the regression spec are unchanged | component + E2E | `node $P/177-verdict.mjs control 177-16-precommit … --green --were-red-in 177-16-control` | ❌ W0 (`constituencies/page.svelte.test.ts`) | ⬜ pending |
| 177-16-T3 | 16 | 16 | NOM-03 | T-177-69 | — | gates + E2E | `node $P/177-verdict.mjs e2e 177-16-close --same-projects-as 177-15-close --except perm-contestant-nominations=6 --except perm-startfromcg=4` | ✅ | ⬜ pending |
| 177-17-T1 | 17 | 17 | NOM-04, NOM-05, NOM-06 | T-177-70, T-177-74 | — | E2E (negative control) | `node $P/177-verdict.mjs control 177-17-control … --red "edit:" --red "remove:"` | ✅ extended (the spec) | ⬜ pending |
| 177-17-T2 | 17 | 17 | NOM-04, NOM-05, NOM-06 | T-177-70 to T-177-77 | every nomination in reach has a card; nothing is written before Continue; an untouched set makes no call | unit + component + E2E | `node $P/177-verdict.mjs control 177-17-precommit … --green --were-red-in 177-17-control` | ❌ W0 (`details/page.svelte.test.ts`) / ✅ extended | ⬜ pending |
| 177-17-T3 | 17 | 17 | NOM-04, NOM-05, NOM-06 | T-177-70 | — | gates + E2E | `node $P/177-verdict.mjs e2e 177-17-close --same-projects-as 177-16-close --except perm-contestant-nominations=14` | ✅ | ⬜ pending |
| 177-18-T1 | 18 | 18 | NOM-06, NOM-08 | T-177-82, T-177-84 | — | unit (red first) + E2E (negative control) | `node $P/177-verdict.mjs control 177-18-control … --red "button:" --red "refused:" --red "leave:"` | ✅ extended | ⬜ pending |
| 177-18-T2 | 18 | 18 | NOM-06, NOM-08 | T-177-78 to T-177-84 | a refusal's text is never rendered; a refused save chooses no target; the store still clears what the lock must clear | component + unit + E2E (full, uncommitted tree) | the comparison of `177-18-precommit` with `177-17-close`, seven more in the nominations spec's project | ❌ W0 (`details/afterSave.svelte.test.ts`) / ✅ extended | ⬜ pending |
| 177-18-T3 | 18 | 18 | NOM-06, NOM-08 | T-177-82 | — | gates + E2E | `node $P/177-verdict.mjs e2e 177-18-close --same-projects-as 177-17-close --except perm-contestant-nominations=7` | ✅ | ⬜ pending |
| 177-19-T1 | 19 | 19 | NOM-06, NOM-08 | T-177-86, T-177-88, T-177-90 | — | unit + component (red first) + E2E (negative control) | `node $P/177-verdict.mjs control 177-19-control … --red "nominations-view:" --red "entry:" --red "follow:"` | ✅ extended | ⬜ pending |
| 177-19-T2 | 19 | 19 | NOM-06, NOM-08 | T-177-85 to T-177-90 | an entry to the editor is offered only where the guard would serve it; an answer outside the applicable set is neither deleted nor counted | unit + component + E2E (full, uncommitted tree) | the comparison of `177-19-precommit` with `177-18-close`, fifteen more in the nominations spec's project | ✅ extended | ⬜ pending |
| 177-19-T3 | 19 | 19 | NOM-06, NOM-08 | T-177-89 | — | gates + E2E | `node $P/177-verdict.mjs e2e 177-19-close --same-projects-as 177-18-close --except perm-contestant-nominations=15` | ✅ | ⬜ pending |
| 177-20-T1 | 20 | 20 | NOM-03, NOM-04, NOM-06 | T-177-91, T-177-92, T-177-94 | no scan passes against a loading frame; no axe gate of the spec's own | E2E (negative control, two stated outcomes) | `node $P/177-verdict.mjs control 177-20-control … --red "phone 320: the election step"`, alone or with the 390 px twin; `yarn assert:a11y-scan-wiring` | ✅ extended | ⬜ pending |
| 177-20-T2 | 20 | 20 | NOM-03, NOM-04, NOM-06 | T-177-93 | the shared selector changes by one class and no voter assertion moves | E2E (full, uncommitted tree) | the comparison of `177-20-precommit` with `177-19-close`, thirty-two more in the nominations spec's project | ✅ | ⬜ pending |
| 177-20-T3 | 20 | 20 | NOM-03, NOM-04, NOM-06 | T-177-94 | — | gates + E2E | `node $P/177-verdict.mjs e2e 177-20-close --same-projects-as 177-19-close --except perm-contestant-nominations=32 --expect-title-count "perm-contestant-nominations::axe accessibility scan=16"` | ✅ | ⬜ pending |
| 177-21-T1 | 21 | 21 | NOM-03 to NOM-08 | T-177-95, T-177-98 | — | script + gates | the content checks of the plan; `node $P/177-verdict.mjs gates 177-21-docs --rows lint,unit,check-frontend,format,docs-links` | ✅ extended (`preview/page.server.test.ts`) | ⬜ pending |
| 177-21-T2 | 21 | 21 | NOM-03 to NOM-08 | T-177-96, T-177-97 | every verdict refuses a stale, partial or void run; all closing runs of one head | gates + E2E + determinism | `node $P/177-verdict.mjs gates 177-21-final`; `… e2e 177-21-final …` against the predecessor and against the baseline; `… determinism … --runs 3` | ✅ | ⬜ pending |
| 177-21-T3 | 21 | 21 | NOM-03 to NOM-08 | — | — | script | the plan's census of `.planning/todos/` — closed, re-scoped, annotated, filed | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] **Measure first:** `yarn db:lint:sql` on a schema that holds the constraint trigger and a function with `SET CONSTRAINTS` (A2) — before the write function is written in full.
- [ ] The census of RQ-1 as a committed dev-seed test (every built-in template through `runPipeline`, zero refused rows), so a later template cannot seed a refused row unnoticed.
- [ ] `packages/data` — the matrix's unit grid.
- [ ] pgTAP — one file for `set_entity_nominations`, one for the parent options (next free ordinals 43, 44; the planner re-reads the tree).
- [ ] The shared ordering module's unit test; the guard's tracking test.
- [ ] `EntitySelector`'s component test; the details page's component test over the real layout, provider and store (A3).
- [ ] The new perm template, its setup / teardown project pair, its fixture module and `contestantNominationEditor.fixture.ts`; the spec's entry in `scripts/assert-a11y-scan-wiring.mjs`.
- [ ] `PROJECT_SCOPED_RPCS` entries for the two RPCs.
- [ ] The phase's own gate driver and verdict script (the 176 pair is the pattern).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The steps and the nominations view at 320 px in the six locales other than `en` | NOM-03, NOM-06 | U-27 (a): the E2E check is `en` only | Filed as a todo for a person's read |
| Keyboard and screen-reader read of the selector, the cards and the removed card | NOM-04 | Needs a person and assistive technology | Filed as a todo |
| Constructed translation values of the new messages | NOM-03 to NOM-06 | Needs native readers | Filed as a todo |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies — fifty-six tasks in twenty-one plans, each with an `<automated>` chain and a `<fails_when>` (counted over the plan files, 2026-10-10)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references — no plan holds a `MISSING` verify
- [x] No watch-mode flags
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
