# Phase 139: Single-Source Sweep Findings — Confirm or Withdraw - Pattern Map

**Mapped:** 2026-08-14
**Files analyzed:** 4 (1 create + 3 edit) — the 14 source files are revert-scoped, out of mapping scope
**Analogs found:** 4 / 4

## Scope note — this phase ships zero product code

| Class | Files | Mapped? |
|---|---|---|
| Create | `139-VERDICTS.md` | YES — full analog below |
| Edit (conditional, on withdrawal only) | `.planning/audits/2026-08-11-fake-guard-sweep.md`, `.planning/REQUIREMENTS.md:60`, `.planning/ROADMAP.md` § Phase 139/142 | YES — edit-target shapes below |
| **Transiently modified then reverted** (inject → run → `git checkout --`) | the 11 injection-target source files + their 14 test sites (CONTEXT `<canonical_refs>`, RESEARCH § Injection Catalogue) | **NO — deliberately not mapped.** They are never left changed; D-03's gate is `git status --porcelain tests/ apps/ packages/` → empty after every iteration. No analog applies to a file that does not survive the phase. |

## File Classification

| File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `139-VERDICTS.md` (new) | evidence artifact (planning doc) | record-and-observe | `.planning/phases/138-…/138-NEGATIVE-CONTROL.md` | exact — same chain, same milestone rule (D-16) |
| `.planning/audits/2026-08-11-fake-guard-sweep.md` (edit) | audit record | in-place strike | its own §F15–§F20 entry shape (no withdrawal precedent exists) | self-analog |
| `.planning/REQUIREMENTS.md:60` (edit) | requirement checklist | scope narrowing | sibling ASSERT-0x lines `:54-62` | exact |
| `.planning/ROADMAP.md` § Phase 142 (edit) | roadmap criteria | scope narrowing | Phase 139 criteria block `:339-352` | exact |

---

## Pattern Assignment 1 — `139-VERDICTS.md`

**Analog:** `.planning/phases/138-{phase-dir}/138-NEGATIVE-CONTROL.md` (489 lines). No YAML
frontmatter — a bold thesis paragraph followed by a bold-key bullet block, then numbered `##`
sections separated by `---`.

**Header shape** (lines 1-13, verbatim):
```markdown
# Phase 138 — Negative Control: the DEF-135-04 navigation-settle fix

**Two halves, one adversary, one machine, one session.** The pre-fix tree is run under a frozen
forcing configuration and fails; the post-fix tree is run under the byte-identical configuration and
passes. …

- **Date:** 2026-08-13
- **Plan:** `138-04-PLAN.md` (wave 4)
- **Decisions discharged:** D-01 (the forcing knobs), D-16 (the standing v2.15 negative-control rule), D-06 (…, recorded in § 7)
- **Requirements:** INTEG-01, INTEG-02
- **Precedent followed:** `.planning/phases/137-…/137-NEGATIVE-CONTROL.md`, which itself named `136-VISUAL-DISCRIMINATION-EVIDENCE.md` as its precedent. This document continues that chain.
```
→ 139 mirrors this exactly: Date, Plan, **Decisions discharged:** D-01…D-06, **Requirements:**
ASSERT-01, **Precedent followed:** `138-NEGATIVE-CONTROL.md` (continue the named chain).

**Section skeleton** (verbatim `##` headings of the analog):
```
## 1. Why this run existed
## 2. Environment              (incl. "### Port allocation" table + lsof)
## 3. The adversary — rebuildable on any machine   (### Prerequisites / ### The invocation / ### What the knobs do)
## 4. RUN 1 — the defect      (### 4.1 Provenance / ### 4.2 The invocation, verbatim / ### 4.3 Observed / ### 4.3.1 Verbatim failure output / ### 4.4 The finding)
## 5. RUN 2 — the catch       (### 5.1 Provenance … ### 5.4 The two halves side by side / ### 5.5 The finding / ### 5.6 Discarded block …)
## 6. What this pair does and does not prove
## 7. The operator's decision (D-06)
```
→ For 139 the per-run sections 4/5 become **one `## N` section per finding** (F15-A, F15-B/C, F16,
F17, F18, F19a/b, F19c, F20-1…F20-6), each carrying the analog's four sub-parts:
`N.1 Provenance` → `N.2 The invocation, verbatim` → `N.3 Observed` → `N.4 The verdict`.

