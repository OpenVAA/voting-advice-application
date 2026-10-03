/**
 * Standing type-only negative control for the hand-authored-row type layer.
 *
 * ## This file's only job is to be TYPE-CHECKED. It is never executed.
 *
 * It is deliberately named with a `-test.ts` suffix rather than `.test.ts`, because vitest's default include glob matches `*.{test,spec}.?(c|m)[jt]s?(x)` and therefore does NOT match this name. Nothing here is a runnable assertion; the compiler is the whole instrument. Conversely
 * `packages/dev-seed/tsconfig.json` DOES read it — its `include` covers `tests/**` — so the file is
 * inside the gate on every run of:
 *
 * ```sh
 * yarn typecheck                                                        # the shipped gate — unforced, caching is a feature
 * TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed   # the evidence form — never a replayed verdict
 * ```
 *
 * ## ⚠ Deleting ANY line of this file turns the type-check gate RED.
 *
 * Each of the two illegal rows below carries a deliberate excess-property error (`TS2353`) suppressed by a directive on the line immediately above it. An **unused** suppression directive is itself a diagnostic — `TS2578` — so removing an offending key to "clean up" does not quietly turn this control into a decoration; it fails the gate. That property was measured rather than assumed: deleting `_constituencies` from the primary exemplar produces the expected `TS2578`, while the present arm reports zero diagnostics — a self-control pair taken on the same tree.
 *
 * ## ⚠ The reach limitation — what a green gate here does NOT prove
 *
 * Excess property checking is a **fresh-object-literal** rule. A row reached through an intermediate variable (`const row = {...}; const frag: ElectionsFragment = { fixed: [row] };`) bypasses these types entirely — measured, no diagnostic. Every hand-authored `fixed:` site in `src/templates/` is written inline and so is covered, but `src/templates/_helpers/buildMinimal.ts`
 * *constructs* the 28 `perm-*` templates' rows programmatically, and those rows are outside the type layer's guarantee altogether. The Pass 0 runtime guard `assertKnownRowProps` is the only cover there. A green gate here means "illegal keys in hand-authored inline literals are a compile error", and no more than that.
 */

import type { CandidatesFixedRow, ElectionsFixedRow, QuestionsFixedRow } from '../../src/template/permittedKeys';

/**
 * **primary** exemplar — `_constituencies` on an `elections` row.
 *
 * `_constituencies` is a `constituency_groups` sentinel (`LINK_SENTINELS`), never an `elections` one, so it is not a permitted key here. The literal is written **inline** on purpose: see the reach limitation above.
 */
export const illegalElectionsRow: ElectionsFixedRow = {
  external_id: 'negctl144-el-1',
  // @ts-expect-error TS2353 — `_constituencies` is a `constituency_groups` sentinel and is not a permitted key on an `elections` row.
  _constituencies: { externalId: ['negctl144-co-1'] }
};

/**
 * **secondary** exemplar — `_elections` on a `candidates` row.
 *
 * This is the byte-adjacent counterpart of the legality case below, and the asymmetry the typed row buys: `_elections` is illegal on a `candidates` row and legal on a `questions` row. A `Record<string, unknown>` row type cannot tell the two apart.
 */
export const illegalCandidatesRow: CandidatesFixedRow = {
  external_id: 'negctl144-ca-1',
  first_name: 'Negative',
  last_name: 'Control',
  // @ts-expect-error TS2353 — `_elections` is a `questions` / `question_categories` sentinel and is not a permitted key on a `candidates` row.
  _elections: { externalId: ['negctl144-el-1'] }
};

/**
 * **legality case** — `_elections` on a `questions` row. It carries **no** directive and MUST compile clean. A red here is a stop, not a catch: it would mean a shipped resolution path had been deleted.
 *
 * The pair is a first-class, resolved feature, not an oversight: the `_elections` sentinel resolver `electionResolve` was factored out of the `question_categories` block of `linkJoinTables` and called for **both** tables, extending `election_ids` JSONB scoping from `question_categories` alone to `questions` as well.
 *
 * It lives in this file, beside the two exemplars, so it cannot rot: if `questions._elections` ever stopped compiling, this gate goes red.
 */
export const legalQuestionsRow: QuestionsFixedRow = {
  external_id: 'negctl144-qu-1',
  _elections: { externalId: ['negctl144-el-1'] }
};

/**
 * **The `NON_COLUMN_FIELD_READERS` split, held at the TYPE layer.**
 *
 * `answersByExternalId` is stripped by `bulkImport` on every collection but READ by `importAnswers` on exactly two — `candidates` and `organizations`. PERMISSION is scoped to the readers, and the runtime guard enforces that. The type arm must match: union the flat `NON_COLUMN_FIELD_LIST` unconditionally in `NonColumnKeysFor` and this row compiled clean (measured with `tsc --noEmit --strict`, exit 0) and then hard-failed at seed time with `assertKnownRowProps: unknown property 'answersByExternalId' on collection 'questions'`. That is the worst of both layers: a green compile followed by a red seed.
 *
 * The directive is the control. If the type arm ever stops consulting the readers map, the error disappears, the directive goes unused, and `TS2578` turns the gate red — the same self-guarding property the two exemplars above rely on.
 */
export const illegalQuestionsAnswersRow: QuestionsFixedRow = {
  external_id: 'negctl144-qu-2',
  // @ts-expect-error TS2353 — `answersByExternalId` is read by `importAnswers` on `candidates` and `organizations` only, so it is not a permitted key on a `questions` row.
  answersByExternalId: { 'negctl144-ca-1': { value: 3 } }
};

/**
 * The legality half of the same split — the key IS permitted on a reading collection, and carries no directive. A red here would mean the readers map had been narrowed past the two tables `importAnswers` actually iterates, which would break 439 in-tree rows.
 */
export const legalCandidatesAnswersRow: CandidatesFixedRow = {
  external_id: 'negctl144-ca-2',
  answersByExternalId: { 'negctl144-qu-1': { value: 3 } }
};
