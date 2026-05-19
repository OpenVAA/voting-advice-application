# `tests/` — End-to-end test suite

Playwright-driven cross-monorepo E2E tests covering the voter app, candidate app, and the configuration-variant matrix. Configuration: [`tests/playwright.config.ts`](./playwright.config.ts). Seed data is produced by [`@openvaa/dev-seed`](../packages/dev-seed/) via the project's `data-setup` / `variant-*-setup` projects.

## Run

```bash
# Prereqs: yarn install && (in another shell) yarn dev
yarn test:e2e                          # full suite — ~8-12 min wall clock with 6 workers
yarn test:e2e --project=voter-app      # one project (still pulls in its dependency chain)
yarn test:e2e --grep "DETERM-12"       # filter by tag/title
yarn test:e2e --reporter=line          # less noisy output
```

Opt-in specialised projects (default-off, env-gated):

```bash
PLAYWRIGHT_VISUAL=1     yarn test:e2e --project=visual-regression
PLAYWRIGHT_PERF=1       yarn test:e2e --project=performance
PLAYWRIGHT_A11Y=1       yarn test:e2e --project=a11y-smoke
PLAYWRIGHT_BANK_AUTH=1  yarn test:e2e --project=bank-auth
```

Per-spec smokes (skip the variant chain — dramatically faster):

```bash
npx playwright test -c tests/playwright.config.ts \
  --project=voter-app voter-detail.spec.ts --reporter=line
```

If the voter fixtures fail with timeouts past the first 16 Likert questions, seed in Likert-only mode and rerun manually (the default `data-setup` does **not** apply this filter):

```bash
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean
# then in another terminal:
yarn dev
# then in a third terminal:
npx playwright test -c tests/playwright.config.ts --project=voter-app voter-detail.spec.ts
```

---

## Concurrency model

- `workers: 6` (non-CI default; `1` on CI). The 6-worker pool is **global** across all projects.
- `fullyParallel: true` is the global default — files within a project run concurrently unless the project overrides `fullyParallel: false`.
- Project-level `dependencies: [...]` enforces "runs after". A project becomes eligible the moment all its dependencies finish; multiple eligible projects then share the worker pool.
- `teardown: '<project>'` runs the named teardown project after this project and all its transitive dependents complete.

### Dependency DAG (default suite, no opt-in env vars)

```
                            ┌────────────────┐
                            │   data-setup   │  (root; 1 test)
                            └────────┬───────┘
        ┌────────────────────────────┼─────────────────────────────┐
        ▼                            ▼                              ▼
 ┌──────────────┐         ┌──────────────────────┐         ┌──────────────────────┐
 │  auth-setup  │         │       voter-app      │         │  voter-app-settings  │
 │  (1 test)    │         │ (13 specs, parallel) │         │  (1 spec, serial)    │
 └──────┬───────┘         └──────────────────────┘         └──────────┬───────────┘
        ▼                                                              ▼
 ┌─────────────────┐                                        ┌────────────────────┐
 │  candidate-app  │ (3 specs, serial)                      │  voter-app-popups  │
 └────────┬────────┘                                        │  (1 spec, serial)  │
          │                                                 └────────────────────┘
          ├─────────────────────────┐
          ▼                         ▼
 ┌──────────────────────┐   ┌─────────────────┐
 │ candidate-app-       │   │  re-auth-setup  │
 │ mutation             │   │  (1 test)       │
 │ (2 specs, serial)    │   └────────┬────────┘
 └──────────┬───────────┘            │
            ▼                        │
 ┌──────────────────────┐            │
 │ candidate-app-       │            │
 │ validation           │            │
 │ (1 spec, serial)     │            │
 └──────────┬───────────┘            │
            └─────────┬──────────────┘
                     ▼
                            ┌─────────────────────┐
                            │ candidate-app-      │
                            │ settings (1 spec)   │
                            │ (joins both above)  │
                            └────────┬────────────┘
                                     ▼
                            ┌─────────────────────┐
                            │ candidate-app-      │
                            │ password (1 spec)   │
                            └────────┬────────────┘
                                     │ — ALL ABOVE MUST FINISH HERE —
                                     ▼
              STRICTLY SEQUENTIAL VARIANT PIPELINE (1 active worker at a time):

  data-setup-multi-election ─→ variant-multi-election
        ─→ data-setup-results-sections ─→ variant-results-sections
        ─→ data-setup-constituency ─→ variant-constituency
        ─→ data-setup-startfromcg ─→ variant-startfromcg
        ─→ data-setup-low-minimum-answers ─→ variant-low-minimum-answers
        ─→ data-setup-1e-Nc ─→ variant-1e-Nc
        ─→ data-setup-Ne-Nc ─→ variant-Ne-Nc ─→ voter-not-located-redirect
        ─→ data-setup-allowopen ─→ variant-allowopen
        ─→ data-setup-hidden-required ─→ variant-hidden-required-voter
                                     ─→ variant-hidden-required-candidate

                                     ▼
                          ┌──────────────────────────┐
                          │  data-teardown           │  cleanup for default suite
                          │  data-teardown-variants  │  cleanup after variant chain
                          └──────────────────────────┘
```

