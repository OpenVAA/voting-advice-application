---
phase: 175-organization-editing-profile-questions-preview
reviewed: 2026-10-22T20:01:48Z
depth: standard
files_reviewed: 122
files_reviewed_list:
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/parseJsonbColumn.ts
  - apps/frontend/src/lib/api/base/dataWriter.type.ts
  - apps/frontend/src/lib/api/base/universalDataWriter.ts
  - apps/frontend/src/lib/components/errorMessage/ErrorMessage.svelte
  - apps/frontend/src/lib/components/errorMessage/ErrorMessage.svelte.test.ts
  - apps/frontend/src/lib/components/input/Input.color.svelte.test.ts
  - apps/frontend/src/lib/components/input/Input.described.svelte.test.ts
  - apps/frontend/src/lib/components/input/Input.focusReturn.svelte.test.ts
  - apps/frontend/src/lib/components/input/Input.labelWrap.svelte.test.ts
  - apps/frontend/src/lib/components/input/Input.requiredLocale.svelte.test.ts
  - apps/frontend/src/lib/components/input/Input.svelte
  - apps/frontend/src/lib/components/input/Input.type.ts
  - apps/frontend/src/lib/components/input/parts/ImagePart.svelte
  - apps/frontend/src/lib/components/input/parts/ImagePart.type.ts
  - apps/frontend/src/lib/components/input/parts/MultilingualTextPart.svelte
  - apps/frontend/src/lib/components/input/parts/MultilingualTextPart.type.ts
  - apps/frontend/src/lib/components/input/parts/MultipleTextPart.svelte
  - apps/frontend/src/lib/components/input/parts/MultipleTextPart.type.ts
  - apps/frontend/src/lib/components/input/parts/SelectMultiplePart.svelte
  - apps/frontend/src/lib/components/input/parts/SelectMultiplePart.type.ts
  - apps/frontend/src/lib/components/input/PreviewAllInputs.svelte
  - apps/frontend/src/lib/components/input/shared.ts
  - apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte
  - apps/frontend/src/lib/contestant/utils/entityDescriptor.test.ts
  - apps/frontend/src/lib/contestant/utils/entityDescriptor.ts
  - apps/frontend/src/lib/contestant/utils/hideIfMissingAnswers.test.ts
  - apps/frontend/src/lib/contestant/utils/hideIfMissingAnswers.ts
  - apps/frontend/src/lib/contestant/utils/nameRule.test.ts
  - apps/frontend/src/lib/contestant/utils/nameRule.ts
  - apps/frontend/src/lib/contestant/utils/opinionQuestionsState.test.ts
  - apps/frontend/src/lib/contestant/utils/opinionQuestionsState.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts
  - apps/frontend/src/lib/contexts/utils/questionRollup.test.ts
  - apps/frontend/src/lib/contexts/utils/questionRollup.ts
  - apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.test.ts
  - apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte.test.ts
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.type.ts
  - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
  - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte.test.ts
  - apps/frontend/src/lib/utils/color/ensureColors.test.ts
  - apps/frontend/src/lib/utils/color/ensureColors.ts
  - apps/frontend/src/lib/utils/localizedText.test.ts
  - apps/frontend/src/lib/utils/localizedText.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/page.svelte.test.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings/+page.svelte
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - apps/supabase/supabase/schema/011-validation-functions.sql
  - apps/supabase/supabase/schema/100-tenancy.sql
  - apps/supabase/supabase/schema/102-entities.sql
  - apps/supabase/supabase/schema/103-questions.sql
  - apps/supabase/supabase/schema/301-auth-functions.sql
  - apps/supabase/supabase/schema/302-rls.sql
  - apps/supabase/supabase/schema/303-column-grants.sql
  - apps/supabase/supabase/schema/501-bulk-operations.sql
  - apps/supabase/supabase/seed.sql
  - apps/supabase/supabase/tests/database/00-helpers.test.sql
  - apps/supabase/supabase/tests/database/05-organization-admin.test.sql
  - apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
  - apps/supabase/supabase/tests/database/15-visibility-flags.test.sql
  - apps/supabase/supabase/tests/database/19-entity-immutability.test.sql
  - apps/supabase/supabase/tests/database/20-storage-authority.test.sql
  - apps/supabase/supabase/tests/database/22-content-policies.test.sql
  - apps/supabase/supabase/tests/database/23-nominations-write.test.sql
  - apps/supabase/supabase/tests/database/40-entity-type-list.test.sql
  - apps/supabase/supabase/tests/database/41-entity-color.test.sql
  - packages/app-shared/src/data/schemas/storedSettings.schema.test.ts
  - packages/app-shared/src/data/schemas/storedSettings.schema.ts
  - packages/app-shared/src/settings/dynamicSettings.ts
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - packages/dev-seed/src/template/permittedKeys.ts
  - packages/dev-seed/src/template/types.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts
  - packages/dev-seed/src/templates/index.ts
  - packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts
  - packages/dev-seed/tests/assertKnownRowProps.test.ts
  - packages/dev-seed/tests/fixtures/negctl-nominations-entity-type-camel.ts
  - packages/dev-seed/tests/fixtures/negctl-nominations-entity-type.ts
  - packages/dev-seed/tests/template/permittedKeys.test.ts
  - packages/dev-seed/tests/template/strictRowTypes.type-test.ts
  - packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts
  - scripts/assert-a11y-scan-wiring.mjs
  - tests/playwright.config.ts
  - tests/tests/fixtures/contestant/contestant-entity-selection.ts
  - tests/tests/fixtures/contestant/contestantEntityHomePage.fixture.ts
  - tests/tests/fixtures/contestant/contestantNoQuestionsPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantPreviewPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts
  - tests/tests/fixtures/contestant/contestantQuestionPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts
  - tests/tests/fixtures/contestant/perm-organization-editing.ts
  - tests/tests/fixtures/shared/multilingualTextFieldFixture.fixture.ts
  - tests/tests/fixtures/shared/navMenu.fixture.ts
  - tests/tests/fixtures/shared/pageGeometry.fixture.ts
  - tests/tests/fixtures/voter/entityDetails.fixture.ts
  - tests/tests/fixtures/voter/organizationDetail.fixture.ts
  - tests/tests/setup/perm/perm-organization-editing.setup.ts
  - tests/tests/setup/perm/perm-organization-editing.teardown.ts
  - tests/tests/setup/shared/registerAndStoreSession.ts
  - tests/tests/specs/a11y/contestant-a11y.spec.ts
  - tests/tests/specs/contestant/contestant-journey.spec.ts
  - tests/tests/specs/perm/perm-disable-allow-open.spec.ts
  - tests/tests/specs/perm/perm-hide-hero.spec.ts
  - tests/tests/specs/perm/perm-organization-editing.spec.ts
  - tests/tests/utils/axeScan.ts
  - tests/tests/utils/contestantAxeScan.ts
  - tests/tests/utils/contestantEntityUrl.ts
  - tests/tests/utils/permOrganizationEditingData.ts
  - tests/tests/utils/supabaseAdminClient.ts
  - tests/tests/utils/testIds.ts
