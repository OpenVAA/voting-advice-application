---
phase: 144-seed-template-strict-typing-unknown-prop-guard
plan: "05"
subsystem: testing
tags: [dev-seed, zod, strict, negative-control, template-validation, assert-04]

requires:
  - phase: 144-seed-template-strict-typing-unknown-prop-guard
    provides: "144-01 — the opened ledger with rows Z1-OLD…Z4-OLD and V-OLD measured blind on the untouched tree"
  - phase: 144-seed-template-strict-typing-unknown-prop-guard
    provides: "144-02 — the hand-written `Template` (Option A) and its top-level key-set conformance assertion, which the `.strict()` addition is checked against"
provides:
  - "`.strict()` on `perEntityFragment` AND on `TemplateSchema` — the zod-layer statement of the unknown-key invariant"
  - "`fixed[]` left LOOSE at the zod layer with an in-file comment naming `assertKnownRowProps` as the one row-level authority (D-04)"
  - "A validating built-in branch in `cli/resolve-template.ts`, so `.strict()` has runtime reach on `default`, `e2e/base` and all 28 `perm-*` templates (D-07)"
  - "The corrected `resolve-template.ts` doc comment — record target R-6 (D-07a)"
  - "Four committed strictness/must-not-fire cases in `tests/template.test.ts` and a registry-iterating built-in-conformance case in `tests/cli/resolve-template.test.ts`"
  - "Ledger rows Z1-NEW…Z4-NEW (RED (catch), both directions each), V-NEW (RED (catch)), AF (already-failable) and NA (N/A — by construction)"
  - "The re-derived D-05 corpus census: 4 blind + 3 already-failable + 3 unfailable-by-construction = 10 sites"
affects: [144-04, 144-06, 144-07]

actuals:
  tokens: 31860
  tasks: 2
  commits: 7   # 6 task commits + this SUMMARY commit

tech-stack:
  added: []
  patterns:
    - "Per-object strictness stated at BOTH levels, with the non-descent measured rather than assumed — one committed case per level"
    - "A negative-control half measured against the PRE-PHASE blob when the claim is `already-failable`, so the observation cannot be credited to the phase making it"
    - "A drifted fixture built through an intermediate variable rather than a cast, because excess-property checking is a fresh-object-literal rule and that is how the drift actually arrives"
    - "Registry-iterating conformance specs with a floor assertion, so a later-registered member is covered without editing the spec and an empty registry cannot pass vacuously"

key-files:
  created: []
  modified:
    - packages/dev-seed/src/template/schema.ts
    - packages/dev-seed/src/cli/resolve-template.ts
    - packages/dev-seed/tests/template.test.ts
    - packages/dev-seed/tests/template/latent.schema.test.ts
    - packages/dev-seed/tests/cli/resolve-template.test.ts
    - .planning/phases/144-seed-template-strict-typing-unknown-prop-guard/144-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "`.strict()` placed AFTER the `.extend({ latent })` chain link on `TemplateSchema`, so the setting lands on the object that ships; both orderings re-measured equivalent at zod 4.3.6 and the choice is stated in a comment beside the call"
  - "`fixed[]` rows stay a loose record at the zod layer (D-04) — the per-collection allow-list is derived and restating it in zod would create the second parallel authority criterion 4 forbids"
  - "Row `AF` measured against the PRE-PHASE `schema.ts` blob rather than the current tree, so `already-failable` is proven independently of this plan's own change"
  - "The V-NEW drifted-built-in fixture is committed as a standing regression case rather than kept as a transient probe, and is constructed through an intermediate variable rather than a cast"
  - "The corpus census was re-derived at execution HEAD as 4+3+3=10 sites; the BLIND count — the number ASSERT-04 turns on — is confirmed at 4, and the two TMPL-07 `accepts …` sites were MEASURED already-failable rather than assumed"
  - "The `resolve-template.ts` doc comment is annotated in place with what changed and when, naming Phase 144 and D-07, rather than silently made true"

patterns-established:
  - "Discarded measurement iterations are preserved under a `-DISCARDED-` log name and disclosed in the ledger row, never dropped"
  - "A `N/A — by construction` disposition is evidenced by an independent witness (an injection that reddened its neighbours and left it green), not merely argued"

