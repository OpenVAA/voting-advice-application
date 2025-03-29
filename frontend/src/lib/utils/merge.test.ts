import { test, describe, expect } from 'vitest';
import { mergeSettings } from './merge';

/**
 * Tests for the mergeSettings function.
 * 
 * The mergeSettings function performs a deep merge of two plain objects.
 * It overrides values from the target object with values from the source object,
 * merging nested objects recursively. Primitive values and arrays are replaced,
 * and function properties are overwritten.
 */
describe('mergeSettings', () => {
  /**
   * Test that merging flat objects works correctly.
   * This test verifies that for flat objects, properties present in both objects
   * are overwritten by the source object, and new keys from the source are added.
   */
  test('merges flat objects', () => {
    const obj1 = { name: 'Anna', age: 30 };
    const obj2 = { age: 35, city: 'Helsinki' };

    const result = mergeSettings(obj1, obj2);

    expect(result).toEqual({
      name: 'Anna',
      age: 35, // Source value overrides target value.
      city: 'Helsinki', // New key from source is added.
    });
  });

  /**
   * Test that nested objects are merged deeply.
   * This test ensures that nested objects are recursively merged. Keys in the nested object
   * from the source are added without losing keys from the target.
   */
  test('merges nested objects deeply', () => {
    const obj1 = {
      user: {
        name: 'Anna',
        details: { age: 30 },
      },
    };
    const obj2 = {
      user: {
        details: { city: 'Helsinki' },
      },
    };

    const result = mergeSettings(obj1, obj2);

    expect(result).toEqual({
      user: {
        name: 'Anna',
        details: {
          age: 30,
          city: 'Helsinki', // Merged into details.
        },
      },
    });
  });

  /**
   * Test that primitive values are overwritten.
   * This test verifies that if both objects have a property with a primitive value,
   * the source object's value overwrites the target's.
   */
  test('overwrites primitive values', () => {
    const obj1 = { value: 10 };
    const obj2 = { value: 20 };

    const result = mergeSettings(obj1, obj2);

    expect(result).toEqual({ value: 20 }); // The primitive value is replaced.
  });

  /**
   * Test that arrays are replaced instead of merged.
   * This test checks that when both objects contain an array under the same key,
   * the source array completely replaces the target array.
   */
  test('replaces arrays instead of merging them', () => {
    const obj1 = { tags: ['a', 'b'] };
    const obj2 = { tags: ['c', 'd'] };

    const result = mergeSettings(obj1, obj2);

    expect(result).toEqual({ tags: ['c', 'd'] });
  });

  /**
   * Test that function properties are replaced.
   * This test ensures that if both objects have a function property,
   * the function from the source object overwrites the target's function.
   */
  test('replaces functions correctly', () => {
    const obj1 = {
      greet: () => 'Hello',
    };
    const obj2 = {
      greet: () => 'Hi',
    };

    const result = mergeSettings(obj1, obj2);

    expect(result.greet()).toBe('Hi');
  });

  /**
   * Test that nested function properties are replaced correctly.
   * This test confirms that if a nested object contains a function property,
   * the source function replaces the target function.
   */
  test('replaces nested functions correctly', () => {
    const obj1 = {
      nested: {
        greet: () => 'Hello from obj1',
      },
    };

    const obj2 = {
      nested: {
        greet: () => 'Hello from obj2',
      },
    };

    const result = mergeSettings(obj1, obj2);
    expect(result.nested.greet()).toBe('Hello from obj2');
  });

  /**
   * Test that deeply nested functions are replaced correctly.
   * This test checks that even for deeply nested objects, function properties
   * from the source object correctly replace those in the target.
   */
  test('replaces deeply nested functions correctly', () => {
    const obj1 = {
      level1: {
        level2: {
          say: () => 'First message',
        },
      },
    };

    const obj2 = {
      level1: {
        level2: {
          say: () => 'Second message',
        },
      },
    };

    const result = mergeSettings(obj1, obj2);
    expect(result.level1.level2.say()).toBe('Second message');
  });

  /**
   * Test that merging with an empty object works correctly.
   * This test verifies that if the target object is empty,
   * the result matches the source object.
   */
  test('merges with an empty object correctly', () => {
    const obj1 = {};
    const obj2 = { foo: 'bar' };

    const result = mergeSettings(obj1, obj2);

    expect(result).toEqual({ foo: 'bar' });
  });

  /**
   * Test that merging an object with itself returns the same content.
   * This test ensures that if the same object is provided as both target and source,
   * the merged result remains unchanged.
   */
  test('merging an object with itself returns the same object', () => {
    const obj = { a: 1, b: { c: 2 } };
    const result = mergeSettings(obj, obj);
    const expected = { a: 1, b: { c: 2 } };
  
    expect(result).toEqual(expected);
  });
  
  /**
   * Test that merging two empty objects returns an empty object.
   * This test confirms that when both target and source are empty,
   * the function returns an empty object.
   */
  test('merging two empty objects returns an empty object', () => {
    const result = mergeSettings({}, {});

    expect(result).toEqual({});
  });

  /**
   * Test that null values are handled correctly.
   * This test verifies that a null value in the target object is overridden by a non-null value
   * from the source object.
   */
  test('preserves null values', () => {
    const obj1 = { key: null };
    const obj2 = { key: 'value' };

    const result = mergeSettings(obj1, obj2);

    expect(result).toEqual({ key: 'value' }); // Null is overridden by the source value.
  });

  /**
   * Test that undefined values are handled correctly.
   * This test checks that if the source object explicitly sets a property to undefined,
   * the resulting object contains undefined for that property.
   */
  test('preserves undefined values', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: undefined };

    const result = mergeSettings(obj1, obj2);

    expect(result).toEqual({ key: undefined });
  });

  /**
   * Test that deep nested objects remain unchanged if no new values are added.
   * This test ensures that if the source object is empty,
   * the target object's nested structure is preserved.
   */
  test('deep nested objects remain unchanged if no new values are added', () => {
    const obj1 = {
      user: {
        name: 'Anna',
        details: {
          age: 30,
          address: {
            city: 'Helsinki',
          },
        },
      },
    };
    const obj2 = {};
    const result = mergeSettings(obj1, obj2);
    const expected = {
      user: {
        name: 'Anna',
        details: {
          age: 30,
          address: {
            city: 'Helsinki',
          },
        },
      },
    };

    expect(result).toEqual(expected);
  });

  /**
   * Test that the function returns a new object and does not modify the input objects.
   * This test creates clones of the input objects and ensures that after merging,
   * the original objects remain unchanged and the result is a new object.
   */
  test('returns a new object and does not modify inputs', () => {
    const obj1 = { a: 1, nested: { b: 2 } };
    const obj2 = { c: 3 };
    // Create clones of the original objects for later comparison.
    const cloneObj1 = JSON.parse(JSON.stringify(obj1));
    const cloneObj2 = JSON.parse(JSON.stringify(obj2));

    const result = mergeSettings(obj1, obj2);

    expect(result).not.toBe(obj1);
    expect(result).not.toBe(obj2);
    expect(obj1).toEqual(cloneObj1);
    expect(obj2).toEqual(cloneObj2);
  });

  /**
   * Test that a primitive value is overwritten with an object if the type changes.
   * This test checks that if the target contains a primitive value and the source provides
   * an object for the same key, the object from the source overwrites the primitive.
   */
  test('overwrites primitive value with object', () => {
    const obj1 = { value: 1 };
    const obj2 = { value: { a: 'hello' } };

    const result = mergeSettings(obj1, obj2);

    expect(result).toEqual({ value: { a: 'hello' } });
  });

  /**
   * Test that an object value is overwritten with a primitive value if the type changes.
   * This test ensures that if the target contains an object and the source provides
   * a primitive value for the same key, the primitive value from the source overwrites the object.
   */
  test('overwrites object with primitive value', () => {
    const obj1 = { value: { a: 'hello' } };
    const obj2 = { value: 42 };

    const result = mergeSettings(obj1, obj2);

    expect(result).toEqual({ value: 42 });
  });

  /**
   * Test that arrays nested inside objects are replaced instead of merged.
   * This test verifies that when an array is nested within an object, the array from the source
   * completely replaces the array in the target.
   */
  test('replaces nested arrays instead of merging them', () => {
    const obj1 = { a: { tags: ['a', 'b'] } };
    const obj2 = { a: { tags: ['c', 'd'] } };

    const result = mergeSettings(obj1, obj2);

    expect(result).toEqual({ a: { tags: ['c', 'd'] } });
  });

  /**
   * Test that merging objects with circular references throws an error.
   * Note: Since mergeSettings does not support circular references,
   * we expect this operation to throw an error.
   */
  test('throws error when merging objects with circular references', () => {
    const obj1: any = { a: 1 };
    // Create a circular reference.
    obj1.self = obj1;
    const obj2 = { b: 2 };

    expect(() => mergeSettings(obj1, obj2)).toThrow();
  });

  /**
   * Test that merging objects with constructed objects (e.g., Date) handles the values as expected.
   * Since mergeSettings does not officially support constructed objects, the behavior might be unexpected.
   * In this test, we check that the Date from the source object replaces the target's Date.
   */
  test('handles constructed objects like Date correctly', () => {
    const date = new Date();
    const obj1 = { time: date };
    const obj2 = { time: new Date(date.getTime() + 1000) };

    const result = mergeSettings(obj1, obj2);
    // We expect that the source Date replaces the target Date.
    expect(result.time.getTime()).toBe(new Date(date.getTime() + 1000).getTime());
  });
});
