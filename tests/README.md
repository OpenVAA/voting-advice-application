# `tests/` — End-to-end test suite

Playwright-driven cross-monorepo E2E tests covering the voter app, candidate app, and the configuration-permutation matrix. Configuration: [`tests/playwright.config.ts`](./playwright.config.ts). Seed data is produced by [`@openvaa/dev-seed`](../packages/dev-seed/) via the project's `data-setup-base` + `data-setup-perm-*` setup projects.

## Run

```bash
# Prereqs: yarn install && (in another shell) yarn dev
yarn test:e2e                              # full suite — configured for 6 workers (1 on CI)
yarn test:e2e --project=voter-journey      # one project (still pulls in its dependency chain)
yarn test:e2e --grep "result card"         # filter by title substring
yarn test:e2e --reporter=line              # less noisy output
```

Type-check the suite without running it:

```bash
yarn typecheck:tests                       # tsc --noEmit over tests/
```

List the discovered tests without a running dev server (useful as a "no dropped specs" check):

```bash
cd tests && npx playwright test --list
```

Specialised projects:

`performance` and `a11y-smoke` run **by default** in `yarn test:e2e`. Opt OUT
of either with the matching `PLAYWRIGHT_NO_*` env:

```bash
PLAYWRIGHT_NO_PERF=1   yarn test:e2e   # skip performance
PLAYWRIGHT_NO_A11Y=1   yarn test:e2e   # skip a11y-smoke
```

`visual-regression` and `bank-auth` stay **opt-in** (each has a hard blocker —
see the project table below). Enable explicitly:

```bash
PLAYWRIGHT_VISUAL=1     yarn test:e2e --project=visual-regression
PLAYWRIGHT_BANK_AUTH=1  SUPABASE_SERVICE_ROLE_KEY=… SUPABASE_ANON_KEY=… \
  yarn test:e2e --project=bank-auth
```

Per-spec smokes (skip the rest of the chain — dramatically faster):

```bash
npx playwright test -c tests/playwright.config.ts \
  --project=voter-journey --reporter=line
```

For a fully Likert-only manual reseed (drops non-ordinal opinion questions for voter-fixture compatibility, per the CLAUDE.md `--likert-only` caveat), use the manual chain:

```bash
yarn db:reset && yarn db:seed --template e2e/base --likert-only && yarn dev:clean
# then in another terminal:
yarn dev
# then in a third terminal:
npx playwright test -c tests/playwright.config.ts --project=voter-journey
```

> The default base dataset (`e2e/base`) is authored to need no Likert-only filter for the journey specs; `--likert-only` is only relevant when manually reseeding for voter fixtures that iterate Likert-only opinion questions.

---

## Concurrency model

- `workers: 6` (non-CI default; `1` on CI). The 6-worker pool is **global** across all projects.
- `fullyParallel: true` is the global default — files within a project run concurrently unless the project overrides `fullyParallel: false`. The journey + perm spec projects set `fullyParallel: false` (single serial test each).
- Project-level `dependencies: [...]` enforces "runs after". A project becomes eligible the moment all its dependencies finish; multiple eligible projects then share the worker pool.
- `teardown: '<project>'` runs the named teardown project after this project and all its transitive dependents complete.

### Project families (default suite, no opt-in env vars)

The graph (per [`playwright.config.ts`](./playwright.config.ts)) has three families:

```
  ┌──────────────────┐
  │ data-setup-base  │  seeds the e2e/base dataset → teardown: data-teardown-base
  └────────┬─────────┘
           ├──────────────────────────────┐
           ▼                              ▼
  ┌──────────────────┐        ┌──────────────────────────────┐
  │  voter-journey   │        │  data-setup-candidate-journey │
  │ (1 serial test)  │        └───────────────┬──────────────┘
  └──────────────────┘                        ▼
                                     ┌──────────────────┐
                                     │ candidate-journey│
                                     │ (1 serial test)  │
                                     └────────┬─────────┘
                                              ▼
                          ┌──────────────────────────────────────┐
                          │ candidate settings-perm chain:        │
                          │ perm-disable-voter-app                │
                          │ → perm-disable-candidate-app          │
                          │ → perm-per-app-notifications          │
                          └──────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │ voter permutation chain (runs in PARALLEL with the base /     │
  │ journey families; FIRST setup has NO upstream dep):           │
  │   data-setup-perm-1e1cg1co (FIRST — no deps)                  │
  │   → data-setup-perm-2e-shared → … → data-setup-perm-*         │
  │   (each chains sequentially to prevent app_settings clobber;  │
  │    each teardowns ITS OWN test-perm-<short>- prefix)          │
  └──────────────────────────────────────────────────────────────┘
```

