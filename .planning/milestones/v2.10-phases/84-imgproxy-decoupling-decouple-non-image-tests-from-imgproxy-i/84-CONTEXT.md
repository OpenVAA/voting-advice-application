# Phase 84: Imgproxy Decoupling - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Decouple non-image tests from the Supabase imgproxy infrastructure flake so the DATA_RACE pool shrinks from 15 → ≤3 (only CAND-03 image-upload + CAND-12 image-readback + CAND-03 image-rendered-on-page remain). 5 success criteria across a TBD plan count:

1. **DETERM-08 — structural decoupling.** Portrait rendering on `candidate-home` + `candidate-app-settings` post-login pages is gated behind a test-fixture mechanism so the pages don't synchronously await imgproxy on initial paint. Roadmap candidate mechanisms: `?skipImages=1` query param, settings flag (`staticSettings.images.disableInTests` or similar), below-fold IntersectionObserver lazy-load. **Mechanism choice DEFERRED to RESEARCH** (D-01) — operator's scout (this discuss-phase) found NO `<Avatar>` / `<Image>` components on the candidate-home `+page.svelte` or the protected-layout (`(protected)/+layout.svelte` only renders `HeroEmoji`, no portrait surface). The actual mechanism by which the 11 candidate-app-settings tests + re-auth.setup.ts dual-project become imgproxy-tied is NOT proven to be initial-paint portrait fetches; it could equally be:
   - Dependency-chain cascade (candidate-app-mutation hangs on the CAND-03 upload's imgproxy 502 → re-auth-setup inherits a corrupted storageState OR doesn't run → candidate-app-settings cascades).
   - Background `userData.init(snapshot.userData)` → nominations.entities image preload on the protected layout.
   - Some other path (storage layer initialization, supabase-js client warmup).
   - Combination of the above.
   The research-phase MUST instrument the actual surface in cold-start to identify WHERE the imgproxy fetch happens on each of the 11 candidate-app-settings test cold-starts BEFORE the planner locks the mechanism. Mirrors `feedback_a11y_actual_axe_scan_first.md` memory's lesson from Phase 80 (scout-first to avoid mechanism misdiagnosis).

2. **DETERM-09 — config-knob tuning as FALLBACK only.** `apps/supabase/supabase/config.toml [storage.image_transformation]` knobs (worker count, timeout, connection pool, retry policy) tuned ONLY IF DETERM-08 structural decoupling does NOT reach DATA_RACE ≤ 3 on the post-fix 1-run cold-start smoke. Aligns with REQUIREMENTS.md DETERM-09 phrasing ("Parallel lever to DETERM-08; not a substitute for the structural decoupling") + Phase 83 D-01 cheapest-first ladder ethos. **REJECTED at the outset:** landing DETERM-09 atomically alongside DETERM-08 (over-engineering risk) or running DETERM-09 first (config-first ordering inverts the structural-fix-is-the-durable-answer principle).

3. **DATA_RACE pool 15 → ≤3.** The 3 surviving entries MUST be EXACTLY: `should upload a profile image (CAND-03)`, `should persist profile image after page reload (CAND-12)`, `should show editable info fields on profile page (CAND-03)`. The dual-project `re-authenticate as candidate` entries (`auth-setup :: re-auth.setup.ts` + `re-auth-setup :: re-auth.setup.ts`) leave the pool; the 11 candidate-app-settings entries leave the pool.

4. **Phase 73 D-09 structural binding renegotiation.** The `IMGPROXY_TIED_TITLES` array in `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs:67-82` shrinks from 14 titles (matching 15 IDs because re-auth is dual-project) to 3 titles (matching 3 IDs — only the image-intrinsic tests). The match-count assertion gate at lines 87-103 of the regen script will fail loudly on the post-fix capture if the candidate-app-settings titles still appear imgproxy-tied — that's the intended structural binding (any residual imgproxy-tie on a non-image test is a CASCADE classification, not DATA_RACE).

