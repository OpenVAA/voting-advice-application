---
phase: 70
plan: 03
subsystem: frontend/components/input
tags: [svelte5, hygiene, a11y, wcag-2.1-aa, cat-c]
requirements: [WARN-01]

dependency-graph:
  requires:
    - "Phase 70 baseline svelte-check surface (1 Cat C warning at Input.svelte:521 — confirmed via /tmp/70-03-baseline.log)"
    - "RESEARCH.md §Pattern 3 (Cat C fix recipe — Option A vs Option B)"
    - "PATTERNS.md §Site C1 (Input.svelte:521 fix shape — Option A target)"
    - "CLAUDE.md §Important Implementation Notes (WCAG 2.1 AA bar)"
    - "CONTEXT.md D-05 (// svelte-warning: accepted — fallback format if Option A had failed)"
  provides:
    - "Input.svelte image-upload click target promoted to <button type=\"button\"> — semantic, keyboard-native, disabled-aware"
    - "Closes WARN-01 SC-3 (Category C — zero un-justified a11y warnings)"
    - "Phase-70 frontend `0 WARNINGS` total (down from 1 — entire warning surface for the workspace is now clean)"
  affects:
    - "Plan-70-05 (BIND strip) — preserved the line-546 `<!-- bind: keep — fileInput is $state(); single ref read in event handlers -->` comment for that plan to strip"

tech-stack:
  added: []
  patterns:
    - "Pattern 3 Option A — `<label>` → `<button type=\"button\">` promotion preserving classes and handlers"
    - "Native `disabled={isDisabled}` attribute on `<button>` (improvement over `<label>` which doesn't honour `disabled`)"

key-files:
  created: []
  modified:
    - "apps/frontend/src/lib/components/input/Input.svelte (lines 519-545 — `<label>` → `<button>` swap; removed the now-unnecessary `<!-- svelte-ignore -->` comment that was specifically silencing the `<label>`'s a11y warnings)"

decisions:
  - "Option A (button promotion) chosen as the primary path per RESEARCH.md verdict + PATTERNS.md §Site C1 default. No visual-smoke regression to back out — auto-mode visual gate skipped (limitation acknowledged; diff is small enough for static review)."
  - "tabindex=\"0\" dropped from the new `<button>` — native on `<button>`, would be redundant."
  - "Added `disabled={isDisabled}` to the `<button>` — improvement over the `<label>` form which doesn't natively honour `disabled` (improves a11y for the disabled-form state per threat T-70-03-02 mitigation in PLAN.md)."
  - "Removed the `<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions a11y_label_has_associated_control -->` comment immediately above the `<label>` — `<button>` raises none of those three warnings, so the silence comment was specifically silencing the `<label>` and is no longer needed."
  - "The OUTER `<label id=\"{id}-label\">` at line 518 (which displays the human-readable label text and also has `<!-- svelte-ignore a11y_label_has_associated_control -->`) was NOT touched — it's a separate non-interactive label and its own ignore comment stays valid."

metrics:
  duration: "~2 min (114s; 2026-05-09T19:38:16Z → 2026-05-09T19:40:10Z)"
  completed: "2026-05-09"
  tasks_completed: 3
  files_modified: 1
  commits: 1
---

# Phase 70 Plan 03: Cat C `a11y_no_noninteractive_element_interactions` Fix Summary

Promoted Input.svelte's image-upload `<label>` (line 521, the only Cat C site per RESEARCH.md) to `<button type="button">` per PATTERNS.md §Site C1 Option A. Drops the `tabindex="0"` (native on `<button>`), adds `disabled={isDisabled}` (improvement over `<label>`), removes the now-unnecessary `<!-- svelte-ignore -->` silencer. svelte-check now reports `0 WARNINGS` for the entire frontend workspace (was 1).

## Outcome

| Metric | Before | After |
|---|---|---|
| `a11y_no_noninteractive_element_interactions` warnings (Input.svelte) | 1 | 0 |
| Phase-wide `a11y_no_noninteractive_element_interactions` count | 1 | 0 |
| `yarn workspace @openvaa/frontend check` total `WARNINGS` | 1 | 0 |
| `yarn workspace @openvaa/frontend build` a11y warnings | 0 | 0 |
| `yarn workspace @openvaa/frontend build` exit code | 0 | 0 |

## Path Taken: Option A (Button Promotion)

Per `70-03-PLAN.md` Task 1, applied PATTERNS.md §Site C1 Option A — promoted the `<label>` to `<button type="button">` preserving:
- All existing classes (`text-primary flex h-60 justify-stretch`)
- `class:cursor-pointer={!isDisabled}`
- `onclick={() => fileInput?.click()}`
- `onkeydown={handleFileInputLabelKeydown}`
- `id="{id}-image-label"` (preserves the `<input type="file">` `aria-labelledby="{id}-label {id}-image-label"` chain at line 551)
- All children (`{#if isLoading}` → `Loading inline` / `{:else if url}` → image + sr-only / `{:else if !isDisabled}` → "Add image" + Icon / `{:else}` → "No image")

