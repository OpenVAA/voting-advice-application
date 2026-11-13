import { describe, expect, it } from 'vitest';
import { parseNominationParentOptions } from './nominationParentOptions';

const SECRET = 'value-that-must-not-be-in-the-message';

/** An organization with every member stored, nominated at one contest, as `get_nomination_parent_options` states it. */
const organizationOption = {
  id: 'org-1',
  entity_type: 'organization',
  name: { en: 'Second Party', fi: 'Toinen puolue' },
  short_name: { en: 'SP' },
  color: { normal: '#112233', dark: '#aabbcc' },
  image: { path: 'project-1/organizations/org-1/file-1.png', alt: 'Logo of the second party' },
  nominated: [{ election_id: 'el-1', constituency_id: 'co-1' }]
};

/** An alliance with nothing stored in its optional columns, nominated at none of the contests asked about. */
const allianceOption = {
  id: 'all-1',
  entity_type: 'alliance',
  name: { en: 'The Alliance' },
  short_name: null,
  color: null,
  image: null,
  nominated: []
};

const OPTION_KEYS = ['color', 'entity_type', 'id', 'image', 'name', 'nominated', 'short_name'];

/**
 * The error a parse of `raw` throws.
 * @param raw - The value to parse.
 * @returns The thrown value, or `undefined` when the parse returned.
 */
function errorOf(raw: Parameters<typeof parseNominationParentOptions>[0]): unknown {
  try {
    parseNominationParentOptions(raw);
  } catch (e) {
    return e;
  }
  return undefined;
}

describe('parseNominationParentOptions', () => {
  it('returns null for a null answer, which is a refused read and not an empty list', () => {
    expect(parseNominationParentOptions(null)).toBeNull();
  });

  it('returns an empty list for an empty array', () => {
    expect(parseNominationParentOptions([])).toEqual([]);
  });

  it('returns the elements of a well-formed array in the order given, in the column names of the database', () => {
    expect(parseNominationParentOptions([organizationOption, allianceOption])).toEqual([
      organizationOption,
      allianceOption
    ]);
    expect(parseNominationParentOptions([allianceOption, organizationOption])).toEqual([
      allianceOption,
      organizationOption
    ]);
  });

  it('returns each element as an object of seven members', () => {
    const parsed = parseNominationParentOptions([organizationOption, allianceOption]);

    expect(parsed).toHaveLength(2);
    expect(Object.keys(parsed?.[0] ?? {}).sort()).toEqual(OPTION_KEYS);
    expect(Object.keys(parsed?.[1] ?? {}).sort()).toEqual(OPTION_KEYS);
  });

  it('returns the contests an option is nominated at as objects of an election and a constituency, in the order given', () => {
    const nominated = [
      { election_id: 'el-2', constituency_id: 'co-2' },
      { election_id: 'el-1', constituency_id: 'co-1' }
    ];

    expect(parseNominationParentOptions([{ ...organizationOption, nominated }])?.[0]?.nominated).toEqual(nominated);
  });

  it('drops members the schema does not know, in an element and in a contest', () => {
    const parsed = parseNominationParentOptions([
      {
        ...organizationOption,
        sort_order: 3,
        answers: { q1: { value: 1 } },
        nominated: [{ election_id: 'el-1', constituency_id: 'co-1', election_round: 1 }]
      }
    ]);

    expect(parsed).toEqual([organizationOption]);
  });

  it.each(['candidate', 'faction', 'party'])(
    'throws for an option of the type %s, which is no type a nomination is placed under here',
    (entity_type) => {
      expect(() => parseNominationParentOptions([{ ...organizationOption, entity_type }])).toThrow(
        /did not match its schema at: 0\.entity_type$/
      );
    }
  );

  it.each([
    ['an object', { options: [] }],
    ['a string', 'options'],
    ['a number', 0],
    ['a boolean', false]
  ])('throws for an answer that is %s and not an array', (_name, raw) => {
    expect(() => parseNominationParentOptions(raw)).toThrow(/did not match its schema at: \(root\)$/);
  });

  it('throws for an absent answer', () => {
    expect(() => parseNominationParentOptions(undefined)).toThrow(/did not match its schema at: \(root\)$/);
  });

  it.each(OPTION_KEYS)('throws for an element without its %s member, naming it', (key) => {
    const withoutKey = Object.fromEntries(Object.entries(organizationOption).filter(([name]) => name !== key));

    expect(() => parseNominationParentOptions([allianceOption, withoutKey])).toThrow(
      new RegExp(`did not match its schema at: 1\\.${key}$`)
    );
  });

  it('throws for an element whose id is empty or not text', () => {
    expect(() => parseNominationParentOptions([{ ...organizationOption, id: '' }])).toThrow(
      /did not match its schema at: 0\.id$/
    );
    expect(() => parseNominationParentOptions([{ ...organizationOption, id: 7 }])).toThrow(
      /did not match its schema at: 0\.id$/
    );
  });

  it.each([
    ['null', null],
    ['an object', { election_id: 'el-1', constituency_id: 'co-1' }],
    ['a string', 'el-1']
  ])('throws for an element whose nominated is %s and not an array', (_name, nominated) => {
    expect(() => parseNominationParentOptions([{ ...organizationOption, nominated }])).toThrow(
      /did not match its schema at: 0\.nominated$/
    );
  });

  it('throws for a contest without one of its two ids, and for one whose id is not text', () => {
    expect(() =>
      parseNominationParentOptions([{ ...organizationOption, nominated: [{ election_id: 'el-1' }] }])
    ).toThrow(/did not match its schema at: 0\.nominated\.0\.constituency_id$/);
    expect(() =>
      parseNominationParentOptions([
        {
          ...organizationOption,
          nominated: [
            { election_id: 'el-1', constituency_id: 'co-1' },
            { election_id: 7, constituency_id: 'co-2' }
          ]
        }
      ])
    ).toThrow(/did not match its schema at: 0\.nominated\.1\.election_id$/);
  });

  it('names every refused path of one answer', () => {
    const error = errorOf([
      { ...organizationOption, id: 7 },
      { ...allianceOption, nominated: null }
    ]);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(/did not match its schema at: 0\.id, 1\.nominated$/);
  });

  it('names the refused paths and never a stored value', () => {
    const error = errorOf([
      {
        ...organizationOption,
        id: { secret: SECRET },
        entity_type: SECRET,
        nominated: [{ election_id: { secret: SECRET }, constituency_id: 'co-1' }]
      }
    ]);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('0.id');
    expect((error as Error).message).toContain('0.entity_type');
    expect((error as Error).message).toContain('0.nominated.0.election_id');
    expect((error as Error).message).not.toContain(SECRET);
  });
});
