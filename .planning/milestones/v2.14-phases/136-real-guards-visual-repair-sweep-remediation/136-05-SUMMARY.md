---
phase: 136-real-guards-visual-repair-sweep-remediation
plan: 05
subsystem: testing
tags: [playwright, visual-regression, screenshots, docker, ci, auth, forceRegister, e2e, fonts]
status: complete

requires:
  - phase: 136-01
    provides: "The fake-guard sweep audit (§F6) that identified the visual project as a non-functional guard"
  - phase: 135-02
    provides: "base-8 seeded question — the candidate preview page it changed is one of the four surfaces baselined here"
  - phase: 89-01
    provides: "The candidates-table-has-no-email-column verdict that shaped the registration contract"
provides:
  - "auth-setup authenticating against e2e/base — the visual chain runs end to end instead of failing at login"
  - "Four Linux/x86_64 baselines generated in the CI-matching container, depicting the live base dataset"
  - "A blocking e2e-visual CI job — a screenshot regression now fails the build"
  - "tests/tests/utils/selectElection.ts — shared /results election pin, the fix for a documented walk non-determinism"
  - "settleFonts — a webfont-settle gate that turns a font race into a named failure instead of a pixel diff"
affects:
  - "any future UI change touching /results or the candidate preview — it must now re-baseline in the container or CI goes red"
  - "any plan that needs an authenticated base candidate: the forceRegister contract now exists and is reusable"

actuals:
  tokens: 6800
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Generate screenshot baselines in the container that matches CI (mcr.microsoft.com/playwright:v<ver>-noble, --platform linux/amd64), never on the developer machine — a Mac-captured PNG is a permanently-red CI job"
    - "Forward host ports onto the container's own loopback (dual-stack socat) so URLs, cookies and storageState are byte-identical inside and out — no config indirection needed to run a containerised suite against a host stack"
    - "Prove a screenshot baseline by 3 consecutive re-runs with retries disabled; a single match is what a 0.2-threshold comparison yields on a good day"
    - "Registration of a seeded candidate is a RUNTIME act (forceRegister), not a seed column — mirror the perm-* mechanism rather than adding a second one"

key-files:
  created:
    - "tests/tests/utils/selectElection.ts"
  modified:
    - "tests/tests/utils/testCredentials.ts"
    - "tests/tests/setup/shared/auth.setup.ts"
    - "tests/tests/setup/shared/base.teardown.ts"
    - "tests/tests/specs/visual/visual-regression.spec.ts"
    - "tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/*.png"
    - "tests/playwright.config.ts"
    - ".github/workflows/main.yaml"

key-decisions:
  - "Reused the existing base candidate CA-AA-1 instead of adding a new seed row: any added candidate would change the results lists the voter journey asserts on, and the plan's own hard constraint was that the default suite must not move"
  - "Ran the container as --platform linux/amd64 (Rosetta) rather than native arm64, because CI's ubuntu-latest is x86_64 and arch-matched rasterisation is the whole point of leaving the Mac"
  - "Kept --workers=1 for generation and verification: that is what CI uses, and the voter walk does not survive 6-way contention under emulation (proven — the 6-worker attempt failed 2 of 4)"
  - "Pinned the Regional election rather than accepting whichever the walk lands on: the walk's landing election is a documented coin flip and the two lists differ by 1570px of height, so an unpinned baseline can never reproduce"
  - "Asserted Inter actually loaded rather than only awaiting document.fonts.ready: a runner without egress to fonts.googleapis.com would otherwise fail as an inscrutable whole-page diff"
  - "Left the numberScale probe's duplicate election-pin helper alone and logged it, rather than refactoring it inside a visual-repair plan"

patterns-established:
  - "Container-parity baselining: match the CI image tag to the repo's Playwright version, match the arch, match the worker count — then quote the exact command in the spec docblock so the next re-baseline is runnable rather than folkloric"
  - "When a screenshot will not reproduce, diff the DIMENSIONS first: a height delta means different content (a determinism bug), an identical-size text-offset diff means a font/layout race"

requirements-completed: [REAL-01]

