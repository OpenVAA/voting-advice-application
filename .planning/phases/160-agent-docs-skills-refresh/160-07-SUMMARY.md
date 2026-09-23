---
phase: 160-agent-docs-skills-refresh
plan: 07
subsystem: docs
tags: [skills, routing, deletion, one-way-door, checkpoint-decision, audit-skill-links, ugrep]

requires:
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 06's rewritten `CLAUDE.md § Skill Routing` — 7 entries, the architecture content already folded in as prose invoking no skill, and the spike-findings bullet deliberately left in place so its removal could be atomic with a deletion"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 04's `.claude/skills/README.md` — the recorded keep-or-delete argument (redundancy measurement, in-tree preservation basis, quantified cost, runner-up) that the human decided on at this plan's checkpoint"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 01's `.claude/scripts/audit-skill-links.sh` and its `skill-link-allow` exemption convention, used twice here"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 05's `.claude/skills/components/context-reactivity.md` and grown `components/SKILL.md` — the post-anchor additions that made Plan 04's corpus projection unreachable"
provides:
  - "`.claude/skills/architect/` deleted; 0 invocations survive; all 7 routing entries verified to name directories that exist"
  - "The operator's checkpoint decision `delete-sources-only` executed instead of the recommended `delete-whole`, with the argument-shift recorded so the change is re-evaluable"
  - "17 duplicate spike write-ups (173,289 B) removed after a per-file copy re-check; 59 unique non-Markdown spike-code files (186,701 B) KEPT after measurement showed they have no counterpart anywhere"
  - "`.claude/skills/README.md`'s corpus record corrected from an unreachable projection to measured pre/post figures, with the arithmetic reconciliation and the Markdown-only caveat stated"
  - "A first-class instrument finding: `grep` here is a shell function wrapping `ugrep`, which emits no `./` prefix, so every `grep -v '^\\./\\.planning/'` filter in phase 160's plans is vacuous"
affects: [160-08, 160-09]

actuals:
  tokens: 53727 # chars/4 over the realized diff, git diff 4199953f8..HEAD
  tasks: 3
  commits: 2
plan_head_before: 4199953f82b3dea8887a1734a619096773a6fc00

tech-stack:
  added: []
  patterns:
    - "A deletion record must be able to name what it deleted; the link guard cannot distinguish that citation from a live pointer, so the record carries a `skill-link-allow` marker and a sentence saying why."
    - "A redundancy proof is only as wide as the file glob that produced it. A `*.md` census cannot license deleting a directory that also holds 59 non-Markdown files."
    - "Report a falling defect count with the subtraction made explicit: removing the files that carried the defects is not repair."
    - "When a verdict changes, record which premise changed — not just the new verdict — or the next maintainer inherits a decision they cannot re-evaluate."

