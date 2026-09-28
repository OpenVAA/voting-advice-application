# Phase 67: Default Seed Alliances - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 67-default-seed-alliances
**Areas discussed:** Alliance grouping, Per-constituency variation, Validation surface, Naming + locales

---

## Alliance Grouping

| Option | Description | Selected |
|--------|-------------|----------|
| Hand-authored ideological blocs | 3 alliances: Left = {SDU, RF, GW}, Right = {BC, VC, RA}, Centrist = {PM, CP}. Hand-edits in alliances-override.ts. | (modified) |
| Hand-authored — just 2 blocs | 2 alliances only (e.g., Progressive vs Conservative). Simpler; thinner exercise of the alliances surface. | |
| Programmatic via latent-factor positions | Cluster parties by their generated centroid positions in @openvaa/dev-seed's latent space. | |
| You decide — just emit sensible 2-3 alliances | Claude picks groupings that make UI demos look reasonable. | |
| **Other (free text):** "Let's use scheme 1 but drop Centrist so that some parties belong to no alliance." | 2 alliances: Left = {SDU, RF, GW}, Right = {BC, VC, RA}; PM and CP standalone (no alliance). | ✓ |

**User's choice:** Hand-authored 2 alliances (modified scheme 1)
**Notes:** Scheme 1 with the Centrist alliance dropped — exercises the "party with no alliance" UI path via PM + CP standalone.

---

## Per-Constituency Variation

| Option | Description | Selected |
|--------|-------------|----------|
| Same alliances in every constituency | Each alliance gets an alliance_nomination in every constituency. ~15 alliance noms total (3 × 5). Maximum reverse-fill exercise. | ✓ |
| Alliances only in some constituencies | E.g., Left bloc only in 3 of 5 constituencies. More realistic; smaller alliance count; uneven exercise. | |
| One constituency without alliances | Mix: 4 with full alliances, 1 with none — verify empty-alliance-tab fallback. | |

**User's choice:** Same alliances in every constituency (Recommended)
**Notes:** With 2 alliances × 5 constituencies = 10 alliance noms (revised count after dropping Centrist).

---

## Validation Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Manual UI smoke + adapter sanity check | yarn dev:reset-with-data, verify alliances tab populated + filtering works in voter app. Adapter sanity: log/inspect organizationNominationIds on Alliance parents during seed. | ✓ |
| Manual UI + new unit tests in matching/filters | Plus add unit tests in @openvaa/matching + @openvaa/filters asserting Alliance entities don't break category iteration / filter type switches. | |
| Manual UI only | Visual verification only. | |

**User's choice:** Manual UI smoke + adapter sanity check (Recommended)
**Notes:** No new unit tests in matching/filters — abstract entity-type tests already cover the surface.

---

## Naming + Locales

| Option | Description | Selected |
|--------|-------------|----------|
| Invented neutral names + 4-locale | Names like 'Progressive Front', 'Conservative Bloc', 'Centrist Coalition' — invented per D-58-01. generateTranslationsForAllLocales: true. | ✓ |
| Invented names + EN-only | Single locale; smaller seed footprint but inconsistent with rest of default template's 4-locale shape. | |
| Real-world Finnish coalition names | E.g., 'Punavihreä yhteistyö'. Realistic but breaks D-58-01. | |

**User's choice:** Invented neutral names + 4-locale (Recommended)
**Notes:** Names follow D-58-01 (no real party names, no encoded political positions). 4-locale auto-generation via existing template setting.

---

## Claude's Discretion

- Exact alliance names + short names + colors (planner picks)
- Exact shape of `alliances-override.ts` (mirror nominations-override.ts)
- How to wire the override into `defaultOverrides`
- Whether to seed factions too (NO — alliances are the in-scope surface)
- Adapter sanity check implementation form (script vs console.log vs SQL query)

## Deferred Ideas

- Programmatic alliance grouping via latent-factor clusters (explicit reject)
- Per-constituency alliance variation (explicit reject)
- Adding alliances to the `e2e` template (out of v2.7 scope)
- New unit tests in @openvaa/matching / @openvaa/filters for Alliance handling (explicit reject)
- Faction seeding (explicit reject)
- Alliance latent-factor positions (not applicable to entity-grouping shapes)
- Multi-alliance party membership (schema change; out of scope)
