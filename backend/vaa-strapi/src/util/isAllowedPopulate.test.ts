import { expect, test } from 'vitest';
import { isAllowedPopulate } from './isAllowedPopulate';

test('Should return true when forbidden keys are not found', () => {
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: {
            bar: true
          }
        }
      },
      ['admin', 'user']
    )
  ).toBe(true);
});

test('Should return true when forbidden keys are not found in arrays', () => {
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: [
            {
              bar: true
            },
            {
              other: true
            }
          ]
        }
      },
      ['admin', 'user']
    )
  ).toBe(true);
});

test('Should return true when forbidden keys are not found in values', () => {
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: 'bar'
        }
      },
      ['admin', 'user']
    )
  ).toBe(true);
});

test('Should return true when nothing is forbidden', () => {
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: {
            bar: true
          }
        }
      },
      []
    )
  ).toBe(true);
});

test('Should return false when forbidden keys are found as keys', () => {
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: {
            user: true
          }
        }
      },
      ['admin', 'user']
    )
  ).toBe(false);
});

test('Should return false when forbidden keys are found in arrays', () => {
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: [
            {
              user: true
            },
            {
              other: true
            }
          ]
        }
      },
      ['admin', 'user']
    )
  ).toBe(false);
});

test('Should return false when forbidden keys are found in values', () => {
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: 'admin'
        }
      },
      ['admin', 'user']
    )
  ).toBe(false);
});

test('Should return false when * is found', () => {
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: '*'
        }
      },
      ['admin', 'user']
    )
  ).toBe(false);
});

test('Should return true when * is found and allowStar is true', () => {
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: '*'
        }
      },
      ['admin', 'user'],
      true
    )
  ).toBe(true);
});

test('Should return false when non-plain objects are present', () => {
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: new Date()
        }
      },
      ['admin', 'user']
    )
  ).toBe(false);
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: new Set()
        }
      },
      ['admin', 'user']
    )
  ).toBe(false);
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: new Map()
        }
      },
      ['admin', 'user']
    )
  ).toBe(false);
});

test('Should return false when other scalars except booleans and strings are present', () => {
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: 42
        }
      },
      ['admin', 'user']
    )
  ).toBe(false);
  expect(
    isAllowedPopulate(
      {
        foo: {
          populate: Symbol()
        }
      },
      ['admin', 'user']
    )
  ).toBe(false);
});
