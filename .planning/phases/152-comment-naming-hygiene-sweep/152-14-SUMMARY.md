---
phase: 152-comment-naming-hygiene-sweep
plan: 14
subsystem: comment-hygiene
status: complete
tags: [codemod, comment-hygiene, D-A4, forced-line-break, review-hyg-01]

requires:
  - "152-02's `unwrap-comment-paragraphs.mjs` (the predicate, the codified exclusions, the three modes)"
  - "152-LINEBREAK-RULING.md (the operator's ruling, made ahead of wave 6)"
  - "152-05's `assert-comment-only-diff.mjs` (the behaviour-neutrality prover)"
provides:
  - "152-LINEBREAK-DECISION.md — the phase's own record of the D-A4 ruling, on live figures"
  - "the forced-line-break class at ZERO across packages/**, apps/**, tests/**"
  - "an instrument whose exclusion set survives contact with the real tree (20 edge cases)"
affects:
  - "152-15 (wires the guard's second rule over the now-zero surface)"
  - "phases 153-160 — 59 of the 94 files they cite sit inside this 727-file surface"

tech-stack:
  added: []
  patterns:
    - "A widening of an existing ruled constant is not a new category; it is the same artefact drawn with different ink."
    - "A per-LINE grep cannot be a conservation criterion for a sweep that removes lines; prove per-file occurrences instead."

key-files:
  created:
    - .planning/phases/152-comment-naming-hygiene-sweep/152-LINEBREAK-DECISION.md
  modified:
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs
    - "apps/** (385 files)"
    - "packages/** (207 files)"
    - "tests/** (135 files)"

key-decisions:
  - "Option (b) confirmed on live figures (13,936 vs 14,094 junctions, −1.12%): the ruling's re-raise condition is NOT triggered, so the sweep proceeded without returning to the operator."
  - "Five defect classes found by reading the first apply's diff. Four fixed in the instrument as widenings of existing ruled constants or preconditions beside BLOCK_DELIMITER; the fifth hand-fixed. The ruling's FIVE structural categories are unchanged in number and in meaning."
  - "The dash-conservation criterion was proved per-file-occurrence, not per-line, because per-line is unsatisfiable for a sweep that removes lines — and the replacement was flip-tested."
  - "`db:lint:sql` is pre-existing red and structurally cannot be affected by this sweep: its failing half lints the LIVE DATABASE and reads no working-tree file."

coverage:
  - deliverable: "The D-A4 ruling is recorded on figures measured from this tree"
    human_judgment: false
    verification:
      - kind: command
        ref: "test -f 152-LINEBREAK-DECISION.md && grep -qE '14,?094' … && git status --porcelain -- apps packages tests empty"
        status: pass
  - deliverable: "The forced-line-break class is at zero across all three trees"
    human_judgment: false
    verification:
      - kind: command
        ref: "node …/unwrap-comment-paragraphs.mjs --report → apps 0, packages 0, tests 0, total 0"
        status: pass
  - deliverable: "The sweep changed only comment bytes"
    human_judgment: false
    verification:
      - kind: command
        ref: "node …/assert-comment-only-diff.mjs --range dbc752e6a..HEAD → 727 compared, 0 violations, 0 allow entries, exit 0"
        status: pass
  - deliverable: "No dash, no ESLint directive and no .editorconfig byte moved"
    human_judgment: false
    verification:
      - kind: command
        ref: "git hash-object hooks.server.ts hooks.ts .editorconfig unchanged; per-file double-hyphen occurrences 8,715 = 8,715 across 727 files, flip-tested red/green"
        status: pass
  - deliverable: "The exclusion set behaves on the real tree, boundaries included"
    human_judgment: false
    verification:
      - kind: command
        ref: "node …/unwrap-comment-paragraphs.mjs --self-test → 2 fixtures + 20 edge cases, 0 failures"
        status: pass
  - deliverable: "The joined comments still mean what they meant"
    human_judgment: true
    rationale: "The three named sites and all 43 joins over the p99 length were read individually, and six mechanical defect detectors now report zero — but 'reads as the same sentence' is a judgement no test asserts."
  - deliverable: "yarn build / lint:check / format:check / test:unit / assert-comment-hygiene green"
    human_judgment: false
    verification:
      - kind: command
        ref: "all exit 0; test:unit 1,721 tests across 159 files"
        status: pass
  - deliverable: "yarn db:lint:sql disposition"
    human_judgment: true
    rationale: "Pre-existing red (WINDOWS 125). Its failing half lints the live database and reads no working-tree file, so the sweep cannot affect it by construction; the file-reading half exits 0."

