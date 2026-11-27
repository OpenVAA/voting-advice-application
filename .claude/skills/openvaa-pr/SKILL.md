---
name: openvaa-pr
description: >-
  Take an ordinary OpenVAA feature branch to a review-ready pull request in one pass: rebase on its base, lint
  and format, apply .agents/code-review-checklist.md, prune tests that served only the work, run the comment
  hygiene, build, typecheck, unit and assert gates plus targeted E2E for the affected projects, fold
  fix-of-itself commits with the fixup workflow and the [db]/[package] commit tags, check the docs site and
  skills, push, open a draft PR, post mobile and desktop screenshots of visible UI changes, and finish with
  /openvaa-review. Use for "finalize this PR", "make this PR-ready", "clean up and push", "ship this branch",
  "open the PR", "prep this for review". NOT for a long-lived branch too large to review as one PR: that
  routes to ship-review-stack, and this skill stops and says so.
targets:
  - .agents
  - tests/scripts
  - apps/docs/src/routes
---

# OpenVAA PR

Prepares the current branch for review: rebase, clean-up, gates, commit hygiene, documentation, push, PR, screenshots, and the human-review brief. Work through the steps in order. A step that produces changes commits them before the next step starts.

Read every gate's exit status directly, never through a pipe. The repository has several remotes and `gh` has no default set, so pass `--repo $REPO` to every `gh` call:

```bash
REPO=$(git remote get-url origin | sed -E 's#.*github\.com[:/]##; s#\.git$##')   # the upstream OpenVAA repo
BR=$(git branch --show-current)
```

## 0. Decide the base, and whether this is a one-PR branch

The base is not always `main`: work here often targets an integration branch. Find it in this order:

1. the existing PR's `baseRefName`;
2. the branch's upstream tracking config;
3. the user's word.

If none of those names it, ask. Then:

```bash
BASE=<base>; git fetch -q origin "$BASE"
git diff --name-only origin/$BASE...HEAD > /tmp/openvaa-pr-files.txt; wc -l < /tmp/openvaa-pr-files.txt
git rev-list --count origin/$BASE..HEAD
```

**More than ~300 changed files or ~150 commits** means the branch is too large to review as one PR. Stop and route to `Skill("ship-review-stack")`, saying why. Everything below would only make one unreadable PR. The exception is a branch whose bulk is one mechanical change (a rename, a catalogue import): say so and ask.

## 1. Rebase onto the base

```bash
git log --oneline origin/$BASE..HEAD   # only this branch's work?
git rebase origin/$BASE
```

**Conflicts.** For each one, read both sides' history (`git log --oneline -- <file>`, `git log -1 --format=%s <commit>`). If the resolution is obvious from history, resolve it. If the intent is ambiguous, **stop and ask**; do not guess.

Re-run `git log --oneline origin/$BASE..HEAD` afterwards.

## 2. Lint and format

```bash
yarn lint:fix > /tmp/openvaa-pr-lint.log 2>&1; echo "LINT-FIX EXIT=$?"
yarn format > /tmp/openvaa-pr-format.log 2>&1; echo "FORMAT EXIT=$?"
```

Commit what they change on its own as `style: lint and format`. The checklist asks for formatting-only changes to be in their own commit.

## 3. Code review checklist

Read `.agents/code-review-checklist.md`. Review every changed file (`git diff --name-only origin/$BASE...HEAD`) against every item of the general list. Then add the sections that apply:

- **§ Supabase Backend** when `apps/supabase/` changed;
- **§ Supabase Adapter** when `apps/frontend/src/lib/api/adapters/supabase/` changed;
- **§ Edge Functions** when `apps/supabase/supabase/functions/` changed.

Also check the CLAUDE.md invariants that the checklist only points at: § Context Destructuring Rule, § Results Navigation Invariants, and the `PUBLIC_PROJECT_ID` no-fallback rule. Fix violations, and commit the fixes grouped logically (one for accessibility, one for localization, …) with the repo's conventional prefixes.

These are the items most often missed:

- **New user-visible copy:** every catalogue under `apps/frontend/messages/` has it.
- **New user-facing functions:** they emit events from `apps/frontend/src/lib/analytics/events.schema.ts`, and any event revealing answers, results views or filters is in `SENSITIVE_EVENTS`.
- **New behaviour or settings:** they are described in the docs site, under `apps/docs/src/routes/(content)/`.

## 3a. Prune tests that served only this work

```bash
python3 .claude/skills/openvaa-pr/scripts/flag_prunable_tests.py --base origin/$BASE
```

Judge each flagged line against `tests/README.md`, because some flags are wrong. For each one, either:

- delete the test;
- rewrite it to execute the code;
- or, for a source guard protecting authority, project scoping, a runtime boundary or a reactivity invariant, mark it `// KEEP-GUARD: <the hazard>`.

