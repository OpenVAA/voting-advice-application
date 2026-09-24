---
phase: 160-agent-docs-skills-refresh
plan: 04
subsystem: docs
tags: [skills, decision-record, progressive-disclosure, routing, todos, link-integrity]

requires:
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 01's `.claude/scripts/audit-skill-links.sh`, which audited every path citation this record writes"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 02's re-measurement of RESEARCH assumption A2, amended into the phase-wide probe-reconciliation record here"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 03's schema-reference census, which became the live premise of the schema todo filed here"
  - phase: 156-schema-rename
    provides: the banded schema filenames against which the planned dangling-citation premise was re-measured to zero
  - phase: 152-comment-and-naming-hygiene
    provides: the planning-reference scan in `yarn lint:check` that every line written here satisfies
provides:
  - "`.claude/skills/README.md` — the corpus decision record, shipping with the corpus rather than in `.planning/`"
  - "A commit-anchored corpus measurement with its reproducing commands inline, and both pre- and post-deletion figures"
  - "The below-threshold verdict with both boundary conditions that would flip it"
  - "The one-level routing rule in two mechanically checkable clauses (depth, discriminativeness), each with one live violation named and the Plan 09 check that will score it"
  - "Four recorded judgements: the spike-findings DELETE with its rejected git-history premise, the `CLAUDE.md` trim with its deliberately-kept list, the component-listing sync choice, and the phase boundaries"
  - "Two `.planning/todos/pending/` filings with re-derived, anchored items"
  - "`2026-08-28-claude-md-stale-factual-claims.md` closed into `.planning/todos/completed/`"
affects: [160-05, 160-06, 160-07, 160-08, 160-09]

actuals:
  tokens: 11849
  tasks: 3
  commits: 3
plan_head_before: e8052177cfa9899c6dc4012bf1ab2abad12de196

tech-stack:
  added: []
  patterns:
    - "A measurement record excludes its own bytes from the corpus it measures (`-not -path '.claude/skills/README.md'`), so the recorded figure stays reproducible as the record grows"
    - "A corpus figure is recorded with the commit it was taken at, and with both sides of any change the same phase is about to make"
    - "An asserted rule names the instrument that will score it, rather than relying on a reader agreeing with it"

key-files:
  created:
    - .claude/skills/README.md
    - .planning/todos/pending/2026-08-28-dangling-schema-citations-database-skill.md
    - .planning/todos/pending/2026-08-28-broken-docs-script-references.md
  modified:
    - .planning/phases/160-agent-docs-skills-refresh/160-04-PLAN.md
    - .planning/todos/completed/2026-08-28-claude-md-stale-factual-claims.md

key-decisions:
  - "Every corpus command in the record excludes `.claude/skills/README.md` itself. Without the exclusion the recorded total includes the record's own bytes, so writing the next paragraph falsifies the number — the figure would be a snapshot, not a reproducible measurement. With it, `find .claude/skills -name '*.md' -not -path '.claude/skills/README.md' -exec cat {} + | wc -c` reproduces 488,843 exactly."
  - "The one-level rule is written as TWO checkable clauses — routing depth and description discriminativeness — and the word 'single' from the plan's must_have is explicitly resolved rather than inherited: the depth clause has exactly one live violation (the spike-findings three-hop chain), the discriminativeness clause has exactly one (six of eight descriptions opening `Domain expert for the`), and they are different artifacts."
  - "The schema todo's planned premise was re-measured to ZERO and the todo re-premised rather than written to the plan's text. All 19 distinct three-digit `.sql` names the `database` skill cites resolve in `apps/supabase/supabase/schema/`; the live defect of that class is `schema-reference.md:3` claiming completeness for 17 tables from 18 files against a live 20 from 25."
  - "Both todos carry `resolves_phase: null` rather than a phase number. Phase 156 (the schema owner) and Phase 153 (the tooling owner named by operator decision O4) have both completed, as has 163; naming a finished phase would make the item read as scheduled work that is never coming."
  - "The probe-reconciliation appendix row 2 was rewritten IN PLACE, with a dated amendment log beneath, rather than annotated. An addendum alone leaves the stale premise readable as the record."
  - "The workflow's trigger set was re-derived and the plan's premise corrected: `main.yaml` triggers on push to `main` OR to a `ci-evidence/**` branch, and on pull-request events targeting `main`. The blocked-CI conclusion survives unchanged, because `paths-ignore: '**.md'` applies to every one of those triggers and this phase is all-Markdown."

