---
phase: 151-ship-v0-2-akita-review-stack
plan: 19
subsystem: release-engineering
tags: [skill, codification, disposition, criterion-evidence-map, byte-identity, force-push, gate-discipline, phase-close]
status: complete

requires:
  - "151-18 (twelve slices published; criterion 6 approved; the binding handoff of the LAST slice-11 re-cut, with a one-branch force-push authorisation)"
  - "every summary 151-01 … 151-18 as source material — the skill is drafted from what happened, not from the brief"
provides:
  - ".claude/skills/ship-review-stack/ — the procedure codified, with all seven scripts attached byte-identically"
  - "F-88 closed: skill-drift-check exits 0; the first PR to main after the merge is no longer red on an unseen job"
  - "F-07 closed: the checklist's `any` item is a tickable GFM marker and the census returns its true 31"
  - "151-DISPOSITION.md § Criterion evidence map — seven re-runnable rows, one per ROADMAP criterion"
  - "151-DISPOSITION.md § Deferred and carried forward — the next phase inherits a list, not a search"
  - "151-VALIDATION.md validated on measured state: wave_0_complete true, nyquist_compliant true"
  - "F-89 raised: 151-18's own perf fix leaked a planning reference into shipped source"
  - "criterion 7 green AT REST as of 14afb2d80, reproduced by the operator rather than trusted"
  - "operator phase-close approval, given on reproduction of three claims rather than on reading"
  - "F-89 dispositioned as a post-merge follow-up WITH ITS FIX NAMED, so it is inherited rather than re-derived"
affects:
  - "whoever merges the stack — F-89 is open and needs an operator decision; F-81, F-86 and the two gsd-tools defects are post-merge"
  - "the next phase to run a large ship sweep — the skill is the durable carrier"

metrics:
  duration: "one session"
  completed: 2026-08-17

actuals:
  tokens: 55000   # chars/4 over the realized diff, including the phase-close writes
  tasks: 3        # Task 3 is the phase-close checkpoint: APPROVED 2026-08-18
  commits: 8

tech-stack:
  added: []
  patterns:
    - "read the consumer of a format BEFORE writing to it — the drift auditor's file-vs-directory test made the plan's stated targets inert"
    - "resolve a stale marker line-scoped and one at a time, asserting exactly one match per replacement"
    - "attribute every count change by set difference before calling it benign"
    - "when a red gate shows an UNEXPECTED row, raise it as a finding — never widen the expected state to cover it"
    - "close a self-referential record loop by moving the last cut's record OUT of the cut"

key-files:
  created:
    - .claude/skills/ship-review-stack/SKILL.md
    - .claude/skills/ship-review-stack/sources/ (7 scripts + 8 codemod fixtures)
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-19-SUMMARY.md
  modified:
    - .claude/skills/BOUNDARIES.md
    - .claude/skills/data/SKILL.md
    - .claude/skills/database/SKILL.md
    - .agents/code-review-checklist.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-VALIDATION.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md

key-decisions:
  - "The skill's drift targets are DIRECTORIES, not the seven scripts the plan named — a file target is reported 'directory not found' and scores OK forever, which is an inert audit"
  - "F-88 was closed by a real content resync, not by touching the skill files; every schema path in the database skill was stale"
  - "F-89 raised and left open: the fix is in a published slice and the six-branch grant is spent — an operator decision, not an agent's"
  - "F-89 was NOT absorbed into criterion 3's expected-red state — the fourth declined gate-massage, and the first available to an agent"
  - "Task 2's acceptance grep (substring 'pending' == 0) was unsatisfiable without falsifying history; the CHECK was wrong, not the content"
  - "The final re-cut's SHA is recorded OUTSIDE slice 11 — that is the fix for the recursion, not an omission"
  - "F-89 is a post-merge follow-up: one comment line does not warrant a second six-branch force-push, and no PR carries a human review"
  - "The phase-close writes drift criterion 7 again and are LEFT drifted — re-cutting to make the last sentence true is how the loop never ends"
  - "hygiene-codemod.mjs was reformatted in BOTH locations to keep them byte-identical, with the transform proved unchanged by its committed fixtures"
---

# Phase 151 Plan 19: Codify the Procedure, Close the Record, Cut Last — Summary

**The ship procedure is codified as `.claude/skills/ship-review-stack/` with all seven scripts
attached byte-identically and the repository's own drift auditor parsing and auditing it; every phase
record is final with each of the seven criteria mapped to a command a reader can run; F-88 and F-07
are closed; F-89 is raised and deliberately left open; and the final slice-11 re-cut was performed
LAST, making criterion 7 green at rest rather than as of a past commit.**

