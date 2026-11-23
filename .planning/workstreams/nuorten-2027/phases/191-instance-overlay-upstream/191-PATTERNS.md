# Phase 191: Instance overlay (upstream) - Pattern Map

**Mapped:** 2026-11-23
**Files analyzed:** 30 (new and modified)
**Analogs found:** 27 / 30

All paths are relative to the repo root `/home/user/voting-advice-application`. Line numbers are those at HEAD `8f2bb68a7`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/app-shared/src/settings/staticSettings.schema.ts` (new) | model (zod schema) | transform / validation | `packages/app-shared/src/data/schemas/storedCustomization.schema.ts` | exact |
| `packages/app-shared/src/settings/staticSettings.schema.test.ts` (new) | test | validation | `packages/app-shared/src/data/schemas/storedCustomization.schema.test.ts` + `apps/frontend/src/lib/api/adapters/supabase/supabaseTypes.parity.test.ts` (expectTypeOf) | exact |
| `packages/app-shared/src/settings/resolveStaticSettings.ts` (new) | utility (pure) | transform | `packages/app-shared/src/utils/mergeSettings.ts` | role-match |
| `packages/app-shared/src/settings/resolveStaticSettings.test.ts` (new) | test | transform | `packages/app-shared/src/settings/contestantAppSettings.test.ts` | role-match |
| `packages/app-shared/src/settings/staticSettings.type.ts` (modify: optional `logo`, optional `*-content`) | model (type) | — | itself (lines 35-61, 62-78) | exact |
| `packages/app-shared/tsup.config.ts` (modify) | config (build) | file-I/O / transform | itself + RESEARCH Pattern 1 prototype | prototype only |
| `packages/app-shared/turbo.json` (new) | config | batch (cache key) | `apps/frontend/turbo.json` | exact |
| `packages/app-shared/src/settings/README.md` (modify) | docs | — | itself | — |
| `apps/frontend/vite.instance.ts` (new) | config plugin (Vite) | transform (CSS) + file-I/O | `apps/frontend/vite.restartOnRootEnv.ts`, `apps/frontend/vite.projectIdEnv.ts` | role-match |
| `apps/frontend/vite.instance.test.ts` (new) | test | transform | `apps/frontend/vite.restartOnRootEnv.test.ts`, `apps/frontend/vite.projectIdEnv.test.ts` | exact |
| `apps/frontend/instanceAssets.js` (new) | utility (plain JS, Node) | file-I/O | `apps/frontend/svelte.config.js` (JS + JSDoc idiom), `vite.projectIdEnv.ts` (pure fn with repoRoot param) | role-match |
| `apps/frontend/instanceAssets.test.ts` (new) | test | file-I/O | `apps/frontend/vite.projectIdEnv.test.ts` (mkdtemp roots) | exact |
| `apps/frontend/svelte.config.js` (modify: `kit.files.assets`) | config | — | itself (lines 6, 13-37) | exact |
| `apps/frontend/svelte.config.test.ts` (extend) | test | — | itself (`kit.version.name` block, lines 55-103) | exact |
| `apps/frontend/paraglide.options.ts` (modify) | config | file-I/O | itself | exact |
| `apps/frontend/scripts/compile-paraglide.ts` (modify) | script | batch | itself | exact |
| `apps/frontend/vite.config.ts` (modify: plugin order) | config | — | itself (lines 1-37) | exact |
| `apps/frontend/tsconfig.json` (modify: `"files"`) | config | — | itself (lines 11-19) | exact |
| `apps/frontend/.gitignore` (modify: `/.instance`) | config | — | itself | exact |
| `apps/frontend/turbo.json` (modify: instance inputs) | config | batch | itself | exact |
| shared i18n catalogue helpers, e.g. `apps/frontend/src/lib/i18n/utils/messageCatalog.ts` (new, extracted) | utility | transform | `apps/frontend/src/lib/i18n/tests/translations.test.ts` lines 26-37, 130-139, 695-730 | exact (extraction) |
| `apps/frontend/src/lib/i18n/tests/translations.test.ts` (modify: import extracted helpers) | test | — | itself | exact |
| `apps/frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte` (modify: static fallback) | component | request-response (render) | itself (lines 38-63) | exact |
| `apps/frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte.test.ts` (new) | test (component, jsdom) | render | `apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte.test.ts` | exact |
| `apps/frontend/Dockerfile` (modify) | config (image) | batch | itself (lines 14-45) | exact |
| `.github/workflows/main.yaml` (modify: `docker-image-build` comment) | config (CI) | — | itself (lines 180-199) | exact |
| `packages/dev-seed/tests/turboBuildInputsGate.test.ts` (extend) | test (repo-meta) | batch | itself | exact |
| `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts` (optional extend: `COPY instance`) | test (repo-meta) | — | itself (lines 37, 124-126) | exact |
| `instance/README.md` (new, tracked upstream) | docs | — | `packages/app-shared/src/settings/README.md` (tone) | partial |
| `apps/frontend/messages/README.md`, `apps/docs/src/routes/(content)/developers-guide/configuration/static-settings/+page.md` (modify) | docs | — | themselves | — |

Optional (Pitfall 9): `apps/frontend/vite.restartOnRootEnv.ts`, which could also restart on `instance/` changes. Its analog is the file itself.

## Pattern Assignments

### `packages/app-shared/src/settings/staticSettings.schema.ts` (model, validation)

**Analog:** `packages/app-shared/src/data/schemas/storedCustomization.schema.ts`

**Imports and helper-schema pattern** (lines 1-7):
```ts
import { z } from 'zod';
import { StoredImageSchema } from './storedImage.schema';

