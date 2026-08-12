# Phase 132: Milestone-Close Green Gate + svelte-check Zero Flip - Research

**Researched:** 2026-07-23
**Domain:** E2E determinism gating (Playwright) + CI type-check enforcement (svelte-check) + milestone-close bookkeeping
**Confidence:** HIGH

## Summary

This is a **process-and-gate phase**, not a feature phase. Three deliverables: (1) harden one
escalated cold-start load-contention flake at `candidate-journey.spec.ts:661` (step 13.5) before
starting the count; (2) run the full E2E suite green to the 3× determinism standard; (3) add a
**blocking** svelte-check CI step with `--fail-on-warnings` and record a `132-MILESTONE-CLOSE-ANCHOR.md`.
No external packages are installed; no source-behavior changes are expected (test-side + CI-yaml +
docs only, unless a genuine product race is proven).

Two scout findings verified live and confirmed load-bearing: **(a)** `apps/frontend` svelte-check
is **already 0 errors / 0 warnings** as of this session (2092 files checked — no drift since
Phase 128), so the TYPE-10 work is purely the CI-encoding flip, not error cleanup; **(b)** there is
**no svelte-check step in CI today** — the frontend job runs format/lint/unit/build only, so the
"flip" means **adding** a step, not editing a threshold. The installed `svelte-check@4.4.5` supports
`--fail-on-warnings` (verified via `--help`).

The step-13.5 harden has a clear, low-risk shape: the assertion at line 660-663 clicks
profile-submit via a **raw** `.click()` (no navigation wait) then immediately asserts
`candidate-home-status` visible. The proven fix is the candidate-app analog of Phase 131's
hardened `navigateToFirstQuestion`: settle the post-submit navigation (`waitForURL` back to the
`/candidate` home route) **before** asserting the status element, so the visibility check no longer
races the `goto()` + home-route remount under concurrent load.

**Primary recommendation:** Plan three serialized concerns — (1) test-side harden of step 13.5 +
prove isolated AND under full DAG (D-01/D-02); (2) svelte-check CI step + strict `check` script;
(3) the 3× full-suite gate + anchor doc. Only one `:5173` dev server exists, so all E2E-touching
plans serialize — no parallel waves.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Step-13.5 wait harden | E2E test harness (`tests/`) | — | Load-contention flake; test-side wait per D-03 default; product code only if a real race is proven |
| svelte-check gate | CI config (`.github/workflows/main.yaml`) | `apps/frontend/package.json` script | Type-check enforcement lives in CI; local `check` script is the shared source of truth |
| 3× determinism gate | E2E harness + local infra (Vite dev server + Supabase) | — | Runtime environment behavior; not a code change |
| Milestone-close anchor | Planning docs (`.planning/`) | REQUIREMENTS.md / ROADMAP.md / todos | Bookkeeping artifact consumed by `/gsd-complete-milestone` |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 — Fix flake before the gate:** Harden step 13.5's `candidate-home-status` wait per the
  todo Solution (settle profile-submit / home-route interactivity before asserting) BEFORE starting
  the 3× count.
- **D-02 — Prove at both load profiles:** After hardening, prove `candidate-journey` isolated
  (`--project=candidate-journey`) AND under the full concurrent DAG (a full-suite run — may double
  as gate run 1 if green). Terminal disposition FIXED; stamp + move todo to `todos/completed/`.
- **D-03 — Test-only default:** Default to a test-side harden. Product-code change only if a genuine
  product race is proven; flag explicitly if so.
- **D-04 — Run mechanics:** 3 **consecutive** full-suite `yarn test:e2e` runs, EACH with a fresh
  Vite dev server on `:5173` (no Playwright `webServer`; kill stale servers first) and a clean DB
  (`yarn db:reset` — no `default`-template pollution) before every run. Fresh-server-per-run is
  mandatory. Each run must be 0 failed / 0 did-not-run.
- **D-05 — Failure = restart the count:** ANY failure → root-cause, fix (never skip, never
  retry-until-green, "did not run" = failure), then restart the 3× count at 0.
- **D-06 — New-flake handling:** A new mid-gate flake is in-scope fix work: file a todo, fix in-phase,
  restart the count. Escalate only if genuinely out of budget — gate left honestly RED.
