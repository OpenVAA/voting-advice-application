# Phase 93: Clean up and reorganise E2E tests, fixtures, setup, and seed templates — Research

**Researched:** 2026-06-03
**Domain:** E2E test-suite reorganisation (rename / relocation refactor) — Playwright project graph + @openvaa/dev-seed templates
**Confidence:** HIGH (every claim cites an on-disk path + line verified this session)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01 .. D-16)
- **D-01:** Invocable template name = `e2e/base`. `baseV1`'s content moves to `packages/dev-seed/src/templates/e2e/base.ts`; old `e2e.ts` content deleted. Old bare `e2e` name retired (no alias). Update every `--template e2e` consumer.
- **D-02:** Permutation templates move under `packages/dev-seed/src/templates/e2e/perm/*` (from `templates/permutations/*`). Update barrel + resolve mappings.
- **D-03:** Retarget the dev-seed template tests `e2e.test.ts` + `e2e-app-settings.test.ts` to assert the NEW base dataset (formerly `baseV1`) and rename (e.g. `base.test.ts` / `base-app-settings.test.ts`). Do NOT delete. Researcher first checks whether `baseV1` already has equivalent dev-seed tests.
- **D-04:** A11y data source = reuse the base setup chain (same `e2e/base` seed/setup the voter-journey uses). Project-dependency swap + spec data updates, no new setup/teardown files. Researcher confirms sharing the base chain is conflict-free.
- **D-05:** Canonical `external_id` prefix for the merged base dataset = `test-e2e-base-` (replaces `test-e2e-` / `test-baseV1-`). Update the Phase 92 freshness-guard allowlist (`setupFromTemplate.ts` + `data.setup.ts` mirror) + hardcoded prefixes.
- **D-06:** Merge the two base-seeding paths into ONE. Collapse `data.setup.ts`/`data.teardown.ts` (old `e2e`) into the single base setup/teardown (formerly `baseV1`) and repoint visual/bank/perf/auth dependencies. Eliminate the duplicate `data-setup`/`data-teardown` chain.
- **D-07:** `tests/setup/shared/` = cross-role infra (`auth.setup.ts`, `setupFromTemplate.ts`, merged base setup+teardown, data helpers). `tests/setup/perm/` = `perm-*` pairs. `tests/setup/candidate/` = candidate-journey setup. `tests/setup/voter/` = voter-journey-specific setup.
- **D-08:** Full playwright.config rewrite — `testMatch` regexes for new subdir paths + project-key renames. Verify graph resolves green.
- **D-09:** Remove "mega" EVERYWHERE — zero tokens remain (specs, fixtures, setup basenames, project names, identifiers/comments, AND `external_id` data prefixes `test-candidate-mega-` → `test-candidate-journey-`).
- **D-10:** Rename `baseV1` → `base` (files, project keys `data-setup-baseV1` → `data-setup-base`/`base`, template export `baseV1` → `base`, file at `e2e/base.ts`). Update ALL `baseV1` references.
- **D-11:** Canonical journey naming = `voter-journey` / `candidate-journey` across specs, fixture roots (`voter-journey.fixture.ts` / `candidate-journey.ts`), setup files, project keys.
- **D-12:** All root-level voter-app fixtures → `tests/tests/fixtures/voter/`: `entityDetails.fixture.ts`, `entityFilters.fixture.ts`, `resultsPage.fixture.ts`, `views.ts`, `voter-journey.fixture.ts`. `shared/` reserved for genuinely cross-app helpers only.
- **D-13:** `shared/` moves: candidate `emailBucket.fixture.ts`, `langSelectorFixture.fixture.ts`, `multilingualTextFieldFixture.fixture.ts` → `tests/tests/fixtures/shared/`.
- **D-14:** `voter/` move: candidate `voterNavFixture.fixture.ts` → `tests/tests/fixtures/voter/`.
- **D-15:** `views.ts` stays separate (DO NOT consolidate) — moves to `voter/` intact.
- **D-16:** `minimalVoterResultsPage` → `tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts` (extracted from the voter journey fixture; consumed by `perm-hide-if-missing-answers` + `perm-disable-allow-open`). Rewrite only if extraction surfaces coupling to full-journey data.

### Claude's Discretion
- Exact file/symbol names within conventions, the rename+move commit sequence, and how the playwright dependency graph is re-expressed — provided the suite + lint + typecheck stay green at every commit and no `mega`/`baseV1`/old-`e2e` token survives.
- Whether the dev-seed `seed_` default prefix needs any touch — only if it intersects the freshness-guard allowlist work.

### Deferred Ideas (OUT OF SCOPE)
- None. (Four spurious todo-matcher hits reviewed and not folded — party-app, candidate answer-store, app-shared paradigm, mergeSettings.)
</user_constraints>

<phase_requirements>
## Phase Requirements

No requirement IDs assigned (Requirements: TBD). Coverage is defined by the five ROADMAP workstreams + D-01..D-16. The "## Validation Architecture" section maps the validation signals.
</phase_requirements>

## Summary

Phase 93 is a pure rename/relocation refactor of the E2E suite (`tests/`) and `@openvaa/dev-seed` templates. No new test coverage. The 16 decisions are locked; this research maps the EXACT current state and the COMPLETE reference graph so the planner can write transitive move+rename tasks that keep `lint:check` / `typecheck:tests` / dev-seed `test:unit` / the full Playwright graph green at every commit.

The reference graph is wide but well-bounded. The single template-name chokepoint is `packages/dev-seed/src/templates/index.ts` (`BUILT_IN_TEMPLATES` map) — NOT `resolve-template.ts` (which is generic). The single playwright-graph chokepoint is `tests/playwright.config.ts` (one ~800-line file). Fixture moves ripple through a small, enumerated set of import sites (most fixtures are imported only by `views.ts`, `perm-l10n.ts`, `candidate-mega.ts`, or the journey/visual/perf/a11y specs).