Improvements over the previous `<label>` form:
- `<button>` is natively focusable — `tabindex="0"` is no longer required (dropped).
- `<button>` natively honours the `disabled` attribute — added `disabled={isDisabled}` so the click target is properly unfocusable + unclickable when the form is locked (mitigates the T-70-03-02 disabled-state-information-disclosure threat per PLAN.md).
- `<button>` raises no `a11y_no_noninteractive_*` warnings — removed the line-520 `<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions a11y_label_has_associated_control -->` comment that was specifically silencing the `<label>`'s warnings.

## Manual Visual + Keyboard Smoke (Task 2 Checkpoint)

**Auto-mode handling:** This plan ran under `--auto` (`workflow._auto_chain_active: true` in `.planning/config.json`). Per `<auto_mode_checkpoint_handling>` in the executor prompt, the `checkpoint:human-verify` task auto-approves and the executor proceeds straight to Task 3. The visual + keyboard smoke is deferred to the phase-close `/gsd-verify-work 70` cold-start protocol (per CONTEXT.md D-04 — same handling as Plan 70-01 and Plan 70-02).

**Auto-approval decision recorded:** `accepted-A` — Option A applied; static gate passed (0 warnings); diff is small enough for static review (one element type swap with full attribute-and-handler preservation; no children mutated).

**Why this is safe to defer:**
- The `<button type="button">` form is the canonical fix for the warning per [svelte.dev/e/a11y_no_noninteractive_element_interactions](https://svelte.dev/e/a11y_no_noninteractive_element_interactions).
- All click + keyboard handlers are preserved verbatim (`onclick={() => fileInput?.click()}` and `onkeydown={handleFileInputLabelKeydown}`).
- The `aria-labelledby` chain on the actual `<input type="file">` (line 551) is preserved — both `{id}-label` (line 518 outer label) and `{id}-image-label` (the new `<button>`) still resolve.
- WCAG 2.1 AA is improved, not regressed: `<button>` is native semantic + native keyboard interactive + native `disabled` honour.
- No DaisyUI `.label` class is in use on this specific element (the visual styling is `text-primary flex h-60 justify-stretch`, not `.label`), so RESEARCH.md §Pitfall 3 does not apply at this site.

## Verification

```bash
# Task 1 + Task 3 static gate — PASS
yarn workspace @openvaa/frontend check 2>&1 | grep -v '^#' | grep -c "a11y_no_noninteractive_element_interactions"
# returns: 0

# Task 1 + Task 3 file-specific static gate — PASS
yarn workspace @openvaa/frontend check 2>&1 | grep -v '^#' | grep -c "Input.svelte.*a11y_no_noninteractive_element_interactions"
# returns: 0

# Task 3 build-time gate — PASS
yarn workspace @openvaa/frontend build  # exits 0
yarn workspace @openvaa/frontend build 2>&1 | grep -E "a11y_" | wc -l
# returns: 0

# Total WARNING count for the entire frontend workspace — PASS
# svelte-check `COMPLETED 2638 FILES 160 ERRORS 0 WARNINGS 35 FILES_WITH_PROBLEMS`
# (160 ERRORS are pre-existing TypeScript errors; Phase 71 / TYPING-01 owns those.)
```

## Plan-70-05 Handoff Note

The line-546 `<!-- bind: keep — fileInput is $state(); single ref read in event handlers -->` comment is preserved untouched. Plan-70-05 will strip it as part of the BIND-01 sweep.

The line-214-217 multi-line `// bind: migrate — ` block (the canonical Svelte 5 migration record for `mainInputs` array `$state` requirement) is also untouched and is excluded from the strip regex by design (per PATTERNS.md §"Critical preservation rule").

## Deviations from Plan

None — plan executed exactly as written. Option A applied on first pass, static gate green, build gate green. No fallback to Option B was needed.

## Threat Flags

None — the `<button>` swap introduces no new attack surface. The `<input type="file">` itself (bind:this'd at line 548) keeps its existing browser-native validation and accept-list behaviour; the click trigger is presentation only. Per PLAN.md §threat_model T-70-03-02, the new `disabled={isDisabled}` on the `<button>` is an improvement (mitigates the I-flag for disabled state) — already covered by the plan, not a new flag.

## Self-Check: PASSED

- File modified: `apps/frontend/src/lib/components/input/Input.svelte` — FOUND
- Commit hash `43ea0eb1e` (`fix(70-03): promote Input.svelte image-upload <label> to <button> (Cat C a11y)`) — FOUND in `git log`
- Static gate command output `0` — confirmed
- Build gate exit `0`, zero a11y warnings — confirmed
- `<!-- bind: keep -->` at line 546 — preserved (verified by Read after Edit)
- `// bind: migrate —` at lines 214-217 — preserved (not touched by this plan)
