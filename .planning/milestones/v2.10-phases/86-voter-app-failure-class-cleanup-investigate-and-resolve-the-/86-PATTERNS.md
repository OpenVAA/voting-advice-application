# Phase 86: Voter-App FAILURE-CLASS Cleanup — Pattern Map

**Mapped:** 2026-05-14
**Files modified (no new files):** 5 core surfaces — 10 voter specs + `diff-playwright-reports.ts` + `regen-constants.mjs` + (optional) `playwright.config.ts` + (per-skip) new `.planning/todos/pending/*.md`
**Analogs found:** 5/5

Phase 86 modifies existing files only — no new files created. Patterns are paste-ready code excerpts from existing analogs for each modification surface.

## File Classification

| File (modified) | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `tests/tests/specs/voter/voter-popups.spec.ts` (+9 others) | e2e test | Playwright test-skip-with-rationale | `tests/tests/specs/variants/constituency.spec.ts:385-404` (test.skip block) + `tests/tests/specs/candidate/candidate-settings.spec.ts:782` (test.skip inline call) | exact |
| `tests/scripts/diff-playwright-reports.ts` | constants partition + diff logic | Const-array + Set filter | Existing `PASS_LOCKED_TESTS` / `DATA_RACE_TESTS` / `CASCADE_TESTS` const + Set filter (same file, lines 145-308 + 467-469) | exact (self-analog) |
| `.planning/phases/79-…/post-fix/regen-constants.mjs` | script reportPath re-point | file I/O | Same file (line 34) — Phase 85 re-pointed it for Phase 85's run-3.json; Phase 86 re-points for Phase 86's run-3.json | exact (self-analog) |
| `tests/playwright.config.ts` (optional, Plan 03 §3.7) | Playwright project config | `testIgnore` exclusion | Existing `voter-app` project block uses `testIgnore: /voter-(settings\|popups)\.spec\.ts/` (line 184) | exact |
| `.planning/todos/pending/2026-MM-DD-<short>.md` (per skip) | v2.11+ deferral todo | Markdown spec | `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md` | exact |

---

## Pattern Assignments

### 1. Skip-with-rationale pattern (Plan 01/02/03 — per-test escalation)

**Analog A (Phase 75 precedent — PRODUCT-GAP unconditional skip):** `tests/tests/specs/variants/constituency.spec.ts:385-404`

Multi-line rationale via array-join. This is the **literal shape** for Phase 86 skip-escalations.

```typescript
////////////////////////////////////////////////////////////////////
// (block comment header — explains the PRODUCT-GAP / rationale)
//   - The voter results filter dialog therefore does NOT render a top-level
//     constituency filter today. Constituency is a navigation/scope concern
//     (election → constituency → questions/results), not a per-list filter.
//   - Conclusion: constituency-filter cell is PASS-WITH-DEFERRAL pending a
//     product decision on whether constituency should surface as a filter.
//
// This block is ADDITIVE — it does NOT modify the existing CONF-03 invariants
// in the serial-mode 'Constituency selection variant' suite above. The skip
// is structural (no surface to assert against), not a flake.
////////////////////////////////////////////////////////////////////
test.describe('SETTINGS-01 wave B — constituency-filter', { tag: ['@variant'] }, () => {
  // reason: PASS-WITH-DEFERRAL stub — no constituency filter UI exists today
  // (Phase 77 Plan 02 OQ-5 resolution). The test.skip annotation documents the
  // PRODUCT-GAP and routes maintainers to the follow-up todo. Phase 77 Plan 01
  // SUMMARY established this PASS-WITH-DEFERRAL pattern for product gaps that
  // are asserter-able only against an absent surface.
  // eslint-disable-next-line playwright/expect-expect
  test('SETTINGS-01 wave B — constituency-filter (PRODUCT-GAP / PASS-WITH-DEFERRAL)', async () => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      true,
      [
        'Phase 77 Plan 02 OQ-5 resolution: the voter results filter dialog does NOT render',
        'a constituency filter today. buildParentFilters emits only alliance/faction/organization',
        'filters; no constituency code path exists. PRODUCT-GAP — see follow-up todo at',
        '.planning/todos/pending/2026-05-13-constituency-filter-product-gap.md.'
      ].join(' ')
    );
  });
});
```

