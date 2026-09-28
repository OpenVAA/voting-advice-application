# Phase 151: Ship v0.2 Akita — Review Stack & Commit-History Restructure - Research

**Researched:** 2026-08-16
**Domain:** Git history reconstruction, plumbing-level tree surgery, stacked PRs on GitHub, comment-hygiene codemods, review-checklist sweep design
**Confidence:** HIGH for the git mechanics (proven end-to-end in this repo this session); MEDIUM for GitHub rendering behaviour; MEDIUM for sweep fan-out sizing

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Baseline, branches & worktrees**

- **D-01:** The backup worktree pins the **pre-sweep tip `94be73a61`** as the immutable reiterative-history record satisfying criterion 5. `feat-gsd-roadmap` itself keeps advancing with sweep fixes, and criterion 7's byte-identity is proven against its **post-sweep** tip. Backup = history, branch = truth. Backup lives as a sibling worktree (e.g. `voting-advice-application-gsd-backup`). — **Reversibility:** costly — once slices are cut from a moving branch, re-pinning the baseline means re-cutting every slice and force-pushing any opened PR.
- **D-02:** Stack branches are named `ship/v0.2-akita-NN-<slice>` — numbered so stack order is legible in the branch list and greppable.
- **D-03:** `feat-v02-akita-continued` is **frozen out of the stack**. The stack is cut from `feat-gsd-roadmap`'s post-sweep tip and never picks up continuation work; sweep fixes are NOT propagated to it during this phase. Keeps the byte-identity proof stable against a moving target.

**Fix-vs-defer & ordering**

- **D-04:** Sweep fixes land **on the original branch first**, before the affected slice is cut. Only then is the slice built from the fixed tip. Byte-identity is then trivially true and tree-hash-provable. — **Reversibility:** one-way — the alternative (fixing inside the stack and redefining the baseline) makes the byte-identity claim circular; switching after slices are open requires rebuilding the stack.
- **D-05:** Fix bar is **"anything a reviewer would block on"** — security + correctness, plus duplication, undocumented public entities, missing repo-doc updates, and style-guide violations. Below that bar, findings are recorded with a rationale and deferred.
- **D-06:** The sweep runs **per-PR-slice at slice-build time** — no separate full-diff sweep pass. Sweep and split share one traversal of the diff, and the disposition record is organised per-slice, which is also how a reviewer reads it.
- **D-07:** Slices are cut and swept **strictly bottom-up**, and a PR opens only once the slice *above* it has also been swept. This keeps any cross-slice fix cheap while the owning slice is still unopened, so criterion 4 ("the PR contains no fixes of itself") holds without force-pushing PRs already under review. Cost: a one-slice lag in early visibility.
- **D-08:** PRs open **incrementally as slices finalise** (behind the D-07 frontier), not all at once at the end.

**PR-stack split**

- **D-09:** Split axis is **two-segment**: the 35-commit pre-v2.4 prefix splits **chronologically** (it already is — monorepo refresh → Svelte 5 infra → content → candidate app → Supabase → auth); the 891-file post-v2.4 tail splits **by subsystem** (frontend, tests, supabase, dev-seed, packages, docs). Matches how the work accumulated and minimises same-file overlap in the tail.
- **D-10:** Target stack size **8–12 PRs**.
- **D-11:** **PR #1 is rename-only** — pure moves for `frontend/`→`apps/frontend/` and the Strapi `backend/` removal, so paths change and contents don't and the diff renders as renames rather than 622 delete/add pairs. Content changes to those files land in later PRs as ordinary edits. Requires reconstructing a pure-rename commit the original history does not contain (git already detects 857 renames across the net diff, so the raw material is there). — **Reversibility:** costly — PR #1 is the base of the entire stack; changing its shape rebases everything.
- **D-12:** `.planning/` + `.claude/` (2,246 files, +853,932 lines) ship as **their own PR at the top of the stack** — approvable without reading, and out of every other PR's diff.

**Comment hygiene**

- **D-13:** Sweep scope is **refs + pruning comments the code makes redundant**. No code restructuring — Addendum rule 4's "rename/restructure so the comment isn't needed" is explicitly NOT exercised, to avoid behaviour-adjacent changes late against the cardinal E2E rule.
- **D-14:** Surviving references **collapse to the bare `see phase N` / `see spike N` form**. Stripped: artifact paths (`.planning/...`), section anchors (`§9`, `§Pitfall 7`), plan numbers (`Plan 88-02`), `D-NNN-NN` decision IDs, and `v2.NN` milestone tags. Verifiable by grep.
- **D-15:** `CLAUDE.md`, `.agents/` and `.claude/` are **exempt** — agent-facing planning infrastructure, not shipped source. They ride in the top-of-stack planning PR with citations intact. Hygiene applies only to `apps/`, `packages/` and `tests/`.
- **D-16:** Verdict authority is **codemod for the mechanical part, agents for the residue**. The scripted pass handles what's deterministic (strip paths, anchors, plan numbers, decision IDs, milestone tags), leaving a smaller judgement set for agents working file-by-file against a written rule. Codemod output is greppable proof.

**Checklist sweep & disposition record**

- **D-17:** Disposition is recorded in a **phase artifact — one row per checklist item × slice**, each cell carrying a verdict (met / fixed / deferred) and its evidence. Single auditable view that satisfies criterion 1 literally; rides in the top-of-stack planning PR.
- **D-18:** For items with existing automated coverage, **cite the gate but first verify its reach against the slice**. Concretely: `assertAxeScan` reaches 7 voter routes × 2 themes, so the candidate app and admin surfaces are NOT covered by it and must be dispositioned separately. Never launder a blind spot as "met".
- **D-19:** Sweep fan-out is **one agent per checklist item, within a slice** — each agent holds one lens and applies it consistently across that slice's files (the Addendum's own suggestion).
- **D-20:** For items that cannot be exhaustively proven over the diff: **exhaustive on reachable surfaces, declared elsewhere.** Security exhaustive over every auth, RLS, Edge Function, adapter and input-handling path in the diff; a11y exhaustive over routes/components whose markup changed. Anything outside those sets is recorded as **not-swept with the reason**, so the record never overclaims.

**Stack mechanics, CI & proof**

- **D-21:** **Rebase onto current `origin/main`** (`ac30f132a`) so PR #1 targets a base it's current with. Consequence: the stack tip includes `ac30f132a`'s content, so criterion 7's byte-identity target is `feat-gsd-roadmap` **merged with `origin/main`**, not the branch tip alone. State it that way in the proof.
- **D-22:** The rebase hits a rename/delete conflict: `ac30f132a` modifies `docs/src/routes/+page.svelte` and adds `docs/static/images/youthvotes-logo.png`, both of which this branch moved to `apps/docs/`. Resolution: **move the files to their logical new location** — port the 11-line front-page change into `apps/docs/src/routes/+page.svelte` and the logo into `apps/docs/static/images/`. Nothing from main is lost. This content is produced by no v0.2 commit, so it gets its own commit and its own line in the disposition record.
- **D-23:** Byte-identity is demonstrated by **two independent checks**: `git diff <branch> <stack-tip>` returning empty, AND `git rev-parse <branch>^{tree}` equal to the stack tip's tree hash. Both one-liners, both recorded in the phase artifact, both reproducible by the user.
- **D-24:** The trusted green signal is the **full suite run against the post-sweep branch tip**, recorded in the phase artifact as the stack's collective proof — matching "only the whole matters" and honouring the cardinal rule at the level where it is meaningful. Per-PR CI is not the gate. **Note for the planner:** `main.yaml` triggers on `pull_request` with `branches: [main]`, so PR #1 will fire CI automatically whether or not it is the gate, while the stacked PRs (targeting sibling branches) fire nothing. PR #1 is the rename-only slice and will likely be red in isolation — annotate the PR explaining that only the whole stack is expected to pass. Do not treat that red as a phase blocker.

**Codification**

- **D-25:** The ship procedure **is codified as a skill, written last**, drafted from what the sweeps and the split actually taught rather than from the Addendum's prose. Not drafted incrementally.

### Claude's Discretion

- Exact slice boundaries within the two segments, subject to D-09/D-10 and criterion 6 (minimise PRs touching the same files; each PR one reviewing viewpoint).
- The written rule the hygiene agents apply to the codemod residue (D-16), and what counts as a comment "the code makes redundant" (D-13).
- Mechanics of reconstructing the pure-rename commit for PR #1 (D-11).
- Whether the disposition matrix is one file or one per slice, so long as a single canonical view exists (D-17).

### Deferred Ideas (OUT OF SCOPE)

- **Propagating sweep fixes to `feat-v02-akita-continued`** — considered and rejected for this phase (D-03). The parallel session will need to absorb them after the stack is reviewed; worth an explicit follow-up so it doesn't keep building on code already agreed to be defective.
- **Gray areas surfaced but not opened** (offered at the exit gate, user chose to proceed):
  - What happens if a sweep finding requires a code fix that breaks the E2E suite — the fix bar (D-05) says fix it, the cardinal rule says the suite must be green. The planner should define the escape hatch.
  - Precise ordering of criterion 4.1 (planning → one commit) against 4.2 (other docs → one commit) given 1,425 docs commits, most of them `.planning/` churn.
  - Whether the `[db]` tag is applied retroactively to historical commits or only to the restructured ones.
- **Reviewed Todos (not folded):** `2026-03-28-generalize-candidate-app-to-party-app.md`, `2026-06-03-after-runes-update-check-stale-app-header-styling-banner-ima.md`, `2026-06-06-disable-hover-and-pointer-on-disabled-results-header-button.md`, `2026-06-15-fix-view-transition-flicker-in-results-section.md`. If any surface as checklist findings during a slice sweep, they are dispositioned there rather than folded into scope here.

</user_constraints>

## Summary

The single most important finding is that **the entire stack-construction problem is solved by index-level tree surgery, and I proved it end-to-end in this repo this session.** A pure-rename PR #1 and a nine-commit path-partitioned stack were built from `ac30f132a`, and the resulting tip's tree hash is **bit-for-bit identical** to the merged target (`git diff` returns 0 files). Total wall time: seconds. No `git rebase`, no conflict resolution, no `git mv` replay, no third-party stacking tool. The mechanism is two primitives — `git ls-tree -r -z` → `git update-index -z --index-info` for the rename commit, and `git diff --raw -z --abbrev=40 --no-renames <parent> <target> -- <pathspec>` → `git update-index -z --index-info` for each slice — followed by `git write-tree` + `git commit-tree`. Criterion 7 stops being something you *verify after the fact* and becomes something the construction *guarantees*, with a catch-all final slice as the tripwire.

The second finding rewrites two of CONTEXT's premises. `b2d6a24c7` ("feat(v1.1): Monorepo Refresh") is **not** a deletion commit — it is already 97.4% a pure-rename commit (1,534 of 1,575 renames are R100, only 4 deletions). It moved `backend/` → `apps/strapi/`, and the actual Strapi removal happened in a **third** commit CONTEXT does not name: `13a453097` ("feat(v2.0): Branch Integration"), 262 file deletions. Second: the D-22 "rename/delete conflict" **does not require manual resolution**. `git merge-tree --write-tree HEAD origin/main` produces a tree whose `apps/docs/src/routes/+page.svelte` auto-merges both changes with zero conflict markers, and whose directory-rename detection *already* places the logo at `apps/docs/static/images/youthvotes-logo.png` — exactly the resolution D-22 prescribes, obtained for free. The merged target differs from `HEAD` by precisely 2 files / 11 lines.

