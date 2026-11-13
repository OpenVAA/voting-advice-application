---
phase: 172-terms-of-use-per-user-and-project
verified: 2026-10-06T10:00:00Z
status: passed
score: 8/8 must-haves verified
covered_files:
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-01-PLAN.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-01-SUMMARY.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-02-PLAN.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-02-SUMMARY.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-03-PLAN.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-03-SUMMARY.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-04-PLAN.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-04-SUMMARY.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-05-PLAN.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-05-SUMMARY.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-06-PLAN.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-06-SUMMARY.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-07-PLAN.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-07-SUMMARY.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-08-PLAN.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-08-SUMMARY.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-09-PLAN.md"
  - ".planning/phases/172-terms-of-use-per-user-and-project/172-09-SUMMARY.md"
  - "apps/frontend/src/lib/contestant/gates/gates.ts"
  - "apps/frontend/src/routes/contestant/(protected)/+layout.server.ts"
  - "apps/supabase/scripts/lint-schema.mjs"
  - "apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql"
  - "apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql"
  - "tests/tests/specs/a11y/contestant-a11y.spec.ts"
covered_digest: "v3:sha256:58c500d116235f0e446fa9cd8f7e85fa6e18be1bbd301589cb3a3380366078cd"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Closing E2E run red once, green on rerun without a fix; root cause under diagnosis"
    expected: "The diagnosis of tests/e2e-runs/172/172-09-final is accepted (or the cause is fixed and a full run is green on first attempt), so that the phase's E2E-03 criterion (success criterion 5, second half) is established"
    why_human: "CLAUDE.md E2E hard rule: a failing or intermittently failing E2E test is a cardinal failure, no flaky exemptions, rerun-until-green is not a pass; the operator's separate debugging session owns the diagnosis"
operator_acceptance:
  accepted_by: "operator"
  accepted_at: "2026-10-07"
  record: ".planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md"
  items:
    - item: "Closing E2E run red once (77 passed, 9 failed, 94 did not run), 180 of 180 on the second attempt on the same commit"
      decision: "C5 (a) — the first run is void: the host was suspended for 198 s of the 454 s run (.planning/debug/172-closing-run-red-on-slow-host.md). The E2E criterion is met by the green runs on that commit."
    - item: "Suspend detection in the E2E wrapper"
      decision: "C6 (a) — a wall-clock heartbeat in tests/scripts/e2e-run.sh that ends a suspended run as void; a small task of its own, not a condition of this phase"
---

# Phase 172: Terms of Use per User and Project Verification Report

**Phase Goal:** Accepting the terms of use is something a user does once per project, recorded against the user rather than the candidate, and it no longer decides which entities voters can see.
**Verified:** 2026-10-06
**Status:** passed — the one UNCERTAIN truth (5b, the closing E2E run) is settled by operator decision C5 (a) of `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md`, 2026-10-07: the red first attempt is void (host suspended mid-run), and the criterion is met by the green runs on the same commit.
**Re-verification:** No, initial verification
**Tree verified:** HEAD `1bd366dc5`. Nothing outside `.planning/` differs between `40523cd16` and HEAD (`git diff --name-only 40523cd16 HEAD -- . ':!.planning'` printed nothing; 4 commits between them, all documentation under `.planning/`). The only untracked file is `CAND-APP-PLAN.md`.

Verification was read-only: no E2E, pgTAP, `yarn db:*` or dev server was run. Evidence is source reading, read-only catalogue `SELECT`s against the local Postgres, three single-file vitest files, and the stored run directories.

## Goal Achievement

### Observable Truths

