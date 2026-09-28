# Phase 5: Configuration Variants - Research

**Researched:** 2026-03-09
**Domain:** Playwright multi-project configuration testing with variant datasets
**Confidence:** HIGH

## Summary

Phase 5 creates multiple Playwright projects, each with a distinct dataset, to test configuration combinations that the default single-election/single-constituency setup cannot cover. The existing test infrastructure already handles everything needed: `StrapiAdminClient` for data import/delete/settings, JSON dataset files for test data, and the project dependencies pattern for sequencing setup-test-teardown chains.

The core challenge is designing overlay datasets that trigger the correct application behavior -- multi-election selection pages, constituency selection pages, hierarchical constituency implication, `startFromConstituencyGroup` reversed flow, and `disallowSelection` auto-selection. The frontend routing logic in `(located)/+layout.ts` redirects to `/elections` when elections cannot be implied, and to `/constituencies` when constituencies cannot be implied. The `getImpliedElectionIds()` function implies elections only when there is exactly one OR when `disallowSelection` is true. The `getImpliedConstituencyIds()` function implies constituencies only when ALL selected elections have `singleConstituency` (exactly one constituency group with exactly one constituency).

**Primary recommendation:** Build 3 overlay JSON files (multi-election, constituency, startFromConstituencyGroup) and a TypeScript merge utility. Implement 4-5 Playwright projects (data-setup-variant -> variant-tests) with sequential execution after the default suite's teardown. Results section variants reuse the default dataset with settings toggles.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Dataset strategy:** Shared base + overlay pattern -- reuse `default-dataset.json` as the base, with per-variant overlay files that add/modify entries. A common merge utility composes base + overlay at import time in each variant's data-setup.
- **4 overlay files:** multi-election-overlay.json, constituency-overlay.json, startfromcg-overlay.json, and no overlay for results section tests (settings toggle on default dataset).
- **Project topology:** Each variant gets its own dedicated data-setup project. Variant projects are fully independent from existing projects. Sequential execution after all default projects finish. Single `yarn test:e2e` command runs everything.
- **Journey depth:** Selection + results verification. Skip deep entity detail testing. Multi-election results verify switching between elections shows different result sets. Election/constituency-specific questions verify correct count and spot-check at least one title. `disallowSelection` verifies election selection bypassed AND results page shows all elections in accordion.
- **5 constituency scenarios** (row 1 already tested):
  1. ~~1 election, 1 constituency (auto) -- Phase 3 default~~
  2. 2 elections, each with 1 constituency -- election selection only
  3. 1 election, multiple constituencies -- constituency selection
  4. 2 elections, hierarchical constituencies (regions/municipalities, superset) -- combined selection
  5. `startFromConstituencyGroup` mode -- constituency-first flow with orphan municipality
- **Results section variants (CONF-05, CONF-06):** Settings toggle on default dataset -- set `results.sections` to `['candidate']` or `['organization']` via API. No extra overlay datasets needed. Standalone project using default data-setup.
- **Variant datasets include election-scoped and constituency-scoped questions** for question filtering verification.
- **`disallowSelection` mode** tested as a settings toggle on the multi-election dataset.

### Claude's Discretion
- Exact overlay file structure and merge utility implementation
- Teardown strategy (shared vs per-variant)
- Spec file naming and organization within each variant project
- Page objects for election selection and constituency selection pages
- How many questions to answer in each variant journey (minimum needed to reach results)
- Exact data values in overlay datasets (candidate names, constituency names, question texts)

