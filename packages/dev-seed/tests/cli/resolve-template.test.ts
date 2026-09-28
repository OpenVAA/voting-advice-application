/**
 * resolve-template.ts tests.
 */

import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resolveTemplate } from '../../src/cli/resolve-template';
import { validateTemplate } from '../../src/template/schema';
import { BUILT_IN_TEMPLATES } from '../../src/templates';
import type { Template } from '../../src/template/types';

const minimal: Template = { seed: 42 };

/**
 * A built-in that has DRIFTED — it carries an unknown top-level key.
 *
 * Built through an intermediate variable on purpose. Excess property checking is a fresh-object-literal rule, so a template that reaches the registry through a variable bypasses the type layer entirely — the documented hole in `FixedRow`. That is exactly the case the zod layer has to catch, so the fixture is constructed the way the hole actually manifests rather than with a cast that would prove nothing about the real failure mode.
 */
const driftedBuiltIn = { seed: 7, totallyUnknownTopLevelKey: 'drift' };
const DRIFTED_BUILT_INS: Record<string, Template> = { 'negctl-builtin': driftedBuiltIn };

// Temp JSON fixture
const TMP_JSON = join(tmpdir(), 'resolve-template-test.json');
const TMP_JSON_BAD = join(tmpdir(), 'resolve-template-test-bad.json');

beforeAll(() => {
  writeFileSync(TMP_JSON, JSON.stringify({ seed: 99, externalIdPrefix: 'x_' }));
  writeFileSync(TMP_JSON_BAD, JSON.stringify({ seed: 'not-a-number' }));
});
afterAll(() => {
  try {
    unlinkSync(TMP_JSON);
  } catch {
    /* ignore */
  }
  try {
    unlinkSync(TMP_JSON_BAD);
  } catch {
    /* ignore */
  }
});

