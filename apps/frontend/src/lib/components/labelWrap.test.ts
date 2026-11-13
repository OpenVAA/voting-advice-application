/**
 * Every DaisyUI `.label` may wrap, by one rule in `app.css`.
 *
 * DaisyUI's `.label` sets `white-space: nowrap`. A label whose text is a translation, a question's name or a party's name is as long as its author made it, and on a phone a label that cannot wrap runs out of its box and widens the page sideways (WCAG 2.1 SC 1.4.10, Reflow). The project's own `.label` rule in `app.css`, which already cancels DaisyUI's colour mute, lets every label wrap between words, so no component has to remember a utility of its own.
 *
 * A DOM without layout cannot show a label wrapping; the page-width checks of the end-to-end suite do that. What these cases hold is the rule itself, and that no component carries a copy of it.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** `apps/frontend/src`. */
const SRC_ROOT = join(__dirname, '..', '..');

/**
 * The bodies of the rules in `css` whose selector is exactly `.label`.
 * @param css - The stylesheet's text.
 * @returns Each body, without its braces.
 */
function labelRuleBodies(css: string): Array<string> {
  return [...css.matchAll(/(?:^|[\s}])\.label\s*\{([^}]*)\}/g)].map((match) => match[1]);
}

/**
 * Every `.svelte` and `.ts` source file under `dir`, test files left out.
 * @param dir - The directory to walk.
 * @returns The files' paths.
 */
function sourceFiles(dir: string): Array<string> {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'paraglide' ? [] : sourceFiles(path);
    return /\.(svelte|ts)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name) ? [path] : [];
  });
}

describe('the label wrap rule', () => {
  const appCss = readFileSync(join(SRC_ROOT, 'app.css'), 'utf8');

  it("lets every label wrap in the project's own `.label` rule", () => {
    const bodies = labelRuleBodies(appCss);
    expect(bodies, "app.css holds the project's `.label` rule").toHaveLength(1);
    expect(bodies[0]).toMatch(/white-space:\s*normal\s*;/);
    expect(bodies[0]).toMatch(/color:\s*inherit\s*;/);
  });

  it('is not copied into any component as a utility beside `label`', () => {
    const copies = sourceFiles(join(SRC_ROOT, 'lib')).filter((file) =>
      [...readFileSync(file, 'utf8').matchAll(/(["'`])([^"'`]*)\1/g)].some(([, , text]) => {
        const classes = text.split(/\s+/);
        return classes.includes('label') && classes.includes('whitespace-normal');
      })
    );
    expect(copies).toEqual([]);
  });
});