**Primary recommendation:** Sequence the work as per-asset atomic commits, each gated by the cheap trio (`yarn typecheck:tests` + `eslint tests` + `yarn workspace @openvaa/dev-seed test:unit`), with ONE expensive full-`yarn test:e2e` gate at the end (requires `yarn dev`). Several locked-decision premises are stale or incomplete — see **Flags** (§6). Most consequential: the dev-seed baseline is NOT currently green (two pre-existing failures), `perm-l10n.ts` is an unlisted consumer that breaks under the D-13/D-14 fixture moves, the a11y spec ALREADY uses the base fixture (D-04 is a project-dep swap only), and D-03 "retarget" is a substantial rewrite (not a rename) because the e2e and base datasets have incompatible shapes.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Seed dataset definition | dev-seed templates (`packages/dev-seed/src/templates/`) | — | Single source of test data; `BUILT_IN_TEMPLATES` map is the registry |
| Template name resolution | dev-seed CLI (`templates/index.ts` barrel) | `resolve-template.ts` (generic loader) | Built-in names live in the barrel map; resolver only handles path-vs-name dispatch |
| Test data seeding into DB | tests/setup (`setupFromTemplate.ts` + per-project setup) | dev-seed `Writer` | setup files orchestrate teardown→seed→assert via the dev-seed pipeline |
| Playwright project graph | `tests/playwright.config.ts` | — | One file owns all project keys, testMatch regexes, dependency chains |
| Fixture composition | tests/fixtures | — | Page-object/function-fixtures composed into journey roots |
| Freshness guard | `setupFromTemplate.ts` + `data.setup.ts` (mirror) | — | Probe for non-`{prefix}%`/non-`seed_%` rows |

## Standard Stack

No new packages. Existing toolchain only:

| Tool | Command | Role in this phase |
|------|---------|--------------------|
| Playwright | `yarn test:e2e` (`playwright test -c ./tests/playwright.config.ts ./tests`) | Full E2E gate (needs `yarn dev` running) |
| Vitest | `yarn workspace @openvaa/dev-seed test:unit` | dev-seed template-shape tests (cheap) |
| tsc | `yarn typecheck:tests` (`tsc -p tests/tsconfig.json --noEmit`) | Type gate for `tests/` (cheap; VERIFIED green at baseline, exit 0) |
| ESLint | `eslint --flag v10_config_lookup_from_file tests` (part of `yarn lint:check`) | Lint gate for `tests/` (cheap) |

`[VERIFIED: package.json L28-35; .planning/config.json]`

**Package legitimacy audit:** N/A — no external packages installed in this phase.

## Current-State File Inventory (the "from" side of every move/rename)

### WS1 — Fixtures (`tests/tests/fixtures/`)

On-disk verified (`find tests/tests/fixtures -type f`). Decision targets per D-12..D-16.

| Current path | Target (locked) | Decision | Notes |
|--------------|------------------|----------|-------|
| `fixtures/voter-mega.fixture.ts` | `fixtures/voter/voter-journey.fixture.ts` | D-11/D-12 | Export `voterMegaTest` → rename; source of `minimalVoterResultsPage` extraction (D-16) |
| `fixtures/views.ts` | `fixtures/voter/views.ts` | D-12/D-15 | Imports `entityDetails`/`entityFilters`/`resultsPage` (siblings) — moving together keeps `./` imports stable |
| `fixtures/resultsPage.fixture.ts` | `fixtures/voter/resultsPage.fixture.ts` | D-12 | |
| `fixtures/entityDetails.fixture.ts` | `fixtures/voter/entityDetails.fixture.ts` | D-12 | comment ref to `voter-mega-journey.spec.ts` at L129 |
| `fixtures/entityFilters.fixture.ts` | `fixtures/voter/entityFilters.fixture.ts` | D-12 | |
| `fixtures/candidate/candidate-mega.ts` | `fixtures/candidate/candidate-journey.ts` | D-09/D-11 | Export `test`/`expect`; composition root |
| `fixtures/candidate/emailBucket.fixture.ts` | `fixtures/shared/emailBucket.fixture.ts` | D-13 | |
| `fixtures/candidate/langSelectorFixture.fixture.ts` | `fixtures/shared/langSelectorFixture.fixture.ts` | D-13 | Imported by `voterNavFixture` (sibling) + `perm-l10n` |
| `fixtures/candidate/multilingualTextFieldFixture.fixture.ts` | `fixtures/shared/multilingualTextFieldFixture.fixture.ts` | D-13 | |
| `fixtures/candidate/voterNavFixture.fixture.ts` | `fixtures/voter/voterNavFixture.fixture.ts` | D-14 | Imports `./langSelectorFixture.fixture` → breaks (langSelector → shared/) |
| (extract) `minimalVoterResultsPage` | `fixtures/voter/minimalVoterResultsPage.fixture.ts` | D-16 | NOT a file today — a fixture variant inside `voterMegaTest` |

**Already-deleted (git status confirmed gone — do NOT instruct moves):** `fixtures/index.ts`, `fixtures/shared/index.ts`, `fixtures/voter.fixture.ts`. Verified absent via `find`.

**Files present that CONTEXT.md/ROADMAP did NOT name (FLAG — see §6):**
- `fixtures/candidate/perm-l10n.ts` — a SECOND candidate composition root (sibling to `candidate-mega.ts`). Imports `emailBucket`, `langSelectorFixture`, `multilingualTextFieldFixture`, `voterNavFixture` (all moving) PLUS `../resultsPage.fixture` and `../voter/voterHomePage.fixture`. Stays in `candidate/`? Its imports MUST be repointed.
- `fixtures/shared/feedbackDialog.fixture.ts` — already in `shared/`; no decision touches it. Comment-only `voter-mega` refs (L6-8).
- `fixtures/voter/voterHomePage.fixture.ts`, `voterIntroPage.fixture.ts`, `voterQuestionsPage.fixture.ts` — already in `voter/`; no move. `voterQuestionsPage` has a comment ref to `voter-mega.fixture.ts` (L19).
- 11 `fixtures/candidate/candidate*.fixture.ts` page objects — stay in `candidate/`; consumed by both `candidate-mega.ts` and `perm-l10n.ts`.

### WS2 — Setup (`tests/tests/setup/`, flat today)

| Current path | Target dir (D-07) | Rename | Notes |
|--------------|-------------------|--------|-------|
| `setup/auth.setup.ts` | `setup/shared/` | — | `dependencies: ['data-setup']` → repoint to merged base |
| `setup/setupFromTemplate.ts` | `setup/shared/` | — | Freshness-guard helper; prefix allowlist (D-05) |
| `setup/baseV1.setup.ts` | `setup/shared/` | `base.setup.ts` (D-10) | calls `setupFromTemplate('baseV1')` → `'base'` (or `'e2e/base'`) |
| `setup/baseV1.teardown.ts` | `setup/shared/` | `base.teardown.ts` (D-10) | `PREFIX='test-'` → `test-e2e-base-` (D-05) only if base prefix changes |
| `setup/data.setup.ts` | DELETE/MERGE (D-06) | — | seeds `BUILT_IN_TEMPLATES.e2e`; merge into base setup |
| `setup/data.teardown.ts` | DELETE/MERGE (D-06) | — | |
| `setup/candidate-mega.setup.ts` | `setup/candidate/` | `candidate-journey.setup.ts` (D-09/D-11) | imports `../utils/candidateMegaConstants` (FLAG: util rename) |
| `setup/candidate-mega.teardown.ts` | `setup/candidate/` | `candidate-journey.teardown.ts` | imports `candidateMegaConstants` |
| `setup/perm-*.setup.ts` / `perm-*.teardown.ts` (24 files = 12 pairs) | `setup/perm/` | none | move only; project keys/testMatch already perm-named |

