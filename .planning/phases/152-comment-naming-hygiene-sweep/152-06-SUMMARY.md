---
phase: 152-comment-naming-hygiene-sweep
plan: 06
subsystem: tests
tags: [sweep, judgement-pass, playwright-config, e2e-shared-surface, behaviour-neutrality, unsatisfiable-criterion]

# Dependency graph
requires:
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-05's repaired codemod, its `assert-comment-only-diff.mjs` prover, and `152-RESIDUE-REGISTER.md`'s seven-way partition — the file set this plan works from"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-05's discharged E2E cardinal gate (150 passed / 0 failed / 0 did-not-run), which is why a comment-only plan does not re-run the suite"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-04's precedent: an unsatisfiable acceptance criterion is proven by another named route, reported, and registered — never engineered around"
provides:
  - "the repository's densest planning-narrative file swept: `tests/playwright.config.ts`, 0 on every gate row, no configured value changed"
  - "the whole of the register's `152-06` partition swept — including the sixteen files this plan's own frontmatter omitted and no sibling plan owns"
  - "a comment-scoped gate route, flip-tested, for the three gate rows whose only remaining occurrences are program bytes"
  - "five registered findings the next six judgement plans need before they start"
affects: [152-07, 152-08, 152-09, 152-10, 152-11, 152-12, 152-13]

# Actuals (#2632)
actuals:
  tokens: 71000
  tasks: 2
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "assert-once-per-replacement applier: a table of [old, new, expectedCount] pairs, every entry asserted to match EXACTLY its expected count before ANY byte is written — a miscounted or drifted anchor aborts the whole batch instead of silently applying a subset"
    - "comment-scoped gate as the alternate route: when a raw-text gate cannot reach zero because its residue is program bytes, re-run the SAME pattern set over the shared classifier's comment spans only — and flip-test it, because a gate that examines nothing reports green"
    - "domain-term rescue: Playwright's own `phase N` scheduling vocabulary is reworded (`the third scheduling phase`) rather than stripped, so the gate reads zero without the file asserting something false"

key-files:
  created: []
  modified:
    - tests/playwright.config.ts
    - tests/tests/utils/axeScan.ts
    - tests/tests/utils/rawKeyScan.ts
    - tests/tests/utils/testIds.ts
    - tests/tests/utils/voterNavigation.ts
    - tests/tests/fixtures/voter/voter-journey.fixture.ts
    - tests/tests/helpers/navigation.ts
    - tests/tests/setup/shared/assertTeardown.ts
    - tests/tests/setup/candidate/bank-auth-journey.setup.ts
    - tests/tests/support/preflight.ts
    - tests/scripts/visual-container.sh
    - "(35 files in total — `git diff --name-only 80e02e753..e2978881d`, the sweep range; `..HEAD` adds the four .planning docs written by the closing commits)"

