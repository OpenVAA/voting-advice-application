# Phase 175: Organization Editing — Profile, Questions & Preview - Research

**Researched:** 2026-10-08
**Domain:** SvelteKit 2 / Svelte 5 contestant app (contexts, a store, one writer), a Supabase schema change with RLS, triggers and pgTAP, the dev-seed import path, and the Playwright E2E harness
**Confidence:** HIGH for what the tree holds today; MEDIUM for three behaviours that only a run on the changed tree can show (listed under *Assumptions Log*)
**Tree read at:** `c030a0d4f` (2026-10-08). Outside `.planning/` and `tests/`, application source equals the Phase 174.1 closing tree `1c5d2896d` plus one new unit-test file, `apps/frontend/src/lib/components/input/Input.focusReturn.svelte.test.ts` (measured: `git diff --stat 1c5d2896d HEAD -- apps packages`, 1 file).

**How claims are labelled.** *Measured* names how (a query against the local database inside `BEGIN READ ONLY … ROLLBACK`, a single unit-test file run, a count by script). *Read* means the file was opened in this session and the value is quoted. *Inferred* means it follows from what was read and was not run. Code is cited by path and a content anchor (a symbol or a quoted line), never by line number — at the orchestrator's instruction, which replaces the line-range form of the provenance rule; every discrete value used below is quoted verbatim beside its claim. Frontend paths are relative to `apps/frontend/src/` unless they start with `apps/`; `schema/` and `tests/database/` are relative to `apps/supabase/supabase/`; `ENTITY/` abbreviates `routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/`.

**What was not run, and why.** An E2E run was in flight on the shared local stack, so nothing wrote to the database: no `yarn db:reset`, no seed, no teardown, no dev server, no E2E, no writer integration test (it creates users and rows in the default project). Every such measurement is named as a first-wave task instead.

<user_constraints>
## User Constraints (from CONTEXT.md)

`175-CONTEXT.md` stays the authority: each decision there carries reconciliation notes, planner constraints and an *If wrong* line that this section does not repeat. What follows is each decision's own locked sentence, verbatim, so that the planner can check a plan against it without paging.

### Locked Decisions

- **D-01 (175-0.1):** Accept all 19 facts of 175-0 as the baseline; restated under `<factual_baseline>` **with the corrections Phases 170, 172 and 173 made to facts 1, 2, 9, 10, 11, 13, 16, 17 and 18, and the re-reading OD-B1..B3 give facts 4 and 5**.
- **D-02 (175-A1):** **One route tree and one page component per route. A small per-type descriptor module names what differs between the entity types, and each page reads it by the selected entity's type.** The descriptor does **not** carry a per-type lock rule. **Keep 173's first-paint rule** when replacing the inline `isOrganization` branch.
- **D-03 (175-A2):** **`2026-03-28-generalize-candidate-app-to-party-app.md` is closed at this phase's close** — it is this phase's goal. **`2026-03-28-investigate-migrating-candidate-answer-store.md` is left untouched and out of scope**.
- **D-04 (175-B1 → (b) + NOTE; OD08-C6 (a)):** **The organization profile has: name, short name, a logo image, a colour field, and the info questions that apply to organizations.** **The colour field is for organizations only. The user picks one colour, stored as `normal`; the dark-theme colour is derived on read. The field does not lock on confirmation; it locks with answers, like the logo. The preview shows the adjusted colour.** **when a colour is read in, it is passed through the ensure-contrast util.**
- **D-05 (175-B2 NOTE, OD-B1 (a)):** **A name field — first name, last name, name, short name — is editable only while the entity is unconfirmed, for every entity type. The nominations lock affects nominations only. How an entity comes to be confirmed: identity provider → a candidate is confirmed, an organization is not; a named entity seeded with a code or an email → confirmed, as the normal case.** In the page a name field is also read-only while `access.answersLocked` is on (D-09). The page reads `confirmed` from `ctx.selectedEntity.confirmed`; **no schema change** (OD08-C7 (a)). **The page's lock is presentation; the trigger is the control.** **A save sends only the properties the user changed.**
- **D-06 (OD-B2 (a), reworded by OD08-F1 (a)):** **An organization seeded as confirmed has `name` and `short_name` as locked fields for its user from the first sign-in. Only an admin changes them. Intended**.
- **D-07 (175-B3 NOTE, OD-B1 (a); OD08-C2 (a)):** **A candidate's `first_name` and `last_name` follow the same rule, in the app as in the database: the two inputs are shown locked when the candidate is confirmed and are editable when it is not.**
- **D-08 (OD-B3 (a); OD08-C3 (a)):** **`short_name` freezes on confirmation together with the name columns, enforced in the trigger, on all four entity tables — `organizations`, `candidates`, `factions` and `alliances`; `entity.edit_immutable` still lets an admin correct either.** In each registration `short_name` joins **both** the `UPDATE OF` list and the argument list. The function body does not change.
- **D-09 (175-B4; OD08-C1 (a)):** **A name field is editable when the entity is unconfirmed and `access.answersLocked` is off. The page has one Save button and one rule for "can I edit here".**
- **D-10 (175-B5 → (b) + NOTE; 177-B5 → (b); OD08-B1..B4 (a)):** **The nominations lock moves out of `projects.lock_nominations` into the app settings as `access.nominationsLocked`, beside `access.answersLocked`. It is promoted to a full column only if RPCs or indices need it. The database goes on enforcing it, reading it from there. The contestant context exposes it as a `nominationsLocked` accessor beside `answersLocked`; Phases 176 (the "not editable" note on J) and 177 (NOM-06, K) read that one accessor.** One source: the column goes. A project editor may lock and unlock. **Fail closed on what cannot be read, default open on what is not set** (OD08-B3 (a)).
- **D-11 (175-B6):** **The name is required in the project's default locale; other locales are optional. The short name is optional in every locale.** The rule binds only while the fields are editable (OD08-C5 (a)).
- **D-12 (175-B7):** **The store's staged properties are extended and saved by the same `save()` call and the same Save button as the image and the info answers** — one unsaved-changes guard and one failure surface. The staged list is **`image`, `name`, `shortName`, `color`** for an organization and **`image`, `firstName`, `lastName`** for a candidate. **Which property may be written for which type is a closed map in the writer**.
- **D-13 (175-C1):** **An entity with no opinion questions is not offered the questions task: the home button and the navigation item are not shown for it, and a deep link shows a neutral "there are no questions for you to answer" page.**
- **D-14 (175-C2; OD08-C5 (a)):** **One formula for both types — no unanswered required info question and no unanswered opinion question — plus, for an organization whose name is still editable, a name in the project's default locale.**
- **D-15 (175-C3):** **`entities.hideIfMissingAnswers` gains an `organization` key, default `false`, in the setting type, the stored-settings schema and the defaults; the five UI reads take the key of the selected entity's type.**
- **D-16 (175-D1):** **The preview shows the organization's own info and opinions tabs; the `children` tab is left out in the Contestant app.** The tab is left out by what the Contestant app passes or provides, not by a change to what the voter app renders.
- **D-17 (175-E1):** **Neutral strings stay single. A string that must differ gets one key per type (`….candidate` / `….organization`), picked by the selected entity's type through the descriptor of D-02.** All seven locales; a native-speaker review todo is filed and does not hold the phase.
- **D-18 (175-F1; OD08-C4 (a), C8 (a)):** **A new perm-style template with its own dataset — an organization with an editor, and questions scoped by entity type — and a new organization-editing spec over it.** **It requires a schema change the roadmap now lists:** `bulk_import` stops skipping `entity_type` on `question_categories` and `questions`, and dev-seed stops denying it there. **`nominations.entity_type` stays skipped and denied.** The dataset holds **two organizations** — one unconfirmed and one confirmed, with a confirmed nomination. It is its own dataset on the suite's **one** project.
- **D-19 (175-F2; OD08-C4 (a)):** **The spec, after saving, opens the voter app's detail of that organization and asserts what it saved — for every field, the two names included.** Sequenced over the two organizations: the confirmed one for image or colour, an info answer and an opinion answer, with its name fields locked; the unconfirmed one for name and short name, then confirmed by the test with the service role, then read in the voter app and found locked.
- **D-20 (175-F3):** **Axe scans are added for the organization profile — once with the translations collapsed, once expanded — and for the organization preview, each in both themes**, with reach proven by an organization-only marker. Also scanned: **name fields locked (confirmed)** versus editable, the **colour field**, and the neutral no-questions page.
- **D-21 (175-G1):** **Five plans in three waves.** Wave 1: (1) schema; (2) context and state. Wave 2: (3) the profile page; (4) the questions empty state and the organization preview. Wave 3: (5) template, spec, axe entries and the closing gate. The planner may split a plan that grows past one verifiable unit but keeps the wave order and one migration regeneration.
- **D-22 (175-G2):** **Closing gate: unit, type, lint and production build; pgTAP and `yarn db:lint:sql`; one full E2E run through `tests/scripts/e2e-run.sh`; and the new organization spec three times in isolation.** Plus the writer integration test against the running stack; exit statuses read directly, never through a pipe; the power state recorded for every run.

All ten judgement calls (J1–J10) are ruled (OD08-C1…C8, B1…B4) and none is open.

### Claude's Discretion

- The descriptor module's name, location and exact shape, and how a page reads it.
- The route keys stay (`ContestantAppProfile`, `ContestantAppQuestions`, `ContestantAppPreview`); new test ids follow `tests/tests/utils/testIds.ts`. Existing ids (`profile-first-name`, `profile-last-name`, `profile-image-upload`, `profile-submit`, `contestant-profile-info-item`) keep their meaning for a candidate.
- The colour input's control, within D-04 and the UI spec.
- How the `children` tab is left out (a prop on `EntityDetails`, or the contents the app passes).
- The exact wording of the new strings, within D-17; the message-key names.
- How the default-locale requirement is expressed (an `Input` prop or a page-level check), provided Phase 179's CI1 form can use the same thing.
- Whether plan 1 of D-21 is one plan or split, within one migration regeneration.
- Removing the widened `page.params` annotation while editing the context (`2026-10-06-173-widened-page-params-annotation-in-contestant-context.md`) — expected, since plan 2 edits that file.

### Deferred Ideas (OUT OF SCOPE)

- An Admin-app screen to confirm an entity, to correct a confirmed name, or to set the nominations lock — out of scope for v2.16 (`REQUIREMENTS.md` § Out of Scope); the rules are enforced and the screens are not built.
- A suggestion store for changes to immutable data — ruled out in Phase 162; users message the admin.
- Faction and alliance users in the Contestant app.
- The answer-store investigation (D-03).
- Loading the organization's candidates into the preview (`children` tab) — 175-D1 (b), not chosen.
- Rescanning all seven candidate surfaces as an organization — 175-F3 (b), not chosen.
- A deep merge of stored settings — the standing todo; this phase restates roots instead. *(See disagreement T-1 below: the merge is deep on the tree today.)*
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GEN-01 | An organization user can edit the organization's profile, answer questions and preview its public appearance, as a candidate can. | The writer and store already serve an organization's answers and image (173). What is missing, each located below: the context's question scope (`const entityType = ENTITY_TYPE.Candidate;`), the raw localized name in the entity read (T-3), the property writer's three image-only guards (T-4), the preview's colour read and `children` tab (T-5), and the first-paint state of the questions layout (P-9). |
| GEN-03 | Name and short name as multilingual fields, editable while unconfirmed and answers are not locked, read-only once confirmed; one rule for every entity type; the database freezes `short_name` with `name` on all four tables; `entity.edit_immutable` lets an admin correct either. | The trigger body needs no change; the four registrations do (RQ-4 lists the four pgTAP rows this turns red). `ctx.selectedEntity.confirmed` is available on the server and on first paint, so the lock can be right before the store loads. The refusal has a stable prefix the writer can match. |
| E2E-03 (closing criterion) | The full E2E suite is green at the close of every phase. | *Validation Architecture* names the dataset, the two-organization spec shape, where the axe scans can live, and the gate rows. |
</phase_requirements>

## Summary

The context's picture of the tree is right in the large and wrong in nine places that change a plan (T-1 to T-9 below). The three that matter most: **(1)** the entity read hands the page a *localized string* for `name` and `short_name`, not the locale-keyed object a multilingual input edits — `_getEntityUserData` runs every row through `toDataObject`, whose `STANDARD_LOCALIZED_FIELDS` are `'name', 'short_name', 'info'` — so the raw values must be carried beside the localized ones before any name field can be built; **(2)** the nothing-validates finding of RQ-2 is total — `questions.entity_type` and `question_categories.entity_type` are bare nullable `jsonb` with no constraint and no trigger, and `organizations.name`, `short_name` and `color` are likewise unconstrained, so every shape rule this phase relies on has to be put somewhere by this phase; **(3)** dev-seed defends the `entity_type` denial with a parity test that parses the SQL's `skip_columns` array by regex and with two byte-frozen negative-control fixtures, so lifting the skip on two tables is a redesign of that test group, not a one-line edit.

