import { type Answer, type AnswerDict, type HasAnswers, type WrappedEntity } from '@openvaa/core';
import {
  type Choice,
  DataRoot,
  MultipleChoiceCategoricalQuestion,
  MultipleTextQuestion,
  NumberQuestion,
  SingleChoiceCategoricalQuestion,
  TextQuestion
} from '@openvaa/data';
import { describe, expect, test, vi } from 'vitest';
import {
  castValue,
  ChoiceQuestionFilter,
  FilterGroup,
  LOGIC_OP,
  MISSING_VALUE,
  NumberQuestionFilter,
  ObjectFilter,
  TextPropertyFilter,
  TextQuestionFilter
} from '../src';
import { copyRules, matchRules, ruleIsActive } from '../src/filter/rules';

const LOCALE = 'en';
const root = new DataRoot();

describe('Value utilities', () => {
  test('castValue', () => {
    expect(castValue(5, 'string')).toEqual('5');
    expect(castValue('5', 'string')).toEqual('5');
    expect(castValue(5, 'number')).toEqual(5);
    expect(castValue('5', 'number')).toEqual(5);
    expect(castValue(0, 'boolean')).toEqual(false);
    expect(castValue(1, 'boolean')).toEqual(true);
    expect(castValue(false, 'boolean')).toEqual(false);
    expect(castValue(true, 'boolean')).toEqual(true);
    expect(castValue([1, 2], 'string', true)).toEqual(['1', '2']);
    expect(castValue(['1', '2'], 'number', true)).toEqual([1, 2]);
    expect(castValue([0, 1, false], 'boolean', true)).toEqual([false, true, false]);
    expect(() => castValue({}, 'boolean'), 'Illegal cast').toThrow();
    expect(() => castValue(true, 'string'), 'Illegal cast').toThrow();
    expect(() => castValue(false, 'number'), 'Illegal cast').toThrow();
    expect(() => castValue([0, 1, false], 'boolean'), 'Illegal cast').toThrow();
  });
});

describe('Rules utilities', () => {
  test('ruleIsActive', () => {
    expect(ruleIsActive(5), 'Active rule').toBe(true);
    expect(ruleIsActive('aaa'), 'Active rule').toBe(true);
    expect(ruleIsActive(/aaa/), 'Active rule').toBe(true);
    expect(ruleIsActive([1, 2]), 'Active rule').toBe(true);
    expect(ruleIsActive(new Set([1, 2])), 'Active rule').toBe(true);
    expect(ruleIsActive(null), 'Inactive rule').toBe(false);
    expect(ruleIsActive(undefined), 'Inactive rule').toBe(false);
    expect(ruleIsActive(''), 'Inactive rule').toBe(false);
    expect(ruleIsActive([]), 'Inactive rule').toBe(false);
    expect(ruleIsActive(new Set()), 'Inactive rule').toBe(false);
    expect(ruleIsActive(new RegExp('')), 'Inactive rule').toBe(false);
    expect(ruleIsActive(new RegExp('', 'i')), 'Inactive rule').toBe(false);
  });
  test('matchRupes', () => {
    expect(matchRules(5, 5), 'Match rules').toBe(true);
    expect(matchRules('aaa', 'aaa'), 'Match rules').toBe(true);
    expect(matchRules(/aaa/i, /aaa/i), 'Match rules').toBe(true);
    expect(matchRules([1, 2], [2, 1]), 'Match rules').toBe(true);
    expect(matchRules(new Set([1, 2]), new Set([2, 1])), 'Match rules').toBe(true);
    expect(matchRules(null, undefined), 'Match empty rules').toBe(true);
    expect(matchRules('', undefined), 'Match empty rules').toBe(true);
    expect(matchRules('', []), 'Match empty rules').toBe(true);
    expect(matchRules('', new Set()), 'Match empty rules').toBe(true);
    expect(matchRules(null, []), 'Match empty rules').toBe(true);
    expect(matchRules(null, new Set()), 'Match empty rules').toBe(true);
    expect(matchRules(new RegExp(''), new Set()), 'Match empty rules').toBe(true);
    expect(matchRules('aaa', 'aab'), 'Rules should not match').toBe(false);
    expect(matchRules(/aaa/i, /aaa/), 'Rules should not match').toBe(false);
    expect(matchRules([1, 2], [2, 1, 3]), 'Rules should not match').toBe(false);
    expect(matchRules(new Set([1, 2]), new Set([2, 1, 3])), 'Rules should not match').toBe(false);
  });
  test('copyRules', () => {
    const ruleArray = [1, 2];
    const ruleSet = new Set([1, 2]);
    const rules = {
      string: 5,
      number: 1,
      array: ruleArray,
      set: ruleSet,
      regExp: /aaa/i,
      null: null,
      undef: undefined
    };
    const copy = copyRules(rules);
    expect(copy, 'Copy rules').toEqual(rules);
    ruleArray.push(3);
    ruleSet.add(3);
    expect(copy.array.length, 'Rules not to include references to original objects').toBe(2);
    expect(copy.set.size, 'Rules not to include references to original objects').toBe(2);
    expect(copyRules({}), 'Copy empty rules').toEqual({});
  });
});

