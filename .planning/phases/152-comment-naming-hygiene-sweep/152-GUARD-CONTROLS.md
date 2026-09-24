# Phase 152 — the standing guard's negative controls, and the phase's requirement proofs

> **The flip is the evidence and the green is not.** That is this repository's own standard,
> set by Phase 147's paired `AX1-OLD`/`AX1-NEW` and `RK1`/`RK2` controls and recorded in
> `.planning/STATE.md`: a gate that examines nothing also reports green, so a guard is
> credited only once it has been made to FAIL on a deliberate reintroduction and then made to
> pass again by reverting exactly that one thing.
>
> This file holds the two paired controls that close phase 152, and the per-requirement proof
> table a verifier can re-run without reassembling it from fifteen summaries.
>
> **Guard at the state that ships:** `scripts/assert-comment-hygiene.mjs`, two rules live,
> seventh link of `yarn lint:check`, 1,564 tracked files scanned, 0 violations.

---

## 1. The two flips

| # | Half | Command | Exit | Decisive output |
|---|---|---|---:|---|
| 1 | **HYG1-OLD** | `yarn lint:check`, with `apiRouteAdapter.ts:13`'s swept reason-comment re-wrapped across two lines | **1** | `[ERROR] scripts/assert-comment-hygiene.mjs: apps/frontend/src/lib/api/adapters/apiRoute/apiRouteAdapter.ts:13: rule 2 (D-A4) — this comment line ends without terminal punctuation and the line under it continues the same comment at the same indent. Join them into one line. Comment: "reason: forwards the base constructor's parameters unchanged; typed as the mixin `any[]` rest for"` — and `… 1 violation(s).` |
| 2 | **HYG1-NEW** | `yarn lint:check`, the comment restored to the single line the sweep produced | **0** | `Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1564; rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break). 0 violation(s).` |
| 3 | **HYG2-OLD** | `yarn workspace @openvaa/dev-seed test:unit`, with `&& yarn assert:comment-hygiene` removed from `lint:check` | **1** | `AssertionError: expected [ 'turbo run lint', …(5) ] to include 'yarn assert:comment-hygiene'` · `Test Files 1 failed \| 48 passed (49)` · `Tests 1 failed \| 569 passed (570)` |
| 4 | **HYG2-NEW** | same command, link restored | **0** | `✓ tests/ciTypecheckGate.test.ts (5 tests)` · `Test Files 49 passed (49)` · `Tests 570 passed (570)` |

### The one-difference invariant that makes each pair evidence rather than two runs

**HYG1.** The only difference between rows 1 and 2 is **one line break inside one comment
span** — `git diff --numstat` reports `2 1` on a single file, and the restore was verified by
blob hash rather than by eye (`git hash-object` returned `4e60a4556f653044ebe0862e180be8015cfc2b3e`
before and after, with `git status --porcelain` on the file empty). Every other input to a
seven-link chain — the lockfile, the turbo cache keys, the ESLint config, the tsconfigs, the
other 1,563 scanned files — is identical across the two runs. The exit-code flip is therefore
attributable to **rule 2** and to nothing else in the chain.

The site is not arbitrary: `apiRouteAdapter.ts:13` is the reviewers' clearest cited instance of
the class, the one whose review comment carried the word *"everywhere"*, and its single-line
form is what plan `152-14`'s sweep produced. Re-wrapping it reconstructs the exact defect the
phase exists to close, at the exact place the reviewers pointed.

**HYG2.** The only difference between rows 3 and 4 is **one `&&` link in one script**
(`git hash-object package.json` → `ecaef12658db5a21622c1f19146805f4b8fbcdac` before and after).
The spec that fails names the missing link verbatim rather than failing with a bare
`node: cannot find module`, which is the difference between an assertion and an accident. This
repeats plan `152-01`'s flip **at the phase's final state** — the state that ships, with rule 2
live and 727 files of sweep landed since — because a membership assertion proven against an
earlier tree proves nothing about this one.

**No `git checkout --` was used to undo either injection.** Both were reverted by copying a
pristine copy taken before the injection, per the hazard `152-11` registered as WINDOWS 113,
where a `git checkout --` revert destroyed an uncommitted sweep edit in the same file and was
caught only because the gate stayed red afterwards.

---

## 2. What the guard is, at the state that ships

