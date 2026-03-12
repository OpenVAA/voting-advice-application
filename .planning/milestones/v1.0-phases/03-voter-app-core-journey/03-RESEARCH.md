# Phase 3: Voter App Core Journey - Research

**Researched:** 2026-03-07
**Domain:** Playwright E2E testing for SvelteKit voter app (VAA journey, results, entity detail)
**Confidence:** HIGH

## Summary

Phase 3 covers the voter happy path from landing page through question answering to results and entity detail pages. The codebase already has substantial infrastructure from Phases 1-2: a Playwright 1.58.2 setup with project dependencies, a `StrapiAdminClient` for data management, the `voter-app` project configured in `playwright.config.ts`, 53+ testIds across candidate/voter/shared namespaces, and one voter page object (`QuestionsPage`).

The critical dataset design challenge is that the default dataset has 2 constituencies, which prevents auto-implication by the `(located)` layout gate. The voter dataset needs a single-constituency configuration for the simplest path tests. The matching algorithm uses Manhattan distance with `RelativeMaximum` missing value imputation -- this is directly importable from `@openvaa/matching` for independent ranking verification in tests.

**Primary recommendation:** Build a voter dataset with single election + single constituency (auto-implied), 5+ candidates with deterministic Likert answers, then layer spec files by page area following the established candidate spec patterns.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Separate voter dataset JSON (`voter-dataset.json`) extending the default dataset -- both imported in data-setup
- Split candidate-specific test data (candidates used only by candidate app specs, their nominations) into their own addendum (`candidate-addendum.json`) to decouple from voter data
- Default dataset keeps shared foundations: election, constituencies, question types, questions, question categories, parties
- Voter dataset adds: candidate answers for all Likert questions, plus edge-case candidates
- Most candidates get full Likert answers for deterministic match scoring
- One candidate with missing/partial answers (tests graceful handling)
- One candidate with full answers but terms of use not accepted (tests visibility filtering)
- Predictable answer values designed so match rankings are deterministic when voter answers all "Fully agree"
- Ranking verification tests separated into their own spec file (`voter-matching.spec.ts`)
- Preferred approach: run the `@openvaa/matching` package algorithm independently on the same data, then verify displayed results match the computed output
- If running the matching algo independently isn't feasible, fall back to pre-computed expected rankings in the dataset
- Simplest path configuration: single election + single constituency, both auto-implied by the `(located)` layout gate
- Flow: Home -> Intro -> Questions (all 8 Likert) -> Results -> Entity Detail
- Test the main intro page (step list + continue button); skip category intros (Phase 4 concern with `allowCategorySelection`)
- Answer all 8 Likert questions to exercise full question navigation (next, previous, skip, last-question behavior)
- Voter answers are saved in localStorage -- each test must start with clean localStorage to avoid state leakage
- Testing localStorage recall (answer persistence across sessions) deferred to later
- Test drawer interaction (click result card -> drawer opens) as the primary UX
- Direct URL navigation (`/results/candidate/[id]`) also tested if feasible within Phase 3, otherwise deferred
- Test both candidate AND party/organization detail pages (covers VOTE-11 and VOTE-12)
- Verify all EntityDetails tabs render (info, opinions, submatches) -- assert content appears without deep field-level verification
- Entity tabs on results page (candidates vs organizations) tested by switching between them
- Spec files: `voter-journey.spec.ts`, `voter-results.spec.ts`, `voter-detail.spec.ts`, `voter-matching.spec.ts`
- Serial mode within each spec file (tests represent sequential flow steps)
- Different spec files can run in parallel with each other
- All specs live in `tests/tests/specs/voter/` directory
- Shared voter fixture that answers all questions and saves browser state (localStorage with answers)
- Results and detail specs reuse this fixture state for efficiency
- Fixture designed to accept parameters (e.g., answer count) to accommodate later tests with partial answers
- Journey spec does its own question answering (that IS the test)
- Update `<!--@component` comments in voter page/component files when they don't already document user actions

### Claude's Discretion
- Page object design for voter pages (HomePage, IntroPage, ResultsPage, DetailPage, etc.)
- Whether direct URL detail navigation fits in Phase 3 or defers
- Exact fixture implementation for parameterizable voter answers
- How to integrate `@openvaa/matching` for independent ranking computation in tests
- Test assertions and error scenarios within each spec

