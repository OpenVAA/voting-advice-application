# Phase 151: Ship v0.2 Akita — Review Stack & Commit-History Restructure - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Take the v0.2 "Akita" body of work from its reiterative development history to a reviewable,
shippable state. Four workstreams, no new product surface:

1. Sweep the v0.2 net diff against the Code Review Checklist and the Code Style Guide, recording
   each item's disposition.
2. Bring in-file comments to hygiene (self-explanatory code first; planning references reduced to
   the short `see phase N` form).
3. Restructure the commit history into reviewable groupings.
4. Produce a review-only stack of PRs off `origin/main`.

**Measured scale** (`feat-gsd-roadmap` vs merge-base `9e0399286`):

| Segment | Commits | Code files | Lines |
|---|---|---|---|
| merge-base → v2.4 close (`983eef384`) | 35 (already milestone-squashed) | 2,392 | +62,117 / −92,806 |
| v2.4 close → HEAD (`94be73a61`) | 2,518 | 891 | +58,485 / −15,247 |
| **Total code** (excl. `.planning`/`.claude`) | **2,553** | **2,828** | **+111,378 / −98,829** |
| `.planning` + `.claude` | — | 2,246 | +853,932 |

Commit-type spread across the 2,553: 1425 `docs`, 280 `fix`, 279 `feat`, 271 `test`, 133 `refactor`,
125 `chore`, 10 `wip`, 9 `spike`, 7 `plan`, 3 `style`, 2 `revert`.

**Not in scope:** new features, behavioural change beyond what the sweeps' fix bar requires, and any
work on `feat-v02-akita-continued`.

</domain>

<decisions>
## Implementation Decisions

### Baseline, branches & worktrees

- **D-01:** The backup worktree pins the **pre-sweep tip `94be73a61`** as the immutable reiterative-history
  record satisfying criterion 5. `feat-gsd-roadmap` itself keeps advancing with sweep fixes, and
  criterion 7's byte-identity is proven against its **post-sweep** tip. Backup = history, branch = truth.
  Backup lives as a sibling worktree (e.g. `voting-advice-application-gsd-backup`).
  — **Reversibility:** costly — once slices are cut from a moving branch, re-pinning the baseline means
  re-cutting every slice and force-pushing any opened PR.
- **D-02:** Stack branches are named `ship/v0.2-akita-NN-<slice>` — numbered so stack order is legible
  in the branch list and greppable.
- **D-03:** `feat-v02-akita-continued` is **frozen out of the stack**. The stack is cut from
  `feat-gsd-roadmap`'s post-sweep tip and never picks up continuation work; sweep fixes are NOT
  propagated to it during this phase. Keeps the byte-identity proof stable against a moving target.

### Fix-vs-defer & ordering

- **D-04:** Sweep fixes land **on the original branch first**, before the affected slice is cut. Only
  then is the slice built from the fixed tip. Byte-identity is then trivially true and tree-hash-provable.
  — **Reversibility:** one-way — the alternative (fixing inside the stack and redefining the baseline)
  makes the byte-identity claim circular; switching after slices are open requires rebuilding the stack.
- **D-05:** Fix bar is **"anything a reviewer would block on"** — security + correctness, plus duplication,
  undocumented public entities, missing repo-doc updates, and style-guide violations. Below that bar,
  findings are recorded with a rationale and deferred.
- **D-06:** The sweep runs **per-PR-slice at slice-build time** — no separate full-diff sweep pass. Sweep
  and split share one traversal of the diff, and the disposition record is organised per-slice, which is
  also how a reviewer reads it.
- **D-07:** Slices are cut and swept **strictly bottom-up**, and a PR opens only once the slice *above* it
  has also been swept. This keeps any cross-slice fix cheap while the owning slice is still unopened, so
  criterion 4 ("the PR contains no fixes of itself") holds without force-pushing PRs already under review.
  Cost: a one-slice lag in early visibility.
- **D-08:** PRs open **incrementally as slices finalise** (behind the D-07 frontier), not all at once at
  the end.

### PR-stack split

- **D-09:** Split axis is **two-segment**: the 35-commit pre-v2.4 prefix splits **chronologically** (it
  already is — monorepo refresh → Svelte 5 infra → content → candidate app → Supabase → auth); the
  891-file post-v2.4 tail splits **by subsystem** (frontend, tests, supabase, dev-seed, packages, docs).
  Matches how the work accumulated and minimises same-file overlap in the tail.
