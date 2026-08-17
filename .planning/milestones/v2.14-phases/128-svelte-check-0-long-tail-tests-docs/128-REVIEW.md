---
phase: 128-svelte-check-0-long-tail-tests-docs
reviewed: 2026-07-16T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - apps/docs/src/routes/+page.svelte
  - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
  - apps/frontend/src/lib/components/term/Term.svelte
  - apps/frontend/src/lib/contexts/auth/authContext.svelte.ts
  - apps/frontend/src/lib/contexts/auth/authContext.type.ts
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte
  - apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte
  - apps/frontend/src/lib/utils/viewTransition.ts
  - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
  - apps/frontend/src/routes/candidate/(protected)/+layout.server.ts
  - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
  - apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte
  - tests/tests/utils/testIds.ts
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 128: Code Review Report

**Reviewed:** 2026-07-16
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Phase 128 is a type-hygiene phase (svelte-check 24 errors + 2 a11y warnings → 0) with two intentional a11y markup corrections (`Term.svelte`, docs carousel). I verified the type-truth claims that could hide behaviour changes and re-checked the two deliberate a11y reworks against the mandatory WCAG 2.1 AA gate.

**No BLOCKER-severity defects found.** The type-hygiene casts are all documented with `// reason:` blocks and are runtime-neutral. `LocalizedString` (used un-imported in the candidate question page) resolves via the frontend global alias `apps/frontend/src/lib/types/global.d.ts:44`, so that is not an error. The removed `settings-confirm-password` testId entry has no dangling references.

The findings below are: (a) two a11y concerns about how the `Term.svelte` lint was cleared — the fix silences `a11y_no_noninteractive_tabindex` by bolting `role="button"` onto a non-button span, which introduces a role/behaviour mismatch and leaves the WCAG 1.4.13 dismissible obligation unmet; and (b) two pre-existing logic bugs in the candidate question page that live in a file this phase touched. Warnings 3–5 are surfaced because the changed files are in scope, but they predate this phase — flag them for triage rather than treating them as Phase-128 regressions. Two injection-scanner hits were reviewed and confirmed as false positives.

## Warnings

### WR-01: `Term.svelte` trigger declares `role="button"` with no button behaviour (WCAG 4.1.2)

**File:** `apps/frontend/src/lib/components/term/Term.svelte:93-103`
**Issue:** The commit `c6a30481a` cleared the `a11y_no_noninteractive_tabindex` lint by adding `role="button"` to the trigger `<span>` so that `tabindex="0"` becomes "allowed". But the element has no `onclick`, no `onkeydown`, and performs no action on Enter/Space — it only reveals a tooltip on hover/focus. Assistive tech will announce "button" and users will expect activation that never happens (WCAG 4.1.2 Name, Role, Value: the role must match the actual behaviour). This is lint-suppression-by-role rather than a semantic fix.
**Fix:** Either use a real interactive element only when the term genuinely triggers an action, or keep the trigger non-interactive and clear the lint the APG-tooltip way. For a pure informational tooltip the trigger does not need `role="button"`; a focusable inline element that exposes the definition via `aria-describedby` is sufficient. If the linter still objects to `tabindex` on a roleless span, prefer an explicit accepted-warning comment over a misleading role:
```svelte
<!-- Non-interactive tooltip trigger: focusable for keyboard reveal, no activation action. -->
<span bind:this={triggerElement} tabindex="0" aria-describedby={visible ? definitionId : undefined} ...>
```

### WR-02: `Term.svelte` tooltip is not dismissible without moving focus (WCAG 1.4.13)

**File:** `apps/frontend/src/lib/components/term/Term.svelte:56-120`
**Issue:** The definition popup is shown on hover/focus (`visible = forceShow || hovered || focused`) but there is no `Escape`-to-dismiss handler. WCAG 2.1 AA SC 1.4.13 (Content on Hover or Focus) requires content triggered by hover/focus to be *dismissible* without moving the pointer or focus. CLAUDE.md and `.agents/code-review-checklist.md` both mandate WCAG 2.1 AA. (Pre-existing behaviour, but this a11y-focused file was actively reworked in this phase, so the gate applies.)
**Fix:** Add a keydown handler that clears the reveal state on Escape:
```svelte
<span
  ...
  onkeydown={(e) => { if (e.key === 'Escape') { hovered = false; focused = false; triggerElement?.blur(); } }}>
```

### WR-03: `getNextQuestionId` never returns `undefined` for an already-answered question (pre-existing)