### Wave-by-wave concurrency

| Wave | Active projects (parallel) | Workers used | Notes |
|-----:|---------------------------|-------------:|-------|
| 0 | `data-setup` | 1/6 | Root; seeds e2e template |
| 1 | `auth-setup`, `voter-app`, `voter-app-settings` | up to 6/6 | voter-app claims most workers; auth-setup exits fast |
| 2 | `candidate-app`, `voter-app` (tail), `voter-app-settings` (tail) | up to 6/6 | candidate-app is serial within itself |
| 3 | `candidate-app-mutation`, `re-auth-setup`, `voter-app-popups` | up to 3/6 | mutation is serial within project (post-fix to remove Supabase-admin row race) |
| 4 | `candidate-app-validation` | 1/6 | Single spec, serial (Alpha-login + file-chooser serialisation) |
| 5 | `candidate-app-settings` | 1/6 | Joins `re-auth-setup` + `candidate-app-validation`; single spec, no parallelism |
| 6 | `candidate-app-password` | 1/6 | Single spec — runs LAST in default suite (token-revoking) |
| 7–26 | Variant chain (20 projects — `data-setup-results-sections` inserted between `variant-multi-election` and `variant-results-sections` for true dataset isolation; also includes `voter-not-located-redirect` reusing the Ne-Nc seed) | **1/6** | Strictly sequential — variant chain pins the wall-clock floor |
| 26 | `data-teardown`, `data-teardown-variants` | 2/6 | Both teardowns parallel-eligible |

---

## Project inventory

Legend: **Parallel** = `fullyParallel: true` (specs within run concurrently); **Serial** = `fullyParallel: false` (one spec at a time within the project).

