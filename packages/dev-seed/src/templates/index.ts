/**
 * Built-in template registry. Plan 05 CLI's `loadBuiltIns` dynamically imports
 * this module (via `../templates/index.js`) and reads both `BUILT_IN_TEMPLATES`
 * and `BUILT_IN_OVERRIDES`. Plan 06 (this plan) populates the maps with the
 * `default` entry; Plan 08 extends with `e2e`.
 *
 * The map-based design means a new built-in template ships in two edits:
 *   1. Add the template declaration under `packages/dev-seed/src/templates/`.
 *   2. Register the name in both maps below (and matching overrides if any).
 *
 * The CLI resolves a `--template <name>` arg by looking up `BUILT_IN_TEMPLATES`
 * first; a miss falls through to filesystem-path resolution (D-58-09).
 * `BUILT_IN_OVERRIDES` is consulted only after a successful built-in match so
 * the pipeline receives the per-template override map at `runPipeline(tpl, ov)`.
 */

import { defaultOverrides, defaultTemplate } from './default';
import { e2eTemplate } from './e2e';
import type { Template } from '../template/types';
import type { Overrides } from '../types';

/**
 * Built-in template name → Template. Plan 08 adds `e2e: e2eTemplate`.
 */
export const BUILT_IN_TEMPLATES: Record<string, Template> = {
  default: defaultTemplate,
  e2e: e2eTemplate
};

/**
 * Built-in template name → D-25 Overrides. Paired 1:1 with
 * `BUILT_IN_TEMPLATES` entries. When the CLI resolves a built-in name it
 * ALSO looks up this map and passes the overrides to `runPipeline`.
 *
 * Templates with no overrides register an empty object (`{}`) or are omitted
 * (`loadBuiltIns` falls back to `{}` when the key is missing).
 *
 * The `e2e` template (Plan 08) ships with NO overrides — every row is
 * expressed as a `fixed[]` entry authored from 58-E2E-AUDIT.md. Phase 56's
 * generators handle the fixed[] passthrough; no content-shaping override is
 * needed.
 */
export const BUILT_IN_OVERRIDES: Record<string, Overrides> = {
  default: defaultOverrides
};

// Re-exports for explicit consumer imports.
export { defaultOverrides, defaultTemplate } from './default';
export { E2E_BASE_APP_SETTINGS, e2eTemplate } from './e2e';
