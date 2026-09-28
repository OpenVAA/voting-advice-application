---
phase: 159-component-context-consolidation
plan: 04
subsystem: ui
tags: [svelte, tailwind, design-system, spacing-tokens, alert]

# Dependency graph
requires:
  - phase: 159-01
    provides: Phase-wide component-consolidation groundwork and the Guard A source scan that binds every wave-2 plan
  - phase: 152-comment-naming-hygiene-sweep
    provides: The `assert-comment-hygiene.mjs` guard wired into `yarn lint:check`, which the new inline rationale comment had to pass (D-N1)
provides:
  - "Alert.svelte carries no bracketed arbitrary spacing value: `-mt-[1rem]` became `-mt-16`, proven render-identical from the compiled stylesheet"
  - "The close-button offset pair `top-2 right-2` is kept, with the operator's reason recorded as an inline comment in the file itself rather than only in planning docs"
  - "A written, reproducible computed-value proof for both spacing sites, read from compiled CSS rather than inferred from config"
affects: [159-verification, visual-regression-baselines, alert-component-consumers]

# Actuals (#2632)
actuals:
  tokens: 356
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prove a spacing-token swap by diffing the COMPILED stylesheet before and after, not by reading the Tailwind config — this project clears `--spacing-*` in `@theme` and redefines it, so the stock scale reasons wrongly"
    - "When a review suggestion is declined on measured grounds, record the measurement in the source file so the point is answered permanently instead of re-raised"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/components/alert/Alert.svelte

key-decisions:
  - "Operator answered `keep-and-record` on the Alert.svelte:117 close-button offset pair: the pair stays, and the reason is recorded in the file itself"
  - "`-mt-[1rem]` -> `-mt-16` chosen over the nearest NAMED token `-mt-lg`, because `--spacing-16: 1rem` reproduces the previous computed length exactly (-16px) while `-mt-lg` would render -20px"
  - "Video.svelte, Modal.svelte and Drawer.svelte deliberately left untouched — keeping the pair is precisely what preserves the four-site idiom"

patterns-established:
  - "Compiled-CSS equivalence proof: capture the pre-change rule from `apps/frontend/.svelte-kit/output/client/_app/immutable/assets/*.css`, apply the change, rebuild, and diff the two declarations plus the token they resolve through"

requirements-completed: [REVIEW-CMP-06]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "The arbitrary-value margin at Alert.svelte:113 is replaced by the exact-equivalent theme token `-mt-16`, with the responsive `sm:mt-0` override intact"
    requirement: "REVIEW-CMP-06"
    verification:
      - kind: other
        ref: "grep -c -- '-\\[1rem\\]' apps/frontend/src/lib/components/alert/Alert.svelte -> 0"
        status: pass
      - kind: other
        ref: "grep -cE 'class=\"[^\"]*\\[[0-9]' apps/frontend/src/lib/components/alert/Alert.svelte -> 0"
        status: pass
      - kind: other
        ref: "grep -c 'sm:mt-0' apps/frontend/src/lib/components/alert/Alert.svelte -> 1"
        status: pass
      - kind: other
        ref: "yarn lint:check (exit 0; includes svelte-check 0 errors/0 warnings and the phase-152 comment-hygiene guard at 0 violations)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend build (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The margin swap renders at exactly its previous computed length, so no visual-regression baseline needs regenerating"
    requirement: "REVIEW-CMP-06"
    verification:
      - kind: other
        ref: "compiled CSS before: .-mt-\\[1rem\\]{margin-top:-1rem} ; after: .-mt-16{margin-top:calc(var(--spacing-16) * -1)} with --spacing-16:1rem — both resolve to -1rem = -16px"
        status: pass
    human_judgment: false
  - id: D3
    description: "The close-button offset pair at Alert.svelte:117 is kept per the operator's `keep-and-record` answer, with the rationale recorded inline in the file"
    requirement: "REVIEW-CMP-06"
    verification:
      - kind: other
        ref: "grep -c 'top-2 right-2' apps/frontend/src/lib/components/alert/Alert.svelte -> 1"
        status: pass
      - kind: other
        ref: "grep -rl 'top-2 right-2' apps/frontend/src -> 4 files (Alert, Video, Modal, Drawer — the idiom intact)"
        status: pass
      - kind: other
        ref: "node scripts/assert-comment-hygiene.mjs -> 0 violations across 1632 files (the new inline comment passes both live rules)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The full E2E suite still passes with these changes present"
    verification: []
    human_judgment: true
    rationale: "Not run by this plan. The plan's own <verification> block scopes the E2E / visual-regression run to the `adopt-named-token` branch, which the operator did not choose; 159-CONTEXT.md § O5 budgets one full-suite run at phase level. The change is a provably render-identical class swap plus an HTML comment, so it has no runtime surface, but the phase-level gate is still outstanding and a human must confirm it ran."

# Metrics
duration: 3 min
completed: 2026-09-02
status: complete
---

# Phase 159 Plan 04: Alert.svelte Ad-Hoc Spacing Summary