requirements-completed: [ASSERT-04]

coverage:
  - id: D1
    description: "`TemplateSchema` rejects an unknown TOP-LEVEL key, and `perEntityFragment` rejects an unknown key inside a per-entity fragment — two levels, two cases, because `.strict()` does not descend"
    requirement: "ASSERT-04"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template.test.ts#ASSERT-04: rejects an unknown TOP-LEVEL key (TemplateSchema.strict())"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/template.test.ts#ASSERT-04: rejects an unknown key INSIDE a per-entity fragment (perEntityFragment.strict())"
        status: pass
      - kind: unit
        ref: "vt-05-RED.log — both cases FAIL before `.strict()` lands (2 failed / 20 passed); vt-05-GREEN.log — both pass after (22 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each of the four blind sites fails when its declaration is removed and passes when it is present — both directions observed per site (rows Z1-NEW…Z4-NEW)"
    requirement: "ASSERT-04"
    verification:
      - kind: integration
        ref: "vt-Z1-NEW-1.log — RED exit 1, `3 failed | 12 passed (15)`, target among the reds; GREEN exit 0, `15 passed (15)`"
        status: pass
      - kind: integration
        ref: "vt-Z2-NEW-1.log — RED exit 1, `2 failed | 13 passed (15)`; GREEN exit 0, `15 passed (15)`"
        status: pass
      - kind: integration
        ref: "vt-Z3-NEW-1.log — RED exit 1, `1 failed | 14 passed (15)` (the sole red IS the target); GREEN exit 0, `15 passed (15)`"
        status: pass
      - kind: integration
        ref: "vt-Z4-NEW-1.log — RED exit 1, `5 failed | 2 passed (7)`; GREEN exit 0, `7 passed (7)`"
        status: pass
    human_judgment: false
  - id: D3
    description: "`fixed[]` rows stay loose at the zod layer — an arbitrary row key is accepted AND not stripped — so there is exactly one row-level authority (D-04)"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template.test.ts#D-04: still ACCEPTS an arbitrary key inside a fixed[] row (round-trip `toEqual`)"
        status: pass
      - kind: unit
        ref: "grep -c 'assertKnownRowProps' packages/dev-seed/src/template/schema.ts => 1 (the guidance ships in the file, not only in the plan)"
        status: pass
    human_judgment: false
  - id: D4
    description: "`resolveTemplate` validates built-in templates, so `.strict()` reaches `default`, `e2e/base` and every `perm-*` at seed time; the `Unknown template:` path is unchanged"
    requirement: "ASSERT-04"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/cli/resolve-template.test.ts#D-07: throws for a built-in carrying an unknown top-level key (was returned unvalidated)"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/cli/resolve-template.test.ts#D-07: the `Unknown template:` path is unchanged by the added validation"
        status: pass
      - kind: integration
        ref: "vt-05-t2-RED.log — the D-07 case FAILS before the change (1 failed / 14 passed); vt-V-NEW-1.log — passes after, with the thrown message captured verbatim"
        status: pass
    human_judgment: false
  - id: D5
    description: "D-04 + D-07 combined runtime fallout measured at this HEAD: every registered built-in passes the strict schema — 30 pass / 0 fail of 30"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/cli/resolve-template.test.ts#D-04 + D-07 fallout: every registered built-in passes the strict schema"
        status: pass
      - kind: integration
        ref: "vt-strictall-1.log + vt-V-NEW-1.log — `strict validation: 30 pass / 0 fail of 30`"
        status: pass
    human_judgment: false
  - id: D6
    description: "Row `AF` re-measured as already-failable against the PRE-PHASE schema blob, and explicitly NOT counted as a repair delivered by this phase"
    verification:
      - kind: integration
        ref: "vt-AF-1.log — pre-phase blob e8c9babb0, `eigenvalues` deleted: exit 1, `2 failed | 5 passed (7)`; restored: exit 0, `7 passed (7)`"
        status: pass
    human_judgment: false
  - id: D7
    description: "Row `NA` carries `N/A — by construction` and the site is repaired by conversion to the in-tree round-trip form"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template/latent.schema.test.ts:39 — expect(validateTemplate({})).toEqual({})"
        status: pass
      - kind: integration
        ref: "vt-NA-1.log + vt-Z4-NEW-1.log — an injection that reddened 5 of 7 cases in that file left this site green"
        status: pass
    human_judgment: false
  - id: D8
    description: "The `resolve-template.ts` doc comment (record target R-6) is annotated in place with what changed and when, rather than silently made true"
    verification:
      - kind: other
        ref: "grep -c 'D-07' packages/dev-seed/src/cli/resolve-template.ts => 2; grep -c '144' => 3"
        status: pass
    human_judgment: true
    rationale: "A grep proves the annotation EXISTS; it cannot judge whether the wording states the correction honestly and legibly to a future reader, which is the entire point of record target R-6. A human should read the paragraph before 144-07 cites it."
  - id: D9
    description: "The re-derived corpus census — 4 blind + 3 already-failable + 3 unfailable-by-construction = 10 — is the number 144-07 will write into REQUIREMENTS.md and the fake-guard sweep in place of the audit's 'six'"
    verification:
      - kind: integration
        ref: "vt-census-gtfal-1.log — the two TMPL-07 `accepts generateTranslationsForAllLocales` sites measured already-failable on the pre-phase tree, not assumed"
        status: pass
    human_judgment: true
    rationale: "The BLIND count (4) is measured and unambiguous, but the census total depends on where the boundary of the '\"accepts field X\" shape' is drawn — I drew it to include the three `{}`-assertion sites and the two TMPL-07 value-read-back sites. 144-07 amends ASSERT-04 and F13 IN PLACE from these numbers, so a human should confirm the boundary before that amendment ships."

