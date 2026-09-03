/**
 * NEGATIVE-CONTROL FIXTURE — the deny-list control, CAMEL arm.
 *
 * A new file rather than an edit to `negctl-questions-entity-type.ts`, on purpose: that file is BYTE-FROZEN, because its two control halves must differ ONLY by the tree and rewriting its bytes would retroactively invalidate both. This file carries the arm that pair cannot reach.
 *
 * ## What the snake arm could not detect
 *
 * `negctl-questions-entity-type.ts` writes `entity_type` — the spelling the RPC's `skip_columns` array uses, and the spelling `DENIED_BY_TABLE` declares. But `COLUMN_MAP` maps `entity_type` → `entityType` (`packages/supabase-types/src/column-map.ts`), and source (1) of the permitted-key derivation admits, for every column, EVERY camel form `FIELD_MAP` resolves onto it. So `entityType` sat in the PERMITTED set while the deny-list — a plain lookup of a snake literal — never saw it. Measured on the shipped guard: `questions.entity_type` threw; `questions.entityType` passed. `bulkImport` then ran `resolveFieldName('entityType') === 'entity_type'` and shipped the key to the RPC, whose `skip_columns` discarded it: exit 0, and a row missing exactly what the author asked for — verbatim the failure mode `DENIED_BY_TABLE` exists to eliminate.
 *
 * The control was therefore STRUCTURALLY unable to detect the hole in the layer it exists to exercise. This file closes that: it is byte-adjacent to the snake fixture and differs from it in exactly one key's spelling.
 *
 * ## It is exercised in CI, not only on a live database
 *
 * ⚠ Unlike the other three fixtures, this one IS imported — by `tests/assertKnownRowProps.test.ts`, which feeds its `fixed[]` rows straight to Pass 0 and asserts the deny message. A control reachable only through `yarn db:seed --template <abs path>` fires only when somebody runs a seed against a live database, which is the "guard that cannot fire" shape these controls exist to rule out. The import is read-only and does not move the file's bytes; the CLI invocation below still works and is still the way to observe the exit code end to end.
 *
 * ```sh
 * yarn db:seed --template "$PWD/packages/dev-seed/tests/fixtures/negctl-questions-entity-type-camel.ts"
 * # expected: exit 1, `Error: assertKnownRowProps: property 'entityType' … skip_columns …`
 * yarn db:seed:teardown --prefix negctl144-
 * ```
 *
 * ⚠ THE DEFAULT EXPORT MUST NOT CARRY A TYPE ANNOTATION — see `negctl-elections-sentinel.ts` for the two reasons. (Here there is a third: `entityType` is an excess property on `QuestionsFixedRow`, so an annotation would make the file a compile error and the runtime arm would never run.)
 *
 * ⚠ `external_id` VALUES BELOW ARE WRITTEN WITHOUT THE PREFIX, DELIBERATELY — every generator does ``external_id: `${externalIdPrefix}${fx.external_id}` ``, so writing `negctl144-qu-1` here would land as `negctl144-negctl144-qu-1`. Sentinel and relationship REFERENCES name the FINAL prefixed value, because they resolve against rows already written.
 */

export default {
  seed: 42,
  externalIdPrefix: 'negctl144-',
  generateTranslationsForAllLocales: false,

  elections: { count: 0 },
  constituency_groups: { count: 0 },
  constituencies: { count: 0 },
  organizations: { count: 0 },
  alliances: { count: 0 },
  factions: { count: 0 },
  candidates: { count: 0 },

  question_categories: {
    count: 0,
    fixed: [
      {
        external_id: 'qc-1',
        name: { en: '[negctl144] Category for the entityType deny control' },
        category_type: 'opinion',
        published: true,
        is_generated: false
      }
    ]
  },

  questions: {
    count: 0,
    fixed: [
      {
        external_id: 'qu-1',
        // `text` is deliberate, for the same reason as the snake fixture: the three choice types are rejected by `103-questions.sql` unless they carry a `choices` array, and a choices array is irrelevant noise for what this fixture controls for.
        type: 'text',
        name: { en: '[negctl144] Question carrying a denied entityType key' },
        category: { external_id: 'negctl144-qc-1' },
        published: true,
        is_generated: false,
        // ↓↓↓ THE DENIED KEY, IN ITS CAMEL SPELLING — the arm the snake fixture cannot reach. ↓↓↓
        entityType: 'candidate'
      }
    ]
  },

  nominations: { count: 0 },
  app_settings: { count: 0 },
  feedback: { count: 0 }
};
