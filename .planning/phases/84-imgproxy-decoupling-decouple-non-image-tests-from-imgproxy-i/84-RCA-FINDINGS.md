# Phase 84 — RCA Findings (per-test diagnostic appendix)

**Captured:** 2026-05-13
**Diagnostic confidence:** HIGH (verified by direct Playwright `page.on('request')` instrumentation against the live local stack)

This file is the diagnostic appendix referenced from `84-RESEARCH.md` §"Root-Cause Verdict". It documents the empirical evidence behind the per-test classification table and the D-02 mechanism recommendation.

---

## Instrumentation Setup

| Item | Value |
|------|-------|
| Frontend | http://localhost:5173 (Vite dev, healthy) |
| Supabase | http://localhost:54321 (running; `[storage.image_transformation] enabled = true` per Phase 83 D-01c) |
| Seed | `yarn db:seed --template e2e --likert-only` (Phase 78 CLEAN-05 canonical voter-fixture-compatible chain). 18 portraits uploaded, 18 candidates created including Alpha (`test-candidate-alpha` external_id, `image.path = 00000000-0000-0000-0000-000000000001/candidates/47a792cc-…/seed-portrait.jpg`). |
| Auth | Test-candidate-Alpha registered + linked via the Supabase admin-API helper script in `rca-capture/register-alpha.mjs` (replicates `data.setup.ts` `forceRegister` without triggering the cascading teardown project). |
| Tooling | Playwright `page.on('request')` / `page.on('response')` / `page.on('requestfailed')`. Tests written in `rca-capture/capture-cold-start.spec.ts` + `rca-capture/capture-profile.spec.ts`. |
| Runner | Standalone Playwright configs `rca-capture/playwright.rca.config.ts` + `rca-capture/playwright.profile.config.ts` (bypass the main project graph so no setup/teardown contamination). |
| Routes traced | (1) login page; (2) login submit → candidate-home; (3) `/en/candidate/questions`; (4) `/en/candidate` (return); (5) `/en/candidate/help`; (6) `/en/candidate/privacy`; (7) `/en/candidate/profile` (supplemental — confirms portrait surface is profile-only). |
| Capture output | `rca-capture/captures/*.json` — one file per stage + a `99-summary.json` aggregate + `profile-capture.json` for the profile-only supplemental. |

---

## Capture Results

### Cold-start through candidate-app-settings code paths

The candidate-app-settings tests navigate to a subset of: `CandAppHome` (`/en/candidate`), `CandAppQuestions` (`/en/candidate/questions`), `CandAppHelp`, `CandAppPrivacy`. The cold-start instrumentation walked all four of these immediately after login.

| Stage | `/storage/v1/*` requests | First storage URL | Failed storage requests |
|-------|--------------------------|--------------------|--------------------------|
| 01 login page | **0** | — | 0 |
| 02 login submit → candidate-home (`/en/candidate`) | **0** | — | 0 |
| 03 questions (`/en/candidate/questions`) | **0** | — | 0 |
| 04 home (`/en/candidate`) again | **0** | — | 0 |
| 05 help (`/en/candidate/help`) | **0** | — | 0 |
| 06 privacy (`/en/candidate/privacy`) | **0** | — | 0 |
| **Total** | **0 (zero)** | — | 0 |

`rendered-image-path requests` (i.e. `/storage/v1/render/image/...`) across all 6 stages: **0**.
`object-public-path requests` (i.e. `/storage/v1/object/public/...`) across all 6 stages: **0**.

### Supplemental: profile route (the ONLY candidate-app surface that renders Alpha's portrait)

To establish a positive control — confirm that storage requests CAN be observed when a surface actually renders a portrait — the supplemental capture navigated to `/en/candidate/profile`:

| Surface | Storage requests | First URL | Pattern |
|---------|------------------|-----------|---------|
| `/en/candidate/profile` | **1** | `http://127.0.0.1:54321/storage/v1/object/public/public-assets/00000000-…/candidates/47a792cc-…/seed-portrait.jpg` | `/storage/v1/object/public/...` (raw public bucket, NOT `/render/image/`) |

Response status: `200`. The portrait is fetched directly from the public bucket; the URL does not include `/render/image/`, so Supabase Storage's image-transformation imgproxy pipeline is NOT touched on read.

---

## Root-cause Verdict