The third finding is that the hygiene surface is roughly **1.75× larger than CONTEXT measured**: 358 files with 1,984 planning-reference occurrences across `apps/`, `packages/`, `tests/` (CONTEXT: ~204 files / ~789 refs). The gap is almost entirely the bare `D-NN` decision-ID form (e.g. `D-07`, `D-04`) — 725 occurrences across 183 files, pervasive in `packages/dev-seed` and `apps/frontend/src/lib` — which D-14's `D-NNN-NN` pattern does not match. 91% of matched lines are comment-shaped; the ~126 that are not include runtime `console.warn` strings, `it(...)`/`describe(...)` test titles, and an ESLint rule `message`, which is precisely the D-16 agent-residue set.

**Primary recommendation:** Build the stack with the two plumbing primitives proven in § Code Examples, with a catch-all final slice asserted empty; materialise the merge target once via `git merge-tree` and commit it onto `feat-gsd-roadmap` *before* cutting anything, so byte-identity is against a single ref rather than a described construction; run the hygiene codemod against the corrected 358-file / 1,984-occurrence inventory (not CONTEXT's snapshot); and re-measure `assertAxeScan`'s reach at execution time rather than trusting D-18's snapshot, because Phases 147–148 are scheduled to close that exact gap before 151 runs.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Pure-rename commit reconstruction (D-11) | Git object database (plumbing) | — | Content is unchanged by definition; only the path→blob mapping moves. Belongs in the index, not the worktree. |
| Slice construction (D-04/D-07/D-09) | Git index (`update-index --index-info`) | — | Each slice is "make the index under pathspec P equal the target's". A worktree-level operation would risk filter/CRLF/`.gitattributes` round-trips. |
| Merge-target materialisation (D-21/D-22) | Git merge machinery (`merge-ort`) | Manual review of the 2-file delta | Directory-rename detection already produces the prescribed answer; a human only confirms it. |
| Byte-identity proof (D-23) | Git tree hashing | — | A tree hash is a Merkle root over the whole tree; equality is total, not sampled. |
| Comment hygiene mechanical pass (D-14/D-16) | Node script over `git ls-files -z` | ESLint/Prettier for post-edit shape | Repo-native tooling; no new dependency, NUL-safe, and diffable. |
| Comment hygiene residue (D-16) | Sub-agents, file-by-file | — | Judgement, not pattern-matching: string literals, runtime messages, test titles. |
| Checklist sweep fan-out (D-19) | Sub-agents, one lens per item per slice | Existing CI gates cited as evidence | Each checklist item is a different reading of the same files. |
| PR creation & stacking (D-02/D-08) | `gh pr create --base <sibling>` | — | No stacking tool needed; the branches are already correct by construction. |
| Green-signal gate (D-24) | Full E2E suite on the post-sweep branch tip | Per-PR CI (informational only) | Only PR #1 fires CI at all; the rest target sibling branches. |

## Standard Stack

### Core

| Tool | Version (measured) | Purpose | Why Standard |
|------|--------------------|---------|--------------|
| `git` | 2.50.1 (Apple Git-155) `[VERIFIED: git --version]` | All history reconstruction, via plumbing | `update-index --index-info` and `commit-tree` are the only primitives that let you author a tree without a worktree round-trip. Present, no install. |
| `git merge-tree --write-tree` | requires git ≥ 2.38; have 2.50.1 `[VERIFIED: ran successfully]` | Materialise the branch↔main merge target without touching the worktree | Non-destructive; returns the merged tree OID on stdout and conflict notices on the following lines. |
| `gh` | 2.87.3 (2026-02-23) `[VERIFIED: gh --version]` | PR creation and stack wiring | Authenticated as `kaljarv` with scopes `gist, project, read:org, repo, workflow`. Admin on `OpenVAA/voting-advice-application`. |
| `python3` | system | NUL-safe stream transforms between git plumbing commands | One tracked path contains a space (see Pitfall 2); `awk`/`cut` on whitespace is unsafe. |
| Node (repo-native) | 22.22.1 in CI | Comment-hygiene codemod | No new dependency; the repo already carries two precedent codemods (`apps/frontend/scripts/*-codemod.mjs`). |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `git worktree add --detach <path> 94be73a61` | Backup worktree for D-01 | Once, before any history work. Seven worktrees already exist; an eighth is routine here. |
| `yarn lint:check` | Machine-checkable half of checklist items 3, 4, 8 | Cite as evidence in the D-17 disposition matrix. Runs `turbo run lint` + `eslint tests` + `tsc -p tests/tsconfig.json --noEmit`. |
| `yarn format:check` | Prettier conformance (criterion 4.5's "purely formatting" class) | Before declaring the formatting-only commit complete. |
| `yarn test:e2e` | D-24's collective proof | Once, on the post-sweep branch tip. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Index-level slice construction | `git rebase -i` with reordering across 2,553 commits | Rejected. 2,553 commits with 891 files of real churn means hundreds of conflicts, and the byte-identity claim becomes a hope rather than a construction. Measured alternative completes in seconds with a structural guarantee. |
| Index-level slice construction | `git checkout <target> -- <pathspec>` onto a branch | Works for adds/modifies but **silently misses deletions** — `checkout -- P` will not remove an index entry under `P` that is absent from the target tree. The frontend slice alone has 164 such deletions `[VERIFIED: measured, § Slice Anatomy]`. Would break byte-identity. |
| Plumbing | Graphite `gt` / `ghstack` / `spr` / `git-branchless` | All solve *maintaining* a stack under rebase-churn. This stack is built once, never rebased (D-04 puts fixes on the branch *before* cutting), so the value they add is nil against the cost of a new tool + auth + org policy. `gh pr create --base` is sufficient. `[ASSUMED]` on their exact feature sets; the argument does not depend on it. |
| `git mv` replay in a worktree | for the rename commit | Would work (1,316 moves) but is orders of magnitude slower, dirties a worktree, and is subject to `.gitattributes` filters on round-trip. The `ls-tree`→`update-index` form is exact by construction. |
| `comby` / `sed` for hygiene | Node script | `sed` cannot express "collapse `Phase 88 Plan 88-02 §3` to `see phase 88`" as one safe transform, and is not NUL-safe over the space-containing path. `comby` is a new dependency for a job a 150-line Node script does with full control over comment-vs-string discrimination. |

**Installation:** None. Every tool is already present and measured in this session.

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** The recommended toolchain (`git`, `gh`, `python3`, repo-native Node) is entirely pre-existing and was version-verified by direct invocation this session. If the planner introduces a codemod dependency (not recommended — see Alternatives Considered), the gate must be run at that point.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Corrections to CONTEXT.md

CONTEXT's measured figures were taken at discussion time and several are wrong or incomplete. The planner must use these instead. **None of these invalidate a locked decision** — they change the numbers a plan is sized against, and in two cases they make the work *easier* than CONTEXT assumed.

| # | CONTEXT claim | Measured reality | Impact on planning |
|---|---------------|------------------|--------------------|
| C-1 | "The restructure deletions are concentrated in two commits — `b2d6a24c7` and `05b033266` account for every `frontend/` and `backend/` deletion" | **Wrong.** `b2d6a24c7` has 4 deletions total and is a *move* commit (1,575 R / 18 A / 4 D / 36 M). It moved `backend/` → `apps/strapi/` (260 renames). The Strapi *removal* is a third commit, **`13a453097`** ("feat(v2.0): Branch Integration"), 262 deletions under `apps/strapi/`. `[VERIFIED: git log --diff-filter=D --name-only 9e0399286..HEAD -- 'apps/strapi/'`] | Doesn't change D-11's shape — the recommended reconstruction derives the path map by *rule*, not by replaying those commits — but the planner must not write a task that says "extract the renames from b2d6a24c7 and 05b033266". |
| C-2 | "git already detects 857 renames across the net diff" | **908** with default settings, **1,135** with `diff.renameLimit=20000`. Of those, `frontend/` → `apps/frontend/` is **851**; `frontend/` → anywhere is **854**; `docs/` → `apps/docs/` is **271**. `[VERIFIED: git -c diff.renameLimit=20000 diff -M --name-status 9e0399286 HEAD]` | The default run emits `warning: exhaustive rename detection was skipped due to too many files. you may want to set your diff.renameLimit variable to at least 3633`. Every rename-sensitive command in the plan must carry `-c diff.renameLimit=20000` or the numbers silently shift. |
| C-3 | D-11 scopes PR #1 to `frontend/`→`apps/frontend/` + Strapi removal | The same monorepo refresh also moved **`docs/` → `apps/docs/` (271 files)**. Omitting it means those 271 files render as delete/add pairs in a later PR, which is exactly what D-11 exists to prevent. `[VERIFIED: rename breakdown by top-level dir]` | Extend PR #1's rule to `docs/**` → `apps/docs/**`. This is within "Mechanics of reconstructing the pure-rename commit" (Claude's Discretion), and it is *also* what makes D-22 resolve itself — see C-4. |
| C-4 | D-22: the rebase "hits a rename/delete conflict" requiring the operator's "move the files to their logical new location" resolution | **No manual resolution is needed.** `git -c merge.renameLimit=20000 merge-tree --write-tree --name-only HEAD origin/main` returns tree `ebc0cab9d…`; `apps/docs/src/routes/+page.svelte` auto-merges (both the branch's `role`/`aria-label` addition and main's 11-line YouthVotes block are present, **zero conflict markers**), and directory-rename detection places the logo at `apps/docs/static/images/youthvotes-logo.png`. The only output is an informational `CONFLICT (file location)` notice, and the file is *already* at the suggested location in the tree. `[VERIFIED: measured, tree ebc0cab9da116744a4b1254af21518fd40d0c1cb]` | D-22's *outcome* is preserved exactly. The *task* shrinks from "resolve a conflict" to "materialise the tree, eyeball the 2-file delta, commit it". Still gets its own commit and its own disposition line, per D-22. |
| C-5 | "601 `Phase NN` refs · 93 `D-NNN-NN` decision IDs · 39 spike refs · 36 `v2.NN` milestone refs · 20 literal `.planning/` paths" over ~204 files | **703 / 725 / 41 / 45 / 27** occurrences; **358 files** in the union, **1,984** total occurrences. The 8× blowout on decision IDs is the bare `D-NN` form (`D-07`, `D-04`, …) that `D-NNN-NN` does not match: 183 files carry it, 88 of them in `packages/dev-seed`. `[VERIFIED: git grep -I -l -P … -- apps/ packages/ tests/`] | D-14's stated pattern list must gain `\bD-\d{2}\b`. Sizing for the codemod + residue review goes from ~204 to 358 files. |
| C-6 | "Distribution: `apps/frontend/src` 123 files · `packages/dev-seed/src` 41 · `tests/` 36 · others ~4" | `apps/frontend` **160** · `packages/dev-seed` **100** · `tests/tests` **61** · `apps/supabase` **12** · `apps/docs` **8** · others 17. By extension: 251 `.ts`, 76 `.svelte`, 13 `.md`, 5 `.sh`, 5 `.mjs`, 4 `.sql`. `[VERIFIED: union file list, grouped]` | `.sql` and `.sh` files carry planning refs too — the codemod must handle `--` and `#` comment syntaxes, not just `//` and `/* */`. |
| C-7 | "**0** `[PR review]` tags — criterion 3's second clause is already satisfied" | **Confirmed.** 0 occurrences. Also 0 `svelte-warning: accepted` (the CLAUDE.md-mandated form is documented but never used), and **65** `TODO`/`FIXME`/`HACK`/`XXX` across 49 files. `[VERIFIED: git grep -P]` | Criterion 3 clause 2 is a no-op. The 65 TODO/FIXME are a *separate* disposition question the planner should raise explicitly rather than let a hygiene agent silently delete. |
| C-8 | D-18: `assertAxeScan` reaches 7 voter routes × 2 themes | **Confirmed exactly** — `AXE_ROUTES` declares 7 entries, each scanned in light and dark. `.planning/todos/pending/2026-08-12-candidate-app-axe-and-rawkey-blind.md` documents the candidate-app gap. **But** its frontmatter says `resolves_phase: 147`, and `.planning/ROADMAP.md` schedules Phase 147 ("Candidate-App Scan Reach") *before* Phase 151. `[VERIFIED: tests/tests/specs/a11y/a11y-smoke.spec.ts:1-60, 215-330; .planning/ROADMAP.md:267,521]` | **D-18's reach figure is a snapshot that Phases 147–148 are scheduled to invalidate before 151 executes.** The plan must contain a re-measurement task, not a hard-coded "7 routes". |
| C-9 | Commit-type spread "1425 docs, …, 2 revert" | 1,427 docs / 282 feat / 280 fix / 271 test / 133 refactor / 125 chore / 10 wip / 9 spike / 7 plan / 3 todo / 3 style / 2 revert / 1 roadmap / 1 ci / 1 bare `Revert "…"`. `[VERIFIED: git log --format='%s' 9e0399286..HEAD]` | Cosmetic. The `todo`, `roadmap`, `ci` types and the one unprefixed `Revert` are extra classes the restructure taxonomy must place. |
| C-10 | (not stated) | **PR #860 is already open on `origin`**, head `feat-gsd-roadmap`, base `main`, 3,959 changed files, +636,806/−109,195, title "feat: v1.2 Svelte 5 infrastructure migration (Phases 15-19)". `origin/feat-gsd-roadmap` is at `97f55cb41`; local is **1,603 commits ahead, 0 behind**. `[VERIFIED: gh pr view 860; git ls-remote]` | The reviewer will see a stale 3,959-file duplicate of the whole body of work alongside the new stack. The plan needs an explicit disposition for PR #860 (close with a pointer to the stack, or repurpose as the stack's tracking issue) — **and** a decision on whether pushing the post-sweep tip to `origin/feat-gsd-roadmap` (which would update #860 in place) is wanted. |

