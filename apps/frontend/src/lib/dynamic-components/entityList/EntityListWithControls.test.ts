import { describe, expect, it, vi } from 'vitest';
import { computeFiltered, countActiveFilters } from './EntityListWithControls.helpers';

/**
 * Pure-helper unit tests for `EntityListWithControls`. The component itself
 * is a thin wrapper around the `$derived.by(() => computeFiltered(...))`
 * pattern; testing the helper directly is the cheapest way to validate the
 * contract that "filter mutation narrows the rendered list" without standing
 * up the full appContext + locale + i18n surface a `mount()`-based test
 * would need.
 *
 * The version-counter bridge that triggers re-runs is tested in
 * `filterContext.svelte.test.ts` Contract 5; the bounded-re-run smoke
 * (Contract 4 below) is asserted by counting calls to `apply()` spies.
 */

class FakeFilter {
  name: string;
  active = false;
  constructor(name = 'f') {
    this.name = name;
  }
  apply<T>(targets: Array<T>): Array<T> {
    return this.active ? [] : [...targets];
  }
  setActive(v: boolean) {
    this.active = v;
  }
}

class FakeGroup {
  filters: Array<FakeFilter>;
  applySpy = vi.fn();
  constructor(filters: Array<FakeFilter>) {
    this.filters = filters;
  }
  get active() {
    return this.filters.some((f) => f.active);
  }
  apply<T>(targets: Array<T>): Array<T> {
    this.applySpy(targets);
    return this.active ? [] : [...targets];
  }
}

class FakeSearchFilter {
  applySpy = vi.fn();
  rule = '';
  apply<T>(targets: Array<T>): Array<T> {
    this.applySpy(targets);
    if (!this.rule) return [...targets];
    return targets.filter((t) =>
      String((t as unknown as { name?: string }).name ?? '').includes(this.rule)
    );
  }
}

describe('EntityListWithControls helpers', () => {
  describe('computeFiltered', () => {
    it('Contract 1: returns the original list when filterGroup is undefined and no searchFilter', () => {
      const entities = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
      const result = computeFiltered(entities, undefined, undefined);
      expect(result).toEqual(entities);
      // Reference equality on items — not a copy of items themselves
      expect(result[0]).toBe(entities[0]);
      expect(result[2]).toBe(entities[2]);
    });

    it('Contract 2: returns the original list when filterGroup has only inactive filters', () => {
      const entities = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
      const group = new FakeGroup([new FakeFilter('f1')]);
      const result = computeFiltered(entities, group, undefined);
      expect(result).toEqual(entities);
    });

    it('Contract 3: list shrinks when a filter becomes active', () => {
      const entities = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
      const group = new FakeGroup([new FakeFilter('f1')]);
      // Inactive → full list
      expect(computeFiltered(entities, group, undefined)).toEqual(entities);
      // Activate filter → empty list (FakeGroup.apply returns [] when active)
      group.filters[0].setActive(true);
      expect(computeFiltered(entities, group, undefined)).toEqual([]);
    });

    it('Contract 4: bounded apply() invocations under a flurry of filter mutations', () => {
      const entities = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
      const group = new FakeGroup([new FakeFilter('f1')]);
      // Simulate 10 mutation cycles (each cycle: toggle + recompute via the helper)
      for (let i = 0; i < 10; i++) {
        group.filters[0].setActive(i % 2 === 0);
        computeFiltered(entities, group, undefined);
      }
      // Each computeFiltered call invokes apply once. 10 cycles → 10 invocations.
      // Bounded: the assertion proves no recursive/extra calls occur.
      expect(group.applySpy).toHaveBeenCalledTimes(10);
    });

    it('chains filterGroup → searchFilter (group runs first, search runs on the result)', () => {
      const entities = [{ name: 'apple' }, { name: 'banana' }, { name: 'cherry' }];
      const group = new FakeGroup([new FakeFilter('f1')]);
      const search = new FakeSearchFilter();
      search.rule = 'an';

      // No active group filter — group passes everything through; search narrows by 'an'
      const result = computeFiltered(entities, group, search);
      expect(group.applySpy).toHaveBeenCalledTimes(1);
      expect(search.applySpy).toHaveBeenCalledTimes(1);
      expect(result.map((e) => e.name)).toEqual(['banana']);
    });

    it('handles undefined searchFilter cleanly (no NPE)', () => {
      const entities = [{ name: 'A' }];
      const group = new FakeGroup([new FakeFilter('f1')]);
      expect(() => computeFiltered(entities, group, undefined)).not.toThrow();
    });
  });

  describe('countActiveFilters', () => {
    it('Contract 5: equals the count of active filters in the group', () => {
      const f1 = new FakeFilter('f1');
      const f2 = new FakeFilter('f2');
      const f3 = new FakeFilter('f3');
      const group = new FakeGroup([f1, f2, f3]);
      expect(countActiveFilters(group)).toBe(0);
      f1.setActive(true);
      expect(countActiveFilters(group)).toBe(1);
      f2.setActive(true);
      expect(countActiveFilters(group)).toBe(2);
      f3.setActive(true);
      expect(countActiveFilters(group)).toBe(3);
      f2.setActive(false);
      expect(countActiveFilters(group)).toBe(2);
    });

    it('returns 0 when filterGroup is undefined', () => {
      expect(countActiveFilters(undefined)).toBe(0);
    });
  });
});
