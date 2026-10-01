---
phase: quick-260930-gjv
plan: 01
type: execute
wave: 2
depends_on: ["260930-gjx", "260930-gk0"]
quick_id: 260930-gjv
files_modified:
  - apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte
  - apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
  - apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts
  - apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte
  - apps/frontend/src/lib/dynamic-components/entityDetails/openEntityDrawer.svelte.ts
  - apps/frontend/src/lib/routes/route.ts
  - apps/frontend/src/lib/utils/viewTransition.ts
  - apps/frontend/src/lib/utils/viewTransition.test.ts
  - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/drawerHost/DrawerHost/+page.md
  - apps/frontend/src/lib/_guards/spike-scaffolding.test.ts
  - apps/frontend/src/routes/(voters)/(located)/+layout.ts
  - apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts
  - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte
  - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte
  - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte
  - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/page.guards.test.ts
  - tests/playwright.config.ts
  - tests/tests/fixtures/voter/views.ts
  - tests/tests/specs/perm/perm-interactive-info.spec.ts
  - tests/tests/specs/voter/voter-results-redraw.spec.ts
  - tests/tests/utils/testIds.ts
autonomous: true
requirements: [QUICK-260930-gjv]

must_haves:
  truths:
    - "Every line PR #888 added to a file under apps/, packages/ or tests/ (plus whatever sibling items 260930-gjx and 260930-gk0 wrote into those same files) carries no planning-reference form: `bash .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/scoped-hygiene-gate.sh` exits 0 with HITS=0 (it reported HITS=123 across 15 files at planning time)"
    - "No comment in that population narrates history — what the code used to do, what replaced what, which run or tally measured a defect, which phase or decision chose the design; each rewritten comment describes the code as it is now, and any reference that survives is exactly `see phase 165.1` or `see spike 031`..`see spike 034` (the results-redraw phase is 165.1 on this branch; phase 165 is a different phase)"
    - "The change is comment-only: `comment-only-check.mjs --changed` reports SAME for every code file changed since the item base — strictly for production files, with only string-literal text (test titles, assertion messages) allowed to differ in `*.test.ts` / `*.spec.ts` files — and no file is added, deleted or renamed"
    - "Nothing else regresses: the frontend unit suite, frontend lint and svelte-check, the tests/ typecheck and ESLint, and `yarn assert:comment-hygiene` all pass, and `playwright test --list` prints the same Total line as at the item start"
    - "The repo-wide `.claude/skills/ship-review-stack/sources/hygiene-grep-report.sh` was run: no row grew against the item-start baseline, and the `--assert-clean` verdict is recorded in the SUMMARY with its cause (a red verdict is acceptable only when every remaining hit lies outside the lines this item owns, which the scoped gate proves)"
    - "The security rationale the rewritten comments carry survives the rewrite: the open-redirect allowlist for `next=`, the cross-request payload-leak guard in the drawer host state, and the results leaf guards' role as input validation over the `etPl` / `etSg` matchers are all still explained in words"
  artifacts:
    - path: apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte
      provides: "Reconcile / pending-collapse / correction comments stated in the present tense, without release, phase, decision, run-tally or planning-path references"
    - path: apps/frontend/src/lib/routes/route.ts
      provides: "The statistics-route comment says where the route sits and why, with no phase / decision id, planning-document anchor or undetected-bug story"
    - path: apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
      provides: "`@component` block describing the close sequence without comparing it to a removed component"
    - path: apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/drawerHost/DrawerHost/+page.md
      provides: "Generated component page kept identical to the DrawerHost `@component` block"
    - path: apps/frontend/src/lib/_guards/spike-scaffolding.test.ts
      provides: "Guard whose doc, describe titles and failure messages state what is asserted and why, without phase / criterion / requirement / decision ids"
    - path: apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/page.guards.test.ts
      provides: "Guard spec whose header and titles explain why both leaf guards exist, without decision / threat / plan ids or planning-document anchors"
    - path: tests/tests/specs/voter/voter-results-redraw.spec.ts
      provides: "E2E spec whose doc, titles, comments and failure messages carry no requirement / decision ids, research anchors or run provenance"
    - path: .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/scoped-hygiene-gate.sh
      provides: "Deterministic population-scoped gate (planning tool, already written and tested at planning time)"
    - path: .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/comment-only-check.mjs
      provides: "Compiler-normalised before/after equivalence check proving the edits are comment-only (planning tool, already written and tested at planning time)"
  key_links:
    - from: .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/scoped-hygiene-gate.sh
      to: "PR #888 file population"
      via: "git diff --name-only --diff-filter=d 39e471a8...79b4faed9 selects the files; git diff -U0 against the merge base selects the added lines inside them"
      pattern: "PR888_HEAD=\"79b4faed97b40e845094f7d4b9e7f988aa0cfd48\""
    - from: apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
      to: apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/drawerHost/DrawerHost/+page.md
      via: "the generated page body between `# DrawerHost` and `## Source` is the `@component` block verbatim; diff -B of the two extracts must be empty"
      pattern: "## Source"
    - from: apps/frontend/src/lib/_guards/spike-scaffolding.test.ts
      to: "every comment written under apps/frontend/src"
      via: "the guard fails on any upper-case, word-bounded marker word in any file under apps/frontend/src other than itself, so no rewritten comment may use that word in upper case"
      pattern: "SCAFFOLDING_MARKER"