## Architecture Patterns

### System Architecture Diagram

```
                      ┌──────────────────────────────────────────────┐
                      │ origin/main  ac30f132a                       │
                      │ (base of the whole stack, D-21)              │
                      └───────────────────┬──────────────────────────┘
                                          │
   feat-gsd-roadmap 94be73a61 ────────────┼──────────► BACKUP WORKTREE (D-01, criterion 5)
        (pre-sweep tip)                   │            detached, never advances
             │                            │
             │  ┌─────────────────────────┴──────────────────────┐
             │  │ STEP 0  materialise the merge target           │
             │  │ git merge-tree --write-tree HEAD origin/main   │
             │  │   → tree T_merge  (+2 files vs HEAD: the       │
             │  │      YouthVotes block + logo, at apps/docs/)   │
             │  │ commit onto the branch  →  D-22 commit         │
             │  └─────────────────────────┬──────────────────────┘
             │                            │
             ▼                            ▼
  ┌──────────────────────┐   ┌─────────────────────────────────────┐
  │ SWEEP (D-04/06/07)   │   │ TARGET = feat-gsd-roadmap post-sweep │
  │ bottom-up, per slice │──►│ (already contains origin/main)       │
  │ fan-out: 1 agent per │   │  ← criterion 7's single ref          │
  │ checklist item (D-19)│   └───────────────┬─────────────────────┘
  │ fixes land HERE first│                   │
  └──────────┬───────────┘                   │
             │                               │
             │ hygiene codemod (D-14/16)     │
             │ + agent residue pass          │
             ▼                               │
     disposition matrix (D-17)               │
             │                               │
             │           ┌───────────────────┘
             │           │  index-level slice construction
             ▼           ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ STACK CONSTRUCTION  (all in a bare index; no worktree touched)  │
  │                                                                 │
  │  ac30f132a                                                      │
  │      │                                                          │
  │      ├─ C1  ls-tree(base) ─remap paths─► update-index           │
  │      │      → 1,316 R100 renames + 249 deletions, 0 A / 0 M     │
  │      │      [PR #1 — rename-only, D-11]                         │
  │      │                                                          │
  │      ├─ C2..Cn  for each slice:                                 │
  │      │      diff --raw -z --abbrev=40 --no-renames Cn-1 TARGET  │
  │      │        -- <pathspec>  ─► update-index --index-info       │
  │      │      → write-tree → commit-tree                          │
  │      │                                                          │
  │      └─ C_catchall  same, pathspec = "."                        │
  │             MUST BE EMPTY ◄── tripwire for partition gaps       │
  └───────────────────────────┬─────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │ PROOF (D-23)                      │
              │  tip^{tree} == TARGET^{tree}      │
              │  git diff TARGET tip  → empty     │
              └───────────────┬───────────────────┘
                              │
                              ▼
    push ship/v0.2-akita-01… ─► gh pr create --base <previous branch>
         PR #1 base=main (fires CI, expected red — D-24)
         PR #2..n base=sibling (fire nothing)
         every PR auto-gets a Copilot review (repo ruleset, unbypassable)
```

### Recommended Project Structure

The phase produces artifacts, not source layout. Recommended placement:

```
.planning/phases/151-ship-v0-2-akita-review-stack/
├── 151-CONTEXT.md                  # exists
├── 151-RESEARCH.md                 # this file
├── 151-NN-PLAN.md                  # per-plan
├── 151-DISPOSITION.md              # D-17: checklist item × slice matrix (single canonical view)
├── 151-STACK-MANIFEST.md           # slice → branch → PR → pathspec → commit SHA → file/line counts
├── 151-BYTE-IDENTITY-PROOF.md      # D-23: the two one-liners + their recorded output
├── 151-HYGIENE-REPORT.md           # D-16: codemod diff stats + residue decisions + before/after greps
└── scripts/                        # the reproducible mechanism, so the user can re-run the proof
    ├── build-rename-commit.sh
    ├── build-slice.sh
    └── verify-identity.sh
```

`scripts/` lives under `.planning/` deliberately: it is planning infrastructure (D-15 exempt), rides in the top-of-stack planning PR, and is the raw material for D-25's skill.

### Pattern 1: Reconstruct a pure-rename commit by remapping the base tree

**What:** Stream the base commit's flat tree listing, rewrite the path field, feed it into a fresh index, write a tree, commit it. Contents are untouched by construction, so every moved file is an *exact* rename (identical blob OID) and git reports `R100`.

**When to use:** D-11's PR #1, and any future "the layout moved" commit.

**Why it beats `git mv` replay:** exact by construction, no worktree, no `.gitattributes`/CRLF round-trip, seconds instead of minutes, and the path map is a legible rule rather than a 1,316-line mapping file.

**Measured result on this repo** (base `ac30f132a`, rule `frontend/**→apps/frontend/**`, `docs/**→apps/docs/**`, `backend/**→∅`):

```
moved=1316 kept=465 dropped=249
git show -M --name-status  →  1316 R  /  249 D  /  0 A  /  0 M
similarity distribution    →  1316 × R100
git show --shortstat       →  1565 files changed, 46188 deletions(-)
```

`[VERIFIED: reconstructed commit 7a672f7137878239ed538384396fd79258a673d3, built and inspected this session]`

### Pattern 2: Path-partitioned slice construction with a catch-all tripwire

**What:** For each slice, compute the raw diff from the current stack tip to the target *restricted to a pathspec*, convert it to an `update-index --index-info` stream (deletions become mode `0`), apply, `write-tree`, `commit-tree`. Finish with a catch-all slice whose pathspec is `.`.

**When to use:** every slice above PR #1.

**Why:** the union of slices is guaranteed to reproduce the target because the last one has no pathspec restriction. Byte-identity is *structural*, not verified-after-the-fact.

**The tripwire discipline — this is the load-bearing part.** The catch-all guarantees byte-identity but *masks partition bugs*: a slice that silently did nothing gets swept up invisibly. **A non-empty catch-all is a hard failure that must halt the build and force re-partition, never a commit you keep.** I hit this in the first run of the experiment: two slices failed on an unsupported pathspec, the catch-all absorbed 472 files, and the tree hash still matched. The proof was true and the stack was wrong.

**Measured result** (nine slices from `ac30f132a`, target = the merged tree):

| # | Commit message | files | lines |
|---|---|---:|---|
| 1 | `refactor: move frontend/ and docs/ under apps/, remove Strapi backend` | 1,565 | 0 ins / 46,188 del |
| 2 | `refactor: shared packages` | 97 | +1,228 / −289 |
| 3 | `feat[db]: Supabase backend and types` | 118 | +16,257 |
| 4 | `feat: dev-seed package` | 161 | +19,560 |
| 5 | `test: E2E suite` | 195 | +23,297 / −778 |
| 6 | `feat: frontend application` | 1,035 | +39,589 / −23,561 |
| 7 | `docs: docs site and repo documentation` | 39 | +490 / −92 |
| 8 | `chore: root config and tooling` | 22 | +8,193 / −25,157 |
| 9 | `docs: planning artifacts` | 2,248 | +854,525 |
| — | **CATCH-ALL** | **EMPTY ✅** | — |

```
tip tree    : ebc0cab9da116744a4b1254af21518fd40d0c1cb
target tree : ebc0cab9da116744a4b1254af21518fd40d0c1cb
TREE MATCH ✅          git diff target..tip → 0 files
```

`[VERIFIED: built this session; stack tip 248d1467d]`

### Pattern 3: Materialise the merge target once, onto the branch

**What:** Instead of describing criterion 7's target as "`feat-gsd-roadmap` merged with `origin/main`" (D-21), *make* it a commit on `feat-gsd-roadmap` before any slicing starts.

**Why:** D-23's two one-liners then take a single ref on each side. A described-but-unmaterialised target makes the proof depend on the reader reproducing your merge with your options — including `merge.renameLimit`, which changes the answer.

**How:**

```bash
git -c merge.renameLimit=20000 merge-tree --write-tree --name-only feat-gsd-roadmap origin/main
# → first line is the merged tree OID; subsequent lines are conflicted paths + notices.
# Inspect the delta — it is 2 files / 11 lines:
git diff --stat feat-gsd-roadmap <TREE>
# Then land it as its own commit (D-22 requires this):
git commit-tree <TREE> -p feat-gsd-roadmap -p origin/main \
  -m "chore: integrate origin/main (YouthVotes front-page feature, relocated to apps/docs/)"
```

Note the two-parent form: a real merge commit records the integration honestly. A single-parent form is also acceptable if `required_linear_history` on `main` matters to how the stack might later be merged — but the stack is not intended to merge (criterion 7), so the two-parent form is preferable for provenance.

**Measured delta:** `apps/docs/src/routes/+page.svelte` (+11) and `apps/docs/static/images/youthvotes-logo.png` (new, 29,862 bytes). Nothing else. `[VERIFIED: git diff --stat HEAD ebc0cab9d]`

### Pattern 4: Comment-hygiene codemod as a two-stage pipeline

**Stage 1 — mechanical (codemod).** Operate only on comment spans. Apply, in order:

1. Delete artifact paths: `` `?\.planning/[^\s`)\]]*`?`` and bare `NN-DOCNAME.md` forms (`80-VERIFICATION.md`, `112-PATTERNS.md`, `136-VERIFICATION.md` — **41 occurrences across 35 files** `[VERIFIED]`).
2. Delete section anchors: `§\s*[0-9A-Za-z][^\s,;)]*` — **219 occurrences, 100 files** `[VERIFIED]`.
3. Delete plan numbers: `(?i)\bplans?\s+\d+[-.]\d+\b` — **103 occurrences, 54 files** `[VERIFIED]`.
4. Delete decision IDs, **both forms**: `\bD-\d{2,3}-\d{2}\b` (185 occ / 44 files) and `\bD-\d{2}\b` (the remainder of 725 occ / 183 files) `[VERIFIED]`. Also the bare-uppercase task IDs that travel with them — `SWEEP-03`, `FLATTEN-02`, `QLAYOUT-02`, `GUARD-02`, `REAL-04`, `CSCAN-01` — which are the same class under a different spelling.
5. Delete milestone tags: `\bv\d+\.\d+\b` **when not part of a package/tool version** — 45 occ / 30 files `[VERIFIED]`. This one is *not* safely mechanical (see Pitfall 6); route it to Stage 2.
6. Collapse survivors: `(?i)\bphases?\s+(\d+)\b` → `see phase $1`; `(?i)\bspikes?[\s\-/](\d+)\b` → `see spike $1`. Then de-duplicate consecutive `see phase N` occurrences and repair punctuation/whitespace.
7. Delete comment lines that become empty or degenerate (`// —`, `/* */`, `* `) after 1–6.

**Stage 2 — residue (agents, D-16).** The set the codemod must **not** touch, handed to file-by-file agents with a written rule:

- Any match not inside a comment span — **126 lines** `[VERIFIED: classified]`. Includes `console.warn('… not implemented in Phase 62 — see D-06 …')` (a runtime user-visible string, `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:131,136`), `it('… (Phase 64 P01)')` / `describe('interface compliance (D-04)')` test titles, and the ESLint rule `message:` string at `apps/frontend/eslint.config.mjs:95`.
- Comments the code makes redundant (D-13's second clause) — pure judgement.
- The 65 `TODO`/`FIXME`/`HACK`/`XXX` occurrences across 49 files — **surface these to the operator as a distinct disposition question**; they are not planning references and D-14 does not authorise deleting them.
- Markdown files (13 in the union) — different comment semantics; the whole file is prose.
- `.sql` (`--`) and `.sh` (`#`) comment syntaxes — 9 files; either teach the codemod or hand them to agents.

**Greppable proof form** (D-16). Record before/after for each pattern:

```bash
for p in '(?i)\bphase\s+\d+' '\bD-\d{2,3}(-\d{2})?\b' '§' '\.planning/' \
         '(?i)\bplans?\s+\d+[-.]\d+' '(?i)\bspikes?[\s\-/]\d+' '\bv\d+\.\d+\b'; do
  printf '%-38s occ=%-6s files=%s\n' "$p" \
    "$(git grep -I -h -o -P "$p" -- apps/ packages/ tests/ | wc -l | tr -d ' ')" \
    "$(git grep -I -l -P "$p" -- apps/ packages/ tests/ | wc -l | tr -d ' ')"
done
```

The post-codemod expectation is `occ=0` for patterns 2–5 and `occ == files-with-a-surviving-ref` for the collapsed `see phase N` / `see spike N` forms. Note **`see phase N` currently appears 4 times in 3 files** — that is the baseline, not zero `[VERIFIED]`.

### Pattern 5: Sweep fan-out sizing (D-19)

The checklist has **30 items**: 16 general + 9 Supabase Backend + 3 Supabase Adapter + 3 Edge Functions `[VERIFIED: .agents/code-review-checklist.md, read this session]`. D-19 says one agent per checklist item within a slice. With 9–12 slices that is a naive 270–360 agent invocations. The conditional blocks are gated by pathspec, which cuts it hard:

| Block | Items | Slices where it applies | Agent invocations |
|---|---:|---|---:|
| General | 16 | all (say 10) | 160 |
| Supabase Backend | 9 | the `[db]` slice only (`apps/supabase/`, `packages/supabase-types/`) | 9 |
| Supabase Adapter | 3 | the slice containing `apps/frontend/src/lib/api/adapters/supabase/` | 3 |
| Edge Functions | 3 | the `[db]` slice (`apps/supabase/supabase/functions/`) | 3 |
| | | **total** | **175** |

Several general items are not per-slice at all and should be dispositioned once, phase-wide:
- item 1 ("changes solve the issues") — phase-level;
- item 11 ("troubleshoot failing checks") — D-24's single suite run;
- item 16 ("commit history clean and linear") — criterion 4 is itself the evidence;
- item 12 ("shared dependencies not unduly affected") — the whole point of the stack; phase-level.

Dispositioning those four once takes the realistic count to roughly **135**. Grouping cheap machine-checked items (3, 4, 5) into a single "lint + duplication" agent per slice takes it under **100**.

### Anti-Patterns to Avoid

- **Deriving the rename path map from `git diff -M` on the net diff.** Rename detection at 50% similarity produces *spurious pairs* across a diff this size: `backend/vaa-strapi/database/migrations/.gitkeep → .planning/milestones/v1.1-phases/13-tech-debt-cleanup/.gitkeep` (R100, coincidental empty-file match), `backend/vaa-strapi/jest.config.json → apps/frontend/jest.config.json` (R100), and four `backend/vaa-strapi/src/util/translations/*/dynamic.json → apps/frontend/src/lib/i18n/translations/*/dynamic.json` at R054–R059. `[VERIFIED: measured]` Derive the map by **rule** (`frontend/**→apps/frontend/**` etc.), which is also what a reviewer expects to read.
- **Parsing `--name-status` / `--raw` output with `awk`, `cut`, or `read`.** One tracked path contains a space: `apps/frontend/src/lib/server/api/README.md 21-40-30-014.md`, present at both merge-base and HEAD `[VERIFIED: git ls-tree -r --name-only HEAD | grep ' '`]`. Every parse must use `-z` and split on NUL.
- **Keeping the catch-all slice's commit when it is non-empty.** See Pattern 2.
- **Chronological slicing of the pre-v2.4 prefix without accounting for its cost.** 459 code files are touched by *both* the pre-v2.4 prefix and the post-v2.4 tail `[VERIFIED: comm -12 over the two file sets]`. A reviewer reading chronological prefix PRs then subsystem tail PRs reads those 459 files twice, the first time in a version a later PR rewrites — the exact thing the Addendum says to merge or split away. See § Open Questions Q1.
- **Assuming `git ls-tree` honours `:(exclude)` pathspec magic.** It does not: `fatal: :(exclude)packages/supabase-types: pathspec magic not supported by this command: 'exclude'` `[VERIFIED: measured]`. `git diff` and `git ls-files` do. This is why Pattern 2 is built on `git diff --raw` rather than `git ls-tree`.
- **Omitting `--abbrev=40` from `git diff --raw`.** The default abbreviates blob OIDs and `update-index --index-info` rejects the stream with `fatal: malformed index info 100644 5d0af153d<TAB>packages/README.md`. `[VERIFIED: hit this exact error]`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reproducing the branch↔main merge | Manual conflict resolution per D-22's description | `git merge-tree --write-tree` | merge-ort's directory-rename detection already produces the prescribed answer; hand-resolving risks a different tree and breaks the identity proof. |
| Byte-identity verification | File-by-file checksum walk, `diff -r` over two worktrees | `git rev-parse <ref>^{tree}` equality | A tree OID is a Merkle root; equality is total. `diff -r` misses mode bits, symlink targets, and empty directories. |
| Stack maintenance | A rebase-tracking harness | Nothing — the stack is built once | D-04 puts fixes on the branch *before* cutting, so no slice is ever rebased. This is the whole reason D-04 is worth its one-way cost. |
| Rename detection tuning | Custom similarity scoring | `-c diff.renameLimit=20000` + exact renames | Exact renames (identical blob OID) are detected by hash lookup and are **not** subject to `diff.renameLimit`: the reconstructed commit still reported 1,316 R with `diff.renameLimit=1`. `[VERIFIED: measured]` Only the inexact/similarity pass is bounded. |
| Comment-vs-string discrimination in the codemod | Regex-only line classification | A real tokeniser pass, or restrict the codemod to lines whose trimmed form starts `//`, `*`, `/*`, `<!--`, `--`, `#` and route the rest to agents | 126 of 1,395 matched lines are not comment-shaped and include a runtime `console.warn` string. Regex alone will edit program behaviour. |
| PR stacking | Graphite / ghstack / spr / git-branchless | `gh pr create --base <sibling-branch>` | The branches are already correct; those tools solve rebase-churn maintenance this stack does not have. |
| Detecting deletions in a slice | `git checkout <target> -- <path>` | `git diff --raw` → `update-index` with mode `0` | `checkout -- P` cannot remove index entries absent from the target. The frontend slice has 164 such deletions. |

**Key insight:** every hand-rolled alternative here trades a *structural guarantee* for a *verified-after-the-fact assertion*. On a 2,828-file diff, the structural guarantee is the only one that survives contact with a mistake.

## Runtime State Inventory

This is a history-restructure phase, so the rename/refactor inventory applies — but to *git and GitHub state*, not application data.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | None. This phase writes no application data. Local Supabase state is only touched by the D-24 E2E run, which does `db:reset` itself. `[VERIFIED: phase scope]` | none |
| **Live service config** | **GitHub PR #860** — open, head `feat-gsd-roadmap`, base `main`, 3,959 files, stale at `97f55cb41` (1,603 commits behind local). Will show a duplicate of the whole body of work next to the stack. **Repo ruleset 8477541 "Copilot review for all branches"** — `enforcement: active`, `ref_name.include: ["~DEFAULT_BRANCH","~ALL"]`, `review_draft_pull_requests: true`, `bypass_actors: []`, `current_user_can_bypass: "never"`. Every stack PR, including drafts, gets an automatic Copilot review. **44 remote heads** already exist on `origin`. **10 PRs already open**, one of which (#778, base `feat/send-errors-to-sentry`) is existing stacked-PR precedent. `[VERIFIED: gh api]` | Dispose of #860 explicitly (close with a pointer, or repurpose). Decide whether to accept 8–12 Copilot reviews or temporarily disable the ruleset (the user is repo admin, so they can — but `current_user_can_bypass: "never"` means it cannot be bypassed per-PR). |
| **OS-registered state** | Seven git worktrees, four of them **locked** agent worktrees under `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application/.claude/worktrees/`. The `-gsd` checkout is a linked worktree. `[VERIFIED: git worktree list]` | The recommended mechanism touches no worktree — it operates on a standalone `GIT_INDEX_FILE`. No worktree needs unlocking. Adding the D-01 backup worktree is an eighth entry. |
| **Secrets/env vars** | None renamed. The E2E run needs the existing root `.env`; `FRONTEND_PORT` is the documented alternate-port escape hatch. `[VERIFIED: CLAUDE.md § E2E preflight]` | none |
| **Build artifacts** | `.turbo/` cache, `apps/frontend/.svelte-kit`, `apps/frontend/node_modules/.vite`. Any history operation that changes the checked-out tree invalidates them. The recommended mechanism does **not** change the checkout. `[VERIFIED: CLAUDE.md]` | `yarn dev:clean` before the D-24 E2E run if the checkout was ever moved. |
| **Git config (critical)** | `core.hooksPath` is set **worktree-locally** to `/dev/null` in this checkout, overriding the shared `.husky` value, with `extensions.worktreeConfig=true`. `git config --get core.hooksPath` → `/dev/null`; `git config --local --get core.hooksPath` → `…/.husky`. `[VERIFIED: measured]` `rerere.enabled` is **unset** — no rerere cache to poison. `diff.renameLimit`, `merge.renameLimit`, `diff.renames` are all unset (defaults). | The override lives in `.git/worktrees/<name>/config.worktree`, which is **not** touched by branch/history operations — it survives. But the recommended mechanism never invokes a hook anyway (`commit-tree` is plumbing and runs no hooks). Verify the override is still present after the phase. |