**Provenance block** (§ 4.1, verbatim — this is the D-03 hygiene gate, copy the *scoped* form):
```
$ git rev-parse --short HEAD
360927495

$ git status --porcelain
 M .vscode/settings.json
 M supabase/.temp/cli-latest

$ git status --porcelain tests/ apps/ packages/
(no output)
```
Note the analog's prose that follows it — *"The scoped porcelain is what proves the tree was
genuinely pre-fix at capture time"*. 139 writes the same sentence about the *reverted* tree.

**Invocation block** (§ 4.2 — fenced `bash`, no prose, exactly as executed):
```bash
FRONTEND_PORT=5273 \
EPERM07_FORCE_BUDGET_MS=400 \
  npx playwright test -c tests/playwright.config.ts --project=… --reporter=json
```
→ 139 substitutes the per-vehicle `cd packages/<ws> && npx vitest run <file>` (D-05, verified in
RESEARCH § Run Vehicles).

**Observed table** (§ 4.3 header row, verbatim):
```
| # | Started (UTC) | exit | Outcome | Body duration | `eperm07-state` tri-state | Classification |
|---|---|---|---|---|---|---|
| 1 | 17:45:52 | 1 | **FAIL** | 7605 ms | {…} | non-degenerate |
```
→ 139's column set, per RESEARCH TRAP 3, **must split the outcome into two columns**:
`| Site | Injected line | Assertion outcome | File outcome | Failing line | exit |`, with values
bolded (`**PASS**` / `**FAIL**`) as the analog does.

**Verbatim failure capture** (§ 4.3.1) — the analog pastes the raw runner error block including
the caret line and the absolute path, then states *"Runs 2–5 produced this block
character-for-character apart from nothing at all"*. 139 does the same with vitest's failure block
so the failing line number is **visible in the record, not asserted**.

**Side-by-side table** (§ 5.4) → 139's summary verdict roll-up:
`| Finding | Verdict | Assertion outcome | Predicted (RESEARCH) | Matched? |`.

**"The finding" prose block** (§ 4.4 / § 5.5) — one bold-led paragraph stating the observation, then
a paragraph naming the mechanism with `file:line` cites. 139's `N.4 The verdict` uses the same two-
paragraph shape and ends with the literal word **confirmed** or **withdrawn** (the only two values).

**Two analog features 139 must reuse deliberately:**
- § 5.6 *"Discarded block — an intermediate implementation, recorded rather than hidden"* → 139's
  home for TRAP-1's un-injectable audit-worded regression and for **collateral** reds (RESEARCH's
  collateral-failure rule: record verbatim, state explicitly it does not bear on the verdict).
- § 6 *"What this pair does and does not prove"* → 139 states that a green injection proves the
  assertion blind, not that the product is broken, and that F17's green is degenerate (module
  never loads) rather than discriminating.

---

## Pattern Assignment 2 — `.planning/audits/2026-08-11-fake-guard-sweep.md` (strike a withdrawal)

**No withdrawal precedent exists in this file** — `grep -in 'withdraw|struck|~~|retract|supersed'`
returns nothing. The edit must therefore follow the *entry* shape and add the strike inline.

