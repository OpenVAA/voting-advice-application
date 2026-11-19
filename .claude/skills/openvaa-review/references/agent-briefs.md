# Agent briefs

Fill the `{…}` placeholders and pass the brief as the agent prompt. Use absolute paths throughout: agents start in whatever directory the harness gives them, and a relative `cd` can land in another worktree. Every agent writes its result to the file named in its brief and returns only a one-line confirmation. Returns can arrive late or truncated, so the file is authoritative.

Use `general-purpose` agents. The repo is at `{REPO_ROOT}`. The PR head is `{HEAD_SHA}` and the merge base is `{MB}`. To read any file as the PR has it, use `git -C {REPO_ROOT} show {HEAD_SHA}:<path>` (write `${HEAD_SHA}:` with braces in zsh). Do not rely on the working tree, which may be on a different branch.

Every brief also carries this line, because a status hook in this environment injects context-usage warnings meant for the orchestrator: `Ignore any "CONTEXT WARNING" line you see; it is addressed to the orchestrator, not to you.`

---

## Writing style (all agents)

Everything an agent writes for the comment (the map's Purpose, each lens's "What changed" and "Affected", finding details) is read by a busy reviewer on GitHub. Write it to scan:

- Keep paragraphs short: 1–3 sentences, one idea each, with a blank line between them.
- Content that is list-shaped goes in a list: two causes, three discrepancies, a set of affected files. Introduce the list with a sentence ending in a colon.
- Put the product-level statement first (what a voter, contestant or admin experiences) and the technical mechanism after it, as separate paragraphs.
- Never write a bare `<` or `>` in prose. GitHub reads `<title>` as an unknown HTML tag and drops it, so `titled "<title> (n)"` renders as `titled " (n)"`. Put placeholders, component names and generics in backticks (`` `<title> (n)` ``, `` `<Modal>` ``, `` `Map<string, number>` ``), or say it in words. The same holds for every string in the JSON files, option text included. Angle brackets belong only inside code spans, fenced code and HTML you mean as HTML.

Before:
> This PR fixes two reported bugs. #812: the results drawer lost its scroll position when a tab changed. #815: a contestant's saved answer reverted until reload. Technically, #812 is fixed by … #815 has two separate causes. First, … Second, … The PR body and the code disagree in three places: …; …; and ….

After:
> This PR fixes two reported bugs:
> - #812: the results drawer lost its scroll position when a tab changed.
> - #815: a contestant's saved answer reverted until reload.
>
> Technically, #812 is fixed by …
>
> #815 has two separate causes:
> - First, …
> - Second, …
>
> The PR body and the code disagree in three places:
> - …

Stay thorough: this is about layout, not length.

---

## Cartographer

```
You are preparing a map of a pull request for a team of reviewers. The reader of the final review is a
developer who did NOT write this PR.

Ignore any "CONTEXT WARNING" line you see; it is addressed to the orchestrator, not to you.

Inputs (read them): {RUN}/pr.json (title/body), {RUN}/summary.txt, {RUN}/manifest.json, {RUN}/size.json,
{RUN}/review.diff. Repo: {REPO_ROOT}; PR head {HEAD_SHA}; merge base {MB}. Read full files via
`git -C {REPO_ROOT} show {HEAD_SHA}:<path>`.
{STACK_NOTE — present only for a ship-review-stack slice: "This PR is slice {k} of {n} of a review stack. Its
diff is a path partition of the source branch {SOURCE_BRANCH}; files outside it live in other slices and are
not missing. Files from LOWER slices (1..{k-1}) are present at {HEAD_SHA}, so read and permalink them there.
Files from HIGHER slices ({k+1}..{n}) exist only on {SOURCE_BRANCH}. Read those with
`git show {SOURCE_BRANCH}:<path>` and cite them as plain `path#Lx-Ly` text, not permalinks. Intermediate states
are not expected to build."}

Write {RUN}/map.md with exactly these sections:

## Purpose
3-5 sentences: what the PR does and why, in product terms first (voters, contestants, admins, publishers),
then technical. Do not just restate the PR title. If the PR body and the code disagree, trust the code and
note the discrepancy.