5. **Fresh 3-run cold-start anchor.** Post-DETERM-08-fix (and DETERM-09 if escalated), capture a fresh 3-run cold-start gate via the archived `regen-constants.mjs` (path above) against a captured `run-3.json`. The new v2.10 anchor SUPERSEDES the Phase 83 SHA `d6bfeebdb0…` anchor. Expected pool sizes (planner verifies post-gate, figure is approximate — the actual count from `regen-output.txt` binds): ~108 PASS_LOCKED (94 + 14 net: 11 settings + 2 password + 1 re-auth-dual promoted from DATA_RACE) + 3 DATA_RACE + 47 CASCADE.

**Out of scope (deferred to Phase 85+):**
- 9 `data-setup-*` variant-cascade chains + 9 paired `variant-*` cascade chains (47 CASCADE entries) — Phase 85.
- ~10 voter-app FAILURE-CLASS deterministic fails (popups + hydration + filter + visibility) — Phase 86.
- Final v2.10-ship anchor + audit-milestone — Phase 87.
- Any structural change to the IMGPROXY_TIED_TITLES classification rule itself (the rule stays "imgproxy-tied → DATA_RACE"; only the LIST membership shrinks).
- DATA_RACE pool growth (per Phase 73 D-09 binding — pool MUST NOT grow during this phase).

Phase 84 is the structural precondition for Phases 85 + 86 (parallel-eligible after Phase 84 lands).

</domain>

<decisions>
## Implementation Decisions

### DETERM-08 — structural decoupling investigation depth

- **D-01 — Scout-then-decide-in-plan (Phase 80 a11y-scout-first precedent).** The research agent MUST instrument the actual cold-start network surface for the 11 candidate-app-settings tests + re-auth.setup.ts BEFORE the planner locks the gating mechanism. Concrete deliverables for the research agent (gsd-phase-researcher):
  1. **Cold-start network capture:** run one cold-start invocation (`yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean` then `yarn test:e2e --project=candidate-app-settings --workers=1` per Phase 79 D-13 canonical chain) with browser network logging enabled (Playwright `page.on('request')` / HAR capture). Capture all `/storage/v1/*` requests per test, grouped by phase (data-setup → auth-setup → candidate-app-mutation → re-auth-setup → candidate-app-settings).
  2. **Imgproxy fetch identification:** for each of the 11 candidate-app-settings tests, identify the FIRST imgproxy fetch in cold-start: source URL (`/storage/v1/object/public/...` vs `/storage/v1/render/image/...`), source code call site (which Svelte component / `+layout.svelte` / `+page.svelte` initiates it), and timing (initial-paint blocking vs background prefetch).
  3. **Dependency-chain audit:** independently verify whether the imgproxy-tie is dependency-chain cascade (mutation hangs → re-auth-setup inherits corrupt storageState → settings tests cascade-skip) or initial-paint cascade (settings page navigates → portrait fetch races test assertions). The cold-start capture itself + Playwright's per-project storageState dump should distinguish these.
  4. **RCA-FINDINGS.md committed inside phase dir** with the per-test root-cause classification (initial-paint / dependency-chain / hybrid) + the mechanism recommendation for each.

- **D-02 — Mechanism choice locked AT PLANNING TIME based on RCA-FINDINGS.md.** The planner reads RCA-FINDINGS.md and picks the gating mechanism that matches the actual root cause:
  - **If initial-paint portrait fetch on the protected layout** → `?skipImages=1` query param consumed by `Avatar.svelte` / `Image.svelte` is the cleanest (test-only, zero prod blast radius). Plumbed via Playwright's `baseURL` or per-test URL append.
  - **If dependency-chain cascade (mutation hangs → re-auth-setup contaminated)** → fix the MUTATION test surface (e.g., `?skipImages=1` only on the CAND-03 upload spec's post-upload navigation, OR make the mutation test's filechooser path not block on imgproxy fully). The 11 settings tests inherit cleanliness.
  - **If background prefetch (e.g., `userData.init` → nominations.entities[].image)** → settings-flag-driven prefetch suppression in `userData.init` OR an `intersection-observer` lazy-load on the Avatar (prod-relevant; bigger blast radius).
  - **If hybrid** → minimal-combination chosen at planner discretion; prefer test-only mechanisms over prod-impacting ones unless prod-impacting also solves a real user-facing problem.

