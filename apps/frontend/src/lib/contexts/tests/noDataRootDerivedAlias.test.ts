/**
 * NO-`$derived`-ALIAS-OVER-`dataRoot` GUARD (phase 159, requirement REVIEW-CMP-05; spike 024).
 *
 * The regression this file exists for: `DataRoot` is IDENTITY-STABLE. Its reference never changes, and its only reactive signal is a private `#version` `$state` counter bumped on `DataRoot.update()`. Binding an intermediate read alias over it — `const dataRoot = $derived(ctx.dataRoot)` — recomputes on every bump and yields the SAME object reference each time, so Svelte 5's referential-equality rule SKIPS downstream notification. Consumers reading through that alias keep their empty pre-mount snapshot. On warm entry (intro then Continue) the data is already there before the alias first computes, so the page looks right and the defect is invisible; on cold / direct-URL entry the data arrives after mount and the region never renders. Phase 117 paid for that lesson once, over fourteen consumer sites.
 *
 * If this test fails, it means a source file under `apps/frontend/src` reintroduced that alias. The fix is never to "tidy" the alias — it is to read `ctx.dataRoot.<prop>` DIRECTLY inside the consuming tracking scope (a `$derived.by` thunk, a template block, an `$effect` body), so the consumer itself takes the `#version` dependency. See CLAUDE.md § Context Destructuring Rule, the `dataRoot` version-bridge carve-out, and `.planning/spikes/024-derived-alias-stable-ref-skip/README.md`.
 *
 * The scan is deliberately NARROW: it matches an alias whose ENTIRE derived body is a `dataRoot` accessor, which is the shape that goes stale. `$derived(this.#dataRoot.elections?.length !== 1)` reads a PROPERTY inside the derived and is safe, so it must not match — a broader pattern would redden on correct code and get disabled, which is worse than no guard.
 *
 * Two properties keep it from passing vacuously. It THROWS rather than returning an empty collection when it cannot find its scan root or finds implausibly few files, because a silent empty set would make the assertion pass while checking nothing. And it EXCLUDES ITS OWN FILE from the scanned set, because this file necessarily contains the forbidden literal in its own pattern and in this very paragraph — a guard that flags itself is a guard that gets deleted. The self-exclusion is itself asserted below, so it cannot quietly become a no-op if the file moves.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SELF_PATH = fileURLToPath(import.meta.url);

// apps/frontend/src/lib/contexts/tests/ -> the frontend source root is three levels up.
const SRC_ROOT = join(dirname(SELF_PATH), '..', '..', '..');

/** Extensions that can carry a rune. Everything else in the tree is data, styling or assets. */
const SCANNED_EXTENSIONS = ['.svelte', '.ts', '.js'];

/** A floor on the scanned file count. The frontend source tree holds hundreds of these; a handful means the walk broke rather than that the tree shrank. */
const MINIMUM_PLAUSIBLE_FILE_COUNT = 200;

/**
 * The forbidden shape: a `$derived` (or `$derived.by(() => ...)`) whose whole body is a member expression ending in `dataRoot` or `#dataRoot`, with nothing read off it.
 * Matching the CLOSING paren immediately after the accessor is what keeps the safe property reads (`$derived(this.#dataRoot.elections?.length !== 1)`) out of the match.
 */
const DERIVED_OVER_DATA_ROOT =
  /\$derived(?:\.by)?\(\s*(?:\(\s*\)\s*=>\s*)?(?:this|[A-Za-z_$][\w$]*)(?:\??\.#?[A-Za-z_$][\w$]*)*\??\.#?dataRoot\s*\)/;

/** Line prefixes that start a comment in the scanned file types. A doc comment describing the forbidden shape must not trip the guard that forbids it. */
const COMMENT_PREFIXES = ['//', '*', '/*', '<!--'];

/**
 * Every scannable file under `root`, recursively.
 * Throws rather than returning `[]` when the root is missing: a silent empty list would make every assertion below pass without reading a single line.
 */
function collectSourceFiles(root: string): Array<string> {
  let entries: Array<string>;
  try {
    entries = readdirSync(root);
  } catch (cause) {
    throw new Error(
      `noDataRootDerivedAlias.test.ts could not read the scan root '${root}'. The frontend source layout moved; ` +
        'update SRC_ROOT in this file. Returning an empty file list instead would make this guard pass vacuously. ' +
        `Underlying error: ${String(cause)}`
    );
  }
  const files: Array<string> = [];
  for (const entry of entries) {
    const absolute = join(root, entry);
    if (statSync(absolute).isDirectory()) {
      files.push(...collectSourceFiles(absolute));
      continue;
    }
    if (SCANNED_EXTENSIONS.some((extension) => entry.endsWith(extension))) files.push(absolute);
  }
  return files;
}

/** True when the line carries nothing but a comment, so prose about the forbidden shape is not mistaken for the shape. */
function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return COMMENT_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

const ALL_FILES = collectSourceFiles(SRC_ROOT);
const SCANNED_FILES = ALL_FILES.filter((file) => file !== SELF_PATH);

describe('no $derived alias over the identity-stable dataRoot (REVIEW-CMP-05, spike 024)', () => {
  it('scans a plausible slice of the frontend source tree', () => {
    expect(ALL_FILES.length).toBeGreaterThan(MINIMUM_PLAUSIBLE_FILE_COUNT);
    // The self-exclusion must actually exclude something. If this file ever moves out of SRC_ROOT the exclusion becomes a no-op, and the next author to add the forbidden literal to a doc comment here would see a green guard flag nothing.
    expect(
      ALL_FILES.length - SCANNED_FILES.length,
      'this guard no longer excludes itself from its own scan root — see the header'
    ).toBe(1);
  });

  it('finds no intermediate derived alias bound over a dataRoot accessor', () => {
    const offenders: Array<string> = [];
    for (const file of SCANNED_FILES) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (isCommentLine(line)) return;
        if (DERIVED_OVER_DATA_ROOT.test(line)) offenders.push(`${relative(SRC_ROOT, file)}:${index + 1}`);
      });
    }

    expect(
      offenders,
      `A derived alias is bound over the identity-stable dataRoot at: ${offenders.join(', ')}. The alias recomputes on every #version bump and returns the SAME reference each time, so Svelte skips downstream notification and the consumer keeps its empty pre-mount snapshot on cold entry. Read ctx.dataRoot.<prop> directly inside the consuming tracking scope instead.`
    ).toEqual([]);
  });
});
