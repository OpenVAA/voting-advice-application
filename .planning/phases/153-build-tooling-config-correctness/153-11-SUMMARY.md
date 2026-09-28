---
phase: 153-build-tooling-config-correctness
plan: 11
subsystem: infra
tags: [comment-hygiene, guard, lint-check, css, markdown, coverage-ids, operator-ruling, windows-ledger, requirements]

requires:
  - phase: 153-01
    provides: "`scripts/assert-declared-binaries.mjs` — the census-bearing guard shape (named-constant exclusions, no opt-out flag, summary line stating what was examined) this plan's `VENDORED_EXCLUSIONS` and the reference gate's three census lines follow"
  - phase: 155-05
    provides: "`scripts/lib/comment-spans.mjs` — the shared comment-span classifier whose `FAMILY_BY_EXT` gains `css`/`scss` here rather than a fourth hand-rolled opinion about what a comment is"
provides:
  - "`.planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-grep-report.sh` — `task-id` row narrowed to the ruled coverage-id namespace via the `COVERAGE_ID_NAMESPACE` named constant, all nine rows scoped with `':(exclude)*.md'`, three census lines added"
  - "`scripts/assert-comment-hygiene.mjs` — `VENDORED_EXCLUSIONS` named Map (2 entries, each with its reason), stale-entry fail-closed check, exclusion count and paths printed in the summary line"
  - "`scripts/lib/comment-spans.mjs` — `css` and `scss` families, narrowing the divergence from the ship-review-stack source copy"
  - "`apps/frontend/src/app.css` — 14 rule-2 forced-line-break junctions swept, comment-only, zero allow entries"
  - "`.planning/phases/153-build-tooling-config-correctness/153-HYGIENE-CLASS-CLOSURE.md` — the closure record, including what is out of the class BY RULING so it cannot be read as a gap"
  - "WINDOWS 120 / 122 / 129 `fixed`; WINDOWS 181 appended (the 59-junction `.toml` gap)"
affects: [153-09, 152-requirements, future-hygiene-enforcement-phase]

actuals:
  tokens: 19066
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "A narrowing is only landed with a flip test proving the row still fires — and the control is checked for having actually injected anything, because a control that injects nothing also reports the same green"
    - "Exclusions are named constants with stated reasons, and a stale one fails the guard CLOSED: an exclusion naming a file that no longer exists is a hole nobody can see"
    - "Sweep-then-enable ordering (D-N1(c) avoidance): the rule is added only after the tree satisfies it, so the guard is never red, never disabled, never warn-only on arrival"
    - "Re-measure every inherited figure. Four were carried into this plan; three were wrong."

key-files:
  created:
    - .planning/phases/153-build-tooling-config-correctness/153-HYGIENE-CLASS-CLOSURE.md
  modified:
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-grep-report.sh
    - scripts/assert-comment-hygiene.mjs
    - scripts/lib/comment-spans.mjs
    - apps/frontend/src/app.css
    - .planning/WINDOWS.md

key-decisions:
  - "NEITHER requirement marked. `REVIEW-HYG-01` is short by 64 forced line breaks in `apps/**` (5 vendored-by-ruling + 59 in `apps/supabase/supabase/config.toml`); `REVIEW-HYG-02` is short by 34 gated occurrences across 15 files. `requirements ready-ids` said both were `ready` — that is a frontmatter/dependency statement, not a measurement, and the tree wins."
  - "The `task-id` row was narrowed TWICE. The ruled narrowing (coverage-id namespace) and an unruled one: a suffix-capture bug reporting a phantom `EDGE-` namespace that is really the tail of `REVIEW-EDGE-0N`. Occurrence count identical at 106 either way — attribution fixed, not arithmetic."
  - "The Markdown exclusion is written out at each of the nine call sites rather than hoisted into a named constant, against the plan's wording, because the script's own D-15 scope invariant forbids hiding a pathspec behind a variable. The pattern exclusion IS a named constant, where a variable is the right shape."
  - "`apps/supabase/supabase/config.toml`'s 59 junctions were NOT swept and `toml` was NOT added: no ruling sizes a toml sweep, and the file's comments are Supabase-CLI-emitted upstream reference documentation that CLI upgrades re-emit — the same class D7b excluded rather than swept."
  - "`gsd-tools windows fixed <id>` takes no reason argument, so the commit citations the plan asked each entry to carry live in the closure record and here, not in the ledger. The ledger was not hand-edited."