metrics:
  duration: "45 min"
  completed: 2026-08-29
  tasks: 3
  files: 728

actuals:
  tokens: 891470
  tasks: 3
  commits: 6

requirements-completed: []
---

# Phase 152 Plan 14: D-A4 Forced-Line-Break Sweep Summary

Un-wrapped **13,002 forced line breaks in 5,252 comment paragraphs across 727 files** at the scale the operator sanctioned — and found five ways a mechanical join silently destroys structure before spending it, four of which are now codified in the instrument and one hand-fixed.

**Duration:** 45 min · **Tasks:** 3/3 · **Commits:** 6 (3 over `apps packages tests`, the plan's cap)

---

## Task 1 — the ruling, re-measured on this tree

The operator ruled ahead of wave 6 in `152-LINEBREAK-RULING.md`: **option (b)**, D-A4 verbatim for detection with the five structural categories codified as constants. Task 1's job was not to re-open that decision but to check it still stands on figures from *this* tree, thirteen plans of comment edits later.

| Quantity | Live (this tree) | Ruling (research § 1.1) | Delta |
|---|---:|---:|---:|
| Wrapped-prose junctions | **13,936** | 14,094 | −1.12% |
| Wrapped paragraphs | **5,549** | 5,550 | −0.02% |
| Files | **741** | 747 | −0.80% |

All three agree to within **1.2%**, and the drift direction is explained by this phase's own thirteen sweeps. **The re-raise condition is NOT triggered** — a few percent of self-inflicted drift is not a material contradiction — so the plan proceeded to Task 2 without returning to the operator, exactly as the ruling instructed.

Gratuitous-only, for the record: **1,165 junctions in 965 paragraphs across 419 files** (p50 100, max 120, zero over 120).

`PARAGRAPH_BREAK` was verified still in place, still named, still reported (**4,190** junctions live), and still proven by the committed fixture pair whose two inputs differ by exactly one line — 0 violations with the blank comment line present, 1 with it removed. `.editorconfig` is byte-identical, `ec6742a7`, before and after.

`152-LINEBREAK-DECISION.md` records the live figures with the commands that produced them, the three options with their costs, (d) as pre-rejected by D-N1(c) with the quoted reason, the 59-of-94 cross-phase collision, and the operator's rationale in their own words.

---

## Task 2 — the sweep

### The five defect classes the diff read found

The first `--apply` was **read, not trusted**. Determinism is not correctness. Five ways the join destroyed structure:

| # | Class | Size | Disposition |
|---|---|---:|---|
| 1 | Column-aligned comment tables folded into one line | 42 junctions, 4 files | `COMMENT_TABLE` widened (34 → 77) |
| 2 | **Fenced `@example` code blocks folded** | **903 junctions, 282 fence lines, ~140 files** | `CODE_FENCE`, new precondition |
| 3 | **Tool directives absorbed, silently disabled** | 9 junctions | `TOOL_DIRECTIVE`, new precondition |
| 4 | ATX and box-drawn section headers absorbing their paragraph | 43 junctions (11 + 22 sites) | `BANNER_RULE` widened (510 → 553) |
| 5 | Unfenced indented shell recipes folded | 135 junctions (202 candidate) | `INDENTED_CODE_SAMPLE`, in `HANGING_INDENT`'s row |
| 6 | Token split across the break, spurious space inserted | 47 sites | **hand-fixed**: 43 repaired, 4 reviewed KEEPs |

**Class 2 was the largest and the worst.** `00-helpers.test.sql`'s 28-row name-to-UUID table was about to become one 1,738-character line; `Button.svelte:40-49`'s ten-line `tsx` usage sample was about to become one line; the entire component library's JSDoc `@example` blocks, every `@openvaa/llm` and `@openvaa/question-info` docblock sample, and the dev-seed negative-control `sh` reproductions were all inside paragraphs the sweep had queued.

**Class 3 is the one that would have shipped a behaviour change.** `yarn lint:check` went RED because the sweep had folded `candidate/register/+page.svelte:51`'s prose onto its `eslint-disable-next-line @typescript-eslint/no-unused-expressions`, and the error that directive legitimately suppressed came back. Two `svelte-ignore state_referenced_locally` directives in the entity-filter components were damaged the same way and **would not have reddened any gate at all** — only a compiler warning would quietly have returned. This is threat **T-152-03** (an edit that changes a directive's PARSE) reached by a mechanism other than a dash.

