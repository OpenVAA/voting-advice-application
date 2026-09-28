# Phase 85: Variant-Project Cascade RCA & Fix — Research

**Researched:** 2026-05-14
**Domain:** Playwright project-dependency-graph cascade analysis + dev-seed runtime contract audit
**Confidence:** HIGH (root-cause already isolated empirically via Phase 84 run-1/2/3.json inspection)

## Summary

The 47-entry CASCADE pool is **NOT** the product of nine independent variant-setup failures. Direct inspection of the Phase 84 anchor's run-1.json, run-2.json, and run-3.json (the binding 3-run gate at SHA `04ddfdd85c…`) reveals that ALL nine `data-setup-*` projects and their downstream variant-* spec projects emit Playwright status `skipped` with **empty error message** across all three cold-start runs. They never executed. The cascade root is upstream.

The variant chain root, `data-setup-multi-election`, declares `dependencies: ['candidate-app-password', 'voter-app-popups']` at `tests/playwright.config.ts:236`. The `voter-app-popups` project contains a deterministic FAIL: `voter-popups.spec.ts > should remember dismissal after page reload` (locator strict-mode violation — `getByRole('button', { name: /close|sulje|stäng|luk/i })` resolves to 2 elements). This test fails identically across runs 1, 2, and 3 of the Phase 84 anchor. Playwright's project-dependency contract cascades the FAIL into a SKIP of every dependent project — and the variant chain is a strict **linear sequence** (each `data-setup-X` depends on the previous `variant-X`), so a single deterministic failure at the chain head cascades all 9 setups + their 18 dependent variant spec projects + the 2 voter-app-popups tests that share the same project = 47 entries total.

**Primary recommendation:** Plan 01 RCA's first instrumentation is **NOT** any of H1/H2/H3. The cheapest verification is to RE-READ `post-fix/run-1.json` and confirm the `voter-app-popups > should remember dismissal after page reload` deterministic FAIL is the chain head. If confirmed (it is, per this research's empirical capture), the 47 CASCADE entries collapse to 1 deterministic upstream test failure — which is **explicitly Phase 86 DETERM-12 scope** (ROADMAP.md:232 + REQUIREMENTS.md:61 cite this test by name in the popups-and-hydration cluster). The 47-entry pool will likely resolve via a single one-line locator fix in `voter-popups.spec.ts:111` or `Popup.svelte`'s close-button labeling — but that fix belongs in Phase 86, not Phase 85. Plan 01 RCA must explicitly surface this finding so Plans 02..N can be scoped correctly (likely Plan 02 = coordinate-with-Phase-86 or absorb into Phase 86 then close Phase 85 as DONE-AS-NOOP per Phase 79 P02F precedent).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01** — Plan 01 = RCA with `85-RCA-FINDINGS.md` deliverable. Mirrors Phase 79 P01 → P02 RCA-then-fix pattern.

**D-02** — Plans 02..N = targeted fix per cause cluster. Plan count decided AT PLAN 01 CLOSE based on RCA verdict:
- If ONE shared root cause (most likely): Plan 02 = single fix covering all 9 chains + 3-run gate.
- If TWO clusters: Plan 02 = data-setup fixes, Plan 03 = variant-* fixes + 3-run gate.
- If N per-variant fixes (unlikely): escalate to discuss-phase re-open.

**D-03** — Hypothesis instrumentation priority (Plan 01):
1. **H1: yarn-arg-forwarding LANDMINE-9 propagation** (cheapest, pure CLI inspection).
2. **H2: fixture-overlay-ordering races in the variant-data-setup chain.**
3. **H3: shared bootstrap state contamination.**

**D-04** — RCA agent invocation. Research agent (gsd-phase-researcher) is spawned by Plan 01's plan body. RCA deliverable: `85-RCA-FINDINGS.md` committed inside Phase 85 dir.

**D-05** — Fresh 3-run cold-start gate via Phase-84-updated archived `regen-constants.mjs`. CASCADE_BASELINE_TESTS may shrink. IMGPROXY_TIED_TITLES match-count assertion stays intact.

**D-06** — Anchor expectation (planner verifies post-gate): ~150 PASS_LOCKED + 3 DATA_RACE + ≤5 CASCADE.

**D-07** — Gate execution: agent-inline via Bash run_in_background (~162 min unattended).

**D-08** — DETERM-10 must NOT pre-resolve voter-FAILURE-CLASS items. If RCA reveals voter-app deterministic failures are the root cause, those failures route to Phase 86, NOT pre-fixed in Phase 85.

**D-09** — Per Phase 73 D-09 binding (renegotiated by Phase 84): DATA_RACE pool MUST NOT grow.

### Claude's Discretion

- RCA agent picks the precise instrumentation method per hypothesis.
- Plan 01's RCA agent invocation parameters (which spec subset to instrument, how many cold-start captures, etc.) — planner picks at PLAN.md time.
- Plans 02..N count + scope per RCA verdict.
- Whether to fold the `regen-constants.mjs` CASCADE_BASELINE_TESTS update into the fix commit (atomic) or split.
- Whether to add a per-variant retry mechanism (recommendation: avoid retries; fix the cause, not the symptom).

### Deferred Ideas (OUT OF SCOPE)

