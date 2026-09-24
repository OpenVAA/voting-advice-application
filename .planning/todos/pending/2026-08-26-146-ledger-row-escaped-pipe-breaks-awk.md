---
created: 2026-08-26T19:30:00.000Z
title: F3-BOGUS-GREEN's row splits into 13 awk fields because of escaped pipes in a code span
area: planning docs / tooling
severity: trivial
source: Phase 146 (pre-existing since 146-07)
files:
  - .planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/146-NEGATIVE-CONTROL.md
---

## Problem

The `F3-BOGUS-GREEN` row of `146-NEGATIVE-CONTROL.md` § Register contains an inline code span with
two escaped pipes (a `grep -c` alternation). A naive `awk -F'|'` over that row therefore returns
**13** fields where the nine-column table should give **11** — `F2-BOGUS-RED`, the paired row, gives
the correct 11.

Measured, not assumed: `grep '^| F3-BOGUS-GREEN' … | awk -F'|' '{print NF}'` prints `13`.
*(A prior note put the count at 11; the measured value is 13, and the measurement is what stands.)*

The row **renders correctly** in Markdown — the escapes are doing their job. The breakage is only
in ad-hoc field-splitting over the raw file, and it has been present since `146-07` filled the row.

## Solution

Any tooling that parses these register tables should split on `(?<!\\)\|` rather than a bare pipe,
or read the rendered table. Alternatively, avoid escaped pipes inside register cells by rephrasing
the command rather than quoting it — the convention § *Record corrections* now follows.

Not worth editing the historical row for: rewriting a filled evidence cell to satisfy a parser is
the wrong direction of causation.