coverage:
  - id: D1
    description: "auth-setup registers and authenticates a base candidate against e2e/base, writing a valid storageState"
    requirement: "REAL-01"
    verification:
      - kind: e2e
        ref: "tests/tests/setup/shared/auth.setup.ts#register + authenticate as base candidate (PLAYWRIGHT_VISUAL=1 --project=auth-setup)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Four visual baselines regenerated in the CI-matching Linux container, reproducing 3x consecutively"
    requirement: "REAL-01"
    verification:
      - kind: automated_ui
        ref: "docker run --platform linux/amd64 mcr.microsoft.com/playwright:v1.58.2-noble … --project=visual-regression --workers=1 (3 consecutive runs, 7/7 each)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The e2e-visual CI job is blocking — no continue-on-error, no advisory framing"
    requirement: "REAL-01"
    verification:
      - kind: other
        ref: "grep -c continue-on-error .github/workflows/main.yaml → 0; grep -c 'expected to fail' → 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The default yarn test:e2e suite is unperturbed by the added registration"
    verification:
      - kind: e2e
        ref: "FRONTEND_PORT=5180 yarn test:e2e → 134 passed (10.3m), exit 0; --list count 134 before and after"
        status: pass
    human_judgment: false

duration: 2h5m
completed: 2026-08-12
---

# Phase 136 Plan 05: Visual Regression Repair Summary

**The visual-regression project runs end to end for the first time since the base-dataset merge: a real registered base candidate, four Linux/x86_64 baselines of the live dataset, two determinism defects fixed, and a CI job that now blocks.**

## Performance

- **Duration:** ~2h 5m
- **Started:** 2026-08-11T19:30Z (approx.)
- **Completed:** 2026-08-11T21:25Z
- **Tasks:** 3
- **Files modified:** 11 (7 source/config, 4 PNG baselines)

## Accomplishments

- **The chain authenticates.** `auth-setup` force-registers base candidate CA-AA-1 through `SupabaseAdminClient` — the same mechanism every `perm-*` setup already used — and logs in through the real candidate-app form. The "deferred architectural item" `testCredentials.ts` had documented since Phase 89 is closed.
- **The four baselines are real.** Regenerated inside `mcr.microsoft.com/playwright:v1.58.2-noble` on `--platform linux/amd64`, matching CI's `ubuntu-latest` x86_64 runner. They depict the actual base dataset (candidate "Generic AA One", the post-135 question set) instead of a "Test Candidate Alpha" that `e2e/base` never seeded.
- **Two determinism defects were found and fixed** — without them no baseline of any provenance could have held (details below).
- **The job blocks.** `continue-on-error: true` is gone (it was the only occurrence in any workflow), the "currently expected to fail" comment is gone, and the step is renamed from "(opt-in, advisory)" to "(blocking)".
- **Nothing else moved.** `yarn test:e2e`: 134 tests before, 134 passed after, exit 0.

## Task Commits

1. **Task 1: Establish the registered base-candidate contract** — `83d2c4f32` (fix)
2. **Task 2: Generate canonical baselines in the CI-matching container** — `b1542119d` (fix)
3. **Task 3: Make the job blocking** — `38418f9d6` (fix)

## Files Created/Modified

- `tests/tests/utils/testCredentials.ts` — retires the `mock.candidate.2@openvaa.org` literal (which had no account against base); adds `TEST_CANDIDATE_EXTERNAL_ID` and derives the email from it. The stale deferred-item note is replaced by the actual contract.
- `tests/tests/setup/shared/auth.setup.ts` — `unregisterCandidate` + `forceRegister` before the UI login.
- `tests/tests/setup/shared/base.teardown.ts` — unregisters the auth user before the row wipe (stops the opt-in chain leaking `auth.users` rows).
- `tests/tests/utils/selectElection.ts` (new) — shared, collapse-aware `/results` election pin.
- `tests/tests/specs/visual/visual-regression.spec.ts` — election pin + `settleFonts` gate; the docblock's fictional "captured on the canonical CI runner" claim is replaced with the real, runnable container procedure.
- `tests/tests/specs/visual/__screenshots__/…/*.png` — the four regenerated baselines.
- `tests/playwright.config.ts` — the KNOWN GAP block now describes snapshot portability instead of a blocker that no longer exists.
- `.github/workflows/main.yaml` — job made blocking; comment documents the re-baseline requirement and the font-network dependency.

## Verification Evidence

**auth-setup against `e2e/base`** (host, `FRONTEND_PORT=5180 PLAYWRIGHT_VISUAL=1 --project=auth-setup`):

```
  ✓  1 [data-setup-base] › base.setup.ts:18:1 › import base dataset (852ms)
  ✓  2 [auth-setup] › auth.setup.ts:68:1 › register + authenticate as base candidate (2.5s)
  ✓  3 [data-teardown-base] › base.teardown.ts:26:1 › delete base dataset (171ms)
  3 passed (6.3s)
```

storageState written with a real Supabase session cookie (`sb-127-auth-token`), not a synthetic token. Re-run is idempotent, and `select count(*) from auth.users where email like 'test-e2e-base-%'` returns `0` after teardown.