- **D-07 — Environment wedge ≠ test failure:** Runs invalidated by known local-infra wedges
  (repeated-`db:reset` storage-502 → `yarn db:stop && yarn db:start && yarn db:reset` then assert
  `public-assets` bucket; imgproxy 502 → restart Supabase) are discarded and re-run, not counted —
  but logged in the anchor. NEVER run bare `npx supabase start` from repo root.
- **D-08 — Encode the gate in CI:** Add a **blocking** svelte-check step to the
  `frontend-and-shared-module-validation` job (after build, alongside lint) running the frontend
  check with `--fail-on-warnings` so BOTH errors and warnings break the build. Reversibility: costly.
- **D-09 — Single source of truth preferred:** Prefer making the existing `apps/frontend` `check`
  script strict (`--fail-on-warnings` in `package.json:12`) so local `yarn check` and CI enforce the
  same standard; a separate `check:ci` variant only if a concrete DX reason is found. Locked part:
  blocking CI step + fails on warnings + frontend-scoped.
- **D-10 — Live re-verify:** Run svelte-check live at phase start and at close; fix any drift to 0/0
  in-phase.
- **D-11 — Anchor artifact:** Record `132-MILESTONE-CLOSE-ANCHOR.md` in the phase dir matching the
  v2.13 shape.
- **D-12 — Static gates included:** `yarn build`, `yarn test:unit`, `yarn lint:check` run green and
  are recorded in the anchor.
- **D-13 — Todo terminal dispositions:** Both `resolves_phase: 132` todos terminally disposed: flake
  todo → FIXED; svelte-check-zero todo → COMPLETE once the CI gate is flipped. Stamp + move to
  `todos/completed/`.

### Claude's Discretion
- Exact CI step naming/placement within the frontend job; whether svelte-check runs before or after
  the unit-test step (fail-fast ordering).
- Exact wait-condition mechanics for the step-13.5 harden (network-settle vs. element-state vs.
  timeout-profile), provided it follows the todo Solution and D-03.
- Whether gate runs execute via one orchestrated plan or split (flake-fix → flip → gate) — subject
  to the single-`:5173` serialization constraint.

### Deferred Ideas (OUT OF SCOPE)
- Milestone archive/close ceremony (`/gsd-complete-milestone`) — after this phase.
- Docs-app svelte-check CI gating — currently 0/0 but TYPE-10 scopes `apps/frontend`.
- RETURNS TABLE RPC nullability audit (`2026-07-16-...`) — Phase 126 follow-up, backend scope.
- The 39 keyword-noise product/infra backlog todos — NOT folded; next-milestone triage.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HARDN-02 | Full E2E suite (incl. every net-new v2.14 spec) passes to the 3× determinism standard (fresh server, clean DB, no flakes) at milestone close. | 3× gate protocol (D-04..D-07) + step-13.5 harden shape verified; env-wedge runbook confirmed; ~3.4–3.8m/run from v2.13 anchor; 47 `.spec.ts` files under `tests/tests/specs/` |
| TYPE-10 | `apps/frontend` svelte-check passes 0 errors / 0 warnings AND the CI gate is flipped from "≤151 baseline" to "0 absolute". | Live svelte-check = 0/0 (verified); `--fail-on-warnings` supported in 4.4.5 (verified); exact CI job + insertion point identified; no svelte-check step exists today (verified) |

## Standard Stack

No new packages. All tooling is already installed and pinned.

| Tool | Version | Purpose | Provenance |
|------|---------|---------|------------|
| svelte-check | 4.4.5 | Type-check `apps/frontend` (`.svelte` + `.ts`) | [VERIFIED: `node_modules/svelte-check/package.json` + `.yarnrc.yml:27` catalog `^4.4.5`] |
| @playwright/test | (installed) | Full E2E suite (`yarn test:e2e`) | [VERIFIED: `tests/playwright.config.ts` present] |
| Supabase CLI | latest (local) | Local backend for E2E | [VERIFIED: CLAUDE.md + CI `supabase/setup-cli@v1`] |
| Vite dev server | vite ^6.4.1 | Frontend dev server on `:5173` | [VERIFIED: `apps/frontend/package.json:50`] |