| # | Project | Spec(s) | Dataset | Filter / modifier | Within-project | Auth state | Notes |
|---|---------|---------|---------|-------------------|----------------|------------|-------|
| 0 | `data-setup` | `data.setup.ts` | `BUILT_IN_TEMPLATES.e2e` | none | n/a | — | Seeds the base e2e dataset (2 elections × multi-constituency, mixed opinion-question types) |
| 0 | `data-teardown` | `data.teardown.ts` | — | — | n/a | — | Cleans up after `data-setup` |
| 1 | `auth-setup` | `auth.setup.ts` | inherits `data-setup` | — | n/a | logs in as `test-candidate-alpha`; saves storageState | Required by every candidate-app project |
| 2 | `voter-app` | 12 specs (see below) | inherits `data-setup` | none (mixed types) | **Parallel** | empty (anonymous voter) | Read-only with respect to global app settings; testIgnore excludes `voter-settings.spec.ts`, `voter-popups.spec.ts`, `voter-visibility-required.spec.ts`, `voter-not-located-redirect.spec.ts` |
| 2 | `voter-app-settings` | `voter-settings.spec.ts` | inherits `data-setup` | none | **Serial** | empty | **Mutates global `app_settings`** — must run alone |
| 3 | `voter-app-popups` | `voter-popups.spec.ts` | inherits `data-setup` | none | **Serial** | empty | **Mutates `app_settings.results.{showFeedbackPopup,showSurveyPopup}`** — depends on `voter-app-settings` so the two settings-mutating projects serialise |
| 2 | `candidate-app` | `candidate-auth.spec.ts`, `candidate-questions.spec.ts`, `candidate-translation.spec.ts` | inherits `data-setup` | none | **Serial** | Alpha via STORAGE_STATE | Serial to avoid Supabase-session race on shared storageState |
| 3 | `candidate-app-mutation` | `candidate-registration.spec.ts`, `candidate-profile.spec.ts` | inherits `data-setup` | none | **Serial** | Alpha via STORAGE_STATE | Uses **fresh** invite-created candidates (not Alpha) for mutations to avoid wiping Alpha's row. **Serial** because registration's password-reset flow + profile's ToU + image-upload updates touch overlapping candidate rows via Supabase admin — running in parallel produced an order-of-operations race on the addendum candidates' `terms_of_use_accepted` flag. `candidate-profile-validation.spec.ts` is split into its own `candidate-app-validation` project (row below). |
| 4 | `candidate-app-validation` | `candidate-profile-validation.spec.ts` | inherits `data-setup` | none | **Serial** | Alpha via STORAGE_STATE | A11Y-01 reject-path cells; logs in as Alpha. Depends on `candidate-app-mutation`; reverse-sequenced before `candidate-app-settings` via the latter's `dependencies` list (avoids the maintenance-mode race the parallel layout introduced). |
| 3 | `re-auth-setup` | `re-auth.setup.ts` | — | — | n/a | re-logs Alpha; refreshes storageState | Required because some mutation specs revoke refresh tokens |
| 5 | `candidate-app-settings` | `candidate-settings.spec.ts` | inherits `data-setup` | none | Parallel (default) | Alpha via STORAGE_STATE | **Mutates global `app_settings`** (header.show*, maintenance, etc.). Depends on **both** `re-auth-setup` and `candidate-app-validation` — joins those two parallel branches before mutating global settings. |
| 6 | `candidate-app-password` | `candidate-password.spec.ts` | inherits `data-setup` | none | Parallel (default) | Alpha via STORAGE_STATE | Last in candidate chain — `updateUser({password})` revokes refresh tokens |
| 7–24 | Variant chain — strictly sequential | see [Variant chain](#variant-chain) below | per-variant template overlays | per-variant filter | mostly **Serial** | varies | One project at a time |
| 25 | `data-teardown-variants` | `variant-data.teardown.ts` | — | — | n/a | — | Cleans up `test-`-prefixed variant rows |

### Variant chain

Each variant project re-seeds the database with an overlay on top of `BUILT_IN_TEMPLATES.e2e`. The variant's `runTeardown('test-')` clears prior `test-`-prefixed rows before re-seeding, so each variant starts from a clean test-prefixed namespace (operator's own dev-seeded rows under different external_id prefixes are preserved).