The schema work is otherwise small and well-pinned. The lock helper's new body is one expression, and the form matters: `settings #> '{access,nominationsLocked}' = 'true'::jsonb` is true for the JSON boolean alone, while the text form `#>>` also reads the *string* `"true"` as locked (measured on nine shapes). The trigger change is four registrations. Four existing pgTAP assertions update `short_name` as an entity user on a confirmed fixture row and go red with it; they are about grants, not about `short_name`, and take another column.

The G7 finding arrived while this research ran and is folded in (RQ-7): the four warnings are `Input`'s own focus bookkeeping crossing a component boundary, not a value, and the recommended repair is a ~25-line change inside `lib/components/input/` that should be the phase's first frontend task. Two of its adjacent facts are constraints on this phase's new fields: `Input` throws `DataCloneError` when handed a `$state` proxy as `value`, and `onChange` emits `Input`'s live proxy.

**Primary recommendation:** plan the phase as the context's three waves with plan 1 kept serial inside itself (three schema changes, each with its pgTAP row red first, the migration regenerated in every schema commit because the parity gate requires it, one `db:reset` → `db:types` → pgTAP → SQL-lint sequence at the end), put the `Input` parts repair first in plan 2, and carry the raw localized name through the writer in plan 2 so that plan 3 builds the name fields on a typed value.

## Disagreements between the context and the tree

Each row is a statement in `175-CONTEXT.md` that the tree, read today, does not bear out, or bears out only in part.

| # | The context says | The tree says | Consequence for the plan |
|---|---|---|---|
| **T-1** | D-10 planner constraint: "**A stored root replaces the shipped root whole.** A project that stores `access: { nominationsLocked: true }` alone drops every other `access` default (`mergeAppSettings`; todo `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md`). Every template and test that sets the lock restates the whole `access` root." Also *Established patterns* and *Deferred Ideas*. | **Read:** `lib/utils/settings.ts` `mergeAppSettings` — "Merge settings over other settings, member by member at every depth." (`mergeLevel` recurses where both sides hold an object). Changed by `05a10320c feat(171-01): merge app settings member by member at every depth…` (measured: `git log -- apps/frontend/src/lib/utils/settings.ts`). The harness's write side is deep too: `setupFromTemplate.ts` — "`updateAppSettings`, which calls the `merge_jsonb_column` RPC: objects merge recursively, and a list or a scalar in the overlay replaces the stored one whole." The suite already stores one member of a root and relies on both merges: `perm-org-matching.spec.ts` calls `client.updateAppSettings({ matching: { organizationMatching: 'none' } })`. | Restating the whole `access` root is no longer required for correctness. A template may state the one key. The pending todo's first half is stale and should be noted so when the phase files its todos. **Lists** are still replaced whole, which is why the new template still states the complete `contestantApp.entityTypes` list. |
| **T-2** | D-11: "the database asks for a non-empty name in any locale"; OD08-C5 repeats it as measured. | **Measured:** no CHECK constraint exists on `organizations` or `candidates` (query over `pg_constraint`, `contype = 'c'`, returned no row for either), and `organizations.name` is `jsonb`, nullable (`information_schema.columns`: `organizations | name | YES | jsonb`). **Read:** the only place that asks for a non-blank name is `create_invitations`' confirmation arm — `AND private.localized_has_text(e.name)` (`schema/506-invitation-rpcs.sql`). | The statement is true of *what `create_invitations` will confirm*, not of what the column will store. An admin holding `entity.confirm` can confirm an organization whose name is null, and an entity user can store any JSON in `name` on an unconfirmed row. OD08-C5's ruling is unaffected; the security table below takes up the second half. |
| **T-3** | D-05: "the organization's `name` and `short_name` are multilingual inputs"; fact 2: the RPC "returns `name`, `short_name`, …". Nothing says the page cannot see the locale-keyed value. | **Read:** `get_entity_user_data` returns `name jsonb, short_name jsonb` raw (`schema/503-entity-rpcs.sql`), but `_getEntityUserData` maps the row with `toDataObject(entityRow, effectiveLocale, this.defaultLocale)`, and `lib/api/adapters/supabase/utils/toDataObject.ts` declares `const STANDARD_LOCALIZED_FIELDS = ['name', 'short_name', 'info'];`. So `userData.current.entity.name` is one locale's string; `LocalizedOrganizationData` is `OrganizationData & { answers?: LocalizedAnswers \| null }`, whose `name` is a string. `ctx.selectedEntity.name` is a localized string as well (`_getUserEntities` → `localizeRow(entry, ['name', 'short_name'], …)`). | Plan 2 must carry the raw localized `name` and `short_name` on the entity user data (a new member, or a widened type) — no schema change, the RPC already returns them. Without it plan 3 has no value to hand a `text-multilingual` input. The preview keeps needing the localized string, so both forms travel. |
| **T-4** | D-12 lists what widens: `EditableEntityProps`, the `updateFields` the adapter builds, the read-back column list (`'image'`) and the declared return type. | **Read:** a fifth guard sits one level up — `lib/api/base/universalDataWriter.ts` `updateEntityProperties`: `if (!opts.properties.image?.file) throw new Error('An image file is required for updating entity properties');`. And the store's `save()` calls the property writer only `if (image)`, then throws `'Failed to update image'` when nothing comes back. | Both are lifted with the widening, or a name-only save throws before it reaches the adapter. |
| **T-5** | D-16: "`EntityDetails.svelte` gives an organization `['info', 'opinions', 'children']` by default". | **Read:** that list is the component's inline fallback, used only when the setting is empty. The shipped setting is `packages/app-shared/src/settings/dynamicSettings.ts` `entityDetails.contents.organization: ['info', 'children', 'opinions']` — a different order — and it is project-configurable; `MINIMAL_BASE_APP_SETTINGS` (`packages/dev-seed/src/templates/e2e/perm/shared.ts`) stores the same list. | Leaving the tab out "by what the app passes" must filter the *setting's* list, so it is a prop on `EntityDetails` (or a branch on `appType`), not a different default. With the tab gone the organization's preview tabs are `info`, `opinions` in the setting's order. |
| **T-6** | D-11 / RQ-5: "the project's default locale"; "the adapters hold `this.defaultLocale`". | **Measured:** three sources exist and none is "the project's" in the frontend. (a) `projects.default_locale` — the frontend never reads it (no match for `default_locale` under `apps/frontend/src` or `packages/app-shared/src` outside one type comment). (b) The adapter's `#defaultLocale = 'en'` in `supabaseAdapter.ts`, set only `if (config.defaultLocale)` — and no caller passes one (the only non-test `defaultLocale:` under `apps/frontend/src` is the forwarding line in `resolveAdapterConfig`). (c) `defaultLocale` exported from `lib/i18n/init.ts`, taken from `staticSettings.supportedLocales[].isDefault`. No context exposes any of them. | See RQ-5 for the recommended source and the todo to file. |
| **T-7** | D-15's reads and the perm templates are "re-read against the widened schema"; fact 1 says the question scope is the only candidate-only piece left in the context. | **Read:** a unit test pins the hard-coded scope — `lib/contexts/contestant/contestantContext.svelte.test.ts`, `describe('contestantContext questionBlocks — RUNES-05: entityType passed to getApplicableQuestions'`, "every blocks-path getApplicableQuestions call receives entityType === Candidate" — and `lib/contexts/utils/questionRollup.ts`'s header states "The contestant app scopes the rollup to `ENTITY_TYPE.Candidate`". | The test is rewritten for both types in plan 2, not merely extended; the header comment is corrected in the same commit. |
| **T-8** | D-15: "The voter context applies whatever keys the object holds (`lib/contexts/voter/nominationAndQuestionState.svelte.ts`), so the warning and the behaviour stay in step for both types." Marked [tree]. | **Read:** that file reads the `candidate` key and no other, in two places: `if (entityType === ENTITY_TYPE.Candidate && hideIfMissing?.candidate)` filters candidate nominations lacking an opinion answer, and `if (entityType === ENTITY_TYPE.Organization && hideIfMissing?.candidate)` removes those candidates from each organization's children and then drops "orgs with no children left". Nothing reads an `organization` key. | With the default `false` nothing changes. But once the five UI reads take the selected type's key, a project that stores `organization: true` tells an organization "you are hidden because answers are missing" while voters still see it. Either the voter filter gains the organization arm in this phase (a few lines, with a unit case), or the plan records that the key is text-only until it does. The first keeps D-15's own reason true. **Also for the dataset:** with `candidate: true`, an organization that has no candidate under it is removed from the voter's results — the new template must state `candidate: false`, as `MINIMAL_BASE_APP_SETTINGS` does. |
| **T-9** | D-07: "Every candidate the product creates today is confirmed (identity provider, or a named invitation), so **no existing candidate sees a change** and criterion 5 holds". | True of the product; **not of the suite's datasets.** *Read:* `e2e/base.ts` seeds `test-e2e-base-ca-sel-a` and `-b` with `confirmed: false`, and `tests/tests/setup/contestant/entity-selection.setup.ts` makes the multi-entity user their editor. The contestant journey's invited candidate also runs unconfirmed: `contestant-journey.spec.ts` seeds it inside `invitationFlow.whileHiddenFromVoters(JOURNEY_CANDIDATE, …)`, whose own doc says it will "leave it unconfirmed as the dataset seeds it". | After D-07 the profile pages of those three candidates render **editable** first- and last-name inputs. `contestantProfilePage.fixture.ts`'s `expectStaticInfo` reads `profile-first-name` with `toHaveValue`, which holds for an enabled input too, though its comment says "the disabled `<input>` element itself". Nothing else that depends on the inputs being disabled was found by search in `tests/tests/specs/contestant` and `tests/tests/fixtures/contestant`; `perm-answers-locked` stays right because answers are locked there. The full run is the proof. Criterion 5's "unchanged" is about behaviour the journey asserts, and the plan should say that three suite candidates change presentation by design. |

Smaller corrections, none changing a plan's shape:

- **`<expected_tree>` § "Inherited from Phase 174 (executing)" and § "Inherited from Phase 174.1 (inserted, not started)"** are both complete on the tree: 29 commits touched `apps/` and `packages/` between the context's read point `ba8f0a948` and today (measured: `git log --oneline ba8f0a948..HEAD -- apps packages | wc -l`), all of Phase 174's plans 03–10 and Phase 174.1. `invitationFlow.whileHiddenFromVoters` exists (`tests/tests/fixtures/shared/invitationFlow.fixture.ts`).
- **Facts 3 and 6, the two items marked [docs]**, are now read in the tree: `entity_update_own_organizations` asks `'entity.edit_answers'` with `'organization'::public.entity_type`; the OrganizationEditor row of `grant_role_permissions` holds `'project.read_structure'`, `'entity.edit_answers'`, `'entity.read_answers'`, `'entity.invite_children'`, `'nomination.edit'`, `'nomination.read'`; and `user_can`'s "NAMED BRANCH 1, the project-read branch" is what lets an entity grantee read its project's structure.
- **D-10 "What moves"** misses one comment: `tests/database/22-content-policies.test.sql`'s header carries the same sentence as `schema/302-rls.sql` ("The settings permission is split along the line "does a policy read this value"…").
- **D-10** says pgTAP `15-visibility-flags.test.sql` "set[s] or assert[s] the column". Measured: it holds **four** assertions on it (the bare-insert default, `is_nullable`, the two-project fixture count, and `data_type || '|' || column_default` = `'boolean|false'`) and a header paragraph, "lock_nominations SHIPS INERT…", which has been false since file 23 began reading the column.
- **`.claude/skills/database/schema-reference.md`** lists `projects` without `open_for_voters` or `lock_nominations` already, so the skill has less to remove than O-6 implies; `rls-policy-map.md` names the helper and "own, unless locked" and stays true.

## The context's research questions, answered

### RQ-1 — does an organization editor's update of `name`, `short_name` and `color` pass on an unconfirmed row and fail on a confirmed one?

**At the database: yes for the cells that exist, by the green pgTAP estate; `color` by reading. Through the writer: not measured — a first-wave task.**

- *Read, and green in the closing run of Phase 174 (39 files, 1706 tests):* `tests/database/19-entity-immutability.test.sql` runs "cell 1 entity grantee, CONFIRMED row -> refused, naming the column", "cell 2 entity grantee, UNCONFIRMED row -> ALLOWED, and the new value is read back" and "cell 3 entity.edit_immutable holder, CONFIRMED row -> allowed" for `name` on `organizations`. `05-organization-admin.test.sql` and `09-column-restrictions.test.sql` each run an organization editor's `UPDATE organizations SET short_name = …` on `org_a` and expect it to succeed — on a **confirmed** row, which is today's behaviour and what D-08 ends.
- *Read:* `color` is in the organizations UPDATE grant (`schema/303-column-grants.sql`: `name, short_name, info, color, image, subtype, custom_data, answers, confirmed`), the row policy `entity_update_own_organizations` is column-blind, and no trigger names `color`. *Inferred:* a `color` update passes wherever a `short_name` update passes today.
- *Not measured:* the same through `SupabaseDataWriter` with a signed-in organization editor's session. `supabaseDataWriter.integration.test.ts` writes users, grants and rows into the default project, so it was not run. It gains the cases in plan 2 (D-12) and runs in the gate, after the schema plan has reset the database.
- *What the writer will see on refusal (read):* `enforce_entity_immutability` raises with no `ERRCODE`, so SQLSTATE `P0001`, and its text starts with the stable prefix `Entity name is immutable once confirmed: column `. The function's own header says "Each refusal starts with a stable prefix, so `throws_like` can match it". How PostgREST and supabase-js surface it (`error.code`, `error.message`) is *assumed* (A2) and is what the integration case pins.

