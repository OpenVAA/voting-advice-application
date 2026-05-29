---
phase: 90-tir5-permutations-missing-nominations-warning-localisation-n
verified: 2026-05-29T00:00:00Z
status: gaps_found
score: 17/19 must-haves verified
overrides_applied: 0
gaps:
  - truth: "DynamicSettings.i18n.supportedLocales runtime override actually drives the user-facing locales list at runtime (delivers I18N-RUNTIME-01 as a behavioural surface, not merely an API surface)"
    status: failed
    reason: "applyDynamicOverride() is exported from apps/frontend/src/lib/i18n/init.ts and exercised in unit tests, but has NO production caller. apps/frontend/src/routes/+layout.ts loads appSettingsData via dataProvider.getAppSettings() (line 33) and returns it to consumers, but never invokes applyDynamicOverride(appSettingsData). At runtime _dynamicOverride remains undefined, so the exported `locales` array equals the full Paraglide compile-time superset (en/fi/sv/da/et/fr/lb — 7 entries) regardless of any app_settings JSONB override. The Stage A wiring contract D-90-10 is unmet. 90-03-SUMMARY decision #6 and 90-04-SUMMARY decision #5 BOTH explicitly acknowledge this gap as 'operator-deferred runtime gate' but the goal text claims the phase 'closes the runtime-locale-override PRODUCT-GAP (Phase 74 D-04 carry-forward)' — closure is not achieved without the production caller."
    artifacts:
      - path: "apps/frontend/src/routes/+layout.ts"
        issue: "Loads appSettingsData but never calls applyDynamicOverride(appSettingsData). No reference to '$lib/i18n/init' anywhere in this file."
      - path: "apps/frontend/src/lib/i18n/init.ts"
        issue: "applyDynamicOverride() (line 53) is dead code in production — only invoked from init.override.test.ts. JSDoc at line 30 says 'call this from +layout.ts's load() BEFORE any consumer reads locales/defaultLocale' but no such call exists."
    missing:
      - "Add `import { applyDynamicOverride } from '$lib/i18n/init';` to apps/frontend/src/routes/+layout.ts"
      - "Inside load(), after the Promise.all that resolves appSettingsData, call `if (appSettingsData && !(appSettingsData instanceof Error)) applyDynamicOverride(appSettingsData);` BEFORE the return statement"
      - "Add an integration test (Playwright or Vitest+component) that boots the layout, applies a single-locale override, and asserts the rendered <LanguageSelection /> contains 0 NavItems (or that `locales.length === 1`)"
  - truth: "Perm-localisation-positive spec successfully drives the langSelector through both directions (en→fi AND fi→en), per PERM-L10N-POS-02"
    status: failed
    reason: "langSelectorFixture.switchTo (tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts:104-107 per 90-REVIEW CR-02) waits for URL pattern `^https?://[^/]+/${locale}/`. For locale='en' this is `^https?://[^/]+/en/`. Paraglide's runtime config makes `en` the baseLocale, served from `/` (NOT `/en/`). When perm-localisation-positive.spec.ts:148 calls switchTo('en') the post-click URL is `/results` or `/` — page.waitForURL hangs until the per-test timeout. PERM-L10N-POS-02's 'switch en→fi→en' assertion will fail at runtime."
    artifacts:
      - path: "tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts"
        issue: "switchTo's URL regex is not baseLocale-aware. The Paraglide localizeUrlDefaultPattern (runtime.js:991-1012) explicitly omits the `/<locale>/` prefix when locale === baseLocale, but the fixture's regex requires it for every locale."
    missing:
      - "Make switchTo's URL regex baseLocale-aware: when locale === 'en' (or imported baseLocale), match `^https?://[^/]+/(?!(fi|sv|da|et|fr|lb)(/|$))` (URLs without a non-base-locale prefix); for other locales, keep the `^https?://[^/]+/${locale}(/|$)` shape"
      - "Cover with a unit test or a focused Playwright assertion proving switchTo('en') resolves after a switch from fi"