### Deferred Ideas (OUT OF SCOPE)
- Full constituency overlap matrix (no-overlap, partial overlap, 3+ elections)
- Data-driven results section testing (no nominations for an entity type)
- `elections.startFromConstituencyGroup` with 3+ elections
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONF-01 | Single election configuration tested end-to-end (no election selection step) | Already tested in Phase 3 (auto-implied). Phase 5 validates by contrast with multi-election. |
| CONF-02 | Multiple elections configuration tested (election selection, per-election results) | Multi-election overlay adds 2nd election. Test navigates election selector, verifies per-election results in accordion. |
| CONF-03 | Constituency enabled configuration tested (constituency step in flow) | Constituency overlay adds multiple constituencies to trigger constituency selector. Combined overlay tests hierarchical selection. |
| CONF-04 | Constituency disabled configuration tested (no constituency step) | Multi-election overlay with single constituencies per election validates auto-implied constituency (no selector shown). |
| CONF-05 | Candidates-only results section configuration tested | Settings toggle `results.sections: ['candidate']` on default dataset. Verify party tab disappears, candidate section visible. |
| CONF-06 | Organizations-only results section configuration tested | Settings toggle `results.sections: ['organization']` on default dataset. Verify candidate tab disappears, party section visible. |
| CONF-07 | Separate test datasets created for each configuration variant | 3 overlay JSON files + merge utility. Each variant data-setup composes base + overlay. |
| CONF-08 | Playwright projects configured per dataset for multi-configuration testing | New projects in playwright.config.ts with dependency chains. Sequential after default suite teardown. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Playwright | 1.58.2 | E2E test framework | Already installed and configured in project |
| TypeScript | ~5.x | Type-safe test code | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| StrapiAdminClient | (internal) | Data import/delete/settings API | All setup/teardown/settings operations |
| testIds | (internal) | Test ID constants | All element locators |

### Alternatives Considered
None needed -- all tooling is established from prior phases.

## Architecture Patterns

### Recommended File Structure
```
tests/tests/
  data/
    default-dataset.json          # Existing base
    voter-dataset.json            # Existing voter data
    candidate-addendum.json       # Existing candidate data
    overlays/
      multi-election-overlay.json # Adds 2nd election, its constituency, questions, candidates, nominations
      constituency-overlay.json   # Adds multiple constituencies, hierarchical groups, scoped questions
      startfromcg-overlay.json    # Like constituency but with orphan municipality and reversed flow data
  utils/
    mergeDatasets.ts              # Deep merge utility for base + overlay composition
  setup/
    data.setup.ts                 # Existing default setup
    data.teardown.ts              # Existing default teardown
    variant-data.setup.ts         # Generic variant setup: delete prefix, import merged dataset, configure settings
    variant-data.teardown.ts      # Generic variant teardown: delete all test- prefix data
  specs/
    variants/
      multi-election.spec.ts      # CONF-02, CONF-04: election selection + per-election results + disallowSelection
      constituency.spec.ts        # CONF-03: constituency selection, hierarchical selection
      startfromcg.spec.ts         # startFromConstituencyGroup reversed flow
      results-sections.spec.ts    # CONF-05, CONF-06: candidates-only and organizations-only results
```

### Pattern 1: Base + Overlay Dataset Merging
**What:** A utility function that deep-merges a base dataset with an overlay. Overlay arrays append to base arrays (never replace). Overlay entries with matching `externalId` update existing entries.
**When to use:** Every variant data-setup project.
**Example:**
```typescript
// mergeDatasets.ts
type Dataset = Record<string, Array<Record<string, unknown>>>;

/**
 * Merge a base dataset with an overlay. Overlay arrays are appended to
 * base arrays. If an overlay entry has the same externalId as a base entry,
 * the overlay entry replaces it (update semantics).
 */
export function mergeDatasets(base: Dataset, overlay: Dataset): Dataset {
  const result: Dataset = {};

  // Copy all base collections
  for (const [key, entries] of Object.entries(base)) {
    result[key] = [...entries];
  }

  // Merge overlay collections
  for (const [key, overlayEntries] of Object.entries(overlay)) {
    if (!result[key]) {
      result[key] = [...overlayEntries];
      continue;
    }

    for (const overlayEntry of overlayEntries) {
      const eid = overlayEntry.externalId as string | undefined;
      if (eid) {
        const existingIndex = result[key].findIndex(
          (e) => (e.externalId as string) === eid
        );
        if (existingIndex >= 0) {
          result[key][existingIndex] = overlayEntry; // Update
          continue;
        }
      }
      result[key].push(overlayEntry); // Append
    }
  }

  return result;
}
```

