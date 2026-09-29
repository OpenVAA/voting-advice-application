---
phase: 161-project-scoping-project-id-parameterisation
kind: phase-evidence-aggregate
generated: 2026-09-05
sources:
  - .planning/ROADMAP.md (Phase 161 section)
  - 161-01-SUMMARY.md .. 161-08-SUMMARY.md, 161-02.1-SUMMARY.md
  - 161-01-DECISION.md, 161-02-DECISION.md
  - COVERAGE.md, deferred-items.md
verdicts: {c1: MET, c2: MET, c3: MET, c4: MET}
---

# Phase 161 — Evidence Aggregate

## 1. Header

| Field | Value |
| --- | --- |
| Phase id | 161 |
| Name | Project Scoping — `PROJECT_ID` Parameterisation |
| Requirement | PRESHIP-01 |
| Depends on | Phase 156 (schema settles first) |
| Plans | 8 planned (161-01 .. 161-08) + 161-02.1, an operator-approved follow-up with no PLAN.md — 9 SUMMARYs |
| Branch | `integration/ship-12-squash` |
| Commit range | `4dc765f04734871b49d7b10277eed777f192df56` .. `fe8e3d9c6d3db071d2e896a66cf3146410bd1823` |
| Commit count | **49** commits whose subject matches `(161-` |
| First subject | `docs(161-01): record the operator's one-way variable-name and E2E-id decisions` |
| Last subject | `docs(161-08): update state and roadmap for the completed plan` |
| Execution window | 2026-09-04 to 2026-09-05 |

**Goal (verbatim from ROADMAP):**

> Every query names the project it is for, and an E2E run creates its own project instead of requiring the whole local database to be reset.

Range derivation (re-runnable): `git log --format='%H %s' integration/ship-12-squash | grep '(161-'` — 49 lines; first/last as above. Note the range is contiguous in the log but is **not** a clean `A..B` diff boundary: commits from other phases are not interleaved inside it at HEAD, but the range was derived by subject match, not by ancestry, and should be treated as a set rather than a span.

---

## 2. Criterion-by-criterion evidence

### Criterion 1 — a project-id environment variable exists, defaults to the default project id, is documented in `.env.example`, and the hardcoded `DEFAULT_SEED_PROJECT_ID` no longer supplies a silent fallback

**Verdict: MET** (with one operator-recorded name deviation, and one roadmap anchor that was already stale before the phase started — both documented below rather than silently absorbed).

| Evidence | Kind | Source |
| --- | --- | --- |
| `.env.example` carries a live `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001` under a `#### Project scoping` block, placed after the cross-runtime pair block so `assert-env-pair-registry`'s contiguity check stays green | grep-checkable; **re-verified in this aggregate** (`.env.example:59`) | 161-01-SUMMARY.md D1 |
| `E2E_PROJECT_ID=00000000-0000-0000-0000-0000000000e2` present but **commented out**, deliberately — `packages/dev-seed/src/cli/seed.ts` auto-loads the repo-root `.env` and a live line would silently re-point `yarn db:seed:default` | grep-checkable; **re-verified** (`.env.example:70`, commented) | 161-01-DECISION.md Answer 2 |
| `resolveProjectIdEnv()` in `apps/frontend/vite.projectIdEnv.ts`, 5 unit cases in `vite.projectIdEnv.test.ts` | unit, proven pass | 161-01-SUMMARY.md D1 |
| Single-resolution-site fail-fast in `supabaseAdapterMixin`'s **constructor** (`resolveProjectId`, `#projectId`, `get projectId()`): throws on empty and on a non-canonical uuid, naming the variable, the file and the default uuid; no code-level fallback anywhere. 11 unit cases in `supabaseAdapter.test.ts#supabaseAdapterMixin project scoping` | unit, proven pass | 161-01-SUMMARY.md D3 |
| The constant is **gone**: `git grep DEFAULT_SEED_PROJECT_ID -- apps packages scripts tests` returns nothing; 161-03 ran that grep with a plant-and-restore positive control so the zero is a measurement | grep + positive control; **re-verified in this aggregate: 0 hits** | 161-03-SUMMARY.md D1 |
| `identity-callback/index.ts` resolves `requireEnv('PUBLIC_PROJECT_ID', Deno.env.get('PUBLIC_PROJECT_ID')?.trim())` — optional chaining, not a coalescing default, so Phase 155's `assert-edge-env-defaults` predicate stays live (17 files, 3/3 checks, 0 violations) | guard exit 0; **re-verified** (`index.ts:180`) | 161-03-SUMMARY.md D1 |
| A caller-supplied body `project_id` is now validated against configuration: **live invocation probes** A/B/C/C2 against `http://127.0.0.1:54321/functions/v1/identity-callback` returned 401/400/401/401. Probe B (`{"error":"Invalid project_id"}`) is reachable only **after** `requireEnv` has already succeeded, so it proves delivery and the new branch simultaneously | integration, **proven by live invocation**, doubles as its own positive control | 161-03-SUMMARY.md D2 |
| Phase-155 fail-loud posture preserved: an unset variable produces `500 {"error":"Internal server error"}` with a container log `ERR_ENV_UNCONFIGURED` naming the variable and a response body naming nothing — **observed**, not asserted | integration, observed | 161-03-SUMMARY.md D3 |
| `config.toml:401` carries `PUBLIC_PROJECT_ID = "env(PUBLIC_PROJECT_ID)"`; the four-cell mechanism/source matrix (entry present/absent x process-env value present/absent) was measured with `SUPABASE_URL` as positive control and an unwired variable as negative control, reading 0 -> 2 -> 0 -> 1 across configurations | integration, **both-directions matrix** | 161-03-SUMMARY.md D4 |
| Three live configuration documents repaired by the rename (`tests/IDURA-TEST-RUNBOOK.md` 5 sites, `.claude/skills/database/SKILL.md`), with a migration notice for deployments provisioned under the old name | grep-checkable | 161-03-SUMMARY.md dev 1 |