| Order | Project | Spec(s) | Template | Filter | What the overlay does |
|------:|---------|---------|----------|--------|----------------------|
| 1 | `data-setup-multi-election` | `variant-multi-election.setup.ts` | `templates/variant-multi-election.ts` | **`applyLikertOnlyFilter`** | Adds Election-2 + cross-nominations; required by multi-election + results-sections tests (assert 5-choice Likert via `.nth(2)`) |
| 2 | `variant-multi-election` | `multi-election.spec.ts` | (consumes overlay above) | — | CONF-01/02/04 — multi-election navigation + results |
| 2a | `data-setup-results-sections` | `variant-multi-election.setup.ts` (re-run) | `templates/variant-multi-election.ts` | **`applyLikertOnlyFilter`** | Phase 86.1 post-fix — re-seeds the multi-election overlay so `variant-results-sections` starts from a guaranteed 2-elections shape, isolated from any state-leak the `variant-multi-election` spec may have introduced. Same setup file as project #1; each project runs it in its own worker. |
| 3 | `variant-results-sections` | `results-sections.spec.ts` | (consumes the freshly-reseeded overlay above) | — | CONF-05/06 — `results.sections` config matrix (candidate-only / org-only / both) |
| 4 | `data-setup-constituency` | `variant-constituency.setup.ts` | `templates/variant-constituency.ts` | **`applyLikertOnlyFilter`** ([2026-05-16 Path A1](.planning/phases/86.1-pre-phase-87-convergence-sweep-drive-v2-10-e2e-suite-to-all-/)) | Region/municipality hierarchy + Election-2 scoping (CONF-03) |
| 5 | `variant-constituency` | `constituency.spec.ts` | (consumes overlay above) | — | Constituency selection flow + hierarchical implication + missing-nomination warning |
| 6 | `data-setup-startfromcg` | `variant-startfromcg.setup.ts` | `templates/variant-startfromcg.ts` | none | startFromConstituencyGroup reversed flow + orphan-municipality edge case |
| 7 | `variant-startfromcg` | `startfromcg.spec.ts` | (consumes overlay above) | — | Constituencies selected BEFORE elections |
| 8 | `data-setup-low-minimum-answers` | `variant-low-minimum-answers.setup.ts` | `templates/variant-low-minimum-answers.ts` | none | Settings-only overlay — lowers `minimumAnswers` so E2E-02 can browse without matching |
| 9 | `variant-low-minimum-answers` | `voter-browse-without-match.spec.ts` | (consumes overlay above) | — | E2E-02 — voter browses entity list with sub-minimum answers |
| 10 | `data-setup-1e-Nc` | `variant-1e-Nc.setup.ts` | `templates/variant-1e-Nc.ts` | none | E2E-04 cell 2 — 1 election × 3 constituencies; constituency selector shown |
| 11 | `variant-1e-Nc` | `1e-Nc.spec.ts` | (consumes overlay above) | — | Matrix contract: election selection bypassed, constituencies displayed |
| 12 | `data-setup-Ne-Nc` | `variant-Ne-Nc.setup.ts` | `templates/variant-Ne-Nc.ts` | none | E2E-04 cell 4 — 2 elections × 3 constituencies each |
| 13 | `variant-Ne-Nc` | `Ne-Nc.spec.ts` | (consumes overlay above) | — | Matrix contract: cross-bleed-free constituency dropdown filtering |
| 13a | `voter-not-located-redirect` | `voter-not-located-redirect.spec.ts` | (reuses Ne-Nc overlay) | — | CLEAN-02 — deferred-target `?next=` round-trip + open-redirect whitelist; requires multi-election × multi-constituency to exercise both selector pages |
| 14 | `data-setup-allowopen` | `variant-allowopen.setup.ts` | `templates/variant-allowopen.ts` | none | SETTINGS-02 — `customData.allowOpen` flipped on a subset of questions |
| 15 | `variant-allowopen` | `voter-allowopen.spec.ts` | (consumes overlay above) | — | Entity-comment surface visibility per `allowOpen` |
| 16 | `data-setup-hidden-required` | `variant-hidden-required.setup.ts` | `templates/variant-hidden-required.ts` | none | SETTINGS-03 — hidden/required `customData` flags on opinion + info questions |
| 17 | `variant-hidden-required-voter` | `voter-visibility-required.spec.ts` | (consumes overlay above) | — | Hidden question absent from voter flow |
| 18 | `variant-hidden-required-candidate` | `candidate-required-info.spec.ts` | (consumes overlay above) | — | Unanswered required info disables CandAppHome CTAs |

### Opt-in projects (env-gated, default-off)

