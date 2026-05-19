# Phase 67: Default Seed Alliances - Pattern Map

**Mapped:** 2026-04-30
**Files analyzed:** 4 (1 NEW + 3 MODIFY)
**Analogs found:** 4 / 4 (all strong matches in-tree)

## File Classification

| File | Mode | Role | Data Flow | Closest Analog | Match Quality |
|------|------|------|-----------|----------------|---------------|
| `packages/dev-seed/src/templates/defaults/alliances-override.ts` | NEW | dev-seed override (entity + nomination authoring) | batch / transform | `packages/dev-seed/src/templates/defaults/nominations-override.ts` (primary), `packages/dev-seed/src/templates/defaults/candidates-override.ts` (secondary), `packages/dev-seed/src/generators/AlliancesGenerator.ts` (entity-row shape) | exact (override signature) + role-match (entity emission) |
| `packages/dev-seed/src/templates/defaults/nominations-override.ts` | MODIFY | dev-seed override (parent_nomination wiring) | batch / transform | self (extends own org-nom emission loop, lines 157-169) | self-extension |
| `packages/dev-seed/src/templates/default.ts` | MODIFY | template config (defaultOverrides + app_settings) | declarative config | self (lines 86-154 organizations.fixed[] for entity shape; lines 227-240 app_settings.fixed[0].settings for sections wiring; lines 248-252 defaultOverrides for override registration) | self-extension |
| `packages/app-shared/src/settings/dynamicSettings.type.ts` | MODIFY | TS type widening (1 line) | type definition | self (line 222 `sections` union) | self-extension |

**TOPO_ORDER position confirmation** (`pipeline.ts:76-91`): `alliances` runs at index 6 (after `organizations`, before `factions`). `nominations` runs at index 11 — alliance entity rows are guaranteed to land BEFORE alliance/org nomination rows. This means `ctx.refs.alliances` will be populated by the time `nominations-override.ts` runs (relevant for the parent_nomination wiring matrix lookup).

## Pattern Assignments

---

### `packages/dev-seed/src/templates/defaults/alliances-override.ts` (NEW)

**Role:** dev-seed override emitting (a) 2 Alliance entity rows into the `alliances` table AND (b) 10 AllianceNomination rows into the `nominations` table (polymorphic alliance_id branch).

**Primary analog:** `packages/dev-seed/src/templates/defaults/nominations-override.ts`
**Secondary analog:** `packages/dev-seed/src/templates/defaults/candidates-override.ts`
**Entity-row shape analog:** `packages/dev-seed/src/generators/AlliancesGenerator.ts` lines 32-49

#### Pattern 1: Override file header + imports + signature

**Source:** `nominations-override.ts:1-93`

Mirror this exact import + type-alias + function-signature pattern:

```typescript
// Lines 39-42 (imports — minimal: TablesInsert + Ctx)
import { PARTY_WEIGHTS } from './candidates-override';   // OPTIONAL: only if planner needs party-count guard
import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../../types';

// Lines 43-60 (row-shape type aliases — pattern: extend TablesInsert<'X'> + polymorphic refs)
type CandidateRef = { candidate: { external_id: string } };
type OrganizationRef = { organization: { external_id: string } };
type ParentRef = { parent_nomination: { external_id: string } };

type CandidateNominationRow = Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id'> &
  CandidateRef &
  ParentRef & {
    election: { external_id: string };
    constituency: { external_id: string };
  };

// Lines 93-110 (function signature + ctx destructure + ref-empty guard)
export function nominationsOverride(_fragment: unknown, ctx: Ctx): Array<Record<string, unknown>> {
  const { projectId, externalIdPrefix, refs } = ctx;
  const candidates = refs.candidates;
  const constituencies = refs.constituencies;
  // ...
  if (constituencies.length === 0 || elections.length === 0 || organizations.length === 0) {
    throw new Error('[dev-seed] alliancesOverride: ctx.refs is empty for ...');
  }
  // ...
  return rows as unknown as Array<Record<string, unknown>>;
}
```