### Deferred Ideas (OUT OF SCOPE)
- Structured user action definitions in component docs with automated sync to test coverage -- future milestone concern
- localStorage answer recall testing (persistence across sessions) -- Phase 4 or later
- Category intro pages (`allowCategorySelection`) -- Phase 4
- Multi-election and constituency selection flows -- Phase 5
- Minimum answers threshold testing (results link appears after N answers) -- Phase 4 (VOTE-07, VOTE-17)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VOTE-01 | Home/landing page loads and displays correctly | Home page has `voter-home-start` testId, start button navigates to Intro route |
| VOTE-02 | Election selection flow tested (multi-election scenario) | CONTEXT defers multi-election to Phase 5; single election auto-implied in this phase |
| VOTE-03 | Constituency selection flow tested (single and hierarchical) | CONTEXT defers hierarchical to Phase 5; single constituency auto-implied in voter dataset |
| VOTE-04 | Question intro page tested (shown/hidden based on settings) | Intro page has `voter-intro-start` testId; default `questionsIntro.show: true` |
| VOTE-05 | Category intro pages tested (shown with skip option based on settings) | Deferred to Phase 4 per CONTEXT |
| VOTE-06 | Question answering flow tested (all opinion question types) | QuestionsPage PO exists; `question-choice`, `question-next`, `question-previous` testIds ready |
| VOTE-07 | Minimum answers threshold tested (results available only after N answers) | Deferred to Phase 4 per CONTEXT; default `minimumAnswers: 5` |
| VOTE-08 | Results display tested with candidates section | Results page has `voter-results-candidate-section` testId with dynamic entity type assignment |
| VOTE-09 | Results display tested with organizations/parties section | Results page has `voter-results-party-section` testId; entity tabs at `voter-results-entity-tabs` |
| VOTE-10 | Results display tested with hybrid (candidates + parties) section | Default `results.sections: ['candidate', 'organization']` shows both; tabs toggle between them |
| VOTE-11 | Candidate detail page tested (info tab, opinions tab, submatches) | EntityDetails has `voter-entity-detail-info`, `voter-entity-detail-opinions` testIds; candidate default tabs: `['info', 'opinions']` |
| VOTE-12 | Party detail page tested (candidates list, info, opinions tabs) | Organization default tabs: `['info', 'candidates', 'opinions']`; `voter-entity-detail-submatches` testId on candidates tab |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | 1.58.2 | E2E test framework | Already installed, project dependencies configured |
| @openvaa/matching | workspace | Independent ranking computation | Manhattan distance + RelativeMaximum MVI matches frontend exactly |
| @openvaa/core | workspace | `HasAnswers`, `AnswerDict`, `MISSING_VALUE` types | Required for matching algorithm input |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| StrapiAdminClient | local | Data import/delete via Admin Tools API | data.setup.ts for dataset import |
| dotenv | existing | Environment variable loading | Already configured in playwright.config.ts |

### No New Dependencies Needed
The entire phase can be implemented with existing packages. The `@openvaa/matching` package is already in the workspace and can be imported directly in test files.

## Architecture Patterns

### Recommended Project Structure
```
tests/tests/
  data/
    default-dataset.json          # Shared foundations (existing, to be trimmed)
    candidate-addendum.json       # Candidate-app-specific data (new)
    voter-dataset.json            # Voter-app-specific data (new)
  fixtures/
    index.ts                      # Extended test fixture (add voter POs)
    voter.fixture.ts              # Voter answer fixture (new)
  pages/
    voter/
      QuestionsPage.ts            # Existing
      HomePage.ts                 # New
      IntroPage.ts                # New
      ResultsPage.ts              # New
      EntityDetailPage.ts         # New
  specs/
    voter/
      voter-journey.spec.ts       # Home -> Intro -> Questions flow
      voter-results.spec.ts       # Results display, entity tabs
      voter-detail.spec.ts        # Candidate and party detail pages
      voter-matching.spec.ts      # Ranking verification
  setup/
    data.setup.ts                 # Modified to import voter + candidate datasets
```

### Pattern 1: Dataset Separation
**What:** Split the default dataset into shared foundations + app-specific addendums
**When to use:** When different test projects need different data configurations
**Critical constraint:** The default dataset currently has 2 constituencies (Alpha, Beta) in one constituency group. For auto-implication, the voter dataset needs a SINGLE constituency. Two options:
1. Create the voter dataset with its own constituency group containing only 1 constituency, and override the default constituency group
2. Add voter-specific candidates nominated in just one constituency (Alpha), and rely on the `(located)` layout redirecting to constituency selection