> The `perm-per-app-notifications` projects + spec are currently quarantined (`describe.skip`) pending the Svelte 5 runes migration; their wiring stays in place. See the inline `// TODO: re-enable perm-per-app-notifications` marker in `playwright.config.ts`.

- The base / journey family and the voter permutation family run **in parallel** — the permutation chain's first setup has no cross-chain dependency.
- Within the permutation family, setups chain **sequentially** because each mutates the singleton `app_settings` row; serial chaining prevents cross-permutation clobbering.
- The candidate settings-perm chain (`perm-disable-voter-app` → `perm-disable-candidate-app` → `perm-per-app-notifications`) is sequenced AFTER `candidate-journey` and uses distinct `e2e-perm-*` external-id prefixes for parallel-safety.

---

## Project inventory

Legend: **Parallel** = `fullyParallel: true` (specs within run concurrently); **Serial** = `fullyParallel: false` (one spec at a time within the project).

### Base + journey family

| Project | Spec / setup | Dataset | Within-project | Auth state | Notes |
|---------|--------------|---------|----------------|------------|-------|
| `data-setup-base` | `setup/shared/base.setup.ts` | `e2e/base` | n/a | — | Single merged base-seeding project; seeds 2 elections × multi-constituency, mixed opinion-question types. `teardown: data-teardown-base`. |
| `data-teardown-base` | `setup/shared/base.teardown.ts` | — | n/a | — | Cleans up `test-`-prefixed base rows. |
| `voter-journey` | `specs/voter/voter-journey.spec.ts` | inherits `data-setup-base` | **Serial** | empty (anonymous voter) | Single long serial journey test; Home → Intro → Elections → Constituencies → Questions → Results. |
| `data-setup-candidate-journey` | `setup/candidate/candidate-journey.setup.ts` | inherits `data-setup-base` | n/a | — | Candidate-journey seed overlay; `teardown: data-teardown-candidate-journey`. |
| `candidate-journey` | `specs/candidate/candidate-journey.spec.ts` | inherits `data-setup-candidate-journey` | **Serial** | empty (starts UNAUTHENTICATED) | Single long serial candidate flow; registration-via-email → profile → questions → preview → logout. |

### Voter permutation family (parallel with base/journey)

A sequentially-chained family of `perm-*` projects, each with its own `data-setup-perm-<short>` + `data-teardown-perm-<short>` pair and a distinct `test-perm-<short>-` external-id prefix. The chain (per [`playwright.config.ts`](./playwright.config.ts)):

```
data-setup-perm-1e1cg1co (FIRST — no deps)
  → data-setup-perm-2e-shared → data-setup-perm-2e-asymmetric
  → data-setup-perm-startfromcg → data-setup-perm-disjoint-1co
  → data-setup-perm-disable-election-1co → data-setup-perm-disable-election-2co
  → data-setup-perm-not-located-2e2cg → … (and the remaining perm-* projects)
```

Each `perm-<short>` spec project depends on its own `data-setup-perm-<short>` and runs **serial**. The full set of permutation specs lives under [`tests/specs/perm/`](./tests/specs/perm/).

### Specialised projects

**Default-on** (part of `yarn test:e2e`; opt OUT via the `PLAYWRIGHT_NO_*` env):

| Project | Disable with | Spec dir | Depends on | Notes |
|---------|--------------|----------|------------|-------|
| `performance` | `PLAYWRIGHT_NO_PERF=1` | `tests/specs/perf/` | `data-setup-base` | Page-load timing assertions. |
| `a11y-smoke` | `PLAYWRIGHT_NO_A11Y=1` | `tests/specs/a11y/` | `data-setup-base` | `@axe-core/playwright` WCAG 2.1 AA scan; consumes the base fixture. |