duration: 24 min
completed: 2026-08-23
status: complete
---

# Phase 144 Plan 05: The zod layer — `.strict()` on both objects, and runtime reach for it Summary

**Four "accepts field X" assertions that were structurally unable to fail now fail when their declaration is removed and pass when it is present — including the nested-fragment one, which top-level strictness alone would have left blind — and `resolveTemplate` validates built-ins, so the tightening reaches `default`, `e2e/base` and all 28 `perm-*` templates at seed time instead of guarding developer-supplied custom templates only.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-08-23T15:29:00Z
- **Completed:** 2026-08-23T15:53:00Z
- **Tasks:** 2 (6 commits — both tasks ran the RED → GREEN cycle)
- **Files modified:** 6

## Accomplishments

- **Two `.strict()` calls, and the second one is not redundant.** `.strict()` is a per-object setting; it does not descend. Re-measured at this tree's zod (**4.3.6**, confirmed by direct probe): a top-level-only strict schema parses `{candidates:{fixed:[…],bogus:3}}` with `success: true` and **silently strips** `bogus`. Row `Z2-NEW` exists to demonstrate exactly that, and the `.strict()` on `perEntityFragment` is what makes it red.
- **`fixed[]` deliberately left loose, with the reason shipped in the file.** Row-level unknown keys stay `assertKnownRowProps`' authority (D-04). A comment at the `fixed` declaration says so and names the module, so a later reader does not "complete" the tightening and reintroduce the drift criterion 4 forbids.
- **The tightening has runtime reach, not test-only reach.** `cli/resolve-template.ts` ended in a bare `return builtIn;`, so the zod layer guarded custom templates only. It now validates, and the measurement that this is safe was taken **here**: `strict validation: 30 pass / 0 fail of 30`.
- **The false doc comment is corrected in place, not quietly made true.** Record target R-6, D-07a.
- **The corpus was re-derived rather than trusted**, and one honest disagreement with the plan's table is reported below.
- **Two sites are recorded as what they are rather than counted as wins.** Row `AF` is already-failable — proven against the **pre-phase** blob so the claim cannot borrow this plan's own change. Row `NA` is unfailable by construction and carries a scoped-exception disposition.

## The re-derived corpus — 4 + 3 + 3 = 10, and the blind count is 4