### Pattern 2: Variant Data Setup Project
**What:** A reusable setup pattern that imports a merged dataset and configures variant-specific app settings.
**When to use:** Each variant gets its own setup file that calls the merge utility.
**Example:**
```typescript
// variant-multi-election.setup.ts
import { expect, test as setup } from '@playwright/test';
import defaultDataset from '../data/default-dataset.json' assert { type: 'json' };
import voterDataset from '../data/voter-dataset.json' assert { type: 'json' };
import overlay from '../data/overlays/multi-election-overlay.json' assert { type: 'json' };
import { mergeDatasets } from '../utils/mergeDatasets';
import { StrapiAdminClient } from '../utils/strapiAdminClient';

const TEST_DATA_PREFIX = 'test-';

setup('import multi-election dataset', async () => {
  const client = new StrapiAdminClient();
  await client.login();

  // Delete existing test data
  await client.deleteData({
    nominations: TEST_DATA_PREFIX,
    alliances: TEST_DATA_PREFIX,
    parties: TEST_DATA_PREFIX,
    questions: TEST_DATA_PREFIX,
    questionCategories: TEST_DATA_PREFIX,
    constituencyGroups: TEST_DATA_PREFIX,
    constituencies: TEST_DATA_PREFIX,
    elections: TEST_DATA_PREFIX,
    questionTypes: TEST_DATA_PREFIX
  });

  // Import merged dataset
  const merged = mergeDatasets(
    mergeDatasets(defaultDataset, voterDataset),
    overlay
  );
  const importResult = await client.importData(merged as Record<string, Array<unknown>>);
  expect(importResult.type).toBe('success');

  // Configure variant-specific settings
  await client.updateAppSettings({
    questions: {
      categoryIntros: { show: false },
      questionsIntro: { allowCategorySelection: false, show: false },
      showResultsLink: true
    },
    entities: {
      hideIfMissingAnswers: { candidate: false },
      showAllNominations: true
    },
    notifications: { voterApp: { show: false } },
    analytics: { trackEvents: false }
  });

  await client.dispose();
});
```

### Pattern 3: Playwright Config Project Dependencies Chain
**What:** New projects in playwright.config.ts with dependency chains that ensure variant projects run AFTER the default suite completes.
**When to use:** Adding new variant test projects.
**Example:**
```typescript
// In playwright.config.ts projects array, add after existing projects:

// Variant: multi-election
{
  name: 'data-setup-multi-election',
  testMatch: /variant-multi-election\.setup\.ts/,
  teardown: 'data-teardown-variants',
  dependencies: ['data-teardown']  // Run after default suite cleans up
},
{
  name: 'variant-multi-election',
  testDir: './tests/specs/variants',
  testMatch: /multi-election\.spec\.ts/,
  fullyParallel: false,
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-multi-election']
},
```

### Pattern 4: Variant Voter Journey (Selection + Results)
**What:** Navigate through election/constituency selection, answer minimum questions, verify results.
**When to use:** Each variant spec tests a specific selection flow variant.
**Example:**
```typescript
test('should show election selection and display per-election results', async ({ page }) => {
  test.setTimeout(60000);

  // Navigate to home
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();

  // Intro page
  await page.getByTestId(testIds.voter.intro.startButton).waitFor({ state: 'visible' });
  await page.getByTestId(testIds.voter.intro.startButton).click();

  // Should land on election selection (multi-election = cannot imply)
  const electionsList = page.getByTestId(testIds.voter.elections.list);
  await expect(electionsList).toBeVisible({ timeout: 10000 });

  // Select both elections and continue
  const continueButton = page.getByTestId('voter-elections-continue');
  await continueButton.click();

  // Answer questions...
  // (navigateToFirstQuestion won't work here -- it assumes auto-implied elections)

  // Verify results with election accordion
  const electionAccordion = page.getByTestId('voter-results-election-select');
  await expect(electionAccordion).toBeVisible();
});
```

### Anti-Patterns to Avoid
- **Reusing `navigateToFirstQuestion()` for multi-election/constituency variants:** This helper assumes auto-implied elections and constituencies. Variant specs must handle the selection pages explicitly.
- **Modifying the default dataset files:** Overlays should ONLY add new entries or (rarely) update entries via matching `externalId`. The base files must remain untouched for the default suite.
- **Running variant projects in parallel with each other:** Each variant loads different data, so they MUST run sequentially (one variant at a time). Within a variant's specs, use `fullyParallel: false`.
- **Forgetting to suppress popups:** Every variant setup must set `notifications.voterApp.show: false` and `analytics.trackEvents: false` to prevent dialog overlays.
- **Incomplete sibling settings in `updateAppSettings`:** Always send COMPLETE sibling settings to avoid Pitfall 2 (Strapi replaces entire components, not just specified fields).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data import/delete | Custom API calls | `StrapiAdminClient.importData()` / `deleteData()` | Already handles auth, retries, JSON.stringify |
| App settings changes | Direct Strapi API calls | `StrapiAdminClient.updateAppSettings()` | Handles content-manager admin API format |
| Element location | CSS/XPath selectors | `testIds` constants + `getByTestId()` | ESLint `no-raw-locators` rule enforced |
| Voter navigation | Custom page navigation | Existing `buildRoute()` utility | Uses actual ROUTE definitions from frontend |
| Dataset composition | Manual JSON editing | `mergeDatasets()` utility function | Prevents errors, keeps base datasets clean |

