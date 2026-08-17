# Phase 151: Ship v0.2 Akita — Review Stack & Commit-History Restructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-16
**Phase:** 151-ship-v0-2-akita-review-stack
**Areas discussed:** Fix-vs-defer & ordering, PR-stack split shape, Comment-hygiene verdicts, Checklist sweep & record, Stack mechanics & CI, Codify as a skill

All six offered areas were selected.

---

## Fix-vs-defer & ordering

### Where does a sweep fix land, given criterion 7's byte-identity requirement?

| Option | Description | Selected |
|--------|-------------|----------|
| Original branch first, then cut | Fixes commit onto the branch; stack cut only from the fixed tip. Byte-identity trivially provable. Stack build strictly last. | ✓ |
| Fix inside the stack, main branch follows | Fixes land in slices; branch fast-forwarded to match. Byte-identity claim becomes circular. | |
| Record-only, fixes are a follow-up | No code fixes beyond comment hygiene; findings become Phase 152 / backlog. | |

### Severity bar for fix-now vs record-and-defer

| Option | Description | Selected |
|--------|-------------|----------|
| Security + correctness only | OWASP-class, RLS/auth, unhandled errors, bug-hiding `any`. Everything else deferred. | |
| Anything a reviewer would block on | Above plus duplication, undocumented public entities, missing repo-doc updates, style-guide violations. | ✓ |
| Cheap-to-fix, regardless of severity | Bar is effort not severity; anything fixable in-file gets fixed. | |

### Sweep exhaustiveness across the 2,828-file net diff

| Option | Description | Selected |
|--------|-------------|----------|
| Risk-weighted | Exhaustive on supabase/adapter/auth/package APIs, sampled elsewhere. | |
| Exhaustive on every changed file | All 2,828 files read against applicable items. | |
| Per-PR-slice at slice-build time | Sweep and split share one traversal; record organised per-PR. | ✓ |

### Gating — must all sweeps close before the first PR opens?

| Option | Description | Selected |
|--------|-------------|----------|
| All sweeps close, then open the stack | Strictly sequential; nothing visible until final. | |
| Open incrementally as slices finalise | Early review possible; rebases churn review threads. | ✓ |
| Open all as drafts, mark ready as swept | Early feedback on the split itself. | |

### Follow-up: cross-slice fix against an already-open slice

Raised because the four answers above interact — sweeping slice N can find a defect in a file owned by
already-open slice N−2, and criterion 4 rules out a fix-up slice at the top of the stack.

| Option | Description | Selected |
|--------|-------------|----------|
| Amend the owning slice, force-push | Honours criterion 4 exactly; churns PRs under review. | |
| Sweep bottom-up, open only behind the frontier | One-slice lag in visibility, near-zero force-push churn. | ✓ |
| Defer cross-slice fixes to the record | No churn; criterion 1's "fixed" bucket shrinks over time. | |

### Follow-up: what is "the original branch" once it has moved?

| Option | Description | Selected |
|--------|-------------|----------|
| Backup worktree pins pre-sweep; branch moves | Backup pins `94be73a61` for criterion 5; `feat-gsd-roadmap` advances and is the byte-identity target. | ✓ |
| Cut a dedicated ship branch, freeze the original | `feat-gsd-roadmap` frozen; new `ship-v0.2-akita` branch takes fixes. | |