**Analog B (Phase 77 precedent — runtime-conditional skip via cell.skipReason):** `tests/tests/specs/candidate/candidate-settings.spec.ts:773-792`

Used when skip is per-iteration in a parameterized matrix. Phase 86 will more often use Analog A (single-test, unconditional skip) — included here for completeness if Plan 02's filter-toggle / Plan 03's case-d both-missing surfaces benefit from cell-driven matrix.

```typescript
// eslint-disable-next-line playwright/expect-expect
test(`SETTINGS-01 wave A — ${cell.name}`, async ({ page }) => {
  // PASS-WITH-DEFERRAL marker: when skipReason is set, the cell is
  // skipped with the per-cell rationale (recorded in 77-01-SUMMARY.md).
  // skipReason='' (the default) becomes the falsy condition → no skip.
  // playwright/no-skipped-test: skip is conditional on a runtime
  // value (cell.skipReason from the wave A cell table), used here as
  // the documented PASS-WITH-DEFERRAL surface per Phase 74 D-04 /
  // Phase 75 D-03 / Phase 76 D-09 precedent.
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(Boolean(skipReason), skipReason);
  test.setTimeout(60000);
  // ... rest of test body
});
```

**Phase 75 FAILURE-CLASS rationale prose template** (from `.planning/milestones/v2.9-phases/75-question-rendering-specs/75-VERIFICATION.md:162-163`):

```text
Per-plan smoke PASS × 3 (XX.Xs isolated). Full-suite cold-start FAIL × 3 at
`voter-questions-start` 10s timeout inside `walkToQuestion(page, N)` helper —
inherits the SAME voter-fixture heterogeneous-question-types race as
voter-detail/voter-feedback/voter-navigation. Spec correctness verified in
isolation. Will resolve at Phase 78 CLEAN-05 close.
```

