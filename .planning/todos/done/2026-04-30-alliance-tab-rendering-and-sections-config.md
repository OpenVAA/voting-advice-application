# Alliance tab rendering + Phase 67 sections-config follow-ups

**Captured:** 2026-04-30 during Phase 67 manual UI smoke
**Source:** Phase 67 (Default Seed Alliances) — Plan 67-02 voter-flow smoke
**Resolves phase:** 69 (v2.8 Alliance Card Lane A)

## Problem

Phase 67 added 'alliance' to `app_settings.results.sections` so the voter results page renders an Alliances tab. The data flows through correctly (2 alliance entities + 10 alliance_nominations + 30 of 40 org-noms wired with `parent_nomination`), and the supabase adapter reverse-fill returns non-empty `organizationNominationIds` on Alliance parents (SC-3 satisfied).

However, in the running voter app:

1. **The Alliances tab "does nothing"** when clicked. The tab is visible in the entity-tabs strip (per the new sections config), but selecting it produces no card content. This is consistent with `cardContents.alliance: []` (the empty array we set as a Phase 67 default), which means the alliance card has no contents configured — but downstream renderers (EntityCard, EntityList) appear to bail rather than render a "name + member orgs" minimum view.

2. **User preference (captured during smoke):** Alliances should NOT be listed among the entity types in `results.sections` until the alliance card has a working render path. The current "tab visible, click does nothing" is worse than not having the tab at all from a UX perspective.

## Scope (deferred — pick whichever lane fits)

### Lane A — Make the alliance card render correctly

- Decide what an Alliance card SHOULD show (member organizations? member-org candidates? no submatches because alliance has no own answers?).
- Likely additions to `cardContents.alliance` union: `'organizations'` (mirror of `'candidates'` for orgs) — show the member orgs as a sub-list.
- Wire EntityCard's "subentities" branch (currently `EntityCard.svelte:131-142`) to also handle `OBJECT_TYPE.AllianceNomination` → list its `organizationNominations`. Today the branch is hard-coded to `OrganizationNomination → CandidateNomination`.
- Drives an additional matching/filters review for Alliance entity-type behavior in the cards layer (not the matching algorithm itself — that's verified working per Phase 67 SC-4).

### Lane B — Drop alliance from default sections config

- Revert the 'alliance' addition to `packages/dev-seed/src/templates/default.ts` `app_settings.settings.results.sections`. Alliance entities and nominations remain seeded (Phase 67 SC-3 still satisfied — the reverse-fill is exercised regardless of whether the UI tab renders), but the tab disappears from the voter UI.
- Trade-off: SC-2 (populated Alliances surface visible in voter results) becomes false. Phase 67's success criteria need to be reconciled against this lane.

### Lane C — Conditional render guard

- Keep alliance in sections, but have the entity-tabs UI hide the tab when `cardContents.alliance` is empty AND there are no contributing alliance entities for the current selection.
- Bridges A and B without committing to a full alliance-card design.

## Recommendation

Lane A is the proper fix and aligns with v2.7 SEED-01 SC-2's intent. Lane B is a quick rollback if v2.7 closes before alliance UX is designed. Lane C is a temporary hack.

Capture `cardContents.alliance` shape decisions before designing the card render path — likely a small UI-spec exercise.

## Related

- Phase 67 Plan 67-01 (where the seed + type changes landed)
- Phase 67 Plan 67-02 (where this surfaced during manual UI smoke)
- `packages/data/src/objects/nominations/variants/allianceNomination.ts` (alliance constructor — fixed in Phase 67 to accept reverse-fill path)
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:131-142` (sub-entity rendering — currently org→candidates only)
- `packages/app-shared/src/settings/dynamicSettings.type.ts:cardContents` (Alliance cardContents type — new in Phase 67)