There is NO voter-journey-specific setup file today (the voter-journey chain uses `data-setup-baseV1` directly). `setup/voter/` (D-07) will be empty unless the merge introduces one. **FLAG**: D-07 names a `setup/voter/` dir but no asset maps to it.

`.gitkeep` exists at `setup/.gitkeep`.

### WS3+WS4 — Specs (`tests/tests/specs/`)

| Current path | Target | Decision |
|--------------|--------|----------|
| `specs/voter/voter-mega-journey.spec.ts` | `specs/voter/voter-journey.spec.ts` | D-09/D-11 |
| `specs/voter/voter-mega-journey.README.md` | `voter-journey.README.md` (6 mega refs inside) | D-09 |
| `specs/candidate/candidate-mega-journey.spec.ts` | `specs/candidate/candidate-journey.spec.ts` | D-09/D-11 |
| `specs/candidate/candidate-mega-journey.README.md` | `candidate-journey.README.md` (18 mega refs) | D-09 |
| `specs/a11y/a11y-smoke.spec.ts` | (in place) — rewire project dep only (D-04) | D-04 |
| `specs/visual/visual-regression.spec.ts` | (in place) — import path + project dep updates | D-06 |
| `specs/perf/performance-budget.spec.ts` | (in place) — import path + project dep updates | D-06 |
| `specs/candidate/candidate-bank-auth.spec.ts` | (in place) — project dep update | D-06 |
| `specs/perm/*.spec.ts` (24 specs) | (in place) — import path updates only | D-12/D-16 |

Visual screenshot baselines live at `specs/visual/__screenshots__/visual-regression.spec.ts/*.png` — keyed by spec FILENAME. Since the visual spec is NOT renamed, baselines are unaffected.

### WS5 — Seed templates (`packages/dev-seed/src/templates/`)

| Current path | Target | Decision |
|--------------|--------|----------|
| `templates/baseV1.ts` | `templates/e2e/base.ts` | D-01/D-10 |
| `templates/e2e.ts` | DELETE (content discarded) | D-01 |
| `templates/permutations/*.ts` (24 perm + `shared.ts`) | `templates/e2e/perm/*.ts` | D-02 |
| `templates/permutations/shared.ts` | `templates/e2e/perm/shared.ts` | D-02 |
| `templates/index.ts` (barrel + `BUILT_IN_TEMPLATES`) | remap exports/imports | D-01/D-02/D-10 |
| `templates/_helpers/*` | (in place — not e2e-specific) | — |
| `templates/default.ts`, `templates/defaults/*` | (in place) | — |
| `tests/templates/e2e.test.ts` | `tests/templates/base.test.ts` (RETARGET, not rename — §3) | D-03 |
| `tests/templates/e2e-app-settings.test.ts` | `tests/templates/base-app-settings.test.ts` (RETARGET) | D-03 |

`baseV1` has NO existing dev-seed test (grep `baseV1` in `packages/dev-seed/tests/` returns zero) — so retargeting loses no coverage and creates no duplicate. `[VERIFIED: grep -rln baseV1 packages/dev-seed/tests/ → empty]`

## Complete Reference Graph (the "must-update-transitively" side)

### A. `tests/playwright.config.ts` — full project graph (D-08 chokepoint)

One file, 798 lines. The graph has these families (project `name` → `testMatch`):

**Opt-in chain (env-gated; the D-06 MERGE target):**
- `data-setup` (`/data\.setup\.ts/`, teardown→`data-teardown`) — seeds old `e2e`; DELETE per D-06 (L95-99)
- `data-teardown` (`/data\.teardown\.ts/`) — DELETE per D-06 (L101-104)
- `auth-setup` (`/auth\.setup\.ts/`, `dependencies:['data-setup']`) — repoint to base (L106-110)
- `visual-regression` (`dependencies:['data-setup','auth-setup']`) — repoint to base+auth (L121-130)
- `performance` (`dependencies:['data-setup']`) — repoint to base (L133-142)
- `a11y-smoke` (`dependencies:['data-setup']`) — repoint to base (L146-155)
- `bank-auth` (`testMatch:/candidate-bank-auth\.spec\.ts/`, `dependencies:['data-setup']`) — repoint to base (L159-169)

**Base/journey chain (D-10 renames):**
- `data-setup-baseV1` (`/baseV1\.setup\.ts/`, teardown→`data-teardown-baseV1`, `dependencies:['perm-not-located-2e2cg']`) → `data-setup-base` / `/base\.setup\.ts/` (L191-202)
- `data-teardown-baseV1` (`/baseV1\.teardown\.ts/`) → `data-teardown-base` / `/base\.teardown\.ts/` (L204-206)
- `voter-mega-journey` (`testDir:'./tests/specs/voter'`, `/voter-mega-journey\.spec\.ts/`, `dependencies:['data-setup-baseV1']`) → `voter-journey` / `/voter-journey\.spec\.ts/` / dep `data-setup-base` (L208-214)

**Candidate chain (D-09 renames):**
- `data-setup-candidate-mega` (`/candidate-mega\.setup\.ts/`, teardown→`data-teardown-candidate-mega`, `dependencies:['data-setup-baseV1']`) → `data-setup-candidate-journey` / `/candidate-journey\.setup\.ts/` / dep `data-setup-base` (L445-450)
- `data-teardown-candidate-mega` (`/candidate-mega\.teardown\.ts/`) → `data-teardown-candidate-journey` (L451-454)
- `candidate-mega-journey` (`testDir:'./tests/specs/candidate'`, `/candidate-mega-journey\.spec\.ts/`, `dependencies:['data-setup-candidate-mega']`) → `candidate-journey` (L456-465)

**perm-* family (NO key rename — already perm-named; but several depend on the renamed nodes):**
- `data-setup-perm-1e1cg1co` is the FIRST perm node (no deps) (L243).
- `data-setup-baseV1.dependencies = ['perm-not-located-2e2cg']` (L201) — survives rename to `data-setup-base`.
- `data-setup-perm-disable-voter-app.dependencies = ['candidate-mega-journey']` (L484) → repoint to `candidate-journey`.
- All 24 perm setup `testMatch` regexes match basenames (`/perm-xxx\.setup\.ts/`) — moving files into `setup/perm/` does NOT break them (testMatch is path-substring, not absolute). `[VERIFIED: playwright testMatch regex semantics + L36 testIgnore]`

