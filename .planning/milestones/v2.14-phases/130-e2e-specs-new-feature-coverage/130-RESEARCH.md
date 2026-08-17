# Phase 130: E2E Specs — New-Feature Coverage - Research

**Researched:** 2026-07-19
**Domain:** Playwright E2E spec authoring (test-only; no product code) against the OpenVAA repo-root `tests/` suite
**Confidence:** HIGH (every claim grounded in a file read/grep this session; no external-dependency research needed)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 — Nominations coverage = dedicated `voter-nominations.spec.ts` only.** Clean leaf project (`data-setup-base`, read-only); do NOT grow the journey spec. The old commented-out journey step referenced `voter-mega-journey` (renamed/rebuilt as `voter-journey` in 119–122), so "re-enable" is really "re-author" as a dedicated spec.
- **D-02 — EQTYP-01 opportunistic tightening ACCEPTED.** While adding the new multi-choice assertions, tighten the existing candidate categorical + boolean opinion assertions from generic (choice-select + continue) to type-specific in the same pass — closes the EQTYP-01 NOTE fully. Do NOT let it sprawl into a general journey-spec refactor (same spec region only).
- **D-03 — `voter-alliance.spec.ts` covers:** alliance card presence in `results.sections[]` (EPERM-03 sub-assertion), member orgs as clickable in-card children, the member-orgs drawer (EFLOW-02), **and the EPERM-04 alliance tab-control rider** — `entityDetails.contents.alliance` honored for alliance drawers (rides the same fixtures).
- **D-04 — Assert-only on seed.** Alliance A ↔ member-org wiring in `e2e/base` was verified at Phase 129 close (129 D-10); this phase does NOT re-verify seed rendering, it asserts behavior.
- **D-05 — Determinism gate = FULL suite 3×** (operator choice, stronger than new-specs-only). Each run: fresh dev server on :5173 (no Playwright webServer), clean DB (`yarn db:reset`). E2E cardinal rule applies — any failing OR did-not-run test blocks completion.

### Claude's Discretion
- Leaf-project wiring details for `voter-alliance.spec.ts` / `voter-nominations.spec.ts` (mirror the existing perm-spec leaf-project pattern — see `voter-dark-mode` / `voter-journey-mobile` for the freshest exemplars).
- Exact assertion granularity for the number-scale boundary-matching test (voter at min ranks the min-positioned candidate first), built on an `answerNumberScale(question, value)`-style fixture against the 129 slider's keyboard contract.

### Deferred Ideas (OUT OF SCOPE)
- (none captured — Q16 left empty)
- Explicit out-of-bounds from `<domain>`: product-code changes (Phase 129), flake-triage backlog (Phase 131), the gate flip (Phase 132). The EPERM-03 REQ-ID maps to Phase 120 (no double-mapping) — only the alliance-presence sub-assertion lands here. The UNBLK-04 REQ-ID maps to Phase 129 — here expressed as a new assertion only.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (REQUIREMENTS.md) | Research Support |
|----|------------------------------|------------------|
| **EQTYP-01** | E2E covers multi-choice categorical opinion questions — voter answering, candidate answering, and matching (dep UNBLK-02). NOTE: check categorical+boolean opinion answering for candidates. | Voter/candidate *answering* already walks (129-08). Net-new: matching-incorporation assertion + opinions-tab drawer display + type-specific candidate assertions (D-02). See §Current-State Delta rows EQTYP-01. |
| **EQTYP-02** | E2E covers number-scale opinion questions — answering and matching **boundary** behaviour (dep UNBLK-05). | Slider answered at max in the walk (129-08). Net-new: min/mid boundary ranking assertion + drawer display. Needs a value-parametrized `answerNumberScale`. See §Current-State Delta EQTYP-02 + §Code Examples. |
| **EQTYP-03** | E2E covers text + MultipleText — voter/candidate rendering + answer **round-trip** (dep UNBLK-01). | Voter drawer 13→14 flip + keyword read ALREADY landed (129-08). Net-new: **candidate multipleText fill + preview round-trip** (currently intentionally omitted from the fill map). See §Current-State Delta EQTYP-03. |
| **EFLOW-02** | E2E asserts alliance-card rendering + member-orgs drawer in voter results. | Presence + card + gauge + subcard asserted in voter-journey (D-10). Net-new: dedicated `voter-alliance.spec.ts` adding member-orgs **drawer**, in-card **clickable** children, EPERM-04 **tab control** (D-03). |

