import { describe, expect, it } from 'vitest';
import { hashIds } from './hashIds';
import type { HasId } from '@openvaa/core';

describe('hashIds', () => {
  it('should return empty string for undefined', () => {
    expect(hashIds(undefined)).toBe('');
  });

  it('should hash a single object', () => {
    const obj: HasId = { id: 'test-id' };
    expect(hashIds(obj)).toBe('test-id');
  });

  it('should hash an array of objects', () => {
    const objs: Array<HasId> = [{ id: 'id-1' }, { id: 'id-2' }, { id: 'id-3' }];
    expect(hashIds(objs)).toBe('id-1,id-2,id-3');
  });

  it('should sort IDs alphabetically', () => {
    const objs: Array<HasId> = [{ id: 'id-3' }, { id: 'id-1' }, { id: 'id-2' }];
    expect(hashIds(objs)).toBe('id-1,id-2,id-3');
  });

  it('should handle empty array', () => {
    expect(hashIds([])).toBe('');
  });

  it('should produce same hash for same objects in different order', () => {
    const objs1: Array<HasId> = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const objs2: Array<HasId> = [{ id: 'c' }, { id: 'a' }, { id: 'b' }];
    expect(hashIds(objs1)).toBe(hashIds(objs2));
  });

  it('should produce different hash for different objects', () => {
    const objs1: Array<HasId> = [{ id: 'a' }, { id: 'b' }];
    const objs2: Array<HasId> = [{ id: 'a' }, { id: 'c' }];
    expect(hashIds(objs1)).not.toBe(hashIds(objs2));
  });
});
