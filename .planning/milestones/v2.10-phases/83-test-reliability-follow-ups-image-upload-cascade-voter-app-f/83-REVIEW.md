---
phase: 83
slug: test-reliability-follow-ups-image-upload-cascade-voter-app-f
status: has-issues
reviewed: 2026-05-13
depth: standard
files_reviewed: 8
files_reviewed_list:
  - tests/tests/pages/candidate/ProfilePage.ts
  - tests/tests/specs/candidate/candidate-profile.spec.ts
  - tests/tests/specs/candidate/candidate-profile-validation.spec.ts
  - tests/tests/specs/voter/voter-matching.spec.ts
  - tests/tests/specs/voter/voter-detail.spec.ts
  - tests/tests/setup/templates/variant-hidden-required.ts
  - tests/scripts/diff-playwright-reports.ts
  - apps/supabase/supabase/config.toml
  - .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/regen-constants.mjs
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
---

# Phase 83 Code Review

## Summary

Phase 83 closes DETERM-06 (image-upload cascade) via the full 4-rung ladder (D-01a selector fix + D-01b 500ms settle delay + D-01c imgproxy re-enable + Rule-2 fill-required-empty), DETERM-07a/b (voter-app flakes) via hydration-completeness guards, and the three Phase 82 advisory follow-ups (WR-01 overlay extend, IN-01 docstring count, IN-02 PASS_LOCKED backfill). All structural contracts are preserved: 94 PASS_LOCKED + **15 DATA_RACE** (Phase 73 D-09 binding intact, IMGPROXY_TIED_TITLES verbatim) + 47 CASCADE = 156 tests, anchored at SHA `d6bfeebdb0…`. Cross-spec coupling for WR-01 (b) is clean — `candidate-required-info.spec.ts` asserts on disabled-attribute presence only (no count assertion), so the additive overlay deletion of `test-question-required-empty-1` is safe. No Critical findings; two Warnings cover comment-fidelity / robustness improvements; four Info items are cosmetic.

## Critical

None.

## Warnings

### WR-01: 500ms `waitForTimeout` in `ProfilePage.uploadImage()` is a fixed-delay race-mask, not a true wait-for-condition

**File:** `tests/tests/pages/candidate/ProfilePage.ts:52`

**Issue:** The D-01b escalation introduces `await this.page.waitForTimeout(500);` before registering the `filechooser` listener. The inline `// reason:` justification cites Phase 76 P01 precedent and the absence of a "public hydration signal on the image-upload button," but a fixed 500ms is fragile under load (slower CI, cold-start jitter, future Vite HMR churn). It also runs unconditionally on every CAND-03 invocation — even after D-01c imgproxy re-enable arguably eliminated the root cause (Phase 82's required-empty gate fully accounts for the post-imgproxy submit failure mode per the SUMMARY's "Smoke 3" finding).

The Phase 83 SUMMARY records that the cascade actually unblocked at D-01c+Rule-2, not D-01b alone. Once the cascade was traced to the Phase 82 save-gate, the 500ms delay is potentially redundant infrastructure that was never reverted/retested in isolation. If a future Phase 70-style refactor moves the file-input click target again, the test will mask the regression for 500ms before failing.

**Fix:** No action required for Phase 83 close — the gate is already green and PASS_LOCKED is locked. For v2.11+, schedule one of:
- Replace with `await this.imageUpload.getByRole('button').first().waitFor({ state: 'visible' })` then read a stable hydration signal (e.g., assert `:not(:disabled)` on the inner button), and drop the timeout.
- After v2.10 ship, run a 1-run smoke with the 500ms removed (keeping D-01a + D-01c + Rule-2) to confirm whether the delay is still load-bearing or merely belt-and-suspenders.

### WR-02: Rule-2 fill step in `candidate-profile.spec.ts` is copy-pasted from `candidate-profile-validation.spec.ts:358-361` — pattern not extracted

**File:** `tests/tests/specs/candidate/candidate-profile.spec.ts:196-202`

**Issue:** The Rule-2 deviation block (`getByLabel(/Required-empty .../).first()` + `.fill(...)` + `.blur()` + wait-for-`toBeEnabled`) duplicates the canonical at `candidate-profile-validation.spec.ts:358-361`. As Phase 83 SUMMARY's "Issue 2" notes, the first version of this Rule-2 fill MISSED the `.first()` / `.blur()` pattern and silently failed; v2 refined to match the canonical. The pattern is now codified in two specs with no shared helper. A third spec adding a required-empty interaction (likely under v2.11+ as more `customData.required:true` rows land) will be the third copy.

This is exactly the "BLUR INVARIANT (Phase 81 D-11)" pattern called out in `candidate-profile-validation.spec.ts:335-338` — a named invariant that should live in one place. The risk surface is moderate: a future Input.svelte refactor changing the multilingual `onchange` vs `oninput` binding (referenced in the BLUR INVARIANT comment) would force a sweep across N copies of this pattern.

