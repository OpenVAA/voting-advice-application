---
status: diagnosed
trigger: "uat-179-1-registered-notice-spacing: The already-registered block on the registration page has mb-md."
created: 2026-10-31T18:01:25Z
updated: 2026-10-31T18:01:25Z
goal: find_root_cause_only
---

## Current Focus

bug_class: Bohrbug (deterministic styling)
hypothesis: CONFIRMED. The notice's outermost node, the `<section data-testid="contestant-register-registered-notice">`, has no bottom margin, and its parent, MainContent's default-content wrapper, is a flex column with no gap, so the notice touches the next sibling (0 px). mb-md on the section opens a 10 px gap and nothing cancels it.
test: done; gap measured before, with and after removing the class in the live DOM, at four widths in both colour schemes.
expecting: met
next_action: Diagnose-only session. Hand the root cause to the fix planner; no source edit made here.

## Symptoms

expected: The already-registered block on the registration page has mb-md.
actual: "Already registered: fine, just add mb-md to the already registered block"
errors: None reported
reproduction: Test 11 in UAT. Open http://localhost:5173/contestant/register signed out with the cookie `registered=1` set in the browser context.
started: Discovered during UAT

## Eliminated

- hypothesis: A parent gap or the flex context cancels or absorbs mb-md on the notice
  evidence: The parent computes display flex, flex-direction column, row-gap normal. Adding mb-md moved the next sibling by exactly 10 px in all 8 combinations; margins between flex items do not collapse.
  timestamp: 2026-10-31T18:01:25Z

- hypothesis: The class is not compiled, because it would be new to this page
  evidence: With only a live-DOM class change and no rebuild, the notice computes margin-bottom 10px. mb-md is already used by other source files, including the fieldset's legend directly below the notice.
  timestamp: 2026-10-31T18:01:25Z

## Evidence

- timestamp: 2026-10-31T18:01:25Z
  checked: apps/frontend/src/routes/contestant/register/+page.svelte, MainContent.svelte and RegistrationModeSelector.svelte, by reading
  found: The notice is one `<section class="bg-base-100 gap-md p-lg flex w-full flex-col rounded-lg">`, rendered inside `{#if showsRegisteredNotice}` in MainContent's default children, directly before `<RegistrationModeSelector>`. MainContent's wrapper for those children is `flex w-full max-w-xl flex-col items-center`, with no gap. The section's gap-md and p-lg space its own content only.
  implication: Nothing separates the notice from what follows it. The section is the outermost node, and it is removed with the notice on Dismiss, so a margin on it leaves with it.

- timestamp: 2026-10-31T18:01:25Z
  checked: Live DOM on :5173 (scratchpad notice/measure.mjs, report notice/report.json). Fresh signed-out context with cookie registered=1, status 200, no redirect, Continue enabled before measuring. Light and dark at 320, 375, 768 and 1280 wide. Chromium only.
  found: Served class equals the source. data-modes is "identity_provider email code", so the next sibling is the FIELDSET (margin-top 0, legend margin-top 0). In all 8 combinations, notice margin-bottom 0px -> 10px with mb-md, gap to next sibling and to the legend 0 -> 10 -> 0 on removing the class, page scrollHeight +10 (1018 -> 1028 narrow, 1001 -> 1011 wide), notice width unchanged (280, 335, 576, 576), scrollWidth equal to the viewport.
  implication: The symptom is reproduced and the class does what the operator asked, on every measured combination. mb-md is 0.625rem (10 px) in this project's scale, not a default Tailwind value.

- timestamp: 2026-10-31T18:01:25Z
  checked: Screenshot with the class, 375 light (scratchpad notice/after-light-375.png). The other screenshots were taken and not looked at; those combinations rest on the numbers above.
  found: The white card ends, a visible band of page background follows, then the legend "How would you like to register?".
  implication: The result reads as intended at phone width.

- timestamp: 2026-10-31T18:01:25Z
  checked: Tests naming the notice or asserting style. page.svelte.test.ts, contestant-email-registration.spec.ts, contestantRegisterPage.fixture.ts, tests/tests/specs/visual, by grep for the test ids, classList, toHaveCSS, getComputedStyle, toHaveClass, toHaveScreenshot and the cookie name.
  found: The unit test's notice block and the E2E spec select by test id and assert presence, heading, links, order, Dismiss and focus. The only classList assertion in the page test is on the type radios, and the fixture's only toHaveCSS is on a radio's border. The visual spec does not name this page's cookie or route.
  implication: No test is pinned to the notice's classes, so none breaks with the fix, and none would catch the margin being removed. jsdom has no layout, so only a class assertion or an E2E computed-style read could.

- timestamp: 2026-10-31T18:01:25Z
  checked: Not measured
  found: The single-mode shape, where the next sibling is the panel's form instead of the fieldset, because the served project lists three modes and settings were not changed. By reading, that form is `gap-md flex w-full flex-col` with no top margin, under the same parent.
  implication: The same 10 px is expected there, by the parent's measured flex context. Inference, not observation.

- timestamp: 2026-10-31T18:01:25Z
  checked: Side effects of this session
  found: One command that listed apps/frontend/.env in a grep was refused by the secret-read guard; the file was not read and was not needed. No source file edited (git status clean for the page, the selector and the main layouts); class changes were in throwaway browser copies. No database writes and no mail. The stack and the dev server were left running.
  implication: The working tree and the stack are as they were, apart from this file.

## Resolution

candidate_causes:
  - "code: the notice's section has no bottom margin, under a parent flex column with no gap (CONFIRMED)"
  - "config: the class or the spacing token is missing (ELIMINATED, computes 10px with no rebuild)"
  - "environment: a stale dev server (ELIMINATED, the served class equals the source)"
  - "data: the mode settings change the spacing (NOT MEASURED for one mode; three modes measured, one mode expected the same by reading)"
and_gate: "yes, two conditions together: the parent has no gap and the section has no margin. Only the section is to change. The parent wrapper is MainContent's, shared by the standard pages of the app, and the operator named the block."
root_cause: The already-registered notice's outermost node, the `<section data-testid="contestant-register-registered-notice">` in the register page, has no bottom margin, and MainContent's default-content wrapper is a flex column with no gap, so the notice sits 0 px from the mode selector below it.
fix:
verification:
files_changed: []
