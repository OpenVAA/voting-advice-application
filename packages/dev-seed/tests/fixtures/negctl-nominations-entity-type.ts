/**
 * NEGATIVE-CONTROL FIXTURE — the deny-list control.
 *
 * The denied key: `entity_type` on a `nominations` row. `entity_type` IS a real `nominations` column, so it survives ANY allow-list derived from `TablesInsert<'nominations'>`; an allow-list alone is structurally incapable of catching it, which is why the guard has a deny-list beside it. The column is generated from whichever entity reference the row carries, so the RPC lists the key in `skip_columns` (`apps/supabase/supabase/schema/501-bulk-operations.sql`) and discards it on this table. Without the deny-list this file seeds with exit 0 and a row whose type is the generated one, whatever the author wrote; with it, Pass 0 exits 1 and names the key, the collection and the row.
 *
 * `nominations` is the ONLY table the key is denied on. On `questions` and `question_categories` the same key is a filter list the RPC carries, so a control written on either of those tables would control for nothing.
 *
 * ⚠ This file is BYTE-FROZEN at this exact path: a control is comparable between two trees only while its bytes are the same in both.
 *
 * Loaded through `yarn db:seed --template <absolute path to this file>`, and imported by `tests/assertKnownRowProps.test.ts`, which feeds its `fixed[]` rows to Pass 0. Nothing in `src/` imports it.
 *
 * ```sh
 * yarn db:seed --template "$PWD/packages/dev-seed/tests/fixtures/negctl-nominations-entity-type.ts"
 * # expected: exit 1, `Error: assertKnownRowProps: property 'entity_type' … skip_columns …`
 * ```
 *
 * ⚠ THE DEFAULT EXPORT MUST NOT CARRY A TYPE ANNOTATION — see `negctl-elections-sentinel.ts` for the two reasons.
 *
 * ⚠ `external_id` VALUES BELOW ARE WRITTEN WITHOUT THE PREFIX, DELIBERATELY.
 * `externalIdPrefix` is applied to hand-authored `fixed[]` rows too, not only to generator-emitted ones — every generator does ``external_id: `${externalIdPrefix}${fx.external_id}` `` (e.g. `ElectionsGenerator.ts`). Writing the already-prefixed id here would land in the database as `negctl-nomtype-negctl-nomtype-el-1`.
 *
 * Relationship REFERENCES, by contrast, name the FINAL prefixed value, because they are resolved against rows already written to the database. The nomination below names its organization, its election and its constituency that way, and the election and the constituency group name their links the same way, so without the denied key this file is a dataset the writer accepts whole.
 * `externalIdPrefix` is `negctl-nomtype-`, shared by this pair and by nothing else, so `yarn db:seed:teardown --prefix negctl-nomtype-` and the Playwright teardown prefixes cannot collide.
 */

export default {
  seed: 42,
  externalIdPrefix: 'negctl-nomtype-',
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[negctl-nomtype] Election of the entity_type deny control' },
        constituency_groups: [{ external_id: 'negctl-nomtype-cg-1' }]
      }
    ]
  },

  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'cg-1',
        name: { en: '[negctl-nomtype] Constituency group of the entity_type deny control' },
        constituencies: [{ external_id: 'negctl-nomtype-co-1' }]
      }
    ]
  },

  constituencies: {
    count: 0,
    fixed: [
      {
        external_id: 'co-1',
        name: { en: '[negctl-nomtype] Constituency of the entity_type deny control' }
      }
    ]
  },

  organizations: {
    count: 0,
    fixed: [
      {
        external_id: 'or-1',
        name: { en: '[negctl-nomtype] Organization of the entity_type deny control' }
      }
    ]
  },

  alliances: { count: 0 },
  factions: { count: 0 },
  candidates: { count: 0 },
  question_categories: { count: 0 },
  questions: { count: 0 },

  nominations: {
    count: 0,
    fixed: [
      {
        external_id: 'nom-1',
        organization: { external_id: 'negctl-nomtype-or-1' },
        election: { external_id: 'negctl-nomtype-el-1' },
        constituency: { external_id: 'negctl-nomtype-co-1' },
        election_round: 1,
        // ↓↓↓ THE DENIED KEY — a real, generated column the RPC's skip_columns discards on this table. ↓↓↓
        entity_type: 'organization'
      }
    ]
  },

  app_settings: { count: 0 },
  feedback: { count: 0 }
};
