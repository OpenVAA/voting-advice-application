# E2E test-folder cleanup — Catalogue + Overlap + Proposed plan

**Task:** 260607-cd0 · **Produced:** 2026-06-07 · **Mode:** ANALYSIS ONLY (nothing deleted/moved/rewritten)
**Scope:** `tests/tests/{fixtures,helpers,utils,setup}` + stray-artifact proposal.
**Method:** triple-grep (module path + every exported symbol + barrel path) scoped to `tests/`, cross-checked against a whole-repo re-grep for the dead set, plus body reads of every overlap pair and the setup project graph from `tests/playwright.config.ts`.

> Verification gate (run this session): `git status --porcelain tests/` shows **zero** tracked changes from this run. Result recorded in §5.

---

## 0. Taxonomy & method

Classification rule is taken **verbatim** from the in-tree authority (`tests/tests/helpers/README.md` + `helpers/index.ts` docstring, traceable to `86.2-RESEARCH.md`). No new taxonomy was invented.

| Layer | Working definition (this repo) | Operates on | Naming |
|-------|--------------------------------|-------------|--------|
| **fixture** | A Playwright `test.extend` *fixture function* (`create*Page`, `createEmailBucket`, …) modelling a page surface/capability, OR a **composition root** that assembles fixtures and re-exports `{ test, expect }`. | a `Page`/`Locator`, wired into the test object | `*.fixture.ts` (leaf), or a bare composition root (`views.ts`, `candidate-journey.ts`, `perm-l10n.ts`, `voter-journey.fixture.ts`) |
| **helper** | Thin generic Playwright wrapper, **NO domain knowledge**. Distils one recurring wait/race/probe shape. | raw `Page`/`Locator`/`SupabaseAdminClient` only | `*.helper.ts`, exported through `helpers/index.ts` |
| **util** | Domain-specific assembler or catalog (the voter journey, the testId catalog, the Supabase test client, the route builder, translation reader). | the voter/candidate domain, filesystem, env | plain `*.ts` in `utils/` |
| **setup** | Playwright project-dependency `*.setup.ts`/`*.teardown.ts` run as a dependency project, plus the `setupFromTemplate.ts` shared driver. Seeds/tears down DB state for a spec class. | `SupabaseAdminClient`, seed templates | `*.setup.ts` / `*.teardown.ts` |

**Crisp classifier rule (4-step):**
1. Is it a Playwright project-dependency that seeds/tears down DB state? → **setup**.
2. Does it return a `test.extend` fixture fn or re-export `{ test, expect }`? → **fixture**.
3. Does it touch ONLY raw Playwright primitives (no `testIds`, no domain routes/journeys)? → **helper**.
4. Otherwise (domain assembler / catalog / fs / env reader) → **util**.

**Grep method (the barrel-trap):** `helpers/index.ts` re-exports 6 symbols, so a spec importing `{ TIMEOUTS }` from `'../../helpers'` does NOT match a grep for `helpers/timeouts`. For every module the importer set was computed as the union of: (a) module-path grep, (b) each exported-symbol grep, (c) barrel-path grep with destructure resolution at each barrel importer. Self-files excluded. Transitive usage by a LIVE fixture/util counts as alive. A module is DEAD only when the transitive closure from every spec excludes it.

**In-scope module count:** 26 fixtures + 6 helper `*.ts` (skip `README.md`; `index.ts` is the barrel) + 13 utils + 1 shared setup driver (`setupFromTemplate.ts`) = **46 code modules catalogued individually**, plus the 47-file setup project graph (`auth.setup`, `base.setup`/`base.teardown`, 22 perm setup+teardown pairs, 1 candidate setup+teardown pair) mapped via the Playwright config.

---

## 1. Catalogue

Importer lists are **direct importers**; transitive reach is noted where a module is pulled in only by a live fixture/util. Module (first-column) paths are written in full under `tests/tests/`; importer-cell paths elide the `tests/tests/` prefix for brevity (all are under `tests/tests/`).

### 1a. fixtures/ (26)

**Composition roots (4 + 2 secondary roots) — assemble fixtures, re-export `{ test, expect }`:**

