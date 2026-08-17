# Phase 82: A11Y-01 PRODUCT-GAP Cell — Required-Empty - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 82-A11Y-01 PRODUCT-GAP Cell — Required-Empty
**Areas discussed:** Product decision (REJECT / SOFT-WARN-ONLY / TIGHTEN-SOFT), Validation placement + trigger + i18n key (collapsed to N/A by D-01), e2e fixture (how to add a required info question), Spec assertion shape

---

## Product decision (REJECT / SOFT-WARN-ONLY / TIGHTEN-SOFT)

| Option | Description | Selected |
|--------|-------------|----------|
| REJECT with inline error | Save blocked when required empty; user sees inline error per empty required field; submit no-ops in handleSubmit. Matches Phase 76 D-03 'fail-loud' precedent. Largest code surface (Input.svelte branch + save-handler abort + new i18n key in 14 catalogs + spec error-text assertion). | |
| TIGHTEN-SOFT: wire allRequiredFilled into canSubmit | Minimal 1-line change at `+page.svelte:92`: `canSubmit = $derived(status !== 'loading' && allRequiredFilled)`. Submit button becomes truly disabled (matches badge's intent). NO new error message, NO new i18n key, NO Input.svelte changes. | ✓ |
| SOFT-WARN-ONLY: close as PRODUCT-CONFIRMED | Existing badge + (illusory) submit-button gating documented as the enforcement. Cell 4 asserts badge visible when required empty. Zero code change. | |

**User's choice:** TIGHTEN-SOFT. "Just disable the button but create a todo that we should allow the user to save incomplete profile but warn that they cannot proceed to opinion questions before its completed."

**Notes:** User signaled both:
1. The Phase 82 implementation is TIGHTEN-SOFT (minimal, button-disable, no error UI).
2. A FUTURE product change (v2.11+ scope) should backtrack the gate: allow incomplete-profile save BUT prevent navigation to opinion-questions via a Warning + a navigation guard.

Both directions captured: TIGHTEN-SOFT in CONTEXT D-01; future product change in CONTEXT D-02 + deferred-todo `2026-05-13-allow-incomplete-profile-save-gate-opinion-questions.md` authored at Phase 82 close.

**Discovery surfaced during scout (informed the question framing):** the existing submit button at `+page.svelte:304` is NOT actually gated by `allRequiredFilled` today (`canSubmit = $derived(status !== 'loading')` — `allRequiredFilled` only drives the visual "Required" notice's `class:opacity-0` toggle at `:288` and the `submitRouting` route choice). The "Required" badge currently lies about what happens at submit. TIGHTEN-SOFT closes that gap.

---

## Validation placement + trigger + i18n key (conditional on REJECT)

| Option | Description | Selected |
|--------|-------------|----------|
| (Various: save-handler-only abort / Input.svelte per-input branch / both) | Where the rejection lives + when the error fires + which i18n key. | |

**User's choice:** N/A — collapsed by the product-decision choice. TIGHTEN-SOFT requires no Input.svelte changes, no new i18n key, no save-handler abort. The `canSubmit` `$derived` is the entire mechanism.

**Notes:** Acknowledged as collapsed before asking — area was preserved in the gray-area shortlist so the user could redirect if they wanted REJECT. They did not.

---

## e2e fixture: how to add a required info question

| Option | Description | Selected |
|--------|-------------|----------|
| Add new sort-24 row | Additive: NEW `test-question-required-empty-1` with `required: true`. Alpha seeds an answer so Alpha stays `profileComplete` by default. Protects Phase 76 P02 + Phase 81 downstream specs. Matches Phase 81 D-08 additive-anchor pattern. | ✓ |
| Promote existing test-question-displayname to required:true | Reuses sort-19 anchor (Alpha already seeds 'Display Name Sentinel 76'). Smaller diff but couples to Phase 76 P01 cell 3 maxlength + Phase 76 P02 reload-persistence anchors. | |
| Add new row + skip Alpha answer (Alpha incomplete by default) | Cell 4 doesn't need to clear anything — but breaks Alpha's `profileComplete` invariant; cascades to downstream specs. | |

**User's choice:** Add new sort-24 row (recommended option). Captured in CONTEXT D-03 + D-04.

**Notes:** Alpha sentinel value `'sentinel-82-required'` chosen (disjoint from 'alpha' substring per Phase 76 P01 + Phase 81 D-08 value-disjointness invariant). Plain-string shape (NOT LocalizedString) matches the post-Phase-81 single-locale text-input convention noted in Alpha's `test-question-social-1` reason-comment.

---

## Spec assertion shape + Alpha seed-answer strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Button-disabled gate | Visit profile (button enabled, Alpha complete) → clear required field via `getByLabel + fill('') + blur()` → assert `getByTestId('profile-submit')` is disabled. Tight contract, matches TIGHTEN-SOFT semantics directly. | ✓ |
| Button-disabled + 'Required' notice opacity flip | Above + assert the existing `candidateApp.basicInfo.requiredInfo` notice opacity flips from 0 to 1. Stronger contract — verifies submit gate AND visual feedback. More brittle to opacity-class refactors. | |
| Button-disabled + refill restores enable | Above + refill the field with a valid value → assert button re-enables. Round-trip contract — verifies the $derived reactivity edge end-to-end. Largest cell. | |

**User's choice:** Button-disabled gate (recommended option). Captured in CONTEXT D-05.

**Notes:** Standalone `test(...)` block (NOT inside the existing TEXT_CELLS / IMAGE_CELLS for-loops per CONTEXT D-06 — the gate kind is structurally different from format/maxlength). `getByTestId(testIds.candidate.profile.submit)` is the canonical submit-button anchor; planner verifies the testIds registry entry at PLAN.md time. BLUR INVARIANT inherited from Phase 81 D-11: Input.svelte binds `onchange` (NOT `oninput`), so `fill('') + blur()` is REQUIRED to propagate the empty state through the reactive chain.

---

## Claude's Discretion

The following areas were not surfaced to the user (Claude picks defaults; planner refines at PLAN.md time):

- **`canSubmit` $derived expression shape** — inline `&& allRequiredFilled` (default — minimal diff) vs named intermediate. Planner's call.
- **Alpha answer sentinel value text** — `'sentinel-82-required'` (default) vs other 'alpha'-disjoint string. Planner's call.
- **New question name string** — `'Required-empty (Phase 82 A11Y-07 anchor)'` (default) vs shorter `'Required-empty (Phase 82 anchor)'`. Planner's call.
- **Standalone test() vs TEXT_CELLS kind expansion** — default standalone. Planner picks at PLAN.md time if a shared abstraction reads cleaner.
- **Comment update on docstring** — Phase 82 should rewrite the `candidate-profile-validation.spec.ts:23-35` paragraph that flags A11Y-07 as the remaining cell. Planner crafts the exact text.
- **Plan count** — 1 bundled plan (default). Total LOC budget ~25 LOC across 3-4 files; no reason to split.
- **UI-SPEC auto-spawn** — SKIPPED per `feedback_skip_ui_spec_for_a11y_only_phases.md` memory precedent (Phase 76 + Phase 80 + Phase 81 lineage). Phase 82 is a 1-line save-gate + fixture + spec addition with no visual redesign.

---

## Deferred Ideas

- **v2.11+ — Allow incomplete profile save + gate opinion-questions entry.** Per user direction; authored as `.planning/todos/pending/2026-05-13-allow-incomplete-profile-save-gate-opinion-questions.md` at Phase 82 close. Backtracks TIGHTEN-SOFT gate; reroutes enforcement to opinion-questions navigation guard + Warning banner.
- **REJECT-with-inline-error variant** — not chosen for Phase 82; natural escalation path if TIGHTEN-SOFT's disabled-button proves too quiet UX-wise.
- **SOFT-WARN-ONLY close** — not chosen for Phase 82; rejected because the existing canSubmit gating is a lie that TIGHTEN-SOFT closes.
- **Promote existing test-question-displayname to required:true** — not chosen for Phase 82; couples to Phase 76 P01 cell 3 + Phase 76 P02 anchors.
- **Stronger cell 4 assertions** (notice opacity flip + refill round-trip) — not chosen for Phase 82; nice-to-haves that verify implementation details rather than the TIGHTEN-SOFT product contract.
- **Spec `kind: 'gate'` discriminant expansion** — not chosen for Phase 82; default standalone test. If a future cell expands the gate kind, refactor opportunity.
- **i18n key audit across 14 locale catalogs** (Phase 81 inherited deferred) — not applicable to Phase 82 (adds NO i18n keys); remains v2.11+ candidate.
