/**
 * NEGATIVE-CONTROL FIXTURE — class (2).
 *
 * The control is a PAIR of runs: against a tree without Pass 0 this seeds successfully with the illegal key silently dropped; against a tree with Pass 0 it exits 1 with the three-part message.
 *
 * ⚠ The two halves must differ ONLY by the tree, so this file is BYTE-FROZEN at this exact path.
 *
 * The illegal key: `answersByExternalId` on a `questions` row. The key is real and supported — but only on `candidates` and `organizations`, the two tables `importAnswers` reads (`supabaseAdminClient.ts:246-257`). On a `questions` row it is stripped globally by `NON_COLUMN_FIELDS` (`:140`) and nothing is ever written from it. That is the whole point: this is not a typo a spell-checker would catch, it is a plausible key on the wrong table.
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
        name: { en: '[negctl144] Category for the answersByExternalId control' },
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
        name: { en: '[negctl144] Question carrying an illegal answersByExternalId key' },
        category: { external_id: 'negctl144-qc-1' },
        published: true,
        is_generated: false,
        // ↓↓↓ THE ILLEGAL KEY — importAnswers reads only candidates and organizations. ↓↓↓
        answersByExternalId: {
          'negctl144-cand-does-not-exist': { value: 3 }
        }
      }
    ]
  },

  nominations: { count: 0 },
  app_settings: { count: 0 },
  feedback: { count: 0 }
};