**`mega` literal in the config:** 37 occurrences (mostly comments + the candidate/voter project keys + testMatch regexes). `baseV1`: present in 3 project keys + comments. All must go to zero per D-09/D-10.

**testMatch survives relocation; project NAMES + dependency strings do not.** Moving a setup file into a subdir keeps its `/basename\.setup\.ts/` regex matching (the regex is unanchored). The renames that MATTER are: file basenames (mega→journey, baseV1→base), project `name:` strings, `dependencies:[...]` strings, and `teardown:` strings.

### B. dev-seed template-name resolution chokepoint

`packages/dev-seed/src/templates/index.ts`:
- `import { baseV1Template } from './baseV1'` (L17) → `from './e2e/base'`, symbol `baseTemplate`
- `import { e2eTemplate } from './e2e'` (L19) → DELETE
- 24 `import { perm…Template } from './permutations/perm-…'` (L20-41) → `from './e2e/perm/perm-…'`
- `BUILT_IN_TEMPLATES` map (L52-96): `e2e: e2eTemplate` → DELETE; `baseV1: baseV1Template` → `'e2e/base': baseTemplate` (D-01); 24 `'perm-…'` keys — **NAMES UNCHANGED** (these are invocation keys, not paths; D-02 moves FILES not invocation names — confirm with planner whether perm invocation keys also get an `e2e/perm/` prefix; CONTEXT.md only specifies file relocation).
- `BUILT_IN_OVERRIDES` map (L111-113): `default: defaultOverrides` only — no e2e/baseV1 override.
- Re-export block (L116-140): `BASE_V1_APP_SETTINGS, baseV1Template` (L116) → rename; `E2E_BASE_APP_SETTINGS, e2eTemplate` (L118) → DELETE `e2eTemplate`, keep/rename `E2E_BASE_APP_SETTINGS` (see note below); 24 perm re-exports → repath.

`packages/dev-seed/src/index.ts` re-exports `BASE_V1_APP_SETTINGS, baseV1Template` (L64-65) and `E2E_BASE_APP_SETTINGS` (L70) — package public surface. Consumers below import from `@openvaa/dev-seed`.

`resolve-template.ts` is GENERIC (path-vs-name dispatch only) — **no edit needed** unless the planner wants name-list doc strings updated (L36 mentions `'e2e'` in a JSDoc comment).

**`E2E_BASE_APP_SETTINGS` naming trap:** It is exported from `e2e.ts` (the DELETED file, L118 of index) but its NAME contains `e2e`. It is consumed by `e2e-app-settings.test.ts` and `variant-app-settings.test.ts`. Decide: does the merged base reuse `BASE_V1_APP_SETTINGS` (from baseV1.ts) or `E2E_BASE_APP_SETTINGS` (from e2e.ts, being deleted)? `baseV1.ts` exports `BASE_V1_APP_SETTINGS`; the base dataset survives, so `BASE_V1_APP_SETTINGS` → `BASE_APP_SETTINGS` is the natural rename, and `E2E_BASE_APP_SETTINGS` is deleted with `e2e.ts`. **FLAG for planner** — `variant-app-settings.test.ts` consumes `E2E_BASE_APP_SETTINGS` (already broken — see §6).

### C. Fixture import sites (per moved asset, path + line)

`[VERIFIED: grep across tests/]`

- **`voter-mega.fixture.ts`** (export `voterMegaTest`):
  - `specs/perm/perm-hide-if-missing-answers.spec.ts:35` `import { voterMegaTest as test } from '../../fixtures/voter-mega.fixture'`
  - `specs/perm/perm-disable-allow-open.spec.ts:47` same
  - `specs/visual/visual-regression.spec.ts:31` `voterMegaTest as voterTest`
  - `specs/perf/performance-budget.spec.ts:32` `voterMegaTest as voterTest`
  - `specs/a11y/a11y-smoke.spec.ts:40` `import { voterMegaTest }` + `.use()` L47 + tests L129/L140/L150
  - (comment-only refs in `perm-hide-category-tags.spec.ts:21`, `perm-hide-election-tags.spec.ts:22`, `voter-mega-journey.spec.ts:404/869`, `voterQuestionsPage.fixture.ts:19`, `feedbackDialog.fixture.ts:6`, `candidate-mega.ts:5`)
- **`views.ts`** (export `test`/`expect`):
  - `specs/voter/voter-mega-journey.spec.ts`, `specs/perm/perm-per-app-notifications.spec.ts`, `perm-disable-candidate-app.spec.ts`, `perm-missing-nominations.spec.ts`, `perm-header-show-feedback.spec.ts`, `perm-header-show-help.spec.ts` — all `from '../../fixtures/views'`
  - INTERNAL: `views.ts:25-27` imports `./entityDetails.fixture`, `./entityFilters.fixture`, `./resultsPage.fixture` + `./voter/voter*` (L28-30). Since views + the 3 entity fixtures ALL move to `voter/`, the `./entityX` imports stay valid; the `./voter/voterHomePage` imports become `./voterHomePage` (now siblings).
- **`resultsPage.fixture.ts`**: imported by `views.ts:27` (→ stays sibling) and `candidate/perm-l10n.ts:52` (`../resultsPage.fixture` → `../voter/resultsPage.fixture`).
- **`entityDetails.fixture.ts`** / **`entityFilters.fixture.ts`**: imported ONLY by `views.ts` (move together).
- **`emailBucket.fixture.ts`**: `candidate/candidate-mega.ts:46` (`./emailBucket.fixture` → `../shared/emailBucket.fixture`) + `candidate/perm-l10n.ts:48` (same repoint).
- **`langSelectorFixture.fixture.ts`**: `candidate/perm-l10n.ts:49` + `candidate/voterNavFixture.fixture.ts:32,35` (sibling import `./langSelectorFixture.fixture`). After moves: voterNav→`voter/`, langSelector→`shared/`, so voterNav must import `../shared/langSelectorFixture.fixture`.
- **`multilingualTextFieldFixture.fixture.ts`**: `candidate/perm-l10n.ts:50` only.
- **`voterNavFixture.fixture.ts`**: `candidate/perm-l10n.ts:51` (`./voterNavFixture.fixture` → `../voter/voterNavFixture.fixture`).
- **`candidate-mega.ts`** (export `test`/`expect`): `specs/candidate/candidate-mega-journey.spec.ts:30`, `specs/visual/visual-regression.spec.ts:30` (`from '../../fixtures/candidate/candidate-mega'` → `…/candidate-journey`).
- **`perm-l10n.ts`** (UNLISTED root): consumed by `perm-localisation-positive.spec.ts` (grep importer). Its internal imports L48-51 ALL repoint. Stays in `candidate/`.