**Every instrument change is a widening of an existing ruled constant, or a precondition beside `BLOCK_DELIMITER`.** The ruling's five structural categories are unchanged in number and in meaning: a table drawn with aligned columns is the same artefact as one drawn with pipes; a heading is structure exactly as a rule line is; `HANGING_INDENT`'s own docstring has always said "ASCII tables, code samples". Each was edited in the file rather than waived by a flag, per the instrument's own no-opt-out principle.

**Class 5 was deliberately kept STRICT.** 2,094 junctions have both sides indented by two or more, and nearly all are ordinary wrapped prose inside an indented docblock paragraph — a blanket rule would have cost 16% of the sanctioned sweep for no correctness gain. The predicate instead requires a command or statement shape: **202 junctions in 61 files, 1.5% of the sweep, all of it code.**

Net effect of the four instrument fixes: **13,894 → 13,002** junctions, **5,546 → 5,252** paragraphs, **741 → 727** files. Every removed junction is structure; **none is prose, and none is one of the six reviewer-cited sites.**

### The exclusion set, live and non-zero

| Row | Count | |
|---|---:|---|
| `banner-rule` | 553 | |
| `list-item` | 1,291 | |
| `jsdoc-tag` | 429 | |
| `hanging-indent` | 583 | |
| `comment-table` | 77 | |
| `paragraph-break` | 3,997 | Amendment 1 |
| `code-fence` | 903 | eligibility precondition |
| `tool-directive` | 9 | eligibility precondition |
| `block-delimiter` | 868 | eligibility precondition |

All five ruled categories fire non-zero. **No line-1 `#!` shebang appears as a span start** — a committed edge case asserts it, and it passes.

`--self-test`: **2 fixtures + 20 edge cases, 0 failures.** Six new edge cases prove each new rule fires **and** prove its boundary: indented prose still joins; one space after a colon is prose, not a table; an unterminated fence does not leak into the next comment span; a heading does not disable the sweep for the paragraph beneath it.

The apply was run **to a fixed point** (three passes: 13,002 → 4 → 0), because a join changes adjacency and can expose a junction the previous pass could not see.

### The three named sites

**1. The identity-callback ASVS V7 disclosure control** (`apps/supabase/supabase/functions/identity-callback/index.ts`).

Before (base `08218ef4b`, lines 249-251), verbatim:

```
      // Logged, never returned -- see the decryption arm above. The claim-extraction
      // message enumerates which configured claim names were present or missing, which
      // discloses the provider's claim mapping to an unauthenticated caller.
```

After (line 227), verbatim:

```
      // Logged, never returned -- see the decryption arm above. The claim-extraction message enumerates which configured claim names were present or missing, which discloses the provider's claim mapping to an unauthenticated caller.
```

Every element of the rationale survives: **what is logged** ("Logged"), **what is not returned** ("never returned"), **what the message would reveal** ("enumerates which configured claim names were present or missing"), and **to whom** ("to an unauthenticated caller"). Its `--` is intact — this is one of the 212 double-hyphen-as-dash comment lines, and it was not normalised. `152-12` left this comment byte-identical as its genuine exception because it carried no planning citation; a line-break change is a different axis and does not undo that protection.

**2. The adapter base-object comment** (`supabaseDataProvider.ts:333`). **Joined only.** The sentence is semantically unchanged — Phase 157 owns the typing half of that review item and will rewrite it wholesale. The one hand-fix in it was a token split, `name/short_name/ info` → `name/short_name/info`, restoring what the text was before it was wrapped.

**3. The API-route adapter reason-comment** (`apiRouteAdapter.ts:13`). The reviewers' clearest cited site and the reason no narrower rule was available. **Confirmed: it is a single line.**

