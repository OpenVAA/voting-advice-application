---
quick_id: 260620-ole
slug: fix-eflow-06-voter-journey-mobile-e2e-e2
type: quick
date: 2026-06-20
---

<objective>
Fix two deterministically-failing E2E specs whose `walkUntilQuestionsIntro` voter walk stalls before `/questions` and times out (10s) waiting for `voter-questions-start`/`category-start`/`question-choice`:
1. `tests/tests/specs/perm/perm-localisation-positive.spec.ts:471` — EFLOW-06 (fi→en→fi in-flight locale switch)
2. `tests/tests/specs/voter/voter-journey-mobile.spec.ts` — same `walkUntilQuestionsIntro` helper, same symptom (operator-confirmed)

**Operator-diagnosed root cause:** the e2e seed template(s) these specs use lack an election / constituency *selection* path, so the voter walk cannot advance Home→Intro→Elections→Constituencies→/questions. Add the missing election/constituency selection to the template(s) so the walk reaches the questions intro.
</objective>

<context>
- The walk helper is `walkUntilQuestionsIntro` in `tests/tests/fixtures/voter/voter-journey.fixture.ts` (lines 129-232). It is tolerant of auto-selected single elections/constituencies (the elections/constituencies steps are guarded by `if (await waitForVisible(...))`), and tolerant of `questionsIntro.show=false` via `.or(categoryStart).or(firstQuestion)`. It stalls only when the walk never lands on `/questions` at all — i.e. the elections/constituencies step never resolves to a Continue, OR the data/appSettings leave the voter unable to reach the questions surface.
- `perm-localisation-positive` is seeded via `setupFromTemplate('perm-localisation-positive')` (`tests/tests/setup/perm/perm-localisation-positive.setup.ts`). The template + its shared appSettings live under `packages/dev-seed/src/templates/` (perm templates share a `MINIMAL_BASE_APP_SETTINGS` / perm `shared.ts`; LOCATE the exact files via grep for `perm-localisation-positive` and the perm template registry).
- `voter-journey-mobile` uses the same walk helper; LOCATE which template/data-setup project it depends on (check `tests/playwright.config.ts` project deps + `tests/tests/setup/`).
- This repo's E2E baseline is documented 95/0 green in CI; these two are the deviation. The fix is test-infra only — do NOT touch app/production code or Phase 124 deliverables.
</context>

<tasks>

<task type="execute">
  <name>Task 1: Add election/constituency selection to the failing specs' seed template(s) and verify both green</name>
  <files>packages/dev-seed/src/templates/** (the perm-localisation-positive template + shared perm appSettings; and the template voter-journey-mobile depends on) — LOCATE exact files first</files>
  <read_first>
    - tests/tests/fixtures/voter/voter-journey.fixture.ts (walkUntilQuestionsIntro mechanics — lines 129-232)
    - tests/tests/specs/perm/perm-localisation-positive.spec.ts (EFLOW-06 at :471)
    - tests/tests/specs/voter/voter-journey-mobile.spec.ts
    - tests/tests/setup/perm/perm-localisation-positive.setup.ts + tests/tests/setup/shared/setupFromTemplate.ts
    - packages/dev-seed/README.md + the perm template registry/shared appSettings (grep `perm-localisation-positive`, `MINIMAL_BASE_APP_SETTINGS`)
    - CLAUDE.md (E2E cardinal rule; dev-seed authoring)
  </read_first>
  <action>
    1. LOCATE the exact template definition for `perm-localisation-positive` and the template/data-setup `voter-journey-mobile` depends on, plus the shared perm appSettings (the `MINIMAL_BASE_APP_SETTINGS` referenced at `packages/dev-seed/.../perm/shared.ts`).
    2. CONFIRM the operator diagnosis against the actual config: determine why the walk cannot advance through Elections/Constituencies to `/questions` for these templates (e.g. elections/constituencies not selectable, or no selectable election/constituency data, or appSettings gating the selection UI). Compare against a passing voter template (e.g. `e2e/base`, whose voter walk DOES reach `/questions`) to see what selection config it has that the failing template(s) lack.
    3. Add the missing election/constituency *selection* to the failing template(s) so the walk reaches the questions intro — mirror the passing template's selectable election/constituency setup (minimal, targeted; do not broaden scope).
    4. If a `packages/dev-seed` source file is changed, rebuild it (`yarn build --filter=@openvaa/dev-seed` or rely on the running `yarn dev` watcher) before re-running E2E so the new template is used by `setupFromTemplate`.
    5. GUARDRAIL: if the real cause turns out NOT to be missing election/constituency selection (i.e. adding it does not make the specs pass), STOP and report that the diagnosis was incomplete with what you found — do NOT commit a non-fix or force unrelated changes.
  </action>
  <verify>
    Both specs pass green against a fresh dev server (:5173 is up via the running `yarn dev`; a clean DB is set up by each spec's own data-setup project):
    - `npx playwright test -c ./tests/playwright.config.ts ./tests -g "EFLOW-06"`  → 0 failed
    - `npx playwright test -c ./tests/playwright.config.ts ./tests tests/tests/specs/voter/voter-journey-mobile.spec.ts` → 0 failed
    Run each at least twice to confirm determinism (no flake). Capture the pass counts in the SUMMARY.
  </verify>
  <done>Both EFLOW-06 and voter-journey-mobile pass deterministically; the template change is minimal and test-infra-only; committed atomically.</done>
</task>

</tasks>

<verification>
- `npx playwright test -c ./tests/playwright.config.ts ./tests -g "EFLOW-06"` exits 0 (0 failed), run 2x.
- `npx playwright test ... voter-journey-mobile.spec.ts` exits 0 (0 failed), run 2x.
- Only `packages/dev-seed` (and/or test setup) template files changed — no app/production code, no Phase 124 files.
- Commit is atomic (test-infra fix), message references the quick task.
</verification>

<output>
Create `.planning/quick/260620-ole-fix-eflow-06-voter-journey-mobile-e2e-e2/260620-ole-SUMMARY.md` with the diagnosis confirmation, the exact files changed, the before/after pass counts for both specs, and whether any unrelated cause was surfaced.
</output>
