#!/usr/bin/env tsx
/**
 * `yarn workspace @openvaa/dev-seed seed` — CLI entry point.
 *
 * Sequence per RESEARCH §1:
 *   1. parseArgs — node:util built-in (keygen.ts precedent, NOT commander/yargs).
 *   2. --help short-circuit => print USAGE => exit 0.
 *   3. resolveTemplate(--template) => validated Template (TMPL-06, D-58-09/10).
 *   4. Apply --seed / --external-id-prefix overrides to the template.
 *   5. new Writer() — throws with D-58-12 messages on missing env; CLI catches.
 *   6. runPipeline(template) — Phase 56/57 orchestrator.
 *   7. fanOutLocales(rows, template, seed) — Plan 03 utility (no-op if flag off).
 *   8. writer.write(rows, prefix) => optionally returns `{ portraits }` once
 *      Plan 04 lands portrait upload support; this CLI tolerates both the
 *      current `void` return and the future `{ portraits: number }` shape so
 *      Plan 04 can ship without re-touching this file.
 *   9. formatSummary(...) => stdout.
 *   10. exit 0 on success, 1 on any error.
 *
 * D-58-12 error handling:
 *   - Missing env => Writer constructor throws with exact message; CLI prints +
 *     exit(1).
 *   - Template not found => resolveTemplate throws with built-in list + path
 *     suggestion; CLI prints + exit(1).
 *   - Template validation failed => TMPL-09 field-path message from
 *     validateTemplate; CLI prints + exit(1).
 *   - Supabase unreachable => supabase-js throws `fetch failed`; CLI rephrases
 *     to `Cannot reach Supabase at ${url}. Is 'supabase start' running?`
 *   - Any other error => re-raised as `Error: ${err.message}`.
 */

import { parseArgs } from 'node:util';
import { USAGE } from './help';
import { resolveTemplate } from './resolve-template';
import { formatSummary } from './summary';
import { fanOutLocales } from '../locales';
import { runPipeline } from '../pipeline';
import { Writer } from '../writer';
import type { Template } from '../template/types';

const { values } = parseArgs({
  options: {
    template: { type: 'string', short: 't' },
    seed: { type: 'string' },
    'external-id-prefix': { type: 'string' },
    help: { type: 'boolean', short: 'h' }
  },
  strict: true,
  allowPositionals: false
});

if (values.help) {
  process.stdout.write(USAGE);
  process.exit(0);
}

const templateArg = values.template ?? 'default';

try {
  // Lazy-load the built-in template map (Plan 06 provides it; Plan 05
  // tolerates missing file via the try/catch inside loadBuiltIns).
  const builtIns = await loadBuiltIns();
  const template = await resolveTemplate(templateArg, builtIns);

  // Apply --seed override (parse string to int; reject non-numeric).
  if (values.seed !== undefined) {
    const parsed = Number.parseInt(values.seed, 10);
    if (!Number.isFinite(parsed)) {
      process.stderr.write(`Error: --seed must be an integer (got '${values.seed}').\n`);
      process.exit(1);
    }
    (template as Template & { seed?: number }).seed = parsed;
  }

  // Apply --external-id-prefix override.
  if (values['external-id-prefix'] !== undefined) {
    (template as Template & { externalIdPrefix?: string }).externalIdPrefix = values['external-id-prefix'];
  }

  const seed = (template as Template & { seed?: number }).seed ?? 42;

  // Writer constructor reads env + throws D-58-12 messages if missing.
  const writer = new Writer();

  const start = Date.now();
  const rows = runPipeline(template);
  fanOutLocales(rows, template, seed);

  // Writer.write signature evolves across plans:
  //   Plan 04 (current base): write(rows) => Promise<void>
  //   Plan 04 (post-portrait): write(rows, prefix?) => Promise<{ portraits: number }>
  // The CLI defers to runtime inspection of the resolved value to stay
  // forward-compatible without re-editing this file once Plan 04 lands.
   
  const writeResult: unknown = await (writer.write as (...args: Array<unknown>) => Promise<unknown>)(
    rows,
    (template as Template & { externalIdPrefix?: string }).externalIdPrefix ?? 'seed_'
  );
  const portraits = extractPortraitCount(writeResult);

  const elapsedMs = Date.now() - start;

  const rowCounts = Object.fromEntries(
    Object.entries(rows).map(([table, array]) => [table, array.length])
  );

  process.stdout.write(
    formatSummary({
      templateName: describeTemplateSource(templateArg, builtIns),
      seed,
      elapsedMs,
      portraits,
      rowCounts
    })
  );
  process.exit(0);
} catch (err) {
  const message = normalizeError(err);
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadBuiltIns(): Promise<Record<string, Template>> {
  try {
    // `.js` extension for ESM resolution at runtime (tsx transforms .ts to
    // .js at load time). Plan 06 ships this file; Plan 05 tolerates absence.
    //
    // The import path is built at runtime to keep TypeScript from statically
    // resolving it — Plan 05 ships before Plan 06, so the `templates/` module
    // does not exist yet. Once Plan 06 lands, the import resolves normally;
    // until then, the catch branch is exercised and returns `{}` built-ins.
    const modulePath = '../templates/index.js';
    const mod = (await import(/* @vite-ignore */ modulePath)) as {
      BUILT_IN_TEMPLATES?: Record<string, Template>;
    };
    return mod.BUILT_IN_TEMPLATES ?? {};
  } catch {
    // Plan 06 hasn't shipped yet, or the module failed to load. Treat as
    // empty built-ins — resolveTemplate's error will list "(none registered
    // yet)" which is correct in the missing-Plan-06 state.
    return {};
  }
}

function describeTemplateSource(arg: string, builtIns: Record<string, Template>): string {
  if (arg in builtIns) return `${arg} (built-in)`;
  return `custom (${arg})`;
}

/**
 * Extract `portraits` count from a Writer.write return value.
 *
 * - Plan 04 current base: write returns `undefined`/`void` => 0 portraits.
 * - Plan 04 post-portrait: write returns `{ portraits: number }` => pass through.
 *
 * Accepts any shape defensively; anything that's not `{ portraits: <number> }`
 * is reported as 0. Keeps the CLI forward-compatible without coupling to the
 * exact Writer signature.
 */
function extractPortraitCount(result: unknown): number {
  if (result && typeof result === 'object' && 'portraits' in result) {
    const p = (result as { portraits: unknown }).portraits;
    if (typeof p === 'number' && Number.isFinite(p)) return p;
  }
  return 0;
}

function normalizeError(err: unknown): string {
  const msg = (err as Error)?.message ?? String(err);
  // Rephrase supabase-js fetch failures into actionable D-58-12 form.
  if (/fetch failed|ECONNREFUSED|ENOTFOUND/.test(msg)) {
    const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
    return `Cannot reach Supabase at ${url}. Is 'supabase start' running?`;
  }
  return msg;
}
