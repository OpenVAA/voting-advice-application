/**
 * NEGATIVE-CONTROL FIXTURE — the deny-list control, CAMEL arm.
 *
 * Byte-adjacent to `negctl-nominations-entity-type.ts`: the two differ in the spelling of one key and in the row names that quote it. That file is BYTE-FROZEN, so the camel arm is a file of its own rather than a second row in it.
 *
 * ## What the snake arm cannot detect
 *
 * `negctl-nominations-entity-type.ts` writes `entity_type` — the spelling the RPC's `skip_columns` array uses, and the spelling `DENIED_BY_TABLE` declares. But `COLUMN_MAP` maps `entity_type` → `entityType` (`packages/supabase-types/src/column-map.ts`), and source (1) of the permitted-key derivation admits, for every column, EVERY camel form `FIELD_MAP` resolves onto it. So `entityType` is in the PERMITTED set of `nominations`, and a deny-list that looked up only the snake literal would let it through: `bulkImport` resolves `resolveFieldName('entityType') === 'entity_type'` and ships the key to the RPC, whose `skip_columns` discards it — exit 0, and a row that ignores what the author wrote, the failure mode `DENIED_BY_TABLE` exists to eliminate.
 *
 * ## It is exercised in CI, not only on a live database
 *
 * Like the snake fixture, this one IS imported — by `tests/assertKnownRowProps.test.ts`, which feeds its `fixed[]` rows straight to Pass 0 and asserts the deny message. A control reachable only through `yarn db:seed --template <abs path>` fires only when somebody runs a seed against a live database. The import is read-only and does not move the file's bytes; the CLI invocation below is the way to observe the exit code end to end.
 *
 * ```sh
 * yarn db:seed --template "$PWD/packages/dev-seed/tests/fixtures/negctl-nominations-entity-type-camel.ts"
 * # expected: exit 1, `Error: assertKnownRowProps: property 'entityType' … skip_columns …`
 * ```
 *
 * ⚠ THE DEFAULT EXPORT MUST NOT CARRY A TYPE ANNOTATION — see `negctl-elections-sentinel.ts` for the two reasons. (Here there is a third: `entityType` is an excess property on `NominationsFixedRow`, so an annotation would make the file a compile error and the runtime arm would never run.)
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
        name: { en: '[negctl-nomtype] Election of the entityType deny control' },
        constituency_groups: [{ external_id: 'negctl-nomtype-cg-1' }]
      }
    ]
  },

  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'cg-1',
        name: { en: '[negctl-nomtype] Constituency group of the entityType deny control' },
        constituencies: [{ external_id: 'negctl-nomtype-co-1' }]
      }
    ]
  },

  constituencies: {
    count: 0,
    fixed: [
      {
        external_id: 'co-1',
        name: { en: '[negctl-nomtype] Constituency of the entityType deny control' }
      }
    ]
  },

  organizations: {
    count: 0,
    fixed: [
      {
        external_id: 'or-1',
        name: { en: '[negctl-nomtype] Organization of the entityType deny control' }
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
        // ↓↓↓ THE DENIED KEY, IN ITS CAMEL SPELLING — the arm the snake fixture cannot reach. ↓↓↓
        entityType: 'organization'
      }
    ]
  },

  app_settings: { count: 0 },
  feedback: { count: 0 }
};
