import { describe, expect, it, vi } from 'vitest';
import { computeFiltered, countActiveFilters } from './helpers';

/**
 * The unit-level contract for the two pure helpers exported by `helpers.ts` — `computeFiltered` and `countActiveFilters`. This file verifies those two functions and nothing else: its module graph is exactly `vitest` plus `./helpers`, and the helper itself has no imports, so `EntityListWithControls.svelte` is not loaded here `[VERIFIED: the import block above; helpers.ts:1-32]`.
 *
 * The contract asserted below, in full:
 *
 * - `computeFiltered(entities, filterGroup, searchFilter)` applies the filter
 *   group first and the search filter to the *group's result*, returns a fresh array without mutating its input, and passes the list through unchanged for whichever of the two filters is `undefined` `[VERIFIED: helpers.ts:14-21]`.
 * - Each `computeFiltered` call invokes the group's `apply` exactly once —
 *   the boundedness property — and the value it returns is the group's own output, not the unfiltered input.
 * - `countActiveFilters(filterGroup)` returns the number of filters whose
 *   `active` flag is set, and 0 when no group is supplied `[VERIFIED: helpers.ts:29-32]`.
 *
 * The version-counter bridge that makes the component's `$derived.by` re-run is a *different* contract with a different owner: it is verified by `filterContext.svelte.test.ts:204` ("mutating a filter rule bumps the version counter so $derived consumers re-run"). The "Contract 5" label this docblock previously used for that test does not exist in that file — its tests are titled by behaviour, not numbered — so the pointer is given as a line and a title instead.
 */

class FakeFilter {
  name: string;
  active = false;
  constructor(name = 'f') {
    this.name = name;
  }
  apply<TVal>(targets: Array<TVal>): Array<TVal> {
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
  apply<TVal>(targets: Array<TVal>): Array<TVal> {
    this.applySpy(targets);
    return this.active ? [] : [...targets];
  }
}

class FakeSearchFilter {
  applySpy = vi.fn();
  rule = '';
  apply<TVal>(targets: Array<TVal>): Array<TVal> {
    this.applySpy(targets);
    if (!this.rule) return [...targets];
    return targets.filter((t) => String((t as unknown as { name?: string }).name ?? '').includes(this.rule));
  }
}

describe('computeFiltered / countActiveFilters (EntityListWithControls pure helpers)', () => {
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

    it('returns the group-narrowed list on every mutation cycle, with exactly one apply() per call', () => {
      const entities = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
      const group = new FakeGroup([new FakeFilter('f1')]);
      const cycles = 10;
      // Simulate `cycles` mutation cycles (each cycle: toggle + recompute via the helper), collecting what the helper actually RETURNED rather than discarding it.
      const observed: Array<Array<{ name: string }>> = [];
      for (let i = 0; i < cycles; i++) {
        group.filters[0].setActive(i % 2 === 0);
        observed.push(computeFiltered(entities, group, undefined));
      }

      // Boundedness — one apply() per computeFiltered call, no recursive or extra calls.
      // Ordered FIRST deliberately: it is the assertion this test used to make ALONE, and running it before the value assertion is what lets a single injected run show that the call count stays satisfied while the value assertion catches the defect.
      // Its expected value is tied to `observed.length`, so it can no longer be the literal-versus-literal comparison it once was.
      expect(group.applySpy).toHaveBeenCalledTimes(observed.length);

      // Independently derived from the fakes' documented semantics, NOT from the loop bound: `FakeGroup.apply` returns [] while any filter is active and a copy of the input otherwise (see :40-43), and the loop activates the filter on even `i`.
      // Do not simplify this back into a comparison against a value the loop itself produced — that is exactly the self-referential `10 === 10` this assertion replaced.
      const expected = Array.from({ length: cycles }, (_, i) => (i % 2 === 0 ? [] : entities));
      expect(observed).toEqual(expected);
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
