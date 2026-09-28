# Phase 119: E2E Fixtures & Helpers + Seed - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning
**Source:** Derived from the operator-approved Phase-118 deliverable `.planning/v2.14-E2E-COVERAGE-PLAN.md` (Phase 118 was the batched discuss/audit phase for the whole v2.14 E2E workstream; its coverage plan is the locked context for 119). Approval gate CLOSED 2026-06-14.

<domain>
## Phase Boundary

Phase 119 is the **fixtures-first foundation layer** for the existing-feature E2E spec phases (120 EPERM / 121 EFLOW / 122 bank-auth). It builds and self-tests everything those specs *consume* — fixtures, helpers, the production `data-testid`s they read, and the seed-data — **before any spec is authored** (A8 fixtures-first is a hard gate). It also fixes the default-seed tooling bug (UNBLK-03) and removes `--likert-only` entirely (A1).

**IN SCOPE (Phase 119):**
- **Fixtures & helpers** in `tests/tests/fixtures/**` and `tests/tests/utils/**` named in the approved plan for phases 120–122 (full inventory in `<decisions>`).
- **Production-source `data-testid` additions** that those helpers read (e.g. a generic `Video` component test-id on `Video.svelte`, a dark-mode toggle test-id, popup-modal / survey-feedback-popup / org-match-score / About-disclosure / nav-menu handles). Adding a `data-testid` is part of "build the helper" — the helper cannot read a test-id that does not exist.
- **Seed-data changes (SC4):** new / renamed / consolidated / extended dev-seed templates under `packages/dev-seed/src/templates/e2e/perm/**` + the `e2e/base` template + the template registry/index, keeping the **dev-seed unit suite green**.
- **UNBLK-03:** diagnose and fix `yarn db:seed:default` so it produces a valid dataset (parties present, candidates tab populated, consistent naming), verifiable in the running app.
- **`--likert-only` removal (A1):** pure deletion + doc-scrub across `packages/dev-seed` + docs; rebuild `@openvaa/dev-seed`.
- **Smoke / probe per new fixture (SC2):** each new fixture exercised by at least one smoke/probe proving its preparatory steps + view manipulation before specs rely on it.
- **Separate hygiene cleanup:** delete the verified-unused `voterNavigation.ts` helpers (`walkToQuestion`, `waitForNextQuestion`, `clickThroughIntroPages`, `walkToQuestionsIntro`) — **re-verify zero callers at execution time**; KEEP `navigateToFirstQuestion` (it has live callers).

**OUT OF SCOPE (defer to the spec phases 120–122):**
- `tests/playwright.config.ts` project wiring (project entries, serial-DAG `dependencies`, `testMatch`, device descriptors, `webServer` mock-OIDC entry).
- `tests/tests/setup/**` `data-setup-*` / `data-teardown-*` pairs.
- The `*.spec.ts` files themselves and all assertions.

**OUT OF SCOPE (defer to Phase 129, per the 119.4 operator override):**
- The **deferred-cluster fixtures** for the new-feature work — multi-select / number-scale / MultipleText answering, alliance card/drawer readers, the re-enabled nominations fixture path. These are built in Phase 129 *alongside their UNBLK feature*, not in 119. Only **generic helpers that are cheap** land in 119.

This phase writes **no E2E spec code and no Playwright project/setup wiring** — it delivers the consumable substrate plus its self-tests.
</domain>

<decisions>
## Implementation Decisions (locked — from the approved coverage plan)

### Cross-cutting locked rules (apply to all 119 work)
- **A8 — Fixtures-first hard gate.** No spec is authored before its fixtures exist + typecheck + pass a smoke/probe. Phase 119 satisfies the "exist + typecheck + locator-guard + smoke" half of that gate for 120–122.
- **A3 — Behaviour via fixtures, not selectors.** All new fixtures/helpers must pass `yarn typecheck:tests` and the `no-restricted-locators` (ESLint) locator guard. Use `data-testid`-based locators routed through `testIds` util conventions; no raw CSS/text locators that the guard rejects.
- **CRITICAL path correction:** the E2E suite lives at the **repo-root `tests/`**, NOT `apps/frontend/tests/`. The voter fixture is `tests/tests/fixtures/voter/voter-journey.fixture.ts` (not the stale `tests/tests/fixtures/voter.fixture.ts`). The `voter-journey.fixture.ts` `answeredVoterPage`/`locatedVoterPage` **already answer boolean/categorical/number opinion types natively** (per-question scoped option-count loop) — this is *why* `--likert-only` removal needs no fixture rewrite.
- **A1 (OPERATOR OVERRIDE) — `--likert-only` removed COMPLETELY, no shim, no fixture change.** Pure deletion + doc-scrub. Deletion surface (verified): DELETE `packages/dev-seed/src/cli/likert-only.ts` + `packages/dev-seed/tests/cli/likert-only.test.ts`; remove flag parsing + `applyLikertOnlyFilter` call from `src/cli/seed.ts`; drop the line from `src/cli/help.ts` + update `tests/cli/help.test.ts`; remove `applyLikertOnlyFilter`/`LikertOnlyFilterStats` exports from `src/index.ts`; update the `setupFromTemplate.ts` docstring (drop the `likertOnly` "not supported" paragraph); remove the `voterNavigation.ts` NOTE comment; scrub mentions from `CLAUDE.md` (the "Note on `--likert-only`" + "Yarn arg-forwarding caveat" paragraphs + the seeding-table row), `packages/dev-seed/README.md`, `tests/README.md`. **Rebuild `@openvaa/dev-seed`** after (removes `dist` exports).