### D. `minimalVoterResultsPage` (D-16) — extraction map

Defined INSIDE the single `voterMegaTest = base.extend<...>({...})` block at `voter-mega.fixture.ts:260-270`; declared in the `VoterMegaFixtures` type at L96; uses module-local helpers `navigateToFirstQuestion` (imported L59 from `../utils/voterNavigation`) + `answerAndAdvanceToResults` (defined L175, exported L275). Consumers:
- `specs/perm/perm-hide-if-missing-answers.spec.ts:40,46` (destructured fixture)
- `specs/perm/perm-disable-allow-open.spec.ts:82,84,96` (destructured fixture)

Both consumers import `voterMegaTest as test` (L35 / L47) and destructure `minimalVoterResultsPage` off it. **See verdict §3.**

### E. Prefix + freshness-guard sites (D-05/D-09)

- `setup/data.setup.ts:14` `const PREFIX = 'test-'`; L21 `BASELINE_SEED_PREFIX='seed_'`; freshness probe L35-71; literal `'test-candidate-alpha'` (L154,163); `TEST_CANDIDATE_EMAIL` import. (Whole file MERGED away per D-06.)
- `setup/setupFromTemplate.ts:78` `BASELINE_SEED_PREFIX='seed_'`; L164 `teardownPrefix = prefix.length>=2 ? prefix : 'test-'`; freshness probe L98-132. The "allowlist" is just `{template prefix} ∪ seed_`.
- `setup/baseV1.teardown.ts:23` `PREFIX='test-'`.
- `templates/baseV1.ts:349` `externalIdPrefix: ''` (writes literal `test-…` ids); base external_ids are `test-el-reg`, `test-el-mun`, `test-co-*`, `test-or-*` etc. (L357+). **If D-05 changes the base prefix to `test-e2e-base-`, EVERY `external_id: 'test-…'` literal in `baseV1.ts` must change to `test-e2e-base-…`, AND every spec assertion referencing those ids must change too** (see §6 FLAG-7).
- `templates/e2e.ts` external_ids are `test-…` literals (DELETED with the file).
- perm templates use `externalIdPrefix: 'e2e-perm-…-'` (24 files, const `P`). These contain the substring `e2e` but are the PERM-FAMILY namespace, NOT the base-dataset bare-`e2e`. **CONTEXT.md scope does not target these** (D-09 targets `mega`; D-01 retires the bare `e2e` TEMPLATE NAME + `test-e2e-`/`test-baseV1-` BASE prefixes). See §6 FLAG-3.
- `candidateMegaConstants.ts:54` `UNREGISTERED_CANDIDATE_EXTERNAL_ID = 'test-ca-aa-unregistered'` (no `mega` in the value; filename has `Mega`).

### F. Doc + script consumers of `--template e2e` / `BUILT_IN_TEMPLATES.e2e` (D-01)

- `tests/seed-test-data.ts:6` (JSDoc), `:22` `BUILT_IN_TEMPLATES.e2e`, `:23` error string → repoint to base.
- `tests/README.md` — 5 lines with `mega`/`baseV1`/`BUILT_IN_TEMPLATES.e2e` plus a STALE variant section (L136, L153, L272, L286, L292, L341) referencing deleted `variant-*` templates and the `data-setup` project. Substantial doc rewrite.
- `CLAUDE.md:285,286,293` `--template e2e` examples → `--template e2e/base` (and `--likert-only` note — note the base template is NOT likert-gated; verify the doc).
- `setup/data.setup.ts:88,92` `BUILT_IN_TEMPLATES.e2e` (merged away).

### G. `mega` token full footprint (D-09 "zero tokens")

40 files contain `mega` (grep verified). Breakdown: filenames to rename (4: `candidate-mega.ts`, `voter-mega.fixture.ts`, `candidate-mega.setup.ts`/`teardown.ts`, `candidateMegaConstants.ts`, plus the two journey specs + 2 READMEs); the rest are COMMENT/JSDoc references to those assets (e.g. `feedbackDialog.fixture.ts`, `timeouts.ts`, `testIds.ts`, `e2eFixtureRefs.ts`, `voterIntro.ts`, `views.ts`, many perm specs/setups). All comment refs must be updated to the new names to hit "zero tokens." No `mega` appears as a load-bearing identifier in business logic — they are file/symbol names + their textual references.

`baseV1` token footprint: 25 files (3 project keys + symbol `baseV1Template`/`BASE_V1_APP_SETTINGS` + many comment refs).

## Decision Verdicts

### D-16 — `minimalVoterResultsPage` extraction: CLEAN CUT (pure relocation), with a fixture-graph caveat

The variant is self-contained: it calls `navigateToFirstQuestion(page)` then `answerAndAdvanceToResults(page, answerMode, answerCount)` then `use(page)` (L260-270). No coupling to the multi-election/full-journey data — it is explicitly authored for the MINIMAL (1-election/1-constituency) perm datasets (L82-94 docstring). The "rewrite only if needed" branch does NOT trigger.

**Mechanics the planner must specify:** Extraction is NOT a copy-paste of one property — `minimalVoterResultsPage` lives inside a `base.extend` and shares the `answerMode`/`answerCount` options. To move it to `fixtures/voter/minimalVoterResultsPage.fixture.ts` you create a NEW `base.extend<{answerMode; answerCount; minimalVoterResultsPage}>` that re-imports `navigateToFirstQuestion` (from `../utils/voterNavigation` — note new relative depth from `voter/`) and `answerAndAdvanceToResults` (now exported from `voter/voter-journey.fixture.ts`). The two consumers (`perm-hide-if-missing-answers.spec.ts`, `perm-disable-allow-open.spec.ts`) must switch their `import { voterMegaTest as test }` to `import { minimalVoterResultsTest as test } from '…/voter/minimalVoterResultsPage.fixture'`. Verify these two specs use ONLY `minimalVoterResultsPage` (not also `answeredVoterPage`) — grep confirms they only reference `minimalVoterResultsPage`, so the swap is clean.

### D-03 — dev-seed template tests: RETARGET = REWRITE (not a rename), and baseV1 has no prior coverage