**Key insight:** Phase 5 is entirely about data orchestration and test structure. No new application code is needed -- only new datasets, setup projects, and spec files.

## Common Pitfalls

### Pitfall 1: Strapi Settings Overwrite (Pitfall 2 from Phase 4)
**What goes wrong:** `updateAppSettings` replaces entire JSON components, not individual fields. Sending `{ results: { sections: ['candidate'] } }` wipes out `results.showFeedbackPopup`, `results.cardContents`, etc.
**Why it happens:** Strapi content-manager PUT replaces at the component level.
**How to avoid:** Always send ALL sibling fields in the same component when updating any field.
**Warning signs:** Tests passing in isolation but failing when run in sequence; random popups appearing.

### Pitfall 2: Foreign Key Constraint Violations on Delete
**What goes wrong:** Deleting elections before nominations causes FK violations.
**Why it happens:** The import data has relational dependencies: nominations -> candidates, elections, constituencies, parties.
**How to avoid:** Delete in reverse import order: nominations -> alliances -> parties -> questions -> questionCategories -> constituencyGroups -> constituencies -> elections -> questionTypes.
**Warning signs:** `deleteData` returning `type: 'failure'`.

### Pitfall 3: navigateToFirstQuestion Assumes Auto-Implied
**What goes wrong:** The `navigateToFirstQuestion()` helper clicks Home -> Start -> Intro -> Start and expects to land on the first question. With multi-election or multi-constituency configs, the user is redirected to selection pages instead.
**Why it happens:** The `(located)/+layout.ts` gate checks `getImpliedElectionIds()` and `getImpliedConstituencyIds()` -- if either returns `undefined`, it redirects to the respective selection page.
**How to avoid:** Write variant-specific navigation that handles election/constituency selection pages. Create a `navigateToFirstQuestionWithSelections()` helper or handle inline.
**Warning signs:** Tests timing out waiting for answer options.

### Pitfall 4: createOrUpdate vs Import Order
**What goes wrong:** Importing elections before their constituency groups exist causes failures because elections reference constituency groups via externalId.
**Why it happens:** `parseExternalRelations` resolves `{ externalId: "..." }` references immediately during import.
**How to avoid:** Overlay JSON must list entities in dependency order: questionTypes -> constituencies -> constituencyGroups -> elections -> questionCategories -> questions -> parties -> candidates -> nominations. The `importData` endpoint processes collections in the order they appear in the JSON.
**Warning signs:** Import result showing `type: 'failure'`.

### Pitfall 5: Shared vs Variant Candidates
**What goes wrong:** Candidates need nominations in the variant's elections/constituencies. Using default candidates without variant-specific nominations means they won't appear in variant results.
**Why it happens:** Nominations are election+constituency specific. A candidate nominated for election-1/constituency-alpha won't appear in election-2's results.
**How to avoid:** Overlay files MUST include nominations that link candidates to the variant's elections and constituencies. Can reuse existing candidates but need new nomination entries.
**Warning signs:** Results page showing 0 candidates in variant elections.

### Pitfall 6: Constituency Hierarchy and Implication
**What goes wrong:** Constituency groups with overlapping hierarchies fail `getApplicableConstituency()` if a constituency belongs to multiple groups that an election references.
**Why it happens:** `getApplicableConstituency()` throws if more than one constituency matches.
**How to avoid:** Design constituency hierarchy so each election's constituency group contains non-overlapping constituencies. Use the `parent` relation on constituencies for hierarchy, and separate constituency groups for each election.
**Warning signs:** Runtime errors about "more than one constituency is applicable".

