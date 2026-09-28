# The hygiene class, closed — what the three rulings sanctioned, what was done, and what is out by ruling

> Written by plan **153-11**, 2026-08-29. Authority: `.planning/phases/152-comment-naming-hygiene-sweep/152-HYGIENE-CLASS-RULING.md`.
> Phase 152 is closed and verified (`152-VERIFICATION.md`, `status: passed`) and is **not** reopened.
> This plan is its follow-through, recorded in phase 153 because these are guard-tooling changes.

---

## 0. The one-paragraph answer

The three rulings are executed and their WINDOWS entries are `fixed`. **Neither requirement is
marked complete**, and that is the finding rather than a shortfall: re-measuring both from scratch
(no inherited figure was carried) shows `REVIEW-HYG-01` short by **64 forced line breaks** in
`apps/**` — 5 that ruling D7b deliberately excluded, and **59 in a file no ruling has ever
covered** — and `REVIEW-HYG-02` short by **34 planning references across 15 files**, of which **24
were written after phase 152 closed**. Both stay `Pending`, each with the exact unmet clause named.

---

## 1. What each ruling sanctioned, and what landed

| Ruling | Sanctioned | Landed | Commit |
|---|---|---|---|
| **D6** coverage ids | KEEP the ids; narrow the over-broad `task-id` gate row | `COVERAGE_ID_NAMESPACE` named constant excludes the E2E vocabulary; row 106 → 16 | `f26973481` |
| **D7** Markdown | Markdown permanently OUT of the class; scope the gate to exclude `.md` | `':(exclude)*.md'` on all nine rows, written out at each call site; 227 files declined and **said so** in the report header | `f26973481` |
| **D7b** `.css`/`.scss` | sweep first-party → codify the two vendored files → THEN add the family | `app.css` swept (14 → 0), `VENDORED_EXCLUSIONS` added, `css`/`scss` added **after** the sweep, guard green on arrival | `58be1b985` then `f943f4824` |

WINDOWS **120** (D6), **122** (D7) and **129** (D7b) are now `fixed`.

> **Falsified premise, recorded.** The ruling document states these three entries "move from `open`
> to **`ruled`**". They never did — all three still read `open` in `.planning/WINDOWS.md` when this
> plan opened it, in both the Markdown table and the JSON block. The `ruled` value was described in
> prose and never written. They went straight `open` → `fixed`.

> **Tooling limitation, recorded rather than worked around.** `gsd-tools windows fixed <id>` takes
> an id and nothing else — only `windows waive` accepts a reason string. The commit citations the
> plan asked each entry to carry therefore live here and in `153-11-SUMMARY.md`, not in the ledger's
> `reason` column. The ledger was not hand-edited to insert them.

---

## 2. D6 — the `task-id` row, narrowed twice

The ruling asked for one narrowing. Measuring it produced a second, and the second is the more
interesting of the two.

### 2a. The sanctioned narrowing

The E2E coverage-id namespace — `EFLOW-`, `EPERM-`, `EQTYP-`, `UNBLK-`, `TMPL-`, `GEN-`, `CLI-`,
`ASSERT-`, `RUNES-`, `CLEAN-`, `NF-`, `CR-`, `WR-`, `IN-`, `VGATE-` — is excluded by a **named
constant** in the script. Not a flag, not an ignore file, not a per-path roster: excusing another
namespace means editing that line, which is then reviewed as the decision it is.

`NF`, `CR`, `WR` and `IN` are listed for completeness and are **inert**: two-letter prefixes were
never matched by `[A-Z]{3,}` under either the old pattern or the new one.

### 2b. The unsanctioned one — a suffix-capture bug, the milestone's fourth

The old pattern `\b[A-Z]{3,}-\d{2}\b` matched the **tail** of a longer hyphenated identifier,
because `-` is a word boundary. Eighteen of the row's 106 occurrences were reported under a
namespace **`EDGE-` that exists nowhere in this repository**. Every one of them is the tail of
`REVIEW-EDGE-0N`, a requirement id, in `apps/supabase/supabase/functions/**`.