| # | Truth (roadmap success criterion unless noted) | Status | Evidence |
|---|---|---|---|
| 1 | SC1 / REG-12: a signed-in user without acceptance is stopped at the acceptance screen by the layout, not by each page; after accepting, never asked again in that project, including after sign-out and in | VERIFIED | `apps/frontend/src/routes/contestant/(protected)/+layout.server.ts`: session check, then `getBasicUserData()`, then `firstNeededGate(user)`; a non-null gate returns `{ gate, user }` before `loadEntity()` is reached. The gate list is `lib/contestant/gates/gates.ts` (frozen, `isNeeded: user.termsOfUseAccepted == null`); the view is `TermsOfUseGate.svelte` via `GATE_VIEWS`, rendered by `+layout.svelte` in place of the page. The write is `_acceptTermsOfUse` = `scopedFrom('terms_of_use_acceptances').upsert({})`, which `scopedFrom` forces to `{ ignoreDuplicates: true }` with the project supplied; the read is `getBasicUserData` through `scopedFrom(...).select('accepted_at').maybeSingle()`. Ran `layout.server.test.ts`, `gates.test.ts`, `termsOfUseLayout.svelte.test.ts` myself: 3 files, 27 tests, exit 0. Order is asserted: gated user gives `getContestantUserData` not called, `getQuestionData` not called, `signOut` not called; ungated user gives `getBasicUserData` invocation order before `getContestantUserData`. Negative controls recorded in 172-04-SUMMARY (entity step moved above the gate: 2 of 6 cases fail; `invalidateAll` not awaited: 1 of 8 fails). Sign-out/in is exercised by the contestant journey spec (step 9, login lands on home with no acceptance prompt) and was green in `172-09-final-r2`. |
| 2 | SC2 / TOU-01: acceptance belongs to user and project; no entity carries a terms-of-use field; acceptance in one project does not count in another | VERIFIED | See TOU-01 evidence below. Schema file and the migration block are byte-identical (diffed). `git grep -n terms_of_use_accepted -- ':!.planning' ':!CAND-APP-PLAN.md'` prints nothing (exit 1). Applied database agrees (catalogue queries below). Cross-project: pgTAP file 37 Section 4, assertion "an acceptance for one project is not an acceptance for another: candidate_a has a row for project A and no row for project B", then a second insert for project B gives two rows, one per project. |
| 3 | SC3 / TOU-02: an entity whose editor has not accepted is exactly as visible as one whose editor has; no RLS policy, storage policy or RPC conditions on acceptance | VERIFIED | See TOU-02 evidence below. |
| 4 | SC4 / TOU-03: `.planning/todos/pending/` holds one todo for the Admin-app rule | VERIFIED | Exactly one: `.planning/todos/pending/2026-10-06-172-admin-confirm-requires-editor-acceptance.md`, naming TOU-F01, stating that "primary" is not a schema concept and that the grant-join reading is a proposal, and that refuse-versus-warn is undecided. No other pending todo carries the rule (grep for `TOU-F01`, `primary editor`, `cannot be confirmed` in `pending/` matches only this file). New standalone file; no existing todo covered the rule. |
| 5a | SC5 (first half): the acceptance screen is reached by the axe scan | VERIFIED | `tests/tests/specs/a11y/contestant-a11y.spec.ts`: `TERMS_PENDING_AXE_ROUTES` (`contestant-terms-gate`, marker `terms-of-use-submit`) goes through `declareScans`, which emits a light scan and a `-dark` twin, each through `assertAxeScan` with the reach proof and, for dark, `assertDarkThemeApplied`. A describe-scoped `test.use({ storageState: TERMS_PENDING_STORAGE_STATE })` swaps in the second stored session (path declared once in `testCredentials.ts`; registered by `auth.setup.ts` with `{ acceptTermsOfUse: false }`; unregistered by `base.teardown.ts`). `contestant-a11y-scan` is 16/16 in both closing runs. The standing todo `2026-08-27-147-tou-gate-modal-unscanned.md` is in `.planning/todos/done/` and absent from `pending/`; its closing note records the three corrections (in-layout view not modal, no-acceptance-row not a column, stale citations). Caveat from the todo itself: no negative control was run for the two new scans (they share `assertAxeScan` with the other 28), and the view's error state and a mobile viewport are not scanned. |
| 5b | SC5 (second half) / E2E-03: the full E2E suite is green at close | VERIFIED (operator accepted the diagnosis, 2026-10-07, C5 (a): first attempt void) | Gate set green (9 rows 0). Closing E2E: first attempt RED, second attempt 180/180 on the same commit with nothing changed in between. Root cause of the red attempt not established. By the project's hard rule this is not a pass; per instruction it is recorded as an open item and not decided here. See Closing evidence. |
| 6 | Handover to Phase 173 as 173-CONTEXT `<expected_tree>` expects | VERIFIED | `userNoCandidate`: in `+layout.server.ts` the check `if (!candidate) return await handleError('userNoCandidate')` sits unchanged inside the extracted `loadEntity()`; same sign-out, same redirect; `apps/frontend/messages/**` has no diff against the phase base; no test names `userNoCandidate` (`git grep` finds it only in locale files, `loginError.ts`, generated translation keys, one docs sentence, one script fixture) so no test pins the sign-out. Gate built on user-level data (`BasicUserData.termsOfUseAccepted`, decided above the entity read). `get_candidate_user_data` keeps its name; the applied function returns `id, project_id, name, short_name, info, color, image, sort_order, subtype, custom_data, answers, first_name, last_name` (the column is gone from both arms in `503-entity-rpcs.sql`). `updateEntityProperties` is image-only: `universalDataWriter.ts` guard `if (!opts.properties.image?.file) throw`, `EditableEntityProps` has `image` only, the writer reads back `'image'` only. Reusable second stored session exists (`registerAndStoreSession` in `auth.setup.ts`). |
| 7 | Security: the two `REACHES_NEITHER_ALLOW` entries are exactly the table's two policies, with a written reason; no other allow-list grew | VERIFIED | `git diff 03b8a0524 HEAD -- apps/supabase/scripts/lint-schema.mjs` is one hunk: the two entries `authenticated_select_terms_of_use_acceptances` and `authenticated_insert_terms_of_use_acceptances`, preceded by a written reason (identity is the only question; no permission exists in the grant model for it; rows unlock nothing; writes narrowed by the column-level grant). No other list in that file changed. The only other changed script, `scripts/assert-project-scoped-queries.mjs`, gained `terms_of_use_acceptances` in `PROJECT_SCOPED_TABLES`, which widens what is enforced and is not an exemption list. |
| 8 | Closing gate set on one head | VERIFIED | `tests/e2e-runs/172-gates/172-09-final`: head `40523cd16`, porcelain 0, nine rows each exit 0 (01-lint 45 s, 02-types-regen 31, 03-types-clean 0, 04-sql-lint 3, 05-pgtap 5, 06-unit 59, 07-svelte-check 8, 08-build 16, 09-format 17); `05-pgtap.log`: Files=38, Tests=1385, Result PASS; `04-sql-lint.log`: 0 errors, 3 warnings (gate exit 0); `03-types-clean.log`: `git diff --exit-code -- packages/supabase-types/src/database.ts: exit 0`. |