- **D-03 — Cheapest-first ladder cadence (Phase 83 D-01 precedent).** After DETERM-08 lands:
  - 1-run cold-start smoke (`yarn test:e2e --project=candidate-app-settings,re-auth-setup --workers=1` or full chain — planner picks scope) → if DATA_RACE pool measured at ≤ 3, halt escalation, proceed to D-05 3-run gate.
  - If DATA_RACE pool still > 3 after DETERM-08: escalate to DETERM-09 (D-04).
  - 1-run smoke after DETERM-09 → if ≤ 3, proceed; if still > 3, escalate to RCA-2nd-round (research agent re-investigates, planner picks additional mechanism).

### DETERM-09 — config-knob tuning (FALLBACK)

- **D-04 — Tune scope: ALL 4 knobs in one commit, contingent on D-03 trigger.** If D-03 escalates, tune `[storage.image_transformation]` worker count + timeout + connection pool + retry policy in a single config-toml commit. Per-knob rationale documented inline as comments. Planner picks the numeric values based on Supabase Storage / imgproxy upstream documentation (gsd-phase-researcher contributes during the RCA pass if escalation is anticipated). **REJECTED:** tune-knob-at-a-time (too many smoke cycles for low-confidence configs; cheaper to tune-all + measure once).

- **D-04b — Re-enable preservation.** `[storage.image_transformation] enabled = true` (set by Phase 83 D-01c) STAYS as-is — DETERM-09 only tunes the sub-knobs, not the enabled flag.

### Verification gate + anchor renegotiation

- **D-05 — Fresh 3-run cold-start gate via archived regen-constants.mjs.** Mechanism: `node .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` against a Phase-84-captured `run-3.json`. The regen script's IMGPROXY_TIED_TITLES const MUST be SHRUNK from 14 → 3 titles BEFORE the regen runs (otherwise the match-count assertion at lines 87-103 will fail). Concrete edits:
  ```js
  // Phase 84 DETERM-08 + Phase 73 D-09 renegotiation: pool shrunk 14 → 3.
  // Only image-intrinsic tests remain imgproxy-tied per Phase 84 close.
  const IMGPROXY_TIED_TITLES = [
    'should upload a profile image (CAND-03)',
    'should show editable info fields on profile page (CAND-03)',
    'should persist profile image after page reload (CAND-12)'
  ];
  ```
  Planner picks the exact edit shape (in-place edit of the archived script vs forking a Phase-84 copy under `.planning/phases/84-…/post-fix/regen-constants.mjs`). RECOMMENDATION: edit in-place per Phase 79 D-07 "script is self-contained, never copied" precedent — the script is canonical, not phase-archived-immutable.

- **D-06 — Atomic-commit-per-task pattern.** Per Phase 79 D-10 + Phase 83 atomic-commit precedent: each plan task lands its own commit. The constants regen commit (which combines IMGPROXY_TIED_TITLES shrink + run-3.json + diff-playwright-reports.ts jsdoc + DATA_RACE_TESTS array shrink) is the ONE exception — bundled atomically.

- **D-07 — Anchor expectation (planner verifies post-gate; figure is approximate).** Expected post-Phase-84 anchor: ~108 PASS_LOCKED (94 + 14 net: 11 settings + 2 password + 1 re-auth-dual — RCA-FINDINGS classifies 14 distinct cascade-victim titles producing 14-15 test IDs, since the re-auth.setup.ts row registers under BOTH `auth-setup` and `re-auth-setup` projects) + 3 DATA_RACE + 47 CASCADE = ~158 total. The actual count from `regen-output.txt` binds — if it deviates from ~108, USE THE ACTUAL count and note the discrepancy in the SUMMARY. The Phase 83 SHA `d6bfeebdb0…` anchor is ABSORBED by this regen. The new anchor is what Phases 85, 86, 87 measure against.