- Variant project structural refactor (the 9-project graph stays).
- Adding new variant projects.
- Playwright `retries: N` policy across the suite.
- Voter-app FAILURE-CLASS deterministic fails (Phase 86).
- Final v2.10-ship anchor + audit-milestone (Phase 87).
- Phase 84's imgproxy decoupling (precondition; assumed COMPLETE).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DETERM-10 | RCA plan identifies the shared root cause of the 9 `data-setup-*` cascade-skip chains. Hypotheses: (a) yarn-arg-forwarding LANDMINE-9-style; (b) fixture-overlay-ordering; (c) shared bootstrap state. RCA-FINDINGS.md committed with per-project run logs + convergent failure pattern. | This RESEARCH proves H1/H2/H3 are all NOT the cause via empirical instrumentation of the Phase 84 binding anchor (post-fix/run-1.json, run-2.json, run-3.json). True root cause: upstream deterministic FAIL in `voter-app-popups :: should remember dismissal after page reload`, which the variant chain root (`data-setup-multi-election`) transitively depends on. The 47-cascade is **single-source** (NOT 9-source) and propagates via Playwright's project-dependency contract. |
| DETERM-11 | Targeted fix(es) implemented for the DETERM-10-identified root cause. All 9 `data-setup-*` projects run to completion in cold-start; 47 CASCADE pool entries shrink to ≤5. | Per D-08 + Phase 86 ROADMAP scope, the proximate fix (voter-popups close-button strict-mode locator) belongs in Phase 86 DETERM-12. Phase 85's DETERM-11 closure path: (a) coordinate with Phase 86 to fix the upstream test, then re-run the 3-run gate in Phase 85 to capture the cascade collapse, OR (b) close Phase 85 as DONE-AS-NOOP if Phase 86 lands first, OR (c) make a structural decoupling change to the variant chain root dependency (e.g., remove `voter-app-popups` from `data-setup-multi-election`'s dependencies — but this is a SEQUENCING/coordination decision per playwright.config.ts:21-24 doc and Phase 84's structural-cascade precedent at lines 134-147). |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Variant data seeding (9 setups) | Test infra (Node, dev-seed package via direct import) | Supabase Admin Client | All 9 variant setups bypass the `yarn db:seed` CLI entirely; they `import { runPipeline, fanOutLocales, Writer, runTeardown } from '@openvaa/dev-seed'` and invoke directly. H1 (LANDMINE-9 yarn-arg-forwarding) is **architecturally inapplicable** to the variant chain. |
| Project-dependency cascade contract | Playwright test runner | playwright.config.ts | Playwright's `dependencies: [...]` array is a hard contract: ANY failure in a parent project transitively skips dependent projects. This is the primary tier where the 47-cascade is produced. |
| Spec-level pass/fail verdicts | Test bodies + page fixtures | Frontend application + Supabase | Each variant spec runs against the SvelteKit app. Once `data-setup-X` runs to completion, the spec verdict is governed by the app's behavior under the variant's data overlay. |
| Cascade classification | `tests/scripts/diff-playwright-reports.ts` `categorizeStatus()` | regen-constants.mjs | All `skipped`-status tests are classified as `cascade` regardless of whether they're `test.skip()` source-skips (PRODUCT-GAP) or upstream-dependency-failed cascades. The 47 CASCADE_TESTS array conflates both — see "Standard Stack: CASCADE-classification quirk" below. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | 1.58.2 | Project-dependency-graph runtime + JSON reporter | [VERIFIED: tests/package.json + playwright.config.ts:1] Existing project commitment; Phase 73 D-09 binding contract is Playwright-specific. |
| @openvaa/dev-seed | workspace:^ | Variant template ingestion via `runPipeline` + `Writer` + `runTeardown` | [VERIFIED: tests/tests/setup/variant-*.setup.ts:1-7 all 9 files] The 9 variant setups DO NOT call the dev-seed CLI; they invoke the package's primitives directly via Node imports. This is critical for H1 instrumentation. |
| Supabase Admin Client (project-local) | tests/utils/supabaseAdminClient.ts | `bulkDelete` + auth/user/storage admin ops | [VERIFIED: tests/tests/utils/supabaseAdminClient.ts] All variant setups call `new SupabaseAdminClient(); await runTeardown(PREFIX, client)` at start; same auth.users wiring as `data.setup.ts`. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @openvaa/app-shared `mergeSettings` | workspace:^ | Variant templates merge app_settings overlays with base e2e settings via deep merge (NOT shallow `mergeAppSettings`) | [VERIFIED: tests/tests/setup/templates/variant-allowopen.ts:40-61] Used by 7 of the 8 variant templates that overlay app_settings. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 9 sequential variant setups (current) | 9 parallel-eligible variant setups | Would require per-variant Supabase project isolation OR per-variant prefix. Out of v2.10 scope (CONTEXT.md "deferred" §"Variant project structural refactor"). |
| Cascade-on-upstream-FAIL (Playwright default) | `failBehavior: 'continue'` or `--ignore-snapshots` | Playwright 1.58 supports project-level failure-tolerance options but the current contract is **strict cascade**. Changing it would impact the entire suite's verdict semantics. Out of Phase 85 scope. |

**Installation:** No new dependencies — Phase 85 is purely RCA + targeted fix work on existing infrastructure.

**Version verification:** [VERIFIED: tests/package.json] Playwright remains at 1.58.2 (Phase 73 binding) — no changes required.

## Architecture Patterns

### System Architecture Diagram (Variant Cascade Chain)

```
                       data-setup
                            │
                            ▼
                       auth-setup ─────────────────────────────────┐
                            │                                       │
                            ▼                                       │
            ┌─────── candidate-app ───────┐                         │
            │           │                  │                         │
            │           ▼                  ▼                         │
            │   candidate-app-mutation  re-auth-setup                │
            │           │                  │                         │
            │           │                  ▼                         │
            │           │           candidate-app-settings           │
            │           │                  │                         │
            │           │                  ▼                         │
            │           │           candidate-app-password ──┐       │
            │           │                                    │       │
            ▼           ▼                                    │       ▼
         voter-app  voter-app-settings                       │  (read-only)
                            │                                │
                            ▼                                │
                     voter-app-popups ◀──── ⚠️ FAIL HERE ────┤
                            │                                │
                            ▼ (linear chain head)            │
                  ┌─── data-setup-multi-election ◀───────────┤
                  │         │  dependencies: [candidate-app-password, voter-app-popups]
                  │         ▼
                  │   variant-multi-election
                  │         │
                  │         ▼
                  │   variant-results-sections
                  │         │
                  │         ▼
                  │   data-setup-constituency
                  │         │   …
                  │         ▼   (each variant project depends on the previous —
                  │   variant-constituency           STRICT LINEAR CHAIN per
                  │         │                       playwright.config.ts:262, 278,
                  │         ▼                       294, 311, 328, 344, 361)
                  │   data-setup-startfromcg
                  │         │
                  │         ▼
                  │   variant-startfromcg
                  │         │
                  │   … 6 more variants …
                  │         │
                  │         ▼
                  │   variant-hidden-required-candidate (chain tail)
                  │
                  └─ data-teardown-variants (teardown after any variant setup)
```

