# Phase 64-04 — Pre-existing Svelte 5 Warnings Manifest

**Captured:** 2026-04-27
**Source:** Verbatim seed inventory provided by orchestrator (sourced from `vite-plugin-svelte` dev-server output) augmented with static greps across `apps/frontend/src` to confirm reachability. Dev server PID 88713 confirmed running at http://localhost:5173 (200 OK on `/en`).

## Categorization

- **A** — `a11y-*` rule deprecation rename (mechanical: `a11y-foo-bar` → `a11y_foo_bar` in `<!-- svelte-ignore -->` comments)
- **B** — Self-closing non-void HTML element (e.g., `<span ... />` → `<span ...></span>`)
- **C** — `let X = ...` mutated/bound but missing `$state(...)` declaration
- **D** — `state_referenced_locally` — prop read at script top level not wrapped in `$derived` / closure / `$effect`
- **E** — Genuine a11y violation (label/control association missing, tabindex>0, missing keyboard handler) requiring real fix or justified `svelte-ignore`
- **F** — Other / nuanced

## EntityListControls reachability

Static grep confirms `EntityListControls.svelte` is still reachable via:
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityChildren.svelte:46`
- `apps/frontend/src/routes/(voters)/nominations/+page.svelte:63`

Therefore: **DO NOT delete**; fix its warnings.

## Warning Inventory

| # | File | Line(s) | Cat | Rule / Symptom | Suggested Fix |
|---|------|---------|-----|----------------|---------------|
| 1 | `lib/components/electionSelector/ElectionSelector.svelte` | 35-36 | D | `state_referenced_locally` on `elections` (auto-select-single short-circuit at top level) | Wrap in `$effect(() => { if (elections.length === 1 && selected.length === 0) selected = [elections[0].id]; })` to react to async-arriving elections |
| 2 | `lib/components/button/Button.svelte` | 175 | A | `a11y-no-static-element-interactions` rename | `a11y_no_static_element_interactions` |
| 3 | `lib/components/button/Button.svelte` | 91:5/27/54 | D | `state_referenced_locally` on `variant` | Wrap in `$derived(...)` |
| 4 | `lib/components/button/Button.svelte` | 92:5/26 | D | `state_referenced_locally` on `iconPos` | Wrap in `$derived(...)` |
| 5 | `lib/components/errorMessage/ErrorMessage.svelte` | 38, 44 | D | `state_referenced_locally` on `logMessage`/`message`/`inline` | Wrap in `$derived(...)` |
| 6 | `lib/components/loading/Loading.svelte` | 39, 43 | C | `let classes`/`let spinnerClass` missing `$state` | `let X = $state(...)` |
| 7 | `lib/components/loading/Loading.svelte` | 40, 44 | D | `state_referenced_locally` on `inline`/`size` | Wrap in `$derived(...)` |
| 8 | `lib/components/loading/Loading.svelte` | 61 | B | `<span ... />` self-closing | `<span ...></span>` |
| 9 | `lib/candidate/components/logoutButton/LogoutButton.svelte` | 52 | C+D | `let timeLeft` missing `$state`; `state_referenced_locally` on `logoutModalTimer` | Convert + wrap |
| 10 | `lib/components/modal/timed/TimedModal.svelte` | 87 | C+D | `let progressBarTimer` missing `$state`; `state_referenced_locally` on `timerDuration` | Convert + wrap |
| 11 | `lib/components/modal/timed/TimedModal.svelte` | 156 (multiline ends at 160) | B | `<progress ... />` self-closing | `<progress ...></progress>` |
| 12 | `lib/components/video/Video.svelte` | 823 | B | `<div ... />` self-closing (multiline) | `<div ...></div>` |
| 13 | `lib/components/feedback/Feedback.svelte` | 88 | D | `state_referenced_locally` on `variant` | Use `$derived(...)` |
| 14 | `lib/components/surveyBanner/SurveyBanner.svelte` | 31 | C | `let clicked` missing `$state` | `let clicked = $state(false)` |
| 15 | `routes/Header.svelte` | 74 (multiline ends at 78) | B | `<progress ... />` self-closing | `<progress ...></progress>` |
| 16 | `routes/Layout.svelte` | 68 | A | `a11y-positive-tabindex` rename | `a11y_positive_tabindex` |
| 17 | `routes/Layout.svelte` | 69 | E | Avoid tabindex values above zero (genuine) | Investigate; may need `tabindex="0"` or refactor focus mgmt; if rationale exists, justify with `svelte-ignore` |
| 18 | `routes/Layout.svelte` | 109 | B | `<div ... />` self-closing | `<div ...></div>` |
| 19 | `lib/components/expander/Expander.svelte` | 76, 99, 120, 130-134 | D | Multiple `state_referenced_locally` | Wrap in `$derived(...)` |
| 20 | `lib/components/expander/Expander.svelte` | 94-96 | C | `let titleClasses`/`contentClasses`/`iconClass` missing `$state` | Convert (or actually convert to `$derived` since they're computed from props) |
| 21 | `lib/components/questions/OpinionQuestionInput.svelte` | 51 | D | `state_referenced_locally` on `mode`/`otherAnswer`/`otherLabel` | Wrap in `$derived(...)` |
| 22 | `lib/components/questions/QuestionArguments.svelte` | 33 | D | `state_referenced_locally` on `question` | Wrap in `$derived(...)` |
| 23 | `lib/components/questions/QuestionChoices.svelte` | 227, 233 | B | `<div ... />` self-closing (multiline) | `<div ...></div>` |
| 24 | `lib/components/questions/QuestionChoices.svelte` | 258 | A | `a11y-no-noninteractive-element-interactions` rename | `a11y_no_noninteractive_element_interactions` |
| 25 | `lib/components/questions/QuestionChoices.svelte` | 259 | E | Non-interactive `<label>` with mouse/keyboard listeners (genuine) | Justify with `svelte-ignore` rationale (radio-label pattern is intentional) |
| 26 | `lib/components/questions/QuestionExtendedInfo.svelte` | 42-43 | D | `state_referenced_locally` on `question` | Wrap in `$derived(...)` |
| 27 | `lib/components/questions/QuestionOpenAnswer.svelte` | 28 | C | `let el` missing `$state` (bind:this ref) | `let el = $state<HTMLElement \| undefined>()` |
| 28 | `routes/(voters)/(located)/+layout.svelte` | 47 | C | `let modalRef` missing `$state` | `let modalRef = $state<...>()` |
| 29 | `lib/components/entityFilters/text/TextEntityFilter.svelte` | 38, 46 | D | `state_referenced_locally` on `filter` | Wrap in `$derived(...)` |
| 30 | `lib/components/scoreGauge/ScoreGauge.svelte` | 64 (multiline ends at 71) | B | `<progress ... />` self-closing | `<progress ...></progress>` |
| 31 | `lib/dynamic-components/entityDetails/EntityChildren.svelte` | 30 | D | `state_referenced_locally` on `entities` | Wrap in `$derived(...)` |
| 32 | `lib/dynamic-components/entityDetails/EntityDetails.svelte` | 53 | C | `let answers` missing `$state` | `let answers = $state(...)` |
| 33 | `lib/dynamic-components/entityDetails/EntityDetailsDrawer.svelte` | 26 | D | `state_referenced_locally` on `entity` | Wrap in `$derived(...)` |
| 34 | `lib/dynamic-components/entityList/EntityListControls.svelte` | 44 | C | `let filtersModalRef` missing `$state` (bind:this ref) | `let filtersModalRef = $state<...>()` |
| 35 | `lib/dynamic-components/entityList/EntityListControls.svelte` | 49, 51, 56 | D | `state_referenced_locally` on `searchProperty`/`filterGroup` | Wrap in `$derived(...)` |
| 36 | `lib/candidate/components/passwordField/PasswordField.svelte` | 41 | D | `state_referenced_locally` on `idProp` | Wrap in `$derived(...)` |
| 37 | `routes/(voters)/candidate/login/+page.svelte` (path may differ) | 58 | C | `let passwordFieldRef` missing `$state` | `let passwordFieldRef = $state<...>()` |
| 38 | `routes/(voters)/candidate/login/+page.svelte` | 67 | D | `state_referenced_locally` on `errorMessage` | Wrap in `$derived(...)` |
| 39 | `lib/components/constituencySelector/ConstituencySelector.svelte` | 49 | D | `state_referenced_locally` on `elections` | Wrap in `$derived(...)` |
| 40 | `lib/components/select/Select.svelte` | 72 | C | `let autocompleteInput` missing `$state` (bind:this ref) | `let autocompleteInput = $state<...>()` |
| 41 | `lib/components/select/Select.svelte` | 292 | A | `a11y-click-events-have-key-events` rename | `a11y_click_events_have_key_events` |
| 42 | `lib/components/select/Select.svelte` | 294 | E | Visible non-interactive click without keyboard handler (genuine) | Add `onkeydown`/`onkeyup` keyboard handler OR justify suppression |
| 43 | `routes/(voters)/nominations/+page.svelte` | 35 | C | `let filteredEntities` missing `$state` | `let filteredEntities = $state([])` |
| 44 | `lib/components/successMessage/SuccessMessage.svelte` | 36 | D | `state_referenced_locally` on `inline` | Wrap in `$derived(...)` |
| 45 | `lib/components/input/Input.svelte` | 107-118 | D | Multiple `state_referenced_locally` | Wrap each in `$derived(...)` |
| 46 | `lib/components/input/Input.svelte` | 199 | C | `let fileInput` missing `$state` (bind:this ref) | `let fileInput = $state<...>()` |
| 47 | `lib/components/input/Input.svelte` | 354, 374, 398, 500, 503 | A | Multiple `a11y-*` rule renames | Replace dashes with underscores in svelte-ignore comments |
| 48 | `lib/components/input/Input.svelte` | 355, 375, 399, 501, 504 | E | "label not associated with control" / "noninteractive-tabindex" (genuine) | Wire `for=""` ↔ `id=""` where possible; justify retained suppressions |
| 49 | `lib/components/input/Input.svelte` | 381, 428 | B | `<textarea ... />` self-closing (multiline, ends ~393, ~436) | `<textarea ...></textarea>` |
| 50 | `lib/components/questions/QuestionInput.svelte` | 37-121 | D | Many `state_referenced_locally` on `question`/`answer`/`disableMultilingual`/`restProps` | Wrap each in `$derived(...)` (some may be inside functions — leave those) |
| 51 | `lib/candidate/components/passwordValidator/PasswordValidator.svelte` | 142, 144, 146 | B | `<progress ... />` self-closing | `<progress ...></progress>` |

## Critical case (D-08 cascade root)

**Item 1** — `ElectionSelector.svelte:35-36` auto-select short-circuit currently runs once at component init using the snapshot value of `elections`. Convert to `$effect(() => { ... })` so it reacts to async-arriving elections data. This was empirically linked to voter-app cascade failures in the canonical capture per orchestrator notes.

## Static grep confirmation

- `grep -rn "a11y-[a-z-]" apps/frontend/src --include="*.svelte"` — confirmed 9 active deprecated `<!-- svelte-ignore a11y-* -->` lines in `Input.svelte` (5), `Button.svelte` (1), `Select.svelte` (1), `QuestionChoices.svelte` (1), `Layout.svelte` (1).
- `grep -rn "<\(span\|progress\|div\|textarea\) ... />"` for HTML void-vs-non-void confirmed:
  - `PasswordValidator.svelte:142,144,146` `<progress />` (3 lines)
  - `Loading.svelte:61` `<span />` (1 line)
  - `Layout.svelte:109` `<div />` (1 line)
  - Plus seed-named multi-line cases in `TimedModal.svelte:156-160`, `Header.svelte:74-78`, `Video.svelte:823+`, `ScoreGauge.svelte:64-71`, `QuestionChoices.svelte:227,233`, `Input.svelte:381,428`.

## Counts per category

| Cat | Count | Notes |
|-----|-------|-------|
| A | 9 lines (across 5 files) | Mechanical rename inside `<!-- svelte-ignore -->` |
| B | ~14 instances (12 lines listed, some multi-line) | HTML non-void self-close |
| C | ~13 declarations | `let` → `$state` (bind:this refs + counters) |
| D | ~30+ prop reads | `$derived` or template-only access |
| E | ~10 a11y issues | Genuine — fix or justify |
| F | 0 | None observed |

## Notes on ordering

Plan executes Categories A+B (Task 2) first since they're zero-risk syntax. C (Task 3) follows — touches reactivity but each fix is local. D (Task 4) is the most invasive — `$derived` adds new reactive edges; ElectionSelector is the empirically-linked critical case. E (Task 5) requires a11y judgment and gets `svelte-ignore` rationales for the harder ones. Task 6 is the surgical fixture-timeout bump.
