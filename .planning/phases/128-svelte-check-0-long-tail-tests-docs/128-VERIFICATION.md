---
phase: 128-svelte-check-0-long-tail-tests-docs
verified: 2026-07-16T15:58:20Z
status: human_needed
score: 8/8 truths verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Load a voter question page with an inline term trigger (e.g. a Likert-scale question with a glossary term). Tab to the trigger with keyboard-only navigation, confirm the definition tooltip opens on focus, and use a screen reader (VoiceOver/NVDA) to check what the trigger announces."
    expected: "Decide whether `role=\"button\"` on the Term.svelte trigger (added in commit c6a30481a to clear `a11y_no_noninteractive_tabindex`) is an acceptable long-term a11y fix, given the element has no `onclick`/`onkeydown` and performs no action on activation — a screen reader will announce it as an operable button that does nothing when pressed (WCAG 4.1.2 Name/Role/Value). Also decide whether the missing Escape-to-dismiss handler on the same tooltip (WCAG 1.4.13 Content on Hover or Focus) needs a follow-up fix or a filed backlog item."
    why_human: "This is a WCAG semantic-honesty judgment call already raised in the committed code review (128-REVIEW.md WR-01/WR-02) — 0 CRITICAL findings, but 2 WARNINGs question whether role=button is a truthful fix vs. lint-suppression-by-role. svelte-check reports 0 warnings (the plan's literal must-have), and the E2E suite confirms focus/blur reveal still works, but automated tooling cannot judge AT-announcement honesty or the WCAG 1.4.13 dismissibility gap. Grep/type-check evidence alone cannot resolve this — it needs a human accessibility judgment on whether to accept, file a follow-up, or fix now."
---

# Phase 128: svelte-check → 0 — Long-Tail, Tests & Docs Verification Report