describe('resolveTemplate', () => {
  it('resolves a known built-in name', async () => {
    const r = await resolveTemplate('default', { default: minimal });
    expect(r).toEqual(minimal);
  });

  it('throws for unknown name with built-in list + path suggestion', async () => {
    await expect(resolveTemplate('nope', {})).rejects.toThrow(/Unknown template: 'nope'/);
    await expect(resolveTemplate('nope', {})).rejects.toThrow(/Built-in templates:/);
    await expect(resolveTemplate('nope', {})).rejects.toThrow(/\.\/my-template\.ts/);
  });

  it('lists "(none registered yet)" when built-ins map is empty', async () => {
    await expect(resolveTemplate('nope', {})).rejects.toThrow(/\(none registered yet\)/);
  });

  it('lists built-in names when map is populated', async () => {
    await expect(resolveTemplate('nope', { default: minimal, e2e: minimal })).rejects.toThrow(/default, e2e/);
  });

  it('loads a .json template from absolute path', async () => {
    const r = await resolveTemplate(TMP_JSON, {});
    expect(r.seed).toBe(99);
    expect(r.externalIdPrefix).toBe('x_');
  });

  it('surfaces zod validation errors with template.* field paths', async () => {
    await expect(resolveTemplate(TMP_JSON_BAD, {})).rejects.toThrow(/template\.seed/);
  });

  it('treats `./rel.ts` as a path (not a name lookup)', async () => {
    await expect(resolveTemplate('./rel.ts', { default: minimal })).rejects.toThrow(/Failed to load template module/);
  });

  it('treats `./rel.js` as a path', async () => {
    await expect(resolveTemplate('./rel.js', { default: minimal })).rejects.toThrow(/Failed to load template module/);
  });

  it('treats absolute path starting with `/` as a path', async () => {
    await expect(resolveTemplate('/nonexistent/file.json', {})).rejects.toThrow(/Failed to parse JSON template/);
  });

  it('treats `default.md` as name lookup (extension not in {.ts,.js,.json})', async () => {
    await expect(resolveTemplate('default.md', {})).rejects.toThrow(/Unknown template/);
  });

  it('surfaces JSON.parse errors with path', async () => {
    const badJson = join(tmpdir(), 'malformed.json');
    writeFileSync(badJson, '{ not valid json');
    try {
      await expect(resolveTemplate(badJson, {})).rejects.toThrow(/Failed to parse JSON template at/);
    } finally {
      unlinkSync(badJson);
    }
  });

  // ── The built-in branch validates too.
  //
  // Return built-ins with a bare `return builtIn;` and the zod layer guards CUSTOM templates only: `default`, `e2e/base` and every `perm-*` bypass it at seed time, and a drifted key stays present on the returned object — measured. These cases are the standing regression guard for that, which is why they live here rather than in a transient probe.

  it('throws for a built-in carrying an unknown top-level key (was returned unvalidated)', async () => {
    await expect(resolveTemplate('negctl-builtin', DRIFTED_BUILT_INS)).rejects.toThrow(/Template validation failed/);
    await expect(resolveTemplate('negctl-builtin', DRIFTED_BUILT_INS)).rejects.toThrow(
      /Unrecognized key.*"totallyUnknownTopLevelKey"/
    );
  });

  it('a valid built-in still resolves, unchanged in substance', async () => {
    const r = await resolveTemplate('default', { default: minimal });
    expect(r).toEqual(minimal);
  });

  it('the `Unknown template:` path is unchanged by the added validation', async () => {
    await expect(resolveTemplate('nope', DRIFTED_BUILT_INS)).rejects.toThrow(/Unknown template: 'nope'/);
    await expect(resolveTemplate('nope', DRIFTED_BUILT_INS)).rejects.toThrow(/negctl-builtin/);
  });

  it('every registered built-in passes the strict schema', () => {
    // Iterates the REGISTRY, never a hard-coded name list, so a template added later is covered the day it is registered without editing this spec. The floor guards against the vacuous pass an accidentally-empty registry would otherwise produce.
    const names = Object.keys(BUILT_IN_TEMPLATES);
    expect(names.length).toBeGreaterThanOrEqual(30);
    const failures = names.flatMap((name) => {
      try {
        validateTemplate(BUILT_IN_TEMPLATES[name]);
        return [];
      } catch (err) {
        return [`${name}: ${(err as Error).message}`];
      }
    });
    expect(failures).toEqual([]);
  });

  it('built-in and filesystem entry paths reject the same drifted template identically', async () => {
    // Each path is already known to throw; what this adds is that they throw the SAME message, so the two entry points cannot drift into separately-correct behaviours.
    const drifted = { seed: 11, unknownKeyOnBothPaths: 'drift' };
    const driftedMap: Record<string, Template> = { 'parity-builtin': drifted };
    const tmpParity = join(tmpdir(), 'resolve-template-parity.json');
    writeFileSync(tmpParity, JSON.stringify(drifted));
    try {
      const viaBuiltIn = await resolveTemplate('parity-builtin', driftedMap).then(
        () => '',
        (err: Error) => err.message
      );
      const viaFilesystem = await resolveTemplate(tmpParity, {}).then(
        () => '',
        (err: Error) => err.message
      );
      expect(viaBuiltIn).toMatch(/Unrecognized key/);
      expect(viaFilesystem).toMatch(/Unrecognized key/);
      expect(viaBuiltIn).toEqual(viaFilesystem);
    } finally {
      unlinkSync(tmpParity);
    }
  });

  /**
   * `builtIns` is a plain object literal, so a bare `builtIns[arg]` also sees inherited members: `builtIns['toString']` is `Object.prototype.toString`, which is truthy, so the "Unknown template" branch is skipped and the function object is handed to `validateTemplate`.
   * With the built-in branch routed through the validator, the operator then sees `Template validation failed: template.: Invalid input`, with no list of built-ins and nothing naming the real mistake — hence the own-property lookup these cases pin.
   */
  describe('inherited Object.prototype keys are not built-in template names', () => {
    for (const inherited of ['toString', 'constructor', 'valueOf', 'hasOwnProperty']) {
      it(`reports '${inherited}' as an unknown template, with the built-in list`, async () => {
        // The real registry, not an empty map: `toString` must lose to the own-property check even when there ARE built-ins to list.
        const message = await resolveTemplate(inherited, BUILT_IN_TEMPLATES).then(
          () => '',
          (err: Error) => err.message
        );
        expect(message).toContain(`Unknown template: '${inherited}'`);
        expect(message).toContain('Built-in templates:');
        expect(message).toContain('default');
        // The failure mode this replaces — a zod complaint about a function.
        expect(message).not.toContain('Template validation failed');
      });
    }
  });
});
