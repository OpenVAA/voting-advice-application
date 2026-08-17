# Phase 134: A11y Contrast + i18n Catalog + Boolean-Answer Defect Closure - Pattern Map

**Mapped:** 2026-08-10
**Files analyzed:** 12 (2 created-content sites, 10 modified)
**Analogs found:** 12 / 12 (all in-repo — this phase builds nothing from scratch)

> **Scope note for the planner:** `134-RESEARCH.md` already carries the verbatim
> *current* text of every file this phase edits, with `[VERIFIED: path:line]` markers.
> This document does NOT duplicate that. It answers only: **for each new/changed
> artefact, which existing file is the shape to copy, and what is the minimum
> excerpt an executor needs at their fingertips.**

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` — `AxeRoute` type + `contentTestId` (D-04) | test (typed config table) | request-response (nav → settle → scan) | *self*: `UnlocatedAxeRoute` @ `:135-140` + runner @ `:198-227` | exact (in-place evolution) |
| same file — constituencies entry → **located** walk (D-17/D-19) | test (fixture-driven scan) | event-driven (multi-step UI walk) | `voterJourneyTest('… voter-detail-drawer')` @ `:255-278` (multi-step settle) | exact |
| same file — **NEW** filter-drawer scan entry (D-05) | test (fixture-driven scan) | event-driven | `voter-journey.spec.ts:1418-1450` (`openFilterDialog` → `getFilter`) + drawer scan @ `:255-278` | exact |
| `apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte:85,98,113` (D-02) | component (presentational) | — | `ConstituencySelector.svelte:300` / `QuestionChoices.svelte:419` (`small-label` consumers) | exact |
| `apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte:293-303` (D-17 Option A) | component (presentational) | — | the file's own sibling `{#if …}` data gates | role-match |
| `apps/frontend/src/app.css` — delete `.faded` (`:356-358`) (D-17) | config (global theme) | — | n/a — pure deletion; only consumer is the line above | n/a |
| `apps/frontend/messages/{7 locales}/questions.json` — `multiChoice.selectExact` (MF2) (D-09/D-18) | config (i18n catalog) | transform (build-time codegen) | `messages/en/questions.json:16-28` — `questions.category.numQuestions` | exact |
| `apps/frontend/messages/{7}/questions.json` — `multiChoice.selectRange` (D-08) | config (i18n catalog) | transform | any plain interpolation string in the same file | exact |
| `apps/frontend/messages/{7}/components.json` — 5 keys (D-08) | config (i18n catalog) | transform | existing `components.accordionSelect.collapsedAriaInfo` sibling object | exact |
| `apps/frontend/src/lib/i18n/tests/translations.test.ts` — parity check (D-10) | test (unit, filesystem) | file-I/O | *self*: `flattenKeys` @ `:23-34` + `describe.each(otherLocales)` @ `:~120` | exact |
| `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:58` (D-12) | route component (helper fn) | transform | `candidateContext.svelte.ts:230-234` (`isEmptyValue` on the same value shape) | exact |
| `tests/tests/specs/candidate/candidate-journey.spec.ts` steps 18.5 / 18.6 (D-11/D-21) | test (E2E spec) | event-driven | *self*: neighbouring assertions in the same steps | exact |
| `.planning/{ROADMAP,REQUIREMENTS,v2.14-MILESTONE-AUDIT}.md` (D-01c) | docs | — | RESEARCH §E table (exact lines + replacement intent) | n/a |

---

## Pattern Assignments

### 1. `a11y-smoke.spec.ts` — the typed route contract (D-04)

**Analog: the file itself.** There is no other typed-test-config table in `tests/` —
`UNLOCATED_ROUTES` is the sole precedent, so D-04 is an in-place evolution, not a
port. Copy its shape exactly and tighten it.

**Existing type + runner (the two edit targets), `a11y-smoke.spec.ts:135-140` and `:198-227`:**

```typescript
interface UnlocatedAxeRoute {
  name: string;
  routeId: Route;
  /** Role-based content settle BEFORE axe scan (never a network-idle settle) */
  settle: (page: Page) => Promise<void>;
}
```

```typescript
// Module-level for…of route runner — module-level dispatch satisfies
// playwright/no-conditional-in-test (no `if` inside test() bodies).
for (const route of UNLOCATED_ROUTES) {
  test(`axe accessibility scan — ${route.name}`, async ({ page }, testInfo) => {
    await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
    await route.settle(page);
    await awaitAnimationsSettled(page);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    await assertAxeGates(results, testInfo, route.name);
  });
  // …identical `(dark)` twin with page.emulateMedia({ colorScheme: 'dark' }) first
}
```

**Constraints this analog encodes — do not break them:**
- The runner is **module-level `for…of`**, not `test.each`, specifically to satisfy
  `playwright/no-conditional-in-test`. Any `if` needed by the new optional `settle`
  must live in the route entry, never in the `test()` body.
- Every light test has a `-dark` twin that appends `-dark` to the `assertAxeGates`
  label. Keep both for every new entry (the filter drawer measured clean in both).
- Settle order is **always** `content settle → awaitAnimationsSettled → AxeBuilder`.

**Target shape (RESEARCH §Pattern 2 — reproduced because it is the executor's template):**

```typescript
interface AxeRoute {
  name: string;
  routeId: Route;
  /** REQUIRED. Data-driven testid proving the route's real content is in the DOM. */
  contentTestId: string;
  /** OPTIONAL extra interaction AFTER the content settle (e.g. open a drawer). */
  settle?: (page: Page) => Promise<void>;
}
```

**`contentTestId` values (copy from `tests/tests/utils/testIds.ts`, never inline literals):**
`testIds.voter.home.page` · `testIds.voter.elections.label` ·
`testIds.voter.constituencies.list` · `testIds.voter.results.card`.
(Both selector components' root testids are **shadowed at the call site** — use the
`voter-*-list` constants, per D-19.)

**Header-comment maintenance:** the file opens with a 32-line block enumerating "Routes
(6 distinct entries)" with stale `/en/...` URLs (RESEARCH §A.3 doc drift). Adding a
7th entry means updating that block — treat it as part of the same edit.

---

### 2. `a11y-smoke.spec.ts` — the *located* route pattern (D-17 constituencies, D-05 filter drawer)

**Analog: `a11y-smoke.spec.ts:255-278` — the `voter-detail-drawer` scan.** It is the
only existing scan that performs a multi-step interactive settle, and it is the shape
both new/repointed entries need.

```typescript
voterJourneyTest('axe accessibility scan — voter-detail-drawer', async ({ answeredVoterPage: page }, testInfo) => {
  await page.getByRole('tablist').first().waitFor({ state: 'visible', timeout: 10000 });
  await page.getByTestId('entity-card').first().waitFor({ state: 'visible', timeout: 10000 });
  await page.getByTestId('entity-card').first().click();
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10000 });
  await awaitAnimationsSettled(page);          // ← settles drawer fly-in + page fade
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await assertAxeGates(results, testInfo, 'voter-detail-drawer');
});
```

Note the fixture-name-aliasing idiom `{ answeredVoterPage: page }` — it lets the body
read as if it had a plain `page`. Reuse it verbatim.

**Located-entry decision for the planner (RESEARCH §Pattern 2, "Call sites to update"):**
the three existing located scans are hand-written `voterJourneyTest` bodies and are
**not** covered by the route type. D-04's "structural, not per-site discipline" intent
argues for extending the table with a `fixture` discriminant so the located scans are
covered too; if they are left hand-written, an explicit in-file comment must say why.
Either way the constituencies entry must become located (D-17).

**Constituencies located walk — measured working (RESEARCH §A.2), copy verbatim:**

```typescript
await page.goto(buildRoute({ route: 'Elections', locale: 'en' }));
await page.getByTestId(testIds.voter.elections.label).first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
await page.getByTestId(testIds.voter.elections.continue).click();
await page.waitForURL(/\/constituencies/, { timeout: TIMEOUTS.slowPage });
await page.getByTestId(testIds.voter.constituencies.list).first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
```

---

### 3. Filter-drawer E2E fixture path (D-05)

**Analog: `tests/tests/specs/voter/voter-journey.spec.ts:1418-1450`** — the only spec
that opens the filter dialog and drives filter rows. This is the fixture path to reuse;
do **not** hand-roll `getByTestId('entity-list-filter').click()`.

```typescript
// voter-journey.spec.ts:1423-1432 (shape to copy)
const d1 = await entityFilters.openFilterDialog();
await expect.soft(d1.getFilters()).toHaveCount(3, { timeout: TIMEOUTS.page });
const partyFilter = await d1.getFilter(/Party/i);      // auto-expands the collapsed row
const noAnswerOption = await partyFilter.getOption(/No answer/i);
```

**Fixture construction** (`voter-journey-mobile.spec.ts:58` is the leaf-spec idiom):

```typescript
import { createEntityFilters } from '../../fixtures/voter/entityFilters.fixture';
const entityFilters = createEntityFilters(page);
```

**Why the fixture, not raw locators** (encoded in `entityFilters.fixture.ts:318-336`
and `:216-236`): `openFilterDialog()` handles the `.first()` two-conditional-render
invariant and falls back from the unreliable `entity-filter-dialog` testid to
`getByRole('dialog', { name: /Filters/i })`; `getFilter()` auto-expands via the
Expander's internal `role=checkbox, name=/expand or collapse/i` toggle.

**Scan-specific settle (RESEARCH §A.7, Pitfall 3):** filter bodies are lazily imported
(`{#await import('./numeric')}`), so after expanding, wait on a concrete inner locator —
`testIds.voter.results.filterNumericMin` (`entity-filter-numeric-min`) or at minimum
`filterOption` — before `awaitAnimationsSettled`. **Never `waitForTimeout`.** Encode
this inside the entry's optional `settle`, not the test body.

Entry sketch: `contentTestId: testIds.voter.results.card`, `settle` = open dialog →
expand every `entity-filter-row` → wait for `entity-filter-numeric-min`.

---

### 4. Catalog key-set parity check (D-10)

**Analog: `apps/frontend/src/lib/i18n/tests/translations.test.ts` — the host file itself.**
It already carries the array-as-leaf flattener and the per-locale `describe.each` shape.

**Flattener to reuse verbatim (`:19-40`) — do NOT write a second one:**

```typescript
/**
 * Recursive function to extract leaf keys, handling inlang variant arrays.
 * Variant arrays (array values) are treated as leaf nodes (same as string values).
 */
function flattenKeys(obj: unknown, prefix: string): Array<string> {
  const res: Array<string> = [];
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    res.push(prefix);                       // Leaf node (string, number, or variant array)
  } else {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      res.push(...flattenKeys(value, prefix ? `${prefix}.${key}` : key));
    }
  }
  return res.sort();
}

function getMessageKeys(locale: string, filename: string): Array<string> {
  const filePath = path.join(messagesDir, locale, filename);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return flattenKeys(content, filename.replace('.json', ''));
}
```

The `Array.isArray` leaf branch is exactly what makes D-09's MF2-shaped `selectExact`
key-set-comparable against the string-shaped type-gen entry.

**Surrounding test shape to mirror (`:~118` in the same file):**

```typescript
describe.each(otherLocales)(`'%s' has same message keys as '${firstLocale}'`, (locale) => {
  test.each(firstLocaleFilenames)('in %s', (filename) => {
    expect(getMessageKeys(locale, filename)).toEqual(firstLocaleFileKeys[filename]);
  });
});
```

**Module-level setup already present — reuse, do not redeclare:** `messagesDir`
(resolved via `fileURLToPath(import.meta.url)`), `translationLocales`, `firstLocale`,
`otherLocales`, `firstLocaleFilenames`.

**New-code obligations (RESEARCH §B.6, Pitfalls 4-5):**
- `translationsDir` sibling constant → `'..', 'translations'`.
- The type-gen side must **prefix the filename** as the namespace (`translations/` is
  UNWRAPPED; `messages/` is WRAPPED). Filter `.filter(f => f.endsWith('.json'))` —
  `index.ts` / `translations.type.ts` live there too.
- Explicit documented `EXPECTED_MESSAGES_ONLY = new Set(translationLocales.map(l => 'lang.' + l))`.
  Never a blanket "ignore `lang.json`".
- Two **named-direction set differences** with the missing keys in the assertion
  message — not a `toEqual` on two 1000-key arrays.
- Unit tests alias `$lib/paraglide/*` to mocks (`vitest.config.ts:16-23`), so this must
  be a **filesystem** assertion, never a `t()` call.

**Hard sequencing:** this test fails by construction until D-08 lands.

---

### 5. MF2 plural declaration (D-09 / D-18)

**Analog: `apps/frontend/messages/en/questions.json:16-28` — `questions.category.numQuestions`.**
The same file the new key goes into; identical structure in all 7 locales, `one`/`other`
only, no locale-specific extra categories.

```jsonc
"category": {
  "numQuestions": [
    {
      "declarations": ["input numQuestions", "local numQuestionsPlural = numQuestions: plural"],
      "selectors": ["numQuestionsPlural"],
      "match": {
        "numQuestionsPlural=other": "{numQuestions} questions",
        "numQuestionsPlural=one": "1 question"
      }
    }
  ],
  "skip": "Skip This Category"
}
```

**Authoring template for `selectExact` (call site passes `count`, `QuestionChoices.svelte:421`):**

```jsonc
"multiChoice": {
  "selectExact": [
    {
      "declarations": ["input count", "local countPlural = count: plural"],
      "selectors": ["countPlural"],
      "match": {
        "countPlural=other": "Select {count} options.",
        "countPlural=one": "Select 1 option."
      }
    }
  ],
  "selectRange": "Select {min} to {max} options."
}
```

**Two things to verify at build time, not assume** (RESEARCH §B.5): (a) `count` as an
MF2 input name has **no in-repo precedent** — every existing declaration uses a
`numX`-style name; (b) the 6 non-English singulars are constructed, MEDIUM confidence →
D-18's UAT review item is a **required deliverable**.

**File conventions:** `messages/{loc}/X.json` is WRAPPED — one top-level key byte-equal
to the filename. `components.json`'s existing top-level keys are *mostly* alphabetical
with `questionExtendedInfo` appended last; prettier does not sort JSON keys. `plural`
values elsewhere in `translations/` must be mirrored **verbatim** including the
en-dash/hyphen inconsistency in `selectRange` (`da` uses `-`, `fi/sv/et` use `–`).

**No `settings.json` edit needed** — `questions.json` (line 53) and `components.json`
(line 38) are already in the 47-entry `pathPattern` allowlist.

---

### 6. `isEmptyValue()` guard (D-12)

**Analog: `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:2, 230-234`** —
the sibling path operating on the identical value shape (`savedData.answers?.[id]?.value`).

```typescript
import { ENTITY_TYPE, isEmptyValue, QUESTION_CATEGORY_TYPE } from '@openvaa/data';
```

```typescript
#unansweredOpinionQuestions = $derived.by(() => {
  const savedData = this.#userData.savedCandidateData;
  if (!savedData) return this.#opinionQuestions;
  return this.#opinionQuestions.filter((q) => isEmptyValue(savedData.answers?.[q.id]?.value));
});
```

**Copy the import source, not just the function:** `@openvaa/data` (re-export at
`packages/data/src/internal.ts:19`), **not** `@openvaa/core` — matches the sibling and
avoids a second import source in one feature area. `+page.svelte` already imports
`AnyQuestionVariant` / `Answer` from `@openvaa/data` at line 25, so this joins an
existing import statement.

**Guard polarity at the call site** (`questions/+page.svelte:58`): the existing line is
`if (!localizedAnswer?.value) return undefined;` → becomes an `isEmptyValue(...)` test.
Note `localizedAnswer` itself may be `undefined`; `isEmptyValue(undefined)` returns
`true`, so `isEmptyValue(localizedAnswer?.value)` covers both conditions in one call.

**Do not regress CLAUDE.md C-6:** the surrounding file already reads context via
`candCtx.X` (lines 41-43, 79, 114, 131, 136, 142). No destructuring.

---

### 7. `text-label` → `small-label` (D-02)

**Analog: existing `small-label` consumers** — `ConstituencySelector.svelte:300`
(`<div class="small-label">{election.shortName}</div>`) and
`QuestionChoices.svelte:419` (`class="small-label text-secondary mt-md text-center"`).
Token definition `app.css:384` → `@apply text-secondary text-xs font-normal uppercase`.

**Mechanical rule:** swap the class name only; **preserve sibling utilities**:
`class="small-label min-w-[6rem] text-start"` and
`class="small-label min-w-[6rem] justify-start text-start"`.
Lines are **85, 98, 113** (D-19 — ROADMAP/REQUIREMENTS' 84/97/112 point at the
enclosing `<label>`).

Appearance change is accepted and must be named in the SUMMARY (D-22): UPPERCASE,
~11.5px, 5.74:1 light / 6.24:1 dark.

---

### 8. `ConstituencySelector` `.faded` removal (D-17 Option A)

**No cross-file analog** — the change is a data gate on the component's own `{#if}`,
matching the sibling gates in the same file. Target `:293-303`:
add `&& sections[sectionIndex].selectedId` to the `{#if applicableElections.length > 1}`
condition and drop `class:faded`. Then delete the now-dead `.faded` rule at
`app.css:356-358` (single consumer repo-wide — re-grep to confirm before deleting).
`transition-opacity` on that div becomes meaningless once `class:faded` is gone.

---

### 9. E2E lock edits (D-11, D-21)

**Analog: `candidate-journey.spec.ts` itself** — both edits are in-place amendments to
existing steps, per D-11/D-21 ("no new spec files for coverage's sake").

- **Step 18.5** (`:802-815`): strip the 12-line BLOCKER-130-05 comment; restore the
  `/2.*3/` content assertion immediately after the existing
  `await expect(helper).toBeVisible();`.
- **Step 18.6** (`:881-900`): `selectChoice(1)` → `selectChoice(0)`; replace the 8-line
  workaround comment with a FIX-03 lock note; keep both existing round-trip assertions
  (they now *prove* the fix); add the discriminating assertion:
  ```typescript
  await expect(boolCard.first().getByTestId(testIds.candidate.questions.cardAction))
    .toHaveText(/Edit Your Answer/i);
  ```
- **Accessible-name locks for the other newly-fixed keys** — assert only where a spec
  already visits: `multiple-text-{add,remove,move-up,move-down}` accessible names in the
  existing MultipleText round-trip; `getByRole('listbox', { name: 'Select an option' })`
  on the results route for `accordionSelect.listboxAriaLabel`.

**Ripple check before committing 18.6:** step 19 (`walkRemainingOpinionQuestions`) is
unaffected (`isEmptyValue(false) === false`); verify step 21 (preview) does not assert
the specific "yes" label.

---

## Shared Patterns

### Testid discipline
**Source:** `tests/tests/utils/testIds.ts`
**Apply to:** every a11y route entry and every new assertion.
Always reference the constant (`testIds.voter.results.filterNumericMin`), never a string
literal. **Call-site shadowing gotcha** (Pitfall 7): `{...concatClass(restProps, …)}`
spreads *after* the literal attribute, so a call-site `data-testid` **overrides** the
component's. `constituency-selector` → `voter-constituencies-list`;
`election-selector` → `voter-elections-list`. Verify at the call site, not the component.

### Settle discipline
**Source:** `a11y-smoke.spec.ts:85-99` (`awaitAnimationsSettled`) + `:198-227` (runner)
**Apply to:** every scan entry.
`page.goto` → data-driven `contentTestId` wait → optional interaction → `awaitAnimationsSettled`
→ `AxeBuilder(...).withTags(WCAG_TAGS).analyze()` → `assertAxeGates`.
Never a network-idle settle. Never `waitForTimeout`. Never a `getByRole('heading')` settle
(the hole D-04 closes). `awaitAnimationsSettled` awaits only **finite** Web Animations —
it cannot clear a steady-state `opacity` utility (Pitfall 2).

### Redirect-awareness
**Source:** `apps/frontend/src/routes/(voters)/constituencies/+page.ts:59-62`
**Apply to:** every new scan route.
`+page.ts load()` may `redirect(307, …)`. A `contentTestId` unique to the intended route
detects this automatically — that is how the constituencies duplicate was found.

### Timeout constants
**Source:** `tests/tests/helpers` → `TIMEOUTS`
**Apply to:** all new waits. The existing route entries use bare `10000` literals; new
code should use `TIMEOUTS.slowPage` / `TIMEOUTS.page` (the dominant convention across
`voter-journey.spec.ts` and the fixtures).

### Dev-server / HMR hygiene
**Source:** RESEARCH §D.3-D.4; Phase 132 `132-CONTEXT.md:54-67`
**Apply to:** every verification run.
This phase edits Paraglide message JSON (Vite-plugin-compiled) and CSS classes —
**restart the dev server** before trusting any E2E result. 3× gate: fresh `:5173` +
`yarn db:reset` per run; any failure restarts the count at 0; never bare
`npx supabase start` from the repo root.

---

## No Analog Found

None. Every artefact in this phase has an in-repo precedent. The nearest thing to a
green-field artefact is the D-10 parity assertion, and its host file already supplies
the flattener, the locale enumeration and the `describe.each` shape — the genuinely new
code is the `translationsDir` reader plus two set-difference assertions (~30 lines).

---

## Metadata

**Analog search scope:** `tests/tests/specs/{a11y,voter,candidate}/`,
`tests/tests/fixtures/voter/`, `tests/tests/utils/`, `apps/frontend/src/lib/i18n/`,
`apps/frontend/messages/`, `apps/frontend/src/lib/components/{entityFilters,constituencySelector,questions}/`,
`apps/frontend/src/lib/contexts/candidate/`, `apps/frontend/src/routes/candidate/(protected)/questions/`
**Files scanned:** ~14 read/grepped (RESEARCH.md supplied the verified line-level detail
for the rest)
**Pattern extraction date:** 2026-08-10