key-decisions:
  - "The whole of the register's `152-06` partition was swept, not just the four paths in this plan's frontmatter. Sixteen files sat in the gap and NO sibling plan owns them (152-07 takes specs only; 152-13 titles; 152-14 line breaks; 152-15 the guard). Left alone they would have survived the entire phase behind a green per-plan gate — the exact failure 152-05's total-and-disjoint partition was built to make impossible."
  - "Three gate rows are UNSATISFIABLE over this file set by construction and are reported rather than engineered around. All six remaining occurrences are program bytes — a throw message, an operator-facing echo, a shell variable value — which this plan's own prover forbids changing with zero allow entries. The underlying property was proven instead by a comment-scoped route running the SAME nine patterns over the shared classifier's comment spans, flip-tested to 6 red / 0 green."
  - "The plan's own gate INVOCATION does not exist. `hygiene-grep-report.sh -- <pathspec>` exits 2: the script rejects any `-*` token and hardcodes its pathspec at every call site BY DESIGN. The script was not modified; the property was proven by an equivalent transcribed route. Plans 152-07 … 152-12 carry the same invocation and will hit the same exit 2."
  - "Playwright's own `phase N` scheduling vocabulary was REWORDED, not stripped. `phase 2` / `phase 3` / `phase 55` in this config name Playwright's execution phases, not planning phases; deleting the numeral to satisfy `phases?\\s+\\d+` would have left three true statements false. They read `the second / third / 55th scheduling phase` and the gate reads zero."
  - "Two-letter review-finding ids (CR-01, WR-02…WR-10, IN-01…IN-03) and single-token sweep ids (F3, F4, F10, W1/W3/W5) were KEPT, with only the surrounding `see phase N` citation stripped — neither the gate nor the codemod treats them as violations, and several appear verbatim in shipped runtime error strings the prover forbids changing. Deleting them from comments would desynchronise a comment from the code it explains."
  - "One FALSE claim was corrected rather than preserved. `bank-auth-journey`'s setup and teardown docblocks asserted the project `stands ALONE, NOT threaded into the perm serial chain`; the config declares `dependencies: ['voter-prefs-tracking']`, the perm chain's last leaf. Stripping only the citation would have left a bare false sentence standing more baldly than before."
  - "REVIEW-HYG-02 was NOT marked complete. `requirements.ready-ids` returns 0/1 — sibling plans in this phase declare the same id with no SUMMARY yet, so the shared-ID gate correctly holds it Pending."

patterns-established:
  - "A green balance line proves completeness, never correctness — and so does a green GATE. Three of this plan's gate rows can only be read by knowing WHERE the occurrence lives; a gate that counts raw text cannot tell a comment from a throw message, and reading it as a verdict would have driven an edit to program bytes."
  - "When a plan's frontmatter and the phase's partition register disagree about scope, the REGISTER wins and the mismatch is registered. A frontmatter narrower than the partition is how a phase reaches a green gate with untouched violations."

# NOT marked Complete in REQUIREMENTS.md: `requirements.ready-ids` returns 0/1.
# Sibling plans in this phase declare REVIEW-HYG-02 and have no SUMMARY yet, so the
# shared-ID gate holds it Pending. 152-01 force-marked such an id in error and had to revert.
requirements-completed: [REVIEW-HYG-02]

