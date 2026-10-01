---
phase: 165-review-stack-comment-remediation
reviewed: 2026-09-28T23:30:00Z
depth: standard
files_reviewed: 31
files_reviewed_list:
  - apps/docs/src/lib/components/Header.svelte
  - apps/docs/src/lib/components/NavigationItem.svelte
  - apps/docs/src/lib/components/PeerNavigation.svelte
  - apps/docs/src/lib/components/TableOfContents.svelte
  - apps/docs/src/lib/layouts/MdLayout.svelte
  - packages/app-shared/src/data/getLocalized.test.ts
  - packages/app-shared/src/data/getLocalized.ts
  - packages/app-shared/src/data/schemas/sendEmailResult.schema.test.ts
  - packages/app-shared/src/data/schemas/sendEmailResult.schema.ts
  - packages/app-shared/src/index.ts
  - packages/argument-condensation/src/core/condensation/condenser.ts
  - packages/argument-condensation/tests/condensation/condenseQuestions.test.ts
  - packages/question-info/tests/questionTypes.test.ts
  - tests/scripts/determinism-batch.sh
  - tests/scripts/visual-container.sh
  - tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts
  - tests/tests/fixtures/voter/entityDetails.fixture.ts
  - tests/tests/fixtures/voter/resultsPage.fixture.ts
  - tests/tests/fixtures/voter/voter-journey.fixture.ts
  - tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts
  - tests/tests/helpers/timeouts.ts
  - tests/tests/setup/perm/perm-closed-project.teardown.ts
  - tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts
  - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
  - tests/tests/specs/candidate/candidate-journey.spec.ts
  - tests/tests/specs/perm/perm-org-matching.spec.ts
  - tests/tests/specs/voter/cold-entry-dataroot.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/utils/missingNominations.ts
  - tests/tests/utils/testIds.ts
  - tests/tests/utils/voterNavigation.ts
findings:
  critical: 0
  warning: 7
  info: 7
  total: 14
status: issues_found
---

# Phase 165: Code Review Report (Part C — shared packages, docs site, E2E harness)

**Reviewed:** 2026-09-28T23:30:00Z
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

Scope: the diff `ship/v2.15-12-planning...HEAD` for area C. That covers `packages/app-shared` (`getLocalized`, `SendEmailResultSchema`, the password-validation removal), the `Condenser.run()` flat-result change, question-info tests, the docs-site Tailwind inlining, and the Playwright harness. The harness part is the new state-driven stage walk, the CI-only 180 s ceiling, the portrait, cold-entry and results waits, the closed-project teardown and the two orchestration shell scripts.

These parts are sound:
- **`getLocalized` string-only semantics.** Every caller (`localizeRow` over `name`/`short_name`/`info`, translation overrides, notifications, FAQ, keywords, choice labels) localizes string-valued fields only. No caller loses data.
- **`SendEmailResultSchema`.** Making `success` and `dry_run` required matches all three `send-email` return literals.
- **The `Condenser.run()` flatten.** It fixes a real product bug: `condenseArguments.ts:188` was mapping `{ id, text }` off nested arrays. The tests now assert flatness instead of papering over it.
- **The docs inlining.** I checked it against the built CSS. The utilities sort after `.prose :where(h2)` inside `@layer utilities`, and daisyUI's `menu-active` sits in a nested sub-layer, so the inlined classes win as the scoped styles did. The `--spacing: 1rem/16` theme makes `p-16`/`mb-4` pixel-equal to the removed rules.
- **The shell scripts.** The `determinism-batch.sh` step prefix matches the renamed step title. `visual-container.sh --ci-literal` matches CI's `e2e-run.sh --project visual-regression` invocation and the config's unset-CI defaults.

The defects are in the harness:
- The new stage walk can spin until the test ceiling with no progress check. When it stops, the timeout it hits hides its own diagnostic.
- Its "href resolved" guard accepts the app's `__first__` placeholder.
- The answer loop still has one fixed-window branch, which can silently skip a question. The D-14 ruling banned that pattern.
- The CI ceiling raise does not reach several hard-coded `setTimeout` sites.
- The closed-project teardown's `try/finally` can skip the dataset delete and mask the original error.