patterns-established:
  - "Self-excluding measurement: a record that measures a corpus it lives inside excludes its own path in every command, and says why."
  - "Rule-with-instrument: where the record asserts a rule, it names the audit check that will score it — one hop, no second index."
  - "Re-premised filing: when a planned todo's premise re-measures to zero, the filing records the disproof FIRST and then carries the live defect of the same class, rather than being written to the plan's stale text or silently dropped."

requirements-completed: [REVIEW-DOC-03, REVIEW-DOC-04]

coverage:
  - id: D1
    description: "`.claude/skills/README.md` records the corpus measurement — total, generated share, hand-authored remainder and `CLAUDE.md` — with the exact reproducing command inline for each row, commit-anchored at `e8052177c` / 2026-09-13"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "recorded 488,843 == fresh `find .claude/skills -name '*.md' -not -path '.claude/skills/README.md' -exec cat {} + | wc -c`; grep -c 'find .claude/skills' -> 3; grep -c 'wc -c' -> 5"
        status: pass
      - kind: other
        ref: "grep -cE '[0-9a-f]{7,40}' -> 4 (commit); grep -cE '20[0-9]{2}-[0-9]{2}-[0-9]{2}' -> 1 (date)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both pre- and post-deletion figures are recorded, so re-running the commands after Plan 07 distinguishes this phase's change from drift"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "README § The corpus carries a pre/post table: 42 files / 488,843 B -> 15 files / 199,705 B, with the 27-file / 289,138 B deletion itemised by directory"
        status: pass
    human_judgment: false
  - id: D3
    description: "The threshold verdict is recorded with its one-step-either-side behaviour and its two rejected alternatives, quoting the review triage rather than the papers"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "grep -ci 'threshold' -> 3; grep -c 'PRE-SHIP-REVIEW-TRIAGE' -> 2; boundary sentence at the `Numeric:` bullet carries both a numeral and 'would'/'crossover'"
        status: pass
    human_judgment: false
  - id: D4
    description: "The one-level routing rule is asserted in two checkable clauses with one live violation named per clause, hop by hop"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "grep -ci 'one-level|one routing level|one hop|never two' -> 3; grep -c 'Feature Areas|Source Files' -> 2; description stems re-derived: 6 of 8 SKILL.md descriptions open `Domain expert for the`"
        status: pass
    human_judgment: false
  - id: D5
    description: "The `spike-findings` deletion judgement is an argument — redundancy method and result, superset fact, quantified cost, in-tree preservation basis — and it explicitly rejects the git-history basis"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "13 of 17 sources hash-identical under whitespace/quote/emphasis normalisation; the remaining 4 identical as sorted alphanumeric word bags; 25 spike dirs vs 17 wrapped; cost 115,036 B = 29,487 + 85,549"
        status: pass
      - kind: other
        ref: "git ls-tree -r main --name-only .claude/ -> .claude/settings.json only; git merge-base --is-ancestor 14afb2d80 main -> non-zero; main's recent merges carry squash signatures"
        status: pass
    human_judgment: true
    rationale: "Whether the recorded reasoning reads as an argument a future maintainer can re-evaluate — rather than a verdict with citations attached — is a reading judgement no grep makes. The plan's own `<verify>` carries this as a `<human-check>`."
  - id: D6
    description: "The `CLAUDE.md` decision, its reasoning, its two rejected options and its deliberately-kept list are recorded, quoting the review triage"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "kept-item loop over 'cardinal', 'preflight', 'db:\\*', 'svelte-warning' prints nothing; all four confirmed live at CLAUDE.md:46, :54, :80, :392 before being listed"
        status: pass
    human_judgment: false
  - id: D7
    description: "The component-listing sync evaluation names all four mechanisms with measured costs and states the chosen combination"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "grep -ci link/copy/generate/'targets:' -> 10/1/8/7; delta re-derived multiline-aware: 104 live entries / 103 unique names vs the listing's 98 / 97 — 7 live names absent, 1 listed name gone"
        status: pass
      - kind: other
        ref: "churn 90d: component dirs 13/13/11 vs existing target dirs 6 (data), 3 (filters), 2 (matching), 79 (supabase)"
        status: pass
    human_judgment: false
  - id: D8
    description: "All three phase boundaries are recorded with anchors, including the blocked CI observation with its real trigger set"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "grep -c 'Phase 153' -> 1; 'Phase 163' -> 1; 'O4' -> 3; 'blocked' -> 1; BOUNDARIES rows re-derived: 13 distinct lines of 85"
        status: pass
      - kind: other
        ref: "drift guard fresh run -> `Checked: 5  Drifted: 1  Skipped: 3`, exit 1 — the 'inert' claim is false and the correction is recorded"
        status: pass
    human_judgment: false
  - id: D9
    description: "Everything this phase declines is filed in `.planning/todos/pending/` with re-derived counts and anchors, and the resolved todo is closed"
    verification:
      - kind: other
        ref: "both todos present with `resolves_phase:` and `files:`; 13 file-extension anchors in the docs-script todo; schema todo's 20/25/17 figures equal a fresh census; claims todo moved to todos/completed/ with a per-claim closing note"
        status: pass
    human_judgment: false
  - id: D10
    description: "No protected planning document was edited, and the corpus gained 39 citations with zero new dangling"
    verification:
      - kind: other
        ref: "git diff --name-only e8052177c..HEAD | grep -cE '^\\.planning/(ROADMAP|REQUIREMENTS|STATE)\\.md$' -> 0"
        status: pass
      - kind: other
        ref: "whole-corpus audit-skill-links.sh: Checked 704 -> 743, Dangling 327 -> 327"
        status: pass
      - kind: other
        ref: "yarn lint:check -> exit 0, read directly from $? on the command itself"
        status: pass
    human_judgment: false