deferred: []
---

# Phase 90: TIR5 permutations — missing-nominations warning + localisation negative/positive — Verification Report

**Phase Goal:** Apply Phase 89-04's strict-fixtures + minimal-data perm pattern to add 3 TIR5 permutation chains (missing-nominations / localisation-negative / localisation-positive) AND close the runtime-locale-override PRODUCT-GAP (Phase 74 D-04 carry-forward) by extending DynamicSettings with an optional `i18n.supportedLocales` override threaded through the frontend i18n init.

**Verified:** 2026-05-29
**Status:** gaps_found
**Re-verification:** No — initial verification

## Verification Methodology

ROADMAP.md exposes no machine-readable `success_criteria` for Phase 90, and `.planning/REQUIREMENTS.md` does NOT register any of the IDs cited in PLAN frontmatter (I18N-RUNTIME-01, PERM-MN-01, PERM-L10N-NEG-01..03, PERM-L10N-POS-01..07, FIX-LANG-SEL-01, FIX-ML-TEXT-01). The REQUIREMENTS.md file scope ends at DETERM-15 (Phase 87) — Phase 90 IDs live only in the phase's local context (TEST-INVENTORY-REFACTOR-5.md + 90-CONTEXT.md). Must-haves are therefore drawn from the PLAN frontmatter `must_haves.truths` blocks across 90-01..04, augmented by the goal text claim about "closing the runtime-locale-override PRODUCT-GAP". The verifier rejects acceptance of API-surface-present as goal-met because the goal text explicitly says "close" and 90-CONTEXT D-90-10 names runtime engagement as the contract.

## Observable Truths