## The skill (D-25) — and the target choice that is itself the lesson

`SKILL.md` carries the mechanism (index-level tree surgery, not rebasing), the eleven procedure steps
in the order they actually ran, and **28 lessons each stating the concrete failure it prevents** — the
nine the plan named, plus the gate discipline, the six self-consistent-and-wrong artifacts, the
mechanical-edit hazards, and this environment's zsh/git/grep traps. `sources/` carries all seven
scripts plus the codemod's eight fixtures; `diff -r` against `scripts/` produces no output.

**The plan asked for the seven scripts to be declared as drift targets. Reading the auditor first
showed that would have been inert.** `audit-skill-drift.sh:81` tests `[[ ! -d "$target" ]]` and treats
a file as *"directory not found"*, contributing zero commits — so the skill would have been `CHECKED`,
scored `OK`, and been **incapable of ever going red**. That is the same defect class as the schema
linter pointed at a nonexistent port and `"engine"` (singular) in `package.json`: a mechanism that
looks like a gate and is not one. The declared targets are three directories that genuinely change:
`.agents`, `.claude/scripts`, and the phase's `scripts/`.

`BOUNDARIES.md` registers the new domain. It is the first **process** skill in this repository and
owns no source directory, so it claims no directory row; two gray-zone rows record the rule that
matters — *a subsystem owner is authoritative on what a sweep fix should be, and this skill only on
how it is sliced, committed and proved*.

## F-88 — closed by a content fix, not by a touch

`skill-drift-check` exited 1 at the branch tip (`Checked: 4  Drifted: 2  Skipped: 3`), on a job **no
PR in this stack shows**, so the first PR to `main` after the merge would have been red on a failure
nobody had seen. Touching the two skill files would have greened it — the drift-audit equivalent of
raising a budget. Both were resynced against what actually changed:

| Skill | What was stale |
|---|---|
| `data` | The `DEFAULT_LOCALE` convention (`Intl` formatters resolve `locale ?? DEFAULT_LOCALE`, never `?? undefined`, so output never depends on the host machine), and `MultipleChoiceCategoricalQuestion`'s absent 2-choice shortcut. |
| `database` | **Every schema path in the file was wrong** — the `schema/` tree had been renumbered by concern and all eleven cited filenames no longer existed. Plus the two-SQL-directories rule, `resolve_email_variables`' `p_`-prefixed arguments (PostgREST resolves overloads by named argument, so the unprefixed call resolves to nothing), the new issuer check, and what `db:lint:sql` does and does not reach. |

**The remap was verified by symbol, not by name** — `get_localized`, `custom_access_token_hook`,
`user_roles`, `external_id`, `bulk_` each located in the destination file before the replacement, and
a post-check asserting no cited schema filename is missing from disk. A name-based remap at this scale
is exactly the confident-nonsense failure the skill's lesson 2 describes.

`bash .claude/scripts/audit-skill-drift.sh` → **`Checked: 5  Drifted: 0  Skipped: 3`, exit 0.**

## F-07 — two bytes, and the number this phase should have been using all along

`.agents/code-review-checklist.md:8` wrote the `any` item's marker as `- [<NBSP>]<NBSP>` (`2d 20 5b c2
a0 5d c2 a0`). GFM does not render that as a task-list item, so **a reviewer working the checklist in
a PR could not tick it**, and every `^- \[ \] ` census undercounted by exactly one. `f12d841e2`
replaces the two bytes: the census returns **31**, not 30.

*(A small instance of the phase's standing rule, met while fixing it: `grep -P '\xc2\xa0'` returns
nothing in a UTF-8 locale, because `-P` reads that as codepoints U+00C2 U+00A0. `grep -P '\x{00a0}'`
finds it. The first check was wrong before the content was.)*

## F-89 — raised, not fixed, and not absorbed

Criterion 3's gate at the tip returns **three** failing rows where the written expectation is two:

| row | expected | measured | verdict |
|---|---|---|---|
| `task-id` | 84 | **82** | **benign, attributed by set difference** — `apps/frontend/ios/App/App/Base.lproj/Main.storyboard` was deleted under the F-15 amendment and carried 2 matches. Not inferred; the file lists were differenced. |
| `phase-ref` bare | 11 | **12** | **+1 — real** |
| `plan-number` | 0 | **1** | **+1 — real** |

Both additions are **one line**: `tests/tests/specs/perf/performance-budget.spec.ts:55`, reading
`## Why a warm-up reload (phase 151, plan 151-18)` — introduced by **151-18's own fix**, the one that
took the cardinal E2E gate from red to green.