| Project | Env var | Spec dir | Dataset | Notes |
|---------|---------|----------|---------|-------|
| `visual-regression` | `PLAYWRIGHT_VISUAL=1` | `tests/specs/visual/` | `data-setup` + `auth-setup` | Screenshot baselines under `tests/specs/__screenshots__/` |
| `performance` | `PLAYWRIGHT_PERF=1` | `tests/specs/perf/` | `data-setup` only | Page-load timing assertions |
| `a11y-smoke` | `PLAYWRIGHT_A11Y=1` | `tests/specs/a11y/` | `data-setup` only | `@axe-core/playwright` WCAG 2.1 AA scan (Phase 76) |
| `bank-auth` | `PLAYWRIGHT_BANK_AUTH=1` | `tests/specs/candidate/candidate-bank-auth.spec.ts` | `data-setup` only | Idura/Signicat OIDC integration test |

---

## Spec inventory

Voter specs run against the `e2e` dataset unless noted. **Auth = empty** means an anonymous voter (no storageState). **Auth = Alpha** means `STORAGE_STATE` from `auth-setup` (logged-in candidate `test-candidate-alpha`). "Mutates app_settings" flags specs that write global settings via `SupabaseAdminClient.updateAppSettings()` — those specs must restore defaults in `afterAll`.

### `voter-app` (Wave 1, parallel)

| Spec | What it covers | Auth | Mutates app_settings? |
|------|----------------|------|----------------------|
| `voter-detail.spec.ts` | Entity-detail drawer; voter↔candidate Manhattan/directional SubMatch rendering | empty | no |
| `voter-feedback-persistence.spec.ts` | Feedback modal dialog-close + persistence-across-cancel contract | empty | yes (`results.showFeedbackPopup`) |
| `voter-journey.spec.ts` | Home → Intro → Elections → Constituencies → Questions → Results full happy path | empty | no |
| `voter-locale-switching.spec.ts` | Locale switcher updates URL + rerenders content; persists across nav | empty | no |
| `voter-matching.spec.ts` | Matching algorithm verification (Manhattan distance ordering, partial answers, hidden candidates) | empty | no |
| `voter-navigation.spec.ts` | Skip/delete/back voter-navigation contracts; results-CTA toggles per `minimumAnswers` threshold | empty | no |
| `voter-popup-hydration.spec.ts` | LAYOUT-03 — setTimeout-triggered popup surfaces through the root layout popup slot on cold deeplink | empty | yes (`results.showFeedbackPopup`) |
| `voter-question-rendering-boolean.spec.ts` | QSPEC-01 — boolean opinion question render + persist (currently `test.skip` per Phase 75 PASS-WITH-DEFERRAL) | empty | no |
| `voter-question-rendering-categorical.spec.ts` | QSPEC-02 — categorical opinion question render + persist (currently `test.skip` — same deferral) | empty | no |
| `voter-questions.spec.ts` | Question-page navigation + answer-store persistence | empty | no |
| `voter-results.spec.ts` | Results page render + EntityList filters + entity ordering | empty | yes (`results.sections`, filters) |
| `voter-static-pages.spec.ts` | Privacy / Info / About static pages render with correct content | empty | no |

### `voter-app-settings` (Wave 1, serial)

| Spec | What it covers | Auth | Mutates app_settings? |
|------|----------------|------|----------------------|
| `voter-settings.spec.ts` | Category-selection, category-intros (VOTE-05/13), questions-intro flow, full voter-results-CTA states | empty | **yes** (multiple settings cycles per describe block) |

### `voter-app-popups` (Wave 3, serial)

| Spec | What it covers | Auth | Mutates app_settings? |
|------|----------------|------|----------------------|
| `voter-popups.spec.ts` | VOTE-15 / VOTE-16 — feedback + survey popup timing, dismissal-after-reload localStorage memory | empty | **yes** (`results.showFeedbackPopup`, `results.showSurveyPopup`, `survey.*`) |

### `candidate-app` (Wave 2, serial)