Also look for what the script cannot see, such as a new spec whose cases belong in an existing spec of the same project. Report what you deleted and kept in the PR description.

## 4. Comment hygiene (blocking)

CLAUDE.md § Comment Hygiene governs every comment the PR adds or changes. The deterministic half is a gate:

```bash
yarn assert:comment-hygiene > /tmp/openvaa-pr-hygiene.log 2>&1; echo "HYGIENE EXIT=$?"
git diff -U0 origin/$BASE...HEAD -- apps packages tests \
  | perl -ne 'print if /^\+(?!\+)/ && /(\.planning\/|\bD-\d{2}\b|(?<!see )\b(phase|spike)\s+\d+|\b\d{2,3}-\d{2}-(PLAN|SUMMARY)\b)/i' \
  > /tmp/openvaa-pr-planrefs.txt; wc -l < /tmp/openvaa-pr-planrefs.txt
```

The first is a gate: fix every line it lists. The second lists every added line carrying a planning reference beyond the bare `see phase N` / `see spike N` form. Read each one: a hit in a comment is fixed, while a hit in a runtime string, a test title or a version number is left alone. (`ship-review-stack`'s `hygiene-grep-report.sh` scans the whole tree rather than the diff and is red on pre-existing rows, so it is not this skill's gate.)

The other half can only be caught by reading. Read every added or changed comment in `git diff origin/$BASE...HEAD` for:

- historical narrative ("previously", "was changed to", "after the refactor");
- notes addressed to the reviewer, unless tagged `[PR review]`;
- comments that only restate the code.

Fix them in place, without rewording a runtime string, a test title or a lint message that merely matched the pattern. Commit as `style: tidy comments per the comment hygiene rule`.

## 5. Gates

Run each on its own line with its output redirected:

```bash
yarn build > /tmp/openvaa-pr-build.log 2>&1; echo "BUILD EXIT=$?"
yarn typecheck > /tmp/openvaa-pr-typecheck.log 2>&1; echo "TYPECHECK EXIT=$?"
yarn lint:check > /tmp/openvaa-pr-lintcheck.log 2>&1; echo "LINT EXIT=$?"
yarn format:check > /tmp/openvaa-pr-formatcheck.log 2>&1; echo "FORMAT-CHECK EXIT=$?"
yarn db:status > /dev/null 2>&1 || yarn db:start > /tmp/openvaa-pr-dbstart.log 2>&1   # the unit gate needs the stack
yarn test:unit > /tmp/openvaa-pr-unit.log 2>&1; echo "UNIT EXIT=$?"
```

Then:

- **The source guards:** `yarn lint:check` already chains most `assert:*` scripts. Run every other `assert:*` and `check:*` script in the root `package.json` that the branch's paths could reach, each by name with its exit status read. To list the unchained ones, compare the `assert:` names with the `lint:check` line.
- **When the database changed:** `yarn db:reset`, `yarn db:types` (commit regenerated types with the schema change), `yarn db:lint:sql`, `yarn assert:schema-migration-parity`, `yarn check:schema-equivalence`, and the pgTAP suite from `apps/supabase`.
- **When the Edge Functions changed:** `deno check .` from `apps/supabase/supabase/functions`.

Read the unit log's summary line: no test count means the suite never ran.

**Targeted E2E** (CLAUDE.md § E2E Hard Rule). Cover every Playwright project whose spec or fixture the branch changed, and every project whose tests drive a route or helper the branch changed. Make one run per project, since the wrapper keeps only its last `--project`:

```bash
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/pr-<branch-slug>-<project> --no-db-reset --project <project>; echo "E2E <project> EXIT=$?"
```

How to read each run:

- **Exit 8 is void:** run again under a new `--run-dir`.
- **Red or "did not run":** blocks the PR. Diagnose the root cause; no retries, skips or raised timeouts.
- **Before diagnosing a red run:** check that the edge runtime is up and `pmset -g log` for host sleep.

Record each project's test count against the last full run. The full suite stays the phase or release gate, not this skill's, unless the user asks for it.

Fix failures in fixup commits (step 6) and re-run the gate that failed.

## 6. Commit hygiene

The goal is a history that shows only the final outcome, following the commit guidelines in `apps/docs/src/routes/(content)/developers-guide/contributing/contribute/+page.md`:

- **Conventional prefixes:** `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `test:`, `chore:`, `build:`.
- **Package tags:** a commit touching a package other than the frontend carries the package name in brackets (`refactor[data]: …`, with `q-info` and `arg-cond` as the short forms). A commit containing migrations or other database changes carries `[db]` (`fix[db]: …`).
- **Subjects:** at most 50 characters where possible, no trailing period. Bodies are wrapped at 72 columns and explain what and why, never how.
- **No fixes of itself.** A later commit fixing an earlier commit of the same PR is folded into it. Make such fixes as `git commit --fixup=<target>` and fold them non-interactively:

  ```bash
  git rebase --autosquash origin/$BASE   # git ≥ 2.44
  git diff <tip before the squash> HEAD   # must be empty: squashing moves changes between commits, never changes the tree
  ```

- **Separate concerns.** Split commits that bundle unrelated changes (a migration and a UI change). Keep formatting-only changes in their own commit.
- **Planning records** (`.planning/`) go in one `docs[planning]:` commit, separate from code, docs and tests (checklist § Shipping a Large Branch).

When unsure about a squash or split, prefer fewer commits with clear messages. Check that no commit is empty:

```bash
for c in $(git rev-list origin/$BASE..HEAD); do [ "$(git rev-parse $c^{tree})" = "$(git rev-parse $c~1^{tree})" ] && echo "EMPTY: $c"; done
```

## 7. Documentation and skills

Check whether the branch's changes require updates to any of these, and commit each update separately (`docs: …`):

- **The documentation site,** `apps/docs/src/routes/(content)/`:
  - the developers' guide, for architecture, packages, the backend and contributing;
  - the publishers' guide, for settings, features, the admin app and deployment.

  Every new setting appears in the publishers' guide.
- **Package READMEs** and the `README.md` files under `apps/frontend/src/lib/`.
- **`CLAUDE.md` and the project skills** in `.claude/skills/`. Read each skill's description to see if the change is in its domain. A skill whose `targets:` cover a changed directory is checked with `bash .claude/scripts/audit-skill-drift.sh <skill>`, and its links with `bash .claude/scripts/audit-skill-links.sh <skill>`.
- **`.agents/code-review-checklist.md`,** when the work surfaced a convention every PR should follow.

## 8. Push

The rebase and autosquash rewrote history at your request, so push with lease and report the old and new tips:

```bash
OLD=$(git rev-parse -q --verify "refs/remotes/<remote>/$BR")
git push --force-with-lease="$BR:$OLD" <remote> HEAD:"$BR"   # with no upstream yet: git push -u <remote> HEAD
```

The remote is the one the PR's head lives on: the user's fork for an upstream contribution, `origin` for a branch on the upstream repo. Ask when it is not obvious.

## 9. Create or update the PR

```bash
gh pr view "$BR" --repo $REPO > /dev/null 2>&1 && echo "PR exists"
```

If no PR exists, create a draft against `$BASE`. It stays a draft through review, and `gh pr ready` is the last step before merging:

```bash
gh pr create --repo $REPO --draft --base "$BASE" --head "<owner>:$BR" --title "<concise title>" --body "$(cat <<'EOF'
## Summary
<bullets: what and why, for a reader who has not seen the branch>

## Test plan
- <unit, pgTAP and E2E projects run, with their results and run directories>

## Notes
<tests pruned or kept, docs updated, anything a reviewer should know>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If the PR exists, check that its title and body still describe the branch after the rebase, and update them with `gh pr edit` if needed. Creating a PR on the upstream repository is outward-facing: when the user has not asked for the PR in this session, confirm before creating it.

## 10. Screenshots of UI changes

Reviewers should see a UI change without checking the branch out. Voters mostly use phones, so every changed screen is shot at **mobile 390×844** and **desktop 1440×900**, each captioned with what changed. The dark theme is added where colours changed.

### 10a. Decide whether the PR touches UI

```bash
git diff --name-only origin/$BASE...HEAD \
  | grep -E '^apps/frontend/src/(routes/.*\.svelte$|lib/(components|dynamic-components|contestant/components|admin/components|layouts)/.*\.(svelte|css)$|app\.css$)' \
  | grep -vE '\.test\.'
```

Catalogue-only changes are deliberately not matched. If this prints nothing, or every match is a change no one can see (a renamed prop, a type, a refactor with identical output), **skip the rest of step 10**, with one line in the report.

Otherwise read the diffs and list the concrete visible changes: a new button, a changed layout, a new empty state, reworded copy in a component, a new modal or drawer. That list is the shot list. Each entry needs both widths, and a dark-theme entry where it applies.

### 10b. Map each change to a route and state

A file under `apps/frontend/src/routes/` maps to its route directly. A component needs its importers traced up to a `+page.svelte`. Note the state needed to make the change visible:

- the election and constituency selected;
- the answers given;
- the results tab open;
- a drawer or modal open;
- a signed-in contestant or admin.

### 10c. Capture

Use the dev server already serving **this checkout** on the frontend port (5173 unless `FRONTEND_PORT` says otherwise), or start one with `yarn dev` in the background and wait for it.