coverage:
  - id: D1
    description: "The repository's densest planning-narrative file carries only comments that explain the configuration in front of them, and no configured value changed."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "gate scoped to tests/playwright.config.ts — phase-ref 65→0, spike-ref 1→0, section-anchor 4→0, every other row 0; HYGIENE CLEAN"
        status: pass
      - kind: other
        ref: "`git diff 4369231e9~1..4369231e9 -- tests/playwright.config.ts | grep -cE '^[+-]\\s*(projects|name:|testMatch|dependencies|teardown|timeout|retries|workers|grep)'` → 0"
        status: pass
      - kind: other
        ref: "`assert-comment-only-diff.mjs --range HEAD~1..HEAD` at 4369231e9 — 1 file compared, 0 allowed by name, 0 violations, exit 0"
        status: pass
      - kind: other
        ref: "`yarn typecheck:tests` exit 0; `node scripts/assert-comment-hygiene.mjs` exit 0; `npx prettier --check` clean"
        status: pass
    human_judgment: false
  - id: D2
    description: "The E2E suite's shared utilities and fixtures carry only comments that explain their code, and every diagnosed-hazard note survives with its reason intact."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "gate scoped to tests/tests/utils + tests/tests/fixtures — phase-ref 35→0, section-anchor 3→0, milestone-ver 4→0; planning-path 1, unsatisfiable (see D4)"
        status: pass
      - kind: other
        ref: "`git diff 80e02e753..HEAD -- tests/ | grep -cE '^[+-]\\s*(export |const |function |import )'` → 0 (no declaration line changed)"
        status: pass
      - kind: other
        ref: "`assert-comment-only-diff.mjs --range HEAD~1..HEAD` at a00ae4fab — 18 files compared, 0 allowed by name, 0 violations"
        status: pass
    human_judgment: false
  - id: D3
    description: "The whole of the register's 152-06 partition is swept — including the sixteen files this plan's frontmatter omitted and no sibling plan owns."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "`comm -13 <register 152-06 list> <git diff --name-only 80e02e753..HEAD>` → empty (no out-of-partition file touched)"
        status: pass
      - kind: other
        ref: "`comm -23` → exactly one file, tests/tests/fixtures/shared/popupNotice.fixture.ts, whose only span-bearing token is `WR-05` (kept by the recorded convention)"
        status: pass
      - kind: other
        ref: "gate over tests/** minus specs minus markdown — phase-ref 164→0, spike-ref 1→0, section-anchor 7→0, plan-number 0, decision-id-long 0"
        status: pass
      - kind: other
        ref: "`bash -n` clean on determinism-batch.sh, e2e-run.sh, visual-container.sh"
        status: pass
    human_judgment: false
  - id: D4
    description: "The three gate rows that cannot reach zero are proven by an alternate named route, reported, and registered — not engineered around."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "comment-scoped gate over all 36 partition files — 5,035 comment lines examined; 0 on every gated row; the single milestone-ver hit is the Docker tag `playwright:v1.58.2-noble`, which the gate's own header forbids stripping"
        status: pass
      - kind: other
        ref: "FLIP TEST — injecting one token of each class into a comment turns 6 rows red and exits 1; reverting returns 0 rows red and exit 0. The route is proven to catch."
        status: pass
      - kind: other
        ref: "all six raw-text residue occurrences resolved to source and confirmed as program bytes (1 throw message, 1 echo, 2 echoes + 1 variable value + 1 REASON assignment)"
        status: pass
      - kind: other
        ref: "WINDOWS.md entries 80, 81 — the unsatisfiable rows and the non-existent gate invocation"
        status: pass
    human_judgment: false
  - id: D5
    description: "Nothing but comment bytes changed across the whole plan, with zero allow entries."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "`assert-comment-only-diff.mjs --range 80e02e753..e2978881d` (the SWEEP range; `..HEAD` also spans the two docs commits, whose .md/.json files the prover correctly fails closed on) — files changed 35; compared 35; allowed by name 0; 0 violation(s); exit 0"
        status: pass
      - kind: other
        ref: "`yarn lint:check` — 22 tasks successful, svelte-check 0 errors / 0 warnings, all three repo guards 0 violations, exit 0"
        status: pass
      - kind: other
        ref: "`yarn typecheck:tests` exit 0 (run after each of the three commits)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Comment prose that survived the sweep still says something TRUE about the code in front of it."
    requirement: REVIEW-HYG-02
    verification: []
    human_judgment: true
    rationale: "No instrument can check whether a rewritten sentence is accurate — that is precisely the half of criterion 5 the prover's own docblock says it cannot judge. 160 rewrites were read individually against the code beside them, and one pre-existing FALSE claim was found and corrected in the process, but a reviewer should spot-check the long spans listed in this SUMMARY."

# Metrics
duration: ~40 min
completed: 2026-08-29
status: complete
---

# Phase 152 Plan 06: The Playwright Config and the E2E Shared Surface Summary

**The repository's densest planning-narrative file and the whole of the register's `152-06` partition swept — 187 replacement sites across 35 files, mechanically proven to have changed zero program bytes with zero allow entries — plus three acceptance criteria that turned out to be unsatisfiable by construction, proven instead by a flip-tested alternate route and registered rather than engineered around.**

## Performance

- **Duration:** ~40 min
- **Commit window:** 2026-08-28T22:25:43Z → 22:33:36Z (verification through ~22:40Z)
- **Tasks:** 2 of 2, plus one recorded deviation commit
- **Files modified:** 35 (36th partition file deliberately untouched — see below)

## Task Commits