describe('Filter basics', () => {
  const names = ['Bart', 'Homer', 'Marge'];
  const people: Record<string, NamedEntity> = Object.fromEntries(names.map((n) => [n, new NamedEntity(n)]));
  const targets = Object.values(people);

  test('TextPropertyFilter', () => {
    const filter = new TextPropertyFilter<NamedEntity>({ property: 'name' }, LOCALE);
    expect(filter.apply(targets), 'Match all by default').toEqual(targets);
    filter.include = 'Bart';
    expect(filter.apply(targets), 'Exact match').toEqual([people['Bart']]);
    filter.include = 'a';
    expect(filter.apply(targets), 'Substring match').toEqual([people['Bart'], people['Marge']]);
    filter.include = 'xxxx';
    expect(filter.apply(targets), 'No match').toEqual([]);
    filter.reset();
    expect(filter.apply(targets), 'Reset and empty filter').toEqual(targets);
    filter.exclude = 'a';
    expect(filter.apply(targets), 'Exclude substring match').toEqual([people['Homer']]);
    filter.exclude = 'r';
    expect(filter.apply(targets), 'All excluded').toEqual([]);
    filter.exclude = 'e';
    filter.include = 'a';
    expect(filter.apply(targets), 'Include and exclude').toEqual([people['Bart']]);
    filter.reset();
    filter.include = 'h';
    expect(filter.apply(targets), 'Case insensitive match').toEqual([people['Homer']]);
    filter.include = 'm';
    filter.caseSensitive = true;
    expect(filter.apply(targets), 'Case sensitive match').toEqual([people['Homer']]);
    filter.include = 'm';
    filter.caseSensitive = false;
    expect(filter.apply(targets), 'Change case sensitivity').toEqual([people['Homer'], people['Marge']]);
  });

  test('TextPropertyFilter: Missing values', () => {
    const nameless = new NamedEntity(undefined);
    const targetsWithMissing = [...targets, nameless];
    const filter = new TextPropertyFilter<NamedEntity>({ property: 'name' }, LOCALE);
    expect(filter.apply(targetsWithMissing), 'Include missing by default').toEqual(targetsWithMissing);
    filter.include = 'Bart';
    expect(filter.apply(targetsWithMissing), 'Exlude missing if include is defined').toEqual([people['Bart']]);
    filter.reset();
    filter.exclude = 'Bart';
    expect(filter.apply(targetsWithMissing), 'Exlude does not exlude missing').toEqual([
      people['Homer'],
      people['Marge'],
      nameless
    ]);
  });

  test('onChange', () => {
    const filter = new TextPropertyFilter<NamedEntity>({ property: 'name' }, LOCALE);
    const handler = vi.fn((f) => f);
    filter.onChange(handler);
    filter.include = 'Bart';
    expect(handler, 'Call handler on rule set').toHaveBeenCalledTimes(1);
    expect(handler, 'Call handler passing filter object').toHaveBeenCalledWith(filter);
    filter.reset();
    expect(handler, 'Call handler on reset').toHaveBeenCalledTimes(2);
    filter.include = 'Bart';
    filter.include = 'Bart';
    expect(handler, 'Do not fire onChange if rules are set to the current value').toHaveBeenCalledTimes(3);
    filter.withoutOnChange(() => (filter.include = 'Homer'));
    expect(handler, 'Do not fire onChange when wrapping call in filter.withoutOnChange').toHaveBeenCalledTimes(3);
  });

  test('Wrapped entity', () => {
    const wrappedPeople: Record<string, WrappedEntity<NamedEntity>> = Object.fromEntries(
      targets.map((p) => [p.name, wrap(p)])
    );
    const wrappedTargets = Object.values(wrappedPeople);
    const filter = new TextPropertyFilter<WrappedEntity<NamedEntity>>({ property: 'name' }, LOCALE);
    filter.include = 'Bart';
    expect(filter.apply(wrappedTargets), 'Include wrapped').toEqual([wrappedPeople['Bart']]);
  });

  test('Custom entity getter', () => {
    // Use the wrapper’s name property instead of the entity itself. We add a prefixed name to the wrapper. (We also need to add answers to comply with the Entity type.)
    const wrappedPeople: Record<string, WrappedEntity<NamedEntity> & HasAnswers> = Object.fromEntries(
      targets.map((p) => [p.name, { ...wrap(p), name: `Wrapped ${p.name}`, answers: {} }])
    );
    const wrappedTargets = Object.values(wrappedPeople);
    const filter = new TextPropertyFilter<WrappedEntity<NamedEntity> & HasAnswers>(
      {
        property: 'name',
        entityGetter: (e) => e
      },
      LOCALE
    );
    filter.include = 'Wrapped Bart';
    expect(filter.apply(wrappedTargets), 'Include wrapped').toEqual([wrappedPeople['Bart']]);
  });

  test('Active filter', () => {
    const filter = new TextPropertyFilter<NamedEntity>({ property: 'name' }, LOCALE);
    expect(filter.active, 'Not active by default').toBe(false);
    filter.include = 'Bart';
    expect(filter.active, 'Active if changed').toBe(true);
    filter.reset();
    expect(filter.active, 'Not active if reset').toBe(false);
  });
});