---

<objective>
Revalidate, then fix, the CLAUDE.md "Comment Hygiene" violations in the code comments PR #888 (the results-redraw work, phase 165.1 on this branch) added under `apps/` and `tests/`: historical narrative, planning-document paths and anchors, decision / threat / requirement / plan ids, roadmap-criterion references, milestone tags and bare phase / spike references. Each violating comment is rewritten to describe the code as it is now; a reference survives only in the bare `see phase 165.1` / `see spike 03N` form. The change is comment-only (per the item's own constraint) — no behaviour change, no code, no new or deleted files.

Purpose: the comments PR #888 shipped explain the code through the story of the phase that wrote them, which is what CLAUDE.md § Comment Hygiene forbids and what `hygiene-grep-report.sh` flags. A reader arriving cold needs the mechanism, not the provenance.

Output: rewritten comments (and, in test files only, test titles and assertion messages that carried the same references) in the files listed in `files_modified`, the DrawerHost generated docs page kept in sync, and a SUMMARY recording the revalidation evidence, the per-file changes, the files reviewed and left unchanged, and the repo-wide hygiene report before/after.

Revalidated at planning time (HEAD 79b4faed9): the finding holds. The scoped gate reports HITS=123 in 15 files (lib 15 hits outside `_guards`, `_guards` + routes 57, tests 51). The item's two quoted examples are verbatim in `AccordionSelect.svelte`'s reconcile comment. Narrative without a gate hit also exists (DrawerHost's `@component` close bullet, `layout.tracking.test.ts`'s past-tense doc). `QuestionExtendedInfoButton.svelte`, `openEntityDrawer.svelte.ts` and `(voters)/(located)/+layout.ts` are named in the item but read clean at planning time: they already use the allowed `see spike 03N` form and the present tense. They stay in `files_modified` only so a violation a sibling item adds there can be cleaned up.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md

Item-local planning tools (written and tested at planning time; NOT shipped code, never committed by the executor — the orchestrator commits this directory):

- `.planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/scoped-hygiene-gate.sh` — `bash <it> [<pathspec>...]` (default `apps/ packages/ tests/`). The population is derived at run time: the files PR #888 added or modified (pinned fork point 39e471a8, pinned PR head 79b4faed9), restricted to lines added relative to the merge base, in the working tree. It prints `path:line: match` per hit, then `HITS=n`, and exits 1 when HITS>0. Its patterns are the hygiene-grep-report.sh gate rows, plus the forms #888 used that those rows miss: threat ids, `NNN-UPPER-CASE.md` planning documents, `Post-NN-NN` plan ids, `criterion N`, hyphenated `phase-NNN` / `spike-NNN`, and `e2e-runs/` paths.
- `.planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/comment-only-check.mjs` — `node <it> --rev=<rev> --changed <pathspec>...`, run from the repo root. It normalises both sides and compares them: `.svelte` files through `svelte/compiler` client and server output, then everything through the TypeScript printer with `removeComments`. It is strict for production files. For `*.test.ts` / `*.spec.ts` it blanks string literals first, so reworded titles and messages are allowed. Output is SAME / DIFF / SKIP (not code) / FAIL (added|deleted), and it exits 1 on any DIFF or FAIL. It does NOT see directive comments. Leave every `svelte-ignore`, `eslint-disable*`, `@ts-expect-error`, `bind: keep`, `svelte-warning: accepted` and `// reason:` prefix untouched (edit only the prose after `reason:`). Lint, svelte-check and typecheck are what catch those.

