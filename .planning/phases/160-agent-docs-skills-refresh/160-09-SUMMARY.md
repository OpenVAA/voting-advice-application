---
phase: 160-agent-docs-skills-refresh
plan: 09
subsystem: docs
tags: [skills, routing, audit-script, pointer-density, descriptions, red-green-fixture, e2e-gate]

requires:
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 04's one-level routing rule, stated in `.claude/skills/README.md` as two clauses it calls mechanically checkable — the rule this plan turns into an instrument"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 01's `.claude/scripts/audit-skill-links.sh` — the sibling whose argument, output and exit contract this plan's script matches, and which this plan extends with check 3c"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 07's executed `delete-sources-only` outcome — the corpus as shipped, which is what this plan scores rather than the corpus as planned"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 08's inbound obligations: the unguarded past-EOF bare-filename anchor class, the vacuous `grep -v '^\\./\\.planning/'` idiom, and the 155/0/0/0/0 standing E2E gate at `f8e7b4b07`"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 06's rewritten `CLAUDE.md § Skill Routing` — the routing layer Check A scores alongside each `SKILL.md` body"
provides:
  - "`.claude/scripts/audit-skill-routing.sh` — the instrument that scores both clauses of the one-level routing rule, with its threshold stated beside the distribution that justified it and a measured insensitivity sweep"
  - "A per-skill conformance record in `.claude/skills/README.md`: two verdicts for each of the seven live skill directories plus `CLAUDE.md § Skill Routing`, each with the command that reproduces just that one"
  - "A correction to the corpus record's own hop-by-hop violation account, which did not survive the instrument built to score it"
  - "Check 3c in `.claude/scripts/audit-skill-links.sh`, closing the past-EOF bare-filename anchor class that bit this phase twice and that no guard caught"
  - "Two filings with `file:line` anchors and costed alternatives, for the two violations this plan does not own"
  - "A full Playwright run at this plan's own HEAD: 155 passed, 0 failed, 0 skipped, 0 flaky, 0 did-not-run, preflight confirmed against this checkout"

affects: [163-ci-jobs]

actuals:
  tokens: 15528 # chars/4 over the realized diff, git diff 4d7b8201b..HEAD
  tasks: 3
  commits: 3
plan_head_before: 4d7b8201b38c0f6950a498861376d202e14bb05a

tech-stack:
  added: []
  patterns:
    - "A threshold ships with the distribution that justified it AND a measured sweep across its plausible range, so the reader can see the verdict does not depend on the number."
    - "When a distribution turns out flat, say so and downgrade that level of the check to advisory rather than reading a threshold off noise."
    - "An instrument is shown RED against a throwaway fixture before its GREEN is trusted; a checker only ever observed green is not known to check anything."
    - "An escape hatch suppresses a verdict, never a measurement: an exempted file still has its density printed, so the waiver can be disagreed with without re-deriving it."
    - "A guard calls `command grep`, never the bare name, and proves the independence by running under a deliberately poisoned `grep` shell function."
    - "When the instrument contradicts the prose record that motivated it, the record is corrected in place — a record that survives its own measurement unaltered was not measured."

key-files:
  created:
    - .claude/scripts/audit-skill-routing.sh
    - .planning/todos/pending/2026-09-14-spike-findings-skill-routing-depth.md
    - .planning/todos/pending/2026-09-14-non-discriminative-skill-descriptions.md
  modified:
    - .claude/skills/README.md
    - .claude/scripts/audit-skill-links.sh

key-decisions:
  - "Hops are pointers to corpus MARKDOWN documents, not to source code. Measured: counting every path citation scores `filters/extension-patterns.md` at 50.5% and `CLAUDE.md` at 62.0% — two unambiguous content files — because a procedure names the files it operates on. The narrower definition separates 'this file sends you elsewhere' from 'this file talks about the code', which is what the rule is about."
  - "A `Skill(\"x\")` invocation inside `CLAUDE.md § Skill Routing` is counted as depth 0, not a hop, following the rule's own first sentence that the frontmatter description IS the routing layer. Counting it as a hop would make `CLAUDE.md -> Skill(\"data\") -> data/SKILL.md -> object-model.md` three hops and condemn every skill in the tree, including the shape the rule's next sentence explicitly blesses."
  - "The threshold is 50% — a majority of body lines — derived from the rule's own word 'predominantly' rather than from a gap in the data, because the measured file-level distribution has no gap to read one off. Stated with both distributions and a sweep showing the binding verdict is identical at every threshold from 25% to 100%."
  - "Classification is computed corpus-wide even on a scoped run; only printing and counts follow the scope. A chain whose intermediate sits outside the named target is still a chain, and a guard that forgets it when you narrow the scope reports a clean run for the wrong reason."
  - "The past-EOF bare-filename anchor class was IMPLEMENTED, in `audit-skill-links.sh` rather than in the new script. It is a citation-integrity defect, and splitting one class across two guards would leave neither able to answer for it. Measured non-regressive before landing: 12 of the corpus's 13 such tokens resolve uniquely and all 12 are in range."
  - "Both reported violations are FILED rather than fixed, and the plan's own task-2 rules decide it: the spike skill's flattening is a structural split whose hand-edit expires at the next `/gsd-spike --wrap-up`, and the four `Domain expert for the` SKILL.md files are outside this phase's `files_modified` across all nine plans and are excluded by name in `160-CONTEXT.md` § Phase Boundary."
  - "The `CLAUDE.md § Skill Routing -> README.md` finding was fixed by the escape hatch rather than by restructuring: this file is a record whose citations are evidence for what it records, which is exactly what that `CLAUDE.md` entry says it is."

patterns-established:
  - "Sensitivity as a table, not an adjective: report the verdict count at each of seven threshold values so a reader sees the stable band rather than being told there is one."
  - "A disposition table covers every reported line, and a filing states what fixing it would cost in the unit that makes the cost legible (bytes for a promote, new directories for a split)."

