import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENTITY_TYPE } from '@openvaa/data';
import { Constants } from '@openvaa/supabase-types';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { GRANT_ROLES, GRANT_SCOPES } from '$lib/auth/roles';
import type { EntityType } from '@openvaa/data';
import type { Enums } from '@openvaa/supabase-types';
import type { GrantRole, GrantScope, GrantShape } from '$lib/auth/roles';

/**
 * The frontend defines its grant and entity vocabulary itself, so it does not depend on the generated database types. These tests fail when that vocabulary and the database's enums disagree, in either direction.
 */
describe('frontend vocabulary matches the database enums', () => {
  const { Enums: databaseEnums } = Constants.public;

  it('has the same grant scopes', () => {
    expect([...GRANT_SCOPES].sort()).toEqual([...databaseEnums.grant_scope_type].sort());
    expectTypeOf<GrantScope>().toEqualTypeOf<Enums<'grant_scope_type'>>();
  });

  it('has the same grant roles', () => {
    expect([...GRANT_ROLES].sort()).toEqual([...databaseEnums.grant_role_type].sort());
    expectTypeOf<GrantRole>().toEqualTypeOf<Enums<'grant_role_type'>>();
  });

  it('has the same entity types', () => {
    expect(Object.values(ENTITY_TYPE).sort()).toEqual([...databaseEnums.entity_type].sort());
    expectTypeOf<EntityType>().toEqualTypeOf<Enums<'entity_type'>>();
    expectTypeOf<NonNullable<GrantShape['target_type']>>().toEqualTypeOf<Enums<'entity_type'>>();
  });
});

/**
 * Only the Supabase adapter may import the generated database types. Code elsewhere uses the frontend's own vocabulary, or `SupabaseDatabase` from `supabaseAdapter.type.ts` where it types a Supabase client.
 */
describe('import boundary of @openvaa/supabase-types', () => {
  // `URL` is jsdom's in this environment, so the path is derived without it.
  const adapterDir = dirname(fileURLToPath(import.meta.url));
  const workspaceRoot = join(adapterDir, '..', '..', '..', '..', '..');
  // Installed packages, build output and tool caches: none of it is source this workspace authors.
  const skippedDirs = new Set(['node_modules', 'build', '.svelte-kit', '.turbo', '.vite']);
  const importPattern =
    /\bfrom\s*['"]@openvaa\/supabase-types['"]|\bimport\s*\(?\s*['"]@openvaa\/supabase-types['"]|\brequire\s*\(\s*['"]@openvaa\/supabase-types['"]/;

  function sourceFiles(dir: string): Array<string> {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return path === adapterDir || skippedDirs.has(entry.name) ? [] : sourceFiles(path);
      return /\.([cm]?[jt]s|svelte)$/.test(entry.name) ? [path] : [];
    });
  }

  it('is not imported outside lib/api/adapters/supabase', () => {
    const files = sourceFiles(workspaceRoot);
    expect(files.length).toBeGreaterThan(0);
    expect(files.map((file) => relative(workspaceRoot, file))).toEqual(
      expect.arrayContaining(['vite.config.ts', 'svelte.config.js'])
    );
    const offenders = files
      .filter((file) => importPattern.test(readFileSync(file, 'utf8')))
      .map((file) => relative(workspaceRoot, file));
    expect(
      offenders,
      `these files import @openvaa/supabase-types outside the adapter: ${offenders.join(', ')}`
    ).toEqual([]);
  });
});