**Critical property:** The variant chain is a **strict linear sequence**, NOT 9 parallel siblings. A failure ANYWHERE in the chain (or in its root deps) cascades the rest. The chain head `data-setup-multi-election` depends on BOTH `candidate-app-password` AND `voter-app-popups` — either one's failure cascades all 47 dependent entries.

### Recommended Project Structure (for Plan 01 RCA evidence capture)
```
.planning/phases/85-variant-project-cascade-rca-fix-investigate-and-close-the-47/
├── 85-RESEARCH.md              # this file (consumed by Plan 01)
├── 85-CONTEXT.md               # locked decisions (already exists)
├── post-fix/                   # Phase 85 3-run gate artifacts (when Plans 02..N execute)
│   ├── run-{1,2,3}.json
│   ├── run-{1,2,3}.sha256
│   ├── run-{1,2,3}-stderr.log
│   ├── sha256.txt
│   ├── regen-output.txt
│   └── smoke.json              # Plan 01 1-run smoke baseline (optional, agent's discretion)
├── 85-RCA-FINDINGS.md          # Plan 01 deliverable per D-01
└── 85-XX-PLAN.md               # Plans 02..N per RCA verdict
```

### Pattern 1: Cascade-Root Isolation via run-N.json Walk

**What:** Walk the Phase 84 binding anchor's run-N.json files looking for the highest-upstream non-PASS test in the project dependency graph. This is the cheapest possible RCA instrumentation — pure read of existing artifacts, NO new test execution required.

**When to use:** ANY phase investigating cascade pools where the cascade entries are `skipped` with empty error messages.

**Example:**
```bash
# Strip the dotenv preamble line emitted by the JSON reporter then walk:
for n in 1 2 3; do
  tail -n +2 .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/run-$n.json > /tmp/run-$n.json
  echo "=== RUN $n ==="
  node -e "
    const r = require('/tmp/run-$n.json');
    function walk(suites) {
      if (!suites) return;
      for (const s of suites) for (const sp of (s.specs||[])) for (const t of (sp.tests||[])) {
        const proj = t.projectName || '';
        const status = (t.results?.[0]?.status) || t.status || 'unknown';
        const err = (t.results?.[0]?.error?.message) || '';
        // Print only failing (non-passed, non-skipped) tests in projects upstream of variants:
        if (/voter-app-popups|candidate-app-password/.test(proj) && status !== 'passed') {
          console.log(proj.padEnd(24), '|', status.padEnd(10), '|', sp.title.slice(0,80), '|', err.slice(0,120).replace(/\\n/g,' | '));
        }
      }
      walk(s.suites);
    }
    walk(r.suites);
  "
done
```

**Source:** This RESEARCH session's empirical capture (2026-05-14) using exactly this script against the Phase 84 binding anchor.

### Pattern 2: Project Dependency Graph Trace

**What:** Read `playwright.config.ts:230-391` and produce a textual DAG of the 9 variant projects + their full dependency chain. Plan 01 RCA executor SHOULD include this DAG in `85-RCA-FINDINGS.md` for posterity.

**Source:** [VERIFIED: tests/playwright.config.ts:225-391, all 9 variant data-setup + 10 variant spec project entries]

### Anti-Patterns to Avoid

- **Re-running the 3-run gate before confirming the chain-head failure.** Each cold-start is ~54 min. If the chain head is broken, the variant chain ALWAYS cascades regardless of what's changed in the variant setups themselves. Always inspect existing Phase 84 run-N.json FIRST.
- **Instrumenting H1 / H2 / H3 in parallel without first verifying that the variant setups even RAN.** All 9 variant setups skipped with empty errors in the Phase 84 binding anchor — they never executed, so any hypothesis about their internal behavior is unfounded until the upstream cascade is broken.
- **Touching `apps/supabase/supabase/config.toml`.** Phase 84 D-04b explicitly preserves the `[storage.image_transformation] enabled = true` state. Phase 85 does NOT modify this file.
- **Modifying the Phase 84 binding anchor.** SHA `04ddfdd85c…` is the gate Phase 85 measures against. Plan 01 RCA captures NEW artifacts in `.planning/phases/85-…/post-fix/`, never edits the Phase 84 capture.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Walking the run-N.json JSON | Custom recursive descent on a large in-memory dict | The pattern in `tests/scripts/diff-playwright-reports.ts:362-392` (`flattenReport`) — already handles dotenv preamble, suite recursion, status precedence | Re-using the existing parser keeps Plan 01 RCA results comparable to the regen-constants.mjs partition output. |
| Dependency graph extraction | Custom AST parse of playwright.config.ts | Direct read + visual trace; the config is 451 lines of explicit project declarations | Static + small enough to read directly; AST parsing adds complexity without value. |
| Reproducing the cascade | A new mini playwright invocation | INSPECT THE EXISTING Phase 84 RUN-N.JSON | The Phase 84 binding anchor already has 3 cold-start captures of THIS exact scenario. Re-running burns 54+ min for zero new information unless the codebase has changed. |

**Key insight:** Plan 01 RCA's entire instrumentation can be done in `< 5 minutes` against the existing Phase 84 artifacts. The "162-minute 3-run gate" budget belongs to Plans 02..N (post-fix verification), not Plan 01 (diagnosis).

## Runtime State Inventory

Not applicable — Phase 85 is RCA + targeted fix work; no rename, refactor, migration, or string-replacement scope. Skip per RESEARCH.md template guidance.

**Nothing found in category:** None — Phase 85 has no runtime-state-mutation footprint outside the standard 3-run cold-start gate artifacts (which Phase 79 D-13 protocol already governs).

## Common Pitfalls

### Pitfall 1: Conflating `test.skip()` source-skips with cascade-skips
**What goes wrong:** `diff-playwright-reports.ts:407-415` `categorizeStatus()` treats ALL `skipped`-status tests as `cascade`. This conflates two distinct categories:
1. **Source-skips** (intentional `test.skip()` with rationale) — e.g., the 3 `SETTINGS-01 wave A` entries (header.showFeedback, header.showHelp, notifications.voterApp) are PRODUCT-GAP source-skips per `candidate-settings.spec.ts:490-548`. These have non-empty `annotations: [{type: 'skip', description: 'PRODUCT-GAP — …'}]`.
2. **Cascade-skips** (upstream-dependency-failed) — e.g., all 44 variant-related entries are cascade-skips with EMPTY annotations and empty error.

