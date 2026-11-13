---
phase: 177-define-nominations
verified: 2026-10-11T14:56:00Z
status: passed
score: 191/197 must-haves verified
covered_files: [".claude/skills/components/SKILL.md",".claude/skills/components/context-reactivity.md",".claude/skills/data/SKILL.md",".claude/skills/data/object-model.md",".claude/skills/database/SKILL.md",".claude/skills/database/rls-policy-map.md",".claude/skills/database/schema-reference.md",".planning/phases/177-define-nominations/177-01-PLAN.md",".planning/phases/177-define-nominations/177-01-SUMMARY.md",".planning/phases/177-define-nominations/177-02-PLAN.md",".planning/phases/177-define-nominations/177-02-SUMMARY.md",".planning/phases/177-define-nominations/177-03-PLAN.md",".planning/phases/177-define-nominations/177-03-SUMMARY.md",".planning/phases/177-define-nominations/177-04-PLAN.md",".planning/phases/177-define-nominations/177-04-SUMMARY.md",".planning/phases/177-define-nominations/177-05-PLAN.md",".planning/phases/177-define-nominations/177-05-SUMMARY.md",".planning/phases/177-define-nominations/177-06-PLAN.md",".planning/phases/177-define-nominations/177-06-SUMMARY.md",".planning/phases/177-define-nominations/177-07-PLAN.md",".planning/phases/177-define-nominations/177-07-SUMMARY.md",".planning/phases/177-define-nominations/177-08-PLAN.md",".planning/phases/177-define-nominations/177-08-SUMMARY.md",".planning/phases/177-define-nominations/177-09-PLAN.md",".planning/phases/177-define-nominations/177-09-SUMMARY.md",".planning/phases/177-define-nominations/177-10-PLAN.md",".planning/phases/177-define-nominations/177-10-SUMMARY.md",".planning/phases/177-define-nominations/177-11-PLAN.md",".planning/phases/177-define-nominations/177-11-SUMMARY.md",".planning/phases/177-define-nominations/177-12-PLAN.md",".planning/phases/177-define-nominations/177-12-SUMMARY.md",".planning/phases/177-define-nominations/177-13-PLAN.md",".planning/phases/177-define-nominations/177-13-SUMMARY.md",".planning/phases/177-define-nominations/177-14-PLAN.md",".planning/phases/177-define-nominations/177-14-SUMMARY.md",".planning/phases/177-define-nominations/177-15-PLAN.md",".planning/phases/177-define-nominations/177-15-SUMMARY.md",".planning/phases/177-define-nominations/177-16-PLAN.md",".planning/phases/177-define-nominations/177-16-SUMMARY.md",".planning/phases/177-define-nominations/177-17-PLAN.md",".planning/phases/177-define-nominations/177-17-SUMMARY.md",".planning/phases/177-define-nominations/177-18-PLAN.md",".planning/phases/177-define-nominations/177-18-SUMMARY.md",".planning/phases/177-define-nominations/177-19-PLAN.md",".planning/phases/177-define-nominations/177-19-SUMMARY.md",".planning/phases/177-define-nominations/177-20-PLAN.md",".planning/phases/177-define-nominations/177-20-SUMMARY.md",".planning/phases/177-define-nominations/177-21-PLAN.md",".planning/phases/177-define-nominations/177-21-SUMMARY.md","apps/docs/src/lib/navigation.config.ts","apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md","apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md","apps/docs/src/routes/(content)/developers-guide/contestant-app/defining-nominations/+page.md","apps/docs/src/routes/(content)/developers-guide/contestant-app/home-and-tasks/+page.md","apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md","apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md","apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/constituencySelector/ConstituencySelector/+page.md","apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/electionSelector/ElectionSelector/+page.md","apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/notEditableNote/NotEditableNote/+page.md","apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entitySelector/EntitySelector/+page.md","apps/docs/src/routes/(content)/developers-guide/frontend/contexts/+page.md","apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md","apps/docs/src/routes/(content)/developers-guide/frontend/routing/generated/+page.md","apps/docs/src/routes/(content)/publishers-guide/preparing/candidates-and-parties-data-be/+page.md","apps/frontend/messages/da/contestantApp.common.json","apps/frontend/messages/da/contestantApp.nominations.json","apps/frontend/messages/en/contestantApp.common.json","apps/frontend/messages/en/contestantApp.nominations.json","apps/frontend/messages/et/contestantApp.common.json","apps/frontend/messages/et/contestantApp.nominations.json","apps/frontend/messages/fi/contestantApp.common.json","apps/frontend/messages/fi/contestantApp.nominations.json","apps/frontend/messages/fr/contestantApp.common.json","apps/frontend/messages/fr/contestantApp.nominations.json","apps/frontend/messages/lb/contestantApp.common.json","apps/frontend/messages/lb/contestantApp.nominations.json","apps/frontend/messages/sv/contestantApp.common.json","apps/frontend/messages/sv/contestantApp.nominations.json","apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts","apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts","apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts","apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts","apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts","apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.test.ts","apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.ts","apps/frontend/src/lib/api/adapters/supabase/utils/nominationParentOptions.test.ts","apps/frontend/src/lib/api/adapters/supabase/utils/nominationParentOptions.ts","apps/frontend/src/lib/api/adapters/supabase/utils/setEntityNominationsAnswer.test.ts","apps/frontend/src/lib/api/adapters/supabase/utils/setEntityNominationsAnswer.ts","apps/frontend/src/lib/api/base/dataWriter.type.ts","apps/frontend/src/lib/api/base/universalDataWriter.ts","apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte","apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.type.ts","apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte","apps/frontend/src/lib/contestant/components/README.md","apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte","apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte.test.ts","apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.type.ts","apps/frontend/src/lib/contestant/nominations/editorFacts.test.ts","apps/frontend/src/lib/contestant/nominations/editorFacts.ts","apps/frontend/src/lib/contestant/nominations/index.ts","apps/frontend/src/lib/contestant/nominations/nominationDraft.test.ts","apps/frontend/src/lib/contestant/nominations/nominationDraft.ts","apps/frontend/src/lib/contestant/tasks/taskState.test.ts","apps/frontend/src/lib/contestant/tasks/taskState.ts","apps/frontend/src/lib/contestant/utils/entityDescriptor.test.ts","apps/frontend/src/lib/contestant/utils/entityDescriptor.ts","apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts","apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts","apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts","apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts","apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts","apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.svelte","apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.svelte.test.ts","apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.type.ts","apps/frontend/src/lib/dynamic-components/entitySelector/index.ts","apps/frontend/src/lib/routes/impliedParams.test.ts","apps/frontend/src/lib/routes/impliedParams.ts","apps/frontend/src/lib/routes/index.ts","apps/frontend/src/lib/routes/route.ts","apps/frontend/src/lib/routes/selectionOrder.test.ts","apps/frontend/src/lib/routes/selectionOrder.ts","apps/frontend/src/lib/types/generated/translationKey.ts","apps/frontend/src/routes/(voters)/constituencies/+page.svelte","apps/frontend/src/routes/(voters)/constituencies/+page.ts","apps/frontend/src/routes/(voters)/elections/+page.svelte","apps/frontend/src/routes/(voters)/elections/+page.ts","apps/frontend/src/routes/contestant/(protected)/+page.svelte","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/+page.server.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/+layout.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/+page.svelte","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/+page.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/page.svelte.test.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.svelte","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/AfterSaveContestant.svelte","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/AfterSaveRoot.svelte","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/afterSave.svelte.test.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/page.svelte.test.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/elections/+page.svelte","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/elections/+page.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/layout.tracking.test.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/stepLoads.test.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/stepSelection.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+layout.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+page.svelte","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/layout.test.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/nominationFacts.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/page.svelte.test.ts","apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/page.svelte.test.ts","apps/frontend/src/routes/contestant/README.md","apps/supabase/README.md","apps/supabase/supabase/migrations/00001_initial_schema.sql","apps/supabase/supabase/schema/000-enums.sql","apps/supabase/supabase/schema/011-validation-functions.sql","apps/supabase/supabase/schema/101-elections.sql","apps/supabase/supabase/schema/104-nominations.sql","apps/supabase/supabase/schema/301-auth-functions.sql","apps/supabase/supabase/schema/302-rls.sql","apps/supabase/supabase/schema/303-column-grants.sql","apps/supabase/supabase/schema/503-entity-rpcs.sql","apps/supabase/supabase/tests/database/07-rpc-security.test.sql","apps/supabase/supabase/tests/database/08-triggers.test.sql","apps/supabase/supabase/tests/database/12-user-can.test.sql","apps/supabase/supabase/tests/database/15-visibility-flags.test.sql","apps/supabase/supabase/tests/database/23-nominations-write.test.sql","apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql","apps/supabase/supabase/tests/database/42-entity-nominations.test.sql","apps/supabase/supabase/tests/database/43-set-entity-nominations.test.sql","apps/supabase/supabase/tests/database/44-nomination-parent-options.test.sql","packages/data/README.md","packages/data/src/index.ts","packages/data/src/internal.ts","packages/data/src/objects/election/election.test.ts","packages/data/src/objects/election/election.ts","packages/data/src/objects/election/election.type.ts","packages/data/src/objects/election/nominationShape.test.ts","packages/data/src/objects/election/nominationShape.ts","packages/data/src/root/dataRoot.ts","packages/dev-seed/README.md","packages/dev-seed/src/generators/ElectionsGenerator.ts","packages/dev-seed/src/templates/_helpers/buildMinimal.ts","packages/dev-seed/src/templates/default.ts","packages/dev-seed/src/templates/e2e/base.ts","packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts","packages/dev-seed/src/templates/e2e/perm/perm-2e-asymmetric.ts","packages/dev-seed/src/templates/e2e/perm/perm-2e-shared.ts","packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts","packages/dev-seed/src/templates/e2e/perm/perm-contestant-nominations.ts","packages/dev-seed/src/templates/e2e/perm/perm-disable-election-1co.ts","packages/dev-seed/src/templates/e2e/perm/perm-disable-election-2co.ts","packages/dev-seed/src/templates/e2e/perm/perm-disjoint-1co.ts","packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts","packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts","packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts","packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts","packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts","packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts","packages/dev-seed/src/templates/index.ts","packages/dev-seed/tests/nominationShapeCensus.builtins.test.ts","packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts","packages/supabase-types/src/database.ts","scripts/assert-a11y-scan-wiring.mjs","scripts/assert-i18n-catalog-namespaces.mjs","scripts/assert-project-scoped-queries.mjs","tests/README.md","tests/playwright.config.ts","tests/tests/fixtures/contestant/contestantEntityHomePage.fixture.ts","tests/tests/fixtures/contestant/contestantNominationEditor.fixture.ts","tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts","tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts","tests/tests/fixtures/contestant/notEditableNote.fixture.ts","tests/tests/fixtures/contestant/perm-contestant-nominations.ts","tests/tests/fixtures/contestant/perm-no-nomination.ts","tests/tests/fixtures/contestant/perm-startfromcg.ts","tests/tests/setup/perm/perm-contestant-nominations.setup.ts","tests/tests/setup/perm/perm-contestant-nominations.teardown.ts","tests/tests/setup/perm/perm-no-nomination.teardown.ts","tests/tests/setup/perm/perm-startfromcg.setup.ts","tests/tests/setup/perm/perm-startfromcg.teardown.ts","tests/tests/specs/a11y/contestant-a11y.spec.ts","tests/tests/specs/perm/contestant-nominations.spec.ts","tests/tests/specs/perm/perm-no-nomination.spec.ts","tests/tests/specs/perm/perm-startfromcg.spec.ts","tests/tests/utils/permContestantNominationsData.ts","tests/tests/utils/permStartFromCgData.ts","tests/tests/utils/testIds.ts"]
covered_digest: "v3:sha256:c8e54294562e89065fc435dc80877b95d1b5fcdb41319d4f1c8d09a4f6728881"
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "UI: error · The parent options cannot be read — an inline error message stands in the list's place with Cancel alone; no main button is rendered and nothing can be written (177-15)"
    test: "Open the details step of the nomination editor while the read of the parent options is refused or fails (for instance with `get_nomination_parent_options` answering NULL, or with the request blocked in the browser's network panel)"
    expected: "`data-editor-state=\"error\"` on the page; the inline error message in the cards' place; Cancel is the only button; no request to `set_entity_nominations` can be made"
    why_human: "No test of any kind provokes it. `details/page.svelte.test.ts` and `afterSave.svelte.test.ts` both stub the read with `mockResolvedValue([])` and never reject it or answer `undefined`; no fixture step reaches the state; the fixture's `NominationEditorState` names `error` and no spec asserts it. 177-21-SUMMARY's table 'For the verifier' lists it as held by a component or unit case — that sentence is not supported by the tree. What is tested is one level down: the writer resolves `undefined` for a refused read (`supabaseDataWriter.test.ts`, 'resolves to undefined for a refused read, and not to an empty list')."