### Seed-data changes (SC4) — perm templates land in 119 (dev-seed layer)
> The coverage plan documents each seed delta inside its requirement block for the executor's convenience, but ROADMAP Phase 119 SC4 ("Any required `e2e/base` / perm-template seed-data changes are landed and the dev-seed unit suite stays green") places the **template authoring in 119**; the spec phases only wire Playwright projects + setup/teardown + specs around them. Existing perm templates on disk are named `perm-<name>.ts` under `packages/dev-seed/src/templates/e2e/perm/` (confirm the exact registry/index mechanism in research).

- **NEW `perm-question-video` template** (EPERM-06) — own `e2e-perm-qvid-` externalId prefix; category-intros shown; 5-question / 3-category layout with `customData.video` (`VideoContent`) on three *questions* only (q1, q3, q5), none on category intros. **Additive** (own namespaced dataset).
- **NEW `perm-interactive-info` template** (EPERM-07) — own prefix; one `questions.interactiveInfo.enabled=true` (popup-modal) + one default (static-expander) question, PLUS advanced info content: `customData.infoSections` (≥1 question), `customData.arguments` on **three separate questions — one Likert/ordinal, one Boolean, one Categorical** (argument rendering is type-dependent; categorical groups by `choiceId`). **Additive.**
- **RENAME + EXTEND `perm-header-show-feedback` template → `show-feedback-survey`** (EPERM-09) and set `results.showSurveyPopup=true`, `results.showFeedbackPopup`, `survey.showIn=['results']` (+ relevant surfaces). Update the registry/index entry to the new name. **Additive to that perm template** (the existing header-feedback assertion stays valid).
- **NEW `perm-org-matching` template** (EPERM-10) — sets `matching.organizationMatching`, plus an organization with SOME of its own answers AND member candidates with answers on the questions the org leaves blank (so `none`/`answersOnly`/`impute` produce distinguishable org match scores). The three modes are exercised by re-seeding the singleton per mode. **Additive.**
- **CONSOLIDATE `perm-disable-voter-app` + `perm-disable-candidate-app` templates → one `perm-access-disable` template** (EPERM-11) able to set `access.voterApp=false` / `access.candidateApp=false` / `access.underMaintenance=true` per sub-test. Update the registry/index (remove the two old entries, add the consolidated one). **Additive.** (NOTE: the old `*.spec.ts` deletion + project removal is the Phase-120 half; 119 owns the *template* consolidation.)
- **`e2e/base` additive — `customData.terms`** (EPERM-07 NOTE): ADD `customData.terms` (`Array<{triggers[], title?, content}>`) to a question in the **main `e2e/base` dataset** so the Phase-120 voter-journey extension can assert term-trigger affordances + definition popup. **Additive seed change to base.**
- **`e2e/base` — EPERM-05 org missing-data:** the org slice needs an organization with a missing election symbol AND a missing answer so the org-typed `showMissingElectionSymbol.organization` / `showMissingAnswers.organization` markers render. If an existing party already lacks symbol/answer this is **additive (assert-only, zero seed change)**; making a party answer-incomplete is **NON-ADDITIVE** (shifts org card counts the journey asserts at ~lines 749–781). Confirm which against `base.ts` org rows in research; default to additive.

### Fixtures & helpers to BUILD in 119 (named in the plan)
> Each is "NEW … (Phase 119)" in the build list. Build the helper + any `data-testid` it reads + a smoke/probe.