| Spec | What it covers | Auth | Mutates app_settings? |
|------|----------------|------|----------------------|
| `candidate-auth.spec.ts` | Login flow — valid creds, invalid creds, error rendering | empty / Alpha | no |
| `candidate-questions.spec.ts` | CAND-04/05/06 — answer Likert question, edit answer, preview profile | Alpha | no |
| `candidate-translation.spec.ts` | i18n locale switcher inside the candidate app | Alpha | no |

### `candidate-app-mutation` (Wave 3, serial)

| Spec | What it covers | Auth | Mutates app_settings? |
|------|----------------|------|----------------------|
| `candidate-registration.spec.ts` | Two describes: (1) new-candidate self-registration via invite token + email flow on `E2E_ADDENDUM_CANDIDATES[0]`; (2) password-reset round-trip on Alpha's email (Inbucket → reset link → setPassword → restore). File-level `test.use({ storageState: { cookies: [], origins: [] } })` overrides the project's `STORAGE_STATE` to empty; each describe authenticates itself. | empty (new invitee + Alpha-email reset) | no |
| `candidate-profile.spec.ts` | Profile fields (CAND-03/06/12) — display name, bio, image upload, persist across reload | empty (new invitee) | no |

### `candidate-app-validation` (Wave 4, serial)

| Spec | What it covers | Auth | Mutates app_settings? |
|------|----------------|------|----------------------|
| `candidate-profile-validation.spec.ts` | A11Y-01 validation — image-type/size, name-too-long, email/url format, required-empty | Alpha via fresh login | no |

### `candidate-app-settings` (Wave 5)

| Spec | What it covers | Auth | Mutates app_settings? |
|------|----------------|------|----------------------|
| `candidate-settings.spec.ts` | SETTINGS-01 waves A/B — header.showFeedback, showHelp, notifications.voterApp, filter waves | Alpha | **yes** (cycles dozens of settings combinations) |

### `candidate-app-password` (Wave 6)

| Spec | What it covers | Auth | Mutates app_settings? |
|------|----------------|------|----------------------|
| `candidate-password.spec.ts` | Logout + password change; **revokes refresh token** (runs last in chain) | Alpha | no |

### Variant specs (Waves 7–24, sequential)

Each variant project runs exactly one spec against its template overlay. The spec contracts live in `tests/specs/variants/` or `tests/specs/{voter,candidate}/` depending on app surface tested. Variants assume the **previous** variant's data-teardown has cleared `test-`-prefixed rows.

### Opt-in specs

| Project | Spec |
|---------|------|
| `visual-regression` | `tests/specs/visual/visual-regression.spec.ts` |
| `performance` | `tests/specs/perf/performance-budget.spec.ts` |
| `a11y-smoke` | `tests/specs/a11y/a11y-smoke.spec.ts` |
| `bank-auth` | `tests/specs/candidate/candidate-bank-auth.spec.ts` |

---

## Datasets reference

### `BUILT_IN_TEMPLATES.e2e` — the base seed

Lives in [`packages/dev-seed/src/templates/e2e.ts`](../packages/dev-seed/src/templates/e2e.ts). Defines:

- 2 elections (`test-election-1`, `test-election-2`)
- 2 constituency groups with multi-constituency hierarchy
- Candidates `test-candidate-alpha` (Alpha) and the addendum candidates used by mutation specs
- Mixed opinion question types: ~16 `singleChoiceOrdinal` (Likert-5) + 1 `singleChoiceCategorical` (sort 17, 3 choices) + 1 `boolean` (sort 18) + 1 `number` (sort 19+)
- An `app_settings.fixed[0].settings` block that suppresses intermediate pages (questions intro, category intros, popups) by default — settings-mutating specs re-enable them transiently

**Implication for fixtures:** the `answeredVoterPage` fixture in `tests/fixtures/voter.fixture.ts` walks 16 Likert-style clicks then a Skip-Next tail loop to advance past the 3 non-ordinal tail questions before landing on `/results`. The tail loop budget is 6 iterations (raised from 3 in Phase 86.1-01).

### Variant templates