**Not fixed here.** The file is in slice **05**, published as PR #868 with six slices chained above
it. Fixing it means re-cutting 05–11 and force-pushing six branches; this plan's authorisation is
**one branch**, and 151-18's six-branch grant is spent and does not extend by implication. That is an
operator decision about other people's open pull requests.

**Not absorbed into the expected state either**, which was the other available move and the worse one.
Widening "expected red" to cover a new failure is how a gate stops meaning anything.

| # | Gate-massage available in this phase | Decision |
|---|---|---|
| 1 | Raise `TIME_TO_MATCHES_BUDGET_MS` to green a red perf test | **Declined** — fixed the measurement |
| 2 | Waive the red E2E gate and ship | **Declined** — fixed the defect, re-cut six branches |
| 3 | Re-scope `verify-identity.sh` past `.planning/` | **Declined** — recorded the honest standing |
| 4 | Widen criterion 3's expected-red to cover F-89 | **Declined** — raised it as a finding |

**It was visible only because the expected red had been written down precisely enough that a third row
could not hide in it.** That is this phase's lesson 11 paying for itself inside the phase that wrote
it, and it is the strongest argument in the skill for writing a red gate's exact expected state down.

## The record

- **§ Criterion evidence map** — seven rows, one per ROADMAP success criterion, each naming a command
  a reader can run or a decision a reader can re-read. It ends with what no row claims: a green
  identity check means *the union is right*, never *the slices are right*, and byte-identity is not
  review coverage — 1,202 files ship whose content is in no slice's diff, 120 claimed by no pathspec.
- **Eleven stale `PENDING→NN` markers** in verdict columns resolved to terminal dispositions,
  **line-scoped, each replacement asserted to match exactly once**. F-01 and F-10 turned out to be
  FIXED (the F-15 amendment deleted the files); F-02, F-04, F-05 FIXED; F-03, F-06, F-08 DEFERRED with
  the reason and the cost.
- **F-15's heading corrected.** It read *"PREPARED AND NOT TAKEN"* long after the operator took the
  decision and `slices.tsv` was amended on it. The analysis beneath is preserved verbatim — it is the
  case the operator decided on, and editing it to match the outcome would destroy the record of what
  was actually put to them.
- **§ Deferred and carried forward** — every open finding with why it is not closed and what closing
  costs, the two `gsd-tools` defects, the dev-seed locality hazard, `e2e_collisions: 0` with the near
  miss recorded rather than counted, and **zero waivers**: `151-CARDINAL-RULE-WAIVER.md` was
  provisioned as a conditional artifact and never written, because the condition never held.
- **`151-VALIDATION.md`** flipped `draft` → `validated` on measured state, and records the **one
  Wave-0 assumption that did not survive** — 4.4's proxy cannot pass across the rename boundary, so
  the gate runs over `C1..TIP` and names the proxy on every run. A narrowed claim, not a satisfied one.

## Deviations from Plan

**1. [Rule 1 — the check was wrong, not the content] Task 2's acceptance grep is unsatisfiable.**
It requires `grep -c 'pending' …/*.md` to return `0` across every phase record. The substring appears
legitimately in nineteen historical files — *"it exits 1 pending F-21"*, *"the pending todo"*,
`cells_pending: 0` — and in **`151-19-PLAN.md` itself, six times**. Satisfying it literally would mean
rewriting nineteen historical records to remove a word they use correctly, which is precisely the
falsification 151-18 caught itself committing. **The intent was met against the real object:** every
`PENDING→NN` marker in a verdict column is resolved, `blank_cells: 0`, `cells_pending: 0`, and the one
genuine open state (`approval:`) is now a named, owned, dated value rather than a placeholder.

**2. [Rule 2 — a stated instruction would have produced an inert gate] The skill's drift targets are
directories, not the seven scripts.** See above. Declaring files would have satisfied the plan's
wording and produced a skill that can never go red.

**3. [Rule 3 — blocking] Copying the scripts moved them across a gate boundary.** They lived under the
prettier-ignored `.planning/` and had **never met `format:check`**; `hygiene-codemod.mjs` became a
**third** format failure against a baseline whose entire value is *"red on exactly these two files"*.
`.prettierignore` is in the published slice 10 and could not be edited. Resolution: format **both**
copies so they stay byte-identical, and prove the transform unchanged by the committed fixtures
(`--self-test`: 4 fixtures, 0 failures) rather than asserting it. The one record citing a line number
in that file is updated `:524` → `:531`; the statement it makes is unchanged. Reformatting only the
copy was rejected — it would have left `diff -r` meaning nothing.

