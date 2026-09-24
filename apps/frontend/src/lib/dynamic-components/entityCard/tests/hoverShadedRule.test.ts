/**
 * `.hover-shaded` SURVIVAL GUARD (phase 159, requirement REVIEW-CMP-03; D-H3, RESEARCH pitfall 3).
 *
 * The regression this file exists for: `EntityCardAction.svelte` is being replaced by a snippet inside `EntityCard.svelte`, and both the component and its `.type.ts` are deleted with it. The component owns the `.hover-shaded` rule in its OWN `<style>` block. A Svelte snippet carries no style scope of its own — it renders inside the host component's scope — so a conversion that moves the markup without ALSO moving the rule compiles cleanly, typechecks cleanly, passes every existing E2E assertion (they assert the element, its `data-testid` and its role, none of which change) and silently drops the hover affordance on every result card.
 *
 * If this test fails, it means the rule is defined in no `<style>` block anywhere under `apps/frontend/src` — it was deleted with the component instead of relocated to the host. Put it back in the style block of whichever component now renders the markup, and keep the `class:hover-shaded={shadeOnHover}` binding pointing at it.
 *
 * The check is deliberately DEFINITION-scoped, not occurrence-scoped: a `class:hover-shaded` binding with no rule behind it is exactly the broken state, so counting bindings would pass on the defect. It asserts the rule is DECLARED, in a style block, at least once.
 *
 * It THROWS rather than asserting against an empty collection when it cannot find its scan root or finds implausibly few components, because a silent empty set would let the assertion pass while reading nothing. Only `.svelte` files are scanned, so this file — a `.ts` module — is not in its own scanned set and its search literal cannot satisfy it.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// apps/frontend/src/lib/dynamic-components/entityCard/tests/ -> the frontend source root is four levels up.
const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

/** A floor on the component count. The frontend holds hundreds of `.svelte` files; a handful means the walk broke rather than that the tree shrank. */
const MINIMUM_PLAUSIBLE_COMPONENT_COUNT = 100;

/** Every `<style>` block in a Svelte component, including its attributes (`lang="postcss"`, `@reference`). */
const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style>/g;

/** The rule DECLARATION — the selector followed by its opening brace, not a `class:` binding or a prose mention. */
const HOVER_SHADED_DECLARATION = /\.hover-shaded\s*\{/;

/**
 * Every `.svelte` file under `root`, recursively.
 * Throws rather than returning `[]` when the root is missing: a silent empty list would make the assertion below pass without reading a single component.
 */
function collectComponents(root: string): Array<string> {
  let entries: Array<string>;
  try {
    entries = readdirSync(root);
  } catch (cause) {
    throw new Error(
      `hoverShadedRule.test.ts could not read the scan root '${root}'. The frontend source layout moved; update ` +
        'SRC_ROOT in this file. Returning an empty file list instead would make this guard pass vacuously. ' +
        `Underlying error: ${String(cause)}`
    );
  }
  const files: Array<string> = [];
  for (const entry of entries) {
    const absolute = join(root, entry);
    if (statSync(absolute).isDirectory()) {
      files.push(...collectComponents(absolute));
      continue;
    }
    if (entry.endsWith('.svelte')) files.push(absolute);
  }
  return files;
}

const COMPONENTS = collectComponents(SRC_ROOT);

/** Files whose `<style>` blocks declare the rule, as source-root-relative paths. */
function componentsDeclaringHoverShaded(): Array<string> {
  const declaring: Array<string> = [];
  for (const file of COMPONENTS) {
    const source = readFileSync(file, 'utf8');
    for (const block of source.matchAll(STYLE_BLOCK)) {
      if (HOVER_SHADED_DECLARATION.test(block[1])) {
        declaring.push(relative(SRC_ROOT, file));
        break;
      }
    }
  }
  return declaring;
}

describe('.hover-shaded survives the EntityCardAction snippet conversion (REVIEW-CMP-03)', () => {
  it('scans a plausible slice of the frontend components', () => {
    expect(COMPONENTS.length).toBeGreaterThan(MINIMUM_PLAUSIBLE_COMPONENT_COUNT);
  });

  it('finds the hover-shading rule declared in at least one style block', () => {
    const declaring = componentsDeclaringHoverShaded();

    expect(
      declaring.length,
      'The `.hover-shaded` rule is declared in no <style> block under apps/frontend/src. A snippet has no style scope of its own, so converting EntityCardAction without relocating the rule to the host component silently drops the hover affordance on every result card, with no compiler, type or E2E signal. Move the rule into the style block of the component that now renders the markup.'
    ).toBeGreaterThanOrEqual(1);
  });
});