- **D-10:** Target stack size **8–12 PRs**.
- **D-11:** **PR #1 is rename-only** — pure moves for `frontend/`→`apps/frontend/` and the Strapi
  `backend/` removal, so paths change and contents don't and the diff renders as renames rather than
  622 delete/add pairs. Content changes to those files land in later PRs as ordinary edits. Requires
  reconstructing a pure-rename commit the original history does not contain (git already detects 857
  renames across the net diff, so the raw material is there).
  — **Reversibility:** costly — PR #1 is the base of the entire stack; changing its shape rebases everything.
- **D-12:** `.planning/` + `.claude/` (2,246 files, +853,932 lines) ship as **their own PR at the top of
  the stack** — approvable without reading, and out of every other PR's diff.

### Comment hygiene

- **D-13:** Sweep scope is **refs + pruning comments the code makes redundant**. No code restructuring —
  Addendum rule 4's "rename/restructure so the comment isn't needed" is explicitly NOT exercised, to avoid
  behaviour-adjacent changes late against the cardinal E2E rule.
- **D-14:** Surviving references **collapse to the bare `see phase N` / `see spike N` form**. Stripped:
  artifact paths (`.planning/...`), section anchors (`§9`, `§Pitfall 7`), plan numbers (`Plan 88-02`),
  `D-NNN-NN` decision IDs, and `v2.NN` milestone tags. Verifiable by grep.
- **D-15:** `CLAUDE.md`, `.agents/` and `.claude/` are **exempt** — agent-facing planning infrastructure,
  not shipped source. They ride in the top-of-stack planning PR with citations intact. Hygiene applies
  only to `apps/`, `packages/` and `tests/`.
- **D-16:** Verdict authority is **codemod for the mechanical part, agents for the residue**. The scripted
  pass handles what's deterministic (strip paths, anchors, plan numbers, decision IDs, milestone tags),
  leaving a smaller judgement set for agents working file-by-file against a written rule. Codemod output
  is greppable proof.

### Checklist sweep & disposition record

- **D-17:** Disposition is recorded in a **phase artifact — one row per checklist item × slice**, each cell
  carrying a verdict (met / fixed / deferred) and its evidence. Single auditable view that satisfies
  criterion 1 literally; rides in the top-of-stack planning PR.
- **D-18:** For items with existing automated coverage, **cite the gate but first verify its reach against
  the slice**. Concretely: `assertAxeScan` reaches 7 voter routes × 2 themes, so the candidate app and admin
  surfaces are NOT covered by it and must be dispositioned separately. Never launder a blind spot as "met".
- **D-19:** Sweep fan-out is **one agent per checklist item, within a slice** — each agent holds one lens
  and applies it consistently across that slice's files (the Addendum's own suggestion).
- **D-20:** For items that cannot be exhaustively proven over the diff: **exhaustive on reachable surfaces,
  declared elsewhere.** Security exhaustive over every auth, RLS, Edge Function, adapter and input-handling
  path in the diff; a11y exhaustive over routes/components whose markup changed. Anything outside those
  sets is recorded as **not-swept with the reason**, so the record never overclaims.

### Stack mechanics, CI & proof

- **D-21:** **Rebase onto current `origin/main`** (`ac30f132a`) so PR #1 targets a base it's current with.
  Consequence: the stack tip includes `ac30f132a`'s content, so criterion 7's byte-identity target is
  `feat-gsd-roadmap` **merged with `origin/main`**, not the branch tip alone. State it that way in the proof.
- **D-22:** The rebase hits a rename/delete conflict: `ac30f132a` modifies `docs/src/routes/+page.svelte`
  and adds `docs/static/images/youthvotes-logo.png`, both of which this branch moved to `apps/docs/`.
  Resolution: **move the files to their logical new location** — port the 11-line front-page change into
  `apps/docs/src/routes/+page.svelte` and the logo into `apps/docs/static/images/`. Nothing from main is
  lost. This content is produced by no v0.2 commit, so it gets its own commit and its own line in the
  disposition record.
- **D-23:** Byte-identity is demonstrated by **two independent checks**: `git diff <branch> <stack-tip>`
  returning empty, AND `git rev-parse <branch>^{tree}` equal to the stack tip's tree hash. Both one-liners,
  both recorded in the phase artifact, both reproducible by the user.
- **D-24:** The trusted green signal is the **full suite run against the post-sweep branch tip**, recorded
  in the phase artifact as the stack's collective proof — matching "only the whole matters" and honouring
  the cardinal rule at the level where it is meaningful. Per-PR CI is not the gate.
  **Note for the planner:** `main.yaml` triggers on `pull_request` with `branches: [main]`, so PR #1 will
  fire CI automatically whether or not it is the gate, while the stacked PRs (targeting sibling branches)
  fire nothing. PR #1 is the rename-only slice and will likely be red in isolation — annotate the PR
  explaining that only the whole stack is expected to pass. Do not treat that red as a phase blocker.