test('TextQuestionFilter', () => {
  const names = ['Bart', 'Homer', 'Marge'];
  const question = new TextQuestion({
    root,
    data: { id: 'rightId', type: 'text', name: '', categoryId: '' }
  });
  const people: Record<string, AnsweringEntity> = Object.fromEntries(
    names.map((n) => [
      n,
      new AnsweringEntity({
        rightId: n,
        wrongId: undefined
      })
    ])
  );
  const targets = Object.values(people);
  const filter = new TextQuestionFilter({ question }, LOCALE);
  filter.include = 'Bart';
  expect(filter.apply(targets), 'Exact match').toEqual([people['Bart']]);
  filter.include = 'a';
  expect(filter.apply(targets), 'Substring match').toEqual([people['Bart'], people['Marge']]);
  filter.include = 'xxxx';
  expect(filter.apply(targets), 'No match').toEqual([]);
});

describe('TextQuestionFilter: multiple values', () => {
  const names = ['Bart', 'Homer', 'Marge'];
  const values = [
    ['Pizza', 'Hamburger'],
    ['Pasta', 'Hamburger'],
    ['Broccoli', 'Suet']
  ];
  const question = new MultipleTextQuestion({
    root,
    data: { id: 'rightId', type: 'multipleText', name: '', categoryId: '' }
  });
  const people: Record<string, AnsweringEntity> = Object.fromEntries(
    names.map((n, i) => [
      n,
      new AnsweringEntity({
        rightId: values[i],
        wrongId: undefined
      })
    ])
  );
  const targets = Object.values(people);
  test('Should return all that have the included item', () => {
    const filter = new TextQuestionFilter({ question }, LOCALE);
    filter.include = 'Hamburger';
    expect(filter.apply(targets)).toEqual(expect.arrayContaining([people['Bart'], people['Homer']]));
  });
  test('Should return all that partally match the included item', () => {
    const filter = new TextQuestionFilter({ question }, LOCALE);
    filter.include = 'Hambu';
    expect(filter.apply(targets)).toEqual(expect.arrayContaining([people['Bart'], people['Homer']]));
  });
  test('Should not return those excluded', () => {
    const filter = new TextQuestionFilter({ question }, LOCALE);
    filter.include = 'Hamburger';
    filter.exclude = 'Pasta';
    expect(filter.apply(targets)).toEqual([people['Bart']]);
  });
  test('Should not return all if none are excluded', () => {
    const filter = new TextQuestionFilter({ question }, LOCALE);
    filter.exclude = 'None of the above';
    expect(filter.apply(targets)).toEqual(expect.arrayContaining(Object.values(people)));
  });
});