**For EPERM specs (Phase 120):**
- **`Video` component test-id + `expectVideo(present)` reader** (EPERM-06) — add a *generic* `data-testid` to `apps/frontend/src/lib/components/video/Video.svelte` (NOT to the hero `<figure>`), used in BOTH voter + candidate apps. The Video element is deliberately not destroyed between page loads → assert visibility/attachment of the rendered instance, not mount/unmount churn.
- **`expectInfoMode(question, 'popup'|'expander')` + popup-modal test-id handle** (EPERM-07) — abstracts "click info → modal dialog (popup)" vs "click info → inline body reveal (expander)". PLUS **`expectInfoSections([...])`** and **`expectArguments(question, type)`** readers (type-appropriate argument layout incl. categorical per-`choiceId` grouping).
- **Survey/feedback-popup test-id handle + dismiss-and-reload helper** (EPERM-09) — to assert dismiss-persistence across reload.
- **Org-match-score readout handle + About-page disclosure test-id handle** (EPERM-10) — if absent.

**For EFLOW specs (Phase 121):**
- **`entityFilters` categorical `selectAll()` / `selectNone()`** (EFLOW-01) — add to `entityFilters.fixture.ts` if the select-all/none affordance has no fixture method yet (the control only renders above an option-count threshold — confirm threshold in research).
- **`expectSubMatch(category, score)` reader on `resultsPage`** (EFLOW-04, optional encapsulation) — read individual subMatch gauge values.
- **Dark-mode toggle test-id handle + `expectTheme('dark'|'light')` reader** (EFLOW-07) — `darkMode` context member is a stable reference (CLAUDE.md), so the toggle is a UI affordance; theme persisted via `runeLocalStorage`.
- **NEW intercept fixture `tests/tests/fixtures/shared/trackingIntercept.fixture.ts`** (EFLOW-08, A8 fixtures-first) — captures payloads at the boundary `track` ultimately emits to (network request / `sendBeacon` / fetch; fall back to console/window-hook). Exposes `getTrackCalls()`. Tracking model: `track`/`startEvent`/`startPageview` differ in bundling/timing, all routed via `track` at submission, gated by a `shouldTrack` rune handle (grounded in `apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts`).
- **`expectNavMenuItems([...])` reader** (EFLOW-09, optional) — shared between voter + candidate nav assertions.
- **Mobile-nav-open helper** (EFLOW-11, only if a mobile-only hamburger needs a distinct open step).

**For bank-auth (Phase 122):**
- **EFLOW-10:** no new helper required (the spec owns `buildTestIdToken`); 122 only retargets assertions + adds `beforeAll` JWKS config. **OPEN for research:** the EFLOW-10b build entry calls to **extract `buildTestIdToken` into a shared util** so both the Edge-Function spec and the Option-B mock issuer consume one builder — decide whether that extraction is a cheap generic helper that belongs in 119 or stays a 122 build item (it is tagged a "Phase-122 build implication" in the plan, not "Phase 119"; default = leave in 122 unless research shows it is a clean cheap extraction).

### Claude's Discretion
- The exact internal shape of each new helper (method signatures, where it hangs off an existing page-object vs a new fixture), as long as it typechecks, passes `no-restricted-locators`, and has a smoke/probe.
- The smoke/probe mechanism (standalone probe spec seeded via the dev-seed CLI + driven against the running app vs a minimal Playwright project) — pick the lightest approach that proves the fixture's preparatory steps + view manipulation without requiring the (out-of-scope) full project wiring.
- The exact UNBLK-03 fix once the root cause is diagnosed in research.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Approved plan + discussion (PRIMARY)
- `.planning/v2.14-E2E-COVERAGE-PLAN.md` — the operator-approved coverage + build plan. §Build List (EPERM/EFLOW/Bank-Auth blocks) lists every fixture/helper/seed delta with the "(Phase 119)" tags; §Cross-Cutting Findings → `--likert-only` removal (deletion surface table) + UNBLK seed additions + Non-additive seed ripples (119.3 re-baseline table) + Bank-auth Idura cross-ref; §Extension-Scope Pins (118.4).
- `.planning/v2.14-E2E-DISCUSSION-POINTS.md` — the operator's `★ DECISIONS LOCKED` (A1 / 119.3 / 119.4 / 122.2 overrides + confirmed defaults).
- `.planning/phases/118-e2e-coverage-audit-coverage-plan/118-CONTEXT.md` — the upstream locked decisions (A1–A9, 118.3/118.4 audit methodology).