| Property | Value |
|---|---|
| File | `scripts/assert-comment-hygiene.mjs` |
| Rules live | **2 of 2** — rule 1 (D-A5, a `\uXXXX` escape inside a comment span), rule 2 (D-A4, a forced line break) |
| Flag-gated / warn-only / disabled tier | **none**, for either rule |
| Opt-out mechanism | **none** — no `--files` glob, no ignore file, no per-path exception roster, no warn-only tier. `git grep -cE 'IGNORE_FILE\|--ignore\|EXCEPTIONS\|allowlist\|warnOnly\|WARN_ONLY'` over the file returns no match. |
| Structural exclusions | nine **named constants** in the file: five ruled (`BANNER_RULE`, `NEXT_IS_LIST_ITEM`, `NEXT_IS_JSDOC_TAG`, `COMMENT_TABLE`, `HANGING_INDENT` + `INDENTED_CODE_SAMPLE`), the Amendment-1 `PARAGRAPH_BREAK`, and three eligibility preconditions (`BLOCK_DELIMITER`, `CODE_FENCE`, `TOOL_DIRECTIVE`) |
| Dash rule | **none**, and the docblock prohibition now covers rule 2 explicitly. `git grep -nP '\bdash\b'` returns three lines, all inside that prohibition, none inside a predicate. |
| Chain position | seventh link of `yarn lint:check`; membership (not position) asserted by `packages/dev-seed/tests/ciTypecheckGate.test.ts` |
| Scan surface | tracked files under `apps/`, `packages/`, `tests/` — **1,564 files**, twelve extension families |
| Self-test | 6 committed fixture pairs + 27 inline edge cases, 0 failures |

### Why rule 2 is a lift and not a re-derivation

Rule 2's predicate and all nine constants are lifted from
`.planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs`, the
instrument the operator-sanctioned sweep actually ran over 727 files. A guard that re-derived
the predicate would disagree with the tree it just cleaned in one of two directions: reddening
on structure the sweep deliberately preserved, or passing text the sweep would have joined.

The lift carries the **hardened** form — the five defect classes `152-14` found by reading its
own dry-run diff before spending it. A guard carrying the naive predicate would redden on 903
fenced `@example` junctions, 43 section headers, 42 column-aligned table rows and 135 unfenced
shell recipes that the sweep correctly left alone.

**Independent evidence that the two predicates agree:** the lifted rule reports **0 violations
across 1,564 files**, over exactly the surface the instrument reported 0 for. The 22 inline
edge cases ported from the instrument's own self-test all pass here unchanged.

---

## 3. The extension-set gap, disposed of by measurement

Plan `152-01` shipped the guard over eleven extension families and **registered the gap for
this plan** rather than leaving it to be silently inherited. It was measured, not assumed, by
widening the family map and reading the result:

| Family | Comment-bearing tracked files | Violations under either rule | Disposition |
|---|---:|---:|---|
| `.html` | 4 | **0** | **ADDED.** Free to close, and closing it gates those files from now on rather than merely observing that they are clean today. Files scanned 1,560 → 1,564. |
| `.css` / `.scss` | 4 | **19** (rule 2: `app.css` 14, `inter.css` 3, `prism-vs.css` 2) | **NOT ADDED — operator question.** |
| `.md` | 4 registered sites | n/a | **NOT ADDED — operator question** (see § 5). |

**Why `.css` was declined rather than swept.** Enabling a rule against N pre-existing
violations is precisely the D-N1(c) shape this phase rejected — *"a guard that fails on N
pre-existing violations cannot be enabled until the sweep runs, so the split does not work as
stated unless the guard ships disabled, which is no guard"*. The only two ways out are to ship
the guard red or to sweep those four files, and the sweep is not an executor's to authorise:
the operator's ruling sized and sanctioned the line-break sweep over the **eleven-family**
surface, and two of the four files are third-party attribution headers — `inter.css` is a
verbatim OFL-licensed `@fontsource/inter@5.3.0` distribution header, `prism-vs.css` credits its
upstream author — which is the same class of text the phase has already ruled must survive any
disposition. The reason and the route to closing it later (sweep under a ruling, then add
`css` and `scss` to the map in one commit) are recorded in the guard's own docblock, at the
site of the decision.

---

## 4. Requirement proof table

One row per requirement, each with a command a verifier can re-run and its observed result at
this HEAD. Bounded ranges are stated where a range is load-bearing.

### REVIEW-HYG-01 — the comment-hygiene class, held shut by a committed scan