Each `templates/variant-*.ts` exports a template that **extends** the base via overlay rows (only the diff is declared; the pipeline merges with `BUILT_IN_TEMPLATES.e2e`). See each template file's header comment for the spec contract it serves.

### Modifiers — `applyLikertOnlyFilter`

Exported from `@openvaa/dev-seed`. Drops all non-`singleChoiceOrdinal` opinion questions from the template before pipeline. Applied at runtime in two variant setups (`variant-multi-election.setup.ts` and `variant-constituency.setup.ts`) because their specs assume 5-choice Likert via `.nth(2)` / inline answer-loop patterns.

**Not applied** in the default `data-setup` — the voter-app project sees the mixed-type seed. The CLI equivalent is `yarn db:seed --template e2e --likert-only` (for manual reseeding).

### Modifiers — `--external-id-prefix`, `--seed`

Available on `yarn db:seed` invocations for custom external_id namespaces / deterministic randomisation. Not used by `data-setup` (defaults are appropriate for the test fixture).

---

## App-settings mutation map

Global `app_settings` rows are shared across all parallel workers. Specs that **mutate** them must serialise. The current grouping puts settings-mutating projects on dedicated sequential paths:

| Mutating project | Settings touched | Restored in `afterAll`? |
|------------------|------------------|------------------------|
| `voter-app-settings` | category selection / intros / showResultsLink / many `entities.*` cycles | yes |
| `voter-app-popups` | `results.showFeedbackPopup`, `results.showSurveyPopup`, `survey.linkTemplate`, `notifications.voterApp.show` | yes |
| `candidate-app-settings` | `header.showFeedback`, `header.showHelp`, `notifications.voterApp.show`, filter waves A/B | yes |
| variant `data-setup-*` | Each variant's `app_settings.fixed[0].settings` overlay (declarative; replaces the base block) | n/a — variant teardown wipes |
| `voter-popup-hydration.spec.ts` (in `voter-app`) | `results.showFeedbackPopup` per describe block | yes |
| `voter-feedback-persistence.spec.ts` (in `voter-app`) | `results.showFeedbackPopup` | yes |
| `voter-results.spec.ts` (in `voter-app`) | `results.sections`, EntityFilters wave-B settings | yes |

**Note**: Three `voter-app` specs (last three rows) mutate settings even though the project itself is documented as "read-only settings". This works because the project is `fullyParallel: true` but each affected describe is `mode: 'serial'` and brackets its mutation with `beforeAll` / `afterAll`. Settings races between parallel files inside `voter-app` are mitigated by the suppression `defaults` being restorative — but two parallel files both racing to set `showFeedbackPopup` at the same instant could still flake. Surfacing for v2.11+.

---

## State assumptions per spec

Most specs assume the following baseline established by `data-setup`:

- Fresh database with only `test-` prefixed rows
- `auth.users` has `test-candidate-alpha` with `Password1!` credential
- App settings suppress all intermediate pages by default (questions intro hidden, category intros hidden, popups null)
- Storage bucket `private-assets` + `public-assets` exist

Variant specs add to these assumptions the variant template's overlay (see the variant chain table for what each adds).

State that specs **must not assume** (because the chain re-seeds):

- Stable Postgres UUIDs — specs use `findData({ externalId: { $eq: 'test-...' } })` to look up rows
- Specific filter counts (depends on Phase-level seed evolution)
- Browser storage isolation between specs in the same serial describe — settings specs use `storageState: { cookies: [], origins: [] }` to start clean

---

## Setup / teardown specs

| File | Project | Purpose |
|------|---------|---------|
| `tests/setup/data.setup.ts` | `data-setup` | Seeds `BUILT_IN_TEMPLATES.e2e`; verifies fresh-DB precondition; subset-asserts `app_settings.fixed[0].settings` persisted |
| `tests/setup/data.teardown.ts` | `data-teardown` | Cleans `test-`-prefixed rows after all default-suite projects finish |
| `tests/setup/auth.setup.ts` | `auth-setup` | Logs in as Alpha; writes `STORAGE_STATE` |
| `tests/setup/re-auth.setup.ts` | `re-auth-setup` | Re-logs Alpha after mutation specs revoke her refresh token |
| `tests/setup/variant-*.setup.ts` | `data-setup-*` (one per variant) | Re-seeds with variant overlay; calls `runTeardown('test-')` first |
| `tests/setup/variant-data.teardown.ts` | `data-teardown-variants` | Wipes `test-`-prefixed rows after the variant chain |

