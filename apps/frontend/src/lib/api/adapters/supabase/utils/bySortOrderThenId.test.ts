import { describe, expect, it } from 'vitest';
import { bySortOrderThenId } from './bySortOrderThenId';

type Row = { id: string; sort_order: number | null };

function ids(rows: Array<Row>): Array<string> {
  return rows.map((row) => row.id);
}

describe('bySortOrderThenId', () => {
  it('sorts numeric sort_order ascending', () => {
    const rows: Array<Row> = [
      { id: 'a', sort_order: 3 },
      { id: 'b', sort_order: 1 },
      { id: 'c', sort_order: 2 }
    ];
    expect(ids([...rows].sort(bySortOrderThenId))).toEqual(['b', 'c', 'a']);
  });

  it('sorts a null sort_order after every numeric one', () => {
    const rows: Array<Row> = [
      { id: 'a', sort_order: null },
      { id: 'b', sort_order: 10 },
      { id: 'c', sort_order: -1 }
    ];
    expect(ids([...rows].sort(bySortOrderThenId))).toEqual(['c', 'b', 'a']);
    expect(bySortOrderThenId({ id: 'a', sort_order: null }, { id: 'b', sort_order: 0 })).toBeGreaterThan(0);
    expect(bySortOrderThenId({ id: 'a', sort_order: 0 }, { id: 'b', sort_order: null })).toBeLessThan(0);
  });

  it('falls back to ascending id when sort_order is equal, including when both are null', () => {
    const rows: Array<Row> = [
      { id: 'd', sort_order: null },
      { id: 'b', sort_order: 1 },
      { id: 'c', sort_order: null },
      { id: 'a', sort_order: 1 }
    ];
    expect(ids([...rows].sort(bySortOrderThenId))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('returns 0 only for equal id and sort_order', () => {
    expect(bySortOrderThenId({ id: 'a', sort_order: 1 }, { id: 'a', sort_order: 1 })).toBe(0);
    expect(bySortOrderThenId({ id: 'a', sort_order: null }, { id: 'a', sort_order: null })).toBe(0);
    expect(bySortOrderThenId({ id: 'a', sort_order: 1 }, { id: 'b', sort_order: 1 })).not.toBe(0);
    expect(bySortOrderThenId({ id: 'a', sort_order: 1 }, { id: 'a', sort_order: 2 })).not.toBe(0);
  });

  it('does not mutate its inputs', () => {
    const a: Row = { id: 'b', sort_order: null };
    const b: Row = { id: 'a', sort_order: 2 };
    bySortOrderThenId(a, b);
    expect(a).toEqual({ id: 'b', sort_order: null });
    expect(b).toEqual({ id: 'a', sort_order: 2 });
  });
});