Re-derived at execution HEAD by enumerating every "accepts field X"-shape site in the two D-05 spec files, then classifying each **by measurement** rather than by reading. `144-07` writes these numbers into `REQUIREMENTS.md:57` and the fake-guard sweep's F13 entry, **in place**.

| # | Site (`it(` line, at execution HEAD) | Classification | Evidence | Ledger row |
|---|---|---|---|---|
| 1 | `template.test.ts:22` — `TMPL-02: {} template passes validation` | unfailable by construction | asserts `validateTemplate({})`; no declaration to remove. Already carries the round-trip at `:24` | — |
| 2 | `template.test.ts:39` — `accepts valid top-level fields` | **blind → now failable** | `vt-Z1-NEW-1.log` | `Z1-NEW` |
| 3 | `template.test.ts:49` — `accepts nested fixed[] …` | **blind → now failable** | `vt-Z2-NEW-1.log` | `Z2-NEW` |
| 4 | `template.test.ts:59` — `accepts per-entity fragment for every expected key` | **blind → now failable** | `vt-Z3-NEW-1.log` | `Z3-NEW` |
| 5 | `template.test.ts:79` — `TMPL-07: accepts …: true` | already-failable | reads the value BACK; **measured** red on the pre-phase tree, `vt-census-gtfal-1.log` | — |
| 6 | `template.test.ts:84` — `TMPL-07: accepts …: false` | already-failable | same run, same log | — |
| 7 | `template.test.ts:95` — `TMPL-07: {} still passes` | unfailable by construction | asserts `validateTemplate({})`; still on the bare `.not.toThrow()` form | — |
| 8 | `latent.schema.test.ts:30` — `accepts an empty template (regression)` | unfailable by construction | `vt-NA-1.log` | `NA` |
| 9 | `latent.schema.test.ts:42` — `accepts empty latent block` | **blind → now failable** | `vt-Z4-NEW-1.log` | `Z4-NEW` |
| 10 | `latent.schema.test.ts:46` — `accepts matching dimensions + eigenvalues` | already-failable | `vt-AF-1.log`, taken on the pre-phase blob | `AF` |

**Totals: 4 blind · 3 already-failable · 3 unfailable-by-construction = 10.**

### ⚠ Finding — the plan's table and this census disagree, and the disagreement is not in the number that matters

The plan's `<corpus>` predicted **4 + 1 + 1 = 6**. That is not the census total; it is the set of sites needing a **ledger row**. The re-derivation:

- **CONFIRMS the blind count at 4.** This is the number ASSERT-04 turns on — the count of assertions this phase moves from structurally-unable-to-fail to failable — and every one of the four is now backed by a two-directional measurement.
- **Finds 4 further sites** the plan's table did not enumerate: two more already-failable (`:79`, `:84`) and two more unfailable-by-construction (`:22`, `:95`).
- **Therefore contradicts the audit's "six" twice over.** The audit called six sites blind. Four are. The remaining two the plan's table names (`AF`, `NA`) were never blind, and there are four *more* sites in the same shape that the audit did not count at all. **"Six" is wrong as a count of blind sites (it is 4) and wrong as a count of sites in this shape (it is 10).**
- **Recommendation for `144-07`:** amend `REQUIREMENTS.md:57` and F13 to say **four** blind sites made failable, and cite the 4/3/3 census so the discarded figure cannot re-enter through a later reader's arithmetic.

`template.test.ts:95` is the one site this plan leaves as it found it: unfailable by construction and still on the bare `.not.toThrow()` form. Converting it to the round-trip form would be the same repair applied to row `NA`. It is out of this plan's row set and is **not** claimed as done — flagged here for `144-07`.

## The four two-run controls — both directions, per site

Every RED direction used its blind half's byte-identical removal, and each iteration was post-gated with `git checkout --` plus a blob-hash comparison (`6e575e6712766ef83d121c786add73324394ff9c`, restored identical every time) and a clean `git status --porcelain -- packages apps tests`.

