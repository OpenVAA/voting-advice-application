# Phase 133: Fix Phase 132 code review gaps - Research

**Researched:** 2026-07-24
**Domain:** Playwright E2E navigation-helper hardening (voter/candidate journeys), SvelteKit route-implication flow
**Confidence:** HIGH

## Summary

Phase 133 fixes the three findings in the Phase 132 code review (`132-REVIEW.md`): one WARNING (WR-01) and two INFO (IN-01, IN-02). All three live in the E2E test harness, not product code — the diff is test-only.

The load-bearing change is WR-01. Phase 132 (plan 132-03) added a `page.goto()` hard-navigation fallback (`navigateDirectlyToQuestions`) into the `catch` branches of the elections/constituencies "Continue" waits inside `advanceVoterFlow` (`tests/tests/utils/voterNavigation.ts`). That fallback silently routes around a genuinely-broken Continue button — the exact regression E2E exists to catch. The locked user decision goes further than the review's suggested guard-based fix: **remove `navigateDirectlyToQuestions` entirely** and let `advanceVoterFlow`'s existing top-of-loop deterministic screen-check re-detect the current screen each cycle, trialing whether the full E2E suite stays green (`yarn test:e2e` is the gate).

Key structural finding: `advanceVoterFlow`, `navigateDirectlyToQuestions`, `resolveSeedUuids`, `advanceClick`, and the `uuidCache` module variable are **all module-private**. The ONLY export of `voterNavigation.ts` is `navigateToFirstQuestion`. `resolveSeedUuids` is called from exactly one place — inside `navigateDirectlyToQuestions`. Therefore removing `navigateDirectlyToQuestions` makes `resolveSeedUuids`, `uuidCache`, and the `SupabaseAdminClient` import dead code that should also be deleted. **This resolves IN-02 by deletion** — there is no other consumer.