**Recommended approach:** Option 1 -- the voter dataset should set up a single-constituency configuration. The default dataset retains 2 constituencies for future Phase 5 multi-constituency tests. The voter dataset imports a separate constituency group with 1 constituency, or the data.setup imports both datasets and the voter dataset overrides what's needed.

**However**, there's a simpler approach: Keep 2 constituencies in the default dataset, but the voter journey spec simply navigates through the constituency selection page (clicking on constituency Alpha). This is more realistic and still tests the flow. The CONTEXT says "single election + single constituency, both auto-implied" but the current data has 2 constituencies. We must either: (a) create voter-specific data with 1 constituency, or (b) treat constituency selection as a trivial step. Given the CONTEXT explicitly says "auto-implied by the `(located)` layout gate", the voter dataset MUST provide a single-constituency setup.

### Pattern 2: Voter Answer Fixture
**What:** A parameterizable fixture that answers N questions and provides a page with localStorage populated
**When to use:** Results and detail specs need a voter who has already answered questions
**Example:**
```typescript
// Source: Established pattern from auth.fixture.ts
import { test as base, expect } from '@playwright/test';

type VoterFixtureOptions = {
  answerCount?: number; // default: all questions (8)
  answerValue?: number; // Likert value 1-5, default: 5 ("Fully agree")
};

export const test = base.extend<VoterFixtureOptions & { answeredVoterPage: Page }>({
  answerCount: [undefined, { option: true }],
  answerValue: [5, { option: true }],
  answeredVoterPage: async ({ page, answerCount, answerValue }, use) => {
    // Navigate to first question
    await page.goto('/en/questions/__first__');
    // Answer questions
    const count = answerCount ?? 8;
    for (let i = 0; i < count; i++) {
      await page.getByTestId('question-choice').nth(answerValue - 1).click();
      // Wait for auto-advance or click next
      await page.getByTestId('question-next').click();
    }
    await use(page);
  }
});
```

### Pattern 3: Serial Spec with Parallel Files
**What:** Each spec file uses `test.describe.serial()` for sequential steps, but different files run in parallel
**When to use:** Voter journey is sequential (Home -> Intro -> Questions -> Results) but results and detail specs are independent
**Configuration:** The `voter-app` project in playwright.config.ts already has `fullyParallel: true` at the config level. Individual spec files use `test.describe.configure({ mode: 'serial' })` to force sequential execution within a file.

### Pattern 4: Drawer Interaction for Entity Detail
**What:** Results page opens entity detail in a Drawer (modal dialog) via `beforeNavigate` + `pushState`
**When to use:** Testing entity detail from results page
**Key locators:**
- Click `entity-card` to open drawer
- Drawer opens as `<dialog aria-modal="true">` containing `EntityDetails` with testId `entity-details`
- Tab testIds inside: `voter-entity-detail-info`, `voter-entity-detail-opinions`, `voter-entity-detail-submatches`
- Close via floating close button or backdrop click

### Pattern 5: Independent Matching Verification
**What:** Import `@openvaa/matching` directly in test file, run algorithm with same data, compare scores
**When to use:** `voter-matching.spec.ts` for deterministic ranking verification
**Example:**
```typescript
import { MatchingAlgorithm, DISTANCE_METRIC, MISSING_VALUE_METHOD, OrdinalQuestion } from '@openvaa/matching';

// Create matching algorithm identical to frontend (voterContext.ts line 193-198)
const algorithm = new MatchingAlgorithm({
  distanceMetric: DISTANCE_METRIC.Manhattan,
  missingValueOptions: { method: MISSING_VALUE_METHOD.RelativeMaximum }
});

// Create questions matching dataset's Likert-5
const questions = questionData.map(q =>
  OrdinalQuestion.fromLikert({ id: q.externalId, scale: 5 })
);

// Create voter answers (all "5" = Fully agree)
const voterAnswers = Object.fromEntries(
  questions.map(q => [q.id, { value: 5 }])
);

// Run matching
const matches = algorithm.match({
  questions,
  reference: { answers: voterAnswers },
  targets: candidates.map(c => ({ answers: c.answers }))
});
// matches is sorted by ascending distance (best match first)
```

