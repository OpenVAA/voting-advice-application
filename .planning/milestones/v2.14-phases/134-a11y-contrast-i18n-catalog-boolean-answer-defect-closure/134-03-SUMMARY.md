---
phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure
plan: 03
subsystem: i18n
tags: [paraglide, inlang, mf2, plurals, wcag, aria-label, svelte, i18n-catalog]

# Dependency graph
requires:
  - phase: 134-02
    provides: Wave-2 a11y/contrast work; this plan's catalog edits are independent of it but sequenced after
  - phase: 134-research
    provides: "§B verbatim 7×7 value table and the MF2 plural-declaration template used for selectExact"
provides:
  - "questions.multiChoice.selectExact as an MF2 plural declaration (input `count`, local `countPlural`) in all 7 runtime locales"
  - "questions.multiChoice.selectRange in all 7 runtime locales, byte-identical to the type-gen source"
  - "components.accordionSelect.listboxAriaLabel in all 7 runtime locales — closes a WCAG 2.1 AA accessible-name defect"
  - "components.multipleTextInput.{add,moveDown,moveUp,remove} in all 7 runtime locales"
  - "Full runtime/type-gen catalog key-set parity in all 7 locales (0 keys missing from runtime) — the precondition Plan 04's parity check needs"
  - "Proof that `count` is an acceptable MF2 input name in this Paraglide/inlang setup (research Assumption A1 resolved)"
affects: [134-04 catalog parity check, 134-06 e2e, 134-07 UAT review items, i18n catalog authoring]

actuals:
  tokens: 13000
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "MF2 plural declaration with a non-`numX` input name (`count` / `countPlural`) — first in-repo precedent"
    - "Runtime catalog values mirrored programmatically from the type-gen source so byte-fidelity (en dash vs hyphen, typographic apostrophes) survives the copy"

key-files:
  created: []
  modified:
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/questions.json
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/components.json

key-decisions:
  - "selectExact ships as an MF2 plural declaration in all 7 locales (D-09/D-18), not a plain string — the singular branch was the whole point"
  - "The 6 non-English singular forms are CONSTRUCTED from the plural strings (research MEDIUM confidence), not natively authored; Plan 07 files the D-18 native-speaker review item"
  - "listboxAriaLabel placed AFTER collapsedAriaInfo (true alphabetical order, matching the type-gen source) rather than before, as the plan's prose literally said"
  - "MF2 input name kept as `count` to match the QuestionChoices.svelte call site; proven correct by the render proof rather than pre-emptively renamed"

patterns-established:
  - "Catalog additions are copied programmatically from src/lib/i18n/translations/ rather than retyped — hand-copying silently normalises punctuation the two catalogs must keep divergent"
  - "A new MF2 declaration with an unprecedented input name is proved by building and importing the compiled Paraglide output directly in Node, since vitest aliases the Paraglide runtime to mocks"

requirements-completed: [FIX-02]

coverage:
  - id: D1
    description: "questions.multiChoice.selectExact renders a grammatical singular at count=1 and the plural at count=2, in all 7 locales"
    requirement: FIX-02
    verification:
      - kind: other
        ref: "node render-proof.mjs against apps/frontend/src/lib/paraglide/messages.js — 14 branches printed; en asserted === 'Select 1 option.' / 'Select 2 options.'"
        status: pass
    human_judgment: true
    rationale: "The 6 non-English singular forms are constructed, not natively authored (D-18). Rendering correctly proves the mechanism, not the grammar — a native speaker must sign off on the wording."
  - id: D2
    description: "questions.multiChoice.selectRange resolves to real text in all 7 locales, byte-identical to the type-gen source"
    requirement: FIX-02
    verification:
      - kind: other
        ref: "node byte-identity check messages/ vs translations/ (Task 1 <verify>) + render proof with { min: 2, max: 3 }"
        status: pass
    human_judgment: false
  - id: D3
    description: "components.accordionSelect.listboxAriaLabel gives the AccordionSelect listbox a translated accessible name instead of the literal dotted key path (WCAG 2.1 AA)"
    requirement: FIX-02
    verification:
      - kind: other
        ref: "node byte-identity check (Task 2 <verify>) + render proof — 'Select an option' for en, no locale returns its key path"
        status: pass
    human_judgment: true
    rationale: "Announcement in an actual screen reader is the real acceptance test; the render proof only shows the string reaching the aria-label."
  - id: D4
    description: "components.multipleTextInput.{add,moveDown,moveUp,remove} resolve to real text in all 7 locales"
    requirement: FIX-02
    verification:
      - kind: other
        ref: "node byte-identity check (Task 2 <verify>) + render proof — 28 values printed, none equal to its key path"
        status: pass
    human_judgment: false
  - id: D5
    description: "Runtime and type-gen catalogs now have identical key sets in all 7 locales (Plan 04's parity precondition)"
    verification:
      - kind: other
        ref: "node flat-key-set diff messages/{locale}/*.json vs translations/{locale}/*.json — 0 missing per locale"
        status: pass
    human_judgment: false

