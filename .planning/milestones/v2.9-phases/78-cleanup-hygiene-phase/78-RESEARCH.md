# Phase 78: Cleanup Hygiene Phase — Research

**Researched:** 2026-05-12
**Domain:** Hygiene bundle — package-script rename, voter-not-located redirect, post-71 carry-forward trio, i18n wrapper tightening, voter-fixture race-fix Path B, Phase 73 review-findings sweep, verification gate
**Confidence:** HIGH (every cited finding verified at HEAD; CONTEXT D-01..D-20 cross-referenced against current code state)

---

## Phase Context

### User Constraints (from CONTEXT.md)

**Locked Decisions (verbatim — see `78-CONTEXT.md` for full text):**

- **D-01** — 7 plans: P01 CLEAN-01 / P02 CLEAN-02 / P03 CLEAN-03 trio / P04 CLEAN-04 / P05 CLEAN-05 voter-fixture / P06 CLEAN-05 review findings / P07 verification gate.
- **D-02** — `dev:*` aliases KEPT with one-line deprecation warning; removal deferred to v2.10+.
- **D-03** — `db:reset` + `db:reset-with-data` chain `dev:clean` after supabase reset via `&&`.
- **D-04** — No `.github/workflows/*.yml` references to `dev:*` at scout time; Plan 01 verifies.
- **D-05** — `?next=` query param round-trip; URL-encoded full pathname+search; whitelist enforced.
- **D-06** — Gate lives at `(voters)/(located)/+layout.ts` load function (planner confirms exact file at PLAN.md time; verified at HEAD — see §"CLEAN-02 Redirect Insertion Point Audit" below — file EXISTS and is the canonical insertion point).
- **D-07** — NEW `tests/tests/specs/voter/voter-not-located-redirect.spec.ts` covering 4 cases.
- **D-08** — Per-cast `// reason:` distribution: distinguish image-cast (StoredImage) vs answer-cast (LocalizedAnswers).
- **D-09** — `setStore` cast fix: Option 2 = inline `afterNavigate(() => store.set(buildFn()))`.
- **D-10** — CLAUDE.md anchor as new sub-section under "Important Implementation Notes".
- **D-11** — `t()` signature → `TranslationKey` union; `t.get` alias audit (recommended: delete-if-zero-consumers); add `@ts-expect-error` regression-locker in translations.test.ts.
- **D-12** — Pairing direction with E2E-08 = Order B (E2E-08 landed first at Phase 74; CLEAN-04 re-validates).
- **D-13** — Path B locked with `--likert-only` seed modifier; heterogeneous-type coverage OUT OF SCOPE.
- **D-14** — Group Plan 06 findings by surface (variants / setup / utils / candidate-specs / voter-specs clusters).
- **D-15** — Plans 01-06 mostly parallel; Plan 05 has weak dep on Plan 01; Plan 07 depends on all.
- **D-16** — Order B confirmed for E2E-08 ↔ CLEAN-04 pairing (Phase 74 D-06 inheritance).
- **D-17** — All test changes from CLEAN-05 must pass 3× cold-start `--workers=1` identically.
- **D-18** — Parity-script constants regen REQUIRED in Plan 07 (16-test PASS_LOCKED swap is ROADMAP SC #5 acceptance).
- **D-19** — Vite-cache wipe mandatory before 3-run smoke; use `yarn dev:clean` post-Plan-01 (fallback to imperative if order differs).
- **D-20** — Role/aria locators default; `getByTestId` with inline `// reason:` only.

**Claude's Discretion (verbatim):**
- CLEAN-03 split into 03a / 03b / 03c vs. bundled into Plan 03 — default bundled; planner may split.
- CLEAN-05 split into Plans 05 + 06 vs further split 06 into 06a (CR+WR) + 06b (IN) — default 2 plans; see §"Plan 06 Split Recommendation" below.
- `t.get = t` consumer-conditional grep audit vs unconditional delete — see §"CLEAN-04 i18n TranslationKey Audit".
- CLAUDE.md anchor sub-section vs new top-level section — default sub-section.
- Plan 07 STATE.md / todos cleanup inline vs separate chore commit — default inline.

**Deferred Ideas (OUT OF SCOPE — verbatim):**
- Removal of `dev:*` aliases (v2.10+).
- Heterogeneous-question-type voter-fixture coverage (operator-locked OUT).
- `dataContext.ts` analog `setStore`-equivalent cast eradication.
- `t.get = t` alias retention if many consumers (PASS-WITH-DEFERRAL outcome).
- `@ts-expect-error` regression locks for other tightened APIs.
- Visual-regression coverage of i18n wrapper.
- CLEAN-03 sub-finding eradication beyond named sites.
- CLEAN-05 review-findings beyond the 13 in `73-REVIEW.md`.
- `58-E2E-AUDIT.md`-style addendum for `--likert-only` seed mode (planner's call at Plan 05 close).

### Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLEAN-01 | `dev:* → db:*` rename + `dev:clean` + chain | §"CLEAN-01 Concrete Rename Map" |
| CLEAN-02 | Voter-not-located deferred-target redirect | §"CLEAN-02 Redirect Insertion Point Audit" |
| CLEAN-03 | Post-71 carry-forward trio (D-04 + setStore + CLAUDE.md anchor) | §"CLEAN-03 Per-cast Categorization" |
| CLEAN-04 | i18n wrapper tightening | §"CLEAN-04 i18n TranslationKey Audit" |
| CLEAN-05 | Phase 73 review backlog (13 findings) + voter-fixture race-fix Path B | §"Phase 73 Review Findings Audit" + §"CLEAN-05 --likert-only CLI Plumbing" |

---

## Validation Architecture

| Property | Value |
|----------|-------|
| Test framework | Playwright 1.58.2 (E2E); Vitest catalog'd (unit) |
| Config file | `tests/playwright.config.ts` (E2E); per-package `vitest.config.ts` (unit) |
| Quick run command | `yarn lint:check && yarn test:unit` (whole-repo gate) |
| Full suite command | `yarn dev:clean && yarn db:reset-with-data --likert-only && yarn test:e2e --workers=1` (post-CLEAN-01 + post-CLEAN-05 form) |

**Phase Requirements → Test Map** [VERIFIED: tests/scripts/diff-playwright-reports.ts at HEAD]:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLEAN-01 | `yarn db:status` runs supabase status; aliases warn-and-forward | smoke | `yarn db:status; yarn dev:status 2>&1 \| grep -i deprecated` | ❌ Wave 0 (script names + aliases authored by Plan 01) |
| CLEAN-02 | Cold visit to `/results/X` bounces through selectors → resumes target | E2E | `yarn test:e2e -g "voter-not-located"` | ❌ Wave 0 (new spec `voter-not-located-redirect.spec.ts` authored by Plan 02) |
| CLEAN-03a | All 13 cast sites in supabaseDataProvider.ts carry per-cast `// reason:` blocks | grep | `grep -cE "^\s*// reason:" apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (≥13) | ✅ Exists (CLEAN-03a edits 13 cast sites verified at HEAD lines 105, 106, 107, 158, 191, 214, 324, 355, 356, 451, 452, 482, 532) |
| CLEAN-03b | `getRoute.svelte.ts:41` structural cast eliminated | grep | `! grep -q "as { set:" apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` | ✅ Exists (HEAD line 41 contains the cast) |
| CLEAN-03c | CLAUDE.md "Svelte Warning-Accepted Format" sub-section present | grep | `grep -q "Svelte Warning-Accepted Format" CLAUDE.md` | ✅ Exists (file present; new sub-section appended) |
| CLEAN-04 | `t()` signature uses `TranslationKey`; `@ts-expect-error` test present | TS-compile + unit | `yarn workspace @openvaa/frontend check && yarn workspace @openvaa/frontend test:unit -t "TranslationKey"` | ✅ Both exist (`wrapper.ts:16` + `translations.test.ts`) |
| CLEAN-05 | 16 post-73 DATA_RACE tests flip to PASS_LOCKED on cold-start | E2E | `yarn test:e2e --workers=1` × 3 identical pass/fail | ✅ Tests exist; DATA_RACE pool documented |
| CLEAN-05 | All 13 review findings closed (CR-02 + 7 WR + 5 IN) | per-finding | See §"Phase 73 Review Findings Audit" | ✅ All cited file:line still valid at HEAD |
| CLEAN-05 | Parity-script regen with PASS_LOCKED +16 / DATA_RACE −16 | parity-gate | `tsx tests/scripts/diff-playwright-reports.ts post-fix/run-3.json post-fix/run-3.json` | ✅ Script exists at `tests/scripts/diff-playwright-reports.ts` |

**Sampling rate:**
- **Per task commit:** `yarn lint:check` (≤10s)
- **Per wave merge:** `yarn lint:check && yarn test:unit` (≤60s)
- **Phase gate (Plan 07):** Full E2E suite cold-start × 3 + parity-gate regen

**Wave 0 Gaps:**
- [ ] `tests/tests/specs/voter/voter-not-located-redirect.spec.ts` — covers CLEAN-02 (authored by Plan 02)
- [ ] `package.json` scripts block — `db:*` family + `dev:clean` + aliases (authored by Plan 01)
- [ ] `packages/dev-seed/src/cli/seed.ts` — `--likert-only` flag added to parseArgs (authored by Plan 05)
- [ ] `packages/dev-seed/src/templates/e2e.ts` — `likertOnly` option-branch added (authored by Plan 05)

---

## Phase 73 Review Findings Audit

**13 findings cited in `73-REVIEW.md`. Each verified at HEAD against cited file:line. Status legend:**
- **FIX** — issue intact; Plan 06 must fix.
- **VERIFY-NO-OP** — code looks fine at HEAD; Plan 06 may add `// reason:` or skip.
- **ALREADY-FIXED** — auto-resolved by Phase 74/75/76/77; Plan 06 verifies + no-op.

| # | File / Line | Original Issue | Current State at HEAD | Action |
|---|-------------|----------------|----------------------|--------|
| **CR-02a** | `tests/tests/specs/voter/voter-popups.spec.ts:138` | `waitFor({state:'visible'})` on already-visible anchor → false-positive PASS (popup-delay wait collapses to 0ms) | **INTACT at HEAD line 138:** `await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 5000 });` followed by `await expect(dialog).toBeHidden();` (no timeout — so the negative assertion DOES retry within Playwright's `expect` default 5s. Partial mitigation only.) | **FIX** — Replace with `expect(dialog).toBeHidden({ timeout: 5000 })` per CONTEXT D-14 / RESEARCH §Specifics line 496. |
| **CR-02b** | `tests/tests/specs/voter/voter-popups.spec.ts:220` | Same idiom for negative-control "popups disabled" | **INTACT at HEAD line 220:** `await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 3000 });` followed by `await expect(dialogLocator).toHaveCount(0);` (default 5s `expect` retry — partial mitigation). | **FIX** — Replace with `await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 3000 })` per CONTEXT D-14. |
| **WR-01** | `tests/tests/specs/variants/multi-election.spec.ts:145` | `.catch(()=>false)` swallow-trap in `answerAllQuestions` helper | **INTACT at HEAD line 145:** `if (!page.url().includes('/results') && await categoryStart.isVisible().catch(() => false)) { … }`. Helper is hoisted module-scope (lines 104-159). | **FIX** — Replace with union waitFor + deterministic branch per CONTEXT D-14 + RESEARCH §Specifics line 502-507. |
| **WR-02a** | `tests/tests/specs/variants/constituency.spec.ts:89-98` | Race-prone `selectElectionFromAccordionIfPresent` helper: union waitFor → snapshot `count()`/`isVisible()` may flip | **INTACT at HEAD lines 89-98:** unchanged from Phase 73 — comment claims "deterministic dispatch" but body still calls `(await electionAccordion.count()) > 0 && (await electionAccordion.isVisible())` post-union. | **FIX** — Branch on resolved anchor OR add dedicated post-union `electionAccordion.waitFor` per CONTEXT D-14. |
| **WR-02b** | `tests/tests/specs/variants/startfromcg.spec.ts:120-128` | Same helper, second copy | **INTACT at HEAD lines 120-128:** identical pattern to constituency.spec.ts:89-98. | **FIX** — Mirror the WR-02a fix; duplicate the change here. |
| **WR-03** | `tests/tests/specs/variants/multi-election.spec.ts:215-231` | TODO comment + silent `goto()` fallback masks SvelteKit navigation bug; also missing precondition assert on `electionUuids`/`constituencyUuids` (line 250 still uses `waitUntil: 'networkidle'`) | **INTACT at HEAD:** TODO comment present (lines 214-217); try/catch fallback present (lines 220-230); **`waitUntil: 'networkidle'` STILL present at line 250** (original Phase 73 CR-01 BLOCKER finding). The Phase 73 review listed CR-01 as a separate critical issue; CONTEXT only lists CR-02. **CR-01 may have been silently auto-passed at Phase 73 close or remains a Phase 78 candidate.** Audit flag — see §Risks & Landmines. | **FIX** + **LANDMINE FLAG** — fix the goto fallback per CONTEXT D-14; **separately** add precondition asserts; **plus** fix the `networkidle` at line 250 (CR-01 from Phase 73 review — verify whether this was deferred or missed). |
| **WR-04** | `tests/tests/setup/auth.setup.ts:29-48` | Wasted `reload()` in retry loop — next iteration's `goto()` replaces the reload | **INTACT at HEAD lines 29-48:** unchanged from Phase 73; reload at line 38 is followed by next-iter goto at line 30. Note: this is a code-quality fix, NOT the auth-setup-race-cascade documented by Phase 76/77 (see §"Auth-Setup Race ↔ Phase 76 Deferred-Items Cross-Reference" below — these are DIFFERENT defects). | **FIX** — Hoist goto out of loop body OR drop reload entirely per CONTEXT D-14. |
| **WR-05** | `tests/tests/utils/supabaseAdminClient.ts:340-377` | `forceRegister` 4-step mutation leaves orphan auth user on partial failure | **INTACT at HEAD lines 340-377:** unchanged — 4-step sequence (createUser → find candidate → insert user_role → update candidates) with no compensating rollback. | **FIX** — Wrap in try/catch with `auth.admin.deleteUser` compensation per CONTEXT D-14. |
| **WR-06** | `tests/tests/utils/supabaseAdminClient.ts:532-547` | `deleteAllTestUsers` silently swallows per-user errors | **INTACT at HEAD lines 532-547:** unchanged — 3-step loop with NO `error` checks on any client call (vs `unregisterCandidate` at 386+ which DOES throw on each step). | **FIX** — Propagate errors per CONTEXT D-14 fix snippet. |
| **WR-07** | `tests/tests/utils/supabaseAdminClient.ts:122-156` | `fixGoTrueNulls` is dead code (zero callers; internally inconsistent comments) | **INTACT at HEAD lines 122-156:** unchanged. Verified zero callers via grep on `supabaseAdminClient.ts` (the only mention is the declaration itself); `safeListUsers` at lines 162-172 does NOT invoke it. | **FIX = DELETE** — Recommended action per CONTEXT D-14 (delete preferred if upstream bug resolved; alternative: wire into `safeListUsers` with upstream link). |
| **IN-01** | `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:28-33` | Hardcoded Supabase demo `service_role` + `anon` JWT tokens as fallbacks | **INTACT at HEAD lines 27-33:** unchanged — `SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJ...'` and same for `SUPABASE_ANON_KEY`. | **FIX** — Throw on missing key per CONTEXT D-14, OR add `// reason:` block per IN-03 convention. Operator default = throw-on-missing-key (loud failure preferred). |
| **IN-02** | `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:169` | `((body.error ?? body.msg ?? body.details) as string \| null) ?? null` is fragile (type-assert hides non-string runtime values) | **INTACT at HEAD line 169:** exact pattern present: `errorMsg: keysConfigured ? null : ((body.error ?? body.msg ?? body.details) as string \| null) ?? null`. | **FIX** — Replace with explicit `typeof` checks per CONTEXT D-14 + 73-REVIEW fix snippet. |
| **IN-03a** | `tests/tests/specs/candidate/candidate-questions.spec.ts:34-36` | `getByTestId(testIds.candidate.questions.list)` — could be `getByRole('list')` | **INTACT at HEAD line 34:** `const questionsList = page.getByTestId(testIds.candidate.questions.list);` — combined with `.or(startButton)` at line 38. **Note: Phase 74/75/77 added a lot of new candidate-questions content but the original CAND-05 test block was NOT refactored.** | **FIX or `// reason:` BLOCK** — Replace with `getByRole('list')` (semantic, unambiguous given the test's intent of finding the questions list region) OR add `// reason:` if testId is stable+specific. Default per D-20 = semantic. |
| **IN-03b** | `tests/tests/specs/candidate/candidate-settings.spec.ts:64` (original location at Phase 73 review time) | `getByTestId(testIds.candidate.home.statusMessage)` — could be `getByRole('status')` if element has `role="status"` | **INTACT at HEAD line 65:** `await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({ timeout: 15000 });` — line shifted by +1 from Phase 73 (file grew ~600 lines via Phase 77 P01's 10 SETTINGS-01 wave A cells; original CAND-15 region preserved). | **FIX or `// reason:` BLOCK** — Audit whether the underlying component has `role="status"`. If yes → `getByRole('status', { name: /…/ })`; if no → add `// reason:` block. |
| **IN-03c** | `tests/tests/specs/voter/voter-results.spec.ts:170` | `page.getByTestId('entity-list-filter')` — could be `getByRole('button', { name: /filter/i })` | **INTACT at HEAD line 171:** `const filterButton = page.getByTestId('entity-list-filter');` (line shifted by +1). | **FIX or `// reason:` BLOCK** — Default = semantic locator unless `name: /filter/i` is ambiguous in this surface (it shouldn't be — only one filter button). |
| **IN-03d** | `tests/tests/specs/voter/voter-results.spec.ts:219` | Same pattern, second use site | **INTACT at HEAD line 220:** identical pattern. | **FIX or `// reason:` BLOCK** — Same as IN-03c. Consider extracting `getFilterButton(page)` helper to dedupe across 3 sites. |
| **IN-03e** | `tests/tests/specs/voter/voter-results.spec.ts:277` | Same pattern, third use site | **INTACT at HEAD line 277:** identical pattern. | **FIX or `// reason:` BLOCK** — Same as IN-03c. Triple-site repetition argues for helper extraction. |
| **IN-04** | `tests/tests/specs/voter/voter-results.spec.ts:206-211` | Trivial `toBeLessThanOrEqual(initialCount)` filter assertion — satisfied even if filter no-ops | **INTACT at HEAD lines 207-212:** unchanged. Comment at lines 202-206 explains the Phase 64 D-11+D-12 hardening rationale; the assertion's contract is genuinely weak. | **FIX** — Strengthen per CONTEXT D-14 + Phase 73 review fix recommendation. Options: (a) compute expected filtered count from seed dataset (e2e has 4 parties — filtering by 1 should give ≤25% of initialCount); (b) `toBeLessThan(initialCount)` if filter MUST narrow. Recommended: (b) with explanatory comment. |
| **IN-05** | `tests/tests/setup/data.setup.ts:144-146` | `expect(true, 'forceRegister reached post-condition').toBe(true)` — tautological | **INTACT at HEAD lines 143-146:** unchanged. Lines 144-145 reference `forceRegister`'s throw-on-error contract; line 146 has the tautology. | **FIX** — Replace with semantic post-condition check per CONTEXT D-14: `const candidate = await client.findData('candidates', {externalId: {$eq: 'test-candidate-alpha'}}); expect(candidate.data?.[0]?.auth_user_id).toBeTruthy();`. |

**Audit summary:** **13 of 13 findings INTACT at HEAD.** Zero auto-fixes by Phases 74/75/76/77. Every Plan 06 edit will be a fresh fix-or-justify against intact code.

**Bonus finding:** Phase 73 review CR-01 (`multi-election.spec.ts:250` still uses `waitUntil: 'networkidle'` with `playwright/no-networkidle` at `'error'`) — **STILL INTACT at HEAD line 250**. CONTEXT D-14 / D-01 do NOT explicitly call CR-01 out (focus is on CR-02). This is either a missed item from Phase 73 close OR a deliberate Phase 78 candidate. **See §Risks & Landmines for treatment recommendation.**

---

## Auth-Setup Race (WR-04) ↔ Phase 76 Deferred-Items Cross-Reference

**Critical disambiguation — these are TWO DIFFERENT defects despite both touching auth.setup.ts.**

### WR-04 (Phase 73 review finding — Plan 06 closes this)

**File:** `tests/tests/setup/auth.setup.ts:29-48` (Phase 73 review cited lines 35-46; HEAD lines 29-48 confirmed intact).

**Defect:** **Code-quality** — wasted `page.reload()` in the retry loop. The retry pattern is:
```ts
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  await page.goto(loginRoute, ...);   // line 30
  try { ... return; }
  catch { await page.reload(...); }   // line 38 — immediately replaced by next iter's goto
}
```

The `reload()` is functionally a no-op (next iteration's `goto()` replaces it). Not a correctness bug — just dead work. Plan 06 WR-04 fix per CONTEXT D-14: drop the reload, or hoist goto out of the loop and let reload BE the retry mechanism.

**Impact on cascade:** **NONE.** This fix does NOT resolve the auth-setup test failures Phase 76/77 documented.

### Phase 76 Deferred-Items #2 (the actual cascading race — NOT in Phase 73 review)

**File:** `tests/tests/specs/candidate/candidate-profile.spec.ts:85-145` (the `should register the fresh candidate via email link` test). After registration, the URL re-redirects to `/login` with "Your password is now set!" heading; the `loginIfRedirectedToLoginPage` helper attempts manual login but the subsequent ToU checkbox never surfaces.

**Defect:** **Functional cascade** — registration test fails deterministically in dev shells (Phase 76 P01 + P02 + Phase 77 ALL confirm `--no-deps` workaround needed). Because the host file uses `test.describe.configure({ mode: 'serial' })`, ALL subsequent tests in that describe block cascade-SKIP with "did not run", which in turn cascades through the Playwright project graph: `data-setup → auth-setup → candidate-app → candidate-app-mutation → re-auth-setup → candidate-app-settings → candidate-app-password`.

This is what Phase 77 P05 SUMMARY refers to as "the upstream auth-setup race cascade" — the name is misleading; the actual failure is in `candidate-profile.spec.ts` (post-set-password redirect race), NOT in `auth.setup.ts` itself.

**Impact on cascade:** **HIGH.** This is what kept Phase 76 + Phase 77 from regen'ing parity-script constants. Resolving this is what would auto-flip 43+ tests in the inheritance chain.

### Key implication for Phase 78 Plan 06

**WR-04 does NOT resolve the cascade.** The cascade resolution path is:
1. Either fix `candidate-profile.spec.ts:85-145` post-set-password redirect (out of CLEAN-05 scope — operator-routed per Phase 77 P05 SUMMARY §"Human Verification Needed" item 5).
2. OR plan for the cascade to persist and treat Plan 07 parity-script regen as the v2.10+ candidate that Phase 76/77 deferred.

**Phase 77 P05 SUMMARY explicitly routed this triage to "Phase 78 hygiene" as Option A** (item 5). **CONTEXT.md (Phase 78) does NOT scope this in.** Phase 78's CLEAN-05 close per ROADMAP SC #5 acceptance (g) and CONTEXT D-18 anticipates:
- PASS_LOCKED grows by 16 (the voter-fixture race tests).
- DATA_RACE shrinks by 16.
- The cascading **candidate-app cluster STILL FAILS** (Phase 76 P04 documented 43-regression set).

**Recommendation for OPEN QUESTION resolution at PLAN.md time:** Plan 06 closes WR-04 as a code-quality fix. The candidate-profile.spec.ts:85-145 registration race is **NOT** folded into Plan 06; it's a Phase 78 LANDMINE flagged separately. Plan 07's parity-script regen handles ONLY the voter-fixture-race resolution (+16 / −16). The candidate-app cascade persists per Phase 76 P04 architectural decision precedent — Plan 07 documents this as DEFERRED-WITH-RATIONALE inheritance, NOT as a Phase 78 regression.

---

## Phase 77 P01 Deferred-Cell Disposition Recommendation

**Source:** `77-01-SUMMARY.md` §"PRODUCT-GAP cells — surfaced not fixed" + "Phase 78 CLEAN-N candidate" callout.

### The defect (production frontend)

3 SETTINGS-01 wave A cells (`header.showFeedback`, `header.showHelp`, `notifications.voterApp`) PASS-WITH-DEFERRAL because the production frontend has a **non-reactive read** of `$appSettings` at component-mount:

- `(voters)/+layout.svelte:65-69` — `topBarSettings.push(...)` fires in script body at mount; reads `$appSettings.header.*` ONCE.
- `(voters)/+layout.svelte:43-50` — `onMount(() => popupQueue.push(...))` reads `$appSettings.notifications.voterApp?.show` ONCE.
- `appContext.svelte.ts:74` — `appSettingsValue` `$state` initialized with static defaults from `dynamicSettings.ts`.
- `appContext.svelte.ts:94-100` — `$effect` merges `page.data.appSettingsData` AFTER mount.

The mount-time read captures the static defaults BEFORE the `$effect` merges runtime values, so the test override never lands in the DOM.

### Recommendation

**DO NOT fold into Phase 78 Plan 06.** Rationale:

1. **Scope boundary mismatch.** Plan 06's defined surface is test-file fixes (CR-02 + 7 WR + 5 IN). Adding a production-frontend reactivity refactor breaks the bundled-hygiene-trio shape and adds Svelte 5 architectural risk that doesn't fit Phase 78's hygiene scope.

2. **CONTEXT D-01 lists 7 plans** — no CLEAN-06 slot exists. Adding production reactivity work to Plan 06 either bloats Plan 06 past its per-plan ceiling OR requires a new plan that violates D-01's locked count.

3. **Effort estimate.** Refactoring `topBarSettings.push` + `onMount popupQueue.push` to react to `$appSettings` via `$effect` (or gating Banner button rendering on `$appSettings.header.*` directly) is non-trivial — likely 30-60 LOC across `(voters)/+layout.svelte` + adjacent components + new test cells.

4. **Severity is medium, not gating.** The 3 cells PASS-WITH-DEFERRAL with explicit rationale in `77-01-SUMMARY.md` — they don't block CI; they document a known product-gap.

5. **The fix interacts with Phase 76/77's broader appContext init-order story.** Combining with Phase 78's hygiene-only scope risks coupling.

**Recommended routing:** File a new pending todo at `.planning/todos/pending/2026-05-12-voters-layout-non-reactive-appsettings.md` and route to **v2.10+ a11y/UX milestone candidate** (alongside the 4 PRODUCT-GAP todos Phase 77 P05 already filed). Operator-approve at Phase 77 Task 5 checkpoint; flag in Phase 78 P07 VERIFICATION.md "Out of scope" section.

**OPEN QUESTION (to be RESOLVED at PLAN.md time):** Confirm routing path — Phase 78 P06 (NOT recommended) vs v2.10+ (recommended). See §Open Questions Q3.

---

## CLEAN-01 Concrete Rename Map (script-by-script + alias forwarder shape)

**Verified at HEAD — current `package.json` scripts block (lines 3-39):** [VERIFIED: /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/package.json]

```json
"dev:start": "yarn build && yarn supabase:start && yarn workspace @openvaa/frontend dev",
"dev:down": "yarn supabase:stop",
"dev:stop": "yarn supabase:stop",
"dev:reset": "yarn supabase:reset",
"dev:reset-with-data": "yarn supabase:reset && yarn dev:seed --template default",
"dev:seed": "yarn workspace @openvaa/dev-seed seed",
"dev:seed:teardown": "yarn workspace @openvaa/dev-seed seed:teardown",
"dev:status": "yarn supabase:status",
```

### Target shape (Plan 01 deliverable)

| Old `dev:*` (alias kept; emits warning) | New `db:*` (canonical) | Body (post-rename) |
|------|------|------|
| `dev:start` | `db:start` | `yarn build && yarn supabase:start && yarn workspace @openvaa/frontend dev` |
| `dev:down` | `db:down` | `yarn supabase:stop` |
| `dev:stop` | `db:stop` | `yarn supabase:stop` |
| `dev:reset` | `db:reset` | `yarn supabase:reset && yarn dev:clean` ⚠️ NEW chain |
| `dev:reset-with-data` | `db:reset-with-data` | `yarn supabase:reset && yarn db:seed --template default && yarn dev:clean` ⚠️ NEW chain |
| `dev:seed` | `db:seed` | `yarn workspace @openvaa/dev-seed seed` |
| `dev:seed:teardown` | `db:seed:teardown` | `yarn workspace @openvaa/dev-seed seed:teardown` |
| `dev:status` | `db:status` | `yarn supabase:status` |
| (none) | `dev:clean` | `rm -rf apps/frontend/.svelte-kit apps/frontend/node_modules/.vite` |

### Alias forwarder shape (CONTEXT D-02 — kept-with-deprecation-warning)

Per CONTEXT D-02 + RESEARCH §Specifics line 425:

```json
"dev:reset": "echo '[deprecated] yarn dev:reset is now yarn db:reset; alias preserved for back-compat — will be removed after v2.10' >&2 && yarn db:reset"
```

Apply this shape to all 8 renamed `dev:*` scripts. **Note: `dev` (top-level dev server) STAYS UNCHANGED** per source todo "Keep `yarn dev` as-is — that one truly *is* the dev server."

### CI workflow scan (CONTEXT D-04)

**Verified at HEAD via grep:** No `.github/workflows/*.yml` references to `dev:reset` / `dev:seed` found. Plan 01 confirms with a fresh grep + updates any introduced post-scout.

### Documentation updates (Plan 01 deliverable)

- **`CLAUDE.md` §"Supabase Commands"** (line 47-54 region) — sync table with new `db:*` names; add `dev:clean` entry; mark old `dev:*` as deprecated aliases.
- **`CLAUDE.md` §"Development Commands"** — `yarn dev:reset-with-data` → `yarn db:reset-with-data` (alias preserved for back-compat).
- **`.planning/` cross-references** — preserved-via-alias; no required updates (aliases warn-and-forward).

---

## CLEAN-02 Redirect Insertion Point Audit (+layout.ts vs +layout.server.ts)

### Discovery 1 — Actual route layout

**CRITICAL CORRECTION:** CONTEXT D-06 references `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/+layout.ts`. **The `[[lang=locale]]` prefix does NOT exist in the actual route tree.** Verified at HEAD: [VERIFIED: `find apps/frontend/src/routes`]

Actual paths:
- `apps/frontend/src/routes/(voters)/(located)/+layout.ts` ✅ EXISTS (91 lines)
- `apps/frontend/src/routes/(voters)/(located)/+layout.svelte` ✅ EXISTS
- `apps/frontend/src/routes/(voters)/elections/+page.svelte` + `+page.ts` ✅ EXISTS (selector consumer)
- `apps/frontend/src/routes/(voters)/constituencies/+page.svelte` + `+page.ts` ✅ EXISTS

Locale handling is via Paraglide (`$lib/paraglide/runtime`), not route param. The `getLocale()` call at `(voters)/(located)/+layout.ts:21` retrieves locale from Paraglide runtime.

### Discovery 2 — Existing redirect machinery at `(voters)/(located)/+layout.ts`

The located-route layout ALREADY contains a redirect path [VERIFIED: file lines 20-90]:

```ts
export async function load({ fetch, parent, untrack, url }) {
  const lang = getLocale();
  let electionId, constituencyId;
  untrack(() => ({ electionId, constituencyId } = parseParams({ url })));

  if (!electionId || !constituencyId) {
    const { appSettingsData, constituencyData, electionData } = await parent();
    // ... build temporary DataRoot for implication
    if (!electionId) {
      electionId = getImpliedElectionIds({ appSettings, dataRoot, ... });
      if (!electionId) {
        redirect(307, buildRoute({ route: 'Elections', locale: lang }));   // ⚠️ existing redirect — no ?next= param
      }
    }
    if (!constituencyId) {
      constituencyId = getImpliedConstituencyIds({ dataRoot, ... });
      if (!constituencyId) {
        redirect(307, buildRoute({ route: 'Constituencies', electionId, locale: lang }));
      }
    }
  }
  // ... loads question/nomination data
}
```

**Implication for Plan 02:** The redirect mechanism is ALREADY in place. CLEAN-02 is a **minimal augmentation**: thread `?next=<encoded url.pathname + url.search>` through the existing `redirect(307, …)` calls and have the selector pages read it on submit.

### Insertion point decision (CONTEXT D-06 + audit)

**Recommended: keep gate in `(voters)/(located)/+layout.ts`** (`load` function — universal, runs on both server and client). Rationale:
1. **Already the canonical redirect site.** No file relocation needed.
2. **Universal `+layout.ts` (NOT server-only `+layout.server.ts`) is correct** because the selector state (voter context's `selectedElections`/`selectedConstituencies`) is reactive client-side state, not server-side cookie-only state. The existing implementation already uses `parseParams({ url })` (URL state) + `parent()` data (server-fetched seed data) — `+layout.ts` is the right level.
3. **No SSR security concern.** Open-redirect protection is handled by Plan 02's URL whitelist regex; the redirect itself is to internal `/elections` or `/constituencies` (not user-controlled).

### Plan 02 minimal-diff sketch [CONFIRMED by audit of HEAD layout]

```ts
// In (voters)/(located)/+layout.ts at line 44 (existing redirect site):
if (!electionId) {
  const next = encodeURIComponent(url.pathname + url.search);
  // Whitelist: voter-app routes only (path starts with locale OR root-relative voter route)
  const isVoterRoute = /^\/[a-z]{2}\/.*|^\/(results|questions|nominations)/.test(url.pathname);
  const target = isVoterRoute
    ? `${buildRoute({ route: 'Elections', locale: lang })}?next=${next}`
    : buildRoute({ route: 'Elections', locale: lang });
  redirect(307, target);
}
// Similar pattern for the constituencies redirect at line 60-66.
```

### Selector-side `?next=` consumption (Plan 02 deliverable)

Per CONTEXT canonical_refs lines 297-298, the selector consumers are:
- `apps/frontend/src/routes/(voters)/elections/+page.svelte` — needs handler edit to read `url.searchParams.get('next')` and pass through to constituencies redirect.
- `apps/frontend/src/routes/(voters)/constituencies/+page.svelte` — needs handler edit to `goto(decodeURIComponent(next))` after successful selection (with whitelist re-check).

### E2E coverage scope (CONTEXT D-07)

New `tests/tests/specs/voter/voter-not-located-redirect.spec.ts` covering the 4 cases:
1. Direct link to `/results/X` with no election picked → bounce twice → final URL = `/results/X`.
2. Multi-election + multi-const → bounce twice → final URL preserved.
3. Single-election (auto-implied) + multi-const → bounce only to constituency → final URL preserved.
4. Refresh on located route after localStorage cleared mid-session → bounce → resume.

Title prefix per LANDMINE: `'CLEAN-02 — '` (avoids IMGPROXY_TIED_TITLES collision per CONTEXT D-20 inheritance).

---

## CLEAN-03 Per-cast Categorization (13 cast sites + reason-text per category)

### Cast site inventory [VERIFIED via grep at HEAD]

**13 cast sites confirmed at `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`:**

| Line | Cast | Category | Recommended `// reason:` |
|------|------|----------|--------------------------|
| 105 | `raw.publisherLogo as Json as unknown as StoredImage \| null` | **Image** (typed shape) | `// reason: JSONB → StoredImage; runtime-guarded by parseStoredImage downstream.` |
| 106 | `raw.poster as Json as unknown as StoredImage \| null` | **Image** | Same as line 105. |
| 107 | `raw.candPoster as Json as unknown as StoredImage \| null` | **Image** | Same. |
| 158 | `row.image as Json as unknown as StoredImage \| null` | **Image** | Same. |
| 191 | `row.image as Json as unknown as StoredImage \| null` | **Image** | Same. |
| 214 | `row.image as Json as unknown as StoredImage \| null` | **Image** | Same. |
| 324 | `row.image as Json as unknown as StoredImage \| null` | **Image** | Same. |
| 355 | `row.entity_image as Json as unknown as StoredImage \| null` | **Image** | Same. |
| 356 | `row.entity_answers as Json as unknown as LocalizedAnswers \| null` | **Answers** | `// reason: JSONB → LocalizedAnswers; structural guard applied inside parseAnswers.` |
| 451 | `row.image as Json as unknown as StoredImage \| null` | **Image** | Same as line 105. |
| 452 | `row.answers as Json as unknown as LocalizedAnswers \| null` | **Answers** | Same as line 356. |
| 482 | `row.image as Json as unknown as StoredImage \| null` | **Image** | Same. |
| 532 | `row.image as Json as unknown as StoredImage \| null` | **Image** | Same. |

**Distribution:** 11 image casts (StoredImage shape) + 2 answer casts (LocalizedAnswers shape). All 13 are `Json → unknown → typed-shape` triple-casts followed by a runtime-guarding parse function (`parseStoredImage` or `parseAnswers`). No "settings / metadata" casts found at HEAD — CONTEXT D-08's "remaining ~6 sites" anticipation is moot; the cluster reduces to a binary image-vs-answers categorization.

**Grep gate (Plan 03a acceptance):** `grep -cE "^\s*// reason:" supabaseDataProvider.ts ≥ 13`.

### CLEAN-03b — `getRoute.svelte.ts:41` refactor [VERIFIED at HEAD lines 1-44]

Current code:
```ts
const store = writable<RouteBuilder>(buildFn());
const setStore = (store as { set: (v: RouteBuilder) => void }).set;   // line 41 — structural cast
afterNavigate(() => setStore(buildFn()));
return store;
```

**Why the cast exists:** The function returns `Readable<RouteBuilder>` (line 35) but internally needs `set` access. `Readable` doesn't expose `set`. The structural cast at line 41 extracts `set` from the underlying `Writable`. (Verified — line 35 signature is `function createGetRoute(): Readable<RouteBuilder>`.)

**Plan 03b fix (CONTEXT D-09 Option 2 default):**
```ts
const store = writable<RouteBuilder>(buildFn());
afterNavigate(() => store.set(buildFn()));   // inline use — no setter extraction needed
return store;
```

Direct call to `store.set` inside the `afterNavigate` closure. The `store` variable is locally a `Writable<RouteBuilder>` (type inferred from `writable(...)` call), so `set` is accessible without the cast. The return type `Readable<RouteBuilder>` enforces the public contract.

**Alternative options preserved in CONTEXT D-09:** (1) Direct assignment with explicit typing; (3) `store.update()` semantic. Default = (2) per CONTEXT.

### CLEAN-03c — CLAUDE.md anchor [Per CONTEXT D-10]

New sub-section under `## Important Implementation Notes`:

```markdown
### Svelte Warning-Accepted Format

When a Svelte / vite-plugin-svelte / SvelteKit warning is intentionally accepted (rather than fixed at the source), use this inline format:

// svelte-warning: accepted — <one-sentence-rationale>

Place the comment IMMEDIATELY ABOVE the warning-triggering line. Rationale should explain WHY the warning is accepted (e.g., "framework-emitted false positive for prop reassignment in init phase"). Per v2.8 Phase 70 Cat A convention.
```

Anchor location: after the existing "Context Destructuring Rule (Svelte 5)" sub-section (~line 200 of CLAUDE.md).

---

## CLEAN-04 i18n TranslationKey Audit (current surface + coverage gaps)

### Current `t()` signature [VERIFIED at HEAD: apps/frontend/src/lib/i18n/wrapper.ts]

```ts
// wrapper.ts (40 lines total)
export function t(key: string, params?: Record<string, unknown>): string {   // line 16
  const override = getOverride(key, params);
  if (override !== undefined) return override;
  const messageFn = (m as unknown as MessageModule)[key];
  if (typeof messageFn === 'function') {
    try { return messageFn(params); }
    catch (e) { logDebugError(e); return key; }
  }
  return key;   // fallback: key as string if not found
}
t.get = t;   // line 40 — alias
```

### TranslationKey union [VERIFIED at HEAD: apps/frontend/src/lib/types/generated/translationKey.ts]

- **592 lines** in the generated file
- Header: `/** Auto-generated by `/frontend/tools/translationKey/generateTranslationKeyType.ts` */`
- Shape: `export type TranslationKey = | 'about.content' | 'about.feedback.title' | ...` — pure string-literal union.
- **First 30 keys verified** — span `about.*`, `adminApp.argumentCondensation.*` keys.
- Generator location: `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` (referenced by header).

**Plan 04 acceptance gate:** Generator must run in build pipeline. Verify at Plan 04 PLAN.md time whether `yarn build` triggers it (e.g., via Turborepo dep graph or a pre-build hook).

### `t.get` alias audit [VERIFIED via grep at HEAD]

**Decision: SAFE TO DELETE.**

Grep results across `apps/frontend/src/` AND `tests/`: **ZERO consumer references found.** The only match for `t\.get` in the entire codebase is the declaration itself at `wrapper.ts:40`. All other matches in the grep output are unrelated (`getCandidate`, `getElement`, etc. — false-positive substring matches).

**Implication for CONTEXT D-11:** The "three outcomes" (zero / 1-5 / >5 consumers) collapses to "zero consumers" → **unconditional delete** is safe. No PASS-WITH-DEFERRAL needed. The `Default disposition: planner picks at PLAN.md time after grep audit. RECOMMENDED: delete-if-zero-consumers (likely outcome per source todo's "either delete it; if consumers exist, rewrite" language)` resolves to the recommended path.

### Plan 04 deliverable shape

1. **Tighten `t()` signature** at `wrapper.ts:16`:
   ```ts
   import type { TranslationKey } from '$lib/types/generated/translationKey';
   export function t(key: TranslationKey, params?: Record<string, unknown>): string { … }
   ```
2. **Delete `t.get = t;`** at line 40 (zero consumers verified).
3. **Add `@ts-expect-error` regression-locker** in `apps/frontend/src/lib/i18n/tests/translations.test.ts`:
   ```ts
   test('TranslationKey type prevents missing keys at compile-time', () => {
     // @ts-expect-error — 'definitely.not.a.real.key' is not a TranslationKey
     t('definitely.not.a.real.key');
     expect(true).toBe(true);   // smoke; the real assertion is the compiler.
   });
   ```
4. **Re-validate E2E-08 spec** at `tests/tests/specs/voter/voter-locale-switching.spec.ts` against tightened wrapper (Phase 74 D-06 Order B per CONTEXT D-12 + D-16).

### Coverage gaps in TranslationKey union [LOW confidence — based on file size + Phase 74 P01 finding]

Phase 74 P01 SUMMARY recorded: "lang.<locale> i18n keys discovered unwired (surfaced for Phase 78 CLEAN-04)". The generator may produce a complete TranslationKey union but consumers may use keys that aren't enumerated (e.g., template-built keys, runtime-overridden keys via `getOverride`). **CLEAN-04 tightening will surface these as compile errors** — Plan 04 must triage:
- Genuine missing keys (fix the consumer site).
- Template-built keys that must remain `string` (introduce a `t.template(...)` escape hatch or accept `string` at specific opt-in sites).
- Runtime-only keys from overrides (acceptable: `getOverride(key)` works on `string` internally, only the `t()` entry-point signature changes).

**Plan 04 should budget for a discovery + fix pass against compile errors after the signature change** — likely 1-30 sites depending on how disciplined the existing call sites are.

---

## CLEAN-05 --likert-only CLI Plumbing

### Current dev-seed CLI shape [VERIFIED at HEAD: packages/dev-seed/src/cli/seed.ts]

The CLI uses `node:util` `parseArgs` (line 32 + 59-68):

```ts
const { values } = parseArgs({
  options: {
    template: { type: 'string', short: 't' },
    seed: { type: 'string' },
    'external-id-prefix': { type: 'string' },
    help: { type: 'boolean', short: 'h' }
  },
  strict: true,
  allowPositionals: false
});
```

**Existing flag patterns** (relevant precedents for `--likert-only`):
- `--seed <int>` (integer override, parsed via `Number.parseInt`).
- `--external-id-prefix <string>` (string override).
- `--template <name>` (resolved via `resolveTemplate`).
- `--help / -h` (boolean short-circuit).

### Plan 05 deliverable shape (CONTEXT D-13)

**CLI plumbing — extend `parseArgs` options at `seed.ts:60-65`:**

```ts
options: {
  template: { type: 'string', short: 't' },
  seed: { type: 'string' },
  'external-id-prefix': { type: 'string' },
  'likert-only': { type: 'boolean' },   // NEW
  help: { type: 'boolean', short: 'h' }
}
```

**Template override — extend `packages/dev-seed/src/templates/e2e.ts`:**

Current e2e.ts has the question definitions inline (verified — singleChoiceOrdinal questions span lines 327-522 in `questions.fixed[]`; non-ordinal types appear at lines 432 (text), 544 (singleChoiceCategorical), 576 (boolean), 593/608/623 (text)).

The recommended shape per CONTEXT specifics line 481-489:
```ts
export function buildE2eTemplate(opts: { likertOnly?: boolean } = {}): SeedTemplate {
  const base = { /* ... existing ... */ };
  if (opts.likertOnly) {
    base.questions.fixed = base.questions.fixed.filter(q => q.type === 'singleChoiceOrdinal');
  }
  return base;
}
```

**HOWEVER** — `e2e.ts` currently exports the template object directly, not a builder function. Plan 05 must refactor to a builder function pattern (or use a flag-driven mutation) and update `packages/dev-seed/src/templates/index.ts` to wire `BUILT_IN_TEMPLATES['e2e']` to invoke the builder with the appropriate option.

### Plumbing the flag through

The CLI's `loadBuiltIns()` (seed.ts:150-177) loads `BUILT_IN_TEMPLATES` from `templates/index.js`. To pass `--likert-only` through:

1. `seed.ts` parses the flag (above).
2. After `resolveTemplate(...)` returns the template, if `values['likert-only']` is true AND the template is the e2e built-in, apply the filter.
3. **Cleanest approach:** Add a `templateOptions` parameter to `resolveTemplate` or invoke a per-template `applyOptions(template, { likertOnly })` helper before `runPipeline`.

**Plan 05 minimal-diff sketch:**

```ts
// In seed.ts after resolveTemplate at line 81:
const template = await resolveTemplate(templateArg, builtIns.templates);
if (values['likert-only']) {
  // Filter to singleChoiceOrdinal only (e2e-template-aware mutation)
  if (Array.isArray(template.questions?.fixed)) {
    template.questions.fixed = template.questions.fixed.filter(q => q.type === 'singleChoiceOrdinal');
  }
  // Also restrict opinion-question count to ≤16 if the pool is now smaller
}
```

This avoids the builder-refactor and lets the flag work against any template (graceful no-op if the template doesn't have `questions.fixed`).

### `db:seed` / `db:reset-with-data` flag forwarding

Per CONTEXT D-13, `db:reset-with-data --likert-only` needs to forward the flag through. Verify the package.json wrapper:

```json
"db:reset-with-data": "yarn supabase:reset && yarn db:seed --template default && yarn dev:clean"
```

**Issue:** The default template (`--template default`) is hardcoded here. For `--likert-only` use, the operator runs `--template e2e --likert-only` instead:

```bash
yarn supabase:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean
```

**Recommendation:** Plan 05 verifies that `yarn db:seed --template e2e --likert-only` works (the flag propagates via yarn arg-forwarding). If the chain in `db:reset-with-data` blocks flag propagation, document the acceptable invocation per Plan 05 acceptance gate (a). The acceptance gate per CONTEXT decisions D-01 plan 05 reads: `yarn db:reset-with-data --likert-only` (or `db:seed --likert-only` per the CLEAN-01 rename) feeds compatible data. **Either invocation is acceptable**.

### Voter-fixture default [Per CONTEXT D-13 — ≤1 LOC]

`tests/tests/fixtures/voter.fixture.ts` `answeredVoterPage` keeps its Likert-only loop — no code change needed if the seed feeds Likert-only data. The 1-LOC budget per CONTEXT/source-todo covers a possible `// reason:` annotation OR a default-mode toggle if the fixture needs to assert seed-mode preconditions.

---

## Parity-script Regen Math (Plan 07 expected delta)

### Current baseline at HEAD [VERIFIED: tests/scripts/diff-playwright-reports.ts at HEAD]

The parity-script is at Phase 75 baseline (preserved through Phase 76 P04 + Phase 77 P05 architectural decisions per inherited race deferral):

- **PASS_LOCKED: 47** (file lines 95-144 — 47 entries enumerated; CASCADE-baseline counts include data-setup, candidate-app, voter-* projects)
- **DATA_RACE: 15** (file lines 146-162 — 15 entries; 14 imgproxy-tied tests + 1 dual `re-auth.setup.ts` entry per D-09 binding)
- **CASCADE: 33** (file line 164+ — the variant-project tests blocked by variant-data.setup race)
- **TOTAL TRACKED: 95** tests

### Phase 78 expected delta (CONTEXT D-18 + ROADMAP SC #5 acceptance)

Per CONTEXT D-18 and ROADMAP SC #5 final bullet (c):
- **PASS_LOCKED grows by 16** (the 16 voter-fixture-race tests flip from DATA_RACE → PASS_LOCKED).
- **DATA_RACE shrinks by 16** (same 16 tests).
- **CASCADE unchanged.**

**BUT** — the DATA_RACE pool at Phase 75/77 baseline has only 15 entries (the imgproxy-tied tests). The 16 voter-fixture-race tests live in the **FAILURE-CLASS pool** (not DATA_RACE) per Phase 75 P02b regen documentation (parity-script lines 65-78): "voter-fixture-heterogeneous-question-types race (Phase 78 CLEAN-05 / Path B `--likert-only` seed modifier). Phase 75's NEW spec failures (QSPEC-01 + QSPEC-02) land in this failure-class with explicit rationale."

**Reconciliation needed at Plan 07:**

Per the parity-script's regen-script (`regen-constants.mjs`), the failure-class tests are NOT in any pool by design — they're a separate "deterministic-fail-with-rationale" classification. After CLEAN-05 lands, these 16 tests transition:

- **Source:** Failure-class (failing × 3 due to voter-fixture race).
- **Destination:** PASS_LOCKED (passing × 3 after Likert-only seed feeds compatible data).
- **Net effect on PASS_LOCKED:** +16 (47 → 63).
- **Net effect on DATA_RACE:** 0 (still 15 — the imgproxy-tied pool is structurally bound per D-09).
- **Net effect on CASCADE:** 0 (variant-data.setup race not addressed by Phase 78).
- **Net effect on FAILURE-CLASS:** −16 (the QSPEC-01 / QSPEC-02 / voter-* race tests now pass).

### Confounders

1. **Phase 74 / 75 / 77 added new test entries** (E2E-04 selectors, E2E-05 voter answer rendering, E2E-06 skip/delete, E2E-07 SubMatch, E2E-08 locale switching, QSPEC-01/02, A11Y-01/02, SETTINGS-01/02/03). Some are already in PASS_LOCKED post-Phase-75 regen; some inherited the cascade and live in CASCADE.

2. **Phase 76 P04 + Phase 77 P05 DEFERRED their regens.** The 47 PASS_LOCKED count is Phase 75's baseline; Phase 76 + 77 did NOT regen because the cold-start gate would have captured a degraded 4-PASS_LOCKED baseline due to the candidate-profile.spec.ts:85-145 registration race cascade.

3. **The candidate-profile registration race is NOT in Phase 78 scope.** Plan 07's regen will run against the same degraded cold-start baseline UNLESS the operator routes the registration race triage into Plan 06 (NOT recommended — see §"Auth-Setup Race ↔ Phase 76 Deferred-Items Cross-Reference" above).

### Realistic Plan 07 outcome

**Optimistic path (everything works):** PASS_LOCKED 47 → 63 (+16 from voter-fixture race resolution); DATA_RACE preserved at 15; CASCADE unchanged; FAILURE-CLASS −16. **PARITY GATE: PASS.**

**Pragmatic path (candidate-profile race STILL cascades):** Cold-start gate captures the same degraded baseline Phase 76/77 saw (4 PASS_LOCKED on candidate-app cluster). Plan 07 inherits the architectural decision: **DEFER constants regen WITH RATIONALE** per Phase 76 P04 precedent. The 16 voter-fixture tests still pass, but the regen can't lock in PASS_LOCKED += 16 because that would require a healthy cold-start baseline that doesn't yet exist.

**Plan 07 must document either outcome:**
- If cold-start captures a healthy 47+ PASS_LOCKED baseline → regen + PARITY GATE: PASS.
- If cold-start captures Phase 76 P04's degraded 4-PASS_LOCKED baseline → DEFER regen per inheritance pattern; record voter-fixture-race resolution as a per-spec smoke proof (Plan 05's per-plan smoke evidence).

**This is the canonical Phase 78 LANDMINE for Plan 07.** Operator decision at Plan 07 close.

---

## Risks & Landmines

### LANDMINE-1: Phase 73 CR-01 (multi-election.spec.ts:250 `networkidle`) NOT explicitly scoped

**Severity:** MEDIUM.

**Discovery:** Phase 73 review listed TWO critical issues — CR-01 (`networkidle` violates `playwright/no-networkidle: error` lint) and CR-02 (voter-popups false-positive PASS). CONTEXT D-01 / D-14 list ONLY CR-02 + 7 WR + 5 IN = 13 findings. CR-01 is missing.

**HEAD audit confirmed:** Line 250 still contains `await sharedPage.reload({ waitUntil: 'networkidle' });`. Either:
- (a) Phase 73 close silently auto-passed CR-01 via the bumped lint rule's enforcement (unlikely — would have caused CI fail).
- (b) Phase 73 close accepted CR-01 inline with a `// reason:` block (verify by reading the surrounding code).
- (c) CR-01 was missed.

**Action:** Plan 06 audits line 250 at PLAN.md time. If `// reason:` already exists, no-op. If still violating `error`-level lint, FIX inline as part of WR-03 cluster (the surrounding lines 215-231 are already in Plan 06 scope).

### LANDMINE-2: candidate-profile.spec.ts:85-145 registration race NOT in Phase 78 scope

**Severity:** HIGH (for parity-script regen).

Cross-reference: Phase 76 deferred-items #2 + Phase 77 P05 SUMMARY item 5.

**The cascade defect that Phase 76/77 deferred is NOT what WR-04 fixes.** WR-04 is a code-quality wasted-reload fix in `auth.setup.ts`. The cascade-causing defect is in `candidate-profile.spec.ts:85-145` (the registration test's post-set-password redirect race).

**Per Phase 77 P05 SUMMARY:** Operator may add this as a new Phase 78 CLEAN-N requirement (Option A — recommended). **CONTEXT.md does NOT scope this in.** Plan 06 budget per CONTEXT is the 13-finding sweep, not a 14th finding.

**Action:**
- **NOT recommended:** Stretch Plan 06 to include candidate-profile.spec.ts:85-145 fix.
- **Recommended:** File explicit Phase 78 OPEN QUESTION; default-route to v2.10+ a11y/UX milestone candidate; Plan 07 documents inheritance per Phase 76 P04 precedent.

### LANDMINE-3: Phase 77 P01 deferred-cells production refactor NOT in Phase 78 scope

**Severity:** LOW (medium-term — product-gap, not blocker).

Cross-reference: Phase 77 P01 SUMMARY §"PRODUCT-GAP cells — surfaced not fixed".

**Per §"Phase 77 P01 Deferred-Cell Disposition Recommendation" above:** route to v2.10+ a11y/UX milestone, NOT Plan 06.

### LANDMINE-4: e2e.ts template has non-Likert questions at sorts 17+

**Severity:** MEDIUM (for Plan 05 acceptance gate).

**Discovery:** [VERIFIED via grep at HEAD: packages/dev-seed/src/templates/e2e.ts]
- 16 singleChoiceOrdinal questions at sorts 1-16 (Q-types verified at lines 327, 339, 351, 363, 376, 388, 400, 412, 444, 455, 466, 477, 489, 500, 511, 522).
- text question at line 432 (sort 9 region — info question, not opinion — `category_type: 'info'`).
- singleChoiceCategorical at line 544 (likely sort 17 — Phase 74 P05 addition `test-question-directional-1`).
- boolean at line 576 (likely sort 18 — Phase 75 P01 `test-question-boolean-1`).
- text questions at lines 593, 608, 623 (info questions for Phase 76/77 additions — `test-question-info-*`).

Per Phase 77 P05 SUMMARY: e2e template currently has 23 questions (22 prior + 1 Plan 02 `test-question-number-1` at sort 22).

**Implication for Plan 05:** The `--likert-only` filter restricts to `q.type === 'singleChoiceOrdinal'`. This correctly excludes:
- The categorical at sort 17 (`singleChoiceCategorical`).
- The boolean at sort 18 (`boolean`).
- The number at sort 19/22 (`number` — Phase 77).
- All info questions (`text` type, `category_type: 'info'`).

**But:** Verify the filter handles `category_type: 'opinion'` vs `'info'` correctly. The voter-fixture iterates OPINION questions (not info); ordinals are a subset. Plan 05 must ensure the filter:
1. Restricts `questions.fixed` to `category_type: 'opinion' && type: 'singleChoiceOrdinal'` (16 questions).
2. Does NOT exclude info questions (they're needed for the candidate-profile flow per Phase 76 P01 additions).

**Likely correct filter:**
```ts
base.questions.fixed = base.questions.fixed.filter(q =>
  q.category_type !== 'opinion' || q.type === 'singleChoiceOrdinal'
);
```

This keeps all info questions + filters opinion questions to ordinal only.

### LANDMINE-5: IMGPROXY_TIED_TITLES disjointness for new Plan 02 spec

**Severity:** LOW (defensive).

Per CONTEXT carry-forward LANDMINE-5 inheritance: new Phase 78 specs must prefix `'CLEAN-02 '` (or similar phase-scoped prefix) to avoid IMGPROXY_TIED_TITLES collision in the parity-script's 14-suffix-pattern audit. The new spec `voter-not-located-redirect.spec.ts` test titles should all begin with `CLEAN-02 — `.

### LANDMINE-6: Vite-cache wipe ordering for Plan 07

Per CONTEXT D-19 + v2.8-close gotcha: Plan 07 MUST `yarn dev:clean` (or `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit`) BEFORE the 3-run cold-start. If Plan 01 hasn't merged yet at Plan 07's execution time, fall back to the imperative recipe.

### LANDMINE-7: Commit hook bypass

Per memory (`project_gsd_repo_hook_workaround.md`): All Phase 78 commits MUST use `git -c core.hooksPath=/dev/null`. Plan 01-07 SUMMARY commits, task commits, and verification commits inherit this constraint.

### LANDMINE-8: Sentinel value disjointness

Per CONTEXT carry-forward LANDMINE: any new sentinel strings introduced by Plan 02 + Plan 06 spec edits must NOT contain `'Alpha'` substring (collision with the Test Candidate Alpha fixture). Plan 02 + Plan 06 reviewers verify.

### LANDMINE-9: `db:reset-with-data` chain semantics with `--likert-only`

**Severity:** LOW (Plan 05 acceptance gate).

Per CONTEXT D-03: `db:reset-with-data` chains `dev:clean` after the supabase reset + seed. If `--likert-only` is appended to the chain command, yarn arg-forwarding behavior in shell-`&&` chains may NOT propagate to the middle command (`yarn db:seed --template default`). Plan 05 must:
- Verify `yarn db:reset-with-data --likert-only` actually forwards `--likert-only` to the inner `db:seed` call (test empirically).
- If forwarding breaks, document the canonical invocation as `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean` (manual chain). Plan 05 acceptance gate (a) accepts either form.

---

## Open Questions (RESOLVED)

### Q1: Should Plan 06 split into 06a (CR+WR) + 06b (IN)?

**RESOLVED: Default (bundled — 1 Plan 06) adopted. 13 findings + bonus CR-01 in one plan per RESEARCH recommendation; planner confirms file-count = 11, per-file LOC well under 50 — split not warranted.**

**Default per CONTEXT D-01 Claude's Discretion:** 1 bundled Plan 06.

**Recommendation:** **DEFAULT (bundled).** Rationale per HEAD audit:
- All 13 findings are file-level edits in test code, no production-frontend touches.
- The cluster spans 9 files (per CONTEXT D-14 surface clusters); a single plan fits the per-plan ceiling if treated as a group-edit pass.
- Phase 73 review's WR + IN findings overlap surface (variants/setup/utils/specs clusters per D-14).
- The 06a/06b split adds plan-management overhead without proportional benefit.

**Trigger for split:** If at Plan 06 PLAN.md time the planner finds >50 LOC churn per file across >9 files, split. Otherwise bundle.

**Resolution at PLAN.md time:** Default (1 plan) UNLESS file-count > 9 or per-file LOC > 50.

### Q2: How should the candidate-profile.spec.ts:85-145 registration race be handled?

**RESOLVED: Default (OUT OF SCOPE for Phase 78) adopted. Plan 07 documents the cascade as DEFERRED-WITH-RATIONALE per Phase 76 P04 / Phase 77 P05 inheritance. Plan 07 Task 5 files new pending todo `2026-05-12-candidate-profile-cascading-race.md` routing to v2.10+.**

**Default (recommended):** **OUT OF SCOPE for Phase 78.** Plan 07 documents the cascade as DEFERRED-WITH-RATIONALE per Phase 76 P04 inheritance. The parity-script regen at Plan 07 captures voter-fixture-race resolution as per-spec smoke evidence; full-suite PASS_LOCKED += 16 LOCKS IN only if the cold-start baseline is healthy.

**Alternative:** Add as new CLEAN-06 requirement (Phase 77 P05 Option A). Requires:
- Adding a new plan slot (violates CONTEXT D-01 7-plan lock).
- Investigating the post-set-password redirect to /login (non-trivial root-cause investigation).
- Operator approval.

**Resolution at PLAN.md time:** Recommended default unless operator overrides.

### Q3: Should Phase 77 P01's 3 PASS-WITH-DEFERRAL cells (non-reactive topBarSettings/popupQueue) fold into Plan 06?

**RESOLVED: Default (OUT OF SCOPE — route to v2.10+) adopted. Plan 07 Task 5 files new pending todo `2026-05-12-voters-layout-non-reactive-appsettings.md` routing to v2.10+ a11y/UX milestone.**

**Default (recommended):** **OUT OF SCOPE for Phase 78** — route to v2.10+ a11y/UX milestone.

**Rationale:** §"Phase 77 P01 Deferred-Cell Disposition Recommendation" above. Adding production-frontend reactivity refactor to a test-file-only Plan 06 is a scope-boundary violation.

**Resolution at PLAN.md time:** Recommended default. If operator wants this in Phase 78, requires either (a) splitting Plan 06 to add a new sub-plan OR (b) overriding CONTEXT D-01 to expand to 8 plans.

### Q4: Should `t.get = t` alias be deleted unconditionally?

**RESOLVED: Default (unconditional delete) adopted. Plan 04 Task 1 deletes the `t.get = t` alias at wrapper.ts:40 — zero consumers verified.**

**Default (recommended):** **YES, unconditional delete** at Plan 04 close.

**Rationale:** Verified via grep at HEAD — ZERO consumers in `apps/frontend/src/` AND `tests/`. CONTEXT D-11's "consumer-conditional" gating resolves to "zero consumers → delete" trivially.

**Resolution at PLAN.md time:** Confirmed. Plan 04 deletes the alias at `wrapper.ts:40`.

### Q5: How should the dev-seed CLI flag plumb through to e2e.ts template?

**RESOLVED: Default (direct mutation post-resolveTemplate) adopted. Plan 05 Task 1 mutates `template.questions.fixed` inside seed.ts after `resolveTemplate` returns; no e2e.ts builder-refactor.**

**Default (recommended):** **Direct mutation post-resolveTemplate** in `seed.ts` (see §"CLEAN-05 --likert-only CLI Plumbing" above).

**Rationale:** Avoids refactoring `e2e.ts` from a static export to a builder function pattern (which would touch the `BUILT_IN_TEMPLATES` map). The mutation approach works for any template that exposes `questions.fixed` (graceful no-op otherwise).

**Resolution at PLAN.md time:** Confirmed unless Plan 05 author identifies a cleaner pattern via the `Template.options` field (if such a field exists — verify at PLAN.md time).

### Q6: Should CR-01 (multi-election.spec.ts:250 networkidle) be in Plan 06 scope?

**RESOLVED: Default (fold CR-01 into WR-03 cluster) adopted. Plan 06 Task 1 fixes multi-election.spec.ts:250 networkidle alongside WR-03 lines 215-231.**

**Default (recommended):** **YES — fold into WR-03 cluster** at Plan 06.

**Rationale:** Plan 06 already edits multi-election.spec.ts:215-231 (WR-03). Line 250 is 19 lines downstream in the same test body. Fixing it in the same edit costs ~3 LOC additional + makes the file lint-clean against the `playwright/no-networkidle: error` rule (which would otherwise block Plan 06's commit if HEAD currently violates it — verify at PLAN.md time).

**Resolution at PLAN.md time:** Recommended unless `// reason:` block already exists at line 250 (no-op).

### Q7: Should Plan 04 add the `@ts-expect-error` regression-locker to translations.test.ts even if no current consumers test the wrapper's signature?

**RESOLVED: Default (YES) adopted. Plan 04 Task 2 adds `@ts-expect-error` regression-locker to translations.test.ts.**

**Default (recommended):** **YES per CONTEXT D-11.**

**Rationale:** The whole point of CLEAN-04 is to lock the tightening against future regressions. A unit test that asserts a `nonexistent.key` is a compile-time error is the canonical way to do this — without it, a future maintainer could "fix" a typecheck error by loosening the signature back to `string`, undoing CLEAN-04.

**Resolution at PLAN.md time:** Confirmed.

---

## Sources

### Primary (HIGH confidence — verified at HEAD)

- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/78-cleanup-hygiene-phase/78-CONTEXT.md` — full CONTEXT D-01..D-20 + canonical_refs + folded todos.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/78-cleanup-hygiene-phase/78-DISCUSSION-LOG.md` — auto-discussion record.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/REQUIREMENTS.md §CLEAN-01..CLEAN-05` — locked SCs.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/STATE.md` — Phase 77 state, Blockers/Concerns.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/ROADMAP.md` (lines 245-270) — Phase 78 framing + 6 SCs.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/73-determinism-baseline/73-REVIEW.md` — 13 findings (CR-02 + 7 WR + 5 IN) + bonus CR-01.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/76-profile-a11y/deferred-items.md` — auth-setup race cross-reference (item 2).
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/77-settings-matrix-question-customization-gap-fills/77-01-SUMMARY.md` — Phase 77 P01 deferred-cell rationale.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/77-settings-matrix-question-customization-gap-fills/77-05-SUMMARY.md` — Phase 77 verification gate output.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` — operator-locked Path B.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/todos/pending/2026-05-10-rename-package-scripts-dev-to-db.md` — CLEAN-01 source.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/todos/pending/2026-05-10-redirect-unlocated-voter-to-selectors.md` — CLEAN-02 source.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/package.json` — script block (lines 3-39) verified.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes/(voters)/(located)/+layout.ts` — existing redirect machinery verified.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` — structural cast at line 41 verified.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/lib/i18n/wrapper.ts` — `t()` signature + `t.get` alias at line 40 verified.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/lib/types/generated/translationKey.ts` — 592-line TranslationKey union verified.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — 13 cast sites enumerated.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed/src/cli/seed.ts` — parseArgs flag patterns verified.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed/src/templates/e2e.ts` — question-type distribution at sorts 1-22+ verified.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/scripts/diff-playwright-reports.ts` — Phase 75 baseline (47/15/33) verified.
- All 9 Phase 73 review-cited test files at HEAD — each finding's cited line verified intact.

### Secondary (MEDIUM confidence)

- CLAUDE.md project instructions — Context Destructuring Rule, Supabase Commands.
- Memory: `project_gsd_repo_hook_workaround.md`, `feedback_batch_discussions.md`, `feedback_e2e_did_not_run.md`.
- Phase 76 76-04-SUMMARY.md — Constants-regen-deferred-with-rationale pattern (Phase 76 P04 precedent).

### Tertiary (LOW confidence — assumed, not verified)

- `[ASSUMED]` Plan 04's translation key generator (`generateTranslationKeyType.ts`) is invoked by `yarn build` — Plan 04 verifies at PLAN.md time.
- `[ASSUMED]` Yarn arg-forwarding through `&&`-chained scripts preserves the `--likert-only` flag — Plan 05 verifies empirically.

---

## Metadata

**Confidence breakdown:**
- Phase 73 findings audit: HIGH — every cited file:line verified at HEAD.
- CLEAN-01 rename map: HIGH — current package.json scripts block fully enumerated.
- CLEAN-02 redirect insertion: HIGH — existing layout already has redirect machinery; route tree verified (CONTEXT D-06 path corrected — no `[[lang=locale]]` prefix).
- CLEAN-03 cast inventory: HIGH — grep enumerated all 13 sites + binary categorization.
- CLEAN-04 i18n audit: HIGH — `t.get` zero consumers verified via grep across frontend + tests.
- CLEAN-05 voter-fixture race: HIGH — e2e.ts question-type distribution verified.
- Parity-script regen math: MEDIUM — outcome depends on candidate-profile race resolution (out of scope).
- Phase 76/77 cross-references: HIGH — Phase 76 deferred-items + Phase 77 P01/P05 SUMMARY artifacts read in full.
- Open Questions: HIGH — each Q has a clear recommended resolution.

**Research date:** 2026-05-12
**Valid until:** 2026-05-30 (stable; no fast-moving dependencies). Re-validate if Phase 76 / 77 close states change, if any of the 9 test files cited by Phase 73 review get edited before Phase 78 start, or if the parity-script baseline is regenerated by an out-of-band fix.

---

## RESEARCH COMPLETE