/**
 * A localised string as it is stored: an object keyed by locale. Mirrors `LocalizedString` in `../localized.type`.
 */
const LocalizedStringSchema = z.record(z.string(), z.string());
```

**Strict-at-every-level pattern** (lines 25-49). Nested objects and array elements each carry their own `z.strictObject`, and every member has a one-line TSDoc:
```ts
 * ## Strict at every level
 *
 * Strictness is per-object and does not descend, including into array elements. The FAQ entry object and the image object therefore carry their own strict setting, and `storedCustomization.schema.test.ts` holds a rejection case for each.
 */
export const StoredCustomizationSchema = z.strictObject({
  /** The name of the VAA publisher, stored as a locale object. */
  publisherName: LocalizedStringSchema.optional(),
  ...
  contestantAppFAQ: z
    .array(
      z.strictObject({
        question: LocalizedStringSchema,
        answer: LocalizedStringSchema
      })
    )
    .optional()
});
```

**Type export** (lines 51-54):
```ts
export type StoredCustomization = z.infer<typeof StoredCustomizationSchema>;
```
For StaticSettings, do **not** export a second inferred type that competes with the hand-written `StaticSettings` (`staticSettings.type.ts`). Assert equality in the test instead (see below).

**Shape to mirror:** `packages/app-shared/src/settings/staticSettings.type.ts` lines 4-122:
- `colors.light` and `colors.dark` each have nine keys (lines 38-61). Add a hex regex there, which also serves as the CSS-injection control.
- `font` has `name`, `url` and optional `style: 'sans' | 'serif'` (lines 65-78).
- `supportedLocales` is a `ReadonlyArray<{code,name,isDefault?}>` (lines 82-95). Use `z.array(...).readonly()` and refine it to allow at most one `isDefault`.
- `dataAdapter` is `LocalDataAdapter | SupabaseDataAdapter` (lines 98-122). Use a discriminated union on `type`. The overlay itself must not name `dataAdapter` (Pitfall 4), which `resolveStaticSettings` checks before the merge.

**Barrel:** `packages/app-shared/src/index.ts` lines 14-18 export each settings module with `export * from './settings/...'`. A browser-safe schema may join the barrel. `resolveStaticSettings` uses only `mergeSettings` + zod, so it is browser-safe too. Do not add any `node:fs` code to the barrel.

---

### `packages/app-shared/src/settings/staticSettings.schema.test.ts` (test)

**Analog:** `packages/app-shared/src/data/schemas/storedCustomization.schema.test.ts`

**Header docblock + imports** (lines 1-8):
```ts
/**
 * `StoredCustomizationSchema` — the stored shape of the `app_settings.customization` JSONB column.
 *
 * Covers the `{}` case ..., and one unknown-key rejection per nesting level: top level, inside an image, and inside a `contestantAppFAQ` entry.
 */

import { describe, expect, it } from 'vitest';
import { StoredCustomizationSchema } from './storedCustomization.schema';
```

**Accept and reject-with-path cases** (lines 24-51):
```ts
    const result = StoredCustomizationSchema.safeParse(input);
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data).toEqual(input);
...
    const result = StoredCustomizationSchema.safeParse({ publisherLogo: { path: 'a.png', bogusImageKey: 1 } });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['publisherLogo']);