### Anti-Patterns to Avoid
- **Hardcoded waits:** Use `expect(locator).toBeVisible()` not `page.waitForTimeout()`. The ESLint Playwright plugin enforces `no-wait-for-timeout` as error.
- **Raw locators:** Use `page.getByTestId()` not CSS/XPath selectors. The ESLint plugin enforces `no-raw-locators` as error.
- **Shared mutable state between specs:** Each test gets a fresh browser context via `fullyParallel: true`. Don't rely on localStorage from a previous test in the same file unless using serial mode with deliberate state carry-over.
- **Testing with category selection enabled:** Default settings have `questionsIntro.allowCategorySelection: true` and `categoryIntros.show: true`. The voter dataset or app settings must disable both for Phase 3's simple path. Either (a) use `StrapiAdminClient.updateAppSettings()` in setup, or (b) design the journey to accommodate the intro page's default behavior (all categories pre-selected, just click start).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Matching computation | Custom distance calculation | `@openvaa/matching` MatchingAlgorithm class | Must match frontend exactly; handles normalization, missing values, submatches |
| Data import/cleanup | Direct Strapi API calls | `StrapiAdminClient.importData()` / `deleteData()` | Handles auth, rate limiting, JSON stringify quirk |
| Route URL building | String concatenation | `buildRoute()` from `tests/tests/utils/buildRoute.ts` | Handles locale insertion, layout group removal |
| Test ID strings | Inline strings | `testIds` from `tests/tests/utils/testIds.ts` | Single source of truth, prevents typos |
| App settings changes | Manual Strapi admin navigation | `StrapiAdminClient.updateAppSettings()` | Direct API, already proven in Phase 2 settings spec |

**Key insight:** The matching algorithm MUST be imported from `@openvaa/matching`, not reimplemented. The frontend uses Manhattan distance with RelativeMaximum missing value method (see `voterContext.ts` lines 193-198). Any custom calculation risks divergence.

## Common Pitfalls

### Pitfall 1: Constituency Auto-Implication Failure
**What goes wrong:** Default dataset has 2 constituencies in 1 group. `singleConstituency` returns null when group has >1 constituency. The `(located)` layout gate redirects to `/constituencies` selection page.
**Why it happens:** `getImpliedConstituencyIds()` calls `election.singleConstituency` which checks `constituencyGroupIds.length === 1 && constituencyGroups[0].singleConstituency`. With 2 constituencies in the group, this returns null.
**How to avoid:** Voter dataset must create its own constituency group with exactly 1 constituency. OR, use only 1 constituency in the default dataset and have the voter dataset overlay work.
**Warning signs:** Test navigates to home, clicks start, lands on constituency selection instead of questions.

### Pitfall 2: Category Intros Intercepting Question Flow
**What goes wrong:** Default app settings have `categoryIntros.show: true`. After clicking start on the questions intro page, the app navigates to a category intro page before the first question, not directly to question 1.
**Why it happens:** `handleSubmit()` in questions intro page checks `$appSettings.questions.categoryIntros?.show` and redirects to `QuestionCategory` route.
**How to avoid:** Either (a) disable `categoryIntros.show` via `updateAppSettings()` in setup, or (b) handle the category intro page in the journey test. Given CONTEXT says "skip category intros (Phase 4 concern)", option (a) is correct.
**Warning signs:** Test expects to be on a question page after clicking intro start, but URL contains `/questions/category/`.

### Pitfall 3: Questions Intro Category Selection Default
**What goes wrong:** Default settings have `questionsIntro.allowCategorySelection: true`. The intro page shows checkboxes for category selection instead of just a start button.
**Why it happens:** Default dynamic settings enable this feature.
**How to avoid:** Disable via `updateAppSettings({ questions: { questionsIntro: { allowCategorySelection: false } } })`. Or handle it in tests since all categories are pre-selected by default.
**Warning signs:** Questions intro page shows category checkboxes; tests may not click start correctly.

### Pitfall 4: Answer Auto-Advance Timing
**What goes wrong:** When a voter clicks an answer choice, the `handleAnswer` function calls `setTimeout(handleJump, DELAY.md)` which auto-navigates to the next question after a delay.
**Why it happens:** The UI auto-advances after answering with a brief animation delay.
**How to avoid:** After clicking an answer choice, wait for URL change or next question to appear rather than immediately clicking next. The question-next button behavior also changes -- it shows "Results" on the last question when answered.
**Warning signs:** Double navigation (answer auto-advances + explicit next click causes skip).