requirements-completed: [REVIEW-DOC-03, REVIEW-DOC-04]

coverage:
  - id: D1
    description: "`.claude/scripts/audit-skill-routing.sh` runs over the corpus, implements Check A and Check B, derives its corpus from the filesystem, and exits 1 on a violation"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "bash .claude/scripts/audit-skill-routing.sh -> 168 lines of output, per-file and per-section densities, per-layer verdicts, `Violations: 5`, exit 1"
        status: pass
      - kind: other
        ref: "command grep -c 'spike-findings\\|architect' .claude/scripts/audit-skill-routing.sh -> 0 (whole file, comments included); no skill name of any kind appears outside comments"
        status: pass
      - kind: other
        ref: "argument contract: `data` (skill name) exit 1, `.claude/skills/data` (path) exit 1, `CLAUDE.md` (file) exit 0, `no-such-skill` -> 'Skill, directory or file not found', exit 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both checks were shown RED against a throwaway fixture and GREEN when the fixture was made compliant, and the fixtures were deleted"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "Check A fixture: A1 + A2a + A2b all reported, exit 1; same fixture flattened -> OK, exit 0. Check B fixture: 3 skills sharing an 8-word stem reported with their sharers; descriptions sharpened -> stem gone while the pre-existing corpus stem stayed. Check 3c fixture: `CLAUDE.md:9999` -> DANGLING with `(CLAUDE.md has 341 lines)`, exit 1; `CLAUDE.md:319` -> OK, exit 0"
        status: pass
      - kind: other
        ref: "git status --short after deletion lists no fixture path; the whole-corpus run returns to its pre-fixture figures"
        status: pass
    human_judgment: false
  - id: D3
    description: "The density threshold is stated with the distribution that justified it, and the file-level verdicts are downgraded to advisory because that distribution is flat"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "the script's header carries both sorted distributions, the derivation of 50% from the word 'predominantly', and a 7-point sweep table (25/35/43/50/60/80/95/100) re-run to produce it"
        status: pass
    human_judgment: true
    rationale: "Whether a threshold is DEFENSIBLE is the judgement flagged assumption A9-1 raises, and no command settles it. The measurement and the sweep are mechanical; the decision to call a flat distribution advisory rather than to read a threshold off it is a judgement a reader should be able to overturn, and the header states it as one."
  - id: D4
    description: "Every violation the audit reports has a recorded disposition — fixed here, or filed with a file:line anchor and a costed statement"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "6 reported findings, 6 rows in the disposition table below; 2 filings exist on disk with 11 file:line anchors between them; 1 fix landed in `.claude/skills/README.md`"
        status: pass
      - kind: other
        ref: "ls .planning/todos/pending/2026-09-14-*.md -> both present"
        status: pass
    human_judgment: false
  - id: D5
    description: "No dangling citation was introduced, measured token by token against the inbound set rather than by comparing totals"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "bash .claude/scripts/audit-skill-links.sh -> Checked: 636  Dangling: 207  Skipped: 191; comm -13 of the distinct dangling token sets (inbound vs final) is EMPTY"
        status: pass
    human_judgment: false
  - id: D6
    description: "The unguarded past-EOF bare-filename anchor class is closed in the guard that owns citation integrity"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "check 3c in `.claude/scripts/audit-skill-links.sh`; 13 such tokens in the corpus, 12 resolve uniquely and all 12 in range, so Dangling is unchanged at 207; the ambiguous `README.md:999999` is declined rather than guessed, in both the red and the green fixture run"
        status: pass
    human_judgment: false
  - id: D7
    description: "A conformance record in `.claude/skills/README.md` with per-skill verdicts, reproducing commands, a measurement commit and both pre- and post-deletion corpus figures"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "§ Conformance record names commit 9837cd9a7 and 2026-09-14, tabulates 8 routing layers x 2 checks with 8 per-target reproducing commands, and carries the corpus delta table 8/42/488,843 -> 7/25/336,488 with both commands"
        status: pass
    human_judgment: false
  - id: D8
    description: "The repository's lint, docs-link and end-to-end gates are green, with the E2E preflight confirmed to have resolved this working tree"
    verification:
      - kind: other
        ref: "yarn lint:check -> exit 0, read from $? on the command itself, never through a pipe"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/docs validate:links -> exit 0, 0 broken"
        status: pass
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/160-09-phase-gate --no-db-reset -> 155 passed / 0 unexpected / 0 skipped / 0 flaky / 0 did-not-run; playwright exit 0; wrapper exit 0; preflight-failures 0, preflight-successes 1"
        status: pass
    human_judgment: false

duration: 43 min
completed: 2026-09-14
status: complete
---

# Phase 160 Plan 09: Routing Conformance — the Instrument, the Verdict and the Record Summary

**The one-level routing rule this phase asserted in prose is now scored by `.claude/scripts/audit-skill-routing.sh`, whose threshold ships with the distribution that justified it and a sweep showing the binding verdict is identical from 25% to 100%; the corpus scores six of seven skills clean on depth and three of seven on description, both failures are filed with anchors and costed alternatives, and the record's own hop-by-hop violation account — which did not survive the instrument built to score it — is corrected rather than left standing.**

## Performance

- **Duration:** ~43 min, bounded by commit timestamps rather than asserted: the inbound commit `4d7b8201b` is at `2026-09-13T21:15:04Z` and this plan's SUMMARY commit at `21:57:32Z`
- **Started:** 2026-09-13T21:15:04Z (lower bound — the inbound commit)
- **Completed:** 2026-09-13T21:57:32Z
- **Tasks:** 3
- **Files modified:** 5 in the plan diff — 3 created, 2 modified — plus this SUMMARY

## Task Commits