**Rider criteria (not REQ-IDs — success criteria only):**
- EPERM-03 alliance-presence sub-assertion (alliance entities in `results.sections[]`) — lands as a criterion here; REQ-ID maps to Phase 120.
- `/nominations` all-nominations render — new assertion tied to UNBLK-04 (REQ-ID maps to Phase 129).
- EPERM-04 alliance tab-control rider — rides the `voter-alliance` fixtures (D-03).
</phase_requirements>

## Summary

Phase 130 authors E2E specs for the features Phase 129 built. **The single most important research finding: the 130 CONTEXT.md was written 2026-07-17, but Phase 129 executed 2026-07-18 and shipped substantially more test coverage than the CONTEXT anticipated.** Phase 129 plan 129-07/129-08 already: (a) registered all eight new-feature locators in `testIds.ts`, (b) extended the `voter-journey` walk to *answer* number-scale (slider End→max) and multi-choice (2 checkboxes) opinion questions, (c) extended `candidate-journey` with type-aware answering (slider/checkbox/radio), (d) **flipped the multipleText info-item assertion 13→14 with keyword reads (the EQTYP-03 voter side)**, (e) re-baselined the delete→results-CTA boundary to 3 deletes, and (f) added a **D-10 alliance-presence step** to voter-journey (allianceSection visible + Alliance A card + match-score gauge + member-org subcard). The full E2E suite closed at 125 passed / 0 failed.