test('ChoiceQuestionFilter', () => {
  const choices: Array<Choice> = [
    { id: '0', label: 'M' }, // 3rd in alhabetical order in the 'fi' locale
    { id: '1', label: 'A' }, // 1st
    { id: '2', label: 'Ä' }, // 4th
    { id: '3', label: 'E' }, // 2nd
    { id: '4', label: 'X' } // Should not be included because not present in answers
  ];
  const question = choiceQuestion('rightId', choices);
  const answers = ['0', '1', '1', '2', '3'];
  const people: Array<AnsweringEntity> = answers.map(
    (a) =>
      new AnsweringEntity({
        wrongId: undefined,
        rightId: a
      })
  );
  const filter = new ChoiceQuestionFilter({ question }, 'fi');
  expect(filter.active, 'Not active by default').toBe(false);
  expect(filter.apply(people), 'Include all by default').toEqual(people);
  filter.include = ['0'];
  expect(filter.active, 'Active if changed').toBe(true);
  expect(filter.apply(people), 'Exact match').toEqual([people[0]]);
  filter.include = ['1', '3'];
  expect(filter.apply(people), 'Multiple match').toEqual([people[1], people[2], people[4]]);
  filter.reset();
  filter.exclude = ['0', '1'];
  expect(filter.apply(people), 'Exclude').toEqual([people[3], people[4]]);
  expect(
    filter.parseValues(people).map((v) => v.value),
    'Value sorting and exclusion of those not present in answers'
  ).toEqual(['1', '3', '0', '2']);
  expect(
    filter.parseValues(people).map((v) => v.object),
    'Choice objects in values'
  ).toEqual([choices[1], choices[3], choices[0], choices[2]]);
  filter.reset();
  expect(filter.active, 'Not active if reset').toBe(false);
});

test('ChoiceQuestionFilter: missing values', () => {
  const choices: Array<Choice> = [
    { id: '0', label: 'M' }, // 3rd in alhabetical order in the 'fi' locale
    { id: '1', label: 'A' }, // 1st
    { id: '2', label: 'Ä' }, // 4th
    { id: '3', label: 'E' } // 2nd
  ];
  const question = choiceQuestion('rightId', choices);
  const answers = ['0', '1', '1', '2', undefined];
  const people: Array<AnsweringEntity> = answers.map(
    (a) =>
      new AnsweringEntity({
        wrongId: undefined,
        rightId: a
      })
  );
  const filter = new ChoiceQuestionFilter({ question }, 'fi');
  expect(filter.apply(people), 'Include all by default').toEqual(people);
  filter.include = ['0'];
  expect(filter.apply(people), 'Do not include missing').toEqual([people[0]]);
  filter.include = ['1', MISSING_VALUE];
  expect(filter.apply(people), 'Explicitly include missing').toEqual([people[1], people[2], people[4]]);
  filter.reset();
  filter.exclude = ['0', '1'];
  expect(filter.apply(people), 'Exclude does not exluce missing by default').toEqual([people[3], people[4]]);
  filter.reset();
  filter.exclude = ['0', '1', MISSING_VALUE];
  expect(filter.apply(people), 'Explicitly exclude missing').toEqual([people[3]]);
  expect(
    filter.parseValues(people).map((v) => v.value),
    'Value sorting with missing value'
  ).toEqual(['1', '0', '2', MISSING_VALUE]);
  expect(
    filter.parseValues(people).map((v) => v.object),
    'Choice objects in values'
  ).toEqual([choices[1], choices[0], choices[2], undefined]);
});