`e2e.test.ts` (500 lines) + `e2e-app-settings.test.ts` assert the e2eTemplate shape: single-election (`elections.fixed.length===1`), `test-election-1`/`test-constituency-alpha`, 18 candidates, 22 nominations, 18/25 questions, specific external_ids (`test-candidate-alpha` etc.). The base (`baseV1.ts`) dataset is structurally DIFFERENT: 2 elections (`test-el-reg`/`test-el-mun`), 6 constituencies, `test-or-*` orgs, different question groups. **You cannot mechanically rename these tests — every assertion's expected value changes.** The honest characterisation: author NEW `base.test.ts` + `base-app-settings.test.ts` asserting the base dataset's actual shape (row counts + key external_ids derived by reading `baseV1.ts`), and delete the e2e assertions. This is "retarget" in intent but a from-scratch rewrite in mechanics.

`baseV1` currently has ZERO dev-seed tests (`grep baseV1 packages/dev-seed/tests/` empty), so retargeting LOSES no coverage and DUPLICATES nothing. Verdict: **author fresh base.test.ts/base-app-settings.test.ts; do not attempt a sed-rename of the e2e assertions.** Budget this as real work, not a move.

### D-06 — base-chain merge repoint list

After collapsing `data-setup`/`data-teardown` (old `e2e`) into the single base chain (`data-setup-base`/`data-teardown-base`, formerly baseV1), repoint these projects' `dependencies`:
- `auth-setup`: `['data-setup']` → `['data-setup-base']` (L109)
- `visual-regression`: `['data-setup','auth-setup']` → `['data-setup-base','auth-setup']` (L127)
- `performance`: `['data-setup']` → `['data-setup-base']` (L139)
- `a11y-smoke`: `['data-setup']` → `['data-setup-base']` (L153) — see D-04
- `bank-auth`: `['data-setup']` → `['data-setup-base']` (L166)

**Sequencing caveat:** these are env-gated opt-in projects (`PLAYWRIGHT_VISUAL/PERF/A11Y/BANK_AUTH`). The base chain (`data-setup-base`) currently has `dependencies:['perm-not-located-2e2cg']` (anchored after the perm family). When the opt-in projects depend on `data-setup-base`, they inherit that anchor — fine for default runs (opt-ins disabled), but when an opt-in flag is set, `data-setup-base` will wait on the whole perm family. That is the EXISTING behaviour for the baseV1 chain, so no NEW conflict — but the planner should confirm an opt-in-only run still seeds (the perm chain must also be enabled or the dependency must be conditioned). **FLAG-6**: today the opt-in chain seeds its OWN `data-setup` (no perm dep); merging onto `data-setup-base` couples opt-ins to the perm-family anchor. Recommend the planner make `data-setup-base`'s perm anchor conditional, OR give opt-ins an independent base-seed path. This is the one genuine graph-design decision in the merge.

### D-04 — a11y shares the base chain: SAFE; premise partially stale

The a11y SPEC already consumes `voterMegaTest` (the baseV1/base fixture) for its located routes (`a11y-smoke.spec.ts:40,129,140,150`) and raw `page.goto` for unlocated routes. It does NOT read the old `e2e` dataset's data. The only stale wiring is the PLAYWRIGHT PROJECT dependency: `a11y-smoke.dependencies = ['data-setup']` (old e2e chain) while its fixtures walk base data. Post-merge it points to `data-setup-base` — which is exactly the data its fixtures already expect. **No new setup/teardown files; no DB-ordering conflict** (the a11y project is a leaf consumer; it shares the base SEED but each opt-in spec runs against the already-seeded base, and teardown is owned by `data-teardown-base`). The "dedicated a11y setup" fallback is NOT needed. Spec "data updates" (CONTEXT D-04) are minimal — the spec already targets base data; only its import path (`voter-mega.fixture` → `voter/voter-journey.fixture`) and any `mega` comment refs change.

## Greenness + Commit-Sequencing Strategy

### Cheap gates (run per commit; no `yarn dev` needed)
1. `yarn typecheck:tests` — `tsc -p tests/tsconfig.json --noEmit`. **VERIFIED green at baseline (exit 0).** Catches every broken import path immediately. This is the single most valuable gate for a relocation refactor.
2. `eslint --flag v10_config_lookup_from_file tests` — lint gate (part of `lint:check`).
3. `yarn workspace @openvaa/dev-seed test:unit` — template-shape tests. **NOT green at baseline (see FLAG-1)** — 2 pre-existing failures. The planner must either (a) fix/quarantine these first as a Wave-0 task, or (b) scope the gate to the specific test files touched.
4. `node "$HOME/.claude/get-shit-done/bin/…"` N/A — use `npx playwright test --list -c tests/playwright.config.ts` to verify the project graph RESOLVES (parses + dependency keys valid) WITHOUT running specs. This is a cheap structural gate for D-08.

### Expensive gate (run once at phase end; requires `yarn dev` + Supabase)
- `yarn test:e2e` — full Playwright suite. The only gate that proves data seeding + spec behaviour. Per operator memory, treat any "did not run" as failure.

### Atomicity requirements (which moves MUST be one commit with their rewires)
- **Each fixture move + ALL its importers' path updates = one commit.** A move without rewire leaves a broken import (typecheck red). E.g. `emailBucket.fixture.ts` move + edits to `candidate-mega.ts:46` + `perm-l10n.ts:48` in the SAME commit.
- **`views.ts` + the 3 entity fixtures = one commit** (they cross-import; move as a group, then update the 6 external importers).
- **`voterNavFixture` + `langSelectorFixture` interact** — voterNav imports langSelector. Safest: move both in one commit (voterNav→voter/, langSelector→shared/) updating voterNav's import + perm-l10n's two imports together.
- **Template rename `baseV1.ts`→`e2e/base.ts`** = one commit touching `templates/index.ts` (import + map key + re-export), `src/index.ts` re-exports, `setupFromTemplate('baseV1')`→`'base'`, and the setup file rename. Typecheck + dev-seed test:unit gate.
- **playwright.config rewrite (D-08)** can be its own commit AFTER all file basenames are final (it references basenames via testMatch + project keys). Gate with `playwright test --list`.
- **Prefix change (D-05, IF base prefix actually changes)** must be atomic across `baseV1.ts` external_id literals + every spec assertion + freshness-guard + teardown PREFIX — this is the highest-risk atomic unit (see FLAG-7). Recommend the planner evaluate whether the base-prefix rename is worth the blast radius vs. keeping `test-` (CONTEXT D-05 locks `test-e2e-base-`, but the researcher flags the cost).

