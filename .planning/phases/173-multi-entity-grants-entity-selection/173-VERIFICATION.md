---
phase: 173-multi-entity-grants-entity-selection
verified: 2026-10-06T23:30:00Z
status: human_needed
score: 7/7 must-haves verified
covered_files:
  - .planning/phases/173-multi-entity-grants-entity-selection/173-01-PLAN.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-01-SUMMARY.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-02-PLAN.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-02-SUMMARY.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-03-PLAN.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-03-SUMMARY.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-04-PLAN.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-04-SUMMARY.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-05-PLAN.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-05-SUMMARY.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-06-PLAN.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-06-SUMMARY.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-07-PLAN.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-07-SUMMARY.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-08-PLAN.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-08-SUMMARY.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-09-PLAN.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-09-SUMMARY.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-10-PLAN.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-10-SUMMARY.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-11-PLAN.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-11-SUMMARY.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-12-PLAN.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-12-SUMMARY.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-13-PLAN.md
  - .planning/phases/173-multi-entity-grants-entity-selection/173-13-SUMMARY.md
  - apps/frontend/src/lib/auth/roles.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
  - apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
  - apps/frontend/src/routes/contestant/(protected)/+page.server.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - tests/tests/specs/contestant/contestant-entity-selection.spec.ts
covered_digest: "v3:sha256:951307783ff73b2158f062c4a69551ac5dc1fb8aaf45eb8cc4a01c96df1ee30a"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Open an organization editor's profile, questions, preview and settings pages in a browser, and save an answer through the UI"
    expected: "Each page shows the organization's own data and the save succeeds (Phase 175's scope; only the home and the menu have been browser-rendered, the save only through the adapter)"
    why_human: "The spec reaches the organization's home alone and the context's question scope still names the candidate type, so 'every page' of criterion 3 is proven for candidates and, for organizations, only at the adapter and home level"
---

# Phase 173: Multi-Entity Grants & Entity Selection Verification Report