| #  | Truth | Status | Evidence |
| -- | ----- | ------ | -------- |
| 1  | DynamicSettings type accepts optional `i18n.supportedLocales` override | VERIFIED | packages/app-shared/src/settings/dynamicSettings.type.ts:121 `readonly i18n?: { ... readonly supportedLocales?: ReadonlyArray<{code, name, isDefault?}> }` per Plan 90-01 spec |
| 2  | apps/frontend/src/lib/i18n/init.ts exports applyDynamicOverride + getEffectiveSupportedLocales + live ESM `let` bindings for locales/defaultLocale | VERIFIED | init.ts:35 `_dynamicOverride`, :53 `applyDynamicOverride`, :68 `getEffectiveSupportedLocales`, :92 `export let defaultLocale`, :106 `export let locales`, :109 `recomputeDerivations()` |
| 3  | Paraglide compile-time `locales` superset is preserved (override only drops user-facing locales) | VERIFIED | init.ts:130 `_dynamicOverride ? paraglideLocales.filter(...) : paraglideLocales` — filter is applied to a copy, paraglide source unchanged |
| 4  | applyDynamicOverride is actually called from production code so the override ENGAGES at runtime (delivers I18N-RUNTIME-01 as behavioural surface, not API-only) | FAILED | grep finds applyDynamicOverride references only in init.ts (declaration + JSDoc), init.override.test.ts (5 test invocations), and zero production call sites. apps/frontend/src/routes/+layout.ts loads appSettingsData but does NOT thread it into applyDynamicOverride. See Gap #1. |
| 5  | perm-missing-nominations template exists with externalIdPrefix 'e2e-perm-missnoms-' + 2 elections, 1 shared CG/CO, 1 candidate, 1 nomination in el-1 only | VERIFIED | packages/dev-seed/src/templates/permutations/perm-missing-nominations.ts; SUMMARY 90-02 runtime shape probe: `prefix=e2e-perm-missnoms-, elections=2, noms=3, candidates=1` (3 noms = 2 org-rows + 1 candidate-row for el-1) |
| 6  | perm-localisation-negative template exists with prefix 'e2e-perm-l10n-neg-' + APP_SETTINGS.i18n.supportedLocales=[en] | VERIFIED | packages/dev-seed/src/templates/permutations/perm-localisation-negative.ts:50-60 (MINIMAL_BASE_APP_SETTINGS spread + i18n.supportedLocales=[{code:'en',name:'English',isDefault:true}]) |
| 7  | perm-localisation-positive template exists with prefix 'e2e-perm-l10n-pos-' + APP_SETTINGS.i18n.supportedLocales=[en,fi] | VERIFIED | packages/dev-seed/src/templates/permutations/perm-localisation-positive.ts (header docstring at lines 6-35 + i18n block; "code: 'fi'" present per 90-04 verify grep) |
| 8  | All 3 templates registered in BUILT_IN_TEMPLATES + re-exported | VERIFIED | packages/dev-seed/src/templates/index.ts:28-30 (imports), :66, :71, :77 (map entries), :109-111 (re-exports) |
| 9  | Setup + teardown wrappers exist for all 3 perms with correct PREFIX constants | VERIFIED | All 6 files present in tests/tests/setup/; SUMMARY 90-02/03/04 verify checks show PREFIX const matches in each teardown |
| 10 | 3 spec files exist with strict-rigidity contract (no expect.soft, no .catch fallbacks, no try/catch around expect) | VERIFIED | All 3 spec files present in tests/tests/specs/perm/; grep for rigidity violations returns only docstring mentions; ESLint clean per SUMMARY |
| 11 | playwright.config.ts has 9 new project entries (3 perms × triplet) appended after 89-04 chain, anchored sequentially | VERIFIED | playwright.config.ts:963-1037 — entries enumerated; chain anchors: missing-nominations.dependencies=['perm-per-app-notifications'], localisation-negative.dependencies=['perm-missing-nominations'], localisation-positive.dependencies=['perm-localisation-negative'] |
| 12 | langSelectorFixture.fixture.ts exports createLangSelector + LangSelectorFixture type with expectVisible / expectHidden / switchTo | VERIFIED | tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts:56 + :112 (factory + type), method bodies present |
| 13 | multilingualTextFieldFixture.fixture.ts exports createMultilingualTextField + type with expectTranslationOptions / openTranslations / setLocaleValue / closeTranslations / expectLocaleHidden | VERIFIED | tests/tests/fixtures/candidate/multilingualTextFieldFixture.fixture.ts:68 + :132 + 5 method definitions at :78, :91, :107, :116, :122 |
| 14 | perm-l10n.ts composition root wires candidate-mega fixtures + langSelector + multilingualTextField + recipientEmail option | VERIFIED | tests/tests/fixtures/candidate/perm-l10n.ts imports both new fixtures + their types; defines recipientEmail option with default; test.extend wires them |
| 15 | data-testid='lang-selector' present on LanguageSelection.svelte NavGroup AND data-testid='multilingual-toggle' present on Input.svelte translation Button | VERIFIED | LanguageSelection.svelte:33 + Input.svelte:655 |
| 16 | testIds.shared.langSelector + .multilingualToggle registered in testIds.ts | VERIFIED | tests/tests/utils/testIds.ts:238-239 |
| 17 | Playwright project enumeration succeeds for all 3 new projects | VERIFIED | `npx playwright test --list --project=perm-missing-nominations` lists the spec (Total: 50 tests); `--project=perm-localisation-positive` enumerates 56 tests; no config errors |
| 18 | perm-localisation-positive spec exercises bidirectional locale switch en→fi→en (PERM-L10N-POS-02) | FAILED | langSelectorFixture.switchTo's URL regex `^https?://[^/]+/${locale}/` requires `/en/` prefix but Paraglide makes en the baseLocale served from `/`. switchTo('en') (positive spec line ~148) will hang on page.waitForURL until per-test timeout. See Gap #2 + 90-REVIEW CR-02. |
| 19 | No existing test regression (additive plan — voter-mega-journey / candidate-mega-journey / 89-04 perm chain stays green) | UNCERTAIN | Static-only checks indicate no overlapping line edits to existing tests/spec files. Runtime regression confirmation is operator-deferred per v2.10 environment cascade carry-forward (Phase 89 lineage). |