findings:
  critical: 0
  warning: 4
  info: 6
  total: 10
status: issues_found
---

# Phase 175: Code Review Report

**Reviewed:** 2026-10-22T20:01:48Z
**Depth:** standard
**Files Reviewed:** 122
**Status:** issues_found

## Summary

This is a retroactive review of the code at HEAD. It concentrates on what the 175-NN commits introduced, in the range `76a9a6ae6..6d2feca05`. Later phases (176 to 179) have rewritten several of the listed files: the entity home page, the contestant context, the data writer and the schema. Lines those phases own were read for context but not judged. Findings already recorded in `177.1-REVIEW.md` and `179-REVIEW.md` are not repeated.

The security questions the orchestrator asked about hold up:

- **Own columns only.** An organization editor's writes go through `entity_update_own_organizations`. That policy asks `user_can('entity', id, 'entity.edit_answers', 'organization')` in both `USING` and `WITH CHECK`, and the column grant keeps `project_id`, `external_id` and the audit columns out of reach. `confirmed` is gated by rule 1 of `enforce_entity_immutability`. The phase adds `short_name` to the freeze on all four entity tables, listing it both in `UPDATE OF` and in `TG_ARGV`. The writer's closed `ENTITY_PROPERTY_COLUMNS` map refuses any other property before a request is made.
- **Colour.** `validate_entity_color` closes CSS injection through `color` for every writer. `ensureColors` no longer passes through text it cannot parse.
- **Nominations lock.** `access.nominationsLocked` is read as the JSON boolean `true` only. A missing project counts as locked; a missing row or key counts as unlocked.
- **Preview.** The preview reads only the caller's own entity, through `get_entity_user_data`, and an organization's preview leaves out the `children` tab. Nothing of other entities is put into the contestant data root.
- **Context reactivity.** No phase-175 Svelte code destructures a reactive accessor or binds `dataRoot` to an alias.
- **`access.answersLocked`** is enforced only on the client. That is a documented design decision (rls-policy-map), not a defect of this phase.

