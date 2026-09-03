/**
 * The declared-binaries guard's WIRING, asserted rather than described.
 *
 * ## What went wrong, and why a comment is not enough
 *
 * Eight workspaces opened their `build` script with `tsup` while declaring it nowhere, and the builds passed anyway because the root's hoisted copy sat on PATH. Nothing was broken and nothing was red, which is exactly why the defect survived: `yarn build` is green in precisely the state the defect is live in. The eight declarations that fixed it are one-line edits any future manifest edit can drop, and a ninth workspace can reopen the class tomorrow, so the durable deliverable is not the edits — it is the guard, and the guard is only worth anything on the days it actually runs.
 *
 * That makes the load-bearing property WIRING, not behaviour. A guard script sitting unreferenced on disk still exists, still passes when anyone runs it by hand, and reports nothing at all when the link that invoked it is deleted from the `lint:check` chain. The tree keeps looking clean and no signal says the check stopped happening. A comment beside the chain cannot hold that property, because deleting the link deletes the comment with it.
 *
 * ## Why it lives in packages/dev-seed
 *
 * `yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in, and this package already reads repo-root files from its tests. It sits beside the other repo-root readers rather than in a new home of its own.
 *
 * ⚠ The invariant asserted here is MEMBERSHIP of the `&&` chain, never terminal position, never the whole string, never the link count. Every link after a failing one is equally aborted, so guards may be appended to the chain freely, and an assertion on position or length reddens a correct append. That over-specified shape has already had to be removed from a sibling spec in this directory once; do not reintroduce it here.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

type Manifest = {
  scripts: Record<string, string>;
  engines?: Record<string, string>;
  engine?: unknown;
  volta?: unknown;
  devEngines?: unknown;
};

const readManifest = (location: string): Manifest =>
  JSON.parse(readFileSync(resolve(REPO_ROOT, location), 'utf8')) as Manifest;

const ROOT_PACKAGE_JSON = readManifest('package.json');

describe('the declared-binaries guard is wired so it actually runs', () => {
  it('keeps `yarn assert:declared-binaries` a blocking link of lint:check', () => {
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn assert:declared-binaries');
  });

  it('points the registered script at the guard it claims to run', () => {
    // Wired-to-nothing is the second failure mode: a chain link naming a script key that no longer exists fails with a bare "command not found", which names no invariant and sends the reader nowhere.
    expect(ROOT_PACKAGE_JSON.scripts['assert:declared-binaries']).toBe('node scripts/assert-declared-binaries.mjs');
  });

  it('keeps the guard file itself present and recognisable', () => {
    // Wired-but-deleted is the third failure mode, and it belongs here rather than at lint time, where it would surface only as `node: cannot find module`.
    expect(readFileSync(resolve(REPO_ROOT, 'scripts/assert-declared-binaries.mjs'), 'utf8')).toContain(
      'DECLARED-BINARIES GUARD'
    );
  });

  it('spells the Node/Yarn constraint `engines` — not `engine` — in both manifests that declare it', () => {
    // A sibling of the invariant above, and here for the same reason: both are cases of a manifest declaring something no tool will ever read. `engine` is inert JSON; `engines` is the name the ecosystem resolves, and both of these manifests carried the singular for as long as anyone had looked. The value is asserted alongside the spelling so a "fix" that renames the key while quietly widening or narrowing the range cannot pass as a rename.
    for (const location of ['package.json', 'apps/frontend/package.json']) {
      const manifest = readManifest(location);
      expect(manifest.engines, `${location} declares no \`engines\``).toBeTypeOf('object');
      expect(manifest.engine, `${location} still carries the misspelled \`engine\``).toBeUndefined();
    }

    expect(readManifest('package.json').engines).toEqual({ node: '>=22', yarn: '4.13', npm: 'please-use-yarn' });
  });

  it('leaves `engines.node` as the field a version-file resolver would read', () => {
    // `volta.node` and `devEngines.runtime` both take precedence over `engines.node` in the resolvers that read a version out of a manifest, so either key appearing here would silently displace the range this repository declares — without changing it, and without anything going red.
    const rootManifest = readManifest('package.json');
    expect(rootManifest.volta).toBeUndefined();
    expect(rootManifest.devEngines).toBeUndefined();
  });
});