human_verification:
  - test: "The options error of the details step (the behaviour-unverified truth above)"
    expected: "The error message in the cards' place, Cancel alone, nothing written"
    why_human: "Present and wired by reading; exercised by no test"
  - test: "Two saves of one entity's nominations made in parallel (177-07, backstop truth)"
    expected: "One commits and the other is refused whole; no duplicate and no half-written set"
    why_human: "Backstop truth: not provable in one session and tested nowhere (pgTAP, the integration test and the E2E suite are all single-session). Inferred from the uniqueness key and the single statement; abstained as insufficient_spec"
  - test: "Every explanation, note, hint and error of the new copy at 320 px in each of the seven locales (177-12, backstop truth)"
    expected: "Nothing clipped, nothing overlapping, no sideways scroll"
    why_human: "Backstop truth. The suite measures at 320 and 390 px in English only (U-27 (a))"
  - test: "The two question titles used as page headings at 320 px in each of the seven locales (177-12, backstop truth)"
    expected: "The title wraps and the page does not widen"
    why_human: "Backstop truth; English only in the suite"
  - test: "A parent group's legend with its required mark, and an option's hint, inside a card at 320 px in each of the seven locales (177-12, backstop truth)"
    expected: "Neither is clipped"
    why_human: "Backstop truth; English only in the suite"
  - test: "The whole editor by keyboard and with a screen reader, in English: a definition, an 'Other', a removal and a refused check (177-20, backstop truth)"
    expected: "Each can be completed; the group, its options, the removed line and the message region are announced as the contract says"
    why_human: "Backstop truth. The suite asserts tab stops, arrow keys and focus targets in Chromium; it runs no screen reader and no WebKit"
  - test: "A card in an election that asks the entity for no parent (a candidate in a `candidate_only` election)"
    expected: "The card holds the symbol field alone and no parent group"
    why_human: "Roadmap criterion 2's clause 'an entity for which no parent is allowed is not asked for one' is held by unit cases of the draft arithmetic and by the page's `{#if view.options.length}`; no component or browser test renders such a card (the spec's two `expectParentGroup(…, { shown: false })` calls are on removed cards)"
  - test: "The voter's election page and the legacy pre-registration election page with a long election name, at 320 px"
    expected: "The name wraps and the checkbox stays in the viewport, as on the editor's election step"
    why_human: "`ElectionSelector`'s label gained `whitespace-normal`; the component is shared and only the editor's page was opened with a long name. Every voter project is green at its baseline count, with short names"
  - test: "The opt-in `visual-regression` project on this head (it runs on the CI image only)"
    expected: "No snapshot of a page that renders `ElectionSelector` or the nominations view differs unexpectedly"
    why_human: "Not run by the phase and not by me; its baselines are Linux captures"
  - test: "The home's task list, the nominations view's list and the details step's list of cards in Safari with VoiceOver"
    expected: "Each is announced as a list with its item count"
    why_human: "`role=\"list\"` was added without a WebKit check (operator decision F4 (a)); the suite has no WebKit project"
  - test: "As a voter, a confirmed nomination after its entity's user has edited it"
    expected: "The nomination is not shown to voters until an administrator confirms it again"
    why_human: "Read from `enforce_nomination_confirmation` rule 2 and stated in the Publishers' Guide by `06d81c75e`; the contestant side is in a browser test ('edit: a changed symbol is stored and the nomination waits for confirmation again'), the voter side was opened by nobody. It is also a product question the operator has not answered"
  - test: "The constructed translations of the nomination editor's strings in da, et, fi, fr, lb and sv"
    expected: "A native reader accepts each"
    why_human: "Key sets and placeholders are equal across the seven catalogues (measured); the wording is not something a program judges"
  - test: "Eleven judgment-tier prohibitions flagged unverified-prohibition (PROH-177-01, -02, -05, -10, -15, -25, -27, -43, -57, -60, -63)"
    expected: "A person accepts the executors' account of each, or reads the named files"
    why_human: "Each is a statement about how the work was done or about every test of a 3,447-line spec; the evidence I hold is partial and is stated per item in the report"