The defects are in edge behaviour and robustness. In descending order of impact:

- **Hidden organizations.** Under the shipped settings, voters do not see an organization that has no candidate visible under it, even when it has answered its own questions, and the organization is told nothing of it. The phase's own dataset turns the setting off to get around this.
- **Colour edit crash.** A stored colour that the new database rule accepts crashes the store's colour comparison.
- **Dead image branches.** The image branches the phase kept in the property writer are unreachable, and one of them would write the wrong shape.
- **Partial saves.** A save that partly succeeds leaves stored properties staged, so the logo is uploaded a second time.

## Warnings

### WR-01: Under the shipped settings an organization with no candidate visible under it is hidden from voters, whatever it answered, and is not told

**File:** `apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts:91-102` (with `packages/app-shared/src/settings/dynamicSettings.ts:36-39`, `apps/frontend/src/lib/contestant/utils/hideIfMissingAnswers.ts:24-25`, `packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts:14`)

**Issue:** The phase lets an organization fill in its own profile and answer the opinion questions addressed to it, so that voters can see and match it. But the organization branch that reads the **candidate** key is still in the voter filter:

```ts
if (entityType === ENTITY_TYPE.Organization && hideIfMissing?.candidate) {
  ...
  nominations = nominations.filter((n) => (n as OrganizationNomination).data.candidateNominationIds?.length);
}
```

This drops every organization nomination whose `candidateNominationIds` is empty or undefined. That includes organizations that never had a candidate, not only those whose candidates were all filtered out. The shipped default is `hideIfMissingAnswers.candidate: true`. On a fresh project, therefore, an organization with no confirmed and fully answered candidate disappears from the voter's results, whatever its own answers are.

The organization is not told either. `isHiddenIfMissingAnswers` reads only the organization key, which defaults to `false`. The home page, the profile page and the logout modal therefore never tell it that it is hidden. The phase notes this in the template header ("hiding them also removes every organization left without a visible candidate") and sets `candidate: false` in its own dataset, so no test covers the shipped default. RESEARCH T-8 recorded that "the warning and the behaviour stay in step for both types". That is not true for this case.

**Fix:** Make the candidate key remove only the organizations it emptied, and leave organizations that had no candidate alone:

```ts
if (entityType === ENTITY_TYPE.Organization && hideIfMissing?.candidate && candidateNominationsWithMissingAnswers) {
  nominations = nominations.filter((n) => {
    const org = n as OrganizationNomination;
    const before = org.data.candidateNominationIds ?? [];
    if (before.length === 0) return true; // had none: the candidate key decides nothing for it
    org.data.candidateNominationIds = before.filter((id) => !candidateNominationsWithMissingAnswers.has(id));
    return org.data.candidateNominationIds.length > 0;
  });
}
```

If hiding organizations without candidates is intended, `isHiddenIfMissingAnswers` must report it to the organization as well. Add a unit case that covers the shipped default with an organization that has no candidate.

### WR-02: Editing the colour throws when the stored colour has no `normal`, a value the new database rule accepts

**File:** `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:76-80, 100` (with `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:677-691`, `apps/frontend/src/lib/api/adapters/supabase/utils/parseJsonbColumn.ts:51`, `apps/supabase/supabase/schema/011-validation-functions.sql:738, 764-779`)