The 11 candidate-app-settings tests + the re-auth-dual entries are **NOT** imgproxy-tied via initial-paint, background-prefetch, OR any read-time portrait fetch on the candidate-app surface. They cold-start fetches **zero** `/storage/v1/*` URLs.

The imgproxy-tie is **D-02 branch 2: dependency-chain cascade**. The mechanism is:

1. **`candidate-app-mutation` project** runs `candidate-profile.spec.ts` which includes `should upload a profile image (CAND-03)`. This test calls `profilePage.uploadImage()` → triggers `<Input type="image">` `<input type="file" onchange>` → SvelteKit/supabase-js flow → `supabase.storage.from('public-assets').upload(storagePath, file, { cacheControl: '3600', upsert: true })` at `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:281-283` (or :329-331 for `_updateEntityProperties`).
2. **Imgproxy 502 during upload**: per Phase 83 D-01c rationale (`apps/supabase/supabase/config.toml:130-138`): "the imgproxy container is required for the CAND-03 image-upload happy path; without it, the storage layer may fail to acknowledge the multipart upload and the filechooser event never settles." When the local imgproxy Docker container is sufficiently degraded, the upload PUT either 502s or hangs.
3. **Test fails or times out**: the spec asserts `await expect(page).not.toHaveURL(/profile/, { timeout: 10000 })` (line 209) after `profilePage.submit()` — if the save POST hangs or rejects, the URL never changes, and the test times out.
4. **Playwright project-dependency cascade**: per upstream Playwright docs (verified 2026 via [microsoft/playwright#38860](https://github.com/microsoft/playwright/issues/38860)), **if ANY test in a dependency project fails, ALL dependent projects are skipped with `did not run` status**. The project graph is:
   ```
   data-setup → auth-setup → candidate-app → candidate-app-mutation → re-auth-setup → candidate-app-settings → candidate-app-password
   ```
   When CAND-03 fails inside `candidate-app-mutation`, Playwright skips re-auth-setup → candidate-app-settings → candidate-app-password entirely. That cascade-skips all 11 settings tests + the 2 password tests + re-auth-setup itself (which appears in BOTH the `auth-setup` and `re-auth-setup` projects per the `dependencies: [...]` shape, hence the dual-project DATA_RACE entry).

5. **DATA_RACE classification persists across runs**: the `IMGPROXY_TIED_TITLES` array in `regen-constants.mjs:67-82` STRUCTURALLY classifies these 14 titles into DATA_RACE regardless of their per-run pass/fail status (per `dataRace = isImgproxyTied(id) || rawStatus === 'flaky'` at line 108). This is the Phase 73 D-09 binding — "may pass or fail post-swap, depending on whether imgproxy 502s during this run."

**Direct evidence:** `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:5-32` shows the exact cascade pattern in the Phase 63 baseline:
- Line 7: `[pass -> fail] candidate-app-mutation :: candidate-profile.spec.ts > should upload a profile image (CAND-03)` — the upload directly failed.
- Lines 8-32: `[pass -> cascade] candidate-app-settings :: …` and `[pass -> cascade] candidate-app-password :: …` — ALL 11 settings + 2 password + 1 re-auth-dual tests cascade-skipped from the SINGLE upstream upload failure.

---

## Per-test Classification Table

| # | Project :: Spec > Title | Mechanism | Action in Phase 84 |
|---|-------------------------|-----------|--------------------|
| 1 | candidate-app-mutation :: candidate-profile > should upload a profile image (CAND-03) | **Intrinsic image-upload** | STAY in DATA_RACE (the upload is the imgproxy-touching test by definition) |
| 2 | candidate-app-mutation :: candidate-profile > should show editable info fields on profile page (CAND-03) | **Intrinsic readback** | STAY in DATA_RACE (the readback is in the same serial describe block as the upload, AND the route renders the saved portrait from `/storage/v1/object/public/...`) |
| 3 | candidate-app-mutation :: candidate-profile > should persist profile image after page reload (CAND-12) | **Intrinsic readback** | STAY in DATA_RACE (same rationale as #2; the `<img>` element is the assertion target) |
| 4 | auth-setup :: re-auth.setup.ts > re-authenticate as candidate | **Dependency-chain cascade** | LEAVE DATA_RACE (re-auth itself does not fetch imgproxy — login flow makes zero `/storage/v1/*` requests per the cold-start capture; the dual-project entry exists because Playwright registers the setup under BOTH `auth-setup` and `re-auth-setup` project names. The `auth-setup` half cascades when the `data-setup` upstream fails; the `re-auth-setup` half cascades when `candidate-app-mutation` fails — both are pure dependency-chain.) |
| 5 | re-auth-setup :: re-auth.setup.ts > re-authenticate as candidate | **Dependency-chain cascade** | LEAVE DATA_RACE (same as #4) |
| 6 | candidate-app-settings :: candidate-settings.spec.ts > should show read-only warning when answers are locked | **Dependency-chain cascade** | LEAVE DATA_RACE (verified zero `/storage/v1/*` requests on /en/candidate + /en/candidate/questions during cold-start) |
| 7 | candidate-app-settings :: candidate-settings.spec.ts > should show maintenance page when candidateApp is disabled | **Dependency-chain cascade** | LEAVE DATA_RACE (verified zero `/storage/v1/*` requests on /en/candidate during cold-start; MaintenancePage is rendered at the layout root) |
| 8 | candidate-app-settings :: candidate-settings.spec.ts > should show maintenance page when underMaintenance is true | **Dependency-chain cascade** | LEAVE DATA_RACE (same as #7) |
| 9 | candidate-app-settings :: candidate-settings.spec.ts > should display notification popup when enabled | **Dependency-chain cascade** | LEAVE DATA_RACE (verified zero `/storage/v1/*` requests on /en/candidate during cold-start) |
| 10 | candidate-app-settings :: candidate-settings.spec.ts > should render help page correctly | **Dependency-chain cascade** | LEAVE DATA_RACE (verified zero `/storage/v1/*` requests on /en/candidate/help during cold-start) |
| 11 | candidate-app-settings :: candidate-settings.spec.ts > should render privacy page correctly | **Dependency-chain cascade** | LEAVE DATA_RACE (verified zero `/storage/v1/*` requests on /en/candidate/privacy during cold-start) |
| 12 | candidate-app-settings :: candidate-settings.spec.ts > should hide hero when hideHero is enabled | **Dependency-chain cascade** | LEAVE DATA_RACE (CandAppQuestions surface — verified zero `/storage/v1/*` requests during cold-start) |
| 13 | candidate-app-settings :: candidate-settings.spec.ts > should show hero when hideHero is disabled | **Dependency-chain cascade** | LEAVE DATA_RACE (same as #12) |
| 14 | candidate-app-password :: candidate-password.spec.ts > should change password and login with new password | **Dependency-chain cascade** | LEAVE DATA_RACE (password specs don't touch imgproxy — they're cascade-victims via the chain `candidate-app-settings → candidate-app-password`) |
| 15 | candidate-app-password :: candidate-password.spec.ts > should logout and return to login page | **Dependency-chain cascade** | LEAVE DATA_RACE (same as #14) |

**Summary counts:**
- Intrinsic image-upload / image-rendering: **3** (rows 1, 2, 3)
- Dependency-chain cascade (login + setting + password): **12** (rows 4-15)
- Initial-paint or background-prefetch: **0**
- Hybrid: **0**

**Note on the 15→3 contract:** the Phase 84 CONTEXT.md SC #3 specifies the surviving pool as "EXACTLY: `should upload a profile image (CAND-03)`, `should persist profile image after page reload (CAND-12)`, `should show editable info fields on profile page (CAND-03)`." This matches my classification (rows 1, 2, 3 above). The 2 password tests at rows 14-15 ARE imgproxy-tied via the same cascade mechanism — but they're already inside the IMGPROXY_TIED_TITLES list and Phase 84's CONTEXT specifies they leave the pool. This is consistent IF the fix breaks the cascade for both `candidate-app-settings` AND `candidate-app-password` (both downstream of the same `candidate-app-mutation` failure). My recommended D-02 mechanism (below) does exactly that.

---

## Recommended D-02 Mechanism — Branch 2 with Project-Graph Restructure

The cleanest fix for branch 2 (dependency-chain cascade) is to **break the dependency chain at the upstream end** so that `candidate-app-mutation` failures don't cascade-skip `re-auth-setup` / `candidate-app-settings` / `candidate-app-password`. Two sub-options, planner-choice:

### Option 2a: Repoint re-auth-setup dependency away from candidate-app-mutation

Currently (`tests/playwright.config.ts:134-138`):
```ts
{
  name: 're-auth-setup',
  testMatch: /re-auth\.setup\.ts/,
  dependencies: ['candidate-app-mutation']
}
```

Re-auth-setup's purpose is to re-authenticate Alpha after `candidate-app-mutation`'s password-reset tests invalidate Alpha's refresh token. The dependency on `candidate-app-mutation` is a sequencing constraint (run AFTER mutation completes), not a data-flow dependency. The fix:

```ts
{
  name: 're-auth-setup',
  testMatch: /re-auth\.setup\.ts/,
  // Sequencing constraint preserved (run after mutation), but no test-failure cascade.
  // re-auth.setup.ts is self-contained: it logs in via UI and saves storageState.
  dependencies: ['candidate-app']  // ← was 'candidate-app-mutation'
}
```

If re-auth-setup depends on `candidate-app` instead of `candidate-app-mutation`, the sequencing constraint relaxes (re-auth-setup may run in parallel with candidate-app-mutation), but the cascade-on-mutation-failure breaks.

**Trade-off:** re-auth-setup must be robust to candidate-app-mutation having run OR not yet run. The password-revocation only happens in `candidate-password.spec.ts` (which is in `candidate-app-password`, NOT mutation), so this is safe — `candidate-app-mutation` does NOT revoke Alpha's session (it touches a fresh candidate `E2E_ADDENDUM_CANDIDATES[1]`, not Alpha — see `candidate-profile.spec.ts:84-86`).

Verification: I confirmed `candidate-profile.spec.ts` uses `E2E_ADDENDUM_CANDIDATES[1]` (a fresh candidate) and registers it with `candidatePassword = 'ProfileTestPass1!'` (not Alpha's `Password1!`). The mutation project does NOT touch Alpha's auth — so re-auth-setup doesn't need to wait for mutation.

### Option 2b: Apply `--ignore-snapshots` / `teardown` semantics (not applicable here)

Per Playwright docs, only setup-marked projects skipped due to FAILED teardown propagate. `candidate-app-mutation` is not a setup project but its failure DOES cascade per the upstream docs. The only Playwright-native fix is option 2a (repointing). The feature request `microsoft/playwright#38860` (filed Jan 2026) proposes a future "run-dependents-anyway" knob, but it's not landed in the current version.

### Why NOT Branch 1 (`?skipImages=1`) — and why NOT Branch 3 (lazy-load)

Both branches assume the candidate-app-settings tests fetch imgproxy on initial paint or via background prefetch. **My instrumentation proves they do not.** Adding a `?skipImages=1` gate or an IntersectionObserver to Avatar/Image on the candidate-app side would be cargo-cult — it would not address the actual cascade mechanism. The 11 settings tests would still cascade-skip when CAND-03 fails because Playwright's project graph doesn't care what the dependents do; it cares only that the dependency project had a failure.

(Note: Branch 1 / 3 ARE relevant on the voter-app side via EntityCard's Avatar consumption, but that's a Phase 85+ scope per CONTEXT.md `<deferred>` §"Avatar IntersectionObserver lazy-load as a prod-relevant feature".)

---

## Caveats + Open Questions

1. **The supplemental profile-route capture used the Alpha candidate, not the fresh `E2E_ADDENDUM_CANDIDATES[1]` candidate that the CAND-03 mutation test exercises.** The fresh candidate has no image at registration time (it gets one mid-test via `profilePage.uploadImage()`). The Alpha portrait fetch I observed on `/en/candidate/profile` is the OUT-OF-BAND case (operator manually navigates as Alpha to view their saved portrait). The candidate-app-mutation test flow itself only fetches the post-upload URL AFTER the upload completes (since `<Input type="image">` displays the just-uploaded blob via `FileReader.readAsDataURL` — see `Input.svelte:273-287` — until `userData.save()` resolves and the saved URL replaces it). So even on the upload spec itself, the imgproxy-tie is at UPLOAD time, not at read time.

2. **My capture used `[storage.image_transformation] enabled = true`** (the Phase 83 D-01c configuration). I did NOT reproduce the imgproxy-502 failure mode itself — that requires sufficient parallel pressure to trigger the local Docker container's degradation. Reproducing the degradation is out of the 1-2 cold-start budget per CONTEXT D-01. The PHASE 63 diff.md provides historical evidence of the failure shape; my instrumentation provides evidence of the SUCCESS path's network topology.

3. **The user_role insert in `register-alpha.mjs` failed** with `no unique or exclusion constraint matching the ON CONFLICT specification`. The login still worked, suggesting either the schema allows duplicate role rows or Alpha had a pre-existing user_role row from prior auth.setup runs. This does NOT affect the storage capture findings — the cold-start request count is zero regardless.

4. **Cascade is the dominant mechanism, but a residual flake risk remains for in-pool tests (#1, #2, #3)** since the upload itself is still imgproxy-touching. DETERM-09 escalation (the 4 config knobs at `config.toml:130-138`) is the planner-time fallback if the 3 surviving tests start flaking too frequently. Per CONTEXT D-04: tune ALL 4 knobs atomically, not knob-at-a-time.

---

## Reproducibility

To re-run my instrumentation:

```bash
# 1. Ensure stack is up
yarn db:status                   # supabase running
curl -sS http://localhost:5173   # frontend running

# 2. Seed (canonical Likert-only chain per CLAUDE.md LANDMINE-9)
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean
# OR if reset is already done, just:
yarn db:seed --template e2e --likert-only

# 3. Register Alpha auth user (replicates data.setup.ts forceRegister)
SUPABASE_SERVICE_ROLE_KEY=<service_role_key> node \
  .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/rca-capture/register-alpha.mjs

# 4. Capture cold-start network (candidate-app-settings code paths)
npx playwright test --config=.planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/rca-capture/playwright.rca.config.ts

# 5. Capture profile-route control
npx playwright test --config=.planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/rca-capture/playwright.profile.config.ts

# 6. Inspect captures
ls .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/rca-capture/captures/
```

Captures land in `rca-capture/captures/{01..06}.json` + `99-summary.json` + `profile-capture.json`.

---

## Sources

- **Direct instrumentation** (HIGH — captures committed at `rca-capture/captures/`):
  - `01-login-page.json` — login page navigation (zero storage).
  - `02-login-submit-home.json` — login submit → candidate home (zero storage).
  - `03-questions.json` — /en/candidate/questions (zero storage).
  - `04-home-again.json` — return to candidate home (zero storage).
  - `05-help.json` — /en/candidate/help (zero storage).
  - `06-privacy.json` — /en/candidate/privacy (zero storage).
  - `99-summary.json` — aggregated counts: 0 total storage requests, 0 imgproxy-pattern requests, 0 public-bucket requests.
  - `profile-capture.json` — /en/candidate/profile (1 storage request: `/storage/v1/object/public/...` pattern, NOT `/render/image/`).
- **Code review** (HIGH):
  - `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:188-241` — `_getCandidateUserData` returns `entities: {}` even with `loadNominations: true`. Empty entities = no Avatar render = no portrait fetch.
  - `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:120-141` — protected layout `userData.init(...)` + `provideEntityData(snapshot.entities)`; with empty entities, no Avatar component instantiation downstream.
  - `apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:25-48` — `parseStoredImage` returns `/storage/v1/object/public/...` URLs (NOT `/render/image/`); confirms read-path bypasses imgproxy.
  - `apps/frontend/src/routes/candidate/(protected)/+page.svelte` + `protected/+layout.svelte` — no `<Avatar>` / `<Image>` consumers (operator's discuss-phase scout confirmed; I re-verified via grep).
- **Historical evidence** (HIGH):
  - `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:5-32` — Phase 63 baseline showing CAND-03 upload `[pass -> fail]` + 13 downstream `[pass -> cascade]` entries (the smoking-gun cascade-pattern that originally bound the 14 imgproxy-tied titles).
- **Upstream documentation** (HIGH):
  - [Playwright issue #38860](https://github.com/microsoft/playwright/issues/38860) — "if the tests from a dependency fails then the tests that rely on this project will not be run." Default behavior, no opt-out (as of Jan 2026 feature request).

Sources:
- [Playwright Projects #38860 — sequential project execution control](https://github.com/microsoft/playwright/issues/38860)
- [Playwright Projects docs — testProject.dependencies](https://playwright.dev/docs/test-projects)
