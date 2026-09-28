---
phase: 260525-tea
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/dev-seed/src/templates/baseV1.ts
  - tests/tests/specs/voter/voter-mega-journey.spec.ts
autonomous: true
---

# Quick task: extend voter test data + tighten mega-journey assertions

## Goals

1. Collapse 26 hand-authored candidate opinion-answer blocks down to 4 templates:
   `POLAR_MAX`, `POLAR_MIN`, `GENERIC` (middle, tiebreak-to-min),
   and `SPECIAL` (the existing partial-answer arrangement on CA-AA-Special).
   `POLAR_MAX` + `POLAR_MIN` extend from 5 base questions to all 11 opinion
   questions (incl. opt-a/b, el-reg, co-mun-se-sw, open-filt-mun-ne/se).
2. Add unique `election_symbol` to all candidate nominations except the 2
   special nominations. Numbering: "2", "3", …, "30" in declaration order
   (29 non-special candidate nominations; "1" reserved/skipped).
3. Hoist remaining inline `/.../i` regex literals in `voter-mega-journey.spec.ts`
   into the `TEXT_RE` const for grep-discoverability + intent locality.
4. Replace the soft "9-type sentinel count" info-tab test step with an exact
   assertion on `info-item` testIds: open CA-AA-Special's drawer → assert 13
   info-items with exact label + value per the user-supplied screencap
   (including date `6/15/1980` and empty election number `—`). Open Polar-Max's
   drawer → assert election number = "3".

## Template definitions

```ts
// POLAR_MAX (max for each q's value range)
{
  base-1-likert5: '5', base-2-likert4: '4', base-3-likert7: '7',
  base-4-categorical: 'c', base-5-boolean: true,
  opt-a-1: '5', opt-b-1: '5', el-reg-1: '5', co-mun-se-sw-1: '5',
  open-filt-mun-ne: '5', open-filt-mun-se: '5'
}

// POLAR_MIN
{
  base-1-likert5: '1', base-2-likert4: '1', base-3-likert7: '1',
  base-4-categorical: 'a', base-5-boolean: false,
  opt-a-1: '1', opt-b-1: '1', el-reg-1: '1', co-mun-se-sw-1: '1',
  open-filt-mun-ne: '1', open-filt-mun-se: '1'
}

// GENERIC (middle; tiebreak-to-min)
{
  base-1-likert5: '3',     // mid of 1-5 = 3
  base-2-likert4: '2',     // mid of 1-4 = 2.5 → tiebreak-to-min = 2
  base-3-likert7: '4',     // mid of 1-7 = 4
  base-4-categorical: 'b', // mid of a/b/c = b
  base-5-boolean: false,   // no middle → tiebreak-to-min = false
  opt-a-1: '3', opt-b-1: '3', el-reg-1: '3', co-mun-se-sw-1: '3',
  open-filt-mun-ne: '3', open-filt-mun-se: '3'
}
```

## Assignments (per candidate)

| candidate                | template   | reason                                  |
|--------------------------|------------|-----------------------------------------|
| test-ca-aa-special       | SPECIAL    | partial-answer arrangement (unchanged)  |
| test-ca-aa-hidden        | POLAR_MAX  | preserves "hidden polar-max" semantics  |
| test-ca-aa-1             | POLAR_MAX  | the Polar-Max candidate (first card)    |
| test-ca-ba-1             | POLAR_MIN  | the Polar-Min candidate (last card)     |
| all other 25 candidates  | GENERIC    | "tied in the middle"                    |

## Election-symbol numbering (declaration order)

Special candidate nominations (no symbol):
- test-nom-reg-n-ca-aa-special
- test-nom-mun-ne-ca-aa-special

All other candidate nominations (sequential "2" … "30"):
- test-nom-reg-n-ca-aa-hidden → "2"
- test-nom-reg-n-ca-aa-1      → "3"
- test-nom-reg-n-ca-aa-2      → "4"
- test-nom-reg-n-ca-aa-3      → "5"
- test-nom-reg-n-ca-aa-4      → "6"
- test-nom-reg-n-ca-ab-1      → "7"
- test-nom-reg-n-ca-ba-1      → "8"
- test-nom-reg-n-ca-ba-2      → "9"
- test-nom-reg-n-ca-bb-1      → "10"
- test-nom-reg-n-ca-bb-2      → "11"
- test-nom-reg-n-ca-c-1       → "12"
- test-nom-reg-n-ca-c-2       → "13"
- test-nom-reg-n-ca-independent → "14"
- test-nom-reg-s-ca-aa-1      → "15"
- test-nom-reg-s-ca-ab-1      → "16"
- test-nom-reg-s-ca-ba-1      → "17"
- test-nom-reg-s-ca-bb-1      → "18"
- test-nom-mun-ne-ca-aa-1     → "19"
- test-nom-mun-ne-ca-ab-1     → "20"
- test-nom-mun-ne-ca-ba-1     → "21"
- test-nom-mun-ne-ca-bb-1     → "22"
- test-nom-mun-ne-ca-c-1      → "23"
- test-nom-mun-nw-ca-independent → "24"
- test-nom-mun-se-ca-aa-1     → "25"
- test-nom-mun-se-ca-ab-1     → "26"
- test-nom-mun-se-ca-ba-1     → "27"
- test-nom-mun-se-ca-bb-1     → "28"
- test-nom-mun-sw-ca-aa-1     → "29"
- test-nom-mun-sw-ca-ba-1     → "30"

## Matching contract (still holds after extension)

Voter pattern (per `voter-mega-journey.spec.ts` walk):
- base 1–5 → polar MAX (option index n-1)
- regional + filt-mun-ne → polar MIN (option index 0)

Candidate distances against this voter:
- POLAR_MAX (CA-AA-1, hidden): 5 base matches + 2 non-base max-distance ≈ 2·d_max
- POLAR_MIN (CA-BA-1):         5 base max-distance + 2 non-base matches ≈ 5·d_max
- GENERIC (25):                7 mid-distance answers ≈ 3.5·d_max

Ranking: Polar-Max → … → Polar-Min. Existing `firstCard = Polar-Max` /
`lastCard = Polar-Min` assertion still passes.

## Info-tab assertion (Special candidate, 13 info-items per screencap)

```
0  Election            : Regional Election
1  Constituency        : Region North
2  List                : (parent nomination tag — OR-AA under AL-A)
3  Election number     : —
4  Info: pick multiple categories that apply. : Choice A • Choice B
5  Info: pick one category.                   : Selection Y
6  Info: short biography.                     : Default candidate biography text.
7  Info: long biography.                      : Default longer biography text …
8  Info: years of experience.                 : 42
9  Info: would-you-run-again-yes-no?          : Yes
10 Info: date of birth.                       : 6/15/1980
11 Info: keywords.                            : —
12 Links                                       : (single link tag)
```

Then re-open Polar-Max's drawer → assert info-items[3] contains "3"
(the unique election symbol).

## Verification

- `yarn lint:check` clean on the 2 changed files
- E2E not run locally (operator runs e2e batches per session convention)