### Recommended order
1. Wave 0: resolve/quarantine the 2 pre-existing dev-seed test failures (FLAG-1) so the gate is trustworthy.
2. Fixture moves (WS1) — per-asset atomic commits, typecheck-gated. Include perm-l10n repoints.
3. `minimalVoterResultsPage` extraction (D-16).
4. Template restructure (WS5) — `baseV1`→`e2e/base`, delete `e2e.ts`, move permutations, retarget tests (D-03 rewrite). dev-seed test:unit-gated.
5. Setup taxonomy moves + base-chain merge (WS2/D-06) — setup files into shared/voter/candidate/perm.
6. Spec renames (WS3/WS4) — journey spec renames + a11y/visual/perf/bank import + comment updates.
7. playwright.config full rewrite (D-08) — `--list` gate.
8. Prefix rename (D-05/D-09 data prefixes) — if in scope after FLAG-7 reconciliation.
9. Docs (README/CLAUDE.md) + final `grep` zero-token proof.
10. Expensive gate: full `yarn test:e2e`.

### Phase 92 freshness-guard mechanism (do not break)
The guard is `probeFreshDatabasePrecondition(client, prefix)` in BOTH `setupFromTemplate.ts:98` and `data.setup.ts:35`. It queries `candidates`/`organizations` for rows whose `external_id` is `NOT LIKE {prefix}%` AND `NOT LIKE seed_%`, warns (or fails if `E2E_REQUIRE_FRESH_DB=true`). The "allowlist" is exactly `{the active template prefix} ∪ 'seed_'`. When D-05 changes the base prefix to `test-e2e-base-`, the guard's `prefix` arg (derived from `template.externalIdPrefix` or the `'test-'` fallback at `setupFromTemplate.ts:164`) automatically follows IF the template's `externalIdPrefix` is set to the new value. The `data.setup.ts` mirror is being DELETED (D-06), so only `setupFromTemplate.ts` survives — one guard site post-merge. `[VERIFIED: setupFromTemplate.ts:98-132, data.setup.ts:35-71]`

## Validation Architecture

> nyquist_validation key absent from `.planning/config.json` → treated as ENABLED.

### Test Framework
| Property | Value |
|----------|-------|
| Framework (E2E) | Playwright (`tests/playwright.config.ts`) |
| Framework (dev-seed) | Vitest (`packages/dev-seed`, `test:unit`) |
| Type gate | `tsc -p tests/tsconfig.json --noEmit` |
| Quick run command | `yarn typecheck:tests && eslint --flag v10_config_lookup_from_file tests` |
| Project-graph resolve | `npx playwright test --list -c tests/playwright.config.ts` |
| Full suite command | `yarn test:e2e` (requires `yarn dev`) |

### Validation signals (rename/relocation refactor)
| Signal | Command | Cost | Proves |
|--------|---------|------|--------|
| Typecheck clean | `yarn typecheck:tests` | cheap | every import path resolves |
| Lint clean | `eslint … tests` | cheap | style + no-unused after moves |
| dev-seed templates pass | `yarn workspace @openvaa/dev-seed test:unit` | cheap | template shapes (after D-03 retarget) |
| Graph resolves | `playwright test --list` | cheap | project keys + deps + testMatch valid |
| Zero stale tokens | `grep -rn "mega\|baseV1" tests/ packages/dev-seed/src/` returns only intended-survivors (ideally empty) | cheap | D-09/D-10 invariant |
| Full suite green | `yarn test:e2e` | expensive | data seeding + spec behaviour |

### Sampling rate
- **Per task commit:** quick trio (typecheck + lint + scoped dev-seed test:unit) + `playwright --list` when config touched.
- **Per workstream merge:** full dev-seed `test:unit` + `playwright --list` + token grep.
- **Phase gate:** full `yarn test:e2e` green + zero-token grep proof.

### Wave 0 gaps
- [ ] Resolve the 2 pre-existing dev-seed `test:unit` failures (FLAG-1) so the gate is meaningful: `e2e.test.ts` (25≠18 — moot after D-03 rewrite) and `variant-app-settings.test.ts` (imports deleted `setup/templates/variant-constituency`).
- [ ] Confirm `playwright test --list` parses today (establish graph baseline before D-08 rewrite).
- [ ] No NEW test files required — phase adds zero coverage.

## Flags: locked-decision premises the codebase contradicts or extends

**FLAG-1 (HIGH) — dev-seed `test:unit` is NOT green at baseline.** Two pre-existing failures: `packages/dev-seed/tests/templates/e2e.test.ts` (`questions.fixed.length` expected 18, got 25 — the e2e template drifted from its test) and `packages/dev-seed/tests/templates/variant-app-settings.test.ts` (`Cannot find module '../../../../tests/tests/setup/templates/variant-constituency'` — that file is git-DELETED, confirmed). The planner cannot treat "dev-seed test:unit green" as a clean gate without a Wave-0 fix. The e2e.test.ts failure is mooted by D-03 (rewritten against base); the variant-app-settings.test.ts failure is unrelated to D-01..D-16 but sits in the same vitest run — recommend quarantine or fix as Wave 0. `[VERIFIED: yarn workspace @openvaa/dev-seed test:unit → EXIT 1, 2 files failed]`

**FLAG-2 (HIGH) — `perm-l10n.ts` is an UNLISTED consumer that the D-13/D-14 moves break.** `tests/tests/fixtures/candidate/perm-l10n.ts` (a second candidate composition root, sibling to `candidate-mega.ts`, consumed by `perm-localisation-positive.spec.ts`) imports four fixtures that D-13/D-14 relocate out of `candidate/`: `emailBucket`, `langSelectorFixture`, `multilingualTextFieldFixture` (→ shared/), `voterNavFixture` (→ voter/) — at L48-51. Plus `../resultsPage.fixture` (L52→`../voter/`). CONTEXT.md/ROADMAP never name perm-l10n.ts. The planner MUST add its import repoints to the fixture-move tasks or `perm-localisation-positive.spec.ts` breaks. `[VERIFIED: perm-l10n.ts:48-52]`

**FLAG-3 (MEDIUM) — perm templates carry `e2e-perm-*` external_id prefixes; scope of "no bare e2e" is ambiguous.** D-01 retires the bare `e2e` TEMPLATE NAME and D-05 replaces the BASE `test-e2e-`/`test-baseV1-` prefixes. The 24 perm templates use `externalIdPrefix: 'e2e-perm-…-'` (the perm-family namespace), which contains the substring `e2e` but is NOT the base dataset's bare-`e2e`. CONTEXT.md does not target these. Recommend the planner explicitly DECLARE perm `e2e-perm-` prefixes OUT OF SCOPE (they are a stable separate namespace), so a naive `grep e2e` zero-token check does not over-reach. `[VERIFIED: grep externalIdPrefix permutations/*.ts]`