**File:** `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:110-115`
**Issue:** `Array.prototype.findIndex` returns `-1` when the current question is not in `unansweredOpinionQuestions` (i.e. the candidate is re-editing an already-answered question). The guard `index != null` is always true for `-1` (`-1 != null` === `true`), and `-1 < length - 1` is also true, so the function returns `unansweredOpinionQuestions[0]?.id` — the *first* unanswered question — instead of `undefined`. Consequently `submitRouting` sends "Save & continue" to the first unanswered question rather than returning to the questions list. The intended sentinel check is `index !== -1`, not `index != null`.
**Fix:**
```ts
const index = unansweredOpinionQuestions.findIndex((q) => q.id === question.id);
return index !== -1 && index < unansweredOpinionQuestions.length - 1
  ? unansweredOpinionQuestions[index + 1]?.id
  : undefined;
```

### WR-04: `setAnswer` shows the wrong error message for the no-value/no-info branch (pre-existing)

**File:** `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:187-192`
**Issue:** When `setAnswer` is called with neither `value` nor `info`, it sets `errorMessage = t('candidateApp.common.editingNotAllowed')` — the "answers are locked" string — even though the actual condition is an empty-payload programmer error (`logDebugError('...called with no value nor info')`). A user who hits this path is told editing is not allowed, which is misleading.
**Fix:** Use a message that matches the condition (e.g. `t('candidateApp.error.saveFailed')`) or drop the user-facing message entirely for this internal-guard branch and rely on the debug log.

### WR-05: Change-password flow does not verify the current password server-side (OWASP A07 — by design, flag for awareness)

**File:** `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts:99-105`, `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte:52`
**Issue:** The settings page collects `currentPassword` and passes it to `setPassword`, but the Supabase adapter (`_setPassword`) ignores it — the write is authorised purely by the active session cookie. This means an actor with a live authenticated session (shared/kiosk device, hijacked session) can set a new password without knowing the old one, defeating the re-authentication protection users reasonably expect from a "current password" field. This is documented as Pitfall 1 and is inherent to the Supabase session model — it is **not** introduced by Phase 128 (which only made the wrapper param optional). Surfaced per the mandatory OWASP checklist item; treat as a product/security-design decision, not a phase regression.
**Fix:** Product decision. If re-authentication is desired, verify `currentPassword` via `signInWithPassword` (or a re-auth challenge) before calling `updateUser({ password })`. Otherwise, consider removing the current-password field so the UI does not imply a verification that never occurs.

## Info

### IN-01: `Term.svelte` `calculatePosition` has a dead `definitionRect ? … : 0` conditional

**File:** `apps/frontend/src/lib/components/term/Term.svelte:78-79`
**Issue:** `definitionRect` is the return value of `getBoundingClientRect()`, which is always a truthy `DOMRect`. The ternary `definitionRect ? … : 0` can never take the `: 0` branch, so the guard is dead code. The real guard is the early `if (!triggerElement || !definitionDiv) return;` above.
**Fix:** Drop the redundant ternary: `leftPadding = Math.max(0, -(tooltipLeft - VERTICAL_PADDING));` / `rightPadding = Math.max(0, tooltipRight - window.innerWidth + VERTICAL_PADDING);`

### IN-02: `Term.svelte` `VERTICAL_PADDING` constant is applied to horizontal padding

**File:** `apps/frontend/src/lib/components/term/Term.svelte:41,78-79`
**Issue:** `VERTICAL_PADDING` is used only in the horizontal (left/right) viewport-clamp math, so the name is misleading.
**Fix:** Rename to `VIEWPORT_EDGE_PADDING` (or `HORIZONTAL_PADDING`).

### IN-03: `supabaseDataWriter.test.ts` uses an asymmetric matcher as mock return data

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:280-287`
**Issue:** `expectedAnswers` embeds `value: { path: expect.stringMatching(/…/) }` and is passed as the RPC mock's *return data* (`mockSupabase.rpc.mockResolvedValue({ data: expectedAnswers … })`). An asymmetric matcher only does something inside an `expect(...)` comparison; used as plain mock data it is inert. The test never asserts against the returned value (its real assertions are the `uploadMock`/`rpc` call-arg checks), so `expectedAnswers` is misleading dead data that reads like an assertion but verifies nothing.
**Fix:** Replace with a concrete literal return value (or drop it), and if the upload-path substitution is worth asserting, assert it explicitly via `expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_answers', expect.objectContaining({ p_answers: expect.objectContaining({ 'q-image': { value: { path: expect.stringMatching(/…/) }, info: 'My photo' } }) }))`.

### IN-04: Injection-scanner LOW hits reviewed — false positives

**File:** `apps/docs/src/routes/+page.svelte`, `tests/tests/utils/testIds.ts:112`
**Issue:** The Read-time scanner flagged `invisible-unicode` in the docs page (curly quotes `’`, bullet `•` in marketing copy) and `MD-LINK-TOKEN-IN-QUERY:?code=` in a testId comment (`preregister/status?code=success`). Both are legitimate content — no hidden instructions, no injected tokens.
**Fix:** None required; recorded for audit completeness.

---

_Reviewed: 2026-07-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