1. **Task 1: the Playwright configuration** — `4369231e9` (refactor)
2. **Task 2: the shared utilities and fixtures** — `a00ae4fab` (refactor)
3. *(deviation)* **the rest of the register's `152-06` partition** — `e2978881d` (refactor)
4. **this SUMMARY** — (docs)

---

## ⚠ THE THREE FINDINGS THE NEXT SIX PLANS NEED BEFORE THEY START

### 1. The plan's gate invocation does not exist

Every acceptance criterion in this plan — and, by inspection, in `152-07` … `152-12` — reads:

```
bash .../hygiene-grep-report.sh -- tests/playwright.config.ts
```

That **exits 2**. The script's argument loop rejects any token matching `-*` (`unknown flag: --`), and its nine `git grep`s hardcode `-- apps/ packages/ tests/` at each call site *deliberately* — its own header says so in terms: *"SCOPE IS LOAD-BEARING … written out at each call site rather than hidden behind a variable, so the scope is auditable by eye and cannot be widened in one edit."*

The script is therefore **not scopeable from the command line at all**. It was **not modified** — narrowing a deliberately-unnarrowable scope is precisely the edit its header forbids. The property was proven by an equivalent route: the same nine patterns, transcribed verbatim, run under a caller-supplied pathspec.

```bash
row() { git grep -I -h -o -P "$3" -- "${@:5}" | wc -l; }   # …one call per shipped row
```

Registered as **WINDOWS 81**.

### 2. Three gate rows are unsatisfiable, because their residue is program bytes

After the sweep, six occurrences remain across the partition. **Every one of them is code.**

| Row | Count | Site | What it is |
|---|---:|---|---|
| `planning-path` | 1 | `tests/tests/fixtures/voter/voter-journey.fixture.ts:149` | inside a `throw new Error(...)` message |
| `decision-id-bare` | 1 | `tests/scripts/visual-container.sh:505` | an operator-facing `echo` |
| `task-id` | 4 | `tests/scripts/determinism-batch.sh` 97 / 266 / 321 / 549 | a shell variable value, two `echo` strings, a `REASON=` assignment |

All four sites are residue classes **B2 / E / F** in `152-RESIDUE-REGISTER.md` § 4.4 — 152-05 hand-reviewed and classified them, and predicted exactly this. Editing any of them changes program bytes, which **this same plan's prover forbids with zero allow entries.** The criterion and the prohibition cannot both be satisfied.

Per the 152-04 precedent: reported, not engineered around. Registered as **WINDOWS 80**.

**The alternate route, and its flip test.** The underlying property — *no COMMENT carries a planning reference* — was proven by running the SAME nine patterns over only the text the phase's shared classifier calls a comment span:

```
comment-scoped gate — files scanned: 36; comment lines examined: 5,035
  phase-ref 0 OK · spike-ref 0 OK · decision-id-long 0 OK · decision-id-bare 0 OK
  section-anchor 0 OK · planning-path 0 OK · plan-number 0 OK · task-id 0 OK
  milestone-ver 1 REPORT   tcp-forward.mjs:17  v1.58   ← the Docker tag `playwright:v1.58.2-noble`
Gate rows failing (comment-scoped): 0
```

That last row is the gate behaving correctly: `milestone-ver` is report-only precisely because `v\d+\.\d+` matches genuine tool versions, and this one is a pinned image tag.

**A gate that examines nothing reports green**, which is the failure this whole phase exists to remove — so the route was flip-tested rather than trusted. Injecting one token of each class into a single comment turns **6 rows red, exit 1**; reverting returns **0 red, exit 0**. It also carries a hard `scanned === 0 → exit 2` precondition.

### 3. This plan's frontmatter is narrower than the partition it belongs to

`152-06-PLAN.md` names four paths: `tests/playwright.config.ts`, `tests/tests/utils/**`, `tests/tests/fixtures/**`, `tests/tsconfig.json`. The register's `152-06` partition is *"`tests/**` except the spec directories — the Playwright config, utils, fixtures, **helpers, setup and scripts**"* — **130 spans across 36 files.**