key-files:
  created: []
  modified:
    - .claude/skills/README.md
    - .claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md
    - .claude/skills/spike-findings-voting-advice-application-gsd/references/reactive-contexts.md
    - .claude/skills/spike-findings-voting-advice-application-gsd/references/migration-inventory-and-order.md
    - .claude/skills/spike-findings-voting-advice-application-gsd/references/context-orchestration.md
    - .claude/skills/spike-findings-voting-advice-application-gsd/references/consumer-migration-codemod.md
  deleted:
    - .claude/skills/architect/SKILL.md
    - .claude/skills/spike-findings-voting-advice-application-gsd/sources/*/README.md (17 files)

key-decisions:
  - "The checkpoint resolved to `delete-sources-only`, the recorded runner-up, NOT the recorded recommendation `delete-whole`. Reason recorded in the outcome record: the recommendation's ground (b) — that the runner-up leaves a rule-violating two-hop chain — was written before Plan 09 existed, and Plan 09 is chartered to dispose of exactly that violation by promoting or splitting. With (b) neutralised, the option that preserves unrecoverable unique content dominates."
  - "The 59 non-Markdown files under `sources/` were KEPT against the literal wording of BOTH the recommendation and the runner-up, which each said 'delete the sources/ directory'. Measurement at execution: 0 of the 59 have a counterpart under `.planning/spikes/`. Every byte-comparison behind the 'sources/ is pure duplication' finding had counted `*.md` only."
  - "`CLAUDE.md:341` was NOT edited. No skill directory was removed, so the pointer still names a directory that exists. Plan 06's one-bullet handoff applied only to the `delete-whole` branch; the must_have is satisfied here by keeping, not by removing."
  - "Two `skill-link-allow` exemptions were NOT needed where the coordinator anticipated them: `.claude/skills/README.md`'s depth-chain record at :85-86 cites the `sources/` and `references/` DIRECTORIES, both of which still exist. One exemption WAS needed, for the `architect` directory citation."
  - "The record's corpus projection (`15 files / 199,705 B`) was replaced rather than adjusted. It subtracted from an `e8052177c` baseline while Plans 04 and 05 were still adding to that same tree, so it was unreachable by construction, not merely stale."

patterns-established:
  - "Every acceptance-criterion idiom is executed and read before being relied on; a defective one is substituted and the substitution recorded per criterion, never reported as a pass."
  - "A per-file copy proof is re-run at execution time rather than carried from the record, and its file-type scope is stated as part of the result."

requirements-completed: [REVIEW-DOC-03]

coverage:
  - id: D1
    description: "`.claude/skills/architect/` deleted, with a repo-wide pre-delete sweep run and recorded first, and no surviving invocation"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "test -d .claude/skills/architect (fails) ; command grep -rn 'Skill(\"architect\")' --include='*.md' --include='*.json' --include='*.yaml' . | command grep -v '^\\./\\.planning/' -> 0 hits"
        status: pass
      - kind: other
        ref: "bash .claude/scripts/audit-skill-drift.sh -> no longer lists the removed skill; Skipped fell 2 -> 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "The operator's checkpoint decision `delete-sources-only` executed, not the recommendation, with the pointer left in place because nothing was removed that a pointer named"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "awk '/^## Skill Routing/,0' CLAUDE.md | grep -oE 'Skill\\(\"[a-z0-9-]+\"\\)' | ... test -d -> all 7 OK, none missing"
        status: pass
      - kind: other
        ref: "git show --name-only 2a2b03898 -> 17 D under sources/, 0 changes to CLAUDE.md"
        status: pass
    human_judgment: false
  - id: D3
    description: "The 17 removed write-ups were re-confirmed as zero-unique-wording copies per file before removal, and the 59 non-Markdown files were re-checked and kept"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "two-pass copy check over 17 pairs -> 13 checksum matches, 4 word-bag matches, 0 unmatched; sha256 check over 59 non-md files vs .planning/spikes -> 0 counterparts"
        status: pass
    human_judgment: false
  - id: D4
    description: "The record states the executed outcome alongside the argument that produced it, keeps the git-history rejection, and carries measured post-deletion figures"
    verification:
      - kind: other
        ref: "grep over .claude/skills/README.md: 'delete-sources-only' 3x in Judgement 1, date present, runner-up 4x, 'git history' 2x, 'squash-merge' 1x, 'not yet a recorded outcome' 0x"
        status: pass
    human_judgment: true
    rationale: "Whether the recorded argument is genuinely re-evaluable by a future maintainer — as opposed to merely present — is a reading judgement no grep can make. This is the plan's own `<human-check>`."
  - id: D5
    description: "No dangling citation introduced anywhere; corpus dangling count reported with the removal/repair subtraction made explicit"
    verification:
      - kind: other
        ref: "bash .claude/scripts/audit-skill-links.sh -> 627 checked / 212 dangling (from 779/327); README.md exit 0, 0 dangling; token-level diff -> 0 new dangling tokens"
        status: pass
    human_judgment: false

duration: 41 min
completed: 2026-09-13
status: complete
---

# Phase 160 Plan 07: Remove the Disposed Skills Summary

**The architecture stub deleted outright and the generated spike-findings skill reduced to its unique half — the operator overruled the recorded `delete-whole` recommendation for the runner-up `delete-sources-only`, and measurement at execution then saved 186,701 B of spike code that both options had been worded to destroy.**

## Performance

- **Duration:** 41 min
- **Tasks:** 3 (1 auto, 1 checkpoint:decision, 1 auto)
- **Files:** 24 changed — 6 modified, 18 deleted
- **Commits:** 2 (measured: `git rev-list --count 4199953f8..HEAD`)

## Accomplishments

- **`.claude/skills/architect/` removed** after a repo-wide pre-delete sweep found **0** surviving `Skill("architect")` invocations outside `.planning/`. The drift audit no longer lists it.
- **The one-way door was walked by a human, not by me.** I stopped at the checkpoint with the sweep output, the options verbatim, the recorded recommendation's four components re-derived, and a per-option irreversibility statement. The operator chose `delete-sources-only`.
- **17 duplicate spike write-ups (173,289 B) removed**, each re-confirmed against its `.planning/spikes/` counterpart first.
- **59 unique spike-code files (186,701 B) kept** — the single most consequential thing in this plan, see Deviations.
- **The record corrected** from an unreachable projection to measured figures, with the executed outcome, the argument shift, and the git-history rejection all in place.

## Task Commits

1. **Task 1: Sweep, then remove the architecture stub** — `976697667` (refactor)
2. **Task 2: `checkpoint:decision`** — no commit; stopped and returned structured state for the human
3. **Task 3: Execute the chosen disposition + record the outcome** — `2a2b03898` (refactor; amended once pre-report to fix two dangling citations my own README prose introduced)

## The checkpoint resolution, verbatim

> **DECISION: `delete-sources-only`. Execute this, not the recorded recommendation.**

With the reason the operator required be recorded: the recommendation rejected the runner-up partly because it "leaves a two-hop chain, which still violates the one-level rule this phase asserts" — **a ground written before Plan 09 existed**. Plan 09 is chartered to dispose of exactly that violation, by promoting or splitting, never by discarding. The runner-up's decisive defect became scheduled work, and the option preserving unrecoverable content dominated. This is written into `.claude/skills/README.md` § Judgement 1 under its own heading, *Why the outcome differs from the recommendation*, so a future maintainer sees that **the argument changed, not just the verdict**.

## Pre-delete sweeps

### Instrument defect found first — and it changes how every criterion in this phase reads

`grep` in this shell is **a shell function wrapping `ugrep`** (`/Users/kallejarvenpaa/.claude/shell-snapshots/…`), and **ugrep emits no `./` path prefix**. Every acceptance criterion in plans 07–09 filters `.planning/` with `grep -v '^\./\.planning/'`, which therefore **matches nothing — the filter is vacuous and `.planning/` hits pass straight through**. My first sweep run was contaminated by exactly this and reported dozens of `.planning/` hits as if they were live code references.

**Substitution used throughout: `command grep`**, which bypasses the function and does emit `./`. Recorded per criterion below.

Same class, independently confirmed: `awk '/^## Skill Routing/,/^## /' CLAUDE.md` collapses to **1 line**; `awk '/^## Skill Routing/,0'` yields the real **23**. The plans use the sound `,0` form.

### Sweep A — `architect` (run before the deletion)

| Hit | Classification |
| --- | --- |
| `Skill("architect")` — **0 hits** repo-wide outside `.planning/` | Expected; Plan 06 made the deletion pointer-free |
| `.claude/skills/README.md:25` | The deletion **record**, not a pointer — must survive |
| `.claude/skills/BOUNDARIES.md:15,19,57,58,59,60,81,83` (8 rows) | **Known scheduled residue → Plan 08.** Until Plan 08 lands, the ownership map names a skill that does not exist |
| `.claude/skills/README.md:78` ("six of the eight") | Stale independently of my change; re-derived to **four of seven** |
| `ROADMAP.md:32,34` (root, not `.planning/`) — `### openvaa-architect` | **Unrelated.** A product wish-list for a future skill under a different name. No edit |
| `.claude/skills/architect/SKILL.md:2` | The file being deleted |

### Sweep B — `spike-findings-voting-advice-application-gsd` (run before any removal, before the checkpoint)

**Exactly one invocation in the entire tree:** `CLAUDE.md:341`. Every other non-`.planning/` hit is inside `.claude/skills/README.md` — the record itself — at `:16, :17, :25, :59, :74, :77, :78, :82, :94, :105, :106, :108, :112, :122, :169`. **`BOUNDARIES.md` contains zero references to it**, so its disposition needs no ownership-map work.

Because the executed option removed no skill directory, `CLAUDE.md:341` **stays** and needed no edit.

## Acceptance criteria — substitutions recorded

| Criterion | Verdict |
| --- | --- |
| Sweep ran and was recorded before any deletion | **PASS** (both sweeps) |
| Fold landed: `awk '/^## Skill Routing/,0' CLAUDE.md \| grep -ci 'monorepo\|dependency flow\|cross-package'` ≥ 1 | **PASS** — returns 1 |
| `test -d .claude/skills/architect` fails | **PASS** |
| No `Skill("architect")` survives | **PASS** after substituting `command grep` — **the criterion as written is vacuous here** |
| No `skills/architect` reference outside the ownership map | **FAILS AS WRITTEN** (3 hits, all in `.claude/skills/README.md`). **PASS under the substituted form** that also excludes the record file — the same exclusion the plan's own Task 3 criterion grants it (`\| grep -v 'skills/README.md'`). Reported as a substitution, not as a pass |
| `grep -c 'spike-findings' CLAUDE.md` returns 0 | **DELIBERATELY NOT MET — returns 1.** This criterion is specific to `delete-whole`. Under `delete-sources-only` a 0 would mean a pointer was removed to a skill that still exists |
| Removal + pointer edit in one commit | **N/A by construction** — no pointer required removal |
| Every routing invocation names an existing directory | **PASS** — all 7 OK |
| `.planning/spikes/` intact and untouched | **PASS** — `test -d` succeeds; 0 paths under it in the plan's whole diff |
| Record keeps argument, cost, runner-up, git-history rejection, and adds outcome + date | **PASS** |
| Post-deletion corpus figures match a fresh re-derivation | **PASS** — 25 files / 333,557 B |
| `audit-skill-links.sh` shows no increase in dangling | **PASS** — 327 → 212, and a token-level diff confirms **0 new dangling tokens** |
| `yarn lint:check` green | **PASS** — exit 0 read from `$?` directly, never through a pipe |

## Measured figures

**The copy re-check (17 pairs), reproducing the record exactly:** 13 matched on the whitespace/punctuation-stripped checksum, 4 (`008`, `009`, `013`, `016`) on the sorted word bag, **0 unmatched**.

**The three git facts, re-derived rather than copied:**

| Fact | Command | Result |
| --- | --- | --- |
| `.claude/skills/` never on `main` | `git ls-tree -r main --name-only .claude/` | only `.claude/settings.json` |
| add commit not an ancestor | `git merge-base --is-ancestor 14afb2d80 main` | **exit 1** |
| repo squash-merges | `git log main -8`, branch name | flat subjects; `integration/ship-12-squash` |

**Corpus (Markdown only, README excluded per the record's own convention):**

| | Files | Bytes |
| --- | ---: | ---: |
| Pre-deletion, restated (the tree the deletions started from) | 43 | 506,527 |
| Removed: `architect` | 1 | 813 |
| Removed: 17 duplicate write-ups | 17 | 173,289 |
| Added back: rewritten § *Source Files* + 5 repoints | — | +1,132 |
| **Post-deletion, measured** | **25** | **333,557** |

**Dangling citations — with the subtraction made explicit.** 327 → 212, a fall of 115. **Only 5 of that is repair** (the citations repointed from `sources/*/README.md` to `.planning/spikes/*/README.md`, which now resolve). **The other 110 was carried BY the deleted copies** — that is removal, not hygiene, and the headline number invites exactly the opposite reading.

## Deviations from Plan

### 1. [Rule 2 — Missing Critical] The 59 non-Markdown files under `sources/` were kept against the literal wording of both options

- **Found during:** Task 3, while re-confirming the copy proof.
- **Issue:** Both the recommendation (`delete-whole`) and the runner-up (`delete-sources-only`) are worded as "delete the `sources/` directory (173,289 B)". That figure, and every byte-comparison behind the "pure duplication" finding, counted **`*.md` only**. `sources/` actually holds **76 files / 359,990 B**: the 17 write-ups plus **59 non-Markdown files (186,701 B)** — 43 `.svelte` harnesses, 15 `.svelte.ts` context/store implementations, 1 codemod script.
- **Measurement:** sha256 of each of the 59 against the same relative path under `.planning/spikes/` — **0 counterparts, 0 near-matches**. `.planning/spikes/` holds write-ups and essentially nothing else (30 `.md`, 2 `.ts`, 1 `.svelte` across 25 directories). The one apparent near-miss, `spike-009-store-codemod.mjs`, also exists at `.planning/archive/` but is **not** byte-identical.
- **Fix:** Deleted only the 17 `sources/*/README.md`; kept the directory and its 59 code files. This is the disposition the coordinator's own constraint mandates — *"Any file that does NOT match on re-check is not a provable copy: keep it and say so."*
- **Why it matters:** the reversibility basis this decision rests on is `.planning/spikes/` being the superset. For the 59 it is not a superset at all. Deleting them would have destroyed 186,701 B with no copy in the working tree and — by the same three git facts above — **no copy in `main`'s history either**. Had the checkpoint gone to `delete-whole`, the loss would have been **301,737 B**, not the 115,036 B the record quantified.
- **Committed in:** `2a2b03898`.

### 2. [Rule 1 — Bug] Deleting `architect` made `.claude/skills/README.md` dangle

- **Found during:** Task 1, immediately after the deletion.
- **Issue:** `README.md DANGLING 1 of 39`, token `.claude/skills/architect/`.
- **Fix:** the guard's own documented `<!-- skill-link-allow: -->` exemption plus a sentence stating why — a record of a deletion must be able to name what it deleted, and the guard cannot tell that citation from a live pointer. Follows the precedent already in that file.
- **Committed in:** `976697667`.

### 3. [Rule 1 — Bug] My own new README prose introduced 3 dangling citations

- **Found during:** Task 3 self-check, before reporting.
- **Issue:** a backticked bare extension in `SKILL.md`, and bare `` `sources/` `` / `` `references/` `` tokens in README prose — package-relative citations, the exact habit this file's own "Adding a skill" rule forbids.
- **Fix:** reworded the extension away; expanded both bare tokens to full repo-relative paths. Re-verified: **0 new dangling tokens** against the pre-task baseline, token-by-token.
- **Committed in:** `2a2b03898` (amend).

### 4. [Rule 1 — Bug] Three claims in `.claude/skills/README.md` were false once the skill survived

- **Found during:** Task 3.
- **Issue:** the file was written expecting `delete-whole`. Three statements became false: `:25` "this phase deletes two skill directories"; the depth-chain conclusion "the violation is not fixed in place, it is removed with the skill"; and the hand-flatten rejection "deleting it disposes of the same problem durably".
- **Fix:** all three rewritten to the executed outcome. The depth section now states plainly that **hop 3 is gone, hop 2 survives, and the violation is therefore LIVE** until Plan 09 lands — so the corpus asserts a one-level rule while carrying one acknowledged exception, and the reader learns that from the file rather than by measuring. The hand-flatten objection is recorded as **now standing against the executed outcome** (the surviving skill is machine-generated; the next `/gsd-spike --wrap-up` would overwrite the hand edit).
- **Committed in:** `2a2b03898`.

### 5. [Rule 2 — Missing Critical] The record's corpus projection was unreachable, not merely stale

- **Issue:** "Post-deletion (expected) 15 files / 199,705 B" subtracted from an `e8052177c` baseline, but that anchor **predates the commits of Plan 04 (which wrote the file) and Plan 05** (which added `context-reactivity.md`, 9,097 B, and grew `components/SKILL.md` 917 → 9,504 B).
- **Fix:** replaced with measured pre/post rows, plus an explicit reconciliation of why the rows do not subtract to the total (+1,132 B of text this phase added while removing copies), plus a caveat that every figure in the file is Markdown-only and the true on-disk size is ~520,000 B.
- **Committed in:** `2a2b03898`.

---

**Total deviations:** 5 (2 missing-critical, 3 bugs). **Impact:** deviation 1 changed what was deleted and is the plan's most consequential finding; the rest are accuracy repairs inside this plan's own blast radius. No scope creep — `BOUNDARIES.md` was deliberately left to Plan 08.

## Anticipated work that proved unnecessary

The coordinator's constraint 3 anticipated that `.claude/skills/README.md:74-78` would need `skill-link-allow` exemptions. **They did not.** Those lines cite the `sources/` and `references/` **directories**, both of which still exist under `delete-sources-only`. Recorded rather than silently skipped, because a later reader comparing instruction to outcome would otherwise read the absence as an omission.

## Issues Encountered

None unresolved. The `ship-review-stack  DRIFT` line in `audit-skill-drift.sh` is **pre-existing and out of scope** — it fires because Plan 01 added `.claude/scripts/audit-skill-links.sh` to a directory that skill declares as a target. Per `.claude/skills/README.md` § Judgement 4 and operator decision `O4`, drift resolution belongs to **Phase 153**, not here.

**No CI claim is made.** `.github/workflows/main.yaml` carries `paths-ignore: "**.md"` on every trigger and does not trigger on this branch at all; a green `audit-skill-drift.sh` is not evidence about this phase either. Every gate reported here was run locally.

## Next Phase Readiness

- **Plan 08 — inbound obligation with line anchors.** `.claude/skills/BOUNDARIES.md` still names the now-deleted `architect` skill at **`:15`, `:19`, `:57`, `:58`, `:59`, `:60`, `:81`, `:83`** (8 rows). Until these are re-homed the ownership map asserts ownership by a skill that does not exist. Plan 08 should also expect `:15`–`:18`, `:21` (paths moved under `apps/`) and `:64` (a Svelte 4 claim on a Svelte 5 codebase). **`BOUNDARIES.md` needs no edit for the spike-findings skill** — it never referenced it, and the skill survives anyway.
- **Plan 08 and Plan 09 both run criteria of the vacuous `grep -v '^\./\.planning/'` shape.** Use `command grep`. `grep` is a shell function wrapping `ugrep`, which emits no `./` prefix. Do not re-discover this.
- **Plan 09 Check A has a live violation to score, and it is now its chartered work.** The spike-findings chain is **two hops, not three**: `CLAUDE.md:341` → `SKILL.md § Feature Areas` (a table of 8 rows into `references/`) → content. § *Source Files* is no longer an index. Plan 09's disposition must **promote or split, never discard** — and note that the skill is machine-generated, so any hand flatten expires at the next `/gsd-spike --wrap-up`.
- **Plan 09 Check B: re-derive, do not carry.** Post-deletion the stem count is **four of seven** (`data`, `database`, `filters`, `matching`). Two superseded figures are in circulation (six of eight, five of eight); `.claude/skills/README.md` now names both as superseded.
- **Link baseline for Plan 09:** whole corpus `Checked: 627  Dangling: 212  Skipped: 173`. `.claude/skills/README.md` and `CLAUDE.md` are both individually `Dangling: 0`, exit 0.
- **No blockers.** `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` and `.planning/STATE.md` are unmodified by this plan, per CONTEXT.md § 0.1(c) — verified: 0 matching paths in `git diff --name-only 4199953f8..HEAD`.

---

_Phase: 160-agent-docs-skills-refresh_
_Completed: 2026-09-13_

## Self-Check: PASSED

- `key-files.modified` all present on disk; both deletions confirmed absent (`.claude/skills/architect` gone; 0 `sources/*/README.md` remaining, 59 non-Markdown files kept).
- Both task commits resolve in `git log --oneline --all`: `976697667`, `2a2b03898`.
- `commits: 2` is MEASURED, not narrated: `git rev-list --count 4199953f82b3dea8887a1734a619096773a6fc00..HEAD` at SUMMARY-write time.
- All Task 1 and Task 3 acceptance criteria re-run at SUMMARY time. Two are reported as substitutions and one as deliberately-not-met (the `delete-whole`-specific `grep -c 'spike-findings' CLAUDE.md` criterion); none is reported as a vacuous pass.
- Plan-level verification re-run: `audit-skill-links.sh` 627/212/173 with 0 new dangling tokens token-by-token; all 7 routing invocations resolve to existing directories; `.planning/spikes/` intact and untouched; `yarn lint:check` exit 0 read from `$?` directly.
- Prohibition honoured: 0 paths matching `(ROADMAP|STATE|REQUIREMENTS)\.md` in `git diff --name-only 4199953f8..HEAD`.
