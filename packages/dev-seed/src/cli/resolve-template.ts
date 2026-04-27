/**
 * D-58-09 + D-58-10 template resolver.
 *
 * Resolution algorithm (D-58-09):
 *   1. Arg starts with `./`, `/`, or `../` => filesystem path.
 *   2. Arg ends in `.ts`, `.js`, or `.json` => filesystem path.
 *   3. Otherwise => built-in name lookup in the provided map.
 *   4. Unknown name => error listing built-ins + suggesting path form.
 *
 * Loader (D-58-10):
 *   - `.ts` / `.js` => `await import(pathToFileURL(absPath).href)`. tsx runtime
 *     handles `.ts` transformation. Reads `mod.default` or `mod.template`.
 *   - `.json` => `JSON.parse(readFileSync(absPath, 'utf8'))` + zod validate.
 *
 * Validation:
 *   - Every resolved template runs through `validateTemplate()` before return.
 *     TMPL-09 field-path errors surface on misconfiguration.
 *
 * Security note (T-58-05-02 in Plan's threat model):
 *   - Loading `.ts`/`.js` from arbitrary paths executes developer-authored
 *     code at runtime. This is INTENTIONAL (TMPL-06 — custom templates).
 *     Not a vulnerability — dev tool with same trust model as tsx itself.
 *     LICENSE.md-level warning in README.md (Plan 10).
 */

import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateTemplate } from '../template/schema';
import type { Template } from '../template/types';

/**
 * Resolve a `--template` argument to a validated Template.
 *
 * @param arg The raw string passed to `--template`. May be a built-in name
 *            (e.g. `'default'`, `'e2e'`) or a filesystem path
 *            (`'./my.ts'`, `'/abs/path.json'`, `'../rel.js'`).
 * @param builtIns Map of built-in template name => Template. Plan 05 passes
 *            an empty map (`{}`); Plan 06 populates `{ default, e2e }`.
 */
export async function resolveTemplate(
  arg: string,
  builtIns: Record<string, Template>
): Promise<Template> {
  if (isPath(arg)) {
    const absPath = isAbsolute(arg) ? arg : resolve(arg);
    if (absPath.endsWith('.json')) {
      return loadJsonTemplate(absPath);
    }
    return loadModuleTemplate(absPath);
  }

  const builtIn = builtIns[arg];
  if (!builtIn) {
    const builtInNames = Object.keys(builtIns);
    const builtInList =
      builtInNames.length > 0 ? builtInNames.join(', ') : '(none registered yet)';
    throw new Error(
      `Unknown template: '${arg}'. Built-in templates: ${builtInList}. ` +
        'For a custom template, pass a path like \'./my-template.ts\' or \'/abs/path.json\'.'
    );
  }
  return builtIn;
}

/**
 * D-58-09 step 1+2: path if starts with `./`, `/`, `../` OR ends in .ts/.js/.json.
 */
function isPath(arg: string): boolean {
  return (
    arg.startsWith('./') ||
    arg.startsWith('/') ||
    arg.startsWith('../') ||
    arg.endsWith('.ts') ||
    arg.endsWith('.js') ||
    arg.endsWith('.json')
  );
}

/**
 * D-58-10 JSON loader: read + JSON.parse + zod validate.
 * JSON parse errors bubble up with their default message; zod errors include
 * TMPL-09 field paths via `validateTemplate`.
 */
function loadJsonTemplate(absPath: string): Template {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(absPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse JSON template at ${absPath}: ${(err as Error).message}`);
  }
  return validateTemplate(raw);
}

/**
 * D-58-10 .ts/.js loader: dynamic import => mod.default ?? mod.template.
 * The `pathToFileURL` conversion is REQUIRED for absolute paths on all
 * platforms (Windows/POSIX) — bare paths don't work with ESM `import()`.
 */
async function loadModuleTemplate(absPath: string): Promise<Template> {
  const url = pathToFileURL(absPath).href;
  let mod: { default?: unknown; template?: unknown };
  try {
    mod = await import(url);
  } catch (err) {
    throw new Error(`Failed to load template module at ${absPath}: ${(err as Error).message}`);
  }
  const candidate = mod.default ?? mod.template;
  if (candidate === undefined) {
    throw new Error(
      `Template module at ${absPath} has no default or named 'template' export. ` +
        'Export via `export default <template>` or `export const template = <template>`.'
    );
  }
  return validateTemplate(candidate);
}
