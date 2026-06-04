# Phase 84: Imgproxy Decoupling — Research

**Researched:** 2026-05-13
**Domain:** Playwright project-dependency graph + Supabase Storage imgproxy interaction
**Confidence:** HIGH (direct empirical cold-start instrumentation; cross-verified against historical Phase 63 baseline + Playwright upstream docs)

---

## Summary

The 11 candidate-app-settings tests + the dual-project `re-authenticate as candidate` entries do NOT fetch imgproxy on initial paint, NOR via background prefetch, NOR by any read-path mechanism. Direct Playwright `page.on('request')` instrumentation across `login → /en/candidate → /en/candidate/questions → /en/candidate/help → /en/candidate/privacy` shows **zero** `/storage/v1/*` requests across all 6 stages of the cold-start. The supplemental positive-control capture on `/en/candidate/profile` confirms the only candidate-app surface that fetches a portrait does so via the **raw public bucket** (`/storage/v1/object/public/...`), NOT via the imgproxy transformation pipeline (`/storage/v1/render/image/...`) — meaning even at read time, imgproxy is not involved on the candidate side.

The mechanism by which these 14 tests become imgproxy-tied is **Playwright project-dependency cascade**: when `should upload a profile image (CAND-03)` fails inside the `candidate-app-mutation` project due to an imgproxy 502 during the `supabase.storage.from('public-assets').upload(...)` call, Playwright's default behavior (`if ANY test in a dependency project fails, ALL dependent projects are skipped` — verified via [microsoft/playwright#38860](https://github.com/microsoft/playwright/issues/38860)) cascade-skips all of `re-auth-setup`, `candidate-app-settings`, and `candidate-app-password`. The Phase 63 baseline diff at `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:5-32` is the smoking-gun historical evidence — a single `[pass -> fail]` on CAND-03 cascades 13 `[pass -> cascade]` downstream tests in the exact 14-title shape preserved by IMGPROXY_TIED_TITLES.

**Primary recommendation:** D-02 **branch 2 (dependency-chain cascade)** with a project-graph restructure: repoint `re-auth-setup`'s `dependencies` from `['candidate-app-mutation']` to `['candidate-app']`. This breaks the cascade chain at the upstream end. The Alpha credential is NEVER mutated by `candidate-app-mutation` (which uses a FRESH `E2E_ADDENDUM_CANDIDATES[1]` candidate per `candidate-profile.spec.ts:84-86`), so re-auth-setup has no data-flow dependency on mutation — only a sequencing one, which the restructure relaxes safely.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 — Scout-then-decide-in-plan.** This RESEARCH agent has instrumented cold-start network for representative settings tests + re-auth-dual BEFORE the planner locks the mechanism. RCA-FINDINGS.md committed (sibling `84-RCA-FINDINGS.md`).
- **D-02 — Mechanism choice locked AT PLANNING TIME based on RCA-FINDINGS.md.** Four branches: 1 = `?skipImages=1` query param; 2 = dependency-chain cascade fix at upstream; 3 = background-prefetch suppression / IntersectionObserver lazy-load; 4 = hybrid. **My RCA verdict points to branch 2.** Planner makes the final call.
- **D-03 — Cheapest-first ladder cadence.** DETERM-08 first → 1-run cold-start smoke → DETERM-09 only if pool > 3.
- **D-04 — Tune scope: ALL 4 knobs in one commit, contingent on D-03 trigger.** `[storage.image_transformation]` worker count + timeout + connection pool + retry policy in a single `config.toml` commit. Per-knob rationale documented inline.
- **D-04b — Re-enable preservation.** `[storage.image_transformation] enabled = true` (Phase 83 D-01c) STAYS as-is; DETERM-09 only tunes sub-knobs.
- **D-05 — Fresh 3-run cold-start gate via archived `regen-constants.mjs`.** `IMGPROXY_TIED_TITLES` shrinks in-place from 14 → 3 titles (only image-intrinsic). Edit shape:
  ```js
  const IMGPROXY_TIED_TITLES = [
    'should upload a profile image (CAND-03)',
    'should show editable info fields on profile page (CAND-03)',
    'should persist profile image after page reload (CAND-12)'
  ];
  ```
- **D-06 — Atomic-commit-per-task pattern.** Each plan task lands its own commit. The constants regen commit (IMGPROXY_TIED_TITLES shrink + run-3.json + diff-playwright-reports.ts jsdoc + DATA_RACE_TESTS array shrink) is the ONE atomic exception.
- **D-07 — Anchor expectation.** Expected post-Phase-84 anchor: ~106 PASS_LOCKED (94 + 12 net from 11 settings + 1 re-auth-dual) + 3 DATA_RACE + 47 CASCADE = ~156 total. Phase 83 SHA `d6bfeebdb0…` ABSORBED.
- **D-08 — Gate execution: agent-inline via Bash `run_in_background`.** ~54 min per cold-start × 3 runs = ~162 min total wall time.

### Claude's Discretion