| Module | Layer | Imported by (`{ test, expect }` consumers) | Status |
|--------|-------|--------------------------------------------|--------|
| `tests/tests/fixtures/voter/views.ts` | fixture (root) | candidate-journey.ts, resultsPage.fixture.ts, + 6 perm/voter specs (perm-disable-candidate-app, perm-header-show-feedback, perm-header-show-help, perm-missing-nominations, perm-per-app-notifications, voter-journey.spec) | LIVE |
| `tests/tests/fixtures/voter/voter-journey.fixture.ts` | fixture (root) | candidate-journey.ts, feedbackDialog.fixture.ts, minimalVoterResultsPage.fixture.ts, voterQuestionsPage.fixture.ts, + 7 specs (a11y-smoke, performance-budget, perm-hide-category-tags, perm-hide-election-tags, perm-hide-if-missing-answers, visual-regression, voter-journey.spec) | LIVE |
| `tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts` | fixture (root) | perm-disable-allow-open.spec, perm-hide-if-missing-answers.spec | LIVE |
| `tests/tests/fixtures/candidate/candidate-journey.ts` | fixture (root) | candidate-journey.spec, visual-regression.spec | LIVE |
| `tests/tests/fixtures/candidate/perm-l10n.ts` | fixture (root) | perm-localisation-positive.{setup,teardown,spec} | LIVE |
| `tests/tests/fixtures/voter/voterNavFixture.fixture.ts` | fixture (root-ish) | perm-l10n.ts only (transitive → perm-localisation specs) | LIVE (transitive) |

**Leaf page-object fixtures:**

| Module | Imported by (via `create*`) | Status |
|--------|------------------------------|--------|
| `tests/tests/fixtures/candidate/candidateForgotPasswordPage.fixture.ts` | candidate-journey.ts | LIVE (transitive) |
| `tests/tests/fixtures/candidate/candidateHomePage.fixture.ts` | candidate-journey.ts, perm-l10n.ts | LIVE (transitive) |
| `tests/tests/fixtures/candidate/candidateLoginPage.fixture.ts` | candidate-journey.ts, perm-l10n.ts | LIVE (transitive) |
| `tests/tests/fixtures/candidate/candidateLogoutButton.fixture.ts` | candidate-journey.ts, perm-l10n.ts | LIVE (transitive) |
| `tests/tests/fixtures/candidate/candidatePasswordSetter.fixture.ts` | candidate-journey.ts, perm-l10n.ts | LIVE (transitive) |
| `tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts` | candidate-journey.ts | LIVE (transitive) |
| `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts` | candidate-journey.ts, perm-l10n.ts | LIVE (transitive) |
| `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts` | candidate-journey.ts, perm-l10n.ts | LIVE (transitive) |
| `tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts` | candidate-journey.ts, perm-l10n.ts, + 3 specs (perm-answers-locked, perm-disable-allow-open, perm-hide-hero) | LIVE |
| `tests/tests/fixtures/candidate/candidateTermsOfUsePage.fixture.ts` | candidate-journey.ts, perm-l10n.ts | LIVE (transitive) |
| `tests/tests/fixtures/shared/emailBucket.fixture.ts` | candidate-journey.ts, perm-l10n.ts | LIVE (transitive) — see §2.2 |
| `tests/tests/fixtures/shared/feedbackDialog.fixture.ts` | voter-journey.spec | LIVE |
| `tests/tests/fixtures/shared/langSelectorFixture.fixture.ts` | perm-l10n.ts, voterNavFixture.fixture.ts | LIVE (transitive) |
| `tests/tests/fixtures/shared/multilingualTextFieldFixture.fixture.ts` | perm-l10n.ts | LIVE (transitive) |
| `tests/tests/fixtures/voter/entityDetails.fixture.ts` | views.ts | LIVE (transitive) |
| `tests/tests/fixtures/voter/entityFilters.fixture.ts` | views.ts | LIVE (transitive) |
| `tests/tests/fixtures/voter/resultsPage.fixture.ts` | perm-l10n.ts, views.ts | LIVE (transitive) |
| `tests/tests/fixtures/voter/voterHomePage.fixture.ts` | perm-l10n.ts, views.ts, voterNavigation.ts | LIVE (transitive) |
| `tests/tests/fixtures/voter/voterIntroPage.fixture.ts` | views.ts | LIVE (transitive) — see §2.4 |
| `tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts` | views.ts | LIVE (transitive) |

> Note: `langSelector`/`multilingualTextField` also appear in `utils/testIds.ts` — that is a **comment + testId-key** reference (`langSelector: 'lang-selector'`), NOT an import. Excluded from importer counts.
> **Open Q2 resolved:** the legacy `fixtures/index.ts` / `fixtures/voter/index.ts` composition root does **NOT** exist on disk. The only voter root in play is `views.ts` (+ the journey roots). Nothing to migrate or merge.

### 1b. helpers/ (6 `*.ts` + barrel)

The barrel `helpers/index.ts` re-exports 6 symbols: `assertDbRowCount`, `clickAndRaceSettle`/`expectLandedOn`, `iterateSelectOptions`, `gotoAndSettle`/`settleNetworkIdle`, `TIMEOUTS`, `walkVoterIteration`. Importer set resolved by destructuring each barrel consumer.