**4. [Rule 1] The `database` skill's staleness was far wider than F-88's diff.** The drift the auditor
reported was 15 files; the actual defect was that **every one of eleven cited schema filenames no
longer existed**, from a renumbering the auditor's commit-count heuristic cannot see. Fixed, with each
destination verified by symbol. *A drift counter measures churn, not correctness.*

**5. The three phase-level gates were not re-run, and the reason is a measurement rather than an
assumption.** `git diff --name-only <plan start>..HEAD -- apps packages tests` returns **0 files**, so
`build`, `test:unit`, `lint:check` and the E2E suite cannot have moved; 151-18's results stand.
`format:check` **was** re-run under `TURBO_FORCE=1`, because it does reach `.claude/` and `.agents/`:
**red on exactly the two PD-03-fenced files**, unchanged.

## Known Stubs

None.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
T-151-19-01 (a skill silently skipped by the auditor) is discharged by writing the frontmatter to the
auditor's grammar with **real directory targets** and running it as the task's verify — the
file-target trap would have produced exactly the silent non-audit this threat names.
T-151-19-02 (scope overlapping an existing owner) by reading `BOUNDARIES.md` first and registering a
process domain that claims no directory row. T-151-19-03 (pending markers surviving) by resolving
every live marker and recording why the literal grep is not the right object. T-151-19-04 (sources
drifting from the scripts) by `diff -r` plus the declared drift targets. T-151-19-05 (backup worktree
removed at phase close) by not touching it and re-verifying it at `fe91f3099`.

## Verification

- [x] `bash .claude/scripts/audit-skill-drift.sh ship-review-stack` → **`Checked: 1  Drifted: 0
      Skipped: 0`**, exit 0 — reported, not skipped
- [x] `bash .claude/scripts/audit-skill-drift.sh` → **`Checked: 5  Drifted: 0  Skipped: 3`**, exit 0
      (F-88 closed)
