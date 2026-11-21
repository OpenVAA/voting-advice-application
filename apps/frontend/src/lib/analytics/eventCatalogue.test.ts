/**
 * Specification for the event catalogue of the docs site, the table under `## Event catalogue` on `developers-guide/configuration/analytics/+page.md`: the first cell of its rows names, each as one backticked event name, exactly the names of `EVENT_NAMES`, none missing and none extra. A name written in any other column, in prose or without backticks does not count. Each name of the schema with no row is a problem, in the schema's order, and each row naming an event the schema does not have is a problem, in the page's order. The last cell of a row, the consent column, carries the word `sensitive` exactly when its event is in `SENSITIVE_EVENTS`; a row that says otherwise is a problem, in the page's order. An absent page, or a page with no catalogue table, is a problem naming the file.
 *
 * @vitest-environment node
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EVENT_NAMES, SENSITIVE_EVENTS } from './events.schema';

/** The repository root, five directories above this file. */
const REPOSITORY_ROOT = fileURLToPath(new URL('../../../../../', import.meta.url));

/** The analytics page, relative to the repository root. */
const PAGE_PATH = 'apps/docs/src/routes/(content)/developers-guide/configuration/analytics/+page.md';

/** The heading the catalogue table stands under. */
const CATALOGUE_HEADING = '## Event catalogue';

/** One row of the catalogue table: the event its first cell names and the text of its last cell. */
type CatalogueRow = { name: string; lastCell: string };

/**
 * The rows of the catalogue table that name an event in their first cell, in the page's order. A row whose first cell is not one backticked name, such as the header and the separator, names nothing.
 *
 * @param page - The page's text.
 * @returns The rows, or `undefined` when the page has no catalogue heading or no table row under it.
 */
function catalogueRows(page: string): Array<CatalogueRow> | undefined {
  const lines = page.split('\n');
  const start = lines.findIndex((line) => line.trim() === CATALOGUE_HEADING);
  if (start < 0) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('## '));
  const rows = (end < 0 ? rest : rest.slice(0, end)).filter((line) => line.trimStart().startsWith('|'));
  if (rows.length === 0) return undefined;
  return rows.flatMap((row) => {
    const cells = row.trim().split('|').slice(1, -1);
    const match = /^`([^`]+)`$/.exec((cells[0] ?? '').trim());
    return match ? [{ name: match[1], lastCell: (cells.at(-1) ?? '').trim() }] : [];
  });
}

/**
 * List every way the catalogue disagrees with the schema's event names and its sensitive events. It reads nothing but its arguments.
 *
 * @param page - The text of the analytics page, or `undefined` when the page does not exist.
 * @param names - The event names of the schema, in the schema's order.
 * @param sensitive - The schema's sensitive events.
 * @returns One string per problem, each naming the event or the file it concerns, or an empty array when the catalogue names exactly `names` and marks exactly `sensitive` as sensitive.
 */
function eventCatalogueProblems(
  page: string | undefined,
  names: ReadonlyArray<string>,
  sensitive: ReadonlySet<string>
): Array<string> {
  if (page === undefined) return [`${PAGE_PATH}: is missing`];
  const rows = catalogueRows(page);
  if (rows === undefined) return [`${PAGE_PATH}: has no table under \`${CATALOGUE_HEADING}\``];
  const rowNames = rows.map(({ name }) => name);
  const listed = new Set(rowNames);
  const schema = new Set(names);
  const problems: Array<string> = [];
  for (const name of names) {
    if (!listed.has(name)) problems.push(`${name}: is in EventSchema and has no row in the catalogue of ${PAGE_PATH}`);
  }
  for (const name of new Set(rowNames)) {
    if (!schema.has(name))
      problems.push(`${name}: has a row in the catalogue of ${PAGE_PATH} and is not in EventSchema`);
  }
  for (const { name, lastCell } of rows) {
    if (!schema.has(name)) continue;
    const marked = /\bsensitive\b/i.test(lastCell);
    if (sensitive.has(name) && !marked)
      problems.push(
        `${name}: is in SENSITIVE_EVENTS and its row in the catalogue of ${PAGE_PATH} does not mark it sensitive`
      );
    else if (!sensitive.has(name) && marked)
      problems.push(
        `${name}: its row in the catalogue of ${PAGE_PATH} marks it sensitive and it is not in SENSITIVE_EVENTS`
      );
  }
  return problems;
}

/** The event names of the fixture schema. */
const FIXTURE_NAMES: ReadonlyArray<string> = ['pageview', 'answer', 'video'];

/** The sensitive events of the fixture schema. */
const FIXTURE_SENSITIVE: ReadonlySet<string> = new Set(['answer']);

/**
 * Build a fixture page with a catalogue table of one row per name, between sections that name events in prose only.
 *
 * @param rowNames - The names the table's rows give in their first cell.
 * @param marked - The names whose row's last cell says `No; sensitive` rather than `No`.
 * @returns The page text.
 */
function pageWithRows(rowNames: ReadonlyArray<string>, marked: ReadonlySet<string> = FIXTURE_SENSITIVE): string {
  return [
    '# Analytics',
    '',
    'The `answer` event is described below.',
    '',
    CATALOGUE_HEADING,
    '',
    '| Event | When sent | Fields | Sent before consent? |',
    '| ----- | --------- | ------ | -------------------- |',
    ...rowNames.map(
      (name) => `| \`${name}\` | the fixture moment | \`questionId\` | ${marked.has(name) ? 'No; sensitive' : 'No'} |`
    ),
    '',
    '## How it works',
    '',
    '| Mode | Meaning |',
    '| ---- | ------- |',
    '| `gated` | the fixture meaning |',
    ''
  ].join('\n');
}