Rules the rewritten comments must satisfy (from ./CLAUDE.md § Comment Hygiene and `scripts/assert-comment-hygiene.mjs`):

- Describe the code as it is now, to someone reading it cold. No "used to / was replaced / before the split / until release X / measured on this branch / an early run / N red of M runs / the discussion document's starred option". Keep the mechanism and the consequence ("a tracked read makes the load rerun on every tab switch"). Drop the provenance ("a tracked read made it rerun, measured in run X").
- Planning references: only the bare `see phase 165.1` or `see spike 031` / `032` / `033` / `034`, and only where the pointer carries weight. Never a `.planning/` path, a `§` anchor, a planning-document filename, a decision / threat / requirement / plan id, a roadmap "criterion N" or a milestone tag. PR #888 wrote "phase 165", but the results-redraw phase is 165.1 on this branch (phase 165 is the review-stack remediation), so a surviving phase pointer must say 165.1.
- File-internal self-references ("invariant 3" pointing at the same file's numbered list, "C4" in routeConsistency) are not planning references. Keep them, and keep the numbering stable when a comment elsewhere in the file cites it.
- Nothing addressed to the reviewer.
- Concise. Rewrite only comments that violate a rule; do not restyle compliant comments.
- One paragraph per comment line, as the files already do: `yarn assert:comment-hygiene` rule 2 fails a comment line that ends without terminal punctuation when the next line continues the same span. Never hard-wrap prose mid-sentence, and never write a `\uXXXX` escape in a comment (rule 1).
- Under `apps/frontend/src`, never write the spike's marker word in upper case in any file other than `lib/_guards/spike-scaffolding.test.ts`. That guard fails on it. Write "spike" in lower case.
- Every claim a rewritten comment makes must be true of the current code. Read the code a comment describes before rewording it. Do not carry forward a claim from the old text without checking it.
</context>

<tasks>

<task type="tracer">
  <name>Task 1: Revalidate at HEAD, record baselines, then clean the $lib production slice end-to-end (gate -> rewrite -> comment-only proof -> docs sync -> lint/type/unit)</name>
  <files>apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte, apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte, apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts, apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte, apps/frontend/src/lib/dynamic-components/entityDetails/openEntityDrawer.svelte.ts, apps/frontend/src/lib/routes/route.ts, apps/frontend/src/lib/utils/viewTransition.ts, apps/frontend/src/lib/utils/viewTransition.test.ts, apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/drawerHost/DrawerHost/+page.md</files>
  <precondition>The two planning tools exist at .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/ in the working tree (if not, copy them from the same path under /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd), node_modules is installed at the repo root, and the sibling items 260930-gjx and 260930-gk0 are already committed on this branch.</precondition>
  <read_first>
    - ./CLAUDE.md § Comment Hygiene
    - .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/scoped-hygiene-gate.sh (header)
    - .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/comment-only-check.mjs (header)
    - every file in this task's files list, in full
  </read_first>
  <action>
REVALIDATE FIRST, from the repo root. Let Q stand for the item directory `.planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in`.
(1) Write `git rev-parse HEAD` into `Q/item-base.rev`. Every later comment-only check compares against it.
(2) Run `bash Q/scoped-hygiene-gate.sh` and keep its full output for the SUMMARY, together with a per-file hit count (`cut -d: -f1 | sort | uniq -c` over the hit lines).
(3) Save the repo-wide baseline: `bash .claude/skills/ship-review-stack/sources/hygiene-grep-report.sh --save-baseline Q/hygiene-baseline.tsv`.
(4) Save the E2E test inventory: `npx --no-install playwright test -c tests/playwright.config.ts --list | tail -1 > Q/playwright-list.before`.
(5) Read the comment and `@component` text PR #888 added to every file in this task's list. Get it from `git diff -U0 39e471a809501b443d0bd990ee492bc42115665c -- <file>`, and read the whole file for context. Read the same text in the Task 2 / Task 3 files too, for historical narrative, which the gate cannot see.
If the gate reports HITS=0 AND the reading finds no narrative anywhere in the population, the item's outcome is "dropped — the violations no longer exist at HEAD". In that case record the gate output and the reading notes in the SUMMARY, make no code change, and skip Tasks 2 and 3. Otherwise continue.

THEN FIX THE $lib SLICE. This is comment text only.
- AccordionSelect.svelte: three script comments.
  (a) The comment on `activate`'s pending `DELAY.lg` collapse handle. Keep the mechanism: an orphaned timer would slam a re-expanded accordion shut and detach the option the user is reaching for, so every write goes through `setExpanded`, which cancels first. Delete the sentence saying where and how the race was measured; it names an E2E run-artifact directory.
  (b) The "correction rather than something the user asked for" comment. Delete the clause about what the remount used to deliver, and keep the present-tense requirement.
  (c) The comment above the reconcile effect, first paragraph: rewrite it as the present-tense reason the reconcile exists. The initialiser derives the same predicate but runs once, at construction. The results subtree persists across navigation, so an instance that mounts while the parent's lookup is unresolved (`activeIndex === -1`, e.g. the multi-election results landing with no election in the URL) stays mounted. Only the later transition to a real selection can collapse it. Without this, the widget stays expanded while a selection is active until `activate`'s timer fires, and a click just after that window re-opens it permanently. Remove the release/phase narrative, the decision id, the red-run tally and the planning-path citation. Add `see phase 165.1` only if a pointer adds something. Keep the "Two properties are deliberate" paragraph and the "Switching from one option to another" paragraph as they are, except the word "back" in "fold this back into the initialiser".
- DrawerHost.svelte: in the `@component` block, the **close** bullet compares the host with a per-route drawer component that no longer does this job. Replace that comparison with what the host does (the panel slides down and the backdrop fades out, then `dialog.close()`). Then check every other comment in the file, including anything sibling item 260930-gk0 added. Mirror the `@component` change byte-for-byte into the generated DrawerHost `+page.md`: its body between `# DrawerHost` and `## Source` is the block verbatim. Do not run `yarn workspace @openvaa/docs generate:component-docs`; that script points at a file that does not exist.
- drawerHostState.svelte.ts: in the comment on the client-only guard, replace the threat id with the risk in words: a server-side caller leaking one request's payload into another request that shares this module scope.
- route.ts: two comments sit above the statistics route constant. Rewrite them to say where the statistics route sits (beside the election-tab segment, not under it) and why. Under it, the route would inherit the results layout chain, and those layouts render the results hero, ingress and election picker around their children, which would put the results chrome and a second `<h1>` on the statistics page. Keep the note that this constant and the directory move together or the route 404s. Before writing, confirm those claims against the current results layouts. Remove the phase and decision ids, the planning-document anchor and the account of how the old nesting went unnoticed.
- viewTransition.ts: in the module doc's paragraph on dialogs and document View Transitions, keep the concrete symptoms (the header flashes over the backdrop; the results list covers the drawer during a drawer-tab switch) as present-tense consequences, and turn the spike citation into `see spike 031`. viewTransition.test.ts: its one spike citation gets the same treatment.
- QuestionExtendedInfoButton.svelte and openEntityDrawer.svelte.ts: confirm they are still clean (`see spike 034` is the allowed form). Leave them byte-identical unless a sibling item added a violation. List them in the SUMMARY as reviewed and unchanged, with the reason.
Commit only the files in this task's list (not `.planning/`). Use the message style of the repo's comment-cleanup commits, e.g. `style[frontend]: results-redraw comments in $lib describe the code as it is now`.
  </action>
  <verify>
    <automated>bash .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/scoped-hygiene-gate.sh apps/frontend/src/lib/components apps/frontend/src/lib/dynamic-components apps/frontend/src/lib/routes apps/frontend/src/lib/utils && node .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/comment-only-check.mjs --rev=$(cat .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/item-base.rev) --changed apps/frontend/src/lib/components apps/frontend/src/lib/dynamic-components apps/frontend/src/lib/routes apps/frontend/src/lib/utils && diff -B <(awk '/^<!--@component/{f=1;next} /^-->/{if(f)exit} f' apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte) <(awk '/^# DrawerHost$/{f=1;next} /^## Source$/{exit} f' 'apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/drawerHost/DrawerHost/+page.md') && yarn assert:comment-hygiene && yarn workspace @openvaa/frontend test:unit && yarn workspace @openvaa/frontend lint && yarn workspace @openvaa/frontend typecheck</automated>
  </verify>
  <acceptance_criteria>
    - `Q/item-base.rev`, `Q/hygiene-baseline.tsv` and `Q/playwright-list.before` exist, and the SUMMARY records the start-of-item gate output (HITS and the per-file table).
    - The scoped gate over the four $lib directories prints HITS=0 and exits 0.
    - comment-only-check reports SAME for every changed file under those directories, with no FAIL line.
    - The DrawerHost `@component` block and its generated page body are identical under `diff -B`.
    - `yarn assert:comment-hygiene` reports 0 violations. The frontend unit suite, lint (errors: 0) and svelte-check (0 errors) pass.
  </acceptance_criteria>
  <done>The finding is revalidated and recorded with baselines. The $lib slice carries no planning references or historical narrative, and each of its comments states the current mechanism. The edit is proven comment-only, the generated DrawerHost page matches the component, and the frontend checks are green and committed.</done>
</task>

<task type="auto">
  <name>Task 2: Clean the results route files and the spike-scaffolding guard (routes/ + lib/_guards)</name>
  <files>apps/frontend/src/lib/_guards/spike-scaffolding.test.ts, apps/frontend/src/routes/(voters)/(located)/+layout.ts, apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts, apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte, apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte, apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte, apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/page.guards.test.ts</files>
  <read_first>
    - every file in this task's files list, in full (the three results route files together, since their docs describe each other)
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.ts (the two guards page.guards.test.ts documents)
    - apps/frontend/src/lib/routes/resultsRoutes.ts (the URL shapes the application emits)
  </read_first>
  <action>
Comment text in every file; in the two test files, also describe/test titles and assertion-message strings that carry planning references. No file keys on these titles: at planning time nothing outside `.planning/` referenced them and no Playwright or vitest filter selects by them. Keep every title unique and descriptive, and never remove a `@tag`.
- results/[[electionTab]]/+layout.svelte `@component`:
  - Drop the parenthetical phase/decision ids after "outermost of the three results route levels".
  - In the `{@render children()}` bullet, drop the clause about where the tabs-and-list markup used to sit and keep why the children render inside the `fullWidth` snippet.
  - Rename the decision-labelled "picker instead of children" bullet to name the rule itself.
- [[entityTab=etPl]]/+layout.svelte:
  - `@component`: same parenthetical removal.
  - Rewrite the sentence about force-filling the plural segment. It cites an old plan id. Instead, state the invariant: an implied tab is never written into the URL, because a redirect that force-fills the plural loops against the leaf guards. Confirm this against the leaf `+page.ts` and `buildRoute` before writing it.
  - Rewrite the sentence saying a spike measured the alternative into the present-tense reason there is no `+page.svelte` at this level, ending `see spike 033`.
  - Rewrite the decision-labelled `##` heading and the template comment that repeats its label into the rule itself.
  - Rewrite the `drawerVisible` comment's account of where the drawer was rendered before the route split into what the carve-out guarantees now: an entity URL whose type cannot be resolved still mounts the drawer.
- [[id]]/+page.svelte `@component`:
  - Drop the phase/decision parenthetical.
  - State the no-canonicalisation rule plainly, without the decision id: the cross-type shape stays routable, and nothing redirects or canonicalises it.
  - Delete the planning-document derivation citation.
  - Turn the capitalised spike citation into the `see spike 033` form.
- page.guards.test.ts:
  - Header: replace the decision-history opening (a decision keeping the guards, what a discussion document's starred option proposed) with the present-tense reasons both guards exist. They are the second layer of input validation over the `etPl` / `etSg` matchers (say it in words, not as a threat id), and a redirect that force-filled the plural would be a navigation loop (describe the loop, not the old plan id). Keep the file's numbered invariants and their numbers, because the test comments cite "Invariant N".
  - The top `describe` title: drop the decision and threat ids and name what is tested (e.g. the entity-type and id guards of the results leaf).
  - The comments and the one `it` title that cite decision ids for optional params and for no canonicalisation: state the rule itself.
  - Delete the negative-control derivation citation.
- (voters)/(located)/+layout.ts: confirm it is clean (`see spike 031` is allowed, and the open-redirect rationale must stay). Leave it byte-identical unless a sibling item added a violation.
- layout.tracking.test.ts: in the module doc, recast the past-tense account ("a single tracked read made it rerun…") as the present-tense consequence ("a single tracked read makes it rerun on every results tab / drawer navigation: …"). The `see spike 031` pointer stays.
- lib/_guards/spike-scaffolding.test.ts: the heaviest rewrite.
  - Module doc: state in the present tense what the guard asserts under `apps/frontend/src`: no import of the lab module path, no upper-case marker comments, and no parallel layered results route directory. State why a standing guard is needed: a spike branch merged with its lab intact would reintroduce them. Remove the phase, roadmap-criterion, requirement and decision ids, the "on this branch the scaffolding never existed" narrative, and the history in invariant 5 (keep the rule that every check binds to names, not line numbers). In the "does not do" section, say it scans nothing outside `apps/frontend/src` rather than naming the planning directory.
  - Invariant 3 and the `NON_VACUITY_FLOOR` doc: keep the re-derivation command and the reasoning for a floor well below the measured count, and drop the date and commit hash.
  - `describe` titles: drop the decision / requirement / criterion ids, and keep the file-internal "invariant N" references.
  - Failure messages: drop the phase narrative and the criterion / decision references, and keep the actionable explanation.
  - This file is self-excluded from its own scan, so it may keep the three forbidden literals. Do not introduce them in any other file.
Commit only this task's files, e.g. `style[frontend]: results route and guard comments describe the code as it is now`.
  </action>
  <verify>
    <automated>bash .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/scoped-hygiene-gate.sh apps/frontend/src/lib/_guards apps/frontend/src/routes && node .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/comment-only-check.mjs --rev=$(cat .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/item-base.rev) --changed apps/frontend/src/lib/_guards apps/frontend/src/routes && yarn assert:comment-hygiene && yarn workspace @openvaa/frontend test:unit && yarn workspace @openvaa/frontend lint && yarn workspace @openvaa/frontend typecheck</automated>
  </verify>
  <acceptance_criteria>
    - The scoped gate over `apps/frontend/src/lib/_guards` and `apps/frontend/src/routes` prints HITS=0 and exits 0.
    - comment-only-check reports SAME for every changed file there: strict for the route `.svelte` / `+layout.ts` files, strings blanked for `spike-scaffolding.test.ts`, `page.guards.test.ts` and `layout.tracking.test.ts`.
    - The frontend unit suite passes, including `spike-scaffolding.test.ts`, which proves no upper-case marker word was written under `apps/frontend/src`, and `page.guards.test.ts` with its row-count non-vacuity checks. Lint and svelte-check are clean. `yarn assert:comment-hygiene` reports 0 violations.
    - The rewritten page.guards header and the `(located)` comments still explain, in words, the guards' input-validation role and the `next=` open-redirect allowlist.
  </acceptance_criteria>
  <done>The results route docs, the leaf guard spec and the scaffolding guard describe the current routing and guards without phase, decision, threat, criterion or plan ids, planning-document anchors or narrative. The edit is proven comment-only (titles and messages only in tests), and the frontend checks are green and committed.</done>
</task>

<task type="auto">
  <name>Task 3: Clean the Playwright suite files, then run the whole-population gate and the repo-wide hygiene report</name>
  <files>tests/playwright.config.ts, tests/tests/fixtures/voter/views.ts, tests/tests/specs/perm/perm-interactive-info.spec.ts, tests/tests/specs/voter/voter-results-redraw.spec.ts, tests/tests/utils/testIds.ts</files>
  <read_first>
    - tests/tests/specs/voter/voter-results-redraw.spec.ts, in full
    - tests/tests/fixtures/voter/viewTransitionLog.fixture.ts (what the view-transition invariants observe; read-only, clean at planning time)
    - the other files in this task's list, in full
  </read_first>
  <action>
Comment text, plus test titles and assertion-message strings in spec files. No `@tag` may be removed.
- voter-results-redraw.spec.ts:
  - Module doc: describe what the spec proves and why a screenshot cannot, in the present tense, without roadmap criteria, requirement ids, decision ids, the research-document anchor or "the defect this phase fixes". Name the layering defect by its mechanism.
  - The four bullet headings: drop their parenthetical id lists.
  - The four `test.describe` titles: drop the parenthetical requirement / decision id lists, keeping each title distinct.
  - Spike citations: keep the mechanism each one explains and use the `see spike 032` / `033` / `034` form.
  - Provenance phrasing ("measured, not assumed", "an early run", "in the spike the payload read…"): turn it into a statement of the fact that holds now.
  - The navigation-loop comments: describe the loop instead of citing the old plan id.
  - The negative-control derivation citation: delete it.
  - The `// reason:` comment: edit only the prose after `reason:`.
  - Assertion messages that name a spike remount or "the hang spike 034 recorded": describe the failure plainly, optionally ending `see spike 03N`.
- playwright.config.ts: in the voter-results-redraw project comment, drop the phase / decision parenthetical. Leave every other project comment alone; the pre-existing violations elsewhere in this file are not in this item's population.
- views.ts: drop the decision id from the capture-seam comment. In the async-registration NOTE, say that this registration is the only one here that awaits its factory, rather than calling it new.
- testIds.ts: drop the decision id from the `listContainer` comment.
- perm-interactive-info.spec.ts: recast the "the path spike 034 found could hang the dialog" clause as the present-tense risk (a throw inside the host's render flush can leave the dialog hung) with `see spike 034`. Then check any comment sibling item 260930-gjx added in this file.
Then run the whole-item checks:
- The scoped gate with no arguments: the full population, including every sibling-item line inside it.
- comment-only-check `--changed apps/ packages/ tests/` against `Q/item-base.rev`. The generated `.md` page shows as SKIP, and no other file may appear that this plan does not list.
- `yarn typecheck:tests` and `npx --no-install eslint --flag v10_config_lookup_from_file tests`.
- The Playwright `--list` Total line, compared with `Q/playwright-list.before`.
- The repo-wide report against `Q/hygiene-baseline.tsv`: no row may grow.
- `hygiene-grep-report.sh --assert-clean` once. Record its exit status and row table in the SUMMARY. At planning time it was red on about 146 files that PR #888 never touched. That red is pre-existing and outside this item; the scoped gate at HITS=0 is the evidence that none of the remaining hits sit on lines this item owns. Name the cause in the SUMMARY; do not widen the scope to chase it.
- `npx --no-install prettier --check` over `git diff --name-only <item-base> -- apps/ tests/`.
Commit only this task's files, e.g. `style[tests]: results-redraw E2E comments and titles describe the behaviour as it is now`.
  </action>
  <verify>
    <automated>bash .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/scoped-hygiene-gate.sh && node .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/comment-only-check.mjs --rev=$(cat .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/item-base.rev) --changed apps/ packages/ tests/ && yarn assert:comment-hygiene && yarn typecheck:tests && npx --no-install eslint --flag v10_config_lookup_from_file tests && diff <(npx --no-install playwright test -c tests/playwright.config.ts --list | tail -1) .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/playwright-list.before && bash .claude/skills/ship-review-stack/sources/hygiene-grep-report.sh .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/hygiene-baseline.tsv | awk '$2 ~ /^[0-9]+$/ && $NF ~ /^-?[0-9]+$/ && $NF+0 > 0 {bad=1; print "ROW GREW: " $0} END {exit bad}' && yarn workspace @openvaa/frontend test:unit</automated>
  </verify>
  <acceptance_criteria>
    - `scoped-hygiene-gate.sh` with no arguments prints HITS=0 and exits 0 over the whole PR #888 population.
    - comment-only-check `--changed apps/ packages/ tests/` against the item base exits 0. Every compared file is SAME, only the generated DrawerHost page is SKIP, and there is no FAIL line.
    - The Playwright `--list` Total line is unchanged from `playwright-list.before`. `yarn typecheck:tests`, the tests/ ESLint run, `yarn assert:comment-hygiene` and the frontend unit suite pass.
    - The repo-wide hygiene report shows no row with a positive delta against `hygiene-baseline.tsv`. The SUMMARY records the `--assert-clean` exit status, the row table before and after, and the reason any residual red is out of scope.
    - Prettier reports every changed file formatted.
  </acceptance_criteria>
  <done>The whole PR #888 population is free of planning references and historical narrative, the item is proven comment-only end to end, the suite inventory and all static checks are unchanged or green, and the SUMMARY carries the revalidation evidence, the per-file changes, the files reviewed and left unchanged, and the before/after hygiene report.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| none new | Comment-only change: no input, no endpoint, no data flow and no dependency is added or altered. The only risk is a comment edit that silently becomes a code edit, or a rewrite that deletes the documented reason for an existing security control. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-gjv-01 | Tampering | every production file in files_modified | medium | mitigate | `comment-only-check.mjs --changed` compares compiler-normalised output (svelte client+server, then TypeScript printer with comments removed) against the item base and fails on any code or production-string difference; frontend unit / lint / svelte-check and tests typecheck back it up; directive comments are declared off-limits because the checker cannot see them |
| T-gjv-02 | Information disclosure | comments documenting the `next=` open-redirect allowlist (`(voters)/(located)/+layout.ts`), the cross-request payload-leak guard (`drawerHostState.svelte.ts`) and the results leaf guards' input-validation role (`page.guards.test.ts`) | medium | mitigate | the rewrite may remove ids only; each of these three rationales must still be stated in words (Task 2 acceptance criterion, must_haves truth 6), so a later reader does not delete a control whose purpose the comment no longer explains |
| T-gjv-03 | Denial of service | `lib/_guards/spike-scaffolding.test.ts` and `routeConsistency.test.ts` scan source text, including comments | low | mitigate | an upper-case marker word written in any other comment under `apps/frontend/src` would redden the guard; the rule is stated in context and the full frontend unit suite runs in every task's verify |
| T-gjv-SC | Tampering | npm/pip/cargo installs | low | accept | no package is installed or added by this item; nothing to gate |
</threat_model>

<verification>
- `bash .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/scoped-hygiene-gate.sh` exits 0 with HITS=0 (123 at planning time).
- `node .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/comment-only-check.mjs --rev=$(cat .planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/item-base.rev) --changed apps/ packages/ tests/` exits 0.
- `yarn assert:comment-hygiene`, `yarn workspace @openvaa/frontend test:unit`, `yarn workspace @openvaa/frontend lint`, `yarn workspace @openvaa/frontend typecheck`, `yarn typecheck:tests`, and ESLint over `tests` all pass.
- The Playwright `--list` Total line is unchanged, and no row of the repo-wide hygiene report grew.
- Reading pass: every comment PR #888 added to the population describes the code as it is now. The SUMMARY lists, per file, what was rewritten and which files were reviewed and left unchanged.
</verification>

<success_criteria>
- The finding was revalidated at HEAD before any edit, and its evidence is in the SUMMARY (or the item is recorded as dropped with the reason, if it no longer held).
- Zero planning-reference forms and zero historical narrative remain in the lines PR #888 (and siblings 260930-gjx / 260930-gk0) added under apps/, packages/ and tests/. Surviving pointers are exactly `see phase 165.1` or `see spike 03N`.
- No behaviour change: compiler-normalised code is identical, production strings are identical, and only test titles and assertion messages differ in test files.
- The repo-wide `hygiene-grep-report.sh` was run in report mode against the baseline (no growth) and in `--assert-clean` mode, and its verdict is recorded with its cause.
</success_criteria>

<output>
Create `.planning/quick/260930-gjv-revalidate-then-fix-claude-md-comment-hygiene-violations-in/260930-gjv-SUMMARY.md` with `status: complete` (or `status: dropped` plus the reason, if Task 1's revalidation found nothing to fix). Include: the start-of-item gate output and per-file table, the per-file list of rewritten comments, the files reviewed and left unchanged with the reason, the comment-only-check output, the Playwright list lines before and after, and the repo-wide report tables (baseline vs final) with the `--assert-clean` exit status. Do not commit `.planning/` files; the orchestrator does.
</output>