patterns-established:
  - "The first attempt at a flip test injected NOTHING (the injector matched `^test\\(` against titles indented inside a `test.describe`) and the row did not move. Only the token list exposed it. A control must be verified to have taken effect before its green is read as evidence."
  - "Bound a comment-only-diff prover range AT the sweep commit, never at HEAD: a range ending on a docs commit always reports violations because the classifier reads Markdown as code."

requirements-completed: []

coverage:
  - id: D6
    description: "The `task-id` row no longer matches the E2E coverage-id namespace, the exclusion is a named constant, and the row still catches a genuine planning id"
    verification:
      - kind: other
        ref: "row 106 → 16 occurrences; 76 real test/describe titles carry a coverage id and the narrowed row matches 0 of them; coverage-id occurrences 179 at a65679a0f, 179 at HEAD"
        status: pass
      - kind: other
        ref: "catch flip: SWEEP-03 injected into tests/tests/specs/voter/voter-alliance.spec.ts:31 → task-id 16→17 (9→10 files), --assert-clean EXIT=1; removed → 16 (closure record §2c)"
        status: pass
      - kind: other
        ref: "D-06 flip: gate goes red on decision-id-bare 1→2, NOT on task-id (unmoved at 16); removed → 1. The plan's premise that D-06 is a task-id match is falsified — 1-letter prefix"
        status: pass
    human_judgment: false
  - id: D7
    description: "Markdown is out of the class, the gate says so rather than skipping silently, and no `.md` byte changed outside `.planning/`"
    verification:
      - kind: other
        ref: "`':(exclude)*.md'` on all nine rows; header states '227 Markdown file(s) … NOT scanned, per operator ruling D7'; census lines 2658 tracked / 2431 greppable / 227 declined"
        status: pass
      - kind: other
        ref: "git diff --stat a65679a0f..HEAD -- '*.md' ':(exclude).planning' — empty"
        status: pass
      - kind: other
        ref: "two consecutive runs on an unchanged tree: stdout AND stderr byte-identical"
        status: pass
    human_judgment: false
  - id: D7b
    description: "`app.css` swept comment-only, the two vendored files excluded by named constant, `css`/`scss` added AFTER the sweep with the guard green on arrival"
    verification:
      - kind: other
        ref: "assert-comment-only-diff.mjs --range 58be1b985~1..58be1b985 — files changed 1; compared 1; allowed by name 0; 0 violation(s)"
        status: pass
      - kind: other
        ref: "census 1,580 → 1,584 (+6 tracked css, −2 vendored); 0 violations; --self-test 6 fixtures / 27 edge cases / 0 failures; two runs byte-identical on stdout and stderr"
        status: pass
      - kind: other
        ref: "sweep flip: pre-sweep blob restored → EXIT=1, 14 findings all naming app.css; restored → EXIT=0. Exclusion flip: VENDORED_EXCLUSIONS emptied → EXIT=1, 5 findings naming inter.css and prism-vs.css, census 1584→1586; restored → EXIT=0. Stale-entry flip: path renamed → EXIT=1 naming the dead entry; restored → EXIT=0"
        status: pass
      - kind: other
        ref: "inter.css and prism-vs.css byte-identical — neither appears in git diff a65679a0f..HEAD"
        status: pass
    human_judgment: false
  - id: D8
    description: "Both requirements re-measured against the tree and given an honest disposition; nothing force-marked"
    verification:
      - kind: other
        ref: "REVIEW-HYG-01 Pending: escape half 0, wiring half link 7 of 11, line-break half 64 survivors (5 + 59). REVIEW-HYG-02 Pending: 34 gated occurrences across 15 files, 24 of them written after phase 152 closed (10 at fee77f596 vs 34 at HEAD)"
        status: pass
      - kind: other
        ref: "REQUIREMENTS.md not touched; requirements mark-complete not invoked for either id"
        status: pass
    human_judgment: false

