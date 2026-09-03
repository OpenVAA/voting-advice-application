/**
 * NEGATIVE-CONTROL FIXTURE — class (1).
 *
 * The control is a PAIR of runs: against a tree without Pass 0 this seeds successfully with the illegal key silently dropped; against a tree with Pass 0 it exits 1 with a message naming the key, the `external_id` and the collection.
 *
 * ⚠ The two halves must differ ONLY by the tree, so this file is BYTE-FROZEN at this exact path. Editing it between the halves destroys the property that makes the pair a control rather than two unrelated runs.
 *
 * The illegal key: `_constituencies` on an `elections` row. `linkJoinTables` reads `_constituencies` on `constituency_groups` (`supabaseAdminClient.ts:446`) and, via `constResolve`, on `question_categories` / `questions` (`:556`, dispatched at `:590-591`) — never on an election. The elections block at `:393-398` reads only the constituency-GROUP keys. So the key is silently stripped by the generic `_`-prefix rule and nothing is ever written from it.
 *
 * ⚠ NO `constituency_groups` IN THIS DATASET, AND THAT IS LOAD-BEARING.
 * `attachSentinels` (`pipeline.ts:238-243`) fans a full-fanout `_constituencyGroups` onto every election only when `allGroupExtIds.length > 0`. With zero constituency groups the fanout does not happen, `election_constituency_groups` stays empty, and the drop is cleanly observable. Adding a constituency group here would write join rows and muddy the evidence.
 *
 * ⚠ THE DEFAULT EXPORT MUST NOT CARRY A TYPE ANNOTATION. The absence is load-bearing twice:
 *   1. Excess property checking is a contextual-type rule, so an unannotated literal will not turn the strict row types into a red typecheck gate on a file whose entire purpose is to carry an illegal key.
 *   2. The schema's `.strict()` operates on top-level and fragment keys only, leaving row-level keys to the runtime guard, so an unannotated fixture survives the zod layer too.
 *
 * Loaded ONLY through `yarn db:seed --template <absolute path to this file>`. Nothing in `src/` imports it and no gate executes it.
 *
 * ⚠ `external_id` VALUES BELOW ARE WRITTEN WITHOUT THE PREFIX, DELIBERATELY.
 * `externalIdPrefix` is applied to hand-authored `fixed[]` rows too, not only to generator-emitted ones — every generator does `external_id: `${externalIdPrefix}${fx.external_id}`` (e.g.
 * `ElectionsGenerator.ts`). Writing the already-prefixed id here would land in the database as `negctl144-negctl144-el-1`. (`template/types.ts:23` says "prepended to every generator-emitted external_id", which is imprecise; `templates/e2e/base.ts:15` documents the same trap from the other direction by setting the prefix to `''`.)
 *
 * Sentinel and relationship REFERENCES, by contrast, name the FINAL prefixed value, because they are resolved against rows already written to the database.
 * `externalIdPrefix` is `negctl144-`, its own, so `yarn db:seed:teardown --prefix negctl144-` and the Playwright teardown prefixes cannot collide — `tests/playwright.config.ts`'s duplicate-prefix guard is prefix-sensitive and a shared prefix is a known race.
 */

export default {
  seed: 42,
  externalIdPrefix: 'negctl144-',
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[negctl144] Election carrying an illegal _constituencies sentinel' },
        election_type: 'general',
        published: true,
        is_generated: false,
        // ↓↓↓ THE ILLEGAL KEY — no code path reads `_constituencies` on an elections row. ↓↓↓
        _constituencies: { externalId: ['negctl144-co-1'] }
      }
    ]
  },

  // Deliberately empty — see the ⚠ note above. Do not add rows here.
  constituency_groups: { count: 0 },

  constituencies: {
    count: 0,
    fixed: [
      {
        external_id: 'co-1',
        name: { en: '[negctl144] Constituency the illegal sentinel points at' },
        published: true,
        is_generated: false
      }
    ]
  },

  organizations: { count: 0 },
  alliances: { count: 0 },
  factions: { count: 0 },
  candidates: { count: 0 },
  question_categories: { count: 0 },
  questions: { count: 0 },
  nominations: { count: 0 },
  app_settings: { count: 0 },
  feedback: { count: 0 }
};