**Sixteen files sat in the gap**, carrying 64 raw-text gate occurrences between them:

```
tests/tests/helpers/navigation.ts          tests/tests/setup/shared/{assertTeardown,base.setup,
tests/tests/support/preflight.ts             base.teardown,setupFromTemplate}.ts
tests/eslint.config.mjs                    tests/tests/setup/candidate/bank-auth-journey.{setup,teardown}.ts
tests/global-setup.ts                      tests/tests/setup/perm/perm-show-feedback-survey.{setup,teardown}.ts
tests/scripts/{determinism-batch,e2e-run,visual-container}.sh · tests/scripts/tcp-forward.mjs
```

**No sibling plan owns them.** `152-07` takes `tests/tests/specs/**` only; `152-13` does title renames; `152-14` line breaks; `152-15` the standing guard. Left alone they would have survived the entire phase behind a green per-plan gate — the precise failure the register's *total-and-disjoint* partition was constructed to make impossible.

They were swept under this plan's own Task-2 acceptance criterion, which permits any file **inside** the register's list. `tests/tsconfig.json` was checked and carries nothing. Registered as **WINDOWS 79**, because the guarantee lives in the REGISTER and not in every plan's frontmatter: `152-07` … `152-12` should each be checked against the register's file list rather than against their own `files_modified`.

---

## Accomplishments

### Task 1 — the Playwright configuration (`4369231e9`)

**45 replacement rules applied at 72 sites in one 1,704-line file.** 28 of those sites are one rule: the `// reason (see phase 140 WR-02): …` teardown-retry rationale, repeated verbatim on 28 `data-teardown-*` projects. Its reason — *"the F3 accounting assertion in `runTeardownAsserted` is state-mutating; a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's `retries: 3` would mask exactly the partial-delete class the assertion exists to catch"* — is kept in full on all 28.

**Gate scoped to this file:** `phase-ref` 65 → **0**, `spike-ref` 1 → **0**, `section-anchor` 4 → **0**, `milestone-ver` 1 → **0**. Every row OK.

**No configured value changed.** The diff-grep over `projects | name: | testMatch | dependencies | teardown | timeout | retries | workers | grep` returns **0**, and the prover compared the file byte-for-byte outside its comment spans.

#### The long-span dispositions (the plan requires these named, one reason each)