### Codification

- **D-25:** The ship procedure **is codified as a skill, written last**, drafted from what the sweeps and
  the split actually taught rather than from the Addendum's prose. Not drafted incrementally.

### Claude's Discretion

- Exact slice boundaries within the two segments, subject to D-09/D-10 and criterion 6 (minimise PRs
  touching the same files; each PR one reviewing viewpoint).
- The written rule the hygiene agents apply to the codemod residue (D-16), and what counts as a comment
  "the code makes redundant" (D-13).
- Mechanics of reconstructing the pure-rename commit for PR #1 (D-11).
- Whether the disposition matrix is one file or one per slice, so long as a single canonical view exists (D-17).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase source of truth
- `ROADMAP.md` (repo root) § "Addendum 1: Shipping v0.2 Akita" — the freeform brief this phase implements.
  Note: this is the **repo-root** ROADMAP.md, NOT `.planning/ROADMAP.md`.
- `.planning/ROADMAP.md` § "Phase 151" — the seven success criteria and phase notes.

### Sweep targets (criteria 1–2)
- `.agents/code-review-checklist.md` — the checklist every condition of which must be dispositioned.
  ~30 items: a general block plus three conditional blocks (Supabase Backend, Supabase Adapter,
  Edge Functions).
- `apps/docs/src/routes/(content)/developers-guide/contributing/code-style-guide/+page.md` — the Code
  Style Guide, incl. the Svelte component guidelines the checklist cross-references.
  **Path correction:** both the Addendum and the checklist cite this as `docs/src/routes/...`; the tree
  moved to `apps/docs/` during the v1.1 monorepo refresh. `docs/` now holds only `key-generation.md`.
- `apps/docs/src/routes/(content)/developers-guide/contributing/contribute/+page.md` — commit guidelines
  referenced by the checklist's final item.
- `apps/docs/src/routes/(content)/developers-guide/` and `.../publishers-guide/` — the guides the checklist
  requires updating where changes touch them.

### Project conventions the sweep must not violate
- `CLAUDE.md` (repo root) — E2E cardinal rule, Context Destructuring Rule (Svelte 5), the `dataRoot`
  `#version`-bridge carve-out, and the `svelte-warning: accepted` comment format. **Exempt from hygiene
  per D-15**, but binding on any code fix the sweep makes.
- `tests/README.md` § Run — E2E preflight and the served-application gate.
- `packages/README.md` — canonical package paradigm, relevant if any fix touches package structure.

### Comment-hygiene evidence base
- Measured at discussion time across `apps/frontend/src`, `packages/*/src`, `tests`:
  601 `Phase NN` refs · 93 `D-NNN-NN` decision IDs · 39 spike refs · 36 `v2.NN` milestone refs ·
  20 literal `.planning/` paths. **0** `[PR review]` tags — criterion 3's second clause is already satisfied.
- Distribution: `apps/frontend/src` 123 files · `packages/dev-seed/src` 41 · `tests/` 36 · others ~4.
- Institutionalised examples the codemod will hit (all reduce to bare form, none are exempt):
  `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:82`,
  `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts:16`,
  `apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte:49`,
  `apps/frontend/src/params/etPl.ts` (multiple).

### CI / gate reality
- `.github/workflows/main.yaml` — `pull_request` trigger scoped to `branches: [main]`; jobs
  `skill-drift-check`, `frontend-and-shared-module-validation`, `supabase-tests`,
  `dev-seed-integration`, `e2e-tests`, `e2e-visual`. Establishes D-24's note.

### History anchors
- Merge-base with `origin/main`: `9e0399286` ("fix: `entityType` order in results").
- Pre-squashed prefix ends at `983eef384` ("chore(v2.4): Full Svelte 5 Rewrite — config and cleanup").
- Pre-sweep tip pinned by the backup worktree: `94be73a61`.
- `origin/main` tip: `ac30f132a` ("docs: YouthVotes feature on front page").
- Continuation branch base: `315b9795e`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- **A prior squash pass already exists and set a precedent.** Milestones v1.0–v2.4 were compressed into a
  `docs(vX): … planning, research, and summaries` / `feat(vX): …` / `chore(vX): … config and cleanup`
  triple each — 35 commits covering 2,392 code files. That taxonomy (planning / feature / config-cleanup)
  is close to what criterion 4 asks for and should be the model for restructuring the 2,518-commit tail
  rather than inventing a new one.
- **Git already detects the restructure as renames** — 857 rename pairs across `frontend/` ↔ `apps/frontend/`
  in the net diff with `-M`. PR #1's pure-rename reconstruction has usable raw material.