duration: 20 min
completed: 2026-09-13
status: complete
---

# Phase 160 Plan 04: The Recorded Corpus Decision Summary

**`.claude/skills/README.md` written as the corpus's own decision record — a commit-anchored, self-excluding byte measurement with its reproducing commands inline, a below-threshold verdict with both boundary conditions that would flip it, the one-level routing rule split into two mechanically checkable clauses with one live violation named per clause, and four judgements recorded as arguments including the explicit rejection of the false "available from git history" premise.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-13T17:14:24Z
- **Completed:** 2026-09-13T17:34:49Z
- **Tasks:** 3
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- **The measurement is reproducible, not merely recorded.** Every figure carries its command, and every command excludes the record's own bytes — without that exclusion the recorded total would be falsified by the next paragraph written into the file.
- **The git-history premise is measured and rejected in the record itself**, so the next reader inherits the corrected basis (`.planning/spikes/` stays in tree) rather than the false one.
- **The plan's own stale premises were re-derived and corrected rather than transcribed** — three of them (below), including one that reversed a todo's entire subject.
- **Four inherited items dispositioned**, three as filings and one as an in-place amendment to the phase-wide probe-reconciliation record.

## Task Commits

1. **Task 1: the corpus measurement, threshold verdict and routing rule** — `cb85fd973` (docs)
2. **Task 2: the four judgements** — `7d2ae614e` (docs)
3. **Task 3: file everything declined, with anchors** — `4452f0735` (docs)

**Plan metadata:** the commit carrying this file, `docs(160-04): complete the recorded corpus decision plan`. Named by message rather than by hash, because a summary cannot contain the hash of the commit that introduces it.