| Row | Removal | RED direction | GREEN direction | Contrast with the blind half |
|---|---|---|---|---|
| `Z1-NEW` | `seed` / `externalIdPrefix` / `projectId` from `TemplateSchema` | exit **1**, `Tests  3 failed \| 12 passed (15)`, target among the reds | exit **0**, `15 passed (15)` | `Z1-OLD`: target **passed** with all three gone (`2 failed \| 9 passed (11)`) |
| `Z2-NEW` | `fixed` from `perEntityFragment` | exit **1**, `Tests  2 failed \| 13 passed (15)` | exit **0**, `15 passed (15)` | `Z2-OLD`: the same deletion cost **zero** failures (`11 passed (11)`) |
| `Z3-NEW` | the `nominations` slot (the slot `Z3-OLD` named) | exit **1**, `Tests  1 failed \| 14 passed (15)` — the **sole** red is the target | exit **0**, `15 passed (15)` | `Z3-OLD`: a case titled *"every expected key (12 …)"* passed with **eleven** declared |
| `Z4-NEW` | the whole `.extend({ latent: latentBlock.optional() })` chain link | exit **1**, `Tests  5 failed \| 2 passed (7)` | exit **0**, `7 passed (7)` | `Z4-OLD`: target passed with the link gone; key stripped |

`Z3-NEW` needed **no apparatus control**: under `.strict()` the deletion has exactly one consequence and it is the intended one. `Z2-NEW`'s second red is this plan's own D-04 companion case — a second independent witness rather than unrelated noise.

**`Z2-NEW` is the T-144-34 evidence.** Its catch comes from `perEntityFragment.strict()`, not from `TemplateSchema.strict()`. Had only the top level been tightened, `Z2-OLD`'s zero-failure blindness would have survived this phase intact.

### ⚠ Disclosed: `Z4-NEW` iteration 0 was a mis-injection

