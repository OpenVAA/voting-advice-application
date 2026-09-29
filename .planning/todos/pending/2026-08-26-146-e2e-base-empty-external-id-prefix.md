---
created: 2026-08-26T19:30:00.000Z
title: e2e/base declares externalIdPrefix '' — one foreign candidate would rotate all 30 portrait assignments
area: testing / dev-seed
severity: minor
source: Phase 146 (.planning/debug/seed-determinism-across-resets.md, evidence T-140)
files:
  - packages/dev-seed/src/supabaseAdminClient.ts
  - packages/dev-seed/src/writer.ts
---

## Problem

An observation with a sharp edge, **not a live defect**.

The `e2e/base` template declares `externalIdPrefix: ''`. That flows
`writer.write(rows, '')` -> `uploadPortraits('')` -> `selectCandidatesForPortraitUpload('')`, whose
query becomes `.like('external_id', '%')` — matching **every** non-NULL `external_id` in the
project, not just the template's own rows.

Portrait assignment is `portraitFiles[i % portraitFiles.length]` over the returned candidate list,
ordered by `external_id`. With 30 candidates and 30 portrait files that is a **bijection**, so it is
maximally sensitive to the list changing: a single foreign candidate whose `external_id` sorts
before `test-` shifts every index by one and **rotates all 30 portrait assignments**. Every
candidate photograph in the dataset would change at once — which is precisely how the visual gate
would notice, and precisely the kind of whole-dataset churn that gets misread as a seed
non-determinism bug (it was, in Phase 146; see D-146-DEF-1, refuted).

**It cannot fire on a clean database**, and the dataset freshness probe warns when it would. That is
why this is filed rather than fixed.

## Solution

Make the selection identity-based rather than prefix-globbed when the prefix is empty: either
require a non-empty `externalIdPrefix` for templates that upload portraits, or select the exact
`external_id` set the template just wrote instead of re-querying by `LIKE`. The second is the
stronger fix — it removes the dependence on what else happens to be in the project entirely.

## Evidence

`.planning/debug/seed-determinism-across-resets.md` — the bijection argument, the confirming
experiment, and the reason it did not explain the variance actually observed (a 291x17 focus-state
band, fixed test-only in `2df2d0b28`).