| Module | Exported symbol(s) | Real consumers (after barrel resolution) | Status |
|--------|--------------------|-------------------------------------------|--------|
| `tests/tests/helpers/timeouts.ts` | `TIMEOUTS` | voter-journey.fixture, voterIntro.ts, voterNavigation.ts, + specs a11y-smoke, candidate-journey, perm-localisation-positive, voter-journey.spec | LIVE (most-used helper) |
| `tests/tests/helpers/settle.helper.ts` | `settleNetworkIdle`, `gotoAndSettle` | `settleNetworkIdle`: navigation.helper.ts, performance-budget.spec, perm-not-located-2e2cg.spec. **`gotoAndSettle`: ZERO consumers** | LIVE (file) — but `gotoAndSettle` is a DEAD export (§2.5) |
| `tests/tests/helpers/navigation.helper.ts` | `clickAndRaceSettle`, `expectLandedOn` | `expectLandedOn`/`clickAndRaceSettle`: voterNavigation.ts (transitive), perm-not-located-2e2cg.spec | LIVE |
| `tests/tests/helpers/select.helper.ts` | `iterateSelectOptions` | voterIntro.ts (transitive), perm-disjoint-1co.spec, perm-not-located-2e2cg.spec | LIVE |
| `tests/tests/helpers/db-precondition.helper.ts` | `assertDbRowCount` | **ZERO** — appears only in `index.ts` barrel; no spec/fixture/util destructures it | **DEAD** (§2.5) |
| `tests/tests/helpers/voter-iteration.helper.ts` | `walkVoterIteration` | **ZERO** — appears only in `index.ts` barrel; the `answeredVoterPage` fixture uses local `walkUntilQuestionsIntro`+`answerAndAdvanceToResults`, NOT this helper | **DEAD** (§2.5) |

### 1c. utils/ (13)

| Module | Layer | Importers (direct) | count | Status |
|--------|-------|--------------------|-------|--------|
| `tests/tests/utils/testIds.ts` | util (catalog) | 19 fixtures + 25 specs + 4 setup + 4 utils/helpers (huge) | 47 files | LIVE (most-used) |
| `tests/tests/utils/supabaseAdminClient.ts` | util (test client) | 3 helpers + ~28 setup/teardown + 4 specs + candidateJourneyConstants + voterNavigation | 39 files | LIVE |
| `tests/tests/utils/buildRoute.ts` | util (route builder) | 5 voter fixtures + index barrel + 3 perm setup + auth.setup + 4 specs | 14 files | LIVE |
| `tests/tests/utils/testsDir.ts` | util (fs) | 6 perm setup/teardown + 3 perm specs + paths.ts | 10 | LIVE |
| `tests/tests/utils/voterIntro.ts` | util (perm walk) | 7 perm specs (perm-1e1cg1co, perm-2e-asymmetric, perm-2e-shared, perm-disable-election-1co, perm-disable-election-2co, perm-disjoint-1co, perm-startfromcg) | 7 | LIVE — see §2.4 |
| `tests/tests/utils/voterNavigation.ts` | util (voter journey) | minimalVoterResultsPage.fixture, navigation.helper, + 4 perm specs | 6 | LIVE — see §2.1 |
| `tests/tests/utils/candidateJourneyConstants.ts` | util (catalog) | candidate-journey.{setup,teardown}, candidate-journey.spec, perm-localisation-positive.spec | 4 | LIVE |
| `tests/tests/utils/testCredentials.ts` | util (catalog) | perm-answers-locked.setup, perm-disable-allow-open.setup, perm-hide-hero.setup, auth.setup | 4 | LIVE |
| `tests/tests/utils/missingNominations.ts` | util (domain) | perm-missing-nominations.spec, voter-journey.spec (+ transitive refs in answerQuestion.ts[dead], testIds.ts[comment], voterIntro.ts) | 2 live specs | LIVE |
| `tests/tests/utils/emailHelper.ts` | util (Mailpit) | candidate-journey.spec, perm-localisation-positive.spec (also referenced in emailBucket.fixture docstring) | 2 specs | LIVE but **D3-superseded** (§2.2) |
| `tests/tests/utils/answerQuestion.ts` | util (domain) | **ZERO** spec/fixture importers (it imports `missingNominations`/`testIds`, but nothing imports IT) | 0 | **DEAD** (§2.5) |
| `tests/tests/utils/translations.ts` | util (i18n fs reader) | **ZERO** (`TRANSLATIONS` not imported anywhere in `tests/`) | 0 | **DEAD** (§2.5) |
| `tests/tests/utils/paths.ts` | util (fs constants) | **1**, and only `translations.ts` (which is itself dead) | 1 cascade | **DEAD (cascade)** (§2.5) |

### 1d. setup/ (project graph, NOT import grep)

The perm/candidate setup+teardown files are Playwright **dependency projects** (`tests/playwright.config.ts`), invoked by the project graph, not by `import`. They will never appear in import greps. Catalogued by config:

- **Shared:** `auth.setup.ts` (project `auth-setup`, dep `data-setup-base`); `base.setup.ts`/`base.teardown.ts` (`data-setup-base` → teardown `data-teardown-base`). Both LIVE.
- **`setup/shared/setupFromTemplate.ts`** (shared driver, IS import-grepped): **23 importers** — every perm setup file + `base.setup.ts`. LIVE. (RESEARCH estimated ~24; the actual is 23 because teardowns call `supabaseAdminClient` directly, not `setupFromTemplate`.)
- **Candidate:** `candidate-journey.setup.ts`/`.teardown.ts` (`data-setup-candidate-journey` → `data-teardown-candidate-journey`, dep `data-setup-base`). LIVE.
- **Perm (22 setup + 22 teardown pairs):** each maps 1:1 to its perm spec via a `data-setup-<name>` → `<name>` → teardown chain, wired as a serial dependency ladder (`perm-1e1cg1co` → `perm-2e-shared` → `perm-2e-asymmetric` → `perm-startfromcg` → `perm-disjoint-1co` → `perm-disable-election-1co` → … etc.). All have a matching spec project ⇒ **none orphaned** (Assumption A2 holds: every setup/teardown has a live project edge). LIVE.

**Setup-layer total mapped:** `auth.setup` + `base.setup`/`base.teardown` + `setupFromTemplate` + 22 perm setup + 22 perm teardown + 1 candidate setup + 1 candidate teardown = 49 setup files, all live.

### 1e. Divergences from RESEARCH §5 spot-checks (findings)

| Symbol | RESEARCH expected | Observed | Note |
|--------|-------------------|----------|------|
| `testIds` | 47 | 47 files | ✓ |
| `supabaseAdminClient` | 34 | 39 files | higher (more teardown importers than the spot-check counted); still clearly LIVE |
| `buildRoute` | 12 | 14 files | higher; LIVE |
| `testsDir` | 9 | 10 | ✓± |
| `voterIntro` | 7 | 7 perm specs | ✓ |
| `voterNavigation` | 4 | 4 specs (+2 transitive) | ✓ |
| `candidateJourneyConstants` | 4 | 4 | ✓ |
| `testCredentials` | 4 | 4 | ✓ |
| `emailHelper` | 2 specs | 2 specs | ✓ |
| `missingNominations` | 1 | 2 live specs | higher; LIVE |
| `answerQuestion` / `translations` | 0 | 0 | ✓ DEAD |
| `paths` | 1 cascade | 1 cascade | ✓ DEAD |
| `setupFromTemplate` | ~24 | 23 | ✓± |
| **`assertDbRowCount` (db-precondition.helper)** | not spot-checked | **0** | **NEW DEAD finding** |
| **`walkVoterIteration` (voter-iteration.helper)** | not spot-checked | **0** | **NEW DEAD finding** |
| **`gotoAndSettle` (settle.helper export)** | not spot-checked | **0** | **NEW DEAD-export finding** |

---

## 2. Overlap & duplication analysis

**Tiered duplicate definition (applied consistently; body-level evidence required):**

| Tier | Name | Evidence required | Action |
|------|------|-------------------|--------|
| **D1** | Exact / near-exact copy | Same function body (modulo whitespace/renames) or copy-pasted constants. | Merge to one canonical source. |
| **D2** | Functional overlap | Same *job*, different name/signature, verified by reading **both bodies** — NOT by filename. | Merge only if call-sites can adopt one signature without behavior loss; else document as intentional sibling. |
| **D3** | Superseded / dead | Zero spec + zero transitive importers (D3-dead), OR legacy module fully replaced by a fixture all live specs use but still imported by ≥1 spec (D3-superseded). | Delete, or migrate-then-delete. |

> **"Different name, same concept" is NOT a duplicate.** Three of the four scouted name-pairs fail D2 on body evidence and are legitimately distinct.

### 2.1 navigation — `helpers/navigation.helper.ts` vs `utils/voterNavigation.ts` vs `utils/buildRoute.ts` + `utils/paths.ts` → **DISTINCT (D-none). Retire signal.**

Body evidence: `navigation.helper.ts`'s own docstring states the co-existence is **intentional** — "Existing in-tree analog for `clickAndRaceSettle`: `voterNavigation.ts` `advanceClick` — NOT refactored to call this helper. The two co-exist intentionally; `voterNavigation.ts` is the domain-specific voter-journey assembler, this helper is its generic counterpart for non-voter-journey call sites." `navigation.helper` (~110 LOC, generic click+settle on raw `Page`) vs `voterNavigation.ts` (380 LOC, domain voter-journey assembler with seed-UUID caching) are different layers, not copies — and `voterNavigation.ts` *imports* `expectLandedOn` from the helper, so they are composed, not duplicated. `buildRoute.ts` (typed route builder, 14 importers) and `paths.ts` (fs path constants) are unrelated to navigation — lumped in by naming proximity only. `buildRoute` is heavily used and stays; `paths.ts` is dead for a different reason (§2.5 cascade). **Verdict: D-none. Drop this signal.**

