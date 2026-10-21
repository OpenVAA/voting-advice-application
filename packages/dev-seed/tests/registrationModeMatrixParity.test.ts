/**
 * The registration-mode rule's truth table, read against the TypeScript accessor.
 *
 * The database asks `private.registration_mode_allowed_in` before it honours an invitation, and the screens ask `isRegistrationModeAllowed` before they offer a registration mode. The pgTAP file whose name ends `-registration-mode-matrix.test.sql` asserts the SQL function against one table of rows; this spec parses the same rows from that file as text and asserts the accessor against them, so a rule changed on one side alone fails one of the two suites.
 *
 * It lives in this package because `yarn test:unit` needs a package to run a repository-level spec in, and this one already reads the schema tree from its tests (`rpcNullabilityGate.test.ts`, `assertKnownRowProps.test.ts`).
 *
 * A row the accessor contradicts is a wrong row of the table or a changed rule: the table and the SQL function are what move, together.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isRegistrationModeAllowed } from '@openvaa/app-shared';
import { describe, expect, it } from 'vitest';
import type { ContestantAppConfigInput, RegistrationMode, ServedEntityType } from '@openvaa/app-shared';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');
const PGTAP_DIRECTORY = resolve(REPO_ROOT, 'apps/supabase/supabase/tests/database');
const TABLE_FILE_SUFFIX = '-registration-mode-matrix.test.sql';

/** One row of the truth table, as the pgTAP file states it. */
type MatrixRow = {
  /** The stored settings, as the JSON text of the SQL literal. */
  settings: string;
  entityType: string;
  mode: string;
  allowed: boolean;
  title: string;
};

/**
 * One assertion of the table: a call of the function with three string literals, the first cast to `jsonb`, then the stated boolean and the title. White space, line breaks included, is allowed between any two tokens.
 */
const ROW_RE =
  /private\.registration_mode_allowed_in\s*\(\s*'([^']*)'\s*::\s*jsonb\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)\s*,\s*(true|false)\s*,\s*'((?:[^']|'')*)'/g;

/** Every call of the function, in whatever form: a call the row pattern does not match is a row the spec would otherwise skip. */
const CALL_RE = /registration_mode_allowed_in\s*\(/g;

const PLAN_RE = /plan\s*\(\s*(\d+)\s*\)/;

const tableFiles = readdirSync(PGTAP_DIRECTORY).filter((name) => name.endsWith(TABLE_FILE_SUFFIX));
const tableText = tableFiles.length === 1 ? readFileSync(resolve(PGTAP_DIRECTORY, tableFiles[0]), 'utf8') : '';

const rows: Array<MatrixRow> = [...tableText.matchAll(ROW_RE)].map(
  ([, settings, entityType, mode, allowed, title]) => ({
    settings,
    entityType,
    mode,
    allowed: allowed === 'true',
    title: title.replaceAll("''", "'")
  })
);

describe('the registration-mode truth table and isRegistrationModeAllowed', () => {
  it('finds exactly one truth-table file among the pgTAP files', () => {
    expect(tableFiles).toHaveLength(1);
  });

  it('parses at least one row', () => {
    expect(rows.length).toBeGreaterThan(0);
  });

  it('parses every call of the function as a row, and as many rows as the file plans', () => {
    const planned = Number(tableText.match(PLAN_RE)?.[1]);

    expect(rows).toHaveLength(tableText.match(CALL_RE)?.length ?? 0);
    expect(rows).toHaveLength(planned);
  });

  it('gives every row a title of its own', () => {
    expect(new Set(rows.map((row) => row.title)).size).toBe(rows.length);
  });

  it('answers every row as the table states', () => {
    const contradicted = rows
      .filter(
        (row) =>
          isRegistrationModeAllowed(
            JSON.parse(row.settings) as ContestantAppConfigInput,
            row.entityType as ServedEntityType,
            row.mode as RegistrationMode
          ) !== row.allowed
      )
      .map((row) => `${row.title} (the table states ${row.allowed})`);

    expect(contradicted).toEqual([]);
  });
});