1. **Task 1: Build the routing-conformance checker** — `b90266ee7` (feat)
2. **Task 2: Run the audit, fix what this phase owns, file the rest** — `9837cd9a7` (fix)
3. **Task 3: Record the conformance measurement and close the phase gates** — `373ec354a` (docs)

`commits: 3` is MEASURED, not narrated: `git rev-list --count 4d7b8201b38c0f6950a498861376d202e14bb05a..HEAD` at SUMMARY-write time, read from a ledger written to `.git/gsd-plan-head-before-160-09` before the first commit.

---

## Task 1 — the instrument

### What the two checks actually test

`.claude/skills/README.md` states the rule as two clauses. Check A scores the depth clause, Check B the discriminativeness clause. Three definitions do the work, and each was a decision:

**A hop is a pointer to another corpus MARKDOWN document, not to source code.** This was measured, not assumed. A first implementation counted every path citation as a pointer line and produced this file-level distribution:

```
62.0% CLAUDE.md · 50.5% filters/extension-patterns.md · 46.8% README.md · 43.2% matching/SKILL.md · …
```

Two of the top three are unambiguous content — a procedure naturally names the files it operates on, and `CLAUDE.md` is a commands-and-conventions file. Restricting pointers to corpus-document citations separates "this file sends you elsewhere" from "this file talks about the code", which is the distinction the rule is about. The rejected first attempt is recorded in the script's header, because a definition arrived at by measurement is worth more than one asserted.

**`Skill("x")` inside `CLAUDE.md § Skill Routing` is depth 0, not a hop.** The rule's own first sentence is "a skill's frontmatter `description` is the routing layer", so naming a skill is the selection event. Counting it as a hop makes `CLAUDE.md → Skill("data") → data/SKILL.md → object-model.md` three hops — condemning the very shape the rule's next sentence blesses, and every skill in the tree with it. This single decision is why six of seven skills score OK rather than zero of seven.

**Classification is corpus-wide; only reporting follows the scope.** An early version filtered the index lists by scope, so `audit-skill-routing.sh CLAUDE.md` reported `Violations: 0` while the whole-corpus run reported a chain through `README.md`. A chain whose intermediate sits outside the named target is still a chain; a guard that forgets it when you narrow the scope reports a clean run for the wrong reason.

### The threshold, and the distribution the plan required be stated with it

**Flagged assumption A9-1 says the threshold is not derivable from either cited paper, and the measurement agrees.** Both distributions were produced by the final script over the 27-file corpus.

**File level — FLAT, and reported as such:**

```
23.8 23.4 17.9 15.5 13.0 13.0 12.4 9.1 5.8 5.2 4.3 3.2 2.8 2.8
 2.7  2.7  2.2  2.0  2.0  1.9  1.6 1.3 1.1 1.0 0.0 0.0 0.0   (percent)
```

One monotone run from 23.8% to zero. Widest gap: **5.5 points** (23.4 → 17.9). No bimodal split, nothing near a majority. **No file-level threshold is derivable from this**, so per A9-1 the file-level verdicts are recorded as **ADVISORY**, and at 50% the check classifies zero files as indexes and says so in its own output rather than reporting a silent clean run.

**Section level — spread, but not cleanly bimodal either, and that is stated rather than dressed up:**

```
100.0 100.0 88.9 75.0 72.2 60.0 50.0 50.0 50.0 50.0 | 42.9 40.0 40.0 33.3 33.3 33.3 32.1 28.6 …
```

The widest gap, 13.9 points, falls *inside* the top cluster (88.9 → 75.0), not at its edge. So the threshold is **not** read off a gap. It is 50% because the rule's own word is "predominantly", and predominantly means a majority of body lines: **the number is the word, not a tuned constant.**

**What makes the verdict trustworthy is not the gap but the insensitivity, and that was measured rather than asserted** — re-run with `SKILL_ROUTING_THRESHOLD`:

| `SKILL_ROUTING_THRESHOLD` | 25 | 35 | 43 | 50 | 60 | 80 | 95 | 100 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| routing layers VIOLATION | 2 | 2 | 2 | 2 | 1 | 1 | 1 | 1 |
| the generated spike skill | y | y | y | y | y | y | y | y |
| `CLAUDE.md § Skill Routing` | y | y | y | y | · | · | · | · |

The layer that matters is reported at **every threshold from 25 to 100**, because the section driving it (`## Related`, 6 pointer lines of 6) is at 100% and cannot be thresholded away. The second layer appears only at ≤50% and is the escape hatch's case, dispositioned in Task 2.

`MIN_SECTION_LINES = 3` is the other constant, and it is not arbitrary either: a section of one or two body lines scores 100% or 50% by construction. Four `## Reference Files` sections in this corpus are exactly that shape, and they are printed as `unclassified` rather than silently scored.

### Red-then-green, per check, with the fixture deleted

The plan's instruction: *a checker only ever observed green is not known to check anything.*

| Check | RED — throwaway fixture that violates | GREEN — same fixture made compliant |
| --- | --- | --- |
| **A1** (file level) | `zzfixture-red/references/alpha.md` at 50.0% INDEX pointing onward at 3 files → `A1 depth-2 chain: zzfixture-red -> …/alpha.md (INDEX) -> beta delta gamma` | `## Related` removed → alpha 0.0%, no A1 line |
| **A2a** (two index sections in a routing layer) | `SKILL.md` with `## Areas` 75% and `## Landing Map` 75% → `A2a the routing layer carries 2 index sections` | `## Landing Map` removed → 1 index section, no A2a line |
| **A2b** (index section at depth 1 pointing onward) | `alpha.md :: ## Related` 100% → `A2b depth-2 chain: … -> 3 further file(s)` | `## Related` removed → no A2b line |
| **Check A overall** | **exit 1**, `Violations: 1` | **exit 0**, `Violations: 0` |
| **Check B** | three fixture skills opening `throwaway fixture skill for the stem check variant` → `8-word stem … - zzstem-b1, zzstem-b2, zzstem-b3` | three sharpened openings → the fixture stem vanishes from the stems list **while the pre-existing corpus stem stays**, which is the part that proves the check was not merely suppressed |