_`actuals.commits: 3` counts the task commits, measured as `git rev-list --count e8052177c..HEAD` at SUMMARY-write time, before the metadata commit existed. Counting from `plan_head_before` through the metadata commit gives **4** — the same convention plans 01, 02 and 03 of this phase used (each records N task commits against a rev-list of N+1)._

## Files Created/Modified

- `.claude/skills/README.md` — the corpus decision record: § The corpus, § The disclosure threshold, § The routing rule, § Judgements (four), § Adding a skill.
- `.planning/todos/pending/2026-08-28-dangling-schema-citations-database-skill.md` — the `database` skill's false completeness claim, with the disproof of the planned premise recorded first.
- `.planning/todos/pending/2026-08-28-broken-docs-script-references.md` — six broken delegations, three riders, one declined option.
- `.planning/todos/completed/2026-08-28-claude-md-stale-factual-claims.md` — moved from `pending/`, with a per-claim closing note and the command-block audit it asked for.
- `.planning/phases/160-agent-docs-skills-refresh/160-04-PLAN.md` — probe-reconciliation row 2 amended in place, plus an amendment log.

## Re-derived figures (the plan required every one of these to be re-measured, not copied)

All at `e8052177c`, 2026-09-13.

| Figure | Planning-time value | Re-derived | Command |
| --- | --- | --- | --- |
| Corpus total | 42 files / 464,728 B | **42 files / 488,843 B** | `find .claude/skills -name '*.md' -not -path '.claude/skills/README.md' -exec cat {} + \| wc -c` |
| Generated skill | 26 / 288,325 B | **26 / 288,325 B** (unchanged) | same `find` rooted at the skill dir |
| Hand-authored | 16 / 176,403 B | **16 / 200,518 B** | same `find` with the skill dir excluded |
| `CLAUDE.md` | 26,149 B | **30,555 B** | `wc -c CLAUDE.md` |
| Sources redundancy | 13 of 17 identical | **13 of 17** identical under normalisation; **all 4** residual identical as sorted word bags | two-pass comparison against `.planning/spikes/*/README.md` |
| Spike superset | 24 dirs, skill wraps 16 | **25 dirs, skill wraps 17** | `ls -d .planning/spikes/*/` vs `ls -d …/sources/*/` |
| Unique-synthesis cost | 115,036 B | **115,036 B** (29,487 + 85,549) | `wc -c` on `SKILL.md` and `cat references/*.md` |
| `main..HEAD` | 46 commits | **991 commits** | `git rev-list --count main..HEAD` |
| Component listing delta | +4 live, 0 gone | **+7 live, 1 gone** (104 entries / 103 names live vs 98 / 97 listed) | node script replicating `/<!--\s*@component\s*([\s\S]*?)-->/i` over the three `COMPONENT_DIRS` |
| Component-dir churn (90d) | 2 / 3 / 2 | **13 / 13 / 11** | `git rev-list --count --since='90 days ago' HEAD -- <dir>` |
| `BOUNDARIES.md` rows needing edit | 14 of 85 | **13 of 85** (the `:15` row is in two sets and was double-counted) | union of the architect, stale-path and Svelte-4 row sets |
| Dangling schema citations | 15 names / 51 sites | **0** — all 19 cited three-digit `.sql` names resolve | `grep -rhoE '[0-9]{3}[a-z0-9_-]*\.sql' .claude/skills/database/ \| sort -u` vs `ls apps/supabase/supabase/schema/` |
| Corpus link baseline | 350 of 678 (Plan 01) | **327 of 743** after this plan (was 327 of 704 before it) | `bash .claude/scripts/audit-skill-links.sh` |

## Inherited items — disposition