**Opt-in** (excluded from the default run — each has a hard blocker):

| Project | Enable with | Spec dir | Depends on | Why opt-in |
|---------|-------------|----------|------------|------------|
| `visual-regression` | `PLAYWRIGHT_VISUAL=1` | `tests/specs/visual/` | `data-setup-base` + `auth-setup` | `auth-setup` can't authenticate against the base dataset yet (no registered base candidate / email). Screenshot baselines under `tests/specs/__screenshots__/`; `auth-setup` is declared only under `PLAYWRIGHT_VISUAL`. |
| `bank-auth` | `PLAYWRIGHT_BANK_AUTH=1` | `tests/specs/candidate/candidate-bank-auth.spec.ts` | `data-setup-base` | Spec throws at module load without `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ANON_KEY`, and 3 tests need the `identity-callback` Edge Function served (`--no-verify-jwt`). Idura/Signicat OIDC integration test. |

---

## Datasets reference

### `e2e/base` — the canonical base seed

Lives in [`packages/dev-seed/src/templates/e2e/base.ts`](../packages/dev-seed/src/templates/e2e/base.ts) (the canonical base dataset). Resolve it with `--template e2e/base`. Defines:

- 2 elections + multi-constituency hierarchy (region / municipality)
- The candidate rows consumed by the journey + permutation specs
- Mixed opinion question types (Likert-5 + categorical + boolean + number) and info questions
- An `app_settings.fixed[0].settings` block that suppresses intermediate pages (questions intro, category intros, popups) by default — settings-mutating specs re-enable them transiently

### `e2e/perm/*` — permutation overlays

Lives under [`packages/dev-seed/src/templates/e2e/perm/`](../packages/dev-seed/src/templates/e2e/perm/). Each permutation template overlays the base shape for a specific settings/data configuration. Their setup projects use `test-perm-<short>-` (voter perms) or `e2e-perm-*` (candidate settings perms) external-id prefixes for parallel-safe row scoping.

### Modifiers — `--likert-only`, `--external-id-prefix`, `--seed`

Available on `yarn db:seed` invocations. `--likert-only` drops non-`singleChoiceOrdinal` opinion questions (relevant for manual voter-fixture reseeds). `--external-id-prefix` / `--seed` control namespace + deterministic randomisation. See [`packages/dev-seed/README.md`](../packages/dev-seed/README.md).

---

## Role-based fixture / setup taxonomy

Fixtures + setup follow a role-based shape:

- **`tests/tests/fixtures/voter/`** — voter-app UI surface fixtures (`voter-journey.fixture.ts`, `views.ts`, `resultsPage.fixture.ts`, `entityDetails.fixture.ts`, `entityFilters.fixture.ts`, `minimalVoterResultsPage.fixture.ts`, `voterNavFixture.fixture.ts`, …). Perm specs importing these is fine — perm is a test *family*, not a separate app.
- **`tests/tests/fixtures/candidate/`** — candidate-app fixtures (`candidate-journey.ts` composition root, login/profile/question page fixtures).
- **`tests/tests/fixtures/shared/`** — genuinely cross-app helpers only (`emailBucket.fixture.ts`, `langSelectorFixture.fixture.ts`, `multilingualTextFieldFixture.fixture.ts`, `feedbackDialog.fixture.ts`).
- **`tests/tests/setup/shared/`** — cross-role infra (`auth.setup.ts`, `setupFromTemplate.ts`, the merged `base.setup.ts` / `base.teardown.ts`).
- **`tests/tests/setup/candidate/`** — candidate-journey setup/teardown.
- **`tests/tests/setup/perm/`** — the `perm-*` setup/teardown pairs.
- **`tests/tests/setup/voter/`** — voter-journey-specific setup (currently empty).

---

## State assumptions per spec

Most specs assume the following baseline established by `data-setup-base`:

- Fresh database with only `test-` prefixed rows
- App settings suppress all intermediate pages by default (questions intro hidden, category intros hidden, popups null)
- Storage buckets `private-assets` + `public-assets` exist