**Baseline generation — the exact command.** Image `mcr.microsoft.com/playwright:v1.58.2-noble`, digest `sha256:6446946a…d63d`, resolved as `linux/amd64`, `Ubuntu 24.04.3 LTS (Noble Numbat)`, `x86_64`, node v24.13.0:

```
docker run --rm --platform linux/amd64 \
  --add-host=host.docker.internal:host-gateway \
  -v "$PWD":/work -v "$SP/in-container.sh":/run.sh -w /work \
  mcr.microsoft.com/playwright:v1.58.2-noble \
  /run.sh --project=visual-regression --update-snapshots --workers=1
```

`/run.sh` installs socat, raises dual-stack forwarders for 5180 / 54321 / 54324 onto the container loopback, asserts the served app is Election Compass, then runs Playwright. The stack (Vite + Supabase) stayed on the host; only the browser and the test runner moved into the container. That split was chosen because Supabase is itself a Docker compose stack and nesting it would have doubled the moving parts for no rasterisation benefit — the browser is the only component whose arch/font stack affects a PNG.

**3× consecutive stability, in-container, `--workers=1`, retries disabled** (stricter than CI, which retries 3×):

```
########## STABILITY RUN 1 ##########   7 passed (1.2m)
########## STABILITY RUN 2 ##########   7 passed (1.2m)
########## STABILITY RUN 3 ##########   7 passed (1.2m)
```

Each run: both voter-results screenshots, both candidate-preview screenshots, plus setups/teardown — 7/7. A **fourth** run under CI's exact invocation (`--grep "@visual"`) also passed 7/7, which additionally confirms that `--grep` does not filter out the setup projects (dependency projects are exempt) — worth knowing now that the job is blocking.

**Baselines changed materially** (old → new): `voter-results-desktop` 1280x1624 → 1280x3684, `voter-results-mobile` 390x1617 → 390x4152, `candidate-preview-desktop` 1280x720 → 1280x821, `candidate-preview-mobile` 390x844 → 390x924. The candidate preview now renders "Generic AA One" with a seeded portrait and the full info/opinion answer set.

**Default suite, before and after:** `--list` reported `Total: 134 tests in 88 files` both before task 1 and after task 3. Full run: `134 passed (10.3m)`, exit 0, on a fresh dev server and `yarn db:reset`.

**Gates:** `yarn format:check` exit 0, `yarn lint:check` exit 0 (2 pre-existing warnings in untouched files). Working tree clean apart from `supabase/.temp/cli-latest`.

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing one: **CA-AA-1 was reused rather than a new candidate seeded.** The plan's task 1 said "seed a registered candidate in `e2e/base`", but the `candidates` table has no email column, so a seeded row can never be a *registered* one — registration is necessarily a runtime `forceRegister`. Adding a new candidate row on top would have changed every results list the voter journey asserts against, violating the plan's own "must not perturb the default suite" constraint. Reusing CA-AA-1 satisfies both: it is already in the DB after `yarn db:seed --template e2e/base`, and it carries `terms_of_use_accepted` (no ToU gate) plus a full answer set (a preview page worth screenshotting).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `/results` screenshots captured a non-deterministic page**

- **Found during:** Task 2, at the first verification run after generating baselines.
- **Issue:** Both voter-results tests failed against baselines generated one run earlier. The diff was not a rendering difference — the page was 1570px shorter. `answerAndAdvanceToResults` lands on EL-Reg or EL-Mun by coin flip and the two lists carry different candidate counts. `numberScale.probe.spec.ts` and `voter-journey.spec.ts` both already pin the election for exactly this reason, in as many words; the visual specs were the one `/results` consumer that did not. Phase 135 hit the same latent dependency from the other side.
- **Fix:** Added `tests/tests/utils/selectElection.ts` (collapse-aware accordion pin) and pinned Regional in both voter-results tests before capture.
- **Verification:** Both voter-results cases passed in all 3 stability runs plus the CI-form run.
- **Committed in:** `b1542119d`

**2. [Rule 1 - Bug] Screenshots straddled the webfont swap window**