operator_acceptance:
  accepted_by: "operator"
  accepted_at: "2026-10-12"
  statement: "Accept the 13 items."
  note: "Given in session when plan 178-01 stopped on this report's status. The operator was shown the thirteen items by one-line description and accepted them as a whole; no item was performed. Each stays as the report states it."
  items:
    - item: "The options error of the details step — behaviour unverified"
      decision: "accepted as a residual; exercised by no test. Tracked in todos/pending/2026-10-11-177-states-held-by-component-cases-and-seen-in-no-browser.md"
    - item: "Two parallel saves of one entity's nominations (backstop truth)"
      decision: "accepted; inferred from the uniqueness key and the single statement, tested nowhere"
    - item: "The new copy, the two question titles and the card's legend and hint at 320 px in seven locales (three backstop truths)"
      decision: "accepted; measured in English only. Not looked at by a person. Tracked in todos/pending/2026-10-11-177-reads-the-ui-contract-leaves-to-a-person.md"
    - item: "The whole editor by keyboard and with a screen reader; three lists in Safari with VoiceOver"
      decision: "accepted; no screen reader and no WebKit was run. Same todo"
    - item: "A card in an election that asks the entity for no parent"
      decision: "accepted; held by unit cases and the page's condition, rendered in no test"
    - item: "The voter's election page and the pre-registration election page with a long election name at 320 px"
      decision: "accepted; not opened"
    - item: "The opt-in visual-regression project on this head"
      decision: "accepted; not run"
    - item: "As a voter, a confirmed nomination after its entity's user has edited it"
      decision: "accepted as built and as the Publishers' Guide states it; the voter side was opened by nobody. Whether an edit should hide a published nomination remains a product question the operator has not ruled on"
    - item: "The constructed translations in da, et, fi, fr, lb and sv"
      decision: "accepted; stays a filed todo (2026-10-11-177-native-speaker-review-nomination-editor-strings.md). The review has not been done"
    - item: "Eleven judgment-tier prohibitions (PROH-177-01, -02, -05, -10, -15, -25, -27, -43, -57, -60, -63)"
      decision: "accepted on the executors' account"
---

# Phase 177: Define Nominations — Verification Report

**Phase Goal:** The user defines the selected entity's nominations themselves: which elections and constituencies it stands in, under which symbol, and for which party or alliance.
**Verified:** 2026-10-11T14:56:00Z
**Status:** passed — verified `human_needed` with no gap; the operator accepted the thirteen human-verification items on 2026-10-12 (frontmatter `operator_acceptance`). No item was performed; each stays as stated below
**Re-verification:** No — initial verification
**Tree verified:** `856ad0bed` (branch `feat/entity-signup-multi-grant`). Code head of the closing runs: `f71107820`. Between them outside `.planning/`: one commit, `06d81c75e`, two lines in two docs pages (measured: `git diff --stat f71107820..HEAD -- . ':(exclude).planning'`).
**Phase base:** `ae55fb89bf2e42517b04b459bf76dad5e23c92f0` (`177-BASE`). The phase's diff outside `.planning/`: 186 files, 32,623 insertions, 1,058 deletions.

**No gap was found. The `missing:` list is empty**: nothing a later phase must build before it may rest on this one. The status is `human_needed` because five must-have truths are backstop truths that only a person or a second session can show, one behaviour the plans promise is exercised by no test, and eleven judgment-tier prohibitions could not be established from the tree.

Three words are used throughout and mean exactly this:

- **measured** — I ran the command or the query in this session and read its exit status or its rows.
- **read** — I opened the file and the statement follows from its text.
- **relied on** — I took it from evidence on disk that the executors produced, after checking that the evidence is of the stated head and is internally sound.

## What I ran myself, and what I relied on