**Deviation, accepted on the record — not a miss.** The roadmap names the literal `PROJECT_ID`; the delivered name is `PUBLIC_PROJECT_ID`. The reason is measured, not stylistic: SvelteKit's `kit.env.publicPrefix` defaults to `PUBLIC_`, `apps/frontend/svelte.config.js` declares no `kit.env` block, and setting the prefix to `''` would publish `IDENTITY_PROVIDER_CLIENT_SECRET`, `IDENTITY_PROVIDER_DECRYPTION_JWKS` and `IDURA_SIGNING_JWKS` to the browser. Operator answer `one-name`, recorded in `161-01-DECISION.md` **before any source file was modified**, with the recording instrument proven in both directions (`git diff --name-only | grep -Ev '^\.planning/' | wc -l` returned 0; a planted newline made it return 1 and name the file; checkout returned it to 0).

**Weakness a verifier should know about.** The roadmap's stated starting point — `const DEFAULT_SEED_PROJECT_ID = '00000000-…-0001'` at `identity-callback/index.ts:31` supplying a silent fallback — was **already false** when the phase ran. Phase 155 had replaced the live expression with `project_id || requireEnv('DEFAULT_PROJECT_ID', …)`; the constant survived only as dead code (filed at `.planning/todos/pending/2026-08-29-identity-callback-unreferenced-seed-project-constant.md`, explicitly handed to Phase 161). So the "no longer supplies a silent fallback" half of the criterion was partly discharged by Phase 155 and only completed here. What 161-03 actually delivered on top of 155 is the **rename to one canonical name** and the **body-`project_id` validation** (T-161-01), which is more than the criterion asks.

**Unproven (assertion-level only).** 161-01 deliverable D2 — the end-to-end runtime hop through `$env/dynamic/public` into a served application, plus the feedback-form insert landing with the configured `project_id` — was batched to end-of-phase UAT and **never run as its own manual check**. The static chain is proven link by link; the specific manual script in 161-01's "Outstanding verification" was not executed. It is indirectly discharged by the three green full-suite E2E runs (161-07, 161-08), which drive a served application configured by that chain, but not by the check as written.

---

### Criterion 2 — every project-scoped query is parameterised, and a missing parameter is caught by a guard rather than by a reviewer

**Verdict: MET** for the criterion's stated scope (the frontend Supabase adapter plus the two granted `anon` read RPCs). Two scope caveats are recorded below and neither is a gap the phase's own criterion names.

**The guard.**

| Evidence | Kind | Source |
| --- | --- | --- |
| `scripts/assert-project-scoped-queries.mjs` — five fail-closed checks, an inverted design (forbid the raw call shape rather than assert a filter), committed fixtures and a `--self-test` | artefact on disk; **re-verified** (23,302 bytes) | 161-01-SUMMARY.md D5 |
| It is link 17 of `yarn lint:check`, appended without disturbing the pre-existing 16. The chain value was read at execution time and the difference computed, not eyeballed: `LOST: []`, `ADDED: ["yarn assert:project-scoped-queries"]` | **re-verified in this aggregate**: `package.json` `lint:check` ends `… && yarn assert:project-scoped-queries` | 161-01-SUMMARY.md |
| `GUARDED_SOURCES` names all five adapter sources; `DEFERRED_SOURCES` is `[]` | **re-verified**: `assert-project-scoped-queries.mjs` `GUARDED_SOURCES` = 5 entries, `const DEFERRED_SOURCES = [];` | 161-04-SUMMARY.md D5 |
| Guard summary line at close: `5 guarded source(s), 0 deferred, 5 adapter source(s) on disk, 5 raw client call(s) examined, 0 violation(s)` — and the five-file enumeration was reproduced **independently of the guard** and matched | measured | 161-04-SUMMARY.md |
| **Red/green flips, three of them, each against a real adapter source:** injected `this.supabase.from('feedback')` -> exit 1 naming `supabaseFeedbackWriter.ts:23`; `this.supabase.from('elections')` -> exit 1 naming `supabaseDataProvider.ts:225`; `this.supabase.from('admin_jobs')` -> exit 1 naming `supabaseAdminWriter.ts:76`. Each restored to exit 0, one proven byte-identical by `diff`. On the third the **examined count moved 5 -> 6 -> 5**, so the guard changed what it looked at, not merely its verdict | **proven red/green** | 161-01, 161-02, 161-04 SUMMARYs |
| Two independent gate assertions in `packages/dev-seed/tests/projectScopingGate.test.ts` (7 cases) hold the coverage closed; **each was flipped red independently** (restore a `conversion pending` entry -> 1 failed; delete a `GUARDED_SOURCES` entry -> 1 failed) | unit, **proven red/green** | 161-04-SUMMARY.md D5 |
| The self-test exists precisely because the real corpus is clean by construction: `--self-test` runs checks 1/3/4 over two committed fixtures with **exact** access counts (3 and 1), which is the positive control proving the storage-bucket exclusion drops exactly one access per fixture | **positive control** | 161-01-SUMMARY.md |

**The conversions.**

| Site | Delivered | Proof | Source |
| --- | --- | --- | --- |
| `supabaseFeedbackWriter.ts` | `app_settings` derivation deleted; one Supabase call, not two; insert via `scopedFrom` | 5 unit cases; comment-filtered `grep -c app_settings` -> 0 | 161-01 D4 |
| `supabaseDataProvider.ts` | 6 table sites via `scopedFrom`, 1 rpc gains `p_project_id`, `app_settings` `limit(1)` singleton deleted (row selected by the `UNIQUE(project_id)` filter) | 9 unit cases; comment-filtered greps `this.supabase.from(` 0, `scopedFrom(` 6, `limit(1)` 0 | 161-02 D3/D4 |
| `supabaseDataProvider._getQuestionData` | `p_project_id` on every call of the fan-out | 2 new unit cases (unfiltered call + all four calls of a 2x2 fan-out) | 161-02.1 |
| `supabaseDataWriter.ts` | `nominations` + both `candidates` accesses via `scopedFrom`; both Storage paths built from `this.projectId`; `#resolveProjectId` deleted | 8 unit cases; `this.supabase.from(` 0, `select('project_id')` 0, `scopedFrom(` 3 | 161-04 D1/D2/D3 |
| `supabaseAdminWriter.ts` | `admin_jobs` insert via `scopedFrom`; `elections` derivation deleted | unit case asserting the recorded insert payload's `project_id`, the single table reached, and every other column surviving | 161-04 D2 |
| `get_candidate_user_data` | stays identity-scoped, but its returned `project_id` is cross-checked against configuration; a mismatch throws with a message naming neither uuid | 3 unit cases, one of which asserts the message names neither project | 161-04 D4 |