**Primary recommendation:** Delete `navigateDirectlyToQuestions` + `resolveSeedUuids` + `uuidCache` + the now-unused `SupabaseAdminClient` import. Replace each elections/constituencies `catch { navigateDirectlyToQuestions(); continue; }` with a deterministic `continue` (let the loop re-detect the screen) and let a genuinely-stuck screen fail loudly at loop exhaustion via the existing terminal `waitFor`. Fix IN-01 by positively asserting the candidate-home route. Gate the whole change on a clean full-suite run (repeat per the project's 3× determinism convention).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Voter journey traversal (Home→first question) | E2E test harness (`tests/`) | — | Pure test-utility helper; no product code touched |
| Screen-graph detection (which screen is showing) | E2E test harness | Frontend routing (`(voters)/*/+page.ts` redirects) | The helper reacts to whatever screen the app's redirect logic produced |
| Seed-UUID lookup for fallback URL | E2E test harness (Supabase admin client) | Supabase DB | Removed entirely this phase — dead once fallback goes |
| Candidate post-submit destination assertion | E2E test harness | Frontend routing | IN-01 is a test-precision fix only |

## Standard Stack

No new packages. This phase edits existing test files only.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | (repo pinned) | E2E test framework | Already the project's E2E harness |

**Installation:** none — no dependency changes.

## Package Legitimacy Audit

Not applicable — this phase installs no external packages (test-only edits to existing files).

## User Constraints

> No CONTEXT.md exists for this phase (`/gsd-discuss-phase` was not run). The roadmap goal carries the locked decision.

### Locked Decisions
- For WR-01: **remove `navigateDirectlyToQuestions` completely** and make `advanceVoterFlow` deterministically check for each of the possible screens instead. Trial whether that causes any issues — **the full E2E suite (`yarn test:e2e`) is the gate.**

### Claude's Discretion
- Exact deterministic-loop restructure (how the elections/constituencies branches behave after the hard-nav fallback is removed — pure re-`continue` vs. bounded settle-then-`continue`).
- Whether to bump `maxSteps` / per-cycle timeout budget to absorb the transient SSR-compile continue-stall the fallback previously masked.
- IN-01 positive-assertion regex shape.

### Deferred Ideas (OUT OF SCOPE)
- None recorded.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WR-01 | Remove hard-nav fallback; deterministic screen checks in `advanceVoterFlow` | Loop structure mapped below; fallback fires only in `catch` branches at lines 199-202, 217-219, 231-233, 249-251 |
| IN-01 | Positively assert candidate-home destination (not negative-lookahead) | `candidate-journey.spec.ts:671`; canonical home route is `/candidate` (protected `+page.svelte`) |
| IN-02 | `resolveSeedUuids` empty-array caching + degenerate `/questions?` URL | Resolved by deletion — only consumer is `navigateDirectlyToQuestions` |

## Architecture Patterns

### Current `advanceVoterFlow` control flow (as-is)

`tests/tests/utils/voterNavigation.ts:131-271`. Race-loop over `maxSteps` (default 10), `perStepTimeout` (default `TIMEOUTS.page` = 5s):

1. `anyCheckpoint.waitFor({ visible, perStepTimeout })` — `anyCheckpoint` = `.or()` chain of `introStart | electionsList | constituenciesList | questionsStart | categoryStart | answerOption`, `.first()`.
2. Probe checkpoints in priority order (closest-to-terminal first):
   - `answerOption` visible → `return` (terminal).
   - `categoryStart` → `advanceClick`; `return` if `stopAt==='category-intro'`.
   - `questionsStart` → `advanceClick`; `return` if `stopAt==='questions-intro'`.
   - `constituenciesList` → select comboboxes → **[hard-nav fallback branch]** → click continue → **[hard-nav fallback branch]**.
   - `electionsList` → **[hard-nav fallback branch]** → click continue → **[hard-nav fallback branch]**.
   - `introStart` → `advanceClick`.
3. Loop exhaustion → explicit terminal `waitFor` on the `stopAt` locator so the caller gets a meaningful Playwright timeout pointing at the expected checkpoint (lines 264-270).

The four hard-nav fallback call-sites to remove:
- `:198-202` constituencies continue-visible wait catch → `navigateDirectlyToQuestions`.
- `:217-219` constituencies post-click URL-settle catch → `navigateDirectlyToQuestions`.
- `:230-233` elections continue-visible wait catch → `navigateDirectlyToQuestions`.
- `:249-251` elections post-click URL-settle catch → `navigateDirectlyToQuestions`.

### Pattern: deterministic screen re-detection (the intended replacement)

The top-of-loop `anyCheckpoint.waitFor` **already IS** the deterministic screen check. Each iteration detects the current screen and acts. If a continue click transiently stalls, the next iteration re-detects `electionsList`/`constituenciesList` and retries — self-healing within `maxSteps`. If the continue button genuinely never advances, the loop exhausts and the terminal `waitFor` (lines 264-270) throws loudly, naming the expected checkpoint. No `page.goto()` bypass.

Recommended branch shape (elections; constituencies mirrors it):
```ts
if (await electionsList.isVisible()) {
  // Accept default selection (all elections pre-checked).
  const urlBefore = page.url();
  try {
    await electionsCont.click({ timeout: 3000 });
  } catch {
    continue; // detached/not-actionable → re-detect next iteration
  }
  await page
    .waitForURL(
      (url) => url.toString() !== urlBefore && !url.toString().includes('/elections'),
      { timeout: TIMEOUTS.page }
    )
    .catch(() => null); // no hard-nav; loop re-detects current screen
  continue;
}
```
Note: the previous `constituenciesCont.waitFor({ visible, slowPage })` pre-click guard can stay as a bounded wait but its `catch` must NOT hard-nav — either `continue` (re-detect) or drop the try/catch so a never-rendering continue button surfaces as a real failure. The planner should pick per the "check for each possible screen deterministically" directive; the cleanest is: keep the bounded visibility wait, and on timeout `continue` so the loop re-evaluates (a genuinely-stuck screen then exhausts `maxSteps` → loud terminal failure).

### Anti-Patterns to Avoid
- **`page.goto()` bypass in a journey helper** — the removed pattern. Hard-navigating around a UI leg deletes that leg's test coverage.
- **Silent `catch` that advances the journey** — any recovery path that lets a broken product screen proceed green re-introduces WR-01.
- **Negative-lookahead URL settle** (`/\/candidate(?!\/profile)/`) — passes on any wrong-but-not-profile route (IN-01). Assert the positive destination.
- **Raw locators** — repo has a `no-raw-locators` lint rule; use `page.getByTestId(testIds.…)` / role locators (already followed in this file).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wait budgets | Magic-number ms literals | `TIMEOUTS.{element,click,page,slowPage}` from `tests/tests/helpers/timeouts.ts` | Repo convention; `slowPage`=10s, `page`=5s, `element`/`click`=2s |
| Element selection | Raw CSS/text locators | `testIds.voter.*` / `testIds.candidate.*` (`tests/tests/utils/testIds.ts`) | `no-raw-locators` lint rule |
| Seed-UUID lookup for a fallback URL | (nothing) | Delete it — no fallback remains | Only consumer was `navigateDirectlyToQuestions` |

**Key insight:** The removal is a net simplification. `advanceVoterFlow` already had a complete deterministic screen-detection loop; the hard-nav was a bolt-on recovery path, not a load-bearing mechanism.

## Runtime State Inventory

This is a test-harness refactor (dead-code deletion + branch simplification), not a rename/migration. No stored data, live service config, OS-registered state, secrets, or build artifacts embed the removed symbol names.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — helpers are test-time only | None |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | None — `tests/` is not a published package | None |

**Symbol-reference sweep (verified):** `advanceVoterFlow` referenced only in `voterNavigation.ts` (def + one call) and a doc-comment in `minimalVoterResultsPage.fixture.ts`. `navigateDirectlyToQuestions` and `resolveSeedUuids` referenced only inside `voterNavigation.ts`. Only `navigateToFirstQuestion` is exported/imported by specs.

## Common Pitfalls

### Pitfall 1: Removing the fallback re-exposes the SSR-compile continue-stall
**What goes wrong:** Phase 132 added the hard-nav because the elections/constituencies Continue button was observed to stall under the single dev server's SSR-compile load ("elections-continue-stall"). Removing the fallback means those transient stalls now must be absorbed by loop retries.
**Why it happens:** Cold-start SvelteKit route compilation on first traversal; single dev server (no Playwright `webServer`).
**How to avoid:** Ensure the retry loop has enough budget — the click uses a tight 3s fail-fast, then re-detects; with `maxSteps`=10 and `perStepTimeout`=5s there is generous headroom (journey has ≤5 real hops). Consider whether the pre-click `constituenciesCont.waitFor({ slowPage })` bounded wait should stay (gives the stalled button up to 10s to render before the loop re-detects). Run the full suite multiple times (project convention: 3× determinism gate) before declaring green.
**Warning signs:** Intermittent timeout at loop-exhaustion terminal `waitFor`, or a spec parking on `/elections`/`/constituencies`.

### Pitfall 2: E2E environment prerequisites (cardinal-failure rule)
**What goes wrong:** Suite fails for environment reasons, misattributed to the code change.
**How to avoid:** One fresh dev server on :5173 (no stale server stealing the port; there is no Playwright `webServer`), clean DB via `yarn db:reset` + seed before the full-suite gate. Failing/"did not run" E2E is a CARDINAL FAILURE — no known-flaky exemptions; the full `yarn test:e2e` run is the trusted signal. (Per project MEMORY: `project_e2e_execution_devserver_prereq`, `project_gsd_repo_e2e_runs_clean` — the -gsd repo runs clean via host Vite + local Supabase, no Docker.)

### Pitfall 3: IN-01 locale prefix
**What goes wrong:** A positive candidate-home regex that assumes an unprefixed `/candidate` may miss a locale-prefixed URL (e.g. `/en/candidate`).
**How to avoid:** The candidate journey runs in English; the canonical home route is `/candidate` (the protected `apps/frontend/src/routes/candidate/(protected)/+page.svelte`). Use an anchored positive match that tolerates an optional locale prefix and optional trailing slash, e.g. `waitForURL(/\/candidate\/?(?:\?|#|$)/)` — the review suggested `/\/candidate(?:\/(?:home)?)?$/`. Confirm against the actual URL the profile-submit `goto` lands on before locking the exact pattern.

## Code Examples

### Voter screen graph for the `e2e/base` seed (drives what `advanceVoterFlow` must handle)
The base template (`packages/dev-seed/src/templates/e2e/base.ts`) app_settings:
- `elections`: 2 elections (`test-e2e-base-el-reg` Regional + `test-e2e-base-el-mun` Municipal) → **multi-election → election selector SHOWS**. `disallowSelection: false`. `startFromConstituencyGroup` omitted (undefined) → standard order elections → constituencies → questions.
- Constituencies: `cg-reg`→{co-reg-n, co-reg-s}, `cg-mun`→{co-mun-ne…sw} → **constituency selector SHOWS** (multiple groups).
- `questions.questionsIntro.show: true`, `allowCategorySelection: true` → **questions-intro SHOWS**.
- `questions.categoryIntros.show: true`, `allowSkip: true` → **category-intro SHOWS**.
- `access.voterApp: true`, `underMaintenance: false`.

Redirect/implication logic (`(voters)/elections/+page.ts`, `(voters)/constituencies/+page.ts`): a single implied election auto-redirects past its selector; with 2 elections here neither is implied so both selectors render. `perm-*` specs mutate app_settings and can disable intermediate pages — hence the helper must remain resilient to any screen being skipped (which the race-loop already handles).

Full possible screen graph the deterministic loop must tolerate:
`Home → (main intro) → (elections) → (constituencies) → (questions-intro) → (category-intro) → first-question`
— any of the parenthesized screens may be skipped by app-settings/implication; `advanceVoterFlow` reacts to whichever is actually present.

### IN-01 target (candidate-journey.spec.ts:671)
```ts
// current (negative-lookahead — passes on any non-profile candidate route):
await page.waitForURL(/\/candidate(?!\/profile)/, { timeout: TIMEOUTS.slowPage });
// fix (positive home assertion — fails fast + names true destination):
await page.waitForURL(/\/candidate\/?(?:\?|#|$)/, { timeout: TIMEOUTS.slowPage });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `page.goto()` hard-nav bypass on continue-stall | Deterministic race-loop screen re-detection; loud failure on genuine stall | Phase 133 (this phase) | Restores test coverage of the elections/constituencies Continue leg |

**Deprecated/removed this phase:** `navigateDirectlyToQuestions`, `resolveSeedUuids`, `uuidCache`, and the `SupabaseAdminClient` import in `voterNavigation.ts` (all module-private, no external consumers).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Removing the hard-nav does not reintroduce a flake the full suite catches | Common Pitfalls / User Constraints | The trial fails the E2E gate; planner must add loop-budget tuning or reconsider (this is exactly what the "trial + suite is the gate" directive anticipates) |
| A2 | Canonical candidate-home URL is `/candidate` (English run, optional locale prefix) | IN-01 | Wrong regex could pass/fail incorrectly; confirm the actual submit-`goto` destination during implementation |
| A3 | `resolveSeedUuids`/`uuidCache`/`SupabaseAdminClient` have no other consumer | Summary / Runtime State Inventory | Verified by grep across `tests/` — only referenced inside `voterNavigation.ts`; low risk |

## Open Questions

1. **Exact candidate-home destination URL and whether the run is ever locale-prefixed**
   - What we know: protected home is `apps/frontend/src/routes/candidate/(protected)/+page.svelte` → `/candidate`; the journey runs in English.
   - What's unclear: the precise post-submit `goto` target string (trailing slash? query?).
   - Recommendation: at implementation time, read the profile-submit navigation target and match it positively; the regex in Code Examples is a safe default.

2. **Should the pre-click `waitFor({ slowPage })` bounded guard stay or go?**
   - What we know: it gives a stalling Continue button up to 10s to render before the loop moves on.
   - What's unclear: whether keeping it (with a non-hard-nav `catch`/`continue`) best matches "deterministically check for each possible screen."
   - Recommendation: Claude's discretion per the roadmap — prefer keeping a bounded wait but replacing the hard-nav `catch` with `continue`, so a genuinely stuck screen still exhausts `maxSteps` into a loud terminal failure.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Local Supabase (:54321) | E2E seed + run | assumed ✓ | — | `yarn db:reset` |
| Dev server (:5173) | E2E run | must be started fresh | — | none — required |
| Playwright browsers | E2E run | assumed ✓ | — | `yarn playwright install` |

**Missing dependencies with no fallback:** A single fresh dev server on :5173 must be running before the full-suite gate (no Playwright `webServer`; a stale server steals the port).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (`@playwright/test`) — repo-pinned |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn test:e2e --project=voter-journey --reporter=list` (targeted voter traversal) |
| Full suite command | `yarn test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WR-01 | Voter journey reaches first question via deterministic screen checks (no hard-nav) | e2e | `yarn test:e2e --project=voter-journey` (+ perm specs using `navigateToFirstQuestion`) | ✅ |
| WR-01 | A genuinely broken elections/constituencies Continue fails loudly (not bypassed) | e2e (negative — verified by full-suite green + code inspection) | `yarn test:e2e` | ✅ |
| IN-01 | Candidate post-submit lands on home; wrong route fails fast | e2e | `yarn test:e2e --project=candidate-journey` | ✅ (`candidate-journey.spec.ts`) |
| IN-02 | No degenerate `/questions?` URL / empty-cache path remains | static (deletion) | `yarn lint:check` (no unused imports) + `yarn test:e2e` | ✅ |

Specs exercising the changed helper (`navigateToFirstQuestion` → `advanceVoterFlow`):
- `tests/tests/specs/perm/perm-hide-category-tags.spec.ts`
- `tests/tests/specs/perm/perm-hide-election-tags.spec.ts`
- `tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts` (via `minimalVoterResultsPage.fixture.ts`)
- `tests/tests/specs/perm/perm-disable-allow-open.spec.ts` (via fixture)
- `tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts` (consumer fixture)
- plus the general voter-journey specs that walk Home→questions.

### Sampling Rate
- **Per task commit:** `yarn lint:check` + targeted `yarn test:e2e --project=voter-journey` and `--project=candidate-journey`.
- **Per wave merge:** full `yarn test:e2e`.
- **Phase gate:** full suite green — repeated per the project's 3× determinism convention (removing the flake-fix fallback demands proving no flake returns). Failing/"did not run" E2E = CARDINAL FAILURE.

### Wave 0 Gaps
- None — existing test infrastructure covers all phase requirements. The change is test-harness-internal; no new test files or fixtures required. (If IN-01's positive regex needs a new assertion helper, it is a one-line inline change, not a fixture.)

## Security Domain

Not applicable — test-harness-only change, no product/auth/input-handling surface. `security_enforcement` has no bearing: no ASVS category is touched (the deleted `SupabaseAdminClient` seed lookup was a test-time read against the local seed DB, not a production path).

## Sources

### Primary (HIGH confidence)
- `tests/tests/utils/voterNavigation.ts` (full read) — helper structure, all four fallback sites, private-symbol scope.
- `.planning/phases/132-.../132-REVIEW.md` — the three findings (WR-01/IN-01/IN-02) verbatim.
- `apps/frontend/src/routes/(voters)/elections/+page.ts`, `constituencies/+page.ts` — redirect/implication truth tables.
- `packages/dev-seed/src/templates/e2e/base.ts` (app_settings block) — which screens the base seed produces.
- `tests/tests/helpers/timeouts.ts` — TIMEOUTS values.
- `tests/tests/utils/testIds.ts` — voter/candidate testId map.
- Grep sweeps across `tests/` — consumer enumeration (only `navigateToFirstQuestion` exported).
- `.planning/phases/132-.../132-VERIFICATION.md` (lines 101-103) — WR-01 carried forward as review debt; fallback added as a 132-03 mid-gate flake fix; 3× gate passed honestly (no masking in recorded runs).

### Secondary (MEDIUM confidence)
- `candidate-journey.spec.ts:671` context (IN-01 line) + surrounding step 13.5 rationale.

### Tertiary (LOW confidence)
- Exact candidate-home post-submit URL string (A2) — inferred from route layout, confirm at implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; existing Playwright harness.
- Architecture (removal is safe, symbols are private): HIGH — verified by grep.
- Pitfalls (flake reintroduction risk): MEDIUM — the trial's outcome is what the E2E gate decides.

**Research date:** 2026-07-24
**Valid until:** 2026-08-23 (stable; test-harness internals)