**Installation:** none required.

## Package Legitimacy Audit

**N/A** — this phase installs no external packages. It edits `.github/workflows/main.yaml`, one
line of `apps/frontend/package.json` (scripts), one E2E spec/fixture, and planning docs.

## svelte-check CLI semantics (verified this session)

`svelte-check@4.4.5` `--help` confirms the relevant flags:

```
--fail-on-warnings   Will also exit with error code when there are warnings  (default false)
--threshold          Filters diagnostics to display. `error`=errors only; `warning`=warnings+errors (default warning)
--output             human | human-verbose | machine | machine-verbose
```

[VERIFIED: `node_modules/.bin/svelte-check --help`]

- **Default behavior:** exits non-zero on **errors only**. `--fail-on-warnings` is REQUIRED for the
  "0 warnings" half of TYPE-10 (D-08). `--threshold` is a *display* filter, NOT an exit-code gate —
  do not use it for the gate.
- **`svelte-kit sync` prerequisite:** the `check` script already runs `svelte-kit sync` first
  (`package.json:12`). `sync` generates `.svelte-kit/` ambient types (including `$env/*` and
  `$app/*` virtual-module types). It needs (a) frontend deps installed (CI: `yarn install`), and
  (b) the shared `@openvaa/*` packages BUILT — the frontend imports resolve to their built `.js`,
  so a check run before `yarn build` would surface spurious module-resolution errors. In CI the
  `check` step must therefore run **after** the "Build all shared modules" (`yarn build`) step.
- **`.env` need:** `svelte-kit sync` reads `svelte.config.js`; `$env/static/*` type generation reads
  from `process.env` + any `.env`. The existing CI step at line 72-73
  (`cp .env.example apps/frontend/.env`) already provisions this for the frontend build. Placing the
  svelte-check step **after** that `cp` (i.e. after line 73, before or after "Build frontend") is
  the safe ordering. A build-then-check order also means `.svelte-kit` is already synced.

## Live svelte-check status (verified this session)

```
$ yarn workspace @openvaa/frontend check
COMPLETED  2092 FILES  0 ERRORS  0 WARNINGS  0 FILES_WITH_PROBLEMS
```

[VERIFIED: live run 2026-07-23] — **No drift.** Phases 129–131 touched frontend + tests but the
frontend type surface remains 0/0. The D-10 phase-start re-verify is effectively pre-satisfied; the
planner should still schedule a **phase-close** re-run (fast — a warm run completed in ~7ms of
reported work; a cold sync+check is on the order of a minute) as the last evidence line in the anchor.

**Implication for sizing:** the TYPE-10 work is essentially zero drift-fix + the CI/script wiring.
Do NOT budget for clearing "151 errors" — that baseline was cleared by Phases 125–128 and never
existed as an encoded CI check.

## CI wiring (exact, verified)

**File:** `.github/workflows/main.yaml`. **Job:** `frontend-and-shared-module-validation` (lines 36–76).
Current step order:

1. Checkout (43) → 2. Setup Yarn 4.13 (46) → 3. Setup Node 22.22.1 (51) →
4. `yarn install --frozen-lockfile` (57) → 5. **`yarn build`** — "Build all shared modules" (60) →
6. `yarn format:check` (63) → 7. `yarn lint:check` (66) → 8. `yarn test:unit` (69) →
9. `cp .env.example apps/frontend/.env` (72-73) → 10. `yarn workspace @openvaa/frontend build` (75-76).

**Recommended insertion (per D-08 "after build, alongside lint" + the sync/env constraints):** add a
blocking step **after step 9 (`cp .env`)** and adjacent to the frontend build — e.g.:

```yaml
      - name: "Configure frontend environment using the repo root .env.example file"
        run: cp .env.example apps/frontend/.env

      - name: "Type-check frontend (svelte-check, 0 errors / 0 warnings)"
        run: yarn workspace @openvaa/frontend check

      - name: "Build frontend"
        run: yarn workspace @openvaa/frontend build
```