test('ChoiceQuestionFilter: multipleVAlues', () => {
  const choices: Array<Choice> = [
    { id: '0', label: 'M' }, // 3rd in alhabetical order in the 'fi' locale
    { id: '1', label: 'A' }, // 1st
    { id: '2', label: 'Ä' }, // 4th
    { id: '3', label: 'E' } // 2nd
  ];
  const question = choiceQuestion('rightId', choices, true);
  const answers = [
    ['0', '1'],
    ['1', '2'],
    ['2', '3'],
    ['0', '1', '2', '3']
  ];
  const people: Array<AnsweringEntity> = answers.map(
    (a) =>
      new AnsweringEntity({
        wrongId: undefined,
        rightId: a
      })
  );
  const filter = new ChoiceQuestionFilter({ question }, 'fi');
  expect(filter.active, 'Not active by default').toBe(false);
  expect(filter.apply(people), 'Include all by default').toEqual(people);
  filter.include = ['0'];
  expect(filter.active, 'Active if changed').toBe(true);
  expect(filter.apply(people), 'Exact match').toEqual([people[0], people[3]]);
  filter.include = ['2', '3'];
  expect(filter.apply(people), 'Multiple match').toEqual([people[1], people[2], people[3]]);
  filter.reset();
  filter.exclude = ['0', '1'];
  expect(filter.apply(people), 'Exclude').toEqual([people[2]]);
  filter.reset();
  expect(filter.active, 'Not active if reset').toBe(false);
  const singleQuestion = choiceQuestion('rightId', choices, false);
  const singleFilter = new ChoiceQuestionFilter({ question: singleQuestion }, 'fi');
  expect(() => singleFilter.apply(people), 'Disallow casting of arrays to single value types').toThrow();
});

test('ObjectFilter', () => {
  const partyData = [
    { id: '0', name: 'M party' }, // 3rd in alhabetical order in the 'fi' locale
    { id: '1', name: 'A party' }, // 1st
    { id: '2', name: 'Ä party' }, // 4th
    { id: '3', name: 'E party' } // 2nd
  ];
  const parties = partyData.map((d) => new Party(d.id, d.name));
  const memberships = [0, 1, 1, 2, 3];
  const people: Array<PartyMember> = memberships.map((m) => new PartyMember(parties[m]));
  const filter = new ObjectFilter<PartyMember, Party>(
    {
      property: 'party',
      keyProperty: 'id',
      labelProperty: 'name',
      objects: parties
    },
    'fi'
  );
  expect(filter.active, 'Not active by default').toBe(false);
  expect(filter.apply(people), 'Include all by default').toEqual(people);
  filter.include = ['0'];
  expect(filter.active, 'Active if changed').toBe(true);
  expect(filter.apply(people), 'Exact match').toEqual([people[0]]);
  filter.include = ['1', '3'];
  expect(filter.apply(people), 'Multiple match').toEqual([people[1], people[2], people[4]]);
  filter.reset();
  filter.exclude = ['0', '1'];
  expect(filter.apply(people), 'Exclude').toEqual([people[3], people[4]]);
  expect(
    filter.parseValues(people).map((v) => v.value),
    'Value sorting'
  ).toEqual(['1', '3', '0', '2']);
  expect(
    filter.parseValues(people).map((v) => v.object),
    'Objects in values'
  ).toEqual([parties[1], parties[3], parties[0], parties[2]]);
  filter.reset();
  expect(filter.active, 'Not active if reset').toBe(false);
});

test('NumberQuestionFilter', () => {
  const ages = [10, 40, 50, 90, undefined];
  const question = new NumberQuestion({
    root,
    data: { id: 'rightId', type: 'number', name: '', categoryId: '' }
  });
  const people: Array<AnsweringEntity> = ages.map(
    (a) =>
      new AnsweringEntity({
        wrongId: undefined,
        rightId: a
      })
  );
  const filter = new NumberQuestionFilter({ question });
  expect(filter.active, 'Not active by default').toBe(false);
  expect(filter.apply(people), 'Include all by default').toEqual(people);
  filter.min = 20;
  expect(filter.active, 'Active if changed').toBe(true);
  expect(filter.apply(people), 'Min match, including missing').toEqual([people[1], people[2], people[3], people[4]]);
  filter.excludeMissing = true;
  expect(filter.apply(people), 'Min match, excluding missing').toEqual([people[1], people[2], people[3]]);
  filter.max = 50;
  expect(filter.apply(people), 'Min and max match, excluding missing').toEqual([people[1], people[2]]);
  filter.min = 50;
  expect(filter.apply(people), 'Min == max match, excluding missing').toEqual([people[2]]);
  filter.reset();
  filter.max = 45;
  expect(filter.apply(people), 'Max match, including missing').toEqual([people[0], people[1], people[4]]);
  expect(filter.parseValues(people), 'Min and max values and number of missing').toEqual({
    min: 10,
    max: 90,
    missingValues: 1
  });
  filter.reset();
  expect(filter.active, 'Not active if reset').toBe(false);
  filter.excludeMissing = false;
  expect(filter.active, 'Not active if exlude missing is false').toBe(false);
});

