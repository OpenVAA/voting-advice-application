---
phase: 151-ship-v0-2-akita-review-stack
plan: 10
subsystem: release-engineering
tags: [git-stack, pull-requests, publishing-gate, ci-forensics, operator-decision]
status: complete

requires:
  - phase: 151-05
    provides: "the operator-approved twelve-slice partition, slices.tsv, and the slice table whose PR column this plan fills"
  - phase: 151-09
    provides: "the three cut local branches, the yarn-install standing instruction, and the sweep evidence both PR bodies cite"
provides:
  - "the stack's first two branches on origin: ship/v0.2-akita-01a-layout-move (602b79351) and -01b-strapi-removal (4a7c85934), remote SHAs asserted equal to local"
  - "PR #863 (base main) and PR #864 (base ship/v0.2-akita-01a-layout-move), both OPEN"
  - "pr-bodies/01a.md and 01b.md — the self-contained body shape every later slice copies"
  - "the measured refutation of research Pitfall 7: skill-drift-check does not exist in the workflow the stack PRs fire"
  - "the measured CI failure signature for stack states 01a..09: step `Setup Yarn 4.6`, error YN0028, 412 packages dropped"
  - "the operator's Task 1 (accept-reviews) and Task 2 (repurpose-at-151-18) decisions, recorded verbatim in the manifest"
  - "F-18 — packages/app-shared/README.md:25 cites apps/strapi/, a path that never existed; same class as F-16"
affects:
  - "plan 151-11 (owns PR 3; should fix F-18 and re-cut slice 02 BEFORE opening it, while that is still cheap)"
  - "plans 151-11..151-17 (copy the PR-body shape; must name `Setup Yarn 4.6`, never research's skill-drift-check)"
  - "plan 151-18 (executes the #860 repurpose; the fast-forward and zero-human-reviews corrections are recorded for it)"

actuals:
  tokens: 8677
  tasks: 4
  commits: 3

tech-stack:
  added: []
  patterns:
    - "re-run the push dry-run immediately before the real push, and assert remote SHA == local SHA before any PR is created — a wrong base silently reparents the stack"
    - "verify a PR body's CI claim against the job's step list and log after opening, not against the research that predicted it"
    - "assert the file trailer before splicing a section into a record, so a mismatched anchor fails loudly instead of appending in the wrong place"

key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/pr-bodies/01a.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/pr-bodies/01b.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-10-SUMMARY.md
  modified:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md

key-decisions:
  - "Task 3 was executed before the Task 1/2 checkpoints, inverting the plan's task order, because the publishing gate directs the executor to prepare everything and then stop. No outward-facing action was involved and no push preceded consent."
  - "Research Pitfall 7 was NOT written into the public PR body. skill-drift-check does not exist in main.yaml at 01a's tip; naming it would have been a public error in PR #1."
  - "Both PRs were opened ready-for-review rather than draft: draft does not suppress the Copilot review (review_draft_pull_requests: true) and the stack exists to be reviewed by humans."
  - "The disposition link in each body is accompanied by inlined substance, because .planning/ ships in slice 11 and the link cannot resolve until 151-17 pushes it."
  - "F-18 was recorded and routed rather than fixed: fixing it means re-cutting slice 02, which is out of a publishing plan's scope and is 151-11's to do before it opens PR 3."

patterns-established:
  - "A correct prediction of a mechanism is not a correct prediction of its observable signature — the YN0028 cause was right and the failing step was wrong, and only the step is what a reviewer sees"
  - "Grep a removed technology's name with a word boundary: case-insensitive `strapi` matches every `bootstrap*` identifier in the tree"

requirements-completed: [criterion-6]

metrics:
  duration: ~50m
  completed: 2026-08-17
---

# Phase 151 Plan 10: Publish the Bottom of the Stack Summary

**The phase's first outward-facing action: two branches and two pull requests on a public repository, opened only after explicit operator consent — and the CI red they produce turned out to be red for a reason neither the research nor this plan's own first draft had stated correctly.**

## What was built