- **The restructure deletions are concentrated in two commits** — `b2d6a24c7` (v1.1 Monorepo Refresh) and
  `05b033266` (v1.2 Svelte 5 Infrastructure) account for every `frontend/` and `backend/` deletion, which
  bounds the reconstruction work for D-11.
- **`gh` CLI is authenticated** (account `kaljarv`, `github.com`), so PR creation is scriptable.
  Remotes: `origin` → `OpenVAA/voting-advice-application`, `privates` → `OpenVAA/ee-2024-vaa`.

### Established patterns

- **Worktree-based parallelism is already in use** — seven worktrees exist, four of them locked agent
  worktrees under the main checkout. A backup worktree is an established shape here, not a new mechanism.
- **`-gsd` is a linked worktree** sharing the main repo's `core.hooksPath`, overridden worktree-locally to
  `/dev/null` so plain commits work. History rewriting must not disturb that override.
- **`.planning/` commits in this worktree commit cleanly**; the `--no-verify` requirement is a main-repo
  quirk, not a `-gsd` one.

### Integration points

- **The 891-file post-v2.4 tail is where all restructure work actually lands.** The headline 2,828-file
  figure is dominated by the already-squashed prefix. Plan effort against 891, not 2,828.
- **The `[db]` tag (criterion 4.6) applies to `apps/supabase/` (111 files)** plus any migration or
  generated-type change in `packages/supabase-types/` (6 files).
- **Docs commits are the largest single class** — 1,425 of 2,553. Criterion 4's "all other documentation is
  one commit" collapses these hard; most are `.planning/` churn already covered by criterion 4.1, so the
  two rules must be applied in order (planning first, then remaining docs).

### Constraints

- **Cardinal E2E rule is in force.** Any code fix the sweep makes is subject to it, and D-24 makes the
  branch-tip full-suite run the gate. D-13 deliberately excludes code restructuring to keep this surface small.
- **Visual baselines only regenerate in `mcr.microsoft.com/playwright:v1.58.2-noble`, `--platform linux/amd64`,
  dev server `--host 0.0.0.0`** — never on a developer Mac. Relevant if any fix moves rendered output.
- **STATE.md currently reads `current_phase: 140`.** Phase 151 depends on Phase 150; this discussion runs ahead
  of execution order deliberately.

</code_context>

<specifics>
## Specific Ideas

- **"Move the files to their logical new location"** — the user's direct instruction for the `ac30f132a`
  rebase conflict (D-22). The YouthVotes front-page change and logo go to `apps/docs/src/routes/+page.svelte`
  and `apps/docs/static/images/`, following the restructure rather than being dropped or left at the old path.
- **PR ergonomics are the point of the split** — "each contains changes of a similar nature so I don't need to
  change viewpoints while looking at a specific one" (Addendum). Where milestone boundaries would force the
  reviewer to read changes a later commit undoes, or a partial version of a feature reworked later, merge or
  split them.
- **The stack need not be merged.** If byte-identity holds, review comments can be implemented on a separate
  branch targeting whichever of the original or the stack is easiest.

</specifics>

<deferred>
## Deferred Ideas

- **Propagating sweep fixes to `feat-v02-akita-continued`** — considered and rejected for this phase (D-03).
  The parallel session will need to absorb them after the stack is reviewed; worth an explicit follow-up so
  it doesn't keep building on code already agreed to be defective.
- **Gray areas surfaced but not opened** (offered at the exit gate, user chose to proceed):
  - What happens if a sweep finding requires a code fix that breaks the E2E suite — the fix bar (D-05) says
    fix it, the cardinal rule says the suite must be green. The planner should define the escape hatch.
  - Precise ordering of criterion 4.1 (planning → one commit) against 4.2 (other docs → one commit) given
    1,425 docs commits, most of them `.planning/` churn.
  - Whether the `[db]` tag is applied retroactively to historical commits or only to the restructured ones.

### Reviewed Todos (not folded)

`todo.match-phase 151` returned matches, all scored 0.9 on generic keyword/area overlap with a
ship/review phase. None are in scope — Phase 151 changes no product behaviour beyond the sweeps' fix bar:

- `2026-03-28-generalize-candidate-app-to-party-app.md` — new capability, own phase.
- `2026-06-03-after-runes-update-check-stale-app-header-styling-banner-ima.md` — UI verification work.
- `2026-06-06-disable-hover-and-pointer-on-disabled-results-header-button.md` — product fix.
- `2026-06-15-fix-view-transition-flicker-in-results-section.md` — product fix.

If any of these surface as checklist findings during a slice sweep, they are dispositioned there rather
than folded into scope here.

</deferred>

---

*Phase: 151-ship-v0-2-akita-review-stack*
*Context gathered: 2026-08-16*