duration: 62min
completed: 2026-08-29
status: complete
---

# Phase 153 Plan 11: Hygiene Class Closure — Three Rulings Executed, Two Requirements Measured Summary

The operator's D6/D7/D7b rulings are executed and their three WINDOWS entries are `fixed`; **neither
requirement is marked**, because re-measuring both from scratch — no inherited figure carried —
shows `REVIEW-HYG-01` short by 64 forced line breaks in `apps/**` and `REVIEW-HYG-02` short by 34
planning references across 15 files, **24 of which were written after phase 152 closed**.

## Accomplishments

- **D6 — the `task-id` row narrowed, 106 → 16.** `COVERAGE_ID_NAMESPACE` is a named constant in
  `hygiene-grep-report.sh`, not a flag and not an ignore file. The 179 coverage-id occurrences and
  the 76 test titles carrying them are byte-identical; no test file was edited by this plan at all.
- **D6b (unruled) — a suffix-capture bug fixed.** The old pattern matched the *tail* of
  `REVIEW-EDGE-0N` and reported 18 occurrences under a namespace `EDGE-` that exists nowhere in the
  repository. A later reader closing the row by adding `EDGE` to the namespace list would have
  blinded the gate to every `REVIEW-EDGE-*` citation in the tree.
- **D7 — Markdown scoped out**, `':(exclude)*.md'` on all nine rows, 227 files declined, and the
  report **says so** in its header plus three new census lines.
- **D7b — CSS covered, in the ruled order.** `app.css` swept (14 → 0, comment-only, **zero allow
  entries** over a range bounded at the sweep commit), the two vendored files codified as
  `VENDORED_EXCLUSIONS` with stated reasons, then `css`/`scss` added. Census 1,580 → **1,584**,
  guard green on arrival, never red, never disabled, never warn-only.
- **A new gap found and registered.** `apps/supabase/supabase/config.toml` carries **59** rule-2
  junctions in a family no ruling covers — WINDOWS 181.
- **Six flip tests, both halves each, recorded verbatim** in `153-HYGIENE-CLASS-CLOSURE.md`.

## Falsified premises — four, with the measurement

| Inherited claim | Source | Measured |
|---|---|---|
| WINDOWS 120/122/129 read `ruled` | task brief + ruling doc | All three read **`open`** in both the Markdown table and the JSON block. The `ruled` value was described in prose and never written. |
| "117 attributed reference-gate survivors" | 152-15 | **155** unnarrowed (49 comparable + 106 `task-id`); **38** after both rulings, of which **34** are gated. |
| Guard census "rises from 1,564" | plan must-have | 1,564 was the phase-152 figure; today's baseline is **1,580**, rising to **1,584**. |
| "`D-06` injected into a test title turns the `task-id` row red" | plan must-have | `D-06` has a **one-letter** prefix; `[A-Z]{3,}` never matched it under either pattern. Flip-tested: `decision-id-bare` 1 → 2 → 1, `task-id` unmoved at 16. |
| "4 comment-bearing `.css` files" | 152-15 | **5** of the 6 tracked css files carry comments. The 19-violation total was right; the file count was one low. |
| "19 forced line breaks in `apps/**/*.css`" | 152-15 | **Held exactly** — 14 + 3 + 2. |

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] Suffix-capture in the `task-id` pattern**
- **Found during:** Task 1, while enumerating what the coverage-id exclusion would remove.
- **Issue:** `\b[A-Z]{3,}-\d{2}\b` matched the tail of longer hyphenated identifiers, reporting a
  phantom `EDGE-0N` namespace for what are really `REVIEW-EDGE-0N` requirement ids. Same defect the
  script's own header documents one row above for `D-13` inside `D-137-11`; same defect 153-10's
  guard shipped with.
- **Fix:** pattern matches the whole identifier —
  `(?<![A-Za-z0-9-])(?!(?:<namespace>)-)[A-Z]{3,}(?:-[A-Z]{2,})*-\d{2}\b`.