- No `env:` block needed beyond the job's existing `TURBO_*` — the `.env` cp covers `$env` sync.
- The shared modules are already built by step 5, satisfying `@openvaa/*` resolution.
- Fail-fast (D-09 discretion): placing check before "Build frontend" fails a couple of seconds
  sooner on a type regression; placing it after is equivalent for correctness. Either is acceptable.

**Making the gate strict (D-08/D-09):** append `--fail-on-warnings` to the `check` script so local
`yarn check` and CI enforce the same 0/0 standard:

```jsonc
// apps/frontend/package.json:12  (CURRENT)
"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
// TARGET
"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings",
```

Note `typecheck` (line 11) and `check:watch` (line 13) are separate scripts; the locked scope is the
`check` script (the one CI invokes). Watch-mode friction is the only documented reason a `check:ci`
split would be justified — none found here, so the single-source-of-truth strict `check` is preferred.

## Step-13.5 harden (grounded analysis + recommended shape)

### The failing assertion (`candidate-journey.spec.ts:660-663`)

```ts
// Return to home so step 14's clickTask('profile') re-navigates cleanly.
await page.getByTestId(testIds.candidate.profile.submit).click();   // raw click — NO nav wait
await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
  timeout: TIMEOUTS.slowPage   // 10_000ms
});
```

### Why it flakes only under concurrent full-DAG load (root cause, verified against source)

- The click triggers `handleSubmit()` in
  `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:129-146`:
  `status='loading'` → `await userData.save()` → `status='success'` → `goto(submitRoute)`. With the
  required field still empty, `submitRoute` resolves to the `/candidate` home route.
- The home page renders `<p data-testid="candidate-home-status">` unconditionally at
  `candidate/(protected)/+page.svelte:107`, but its content derives from candidate-context reactive
  accessors (`unansweredRequiredInfoQuestions`, `unansweredOpinionQuestions`, `answersLocked` via a
  `$derived.by` at line 36). The element only becomes visible once the home route **remounts** after
  the `goto()`.
- Under the full perm-DAG at local `workers: 6` (`playwright.config.ts:62`), the shared single Vite
  dev server does on-demand SSR compilation of the candidate home route + DB round-trips under
  contention; the `save()` + `goto()` + home-mount chain can exceed `TIMEOUTS.slowPage` (10s). The
  raw `.click()` does NOT await navigation, so `toBeVisible` races the whole chain. **2/2 green in
  isolation** confirms this is contention, not a product regression (todo characterization).

### Recommended harden — candidate-app analog of Phase 131's `navigateToFirstQuestion`

Phase 131's proven pattern (`tests/tests/utils/voterNavigation.ts:282-305`): `waitForURL` to settle
the redirect, THEN a terminal element `waitFor({ state: 'visible' })` so the assertion sees a
fully-mounted page rather than a mid-transition DOM. The candidate analog:

```ts
await page.getByTestId(testIds.candidate.profile.submit).click();
// Settle the post-submit goto() onto the /candidate home route BEFORE asserting the
// status element, so toBeVisible no longer races the save()+goto()+home-remount chain
// under concurrent full-DAG load. Mirrors navigateToFirstQuestion's waitForURL+settle.
await page.waitForURL(/\/candidate(?!\/profile)/, { timeout: TIMEOUTS.slowPage });
await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
  timeout: TIMEOUTS.slowPage
});
```

- `TIMEOUTS.page` (5s) is the semantically-correct budget for the single-navigation `waitForURL`
  per the WR-01 advisory carried from Phase 131 (a redirect/re-mount boundary), but `slowPage` is
  acceptable and more cold-start-tolerant; the planner picks per the todo Solution. The KEY change
  is **splitting the URL settle from the element visibility** so the two waits compose additively
  instead of the element wait alone absorbing the full nav latency.
- An existing helper already encodes the URL predicate:
  `candidateProfilePage.expectSubmitMessage()` asserts `toHaveURL(/\/candidate(?!\/profile)/)`
  (`candidateProfilePage.fixture.ts:254-256`). The harden may reuse that fixture step before the
  status assertion rather than inlining `waitForURL`.
- Per D-03, keep this **test-side**. The source review found no product bug — `status` and the
  home render are correct; the flake is purely a missing navigation-settle in the test.