**Notes:** This area was flagged upfront as the load-bearing one — criteria 1–3 (fix what the sweeps find)
and criterion 7 (byte-identical to the original branch's final state) only coexist under an explicit
ordering rule.

---

## PR-stack split shape

Presented after a measurement that reshaped the options: the history is already half-squashed. Milestones
v1.0–v2.4 were previously compressed into a `docs(vX)/feat(vX)/chore(vX)` triple each — 35 commits covering
2,392 code files — while the fine-grained 2,518-commit tail touches only 891 files.

### Split axis

| Option | Description | Selected |
|--------|-------------|----------|
| Two-segment: chronology then subsystem | Chronological across the 35-commit prefix, subsystem across the 891-file tail. | ✓ |
| Subsystem throughout | One axis for the whole diff; frontend PR would swallow the restructure. | |
| Nature-of-change throughout | Mirrors criterion 4's commit taxonomy; a file appears in several PRs. | |

### PR count

| Option | Description | Selected |
|--------|-------------|----------|
| 8–12 | Substantial single-viewpoint chunks; whole stack holdable in one head. | ✓ |
| 15–20 | Small PRs, long stack, cascading rebases. | |
| 5–7 | Fewest context switches; frontend and restructure PRs run to 800+ files. | |

### Placement of `.planning` + `.claude` (2,246 files, +853,932 lines)

| Option | Description | Selected |
|--------|-------------|----------|
| Own PR, top of stack | Approvable without reading; out of every other PR's diff. | ✓ |
| Own PR, bottom of stack | Code comments referencing phase artifacts resolve within the stack. | |
| Excluded from the stack entirely | Cleanest review surface; criterion 7 would need restating as "code-identical". | |

### Handling the `frontend/`→`apps/frontend/` + `backend/` removal

| Option | Description | Selected |
|--------|-------------|----------|
| Rename-only PR first, content after | Pure moves; near-empty diff. Requires reconstructing a commit history doesn't contain. | ✓ |
| One restructure PR, rely on rename detection | Honest to history; files that moved *and* changed still render as rewrites. | |
| You decide during planning | Defer until the moved-and-changed count is measured. | |

---

## Comment-hygiene verdicts

Grounded in a measured breakdown of the 614 refs: 601 `Phase NN`, 93 `D-NNN-NN` decision IDs, 39 spike refs,
36 `v2.NN` milestone refs, 20 literal `.planning/` paths. Zero `[PR review]` tags.

### Sweep scope

| Option | Description | Selected |
|--------|-------------|----------|
| Refs only | Bounded, low-risk; Addendum rule 4 goes unexercised. | |
| Refs + prune comments the code makes redundant | Exercises rule 4 without rewriting code; judgement-heavy. | ✓ |
| Refs + full rule-4 pass incl. code changes | Highest fidelity; changes behaviour-adjacent code late. | |

### Rule for surviving references

| Option | Description | Selected |
|--------|-------------|----------|
| Collapse to bare "see phase N / spike N" | Mechanical, uniform, grep-verifiable. | ✓ |
| Delete by default; keep only unexplainable constraints | Fewest refs shipped; more rewriting. | |
| Keep the why, cite nothing internal | No GSD artifact cited at all; loses the trail back. | |

### CLAUDE.md and agent-facing root docs

| Option | Description | Selected |
|--------|-------------|----------|
| Exempt — they're planning artifacts | Ride in the planning PR with citations intact. | ✓ |
| Exempt but move to the planning PR | Same, plus explicit relocation out of code PRs. | |
| Subject to hygiene like everything else | Consistent; strips the precision future agent sessions rely on. | |

### Verdict authority for the 614 refs

| Option | Description | Selected |
|--------|-------------|----------|
| Codemod for the mechanical part, agent for the rest | Cheap, auditable, greppable proof. | ✓ |
| Agent per file, written rule, no codemod | No blind rewriting; much larger fan-out. | |
| Codemod + your spot-check gate | Adds a human checkpoint on the widest-touching sweep. | |

---

## Checklist sweep & disposition record

### Where the disposition is recorded

| Option | Description | Selected |
|--------|-------------|----------|
| Phase artifact, one row per item × slice | Complete, auditable, single view. | ✓ |
| In each PR body | Evidence next to the diff; no whole-diff view. | |
| Both — artifact canonical, PR bodies excerpt | Satisfies criterion 1 literally and serves the reviewer; two representations to sync. | |

### What counts as "addressed" for automation-covered items

| Option | Description | Selected |
|--------|-------------|----------|
| Cite the gate, verify it actually covers the slice | Honest about blind spots (axe reaches 7 voter routes × 2 themes only). | ✓ |
| Cite the gate, full stop | Fast; risks recording "met" for never-reached surfaces. | |
| Manual verification regardless | Highest confidence, most expensive by far. | |

### Sweep fan-out

| Option | Description | Selected |
|--------|-------------|----------|
| Agent per checklist item, within a slice | One lens per agent, applied consistently — the Addendum's own suggestion. | ✓ |
| Agent per file group, all items at once | Fewer agents; a 30-item checklist gets applied unevenly. | |
| Agent per checklist section | Matches the checklist's own structure; coarse. | |

### Standard for OWASP / WCAG over a 2,828-file diff

| Option | Description | Selected |
|--------|-------------|----------|
| Exhaustive on reachable surfaces, declared elsewhere | Exhaustive where the issues live; everything else recorded as not-swept with a reason. | ✓ |
| Threat-model-first, then targeted | Focused; the model itself becomes the thing that can miss something. | |
| Automated scanners plus manual pass on new surfaces | Cheapest defensible; leans on tools not yet wired up. | |

---

## Stack mechanics & CI

### Relationship to the 1 commit `origin/main` gained (`ac30f132a`)

| Option | Description | Selected |
|--------|-------------|----------|
| Rebase onto current origin/main | PR #1 current with its base; byte-identity target becomes branch-merged-with-main. | ✓ |
| Target the merge-base, don't rebase | Plain tree-hash equality, no caveat; PR #1 shows as behind main. | |
| Rebase, and fold the one commit into the baseline | Branch fast-forwarded to match; both current with main. | |

### Byte-identity proof

| Option | Description | Selected |
|--------|-------------|----------|
| `git diff --stat` empty + tree-hash equality | Two independent one-liner checks, both recordable and reproducible. | ✓ |
| Tree-hash equality alone | Cryptographically sufficient; no readout of what differs on failure. | |
| Checked-in verification script | Re-runnable as branches move; one more thing to maintain. | |

### CI posture

| Option | Description | Selected |
|--------|-------------|----------|
| Let PR #1 run; red is acceptable and annotated | Free signal on the base; visible red X. | |
| Open PR #1 as draft to suppress CI | Cleanest-looking stack; loses the one CI datapoint. | |
| Verify the full suite on the branch tip instead | Matches "only the whole matters"; honours the cardinal rule where it's meaningful. | ✓ |

**Notes:** `main.yaml` triggers on `pull_request` scoped to `branches: [main]`, so PR #1 fires CI regardless
of this choice and the stacked PRs fire nothing. The decision is about which signal is the *gate*, not about
suppressing the run. Carried into CONTEXT.md D-24 as a planner note.

### Branch naming and backup location

| Option | Description | Selected |
|--------|-------------|----------|
| `ship/v0.2-akita-NN-<slice>`, backup as a sibling worktree | Ordered and greppable; backup pins `94be73a61`. | ✓ |
| `v0.2/<slice-name>`, backup as a tag + worktree | Tag survives worktree cleanup. | |
| You decide during planning | Any ordered, greppable scheme with the pre-sweep tip pinned. | |

---

## Rebase conflict resolution

Raised after inspecting `ac30f132a`: it modifies `docs/src/routes/+page.svelte` and adds
`docs/static/images/youthvotes-logo.png`, both of which this branch moved to `apps/docs/` — so the chosen
rebase produces a rename/delete conflict on exactly those two paths.

| Option | Description | Selected |
|--------|-------------|----------|
| Port to `apps/docs/`, keep the YouthVotes content | Nothing from main lost; needs its own commit and disposition line. | ✓ |
| Keep our side, note it for a follow-up | Stack stays purely v0.2 work. | |
| You decide during planning | Let the planner pick once the rebase is attempted. | |

**Notes:** The user reinforced this mid-discussion with the direct instruction *"Move the files to their
logical new location"* — confirming the port follows the restructure rather than being dropped or left at
the old path.

---

## Codify as a skill

| Option | Description | Selected |
|--------|-------------|----------|
| In scope, written last from what was learned | Drafted from what the sweeps and split actually taught. | ✓ |
| Defer to its own phase | Avoids writing under the phase's load; written from experience later. | |
| In scope, drafted as you go | Best freshness; running documentation obligation per plan. | |

---

## Parallel-session contract

| Option | Description | Selected |
|--------|-------------|----------|
| Frozen — the stack ignores it entirely | Simplest; keeps the byte-identity proof stable against a moving target. | ✓ |
| Sweep fixes propagate to the continuation branch | Keeps both branches honest; per-fix sync obligation. | |
| You decide during planning | Depends on observed divergence. | |

---

## Claude's Discretion

- Exact slice boundaries within the two segments (subject to the 8–12 target and criterion 6).
- The written rule hygiene agents apply to the codemod residue, and what counts as a comment "the code
  makes redundant".
- Mechanics of reconstructing the pure-rename commit for PR #1.
- Whether the disposition matrix is one file or one per slice, so long as a single canonical view exists.

## Deferred Ideas

- Propagating sweep fixes to `feat-v02-akita-continued` after the stack is reviewed.
- Escape hatch for a sweep finding whose fix breaks the E2E suite (fix bar vs cardinal rule).
- Precise ordering of criterion 4.1 (planning → one commit) against 4.2 (other docs → one commit) given
  1,425 docs commits.
- Whether the `[db]` tag is applied retroactively to historical commits or only to restructured ones.

These three were offered at the exit gate; the user chose to proceed to context rather than open them.

## Todos reviewed, not folded

`todo.match-phase 151` returned four matches, all scored 0.9 on generic keyword/area overlap with a
ship/review phase and none in scope: generalize-candidate-app-to-party-app, post-runes header/banner
recheck, disabled Results header button hover, results view-transition flicker.
