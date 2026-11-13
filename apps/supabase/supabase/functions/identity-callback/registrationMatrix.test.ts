/**
 * The function's copy of the registration-mode rule, read against the rule's truth table, and the entity-type decision built on it.
 *
 * The pgTAP file whose name ends `-registration-mode-matrix.test.sql` asserts the SQL function against one table of rows, and `packages/dev-seed/tests/registrationModeMatrixParity.test.ts` asserts the TypeScript accessor against the same rows. This spec parses those rows from that file as text, in the same way, and asserts the copy in `registrationMatrix.ts` against every one of them, so the copy cannot drift from either reading without a suite failing.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ENTITY_TYPES,
  identityProviderEntityTypes,
  registrationModeAllowed,
  resolveEntityType,
  SERVED_ENTITY_TYPES
} from './registrationMatrix.ts';
import { parseIdentityCallbackRequest } from './requestContract.ts';

const PGTAP_DIRECTORY = new URL('../../tests/database/', import.meta.url);
const TABLE_FILE_SUFFIX = '-registration-mode-matrix.test.sql';
const APP_SHARED_CONFIG = new URL(
  '../../../../../packages/app-shared/src/settings/contestantAppConfig.ts',
  import.meta.url
);

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
const tableText = tableFiles.length === 1 ? readFileSync(new URL(tableFiles[0], PGTAP_DIRECTORY), 'utf8') : '';

const rows: Array<MatrixRow> = [...tableText.matchAll(ROW_RE)].map(
  ([, settings, entityType, mode, allowed, title]) => ({
    settings,
    entityType,
    mode,
    allowed: allowed === 'true',
    title: title.replaceAll("''", "'")
  })
);

describe('the registration-mode truth table and registrationModeAllowed', () => {
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
      .filter((row) => registrationModeAllowed(JSON.parse(row.settings), row.entityType, row.mode) !== row.allowed)
      .map((row) => `${row.title} (the table states ${row.allowed})`);

    expect(contradicted).toEqual([]);
  });
});

describe('registrationModeAllowed: arguments outside the vocabularies', () => {
  const OPEN = {
    contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: ['identity_provider'] } }
  };

  it.each([
    ['an entity type no Contestant App serves', 'faction', 'identity_provider'],
    ['a null entity type', null, 'identity_provider'],
    ['a null mode', 'candidate', null],
    ['a mode in another case', 'candidate', 'IDENTITY_PROVIDER']
  ])('allows nothing for %s', (_label, entityType, mode) => {
    expect(registrationModeAllowed(OPEN, entityType, mode)).toBe(false);
  });

  it('allows the mode the row holds', () => {
    expect(registrationModeAllowed(OPEN, 'candidate', 'identity_provider')).toBe(true);
  });

  it('reads no inherited property as a row', () => {
    const settings = {
      contestantApp: { entityTypes: ['candidate'], registrationModes: Object.create({ candidate: ['email'] }) }
    };
    expect(registrationModeAllowed(settings, 'candidate', 'email')).toBe(false);
  });
});

describe('the vocabularies', () => {
  it('serves the entity types the Contestant App serves, in the same order', () => {
    const source = readFileSync(APP_SHARED_CONFIG, 'utf8');
    const declared = source.match(/export const SERVED_ENTITY_TYPES = \[([^\]]*)\]/)?.[1];
    expect(declared?.match(/'([^']+)'/g)?.map((literal) => literal.slice(1, -1))).toEqual([...SERVED_ENTITY_TYPES]);
  });

  it('names candidate and organization as the entity types, in that order', () => {
    expect([...ENTITY_TYPES]).toEqual(['candidate', 'organization']);
  });

  it('accepts in a request exactly the entity types the rule decides', () => {
    const request = { id_token: 'a.b.c', project_id: '00000000-0000-0000-0000-000000000001' };
    for (const entityType of ENTITY_TYPES) {
      expect(parseIdentityCallbackRequest({ ...request, entity_type: entityType })?.entityType).toBe(entityType);
    }
    expect(parseIdentityCallbackRequest({ ...request, entity_type: 'faction' })).toBeNull();
  });
});

/** Settings serving the given types, with the identity provider's mode allowed for the types in `allowing`. */
function settingsWith(served: Array<string>, allowing: Array<string>): Record<string, unknown> {
  const registrationModes: Record<string, Array<string>> = { candidate: ['email'], organization: ['email'] };
  for (const entityType of allowing) registrationModes[entityType] = ['email', 'identity_provider'];
  return { contestantApp: { entityTypes: served, registrationModes } };
}