**Required skip-rationale completeness** (Validation Dimension #7 from RESEARCH §6):
1. Inline `test.skip(true, '<reason>')` — rationale string ≥ 20 chars, references the cause + the follow-up todo path
2. Block comment immediately above explaining the rationale (≥ 3 lines)
3. New todo file at `.planning/todos/pending/2026-MM-DD-<short-name>.md` (see Shared Pattern §A below)

**Required lint suppressions** (always paired):
- `// eslint-disable-next-line playwright/expect-expect` — placed before the `test(...)` opening (when the test body skips before any expect)
- `// eslint-disable-next-line playwright/no-skipped-test` — placed immediately before `test.skip(...)`

---

### 2. `diff-playwright-reports.ts` SKIPPED_TESTS const (CONTEXT D-05, conditional)

**Analog:** existing `PASS_LOCKED_TESTS` / `DATA_RACE_TESTS` / `CASCADE_TESTS` consts (same file).

**Existing const declaration shape** (lines 145, 258, 265 — JSDoc + `ReadonlyArray<string>` + sorted entries):

```typescript
/** 109 tests locked PASSING on Phase 85 baseline (Phase 84 baseline 106 + 3 net-additions from DETERM-11 cascade-decouple: 1 data-setup-multi-election chain-head + 2 variant-multi-election survivors that did NOT hit the spec.ts:139 timeout). Phase 85 v2.10 All-Green Suite anchor. Any regression vs. THIS list is a BLOCKER. */
const PASS_LOCKED_TESTS: ReadonlyArray<string> = [
  'auth-setup :: setup/auth.setup.ts > authenticate as candidate',
  // ... sorted entries ...
];

/** 3 tests in the imgproxy flake pool — unchanged from Phase 84 (3 entries; Phase 73 D-09 binding preserved per CONTEXT.md D-09 — pool MUST NOT grow). DETERM-11 (Phase 85) did NOT touch imgproxy surface; the variant-chain decouple is orthogonal to the image-intrinsic flake pool. Only image-intrinsic CAND-03/CAND-12 tests remain (per 84-RCA-FINDINGS: only these 3 actually fetch `/storage/v1/*` paths during cold-start). May flake when the local imgproxy Docker container 502s. */
const DATA_RACE_TESTS: ReadonlyArray<string> = [
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should persist profile image after page reload (CAND-12)',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should show editable info fields on profile page (CAND-03)',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should upload a profile image (CAND-03)'
];

/** 42 tests cascaded (skipped / did-not-run) on Phase 85 baseline — shrank -5 vs Phase 84 (47). DETERM-11 promoted 3 to PASS_LOCKED (1 data-setup-multi-election chain-head + 2 variant-multi-election survivors); 2 variant-multi-election cells left CASCADE for the FAILURE-CLASS pool (deterministic timeouts at variant-multi-election.spec.ts:139, routed to Phase 86 per WARNING 9 contingency + D-08). The remaining 42 = 32 cascade-victims (cascade-skipped by the 2 new variant-multi-election timeouts before they could run) + 3 PRODUCT-GAP source-skips (header.showFeedback / header.showHelp / notifications.voterApp) + 7 other variant-spec cells. Pool MUST NOT grow back without Phase-86 routing. */
const CASCADE_TESTS: ReadonlyArray<string> = [
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — header.showFeedback',
  // ... sorted entries ...
];
```

**New `SKIPPED_TESTS` const — paste-ready template** (place after `CASCADE_TESTS` at line 309):

```typescript
/** N tests deliberately skipped via test.skip(true, '...') with rationale comments on the source side. Phase 86 DETERM-12/13/14 closure (CONTEXT.md D-05). These tests are NOT part of the parity contract — they are excluded from regression checks (mirrors the SOURCE_SKIP_TESTS exclusion at the diffReports filter). Each entry MUST have (a) inline test.skip(true, rationale) ≥ 20 chars, (b) block comment ≥ 3 lines above the test() block, (c) v2.11+ follow-up todo at .planning/todos/pending/2026-MM-DD-<short>.md. Pool MAY GROW within Phase 86 (one entry per fix-budget escalation); MUST NOT GROW post-Phase-86 without a new phase scope. */
const SKIPPED_TESTS: ReadonlyArray<string> = [
  // Plan 01 (popups + hydration + navigation/redirects) — DETERM-12 closure
  'voter-app :: specs/voter/voter-popup-hydration.spec.ts > popup appears on full page load to /results (LAYOUT-03 hydration path)',
  // Plan 02 (filter + feedback) — DETERM-13 closure
  // Plan 03 (visibility + edge-cases + question-rendering) — DETERM-14 closure
  'voter-app :: specs/voter/voter-visibility-required.spec.ts > SETTINGS-03 hidden question absent from voter question flow'
];
```

**Companion: `diffReports` filter update — paste-ready template** (lines 467-469 are the existing Set construction):

```typescript
const passLocked = new Set(PASS_LOCKED_TESTS);
const dataRace = new Set(DATA_RACE_TESTS);
const cascadeBaseline = new Set(CASCADE_TESTS);
const sourceSkip = new Set(SKIPPED_TESTS); // NEW for Phase 86
```

…then add the early-continue at the top of the `for (const b of baseFlat)` loop (mirrors the comment at lines 410-411 / 459 about SOURCE_SKIP exclusion):

```typescript
for (const b of baseFlat) {
  // Phase 86: deliberately skipped tests are not part of the parity contract.
  if (sourceSkip.has(b.id)) continue;
  // ... existing rules 1, 2, 3 below ...
}
```

---

### 3. `regen-constants.mjs` reportPath re-point pattern

**Analog:** Phase 85 re-pointed `reportPath` at Phase 85's `run-3.json` (line 34 of the archived script).

**Current state of `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs:34` (Phase 85 anchor):**

```javascript
// __dirname is .planning/phases/79-…/post-fix/. Phase 85 anchor lives 2 levels up
// then down into the Phase 85 post-fix directory.
// Phase 85: DETERM-11 structural decoupling (variant-chain head
// `data-setup-multi-election` decoupled from `voter-app-popups` in
// tests/playwright.config.ts) promoted run-3.json as the canonical regen
// source. Run 1 SHA ≡ Run 2 SHA (strict identity); Run 3 differs by exactly 1
// non-Phase-85-scope voter-app party-drawer cell (same Phase-83-DETERM-07b
// hydration-guard boundary graduate that flaked in Phase 84 run-2) —
// symmetric flake direction confirms boundary classification; routed to
// Phase 86 per CONTEXT.md D-08. New Phase 85 v2.10 anchor SHA:
// 411e09f5ffb15015ca57a7405619f127f3950c402c082e2599f6782601158ac5
// Phase 84 anchor 04ddfdd85cfbcd6505626eb8fb50f3e6f35c11e5385df1f4c8695b22ed0655aa
// is ABSORBED by this regen. See .planning/phases/85-…/post-fix/sha256.txt
// for the audit + WARNING-9 contingency narrative (2 new variant-multi-
// election deterministic FAILs routed to Phase 86).
const reportPath = join(__dirname, '..', '..', '85-variant-project-cascade-rca-fix-investigate-and-close-the-47', 'post-fix', 'run-3.json');
```

**Phase 86 re-point (paste-ready, line 34):**

```javascript
// __dirname is .planning/phases/79-…/post-fix/. Phase 86 anchor lives 2 levels up
// then down into the Phase 86 post-fix directory.
// Phase 86: DETERM-12/13/14 voter-app FAILURE-CLASS cleanup. <SHA from sha256.txt>
// is the new v2.10 All-Green Suite anchor. Phase 85 anchor
// 411e09f5ffb15015ca57a7405619f127f3950c402c082e2599f6782601158ac5 is ABSORBED.
// Per CONTEXT.md D-06: expected anchor ~155-160 PASS_LOCKED + 3 DATA_RACE +
// ≤ 5 CASCADE + ≤ 2 FAILURE-CLASS (residual deferrals only).
const reportPath = join(__dirname, '..', '..', '86-voter-app-failure-class-cleanup-investigate-and-resolve-the-', 'post-fix', 'run-3.json');
```

**Note on full directory name:** the Phase 86 directory is `.planning/phases/86-voter-app-failure-class-cleanup-investigate-and-resolve-the-/` (trailing hyphen included — match the existing CONTEXT/RESEARCH file paths exactly).

**IMGPROXY_TIED_TITLES contract:** Phase 86 MUST NOT modify lines 91-95 — the 3-entry array is a structural binding per CONTEXT.md D-09. The match-count assertion at lines 100-112 will fail-loud if any entry is renamed upstream by a Phase 86 spec edit; this is the canary. Phase 86 fixes MUST NOT rename the 3 image-intrinsic tests.

---

### 4. `tests/playwright.config.ts` `testIgnore` pattern (optional — Plan 03 §3.7)

**Analog:** existing `voter-app` project block uses `testIgnore` to exclude specs that belong to dedicated single-test projects.

**Current state of `tests/playwright.config.ts:180-189`:**

```typescript
// 5a. Voter app: core journey, results, detail, static-pages (parallel-safe — read-only settings)
{
  name: 'voter-app',
  testDir: './tests/specs/voter',
  testIgnore: /voter-(settings|popups)\.spec\.ts/,
  use: {
    ...devices['Desktop Chrome']
  },
  dependencies: ['data-setup']
},
```

**Phase 86 paste-ready edit (if Plan 03 §3.7 takes the project-config exclusion path for `voter-visibility-required.spec.ts`):**

```typescript
{
  name: 'voter-app',
  testDir: './tests/specs/voter',
  // Phase 86 DETERM-14: voter-visibility-required was authored ONLY for the
  // `variant-hidden-required-voter` project (variant overlay required to
  // hide `test-voter-q-8`); the spec's negative-presence assertion correctly
  // fails when the overlay does not apply. Excluded here so the spec runs
  // ONLY in `variant-hidden-required-voter`. See §3.7 of 86-RESEARCH.md.
  testIgnore: /voter-(settings|popups|visibility-required)\.spec\.ts/,
  use: {
    ...devices['Desktop Chrome']
  },
  dependencies: ['data-setup']
},
```

**Precedent established:** ✓ The existing pattern at line 184 is the direct analog — Phase 86's edit is purely additive (one more alternation in the regex). No new pattern required.

**Alternative (per RESEARCH §3.7 fix sketch):** `test.skip()` guard at spec top conditioned on `process.env.VARIANT_NAME`. Per CONTEXT.md Claude's Discretion + RESEARCH §8 Open Question #3, planner picks the path; project-config exclusion is cleaner but spans a shared file.

---

### 5. `expect.poll()` settle pattern (Plan 01 — hydration race fix sketch §3.2)

**Analog:** `tests/tests/specs/voter/voter-browse-without-match.spec.ts:50-54` — the canonical voter-app `expect.poll()` settle pattern (referenced in the file's own inline comment as the "canonical pattern per v2.6 P64 voter-results.spec.ts").

```typescript
// Wait for the results list to attach. expect.poll provides settle
// headroom for the layout loader + SSR hydration on cold navigation
// (canonical pattern per v2.6 P64 voter-results.spec.ts).
const list = page.getByTestId(testIds.voter.results.list);
await expect.poll(() => list.count(), {
  timeout: 15000,
  message: 'results list must render under browse-without-match path (E2E-02)'
}).toBeGreaterThan(0);
await expect(list.first()).toBeVisible();
```

**Companion analog** (`tests/tests/specs/voter/voter-results.spec.ts:351-362`) — `toHaveCount(0)` for unmount-settle + `expect.poll(...).toEqual(N)` for state-preservation across navigation cycle:

```typescript
// Wait for the drawer to fully unmount — the post-back render briefly
// includes both drawer-internal and list-internal entity-card elements
// until the drawer transition completes (Phase 64 D-11 + D-15 hardening).
await expect(page.getByTestId(DRAWER_TESTID)).toHaveCount(0, { timeout: 5000 });

// After closing drawer — filter should still be active (card count unchanged
// from when filter was applied). Use expect.poll so the assertion has
// settle headroom — the layout's $derived re-evaluation after URL change
// briefly desyncs entity-card count from the steady-state filter result.
await expect
  .poll(() => page.getByTestId(testIds.voter.results.card).count(), {
    timeout: 5000,
    message: `Card count after drawer close must match pre-drawer count (${beforeFilterCount}) — filter state must survive drawer cycle (Phase 64 D-11 + D-15)`
  })
  .toEqual(beforeFilterCount);
```

**Application to Plan 01 §3.2 (voter-popup-hydration LAYOUT-03 hydration race fix sketch H1):** replace the bare `toBeVisible({ timeout: 15000 })` on `voter-results-list` with the `expect.poll(...).toBeGreaterThan(0)` settle pattern above; this gives the answerStore initScript + layout-load time to converge before the popup-wait fires.

---

### 6. `waitForLoadState('networkidle')` substitute pattern (Plan 02 — feedback dialog close fix sketch §3.6)

**Important context:** `networkidle` is being lint-deprecated project-wide (Plan 73-02 Task 1 removed networkidle from `voter-static-pages.spec.ts:104`). The fix sketch in RESEARCH §3.6 references it but the **modern equivalent** is `waitForLoadState('domcontentloaded')` or `expect.poll()` on the target locator.

**Analog A (modern voter-app pattern — `domcontentloaded` after `page.goto`):** `tests/tests/specs/voter/voter-results.spec.ts:376`

```typescript
// Cold-navigate to the full deeplink: /results/candidates/candidate/<id>?electionId=<x>
await page.goto(`/results/candidates/candidate/${parsed!.id}${parsed!.search}`);
await page.waitForLoadState('domcontentloaded');

// Drawer should be visible
await expect(page.getByTestId(DRAWER_TESTID)).toBeVisible({ timeout: 5000 });
```

**Analog B (network-idle-substitute via narrow-scoped settle wait — accepted-warning idiom):** `tests/tests/specs/voter/voter-static-pages.spec.ts:99-126`

```typescript
test('should render nominations page with entries', async ({ page }) => {
  test.setTimeout(120000);
  // reason: the test.beforeAll updateAppSettings call's effect must reach
  // the dev server's data layer before the goto navigates; on cold-start
  // (where the dev server has just spun up, the supabase pooler is cold,
  // and the test framework hasn't warmed its connections), the old
  // waitForLoadState('networkidle') barrier was implicitly acting as a
  // settle-time for the settings-update + page-data fetch pipeline. With
  // it removed (Plan 73-02 Task 1 for lint hygiene), the bare locator
  // wait is insufficient. The simplest robust replacement is a small,
  // narrowly-scoped settle wait before the assertion. The settle wait
  // here matches the practical baseline duration observed in run-3 of
  // the post-hotfix inventory (65.7s test duration — most of it data-
  // load latency).
  await page.goto(buildRoute({ route: 'Nominations', locale: 'en' }));

  // Wait for nominations container. Layout loads data async (Loading → list).
  // Budget = 90s on the attached-state wait to absorb cold-start data-fetch
  // latency, then a final 15s budget on the visibility assertion.
  const container = page.getByTestId(testIds.voter.nominations.container);
  await container.waitFor({ state: 'visible', timeout: 90000 });

  // Verify nominations list is visible
  await expect(page.getByTestId(testIds.voter.nominations.list)).toBeVisible();
  // ...
});
```

**Application to Plan 02 §3.6 (feedback dialog close fix sketch H1):** prefer `await expect(feedbackDialog).toHaveCount(0, { timeout: 5000 })` (mirrors `voter-results.spec.ts:351` Phase 64 D-11 + D-15 hardening) over `waitForLoadState('networkidle')`. Networkidle is project-discouraged; the `.toHaveCount(0)` settle is the canonical voter-app idiom.

---

## Shared Patterns (apply across multiple plans)

### A. v2.11+ follow-up todo template

**Source:** `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md` (Phase 75 W-03 follow-up; canonical shape for v2.11+ deferrals).

**Apply to:** every Phase 86 skip-escalation (Plan 01/02/03).

**Paste-ready template:**

```markdown
# <title — what the deferred work is>

**Filed:** 2026-05-XX
**Source:** Phase 86 DETERM-XX (`.planning/phases/86-voter-app-failure-class-cleanup-investigate-and-resolve-the-/86-XX-PLAN.md` §<section>)
**Home phase:** v2.11+ (target phase TBD)
**Effort:** ~<size estimate — 1 task / 1 plan / 1 phase>

## Why deferred

<2-4 sentences explaining why the fix exceeds Phase 86 budget OR is blocked by
out-of-scope product work (e.g., SETTINGS-03 voter-side `customData.required`
enforcement PRODUCT-GAP per STATE.md "Deferred Items"). Cite the specific
research §section + RCA hypothesis that surfaced the deferral.>

## Scope when picked up

1. **<step 1 — concrete code surface to touch>**
2. **<step 2 — verification step>**
3. **<step 3 — regression check>**

## Cross-references

- Phase 86 CONTEXT D-XX (decision that locked the skip escalation)
- Phase 86 RESEARCH §X.Y (per-test RCA hypothesis)
- STATE.md "Deferred Items" §<related deferral>
- <linked existing todos, if any>

## Open questions

- <q1>
- <q2>
```

**Filename convention:** `.planning/todos/pending/2026-MM-DD-<short-kebab-name>.md`

**Inline reference from the skip rationale:** the test.skip's rationale string MUST include the literal path string `.planning/todos/pending/2026-MM-DD-<short-name>.md` so maintainers can grep from the failing test to the deferred work (mirrors `constituency.spec.ts:400` shape).

---

### B. Atomic-commit-per-plan pattern (Phase 79 D-10 + Phase 83/84/85 precedent)

**Apply to:** Plan 01 / Plan 02 / Plan 03 close commits + the constants-regen close commit.

**Per CONTEXT.md D-COMMIT-RECOMMENDATION:**
- 1 commit per plan for the narrative-block update + per-spec fix or skip (atomic per cluster)
- 1 final atomic commit for the constants regen (`diff-playwright-reports.ts` + `regen-constants.mjs` + new todos + run-{1,2,3}.json + sha256.txt) at phase close

This pattern is established — no new analog needed.

---

### C. FAILURE-CLASS narrative block update (Plan 01-03 + close commit)

**Source:** `tests/scripts/diff-playwright-reports.ts:42-142` (~100 line narrative comment block; line range per RESEARCH §2 reality-check — CONTEXT.md's `:87-101` reference is stale).

**Existing shape** (from line 42-71 — Phase 85's most recent rewrite):

```typescript
// -----------------------------------------------------------------------------
// PHASE 85 REGEN (2026-05-14, Phase 85 Plan 02 Task 4 — DETERM-11 constants regen
// for the v2.10 All-Green Suite anchor. Source: post-fix/run-3.json. The 3-run
// cold-start identity gate produced Run-1 SHA ≡ Run-2 SHA (strict identity at
// 6815977e27764fe66195069b526bd180bc6230583a03035b7d7aa9e8b4da5d21); Run-3
// differs by exactly 1 cell (`voter-detail > should open party detail drawer`
// — opposite-direction flake from Phase 84 run-2 same cell). Per Phase 84
// D-05/D-06 precedent we promote run-3.json as the canonical regen source
// because it contains the party-drawer cell in its passing state; the SHA
// 411e09f5ffb15015ca57a7405619f127f3950c402c082e2599f6782601158ac5 binds as
// the new Phase 85 v2.10 All-Green Suite anchor. Regen script:
// .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/
// post-fix/regen-constants.mjs (Phase 79 verbatim helper with reportPath
// re-pointed at Phase 85's run-3.json; IMGPROXY_TIED_TITLES preserved at 3
// entries per CONTEXT.md D-09 binding — D-09 contract is "MUST NOT grow").
//
// PHASE 85 STORY — <... narrative continues ...>
```

**Phase 86 update strategy (per RESEARCH §8 Open Question #5 recommendation):** shrink the narrative block to a 10-15 line header pointing at the new `SKIPPED_TESTS` const + a clear "FAILURE-CLASS pool CLOSED at Phase 86" marker. Per-plan commits update the narrative incrementally; the constants-regen close commit rewrites the header.

**Phase 86 narrative header paste-ready template** (replaces lines 42-142):

```typescript
// -----------------------------------------------------------------------------
// PHASE 86 REGEN (2026-05-XX, Phase 86 close — DETERM-12/13/14 constants regen
// for the v2.10 All-Green Suite anchor. Source: post-fix/run-3.json. Anchor SHA:
// <SHA from sha256.txt>. FAILURE-CLASS pool CLOSED — see SKIPPED_TESTS const
// below for the N deliberate skips with rationale + v2.11+ follow-up todos.
//
// PHASE 86 STORY — Voter-app FAILURE-CLASS cleanup. Plan 01 (popups + hydration +
// navigation/redirects) closed DETERM-12 with X fixes + Y skips. Plan 02 (filter +
// feedback) closed DETERM-13 with X fixes + Y skips. Plan 03 (visibility + edge-
// cases + question-rendering) closed DETERM-14 with X fixes + Y skips. The
// FAILURE-CLASS pool shrank from ~10 → <residual>. Per CONTEXT.md D-06: expected
// anchor ~155-160 PASS_LOCKED + 3 DATA_RACE + ≤ 5 CASCADE + ≤ 2 FAILURE-CLASS.
//
// PRIOR ANCHOR (Phase 85, 2026-05-14) ABSORBED by this regen:
//   411e09f5ffb15015ca57a7405619f127f3950c402c082e2599f6782601158ac5
//   Phase 86 anchor (this regen): <NEW SHA>
//
// Format: '<projectName> :: <specFile> > <specTitle>' — matches `flattenReport`
// output below. Re-embed by running the regen script after a new canonical capture.
// -----------------------------------------------------------------------------
```

---

## No Analog Found

**None.** All 5 Phase 86 modification surfaces have direct in-tree analogs. The Phase 86 work is entirely a recombination of established patterns:
- Skip+rationale pattern: Phase 75 / 77 (constituency.spec.ts + candidate-settings.spec.ts) — established
- SKIPPED_TESTS const: trivially mirrors PASS_LOCKED_TESTS / DATA_RACE_TESTS / CASCADE_TESTS (same file) — established
- regen-constants reportPath: Phase 84 + 85 set the precedent — established
- playwright.config.ts testIgnore: existing `voter-app` project block uses the pattern — established
- expect.poll / waitForLoadState substitute: voter-browse-without-match + voter-results + voter-static-pages — established
- v2.11+ follow-up todo template: `2026-05-12-qspec-01-i18n-hardening.md` — established

---

## Cross-References

- **CONTEXT.md:** `.planning/phases/86-voter-app-failure-class-cleanup-investigate-and-resolve-the-/86-CONTEXT.md` (D-01..D-10 + canonical refs)
- **RESEARCH.md:** `.planning/phases/86-voter-app-failure-class-cleanup-investigate-and-resolve-the-/86-RESEARCH.md` (§3.1–3.11 per-test analysis with code excerpts + fix sketches)
- **VALIDATION.md:** `.planning/phases/86-voter-app-failure-class-cleanup-investigate-and-resolve-the-/86-VALIDATION.md`

## Metadata

**Analog search scope:** `tests/tests/specs/voter/`, `tests/tests/specs/variants/`, `tests/tests/specs/candidate/`, `tests/scripts/`, `tests/playwright.config.ts`, `.planning/phases/79-…/post-fix/`, `.planning/milestones/v2.9-phases/75-question-rendering-specs/`, `.planning/todos/pending/`
**Files scanned:** 8 (4 spec files, 1 script, 1 config, 1 regen script, 1 todo template)
**Pattern extraction date:** 2026-05-14