### RQ-2 — what validates `question_categories.entity_type` and `questions.entity_type` today?

**Nothing. Measured.**

- `information_schema.columns`: `question_categories | entity_type | YES | jsonb` and `questions | entity_type | YES | jsonb`. (`nominations.entity_type` is `NO | USER-DEFINED` — the generated enum column, a different thing.)
- `pg_constraint` (`contype = 'c'`) holds no CHECK on either table.
- `pg_trigger` on `questions`: `cascade_question_delete_to_answers`, `cleanup_image_on_update`, `cleanup_storage_on_delete`, `enforce_external_id_immutability`, `set_updated_at`, `validate_question_choices_before_insert_or_update`, `validate_question_type_change_trigger`; on `question_categories`: `cleanup_image_on_update`, `cleanup_storage_on_delete`, `enforce_external_id_immutability`, `set_updated_at`. None reads `entity_type`.
- `schema/303-column-grants.sql` has no block for either table, so a project admin can already write any JSON there over PostgREST.
- Every stored value on the local stack at the time of the read was NULL (26 questions, 4 categories — a snapshot of whatever the E2E run had seeded).

**What a bad value does (read):** the filter is applied in the data model, not in SQL — `get_questions` returns `to_jsonb(q)` unfiltered by type, and `QuestionAndCategoryBase.appliesTo` calls `match({ filter: this.data.entityType, target: entityType })` (`packages/data/src/objects/questions/base/questionAndCategoryBase.ts`). `match` returns `true` for a null or empty filter and otherwise `target.some((t) => filter.includes(t))` (`packages/data/src/utils/filter.ts`). A misspelt member therefore matches no entity type and the question silently disappears for every contestant and from every voter-side list that passes a type. That is the failure the validation exists to refuse.

