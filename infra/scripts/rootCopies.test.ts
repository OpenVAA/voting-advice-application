/**
 * Keeps the copied Terraform roots identical. Every env root of a family under `infra/envs/` is compared with staging's root of that family: the example roots, which a forker or a downstream repository copies, the scratch Supabase root, which rehearses the staging one, and every `infra/envs/<key>/` copy a deployment adds, so a downstream's roots are held to staging's wiring without an edit here. A module input wired in one copy and forgotten in another still validates and still plans against a mock, so the files are compared here as text.
 *
 * `variables.tf` and `outputs.tf` are compared byte for byte. `main.tf` is compared once its leading comment and its `backend` block, with the comment lines directly above it, are removed: those are the only parts of a root that name its environment and its state. No Terraform runs.
 */

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ENVS = resolve(HERE, '../envs');

/** The environment whose roots every copy follows. */
const REFERENCE_ENV = 'staging';

/** The environment that holds a throwaway Supabase root only, so it takes part in no other family. */
const SCRATCH_ENV = 'scratch';

/** Each root family by its directory name, with the files every copy holds byte for byte as the reference root does. */
const FAMILY_FILES: Readonly<Record<string, ReadonlyArray<string>>> = {
  aws: ['variables.tf', 'outputs.tf'],
  'dns-mail': ['variables.tf'],
  supabase: ['variables.tf']
};

/** A root family: the root the others follow first, then its copies, as directories under `infra/envs/`. */
interface Family {
  name: string;
  roots: ReadonlyArray<string>;
  identical: ReadonlyArray<string>;
}

/**
 * Builds the root families from the directories under `envs`: for each family, every `<env>/<family>` that holds a `main.tf`, the reference environment's first and the others in name order. The scratch environment takes part in the `supabase` family only.
 *
 * @param envs - The directory that holds one directory per environment.
 * @returns One entry per family of {@link FAMILY_FILES}, in its order.
 */
function families(envs: string = ENVS): ReadonlyArray<Family> {
  const others = readdirSync(envs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== REFERENCE_ENV)
    .map((entry) => entry.name)
    .sort();
  return Object.entries(FAMILY_FILES).map(([name, identical]) => ({
    name,
    identical,
    roots: [REFERENCE_ENV, ...others]
      .filter((env) => env !== SCRATCH_ENV || name === 'supabase')
      .map((env) => `${env}/${name}`)
      .filter((root) => existsSync(join(envs, root, 'main.tf')))
  }));
}

const FAMILIES = families();

function read(root: string, file: string): string {
  return readFileSync(join(ENVS, root, file), 'utf8');
}

/**
 * A `main.tf` without its leading comment lines and without its `backend` block and the comment lines directly above that block.
 */
function wiring(mainTf: string): string {
  const lines = mainTf.split('\n');
  let start = 0;
  while (start < lines.length && /^\s*#/.test(lines[start])) start++;
  const kept: Array<string> = [];
  for (let i = start; i < lines.length; i++) {
    if (/^\s*backend\s+"[^"]+"\s*\{/.test(lines[i])) {
      while (kept.length > 0 && /^\s*#/.test(kept[kept.length - 1])) kept.pop();
      if (!/\}\s*$/.test(lines[i])) {
        while (i < lines.length && !/^\s*\}\s*$/.test(lines[i])) i++;
      }
      continue;
    }
    kept.push(lines[i]);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n');
}

describe.each(FAMILIES)('the $name roots', ({ roots, identical }) => {
  const [first, ...copies] = roots;

  it.each(copies.flatMap((copy) => identical.map((file) => ({ copy, file }))))(
    `$copy/$file is byte for byte ${first}'s`,
    ({ copy, file }) => {
      expect(read(copy, file)).toBe(read(first, file));
    }
  );

  it.each(copies)(`%s/main.tf has ${first}'s wiring`, (copy) => {
    expect(wiring(read(copy, 'main.tf'))).toBe(wiring(read(first, 'main.tf')));
  });

  it(`removes a backend block from ${first}/main.tf, so the comparison is not vacuous`, () => {
    const text = read(first, 'main.tf');
    expect(text).toMatch(/^\s*backend\s+"/m);
    expect(wiring(text)).not.toMatch(/^\s*backend\s+"/m);
    expect(wiring(text)).toMatch(/^\s*(module|resource)\s+"/m);
  });
});

/** The roots of the real tree's family `name`, empty for a family that does not exist. */
function byName(name: string): ReadonlyArray<string> {
  return FAMILIES.find((family) => family.name === name)?.roots ?? [];
}

describe('families', () => {
  it.each([
    { family: 'aws', root: 'example/aws' },
    { family: 'dns-mail', root: 'example/dns-mail' },
    { family: 'supabase', root: 'example/supabase' },
    { family: 'supabase', root: 'scratch/supabase' }
  ])('discovers $root in the $family family, so the comparison covers more than staging', ({ family, root }) => {
    expect(byName(family)).toContain(root);
  });

  it.each(Object.keys(FAMILY_FILES))('puts staging first in the %s family', (name) => {
    expect(byName(name)[0]).toBe(`staging/${name}`);
  });

  it('finds a deployment root added under a new key, and the scratch environment in the supabase family only', () => {
    const envs = mkdtempSync(join(tmpdir(), 'root-copies-'));
    try {
      for (const root of [
        'staging/aws',
        'staging/supabase',
        'zeta/aws',
        'alpha/aws',
        'alpha/supabase',
        'scratch/aws',
        'scratch/supabase'
      ]) {
        mkdirSync(join(envs, root), { recursive: true });
        writeFileSync(join(envs, root, 'main.tf'), '');
      }
      mkdirSync(join(envs, 'empty/aws'), { recursive: true });
      const found = Object.fromEntries(families(envs).map(({ name, roots }) => [name, roots]));
      expect(found).toEqual({
        aws: ['staging/aws', 'alpha/aws', 'zeta/aws'],
        'dns-mail': [],
        supabase: ['staging/supabase', 'alpha/supabase', 'scratch/supabase']
      });
    } finally {
      rmSync(envs, { recursive: true, force: true });
    }
  });

  it('reports a discovered copy whose main.tf leaves out one module input', () => {
    const [first, copy] = byName('aws');
    const text = read(copy, 'main.tf');
    const input = /^ {2}environment\s+= var\.environment\n/m;
    expect(text).toMatch(input);
    expect(wiring(text.replace(input, ''))).not.toBe(wiring(read(first, 'main.tf')));
  });
});

describe('wiring', () => {
  const main = [
    '# Header.',
    'terraform {',
    '  # About the backend.',
    '  backend "s3" {',
    '    key = "a"',
    '  }',
    '}',
    '',
    'module "m" {',
    '  a = var.a',
    '  b = var.b',
    '}',
    ''
  ].join('\n');

  it('ignores the header, the backend and its comment', () => {
    const other = main
      .replace('# Header.', '# Another header.\n# Over two lines.')
      .replace('  # About the backend.\n  backend "s3" {\n    key = "a"\n  }', '  backend "local" {}');
    expect(wiring(other)).toBe(wiring(main));
  });

  it('tells apart a copy that leaves a module input out', () => {
    expect(wiring(main.replace('  b = var.b\n', ''))).not.toBe(wiring(main));
  });
});