### Pitfall 7: Election Selector Shows All Elections From dataRoot
**What goes wrong:** The results page election accordion (`$dataRoot.elections.length > 1`) uses the full dataRoot, not just selected elections. Tests may see elections they didn't select.
**Why it happens:** The accordion condition checks `$dataRoot.elections` (all loaded elections), not `$elections` (selected elections). The selected elections filter which tabs/results are shown, but the accordion always shows all.
**How to avoid:** This is intentional behavior for `disallowSelection`. Test assertions should account for the accordion always showing all elections in the dataRoot.
**Warning signs:** Tests failing because accordion is visible even when only one election was selected.

## Code Examples

### Multi-Election Overlay Dataset Structure
```json
{
  "constituencies": [
    {
      "externalId": "test-constituency-e2",
      "name": { "en": "Test Constituency E2" }
    }
  ],
  "constituencyGroups": [
    {
      "externalId": "test-cg-e2",
      "name": { "en": "Test CG Election 2" },
      "constituencies": { "externalId": ["test-constituency-e2"] }
    }
  ],
  "elections": [
    {
      "externalId": "test-election-2",
      "name": { "en": "Test Election 2026" },
      "electionDate": "2026-06-15",
      "electionStartDate": "2026-05-01",
      "constituencyGroups": { "externalId": ["test-cg-e2"] }
    }
  ],
  "questionCategories": [
    {
      "externalId": "test-cat-e2-policy",
      "name": { "en": "Test E2 Category: Policy" },
      "type": "opinion",
      "order": 20,
      "elections": { "externalId": ["test-election-2"] }
    }
  ],
  "questions": [
    {
      "externalId": "test-e2-q-1",
      "text": { "en": "E2 Question: Should public housing be expanded?" },
      "category": { "externalId": "test-cat-e2-policy" },
      "questionType": { "externalId": "test-qt-likert5" },
      "order": 201
    },
    {
      "externalId": "test-e2-q-2",
      "text": { "en": "E2 Question: Should local taxes be reduced?" },
      "category": { "externalId": "test-cat-e2-policy" },
      "questionType": { "externalId": "test-qt-likert5" },
      "order": 202
    }
  ],
  "candidates": [
    {
      "externalId": "test-e2-cand-1",
      "firstName": "E2 Candidate",
      "lastName": "One",
      "email": "e2.cand1@openvaa.org",
      "termsOfUseAccepted": "2025-01-01T00:00:00.000Z",
      "answersByExternalId": {
        "test-e2-q-1": { "value": "5" },
        "test-e2-q-2": { "value": "3" }
      }
    }
  ],
  "nominations": [
    {
      "externalId": "test-nom-e2-cand1",
      "candidate": { "externalId": "test-e2-cand-1" },
      "election": { "externalId": "test-election-2" },
      "constituency": { "externalId": "test-constituency-e2" },
      "party": { "externalId": "test-party-a" }
    }
  ]
}
```

### Constituency Overlay Dataset Structure (Hierarchical)
```json
{
  "constituencies": [
    {
      "externalId": "test-const-region-north",
      "name": { "en": "North Region" }
    },
    {
      "externalId": "test-const-region-south",
      "name": { "en": "South Region" }
    },
    {
      "externalId": "test-const-muni-north-a",
      "name": { "en": "North Municipality A" },
      "parent": { "externalId": "test-const-region-north" }
    },
    {
      "externalId": "test-const-muni-south-a",
      "name": { "en": "South Municipality A" },
      "parent": { "externalId": "test-const-region-south" }
    }
  ],
  "constituencyGroups": [
    {
      "externalId": "test-cg-regions",
      "name": { "en": "Regions" },
      "constituencies": { "externalId": ["test-const-region-north", "test-const-region-south"] }
    },
    {
      "externalId": "test-cg-municipalities",
      "name": { "en": "Municipalities" },
      "constituencies": { "externalId": ["test-const-muni-north-a", "test-const-muni-south-a"] }
    }
  ]
}
```

### Election Selection Page Test
```typescript
test('should show election selection with 2 elections', async ({ page }) => {
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();

  // Intro
  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  await introStart.waitFor({ state: 'visible' });
  await introStart.click();

  // Should redirect to election selection (2 elections = not implied)
  const electionsList = page.getByTestId(testIds.voter.elections.list);
  await expect(electionsList).toBeVisible({ timeout: 10000 });

  // Verify 2 election options
  const options = page.getByTestId('election-selector-option');
  await expect(options).toHaveCount(2);

  // Both should be pre-checked (default behavior)
  await expect(options.nth(0)).toBeChecked();
  await expect(options.nth(1)).toBeChecked();

  // Click continue
  await page.getByTestId('voter-elections-continue').click();
});
```