- **D-08 — Gate execution: agent-inline via Bash run_in_background.** Per Phase 79 D-11 + Phase 83 D-10 precedent: ~54 min per cold-start × 3 runs = ~162 min total wall time. Operator (kalle) explicitly OK with unattended execution.

### Claude's Discretion

- Research agent picks the precise instrumentation tooling (Playwright `page.on('request')` vs HAR capture vs OS-level packet trace — RECOMMENDATION: Playwright API, lowest setup overhead, captures all browser network).
- Research agent decides whether to instrument all 11 candidate-app-settings tests individually or sample (e.g., 3 representative — `should show read-only warning when answers are locked` + `should show maintenance page when underMaintenance is true` + `should display notification popup when enabled`).
- Planner picks the precise mechanism per D-02 based on RCA-FINDINGS.md verdict.
- Planner picks plan-count (likely 1 plan covering RCA → fix → gate, or 2 plans split RCA / fix-and-gate). RECOMMENDATION: 1 plan if RCA agent's research output is the binding input; 2 plans if mid-phase replan is anticipated based on RCA findings.
- Planner picks `?skipImages=1` query param consumption shape if D-02 lands there (env-var-checked-in-Avatar.svelte vs URL-query-checked-in-protected-layout vs Playwright-context-set-via-baseURL).
- Planner picks DETERM-09 numeric values if escalation triggers (Supabase upstream defaults vs project-specific tuning).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap + REQUIREMENTS

- `.planning/ROADMAP.md` §"Phase 84: Imgproxy Decoupling" — 5 success criteria, structural dependency (Phase 83 ✓ COMPLETE anchor at SHA `d6bfeebdb0…`).
- `.planning/REQUIREMENTS.md` — DETERM-08, DETERM-09 (Phase 84 REQs).

### Phase 73 D-09 structural binding (the contract Phase 84 renegotiates)

- `.planning/milestones/v2.9-phases/73-determinism-baseline/73-CONTEXT.md` D-09 — original IMGPROXY_TIED_TITLES binding rationale.
- `.planning/milestones/v2.9-phases/73-determinism-baseline/73-01-PLAN.md:82,257` — pool-must-not-grow contract.
- `.planning/milestones/v2.9-phases/73-determinism-baseline/73-RESEARCH.md` Pitfall 5 — imgproxy 502 is infrastructure debt, not race-fixable.

### Phase 79 archived regen-constants.mjs (Phase 84 edits IMGPROXY_TIED_TITLES in-place)

- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs:67-103` — IMGPROXY_TIED_TITLES const + match-count assertion gate. Phase 84 shrinks the const from 14 → 3 titles per D-05.
- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-CONTEXT.md` §"3-Run Cold-Start Gate Execution" (D-11, D-12, D-13) — gate execution protocol Phase 84 inherits.

### Phase 83 (immediate predecessor — v2.10-close anchor)

- `.planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/83-VERIFICATION.md` — Phase 83 close anchor SHA `d6bfeebdb0…` (94 PASS_LOCKED + 15 DATA_RACE + 47 CASCADE).
- `.planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/83-CONTEXT.md` D-01, D-09 — cheapest-first ladder precedent + regen mechanism.
- `tests/scripts/diff-playwright-reports.ts:73-220` — current PASS_LOCKED_TESTS + DATA_RACE_TESTS + CASCADE_TESTS arrays + jsdoc Phase 84 updates.

### Code surfaces touched / referenced by Phase 84