**Score:** 8/8 truths verified — 5b was UNCERTAIN and routed to the operator, who accepted the diagnosis on 2026-10-07 (C5 (a)). 0 behavior-unverified.

### TOU-01 evidence (independent)

- `apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql`, and byte-identical in `migrations/00001_initial_schema.sql` from line 4308: `user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE`, `project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE`, `accepted_at timestamptz NOT NULL DEFAULT now()`, `PRIMARY KEY (user_id, project_id)`; `ENABLE ROW LEVEL SECURITY`; two policies for `authenticated` keyed on `user_id = (SELECT auth.uid())`; `REVOKE ALL ... FROM anon, authenticated, public` before `GRANT SELECT` and `GRANT INSERT (project_id)`.
- Applied database (read-only `SELECT`s): `relrowsecurity = t`; constraints `terms_of_use_acceptances_pkey PRIMARY KEY (user_id, project_id)`, FK to `projects(id) ON DELETE CASCADE`, FK to `auth.users(id) ON DELETE CASCADE`; exactly two policies, SELECT and INSERT, both `{authenticated}`, qual and check `user_id = (SELECT auth.uid())`; table privileges: `authenticated` SELECT only, no `anon` row (plus `postgres` and `service_role` full, as Supabase grants); column privileges for `authenticated`: SELECT on all three columns, INSERT on `project_id` only; no user triggers on the table. No column in any non-system schema has a name matching `%terms%`.
- Entity side: `102-entities.sql` no longer has the column, `303-column-grants.sql` no longer lists it in the self-edit grant (pgTAP 09 now expects 10 columns), both arms of `get_candidate_user_data` lose it; the regenerated migration and `packages/supabase-types/src/database.ts` carry no `terms_of_use_accepted` (the repo-wide grep is empty).
- Product writers: the only non-test writer is the user's own session through `scopedFrom('terms_of_use_acceptances').upsert` in `supabaseDataWriter.ts`; the only other writer is `tests/tests/utils/supabaseAdminClient.ts` (E2E harness). No function, trigger or Edge Function writes the table (PROH-172-01 holds; confirmed by the applied-catalogue function query below).
- pgTAP file 37 (Sections 1 to 5) pins the catalogue shape, the self-row read and insert, the `42501` refusals for forged `user_id`, forged `accepted_at`, UPDATE and DELETE, another user and anon, the project scoping, and the user cascade (`DELETE FROM auth.users` removes that user's rows only). It passed in the closing gate (1385 tests). I did not re-run it, by instruction.

### TOU-02 evidence (independent)

- Four former sites, read in `apps/supabase/supabase/schema/` (diff against the phase base): `302-rls.sql` `anon_select_candidates` (two conjuncts removed; comment now says "three conjuncts, the same three as every other entity table"), the public disjunct of `authenticated_select_candidates` (same removal), `301-auth-functions.sql` `private.nomination_entities_confirmed` candidate arm (two conjuncts removed), `400-storage.sql` `public.storage_path_is_public` (the `CASE` that added the candidate-only guard is gone; one `EXECUTE format('SELECT e.confirmed FROM public.%I e ...')` serves all four entity tables). `503-entity-rpcs.sql` `get_nominations` kept its `COALESCE(c.id,...) IS NOT NULL` filter and lost only the comment that justified it by the acceptance clause.
- Catalogue, applied database: zero policies in any schema whose `qual` or `with_check` matches `%terms%`; zero functions in `public`, `private`, `storage`, `auth` whose definition matches `%terms%`; zero views and zero rules naming `terms_of_use`. So nothing but the table's own two policies reads or names the acceptance table. This is the same shape as the standing census in pgTAP file 37 Section 7 (policies in `public`/`storage`, functions in `public`/`private`, columns in `public`, plus a fourth assertion that each census had a non-empty population). Section 7 passed in the closing gate.
- **The accepted widening, stated plainly:** confirmed means public, registered or not. A candidate that is `confirmed`, with a confirmed nomination in a project open for voters, is readable by `anon` (row, storage object and `get_nominations` entry) whether or not anyone has ever signed in, registered or accepted the terms. `confirmed` is the only entity-side lever. Disclosed to the operator and not a gap.
- Where it is tested from the anon side: pgTAP file 37 Section 6 deletes every acceptance row, asserts the table is empty, then as `anon` asserts (1) the candidate row is readable, (2) its `public-assets` storage object is readable, (3) `get_nominations(project_a)` returns its nomination with the entity side. `16-anon-visibility`, `03-anon-read`, `20-storage-authority`, `25-matrix-conformance` and `18-entity-policies` were edited so the guards no longer strip or flip an acceptance clause (no "terms" reference remains in 05/16/18/25/20/29/03/07). E2E: the two seeded candidates the conjunct hid (`test-e2e-base-ca-aa-hidden`, `test-e2e-base-ca-aa-unregistered`) are `confirmed: false` in `packages/dev-seed/src/templates/e2e/base.ts`, so voter-journey counts hold.

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql` and migration block | table, RLS, two policies, grants | VERIFIED | identical, applied database agrees |
| `apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql` | access model, cross-project, anon side, census | VERIFIED | 7 sections; passed in closing gate |
| `apps/frontend/src/lib/contestant/gates/{gates.ts,gateViews.ts,TermsOfUseGate.svelte,gates.test.ts}` | ordered frozen gate list, view, tests | VERIFIED | wired from layout; tests pass |
| `apps/frontend/src/routes/contestant/(protected)/{+layout.server.ts,+layout.svelte,layout.server.test.ts,termsOfUseLayout.svelte.test.ts}` | gate above entity read | VERIFIED | wired; 27 tests pass |
| `scopedFrom` upsert, `acceptTermsOfUse`, `BasicUserData.termsOfUseAccepted` | write and read | VERIFIED | `upsert` fixes `ignoreDuplicates: true` inside the helper |
| `.planning/todos/pending/2026-10-06-172-admin-confirm-requires-editor-acceptance.md` | TOU-03 todo | VERIFIED | one file |
| `tests/tests/specs/a11y/contestant-a11y.spec.ts` + stored session | axe scan of the view, both themes | VERIFIED | 16/16 in both closing runs |
| Skill and docs pages (`.claude/skills/database/*`, `apps/docs/.../backend/authentication`, `.../contestant-app/registration`) | acceptance as per-user-per-project; visibility as three conditions | VERIFIED | grep shows per-user-per-project wording; no candidate-column or visibility-rule wording |

### Key Link Verification

| From | To | Via | Status |
| --- | --- | --- | --- |
| `(protected)/+layout.server.ts` | `firstNeededGate` | import from `$contestant/gates/gates`, called before `loadEntity()` | WIRED |
| `+layout.svelte` | `GATE_VIEWS` / `TermsOfUseGate` | `data.gate != null` branch | WIRED |
| `TermsOfUseGate.svelte` | `acceptTermsOfUse` then `invalidateAll` | contestant context, awaited | WIRED |
| `ContestantContextProvider.acceptTermsOfUse` | `UniversalDataWriter.acceptTermsOfUse` then `_acceptTermsOfUse` | `prepareDataWriter()` | WIRED |
| `getBasicUserData` | `terms_of_use_acceptances` | `scopedFrom(...).select('accepted_at').maybeSingle()`; a read error is logged and read as null | WIRED |
| E2E setup | stored terms-pending session | `registerAndStoreSession` with `{ acceptTermsOfUse: false }` | WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Real data | Status |
| --- | --- | --- | --- | --- |
| protected layout gate | `user.termsOfUseAccepted` | `terms_of_use_acceptances.accepted_at` read under the caller's own session and RLS | yes | FLOWING |
| `TermsOfUseGate` submit | acceptance row | upsert of `{project_id}` only; database supplies `user_id`, `accepted_at` | yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| gate decided before entity read; gate list; view | `yarn vitest run` on the three named test files in `apps/frontend` | 3 files, 27 tests passed, exit 0 | PASS |
| applied catalogue free of retired column and of acceptance conditions | read-only `SELECT`s on 127.0.0.1:54322 | all counts zero as above | PASS |
| repo free of the retired column | `git grep -n terms_of_use_accepted -- ':!.planning' ':!CAND-APP-PLAN.md'` | no output, exit 1 | PASS |

### Probe Execution

SKIPPED: no probes declared by the phase.

### Requirements Coverage

| Requirement | Source plans | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| TOU-01 | 01, 07 | acceptance per user and project, not on the candidate | SATISFIED | table + catalogue + pgTAP 37; column gone everywhere |
| TOU-02 | 06, 07 | acceptance no longer affects public visibility | SATISFIED | four sites cleaned; catalogue census zero; anon-side pgTAP |
| TOU-03 | 09 | backlog todo for Admin-app rule | SATISFIED | one pending todo |
| REG-12 | 03, 04 | asked to accept, enforced at layout level | SATISFIED | layout server load + tests; E2E journey |

No orphaned requirements: REQUIREMENTS.md maps only these four to Phase 172. The checkboxes in REQUIREMENTS.md still read `[ ]` and the traceability table says Pending; that is bookkeeping for the orchestrator, not a code gap.

### Anti-Patterns Found

None blocking. No `TBD`/`FIXME`/`XXX` in added lines under `apps`, `packages`, `tests`, `scripts`. No planning references (`.planning`, `D-NN`, plan or threat ids) in added code lines (comment-hygiene check on the diff). Disclosed and not counted: `a9575e04b` fails `lint:check` alone and is fixed by the next commit; pre-existing deferred items in `deferred-items.md` (header logout button never rendered, login "show" button submitting before hydration, stale counts in `scripts/assert-a11y-scan-wiring.mjs`, 31 pre-existing dangling skill citations). One stale item noted, minor: `.planning/todos/pending/2026-09-03-datawriter-row-erasure-absorbs-rpc-nullability.md` still lists the retired column (172-09 deferred item 6 records it).

### Closing evidence (read directly from the run directories)

**Gate set** `tests/e2e-runs/172-gates/172-09-final`: 9 rows, all exit 0, head `40523cd1633bed808eac63572919b0791b13633d`, clean tree. pgTAP 38 files, 1385 tests, PASS.

**Closing E2E attempt 1, RED:** `tests/e2e-runs/172/172-09-final`, head `40523cd16`, started 07:11:08Z, ended 07:18:42Z, `exit` 1, `wrapper-exit` 1. `summary.json` counts: total 180, passed 77, failed 9, flaky 0, skipped 0, didNotRun 94. Dev server ready in 161 409 ms (the seven earlier cold starts of the phase were 27.3 to 31.0 s). The nine failures are all voter-side: `performance` 1, `a11y-smoke` 7 (questions, questions dark, results, results dark, voter-detail-drawer, results-filter-drawer dark, navigation-a11y route announcer), `voter-journey` full journey 1 (category-intro text expected "Opinion Questions for Regional Elections Only", received "Optional Opinion Questions B"). The 94 did-not-run are the perm-* and admin setups and specs, `voter-prefs-tracking`, and `admin-access`. `contestant-a11y-scan` 16/16, `contestant-journey` 1/1, `eperm07-term-trigger` 1/1 and `voter-results-redraw` 5/5 passed in this attempt.

**Closing E2E attempt 2, GREEN:** `tests/e2e-runs/172/172-09-final-r2`, same head `40523cd16`, same clean tree (`?? CAND-APP-PLAN.md` only), started 07:26:13Z, ended 07:31:04Z, `exit` 0, `wrapper-exit` 0. Counts: total 180, passed 180, failed 0, flaky 0, skipped 0, didNotRun 0. Dev server ready in 1 088 ms (warm cache).

**Diagnosis notes** `tests/e2e-runs/172/_drivers/172-09-final.red-attempt-diagnosis.txt` (executor's, unreviewed): lists the per-run time-to-ready, host load averages (10.6 / 29.75 / 19.43 on 14 cores, 78 s after the red run) and 94% swap use; the nine failure heads; the dev server log of the red run had 6 failed module fetches and 3 HMR reload warnings against 0 and 0 in every other run; `auth-setup` took 51.8 s versus 8.1 s. It does not identify the cause of the slowdown. The same facts are filed as `.planning/todos/pending/2026-10-06-172-full-suite-red-on-a-slow-dev-server-start.md` (severity major), which itself states "the cause of the slow start is not identified". Nothing outside `.planning/` differs between the tree of the two runs and HEAD.

**What this does and does not show.** The red attempt's failures sit in the voter flows, not in anything the phase changed in the contestant path or the visibility rule, and the second attempt passed all 180 with the tree unchanged. That is consistent with a host or dev-server-start problem. It does not establish it: the one failure with a content mismatch (voter-journey category intro) is the kind a phase-caused data difference would also produce, and a rerun that passes is by the project's own rule not a pass. I am not passing or failing the phase on this.

### Human Verification — accepted by the operator, 2026-10-07

Operator decision C5 (a) in `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md`: the diagnosis in `.planning/debug/172-closing-run-red-on-slow-host.md` is accepted — the laptop was asleep for 198 seconds of the 454-second first attempt, and an induced CPU load did not reproduce the failure — so that run is void and the criterion is met by the green runs on the same commit. The item below is kept as it was put.

1. **Closing E2E red once, green on rerun without a fix.** Closing E2E run red once, green on rerun without a fix; root cause under diagnosis; the phase's E2E-03 criterion is not established until the diagnosis is accepted.
   - **Test:** Review the debugging session's diagnosis of `tests/e2e-runs/172/172-09-final` against the evidence above; if it attributes the red to the host and dev-server start, accept it, otherwise fix the cause. Then a first-attempt green full run on the accepted head (or the accepted diagnosis) closes the criterion.
   - **Expected:** The cause is named, and the failure is either shown independent of this phase's tree or fixed; the full suite is green with 0 failed, 0 flaky, 0 did-not-run.
   - **Why human:** CLAUDE.md hard rule; this verifier was instructed not to decide it.

### Gaps Summary

No code or schema gap was found. Every roadmap criterion other than the second half of criterion 5 is verified against the tree and the applied database, and the gate set is green on the closing head. The one open item is the E2E-03 evidence, which is held as a human decision rather than as a gap because no defect in the phase's artifacts was found and the diagnosis is in progress elsewhere.

Observations that are not gaps: the two new axe scans have no recorded negative control; the stored terms-pending identity edits `test-e2e-base-ca-aa-hidden`, a stable candidate chosen for convenience, while the view renders before any entity is read; `.planning/REQUIREMENTS.md` still shows TOU-01..03 and REG-12 as pending and ROADMAP shows 7/9 plans, to be updated by the orchestrator on acceptance; `172-VALIDATION.md` is still `status: draft` (approval left to the operator, as disclosed).

---

_Verified: 2026-10-06_
_Verifier: Claude (gsd-verifier)_