describe('eventCatalogueProblems', () => {
  it('finds nothing in a table that names every event', () => {
    expect(eventCatalogueProblems(pageWithRows(FIXTURE_NAMES), FIXTURE_NAMES, FIXTURE_SENSITIVE)).toEqual([]);
  });

  it('names answer and the page when the table has no row for it', () => {
    const problems = eventCatalogueProblems(pageWithRows(['pageview', 'video']), FIXTURE_NAMES, FIXTURE_SENSITIVE);
    expect(problems).toEqual([expect.stringContaining('answer: is in EventSchema')]);
    expect(problems[0]).toContain(PAGE_PATH);
  });

  it('names made_up as not in the schema when a copy of the page has an extra row for it', () => {
    const page = pageWithRows(FIXTURE_NAMES).replace(
      '| `video` |',
      '| `made_up` | the fixture moment | none | No |\n| `video` |'
    );
    expect(eventCatalogueProblems(page, FIXTURE_NAMES, FIXTURE_SENSITIVE)).toEqual([
      expect.stringContaining('made_up: has a row')
    ]);
    expect(eventCatalogueProblems(page, FIXTURE_NAMES, FIXTURE_SENSITIVE)[0]).toContain('is not in EventSchema');
  });

  it('reports missing names in the schema order, then extra names in the page order', () => {
    const problems = eventCatalogueProblems(
      pageWithRows(['zeta', 'pageview', 'alpha']),
      FIXTURE_NAMES,
      FIXTURE_SENSITIVE
    );
    expect(problems.map((problem) => problem.split(':', 1)[0])).toEqual(['answer', 'video', 'zeta', 'alpha']);
  });

  it('does not count a name written in prose or in another column', () => {
    const page = pageWithRows(['pageview', 'video']).replace('`questionId`', '`answer`');
    expect(eventCatalogueProblems(page, FIXTURE_NAMES, FIXTURE_SENSITIVE)).toEqual([
      expect.stringContaining('answer: is in EventSchema')
    ]);
  });

  it('does not count a row whose first cell is not backticked', () => {
    const page = pageWithRows(FIXTURE_NAMES).replace('| `answer` |', '| answer |');
    expect(eventCatalogueProblems(page, FIXTURE_NAMES, FIXTURE_SENSITIVE)).toEqual([
      expect.stringContaining('answer: is in EventSchema')
    ]);
  });

  it('does not read a table under another heading as the catalogue', () => {
    const page = pageWithRows(FIXTURE_NAMES).replace('| `gated` |', '| `made_up` |');
    expect(eventCatalogueProblems(page, FIXTURE_NAMES, FIXTURE_SENSITIVE)).toEqual([]);
  });

  it('names a sensitive event whose row does not say so, and an event whose row says so wrongly', () => {
    const page = pageWithRows(FIXTURE_NAMES, new Set(['video']));
    const problems = eventCatalogueProblems(page, FIXTURE_NAMES, FIXTURE_SENSITIVE);
    expect(problems).toEqual([
      expect.stringContaining('answer: is in SENSITIVE_EVENTS'),
      expect.stringContaining('video: its row in the catalogue')
    ]);
    expect(problems[1]).toContain('is not in SENSITIVE_EVENTS');
  });

  it('reads only the last cell for the sensitive mark', () => {
    const page = pageWithRows(FIXTURE_NAMES).replace(
      '| `video` | the fixture moment |',
      '| `video` | a sensitive moment |'
    );
    expect(eventCatalogueProblems(page, FIXTURE_NAMES, FIXTURE_SENSITIVE)).toEqual([]);
  });

  it('reports a page with no catalogue table, naming it', () => {
    const noHeading = pageWithRows(FIXTURE_NAMES).replace(CATALOGUE_HEADING, '## Events');
    expect(eventCatalogueProblems(noHeading, FIXTURE_NAMES, FIXTURE_SENSITIVE)).toEqual([
      `${PAGE_PATH}: has no table under \`${CATALOGUE_HEADING}\``
    ]);
    const noTable = ['# Analytics', '', CATALOGUE_HEADING, '', 'The table is to come.', ''].join('\n');
    expect(eventCatalogueProblems(noTable, FIXTURE_NAMES, FIXTURE_SENSITIVE)).toEqual([
      `${PAGE_PATH}: has no table under \`${CATALOGUE_HEADING}\``
    ]);
  });

  it('reports an absent page, naming it', () => {
    expect(eventCatalogueProblems(undefined, FIXTURE_NAMES, FIXTURE_SENSITIVE)).toEqual([`${PAGE_PATH}: is missing`]);
  });
});

describe('the event catalogue in the repository', () => {
  it('names exactly the events of EventSchema, and marks exactly the events of SENSITIVE_EVENTS sensitive', () => {
    const absolute = `${REPOSITORY_ROOT}${PAGE_PATH}`;
    const page = existsSync(absolute) ? readFileSync(absolute, 'utf8') : undefined;
    expect(eventCatalogueProblems(page, EVENT_NAMES, SENSITIVE_EVENTS)).toEqual([]);
  });
});