This is the same defect the script's own header already documents one row above (`D-13` inside
`D-137-11`, fixed there with `(?!-\d{2})`), and the same defect plan 153-10's env-pair guard
shipped with. It was live bait: a later reader closing the row by adding `EDGE` to the namespace
constant would have **blinded the gate to every `REVIEW-EDGE-*` citation in the tree** while
believing they had excluded test vocabulary.

The pattern now matches the whole identifier —
`(?<![A-Za-z0-9-])(?!(?:<namespace>)-)[A-Z]{3,}(?:-[A-Z]{2,})*-\d{2}\b` — so the row reports
`REVIEW-EDGE-01` rather than `EDGE-01`.

**Measured, both patterns, same tree: 106 occurrences either way.** The fix corrects attribution,
not arithmetic.

### 2c. Flip tests — both halves, verbatim

**Flip 1a — a genuine planning id in `task-id` shape, injected into a real Playwright title**
(`tests/tests/specs/voter/voter-alliance.spec.ts:31`, `test('alliance section…` →
`test('SWEEP-03 alliance section…`):

```
  task-id                17      10       -  occ = 0    FAIL
tests/tests/specs/voter/voter-alliance.spec.ts:31:  test('SWEEP-03 alliance section + card + clickable member children + member-orgs drawer + tab control', async ({
--assert-clean EXIT=1
```

Removed (`git checkout HEAD -- …`, the file having no uncommitted work):

```
  task-id                16       9       -  occ = 0    FAIL
```

> **The first attempt at this flip test silently injected nothing.** The injecting script matched
> `^test\('` and the file's titles are indented inside a `test.describe`, so it printed
> `no title found` and the row did not move — a "gate examines nothing" result that would have read
> as a passing control if the census line and the token list had not been checked. Recorded because
> it is the exact failure mode this plan was warned about, reproduced by this plan, on its own
> control.

**Flip 1b — the plan's literal ask, `D-06` injected into the same title.** The gate goes red, but
**not on the `task-id` row**:

```
  decision-id-bare        2       2       -  occ = 0    FAIL
  task-id                16       9       -  occ = 0    FAIL
```

Removed:

```
  decision-id-bare        1       1       -  occ = 0    FAIL
  task-id                16       9       -  occ = 0    FAIL
```

**Falsified premise.** The plan's must-have reads "the narrowed `task-id` row still catches a
genuine planning id: injecting `D-06` into a test title turns it red". `D-06` has a one-letter
prefix, so `[A-Z]{3,}` never matched it — under the old pattern either. `decision-id-bare` is the
row that catches it, and it did, 1 → 2 → 1. The `task-id` row's own control is `SWEEP-03` /
`FLATTEN-02`, the two shapes the header names as its purpose; both are still matched.

### 2d. The coverage ids were not touched

- 76 `test` / `it` / `describe` titles under `apps/`, `packages/`, `tests/` carry a coverage id.
  The narrowed row matches **0** of them.
- Coverage-id occurrences across the three scan roots: **179 at `a65679a0f`, 179 at `HEAD`**.
- `git diff --stat a65679a0f..HEAD -- apps/ packages/ tests/` touches exactly one file,
  `apps/frontend/src/app.css`. No test file was edited by this plan at all.

(The ruling's own figure is "70 occurrences across 38 test titles". Mine is a different
measurement — title *lines* under a wider title-form regex that also counts `describe` and `it` —
and both are honest; neither is a correction of the other.)

---

## 3. D7 — Markdown, out permanently

All nine rows now carry `':(exclude)*.md'`, **written out at each call site**.

> **Deviation from the plan's wording, and why.** The plan asked for the Markdown exclusion as a
> "named constant". The script's own D-15 scope invariant says the opposite for pathspecs: "written
> out at each call site rather than hidden behind a variable, so the scope is auditable by eye and
> cannot be widened in one edit." Hoisting the exclusion into a shell variable would have been the
> first pathspec in the file that a single edit could change for all nine rows. The literal
> repetition satisfies the requirement that actually matters — no flag, no ignore file, no roster;
> excusing a case means editing the script. The **pattern** exclusion (D6) *is* a named constant,
> where a variable is the right shape.

The gate now **states the exclusion** instead of silently skipping:

```
excluded: *.md -- 227 Markdown file(s) under those roots are NOT scanned, per operator ruling D7.
```

and prints a three-line census in both modes:

```
  census -- tracked paths under the scan roots                       : 2658
  census -- of those, greppable by these rows (non-.md)              : 2431
  census -- declined as Markdown per operator ruling D7              : 227
```

Two consecutive runs on an unchanged tree: stdout and stderr **byte-identical**.

---

## 4. D7b — CSS, in the ruled order

**Step 1, sweep.** `apps/frontend/src/app.css`, four wrapped paragraphs, 18 comment lines → 4,
removing all 14 rule-2 junctions (`:103-106`, `:108-109`, `:471-477`, `:479-483`). Commit
`58be1b985`.

**Step 2, prove it comment-only**, bounded at the sweep commit rather than at `HEAD`:

```
  ✓ COMMENT-ONLY  apps/frontend/src/app.css

Comment-only diff prover (phase 152: REVIEW-HYG-02 criterion 5) — range 58be1b985~1..58be1b985;
files changed: 1; compared: 1; allowed by name: 0; 0 violation(s).
Zero non-comment byte changes, with ZERO allow entries. This is the bar the sweep must clear.
```

**Step 3, codify the two vendored files** as `VENDORED_EXCLUSIONS`, a named `Map` in the guard,
each entry carrying its reason. A **stale entry now fails the guard closed** — an exclusion naming
a file that no longer exists is a hole nobody can see.

**Step 4, add `css` and `scss` to `FAMILY_BY_EXT`.** Commit `f943f4824`, after the sweep, green on
arrival, never red, never disabled, never warn-only, never flag-gated.

### Census

| | files scanned | violations |
|---|---|---|
| before this plan | 1,580 | 0 |
| with `css`/`scss`, before the sweep | 1,586 | 19 (`app.css` 14, `inter.css` 3, `prism-vs.css` 2) |
| with `css`/`scss`, after the sweep | 1,586 | 5 |
| **shipped** (sweep + 2 exclusions) | **1,584** | **0** |

> **Falsified inherited figure.** The plan's must-have says the census "rises from 1,564". 1,564 was
> the phase-152 figure; the tree has grown since and the true baseline is **1,580**. It rose to
> **1,584**.

> **Second falsified inherited figure.** 152-15 recorded "4 comment-bearing `.css` files". Six
> `.css` files are tracked under the scan roots and **five** carry comments —
> `packages/argument-condensation/tools/visualization/styles.css` (23 comment openers) and
> `apps/docs/src/routes/layout.css` (1) were both already at zero violations, so the 19-violation
> total was right even though the file count was one low. **Zero `.scss` files are tracked anywhere
> in the repository**; the key is registered so the first one added is covered on arrival rather
> than entering a blind spot.

### Flip tests — three of them, both halves each

**Flip A, the sweep.** Restore the pre-sweep blob:

```
apps/frontend/src/app.css:103 … rule 2 (D-A4) … "Our custom spacing scale defines names (xs, sm, md, lg, xl) that"
(14 findings, all naming app.css)
files scanned: 1584; vendored files excluded by name: 2 (…); rules live: 2 of 2. 14 violation(s).
EXIT=1
```

Restore the sweep:

```
files scanned: 1584; vendored files excluded by name: 2 (…); rules live: 2 of 2. 0 violation(s).
EXIT=0
```

**Flip B, the exclusions are load-bearing.** Empty `VENDORED_EXCLUSIONS`:

```
apps/docs/src/lib/layouts/prism-vs.css:2, :3
apps/frontend/static/fonts/inter.css:2, :3, :6
files scanned: 1586; vendored files excluded by name: 0 (); rules live: 2 of 2. 5 violation(s).
EXIT=1
```

Restore: `files scanned: 1584; … 0 violation(s). EXIT=0`.

**Flip C, a stale exclusion fails closed.** Rename one entry's path to a file that does not exist:

```
[ERROR] scripts/assert-comment-hygiene.mjs: the vendored exclusion
'apps/docs/src/lib/layouts/prism-vs-RENAMED.css' (an upstream author credit for the VS Prism theme
(2 rule-2 junctions)) matches no tracked, scannable file under apps, packages, tests. An exclusion
that excuses nothing is a hole nobody can see — delete the entry or correct the path.
EXIT=1
```