- [x] `diff -r .claude/skills/ship-review-stack/sources <phase>/scripts` → **no output**
- [x] `node …/hygiene-codemod.mjs --self-test` → **4 fixtures, 0 failures**, after the reformat
- [x] `grep -c '^- \[ \] ' .agents/code-review-checklist.md` → **31** (was 30)
- [x] `TURBO_FORCE=1 yarn format:check` → red on **exactly two** PD-03-fenced files, unchanged
- [x] `git diff --name-only f68a4ddf8..HEAD -- apps packages tests | wc -l` → **0**
- [x] No duplicate YAML key in any of the three edited records (checked, per 151-08's loss)
- [x] Criterion 5: backup worktree at `fe91f3099`, detached, untouched by this plan
- [x] Force-push confined to the one authorised branch, dry-run first, `--force-with-lease`
- [x] No `git clean`, no `git stash`, no `reset --hard`; `main` unmoved; PR #860 untouched

## The last re-cut — and why its SHA is not in this file

Slice 11's pathspec is `.planning .claude .agents CLAUDE.md`, and **every file this plan wrote is
inside it** — including this summary. The re-cut was therefore performed **after** the last of them was
committed, followed by the delta secret rescan and the identity re-proof, then a single
`--force-with-lease` push of `ship/v0.2-akita-11-planning`.

**The resulting SHA is deliberately recorded outside slice 11** — in PR #874's body and in the
phase-close report — because writing it here would change a file inside the cut and re-break the
identity the line records. That is the loop 151-17 handed to 151-18 and 151-18 handed to here, and it
terminates only by moving the record of the last cut out of the cut. Anyone can recompute it:

```
git rev-parse ship/v0.2-akita-11-planning
bash scripts/verify-identity.sh feat-gsd-roadmap ship/v0.2-akita-11-planning   # exit 0
```

**Criterion 7 was green at rest** at `14afb2d80`, not merely as of a past commit — and the operator
reproduced it rather than trusting this record. See the section below for its standing after the
phase-close writes, which is stated rather than repaired.

## Task 3 — the phase-close checkpoint: APPROVED

**Approved 2026-08-18, on reproduction rather than on reading**, which is the only test that
distinguishes a record from a claim. All three headline assertions were re-run independently:

| claim | reproduced | result |
|---|---|---|
| criterion 7 | `verify-identity.sh feat-gsd-roadmap ship/v0.2-akita-11-planning` | `changed files: 0`, both trees `b606ed169`, **BYTE-IDENTICAL**, exit 0 — green **at rest**, where it was red one wave earlier |
| F-88 closed | `audit-skill-drift.sh`, **with a pre-fix control** | `Drifted: 2` before, `Checked: 5  Drifted: 0` after, exit 0 |
| F-89 real | opened the cited line | present at `performance-budget.spec.ts:55` |

Taking a control reading *before* the fix is the part worth noting: it is the difference between "the
audit is green" and "the audit went from red to green because of this change".

### F-89 — post-merge follow-up, with its fix named

**Do not fix it in the stack; do not widen the gate.** The operator's reasoning, recorded so it is not
re-argued: it is one comment line, a second six-branch force-push is not warranted for it, and no PR in
the stack carries a human review yet — so an honest open finding costs nothing.

**The fix, named so whoever picks it up does not re-derive it:** collapse the heading to D-14's
authorised bare form — `## Why a warm-up reload (see phase 151)`. That single edit clears **both** rows
at once: `plan-number` stops matching because no `NN-NN` plan number survives, and `phase-ref` returns
to 11 bare because the surviving reference is preceded by `see`. Re-verify with
`hygiene-grep-report.sh --assert-clean`, expecting `task-id` 82 and `phase-ref` bare 11.

**The refusal to absorb it into the expected-red was explicitly endorsed**, and is now the fourth row
of the declined-gate-massage table and the closing argument of the skill's gate section. It is the only
one of the four available to an *agent* rather than to the operator, and the only one that disguises
itself as bookkeeping.

### Two corrections carried into the record rather than waived

**The skill's drift targets.** The plan directed that the seven scripts be declared;
`audit-skill-drift.sh:81` treats a file target as *"directory not found"*, so that would have satisfied
the plan's wording and produced an audit **incapable of ever going red** — the same defect class as a
linter pointed at a port that does not exist. Three real directories declared instead, and logged as
the **~16th** plan-encoded claim in this phase found wrong as written, rather than quietly absorbed.

**The fixpoint rule, now explicit in the skill** at the operator's request: writing the final cut's SHA
into a file that cut contains re-breaks the identity the SHA records. Put it in the pull request body
and let the repository carry the *command* — `git rev-parse <slice-branch>` — instead of the value. A
recomputable pointer is stable; a written-down hash inside its own subject is a fixpoint that does not
exist.

### Criterion 7 after the phase close — stated, not silently repaired

**`14afb2d80` is the closing state. It was NOT re-cut again, and nothing was force-pushed to close the
phase.** The one-branch authorisation is now **spent**, exactly as 151-18's six-branch grant was.

These phase-close writes — this section, the manifest's, the two approvals — are inside slice 11's
pathspec, so **they drift the identity by construction**. That is the recursion this phase spent three
plans closing, and the correct response is to say so:

> Criterion 7 is proven green **at rest as of `14afb2d80`**, reproduced by the operator. **These
> closing lines drift it again**, because a phase-close approval is itself a planning write. That is
> not a regression, and it is not repaired by another cut — re-cutting to make the last sentence true
> is how the loop never ends.

**Anyone re-running the gate now sees a delta of exactly seven files — enumerated, not characterised:**

```
.claude/skills/ship-review-stack/SKILL.md            # the 4th declined massage + the fixpoint rule
.planning/ROADMAP.md                                 # phase marked complete
.planning/STATE.md                                   # close recorded
.planning/phases/151-…/151-19-SUMMARY.md
.planning/phases/151-…/151-DISPOSITION.md            # approval + F-89's named fix
.planning/phases/151-…/151-STACK-MANIFEST.md         # this section
.planning/phases/151-…/151-VALIDATION.md             # approval
```

**A correction to this record's own first draft, made by measuring it.** Both this section and the
summary first said the delta was *".planning/-only"*. It is not: `.claude/skills/ship-review-stack/SKILL.md`
is in it, because slice 11's pathspec is `.planning .claude .agents CLAUDE.md` — four roots, not one.
The claim was written from the shape of the work rather than from `git diff --name-only`, which is the
same species of error this phase has been cataloguing all along, committed in its closing paragraph.
Corrected by enumeration. **No application code differs: `git diff --name-only feat-gsd-roadmap
ship/v0.2-akita-11-planning -- apps packages tests` returns 0 files.**

`main` is unmoved at `ac30f132a`, the backup worktree is intact and clean at `fe91f3099`, and PR #860
remains the repurposed umbrella entry point.

**Open follow-ups inherited by whoever merges:** F-89 (fix named above), F-81, F-86, the two
`gsd-tools` defects, the dev-seed locality guard, and F-21 option (a) with F-29 riding its migration.