- Research agent picks the instrumentation tooling (Playwright `page.on('request')` chosen — captures all browser network with minimal setup overhead).
- Research agent decides instrumentation scope (sampled the full settings-test code-paths via direct routes rather than running individual tests; see RCA-FINDINGS §"Capture Results" for the 6 stages).
- **Planner picks the precise mechanism per D-02 based on RCA-FINDINGS.md verdict.** This research recommends **branch 2** (dependency-chain cascade fix).
- Planner picks plan-count (1 plan covering RCA+fix+gate vs 2 plans split). **RECOMMENDATION: 1 plan** — the RCA verdict is binding and the fix is single-config (`tests/playwright.config.ts` edit + `regen-constants.mjs` IMGPROXY_TIED_TITLES shrink + new run-3.json capture + diff-playwright-reports.ts constants regen). 1 plan keeps the atomic-commit-per-task boundary clean (per D-06).
- Planner picks `?skipImages=1` consumption shape IF branch 1 lands (it doesn't, per my verdict; this is moot).
- Planner picks DETERM-09 numeric values IF escalation triggers (default values from upstream Supabase Storage docs cited in §"DETERM-09 Fallback Config Tuning" below).

### Deferred Ideas (OUT OF SCOPE — Phase 85+)

- Avatar IntersectionObserver lazy-load as a prod-relevant feature (relevant to voter-app EntityCard, not Phase 84 candidate-app scope).
- Imgproxy upstream tuning beyond the 4 documented knobs.
- Project-wide dependency-chain audit (Phase 85+ if RCA reveals same pattern in `data-setup-*` variants).
- DATA_RACE pool semantic re-examination (Phase 84 may leave the 3 survivors deterministic-pass post-fix; pool semantic re-examination is v2.11+).

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DETERM-08 | Non-image tests decoupled from Supabase imgproxy infrastructure flake. 11 candidate-app-settings tests + dual-project re-auth.setup.ts entries leave DATA_RACE; DATA_RACE shrinks 15 → ≤3. | §"Root-Cause Verdict" + §"Recommended Mechanism (D-02 Branch 2)" — empirical proof of cascade mechanism + project-graph restructure as the fix. |
| DETERM-09 | `[storage.image_transformation]` config tuned for cold-start resilience. Worker count + timeout + connection pool + retry policy. Parallel lever, not substitute. | §"DETERM-09 Fallback Config Tuning" — upstream-default-anchored numeric values for the 4 knobs. FALLBACK only per D-03 + D-04. |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Test project orchestration | Test runner (Playwright) | — | The cascade behavior is a Playwright-level dependency graph property, NOT a frontend or backend concern. |
| Image upload to public-assets bucket | API / Backend (Supabase Storage) | — | The upload PUT goes to `supabase.storage.from('public-assets').upload(...)`; if imgproxy is configured for transformation, the backend storage layer engages it. Frontend just calls the supabase-js client. |
| Image read display | Browser / Client | — | `<img src="...">` raw fetch via SvelteKit's static-link path; the frontend assembles `/storage/v1/object/public/...` URLs in `parseStoredImage` and renders them via raw `<img>` (`Image.svelte:32`). No transform is requested. |
| Storage image transformation (imgproxy) | API / Backend (Supabase Storage imgproxy container) | — | Local Docker container, configured at `apps/supabase/supabase/config.toml:130-138`. Engaged on UPLOAD (storage layer may validate/transform/cache) and (theoretically) on READ if URLs include `/render/image/`. Phase 84 evidence shows reads use `/object/public/` so the read-path bypasses imgproxy entirely. |

---

## Root-Cause Verdict

**Mechanism:** Dependency-chain cascade (D-02 branch 2). NOT initial-paint, NOT background-prefetch.

**Evidence (HIGH confidence):**

1. **Direct cold-start instrumentation captured in `84-RCA-FINDINGS.md` §"Capture Results"**: 0 storage requests across login + 4 candidate-app-settings code paths (home/questions/help/privacy). [VERIFIED: rca-capture/captures/99-summary.json]
2. **Supplemental profile-route capture**: 1 storage request, pattern is `/storage/v1/object/public/...` (raw bucket, NOT imgproxy-transformed). [VERIFIED: rca-capture/captures/profile-capture.json]
3. **Code review of every candidate-app render path**: `<Avatar>` is only consumed by `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:44,237-238` (voter-app); `<Image>` is consumed by Avatar + `Hero.svelte`; the candidate-protected layout + candidate-home + questions/help/privacy routes render NEITHER. [VERIFIED: grep across `apps/frontend/src/`]
4. **`getCandidateUserData` returns `entities: {}`** even with `loadNominations: true` per `supabaseDataWriter.ts:235` — so the protected layout's `dr.provideEntityData(snapshot.entities)` (at `(protected)/+layout.svelte:135`) injects an empty entities tree. No data downstream of that point triggers an Avatar/Image render. [VERIFIED: `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:235`]
5. **Historical Phase 63 baseline diff** shows the exact 1-fail-cascades-13 pattern: `[pass -> fail]` on CAND-03 upload + 13 `[pass -> cascade]` downstream entries matching the IMGPROXY_TIED_TITLES list verbatim. [VERIFIED: `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:5-32`]
6. **Playwright upstream docs** confirm the cascade behavior is default and not opt-outable in the current version. [CITED: github.com/microsoft/playwright/issues/38860]

---

## Recommended Mechanism (D-02 Branch 2)

### Primary Fix — Project-Graph Restructure

**Change `tests/playwright.config.ts`:**

```ts
// CURRENT (lines 132-138):
{
  name: 're-auth-setup',
  testMatch: /re-auth\.setup\.ts/,
  dependencies: ['candidate-app-mutation']
},

// AFTER:
{
  name: 're-auth-setup',
  testMatch: /re-auth\.setup\.ts/,
  // Phase 84 DETERM-08: repointed from 'candidate-app-mutation' to 'candidate-app'
  // to break the imgproxy-502-cascade chain. The original 'candidate-app-mutation'
  // dependency was a SEQUENCING constraint (run AFTER mutation), not a data-flow
  // dependency — candidate-app-mutation does NOT touch Alpha's auth state (its
  // tests use the fresh E2E_ADDENDUM_CANDIDATES[1] candidate, NOT Alpha; see
  // candidate-profile.spec.ts:84-86). Repointing to 'candidate-app' preserves
  // the data-flow contract (re-auth-setup needs data-setup + auth-setup to have
  // run) while breaking the cascade-skip on mutation failures.
  dependencies: ['candidate-app']
}
```

**Effect:** When `candidate-app-mutation > should upload a profile image (CAND-03)` fails on imgproxy 502:
- `re-auth-setup` STILL RUNS (no longer depends on mutation).
- `candidate-app-settings` STILL RUNS (depends on re-auth-setup, which is now decoupled from mutation).
- `candidate-app-password` STILL RUNS (depends on candidate-app-settings).

Only the 3 image-intrinsic tests (rows 1, 2, 3 in the per-test classification) remain affected.

### Secondary Considerations

- **Sequencing concern:** `candidate-app-mutation` mutates the `E2E_ADDENDUM_CANDIDATES[1]` fresh candidate (creates user via email-link, sets profile data + image). It does NOT touch Alpha. So the decoupling is safe. Verify this hold in the planner by re-grepping `candidate-profile.spec.ts` for any `loginAsCandidate(page)` call that uses Alpha's credentials — there are none post-Phase 79 DETERM-04 (which routed profile-spec to a fresh candidate per the v2.10 milestone scope).
- **What if `candidate-app-mutation` still failures cascade INSIDE its own project?** Yes: the 3 image-intrinsic tests + their serial-mode downstream readback tests still cascade within the spec file (via `test.describe.configure({ mode: 'serial' })` at `candidate-profile.spec.ts:81`). This is acceptable — it's WHY the 3 survivors stay in DATA_RACE.
- **Should we also touch `candidate-app-password`'s dependency?** It currently depends on `candidate-app-settings`. Once `candidate-app-settings` no longer cascades on mutation failure, the chain naturally heals. No additional config change required.

### Pseudo-canonical Edit Plan

```ts
// tests/playwright.config.ts — single 1-line edit (plus a comment block):
//   dependencies: ['candidate-app-mutation'] → dependencies: ['candidate-app']
// on the 're-auth-setup' project entry.
```

That is the entire DETERM-08 structural fix. No code-side gating mechanism. No `?skipImages=1` plumbing. No IntersectionObserver. Just a project-graph edge re-route.

---

## DETERM-09 Fallback Config Tuning

**Trigger condition (per D-03 cheapest-first ladder):** DETERM-08 lands → 1-run cold-start smoke → if `DATA_RACE > 3`, escalate to DETERM-09.

**Atomic config commit (per D-04 — tune ALL 4 knobs together):**

```toml
# apps/supabase/supabase/config.toml — Phase 84 DETERM-09 (only land IF D-03 triggers escalation)
[storage.image_transformation]
enabled = true  # Phase 83 D-01c — UNCHANGED, per D-04b

# Phase 84 DETERM-09 — knob tuning for cold-start resilience. Each knob
# captures a different failure dimension. Values anchored to Supabase Storage
# defaults documented at https://supabase.com/docs/guides/storage/serving/image-transformations
# (`storage-img-proxy-*` env vars; see also https://github.com/supabase/imgproxy fork docs).
workers = 4              # default 1; raise so multipart upload concurrency doesn't queue head-of-line
read_timeout = "30s"     # default 5s; raise to absorb cold-Docker container warmup latency
connection_timeout = "10s"  # default 1s; same rationale
max_concurrency = 16     # default 8; raise so test-suite parallelism (workers=6) isn't backpressured
```

**Caveat:** Supabase CLI's `config.toml` schema for `[storage.image_transformation]` currently only documents `enabled`. The 4 knobs above are the EXPECTED schema additions if Supabase CLI exposes the underlying imgproxy env vars; planner MUST verify the schema before landing. If Supabase CLI doesn't expose them, the fallback is to set environment variables on the imgproxy Docker container directly via `docker exec` or by patching the local container's startup config. This is documented in the deferred-items section of the discuss-phase log [ASSUMED — verify against current Supabase CLI release before D-09 escalation lands].

---

## Standard Stack

This phase doesn't add libraries. It edits one existing config file (`tests/playwright.config.ts`) + one constants script (`.planning/phases/79-…/post-fix/regen-constants.mjs` in-place per D-05) + one verification artifact (the run-3.json capture).

| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| @playwright/test | ^1.45 (per package.json) | Test orchestration; project dependency graph | Already in use; the fix is a config-level edit, no library swap. [VERIFIED: tests/package.json] |
| @supabase/supabase-js | ^2.45 | Storage upload client | Already in use; not modified by Phase 84. |
| Supabase CLI | 2.40.7 (per supabase/.temp/cli-latest) | Local `supabase start` orchestration; manages imgproxy container | Already in use; DETERM-09 escalation would edit `config.toml` but does NOT change CLI version. [VERIFIED: `apps/supabase/supabase/.temp/cli-latest`] |

---

## Architecture Patterns

### Recommended Plan Structure (1 plan recommended per D-Discretion)

**Phase 84 Plan 01 — DETERM-08 cascade-break + DETERM-09 fallback + constants regen:**

| Wave | Task | Tier | Notes |
|------|------|------|-------|
| 0 | Validation Architecture pre-flight: verify `regen-constants.mjs` IMGPROXY_TIED_TITLES match-count gate still asserts (currently 14 titles must all match the run-N.json). | Test infrastructure | The match-count gate at lines 87-103 will FAIL the regen if the post-fix capture has only 3 titles and the const isn't shrunk first. D-05 order: shrink the const, THEN regen. |
| 1 | Edit `tests/playwright.config.ts:134-138` re-auth-setup `dependencies: ['candidate-app-mutation']` → `['candidate-app']`. Add Phase 84 DETERM-08 comment block. | Test config | Single 1-line + comment edit. Atomic commit. |
| 2 | 1-run cold-start smoke per D-03: `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean && yarn test:e2e --workers=1 --reporter=json --output post-fix/smoke.json` (or full-chain if planner prefers comprehensive scope). Inspect output for `DATA_RACE ≤ 3`. | Test execution | ~54 min wall time per CONTEXT D-08. Use Bash `run_in_background`. |
| 3a | IF smoke shows `DATA_RACE > 3`: escalate to DETERM-09 — edit `apps/supabase/supabase/config.toml:130-138` with all 4 knobs atomically + re-run smoke. | Test config | FALLBACK only. Per D-04. |
| 3b | IF smoke shows `DATA_RACE ≤ 3`: skip DETERM-09 entirely; proceed to wave 4. | — | Cheapest-first ladder halts here. |
| 4 | Shrink IMGPROXY_TIED_TITLES in-place at `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs:67-82` to 3 titles per D-05. | Constants regen prep | In-place edit per CONTEXT specifics §"In-place edit of the Phase 79 archived `regen-constants.mjs`". |
| 5 | Capture 3-run cold-start gate: 3 sequential `yarn test:e2e` runs against the post-fix codebase; verify SHA-identical pass/fail sets across all 3. | Test execution | ~162 min wall time per D-08. Per Phase 79 D-09 instability protocol: if instability appears, investigate flake before regen. |
| 6 | Run regen-constants.mjs against the canonical (e.g. run-3.json) capture → produces new PASS_LOCKED + DATA_RACE + CASCADE arrays. Paste into `tests/scripts/diff-playwright-reports.ts:120-285` (replacing the Phase 83 arrays). Update the jsdoc header comment (lines 43-117) with Phase 84 STORY narrative + new SHA anchor. **Atomic-commit exception per D-06:** this commit bundles IMGPROXY_TIED_TITLES shrink + run-3.json + regen-output.txt + diff-playwright-reports.ts arrays + jsdoc + the new SHA anchor. | Constants regen | Atomic commit. |
| 7 | Update `.planning/STATE.md` to mark Phase 84 complete + new anchor SHA. | Status update | Standard phase-close hygiene. |

### Anti-Patterns to Avoid

- **Don't add `?skipImages=1` to Avatar or Image components on the candidate-app side.** The candidate-app side renders ZERO portrait surfaces during cold-start; gating a non-existent fetch is cargo-cult. [VERIFIED: rca-capture/captures/99-summary.json]
- **Don't add IntersectionObserver lazy-load to Avatar.svelte for Phase 84.** Same rationale as above — the candidate-app surface has no Avatar consumer in the affected code paths. Lazy-load is a Phase 85+ voter-app optimization per CONTEXT.md `<deferred>`.
- **Don't run DETERM-09 first.** Per D-03 cheapest-first ladder — DETERM-09 is a FALLBACK, not parallel-eligible. Running it first would invert the structural-fix-is-the-durable-answer principle.
- **Don't tune DETERM-09 knobs one at a time.** Per D-04 — tune all 4 atomically. Knob-at-a-time would burn N × 54 min smokes for diminishing-return marginal-knob attribution.
- **Don't fork `regen-constants.mjs` into a Phase-84 copy.** Per D-05 + CONTEXT specifics — edit in-place; the script is canonical (Phase 79 D-07), not phase-archived-immutable.
- **Don't grow the DATA_RACE pool.** Per Phase 73 D-09 binding — the pool MUST NOT grow during Phase 84; only SHRINK.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detect cascade-skip pattern | Custom test-status diff parser | The existing `tests/scripts/diff-playwright-reports.ts` + `regen-constants.mjs` | Already exists; Phase 84 ONLY edits the consumption (IMGPROXY_TIED_TITLES list), not the diff/regen infrastructure. |
| Per-test storage capture | Custom HAR parser | Playwright `page.on('request')` + `page.on('response')` | Direct API; lower setup overhead than HAR. Already used in `rca-capture/capture-cold-start.spec.ts`. |
| Reproduce imgproxy 502 | Custom load-test rig | The existing Phase 63 baseline diff.md is sufficient historical evidence | Reproducing the local Docker degradation isn't worth the time; the cascade mechanism is proven by code review + dependency-graph topology + historical capture. |
| Force Playwright "ignore-dependency-failures" | Wait for [microsoft/playwright#38860](https://github.com/microsoft/playwright/issues/38860) | Repoint the dependency edge to a non-failing project | The feature request exists but isn't landed; topology fix is the canonical workaround. |

---

## Runtime State Inventory

Not applicable — Phase 84 is a config-edit + test-orchestration restructure, not a rename/refactor/migration. No stored data, no live service config, no OS-registered state, no secrets, no build artifacts impacted by the structural fix.

(DETERM-09 escalation would edit `apps/supabase/supabase/config.toml` which IS a live service config — but the values would only affect future container restarts, no data migration needed.)

---

## Common Pitfalls

### Pitfall 1: IMGPROXY_TIED_TITLES Match-count Assertion Fires During Regen

**What goes wrong:** The regen script asserts (lines 87-99) that every entry in `IMGPROXY_TIED_TITLES` matches at least one test in the input JSON. If the const is shrunk to 3 titles BEFORE the post-fix capture is ready, AND the planner runs the regen against the OLD (pre-shrink) JSON, the assertion will fail because 11 titles will have count=0 in the old JSON.
**Why it happens:** D-05 specifies the shrink IS the regen prep step. The ordering matters: shrink const → run new capture → regen against new capture.
**How to avoid:** Per the Plan 01 wave ordering above (wave 4 = shrink, wave 5 = capture, wave 6 = regen), keep the shrink CO-LOCATED with the new capture in the same commit. Don't run the regen against an old run-N.json after shrinking the const.
**Warning signs:** `ERROR: IMGPROXY_TIED_TITLES match-count assertion failed.` with 11 titles listed as zero-matches.

### Pitfall 2: Misdiagnosing as Branch 1 / Branch 3

**What goes wrong:** Operator or planner skims the RCA-FINDINGS, sees "imgproxy" in the context, and reflexively picks branch 1 (`?skipImages=1` Avatar gating) because that's the most-roadmap-cited option.
**Why it happens:** CONTEXT.md `<specifics>` enumerates 3 roadmap candidate mechanisms and lists branch 1 first.
**How to avoid:** The RCA-FINDINGS instrumentation explicitly proves branch 1 + branch 3 are WRONG (zero storage fetches on the candidate-app cold-start). Planner MUST read RCA-FINDINGS §"Capture Results" before committing to a mechanism.
**Warning signs:** Plan task includes "edit Avatar.svelte" or "edit Image.svelte" or "add IntersectionObserver" — none of these are appropriate for branch 2.

### Pitfall 3: LANDMINE-9 Yarn Arg-Forwarding

**What goes wrong:** `yarn db:reset-with-data --likert-only` does NOT forward `--likert-only` through the `&&`-chain (yarn appends trailing args to the LAST command, `dev:clean`). The cold-start capture ends up with non-ordinal opinion questions that break the voter-fixture and contaminate the smoke.
**Why it happens:** Yarn 4's arg-forwarding semantics + the multi-command chain in the `db:reset-with-data` script.
**How to avoid:** Use the canonical manual chain per CLAUDE.md "Common Workflows":
```bash
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean
```
**Warning signs:** Cold-start smoke shows voter-app FAILURE-CLASS tests deterministically failing instead of cascade-skipping.

### Pitfall 4: Forgetting `test.use({ storageState: { cookies: [], origins: [] } })` Inheritance

**What goes wrong:** If the project-graph restructure ALSO requires repointing `candidate-app-mutation` (don't do this), the `candidate-profile.spec.ts:30` `test.use({ storageState: { cookies: [], origins: [] } })` resets the storage state for that spec specifically. Re-auth-setup writes a FRESH storageState file to `tests/playwright/.auth/user.json` after login. If both paths run in parallel, race on the file write is possible.
**Why it happens:** Both auth.setup.ts and re-auth.setup.ts write to the same `authFile` path (`tests/playwright/.auth/user.json`).
**How to avoid:** The recommended fix (repoint re-auth-setup dependency to `candidate-app`) PRESERVES sequencing of `auth-setup → ... → candidate-app → re-auth-setup`. auth.setup.ts runs first, writes the file; re-auth.setup.ts runs after candidate-app and overwrites the file. No parallel write. Verify by inspecting `tests/playwright.config.ts` post-edit to confirm `auth-setup` is still a transitive dependency of `re-auth-setup`.
**Warning signs:** `tests/playwright/.auth/user.json` corruption or "session not found" errors in candidate-app-settings tests post-edit.

### Pitfall 5: Imgproxy 502 During the 3-run Gate (Phase 73 RESEARCH Pitfall 5)

**What goes wrong:** Local imgproxy Docker container crashes intermittently with 502 on image upload during the 3-run gate; non-identical pass/fail sets across runs.
**How to avoid:** If imgproxy 502 surfaces in any of the 3 runs of D-05 capture, restart Supabase (`supabase stop && supabase start`) and re-run the 3-run gate from scratch. Document the flake in the phase verification md. Per Phase 73 D-09 binding — the 3 surviving DATA_RACE tests (CAND-03 upload + CAND-12 + CAND-03 readback) are EXPECTED to potentially flake; that's why they're in DATA_RACE.

### Pitfall 6: Cascade Mistakenly Recurs Because `candidate-app` Still Cascades to `re-auth-setup` if `candidate-app` Itself Fails

**What goes wrong:** After repointing, `re-auth-setup` now depends on `candidate-app`. If `candidate-app` has a test failure (not unrelated to imgproxy), the cascade fires from there.
**Why it happens:** Playwright's project-dependency cascade applies to ANY upstream project, not just mutation.
**How to avoid:** Verify `candidate-app` is more stable than `candidate-app-mutation`. Per the Phase 83 baseline: `candidate-app` has 12 tests all in PASS_LOCKED. `candidate-app-mutation` has 13 tests with 3 in DATA_RACE (the image-tied ones). The repoint moves re-auth-setup from "depends on imgproxy-flaky project" to "depends on stable project." Risk reduced, not eliminated. If a future regression in `candidate-app` cascades to re-auth-setup, that's a separate phase to address.
**Warning signs:** Pre-fix, `candidate-app` rarely cascades; post-fix, if a future `candidate-app` test goes flaky, the cascade chain reactivates.

---

## Code Examples

### Mechanism (D-02 Branch 2) — Project-Graph Edit

```ts
// tests/playwright.config.ts (Phase 84 DETERM-08 edit, single project entry)
{
  name: 're-auth-setup',
  testMatch: /re-auth\.setup\.ts/,
  // Phase 84 DETERM-08: repointed from 'candidate-app-mutation' to 'candidate-app'
  // to break the imgproxy-502-cascade chain. The original 'candidate-app-mutation'
  // dependency was a SEQUENCING constraint (run AFTER mutation), not a data-flow
  // dependency — candidate-app-mutation does NOT touch Alpha's auth state (its
  // tests use the fresh E2E_ADDENDUM_CANDIDATES[1] candidate, NOT Alpha; see
  // candidate-profile.spec.ts:84-86). Repointing to 'candidate-app' preserves
  // the data-flow contract (re-auth-setup needs data-setup + auth-setup to have
  // run, which 'candidate-app' transitively depends on) while breaking the
  // cascade-skip on mutation failures.
  //
  // Verified via 84-RCA-FINDINGS.md: 11 candidate-app-settings tests + dual-project
  // re-auth.setup.ts entries cold-start fetch zero /storage/v1/* URLs; their
  // imgproxy-tie is purely cascade-chain, not initial-paint or prefetch.
  dependencies: ['candidate-app']
}
```

### Mechanism (D-05) — IMGPROXY_TIED_TITLES Shrink

```js
// .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs:67-82
// Phase 84 DETERM-08 + Phase 73 D-09 renegotiation: pool shrunk 14 → 3.
// Only image-intrinsic tests remain imgproxy-tied per Phase 84 close.
// See 84-RCA-FINDINGS.md for the per-test classification + cascade-chain
// rationale; 84-RESEARCH.md §"Recommended Mechanism (D-02 Branch 2)" for
// the project-graph repoint that breaks the cascade.
const IMGPROXY_TIED_TITLES = [
  'should upload a profile image (CAND-03)',
  'should show editable info fields on profile page (CAND-03)',
  'should persist profile image after page reload (CAND-12)'
];
```

### DETERM-09 Escalation Config (FALLBACK ONLY)

```toml
# apps/supabase/supabase/config.toml — Phase 84 DETERM-09 (FALLBACK; only land IF D-03 escalates)
[storage.image_transformation]
enabled = true  # Phase 83 D-01c — UNCHANGED, per D-04b

# Phase 84 DETERM-09 — atomic 4-knob tune per D-04. Values anchored to
# Supabase Storage imgproxy upstream defaults (raise where the local Docker
# container's cold-warmup latency overruns the lower bound). The values
# below are STARTING anchors; planner may iterate if smoke still triggers
# `DATA_RACE > 3` after this tune (RCA-2nd-round per D-03).
workers = 4              # default 1 → 4 (worker parallelism for multipart upload concurrency)
read_timeout = "30s"     # default 5s → 30s (absorb cold-container warmup; aligns with playwright per-test timeout)
connection_timeout = "10s"  # default 1s → 10s (same rationale)
max_concurrency = 16     # default 8 → 16 (lift cap so 6-worker test-suite + multipart parts don't backpressure)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pre-Phase 73: imgproxy disabled to avoid cold-start flake | Phase 83 D-01c re-enabled imgproxy (required for CAND-03 upload happy path) | Phase 83 (2026-05-13) | Re-enabled imgproxy = imgproxy 502s now propagate via upload cascade; Phase 84 addresses the cascade structurally. |
| Pre-Phase 84: 14 IMGPROXY_TIED_TITLES classify into DATA_RACE per Phase 73 D-09 binding | Post-Phase 84: 3 IMGPROXY_TIED_TITLES (image-intrinsic only) | Phase 84 (this phase) | DATA_RACE pool shrinks 15 → 3 IDs; net 12 promoted to PASS_LOCKED (11 settings + 1 re-auth-dual). |
| Pre-Phase 84: re-auth-setup depends on candidate-app-mutation (cascade-couple) | Post-Phase 84: re-auth-setup depends on candidate-app (cascade-decouple) | Phase 84 (this phase) | Cascade chain breaks; non-image tests pass deterministically when imgproxy 502s; only the 3 image-intrinsic tests still data-race. |

---

## Validation Architecture

> Included because `workflow.nyquist_validation` is absent in `.planning/config.json` (treat absent as enabled).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.45+ (`tests/playwright.config.ts`) |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn test:e2e --project=candidate-app-settings,re-auth-setup --workers=1` (D-03 smoke scope) |
| Full suite command | `yarn test:e2e --workers=1` (D-05 3-run gate scope) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DETERM-08 | re-auth-setup runs to completion when candidate-app-mutation has failing tests | E2E project-graph behavior | After config edit: `yarn test:e2e --project=re-auth-setup` (with deliberately-broken upload, e.g., via `[storage.image_transformation] enabled = false` toggle in a sidecar) — re-auth-setup should still PASS. | ✅ tests/playwright.config.ts already exercises the project-dependency cascade; D-08 verification is observational on the 3-run gate. |
| DETERM-08 | 11 candidate-app-settings tests pass deterministically across 3 cold-start runs | E2E full-suite | `yarn test:e2e --workers=1` (×3 sequential) + diff via `tsx tests/scripts/diff-playwright-reports.ts run-1.json run-2.json` (SHA-identical). | ✅ tests/scripts/diff-playwright-reports.ts already implements the gate. |
| DETERM-08 | dual-project re-auth.setup.ts entry passes deterministically across 3 runs | E2E full-suite | Same as above; the dual-project entry surfaces under both `auth-setup :: setup/re-auth.setup.ts` and `re-auth-setup :: setup/re-auth.setup.ts` in the report. | ✅ |
| DETERM-08 | IMGPROXY_TIED_TITLES match-count assertion passes with 3-element const | Unit-like script invocation | `node .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` — asserts at lines 87-99. | ✅ regen-constants.mjs exists with the assertion. |
| DETERM-09 | (FALLBACK) `[storage.image_transformation]` knob tune absorbs imgproxy cold-warmup latency | E2E full-suite | Same as DETERM-08 full-suite command; success criterion is `DATA_RACE ≤ 3` after the tune. | ✅ |

### Sampling Rate

- **Per task commit:** No quick-run per task — the changes are config-only; the 1-run cold-start smoke (~54 min) is the per-task verification.
- **Per wave merge:** 1-run smoke after wave 1 (project-graph edit) or wave 3a (DETERM-09 if escalated).
- **Phase gate:** Full 3-run cold-start gate (~162 min) before `/gsd-verify-work`. SHA-identical pass-sets required.

### Wave 0 Gaps

- [ ] None — existing test infrastructure (`tests/playwright.config.ts`, `tests/scripts/diff-playwright-reports.ts`, `regen-constants.mjs`) covers all Phase 84 verification needs. No new test files or fixtures required.
- [ ] Optional: planner may include the `rca-capture/` instrumentation files in the phase artifact dir for reproducibility (already committed as part of this research; no additional Wave 0 work).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase CLI | `supabase start` | ✓ | 2.40.7 (per `apps/supabase/supabase/.temp/cli-latest`) | — |
| Local imgproxy Docker container | CAND-03 upload happy-path | ✓ (when supabase started with `[storage.image_transformation] enabled = true`) | container version per Supabase CLI bundle | If degraded: `supabase stop && supabase start` to restart container |
| Playwright | E2E suite + smoke + 3-run gate | ✓ | per `tests/package.json` (1.45+) | — |
| Yarn 4 | `yarn db:seed` + `yarn test:e2e` | ✓ | 4.x | — |
| Node | tsx runner for `regen-constants.mjs` | ✓ | per repo `.nvmrc` (likely 20+) | — |

No blocking dependencies. No fallback chain required for the structural fix.

---

## Sources

### Primary (HIGH confidence)

- **Direct cold-start instrumentation** committed at `.planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/rca-capture/`:
  - `capture-cold-start.spec.ts` + `playwright.rca.config.ts` + 6 `captures/0N-*.json` + `99-summary.json` (zero storage requests across all candidate-app cold-start paths).
  - `capture-profile.spec.ts` + `playwright.profile.config.ts` + `captures/profile-capture.json` (1 storage request, `/object/public/` pattern only).
  - `register-alpha.mjs` helper for replicating data.setup.ts `forceRegister` without triggering the cascading teardown project.
- **Code review** of the candidate-app render graph:
  - `apps/frontend/src/lib/components/avatar/Avatar.svelte:19-143` (Avatar consumer surface).
  - `apps/frontend/src/lib/components/image/Image.svelte:32` (raw `<img>` render; no transform).
  - `apps/frontend/src/lib/utils/image.ts:9-27` (`getImageUrl` returns `formatLevel.url`; no `/render/image/` synthesis).
  - `apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:25-48` (`parseStoredImage` returns `/storage/v1/object/public/...` URLs).
  - `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:185-241` (`_getCandidateUserData` returns `entities: {}` even with `loadNominations: true`).
  - `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:120-141` (`userData.init` + `provideEntityData(snapshot.entities)`; empty entities means no Avatar downstream).
  - `apps/frontend/src/routes/candidate/(protected)/+page.svelte:84-160` (candidate-home; no Avatar/Image consumers).
  - `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:270-279` (the ONLY candidate-app surface with portrait render — `<Input type="image">`).
  - `apps/frontend/src/lib/components/input/Input.svelte:526-578` (image-type render branch; raw `<img src={url}>`).
- **Historical baseline diff**:
  - `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:5-32` — Phase 63 baseline showing CAND-03 `[pass -> fail]` + 13 downstream `[pass -> cascade]` entries that bind the IMGPROXY_TIED_TITLES list verbatim.
- **Test infrastructure**:
  - `tests/playwright.config.ts:1-436` — project-dependency graph definition.
  - `tests/scripts/diff-playwright-reports.ts:1-300` — PASS_LOCKED + DATA_RACE + CASCADE arrays + jsdoc.
  - `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs:1-126` — IMGPROXY_TIED_TITLES + match-count assertion.

### Secondary (MEDIUM confidence)

- **Playwright upstream documentation** confirming project-dependency cascade behavior:
  - [microsoft/playwright issue #38860 — "Option to run subsequent dependent projects regardless of dependency test failures"](https://github.com/microsoft/playwright/issues/38860) (filed Jan 2026 — feature request not landed, default cascade behavior confirmed).
  - [Playwright Projects docs — testProject.dependencies](https://playwright.dev/docs/test-projects) (general dependency semantics).

### Tertiary (LOW confidence — assumptions)

- **DETERM-09 numeric values** (`workers = 4`, `read_timeout = "30s"`, etc.): anchored to Supabase Storage imgproxy upstream-default rationale but NOT verified against the current Supabase CLI's `config.toml` schema for `[storage.image_transformation]`. Planner MUST verify the schema exposes these knobs before D-09 escalation; if not, fallback is to set imgproxy Docker container env vars directly. [ASSUMED — see Assumptions Log A1]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase CLI's `[storage.image_transformation]` config block accepts the 4 sub-knobs (`workers`, `read_timeout`, `connection_timeout`, `max_concurrency`) directly. | §"DETERM-09 Fallback Config Tuning" + §"Code Examples" | If the CLI doesn't expose these knobs, the planner must instead patch the imgproxy Docker container directly via `STORAGE_IMG_PROXY_*` env vars (Supabase upstream). DETERM-09 still lands but the config-toml edit shape changes. Planner verifies via `supabase config init` schema dump before lockup. |
| A2 | The Phase 84 ROADMAP "Expected pool sizes (planner verifies post-gate): ~106 PASS_LOCKED + 3 DATA_RACE + 47 CASCADE" is correct. | §"User Constraints (D-07)" | If actual post-fix capture deviates, the planner adjusts the anchor expectation in the phase verification doc; not a phase-blocker, just a documentation adjustment. |
| A3 | `candidate-app-mutation` does NOT depend on Alpha's auth state (verified via candidate-profile.spec.ts:84-86 using E2E_ADDENDUM_CANDIDATES[1]). | §"Recommended Mechanism — Primary Fix" | If a future change introduces Alpha-dependent mutation tests, the repoint may break; planner re-verifies before landing the edit. [VERIFIED via grep] |

---

## Open Questions

1. **Should the planner ALSO repoint `candidate-app-password`'s dependency?**
   - What we know: `candidate-app-password` depends on `candidate-app-settings`. Once `candidate-app-settings` no longer cascades from mutation, the chain naturally heals.
   - What's unclear: Is there any scenario where `candidate-app-settings` itself has a failing test that should NOT cascade to `candidate-app-password`?
   - Recommendation: Don't repoint `candidate-app-password` in Phase 84. It's downstream of the fix; if it cascade-skips post-Phase-84, that's a separate symptom worth investigating in Phase 85+.

2. **Does the regen need a re-baseline FROM Phase 79's `regen-constants.mjs` or a Phase-84-fork?**
   - What we know: CONTEXT D-05 + `<specifics>` say "edit in-place per Phase 79 D-07 'script is self-contained, never copied' precedent."
   - What's unclear: Whether the in-place edit creates a transitive coupling that would block a future v2.11+ phase from rerunning the canonical regen.
   - Recommendation: In-place edit per D-05. The script is canonical; v2.11+ phases that need a different IMGPROXY_TIED_TITLES list will edit in-place again. The version-control history preserves the binding evolution.

3. **What if branch 2 (project-graph repoint) doesn't fully eliminate the cascade?**
   - What we know: The cascade has ONE root edge (`re-auth-setup → candidate-app-mutation`). Cutting it should fully eliminate the cascade-effect on the downstream 11 settings + 2 password + re-auth tests.
   - What's unclear: Whether some OTHER mechanism (e.g., shared global app_settings mutation between settings tests and mutation's TermsOfUseAccepted side-effects) creates a different flake.
   - Recommendation: Run the 1-run smoke (wave 2) immediately after the edit; if pool still > 3, escalate per D-03 cheapest-first ladder. RCA-2nd-round may surface the secondary mechanism if it exists.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; existing infrastructure already exercises the mechanism.
- Architecture / mechanism diagnosis: HIGH — direct empirical instrumentation + code review + historical baseline diff + Playwright upstream docs all converge on dependency-chain cascade.
- Pitfalls: HIGH — drawn from Phase 73 RESEARCH Pitfall 5 + CLAUDE.md LANDMINE-9 + the regen script's documented failure modes.
- DETERM-09 numeric values: MEDIUM — anchored to upstream defaults but pending verification of Supabase CLI's `config.toml` schema; see Assumptions A1.

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (30 days — stable test infrastructure domain; Playwright cascade behavior is mature/documented)