Restore: `EXIT=0`.

`inter.css` and `prism-vs.css` are **byte-identical** after this plan — neither appears in
`git diff a65679a0f..HEAD`.

---

## 5. Requirement disposition — measured, not asserted

**Nothing was force-marked. `REQUIREMENTS.md` was not hand-edited.** `requirements ready-ids`
reports both ids `ready`, which is a statement about this plan's frontmatter and dependency graph,
**not** about the tree; the tree says otherwise and the tree wins.

### `REVIEW-HYG-01` → stays **Pending**

| Clause | Verdict | Measurement |
|---|---|---|
| "…or a character escape where the character itself belongs" | **MET** | rule 1: 0 violations over 1,584 files |
| "…the scan proving it is committed as a script wired into `yarn lint:check`" | **MET** | `yarn assert:comment-hygiene` is link **7 of 11**; all eleven links asserted present by name; the guard has no scan-narrowing flag |
| "No comment in `packages/**`, `apps/**` or `tests/**` carries a forced line break" | **NOT MET** | **64 survive in `apps/**`** |

The 64:

- **5** in the two vendored `.css` files, excluded by name under **ruling D7b**. Sanctioned, not a
  gap — but the requirement's wording admits no exception, so it is still 5.
- **59** in **`apps/supabase/supabase/config.toml`**, an extension family **no ruling has ever
  covered**. Newly measured by this plan; registered as **WINDOWS 181**.

The `.toml` finding in full: widening `FAMILY_BY_EXT` in memory to the complete set the
ship-review-stack source classifier carries — `mts`, `cts`, `jsx`, `xml`, `storyboard`, `zsh`,
`toml`, with `md` out per D7 — and re-running the standing guard reports **59 violations, all 59 in
that one file, and zero in every other family**. Of those seven extensions only `toml` has any
tracked file under the scan roots at all (`mts` 0, `cts` 0, `jsx` 0, `xml` 0, `storyboard` 0, `zsh`
0, `toml` 1).

It was **not** swept and the family was **not** added, for two reasons: no ruling sizes a `toml`
sweep, and adding the family first is the D-N1(c) shape this milestone rejected; and the file is
scaffolded by the Supabase CLI, its comments being upstream reference documentation that
`supabase init` emits and CLI upgrades re-emit — the same class of third-party text D7b **excluded**
rather than swept. Route to closing it: rule on the `toml` family (sweep-then-add, or exclude
`config.toml` by name in `VENDORED_EXCLUSIONS` as third-party scaffolded text), then re-measure.

### `REVIEW-HYG-02` → stays **Pending**

Post-ruling, with the coverage-id namespace excluded and `.md` out of scope, **34 occurrences
survive across 15 files**:

| row | occurrences |
|---|---|
| `phase-ref` | 15 |
| `decision-id-bare` | 1 |
| `planning-path` | 2 |
| `task-id` | 16 (15 × `REVIEW-EDGE-0N`, 1 × `INTEG-02`) |
| `spike-ref`, `decision-id-long`, `section-anchor`, `plan-number` | 0 |

The requirement forbids these "surviving" in any form. They survive. Marking it would convert a
measurement into a claim.

**The sharper half of the finding: the class has reopened, measurably.** Running today's
post-ruling pattern set against the phase-152 close (`fee77f596`) and against `HEAD`:

```
fee77f596 gated occurrences (post-D6/D7 pattern set): 10
HEAD      gated occurrences (post-D6/D7 pattern set): 34
```

**24 of the 34 were written after phase 152 closed** — overwhelmingly in
`apps/supabase/supabase/functions/**` and `packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts`,
i.e. by phases 153 and 155. The mechanism is not mysterious and is worth stating plainly:
**`REVIEW-HYG-01` has a standing guard chained into `lint:check`; `REVIEW-HYG-02` has none.**
`hygiene-grep-report.sh` lives under `.planning/`, is referenced by no `package.json` script and by
no CI workflow, and is run only when a plan runs it. The guard's own docblock predicted exactly
this — "a convention that lives only in a review comment is a convention that reopens" — and the
prediction is now measured at 24 occurrences in one milestone.