**FLAG-4 (MEDIUM) — D-02 moves perm FILES but the invocation NAMES are flat keys, not paths.** Perm templates are registered in `BUILT_IN_TEMPLATES` as flat string keys (`'perm-1e1cg1co'` etc., index.ts:56-95), invoked by setup via `setupFromTemplate('perm-…')`. Moving the files to `e2e/perm/*` changes only the `import` PATHS in `index.ts`, not the map KEYS. CONTEXT.md D-02 says "move under e2e/perm/*" (file relocation) — confirm whether the planner should ALSO prefix the invocation keys (`'perm-…'` → `'e2e/perm/…'`). If keys change, every `setupFromTemplate('perm-…')` call site (24 setup files) + the `--list`-time resolution change. Recommend keeping invocation keys FLAT (files relocated, names unchanged) unless the operator wants the e2e/ namespace at invocation too — only `e2e/base` was explicitly chosen as an invocable name (D-01). `[VERIFIED: index.ts:52-96, setupFromTemplate.ts:147]`

**FLAG-5 (MEDIUM) — `candidateMegaConstants.ts` is an unlisted `mega` filename.** `tests/tests/utils/candidateMegaConstants.ts` (imported by `candidate-mega.setup.ts:27`, `candidate-mega.teardown.ts:15`) carries `mega` in its filename. D-09 ("zero mega tokens, internal identifiers") implies renaming it to e.g. `candidateJourneyConstants.ts` + updating both importers. CONTEXT.md does not name it. `[VERIFIED: find + grep]`

**FLAG-6 (MEDIUM) — D-06 merge couples opt-in projects to the perm-family anchor.** Today the opt-in chain (visual/perf/a11y/bank) seeds its OWN `data-setup` with NO perm dependency. The base chain (`data-setup-baseV1`) has `dependencies:['perm-not-located-2e2cg']` (L201). Merging opt-ins onto `data-setup-base` makes an opt-in-only run wait on the perm family (which may be disabled in that run → unmet dependency or no seed). The planner needs a graph-design call: condition the perm anchor on default-mode, or give opt-ins an independent base seed. This is the one substantive design decision the merge surfaces; D-06 does not address it. `[VERIFIED: playwright.config.ts:89-169, 191-202]`

**FLAG-7 (HIGH) — D-05 base-prefix rename (`test-e2e-base-`) has a large blast radius.** `baseV1.ts` writes literal `external_id: 'test-…'` values (L357+) with `externalIdPrefix: ''`. Changing the canonical prefix to `test-e2e-base-` means rewriting EVERY `external_id` literal in `baseV1.ts` AND every spec assertion that references those ids by literal (voter-journey, candidate-journey, a11y, visual, perf, and the perm specs that read base data) AND the teardown `PREFIX`. This is the single largest atomic unit and the most error-prone. The decision is LOCKED (D-05 chose `test-e2e-base-` for consistency), but the researcher flags that keeping `test-` would be far lower-churn — the planner should confirm the operator accepts the assertion-rewrite cost, or treat the prefix rename as a clearly-bounded separate workstream with its own full-suite gate. `[VERIFIED: baseV1.ts:349,357+; baseV1.teardown.ts:23]`

**FLAG-8 (LOW) — `setup/voter/` (D-07) has no asset to hold.** There is no voter-journey-specific setup file today; the voter-journey chain depends directly on `data-setup-baseV1`. The `setup/voter/` directory will be empty after the moves unless the merge creates a voter-specific setup. Planner may create `setup/voter/.gitkeep` or omit the dir. `[VERIFIED: find tests/tests/setup; playwright.config.ts:208-214]`

**FLAG-9 (LOW) — `E2E_BASE_APP_SETTINGS` symbol is exported from the DELETED `e2e.ts`.** `templates/index.ts:118` re-exports `E2E_BASE_APP_SETTINGS` from `./e2e` (deleted per D-01). It is consumed by `e2e-app-settings.test.ts` (retargeted) and `variant-app-settings.test.ts` (already broken, FLAG-1). The base dataset's equivalent is `BASE_V1_APP_SETTINGS` (from baseV1.ts, L116). Decide the surviving name (recommend `BASE_APP_SETTINGS`) and update `src/index.ts:70` + consumers. `[VERIFIED: index.ts:116-118, src/index.ts:64-70]`

**FLAG-10 (LOW) — stale `tests/README.md` variant section.** README L136-341 documents `data-setup`, `BUILT_IN_TEMPLATES.e2e`, and `variant-*` templates that are git-deleted. The D-01 doc-update touches more than the 3 `--template e2e` lines — a section rewrite is warranted to avoid leaving documentation describing deleted infrastructure. `[VERIFIED: grep README.md]`

## Sources

### Primary (HIGH confidence — on-disk verified this session)
- `tests/playwright.config.ts` (full read) — project graph, dependency chains, testMatch
- `packages/dev-seed/src/templates/index.ts` (full read) — BUILT_IN_TEMPLATES registry
- `packages/dev-seed/src/cli/resolve-template.ts`, `cli/seed.ts` (full read) — name resolution
- `tests/tests/setup/{setupFromTemplate,data.setup,baseV1.setup,baseV1.teardown,candidate-mega.setup,candidate-mega.teardown}.ts` (full read)
- `tests/tests/fixtures/voter-mega.fixture.ts` (full read) — minimalVoterResultsPage
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` (full read) — D-04
- `packages/dev-seed/tests/templates/e2e.test.ts` + `e2e-app-settings.test.ts` (read) — D-03
- `packages/dev-seed/src/templates/baseV1.ts` (structure grep)
- `grep`/`find` inventories across `tests/` and `packages/dev-seed/`
- Live runs: `yarn typecheck:tests` (exit 0), `yarn workspace @openvaa/dev-seed test:unit` (exit 1, 2 failures)
- `.planning/config.json`, `tests/package.json`/root `package.json` (commands)

## Metadata

**Confidence breakdown:**
- Current-state inventory: HIGH — every path verified by `find`/`Read`.
- Reference graph: HIGH — grep-verified import/config/prefix sites with line numbers.
- Decision verdicts: HIGH — read the actual fixture/spec/template bodies.
- Greenness mechanics: HIGH — commands verified by live execution.
- Scope flags: HIGH for FLAG-1/2/7 (verified breakage/cost), MEDIUM where a planner judgment call remains (FLAG-3/4/6).

**Research date:** 2026-06-03
**Valid until:** ~7 days (active working tree with in-flight deletions; re-verify on-disk state before execution).

## RESEARCH COMPLETE
