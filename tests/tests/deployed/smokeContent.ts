import { smokeTemplate } from '../../../packages/dev-seed/src/templates/smoke';

/**
 * The content the deployed smoke specs expect, read from the `smoke` dev-seed template that the hosted project was seeded with.
 *
 * The template is imported by path: the `@openvaa/dev-seed` barrel does not export it and re-exports a service-role client, which a smoke run must never load.
 */

/** The number of rows a template fragment states, counted and fixed together. */
function fragmentSize(fragment: { count?: number; fixed?: ReadonlyArray<unknown> } | undefined): number {
  return (fragment?.count ?? 0) + (fragment?.fixed?.length ?? 0);
}

/** Throws the message every unreadable-content failure carries. */
function unreadable(reason: string): never {
  throw new Error(`SMOKE CONTENT UNREADABLE: ${reason}`);
}

/** The English statement of one fixed question row, or a thrown Error naming the row. */
function englishName(row: { external_id: string; name?: unknown }): string {
  const { name } = row;
  if (typeof name !== 'object' || name === null || Array.isArray(name)) {
    return unreadable(`question ${row.external_id} has no localised name object`);
  }
  const en = (name as Record<string, unknown>).en;
  if (typeof en !== 'string' || en.trim() === '') {
    return unreadable(`question ${row.external_id} has no English name`);
  }
  return en;
}

/** The number of elections the `smoke` template creates; the voter walk relies on it being one, so the election selection page is skipped. */
export const SMOKE_ELECTION_COUNT = fragmentSize(smokeTemplate.elections);

const constituencyCount = fragmentSize(smokeTemplate.constituencies);
if (SMOKE_ELECTION_COUNT !== 1 || constituencyCount !== 1) {
  unreadable(
    `the template must have exactly one election and one constituency, found ${SMOKE_ELECTION_COUNT} and ${constituencyCount}`
  );
}

/** The English statements of the `smoke` template's questions, in the order the voter app shows them (`sort_order`). */
export const SMOKE_STATEMENTS: ReadonlyArray<string> = [...(smokeTemplate.questions?.fixed ?? [])]
  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  .map(englishName);

if (SMOKE_STATEMENTS.length === 0) unreadable('the template has no fixed questions');