```

**Compile-time schema ≡ type**, from `apps/frontend/src/lib/api/adapters/supabase/supabaseTypes.parity.test.ts` lines 6, 20:
```ts
import { describe, expect, expectTypeOf, it } from 'vitest';
...
    expectTypeOf<GrantScope>().toEqualTypeOf<Enums<'grant_scope_type'>>();
```
Apply it as `expectTypeOf<z.infer<typeof StaticSettingsSchema>>().toEqualTypeOf<StaticSettings>()`. `readonly` modifiers may need `z.array(...).readonly()`/`Readonly` wrapping to be exactly equal. Add a case that the shipped `staticSettings` (`./staticSettings`) parses.

---

### `packages/app-shared/src/settings/resolveStaticSettings.ts` (utility, transform)

**Analog:** `packages/app-shared/src/utils/mergeSettings.ts`. Call it; do not reimplement it.

**Function to call** (lines 49-55):
```ts
export function mergeSettings<TTarget extends object, TSource extends object>(
  target: TTarget,
  source: TSource,
  { skipNullAtRoot = false }: MergeSettingsOptions = {}
): TTarget & TSource {
  return mergeLevel({ target, source, path: '', skipNullAtRoot }) as TTarget & TSource;
}
```
Semantics already covered: arrays are replaced whole (so `supportedLocales` is replaced whole), `undefined` is skipped, and `__proto__`/`constructor`/`prototype` are never merged (lines 18, 77).

**TSDoc style for an exported pure function** (lines 30-48): a summary line, a bulleted behaviour list, a `NB.` note, then `@param`/`@returns`. Use object-parameter destructuring with an exported options type (`MergeSettingsOptions`, lines 20-28).

**Error-message pattern** (from RESEARCH Code Examples, verified against zod 4.6.5):
```ts
const r = StaticSettingsSchema.safeParse(merged);
if (!r.success) throw new Error(`instance/staticSettings.json does not produce valid StaticSettings:\n${z.prettifyError(r.error)}`);
```
The overlay is `unknown` input. Check that it is a plain object, strip a top-level `$schema`, and reject `dataAdapter` before calling `mergeSettings`.

---

### `packages/app-shared/src/settings/resolveStaticSettings.test.ts` (test)

**Analog:** `packages/app-shared/src/settings/contestantAppSettings.test.ts` (lines 1-36)
```ts
import { describe, expect, test } from 'vitest';
import { ... } from './contestantAppSettings';
import { dynamicSettings } from './dynamicSettings';
import type { DynamicSettings } from './dynamicSettings.type';