- **Proof it is a re-attribution and not a re-count:** 106 occurrences under both patterns.
- **Commit:** `f26973481`

**2. [Rule 2 — Missing critical functionality] A stale exclusion was a silent hole**
- A `VENDORED_EXCLUSIONS` entry naming a renamed or deleted file would stop excusing anything while
  still asserting a decision. The guard now fails closed on it; flip-tested both halves.
- **Commit:** `f943f4824`

**3. [Rule 2] Census lines added to the reference gate**
- The gate reported occurrence counts with no statement of how many files it examined. A gate that
  examines nothing also reports green — the failure mode this milestone has caught three times.
- **Commit:** `f26973481`

### Deviation from the plan's literal wording, taken deliberately

**The Markdown exclusion is repeated at each call site rather than hoisted into a named constant.**
The plan asked for a named constant; the script's own D-15 invariant says pathspecs must be written
out at each call site "so the scope is auditable by eye and cannot be widened in one edit". A
hoisted variable would have been the first pathspec in the file that one edit could change for all
nine rows. The requirement that matters — no flag, no ignore file, no roster, excusing a case means
editing the script — is satisfied either way. The D6 **pattern** exclusion is a named constant.

### Self-inflicted, caught and reverted

**Probing `gsd-tools windows fixed 179` to discover its argument signature MUTATED the ledger.**
The command has no dry-run and no `--help`; invoking it to read the usage error marked entry 179
(the CFG-02 CI-run blocker) `fixed` and moved the frontmatter counts. Reverted with
`git checkout HEAD -- .planning/WINDOWS.md` — safe because the file was committed and clean — and
verified back to `open 174 / fixed 6 / total 180` with 179 `open` and `resolved_at: null` before any
further ledger work. **Do not probe a `gsd-tools windows` subcommand for its signature; read
`~/.claude/gsd-core/bin/lib/broken-windows.cjs` instead.**

## Requirement disposition

**Neither marked. `REQUIREMENTS.md` untouched.** `requirements ready-ids` reported both `ready`;
that is a statement about this plan's frontmatter and dependencies, not about the tree.

- **`REVIEW-HYG-01` → Pending.** Escape half MET (rule 1: 0 over 1,584 files). Wiring half MET
  (`yarn assert:comment-hygiene` is link **7 of 11**, all eleven asserted present by name; the guard
  has no scan-narrowing flag). **Line-break half NOT MET by 64 junctions in `apps/**`:** 5 in the
  two vendored `.css` files D7b excluded by name, and 59 in `apps/supabase/supabase/config.toml`,
  an extension family no ruling covers.
- **`REVIEW-HYG-02` → Pending.** 34 gated occurrences across 15 files after both rulings —
  `phase-ref` 15, `decision-id-bare` 1, `planning-path` 2, `task-id` 16. **And the class has
  reopened, measurably:** today's post-ruling pattern set finds **10** at the phase-152 close
  (`fee77f596`) and **34** at `HEAD`. `REVIEW-HYG-01` has a standing guard in `lint:check`;
  `REVIEW-HYG-02` has none — `hygiene-grep-report.sh` lives under `.planning/` and is referenced by
  no `package.json` script and no CI workflow. Closing it needs a sweep **and** an enforcement
  decision, neither of which is this plan's to make.

## WINDOWS transitions

| id | before | after | closed by |
|---|---|---|---|
| 120 (D6, task-id row) | `open` | `fixed` | `f26973481` |
| 122 (D7, Markdown sites) | `open` | `fixed` | `f26973481` |
| 129 (D7b, css/scss family gap) | `open` | `fixed` | `58be1b985` + `f943f4824` |
| **181** (new) | — | `open` | 59 rule-2 junctions in `apps/supabase/supabase/config.toml` |

Ledger: `open 174 / fixed 6 / total 180` → **`open 172 / fixed 9 / total 181`**.
`gsd-tools windows fixed` takes no reason argument, so the commit citations live here and in the
closure record rather than in the ledger's `reason` column; nothing was hand-edited.

## Verification

