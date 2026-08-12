# Phase 118: E2E Coverage Audit + Coverage Plan - Research

**Researched:** 2026-06-14
**Domain:** Playwright E2E test catalog inventory + coverage-mapping methodology for the v2.14 E2E workstream
**Confidence:** HIGH (all findings verified by direct file inspection of the live catalog)

## Summary

Phase 118 is a planning/audit deliverable — no test code is written. Its execution must produce a
per-requirement coverage map (covered / partial / missing) for every EPERM-01..11, EFLOW-01..11, EQTYP-01..03,
plus a build list (new spec files, existing specs to extend, seed changes, semantic steps, fixtures/helpers)
covering the whole v2.14 E2E workstream including the deferred end-cluster (Phases 129-130). The deliverable is
an operator approval gate.

The single most important factual correction this research surfaces: **the canonical file paths in CONTEXT.md
and the `--likert-only` docstring are STALE.** The E2E suite lives at the **repo-root `tests/` directory, NOT
`apps/frontend/tests/`**. The voter fixture is `tests/tests/fixtures/voter/voter-journey.fixture.ts` (not
`tests/tests/fixtures/voter.fixture.ts`). The audit MUST use the real paths below or it will inventory the
wrong (nearly empty) directory.

The second highest-leverage finding (A1): **`--likert-only` is already effectively dead.** It is a CLI-only
filter (`packages/dev-seed/src/cli/likert-only.ts`) with **zero consumers in any spec, setup, or fixture**. The
current `voter-journey.fixture.ts` answer loop already handles boolean / categorical / number opinion types
natively (it reads the per-question option count and picks by index, not by a Likert-only assumption). The
legacy manual walk it was meant to deprecate (`walkToQuestion` in `voterNavigation.ts`) is **also unused**.
Removing `--likert-only` with no backward-compat shim is therefore low-risk and almost entirely a deletion
exercise — the audit should confirm this and pin the exact deletion surface.

**Primary recommendation:** Structure the coverage-plan deliverable as a per-requirement table (covered /
partial / missing + confirming-or-target spec path) followed by per-spec semantic-step build blocks, grounded
in the factual catalog map in this document. Treat the catalog map below (§E2E Catalog Inventory) as the audit's
verified starting point — the audit re-runs/inspects to confirm/refute, but does not start from zero.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Audit methodology**
- **A5 — Verify, don't assume.** Re-run/inspect the cited specs and classify covered/partial/missing per
  requirement. Default = verify ALL, including the 6 "already covered" items (EPERM-01/03/08/11, EFLOW-03/05).