- `apps/supabase/supabase/config.toml:115-141` — `[storage.image_transformation]` + `[storage.buckets.public-assets]` config. DETERM-09 escalation target (lines 137-141).
- `apps/frontend/src/lib/components/avatar/Avatar.svelte:19-143` — `<Image>` + initials fallback shape. Potential `?skipImages=1` consumption site (D-02 branch 1 / branch 3).
- `apps/frontend/src/lib/components/image/Image.svelte:18-32` — `<img src={getImageUrl(...)}>` raw render. Potential consumption site.
- `apps/frontend/src/lib/utils/image.ts:9-27` — `getImageUrl` returns `image.url` (public bucket URL, not imgproxy `/render/image/` path). RESEARCH must explain how this becomes imgproxy-tied if D-02 lands at branch 1.
- `apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:25-48` — `parseStoredImage` returns `/storage/v1/object/public/public-assets/...` URLs. Confirms image URLs are PUBLIC, not `/render/image/`. RESEARCH disambiguates the imgproxy-tie route.
- `apps/frontend/src/routes/candidate/(protected)/+page.svelte:84-160` — candidate-home; NO portrait surface, only `<HeroEmoji>` + `<InfoBadge>`. RESEARCH confirms what's actually fetching imgproxy here.
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:120-141` — `userData.init(snapshot.userData)` on validity-resolution. Potential background nominations.entities[].image preload site. RESEARCH instruments this.
- `tests/tests/setup/re-auth.setup.ts:9-43` — re-auth project entry (dual-project Playwright config); navigates to candidate-home, logs in, saves storageState. RESEARCH captures cold-start network here.
- `tests/tests/specs/candidate/candidate-settings.spec.ts` — 11+ tests, app-mode + settings + popup + maintenance + privacy + help. RESEARCH samples 3 representative tests.
- `tests/scripts/diff-playwright-reports.ts:73,219,267` — jsdoc + DATA_RACE_TESTS array + CASCADE_TESTS array boundaries Phase 84 updates.

### Project conventions

- `CLAUDE.md` §"Common Workflows" — `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean` canonical Likert-only-reset chain (LANDMINE-9 arg-forwarding caveat).
- `.agents/code-review-checklist.md` — code review checklist applies to all Phase 84 changes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Phase 79 archived `regen-constants.mjs`** (Phase 83 used this verbatim) — Phase 84's verification gate mechanism. IMGPROXY_TIED_TITLES const is the renegotiation target.
- **Phase 79 canonical Likert-only-reset chain** + LANDMINE-9 arg-forwarding caveat — required for cold-start determinism.
- **Phase 79 D-09 instability protocol** — re-run + investigate flake before regen against non-stable baseline. Phase 84 inherits for D-05 3-run identity check.
- **Phase 83 D-01 cheapest-first ladder pattern** — DETERM-08 → 1-run smoke → DETERM-09 only if pool > 3.
- **Playwright `page.on('request')` API** — research agent's network instrumentation primitive.
- **Avatar.svelte `imageStatus = 'error' | 'loading' | 'loaded'` state machine + initials fallback** — already has graceful-degradation when image fails; Phase 84 may leverage this if D-02 lands at branch 1 (`?skipImages=1` → Avatar treats as missing-image → initials render).

### Established Patterns

- **Phase 73 D-09 IMGPROXY_TIED_TITLES structural binding** — DATA_RACE pool list is data-race-semantic ("may pass or fail post-swap"). Pool MUST NOT grow during the phase. Phase 84 SHRINKS the pool by structural decoupling.
- **`feedback_a11y_actual_axe_scan_first.md` memory + Phase 80 scout-misdiagnosis precedent** — scout the actual cold-start surface before locking the mechanism. Phase 84 D-01 applies this directly.
- **Atomic-commit-per-task pattern** (Phase 79 D-10 + Phase 83 atomic-commit precedent) — each task gets its own commit; the constants regen commit is the ONE exception (bundled).
- **`yarn db:reset-with-data --likert-only` LANDMINE-9** — `--likert-only` does NOT forward through `&&`-chains; canonical invocation is the manual chain.

### Integration Points

- **Test project dependency graph:** `data-setup → auth-setup → candidate-app → candidate-app-mutation → re-auth-setup → {candidate-app-password, candidate-app-settings}`. Phase 84 RESEARCH determines whether DETERM-08 fix needs to land at the upstream (mutation) or downstream (settings) end of this chain.
- **Cold-start vs warm: Phase 84 only addresses cold-start.** Warm-start tests pass deterministically per Phase 73 baseline; the imgproxy-tie is a cold-start-specific infrastructure flake.
- **DATA_RACE → CASCADE classification rule:** non-imgproxy-tied tests that flake on cold-start classify as CASCADE_BASELINE_TESTS, not DATA_RACE. The 11 candidate-app-settings tests + re-auth-dual currently in DATA_RACE leave the pool ENTIRELY (per D-05) — they should pass deterministically post-fix, not migrate to CASCADE.

</code_context>

<specifics>
## Specific Ideas

- **Operator's All-Green Suite directive** (per `project_all_green_suite_priority.md` memory + 2026-05-13 explicit batch-discussion request): rewrite tests so imgproxy only affects tests that explicitly deal with images; make the longer tests independent of the image. Phase 84 is the first concrete delivery against this directive.

- **Operator's scout-first preference for structural phases** (per `feedback_a11y_actual_axe_scan_first.md` memory + Phase 80 scout-misdiagnosis lesson): the gating mechanism is DEFERRED to RESEARCH because the page-template scout (this discuss-phase) did not produce evidence supporting any of the 3 roadmap-suggested mechanisms. Operator's directive: investigate the actual offending surface BEFORE locking decisions.

- **Operator-confirmed cheapest-first ladder** (per Phase 83 D-01 precedent, carried forward): DETERM-09 is a FALLBACK to DETERM-08, not a parallel-eligible co-lander. The 4 [storage.image_transformation] knobs are tuned together (not knob-at-a-time) IF escalation triggers.

- **In-place edit of the Phase 79 archived `regen-constants.mjs`** preferred over forking a Phase-84 copy. Rationale: the script is canonical (per Phase 79 D-07), and IMGPROXY_TIED_TITLES is a STRUCTURAL list that should reflect the current binding contract, not a phase-archived snapshot.

</specifics>

<deferred>
## Deferred Ideas

- **Avatar IntersectionObserver lazy-load as a prod-relevant feature** — Phase 84 may incidentally land lazy-load (per D-02 branch 3) if RCA points there, but a broader prod-perf-driven lazy-load sweep across the voter-app's entity-list pages is a future v2.11+ project. Out of v2.10 scope.

- **Imgproxy upstream tuning beyond the 4 documented knobs** — if DETERM-09 tuning insufficient even at max-knob configuration, may need to investigate imgproxy version pinning, Docker resource limits, or Supabase Storage container restart policies. Out of v2.10 scope unless DETERM-09 escalation produces evidence the 4 knobs aren't enough.

- **Project-wide dependency-chain audit** — if Phase 84 RCA reveals dependency-chain cascade is the primary mechanism, a v2.11+ project could audit the FULL test project graph for similar transitive-failure patterns (any project depending on auth-setup that doesn't strictly need authentication, etc.). Out of v2.10 scope.

- **DATA_RACE pool semantic re-examination** — if Phase 84 successfully shrinks the pool to 3, v2.11+ may want to revisit whether DATA_RACE is the right classification for those 3 image-intrinsic tests (they may be deterministic-fail or deterministic-pass post-Phase-84 with imgproxy enabled). Out of v2.10 scope.

### Reviewed Todos (not folded)

None — the cross_reference_todos step matched 28 todos by keyword overlap, but NONE are topically relevant to imgproxy decoupling. All matches were noise from generic phrasing (e.g., "candidate", "phase", "rendering"). The Phase 84 inputs come from ROADMAP.md + REQUIREMENTS.md + the `project_all_green_suite_priority.md` memory, not from the open-todo backlog.

</deferred>

---

*Phase: 84-Imgproxy-Decoupling*
*Context gathered: 2026-05-13*