### Pitfall 5: Drawer State vs Direct URL Navigation
**What goes wrong:** Clicking a result card opens EntityDetails in a Drawer (pushState, not real navigation). The URL changes but `$page.state.resultsShowEntity` is set instead of actual navigation.
**Why it happens:** `beforeNavigate` in results page intercepts navigation to `ResultEntity` route and uses `pushState` instead.
**How to avoid:** For drawer tests: click entity card, then assert drawer/dialog is visible via `page.getByRole('dialog')` or `page.locator('dialog[open]')`. For direct URL tests: navigate directly to `/en/results/candidate/{id}` which bypasses the pushState interception.
**Warning signs:** After clicking entity card, `page.url()` changes but page content appears inside a modal overlay, not a full page.

### Pitfall 6: Entity Visibility Filtering
**What goes wrong:** Candidates without `termsOfUseAccepted` or with `hideIfMissingAnswers: true` (default) and no opinion answers won't appear in results.
**Why it happens:** Default settings `entities.hideIfMissingAnswers.candidate: true` filters out candidates missing opinion answers. Candidates without `termsOfUseAccepted` may also be excluded from nominations.
**How to avoid:** Design voter dataset candidates carefully -- edge-case candidates (missing answers, no TOU) should be explicitly tested for their expected visibility/invisibility.
**Warning signs:** Expected candidate count in results doesn't match dataset; edge-case candidate unexpectedly visible or invisible.

### Pitfall 7: Test Data Prefix Collision
**What goes wrong:** Voter dataset uses same `test-` prefix as default dataset. Cleanup in data.teardown.ts deletes everything.
**Why it happens:** `deleteData` deletes by externalId prefix `test-`.
**How to avoid:** Continue using `test-` prefix (consistent with existing pattern). Both datasets are imported in setup and cleaned up in teardown. Just ensure voter-specific externalIds don't collide with default dataset's (use prefix like `test-voter-` for voter-only entities).
**Warning signs:** Data from one dataset clobbers the other during import.

### Pitfall 8: Missing Entity Tabs TestId
**What goes wrong:** The results page `Tabs` component with `data-testid="voter-results-entity-tabs"` only renders when there are multiple entity types. With a single entity type, no tabs appear.
**Why it happens:** Conditional: `{#if Object.keys($matches[activeElectionId]).length > 1}`.
**How to avoid:** Ensure voter dataset has both candidates and organizations in nominations so that both entity types appear. Default `results.sections: ['candidate', 'organization']` includes both.
**Warning signs:** Test looking for entity tabs fails because only candidates (or only organizations) have nominations.

## Code Examples

### Existing Test Pattern (from candidate specs)
```typescript
// Source: tests/tests/specs/candidate/candidate-auth.spec.ts
import { test, expect } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';

test.describe('voter journey', () => {
  test('should load home page', async ({ page }) => {
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await expect(page.getByTestId('voter-home-start')).toBeVisible();
  });
});
```

### Voter Dataset Structure (voter-dataset.json)
```json
{
  "constituencies": [
    {
      "externalId": "test-voter-constituency",
      "name": { "en": "Test Voter Constituency" }
    }
  ],
  "constituencyGroups": [
    {
      "externalId": "test-voter-cg",
      "name": { "en": "Test Voter Constituency Group" },
      "constituencies": { "externalId": ["test-voter-constituency"] }
    }
  ],
  "elections": [
    {
      "externalId": "test-voter-election",
      "name": { "en": "Test Voter Election" },
      "electionDate": "2025-06-15",
      "electionStartDate": "2025-05-01",
      "constituencyGroups": { "externalId": ["test-voter-cg"] }
    }
  ],
  "candidates": [
    {
      "externalId": "test-voter-cand-agree",
      "firstName": "Fully",
      "lastName": "Agree",
      "email": "voter.cand.agree@openvaa.org",
      "termsOfUseAccepted": "2025-01-01T00:00:00.000Z",
      "answersByExternalId": {
        "test-question-1": { "value": "5" },
        "test-question-2": { "value": "5" },
        "test-question-3": { "value": "5" },
        "test-question-4": { "value": "5" },
        "test-question-5": { "value": "5" },
        "test-question-6": { "value": "5" },
        "test-question-7": { "value": "5" },
        "test-question-8": { "value": "5" }
      }
    }
  ],
  "nominations": [
    {
      "externalId": "test-voter-nom-agree",
      "candidate": { "externalId": "test-voter-cand-agree" },
      "election": { "externalId": "test-voter-election" },
      "constituency": { "externalId": "test-voter-constituency" },
      "party": { "externalId": "test-party-a" }
    }
  ]
}
```