## Common Pitfalls

### Pitfall 1: `diff.renameLimit` silently degrades every rename measurement

**What goes wrong:** default `git diff -M` over the net diff emits `warning: exhaustive rename detection was skipped due to too many files. you may want to set your diff.renameLimit variable to at least 3633` and reports **908 renames**. With `-c diff.renameLimit=20000` it reports **1,135**. Two different plans get written depending on which number you saw.
**Why it happens:** the inexact (similarity) rename pass is O(n·m) and git caps it. The warning goes to stderr and is easy to lose in a pipeline.
**How to avoid:** put `-c diff.renameLimit=20000 -c merge.renameLimit=20000` on *every* rename-sensitive invocation in the plan. Cost is negligible — the full 20000-limit net diff completed in **0.66 s**.
**Warning signs:** any `warning: exhaustive rename detection was skipped` in a captured log; A/D counts that shift between two runs of "the same" command.
**Does not affect PR #1:** exact renames survive `diff.renameLimit=1` (measured). The 1,316 R100 in the reconstructed commit are found by blob-OID hash lookup, not similarity.

### Pitfall 2: one tracked path contains a space

**What goes wrong:** `apps/frontend/src/lib/server/api/README.md 21-40-30-014.md` (and its pre-rename twin `frontend/src/lib/server/api/README.md 21-40-30-014.md`). Whitespace-splitting parsers mangle it — my own first pass produced the nonsense rename pair `frontend/src/lib/server/api/README.md → 21-40-30-014.md`.
**Why it happens:** a GSD artifact suffix was baked into a filename at some point and never cleaned up. It is the **only** README in `apps/frontend/src/lib/server/api/`, so the directory's documentation is under an unreadable name.
**How to avoid:** `-z` on every git command whose output you parse; split on NUL.
**Warning signs:** a file count off by one; a rename pair with a bare filename as its target.
**Bonus:** this is a free checklist finding — pre-seed it into the disposition matrix under item 7 ("repo documentation markdown files are updated").

### Pitfall 3: `git diff --raw` abbreviates OIDs and `update-index` rejects the stream

**What goes wrong:** `fatal: malformed index info 100644 5d0af153d<TAB>packages/README.md`, and — worse — the pipeline continues because `set -e` does not fire inside a pipe, so the slice silently produces nothing while the script reports success.
**How to avoid:** `--abbrev=40` on every `git diff --raw`, **and** `set -o pipefail` in the slice script, **and** assert the catch-all is empty.
**Warning signs:** a slice reporting `EMPTY` that you expected to have content; a catch-all with an implausible file count.

### Pitfall 4: `git ls-tree` does not support `:(exclude)` pathspec magic

**What goes wrong:** `fatal: :(exclude)packages/supabase-types: pathspec magic not supported by this command: 'exclude'`. If the failure is inside a pipeline, the slice does nothing and the catch-all absorbs it.
**How to avoid:** build slices on `git diff --raw` (full pathspec magic) rather than `git ls-tree`. `git ls-files` also supports exclude; `git ls-tree` does not.

### Pitfall 5: the catch-all launders partition bugs

**What goes wrong:** the byte-identity proof passes while the stack is wrong. Measured live: two broken slices, 472 files swept into the catch-all, `TREE MATCH ✅`.
**How to avoid:** treat a non-empty catch-all as a hard build failure. Record its file count in the stack manifest as `0` — a number, not a claim.
**Warning signs:** a slice whose file count is far off the § Slice Anatomy estimate.

### Pitfall 6: `v\d+\.\d+` is not a safe mechanical strip

**What goes wrong:** the pattern matches genuine version references — `Yarn 4.13`, `Node 22.22.1`, `playwright:v1.58.2-noble`, `Svelte 5`, package versions in comments — as readily as milestone tags. D-14 authorises stripping `v2.NN` milestone tags only.
**How to avoid:** restrict the mechanical rule to `v[12]\.\d+` *and* require an adjacent milestone-context word (`milestone`, `phase`, `close`, `at v`), or route all 45 occurrences to the Stage-2 agents. 45 occurrences across 30 files is a small enough set that agent review is affordable and safer.

### Pitfall 7: PR #1 will be red, and the reason is more specific than D-24 says

**What goes wrong:** `.github/workflows/main.yaml` job `skill-drift-check` runs `.claude/scripts/audit-skill-drift.sh`. That file **does not exist at `ac30f132a`** — `.claude/` at the base contains only `settings.json`. It is added by the *planning* slice at the **top** of the stack. So PR #1 fails `skill-drift-check` with a missing-file error before anything else runs, and `frontend-and-shared-module-validation` fails because the root workspace globs no longer resolve after the move. `[VERIFIED: git ls-tree -r --name-only ac30f132a -- .claude/`]
**How to avoid:** you don't — D-24 accepts it. But annotate PR #1 with the *specific* failures so the reviewer isn't left guessing, and record them in the disposition matrix under checklist item 11 ("troubleshoot any failing checks").
**Also note:** `main.yaml` carries `paths-ignore: ["**.md", "**/*/.env.example", ".env.example"]`. A PR whose changed files are *entirely* markdown fires no workflow at all. The planning PR (2,248 files, overwhelmingly `.md`) is not entirely markdown (it includes `.claude/scripts/*.sh`, `.json`), so this is informational rather than load-bearing — but it means "no CI ran" on some PRs is expected, not a misconfiguration.

### Pitfall 8: GitHub's diff view will truncate several slices

**What goes wrong:** GitHub documents a **300-file** limit for a single rendered diff, a **20,000-line / 1 MB** total diff cap, and a per-file cap of 20,000 lines / 500 KB with only 400 lines / 20 KB auto-loaded `[CITED: docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits]`. The REST `pulls/{n}/files` endpoint caps at **3,000 entries** regardless of the reported `changedFiles` `[VERIFIED: PR 860 reports changedFiles=3959; --paginate returned exactly 3000]`.
**Measured against the proven partition:** PR #1 (1,565 files), frontend (1,035), planning (2,248) all exceed 300; frontend (63k lines) and planning (854k lines) massively exceed the line cap. Renames are cheap — they consume a *file* slot but no *line* budget, and GitHub does report them as renames (**937 `renamed` entries measured on PR 860**), so PR #1's 1,316 renames cost 0 lines. Its 249 Strapi deletions cost 46,188.
**How to avoid / mitigate:**
- Split PR #1 into **1a: rename-only (1,316 files, 0 lines)** and **1b: Strapi removal (249 files, 46,188 deletions)**. 1a then renders as a perfectly clean zero-line rename list — which is the entire point of D-11 — and 1b is a self-evident "delete the dead backend" PR. This is squarely within "Mechanics of reconstructing the pure-rename commit" (Claude's Discretion) and costs one extra PR out of the 8–12 budget.
- Sub-split the 1,035-file frontend slice. § Slice Anatomy gives natural seams.
- Accept that the planning PR is unreadable by design — D-12 already says "approvable without reading".

### Pitfall 9: 8–12 PRs means 8–12 automatic Copilot reviews

**What goes wrong:** ruleset 8477541 targets `~ALL` branches with `enforcement: active`, `review_draft_pull_requests: true`, `bypass_actors: []`, `current_user_can_bypass: "never"`. Every PR in the stack, draft or not, gets an automatic Copilot code review. Over ~4,000 files that is substantial review noise sitting on top of the human review the stack exists to enable.
**How to avoid:** raise it with the operator before opening PR #1. Options: accept it; or (as repo admin) set the ruleset `enforcement` to `evaluate`/`disabled` for the duration and restore it after. Do **not** silently disable a repo-wide policy — it is a decision for the user.
**Rate limits are not a concern:** `gh api rate_limit` shows core 4,989/5,000 remaining. 12 PRs is nothing.

### Pitfall 10: force-push protection on `main`, and the stack's relationship to it

`main` has `required_linear_history: true`, `allow_force_pushes: false`, `allow_deletions: false`, `required_approving_review_count: 1`, `require_code_owner_reviews: true`, `enforce_admins: false`, `required_status_checks.strict: true` with an **empty** `contexts` list `[VERIFIED: gh api …/branches/main/protection]`. No `CODEOWNERS` file exists, so `require_code_owner_reviews` is currently a no-op `[VERIFIED: git ls-files | grep -i codeowners` → empty]. None of this blocks the stack — PR #1 *targets* main but is never pushed *to* it, and the stack is not intended to merge (criterion 7). The `ship/*` branches are unprotected (the only ruleset on `~ALL` is the Copilot one, which is a review rule, not a push rule).

## Code Examples

All three scripts below were executed against this repository this session and produced the measured results reported above. They are written to be dropped into `.planning/phases/151-.../scripts/`.

### 1. Build the pure-rename commit (PR #1)

```bash
#!/usr/bin/env bash
# build-rename-commit.sh — reconstruct a pure-rename commit on top of a base.
# VERIFIED: produced 1316 R100 + 249 D + 0 A + 0 M against ac30f132a.
set -euo pipefail
BASE="${1:-ac30f132a}"
IDX="$(mktemp -t gsd-idx)"; rm -f "$IDX"

git ls-tree -r -z "$BASE" | python3 -c '
import sys
recs = sys.stdin.buffer.read().split(b"\0")
out, moved, kept, dropped = [], 0, 0, 0
for rec in recs:
    if not rec: continue
    meta, path = rec.split(b"\t", 1)      # NUL-safe: path may contain spaces
    mode, _otype, sha = meta.split()
    if path.startswith(b"backend/"):                    # Strapi removal
        dropped += 1; continue
    if path.startswith(b"frontend/") or path.startswith(b"docs/"):
        path = b"apps/" + path; moved += 1              # monorepo refresh
    else:
        kept += 1
    out.append(mode + b" " + sha + b"\t" + path)
sys.stderr.write("moved=%d kept=%d dropped=%d\n" % (moved, kept, dropped))
sys.stdout.buffer.write(b"\0".join(out) + b"\0")
' | GIT_INDEX_FILE="$IDX" git update-index -z --index-info

TREE=$(GIT_INDEX_FILE="$IDX" git write-tree)
C1=$(git commit-tree "$TREE" -p "$BASE" -m "refactor: move frontend/ and docs/ under apps/, remove Strapi backend

Pure path moves plus removal of the Strapi backend. No file contents change.")
echo "$C1"

# Proof that it renders as renames (survives even diff.renameLimit=1):
git -c diff.renameLimit=1 show -M --name-status --format= "$C1" \
  | awk '{print substr($1,1,1)}' | sort | uniq -c
```

### 2. Build one slice