`REVIEW-HYG-02` cannot be closed by a sweep alone. Closing it needs a sweep **and** an enforcement
decision, and neither is this plan's to make.

### Inherited figures, both falsified

- "19 forced line breaks in `apps/**/*.css`" — **held exactly** (14 + 3 + 2). Re-measured, not
  inherited.
- "117 attributed reference-gate survivors" — **stale**. The unnarrowed gate on today's tree
  reports **155** (49 comparable + 106 `task-id`); the narrowed, `.md`-scoped gate reports **38**
  (22 comparable including 4 report-only + 16 `task-id`), of which **34 are gated**.

---

## 6. What is OUT of the class by ruling — not by oversight

A later reader must not read any of these as a gap.

| Out | By | Why |
|---|---|---|
| **All Markdown**, everywhere in `apps/`, `packages/`, `tests/` (227 files) | **D7**, permanently | The shared classifier maps `md` to an **empty comment family**, so `assert-comment-only-diff.mjs` reads every byte of a Markdown file as code and the zero-allow-entry behaviour-neutrality proof — the property that makes this phase's sweep commits trustworthy — **does not function on Markdown at all**. Bringing Markdown in needs a Markdown-aware prover first: a phase, not an edit. Three of the five `§` markers in `apps/frontend/static/fonts/README.md` are **OFL 1.1 licence sections 2 and 5** — a sweep treating `§` as a citation marker would strip licence text. |
| **The E2E coverage-id namespace** in test titles (179 occurrences; 76 titles) | **D6** | Legitimate E2E coverage vocabulary, established by evidence against the `tests/e2e-runs/**` corpus rather than by shape. `VGATE-04/05` gate the blocking `e2e-visual` CI job; `NF-01` appears in a CI step **name**; `TMPL-03`/`GEN-04`/`NF-02`/`CR-01` are cited from committed READMEs. A strip fails a required merge check and orphans run-register evidence a diff cannot restore. |
| **`apps/frontend/static/fonts/inter.css`** (3 junctions) | **D7b** | A verbatim OFL-licensed `@fontsource/inter@5.3.0` distribution header. |
| **`apps/docs/src/lib/layouts/prism-vs.css`** (2 junctions) | **D7b** | An upstream author credit. |
| `CLAUDE.md`, `.agents/`, `.claude/`, root `scripts/` | **D-15**, pre-existing | Agent-facing planning infrastructure, not shipped source. Unbypassable by construction: they are not under a scan root. |

**And one thing that is genuinely OUT by oversight, now registered:**
`apps/supabase/supabase/config.toml`, 59 junctions, **WINDOWS 181**. No ruling covers the `toml`
family. It is the reason `REVIEW-HYG-01` is still Pending on a clause the operator expected D7b to
close.

---

## 7. Verification

| Gate | Result |
|---|---|
| `yarn build` | 14/14 |
| `yarn lint:check` | 22/22, **11 chain links, every one asserted present by name** |
| `yarn test:unit` | 25/25 |
| `yarn format:check` | 7/7 clean |
| `node scripts/assert-comment-hygiene.mjs` | 1,584 scanned, 2 vendored excluded and named in the output, 0 violations |
| `--self-test` | 6 fixtures, 27 edge cases, 0 failures |
| guard determinism | two runs, stdout **and** stderr byte-identical |
| `hygiene-grep-report.sh` determinism | two runs, stdout **and** stderr byte-identical |
| other guards, unchanged | edge-env 17/0, declared-binaries 16 workspaces/0, env-pair-registry 4 pairs/0, i18n-catalog 598 keys/0, a11y-scan 0 |

`yarn db:lint:sql` is pre-existing red and lints the live database; not scored.
`audit-skill-drift.sh` exits 1 with exactly `filters` and `matching` — the accepted post-153-08
state per ruling D9, not a regression.

E2E was **not** run: the phase-close full-suite run belongs to `153-09` per operator ruling D1, and
this plan's diff is one CSS comment block plus two guard scripts and one `.planning/` instrument —
no runtime byte, no selector, no route.

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