| # | Property | Command | Result |
|---|---|---|---|
| 1.1 | Forced-line-break class at zero | `node .planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs --report` | apps 0, packages 0, tests 0 — **total 0** |
| 1.2 | Escape class at zero, comment-scoped | `node scripts/assert-comment-hygiene.mjs` | 1,564 files, **0 violations**, exit 0, `rules live: 2 of 2` |
| 1.3 | Both rules correct on known inputs | `node scripts/assert-comment-hygiene.mjs --self-test` | 6 fixtures + 27 edge cases, **0 failures**, exit 0 |
| 1.4 | Fixtures are load-bearing (the TDD red) | expected files hand-written with rule-2 entries, predicate absent | **all six fixtures FAILED**, each failure exactly the missing rule-2 line |
| 1.5 | Guard is a blocking link of `lint:check` | `yarn workspace @openvaa/dev-seed test:unit -t 'comment-hygiene'` | passes; membership asserted, not position |
| 1.6 | The guard **catches** | HYG1-OLD / HYG1-NEW above | exit **1** naming `apiRouteAdapter.ts:13`, then exit **0** |
| 1.7 | The membership assertion **bites** | HYG2-OLD / HYG2-NEW above | 1 failed / 569 passed, then 570 passed |
| 1.8 | No opt-out of any kind | `git grep -cE 'IGNORE_FILE\|--ignore\|EXCEPTIONS\|allowlist\|warnOnly\|WARN_ONLY' -- scripts/assert-comment-hygiene.mjs` | **no match** |
| 1.9 | No dash rule | `git grep -nP '\bdash\b' -- scripts/assert-comment-hygiene.mjs` | 3 lines, **all in the standing prohibition**, none in a predicate |
| 1.10 | The two ESLint directive files untouched by the whole phase | `git hash-object apps/frontend/src/hooks.server.ts apps/frontend/src/hooks.ts` | `b79d5834`, `c7311730` — unchanged |

### REVIEW-HYG-02 — no planning reference survives, and no behaviour moved