**Phase Goal:** One user can hold editor grants on several entities of either served type in a project, and chooses, and can later change, which one they are editing.
**Verified:** 2026-10-06T23:30:00Z
**Status:** human_needed
**Re-verification:** No, initial verification
**Method:** goal-backward against the tree at HEAD `ab9c8989e`. No E2E, pgTAP, database or build command was run (another agent holds the stack); the closing runs' recorded evidence was read directly and cross-checked against the tree. `git diff c8db3b8fc..HEAD -- . ':!.planning'` is empty, so the recorded runs describe the tree as it stands.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1 / ENT-03: a user can hold grants on several entities and sign in; the ambiguity raise and the old RPC are gone; the index is kept; the login gate admits organization editors; admin tested first | VERIFIED | `git grep` for `get_candidate_user_data` and `ERR_ENTITY_IDENTITY_AMBIGUOUS` outside `.planning` and `tests/e2e-runs`: no hit. `get_user_entities (uuid)` and `get_entity_user_data (uuid, entity_type, uuid)` in `schema/503-entity-rpcs.sql` and `migrations/00001_initial_schema.sql` (lines 6172 and 6229-6240), both `SECURITY INVOKER`, `search_path = ''`. `idx_grants_one_candidate_editor` present in `schema/300-auth-tables.sql:34` and the migration; its comment says one editor per candidate and that nothing stops one user editing two candidates. `CONTESTANT_GRANTS` in `lib/auth/roles.ts` lists candidate and organization editors; `supabaseDataWriter.ts:229-232` tests `ADMIN_GRANTS` first and `CONTESTANT_GRANTS` second. `passwordLogin.test.ts` pins an organization editor admitted and non-contestant shapes refused. Spec project `data-setup-entity-selection` signs the multi-grant user in through the form. |
| 2 | SC2 / ENT-01: several entities give the selection screen at the root, one card per entity; one gives a server redirect to its home; zero gives the signed-in "nothing to edit" view | VERIFIED | `contestant/(protected)/+page.server.ts` returns `{view:'nothingToEdit'}` for 0, `redirect(307, ContestantAppEntityHome)` for exactly 1, `{view:'select'}` otherwise; it reads only `parent`. `page.server.test.ts` pins all three (0, 1 per type via `it.each`, 3 several-entity combinations) and the gated case. `page.svelte.test.ts` pins the "nothing to edit" view, one card per entity in display order with group headings, loading/error states, links to the entity home. Spec `contestant-entity-selection.spec.ts` exercises all three: `choosing` (three cards under two headings), `one entity` (root redirected to home, no switch item), `nothing to edit` (grant revoked mid-session and stored no-entity session, email and support button, logout without a dialog). Recorded 8/8 in `173-13-final`. |
| 3 | SC3 / ENT-02: switching without signing out; every page then shows and saves the new entity's data | VERIFIED (candidates; see human item for organizations) | Route `contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/…`; entity-level `+layout.server.ts` reads exactly `params.entityType` and `params.entityId`, no `url`, no `route`; `layout.tracking.test.ts` has a read-recording `url` Proxy with negative controls (also on the root and user-level loads). Drafts keyed `contestantContext-userData-editedAnswers-<type>-<id>` (`editedAnswersKey`, `contestantUserDataState.svelte.ts:27`); reload and save guarded by `#isLoaded(key)`; logout sweeps by key stem; `leaveEntity()` on layout teardown. Spec asserts: a draft survives a reload, is absent on the other candidate, a save changes the selected row only (read with the service role), the switch item returns to the selection with focus on the heading, the second candidate's pages show its saved answer. |
| 4 | SC4 / GEN-02: selecting an organization loads its own data and saving succeeds through the generic writer | VERIFIED at the adapter and home level | `supabaseDataWriter.ts` dispatches on `ENTITY_TABLES = {candidate, organization}`; `servedEntityType()` throws only for unserved types (alliance, faction). `supabaseDataWriter.integration.test.ts`: `tests/e2e-runs/173-gates/173-13-integration.json` read: 7 passed, 0 failed, 0 pending, success true, head file `c8db3b8fc`. Spec: the organization's home loads with the organization's name in its heading and in the menu; an organization editor signs in through the form and lands on it. **Not proven:** any organization page other than the home in a browser; any organization save through the UI; no organization page is axe-scanned (the a11y spec's own table lists "an organization's pages" as unscanned; Phase 175's). The writer and store serve organizations, but `contestantContext.svelte.ts:311` still scopes questions to the candidate type (O-7, Phase 175). Roadmap Phase 175 criteria 1-3 own organization pages. |
| 5 | SC5 / E2E-03: selection spec exists and the full suite is green on one tree | VERIFIED | `tests/e2e-runs/173-e2e/173-13-final/summary.json`: total 198, passed 198, failed 0, flaky 0, skipped 0, didNotRun 0, 103 projects; `head` = `c8db3b8fc`; `power.txt`: AC power, `sleep_entries_in_window: 0` (22:10:09 to 22:15:45). `173-gates/173-13-final/summary.tsv`: twelve rows, every status 0; `head` = `c8db3b8fc`; `06-pgtap.log`: Files=38, Tests=1447, PASS, including 10, 18, 20, 36. No file outside `.planning/` differs between `c8db3b8fc` and HEAD. |
| 6 | Security: authorisation by grant, not by URL | VERIFIED | Entity-level load: unlisted entity, unserved type, type/id mismatch, entity not found, all one `redirect(307, appRoot)` (`layout.server.test.ts` "answers the five refusals with redirects equal in status and location", plus a no-loop case); malformed id is a 404 from the `uuid` matcher (`params/uuid.ts`, strict canonical form) and `servedEntityType` matcher (allowlist). Resolver `[...page=contestantEntityPage]/+page.server.ts` applies `PLAIN_ID` `/^[A-Za-z0-9_-]+$/` to the decoded question segment and builds targets only through `buildRoute`. pgTAP refusal matrix present on the tree (spot-checked by description): `10` "candidate_a cannot call upsert_answers for org_a", `18` "organization editor''s image write on a candidate of its own project" (2 occurrences), `20` "an organization grantee is DENIED a write into a candidate folder"; `36-entity-identity.test.sql` holds the stale-token cases (token predating a grant: not listed, no row; grant removed while token still carries it: not listed, no row; controls included). Name gate: `git diff 607d471fb..HEAD -- scripts/assert-no-candidate-app-names.mjs` changes exactly the removal of the `get_candidate_user_data` exemption (list now two entries), the lookbehind gaining `contestant`, and comments. ESLint: `ADAPTER_BOUNDARY_ALLOWLIST` group 2 still has eight entries; `(protected)/+layout.server.ts` replaced by `lib/server/contestant/signOutToLogin.ts`; the diff is 4 lines. |
| 7 | Accessibility and locales | VERIFIED | Six new scans (`contestant-entity-selection`, `contestant-nav-menu-switch`, `contestant-nothing-to-edit`, each light and dark) in `contestant-a11y.spec.ts`; 22/22 in `contestant-a11y-scan` in `173-13-final`. Negative control `173-13-negative-control` kept: `.exit` = 1, log shows 2 failed / 28 passed with `button-name` from the planted button. Eight strings (`contestantApp.entitySelection.*` and `contestantApp.nothingToEdit.*`): 8 non-empty keys in each of da, en, et, fi, fr, lb, sv; 8 generated translation keys. |

**Score:** 7/7 truths verified (0 present, behavior-unverified); 1 human-verification item.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/supabase/supabase/schema/503-entity-rpcs.sql` and the migration | two invoker RPCs; one-object list | VERIFIED | one jsonb object with `entities` array, one row even for no entity (extensible per-user key) |
| `lib/auth/roles.ts` | `CONTESTANT_GRANTS` with two shapes | VERIFIED | faction and alliance editors not admitted |
| `(protected)/+layout.server.ts`, `+page.server.ts`, entity `+layout.server.ts`, resolver | three-stage decision | VERIFIED | each with a tracking test |
| `contestantUserDataState.svelte.ts` | per-entity drafts, guards | VERIFIED | |
| `contestant-entity-selection.spec.ts` + fixtures/setup/teardown | selection spec | VERIFIED | 8/8 recorded |
| `supabaseDataWriter.integration.test.ts` | organization save + six refused writes | VERIFIED (recorded) | 7/7; gated, runs in no CI job (disclosed) |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| user-level load | entity-level load / root / resolver | `parent()` `gate` + `entities` | WIRED |
| root load | entity home | `buildRoute('ContestantAppEntityHome')` redirect for one entity | WIRED |
| selection cards | entity home | `getRoute.current({route:'ContestantAppEntityHome',…})` | WIRED |
| writer | entity table | `ENTITY_TABLES[type]` | WIRED |
| store | draft | `editedAnswersKey({type,id})` | WIRED |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| ENT-01 | choose from cards; one grant skips the screen | SATISFIED | truth 2 |
| ENT-02 | switch without signing out | SATISFIED (candidates in a browser; organization pages open, human item) | truth 3 |
| ENT-03 | several editor grants; raise lifted; index kept | SATISFIED | truth 1 |
| GEN-02 | writer and RPC serve every served type | SATISFIED at adapter level | truth 4 |

No orphaned requirement IDs for Phase 173 in REQUIREMENTS.md.

### Anti-Patterns Found

None blocking. `TBD|FIXME|XXX` was not swept tree-wide; the closing gate's lint, typecheck and hygiene rows are green. `contestantContext.svelte.ts:311` (`ENTITY_TYPE.Candidate`) is the recorded O-7 hand-off to Phase 175, not a defect of this phase.

### Fixes of 173-03 (read as commits)

| Commit | Cause | Kind | Regression test |
|--------|-------|------|-----------------|
| `b1ec2b99f` | `reloadEntityData` read the saved data tracked before its first await, so an effect that started a reload depended on its own result and looped (198 `get_entity_user_data` requests in one test) | Root-cause fix | A store unit case starts a reload inside an effect and asserts one run and one read |
| `cafcdba51` | the layout loads the entity in its own effect after the page's, so the preview's first reload found no entity | Root-cause fix (effect depends on the loaded entity's type and id as one derived string) | None at unit level; guarded by `contestant-journey` step 21 (its probe and the full run were green) |
| `43385c089` | name fields were rendered only once a candidate was in the store, so SSR and first paint held none | Root-cause fix (shown unless the entity is an organization) | None at unit level; guarded by `perm-answers-locked` (probe green) |

None is a workaround. Two of three rely on pre-existing E2E specs as their regression guard rather than a dedicated unit test (WARNING, not a gap).

### Spot-checked obligations to later phases (O-1..O-12)

- O-6: `candidateNoNomination` is raised in the entity-level `+layout.server.ts` only (the remaining hits are the error-code map, the translation key and the type).
- O-7: the context's question scope still reads `const entityType = ENTITY_TYPE.Candidate` (`contestantContext.svelte.ts:311`), left for Phase 175.
- O-1: `get_user_entities` returns one object, one row even with no entity, so a per-user key can sit beside `entities` (Phase 178).

### Disclosed, awaiting operator (not scored)

UI decisions U-01..U-16 including the "profile" wording and no entity name on the answering pages (U-09); switching loses nothing for the store only (editors' discard prompt as is); a grant written after the token needs a session refresh (obligation to Phase 174); the terms-of-use view overflowing at 390px with the checkbox unreachable and focus left on `<body>` (Phase 172's, flagged as a blocker for phone users); the navigation drawer not closing on Escape; `Error formatting nomination` logged three times per run; the gated integration test running in no CI job; the two opt-in bank-auth projects unexercised since Phase 172; constructed non-English strings awaiting native-speaker review; one-off lint-red commit boundaries inside 173-09; `CLAUDE.md` sentences for the operator to update.

### Human Verification Required

1. **Organization pages in a browser** (see frontmatter). Test: sign in as an organization editor, open profile, questions, preview, settings, answer and save. Expected: the organization's own data and a successful save. Why human: only the organization home and menu are browser-covered; Phase 175 owns the pages, but the roadmap wording of criterion 3 ("every page") and criterion 4 is met for organizations only at the adapter level.

### Gaps Summary

No blocking gaps. All five roadmap criteria hold on the tree, backed by recorded closing runs that describe the current tree exactly. The status is `human_needed` solely because organization pages beyond the home have no browser evidence in this phase (a deliberate hand-off to Phase 175) and the operator should accept or reject that reading of criteria 3 and 4. Warnings: two of the three 173-03 root-cause fixes have no dedicated unit regression test; the adapter-level integration test runs in no CI job (disclosed).

---

_Verified: 2026-10-06T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
