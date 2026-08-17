---
phase: 70
plan: 05
subsystem: frontend-hygiene
tags: [hygiene, bind-strip, comment-only, codemod, svelte-5]
requirements: [BIND-01]
dependency_graph:
  requires:
    - "70-03 (Phase 70 Plan 03 — Cat C a11y resolution; established the post-Plan-70-03 baseline before BIND strip)"
    - "v2.7 Phase 65 Plan 01 (the 92 `// bind: (keep|ok|justified)` audit-trail comments originated here)"
  provides:
    - "Clean `apps/frontend/src/lib/**/*.svelte` tree — 0 `// bind: (keep|ok|justified)` matches"
    - "Phase 70 SC-4 grep gate satisfied (BIND-01 acceptance)"
  affects:
    - "Phase 70 close (`/gsd-verify-work 70` cold-start gate inherits a clean BIND surface)"
tech_stack:
  added: []
  patterns:
    - "comment-only strip diff (29 deletions across 24 files; 0 `bind:*` directives modified)"
    - "regex-driven preservation (`// bind: migrate` excluded from strip by design)"
key_files:
  created: []
  modified:
    - apps/frontend/src/lib/admin/components/languageFeatures/LanguageSelector.svelte
    - apps/frontend/src/lib/candidate/components/passwordField/PasswordField.svelte
    - apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte
    - apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte
    - apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte
    - apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte
    - apps/frontend/src/lib/components/alert/Alert.svelte
    - apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte
    - apps/frontend/src/lib/components/constituencySelector/SingleGroupConstituencySelector.svelte
    - apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte
    - apps/frontend/src/lib/components/modal/Modal.svelte
    - apps/frontend/src/lib/components/modal/ModalContainer.svelte
    - apps/frontend/src/lib/components/modal/confirmation/ConfirmationModal.svelte
    - apps/frontend/src/lib/components/modal/timed/TimedModal.svelte
    - apps/frontend/src/lib/components/questions/QuestionChoices.svelte
    - apps/frontend/src/lib/components/select/Select.svelte
    - apps/frontend/src/lib/components/tabs/Tabs.svelte
    - apps/frontend/src/lib/components/toggle/Toggle.svelte
    - apps/frontend/src/lib/components/video/Video.svelte
    - apps/frontend/src/lib/dynamic-components/entityList/EntityList.svelte
    - apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte
    - apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte
    - apps/frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.svelte
    - apps/frontend/src/lib/dynamic-components/survey/SurveyButton.svelte
decisions:
  - "Comment-only atomic single-commit (no per-file commits) per RESEARCH.md §Atomic-commit guidance"
  - "Per-file Edit calls (not mass `sed`) per PATTERNS.md §Per-file approach for diff reviewability"
  - "Multi-line continuations stripped completely (no orphan `//` continuation lines remain)"
metrics:
  duration_minutes: 2
  completed_date: 2026-05-09
  pre_strip_count: 26
  post_strip_count: 0
  files_modified: 24
  lines_deleted: 29
  bind_directives_modified: 0
---

# Phase 70 Plan 05: Strip Phase 65-01 `// bind: (keep|ok|justified)` Rationale Comments — Summary

Comment-only strip of 26 `// bind: (keep|ok|justified)` audit-trail comments from `apps/frontend/src/lib/**/*.svelte` (24 files; 29 lines deleted; 0 `bind:*` directives modified). The Phase-65 audit's permanent record now lives in CLAUDE.md §"Context Destructuring Rule (Svelte 5)"; the inline rationale comments were redundant and have been stripped.

## What Was Done

Single atomic commit `4513c1180`. Per-file `Edit` calls — no mass `sed`. The strip regex `// bind: (keep|ok|justified)` was applied across 24 files in `apps/frontend/src/lib/`. Multi-line continuation comments were stripped completely (sentinel + continuation prose). The `// bind: migrate —` block at `Input.svelte:214-217` was preserved by design (the regex excludes `migrate`). After the strip, `git grep -nE "// bind: (keep|ok|justified)" apps/frontend/src/lib/` returns 0 matches; `git grep -n "// bind: migrate" apps/frontend/src/lib/` returns 1 hit (Input.svelte:214 preserved).

## Files Modified (24)

All 24 files listed in `key_files.modified` above. The diff is exclusively comment-only:

- 21 files × 1 deletion each (single-line `// bind: keep — usage example in @component doc` inside `<!--@component -->` doc blocks)
- `Toggle.svelte`: 2 deletions (2 separate single-line sites at line 32 + line 51)
- `Video.svelte`: 3 deletions (1 single-line at line 117 + 2-line continuation at lines 164-165)
- `QuestionChoices.svelte`: 3 deletions (3-line continuation at lines 121-123)

Total: 21 + 2 + 3 + 3 = **29 lines deleted**, **0 lines added**.

## Multi-line Strip Sites

Three sites required multi-line continuation handling (per RESEARCH.md §Pitfall 4 — naive `sed` would have left orphan continuation lines):

1. **`Video.svelte:164-165`** (2-line): `// bind: keep — single-ref \`bind:this={video}\`; the four below feed / // two-way DOM \`<video>\` properties (bind:currentTime/duration/muted/paused).` — both lines stripped atomically.
2. **`QuestionChoices.svelte:121-123`** (3-line): `// bind: keep — \`inputs\` must be $state in Svelte 5 because / // \`bind:this={inputs[id]}\` mutates a property on it. A plain \`const\` / // triggers \`binding_property_non_reactive\`.` — all three lines stripped atomically.
3. **`Video.svelte:117`** (single-line, included for completeness): `// bind: keep — explanatory note: mode is bound by Layout.svelte via bind:mode; atEnd is mutated internally.` — single line stripped.