### Proving it (D-02)

```bash
# Isolated (fast, no perm chain):
yarn test:e2e --project=candidate-journey            # expect 2/2-style green, ~33s each

# Under the full concurrent DAG (this is what surfaced the flake) — a full-suite run:
yarn test:e2e                                        # doubles as gate run 1 if green
```

## 3× determinism gate logistics (verified)

### Per-run protocol (D-04)

```bash
# Before EACH of the 3 runs:
#   1. Kill any stale :5173 dev server (a stale server steals the port).
#   2. Clean DB:
yarn db:reset                       # migrations + seed.sql (0 elections — no default-template pollution)
#   3. Start ONE fresh dev server (no Playwright webServer configured):
yarn dev                            # or: yarn workspace @openvaa/frontend dev, after packages built
#   4. Wait for :5173 healthy, then:
yarn test:e2e                       # must be 0 failed / 0 did-not-run
```

- **Duration:** ~3.4–3.8 min per full run (v2.13 anchor: run-1 3.8m, run-2 3.7m, run-3 3.4m for
  95 tests). Current suite is 47 `.spec.ts` files / ~129 tests (CONTEXT), so budget ~4–8 min/run and
  ~15–30 min for the full 3× (plus fix/restart contingency).
- **Local profile is STRICTER than CI:** local `workers: 6, retries: 0`
  (`playwright.config.ts:62,60`) vs CI `workers: 1, retries: 3`. The higher local concurrency is the
  contention profile that surfaces load flakes (incl. :661) — the local 3× is the authoritative
  close standard, matching v2.10–v2.13 precedent.
- **Fresh-server-per-run is mandatory:** the v2.13 anchor recorded run-3 flaking purely from
  accumulated dev-server load (~16 min uptime, sustained SSR compile). Restart between runs.
- **Env-wedge recovery (D-07):** repeated-`db:reset` storage-502 →
  `yarn db:stop && yarn db:start && yarn db:reset`, then assert the `public-assets` bucket exists;
  imgproxy 502 → restart Supabase. Discard + re-run the invalidated run (log it in the anchor).
  NEVER `npx supabase start` from repo root (boots a foreign project off root `supabase/config.toml`
  and steals `:54322`).

### Evidence artifacts (Phase 131 precedent)

Phase 131 saved per-surface run logs under `131-e2e-.../post-fix/` (e.g. `131-voter-journey-3x.txt`,
`131-perm-hide-election-tags-3x.txt`, `131-phase-gate-summary.txt`, plus a `.gitkeep`). For Phase
132, mirror this: save the raw output of each of the 3 full-suite runs (e.g.
`132-.../gate/132-full-suite-run{1,2,3}.txt`) plus the isolated candidate-journey proof
(`132-candidate-journey-isolated.txt`) and the phase-start/phase-close svelte-check output. The
anchor doc's 3× table cites these files.

## Milestone-close anchor doc (structure to replicate)

Template: `.planning/milestones/v2.13-phases/116-milestone-close-green-gate/116-MILESTONE-CLOSE-ANCHOR.md`.
Required sections for `132-MILESTONE-CLOSE-ANCHOR.md` (per D-11/D-12):