This means Phase 130 is **not** building answering-walks from scratch — it is closing the **assertion-depth gaps** that the 129 re-baseline deliberately left (129's walk *answers* the new types to keep the suite green, but does not *assert matching behaviour or drawer display* for them). The net-new work is narrower and sharper: (1) matching-incorporation + boundary + drawer-display assertions for the new opinion types, (2) type-specific candidate assertions (D-02), (3) the candidate multipleText fill+round-trip (still intentionally omitted from the fill map), (4) a dedicated `voter-alliance.spec.ts` for the member-orgs drawer + clickable in-card children + alliance tab control, and (5) a dedicated `voter-nominations.spec.ts`.

The fixture and locator layer is **essentially complete** — `resultsPage` (`selectEntityTab('alliances')`, `getEntityCards`, `openEntityDetailsForCard`), `entityDetails` (`selectTab`, `expectTabs`, `getMemberCards`, `expectInfoItem`, `expectQuestionDisplay`), and all testIds already exist. "Fixtures-first within the phase" (SC4) therefore reduces to a small set of net-new fixture methods (a value-parametrized `answerNumberScale`, a candidate `answerMultipleText`/fill-map entry, possibly thin alliance-card helpers), each proven by a smoke/probe before the specs consume it.

**Primary recommendation:** Plan around the *delta*, not the CONTEXT's original scope. Before writing any spec, re-read the current `voter-journey.spec.ts` (lines ~728–1005) and `candidate-journey.spec.ts` (lines ~200–540) to confirm exactly what already asserts vs. only walks — then author the two new leaf-project specs by cloning the `voter-dark-mode` project pattern, and extend the journeys only at the pinned regions.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| New-opinion-type answering (voter) | Test fixture (`voter-journey.fixture.ts` walk loop) | — | Already type-aware (radio/slider/checkbox) as of 129-07; drives the frontend inputs |
| New-opinion-type matching/boundary assertions | Spec (`voter-journey.spec.ts` results step) | Matching algorithm (product, already built 129) | Assertion lives in the spec; the behaviour it asserts is `@openvaa/matching` output rendered in results |
| Candidate type-specific answering + round-trip | Spec (`candidate-journey.spec.ts`) + fixture (`candidateQuestionPage`/preview) | — | Fill + save + preview re-read is a candidate-app page-object concern |
| Alliance card / drawer / tab-control | Spec (`voter-alliance.spec.ts`) + fixtures (`resultsPage`/`entityDetails`) | Seed (`e2e/base`, assert-only per D-04) | Rendering is voter-results tier; drawer + tabs are `entityDetails` fixture surface |
| Nominations-route render | Spec (`voter-nominations.spec.ts`) | `/nominations` route loader (product, built 129 UNBLK-04) | Read-only assertion against an existing route |
| Determinism gate (3× full suite) | CI/run discipline (dev server :5173 + `db:reset`) | — | Environment orchestration, not code |

## Current-State Delta — What 129 Already Shipped vs Net-New for 130

> **This is the load-bearing section.** Every "Already on disk" claim is `[VERIFIED: file read/grep, 2026-07-19]`. The planner MUST NOT re-plan work that is already done; it MUST plan the "Net-new" column.

| Requirement / rider | Already on disk (129-07/08) | Net-new for Phase 130 |
|---------------------|------------------------------|------------------------|
| **EQTYP-01** multi-choice categorical opinion | `voter-journey.spec.ts:732` walks `expectMultiChoiceQuestionAndAdvance` (clicks 2 checkboxes); `candidate-journey` answers it via type-aware `answerCurrentQuestion` (generic). Seed `qu-opin-base-7-multichoice` (4 choices, min 2/max 3) at sort_order 106. Locators `question-choice`+`question-choice-helper` registered. | (a) Assert the multi-select answer **incorporates into matching** (ranking reflects multi-choice distance). (b) Open an entity drawer → opinions tab → assert the multi-choice opinion **displays correctly** (voter multi-select vs entity answer) via `entityDetails.expectQuestionDisplay`. (c) **Type-specific** candidate assertion for the multi-choice input (not just choice-select+continue). (d) D-02: tighten existing candidate categorical + boolean opinion assertions to type-specific in the same pass. |
| **EQTYP-02** number-scale opinion | `voter-journey.spec.ts:731` walks `expectNumberQuestionAndAdvance` (slider `End`→max / `Home`→min keyed on answerMode). `candidate-journey` answers via slider. Seed `qu-opin-base-6-number` (min 0/max 10) at 105; POLAR_MAX/POLAR_MIN candidates at 10/0. Locators `question-number-slider`/`question-number-value` registered. | (a) Assert the **matching boundary**: voter at min ranks the min-positioned candidate first / max last; a mid value → intermediate ranking. Requires a **value-parametrized** answer (129 only built max/min End/Home), i.e. a new `answerNumberScale(question, value)` fixture (Home + N×ArrowRight). (b) Opinions-tab drawer display of the number opinion (voter value vs entity value). |
| **EQTYP-03** text + MultipleText round-trip | **Voter side DONE:** `voter-journey` info-item count flipped 13→14 with multipleText "keyword" reads (129-08). Text round-trip still covered (bio item + `perm-localisation-positive` `[en-answer-q1]`/`[fi-answer-q1]`). `qu-info-multipleText` restored to seed (sort_order 8) + `MultipleTextInput` row-list (`multiple-text-*` testids). | **Candidate multipleText round-trip is NET-NEW.** `candidate-journey.spec.ts:538` only asserts the multipleText info question is *rendered*; `candidateJourneyConstants.ts:78` states `test-qu-info-multipleText` is **intentionally omitted from the fill map**. Phase 130 must: add a candidate `answerMultipleText`/row-list fill helper (`multiple-text-add`/`-row`), add the fill-map entry (≥2 values), and assert the values round-trip in preview (`candidatePreviewPage.expectInfoAnswer`). |
| **EFLOW-02** alliance card + member-orgs drawer | `voter-journey.spec.ts:986` (D-10 step) asserts: `selectEntityTab('alliances')` → `allianceSection` visible → Alliance A card → `match-score` gauge → member-org subcard (`cardSubcard.nth(1)`) visible. | Per D-01/D-03: **NEW dedicated `voter-alliance.spec.ts`** (own leaf project) adding depth the journey step lacks: (a) member orgs as **clickable in-card children** that open that member org's entity-detail drawer; (b) the **member-orgs drawer** on the alliance itself (open alliance drawer → `children`/Members tab → `getMemberCards()` lists the expected orgs); (c) EPERM-04 **alliance tab control** — alliance drawer shows exactly `['info','children']` (seed `entityDetails.contents.alliance`) and NOT `opinions`. |
| **EPERM-03 alliance-presence** (rider) | Satisfied in principle by the D-10 step (`allianceSection` visible in results). | Re-assert as an explicit criterion inside `voter-alliance.spec.ts` (`results.sections[]` includes an alliance section alongside candidate + organization). Do NOT double-map the REQ-ID. |
| **/nominations render** (UNBLK-04 rider) | `/nominations` route loader fetches question data (129-03 UNBLK-04, verified). The old journey nominations step is gone (spec was renamed). `perm-hide-all-nominations` / `perm-missing-nominations` cover hidden/missing paths only. | **NEW dedicated `voter-nominations.spec.ts`** (own leaf project, `data-setup-base` read-only): navigate to `/nominations` → assert all-nominations entities **render** (present, not empty/broken). |

**Seed facts (assert-only per D-04) `[VERIFIED: packages/dev-seed/src/templates/e2e/base.ts]`:**
- `results.sections: ['candidate','organization','alliance']` (alliance strictly LAST — Org-first imputation cascade invariant).
- `entityDetails.contents.alliance: ['info','children']`; `cardContents.alliance: ['children']` (member orgs shown as in-card children).
- Alliances: `[al-a] Alliance A`, `[al-b] Alliance B`; Alliance A nominated in the voter-journey voter's `CO-Reg-N` scope with member orgs OR-AA/OR-AB.
- New opinion questions: `qu-opin-base-6-number` (number, min 0/max 10, sort 105), `qu-opin-base-7-multichoice` (multipleChoiceCategorical, 4 choices, minSelections 2/maxSelections 3, sort 106) — both in the MAIN category (non-additive placement, already re-baselined).

## Standard Stack

### Core (all already present — zero new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | as installed in repo | E2E runner + assertions | The project's sole E2E framework (`tests/playwright.config.ts`) |
| Existing fixture layer (`tests/tests/fixtures/**`) | in-repo | Page objects: `views.ts` composition root, `resultsPage`, `entityDetails`, `voter-journey.fixture`, `candidateQuestionPage`, `candidatePreviewPage` | Established audit→plan→fixtures-first convention |
| `testIds.ts` selector catalogue | in-repo | Single source of locators; all 8 new-feature locators registered 129-07 | Prevents selector drift |

**No `npm install` is required for this phase.** It is pure test authoring on top of the installed Playwright + existing fixtures.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated `voter-alliance.spec.ts` (D-03) | Extend voter-journey D-10 step | Rejected by D-01/D-03 — journey already long; dedicated spec is cleaner and matches the coverage-plan build entry |
| Value-parametrized `answerNumberScale(q, value)` | Reuse 129's `answerMode: 'min'` End/Home walk | 'min' only reaches the extreme; the boundary test also wants a mid value for intermediate ranking → a value-parametrized helper is the right shape |

## Package Legitimacy Audit

**N/A — this phase installs no external packages.** It authors Playwright specs and fixtures using the already-installed `@playwright/test` and in-repo helpers. No registry lookup, no legitimacy gate, no postinstall audit applies. If the planner discovers an unexpected need for a new dependency (not anticipated), it MUST gate that install behind a `checkpoint:human-verify` task and run the legitimacy gate then.

## Architecture Patterns

### Leaf-project wiring (the pattern for both new specs) — `[VERIFIED: tests/playwright.config.ts]`
The suite uses a strict serial project DAG. Every spec is its own Playwright *project*. A **read-only leaf** that reads the base dataset needs ONLY a project entry with `dependencies: ['data-setup-base']` — no own setup/teardown pair (Alliance A + nominations already in `e2e/base`, D-04). The freshest exemplars are `voter-dark-mode` (Phase 121) and `voter-journey-mobile` (Phase 121):

```ts
// Source: tests/playwright.config.ts:290-296 (voter-dark-mode leaf) — clone this shape
{
  name: 'voter-alliance',
  testDir: './tests/specs/voter',
  testMatch: /voter-alliance\.spec\.ts/,   // exact scope — voter-journey's testMatch excludes it
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-base']         // read-only; no own teardown
}
```

- `voter-journey`'s `testMatch` is `/voter-journey\.spec\.ts/` (exact) → it will NOT pick up `voter-alliance.spec.ts` or `voter-nominations.spec.ts`. Each new file MUST get its own project entry or **it never runs** (a bare `.spec.ts` file with no project is silently skipped — Pitfall below).
- Place both new projects in the `=== base / voter-journey chain ===` region alongside `cold-entry-dataroot` / `voter-dark-mode`.

### Fixture reuse (composition root)
Specs import `{ test, expect }` from `tests/tests/fixtures/voter/views.ts` — that `base.extend` exposes `resultsPage`, `entityDetails`, `voterHomePage`, `voterIntroPage`, `voterQuestionsPage`. `voter-alliance.spec.ts` reaches `answeredVoterPage` (max, all-answered) → `/results` → `resultsPage.selectEntityTab('alliances')` → `getEntityCards()` → `openEntityDetailsForCard(...)` → `entityDetails.selectTab/expectTabs/getMemberCards`.

### Semantic-step style
Behaviour-level `test.step(...)` blocks describing WHAT is asserted (not selectors). Match the existing journey style. Keep D-02 tightening confined to the same spec region as the new multi-choice assertions.

### Anti-Patterns to Avoid
- **Duplicating the D-10 alliance-presence assertion verbatim** in both voter-journey and voter-alliance without adding depth — the dedicated spec must add drawer/children/tab-control, not just re-run presence.
- **Adding a new spec file without a project entry** — it will not run and "did not run" = cardinal failure.
- **Re-baselining the voter-journey rigid counts again** — 129-08 already set score-gauge=4 and category-checkboxes=5 (empirically UNCHANGED by main-category placement) and delete-boundary=3. Do not disturb these unless an assertion genuinely requires it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Answering the new opinion inputs | A bespoke click loop per spec | The 129-07 walk branches (`expectNumberQuestionAndAdvance` / `expectMultiChoiceQuestionAndAdvance`) already in `voter-journey.fixture.ts` | Already type-aware, settle-before-count safe |
| Selecting the alliance tab / reading member cards | Raw `getByTestId` in the spec | `resultsPage.selectEntityTab('alliances')` + `entityDetails.getMemberCards()` | Handles the conditional single-section rendering + transition settling |
| Asserting drawer tab presence/absence | Manual tab locators | `entityDetails.expectTabs([...])` | Already asserts per-type tab control (EPERM-04 shape) |
| Number-slider exact value | `fill()` on the range input | `focus()` + `Home` + N×`ArrowRight` (step=1) | Native range keyboard is the D-03 contract; `fill` bypasses the persist-on-release logic |
| A new setup/teardown pair for the leaf specs | A `data-setup-*` triad | `dependencies: ['data-setup-base']` (read-only) | Alliance A + nominations already seeded (D-04); a new triad would clobber the shared singleton needlessly |

**Key insight:** The fixture/locator/seed substrate is done. Custom test infrastructure here is almost always re-inventing something 129 already shipped — grep the fixtures first.

## Common Pitfalls

### Pitfall 1: Planning to build what 129 already built
**What goes wrong:** Following 130-CONTEXT.md literally (it predates 129 execution) leads to re-authoring the answering walk, the 13→14 flip, and the alliance-presence step.
**How to avoid:** Diff against disk. The §Current-State Delta table is the authoritative scope. Re-read `voter-journey.spec.ts:728-1005` before planning.
**Warning signs:** A plan task titled "add slider answering to voter-journey" or "flip multipleText 13→14" — both already done.

### Pitfall 2: A new spec file that never runs
**What goes wrong:** Adding `voter-alliance.spec.ts` under `tests/specs/voter` without a matching project entry — `voter-journey`'s exact `testMatch` won't include it, so it silently does not execute.
**How to avoid:** Add the project entry with a scoped `testMatch` in the same task that creates the file. Verify with `npx playwright test --list` that the new project appears.
**Warning signs:** Suite passes but the new assertions never show in the run report → "did not run" = cardinal failure (D-05).

### Pitfall 3: Number-scale boundary needs a value the walk doesn't produce
**What goes wrong:** The 129 walk only answers slider at End (max) in the 'max' answeredVoterPage. The EQTYP-02 boundary ("voter at min ranks min-candidate first") needs a min (and ideally mid) answer, which the shared `answeredVoterPage` doesn't yield.
**How to avoid:** Build a value-parametrized `answerNumberScale(question, value)` fixture (Home + N×ArrowRight) and either a dedicated boundary test-step or a separate answering pass. Fixtures-first: prove it with a smoke/probe.
**Warning signs:** Trying to assert min-ranking from the existing max walk.

### Pitfall 4: `db:reset` storage 502-wedge (documented environment gotcha)
**What goes wrong:** `supabase db reset`'s post-migration container restart intermittently returns 502, leaving `storage.buckets` empty ("Bucket not found" on portrait upload) — corrupts a run.
**How to avoid:** Recover via a full `db:stop && db:start && db:reset` cycle (re-provisions buckets from `config.toml`). This is a per-run prereq for the 3× gate.
**Warning signs:** Portrait/storage failures in candidate-journey during the D-05 gate.

## Code Examples

### Value-parametrized number-scale answer (net-new fixture) — against the D-03 keyboard contract
```ts
// Contract source: apps/frontend/src/lib/components/questions/NumberScaleInput.svelte:14-16
//   native <input type=range> step=1; Home→min, End→max, ArrowRight +1, ArrowLeft -1
async function answerNumberScale(page, question, value) {
  const slider = page.getByTestId(testIds.voter.questions.numberSlider);
  await slider.focus();
  await slider.press('Home');                 // land on min deterministically
  const min = question.min ?? 0;              // e.g. 0 for qu-opin-base-6-number
  for (let i = 0; i < value - min; i++) await slider.press('ArrowRight');
  // number inputs never auto-advance (129-06) → caller clicks Next explicitly
}
```

### Alliance drawer + member-orgs + tab control (voter-alliance.spec.ts) — reusing existing fixtures
```ts
// Fixtures: tests/tests/fixtures/voter/{resultsPage,entityDetails}.fixture.ts (all verified present)
await resultsPage.selectEntityTab('alliances');
const allianceA = resultsPage.getEntityCards().filter({ hasText: /Alliance A/i }).first();
// in-card children (cardContents.alliance = ['children']) are the member-org subcards
const memberSubcards = allianceA.getByTestId(testIds.voter.results.cardSubcard);
// EPERM-03 presence rider:
await expect(page.getByTestId(testIds.voter.results.allianceSection)).toBeVisible();
// open the alliance drawer, assert EPERM-04 tab control = exactly ['info','children']
await resultsPage.openEntityDetailsForCard(allianceA);
await entityDetails.expectTabs(['info', 'children']);   // NOT 'opinions'
await entityDetails.selectTab('children');
const members = entityDetails.getMemberCards();         // expected OR-AA / OR-AB
// clickable in-card child → opens that member org's own drawer (D-03)
```

### Opinions-tab drawer display of a new opinion type (EQTYP-01/02)
```ts
// entityDetails.expectQuestionDisplay already handles the voter-vs-entity matrix
await entityDetails.selectTab('opinions');
await entityDetails.expectQuestionDisplay(/Base opinion 7 — Multi-choice/i, { /* voter multi-select vs entity */ });
```

## State of the Art

| Old (pre-129) | Current (post-129) | When | Impact on 130 |
|---------------|--------------------|------|---------------|
| No number/multi-choice opinion in seed; walk radio-only | Seed has number+multi-choice in MAIN category; walk type-aware | 129-08 (2026-07-18) | 130 asserts *behaviour*, not answering |
| multipleText info-item asserted ABSENT (13) | asserted PRESENT (14) + keyword reads | 129-08 | EQTYP-03 voter side already done; only candidate round-trip net-new |
| Alliances unrendered (UNBLK-06) | `sections` includes 'alliance'; card+gauge+subcards render | 129-08 | 130 adds drawer/children/tab-control depth |
| Nominations journey step commented out | `/nominations` loader fetches question data (UNBLK-04) | 129-03 | 130 authors dedicated spec |

## Runtime State Inventory

Not applicable — this is a greenfield test-authoring phase (new spec files + small fixture additions), not a rename/refactor/migration. No stored data, live-service config, OS-registered state, secrets, or build artifacts carry a renamed string. The only "state" is the shared `app_settings` JSONB singleton, which the leaf specs read-only (no clobber) via `data-setup-base`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node/Playwright + browsers | Running any spec | ✓ (repo standard) | as installed | `yarn playwright install` |
| Local Supabase stack | seed + app data (`db:reset`, :54321/54323) | ✓ (repo dev flow) | Supabase CLI | none — blocking |
| Frontend dev server on :5173 | E2E target (no Playwright webServer) | ✓ via `yarn dev` | — | none — blocking (must be fresh per D-05 run) |
| `e2e/base` seed | all three specs | ✓ (`yarn db:seed --template e2e/base`, 25 questions) | — | none |

**Prereqs for the D-05 3× gate (per project memory + 128 D-07):** one fresh dev server on :5173 (stale server steals the port — kill first), clean DB via `yarn db:reset` before each run, and the 502-wedge recovery cycle on hand. "Did not run" counts as failure.

**Missing dependencies with no fallback:** none currently missing — the -gsd repo runs E2E clean on host Vite + local Supabase (per project memory `project_gsd_repo_e2e_runs_clean`), no Docker/LocalStack.

## Validation Architecture

> `workflow.nyquist_validation` is not set to `false` in `.planning/config.json` → section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (`@playwright/test`) |
| Config file | `tests/playwright.config.ts` (serial project DAG) |
| Quick run command | `cd tests && npx playwright test --project=voter-alliance -c ./playwright.config.ts` (single leaf) |
| Full suite command | `yarn test:e2e` (fresh :5173 + clean DB) |

### Phase Requirements → Test Map
| Req | Behavior | Test Type | Automated Command | File Exists? |
|-----|----------|-----------|-------------------|-------------|
| EQTYP-01 | multi-choice matching + drawer display + candidate type-specific | e2e | `--project=voter-journey` + `--project=candidate-journey` | ✅ (extend) |
| EQTYP-02 | number-scale boundary ranking + drawer display | e2e | `--project=voter-journey` | ✅ (extend) |
| EQTYP-03 | candidate multipleText fill + preview round-trip | e2e | `--project=candidate-journey` | ✅ (extend) |
| EFLOW-02 / EPERM-03 / EPERM-04 | alliance card + member drawer + clickable children + tab control | e2e | `--project=voter-alliance` | ❌ Wave 0 (new file + project) |
| /nominations (UNBLK-04 rider) | all-nominations entities render | e2e | `--project=voter-nominations` | ❌ Wave 0 (new file + project) |

### Sampling Rate
- **Per task commit:** the single affected leaf project (`--project=voter-alliance`, etc.) against fresh :5173 + `db:reset`.
- **Per wave merge:** the affected journey/leaf projects together.
- **Phase gate (D-05):** full `yarn test:e2e` green 3× (fresh server + clean DB each), before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `tests/tests/specs/voter/voter-alliance.spec.ts` + `voter-alliance` project entry — EFLOW-02/EPERM-03/EPERM-04
- [ ] `tests/tests/specs/voter/voter-nominations.spec.ts` + `voter-nominations` project entry — UNBLK-04 rider
- [ ] Net-new fixture: value-parametrized `answerNumberScale(question, value)` (voter) — proven by smoke/probe (SC4)
- [ ] Net-new fixture: candidate `answerMultipleText` fill + `candidateJourneyConstants` fill-map entry for `test-qu-info-multipleText` — proven before candidate round-trip assertion
- [ ] (verify) thin alliance-card/member helpers only if `resultsPage`/`entityDetails` don't already cover the clickable-child click-through

## Security Domain

This is test-only code with no product surface, so no ASVS product control is added or modified. Relevant considerations:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | indirect | The UNBLK-02 D-07 constraint (out-of-range multi-choice never persisted into matching) is a *product* invariant verified in Phase 129; Phase 130 may assert it observationally but does not implement it |
| V6 Cryptography | no | none |
| Test data / PII | note | Fixtures use synthetic seed identities only (`test-e2e-base-*`); no real PII. Do not introduce real emails/tokens. |

No STRIDE-relevant new attack surface — the specs drive the same UI a voter/candidate already drives. `security_enforcement` gate satisfied by "test-only, no product mitigation added."

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The voter-journey D-10 alliance step covers *presence* only, not the member-orgs *drawer* / clickable children / tab control (so those are net-new for voter-alliance) | Current-State Delta EFLOW-02 | LOW — grep of voter-journey shows only section/card/gauge/subcard *visibility*, no drawer-open or tab assertion; but the planner should re-read lines 986-1005 to confirm no drawer step was added |
| A2 | `entityDetails.getMemberCards()` / `openEntityDetailsForCard` already support the alliance entity type (built for orgs) with no extension | Code Examples, Wave 0 | LOW — fixtures are entity-type-generic; if alliance drawer differs, a thin helper is needed. Verify at build time with a probe |
| A3 | A value-parametrized `answerNumberScale` is needed because the boundary test wants min/mid, not just the walk's max | Pitfall 3, Wave 0 | LOW — could instead reuse `answerMode:'min'`; either way an isolated boundary answer is required |
| A4 | The candidate multipleText round-trip is genuinely unbuilt (fill-map omission is deliberate, not a stale comment) | Current-State Delta EQTYP-03 | LOW — `candidateJourneyConstants.ts:78` states the omission explicitly; confirmed no `answerMultipleText` in candidate fixtures |

**Every ASSUMED item above is a "verify at build time" flag, not an unverified fact** — each is backed by a same-session grep and needs only a spot-confirm, not user decision. There are no compliance/retention/security assumptions requiring user sign-off.

## Open Questions

1. **Does EPERM-03 alliance-presence need re-asserting in voter-alliance, given voter-journey's D-10 step already asserts it?**
   - What we know: D-10 asserts `allianceSection` visible in results (satisfies the criterion in principle).
   - What's unclear: whether the operator wants the criterion *tagged* in the dedicated spec for traceability.
   - Recommendation: Re-assert `results.sections[]` alliance presence as the first `test.step` of `voter-alliance.spec.ts` (cheap, shares fixtures) so the criterion is self-contained in the alliance spec — matches D-03's stated scope.

2. **Boundary-matching granularity for EQTYP-02 (Claude's discretion).**
   - What we know: seed has POLAR_MAX(10)/POLAR_MIN(0) candidates on the number question.
   - What's unclear: how many ranking cells to assert (min-first only, or min-first + max-last + mid-intermediate).
   - Recommendation: Assert at least the two extremes (voter-at-min → min-candidate ranks above max-candidate) plus one mid value for the "intermediate ranking" the requirement names; keep it isolated so it doesn't perturb the journey's existing ranking assertions.

## Sources

### Primary (HIGH confidence — read/grep this session, authoritative)
- `.planning/phases/130-.../130-CONTEXT.md` — user decisions D-01..D-05
- `.planning/v2.14-E2E-COVERAGE-PLAN.md` — deferred-build entries + serial-DAG anchor facts + non-additive ripple table
- `.planning/phases/129-.../129-07-SUMMARY.md`, `129-08-SUMMARY.md`, `129-VERIFICATION.md` — exactly what 129 shipped
- `tests/tests/specs/voter/voter-journey.spec.ts` (grep 79-1023), `tests/tests/specs/candidate/candidate-journey.spec.ts` (grep 200-540)
- `tests/tests/fixtures/voter/{resultsPage,entityDetails}.fixture.ts`, `tests/tests/utils/testIds.ts`, `tests/tests/utils/candidateJourneyConstants.ts`
- `tests/playwright.config.ts` (leaf-project pattern lines 233-315)
- `packages/dev-seed/src/templates/e2e/base.ts` (alliance settings + new opinion questions)
- `apps/frontend/src/lib/components/questions/NumberScaleInput.svelte` (D-03 keyboard contract)
- `.planning/REQUIREMENTS.md` (EQTYP/EFLOW/EPERM rows + traceability)

### Secondary / Tertiary
- Project memory: `project_gsd_repo_e2e_runs_clean`, `project_e2e_execution_devserver_prereq`, `project_phase124_e2e_blocker` (env prereqs + 502-wedge) — MEDIUM (operator-authored, recent)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; all fixtures/locators verified present on disk.
- Architecture (leaf-project wiring): HIGH — `tests/playwright.config.ts` read; two exemplars (`voter-dark-mode`, `voter-journey-mobile`).
- Current-state delta: HIGH — every row grounded in a spec/summary read this session; this is the highest-value and most load-bearing finding.
- Pitfalls: HIGH — drawn from 129 SUMMARYs + project memory (502-wedge, did-not-run rule).

**Research date:** 2026-07-19
**Valid until:** ~2026-08-02 (stable — no external moving parts; only risk is a further edit to the journey specs before 130 executes, which the planner mitigates by re-reading disk).