| Span | Lines | Disposition | Reason |
|---|---:|---|---|
| ORPHAN-PROBE GUARD docblock | 17 | **rewritten** | The enumeration-drift argument and the F4 measurement (4 probe files, 6 tests, unreachable, found by audit) explain why the code *throws* instead of asking future authors to remember. The two phase numbers explained nothing. |
| SOFT-ASSERTION BUDGET GUARD docblock | 26 | **rewritten** (2 lines) | The 3-declared-vs-136-actual drift, the equality-not-a-ceiling rationale and the `--list`-doesn't-run-globalSetup argument are the whole justification for a config-load-time throw. Only the plan citation went. |
| TEARDOWN-PREFIX-UNIQUENESS docblock | 42 | **rewritten** (5 sites) | CR-01's identical-`e2e-perm-notloc-` collision, the `LIKE '<prefix>%'` overlap bug and the enumeration-scope argument are the only in-tree record of a diagnosed race. Citations stripped, findings kept. |
| the project-graph docblock | 38 | **rewritten** | Every chain description is live wiring documentation. The `phase 147 ungated it` narrative went; `phase 2` became `the second scheduling phase`; the derivation now points at the `candidate-a11y-scan` project in this same file rather than at a planning document. |
| visual-diff budget derivation | 25 | **rewritten**, 2 units **deleted** | The `comparators.js` arithmetic, the 47,155 px runaway, the 0-px-in-40-cells noise floor and the 3,603.6 px dormant-ratio calculation are measurements no other document holds. Deleted: *"The measured noise and this derivation are recorded in the visual-noise ledger"* and *"(which is how this comment read before phase 146)"* — both say only where something was written down. |
| `trace: retain-on-failure` rationale | 19 | **rewritten** (1 site) | The 260–340 MB-per-run measurement is the whole argument. `phase 65's sweep` → `a past sweep`. |
| the `auth-setup` wiring block | 58 | **rewritten**, 1 paragraph **deleted** | The W1/W3/W5 scoring and the *0 mismatches over 91 scheduled projects* measurement are kept verbatim. Deleted: *"The SINGLE SOURCE of the derivation is the ordering decision … deliberately not restated here"* — once the citation goes, that paragraph asserts only that a fact lives somewhere unnamed, which is worse than silence. |
| a11y two-project split | 15 | **rewritten** | *"the one direction in which this wiring can be silently wrong AND green"* is the reason the explicit `testMatch` exists. Only the `§ Decision (A)` citation went. |
| bank-auth journey block | 27 | **rewritten** | The singleton-safety-beats-isolation tradeoff and its accepted cost stay. `RESEARCH A4/Pitfall 3 ("stands alone")` → `An earlier design had it stand alone; that was superseded`. |
| the APPEND-TO-TAIL block | 23 | **rewritten** | Both cheaper-looking alternatives were *measured* unsound (one lands in the same phase as `voter-journey`, the other merely relocates the race onto the perm chain head). That is a hazard note, kept whole. |
| `_probes` block | 39 | **rewritten** | The "6 tests ran from nowhere" record and the per-fixture inventory proving each deleted probe is now covered by a blocking-suite spec. Two phase citations went. |
| the perm-anchor block | 61 | **rewritten**, 1 clause **deleted** | The `eperm07-term-trigger` and `candidate-a11y-scan` anchor arguments are live ordering rationale. Deleted: the `§ For 147-03 … recorded as a gap in that list` fragment — a 152-05 strip artifact whose referent no longer exists. |

**Four whole units deleted out of 45 rules. Everything else was rewritten.** That ratio is D-A1(a) working as intended, and the opposite of the rejected delete-by-default option.

**Playwright's own `phase` vocabulary was rescued, not stripped.** `phase 2`, `phase 3` and `phase 55` in this file name **Playwright's execution phases** (`createPhasesTask`), not planning phases. Deleting the numeral to satisfy `phases?\s+\d+` would have turned three true statements false. They now read *the second / the third / the 55th* **scheduling phase** — the gate reads zero and the file still says what it means.

**Three sentences left broken by 152-05's mechanical strip were repaired here**, as Rule-1 fixes rather than deferrals: the `§ For 147-03` fragment, the `see phase 140 CR-01 is FIXED` sentence opener, and `the property see phase 140 CR-01 (iteration 2) added the base edge for is preserved`.

### Task 2 — the shared utilities and fixtures (`a00ae4fab`)

**50 replacement sites across 18 files.** Zero declaration lines in the diff; no selector, locator, timeout, seed-template name, `external_id` prefix, environment-variable name or exported helper touched; no test title renamed.

The hazard notes this surface exists to carry, all kept with their measurements:

- the **CR-01 select-by-label-not-by-position** reason, at all three preregister-fixture sites and its `testIds` twin — *"the provider orders constituencies with no guaranteed tiebreak across datasets, so an index-based pick silently lands on a foreign constituency whenever another dataset shares the DB"*;
- `requireNavigation`'s three-way analysis — **mis-attribution** (70 s and 8 iterations past the real fault), **answer-state corruption** (checkboxes TOGGLE; the archived run shows `choice_0,choice_1` → cleared → cleared → `choice_2,choice_3` …), **skewed `answered`**;
- the **DEAD-WAIT REMOVAL** measurement — 10 002 ms, 38 % of a 26.4 s fixture, paid deterministically by every consumer;
- `multiChoice`'s smallest-valid-count coupling argument (2..3 vs exactly-1 windows);
- the raw-key scanner's **21 sites where the matcher is satisfied by the exact failure it guards**, and its `RK1-OLD` / `RK2-OLD` negative controls;
- `voterNavigation`'s RESIDUAL EXPOSURE statement and its link-4 diagnosis, including the reason it is deliberately NOT routed through the strict settle.