### No dash rule, and the criterion that could not be met as written

**No dash rule was added** — not to the sweep, the instrument or the guard. `apps/frontend/src/hooks.server.ts` (`b79d5834`) and `apps/frontend/src/hooks.ts` (`c7311730`) are **byte-identical**, so neither ESLint disable-directive's double-hyphen rule-description separator was touched. The word "dash" appears in the instrument only in its prohibition.

The plan's criterion — *"`git grep -cP '(?i)\s--\s'` returns a count equal to the pre-sweep baseline"* — is **unsatisfiable by construction**, and not because a dash moved. `git grep -c` counts LINES, and a sweep that removes lines necessarily lowers it: joining two indented SQL comment lines removes one `--` marker. Measured 551 → 516 lines, with zero dashes normalised.

Per the phase's house rule (memo 4), the criterion was **not engineered around and not restated as met**. The property was proved by a named alternative route and flip-tested:

> With line-leading comment markers stripped from both sides, the count of `--` sequences is **equal per file across all 727 changed files: 8,715 = 8,715.**

Flip test: normalising one live ` -- ` to an em dash turns it **RED** (`identity-callback/index.ts: base=6 work=4`); restoring the byte-identical original (verified by `git hash-object`) turns it **green** again. Em/en-dash occurrences are unchanged, 3,630 = 3,630. Registered as WINDOWS 124.

---

## Task 3 — reading the diff where it is most likely to be wrong

Sampled systematically, not uniformly.

- **All 43 joins exceeding the p99 length (717 characters) were read individually.** The longest is `notLocated2e2cgShape.ts:13` at 1,211 characters. Every one is ordinary hand-wrapped prose whose join is faithful — the outlier lengths are expected under the ruling, which records that Prettier does not reflow comments and no ESLint max-length rule exists, so a 1,211-character joined comment line is **sanctioned, not a violation**.
- **The three named sites were read individually** and their post-join text recorded verbatim above.
- **Six mechanical detectors were run over the final queue**, each targeting one defect class, and **all six report zero**: fenced blocks 0, ATX headings 0, box-drawn headers 0, code/command lines 0, aligned tables 0, tool directives 0.

Task 3's four named defects:

1. **Two sentences run together without a separating space** — impossible by construction (the join always inserts one). The inverse was checked: two junctions where the first line carried trailing whitespace. Both joined cleanly to a single space, because the join trims each line's content. **0 defects.**
2. **A list item swallowed that the exclusion should have caught** — **0**. `NEXT_IS_LIST_ITEM` (1,291) holds.
3. **Two semantically distinct comments merged** — four candidates flagged by an ALL-CAPS-label detector; all four read at base and all four are **false positives**, mid-sentence continuations (`This is DEV-TOOL-INTENTIONAL: …`, `is DELIBERATELY MATCHING-NEUTRAL: …`, `non-throwing on TIMEOUT ONLY: …`). **0 defects.**
4. **A following code line's indentation changed** — **0**, proved rather than sampled: `assert-comment-only-diff.mjs` shows the non-comment byte stream of all 727 files is identical to base.

### Every hand-fix

**43 token-split repairs** — a join that split a token across the break, where the faithful join is spaceless because the text was one token before it was wrapped.

*apps (3):* `supabaseDataProvider.ts:361` (`name/short_name/ info`), `voterContext.svelte.ts:167` (`#nominationsAvailable/ #currentResultsEntityType`), `filterPersistent.ts:9` (`AVAILABLE- array`).

*packages (21):* `centroids.ts:57` · `latentTypes.ts:51` · `NominationsGenerator.ts:45` · `NominationsGenerator.ts:142` · `index.ts:13` · `index.ts:71` · `pipeline.ts:307` · `supabaseAdminClient.ts:134` · `buildMinimal.ts:427` · `alliances-override.ts:18` · `base.ts:290` · `base.ts:1053` · `perm-2e-asymmetric.ts:8` · `perm-disable-allow-open.ts:11` · `perm-disable-allow-open.ts:14` · `perm-hide-if-missing-answers.ts:8` · `perm-localisation-positive.ts:60` · `perm-localisation-positive.ts:83` · `default-template.integration.test.ts:101` — plus **two hand-hyphenated identifier breaks**, where the hyphen itself was the wrap artefact and had to go with the space: `answers.ts:119` `NumberQuestion.is- Matchable` → `NumberQuestion.isMatchable`, and `questions-override.ts:20` `(mapMulti- Categorical)` → `(mapMultiCategorical)`. **Both target identifiers were verified to exist before the edit** (`packages/data/.../dateQuestion.ts:51`; `emitters/latent/project.ts:202`).