- **Data.** The default project needs data. If it has none, seed it with `yarn db:reset-with-data`, but only when no E2E run is in flight (`pgrep -f e2e-run.sh` prints nothing). Resetting under a running suite destroys its state.
- **Voter screens** need no sign-in.
- **Contestant and admin screens** need an account. Reuse the E2E suite's own auth fixtures and helpers under `tests/tests/fixtures/{contestant,admin}` and `tests/tests/helpers`, in a throwaway Playwright script run from `tests/`. Do not invent credentials.

Write the PNGs to the scratchpad: one per change per width, cropped to the changed region with `locator.screenshot()` when the change is small, and full-viewport when the layout changed. Name each `NN-<change>-mobile.png` / `NN-<change>-desktop.png` (`-dark` suffixed where needed). Reuse the names on a re-run so the comment's links keep working.

Look at every screenshot before posting it. A spinner, an error page, a sign-in screen or an empty state that is not the change means the capture failed.

### 10d. Upload and post

Images go on an orphan branch `pr-screenshots` on the **user's fork remote** (never the upstream repo), under `pr-<PR#>/`, and are linked raw. The repos are public, so the links render for everyone. Use plumbing, so neither the working tree nor commit hooks are touched:

```bash
PR=$(gh pr view "$BR" --repo $REPO --json number -q .number); FORK=<fork remote>; DIR=<scratchpad screenshot dir>
FORK_REPO=$(git remote get-url $FORK | sed -E 's#.*github\.com[:/]##; s#\.git$##')
git fetch $FORK +pr-screenshots:refs/remotes/$FORK/pr-screenshots 2>/dev/null
PARENT=$(git rev-parse -q --verify refs/remotes/$FORK/pr-screenshots)
export GIT_INDEX_FILE=$(mktemp -t openvaa-pr-shots.XXXXXX); rm -f "$GIT_INDEX_FILE"
[ -n "$PARENT" ] && git read-tree "$PARENT"
for f in "$DIR"/*.png; do
  git update-index --add --cacheinfo 100644,$(git hash-object -w "$f"),"pr-$PR/$(basename "$f")"
done
TREE=$(git write-tree); unset GIT_INDEX_FILE
if [ -n "$PARENT" ]; then COMMIT=$(git commit-tree "$TREE" -p "$PARENT" -m "screenshots for #$PR")
else COMMIT=$(git commit-tree "$TREE" -m "screenshots for #$PR"); fi
git push $FORK "${COMMIT}:refs/heads/pr-screenshots"   # braces stop zsh reading `:r` as a modifier
```

Post ONE comment. On a re-run, edit the previous one, found by its `## UI screenshots` heading, with `gh api -X PATCH repos/$REPO/issues/comments/<id> -F body=@<file>`:

```markdown
## UI screenshots

**<What changed, in one sentence a reviewer can check against the image>** — `<route>`

| Mobile | Desktop |
| --- | --- |
| ![<caption>, mobile](https://github.com/<FORK_REPO>/blob/pr-screenshots/pr-<PR#>/01-<change>-mobile.png?raw=true) | ![<caption>, desktop](https://github.com/<FORK_REPO>/blob/pr-screenshots/pr-<PR#>/01-<change>-desktop.png?raw=true) |
```

The caption says **what changed** on that screen ("The results drawer now shows the match score beside each candidate's name"), not what the screen is ("Results drawer"). Write it from the diff, then confirm the image actually shows it.

### 10e. When screenshots cannot be taken

The capture can fail: the app does not start, sign-in through the fixtures fails, the route needs data the local database lacks, or a capture keeps coming back wrong after a second attempt. Then do not post partial or misleading images, and do not block the rest of the skill. Tell the operator plainly that **they should take the screenshots themselves**, and give them the shot list: each change, its route, the state to put it in, both widths, and the caption.

## 11. Report

Print a short summary:

- the base, and the commits before and after the rebase and squash;
- what the checklist and the comment-hygiene pass fixed;
- every gate with its result, and each E2E project with its result, test count and run directory;
- tests pruned or kept;
- docs and skills updated;
- the old and new pushed tips;
- screenshots: posted (with the comment URL and the shot count), not needed, or **not taken — the operator must take them** (with the shot list);
- the PR URL.

## 12. Human-review brief

Unless the PR is trivial (docs only, a one-file fix, or a dependency bump with no code), finish by running `/openvaa-review <PR#>`. It posts a thematic brief that walks the non-author reviewer through the change, its findings in three comments: decisions needed, critical, and fixed by default. If it finds critical items, fix them (`/openvaa-review fix <PR#>`, or `--auto` to be asked only the hard decisions) and re-run it before requesting review. The re-run updates the same comments.
