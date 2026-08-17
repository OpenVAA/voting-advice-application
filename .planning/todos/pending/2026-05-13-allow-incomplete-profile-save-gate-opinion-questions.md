# Allow incomplete candidate-profile save + gate opinion-questions navigation

**Date:** 2026-05-13
**Source phase:** 82-a11y-01-product-gap-cell-required-empty (CONTEXT D-02 + discuss-phase user direction)
**Scope:** Backtrack Phase 82's TIGHTEN-SOFT submit-button gate; allow candidates to SAVE incomplete profiles iteratively across sessions, BUT prevent navigation to `/candidate/questions` (opinion questions) until all required info fields are complete.
**Effort:** ~1-2 plans.
**Resolves:** None directly — this is a forward-looking UX refinement filed at Phase 82 close. Phase 82 closes A11Y-07 (cell 4) via TIGHTEN-SOFT; this todo proposes a softer-still UX that preserves Phase 82's failing-gate semantics at a different layer (navigation vs. save).
**Source references:**
- Phase 82 CONTEXT D-01 (TIGHTEN-SOFT decision) + D-02 (this todo's authoring brief).
- Phase 82 user direction at discuss-phase: "Just disable the button but create a todo that we should allow the user to save incomplete profile but warn that they cannot proceed to opinion questions before its completed."
- `.planning/phases/82-a11y-01-product-gap-cell-required-empty/82-CONTEXT.md` §Decisions D-01/D-02.

## Why deferred

Phase 82 (v2.10 milestone) is a focused cell-closure phase — its scope is the minimum-diff TIGHTEN-SOFT gate that closes A11Y-07. Reworking the UX to "allow incomplete save + gate navigation" requires:

1. **Backtrack `canSubmit` gate** at `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92` — drop the `&& allRequiredFilled` clause Phase 82 added. The submit button becomes enabled again regardless of required-empty state.

2. **`Warning` banner on `/candidate/profile`** — uses the existing `Warning` component from `$lib/components/warning`. Conditionally rendered when `candCtx.requiredInfoQuestions.length > 0 && !candCtx.profileComplete`. Copy: explains "complete required profile fields before answering opinion questions"; references which fields are still empty (per `candCtx.unansweredRequiredInfoQuestions`).

3. **Navigation guard on `/candidate/questions`** — one of:
   - **Option A (recommended):** `+page.ts` `load` function on `apps/frontend/src/routes/candidate/(protected)/questions/+page.ts` returns a `throw redirect(307, '/candidate/profile?reason=incomplete-required')` when `allRequiredFilled` is false (computed from `candCtx.requiredInfoQuestions` + the candidate's answers — needs the candidate user data available at `load` time, which is the protected route's contract).
   - **Option B:** A guard on the profile-page submit button's `submitRouting` `$derived.by` block at `+page.svelte:98-109` that routes to `CandAppHome` (not `CandAppQuestions`) when `!allRequiredFilled`. Less robust (doesn't catch direct URL access to `/candidate/questions`) but simpler.

4. **Profile-page query-param handling** — read `?reason=incomplete-required` and surface a contextual notice ("You need to complete required fields before answering opinion questions"). Likely a `ContextualNotice` component variant or a banner element above the existing `Warning`.

5. **`submitRouting` update at `+page.svelte:98-109`** — the current logic routes to `CandAppQuestions` only when `allRequiredFilled && unansweredOpinionQuestions.length && !answersLocked`. This stays correct; the guard in step 3 catches the cases where this routing fails (e.g., when the user clicks "Save and Return" then navigates to questions via menu).

6. **i18n strings (new keys, 14 locales per Phase 78 CLEAN-04 TranslationKey typing):**
   - `candidateApp.basicInfo.warningIncomplete` — main warning banner copy.
   - `candidateApp.basicInfo.warningIncompleteCTA` — link/button copy for "what to fill in".
   - `candidateApp.error.incompleteRequiredRedirect` — query-param-driven notice copy.

7. **E2E spec (new file or extension):**
   - `tests/tests/specs/candidate/candidate-profile-required-incomplete.spec.ts` (or fold into `candidate-profile-validation.spec.ts` as cells 7+) — cells: (a) navigate to /candidate/questions when required-empty → assert redirect to /profile + Warning banner; (b) complete required fields → assert questions route is reachable.