test('FilterGroup', () => {
  const partyData = [
    { id: '0', name: 'M party' }, // 3rd in alhabetical order in the 'fi' locale
    { id: '1', name: 'A party' }, // 1st
    { id: '2', name: 'Ä party' }, // 4th
    { id: '3', name: 'E party' } // 2nd
  ];
  const parties = partyData.map((d) => new Party(d.id, d.name));
  const memberships = [0, 1, 2, 3]; // Indeces, not ids
  const ages = [10, 40, 50, 90];
  const question = new NumberQuestion({
    root,
    data: { id: 'age', type: 'number', name: '', categoryId: '' }
  });
  const people: Array<AnsweringPartyMember> = memberships.map(
    (m, i) => new AnsweringPartyMember({ age: ages[i] }, parties[m])
  );
  const partyFilter = new ObjectFilter<AnsweringPartyMember, Party>(
    {
      property: 'party',
      keyProperty: 'id',
      labelProperty: 'name',
      objects: parties
    },
    'fi'
  );
  const ageFilter = new NumberQuestionFilter<AnsweringPartyMember>({ question });
  const group = new FilterGroup([partyFilter, ageFilter]);
  expect(group.active, 'Not active by default').toBe(false);
  expect(group.apply(people), 'Include all by default').toEqual(people);
  expect(new FilterGroup([]).apply(people), 'Empty filter group should return all').toEqual(people);
  partyFilter.include = ['0', '1'];
  expect(group.apply(people), 'Changes from one filter').toEqual([people[0], people[1]]);
  ageFilter.min = 40;
  ageFilter.max = 50;
  expect(group.apply(people), 'Results from two filters').toEqual([people[1]]);
  expect(group.active, 'Active if filters active').toBe(true);
  group.logicOperator = LOGIC_OP.Or;
  expect(group.apply(people), 'Change logic op to Or').toEqual([people[0], people[1], people[2]]);
  group.reset();
  expect(group.apply(people), 'Reset group').toEqual(people);
  expect(group.active, 'Not active if reset').toBe(false);
  expect(group.logicOperator, 'Reset group').toEqual(LOGIC_OP.And);
});

//////////////////////////////////////////////////////////////////////////////////////////
// UTILITIES
//////////////////////////////////////////////////////////////////////////////////////////

/**
 * An entity with a name.
 */
class NamedEntity implements HasAnswers {
  constructor(public name: string | undefined) {}
  answers: AnswerDict = {};
}

/**
 * An entity with answers.
 */
class AnsweringEntity implements HasAnswers {
  answers: AnswerDict = {};
  constructor(answers: Record<string, Answer['value']>) {
    Object.entries(answers).forEach(([id, value]) => (this.answers[id] = { value }));
  }
}

/**
 * An entity with a party property.
 */
class PartyMember implements HasAnswers {
  constructor(public party: Party) {}
  answers: AnswerDict = {};
}

/**
 * An entity with a party property and answers
 */
class AnsweringPartyMember extends AnsweringEntity {
  constructor(
    answers: Record<string, Answer['value']>,
    public party: Party
  ) {
    super(answers);
  }
}

/**
 * Create a wrapped entity.
 */
function wrap<TEntity extends HasAnswers>(entity: TEntity): WrappedEntity<TEntity> {
  return {
    entity
  };
}

/**
 * A party object for use with ObjectFilter.
 */
class Party {
  constructor(
    public id: string,
    public name: string
  ) {}
}

/**
 * A single or multiple choice question
 */
function choiceQuestion(
  id: string,
  choices: Array<Choice>,
  isMultiple: boolean = false
): MultipleChoiceCategoricalQuestion | SingleChoiceCategoricalQuestion {
  return isMultiple
    ? new MultipleChoiceCategoricalQuestion({
        root,
        data: { id, choices, name: '', categoryId: '', type: 'multipleChoiceCategorical' }
      })
    : new SingleChoiceCategoricalQuestion({
        root,
        data: { id, choices, name: '', categoryId: '', type: 'singleChoiceCategorical' }
      });
}