State that specs **must not assume** (because the chain re-seeds):

- Stable Postgres UUIDs — specs use `findData({ externalId: { $eq: 'test-...' } })` to look up rows
- Specific filter counts (depends on seed evolution)
- Browser storage isolation between specs in the same serial describe — settings specs use `storageState: { cookies: [], origins: [] }` to start clean

---

## Setup / teardown specs

| File | Project | Purpose |
|------|---------|---------|
| `tests/setup/shared/base.setup.ts` | `data-setup-base` | Seeds the `e2e/base` template; verifies fresh-DB precondition; subset-asserts `app_settings.fixed[0].settings` persisted |
| `tests/setup/shared/base.teardown.ts` | `data-teardown-base` | Cleans `test-`-prefixed rows after the base/journey families finish |
| `tests/setup/shared/auth.setup.ts` | `auth-setup` (opt-in `PLAYWRIGHT_VISUAL`) | Logs in a candidate; writes `STORAGE_STATE` |
| `tests/setup/candidate/candidate-journey.setup.ts` | `data-setup-candidate-journey` | Candidate-journey seed overlay |
| `tests/setup/candidate/candidate-journey.teardown.ts` | `data-teardown-candidate-journey` | Cleans candidate-journey rows |
| `tests/setup/perm/perm-*.setup.ts` | `data-setup-perm-<short>` | Per-permutation seed; pre-clears its own prefix first |
| `tests/setup/perm/perm-*.teardown.ts` | `data-teardown-perm-<short>` | Wipes the permutation's `test-perm-<short>-` rows |

---

## Common pitfalls

- **`yarn db:reset` in another terminal will wipe the suite mid-run** — the teardown projects are the only legitimate path to clear test data. Don't reset while the suite is running.
- **`STORAGE_STATE` (the visual-regression candidate session) is shared** within the opt-in visual chain. If you add a candidate spec that revokes a token, sequence it appropriately.
- **Fixture timeouts vs locator timeouts.** Per-test `test.setTimeout(N)` and the global timeout are wall budgets — keep them large enough for fixture warm-up (cold dev-server hydration can run 5-8s). Per-locator `{ timeout: N }` options should be smaller (≤ 10s) so individual element waits fail fast; the test-level budget contains them. Timeout constants live in [`tests/tests/helpers/timeouts.ts`](./tests/helpers/timeouts.ts).
- **Trace files.** Traces land in `tests/playwright-results/<spec>/trace.zip`; open with `npx playwright show-trace <path>`.
- **Missing-nominations modal — do NOT roll your own dismiss.** The voter-app's `(located)/+layout.svelte` opens a `<Modal>` whenever the selected election + constituency combination produces a partial-nomination state. The modal is rendered as DaisyUI `.modal` (a `<dialog>` styled with `display: grid` even when closed) — so `Locator.waitFor({ state: 'hidden' })` NEVER resolves, and `Locator.evaluate` stalls for ~60s when the modal element is never rendered. The frontend re-fires its `$effect` on every streamed-Promise re-resolve; a `modalShownForKey` guard in the layout suppresses the same-dataset reopen, but specs must still handle a one-shot reopen race after Continue. Use the shared helpers in [`tests/tests/utils/missingNominations.ts`](./tests/utils/missingNominations.ts) — `dismissMissingNominationsIfPresent(page)` for a one-time race, or `installMissingNominationsAutoDismiss(page)` for suites that traverse `/questions` or `/results` repeatedly. Both probe the native `<dialog open>` attribute via `page.evaluate` + CSS selector. The modal carries `data-testid="voter-missing-nominations-modal"`; legacy builds fall back to `getByRole('dialog')`.

---

## See also

- Project conventions → [`../CLAUDE.md`](../CLAUDE.md) (Likert-only canonical chain, db:* command map, Context Destructuring Rule)
- Seed-template authoring → [`../packages/dev-seed/README.md`](../packages/dev-seed/README.md)
- Helper authoring + contracts → [`./tests/helpers/README.md`](./tests/helpers/README.md)