# Metrics
duration: 13min
completed: 2026-08-10
status: complete
---

# Phase 134 Plan 03: Runtime i18n Catalog Key Closure Summary

**The 7 keys that were authored only in the type-gen source now exist in the runtime Paraglide catalog in all 7 locales, and `selectExact` ships as an MF2 plural declaration that renders `Select 1 option.` at count=1 — proven against the compiled output, not assumed.**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-08-10T10:34Z
- **Completed:** 2026-08-10T10:47Z
- **Tasks:** 3/3
- **Files modified:** 14

## Accomplishments

- Closed FIX-02 / D-08: all 7 keys (`questions.multiChoice.selectExact`, `questions.multiChoice.selectRange`, `components.accordionSelect.listboxAriaLabel`, `components.multipleTextInput.{add,moveDown,moveUp,remove}`) now resolve to real text in `da, en, et, fi, fr, lb, sv`. Before this plan they fell through and `t()` returned the raw dotted key path to users.
- Closed the WCAG defect specifically: `AccordionSelect`'s `role="listbox"` was named with the literal string `components.accordionSelect.listboxAriaLabel`, so assistive technology announced a dotted identifier where a control name belongs. It now announces e.g. `Select an option` / `Välj ett alternativ`.
- Shipped `selectExact` as an MF2 plural declaration (D-09/D-18) in all 7 locales rather than a plain string, so a 1-of-1 constraint reads `Select 1 option.` instead of `Select 1 options.`
- **Resolved research Assumption A1:** `count` works as an MF2 input name. It had no in-repo precedent (every existing declaration uses a `numX`-style name), and no E2E spec exercises `selectExact` — the seeded multi-choice question carries a 2..3 window and therefore renders `selectRange`. A build + direct import of the compiled Paraglide output was the only available proof, and it was run for real.
- Achieved full runtime/type-gen key-set parity in all 7 locales (0 keys missing from runtime), which is the precondition Plan 04's parity check needs.

## Task Commits

1. **Task 1: Add the two multiChoice keys to messages/{locale}/questions.json in all 7 locales** — `3b098a22e` (feat)
2. **Task 2: Add the five component keys to messages/{locale}/components.json in all 7 locales** — `324ec8661` (feat)
3. **Task 3: Prove the compiled Paraglide output renders — including the plural at count=1** — no commit; the task produced no source change (build passed as-is, prettier did not reflow the hand-authored JSON, and `apps/frontend/src/lib/paraglide/` is gitignored). Its output is the evidence recorded below.

## Files Created/Modified

- `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/questions.json` — added a `multiChoice` object under the single top-level `questions` key, placed between `intro` and `next`. `selectExact` is an MF2 plural declaration; `selectRange` is a plain interpolation string.
- `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/components.json` — added `listboxAriaLabel` to the existing `accordionSelect` object (preserving `collapsedAriaInfo`) and a new top-level `multipleTextInput` object with four button labels, placed alphabetically between `matchScore` and `passwordInput`.
- **Not modified (deliberately):** `apps/frontend/project.inlang/settings.json` (both files were already in the `pathPattern` allowlist — `git diff --stat` on that directory reports no changes), and `apps/frontend/src/lib/i18n/translations/` (D-09 keeps the MF2 shape runtime-only).

## Evidence: the 14 rendered `selectExact` strings

Produced by building the frontend (which runs `paraglideVitePlugin`) and then importing
`apps/frontend/src/lib/paraglide/messages.js` directly in Node, calling the compiled
`questions.multiChoice.selectExact` with an explicit `{ locale }` for each of the 7 locales at
`{ count: 1 }` and `{ count: 2 }`. Verbatim output:

```
=== selectExact — 14 plural branches (7 locales x count 1|2) ===
en count=1  "Select 1 option."
en count=2  "Select 2 options."
fi count=1  "Valitse 1 vaihtoehto."
fi count=2  "Valitse 2 vaihtoehtoa."
sv count=1  "Välj 1 alternativ."
sv count=2  "Välj 2 alternativ."
da count=1  "Vælg 1 mulighed."
da count=2  "Vælg 2 muligheder."
et count=1  "Vali 1 valik."
et count=2  "Vali 2 valikut."
fr count=1  "Sélectionnez 1 option."
fr count=2  "Sélectionnez 2 options."
lb count=1  "Wielt 1 Optioun."
lb count=2  "Wielt 2 Optiounen."

=== hard assertions ===
en count=1 === "Select 1 option." PASS
en count=2 === "Select 2 options." PASS
```

> **`sv` note for the D-18 reviewer:** `Välj 1 alternativ.` and `Välj 2 alternativ.` are byte-identical
> apart from the numeral. That is expected — Swedish *alternativ* is invariant in the plural — but it is
> exactly the kind of pair a reviewer will want to confirm rather than assume.

The other 5 keys and `selectRange` were rendered once per locale in the same run:

```
=== selectRange ({ min: 2, max: 3 }) ===
en  "Select 2 to 3 options."
fi  "Valitse 2–3 vaihtoehtoa."
sv  "Välj 2–3 alternativ."
da  "Vælg 2-3 muligheder."
et  "Vali 2–3 valikut."
fr  "Sélectionnez 2 à 3 options."
lb  "Wielt 2 bis 3 Optiounen."

=== components.* (en shown; all 7 locales rendered, all non-key) ===
en components.accordionSelect.listboxAriaLabel   "Select an option"
en components.multipleTextInput.add              "Add item"
en components.multipleTextInput.moveUp           "Move up"
en components.multipleTextInput.moveDown         "Move down"
en components.multipleTextInput.remove           "Remove item"

ALL CHECKS PASSED — 7 keys x 7 locales rendered real text; no throws; no key-path fallthrough.
```

Note that `da` keeps a hyphen (`2-3`) while `fi`/`sv`/`et` use an en dash (`2–3`). That divergence is
present in the type-gen source and was preserved deliberately so the two catalogs stay byte-comparable.

Assertions enforced by the proof script (exit 1 on any failure; it exited 0):
- `en` at `{count: 1}` is exactly `Select 1 option.`, at `{count: 2}` exactly `Select 2 options.`
- No key in any locale threw.
- No rendered value equals its own dotted key path — which is precisely what Paraglide returns as the
  fallback when no variant matches, so this also proves the `countPlural` selector actually matches.

The proof script was written to the scratch directory and deleted afterwards; `git status --porcelain`
confirms nothing from it, and nothing from the build, entered the working tree.

## Verification Results

| Check | Command | Result |
|---|---|---|
| Task 1 byte-identity + MF2 shape | Task 1 `<verify>` node script | `ok`, exit 0 |
| All 7 locales have `questions.multiChoice` | `for l in da en et fi fr lb sv; …` | exit 0 |
| All 14 catalog files parse as JSON | `node -e "…JSON.parse…"` | exit 0 |
| `project.inlang/` untouched | `git diff --stat apps/frontend/project.inlang/` | empty |
| Task 2 byte-identity + no clobber | Task 2 `<verify>` node script | `ok`, exit 0 |
| `en` aria-label value | `=== 'Select an option'` | exit 0 |
| Frontend build (Paraglide compile) | `yarn workspace @openvaa/frontend build` | `✔ done`, exit 0 |
| 14-branch render proof | `node render-proof.mjs` | exit 0, output above |
| Working tree clean of build output | `git status --porcelain` | only pre-existing dirt |
| Catalog key-set parity, all 7 locales | flat key-set diff `messages/` vs `translations/` | 0 missing per locale |
| Prettier on the 14 touched files | `npx prettier --check <14 files>` | "All matched files use Prettier code style!", exit 0 |
| `yarn format:check` (repo-wide) | `yarn format:check` | **exit 1 — 188 pre-existing failures, none of them this plan's files** (see below) |

### `yarn format:check` — reported honestly

The plan's Task 3 acceptance criterion says `yarn format:check` exits 0. **It does not: it exits 1 with
188 `[warn]` entries.** This is the known repo-wide pre-existing prettier backlog (the orchestrator
briefed it as ~187, under separate decision), not a regression from this plan. Grepping the full
`format:check` log for any of the 14 files this plan touches returns nothing, and a targeted
`npx prettier --check` on exactly those 14 files passes. The criterion is therefore recorded as
**failed-as-stated but not caused here**; I did not weaken the assertion and did not touch the other
files to make it green.