**Score:** 17/19 truths verified (2 FAILED, 0 UNCERTAIN counted toward gaps_found; 1 informational UNCERTAIN on regression — not counted as gap because additive intent is visible in diffs).

## Required Artifacts

| Artifact | Expected | Exists | Substantive | Wired | Data Flows | Status |
| -------- | -------- | ------ | ----------- | ----- | ---------- | ------ |
| `packages/app-shared/src/settings/dynamicSettings.type.ts` | DynamicSettings.i18n.supportedLocales? optional field | YES | YES (typed shape mirrors StaticSettings) | YES (imported by frontend init.ts) | N/A (type-only) | VERIFIED |
| `apps/frontend/src/lib/i18n/init.ts` | applyDynamicOverride + filtered locales export | YES | YES (full setter + recompute) | PARTIAL (consumed by i18nContext + test only — NO production writer) | NO (writer never invoked from production) | HOLLOW |
| `apps/frontend/src/lib/contexts/i18n/i18nContext.ts` | passes locales export through unchanged | YES | YES (no code change required per 90-01 SUMMARY) | YES | N/A (reads live ESM binding) | VERIFIED |
| `apps/frontend/src/routes/+layout.ts` | applyDynamicOverride(appSettingsData) call inside load() | YES (file exists) | N/A (the integration line is missing) | NO | NO | MISSING (integration call) |
| `packages/dev-seed/src/templates/permutations/perm-missing-nominations.ts` | 2-elections asymmetric-nominations template | YES | YES (10kB template, runtime shape probe passes) | YES (registered in index.ts + consumed by playwright project) | YES | VERIFIED |
| `packages/dev-seed/src/templates/permutations/perm-localisation-negative.ts` | template with i18n.supportedLocales=[en] override | YES | YES (10kB) | YES | YES (seed-time; runtime engagement blocked by Gap #1) | VERIFIED-STRUCTURAL |
| `packages/dev-seed/src/templates/permutations/perm-localisation-positive.ts` | template with [en,fi] override | YES | YES (10kB) | YES | YES (seed-time; runtime engagement blocked by Gap #1) | VERIFIED-STRUCTURAL |
| `packages/dev-seed/src/templates/index.ts` | 3 imports + 3 BUILT_IN_TEMPLATES entries + 3 re-exports | YES | YES | YES | YES | VERIFIED |
| `tests/tests/setup/perm-*.setup.ts` (×3) | setupFromTemplate wrappers | YES (all 3) | YES | YES | YES | VERIFIED |
| `tests/tests/setup/perm-*.teardown.ts` (×3) | runTeardown(PREFIX, client) wrappers | YES (all 3) | YES | YES | YES | VERIFIED |
| `tests/tests/specs/perm/perm-missing-nominations.spec.ts` | strict-rigidity voter walk asserting modal | YES | YES (3.7kB) | YES (playwright project entry) | YES | VERIFIED-STATIC (runtime deferred) |
| `tests/tests/specs/perm/perm-localisation-negative.spec.ts` | strict-rigidity candidate walk asserting no-langSelector + no-translation-toggles | YES | YES (7.2kB) | YES | runtime assertions DEPEND on Gap #1's fix; static structure correct | VERIFIED-STATIC (runtime blocked by Gap #1) |
| `tests/tests/specs/perm/perm-localisation-positive.spec.ts` | strict-rigidity full TIR5:52-95 walk including voter-side cross-check | YES | YES (16kB — the largest perm spec) | YES | runtime blocked by Gap #1 + Gap #2 | VERIFIED-STATIC (runtime blocked) |
| `tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts` | createLangSelector + ReturnType alias + 3 methods | YES | YES | YES (consumed by perm-l10n composition root) | NOT FULLY (switchTo regex broken for baseLocale — Gap #2) | PARTIAL |
| `tests/tests/fixtures/candidate/multilingualTextFieldFixture.fixture.ts` | createMultilingualTextField + 5 methods | YES | YES | YES | YES | VERIFIED |
| `tests/tests/fixtures/candidate/perm-l10n.ts` | composition root sibling to candidate-mega.ts | YES | YES (wires all 8 fixtures + recipientEmail option) | YES (imported by both perm-l10n specs) | YES | VERIFIED |
| `tests/playwright.config.ts` | 9 new project entries (3 triplets) appended after 89-04 chain | YES | YES (lines 963-1037) | YES (sequential dependency chain) | YES | VERIFIED |
| `tests/tests/utils/testIds.ts` | testIds.shared.langSelector + .multilingualToggle | YES | YES (:238-239) | YES (consumed by both new fixtures) | YES | VERIFIED |
| `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` | data-testid='lang-selector' on NavGroup | YES (:33) | YES (forwarded via restProps spread per 90-03 SUMMARY decision #1) | YES | YES | VERIFIED |
| `apps/frontend/src/lib/components/input/Input.svelte` | data-testid='multilingual-toggle' on translation Button | YES (:655) | YES | YES | YES | VERIFIED |

## Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| perm-localisation-negative template `app_settings.settings.i18n.supportedLocales` | frontend i18n locale-filtering | `app_settings JSONB → dataProvider.getAppSettings() → +layout.ts → applyDynamicOverride() → init.ts recomputeDerivations() → locales export` | BROKEN | The chain breaks at `+layout.ts → applyDynamicOverride()` — the writer is never called. See Gap #1. |
| LanguageSelection.svelte conditional render (`locales.length > 1`) | filtered runtime locales array | `i18nContext.locales export` | NOT_EFFECTIVE | Wiring exists but is never engaged at runtime because the upstream writer is missing. With override absent, `locales` equals the 7-entry Paraglide superset, NOT the override array. |
| perm-localisation-positive spec switchTo('en') | Paraglide baseLocale URL `/` (no prefix) | langSelectorFixture switchTo regex | BROKEN | URL regex requires `/en/` prefix but Paraglide serves baseLocale from `/`. See Gap #2. |
| perm-missing-nominations.spec.ts assertions | voter-missing-nominations-modal testid | page.getByTestId(testIds.voter.missingNominationsModal) | WIRED | testid already existed at testIds.ts:128; spec consumes it directly; static enumeration works |
| data-setup-perm-missing-nominations | perm-per-app-notifications (89-04 chain tail) | dependencies array in playwright.config.ts | WIRED | playwright.config.ts:972 |
| data-setup-perm-localisation-negative | perm-missing-nominations | dependencies array | WIRED | playwright.config.ts:997 |
| data-setup-perm-localisation-positive | perm-localisation-negative | dependencies array | WIRED | playwright.config.ts:1023 |
| perm-l10n.ts composition root recipientEmail option | Inbucket emailBucket query filter | test.use({ recipientEmail: 'candidate-l10n-{neg,pos}-aa@test.openvaa.local' }) | WIRED | Per-perm distinct recipients verified in both spec files |

## Data-Flow Trace (Level 4)

Critical dynamic surface = the runtime locales array exposed by `$lib/i18n/init`. Tracing upstream:

| Artifact | Data Variable | Source | Produces Real Data at Runtime | Status |
| -------- | ------------- | ------ | ----------------------------- | ------ |
| `LanguageSelection.svelte` `locales` | `locales` from `$lib/contexts/app` | `i18nContext.locales` → `init.ts locales` export | YES, but equals the FULL paraglide superset (7 entries), NOT the override (1 or 2 entries) | DISCONNECTED from override path |
| `Input.svelte` `locales.length > 1` gate | same `locales` import | same as above | YES, but produces unintended `true` because length=7 | DISCONNECTED from override intent |
| `init.ts locales` export | `_dynamicOverride` module state | `applyDynamicOverride(dynamic)` writer | NO — writer never called from production. Module-load initialisation runs once with `_dynamicOverride === undefined`, derivations equal paraglide superset, override JSONB lands in `appSettingsData` but is discarded. | HOLLOW |
| `recomputeDerivations()` | `_dynamicOverride` | `applyDynamicOverride(dynamic)` | Only re-runs when applyDynamicOverride is called. In production: only the module-load `recomputeDerivations()` at init.ts:140 runs. | HOLLOW |

Data flow conclusion: The override pipeline is mechanically correct in isolation (unit tests in `init.override.test.ts` prove the writer + reader work as a pair) but is disconnected from the production data path. This is exactly the "wired but data disconnected" HOLLOW state defined in the verifier methodology Step 4 Level 4 table.

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| @openvaa/app-shared build clean | `yarn build --filter=@openvaa/app-shared` | per Plan 90-01 SUMMARY: 4 tasks successful, 4 cached | PASS (per SUMMARY evidence) |
| @openvaa/app-shared unit tests | `yarn test:unit --filter=@openvaa/app-shared` | per 90-01 SUMMARY: 24/24 pass (3 new dynamicSettings.i18n.test.ts assertions) | PASS (per SUMMARY evidence) |
| @openvaa/frontend unit tests | `yarn test:unit --filter=@openvaa/frontend` | per 90-01 SUMMARY: 671/671 pass (5 new init.override.test.ts assertions flipped RED→GREEN) | PASS (per SUMMARY evidence) |
| Playwright project enumeration: perm-missing-nominations | `npx playwright test --list --project=perm-missing-nominations` | "Total: 50 tests in 42 files" — spec enumerated | PASS (re-run during verification) |
| Playwright project enumeration: perm-localisation-positive | `npx playwright test --list --project=perm-localisation-positive` | "Total: 56 tests in 48 files" — both new specs enumerated | PASS (re-run during verification) |
| Production caller of applyDynamicOverride present | `grep -rn applyDynamicOverride apps/frontend/src/` | Found 5 references, ALL in init.ts (4 declaration/doc) + init.override.test.ts (5 test invocations). Zero production callers. | FAIL — confirms Gap #1 |
| `apps/frontend/src/routes/+layout.ts` references `$lib/i18n/init` | `grep -n "i18n/init\|applyDynamicOverride" apps/frontend/src/routes/+layout.ts` | No matches | FAIL — confirms Gap #1 |
| Full E2E perm chain execution | `npx playwright test --project=perm-localisation-negative` etc. | SKIP — operator-deferred per v2.10 environment cascade carry-forward (vite dev cold-start unavailable in headless agent env per documented Phase 89 lineage) | SKIPPED (operator gate) |

## Probe Execution

No `scripts/*/tests/probe-*.sh` style probes are declared in any of the 4 PLAN files or 4 SUMMARY files. Phase 90 uses Playwright project enumeration + unit test gates as its static verification primitives, not bash probes. Step 7c is non-applicable.

## Requirements Coverage

Phase 90's PLAN frontmatter cites these requirement IDs:

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| I18N-RUNTIME-01 | 90-01, 90-03 | Stage A runtime locale override (D-90-10) | BLOCKED | API surface complete (dynamicSettings.type + init.ts) but NOT engaged at runtime — applyDynamicOverride has no production caller. See Gap #1. |
| TIR5:28-50 | 90-01, 90-03 | Single-locale assertions (no langSelector + no multilingual toggles) | BLOCKED (runtime) | Spec exists with strict assertions; runtime execution depends on I18N-RUNTIME-01 fix |
| PERM-MN-01 | 90-02 | Missing-nominations modal | SATISFIED (structural) | Template + spec + playwright entries all present and statically clean; runtime operator-deferred per cascade |
| TIR5:15-26 | 90-02 | Missing-nominations dataset | SATISFIED (structural) | Same as PERM-MN-01 |
| PERM-L10N-NEG-01 | 90-03 | No language selector under single locale | BLOCKED | Assertion code present at perm-localisation-negative.spec.ts:84 (langSelector.expectHidden); runtime path broken by Gap #1 |
| PERM-L10N-NEG-02 | 90-03 | No translation toggles on profile q1+q2 | BLOCKED | Assertion code present; runtime path broken by Gap #1 |
| PERM-L10N-NEG-03 | 90-03 | No translation toggles on opinion-editor q3-comment+q4-comment | BLOCKED | Assertion code present; runtime path broken by Gap #1 |
| FIX-LANG-SEL-01 | 90-03 | langSelectorFixture | SATISFIED (with caveat) | Factory + type + 3 methods authored; switchTo has a baseLocale-aware-regex defect (Gap #2) but the fixture surface as authored matches the requirement contract |
| FIX-ML-TEXT-01 | 90-03 | multilingualTextFieldFixture | SATISFIED | Factory + type + 5 methods authored; static checks pass |
| PERM-L10N-POS-01 | 90-04 | langSelector visible with en+fi | BLOCKED | Assertion code present; runtime path broken by Gap #1 (selector renders the 7-locale superset, NOT just en+fi) |
| PERM-L10N-POS-02 | 90-04 | Switch en↔fi changes UI texts | BLOCKED | Assertion code present; runtime path broken by Gap #2 (switchTo('en') hangs) AND Gap #1 |
| PERM-L10N-POS-03..06 | 90-04 | Candidate-side Finnish authoring on q1/q3 + q2/q4 no-toggle | BLOCKED | Assertion code present; runtime path depends on Gap #1 |
| PERM-L10N-POS-07 | 90-04 | Voter-side cross-check (English then Finnish answers in candidate-details) | BLOCKED | Assertion code present; runtime path depends on Gap #1 + Gap #2 + 90-REVIEW CR-03 (additional save-chain risk) |
| TIR5:52-95 | 90-04 | Full dual-locale walk | BLOCKED | Same as above |

Note: None of these IDs are registered in `.planning/REQUIREMENTS.md` (which ends at DETERM-15 / Phase 87). They are phase-local IDs defined in TEST-INVENTORY-REFACTOR-5.md and 90-CONTEXT.md. No orphaned requirements detected vs. REQUIREMENTS.md — but the absence of registration means future audits cannot cross-reference these IDs against the milestone contract. This is informational, not a gap against this phase.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| apps/frontend/src/lib/i18n/init.ts | 53 | Exported function with NO production caller — only test usage | BLOCKER | Captured as Gap #1 above |
| apps/frontend/src/routes/+layout.ts | 33 | Loads appSettingsData but never threads to i18n init | BLOCKER | Captured as Gap #1 above |
| tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts | ~104-107 | URL waitForURL regex not baseLocale-aware | BLOCKER | Captured as Gap #2 above (confirms 90-REVIEW CR-02) |
| tests/tests/specs/perm/perm-localisation-positive.spec.ts | 204-260 / 322-330 | Voter cross-check Finnish-answer commit chain may not persist before logout (90-REVIEW CR-03) | Warning (not classed as separate gap because CR-01 fix is the precondition — if locales filter never engages, CR-03 cannot be exercised regardless) | Surfaced from 90-REVIEW |
| (locale-pos + locale-neg perm templates) | 248-280 / 256-288 | `buildElectionConstituencyNomsSingleOrg` duplicated verbatim (90-REVIEW WR-05) | Info | Documented as accepted in 90-03 decision #5; intentional per "avoid premature abstraction" |
| LanguageSelection.svelte | 21-22 | Mixed indentation per 90-REVIEW IN-01 | Info | Hygiene; doesn't affect correctness |
| langSelectorFixture.fixture.ts | 98-99 | `displayNameFor(locale)` called twice (1st call is dead code per 90-REVIEW IN-02) | Info | Hygiene |

Two non-debt comments observed but accepted: 90-03 SUMMARY decision #6 and 90-04 SUMMARY decision #5 EXPLICITLY document the +layout.ts wiring as a "known consumer gap" / "operator-deferred runtime gate". These ARE the auditable trail the verifier requires for the BLOCKER classification — the work was explicitly NOT done, and the SUMMARYs are honest about it. The classification dispute is not "did the team admit it?" but "does the phase goal as written tolerate this deferral?".

## Human Verification Required

No items require human verification at this gate. The 2 BLOCKERS are observable via static codebase analysis (grep + file read) and do not depend on UI judgment. Once the +layout.ts wiring lands AND the langSelector switchTo regex is baseLocale-aware, runtime E2E confirmation of all 3 perm projects will require operator-side execution per the documented v2.10 environment cascade carry-forward — that operator gate is the canonical handoff already documented in every Phase 89 SUMMARY and reaffirmed in Phase 90 SUMMARYs 02/03/04. It is not a new human-verification ask introduced by this phase.

## Gaps Summary

**Two BLOCKER gaps prevent goal achievement.**

**Gap #1 — Stage A runtime override is API-only, not behavioural.** The goal text says "close the runtime-locale-override PRODUCT-GAP (Phase 74 D-04 carry-forward)" but the closure is incomplete. `applyDynamicOverride()` is exported, documented, and unit-tested, but no production code calls it. The runtime override JSONB on `app_settings.settings.i18n.supportedLocales` lands in `appSettingsData` (loaded by `+layout.ts:33`) and then is discarded — `applyDynamicOverride(appSettingsData)` is the missing line. Without this single call, the frontend `locales` export always equals the 7-entry Paraglide superset, the LanguageSelection NavGroup ALWAYS renders (`7 > 1`), the Input multilingual toggle ALWAYS renders for non-disabled-multilingual fields, and EVERY runtime assertion in `perm-localisation-negative.spec.ts` + `perm-localisation-positive.spec.ts` that depends on `locales.length` would fail at execution time. The 90-03 SUMMARY (decision #6) and 90-04 SUMMARY (decision #5) BOTH explicitly acknowledge this gap and route it to "operator runbook", but the phase goal does not include a deferred-with-rationale clause for it — the goal claims closure.

**Gap #2 — langSelector.switchTo's URL regex is not baseLocale-aware.** Paraglide makes `en` the baseLocale, served from `/` (NO `/en/` prefix). The fixture's `page.waitForURL(/^https?://[^/]+/${locale}//)` will never resolve for `locale='en'`, so `perm-localisation-positive.spec.ts`'s switch-back-to-English step (PERM-L10N-POS-02) hangs until the Playwright per-test timeout. This is independent of Gap #1 — even if the locales filter engages correctly, the positive perm's bidirectional switch assertion would fail.

**Group analysis:** The two gaps are independent root causes but tightly bind on the localisation perms. Gap #1 prevents BOTH localisation perms from passing their first assertions; Gap #2 prevents the positive perm specifically from completing its switch-back step even if Gap #1 is fixed. Both need closure to satisfy the goal text. The missing-nominations perm (Plan 90-02) is unaffected by either gap and would pass on its own when operator-executed.

**Gaps grouped by closure plan needed:**

- Plan A — Wire `+layout.ts → applyDynamicOverride(appSettingsData)` + add integration test proving the LanguageSelection NavGroup respects the filtered list. Closes Gap #1, unblocks PERM-L10N-NEG-01..03 + PERM-L10N-POS-01 + PERM-L10N-POS-03..07 + I18N-RUNTIME-01 + TIR5:28-50 + TIR5:52-95.
- Plan B — Make langSelectorFixture.switchTo baseLocale-aware. Closes Gap #2, unblocks PERM-L10N-POS-02. Independent of Plan A.

**Operator-deferred items NOT counted as gaps** (carried forward through v2.10 cascade): full E2E execution of the 3 new perm projects against a live vite-dev + Supabase environment. These remain operator handoff per the v2.10 environment cascade — same disposition as Phases 89-01..04 and 90-01..02.

**Phase 90 is the last phase in `.planning/ROADMAP.md`.** No subsequent phase exists to defer these gaps to. The gaps must be closed in-phase or formally re-deferred via a new phase / explicit goal-text amendment.

---

_Verified: 2026-05-29_
_Verifier: Claude (gsd-verifier)_