```bash
#!/usr/bin/env bash
# build-slice.sh — sync the index under <pathspec…> to TARGET, then commit.
# VERIFIED: nine invocations reproduced the target tree exactly.
set -euo pipefail
set -o pipefail            # REQUIRED — see Pitfall 3
: "${GIT_INDEX_FILE:?export a dedicated index path}"
: "${TARGET:?set TARGET to the merged-target commit-ish}"
: "${PARENT:?set PARENT to the current stack tip}"
MSG="$1"; shift

git -c diff.renameLimit=20000 diff --raw -z --abbrev=40 --no-renames \
      "$PARENT" "$TARGET" -- "$@" \
  | python3 -c '
import sys
recs = sys.stdin.buffer.read().split(b"\0")
out, i = [], 0
while i < len(recs):
    meta = recs[i]
    if not meta: break
    i += 1
    path = recs[i]; i += 1
    # meta = :srcmode dstmode srcsha dstsha status
    _, mode_dst, _, sha_dst, status = meta[1:].split()[:5]
    if status.startswith(b"D"):
        out.append(b"0 " + b"0"*40 + b"\t" + path)      # mode 0 == remove
    else:
        out.append(mode_dst + b" " + sha_dst + b"\t" + path)
sys.stdout.buffer.write(b"\0".join(out) + (b"\0" if out else b""))
' | git update-index -z --index-info

TREE=$(git write-tree)
if [ "$TREE" = "$(git rev-parse "${PARENT}^{tree}")" ]; then
  echo "EMPTY: $MSG" >&2; echo "$PARENT"; exit 0
fi
git commit-tree "$TREE" -p "$PARENT" -m "$MSG"
```

### 3. Verify byte-identity (D-23, both checks)

```bash
#!/usr/bin/env bash
# verify-identity.sh — D-23's two independent checks, recorded verbatim.
set -euo pipefail
TARGET="${1:-feat-gsd-roadmap}"        # post-sweep tip, already merged with origin/main
TIP="${2:?stack tip ref}"

echo "== Check 1: git diff must be empty =="
git -c diff.renameLimit=20000 diff --stat "$TARGET" "$TIP"
N=$(git diff --name-only "$TARGET" "$TIP" | wc -l | tr -d ' ')
echo "changed files: $N"

echo "== Check 2: tree hashes must be equal =="
A=$(git rev-parse "${TARGET}^{tree}")
B=$(git rev-parse "${TIP}^{tree}")
printf 'target tree : %s\nstack  tree : %s\n' "$A" "$B"

[ "$N" -eq 0 ] && [ "$A" = "$B" ] && echo "BYTE-IDENTICAL ✅" || { echo "MISMATCH ❌"; exit 1; }
```

**Recorded output from the proven run:**

```
tip tree    : ebc0cab9da116744a4b1254af21518fd40d0c1cb
target tree : ebc0cab9da116744a4b1254af21518fd40d0c1cb
TREE MATCH ✅
git diff target..tip : 0 files
```

### 4. Wire the stack on GitHub

```bash
# Branch names per D-02. Push all, then open PRs bottom-up (D-07/D-08).
git branch ship/v0.2-akita-01-renames        <C1>
git branch ship/v0.2-akita-02-packages       <C2>
# … etc
git push origin ship/v0.2-akita-01-renames

gh pr create --repo OpenVAA/voting-advice-application \
  --base main \
  --head ship/v0.2-akita-01-renames \
  --title "ship(v0.2) 01/NN — monorepo layout move (renames only)" \
  --body-file .planning/phases/151-.../pr-bodies/01.md \
  --draft

# every subsequent PR bases on the previous branch:
gh pr create --base ship/v0.2-akita-01-renames \
             --head ship/v0.2-akita-02-packages ...
```

Note `--draft`: the Copilot ruleset has `review_draft_pull_requests: true`, so draft status does **not** suppress the automatic review (Pitfall 9).

## Slice Anatomy — measured inputs for the split (Claude's Discretion, D-09/D-10)

Diff from the reconstructed rename commit `C1` to the merged target, by area. This is the raw material for slice boundaries. `[VERIFIED: git diff --raw/--numstat -z --no-renames C1 <target>]`

| Area | files | notes |
|---|---:|---|
| `.planning/` + `.claude/` | 2,248 | D-12's own PR. +854,525 lines. |
| `apps/frontend/src/lib` | 526 | 30,972 lines. Largest single reviewing surface. |
| `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}` | 329 | 8,904 lines, 47 files × 7 locales, identical shape. Natural standalone i18n slice. |
| `apps/frontend/src/routes` | 200 | 17,886 lines. |
| `tests/` | 195 | 23,297 ins / 778 del. 43 `.spec.ts`. |
| `packages/dev-seed` | 161 | 19,560 lines, entirely new package. |
| `apps/supabase` + `packages/supabase-types` + `supabase/` | 118 | 16,257 lines. **The `[db]` slice** — 3 migrations, 56 `.sql` test files. |
| `packages/*` (excl. dev-seed, supabase-types) | 97 | +1,228 / −289. |
| `apps/docs` + `docs/` + root docs | 39 | +490 / −92. Includes the D-22 commit's 2 files. |
| root config / tooling | 22 | +8,193 / −25,157 (mostly `yarn.lock`). |
| `apps/frontend/tests/strapiDataProvider` | 3 | 9,475 deleted lines — dead Strapi tests. Pair with the Strapi-removal slice. |
| `apps/frontend/src/params` | 6 | 127 lines. |

**Total files C1→target: 3,969** (3,390 A / 404 M / 175 D). Code-only (excl. `.planning`/`.claude`): **~1,723**.