**Why it happens:** Playwright's reporter API emits `status: 'skipped'` for both forms; the only differentiator is `test.annotations[]`. `flattenReport` does NOT read annotations.
**How to avoid:** Plan 01 RCA's audit should annotate each CASCADE_TESTS entry with `kind: 'source-skip' | 'cascade-skip'` based on annotations inspection. The 3 candidate-app-settings entries are NOT in scope for Phase 85's "shrink to ≤5" goal — they are intentional PRODUCT-GAP source-skips and will remain as such until a future Svelte 5 reactivity hardening phase touches `(voters)/+layout.svelte`.
**Warning signs:** If Plan 01's RCA verdict pretends to "fix" header.showFeedback etc., that's wrong scope — they're source-skips and not part of the cascade pool.

### Pitfall 2: Assuming H1 (yarn-arg-forwarding LANDMINE-9) applies to variant setups
**What goes wrong:** The CONTEXT.md hypothesis H1 cites the LANDMINE-9 caveat documented in CLAUDE.md §"Seeding local data" — that `yarn db:reset-with-data --likert-only` does NOT forward args. The implicit assumption is that variant setups invoke `yarn db:seed --template variant-X` via shell.
**Why it doesn't apply:** All 9 variant setups bypass the CLI entirely. They `import { runPipeline, fanOutLocales, Writer, runTeardown } from '@openvaa/dev-seed'` in their setup body and invoke the primitives directly with the template object in scope (see `tests/tests/setup/variant-allowopen.setup.ts:1-7` — pattern is identical across all 9). The CLI's `parseArgs` block at `packages/dev-seed/src/cli/seed.ts:60-70` is never reached.
**How to avoid:** Plan 01 RCA should DOCUMENT this disproof explicitly in `85-RCA-FINDINGS.md` (per D-06 from Phase 79 — preserved disproof evidence). H1 is architecturally inapplicable.
**Warning signs:** Any plan that proposes adding `--likert-only` forwarding to a variant setup is treating a non-existent invocation path.

### Pitfall 3: Inferring that variant setup teardown leaks state between setups
**What goes wrong:** All 9 variant setups call `runTeardown(PREFIX='test-', client)` at the start of their body BEFORE the new write. This is the same teardown logic the base `data.setup.ts:111` uses. If H3 (shared bootstrap state contamination) were the cause, you'd expect to see the LATER variants fail while earlier ones pass. In the Phase 84 anchor, ALL 9 variants skip — including the chain-head `data-setup-multi-election`. This is incompatible with H3.
**Why it doesn't apply:** The chain head never runs (skipped, not failed). H3 requires execution to leak state.
**How to avoid:** Plan 01 RCA can still verify H3 as a defensive instrumentation by running just the variant chain in isolation (after fixing the upstream chain-head failure), but the working hypothesis should be that H3 is not the cause.

### Pitfall 4: H2 (fixture-overlay-ordering races) requires the setup body to have entered its critical section
**What goes wrong:** H2 hypothesizes that the template overlays (`mergeSettings(BUILT_IN_TEMPLATES.e2e.app_settings, ALLOWOPEN_APP_SETTINGS_OVERLAY)` etc.) race on import order or async sequencing. Same reasoning as H3 — the variant setups must have STARTED to race. In the Phase 84 anchor, they never start (skipped with empty error, not failed mid-execution).
**Why it doesn't apply:** Skipped-with-empty-error means the setup body's `setup(...)` callback was never invoked.
**How to avoid:** Plan 01 RCA should defer H2 instrumentation until at least one variant setup runs to completion in a fresh capture.

### Pitfall 5: Local imgproxy 502s confusing the run-N gate
**What goes wrong:** Phase 73 D-09 + Phase 84 carry-forward: local Supabase imgproxy container intermittently 502s. The current DATA_RACE pool's 3 image-intrinsic tests will flake on imgproxy 502. If Plan 01 RCA's optional 1-run smoke trips imgproxy, those 3 failures will look like new DATA_RACE growth — violating D-09.
**Why it happens:** Infrastructure debt carried forward through v2.10 (per STATE.md "Blockers/Concerns").
**How to avoid:** Plan 01 RCA's primary instrumentation is ZERO new test runs — pure read of Phase 84 artifacts. If Plan 02+ runs the 3-run gate, follow Phase 79 D-14 imgproxy 502 recovery protocol verbatim (restart Supabase + reset + re-capture the same run-N).
**Warning signs:** Any DATA_RACE_TESTS entry growing post-Phase-85 is a sign of imgproxy infra debt, not a new race. D-09 binding violation IFF the new entry is non-imgproxy-tied.