### 2.2 email — `utils/emailHelper.ts` vs `fixtures/shared/emailBucket.fixture.ts` → **D3-SUPERSEDED (NOT a free delete).**

Body evidence: the two share **D1-level constant + plumbing duplication** — `MAILPIT_URL = process.env.INBUCKET_URL ?? 'http://localhost:54324'` is byte-identical in both (emailBucket's own comment says "Mirrors emailHelper.ts:15"), and the `MailpitMessageSummary`/`MailpitMessage` interfaces + the `fetch(.../api/v1/search?query=to:...)` body are re-implemented in `emailBucket.fixture.ts` (`fetchEmailsForRecipient`) as a copy of `emailHelper.fetchEmails`. emailBucket's docstring is explicit: "This fixture WRAPS emailHelper.ts… SIBLING (not replacement) to emailHelper.ts. The two coexist until emailHelper.ts is retired." But `emailHelper.ts` still has **2 live spec importers** (`candidate-journey.spec.ts`, `perm-localisation-positive.spec.ts`), so it is **superseded-but-used**, not dead. **Verdict: D3-superseded.** The correct fix is the module-level migration (move 2 specs onto the `emailBucket` fixture, then delete emailHelper), NOT extracting a shared `MAILPIT_URL` constant that would then have one importer. This is the **one genuine consolidation** among the scouted pairs — medium-effort, **gated on a fixture migration of 2 specs**. NOT a free delete (§3 item 4).

### 2.3 i18n — `utils/translations.ts` vs `fixtures/candidate/perm-l10n.ts` → **NOT A PAIR.**

Body evidence: `perm-l10n.ts` is a **fixture composition root** (`base.extend<PermL10nFixtures>` assembling candidate fixtures + langSelector + multilingualTextField + recipientEmail; re-exports `{ test, expect }`), with 3 live consumers. It has nothing to do with reading translation JSON. `translations.ts` is a **filesystem reader** flattening locale JSON into a frozen `TRANSLATIONS` map — and has **ZERO importers** anywhere in `tests/`. They are not a duplicate pair: `perm-l10n.ts` STAYS (live root); `translations.ts` is D3-dead (§2.5).

### 2.4 voter intro — `utils/voterIntro.ts` vs `fixtures/voter/voterIntroPage.fixture.ts` → **DISTINCT (D-none; weak D2 at one step only).**

Body evidence: `voterIntroPage.fixture.ts` is **54 LOC** — a page-object fixture for the `/intro` page only (`goToPage(locale)`, `expectPageVisible(visible)`, `clickStart()`), consumed via the `views.ts` root. `voterIntro.ts` is **222 LOC** — the minimal-seed perm-journey assembler (`bypassIntroThen`, `bypassIntroAndExpectQuestion/ElectionSelector/ConstituencySelector`, `selectElectionAndAdvance`, `selectConstituencyAndAdvance`) imported directly by **7 perm specs**, with hard-assertion rigidity and election/constituency walk logic. Different scope (single page vs full walk), different layer (fixture vs util), different consumers (views composition vs direct perm-spec import). Adopting one for the other would lose either the perm seed assumptions or the fixture composition. Only the single `bypassIntroThen` step weakly overlaps the fixture's `clickStart` + a re-navigation — note as a possible **future micro-extraction**, NOT a consolidation target now. **Verdict: D-none.**

### 2.5 Genuine dead code — the real cleanup win (lead with this)

| Module / export | Importers (whole `tests/`) | Tier | Evidence |
|-----------------|-----------------------------|------|----------|
| `tests/tests/utils/translations.ts` | **0** | D3-dead | No spec/fixture/util imports `TRANSLATIONS`; whole-repo re-grep of `utils/translations` outside self = 0. |
| `tests/tests/utils/paths.ts` | **1**, only `translations.ts` | D3-dead (cascade) | `REPO_ROOT`/`FRONTEND_DIR` consumed solely by the dead `translations.ts`. Dies *with* it. |
| `tests/tests/utils/answerQuestion.ts` | **0** | D3-dead | `answerQuestion`/`answerUntilResults` have zero importers (the one whole-repo match — `apps/frontend/.../translationKey.ts` — is an unrelated generated translation key, NOT this module). |
| `tests/tests/helpers/db-precondition.helper.ts` (`assertDbRowCount`) | **0** | D3-dead | **NEW.** Only appearance is the `index.ts` barrel re-export; no consumer destructures `assertDbRowCount`. Entire file is dead. |
| `tests/tests/helpers/voter-iteration.helper.ts` (`walkVoterIteration`) | **0** | D3-dead | **NEW.** Only appearance is the `index.ts` barrel re-export. The `answeredVoterPage` fixture (which the README claims it backs) actually uses local `walkUntilQuestionsIntro` + `answerAndAdvanceToResults` in `voter-journey.fixture.ts` — the README docstring on `walkVoterIteration` (maxSteps=6) is **STALE**. Entire file is dead. |
| `tests/tests/helpers/settle.helper.ts` → `gotoAndSettle` | **0** (export only; file is LIVE via `settleNetworkIdle`) | dead export | **NEW.** `gotoAndSettle` has zero consumers; `settleNetworkIdle` from the same file is live. Do NOT delete the file — only drop the dead export + its barrel line. |

**Cross-repo false-positive caveat (Assumption A1):** the dead verdicts hold because no `tests/`-internal importer exists. Whole-repo name matches for these symbols resolve to UNRELATED code: `apps/frontend/src/lib/types/generated/translationKey.ts` contains a generated `answerQuestion` key (i18n, not this util); there is no `packages/data` / `apps/docs` collision for the helper symbols. No dynamic/string `import()` of any dead module exists in `tests/`. **The follow-up MUST re-run this grep immediately before deleting** — `paths.ts` un-dies the moment any future consumer is added, and a new barrel destructure of `assertDbRowCount`/`walkVoterIteration`/`gotoAndSettle` would revive those.

### 2.6 helpers/ vs utils/ split — **KEEP (do not unify).** Substantiated recommendation.

The split is a **real semantic axis**, not redundancy: helpers operate on raw Playwright primitives with **no domain knowledge**; utils are domain assemblers/catalogs. This is documented with a load-bearing tie-breaker ("when in doubt, prefer `utils/`") and three contract notes in `helpers/README.md` that callers rely on (`settleNetworkIdle` does NOT swallow timeouts; `iterateSelectOptions` targets the combobox+listbox ARIA contract; `walkVoterIteration` defaults maxSteps=6 — though that last contract is now moot since the helper is dead). Collapsing the buckets would erase the "this code knows nothing about OpenVAA" guarantee that keeps helpers reusable across every spec regardless of fixture composition. The §2.1 navigation evidence shows the split is **correctly applied today** (generic helper next to domain assembler, composed not duplicated). **Refute** the "two buckets for shared code = redundant" framing. Classification of the overlaps: 5 dead-code items (§2.5) · 1 genuine consolidation (emailHelper §2.2) · 2 deliberate-distinct siblings (navigation §2.1, voter-intro §2.4) · 1 non-pair (i18n §2.3).

---

## 3. Proposed deprecation plan

> **EXECUTION STATUS (follow-up run, 2026-06-07 — user-approved "1"):**
> Items **1, 2, 3, 4, 5 EXECUTED** ✅ (commits `6edeb9fa2` utils dead code, `fc08e10f3` helpers dead code) plus the user-requested **`.helper`→`.ts` rename** of the 3 surviving helpers (in `fc08e10f3`) and **IDURA kept + tracked** (`1d90db68c`, §4). Verified green: `playwright --list` 84/72, eslint 0, `tsc -p tests/tsconfig.json` 0.
> Item **6 (emailHelper) DEFERRED** — see its annotation below; new finding makes the original sub-plan inaccurate.

Ordered **dead-code-first** (lowest risk leads). Each item gives three executable fields: **Canonical target**, **Files to delete**, **Import sites to rewrite**.

> **Mandatory pre-step for ALL deletions:** re-run the §2.5 grep recipe (module path + every exported symbol + barrel destructure) across the **whole repo**, plus a dynamic-`import()`/string-path check, immediately before deleting. A module flagged dead today un-dies if a consumer is added between this report and the follow-up.

### Item 1 — `utils/answerQuestion.ts` (dead, standalone)
- **Canonical target:** n/a — pure delete.
- **Files to delete:** `tests/tests/utils/answerQuestion.ts`.
- **Import sites to rewrite:** none (0 importers). It imports `missingNominations`/`testIds`; deleting it does not affect those (both have other live importers).

### Item 2 — `helpers/db-precondition.helper.ts` (dead, barrel-only)
- **Canonical target:** n/a — pure delete.
- **Files to delete:** `tests/tests/helpers/db-precondition.helper.ts`.
- **Import sites to rewrite:** edit `tests/tests/helpers/index.ts` — remove the line `export { assertDbRowCount } from './db-precondition.helper';` **in the same commit** (barrel-churn rule). No spec/fixture destructures `assertDbRowCount`, so no other rewrites.

### Item 3 — `helpers/voter-iteration.helper.ts` (dead, barrel-only)
- **Canonical target:** n/a — pure delete.
- **Files to delete:** `tests/tests/helpers/voter-iteration.helper.ts`.
- **Import sites to rewrite:** edit `tests/tests/helpers/index.ts` — remove `export { walkVoterIteration } from './voter-iteration.helper';` in the same commit. Also fix the now-stale `walkVoterIteration` contract paragraph in `helpers/README.md` (it claims the helper backs `answeredVoterPage`; it does not). No spec rewrites.

### Item 4 — `helpers/settle.helper.ts` → drop dead export `gotoAndSettle` (file STAYS)
- **Canonical target:** `settle.helper.ts` stays (live via `settleNetworkIdle`).
- **Files to delete:** none — remove only the `gotoAndSettle` function from `settle.helper.ts`.
- **Import sites to rewrite:** edit `tests/tests/helpers/index.ts` — change `export { gotoAndSettle, settleNetworkIdle } from './settle.helper';` to `export { settleNetworkIdle } from './settle.helper';` in the same commit. No spec rewrites.

### Item 5 — `utils/translations.ts` + `utils/paths.ts` (dead cascade — delete BOTH together)
- **Canonical target:** n/a — cascade delete.
- **Files to delete:** `tests/tests/utils/translations.ts` AND `tests/tests/utils/paths.ts` (in the same step — `paths.ts`'s only importer is `translations.ts`).
- **Import sites to rewrite:** none (zero spec importers of either, once both go). Note `paths.ts` imports `testsDir.ts` (which has other live importers — leave `testsDir.ts` alone).
- **Caveat:** `paths.ts` is dead **only conditionally on** deleting `translations.ts`. If the pre-step re-grep shows a new `paths.ts` consumer, keep `paths.ts` and delete `translations.ts` alone.

### Item 6 — `utils/emailHelper.ts` → `fixtures/shared/emailBucket.fixture.ts` (D3-superseded, MEDIUM-EFFORT, GATED) — ⏸ DEFERRED (follow-up)

> **DEFERRED in the 2026-06-07 follow-up. New finding corrects the sub-plan below:**
> `emailBucket.fixture.ts` **imports from / wraps** `emailHelper.ts` (its own docstring: "this fixture WRAPS emailHelper.ts"), so `emailHelper.ts` is **load-bearing for the fixture itself** — not just the 2 specs. Deleting it therefore requires **relocating the Mailpit plumbing into the fixture first**, not merely migrating the specs. Also, the 2 specs only import `toCallbackUrl` (a pure URL-string transform, arguably util-shaped, not fixture-shaped) — `getRegistrationLink`/`getLatestEmailHtml`/etc. are reached only **through** the fixture. Net: this is a fixture-internalisation + spec-migration, still **gated on a live-stack green run** of the 2 specs. Tracked as a todo. Do NOT delete `emailHelper.ts` until that lands.
- **Canonical target:** `tests/tests/fixtures/shared/emailBucket.fixture.ts` (the surviving Mailpit surface).
- **Files to delete:** `tests/tests/utils/emailHelper.ts` — **only after** the migration below lands green.
- **Import sites to rewrite (the gate):**
  1. `tests/tests/specs/candidate/candidate-journey.spec.ts` — migrate its `emailHelper` calls (`getRegistrationLink`/`getLatestEmailHtml`/etc.) onto the `emailBucket` fixture's `expectEmail`/`getEmail`/`getLinksInEmail` surface. The spec already imports the candidate-journey root, which composes `emailBucket` — wire the fixture in.
  2. `tests/tests/specs/perm/perm-localisation-positive.spec.ts` — same migration onto `emailBucket`.
  - **Sequence (do not reorder):** migrate both specs → run **only** those 2 specs to green → THEN delete `emailHelper.ts`. Do NOT delete first. This is the one item that touches live spec behavior; treat as medium-effort.

### DO-NOT-consolidate guardrails (from RESEARCH §6)
- **Composition roots stay separate:** `views.ts`, `candidate-journey.ts`, `perm-l10n.ts`, `voter-journey.fixture.ts`, `minimalVoterResultsPage.fixture.ts` — documented intentional coexistence; merging roots silently changes which fixtures a spec receives and breaks worker/test scope. (No legacy `index.ts` root exists to merge anyway — Open Q2 resolved.)
- **Seed-literal / setup-graph code is off-limits:** the 22 perm setup/teardown pairs + `setupFromTemplate.ts` + `base.setup` carry seed literals and worker-scoped DB state. Phase-93 isolation precedent (election-count leak) — do NOT consolidate.
- **Voter-walk modules are high-risk:** `voterNavigation.ts`, `voterIntro.ts`, the `answeredVoterPage` walk are coupled to the `e2e/base` seed and `--likert-only` (drops non-ordinal opinion questions, changing step counts). Leave split.
- **helpers/ vs utils/ split: do NOT unify** (§2.6).
- **Barrel rule:** any `helpers/*` deletion/rename requires the matching `helpers/index.ts` edit **in the same commit** or every barrel importer breaks at once.
- **The two deliberate-distinct siblings stay:** `navigation.helper` ↔ `voterNavigation` (§2.1); `voterIntroPage.fixture` ↔ `voterIntro` (§2.4).

---

## 4. Stray-artifact cleanup proposal

Verified this session (`git check-ignore` + `git ls-files` + filesystem existence):

| Artifact | Exists? | gitignore | tracked? | Recommendation |
|----------|---------|-----------|----------|----------------|
| `tests/playwright-results/` | yes | IGNORED | untracked | No repo change. Optional local `rm -rf` (not tracked). |
| `tests/playwright-results-cell4/` | yes | IGNORED | untracked | Same — already ignored; optional local delete. |
| `tests/playwright-report/` | yes | IGNORED | untracked | Same — already ignored. |
| `tests/.planning/` | yes | IGNORED | untracked | Same — already ignored. |
| `tests/TEMP.md` | **MISSING** | — | — | No action — does not exist. |
| `tests/IDURA-TEST-RUNBOOK.md` | **yes** | **NOT-IGNORED** | **untracked** | **USER DECISION (below).** Do NOT silently delete. |
| `TEMP.md` (repo root) | **MISSING** | NOT-IGNORED | untracked | No action — does not currently exist (the git-status snapshot listing it is stale). Outside `tests/` scope regardless. |

**`tests/IDURA-TEST-RUNBOOK.md` — keep-vs-ignore (USER DECISION):** It is an **authored doc** — a manual full-flow testing runbook for the candidate bank-authentication (Idura OpenID Connect) redirect flow, explicitly complementing the synthetic-token E2E spec `tests/tests/specs/candidate/candidate-bank-auth.spec.ts`. It is genuine documentation, not generated output. Two defensible options:
- **(a) keep-and-track:** move into a tracked docs location (e.g. `tests/docs/` or alongside the bank-auth spec) and commit it, so the runbook is versioned with the code it documents. **Recommended** — it references a real spec and a real Edge Function flow.
- **(b) gitignore:** if it is personal scratch, add it to `.gitignore`. Lower-value: it reads as durable team documentation, not scratch.

Do not delete it without the user's call.

> Net: every output/scratch directory is **already** gitignored — the scout's "tracked/stale output dirs" concern is stale (none are tracked). The only real action item is the IDURA runbook disposition.

---

## 5. Checkpoint

**This run is ANALYSIS ONLY. Nothing under `tests/` (or anywhere) was deleted, moved, rewritten, or @deprecated.** The only file written is this report.

**Non-destructive verification gate (run this session):**
```
$ git status --porcelain tests/ | grep -vE '^\?\? tests/(playwright-results|playwright-results-cell4|playwright-report|.planning)/'
```
Result (verified this session):
```
 M tests/tests/specs/voter/voter-journey.spec.ts
?? tests/IDURA-TEST-RUNBOOK.md
```
Both entries are **pre-existing** (present in the run-start git snapshot): the `voter-journey.spec.ts` modification and the untracked IDURA runbook predate this analysis and were **not** touched by it. No tracked file was changed by this run; gitignored output dirs are excluded by the filter. ✅ PASS — zero source/test files deleted, moved, rewritten, or @deprecated.

**Next step:** ~~the user reviews this report and approves a separate FOLLOW-UP consolidation run~~ — **DONE 2026-06-07.** Follow-up executed §3 items 1–5 (dead-code sweep) + the user-requested `.helper`→`.ts` rename + IDURA keep/track. Commits `6edeb9fa2`, `fc08e10f3`, `1d90db68c`. All gates green (`playwright --list` 84/72, eslint 0, tsc tests 0). **Only item 6 (emailHelper) remains**, deferred to a live-stack run (todo filed) because the emailBucket fixture wraps emailHelper.

**Summary of the real wins** (refuting the duplication-by-name premise):
- **5 dead-code removals** lead the cleanup: `answerQuestion.ts`, `db-precondition.helper.ts`, `voter-iteration.helper.ts`, the cascade `translations.ts`+`paths.ts`, and the dead `gotoAndSettle` export. (3 of these — the two helper files + `gotoAndSettle` — are NEW finds beyond the scouted/RESEARCH set.)
- **1 genuine consolidation:** `emailHelper.ts` → `emailBucket` fixture (D3-superseded, gated).
- **3 scouted "overlaps" are NOT duplicates:** navigation, voter-intro (deliberate siblings), i18n (non-pair).
- **helpers/ vs utils/ split: KEEP.**