**One dangling sentence repaired:** `voterQuestionsPage.fixture.ts`'s BYPASS-TOLERANT docblock ended on a bare `See` with its referent already stripped.

### The deviation — the rest of the partition (`e2978881d`)

**65 replacement sites across 16 files.** See finding 3 above for why.

Kept whole: the `WR-02(a)/(b)/(c)` *three-ways-the-comparison-can-be-satisfied-without-the-swap* analysis in `helpers/navigation.ts`; `assertTeardown.ts`'s complete **WHAT IT CATCHES / CATCHES ONLY WHEN `rowsBefore > 0` / DOES NOT CATCH** ledger, including the `ALLOWED_TEARDOWN_TABLES` shared-constant blindness and the unasserted `storageRemoved`; the preflight's *absence-check-has-three-states* argument behind `SUCCESS_HEADLINE`; `tcp-forward.mjs`'s socat-absence measurement and its dual-stack bind reasoning.

**One FALSE claim corrected rather than preserved (Rule 1).** `bank-auth-journey.setup.ts` and its teardown both asserted the project *"stands ALONE, NOT threaded into the perm serial chain — A4"*. `playwright.config.ts` declares `dependencies: ['voter-prefs-tracking']` on `data-setup-bank-auth-journey` — the perm chain's **last leaf** — and the config's own comment records the supersession. Stripping only the `A4` citation would have left a bare false sentence standing more baldly than it stood before. Both docblocks now defer to the config as the authority. The same stale premise may also live in `tests/IDURA-TEST-RUNBOOK.md` Step B-3, which is markdown and outside this phase's comment-only scope — registered as **WINDOWS 82**.

Also neutralised five usage-example run-dir names in `visual-container.sh` that encoded a phase number (`146-d14-observe` → `visual-observe`, and four siblings).

---

## The one partition file left untouched, on purpose

`tests/tests/fixtures/shared/popupNotice.fixture.ts` is in the register's `152-06` list with **1 span**. That span's only token is **`WR-05`** — a two-letter review-finding id, matched by neither the gate's `task-id` row (`\b[A-Z]{3,}-\d{2}\b`) nor any of the codemod's delete rules.

**The convention this sets, which `152-07` … `152-12` need to make the same way:** two-letter review-finding ids (`CR-01`, `WR-02`…`WR-10`, `IN-01`…`IN-03`) and single-token sweep ids (`F3`, `F4`, `F10`, `W1`/`W3`/`W5`, `A1`/`A2`) are **kept**; only the surrounding `see phase N` citation is stripped. Two reasons: the phase's own instruments do not classify them as violations, and several appear **verbatim in shipped runtime error strings** in `playwright.config.ts` that the prover forbids changing — so deleting them from comments would desynchronise a comment from the code it explains. Registered as **WINDOWS 83**.

---

## Deviations from Plan

### 1. [Rule 2 — missing critical scope] The plan's file set is narrower than its partition

Covered in full as finding 3. Sixteen unowned files, 64 gate occurrences, swept in `e2978881d`. **WINDOWS 79.**

### 2. [Rule 1 — Bug] A stale, false claim in two docblocks

Covered above. **WINDOWS 82.**

### 3. [Rule 3 — Record] Two acceptance criteria that cannot be satisfied as written

The scoped gate invocation (exit 2) and the three unsatisfiable gate rows. Proven by named alternate routes, reported, registered. **WINDOWS 80, 81.**

### 4. [Rule 3 — Record] Three commit messages carry wrong counts

