---
phase: 128-svelte-check-0-long-tail-tests-docs
fixed_at: 2026-07-16T00:00:00Z
review_path: .planning/phases/128-svelte-check-0-long-tail-tests-docs/128-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 4
skipped: 1
status: partial
---

# Phase 128: Code Review Fix Report

**Fixed at:** 2026-07-16
**Source review:** .planning/phases/128-svelte-check-0-long-tail-tests-docs/128-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope (critical + warning): 5
- Fixed: 4 (WR-01, WR-02, WR-03, WR-04)
- Skipped: 1 (WR-05 — by design, out of scope)

**Post-fix verification (whole worktree, all edits in place):**
- `cd apps/frontend && yarn check` → **0 errors / 0 warnings** (2653 files). The `Term.svelte` a11y rework cleared the original `a11y_no_noninteractive_tabindex` warning with **no new a11y warnings** (no nested-interactive: `<Term>` is only rendered inside a non-interactive `<h1>` in `QuestionHeading.svelte`).
- `cd apps/frontend && yarn test:unit` → **741 passed / 741 (53 files)**. (The `token-endpoint.test.ts` "Token exchange failed" lines are expected stderr from tests exercising the 401 path — those tests pass.)

**Runtime-change note (for the orchestrator):** WR-01/WR-02 (`Term.svelte`) and WR-03/WR-04 (candidate question page) are runtime behaviour changes. `yarn check` + unit tests are green, but a **full E2E re-run is required before phase completion** — in particular the voter-journey spec (`tests/tests/specs/voter/voter-journey.spec.ts:621-634`) which focuses/blurs the term trigger and asserts the popup. The E2E focus/blur path was analysed and is preserved (see WR-01/WR-02 below), but it has not been executed here.

## Fixed Issues

### WR-01 + WR-02: `Term.svelte` trigger reworked as an accessible toggletip button

**Files modified:** `apps/frontend/src/lib/components/term/Term.svelte`
**Commit:** 2a9d4d2c0
**Status:** fixed: requires human verification (a11y + runtime — confirm via E2E + AT/keyboard pass)

**Applied fix (W3C APG toggletip pattern, per orchestrator guidance — a proper rework, not role removal):**
- Converted the trigger `<span role="button" tabindex="0">` into a **real `<button type="button">`**. A native button legitimately owns focusability, so the original `a11y_no_noninteractive_tabindex` stays cleared **without any role lie** (fixes WR-01 / WCAG 4.1.2 Name, Role, Value). The button is unstyled/inline (`class="inline appearance-none"`; Tailwind preflight already resets bg/border/padding/margin and inherits font + colour), so the term still renders as plain inline text.
- Gave the button **real activation behaviour**: `onclick={toggle}` toggles the definition popup (Enter/Space activate the native button automatically). Introduced a `dismissed` state that overrides the hover/focus reveal; `visible = !dismissed && (forceShow || hovered || focused)`. A small `$effect` clears `dismissed` once the trigger is neither hovered nor focused so a later hover/focus reveals it again.
- Maintained **`aria-describedby`** (links the popup while shown) and added **`aria-expanded`** reflecting popup state.
- Added **Escape-to-dismiss** via `svelte:window` `onkeydown` — hides the popup in place without moving pointer or focus (fixes WR-02 / WCAG 1.4.13). A window-level handler (rather than an element handler) covers the hover-without-focus case too.

**Hard constraints honoured:**
- `data-testid`s preserved verbatim — `voter-questions-term-trigger` moved onto the new `<button>` (still the interactive trigger the E2E spec `.focus()`/`.blur()`/`.toHaveText(/Likert/i)` exercises), `voter-questions-term-popup` unchanged.
- Whitespace-FLUSH inline markup preserved (the `></button\n  >{#if` split-tag trick, mirroring `QuestionHeading`) — no stray text nodes that would leak into the host heading's accessible name.
- `yarn check` remains 0/0 (no new a11y warnings).

### WR-03: `getNextQuestionId` now returns `undefined` for an already-answered question

**Files modified:** `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte`
**Commit:** 5836e16df
**Status:** fixed: requires human verification (logic bug — confirm "Save & continue" routing via E2E/manual)

**Applied fix:** Changed the sentinel check from `index != null` (always true, since `-1 != null` is `true`) to `index !== -1`. When the candidate re-edits an already-answered question, `findIndex` returns `-1`, which now correctly yields `undefined` so `submitRouting` routes "Save & continue" to the questions list instead of the first unanswered question.

### WR-04: `setAnswer` empty-payload guard shows the correct error message

**Files modified:** `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte`
**Commit:** c57349d60
**Status:** fixed: requires human verification (user-facing string change)

**Applied fix:** The internal empty-payload guard (`value == null && info == null`, a programmer-error path) previously set the misleading `candidateApp.common.editingNotAllowed` ("answers are locked") message. Replaced it with the generic `candidateApp.error.saveFailed` key (an existing key present in all locale catalogues — confirmed in `apps/frontend/messages/en/candidateApp.error.json`), which matches the actual condition. The `answersLocked` branch above it (which legitimately uses `editingNotAllowed`) is unchanged.

## Skipped Issues

### WR-05: Change-password flow does not verify the current password server-side

**File:** `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts:99-105`, `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte:52`
**Reason:** skipped — by-design / out of scope. Per orchestrator guidance, this is a documented product/security-design decision inherent to the Supabase session model (REVIEW.md Pitfall 1), not a Phase-128 regression (Phase 128 only made the wrapper param optional). Any change is an auth-flow redesign owned by backlog investigations, not this fix pass.
**Original issue:** The settings page collects `currentPassword` and passes it to `setPassword`, but the Supabase adapter ignores it — the write is authorised purely by the active session cookie, so a live session can set a new password without knowing the old one (OWASP A07). Fix is a product decision (verify via `signInWithPassword`/re-auth challenge, or remove the current-password field).

## Info findings (out of scope — not addressed)

IN-01 (dead `definitionRect` ternary), IN-02 (`VERTICAL_PADDING` misnomer), IN-03 (asymmetric matcher as mock data), IN-04 (injection-scanner false positives) are Info-severity and outside the `critical_warning` fix scope. Left untouched — surfaced here for triage.

---

_Fixed: 2026-07-16_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