### Results Section Settings Toggle Test
```typescript
test('should show only candidates when sections is ["candidate"]', async ({ page }) => {
  const client = new StrapiAdminClient();
  await client.login();

  // Set results.sections to candidates only
  await client.updateAppSettings({
    results: {
      sections: ['candidate'],
      cardContents: { candidate: ['submatches'], organization: ['candidates'] },
      showFeedbackPopup: 180,
      showSurveyPopup: 500
    },
    // Include all sibling settings to avoid Pitfall 2
    questions: { ... },
    entities: { ... },
    notifications: { voterApp: { show: false } },
    analytics: { trackEvents: false }
  });

  // Navigate through voter journey to results
  // ...

  // Verify no entity type tabs (only one section = no tabs needed)
  const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
  await expect(entityTabs).not.toBeVisible();

  // Verify candidate section is visible
  const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
  await expect(candidateSection).toBeVisible();

  // Verify party section is NOT visible
  const partySection = page.getByTestId(testIds.voter.results.partySection);
  await expect(partySection).not.toBeVisible();

  // Restore default settings
  await client.updateAppSettings({
    results: {
      sections: ['candidate', 'organization'],
      cardContents: { candidate: ['submatches'], organization: ['candidates'] },
      showFeedbackPopup: 180,
      showSurveyPopup: 500
    },
    // ...
  });
  await client.dispose();
});
```

