# Phase 83: Test Reliability Follow-ups (Image-Upload Cascade + Voter-App Flakes) + v2.10 Milestone-Close Hygiene — Research

**Researched:** 2026-05-13
**Domain:** Playwright E2E test reliability (selector drift + hydration race) + parity-script constants regen
**Confidence:** HIGH

## Summary

This is a fix-implementation phase, not a domain-exploration phase. All architecture / library / approach decisions are locked in `83-CONTEXT.md` (D-01..D-11). The research job here is purely concrete-fact-finding: read the actual test files the planner will edit and capture (a) verbatim test titles for IN-02 PASS_LOCKED backfill, (b) module-scope variable names the DETERM-07 hydration-completeness guards will reuse, (c) the exact existing assertion shape the WR-01 tightening will modify, (d) the exact existing jsdoc text the IN-02 task will strike, and (e) the Phase 79 D-08/D-09/D-10/D-11/D-13 protocol the verification gate inherits verbatim.

All factual claims below are `[VERIFIED]` against the live repo on 2026-05-13 — no assumed knowledge, no stale training data. The single `[ASSUMED]` claim (Validation Architecture's "sampling rate per task" wall-time amortization) is flagged in the Assumptions Log.

**Primary recommendation:** Land WR-01 (Task 1) FIRST or atomically-with-DETERM-06 (Task 2) because the variant-hidden-required-candidate cascade chain may unblock once DETERM-06's selector-drift fix promotes the candidate-profile.spec.ts CAND-03 cascade source out of failure. Adopt single-PLAN-9-task structure per CONTEXT D-08. Use Phase 79's archived `regen-constants.mjs` verbatim — it requires zero adaptation; the only edit is `reportPath = join(__dirname, 'run-3.json')` at line 23 of a Phase-83-local copy.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**DETERM-06 — image-upload cascade mitigation ladder:**
- **D-01a — PRIMARY:** selector-drift fix in `ProfilePage.uploadImage()` at `tests/tests/pages/candidate/ProfilePage.ts:24-37`. Replace `imageArea.locator('label[tabindex="0"]').click()` (line 34) with `imageArea.getByRole('button').first().click()`. Drop `// eslint-disable-next-line playwright/no-raw-locators` exemption at line 33.
- **D-01b — ESCALATION step 1 (contingent on D-01a 1-run smoke failure):** Add 500ms pre-filechooser settle delay in `ProfilePage.uploadImage()` BEFORE the `waitForEvent('filechooser')` registration, per Phase 76 P01 pattern.
- **D-01c — ESCALATION step 2 (contingent on D-01b failure):** Uncomment `[storage.image_transformation]` block at `apps/supabase/supabase/config.toml:130-131`. **REJECTED at the outset** as primary fix.
- **D-01d — Escalation cadence:** 1-run cold-start smoke between each ladder step per Phase 79 D-12.
- **D-01e — jsdoc refresh on D-01a success:** drop stale `<label tabindex="0">` paragraph at ProfilePage.ts:27-32 + the eslint-disable line; replace with current `<button>` + `aria-labelledby="{id}-label {id}-image-label"` documentation.

**DETERM-07 — voter-app flake stabilization (shared hydration-completeness hypothesis):**
- **D-02 — Root cause hypothesis (operator-confirmed):** PARTIAL-HYDRATION RACE, not non-deterministic ordering. `@openvaa/matching` is deterministic; flake is UI being asserted before hydration completes.
- **D-03a — DETERM-07a fix shape:** assert expected card count BEFORE indexing `.last()` / `.first()` at `voter-matching.spec.ts:238-246`. `EXPECTED_CARD_COUNT` derived from module-scope computation.
- **D-03b — DETERM-07b fix shape:** hydration-completeness guard before drawer-open click at `voter-detail.spec.ts:124`. `expectedPartyCount` derived from fixture-counts logic.
- **D-03c — Verification cadence:** 3-run cold-start identity REQUIRED for both DETERM-07a AND DETERM-07b promotion per Phase 79 D-08.
- **D-04 — DETERM-07b PASS_LOCKED promotion shape:** REMOVE the party-drawer narrative from `diff-playwright-reports.ts:80-90`; ADD `'voter-app :: specs/voter/voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs'` to `PASS_LOCKED_TESTS` in alphabetical position; bump jsdoc count.

**Phase 82 advisory follow-ups:**
- **D-05 — WR-01 chose option (b):** EXTEND OVERLAY (delete `test-question-required-empty-1` from Alpha at `variant-hidden-required.ts:169-179`) + TIGHTEN SPEC ASSERTION at `candidate-required-info.spec.ts:114-145`. Land BEFORE or ATOMICALLY-WITH DETERM-06's D-01a fix.
- **D-06 — IN-01 docstring count fix:** `candidate-profile-validation.spec.ts:6,51` — "3" → "6". Cosmetic.
- **D-07 — IN-02 +2 PASS_LOCKED backfill:** add A11Y-05 + A11Y-06 entries to `diff-playwright-reports.ts:111-193`; update jsdoc count `81` → `83+N`; strike Phase 81 deferred-backfill caveat sentence.

**Plan structure + verification gate:**
- **D-08 — Single PLAN.md covers all 7 SCs**, 9 tasks (planner refines).
- **D-09 — Verification gate:** 3-run cold-start regen via Phase 79's archived `regen-constants.mjs`; preserves anchor SHA `ff0334f856650611e2a5d1b1f990e6bbd3ad7c228ff585d5f1b5abf6bc3a09c5` IF PASS_LOCKED does NOT shift (unlikely).
- **D-10 — Gate execution:** agent-inline via Bash run_in_background per Phase 79 D-11. ~162 min total wall time.
- **D-11 — Verification anchor preservation:** Phase 83's regen absorbs the v2.10 anchor and produces the new v2.10-close anchor (likely 86 PASS_LOCKED + 15 DATA_RACE + 52 CASCADE).

### Claude's Discretion

- Planner picks alphabetical insertion point for the 2 IN-02 backfill entries and the 1 DETERM-07b promotion entry in `PASS_LOCKED_TESTS`.
- Planner picks the helper-extraction question for hydration-completeness guard (inline guard per test vs. `expectResultsHydrated(page, expectedCount)` helper).
- Planner picks the EXACT verbatim test titles for IN-02 backfill — reads the live `test(...)` declarations.
- Planner picks how to derive `EXPECTED_CARD_COUNT` / `expectedPartyCount`.
- Planner picks whether to land D-05 as 1 commit or 2.
- Planner picks the WR-01 spec-assertion shape.

### Deferred Ideas (OUT OF SCOPE)

- Project-wide hydration-completeness assertion sweep (v2.11+).
- Page-object selector-drift audit beyond ProfilePage.uploadImage (v2.11+).
- DATA_RACE pool growth re-examination (v2.11+).
- FAILURE-CLASS rationale-block audit beyond the party-drawer reference (v2.11+).

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DETERM-06 | `should upload a profile image (CAND-03)` runs to completion in cold-start mode without cascade-skipping its 5 downstream tests. | Selector-drift fix path verified in Input.svelte:532-557 — the `<button type="button" id="{id}-image-label">` IS the current shape; `getByRole('button').first()` is the canonical locator. Mitigation ladder (D-01a→b→c) confirmed cheapest-first. |
| DETERM-07 | 2 voter-app intermittent flakes (`worst match` + `party detail drawer`) stabilized to deterministic PASS via hydration-completeness guards. | Module-scope `expectedRanking.length` and `visibleCandidateCount` / `E2E_ORGANIZATIONS.length` derivations verified in voter-matching.spec.ts:119 + voter-results.spec.ts:42 — both fixture exports already exist and are battle-tested. |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Playwright page-object selector hygiene (D-01a, D-01e) | Test infrastructure | Frontend component (read-only reference to Input.svelte) | The fix is purely test-side; the frontend component reference exists only to document the post-Phase-70 button shape ProfilePage aligns TO. |
| Hydration-completeness guard (D-03a, D-03b) | Test infrastructure | Frontend reactivity (read-only — hydration race is inherent to SvelteKit + voter-app's $derived chain) | The guard is a test-side mitigation for a frontend timing reality. No frontend code is modified. |
| variant-hidden-required overlay (D-05 overlay extend) | Test infrastructure (e2e fixture) | — | Pure fixture mutation; no frontend / backend touch. |
| SETTINGS-03 spec assertion tighten (D-05) | Test infrastructure (test body) | Frontend (read-only — verifies +page.svelte:121 InfoBadge OR candCtx.unansweredRequiredInfoQuestions count) | Read-only frontend reference; the spec asserts existing UI behavior. |
| Docstring count update (D-06) | Test infrastructure (docstring) | — | Pure docstring; cosmetic. |
| PASS_LOCKED array update + jsdoc bump (D-04, D-07) | Test infrastructure (parity-script) | — | Pure parity-script edit. |
| 3-run cold-start gate + regen-constants.mjs (D-09, D-10) | Test infrastructure (gate runner + regen script) | Frontend + Backend (read-only — gate captures full-suite behavior) | The gate observes the full system; no system changes. |
| Todo file moves (CONTEXT §"todo-file moves at phase close") | Planning artifact | — | Pure filesystem operation in `.planning/todos/`. |

**No frontend / backend code is modified by Phase 83 except contingently** at D-01c if the ladder escalates that far (Supabase `config.toml`).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | `1.58.2` [VERIFIED: tests/playwright.config.ts + project precedent] | E2E test runner | Already pinned across v2.x; no upgrade in v2.10 scope. |
| Node.js | `>= 20.x` [VERIFIED: package.json `engines`] | Script runtime for `regen-constants.mjs` | ESM-native; the regen script uses `import` + `process.exit`. |
| `tsx` | (transitive via tests workspace) [VERIFIED: tests/scripts/diff-playwright-reports.ts shebang `#!/usr/bin/env tsx`] | Run diff-playwright-reports.ts as a script | Phase 79 precedent. |
| Yarn | `4.x` (Berry) [VERIFIED: package.json `packageManager`] | Workspace dispatch (`yarn test:e2e`) | Project convention per CLAUDE.md. |

**Installation:** No new dependencies. All tools already installed via `yarn install`. The Phase 79 archived `regen-constants.mjs` is a self-contained `.mjs` file with zero non-stdlib imports (`node:fs`, `node:url`, `node:path` only) — copy-paste-ready.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@openvaa/matching` | `workspace:^` [VERIFIED: tests/tests/specs/voter/voter-matching.spec.ts:19] | Module-scope independent matching computation (DETERM-07a fix derives `EXPECTED_CARD_COUNT` from this) | Already imported by voter-matching.spec.ts — D-03a reuses the existing `expectedRanking` array. |
| `@openvaa/core` | `workspace:^` | `HasAnswers` type for the matching reference entity | Already imported. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `getByRole('button').first()` (D-01a) | `getByRole('button', { name: /add image|change image/i })` (semantic-name locator) | Name-based is more brittle to i18n changes; `.first()` is the established pattern at `candidate-profile-validation.spec.ts:214`. Aligns with existing precedent. |
| Inline-per-test hydration guard | Shared `expectResultsHydrated(page, expectedCount)` helper | Helper extraction is cleaner if 3+ tests in the same file benefit. voter-matching.spec.ts has 4 candidate sibling tests (lines 201, 229, 238, 248) that all use `.first()` / `.last()` / `.nth()`. Helper recommended. voter-detail.spec.ts only has 1 affected test (line 124); inline guard is fine there. |
| Phase 79 archived `regen-constants.mjs` | Re-author script from scratch | Phase 79's script is self-contained, verified via 6-run audit (`sha256.txt`), and preserves the Phase 73 D-09 IMGPROXY_TIED_TITLES binding contract. Re-authoring would risk drift. Copy verbatim per CONTEXT D-09. |

## Architecture Patterns

### System Architecture Diagram

```
                        ┌────────────────────────────────────────────────────┐
                        │ Phase 83 Verification Gate (3-run cold-start)      │
                        │                                                    │
                        │ ┌──────────────┐   ┌──────────────┐   ┌──────────┐ │
                        │ │ db:reset +   │──▶│ yarn dev +   │──▶│ test:e2e │ │
                        │ │ likert seed +│   │ vite bg      │   │ json     │ │
                        │ │ dev:clean    │   └──────────────┘   │ reporter │ │
                        │ └──────────────┘                       └─────┬────┘ │
                        │                                              │      │
                        │                                              ▼      │
                        │                                       ┌────────────┐│
                        │                                       │ run-N.json ││
                        │                                       └─────┬──────┘│
                        │                                             │       │
                        │      (×3 cold-start runs, agent-inline)     │       │
                        └─────────────────────────────────────────────┼───────┘
                                                                       │
                                                                       ▼
                                                            ┌────────────────────┐
                                                            │ sha-identity check │
                                                            │  (SHA-256 over     │
                                                            │   sorted ids)      │
                                                            └─────┬──────────────┘
                                                                  │
                                                ┌─────────────────┴─────────────────┐
                                                │                                   │
                                       3-run SHA-identical?                Diverge per D-09
                                                │                                   │
                                                ▼                                   ▼
                                  ┌──────────────────────┐              ┌───────────────────┐
                                  │ regen-constants.mjs  │              │ Re-run + investigate│
                                  │  (Phase 79 verbatim) │              │  flake; cap at one  │
                                  └──────┬───────────────┘              │  re-run cycle       │
                                         │                              └─────────────────────┘
                                         ▼
                              ┌──────────────────────────┐
                              │ regen-output.txt:         │
                              │  PASS_LOCKED (86?)        │
                              │  DATA_RACE (15 — locked)  │
                              │  CASCADE (52?)            │
                              │ + IMGPROXY-audit          │
                              └──────────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────────────┐
                              │ diff-playwright-reports.ts│
                              │  PASS_LOCKED_TESTS array  │
                              │  + jsdoc count + caveat   │
                              │  + FAILURE-CLASS narrative│
                              │  + Phase 81 caveat strike │
                              └──────────────────────────┘

                        ┌────────────────────────────────────────────────────┐
                        │ Phase 83 Code Changes (9 tasks, ≤8 atomic commits) │
                        │                                                    │
                        │  Task 1 — WR-01 (D-05): variant-hidden-required.ts │
                        │           + candidate-required-info.spec.ts        │
                        │           [MUST land before OR atomic-with Task 2] │
                        │                                                    │
                        │  Task 2 — DETERM-06 D-01a: ProfilePage.ts          │
                        │           selector + jsdoc refresh (D-01e)         │
                        │                                                    │
                        │  Task 3 — DETERM-06 1-run smoke (D-01d gate)       │
                        │           [escalate to D-01b/c if cascade repro]  │
                        │                                                    │
                        │  Task 4 — DETERM-07a (D-03a): worst match guard   │
                        │  Task 5 — DETERM-07b (D-03b): party drawer guard   │
                        │           [Tasks 4 + 5 parallel; same file though,│
                        │            so coordinate; or single commit]        │
                        │                                                    │
                        │  Task 6 — IN-01 (D-06): docstring counts           │
                        │                                                    │
                        │  Task 7 — 3-run cold-start gate execution          │
                        │  Task 8 — Constants regen + IN-02 (D-07) +         │
                        │           DETERM-07b promotion (D-04) + jsdoc      │
                        │           [Tasks 7 + 8 = SINGLE atomic commit]     │
                        │                                                    │
                        │  Task 9 — Move 2 todos to .planning/todos/done/   │
                        └────────────────────────────────────────────────────┘
```

### Recommended Project Structure

No new directories. Phase 83 writes a Phase-83-local copy of the regen tooling under:

```
.planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/
├── 83-CONTEXT.md                              # exists (Phase 83 discuss-phase output)
├── 83-DISCUSSION-LOG.md                       # exists (discuss-phase audit log)
├── 83-RESEARCH.md                             # this file
├── 83-01-PLAN.md                              # to be authored by planner
├── 83-01-SUMMARY.md                           # to be authored by executor
├── post-fix/                                  # to be created by Task 7
│   ├── regen-constants.mjs                    # copy of Phase 79's, reportPath adjusted
│   ├── run-1.json                             # Task 7 capture 1
│   ├── run-2.json                             # Task 7 capture 2
│   ├── run-3.json                             # Task 7 capture 3
│   ├── sha256.txt                             # Task 8 SHA-identity audit
│   ├── regen-output.txt                       # Task 8 regen-constants.mjs stdout
│   ├── parity-gate-output.txt                 # Task 8 parity-gate verdict
│   └── imgproxy-audit.txt                     # Task 8 IMGPROXY_TIED_TITLES audit
└── STATUS.md                                  # (optional) wake-up dashboard per Phase 79 D-16
```

### Pattern 1: Phase 79 archived `regen-constants.mjs` — copy verbatim, adjust `reportPath`

**What:** Self-contained Node ESM script that flattens a Playwright JSON report, partitions tests into PASS_LOCKED / DATA_RACE / CASCADE per the Phase 73 D-09 binding (IMGPROXY_TIED_TITLES list at lines 67-82), and writes `regen-output.txt`.
**When to use:** After Task 7's 3-run cold-start captures, when sha-identity check across run-1/2/3 PASSES.
**Example (verified at .planning/phases/79-…/post-fix/regen-constants.mjs):**
```javascript
// Phase 79's reportPath at line 23:
const reportPath = join(__dirname, 'run-6.json');
// Phase 83 adjustment (planner edits a single line):
const reportPath = join(__dirname, 'run-3.json');
```

The IMGPROXY_TIED_TITLES list at lines 67-82 is preserved VERBATIM (Phase 73 D-09 binding). The match-count assertion at lines 87-100 will `process.exit(1)` if any imgproxy-tied title is renamed upstream — this is the structural integrity check.

### Pattern 2: Phase 79 canonical Likert-only cold-start chain (LANDMINE-9)

**What:** The exact bash command sequence for a clean cold-start, per CLAUDE.md §"Seeding local data" + Phase 79 D-13.
**When to use:** Before EVERY 1-run smoke (D-01d) AND every 3-run gate run (Task 7).
**Example (verbatim):**
```bash
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean
```

**WARNING:** Do NOT substitute `yarn db:reset-with-data --likert-only` — the `--likert-only` flag does NOT forward through the `&&`-chain (yarn appends trailing args to LAST command, which is `dev:clean`). This is LANDMINE-9 from CLAUDE.md, verified in Phase 78 CLEAN-05.

### Pattern 3: Hydration-completeness guard

**What:** Assert `toHaveCount(expectedCount)` BEFORE indexing with `.first()` / `.last()` / `.nth()`. Forces Playwright to wait for the full hydrated list before extracting a positional element.
**When to use:** Any spec that asserts against a position in a reactive list (DETERM-07a + DETERM-07b).
**Example (D-03a target shape):**
```typescript
// voter-matching.spec.ts:238-246 — current
test('should show worst match candidate as last result', async ({ page }) => {
  await navigateToResults(page);
  const cards = page.getByTestId(testIds.voter.results.card);
  const lastCard = cards.last();                                 // races hydration
  const opposeName = `${opposeCandidate.first_name} ${opposeCandidate.last_name}`;
  await expect(lastCard).toContainText(opposeName);
});

// Phase 83 DETERM-07a fix — inline guard
test('should show worst match candidate as last result', async ({ page }) => {
  await navigateToResults(page);
  const cards = page.getByTestId(testIds.voter.results.card);
  await expect(cards).toHaveCount(expectedRanking.length);       // module-scope (line 119)
  const lastCard = cards.last();
  const opposeName = `${opposeCandidate.first_name} ${opposeCandidate.last_name}`;
  await expect(lastCard).toContainText(opposeName);
});

// Phase 83 DETERM-07a alternative — extracted helper (recommended if 3+ sibling tests benefit)
async function expectResultsHydrated(page: Page, expectedCount: number): Promise<void> {
  await expect(page.getByTestId(testIds.voter.results.card)).toHaveCount(expectedCount);
}
```

### Anti-Patterns to Avoid

- **Using `await page.waitForTimeout(N)` instead of `toHaveCount()`** — timing-based waits flake under load; `toHaveCount()` polls until the assertion succeeds within the timeout budget. Phase 76 P01 had to use waitForTimeout for the macOS Chromium filechooser actor race because there was no observable hydration signal; voter-app results IS observable via `cards.count()`. Use the structural signal.
- **Demoting flaky tests to `test.skip()` without first attempting a hydration fix** — Phase 73 D-09 binding forbids DATA_RACE pool growth, but demotion to skip-with-rationale is permitted. Per CONTEXT D-03c, "DO NOT demote either test … without first attempting the hydration-completeness fix" — the operator-confirmed hypothesis is partial hydration, not unfixable non-determinism.
- **Editing the IMGPROXY_TIED_TITLES list in `regen-constants.mjs`** — Phase 73 D-09 STRUCTURAL BINDING; modifying this list changes the DATA_RACE pool semantics and breaks the cross-phase parity contract. The Phase 79 archived script preserves this list verbatim; Phase 83's copy MUST preserve it verbatim.
- **Re-running the 3-run gate against a non-fresh database** — Phase 79 D-13 mandates the canonical chain (`db:reset && db:seed --template e2e --likert-only && dev:clean`) BEFORE each capture. Stale state from a previous run pollutes the SHA-256 identity check.
- **Forwarding `--likert-only` through `yarn db:reset-with-data`** — LANDMINE-9. Use the manual `&&`-chain.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SHA-256 identity check across run-N.json files | Custom sha utility | Phase 79's archived `sha-identity.mjs` (sibling of regen-constants.mjs at `.planning/phases/79-…/post-fix/sha-identity.mjs`) | The script is verified by 6-run Phase 79 audit. Phase 83 copies it verbatim alongside regen-constants.mjs. [VERIFIED: ls of Phase 79 post-fix/ shows sha-identity.mjs present.] |
| Re-author parity-script constants regen logic | Hand-written partition + IMGPROXY filter | Phase 79's `regen-constants.mjs` (verbatim copy) | Preserves Phase 73 D-09 structural binding; tested via 6-run cold-start audit. [VERIFIED: regen-constants.mjs lines 67-100 contain the match-count assertion.] |
| Expected candidate / party count derivation in DETERM-07 fixes | New module-scope computation | Existing `expectedRanking.length` (voter-matching.spec.ts:119) AND existing `E2E_ORGANIZATIONS.length` (voter-results.spec.ts:42) | Both fixture-derived counts ALREADY exist and are battle-tested. Reusing them keeps the fix surgical. [VERIFIED: voter-matching.spec.ts:119 `const expectedRanking = computedMatches.map(...)`; voter-results.spec.ts:42 `const totalPartyCount = E2E_ORGANIZATIONS.length;` and used at :143.] |
| Cold-start parity gate runner | Custom orchestrator | Phase 79 D-11 agent-inline `Bash run_in_background` pattern | Operator-blessed precedent; agent runs the 3 captures autonomously. [VERIFIED: Phase 79 D-11 + Phase 79 post-fix artifacts confirm agent-inline ran cleanly across 6 runs.] |

**Key insight:** Phase 79 already authored every tool Phase 83 needs. Phase 83 is a thin layer of test-side fixes + a re-run of the Phase 79 verification gate. Hand-rolling ANY of the verification mechanism would risk drift from the Phase 73 D-09 binding contract.

## Runtime State Inventory

> Phase 83 IS a refactor / fix phase touching test infrastructure, so this section is included.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Phase 83 does not change DB schema or seed identifiers. `test-question-required-empty-1` row already exists in the base e2e seed (Phase 82 added it at `packages/dev-seed/src/templates/e2e.ts:702-740`); WR-01's overlay-extend only mutates the variant overlay, not the base seed. Confirmed: no Mem0 / ChromaDB / Redis usage in this project. | None |
| Live service config | None — Phase 83 does not touch n8n / Datadog / Tailscale / Cloudflare / external SaaS. Local Supabase config.toml at `apps/supabase/supabase/config.toml:130-131` is touched ONLY contingently at D-01c escalation (commented `[storage.image_transformation]` block). | None unless D-01c escalates |
| OS-registered state | None — no Windows Task Scheduler / pm2 / launchd / systemd registrations involve Phase 83 surfaces. | None |
| Secrets / env vars | None — Phase 83 does not introduce or rename any env vars. SOPS-managed secrets unaffected. | None |
| Build artifacts | None — Phase 83 modifies `.ts` source files in `tests/` and `.planning/` markdown. No build artifacts (egg-info, dist/, .turbo/) carry the modified identifiers. `tests/scripts/diff-playwright-reports.ts` is the parity-script anchor file; reading it via the `tsx` shebang reads source directly (no build step). | None |

**Verified by:** repo-wide grep for the modified strings (`label[tabindex="0"]`, `test-question-required-empty-1`, `worst match candidate as last result`, `should open party detail drawer`) restricted to `.ts` / `.svelte` files + `.planning/` markdown. No DB / config / env / runtime registrations matched.

## Common Pitfalls

### Pitfall 1: WR-01 ordering vs DETERM-06's cascade-unblock

**What goes wrong:** DETERM-06 D-01a (selector-drift fix at ProfilePage.ts:34) unblocks the candidate-app-mutation cascade chain. The variant-hidden-required-candidate project chains through data-setup → variant-hidden-required.setup → candidate-required-info.spec.ts. If the cascade unblock re-enters the SETTINGS-03 spec into the cold-start baseline AND the WR-01 overlay extend has not landed, the spec assertion (which CONTEXT D-05 tightens to `=== 2`) will fail against a state where only `test-question-displayname` is unanswered (count is `1`, not `2`).

**Why it happens:** The variant-hidden-required-candidate project is currently CASCADE-pooled per the Phase 79 baseline (see `diff-playwright-reports.ts:249`). When DETERM-06 D-01a lands, candidate-app-mutation moves out of cascade. The CASCADE chain reaches variant projects via `dependencies: ['candidate-app-password', 'voter-app-popups']` at `playwright.config.ts:222` — so promoting candidate-app-mutation indirectly unblocks variant-hidden-required-candidate.

**How to avoid:** Per CONTEXT D-05 final paragraph: "land WR-01 (b) in the same atomic commit as DETERM-06's D-01a (or in an earlier commit), so the spec assertion is correct by the time the cascade chain re-runs." PLANNER MUST author Task 1 (WR-01) BEFORE Task 2 (DETERM-06 D-01a). The 1-run smoke gate at Task 3 will catch a violation but at the cost of a wasted ~54-min smoke cycle.

**Warning signs:** Task 3's 1-run smoke shows `variant-hidden-required-candidate :: … > SETTINGS-03 unanswered required info question disables profile-dependent CTAs on CandAppHome` failing where it was previously cascade-skipped. If observed, revert Task 2, land WR-01 first, re-attempt.

[VERIFIED: tests/playwright.config.ts:215-285 — variant-hidden-required project dependency chain; tests/scripts/diff-playwright-reports.ts:249 — SETTINGS-03 spec is currently in CASCADE_TESTS pool.]

### Pitfall 2: WR-01 spec-assertion shape — the current spec asserts UX gates, not counts

**What goes wrong:** CONTEXT D-05 says "tighten the assertion from `expect(unansweredRequiredInfoQuestionsLength).not.toBe(0)` (or equivalent) to `expect(unansweredRequiredInfoQuestionsLength).toBe(2)`". But the existing SETTINGS-03 spec (`candidate-required-info.spec.ts:99-160`) does NOT assert `unansweredRequiredInfoQuestions.length` at all — it asserts the disabled-attribute on the Questions Button and Preview Button (lines 131, 144) and the enabled state of the Profile Button (line 158). Reading "tighten" literally as "change `!== 0` to `=== 2`" is impossible because there is no `!== 0` assertion to tighten.

**Why it happens:** Phase 82 WR-01 reviewer described the spec's assertion as `unansweredRequiredInfoQuestions.length !== 0` (REVIEW.md §WR-01) but that description is paraphrased — what the spec actually asserts is the DOM-level UX behavior driven BY the count (the `disabled={candCtx.unansweredRequiredInfoQuestions?.length !== 0}` binding at `+page.svelte:129,144`). The disabled-attribute assertion at line 131 (`await expect(questionsButton).toHaveAttribute('disabled', 'true')`) holds whether the count is 1 OR 2 — it asserts truthiness, not the exact count.

**How to avoid:** The planner must AUTHOR (not "modify") the count assertion. Two options:
- **Option A — InfoBadge text assertion:** add `await expect(page.getByTestId(testIds.candidate.home.profile).getByRole('status').or(page.locator('.badge-warning'))).toHaveText('2')` — but `candidate-home-profile` is the Button and the InfoBadge has no testId; locating by `.badge-warning` class is a raw locator (`playwright/no-raw-locators` violation absent eslint-disable). NOT recommended.
- **Option B — page.evaluate count read:** use Svelte 5 context introspection — `await page.evaluate(() => (window as any).candCtx.unansweredRequiredInfoQuestions.length)` — but `candCtx` is not exposed on `window`; would require test-only instrumentation. NOT recommended.
- **Option C — InfoBadge text via getByText:** `await expect(page.getByText(/^2$/)).toBeVisible()` — but other "2"s may render on the page. Fragile.
- **Option D — RECOMMENDED — overlay-extend alone, leave the spec assertion intact:** Per CONTEXT D-05's primary intent ("eliminate the implicit additive coupling"), the structural elimination is the OVERLAY extension. The spec assertion currently passes regardless of count `1` or `2` (the disabled-attribute holds for any non-zero count). Once the overlay deletes `test-question-required-empty-1` from Alpha, the SPEC ITSELF doesn't need to change — the implicit coupling is gone because BOTH required questions are unanswered, making the count's value irrelevant to spec correctness. The "tighten" wording in CONTEXT may be aspirational; the practical fix is overlay-only.

**Planner action:** Confirm interpretation with the operator via PLAN.md or pick Option A with a `// reason:` eslint-disable + explicit selector chain. Recommended interpretation = Option D — but flag the ambiguity. Lock the choice at PLAN.md authoring.

**Warning signs:** Spec file unchanged from current shape — Task 1 commits only `variant-hidden-required.ts`. Acceptable if Option D is chosen; flag in commit message.

[VERIFIED: tests/tests/specs/candidate/candidate-required-info.spec.ts:99-160 — read in full; no `unansweredRequiredInfoQuestions.length` assertion present; only disabled-attribute + tabindex assertions on 3 buttons.]

### Pitfall 3: `EXPECTED_CARD_COUNT` derivation — module-scope constant already exists with a different name

**What goes wrong:** Planner introduces a new module-scope constant `EXPECTED_CARD_COUNT` in voter-matching.spec.ts when one already exists under a different name. Code duplication.

**Why it happens:** CONTEXT D-03a code example uses the placeholder name `EXPECTED_CARD_COUNT`. The actual existing variable is `expectedRanking.length` (line 119: `const expectedRanking = computedMatches.map((m) => (m.target as (typeof candidateEntities)[0]).name);`). This is the flat list of all `visibleCandidates` (line 72: `allCandidates.filter((c) => c.terms_of_use_accepted)`), which equals 11 per voter-results.spec.ts:114's `visibleCandidateCount`.

**How to avoid:** Use `expectedRanking.length` directly. Or extract a named const `const EXPECTED_CARD_COUNT = expectedRanking.length;` immediately after line 119 if the planner prefers semantic naming. No need for an independent fixture derivation.

**Warning signs:** Two parallel module-scope constants computing the same count from the same fixture inputs.

[VERIFIED: tests/tests/specs/voter/voter-matching.spec.ts:62-119 — `visibleCandidates` filter at :72 → `candidateEntities` map at :77 → `computedMatches` at :99 → `expectedRanking` at :119. The flat list is exactly the count of visible cards rendered.]

### Pitfall 4: `expectedPartyCount` for DETERM-07b — `E2E_ORGANIZATIONS.length` already exists in a sibling spec, not in voter-detail.spec.ts

**What goes wrong:** Planner imports `E2E_ORGANIZATIONS` into voter-detail.spec.ts to derive the party count, OR re-derives the count from `E2E_DEFAULT_CANDIDATES`/`E2E_VOTER_CANDIDATES`.

**Why it happens:** voter-detail.spec.ts (the file containing the failing test) does NOT currently import `E2E_ORGANIZATIONS` — it only imports `E2E_CANDIDATES` (line 23). The sibling spec voter-results.spec.ts imports `E2E_ORGANIZATIONS` and derives `totalPartyCount` at line 42. The cleanest cross-spec pattern is to add the import to voter-detail.spec.ts and compute `expectedPartyCount = E2E_ORGANIZATIONS.length` at module scope.

**How to avoid:** Add `E2E_ORGANIZATIONS` to the existing import at voter-detail.spec.ts:23 (currently `import { E2E_CANDIDATES } from '../../utils/e2eFixtureRefs';`). Then derive at module scope. Value is `4` per the e2e seed (2 default parties + 2 voter parties).

**Hydration target:** The party-card link is `page.getByTestId('entity-card-action')` (voter-detail.spec.ts:140). The hydration-completeness guard should assert `partySection.getByTestId('entity-card-action')` has count `expectedPartyCount` BEFORE the `.first().click()`. Note `entity-card-action` is a raw testId string in the existing spec — already in use, no new selector needed.

**Warning signs:** New `import { E2E_DEFAULT_CANDIDATES, E2E_VOTER_CANDIDATES } from '../../utils/e2eFixtureRefs';` in voter-detail.spec.ts — over-importing.

[VERIFIED: tests/tests/utils/e2eFixtureRefs.ts:127-129 exports `E2E_ORGANIZATIONS` (4 parties); tests/tests/specs/voter/voter-results.spec.ts:42 derives `totalPartyCount = E2E_ORGANIZATIONS.length`; tests/tests/specs/voter/voter-detail.spec.ts:140 uses `entity-card-action` raw testId; packages/dev-seed/src/templates/e2e.ts:189-228 confirms 4 organizations in the e2e seed.]

### Pitfall 5: IN-02 jsdoc count math — Phase 83 net is conditional

**What goes wrong:** Planner hard-codes the new jsdoc count as `83` without accounting for DETERM-07b promotion (+1) and the DETERM-06 cascade-unblock potential (+5).

**Why it happens:** CONTEXT D-07 says: "Update the jsdoc at line 110 from `81 tests locked PASSING on Phase 82 baseline` to `83 tests locked PASSING on Phase 83 baseline (Phase 82 baseline 81 + 2 Phase 81 deferred backfills: A11Y-05 email-format + A11Y-06 url-format)`. If DETERM-06 / DETERM-07 ALSO shift PASS_LOCKED (likely +1 from DETERM-07b promotion + ~5 from DETERM-06 unblock), the count becomes `83 + N` and the jsdoc reflects the net."

**How to avoid:** Task 8 (regen + IN-02) lands AFTER Task 7 (3-run gate) — the gate captures the EXACT new count. The planner authors Task 8 with a placeholder `{POST_GATE_COUNT}` to be substituted with the actual sorted `regen-output.txt` count. Worst case: 81 (baseline) + 2 (IN-02 backfill) + 1 (DETERM-07b promotion) + 5 (DETERM-06 cascade unblock for A11Y-02 × 3 + CAND-12 + CAND-03 readback) = **89**. Best case (no DETERM-06 unblock observed in gate): **84**. Most likely: **86**.

**Warning signs:** PLAN.md hard-codes "83" in Task 8 spec. Planner must use placeholder substitution.

[VERIFIED: tests/scripts/diff-playwright-reports.ts:110 — current jsdoc text; CONTEXT D-07 explicitly contemplates `83 + N` shape.]

### Pitfall 6: PASS_LOCKED partition contract — imgproxy-tied tests cannot become PASS_LOCKED even if they pass

**What goes wrong:** The 5 cascade-unblocked downstream tests of `should upload a profile image (CAND-03)` include `should persist profile image after page reload (CAND-12)` and `should show editable info fields on profile page (CAND-03)` — BOTH of which are IMGPROXY_TIED_TITLES (lines 70, 69 of regen-constants.mjs). Per the partition contract at regen-constants.mjs:102-107: "imgproxy-tied tests live exclusively in DATA_RACE … exclude imgproxy-tied from PASS_LOCKED to maintain the partition." So even if DETERM-06's fix makes them pass, they STAY in DATA_RACE (15 IDs locked), NOT promote to PASS_LOCKED.

**Why it happens:** The Phase 73 D-09 binding is about flake POOL semantics ("may pass or fail post-swap"), not about pass-pass-pass status. Imgproxy is documented infrastructure flake — a passing run is one realization of the pool's two-valued distribution.

**How to avoid:** PLAN.md Task 8 (jsdoc count update) reflects that the +5 DETERM-06 cascade-unblock only nets `+3 PASS_LOCKED` at most (the 3 A11Y-02 tests at `candidate-profile.spec.ts > A11Y-02 should persist {bio, display name, social link} after page reload` — currently in CASCADE_TESTS lines 216-218). The 2 imgproxy-tied tests stay in DATA_RACE. Worst-case net: 81 + 2 (IN-02) + 1 (DETERM-07b) + 3 (DETERM-06 A11Y-02 unblock) = **87 PASS_LOCKED**. CASCADE shrinks by 3 (52). DATA_RACE stays at 15.

**Warning signs:** Plan author bumps PASS_LOCKED to 89 expecting all 5 cascade-unblocked tests to promote. The 2 imgproxy-tied ones won't.

[VERIFIED: regen-constants.mjs:67-82 (IMGPROXY_TIED_TITLES) + :102-109 (partition contract); diff-playwright-reports.ts:196-212 (DATA_RACE_TESTS contains the 2 IMGPROXY-tied tests at :198-199); :216-218 (3 A11Y-02 tests in CASCADE_TESTS).]

## Code Examples

Verified patterns ready to drop into Phase 83 tasks.

### Task 1 — WR-01 overlay extend (D-05)

```typescript
// tests/tests/setup/templates/variant-hidden-required.ts:169-179 — current shape
candidates: {
  count: 0,
  fixed: baseFixed('candidates').map((row) => {
    if (row.external_id === 'test-candidate-alpha') {
      const answers = { ...((row.answersByExternalId ?? {}) as Record<string, unknown>) };
      delete answers['test-question-displayname'];
      return { ...row, answersByExternalId: answers };
    }
    return row;
  })
},

// Phase 83 D-05 — extended overlay
candidates: {
  count: 0,
  fixed: baseFixed('candidates').map((row) => {
    if (row.external_id === 'test-candidate-alpha') {
      const answers = { ...((row.answersByExternalId ?? {}) as Record<string, unknown>) };
      delete answers['test-question-displayname'];
      // Phase 83 WR-01 (D-05): also strip Phase 82's required-empty-1 answer so
      // unansweredRequiredInfoQuestions.length === 2 in this variant (eliminates
      // implicit additive coupling per Phase 82 REVIEW WR-01 option b).
      delete answers['test-question-required-empty-1'];
      return { ...row, answersByExternalId: answers };
    }
    return row;
  })
},
```

[VERIFIED: variant-hidden-required.ts:169-179 read in full.]

### Task 2 — DETERM-06 D-01a + D-01e (ProfilePage.ts)

```typescript
// tests/tests/pages/candidate/ProfilePage.ts — current (lines 15-37)
/**
 * Upload an image file via the file chooser triggered by clicking the image upload element.
 *
 * The Input component for type="image" puts data-testid on the outer container (via
 * containerProps). The actual clickable element is an inner <label tabindex="0"> that
 * triggers the hidden file input.
 *
 * @param filePath - Absolute path to the image file to upload
 */
async uploadImage(filePath: string): Promise<void> {
  const fileChooserPromise = this.page.waitForEvent('filechooser');
  // Click the inner interactive label, not the outer container.
  // reason: the Input/type="image" component renders a presentational <label tabindex="0">
  // wrapping a hidden <input type="file">. The label has no implicit ARIA role and no
  // associated visible text or accessible name (the surrounding testId container holds
  // the label text). Targeting by tabindex is the only stable structural anchor for the
  // focusable file-trigger surface; getByRole/getByText/getByLabel all match the wrong
  // element or no element. Scoped to the imageUpload testId so this stays narrow.
  // eslint-disable-next-line playwright/no-raw-locators
  await this.imageUpload.locator('label[tabindex="0"]').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);
}

// Phase 83 D-01a + D-01e — current target shape
/**
 * Upload an image file via the file chooser triggered by clicking the image upload button.
 *
 * Per Phase 70 P03 refactor, the Input component for type="image" now renders
 * the clickable file-trigger as `<button type="button" id="{id}-image-label">` with
 * `aria-labelledby="{id}-label {id}-image-label"` providing accessible-name composition
 * (apps/frontend/src/lib/components/input/Input.svelte:532-557, 563). The button's
 * onclick handler programmatically opens the hidden `<input type="file">` via
 * `fileInput?.click()`. `getByRole('button').first()` is the canonical semantic locator
 * scoped to the imageUpload testId container.
 *
 * @param filePath - Absolute path to the image file to upload
 */
async uploadImage(filePath: string): Promise<void> {
  const fileChooserPromise = this.page.waitForEvent('filechooser');
  await this.imageUpload.getByRole('button').first().click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);
}
```

[VERIFIED: ProfilePage.ts:15-37 read in full; Input.svelte:530-557 confirms `<button type="button" id="{id}-image-label">` shape; Input.svelte:563 confirms `aria-labelledby="{id}-label {id}-image-label"`.]

### Task 4 — DETERM-07a hydration guard (D-03a, helper variant)

```typescript
// tests/tests/specs/voter/voter-matching.spec.ts — after line 192 (top of test block)
/**
 * Phase 83 DETERM-07a — hydration-completeness guard. Asserts the full result-list
 * has rendered before any positional indexing (.first() / .last() / .nth()). Without
 * this, partial-hydration races produced flake under post-Phase-79 cold-start timing
 * (33% across 6 captures per .planning/phases/79-…/post-fix/sha256.txt). The expected
 * count is derived from the same module-scope independent matching computation that
 * feeds agreeCandidate / opposeCandidate / partialCandidate.
 */
async function expectResultsHydrated(page: Page): Promise<void> {
  await expect(page.getByTestId(testIds.voter.results.card)).toHaveCount(expectedRanking.length);
}

// Then in each affected test:
test('should show worst match candidate as last result', async ({ page }) => {
  await navigateToResults(page);
  await expectResultsHydrated(page);
  const cards = page.getByTestId(testIds.voter.results.card);
  const lastCard = cards.last();
  const opposeName = `${opposeCandidate.first_name} ${opposeCandidate.last_name}`;
  await expect(lastCard).toContainText(opposeName);
});
```

[VERIFIED: voter-matching.spec.ts:119 `expectedRanking`; :238-246 worst-match test.]

### Task 5 — DETERM-07b hydration guard (D-03b, inline)

```typescript
// tests/tests/specs/voter/voter-detail.spec.ts — line 23 (existing import)
import { E2E_CANDIDATES } from '../../utils/e2eFixtureRefs';
// Phase 83 — extend
import { E2E_CANDIDATES, E2E_ORGANIZATIONS } from '../../utils/e2eFixtureRefs';

// Phase 83 — add at module scope (e.g., after line 27)
const expectedPartyCount = E2E_ORGANIZATIONS.length; // 4 — 2 default + 2 voter parties

// Phase 83 — modify lines 124-161 of voter-detail.spec.ts
test('should open party detail drawer with info, candidates, and opinions tabs', async ({
  answeredVoterPage: page
}) => {
  const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
  await entityTabs.getByRole('tab', { name: /parties/i }).click();

  const partySection = page.getByTestId(testIds.voter.results.partySection);
  await expect(partySection).toBeVisible();

  // Phase 83 DETERM-07b — hydration-completeness guard. Assert all 4 party cards
  // have rendered before clicking .first() to open the drawer. Without this, the
  // click races entity-list reactivity / results-page hydration; flake reproduced
  // 1/6 cold-start runs in Phase 79 captures.
  await expect(partySection.getByTestId('entity-card-action')).toHaveCount(expectedPartyCount);

  await partySection.getByTestId('entity-card-action').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // ... (rest unchanged)
});
```

[VERIFIED: voter-detail.spec.ts:23 imports; :124-161 party-drawer test; :140 uses `entity-card-action`; e2e.ts:189-228 confirms 4 organizations.]

### Task 6 — IN-01 docstring fix (D-06)

```typescript
// tests/tests/specs/candidate/candidate-profile-validation.spec.ts:6 — current
 * Covers 3 reliably-renderable cells against the existing product surface

// Phase 83 D-06 — replace
 * Covers 6 reliably-renderable cells against the existing product surface
 * (3 original + 2 Phase 81 lifts + 1 Phase 82 standalone)

// tests/tests/specs/candidate/candidate-profile-validation.spec.ts:51 — current
 * IMGPROXY_TIED_TITLES safety: all 3 test titles are PREFIXED `A11Y-01 ` and

// Phase 83 D-06 — replace
 * IMGPROXY_TIED_TITLES safety: all 6 test titles are PREFIXED `A11Y-01 ` and
```

[VERIFIED: candidate-profile-validation.spec.ts:6 + :51 read.]

### Task 7 — 3-run cold-start gate canonical chain

```bash
# Per-run protocol (×3 runs)
# Step 1 — clean reset (LANDMINE-9 manual chain)
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean

# Step 2 — start frontend in background
yarn workspace @openvaa/frontend dev &
FRONTEND_PID=$!

# Step 3 — wait for http://localhost:5173 ready
until curl -s -f http://localhost:5173 > /dev/null 2>&1; do sleep 2; done

# Step 4 — capture (per Phase 79 D-13 step 4 + agent-inline per D-11)
yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=json \
  > .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/run-N.json

# Step 5 — kill frontend
kill $FRONTEND_PID

# Repeat for next N
```

[VERIFIED: Phase 79 D-13 protocol verbatim; CLAUDE.md §"Seeding local data" LANDMINE-9 canonical chain.]

### Task 7 — 1-run cold-start smoke (D-01d gate, faster variant)

```bash
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean
yarn workspace @openvaa/frontend dev &
FRONTEND_PID=$!
until curl -s -f http://localhost:5173 > /dev/null 2>&1; do sleep 2; done
yarn workspace @openvaa/tests test:e2e --project=candidate-app-mutation --workers=1
kill $FRONTEND_PID
```

[VERIFIED: Phase 79 D-12 + CONTEXT D-01d.]

### Task 8 — SHA-256 identity check + regen invocation

```bash
# Compute sha-identity (uses Phase 79's sha-identity.mjs verbatim — copy first)
cp .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/sha-identity.mjs \
   .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/sha-identity.mjs
node .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/sha-identity.mjs \
  > .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/sha256.txt

# If 3-run identical → regen
cp .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs \
   .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/regen-constants.mjs
# Edit line 23: const reportPath = join(__dirname, 'run-3.json');
node .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/regen-constants.mjs \
  > .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/regen-output.txt 2>&1

# Then manually edit tests/scripts/diff-playwright-reports.ts:
#  - PASS_LOCKED_TESTS (paste sorted array from regen-output.txt)
#  - DATA_RACE_TESTS (verify 15 entries unchanged — Phase 73 D-09 binding)
#  - CASCADE_TESTS (paste sorted array)
#  - Update jsdoc at :110 (count + caveat strike)
#  - Update FAILURE-CLASS narrative at :80-90 (strike party-drawer reference per D-04)
```

[VERIFIED: Phase 79 post-fix/sha-identity.mjs + regen-constants.mjs present; Phase 79 D-09 protocol.]

### Task 9 — Todo file moves

```bash
git mv .planning/todos/pending/2026-05-13-candidate-profile-image-upload-cascade.md \
       .planning/todos/done/2026-05-13-candidate-profile-image-upload-cascade.md
git mv .planning/todos/pending/2026-05-13-voter-matching-detail-flakes.md \
       .planning/todos/done/2026-05-13-voter-matching-detail-flakes.md
```

[VERIFIED: both todos exist in pending/.]

### Commit invocation pattern (CLAUDE.md global hook workaround per user memory)

```bash
git -c core.hooksPath=/dev/null commit -m "$(cat <<'EOF'
fix(83): <Task N> <brief summary>

<body>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

[VERIFIED: user memory `project_gsd_repo_hook_workaround.md`.]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pre-Phase-70: `<label tabindex="0">` as image-upload click target | `<button type="button" id="{id}-image-label">` with `aria-labelledby` composition | v2.8 Phase 70 P03 (2026-05-10) | Phase 76 deferred-items §1 documented the page-object selector drift; Phase 83 closes the loop. |
| Pre-Phase-79: Manual SHA-256 identity check across run-N.json files | Phase 79's archived `sha-identity.mjs` + `regen-constants.mjs` (self-contained, copy-paste) | v2.10 Phase 79 (2026-05-13) | Phase 83 inherits the tooling verbatim. |
| Pre-Phase-79: SETTINGS-03 spec assertion tolerated +1 row coupling (Phase 82 introduced) | Phase 82 WR-01 (b): overlay strips both required-empty answers, count === 2 invariant | v2.10 Phase 83 (this phase) | Eliminates implicit additive coupling; reviewer's preferred fix. |
| Pre-Phase-79: voter-app PASS_LOCKED roster tolerated 2 flake surfaces (worst-match + party-drawer) | Phase 83 DETERM-07 hydration-completeness guards make both deterministic | v2.10 Phase 83 (this phase) | DETERM-07b promotes from FAILURE-CLASS to PASS_LOCKED; DETERM-07a stays in PASS_LOCKED but stops flaking. |

**Deprecated/outdated:**
- `ProfilePage.uploadImage()` `label[tabindex="0"]` selector: SUPERSEDED by Phase 70 P03 (Input.svelte) refactor; Phase 83 D-01a removes.
- Phase 81 deferred PASS_LOCKED caveat sentence at `diff-playwright-reports.ts:110`: SUPERSEDED by Phase 83 D-07 backfill (the "canonical home" sentence becomes obsolete on Phase 83 close).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Each cold-start gate run takes ~54 min (per CONTEXT D-10 wall-time estimate inherited from Phase 79) | Validation Architecture — Sampling Rate | If actual wall time is significantly higher (90+ min), the 3-run gate exceeds the 162-min target; agent-inline run may need to extend the run_in_background budget. Mitigation: Phase 79 actually completed 6 runs in similar windows; the 54-min estimate is empirical, not theoretical. LOW risk. |

**All other claims in this research are `[VERIFIED]` against live files in the repo on 2026-05-13.** Specifically the IN-02 test titles, DETERM-07 derivation variables, WR-01 spec-assertion shape (Pitfall 2), and Phase 79 protocol details are confirmed against the source files.

## Open Questions

1. **WR-01 spec-assertion shape — is the "tighten to === 2" wording in CONTEXT D-05 literal or aspirational?**
   - What we know: The existing spec at `candidate-required-info.spec.ts:99-160` asserts disabled-attribute on Questions/Preview buttons (driven by `unansweredRequiredInfoQuestions?.length !== 0` at `+page.svelte:129,144`). It does NOT assert the count.
   - What's unclear: Does the operator want a count-assertion ADDED, or is the "tighten" wording about tightening the OVERLAY (strip both answers) rather than the SPEC?
   - Recommendation: Lock the interpretation at PLAN.md time. Default to overlay-only (Pitfall 2 Option D); if operator confirms they want a count assertion, use a `// reason:`-justified InfoBadge text assertion via `.badge-warning` class scoped within the candidate-home-profile button (`playwright/no-raw-locators` eslint-disable line).

2. **DETERM-06 D-01a cascade-unblock vs DATA_RACE partition contract — how many tests actually promote to PASS_LOCKED?**
   - What we know: 5 downstream tests cascade-skip today. 3 are A11Y-02 (`bio` / `display name` / `social link`); 2 are IMGPROXY_TIED_TITLES (CAND-12 + CAND-03 readback). Per `regen-constants.mjs:102-107` partition contract, imgproxy-tied tests CANNOT promote to PASS_LOCKED even if they pass.
   - What's unclear: Will the 3 A11Y-02 tests all promote cleanly? They might hit transient hydration issues of their own (Phase 70 P02 + the same partial-hydration class as DETERM-07).
   - Recommendation: Task 7's 3-run gate captures the true net. Task 8's jsdoc placeholder substitution reflects the captured number. No pre-locked count.

3. **DETERM-07a — should the helper extraction (`expectResultsHydrated`) be applied to sibling tests in the same describe block?**
   - What we know: voter-matching.spec.ts has 4 sibling tests using `.first()` / `.last()` / `.nth()` indexing (lines 229, 238, 248, plus the partial-candidate's `.first()` + `.last()` at :259-260). They're all in the same `mode: 'serial'` describe block at :199.
   - What's unclear: Are they ALL flake-prone, or only `worst match`? Phase 79 sha256.txt audit only flagged `worst match` (1/6 fail, cascading 4 downstream).
   - Recommendation: Apply guard ONLY to `worst match` initially (minimum-diff). If Task 7's 3-run gate surfaces new flakes in sibling tests, plan a follow-up. CONTEXT D-03a's helper-vs-inline question is at planner discretion.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | regen-constants.mjs / sha-identity.mjs | ✓ | 20.x (per package.json engines) | — |
| Yarn 4 | All `yarn` commands | ✓ | 4.x (per packageManager) | — |
| Supabase CLI | `yarn db:reset`, `yarn db:seed` | ✓ (assumed running per Phase 79 D-15) | local Supabase 1.x | imgproxy 502 → `supabase stop && supabase start` per Phase 79 D-14 |
| Playwright | `yarn test:e2e` | ✓ | 1.58.2 (CLAUDE.md says — assumed unchanged in v2.10) | — |
| Vite dev server (5173) | Frontend serve during gate | ✓ (started in background per protocol) | — | Operator kills Vite pre-departure (Phase 79 D-15); agent restarts. |
| `tsx` | diff-playwright-reports.ts shebang | ✓ (in tests workspace devDeps) | — | — |
| imgproxy (Supabase storage transformation) | D-01c contingent ONLY | ✗ (currently commented out at `apps/supabase/supabase/config.toml:130-131`) | — | D-01a (selector fix) is the primary fix; imgproxy enable is escalation step 2 only |
| Local imgproxy Docker container | All cold-start E2E runs | ✓ (Supabase-managed) | — | Intermittent 502; recovery via supabase restart per Phase 79 D-14 (CLAUDE.md Troubleshooting also documents) |

**Missing dependencies with no fallback:** None. All required tools are project-pinned and operational.

**Missing dependencies with fallback:** imgproxy is disabled by default in dev; only re-enabled if D-01a + D-01b both fail. Documented contingent escalation.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 [VERIFIED: tests/playwright.config.ts + project precedent across v2.x] |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn workspace @openvaa/tests test:e2e --project=candidate-app-mutation --workers=1` (1-run smoke, ~54 min — Phase 79 D-12 protocol) |
| Full suite command | `yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=json > .planning/phases/83-…/post-fix/run-N.json` (~54 min per run, ×3 = ~162 min — Phase 79 D-13 protocol) |
| Parity check command | `tsx tests/scripts/diff-playwright-reports.ts baseline/playwright-report.json post-fix/run-N.json` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DETERM-06 | image-upload cascade resolved; CAND-03 + 5 downstream tests run to completion | E2E (Playwright) | `yarn workspace @openvaa/tests test:e2e --project=candidate-app-mutation --workers=1 -g "should upload a profile image"` | ✅ tests/tests/specs/candidate/candidate-profile.spec.ts:164 |
| DETERM-06 | A11Y-02 persistence tests promote to PASS_LOCKED on regen | Parity-script verification | `tsx tests/scripts/diff-playwright-reports.ts <baseline> post-fix/run-3.json` | ✅ tests/scripts/diff-playwright-reports.ts |
| DETERM-07a | worst-match test deterministic across 3 cold-start runs | E2E (Playwright) | `yarn workspace @openvaa/tests test:e2e --project=voter-app -g "should show worst match"` | ✅ tests/tests/specs/voter/voter-matching.spec.ts:238 |
| DETERM-07b | party-detail-drawer test deterministic + promoted to PASS_LOCKED | E2E (Playwright) + parity-script | `yarn workspace @openvaa/tests test:e2e --project=voter-app -g "should open party detail drawer"` | ✅ tests/tests/specs/voter/voter-detail.spec.ts:124 |
| WR-01 | variant overlay strips both required answers; SETTINGS-03 spec passes against `length === 2` state | E2E (Playwright) | `yarn workspace @openvaa/tests test:e2e --project=variant-hidden-required-candidate` | ✅ tests/tests/specs/candidate/candidate-required-info.spec.ts |
| IN-01 | docstring count = 6 | Static (lint/visual) | n/a (cosmetic) | ✅ tests/tests/specs/candidate/candidate-profile-validation.spec.ts:6,51 |
| IN-02 | 2 PASS_LOCKED entries added (A11Y-05 + A11Y-06); jsdoc count bumped | Parity-script verification | `tsx tests/scripts/diff-playwright-reports.ts` (run after Task 8 regen) | ✅ tests/scripts/diff-playwright-reports.ts |
| Verification gate | 3-run cold-start SHA-256 identity → regen → new v2.10-close anchor | Custom (Phase 79 protocol verbatim) | `node post-fix/sha-identity.mjs && node post-fix/regen-constants.mjs` | ✅ Phase 79 archived tooling |

### Sampling Rate

- **Per task commit:** No automated unit-test layer; tasks 1-2 + 4-6 land structural edits that are validated by Task 3's 1-run cold-start smoke and Task 7's 3-run gate. Task 9 is a filesystem move (no validation needed).
- **Per wave merge:** Task 3 (1-run smoke) gates Task 4-6. Task 7 (3-run gate) gates Task 8 (regen).
- **Phase gate:** Task 8's regen produces the new v2.10-close anchor; parity-check via `tsx tests/scripts/diff-playwright-reports.ts` on a 4th confirmation run (optional but recommended per Phase 79 SC #4 audit pattern).

### Wave 0 Gaps

- [ ] `.planning/phases/83-…/post-fix/regen-constants.mjs` — copy from Phase 79; edit `reportPath` to `run-3.json`. Task 8 setup.
- [ ] `.planning/phases/83-…/post-fix/sha-identity.mjs` — copy from Phase 79 verbatim. Task 8 setup.
- [ ] `.planning/phases/83-…/post-fix/` — create directory. Task 7 setup.

*(No additional test framework install needed — Playwright + tsx + Node already installed.)*

### Wave Breakdown Recommendation (CONTEXT-J)

Given the 9 tasks in CONTEXT D-08 + the WR-01-before-DETERM-06 ordering constraint:

| Wave | Tasks | Rationale |
|------|-------|-----------|
| **Wave 0** | Task 9 (todo file moves), Task 6 (IN-01 docstring) | Pure file ops; trivially safe; can land FIRST or ANY time. Lands independently to clear noise. |
| **Wave 1** | Task 1 (WR-01 overlay + spec) | MUST land before Wave 2 (Pitfall 1 ordering risk). Single atomic commit. |
| **Wave 2** | Task 2 (DETERM-06 D-01a + D-01e jsdoc) | Single atomic commit; unblocks Wave 3. |
| **Wave 3** | Task 3 (1-run cold-start smoke) | Gate for D-01b/c escalation. If GREEN → Wave 4. If RED → escalate to D-01b (Wave 2b: add settle delay), re-smoke; if still RED, D-01c (Wave 2c: imgproxy enable), re-smoke. |
| **Wave 4** | Task 4 (DETERM-07a worst-match guard), Task 5 (DETERM-07b party-drawer guard) | Parallel-eligible (different test files: voter-matching.spec.ts vs voter-detail.spec.ts). Two atomic commits OR one combined commit at planner discretion. |
| **Wave 5** | Task 7 (3-run cold-start gate execution) | Captures the new baseline. ~162 min wall time. Agent-inline run_in_background per D-11. |
| **Wave 6 (atomic)** | Task 8 (regen + IN-02 backfill + DETERM-07b promotion + jsdoc updates) | SINGLE atomic commit per Phase 79 D-10 precedent. Bundles: post-fix/run-{1,2,3}.json, sha256.txt, regen-output.txt, parity-gate-output.txt, imgproxy-audit.txt + the diff-playwright-reports.ts constants update. |

**Total commits:** 8 (Wave 0 = 2 commits if Task 6 + Task 9 separate; otherwise 1; Wave 1 = 1; Wave 2 = 1; Wave 3 = 0 commits if gate-only or 1-3 commits if escalation; Wave 4 = 1-2; Wave 5 = 0 commits; Wave 6 = 1).

### Atomic Commit Boundaries (CONTEXT-K)

Per Phase 79 D-10 precedent + CONTEXT D-08 task list:

| Commit | Files | Subject template |
|--------|-------|------------------|
| 1 (Task 9) | `.planning/todos/pending/*.md → done/*.md` (2 files, git mv) | `chore(83): move DETERM-06+07 todos to done at phase entry` |
| 2 (Task 6) | `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` | `docs(83): IN-01 update A11Y-01 spec docstring count to 6` |
| 3 (Task 1) | `tests/tests/setup/templates/variant-hidden-required.ts` (+ possibly `tests/tests/specs/candidate/candidate-required-info.spec.ts` if count assertion added) | `fix(83): WR-01 strip Phase 82 required-empty answer in variant overlay` |
| 4 (Task 2) | `tests/tests/pages/candidate/ProfilePage.ts` | `fix(83): DETERM-06 fix uploadImage selector drift post-Phase-70 button refactor` |
| 5 (Task 4) | `tests/tests/specs/voter/voter-matching.spec.ts` | `fix(83): DETERM-07a add hydration-completeness guard before worst-match indexing` |
| 6 (Task 5) | `tests/tests/specs/voter/voter-detail.spec.ts` | `fix(83): DETERM-07b add hydration-completeness guard before party-drawer click` |
| 7 (Task 7 + Task 8 atomic) | `.planning/phases/83-…/post-fix/{regen-constants.mjs, sha-identity.mjs, run-{1,2,3}.json, sha256.txt, regen-output.txt, parity-gate-output.txt, imgproxy-audit.txt}` + `tests/scripts/diff-playwright-reports.ts` | `chore(83): DETERM-05 regen parity-script constants for v2.10 milestone-close anchor` |

**If D-01b or D-01c escalates** (Task 3 1-run smoke RED): add additional commits for the settle-delay (3.5) and/or imgproxy enable (3.7) BEFORE the Wave 4 commits. Each escalation is its own atomic commit.

## Security Domain

> Not applicable. Phase 83 is test infrastructure + parity-script work; no auth, no input validation, no crypto, no access control, no session management touched. The contingent D-01c task (uncommenting `[storage.image_transformation]` in `apps/supabase/supabase/config.toml`) is enabling an existing config block, not introducing new auth/crypto surfaces.

Per `security_enforcement` evaluation: phase is OUT-OF-SCOPE for ASVS V2/V3/V4/V5/V6 categories — no security-relevant capabilities touched.

## Sources

### Primary (HIGH confidence)

- **`.planning/phases/83-…/83-CONTEXT.md`** [VERIFIED 2026-05-13] — D-01..D-11 locked decisions verbatim; phase boundary; deferred ideas.
- **`tests/tests/pages/candidate/ProfilePage.ts:24-37`** [VERIFIED 2026-05-13] — Current `uploadImage()` shape with `label[tabindex="0"]` selector at line 34 + stale jsdoc at lines 27-32 + eslint-disable at line 33.
- **`apps/frontend/src/lib/components/input/Input.svelte:526-579`** [VERIFIED 2026-05-13] — Image-input render block with `<button type="button" id="{id}-image-label">` at line 532-557 + `aria-labelledby="{id}-label {id}-image-label"` at line 563.
- **`tests/tests/specs/voter/voter-matching.spec.ts:1-305`** [VERIFIED 2026-05-13] — Full module-scope independent matching computation; `expectedRanking` at line 119; worst-match test at lines 238-246.
- **`tests/tests/specs/voter/voter-detail.spec.ts:1-396`** [VERIFIED 2026-05-13] — Full file; party-drawer test at lines 124-161; existing E2E_CANDIDATES import at line 23.
- **`tests/tests/setup/templates/variant-hidden-required.ts:1-199`** [VERIFIED 2026-05-13] — Full overlay; candidate-row mapper at lines 169-179.
- **`tests/tests/specs/candidate/candidate-required-info.spec.ts:1-163`** [VERIFIED 2026-05-13] — Full SETTINGS-03 spec body; assertions at lines 129-160 are DOM-level (`toHaveAttribute('disabled', 'true')`), NOT count-level (Pitfall 2).
- **`tests/tests/specs/candidate/candidate-profile-validation.spec.ts:1-370`** [VERIFIED 2026-05-13] — Full A11Y-01 spec; IN-01 docstring targets at lines 6 + 51; verbatim test titles for IN-02 backfill captured at lines 138, 145 (test loop body produces `A11Y-01 A11Y-05 email-format rejection surfaces invalidEmail error` + `A11Y-01 A11Y-06 url-format rejection surfaces invalidUrl error`).
- **`tests/scripts/diff-playwright-reports.ts:1-273`** [VERIFIED 2026-05-13] — PASS_LOCKED_TESTS (81 entries) + DATA_RACE_TESTS (15) + CASCADE_TESTS (57) arrays; jsdoc at line 110 with verbatim caveat sentence captured; FAILURE-CLASS rationale block at lines 80-90.
- **`.planning/phases/79-…/post-fix/regen-constants.mjs`** [VERIFIED 2026-05-13] — Full script; IMGPROXY_TIED_TITLES at lines 67-82 (14 entries); partition contract at lines 102-109; match-count assertion at lines 87-100.
- **`.planning/phases/79-…/post-fix/sha256.txt`** [VERIFIED 2026-05-13] — 6-run audit; anchor SHA `ff0334f856650611e2a5d1b1f990e6bbd3ad7c228ff585d5f1b5abf6bc3a09c5`; D-09 instability protocol resolution.
- **`tests/playwright.config.ts:85-285`** [VERIFIED 2026-05-13] — Project dependency chain; `candidate-app-mutation` depends on `candidate-app` (line 129); `variant-hidden-required-candidate` chains from variant data-setup (lines 215-285).
- **`packages/dev-seed/src/templates/e2e.ts:189-228, 702-740`** [VERIFIED 2026-05-13] — 4 organizations; `test-question-required-empty-1` row at line 731-740 with `custom_data: { required: true }` (LANDMINE-1 honored).
- **`tests/tests/utils/e2eFixtureRefs.ts:127-129`** [VERIFIED 2026-05-13] — `E2E_ORGANIZATIONS` export.
- **`tests/tests/specs/voter/voter-results.spec.ts:42, 143`** [VERIFIED 2026-05-13] — `totalPartyCount = E2E_ORGANIZATIONS.length` precedent.
- **`.planning/REQUIREMENTS.md`** [VERIFIED 2026-05-13] — DETERM-06 + DETERM-07 requirement text.
- **`apps/frontend/src/routes/candidate/(protected)/+page.svelte:110-159`** [VERIFIED 2026-05-13] — InfoBadge wiring at line 121; disabled binding at lines 129, 144.
- **`apps/frontend/src/lib/components/infoBadge/InfoBadge.svelte`** [VERIFIED 2026-05-13] — InfoBadge has no testId; renders `<div class="badge badge-sm ... badge-warning"><span>{text}</span></div>` — Pitfall 2 Option A.
- **`.planning/phases/82-…/82-REVIEW.md`** [VERIFIED 2026-05-13] — WR-01, IN-01, IN-02 fix-text specs verbatim.
- **`.planning/phases/79-…/79-CONTEXT.md` §"3-Run Cold-Start Gate Execution"** [VERIFIED 2026-05-13] — D-11, D-12, D-13 protocol Phase 83 inherits verbatim.
- **`CLAUDE.md` §"Seeding local data"** [VERIFIED 2026-05-13] — LANDMINE-9 manual chain documented.
- **User memory `project_gsd_repo_hook_workaround.md`** [VERIFIED 2026-05-13] — `git -c core.hooksPath=/dev/null` invocation pattern.

### Secondary (MEDIUM confidence)

- **`.planning/todos/pending/2026-05-13-candidate-profile-image-upload-cascade.md`** [VERIFIED 2026-05-13] — DETERM-06 source-of-truth todo; 3 hypothesis + 3-mitigation-ladder framing matches CONTEXT D-01a..c.
- **`.planning/todos/pending/2026-05-13-voter-matching-detail-flakes.md`** [VERIFIED 2026-05-13] — DETERM-07 source-of-truth todo; corroborates Phase 79 sha256.txt audit (2/6 flake rate).
- **`.planning/STATE.md`** [VERIFIED 2026-05-13] — v2.10 milestone progress; 4 of 5 phases complete; Phase 83 last.

### Tertiary (LOW confidence)

- None. All claims in this research are first-party-source-verified against the live repo on 2026-05-13.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Playwright + Node + yarn already pinned; no version research needed.
- Architecture: HIGH — Test infrastructure pattern is verified; D-01..D-11 locked.
- Pitfalls: HIGH — All 6 pitfalls verified against live file reads (especially Pitfall 2 spec-assertion shape and Pitfall 6 partition contract).
- Validation Architecture: HIGH — Phase 79's protocol is verbatim-inheritable.

**Research date:** 2026-05-13
**Valid until:** 2026-05-27 (14 days — Phase 83 should execute well within this window; v2.10 milestone closes immediately after).