None of these is a BLOCKER at the tip, because CI run 36476589852 is green. But each is a latent flake or a mis-attributed failure, which the E2E Hard Rule treats as a real defect.

## Warnings

### WR-01: `walkVoterStages` has no progress check, so a stage that never advances spins silently until the test ceiling

**File:** `tests/tests/utils/voterNavigation.ts:217-226` (loop), `:22-36` (`advanceClick`), `:198-203` (`leaveStage` catch)

**Issue:** The loop is `for (;;) { resolve; if (until) return; leaveStage }`. `leaveStage` swallows every timeout, and `advanceClick` swallows **every** click error with a bare `catch {}`, including strict-mode violations and "element is not enabled". So a stage whose action never takes effect is re-resolved and re-clicked until the test's own timeout ends the run. That timeout is 90 s locally, 180 s on CI and 240 s in the journey tests.

Here is a concrete case on the `e2e/base` seed, which has `questionsIntro.allowCategorySelection: true`. The questions-intro Start button renders `disabled={!canSubmit}` (`questions/+page.svelte:152`). A visible but disabled button satisfies `resolveVoterStage('questions-intro')`. The 3 s click then times out, gets swallowed, and the walk loops. If `canSubmit` never turns true (a real app defect: no categories selected, or `selectedQuestionBlocks` empty), the failure reads "Test timeout of 180000ms exceeded". It does not say "stuck on questions-intro; Start never enabled". The same happens when the missing-nominations modal intercepts the click.

This is the mis-attribution hazard that `requireNavigation` (fixture `:69-94`) was written to prevent. The walk reintroduces it one layer up.

**Fix:** Count consecutive resolutions of the same stage on the same URL, and fail at the fault site. Narrow `advanceClick`'s catch to timeouts:

```ts
export async function walkVoterStages(page: Page, until: ReadonlyArray<VoterStage>): Promise<VoterStage> {
  let last = '';
  let repeats = 0;
  for (;;) {
    const stage = await resolveVoterStage(page);
    if (until.includes(stage)) return stage;
    if (stage === 'question') throw new Error(/* unchanged */);
    const key = `${stage}@${new URL(page.url()).pathname}`;
    repeats = key === last ? repeats + 1 : 0;
    last = key;
    if (repeats >= 5) {
      throw new Error(`voter walk: the ${stage} action did not take effect after ${repeats + 1} attempts at ${page.url()}`);
    }
    await leaveStage(page, stage);
  }
}
// advanceClick:
} catch (error) {
  if (!isTimeout(error)) throw error;
}
```

### WR-02: `STAGE_BUDGET = TIMEOUTS.testMax` makes the walk's own failure message unreachable

**File:** `tests/tests/utils/voterNavigation.ts:82`, `:122-134`, `:169`

**Issue:** `resolveVoterStage`'s `toPass` builds a precise message: "the voter flow shows none of [...] at <url>". But its budget equals the per-test ceiling, and the test's timer started earlier (fixtures, `goto`, the preceding stages). Under the default timeout the test timeout always fires first, so that message never reaches the report.

`continueFromCategoryIntro`'s `toHaveAttribute` has the same problem. There is a second quirk: its failure text ("Timed out … waiting for expect(locator)…") does not match `isTimeout`'s `/Timeout .* exceeded/`. So the one case where it does fire first (a 240 s journey test) rethrows instead of retrying, which is inconsistent with the docstring at `:175`.

The docstring at `:80` acknowledges that the test timeout ends a stuck walk. The cost is diagnosis: the report names neither the stage set nor the URL.

**Fix:** Wrap each resolution in a named step, so the timeout report names the pending wait:

```ts
return test.step(`resolve voter stage [${stages.join(', ')}]`, async () => { /* existing toPass */ return found as VoterStage; });
```

Also make `isTimeout` recognise assertion timeouts: `/Timeout .* exceeded|Timed out \d+ms waiting/`. Together with WR-01's attempt counter, a stuck walk then fails with its own message.