1. **Header** — milestone (v2.14), recorded date, requirement(s) HARDN-02 + TYPE-10.
2. **Static gates table** — `yarn build` (turbo tasks), `yarn test:unit` (passed/files/failed),
   **svelte-check 0 errors / 0 warnings** (the CHANGED line vs v2.13's "151 baseline"), `yarn
   lint:check`. Include the `--fail-on-warnings` CI-encoding note.
3. **Full E2E 3× table** — one row per run with `Server / DB` provenance (fresh server + clean DB
   per run) and `Result` (passed / failed / did-not-run + duration).
4. **Environmental preconditions** — clean DB (no default-template pollution) + fresh server per run
   (the two v2.13 discovered preconditions D-04 locks).
5. **Discarded-run log (D-07)** — any env-wedge-invalidated run, why discarded, recovery applied.
6. **Anchor commit SHA.**

### Close bookkeeping (SC #3 / D-13) — the checklist the planner must encode

- [ ] `REQUIREMENTS.md`: flip `HARDN-02` (line 86) `[ ]`→`[x]` and `TYPE-10` (line 107) `[ ]`→`[x]`
      with completion notes.
- [ ] `ROADMAP.md` §"Phase 132" (~line 609+): tick the phase checkbox.
- [ ] Move both `resolves_phase: 132` todos from `todos/pending/` → `todos/completed/` with terminal
      stamps: `2026-07-22-candidate-journey-link-url-status-load-flake.md` → **FIXED** (D-01/D-02);
      `2026-06-12-resolve-all-svelte-check-errors.md` → **COMPLETE** (gate flipped, live 0/0).
- [ ] Record the anchor commit SHA in `132-MILESTONE-CLOSE-ANCHOR.md`.
- [ ] Do NOT run `/gsd-complete-milestone` — that ceremony is the next, separate step (deferred).

## Architecture Patterns

### Pattern 1: waitForURL-then-settle (load-tolerant post-nav assertion)
**What:** Split a post-navigation visibility assertion into (a) a `waitForURL` that settles the
route transition, then (b) the element `toBeVisible`/`waitFor`. Prevents the element wait from
racing the navigation + remount chain.
**When to use:** any assertion that fires immediately after a `.click()` that triggers a client-side
`goto()`/redirect, under concurrent-worker load.
**Source:** `tests/tests/utils/voterNavigation.ts:282-305` (Phase 131 hardened `navigateToFirstQuestion`).

### Pattern 2: single-source-of-truth strict check script
**What:** Put `--fail-on-warnings` in the shared `check` script so local `yarn check` and CI run the
identical gate — no CI-only variant that can silently diverge from local DX.
**When to use:** encoding a "0 absolute" type-check gate (D-08/D-09).

### Anti-Patterns to Avoid
- **Retry-until-green / test.skip on the :661 flake:** cardinal-rule violation (CLAUDE.md E2E hard
  rule). Root-cause the load window; harden the wait.
- **Using `--threshold warning` as the gate:** `--threshold` is a display filter, not an exit-code
  control. Use `--fail-on-warnings`.
- **Counting a "did not run" as a pass:** it's a failure (cascade from an upstream setup fail).
- **Running the check step before `yarn build`:** shared `@openvaa/*` imports won't resolve →
  spurious errors.
- **Bare `npx supabase start` from repo root:** boots a foreign project, steals `:54322`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Post-submit nav settle | ad-hoc `waitForTimeout(...)` sleep | `waitForURL` + terminal `waitFor` (Pattern 1) | Deterministic; sleeps are the flake source, not the fix |
| URL predicate for candidate home | inline regex duplicated per call | `candidateProfilePage.expectSubmitMessage()` (`/\/candidate(?!\/profile)/`) | Already exists in the fixture |
| Semantic timeouts | magic-number `{ timeout: 12000 }` | `TIMEOUTS.page` / `TIMEOUTS.slowPage` from `tests/tests/helpers/timeouts.ts` | Single-source budgets; MAX-observed semantics |
| svelte-check warning gate | custom grep of output lines | `--fail-on-warnings` (native, 4.4.5) | Native exit-code gate |

## Common Pitfalls

### Pitfall 1: svelte-check step ordered before shared-module build
**What goes wrong:** `@openvaa/*` imports fail to resolve; check reports module-not-found "errors."
**How to avoid:** place the CI step after "Build all shared modules" (`yarn build`, line 60).
**Warning signs:** TS2307 "Cannot find module '@openvaa/…'" only in CI, not locally.

### Pitfall 2: gate run at a polluted DB
**What goes wrong:** a pre-run DB holding `default`-template rows makes `voter-journey` stall at
constituency selection (a 3rd election renders whose constituency the fixture never selects →
Continue stays disabled). This caused the v2.13 first-attempt run-1 failure and is NOT a regression.
**How to avoid:** `yarn db:reset` (migrations + seed.sql = 0 elections) before EVERY run; never
`db:reset-with-data` / `db:seed --template default`.

### Pitfall 3: three suites against one long-lived dev server
**What goes wrong:** cumulative SSR-compile pressure surfaces an intermittent late-run timeout (v2.13
saw `perm-hide-election-tags` at test ~65/95 on run 3).
**How to avoid:** restart the Vite dev server fresh between each of the 3 runs (D-04).

### Pitfall 4: mistaking the env-wedge storage-502 for a suite failure
**What goes wrong:** repeated `db:reset` can wedge storage (502) or imgproxy; treating the resulting
run as a real failure would wrongly restart/blame the suite.
**How to avoid:** recover per D-07, discard + re-run, log in the anchor — do not count it.

## Code Examples

### Strict check script (target)
```jsonc
// apps/frontend/package.json
"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings",
```

### CI step (target insertion in frontend-and-shared-module-validation)
```yaml
- name: "Type-check frontend (svelte-check, 0/0)"
  run: yarn workspace @openvaa/frontend check   # runs svelte-kit sync + --fail-on-warnings
```

### Step-13.5 harden (target)
```ts
await page.getByTestId(testIds.candidate.profile.submit).click();
await page.waitForURL(/\/candidate(?!\/profile)/, { timeout: TIMEOUTS.slowPage });
await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
  timeout: TIMEOUTS.slowPage
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| svelte-check "≤151 baseline" as process bookkeeping | 0-absolute, encoded as a blocking CI step | This phase (TYPE-10) | Every future PR held to 0/0 |
| Immediate `toBeVisible` after submit click | `waitForURL`-then-settle | Phase 131 (voter) → Phase 132 (candidate analog) | Kills cold-start load-contention flakes |

**Deprecated/outdated:**
- The `2026-06-12-resolve-all-svelte-check-errors.md` "151-error" framing — the errors were cleared
  by Phases 125–128; only the CI-flip clause remains open.

## Runtime State Inventory

Not a rename/refactor/migration phase — no stored-data / OS-registered / secret-key surface. The only
"state" touched is: (1) the todo files moved pending→completed; (2) REQUIREMENTS.md/ROADMAP.md
checkboxes; (3) the new CI step (repo config). **No datastore, no OS registration, no secret, no
build-artifact rename involved.** (Verified — this is test + CI-yaml + docs work.)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ROADMAP.md Phase 132 checkbox is at ~line 609+ | Close bookkeeping | Low — planner greps the phase heading; line drifts harmlessly |
| A2 | Current full suite is ~47–52 spec files / ~129 tests, ~4–8 min/run | Gate logistics | Low — sizing only; actual run measures itself |
| A3 | `$env` type-gen in `svelte-kit sync` is satisfied by the existing `cp .env.example apps/frontend/.env` CI step | CI wiring | Low — if sync errors on missing env, move check after the cp (already recommended) |

*All load-bearing technical claims (svelte-check version + flags, live 0/0 status, CI step order,
the failing assertion + its source root cause) were VERIFIED live this session.*

## Open Questions

1. **Fail-fast ordering of the CI check step (before vs after "Build frontend").**
   - What we know: both are correct; before-build fails ~seconds sooner on a type regression.
   - Recommendation: planner's discretion (D-09); place after the `.env` cp either way.

2. **Whether to inline `waitForURL` or reuse `expectSubmitMessage()` in the step-13.5 harden.**
   - What we know: both encode the same `/\/candidate(?!\/profile)/` predicate.
   - Recommendation: reuse the fixture helper for consistency; either satisfies D-01/D-03.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| svelte-check | TYPE-10 gate | ✓ | 4.4.5 | — |
| Supabase CLI (local) | E2E backend | ✓ (project-established) | latest | — |
| Vite dev server | E2E `:5173` | ✓ | vite ^6.4.1 | — |
| yarn | all scripts | ✓ | 4.13 | — |
| Playwright browsers | `yarn test:e2e` | assumed installed (prior phases ran suite) | — | `yarn playwright install` if missing |

**Missing dependencies with no fallback:** none identified.
**Note:** the E2E env is the project-established local stack (host Vite + local Supabase, no Docker) —
per MEMORY, this -gsd repo runs the suite clean this way (v2.13: 95/0).

## Validation Architecture

> `workflow.nyquist_validation` not set to false → section included. This phase IS a validation
> gate, so the "test map" is the gate itself.

### Test Framework
| Property | Value |
|----------|-------|
| E2E framework | Playwright (`tests/playwright.config.ts`) |
| Unit framework | Vitest (`yarn test:unit`) |
| Type-check | svelte-check 4.4.5 (`yarn workspace @openvaa/frontend check`) |
| Quick E2E run | `yarn test:e2e --project=candidate-journey` |
| Full E2E run | `yarn test:e2e` (fresh server + clean DB) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | Exists? |
|--------|----------|-----------|-------------------|---------|
| HARDN-02 | Full suite green 3× | e2e | `yarn test:e2e` ×3 (fresh server/clean DB each) | ✅ |
| HARDN-02 | :661 flake fixed | e2e | `yarn test:e2e --project=candidate-journey` + full-DAG run | ✅ (harden target) |
| TYPE-10 | svelte-check 0/0 | typecheck | `yarn workspace @openvaa/frontend check` | ✅ (live 0/0) |
| TYPE-10 | gate encoded in CI | ci | new step in `main.yaml` + `--fail-on-warnings` | ❌ Wave 0 (add) |
| SC#3 | build/unit/lint green | static | `yarn build`, `yarn test:unit`, `yarn lint:check` | ✅ |

### Sampling Rate
- **Per gate run:** full `yarn test:e2e` (fresh server, clean DB).
- **Phase gate:** 3 consecutive green runs + static gates + svelte-check 0/0.

### Wave 0 Gaps
- [ ] CI svelte-check step in `.github/workflows/main.yaml` (new — does not exist today).
- [ ] `--fail-on-warnings` on the `check` script.
- [ ] Step-13.5 harden in `candidate-journey.spec.ts:660-663`.

## Security Domain

Minimal surface. This phase adds a CI type-check step and a test-wait change — no auth, crypto,
input-validation, or data-access changes.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | no | (no runtime input paths touched) |
| V6 Cryptography | no | — |
| V14 Config / CI | yes (indirect) | The new CI step hardens the pipeline (stricter gate); no secrets added — uses `.env.example` copy already present |

No new secrets, no new network calls, no dependency additions.

## Sources

### Primary (HIGH confidence — verified live this session)
- `node_modules/svelte-check/package.json` + `--help` — version 4.4.5, `--fail-on-warnings` exists.
- `yarn workspace @openvaa/frontend check` live run — 2092 files, 0 errors / 0 warnings.
- `.github/workflows/main.yaml:36-76` — frontend job step order (no svelte-check step present).
- `apps/frontend/package.json:11-13` — `check`/`typecheck`/`check:watch` scripts.
- `tests/tests/specs/candidate/candidate-journey.spec.ts:636-664` — step 13.5 flow + failing assertion.
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:129-146` — submit→goto flow.
- `apps/frontend/src/routes/candidate/(protected)/+page.svelte:36,107` — home status render.
- `tests/tests/utils/voterNavigation.ts:282-305` — Phase 131 waitForURL-then-settle pattern.
- `tests/tests/helpers/timeouts.ts` — TIMEOUTS bucket semantics.
- `tests/playwright.config.ts:60-62,~415` — retries/workers + perm-DAG `dependencies`.
- `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:243-256`, `candidateHomePage.fixture.ts:67-73`.

### Secondary (project-established, from CONTEXT/anchor)
- `116-MILESTONE-CLOSE-ANCHOR.md` — anchor structure + the two env preconditions.
- Both `resolves_phase: 132` todos — flake characterization + svelte-check-zero substance.
- `131-.../post-fix/` — evidence-artifact convention.

## Metadata

**Confidence breakdown:**
- Standard stack / tooling versions: HIGH — verified live.
- CI wiring: HIGH — exact job/step order read from the workflow file.
- Step-13.5 root cause + harden shape: HIGH — traced through spec + source; matches Phase 131 pattern.
- Gate logistics / durations: MEDIUM — durations extrapolated from v2.13 anchor (different test count).

**Research date:** 2026-07-23
**Valid until:** 2026-08-22 (stable; re-verify svelte-check live at phase close per D-10, and confirm
no new specs landed that change the suite count).