All four fixture directories were then deleted; `git status --short` lists no fixture path and the whole-corpus run returns to its pre-fixture figures.

### The grep-wrapper hazard, closed rather than avoided

Plan 07 found that `grep` in this shell is a function wrapping `ugrep`, which emits no `./` prefix. The guard calls `command grep` everywhere. The proof is not that `ugrep` is absent from this host — that would prove nothing — but that the script is **byte-identical under a deliberately poisoned `grep`**:

```bash
grep() { echo "POISONED-GREP"; return 0; }; export -f grep
bash .claude/scripts/audit-skill-routing.sh    # output identical; 0 occurrences of POISONED
```

`LC_ALL=C` is also exported inside the script: awk's `printf` follows the locale, and on this host an unguarded run prints `62,0%` — a figure a reader cannot paste into a spreadsheet.

### Task 1 acceptance criteria — all seven run and read

| Criterion | Result |
| --- | --- |
| runs to completion, exits 0 or 1, never a shell error | **PASS** — `bash -n` clean; exit 1 on the corpus, exit 0 on `ship-review-stack` and on the compliant fixture |
| `… .claude/skills/data` audits only that directory | **PASS** — 3 files, 4 sections, 1 routing layer. Note the sibling's contract takes a *skill name*; this script accepts a name, a directory path **or** a file path, a superset, so both the criterion and the sibling contract hold |
| per-skill verdict line for Check A and for Check B | **PASS** — 8 layer verdicts, 7 description verdicts |
| measured pointer density for every classified file | **PASS** — 27 file lines, 87 section lines (80 classified + 7 `unclassified`) |
| threshold in a top-of-file comment with its justifying distribution | **PASS** — both distributions, the derivation from "predominantly", and the sweep table |
| `grep -c 'spike-findings\|architect' …` returns 0 outside comments | **PASS** — returns **0 for the whole file, comments included**, which is stronger than the criterion asks. No skill name of any kind appears outside comments |
| a red run demonstrated for each check | **PASS** — table above |

---

## Task 2 — the audit, and a disposition for every line of it

### The audit output, verbatim

```
  Routing-layer verdicts:
    components                                      OK         (1 destination(s) at depth 1, none an index)
    data                                            OK         (2 destination(s) at depth 1, none an index)
    database                                        OK         (3 destination(s) at depth 1, none an index)
    filters                                         OK         (1 destination(s) at depth 1, none an index)
    matching                                        OK         (2 destination(s) at depth 1, none an index)
    ship-review-stack                               OK         (0 destination(s) at depth 1, none an index)
    spike-findings-voting-advice-application-gsd    VIOLATION  (8 destination(s) at depth 1)
      A2a  the routing layer carries 2 index sections - a second index inside the skill:
             ## Production Landing Map
             ## Feature Areas
      A2b  depth-2 chain: … references/context-orchestration.md :: # Context Orchestration (INDEX) -> 2 further file(s)
      A2b  depth-2 chain: … references/migration-inventory-and-order.md :: ## Related (INDEX) -> 6 further file(s)
      A2b  depth-2 chain: … references/migration-inventory-and-order.md :: #### Tier 1 — Leaf contexts (INDEX) -> 3 further file(s)
      A2b  depth-2 chain: … references/reactive-contexts.md :: ## Related (INDEX) -> 3 further file(s)
    CLAUDE.md ## Skill Routing                      OK         (1 destination(s) at depth 1, none an index)   [after the Task 2 waiver; VIOLATION before it]

  A1 found nothing to report: no file in the corpus reaches the 50% index threshold,
  so no routing layer can point at a file-level index. This is a measured absence,
  not an unrun check - the per-file densities above are what it measured.

    data       VIOLATION  shares the opening stem "domain expert for the openvaa" with: data, database, filters, matching
    database   VIOLATION  shares the opening stem "domain expert for the openvaa" with: data, database, filters, matching
    filters    VIOLATION  shares the opening stem "domain expert for the openvaa" with: data, database, filters, matching
    matching   VIOLATION  shares the opening stem "domain expert for the openvaa" with: data, database, filters, matching

  Shared opening stems (3 or more skills), longest first:
    5-word stem "domain expert for the openvaa" - data, database, filters, matching

---
Check A: files classified 27 (index 0, content 27)  sections classified 80 (index 8, too small to classify 7)  routing layers 8  depth-1 destinations 18
Check B: descriptions 7  shared stems 1  skills implicated 4
Violations: 5
```

### The disposition table — every reported finding, one row each

| # | Finding | Check | Anchor | Disposition | Where it landed |
| ---: | --- | --- | --- | --- | --- |
| 1 | routing layer carries 2 index sections | A2a | `spike-findings-…/SKILL.md:149` § _Feature Areas_ (88.9%) and `:188` § _Production Landing Map_ (72.2%) | **FILED** | `.planning/todos/pending/2026-09-14-spike-findings-skill-routing-depth.md` |
| 2 | depth-1 destination hands on another index | A2b | `…/references/migration-inventory-and-order.md:212` § _Related_ (100%, → 6) | **FILED** | same |
| 3 | same file, second index section | A2b | `…/references/migration-inventory-and-order.md:30` § _Tier 1_ (75%, → 3) | **FILED** | same |
| 4 | same shape, second reference | A2b | `…/references/reactive-contexts.md:336` § _Related_ (50%, → 3) | **FILED** | same |
| 5 | same shape, third reference | A2b | `…/references/context-orchestration.md:1` H1 preamble (50%, → 2) | **FILED** | same |
| 6 | `CLAUDE.md § Skill Routing → README.md :: ## The routing rule (INDEX) → 2` | A2b | `.claude/skills/README.md` § _The routing rule_ | **FIXED** — escape hatch, with the reason stated where a reader meets it | `.claude/skills/README.md`, `<!-- skill-routing-allow: index -->` |
| 7 | shared opening stem across four skills | B | `data/SKILL.md:3`, `database/SKILL.md:3`, `filters/SKILL.md:3`, `matching/SKILL.md:3` | **FILED** | `.planning/todos/pending/2026-09-14-non-discriminative-skill-descriptions.md` |
| 8 | the record's own hop-by-hop account does not reproduce | (found by the instrument, not reported by it) | `.claude/skills/README.md` § _The routing rule_ | **FIXED** in place | `.claude/skills/README.md` |