**The two granted `anon` RPCs — the layer a source guard cannot reach.**

| Evidence | Kind | Source |
| --- | --- | --- |
| `migrations/00005_get_nominations_project_scope.sql` — drops `(uuid,uuid,boolean,integer)`, re-creates with a **required, no-DEFAULT** `p_project_id` first, re-`GRANT`s to `anon, authenticated`. **Re-verified: the file exists.** `psql` reports exactly one overload; `routine_privileges` shows both roles | measured against the live DB | 161-02 D1/D6 |
| **Convergence proven, not assumed:** `md5(regprocedure || pg_get_functiondef)` after a fresh `yarn db:reset` = `38b902fb1854ab9d556279f6ce94177b`, equal to the hash from rebuilding the four-argument pre-state and applying `00005` alone — with the pre-state verified to really be the old function first, so the equality is not a tautology | **proven, byte-identical** | 161-02 D6 |
| `migrations/00006_get_questions_project_scope.sql` — same treatment for `get_questions`. **Re-verified: the file exists.** Baseline `md5(pg_get_functiondef)` `fac236ef4756d0fa98ecc41bd4f85e8b`; after stripping both project conjuncts from the **live** definition and restoring by re-running the migration, the hash is **unchanged** | **proven, byte-identical restore** | 161-02.1 |
| `07-rpc-security.test.sql` §8 (7 assertions) and §9 (7 assertions). Both sections **publish the second tenant first**, so a cross-tenant zero is a measurement and not an RLS artefact, and both projects are asserted to return rows **before** either is asserted not to return the other's | integration | 161-02 D2, 161-02.1 |
| **Red halves, both recorded.** §8: stripping the project conjunct from the live definition fails exactly tests 12/13/14/15 while controls 10, 11 and the `throws_ok` 16 stay green; restore -> 386/386. §9: stripping both conjuncts fails exactly 19/20/21/22 while controls 17, 18 and arity-check 23 stay green; restore -> `Files=12, Tests=393, Result: PASS` | **proven red/green with surviving positive controls** | 161-02, 161-02.1 |
| A forgotten parameter is `undefined_function` (42883), not a wider result set — asserted by `throws_ok` in both sections | integration | 161-02 D1, 161-02.1 |
| Generated types carry `p_project_id: string`, required, no `?`; `TURBO_FORCE=true yarn typecheck` exit 0. The expected red between the migration and the call-site fix was recorded (`Property 'p_project_id' is missing … but required`) as evidence the regeneration reached the call site | typecheck + recorded red | 161-02 D6 |
| `PROJECT_SCOPED_RPCS` carries **no `UNSCOPED` entry**; the `UNSCOPED:` vocabulary is deliberately retained in the guard's docblock for a future honest disposition | **re-verified**: 2 occurrences of the token, both in documentation of the vocabulary | 161-02.1 |

**Scope caveats a verifier should hold onto.**

1. **The guard's blast radius is five files.** It checks `apps/frontend/src/lib/api/adapters/supabase/**` only. Project-scoped queries issued from Edge Functions, `packages/dev-seed`, `apps/frontend/src/hooks.server.ts` (see the open todo `2026-08-28-hooks-supabase-handle-parameterisation.md`) and the Playwright harness are outside it. The criterion names "the adapter" as its baseline, so this is a scope boundary rather than an unmet clause — but "every query that is project-scoped is parameterised" is a broader sentence than what the guard enforces.
2. **The roadmap's "31 `project_id` references" baseline was never reconciled by any summary.** No plan reports converting 31 of anything. Measured in this aggregate over the five adapter sources (non-test): 13 `project_id` occurrences, 11 `scopedFrom(` call sites, 2 `p_project_id` sites, and **0** bare `this.supabase.from(`. The operative invariant (zero bare raw-client table access, guard-enforced) holds and is proven; the number 31 is simply unaccounted for and should not be cited.

---

### Criterion 3 — E2E creates its own project under a dedicated test project id, and `yarn test:e2e` no longer requires `yarn db:reset`, proven by two consecutive green runs with no intervening reset

**Verdict: MET.** This is the phase's strongest-evidenced criterion: three full-suite runs, machine-derived verdicts, a between-runs database measurement, and a recorded operator attestation.

**The mechanism (161-05).**

| Evidence | Kind | Source |
| --- | --- | --- |
| `E2E_PROJECT_ID = 00000000-0000-0000-0000-0000000000e2` and `resolveE2eProjectId()` on `packages/dev-seed/src/supabaseAdminClient.ts`, exported from the barrel; refuses a default-project collision and a non-canonical uuid | 6 unit cases | 161-05 D1 |
| `ensureProject(projectId?)` — idempotent `public.projects` + `public.app_settings` bootstrap as two ordered conflict-ignoring upserts, no `accounts` row, **no delete path**. `git grep "DELETE FROM public.projects"` returns nothing (re-run in 161-08 over `packages/`, exit 1) | 4 live integration cases against local Supabase | 161-05 D2 |
| The `tests/` `SupabaseAdminClient` subclass defaults to the E2E project while the dev-seed base keeps the default project; `setupFromTemplate` threads the id into `runPipeline` and the `Writer` | 4 cases, two of them source-reading (because `vitest.workspace.ts` enumerates `packages/**` only and `tests/` has no vitest project) | 161-05 D3 |
| `globalSetup` calls `ensureProject()` **immediately after** `assertServedApp`; no `globalTeardown` was added | ordering awk exit 0; `grep -c globalTeardown` 0 | 161-05 D4 |
| `tests/scripts/e2e-run.sh --no-db-reset` — skips the reset but **still starts Supabase** (the guarded block was also the start), and puts `PUBLIC_PROJECT_ID` on the dev-server spawn | `bash -n` 0; `--help` lists the flag; `--bogus` still exits 2 | 161-05 D5 |
| **RED phase was real:** 11 failed / 4 passed, with the four live-tier failures reading `TypeError: client.ensureProject is not a function` — not a skip and not a collection error | recorded red | 161-05 |
| Post-run database read: default project holds **328** candidates untouched; E2E project holds the run's content and is torn down to 0 **with its project row surviving** | measured | 161-05 D3 |