The first `sed` for `Z4-NEW` used a line number computed **before** an earlier iteration's edit and deleted a *comment* line instead of the chain link. The run was a no-op (`7 passed (7)`) and would have read, unexamined, as "the deletion changed nothing". It is **preserved** at `vt-Z4-NEW-0-DISCARDED-misinjection.log`, disclosed in the ledger row, and iteration 1 verified the apparatus before running (`grep -c '.extend({ latent: latentBlock' → 0`). Deleting the log would have been the easy option and the wrong one.

## Row `AF` — already-failable. **This is not a repair delivered by this phase.**

`latent.schema.test.ts:46` (`accepts matching dimensions + eigenvalues`) is green because `latentBlock` has carried its own `.strict()` since Phase 57 — nothing in this plan touched it.

To make the claim non-circular, the measurement was taken on the **pre-phase** `schema.ts`: `git show 8331eaed2:packages/dev-seed/src/template/schema.ts` (blob `e8c9babb0b1d8ff5bd1d9f4e8f8548882157d61b`), i.e. the `144-02` tree **without** either `.strict()` call this plan adds — a file containing exactly **one** `.strict()` call, `latentBlock`'s own. With `eigenvalues` deleted from `latentBlock`: exit **1**, `Tests  2 failed | 5 passed (7)`, target among the reds. Restored and re-run on the current tree: exit **0**, `7 passed (7)`.

**The site was failable before `144-05` existed and is failable after. It is excluded from the four.** Counting it in would have inflated the phase's own numbers — the exact class of error this milestone exists to eliminate (T-144-36).

## Row `NA` — `N/A — by construction`, repaired differently

`latent.schema.test.ts:31` asserts `validateTemplate({})`. It declares no field, so **no** removal from the schema can redden it and strictness cannot repair it.

That unfailability is **observed**, not argued: in `vt-Z4-NEW-1.log`, an injection that reddened **5 of the 7** cases in that very file left this one green.

The repair is a conversion to the round-trip form already in-tree at `template.test.ts:24`, added at `latent.schema.test.ts:39`:

```ts
expect(() => validateTemplate({})).not.toThrow();
// … row NA rationale …
expect(validateTemplate({})).toEqual({});
```

It **complements** rather than replaces the `.not.toThrow()`. Round-tripping does not make the site failable and is not claimed to — it makes the assertion say something about the return value instead of only about the absence of a throw. Precedent for the disposition: Phase 142, F17.

## The `.strict()` ordering, and the D-04 guard comment

**Chosen ordering: `.strict()` AFTER the `.extend()` chain link** —

```ts
export const TemplateSchema = z
  .object({ … })
  .extend({ latent: latentBlock.optional() })
  .strict();
```

so the setting lands on the object that actually ships and no reader has to reason about whether `.extend()` preserved it. Both orderings were re-measured at 4.3.6 and behave identically (strict-then-extend and extend-then-strict both reject an unknown top-level key; both still accept the extended `latent` field). **There is no hazard** — the order is stated in a comment beside the call only so the choice is legible rather than accidental.

`perEntityFragment` carries `.strict()` too, and its `fixed` declaration carries the D-04 guard comment naming `assertKnownRowProps` in `./permittedKeys` as the one row-level authority, with the reason (a restated allow-list can drift from `LINK_SENTINELS`).

## Row `V-NEW` and the registry-wide fallout

`cli/resolve-template.ts` now ends its built-in branch in `return validateTemplate(builtIn);` — one validating exit, verified (`grep -cE '^\s*return builtIn;'` → **0**, `grep -c 'validateTemplate(builtIn)'` → **1**).

- **`V-OLD` (blind half), restated:** `Tests  3 passed (3)` — the call resolved without throwing and `totallyUnknownTopLevelKey` was still present on the returned object.
- **`V-NEW` (this half):** the same call throws. Verbatim, first 80 characters:
  `"Template validation failed:\n  template.: Unrecognized key: \"totallyUnknownTopLev"`
- **Registry-wide fallout, measured at this HEAD:** `strict validation: 30 pass / 0 fail of 30`. Agrees with `144-RESEARCH` R8.7's prior of 30/30, but is taken here rather than cited, with a **standing** spec behind it that iterates `BUILT_IN_TEMPLATES` (no hard-coded `perm-` names) under a `>= 30` floor guarding against a vacuous pass.

Criterion 5's fallout table for this half of the phase is **empty, and empty because it was measured**. This is the de-risking observation for T-144-33.

The `Unknown template:` error path is unchanged and has its own regression case asserting so.

## The annotated doc comment (record target R-6)

Added immediately beneath the sentence it corrects, verbatim:

> ⚠ **This sentence became true in Phase 144 (D-07). It was FALSE at every HEAD from the day the built-in branch was added until then.** The built-in lookup ended in a bare `return builtIn;` and never reached `validateTemplate()`, so the zod layer guarded custom templates ONLY — `default`, `e2e/base` and every `perm-*` bypassed it at seed time. Phase 144 routed that branch through the validator too (see the call below), which is what gives the phase's `.strict()` (D-04) runtime reach rather than test-only reach. Recorded here rather than quietly corrected: a record made true without saying so is how records come to disagree. Ledger rows `V-OLD` / `V-NEW` hold the before and after; this comment is record target **R-6**.

## Ledger discipline — seven rows, and only seven

Per `<parallel_wave_note>`, the ledger was re-read from disk immediately before **each** of the two edits, and each edit was a scoped per-row replacement, never a wholesale rewrite.

| Edit | `git diff --stat` | Rows touched |
|---|---|---|
| Task 1 (`360c4cd6f`) | 6 insertions, 6 deletions | `Z1-NEW`, `Z2-NEW`, `Z3-NEW`, `Z4-NEW`, `AF`, `NA` |
| Task 2 (`5776ee223`) | 1 insertion, 1 deletion | `V-NEW` |

**Seven rows, seven changed lines, zero other cells.** Row-scoped placeholder count across the seven: **0**. No global count was asserted — that is `144-07`'s to derive, once. `144-03`'s rows (`DRV-NEW`, `L`'s plan half) were present on disk at both re-reads and were left untouched.

## Task Commits

1. **Task 1 RED** — `551c95bfb` (test) — failing strictness cases + the row-`NA` round-trip conversion
2. **Task 1 GREEN** — `5490b9b4b` (feat) — `.strict()` on both objects + the D-04 `fixed[]` guard comment
3. **Task 1 measurement** — `360c4cd6f` (docs) — rows `Z1-NEW`…`Z4-NEW`, `AF`, `NA` + the corpus re-derivation
4. **Task 2 RED** — `4a3a94714` (test) — failing built-in validation case + the registry conformance case
5. **Task 2 GREEN** — `f0228e55e` (feat) — validating built-in branch + the R-6 doc-comment correction
6. **Task 2 measurement** — `5776ee223` (docs) — row `V-NEW`

No REFACTOR commit: neither cycle left anything to clean up.

## Files Created/Modified

- `packages/dev-seed/src/template/schema.ts` — `.strict()` on `perEntityFragment` and on `TemplateSchema` (after `.extend`), plus the D-04 comment keeping `fixed[]` loose and naming `assertKnownRowProps`
- `packages/dev-seed/src/cli/resolve-template.ts` — the validating built-in return, and the corrected doc comment (record target R-6)
- `packages/dev-seed/tests/template.test.ts` — two ASSERT-04 rejection cases and two D-04 must-not-fire round-trip cases
- `packages/dev-seed/tests/template/latent.schema.test.ts` — the row-`NA` site converted to the round-trip form
- `packages/dev-seed/tests/cli/resolve-template.test.ts` — the drifted-built-in case, the unchanged-`Unknown template:` case, and the registry-iterating strict-conformance case
- `.planning/phases/…/144-NEGATIVE-CONTROL-LEDGER.md` — seven rows filled

## Run logs

All under `${TMPDIR:-/tmp}/gsd-144/`: `vt-Z1-NEW-1.log`, `vt-Z2-NEW-1.log`, `vt-Z3-NEW-1.log`, `vt-Z4-NEW-1.log`, `vt-Z4-NEW-0-DISCARDED-misinjection.log`, `vt-AF-1.log`, `vt-NA-1.log`, `vt-V-NEW-1.log`, `vt-strictall-1.log`, `vt-census-gtfal-1.log`, `zodprobe.log`, `vt-05-RED.log`, `vt-05-GREEN.log`, `vt-05-t2-RED.log`, `vt-repo-05-close.log`, `tc-05-close.log`, `lint-05.log`, `fmt-05.log`.

## Decisions Made

See `key-decisions` in the frontmatter. The two that a later reader is most likely to want the reasoning for:

- **Why `AF` was measured against the pre-phase blob.** Measuring it on the current tree would have been simpler and would have produced the same red — but the red would have been consistent with `latentBlock.strict()` **or** with this plan's new calls, and the row's whole claim is that this phase deserves no credit for it. The pre-phase blob removes the ambiguity at the cost of one extra `git show`.
- **Why the drifted built-in is built through a variable, not a cast.** Excess-property checking is a fresh-object-literal rule (the hole `144-02` documented on `FixedRow`). A cast would have asserted past the type layer; an intermediate variable reproduces the way drift actually reaches the registry, so the fixture tests the real failure mode.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's acceptance criterion for `validateTemplate(builtIn)` conflicted with the first draft of the R-6 doc comment**

- **Found during:** Task 2 (GREEN)
- **Issue:** The criterion requires `grep -c 'validateTemplate(builtIn)'` to be exactly **1**, so there is exactly one validating exit from the branch. My first draft of the R-6 annotation quoted the new call verbatim as `return validateTemplate(builtIn);`, which made the count **2** and would have made the criterion unenforceable — a second occurrence in prose is indistinguishable from a second call site to the grep.
- **Fix:** Reworded the annotation to "routed that branch through the validator too (see the call below)". The prose still names what changed; the grep still counts call sites.
- **Files modified:** `packages/dev-seed/src/cli/resolve-template.ts`
- **Verification:** `grep -c 'validateTemplate(builtIn)'` → 1; `grep -c 'D-07'` → 2; `grep -cE '^\s*return builtIn;'` → 0
- **Committed in:** `f0228e55e`

**2. [Rule 2 - Missing Critical] The census claim for the two TMPL-07 sites was measured rather than asserted**

- **Found during:** Task 1 (corpus re-derivation)
- **Issue:** Re-deriving the corpus surfaced four sites the plan's table did not enumerate. Two of them (`template.test.ts:79` / `:84`) *read the value back*, which makes them already-failable **by inspection** — but this phase's entire standard is that a classification without a measurement is not a finding.
- **Fix:** Ran the classification as a measurement: deleted the `generateTranslationsForAllLocales` declaration on the **pre-phase** tree and observed both sites go red (`vt-census-gtfal-1.log`). No ledger row was created — this is census support, not a register row, and the plan's row set is closed at seven.
- **Files modified:** none (transient injection, restored; `git status` clean)
- **Verification:** `vt-census-gtfal-1.log` — exit 1, both TMPL-07 `accepts` cases red
- **Committed in:** `360c4cd6f` (recorded in the commit body; no file change)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing-critical).
**Impact on plan:** No scope creep. Deviation 1 preserved an acceptance criterion the plan wrote for a reason; deviation 2 upheld the phase's own evidentiary standard on a claim that would otherwise have shipped as an assertion. Neither changed what was built.

## Issues Encountered

- **`Z4-NEW` iteration 0 was a mis-injection** (stale line number, deleted a comment instead of the chain link). Resolved by restoring the tree, verifying the apparatus with a `grep -c` before re-running, and **preserving** the discarded log rather than deleting it. Disclosed in the ledger row and in this summary. Root cause: computing an injection line number from an earlier read rather than re-grepping after each restore. Every subsequent injection re-grepped first.
- Two pre-existing `unused-imports/no-unused-vars` **warnings** in `packages/core/src/controller/controller.ts` and the `ctx`-parameter warnings across `packages/dev-seed/src/generators/*` are unrelated to this plan's files. `yarn lint:check` exits **0**. Out of scope; not touched.

## Gates at plan close

| Gate | Result |
|---|---|
| `yarn test:unit` (repo) | exit **0** — 25/25 turbo tasks; dev-seed **491 tests**, frontend **814 tests** |
| `TURBO_FORCE=true npx turbo run typecheck` | exit **0** — **22 executing**, `grep -c 'error TS'` → **0** |
| `yarn lint:check` | exit **0** |
| `yarn format:check` | exit **0** |
| `git status --porcelain -- packages apps tests` | empty |
| Task 1 `<verify>` block | **PASS** |
| Task 2 `<verify>` block | **PASS** |

**Not run: the Playwright E2E suite.** This plan's runtime delta is one: built-in templates now pass through `validateTemplate` before `runPipeline` sees them. That is measured directly — 30/30 built-ins pass the strict schema — and the seed path is exercised by `tests/integration/default-template.integration.test.ts` against the live local database. `144-06` owns the E2E gate. Recorded here so the substitution is visible rather than silent.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Ready for `144-04`** (the runtime unknown-prop guard). The zod layer now stops at the row boundary by design: `fixed[]` rows are still a loose record and the in-file comment names `assertKnownRowProps` as the authority. There is exactly one row-level authority for `144-04` to build.
- **Ready for `144-06`.** `resolveTemplate` validating built-ins is a live behaviour change on every seed path; the E2E suite is its backstop.
- **`144-07` inherits two amendments and one flag:**
  1. `REQUIREMENTS.md:57` and the fake-guard sweep's F13 entry say **six**. Amend **in place** to **four** blind sites made failable, citing the 4/3/3 census.
  2. Record target **R-6** is discharged — `resolve-template.ts`'s comment is corrected and annotated.
  3. `template.test.ts:95` (`TMPL-07: {} still passes`) is unfailable by construction and still on the bare `.not.toThrow()` form. Out of this plan's row set, **not** claimed as done, and a candidate for the same round-trip repair row `NA` received.
- **No blockers.**

---
*Phase: 144-seed-template-strict-typing-unknown-prop-guard*
*Completed: 2026-08-23*

## Self-Check: PASSED

All 6 modified/created files exist on disk. All 7 commits (`551c95bfb`, `5490b9b4b`, `360c4cd6f`, `4a3a94714`, `f0228e55e`, `5776ee223`, `323bcee61`) are present in `git log`. All 10 run logs exist and are non-empty, including the disclosed discarded iteration. Both task `<verify>` blocks re-run PASS at plan close.