| Check | How | Result |
|---|---|---|
| The gate set on the current head | `bash 177-gates.sh 177-verify`, in the background; each status read from `tests/e2e-runs/177-gates/177-verify/summary.tsv` and `done` | **measured**: head `856ad0bed`; 14 rows, each 0; `done` 0; 0 Sleep entries in the window. pgTAP `Files=44, Tests=2312, Result: PASS`; integration 30 of 30; frontend check 0 errors, 0 warnings; unit: every package green (frontend 207 files passed, 1 skipped) |
| The editor's unit and component tests, alone | `yarn workspace @openvaa/frontend vitest run …` over 13 files, JSON report | **measured**: exit 0; 683 passed, 0 failed, 0 pending |
| The full E2E run of the closing | `tests/e2e-runs/177-e2e/177-21-final`: `exit`, `playwright-exit`, `head`, and my own count over `results.json` | **relied on, recounted**: `exit` 0, `playwright-exit` 0, head `f71107820`, no `VOID-host-suspend.txt`, preflight 1 success and 0 failures; 444 tests, each `expected`, each with exactly one result and that result `passed`; 116 projects; 0 skipped; retries 0, workers 6; 351 heartbeats, 64 ms the latest |
| The three isolated runs | `tests/e2e-runs/177-determinism/177-21-final/run-0{1,2,3}`: `exit`, `head`, my count over each `results.json` | **relied on, recounted**: each `exit` 0, head `f71107820`, no void marker, 370 of 370 with one passed result each; `perm-contestant-nominations` 97 of 97 in each |
| The baseline | `tests/e2e-runs/176-e2e/261011-vj-final` (named by `177-BASELINE`) | **relied on, recounted**: `exit` 0, head `ae55fb89b` = `177-BASE`; 341 of 341, 113 projects |
| Final run against the baseline, per project | my own comparison of the two `results.json` | **measured**: four projects differ, all upward — the new project's setup (1), teardown (1) and spec (97), and `perm-startfromcg` 2 → 6. Every other project is at its baseline count. Three baseline titles are absent from the final run: one setup retitled, and two tests of `perm-no-nomination.spec.ts` retitled with the surface (read: the changed expectations are those the changed view makes false) |
| P-18, provoked | a `psql` script in one transaction ended by `ROLLBACK`, on pgTAP's helpers | **measured**: see item 3 below |
| The election-type rule on a service-role UPDATE | a `psql` script, rolled back | **measured**: refused, `23514`, `Nomination shape refused: …` (177-03's summary had named this cell as not asserted) |
| Comment hygiene of the phase's diff | my own scan of the 32,307 added lines under `apps/`, `packages/`, `tests/` | **measured**: see item 10 |
| Message catalogues | my own comparison of key sets and placeholders over seven locales | **measured**: see item 11 |
| Artifacts and key links of the 21 plans | `gsd-tools query verify.artifacts` and `verify.key-links` per plan | **measured**: artifacts 67 of 68; key links 30 of 41 by the tool, the other 11 read by me (below) |
| The full E2E suite | — | **not run by me.** The closing run is of the code head, complete, green and not void; the one later commit outside `.planning/` changes two docs pages that no spec opens |

**The local stack, as I leave it.** My gate run reset the local database (the driver's `db-reset` row, after its own in-flight check: no listener on the dev-server port, no run started within ten minutes without an end). The driver's own instruction is to re-seed with `yarn db:seed:default` afterwards; that command was refused to me by the permission system and I did not work around it. Measured afterwards: the database holds 2 projects, 1 election, 328 candidates, 8 organizations, 377 nominations, 26 questions, 2 auth users and 2 grant rows — the counts 177-21-SUMMARY gives for the state it left — because the dev-seed package's own `default-template.integration.test.ts` applies the default template during the unit row. **One difference remains:** pgTAP's six helper functions are in `public` until the next reset, so `yarn db:types` run by hand before a reset would show drift. Docker was not restarted. Nothing under `tests/e2e-runs/` was deleted; I added `177-gates/177-verify`. No dev server is running. `git status --short`: `?? CAND-APP-PLAN.md`.

## Goal Achievement

### Roadmap success criteria

| # | Criterion (short) | Status | Evidence opened |
|---|---|---|---|
| 1 | The same selectors and order a voter meets, `startFromConstituencyGroup` honoured, only admissible elections offered; a single admissible election is never a choice; the selection is skipped for one election with one constituency (NOM-03) | VERIFIED | **read**: `$lib/routes/selectionOrder.ts` is the one ordering module; the voter's `elections/+page.ts` and `constituencies/+page.ts` call `electionsStepOutcome` / `constituenciesStepOutcome` (key links, tool-verified); the editor's three loads reach it through `(edit)/stepSelection.ts` with `honourDisallowSelection: false`; the steps render the shared `ElectionSelector` and `ConstituencySelector`; admissibility is `admissibleElectionsOf` → `isNominableInShape`. **measured**: `selectionOrder.test.ts` 54 and `stepLoads.test.ts` 59 passed. **relied on**: browser tests `steps:` (six), and `perm-startfromcg` `contestant:` (four), green in four runs |
| 2 | One card per pair with a symbol input and, where allowed, a parent selector; a candidate in `organization_list` cannot continue without a parent; the new type is the default and admits an independent candidate; an organization may choose any alliance, "None" by default; no parent asked where none is allowed; the database refuses a forbidden shape for every writer (NOM-04) | VERIFIED | **read**: `details/+page.svelte`, `nominationDraft.ts`, `EntitySelector.svelte`, `packages/data/…/nominationShape.ts`, `public.nomination_shape_rule`, `validate_nomination`, `validate_nomination_parent_required`, the constraint trigger `nominations_parent_required`, `101-elections.sql` (`DEFAULT 'organization_list_and_independents'`), `get_nomination_parent_options`. **measured**: pgTAP 2312 green on a reset database (`08-triggers` holds the sixteen-cell grid); a service-role UPDATE refused with `23514`; `nominationDraft.test.ts` 123 passed. **relied on**: `define:` (the required-parent error is asserted at spec line 587–588), `edit: a party names an alliance…`. The clause "not asked for one" is unit-held only — see the human list |
| 3 | "Other" stores free text in `customData.requestedParentOrganization` and links nothing; a listed party or alliance is linked (NOM-05) | VERIFIED | **read**: `set_entity_nominations` (`other` merges the key and sets no parent; `entity` asks `private.nomination_id_in_contest`, creates the parent's row where there is none, removes the key). **measured**: pgTAP tags `OTHER` (9) and `LINK` (11) in `43-set-entity-nominations.test.sql`, green. **relied on**: `edit: a candidate replaces its party with a typed name, and later with a listed party`; `nominations-view: a typed party is shown on its row…` |
| 4 | Continue creates and updates at once; the home task turns complete, the view shows them, Continue leads to the next incomplete task; an edited nomination is no longer confirmed; under `access.nominationsLocked` the change is refused and the view offers no Edit (NOM-06) | VERIFIED | **read**: `handleSubmit` (one `setEntityNominations` call, `invalidateAll()`, `nominationsSaveTarget`); `enforce_nomination_confirmation` rule 2; the four entity policies ask `private.project_nominations_locked`; the view renders Edit only for `viewState === 'listed' && entryOffered`. **measured**: pgTAP `LOCK` (6), `EDIT` (3), `SKIP` (5); `afterSave.svelte.test.ts` 4 passed. **relied on**: `define:`, `follow:` (two), `edit: a changed symbol…`, `stale:`, `nominations-view: under the nominations lock…` |
| 5 | After a nomination changes, the questions asked follow the new nominations; the task state and every Continue target reflect the new set at once (NOM-08) | VERIFIED | **read**: the entity-level load is rerun by `invalidateAll()` and is unchanged since the base (measured: empty diff). **measured**: `taskState.test.ts` 168 passed (an answer outside the applicable set changes nothing). **relied on**: `follow: after a first save the home, the nominations view and the questions follow without a full page load`; `follow: a question that no longer applies is neither asked nor counted, and its answer returns with the nomination` |
| 6 | An E2E spec covers nomination definition; `perm-startfromcg.spec.ts` is extended, not paralleled; the full suite is green at close (E2E-02 in part, E2E-03) | VERIFIED | **measured**: `contestant-nominations.spec.ts` (3,447 lines, 97 tests in the closing run); `perm-startfromcg.spec.ts` changed by additions only (no removed line) and its template by the election type alone. **relied on, recounted**: 444 of 444 on `f71107820`; three isolated runs green |

### Requirements

| Requirement | Plans that claim it | Status | Evidence |
|---|---|---|---|
| NOM-03 | 9 | SATISFIED | criterion 1 |
| NOM-04 | 17 | SATISFIED | criterion 2 |
| NOM-05 | 8 | SATISFIED | criterion 3 |
| NOM-06 | 14 | SATISFIED | criterion 4 |
| NOM-08 | 5 | SATISFIED | criterion 5 |

No requirement that `REQUIREMENTS.md` maps to Phase 177 is unclaimed. `REQUIREMENTS.md` still shows the five as unticked and "Pending"; ticking them is the orchestrator's, after the operator has read this report. E2E-02 and E2E-03 are mapped to Phase 179 and are met here in the part criterion 6 names.

### The plans' truths

191 truths in 21 plans. Five are backstop truths (abstained: `insufficient_spec`), one is present and wired with no test of its behaviour, and 185 are verified at the depth the table states. Score: 6 criteria + 185 truths = **191 of 197**.

| Plan | Truths | Status | How |
|---|---|---|---|
| 01 drivers, base, baseline, rulings | 6 | VERIFIED | **measured**: the six artifacts exist with their `contains`; baseline head equals `177-BASE`. **relied on**: that each accepting branch of the verdict was seen refusing once (its three verify scripts exit 0) |
| 02 the fourth election type | 5 | VERIFIED | **read**: enum, default, the template diffs (the election type alone). **measured**: types-clean 0 after a reset; the census test green; commit order (census test `a01a67b37` before the templates `87e9f2203`, both before the rule `a5f4229d9`) |
| 03 the election-type rule | 6 | VERIFIED | **read**: both functions and the constraint trigger. **measured**: pgTAP green; service-role UPDATE refused |
| 04 the symbol and the delete policy | 6 | VERIFIED | **read**: `enforce_nomination_entity_columns`, `entity_delete_nominations`. **measured**: pgTAP tags `SYM` 20, `DEL` 21, `DEL-neg` 10, green |
| 05 the paired parent policy | 6 | VERIFIED | **read**: the widened policy, guard 3 by the row's own type, the paired fifth guard, the count helper, `nomination_id_in_contest`, the organization role's permission. **measured**: `PAIR` 5, `PAIR-neg` 6, green; the cap is `< 10` in the policy and `>= 10` in the trigger |
| 06 the parent options | 5 | VERIFIED | **read**: the function (allow-list of seven keys, the gate through `private.caller_entity_ids`, NULL for a refusal) and `parent.entity_id` in `get_entity_nominations`. **measured**: `44-…` (plan 66) green; the census string of `07-rpc-security` holds the new name in sorted position |
| 07 the write function | 17 | 16 VERIFIED, 1 backstop | **read**: the whole body. **measured**: `43-…` (plan 130; nineteen rule tags, each present) green; P-18 provoked. The parallel-saves truth: abstained |
| 08 the data model | 6 | VERIFIED | **read**: `nominationShape.ts`, the getter, the README table. **measured**: data package 48 test files green |
| 09 the writer | 7 | VERIFIED | **read**: the two `rpc` calls, no statement on `nominations` of the writer's own. **measured**: integration 30 of 30 against the running stack; writer unit cases green |
| 10 the dataset | 7 | VERIFIED | **relied on**: the project pair in the chain and the three `dataset:` tests, green in four runs; **measured**: every earlier project at its baseline count |
| 11 the fixtures | 4 | VERIFIED | **measured**: artifacts; commit order (fixtures `6dad8f47e`, `057f8faa7` before the screens `c104fc45b`) |
| 12 the strings | 8 | 5 VERIFIED, 3 backstop | **measured**: the nominations catalogue holds 62 keys in each of the seven locales (96 lines added to each), with equal key sets and placeholders; no line removed from an `en` catalogue; `assert:i18n-catalog-namespaces` inside the lint row, 0 |
| 13 the shared ordering module | 7 | VERIFIED | **measured**: `(located)/+layout.ts` unchanged since the base; no voter spec changed; unit 54 passed. **relied on**: every voter project green at its baseline count |
| 14 the selector and the draft | 11 | VERIFIED | **read**: `EntitySelector.svelte` (a `fieldset` with `role="radiogroup"`, one `name`, `aria-required`, `aria-invalid`, the error line a `role="alert"`, the card `aria-hidden` under a covering label). **measured**: 40 + 123 + 28 cases passed; `EntityCard`, `EntityList` and `Input` unchanged since the base |
| 15 the tracer | 19 | 18 VERIFIED, 1 PRESENT_BEHAVIOR_UNVERIFIED | **read**: the guard, the three loads, the three pages. **measured**: `layout.tracking.test.ts` 36 passed; no `view-transition-name` and no `<dialog` among the added lines (one hit, a test asserting none). The options error: see the frontmatter |
| 16 the order, contestant side | 8 | VERIFIED | **relied on**: `steps:` and `contestant:` tests; **measured**: the voter tests of `perm-startfromcg.spec.ts` are unedited |
| 17 existing nominations | 16 | VERIFIED | **read**: the details page, `startingSelectionOf`, `constituencyChoiceOf`. **measured**: `details/page.svelte.test.ts` 38 and `constituencies/page.svelte.test.ts` 11 passed. **relied on**: `edit:` (ten), `remove:` (three), `keys:` |
| 18 the button, refusals, leaving | 13 | VERIFIED | **read**: `nominationsSaveAction`, `handleSubmit`, `notStoredOutcome`, `PreventNavigation`. **measured**: the component cases for each of the four messages, the leave prompt and the two P-17 cases. **relied on**: `button:` (two), `refused:` (two), `leave:`, `stale:`, `closing:`, `saved:` |
| 19 the ways in and the view | 15 | VERIFIED | **read**: `taskStateOf`, the context's hand-over, the view. **measured**: the view's component test 39 passed; `role="list"` on the three lists. **relied on**: `entry:`, `holds:` (two), `nominations-view:` (ten), `follow:` (two) |
| 20 accessibility and phone widths | 9 | 8 VERIFIED, 1 backstop | **relied on**: 26 scans (13 entries, two themes), 11 phone tests per width, `keys:`, `focus:`, each passed once in each of four runs |
| 21 docs, skills, todos, closing | 10 | VERIFIED | **measured**: the five artifacts; the docs-links row 0 on the current head; three todos in `done/`, one re-scoped, thirteen filed; the three closing run directories exist once each, of one head |

Truths 177-19 "each of the view's six states is in the server-rendered markup and does not change when the page hydrates" and 177-15 "no shorter list … is shown meanwhile" are verified by structure (**read**: the facts come from a load whose data is part of the server render; `Loading` stands in the selector's place) and by the component cases; I did not compare server markup with hydrated markup myself.

### The twelve items I was asked to look at hardest

**1. A seed template states an election type its rows are admitted by — held for the built-in templates only.** Confirmed as stated. **Read**: `nominationShapeCensus.builtins.test.ts` walks `Object.keys(BUILT_IN_TEMPLATES)` with a floor of 30 templates and 500 nominations and a classifier of its own. **Measured**: green in the unit row. A template from the filesystem is in no test. What bounds the consequence: the database refuses such a row at import for every writer, the service role included (**measured** for an UPDATE, asserted in pgTAP for an INSERT), so a custom template fails loudly at seeding and seeds nothing wrong. Not a gap.

**2. What a component case alone holds.** **Measured**, each case by its title in my own run:

| State | Held by | In a browser |
|---|---|---|
| `tooManyPending` | "a save that is not stored says that the limit on nominations waiting for confirmation is reached, and keeps what was typed" | no |
| `failed` | "…shows its own message for a rejection, never the text it was rejected with, and tries again on a second press"; "…shows the general message for an answer it cannot name" | no |
| The kept section of the constituency step | "shows a section in the place of a selector for an election with several nominations, and hands the selector the other election alone" | no |
| Start-from-constituency for an entity with nominations | `stepLoads.test.ts`: "…while a constituency group is chosen first, is served with one choice for every admissible election and keeps none", and four more | no |
| **The options error** | **nothing** | no |

The first four are as 177-21 says. The fifth is not: see the frontmatter's `behavior_unverified_items`. All five are in the todo `2026-10-11-177-states-held-by-component-cases-and-seen-in-no-browser.md` (owner: Phase 179); **its item 3 should say that the options error is held by no test at all**, since a later phase will read that list.

**3. P-18 (G18 (a)), provoked.** In one rolled-back transaction: a candidate with one confirmed nomination (symbol `A`); as the owner, a second nomination added in another election and the first one's symbol changed to `ADMIN-CHANGED`; then, as the candidate's editor, `set_entity_nominations` with the set the editor's page would hold from before those two writes. **Measured**: the call answers `{"deleted": 1, "updated": 1, "inserted": 0, "unchanged": 0, "parents_created": 0}` with no refusal; afterwards the entity holds one nomination, symbol `A`, `confirmed = false`. So the row the administrator added is deleted, the value the administrator changed is written over, and the row returns to the confirmation queue — exactly as G18 states. After the `ROLLBACK`, 0 rows of the probe remain. Accepted by operator decision G18 (a), on the record in the decisions document's fill status against U-02's sentence; the located change of option (b) is filed (`2026-10-11-177-a-save-built-on-nominations-an-administrator-changed.md`).

**4. P-17 (G17 (a)) as built.** **Read**: after a stored save `handleSubmit` navigates on only `if (onEditorStep())`, which is `page.route.id?.startsWith(CONTESTANT_NOMINATION_EDITOR + '/')`. Where the re-read took the user to the nominations view the page navigates nowhere further; where it forwarded to another step of the editor the save still leads on. That departs from the plan's literal check ("is the details page still shown") and is the orchestrator's ruling in `177-DISPATCH.md` § "After 177-17". **Measured**: the two component cases "navigates nowhere further when the re-read led out of the editor" and "still leads on to the next task when the re-read led to another step of the editor". **Relied on**: the browser tests `closing:` and `saved:`, green in four runs. A kept red run named `177-18-forward-red` (exit 1, two unexpected) is on disk; I did not open its failures.

**5. The reopened schema block of 177-17.** **Read**: four of the seven `UPDATE`s of `set_entity_nominations` write the custom data, and each states `confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)`; the other three name no `confirmed`. The expression can keep the stored value or turn it off, never on. `enforce_nomination_confirmation` is unchanged by 177-17 (**measured**: `git log` of `011-validation-functions.sql` holds no 177-17 commit; the phase's changes to that function are 177-05's cap branch and 177-21's comment). **Measured**: pgTAP "OTHER: the nomination holds the name and is confirmed no longer", green. A direct UPDATE of that kind by an entity's editor is still refused by rule 1; whether the trigger's two rules should swap is put to the operator in the decisions document.

**6. `nominationsEditable` optional in `TaskStateInput`.** **Read**: the context passes it from `nominationsEditableOf`; the profile page and the question page call `taskStateOf` without it. Both pages are under `(nominated)`, which serves an entity that has a nomination, and the member is read in the no-nomination branch alone, so leaving it out changes an answer only if the nominations vanish while such a page is open; the answer then leads to the nominations view, which offers the entry. Accepted by the orchestrator (`177-DISPATCH.md` § "After 177-19") and put to the operator.

**7. Departures from the UI contract.** Each **read** in the page it is in:

| Departure | Where | Accepted by |
|---|---|---|
| The election step's Continue carries no stored constituency | `elections/+page.svelte`: `constituencyIds: data.nominationSelection.constituencyIds`, the address's alone; the constituency step's load selects the stored one | orchestrator; in the decisions document for the operator |
| Keep is `aria-describedby` the removed line | `details/+page.svelte`: `aria-describedby={removedNoteId}` | the same |
| `role="status"` on the constituency step's sentence, none on the election step's hint | `constituencies/+page.svelte`, `elections/+page.svelte` | the same: "one ruling for both is yours" |
| Cancel on the details step is a button | `<Button … onclick={handleCancel}>`; an anchor on the two selection steps | `177-DISPATCH.md` § "After 177-18" |
| Thirteen scan entries where U-26 recommended eight | 26 titles "axe accessibility scan — …" in the closing run | the dispatch's instruction to 177-20; more scans, none dropped |

**8. `ElectionSelector`'s label.** **Read**: `whitespace-normal` added to the label's class, with one HTML comment and a docstring sentence; no other change. Its three users are the voter's election page, the legacy pre-registration page and the editor's election step. Only the last was opened with a long name. On the human list.

**9. The `TypeError` at `Input.svelte`.** **Measured**: once in the dev-server log of the baseline run and once in that of the closing run, with the same stack (`$effect` in `Input.svelte` in `QuestionInput.svelte`); `apps/frontend/src/lib/components/input` is unchanged since the base; no stack in the closing log names a file of the nominations tree; 444 of 444 passed. It is older than the phase and fails nothing. Filed: `2026-10-11-177-unhandled-typeerror-in-input-on-an-ordered-multiple-choice-with-no-value.md`.

**10. Comment hygiene of the phase's diff.** **Measured** over the 32,307 lines the phase added under `apps/`, `packages/` and `tests/`: 0 hits for each of the report's eight patterns (bare phase and spike references, both decision-id forms, the section sign, a `.planning/` path, a plan number, a task id), 0 milestone versions, 0 `U-nn`, `P-nn` or `PROH-` ids, 0 `[PR review]` tags and 0 debt markers. 49 lines hold a history word ("no longer", "previously", "was changed"); **read**, each: all describe the domain (a row that is no longer the caller's, a party no longer listed, the UI string "Previously: {constituency}") and none the code's past. `yarn assert:comment-hygiene` is a link of the lint row: 0. The whole-tree `--assert-clean` was not re-run by me; its exit 1 on older residue is 177-21's statement.

**11. The Context Destructuring Rule, `any`, locales.** **Measured** over the 16 Svelte files the phase touched: every destructure of a context takes `t`, `getRoute`, `setDataRoot` or `pageStyles` — a function, a stable handle or the overlay API — and no reactive accessor; no `$derived` alias of `dataRoot`. Among the added lines of `.ts`, `.svelte` and `.mjs` files: 0 `any`, 0 TypeScript suppressions, two `eslint-disable-next-line` in a fixture. Catalogues: 14 files changed, insertions only; every key of `contestantApp.nominations.json` (62 in each locale after the phase) and the one new key of `contestantApp.common.json` is in all seven locales with equal placeholders. (My comparison also reports 12 empty values and one placeholder difference in `common.json`, `dynamic.json` and `questions.json`: files this phase did not touch.)

**12. The verify commands that exited 1 as written.** **Measured** by a token-level diff of each script as written against its corrected copy:

| Verify | As written | Corrected | The only tokens that differ |
|---|---|---|---|
| 177-18 task 2 | 1 | 0 | `perm-contestant-nominations=7` → `=8` |
| 177-18 task 3 | 1 | 0 | the same, and one added expectation `saved:=1` |
| 177-20 task 2 | 1 | 0 | `=32` → `=50` |
| 177-20 task 3 | 1 | 0 | `=32` → `=50`; scans `16` → `26`; `phone 320:` and `phone 390:` `7` → `11` |
| 177-21 task 2 | 1 | 0 | scans `16` → `26` |

Each difference is a count a ruling had moved upward (P-17's added test; the dispatch's instruction to scan and measure more states). None stands for a missing behaviour. Seven other first-form verifies of plans 04, 10, 15, 16 and 17 exited 1 or 2; each matches one of the six defects of the plans' own verify commands that `177-DISPATCH.md` tables (**read** in each log or diff: a doubled apostrophe in SQL in 04; a title counted by its single quote in 10; `--dirty-only` with several paths, refused as a usage error, in 10, 15, 16 and 17; a count that misses an alias in 16), and each has a restated copy that exits 0 (**measured**: all thirteen corrected or restated copies hold 0).

### Required Artifacts

68 artifacts in 21 plans; the tool passes 67. The one it fails: `…/(edit)/details/afterSave.svelte.test.ts`, "Missing pattern: taskState". **Read**: the file is 410 lines, mounts the real entity layout, context provider and store through two harness components, and its four cases passed in my run, among them "navigates once, to the profile and not to the entity's home, when the loads' data was replaced". The word the plan searched for is not in its text; the behaviour the artifact provides is. Status: VERIFIED, with the pattern miss recorded.

### Key Link Verification

41 links; the tool verifies 30. The other 11 name a database object, not a file, in `from:`, which the tool refuses. **Read**, each in the schema file:

| From | To | Status |
|---|---|---|
| `validate_nomination` | `nomination_shape_rule` | WIRED |
| `nominations_parent_required` | `validate_nomination_parent_required`, `DEFERRABLE INITIALLY DEFERRED` | WIRED |
| `entity_delete_nominations` | `private.project_nominations_locked` | WIRED |
| `enforce_nomination_entity_columns` | `user_can(… 'nomination.edit' …)` | WIRED |
| `entity_insert_parent_nominations` | `private.caller_nominated_in_contest`, with the caller types | WIRED |
| `enforce_nomination_confirmation` | `private.caller_unconfirmed_originated_count`, for an organization or an alliance row | WIRED |
| `get_nomination_parent_options` | `private.caller_entity_ids` | WIRED |
| `07-rpc-security.test.sql` | the census string `get_entity_nominations,get_nomination_parent_options` | WIRED |
| `set_entity_nominations` | `private.nomination_id_in_contest` | WIRED |
| `set_entity_nominations` | `nominations_parent_required`, forced immediate and set back to deferred | WIRED |
| `set_entity_nominations` | `nomination_shape_rule`, in the reach | WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|---|---|---|---|---|
| The nominations view | `contestantCtx.nominations` | `get_entity_nominations`, through the entity-level load | yes | FLOWING |
| The view's states and the guard | `data.nominationFacts` | `nominations/+layout.ts`, from the parent loads' settings, elections and nominations | yes | FLOWING |
| The cards | `buildCards` over `reachedNominationsOf(contestantCtx.nominations, facts)` and the address's contests | the same read, and the step's own page load | yes | FLOWING |
| A card's parent group | `parentOptions` | `get_nomination_parent_options`, through the context and the writer | yes | FLOWING |
| The save | `desiredSetOf(cards)` | `set_entity_nominations`, one `rpc` call | yes | FLOWING |

### Prohibitions

64 prohibitions, each `status: resolved`; 46 explicit, 18 judgment-tier; none test-tier.

**Checked, and how:**

| Prohibition | Method | Result |
|---|---|---|
| PROH-177-06 no row added or re-parented to satisfy the rule | measured: each template's diff is its election type | holds |
| PROH-177-07 generated files never edited by hand | measured: types-clean 0 after a reset; the schema-migration parity gate inside the lint row | holds |
| PROH-177-08 the rule exempts no role | read; measured for a service-role UPDATE | holds |
| PROH-177-09 the deferred function reads the row again | read | holds |
| PROH-177-11, -12 the symbol on the caller's own row alone; the lock through the helper | read | holds |
| PROH-177-13 the cap is not removed or reshaped | read: 10 in the policy and in the trigger | holds |
| PROH-177-14 no guard of the parent policy dropped | read | holds |
| PROH-177-16, -17 the options' allow-list and the gate | read | holds |
| PROH-177-18 … -21 the write function | read; pgTAP `CAT`, `DEL`, `LOCK`, `MODE` | holds |
| PROH-177-22 no re-derived shape rule outside the data package | measured: no shape literal and no `nominationShape` comparison in non-test frontend source | holds |
| PROH-177-23, -24 the writer returns no raised text and issues no statement of its own | read; measured: no `from('nominations')` in the writer | holds |
| PROH-177-26 no row or count of another dataset changed | measured: every baseline project at its count | holds |
| PROH-177-28 no fixed wait in the new fixture | measured: no `waitForTimeout` in it (the one in `contestantProfilePage.fixture.ts` is older than the phase) | holds, in that part |
| PROH-177-30, -31 no message reworded or removed; one placeholder | measured | holds |
| PROH-177-32, -33, -42 voter specs and the `(located)` load untouched | measured | holds |
| PROH-177-34 `disallowSelection` not honoured for a contestant | read; relied on `steps: disallowing election selection…` | holds |
| PROH-177-35, -36 an untouched group is an error; options only for ids passed | measured: the draft and selector cases | holds |
| PROH-177-37, -59 `EntityCard`, `EntityList`, `Input` not edited | measured: empty diff since the base. `ConstituencySelector` differs by one docstring sentence in each of two files (177-21's comment correction); no code | holds |
| PROH-177-38 the tracer's condition | read: removed with 177-17, when existing nominations got cards | resolved as planned |
| PROH-177-40 ids matched before use; no page writes "editable" or "admissible" out or branches on the entity's type | read; measured: no type comparison in the nominations tree. One helper of `nominationDraft.ts` compares the type (`answersParentGroupItself`: nothing is chosen on arrival for a candidate); it is a lib module, not a page | holds |
| PROH-177-41 the entity-level load not edited | measured | holds |
| PROH-177-44 … -46 the selection never removes; Remove writes nothing; an untouched card is not sent | measured: the component cases | holds |
| PROH-177-47, -48 no raised text rendered; a refused save navigates nowhere of the page's own | read; measured | holds |
| PROH-177-49, -54 `taskState.ts` imports nothing; the details page never calls `taskStateOf` | measured | holds |
| PROH-177-50 no dialog element | measured | holds |
| PROH-177-52, -53, -55 the view, the home, stored answers | read; measured: the view's and the task state's cases | holds |
| PROH-177-56 no existing assertion weakened | read: the whole diff of the two changed specs | holds |
| PROH-177-58 no axe gate of a spec's own | relied on: the scan-wiring gate inside the lint row | holds |
| PROH-177-61 no closing run made again until green; none deleted | measured: one directory per closing run, each of one head; the red runs of the phase are kept and are of uncommitted trees or planted controls | holds; see "Accepted" for the gate driver's line |
| PROH-177-62 nothing of the legacy `preregister` chain deleted | measured | holds |

**Explicit-tier prohibitions I did not check one by one:** PROH-177-03 and -04 (plan 01's reading of the rulings and its probe objects), -29 (no existing fixture step changed in meaning: every baseline project at its count stands for it), -39 (nothing checked on arrival: the load's case "is served … with nothing chosen for an address that names nothing" and the draft's cases passed) and -51 (the store's guard: its cases under the answers lock passed).

**Flagged `unverified-prohibition — human review recommended`** (judgment-tier; my verdict is not authoritative):

| Prohibition | What I hold | What I do not |
|---|---|---|
| PROH-177-01 the executors edited none of the six files and staged nothing but their own (PROH-177-64, explicit tier, says the same of the closing plan) | the branch is unchanged and `CAND-APP-PLAN.md` is untracked | who made each commit to those files |
| PROH-177-02 no run retried until green, nothing deleted, Docker not restarted | every `-close` run is green on a committed head; every red run is kept | that no run was made and removed |
| PROH-177-05 no unchosen alternative taken up | `177-A2-FINDING.md` holds a verdict line and the built form is the chosen one | the measurement itself |
| PROH-177-10 no pgTAP fixture re-typed to pass | — | not read |
| PROH-177-15 a ratified security list moves only by what the schema reports | the census of `07` gained exactly one name | the SQL linter's lists |
| PROH-177-25, -43, -60 tests restore what they flip and rely on nothing left behind | three isolated runs green; the tests I read begin by writing their state and restore in a `finally` | every test of the spec |
| PROH-177-27 no identity by sign-up, no secret in a title or log | — | not read |
| PROH-177-57 no scan passes against a loading frame | 177-20's two planted runs are on disk | the reach of each of the thirteen entries |
| PROH-177-63 no todo closed for something not built | the pre-registration todo's Resolution names the module and the spec | the other two Resolutions |

### Behavioral Spot-Checks

| Behaviour | Command | Result | Status |
|---|---|---|---|
| The gate set | `177-gates.sh 177-verify` | 14 rows at 0 | PASS |
| The editor's unit and component cases | `vitest run` over 13 files | 683 of 683 | PASS |
| An administrator's concurrent change (P-18) | `psql`, rolled back | deleted 1, updated 1, no refusal | PASS (the behaviour is as G18 (a) states it) |
| The election-type rule for the service role on UPDATE | `psql`, rolled back | `23514` | PASS |

### Probe Execution

Not applicable: the phase declares no `probe-*.sh`. The `@probe` specs are excluded from the default suite by the wrapper's command (`--grep-invert @probe`).

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|---|---|---|---|
| — | `TBD`, `FIXME`, `XXX`, `TODO`, `HACK` in the phase's added lines | — | none found (measured) |
| `tests/tests/fixtures/contestant/contestantNominationEditor.fixture.ts` | two `eslint-disable-next-line` on Playwright locator rules, each under a `// reason:` line | Info | the fixture's own selector for the option rows |
| `nominations/+page.svelte` | `{:else if viewState === 'empty' && emptyKind}`: an empty list with no facts and no lock renders no sentence | Info | reachable only where the layout above shows its own error view, or for the moment the load's settings and the context's disagree; a component case pins it ("says nothing in place of the nominations, and offers no entry…") |
| `177-21-SUMMARY.md` § "For the verifier" | says the options error is held by a component or unit case | Warning | the sentence is false; the state is in no test (frontmatter) |

No blocker.

## Accepted, each with its named reason

| What | Reason | Where it is recorded |
|---|---|---|
| A save deletes a row an administrator added meanwhile and writes over a value the administrator changed | operator decision G18 (a), given in session on 2026-10-11 | `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` § Fill status; todo `2026-10-11-177-a-save-built-on-nominations-an-administrator-changed.md` |
| A save stored while the answers lock came on ends on the nominations view | operator decision G17 (a); built by "is the user still in the editor's addresses", an orchestrator ruling after a red browser test | the same; `177-DISPATCH.md` § "After 177-17" and § "After 177-18" |
| G1 to G16 built at their recommended options, unread | the document's own rule: an untouched item is its recommended option | the same document, § G; `177-BASELINE-FACTS.md` |
| Every U item of the UI contract at its recommended option; one spacing edit | no box ticked and no NOTE in `177-UI-SPEC.md` § PROPOSED (**read**); the view's spacing is `mt-md` / `gap-md` | `177-UI-SPEC.md`; `177-BASELINE-FACTS.md` |
| `set_entity_nominations` turns `confirmed` off beside a requested name; the trigger unchanged | a defect found and fixed in 177-17, red first in pgTAP and in a browser | `177-DISPATCH.md` § "After 177-17"; the decisions document |
| `nominationsEditable` optional | orchestrator ruling | `177-DISPATCH.md` § "After 177-19" |
| The five departures from the UI contract of item 7 | orchestrator rulings, put to the operator | `177-DISPATCH.md`; the decisions document; todo `…-small-rulings-and-loose-ends-the-plans-left-open.md` |
| The answers lock closes the editor in the frontend alone; the database enforces the nominations lock only | the roadmap's criterion names `access.nominationsLocked`; documented | the developers' page `defining-nominations`; todo `…-nomination-write-path-checks-the-database-does-not-make.md` |
| The write function accepts any organization id of the project as a parent, listed or not | not asked by a criterion; the row it makes is unconfirmed | the decisions document; the same todo |
| Twenty-eight states in no browser | filed for Phase 179 | todo `…-states-held-by-component-cases-and-seen-in-no-browser.md` (its item 3 needs the correction above) |
| The unhandled `TypeError` in `Input.svelte` | older than the phase, on a surface it did not change, fails nothing | todo `…-unhandled-typeerror-in-input-on-an-ordered-multiple-choice-with-no-value.md` |
| Whole-tree comment-hygiene residue older than the phase | the phase's own lines are clean (measured) | `177-21-SUMMARY.md` |
| **The closing gate run's own `power.txt` calls it VOID** | `177-gates.sh` writes "the run is VOID, not red — make it again under 177-21-final-r2" for any Sleep entry in the window; it wrote that line into every gate run since 177-15, the closing one included, while the host's lid was closed. The phase's rule is the other way: `177-verdict.mjs` (its header) and `177-EXECUTION-RULES.md` say the line is informative and only the wrapper's marker voids an E2E run. A suspension cannot turn a red row green; the closing run's rows sum to 200 s in a 201 s window; and **my own run of all fourteen rows on the current head has 0 Sleep entries and 14 rows at 0**. The gate rows stand on that run. The driver's sentence should be reworded before Phase 177.1 copies it | this report; `tests/e2e-runs/177-gates/177-verify` |
| The determinism ledger heads itself "SELF-TEST — not gate evidence" | the batch tool prints that for any project-scoped batch; the phase's criterion is three isolated runs of the new spec (operator decision E16 (a)), which is what the ledger holds | `tests/e2e-runs/177-determinism/177-21-final/DETERMINISM-LEDGER.md` |

## For a person

### Reads and tests

The thirteen entries of the frontmatter's `human_verification`. The todo `2026-10-11-177-reads-the-ui-contract-leaves-to-a-person.md` gives each read of the UI contract its page, width, locale and what to look for; `2026-10-11-177-native-speaker-review-nomination-editor-strings.md` holds the translation review.

### For the operator

1. **G1 to G16 are unread.** Each is built at its recommended option. G3 (the cap of ten counts an editor's own nominations) is the one the research disagrees with: it recommends (b).
2. **Three departures from the UI contract** await one ruling each: Continue on the election step carries no stored constituency; Keep is described by the removed line; `role="status"` on one of two sentences of the same shape.
3. **Whether the trigger's two rules should swap**, so that a direct edit by an entity's user can give a confirmed nomination a requested name.
4. **Whether an edit of the symbol or the party should hide a nomination that is already published** until it is confirmed again. That is what the tree does; you have not been asked before.
5. **`nominationsEditable` left optional**, read as not editable.
6. **Who owns the twenty-eight states in no browser**: the todo names Phase 179 by extension of F6 (a), which was given for Phase 176's nineteen.
7. **`REQUIREMENTS.md`**: NOM-03, NOM-04, NOM-05, NOM-06 and NOM-08 are satisfied by the tree and still unticked.

## What I did not check

- The full E2E suite was not re-run. I recounted the closing run's and the three batch runs' reports and compared the closing run with the baseline.
- The whole-tree `hygiene-grep-report.sh --assert-clean`, the three skill audits and the counts 177-21 wrote into the skills.
- The sentences of the docs pages and the READMEs against the code, beyond the two lines of `06d81c75e` and the Publishers' Guide's sentence on one constituency.
- The 2,312 pgTAP assertions one by one: I read the functions and the policies they assert, counted the rule tags of the four files that carry the phase, and ran the suite.
- The reach and the marker of each of the thirteen scan entries, and the internals of the fixtures (1,152 and 712 lines).
- The 97 tests of the nominations spec one by one: I read the parts named in this report and the titles of all.
- Server-rendered markup against hydrated markup for the view's six states.
- Whether each of the 78 commits leaves the committed suite green; I checked that every `-close` run is green on its own head.
- A second election round, the cap in a browser, and two saves in parallel: as 177-21 says, nothing holds them.
- No person's read was made, by me or by anyone.

## Gaps Summary

None. Every roadmap criterion is met by code that I read and by tests that I ran or recounted, on one code head that is green under fourteen gate rows, the full suite and three isolated runs. What keeps the phase from `passed` is listed above: five backstop truths, one behaviour no test exercises (the options error — and the closing summary's claim that a component case holds it is wrong), and eleven prohibitions that are a matter of the executors' account.

---

_Verified: 2026-10-11T14:56:00Z_
_Verifier: Claude (gsd-verifier)_