### disallowSelection Test
```typescript
test('should bypass election selection when disallowSelection is true', async ({ page }) => {
  const client = new StrapiAdminClient();
  await client.login();

  await client.updateAppSettings({
    elections: {
      disallowSelection: true,
      showElectionTags: true,
      startFromConstituencyGroup: undefined
    },
    // ... all sibling settings
  });

  // Navigate Home -> Intro -> Start
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();
  await page.getByTestId(testIds.voter.intro.startButton).waitFor({ state: 'visible' });
  await page.getByTestId(testIds.voter.intro.startButton).click();

  // Election selection should be bypassed (disallowSelection implies all)
  // Should land on questions or constituency selection (not elections)
  const electionsList = page.getByTestId(testIds.voter.elections.list);
  await expect(electionsList).not.toBeVisible();

  // ... answer questions, reach results ...

  // Results page should show all elections in accordion
  const electionAccordion = page.getByTestId('voter-results-election-select');
  await expect(electionAccordion).toBeVisible();

  // Restore
  await client.updateAppSettings({
    elections: {
      disallowSelection: false,
      showElectionTags: true,
      startFromConstituencyGroup: undefined
    },
    // ...
  });
  await client.dispose();
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| globalSetup for data | Project dependencies pattern | Phase 1 | Setup/teardown as test projects with dependency chains |
| Single dataset | Base + addendum datasets | Phase 2-3 | `default-dataset.json`, `voter-dataset.json`, `candidate-addendum.json` |
| Raw CSS selectors | testIds constants | Phase 1 | All locators use `getByTestId()` |

## Key Technical Findings

### Import Order Matters
The `importData` endpoint processes collections in the order they appear in the JSON object. Relations are resolved during import, so referenced entities must already exist. The correct import order is:
1. questionTypes
2. constituencies (ordered so parents come before children if using `parent` relation)
3. constituencyGroups
4. elections
5. questionCategories
6. questions
7. parties
8. candidates
9. alliances
10. nominations

**Confidence:** HIGH -- verified from `importableCollections.ts` and `createOrUpdate.ts` source code.

### Constituency Hierarchy via parent Relation
Constituencies support a `parent` field that creates parent-child relationships. The import system resolves `parent: { externalId: "..." }` via `externalRelations`. This enables hierarchical constituency structures where selecting a municipality implies its parent region. The `ConstituencyGroup.getImpliedConstituency()` method handles this implication.

**Confidence:** HIGH -- verified from `constituency/schema.json` and `importableCollections.ts`.

### Question Filtering by Election and Constituency
Question categories have `elections` and `constituencies` filter fields. When set, the category's questions only appear for the specified elections/constituencies. Individual questions also have a `constituencies` filter field. This is how election-specific and constituency-specific questions are implemented -- by scoping categories to specific elections and/or questions to specific constituencies.

**Confidence:** HIGH -- verified from `importableCollections.ts` (`questionCategories.externalRelations` includes `elections` and `constituencies`).

### Election Accordion on Results Page
The results page shows an `AccordionSelect` component when `$dataRoot.elections.length > 1`. This uses ALL elections from the data root, not just selected elections. The selected elections control which results appear in the tabs below. This means with `disallowSelection`, all elections always show in the accordion.

**Confidence:** HIGH -- verified from `results/+page.svelte` line 236: `{#if $dataRoot.elections.length > 1}`.

### startFromConstituencyGroup Setting
When set to a ConstituencyGroup ID, the flow reverses to: Constituencies -> Elections -> Questions. The constituency page shows only the specified group's constituencies. The election page then filters to elections applicable to the selected constituencies. The setting value is the ID of the constituency group to start from (not a boolean).

**Confidence:** HIGH -- verified from `elections/+page.ts`, `constituencies/+page.ts`, and `dynamicSettings.type.ts` (`startFromConstituencyGroup?: Id`).

### Variant Setup Must Handle Candidate Re-nomination
The default dataset creates candidates with nominations in election-1. When a variant overlay adds election-2, existing candidates need NEW nomination entries for election-2 if they should appear in election-2's results. The `createOrUpdate` function uses `externalId` matching, so existing candidates are updated (not duplicated) when re-imported.

**Confidence:** HIGH -- verified from `createOrUpdate.ts` logic.

### Shared Teardown Strategy
A single shared teardown project that deletes all `test-` prefixed data works for all variants because every entity across all overlays uses the `test-` prefix. This avoids duplicating teardown logic for each variant.

**Confidence:** HIGH -- the `deleteData` function deletes by prefix across all specified collections.

### Election Selection UI Behavior
The `ElectionSelector` component renders checkboxes. When there are multiple elections, all are pre-checked by default. The data-testid for individual options is `election-selector-option`. The continue button has testid `voter-elections-continue`.

**Confidence:** HIGH -- verified from `ElectionSelector.svelte` source code.

### Constituency Selection UI Behavior
The `ConstituencySelector` component uses `constituency-selector` as its testid. It renders `SingleGroupConstituencySelector` sub-components. When `useSingleGroup` is set (startFromConstituencyGroup mode), it shows only that group's constituencies. For hierarchical elections, it uses `getCombinedElections()` to determine which constituency groups to display together.

**Confidence:** HIGH -- verified from `ConstituencySelector.svelte` source code.

## Open Questions

1. **Minimum questions to reach results per variant**
   - What we know: The default dataset has 16 opinion questions. Overlays add election-specific questions. The `minimumAnswers` setting defaults to 5.
   - What's unclear: With election-scoped question categories, how many questions will appear per variant? Each variant has different question counts.
   - Recommendation: Each variant should answer ALL visible questions to avoid complexity. Use a dynamic loop pattern (like the voter-journey.spec.ts) rather than hardcoded counts.

2. **Teardown order for variant chains**
   - What we know: A shared teardown that deletes all `test-` prefixed data works. Each variant loads different data but all use the `test-` prefix.
   - What's unclear: Whether Playwright's `teardown` property can be shared across multiple setup projects.
   - Recommendation: Use a single `data-teardown-variants` project as the teardown for all variant setup projects. If Playwright doesn't support multiple setups sharing one teardown, use explicit `dependencies` instead.

3. **Election-scoped question count verification**
   - What we know: Question categories have `elections` filter. When a category is scoped to election-2, its questions only appear when election-2 is the active election in the question flow.
   - What's unclear: How the question count changes dynamically based on selected elections. With 2 elections selected, do you see questions from BOTH elections?
   - Recommendation: Test by checking total question count and verifying at least one election-specific question title appears. The voter journey answers questions for all selected elections.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn test:e2e --project=variant-multi-election` |
| Full suite command | `yarn test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONF-01 | Single election no selection step | e2e | `yarn test:e2e --project=voter-app` (Phase 3) | Existing |
| CONF-02 | Multi-election selection + per-election results | e2e | `yarn test:e2e --project=variant-multi-election` | Wave 0 |
| CONF-03 | Constituency enabled, selection step | e2e | `yarn test:e2e --project=variant-constituency` | Wave 0 |
| CONF-04 | Constituency disabled, no selection step | e2e | `yarn test:e2e --project=variant-multi-election` | Wave 0 |
| CONF-05 | Candidates-only results sections | e2e | `yarn test:e2e --project=variant-results-sections` | Wave 0 |
| CONF-06 | Organizations-only results sections | e2e | `yarn test:e2e --project=variant-results-sections` | Wave 0 |
| CONF-07 | Separate datasets per variant | e2e (validated by setup) | `yarn test:e2e --project=data-setup-multi-election` | Wave 0 |
| CONF-08 | Playwright projects per dataset | config | N/A (structural, verified by running suite) | Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test:e2e --project=<variant>` (run only the relevant variant project)
- **Per wave merge:** `yarn test:e2e` (full suite including all variants)
- **Phase gate:** Full suite green before verify

### Wave 0 Gaps
- [ ] `tests/tests/data/overlays/multi-election-overlay.json` -- CONF-02, CONF-04 dataset
- [ ] `tests/tests/data/overlays/constituency-overlay.json` -- CONF-03 dataset
- [ ] `tests/tests/data/overlays/startfromcg-overlay.json` -- startFromConstituencyGroup dataset
- [ ] `tests/tests/utils/mergeDatasets.ts` -- dataset merge utility
- [ ] `tests/tests/setup/variant-*.setup.ts` -- variant data setup projects
- [ ] `tests/tests/setup/variant-data.teardown.ts` -- shared variant teardown
- [ ] `tests/tests/specs/variants/multi-election.spec.ts` -- CONF-02, CONF-04 tests
- [ ] `tests/tests/specs/variants/constituency.spec.ts` -- CONF-03 tests
- [ ] `tests/tests/specs/variants/startfromcg.spec.ts` -- startFromConstituencyGroup tests
- [ ] `tests/tests/specs/variants/results-sections.spec.ts` -- CONF-05, CONF-06 tests
- [ ] `tests/playwright.config.ts` -- updated with variant project entries

## Sources

### Primary (HIGH confidence)
- `tests/playwright.config.ts` -- current project dependency structure
- `tests/tests/setup/data.setup.ts` -- data import pattern with settings
- `tests/tests/setup/data.teardown.ts` -- data cleanup pattern
- `tests/tests/data/default-dataset.json` -- base dataset structure
- `tests/tests/data/voter-dataset.json` -- addendum dataset pattern
- `tests/tests/utils/strapiAdminClient.ts` -- API client methods
- `tests/tests/fixtures/voter.fixture.ts` -- answeredVoterPage fixture
- `tests/tests/utils/voterNavigation.ts` -- voter navigation helpers
- `frontend/src/lib/utils/route/impliedParams.ts` -- election/constituency implication logic
- `frontend/src/routes/[[lang=locale]]/(voters)/(located)/+layout.ts` -- selection gate logic
- `frontend/src/routes/[[lang=locale]]/(voters)/elections/+page.svelte` -- election selection page
- `frontend/src/routes/[[lang=locale]]/(voters)/constituencies/+page.svelte` -- constituency selection page
- `frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+page.svelte` -- results page with election accordion
- `frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte` -- constituency selector component
- `frontend/src/lib/components/electionSelector/ElectionSelector.svelte` -- election selector component
- `backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/utils/importableCollections.ts` -- import entity config
- `backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/utils/createOrUpdate.ts` -- import logic
- `backend/vaa-strapi/src/api/constituency/content-types/constituency/schema.json` -- constituency schema with parent relation
- `packages/app-shared/src/settings/dynamicSettings.ts` -- default app settings values
- `packages/app-shared/src/settings/dynamicSettings.type.ts` -- settings type definitions

### Secondary (MEDIUM confidence)
- `packages/data/src/objects/election/election.ts` -- election.singleConstituency and getApplicableConstituency logic
- `packages/data/src/objects/constituency/constituencyGroup.ts` -- ConstituencyGroup.singleConstituency and getImpliedConstituency

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tooling established in prior phases
- Architecture: HIGH -- patterns directly follow existing project conventions
- Dataset design: HIGH -- import system and data model thoroughly verified from source
- Pitfalls: HIGH -- all pitfalls identified from prior phase decisions and source code analysis

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable -- infrastructure is established, no fast-moving dependencies)