**Fix:** v2.11+ candidate for extraction. Move the pattern to a helper, e.g.:
```ts
// tests/tests/utils/multilingualFill.ts
export async function fillMultilingualRequired(
  page: Page,
  labelPattern: RegExp,
  value: string
): Promise<Locator> {
  const input = page.getByLabel(labelPattern).first();
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill(value);
  await input.blur();
  return input;
}
```
Both call sites become one line; the BLUR INVARIANT docstring lives at the helper definition. Out of scope for Phase 83 (Rule-2 deviation already landed; refactor is a v2.11+ hygiene task).

## Info

### IN-01: Stale `__dirname` and source-run path comments in `post-fix/regen-constants.mjs`

**File:** `.planning/phases/83-…/post-fix/regen-constants.mjs:19-22`

**Issue:** The verbatim-copied regen script preserves Phase 73/79-era comments:
- Line 19: `// __dirname is .planning/phases/73-determinism-baseline/post-fix/ — 3 levels up to repo root.` (actual location is `83-…/post-fix/`)
- Line 21-22: `// Phase 79: D-09 instability protocol promoted run-6.json as the canonical regen source` (Phase 83 uses `run-3.json`, set on line 23).

These are stale narrative comments that survive the verbatim copy. They don't affect behavior (`__dirname` resolves correctly at runtime; `reportPath` is set on line 23 to `'run-3.json'`).

**Fix:** Per Phase 79 D-07 binding the script is "preserved verbatim" for self-containment, so updating the comments would technically break that contract. Acceptable as-is. A v2.11+ option: if the script is ever forked/customized rather than copied verbatim, refresh the comments at fork time.

### IN-02: ProfilePage.ts jsdoc paragraph 27-31 still references "Phase 76 P01 / Phase 83 D-01a" as if D-01a alone resolved the issue

**File:** `tests/tests/pages/candidate/ProfilePage.ts:30-33`

**Issue:** The refreshed jsdoc says "The Phase 76 P01 / Phase 83 D-01a fix closes the selector-drift loop." But per the SUMMARY, D-01a alone did NOT close the loop — the actual close required D-01a + D-01b (500ms) + D-01c (imgproxy) + Rule-2 (fill required-empty). The jsdoc reads as if the selector fix was sufficient, which mis-frames the maintenance contract for future readers debugging cold-start failures here.

**Fix:** v2.11+ doc tightening — extend jsdoc with a "Cascade history" paragraph documenting the 4-rung resolution (so a future maintainer who hits a similar TIMEOUT understands the multi-factor root cause, not just the selector drift). Out of scope for Phase 83 verification.

### IN-03: `voter-detail.spec.ts:152` assertion `${expectedPartyCount} parties` is locale-bound to English

**File:** `tests/tests/specs/voter/voter-detail.spec.ts:151-153`

**Issue:** `toContainText(\`${expectedPartyCount} parties\`)` only works when the test runs in `en` locale because the i18n template at `apps/frontend/src/lib/i18n/translations/en/results.json:7` is `"{numParties, plural, =0 {no parties} =1 {1 party} other {# parties}}"`. Finnish/Swedish/other locales would produce different surface strings ("4 puoluetta" / "4 partier" etc.). The voter-app project today runs in `en` by default, so this is fine — but it inherits the same i18n-bound assumption already present at `voter-results.spec.ts:143` (the canonical pattern this borrows from).

This is documented at the top of `candidate-profile-validation.spec.ts:43-49` as a known deferred-todo (`W-03 / qspec-01-i18n-hardening.md`) covering literal English strings in test assertions.

**Fix:** No action — inherits the project-wide deferred i18n-hardening todo. If Phase 78 / CLEAN-04 i18n wrapper tightening ever lands, sweep this assertion alongside the existing ones at `voter-results.spec.ts:143`.

### IN-04: `requiredEmptyInput.blur()` is a Playwright method but inline justification omits the BLUR INVARIANT crossref

**File:** `tests/tests/specs/candidate/candidate-profile.spec.ts:199`