*tests (19):* `playwright.config.ts:795, :1671, :1678` · `candidatePreviewPage.fixture.ts:76` · `entityDetails.fixture.ts:106` · `voter-journey.fixture.ts:373, :445` · `voterQuestionsPage.fixture.ts:15` · `perm-disable-allow-open.spec.ts:26` · `perm-localisation-positive.spec.ts:322` · `perm-not-located-2e2cg.spec.ts:118` · `voter-alliance.spec.ts:6` · `voter-nominations.spec.ts:43` · `missingNominations.ts:101` · `rawKeyScan.ts:241` · `voterIntro.ts:142, :190, :193` · `voterNavigation.ts:117`.

**4 reviewed KEEPs**, where the inserted space is correct and the join was left alone: `apps/docs/tailwind.config.mjs:9` (a URL, then a new sentence) · `apps/frontend/scripts/store-to-state-codemod.mjs:103` (a **suspended hyphen** — "a single- or double-quoted string literal", where the space is correct English) · `tests/tests/fixtures/shared/feedbackDialog.fixture.ts:5` and `tests/tests/utils/testIds.ts:96` (a path, then a parenthetical).

**One fix that was made and then reverted:** `testIds.ts:96` was repaired by the automated pass because its match key had been truncated past the point that identified it as a KEEP, then restored by hand on review. Recorded as a reverted fix, not as one that never happened.

### E2E

**The full E2E cardinal gate is deliberately NOT run here.** It is run once, in plan `152-15`, after this sweep has landed and the guard's second rule is wired — running it now would run it against a guard that is still half-installed and would have to be re-run in any case. This is a **sequencing decision, not an omission.** The prover's zero-non-comment-byte result with **zero allow entries** is the stronger guarantee for a comment-only diff, and it holds.

---

## Verification

| Gate | Result |
|---|---|
| `unwrap-comment-paragraphs.mjs --report` | **apps 0, packages 0, tests 0 — total 0** |
| `unwrap-comment-paragraphs.mjs --self-test` | 2 fixtures + 20 edge cases, **0 failures** |
| `assert-comment-only-diff.mjs --range dbc752e6a..HEAD` (bounded) | **727 compared, 0 violations, 0 allow entries, exit 0** |
| `assert-comment-only-diff.mjs --range b5bd212cc..HEAD` (unbounded) | 728 compared, **1 violation** — see below |
| `yarn build` | exit 0 |
| `yarn lint:check` | exit 0 |
| `yarn format:check` | exit 0 |
| `yarn test:unit` | exit 0 — **1,721 tests across 159 files** |
| `node scripts/assert-comment-hygiene.mjs` | exit 0 — 1,560 files, 0 violations |
| `yarn db:lint:sql` | **exit 1 — pre-existing, see below** |
| `git rev-list --count dbc752e6a..HEAD -- apps packages tests` | **3** (the cap) |
| hooks + `.editorconfig` byte-identity | `b79d5834`, `c7311730`, `ec6742a7` — all unchanged |

**Both prover ranges reported, per memo 16.** Bounded at the last REFACTOR commit's base `dbc752e6a`: **0 violations, 0 allow entries.** Unbounded from the decision commit `b5bd212cc`: **1 violation**, and it is the instrument file `unwrap-comment-paragraphs.mjs`, whose *code* this plan deliberately changed to fix the four defect classes. That is a scoping artefact of the range, not a sweep defect. **No allow entry was added** — the zero-allow-entry rule is what makes the bounded proof mean anything. Registered as WINDOWS 126.

**`yarn db:lint:sql` is pre-existing red, and cannot be otherwise.** Flip-tested by inspecting its input rather than assuming: its failing half is `supabase db lint --schema public --fail-on warning`, which **lints the live database and reads no working-tree file** — so a comment sweep cannot affect it by construction. Its four findings are plpgsql semantic warnings (`never read variable "p_key"`, `unused variable "rel_key"`, `unused parameter "p_template_body"`, `unused parameter "p_template_subject"`), **none comment- or line-length-related**. The file-reading half, `lint:schema`, **exits 0**. Registered as WINDOWS 125.

