# Phase 101: Suite Re-enable + Milestone-Close Green Gate - Research

**Researched:** 2026-06-05
**Domain:** E2E/unit test suite re-enablement + determinism gate (Playwright + Vitest), milestone-close green gate
**Confidence:** HIGH for workstreams A & B (exact files/lines verified on disk); MEDIUM for workstream C (color-contrast is a *contingent* gate, not a confirmed failure)

> **Provenance note on this document:** The orchestrator's recovery prompt stated a prior ~51-tool-call investigation existed in context. It did NOT survive the connection drop. This RESEARCH.md was produced from a fresh, on-disk investigation conducted 2026-06-05 (all `[VERIFIED: …]` tags below cite files/lines read in this session). No findings were carried forward from the lost session; nothing here is fabricated to fill that gap.

## Summary

Phase 101 is the v2.11 milestone-close green gate. Its sole locked requirement is **SUITE-01**: un-quarantine the 2 `perm-per-app-notifications` E2E tests and prove the full E2E + unit suites green with no regression vs the v2.10 ship baseline (82 passed / 2 skipped). The target after un-quarantine is **84 passed / 0 skipped** (v2.10 +2).

The quarantine is **narrow and surgical**: the two test bodies are intact, and the Playwright *project wiring* (data-setup → spec → teardown) for `perm-per-app-notifications` is fully present and uncommented in `tests/playwright.config.ts`. The ONLY quarantine marker is a single `test.describe.skip(...)` at `tests/tests/specs/perm/perm-per-app-notifications.spec.ts:27`, guarded by an `eslint-disable-next-line playwright/no-skipped-test` (line 26) and a TODO/`// reason:` block (lines 18–25). Re-enabling is a one-line edit (`test.describe.skip` → `test.describe`) plus removal of the now-dead skip-related comments and the eslint-disable.

The 3× determinism run (decision D-01) is required because the milestone churned the Svelte 5 context/reactivity layer broadly. The user's discretion (per CONTEXT.md) permits a *targeted* 3× run of the perm tests + context-touched specs, plus a single full pass — rather than 3× of the entire suite. The two perm tests assert notification-popup cross-route isolation, which is exactly the popup-lifecycle surface the migration reworked, so they are the highest residual-flake risk (D-02: investigate + fix in-phase).

The third workstream named in the recovery prompt — **a11y color-contrast remediation** — is **not an independently-scoped deliverable in CONTEXT.md or REQUIREMENTS.md**. It is a *contingent* sub-case of "full suite green": the `a11y-smoke` spec enforces a global axe **0-violation** gate using the full WCAG 2.1 AA tag set, which includes the `color-contrast` rule. IF the runes/View-Transition migration changed any rendered color (e.g. a theme-token application path, an opacity/overlay layer, a `$state`-driven class), the global gate could newly fail on `color-contrast`. This research documents the remediation path (offending-selector → component → theme token → ≥4.5:1 hex) so the planner is *ready* if the 3× run surfaces it — but treats it as a conditional branch, not a confirmed task.

**Primary recommendation:** Plan three sequenced waves — (A) un-quarantine the perm spec (1-line + comment cleanup), (B) run the 3× determinism gate (targeted perm + context-touched specs ×3 + one full E2E pass + full unit pass), (C) a *contingent* color-contrast remediation branch that only activates if the global axe gate reports `color-contrast` violations. End by pairing with `/gsd-complete-milestone`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Un-quarantine perm spec | Test code (`tests/tests/specs/perm/`) | Playwright config (already wired) | Quarantine lives only in spec `describe.skip`; project graph is intact |
| Notification cross-route isolation under test | Frontend (notification/popup lifecycle, runes-migrated) | Test fixtures (voter/views) | Migration reworked popup management; tests assert its output |
| 3× determinism gate | Test runner (Playwright project graph + Vitest) | CI / local dev stack (`yarn dev` + seed) | Determinism is a runner+infra property, not app code |
| Color-contrast (contingent) | Theme tokens (`packages/app-shared/.../staticSettings.ts`) | Component styling + DaisyUI theme mapping | Contrast is decided by token hex values applied through DaisyUI |
| Milestone close | Planning docs / `/gsd-complete-milestone` | — | Out of suite, sequenced after green |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUITE-01 | The 2 quarantined `perm-per-app-notifications` E2E tests are re-enabled (quarantine was explicitly gated on this migration), and the full E2E + unit suites are green with no behavior regression vs the v2.10 ship baseline. | Workstream A (exact un-quarantine edit), Workstream B (3× determinism mechanics + exact suite commands), Workstream C (contingent color-contrast remediation if the global axe gate regresses) |
</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (101-1):** Require a **3× determinism run** of the full suite before declaring the gate green — the milestone churned the context layer broadly, so single-run green is insufficient.
- **D-02 (101-2):** If a re-enabled `perm` test is still flaky, **investigate + fix in-phase** (the migration was the gating reason; treat residual flake as a real finding). Re-deferral is only acceptable if root cause is conclusively unrelated to the migration.
- **D-03 (101-3 + DX-4):** Baseline = the **v2.10 close baseline as-is** (82 passed / 2 skipped) — no fresh pre-milestone baseline run was taken. Target after un-quarantine = the **2 `perm` tests now PASS, 0 of them skipped** (i.e. v2.10 count **+2** passing → 84 passed / 0 skipped).
- **D-04 (SUITE-01 lock):** Un-quarantine both `perm-per-app-notifications` tests (remove `test.skip`); full E2E + unit suites green, prior PASS_LOCKED tests stay passing. (The perm-teardown auth-user leak that previously blocked re-runs was fixed 2026-06-02.)