### Why the two filings are filings, stated against the plan's own rule rather than by preference

The plan says to prefer fixing, and specifically that "sharpening a description is cheap and is the half of the finding that the paper says pays". Two of its own task-2 rules nevertheless decide both cases, and they were applied rather than argued around:

- **The spike skill is a structural split.** Task 2: *"File as a todo when the fix is a structural split — one over-large skill becoming several smaller ones."* Both content-preserving shapes were costed before filing. **Promote:** `SKILL.md` grows 30,574 B → ~116,000 B, a single file ~3.5× the largest hand-authored skill and about a third of the whole corpus — trading a routing violation for a file nobody reads, against a corpus whose recorded verdict is *below the disclosure crossover because it is navigable by direct reading*. **Split:** eight new skill directories, eight hand-written descriptions, eight `targets:` lists, eight `BOUNDARIES.md` rows, competing for selection in a corpus of seven. **And both expire**: the skill is generated by `/gsd-spike --wrap-up`, and `.claude/skills/README.md` already records the objection against itself — *"the durable fix is to teach the generator rather than to re-edit the output."* Filing names the generator as the fix.
- **The four descriptions are outside the blast radius.** Task 2 fixes in place only *"when the fix is a flattening this phase already owns the surrounding file for"*, and files *"when it touches a file outside this phase's `files_modified` across all nine plans"*. Re-derived at execution — `git show --name-only` over every plan commit of phase 160 — the phase touched `components/SKILL.md` and `spike-findings-…/SKILL.md` and **no other `SKILL.md`**. `160-CONTEXT.md` § _Phase Boundary_ additionally excludes these four by name. The filing carries the fan-out the edit drags with it: `CLAUDE.md § Skill Routing`'s per-skill one-liners, two figures in `README.md`, the conformance record's four verdicts, and four reset drift baselines.

**Nothing was deleted.** No reference file, no section, no content. The one "fix" that touches the corpus is a waiver marker plus a correction of the record's own account.

### The correction the instrument forced — finding #8

`.claude/skills/README.md` described the live depth violation as a three-hop chain, hop 1 being `CLAUDE.md § Skill Routing` naming the skill. **The instrument built to score that rule does not reproduce it**, and the record now says so in place rather than being left standing:

- **Step 1 is not a hop.** The rule's own first sentence makes the description the routing layer. Counting it condemns `CLAUDE.md → Skill("data") → data/SKILL.md → object-model.md` too, i.e. the shape the very next sentence blesses — and the record itself elsewhere calls `data` a one-hop skill using that same graph shape.
- **The violation is real but differently shaped.** § _Feature Areas_ pointing at eight concrete resource files **is** the allowed shape. What breaches the rule is the **second** index over the same eight (§ _Production Landing Map_, 26 of 36 lines, re-indexing them through `[[wiki-alias]]` links), and three reference files handing the reader another index on arrival.

This is the class of defect the phase exists to remove, found in the phase's own record by the phase's own instrument. It is recorded as a correction with both reasons, not as a footnote.

### Inbound obligation — the past-EOF bare-filename anchor class

Plan 08 found two `CLAUDE.md:392` / `CLAUDE.md:432` anchors pointing past the end of a 341-line file, produced by this phase trimming `CLAUDE.md` by 96 lines without re-deriving them, and noted that `audit-skill-links.sh` **structurally cannot catch that class** — check 2's line-range test only fires on a token containing a `/`.

**Decision: IMPLEMENTED, in `audit-skill-links.sh` rather than in the new script.** It is a citation-integrity defect; splitting one class across two guards leaves neither able to answer for it. Landed as **check 3c**: when a bare filename carries a `:NN` anchor and its basename resolves to **exactly one** tracked file, the same one-sided range test as check 2 is applied; when the basename is ambiguous the test is **declined, not guessed** — inventing a target would turn a weak test into a wrong one.

Measured non-regressive before landing: **13** bare-filename tokens in the corpus carry a line anchor, **12** resolve uniquely, and **all 12 are in range**. It is a guard against the next trim, not a repair of this one. Proven red-then-green against a fixture, including the ambiguous case:

```
RED    `CLAUDE.md:9999`      -> DANGLING  (CLAUDE.md has 341 lines)   exit 1
       `README.md:999999`    -> not flagged: the basename is ambiguous, so the test declines
GREEN  `CLAUDE.md:319`       -> OK                                     exit 0
```

The guard's own header incident record was corrected in the same commit, because it claimed this class was undetectable there.

### Task 2 acceptance criteria

| Criterion | Result |
| --- | --- |
| every violation line appears in the disposition table with a disposition | **PASS** — 8 rows for 6 reported findings plus 2 the instrument surfaced |
| every "file as a todo" corresponds to a file with a `file:line` anchor | **PASS** — 2 files on disk, 11 `file:line` anchors between them |
| `audit-skill-links.sh` reports no dangling token introduced by this plan, re-derived not copied | **PASS, as a token-level subset proof** — see below |
| no fix deleted a reference file whose content exists nowhere else | **PASS** — nothing was deleted; `git diff --diff-filter=D` over all three commits is empty |
| `yarn lint:check` is green | **PASS** — exit 0, read from `$?` on the command itself |