---

## Common pitfalls

- **`yarn db:reset` in another terminal will wipe the suite mid-run** — `data-teardown` is the only legitimate path to clear test data. Don't reset while the suite is running.
- **The variant chain serialises everything after `candidate-app-password`.** A single flaky variant chain-head test can cascade-skip all downstream variants. Per-spec smokes (`--project=variant-X`) skip the chain and are dramatically faster for debugging one variant.
- **`voter-app` reads but does not mutate the default `app_settings` row** — except for the three specs flagged above. If you add a new voter spec that needs different settings, route it to `voter-app-settings` (or split out a new sequential project).
- **`STORAGE_STATE` (Alpha's session) is shared across all candidate-app projects.** Phase 84 DETERM-08 broke a chain where mutation specs invalidated Alpha mid-run; `re-auth-setup` exists to repair this. If you add a candidate spec that revokes Alpha's token, place it AFTER `re-auth-setup` in the dependency chain.
- **Fixture timeouts vs locator timeouts.** Per-test `test.setTimeout(N)` and `playwright.config.ts:55` global timeout are wall budgets — keep them large enough for fixture warm-up (cold dev-server hydration can run 5-8s). Per-locator `{ timeout: N }` options should be smaller (≤ 10s) so individual element waits fail fast; the test-level budget contains them.
- **Trace files.** All projects use `trace: 'on'` (formerly some had `trace: 'off'` workarounds for Playwright 1.58.2 sharedPage ENOENT races; those workarounds were removed in Phase 85-04). Traces land in `tests/playwright-results/<spec>/trace.zip`; open with `npx playwright show-trace <path>`.
- **Missing-nominations modal — do NOT roll your own dismiss.** The voter-app's `(located)/+layout.svelte` opens a `<Modal>` whenever the selected election + constituency combination produces a partial-nomination state. The modal is rendered as DaisyUI `.modal` (a `<dialog>` styled with `display: grid` even when closed) — so `Locator.waitFor({ state: 'hidden' })` NEVER resolves, and `Locator.evaluate` stalls for ~60s when the modal element is never rendered (`hasNominations === 'all'` branch removes the element from the DOM entirely). The frontend re-fires its `$effect` on every streamed-Promise re-resolve (sub-route nav within `(located)` re-creates the streamed pair identity); a `modalShownForKey` guard in the layout suppresses the same-dataset reopen, but specs must still handle a one-shot reopen race after Continue. Use the shared helpers in [`tests/utils/missingNominations.ts`](./tests/utils/missingNominations.ts) — `dismissMissingNominationsIfPresent(page)` for a one-time race against the first answer-option paint, or `installMissingNominationsAutoDismiss(page)` for suites that traverse `/questions` or `/results` repeatedly without explicitly asserting the modal. Both probe the native `<dialog open>` attribute via `page.evaluate` + CSS selector (short-circuits when the dialog element is absent). The modal carries `data-testid="voter-missing-nominations-modal"` (CONF-03 post-fix); legacy builds fall back to `getByRole('dialog')`.

---

## Where to look next

- Per-spec failure-class history → [`.planning/phases/`](../.planning/phases/) — search for the relevant DETERM-* / SETTINGS-* / CONF-* / E2E-* requirement id
- Project conventions → [`../CLAUDE.md`](../CLAUDE.md) (Likert-only canonical chain, db:* command map, Context Destructuring Rule)
- Test classification arrays (PASS_LOCKED / DATA_RACE / CASCADE / SKIPPED) → [`tests/scripts/diff-playwright-reports.ts`](./scripts/diff-playwright-reports.ts)