### Claude's Discretion
- Whether the 3× determinism run is the **full suite** or a **targeted subset** around the touched surfaces plus a single full pass — as long as the perm tests + context-touched specs get the 3× treatment.

### Deferred Ideas (OUT OF SCOPE)
- (None recorded in CONTEXT.md. Note: "net-new transition choreography beyond cross-fades" is deferred at the *milestone* level per REQUIREMENTS.md, not this phase.)

### Specific Ideas
- This is the milestone-close gate; pair with `/gsd-complete-milestone` afterward.
</user_constraints>

## Project Constraints (from CLAUDE.md)

- **WCAG 2.1 AA compliance is mandatory** — do NOT weaken the a11y axe gate; the `a11y-smoke` spec's per-rule + global 0-violation gates must be PRESERVED. [VERIFIED: CLAUDE.md "Test accessibility"; a11y-smoke.spec.ts:31–32]
- **TypeScript strict** — avoid `any`. [VERIFIED: CLAUDE.md]
- **Localization** — all user-facing strings multi-locale (no impact on this phase's test edits, but relevant if any component string changes during a contrast fix). [VERIFIED: CLAUDE.md]
- **Always check the [Code Review Checklist](/.agents/code-review-checklist.md)** before/after changes. [VERIFIED: CLAUDE.md]
- **Suite commands are canonical:** `yarn test:e2e` (E2E), `yarn test:unit` (unit). [VERIFIED: CLAUDE.md + package.json:24,26]
- **GSD orchestration gotchas (from memory):** worktree commits don't auto-merge; `use_worktrees: false` in config.json so this is N/A here. `state.complete-phase` can corrupt milestone frontmatter; `complete-milestone` leaves phase dirs unarchived. Surface these when pairing with `/gsd-complete-milestone`. [project memory]
- **E2E "did not run" counts as failure** (cascade from upstream dependencies) — relevant: the perm family is a strict sequential chain; an upstream perm setup/spec failure will cascade-skip `perm-per-app-notifications`, which must be treated as a failure, not a pass. [project memory: feedback_e2e_did_not_run]

---

## Workstream A — Perm test un-quarantine

### Exact quarantine location

**File:** `tests/tests/specs/perm/perm-per-app-notifications.spec.ts` (48 lines total) [VERIFIED: read 2026-06-05]

| Line(s) | Content | Action |
|---------|---------|--------|
| 18–25 | `// TODO: re-enable perm-per-app-notifications projects + spec after the Svelte 5 runes migration …` + `// reason: intentional describe-level skip …` | DELETE (the migration is now done; the TODO is satisfied) |
| 26 | `// eslint-disable-next-line playwright/no-skipped-test` | DELETE (no longer skipped, so the disable is dead and would itself be a lint error under `--report-unused-disable-directives` if enabled) |
| 27 | `test.describe.skip('perm-per-app-notifications', () => {` | CHANGE to `test.describe('perm-per-app-notifications', () => {` |
| 28–47 | Two `test(...)` bodies — **intact, do NOT modify** | KEEP |

**Exact edit (skip syntax → enabled):**
```diff
-// TODO: re-enable perm-per-app-notifications projects + spec after the
-// Svelte 5 runes migration. The notification popup tests below are unstable
-// because the popup-management lifecycle (queueing / mount timing / cross-route
-// isolation of voter vs candidate notifications) is still in flux. The test
-// bodies are intact and MUST be re-enabled (back to `test.describe`) + popup
-// management verified end-to-end once the migration completes.
-// reason: intentional describe-level skip pending the runes-migration popup
-// rework; bodies are intact and MUST be re-enabled.
-// eslint-disable-next-line playwright/no-skipped-test
-test.describe.skip('perm-per-app-notifications', () => {
+test.describe('perm-per-app-notifications', () => {
```

### What the two tests assert (so residual flake can be diagnosed per D-02)

[VERIFIED: spec body lines 1–48]
- **Topology** (header comment): 1 election, 1 CG, 1 CO, 2 candidates. Settings override sets `notifications.voterApp` + `notifications.candidateApp` both `show: true` with DISTINCT markers `[notif-voter]` and `[notif-cand]`. Notifications render as `Alert` components with `role="dialog"`.
- **Test 1 `voter route shows voter notification only`** (lines 28–38): `voterHomePage.goToPage('en')`; locate `getByRole('dialog').filter({ hasText: '[notif-voter]' })`; assert visible, contains `[notif-voter]`, NOT `[notif-cand]`.
- **Test 2 `candidate route shows candidate notification only`** (lines 40–47): `page.goto('/en/candidate')`; locate dialog filtered by `[notif-cand]`; assert visible, contains `[notif-cand]`, NOT `[notif-voter]`.
- **Rigidity contract** (header lines 12–13): every assertion is HARD — no `expect.soft`, no try/catch, no `.catch` fallbacks. A residual-flake fix MUST preserve this rigidity (do not soften assertions to make it pass — that violates D-02).

### Playwright project wiring (already present — no config edit needed)

[VERIFIED: `tests/playwright.config.ts` lines 506–526, read 2026-06-05]
The three projects exist and are NOT commented out:
- `data-setup-perm-per-app-notifications` (lines 509–514) — `testMatch: /perm-per-app-notifications\.setup\.ts/`, `teardown: 'data-teardown-perm-per-app-notifications'`, `dependencies: ['perm-disable-candidate-app']`.
- `data-teardown-perm-per-app-notifications` (lines 515–518) — `testMatch: /perm-per-app-notifications\.teardown\.ts/`.
- `perm-per-app-notifications` (lines 519–526) — `testDir: './tests/specs/perm'`, `testMatch: /perm-per-app-notifications\.spec\.ts/`, `fullyParallel: false`, `use: { ...devices['Desktop Chrome'] }`, `dependencies: ['data-setup-perm-per-app-notifications']`.

Because the spec was `describe.skip`, the project still *ran* (and reported 2 skipped tests) — which is why the v2.10 baseline is "82 passed / 2 skipped" rather than "82 passed" with the project absent. Un-skipping the describe converts those 2 skipped → 2 executed.

**Cleanup opportunity (low-priority, planner's call):** the config comments at lines 506–508 say "The spec is currently quarantined (describe.skip). TODO: re-enable … after the Svelte 5 runes migration". After re-enable these become stale; update or remove them.

### Perm family chain position (cascade risk — relevant to D-02 + "did-not-run=fail")

[VERIFIED: config lines 455–545]
The perm-* family is a single strictly-sequential chain (app_settings singleton clobbering forces sequencing). Order around the target:
`… → perm-disable-candidate-app → data-setup-perm-per-app-notifications → perm-per-app-notifications → data-setup-perm-missing-nominations (depends on perm-per-app-notifications) → …`

Implications:
- The first perm setup depends on the journey leaves `[voter-journey, candidate-journey]`, so the whole perm family runs strictly AFTER base + both journeys. Any upstream perm/journey failure cascade-skips `perm-per-app-notifications` → must be scored as a FAILURE per project memory.
- `perm-missing-nominations` `dependencies: ['perm-per-app-notifications']` — if the un-quarantined spec FAILS, it cascade-skips `perm-missing-nominations` too. So a perm-notif regression has blast radius into the next perm link.

### Setup/teardown namespace (auth-leak fix context — D-04)

[VERIFIED: `tests/tests/setup/perm/perm-per-app-notifications.setup.ts`]
- Prefix: `e2e-perm-notif-`. Setup calls `setupFromTemplate('perm-per-app-notifications', { extraTeardownPrefix: ['test-', 'e2e-perm-'] })` — a belt-and-braces pre-clear against cross-chain leakage.
- The previously-blocking perm-teardown auth-user leak was FIXED 2026-06-02 (project memory `project_perm_teardown_leaks_auth_users`): teardowns now unregister invited auth users, removing the "already registered" re-run blocker. This is *why* D-04 is now achievable; if a re-run "already registered" failure reappears, that fix has regressed — a real D-02 finding.

---

## Workstream B — 3× determinism run mechanics

### Canonical suite commands

[VERIFIED: root `package.json` lines 24, 26; CLAUDE.md]
| Suite | Command | Notes |
|-------|---------|-------|
| Full E2E | `yarn test:e2e` | = `playwright test -c ./tests/playwright.config.ts ./tests`. Requires the dev stack running (`yarn dev`) per CLAUDE.md. |
| Full unit | `yarn test:unit` | = `turbo run test:unit` (vitest across all packages + frontend, cached/parallel). |
| Single E2E project | `yarn test:e2e --project=perm-per-app-notifications` | Runs the target spec + its dependency chain (Playwright auto-pulls `dependencies`). |
| Targeted E2E by file | `yarn test:e2e tests/tests/specs/perm/perm-per-app-notifications.spec.ts` | Playwright still resolves project `dependencies` (setup chain runs first). |

> **Pre-flight (per CLAUDE.md "Running tests after changes"):** `yarn db:reset` then `yarn dev`, wait for services healthy, then run E2E. For perm-family determinism, a clean DB between runs reduces cross-run state bleed (perm chains clobber the `app_settings` singleton).

### Which specs are "context-touched" (the 3× targeted subset)

The migration churned the Svelte 5 context/reactivity layer (`voterContext`, `candidateContext`, `appContext`) and the View-Transition / navigation-a11y stack (Domain B, phases 99–100). The specs most coupled to that churn — and therefore the targeted 3× subset under the user's discretion clause — are:

| Spec | Why context-touched | Confidence |
|------|---------------------|-----------|
| `tests/tests/specs/perm/perm-per-app-notifications.spec.ts` | The un-quarantined target; asserts notification-popup lifecycle reworked by the migration. **Mandatory 3×.** | HIGH [VERIFIED: spec header] |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | Exercises the navigation-a11y stack (`#route-announcer`, focus-on-nav, `?notr=1` transition disable) AND the global axe gate (incl. color-contrast). Directly tests Domain-B migration output. | HIGH [VERIFIED: spec lines 201–345] |
| Voter-journey specs under `tests/tests/specs/voter/` (consumed via `voter-journey.fixture` / `voter/views`) | Drive the runes-migrated voter context (`selectedElections`, `opinionQuestions`, `selectedQuestionBlocks` reactive accessors per CLAUDE.md destructure-trap rule). | MEDIUM (named by fixture coupling, not enumerated file-by-file) |
| Candidate-journey specs under `tests/tests/specs/candidate/` | Drive the runes-migrated candidate context. | MEDIUM |
| Other `perm-*` specs in the sequential chain | Same `app_settings` singleton + context layer; flake in one cascades. | MEDIUM |

> **Gap:** I did not enumerate every file under `tests/tests/specs/voter/` and `.../candidate/` in this session. The planner should run `yarn test:e2e --list` (or `playwright test --list`) to get the authoritative spec inventory before fixing the targeted subset. The v2.10 baseline is 84 total tests (Phase 94 `playwright --list` 84) [VERIFIED: milestone audit line 17].

### Recommended 3× gate structure (satisfies D-01 + discretion)

1. **Targeted 3× (determinism core):** run the context-touched subset above three consecutive times. The perm-notif spec + a11y-smoke spec MUST be in all three. Each run must be fully green (0 fail, 0 unexpected skip). Use a fresh `yarn db:reset` between runs to expose state-bleed flake.
2. **Single full E2E pass:** one `yarn test:e2e` run proving 84 passed / 0 skipped (the D-03 target).
3. **Single full unit pass:** one `yarn test:unit` proving all package + frontend vitest suites green.
4. **Scoring:** any "did not run" / cascade-skip in any of the five runs = FAILURE (project memory). Any flake in the perm-notif spec → D-02 investigate-and-fix in-phase (do NOT re-defer unless root cause is conclusively migration-unrelated).

### Determinism levers already in the codebase (use, don't re-invent)

[VERIFIED: a11y-smoke.spec.ts lines 44–81]
- `?notr=1` View-Transition escape hatch (`withNoTransition()` / D-02 Plan 99-01) — disables the ~272ms cross-fade so assertions don't race `document.activeElement` against the `::view-transition` pseudo-tree. Any new transition-coupled assertion must use it.
- Role-based content settle (NEVER network-idle) before assertions — the established settle pattern.
- `waitFor({ state: 'visible', timeout })` polling, NOT one-shot `isVisible({ timeout })` (which ignores its timeout). [VERIFIED: spec comment lines 66–67]
- `TIMEOUTS.slowPage` for reactive-render-pressured waits; per-test ceiling is 90s (config line 45–46).

---

## Workstream C — A11y color-contrast remediation (CONTINGENT)

> **Scope caveat (MEDIUM confidence on applicability):** There is NO locked decision and NO REQUIREMENTS.md item that says color-contrast is currently broken. CONTEXT.md scopes Phase 101 to SUITE-01 only. This workstream is a **conditional branch** that activates ONLY if the global axe gate in `a11y-smoke.spec.ts` reports `color-contrast` violations during the Workstream-B runs. If the a11y-smoke spec passes (as it did at the v2.10 baseline), this workstream is a no-op and the planner should NOT author remediation tasks. [VERIFIED: CONTEXT.md, REQUIREMENTS.md SUITE-01]

### Why contrast is inside the green gate

[VERIFIED: a11y-smoke.spec.ts lines 87–90, 143–146, 160]
The a11y-smoke spec runs `AxeBuilder.withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()` against 6 voter-app routes and asserts a **global `expect(results.violations).toHaveLength(0)`**. `color-contrast` is a WCAG 2.1 AA (`wcag2aa`) rule included in that tag set, so any new contrast regression fails the global gate even though there is no per-rule `color-contrast` assertion. Migration risk: a `$state`-driven class, a new overlay/opacity layer (View-Transition cross-fade), or a re-themed component could push a text/background pair under 4.5:1.

### Remediation path: offending-selector → component → theme token → ≥4.5:1 hex

**Step 1 — Get the offending selectors.** When the gate fails, the spec attaches `axe-violations-<routeName>.json` (a11y-smoke.spec.ts:133–136). Each `color-contrast` violation node carries the failing CSS selector, the computed fg/bg colors, and the measured ratio. Read that attachment — do NOT guess.

**Step 2 — Map selector → component file.** Trace the selector to its Svelte component under `apps/frontend/src/lib/components/`, `apps/frontend/src/lib/dynamic-components/`, or `apps/frontend/src/lib/candidate/components/` (the three component roots per CLAUDE.md). DaisyUI utility classes (`text-secondary`, `bg-base-200`, `text-warning`, etc.) point back to theme tokens.

**Step 3 — Map class → theme token.** Theme tokens live in `packages/app-shared/src/settings/staticSettings.ts` under `colors.light` / `colors.dark` [VERIFIED: lines 17–38]:

| Token | Light hex | Dark hex |
|-------|-----------|----------|
| `primary` | `#2546a8` | `#6887e3` |
| `secondary` | `#666666` | `#8c8c8c` |
| `accent` | `#0a716b` | `#11a8a0` |
| `neutral` | `#333333` | `#cccccc` |
| `base-100` | `#ffffff` | `#000000` |
| `base-200` | `#e8f5f6` | `#101212` |
| `base-300` | `#d1ebee` | `#1f2324` |
| `warning` | `#a82525` | `#e16060` |
| `line-color` | `#d9d9d9` | `#262626` |

**Step 4 — Contrast sanity of existing pairs (informational; ratios computed by hand from the hexes above — treat as `[ASSUMED]` until axe confirms the actual failing pair):**
- Light `secondary #666666` on `base-100 #ffffff` ≈ 5.7:1 → passes 4.5:1 for normal text. On `base-200 #e8f5f6` it drops slightly but still ≈5.3:1.
- Light `warning #a82525` on `#ffffff` ≈ 6.6:1 → passes.
- Light `accent #0a716b` on `#ffffff` ≈ 4.9:1 → **passes but marginal**; on `base-200`/`base-300` tints it can dip BELOW 4.5:1. This is the most likely contrast pinch point if a component renders accent text on a tinted base.
- Dark `secondary #8c8c8c` on `base-100 #000000` ≈ 5.0:1 → passes; on `base-200 #101212` ≈ 4.9:1 → marginal.
- Dark `primary #6887e3` on `#000000` ≈ 5.9:1 → passes.

**Step 5 — Concrete ≥4.5:1 hex replacements (ONLY apply the one the axe report names):**
- If light `accent` on a tinted base fails: darken to `#0a6863` or `#08605b` (raises ratio on `base-200`/`base-300` above 4.5:1 while staying on-brand teal). `[ASSUMED]` — confirm with the actual failing bg from the axe node.
- If light `secondary` on `base-200` fails: darken to `#595959` or `#525252`.
- If dark `secondary` on `base-200` fails: lighten to `#9a9a9a`.
- For any pair, the deterministic procedure: take the axe-reported fg+bg, and adjust the *token* (not a one-off inline style) until a contrast checker reports ≥4.5:1 (normal text) / ≥3:1 (large text ≥18.66px bold or ≥24px). Re-run the a11y-smoke spec to confirm 0 violations.

### Blast radius of a token change

[VERIFIED: CLAUDE.md "Settings Architecture" + staticSettings location]
Theme tokens in `staticSettings.ts` are the **global single source of truth** for VAA instance colors, consumed by DaisyUI across the *entire* frontend (both voter and candidate apps, light + dark themes). Changing one token hex re-themes every component that uses that DaisyUI color class. Therefore:
- Prefer the **smallest token nudge** that clears 4.5:1, to minimize visual drift.
- A token change can shift OTHER previously-passing pairs — re-run the FULL a11y-smoke (all 6 routes, both implied via the scan) to confirm no new violation was introduced elsewhere.
- If only one component is wrong (not the token globally), prefer a component-local class/style override rather than mutating the shared token — smaller blast radius. The axe selector tells you whether it's a token-wide or component-local problem.
- Visual-regression: if a token changes, the `visual-regression` Playwright project (config lines 121–124, opt-in `PLAYWRIGHT_VISUAL`) screenshot baselines may need regeneration. Flag this to the planner — but it's opt-in, so it won't break the default green gate.

---

## Standard Stack

No new packages are required for this phase. Relevant existing infra (all `[VERIFIED: package.json / config]`):

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| `@playwright/test` | `catalog:` (workspace catalog) | E2E runner + project graph | Config: `tests/playwright.config.ts` |
| `@axe-core/playwright` | `^4.11.3` | WCAG axe scan in a11y-smoke | package.json:41 |
| `eslint-plugin-playwright` | `^2.9.0` | `no-skipped-test` rule (the eslint-disable to remove) | package.json:57 |
| Vitest | via `turbo run test:unit` | Unit suite | Per-package configs |

**No installs.** This is a re-enable + verify phase. The Package Legitimacy Audit is therefore not applicable (no external packages introduced).

## Package Legitimacy Audit

Not applicable — Phase 101 installs no external packages. (Re-enable existing spec + run existing suites; contingent contrast fix edits an in-repo hex value.)

## Architecture Patterns

### Perm-family sequential chain (do not parallelize)
**What:** The `perm-*` family is one strictly-sequential dependency chain; each perm spec depends on the prior perm spec/setup to avoid `app_settings` singleton clobbering. [VERIFIED: config lines 455–545]
**When:** Always — never reorder or parallelize perm specs.
**Anti-pattern:** Adding `fullyParallel: true` to a perm project (it's explicitly `false`). Removing the `dependencies` chain. Both reintroduce singleton clobbering.

### Transition-deterministic E2E assertions
**What:** Use `?notr=1` to disable the View-Transition cross-fade before asserting focus / DOM state. [VERIFIED: a11y-smoke.spec.ts:44–56]
**When:** Any assertion that could race the ~272ms animation.

### Anti-Patterns to Avoid
- **Softening perm assertions to force green** — violates the spec's HARD-assertion rigidity contract AND D-02. Fix the cause, not the test.
- **Weakening the a11y axe gate** — violates CLAUDE.md WCAG discipline; the per-rule + global gates are PRESERVED by contract.
- **Mutating a shared theme token to fix one component** — over-broad blast radius; prefer component-local override unless the token itself is globally wrong.
- **Declaring green on a single run** — D-01 requires 3×.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Disable animation for deterministic E2E | Custom CSS injection / clock mocking | Existing `?notr=1` escape hatch | Already wired into `shouldAnimate` (viewTransition.ts) and used across a11y-smoke |
| Run target spec + its data setup | Manual seed script before the spec | Playwright `dependencies` (already declared) | The project graph auto-runs setup→spec→teardown |
| Contrast ratio math | Eyeball the hex | A contrast checker against the axe-reported fg/bg | Axe gives exact computed colors + ratio; guessing risks a still-failing fix |

## Runtime State Inventory

This is a test-re-enable + gate phase, not a rename/refactor/migration phase, so a full runtime-state inventory is not required. The one runtime-state item worth naming:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data (DB singleton) | `app_settings` singleton is clobbered by each perm setup; perm chain order depends on it. Seed prefixes: `e2e-perm-notif-` (this spec), `test-`, `e2e-perm-` (pre-clear). | None new — `yarn db:reset` between determinism runs; do not parallelize perm specs. |
| Live service config | None — local Supabase only, reset from migrations + seed. | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | Auth users created by perm invite flow; teardown now unregisters them (2026-06-02 fix). | If "already registered" re-run failure recurs, that fix regressed — D-02 finding. |
| Build artifacts | Built `.js` packages required for runtime (CLAUDE.md). | `yarn build` before E2E if packages changed (a contrast token edit in `@openvaa/app-shared` REQUIRES a rebuild — it's a built package consumed by the frontend). |

> **Important contrast-fix caveat:** `staticSettings.ts` lives in `@openvaa/app-shared`, a BUILT package. A token hex change there will NOT reach the frontend until `yarn build` (or the `yarn dev` package watcher) rebuilds app-shared. The planner must include a rebuild step in any contingent contrast-fix task. [VERIFIED: CLAUDE.md build/runtime-resolution rules]

## Common Pitfalls

### Pitfall 1: Counting a cascade-skip as a pass
**What goes wrong:** An upstream perm/journey failure cascade-skips `perm-per-app-notifications`; the report shows it as skipped, not failed.
**How to avoid:** Treat any "did not run" in the gate as a FAILURE (project memory). The D-03 target is explicitly **0 skipped**.

### Pitfall 2: Single-run green
**How to avoid:** D-01 mandates 3× for the touched surfaces. A flake that surfaces 1-in-3 is exactly what this phase exists to catch.

### Pitfall 3: Contrast fix that breaks another pair
**What goes wrong:** Darkening a shared token to fix route A pushes route B's same-token-on-different-bg pair out of range, or shifts visual-regression baselines.
**How to avoid:** Re-run the FULL a11y-smoke after any token change; prefer component-local overrides; flag visual-regression baseline regen.

### Pitfall 4: Forgetting to rebuild app-shared after a token edit
**What goes wrong:** Token hex changed in `staticSettings.ts`, E2E still scans the old color, gate still fails — looks like the fix didn't work.
**How to avoid:** `yarn build` (or rely on `yarn dev` watcher) before re-running E2E.

### Pitfall 5: Leaving the dead eslint-disable
**What goes wrong:** After un-skipping, `// eslint-disable-next-line playwright/no-skipped-test` (line 26) becomes a dead directive.
**How to avoid:** Delete lines 18–26 as part of the un-quarantine edit.

## Code Examples

### Un-quarantine edit (the one load-bearing change)
```ts
// tests/tests/specs/perm/perm-per-app-notifications.spec.ts
// BEFORE (lines 26–27):
//   // eslint-disable-next-line playwright/no-skipped-test
//   test.describe.skip('perm-per-app-notifications', () => {
// AFTER (and delete the 18–26 TODO/reason/eslint-disable block):
test.describe('perm-per-app-notifications', () => {
```

### Run the targeted determinism subset (one of 3 iterations)
```bash
# fresh DB between iterations to expose state-bleed flake
yarn db:reset
# (yarn dev must be running in another shell)
yarn test:e2e --project=perm-per-app-notifications --project=a11y-smoke
```

### Full gate (D-03 target)
```bash
yarn test:e2e    # expect: 84 passed / 0 skipped
yarn test:unit   # expect: all green
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| perm tests skipped pending runes migration | Un-skip now that migration (phases 95–100) is complete | Phase 101 | 2 skipped → 2 passing |
| perm-teardown leaked auth users (re-run blocker) | Teardown unregisters invited auth users | 2026-06-02 | D-04 re-enable now viable |

**Deprecated/outdated:** The config comments (lines 506–508) and spec TODO (lines 18–25) saying "re-enable after the migration" are now stale and should be removed.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Color-contrast is NOT currently failing (workstream C is contingent, not confirmed) | Workstream C | If it IS failing at baseline-of-this-phase, the contrast branch becomes mandatory, not optional. Mitigated: the Workstream-B runs will reveal it definitively. |
| A2 | Hand-computed contrast ratios (accent ≈4.9:1 marginal, etc.) | Workstream C Step 4 | Wrong ratio → wrong "most likely pinch point" guess. Mitigated: only the axe-reported pair drives the actual fix. |
| A3 | Suggested replacement hexes (`#0a6863`, `#595959`, etc.) clear 4.5:1 | Workstream C Step 5 | Must be re-verified against the actual axe-reported background, not assumed. |
| A4 | The full context-touched spec list (voter/candidate journey specs) — named by fixture coupling, not file-enumerated | Workstream B | Targeted subset may miss/over-include a spec. Mitigated: planner runs `--list` for authoritative inventory. |
| A5 | The 2 perm tests will PASS once un-skipped (popup lifecycle is now stable post-migration) | Summary / D-02 | If they flake, D-02 kicks in (investigate + fix in-phase). This is the explicitly-anticipated risk. |

## Open Questions

1. **Is color-contrast actually broken right now?**
   - What we know: the global axe gate includes `color-contrast`; the v2.10 baseline a11y-smoke passed (82/2 green).
   - What's unclear: whether any phase 95–100 change introduced a new contrast regression.
   - Recommendation: do NOT pre-author contrast tasks. Let the Workstream-B runs decide. Plan it as a conditional branch.

2. **Exact enumeration of "context-touched" voter/candidate journey specs.**
   - What we know: they consume the runes-migrated contexts via fixtures.
   - What's unclear: precise file list.
   - Recommendation: planner runs `yarn test:e2e --list` to pin the 84-test inventory and select the targeted 3× subset.

3. **Should the 3× be full-suite or targeted-subset + one full pass?**
   - User discretion (CONTEXT.md) explicitly allows targeted-subset + single full pass, as long as perm + context-touched specs get 3×.
   - Recommendation: targeted 3× + 1 full E2E + 1 full unit (faster, satisfies D-01).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Local Supabase (CLI) | E2E (`yarn dev` / `yarn db:reset`) | Assumed (project standard) | — | None — E2E cannot run without it |
| Playwright browsers | E2E | Assumed (`yarn playwright install`) | — | `yarn playwright install` |
| Node / Yarn 4 | All | Assumed | — | None |

> Not probed in this session (the dev stack wasn't started). The planner/executor should confirm `yarn db:status` shows services up before the E2E gate.

## Validation Architecture

> `workflow.nyquist_validation` is not present in config.json → treated as enabled. For this phase the "validation" IS the suite gate itself.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (`@playwright/test`, `catalog:`) + Vitest (via `turbo run test:unit`) |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn test:e2e --project=perm-per-app-notifications --project=a11y-smoke` |
| Full suite command | `yarn test:e2e` (E2E) + `yarn test:unit` (unit) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUITE-01 | 2 perm-notif tests pass | E2E | `yarn test:e2e --project=perm-per-app-notifications` | ✅ (re-enable describe) |
| SUITE-01 | Global a11y gate (incl. color-contrast) green | E2E | `yarn test:e2e --project=a11y-smoke` | ✅ |
| SUITE-01 | Full E2E green, 84/0 | E2E | `yarn test:e2e` | ✅ |
| SUITE-01 | Full unit green | unit | `yarn test:unit` | ✅ |

### Sampling Rate
- **Per task commit:** quick run (`--project=perm-per-app-notifications --project=a11y-smoke`).
- **Per wave merge:** full `yarn test:e2e` + `yarn test:unit`.
- **Phase gate:** 3× targeted green + 1× full E2E (84/0) + 1× full unit, all green, before `/gsd-complete-milestone`.

### Wave 0 Gaps
- None — all test infrastructure exists. The only "gap" is the `describe.skip` to remove (Workstream A) and the *contingent* color-contrast fix (Workstream C, only if the gate regresses).

## Security Domain

Not applicable in the conventional sense — this phase adds no code paths, endpoints, inputs, or crypto. The only auth-adjacent surface is the perm-notif setup/teardown's invited auth users; the relevant control (teardown unregisters them, fixed 2026-06-02) is already in place. No ASVS category is newly engaged by re-enabling existing tests. (If `security_enforcement` is enabled in config, note: no new V2–V6 surface introduced.)

## Sources

### Primary (HIGH confidence — read on disk 2026-06-05)
- `.planning/phases/101-suite-re-enable-milestone-close-green-gate/101-CONTEXT.md` — decisions D-01..D-04, discretion clause
- `tests/tests/specs/perm/perm-per-app-notifications.spec.ts` (full, 48 lines) — quarantine location + assertions
- `tests/playwright.config.ts` (lines 455–545, 506–526) — perm project wiring + chain order
- `tests/tests/setup/perm/perm-per-app-notifications.setup.ts` — seed prefix + teardown-prefix guard
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` (full) — global axe gate incl. color-contrast, `?notr=1` determinism
- `packages/app-shared/src/settings/staticSettings.ts` (lines 17–38) — theme token hexes
- `package.json` (lines 24, 26, 41, 57) — suite commands + a11y/playwright deps
- `.planning/REQUIREMENTS.md` (SUITE-01, line 57) — locked requirement text
- `.planning/milestones/v2.10-MILESTONE-AUDIT.md` (lines 17, 93) — 82/2 baseline, WCAG-AA discipline
- `CLAUDE.md` — build/runtime resolution, WCAG mandate, suite commands, context destructure rule

### Secondary (MEDIUM)
- Project memory: `project_perm_teardown_leaks_auth_users` (2026-06-02 fix), `feedback_e2e_did_not_run` (did-not-run = fail), `project_gsd_execute_phase_quirks` (complete-milestone gotchas)

### Tertiary (LOW / ASSUMED)
- Hand-computed contrast ratios and suggested replacement hexes (Workstream C) — must be re-verified against actual axe output

## Metadata

**Confidence breakdown:**
- Workstream A (un-quarantine): HIGH — exact file, lines, syntax verified on disk
- Workstream B (3× determinism): HIGH for commands/mechanics; MEDIUM for exact touched-spec enumeration (use `--list`)
- Workstream C (color-contrast): MEDIUM — path & tokens verified, but applicability is CONTINGENT and replacement hexes are ASSUMED

**Research date:** 2026-06-05
**Valid until:** ~2026-07-05 (stable; the only volatility is whether the 3× run surfaces a contrast/flake regression)

## RESEARCH COMPLETE

**Phase:** 101 - Suite Re-enable + Milestone-Close Green Gate
**Confidence:** HIGH (A & B), MEDIUM (C, contingent)

### Key Findings
- Un-quarantine is a **1-line edit** (`test.describe.skip` → `test.describe` at `perm-per-app-notifications.spec.ts:27`) plus deletion of the dead TODO/`reason`/eslint-disable block (lines 18–26). The Playwright project wiring (setup→spec→teardown) is already present and uncommented.
- The 2 perm tests assert notification-popup cross-route isolation (`[notif-voter]` vs `[notif-cand]` dialogs) with HARD assertions — the exact popup-lifecycle surface the migration reworked, so the highest residual-flake risk (D-02 in-phase fix).
- Suite commands: `yarn test:e2e` (full E2E, target 84/0), `yarn test:unit` (unit). Targeted 3× subset = perm-per-app-notifications + a11y-smoke + voter/candidate journey specs; use `--list` to pin the inventory.
- Color-contrast remediation is **contingent**, not confirmed — the `a11y-smoke` global axe gate includes the WCAG-AA `color-contrast` rule; theme tokens live in `app-shared/staticSettings.ts` (a BUILT package — any hex change needs `yarn build`). Marginal pinch point if it occurs: light `accent #0a716b` (~4.9:1) on tinted `base-200/300`.

### File Created
`.planning/phases/101-suite-re-enable-milestone-close-green-gate/101-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | No new packages; existing infra verified in package.json |
| Architecture (perm chain, determinism) | HIGH | Config + spec read line-by-line |
| Pitfalls | HIGH | Grounded in verified config + project memory |
| Color-contrast workstream | MEDIUM | Path/tokens verified; applicability contingent + hexes ASSUMED |

### Open Questions
- Is color-contrast actually broken now? (Let Workstream-B runs decide; do not pre-author tasks.)
- Exact context-touched spec list (run `yarn test:e2e --list`).
- 3× full-suite vs targeted-subset (discretion → targeted + 1 full pass recommended).

### Provenance Caveat
The recovery prompt referenced a prior ~51-call investigation; that context did NOT survive the drop. This document is a fresh on-disk investigation (2026-06-05) — every `[VERIFIED]` claim cites a file read this session; nothing was fabricated to backfill the lost work.

### Ready for Planning
Research complete. Planner can create PLAN.md files for: (A) un-quarantine, (B) 3× determinism gate, (C) contingent color-contrast branch. Pair with `/gsd-complete-milestone` after green.