**The dangling proof, re-derived rather than copied.** Plan 01's recorded baseline was `Checked: 678  Dangling: 350  Skipped: 191`; Plan 08 closed at `631 / 207 / 179`. This plan closes at **`Checked: 636  Dangling: 207  Skipped: 191`** — the dangling figure **did not move**. `Checked:` rose because this plan wrote new citations, including those in the conformance record; unlike the byte counts in `README.md`, this guard does not exclude that file.

The number alone is not the proof. The **token-level** one: the inbound dangling set was reconstructed by extracting a clean tree at `4d7b8201b` and running the same guard there, then `comm -13` against the final set. **Tokens introduced: none.** Two tokens (`.turbo/`, `apps/frontend/data/`) appear only in the *baseline* — both exist in the live working tree but are untracked, so `git archive` did not reproduce them. That is an artifact of how the baseline was reconstructed, verified by `[ -e ]` on both, and is stated rather than being allowed to read as a repair.

**One repair this plan made to itself, recorded because it is the exact trap the plan warns about.** The record correction first cited `references/migration-inventory-and-order.md:212` package-relatively, which the link guard immediately reported as dangling — *a flattening that leaves a dangling citation has traded one violation for another*. Repaired to the repo-relative path before the commit; `audit-skill-links.sh .claude/skills/README.md` exits 0.

---

## Task 3 — the record and the gates

### The conformance record

`.claude/skills/README.md` gains § _Conformance record_, measured at `9837cd9a7`, **2026-09-14**, carrying:

- a **per-skill table**: Check A and Check B verdicts for each of the **seven** live skill directories plus `CLAUDE.md § Skill Routing`, each row with the command that reproduces just that one (`bash .claude/scripts/audit-skill-routing.sh <name>`);
- the **corpus delta**, re-derived at execution and set beside Plan 04's pre-deletion figures so the change across Plan 07 reads here rather than by diffing two records;
- **what would flip each verdict**, one step either side, matching the register Plan 04 used for the disclosure threshold;
- the explicit statement that Check A's **file-level** verdicts are advisory and why;
- the CI and drift-guard disclaimers.

| | Skill directories | `.md` files | Bytes |
| --- | ---: | ---: | ---: |
| Plan 04, pre-deletion, at `e8052177c` | 8 | 42 | 488,843 |
| **This plan, post-deletion, at `9837cd9a7`** | **7** | **25** | **336,488** |
| Delta | −1 | −17 | −152,355 |

Both rows keep this file's standing self-exclusion (`-not -path '.claude/skills/README.md'`), which is why writing the record did not move them. `CLAUDE.md` at the same commit: **28,038 B / 341 lines** — the § _The corpus_ table's 30,555 B predates this phase's trim, which is what its commit anchor is there to say.

§ _Last verified_ gains a **new dated block for this plan, newest first**, keeping Plan 08's rather than overwriting it — Plan 08's own established convention.

### The repository gates

| Gate | Command | Result |
| --- | --- | --- |
| Lint chain | `yarn lint:check` | **exit 0**, read from `$?` on the command itself — never through a pipe |
| Docs links | `yarn workspace @openvaa/docs validate:links` | **exit 0** — 0 fixed, **0 broken** |
| Link guard | `bash .claude/scripts/audit-skill-links.sh` | `Checked: 636  Dangling: 207  Skipped: 191`, exit 1 by design — see the token-level proof above |
| Routing guard | `bash .claude/scripts/audit-skill-routing.sh` | `Violations: 5`, exit 1 by design — every one dispositioned above |

`lint:check` carries Phase 152's scan and it is live and green: *"Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1663 … 0 violation(s)."*

### The end-to-end gate — RUN, with the counts verbatim

**Diff scope was established first and is stated, because the plan permits either a run or a justification and this took both routes.** `git diff --name-only 4d7b8201b..HEAD` lists **five paths, all under `.claude/` or `.planning/`** — nothing under `apps/`, `packages/` or `tests/`. Plan 08's standing gate at `f8e7b4b07` would therefore have carried it. **It was run anyway**, for the reason Plan 08 recorded: the E2E hard rule and the preflight contract are two of the four things this phase promised to keep in `CLAUDE.md`, so running the gate also checks that what that file says about the harness is still true. Disk headroom checked first — **85 GiB free**, `tests/e2e-runs` 6.9 G — because a run that dies on a full disk produces did-not-run tests, which count as failures.

```
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/160-09-phase-gate --no-db-reset
```

| Metric | Verbatim |
| --- | --- |
| **passed** (`expected`) | **155** |
| **failed** (`unexpected`) | **0** |
| **skipped** | **0** |
| **flaky** | **0** |
| **did-not-run** | **0** — status tally over `results.json` is `{"expected": 155}` and no other key; `errors: 0` |
| Playwright exit | **0** (`155 passed (10.4m)`) |
| Wrapper exit | **0** |
| `preflight-failures` / `preflight-successes` | **0 / 1** |
| retries / workers | **0 / 6** (`ci_env=unset`, `eperm07_knobs=unset`) |
| HEAD at run | `9837cd9a755305c4c91d9eb1e25544927db65c27` |
| Window | `2026-09-13T21:41:09Z` → `21:51:44Z` (626,630 ms) |

**Preflight confirmed rather than assumed**, verbatim from the run's own stdout:

```
E2E PREFLIGHT OK /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend (verified against /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd)
```

The served page came from **this** checkout, and the project-id half passed too: the wrapper spawned its own server on port 5273 with `e2e_project_id=00000000-0000-0000-0000-0000000000e2`. **Zero retries with `CI` unset** matters as much as the pass count — this is not a retried-to-green result. Evidence directory: `tests/e2e-runs/160-09-phase-gate/` (`results.json`, `stdout.log`, `devserver.log`, `env-posture.txt`, `preflight-successes`, `head`, `exit`).