`yarn build` 14/14 · `yarn lint:check` 22/22 with **11 chain links, each asserted present by name** ·
`yarn test:unit` 25/25 · `yarn format:check` 7/7 clean · comment-hygiene guard 1,584 scanned / 2
vendored excluded and named in the output / 0 violations · `--self-test` 6 fixtures + 27 edge cases,
0 failures · both gates deterministic across two runs on stdout **and** stderr · other guards
unchanged (edge-env 17/0, declared-binaries 16 workspaces/0, env-pair-registry 4 pairs/0,
i18n-catalog 598 keys/0, a11y-scan 0).

`yarn db:lint:sql` is pre-existing red (it lints the live database) and was not scored.
`audit-skill-drift.sh` exits 1 with exactly `filters` and `matching`, the accepted post-153-08 state
per ruling D9.

**E2E was not run.** The phase-close full-suite run is `153-09`'s per operator ruling D1, and this
plan's diff over `apps/`, `packages/` and `tests/` is exactly one file — `apps/frontend/src/app.css`,
a CSS **comment** block, proven comment-only with zero allow entries. No runtime byte, no selector,
no route, no test title.

## What 153-09 must absorb from this plan

1. **The ledger was written for nine plans; it must now account for 153-10 and 153-11.** (Already
   noted for 153-10.)
2. **New artefact:** `.planning/phases/153-build-tooling-config-correctness/153-HYGIENE-CLASS-CLOSURE.md`.
3. **`lint:check` is still 11 links.** This plan added none and removed none; all eleven asserted by
   name.
4. **Requirement states:** `REVIEW-HYG-01` and `REVIEW-HYG-02` remain **Pending**, each with a named
   unmet clause — joining `REVIEW-CFG-08` (153-05) and `REVIEW-CFG-05` (153-08). Four Pending
   requirements now carry a measured reason rather than a tick. Phase 153 discharged two
   requirements *belonging to phase 152* by measuring them; it did not complete them, and the ledger
   should not imply 152 did.
5. **WINDOWS:** 120/122/129 → `fixed`; **181 appended and open** (the `.toml` gap). Ledger totals
   `open 172 / fixed 9 / total 181`.
6. **Unchanged and still owed:** row **179** stays `open`. `153-09-PLAN.md` still frames the CFG-02
   filing as "REVIEW-CFG-02's binding observation" being CI-blocked; the binding **was** observed
   locally, both halves, by **153-02**, and what is blocked is the negative-control job's **first CI
   run**. This plan did not edit `153-09-PLAN.md`.
7. **A recurring-defect data point for the phase retrospective:** the suffix-capture bug fixed here
   is the **fourth** instance this milestone of a pattern that silently measures the wrong thing
   (153-06's unanchored grep, 153-03's bare-string gate, 153-10's suffix capture, this one) — and
   the third instance of a control that examined nothing (this plan's own first flip attempt).

## Self-Check: PASSED

All six named files present on disk; all four commits (`58be1b985`, `f943f4824`, `f26973481`,
`59f5ee9b4`) present in `git log`. Both gates re-run with this summary and the closure record on
disk: comment-hygiene 1,584 scanned / 0 violations, reference gate `task-id` unmoved at 16 — neither
artefact trips the patterns it documents, because both live under `.planning/`, outside all three
scan roots.

---

## CORRECTION — 2026-08-29, orchestrator, after phase verification

**This document claims the chain spec asserts "all eleven `lint:check` links present by name". It
asserts EIGHT of eleven.** The phase verifier demonstrated it rather than inferring it: removing
`yarn assert:a11y-scan-wiring` from the chain left **all 28 gate specs passing**, while removing
`yarn assert:comment-hygiene` reddened `ciTypecheckGate.test.ts` immediately.

The three unprotected links are `eslint … tests`, `assert:i18n-catalog-namespaces` and
`assert:a11y-scan-wiring` — all **Phase 147's**, not this phase's. So the shipped work is sound and
no guard is missing; the defect is in this record's wording, which overstates the spec's coverage.

Left as a finding rather than fixed here: widening the spec to all eleven is real work with its own
flip-test obligation, and it belongs to whoever owns those three links. Corrected in place so a later
planner does not inherit the stronger claim.