describe('identityProviderEntityTypes', () => {
  it.each([
    [
      'both served, both allowing',
      settingsWith(['candidate', 'organization'], ['candidate', 'organization']),
      ['candidate', 'organization']
    ],
    [
      'both served, listed in the other order',
      settingsWith(['organization', 'candidate'], ['organization', 'candidate']),
      ['candidate', 'organization']
    ],
    [
      'both served, candidates alone allowing',
      settingsWith(['candidate', 'organization'], ['candidate']),
      ['candidate']
    ],
    [
      'both served, organizations alone allowing',
      settingsWith(['candidate', 'organization'], ['organization']),
      ['organization']
    ],
    ['both served, neither allowing', settingsWith(['candidate', 'organization'], []), []],
    [
      'candidates alone served, both rows allowing',
      settingsWith(['candidate'], ['candidate', 'organization']),
      ['candidate']
    ],
    [
      'no list of entity types, the organizations row allowing',
      { contestantApp: { registrationModes: { organization: ['identity_provider'] } } },
      []
    ]
  ])('lists the served types allowing the mode: %s', (_label, settings, expected) => {
    expect(identityProviderEntityTypes(settings)).toEqual(expected);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'settings'],
    ['an array', [settingsWith(['candidate'], ['candidate'])]],
    ['an empty object', {}]
  ])('lists none for settings that are %s', (_label, settings) => {
    expect(identityProviderEntityTypes(settings)).toEqual([]);
  });
});

describe('resolveEntityType', () => {
  const BOTH = settingsWith(['candidate', 'organization'], ['candidate', 'organization']);
  const CANDIDATES_ONLY = settingsWith(['candidate', 'organization'], ['candidate']);
  const ORGANIZATIONS_ONLY = settingsWith(['candidate', 'organization'], ['organization']);
  const NEITHER = settingsWith(['candidate', 'organization'], []);
  const CANDIDATES_SERVED = settingsWith(['candidate'], ['candidate', 'organization']);

  it('takes a named type that is served and allows the mode', () => {
    expect(resolveEntityType(BOTH, 'organization')).toEqual({ entityType: 'organization' });
    expect(resolveEntityType(BOTH, 'candidate')).toEqual({ entityType: 'candidate' });
    expect(resolveEntityType(ORGANIZATIONS_ONLY, 'organization')).toEqual({ entityType: 'organization' });
  });

  it('refuses a named type that does not allow the mode', () => {
    expect(resolveEntityType(CANDIDATES_ONLY, 'organization')).toEqual({ refused: true });
    expect(resolveEntityType(ORGANIZATIONS_ONLY, 'candidate')).toEqual({ refused: true });
  });

  it('refuses a named type that is not served, whatever its row holds', () => {
    expect(resolveEntityType(CANDIDATES_SERVED, 'organization')).toEqual({ refused: true });
  });

  it.each([['faction'], ['Organization'], [''], [1], [['candidate']]])('refuses the unknown type %j', (entityType) => {
    expect(resolveEntityType(BOTH, entityType)).toEqual({ refused: true });
  });

  it('takes an absent type as the one served type allowing the mode', () => {
    expect(resolveEntityType(CANDIDATES_ONLY, null)).toEqual({ entityType: 'candidate' });
    expect(resolveEntityType(ORGANIZATIONS_ONLY, null)).toEqual({ entityType: 'organization' });
    expect(resolveEntityType(ORGANIZATIONS_ONLY, undefined)).toEqual({ entityType: 'organization' });
  });

  it('refuses an absent type when several served types allow the mode', () => {
    expect(resolveEntityType(BOTH, null)).toEqual({ refused: true });
  });

  it('refuses an absent type when no served type allows the mode', () => {
    expect(resolveEntityType(NEITHER, null)).toEqual({ refused: true });
  });

  it.each([
    ['null', null],
    ['a string', 'settings'],
    ['an empty object', {}]
  ])('refuses every type under settings that are %s', (_label, settings) => {
    expect(resolveEntityType(settings, 'candidate')).toEqual({ refused: true });
    expect(resolveEntityType(settings, 'organization')).toEqual({ refused: true });
    expect(resolveEntityType(settings, null)).toEqual({ refused: true });
  });
});