| # | Item | Disposition |
| --- | --- | --- |
| 1 | `schema-reference.md:3` claims completeness for 17 tables / 18 files against a live 20 / 25, omitting `admin_jobs`, `feedback`, `feedback_rate_limits` | **Filed**, re-derived independently, as the live subject of `2026-08-28-dangling-schema-citations-database-skill.md`. One extra defect found while measuring: a naive census returns 18 because `schema-reference.md:239` opens an index row with the same `**name** (file.sql)` prefix; the todo's command carries the `sort -u` that fixes it and says why. |
| 2 | `apps/frontend/svelte.config.js:13` declares `$voter` → a directory that does not exist, 0 importers | **Filed** as Rider 3 of `2026-08-28-broken-docs-script-references.md`, re-verified (`apps/frontend/src/lib/voter` absent; `grep -rn '\$voter' apps/frontend/src` → 0). |
| 3 | Plan 02's A2 finding: no enforcement, but four supporting symbols exist | **Amended in place** — probe-reconciliation row 2 rewritten to name all four with re-derived anchors, plus an amendment log stating why an addendum was refused. Note `getCombinedElections()` is at `packages/data/src/root/dataRoot.ts:550`, **not** under `src/objects/`. |
| 4 | Corpus figures had moved under this plan | **Re-derived throughout** — see the table above; five of thirteen figures had moved. |

## Decisions Made

See `key-decisions` in the frontmatter. The two that most affect later readers:

- **The self-excluding measurement.** A record that lives inside the corpus it measures must exclude itself or its own number is false the moment it grows. This is recorded in the README as a sentence, not just enforced in the command.
- **`resolves_phase: null` on both todos.** Every candidate owner phase has already executed. Writing a finished phase number into `resolves_phase` is the same defect class as a stale listing: it reads as an assurance that the work is scheduled.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The schema todo's entire premise was false against the tree**

- **Found during:** Task 3
- **Issue:** The plan instructs the todo to carry "the distinct retired schema filenames, the total number of places they are cited, and the per-file distribution", anchored to Phase 156. Re-measured at `e8052177c`, that class is **empty**: all 19 distinct three-digit `.sql` names cited across `.claude/skills/database/` resolve in `apps/supabase/supabase/schema/`. Phase 156 landed and the citations were repaired by hand. Writing the todo as instructed would have filed a defect that does not exist.
- **Fix:** The todo records the disproof first, with its command, then carries the live defect of the same class — the false completeness claim at `schema-reference.md:3` — plus the one genuinely package-relative citation at `database/SKILL.md:31`. The retired-to-live mapping is stated as empty so the next reader does not go looking for it.
- **Files modified:** `.planning/todos/pending/2026-08-28-dangling-schema-citations-database-skill.md`
- **Verification:** todo's 20 / 25 / 17 figures equal a fresh census; missing set equals `admin_jobs feedback feedback_rate_limits`.
- **Committed in:** `4452f0735`

**2. [Rule 1 - Bug] Both todos' prescribed owner phases have already executed**