**Apply for `alliances-override.ts`:**
- Function name: `alliancesOverride` (kebab in filename, camelCase in export — mirrors all 3 existing override files)
- Signature: `(fragment: unknown, ctx: Ctx) => Array<Record<string, unknown>>` (matches `Overrides` type at `types.ts:46-48`)
- Defensive ref guard: throw if `refs.organizations`, `refs.constituencies`, or `refs.elections` are empty (NOT `refs.alliances` — that's empty until this override completes)
- Final `return rows as unknown as Array<Record<string, unknown>>;` cast (line 202)

#### Pattern 2: Entity row shape (alliances table)

**Source:** `default.ts:86-154` (8-party `organizations.fixed[]` block) + `AlliancesGenerator.ts:32-49`

The `alliances` table Insert shape (`supabase-types/database.ts:70-86`) is structurally identical to `organizations`: `{ external_id, project_id, name, short_name, color, image, info, is_generated, sort_order, subtype, custom_data }`. **Mirror the 8-party block shape verbatim** for the 2 alliance entity rows:

```typescript
// Source: default.ts:88-96 (the canonical organization-entity literal — copy this shape)
{
  external_id: 'party_blue',           // → 'alliance_L' / 'alliance_R' (NO 'seed_' prefix; already in externalIdPrefix)
  name: { en: 'Blue Coalition' },      // → { en: 'Progressive Front' } / { en: 'Conservative Bloc' }
  short_name: { en: 'BC' },            // → { en: 'PF' } / { en: 'CB' }
  color: { normal: '#2546a8', dark: '#6b8dd6' },  // → planner picks neutral hues
  sort_order: 0,                       // → 0 / 1
  is_generated: false                  // CRITICAL: false (hand-authored, NOT synthetic)
}
```

**For overrides emitting entity rows, the `external_id` MUST be prefixed with `externalIdPrefix` at emission time** (the override loop runs OUTSIDE the per-table generator's `${externalIdPrefix}${fx.external_id}` prefixing logic at `AlliancesGenerator.ts:35`). Two options:

1. **Manual prefix** (matches `nominations-override.ts:147` style):
   ```typescript
   const allianceExtId = (key: 'L' | 'R'): string => `${externalIdPrefix}alliance_${key}`;
   rows.push({ external_id: allianceExtId('L'), project_id: projectId, name: { en: 'Progressive Front' }, ... });
   ```
2. **`fixed[]` block in `default.ts`** (matches `organizations.fixed[]` style — generator auto-prefixes): then alliance ENTITIES live in `default.ts` and only ALLIANCE NOMINATIONS live in `alliances-override.ts`. RESEARCH §"Alternatives Considered" identifies this as a viable split. Planner picks; the override-only path is more cohesive per CONTEXT D-05 framing.

#### Pattern 3: AllianceNomination row shape (nominations table, polymorphic alliance_id branch)

**Source:** `nominations-override.ts:54-58` (OrganizationNominationRow type) + lines 157-168 (org-nom emission loop) + `database.ts:618` confirms `nominations.alliance_id` column exists

Mirror the OrganizationNominationRow shape, swapping `organization` → `alliance` and dropping `parent_nomination` (alliance noms have NO parent per `011-validation-functions.sql:265`):

```typescript
// Authoring shape — adapted from nominations-override.ts:54-58
type AllianceNominationRow = Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id' | 'alliance_id'> & {
  alliance: { external_id: string };       // polymorphic ref — bulk_import resolves to alliance_id UUID
  election: { external_id: string };
  constituency: { external_id: string };
};

// Emission loop — adapted from nominations-override.ts:157-169 (org-nom emission)
//   2 alliances × 5 constituencies = 10 alliance noms
const allianceKeys = ['L', 'R'] as const;
for (const key of allianceKeys) {
  for (let c = 0; c < constituencies.length; c++) {
    rows.push({
      external_id: `${externalIdPrefix}nom_alliance_${key}_${constituencies[c].external_id}`,  // ← constituency-specific (P67 Pitfall 3)
      project_id: projectId,
      alliance: { external_id: `${externalIdPrefix}alliance_${key}` },
      election: { external_id: electionExtId },
      constituency: { external_id: constituencies[c].external_id },
      election_round: 1
      // NO parent_nomination — alliance noms have no parent
    });
  }
}
```

**External-id naming convention** (constituency-specific suffix is mandatory per RESEARCH Pitfall 3):
- Alliance entities: `seed_alliance_L`, `seed_alliance_R`
- Alliance nominations: `seed_nom_alliance_L_c_01` ... `seed_nom_alliance_L_c_05`, `seed_nom_alliance_R_c_01` ... `seed_nom_alliance_R_c_05`

This matches `nominations-override.ts:147`'s pattern exactly: `${externalIdPrefix}nom_org_${organizations[orgIdx].external_id}_${constituencies[constIdx].external_id}`.

#### Pattern 4: ALLIANCE_MEMBERSHIP_MATRIX (mirrors PARTY_CONSTITUENCY_MATRIX usage)

**Source:** `nominations-override.ts:82-91` (PARTY_CONSTITUENCY_MATRIX as the canonical "wiring matrix as exported const" pattern)

Per RESEARCH §"Pattern 1: Override file shape", the alliance→party membership map should be exported so `nominations-override.ts` can import it for the parent_nomination wiring (Pattern 5 below):

```typescript
// Mirrors nominations-override.ts:82-91's "exported readonly matrix" idiom
export const ALLIANCE_MEMBERSHIP: Record<string, ReadonlyArray<string>> = {
  alliance_L: ['party_social', 'party_red', 'party_green'],   // SDU, RF, GW (D-01)
  alliance_R: ['party_blue', 'party_values', 'party_rural']   // BC, VC, RA (D-01)
} as const;
// Standalone parties (no alliance): party_people (PM), party_coast (CP)
```

Helper (consumed by nominations-override.ts):
```typescript
export function findAllianceForParty(partyExtId: string): 'L' | 'R' | undefined {
  for (const [allianceKey, members] of Object.entries(ALLIANCE_MEMBERSHIP)) {
    if (members.includes(partyExtId)) return allianceKey.replace('alliance_', '') as 'L' | 'R';
  }
  return undefined;
}
```

---

### `packages/dev-seed/src/templates/defaults/nominations-override.ts` (MODIFY)

**Role:** Extend the org-nom emission loop (lines 157-169) to set `parent_nomination` on the 30 of 40 org-noms whose party belongs to an alliance (6 of 8 parties × 5 constituencies = 30; PM + CP get no parent).

**Self-analog:** lines 176-194 (candidate→org parent_nomination wiring is the existing precedent — same pattern, applied at a different layer of the hierarchy).

#### Pattern: Conditional spread for parent_nomination

**Source:** `nominations-override.ts:176-194` (candidate-nom emission with required `parent_nomination`) — adapt to org-nom emission with OPTIONAL `parent_nomination`.

**Existing block to extend** (`nominations-override.ts:157-169`):

```typescript
// CURRENT (lines 157-169) — emits org-nom WITHOUT parent_nomination
for (let p = 0; p < PARTY_CONSTITUENCY_MATRIX.length; p++) {
  for (let c = 0; c < PARTY_CONSTITUENCY_MATRIX[p].length; c++) {
    if (PARTY_CONSTITUENCY_MATRIX[p][c] === 0) continue;
    rows.push({
      external_id: orgNomExtId(p, c),
      project_id: projectId,
      organization: { external_id: organizations[p].external_id },
      election: { external_id: electionExtId },
      constituency: { external_id: constituencies[c].external_id },
      election_round: 1
    });
  }
}
```

**Extension shape** (mirroring the conditional-spread idiom from RESEARCH §Pattern 3):

```typescript
// PROPOSED — wire parent_nomination if party belongs to an alliance
import { findAllianceForParty } from './alliances-override';

// inside the loop:
const partyExtId = organizations[p].external_id;
const allianceKey = findAllianceForParty(partyExtId);  // 'L' | 'R' | undefined
const constituencyExtId = constituencies[c].external_id;
rows.push({
  external_id: orgNomExtId(p, c),
  project_id: projectId,
  organization: { external_id: partyExtId },
  election: { external_id: electionExtId },
  constituency: { external_id: constituencyExtId },
  election_round: 1,
  ...(allianceKey
    ? { parent_nomination: { external_id: `${externalIdPrefix}nom_alliance_${allianceKey}_${constituencyExtId}` } }
    : {})
});
```

**Type-alias update at lines 54-58:** `OrganizationNominationRow` currently has no `ParentRef`. The MODIFY should make it include an OPTIONAL `parent_nomination`:

```typescript
// CURRENT (lines 54-58)
type OrganizationNominationRow = Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id'> &
  OrganizationRef & {
    election: { external_id: string };
    constituency: { external_id: string };
  };

// PROPOSED
type OrganizationNominationRow = Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id'> &
  OrganizationRef &
  Partial<ParentRef> & {                    // ← Partial<ParentRef> — optional alliance parent
    election: { external_id: string };
    constituency: { external_id: string };
  };
```

**Header comment update**: Add Phase 67 note at top of file (lines 35-37 already note "Phase 64 manual-smoke densification + parent_nomination wiring") — extend with "Phase 67: extends parent_nomination to wire org-noms whose party belongs to an alliance up to alliance noms."

---

### `packages/dev-seed/src/templates/default.ts` (MODIFY)

**Role:** (a) Wire `alliancesOverride` into `defaultOverrides`; (b) add `'alliance'` to `app_settings.settings.results.sections`.

**Self-analog:** lines 248-252 (existing `defaultOverrides` shape) + lines 227-240 (existing `app_settings.fixed[0].settings` block).

#### Pattern A: Override registration

**Source:** `default.ts:248-252`

```typescript
// CURRENT
export const defaultOverrides: Overrides = {
  candidates: candidatesOverride,
  nominations: nominationsOverride,
  questions: questionsOverride
};

// PROPOSED — add alliances key
import { alliancesOverride } from './defaults/alliances-override';   // ← add at top of file (mirror lines 29-31)

export const defaultOverrides: Overrides = {
  alliances: alliancesOverride,           // ← NEW
  candidates: candidatesOverride,
  nominations: nominationsOverride,
  questions: questionsOverride
};
```

The `Overrides` type at `types.ts:46-48` is permissive (`{ [table: string]: ... }`) — **no type extension is needed** to add an `alliances` key.

#### Pattern B: app_settings.settings.results.sections

**Source:** `default.ts:227-240` (app_settings block) + `dynamicSettings.ts:59-67` (default `results` block defines `sections: ['candidate', 'organization']`)

```typescript
// CURRENT (lines 227-240) — settings block does NOT yet override results.sections
app_settings: {
  count: 0,
  fixed: [
    {
      external_id: 'appsettings_default',
      settings: {
        entities: {
          showAllNominations: true,
          hideIfMissingAnswers: { candidate: true }
        }
      }
    }
  ]
}

// PROPOSED — add results.sections override (P67 Pitfall 1: tab won't appear without this)
app_settings: {
  count: 0,
  fixed: [
    {
      external_id: 'appsettings_default',
      settings: {
        entities: {
          showAllNominations: true,
          hideIfMissingAnswers: { candidate: true }
        },
        results: {
          sections: ['candidate', 'organization', 'alliance']    // ← NEW
        }
      }
    }
  ]
}
```

**Writer behavior** (per the existing comment at lines 220-227): `app_settings` is routed through `updateAppSettings` → `merge_jsonb_column` RPC, which **deep-merges** into `seed.sql`'s bootstrap `dynamicSettings.ts` row. Adding only `{ results: { sections: [...] } }` will MERGE into the existing default `results: { cardContents: {...}, showFeedbackPopup: 180, showSurveyPopup: 500, sections: [...] }` block — but PostgreSQL's `jsonb` merge replaces the entire `sections` array (it's a leaf), and **leaves the other `results` keys (`cardContents`, `showFeedbackPopup`, `showSurveyPopup`) intact**. Verify this empirically during Plan 67-02 UI smoke.

---

### `packages/app-shared/src/settings/dynamicSettings.type.ts` (MODIFY)

**Role:** Widen the `results.sections` array union to include `Alliance` (RESEARCH Pitfall 1 — the type currently REJECTS `'alliance'` as a literal value).

**Self-analog:** line 222 (the union to widen).

#### Pattern: Type-union widening

**Source:** `dynamicSettings.type.ts:1-2` (imports already include `ENTITY_TYPE` and `EntityType`)

```typescript
// CURRENT (line 222)
sections: Array<typeof ENTITY_TYPE.Candidate | typeof ENTITY_TYPE.Organization>;

// PROPOSED — add Alliance to the union (D-04 + RESEARCH §"Anti-Patterns" preferred form)
sections: Array<typeof ENTITY_TYPE.Candidate | typeof ENTITY_TYPE.Organization | typeof ENTITY_TYPE.Alliance>;
```

**Anti-pattern warning** (from RESEARCH lines 318): Do NOT use `Array<EntityType>` (the broad enum union) — that opens Faction too. Stay with the narrow `Candidate | Organization | Alliance` union; Faction widening is a separate phase.

**Import already in place** (line 2): `import type { ENTITY_TYPE, EntityType } from '@openvaa/data';` — `ENTITY_TYPE.Alliance` is already exported. No new imports needed.

---

## Shared Patterns

### Pattern S1: Override-loop shape (apply to alliances-override.ts)

**Source:** `nominations-override.ts:93-203` (the entire body)

The canonical override loop:
1. Destructure `{ projectId, externalIdPrefix, refs }` from `ctx`
2. Pull the relevant ref arrays (`refs.organizations`, `refs.constituencies`, `refs.elections`)
3. Defensive guards: throw `[dev-seed] xxxOverride: ctx.refs is empty for Y / Z. ...` if any required ref is empty
4. Build a row-id helper function: `const xxxNomExtId = (i: number, j: number): string => \`${externalIdPrefix}nom_xxx_${...}\``
5. Initialize `const rows: Array<XxxRow> = [];`
6. Push entity rows first, then dependent nomination rows (parents-before-children, even though `bulk_import` resolves out of order — keeps the emission self-documenting)
7. Final cast: `return rows as unknown as Array<Record<string, unknown>>;`

### Pattern S2: External-ID prefix discipline (apply to all 4 files)

**Source:** `default.ts:37` (`externalIdPrefix: 'seed_'` is the global default) + `nominations-override.ts:147` (overrides receive `externalIdPrefix` via `ctx` and prepend it manually).

- `defaultTemplate.fixed[]` blocks omit the prefix (the per-table generator at `AlliancesGenerator.ts:35` adds it: `external_id: \`${externalIdPrefix}${fx.external_id}\``)
- Override-emitted rows MUST manually prepend `externalIdPrefix` to every `external_id` (overrides bypass the generator's prefixing)
- All cross-table `external_id` REFERENCES (`alliance: { external_id }`, `parent_nomination: { external_id }`) MUST also include the prefix — the bulk_import RPC resolves the literal value as-is

### Pattern S3: Locale fan-out (apply to alliances-override.ts entity rows)

**Source:** `default.ts:38` (`generateTranslationsForAllLocales: true`) + RESEARCH §"Don't Hand-Roll" row 2

- Author `name: { en: 'Progressive Front' }` and `short_name: { en: 'PF' }` only
- `fanOutLocales` (locales.ts:182) auto-mirrors EN to fi/sv/da at write time — produces 4 locales for free
- Do NOT use faker for hand-authored alliance names (the `AlliancesGenerator.ts:45` synthetic path uses faker; that path is bypassed by the override)

### Pattern S4: `is_generated: false` on hand-authored rows

**Source:** `default.ts:88-152` (every fixed[] entity uses `is_generated: false`)

- Hand-authored entity rows (alliances, organizations) → `is_generated: false`
- Synthetic rows (candidates from CandidatesGenerator) → `is_generated: true` (`candidates-override.ts:149`)
- Alliance nominations are NOT given `is_generated` in `nominations-override.ts:160-168` — the field is omitted (defaults to `null` per `database.ts:60`); follow this same pattern for alliance noms

---

## No Analog Found

None — every Phase 67 file extends an in-tree pattern with high fidelity:
- `alliances-override.ts` mirrors `nominations-override.ts` (proven primary analog) + entity-row shape from `default.ts:86-154`
- `nominations-override.ts` MODIFY extends its own existing org-nom emission loop
- `default.ts` MODIFY extends its own existing `defaultOverrides` + `app_settings.fixed[]` blocks
- `dynamicSettings.type.ts` MODIFY widens an existing 1-line union

The **only novel surface** is the `alliance: { external_id }` polymorphic ref in the nomination row — but this is structurally identical to the existing `candidate: { external_id }` and `organization: { external_id }` polymorphic refs at `nominations-override.ts:185, 163`. The shape transfers verbatim.

---

## Metadata

**Analog search scope:**
- `packages/dev-seed/src/templates/defaults/` (3 sibling override files)
- `packages/dev-seed/src/templates/default.ts` (template-config patterns)
- `packages/dev-seed/src/generators/AlliancesGenerator.ts` (entity-row shape contract)
- `packages/dev-seed/src/types.ts` (Overrides type permissiveness)
- `packages/dev-seed/src/pipeline.ts` (TOPO_ORDER position confirmation)
- `packages/supabase-types/src/database.ts` lines 52-113 (alliances Insert shape) + 618-704 (nominations.alliance_id FK)
- `packages/app-shared/src/settings/dynamicSettings.ts` lines 55-83 (default results block)
- `packages/app-shared/src/settings/dynamicSettings.type.ts` (sections union)

**Files scanned:** 8 source files + 2 phase-context docs (CONTEXT.md, RESEARCH.md)

**Pattern extraction date:** 2026-04-30

**Critical line-number references for executor:**
- `nominations-override.ts:54-58` — type-alias to clone for AllianceNominationRow + extend OrganizationNominationRow with `Partial<ParentRef>`
- `nominations-override.ts:93-110` — function-signature + ref-empty guard pattern
- `nominations-override.ts:144-147` — `const xxxNomExtId` helper convention
- `nominations-override.ts:157-169` — exact org-nom emission block to extend with conditional `parent_nomination` spread
- `default.ts:86-154` — exact entity-row literal shape to clone for alliance entities
- `default.ts:227-240` — exact app_settings.settings shape to extend with `results.sections`
- `default.ts:248-252` — exact `defaultOverrides` shape to extend with `alliances` key
- `dynamicSettings.type.ts:222` — single-line union to widen