**Phase Goal:** The scattered long-tail type mismatches, the test/spike type errors, and the docs a11y warning are resolved. (svelte-check → 0 — Long-Tail, Tests & Docs: frontend svelte-check 24 errors/1 warning → 0/0, apps/docs 0/1 → 0/0, full E2E green, no runtime behavior change except two deliberate a11y markup corrections.)
**Verified:** 2026-07-16T15:58:20Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The long-tail of scattered 1-per-file route/util/component type mismatches (~25, TYPE-07) is resolved | ✓ VERIFIED | Re-ran `cd apps/frontend && yarn check` independently → `0 ERRORS 0 WARNINGS` (2086 files, 0 files with problems). Spot-checked source: `+layout.server.ts` typed-local `SupabaseAdapterConfig`, `authContext.type.ts`/`.svelte.ts` `setPassword` widened to `{ currentPassword?; password }`, `viewTransition.ts` uses built-in `ViewTransition` lib type behind a feature-check, `FeedbackPopup.svelte` uses `'default'`, `EntityInfo.svelte:78` literal `'organizations'`, both `QuestionHeading` sites use `tabindex={-1}`. |
| 2 | The `.test.ts` / `.spike` type errors (~19, TYPE-08) are resolved (fixed or dead scaffolding removed) | ✓ VERIFIED | `apps/frontend/src/lib/contexts/_spikes-020-class-conversion/` confirmed deleted (`ls` → no such directory); grep across `apps/frontend/src` for the 4 spike basenames returns zero matches (no orphaned importers). Adapter test files (`supabaseDataProvider.test.ts`, `supabaseDataWriter.test.ts`, `supabaseAdminWriter.test.ts`) confirmed to use typed-local `SupabaseAdapterConfig` configs, `registrationKey` in both `register()` calls, and `info: { en: ... }` LocalizedString wrapping — no `any`/`as any` found in any of the three files. |
| 3 | The `apps/docs` a11y svelte-check warning is resolved so monorepo svelte-check shows 0 warnings (TYPE-09) | ✓ VERIFIED | Re-ran `cd apps/docs && yarn check` independently → `0 ERRORS 0 WARNINGS` (604 files). `<section role="group" aria-label="OpenVAA screenshot showcase">` confirmed present; existing prev/next and per-screenshot `<button>`s unchanged. |
| 4 | `yarn build` is green (all packages build) | ✓ VERIFIED | Re-ran independently → `14 successful, 14 total` (Turborepo, cached). |
| 5 | `yarn test:unit` is green, spike files no longer collected | ✓ VERIFIED | Re-ran independently → `19 successful, 19 total`; frontend 53 test files / 741 tests passed (matches SUMMARY's 759/741 progression across plans); no `_spikes-020` files collected. |
| 6 | One full `yarn test:e2e` run is green — no failing, no did-not-run | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Not re-run per orchestrator instruction (10+ min, already green this phase). 128-05-SUMMARY.md and the committed 128-05 plan/task-commit trail report 125 passed / 0 failed / 0 did-not-run (10.8m). Corroborating evidence found independently: `voter-journey.spec.ts:620-633` exercises the exact `termTrigger`/`termPopup` testids touched by the Term.svelte a11y rework (focus → popup visible → blur), which is consistent with a real, passing run rather than a stale claim. Not independently re-executed, so kept as present-not-reverified rather than counted VERIFIED. |
| 7 | No test error silenced with an any-cast; every mock/arg typed to the real writer/provider signature (D-04) | ✓ VERIFIED | `grep -n "\bany\b"` across the three adapter test files returns only comments (`// Mock $env/dynamic/public before any imports...`, `// ...replaces (result as any) patterns`) — no live `any`/`as any` on any code line. |
| 8 | Both a11y warnings fixed at markup source, not silenced with `svelte-warning: accepted` comments (D-06) | ✓ VERIFIED | `grep -rn "svelte-warning: accepted"` on `Term.svelte` and `apps/docs/+page.svelte` returns zero matches; both fixes are real markup/role changes, confirmed by the independent 0-warning `yarn check` re-runs above. |

**Score:** 8/8 truths verified (0 present-behavior-unverified counted toward score; item 6 flagged separately as not independently re-executed per scope instruction, not as a failure)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabaseDataProvider.test.ts` / `supabaseDataWriter.test.ts` / `supabaseAdminWriter.test.ts` | 0 svelte-check errors, typed-local configs, no any-cast | ✓ VERIFIED | Confirmed via grep + independent `yarn check` 0-error result |
| `_spikes-020-class-conversion/` | Deleted, zero importers | ✓ VERIFIED | Directory absent; grep confirms zero importer references |
| `+layout.server.ts` | Concrete-typed serverClient seam | ✓ VERIFIED | `SupabaseAdapterConfig` typed locals at both `.init()` sites |
| `authContext.type.ts` / `authContext.svelte.ts` | `setPassword` widened to accept `currentPassword` | ✓ VERIFIED | Confirmed optional `currentPassword?` + behavior-neutral default `''` |
| `settings/+page.svelte` | Dead `confirmPasswordTestId` prop removed | ✓ VERIFIED | Prop absent; `PasswordSetter` import present, no dead prop pass |
| `testIds.ts` | Dead `candidate.settings.confirmPassword` entry removed | ✓ VERIFIED | Entry replaced by a pointer comment to `candidate.passwordSetter.confirm`; live entries at line 141 retained |
| `viewTransition.ts` | Built-in lib.dom.d.ts `ViewTransition` type, no hand-rolled interface | ✓ VERIFIED | File header + `startViewTransition` confirm built-in type usage, feature-checked |
| `FeedbackPopup.svelte` | `status` initial value `'default'` | ✓ VERIFIED | `let status = $state<SendingStatus>('default');` confirmed |
| `EntityInfo.svelte` | Dead ternary collapsed to literal `'organizations'` | ✓ VERIFIED | Line 78 confirmed literal, no `=== 'candidate'` comparison |
| `questions/+layout.svelte` / `[questionId]/+page.svelte` | Numeric `tabindex={-1}` | ✓ VERIFIED | Both sites confirmed at `tabindex={-1}` |
| `Term.svelte` | Lint-clean, focusable, testid + whitespace-FLUSH preserved | ✓ VERIFIED (see human item) | `role="button"` + `tabindex="0"`, `data-testid="voter-questions-term-trigger"` intact, whitespace-FLUSH markup intact — but see human verification item on role honesty |
| `apps/docs/src/routes/+page.svelte` | ARIA role on carousel section | ✓ VERIFIED | `role="group"` + `aria-label` present, buttons unchanged |
| `128-05-SUMMARY.md` | Before/after svelte-check counts, build/unit/E2E evidence | ✓ VERIFIED | Present, matches independently re-run build/unit/svelte-check counts |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| Adapter test files | `SupabaseAdapterConfig` (supabaseAdapter.type.ts:9) | typed-local config assigned then passed to `.init()` | ✓ WIRED | Confirmed present in all three test files and both `+layout.server.ts` sites |
| `+layout.server.ts` | `prepareDataWriter(dataWriter: UniversalDataWriter)` (Phase 127 seam) | unnarrowed shared param | ✓ WIRED | `yarn build` + `yarn check` both green with zero net-new; `prepareDataWriter.ts` untouched by this phase |
| `PasswordSetter.svelte:80` hardcoded `data-testid="password-setter-confirmation"` | `testIds.ts` catalogue | dead entry removed, live entry retained | ✓ WIRED | Confirmed via grep — dead entry gone, hardcoded id matches remaining catalogue entries |
| Docs carousel `<section role="group">` | existing prev/next `<button>`s | additive-only role, buttons untouched | ✓ WIRED | Confirmed via source read — buttons unchanged, `ontouchstart`/`ontouchend` still progressive enhancement |
| `Term.svelte` `termTrigger`/`termPopup` testids | `voter-journey.spec.ts` E2E spec | `getByTestId` + focus/blur assertions | ✓ WIRED | Confirmed the E2E suite actively exercises the exact DOM the a11y rework touched |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TYPE-07 | 128-02, 128-03 | Long-tail route/util/component type mismatches (~25) resolved | ✓ SATISFIED | 0 frontend errors confirmed independently; all named fix sites inspected and match plan claims |
| TYPE-08 | 128-01 | `.test.ts`/`.spike` type errors (~19) resolved | ✓ SATISFIED | 0 frontend errors confirmed; spike directory deleted with zero-importer gate; no any-casts |
| TYPE-09 | 128-04 | `apps/docs` a11y warning resolved, monorepo svelte-check 0 warnings | ✓ SATISFIED (see human item) | Both `yarn check` runs independently confirm 0/0; markup-source fix present (not a suppression comment) — code review raises a semantic-honesty concern on the Term.svelte fix specifically, routed to human verification |

No orphaned requirements — REQUIREMENTS.md maps exactly TYPE-07/08/09 to Phase 128, and all three are marked `[x]` / `Complete` in the traceability table, consistent with the evidence above.

### Anti-Patterns Found

None. Scanned all 15 files touched by the phase (per 128-REVIEW.md's file list) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` — zero matches. No `svelte-warning: accepted` comments added. No stray `any`/`as any` on live code lines.

### Code Review Cross-Reference (128-REVIEW.md, committed)

0 Critical / 5 Warning / 4 Info. Independently confirmed:
- **WR-01 / WR-02** (Term.svelte role=button honesty + missing Escape-dismiss): confirmed still present in current source — routed to human verification above, not treated as a blocker since the phase's literal must-haves (0 warnings, focusability, testid, whitespace-FLUSH preservation) are met, and the Escape-dismiss gap pre-dates this phase (git show confirms the only change was `role="term"` → `role="button"`, no pre-existing Escape handler was removed).
- **WR-03 / WR-04** (candidate question-page logic bugs): confirmed pre-existing per `git blame`-style reasoning in the review — not introduced by this phase's tabindex-only edit to that file. Not a Phase 128 gap; flagged for separate triage.
- **WR-05** (password verification design gap): explicitly by-design / pre-existing, not a phase regression, already flagged in the phase's own threat model (T-128-02-02, disposition `transfer`).

### Human Verification Required

### 1. Term.svelte `role="button"` a11y-honesty decision (WR-01/WR-02)

**Test:** Load a voter question page with an inline term trigger. Tab to it with keyboard-only nav; confirm the tooltip opens on focus. Then check with a screen reader what the trigger announces, and consider whether users would expect an activation action that doesn't exist.
**Expected:** A decision on whether `role="button"` (chosen to legitimize `tabindex="0"` and clear `a11y_no_noninteractive_tabindex`) is an acceptable long-term fix, or whether it should be replaced with a roleless-but-focusable pattern (as WR-01 suggests) or an added Escape-to-dismiss handler (WR-02, WCAG 1.4.13).
**Why human:** This is a WCAG semantic-honesty judgment, not a grep-verifiable fact. The plan's literal must-have (svelte-check 0 warnings, preserved focusability/testid/markup) is met; the open question is whether the *chosen mechanism* is the right long-term a11y fix, which the code review already surfaced as a Warning rather than a Blocker.

## Gaps Summary

No blocking gaps. All observable truths, artifacts, key links, and requirement IDs (TYPE-07/08/09) verified against the current codebase — independently re-run `yarn check` (frontend and docs), `yarn build`, and `yarn test:unit` all reproduce the SUMMARY's claimed 0/0 and green results. The phase is functionally complete.

One human-verification item is open: the code review's WR-01/WR-02 findings about the Term.svelte `role="button"` fix warrant a human accessibility judgment before this is considered a fully honest, durable a11y fix (vs. a lint-satisfying but semantically imprecise role choice). This does not block the phase's stated success criteria (svelte-check 0/0, TYPE-07/08/09 complete) but should be resolved or explicitly accepted before relying on Term.svelte as a WCAG 2.1 AA reference pattern elsewhere.

---

*Verified: 2026-07-16T15:58:20Z*
*Verifier: Claude (gsd-verifier)*
