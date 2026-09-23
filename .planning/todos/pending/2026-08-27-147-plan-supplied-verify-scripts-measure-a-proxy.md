---
created: 2026-08-27T17:20:00.000Z
title: Plan-supplied <verify> scripts keep measuring a proxy for the claim rather than the claim — three plans running
area: planning / verification authoring
severity: medium
source: Phase 147 (147-03, 147-04 and 147-05 each found their OWN plan's script wrong; filed by 147-05 at the Task-3 checkpoint)
files:
  - .planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-03-SUMMARY.md
  - .planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-04-SUMMARY.md
  - .planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-05-SUMMARY.md
---

## The defect class

Three consecutive plans in one phase each found **their own** plan-supplied `<verify><automated>`
script wrong, in the same way: the script measures something ADJACENT to the claim rather than the
claim.

| plan | what the script did | consequence |
|---|---|---|
| `147-03` | filtered Playwright titles on `/cand-/`, which also matches a **perm** test | over-count — the check would pass for the wrong reason |
| `147-04` (Task 2) | selected register rows with `l.startsWith('\|') && l.includes(id)`, which matches the **corpus summary table** ~60 lines *before* the register row. `RK2-NEW`'s corpus line reads "same, for `common.required`" and never names `RK2-OLD` | **FAILS ON A CORRECT IMPLEMENTATION** |
| `147-04` (Task 3) | counted every `TBD-147` in the register, including the prose sentences that **define** the placeholder convention | a count drivable to zero only by deleting the document's explanation of itself |
| `147-05` (Task 1) | asserted the 161 / 121 / 316 decomposition with bare `/161/`, `/121/`, `/316/` over the whole file — three-digit substrings that occur incidentally elsewhere | **PASSES WITHOUT THE CLAIM BEING TRUE**; a vacuous check, the same authoring defect in the opposite direction |

Each was caught and corrected by the executing plan, and each was recorded as a per-plan deviation.
**Nothing aggregates them**, which is why the same defect reached three plans in a row.

## The root cause, as far as three instances support

The script is authored against a **human summary** of the artefact (a table's gist, a title's shape,
a number's appearance) rather than against the **addressing convention the artefact itself defines**.
`147-NEGATIVE-CONTROL.md`, for instance, specifies its own anchored `^| \`ID\` ` row pattern at
creation and states the exact `grep` that counts rows — and both `147-04` scripts re-derived a
different selector instead of using it.

Compounding: the scripts are written at plan time and are **never executed against a known-correct
tree** before being handed to the executor, so a check that fails on a correct implementation is
indistinguishable at authoring time from one that works.

## Also recorded, since it cost time twice

Playwright's `--list --reporter=json` output must be **sliced from the first `{`**: dotenv writes a
banner to stdout before the JSON, so a bare `JSON.parse` of the captured stdout throws.

## Solution

Three cheap rules, in decreasing order of value:

1. **Use the artefact's own documented selector.** If a document specifies how to count or address
   its own rows, the plan's check calls that, and does not re-derive an equivalent.
2. **Every `<automated>` check states what it would FAIL on** — one line naming the wrong state it
   distinguishes from the right one. A check that cannot name its own negative control is a check
   whose vacuity nobody has considered. (This is the same discipline this phase applied to the axe
   gate itself: the green means nothing without `AX1-OLD`.)
3. **Never assert a number with a bare substring match.** `/161/` matches "1161" and any incidental
   three digits; anchor on the surrounding claim.

## Note

Filed at the human's prompting at `147-05`'s Task-3 checkpoint, after the third instance. It is a
defect in how plans author verification, not three coincidences — and the executor catching it three
times is luck that should not be relied on a fourth.