**The proof (161-07).**

| Measurement | run 1 | run 2 |
| --- | --- | --- |
| Directory | `tests/e2e-runs/161-twice-run1` | `tests/e2e-runs/161-twice-run2` |
| total / passed / failed / didNotRun / flaky / skipped | 155 / 155 / 0 / 0 / 0 / 0 | 155 / 155 / 0 / 0 / 0 / 0 |
| `exit` file | 0 | 0 |
| preflight ok / fail | 1 / 0 | 1 / 0 |
| git HEAD | `70fa58261…` | `70fa58261…` (same) |
| `db_reset` | false, no `db-reset.log` | false, no `db-reset.log` |
| Playwright projects | 95 | 95 (identical per-project totals) |

- Both directories exist on disk (**re-verified in this aggregate**), gitignored (`.gitignore:50`), deliberately not force-added, and must not be deleted.
- The **full-suite claim is evidence, not prose**: the echoed Playwright argument line is captured into each directory as `command` and quoted in `provenance.txt` — no `--project`, no filter but `--grep-invert @probe`.
- **The between-runs state was measured**, not assumed: all ten `ALLOWED_TEARDOWN_TABLES` counted per project before / between / after. Default project identical in all three readings (328 candidates, 377 nominations, …); E2E project at 0 in all three with its project row present. The between-column was recorded at `15:55:59Z`, after run one ended (`15:55:46Z`) and before run two started (`15:56:47Z`) — a **61-second window with no run directory created inside it**, so there are no discarded attempts to hide.
- **The verdict is derived, not restated.** `tests/scripts/e2e-evidence.mjs` (**re-verified present**) computes `summary.json` / `provenance.txt` from a run directory's own `results.json`, and was **validated in both directions before being trusted**: it reproduces `147-reach14-suite`'s committed counts string-identically (150/150/0/0/0/0), and reports `failed 1 / didNotRun 2` on `140-f9-after` and `failed 1 / didNotRun 1` on `146-05-guardfail-404`. The plan's own task-1 verify, fed a known-red directory, **exits 1**.
- **A did-not-run test is discriminated from a declarative skip** on `results.length`, and the ambiguous case is classified `didNotRun` — the project's cardinal rule encoded in the instrument.
- The plan's task-1 and task-2 node verifies were run verbatim against the final artifacts: exit 0 and exit 0.
- **Operator attestation, recorded verbatim** and obtained through an explicit disambiguation (the operator's first reply, the bare word "pass", was refused as ambiguous and was **not** treated as the answer): *"Approved. The two runs stand: no flake was waived, no did-not-run test was counted as a pass, and no reset, seed or unit-test run occurred between the two runs."*
- The orchestrator independently re-derived the numbers from the artifacts rather than echoing the executor.

**The mechanism explanation (161-08) — why the reset is unnecessary.**

| Evidence | Kind | Source |
| --- | --- | --- |
| `packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts` (**re-verified present**) writes 5 candidates into the **default** project and issues one read three ways: scoped-to-E2E -> **0**, unfiltered -> **5**, scoped-to-default -> **5**. The zero therefore cannot be an empty table or a write that never happened | integration, three-way | 161-08 D1 |
| **The negative control was proven to be a control by watching it fail.** Commit `dd4b0b841` is the file with the control deliberately mis-scoped: `expected [] to have a length of 5 but got +0`. `811f40d0c` unscopes it and takes it green. The failing state is committed, so the proof is bisectable rather than narrated | **proven red/green, committed red** | 161-08 |
| Cleanup asserts itself (deletion count exactly 5, re-read to 0); the file passes run twice back to back leaving 0 rows at its prefix | measured | 161-08 |
| Run three: `tests/e2e-runs/161-contamination-run3` (**re-verified present**) — 155/155, failed 0, didNotRun 0, flaky 0, skipped 0, exit 0, preflight 1/0, `db_reset=false`, no `db-reset.log`, full-suite command | e2e | 161-08 D2 |
| **The contamination was real and fresh.** `yarn test:unit` (exit 0, 25/25 turbo tasks) left **751 `seed_` rows across 9 tables** in the default project; the newest `seed_` candidate's `created_at` moved from `06:36:15.102658Z` to `06:38:35.394949Z` **inside that step's own window**, so the rows were written by the very command the historical incident names | measured, freshness-controlled | 161-08 D3 |
| Re-measured after run three: identical 751-row counts, `created_at` unmoved. The suite neither read nor wrote them. E2E project back to 0 in all ten tables, project row intact | measured | 161-08 |
| Phase 144 lost a full suite to this exact residue (8 failed / 79 did not run / 48 passed) and recovered only by re-inserting a `db:reset`. That reset is now demonstrably unnecessary — not because the residue is gone, but because the suite reads a project the residue is not in | comparison to the filed incident | 161-08 |
| A second, independent instrument agrees: the freshness probe's 25 warnings name only concurrently-seeding `e2e-perm-*` siblings; `grep -c "seed_" stdout.log` over the whole run returns **0** | corroboration from a different direction | 161-08 |

**Strengthening, not weakening:** run one was taken `--no-db-reset` as well, against the operator's standing directive that the pre-existing seeded database must not be reset. DR-19 itself records that this proves the claim *more* strongly; the only cost it names is failure-ambiguity, and all three runs were green, so no ambiguity arose. Reset-independence is therefore proven starting from a **populated** default project, not a clean slate.

---

### Criterion 4 — `CLAUDE.md` and `tests/README.md` E2E prerequisite documentation updated, and a grep for the retired "reset the DB first" instruction returns nothing

**Verdict: MET** — with the important caveat that the criterion's own literal grep is **vacuous**, and the plan replaced it with something that is not.

| Evidence | Kind | Source |
| --- | --- | --- |
| `CLAUDE.md` "Running tests after changes" no longer resets. **Re-verified in this aggregate**: the block states the two prerequisites `yarn dev` supplies and adds the paragraph on why a reset is not among them | grep-checkable; subsection-scoped awk returns 0 (returned 1 at `HEAD~1`) | 161-06 D1 |
| `CLAUDE.md` Development Environment documents `PUBLIC_PROJECT_ID`, its default, the deliberate absence of a fallback, and that the local edge runtime resolves it from the **process** environment | `grep -c 'PUBLIC_PROJECT_ID' CLAUDE.md` -> 1 | 161-06 D2 |
| `tests/README.md` gains *The project the suite owns*: the fixed committed id, the create-after-preflight ordering and its reason, the deliberate non-deletion of the project row at teardown, and `--no-db-reset` | `grep -c 'no-db-reset'` -> 1 | 161-06 D2 |
| `tests/IDURA-TEST-RUNBOOK.md` carries **zero** `db:reset` occurrences, and gained the `PUBLIC_PROJECT_ID` export the local edge runtime needs | `grep -c 'db:reset'` -> 0 | 161-06 D1/D5 |
| **The retirement is enforced by a gate, not by an edit.** `packages/dev-seed/tests/e2eDocPreconditionGate.test.ts` (**re-verified present**) runs on every `yarn test:unit` and fails on two independent grounds: precondition *framing* within a three-line window of the reset command, and any mention outside an eight-entry allowlist | unit, 4 cases | 161-06 D3 |
| **The gate was flipped in both directions before being trusted.** Against the real pre-edit tree (`git checkout HEAD~1 --` on the three documents): 4 of 4 cases red, naming all four retired sites by file and 1-based line. Against a freshly injected `Run \`yarn db:reset\` before \`yarn test:e2e\`…` line: red again, both halves firing independently. Restored: 4 passed | **proven red/green, twice** | 161-06 |
| The framing patterns **discriminate**: they fire on all four retired sites at `HEAD~1` and on **none** of the eight permitted survivors at `HEAD`. The allowlist is asserted exact in both directions — no occurrence outside it, and no entry matching zero occurrences, so a deleted line cannot leave a standing permission behind | measured both ways | 161-06 |
| The archived record and the non-precondition command maps are untouched: `git diff --name-only HEAD~1 -- .planning/milestones` empty; same for `apps/supabase/README.md` and `packages/dev-seed/README.md` | measured | 161-06 D4 |
| The comment-hygiene guard genuinely saw the new file: 1655 files untracked (identical to before it existed) vs **1656** staged, 0 violations | non-vacuity control | 161-06 |

**The caveat, stated plainly.** The criterion says "a grep for the retired 'reset the DB first' instruction returns nothing". That literal string **appears nowhere in the repository and never did** — re-verified in this aggregate: `grep -rn 'reset the DB first' CLAUDE.md tests/` returns nothing, and would have returned nothing before the phase started too. Taken literally the criterion is satisfiable by doing nothing. 161-06 recognised this and deliberately built the gate to match the reset *command as a token* and judge its three-line context instead. **The gate, not the grep, is what discharges criterion 4** — and unlike the grep, the gate has been observed to fail.

---

## 3. Cross-plan discrepancy register

Every row is a place where a plan, a decision record, the roadmap or a prior summary said something the tree later contradicted. In each case the measurement was taken as authoritative.

| # | Claim | Correction (measured) | Source |
| --- | --- | --- | --- |
| 1 | ROADMAP criterion 1 names the literal env var `PROJECT_ID` | Delivered `PUBLIC_PROJECT_ID`; the unprefixed form is unreadable in the browser under SvelteKit's default `publicPrefix`, and `''` would publish three secrets. Operator answer `one-name`, accepted as satisfying criterion 1 | 161-01-DECISION.md |
| 2 | ROADMAP criterion 1 anchors a silent fallback at `identity-callback/index.ts:31` (`DEFAULT_SEED_PROJECT_ID`) | At HEAD the live expression was `project_id \|\| requireEnv('DEFAULT_PROJECT_ID', …)` — Phase 155 had already removed the fallback; the constant was dead code, filed as a todo. The roadmap's starting point was stale | 161-03-SUMMARY.md |
| 3 | ROADMAP criterion 2: "the adapter carries **31** `project_id` references today as the baseline to convert" | No plan reconciles the number. Measured in this aggregate over the five adapter sources (non-test): 13 `project_id`, 11 `scopedFrom(`, 2 `p_project_id`, 0 bare `this.supabase.from(` | this aggregate |
| 4 | ROADMAP criterion 4: grep for the retired "reset the DB first" instruction | That literal string appears nowhere in the repository and never did; a literal grep passes vacuously. The gate matches the command token and judges its context instead | 161-06-SUMMARY.md |
| 5 | 161-01 plan: the project id resolves in `supabaseAdapterMixin.init()` | No `init()` exists on the mixin, on `UniversalAdapter`, or anywhere in the adapter tree. Resolution and both throws went into the **constructor** | 161-01 dev 1 |
| 6 | 161-01 plan: `scopedFrom(t)` is `this.supabase.from(t).eq('project_id', …)` | `PostgrestQueryBuilder` has no `.eq()` — it exposes only `select/insert/upsert/update/delete`. Delivered as a four-operation **facade**; the plan's chain is both a type error and a runtime error | 161-01 dev 2 |
| 7 | 161-01 plan: `lint:check` carries 6 links | Measured **16** at execution time; 17 after the append. The chain was read, not assumed | 161-01 |
| 8 | 161-01 plan seeds `PROJECT_SCOPED_RPCS` with `merge_custom_data` | No such function. The adapter calls `merge_question_custom_data`. The plan's list also omitted `get_questions`, a real call site. The map was seeded from measured call sites instead | 161-01 dev 6; 161-02-DECISION.md Correction A |
| 9 | 161-02 DR-6: `get_nominations` takes three arguments, anchored at `503-entity-rpcs.sql:1-95` | Four at HEAD (`p_election_round` added by Phase 157's `00004`), so the delivered signature is **five**, and the grant is `(uuid,uuid,uuid,boolean,integer)`. The line anchor was stale for the same reason | 161-02-DECISION.md Constraint 1 |
| 10 | 161-02 plan: the new migration is `00004_get_nominations_project_scope.sql` | `00004` is taken by Phase 157's migration. Delivered as **`00005`** | 161-02 dev 2 |
| 11 | 161-02 DR-9: "Phase 157's `get_questions` RPC does not exist yet — verified this session" | It exists in three places, and its body carries **no `project_id` term at all** — so it returned every project's questions. Worse, the shipped guard dispositioned it `scoped-by-identity: election id + RLS`, false on both halves. Corrected to `UNSCOPED`, filed, then actually fixed by 161-02.1 | 161-02-DECISION.md Correction B; 161-02.1 |
| 12 | 161-02 acceptance criterion: "at least 8 `scopedFrom(` in the data provider" | Unsatisfiable as written — Phase 157 had already replaced two of the named sites with the `get_questions` RPC. Delivered **6** table sites + 1 rpc. Reported as 6 rather than bent | 161-02 dev 5 |
| 13 | The filed `get_questions` todo, step 5: the pgTAP call sites are "all named-argument or no-argument today, so none is positionally sensitive" | **False.** All **30** call sites in `11-question-rpcs.test.sql` are positional. Trusting the recipe would have silently re-read `test_id('election_a')` as a project id and reddened every membership assertion at once | 161-02.1 |
| 14 | 161-03: `07-rpc-security` test 14 is a DB-state-dependent failure belonging to another plan; filed to `deferred-items.md`, not fixed | 161-02.1 Task B **fixed it** by scoping the right-hand side to the fixture's two projects — not by resetting the database and not by weakening the equality. Probed both directions: the old form still fails (`have 4, want 381`) and the new form still fails on a real regression (`have 762, want 4`) | 161-03; 161-02.1 Task B |
| 15 | 161-04 plan objective: "**six** project-id derivation round-trips across the two writers" | **Four** call sites through three code blocks. All four deleted; the count in the objective was the thing that was wrong | 161-04 |
| 16 | 161-04 task-1 acceptance: "the comment-filtered grep for `storage` returns exactly 2" | Measured **6 before and 6 after** — the file shape the criterion assumes was collapsed into one `#uploadCandidateFile` helper by WR-06. The invariant that actually holds was checked instead (`this.supabase.storage` 1, `public-assets` 1, and the conversion commit deletes no `public-assets` line). The code was not bent to reach 2 | 161-04 |
| 17 | 161-04 task-3 acceptance: "0 violations across **four** guarded adapter sources", then lists five files | **Five**, which is also what the guard's own directory enumeration yields. The prose count is stale; the file list is right | 161-04 |
| 18 | 161-04 task-3: the action text asks the docblock to quote `conversion pending`; its own acceptance criterion requires `grep -c "conversion pending"` to return 0 | The two cannot both hold. The criterion won; the docblock states the rule without quoting the phrase, and the resulting vacuity hazard was closed by making the assertion prove its instrument first | 161-04 dev 5 |
| 19 | 161-05 DR-4: twelve of thirteen `project_id` FKs carry `ON DELETE CASCADE`; `app_settings` does not (cited at `106-app-settings.sql:8`, `00001:916`) | **13 of 13 carry it** in both trees, at `:7` and `:934`. Branch A applied and the cascade todo was **deliberately not filed** — filing a register entry for something already fixed is the stale-register class this milestone exists to close | 161-05 |
| 20 | 161-05 task-3 verify regex `REFERENCES public\.projects\(id\)` | Cannot match the tree's sqlfluff formatting `public.projects (id)`. Run verbatim it would have pressured the executor into filing a todo for a gap that does not exist. Instrument corrected and proven non-vacuous both ways | 161-05 |
| 21 | 161-05 task-3: `grep -c "E2E_REQUIRE_FRESH_DB" … returns 1` | Raw count is **3**, and was 3 at `HEAD~2` as well. The comment-filtered count is 1, before and after. The code was not bent to reach 1 | 161-05 |
| 22 | 161-05 / 161-07 acceptance instruments read `summary.json`, `provenance.txt` and a `preflight-fail:` key from the run directory | `e2e-run.sh` writes **none** of them; the phase-147-era tooling that did no longer exists. 161-05 worked around it by reading the raw files; 161-07 added `tests/scripts/e2e-evidence.mjs` to derive them, validated against one known-green and two known-red historical runs | 161-05; 161-07 dev 2 |
| 23 | 161-05 plan and `161-PATTERNS.md` §13: `tests/global-setup.ts` is 53 lines; `e2e-run.sh` anchors at `:110-153`, `:274-280`, `:353` | 31 lines; the ranges no longer locate the described code. Both files read in full and edited by content anchor. The described **shapes** were accurate | 161-05 |
| 24 | 161-06 task-1 acceptance: `awk '/### Running tests after changes/,/^## /' CLAUDE.md \| grep -c 'db:reset'` returns 0 | Unsatisfiable — `^## ` matches only an h2, four subsections later, necessarily capturing `CLAUDE.md:310`, a command-map entry DR-16 explicitly protects. Returned **2** at `HEAD~1` and **1** after a correct edit. The subsection-scoped form returns 1 -> 0 | 161-06 dev 1 |
| 25 | 161-07 DR-18: "the last full gate run on record was **150** tests" | **155** tests across 95 Playwright projects, in 10.7 and 10.5 minutes. The wall-clock estimate held; the count was five short because the suite grew after Phase 147. `counts.total` was compared run-to-run, which is what the criterion actually requires | 161-07 |
| 26 | 161-07 DR-19: run one is taken **with** the reset | Overridden by an explicit operator directive that the database must not be reset. DR-19 itself records that this proves the claim more strongly; both runs green, so the ambiguity cost never materialised | 161-07 dev 1 |
| 27 | 161-05: "**zero** probe warnings across both no-reset runs", carried forward as the evidence prerequisite for promoting the freshness probe to a hard failure | **25 warnings per run**, deterministically, at full-suite scope — measured identically in 161-07's two runs and 161-08's third. 161-05's reading was true only of two 18-test `--project a11y-smoke` smoke runs, where no sibling family seeds concurrently. **161-07 supersedes the claim** and 161-08 was forbidden from using it | 161-07; 161-08 |
| 28 | 161-05: "vitest does not load the repo-root `.env`" (the stated reason its live tier gates on reachability) | True of vitest, misleading in effect: `packages/dev-seed/src/cli/teardown.ts` calls `process.loadEnvFile(<root>/.env)` at **module scope** and is re-exported from the package barrel, so any import of `@openvaa/dev-seed` populates `SUPABASE_URL` inside the worker. This is why Turborepo's strict env mode cannot suppress the residue, and why `yarn test:unit` really does contaminate | 161-08 |
| 29 | 161-03 Self-Check lists three commits, including `9666b00b8`; this aggregate first recorded that hash as unresolvable | **WITHDRAWN on re-verification.** `git cat-file -t 9666b00b8` returns `commit`, and `git reflog` carries it at `HEAD@{37}` with the subject `docs(161-03): complete the Deno-side project-id convergence plan` — identical to its on-branch twin `e55361e85`, from which it differs by one file. The commit was amended after the self-check ran, changing its hash; it was never absent. The self-check did run its command. Frontmatter `commits: 2` vs three listed remains a real, minor count discrepancy | this aggregate; 161-03 |
| 30 | 161-05 Self-Check lists six commits, including `4b962ca1e`; this aggregate first recorded that hash as unresolvable | **WITHDRAWN on re-verification.** `git cat-file -t 4b962ca1e` returns `commit`, and `git reflog` carries it at `HEAD@{15}` with the subject `docs(161-05): record the E2E project-ownership plan` — identical to its on-branch twin `b1c181839`, from which it differs by one file. Same amend-after-self-check mechanism as row 29, not a defect. Frontmatter `commits: 5` vs six listed remains a real, minor count discrepancy | this aggregate; 161-05 |
| 31 | 161-01 filed sibling todo: "six empty constants" would be fixed by widening `vite`'s `envDir` | Measured: thirteen `PUBLIC_*` keys are read by `constants.ts`; ten are assigned only in the root template and would be empty in a plain `yarn dev`; two more are assigned in neither file. The todo was corrected and tells the next reader to re-measure | 161-01 |

---

## 4. Open and deferred items

### 4a. From `deferred-items.md`

| Item | Status | Blocks closure? |
| --- | --- | --- |
| `07-rpc-security` test 14 is DB-state-dependent (`have: 4`, `want: 381`) — filed by 161-03, attributed arithmetically to 161-02's assertion, deliberately not fixed there and the operator's seeded database deliberately not reset | **CLOSED by 161-02.1 Task B** (right-hand side scoped to the fixture's two projects; probed in both directions; `supabase test db` exit 0, `Files=12, Tests=393, PASS`). 161-02.1 said the entry "can be struck when that file is next touched" — **it was never struck**, so `deferred-items.md` still reads as an open item at HEAD | **No.** The defect is fixed; only the register entry is stale. Striking it is a one-line doc edit |

### 4b. Filed todos originating in this phase (all still in `.planning/todos/pending/`)

| Todo | Origin | Blocks closure? |
| --- | --- | --- |
| `2026-08-28-ci-frontend-does-not-read-root-env.md` | 161-01 D6 — the root-env surface this phase deliberately did not widen | No |
| `2026-08-28-vite-envdir-root-would-fix-six-empty-constants.md` | 161-01 D6 (figure corrected in the todo itself) | No |
| `2026-08-28-edge-runtime-secrets-local-wiring.md` | 161-03 D5 — a bare `yarn db:start` does not deliver `PUBLIC_PROJECT_ID` from the repo-root `.env`; `supabase start` runs with cwd `apps/supabase` and the CLI does not walk up. Whether to fix it via `db:start`, a `functions/.env`, wiring all seven variables, or a CLI upgrade is an **operator decision with deployment implications**, deliberately not taken | No — the documented workaround (export in the shell that starts the stack) is verified and now documented in `CLAUDE.md` and the Idura runbook |
| `2026-08-28-promote-e2e-freshness-probe-to-hard-failure.md` | 161-05 — and its evidence prerequisite ("zero warnings across both runs") is now **known to be UNMET and false at full-suite scope** (25 per run, structural cross-family concurrency under six workers). 161-08 adds that the probe is structurally incapable of seeing the residue at all, so promotion is measurably the wrong fix; what is actually needed is a notion of ownership tolerating concurrent siblings, or one project per family | No — the probe is warn-by-default and affected no run's verdict. **But the todo must not be actioned as written**: promoting it today would fail the full suite deterministically, 25 times, with no defect behind it |

### 4c. Closed by this phase

| Todo | Disposition |
| --- | --- |
| `2026-09-04-get-questions-returns-every-projects-questions.md` | **Completed** by 161-02.1 (present in `.planning/todos/completed/`, absent from `pending/`) |

### 4d. Pre-existing todos this phase appears to satisfy but did not close

| Todo | Observation | Blocks closure? |
| --- | --- | --- |
| `2026-08-29-identity-callback-unreferenced-seed-project-constant.md` — filed by Phase 155 Plan 06, its own frontmatter says *"Phase 161 owns the constant, so this phase left it"* | 161-03 **deleted** `DEFAULT_SEED_PROJECT_ID` (re-verified: `git grep` returns nothing). The todo is still in `pending/` | No — but it is a stale-register entry of exactly the class this milestone exists to close, and should be moved to `completed/` |
| `frontend-project-id-scoping.md` (Phase 58 UAT, priority high) — *"the frontend's Supabase data provider currently queries all content tables without a `project_id` filter … the project id should be resolved once from env and applied as a `.eq('project_id', …)` filter on every query"* | This is a near-verbatim description of what 161-01/02/04 delivered. Still in `pending/` | No — but it should be dispositioned, or it will be re-planned |
| `2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md` | 161-08 re-characterises it: no longer suite-threatening, and its option 2 (promote the probe) is measurably wrong since the probe never sees the residue. What remains is a tidiness issue about a test that does not clean up after itself | No — but the todo's recommended fix is now known to be wrong and the todo should be amended |

### 4e. Open by design, recorded across summaries

| Item | Where flagged | Blocks closure? |
| --- | --- | --- |
| **The two `E2E_PROJECT_ID` resolvers are not unified** — `resolveE2eProjectId()` in TypeScript and `read_env_var E2E_PROJECT_ID` in `e2e-run.sh`, each carrying its own copy of the committed default. Observed to **agree on three runs** (`env-posture.txt` vs a live mid-run database read), which retires the immediate risk; a future divergence would still be silent | 161-05, 161-07, 161-08 | No |
| **The freshness probe's 25 structural warnings** have no notion of ownership tolerating concurrent siblings inside one shared project | 161-07, 161-08 | No — warn-by-default |
| **Two stale `CLAUDE.md` factual claims** (claim 2: `@openvaa/app-shared` described as building ESM *and* CJS; claim 3: the local-adapter line and the `apps/frontend/data/` line), left open because neither sits in a block 161-06 rewrote and fixing them would have been scope expansion | 161-06; `2026-08-28-claude-md-stale-factual-claims.md` | No |
| **`.planning/WINDOWS.md` refuses `gsd-tools windows append`** — its rendered table disagrees with its own fenced JSON. Pre-existing, verified untouched. **Four plans (161-02, 161-02.1, 161-03, 161-06) recorded their broken-windows entries in their SUMMARYs instead**, so the ledger is incomplete for this phase by construction | 161-02, 161-02.1, 161-03, 161-06 | No — but a reader consulting `WINDOWS.md` alone will not see this phase's entries |
| **`packages/supabase-types/RPC-NULLABILITY.md`'s hand-written disposition tables cite stale `503-entity-rpcs.sql` line numbers** (already stale before this phase; only the machine-generated DERIVED region tracks). No guard checks those citations | 161-02 | No |
| **`get_candidate_user_data` remains identity-scoped** — it takes no project parameter; the returned `project_id` is cross-checked against configuration instead. That is a deliberate design, not a gap, but it is a different mechanism from the two read RPCs | 161-04 D4 | No |

### 4f. Deliverables marked `human_judgment: true` and never independently run as written

| Deliverable | What was not run | Blocks closure? |
| --- | --- | --- |
| 161-01 **D2** — the runtime hop: load the voter home page, submit feedback, confirm the inserted `public.feedback` row carries the configured `project_id`; then restart with no shell prefix and confirm the page still renders | The manual script was batched to end-of-phase UAT and **never executed as written**. Indirectly discharged by three green full-suite runs against a served application configured through that chain | No |
| 161-02 **D7** — the running voter app reads only its own project through the converted provider | Same batching; discharged in substance by 161-07's runs, not by the check as written | No |
| 161-04 **D6** — the converted writers against a real PostgREST endpoint and a real Storage bucket (an authenticated candidate session, an image landing under the configured project prefix) | Same batching. The E2E suite exercises candidate flows, but **no summary attests to a bucket-path observation under the configured project prefix** | No, but see §5 |
| 161-06 **D5** — whether the exported `PUBLIC_PROJECT_ID` makes the real Idura flow work end to end | Only observable by walking the opt-in manual runbook against a live broker; not run | No |

**Count of open items that block phase closure: 0.**

---

## 5. What a verifier still has to check independently

These are claims this aggregate could **not** settle from documents plus read-only grep. Each needs code inspection or a test run.

1. **The three E2E run directories are gitignored and therefore uncommitted.** `tests/e2e-runs/161-twice-run1`, `-run2` and `161-contamination-run3` exist on disk in this worktree (confirmed), but they are **not in any commit** — the entire criterion-3 proof lives outside version control and would vanish with the worktree. Anyone verifying from a fresh clone has no artefacts at all. Re-deriving them costs three full-suite runs (~33 minutes).
2. **That the numbers in `summary.json` really come from `results.json`.** `tests/scripts/e2e-evidence.mjs` is committed and was validated against three historical runs, but this aggregate did not re-run it. Re-derive: `node tests/scripts/e2e-evidence.mjs tests/e2e-runs/161-twice-run1` and compare, then confirm `results.json` `stats` reads `expected 155 / unexpected 0 / flaky 0 / skipped 0`.
3. **That the pgTAP suite is green at HEAD.** Every SQL proof in this phase (386 -> 393 assertions, both red halves, both byte-identical restores) was measured against a live local database during execution. `supabase test db` was not run here. This is the single largest block of evidence resting on execution-time measurement that a document cannot re-check.
4. **That the guard is still green and still non-vacuous at HEAD.** `node scripts/assert-project-scoped-queries.mjs` should print `5 guarded source(s), 0 deferred, 5 adapter source(s) on disk, 5 raw client call(s) examined, 0 violation(s)` and exit 0; `--self-test` should exit 0. A run reporting **0 raw client calls examined** would be the empty-instrument failure the guard's own fixtures exist to rule out.
5. **That the four committed gate tests actually run.** `projectScopingGate.test.ts` (7), `e2eDocPreconditionGate.test.ts` (4), `ensureProject.test.ts` (15) and `projectScopedContaminationIsolation.test.ts` (6) are present on disk. Three of them have **live tiers gated on local-Supabase reachability**, and a machine without the stack up will report them green having asserted nothing about the database. Check that the live tiers *ran*, not merely that the files passed.
6. **Deliverable 161-04 D6 — the writers against live Storage.** No summary records an observation of a candidate image landing under the configured project prefix in the `public-assets` bucket. The unit assertions prove the path string is built from `this.projectId`; nothing proves the upload lands there.
7. **Criterion 2 beyond the adapter.** The guard checks five frontend files. Whether project-scoped queries issued from Edge Functions, `packages/dev-seed`, `hooks.server.ts` or the Playwright harness are parameterised is neither proven nor guarded, and the open todo `2026-08-28-hooks-supabase-handle-parameterisation.md` suggests at least one such surface remains.
8. **The roadmap's "31 `project_id` references" baseline.** Nothing in the phase reconciles it. If that number came from a specific measurement, the delta is unaccounted for; a verifier who cares about "every query" rather than "the adapter's queries" should re-derive the population before trusting the criterion as written.
9. ~~**The two non-resolving commit hashes.**~~ **SETTLED 2026-09-05 — no action needed.** Both hashes resolve (`git cat-file -t` returns `commit` for each) and both appear in `git reflog` with subjects identical to their on-branch twins (`9666b00b8`/`e55361e85`, `4b962ca1e`/`b1c181839`), differing by one file apiece. They are unreachable from any ref because the doc commits were amended after each self-check ran — an ordinary rewrite on a squash-integration branch. The self-checks did run their own command, and no re-confirmation of other cited hashes is warranted on this evidence.
10. **A fourth full-suite run is in flight.** `tests/e2e-runs/161-tail-regression` exists on disk and is named by no summary in this phase. Its verdict is not part of this aggregate.