describe('the accepted inputs', () => {
  test('the shipped settings, a deep partial of them and an empty object need no cast', () => {
```
Imports: values first, then `import type`, relative paths with no `.js` extension. The cases come from the RESEARCH test map (SC-1 row 2): no overlay deep-equals base, objects merge deep, `supportedLocales` is replaced whole, and an unknown key, bad hex, `dataAdapter` or two defaults each throw with a path.

---

### `packages/app-shared/tsup.config.ts` (config, build-time file I/O)

**Current file** (lines 1-9), which must stay equivalent when there is no overlay:
```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true
});
```
**Pattern:** RESEARCH Pattern 1 (prototyped, byte-identical with no overlay). It adds `esbuildPlugins: [instanceStaticSettings()]`, an early `return` when `../../instance/staticSettings.json` is absent, and an `onLoad` for `settings[\\/]staticSettings\.ts$` that is gated on exact path equality (normalise with `path.resolve`, Assumption A3). Type the plugin with esbuild's `Plugin` (no `any`).

**Repo-root path idiom.** Use the same one as `apps/frontend/svelte.config.js` line 6 and `vite.config.ts` line 11:
```js
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
```
The build script stays `"build": "tsup && tsc --emitDeclarationOnly --outDir dist"` (`package.json` line 7). Types come from the unchanged source.

---

### `packages/app-shared/turbo.json` (new config)

**Analog:** `apps/frontend/turbo.json` (lines 1-11)
```json
{
  "$schema": "https://turbo.build/schema.json",
  "extends": ["//"],
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", "data/**", "!src/lib/paraglide/**"],
      ...
```
The root `turbo.json` build inputs (lines 4-8) are `["src/**", "tsconfig.json", "tsconfig.*.json", "tsup.config.ts", "package.json"]`. A package `inputs` list **replaces** them (Pitfall 5, measured), so app-shared must use:
```json
{ "$schema": "https://turbo.build/schema.json", "extends": ["//"], "tasks": { "build": { "inputs": ["$TURBO_EXTENDS$", "$TURBO_ROOT$/instance/staticSettings.json"] } } }
```

### `apps/frontend/turbo.json` (modify)
Append `"$TURBO_ROOT$/instance/static/**"` and `"$TURBO_ROOT$/instance/messages/**"` to line 6's `inputs`. Keep `$TURBO_DEFAULT$`, `data/**` and `!src/lib/paraglide/**`. Optionally add `"$TURBO_ROOT$/instance/staticSettings.json"` too: the frontend's locale check reads app-shared's dist, which `^build` already covers.

---

### `apps/frontend/vite.instance.ts` (Vite plugin + pure helpers)

**Analog A, the plugin factory:** `apps/frontend/vite.restartOnRootEnv.ts` (lines 1-34)
```ts
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/** How long the plugin waits ... */
export const RESTART_DEBOUNCE_MS = 200;

/**
 * A dev-server plugin that restarts Vite when the repo-root `.env` is changed, created or deleted.
 * ...
 * @param repoRoot - The directory holding the repo-root `.env`.
 * @returns The Vite plugin.
 */
export function restartOnRootEnv(repoRoot: string): Plugin {
  const envFile = resolve(repoRoot, '.env');
  return {
    name: 'openvaa:restart-on-root-env',
    apply: 'serve',
    configureServer(server) {
```
Copy these conventions:
- the plugin name is namespaced `openvaa:<kebab>`, e.g. `openvaa:instance-theme`
- the factory takes `repoRoot` (or the settings) as a parameter rather than reading globals
- paths are compared through `resolve()`
- exported constants and functions carry TSDoc

The theme plugin sets `enforce: 'pre'` and a `transform(code, id)` that matches only the resolved `src/app.css`, and it must be listed **before** `tailwindcss()`.

**Analog B, a pure function with an options object:** `apps/frontend/vite.projectIdEnv.ts` lines 8-37 (exported `ResolveProjectIdEnvOptions` type, each member with TSDoc, plus private helpers each with `@param`/`@returns`). Use it for `applyThemeToAppCss({ css, settings })`, `instanceMessagesProject({ frontendDir, repoRoot })` and `assertLocalesCompiled(...)`.

**Transform targets in `apps/frontend/src/app.css`:**
- light theme block, lines 10-38: `name: 'light';` is on line 11 and the `--color-*` declarations are on lines 14-33
- dark theme block, lines 41-69: `name: 'dark';` is on line 42 and the colours are on lines 45-64
- `--line-color`: line 74 (`[data-theme='light']`) and line 79 (`[data-theme='dark']`)
- `--font-base`: lines 222-224:
```css
  --font-base:
    'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans',
    sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
```
The font fallback reference is `apps/docs/tailwind.config.mjs` lines 58-71 (`fontFallbacks.sans`/`.serif`). The `sans` list there matches the app.css literal, apart from the quoting form.

**Base values that must be reproduced exactly** (the identity transform), from `packages/app-shared/src/settings/staticSettings.ts` lines 19-47: light `primary #2546a8`, `accent #0a716b`, `warning #a82525`, `line-color #d9d9d9`, and so on. Mapping (RESEARCH Pattern 6): `primary`→`--color-primary`+`--color-success`; `accent`→`--color-accent`+`--color-info`; `warning`→`--color-warning`+`--color-error`. `*-content` values (e.g. line 15 `--color-primary-content: #ffffff`) are replaced only if the optional content keys are added.

**Reading settings in `vite.config.ts`:** import `staticSettings` from `@openvaa/app-shared`, which is built by `^build`. It is already imported the same way in `apps/frontend/src/routes/+layout.svelte` line 19.

---

### `apps/frontend/vite.instance.test.ts` (test)

**Analog:** `apps/frontend/vite.restartOnRootEnv.test.ts` lines 1-42 and `vite.projectIdEnv.test.ts` lines 1-36.

**Environment header** (projectIdEnv test lines 1-3). It is required because the file imports vite or esbuild:
```ts
// @vitest-environment node

// The node environment is required: this file imports `vite`, which loads esbuild, and esbuild asserts `new TextEncoder().encode('') instanceof Uint8Array`. Under jsdom the encoder comes from another realm, the assertion fails and the suite does not collect.
```

**Hook-invocation helper** (restartOnRootEnv test lines 21-27). Reuse its shape for the `transform` hook:
```ts
function configure(plugin: Plugin, server: ViteDevServer): void {
  const hook = plugin.configureServer;
  if (!hook) throw new Error('the plugin has no configureServer hook');
  const handler = typeof hook === 'function' ? hook : hook.handler;
  void handler.call({} as never, server);
}
```

**Plugin identity case** (lines 38-42):
```ts
  it('is a dev-server-only plugin with a namespaced name', () => {
    const plugin = restartOnRootEnv(repoRoot);
    expect(plugin.name).toBe('openvaa:restart-on-root-env');
    expect(plugin.apply).toBe('serve');
  });
```

**Throwaway fixture roots** (projectIdEnv test lines 16-36):
```ts
  const roots: Array<string> = [];
  function makeRoot(contents: string | null): string {
    const root = mkdtempSync(join(tmpdir(), 'openvaa-project-id-env-'));
    roots.push(root);
    if (contents !== null) writeFileSync(join(root, '.env'), contents, 'utf8');
    return root;
  }
  afterEach(() => {
    while (roots.length) rmSync(roots.pop() as string, { recursive: true, force: true });
```
Use this pattern for instance-message fixtures, so that `apps/frontend/tests/fixtures/instance/` is not needed. `apps/frontend/tests/` holds only `sample.spec.ts` today. The identity case reads the real `src/app.css` with `readFileSync` and asserts `output === input` for the shipped `staticSettings`. It also asserts that each mapped declaration occurs exactly once.

**Registration:** add both files to `apps/frontend/tsconfig.json` `"files"` (lines 11-19), next to:
```json
    "vite.restartOnRootEnv.ts",
    "vite.restartOnRootEnv.test.ts",
    "paraglide.options.ts",
```

---

### `apps/frontend/instanceAssets.js` (plain-JS Node helper for `svelte.config.js`)

**Analog:** `apps/frontend/svelte.config.js`. It is plain ESM JS with JSDoc types (`/** @type {import('@sveltejs/kit').Config} */`, line 8), `node:` imports, and the repoRoot idiom (lines 1-6):
```js
import path from 'path';
import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-node';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
```
It must be JS, not TS, because `svelte.config.js` is loaded by `svelte-kit sync` and svelte-check without a TS loader. `tsconfig.json` has `"allowJs": true, "checkJs": true` (lines 4-5), so give it full JSDoc `@param`/`@returns` types and add it to `"files"`.

**Function shape** (from `vite.projectIdEnv.ts` lines 18-37): take `{ repoRoot, frontendDir }`, return `'static'` when `instance/static/` is absent or empty, and otherwise rebuild `.instance/static` and return that path. Detect the layer by its own input, never by the existence of `instance/` (upstream tracks `instance/README.md`). Refuse symlinks with `lstatSync`.

### `apps/frontend/instanceAssets.test.ts`
Same analog as above (mkdtemp roots, `// @vitest-environment node`). Cases: absent → `'static'`, present → instance file wins and base-only files remain, symlink → throws.

---

### `apps/frontend/svelte.config.js` (modify) and `svelte.config.test.ts` (extend)

**Insertion point:** the `kit` object, lines 13-37. Add `files: { assets: instanceAssetsDir({ repoRoot, ... }) }` next to `env: { dir: repoRoot }` (lines 22-24). Reuse the existing `repoRoot` (line 6). Comment style: a `//` paragraph above the key that explains the why (lines 15-21, 31-33), with no history (Comment Hygiene). Note that the existing test docblock at lines 13-15 cites `.planning/debug/...`. Do not copy that form into new comments: a new comment may say `see phase 191` at most.

**Test pattern to copy** (`svelte.config.test.ts` lines 64-103). A describe block per config key, the env var saved and restored, `vi.resetModules()`, and a re-import:
```ts
  async function configBuiltWith(buildSha: string | undefined): Promise<typeof config> {
    setBuildSha(buildSha);
    vi.resetModules();
    return (await import('./svelte.config.js')).default;
  }
...
  it('is undefined when BUILD_SHA is unset', async () => {
    const built = await configBuiltWith(undefined);
    expect(built.kit?.version?.name).toBeUndefined();
  });
```
For `kit.files.assets`, assert that the checkout with no instance assets yields `'static'` (or leaves the key unset). Exercise the present case through the helper's own test with fixture roots, not by creating `instance/static` in the real repo (the instance path is fixed and has no env override).

---

### `apps/frontend/paraglide.options.ts`, `scripts/compile-paraglide.ts`, `vite.config.ts` (modify)

**Current `paraglide.options.ts`** (lines 1-10):
```ts
import type { CompilerOptions } from '@inlang/paraglide-js';

/**
 * The Paraglide compiler options, shared by the Vite plugin in `vite.config.ts` and `scripts/compile-paraglide.ts`, so a job that compiles the messages without a frontend build produces what the app ships. The paths resolve against the working directory, `apps/frontend`.
 */
export const PARAGLIDE_OPTIONS: CompilerOptions = {
  project: './project.inlang',
  outdir: './src/lib/paraglide',
  strategy: ['url', 'cookie', 'baseLocale']
};
```
Keep `outdir` and `strategy`. Only `project` changes, through a function, so that both consumers stay in lockstep.

**Consumers:**
- `scripts/compile-paraglide.ts` lines 4-7: `import { PARAGLIDE_OPTIONS } from '../paraglide.options'; await compile(PARAGLIDE_OPTIONS);`
- `vite.config.ts` lines 6 and 24: `paraglideVitePlugin(PARAGLIDE_OPTIONS) as any,`, with the existing `eslint-disable-next-line @typescript-eslint/no-explicit-any` on line 23. Keep that disable as is.

**Plugin order** (`vite.config.ts` lines 21-27). Put the theme transform first:
```ts
    plugins: [
      tailwindcss(),
      paraglideVitePlugin(PARAGLIDE_OPTIONS) as any,
      sveltekit(),
      restartOnRootEnv(repoRoot)
    ],
```
Use the call pattern of `resolveProjectIdEnv({ mode, repoRoot, target: process.env })` (line 18) for a config-time locale check that throws.

**Generated inlang project source:** `apps/frontend/project.inlang/settings.json`. It has `baseLocale` `en`, `locales` (line 3: en, fi, sv, da, et, fr, lb) and 48 `./messages/{locale}/<ns>.json` patterns (lines 9-58). Rebase them to `../messages/...` and append `../../instance/messages/{locale}.json` last. Patterns resolve against the parent of the `.inlang` folder, which is `apps/frontend/.instance/` (measured).

**`.gitignore`:** append `/.instance` near `/.svelte-kit` and `/.vite` in `apps/frontend/.gitignore`. Those entries follow the leading-slash style.

---

### Shared i18n catalogue helpers (extracted from `translations.test.ts`)

**Source to move, not copy** (`apps/frontend/src/lib/i18n/tests/translations.test.ts`):
- lines 26-37, `flattenMessageKeys`:
```ts
function flattenMessageKeys(tree: unknown, prefix: string): Array<string> {
  const isBranch =
    typeof tree === 'object' &&
    tree !== null &&
    !Array.isArray(tree) &&
    !('declarations' in tree || 'selectors' in tree || 'match' in tree);
  if (!isBranch) return [prefix];
  return Object.entries(tree).flatMap(([key, value]) => flattenMessageKeys(value, `${prefix}.${key}`));
}
```
- lines 130-133, `getPlaceholders`:
```ts
function getPlaceholders(value: string): Array<string> {
  return [...new Set([...value.matchAll(/\{([^{}]*)\}/g)].map((match) => match[1]))].sort();
}
```
- lines 135-138, `getHtmlTags` (for the tag-set check, Security)
- lines 695-730: `isVariantMessage`, `collectVariantTexts` and `collectStrings`, which handle the variant/plural shape

**Constraint:** the new module is imported by `vite.instance.ts`, whose config loader does not resolve `$lib`. The module itself must therefore use relative imports and Node built-ins only, with no `$lib/...` imports. `translations.test.ts` line 5 imports `$lib/i18n/wrapper`, so leave that import in the test, not in the module. Any location under `src/lib/i18n/utils/` (siblings: `assertTranslationKey.ts`, `isLocale.ts`) is already covered by the SvelteKit tsconfig. Export every helper with TSDoc.

---

### `apps/frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte` (modify)

**Current resolution** (lines 38-63):
```svelte
  const { appCustomization, darkMode, t } = getAppContext();
  const logoSrc = $derived(appCustomization.current.publisherLogo?.url);
  const inverseSrc = $derived(
    appCustomization.current.publisherLogo?.urlDark ?? appCustomization.current.publisherLogo?.url
  );
```
Insert `staticSettings.logo` (from `@openvaa/app-shared`, as `+layout.svelte` line 19 imports it) as the second tier: `publisherLogo?.url ?? staticSettings.logo?.url`. Keep the `inverseSrc` / invert-filter logic (lines 46-48, 84) working across both tiers. Update the `@component` docblock (lines 1-25), which says "If no logo files are supplied, the OpenVAA logo will be used". `appCustomization` and `darkMode` are destructured on line 38. They are stable references read through `.current`, which is allowed by CLAUDE.md's Context Destructuring Rule. Do not add a destructure of any reactive accessor.

### `AppLogo.svelte.test.ts` (new component test)

**Analog:** `apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte.test.ts` (lines 1-60)
```ts
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { box, context, ... } = vi.hoisted(() => {
  const box = { prefs: {} as Record<string, unknown> };
  const context = {
    t: (key: string) => key,
    userPreferences: {
      get current() {
        return box.prefs;
      }
    }
  };
  return { box, context, ... };
});

vi.mock('$lib/contexts/app', () => ({ getAppContext: () => context }));

const DataConsent = (await import('./DataConsent.svelte')).default;
...
  beforeEach(() => {
    target = document.createElement('div');
    document.body.appendChild(target);
  });
  afterEach(() => {
    if (component) unmount(component);
    component = undefined;
    target.remove();
    vi.clearAllMocks();
  });
```
Fake `appCustomization.current` and `darkMode.current` with getters, and mock `@openvaa/app-shared`'s `staticSettings` with `vi.mock` plus `importActual`, so that three tiers can be asserted: `publisherLogo` > `staticSettings.logo` > OpenVAA.

---

### `apps/frontend/Dockerfile` (modify)

**Current copy/build sequence** (lines 14-21, 23-28, 30-45):
```dockerfile
COPY package.json yarn.lock .yarnrc.yml turbo.json ./
COPY .yarn ./.yarn
# To be able to use --immutable, we need to copy all the packages in the workspace
COPY apps apps
COPY packages packages
# Root lifecycle scripts (the preinstall Node engine guard) run from scripts/ during install
COPY scripts scripts
RUN yarn install --immutable

FROM base AS shared
RUN yarn build

FROM base AS production
COPY --from=shared /opt/packages packages
COPY --from=shared /opt/apps/frontend apps/frontend
...
RUN yarn workspace @openvaa/frontend build
```
Add `COPY instance instance` beside `COPY scripts scripts`, with a one-line `#` comment in the same style. Add `COPY --from=shared /opt/instance instance` in `production` before line 45. `.dockerignore` excludes only `node_modules`, `build`, `.env*` and `infra`, so `instance` is sent. Note that `base` is the parent of `production` too, so `instance/` already exists there through `base`. The `--from=shared` copy is only needed if planning wants the shared-stage copy to be authoritative; confirm this during planning.

**CI comment:** `.github/workflows/main.yaml` lines 186-189 list what "the image copies" (`apps/`, `packages/`, `scripts/` and the root manifests). Add `instance/`. The docblock of `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts` (line 7) repeats that list. Update it too, and optionally add an assertion modelled on lines 124-126:
```ts
  it('builds a stage the Dockerfile still declares', () => {
    expect(DOCKERFILE).toMatch(/^FROM\s+\S+\s+AS\s+production\s*$/m);
  });
```

---

### `packages/dev-seed/tests/turboBuildInputsGate.test.ts` (extend)

**Pattern:**
- a dry run through the repo-pinned turbo (lines 46-77) with `--filter=@openvaa/frontend --filter=@openvaa/docs` (line 59)
- assertions on `resolvedTaskDefinition.inputs` (line 127) and on hashed `inputs` keys (lines 121-124)
```ts
  it('@openvaa/frontend#build excludes the generated Paraglide directory from its inputs', () => {
    expect(task('@openvaa/frontend#build').resolvedTaskDefinition.inputs).toContain(`!${GENERATED_PARAGLIDE}**`);
  });
```
Extend it as follows:
- add `--filter=@openvaa/app-shared` to the dry-run args, or rely on the `^build` dependency, which the dry run includes when filtered by frontend; verify which
- assert that `@openvaa/app-shared#build` `resolvedTaskDefinition.inputs` contains `$TURBO_ROOT$/instance/staticSettings.json` (verify the resolved form) and still contains the root's `src/**` (the `$TURBO_EXTENDS$` proof)
- assert that the frontend contains both instance globs
- update the file docblock (lines 1-9), which says "the two Vite apps' `build` tasks"

The `APPS` loop (lines 24-27, 100-115) asserts "hashes every tracked file". Do not add app-shared to `APPS` unless that invariant also holds for it.

---

### `instance/README.md` (new) and docs

There is no close analog for a root-level downstream-facing directory README. Take the tone and link format from `packages/app-shared/src/settings/README.md` (lines 1-17). Its content follows RESEARCH: the layout (Recommended Project Structure), the precedence chains (System Architecture Diagram, the "runtime precedence" lines), the validation rules, the non-overlayable surfaces (Open Question 5) and the downstream-CI caveat (Pitfall 7).

Docs to correct:
- `apps/docs/.../static-settings/+page.md` line 10 says "`colors`: the main DaisyUI theme colours". It becomes true again once the transform ships, so add the overlay and precedence.
- `apps/frontend/messages/README.md` lines 29-31 say "a pattern entry with no file is a build error". That is false per the measurement (Open Question 6).

## Shared Patterns

### Repo-root resolution
**Source:** `apps/frontend/svelte.config.js` line 6, `apps/frontend/vite.config.ts` line 11
**Apply to:** `tsup.config.ts`, `vite.instance.ts`, `instanceAssets.js`, `paraglide.options.ts`
```js
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
```
Pure helpers take `repoRoot` as a parameter (as `restartOnRootEnv(repoRoot)` and `resolveProjectIdEnv({ repoRoot })` do), so that tests can pass mkdtemp roots. There is no env override of the instance path.

### Deep merge
**Source:** `packages/app-shared/src/utils/mergeSettings.ts` lines 49-55
**Apply to:** `resolveStaticSettings.ts` only. No other merge code is written.

### Strict zod validation with path-precise errors
**Source:** `packages/app-shared/src/data/schemas/storedCustomization.schema.ts` lines 25-49 (`z.strictObject` at every level, including array elements), with `z.prettifyError` for the thrown message
**Apply to:** the settings schema, and also the message-overlay file shape if one is validated with zod. zod is a dependency of both app-shared (`package.json` line 26) and the frontend (`package.json` line 72).

### Node-environment test header + throwaway roots
**Source:** `apps/frontend/vite.projectIdEnv.test.ts` lines 1-36
**Apply to:** `vite.instance.test.ts`, `instanceAssets.test.ts`, and any app-shared test that touches the filesystem

### TSDoc on every export; `openvaa:` plugin names
**Source:** `apps/frontend/vite.restartOnRootEnv.ts` lines 4-20
**Apply to:** every new exported symbol and every Vite plugin

### No-op detection by layer input
**Apply to:** all four layers. The test for each layer is a different input:
- the settings layer: the file `instance/staticSettings.json` exists
- the assets layer: `instance/static/` is non-empty
- the messages layer: `instance/messages/*.json` exists
- the theme layer: none, because it always runs and is the identity on the base values

Never detect a layer by `existsSync('instance')`, because `instance/README.md` is tracked upstream.

### Comment hygiene
**Source:** CLAUDE.md § Comment Hygiene
**Apply to:** every new comment. Several existing analogs (`svelte.config.test.ts` line 15 and `staticSettings.type.ts` line 107) carry references or explanatory prose. Copy their structure, but not `.planning/` citations or history.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| esbuild `onLoad` plugin inside `packages/app-shared/tsup.config.ts` | config plugin | build-time module replacement | No tsup config in the repo uses `esbuildPlugins` or `onLoad`. Use the RESEARCH Pattern 1 prototype |
| `app.css` theme transform (the CSS rewrite logic in `vite.instance.ts`) | transform | CSS text rewrite | No existing Vite `transform` hook in the frontend. The plugin shell comes from `vite.restartOnRootEnv.ts`, and the rewrite logic is new |
| `instance/README.md` | docs | — | First repo-root directory meant for downstream content |

## Metadata

**Analog search scope:** `packages/app-shared/{src,tsup.config.ts,package.json}`, `apps/frontend/{*.ts,*.js,turbo.json,tsconfig.json,.gitignore,Dockerfile,project.inlang,src/app.css,src/lib/i18n,src/lib/dynamic-components}`, `apps/docs/tailwind.config.mjs`, `packages/dev-seed/tests/`, `scripts/lib/`, `.github/workflows/main.yaml`, root `turbo.json`, `.gitignore`, `.prettierignore`, `.dockerignore`
**Files scanned:** ~35
**Pattern extraction date:** 2026-11-23