| # | Property | Command | Result |
|---|---|---|---|
| 2.1 | Planning-reference gate clean across all three trees | `bash .planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-grep-report.sh --assert-clean` | see § 6 |
| 2.2 | Pre-sweep failing output, recorded beside it | `152-BASELINE.md` (plan 02) | the same nine gate rows red before the sweep |
| 2.3 | Residue register | `152-RESIDUE-REGISTER.md` (plan 05) | 641 spans across 282 files, seven-way partition summing exactly |
| 2.4 | Behaviour neutrality of the line-break sweep | `node …/assert-comment-only-diff.mjs --range dbc752e6a..HEAD` (bounded at 152-14's last refactor commit, per memo 16) | 727 compared, **0 violations, 0 allow entries**, exit 0 |
| 2.5 | The gate is not the completeness test | every plan 06-13 reported gate-vs-wider-sweep separately | blind spot **27 / 64 / 54 / 37 / 30 / 67 / 72 %** — never zero |

### REVIEW-HYG-03 — the renames leave nothing dangling

| # | Property | Command | Result |
|---|---|---|---|
| 3.1 | No dangling reference | `yarn build` | see § 6 |
| 3.2 | Renamed specs still run and pass | `yarn test:unit` | see § 6 |
| 3.3 | Lint chain green after the renames | `yarn lint:check` | see § 6 |
| 3.4 | Title renames recorded | `152-TITLE-RENAMES.md` (plan 13) | 46 renames, classified by evidence rather than by shape |

### REVIEW-HYG-04 — the spelling audit

| # | Property | Command | Result |
|---|---|---|---|
| 4.1 | The audit exists and is committed | `test -f .planning/phases/152-comment-naming-hygiene-sweep/152-SPELLING-AUDIT.md` | see § 6 |
| 4.2 | No UK-spelled identifier in scope | `node .planning/phases/152-comment-naming-hygiene-sweep/scripts/uk-identifier-audit.mjs` | see § 6 |

---

## 5. Two questions this phase deliberately did NOT answer

Both are the operator's. An executor that settled either overnight would be trading a
recoverable open question for an unrecoverable wrong answer, so both were reported and
registered instead — by every plan that met them, and again here.

**D6 — the 23 E2E coverage ids** (memo item 12, WINDOWS 120). Twenty-three residual Playwright
test-title ids (`EFLOW-11`, `EPERM-07`, `TMPL-03`, `VGATE-04/05`, …) look like planning ids to
the `task-id` gate row but are **E2E coverage ids cited verbatim in the run registers under
`tests/e2e-runs/`**. Plan `152-13` proved the classification by evidence rather than by shape:
all 19 Playwright coverage-id titles appear in 12-61 register files each, all 62 vitest ones in
zero — and `D-07` versus `EPERM-07`, identical in shape, fall on opposite sides. Stripping them
breaks the register cross-reference that E2E run evidence depends on; keeping them leaves the
`task-id` row permanently red repo-wide. **And `VGATE-04/05` are cited by the blocking
`e2e-visual` CI job**, so stripping those two does not merely confuse a reader — it fails a
required check. **Status: OUTSTANDING. Left byte-identical.**

**D7 — Markdown** (memo item 13, WINDOWS 122). Four registered sites: `dev-seed/README.md`,
`fonts/README.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md`. The shared classifier maps
`md` to an **empty comment family**, so a Markdown file has no comment spans at all: the prover
`assert-comment-only-diff.mjs` reads every byte of one as code, and both of the guard's rules
would be silently inert on one. The register routes Markdown "whole to the judgement pass", but
**no plan in the phase claims it**. It is entangled with D6, because the READMEs cross-reference
the very test titles D6 is deferring. **A hard constraint on whatever is ruled:** three of the
five `§` markers in `fonts/README.md` are **OFL 1.1 licence sections**, not planning references,
and must survive any Markdown disposition — a sweep that treated `§` as a citation marker would
strip licence text. **Status: OUTSTANDING. Every `.md` file left byte-identical.**

The open question for the operator is the same in both cases: *does the phase's convention
extend to this surface at all, under which plan, and against which prover — given the current
prover cannot see it?*

---

## 6. The phase gate, run once, here

Seven judgement plans deferred their suite runs to this point rather than each running a shared,
stateful stack. `152-05` discharged a mid-run gate; **nine plans have edited the tree since**,
including `152-13`'s 46 test-title renames and `152-14`'s 13,002-junction sweep across 727
files. This is the gate that closes the phase.

### 6.1 Environment, prepared before the run

A run that cannot start is a **failure**, not a skip, so each precondition was checked rather
than assumed:

| Precondition | Check | Result |
|---|---|---|
| Disk headroom (a full run has been voided by exhaustion in this worktree before) | `df -h .` | **150 GiB available**, 83% used |
| No stale listener on the frontend port | `lsof -nP -iTCP:5173 -sTCP:LISTEN` **and** `docker ps \| grep 5173` | both empty — `5173 FREE`, no container |
| No surviving vite process | `pgrep -fl 'vite.js dev'` (the real command line; `vite dev` does not match) | none |
| Clean database | `yarn db:reset` | exit 0, migrations + `seed.sql` re-applied, storage buckets recreated |
| Exactly ONE fresh dev server | `yarn dev`, then `lsof` | one listener, `node` pid 96755 on `[::1]:5173`, `HTTP 200`, **no bind error in the log** |

The served-application preflight in Playwright's global setup passed — it aborts with exit 1
before any spec body if the app answering on the port did not come from this checkout, and
there is no flag that skips it.

### 6.2 Results

| Gate | Command | Result |
|---|---|---|
| Build | `yarn build` | **exit 0** |
| Lint chain (7 links, guard last) | `yarn lint:check` | **exit 0** — `files scanned: 1564; rules live: 2 of 2; 0 violation(s)` |
| Format | `yarn format:check` | **exit 0** |
| Unit | `yarn test:unit` | **exit 0** — frontend 816 passed / 54 files; dev-seed 570 passed / 49 files |
| Comment-hygiene guard | `node scripts/assert-comment-hygiene.mjs` | **exit 0** — 1,564 files, 0 violations, both rules live |
| Guard self-test | `… --self-test` | **exit 0** — 6 fixtures + 27 edge cases, 0 failures |
| Forced-line-break instrument | `node …/unwrap-comment-paragraphs.mjs --report` | apps 0 · packages 0 · tests 0 — **total 0** |
| UK/US identifier audit | `node …/uk-identifier-audit.mjs` | 1,521 files, **0 in-scope hits** |
| Spelling audit artefact | `test -f …/152-SPELLING-AUDIT.md` | **present** |
| Behaviour neutrality | `node …/assert-comment-only-diff.mjs --range HEAD~1..HEAD` | 1 compared, **0 violations, 0 allow entries** |
| **Full E2E** | `yarn test:e2e` | **150 passed (10.2m), exit 0** |
| Planning-reference gate | `bash …/hygiene-grep-report.sh --assert-clean` | **exit 1** — see § 6.4, every occurrence attributed |
| `yarn db:lint:sql` | — | **pre-existing red, structurally unaffected** (WINDOWS 125): its failing half lints the LIVE DATABASE and reads no working-tree file. Four plpgsql warnings, none comment-related. |

### 6.3 The E2E counts, decoded — not read off the console tail

The console tail is not authoritative. The counts below come from the HTML report's own
`playwrightReportBase64` payload (base64 → zip → `report.json` → `stats`), preserved out of
`tests/playwright-report/` before the next run overwrites it, to
`tests/e2e-runs/152-15-cardinal-gate/index.html`:

```json
{ "total": 150, "expected": 150, "unexpected": 0, "flaky": 0, "skipped": 0, "ok": true }
```

**`total == expected` with `skipped: 0` is what establishes zero did-not-run** — the property
this project counts as a failure when absent. `unexpected: 0` and `flaky: 0` mean nothing was
retried to green and nothing was annotated as flaky. No test was skipped, quarantined,
grep-excluded or exempted. `152-13`'s 46 renamed test titles all resolved: no spec failed to
match and no project dependency broke.

### 6.4 The planning-reference gate is RED, and that is reported rather than engineered around

`--assert-clean` exits 1 on five rows. Per the phase's house rule (memo item 4), the criterion
is neither restated as met nor made green by editing the gate. Every occurrence is attributed:

| Row | occ / files | Attribution |
|---|---|---|
| `phase-ref` | 21 / 6 | 12 lines in the **four fenced Markdown files** (D7) + 5 `PHASE 1/2/3` naming a benchmark script's own three stages (2 of them inside an `echo`, i.e. program bytes) + 2 `Phase 1/2` naming a pgTAP file's own two stages. **Was 22 / 7 before this plan closed the one reference the sweep unmasked.** |
| `decision-id-bare` | 2 / 2 | 1 in fenced Markdown + 1 inside an `echo` in `visual-container.sh` (program bytes) |
| `section-anchor` | 5 / 1 | all five in `fonts/README.md` — fenced Markdown, and **three of them are OFL 1.1 licence sections** |
| `planning-path` | 1 / 1 | one assertion-message string in `voter-journey.fixture.ts` (program bytes) |
| `task-id` | 88 / 46 | **70 fenced coverage ids in test titles** (D6) + 8 Markdown + 4 shell strings + 6 assertion/skip diagnostics — `152-13`'s attribution, re-measured here and identical |
| `milestone-ver` | 8 / 5 | report-only by design; matches genuine tool and package versions |

**Every remaining occurrence is one of three kinds, and none of them is unswept work:** a byte
inside one of the two fenced operator questions (§ 5), a program byte the zero-allow-entry
prover forbids editing, or a numeral that names something real (a script's own stages) which
memo items 7 and 18 rule must be understood before it is touched.

**The row cannot go green without settling D6 or D7.** Registered rather than resolved.

### 6.5 One violation this phase CREATED, found by comparing against the pre-sweep tree

Comparing all six gate rows **and** thirteen widened reference classes between the pre-sweep
HEAD `3e6158382` and this one, exactly **one** moved upward: `phase-ref`, +1 line.

`packages/dev-seed/src/templates/defaults/candidates-override.ts` read, pre-sweep:

```
//    app's anon client, so the Candidates tab never renders — the defect Phase
//    145 repaired. Every other check in this repository reads as service_role,
```

`Phase` and `145` sat on **opposite sides of a line break**, so no phase-shaped pattern could
reach it — the class memos 19 and 23 registered after two prior sightings, and which no grep
can find by construction. `152-14`'s join re-assembled it and the gate now reads it. Closed
here (`beaeb4c10`), because it is a violation this phase introduced into its own surface, of
its own requirement, invisible to every plan that could have owned it.

**Every other delta was negative**, which is arithmetic and not removal: a per-LINE count
necessarily falls when two matching lines become one. That is the same unsatisfiability
WINDOWS 124 records for the dash-conservation criterion.

---

## 7. The phase's corrections, in one place

Each figure below is a correction to a planning document, so the next reader inherits it
rather than rediscovering it. Where this plan's own brief and the committed artefacts
disagreed, **the artefact was believed and the brief corrected** — the same rule the phase
applied to comments.

| Quantity | The document said | Measured | Where |
|---|---:|---:|---|
| Planning-reference **citation lines** | 817 (CONTEXT.md fact 7) | **888** (1.09×) | `152-BASELINE.md:330` |
| …including narrative-only lines with no citation token | — | **942** | `152-BASELINE.md:345` |
| …as gate **occurrences** | — | **946** at the research HEAD, **948** at the baseline | `152-BASELINE.md:346-347` |
| Judgement **spans** remaining after the mechanical pass | — | **641 spans across 282 files** (671 → 641) | `152-05-SUMMARY.md`, partition `130+44+208+13+132+105+9 = 641` |
| Comment lines using `--` as a dash | 85 (CONTEXT.md fact 8) | **212** (2.5×) | `152-01-SUMMARY.md` |
| Comment lines already using a real em/en dash | ~2,870 (fact 8) | **3,025** | `152-01-SUMMARY.md` |
| Non-blank comment corpus | 34,063 (fact 7) | **34,885** | `152-BASELINE.md` |
| Residue expected to be non-comment-shaped | Phase 151 measured **126** | **98** declined rows, each hand-reviewed | `152-05-SUMMARY.md` |
| The forced-line-break class | **no planning document carried any figure at all** | **14,094** junctions at research, **13,936** live, **13,002** actually swept over 727 files | `152-LINEBREAK-DECISION.md`, `152-14-SUMMARY.md` |
| The fixture rename | one file named by the requirement text | **widened to a second file no requirement text names** | `152-03-SUMMARY.md` |

**A correction to this plan's own brief, made rather than propagated.** The brief cited "642
spans across 278 files". **642 is not a span count** — it is the number of `see phase N`
*collapsed occurrences* in 224 files, measured by `152-02`. The span figure is `152-05`'s
**641 across 282 files**, and its seven-way partition sums to exactly that with zero files
unassigned or double-assigned. Two numbers of similar magnitude measuring different things is
precisely the confusion memo item 19 warns about; they are kept apart here.

---

## 8. Where every open item went

### The two `152-CONTEXT.md` `<open>` items that were STALE, disposed of in writing

**Open item 1 — "`REVIEW-HYG-01..04` are not defined anywhere."** **STALE, and false since
before the phase began.** All four are defined in `.planning/REQUIREMENTS.md` under the
comment-and-naming-hygiene heading (`:88-91`), with traceability rows at `:261-264` and a
phase-map row at `:333`, added by the planning-run commits that followed CONTEXT.md. They are
this phase's acceptance surface, and § 4 above is the per-requirement proof table for them.
`152-01` caught this, having briefly repeated the stale claim as fact before checking — which
is why it is closed here in writing rather than left looking live.

**Open item 5 — "the shared discussion-log pointer required by D-N3 has not been written."**
**STALE.** It exists in this phase's own directory as `152-DISCUSSION-LOG.md`, alongside
the `152-CONTEXT.md` that D-N3 also requires. D-N3's two artefacts are both present; nothing is owed.

### The other open items, by the plan that disposed of them

| Item | Disposition | Plan |
|---|---|---|
| Terse names at `EntityCard.svelte:126` — no covering decision | **Scoped IN** and swept, rather than filed as a follow-up | `152-04` |
| The split adapter-typing item (`supabaseDataProvider.ts`) | **Handed to Phase 157**, which owns the typing half; `152-14` joined the comment only and left the sentence semantically unchanged for 157 to rewrite wholesale | `152-14` |
| The partly-load-bearing input-component comment | **keep-one / delete-two** disposition applied | `152-04` |
| The no-dash-rule constraint (D-A5, CONTEXT `<open>` 6) | **Carried into the guard's docblock as a standing prohibition**, now extended to cover rule 2 explicitly | `152-01`, `152-15` |
| The roadmap correction (D-0.1) | **Landed before planning began**, applied concurrently by another agent; this phase edited no roadmap row | pre-phase |
| The E2E coverage-id question (D6) | **OUTSTANDING — operator's.** § 5, WINDOWS 120 | fenced by 07, 11, 12, 13, 14, 15 |
| The Markdown question (D7) | **OUTSTANDING — operator's.** § 5, WINDOWS 122 | fenced by 08, 11, 13, 14, 15 |