The run was taken at `9837cd9a7`, before the Task 3 commit. The only change after it is `.claude/skills/README.md` — Markdown the Playwright suite does not load.

### No CI claim, and no drift-guard claim

**CI did not verify this work and this plan does not say it did.** `.github/workflows/main.yaml` carries `paths-ignore: "**.md"` on every trigger, so an all-Markdown change never triggers the workflow; and its triggers are push to `main` or `ci-evidence/**` and pull requests targeting `main`, none of which `integration/ship-12-squash` matches. There is no run to cite.

**A green `audit-skill-drift.sh` is not evidence either**, and its output is recorded as context with its exit code disclaimed:

```
  components      OK    (synced as of 2026-09-13)
  data            OK    (synced as of 2026-09-13)
  database        OK    (synced as of 2026-09-13)
  filters         OK    (synced as of 2026-09-13)
  matching        OK    (synced as of 2026-09-13)
  ship-review-stack  DRIFT  4 commits, 2 files since 2026-08-29
  spike-findings-voting-advice-application-gsd  SKIP  (no targets defined)

Checked: 6  Drifted: 1  Skipped: 1
```

Exit 1. The five `OK` lines say "synced as of 2026-09-13" — the date of *this phase's own commits into those skills*. The guard baselines each skill on the last commit touching its directory, so a phase that edits a skill resets it to clean whether or not a listing was re-checked. **No criterion in this plan is marked verified on this run.** The one `DRIFT` is `ship-review-stack` against `.claude/scripts`, which this plan added a file to and which belongs to Phase 153 by operator decision `O4`.

### The prohibition check, scoped to this plan's commits

`git diff --name-only 4d7b8201b..HEAD` lists five paths and matches none of `(ROADMAP|STATE|REQUIREMENTS)\.md` or `^\.github/`. **Scoped to plan commits, as Plan 08 established** — a phase-wide diff fails because the orchestrator's own tracking commits touch `ROADMAP.md` and `STATE.md`, which the orchestrator's dispatch instruction mandates and which the prohibition (`160-CONTEXT.md` § 0.1(c)) does not bind.

### Reflexive listing re-check

The phase's own rule — after a change, re-check the skill, because skills contain listings — applied to this plan's own edits:

| Listing | Checked against | Result |
| --- | --- | --- |
| `CLAUDE.md § Skill Routing`'s 7 `Skill("…")` invocations | the live skill directories | **7 = 7**, both directions, 0 asymmetry |
| `README.md § The routing rule` "four of the seven" | Check B's output | **4 of 7** — still exact |
| `README.md § Adding a skill` "four of those out of seven live skills" | same | still exact |
| `README.md § The corpus` byte rows | the `find` pair | unmoved, because the self-exclusion holds |
| `BOUNDARIES.md` directory table | this plan's new file | **no edit needed** — the table maps source subsystems under `packages/` and `apps/`; it names no `.claude/` path, and `.claude/scripts` is a `targets:` entry of `ship-review-stack`, which Phase 153 owns by `O4`. Recorded because a re-check that finds nothing is still a re-check |
| `CLAUDE.md` | this plan's new file | **no edit needed** — `CLAUDE.md` names none of the three audit scripts, and Plan 01 landed its sibling unwired by the same boundary |

`.claude/skills/BOUNDARIES.md` and `CLAUDE.md` are in this plan's `files_modified` and were re-checked and left unchanged, which is stated here so their absence from the diff is not read as an omission.

---

## Defective criterion idioms met, and the substitutions used

Per the phase's standing rule, every idiom was run and read before being relied on. **No vacuous pass is reported as a pass.**