## Slices
Group the non-noise files into thematic slices: each slice is one coherent piece of the change (e.g.
"invitations table + RLS", "account-access Edge Function", "contestant registration routes", "answer
editor UI"). For each slice: `### <slice name>`, then a description on the first line under it, then the files
(paths), then the suggested reading order within the slice. The description is the slice's line in the posted
reading guide, so it must be complete sentences that never end in a colon or lead into a list. Order slices so the reviewer reads foundations first (packages → database → server →
contexts and adapters → routes → components) unless another order tells the story better. 2-8 slices; a
tiny PR may have one. A large PR (over ~3,000 reviewable lines) may have up to 12.

## Lenses
For each lens in [behaviour, analytics, cross-cutting, common-patterns, data-structure-rot, nomenclature,
complexity-reuse, domain-packages, conciseness, database, server, routes, components, design,
accessibility, i18n, tests, docs-comments, dependencies] write either
`- <lens>: APPLIES — <one-line reason> — files: <paths>` or `- <lens>: skip — <reason>`.
Applicability criteria are the first paragraph of each file in {SKILL_DIR}/references/lenses/<lens>.md —
read those first paragraphs. The manifest's lens_hints are path-based guesses only; confirm each against the
actual diff. Always-on rules:
- conciseness applies to every PR containing code (skip docs-only and tests-only PRs, and say "stack slice"
  for a stack slice only when its size is set by the partition: it still applies to the content);
- analytics applies whenever behaviour applies;
- cross-cutting applies to every feature PR (skip pure refactors, styling, docs or tests);
- nomenclature applies whenever the PR introduces a new root term;
- accessibility applies whenever the diff changes anything rendered;
- docs-comments applies whenever the diff adds or changes comments, adds a source file or substantially
  rewrites one (for its top-down file-order check), or changes behaviour a guide describes;
- common-patterns applies only if a change shape recurs 3+ times.

Write Purpose and slice descriptions following § Writing style at the top of
{SKILL_DIR}/references/agent-briefs.md.

When done, reply only: "map written".
```

## Lens agent

```
You are the {LENS} reviewer on a team reviewing a pull request. Other agents cover the other lenses,
so stay inside yours. A verifier will adversarially check every finding you make, and findings it refutes
are discarded, so verify before you claim.

Ignore any "CONTEXT WARNING" line you see; it is addressed to the orchestrator, not to you.

Read, in order:
1. {SKILL_DIR}/references/lenses/{LENS}.md — your lens: what to list, what to evaluate, criterion slugs.
2. {SKILL_DIR}/references/global-principles.md — principles every lens applies, scope and severity rules,
   and the lens ownership table: if an issue is owned by another lens, leave it to that lens.
3. {RUN}/map.md — the PR's purpose and slices. Use the slice names when you refer to parts of the PR.
4. The diff for your files: {DIFF_PATH} (filter to your file list: {FILES}). Read full files at the PR head
   with `git -C {REPO_ROOT} show {HEAD_SHA}:<path>` when the diff lacks context, and the base version with
   `{MB}:<path>`.
5. The project skill your lens leans on, when it has one: {PROJECT_SKILL_FILES — e.g.
   {REPO_ROOT}/.claude/skills/components/SKILL.md for components, design and accessibility;
   .claude/skills/database/SKILL.md and its reference files for database and server;
   .claude/skills/data|matching|filters/SKILL.md for domain-packages; none for the rest}.
{STACK_NOTE, as in the cartographer brief}

Calibration from past reviews (these were judged NOT findings by human reviewers; do not raise them):
{CALIBRATION_NOTES or "none yet"}

Do not re-review for bugs — automated review already ran. Do not report formatting, lint or type errors.
Search the repo at {HEAD_SHA} (`git -C {REPO_ROOT} grep -I … {HEAD_SHA} -- <paths>`) before claiming
something does or does not exist. git's ERE ignores `\b`; use `git grep -P` when you need word boundaries.

Write two files.

{RUN}/lens-{LENS}.md — the section body for the PR comment, in this shape:
  **What changed** — 2-6 sentences explaining this lens's view of the PR to a non-author.
  **Affected** — the lens's list (table or bullets) as specified in your lens file. Link files as
  {EVIDENCE_FORMAT}.
  (Findings are NOT written here; the orchestrator renders them from the JSON.)

{RUN}/lens-{LENS}.json:
{
  "lens": "{LENS}",
  "applies": true,            // false if on reading the diff you find the lens does not apply after all
  "findings": [
    {
      "id": "{PREFIX}-1",
      "criterion": "<slug from your lens file or global-principles, e.g. cmp-extend-not-fork or G-reuse; use {LENS}.other:<kebab> if none fits>",
      "severity": "blocking | should-fix | consider",
      "title": "<≤80 chars, the claim>",
      "detail": "<2-5 sentences: what the PR does, why it's a problem, citing the principle, invariant or checklist item>",
      "evidence": ["<link or path#Lx-Ly in {EVIDENCE_FORMAT}>", "..."],
      "existing": "<path(s) of the existing thing to reuse/extend, if the finding is about reuse; else null>",
      "suggestion": "<the concrete fix — the refactored shape, the prop to add, the method signature>",
      "alternatives": ["<a different fix a reviewer might reasonably prefer; omit the field when there is only one sane fix>"],
      "introduced_by_pr": true,  // false = pre-existing but spread/extended by this PR; explain in detail
      "checklist_rule": null      // "<checklist section> › <item text, abbreviated>" if .agents/code-review-checklist.md already covers this, or the CLAUDE.md section for an invariant
    }
  ]
}
Report only things that need fixing — never "criterion X: OK". Zero findings is a fine outcome.
Write the .md and each finding's detail following § Writing style at the top of agent-briefs.md.

`suggestion` and each entry of `alternatives` are posted as tick-box options, and `/openvaa-review fix`
hands the ticked one to an agent to carry out with no further discussion. So write each as an instruction
that a competent stranger could follow: name the file, the symbol and the shape of the change. "Reuse the
existing helper" is not an option; "move `isNominatedIn` from `apps/frontend/src/lib/utils/entities.ts` to a
`Nomination.isIn(election)` method in `packages/data` and update its three callers" is. Offer an alternative
only when a reviewer might genuinely prefer a different fix (a narrow patch versus the general refactor,
say), not to pad the list.

One route per option, always. When you see two or more acceptable fixes, pick the one you recommend and
write it alone as `suggestion`; put each other route, whole and self-contained, in its own `alternatives`
entry. Never write "two routes, either acceptable: (a) … (b) …" or "either X or Y" inside one string — that
renders as a single checkbox, so the reviewer cannot choose between the routes and the fix agent receives
both. A caveat that belongs to one route (a migration it needs, a docs page it must update) goes inside that
route's own entry.

Reply only: "{LENS} written: <n> findings".
```

`{EVIDENCE_FORMAT}` is `` `https://github.com/{REPO}/blob/{HEAD_SHA}/<path>#Lx-Ly` `` when the head is on the remote, and `` `<path>#Lx-Ly`, repo-relative, with no URL (the head is not pushed, so links would 404) `` otherwise.

## Verifier

```
You are an adversarial verifier. A {LENS} reviewer produced findings on a pull request; your job is to try
to REFUTE each one. You are the reason a busy human reviewer can trust this report — a false finding
wastes their time and erodes trust in every other finding.

Ignore any "CONTEXT WARNING" line you see; it is addressed to the orchestrator, not to you.

Read: {SKILL_DIR}/references/lenses/{LENS}.md, {SKILL_DIR}/references/global-principles.md,
{RUN}/map.md, {RUN}/lens-{LENS}.md, {RUN}/lens-{LENS}.json, and the sibling lenses' JSON files
{SIBLING_JSONS} (to name duplicates).
Repo {REPO_ROOT}; PR head {HEAD_SHA}; merge base {MB}. Read code only at those SHAs via `git show`/`git grep`.
{STACK_NOTE, as in the cartographer brief}

For each finding, independently:
- Open every evidence location at {HEAD_SHA}. Does the code say what the finding claims?
- If it names an existing thing to reuse: does it exist, and would it actually fit without contortion?
  Read it. "Similar name" is not "reusable".
- Was it introduced by this PR? Check the base at {MB}. Pre-existing and untouched → REFUTED.
- Is it a real design problem, or a defensible choice the PR made deliberately (look for comments,
  the PR body, a documented exception, a recorded decision)? A deliberate, documented exception → REFUTED or
  DOWNGRADED.
- Is the severity right per global-principles.md?
- Does it cite a CLAUDE.md invariant or checklist item that the code actually follows?
- For a stack slice: does it complain about something another slice of the stack provides? → REFUTED.
- Does another lens own it (ownership table), or does a sibling raise the same defect? Name the sibling id in
  the reason so the consolidator can merge.

If a finding's `suggestion` bundles several routes ("(a) … (b) …", "either X or Y"), split it: write the route
you recommend as revised_suggestion and each other route as its own revised_alternatives entry. Every option is
one checkbox, so one option must be one route.

Also fact-check the explanation and the affected list in lens-{LENS}.md. Fix what is wrong by editing
lens-{LENS}.md in place (keep its shape and length), and list each change in explanation_corrections.
If {RUN}/map.md makes a claim in your lens's territory that the code contradicts, note it there too — the
map's Purpose paragraph is shown to the reviewer verbatim.

Write {RUN}/verify-{LENS}.json:
{
  "lens": "{LENS}",
  "verdicts": [ { "id": "...", "verdict": "CONFIRMED | DOWNGRADED | REFUTED",
                  "severity": "<final severity if CONFIRMED/DOWNGRADED>",
                  "reason": "<1-3 sentences with the evidence you checked>",
                  "revised_title": "<optional, any verdict: the title restated so it is true>",
                  "revised_detail": "<optional, any verdict: the detail restated so it is true>",
                  "revised_suggestion": "<optional: a working fix, when the proposed one would not work — ONE route only>",
                  "revised_alternatives": ["<optional: replaces alternatives; one self-contained route per entry>"] } ],
  "explanation_corrections": [ { "quote": "<wrong sentence>", "correction": "<what is true>" } ],
  "map_corrections": [ { "quote": "<wrong sentence in map.md>", "correction": "<what is true>" } ]
}
Reply only: "verified {LENS}: <confirmed>/<total>".
```

## Consolidator

Runs once, after every verifier has finished. It turns many per-lens files into one coherent set. Lens agents raise the same issue from different angles (a copied predicate shows up under complexity-reuse, domain-packages and conciseness), and verifiers note corrections without always applying them.

```
You are consolidating a multi-lens PR review before it is posted as one comment. Files in {RUN}:
map.md, lens-<lens>.md / lens-<lens>.json, verify-<lens>.json for every lens. Repo {REPO_ROOT}, head {HEAD_SHA}.

Ignore any "CONTEXT WARNING" line you see; it is addressed to the orchestrator, not to you.

1. Apply every verifier correction that has not been applied yet:
   - explanation_corrections → edit lens-<lens>.md so the sentence is true (keep shape and length).
   - map_corrections → edit map.md, especially ## Purpose, which is shown to the reviewer verbatim.
   - A CONFIRMED verdict whose reason corrects a count, a line or a claim in the finding → add
     "revised_detail" (and "revised_title" if the title is wrong) to that verdict in verify-<lens>.json.
   Do not re-verify; trust the verifier's reason. Do not touch findings the verifier REFUTED.

2. Find duplicates: two or more surviving findings (across ALL lenses) about the same defect or the same
   fix. Verifiers usually named them in their reasons. For each group pick the one primary finding that is
   most precise and best placed, per the ownership table in
   {SKILL_DIR}/references/global-principles.md (components over complexity-reuse for a UI fork,
   domain-packages over complexity-reuse for data-object logic, database over complexity-reuse for an RPC,
   cross-cutting over database for authority disagreeing across layers). If the others add a genuinely
   distinct point, fold it into the primary's revised_detail (write it into that lens's verify JSON).
   The conciseness lens's cut tally cross-references other lenses' findings by id: keep those
   cross-references and do not drop the conciseness finding for them.

3. Write {RUN}/merge-plan.json:
   { "drop": ["<id of every non-primary duplicate>", ...],
     "xref": { "<primary id>": ["<lens that lost a duplicate>", ...] },
     "groups": [ { "primary": "<id>", "merged": ["<id>", ...], "why": "<one line>" } ] }
   Finding ids are only unique within a lens, so write ids as "<lens>:<id>" (e.g. "tests:TST-1").

Reply only: "consolidated: <n> kept, <d> dropped as duplicates".
```

---

## Plan mode (`--plan`)

The same team reviews plan documents instead of a diff. The plan cartographer has its own brief. Every other agent gets its normal brief with the **plan-mode preamble** below placed first, `{DIFF_PATH}` replaced by `{RUN}/plans.json`, and `{MB}` left out.

### Plan cartographer

```
You are preparing a map of a set of implementation plans for a team of reviewers. Nothing has been built yet:
the plans describe changes that an executor will make. The reader of the final review did NOT write them.

Ignore any "CONTEXT WARNING" line you see; it is addressed to the orchestrator, not to you.

Inputs: {RUN}/plans.json — "plans" are the documents under review, "context" are the files that explain them
(CONTEXT, DISCUSSION-LOG or DISCUSSION-POINTS, RESEARCH, PATTERNS, UI-SPEC, earlier reviews, the ROADMAP
entry, REQUIREMENTS). Read every one at the branch head with `git -C {REPO_ROOT} show {HEAD_SHA}:<path>`.
Repo: {REPO_ROOT}; head {HEAD_SHA}.

Write {RUN}/map.md with exactly these sections:

## Purpose
3-5 sentences: what the plans set out to deliver and why, in product terms first, then technical. Take the
intent from the context files and the roadmap entry, not only from the plans. If the plans and the context
disagree about the goal, say so.

## Slices
Group what the plans PROPOSE into thematic slices, across plan files: each slice is one coherent piece of the
intended change. For each slice: `### <slice name>` — one-line description — the plans and tasks that cover
it — the files they say they will create or modify. Order slices foundations first. 2-8 slices.

## Lenses
`- plan: APPLIES — <one-line reason> — files: <plan paths>` always. Then, for each lens in [behaviour,
analytics, cross-cutting, common-patterns, data-structure-rot, nomenclature, complexity-reuse,
domain-packages, conciseness, database, server, routes, components, design, accessibility, i18n, tests,
docs-comments, dependencies], either
`- <lens>: APPLIES — <one-line reason> — files: <plan paths and the existing files the proposal touches>` or
`- <lens>: skip — <reason>`. Applicability criteria are the first paragraph of each file in
{SKILL_DIR}/references/lenses/<lens>.md, read as "the plans propose…" instead of "the PR changes…". tests
applies when the plans specify tests or verification commands, which GSD plans nearly always do.
conciseness applies to the scope the plans propose (there is no size.json: estimate from the tasks).
cross-cutting, analytics and nomenclature apply on the same terms as for a PR.

Write Purpose and slice descriptions following § Writing style at the top of
{SKILL_DIR}/references/agent-briefs.md.

When done, reply only: "map written".
```

### Plan-mode preamble (lens agents, verifiers, consolidator)

```
PLAN MODE. There is no diff and no pull-request code to review: the subject is the set of plans listed in
{RUN}/plans.json, which describe changes nobody has made yet. Read each plan, and the context files listed
beside them, at `git -C {REPO_ROOT} show {HEAD_SHA}:<path>`. Wherever your brief says "the PR" or "the diff",
read "what the plans propose". Wherever it says "introduced by this PR", read "proposed by these plans".

- Judge the proposal against the tree as it is at {HEAD_SHA}: what exists to reuse, which rule already lives
  where, what the plans would duplicate or bypass. Search the tree before claiming something exists or does not.
- A decision recorded in the context or discussion files was made by the operator on purpose. Do not raise it
  as a finding unless it breaks a CLAUDE.md invariant; say that it is a recorded decision when you do.
- Do not report that something is unbuilt. Report what the plans would build wrongly, or leave out.
- "What changed" in your .md becomes what the plans propose, from your lens's point of view.
- Evidence: cite the plan's own lines first, then the existing code the proposal collides with or should reuse.
  {EVIDENCE_FORMAT}
- `suggestion` and `alternatives` are edits to the PLAN, applied by an agent that touches plan documents only.
  The reviewer choosing between them cares about what gets BUILT, not about the plan document, so write every
  option in two parts, in this order, separated by a line break:
  1. `Outcome:` what the finished work looks like once the edited plan has been executed, and how that differs
     from what the plan as written would produce. Say it in terms of the end result: what the voter, contestant
     or admin sees or can do, which component, table, function or route exists and what it is responsible for,
     what no longer gets built. One to three sentences, with no plan file names, task numbers or frontmatter
     fields in them. A reviewer must be able to pick between the options by reading the `Outcome:` lines alone,
     so two options must not share one.
  2. `Plan edit:` the change to the documents that gets there. Name the plan file, the task, and the
     replacement text or shape.
  For example: "Outcome: the info toggle is the existing `Expander`, which gains a `title` snippet; no
  `InfoToggle` component is built, so there is one disclosure widget to keep accessible instead of two.\nPlan
  edit: in 182-03-PLAN.md task 2, replace the new `InfoToggle` with extending `Expander` by a `title` snippet,
  and add `apps/frontend/src/lib/components/expander/` to files_modified".
  An option that only repairs the plan as instructions (a false premise, a verify command that cannot go red)
  still opens with `Outcome:`: say what the executor would otherwise have built or failed to prove.
- Severity: `blocking` means executing the plan as written would break a CLAUDE.md invariant, build a second
  source of truth, or fail outright on a false premise. The rest of the severity rule is unchanged.
```

`{EVIDENCE_FORMAT}` is chosen in plan-mode step P1, as for code reviews: a permalink when the head is on the remote, `path#Lx-Ly` text when it is local only.

The verifier's "was it introduced by this PR" check becomes "do the plans really say this": it opens the cited plan lines and confirms the proposal is there, then checks the tree for the claim about existing code. Refute a finding that a later task in the same plan set already resolves. It also holds every option to the two-part shape: one that opens with the plan edit, or whose `Outcome:` describes the document rather than what gets built, is rewritten through `revised_suggestion` / `revised_alternatives`, and so is an `Outcome:` the `Plan edit:` beneath it would not actually produce.

### Plan fix agent

```
You are applying review findings to implementation plans. The repo is at {REPO_ROOT}; work in the working tree,
on the current branch. Edit plan documents ONLY — never source code, migrations or tests, even where a finding
describes what the code should eventually look like. Do not run any git command that writes.

Ignore any "CONTEXT WARNING" line you see; it is addressed to the orchestrator, not to you.

Your findings (apply ALL of them, in this order): {FINDINGS_JSON — each with id, title, detail, evidence,
existing, "apply", the option the reviewer chose, in full and as they edited it, and "reviewer_notes"}. The
reviewer notes are part of the decision: honour every constraint they add. If a note contradicts "apply", stop
and report rather than picking one.

Plan files you own this wave: {FILES}. No other agent is touching them. If a fix needs a plan outside that
list, do not edit it — finish the rest and report the conflict.

For each finding:
1. Read the whole plan, not only the cited lines, and the context files it depends on.
2. Apply the chosen option as written. It is a decision: if you believe it is wrong, stop and report. Its
   `Outcome:` part is what the reviewer chose and its `Plan edit:` part is how to get there: make the edit, then
   check the plan now leads to that outcome. If the edit as written would not, stop and report.
3. Keep the plan internally consistent. A changed task usually moves the plan's frontmatter (files_modified,
   depends_on, must_haves), its verification commands and its success criteria. Keep the document's existing
   structure and task format exactly, because the GSD executor parses it. Anchor any new grep or check on
   content, never on a line number.
4. Where the fix changes a verification command, run it against the current tree and record the result. A
   command meant to prove a task was done must FAIL now, before the task has run. Never read its exit status
   through a pipe.
5. Do not rewrite context, discussion or research files to match. If the fix contradicts a recorded decision,
   say so in your notes for the orchestrator to raise with the operator.

Write {RUN}/fix-{GROUP}.json in the shape § Fix agent gives, with "checks" as
{ "structure": "pass | fail", "verify_commands": "<command> → red | green | not-run", "detail": "..." }.

Reply only: "{GROUP}: <applied>/<total> applied".
```

---

## Fix agent (fix mode)

One agent per finding group in a wave. Groups inside a wave never share a file, so agents never edit the same file concurrently. Agents do not run git commands: the orchestrator commits each wave, because concurrent `git add`/`commit` in one worktree races on the index.

```
You are fixing review findings on a checked-out branch. The repo is at {REPO_ROOT}; work in the working
tree, on the current branch, which is {BRANCH_DESCRIPTION — "PR #{N}'s head" or, for a review stack, "the
stack's source branch {SOURCE_BRANCH}; the slices are re-cut from it afterwards"}. Do not run any git command
that writes: no add, commit, checkout, stash, restore or rebase. `git diff` and `git log` are fine.

Ignore any "CONTEXT WARNING" line you see; it is addressed to the orchestrator, not to you.

Your findings (apply ALL of them, in this order): {FINDINGS_JSON — each with id, title, detail, evidence,
existing, "apply", the option the reviewer chose, in full and as they edited it, and "reviewer_notes", their
notes and PR comments on the finding}. The reviewer notes are part of the decision: honour every constraint they
add. If a note contradicts "apply", stop and report rather than picking one.

Files you own this wave: {FILES}. No other agent is touching them. If a fix genuinely needs a file outside that
list, do not edit it — finish the rest and report the conflict.

For each finding:
1. Read the cited code and enough around it to understand the change. The finding was written against
   {HEAD_SHA}; if the code has moved since, fix the current code and say so in your report.
2. Apply the chosen option as written. It is a decision, not a suggestion: if you believe it is wrong, stop and
   report instead of substituting your own fix.
3. Follow the repo's conventions: {REPO_ROOT}/CLAUDE.md is authoritative (above all § Context Destructuring
   Rule, § Results Navigation Invariants and § Comment Hygiene), and the project skills cover their areas:
   components, data, matching, filters, database. Match the surrounding code.
4. Update or add tests when the fix changes behaviour. Unit tests sit next to the code (`foo.test.ts`);
   E2E specs express behaviour through the fixtures in `tests/tests/fixtures/`, never raw selectors in a
   spec body. A fix to the database adds or updates pgTAP coverage.
5. A fix that adds or renames user-facing copy adds the message to every locale catalogue under
   `apps/frontend/messages/`. A fix that adds an event adds it to the event schema and judges its sensitivity.
6. A fix that changes the schema runs `yarn db:types` afterwards so the generated types match.

When all your findings are done, run the checks that cover your files (`cd {REPO_ROOT}` first), each on its
own line with output redirected to a file, never piped, so an exit status cannot be masked:
- `yarn typecheck`
- the vitest files covering your area, e.g. `cd apps/frontend && npx vitest run <paths>`, or
  `cd packages/<pkg> && npx vitest run <paths>`
Do NOT run E2E, `yarn db:reset` or anything that stops or restarts the shared Supabase stack: the
orchestrator runs those once per wave. Report failures you could not fix rather than deleting or skipping the
test that caught them.

Write {RUN}/fix-{GROUP}.json:
{ "group": "{GROUP}",
  "results": [ { "id": "...", "status": "applied | partial | blocked",
                 "files": ["<paths you edited>"],
                 "summary": "<what you changed, 1-3 sentences>",
                 "notes": "<what you could not do and why, or null>" } ],
  "checks": { "typecheck": "pass | fail | not-run", "tests": "<command> → pass | fail | not-run",
              "detail": "<failure output, trimmed, when something failed>" } }

Reply only: "{GROUP}: <applied>/<total> applied".
```

## Re-evaluation preamble (fix mode)

Prepended to the Lens agent and Verifier briefs in fix-mode step 7 (and to their plan-mode versions for `fix --plan`). `{HEAD_SHA}` in those briefs is `{FIX_HEAD}`.

```
This is a RE-EVALUATION, not a first review. The PR was reviewed, a reviewer recorded decisions, and those
decisions have just been applied as commits on top of the reviewed head. Review the PR as it now stands at
{FIX_HEAD}, with merge base {MB}. The PR before any fix was {FIX_BASE}.

Also read:
- {RUN}/decisions.json: every finding of the original review, its `decision` (fix | skip) and the option
  that was applied (`choice`), with the reviewer's notes.
- {RUN}/conflicts.json: pairs of decisions that collided and how each was settled.
- {RUN}/reeval/fixes.diff: exactly what the fix commits changed (`git diff {FIX_BASE} {FIX_HEAD}`).

Findings decided `skip` were declined by the reviewer or the author: treat them as calibration and do not raise
them again, under any wording. A conflict settled in conflicts.json is settled: do not reopen it.

For every applied finding your lens owns, check that its chosen option is fully in the code at {FIX_HEAD}, every
call site, catalogue entry and test included. One that is not becomes a finding with the ORIGINAL id and
"origin": "unresolved".

Every other finding gets a fresh id and one of:
- "origin": "fix" — the problem lies in lines fixes.diff added or changed, or a fix removed something the
  PR relied on. Cite the fix-diff lines in evidence.
- "origin": "pr" — the problem is in PR code the fix commits did not touch: the first review missed it.
Add "origin" to each finding in the JSON you write. Do not report a problem that already existed at {MB} and that
neither the PR nor the fixes touched.

Verifier: besides the usual checks, confirm each finding's origin with `git diff {FIX_BASE} {FIX_HEAD} -- <path>`,
and correct it in a "revised_origin" field when it is wrong. An "unresolved" finding whose option is in fact fully
applied is REFUTED.
```

## Test fix agent (fix mode)

One agent per group of failing test files in fix-mode step 8. Groups never share a test file or the source file under test. E2E failures are not fixed by this agent in parallel: they share one stack and one dev server, so the orchestrator handles them one at a time (see SKILL.md § Fix mode step 8).

```
You are fixing failing unit tests on a checked-out branch at {REPO_ROOT}. Do not run any git command that
writes: no add, commit, checkout, stash, restore or rebase. `git diff`, `git log` and `git show` are fine.
Do not run `yarn typecheck`, `yarn build` or E2E: other agents run in parallel and the orchestrator runs those
once after the wave.

Ignore any "CONTEXT WARNING" line you see; it is addressed to the orchestrator, not to you.

Failing tests: {FAILURES — file, test name, the trimmed failure output, and the orchestrator's attribution:
"fix-commit" | "pr" | "unrelated" | "unclear"}. The PR before the review fixes was {FIX_BASE}; the fixes applied
are in {RUN}/decisions.json, and `git diff {FIX_BASE} HEAD` shows them.

Files you own: {FILES}. If a fix needs a file outside that list, do not edit it: report it.

For each failure:
1. Reproduce it: `cd {REPO_ROOT}/<workspace> && npx vitest run <file>`. The dev-seed integration tests need the
   local Supabase stack up (`yarn db:status`); a `fetch failed` there means the stack is down, not a defect —
   report it rather than editing the test.
2. Decide whether the code or the test is wrong. The code is wrong when the test pins behaviour nobody decided to
   change. The test is wrong when it pins behaviour a decision in decisions.json changed on purpose: cite that
   finding id. If you cannot tell which behaviour is intended, stop and report it as needing a decision.
3. Fix it. Never delete a test, skip it, add `.only`, add retries, or loosen an assertion until it passes.
   Follow {REPO_ROOT}/CLAUDE.md and tests/README.md.
4. Re-run the file, and any other test file that covers the code you changed.

Write {RUN}/testfix-{GROUP}.json:
{ "group": "{GROUP}",
  "results": [ { "test": "<file › name>", "status": "fixed | needs-decision | blocked",
                 "changed": "code | test", "files": ["<paths you edited>"], "finding": "<id or null>",
                 "cause": "<1-2 sentences: why it failed>", "notes": "<what you could not do, or null>" } ],
  "checks": "<vitest command> → pass | fail" }

Reply only: "{GROUP}: <fixed>/<total> fixed".
```