### WR-03: The "href resolved" guard on the category-intro start link accepts the `__first__` placeholder, so it guards nothing

**File:** `tests/tests/utils/voterNavigation.ts:169`, `tests/tests/fixtures/voter/voter-journey.fixture.ts:58-67,172`

**Issue:** The category page renders `href={getRoute.current({ route: 'Question', questionId })}`, with `questionId = $derived(block?.block[0]?.id)` (`questions/category/[categoryId]/+page.svelte:52,113`). While `block` is unresolved, `DEFAULT_PARAMS.Question` (`lib/routes/route.ts:124`) fills in `FIRST_QUESTION_ID`. The href is then `/en/questions/__first__`.

Neither guard rejects it:
- `/\/questions\/(?!category\/)[^/]+/` in `voterNavigation.ts` does not.
- `/\/questions\//` in the fixture does not either. It would even accept a `/questions/category/…` href.

So both helpers can `page.goto` the app's **first** question rather than this category's. In the answer loop, that re-enters an already-answered question:
- A radio that is already checked fires no `change`, so there is no auto-advance, and `requireNavigation` throws a mis-attributed "did not advance".
- A checkbox toggles and silently rewrites the answer set that the visual baseline and the exact org scores are captured from.

The two helpers are also duplicate implementations of one operation, with divergent patterns. That breaks the checklist's "no repeated code" item.

**Fix:** Keep one exported helper in `voterNavigation.ts`, have the fixture reuse it, and exclude the placeholder:

