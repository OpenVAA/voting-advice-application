/**
 * Every built-in template owns an external-id prefix no other built-in shares or overlaps.
 *
 * Teardown deletes by `external_id LIKE '<prefix>%'`, so two built-ins whose prefixes are equal, or where one is a string-prefix of the other, would delete and count each other's rows. A template that declares an empty `externalIdPrefix` writes its `fixed[]` external_ids pre-prefixed, so its prefix is read off those rows.
 */

import { describe, expect, it } from 'vitest';
import { BUILT_IN_TEMPLATES } from './index';
import { DEFAULT_EXTERNAL_ID_PREFIX } from '../ctx';
import type { Template } from '../template/types';

/**
 * The prefix a template's rows carry: its `externalIdPrefix`, the writer's default when it declares none, or, when it declares an empty one, the longest common prefix of its `fixed[]` external_ids up to the last `-` or `_`.
 *
 * @param name - the template's built-in name, which a failure names.
 * @param template - the template.
 * @returns the prefix.
 */
function effectivePrefixOf(name: string, template: Template): string {
  if (template.externalIdPrefix === undefined) return DEFAULT_EXTERNAL_ID_PREFIX;
  if (template.externalIdPrefix !== '') return template.externalIdPrefix;

  const externalIds = Object.values(template as Record<string, unknown>).flatMap((fragment) => {
    const fixed = (fragment as { fixed?: unknown } | null)?.fixed;
    if (!Array.isArray(fixed)) return [];
    return fixed.map((row) => (row as { external_id?: unknown }).external_id).filter((id) => typeof id === 'string');
  }) as Array<string>;
  if (externalIds.length === 0) throw new Error(`${name} declares an empty externalIdPrefix and has no fixed rows`);

  let common = externalIds[0];
  for (const id of externalIds) {
    while (!id.startsWith(common)) common = common.slice(0, -1);
  }
  const separator = Math.max(common.lastIndexOf('-'), common.lastIndexOf('_'));
  return common.slice(0, separator + 1);
}

const PREFIXES = Object.entries(BUILT_IN_TEMPLATES).map(([name, template]) => ({
  name,
  prefix: effectivePrefixOf(name, template)
}));

describe('built-in template external-id prefixes', () => {
  it("reads e2e/base's prefix off its pre-prefixed fixed rows", () => {
    expect(PREFIXES.find(({ name }) => name === 'e2e/base')?.prefix).toBe('test-e2e-base-');
  });

  it('gives every built-in a non-empty prefix', () => {
    for (const { name, prefix } of PREFIXES) expect(prefix.length, name).toBeGreaterThan(0);
  });

  it('gives no two built-ins equal or overlapping prefixes', () => {
    const conflicts: Array<string> = [];
    for (const [index, a] of PREFIXES.entries()) {
      for (const b of PREFIXES.slice(index + 1)) {
        if (a.prefix.startsWith(b.prefix) || b.prefix.startsWith(a.prefix)) {
          conflicts.push(`${a.name} ('${a.prefix}') and ${b.name} ('${b.prefix}')`);
        }
      }
    }
    expect(conflicts).toEqual([]);
  });
});