**Issue:** `validate_entity_color` accepts `{ "dark": "#123456" }` and `{ "normal": null, "dark": ... }` ("each absent, a JSON null, or a string…"). `_getEntityUserData` passes `entity.color` through `toDataObject` without parsing, so the store holds that raw object. When the editor then touches the colour field, `changedProperties` calls `comparableColor(entity.color)`, and that calls `parseColorString(color.normal)` with `undefined`. `parseColorString` starts with `color.replace(...)`, so it throws a `TypeError` out of `setProperty`, which `Input`'s `onChange` calls. The colour is never staged, but the field and swatch show the new value. If the user then presses Save, the page reports success and moves on, and the colour edit is lost.

The two sides also disagree on what a colour is. The database accepts a colour without `normal`. The client's `StoredColorSchema` requires `normal`, so every read of such a row logs an `error`-level parse failure.

**Fix:** Pick one shape. Either require `normal` in the trigger, which would refuse `{ dark }` alone and `normal: null`, or make the client tolerate its absence. In either case, compare colours defensively:

```ts
function comparableColor(color: Colors | EditableEntityColor | null | undefined): string | null {
  const normal = color?.normal;
  if (typeof normal !== 'string' || normal === '') return null;
  const rgb = parseColorString(normal);
  return rgb ? rgbToHex(rgb) : normal;
}
```

Also parse `color` in `_getEntityUserData` with `colorOf(parseColorColumn(entityRow.color, …))`, as the read-back after a write already does, so that the store never holds an unvalidated colour.