### Matching Algorithm Independent Verification
```typescript
// Source: packages/matching/src/algorithms/matchingAlgorithm.ts + examples/example.ts
import {
  MatchingAlgorithm,
  DISTANCE_METRIC,
  MISSING_VALUE_METHOD,
  OrdinalQuestion
} from '@openvaa/matching';
import type { HasAnswers, AnswerDict } from '@openvaa/core';

// Create algorithm matching frontend configuration exactly
const algorithm = new MatchingAlgorithm({
  distanceMetric: DISTANCE_METRIC.Manhattan,
  missingValueOptions: { method: MISSING_VALUE_METHOD.RelativeMaximum }
});

// Create questions from dataset
const questions = Array.from({ length: 8 }, (_, i) =>
  OrdinalQuestion.fromLikert({ id: `test-question-${i + 1}`, scale: 5 })
);

// Run matching
class TestEntity implements HasAnswers {
  constructor(public name: string, public answers: AnswerDict) {}
}

const voter = new TestEntity('voter', voterAnswers);
const candidates = datasetCandidates.map(c => new TestEntity(c.name, c.answers));

const matches = algorithm.match({ questions, reference: voter, targets: candidates });
// matches[0] = best match (lowest distance), matches[n] = worst match
// match.distance is normalized [0, 1], match.score = 1 - distance (in MatchBase)
```

### Drawer Interaction Pattern
```typescript
// Source: frontend/src/routes/.../results/+page.svelte (beforeNavigate + pushState)
// and frontend/src/lib/components/modal/ModalContainer.svelte (dialog element)

// Click entity card to open drawer
await page.getByTestId('entity-card').first().click();

// Drawer renders as <dialog aria-modal="true">
const drawer = page.locator('dialog[open]');
await expect(drawer).toBeVisible();

// EntityDetails inside drawer
await expect(drawer.getByTestId('entity-details')).toBeVisible();

// Navigate tabs
await drawer.getByTestId('voter-entity-detail-info').waitFor(); // default first tab
// Click opinions tab via Tabs component
```

