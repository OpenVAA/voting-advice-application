import { describe, expect, test } from 'vitest';
import { getEntity } from './getEntity';
import type { Entity } from './entity.type';

const ENTITY: Entity = { answers: {} };

describe('getEntity', () => {
  test('Should return the naked entity when given a plain object', () => {
    const result = getEntity(ENTITY);
    expect(result).toBe(ENTITY);
  });
  test('Should return the entity from a WrappedEntity object', () => {
    const result = getEntity({ entity: ENTITY });
    expect(result).toBe(ENTITY);
  });
  test('Should return the target from a WrappedEntity and MatchedEntity object', () => {
    const result = getEntity({ target: { entity: ENTITY } });
    expect(result).toBe(ENTITY);
  });
  test('Should return the target from a MatchedEntity object', () => {
    const result = getEntity({ target: ENTITY });
    expect(result).toBe(ENTITY);
  });
  test('Should throw an error when given a null value', () => {
    expect(() => getEntity(null as unknown as Entity)).toThrow();
  });
  test('Should throw an error when given a primitive value', () => {
    expect(() => getEntity('not an entity' as unknown as Entity)).toThrow();
  });
});