| Task | Outcome | Commit |
|---|---|---|
| 1 | Publishing consent — operator selected **`accept-reviews`** | operator decision, no file delta |
| 2 | PR #860 disposition — operator selected **`repurpose`**, executed at 151-18 | recorded in manifest |
| 3 | `pr-bodies/01a.md` + `01b.md`, 22/22 acceptance checks | `1db5b238e` |
| 4 | Pushed 01a and 01b; opened PR **#863** and PR **#864**; records updated | `8da7ab913` |

| | |
|---|---|
| **PR #863** | https://github.com/OpenVAA/voting-advice-application/pull/863 — base `main`, head `ship/v0.2-akita-01a-layout-move` @ `602b79351` |
| **PR #864** | https://github.com/OpenVAA/voting-advice-application/pull/864 — base `ship/v0.2-akita-01a-layout-move`, head `ship/v0.2-akita-01b-strapi-removal` @ `4a7c85934` |

Every acceptance criterion was asserted rather than assumed: remote SHA equals local SHA on both
branches; `baseRefName` is `main` on #863 and `ship/v0.2-akita-01a-layout-move` on #864; `headRefOid`
matches the local tip on both; `gh pr list --head ship/v0.2-akita-02-shared-packages` returns **0**, so
D-07's one-slice lag held; `git ls-remote --heads origin 'ship/*'` returns exactly **2** refs;
`origin/main` is unmoved at `ac30f132a`; and PR **#860 was not touched**.

**GitHub independently confirmed slice 01a's central claim.** The API reports `files=1316, +0, -0` with
**1,316 `renamed` entries** — the zero-line rename PR renders exactly as the body promises. That is the
strongest form of the check available, because it is GitHub's own rendering rather than a local
`git show`.

## The gate held

The push dry-run was re-run immediately before the real push and reported `[new branch]` for both refs
— no force, no fallback to an existing ref. Before consent, the only outward-facing calls made were
read-only (`gh pr view 860`, `gh api .../rulesets`, `git ls-remote`, and `git push --dry-run`, which
creates nothing). The first mutating call happened after the operator's answer arrived.

One transient tool-classifier denial interrupted the push; the identical command succeeded on retry,
and the post-push verification confirms exactly two refs on the remote, so nothing was double-applied.

## Task 4's real finding: the CI red is red for a different reason than anyone wrote down

Two separate wrong-as-written claims were caught here, one inherited and one this plan's own.

**1. Research Pitfall 7 is wrong, and it was kept out of the public body.** It states PR #1 fails
`skill-drift-check` on a missing `.claude/scripts/audit-skill-drift.sh`. Measured: `main.yaml` at 01a's
tip is **byte-identical** to `origin/main`'s (blob `c2fdcedb2`) and defines only
`frontend-and-shared-module-validation`, `backend-validation` and `e2e-tests`. `skill-drift-check`
exists only in the branch-tip `main.yaml`, which arrives with slice 10 at the *top* of the stack. Had
the research been copied, PR #1 would have publicly named a CI job that never runs. This is the
**fifth** plan-encoded claim in this phase to be wrong as written.

**2. This plan's own first draft named the wrong step — caught only by reading the job after opening
the PR.** `pr-bodies/01a.md` initially attributed the failure to the `Install all dependencies` step.
The observed failure is at **`Setup Yarn 4.6`** (step 3 in two jobs, step 4 in `e2e-tests`), because
`threeal/setup-yarn-action@v2` performs the dependency install itself as part of its caching. The
workflow's own, more obviously named install step is reported `skipped` and never runs — as are every
lint, format, type-check, test and build step after it.

The **mechanism** was predicted correctly. The observable signature was not, and the signature is the
only part a reviewer sees. Verbatim from run `32017478048`:

```
YN0085: │ - @adobe/css-tools@npm:4.4.1, @alloc/quick-lru@npm:5.2.0, @capacitor/android@npm:5.7.8,
          @capacitor/cli@npm:5.7.8, @capacitor/core@npm:5.7.8, and 407 more.
##[error]The lockfile would have been modified by this install, which is explicitly forbidden. (YN0028)
```

Those 412 dropped packages are the dependency closure of the two workspaces 01a moved out from under
the paths the root `package.json` still names — the D-11-by-design staleness, now confirmed end to end
rather than argued. Both PR bodies were corrected on GitHub before this record was written, and the
correction is recorded in `151-STACK-MANIFEST.md` where 151-11 … 151-17 will read it.

**Final CI state on #863:** 3 fail (`frontend-and-shared-module-validation`, `backend-validation`,
`e2e-tests`) / 3 pass (`Analyze (javascript-typescript)`, `Analyze (actions)`, `CodeQL`). **PR #864
fired no checks at all**, exactly as its body predicts — `main.yaml`'s `pull_request` trigger is
`branches: [main]`, and #864's base is a sibling branch.

## The operator's decisions

- **Task 1 — `accept-reviews`.** Ruleset 8477541 is left **active and untouched**. Recorded so no later
  plan re-litigates it. Measured refinement that informed the choice: `review_on_push: false`, so
  Copilot reviews **once per PR at open**, bounding the stack's cost at ~12 one-shot reviews rather than
  continuous re-review. Also accepted: `.github/workflows/claude.yml` fires on
  `pull_request_review: [submitted]`, so each Copilot review triggers a `route` job that gates on the
  author's repo permission, resolves the Copilot bot to `none`, and no-ops — ~12 harmless runs.
- **Task 2 — `repurpose`, recorded only.** #860 becomes the stack's umbrella entry point at **151-18**.
  Nothing was executed against it here. Two measured corrections to the plan's own option text decided
  it: updating #860's head is a **fast-forward, not a force-push** (`97f55cb41` is a strict ancestor of
  the local tip — 1,655 ahead, 0 behind), so it does not fall under the phase's force-push prohibition
  at all; and #860 carries **zero human reviews** (two reviews, both bots), so `close`'s stated cost of
  "losing review history" was overstated to the point of being misleading.

## Deviations from Plan

### 1. [Deliberate reordering] Task 3 was executed before the Task 1 and Task 2 checkpoints

**Issue:** the plan orders the two blocking checkpoints first and the PR-body task third. The
publishing gate governing this execution directs the executor to prepare everything — branches, PR
bodies, dry-run verification, exact commands — and *then* stop at the checkpoint.
**Resolution:** Task 3 was completed and committed first. It is a purely local documentation task with
no outward-facing effect, and doing it first meant the checkpoint could present finished bodies rather
than a promise of them. No push or PR preceded consent.

### 2. [Rule 1 — Bug] `pr-bodies/01a.md` named the wrong failing CI step, and it was already public

**Found during:** Task 4, verifying the PR's checks after opening.
**Issue:** the body attributed the failure to `Install all dependencies`; that step is `skipped`. The
real failure is `Setup Yarn 4.6`.
**Fix:** both bodies corrected and re-pushed with `gh pr edit --body-file`, naming the correct step,
explaining why the obviously named step never runs, and quoting `YN0028` verbatim. The hedged "either
fails to resolve or resolves a different set" was replaced with what the run actually shows. The
correction is also recorded in the manifest for later plans.
**Commit:** `8da7ab913`.

### 3. [Rule 2 — Missing critical content] Disposition links cannot resolve when the PRs open

**Issue:** the acceptance criteria require each body to link its slice's `151-DISPOSITION.md` rows, but
`.planning/` ships in slice 11 at the top of the stack, so any such link 404s until 151-17 pushes it.
**Fix:** each body carries the repo-relative path, the verbatim section heading, a URL that resolves
once `ship/v0.2-akita-11-planning` exists with an explicit note saying so, **and the substance inlined**
— the deferrals, findings and measurements a reviewer needs, so no planning artifact is required.

### 4. [Recorded discrepancy] "nine slices" vs. ten branches

151-09 recorded that stack states "01a through 09" cannot `yarn install` and called it nine slices.
Enumerated, the affected branches are 01a, 01b, 02, 03, 04, 05, 06, 07, 08 and 09 — **ten**. Both PR
bodies and the manifest say ten.

## New finding

**F-18 — `packages/app-shared/README.md:25` cites `apps/strapi/`, a path that has never existed.**
Measured: `git ls-tree` returns 0 entries for `apps/strapi` at both `ac30f132a` and the branch tip; the
retired backend was at `backend/vaa-strapi/`. **Same class as F-16** (the `.prettierignore` block
ignoring `apps/strapi/**`), which makes it a pattern rather than a one-off: v0.2 rewrote references to
the dead backend using a path it never had.

**Routed to 151-11, deliberately not fixed here.** The file is in slice 02's diff. Fixing it means
landing the fix on `feat-gsd-roadmap` per D-04 and re-cutting slice 02 — cheap **now**, while slice 02
is cut but its PR is unopened, and expensive once 151-11 opens PR 3, when it would need a force-push to
a PR already under review.

Recorded beside it so nobody re-raises it: the two other `strapi` matches in the shipped tree are not
findings. `packages/dev-seed/src/generators/AccountsGenerator.ts:46,50` is a **false positive** — the
match is inside the identifier `bootstrapId`. Slice 01b's item-2 `MET` verdict therefore stands.

## Gates

This plan changed **no source code** — only `.planning/` documents, which `.prettierignore` excludes
(`.planning/` is listed there) and which no build, lint or test task reads. The four-gate baseline is
therefore untouched by construction rather than by re-measurement: `build` 14/14, `test:unit` 1522/149
files, `lint:check` 0 errors / 20 warnings, `format:check` red on exactly the two PD-03-fenced files.

**Noted, not actioned:** the push output carried a GitHub Dependabot notice of 305 vulnerabilities on
the repository's **default branch** (25 critical, 111 high, 134 moderate, 35 low). That is a property of
`origin/main`, pre-existing and unrelated to this stack. Recorded here because it is the kind of signal
that should not scroll past unread; it belongs to the project, not to this phase.

## Known Stubs

None. No stub, placeholder, skipped test or unrun `<verify>` was introduced. Both `<verify>` blocks in
the plan were run: Task 3's ran green (and its one initial failure was a defect in the check's own grep
pattern, spanning a line wrap — the file was correct), and Task 4's `baseRefName` assertion returned
`main` as required.

## Deferred Issues

| ID | Routed to | Why not fixed here |
|---|---|---|
| **F-18** | **151-11** | Not this plan's slice; the fix requires re-cutting slice 02, which 151-11 should do before opening PR 3 |
| PR #860 repurpose | **151-18** | The operator's decision is recorded; execution waits until the whole stack exists and can be linked from it |

## Notes for the next plans

- **151-11 owns PR 3.** Fix **F-18** and re-cut slice 02 *before* opening it. After that, a fix costs a
  force-push to a PR under review.
- **Never copy research's Pitfall 7 into a PR body.** The stack PRs fire `origin/main`'s `main.yaml`,
  which has no `skill-drift-check`. The correct failure signature is **`Setup Yarn 4.6` / `YN0028`**.
- **The PR-body shape is set** by `pr-bodies/01a.md` and `01b.md`: stack contract first, stated
  self-contained; then position, base, counts, a plain description, the rendering caveat, and the
  disposition link *with its substance inlined*, because that link cannot resolve until 151-17.
- **Six plan-encoded claims in this phase have now been wrong as written** (151-07's codemod balance,
  151-08's frontmatter collision, 151-09's `"DR"` verify, research's Pitfall 7, the plan's #860
  force-push framing, and this plan's own install-step attribution). The pattern is worth carrying into
  **151-19**: an internally consistent artifact is not evidence, and the failure is disproportionately
  in the *observable signature* rather than the underlying reasoning.

## Self-Check: PASSED

| Claim | Check | Result |
|---|---|---|
| `pr-bodies/01a.md`, `01b.md` created | `[ -f … ]` | both FOUND |
| `151-10-SUMMARY.md` created | `[ -f … ]` | FOUND |
| Commits `1db5b238e`, `8da7ab913` | `git log --oneline --all \| grep -q` | both FOUND |
| Branches on `origin` | `git ls-remote --heads origin 'ship/*'` | 2 refs, SHAs equal to local |
| PRs open with correct bases | `gh pr view --json baseRefName` | #863 `main`, #864 `ship/v0.2-akita-01a-layout-move` |
| PR 02 not opened | `gh pr list --head … --jq length` | 0 |
| `origin/main` unmoved | `git ls-remote origin refs/heads/main` | `ac30f132a` |
| PR #860 untouched | `gh pr view 860` | OPEN, base `main`, head `97f55cb41`, title unchanged |

---

*Phase: 151-ship-v0-2-akita-review-stack · Plan 10 · completed 2026-08-17*
