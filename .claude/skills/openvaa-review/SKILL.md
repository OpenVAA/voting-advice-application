---
name: openvaa-review
description: >-
  Human-review brief for an OpenVAA pull request: filters planning, generated, lockfile, translation and test
  noise out of the diff, runs a parallel team of design lenses (behaviour, analytics, cross-cutting authority
  and project scope, settings merit, data-structure rot, nomenclature, reuse, domain packages, conciseness,
  database, Edge Functions, routes, Svelte components, design, accessibility, localization, tests, docs,
  dependencies), peer-verifies every finding, and posts ONE thematic PR review that explains the change to a
  non-author, its findings in three comments (decisions needed, critical, fixed by default) with tick-box fix
  options; everything is fixed by default. Use for "review PR 897", "brief me on this PR", "prep the human
  review", "what does this PR actually change", as the last step of /openvaa-pr, and for each slice of a
  ship-review-stack stack. "openvaa-review fix <PR#>" (or --fix) applies a posted review's ticked options and
  every other open review comment on the PR in parallel waves, re-evaluates and fixes what that finds, runs the
  gates and targeted E2E, squashes the fixes into the feature commits and pushes; on a stack slice it fixes the
  source branch and re-cuts the slices. "fix --auto" asks nothing but the hard decisions. "openvaa-review --plan [branch] [guidance]" reviews unexecuted GSD
  plans through the same lenses before execution. "openvaa-review learn" promotes recurring findings into
  .agents/code-review-checklist.md and the project skills. --local keeps a review off GitHub as a committed
  file. NOT for bug-hunting review (that is /code-review or /gsd-code-review), and NOT for splitting a branch
  into a stack (that is ship-review-stack).
targets:
  - .agents
  - .claude/skills/ship-review-stack
  - tests/scripts
  - apps/frontend/src/lib/analytics
---

# OpenVAA review

Turns a finished PR into a review a human can read by theme instead of file by file. By the time this runs, the author has iterated `/code-review` and `/openvaa-pr`, so correctness bugs are mostly gone. This review is about **design**:

- whether the change fits the app's mental models and the CLAUDE.md invariants;
- whether it reuses what exists in the packages and utility folders;
- whether its size fits its subject;
- whether it leaves the codebase simpler rather than more patched.

A bug that is obviously real still gets reported, but hunting bugs is not the job.

The reader is the **non-author reviewer**. Every lens section therefore opens by explaining what changed, in plain terms, before judging anything. A reviewer who reads only the explanations should still come away understanding the PR.

## Modes

| Invocation | Does |
| --- | --- |
| `/openvaa-review <PR#>` | Full review; posts (or updates) the PR comment |
| `/openvaa-review <PR#> --dry-run` | Same, but writes `comment.md` to the run dir and prints its path; nothing is posted |
| `/openvaa-review <PR#> --verbose` | Keeps every lens's **Affected** list in the comment (combines with `--dry-run`). Without it only Common patterns and Conciseness show theirs |
| `/openvaa-review` (no number) | Uses the current branch's PR. If there is none, reviews `$BASE..HEAD` in dry-run, asking for the base when it is not obvious |
| `/openvaa-review fix <PR#>`, `<PR#> --fix`, `--fix [<PR#>]` | Applies the review's decisions and fixes every other open review comment on the PR. See § Fix mode. `--fix` anywhere selects fix mode, never a review |
| `/openvaa-review fix <PR#> --auto` | Fix mode that asks the operator only the hard decisions (§ Fix mode › Hard decisions) and runs everything else unattended. `--auto` without `fix` or `--fix` is fix mode too |
| `/openvaa-review --plan [<branch or PR#>] [guidance]` | Reviews unexecuted plans on a branch. See § Plan mode |
| `/openvaa-review fix --plan <branch or PR#>` | Applies a plan review's decisions to the plan documents |
| any of the above with `--local` | Saves the review as a committed file instead of posting it. See § Local reviews |
| `/openvaa-review <PR#> <PR#> …` or a range (`890-904`) | One full review per PR, run as described in § Several PRs at once |
| `/openvaa-review learn [--limit N]` | Learning loop across past reviews, see `.claude/skills/openvaa-review/references/learning-loop.md` |

The flags combine in any order (`--plan --fix 912` is `fix --plan 912`, `--auto --plan 912` is `fix --plan --auto 912`), and `--dry-run` works with `--plan` too.

Posting is the purpose of the skill, so do it without asking again, unless `--local` says otherwise. A re-run **edits** the existing comment instead of adding a second one (see step 8).

## Workflow

Keep the orchestrator's own context light. Agents read the diff; you read their files. Subagent returns can arrive late or truncated, so every agent writes its result to a file in the run dir, and you read the file.

The repository has several remotes (`origin` is the upstream `OpenVAA/voting-advice-application`; there is also a fork and a private repo) and `gh` has no default set, so **name `$REPO` in every `gh` call**. Use only `gh api` REST routes: the `gh pr` / `gh repo` subcommands go through GraphQL, which cloud sessions refuse with HTTP 403. Read every exit status directly, never through a pipe.

### 1. Resolve the PR and its true base

```bash
N=<pr>; REPO=$(git remote get-url origin | sed -E 's#.*github\.com[:/]##; s#\.git$##')
REPO_ROOT=$(git rev-parse --show-toplevel); SKILL_DIR=$REPO_ROOT/.claude/skills/openvaa-review
PR_JQ='{state: (if .merged then "MERGED" else (.state|ascii_upcase) end), isDraft: .draft, title, body,
  author: {login: .user.login}, url: .html_url, baseRefName: .base.ref, headRefName: .head.ref, headRefOid: .head.sha}'
PR=$(gh api repos/$REPO/pulls/$N --jq "$PR_JQ") || exit 1; echo "$PR" | jq -r .state   # stop if CLOSED/MERGED
git fetch -q origin pull/$N/head:refs/remotes/pr/$N
HEAD_SHA=$(git rev-parse pr/$N); BASE=$(echo "$PR" | jq -r .baseRefName)
MB=$(gh api repos/$REPO/compare/$BASE...$HEAD_SHA -q .merge_base_commit.sha); git fetch -q origin $MB
RUN=${TMPDIR:-/tmp}/openvaa-review/pr-$N-${HEAD_SHA:0:10}; mkdir -p $RUN
gh api --paginate repos/$REPO/pulls/$N/files -q '.[].filename' > $RUN/expected-files.txt
echo "$PR" > $RUN/pr.json
[ "$(gh api repos/$REPO/pulls/$N -q .head.sha)" = "$HEAD_SHA" ] || echo "HEAD MOVED — re-run step 1"
```

**Why the file list and head check are done this way:**

- **The file list** comes from the files API, not `gh pr diff --name-only`, which refuses PRs over 300 files with HTTP 406 and writes an empty list. The files API itself stops at 3,000 files. `triage_diff.py` warns when the list is exactly that long and then checks it only as a subset.
- **The last line** catches an author pushing mid-run. The listing describes the PR's head *now*, while `HEAD_SHA` was pinned at the fetch, so start step 1 again. A push during the lens agents' run is harmless: they all read the pinned SHA.

The merge base comes from GitHub, so a PR targeting another branch (a stacked PR) is handled. Name the base in the comment header so the reader knows what the diff is relative to.

**Review-stack slices.** A PR is a slice of a `ship-review-stack` stack when its head branch matches `ship/*` or its title opens `NN/NN`. Then:

1. Record the slice in `$RUN/stack.json` as `{"k": <int>, "n": <int>, "source_branch": "<branch>", "slice_branch": "<head branch>", "base": "<base branch>"}`. The source branch comes from the stack manifest or the PR body; ask when neither names it.
2. Give every agent the stack note in `.claude/skills/openvaa-review/references/agent-briefs.md`. The note tells the agents where files from other slices are: lower slices are at `$HEAD_SHA`, and higher slices only on the source branch.
3. The compose script reads `stack.json` and puts the slice position and the source branch in the header. Don't edit them into `comment.md` by hand.

The slice that holds only planning and agent configuration has nothing for these lenses: say so in one line and stop. Its secret scan is `ship-review-stack` step 8, not this skill's job.

### 2. Triage the diff

```bash
python3 $SKILL_DIR/scripts/triage_diff.py --base $MB --head $HEAD_SHA --out $RUN --expect-files $RUN/expected-files.txt
```

It writes these files:

- `manifest.json`: every file with its class, noise flag and lens hints.
- `review.diff`: the human-relevant files, whitespace-insensitive.
- `tests.diff`: read by the tests lens.
- `translations.diff`: the non-English catalogues, read by the i18n lens for key-set completeness.
- `size.json`: effective lines, read by the conciseness lens.
- `summary.txt`.

Noise is:

- `.planning/`;
- agent infrastructure (`.claude/`, `.agents/`, `CLAUDE.md`);
- lockfiles;
- generated files (`packages/supabase-types`, the Paraglide output, snapshots);
- E2E run artefacts;
- non-English catalogues;
- test files: specs and unit tests (`*.spec.*`, `*.test.*`) and pgTAP;
- formatting-only and pure-rename files.

The E2E harness is not noise. Code under `tests/` that is not a spec or a unit test (the runner, fixtures, setup projects, utils and scripts) is class `test-infra`. It is reviewed and counted as code, and it also appears in `tests.diff`. A slice made of the E2E suite therefore still has a `review.diff`.

When the PR is mostly agent infrastructure, rerun triage with `--agent-infra-reviewable`, and only docs-comments and complexity-reuse apply.

Exit code 3 means the local file set disagrees with GitHub's. Do not review a guessed diff:

1. Check `$RUN/expected-files.txt` first. An empty or truncated list is a failed `gh` call in step 1, not a stale clone.
2. Otherwise fetch more history (`git fetch --deepen=200 origin $BASE`) and retry.
3. If it still fails, stop and report it.

### 3. Map the PR

Spawn one **cartographer** agent (brief in `.claude/skills/openvaa-review/references/agent-briefs.md` § Cartographer). It reads `pr.json`, `summary.txt`, `manifest.json`, `size.json` and `review.diff`, then writes `$RUN/map.md` with three sections:

- **Purpose:** the PR's purpose in 3–5 sentences, for someone who has not seen it.
- **Slices:** thematic groups of files that together do one thing, each with a one-line description, its files and a suggested reading order.
- **Lenses:** the lenses that genuinely apply, each with a one-line reason and its file list. The manifest's `lens_hints` are candidates only.

Every later agent reads the map, so all sections use the same slice names.

### 4. Run the lenses in parallel

For each applicable lens, spawn one lens agent **in the same message**, so they all run concurrently (brief: `.claude/skills/openvaa-review/references/agent-briefs.md` § Lens agent). Each agent gets:

- its lens file `.claude/skills/openvaa-review/references/lenses/<lens>.md` and `.claude/skills/openvaa-review/references/global-principles.md`;
- the project skill its lens leans on (components for components, design and accessibility; database for database and server; data, matching and filters for domain-packages);
- the paths to `map.md`, `manifest.json` and its diff (`review.diff`, `tests.diff` for tests, `review.diff` + `translations.diff` for i18n, `size.json` for conciseness), plus `$MB`, `$HEAD_SHA` and `$REPO`;
- the evidence format: permalinks, since the PR head is on GitHub;
- the output paths `$RUN/lens-<lens>.md` and `$RUN/lens-<lens>.json`.

Lens files: `behaviour`, `analytics`, `cross-cutting`, `common-patterns`, `data-structure-rot`, `nomenclature`, `complexity-reuse`, `domain-packages`, `conciseness`, `database`, `server`, `routes`, `components`, `design`, `accessibility`, `i18n`, `tests`, `docs-comments`, `dependencies` (and `plan`, in plan mode only).

Before briefing a lens, pass along its "not a finding" notes from `.claude/skills/openvaa-review/references/calibration.md`, plus the "all lenses" notes. Those notes come from past reviewers rejecting findings, and they stop the skill repeating the same false positives.

**Keep the team proportionate.** Lenses with a small scope, roughly under 200 reviewable lines each, can share one agent, which still writes each lens's own files. The usual groups are dependencies + docs-comments + design, and analytics + i18n. A typical PR ends up with 5–9 lens agents. A large slice (over ~3,000 reviewable lines) may give one lens two agents, split by the map's slices, writing `lens-<lens>-a.*` and `lens-<lens>-b.*`. Merge each pair into `lens-<lens>.*` before verification, renumbering ids.

**Lenses that apply regardless of which paths changed:**

- **conciseness**: every PR containing code.
- **analytics**: whenever behaviour applies, because it asks whether each new affordance is measured.
- **cross-cutting**: every feature PR, because project scope, authority, visibility, settings, election cardinality, entity variants and registration modes cut across every layer.
- **nomenclature**: whenever a new root term appears.
- **accessibility**: whenever the diff changes what is rendered. Its `a11y-scan-reach` check asks whether the axe scan visits the changed surface.
- **components**: whenever the diff changes what a user sees, at least for its `cmp-screenshots` check.
- **docs-comments**: whenever comments are added or changed, a source file is added or substantially rewritten (its `doc-top-down` check), or behaviour a guide describes changes.

`.claude/skills/openvaa-review/references/global-principles.md` § Lens ownership says which lens owns an issue that touches several. Pass it on in every lens brief, because duplicate findings each cost a verifier pass.

### 5. Peer-verify

As each lens file lands, spawn a **verifier** for it (brief: § Verifier). The verifier is adversarial. For every finding it re-reads the cited code at `$HEAD_SHA` and checks the claim against the repo: does the "existing utility" actually exist and fit, and did the PR introduce this or is it pre-existing? It returns one of these verdicts, with a reason:

- `CONFIRMED`;
- `DOWNGRADED`: real, but lower severity or narrower;
- `REFUTED`.

It also fact-checks the lens's **explanation** and fixes it in place, since a wrong explanation misleads the reviewer more than a missed finding would. It writes `$RUN/verify-<lens>.json`.

One verifier can cover several lenses that have only one or two findings each. Point every verifier at the sibling lenses' JSON files so it can name duplicates. A lens with zero findings still gets its explanation fact-checked, batched into a neighbouring verifier.

### 6. Consolidate

When every verifier has finished, spawn one **consolidator** (brief: § Consolidator). It does three things:

- applies the pending verifier corrections, including to `map.md`, whose Purpose is posted verbatim;
- groups the duplicate findings that crossed lens boundaries;
- writes `$RUN/merge-plan.json`.

Duplicates are normal even with the ownership table. A copied predicate is legitimately a reuse problem, a domain-packages problem and a conciseness cut.

