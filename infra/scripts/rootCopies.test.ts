/**
 * Keeps the copied Terraform roots identical. The example roots are the templates a forker copies, and the scratch Supabase root rehearses the staging one, so each copy must carry the same wiring as the staging root it follows. A module input wired in one copy and forgotten in another still validates and still plans against a mock, so the files are compared here as text.
 *
 * `variables.tf` and `outputs.tf` are compared byte for byte. `main.tf` is compared once its leading comment and its `backend` block, with the comment lines directly above it, are removed: those are the only parts of a root that name its environment and its state. No Terraform runs.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ENVS = resolve(HERE, '../envs');

/** Each root family: the root the others follow first, then its copies, as directories under `infra/envs/`. */
const FAMILIES: ReadonlyArray<{ name: string; roots: ReadonlyArray<string>; identical: ReadonlyArray<string> }> = [
  { name: 'aws', roots: ['staging/aws', 'example/aws'], identical: ['variables.tf', 'outputs.tf'] },
  { name: 'dns-mail', roots: ['staging/dns-mail', 'example/dns-mail'], identical: ['variables.tf'] },
  { name: 'supabase', roots: ['staging/supabase', 'example/supabase', 'scratch/supabase'], identical: ['variables.tf'] }
];

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