- **Found during:** Task 3
- **Issue:** The plan anchors the schema todo to Phase 156 and the docs-script todo to Phase 153. `ROADMAP.md`'s progress table (read-only) shows 156 Complete 2026-08-30, 153 Complete 11/11, 163 Complete 2026-09-04 — Phase 160 is the last phase of this milestone to execute. A `resolves_phase` naming a finished phase makes the item read as scheduled work that will never be picked up.
- **Fix:** Both carry `resolves_phase: null` (the established convention — six pending todos already use it) with `related_phase` set, and each has an `## Owner` section naming the class owner (Phase 156 / operator decision `O4`'s Phase 153) *and* stating that the phase has completed, so the provenance is not lost.
- **Files modified:** both new todos
- **Verification:** `grep -q 'resolves_phase:'` passes on both; roadmap untouched.
- **Committed in:** `4452f0735`

**3. [Rule 1 - Bug] The workflow's trigger set is wider than the plan states**

- **Found during:** Task 2
- **Issue:** The plan (and `O4`) state that `.github/workflows/main.yaml` "triggers only on push or pull request to `main`". Re-read at `e8052177c`, it also triggers on push to any `ci-evidence/**` branch — an evidence channel added by Phase 163. Recording the narrower claim would have handed a false premise to the next reader, which is the exact defect class this plan's own prohibitions name.
- **Fix:** Judgement 4 records the full trigger set and shows the blocked-CI conclusion surviving it: `integration/ship-12-squash` matches none of the three trigger forms, and `paths-ignore: "**.md"` applies to every one of them, so an all-Markdown phase produces no run even on `main` or on the evidence channel.
- **Files modified:** `.claude/skills/README.md`
- **Verification:** `sed -n '1,52p' .github/workflows/main.yaml` read directly; `grep -ci 'blocked'` → 1 with the reason in the same paragraph.
- **Committed in:** `7d2ae614e`

**4. [Rule 2 - Missing Critical] The measurement had to exclude its own file**

- **Found during:** Task 1
- **Issue:** The plan's commands (`find .claude/skills -name '*.md' …`) include `.claude/skills/README.md` once it exists. The acceptance criterion demands the recorded figure equal a fresh run — which the plan's own command form makes impossible, since every edit to the record changes the total it reports.
- **Fix:** Every corpus command in the record carries `-not -path '.claude/skills/README.md'`, and the record states in prose why. The figure now reproduces exactly: recorded 488,843 == fresh 488,843.
- **Files modified:** `.claude/skills/README.md`
- **Verification:** fresh run equals the recorded figure after three subsequent edits to the file.
- **Committed in:** `cb85fd973`

**5. [Rule 3 - Blocking] Three path citations were dangling against the link auditor**

- **Found during:** Tasks 1 and 2
- **Issue:** `bash .claude/scripts/audit-skill-links.sh .claude/skills/README.md` is an acceptance criterion for both tasks, and reported `references/`, `sources/` and `integration/ship-12-squash` as dangling.
- **Fix:** The two directory citations were made repo-relative; the branch name was un-backticked, because it is not a path and exempting it with a `skill-link-allow` marker would have misused a mechanism documented for hypothetical *paths*.
- **Files modified:** `.claude/skills/README.md`
- **Verification:** `Checked: 39  Dangling: 0`, exit 0.
- **Committed in:** `cb85fd973`, `7d2ae614e`

---

**Total deviations:** 5 auto-fixed (3 × Rule 1 bugs, 1 × Rule 2 missing critical, 1 × Rule 3 blocking)
**Impact on plan:** No scope change. Three of the five are the plan's own stated facts re-measured false at execution time, which is the phase's standing practice rather than a surprise; recording them as written would have propagated false premises into the artifact this plan exists to make trustworthy.

## Acceptance criteria evaluated with a substituted command

One criterion specifies a pattern that cannot match the content it is checking. Recorded rather than reported as a vacuous pass, per this phase's standing practice:

- **Task 2, "the unique-synthesis cost is quantified … grep the subsection for a numeral of four or more digits."** `grep -coE '[0-9]{4,}'` over the Judgement 1 subsection returns **0**, because every figure in the corpus record is written with digit grouping (`115,036`). Substituted `grep -coE '[0-9][0-9,]{3,}'` → **17 matches**, including the `115,036 B` cost figure and its two operands `29,487` and `85,549`. No content was reformatted to satisfy the literal pattern; the criterion's intent (the cost is quantified in the deletion subsection) is met.
- **Task 2, "the deliberately-kept list has all four items."** The plan's loop patterns are `cardinal`, `preflight`, `db:\*`, `svelte-warning`. Mapping to the wording used: `cardinal` → "The E2E hard rule — \"cardinal failure\" — and its no-flaky-exemption clause"; `preflight` → "The E2E preflight contract and its port escape hatch"; `db:\*` → "The database-only versus full-stack script naming split", which names `db:*` and `dev:*` literally; `svelte-warning` → "The accepted-Svelte-warning comment format". The loop prints nothing.

No degenerate `awk '/^## X/,/^## /'` range idiom was relied on: section extraction used `awk '/^### Judgement 1/,/^### Judgement 2/'`, whose end pattern is a different literal from its start pattern and therefore does not collapse to the heading line.

## Issues Encountered

- **`perl -0pi -e` with paths containing `/` and `-gsd` broke on modifier parsing.** Switched to individual `Edit` calls, which is the right tool for six targeted substitutions anyway.

## Verification results

| Plan-level check | Result |
| --- | --- |
| `test -f .claude/skills/README.md` | pass |
| `bash .claude/scripts/audit-skill-links.sh .claude/skills/README.md` | `Checked: 39  Dangling: 0`, **exit 0** |
| Recorded total-bytes == fresh `find … \| wc -c` at the same commit | 488,843 == 488,843 |
| Both todos exist with `resolves_phase` and anchored items | pass (13 extension-anchors in the docs-script todo) |
| `git diff --name-only` shows no `ROADMAP.md` / `REQUIREMENTS.md` / `STATE.md` | **0** across all three commits |
| `yarn lint:check` | **exit 0**, read directly from `$?` on the command itself, never through a pipe |
| `npx prettier --check` on every file written | pass |
| Whole-corpus link audit | `Checked: 743  Dangling: 327` — +39 citations, **+0 dangling** against the pre-plan `704 / 327` |

**Not claimed:** CI did not verify this work and could not. `.github/workflows/main.yaml` carries `paths-ignore: "**.md"` on every one of its three trigger forms, and this plan is Markdown-only. A green `audit-skill-drift.sh` is likewise not evidence — this phase's own commits reset its per-skill baseline, and a fresh run still exits 1 (`Checked: 5  Drifted: 1  Skipped: 3`).

**E2E:** not run by this plan and not owed by it. This plan touches no application code (five Markdown files under `.claude/` and `.planning/`), and the phase's full-suite gate is Plan 08's recorded scope. The cardinal rule is not waived — it is held where it can actually bind.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 05** can proceed: `.claude/skills/components/SKILL.md` is untouched by this plan, and Judgement 3 records the mechanism it should implement (link plus `targets:` directories, with the one-time regeneration) together with the directory-only constraint that keeps the guard from going inert.
- **Plan 06** has its pointer target: `.claude/skills/README.md` exists and reaches content in one hop, so the `CLAUDE.md § Skill Routing` entry it adds is itself conformant with the rule the README asserts.
- **Plan 07** has its gated recommendation: Judgement 1 carries an explicit "recorded recommendation, not yet a recorded outcome" marker and names what to update when the checkpoint resolves. Its post-deletion target figures are recorded: **15 files / 199,705 B** under the same self-excluding command.
- **Plan 08** inherits the corpus link baseline of `327 of 743` to measure against, and `BOUNDARIES.md`'s 13-of-85 row set with each line number.
- **Plan 09** inherits both rule clauses in mechanically checkable form and the two live violations its Check A and Check B should independently rediscover — and is expected to re-derive the corpus figures itself rather than copy this record's pre-deletion set.

---

_Phase: 160-agent-docs-skills-refresh_
_Completed: 2026-09-13_

## Self-Check: PASSED

- **Created files exist on disk:** `.claude/skills/README.md`, `.planning/todos/pending/2026-08-28-dangling-schema-citations-database-skill.md`, `.planning/todos/pending/2026-08-28-broken-docs-script-references.md` — all `[ -f ]` FOUND.
- **Modified files exist:** `.planning/todos/completed/2026-08-28-claude-md-stale-factual-claims.md`, `.planning/phases/160-agent-docs-skills-refresh/160-04-PLAN.md` — FOUND.
- **Commits exist:** `cb85fd973`, `7d2ae614e`, `4452f0735` — all FOUND in `git log --oneline --all`. The fourth commit in the range is the metadata commit carrying this file, verifiable as `git rev-list --count e8052177c..HEAD` → **4**; its hash is deliberately not quoted here, since a file cannot name the commit that introduces it.
- **No protected planning document touched:** `git diff --name-only e8052177c..HEAD | grep -cE '^\.planning/(ROADMAP|REQUIREMENTS|STATE)\.md$'` → 0.