### WR-03: The image branches `_updateEntityProperties` kept are unreachable, and one would store the wrong shape

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:837-866` (with `apps/frontend/src/lib/api/base/universalDataWriter.ts:141-144`, `apps/frontend/src/lib/api/base/dataWriter.type.ts:744`)

**Issue:** The phase rewrote `_updateEntityProperties` and its public guard, but kept the old image handling. `UniversalDataWriter.updateEntityProperties` now throws for any `image` without `file`, `null` included, and `EditableEntityProps.image` is typed `ImageWithFile` only. So:

- `if (image === null) updateFields[imageColumn] = null;` can never run. An entity cannot remove its logo or portrait, although the adapter appears to support it.
- `else if (image.url) updateFields[imageColumn] = image;` can never run. If the guard is ever relaxed, this branch writes the application `Image` into a column that holds `StoredImage` (`{ path }`). For an image picked in `Input` the `url` is a `data:` URL, the whole file base64-encoded. That value fails `StoredImageSchema` on every later read, so the logo disappears, and the row grows by the size of the file.
- The no-op read-back for "an image that carries no uploadable file" is reachable only when `File` is undefined.

**Fix:** Remove the two dead branches and leave a single upload path. If clearing an image is wanted, accept `image: null` in the type and the universal guard, and keep only the `null` arm. Never write `image` as given:

```ts
if (image !== undefined && imageColumn) {
  updateFields[imageColumn] =
    image === null ? null : { path: await this.#uploadEntityFile({ projectId: this.projectId, table, id, file: image.file! }) };
}
```

### WR-04: A save that partly succeeds leaves stored properties staged, so a retry uploads the logo again and the user is told nothing was saved

**File:** `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:440-476`

**Issue:** `save()` writes the non-name properties (image, colour) and then the names, in two awaited calls. When the first call stores and the second rejects for any reason other than the name refusal (a network error, an RLS miss that `.single()` reports), the rejection leaves `save()` before the reset block. Then:

- the image and colour that were stored stay in `#staged`, so `hasUnsaved` stays true and the next Save uploads the logo again under a new UUID. The first object becomes an orphan until the entity is deleted;
- `listedPropertySaved` is never returned, so the page does not re-read the entity list, and the menu keeps the old name or colour;
- the profile page shows `saveFailed`, although part of the save was stored.

The same applies to answers: answers stored before a failed property write stay in the draft. Sending them again is idempotent, so only the properties matter here.

**Fix:** Unstage each write's properties as soon as that write is merged, and let the rejection carry on afterwards:

```ts
savedProperties.push(...given);
if (this.#isLoaded(key)) {
  this.#mergeEntityProperties(result);
  this.#unstage(given);
}
```

Or catch the second write's rejection and return a distinct `partial` result that the page can tell apart from a failure.

## Info

### IN-01: Saving an organization's colour discards the stored dark-theme colour

**File:** `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:100-101`, `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:233-242`

**Issue:** Both the store and `storedColorOf` reduce the colour to `{ normal }` and refuse any other member. Every shipped seed stores an explicit `dark` (for example `default.ts:91`, `e2e/base.ts:448`). Once an organization editor changes the colour, the administrator's chosen dark-theme colour is replaced by one `ensureColors` derives. This follows the context decision that "the dark-theme colour is derived on read", but the loss is silent, and neither the info line nor the docs mention it.

**Fix:** Keep `dark` when only `normal` changes, or state in `contestantApp.basicInfo.colorInfo` and in the publisher docs that an editor's colour replaces both theme colours.

### IN-02: One hex-colour normalisation written three times, with four regexes

**File:** `apps/frontend/src/lib/components/input/Input.svelte:383-433` (`TYPED_COLOR_REGEX`, `HEX_COLOR_REGEX`, `toHexColor`), `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:233-242` (`storedColorOf`), `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:76-80` (`comparableColor`), `apps/frontend/src/lib/utils/color/ensureColors.ts:9`, `apps/frontend/src/lib/api/adapters/supabase/utils/parseJsonbColumn.ts:44`

**Issue:** Each site does its own `parseColorString` and `rgbToHex` step, and each has a slightly different idea of what counts as a colour. `STORED_HEX_COLOR` already exists for this. The checklist item "no code that is repeated" applies.

**Fix:** Export one `toStoredHexColor(text): string | undefined` from `$lib/utils/color` and use it at all three sites.

### IN-03: Whether an entity type has names by locale is read from the write-permission map

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:694`

**Issue:** `Object.hasOwn(ENTITY_PROPERTY_COLUMNS[served], 'name')` decides the shape of what is read from what an editor may write. If the organization's `name` ever stops being editable, the read stops returning `localizedNames`, and the profile and the name rule lose their source.

**Fix:** Decide it from a separate per-type fact, for example a `LOCALIZED_NAME_TYPES` set or the descriptor's `identityFields`.

### IN-04: `saved.shortName` is `undefined` where its type says `null`

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:889` (with `apps/frontend/src/lib/api/base/dataWriter.type.ts:588-591`)

**Issue:** `getLocalized(...)` returns `undefined` for a short name that no locale holds. `SavedEntityProps.shortName` is documented as "or `null` when it has none", so callers that test `=== null` misread a cleared short name.

**Fix:** `saved.shortName = getLocalized(localizedNames.shortName, effectiveLocale, this.defaultLocale) ?? null;`

### IN-05: The colour picker carries no description or invalid state

**File:** `apps/frontend/src/lib/components/input/Input.svelte:625-632`

**Issue:** The hex text field gets `controlAria` (`aria-describedby` naming the info and error lines, and `aria-invalid`), but the `<input type="color">` beside it, which is the second focusable control, gets neither. A screen-reader user who tabs to the picker after a refused entry hears no error.

**Fix:** Add `aria-describedby={describedBy}` to the picker, and `aria-invalid` when it applies.

### IN-06: `questionsReady` stays false for good when a nominated election is missing from the data root

**File:** `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts:314-319, 350-353`

**Issue:** `dr.getElection` throws for an id that is not loaded. The catch then sets `#selectedElections = []`, the rollup takes the `elections.length === 0` branch, and `#questionsReady` is written `false`. For an entity with a nomination, the task state is then never `known`, so the home page shows its loading main action and its invisible placeholders indefinitely, with only a log line. The flag the phase added to tell "not loaded" from "no questions" cannot tell "failed" from either of them.

**Fix:** Skip the elections that cannot be resolved instead of emptying the list, or expose a failed state that the home page renders as an error.

---

_Reviewed: 2026-10-22T20:01:48Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