**Entry shape, verbatim (§F16, the shortest complete example):**
```markdown
### F16 — `rejects.toThrow()` against a mock that throws from every method

**File:** `packages/argument-condensation/tests/unit/handleQuestion.test.ts:56-68`

```ts
await expect(handleQuestion({ … })).rejects.toThrow();
```

Test intent: language validation rejects `'lol'`.

**Why it's blind.** …

**Suggested fix.** `.rejects.toThrow(/language/i)` plus a non-empty `entities` array.

**Confidence: high.**

---
```
Fixed slots per entry: `### F<N> — <claim>` → `**File:**` cite → fenced quote of the assertion →
intent line → `**Why it's blind.**` → `**What it would miss:**` (F14/F17 only) → `**Suggested fix.**`
→ `**Confidence: high.**` (F20: `**Confidence: medium** on impact…`) → `---`.

F20 is the outlier: a 6-row table `| File:line | Assertion | Title promises | Missed regression |`
rather than per-finding prose, so a withdrawn F20 row is struck **in the table row**, not as a section.

**Recommended strike form** (new convention — none exists; keep it greppable and non-destructive):
append to the entry, immediately above the trailing `---`:
```markdown
> **WITHDRAWN (Phase 139, 2026-08-14).** <one-paragraph reasoning with the re-read `file:line`
> and the observed injection outcome.> Evidence: `139-VERDICTS.md` § N.
```
and prefix the heading `### F16 — ~~…~~ (WITHDRAWN)`. Do **not** delete the original text — the
audit's `## Not assessed` block at `:950-956` explicitly stakes a prediction on these findings, so
the original must remain readable against the verdict.

## Pattern Assignment 3 — `.planning/REQUIREMENTS.md:60` (ASSERT-07 scope narrowing)

**Analog:** its own sibling lines `:54-62`. Shape: `- [ ] **ASSERT-0N**: **<finding ids>** — <prose>.`
Verbatim target:
```markdown
- [ ] **ASSERT-07**: **F15, F16, F17, F18, F20** — each finding that survives ASSERT-01 either asserts observable output rather than wiring, or is explicitly withdrawn with the reasoning recorded.
```
Edit = remove the withdrawn id from the bold list only; leave the prose and the `- [ ]` box alone
(Phase 142 ticks it). Checked items in this file use `- [x]` (see INTEG-06 at `:50`).

## Pattern Assignment 4 — `.planning/ROADMAP.md` § Phase 142 (criteria 2 and 3)

**Analog:** the Phase 139 block at `:339-352` — `### Phase N: <Title>` / `**Goal**:` /
`**Depends on**:` / `**Requirements**:` / `**Success Criteria** (what must be TRUE):` / two-space-
indented numbered list / `**Plans**: TBD`. Findings are enumerated **inline in the criterion prose**
(e.g. Phase 139 criterion 1: "Each of F15 …, F16, F18, F19 (3 sites) and all **six F20 rows**"), so a
withdrawal is an in-sentence edit of the enumeration in Phase 142's criteria 2 and 3 — not a
struck-through line. Phase 139 criterion 4 requires the shrink be visible, so pair the enumeration
edit with a pointer to `139-VERDICTS.md`.

## Shared Patterns

**Scoped porcelain gate** — source `138-NEGATIVE-CONTROL.md` § 4.1; apply to every injection
iteration. Bare `git status --porcelain` is non-empty in this worktree by construction; use
`git status --porcelain tests/ apps/ packages/` → `(no output)`.

**Verbatim-over-paraphrase** — source `138-NEGATIVE-CONTROL.md` §§ 4.2, 4.3.1; apply to every
verdict record. Commands, diffs and runner output are pasted as executed/observed (D-04), never
described.

**Predicted-vs-observed labelling** — source `139-RESEARCH.md`'s `[ASSUMED — reasoning from the read
code]` / `[VERIFIED: …]` tags; apply to every verdict so a prediction that the run overturned is
visible rather than quietly rewritten.

## No Analog Found

None. Every file this phase creates or edits has an in-repo precedent.

## Metadata

**Search scope:** `.planning/phases/138-*/`, `.planning/audits/`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`
**Files read:** 5
**Pattern extraction date:** 2026-08-14