### Requirements + roadmap
- `.planning/REQUIREMENTS.md` — UNBLK-03 definition + the per-requirement NOTEs + traceability (UNBLK-03 → Phase 119; EQTYP/EFLOW-02 deferred → 130).
- `.planning/ROADMAP.md` — v2.14 Phases 118–132; Phase 119 + the consuming phases 120/121/122.

### E2E catalog / fixtures / seed (the live code to ground against)
- `tests/playwright.config.ts` — the serial project DAG (read-only context; do NOT edit in 119 — project wiring is the spec phases' job).
- `tests/tests/fixtures/voter/{views.ts, voter-journey.fixture.ts, resultsPage.fixture.ts, entityFilters.fixture.ts, entityDetails.fixture.ts, minimalVoterResultsPage.fixture.ts}` — voter fixtures to extend.
- `tests/tests/fixtures/shared/{emailBucket, feedbackDialog, langSelector, multilingualTextField}.ts` — shared fixtures (`trackingIntercept` joins here).
- `tests/tests/fixtures/candidate/*` — candidate page-object fixtures.
- `tests/tests/utils/{testIds.ts, voterNavigation.ts, buildRoute.ts, ...}` — helper/util conventions + the `voterNavigation.ts` hygiene-deletion targets.
- `tests/tests/setup/shared/setupFromTemplate.ts` — the docstring to scrub (likertOnly paragraph).
- `packages/dev-seed/src/templates/{default.ts, e2e/base*, e2e/perm/perm-*.ts}`, `packages/dev-seed/src/templates/index.ts` (registry), `packages/dev-seed/src/cli/{seed.ts, help.ts, likert-only.ts}`, `packages/dev-seed/src/index.ts`, `packages/dev-seed/tests/**` — the dev-seed package (templates + CLI + unit suite).
- `apps/frontend/src/lib/components/video/Video.svelte` — needs the generic Video test-id.
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts` — the tracking model for the intercept fixture.
- `packages/app-shared/src/data/customData.type.ts` — `VideoContent` / `infoSections` / `arguments` (`QuestionArguments`) / `terms` shapes for the seed authoring.

### Determinism precedent
- v2.10 final suite (82/2) and v2.11 gate (84/0) — the 3×-green determinism standard the consuming spec phases must hold (119's smoke/probes should likewise be deterministic).
</canonical_refs>

<specifics>
## Specific Ideas

- **UNBLK-03 is symptom-only today** — "default seed produces parties absent / candidates tab empty / inconsistent naming." Research must diagnose the root cause in `packages/dev-seed/src/templates/default.ts` (+ helpers) and the verification must be **in the running app** (`yarn db:seed:default` then load the app, confirm parties + candidates tab + naming), not just a unit assertion.
- **`--likert-only` removal is the highest-leverage item** — it is a pure deletion that unblocks the fixture story; do it early so the dev-seed rebuild + unit-suite-green gate is settled before the template authoring piles on.
- **Smoke/probe shape (SC2):** the goal is to prove "preparatory steps + view manipulation" — a probe that seeds the relevant template via the dev-seed CLI, drives the app, and exercises the new helper end-to-end is sufficient; it need not be a full feature spec and must not require the out-of-scope Playwright project wiring.
- **Non-additive ripple awareness:** the new opinion-question types (number-scale, multipleChoiceCategorical) are **NOT** a 119 concern — they are Phase-129 seed work (UNBLK-02/05) per 119.4. The 119.3 re-baseline table applies to Phase 129/130, not 119. 119's `e2e/base` changes are the additive `customData.terms` + the (default-additive) EPERM-05 org slice only.
</specifics>

<deferred>
## Deferred Ideas

- **Playwright project wiring + setup/teardown + spec files** — Phases 120 (EPERM), 121 (EFLOW), 122 (bank-auth).
- **Deferred-cluster fixtures** (multi-select / number-scale / MultipleText answering, alliance card/drawer readers, re-enabled nominations path) — Phase 129, alongside their UNBLK feature (119.4 operator override). Only cheap generic helpers land in 119.
- **`buildTestIdToken` shared-util extraction + Option-B mock OIDC issuer harness** — Phase 122 build implications (the mock issuer is 122; the extraction is flagged for research to confirm whether it is a cheap 119 generic helper or stays in 122).
- **The new opinion-question-type seed additions + the 119.3 non-additive re-baselines** — Phase 129/130 (UNBLK-02/05), not 119.
</deferred>

---

*Phase: 119-e2e-fixtures-helpers-seed*
*Context derived 2026-06-14 from the operator-approved `.planning/v2.14-E2E-COVERAGE-PLAN.md` (Phase 118 batched discussion deliverable)*