### 7. Compose

```bash
python3 $SKILL_DIR/scripts/compose_comment.py --run $RUN --pr $N --repo $REPO --base $BASE --mb $MB --head $HEAD_SHA [--verbose]
```

Pass `--verbose` only when the user supplied it.

The script applies the verdicts (refuted findings dropped, severities and revised text honoured) and the merge plan, then writes `comment.md` following `.claude/skills/openvaa-review/references/comment-template.md`:

- **The Findings** come in three blocks, each a comment of its own (the first shares the header's comment):
  1. **Decisions needed:** findings with `needs_decision`, each led by the question it asks. Fix mode never takes these by default.
  2. **Critical:** `severity: critical` findings, with the detail shown open so the operator sees what went wrong.
  3. **Fixed by default:** the rest, detail collapsed.

  The stance is that everything gets fixed: an untouched finding means its recommended option. Every finding shows its fix options as tick boxes: the recommended fix, any alternatives, `Discuss` and `Don't fix`.
- **Lens sections** keep their explanation and point at their findings by id. Their **Affected** list is dropped, except under Common patterns and Conciseness, unless `--verbose` is given.
- **Lenses that did not apply** are absent. **A lens with nothing to fix** keeps its explanation and says "Nothing to fix." **Evaluation criteria** never get an "OK" line each.

It escapes every `<` and `>` in agent-written text outside code spans, fenced blocks, blockquote markers and real HTML, because GitHub silently drops unknown tags. Fix options are escaped before they are fingerprinted, and `parse_decisions.py` turns the entities back.

The parts are `comment.md`, `comment-2.md`, `comment-3.md` and so on, each continuation starting with an `openvaa-review:v1-cont` marker. Each non-empty block after the first starts a new part, so the comment boundaries fall on the seams between the blocks. A part is also capped at about 20,000 characters, because task-list checkboxes toggle unreliably in long comments, and overflows into the next. The lens sections follow the last block, and nothing is dropped.

The hidden data block counts towards the first comment's budget. When the first comment can't hold it, the block gets a final comment of its own, with no checkboxes. `parse_decisions.py` and `harvest.py` read it from either place, so every visible part stays under the cap.

Do not hand-edit `comment*.md` before posting. If the composed text is wrong (a missing header line, a cut-off bullet), fix the script or the run's input files and compose again. Then the next run gets the fix too. When you check a part's text, read the file whole: a preview that cuts lines at a width makes complete bullets look truncated.

With `--dry-run`, stop here and print the paths.

### 8. Post

The first part carries the `<!-- openvaa-review:v1 ` marker (note the trailing space) and continuations carry `<!-- openvaa-review:v1-cont`. A re-run edits the existing comments in place rather than stacking new ones:

```bash
IDS=$(gh api repos/$REPO/issues/$N/comments --paginate -q '.[] | select(.body | test("<!-- openvaa-review:v1[ -]")) | .id')
# pair existing ids with comment.md, comment-2.md, … in posting order: PATCH the ones that exist,
# create the missing ones with `gh api repos/$REPO/issues/$N/comments -F body=@<file>`, and delete leftover continuations
# from an earlier, longer review with `gh api -X DELETE repos/$REPO/issues/comments/<id>`
gh api -X PATCH repos/$REPO/issues/comments/<id> -F body=@$RUN/comment.md
```

On an update, carry over any feedback boxes a reviewer already ticked, as long as the finding id still exists. Wiping human feedback would break the learning loop.

### 9. Close the loop (every run, light-touch)

Report back to the user:

- the comment URL(s);
- findings per lens;
- how many the verifier refuted;
- the conciseness lens's effective-line count against its sketch.

Then check the confirmed findings against `.agents/code-review-checklist.md` and the lens's *Promote to* targets. If a critical finding is something neither covers, name it as a **promotion candidate** and suggest `/openvaa-review learn`. Do not edit the checklist or the skills during a review run: the branch under review is someone else's, and learnings go on their own branch (`.claude/skills/openvaa-review/references/learning-loop.md`).

## Several PRs at once

Each review runs as its own orchestrator agent, one per PR, following the Workflow. All their agents count against one session-wide limit on concurrent subagents (20 at present), so the reviews have to share it:

1. **Resolve first, serially.** Skip the closed and merged PRs, and the stack's planning slice (step 1). Fetch every head and merge base yourself, one after another. Concurrent `git fetch` runs in one repository contend for its lock files. Give each review its `HEAD_SHA`, `MB`, base and, for a slice, its `stack.json` facts, and tell it not to fetch unless triage exits 3.
2. **At most three reviews at a time**, each keeping no more than about seven agents of its own running. Start the next review as one finishes. Smallest-first gets early results back; the big slices take longest.
3. **A refused spawn means wait.** When a spawn fails with "Concurrent subagent limit reached", the review yields until one of its own agents finishes and spawns again. It never plays the lens, verifier or consolidator role itself. One agent checking its own claims is not peer verification. If a review did fall back anyway, rerun it once the others are done. The rerun edits the posted comments in place (step 8).
4. Report one row per PR: its comment link, findings per block, the refuted count, and any problem the review raised. The promotion candidates and recurring themes go in one list across all the PRs.

## Local reviews

`--local` keeps the review off GitHub. Nothing is posted or edited on the PR, whether or not one exists. The review is a file committed to the reviewed branch, and its tick boxes are edited in the file. Everything in plan-mode step P6 about committing applies: the three commit routes, the commit holding the review alone, the non-empty check, carrying over ticks, and no push.

| Review | File |
| --- | --- |
| Plan (`--plan --local`) | `OPENVAA-PLAN-REVIEW.md` in the directory that holds the plans |
| Code (`--local`) | `.planning/reviews/<branch with / as ->-OPENVAA-REVIEW.md` |

The PR, when there is one, is still used for what only it knows: the head, the base and the true merge base. A code review of a branch with no PR, which is otherwise a dry run, becomes a committed file too, composed with `--branch` in place of `--pr`.

Pass `--local` to the compose script as well, so the review is written as one unsplit file whose fix hint names `--local`:

```bash
python3 $SKILL_DIR/scripts/compose_comment.py --run $RUN --local --branch "$BRANCH" --repo $REPO --base $BASE --mb $MB --head $HEAD_SHA ${N:+--pr $N}   # code
python3 $SKILL_DIR/scripts/compose_comment.py --run $RUN --plan --local --branch "$BRANCH" --head $HEAD_SHA ${N:+--pr $N}                            # plan
```

A code review's file lands under `.planning/`, which triage already treats as noise, so a later review of the same branch does not review the review. The commit moves the branch's head by one docs commit; say so in the report. On a review-stack slice, never commit to the slice: commit the file to the stack's source branch under `.planning/reviews/`, where it lands in the planning slice at the next re-cut.

`fix --local` reads the file and never looks at the PR's comments:

```bash
python3 $SKILL_DIR/scripts/parse_decisions.py [--plan] --from-files <path to the review file> --out $RUN/decisions.json
```

Parse it from the working tree after the checkout. Commit uncommitted ticks first, as § Fix mode › Plan reviews step 3 describes. A local review has no reviewer-feedback block and is not harvested by `learn`.

## Plan mode

`/openvaa-review --plan <branch or PR#> [guidance]` reviews what a branch is **about to build**. The subject is the plan documents; the tree is read only to check what the plans say about it. Catching a forked component or a second source of truth here costs an edit to a plan; catching it in the PR costs the code.

This complements the GSD tooling and does not replace it:

- `gsd-plan-checker` checks each plan goal-backward;
- `/gsd-review` asks other AIs;
- this mode asks the design questions the lenses ask of code.

Everything after `--plan` and the target is free-form guidance on which plans to evaluate: "phase 182", "only 03 and 04", "the quick task about invitations", a path. The target is optional and defaults to the current branch.

The run follows the Workflow with these steps replacing 1, 2, 7 and 8. Triage is skipped, since its noise filter exists to remove planning documents.

### P1. Resolve the branch and whether it has a PR

```bash
T=<target>; REPO=$(git remote get-url origin | sed -E 's#.*github\.com[:/]##; s#\.git$##')
REPO_ROOT=$(git rev-parse --show-toplevel); SKILL_DIR=$REPO_ROOT/.claude/skills/openvaa-review
N=<the number, or: gh api "repos/$REPO/pulls?state=open&head=${REPO%%/*}:$T" -q '.[0].number'>
if [ -n "$N" ]; then
  BRANCH=$(gh api repos/$REPO/pulls/$N -q .head.ref)
  git fetch -q origin pull/$N/head:refs/remotes/pr/$N; HEAD_SHA=$(git rev-parse pr/$N)
else
  BRANCH=$T; git fetch -q origin "$BRANCH" 2>/dev/null
  HEAD_SHA=$(git rev-parse -q --verify "refs/heads/$BRANCH" || git rev-parse "origin/$BRANCH")
fi
PUSHED=$(git branch -r --contains $HEAD_SHA | head -1)   # empty = the head is local only
RUN=${TMPDIR:-/tmp}/openvaa-review/plan-${N:-$(echo $BRANCH | tr / -)}-${HEAD_SHA:0:10}; mkdir -p $RUN
git ls-tree -r --name-only $HEAD_SHA > $RUN/tree.txt
```

Without a PR, a local branch wins over `origin/<branch>` when both exist and differ, because plans are usually reviewed before they are pushed. Say which one was read. `PUSHED` decides the evidence format the agents are given, because permalinks 404 on a head GitHub has never seen.

Read every file as the branch has it, with `git show ${HEAD_SHA}:<path>` (braces matter in zsh), never from the working tree, which may be on another branch.

### P2. Find the plans

```bash
grep -E '(^|/)[^/]*PLAN[^/]*\.md$' $RUN/tree.txt | grep -v 'PLAN-REVIEW' > $RUN/plan-candidates.txt
```

GSD planning files are the source:

- **Phase plans:** `.planning/phases/<N>-<slug>/<N>-<NN>-PLAN.md`.
- **Workstream plans:** `.planning/workstreams/<ws>/phases/…`.
- **Quick tasks:** `.planning/quick/<slug>/`.

A plan is *unexecuted* while it has no sibling summary (`182-03-PLAN.md` without `182-03-SUMMARY.md`). `.planning/STATE.md`, or the workstream's own, names the phase in progress.

- **With guidance:** resolve it against the candidates and `ROADMAP.md`. Guidance that names an already-executed plan is honoured; say in the report that it has a summary. Guidance that matches nothing is a question for the operator, not a reason to guess.
- **Without guidance:** look for the plans about to be executed, in this order:
  1. unexecuted plans the branch added or changed;
  2. the unexecuted plans of the phase `STATE.md` points at;
  3. outside GSD, a plan-shaped document the branch added, or one the PR body points to.
- **One coherent set** (one phase directory, one quick task, one document) is the answer. Proceed, and name it in the first line of the report so a wrong pick is visible at once.
- **Several sets, or none,** is the operator's call. Ask with `AskUserQuestion`, giving each set as an option described by its goal and plan count. Do not review every plan on the branch to be safe: this branch carries hundreds, and a review of the wrong ones buries the right one.

### P3. Gather the context

The plans say what; the files beside them say why, and what was already decided. Collect, from the same tree:

- **GSD phase:** everything in the phase directory that is not a plan or a summary: CONTEXT, DISCUSSION-LOG, DISCUSSION-POINTS (with the operator's ticks), RESEARCH, PATTERNS, SPEC, UI-SPEC, VALIDATION and earlier REVIEWS. Add the phase's entry in `ROADMAP.md`, the requirements it claims in `REQUIREMENTS.md`, and `PROJECT.md`.
- **GSD quick task:** everything in its directory.
- **Elsewhere:** the documents beside the plan and the PR body, saved into `$RUN` as files.
- **An earlier `OPENVAA-PLAN-REVIEW.md`** or plan-review comment: pass every finding ticked `Don't fix` to the lens agents as calibration.

Write `$RUN/plans.json`: `{ "branch", "head", "pr", "plans": [{ "path", "title" }], "context": ["<path>", …] }`.

### P4. Map, lenses, verify, consolidate

Run Workflow steps 3–6 with the briefs in `.claude/skills/openvaa-review/references/agent-briefs.md` § Plan mode: the plan cartographer, then every lens agent, verifier and the consolidator with the plan-mode preamble.

- The `plan` lens (`.claude/skills/openvaa-review/references/lenses/plan.md`) always runs. It covers false premises, vacuous verify commands, goal gaps, drift from recorded decisions, and this repo's E2E ruling.
- The other lenses apply by what the plans propose, exactly as they would to the code.

### P5. Compose

```bash
python3 $SKILL_DIR/scripts/compose_comment.py --run $RUN --plan --branch "$BRANCH" --head $HEAD_SHA ${N:+--pr $N}
```

With `--dry-run`, stop here and print the path.

### P6. Deliver: the PR if there is one, a committed file if not

**With a PR** and no `--local`, post as in step 8, with the plan marker, so a later code review of the same PR leaves this comment alone:

```bash
IDS=$(gh api repos/$REPO/issues/$N/comments --paginate -q '.[] | select(.body | test("<!-- openvaa-plan-review:v1[ -]")) | .id')
```

**Without a PR, or with `--local`,** the review is a file on the branch: `OPENVAA-PLAN-REVIEW.md` in the directory that holds the plans (the closest common directory when they span several). The reviewer ticks boxes in the file, and `fix --plan` reads it back. If the file already exists at `$HEAD_SHA`, carry over the ticks of every finding id that survives.

How to commit depends on where the branch is checked out (`git worktree list --porcelain`):

- **In this worktree:** copy `$RUN/comment.md` to the path, `git add` that one file and commit.
- **In another worktree:** stop and say so. Moving a ref under someone's checkout leaves their index describing a deleted file.
- **Nowhere:** commit without a checkout, on a throwaway index, and move the ref only if it has not moved:

```bash
P=<dir>/OPENVAA-PLAN-REVIEW.md; export GIT_INDEX_FILE=$RUN/index
git read-tree $HEAD_SHA && git update-index --add --cacheinfo 100644,$(git hash-object -w $RUN/comment.md),"$P"
C=$(git commit-tree $(git write-tree) -p $HEAD_SHA -m "docs[planning]: plan review of <what was reviewed>")
unset GIT_INDEX_FILE; git update-ref "refs/heads/$BRANCH" $C $HEAD_SHA
```

Either way, check the commit is non-empty (`git rev-parse $C^{tree}` differs from `$HEAD_SHA^{tree}`). Commit the review alone, never with other planning or code changes. Do not push: report the commit and the path, and that the review reaches a teammate only once the branch is pushed.

### P7. Report

Report the comment URL or the committed path, which plans were reviewed and why those, findings per lens, and how many the verifier refuted. Plan reviews are not harvested by `learn`.

## Fix mode

`/openvaa-review fix <PR#>` (or `--fix`) carries out the decisions the reviewer recorded in the posted review (the ticks, and every word they added) and fixes every other review comment still open on the PR. It edits the PR's own branch (or, for a stack slice, the stack's source branch), so it is the author's command, not the reviewer's. Everything is fixed by default; the run ends by squashing the fixes into the feature commits (step 9).

**Hard decisions** stop the run in every mode, `--auto` included, and go to the operator with `AskUserQuestion`:

- a `decision`-block finding nobody ticked, and any finding the reviewer ticked `Discuss`;
- two options ticked on one finding (`conflict`);
- a contradiction between two decisions (step 3), and a review comment two fixes could satisfy incompatibly or that contradicts a reviewer's decision;
- a test failure whose fix needs a product decision (step 8), and the re-evaluation loop cap (step 7);
- the PR merged or closed, or the branch moved under the run (step 10).

**Without `--auto`** the run also stops for the soft ones: the operator confirms the wave plan (step 5), and chooses for a re-evaluation finding a reviewer could reasonably fix by one of its `alternatives` (step 7). **With `--auto`** the wave plan is shown without waiting, a re-evaluation finding takes its recommended option, and the report lists every choice taken that way.

### 1. Read the decisions

```bash
N=<pr>; REPO=$(git remote get-url origin | sed -E 's#.*github\.com[:/]##; s#\.git$##')
REPO_ROOT=$(git rev-parse --show-toplevel); SKILL_DIR=$REPO_ROOT/.claude/skills/openvaa-review
RUN=${TMPDIR:-/tmp}/openvaa-review/fix-$N; mkdir -p $RUN
python3 $SKILL_DIR/scripts/parse_decisions.py --pr $N --repo $REPO --out $RUN/decisions.json
```

Each finding resolves to one of:

- `fix`: an option is ticked, or nothing is, which means the recommended one;
- `discuss`: `Discuss` is ticked, or the finding is in the decisions block and nothing is ticked (`undecided: true`);
- `skip`;
- `conflict`: two options are ticked.

**Stop on any `conflict`** and ask which the reviewer meant; never guess between two ticked options. The script also warns when it parsed fewer findings than the data block lists, which means a continuation comment is missing. Re-read before fixing a partial set.

**The ticks are not the whole decision.** Reviewers edit option text, append reasons to a label, type notes under a finding and reply elsewhere on the PR, and all of it binds. The script carries it into `decisions.json`:

| Field | Holds |
| --- | --- |
| `choice` | The chosen option's full text, every continuation line included, with the reviewer's edits |
| `custom` | The chosen option was written or edited by the reviewer (its fingerprint is not in the data block's `opts`) |
| `edited_options` | Every fix option the reviewer wrote or edited, ticked or not |
| `notes` | Prose typed under the options, and anything after a `Discuss` / `Don't fix` label |
| `mentions` | Other PR comments, review bodies and inline review comments naming the finding's id |
| `feedback_note` | Text after "not a real issue" in the reviewer-feedback block |

`needs_reading` lists every finding carrying any of these, and `unlinked_comments` lists the human comments posted since the review that name no id. **Read all of them before step 2,** and decide what each does to the decision:

- **A constraint** ("separate commit", "keep the old key until the seed templates move") travels with the fix: pass it to the agent as part of the decision.
- **A contradiction, a question or a reopened finding** turns it into `discuss`, even if an option is ticked.
- **An `edited_options` entry on an unticked option, with no tick anywhere,** means the reviewer rewrote an option and forgot to tick it: treat it as `discuss`.
- **An unlinked comment** that clearly refers to a finding is attached to it. One that does not becomes a review comment to fix, below.

Record the outcome in `decisions.json` (`decision`, `choice`, and the `notes` the agent must honour) before planning the waves.

**Every other open review comment is fixed too.** Fix mode carries out the whole review of the PR, not only the review comment's findings. `unlinked_comments` covers only comments posted after the review, so collect the open ones directly, whenever they were posted:

```bash
gh api --paginate repos/$REPO/pulls/$N/comments > $RUN/review-comments.json
gh api --paginate repos/$REPO/pulls/$N/reviews > $RUN/reviews.json
gh api --paginate repos/$REPO/issues/$N/comments > $RUN/issue-comments.json
```

From these, every comment that asks for a change to the PR and is still open is one **review comment** to fix:

- **an open review thread**, outdated or not (an outdated comment has a null `line` and keeps its `original_line`), read whole: a root comment plus every comment whose `in_reply_to_id` is its `id`. The REST routes do not say whether a thread is resolved, so judge it from the replies: a thread whose last reply settles it ("done", "never mind", the author's answer accepted) is not open, and one with no reply is;
- **a review body or an issue comment** from a person or a review bot that asks for a change and that nothing later on the PR answers.

These are not review comments: a comment carrying one of this skill's markers (`openvaa-review:v1`, `-cont`, `openvaa-plan-review:v1`, `openvaa-review-fixes:v1`), a bot status comment with nothing to change in it (changeset-bot, a CI summary, a review bot's overview that reports no issue), a question already answered, and a comment that names a finding id, which belongs to that finding.

Add each to `decisions.json` as a finding of its own: `id` `RC-<n>`, `source` (`thread` | `review` | `comment`), its `url`, `thread_id` (the root comment's `id`) for a thread, `path` and `line`, the comment text as `detail`, `decision: "fix"`, and as `choice` the concrete change that does what it asks, written the way a fix option is. A comment that overlaps a review finding is attached to that finding as a constraint rather than duplicated. A comment that is ambiguous, that two fixes could satisfy in incompatible ways, or that contradicts a reviewer's decision on a finding becomes `discuss` and goes to the user in step 2. Review comments then take part in steps 3–7 exactly like findings, and the re-evaluation checks each is fully done.

After the push in step 10, reply in each fixed thread with the commit that fixed it (`gh api repos/$REPO/pulls/$N/comments/<thread_id>/replies -f body=…`), and list the fixed review bodies and issue comments in the fixes comment. Do not resolve threads: resolving is the reviewer's call.

### 2. Settle the discussions first, before touching any code

Resolve every `discuss` finding with the user before the first agent runs, `--auto` or not, because its answer can change what the other fixes should do. Use `AskUserQuestion`, up to 4 findings per call. The question is the finding's title, the options are its own options plus "Don't fix", and the context you explain is the finding's detail plus the reviewer's notes and mentions. Write the answer back into `decisions.json`.

### 3. Check the decisions against each other

Every finding was written, verified and ticked on its own, so nothing so far has checked that the options chosen fit together. **A default counts as a choice:** a finding with nothing ticked carries its recommended option, and it is checked exactly like a ticked one.

Read every `fix` finding's `choice` and notes side by side, with its `files` and the symbols its option names. Compare every pair that shares a file, a symbol, a table, a message key, a setting or a behaviour, plus every `fix` whose option relies on a finding that resolved to `skip`. Look for:

- **Incompatible edits to the same code:** two options rewrite one component, context or migration in different shapes.
- **One option removes what another works on:** a fix deletes, renames, inlines or moves a symbol that another fix extends, calls or tests.
- **Opposite directions on one policy:** one narrows a grant, a type, a validation or a default that another widens.
- **One undoes another's effect.**
- **A dependency on a declined finding:** "using the method from PKG-2" while PKG-2 is `skip`.
- **A reviewer note on one finding that constrains another.**

Each pair resolves one of two ways:

- **Ordering only:** record the dependency, and step 5 turns it into wave order.
- **A real contradiction:** never pick one yourself. Ask with `AskUserQuestion` (up to 4 per call), naming both findings, why they collide, and which side is only a default. Offer "Apply A only", "Apply B only", and a reconciled route when one exists. Write the answer back.

Write `$RUN/conflicts.json` as `[{ "findings": ["CMP-2", "PKG-1"], "kind": "ordering | contradiction", "why": "…", "resolution": "…" }]`, empty when nothing collided. Say in one line how many pairs were checked. Do not start step 4 while any contradiction is open.

### 4. Prepare the branch

**Ordinary PR:**

```bash
BR=$(gh api repos/$REPO/pulls/$N -q .head.ref)   # a fork PR's head lives on the fork, not origin: stop and say so
git fetch -q origin "$BR" && git checkout -B "$BR" FETCH_HEAD && git branch -u "origin/$BR"
git status --porcelain   # must be empty: the fixes have to be separable from existing work
gh api repos/$REPO/pulls/$N -q .head.sha   # compare with `head` in decisions.json
FIX_BASE=$(git rev-parse HEAD)
```

**Review-stack slice** (`$RUN/stack.json` from step 1, or detect it again): never commit to the slice branch. Fixing inside the stack makes the byte-identity claim circular (`ship-review-stack` lesson 4). Instead:

1. Check out the stack's **source branch**. It must be in this worktree or nowhere (`git worktree list --porcelain`); if another worktree has it, stop and say so.
2. Check its tree equals the top slice's tree (`git rev-parse <source>^{tree}` vs `<top slice>^{tree}`). If they differ, the stack has drifted from its source: stop and ask.
3. Set `FIX_BASE` to the source branch's head.

The fixes then land on the source branch, and step 10 re-cuts the slices from it.

**Either way:** a moved head is not a blocker, but say so. If the working tree is dirty, stop and ask. Do not stash: the stash stack is shared with other worktrees.

### 5. Plan the waves

Group the `fix` findings so a wave can run in parallel without agents colliding:

- **Disjoint files.** Two findings whose files overlap go in the same group (one agent, sequential) or in different waves. Start from the `files` array in the data block, and widen it when an option names a file the evidence did not cite. A new message key touches every locale catalogue, and a schema change touches the generated types.
- **Dependencies decide the order, not severity.** A finding that adds a data-model method lands before the findings told to call it, and a rename before its call sites. Every `ordering` entry in `conflicts.json` is such a dependency. Within that constraint, run critical findings first.
- **Keep waves small.** Up to about 6 agents per wave, each with 1–4 related findings. Group by area, for example all the results-drawer component findings together.

Write the plan to `$RUN/waves.json` as `[{ "wave": 1, "groups": [{ "group": "results-drawer", "findings": ["CMP-2", "CMP-3"], "files": [...] }] }]`, and show it to the user. Without `--auto`, wait for their go-ahead; with it, start at once.

### 6. Run each wave

Spawn one agent per group, all in one message, using § Fix agent in `.claude/skills/openvaa-review/references/agent-briefs.md`. **Agents never run git writes,** because concurrent `git add` in one worktree races on the index. They also never touch the shared Supabase stack or run E2E.

After every wave, in the orchestrator, each command on its own line with its output redirected:

```bash
cd $REPO_ROOT
yarn lint:fix > $RUN/w-lint.log 2>&1; yarn format > $RUN/w-format.log 2>&1   # then check `git diff --stat` touches only this wave's files
yarn typecheck > $RUN/w-typecheck.log 2>&1; echo "TYPECHECK EXIT=$?"
```

**Commit the wave yourself, as fixups.** The checklist forbids a PR containing fixes of itself, so each finding's change is committed as a fixup of the PR commit that introduced the code it changes:

```bash
TARGET=$(git log --format=%H -1 $MB..HEAD -- <the finding's main file>)   # the latest PR commit touching it
git add <the finding's files> && git commit --fixup=$TARGET
```

- When no PR commit touched the file (a new file a fix creates, a catalogue entry), use the PR commit that introduced the feature, by subject.
- When nothing fits, use an ordinary commit following the repo's convention (`fix: <what>` with the package tag in brackets, `[db]` for database changes), and name it in the report. Step 9 still folds it into a feature commit when it fixes the PR's own code.
- Record each finding's commit in `$RUN/commits.json`.
- On a stack's source branch, apply the same rule within the source branch's own history.

Verify each commit is non-empty before moving on. A failed check is fixed or reverted within its wave, never carried into the next, where a later failure cannot be attributed.

### 7. Re-evaluate the fixed PR against the lenses

The waves checked that each fix compiles and passes its own tests, not that the PR still holds up. A fix can break a rule another lens owns (a reuse fix that drops an authority check), or apply its option only partly. So once the last wave is committed, review the PR again as it now stands, before anything is pushed:

```bash
FIX_HEAD=$(git rev-parse HEAD)
RE=$RUN/reeval; mkdir -p $RE
python3 $SKILL_DIR/scripts/triage_diff.py --base $MB --head $FIX_HEAD --out $RE
git diff $FIX_BASE $FIX_HEAD > $RE/fixes.diff
```

For a stack, `$MB` here is the merge target the stack was cut against, and the review covers the slice's pathspec at the fixed source tip. There is no `--expect-files`, because GitHub's file list describes the PR before the fixes.

Then run review steps 3–5 on `$RE` with `HEAD_SHA=$FIX_HEAD`: the cartographer, the lens agents and the verifiers, over the **whole PR at the fixed tip**. The evidence format is `path#Lx-Ly`, since `$FIX_HEAD` is not pushed.

- Run at least every lens that owns an applied finding and every lens the cartographer picks.
- Every lens agent and verifier also gets § Re-evaluation preamble, `decisions.json`, `conflicts.json` and `fixes.diff`.
- Findings that resolved to `skip` are passed as calibration.
- Steps 6–8 (consolidating, composing, posting) do not run.

Each surviving finding carries an `origin`:

| `origin` | Means | Done with it |
| --- | --- | --- |
| `unresolved` | An applied finding whose chosen option is not fully in the code | Fixed in a remedial wave under its original id |
| `fix` | A problem the fix commits introduced | Fixed in a remedial wave |
| `pr` | A problem in PR code the fixes did not touch, missed by the first review | Fixed in a remedial wave, and named in the fixes comment as fixed without a reviewer's decision |

**Every surviving finding is fixed, whatever its origin and severity.** Surviving means the verifier returned `CONFIRMED` or `DOWNGRADED`; a `REFUTED` finding is dropped, and a duplicate is fixed once, under the finding the verifier keeps. Nothing a re-evaluation confirms is left as "reported only".

A remedial wave runs exactly like step 6, with the finding's `suggestion` (or the verifier's `revised_suggestion`) as its `apply`, committed as fixups. When a reviewer could reasonably prefer one of its `alternatives`, ask the user before running it, unless `--auto` is given; a re-evaluation finding with `needs_decision` is a hard decision and is asked either way.

Then loop until a re-check comes back clean:

1. Re-run the lenses whose files the remedial wave touched, over the remedial diff only (`git diff <commit before the wave> <commit after it>`), with § Re-evaluation preamble.
2. Verify their findings with a verifier, as in step 5. A re-check finding is never fixed unverified.
3. Fix every surviving one in the next remedial wave, and go back to 1.

The loop ends when a re-check has no surviving finding. A round can only look at the previous round's diff, so each round is smaller than the one before. If a third remedial round still produces surviving findings, stop and show them to the user: findings that keep coming back mean the fixes are fighting each other, and that is a decision, not another wave.

Write `$RE/outcome.json` as `[{ "id", "lens", "origin", "severity", "title", "round", "status": "fixed | blocking", "commit" }]`. A finding is `blocking` only when the user stopped it or the loop cap was reached; a blocking one stops the push in step 10.

### 8. Gate the whole codebase

CI checks the whole repository, so the gates do too. Each runs on its own line with its output redirected, never piped:

```bash
cd $REPO_ROOT
yarn lint:check > $RUN/lint.log 2>&1; echo "LINT EXIT=$?"
yarn format:check > $RUN/format.log 2>&1; echo "FORMAT EXIT=$?"
yarn build > $RUN/build.log 2>&1; echo "BUILD EXIT=$?"
yarn typecheck > $RUN/typecheck.log 2>&1; echo "TYPECHECK EXIT=$?"
yarn db:status > $RUN/db-status.log 2>&1 || yarn db:start > $RUN/db-start.log 2>&1   # the unit gate needs the stack
yarn test:unit > $RUN/unit.log 2>&1; echo "UNIT EXIT=$?"
```

**More gates when the fixes reach these areas:**

- **Any source:** `yarn lint:check` above already chains most `assert:*` scripts, `assert:comment-hygiene` among them. Run every other `assert:*` and `check:*` script in the root `package.json` that the fixed paths could reach, each by name with its exit status read. Then run the planning-reference scan of `/openvaa-pr` step 4 over `git diff -U0 $MB...HEAD`, and fix every hit inside a comment.
- **The database:** `yarn db:reset`, `yarn db:lint:sql`, `yarn db:types` (then check `git diff --stat packages/supabase-types` is what you expect), `yarn assert:schema-migration-parity`, `yarn check:schema-equivalence`, and the pgTAP suite (`supabase test db` from `apps/supabase`).
- **The Edge Functions:** `deno check .` from `apps/supabase/supabase/functions`.

The shared stack is free to use (standing authorisation), but say that `db:reset` ran.

**Targeted E2E** (CLAUDE.md § E2E Hard Rule; one run per project, since the wrapper keeps only its last `--project`). Cover every project whose spec or fixture the fixes changed, and every project whose tests drive a route or helper the fixes changed:

```bash
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/review-fix-$N-<project> --no-db-reset --project <project>; echo "E2E <project> EXIT=$?"
```

How to read each run:

- **Exit 8 (void, host suspended):** not evidence. Run again under a new `--run-dir`.
- **Exit 9:** the shared stack could not be restored. Report it.
- **Red, or a "did not run" test:** a failure. It blocks the push under every rule.
- **Before reading a red run's logs:** check that the edge runtime is up (`docker ps`) and check `pmset -g log` for sleep.

Read the unit log's summary line as well as its exit status: a log with no test count means the suite never ran, which is not a pass.

**Lint and format.** What `lint:fix` and `format` change was committed with each wave. Anything left is committed as a fixup of the PR's own `style: lint and format` commit when it has one, and otherwise as `style: lint and format`; never folded into a finding's commit. When it touches files outside the PR, say so in the PR comment.

**Failing tests.** Every failing test is fixed, whoever broke it:

1. Rerun each failing unit file on its own. One that passes alone but fails in the suite has an isolation problem, which is still a failure to fix.
2. Attribute it with `git diff --stat $FIX_BASE HEAD`:
   - **broken by a fix:** fix the code for a real regression, or update the test, citing the finding, when a decision deliberately changed the behaviour;
   - **broken by the PR itself:** fix it in its own commit, and name it in the PR comment;
   - **unrelated:** fix it in its own commit, and flag it as pre-existing, or as unclear when the cause is unclear.

Unit failures are grouped by test file and fixed in parallel with § Test fix agent. E2E failures are fixed one at a time by the orchestrator, because they share one stack and one dev server. Diagnose the root cause: the E2E Hard Rule allows no retries, skips or raised timeouts.

A test is never deleted, skipped, given `.only`, or loosened to pass. A failure whose fix needs a product decision goes to the user. Commit test fixes as fixups of the commit that introduced the tested code, and re-run the whole block until every line exits 0, or until a failure only the user can decide is left. That one blocks the push. Record the gated tip: `GATED=$(git rev-parse HEAD)`.

### 9. Squash the fixes into the feature commits

The PR must show only its final outcome, as `/openvaa-pr` step 6 requires: no commit of the PR fixes another commit of the PR. Fold everything the run committed:

1. Every fixup from steps 6–8 folds into its target.
2. An ordinary `fix:` commit the run made because nothing fitted (step 6) is re-targeted when it fixes the PR's own code: amend it into a fixup of the feature commit it belongs to, by subject. It stays its own commit only when it changes what the PR did not introduce (a pre-existing test failure, a file outside the PR), and the report says why.
3. A `style: lint and format` commit stays separate from code, as the checklist asks, but there is only one: fold a second into the first.

```bash
git rebase --autosquash $MB   # git ≥ 2.44 honours --autosquash without -i
git diff $GATED HEAD          # must be empty: squashing moves changes between commits, never changes the tree
for c in $(git rev-list $MB..HEAD); do [ "$(git rev-parse $c^{tree})" = "$(git rev-parse $c~1^{tree})" ] && echo "EMPTY: $c"; done
git log --oneline $MB..HEAD   # the PR's commits, with no fixup! left and no fix-of-itself subject
```

A non-empty diff or an empty commit is a squash error: redo the step from `$GATED`, never re-gate a changed tree as if it were the same. Because the tree is identical to the gated one, the gates need not run again. On a stack's source branch the same rule applies within the source branch's own history.

### 10. Push and comment

Push once step 7 has no blocking finding left, every gate in step 8 passes and step 9 left the tree unchanged, without asking. The squash rewrote the PR's history at your request, so this is a force-push with lease (the user's standing rule). A gate still failing means no push: say which, and leave the commits local. Re-read the PR first, because it can be merged while the fixes run:

```bash
read STATE PR_HEAD <<< "$(gh api repos/$REPO/pulls/$N -q '(if .merged then "MERGED" else (.state|ascii_upcase) end)+" "+.head.sha')"
[ "$STATE" = OPEN ] || echo "PR IS $STATE: do not push"
[ "$PR_HEAD" = "$FIX_BASE" ] || echo "BRANCH MOVED: do not push"
for c in $(git rev-list $MB..HEAD); do
  [ "$(git rev-parse $c^{tree})" = "$(git rev-parse $c~1^{tree})" ] && echo "EMPTY: $c"
done
BR=$(gh api repos/$REPO/pulls/$N -q .head.ref)
git push --force-with-lease="$BR:$FIX_BASE" origin HEAD:"$BR"
```

Any of those lines firing stops the push:

- **The PR is merged or closed.** Keep the commits local and ask whether they belong in a new PR.
- **The branch moved.** Someone pushed in the meantime. Never force past it: say what arrived and ask.
- **An empty commit.** Rebuild it before pushing.

Report the old tip (`$FIX_BASE`) and the new one after the push.

**Review-stack slice.** The fixes are on the source branch. Re-cut instead of pushing one branch:

1. Rebuild the touched slice and every slice above it with `ship-review-stack`'s `.claude/skills/ship-review-stack/sources/build-slice.sh`, from its partition file, bottom-up.
2. Prove the stack with `verify-identity.sh` (top slice vs the fixed source), `verify-commit-taxonomy.sh` over the stack range, and `slice-overlap-matrix.sh`. Any red stops the push.
3. Force-push the re-cut slices bottom-up, each with `--force-with-lease=<slice branch>:<its old sha>`, against the named list of re-cut slices only. Verify each remote ref equals its local tip.
4. Report every slice's old and new tip, and which slices' own patch changed (hash `parent..self`) versus only their parent.
5. Push the source branch itself last, with its own lease.

A PR above a re-cut slice gets a one-line note that its base moved; its review comment is not edited.

**After the push,** post a short comment on each PR whose content changed, without asking. Open it with `<!-- openvaa-review-fixes:v1 -->`: `parse_decisions.py` skips that marker, where any other comment naming a finding id would come back as a reviewer's mention on the next fix run. It is a comment of its own, never an edit of the review, whose ticks are the reviewer's record. It covers:

- the new tip;
- what was applied, with the commit each finding was folded into, and each other review comment fixed (`RC-<n>`), linked to its thread or comment;
- what was declined and by whom, and what is blocked;
- the conflicts from step 3 and how each was settled;
- the re-evaluation findings, every round, each with the commit it was fixed in, marking the `pr`-origin ones as fixed without a reviewer's decision;
- the test failures fixed, and which predated the fixes;
- files outside the PR that lint or format touched;
- which gates and E2E projects ran, with their run directories.

Nothing pushed means no comment.

### 11. Report

Show a table of every finding: applied (with its commit), skipped (with who decided), and blocked (with why). Below it, add:

- the conflicts from step 3;
- the re-evaluation findings from `$RE/outcome.json`;
- the test failures fixed, with their attribution;
- each E2E project's result and run directory;
- the commits before and after the squash;
- with `--auto`, every choice the run took without asking.

Give the pushed tips, or why nothing was pushed. Report gate results honestly, including anything still failing. Do not update the PR description unless asked.

### Plan reviews

`/openvaa-review fix --plan <branch or PR#>` applies a plan review to the **plan documents**. No code is written. The steps above hold, with these differences:

1. **Decisions come from the PR comment, or from the committed file when there is no PR or `--local` was given.** Resolve the target as in plan-mode step P1, then:

   ```bash
   python3 $SKILL_DIR/scripts/parse_decisions.py --plan --pr $N --repo $REPO --out $RUN/decisions.json                       # the branch has a PR
   python3 $SKILL_DIR/scripts/parse_decisions.py --plan --from-files <path>/OPENVAA-PLAN-REVIEW.md --out $RUN/decisions.json   # it does not
   ```

   Find the file with `git ls-tree -r --name-only $HEAD_SHA | grep OPENVAA-PLAN-REVIEW.md`; more than one is a question for the operator. Exit status 2 on the first form means the PR carries no plan review, so look for the file before giving up. Parse the file from the working tree after step 3's checkout, so uncommitted ticks still count, and say when they were uncommitted.
2. Discussions are settled first, and the decisions checked against each other, as in steps 2 and 3. Two plan fixes conflict when they move the same task, decision or requirement in different directions.
3. Check out the branch. An uncommitted edit to the review file itself is the reviewer's ticks, not a dirty tree: commit it first, on its own, as `docs[planning]: record plan-review decisions`.
4. **Waves group by plan file.** Only the plan paths (`plans` in the data block) are edited. Several findings on one plan go to one agent.
5. Use § Plan fix agent. Instead of typecheck and lint, check after each wave that every edited plan still has intact frontmatter and task structure, and that `git diff --stat` touches plan documents only. Commit as `docs[planning]: <what changed in the plan> (review <ID>)`. Planning commits are not squashed here: `.planning/` ships in its own record, and its history is the record.
6. Re-evaluate as in step 7, with the plan-mode pipeline (P2–P3, then P4 with § Plan-mode preamble and § Re-evaluation preamble) over the edited plans. Steps 8 and 9 do not run: no code changed, and planning commits are not squashed.
7. Push (a plain push, since nothing was rewritten) when the branch has a PR or is already on the remote, and comment when it has a PR. A branch that has never been pushed stays local; say so in the report.
8. In the report, list any fix that contradicts a decision recorded in the context files: the operator decides which one moves. With a committed review file, offer to append an `## Applied` section in its own commit; never rewrite the ticks.

## Files

- `.claude/skills/openvaa-review/scripts/triage_diff.py`: noise filter, lens hints and the effective-line count in `size.json` (step 2). Its counter is tested by `.claude/skills/openvaa-review/scripts/tests/` (`python3 -m unittest discover -s .claude/skills/openvaa-review/scripts/tests`).
- `.claude/skills/openvaa-review/scripts/compose_comment.py`: assembles the comment(s) from the run dir (step 7).
- `.claude/skills/openvaa-review/scripts/parse_decisions.py`: reads a posted review's ticks back as per-finding decisions (fix-mode step 1).
- `.claude/skills/openvaa-review/scripts/harvest.py`: gathers past review data blocks and reviewer feedback for `learn`.
- `.claude/skills/openvaa-review/references/global-principles.md`: the principles every lens applies, severity, and lens ownership.
- `.claude/skills/openvaa-review/references/lenses/*.md`: one per lens, covering when it applies, what to list, what to evaluate, where to look and where to promote. `.claude/skills/openvaa-review/references/lenses/plan.md` is used in `--plan` mode only.
- `.claude/skills/openvaa-review/references/agent-briefs.md`: the writing style, plus the prompts and JSON shapes for every agent.
- `.claude/skills/openvaa-review/references/comment-template.md`: the PR comment layout and data block.
- `.claude/skills/openvaa-review/references/calibration.md`: accumulated "not a finding" notes per lens, written by `learn`.
- `.claude/skills/openvaa-review/references/learning-loop.md`: the `learn` procedure.

<!-- skill-link-allow: .planning/reviews/ -->
<!-- skill-link-allow: NN/NN -->
<!-- skill-link-allow: OPENVAA-PLAN-REVIEW.md -->
<!-- skill-link-allow: OpenVAA/voting-advice-application -->
<!-- skill-link-allow: comment-2.md -->
<!-- skill-link-allow: comment-3.md -->
<!-- skill-link-allow: comment.md -->
<!-- skill-link-allow: conflicts.json -->
<!-- skill-link-allow: decisions.json -->
<!-- skill-link-allow: fixes.diff -->
<!-- skill-link-allow: map.md -->
<!-- skill-link-allow: parent..self -->
<!-- skill-link-allow: pr.json -->
<!-- skill-link-allow: review.diff -->
<!-- skill-link-allow: size.json -->
<!-- skill-link-allow: summary.txt -->
<!-- skill-link-allow: tests.diff -->
<!-- skill-link-allow: translations.diff -->
<!-- skill-link-allow: stack.json -->