| Idiom | Verdict | Substitution |
| --- | --- | --- |
| `grep -v '^\./\.planning/'` | **Vacuous** under this shell — `grep` is a function wrapping `ugrep`, which emits no `./` prefix (Plan 07's finding) | Not used. The guard calls `command grep` throughout and the independence is *proven* by a poisoned-function run, not assumed |
| `awk '/^## X/,/^## /'` | **Collapses to the heading line** | `awk '/^## X/,0'` — used for the `CLAUDE.md § Skill Routing` extraction in the listing re-check |
| `head -n -1` | GNU-only, vacuous on macOS | Not used anywhere in this plan |
| `grep -c` for a zero result | Returns the number but **exits 1** | The number is read; the exit status is never used as a gate. Every `grep -c` in the script carries `\|\| true` |
| `echo "EXIT=$?"` after a pipe | **Reports the last stage, not the gate** — caught in this plan's own first argument-contract run, which read `EXIT=0` from `sed` while the script exited 1 | Re-run without the pipe; `yarn lint:check` exit status read from `$?` on the command itself |
| "`grep -c 'spike-findings\|architect' …` returns 0 **outside comments**" | Ambiguous — and the stronger property holds | Reported both: 0 outside comments **and** 0 for the whole file including comments |
| awk `printf` percentages | **Locale-dependent** — prints `62,0%` on this host | `export LC_ALL=C` inside the script |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The first pointer definition did not discriminate at all**

- **Found during:** Task 1
- **Issue:** Counting every path citation as a pointer line scored `CLAUDE.md` at 62.0% and `filters/extension-patterns.md` at 50.5%, above every genuine index in the corpus. A procedure names the files it operates on; that is content, not routing.
- **Fix:** A hop is a pointer to another corpus **Markdown document**. Source-code citations are not hops. Both the rejected attempt and its measured numbers are recorded in the script's header, since a definition arrived at by measurement is worth more than one asserted.
- **Verification:** the file-level distribution became a clean monotone run under 24%, and the section-level measurement separated `## Feature Areas` (88.9%) from `## Verification After Extension` (22.2%).
- **Committed in:** `b90266ee7`

**2. [Rule 1 - Bug] Scoped runs silently lost chains whose intermediate was out of scope**

- **Found during:** Task 1
- **Issue:** `audit-skill-routing.sh CLAUDE.md` reported `Violations: 0` while the whole-corpus run reported a chain through `README.md`, because the index lists were built only from in-scope files. A guard that reports clean when you narrow the scope is worse than no guard.
- **Fix:** Classification is computed corpus-wide; only printing and the counts follow the scope. Recorded in a comment at the site, with the reason.
- **Verification:** the same `CLAUDE.md` run now reports the chain.
- **Committed in:** `b90266ee7`

**3. [Rule 1 - Bug] The shared-stem list was labelled "longest first" and was not**

- **Found during:** Task 1, Check B red fixture
- **Issue:** `sort -u` ordered the stem rows lexically, so a 5-word stem printed above an 8-word one under a heading promising the opposite.
- **Fix:** `sort -t$'\t' -k1,1nr` on the stem length.
- **Committed in:** `b90266ee7`

**4. [Rule 1 - Bug] The record correction introduced a dangling citation**

- **Found during:** Task 2
- **Issue:** The corrected § _The routing rule_ text cited `references/migration-inventory-and-order.md:212` package-relatively. The link guard reported it immediately. This is precisely the trap the plan names — *a flattening that leaves a dangling citation has traded one violation for another*.
- **Fix:** repo-relative path.
- **Verification:** `bash .claude/scripts/audit-skill-links.sh .claude/skills/README.md` → `Dangling: 0`, exit 0, before the commit.
- **Committed in:** `9837cd9a7`

**5. [Rule 2 - Missing Critical] The escape hatch could not express the case it was needed for**

- **Found during:** Task 2
- **Issue:** The `<!-- skill-routing-allow: index -->` marker as first written suppressed only *file-level* index classification, while the binding verdicts are *section-level*. The one legitimate waiver in the corpus — a record whose citations are evidence, not routes — could not be expressed by the mechanism built for it.
- **Fix:** the marker suppresses index classification at both levels; the header states that it suppresses a verdict and never a measurement, and the densities still print.
- **Committed in:** `b90266ee7` (marker semantics), `9837cd9a7` (the one use, with its reason inline)

**6. [Rule 2 - Missing Critical] Check 3c in the link guard — an inbound obligation, decided rather than passed over**

Plan 08 named this class explicitly and left the decision here. Implemented rather than filed, in `audit-skill-links.sh` rather than in the new script, and measured non-regressive before landing. Full reasoning and the red-then-green evidence are under Task 2 above. **Committed in:** `9837cd9a7`

---

**Total deviations:** 6 (4 bugs, 2 missing-critical). **Impact:** all six are inside this plan's own blast radius, and four of them are defects in the instrument found *by exercising the instrument* — which is what the red-then-green requirement exists to produce. No scope creep: the two corpus-level violations are filed, nothing was deleted, and the four `Domain expert for the` descriptions were left alone despite the plan's stated preference, because the plan's own scoping rule and `160-CONTEXT.md` both put them outside this phase.

## Issues Encountered

**The corpus record's live-violation claim did not survive mechanization, and that is a finding rather than a problem.** `.claude/skills/README.md` asserted a specific three-hop chain. The instrument built to score exactly that rule reproduces a violation in the same skill, but neither at the hop count nor at the granularity the record claimed, and the record's own hop-counting would have condemned every skill in the tree including the shape the rule blesses. Corrected in place with both reasons, per the standing rule that a re-verification amends the claim rather than appending to it.

**One unresolved tension, stated plainly.** This corpus now asserts a one-level routing rule, ships an instrument that scores it, and carries one recorded exception that the instrument reports on every run. That is the honest cost of Plan 07's `delete-sources-only` outcome: the alternative was destroying 301,737 B of content with no other copy in the working tree and none in `main`'s history. The exception is filed with its anchors, its two costed flattenings, and the reason neither is taken — a hand-flatten of generated content expires at the next `/gsd-spike --wrap-up`, so the durable fix is the generator.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **REVIEW-DOC-03 and REVIEW-DOC-04 are closed for this phase.** The structural rule is mechanically checkable and the corpus has been scored against it as shipped; citation integrity gained a check for the one class that had none.
- **Phase 163 inherits a third unwired guard.** `.claude/scripts/audit-skill-routing.sh` lands unwired by the same recorded boundary as `audit-skill-links.sh` — wiring guards into CI is 163's, and `.github/workflows/main.yaml`'s `paths-ignore: "**.md"` would have to move for either to fire on a documentation change. Both scripts say so in their own headers.
- **Two filings are open** and neither blocks anything in this milestone: the generator-side routing fix and the four descriptions. Both carry anchors, reproducing commands and costs.
- **`ship-review-stack` reports DRIFT against `.claude/scripts`** because this plan added a file to one of its declared targets. Untouched here; it belongs to Phase 153 by `O4`.

---

## Self-Check: PASSED

**Created files exist on disk:**

- `.claude/scripts/audit-skill-routing.sh` — FOUND
- `.planning/todos/pending/2026-09-14-spike-findings-skill-routing-depth.md` — FOUND
- `.planning/todos/pending/2026-09-14-non-discriminative-skill-descriptions.md` — FOUND
- `.claude/skills/README.md` — FOUND (modified)
- `.claude/scripts/audit-skill-links.sh` — FOUND (modified)

**Commits exist:** `b90266ee7`, `9837cd9a7`, `373ec354a` — all three found in `git log --oneline --all`.

**No file deletions:** `git diff --diff-filter=D --name-only` over each of the three commits is empty.

**Plan-level verification re-run at SUMMARY time:** `audit-skill-routing.sh` exit 1 with every violation dispositioned; `audit-skill-links.sh` `Dangling: 207` with an empty introduced-token set; `yarn lint:check` exit 0; Playwright 155/0/0/0/0.

---

_Phase: 160-agent-docs-skills-refresh_
_Completed: 2026-09-14_