- **A9 / 118.3 — Semantic-step granularity.** One behaviour-level block per new/edited spec ("use e2e/base →
  results all-answered polar-max → open candidate X > opinions → expect …"), behaviour not selectors. Enough
  that 120-122/130 execution needs no further discovery. Operator re-checks the deliverable before execution.
- **118.3 — Already-covered treatment.** List the 6 confirmed-covered requirements with the confirming spec
  path + a one-line "confirmed covered, no new code" verdict, so the map is complete.
- **118.4 — Pin extension scopes** for the partials: EPERM-06/07/09 and EFLOW-01/04/08/09 — state exactly what
  each extension adds so spec phases don't re-scope.

**Cross-cutting (carried into the plan as constraints on downstream phases)**
- **A1 (OPERATOR OVERRIDE) — Kill `--likert-only` entirely, no backward-compat shim.** The audit MUST assess
  whether `--likert-only` can be removed completely, preferred direction being to make the **voter fixtures
  handle non-Likert opinion question types** (boolean/categorical/number) natively rather than seeding them out.
- **A3 — Behaviour via fixtures, not selectors** (enforced by `typecheck:tests` + `no-restricted-locators`).
- **A4 — Extend an existing perm/spec over adding a new one** where the NOTEs direct it; the audit pins each case.
- **A6 — Per-phase live-E2E green gate** at the end of each spec phase (120/121/122/130), not just at 132.
- **A7 — New spec files** follow the post-Phase-93/94 reorganised catalog layout; the 118 plan lists exact paths.
- **A8 — Fixtures-first is a hard gate** (no spec authored before its fixtures exist + typecheck + smoke).
- **119.3 (note) — Editing existing specs' rigid expectations is ALLOWED** when a seed/fixture change ripples;
  surface non-additive seed changes but spec edits are not off-limits.
- **119.4 (OPERATOR OVERRIDE) — Build the deferred-cluster fixtures alongside the unblockers (Phase 129)**, not
  deferred piecemeal to 130. Generic helpers still land in 119 if cheap.
- **122.2 (note) — Test the Idura OIDC flow ONLY; drop Signicat (outdated).** Stub/mock the IdP; reuse the
  Phase-91 / `idura-ftn-auth-plan.md` stub seam.
- **129.2 — Separate UI-SPEC** for the new input components + alliance card, grounded in existing
  Button/Input/EntityCard conventions.

**Deferred-build marking (Success Criterion 3)**
- The plan MUST explicitly mark EQTYP-01/02/03, EFLOW-02 (alliance card + member-orgs drawer), the
  nominations-route spec, and the EPERM-03 alliance-presence slice as **deferred-build → end cluster
  (Phases 129-130)** — planned now, built after the new features land.

### Claude's Discretion
- Exact format/structure of the coverage-map markdown deliverable (table vs per-requirement sections), as long
  as it satisfies the four success criteria and is reviewable at semantic-step depth.
- How deeply to re-run vs statically inspect each cited spec during the audit.

### Deferred Ideas (OUT OF SCOPE)
- RUNES (123-124) and TYPE/svelte-check (125-128) are separate, independent workstreams — NOT in scope of this
  audit or its coverage plan.
- All actual fixture/spec/seed code — built in 119-122, 129-130; this phase only plans it.
</user_constraints>

## Project Constraints (from CLAUDE.md)

- **E2E hard rule (cardinal failure):** No task may complete while any E2E test is failing. No "known-flaky"
  exemptions — a flaky test is a real defect to be root-caused, not skipped/retried/annotated. A "did not run"
  E2E (cascade failure) counts as a failure. Prefer running the **whole** suite (`yarn test:e2e`) for interim
  verification.
- **Seed/template commands:** `db:*` touches only the database; `dev:*` drives the full stack. Canonical e2e
  seed chain: `yarn db:reset && yarn db:seed --template e2e/base`. The `--likert-only` caveat in CLAUDE.md is
  the very thing A1 removes — **the plan must also delete the `--likert-only` references from CLAUDE.md** (the
  "Note on `--likert-only`" paragraph + the "Yarn arg-forwarding caveat" paragraph + the seeding-table row).
- **Accessibility:** WCAG 2.1 AA required (relevant for new input components in 129/130).
- **Localization:** all user-facing strings multi-locale (relevant if new question-type inputs add labels).
- **Svelte 5 context rules:** new fixtures interacting with reactive accessors must read via `ctx.X` direct
  access, not destructure (informational; fixtures are Playwright-side, not Svelte components).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Coverage audit (inventory + classify) | Planning doc (`.planning/`) | — | Pure analysis; no code tier touched |
| Spec authoring | E2E suite (`tests/`) | Frontend (testIds) | Specs assert app behaviour via fixtures |
| Fixture/helper logic | E2E suite (`tests/tests/fixtures`,`/helpers`,`/utils`) | — | All prep + view manipulation lives here (A3/A8) |
| Seed data | dev-seed (`packages/dev-seed/src/templates`) | E2E setup (`tests/tests/setup`) | Templates author rows; setup chains seed them |
| `--likert-only` removal | dev-seed CLI + CLAUDE.md docs | E2E utils (`voterNavigation.ts`) | CLI flag + dead helper + doc references |
| New question-type inputs (UNBLK) | Frontend (`apps/frontend/src/lib`) | matching pkg + dev-seed | 129 build; product behaviour |
| Bank-auth (Idura) | Supabase Edge Function | Frontend OIDC routes | 122 spec hits the Edge Function directly |

<phase_requirements>
## Phase Requirements

Phase 118 owns **no** requirement IDs (it is the operator-mandated structural audit-first gate). Its deliverable
PLANS the closure of every E2E requirement below. The table maps each requirement to its downstream phase and
the research support this document provides.

| ID | Owning Phase | Research Support (this doc) |
|----|--------------|------------------------------|
| EPERM-01..11 | 120 (EPERM-03 alliance slice → 130) | §E2E Catalog Inventory + §EPERM Coverage Map |
| EFLOW-01,03,04,05,06,07,08,09,11 | 121 | §EFLOW Coverage Map (voter-journey.spec is the partial-coverage anchor) |
| EFLOW-10 | 122 | §Bank-Auth Stub Seam |
| EFLOW-02 | 130 | §UNBLK / deferred-cluster |
| EQTYP-01,02,03 | 130 | §EQTYP / new question types in seed |
| UNBLK-03 | 119 | §Seed Templates (default seed) |
| UNBLK-01,02,04,05,06 | 129 | §UNBLK / deferred-cluster |
| HARDN-01 | 131 | §Deferred flake todos (out of audit's classify scope; listed for completeness) |
| HARDN-02 | 132 | Milestone-close green gate |
</phase_requirements>

## CRITICAL CORRECTION: Catalog Paths

> The audit deliverable's credibility depends on inventorying the correct directory. CONTEXT.md and the
> `--likert-only` docstring both cite stale paths.

| Reference in CONTEXT.md / docstrings | ACTUAL path (verified) |
|--------------------------------------|------------------------|
| `apps/frontend/tests/` | `tests/` (repo root) |
| `tests/tests/fixtures/voter.fixture.ts` | `tests/tests/fixtures/voter/voter-journey.fixture.ts` |
| `apps/frontend/tests/tests/fixtures/voter.fixture.ts` | (same as above) |

`apps/frontend/tests/` contains only two unrelated unit-ish specs (`sample.spec.ts`,
`password-validation.spec.ts`) — NOT the E2E suite. [VERIFIED: filesystem `find`]

The Playwright config is `tests/playwright.config.ts`; run command is `yarn test:e2e` (root) which targets it.

## E2E Catalog Inventory

> The factual backbone of the audit. Every spec/fixture/helper below was read or enumerated this session.
> [VERIFIED: filesystem `find` + file reads]

### Spec files (`tests/tests/specs/`)

**Journey specs (the workhorses for EFLOW/EPERM partial coverage):**
| Spec | What it asserts (one-line) |
|------|----------------------------|
| `voter/voter-journey.spec.ts` | The full voter walk: static pages → intro → 2-election select → hierarchical constituency → questions-intro min-answers gate → category intro/skip → Likert5/Likert4/Likert7/Categorical/Boolean answers → back-nav answer survival across `{#key question.type}` boundary → results election picker → entity tabs (cands/parties) → card content (info text, 4 score gauges, election symbol) → org matching (show-all/collapse) → ranking contract (polar-max first, polar-min last, partial mid, hidden absent) → candidate detail drawer info-tab (13 info-items) + opinions-tab voter-vs-entity 4-case matrix → org drawer tabs+members → text filter → filter dialog (party/pick-multiple/numeric, intersection, reset) → feedback dialog 3-cycle. **Nominations step is COMMENTED OUT (UNBLK-04 bug).** |
| `voter/cold-entry-dataroot.spec.ts` | Direct-URL/cold entry `dataRoot` `#version`-bridge staleness (Spike 024 regression guard) |
| `candidate/candidate-journey.spec.ts` | 22-step candidate walk: public pages → registration email (Mailpit) → password set → ToU → home tasks → logout TimedModal → forgot-password → login error/success → profile (static + filtered questions + required badge) → portrait upload error/valid → fill info (incl. required gating) → questions overview → answer opinion questions (hero emoji, choice, info round-trip, edit) → completion → preview → final logout |
| `candidate/candidate-bank-auth.spec.ts` | Idura/Signicat identity-callback Edge Function: synthetic JWE id_token → keys-configured vs not-configured paths → magic-link session → CORS → reject missing/invalid token. **Opt-in (`PLAYWRIGHT_BANK_AUTH=1`), calls Edge Function directly (no real IdP redirect).** |

**Perm specs (19) (`tests/tests/specs/perm/`):**
| Spec | Settings branch asserted |
|------|---------------------------|
| `perm-1e1cg1co` | single election + single CG + single CO → no selectors, lands on questions |
| `perm-2e-shared` | 2 elections sharing constituencies; EL1-only vs both |
| `perm-2e-asymmetric` | 2 elections, asymmetric CGs; constituency picker auto-implication |
| `perm-startfromcg` | `elections.startFromConstituencyGroup` (constituency-first) |
| `perm-disjoint-1co` | disjoint CGs per election; continue gating |
| `perm-disable-election-1co` | `elections.disallowSelection` + 1 shared CO → no selectors |
| `perm-disable-election-2co` | `disallowSelection` + 2 COs → no election selector, constituency shown |
| `perm-not-located-2e2cg` | direct `/results` with nothing picked → bounce-redirect chain, query-param preservation |
| `perm-disable-voter-app` | `access.voterApp` off → voter maintenance, candidate available |
| `perm-disable-candidate-app` | `access.candidateApp` off → candidate maintenance, voter available |
| `perm-answers-locked` | `answersLocked` across login/authenticated surfaces |
| `perm-hide-hero` | `candidateApp.questions.hideHero=true` → no hero img/span |
| `perm-header-show-feedback` | `header.showFeedback` → feedback button on intro, opens form |
| `perm-header-show-help` | `header.showHelp` → help button → About |
| `perm-hide-all-nominations` | `showAllNominations=false` → /nominations 307→Home |
| `perm-hide-if-missing-answers` | `entityDetails`/results `hideIfMissingAnswers[type]` |
| `perm-hide-election-tags` | `showElectionTags=false` → election-tag absent on /questions |
| `perm-hide-category-tags` | `showCategoryTags=false` → category-tag absent on /questions |
| `perm-disable-allow-open` | `customData.allowOpen` per-question on candidate-comment; voter-side walk |
| `perm-per-app-notifications` | per-app notification routing (voter vs candidate) |
| `perm-missing-nominations` | voter selects 2 elections → missing-nominations modal |
| `perm-localisation-positive` | en/fi/sv localisation walk + voter cross-check |

**Other projects:** `a11y/a11y-smoke`, `perf/performance-budget`, `visual/visual-regression`.

### Fixtures (`tests/tests/fixtures/`)

| Fixture | Surface |
|---------|---------|
| `voter/views.ts` | **Composition root** — `base.extend` exposing `resultsPage`, `entityFilters`, `entityDetails`, `voterHomePage`, `voterIntroPage`, `voterQuestionsPage`. Specs import `{ test, expect }` from here. |
| `voter/voter-journey.fixture.ts` | `voterJourneyTest` with `answeredVoterPage` (walks to /results, answers per `answerMode: 'min'/'max'`, optional `answerCount` cap) + `locatedVoterPage` (parks on /questions intro). **Already handles boolean/categorical/number via per-question scoped option count.** |
| `voter/resultsPage.fixture.ts` | `getEntityCards`, `selectEntityTab`, `selectElection`, `openEntityDetailsForCard` |
| `voter/entityFilters.fixture.ts` | text filter + filter dialog (`getFilters`, `getFilter`, per-filter `setSelection`/`setNumberRange`, `reset`/`close`, badge). Rigid (no soft/try-catch). |
| `voter/entityDetails.fixture.ts` | drawer tabs (`selectTab`/`expectTabs`), `expectInfoItem`, `expectQuestionDisplay` (voter-vs-entity matrix w/ numSelected + infoText), `getMemberCards`. Rigid. |
| `voter/minimalVoterResultsPage.fixture.ts` | minimal results landing |
| `voter/voterHomePage / voterIntroPage / voterQuestionsPage / voterNavFixture` | page-object fixtures (`goToPage`/`clickStart`/`expectPageVisible`) |
| `candidate/*` (13) | `candidateHomePage`, `candidateLoginPage`, `candidateProfilePage`, `candidateQuestionPage`, `candidateQuestionsOverviewPage`, `candidatePreviewPage`, `candidateForgotPasswordPage`, `candidatePasswordSetter`, `candidateTermsOfUsePage`, `candidateLogoutButton`, `candidate-journey.ts`, `perm-l10n.ts` |
| `shared/*` | `emailBucket.fixture` (Mailpit), `feedbackDialog.fixture`, `langSelectorFixture`, `multilingualTextFieldFixture` |

### Helpers / utils

- `helpers/`: `index.ts`, `navigation.ts`, `select.ts`, `settle.ts`, `timeouts.ts` (central TIMEOUTS buckets).
- `utils/`: `buildRoute.ts` (locale-aware named-route builder), `testIds.ts` (central testId registry),
  `voterNavigation.ts` (`navigateToFirstQuestion` USED by perm specs; `walkToQuestion`/`waitForNextQuestion`/
  `clickThroughIntroPages`/`walkToQuestionsIntro` UNUSED — deletion candidates), `candidateJourneyConstants.ts`,
  `missingNominations.ts`, `supabaseAdminClient.ts`, `testCredentials.ts`, `testsDir.ts`, `voterIntro.ts`.

### Project chain (`tests/playwright.config.ts`) — A7 critical context

The config uses Playwright **project dependencies** in a strict serial DAG. Every spec is its own project with
a `data-setup-*` → spec → `data-teardown-*` triad. The perm chain runs **sequentially** (each
`data-setup-perm-X` `dependencies: [previous perm spec]`) to avoid DB contention. Key implication for A7: a
**new spec file is not enough** — each new spec needs (a) a new project entry, (b) usually a setup/teardown
project pair if it needs its own seed, and (c) correct `dependencies` wiring into the serial chain. The 118 plan
MUST specify project-config wiring per new spec, not just the spec file path. [VERIFIED: config read]

Per-app gates (A6): the `voter-journey` and per-perm projects each run at the end of their phase as the green
gate. The new EPERM/EFLOW specs slot into the existing serial chain.

## The `--likert-only` Removal (A1) — Deletion Surface

> Highest-leverage cross-cutting finding. [VERIFIED: grep across repo + file reads]

### What `--likert-only` does
`packages/dev-seed/src/cli/likert-only.ts` exports `applyLikertOnlyFilter(template)`: a post-`resolveTemplate`
in-place mutation that filters `template.questions.fixed[]` to keep ALL info questions + only OPINION questions
with `type === 'singleChoiceOrdinal'`. Non-ordinal opinion questions (boolean / singleChoiceCategorical /
number / text under an opinion category) are dropped. Wired into the CLI via `seed.ts` + `help.ts` + the
package `index.ts` barrel; unit-tested in `packages/dev-seed/tests/cli/likert-only.test.ts`.

### Why it exists (now obsolete)
Its docstring says the `answeredVoterPage` voter fixture "iterates Likert-only opinion questions and cascades
into 16 voter-app test failures when it encounters a non-Likert opinion question." **This is no longer true.**
The current `voter-journey.fixture.ts` answer loop:
- scopes the option locator to the current question id (`question-choice` + `name=questionChoices-<id>`),
- reads `choiceCount = currentChoices.count()`,
- picks `pickIndex = answerMode === 'min' ? 0 : choiceCount - 1`,
- and Skips (`nextButton`) when `choiceCount === 0` (text/number rendering).

So it already answers Likert5/4/7, Categorical, and Boolean opinion questions correctly — and the
`voter-journey.spec.ts` explicitly walks Base opinion 4 (Categorical) and Base opinion 5 (Boolean) **as opinion
questions** today, passing. [VERIFIED: voter-journey.spec.ts lines 585-596, 631-658]

### Consumers — NONE in the live suite
- **No spec** imports or invokes `applyLikertOnlyFilter` or passes `--likert-only`. [VERIFIED: grep]
- **No setup** uses it — `setupFromTemplate.ts` explicitly states `likertOnly` is **not supported** ("the base
  dataset is authored to not need the likert-only filter"). [VERIFIED: file read]
- The legacy manual walk the flag was meant to deprecate (`walkToQuestion` in `voterNavigation.ts`, with a
  `NOTE: a --likert-only seed modifier is planned that would deprecate this manual walk`) is **itself unused**
  by any spec. [VERIFIED: grep] So are `waitForNextQuestion`, `clickThroughIntroPages`, `walkToQuestionsIntro`.

### Removal surface the audit must pin (deletion-only, no shim)
| File | Action |
|------|--------|
| `packages/dev-seed/src/cli/likert-only.ts` | DELETE |
| `packages/dev-seed/tests/cli/likert-only.test.ts` | DELETE |
| `packages/dev-seed/src/cli/seed.ts` | remove `--likert-only` flag parsing + `applyLikertOnlyFilter` call |
| `packages/dev-seed/src/cli/help.ts` | remove `--likert-only` from help text |
| `packages/dev-seed/src/index.ts` | remove `applyLikertOnlyFilter` / `LikertOnlyFilterStats` exports |
| `packages/dev-seed/tests/cli/help.test.ts` | update expected help text (drop `--likert-only` line) |
| `tests/tests/utils/voterNavigation.ts` | remove the `--likert-only` NOTE; consider deleting unused `walkToQuestion`/`waitForNextQuestion`/`clickThroughIntroPages`/`walkToQuestionsIntro` (separate hygiene call — verify each is unused first) |
| `tests/tests/setup/shared/setupFromTemplate.ts` | update the docstring (drop the `likertOnly` paragraph) |
| `CLAUDE.md` | remove the "Note on `--likert-only`" paragraph, the "Yarn arg-forwarding caveat" paragraph, and the `--likert-only` row in the seeding table |
| `packages/dev-seed/README.md` + `tests/README.md` | scrub `--likert-only` mentions |

**Audit verdict to record:** `--likert-only` can be removed completely with NO backward-compat shim and NO
fixture change required (fixtures already handle non-Likert types). This is a pure deletion + doc-scrub. Lands
in Phase 119 alongside the seed work (per A1 ripple note: 119 fixtures / 119.3 / 130.4 seed).

## Seed Templates

> [VERIFIED: filesystem + base.ts grep] `packages/dev-seed/src/templates/`

### `e2e/base` (`templates/e2e/base.ts`, ~1800 lines)
The canonical E2E dataset. `externalIdPrefix: ''` (pre-writes literal `test-e2e-base-` external_ids).
Multi-election (Regional EL-Reg + Municipal EL-Mun), hierarchical constituencies
(CG-Reg→{co-reg-n,co-reg-s}, CG-Mun→{co-mun-ne/nw/se/sw}). Opinion categories: Base + Opt-A + Opt-B +
regional-only + per-question-filtered. Candidates include polar-max, polar-min, partial-answer (CA-AA-Special),
and a hidden candidate (terms_of_use_accepted absent). Parties AA/AB/BA/BB/C, Alliance A.

**Question types ALREADY in base** [VERIFIED: base.ts line grep]:
- **Info questions:** multipleChoiceCategorical, singleChoiceCategorical, text, text-longText, number, boolean,
  date, multipleText (the multipleText info item is the ONE intentionally omitted from the journey assertion —
  "frontend input not yet implemented", UNBLK-01).
- **Opinion questions:** singleChoiceOrdinal (Likert5/4/7), singleChoiceCategorical (Base opinion 4), boolean
  (Base opinion 5).

**Question types MISSING from base (the new-feature gaps):**
- **number-scale OPINION** (UNBLK-05 / EQTYP-02) — no number-type opinion question exists.
- **multiple-choice categorical OPINION** (UNBLK-02 / EQTYP-01) — singleChoiceCategorical opinion exists, but
  the *multiple*-choice categorical opinion variant does not.
- **multipleText answer round-trip** (UNBLK-01 / EQTYP-03) — multipleText info question exists in seed but its
  frontend input is unimplemented (asserted-absent in journey).

So the 130 seed additions (per 130.4 / 119.4-override → built in 129) are: a number-scale opinion question, a
multipleChoiceCategorical opinion question, and enabling the multipleText round-trip. These are **additive**
where possible; if adding opinion questions changes the journey's hard-coded counts (4 score gauges, category
counts, answer-count gate "Answer 4"), that ripple is **non-additive** and 119.3 (operator-allowed spec edits)
applies — surface it.

### Perm templates (`templates/e2e/perm/*.ts`)
One template per perm spec, each carrying its own `e2e-perm-<short>` externalIdPrefix and a matched
setup/teardown in `tests/tests/setup/perm/`. `templates/e2e/perm/shared.ts` holds common building blocks.
Extension specs (EPERM-06/07/09 etc.) that need a settings tweak either extend an existing perm template or add
a new one — the audit pins each per A4 (the NOTEs direct: EPERM-09 "extend the survey popup perm", EFLOW-01
"extend the voter-journey filter coverage", EFLOW-04 "extend subMatch").

### `default` template (UNBLK-03)
`templates/default.ts` + `templates/defaults/*-override.ts`. UNBLK-03 is a tooling fix: `yarn db:seed:default`
must produce a valid dataset (parties present, candidates tab populated, consistent naming). Lands in Phase 119,
NOT 118. The audit only needs to NOTE that UNBLK-03 is a seed-tooling fix (not an E2E coverage item) so the
coverage map doesn't try to map a spec to it.

## Bank-Auth Stub Seam (Phase 122, EFLOW-10)

> [VERIFIED: candidate-bank-auth.spec.ts + idura-ftn-auth-plan.md read]

The Phase-91 stub seam already exists and is the seam to reuse: `candidate-bank-auth.spec.ts` does NOT redirect
to a real IdP. It:
1. Generates synthetic RSA key pairs (RSA-OAEP-256 enc + RS256 sig) via `jose`.
2. Builds a JWE-encrypted id_token mirroring the provider's format (`buildTestIdToken`).
3. POSTs directly to the `identity-callback` Edge Function (`${SUPABASE_URL}/functions/v1/identity-callback`).
4. Asserts candidate creation, app_metadata identity_provider fields, magic-link session, CORS, and
   reject-paths (missing/invalid token).

It is **opt-in** (`PLAYWRIGHT_BANK_AUTH=1` selects the `bank-auth` project; requires Edge Functions served with
`--no-verify-jwt` and `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_ANON_KEY`). The `IDURA-TEST-RUNBOOK.md` at
`tests/IDURA-TEST-RUNBOOK.md` documents the manual run procedure.

**Idura vs Signicat (122.2 — operator: Idura only):** Per `idura-ftn-auth-plan.md`, Idura and Signicat share
the same JWE id_token + standard-claims shape and the same `jose` decryption code (Idura uses RSA-OAEP-256). The
Edge Function is being made provider-agnostic (`IDENTITY_PROVIDER` env switch, `sub`-based identity matching for
Idura). The existing spec's synthetic-token approach is already provider-shape-agnostic; the 122 audit verdict
should be: **extend/retarget the existing `candidate-bank-auth.spec.ts` to assert the Idura `sub`-based identity
match + Idura claim set (incl. `hetu`/`country`), drop any Signicat-specific assertions, keep the
direct-Edge-Function stub approach (no live IdP).** The plan must note the precondition gating (keys-configured
vs not) the existing spec already models, and whether the per-phase A6 green gate runs the opt-in bank-auth
project (it is env-gated and skipped by default in CI — the plan must decide how 122's green gate runs it
deterministically, likely by configuring the test decryption keys as documented in the spec's beforeAll).

## EPERM Coverage Map (audit starting point — VERIFY each)

> Best-guess classification from inventory; the audit confirms/refutes (A5). Confidence MEDIUM — these are
> starting hypotheses, not the final verdict.

| Req | Best-guess | Anchor spec(s) | Notes / extension scope (118.4) |
|-----|-----------|----------------|----------------------------------|
| EPERM-01 question-flow path matrix | COVERED (confirm) | voter-journey (questions-intro gate, category intro/skip), perm-1e1cg1co | NOTE "already covered" — confirm + one-line verdict |
| EPERM-02 election/constituency sequencing | COVERED (confirm) | perm-2e-shared, perm-2e-asymmetric, perm-disjoint-1co, perm-startfromcg, perm-disable-election-1co/2co, perm-1e1cg1co | NOTE "re-audit, should be covered" — broad perm coverage exists |
| EPERM-03 results-display permutations | PARTIAL | voter-journey (sections/cardContents for cand+org) | candidate/org COVERED; **alliance-presence slice DEFERRED → 130** |
| EPERM-04 entityDetails.contents tabs/type | PARTIAL | voter-journey (cand drawer info/opinions tabs; org info/children/opinions tabs) | alliance tab control untested → tie to 130 alliance; cand/org tab presence covered |
| EPERM-05 missing-data markers | PARTIAL | voter-journey (showMissingElectionSymbol candidate "—"), perm-hide-if-missing-answers | confirm per-type showMissingAnswers coverage; gap likely org/alliance markers |
| EPERM-06 candidate question media | PARTIAL | perm-hide-hero (hideHero covered) | **video NOT tested at all → new dedicated video test** (118.4 pin) |
| EPERM-07 interactiveInfo.enabled | PARTIAL | voter-journey (info button expander on Base-1) | NOTE "test in full" → popup-modal vs static-expander, both modes (118.4 pin) |
| EPERM-08 minimumAnswers gating | COVERED (confirm) | voter-journey (min-answers gate "Answer 4" + results-CTA disable/enable) | NOTE "already covered" |
| EPERM-09 survey/feedback popup | PARTIAL | perm-header-show-feedback, voter-journey feedback dialog | NOTE "extend current perm, don't add new" → placement/timing/no-double-pop/dismiss-persistence (118.4 pin) |
| EPERM-10 organizationMatching disclosure | MISSING (likely) | none found (About page disclosure text per none/answersOnly/impute) | new assertion on About page |
| EPERM-11 access gating | COVERED (confirm) | perm-disable-voter-app, perm-disable-candidate-app | NOTE "should be already covered"; confirm underMaintenance |

## EFLOW Coverage Map (audit starting point — VERIFY each)

| Req | Best-guess | Anchor spec(s) | Notes / extension scope (118.4) |
|-----|-----------|----------------|----------------------------------|
| EFLOW-01 entity filters | PARTIAL | voter-journey (text filter, party/pick-multiple/numeric dialog, intersection, reset) | NOTE extend to: multi-filter intersection (HAS some), categorical select-all/none, text-search × filter intersection (118.4 pin) |
| EFLOW-02 alliance card + member-orgs drawer | MISSING | none (alliances not rendered yet, UNBLK-06) | **DEFERRED → 130** (build alliance render in 129) |
| EFLOW-03 voter-vs-entity 4-case comparison | COVERED (confirm) | voter-journey (CA-AA-Special drawer: both/voter-only/entity-only/both-missing) | NOTE "already covered" — strong evidence at lines 938-952 |
| EFLOW-04 subMatches breakdown | PARTIAL | voter-journey (4 score gauges visible) | NOTE extend to assert *correct values* (only voter-answered categories, correct scores) for one candidate (118.4 pin) |
| EFLOW-05 skip/delete/back nav + answer-count + CTA | COVERED (confirm) | voter-journey (delete button gating, previous/back, results-CTA enable/disable) | NOTE "should be already covered" |
| EFLOW-06 mid-session locale switch | PARTIAL/MISSING | perm-localisation-positive (en/fi/sv walk) | confirm whether fi→en→fi with *answer state preserved* is asserted; likely new |
| EFLOW-07 dark-mode persist across reload | MISSING (likely) | none found | new assertion |
| EFLOW-08 user-prefs round-trip + tracking | MISSING (likely) | none found | NOTE add tracking-payload assertion (`track` + `startEvent`) under consent vs suppression; needs network/console intercept fixture (118.4 pin) |
| EFLOW-09 nav-menu contents both apps | PARTIAL | voter-journey (feedback nav item), perm-per-app-notifications | NOTE include candidate nav logged-in vs logged-out (118.4 pin) |
| EFLOW-10 bank-auth round-trip | PARTIAL | candidate-bank-auth (Edge Function direct) | retarget to Idura-only; see §Bank-Auth Stub Seam (Phase 122) |
| EFLOW-11 mobile-viewport journey | MISSING (likely) | none (visual-regression is baseline-only) | new interactive mobile-viewport voter journey |

## EQTYP Coverage Map (deferred-build → 130)

| Req | Best-guess | Notes |
|-----|-----------|-------|
| EQTYP-01 multi-choice categorical opinion | PARTIAL | voter answering of categorical opinion COVERED (Base opinion 4); NOTE check categorical AND boolean opinion answering for **candidates** (candidate-journey); the *multiple*-choice categorical opinion variant needs UNBLK-02 build first |
| EQTYP-02 number-scale opinion | MISSING (blocked) | UNBLK-05 number opinion input does not exist; build in 129, spec in 130 (answering + matching boundary) |
| EQTYP-03 text + multipleText | PARTIAL | text covered; multipleText round-trip blocked on UNBLK-01 (input unimplemented); build 129, spec 130 |

## Coverage-Plan Deliverable Shape (recommended)

> Satisfies the four success criteria at semantic-step depth (A9). Claude's-discretion area, but this structure
> is recommended.

Single markdown file in `.planning/` (e.g. `.planning/v2.14-E2E-COVERAGE-PLAN.md`). Sections:

1. **Per-requirement coverage table** (Criterion 1) — one row per EPERM/EFLOW/EQTYP with columns:
   `Req | Verdict (covered/partial/missing) | Confirming or target spec path | Action (none / extend / new / deferred)`.
   The 6 already-covered rows carry a one-line "confirmed covered, no new code" verdict + confirming spec path
   (118.3).
2. **Build list** (Criterion 2) — for each NEW or EXTENDED spec, a block with:
   - spec file path (A7 — exact path under `tests/tests/specs/...`) + the Playwright project-config wiring
     (new project entry, setup/teardown pair if its own seed, `dependencies` placement in the serial chain),
   - seed-data change (which template, additive vs non-additive flag per 119.3),
   - new/edited fixtures & helpers (A8 — must exist before the spec; name them),
   - **semantic steps** (A9 — behaviour-level: "use e2e/base → results all-answered polar-max → open candidate
     X > opinions → expect 4-case matrix values …"), enough that 120-122/130 need no further discovery.
3. **Deferred-build markers** (Criterion 3) — explicit "DEFERRED → end cluster (129-130)" tags on EQTYP-01/02/03,
   EFLOW-02, the nominations-route spec, and the EPERM-03 alliance-presence slice.
4. **Cross-cutting findings** (Criterion 4) — the `--likert-only` removal surface, the UNBLK seed additions, the
   bank-auth Idura retarget, and any non-additive seed ripples that will require editing existing specs' rigid
   expectations (119.3).
5. **Extension-scope pins** (118.4) — for EPERM-06/07/09 and EFLOW-01/04/08/09, the exact delta each extension
   adds.

The phase completes when this deliverable is written + committed; the operator re-checks it before Phase 119
execution begins (118.1 approval gate).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Voter walk to results | a fresh per-spec walk | `answeredVoterPage` / `locatedVoterPage` fixtures + `views.ts` root | Already robust against all 5 question types + render-timing hazards |
| Reaching first question in perm specs | manual click chain | `navigateToFirstQuestion` (voterNavigation.ts) | Race-based passer tolerant of disabled intermediate pages |
| Filter dialog interaction | raw locator clicks | `entityFilters` fixture | Encodes auto-expand + settle-before-count + reset-closes-dialog quirks |
| Voter-vs-entity matrix | raw radio counting | `entityDetails.expectQuestionDisplay({numSelected, infoText})` | Handles `[<id>]` prefix + entity-selected-answer dual locator |
| Bank-auth IdP | live Idura redirect | synthetic JWE + direct Edge Function call (existing spec) | Deterministic, no network flake (cardinal rule) |
| Non-Likert opinion seeding | `--likert-only` filter | nothing — fixtures handle it natively | The flag is obsolete (A1) |

**Key insight:** This suite is mature and fixture-heavy. The audit's job is to map existing coverage, not to
re-architect — almost every "new" assertion extends an existing journey/perm spec or fixture rather than
standing up new infrastructure.

## Runtime State Inventory

> This phase writes a planning doc only — no rename/refactor/migration of runtime state. However, the A1
> `--likert-only` removal it PLANS does touch shipped artifacts; recorded here for the planner's awareness.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — phase 118 writes a `.planning/` doc only | none |
| Live service config | None | none |
| OS-registered state | None | none |
| Secrets/env vars | Bank-auth (122) needs `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ANON_KEY` + optional Idura decryption JWKS — NOT changed by phase 118; informational for the 122 plan | none in 118 |
| Build artifacts | `--likert-only` removal (planned, executed in 119) deletes `dist` exports from `@openvaa/dev-seed` — a rebuild is needed after removal | none in 118 (executed in 119) |

## Common Pitfalls

### Pitfall 1: Auditing the wrong directory
**What goes wrong:** Following CONTEXT.md's `apps/frontend/tests/` path inventories two unrelated files.
**How to avoid:** Use `tests/` (repo root). See §CRITICAL CORRECTION.

### Pitfall 2: Treating `--likert-only` removal as risky
**What goes wrong:** Planning a backward-compat shim or fixture rewrite.
**How to avoid:** It is a pure deletion + doc-scrub; fixtures already handle non-Likert types. See §A1 surface.

### Pitfall 3: Naming a new spec file without wiring the Playwright project
**What goes wrong:** A new `*.spec.ts` is never run because no project matches it / it isn't in the serial chain.
**How to avoid:** Each new spec needs a project entry (+ setup/teardown pair if own seed) + `dependencies`
placement. The 118 plan must specify this per spec (A7).

### Pitfall 4: Assuming additive seed changes
**What goes wrong:** Adding an opinion question silently breaks voter-journey's hard counts ("Answer 4", 4 score
gauges, category counts) → cascade failures.
**How to avoid:** Flag every seed change additive vs non-additive (119.3); where non-additive, plan the existing
spec-expectation edits up front.

### Pitfall 5: Over-classifying "already covered" as closed without reading the spec
**What goes wrong:** A5 violated; a NOTE-claimed "covered" item is actually partial.
**How to avoid:** Re-read/inspect the cited spec; record the confirming line evidence. The maps above are
starting hypotheses, not verdicts.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `apps/frontend/tests/` E2E location | repo-root `tests/` | Phase 93/94 reorg | All audit paths must use `tests/` |
| `--likert-only` to seed out non-Likert opinion types | fixtures handle all types natively | voter fixture evolution | Flag is dead → remove (A1) |
| `walkToQuestion` manual walk | `navigateToFirstQuestion` / `answeredVoterPage` | fixture consolidation | Legacy walk unused → deletion candidate |
| Signicat OIDC | Idura (provider-agnostic Edge Function) | per idura-ftn-auth-plan | 122 tests Idura only (122.2) |

**Deprecated/outdated:**
- `--likert-only` CLI flag and `applyLikertOnlyFilter` — remove entirely.
- `walkToQuestion`/`waitForNextQuestion`/`clickThroughIntroPages`/`walkToQuestionsIntro` in voterNavigation.ts —
  unused; deletion candidates (verify each before removing).
- Signicat-specific bank-auth assertions — drop in favour of Idura.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | EPERM-10 organizationMatching disclosure is MISSING (no spec found) | EPERM map | Low — audit confirms; if a perm covers it the verdict flips to covered |
| A2 | EFLOW-07 dark-mode persist is MISSING | EFLOW map | Low — audit confirms by grep for theme/darkMode in specs |
| A3 | EFLOW-08 tracking-payload assertion is MISSING (no intercept fixture exists) | EFLOW map | Low — audit confirms |
| A4 | EFLOW-11 mobile-viewport interactive journey is MISSING (visual-regression is baseline-only) | EFLOW map | Low — audit confirms |
| A5 | EFLOW-06 answer-state-preserved across locale switch is not asserted by perm-localisation-positive | EFLOW map | Medium — must read perm-localisation-positive.spec.ts to confirm |
| A6 | The 4 EPERM "already covered" + 2 EFLOW "already covered" verdicts hold | coverage maps | Medium — A5 mandates re-reading each; voter-journey evidence is strong for EFLOW-03/05, EPERM-08 |
| A7 | `walkToQuestion` et al. are safe to delete | A1 surface | Low — grep shows no spec consumers, but verify before deleting |

These are intentionally LEFT for the audit to resolve — that IS the phase's job. Listed so the planner makes the
audit task explicitly answer each.

## Open Questions

1. **Does perm-localisation-positive assert answer-state preservation across locale switch (EFLOW-06)?**
   - What we know: it walks en/fi/sv with a voter cross-check.
   - What's unclear: whether selection/answer state is asserted preserved mid-switch.
   - Recommendation: audit reads the spec; if not, EFLOW-06 is a new/extended assertion in 121.
2. **How does the 122 green gate run the env-gated bank-auth project deterministically (A6)?**
   - What we know: the project is opt-in (`PLAYWRIGHT_BANK_AUTH=1`) and needs Edge Functions + test keys.
   - Recommendation: 122 plan configures the test decryption JWKS in beforeAll so the keys-configured path runs;
     document the run command in the phase.
3. **Which new opinion-question seed additions are non-additive (ripple into voter-journey counts)?**
   - Recommendation: 119/130 plan models adding number-scale + multipleChoiceCategorical opinion questions to a
     SEPARATE category or candidate set to keep base journey counts stable where possible; flag the rest.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| (none — phase 118 writes a planning doc) | — | n/a | — | — |

Phase 118 has no external dependencies; it inventories and writes markdown. (Downstream phases need Supabase +
dev server + Playwright browsers, already part of the project per CLAUDE.md.)

## Validation Architecture

> The deliverable is a markdown plan, not code — there is no automated test gate for Phase 118 itself. The
> validation is the operator approval gate (118.1). The plan it produces, however, must specify the test/seed
> infrastructure for downstream phases.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (E2E), config `tests/playwright.config.ts` |
| Quick run command | `yarn test:e2e --project=<project-name> --reporter=list` |
| Full suite command | `yarn test:e2e` |
| Determinism standard | 3× green (v2.10 82/2, v2.11 84/0 precedent) |

### Phase 118 Gate
- **Phase gate:** Coverage-plan deliverable written + committed; operator re-checks before Phase 119 execution.
- No automated test runs as part of 118 (audit may *inspect/re-run* existing specs to classify — that is
  research, not a gate).

### Wave 0 Gaps
- None for Phase 118 (no code). The plan it produces enumerates the downstream Wave-0 fixture/seed gaps for
  119-122/130.

## Sources

### Primary (HIGH confidence)
- `tests/tests/fixtures/voter/voter-journey.fixture.ts`, `voter-journey.spec.ts`, `views.ts`,
  `entityFilters.fixture.ts`, `entityDetails.fixture.ts` — read in full
- `tests/playwright.config.ts` — project chain enumerated
- `packages/dev-seed/src/cli/likert-only.ts`, `tests/tests/setup/shared/setupFromTemplate.ts`,
  `tests/tests/utils/voterNavigation.ts` — read in full
- `tests/tests/specs/candidate/candidate-bank-auth.spec.ts`, `candidate-journey.spec.ts` (header) — read
- `.planning/idura-ftn-auth-plan.md` — read in full
- `.planning/REQUIREMENTS.md`, `.planning/v2.14-E2E-DISCUSSION-POINTS.md`, CONTEXT.md — read in full
- `find` / `grep` enumerations of `tests/`, `packages/dev-seed/`, `--likert-only` consumers — executed

### Secondary (MEDIUM confidence)
- Best-guess EPERM/EFLOW/EQTYP classifications — derived from inventory; flagged for audit confirmation (A5)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Catalog inventory (paths, files, fixtures, project chain): HIGH — direct filesystem + file reads
- `--likert-only` dead-code finding: HIGH — grep confirms zero consumers; fixture code read confirms native
  multi-type handling
- Bank-auth stub seam: HIGH — spec + plan read
- Per-requirement coverage best-guesses: MEDIUM — starting hypotheses; the audit's explicit job is to confirm
- Seed gaps (number/multi-categorical opinion, multipleText): HIGH — base.ts type grep + journey omission notes

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (stable; the catalog is post-Phase-93/94 and the v2.13 suite is 95/95 green)