## Decisions Made

- **`selectExact` kept as an MF2 declaration in all 7 locales.** The alternative — shipping a plain
  string and dodging the grammar question — would reintroduce `Select 1 options.` and was explicitly
  ruled out by D-09/D-18.
- **Input name left as `count`.** The call site in `QuestionChoices.svelte:421` passes
  `{ count: multiConstraints.effectiveMax }`; renaming the MF2 input without renaming the call-site
  param would silently break interpolation. Proven acceptable rather than pre-emptively changed.
- **Values copied programmatically, not by hand.** A short throwaway Node script read each value out of
  `src/lib/i18n/translations/{locale}/*.json` and wrote it into the runtime catalog, guaranteeing
  byte-fidelity for the en-dash/hyphen divergence and the French typographic apostrophe. Prettier was
  then run on the 14 files only.

## Deviations from Plan

### 1. [Readability — key placement] `listboxAriaLabel` placed after `collapsedAriaInfo`, not before

- **Found during:** Task 2
- **Issue:** The plan's action prose says to add `listboxAriaLabel` "placed alphabetically before"
  `collapsedAriaInfo`. Those two instructions contradict each other — `collapsedAriaInfo` sorts before
  `listboxAriaLabel`.
- **Fix:** Followed *alphabetically*, i.e. placed it after `collapsedAriaInfo`. This also matches the
  ordering in the type-gen source (`src/lib/i18n/translations/{locale}/components.json`), which makes
  the two catalogs diff cleanly against each other.
- **Impact:** None on correctness — JSON key order is not semantic and prettier does not sort JSON keys.
  Purely a readability choice, as the plan itself notes for the sibling top-level placement.
- **Committed in:** `324ec8661`

### 2. [Reporting] Task 3's `yarn format:check` criterion could not be met as written

- **Found during:** Task 3
- **Issue:** `yarn format:check` exits 1 on 188 pre-existing repo-wide failures.
- **Action taken:** None — the orchestrator brief scopes those out of this plan explicitly. Verified
  instead that the 14 files this plan touches are prettier-clean, and reported the criterion as failing
  for a pre-existing cause rather than silently restating it as passing.

**Total deviations:** 1 substantive (key ordering, cosmetic), 1 reporting note. No auto-fixes under
deviation Rules 1–3 were required; no architectural (Rule 4) questions arose.

## Issues Encountered

None. The build compiled the new MF2 declaration on the first attempt and every locale's plural
selector matched, so the `count` input-name risk that motivated Task 3 did not materialise.

## Known Stubs

None.

## Threat Flags

None. This plan adds only static build-time catalog content to two files already registered in the
`project.inlang/settings.json` `pathPattern` allowlist (T-134-07 mitigated: `git diff --stat` on that
directory is empty). All 7 call sites render a text node, an `aria-label`, or a Button `text` prop —
no `{@html}` path exists and none of the added values contains markup (T-134-06). T-134-08 is mitigated
by this plan's core change: the accordion listbox now has a real accessible name.

## Outstanding for later plans

- **D-18 native-speaker review (Plan 07 files the UAT item):** the 6 non-English `countPlural=one`
  forms — `fi`, `sv`, `da`, `et`, `fr`, `lb` — were **constructed** from the existing plural strings by
  research at MEDIUM confidence. No singular form exists anywhere in the repo to copy. The 14 strings
  quoted verbatim above are what actually shipped and are the exact text the reviewer should act on.
  `en` is HIGH confidence and needs no review.
- **Plan 04's parity check** now has its precondition: 0 keys missing from the runtime catalog in any
  of the 7 locales.
- **No E2E coverage of `selectExact` exists.** The seeded multi-choice question carries a 2..3 window,
  so it renders `selectRange`. If a future phase wants regression protection for the singular branch,
  it needs either a seeded exact-1 question or a dedicated render test — the build-time proof in this
  plan is a point-in-time check, not a standing guard.

## Self-Check: PASSED

- `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/questions.json` — all 7 present with `multiChoice`
- `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/components.json` — all 7 present with both new blocks
- Commit `3b098a22e` — found in `git log`
- Commit `324ec8661` — found in `git log`
- No deletions introduced by either commit (`git diff --diff-filter=D HEAD~1 HEAD` empty for both)

## Next Phase Readiness

Plan 04's catalog-parity check is unblocked. Nothing here needs the dev server or a database, and the
E2E suite was deliberately not run (that is Plan 06/08's gate).

---
_Phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure_
_Completed: 2026-08-10_