---

## Deviations from Plan

**1. [Rule 2 — missing critical] Four defect classes codified in the instrument before the sweep was spent**
- **Found during:** Task 2, reading the first `--apply` diff (and, for the directive class, `lint:check` going red).
- **Issue:** the ruled five-exclusion set folded fenced code blocks (903 junctions), tool directives (9), section headers (43) and unfenced indented recipes (135) into single lines.
- **Fix:** `CODE_FENCE` and `TOOL_DIRECTIVE` added as eligibility preconditions beside `BLOCK_DELIMITER`; `BANNER_RULE` and `HANGING_INDENT` widened. The ruling's five categories are unchanged in number and meaning.
- **Verification:** six edge cases proving each rule fires and its boundary; six mechanical detectors at zero over the final queue.
- **Commit:** `dbc752e6a`.

**2. [Rule 2 — missing critical] `COMMENT_TABLE` widened to column-aligned rows**
- **Found during:** Task 2 dry run. **Issue:** a 28-row UUID reference table was about to become one 1,738-character line.
- **Fix:** the constant now recognises the second syntax of the artefact it is named for. Blast radius measured at 42 junctions in exactly four files, every one verified by hand to be a real table.
- **Commit:** `08218ef4b`.

**3. [Rule 1 — bug] 43 token-split joins repaired by hand**
- **Issue:** the join inserted a space into a token the author had hard-wrapped, altering the text.
- **Fix:** listed individually above, with 4 reviewed KEEPs where the space is correct.
- **Commits:** the three tree commits.

**4. [Rule 3 — blocker] The dash criterion replaced by a per-file occurrence proof**
- **Issue:** the plan's per-LINE grep is unsatisfiable for a sweep that removes lines.
- **Fix:** per-file occurrence equality with markers stripped, flip-tested red then green. Registered rather than restated as met. **WINDOWS 124.**

**Total deviations:** 4 auto-fixed (2 × Rule 2, 1 × Rule 1, 1 × Rule 3). **Impact:** the sweep is 6.4% smaller than the naive ruled predicate would have made it, and every junction removed is structure rather than prose. Without them the phase would have shipped 282 destroyed code samples, three silently disabled tool directives and four folded reference tables.

**No decision was taken that belongs to the operator.** The fenced questions stay fenced: the 23 E2E coverage ids (memo 12) are untouched, and every `.md` file is byte-identical (memo 13) — `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md`, `dev-seed/README.md` and `fonts/README.md` included.

## Known Stubs

None.

## Threat Flags

None. The plan's `<threat_model>` assigns `mitigate` to T-152-01 (join escaping its span — proved by the prover, 0 violations), T-152-02 (the disclosure control — recorded verbatim, meaning intact), T-152-03 (directive parse — both hooks byte-identical, **and** `TOOL_DIRECTIVE` added after the sweep was found to reach the same threat by another route), T-152-32 (spending a one-way scale unruled — the ruling is committed and was re-measured), T-152-33 (an unkeepable guard — the exclusion set now survives contact with the real tree, at 20 edge cases). T-152-SC is not applicable: no package was installed.

## Issues Encountered

`yarn db:lint:sql` red, pre-existing and structurally unaffected (WINDOWS 125). Nothing blocking.

## Next Phase Readiness

Ready for `152-15`: the forced-line-break surface is at zero across all three trees, so the guard's second rule can be enabled without failing on pre-existing violations — which is exactly what D-N1(c) said any workable split required. `152-15` also owns the full E2E cardinal gate for this wave.

## Self-Check: PASSED

- `.planning/phases/152-comment-naming-hygiene-sweep/152-LINEBREAK-DECISION.md` — FOUND
- `.planning/phases/152-comment-naming-hygiene-sweep/152-14-SUMMARY.md` — FOUND
- Commits `b5bd212cc`, `08218ef4b`, `dbc752e6a` and the three tree commits — FOUND in `git log`
- All plan `<verification>` items re-run and recorded in the table above.
