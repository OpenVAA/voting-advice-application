---
phase: quick-260930-gjx
plan: 01
type: execute
wave: 1
depends_on: []
quick_id: 260930-gjx
files_modified:
  - apps/frontend/src/lib/components/questions/QuestionArguments.svelte
  - apps/frontend/src/lib/components/questions/QuestionArguments.svelte.test.ts
  - apps/frontend/messages/fi/questions.json
  - apps/frontend/src/lib/i18n/translations/fi/questions.json
  - apps/frontend/src/lib/i18n/tests/translations.test.ts
  - apps/frontend/src/lib/utils/questions/extendedInfo.ts
  - apps/frontend/src/lib/utils/questions/extendedInfo.test.ts
  - apps/frontend/src/lib/utils/questions/index.ts
  - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
  - apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte
  - apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte.test.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts
  - tests/tests/specs/perm/perm-interactive-info.spec.ts
autonomous: true
requirements: [QUICK-260930-gjx]

must_haves:
  truths:
    - "In every locale, a question's pro arguments (LikertPros, BooleanPros) render under that locale's 'for' label and its con arguments (LikertCons, BooleanCons) under its 'against' label: en For/Against, fi Puolesta/Vastaan; CategoricalPros keeps the proCategory label with the choice label as {option}"
    - "Pro argument groups render before con argument groups whatever order customData.arguments lists them in, and groups on the same side keep their authored order (the sort comparator is symmetric)"
    - "In every locale's runtime catalogue (apps/frontend/messages) questions.arguments.pro differs from .con and .proCategory contains the pro label and not the con label; the type-gen catalogue (src/lib/i18n/translations) holds the same arguments values as the runtime catalogue for every locale"
    - "With questions.interactiveInfo.enabled, a question that has arguments but no info text and no infoSections shows the extended-info button, and the popup it opens contains the arguments expander"
    - "An empty customData.arguments array renders no arguments expander; a question with infoSections and arguments renders the sections followed by the arguments expander (the drawer-host entry point QuestionExtendedInfoButton is unchanged)"
    - "The perm-interactive-info E2E dataset and assertions are unchanged (group testids stay keyed by likertPros / booleanPros / choiceId), and no comment in the seed or spec still claims arguments render only inside the infoSections block"
    - "If revalidation at HEAD shows every finding already fixed, the item closes as 'dropped — <reason>' with no code change"
  artifacts:
    - path: apps/frontend/src/lib/components/questions/QuestionArguments.svelte
      provides: "TITLE_KEYS mapping *Pros to questions.arguments.pro and *Cons to questions.arguments.con; isCon helper; symmetric pros-before-cons sortArguments; accurate component doc block"
      contains: "[ARGUMENT_TYPE.LikertPros]: 'questions.arguments.pro'"
    - path: apps/frontend/src/lib/components/questions/QuestionArguments.svelte.test.ts
      provides: "Mount tests pinning label key per argument type, pros-before-cons order, same-side stability and the categorical option label"
    - path: apps/frontend/messages/fi/questions.json
      provides: "fi runtime catalogue with pro = Puolesta, con = Vastaan"
    - path: apps/frontend/src/lib/i18n/translations/fi/questions.json
      provides: "fi type-gen catalogue with the same pro/con values as the runtime catalogue"
    - path: apps/frontend/src/lib/i18n/tests/translations.test.ts
      provides: "Per-locale argument-label invariant and runtime vs type-gen value parity for questions.arguments"
    - path: apps/frontend/src/lib/utils/questions/extendedInfo.ts
      provides: "hasExtendedInfo(question): true when the question has info text, infoSections or arguments"
      contains: "export function hasExtendedInfo"
    - path: apps/frontend/src/lib/utils/questions/extendedInfo.test.ts
      provides: "Truth table for hasExtendedInfo including the arguments-only and empty-array cases"
    - path: apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte
      provides: "Arguments expander rendered whenever args has entries, independent of infoSections"
    - path: apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte.test.ts
      provides: "Mount tests for arguments-only, empty-arguments, sections-only and sections-plus-arguments questions"
  key_links:
    - from: apps/frontend/src/lib/components/questions/QuestionArguments.svelte
      to: apps/frontend/messages/fi/questions.json
      via: "TITLE_KEYS keys resolved by t() through the Paraglide runtime catalogue"
      pattern: "questions\\.arguments\\.(pro|con)"
    - from: "apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte"
      to: apps/frontend/src/lib/utils/questions/extendedInfo.ts
      via: "interactiveInfo gate in front of QuestionExtendedInfoButton"
      pattern: "hasExtendedInfo\\("
    - from: apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte
      to: apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte
      via: "drawerHost.open({ component: QuestionExtendedInfo, props: () => ({ question: shownQuestion, ... }) }) — existing path, not modified"
      pattern: "component: QuestionExtendedInfo"
    - from: apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte
      to: apps/frontend/src/lib/components/questions/QuestionArguments.svelte
      via: "arguments Expander (data-testid voter-questions-arguments) wrapping QuestionArguments"
      pattern: "<QuestionArguments \\{question\\} />"