### Pitfall 6: Phase 86 scope ambiguity / "fix-or-defer" ladder
**What goes wrong:** The voter-app-popups dismissal test is EXPLICITLY Phase 86 DETERM-12 scope (ROADMAP.md:232 + REQUIREMENTS.md:61). Phase 85 cannot fix it without violating D-08 ("DETERM-10 must NOT pre-resolve voter-FAILURE-CLASS items").
**How to avoid:** Plan 01 RCA must surface this scope-coordination question in `85-RCA-FINDINGS.md`. Three viable resolution paths (planner picks at PLAN.md time):
1. **Coordinate-with-Phase-86:** Wait for Phase 86 DETERM-12 to land the upstream fix, then re-run Phase 85's 3-run gate. Phase 85 closes with regen-constants.mjs CASCADE_BASELINE_TESTS shrunk.
2. **Structural decoupling (D-08-compliant):** Remove `voter-app-popups` from `data-setup-multi-election`'s dependencies (playwright.config.ts:236). This severs the cascade structurally without touching the popups test itself. Precedent: Phase 84's identical structural maneuver on `re-auth-setup`'s dependency (playwright.config.ts:148-152). This is a 1-line change.
3. **DONE-AS-NOOP:** If Phase 86 lands first (it's parallel-eligible with Phase 85 per ROADMAP.md), Phase 85 closes via the Phase 79 P02F precedent — XOR contract; no work needed because the upstream fix collapses the cascade.

### Pitfall 7: voter-popups MIGHT mutate global app settings that variants reset
**What goes wrong:** The 2-element strict-mode locator violation on the close button suggests the Popup component renders 2 overlapping close buttons. If voter-popups runs partially before failing, it may leave global app settings (`results.showFeedbackPopup`, `results.showSurveyPopup`) in a state that variant setups don't reset — creating a SUBTLE H3-like coupling.
**Why it happens:** `voter-popups.spec.ts` mutates global app settings (playwright.config.ts:206 doc). Each variant template's `app_settings.fixed[0].settings` should reset these, but `merge_jsonb_column` is ADDITIVE per Pitfall 3 in the variant setups' inline docstrings.
**How to avoid:** Plan 01 RCA should note this as a "watch-out" for Plans 02..N IF structural decoupling (Pitfall 6 path 2) is chosen — the post-decoupling variants may surface NEW deterministic failures due to popup settings residue. Mitigation: ensure each variant template explicitly sets `results.showFeedbackPopup: 0` and `results.showSurveyPopup: 0` in its `app_settings.fixed[]` block (per variant-multi-election.ts and variant-Ne-Nc.ts precedent).

## Code Examples

Verified patterns from inspection of Phase 84 artifacts + current variant setup code.

### Read Phase 84 anchor run-N for upstream failure
```bash
# Cheapest possible instrumentation — Plan 01 RCA's "Step 1":
for n in 1 2 3; do
  tail -n +2 .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/run-$n.json > /tmp/run-$n.json
done

# Find every non-passed test in projects upstream of the variant chain:
node -e "
  const fs = require('fs');
  for (const n of [1,2,3]) {
    console.log('=== RUN', n, '===');
    const r = JSON.parse(fs.readFileSync('/tmp/run-' + n + '.json', 'utf8'));
    function walk(suites) {
      if (!suites) return;
      for (const s of suites) for (const sp of (s.specs||[])) for (const t of (sp.tests||[])) {
        const proj = t.projectName || '';
        const status = (t.results?.[0]?.status) || t.status || 'unknown';
        const err = (t.results?.[0]?.error?.message) || '';
        if (/voter-app-popups|candidate-app-password|voter-app-settings/.test(proj) && status !== 'passed') {
          console.log(proj.padEnd(24), '|', String(status).padEnd(10), '|', sp.title.slice(0,80), '|', err.slice(0,150).replace(/\\n/g,' | '));
        }
      }
      walk(s.suites);
    }
    walk(r.suites);
  }
"
```
**Expected result (this RESEARCH's empirical capture, 2026-05-14):**
```
=== RUN 1 ===
voter-app-popups        | failed     | should remember dismissal after page reload | Error: locator.click: Error: strict mode violation: getByRole('dialog').getByRole('button', { name: /close|sulje|stäng|l...
voter-app-popups        | skipped    | should show survey popup after delay on results page |
voter-app-popups        | skipped    | should not show any popup when disabled |
=== RUN 2 === (identical to run 1)
=== RUN 3 === (identical to run 1)
```
**Source:** Phase 84 binding anchor `.planning/phases/84-imgproxy-decoupling-…/post-fix/run-{1,2,3}.json`.

### Confirm variant setups never executed
```bash
# Walk variant projects looking for any non-empty error or status != skipped:
node -e "
  const fs = require('fs');
  const r = JSON.parse(fs.readFileSync('/tmp/run-1.json', 'utf8'));
  function walk(suites) {
    if (!suites) return;
    for (const s of suites) for (const sp of (s.specs||[])) for (const t of (sp.tests||[])) {
      const proj = t.projectName || '';
      const status = (t.results?.[0]?.status) || t.status || 'unknown';
      const err = (t.results?.[0]?.error?.message) || '';
      if (/^data-setup-|^variant-/.test(proj)) {
        if (status !== 'skipped' || err) console.log('UNEXPECTED:', proj, status, err.slice(0,100));
      }
    }
    walk(s.suites);
  }
  walk(r.suites);
"
# Expected output: NONE (all variant projects are status: skipped, error: empty).
```
**Source:** Phase 84 binding anchor (confirmed via this RESEARCH's capture).

### Inspect annotations to differentiate source-skip from cascade-skip
```bash
# Differentiate the 3 candidate-app-settings PRODUCT-GAP source-skips from the
# 44 variant cascade-skips:
node -e "
  const fs = require('fs');
  const r = JSON.parse(fs.readFileSync('/tmp/run-1.json', 'utf8'));
  function walk(suites) {
    if (!suites) return;
    for (const s of suites) for (const sp of (s.specs||[])) for (const t of (sp.tests||[])) {
      const proj = t.projectName || '';
      const status = (t.results?.[0]?.status) || t.status || 'unknown';
      const annotations = t.annotations || [];
      if (status === 'skipped') {
        const kind = annotations.length > 0 ? 'SOURCE-SKIP' : 'CASCADE-SKIP';
        console.log(kind.padEnd(15), '|', proj.padEnd(30), '|', sp.title.slice(0,60));
      }
    }
    walk(s.suites);
  }
  walk(r.suites);
" | sort | uniq -c | sort -rn | head -20
```
**Expected:** 3 SOURCE-SKIP entries (header.showFeedback, header.showHelp, notifications.voterApp) + 44 CASCADE-SKIP entries (all variant-* + voter-app-popups dismissal cascades + 4 voter-app-not-located + 2 voter-app-popups + variant-navigation entries).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Investigate cascade via H1 (CLI arg-forwarding) | Inspect existing run-N.json from upstream anchor | 2026-05-14 (this RESEARCH) | Reduces RCA time from 162 min (3-run gate) to ~5 min (read artifacts). |
| Treat each `data-setup-X` as independent failure source | Recognize the **linear chain** dependency shape | playwright.config.ts:254, 262, 278, 294, 311, 328, 344, 361 — already declared linearly since Phase 77 | The 9-setup pool is actually 1-source (chain head) per Playwright's strict cascade contract. |
| `categorizeStatus()` lumps `skipped` as `cascade` regardless of source | Annotate-aware partition (source-skip vs cascade-skip) | Phase 85 RCA-FINDINGS may recommend this enhancement | Avoids confusing PRODUCT-GAP source-skips with cascades in future regen captures. |

**Deprecated/outdated:**
- The "9 independent setups" mental model — superseded by the empirical observation that the chain is linear and single-rooted.
- H1 (yarn-arg-forwarding) as a working hypothesis for the variant chain — superseded by the architectural disproof that variants bypass the CLI.

## Hypothesis-Specific Instrumentation Plan for Plan 01 RCA

> Per CONTEXT.md D-03, instrument in cheapest-first order. This RESEARCH already executed all three in summary; Plan 01's RCA executor can verify any hypothesis in minutes by running the bash snippets in §"Code Examples".

### H1 — yarn-arg-forwarding LANDMINE-9 propagation
- **What to capture:** Grep + read all 9 variant setup files to confirm CLI-bypass.
- **How to capture it:**
  ```bash
  grep -n "yarn\|workspace.*seed\|--likert-only\|--external-id-prefix\|spawn\|exec" tests/tests/setup/variant-*.setup.ts
  # Expected output: zero hits (the setups import dev-seed primitives, never shell out)
  ```
- **Expected failure signature distinguishing H1:** Would show `child_process.spawn` / `execa` / shell-out invocations in variant setup bodies. If present, the setup body's process arguments would propagate the LANDMINE-9 pattern.
- **Verdict from this RESEARCH:** H1 architecturally inapplicable. All 9 variant setups invoke dev-seed via Node imports; no shell process boundary exists.
- **Cheapest-first rank:** 1 (5-min grep).

### H2 — fixture-overlay-ordering races
- **What to capture:** Per-variant `app_settings.fixed[0].settings` overlay shape + the order in which the variant setup body invokes `runTeardown → runPipeline → fanOutLocales → writer.write`. Hash the post-write `app_settings` row after each variant in isolation to detect non-determinism.
- **How to capture it:**
  ```bash
  # Step 1: Confirm setup-body sequence is identical across all 9 variants:
  for f in tests/tests/setup/variant-*.setup.ts; do
    echo "=== $f ==="
    grep -E "runTeardown|runPipeline|fanOutLocales|writer\.write|toMatchObject" "$f" | head -10
  done

  # Step 2: For each variant, run it in isolation 3× and hash the resulting app_settings row.
  # Compare hashes; if identical, H2 is disproven for that variant.
  ```
- **Expected failure signature distinguishing H2:** Per-variant app_settings hash drift across 3 isolated runs. Or differences in the setup-body sequence (e.g., a variant invoking `fanOutLocales` BEFORE `runPipeline`).
- **Verdict from this RESEARCH:** Disproof is partial — the setup-body sequence is identical across all 9 variants (verified by `head -20` read of all 9). But the runtime hash-drift check requires the variants to actually execute, which they currently do not (chain head cascades). Plan 01 RCA can defer this until after the chain-head fix; if variants then surface new deterministic failures, instrument H2 at that point.
- **Cheapest-first rank:** 2 (read+confirm in 5 min; runtime check requires upstream fix first).

### H3 — shared bootstrap state contamination
- **What to capture:** dev-seed module-scope state (`packages/dev-seed/src/**.ts` top-level `const` or `let` declarations); Supabase `auth.users` table residue between variant setups; `playwright/.auth/user.json` storageState refresh boundaries.
- **How to capture it:**
  ```bash
  # Step 1: dev-seed module-scope state audit:
  grep -nE "^(const|let|var)\s+[A-Z_]+\s*=" packages/dev-seed/src/**/*.ts | grep -v ":[^:]*type" | head -30

  # Step 2: auth.users residue audit between variants — run variant-1 isolated,
  # snapshot auth.users; run variant-2 isolated; snapshot auth.users; diff. The
  # diff should contain ONLY the new candidate's auth_user row, NOT the prior
  # variant's row (which the variant teardown should clean up).

  # Step 3: storageState refresh — variant-hidden-required.setup.ts:129-130 calls
  # forceRegister(Alpha) which CHANGES Alpha's auth.user.id; the cached
  # playwright/.auth/user.json file is stale post-variant. Verify this is the
  # design (per the doc-comment at variant-hidden-required.setup.ts:103-128).
  ```
- **Expected failure signature distinguishing H3:** Module-scope state in dev-seed that mutates between calls (e.g., a memoized cache, a singleton); auth.users residue that variants don't clean up; storageState mismatch causing the variant-hidden-required-candidate spec to fail.
- **Verdict from this RESEARCH:** Disproof is partial — `packages/dev-seed/src/writer.ts:61` declares `PORTRAITS_DIR` as a module-scope `const` but it's a filesystem path, not mutable state. `runTeardown` is called at the START of every variant setup, which provides per-variant isolation. But the runtime check requires variants to actually execute. Plan 01 RCA can defer this until after the chain-head fix.
- **Cheapest-first rank:** 3 (module-scope grep in 5 min; runtime check requires upstream fix first).

### NEW H0 — Upstream chain-head deterministic failure (this RESEARCH's verdict)
- **What to capture:** Inspect Phase 84 binding anchor's run-N.json for non-passed tests in projects upstream of `data-setup-multi-election`.
- **How to capture it:** Bash one-liner in §"Code Examples" §"Read Phase 84 anchor run-N for upstream failure".
- **Expected failure signature:** Deterministic FAIL across all 3 runs in `voter-app-popups :: voter-popups.spec.ts > should remember dismissal after page reload` with strict-mode-violation error message. (CONFIRMED 3/3 by this RESEARCH.)
- **Verdict:** **TRUE.** Single root cause. The cascade is upstream-deterministic-fail, NOT any of H1/H2/H3.
- **Cheapest-first rank:** 0 (overrides H1/H2/H3 priority; runs in < 5 min).

## Fix-Plan Template (per CONTEXT.md D-02 + RCA verdict)

> Per D-02, the fix-plan count is decided AT Plan 01 close. This RESEARCH's likely-verdict drives a 1-or-2-plan shape, NOT 3+ plans.

### Path A: Coordinate-with-Phase-86 (D-08-respecting)
- **Trigger:** RCA-FINDINGS verdict = "H0 confirmed; upstream voter-popups test is Phase 86 scope."
- **Plan 02 shape:** Wait-and-rebase. Plan 02 = "After Phase 86 lands DETERM-12 (voter-app-popups fix), re-run the 3-run cold-start gate from Phase 85; regenerate the CASCADE_TESTS array (expected: 47 → 3, where the 3 residual entries are the candidate-app-settings PRODUCT-GAP source-skips that move to a new `SOURCE_SKIP_TESTS` array). Atomic commit per Phase 79 D-10 / Phase 84 D-06 precedent."
- **Plan count:** 1 fix plan.
- **Dependency:** Phase 86 DETERM-12 close.

### Path B: Structural decoupling (Phase-84-style)
- **Trigger:** RCA-FINDINGS verdict = "H0 confirmed; coordinate-path is too slow / Phase 86 may take multiple plans."
- **Plan 02 shape:** Remove `voter-app-popups` from `data-setup-multi-election`'s dependencies at `playwright.config.ts:236`. Replace with `['candidate-app-password']` only (preserving the SEQUENCING constraint that variants run AFTER the default suite, but not the data-flow constraint that voter-app-popups must pass). 1-line config change. Then run the 3-run cold-start gate; CASCADE_BASELINE_TESTS shrinks to expected 3 (the PRODUCT-GAP source-skips). Atomic commit per Phase 79 D-10 / Phase 84 D-06.
- **Precedent:** Phase 84 Plan 01 made an identical structural decoupling at `re-auth-setup → candidate-app-mutation` → `re-auth-setup → candidate-app` (playwright.config.ts:148-152).
- **Plan count:** 1 fix plan.
- **Risk:** Pitfall 7 — voter-popups' partial run may leave global app_settings residue that variant chains don't reset. Mitigation: per-variant `app_settings.fixed[0].settings` overlay explicit popup suppression (already present in `variant-multi-election.ts` and `variant-Ne-Nc.ts`; verify other 7 templates have similar).

### Path C: DONE-AS-NOOP (XOR with Phase 86)
- **Trigger:** Phase 86 lands DETERM-12 BEFORE Phase 85 Plan 02 begins. Plans 02..N short-circuit per Phase 79 P02F precedent.
- **Plan count:** 0 fix plans (Plan 01 RCA captures the verdict; the post-Phase-86 anchor regen absorbs Phase 85 changes).
- **Dependency:** Phase 86 lands first.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Phase 84 binding anchor's run-1/2/3.json captures are an accurate reflection of the current codebase's cold-start state | Summary, §"Code Examples" | If the codebase has changed since Phase 84 close (2026-05-14), the captured failure pattern may not reproduce. Mitigation: Plan 01 RCA optionally runs a 1-run smoke to verify (per Phase 79 D-12 protocol). |
| A2 | The strict-mode locator violation on the popup close button reproduces deterministically (3/3 runs) | Summary | If the error is intermittent and the 3 captures happen to all hit the same race window, Plan 02's fix may not durably close the cascade. Mitigation: Plan 02 Path B (structural decoupling) is durable regardless of the popup test's flakiness. |
| A3 | Path B (structural decoupling) does not introduce new deterministic failures in variant specs via Pitfall 7 (popup settings residue) | §"Fix-Plan Template" Path B | If variant specs surface new FAIL post-decoupling, the cascade pool moves from CASCADE to FAIL, NOT to PASS. Mitigation: Plan 02 Path B explicitly verifies post-fix that each variant template's `app_settings.fixed[0].settings` block sets `results.showFeedbackPopup: 0` and `showSurveyPopup: 0`. |
| A4 | The 3 candidate-app-settings PRODUCT-GAP source-skips are accepted as v2.10 close artifacts (NOT in the 47→0 reduction target) | Summary, Pitfall 1 | If the planner / operator believes these 3 should also disappear, Phase 85 will fall short of "0 CASCADE." Mitigation: Plan 01 RCA-FINDINGS explicitly enumerates these 3 as source-skips and recommends a new SOURCE_SKIP_TESTS partition in `diff-playwright-reports.ts` to separate them. |

## Open Questions

1. **Will Phase 86 land DETERM-12 before Phase 85 Plan 02 begins?**
   - What we know: ROADMAP.md declares Phase 85 + 86 are parallel-eligible after Phase 84.
   - What's unclear: Operator sequencing preference (per `feedback_batch_discussions.md` memory, batches are favored — but the batch was over context-gathering, not execution).
   - Recommendation: Plan 01 RCA-FINDINGS captures BOTH Path A and Path B as viable; the planner picks at PLAN.md time based on Phase 86 progress.

2. **Should the 3 candidate-app-settings PRODUCT-GAP source-skips migrate to a new `SOURCE_SKIP_TESTS` partition in `diff-playwright-reports.ts`?**
   - What we know: They are intentional `test.skip()`s with non-empty annotations; conflating them with cascade-skips obscures the audit.
   - What's unclear: Whether this is in Phase 85 scope (refactor scope creep) or Phase 87 scope (final anchor hygiene).
   - Recommendation: Mention in 85-RCA-FINDINGS as a hygiene candidate; defer the actual partition change to Phase 87 if no other phase touches `diff-playwright-reports.ts` first.

3. **Does any variant spec surface NEW deterministic failures once the chain-head cascade is broken?**
   - What we know: All 18 variant spec entries are currently `skipped`; their post-fix verdicts are entirely unknown.
   - What's unclear: Whether any of the 18 will fail-with-rationale (joining DETERM-12/13/14 cohort) or pass cleanly.
   - Recommendation: Plan 02 (Path A or B) MUST capture the post-fix 3-run gate to determine. If new fails surface, route to Phase 86 per D-08. Do NOT pre-fix them in Phase 85.

## Environment Availability

Plan 01 RCA's primary instrumentation is artifact inspection — no external tools required beyond Node + bash. The optional Plan 02 3-run gate uses the same environment as Phase 79/83/84:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Plan 01 RCA bash snippets (JSON.parse) | ✓ | 22.4.0 [VERIFIED: error message above shows `Node.js v22.4.0`] | — |
| Yarn 4 | Plan 02 3-run gate (`yarn db:reset`, `yarn db:seed`, `yarn test:e2e`) | Assumed ✓ (project convention) | catalog: | — |
| Supabase CLI | Plan 02 3-run gate | Assumed ✓ (Phase 84 ran the gate) | — | imgproxy 502 → restart per Phase 79 D-14 |
| Playwright 1.58.2 | Plan 02 3-run gate | Assumed ✓ (Phase 73 binding) | 1.58.2 | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** Local imgproxy intermittent 502 (carry-forward infra debt per STATE.md "Blockers/Concerns"); fallback = `supabase stop && supabase start && yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean` then re-capture.

## Validation Architecture

Per CONTEXT.md D-05 + Phase 79 D-08 protocol. Phase 85 is on the SAME validation rails as Phase 79 / 83 / 84.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `tests/playwright.config.ts` (451 lines, no Phase 85 changes required for Plan 01 RCA) |
| Quick run command | `node -e "..."` against Phase 84 `run-N.json` (no test execution; ~5 min) |
| Full suite command | `yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=json > .planning/phases/85-…/post-fix/run-N.json` (~54 min per run) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DETERM-10 | RCA verdict committed with diagnostic evidence | manual-only (artifact inspection) | `cat .planning/phases/85-…/85-RCA-FINDINGS.md` | ❌ Wave 0 (Plan 01 deliverable) |
| DETERM-11 | All 9 data-setup-* projects run to completion; CASCADE pool ≤5 | integration (3-run cold-start gate) | Phase 79 D-13 canonical chain × 3 + `node .planning/phases/79-…/post-fix/regen-constants.mjs` | Phase 79's regen-constants.mjs ✓ (verbatim re-use per CONTEXT.md D-05) |

### Sampling Rate
- **Per Plan 01 commit:** Artifact-inspection bash snippets (< 1 min).
- **Per Plan 02 commit:** Plan 02's atomic-regen pattern (Phase 79 D-10) ships run-N.json captures + sha256.txt + regen-output.txt + diff-playwright-reports.ts update.
- **Phase gate:** Full 3-run cold-start gate green via D-05 binding (Phase-84-renegotiated regen-constants.mjs; CASCADE_BASELINE_TESTS may shrink; IMGPROXY_TIED_TITLES match-count assertion preserved at 3).

### Wave 0 Gaps
- [ ] `.planning/phases/85-…/85-RCA-FINDINGS.md` — Plan 01's primary deliverable per D-04.
- [ ] `.planning/phases/85-…/post-fix/` directory — captures from Plan 02's 3-run gate (only if Path A or B per Fix-Plan Template; NOT for Path C DONE-AS-NOOP).
- [ ] CASCADE_BASELINE_TESTS regeneration via Phase 79's archived regen-constants.mjs (per CONTEXT.md D-05).

*(All gaps filled by Plan 01 + Plan 02 execution; no Wave 0 framework setup required — Phase 79 / 83 / 84 already established the rails.)*

## Sources

### Primary (HIGH confidence)
- `.planning/phases/84-…/post-fix/run-{1,2,3}.json` — Phase 84 binding 3-run anchor (this RESEARCH walked all 3 via JSON.parse).
- `tests/playwright.config.ts:42-451` — variant project dependency-graph declarations (verbatim read).
- `tests/scripts/diff-playwright-reports.ts:42-301, 347-415` — partition contract + categorizeStatus logic.
- `tests/tests/setup/variant-*.setup.ts` — all 9 variant setup files inspected.
- `packages/dev-seed/src/cli/seed.ts:60-70` — CLI parseArgs (confirms variants bypass).
- `packages/dev-seed/src/index.ts:48-80` — public exports (`runPipeline`, `Writer`, `runTeardown`, `fanOutLocales`).
- `.planning/REQUIREMENTS.md:57-67` — DETERM-10/11/12 wording.
- `.planning/ROADMAP.md:218-232` — Phase 85/86 success criteria + scope binding.
- `.planning/phases/85-…/85-CONTEXT.md` — locked decisions D-01..D-09.
- `.planning/phases/79-…/79-CONTEXT.md` — P01→P02 RCA-then-fix pattern (Phase 85 mirror).

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — current v2.10 state + Phase 84 close notes.
- `CLAUDE.md` §"Seeding local data" — LANDMINE-9 documentation (referenced for H1 disproof).
- `packages/dev-seed/src/writer.ts` — module-scope state audit (referenced for H3 disproof).

### Tertiary (LOW confidence)
- None — all critical claims are sourced to verified files + the empirically-captured Phase 84 anchor.

## Project Constraints (from CLAUDE.md)

- **Yarn 4 + Turborepo workspace** — Plan 01 RCA uses no new packages; all instrumentation is bash + Node against existing artifacts.
- **Likert-only canonical chain** (CLAUDE.md §"Yarn arg-forwarding caveat") — Plan 02 (if executed) uses the explicit manual chain: `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean`. NOT the `yarn db:reset-with-data --likert-only` shorthand.
- **GSD repo hook workaround** (project_gsd_repo_hook_workaround.md memory) — commits in this repo use `git -c core.hooksPath=/dev/null commit` until the global config is fixed.
- **Code review checklist** (.agents/code-review-checklist.md) — applies to all Phase 85 code changes (if any; Plan 01 has zero code surface).
- **Never commit sensitive data** — applies if Plan 01 RCA snapshots auth.users state (mitigation: dump only counts, not row contents).
- **WCAG 2.1 AA** — N/A for Phase 85 (test-infra only).
- **Localization** — N/A for Phase 85 (test-infra only).

## Metadata

**Confidence breakdown:**
- Project dependency graph + cascade root: HIGH — empirically captured via JSON.parse of all 3 Phase 84 run captures.
- H1 disproof (yarn-arg-forwarding inapplicable): HIGH — architectural; the variant setups physically do not invoke the CLI.
- H2 deferral: MEDIUM — setup-body shapes are uniform; runtime hash-drift check requires upstream fix first.
- H3 deferral: MEDIUM — module-scope grep is clean; runtime auth.users + storageState check requires upstream fix first.
- Path A vs Path B fix recommendation: MEDIUM — depends on operator preference for Phase 86 coordination.
- Pitfall 7 (popup settings residue) likelihood: LOW — variant templates already include popup suppression; this is a watch-out, not a blocker.

**Research date:** 2026-05-14
**Valid until:** 2026-05-21 (7 days; cascade root may shift if the upstream voter-popups test is fixed earlier or any other variant-chain-upstream test regresses).

---

*Phase: 85-variant-project-cascade-rca-fix-investigate-and-close-the-47*
*Research date: 2026-05-14*
*Researcher: Claude (gsd-phase-researcher)*