**Issue:** The `.blur()` call uses Playwright 1.28+'s `Locator.blur()` API, which programmatically blurs the focused element. The surrounding comment block (lines 176-195) does mention "blur before submit" but does NOT cross-reference the named "BLUR INVARIANT (Phase 81 D-11 inheritance)" pattern documented in `candidate-profile-validation.spec.ts:335-338`. A maintainer skimming this spec who hasn't read the validation spec won't realize there's a load-bearing reason for `.blur()` (Input.svelte's `onchange` vs `oninput` binding).

**Fix:** v2.11+ doc hygiene — add a one-line crossref in the comment block, e.g.:
```ts
// .blur() fires the `change` event that the `allRequiredFilled` $derived
// listens for (Input.svelte binds onchange, NOT oninput — see
// candidate-profile-validation.spec.ts:335-338 BLUR INVARIANT block).
```
Out of scope for Phase 83.

## Reviewed

- **`tests/tests/pages/candidate/ProfilePage.ts`** — D-01a selector fix (`imageArea.getByRole('button').first()`) is correct; `playwright/no-raw-locators` exemption successfully dropped. D-01b 500ms `waitForTimeout` has a legitimate `no-wait-for-timeout` eslint-disable with inline `// reason:` rationale. See WR-01 (delay durability), IN-02 (jsdoc framing).
- **`tests/tests/specs/candidate/candidate-profile.spec.ts`** — Rule-2 fill block correctly handles multilingual `text` dispatch via `.first()` + `.blur()` + wait-for-`toBeEnabled`; mirrors validation-spec canonical at line 358-361. See WR-02 (helper extraction), IN-04 (blur-invariant crossref).
- **`tests/tests/specs/candidate/candidate-profile-validation.spec.ts`** — IN-01 docstring count fix is internally consistent: lines 6 + 51 now say "6 reliably-renderable cells" / "all 6 test titles," and a count of `test(` declarations confirms 6 (3 IMAGE_CELLS/TEXT_CELLS original + 2 format additions + 1 A11Y-07 standalone). No structural changes.
- **`tests/tests/specs/voter/voter-matching.spec.ts`** — DETERM-07a hydration guard `await expect(cards).toHaveCount(expectedRanking.length)` lands BEFORE `cards.last()` indexing at line 250-252. `expectedRanking` is module-scope and derived from the independent matching computation (lines 27-119), so the assertion is deterministic.
- **`tests/tests/specs/voter/voter-detail.spec.ts`** — DETERM-07b hydration guard at line 151-153 uses `partySection.getByRole('heading', { level: 3 }).first().toContainText(\`${expectedPartyCount} parties\`)` — matches the canonical pattern at `voter-results.spec.ts:143` verbatim. `expectedPartyCount = E2E_ORGANIZATIONS.length` (=4) is derived from a module-scope import. The locator correction (run-1 audit deviation #2) is structurally sound: `entity-card-action` testId is shared by party-cards AND nested candidate subcards (would have measured 15 elements, not 4 parties). See IN-03 (locale binding).
- **`tests/tests/setup/templates/variant-hidden-required.ts`** — WR-01 (b) overlay extension at lines 175-181 correctly deletes BOTH `test-question-displayname` AND `test-question-required-empty-1` from Alpha's answers. Cross-spec coupling check: searched for `test-question-required-empty-1` references — only finds the base seed author (e2e.ts:732,855), the candidate-profile.spec.ts Rule-2 fill (mutation project, base seed, NOT variant), the candidate-profile-validation.spec.ts A11Y-07 cell (also base seed), and the variant overlay itself. The variant-hidden-required-candidate project's spec (`candidate-required-info.spec.ts:114-145`) asserts `toHaveAttribute('disabled', 'true')` only — no count assertion — so the variant overlay delete is safe regardless of whether `unansweredRequiredInfoQuestions.length` is 1 or 2.
- **`tests/scripts/diff-playwright-reports.ts`** — Phase 83 regen output verified:
  - PASS_LOCKED count = 94 (programmatic grep).
  - DATA_RACE count = **15** (Phase 73 D-09 binding intact — pool MUST NOT grow; CRITICAL contract preserved).
  - CASCADE count = 47 (-10 from Phase 79; consistent with 3 A11Y-02 + 7 SETTINGS-01 wave A cascade-unblocks documented in jsdoc lines 65-71).
  - The 2 IMGPROXY-tied cascade-unblocks (CAND-12 readback + CAND-03 readback) correctly stay in DATA_RACE per the IMGPROXY_TIED_TITLES partition contract.
  - FAILURE-CLASS narrative block at lines 86-102 correctly retains the worst-match reference (it's in PASS_LOCKED with the hydration guard) and strikes the party-drawer reference (promoted to PASS_LOCKED at line 169).
  - Array sort order matches JavaScript native `.sort()` (verified by replication) — the in-file ordering looks "wrong" under POSIX `sort` due to LC_COLLATE differences but is consistent with how the regen script emits the array.
- **`apps/supabase/supabase/config.toml`** — D-01c `[storage.image_transformation]` re-enable is local-only (this file scopes `supabase start` for local dev; production Supabase Cloud handles imgproxy at platform layer per SUMMARY's "User Setup Required: None"). No CORS / auth / network surface exposure. Idempotent.
- **`.planning/phases/83-…/post-fix/regen-constants.mjs`** — Phase 79 verbatim copy with `reportPath` on line 23 correctly edited to `'run-3.json'`. IMGPROXY_TIED_TITLES list (lines 67-82) preserved verbatim — 14 titles, matching Phase 73 D-09 binding. The match-count assertion at lines 87-99 fires loudly if any upstream rename invalidates the binding (defense-in-depth confirmed). See IN-01 (stale narrative comments — non-load-bearing).

---

## CODE REVIEW COMPLETE

Phase 83 ships with **0 BLOCKER findings**. Structural contracts (PASS_LOCKED=94, DATA_RACE=15 verbatim per Phase 73 D-09, CASCADE=47) are preserved; SHA-256 identity gate passed first-attempt at `d6bfeebdb0…`. Cross-spec coupling for WR-01 (b) is clean — `candidate-required-info.spec.ts` is count-agnostic. Two Warnings (WR-01 500ms fixed-delay race-mask, WR-02 Rule-2 helper extraction) and four Info items are advisory v2.11+ hygiene; none block v2.10 milestone close.