```ts
import { FIRST_QUESTION_ID } from '../../../apps/frontend/src/lib/routes/route';
const RESOLVED_QUESTION_HREF = new RegExp(`/questions/(?!category/|${FIRST_QUESTION_ID}(?:[/?#]|$))[^/?#]+`);
```

### WR-04: The post-slider branch keeps a swallowed fixed window whose expiry silently skips a question

**File:** `tests/tests/fixtures/voter/voter-journey.fixture.ts:204-208`, `:216`, `:227-232`

**Issue:** D-14 ruled out fixed-window branching. The non-slider wait at `:210` was converted to a hard `testMax` wait, but the `sliderJustAnswered` branch still does `currentChoices.first().waitFor({ timeout: slowPage }).catch(() => null)`. When that 10 s window expires, which is plausible on the runner measured at 4-5× slower (`timeouts.ts:33`):
1. `choiceCount` is `0`.
2. `waitForVisible(slider, TIMEOUTS.page)` gets another fixed 5 s window.
3. If that also misses, the "Skip" fallback clicks Next.

The question is left **unanswered**, with no failure. That changes the match results and the visual baseline, and the downstream assertion that eventually reds is far from the cause. That is exactly the failure mode the `requireNavigation` docstring describes.

The "text rendering" case that justifies the Skip fallback has no seeded instance. No `e2e/*` opinion question renders neither choices nor a slider.

**Fix:** Replace the silent Skip with a loud failure, and make the post-slider wait hard. It should end on either the scoped choices or a slider that is not the one just answered:

```ts
// before clicking Next on a slider question:
const answeredSlider = await slider.elementHandle();
// ...
// next iteration, when sliderJustAnswered:
await expect
  .poll(async () => (await currentChoices.count()) > 0 || !(await answeredSlider?.evaluate((el) => el.isConnected)), {
    timeout: TIMEOUTS.testMax
  })
  .toBe(true);
// and at :227-232:
throw new Error(`voter-journey: question ${questionId} rendered neither choices nor a number slider at ${page.url()}`);
```

### WR-05: The results landing still uses fixed windows beside the one converted to the test budget

**File:** `tests/tests/fixtures/voter/voter-journey.fixture.ts:269`, `:272`, `:280`; `:83` (`requireNavigation`)

**Issue:** The picker-or-list race at `:269` now waits `TIMEOUTS.testMax`. But on the multi-election path the same heavy render is then held to fixed windows:
- `options.first().waitFor(slowPage)` at `:272`;
- `resultsList.waitFor(15_000)` at `:280`, a local measurement;
- the final hop to `/results` inside `requireNavigation`, at `slowPage` (10 s).

That hop is where SvelteKit updates the URL only after the `/results` loads resolve. D-16's own evidence says the located `/en/results` election picker missed a 10 s wait on CI. These are the same page and the same render class, on the same runner.

**Fix:** Give the post-selection list wait (`:280`) and the picker-option wait (`:272`) the same budget as `:269` (`TIMEOUTS.testMax`), and drop the stale 15 s `// reason:`. Also consider a larger, named budget for the last-question → `/results` navigation in `requireNavigation`. It must stay loud.

### WR-06: The CI-only 180 s ceiling is silently lowered back by hard-coded `setTimeout` sites

**File:** `tests/tests/helpers/timeouts.ts:11,35`. Affected callers are outside this diff:
- `tests/tests/setup/shared/auth.setup.ts:53`
- `tests/tests/setup/admin/admin-auth.setup.ts:22`
- `tests/tests/setup/perm/perm-answers-locked.setup.ts:47`
- `tests/tests/setup/perm/perm-question-video.setup.ts:43`
- `tests/tests/setup/perm/perm-hide-hero.setup.ts:43`
- `tests/tests/setup/perm/perm-disable-allow-open.setup.ts:41` (all 90 000 above)
- `tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts:50,71,86,103,125` (45 000)
- `tests/tests/specs/perf/performance-budget.spec.ts:86` (90 000)

**Issue:** `testMax` becomes 180 s on GitHub Actions because the runner is 4-5× slower. But every `test.setTimeout(<literal>)` overrides the config default, so on CI these setups and specs keep their local-sized budgets on the same slow runner. For example, `perm-not-located-2e2cg` runs 45 s tests where the rest of the suite gets 180 s.

The header's worked example is also now wrong on CI. It says `perm-localisation-positive` 180 s is a budget "ABOVE this value", but on CI that 180 s equals `testMax`.

**Fix:** Express each literal relative to the bucket, e.g. `setup.setTimeout(TIMEOUTS.testMax)`, or scale it with the same `ON_GITHUB_ACTIONS` factor (export it from `timeouts.ts`). Also correct the header example.

### WR-07: The closed-project teardown's `try/finally` skips the dataset delete on an auth failure and masks the original error

**File:** `tests/tests/setup/perm/perm-closed-project.teardown.ts:19-27`

**Issue:** `unregisterCandidate` throws on three paths (`supabaseAdminClient.ts:550,554,558`). When it throws, `runTeardownAsserted(PREFIX)` never runs, so the seeded `e2e-perm-closed-project-*` rows persist while the project is reopened.

Also, if `ensureProject()` throws inside `finally`, JavaScript discards the in-flight error. The report then names the reopen failure, and the cleanup failure that caused it disappears.

The header says "A throw from either delete step still fails the teardown after the project is reopened". That is true only for the step that threw first.

**Fix:** Run the three steps independently and report every failure:

```ts
const errors: unknown[] = [];
for (const step of [
  () => client.unregisterCandidate(CANDIDATE_EMAIL),
  () => runTeardownAsserted(PREFIX, client),
  () => client.ensureProject()
]) {
  try {
    await step();
  } catch (e) {
    errors.push(e);
  }
}
if (errors.length) throw new AggregateError(errors, 'perm-closed-project teardown failed');
```

## Info

### IN-01: `expectNoOrgMatchScore` is a one-shot negative count with no positive sync point

**File:** `tests/tests/fixtures/voter/resultsPage.fixture.ts:194-203`

**Issue:** It asserts the card is visible, then takes a single `.count()` snapshot of the callouts. If a regression made `none` score organisations but the callout mounted a beat after the card, this passes. A negative assertion needs a positive "rendering is done" anchor first.

**Fix:** Before counting, wait for a signal that matching has rendered, for example `await expect(card.getByTestId(testIds.voter.results.cardSubcard).getByTestId(testIds.voter.results.matchScore).first()).toBeVisible()`. The member subcards keep their scores under `none`.

### IN-02: `SendEmailResultSchema` documents a 500 branch that can never reach it

**File:** `packages/app-shared/src/data/schemas/sendEmailResult.schema.ts:26,31`; consumer `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:143`

**Issue:** `functions.invoke` turns every non-2xx into `{ data: null, error: FunctionsHttpError }` (`@supabase/functions-js` `FunctionsClient.js:136-137`). So the all-failed 500 payload is never parsed. `sendEmail` throws `send-email: <message>`, and the per-recipient failure list is lost.

**Fix:** Either drop the 500 branch from the schema docs, or have the adapter read `await error.context.json()` on `FunctionsHttpError` and parse it with this schema.

### IN-03: Stale descriptions of the old walk, and of the 90 s ceiling

**Files:**
- `tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts:6-7,37`: says the walk is a "hard-wait `walkUntilQuestionsIntro`" and that the start click is "guarded with `isVisible`".
- `tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts:4` and `perm-disable-allow-open.spec.ts:4`: say `answeredVoterPage` "hard-waits … and would time out".
- `tests/playwright.config.ts:1225-1227`: "Single source of the 90s ceiling".
- In changed files: `voterNavigation.ts:25` ("full 90s test ceiling") and `voter-journey.fixture.ts:53,170,187` ("the 90s ceiling", "→ 90s timeout").

**Fix:** Reword each to describe the current behaviour. The ceiling is `TIMEOUTS.testMax`, which is environment-dependent.

### IN-04: Dead code

**Files:**
- `tests/tests/utils/voterNavigation.ts:228-244`: `advanceVoterFlow` is module-private and only ever called with `'first-question'`, so the `'questions-intro'`/`'category-intro'` members of `StopAt` are unreachable.
- `tests/tests/utils/missingNominations.ts:21,64`: neither export has a caller anywhere under `tests/tests`, yet this diff edited it. `tests/README.md:305` still prescribes both helpers, and `:66` keeps the "builds without the testId" `getByRole('dialog')` fallback whose twin the diff deleted at `:20`.

**Fix:** Inline `walkVoterStages(page, ['question'])` into `navigateToFirstQuestion` and delete `StopAt`/`advanceVoterFlow`. Delete `missingNominations.ts` and its README entry, or wire it into the specs that need it.

### IN-05: Unscoped `inputError` wait in the candidate profile step

**File:** `tests/tests/specs/candidate/candidate-journey.spec.ts:556`

**Issue:** `page.getByTestId(testIds.shared.inputError)` is page-wide. Any other field's error, such as the still-empty required `qu-info-text`, would make `toBeHidden` a strict-mode violation or wait on the wrong element.

**Fix:** Scope it to the field just cleared, e.g. `candidateProfilePage.questionField(/\[qu-info-text-link\]/).getByTestId(testIds.shared.inputError)`.

### IN-06: `--ci-literal` does not reproduce CI's timeout posture

**File:** `tests/scripts/visual-container.sh:30`, `:272-274`, `:488-493`

**Issue:** The mode claims to reproduce CI's invocation exactly. But the container is not given `GITHUB_ACTIONS=true`, so `TIMEOUTS.testMax` is 90 s in the container and 180 s in CI.

**Fix:** Add `DOCKER_ARGS+=(-e GITHUB_ACTIONS=true)` under `--ci-literal`, or state the difference in the flag's help text.

### IN-07: Two widened budgets now apply locally too (maintainer rulings; noted, not contested)

**Files:** `tests/tests/specs/voter/voter-journey.spec.ts:24` (`JOURNEY_TEST_MAX = 240_000` for every environment, where the measured local cost is 42-45 s), and `tests/tests/specs/voter/cold-entry-dataroot.spec.ts:40,51,70,86` (first data wait at `testMax`).

**Issue:** The CI-motivated widenings also loosen the local regression signal. A local journey slowdown to about 200 s, or a cold render that takes 80 s, now passes.

**Fix (optional):** Key `JOURNEY_TEST_MAX` off the same `ON_GITHUB_ACTIONS` flag as `testMax`, e.g. 120 s locally and 240 s on CI.

---

_Reviewed: 2026-09-28T23:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
