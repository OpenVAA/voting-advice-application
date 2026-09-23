---
created: "2026-08-24T19:32:00.000Z"
title: Harden the phase-145 anon RLS guard — unscoped counts and a swallowed query error
area: dev-seed
files:
  - packages/dev-seed/tests/integration/default-template.integration.test.ts
---

## Problem

Phase 145 built a standing regression guard that crosses the RLS boundary the voter app
crosses (a second `it` in `default-template.integration.test.ts`, asserting `get_nominations()`
returns non-zero candidate and organization counts through an anon client, preceded by an
`accounts` role control). The guard is sound and its two measured pairs hold. Two holes in it
were found by the phase's own code review, and both weaken the guard-of-the-guard the design
depends on.

**WR-02 — the counts are not scoped to the rows this suite seeded.** `get_nominations()`
returns *all* nominations. Teardown only removes the `seed_` prefix, and `e2e/base` seeds with
`externalIdPrefix: ''`. A developer who follows the documented workflow — seed `e2e/base` for a
manual Playwright run, then run the dev-seed suite — gets a **green guard counting somebody
else's candidates**. The guard would stay green through a total regression of the `default`
template. CI is unaffected (fresh database per run), so this hides specifically from the
developer most likely to hit it.

**WR-03 — the role control discards its query error.** The anon half is written so that
`(null ?? []).length === 0` *satisfies* the assertion. A 401 from a bad anon key therefore
**passes** the control rather than failing it — the exact vacuous-pass the control exists to
prevent. It is currently rescued only by an unrelated assertion five lines later, which is
incidental rather than designed.

## Solution

- **Scope the counts.** Filter the nomination rows to the `seed_` external-id prefix (or assert
  against the seeded ids the first `it` wrote) before counting, so the guard measures this
  suite's own data.
- **Fail on query error.** Destructure and assert `error` is null for both role-control reads
  before comparing lengths, so a 401/403 turns the guard red instead of green.
- Keep the `?? 0` defaulting and the `> 0` boundary on the entity-type counts — the defect
  presents as an **absent** key, not a zero, and that part is correct as written.

When changing this file, note that phase 145's four measured pair halves (`P1-RED`, `P1-GREEN`,
`P2-RED`, `P2-GREEN`) were all recorded against blob `62b9f0eac…` at ancestors of `ef1834410`.
Those measurements stand on that blob; a later hardening does not invalidate them, but the
ledger rows should not be re-cited as though they were measured against the new instrument.

## Source

Phase 145 code review, findings WR-02 and WR-03.