8. **Backtrack Phase 82 cell 4 spec** at `candidate-profile-validation.spec.ts` — the cell asserts `submit.toBeDisabled()` when required-empty; this todo backtracks the gate so the cell would fail. Either: (a) update cell 4 to assert "save succeeds + warning visible" (changes the cell's semantic), OR (b) remove cell 4 and add cell 7 (gate at navigation, not save). Decision deferred to this todo's PLAN.md authoring time.

## Scope when picked up

### Frontend changes

- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92` — backtrack `canSubmit = $derived(status !== 'loading' && allRequiredFilled)` to `canSubmit = $derived(status !== 'loading')`.
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` (template section) — add `Warning` banner conditional on `requiredInfoQuestions.length > 0 && !profileComplete`.
- `apps/frontend/src/routes/candidate/(protected)/questions/+page.ts` (new file or extension) — add `load` guard with `throw redirect(307, '/candidate/profile?reason=incomplete-required')`.
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` (script section) — read `$page.url.searchParams.get('reason')` + render contextual notice.

### i18n changes

- Add 3 new keys to all 14 locale catalogs (7 Paraglide + 7 legacy per Phase 78 CLEAN-04 TranslationKey typing). Defaults the planner MAY use (en):
  - `candidateApp.basicInfo.warningIncomplete`: "Some required profile fields are still empty. Please complete them before answering opinion questions."
  - `candidateApp.basicInfo.warningIncompleteCTA`: "Show me which fields"
  - `candidateApp.error.incompleteRequiredRedirect`: "You need to complete required profile fields before answering opinion questions."

### Test changes

- New cell(s) in `candidate-profile-validation.spec.ts` (or new file) for the navigation guard contract.
- Backtrack of Phase 82's cell 4 (per item 8 above; decision at PLAN.md time).
- Existing `candidate-app-mutation` profile tests verified to still pass — Alpha stays `profileComplete` by default per Phase 82 D-03 fixture seeding.

## Why this UX over TIGHTEN-SOFT

- **Iterative workflows** — Candidates often have partial information available at different times (e.g., portrait photo at one session, biography at another). TIGHTEN-SOFT blocks save until everything is complete; this todo lets candidates accumulate partial answers across sessions.
- **Failure mode UX clarity** — TIGHTEN-SOFT's disabled button doesn't explicitly say WHY it's disabled (relies on the "Required" notice as the only signal). This todo replaces the silent-disable with an explicit Warning banner + per-field empty-state indicator (badges are already there).
- **Navigation-gate semantics match the underlying constraint** — the candidate doesn't need a "complete profile" to save profile; they need a complete profile to be MEANINGFULLY MATCHED against voters in opinion questions. Gating the navigation aligns the UX with the actual product requirement.

## Effort sizing

- Frontend changes: ~1 plan (small — `+page.svelte` 1-line backtrack + Warning component + query-param handling; `+page.ts` for questions route).
- i18n changes: ~0.5 plan (3 keys × 14 locales = 42 entries, mostly mechanical translation passes).
- Test changes: ~0.5 plan (1-2 new cells + Phase 82 cell 4 backtrack decision).
- Total: 1-2 plans.

## Why now (NOT v2.10)

v2.10's focused 5-item scope (per `.planning/PROJECT.md §"Current Milestone: v2.10"`) is closed by Phase 83 (DETERM-06 + DETERM-07). Adding a new UX-refinement phase would:
- Expand v2.10's scope beyond the milestone framing.
- Require its own discuss-phase, plan-phase, execute-phase cycle (~2-3 days).
- Backtrack a phase (82) that just closed.

Filing as v2.11+ candidate aligns with the milestone discipline. A reasonable home is a future "candidate UX refinement" milestone alongside other PRODUCT-GAP follow-ups (`2026-05-12-settings-02-voter-authoring-product-gap.md`, `2026-05-12-settings-03-voter-required-product-gap.md`, etc.).

## Dependencies

- **Phase 82** — TIGHTEN-SOFT gate landed; this todo backtracks it. Phase 82 must close before this todo can be implemented (otherwise the gate logic isn't in place to backtrack).
- **Existing `Warning` component** (`apps/frontend/src/lib/components/warning`) — reused; no new component needed.
- **Existing `candCtx.requiredInfoQuestions` + `candCtx.profileComplete` reactive accessors** — no new derivations needed; the data is already there.
- **No schema changes** — required-question flagging stays at `customData.required: boolean` per Phase 82 D-03.

## Acceptance Criteria

- [ ] `canSubmit` at `profile/+page.svelte:92` reverts to `$derived(status !== 'loading')` — submit button enabled regardless of required-empty.
- [ ] `Warning` banner renders on `/candidate/profile` when `requiredInfoQuestions.length > 0 && !profileComplete` with localized copy in 14 locales.
- [ ] Navigation to `/candidate/questions` when `!allRequiredFilled` triggers a 307 redirect to `/candidate/profile?reason=incomplete-required`.
- [ ] Profile page surfaces a contextual notice when `?reason=incomplete-required` is set.
- [ ] Phase 82 cell 4 spec is either updated or replaced (decision at PLAN.md time).
- [ ] New E2E cell(s) verify the navigation-guard contract.
- [ ] Existing `candidate-app-mutation` profile tests continue to pass — Alpha's `profileComplete` invariant preserved.
- [ ] Per-plan smoke PASS × 3 in isolation (Phase 73 / 76 / 80 / 81 / 82 inherited determinism contract).

## Cross-Links

- Phase 82 CONTEXT D-01 (TIGHTEN-SOFT) + D-02 (this todo's authoring brief).
- Phase 82 CONTEXT <deferred> "FUTURE PRODUCT CHANGE (v2.11+) — Allow incomplete profile save + gate opinion-questions entry."
- Phase 82 DISCUSSION-LOG §"Deferred Ideas" line 1.
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92,94,288,304` — TIGHTEN-SOFT surfaces.
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:347-352,354-362,367` — reactivity sources.
- `apps/frontend/src/lib/components/warning/` — Warning component for the banner.
- `apps/frontend/src/routes/candidate/(protected)/questions/` — guard surface.
- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` — Phase 82 cell 4 + the new guard cell(s).