### Data Setup Pattern (Extended)
```typescript
// Source: tests/tests/setup/data.setup.ts (existing pattern)
import defaultDataset from '../data/default-dataset.json' assert { type: 'json' };
import voterDataset from '../data/voter-dataset.json' assert { type: 'json' };

setup('import test datasets', async () => {
  const client = new StrapiAdminClient();
  await client.login();

  // Clean existing test data
  await client.deleteData({
    nominations: 'test-',
    // ... full cleanup
  });

  // Import shared foundations first
  await client.importData(defaultDataset);

  // Import voter-specific data (candidates, nominations for single constituency)
  await client.importData(voterDataset);

  await client.dispose();
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| globalSetup for data | Project dependencies (`data-setup` project) | Phase 1 | Traces and reports integrated, teardown as separate project |
| Raw locators | `getByTestId()` exclusively | Phase 1 | ESLint enforces `no-raw-locators` as error |
| Shared auth state | Per-project storageState | Phase 1 | Voter app doesn't need auth (no storageState in voter-app project) |
| Single default dataset | Dataset + addendum pattern | Phase 3 (new) | Decouple candidate and voter test data |

## Critical Implementation Details

### Auto-Implication Logic
The `(located)/+layout.ts` gate checks:
1. `getImpliedElectionIds()` -- returns election IDs if only 1 election exists OR `disallowSelection` is true
2. `getImpliedConstituencyIds()` -- returns constituency IDs if every election has `singleConstituency` (1 constituency group with 1 constituency)

For auto-implication to work with the voter dataset:
- Must have exactly 1 election
- That election must have exactly 1 constituency group
- That constituency group must have exactly 1 constituency

### App Settings for Simple Path
Default dynamic settings that need overriding for Phase 3's simple path:
- `questions.categoryIntros.show: true` -> should be `false` (skip category intros)
- `questions.questionsIntro.allowCategorySelection: true` -> should be `false` (no category checkboxes)
- `questions.questionsIntro.show: true` -> keep `true` (we test the intro page)
- `results.sections: ['candidate', 'organization']` -> keep (tests both entity types)
- `matching.minimumAnswers: 5` -> keep (answering all 8 exceeds this)
- `entities.hideIfMissingAnswers.candidate: true` -> keep (tests edge-case candidate filtering)

The `StrapiAdminClient.updateAppSettings()` method can set these. Alternatively, a test setup step can do it.

### TestId Inventory for Voter App
Already defined in `testIds.ts`:
| TestId | Element | Page |
|--------|---------|------|
| `voter-home-start` | Start button | Home |
| `voter-elections-list` | Election selector | Elections |
| `election-selector-option` | Election card | Elections |
| `voter-constituencies-list` | Constituency list | Constituencies |
| `constituency-selector` | Constituency selector | Constituencies |
| `voter-intro-start` | Start button | Intro |
| `question-choice` | Answer option (Likert button) | Questions |
| `question-next` | Next/skip button | Questions |
| `question-previous` | Previous button | Questions |
| `question-delete` | Delete answer button | Questions |
| `question-actions` | Actions group | Questions |
| `voter-results-list` | Results entity list | Results |
| `entity-card` | Result entity card | Results |
| `voter-results-candidate-section` | Candidate section | Results |
| `voter-results-party-section` | Party section | Results |
| `voter-results-entity-tabs` | Entity type tabs | Results |
| `voter-entity-detail` | Detail container (on direct URL page) | Entity Detail |
| `entity-details` | EntityDetails article | Entity Detail (inside drawer too) |
| `voter-entity-detail-info` | Info tab content | Entity Detail |
| `voter-entity-detail-opinions` | Opinions tab content | Entity Detail |
| `voter-entity-detail-submatches` | Submatches/candidates tab content | Entity Detail |
| `voter-nav-results` | Results link in nav | Header |

Additional testIds found in source but NOT in testIds.ts (may need adding):
| TestId | Element | Page |
|--------|---------|------|
| `voter-intro-steps` | Steps list | Intro |
| `voter-results-ingress` | Results ingress text | Results |
| `voter-results-container` | Results full-width area | Results |
| `voter-results-election-select` | Election selector in results | Results |
| `voter-results-controls` | List filter controls | Results |
| `voter-home-info-link` | Info page link | Home |
| `voter-home-about-link` | About page link | Home |
| `voter-elections-continue` | Continue button | Elections |
| `voter-constituencies-continue` | Continue button | Constituencies |
| `voter-questions-start` | Start button on questions intro | Questions Intro |
| `voter-questions-heading` | Question heading | Questions |
| `voter-questions-input` | Opinion input wrapper | Questions |
| `voter-questions-actions` | Question actions wrapper | Questions |
| `opinion-question-input` | Opinion question input div | Questions |
| `question-choices` | Choices container | Questions |
| `voter-questions-category-intro` | Category intro | Questions |
| `entity-card-action` | Entity card action button | Results |

### Existing Page Objects to Extend
Only `QuestionsPage` (voter) exists. New page objects needed:
- **VoterHomePage** -- `startButton` locator, navigation assertion
- **VoterIntroPage** -- `startButton` locator, step list assertions
- **VoterResultsPage** -- `candidateSection`, `partySection`, `entityTabs`, `resultCards` locators; tab switching methods
- **VoterEntityDetailPage** -- `infoTab`, `opinionsTab`, `submatchesTab` locators; tab navigation methods; works both inside drawer and direct URL

### Question Navigation Flow
The question page (`[questionId]/+page.svelte`) handles:
1. First question uses special ID `__first__` (FIRST_QUESTION_ID constant)
2. Answering a choice triggers `handleAnswer` -> `setTimeout(handleJump, DELAY.md)` (auto-advance)
3. Next button label changes to "Results" on last question when answered
4. Previous on first question goes to Questions intro (or Intro page if intro is hidden)
5. Next on last question navigates to Results page

### Matching Score Display
`MatchBase` class has a `score` getter that returns `1 - distance` (percentage match). The `distance` is normalized to [0, 1]. So a voter answering all "5" (Fully agree) matched against a candidate who also answered all "5" would have distance=0, score=1 (100% match).

## Open Questions

1. **Dataset Import Order with Shared Questions**
   - What we know: The voter dataset reuses questions from the default dataset (same externalIds). The `importData` method uses createOrUpdate.
   - What's unclear: Whether importing the voter dataset (which references questions by externalId) works correctly when the questions were already imported by the default dataset.
   - Recommendation: Import default dataset first (creates questions), then voter dataset (creates voter-specific candidates/nominations referencing existing questions via externalId). This should work with createOrUpdate.

2. **App Settings Restoration After Tests**
   - What we know: `updateAppSettings()` mutates global app settings. Phase 2 candidate-settings spec already does this.
   - What's unclear: Whether voter-app tests need to restore settings after modifying them (e.g., disabling category intros).
   - Recommendation: Modify settings in the data-setup project before voter tests run. Since data-teardown runs last, and the next test run starts with data-setup (which reimports everything), settings will be reset. But confirm this flow works.

3. **Direct URL Entity Detail Navigation**
   - What we know: `/en/results/candidate/{entityId}` direct URL works. The page component gets entityId from route params. But it needs `nominationId` from search params or it shows the "naked entity."
   - What's unclear: Whether accessing entity detail via direct URL requires pre-selecting election/constituency (since it's inside `(located)` layout gate).
   - Recommendation: Include in Phase 3 if feasible -- navigate directly after auto-implication has occurred (voter has already visited results page in an earlier step). If the located gate blocks cold navigation, defer to later.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | tests/playwright.config.ts |
| Quick run command | `cd tests && npx playwright test --project=voter-app` |
| Full suite command | `cd tests && npx playwright test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VOTE-01 | Home page loads, start button visible | e2e | `npx playwright test voter-journey --grep "home page"` | Wave 0 |
| VOTE-02 | Election selection (auto-implied in Phase 3) | e2e | Covered by journey flow (no selection page appears) | Wave 0 |
| VOTE-03 | Constituency selection (auto-implied in Phase 3) | e2e | Covered by journey flow (no selection page appears) | Wave 0 |
| VOTE-04 | Questions intro page shown | e2e | `npx playwright test voter-journey --grep "intro"` | Wave 0 |
| VOTE-05 | Category intros (deferred to Phase 4) | -- | N/A | N/A |
| VOTE-06 | Question answering flow | e2e | `npx playwright test voter-journey --grep "questions"` | Wave 0 |
| VOTE-07 | Minimum answers threshold (deferred to Phase 4) | -- | N/A | N/A |
| VOTE-08 | Results with candidates | e2e | `npx playwright test voter-results --grep "candidate"` | Wave 0 |
| VOTE-09 | Results with organizations | e2e | `npx playwright test voter-results --grep "organization"` | Wave 0 |
| VOTE-10 | Results hybrid view | e2e | `npx playwright test voter-results --grep "tabs"` | Wave 0 |
| VOTE-11 | Candidate detail page | e2e | `npx playwright test voter-detail --grep "candidate"` | Wave 0 |
| VOTE-12 | Party detail page | e2e | `npx playwright test voter-detail --grep "party"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd tests && npx playwright test --project=voter-app`
- **Per wave merge:** `cd tests && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/tests/data/voter-dataset.json` -- voter-specific test data with single constituency
- [ ] `tests/tests/data/candidate-addendum.json` -- candidate-app-specific data split from default
- [ ] `tests/tests/pages/voter/HomePage.ts` -- voter home page object
- [ ] `tests/tests/pages/voter/IntroPage.ts` -- voter intro page object
- [ ] `tests/tests/pages/voter/ResultsPage.ts` -- voter results page object
- [ ] `tests/tests/pages/voter/EntityDetailPage.ts` -- voter entity detail page object
- [ ] `tests/tests/fixtures/voter.fixture.ts` -- parameterizable answer fixture
- [ ] `tests/tests/specs/voter/` directory creation
- [ ] App settings override in data-setup for Phase 3 simple path (disable category intros)

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `frontend/src/routes/[[lang=locale]]/(voters)/` -- all voter route files examined
- Codebase inspection: `frontend/src/lib/contexts/voter/voterContext.ts` -- matching algorithm configuration confirmed (Manhattan, RelativeMaximum)
- Codebase inspection: `packages/matching/src/algorithms/matchingAlgorithm.ts` -- full match() flow including submatches
- Codebase inspection: `frontend/src/lib/utils/route/impliedParams.ts` -- auto-implication logic for elections/constituencies
- Codebase inspection: `packages/app-shared/src/settings/dynamicSettings.ts` -- all default setting values
- Codebase inspection: `tests/playwright.config.ts` -- voter-app project configuration
- Codebase inspection: `tests/tests/utils/testIds.ts` -- all 53 testId constants
- Codebase inspection: `tests/tests/setup/data.setup.ts` -- data import pattern

### Secondary (MEDIUM confidence)
- Codebase inspection: `packages/data/src/objects/election/election.ts` -- singleConstituency getter behavior

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in workspace, versions confirmed from lockfile/config
- Architecture: HIGH -- patterns directly observed in Phase 1-2 implementation, route files, and component source
- Pitfalls: HIGH -- each pitfall traced to specific source code behavior (layout gate, settings defaults, drawer pattern)
- Matching verification: HIGH -- algorithm constructor args confirmed in voterContext.ts, example in packages/matching/examples/

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable codebase, no major framework changes planned)