**Segment overlap (bears on D-09's chronological prefix):** pre-v2.4 prefix touches 3,598 code files; post-v2.4 tail touches 901; **459 are in both**; 3,139 prefix-only; 442 tail-only. `[VERIFIED: comm over sorted name-only lists]`

**Nine-slice partition proven this session** (one candidate, not a recommendation): renames+strapi / packages / supabase+types / dev-seed / tests / frontend / docs / root-config / planning. Catch-all empty, tree hash match. Splitting PR #1 into 1a/1b (Pitfall 8) and the frontend into lib / routes / messages gives **12 PRs** — the top of D-10's band.

## Checklist Item × Existing Coverage Inventory (input to D-17/D-18/D-19)

`.agents/code-review-checklist.md`, **30 items** `[VERIFIED: read this session]`. "Reach" is the D-18 question — what the cited gate actually covers.

### General block (16 items, applies to every slice)

| # | Item (abridged) | Existing automated coverage | Measured reach / gap |
|---|---|---|---|
| 1 | Changes solve the PR's issues | none | Phase-level judgement. Disposition once. |
| 2 | OWASP Top 10 review | none | **Fully manual.** D-20: exhaustive over auth / RLS / Edge Function / adapter / input-handling paths in the diff; declared elsewhere. |
| 3 | Follows Code style guide | `yarn lint:check` (`turbo run lint` + `eslint tests` + `tsc -p tests/tsconfig.json --noEmit`) | Covers the *flagged* subset: `array-type: generic`, `func-style: declaration`, `no-restricted-syntax` (TSEnum banned), `naming-convention` typeParameter `^T[A-Z]`, `quotes: single`, `no-console` (allows warn/error/info). **Does NOT cover** named-function-parameters (the guide itself says "not flagged by automatic checks"), TSDoc presence, file-organisation (`foo.ts`/`foo.type.ts`/`foo.test.ts`), or comment style. `[VERIFIED: packages/shared-config/eslint.config.mjs:55-115; code-style-guide +page.md:88-124]` |
| 4 | Avoid `any`; document or `@ts-expect-error` | `@typescript-eslint/no-explicit-any: 'error'` (with `ignoreRestArgs: true`) | Lint-enforced. Current tree: **24 files** match `: any` / `as any` / `<any>`; **7** `@ts-expect-error`; **0** `@ts-ignore`. Highest counts are test files (`packages/llm/tests/llmProvider.test.ts` 57, `packages/dev-seed/tests/writer.test.ts` 8) — confirm whether test globs are exempted before dispositioning as "met". `[VERIFIED: git grep -c]` |
| 5 | No repeated code in PR or repo | none | Manual. Explicitly in D-05's fix bar. |
| 6 | New components/functions/entities documented | none | Manual. TSDoc requirement per style guide § Comments. |
| 7 | Repo documentation .md updated | none | **Concrete target set exists:** 12 files / 18 occurrences of the stale `docs/src/routes/…` path, including `.agents/code-review-checklist.md` itself and 8 in-tree READMEs. Plus the mangled `apps/frontend/src/lib/server/api/README.md 21-40-30-014.md`. `[VERIFIED: git grep -l -P 'docs/src/routes']` |
| 8 | Tracking events for new user-facing functions | none | `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts` + `components/analytics/umami/`. Manual. |
| 9 | New Svelte components follow guidelines | partial (eslint svelte plugin) | Style guide §§ "Svelte components", "Component properties", "Default values … `$$restProps`", "Aria attributes and the `class` attribute", "Component documentation". Mostly manual. |
| 10 | Errors handled and logged | none | Manual. |
| 11 | Troubleshoot failing checks | D-24's full-suite run | Disposition once, phase-level. PR #1's expected reds documented per Pitfall 7. |
| 12 | Shared-dependency blast radius | `yarn build` (turbo topological) + `yarn test:unit` (167 test files in `apps/`+`packages/`) | Build + unit coverage. Disposition once, phase-level. |
| 13 | WCAG A/AA | `assertAxeScan` — `wcag2a, wcag2aa, wcag21a, wcag21aa` | **7 voter routes × 2 themes.** Candidate app, admin surfaces: **NOT covered**. See C-8 — re-measure at execution time. |
| 14 | Keyboard + screen-reader usable | `rawKeyScan` (`assertNoRawI18nKeys`, wired into `assertAxeScan`) | Same 7×2 reach. Two known-blind sites documented in `.planning/todos/pending/2026-08-12-candidate-app-axe-and-rawkey-blind.md`. |
| 15 | Developers'/Publishers' Guide entries updated | none | Manual. Same stale-path target set as item 7. |
| 16 | Clean linear history per commit guidelines | criterion 4 is the deliverable | Disposition once; the restructure *is* the evidence. |

### Supabase Backend (9 items) — applies to the `[db]` slice only

Trigger pathspec: `apps/supabase/`, `packages/supabase-types/`. **118 files, 3 migrations, 56 `.sql` test files.** `yarn db:lint:sql` (sqlfluff + Splinter advisors) is an existing gate covering part of items on indexes / policy shape; the RLS-pattern items (5-policy set, `(SELECT auth.uid())` scalar subqueries, explicit `TO anon`/`TO authenticated`, `SECURITY DEFINER` + `search_path = ''`) and the pgTAP-pattern items (BEGIN/ROLLBACK, `create_test_data()`, `ok()`/`lives_ok()`+`is()`/`throws_ok()`) need agent review. The `supabase-tests` CI job is conditional on `steps.changes.outputs.supabase == 'true'` and will not fire on a sibling-based PR. `[VERIFIED: .github/workflows/main.yaml:81-137]`

### Supabase Adapter (3 items) — applies to the slice containing `apps/frontend/src/lib/api/adapters/supabase/`

`supabaseAdapterMixin` + `init({ fetch })`, `COLUMN_MAP`/`PROPERTY_MAP` from `@openvaa/supabase-types`, `safeGetSession()` over `getSession()`. All three are greppable and cheap to prove exhaustively.

### Edge Functions (3 items) — applies to the `[db]` slice

Trigger pathspec: `apps/supabase/supabase/functions/`. Admin-via-JWT-claims check, `createClient()` with `service_role`, HTTP status + descriptive errors. Small surface, exhaustive review affordable.

### Pre-seeded findings (free hits for the disposition matrix)

| Finding | Checklist item | Evidence |
|---|---|---|
| `apps/frontend/jest.config.json` is dead — Jest is a dependency of nothing in the repo; the file is a leftover from `backend/vaa-strapi/jest.config.json` | 5, 7 | `git grep -l '"jest"' -- '*/package.json' 'package.json'` → empty `[VERIFIED]` |
| `apps/frontend/src/lib/server/api/README.md 21-40-30-014.md` — the sole README of `server/api/`, with a GSD artifact ID baked into the filename, and containing a stale `/docs/src/routes/...` link | 7, 15 | `[VERIFIED: git ls-files]` |
| `apps/frontend/scripts/flatten-current-codemod.mjs` and `store-to-state-codemod.mjs` — one-shot migration scripts, referenced by nothing outside themselves, shipped in the product tree, each printing `PHASE 113`/`PHASE 114` at runtime | 5, 6 | `git grep -l 'flatten-current-codemod' -- . ':(exclude).planning' ':(exclude).claude'` returns only the files themselves `[VERIFIED]` |
| 12 files carry stale `docs/src/routes/…` paths (the tree moved to `apps/docs/` at v1.1) | 7, 15 | 18 occurrences `[VERIFIED]` |
| `console.warn('filterContext.addFilter() is not implemented in Phase 62 — see D-06 (future LLM chat follow-up).')` ×2 — a planning reference in a **runtime user-visible string** | 3 (hygiene), 10 | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:131,136` `[VERIFIED]` |
| 65 `TODO`/`FIXME`/`HACK`/`XXX` across 49 files | 5, 6 | `[VERIFIED: git grep -P]` — surface as an explicit disposition question, not a silent delete |

## Validation Architecture

The deliverable is a git history and a PR stack, not code. Validation splits cleanly into **command-checkable** (assert in a plan task, record the output verbatim) and **human-inspection** (a `checkpoint:human-verify` task).

### Test Framework

| Property | Value |
|----------|-------|
| Unit framework | Vitest, workspace-rooted (`vitest.workspace.ts`); 15 `vitest.config.ts` across packages/apps |
| E2E framework | Playwright (`tests/playwright.config.ts`), 43 `.spec.ts`, preflight in global setup |
| DB tests | pgTAP, 56 `.sql` under `apps/supabase` |
| Quick run command | `yarn test:unit` (turbo-cached) |
| Full suite command | `yarn test:e2e` (~10.5 min per the v2.14 waiver record) |
| Lint/type gate | `yarn lint:check` (turbo lint + eslint tests + `tsc -p tests/tsconfig.json --noEmit`) |
| Format gate | `yarn format:check` |

### Phase Requirements → Verification Map

Requirement IDs are not mapped for this phase; the seven ROADMAP success criteria serve as the requirement set.

| Criterion | Behaviour | Type | Automated command | Exists? |
|---|---|---|---|---|
| **1** — every checklist condition dispositioned | Disposition matrix has a verdict + evidence in every (item × slice) cell, no blanks | structural | script: parse `151-DISPOSITION.md`, assert `cells_with_verdict == items_in_scope × slices` and `blank_cells == 0` | ❌ Wave 0 |
| **2** — Code Style Guide adhered to | Lint/format/typecheck green on the post-sweep tip | automated | `yarn lint:check && yarn format:check` | ✅ |
| **2** — the guide's unflagged rules | Named parameters, TSDoc, file organisation | **human** | `checkpoint:human-verify` per slice, agent-reported | n/a |
| **3** — comment hygiene | No planning refs survive except bare `see phase N` / `see spike N` | automated | the § Pattern 4 grep loop; assert `occ=0` for `.planning/`, `§`, `Plan NN-NN`, `D-NN(-NN)`; assert every surviving `phase \d+` is preceded by `see ` | ❌ Wave 0 |
| **3** — no `[PR review]` tags | | automated | `git grep -c -P '\[PR review\]' -- apps/ packages/ tests/` → 0 (already 0) | ✅ |
| **4.1–4.5** — commit taxonomy | Each restructured commit belongs to exactly one class | automated | script over `git log --format='%s' <base>..<tip>` asserting the subject prefix set and that no two commits share a class where the criterion says "one commit" | ❌ Wave 0 |
| **4.6** — `[db]` tag | Every commit touching `apps/supabase/`, `packages/supabase-types/`, or any `*/migrations/*.sql` has `[db]` in its subject | automated | `git log --format='%H %s' --name-only <base>..<tip>` → assert implication | ❌ Wave 0 |
| **5** — backup worktree | Pre-sweep tip `94be73a61` reachable from a live worktree | automated | `git worktree list \| grep <backup path>` and `git -C <backup> rev-parse HEAD` = `94be73a61…` | ❌ Wave 0 |
| **6** — split quality | Minimal same-file overlap; one viewpoint per PR | **hybrid** | automated: pairwise `comm -12` over each slice's file list, report the overlap matrix. human: "does each PR read as one thing?" | ❌ Wave 0 |
| **7** — byte-identity | Two independent checks pass | automated | `verify-identity.sh` (§ Code Examples 3) | ❌ Wave 0 |
| **D-24** — collective green | Full E2E suite green on the post-sweep branch tip | automated | `yarn db:reset && yarn dev` (fresh :5173) then `yarn test:e2e` | ✅ |

### Sampling Rate

- **Per slice built:** run `verify-identity.sh` against the *partial* stack + remaining-slices catch-all (cheap; catches a partition bug at the slice that caused it, not nine slices later). Assert the catch-all count.
- **Per sweep fix landed on the branch (D-04):** `yarn test:unit` + `yarn lint:check`. Full E2E is 10.5 min — too slow for per-fix, per the project's own economics.
- **Phase gate:** full E2E suite once on the post-sweep tip (D-24), plus `verify-identity.sh` on the complete stack, plus the criterion-4 taxonomy script.

### Wave 0 Gaps

- [ ] `.planning/phases/151-.../scripts/build-rename-commit.sh` — Pattern 1, provided verbatim above
- [ ] `.planning/phases/151-.../scripts/build-slice.sh` — Pattern 2, provided verbatim above
- [ ] `.planning/phases/151-.../scripts/verify-identity.sh` — criterion 7, provided verbatim above
- [ ] `.planning/phases/151-.../scripts/verify-commit-taxonomy.sh` — criteria 4.1–4.6, including the `[db]` implication check
- [ ] `.planning/phases/151-.../scripts/hygiene-grep-report.sh` — criterion 3, before/after occurrence table
- [ ] `.planning/phases/151-.../scripts/slice-overlap-matrix.sh` — criterion 6, pairwise file-set overlap
- [ ] `.planning/phases/151-.../scripts/hygiene-codemod.mjs` — Pattern 4 Stage 1, with dry-run mode (follow the two existing in-repo codemods' `APPLY`-flag convention)
- [ ] **Baseline capture, before any edit:** the hygiene grep table and the checklist-relevant counts (`any`, TODO, stale `docs/src/routes`), so "fixed" is provable rather than asserted
- [ ] **Re-measurement task for `assertAxeScan` reach** — see C-8; do not hard-code 7 routes

## Security Domain

The phase changes no product surface by design (D-13), so its own security posture is procedural. The *sweep* it performs, however, is where the project's security review actually happens (checklist item 2), and D-20 makes that exhaustive over specific paths.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard control in this repo |
|---------------|---------|-------------------------------|
| V2 Authentication | yes — sweep target | Supabase Auth + PKCE cookie sessions; Idura/Signicat OIDC providers under `apps/frontend/src/lib/api/utils/auth/providers/`. D-20: exhaustive over every auth path in the diff. |
| V3 Session Management | yes — sweep target | `safeGetSession()` (never `getSession()`) for route guards — checklist Supabase-Adapter item 3, greppable. |
| V4 Access Control | yes — sweep target | 97 RLS policies, 5 role types, JWT claims via Access Token Hook. Checklist Supabase-Backend items 2–5 encode the standard pattern. Edge Functions verify admin via JWT claims before privileged ops. |
| V5 Input Validation | yes — sweep target | Bulk import/delete RPCs, `external_id`-keyed idempotent upsert, adapter row mapping via `COLUMN_MAP`/`PROPERTY_MAP`. |
| V6 Cryptography | no new work | No crypto introduced by this phase. `docs/key-generation.md` is the existing reference; do not hand-roll. |
| V7 Error handling / logging | yes — sweep target | Checklist item 10; `no-console` lint rule permits only `warn`/`error`/`info`. |
| V14 Configuration | yes — phase-local | The phase itself must not commit secrets. `.env` is gitignored; `.env.example` is `paths-ignore`d in CI. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard mitigation |
|---|---|---|
| RLS bypass via bare `auth.uid()` (re-evaluated per row, and inlinable) | Elevation of Privilege | `(SELECT auth.uid())` / `(SELECT auth.jwt())` scalar subqueries — checklist item, greppable across the `[db]` slice |
| RLS policy with no `TO` role target | Elevation of Privilege | explicit `TO anon` / `TO authenticated` — checklist item, greppable |
| `SECURITY DEFINER` function with a mutable `search_path` | Elevation of Privilege | `SET search_path = ''` + schema-qualified calls — checklist item, greppable |
| Edge Function performing privileged ops without an admin check | Elevation of Privilege | JWT-claims admin verification before `service_role` client use — checklist item |
| Secret leakage through the planning PR | Information Disclosure | **Phase-specific risk:** D-12 ships 2,248 `.planning`/`.claude` files (+854,525 lines) as a single PR that is explicitly "approvable without reading". Run a secret scan over that slice's diff before opening it — it is the one PR nobody will read. |
| SSRF / open redirect in OIDC callback | Server-Side Request Forgery | `apps/supabase/supabase/functions/identity-callback/` — in the exhaustive-sweep set |
| History rewrite exposing a previously-removed secret | Information Disclosure | The reconstruction *adds* no historical blobs — every slice's content comes from the target tree only. Base is `origin/main`, already public. No pre-merge-base history is reachable from the stack. |

**Phase-specific control:** before opening the D-12 planning PR, run `gitleaks`/`git secrets`-equivalent over `git diff <parent> <planning-slice>` and record the result in the disposition matrix. This is the highest-value security action in the phase and is not on the checklist, because the checklist assumes a PR someone reads.

## State of the Art

| Old approach | Current approach | When changed | Impact here |
|---|---|---|---|
| `git merge` in a scratch worktree to preview a merge | `git merge-tree --write-tree` | git 2.38 (2022) | Lets the planner materialise and inspect the D-21/D-22 target with zero worktree risk. `[CITED: git-scm.com/docs/git-merge-tree]` |
| `merge-recursive` | `merge-ort` (default) | git 2.34 (2021) | Directory-rename detection is what makes D-22 resolve itself. `[ASSUMED]` on the version boundary; the *behaviour* is `[VERIFIED]` on git 2.50.1. |
| `git diff` rename detection off by default | `diff.renames` defaults to `true` (basic) | git 2.9 (2016) | Means every `git diff`/`git log`/`git show` in the plan already does rename detection — including the ones you did not intend to. `[CITED: git-scm.com/docs/diff-config]` |
| `git restore`/`checkout -- <path>` for partial sync | index-level `update-index --index-info` | plumbing, always available | The only form that handles deletions. |

**Deprecated / outdated in the CONTEXT's framing:**
- "Two deletion-source commits" — see C-1; there are three commits involved and the first two are moves, not deletions.
- "D-22 requires manual conflict resolution" — see C-4; merge-ort does it.
- The `D-NNN-NN`-only decision-ID pattern in D-14 — see C-5; the bare `D-NN` form is 4× more common.

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | Graphite / ghstack / spr / git-branchless add no value here because the stack is built once and never rebased | Standard Stack § Alternatives | Low. If a slice must change after PRs open, the rebuild is manual — but D-04/D-07 exist precisely to prevent that, and a manual rebuild of a slice is one script invocation. |
| A2 | `merge-ort` directory-rename detection is stable across git versions, so the user reproducing the merge target gets the same tree | Pattern 3 | Medium. Mitigated by A2's own remedy: **materialise the target as a commit** (Pattern 3) so nobody has to reproduce the merge to check the proof. |
| A3 | GitHub's documented 300-file diff limit is a rendering budget, not a hard refusal — the Files-changed tab paginates and lazy-loads beyond it | Pitfall 8 | Low-medium. PR #860 (3,959 files) exists and is browsable, which supports this. If wrong, the fix is more/smaller slices — a discretion change, not a decision change. |
| A4 | The ~135-agent sweep fan-out estimate (after phase-level dispositions and grouping) is affordable | Pattern 5 | Medium. If the real cost is higher, the lever is grouping more machine-checked items per agent, not reducing coverage — D-20 forbids narrowing the claim. |
| A5 | `yarn lint:check` currently passes on the post-sweep tip | Validation Architecture | Medium. **Not measured this session** — the command is slow and the tree is mid-milestone. The plan must include a baseline capture task; if it is currently red, checklist items 3 and 4 have pre-existing debt that the fix bar (D-05) pulls into scope. |
| A6 | The 24 files matching `: any` / `as any` include test files that may be eslint-exempt | Checklist inventory item 4 | Low. Resolved by reading the eslint overrides; a 10-minute task, listed as a plan input. |
| A7 | Phases 147–150 will have executed before Phase 151, changing `assertAxeScan`'s reach | C-8 | Medium — and the mitigation is the same either way: **re-measure**, never hard-code. |
| A8 | The user wants PR #860 dealt with rather than left open alongside the stack | Runtime State Inventory | Low. It is a question for the operator, raised as Q3. |

## Open Questions

### Q1 — Chronological prefix slicing (D-09) vs. "no fixes of itself" (criterion 4.4.1)

**What we know.** D-09 locks the split axis: pre-v2.4 prefix chronological, post-v2.4 tail by subsystem. The prefix's 35 commits are already milestone-squashed into a legible `docs(vX)/feat(vX)/chore(vX)` triple per milestone `[VERIFIED: git log --oneline 9e0399286..983eef384]`.

**What's unclear.** 459 code files are touched by *both* segments `[VERIFIED]`. A chronological prefix PR shows the reviewer the v1.2 version of a file that the tail PR later rewrites — which is exactly what the Addendum says to "merge or split away", and what criterion 4.4.1 forbids at the commit level. Path-partitioning is the only construction that structurally prevents it, and it is inherently *not* chronological.

**Recommendation.** Do not re-litigate D-09. Instead, apply path-partitioning **within** the chronological framing: because 3,139 of the prefix's 3,598 files are prefix-*only* (never touched again), a prefix slice restricted to those files is simultaneously chronological *and* final-state — the reviewer sees the end state of work that happened early. The 459 overlap files go to the tail's subsystem slices, where their final state lives. This satisfies both D-09's intent and criterion 4.4.1. **Present the 459-file overlap number to the operator at plan time** so the tradeoff is chosen, not inherited.

### Q2 — The E2E escape hatch (deferred gray area)

**What we know.** CLAUDE.md's cardinal rule is absolute. D-05's fix bar says fix anything a reviewer would block on. D-13 already shrinks the collision surface by excluding code restructuring. **The project has an exact precedent for this collision:** `.planning/v2.14-CARDINAL-RULE-WAIVER.md` `[VERIFIED: read this session]` — a named, operator-decided, single-defect, explicitly non-precedent-setting waiver with four attached conditions, subsequently **discharged** at v2.15 Phase 138 with the original text retained as history. Its own condition 4 reads: *"No other intermittent inherits this reasoning. A second waiver would mean the rule has stopped functioning."*

**What's unclear.** Whether a *deliberate* fix that breaks the suite is the same category as an *undiagnosed intermittent*. The v2.14 waiver was for the latter and explicitly refuses to generalise.

**Options for the planner to put to the operator — do not choose unilaterally:**

| Option | Mechanism | Tradeoff |
|---|---|---|
| **A — Fix forward, no exception** | A sweep fix that reddens the suite is not done until the suite is green again; the fix and its test repair land as one branch commit before the slice is cut. | Purest reading of the cardinal rule. Cost is unbounded schedule risk on a single fix — the exact failure mode the v2.14 waiver was written to avoid. |
| **B — Demote below the fix bar** | If a fix reddens the suite and the repair is not tractable within the slice, the finding is **recorded as deferred with the E2E collision as its rationale** and the fix is reverted. D-05 already provides for deferral with rationale. | Cheapest, fully within existing locked decisions, requires no new mechanism, and keeps the record honest. Cost: a known-blockable finding ships unfixed — visible in the disposition matrix, which is where a reviewer will see it. |
| **C — Named waiver, v2.14 shape** | A `151-CARDINAL-RULE-WAIVER.md` per defect, operator-signed, with attached conditions and a required discharge. | Highest fidelity to project precedent. But v2.14's own condition 4 says a second waiver is evidence the rule has stopped functioning — so invoking this is itself a signal, and the operator should be told that explicitly. |
| **D — Fix-and-quarantine-the-slice** | The fix lands on the branch; the affected slice is cut anyway (per-PR CI is not the gate, D-24) and the red is carried to the D-24 collective run, which then must be green. | Collapses into A — the collective run is the gate, so it must eventually be green. Not a real third path. |

**Recommendation to the planner:** default to **B**, escalate to **C** only if a security or correctness finding (the top of D-05's bar) is the one colliding, and surface options A–C to the operator at plan-approval rather than at the moment of collision. Whichever is chosen, make it a written plan decision with the trigger condition stated, so an executing agent does not improvise it at 2am.

### Q3 — Docs-commit ordering and the `[db]` tag (deferred gray areas) — **answered by measurement**

**Ordering (criterion 4.1 before 4.2).** Measured: of **1,427** `docs` commits in `9e0399286..HEAD`, **1,348 touch nothing outside `.planning/` or `.claude/`**, **28 are mixed**, and **51 are purely outside planning** `[VERIFIED: git log --name-only, classified]`. So the ordering is not ambiguous — apply 4.1 first, and 4.2 then collapses at most **79** commits (51 pure + the non-planning portion of 28 mixed), not 1,427. The 28 mixed commits are the only ones that need splitting rather than assigning; that is a bounded, nameable set.

**`[db]` tag retroactivity.** Measured: `[db]` appears **0 times** in the entire repository history, on any branch `[VERIFIED: git log --all --format='%s' | grep -c '\[db\]'`]. There is therefore no existing convention to be consistent with and nothing to apply retroactively — and since the restructure *replaces* the history, "retroactive" has no referent. The tag applies to restructured commits only. The one bracket-tag precedent in the branch is `feat[admin-tools]` (3 uses) `[VERIFIED]`, which matches the Addendum's own `fix[db]: foo table` form, so the format is settled. **Recommendation: state both of these as plan decisions rather than leaving them as gray areas — they are now measured facts, not judgement calls.**

### Q4 — Should PR #1 be split into rename-only and Strapi-removal?

**What we know.** As built, PR #1 is 1,565 files: 1,316 pure renames (0 lines) + 249 deletions (46,188 lines). D-11's stated purpose is that "paths change and contents don't". The 46,188 deleted lines are contents changing.

**Recommendation.** Yes — split into 1a (renames, 0 lines, renders perfectly) and 1b (Strapi removal, self-evidently reviewable at a glance). This is within Claude's Discretion ("mechanics of reconstructing the pure-rename commit") and costs one PR of the 8–12 budget. Flag it to the operator as a discretion call made, not a decision changed.

### Q5 — What happens to `origin/feat-gsd-roadmap` and PR #860?

**What we know.** `origin/feat-gsd-roadmap` is 1,603 commits behind local; PR #860 renders that stale state as a 3,959-file PR against `main`. `[VERIFIED]`

**What's unclear.** Whether pushing the post-sweep tip (updating #860 in place) is desired — it would give the reviewer a single "here is everything" PR alongside the stack, which may be useful context or may be noise.

**Recommendation.** Raise with the operator before opening PR #1. Cheapest coherent answer: push the post-sweep tip so #860 reflects reality, retitle it, and convert it to the stack's tracking PR with a table of the 8–12 slice PRs in its body. Then the stack has an index and the duplicate stops being a duplicate.

## Sources

### Primary (HIGH confidence — measured in this repository, this session)

- `git` 2.50.1 direct measurement — rename counts, similarity distributions, `diff.renameLimit` behaviour, exact-rename immunity, pathspec-magic support per command, `--raw` abbreviation failure mode
- Reconstructed commit `7a672f7137878239ed538384396fd79258a673d3` — pure-rename commit, 1316 R100 / 249 D / 0 A / 0 M
- Reconstructed stack tip `248d1467d` — nine slices, empty catch-all, tree hash `ebc0cab9da116744a4b1254af21518fd40d0c1cb` matching the merge target
- `git merge-tree --write-tree feat-gsd-roadmap origin/main` → tree `ebc0cab9d…`, 2-file delta from HEAD, zero conflict markers
- `gh api` — repo permissions, `main` branch protection, ruleset 8477541, rate limit, PR #860 file listing (3,000-entry cap, 937 `renamed` entries)
- `.agents/code-review-checklist.md` (30 items), `apps/docs/src/routes/(content)/developers-guide/contributing/code-style-guide/+page.md` (244 lines), `packages/shared-config/eslint.config.mjs:55-115`, `.github/workflows/main.yaml`, `tests/tests/specs/a11y/a11y-smoke.spec.ts:1-60,215-330`, `.planning/v2.14-CARDINAL-RULE-WAIVER.md`, `.planning/todos/pending/2026-08-12-candidate-app-axe-and-rawkey-blind.md`, `ROADMAP.md` § Addendum 1, `.planning/ROADMAP.md` §§ Phase 147/151, `CLAUDE.md`
- `git grep -P` inventories over `apps/`, `packages/`, `tests/` — 358 files / 1,984 planning-reference occurrences, 1,395 matched lines classified comment-vs-code

### Secondary (MEDIUM confidence)

- `docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits` — diff limits (300 files, 20,000 lines / 1 MB total, 500 KB / 20,000 lines per file, 25 renderable files)
- `git-scm.com/docs/diff-config` — `diff.renameLimit` and `diff.renames` semantics (note: the docs do **not** state whether exact renames are subject to the limit; that was established by measurement here)

### Tertiary (LOW confidence — flagged in the Assumptions Log)

- Stacked-PR tooling feature comparison (Graphite / ghstack / spr / git-branchless) — general web search only; the recommendation not to use them rests on the measured properties of *this* stack, not on their feature sets

## Metadata

**Confidence breakdown:**
- Git mechanics (rename reconstruction, slice construction, byte-identity): **HIGH** — the complete pipeline was executed against this repository and produced a matching tree hash with an empty catch-all
- Merge-target materialisation (D-21/D-22): **HIGH** — computed and inspected; the 2-file delta was read line by line
- Measured inventories (renames, file counts, ref variants, docs-commit classification, `[db]` occurrences): **HIGH** — every number carries the command that produced it
- GitHub rendering behaviour at these sizes: **MEDIUM** — documented limits are cited, the 3,000-file API cap and 937 rename entries are measured, but web-UI behaviour on a 1,565-file rename PR is inferred
- Sweep fan-out sizing and effort: **MEDIUM** — the item × slice arithmetic is exact; the per-agent cost is estimated
- Current `lint:check` / `format:check` state: **LOW** — not run this session; flagged as A5 and as a Wave-0 baseline task

**Research date:** 2026-08-16
**Valid until:** 2026-09-15 for the git mechanics and GitHub limits (stable). **The repo-state measurements expire the moment Phases 147–150 execute** — re-measure `assertAxeScan` reach, the hygiene inventory, and the file/line counts against the actual post-Phase-150 tip before cutting slices.
