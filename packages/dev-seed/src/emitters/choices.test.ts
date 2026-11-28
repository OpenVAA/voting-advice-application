import { describe, expect, it } from 'vitest';
import { readChoiceIds, readOrdinalChoices } from './choices';
import type { Json, TablesInsert } from '@openvaa/supabase-types';

function question(choices: Json): TablesInsert<'questions'> {
  return { external_id: 'q', project_id: 'p', category_id: 'c', type: 'singleChoiceOrdinal', choices };
}

describe('readChoiceIds', () => {
  it('reads the string ids in order and drops entries without one', () => {
    expect(readChoiceIds(question([{ id: 'a' }, { id: 1 }, null, 'b', { id: 'c' }]))).toEqual(['a', 'c']);
  });

  it('reads nothing from a column that is not a list', () => {
    expect(readChoiceIds(question({ id: 'a' }))).toEqual([]);
    expect(readChoiceIds(question(null))).toEqual([]);
  });
});

describe('readOrdinalChoices', () => {
  it('keeps the choices with a finite numeric normalizableValue, in order', () => {
    expect(
      readOrdinalChoices(
        question([
          { id: '1', label: { en: 'One' }, normalizableValue: 1 },
          { id: '2', label: { en: 'Two' } },
          { id: '3', label: { en: 'Three' }, normalizableValue: '3' },
          { id: 4, normalizableValue: 4 },
          { id: '5', label: { en: 'Five' }, normalizableValue: 5 }
        ])
      )
    ).toEqual([
      { id: '1', normalizableValue: 1 },
      { id: '5', normalizableValue: 5 }
    ]);
  });

  it('never falls back to parsing a numeric id', () => {
    expect(readOrdinalChoices(question([{ id: '1' }, { id: '2' }]))).toEqual([]);
  });
});