- **Found during:** Task 2, first stability run after fix #1 — `candidate-preview-desktop` failed at identical dimensions with every glyph horizontally offset.
- **Issue:** `staticSettings.font.url` loads Inter from Google Fonts with `display=swap`. A capture taken before the swap records `system-ui` advance widths: same boxes, shifted text. The voter cases never exposed it because their walk takes ~20s; the candidate-preview cases capture ~4s in and sat on the boundary.
- **Fix:** `settleFonts(page)` awaits `document.fonts.ready` and asserts `document.fonts.check('1em Inter')`, called before all four captures. The assertion is deliberate — a runner without egress to fonts.googleapis.com now fails as "Inter did not load" rather than as an unreadable whole-page diff.
- **Verification:** 3 consecutive clean runs + the CI-form run.
- **Committed in:** `b1542119d`

**3. [Rule 2 - Missing cleanup] The opt-in chain leaked `auth.users` rows**

- **Found during:** Task 1.
- **Issue:** `base.teardown.ts` deletes the candidate row but not the auth user `auth-setup` now mints, leaving an orphan that accumulates per run. Its docblock also asserted "the base chain runs no auth setup", which task 1 made false.
- **Fix:** `unregisterCandidate` before the row wipe (a no-op returning early when the user does not exist, so the default run is behaviourally unchanged), plus a corrected docblock.
- **Verification:** `select count(*) from auth.users where email like 'test-e2e-base-%'` → `0` after a run; full default suite still 134/134.
- **Committed in:** `83d2c4f32`

---

**Total deviations:** 3 auto-fixed (2× Rule 1, 1× Rule 2)
**Impact on plan:** No scope creep. Deviations 1 and 2 were prerequisites, not extras — a baseline of a non-deterministic page is not a weak guard, it is an unpassable one, and the plan's "3× consecutive" criterion is precisely what surfaced them. Deviation 3 is hygiene made necessary by task 1's own change.

## Issues Encountered

**Docker pulls hung indefinitely — two independent causes, both real.** The plan warned that Docker instability was a stop-and-report condition rather than something to work around with Mac-generated baselines. Both causes were diagnosed rather than routed around:

1. **The Docker VM disk was 99% full** (1.4 GB free of 103 GB). Reclaimed ~21 GB of regenerable space (`docker builder prune -af`, `docker image prune -f` — dangling only; no tagged user images were removed).
2. **The `desktop` credential helper was wedged.** `docker-credential-desktop get` never returned, which blocks `docker pull` before any network activity — explaining zero progress output for even a 4 MB `alpine` while `docker run`, `docker ps` and container networking all worked normally. Worked around with a `DOCKER_CONFIG` pointing at a scratch config with no `credsStore` (registry access here is anonymous). **This is a host-environment fault, not a repo fault** — it will recur for anyone pulling images on this machine until Docker Desktop's credential helper is repaired.

A Docker Desktop restart was attempted between the two and did not help, which is what isolated cause 2.

**Port identity.** Port 5173 was held by an unrelated project's Vite server (the wave-1 finding, reproduced). The suite ran on 5180 via `FRONTEND_PORT`, with the served-app identity asserted by title on the host and again inside the container before every run.

## Known Stubs

None. Every gate in this plan was executed and its real output quoted.

## Security Notes

The threat-model item was checked, not assumed:

- `TEST_CANDIDATE_EMAIL` / `TEST_CANDIDATE_PASSWORD` are referenced **only** under `tests/` (`grep -rn TEST_CANDIDATE_EMAIL apps packages` returns no source hits; the only other occurrences of the string `Password1!` are in `apps/docs` prose describing the retired Strapi mock users). No production code path reads them.
- The credential lives on `test.openvaa.local`, matching the existing `perm-*` registered candidates exactly — no new posture.
- `e2e/base` is seeded only against a local Supabase instance: `setupFromTemplate` resolves the URL from the local `.env`, and CI seeds a `supabase start` instance inside the runner. Nothing in the chain can target a production database.
- No new external input surface. The one new outbound dependency is the pre-existing Google Fonts request, now made explicit by `settleFonts` and recorded as a deferred item.

## Next Phase Readiness

The visual gate is live and blocking. Two things a future phase should know:

1. **Any intentional UI change to `/results` or the candidate preview now turns CI red until baselines are regenerated in the container.** The procedure is in the spec docblock and the workflow comment — both runnable, neither folkloric.
2. **The baselines depend on network access to fonts.googleapis.com** (deferred item D-136-05-2). Self-hosting Inter would remove a network dependency from a now-blocking gate; that is the highest-value follow-up here.

Deferred items D-136-05-1 (duplicate election-pin helper in the numberScale probe) and D-136-05-2 are logged in `deferred-items.md`.

---
*Phase: 136-real-guards-visual-repair-sweep-remediation*
*Completed: 2026-08-12*

## Self-Check: PASSED

All claimed files exist on disk and all three task commits are reachable in git history.
