/**
 * NEGATIVE-CONTROL FIXTURE — the deny-list control.
 *
 * The control is a PAIR of runs: against a tree without the deny-list this seeds successfully with the column left null; against a tree with it, the run exits 1 with the deny message.
 *
 * ⚠ The two halves must differ ONLY by the tree, so this file is BYTE-FROZEN at this exact path.
 *
 * The denied key: `entity_type` on a `questions` row. This one is different in kind from the other two fixtures, and that difference is exactly why the guard needs a deny-list beside the allow-list: `entity_type` IS a real `questions` column, so it survives ANY allow-list derived from `TablesInsert<'questions'>`. It is nonetheless discarded by the RPC, which lists it in `skip_columns` alongside `id` / `created_at` / `updated_at` / `project_id` (`apps/supabase/supabase/schema/501-bulk-operations.sql:109-111`). An allow-list alone is therefore structurally incapable of catching it — hence the deny-list.
 *
 * ⚠ THE DEFAULT EXPORT MUST NOT CARRY A TYPE ANNOTATION — see `negctl-elections-sentinel.ts` for the two reasons.
 *
 * Loaded ONLY through `yarn db:seed --template <absolute path to this file>`. Nothing in `src/` imports it and no gate executes it.
 *
 * ⚠ `external_id` VALUES BELOW ARE WRITTEN WITHOUT THE PREFIX, DELIBERATELY.
 * `externalIdPrefix` is applied to hand-authored `fixed[]` rows too, not only to generator-emitted ones — every generator does `external_id: `${externalIdPrefix}${fx.external_id}`` (e.g.
 * `ElectionsGenerator.ts`). Writing the already-prefixed id here would land in the database as `negctl144-negctl144-el-1`. (`template/types.ts:23` says "prepended to every generator-emitted external_id", which is imprecise; `templates/e2e/base.ts:15` documents the same trap from the other direction by setting the prefix to `''`.)
 *
 * Sentinel and relationship REFERENCES, by contrast, name the FINAL prefixed value, because they are resolved against rows already written to the database.
 * `externalIdPrefix` is `negctl144-`, its own, so `yarn db:seed:teardown --prefix negctl144-` and the Playwright teardown prefixes cannot collide.
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
        name: { en: '[negctl144] Category for the entity_type deny control' },
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
        // `text` is deliberate: the three choice types are rejected by `103-questions.sql` unless they carry a `choices` array, and a choices array is irrelevant noise for what this fixture is controlling for.
        type: 'text',
        name: { en: '[negctl144] Question carrying a denied entity_type key' },
        category: { external_id: 'negctl144-qc-1' },
        published: true,
        is_generated: false,
        // ↓↓↓ THE DENIED KEY — a real column the RPC's skip_columns discards. ↓↓↓
        entity_type: 'candidate'
      }
    ]
  },

  nominations: { count: 0 },
  app_settings: { count: 0 },
  feedback: { count: 0 }
};