---

<objective>
Forward-port the intent of origin/main commit 66d3ee33d ("fix: correct pro/con labelling and rendering of question arguments") onto this branch, which predates it, after revalidating each finding at HEAD. The upstream diff cannot be cherry-picked: the frontend moved from `frontend/` to `apps/frontend/`, the components are Svelte 5 runes, translations are Paraglide catalogues under `apps/frontend/messages/`, the voter question route gate lives in `questions/+layout.svelte` rather than `[questionId]/+page.svelte`, and the extended info is opened through the drawer host by `QuestionExtendedInfoButton` (upstream's `QuestionExtendedInfoDrawer` change has no counterpart here because that component no longer exists).

Purpose: voters in every locale except fi currently see pro arguments labelled "Against" and con arguments labelled "For", and fi is correct only because its catalogue values are swapped too. Questions that carry arguments but no info text or infoSections never show their arguments at all, because both the route gate and the component nest the arguments behind infoSections.

Output: corrected QuestionArguments mapping and sort, fi catalogue values swapped in both catalogues, an arguments-only-capable QuestionExtendedInfo and route gate, unit tests pinning all of it, and the stale E2E seed/spec comments that describe the old gating rewritten.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@apps/frontend/messages/README.md
@apps/frontend/src/lib/components/questions/QuestionArguments.svelte
@apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte
@apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte
@apps/frontend/src/lib/components/questions/QuestionChoices.svelte.test.ts
@apps/frontend/src/lib/i18n/tests/translations.test.ts

Upstream reference (read, do not cherry-pick): `git show 66d3ee33d`.

Planner's revalidation at planning time (HEAD 79b4faed9 on fix/888-review-findings), to be re-confirmed by Task 1:
- `git merge-base --is-ancestor 66d3ee33d HEAD` exits 1 — the fix is not in this branch.
- QuestionArguments.svelte `TITLE_KEYS` maps BooleanCons and LikertCons to `questions.arguments.pro` and BooleanPros and LikertPros to `questions.arguments.con`; the `sortArguments` doc says "cons before pros" while the comparator moves cons last, and the comparator is asymmetric (two cons both return 1). A throwaway jsdom mount confirmed a LikertPros group rendered with the heading key `questions.arguments.con`.
- QuestionExtendedInfo.svelte renders the arguments Expander only inside the infoSections-length block and guards it on the bare truthiness of `args`; the same throwaway mount of an arguments-only question rendered no arguments expander.
- `questions/+layout.svelte` gates QuestionExtendedInfoButton on `appSettings.questions.interactiveInfo?.enabled && (info || customData.infoSections?.length)` with no arguments term. This is the only interactiveInfo gate in `apps/frontend/src`.
- `t()` (src/lib/i18n/wrapper.ts) resolves runtime overrides, then Paraglide messages compiled from `apps/frontend/messages/`. fi has `con: "Puolesta"`, `pro: "Vastaan"` (swapped) in BOTH `apps/frontend/messages/fi/questions.json` and the type-gen catalogue `apps/frontend/src/lib/i18n/translations/fi/questions.json`. en/sv/da/et/fr/lb are internally consistent (con = against, pro = for). No other file in the repo references these keys or overrides them.
- The only E2E consumer, `tests/tests/fixtures/voter/questionInfo.fixture.ts` `expectArguments`, targets group testids keyed by argument type or choiceId (`likertPros`, `booleanPros`, `a`) and asserts visibility only — no label text and no order — so no E2E assertion changes. Two comments do describe the old gating: the qu-likert carrier note in `packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts` and the argument walk-through parenthetical in `tests/tests/specs/perm/perm-interactive-info.spec.ts`.

Conventions the executor must keep:
- Comment Hygiene (CLAUDE.md): comments describe the code as it is now; no history, no `.planning/` paths, no decision ids. Comments are single-line paragraphs: a comment line without terminal punctuation must not be continued on the next line at the same indent (`yarn assert:comment-hygiene` rule 2).
- Component tests follow `QuestionChoices.svelte.test.ts`: `vi.mock('$lib/contexts/component', ...)` returning a `t` stub, dynamic `await import` of the component, `mount` + `flushSync` from `svelte`, plain object question fixtures cast to the prop type (the `@openvaa/data` guards and `getCustomData` are structural), and an `afterEach` teardown.
- Grounded test command: `yarn workspace @openvaa/frontend test:unit <paths>` (verified at planning time).
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Revalidate all findings at HEAD, then fix the pro/con labels end-to-end (catalogue to rendered heading)</name>
  <files>apps/frontend/src/lib/components/questions/QuestionArguments.svelte, apps/frontend/src/lib/components/questions/QuestionArguments.svelte.test.ts, apps/frontend/messages/fi/questions.json, apps/frontend/src/lib/i18n/translations/fi/questions.json, apps/frontend/src/lib/i18n/tests/translations.test.ts</files>
  <behavior>
    - QuestionArguments with arguments listed [LikertCons, LikertPros]: the first rendered group is `voter-questions-argument-group-likertPros` with heading key `questions.arguments.pro`, the second is `...-likertCons` with heading key `questions.arguments.con`.
    - Same for [BooleanCons, BooleanPros] on a boolean question: booleanPros first under `questions.arguments.pro`, booleanCons second under `questions.arguments.con`.
    - Three groups [LikertCons(C1), LikertPros(P), LikertCons(C2)]: rendered order P, C1, C2 (pros first, same-side authored order kept).
    - Two CategoricalPros groups for choices a and b on a single-choice categorical question: order a, b kept; heading key `questions.arguments.proCategory` with `option` set to the choice label (stub `t` so the option parameter is observable, e.g. appending it to the key).
    - Catalogue invariant, per locale in `apps/frontend/messages/`: `questions.arguments.pro` differs from `.con`; `.proCategory` with the `{option}` placeholder removed contains the pro label and does not contain the con label (case-insensitive). fi fails this at HEAD ("Puolesta: {option}" does not contain "Vastaan").
    - Catalogue parity, per locale: the `arguments` object in `src/lib/i18n/translations/{locale}/questions.json` (unwrapped file) deep-equals `questions.arguments` in `messages/{locale}/questions.json` (wrapped file).
  </behavior>
  <action>
Step 1 — revalidate (read-only, no edits yet). Run `git merge-base --is-ancestor 66d3ee33d HEAD` and record its exit status (1 = fix absent). Then, by reading the content anchors named in the context section, re-confirm each of the four findings individually: (F1) the TITLE_KEYS object in QuestionArguments.svelte maps the *Cons types to the pro key and the *Pros types to the con key, and the sortArguments comparator/doc mismatch; (F2) in QuestionExtendedInfo.svelte the arguments Expander sits inside the infoSections-length block and is guarded on bare `args` truthiness; (F3) the interactiveInfo condition in `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` has no arguments term; (F4) print the `questions.arguments` values of every locale in both catalogues with a short python3 json read (as in apps/frontend/messages/README.md) and confirm only fi is swapped. Also re-run the E2E consumer check: search `tests/` for the argument group testid and label keys and confirm no spec asserts argument label text or group order. Record a per-finding verdict (holds / already fixed) in the SUMMARY. If none of F1-F4 holds, stop here: the item's outcome is "dropped — <reason>", make no code change and skip Tasks 2 and 3. If only some hold, carry out only the steps below and in Tasks 2-3 that belong to a finding that holds, and record which were skipped and why.

Step 2 — RED. Create `QuestionArguments.svelte.test.ts` next to the component covering the four QuestionArguments behaviours above, following the QuestionChoices test pattern (mock `$lib/contexts/component` with a `t` stub that returns the key and appends `params.option` when present; question fixtures are plain objects with `objectType` from `OBJECT_TYPE` — SingleChoiceOrdinalQuestion for Likert, BooleanQuestion for boolean, SingleChoiceCategoricalQuestion with `choices` and a `getChoice(id)` function for categorical — plus `customData.arguments`; read the group order from the `data-testid` attributes of the rendered group divs and the heading text from each group's `h5`). In `translations.test.ts` add a `describe.each(translationLocales)` block for the argument labels holding the invariant test and the parity test from the behaviour list, reusing the file's existing `messagesDir`, `translationsDir` and `translationLocales` constants and its JSON-reading style. Run the verify command and confirm the new QuestionArguments label/order cases and the fi invariant case fail at HEAD; note the failures in the SUMMARY as the executable revalidation of F1 and F4.

Step 3 — GREEN. In QuestionArguments.svelte (F1): make TITLE_KEYS map BooleanPros and LikertPros to `questions.arguments.pro`, BooleanCons and LikertCons to `questions.arguments.con`, and keep CategoricalPros on `questions.arguments.proCategory`. Add a small `isCon(argument)` helper with TSDoc ("whether the argument holds counterarguments": BooleanCons or LikertCons) and rewrite `sortArguments` as a symmetric comparator ordering by `Number(isCon(a)) - Number(isCon(b))` on a copied array, with its TSDoc stating that pros are shown before cons. Replace the stale component doc block at the top of the file (it still documents `info`, `onCollapse`, `onExpand` and a QuestionBasicInfo usage) with the real API: `question` (the question whose arguments to display), any valid `<div>` properties, usage `<QuestionArguments {question}/>`. Leave the rendering markup, the `voter-questions-argument-group-{choiceId ?? argument.type}` testid and its comment unchanged. In BOTH fi catalogues (F4) swap the two values so `pro` is "Puolesta" and `con` is "Vastaan"; leave `proCategory` ("Puolesta: {option}") and `title` untouched and do not touch any other locale — they are already consistent. This matches the upstream intent where fi was the only locale whose values compensated for the inverted mapping.
  </action>
  <verify>
    <automated>yarn workspace @openvaa/frontend test:unit src/lib/components/questions/QuestionArguments.svelte.test.ts src/lib/i18n/tests/translations.test.ts</automated>
  </verify>
  <done>Per-finding revalidation verdicts and the RED run are recorded in the SUMMARY; the new QuestionArguments tests and the argument-label invariant/parity tests pass for all seven locales; fi reads pro = Puolesta, con = Vastaan in both catalogues; no other locale's values changed.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Make an arguments-only question reachable — the interactiveInfo gate counts arguments</name>
  <files>apps/frontend/src/lib/utils/questions/extendedInfo.ts, apps/frontend/src/lib/utils/questions/extendedInfo.test.ts, apps/frontend/src/lib/utils/questions/index.ts, apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte</files>
  <behavior>
    - info text only → true; infoSections with one entry only → true; arguments with one entry only → true (the ported fix).
    - no info, no customData → false; `infoSections: []` and `arguments: []` with empty info → false.
  </behavior>
  <action>
Only if F3 holds. Create `apps/frontend/src/lib/utils/questions/extendedInfo.ts` exporting `hasExtendedInfo(question: AnyQuestionVariant): boolean` with TSDoc (whether the question has content for the extended-info popup: info text, info sections or arguments). It reads `question.info` and `getCustomData(question)` from `@openvaa/app-shared` and returns true when info is non-empty or `infoSections` or `arguments` has at least one entry. Export it from the `apps/frontend/src/lib/utils/questions/index.ts` barrel next to `electionTags`. Write `extendedInfo.test.ts` first covering the behaviour list with plain-object question fixtures cast to `AnyQuestionVariant` (getCustomData is `customData ?? {}`), see it fail on import, then implement.

In `questions/+layout.svelte`, replace the parenthesised info/infoSections disjunction in the `{#if appSettings.questions.interactiveInfo?.enabled && ...}` guard in front of `QuestionExtendedInfoButton` with `hasExtendedInfo(question)`, importing it from `$lib/utils/questions` in the existing import block (keep the import sort order the lint config enforces). Keep the `{:else if info}` QuestionBasicInfo branch and the `{@const { info, text } = question}` / `customData` consts as they are — they are still used elsewhere in the template. Do not touch QuestionExtendedInfoButton.svelte or the drawer host: the button already passes `question` to QuestionExtendedInfo through `drawerHost.open`, so upstream's QuestionExtendedInfoDrawer fix has nothing to port.
  </action>
  <verify>
    <automated>yarn workspace @openvaa/frontend test:unit src/lib/utils/questions/extendedInfo.test.ts</automated>
  </verify>
  <done>`hasExtendedInfo` exists with TSDoc and a passing truth-table test including the arguments-only true case and the empty-arrays false case; the questions layout gates the extended-info button on `interactiveInfo.enabled && hasExtendedInfo(question)`.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Render arguments without infoSections, align the stale E2E comments, run the gates</name>
  <files>apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte, apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte.test.ts, packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts, tests/tests/specs/perm/perm-interactive-info.spec.ts</files>
  <behavior>
    - Arguments only (LikertPros + LikertCons, no info, no infoSections): an element with `data-testid="voter-questions-arguments"` is rendered and no `voter-questions-info-section-*` element; clicking the expander's checkbox and flushing mounts `voter-questions-argument-group-likertPros`.
    - `arguments: []` and no infoSections: no `voter-questions-arguments` element and no `questions.arguments.title` text.
    - infoSections only (two titled sections): `voter-questions-info-section-0` and `-1` rendered, no `voter-questions-arguments`.
    - infoSections and arguments: both sections and the arguments expander rendered, the expander after the last section in document order.
  </behavior>
  <action>
Only if F2 holds for the component part. RED: create `QuestionExtendedInfo.svelte.test.ts` next to the component with the four behaviours, same harness as Task 1's component test (the `t` stub returning the key is enough; `QuestionArguments` is reached through the component's own import). Run it and confirm the arguments-only case fails at HEAD.

GREEN: in QuestionExtendedInfo.svelte port the upstream structure. Widen the wrapper `{#if}` around the `<div class="prose">` that holds the sections so it renders when `infoSections?.length || args?.length`; iterate `infoSections ?? []` in the `{#each}` so an arguments-only question iterates nothing; and change the arguments Expander's own guard from the truthiness of `args` to `args?.length`, so an empty array renders nothing. Keep the per-section `voter-questions-info-section-{index}` wrapper, the `data-testid="voter-questions-arguments"` on the Expander, the `onSectionCollapse` / `onSectionExpand` wiring, `sanitizeHtml` on section content and both existing testid comments exactly as they are (they remain accurate).

Comment alignment (no data change): in the perm-interactive-info seed template, rewrite the qu-likert carrier comment — it states that the popup button requires info or infoSections and that QuestionArguments renders only inside the infoSections block, both false after this change — to describe the dataset as it now is: the argument carriers co-seed one infoSection so the popup renders an info section and the arguments expander together. The boolean and categorical carrier notes that point at the qu-likert note stay. Keep the seeded infoSections and arguments data byte-identical, so the E2E dataset and its assertions do not change. In perm-interactive-info.spec.ts rewrite the argument walk-through comment in the popup-mode test so it no longer says QuestionArguments is gated inside the infoSection; describe the steps (advance, open the popup, assert the argument group, dismiss). Do not edit any other comment in that spec. Both comments are single-line paragraphs ending in terminal punctuation, present tense, no history.

Then run the full gate chain in the verify block. If `lint` or `prettier --check` reports issues in touched files, fix them (`yarn prettier --write` on the touched files only) and re-run; never read a gate's exit status through a pipe.
  </action>
  <verify>
    <automated>yarn workspace @openvaa/frontend test:unit src/lib/components/questions src/lib/utils/questions src/lib/i18n/tests && yarn workspace @openvaa/frontend typecheck && yarn workspace @openvaa/frontend lint && yarn workspace @openvaa/dev-seed lint && yarn eslint --flag v10_config_lookup_from_file tests/tests/specs/perm/perm-interactive-info.spec.ts && yarn typecheck:tests && yarn assert:comment-hygiene && yarn assert:i18n-catalog-namespaces && yarn prettier --check apps/frontend/src/lib/components/questions apps/frontend/src/lib/utils/questions "apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte" apps/frontend/messages/fi/questions.json apps/frontend/src/lib/i18n/translations/fi/questions.json apps/frontend/src/lib/i18n/tests/translations.test.ts packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts tests/tests/specs/perm/perm-interactive-info.spec.ts</automated>
  </verify>
  <done>QuestionExtendedInfo renders the arguments expander for arguments-only questions and nothing for an empty arguments array, with all four component tests green; the seed data is unchanged and neither the seed nor the spec comment claims the old gating; the whole verify chain exits 0.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| question customData → voter browser | Argument and info-section HTML is authored by project admins (or produced by the argument-condensation LLM pipeline) and rendered into the voter page with `{@html}` |
| translation catalogue → voter UI | The pro/con labels voters rely on to read an argument's direction come from the Paraglide catalogues and optional backend overrides |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-gjx-01 | Tampering | QuestionArguments / QuestionExtendedInfo `{@html}` of argument and section content | medium | mitigate | Every argument line and section body keeps passing through `sanitizeHtml`; Task 3 moves the arguments block without altering the `sanitizeHtml` calls, and the arguments-only path newly reachable via Task 2 renders through the same QuestionArguments markup |
| T-gjx-02 | Tampering (integrity of voter-facing information) | TITLE_KEYS mapping and locale catalogues | medium | mitigate | Mislabelled pro/con text misleads voters about an argument's direction; Task 1 pins the key per argument type with component tests and adds a per-locale catalogue invariant (proCategory carries the pro label, not the con label) plus runtime vs type-gen parity, so a re-inversion in code or in any locale fails CI |
| T-gjx-03 | Denial of Service | QuestionExtendedInfo render for arguments-only questions | low | accept | The change only widens an `{#if}`; an empty or absent arguments array is covered by Task 3's empty-array test and renders nothing |
| T-gjx-SC | Tampering | npm/pip/cargo installs | low | accept | No dependency is added or installed by this plan; the package-legitimacy gate does not apply |
</threat_model>

<verification>
- Task 1 SUMMARY records the ancestry check, the per-finding verdicts and the RED run before any fix.
- `yarn workspace @openvaa/frontend test:unit src/lib/components/questions src/lib/utils/questions src/lib/i18n/tests` passes, including the new QuestionArguments, QuestionExtendedInfo, extendedInfo and argument-label tests.
- Frontend typecheck and lint, dev-seed lint, tests eslint and typecheck, comment-hygiene, i18n-namespace and prettier gates exit 0.
- `git diff` shows no change to seeded data in perm-interactive-info.ts (comment lines only) and no change to any E2E assertion.
- E2E is not re-run by this item: the perm-interactive-info assertions target type-keyed group testids and visibility, both unchanged; the next full-suite run is the confirmation.
</verification>

<success_criteria>
- Pro arguments are labelled "for" and con arguments "against" in all seven locales, pros listed first.
- A question with only arguments shows the extended-info button (interactiveInfo enabled) and its popup shows the arguments.
- fi runtime and type-gen catalogues agree and are internally consistent; all locales pass the new invariant.
- Upstream's QuestionExtendedInfoDrawer change is correctly identified as having no counterpart (drawer host path already passes `question`).
- Or, if revalidation shows every finding already fixed: outcome "dropped — <reason>" with no code change.
</success_criteria>

<output>
Create `.planning/quick/260930-gjx-revalidate-then-forward-port-origin-main-commit-66d3ee33d-pr/260930-gjx-SUMMARY.md` when done
</output>