**`Alert.svelte`'s bracketed `-mt-[1rem]` replaced by the `-mt-16` theme token, proven render-identical against the compiled stylesheet, and the close-button offset pair kept with the operator's reason recorded inline in the file.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-02T20:36:01Z
- **Completed:** 2026-09-02T20:38:55Z
- **Tasks:** 2 (one decision-recording, one implementation)
- **Files modified:** 1

## Accomplishments

- The actual defect D-H6 names — arbitrary-value bracket syntax bypassing the project's deliberately restrictive spacing scale — is gone from `Alert.svelte`. No bracketed numeric value remains in any `class` attribute in the file.
- The replacement is proven, not asserted: the pre-change and post-change compiled stylesheets were both read, and the two declarations resolve to the same length.
- The reviewer's point about `top-2 right-2` is answered permanently in the source file, naming both computed values and the three sibling sites, so the next reader does not re-raise it.
- The four-site close-button idiom is intact — `Video.svelte`, `Modal.svelte` and `Drawer.svelte` were not touched, which is exactly what keeping the pair buys.

## Task Commits

1. **Task 1: Decide the offset pair at Alert.svelte:117** — no commit (decision-only task; the plan's `<files>` reads "no files modified — decision only", and the acceptance criterion is that the answer is recorded in this summary, which the plan-metadata commit carries).
2. **Task 2: Apply the spacing changes and prove the rendering** — `e176e7059` (refactor), plus `0634cf123` (fix) correcting the sibling line anchors inside the new comment.

## Files Created/Modified

- `apps/frontend/src/lib/components/alert/Alert.svelte` — `-mt-[1rem]` -> `-mt-16` on the fallback close `Button`; one inline rationale comment added above the floating close `<button>`, whose class string is unchanged.

## Task 1 — the operator's answer, verbatim

The operator selected:

> **`keep-and-record`**

carrying this description, verbatim:

> "Rendering provably unchanged, honouring D-H6's own 'must render identically' clause. No visual-baseline churn. The four-site idiom stays consistent. The reason is recorded in the file itself so the reviewer's point is answered permanently rather than re-raised. Free to reverse."

### The facts that answer belongs to (the plan's checkpoint acceptance criteria)

| Fact the checkpoint had to state | Value |
|---|---|
| Current computed value of `top-2` / `right-2` | `--spacing-2` = `.125rem` = **2px** |
| The reviewer's suggested `top-sm` / `right-sm` | `--spacing-sm` = `.5rem` = **8px** |
| Ratio | **4x** the current value |
| Nearest *named* alternative | `xs` = `.25rem` = **4px** — still **2x** |
| Sibling sites carrying the identical class string | `Video.svelte:856`, `Modal.svelte:99`, `Drawer.svelte:89` |
| Cost of adopting the named token | All four sites must change together, plus a `PLAYWRIGHT_VISUAL=1` run with regenerated, reviewed baselines |
| Scope note | The margin site was explicitly **out of scope** for this question and was fixed unconditionally |

The three sibling line numbers are quoted here as measured on the current tree; `159-RESEARCH.md` records them as 858 / 100 / 90 from its own session, and those files have since shifted by a line or two. The class string is identical at all four sites either way. The inline comment in `Alert.svelte` carries the re-measured numbers — see the deviation below.

## The margin swap: token chosen, and the equivalence proof

**Token chosen: `-mt-16`** (`--spacing-16: 1rem`, declared in `apps/frontend/src/app.css`).

This project clears Tailwind's stock spacing scale (`--spacing-*: initial;` inside `@theme`) and redefines it, so the numeric class names are **not** Tailwind's `0.25rem x n`. Reasoning from the stock scale gets this wrong; the values below were read from the compiled output.

| Stage | Compiled declaration | Resolves to |
|---|---|---|
| Before | `.-mt-\[1rem\]{margin-top:-1rem}` | **-1rem = -16px** |
| After | `.-mt-16{margin-top:calc(var(--spacing-16) * -1)}` with `--spacing-16:1rem` | **-1rem = -16px** |

**Delta: 0. Exactly equal.** The `.-mt-\[1rem\]` rule is absent from the post-change stylesheet (grep returns nothing), confirming the arbitrary-value utility is no longer generated at all rather than merely unused.

Method — this is reproducible, not a reading of intent:

1. `yarn workspace @openvaa/frontend build` on the unmodified tree, then `grep -o '\.-mt-\\\[1rem\\\]{[^}]*}' apps/frontend/.svelte-kit/output/client/_app/immutable/assets/*.css`.
2. Apply the edit.
3. Rebuild, then grep for `\.-mt-16{...}` and for `--spacing-16:`.
4. Confirm the old rule no longer appears.

Rejected alternatives, for the record: `-mt-lg` (`--spacing-lg` = `1.25rem` -> **-20px**, +4px) is the nearest *named* token and would have changed the rendering; `-mt-md` (`0.625rem` -> -10px, -6px) likewise. Only `-mt-16` is exact, which is why an unnamed numeric token beats a named one at this site.

The responsive override `sm:mt-0` was left untouched and still follows the margin class.

## Decisions Made

- **`-mt-16`, not `-mt-lg`.** D-H6 says "closest semantic class" *and* "rendering must not change perceptibly". Where those pull apart, the render-identical clause governs, because the defect being fixed is the bracket syntax bypassing the design system — not the choice between two legitimate tokens.
- **The rationale comment lives in the source file, not only here.** That is the substance of the `keep-and-record` option, not decoration: a summary in `.planning/` does not reach the next person reading `Alert.svelte`.
- **The three sibling files stay untouched.** Under `keep-and-record` the consistent action is no action; editing them would be the four-way churn the decision avoided.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The rationale comment's sibling line anchors did not resolve**

- **Found during:** Task 2, immediately after the first commit.
- **Issue:** The comment was authored with the sibling anchors as they appear in `159-RESEARCH.md` and in this executor's brief — `Video.svelte:858`, `Modal.svelte:100`, `Drawer.svelte:90`. Re-measured on this tree, the identical class string sits at `Video.svelte:856`, `Modal.svelte:99` and `Drawer.svelte:89`. The comment exists to answer the reviewer permanently; a comment whose citations point at the wrong lines is the rot it was written to prevent, and it would have shipped a small falsehood into source.
- **Fix:** Re-ran `grep -n 'btn btn-circle btn-ghost btn-sm absolute top-2 right-2'` across the three files and wrote the measured numbers.
- **Files modified:** `apps/frontend/src/lib/components/alert/Alert.svelte`
- **Verification:** `node scripts/assert-comment-hygiene.mjs` 0 violations; `yarn prettier --check` clean; the three anchors now resolve to the quoted lines.
- **Committed in:** `0634cf123`

---

**Total deviations:** 1 auto-fixed (1 bug).
**Impact on plan:** None on scope. The change is confined to three numbers inside the comment the plan asked for; no class string and no rendered output moved.

One further observation, not a deviation:

- The plan and its source documents cite the two spacing sites as `:114` and `:117`. On the tree at execution start they were at `:113` and `:116` (a one-line drift accumulated since research). After the inline comment was inserted, the close button sits at `:117` again, matching the cited number. No behaviour rests on this; it is recorded so the next reader is not confused by the off-by-one.
- Task 1 produced no code commit. It is a decision-only task whose `<files>` field says so explicitly, and its acceptance criterion is that the answer is recorded in the summary. The operator's answer was supplied to this executor with the instruction not to re-raise it, so no checkpoint was surfaced.

## Verification Results

| Check | Result |
|---|---|
| `grep -c -- '-\[1rem\]' .../Alert.svelte` | **0** — PASS |
| `grep -cE 'class="[^"]*\[[0-9]' .../Alert.svelte` | **0** — PASS |
| `grep -c 'sm:mt-0' .../Alert.svelte` | **1** — PASS |
| `grep -c 'top-2 right-2' .../Alert.svelte` | **1** — PASS |
| `grep -rl 'top-2 right-2' apps/frontend/src` | **4 files** (Alert, Video, Modal, Drawer) — PASS |
| `yarn lint:check` | **exit 0** — PASS. svelte-check 0 errors / 0 warnings; comment-hygiene guard 0 violations over 1632 files with both rules live |
| `yarn workspace @openvaa/frontend build` | **exit 0** — PASS |
| `yarn prettier --check .../Alert.svelte` | PASS (the single-line comment survives formatting unreflowed) |
| Compiled-CSS equivalence | PASS — see the table above |

The `adopt-named-token`-only criteria and the plan's conditional `PLAYWRIGHT_VISUAL=1` visual-regression line are **not applicable**: that branch was not chosen, and nothing rendered changed.

## Issues Encountered

None.

## Known Stubs

None. No placeholder, empty literal or TODO was introduced.

## Threat Flags

None. The plan's `<threat_model>` records T-159-10 (a spacing change large enough to move the close control, degrading its touch target) as `mitigate`; the mitigation held — the offset pair is byte-identical and the margin's computed length is unchanged, so the close control has not moved by a single pixel and the touch target is untouched. No new network, parsing or authorization surface exists to flag.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Criterion 6a is closed. Both ad-hoc spacing values in `Alert.svelte` now have an applied and written-down disposition, which is D-H6's "both values" reading.
- **Outstanding at phase level, not plan level:** the full E2E suite has not been run since this change. `159-CONTEXT.md` § O5 budgets one full-suite run (fresh dev server, `db:reset`) for Phase 159 as a whole, and this plan's `<verification>` deliberately scopes the E2E/visual-regression run to the branch the operator did not choose. The change carries no runtime surface, but per the project's cardinal E2E rule the phase cannot close until that suite is observed green.
- `159-06`'s `$layouts` work and this plan do not overlap; `Alert.svelte` is not among the route-root components being moved.

## Self-Check: PASSED

- `apps/frontend/src/lib/components/alert/Alert.svelte` exists on disk — FOUND.
- Commits `e176e7059` and `0634cf123` found in `git log --oneline --all` — FOUND.
- All Task 2 acceptance criteria re-run above; all PASS.
- The three sibling anchors quoted in the inline comment re-verified against `grep -n` after the correction — all three resolve.

---
*Phase: 159-component-context-consolidation*
*Completed: 2026-09-02*