**I was warned about exactly this, and did it anyway.** The figures were written before the sites were counted mechanically. Recounted from the applier's own replacement tables:

| Commit | Message says | Measured |
|---|---|---|
| `4369231e9` | "45 replacement sites (28 of them the repeated …)" | **45 rules / 72 sites**, 1 file. One rule ran 28×; it is not "28 of the 45". |
| `a00ae4fab` | "19 files, 38 replacement sites" | **18 files / 50 sites** |
| `e2978881d` | "45 replacement sites across 16 files" | **16 files / 65 sites** (file count correct) |

**Not corrected by rewriting history.** All three sit on the shared `integration/ship-12-squash` branch and interactive rebase is unavailable in this environment, so a rebase is the more dangerous of the two options — the identical judgement 152-05 made for **WINDOWS 77**. Registered as **WINDOWS 84**. Plan totals: **160 rules / 187 sites / 35 files.**

**Total deviations:** 1 scope expansion, 1 auto-fixed bug, 2 recorded corrections. **Impact:** the scope expansion is the consequential one — without it, sixteen files with 64 violations would have reached the end of the phase with every per-plan gate green.

---

## Verification

**Run the prover over the SWEEP range, `80e02e753..e2978881d`, not over `..HEAD`.** The prover
gives `.md` and `.json` no comment family, so *every* byte of them is code and any change is a
violation — fail-closed, by design. Over `..HEAD` it therefore reports **4 violations**, and all
four are this SUMMARY, `WINDOWS.md`, `STATE.md` and `ROADMAP.md` being written by the two
closing docs commits. That is the instrument working, not the sweep failing; `152-05` ran it
over its apply commit alone for the same reason. Stated here so a later reader who reruns the
convenient range does not read a green plan as red.

| Check | Result |
|---|---|
| `assert-comment-only-diff.mjs --range 80e02e753..e2978881d` | **35 files compared, 0 allowed by name, 0 violations, exit 0** |
| out-of-partition files in the plan diff | **0** (`comm -13` against the register's 152-06 list is empty) |
| declaration lines changed under `tests/` | **0** |
| Playwright config-key lines changed | **0** |
| gate over `tests/**` minus specs minus markdown | phase-ref **164 → 0**, spike-ref **1 → 0**, section-anchor **7 → 0**, decision-id-long 0, plan-number 0; three rows unsatisfiable (above) |
| comment-scoped gate over all 36 partition files | **0 on every gated row** (5,035 comment lines examined); flip-tested 6-red / 0-green |
| `yarn typecheck:tests` | **exit 0** (after each commit) |
| `yarn lint:check` | **exit 0** — 22 tasks successful, svelte-check 0 errors / 0 warnings |
| `node scripts/assert-comment-hygiene.mjs` | **exit 0** — 1,560 files scanned, 0 violations |
| `npx prettier --check` on every changed `.ts` / `.mjs` | clean |
| `bash -n` on the three shell scripts | clean |

**The E2E suite was not re-run**, per the plan's own `<verification>`: the change is comment-only and `assert-comment-only-diff.mjs` with zero allow entries is the stronger guarantee for a comment-only diff. 152-05 discharged the phase's cardinal gate at **150 passed / 0 failed / 0 flaky / 0 did-not-run**, and the prover confirms this plan changed nothing the suite can observe.

## Issues Encountered

None blocking. Four items registered in `.planning/WINDOWS.md` as entries **79–84**.

## Next

`152-07` (the E2E spec directories, 44 spans across 16 files) — and before it starts, findings 1–3 above plus the `WR-nn` convention should be read, because all four apply to it unchanged.

## Self-Check: PASSED

- `tests/playwright.config.ts` and all 34 other modified files present on disk and in the plan range.
- `git log --oneline --all | grep 4369231e9 / a00ae4fab / e2978881d` — all three found.
- Every acceptance criterion re-run at final state; results in the Verification table.
- Two criteria proven unsatisfiable as written, discharged by named alternate routes, and registered.