## Preservation Confirmation

The `// bind: migrate —` block at `apps/frontend/src/lib/components/input/Input.svelte:214-217` is intact and unchanged. Verified post-strip:

```
$ git grep -n "// bind: migrate" apps/frontend/src/lib/
apps/frontend/src/lib/components/input/Input.svelte:214:  // bind: migrate — `mainInputs` must be $state in Svelte 5 because
```

Lines 214-217 are the canonical 4-line `// bind: migrate` Svelte-5 migration record (NOT an audit-trail justification). The strip regex `// bind: (keep|ok|justified)` does not match `migrate` by design. `Input.svelte` was not in the `<files>` list of Plan 70-05's Task 2 and was never opened for edit.

## Verification Results

| Gate | Command | Expected | Actual | Status |
|------|---------|----------|--------|--------|
| SC-4 grep gate | `git grep -nE "// bind: (keep\|ok\|justified)" apps/frontend/src/lib/ \| wc -l` | 0 | 0 | ✓ PASS |
| Migrate preservation | `git grep -n "// bind: migrate" apps/frontend/src/lib/ \| wc -l` | 1 | 1 | ✓ PASS |
| No `bind:*` directives added | `git diff HEAD -- apps/frontend/src/lib/ \| grep "^+" \| grep -E "(bind:\|<input\|<button\|<label)" \| wc -l` | 0 | 0 | ✓ PASS |
| No `bind:*` markup directives removed | `git diff HEAD -- apps/frontend/src/lib/ \| grep "^-" \| grep -E "^-\s*<.*bind:" \| wc -l` | 0 | 0 | ✓ PASS |
| All deletions are bind-comment lines | `git diff HEAD -- apps/frontend/src/lib/ \| grep "^-" \| grep -vE "^---\|^-(\s*//.*bind:\|\s*//\s)" \| wc -l` | 0 | 0 | ✓ PASS |
| Frontend build | `yarn workspace @openvaa/frontend build` | exit 0 | exit 0 (built in 8.55s) | ✓ PASS |
| Frontend unit tests | `yarn workspace @openvaa/frontend test:unit` | exit 0 | 658/658 tests pass (38 files) | ✓ PASS |

## Out of Scope / Follow-up

**54 `<!-- bind: (keep|ok|justified) -->` HTML-comment-style annotations remain in `apps/frontend/src/lib/`** — verified post-strip via `git grep -nE "<!-- bind: (keep|ok|justified)" apps/frontend/src/lib/ | wc -l` returning `54`. These are NOT matched by the BIND-01 SC-4 grep gate per RESEARCH.md §Pattern 5 regex. They live mostly inside `<!--@component -->` doc blocks and don't appear in compiled output. Plan 70-05's locked plan structure (CONTEXT.md D-02 + RESEARCH.md regex) explicitly excludes the HTML-comment form.

**Recommendation:** open a follow-up todo if user wants the HTML-comment form stripped for symmetry (low priority). Suggested message: "Plan-70-05 closes the `//` JS-comment form; the `<!-- -->` HTML form remains and may be a follow-up if cleanliness across both forms is desired."

## Deviations from Plan

None — plan executed exactly as written. The 5 acceptance criteria of Task 2 plus the 7 acceptance criteria of Task 3 all passed on the first run. No bugs found, no scope departures, no architectural decisions surfaced.

**Format-check note:** `yarn format:check` reports 142 pre-existing format issues across the repo (unrelated to Phase 70-05). Two of those 142 files happen to be in our 24-file modified list (`QuestionChoices.svelte`, `Video.svelte`), but those files **already failed Prettier before the strip** (verified via `git stash` + recheck). The format issues are pre-existing and out-of-scope per Phase 70-05's strip-only mandate. No format auto-fixes were applied to avoid contaminating the comment-only diff.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `4513c1180` | chore(70-05) | strip Phase 65-01 `// bind: (keep\|ok\|justified)` rationale comments — audit complete |

## TDD Gate Compliance

N/A — Plan 70-05 is a comment-only hygiene plan. No TDD `<behavior>` block; no source-code behavior change; no tests added or required (per VALIDATION.md "0 user-visible-bug-history sites" verdict and Phase 70 D-03).

## Self-Check: PASSED

**Files modified (sample verified):**
- ✓ `apps/frontend/src/lib/components/video/Video.svelte` exists and post-strip has 0 `// bind: (keep|ok|justified)` matches (`git grep` returns 0).
- ✓ `apps/frontend/src/lib/components/input/Input.svelte` is unchanged (Input.svelte was never opened for edit; line 214 still reads `// bind: migrate —`).

**Commits verified:**
- ✓ `4513c1180` — `chore(70-05): strip Phase 65-01 // bind: (keep|ok|justified) rationale comments — audit complete` exists in `git log --oneline -5`.

**Acceptance gates:**
- ✓ `git grep -nE "// bind: (keep|ok|justified)" apps/frontend/src/lib/` returns 0 matches.
- ✓ `git grep -n "// bind: migrate" apps/frontend/src/lib/` returns 1 hit (Input.svelte:214 preserved).
- ✓ `git diff --stat HEAD~1 HEAD` shows 24 files changed, 29 deletions, 0 insertions — comment-only.
- ✓ `yarn workspace @openvaa/frontend build` exits 0.
- ✓ `yarn workspace @openvaa/frontend test:unit` passes 658/658.
