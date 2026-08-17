# Phase 82: A11Y-01 PRODUCT-GAP Cell — Required-Empty - Research

**Researched:** 2026-05-13
**Domain:** Svelte 5 candidate-app save-gate + dev-seed dispatch shape + Playwright cell extension
**Confidence:** HIGH

## Summary

Phase 82 closes A11Y-07 by wiring `allRequiredFilled` into `canSubmit` at `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92`, adding 1 new info question + 1 Alpha answer cell to the e2e seed, and adding 1 new spec cell to `tests/tests/specs/candidate/candidate-profile-validation.spec.ts`. CONTEXT.md locks every product decision; this research validates the LOCKED implementation shape and surfaces TWO landmines in the proposed seed authoring that the planner MUST correct.

**Primary recommendation:** Land the 1-line `canSubmit` change exactly as CONTEXT D-01 specifies. **DEVIATE from CONTEXT D-03 + D-04 in two places: (1) put `required: true` inside `custom_data`, NOT at the top level; (2) use a `LocalizedString` answer shape `{ en: 'sentinel-82-required' }`, NOT a plain string.** Both deviations are required for the change to actually surface a required info question in `candCtx.requiredInfoQuestions` and to round-trip through the `text-multilingual` rendering path. See LANDMINE-1 and LANDMINE-2 below.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| A11Y-07 | Candidate profile required-empty save behavior is decided and enforced consistently. TIGHTEN-SOFT: empty-required disables the submit button via `canSubmit` gate. Spec assertion + new fixture row. | §"Implementation Approach" + §"Code Examples" + §"Validation Architecture" cover the 4 files modified. |

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01** TIGHTEN-SOFT: wire `allRequiredFilled` into `canSubmit` via `let canSubmit = $derived(status !== 'loading' && allRequiredFilled);` at `+page.svelte:92`. No re-ordering; no defense-in-depth change.
- **D-03** Add NEW sort-24 `test-question-required-empty-1` info question (additive — do NOT promote `test-question-displayname`).
- **D-04** Alpha seeds a sentinel answer (`sentinel-82-required`) so Alpha stays `profileComplete` by default.
- **D-05** Cell 4 standalone `test(...)` block: visit profile → assert submit enabled → `fill('').blur()` → assert submit disabled → assert input value `''`.
- **D-06** Cell 4 OUTSIDE the existing TEXT_CELLS / IMAGE_CELLS for-loops.
- **D-07** Use `getByTestId(testIds.candidate.profile.submit)` as the submit anchor.
- **D-08** Test title must not collide with the 14 `IMGPROXY_TIED_TITLES` patterns. (Verified: it doesn't.)
- **D-09** Update `candidate-profile-validation.spec.ts:23-35` deferred-cells docstring to note A11Y-07 is resolved.
- **D-10** + **D-13** Inherit Phase 80 / Phase 81 determinism contract: 3-run cold-start `--workers=1` + vite-cache wipe + IMGPROXY_TIED_TITLES untouched.
- **D-11** Phase 79 v2.10 anchor at SHA `ff0334f856…` (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE) MUST hold; expected +1 PASS_LOCKED addition.
- **D-12** Parity-script self-identity smoke + additive constants update at Plan 01 close if needed.
- **D-14** Verify no existing base-project spec relies on `requiredInfoQuestions.length === 0`. (Verified — see LANDMINE-3 below.)
- **D-15** Skip `/gsd-ui-phase` auto-spawn (no visual redesign).
- **D-16** 1 bundled plan; ~25 LOC total.
- **D-17** Role/aria locators by default; `testIds.candidate.profile.submit` for the submit-button anchor; `playwright/no-raw-locators` at `'error'`.

### Claude's Discretion

- **`canSubmit` expression shape**: inline `&& allRequiredFilled` (default — minimal diff) or named intermediate `submitGate`. Recommended: inline (matches D-16's "minimal diff" framing).
- **Alpha answer sentinel value text**: `'sentinel-82-required'` (default). Recommended as-is.
- **Question name string**: `'Required-empty (Phase 82 A11Y-07 anchor)'` (default). Recommended as-is — matches the Phase 76 / Phase 81 anchor-naming pattern that the spec's `getByLabel(/.../i)` regex depends on.
- **Standalone test() vs TEXT_CELLS expansion**: standalone (default). Recommended as-is per D-06.
- **Docstring rewrite text**: planner crafts at PLAN.md time.

### Deferred Ideas (OUT OF SCOPE)

- **D-02 / FUTURE PRODUCT CHANGE (v2.11+)** — Allow incomplete profile save + gate opinion-questions entry. Phase 82 close must author `.planning/todos/pending/2026-05-13-allow-incomplete-profile-save-gate-opinion-questions.md`.
- **REJECT-with-inline-error variant** — adds Input.svelte branch + save-handler abort + new i18n key in 14 catalogs. v2.11+ escalation if disabled-button feedback proves too quiet.
- **SOFT-WARN-ONLY close (no code change)** — REJECTED in CONTEXT; perpetuates the badge-vs-button lie.
- **Promote `test-question-displayname` to required:true** — couples to Phase 76 P01 cell 3 + Phase 76 P02 anchors.
- **Cell 4 stronger assertions (notice opacity flip / refill round-trip)** — Phase 82 contract is the gate, not implementation detail.
- **`kind: 'gate'` TEXT_CELLS discriminant** — not worth the abstraction for a single cell.
- **i18n key coverage audit across 14 locale catalogs** — Phase 82 adds zero new keys; doesn't apply.

## Project Constraints (from CLAUDE.md)

- **WCAG 2.1 AA accessibility** — Phase 82 changes preserve the existing badge / notice / aria semantics; no new accessible surface introduced.
- **TypeScript strict** — `canSubmit` stays `boolean`; the `&& allRequiredFilled` keeps the return type narrow.
- **Svelte 5 Context Destructuring Rule** — `candCtx.requiredInfoQuestions` is a reactive accessor; already correctly read via `candCtx.requiredInfoQuestions` (NOT destructured) at `+page.svelte:95`. NO change.
- **`db:*` canonical commands** — verification recipe uses `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean` per Phase 80 D-11 / Phase 81 D-13 inheritance.
- **Yarn arg-forwarding caveat** — `yarn db:reset-with-data --likert-only` does NOT forward `--likert-only`; Phase 82 is NOT a Likert-only run; use the 3-command chain.
- **Code Review Checklist** — apply at PLAN.md authoring + per-plan close (path: `/.agents/code-review-checklist.md`).
- **`playwright/no-raw-locators` lint at `'error'`** — modified spec must pass `yarn lint:check`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Submit-button gate | Frontend Server (SSR) component (`+page.svelte`) | — | The save-gate runs inside the candidate-app SvelteKit component; the underlying `userData.save()` POST hits the Supabase backend but the GATE itself (whether to enable the button) is computed in the browser-side `$derived` chain. |
| `requiredInfoQuestions` derivation | Frontend Server (SSR) — Svelte 5 context | Database / Storage | The filter (`customData.required === true`) is computed in `candidateContext.svelte.ts`; the data source is the `questions.custom_data` JSONB column. Phase 82 changes the SEED for that JSONB column. |
| e2e fixture row | Database / Storage (via dev-seed) | — | `packages/dev-seed/src/templates/e2e.ts` writes to the `questions` table during `yarn db:seed --template e2e`. |
| Spec assertion (Playwright) | Browser / Client (test runner) | — | `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` drives the browser and asserts on rendered DOM. |
| Determinism / parity gate | Browser / Client (test runner) + cache + DB | — | The 3-run cold-start contract requires DB reset + vite-cache wipe to remove cross-run state. |

## Standard Stack

### Core (verified — `.yarnrc.yml` catalog)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | ^5.53.12 | Component framework; `$derived` rune drives the reactive `canSubmit` chain | OpenVAA v2.6+ standard; locked by milestone |
| @sveltejs/kit | ^2.55.0 | App framework; route at `(protected)/profile/+page.svelte` | Already in use |
| @playwright/test | ^1.58.2 | E2E test runner; `fill('')`, `.blur()`, `toBeDisabled()`, `getByLabel`, `getByTestId` | Already in use; Phase 81 spec inheritance |
| @openvaa/dev-seed | workspace:^ | Seeds the test DB via `yarn db:seed --template e2e` | Workspace package; Phase 76 P01 fixture-extension lineage |
| @openvaa/app-shared | workspace:^ | Provides `getCustomData(q)` (reads `q.customData`) — the canonical accessor | Codebase-wide convention |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @openvaa/data | workspace:^ | `isEmptyValue` utility used by `requiredInfoQuestions` filter | Already imported by `+page.svelte` + `candidateContext.svelte.ts` |
| eslint-plugin-playwright | ^2.9.0 | `no-raw-locators` + `no-conditional-in-test` at `'error'` | Lint gate for the modified spec |

**Installation:** No new packages. Phase 82 is configuration + 1-line code change + spec authoring.

## Architecture Patterns

### System Architecture Diagram (Phase 82 dataflow)

```
DB Seed (e2e.ts)                             Frontend (Svelte 5)                        Playwright Test
─────────────────                            ───────────────────                        ───────────────
fixed[] row with                             candCtx.requiredInfoQuestions              page.goto(profile)
custom_data:{required:true}        ─►        = _infoQuestions.filter(q =>     ─►        getByLabel(...).first()
+ Alpha answer                               getCustomData(q).required &&               .fill('') + .blur()
{ value: { en: 'sentinel-82-...'} }          !getCustomData(q).locked)                  ↓
                                             ↓                                          Input.svelte handleChange
yarn db:seed --template e2e                  allRequiredFilled = $derived(              (multilingual branch)
                                             !candCtx.requiredInfoQuestions             ↓
                                             .some(q => isEmptyValue(                   value.en = ''
                                             userData.current?.candidate.               ↓
                                             answers?.[q.id]?.value)))                  onChange → userData.setAnswer
                                             ↓                                          ↓
                                             canSubmit = $derived(                      candCtx re-derives:
                                             status !== 'loading' &&                    requiredInfoQuestions includes
                                             allRequiredFilled)        ◄────────────    this q; isEmptyValue('') = true
                                             ↓                                          ↓
                                             <Button disabled={!canSubmit}              expect(submit).toBeDisabled()
                                             data-testid="profile-submit" />            ↓
                                                                                        expect(input).toHaveValue('')
```

### Pattern 1: TIGHTEN-SOFT save-gate via $derived
**What:** Wire an existing `$derived` boolean into the submit-button gate without introducing new state.
**When to use:** When a UI badge/notice already promises a behavior the underlying button doesn't enforce. Fixes the "badge lies" pattern with a minimal-diff `&&`.
**Example:**
```svelte
<!-- Source: apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92 -->
<!-- BEFORE -->
let canSubmit = $derived(status !== 'loading');

<!-- AFTER (Phase 82) -->
let canSubmit = $derived(status !== 'loading' && allRequiredFilled);
```

### Pattern 2: Additive e2e fixture extension (Phase 76 / Phase 81 inheritance)
**What:** Add a new question row with a new `sort_order` past the existing tail (sort 24 here); seed an Alpha answer to preserve `profileComplete=true`.
**When to use:** When an existing test surface needs new data without perturbing other anchors.
**Example:** see §"Code Examples — Question row" below for the CORRECTED shape.

### Pattern 3: Standalone test() block alongside parameterized for-loops
**What:** Phase 82 cell 4 lives OUTSIDE the existing `for (const cell of TEXT_CELLS.filter(...))` loops because its contract (button-disable on `profile-submit` testId) is structurally different from the format/maxlength contracts (field-level error UI on `getByText(error)`).
**When to use:** When a new cell's assertion shape doesn't share its locator+matcher pair with existing cells.

### Anti-Patterns to Avoid
- **DO NOT** put `required: true` at the TOP LEVEL of the question seed row. The DB `questions.required` boolean column is read NOWHERE in the frontend filter chain. The canonical dispatch is `custom_data.required: true`. See LANDMINE-1.
- **DO NOT** seed a plain-string answer (`'sentinel-82-required'`) for a multilingual-rendered text question. The QuestionInput dispatches to `text-multilingual` (the default for `type='text'` without `subtype`), and `handleChange` writes `(value as LocalizedString)[locale] = ...` — overwriting a plain-string primitive is a no-op in non-strict mode (or throws in strict). Use `{ value: { en: 'sentinel-82-required' } }`. See LANDMINE-2.
- **DO NOT** add the cell inside the existing `for (const cell of TEXT_CELLS.filter((c) => c.kind === 'format'))` loop — the assertion shape (testId-based + `toBeDisabled` vs label-based + error text) is incompatible.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| New "required field empty" error UI | Inline error message via new i18n key + Input.svelte branch | The existing `showRequired` badge at `Input.svelte:135,624-628` + the new `canSubmit` gate | TIGHTEN-SOFT (D-01) intentionally avoids this — the badge already signals "required" via the sr-only "Required" text; Phase 82 just makes the button match. |
| Empty-value detection | Custom string-trim / null-check | `isEmptyValue` from `@openvaa/data` (`packages/data/src/utils/answer.ts:15`) | Already handles strings/arrays/objects/dates with the empty-trimmed-string semantics the rest of the codebase relies on. |
| Submit button locator | Raw CSS / aria-label selector | `page.getByTestId(testIds.candidate.profile.submit)` | The testId registry at `tests/tests/utils/testIds.ts:20` already maps `candidate.profile.submit = 'profile-submit'`; the data-testid is on the rendered `<button>` at `+page.svelte:308`. |
| customData.required dispatch | Top-level question `required` column | `custom_data: { required: true }` JSONB key | The frontend reads ONLY `getCustomData(q).required` (= `q.customData.required`) at `candidateContext.svelte.ts:350`. The DB top-level `required` column is unused in this filter chain. |

**Key insight:** Phase 82's surface is small enough that the failure modes are mostly in seed-shape correctness (LANDMINE-1, LANDMINE-2), not in build-it-yourself missteps. The 1-line `canSubmit` change is well-typed and uses only existing reactive primitives.

## Runtime State Inventory

> Not applicable. Phase 82 is a code + seed + spec change; no renames, no service migrations, no OS-registered state, no secrets, no build artifacts to refresh.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Phase 82's seed change is consumed at `yarn db:seed`; the `db:reset && db:seed` cycle in the verification recipe re-creates the DB from scratch | None |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | The `apps/frontend/.svelte-kit` + `apps/frontend/node_modules/.vite` caches MUST be wiped before the 3-run cold-start gate per D-10 — the canonical `yarn dev:clean` step | Included in the verification recipe |

## Common Pitfalls

### LANDMINE-1: `required: true` at the top level does NOT surface in `requiredInfoQuestions`

**What goes wrong:** CONTEXT D-03 specifies the new question row as:
```typescript
{
  external_id: 'test-question-required-empty-1',
  type: 'text',
  name: { en: 'Required-empty (Phase 82 A11Y-07 anchor)' },
  category: { external_id: 'test-category-info' },
  allow_open: false,
  required: true,            // ← TOP-LEVEL (this is the LANDMINE)
  sort_order: 24,
  is_generated: false
}
```
This authors `questions.required = true` in the DB (top-level boolean column at `apps/supabase/supabase/migrations/00001_initial_schema.sql:628`). But `candCtx.requiredInfoQuestions` at `candidateContext.svelte.ts:347-352` reads via `getCustomData(q).required` — i.e., `q.customData.required` — which is loaded from the DB `questions.custom_data` JSONB column (via `toDataObject` at `apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.ts`). The top-level `required` column is NEVER folded into `customData.required` by the adapter.

**Evidence:**
- `candidateContext.svelte.ts:350`: `return !customData.locked && customData.required;` ← reads `customData.required`
- `getCustomData.ts:6-8`: returns `object.customData ?? {}` ← no fallback to top-level
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:521-546`: question row passes through `toDataObject` + manual mapping; no logic mirrors `row.required` → `row.custom_data.required`
- **Canonical proof:** `tests/tests/setup/templates/variant-hidden-required.ts:151-156` (the EXISTING SETTINGS-03 variant overlay) authors the required-flip as `custom_data: { ...((row.custom_data ?? {}) as object), required: true }` — NOT as a top-level field. This template demonstrably works (`tests/tests/specs/candidate/candidate-required-info.spec.ts` passes against it).

**Why it happens:** The dev-seed `QuestionsGenerator` spreads `...fx` from `fixed[]` rows verbatim into the DB row (`packages/dev-seed/src/generators/QuestionsGenerator.ts:100-106`); a top-level `required` field maps to the top-level DB column. The frontend filter reads `custom_data.required` only.

**How to avoid:** Author the new question row with `custom_data: { required: true }`:
```typescript
{
  external_id: 'test-question-required-empty-1',
  type: 'text',
  name: { en: 'Required-empty (Phase 82 A11Y-07 anchor)' },
  category: { external_id: 'test-category-info' },
  custom_data: { required: true },   // ← INSIDE custom_data
  allow_open: false,
  // NOTE: omit top-level `required:` entirely — DB default is `true` per
  // migration line 628, and the frontend ignores it anyway. Or set it to
  // `false` for symmetry with `test-question-displayname` (sort 19).
  sort_order: 24,
  is_generated: false
}
```

**Warning signs:** After running `yarn db:seed --template e2e`, navigate to `/candidate/profile` as Alpha and verify the "Required" notice + sr-only badge are PRESENT on the new question's input. If they aren't, `customData.required` didn't surface.

### LANDMINE-2: Plain-string Alpha answer for `text-multilingual` rendering breaks reactive write-back

**What goes wrong:** CONTEXT D-04 specifies Alpha's answer as:
```typescript
'test-question-required-empty-1': { value: 'sentinel-82-required' }
```
A plain string. The new question has `type: 'text'` with NO `subtype` (per CONTEXT D-03). QuestionInput.svelte:63-77 dispatches:
- type='text' + subtype=undefined + disableMultilingual=false (default) + customData.disableMultilingual=undefined → `type = 'text-multilingual'`

At Input.svelte:248-250, `handleChange` for multilingual writes: `(value as LocalizedString)[locale] = currentTarget.value`. If `value` is a plain string `'sentinel-82-required'`, setting `.en` on a primitive is a silent no-op in non-strict mode (or `TypeError` in strict). The `value` reference never updates. `onChange` then fires with the unchanged plain string, `userData.setAnswer` writes the SAME old string, `requiredInfoQuestions.some(isEmptyValue) === false`, `allRequiredFilled === true`, and the button STAYS enabled — defeating the test.

Even worse: on first render, the value flows through QuestionInput.svelte:108-110 — for `text-multilingual`, `value = isLocalizedString(value) || typeof value === 'string' ? value : undefined`. So a plain string IS preserved on first render (Alpha sees `'sentinel-82-required'` in the EN input). But the `handleChange` write-back path breaks for the reasons above.

**Evidence:**
- `apps/frontend/src/lib/components/input/Input.svelte:248-250` — multilingual `handleChange`: `(value as LocalizedString)[locale] = currentTarget.value;`
- `apps/frontend/src/lib/components/input/QuestionInput.svelte:72-77` — type dispatches `'text' → 'text-multilingual'` unless `disableMultilingual` is set
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:279` — does NOT set `disableMultilingual` on the editable QuestionInput
- **Canonical proof:** `test-question-displayname` (Phase 76 anchor, also `type='text'` no subtype, multilingual) seeds Alpha as `{ value: { en: 'Display Name Sentinel 76' } }` — LocalizedString, NOT plain string. That answer flows correctly through the maxlength cell at `candidate-profile-validation.spec.ts:239-273`.
- The post-Phase-81 `test-question-social-1` plain-string answer pattern at `e2e.ts:801-802` works ONLY because that question has `subtype: 'link'` → dispatches to single-locale `'url'` input, NOT multilingual.

**How to avoid:** Seed Alpha's answer as a LocalizedString:
```typescript
'test-question-required-empty-1': { value: { en: 'sentinel-82-required' } }
```
The value-disjointness invariant is preserved (no `'alpha'` substring). `isEmptyValue({en: 'sentinel-82-required'}) === false` (LocalizedString with non-empty EN). Alpha stays profileComplete.

**Verification:** Manually run `yarn db:reset && yarn db:seed --template e2e` then `yarn dev`; login as Alpha at `/candidate/profile`; type into the new question's EN input, blur, refresh — confirm the new value persists.

### LANDMINE-3: D-14 dependency check — base-project specs do NOT rely on the empty-list case

**What goes wrong:** If any existing spec in the `candidate-app` / `candidate-app-mutation` / `voter-app` projects asserts `requiredInfoQuestions.length === 0` or `allRequiredFilled === true` (without first filling the field), Phase 82 would break it.

**Evidence (resolved):** `grep -rn "requiredInfoQuestions\|allRequiredFilled\|profileComplete" tests/ apps/frontend/src/` surfaces:
- `tests/tests/specs/candidate/candidate-required-info.spec.ts` — SETTINGS-03 spec; runs in the `variant-hidden-required-candidate` PROJECT (separate from base candidate-app + candidate-app-mutation). Uses an OVERLAY seed that flips `custom_data.required` on `test-question-displayname` and DELETES Alpha's answer. Does NOT depend on the base seed having zero required info questions.
- `tests/tests/setup/templates/variant-hidden-required.ts` — the overlay template (NOT loaded by the base e2e seed).
- `apps/frontend/src/routes/candidate/(protected)/+page.svelte:36,98,179,183` — `candCtx.profileComplete` reads at CandAppHome and profile snippet. Alpha is `profileComplete=true` post-Phase-82 (sentinel answer seeded) → behavior unchanged.
- `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:81` — same.

**How to avoid:** None — the risk is already mitigated. The new sort-24 required info question is the FIRST in the base seed; only Alpha is asserted-against in base-project tests; Alpha is `profileComplete=true` by construction.

**Cross-check:** Other candidates in the e2e seed (`beta`, `gamma`, `delta`, `epsilon`, `voter-cand-*`) do NOT seed `test-question-required-empty-1`. Their `profileComplete` becomes `false` post-Phase-82. Voter-app's `hideIfMissingAnswers` filter at `apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.svelte.ts:85-94` checks ONLY OPINION questions (`opinionQuestions.every((q) => n.entity.getAnswer(q) != null)`) — info-question state does NOT remove candidates from voter-app results. ✅

### Pitfall 4: $derived declaration order — `canSubmit` references `allRequiredFilled` defined later in the script
**What goes wrong:** `canSubmit` at line 92 references `allRequiredFilled` at line 94. In JavaScript, `let` declarations have a Temporal Dead Zone — reading `allRequiredFilled` BEFORE its declaration would throw `ReferenceError`. But Svelte 5's `$derived(...)` expression is LAZY — it captures the expression as a thunk and only EVALUATES it on read.
**Why it's safe:** By the time the template reads `canSubmit` (line 304's `disabled={!canSubmit}`), all `let` declarations in the `<script>` block have completed initialization. The reactive dependency graph is built at first-read, not at declaration time.
**Warning signs:** A `state_referenced_locally` warning in dev console would suggest the captured value is stale — but this only applies when a `$derived` is captured in a closure that escapes the scope (e.g., setContext). Not applicable here. (See also: https://github.com/sveltejs/svelte/issues/16608 for a related setContext warning.)

### Pitfall 5: `handleSubmit` guard at lines 126-130 is defense-in-depth — keep it
The `if (!canSubmit) { status = 'error'; logDebugError(...); return; }` guard catches the edge case where a user programmatically dispatches `click` on a disabled button (e.g., browser-extension, automated tooling). Without it, a programmatic click would fall through to `userData.save()` with an incomplete profile and surface a save error from the backend. Phase 82's `canSubmit` change strengthens the gate but does NOT obsolete this guard — keep it.

### Pitfall 6: `fill('')` does NOT trigger `change` event — `blur()` is REQUIRED (BLUR INVARIANT)
Per Phase 81 D-11 inheritance: Input.svelte binds `onchange` (NOT `oninput`) on the input at lines 419, 441, 595, 614-621. Playwright's `fill('')` fires DOM `input` events per character (here: one event for the bulk-clear) but `change` only fires on blur. The reactive chain (`Input.value → onChange → userData.setAnswer → candCtx.requiredInfoQuestions filter → allRequiredFilled re-derivation → canSubmit re-derivation → disabled prop re-render`) ONLY engages after `change` fires. **`fill('').blur()` is mandatory.** The existing format-rejection cells (lines 305-306) demonstrate the pattern.

### Pitfall 7: `getByLabel(...).first()` is REQUIRED for multilingual-rendered questions
Per LANDMINE-2 inheritance: the new question dispatches to `text-multilingual`, which renders one `<input>` per supported locale. All inputs share `aria-labelledby="{id}-label {id}-label-{locale}"` — Playwright's `getByLabel(/regex/i)` matches via accessible-name computation. Multiple matches resolve to the EN input via `.first()` (since the loop at `Input.svelte:395` iterates `[currentLocale, ...locales.filter(l => l !== currentLocale)]` — `currentLocale === 'en'` for the spec). Without `.first()`, strict-mode locator violation. CONTEXT D-05 already specifies `.first()`. ✅

### Pitfall 8: `voterAnswerCount=16` overlap claim is technically misleading but result is correct
CONTEXT D-03 says "sort 24 > 16, voter never encounters this info question." The actual reason the voter fixture skips this question is that `voterAnswerCount=16` iterates OPINION questions (visited via `navigateToFirstQuestion` → Likert clicks in `tests/tests/fixtures/voter.fixture.ts:55-78`); INFO questions (category `test-category-info`) are never entered by the voter flow. The sort-order claim is incidental. Result is correct: voter app is unaffected by the new info question.

## Code Examples

### CORRECTED Question row (replaces CONTEXT D-03)
```typescript
// Source: pattern derived from tests/tests/setup/templates/variant-hidden-required.ts:151-156
// + e2e.ts existing displayname/bio anchors at sort 19/20.
// Insert after sort-23 test-question-email-1 (Phase 81 A11Y-05 anchor) at e2e.ts ~line 701.
//
// Phase 82 A11Y-07 anchor — required-empty save-gate dispatch via custom_data.required=true.
// profile/+page.svelte:94 derives allRequiredFilled from candCtx.requiredInfoQuestions
// (apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:347-352, which reads
// getCustomData(q).required = q.customData.required) + isEmptyValue(
// userData.current?.candidate.answers?.[q.id]?.value). Phase 82 wires allRequiredFilled into
// canSubmit at :92 so the submit button becomes truly disabled when this row's answer is empty.
//
// CUSTOM_DATA INVARIANT (Phase 82 RESEARCH LANDMINE-1): `required` MUST be inside
// custom_data — the frontend filter at candidateContext.svelte.ts:350 reads
// `customData.required`, NOT the top-level `required` DB column. The variant-hidden-required
// template at tests/tests/setup/templates/variant-hidden-required.ts:151-156 is the canonical
// dispatch pattern.
//
// ALPHA-COMPLETENESS INVARIANT (Phase 76 P02 + Phase 81 + downstream specs assuming
// profileComplete): Alpha MUST seed an answer for this row so Alpha stays profileComplete by
// default. Otherwise candidate-app + candidate-app-mutation specs that don't explicitly clear
// answers would race against the "Required" notice + the newly-disabled submit button.
//
// VALUE-DISJOINTNESS INVARIANT (Phase 76 P01 fixture-extension fix + Phase 81 D-08 inheritance):
// Alpha's answer value MUST NOT contain the substring 'Alpha' / 'alpha' (case-insensitive).
// 'sentinel-82-required' below is disjoint.
//
// sort_order: 24 — placed AFTER Phase 81's test-question-email-1 (sort 23). Voter fixture
// only iterates opinion questions; this info question is never encountered regardless of
// sort_order, but sort 24 keeps the additive-numbering convention from Phase 81 D-07 / D-08.
//
// No subtype: plain text input (dispatches to 'text-multilingual' per QuestionInput.svelte:72-77).
// No custom_data.maxlength: required-empty cell asserts on the gate, not on character-cap
// (Phase 76 P01 cell 3 already covers maxlength).
{
  external_id: 'test-question-required-empty-1',
  type: 'text',
  name: { en: 'Required-empty (Phase 82 A11Y-07 anchor)' },
  category: { external_id: 'test-category-info' },
  custom_data: { required: true },
  allow_open: false,
  sort_order: 24,
  is_generated: false
}
```

### CORRECTED Alpha answer cell (replaces CONTEXT D-04)
```typescript
// Source: pattern from e2e.ts:797 test-question-displayname (also type='text' no-subtype
// multilingual). Insert at e2e.ts ~line 810 (after the test-question-email-1 entry in Alpha's
// answersByExternalId block).
//
// MULTILINGUAL-ANSWER INVARIANT (Phase 82 RESEARCH LANDMINE-2): the new question dispatches
// to 'text-multilingual' (QuestionInput.svelte:72-77). Input.svelte's handleChange writes
// (value as LocalizedString)[locale] = currentTarget.value at line 249. A plain-string value
// would silently no-op the write-back on user interaction, breaking the cell's reactive chain.
// LocalizedString { en: 'sentinel-82-required' } matches the displayname pattern and round-trips
// correctly. isEmptyValue({en: 'sentinel-82-required'}) === false → Alpha stays profileComplete.
//
// VALUE-DISJOINTNESS INVARIANT: 'sentinel-82-required' contains no 'alpha' substring.
'test-question-required-empty-1': { value: { en: 'sentinel-82-required' } }
```

### canSubmit one-line change (verbatim per CONTEXT D-01)
```svelte
<!-- Source: apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92 -->
<!-- BEFORE -->
let canSubmit = $derived(status !== 'loading');

<!-- AFTER (Phase 82 — TIGHTEN-SOFT) -->
let canSubmit = $derived(status !== 'loading' && allRequiredFilled);
```

### Cell 4 spec block (per CONTEXT D-05, refined locator confidence)
```typescript
// Source: tests/tests/specs/candidate/candidate-profile-validation.spec.ts
// Insert as a new top-level test() AFTER the format-rejection for-loop at line 315 (and
// before the closing } at line 316).
//
// CELL 4 CONTRACT (Phase 82 A11Y-07 TIGHTEN-SOFT): assert the submit button transitions from
// enabled → disabled when a required info question's answer is cleared. The reactive chain is:
// Input.svelte handleChange (multilingual branch) → userData.setAnswer → candCtx
// .requiredInfoQuestions filter → allRequiredFilled $derived re-evaluation → canSubmit
// $derived re-evaluation → <Button disabled={!canSubmit}> re-render.
//
// BLUR INVARIANT (Phase 81 D-11 inheritance): Input.svelte binds `onchange` (NOT `oninput`);
// Playwright's fill('') fires `input` events but `change` only fires on blur. The
// allRequiredFilled re-derivation depends on the change event firing — fill('') + .blur() is
// mandatory.
test('A11Y-01 A11Y-07 required-empty disables submit button via canSubmit gate', async ({ page }) => {
  await loginAsCandidate(page);
  await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

  await expect(page.getByRole('heading', { name: /your profile/i })).toBeVisible({
    timeout: 10000
  });

  // (a) Sanity gate — Alpha is profileComplete by default; submit button is enabled.
  // The submit button at +page.svelte:308 renders as a native <button type="submit">
  // (href is unset → Button.svelte:178-186 selects `button` element); Playwright's
  // toBeDisabled() matcher works on native form elements. (Contrast with
  // candidate-required-info.spec.ts which targets <a role="button"> CTAs and uses
  // toHaveAttribute('disabled', 'true') instead.)
  const submit = page.getByTestId(testIds.candidate.profile.submit);
  await expect(submit).toBeEnabled({ timeout: 5000 });

  // The new required info question renders as 'text-multilingual' (QuestionInput.svelte:72-77
  // — no subtype, profile route does not set disableMultilingual). Multiple <input>s share
  // the same accessible name via aria-labelledby="{id}-label {id}-label-{locale}". .first()
  // disambiguates to the EN input (Input.svelte:395 iterates [currentLocale, ...others]).
  const input = page.getByLabel(/Required-empty \(Phase 82 A11Y-07 anchor\)/i).first();
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill('');
  await input.blur();

  // (b) Submit button is now disabled — TIGHTEN-SOFT gate engaged.
  await expect(submit).toBeDisabled({ timeout: 5000 });

  // (c) Value-preservation: the user's empty state is preserved on screen (the spec did not
  // see the field revert to Alpha's seeded value).
  await expect(input).toHaveValue('');
});
```

### Docstring update (per CONTEXT D-09)
The existing block at `candidate-profile-validation.spec.ts:23-35` currently flags A11Y-07 as remaining:
```
 * Remaining PRODUCT-GAP cells (name-too-short / required-empty) stay deferred
 * via `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md`; the
 * required-empty cell is scheduled for Phase 82 / A11Y-07 with an embedded
 * product decision (REJECT-with-inline-error vs SOFT-WARN-ONLY).
```
Phase 82 rewrites this paragraph to note A11Y-07 is now CLOSED (TIGHTEN-SOFT — submit button gated by `allRequiredFilled` per +page.svelte:92). Remaining: name-too-short only (no current phase mapping; remains in the todo backlog).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 (catalog) — `@playwright/test` |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn test:e2e --project=candidate-app-mutation -g "A11Y-07"` |
| Full suite command | `yarn test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| A11Y-07 | Submit button disables when required info question is empty | e2e | `yarn test:e2e --project=candidate-app-mutation -g "A11Y-07 required-empty"` | Adds 1 new `test()` to existing `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` |

### Sampling Rate
- **Per task commit:** `yarn test:e2e --project=candidate-app-mutation -g "A11Y-01"` (re-runs all 6 cells: image-type, image-size, name-too-long, A11Y-05, A11Y-06, NEW A11Y-07).
- **Per wave merge:** `yarn test:e2e --project=candidate-app-mutation` (full project regression).
- **Phase gate:** Full suite (`yarn test:e2e`) green; 3-run cold-start `--workers=1` SHA-identity verification before `/gsd-verify-work`.

### Wave 0 Gaps
None — `candidate-profile-validation.spec.ts` already exists (Phase 76 / Phase 81 lineage) and the `candidate-app-mutation` project already loads it (`tests/playwright.config.ts:124`).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend dev server, dev-seed, Playwright | ✓ (project standard) | — | — |
| Yarn 4 workspaces | Monorepo install / scripts | ✓ | 4.x | — |
| Supabase CLI | `yarn db:reset` + `yarn db:seed --template e2e` | ✓ (assumed; required for any E2E run) | — | none — blocks E2E |
| Playwright browsers (Chromium) | E2E spec execution | ✓ (assumed; installed via `yarn playwright install`) | 1.58.2 | none — blocks E2E |
| imgproxy (Docker container, local) | Profile image upload paths in OTHER tests (NOT exercised by Phase 82 cell 4) | ✓ (assumed; flaky per STATE.md infrastructure note) | — | n/a for Phase 82 |

No missing dependencies with blocking impact for Phase 82's scope. The imgproxy intermittent 502 issue (STATE.md infrastructure carry-forward) does not exercise Phase 82's gate-only cell.

## Security Domain

> Phase 82 modifies a save-gate flag for the submit button only — no auth, session, input sanitization, or storage changes. The TIGHTEN-SOFT semantic is defense-in-depth: the existing `handleSubmit` guard at lines 126-130 + `userData.save()` backend already rejected empty-required (the gate is a UX improvement, not a security boundary). No ASVS categories newly apply.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no (no new validation surface — existing required attribute already in place) | — |
| V6 Cryptography | no | — |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Supabase adapter at `supabaseDataProvider.ts:521-546` passes `custom_data` through `toDataObject` and maps it to `customData` on the runtime Question object — and does NOT mirror the top-level DB `required` column into `customData.required`. | LANDMINE-1 | If wrong (e.g., if there's a hidden mapping in a Question domain constructor or a mapRow column-mapping entry), the CONTEXT D-03 top-level shape might also work. **Confidence:** HIGH — verified by reading the adapter code + the `variant-hidden-required.ts:151-156` template which exclusively uses `custom_data.required` and is the working SETTINGS-03 dispatch. The planner should verify with a quick scout (`grep -rn "row\.required\|q\.required" apps/frontend/src/`) before locking the seed shape. |
| A2 | The `text-multilingual` dispatch fires whenever `type='text'` + no `subtype` + `disableMultilingual` is unset on both consumer + customData. | LANDMINE-2 | If a downstream consumer (e.g., a feature flag, a route-level option, an `appSettings.multilingualAnswers` toggle) overrides the multilingual dispatch, the plain-string answer might work. **Confidence:** HIGH — verified by reading QuestionInput.svelte:63-77; the profile route at +page.svelte:279 does not set `disableMultilingual`; no app-level kill-switch for multilingual found in `app-shared`. |

If both assumptions hold (HIGH confidence), the planner MUST author the seed with `custom_data: { required: true }` + `{ value: { en: 'sentinel-82-required' } }`. Recommended: planner runs a 1-minute local smoke after authoring (login as Alpha, verify the "Required" notice + sr-only badge render on the new question, type in EN, blur, save, reload, verify value persists).

## Open Questions

1. **Should `custom_data.required: false` (or omit `custom_data` entirely) on the new row be tested as well?**
   - What we know: The CONTEXT spec asserts the empty-disable case after clearing. Pre-clear, Alpha's profileComplete is true (sanity gate).
   - What's unclear: A regression test for the "remove the `custom_data.required` and the gate disengages" would prove the dispatch is correctly wired, not just the empty-string filter.
   - Recommendation: Out-of-scope for Phase 82. The variant-hidden-required SETTINGS-03 spec already exercises the dispatch via a different question (`test-question-displayname` with overlay `custom_data.required: true`); Phase 82's new row IS the dispatch's primary anchor in the base seed.

2. **Should the planner pre-emptively fold the additive +1 PASS_LOCKED constants regen into Plan 01 close (vs. deferring to Phase 83)?**
   - What we know: D-12 + D-11 specify additive update if the 3-run cold-start surfaces +1 PASS_LOCKED.
   - What's unclear: Phase 83 is also expected to shift PASS_LOCKED (DETERM-06 unblocks 5 cascade-skips → ~9 net PASS_LOCKED additions). Folding Phase 82's +1 into a separate Phase 82 commit is one option; bundling both shifts into a single regen at Phase 83 close is another.
   - Recommendation: Fold the +1 into Phase 82 Plan 01 close. Smaller diff per phase = easier debugging if cold-start surfaces an unexpected shift. Phase 83 then captures only its own ~9 additions.

3. **Does the planner need to verify Phase 81 close left `candidate-profile-validation.spec.ts` in a green state?**
   - What we know: Phase 81 V-VERIFICATION should report GREEN per STATE.md log entry "Phase 81 SHIPPED GREEN".
   - What's unclear: A local re-run of `yarn test:e2e --project=candidate-app-mutation -g "A11Y-01"` at HEAD-pre-changes would confirm pre-state.
   - Recommendation: Run the pre-baseline as Step 1 of Plan 01 per CONTEXT "specifics" §"Planner re-baseline at PLAN.md time". If any of the existing 5 cells fail at HEAD, surface as a Phase 82 blocker before authoring cell 4.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `subtype: 'link'` for url-validation dispatch (Phase 76 PRODUCT-GAP-PARTIAL) | Phase 81 lifts to FULL via QuestionInput.svelte:65 + Input.svelte URL branch | Phase 81 close 2026-05-13 | Phase 82 does NOT change subtype handling — orthogonal surface. |
| Top-level `required` DB column reads (legacy) | `customData.required` is the canonical dispatch (frontend filter chain reads ONLY this) | Pre-OpenVAA v2.6 standard | Phase 82 LANDMINE-1: CONTEXT D-03 mis-specified; correction documented in §"Code Examples". |

**Deprecated/outdated:** none specific to Phase 82.

## Sources

### Primary (HIGH confidence)
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92-109,300-310` — `canSubmit` / `allRequiredFilled` / `submitRouting` derivations + submit button binding
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:347-368,419-434` — `requiredInfoQuestions`, `unansweredRequiredInfoQuestions`, `profileComplete` derivations + getters
- `apps/frontend/src/lib/components/input/QuestionInput.svelte:63-77,79-118` — type dispatch + value preservation
- `apps/frontend/src/lib/components/input/Input.svelte:236-315,395-447,612-621` — multilingual `handleChange` + `text-multilingual` rendering + change event binding
- `apps/frontend/src/lib/components/button/Button.svelte:178-186` — native `<button>` rendering when `href` is unset (drives `toBeDisabled()` correctness)
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:475-548` — question load path (proves top-level `required` does NOT map to `customData.required`)
- `apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.test.ts` — confirms `custom_data` → `customData` mapping in `toDataObject`
- `packages/app-shared/src/data/customData.type.ts:60-62` — `customData.required` field definition
- `packages/app-shared/src/data/getCustomData.ts:6-8` — `getCustomData` accessor (reads `object.customData ?? {}`)
- `packages/dev-seed/src/generators/QuestionsGenerator.ts:100-106` — fixed[] row pass-through (proves verbatim spread of seed shape)
- `packages/data/src/utils/answer.ts:15-23` — `isEmptyValue` semantics (string trim, array length, object empty)
- `packages/data/src/utils/ensureValue.ts:12-14` — `ensureString` (LocalizedString → MISSING_VALUE)
- `packages/data/src/objects/questions/variants/textQuestion.ts` — TextQuestion._ensureValue = ensureString
- `apps/supabase/supabase/migrations/00001_initial_schema.sql:605-629` — questions table schema (top-level `required` boolean column + `custom_data` jsonb)
- `packages/supabase-types/src/database.ts:940-989` — questions table TypeScript shape
- `tests/tests/setup/templates/variant-hidden-required.ts:142-179` — canonical `custom_data.required` dispatch (the working SETTINGS-03 pattern)
- `tests/tests/specs/candidate/candidate-required-info.spec.ts` — pre-existing SETTINGS-03 spec (the only other base-codebase spec referencing `requiredInfoQuestions`)
- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:1-316` — the Phase 82 spec target file (current state)
- `tests/tests/utils/testIds.ts:20` — `candidate.profile.submit = 'profile-submit'` registry entry (verified present)
- `tests/playwright.config.ts:122-130` — `candidate-app-mutation` project loads `*profile-validation.spec.ts`
- `tests/tests/fixtures/voter.fixture.ts:48-78` — voter fixture default `voterAnswerCount=16` iterates opinion questions only
- `apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.svelte.ts:85-94` — voter-app `hideIfMissingAnswers` filters opinion questions only (info-question state irrelevant)
- `packages/dev-seed/src/templates/e2e.ts:585-810` — current e2e fixture state; sort 19/20/21/22/23 anchors; Alpha answer block
- `.yarnrc.yml` — Playwright 1.58.2, Svelte 5.53.12, SvelteKit 2.55.0 (catalog versions)

### Secondary (MEDIUM confidence — official docs / cross-verified)
- [Svelte 5 $derived documentation](https://svelte.dev/docs/svelte/$derived) — lazy evaluation model; expression captured as thunk
- [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide) — runes-based reactivity vs. legacy `$:` ordering
- [Playwright toBeDisabled matcher](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-disabled) — native form-element disabled detection

### Tertiary (LOW confidence — informational only)
- [Svelte issue #16608 (setContext + $derived warning)](https://github.com/sveltejs/svelte/issues/16608) — context for `state_referenced_locally`; not applicable to Phase 82

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified in `.yarnrc.yml`; no new packages.
- Architecture (canSubmit / allRequiredFilled / requiredInfoQuestions chain): HIGH — every link in the chain traced through real source.
- Pitfalls: HIGH — LANDMINE-1 + LANDMINE-2 verified against the canonical SETTINGS-03 variant template + the existing `test-question-displayname` answer pattern; LANDMINE-3 verified via tests/ grep.

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (30 days — Phase 82 surface is small + Svelte 5 + Playwright versions stable in OpenVAA catalog).
