---
title: Add alliances to default test data
priority: medium
area: dev-seed
created: 2026-04-28
promoted: 2026-04-29
context: Captured as a note (`.planning/notes/2026-04-28-add-alliances-to-default-test-data.md`) during v2.6 Phase 64 manual smoke. The default seed was densified mid-Phase-64 to 5 constituencies × 8 parties × 327 candidates so the parties tab and categorical filter axes became realistically exercisable. The next gap surfaced is alliances — `@openvaa/data`'s `Alliance` entity type exists but the default template doesn't seed any, so any UI surface that depends on alliances is dev-blind.
---

# Add alliances to default test data

The default seed template (`packages/dev-seed/src/templates/default/`)
emits parties, candidates, and nominations, but does not currently
seed any alliances. `@openvaa/data` supports `ENTITY_TYPE.Alliance`
(an alliance is an organization-of-organizations — e.g., a coalition
of parties). Without seeded alliances, any UI that filters or groups
by alliance can't be exercised in dev sessions.

## What to do

- Add an `alliances-override.ts` (or equivalent) to
  `packages/dev-seed/src/templates/default/` that creates ~2-3
  alliances grouping subsets of the 8 parties into named coalitions.
- Wire `alliance_nominations` (the parent-of-organization nomination
  shape) so each constituency that has alliance-eligible parties also
  emits an alliance nomination linking the contributing party
  nominations.
- Confirm the supabase adapter's reverse-fill pass (added in v2.6
  Phase 64 Plan 01) correctly populates `organizationNominationIds`
  on alliance entities — this code path was implemented but not
  empirically exercised because no alliances existed in the seed.
- Confirm `@openvaa/matching` and `@openvaa/filters` handle alliances
  in their entity-type switches (audit; may already work but untested with seeded data).

## Acceptance

- After `yarn dev:reset-with-data`, the default voter flow shows a
  populated alliances entity tab in the results page (or the alliances
  surface, wherever it lives).
- Filter/grouping by alliance works on real seeded data.
- The supabase adapter reverse-fill of `organizationNominationIds` on
  alliance parents is empirically verified.

## Related

- v2.6 Phase 64 Plan 01: introduced supabase adapter reverse-fill for
  parent-nomination → children id arrays (`candidateNominationIds`,
  `factionNominationIds`, `organizationNominationIds`) — the alliance
  branch was implemented but not exercised due to no seeded data.
- `.planning/todos/pending/check-candidate-distribution.md` (closed
  2026-04-29) — sibling of this densification follow-up.