**Recommendation:** one validation function registered on both tables as a `BEFORE INSERT OR UPDATE` trigger, raising a message that names the table, the row and the offending member — the house style of `validate_question_choices` and of `enforce_entity_immutability` — so that it binds every writer (`bulk_import`, an admin's PostgREST write, the service role) and not `bulk_import` alone. Accept NULL, an empty array, and an array whose every member is one of `'candidate'`, `'organization'`, `'faction'`, `'alliance'` (the `entity_type` enum, `schema/000-enums.sql`); refuse a non-array, a non-string member, and an unknown member. A CHECK constraint would bind as widely but cannot name the member. See *Code Examples*.

### RQ-3 — how does a signed-in contestant of a closed project receive the full app settings in the browser?

**Through the root universal load, rerun at sign-in. Read end to end; the database half is pinned by pgTAP; no browser run asserts a stored `access.*` value on a closed project after sign-in.**

1. *Read:* `routes/+layout.ts` builds a client from the request's auth cookies and awaits `dataProvider.getAppSettings({ locale: lang })`; the result is `page.data.appSettingsData`.
2. *Read:* `_getAppSettings` reads `scopedFrom('app_settings').select('settings').maybeSingle()`. A readable row is parsed with `StoredSettingsSchema` and returned whole; only a caller who reads **zero** rows of a closed project falls to `contestant_app_public_config` and its three values.
3. *Read, and pinned by pgTAP:* the row is readable to an entity editor — `authenticated_select_app_settings` asks `user_can ('project', project_id, 'project.read_structure')`, which `user_can`'s named branch 1 grants to an entity grantee of that project. `tests/database/30-closed-project.test.sql` asserts "candidate_b, an entity editor, reads the app_settings of the closed project B (D-16: candidates work before a project opens)".
4. *Read in the installed SvelteKit 2.70.3:* sign-in is a form action answered with `redirect(303, …)` (`routes/contestant/login/+page.server.ts`), applied by `applyAction(result)`; `applyAction` runs `await _goto(result.location, { invalidateAll: true }, 0);` for a redirect result (`node_modules/@sveltejs/kit/src/runtime/client/client.js`). So every load reruns, the root one included, now under the signed-in session.
5. *Read:* the app context re-merges on a new payload — its effect comment: "Two payloads of one session may differ on purpose (an anonymous visitor and a signed-in user read different rows), and a member the earlier payload set and the later one omits has to read its shipped default again."

**What `access.nominationsLocked` needs to ride this path:** the key in the strict `access` object of `StoredSettingsSchema` (`packages/app-shared/src/data/schemas/storedSettings.schema.ts`: `contestantApp`, `voterApp`, `adminApp`, `underMaintenance`, `answersLocked` today), in the `access` type, and in the shipped defaults. Without the schema key a stored value is rejected by `z.strictObject` and the frontend reads `false` while the database enforces `true`. A data-provider unit case — a readable row carrying `access: { nominationsLocked: true }` comes back with it — closes that.

**Known limit, unchanged by this phase:** on the sign-in pages of a closed project an anonymous visitor reads the shipped default (`_getAppSettings`' own "Limitation" paragraph names `access.answersLocked`; `nominationsLocked` joins it). D-10 already rules that no anonymous screen needs it.

### RQ-4 — which pgTAP rows break?

**(a) Rows that update `short_name` as an entity user on a confirmed fixture row — four, read file by file.** `create_test_data ()` "confirms every project A entity" (file 19's header), so every `org_a` / `candidate_a` row is confirmed.

| File | Assertion (its description) | Session → row | After D-08 |
|---|---|---|---|
| `05-organization-admin.test.sql` | 'organization_admin can UPDATE short_name on own organization', and the read-back `is(...)` that follows it | `organization_a` → `org_a` | refused by the trigger |
| `09-column-restrictions.test.sql` | 'Organization admin can update short_name on own organization' | `organization_a` → `org_a` | refused |
| `09-column-restrictions.test.sql` | 'Candidate can still update a permitted column while holding no privilege on updated_at' (`short_name = '{"en":"Trigger Control"}'`), and the `updated_at` assertion that depends on it | `candidate_a` → `candidate_a` | refused |
| `20-storage-authority.test.sql` | 'table: an entity grantee UPDATEs its own candidates row (entity.edit_answers, affected rows = 1)' (`short_name = '{"en":"Tracer"}'`) | `candidate_a` → `candidate_a` | raises inside `tracer_affected_rows` |

All four are about the column grant or the entity-scope authority, not about `short_name`; each takes another granted, unfrozen column (`info` is `jsonb` on all four tables and in every grant list). Three more `short_name` writes are **unaffected** because row-level security removes the row before a `BEFORE UPDATE` trigger can fire: file 05's 'UPDATE on other org had no effect', file 20's deny half (`candidate_a` → `candidate_a2`, affected rows = 0) and file 20's `table_write_org` (`candidate_a` → `org_a`). `23-nominations-write.test.sql`'s 'WR-05' writes `nominations.short_name`, another table. *The list is a prediction from reading; the population is derived at run time — register the trigger, run the estate, and the red rows are the list.*

**(b) Rows that set or assert `projects.lock_nominations` — measured by search:**

| File | What it does | After D-10 |
|---|---|---|
| `23-nominations-write.test.sql` | Two lock pairs, each `UPDATE projects SET lock_nominations = true` then `= false`: section 3 on `entity_update_nominations` ('with the project nomination lock ON, the owning entity user affects zero rows' / 'with the lock OFF the same statement affects one row'), and G4 on `entity_insert_parent_nominations` ('G4-neg' / 'G4') | Each `UPDATE projects` becomes a write of `app_settings.settings` for `project_a`; both directions kept |
| `15-visibility-flags.test.sql` | Four assertions on the column (default by bare insert, `is_nullable`, fixture count, type and default) and the "SHIPS INERT" header | Removed or replaced (for instance `hasnt_column`); `plan (33)` moves |
| `09-column-restrictions.test.sql` | 'control: a project admin can still update a settings column of its own project' (`SET lock_nominations = true`) | Another granted column of `projects` (`open_for_voters`, `default_locale` or `name`) |
| `07-rpc-security.test.sql` | names `'project_nominations_locked'` in its `private` census | unchanged |
| `00-helpers.test.sql` | a comment: "`lock_nominations` is deliberately NOT named on either row…" | comment removed |

**A gap worth closing while file 23 is open (read):** `private.project_nominations_locked` has four call sites — `entity_insert_nominations`, `entity_insert_parent_nominations`, and the `USING` and `WITH CHECK` of `entity_update_nominations` — and file 23 pins the lock in both directions for the update and for the parent insert only. The entity's **own insert** under the lock has no pair. Phase 177 is the first phase to let a user make that insert; a third pair here costs two assertions.

**New rows the move needs (OD08-B2, B3):** the helper on a missing project (locked); on a project with no `app_settings` row (unlocked — the fixture gives both projects a row, `'{"theme":"light"}'` and `'{"theme":"dark"}'`, so the case needs a `DELETE` inside the transaction, as file 38 already does); on a row without the key; on `false`; on `true`; on the string `"true"` and on `1` (unlocked); and that a **project editor** can set the key and an entity user then cannot write a nomination (the authority half of B2 — file 22 already builds a project editor "for that reason").

### RQ-5 — where does the page get the project's default locale?

**It cannot get "the project's" from anything it has today (T-6). Recommended: the frontend's own default, `defaultLocale` exported by `lib/i18n/init.ts`, behind one small pure helper that Phase 179 imports.**

- *Read:* the display fallback is `getLocalized(value, locale, defaultLocale = 'en')` (`packages/app-shared/src/data/getLocalized.ts`) — "1. requested locale 2. default locale 3. first key holding a string 4. null". Tier 3 means a name stored in *any* locale is shown to every voter, so D-11's reason ("the default-locale entry is the one the display fallback always reaches") overstates what the fallback needs; D-11 stands as the ruling it is.
- *Read:* the adapters' fallback locale is the literal `'en'` in every production path, because nothing passes `defaultLocale` (T-6). The shipped static settings also mark `en` as `isDefault`, so the three sources agree **in the shipped configuration** and can diverge in a deployment that changes one of them.
- *Recommendation:* express D-11 as a pure function — `missingRequiredLocale(value: LocalizedString | null | undefined, requiredLocale: string): boolean`, true when the entry is absent or blank after trimming — placed where both the profile page and Phase 179's CI1 form can import it (for instance `lib/contestant/utils/`), and fed `defaultLocale` from `$lib/i18n`. A todo records that the adapters' fallback locale, the i18n default and `projects.default_locale` are three unconnected values.
- **A defect waiting in the fallback (read):** tier 1 is `if (typeof requested === 'string') return requested;` — an **empty string counts**. `Input`'s multilingual branch writes `(value as LocalizedString)[locale] = currentTarget.value`, so a visited-and-cleared locale is stored as `""`, and a voter in that locale is shown an empty name instead of the fallback. The writer must drop blank entries from `name` and `short_name` before the update (and store `null` for a short name with no entry left). See P-4.

### RQ-6 — answered in the context; the mechanism to copy

*Read:* `tests/tests/setup/shared/setupFromTemplate.ts` resolves `projectId = resolveE2eProjectId()` once and threads it through the admin client, `runPipeline({ ...template, projectId }, overrides)` and `new Writer({ projectId })`; a perm setup is a `setup(...)` that calls `setupFromTemplate('<name>', { extraTeardownPrefix: ['test-', 'e2e-perm-'] })`, registers its users and stores a session; its teardown calls `unregisterCandidate(email)` and `runTeardownAsserted(PREFIX, client)` and deletes the storage-state file. In `tests/playwright.config.ts` each link is a trio — `data-setup-<name>` (with `teardown:` and a `dependencies` entry naming the previous perm spec), `data-teardown-<name>` (`retries: 0`, with a stated reason), and the spec project (`fullyParallel: false`). The chain's tail is `voter-prefs-tracking`, then `admin-access`, and `perm-closed-project` is the terminal node whose dependencies are computed from every leaf.

### RQ-7 — the `ownership_invalid_mutation` warnings

**The todo was available** — filed at `.planning/todos/pending/2026-10-08-175-input-ownership-invalid-mutation-on-the-contestant-profile.md` and committed as `c030a0d4f` while this research ran; it did not exist when the research began. Its finding, as the investigating agent states it:

- **Cause.** `Input.svelte` declares `const mainInputs: Array<HTMLElement> = $state([]);`, passes it to `MultilingualTextPart`, `SelectMultiplePart` and `MultipleTextPart` as a plain prop, and each part fills it with `bind:this={mainInputs[…]}`. A dev build reports a child writing into a `$state` object it was not given with `bind:`. No value, nothing a page or a context owns, nothing observable; a production compile carries no trace. It began when commit `41bee4002` extracted the branches into `parts/`.
- **Reach.** One warning on mount per `text-multilingual`, `textarea-multilingual` and `select-multiple` input, one more per extra locale when translations are shown, one per bound field on unmount. `MultipleTextPart` makes the same write and is silent only because its index is a compound expression the compiler does not trace.
- **Recommended fix (the todo's option B).** Each part keeps its own element references and exports `focus()`; `Input` drops `mainInputs`, holds the rendered part with `bind:this` and calls `part?.focus()`. About 25 lines across `Input.svelte`, the three parts and their three `.type.ts` files. Option A (`$bindable` plus `bind:mainInputs`) is the smaller diff and also reaches zero.
- **When.** "Before the page rework and before any plan that adds a kind or a part to `Input` — as the first plan of Phase 175."
- **The guard is in the tree:** `lib/components/input/Input.focusReturn.svelte.test.ts`, 16 cases. Its focus-return group must stay green through the change; its three "logs one" expectations become zero, and the two multi-text kinds are added.

**What this research verified of it, and what it did not.** *Measured here:* the guard file runs green on the current tree (`yarn vitest run src/lib/components/input/Input.focusReturn.svelte.test.ts` in `apps/frontend`: 1 file, 16 tests passed) — so the reproduction half, one warning for each of the three kinds, is observed independently. *Read here:* the declaration and the three unbound hand-offs in `Input.svelte`. *Not re-run:* the removal half — the todo's variants A and B reaching zero were measured on scratch copies that no longer exist, and its own list of unchecked items stands ("`svelte-check` on the type of the bound part", "a `type` prop that changes while mounted", no browser run). The plan should treat option B as the recommended fix whose proof is the guard file turning from 1/1/1 to 0 on the real component, with `yarn workspace @openvaa/frontend check` green.

**Two adjacent facts from the todo that bind this phase's new fields (the todo marks both measured):**

1. `Input` runs `structuredClone(value)` at init, so a `$state` proxy of an object handed in as `value` throws `DataCloneError`. Today's callers pass plain objects because `userData.current` is a JSON round-trip clone. A staged name must reach the input the same way — through `userData.current`, never as a raw `$state` field.
2. `onChange` of the multilingual kinds emits `Input`'s live `$state` proxy. Staging it by reference would alias the store to the input's internal object. Stage a snapshot (`$state.snapshot(value)`), and normalize it (P-4) at the same point.

**A colour kind, in the todo's terms:** rendered inline in `Input.svelte` like `date` and `number`, it adds no warning; written as a new part that takes a shared array, it copies the pattern the fix removes.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Freezing `short_name` on confirmation | Database (trigger registrations) | — | The rule is a transition between two row states; the page's lock is presentation (D-05). |
| The nominations lock | Database (`private.project_nominations_locked`, read by four policy conjuncts) | Browser (the `nominationsLocked` accessor, read by 176 and 177) | One stored value; the database enforces it, the frontend only shows it. |
| Who may set the lock | Database (`admin_update_app_settings`, `project.edit_app_settings`) | — | Nothing is built; the comment above the policy is corrected (OD08-B2). |
| Validating `entity_type` on the two question tables | Database (a validation trigger) | Dev-seed (the template key gate stops denying it) | Binds every writer; the template gate is a convenience, not the control. |
| Which property may be written for which entity type | Browser/API adapter (`SupabaseDataWriter`, a closed map beside `ENTITY_TABLES`) | Database (the column grants) | The grant is one list per table for every `authenticated` caller and admits `subtype`, `info`, `custom_data`; the map is what keeps the app from sending them. |
| Name shape (drop blank locales, required locale) | Browser/API adapter (normalize in the writer) and page (the required check) | — | Nothing in the database validates the shape (T-2). |
| Question scope by entity type | Browser (the contestant context's rollup effect) | `@openvaa/data` (`appliesTo`) | `get_questions` does not filter by type; the model does. |
| "No questions for you" | Browser (questions layout, nav, home) | — | A fact about a loaded entity; must not render on the server or on first paint (P-9). |
| Colour contrast adjustment | Browser (`ensureColors`, on read) | — | D-04: the stored value is what the user chose. |
| Leaving out the `children` tab | Browser (a prop on `EntityDetails`) | — | The voter app's rendering must not change (D-16). |
| The entity's `confirmed` flag for the page | Frontend server (the user-level load → `page.data.entities`) | Browser (`ctx.selectedEntity`) | OD08-C7: no schema change; available on first paint. |

## Standard Stack

No package is added, removed or upgraded by this phase. Versions measured from `node_modules/*/package.json` on this host:

| Library | Installed | Role in this phase |
|---|---|---|
| `svelte` | 5.57.1 | runes components, the context class, the store |
| `@sveltejs/kit` | 2.70.3 | loads, `invalidateAll`, form actions |
| `zod` | 4.6.5 | `StoredSettingsSchema` (two keys added); a parse for the raw name and colour columns |
| `tailwindcss` / `daisyui` | 4.3.3 / 5.7.46 | styling of the new fields |
| `vitest` | 5.0.2 | unit and component tests |
| `@playwright/test` | 1.63.0 | E2E |
| `@axe-core/playwright` | 4.13.0 | the axe scans, through `tests/tests/utils/axeScan.ts` only |
| `supabase` (CLI) | 2.118.0 | `db reset`, `test db`, `db lint`, type generation |
| PostgreSQL | 17.6 (measured: `SELECT version()` on `127.0.0.1:54322`) | the schema |

**Alternatives considered:** none — every mechanism this phase needs has an in-tree instance (see *Don't Hand-Roll*). A colour-picker component library was not looked for: D-04 asks for one colour, the native `<input type="color">` produces `#rrggbb`, and the control's final form is the UI spec's.

**Installation:** none.

## Package Legitimacy Audit

Not applicable: the phase installs no external package. **Packages removed due to [SLOP] verdict:** none. **Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
                         ┌──────────────────────── sign-in (form action → redirect → invalidateAll) ───────────────────────┐
                         ▼                                                                                                  │
 root +layout.ts ── getAppSettings ──► page.data.appSettingsData ──► AppContext.appSettings ──► ContestantContext           │
   (cookie client)        │                                                │                     ├─ answersLocked           │
                          │ RLS: project.read_structure                    │                     ├─ nominationsLocked  NEW  │
                          ▼                                                │                     └─ hideIfMissingAnswers    │
                   app_settings.settings ◄── project editor / admin write  │                          [selected type]  NEW  │
                          │   #> '{access,nominationsLocked}'              │
                          ▼                                                │
       private.project_nominations_locked(project) ──► 4 policy conjuncts on nominations (unchanged callers)

 (protected) +layout.server.ts ── get_user_entities ──► page.data.entities ──► ctx.selectedEntity { type, id, confirmed, … }
                                                                                       │  (server + first paint)
 ENTITY/+layout.server.ts ── get_entity_user_data ──► toDataObject ──► entity { name: string, … }
                                  │  name/short_name jsonb (raw)  ─────────────────► + raw localized name  NEW
                                  └─ nominations ──► get_questions(elections) ──► DataRoot
                                                                                       │
 ContestantContext rollup effect: entity type = the loaded entity's type  NEW (was ENTITY_TYPE.Candidate)
        └─► infoQuestions / opinionQuestions / questionBlocks ──► profile, questions, nav, home

 profile page ── descriptor[selected type] ── name fields (locked ⇐ confirmed ∨ answersLocked ∨ unknown) ── colour ── logo
        │ onChange (snapshot, normalize)
        ▼
 userData store: staged { image, name, shortName, color | firstName, lastName }  ──► save()
        ├─ updateAnswers ──► upsert_answers RPC
        └─ updateEntityProperties ──► closed map [type → writable properties] ──► ONE UPDATE of changed columns only
                                              │                                        │
                                              │                              BEFORE UPDATE OF name, short_name, confirmed
                                              │                              enforce_entity_immutability('name','short_name')
                                              ▼                                        │ refused: "Entity name is immutable once confirmed: …"
                                   read-back of the written columns                    ▼
                                              │                              named, translated message + reload of the user-level list
                                              ▼
                              merge into the stored entity; refresh the list the nav and the lock read

 preview page ── reloadEntityData ── translateLocalizedEntity (+ ensureColors NEW) ── DataRoot ── EntityDetails (children tab omitted NEW)
```

### Recommended Project Structure

No new directory is required. New files, by convention:

```
apps/supabase/supabase/
├── schema/011-validation-functions.sql      # + the entity-type-list validation function
├── schema/103-questions.sql                 # + its two trigger registrations
├── schema/102-entities.sql                  # four registrations widened
├── schema/100-tenancy.sql, 301-, 302-, 303- # the lock move
├── schema/501-bulk-operations.sql           # the skip made table-aware
└── tests/database/                          # 19, 23, 15, 09, 05, 20 edited; a new file only if 23 grows past one subject
packages/app-shared/src/settings/            # access.nominationsLocked, entities.hideIfMissingAnswers.organization
packages/dev-seed/src/templates/e2e/perm/    # the new template (hand-authored; buildMinimal has no organization answers or type-scoped questions)
apps/frontend/src/lib/contestant/utils/      # the per-type descriptor and the required-locale helper (discretion)
tests/tests/setup/perm/                      # <name>.setup.ts + <name>.teardown.ts
tests/tests/specs/perm/ or specs/contestant/ # the organization-editing spec
```

### Pattern 1: the lock helper reads the setting, and keeps "missing project is locked"

**What:** only the body of `private.project_nominations_locked` changes; its signature, `STABLE SECURITY DEFINER`, `SET search_path = ''` and its four callers stay. `106-app-settings.sql` sorts before `301-auth-functions.sql`, so the table exists when the `LANGUAGE sql` body is validated.
**When to use:** D-10.
**Example:** under *Code Examples*. The two-level `COALESCE` is the whole of OD08-B3: the outer one fails closed on a project that does not exist, the inner one defaults open on a missing row or key.

### Pattern 2: a trigger's protection is two lists

**What:** in each of the four registrations in `schema/102-entities.sql`, `short_name` joins the `UPDATE OF` list **and** the `EXECUTE FUNCTION public.enforce_entity_immutability (…)` arguments. File 19 states why: a trigger "carrying an `UPDATE OF` list that omits the column it protects, does not error, it permits."
**Detail (read):** the body compares `(v_old_row ->> v_col) IS DISTINCT FROM (v_new_row ->> v_col)` over `to_jsonb(OLD)` / `to_jsonb(NEW)`. For a `jsonb` column `->>` yields the canonical JSONB text, so an update that restates an identical object passes whatever key order the client sent, and one that adds an empty-string locale does not.

### Pattern 3: carrying `entity_type` through `bulk_import` on two tables only

**What:** `_bulk_upsert_record` has one `skip_columns` array for every table — `'id', 'created_at', 'updated_at', 'project_id', 'entity_type'` — and `nominations.entity_type` is a generated column that must stay skipped. The skip becomes table-aware.
**The constraint that shapes it (read):** `packages/dev-seed/tests/assertKnownRowProps.test.ts`, 'DENIED ∪ EXCLUDED equals the RPC’s skip_columns array, in BOTH directions', parses the SQL with `/skip_columns\s+text\[\]\s*:=\s*ARRAY\[([\s\S]*?)\]/` and ends `expect([...denied].sort()).toEqual(['entity_type']);`. Keeping the array as it is and adding a carve-out in the loop keeps that parse meaningful:

```sql
-- Skip project_id (already added) and managed columns. entity_type is a generated column on nominations and a filter list on the two question tables, where it is carried.
IF item_key = ANY(skip_columns)
   AND NOT (item_key = 'entity_type' AND p_table_name IN ('question_categories', 'questions')) THEN
  CONTINUE;
END IF;
```

**What moves in dev-seed with it:** `DENIED_BY_TABLE` (`packages/dev-seed/src/template/permittedKeys.ts`) shrinks to `nominations: ['entity_type']`; 'denies entity_type on exactly the three tables that declare the column' becomes one table; the two DENY cases that loop the three tables become one; `tests/assertKnownRowProps.builtins.test.ts` restates the map; and the negative-control pair `tests/fixtures/negctl-questions-entity-type.ts` / `…-camel.ts` — "BYTE-FROZEN at this exact path" — stops being a control, because its denied key is now allowed. It is replaced by a pair that writes `entity_type` on a `nominations` row; the old files are deleted, not edited. `packages/dev-seed/README.md` says the key is denied on the question tables (O-6).

### Pattern 4: a context accessor is a private `$derived` with a prototype getter

**What:** `#nominationsLocked = $derived(!!this.#appSettings.access.nominationsLocked);` beside `#answersLocked`, a `get nominationsLocked()` beside `get answersLocked()`, and a member on `ContestantContext` in `contestantContext.type.ts`. It joins the reactive-accessor list in `CLAUDE.md` § *Context Destructuring Rule* and in `.claude/skills/components/context-reactivity.md` § 1b.
**Proof:** a case in `contestantContext.svelte.test.ts`, whose harness already supplies `appSettings: { access: { answersLocked: false } }`.

### Pattern 5: the lock on a name field reads page data, so it is right before the store loads

**What:** `ctx.selectedEntity` derives from `page.data.entities` and `page.params` — the context's own comment: "they need no push from a layout, are right on the server and on first paint". So the descriptor can be chosen by `ctx.selectedEntity?.type` and the lock computed as *locked unless the selected entity is known and unconfirmed and answers are not locked*, on the server too. That satisfies 173's first-paint rule more simply than today's store-derived `isOrganization`: a candidate's two inputs are in the server markup because the type is known there.
**The values** still come from the store (`userData.current`), which is empty on the server; a locked field may show `selectedEntity`'s localized name on first paint, an editable one needs the raw value.

### Pattern 6: one `UPDATE` of the changed columns, behind a closed map

**What:** beside `ENTITY_TABLES`, a map from served entity type to the properties the app may write — `organization: image, name, shortName, color`; `candidate: image, firstName, lastName` — each with its column. A property outside the target type's list throws by name before any request. `updateFields` holds only the properties present in `properties`; the store passes only staged ones. The read-back selects exactly the written columns and parses them (`parseImageColumn` exists; the name and colour need a small zod parse of their own, because `scripts/assert-adapter-casts.mjs` fails the triple cast `as Json as unknown as X` and four literal casts under the adapter directory).
**Return type:** the adapter's `// reason:` comment already says the declared `LocalizedCandidateData` "is wrong for BOTH branches"; the widening is the moment to return what was written (a partial of the editable properties) and drop the cast.

### Anti-Patterns to Avoid

- **Staging a name the user did not edit.** A confirmed row's unchanged name passes the trigger; a normalized-but-different one (a dropped blank locale, say) does not, and takes the image and the colour down with it in the same statement.
- **Reading `#>>` for the lock.** The text form treats the string `"true"` as locked (measured).
- **Deciding "no questions" from an empty list alone.** The list is empty on the server and before the store loads (P-9).
- **Handing `Input` a `$state` object as `value`.** `DataCloneError` at mount (RQ-7).
- **A `{#if type === 'organization'}` in a page.** D-02: the difference is data in the descriptor.
- **Appending the new scans to `contestant-a11y-scan` for states only the perm dataset can produce.** That project runs on `e2e/base` before the perm chain by a wiring the lint chain asserts (`scripts/assert-a11y-scan-wiring.mjs`, check 3).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Contrast adjustment of a colour | a new luminance routine | `ensureColors` (`lib/utils/color/ensureColors.ts`) | D-04 names it; the voter app already reads every entity through it (`UniversalDataProvider.ensureColors`). |
| A per-locale text field stack | a new component | `Input type="text-multilingual"` and `parts/MultilingualTextPart.svelte` | It renders one field per entry of `locales`, labels each, and carries `multilingual-toggle`. |
| A localized-string shape test in SQL | a new predicate | `public.is_localized_string (jsonb)` (`schema/011-validation-functions.sql`) and `private.localized_has_text (jsonb)` (`schema/506-invitation-rpcs.sql`) | Both exist; whether pgTAP covers each was not checked. |
| An axe scan | `new AxeBuilder(…)` in a spec | `assertAxeScan` from `tests/tests/utils/axeScan.ts` | The wiring gate's check 4 forbids a second gate; the shared one also carries the raw-i18n-key verdict and the animation settle. |
| Registering a user as an organization's editor and storing its session | a bespoke setup | `registerAndStoreSession` (`tests/tests/setup/shared/`) with `entityGrants`, over `forceRegisterUser` | It owns the login-form retry and the compensating rollback. |
| Seeding a dataset into the suite's project | direct inserts | `setupFromTemplate` + `runTeardownAsserted` | One project id threaded through three writers; an asserted teardown. |
| Setting an app setting in a spec | a raw update | `SupabaseAdminClient.updateAppSettings` (`merge_jsonb_column`) | Deep merge; the pattern of every perm spec. |
| Confirming an entity from a test | a new helper | the admin client's generic `update(table, id, { confirmed: true })`, as `invitationFlow.fixture.ts` uses | Service role; not bound by the trigger. |
| A pgTAP three-cell grid | ad-hoc assertions | file 19's grid and its `pg_temp.capture_refusal` | A deny without its paired allow passes against a trigger that refuses everything. |
| A phase gate runner | new scripting | copy `174-gates.sh`, `174-e2e.sh`, `174-verdict.mjs` | They select Node at or above the engines floor, refuse a dirty tree, read each status directly, and record the power state. |

**Key insight:** every surface this phase adds has a sibling one directory away that was built for candidates and already generalised by Phase 173; the work is widening lists and lifting guards, and the risk is in the guards nobody listed (T-3, T-4, T-7).

## Runtime State Inventory

The phase moves one piece of stored state (the lock) and widens two enforced lists, so the inventory applies.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `projects.lock_nominations` values. Nothing is deployed (project ruling 2026-10-04), and the local databases are rebuilt from the one migration by `yarn db:reset`. No stored value needs carrying: the column's only non-default writes are inside pgTAP transactions. | Code edit only; no data migration. |
| Stored data | Existing `short_name` values on confirmed rows stay as they are; the freeze binds future changes. Existing `entity_type` values on the two question tables are all NULL on the local stack (measured), which the new validation accepts. | None. |
| Live service config | None — the lock has no Admin-app screen and no hosted project exists. | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | None; no variable names the column or the setting. | None. |
| Build artifacts | `apps/supabase/supabase/migrations/00001_initial_schema.sql` (generated; `yarn schema:regenerate` in every schema commit — `yarn assert:schema-migration-parity` is link 13 of `lint:check`). `packages/supabase-types/src/database.ts` (three `lock_nominations` lines; `yarn db:types` **after** `db:reset` and **before** pgTAP — `174-gates.sh`: "the pgTAP suite's first file commits its helper functions into `public`, where they stay until the next reset; on a database where pgTAP has run since the last reset the regenerated file gains the helpers"). `packages/dev-seed/src/template/permittedKeys.ts` lists `'lock_nominations'` under a `satisfies … keyof TablesInsert<C>` clause, so it fails typecheck the moment the types are regenerated — same commit. Built `dist/` of `@openvaa/app-shared` and `@openvaa/dev-seed`, which the frontend and the harness import: `yarn build` before any dependent check. | Regenerate, rebuild; no manual state. |
| The running local database | The applied schema on `127.0.0.1:54322` is the old one until a reset. A second, unrelated Supabase stack runs on this host (project memory); a Docker restart would kill it. | `yarn db:reset` inside the gate, never during an E2E run. |

**The canonical question — after every file is updated, what still holds the old shape?** Only the applied local database and the turbo cache; both are cleared by the gate's own first rows.

## Common Pitfalls

### P-1: the page has no locale-keyed name to edit
**What goes wrong:** a `text-multilingual` input is handed `userData.current.entity.name`, a single locale's string; `Input`'s `ensureValue` turns it into `{ [currentLocale]: value }`, and saving that overwrites every other locale's entry.
**Why:** T-3 — the entity read localizes `name` and `short_name`.
**How to avoid:** plan 2 adds the raw localized pair to the entity user data, parsed, before plan 3 starts. **Warning sign:** a name field that shows a value but whose other locales are empty for a seeded organization with translations.

### P-2: three image-only guards between the store and the adapter
**What goes wrong:** a name-only save throws 'An image file is required for updating entity properties', or is never attempted, or reports 'Failed to update image'.
**Why:** T-4. **How to avoid:** lift all three with the widening; a store unit test saves a name with no image staged.

### P-3: `save()` is two requests, and the second can be refused after the first succeeded
**What goes wrong (read):** `save()` awaits `updateAnswers` and merges its result, then awaits `updateEntityProperties`; the resets run only after both. A property update the trigger refuses rejects `save()` with the answers already stored and still in the draft, and the page's `.catch` shows `contestantApp.error.saveFailed` for a save that half-succeeded.
**How to avoid:** the writer turns the trigger's refusal into a result the store can tell from a failure (matching the prefix `Entity name is immutable once confirmed: column `), the store drops the staged name properties and keeps going, and the page shows the named message and refreshes the list (P-7). A store unit test pins: answers saved, image and colour still attempted or reported, names discarded, the message key returned. Whether image and colour ride the same statement as a refused name is a design choice — the statement is atomic, so sending the name columns in their own statement after the others is the only way a refused name cannot cost the logo.

### P-4: an empty string is a value
**What goes wrong:** a locale the user visited and cleared is stored as `""`; `getLocalized` returns it for a voter in that locale instead of falling back; and on a confirmed row the same `""` makes an unchanged name read as changed.
**How to avoid:** normalize where the value is staged — trim, drop blank entries, `null` when none is left — and compare the normalized value with the saved one to decide whether the property is staged at all. Unit-test the normalizer; the required-locale helper of RQ-5 uses the same notion of blank.

### P-5: the colour column is replaced whole, and holds whatever was sent
**What goes wrong:** (a) the base organizations carry `{ normal, dark }`; a picked colour merged into that leaves the old `dark`, and `ensureColors` adjusts a present `dark` instead of deriving one. (b) *Read:* `ensureColors` returns `adjustContrast(normal, bg) ?? normal` — a string that does not parse is kept — and `lib/components/avatar/Avatar.svelte` writes ``styles += ` --bg-color: ${color.normal};` `` into an inline `style`. The column is in every entity editor's grant and nothing validates it (T-2), so a stored colour reaches a voter's `style` attribute unparsed. (c) a native colour input always has a value; "no colour chosen" is not one of them.
**How to avoid:** stage and write `{ normal: '#rrggbb' }` and nothing else; validate the hex in the writer; decide in the UI spec how a colour is cleared. For (b) see *Security Domain* and open question 3.

### P-6: a colour is painted only where there is no image
**What goes wrong:** the spec uploads a logo and then asserts the colour in the preview or the voter detail, and finds none. *Read:* `Avatar.svelte` sets `--bg-color` only in the branch where there is no usable image ("if we have an image, these are not needed").
**How to avoid:** assert the colour on an organization without an image and the logo on the other one — which the two-organization dataset allows without a third row.

### P-7: the list the menu and the lock read is not the entity the page saved
**What goes wrong:** after a name is saved the menu's entity title and the selection card still show the old name, and after an admin confirms the entity the fields still look editable. *Read:* `ContestantNav` builds its title from `contestantCtx.selectedEntity`; `selectedEntity` derives from `page.data.entities`; the user-level load reads the two entity params because "reading them makes it rerun whenever the selected entity changes", and reruns on nothing else.
**How to avoid:** after a save that changed a listed property (name, short name, image, colour), and after a refused name save, rerun the user-level load. The tree's precedent is `await invalidateAll()` in `lib/contestant/gates/TermsOfUseGate.svelte`. A narrower `depends` key is possible, but the load's tracking test (`routes/contestant/(protected)/layout.tracking.test.ts`) records which event members the load takes and would need the new member stated. The entity-level load reruns with its parent and re-inits the store; `userData.init` keeps the draft for the same entity.
**Warning sign:** an E2E step that reads the menu title after saving a name without a reload.

### P-8: `Input` and `$state` objects
See RQ-7's two adjacent facts: a proxy as `value` throws at mount; `onChange` emits a live proxy. Stage snapshots; read back through `userData.current`.

### P-9: "no questions" on the server and on first paint
**What goes wrong:** *Read:* `ENTITY/questions/+layout.svelte` renders its `{:else}` branch whenever `ctx.opinionQuestions.length` is zero, and the context fills its question lists from `$effect`s, which do not run on the server. So the server markup of every direct load of the questions pages is today's error page (`error.noQuestions`), replaced on hydration. Making that branch the neutral page without a "loaded" condition would show "there are no questions for you" for an instant to every user, and hide the nav item on first paint for every user.
**How to avoid:** one derived fact on the context — whether the entity and its question data are loaded — and three states in the layout: not loaded → `Loading`; loaded with none → the neutral page; loaded with some → the page. The nav item and the home button follow 173's rule: left out only for a *known* zero.
**Also (read):** `match` returns `true` for a null filter whatever the target, so a rollup run with no type scope returns every unscoped question. The effect must take the type from the loaded entity and produce empty lists while there is none — not fall back to `ENTITY_TYPE.Candidate` and not run unscoped.

### P-10: a test pins the hard-coded scope
T-7. The describe 'RUNES-05: entityType passed to getApplicableQuestions' asserts `Candidate` for every call; it is rewritten to assert the loaded entity's type for both types, and `questionRollup.ts`'s header sentence is corrected.

### P-11: the `entity_type` denial is defended on purpose
Pattern 3. Additionally (*inferred from the loop in `_bulk_upsert_record`*): a template that writes a bare string, `entity_type: 'organization'`, reaches the `jsonb_typeof(item_value) = 'string'` arm, is quoted as a text literal and fails the cast to `jsonb` with a JSON syntax error before any validation trigger runs. Templates write an array; the dev-seed row type should say so.

### P-12: four pgTAP assertions go red with the trigger, and six plan counts move
RQ-4. `plan (70)` in file 19, `plan (51)` in 23, `plan (33)` in 15, `plan (32)` in 09, `plan (21)` in 05 and `plan (47)` in 20 are explicit; a count left stale fails the file.

### P-13: three generated or coupled files must move in one commit with the schema
`yarn schema:regenerate` (parity gate), `yarn db:types` on a freshly reset database, and `permittedKeys.ts`'s `'lock_nominations'` entry (a `satisfies` clause over `TablesInsert`). Read the regenerated migration diff before committing — the database skill calls that out as an obligation no tool enforces.

### P-14: parallel plans share one working tree
`.planning/config.json` has `"parallelization": true` and `"use_worktrees": false`. Two plans of one wave therefore edit the same checkout. Known collision points in this phase: `yarn db:reset` in the schema plan against any plan that reads the database; the seven message catalogs (`apps/frontend/messages/<locale>/*.json`, 604 keys in each of the seven locales today, measured) if two plans add keys to the same file; `turbo` typechecks that cross a half-edited `permittedKeys.ts`.
**How to avoid:** give each wave-2 plan its own catalog files or put all new keys in one task; keep every database-dependent verification of plan 2 behind plan 1's summary; scope plan 2's checks to its own workspaces.

### P-15: in this phase an entity without a nomination is still signed out
*Read:* `ENTITY/+layout.server.ts`, stage 4 — "An entity nominated in no election or no constituency is signed out with `candidateNoNomination`." Phase 176 removes it. **Both** organizations of the dataset need a nomination to be usable at all. The read is of the entity's own nominations under `nomination.read`, confirmed or not (`authenticated_select_nominations`, third disjunct), so an unconfirmed organization with a nomination passes.
*Also read:* dev-seed stamps `confirmed = true` on entity and nomination rows that do not state it (`packages/dev-seed/src/supabaseAdminClient.ts`: `if (isConfirmable && !('confirmed' in stripped)) { stripped.confirmed = true; }`). So the unconfirmed organization states `confirmed: false` and its nomination may stay confirmed — voters still do not see it, because `anon_select_nominations` also asks `private.nomination_entities_confirmed (id)` — and it becomes public the moment the test confirms the organization. That is exactly the sequence D-19 wants.

### P-16: where the new axe scans can live
`contestant-a11y-scan` runs on `e2e/base`, before the perm chain, under sessions that are read-only for the run; `scripts/assert-a11y-scan-wiring.mjs` asserts that placement. The base dataset's organization editor is the multi-entity user of `data-setup-entity-selection`, whose organization (`test-e2e-base-or-sel`) is seeded `confirmed: false` — so base can show the **editable** profile state and the preview, read-only, but not the locked state, the colour of a confirmed organization, or the no-questions page. Those need the new dataset. See *Validation Architecture* for the split and for the scan count the verdict script holds.

### P-17: the agent shell's Node is below the engines floor
*Measured:* `node --version` in this session's shell is `v24.14.1`; `package.json` asks `"node": ">=24.15.0"`. `174-gates.sh` handles it — "Node: the pinned v24.21.0 when it is installed, else the newest version at or above 24.15 under nvm" — and refuses otherwise. The phase's drivers copy that block; an ad-hoc `yarn` call from an executor's shell should put `~/.nvm/versions/node/v24.21.0/bin` first on `PATH` (installed here, measured).

### P-18: a new teardown's prefix is checked at config load
*Read:* `tests/playwright.config.ts` enumerates the `*.teardown.ts` files, reads each `PREFIX = '…'` and throws on `a.prefix.startsWith(b.prefix) || b.prefix.startsWith(a.prefix)`. `e2e-perm-org-matching-` exists, so the new prefix must not be a prefix of it or the reverse (`e2e-perm-org-` would be refused; `e2e-perm-organization-editing-` would not). It should start with `e2e-perm-`, because every perm setup pre-clears `['test-', 'e2e-perm-']`.

## Code Examples

These are proposals shaped on the tree's own instances, not copies of existing code. Every literal in them is quoted from the tree above or is a new name this phase introduces.

### The lock helper's body (D-10, OD08-B3)

```sql
-- Source: the existing function in schema/301-auth-functions.sql, body replaced.
CREATE OR REPLACE FUNCTION private.project_nominations_locked (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT COALESCE(
        (SELECT s.settings #> '{access,nominationsLocked}' = 'true'::jsonb
           FROM public.app_settings s
          WHERE s.project_id = p.id),
        false
      )
      FROM public.projects p
      WHERE p.id = p_project_id
    ),
    true
  );
$$;
```

*Measured* (the same expression run as a query inside `BEGIN READ ONLY … ROLLBACK`): a project id that names no project → `t`; the three real projects, each with a settings row and no key → `f`, agreeing with their `lock_nominations = f`; over stand-in rows — key `true` → `t`, key `false` → `f`, a row without the key → `f`, a project with no row → `f`, no project → `t`. On the JSON shapes alone: `true` → locked; `false`, `"true"`, `1`, `null`, a missing key, a missing `access`, `access` as an array, `settings` as a scalar → unlocked.

### A registration, widened (D-08)

```sql
-- Source: schema/102-entities.sql, the organizations registration, with short_name in both lists.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
short_name,
confirmed ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name', 'short_name');
```

Candidates: `BEFORE UPDATE OF first_name, last_name, short_name, confirmed … ('first_name', 'last_name', 'short_name')`; factions and alliances as organizations. The refusal text says "Entity name is immutable once confirmed: column …short_name…" — the word "name" in the prefix is the function's, shared by every protected column, and the page's message keys on the prefix.

### Validating the type list (RQ-2)

```sql
-- Source: the shape of validate_question_choices and enforce_entity_immutability in schema/011-validation-functions.sql.
CREATE OR REPLACE FUNCTION public.validate_entity_type_list () RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_member jsonb;
BEGIN
  IF NEW.entity_type IS NULL THEN
    RETURN NEW;
  END IF;

  IF jsonb_typeof(NEW.entity_type) <> 'array' THEN
    RAISE EXCEPTION 'Invalid entity_type on %.% row %: expected null or a JSON array of entity types, got %',
      TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id, jsonb_typeof(NEW.entity_type);
  END IF;

  FOR v_member IN SELECT value FROM jsonb_array_elements(NEW.entity_type)
  LOOP
    IF jsonb_typeof(v_member) <> 'string'
       OR NOT ((v_member #>> '{}') = ANY (enum_range(NULL::public.entity_type)::text[])) THEN
      RAISE EXCEPTION 'Invalid entity_type member % on %.% row %: each member must be one of %',
        v_member, TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id, enum_range(NULL::public.entity_type);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;
```

Registered `BEFORE INSERT OR UPDATE OF entity_type` on `public.question_categories` and `public.questions`. The member list is read from the enum (`enum_range(NULL::public.entity_type)::text[]` measured as `{candidate,organization,faction,alliance}`), so it cannot drift from `schema/000-enums.sql`. It is a `public` plpgsql function, so `supabase db lint --schema public --fail-on warning` checks it.

### The lock rule and the required-locale rule as pure functions (D-05, D-09, D-11)

```ts
// A name field is editable only for an entity known to be unconfirmed, while answers are not locked.
export function isNameEditable(entity: Pick<UserEntity, 'confirmed'> | undefined, answersLocked: boolean): boolean {
  return entity !== undefined && !entity.confirmed && !answersLocked;
}

// True when the localized value has no usable entry for the locale.
export function missingRequiredLocale(value: LocalizedString | null | undefined, locale: string): boolean {
  const entry = value?.[locale];
  return typeof entry !== 'string' || entry.trim() === '';
}
```

Both are unit-testable without a component, and `profileComplete`'s name clause (D-14) is `isNameEditable(...) && missingRequiredLocale(rawName, defaultLocale)` for an organization.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stored settings replace shipped ones by root key | Member-by-member merge at every depth, lists and scalars replaced whole | Phase 171, `05a10320c` | T-1: one `access` key may be stored alone. |
| `get_user_data` for one candidate | `get_user_entities` (the list, with `confirmed`) and `get_entity_user_data(p_project_id, p_entity_type, p_entity_id)` | Phase 173 | The lock reads the list; the name reads the entity. |
| `candidateApp.*` / `candidate/` | `contestantApp.*` / `contestant/` | Phase 170 | Message keys and routes named in older todos are stale. |
| `tests/tests/utils/*.test.ts` run by hand | part of `yarn test:unit` (`test:unit:tests`) | quick task G4, `0633e4023`, 2026-10-08 | A new harness helper's unit test is gated. |
| `safeListUsers` | the strict lister | quick task G6, `e4bea9dad`, 2026-10-08 | New setups use the strict lookups only. |
| `Input` parts fill a shared `$state` array | each part owns its references and exports `focus()` (recommended, not yet applied) | this phase's first frontend task | RQ-7. |

**Deprecated/outdated:** the first half of todo `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md` (the shallow merge); the "SHIPS INERT" paragraph of pgTAP file 15.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Effects that fill the store and the context's question lists settle in one flush, so no frame is painted between "entity loaded" and "questions rolled up". | P-9 | The neutral page could flash for one frame after hydration; the loaded condition would need to include the rollup having run. A component test of the layout settles it. |
| A2 | PostgREST returns the trigger's refusal as an error whose `code` is `P0001` and whose `message` is the raised text, and supabase-js passes both through. | RQ-1, P-3 | The writer's match needs another field; the integration case shows which. |
| A3 | A native `<input type="color">` with a visible label, paired with a text alternative, meets WCAG 2.1 AA and passes axe in both themes. | Standard Stack | The control changes in the UI spec; the scan is the proof either way. |
| A4 | `invalidateAll()` after a save reruns the entity-level load without remounting the page or losing an unsaved draft. | P-7 | The refresh needs a narrower key; a component or E2E step shows it. |
| A5 | `get_questions`' `to_jsonb(q)` carries `entity_type` through `toDataObject` to `entityType` on the question data unchanged (the column map has `entity_type: 'entityType'`; the question mapping spreads `...obj`). | RQ-2 | A type-scoped question would not be scoped in the app; the context unit test and the E2E's type-scoped question both catch it. |
| A6 | The four pgTAP rows of RQ-4 (a) are the whole population. | RQ-4 | More rows go red; the run names them. |
| A7 | The todo's variants A and B reach zero warnings on the real component as they did on scratch copies. | RQ-7 | The guard file stays at 1/1/1 and the fix needs another shape; the file is the check. |

## Open Questions (RESOLVED)

Every question below was closed before planning finished: by an orchestrator ruling, by the UI contract, or by a plan. Each carries its disposition.

1. **Which "default locale" D-11 means.** Known: three unconnected sources (T-6); in the shipped configuration all are `en`. Unclear: which one the operator means by "the project's". Recommendation: `defaultLocale` from `$lib/i18n`, behind one helper, with a todo for the divergence. This is a reading of a locked decision, so the plan should state it for the operator to see. **RESOLVED:** `defaultLocale` from `$lib/i18n`, behind the one helper `requiredNameLocale` (orchestrator ruling 4; plan 175-04, ruling 5). The todo for the three unconnected sources is filed by plan 175-13.
2. **Whether anything in the database should validate the shape of `name`, `short_name` and `color`.** Known: nothing does (T-2), the columns have been writable by entity editors through PostgREST since before this phase, and this phase gives two of them and the colour a user interface. Unclear: whether a shape check belongs in this phase. Recommendation: validate in the writer now (it is the app's own path), and file a todo for a database-side check on the four entity tables, since a CHECK added here would also bind seeds and imports whose values nobody has surveyed. **RESOLVED:** The colour is validated in the database in this phase — `validate_entity_color` on the four entity tables, with pgTAP cases — and in the writer (orchestrator ruling 3; plan 175-03, ruling 4; plan 175-07). `name` and `short_name` get no database shape check here; the todo is filed by plan 175-13.
3. **Whether `ensureColors` should stop passing an unparsable colour through.** Known: P-5 (b) — a stored colour reaches a `style` attribute unparsed, in the voter app, today. The context routes one more read through the util and does not ask for its behaviour to change. Recommendation: change it in plan 2 (an unparsable value becomes `''`, which `Avatar` already treats as "no colour") with a unit test file for the util — none exists under `lib/utils/color/` — or, if the planner holds the phase to its listed scope, file it as a security todo by name. **RESOLVED:** Changed in this phase: `ensureColors` returns a parsed, contrast-adjusted colour or nothing, with red-first unit cases that include the injection shapes, and every read path of a stored entity colour is routed through it (plan 175-08, Task 3; plan 175-11 for the preview).
4. **How a colour is cleared, and what an organization with no stored colour shows in the picker.** For the UI spec. **RESOLVED:** Answered by the UI contract: `175-UI-SPEC.md` § *S3* — the colour kind, how it is cleared, and what an empty value shows. Built by plan 175-06.
5. **Whether a candidate's first and last name are required while editable.** Known: the columns are `text NOT NULL`, which admits `''`; `create_invitations` will not confirm a candidate whose names are blank. D-11 speaks of the organization's name only. Recommendation: required and non-blank while editable, by the same badge; state it in the plan. **RESOLVED:** Required and non-blank while editable, as recommended: UI contract item U-05, held as one value per identity field in the descriptor and isolated with a written fallback (plan 175-04, ruling 2).
6. **Who meets the neutral no-questions page in the dataset.** Two organizations of one project and one election cannot differ in their question scope by type. Recommendation: the dataset serves both types and holds one candidate with an editor, seeded unconfirmed; every opinion question is addressed to organizations, so the candidate has none (the neutral page, the absent nav item, and "not asked the organization's questions" in one identity), and one info question is addressed to candidates, so each organization's profile shows the absence of it. Unconfirmed, because a voter-visible candidate with no applicable opinion question is a matching case the tree does not exercise (see the dataset section). **RESOLVED:** As recommended: the dataset holds one unconfirmed candidate with an editor — UI contract item U-30, isolated with a written fallback (plan 175-05, ruling 2).
7. **The E2E baseline.** Phase 174.1 closed at 220 of 220; quick tasks G2, G4 and G6 were closing on a full run while this research ran. The plan takes its "before" count from that run's record, not from this file. **RESOLVED:** The baseline is the run `tests/e2e-runs/261008-quick-g2-g4-g6`, whose head is the commit fixed in the committed file `175-BASE`; plan 175-01, step 0 reads both and every later verdict compares with them.
8. **No `175-UI-SPEC.md` exists** (the phase directory held only `175-CONTEXT.md`). The roadmap gives the phase a UI hint, and D-04, D-05's locked-name sentence, D-13's neutral page and the colour control all defer to it. Plans 3 and 4 need it; plans 1 and 2 do not. **RESOLVED:** `175-UI-SPEC.md` exists, written and revised after its check, and every plan that builds a surface reads it as its contract.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node at or above 24.15 | every `yarn` gate | ✓ under nvm; ✗ as the shell default | default `v24.14.1`; `v24.21.0` installed | the drivers' own Node selection (P-17) |
| Yarn | workspaces | ✓ | 4.18.1 | — |
| Docker | the local Supabase stack | ✓ | server 29.7.2 | — |
| Local Supabase (Postgres on `127.0.0.1:54322`) | pgTAP, `db:types`, `db:lint:sql`, the writer integration test, E2E | ✓ running, in use by another agent's E2E run during this research | PostgreSQL 17.6; CLI 2.118.0 | — |
| `psql` | read-only measurements | ✓ | 17.6 (Homebrew) | — |
| Playwright browsers | E2E | not probed (an E2E run was in flight, so they are present) | `@playwright/test` 1.63.0 | — |
| Disk | E2E runs | ✓ | 213 GiB free on `/` | project memory: on `ENOSPC`, `docker builder prune -af` before any restart |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** the shell-default Node (use the pinned one).

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json`, so the section applies.

### Test Framework

| Property | Value |
|----------|-------|
| Unit and component | vitest 5.0.2, one config per workspace; `yarn test:unit` = `yarn assert:unit-coverage && turbo run test:unit && yarn test:unit:tests` |
| Database | pgTAP through `yarn workspace @openvaa/supabase test:db`; 39 files, 1706 tests at Phase 174's close |
| SQL lint | `yarn db:lint:sql` — the **applied** database, `public` schema, plus two advisors |
| E2E | Playwright 1.63.0, `tests/playwright.config.ts`; one run through `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` |
| Quick run (one file) | `cd apps/frontend && yarn vitest run <path>` · `yarn workspace @openvaa/dev-seed vitest run <path>` |
| Full suite | the phase's gate driver, then the E2E driver (below) |

### Phase Requirements → Test Map

| Criterion / decision | Behaviour | Test type | Where | Exists? |
|---|---|---|---|---|
| C4, D-08 | `short_name` frozen on a confirmed row, allowed on an unconfirmed one, correctable with `entity.edit_immutable`, on four tables | pgTAP | `19-entity-immutability.test.sql`, three cells × four tables | file exists; cells new |
| C4, D-08 | the four displaced grant assertions still prove their own subject | pgTAP | files 05, 09, 20 (RQ-4 a) | edit |
| D-10 | the lock binds the entity user in both directions, read from the setting; admin unaffected | pgTAP | `23-nominations-write.test.sql`, both pairs re-pointed; a third pair for the own insert | edit + new |
| D-10, OD08-B3 | missing project locked; missing row, missing key, `false`, `"true"`, `1` unlocked | pgTAP | file 23 or a new file | new |
| D-10, OD08-B2 | a project editor can set the key | pgTAP | beside file 22's editor cells | new |
| D-10 | the column is gone | pgTAP + types | file 15 (`hasnt_column`), `types-clean` gate row | edit |
| D-18, RQ-2 | `bulk_import` carries `entity_type` on the two tables and not on nominations; an invalid member is refused by name | pgTAP | a `bulk_import` file (derive which at planning) + the validation trigger's cells | new |
| D-18 | dev-seed permits the key on the two tables, denies it on nominations, and the denied set still equals what the SQL skips | vitest | `packages/dev-seed/tests/assertKnownRowProps.test.ts`, `…builtins.test.ts`, `template/permittedKeys.test.ts`, new negative-control fixtures | edit |
| D-10 | `nominationsLocked` follows `appSettings.access.nominationsLocked` | vitest | `contestantContext.svelte.test.ts` | new case |
| D-10, RQ-3 | the stored key survives the schema parse and the provider read | vitest | `storedSettings.schema.test.ts`; the Supabase data provider's unit file | new cases |
| C2 | the question scope follows the loaded entity's type, for both types | vitest | `contestantContext.svelte.test.ts` (rewritten describe), `questionRollup.test.ts` | edit |
| D-14 | `profileComplete` with and without the name clause | vitest | `contestantContext.svelte.test.ts` | new |
| D-15 | the `organization` key in the schema and the type; the reads take the selected type | vitest + typecheck | `storedSettings.schema.test.ts`; `svelte-check` | new |
| D-15, T-8 | if the voter filter gains the organization arm: an organization lacking an opinion answer is hidden when its key is on, shown when off | vitest | beside `nominationAndQuestionState.svelte.ts` | new, if built |
| D-12 | staging, changed-only sends, the closed map, the refused name | vitest | `contestantUserDataState.svelte.test.ts`, `supabaseDataWriter.test.ts` | new cases |
| RQ-1, D-12 | an organization editor saves name, short name and colour on an unconfirmed row; a confirmed row's name is refused with the trigger's message | integration (needs the stack) | `supabaseDataWriter.integration.test.ts`, run with `CONTESTANT_WRITER_INTEGRATION_REQUIRED=1` | file exists; cases new |
| D-05, D-09, D-11 | the lock rule, the required-locale rule, the name normalizer | vitest | new files beside the helpers | ❌ Wave 0 |
| D-04 | `ensureColors` derives `dark`, adjusts contrast, and what it does with an unparsable value | vitest | `lib/utils/color/ensureColors.test.ts` | ❌ Wave 0 (no test exists under `lib/utils/color/`) |
| D-16 | `EntityDetails` without the `children` tab when told so; unchanged otherwise | vitest component | beside `EntityDetails.svelte` | ❌ Wave 0 |
| D-13 | the questions layout's three states; the nav item and home button for a known zero only | vitest component | beside the layout | ❌ Wave 0 |
| RQ-7 | focus return intact; zero ownership warnings for every kind | vitest | `Input.focusReturn.svelte.test.ts` | exists; expectations change |
| C1, C2, C3, C4, D-19 | the two-organization journey | E2E | the new spec | ❌ new |
| D-20 | axe, both themes, every new or changed state | E2E | split below | ❌ new |
| C5 | the candidate journey unchanged | E2E | `contestant-journey`, `perm-answers-locked`, `contestant-a11y-scan`, `contestant-entity-selection` in the full run | exists |
| D-17 | every new key in seven locales | lint | `yarn assert:i18n-catalog-namespaces`; the `TranslationKey` type under `svelte-check`; a key-count comparison (604 per locale today) | exists |

### The dataset (OD08-C8) and the spec (OD08-C4)

One hand-authored template, registered in `BUILT_IN_TEMPLATES`, on the suite's one project, with its own setup and teardown trio in the perm chain:

- **Settings:** `MINIMAL_BASE_APP_SETTINGS` with the whole `contestantApp` root restated — `entityTypes: ['candidate', 'organization']` is a list and is replaced whole — and `entities.hideIfMissingAnswers` stating both keys.
- **Rows:** one election, one constituency; organization A, confirmed (the seed default), with a confirmed nomination and a multi-locale name; organization B, `confirmed: false`, with a nomination; one candidate, `confirmed: false`, with a nomination (open question 6); an info category and an opinion category; opinion questions with `entity_type: ['organization']`; one info question for organizations and one for candidates. The unconfirmed candidate is hidden from voters, so the voter's results hold organizations alone; it meets the neutral page; and its two name inputs are **editable**, so this is where a spec can edit and save a candidate's name — D-07's rule in its editable direction. (The base dataset's two unconfirmed selection candidates show the same state, T-9, but their session is read-only for the run.)
- **Identities:** three single-entity users — the editor of A, of B, and of the candidate — each through `registerAndStoreSession` with `entityGrants`, each with its own storage-state file, so that sign-in lands on the entity's pages and not on the selection screen. The teardown unregisters all three and deletes the three files; its `PREFIX` constant is what the config's overlap guard reads (P-18).
- **Position in the chain:** after the last settings permutation and before `admin-access` and the terminal `perm-closed-project`, or anywhere a setup's `dependencies` names the previous perm spec. It must not be a dependency of `contestant-a11y-scan`.

The spec, in three `describe`s, each with `test.use({ storageState })` and `fullyParallel: false`:

1. **Organization A (confirmed).** Lands on its home; the profile shows name and short name locked, in every locale when expanded, with the locked-name sentence; picks a colour; answers an info question and an opinion question, with the progress the candidate journey asserts; reloads and finds them; opens the preview and finds its own info and opinions, no `children` tab, and the colour; then, as an anonymous voter, opens A's detail and finds the info answer, the opinion answer and the colour. A has no image, so the colour is painted (P-6).
2. **Organization B (unconfirmed).** The profile shows the two fields editable; leaves the required locale empty and is told so; fills name and short name in two locales, uploads a logo, saves; reloads and finds them; finds them in the preview and in the menu's title (P-7); an anonymous voter does **not** find B. The test confirms B through the admin client (`update('organizations', id, { confirmed: true })`), the user reloads and finds the fields locked, and the anonymous voter finds B under the saved name with its logo. A last step may hold the refusal: with the page open and a name edited, confirm B, press Save, and assert the named message — the only place a browser shows D-05's constraint.
3. **The candidate (unconfirmed).** No questions entry in the menu, no questions button on home, the neutral page on the questions URL, no organization-only info question on its profile, no colour field, and first and last name editable: the spec changes one, saves, reloads and finds it.

Reaching the voter's view of one organization goes through the results: the voter `/nominations` page is no shortcut, because it lists `ctx.dataRoot.candidateNominations` alone and renders its cards with `action: false` (read: `routes/(voters)/nominations/+page.svelte`). The perm specs' `minimalVoterResultsPage` fixture (`tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts`) "serves the MINIMAL (single-election + single-constituency) `buildMinimal` perm datasets" and lands on the results, whose `organization` section holds the card that opens the detail; `MINIMAL_BASE_APP_SETTINGS` has `results.sections: ['candidate', 'organization']` and `matching.minimumAnswers: 1`. The voter is asked the organization-only questions too: the voter context calls `rollUpQuestionCategories({ dataRoot: dr, elections, constituencies, questionFilter: … })` with no `entityType` (read: `lib/contexts/voter/voterContext.svelte.ts`), and the rollup's header says "the voter app passes no scope at all" — so a dataset whose opinion questions are all addressed to organizations still gives the voter questions to answer. Whether the fixture works unchanged on a hand-authored template was not run; the planner reads it before fixing the dataset (project memory: plan specs, seeds and fixtures before building). Matching, unlike asking, is scoped per type: `nominationAndQuestionState.svelte.ts` takes `election.getQuestions({ constituency, entityType, type: QUESTION_CATEGORY_TYPE.Opinion })` for each entity type that has nominations. A voter-visible candidate with no applicable opinion question would therefore be matched on an empty question set, which nothing in the tree exercises today. Seeding the dataset's candidate `confirmed: false` avoids the case — a type with no visible nomination has no leaf at all ("If there are no nominations for this entityType, we leave the whole leaf undefined") — and has a second use, below.

### Where the axe scans live (D-20)

| State | Where | Why there |
|---|---|---|
| Organization profile, names **editable**, translations collapsed and expanded | the new spec, under B's session | the base organization would also do, but one place is simpler and B's state is certain |
| Organization profile, names **locked**, with the colour field | the new spec, under A's session | only this dataset has a confirmed organization with an editor |
| Organization preview | the new spec, under A's session | the colour is shown |
| The neutral no-questions page | the new spec, under the candidate's session | only this dataset has an entity with none |

Each in both themes, each through `assertAxeScan` with a reach marker only an organization's surface renders, in a project that is **not** `contestant-a11y-scan`: that project's place in the schedule is asserted by `scripts/assert-a11y-scan-wiring.mjs` and is before the perm chain. Consequences to state in the plan: the wiring gate's check 4 covers two named spec files, so a third file that scans must be added to what it reads, or it can build its own `AxeBuilder` unseen; the phase verdict's `contestant-a11y-scan` count (22 scans today — eleven surfaces, two themes) does not move, and the new project's scan count is a new expectation; `contestant-a11y.spec.ts`'s own table of unscanned surfaces ("an organization's pages, and the open menu over them") is corrected to point at the new spec.

### Sampling Rate

- **Per task commit:** the touched file's own test (`vitest run <path>`), plus `yarn workspace @openvaa/frontend check` for a `.svelte` change.
- **Per schema commit:** `yarn schema:regenerate` and `yarn assert:schema-migration-parity`.
- **Per wave:** the gate driver's rows in this order — `typecheck`, `lint`, `db-reset`, `types-regen`, `types-clean`, `pgtap`, `sql-lint`, `unit`, `check-frontend`, `build`, `format`, `docs-links`, `name-gate-self-test`, `auth-config`, `stack` (the fifteen of `174-gates.sh`) — plus a row for the writer integration test after `db-reset`.
- **Phase gate (D-22):** the gate set green on the closing tree; one full default E2E run through the wrapper, read as passed / failed / flaky / skipped / did not run, with the power log beside it (exit 8 and `VOID-host-suspend.txt` mean void, never red or green); the new spec three times in isolation (`tests/scripts/determinism-batch.sh` reports a void batch with exit 6); `yarn db:seed:default` restored after the last reset.

### Wave 0 Gaps

- [ ] `lib/utils/color/ensureColors.test.ts` — none exists for any file in that directory.
- [ ] Unit files for the lock rule, the required-locale rule and the name normalizer.
- [ ] A component test for `EntityDetails`' omitted tab and for the questions layout's three states.
- [ ] The rewritten question-scope describe in `contestantContext.svelte.test.ts`.
- [ ] Replacement negative-control fixtures for dev-seed's deny list.
- [ ] `175-gates.sh`, `175-e2e.sh`, `175-verdict.mjs` in the phase directory, copied from Phase 174's.
- [ ] No framework install is needed.

## Proposed plans and waves

The context locks five plans in three waves and lets a plan be split. The proposal keeps the wave order and splits two plans, for the reasons given.

| Wave | Plan | Content | Why here |
|---|---|---|---|
| 1 | **175-01 Schema** — serial inside itself | (a) the lock: column, grant and comments out; helper body; file 23's two pairs re-pointed and the own-insert pair added; the lock-source and project-editor cells; files 15 and 09. (b) `short_name`: four registrations; file 19's twelve cells; the four displaced rows. (c) `entity_type`: the table-aware skip; the validation function and its two registrations; pgTAP; dev-seed's map, tests and fixtures. Then one closing task: `db:reset` → `db:types` → `permittedKeys.ts` → pgTAP → `db:lint:sql`, the skill and README corrections. | Three independent changes over one generated migration and one generated types file; two agents regenerating either in one checkout corrupt it (P-13, P-14). Each sub-change is red-first on its pgTAP rows and commits its own regeneration, because the parity gate fails any commit where the two copies differ. If the planner splits it, the halves are **consecutive**, never parallel: (a)+(b) is pure SQL; (c) reaches into dev-seed and is the natural second plan. |
| 1 | **175-02 Context and state** | First task: the `Input` parts repair (RQ-7), closing on the guard file at zero. Then: the two settings keys in app-shared (type, schema, defaults) and the five reads, with the voter filter's organization arm or the recorded limit (T-8); `nominationsLocked`; the question scope by the loaded entity's type and the "loaded" fact; the raw localized name on the entity read; `EditableEntityProps`, the closed map, changed-only sends, the three lifted guards, the read-back parse and the return type; the store's staged properties, their reset under `answersLocked`, the refused-name path; `profileComplete`'s name clause; the pure helpers. | Independent of the schema for everything unit-level. Its **integration cases** need plan 1's database, so they are written here and run in the wave gate, after plan 1's summary exists. The widened `page.params` annotation goes while the file is open (discretion). |
| 2 | **175-03 Profile page** | The descriptor; name fields with the lock from `selectedEntity`; the candidate's two inputs on the same rule; the colour field; the logo label; the required-locale badge; the refused-save message and the list refresh; the copy this page owns, in seven locales. | Needs plan 2's raw name, staging and helpers, and the UI spec. |
| 2 | **175-04 Questions empty state and preview** | The layout's three states; the nav item and the home button; the neutral page; `EntityDetails`' omitted tab; `ensureColors` on the preview read; the copy these surfaces own. | Needs plan 2's "loaded" fact and the UI spec. Disjoint from plan 3 in files **if** the catalogs are divided: each plan adds keys only to files the other does not touch, or one of them owns all new keys (P-14). |
| 3 | **175-05 Dataset, spec and scans** | The template and its registration; the setup and teardown trio; page-object fixtures first; the spec; the axe entries; the wiring gate's third file. | Runs once against the finished surfaces. |
| 3 (after 05) | **175-06 Close** | Docs (`apps/docs` settings and contestant-app pages, `apps/supabase/README.md`, `packages/dev-seed/README.md`), the two skills' re-check lists, the todos to file (native-speaker review; "a project editor can lock and unlock nominations"; the three default locales; the database-side shape check; the stale half of the shallow-merge todo) and to close (`2026-03-28-generalize-candidate-app-to-party-app.md`, the G7 todo, the widened-annotation todo), the gate set, the full run and the three isolated runs. | A closing gate inside the spec plan makes that plan unverifiable as one unit; the context itself notes plan 1 "now carries three independent schema changes", and the same holds at the other end. |

**What must be sequenced, in one line each:** the lock's schema move before its pgTAP re-pointing can go green, and both before `db:types`; `db:types` only on a freshly reset database and before pgTAP runs on it; `permittedKeys.ts` in the same commit as the regenerated types; the settings schema keys before any template that states them; the raw name on the entity read before the name fields; the `Input` repair before any new use of a multilingual kind; the UI spec before plans 3 and 4; the dataset's `entity_type` rows after plan 1's skip is lifted; the writer integration cases after the database is reset to the new schema.

## Security Domain

`security_enforcement` is not set in `.planning/config.json`, so it applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | unchanged; the E2E identities are made through the admin client |
| V3 Session Management | no | unchanged |
| V4 Access Control | yes | row-level security and column grants (unchanged); the trigger registrations (widened); the lock helper (re-sourced); the writer's closed property map (new) |
| V5 Input Validation | yes | the `entity_type` validation trigger (new); name normalization and a hex check in the writer (new); `StoredSettingsSchema` (two keys) |
| V6 Cryptography | no | — |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| A confirmed entity changes its `short_name` through a direct API call | Tampering | D-08's registrations, both lists; file 19's three cells per table |
| A locked project's nominations are written through a direct API call after the move | Tampering | the helper stays the policies' conjunct; file 23 in both directions; the own-insert pair |
| The lock reads as unlocked because the stored value has the wrong JSON type, or as locked for the string `"true"` | Tampering / Denial of service | JSONB equality with `'true'::jsonb`; the lock-source cells |
| The screen says unlocked while the database is locked, because the schema lacks the key | Spoofing (of state) | the key in `StoredSettingsSchema`; the provider unit case |
| A project editor locks or unlocks nominations | Elevation of privilege, accepted | OD08-B2 (a): intended; the comment in `schema/302-rls.sql` and in file 22 corrected; a todo records it for the Admin-app work |
| The page sends `subtype`, `info` or `custom_data`, which the grant admits | Tampering | the closed map throws by name before any request (D-12's *If wrong*) |
| A misspelt `entity_type` member hides a question from everyone | Denial of service | the validation trigger, on every writer |
| A stored colour that is not a colour reaches a voter's `style` attribute | Tampering (CSS injection) | **pre-existing and not created by this phase**: `color` is in every entity editor's grant, nothing validates it, `ensureColors` keeps an unparsable value and `Avatar.svelte` interpolates it. The app's own path is closed by the writer's hex check; the direct-API path by `ensureColors` dropping what it cannot parse (open question 3) or by a database check (open question 2) |
| A stored `name` that is not a localized string | Tampering | `getLocalized` already degrades a scalar, an array and non-string members to `null` (read); the writer normalizes what the app sends; the database check is open question 2 |
| A refusal message shown to the user leaks the row id | Information disclosure | the page shows its own translated sentence, keyed on the prefix, never the raised text |

**Outside this phase, seen while reading it:** `_bulk_upsert_record` appends each item key to the column list unquoted (`col_names := array_append(col_names, item_key)`) and executes the assembled statement. `bulk_import` is `SECURITY INVOKER`, so a caller reaches only what its own grants allow; whether a crafted key can do more than fail was not examined. It is named here because D-18 asks that the import carry nothing blindly, and is not this phase's to change.

## Sources

### Primary (HIGH confidence) — the tree at `c030a0d4f`, opened in this session

- Schema: `schema/000-enums.sql`, `011-validation-functions.sql`, `100-tenancy.sql`, `102-entities.sql`, `103-questions.sql`, `106-app-settings.sql`, `301-auth-functions.sql`, `302-rls.sql`, `303-column-grants.sql`, `501-bulk-operations.sql`, `503-entity-rpcs.sql`, `505-question-rpcs.sql`, `506-invitation-rpcs.sql`.
- pgTAP: files 00, 05, 09, 15, 19, 20, 22, 23, 30, 38.
- The local database, read-only: `pg_trigger`, `pg_constraint`, `information_schema.columns`, `pg_proc`, and the proposed expressions.
- Frontend: the contestant context and its type and tests, the user-data store, `supabaseDataWriter.ts`, `universalDataWriter.ts`, `dataWriter.type.ts`, `supabaseDataProvider.ts`, `universalDataProvider.ts`, `toDataObject.ts`, `settings.ts`, `appContext.svelte.ts`, `questionRollup.ts`, the root and protected loads, the four `ENTITY/` pages and layouts, `Input.svelte` and its parts, `EntityDetails.svelte`, `Avatar.svelte`, `ContestantNav.svelte`, `ensureColors.ts`, `adjustContrast.ts`, `i18n/init.ts`.
- Packages: `app-shared` settings, schema and `getLocalized.ts`; `data`'s `filter.ts`, `questionAndCategoryBase.ts`; `dev-seed`'s `permittedKeys.ts`, its tests and fixtures, `supabaseAdminClient.ts`, the perm templates.
- Harness: `tests/playwright.config.ts`, `setupFromTemplate.ts`, `registerAndStoreSession.ts`, the `perm-answers-locked` trio, `contestant-a11y.spec.ts`, `scripts/assert-a11y-scan-wiring.mjs`, `scripts/assert-adapter-casts.mjs`, `174-gates.sh`.
- Installed sources: `@sveltejs/kit` 2.70.3 `applyAction`.
- One unit file run: `Input.focusReturn.svelte.test.ts`, 16 of 16.

### Secondary (MEDIUM confidence) — planning records, not re-measured

- `.planning/todos/pending/2026-10-08-175-input-ownership-invalid-mutation-on-the-contestant-profile.md` (the removal half of its finding).
- `STATE.md` and the operator-decision documents for counts at earlier closes (1706 pgTAP tests, 220 E2E tests).

### Tertiary (LOW confidence)

- None. No web source was used: every question the phase raises is about this tree, so the research-plan seam had nothing to route, and the knowledge graph is disabled (`gsd-tools graphify status`: "graphify is not enabled").

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — nothing is added; versions read from the installed packages.
- Architecture: HIGH for the existing paths, read end to end; MEDIUM for the two places the plan must design (the refused-save path of P-3 and the list refresh of P-7).
- Pitfalls: HIGH — each is a quoted line or a measured query, except those resting on A1, A2 and A4.
- Validation: HIGH for the gates and the harness mechanism; MEDIUM for the dataset's exact rows, which the planner fixes against the UI spec.

**Research date:** 2026-10-08
**Valid until:** the next commit that touches `apps/` or `packages/` outside this phase — in practice until Phase 175's own first plan. The pgTAP and E2E counts are snapshots of earlier closes and are re-measured, not reused.
