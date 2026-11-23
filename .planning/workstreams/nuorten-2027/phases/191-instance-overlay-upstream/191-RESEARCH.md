# Phase 191: Instance overlay (upstream) - Research

**Researched:** 2026-11-23
**Domain:** Build-time configuration layering across a Yarn/Turborepo monorepo: tsup (`@openvaa/app-shared`), SvelteKit 2 + Vite 8 + Tailwind 4/DaisyUI 5 (`@openvaa/frontend`), Paraglide JS 2 / inlang message format, Docker image build
**Confidence:** HIGH for the mechanisms, all prototyped or measured in this session. MEDIUM for the theme seam, which is reasoned from the Tailwind plugin's source and not built end to end.

<user_constraints>
## User Constraints

No CONTEXT.md exists (no discuss-phase was run). The constraints below come from the workstream roadmap's `## Decisions` (locked) and from the orchestrator's phase brief.

### Locked Decisions (workstream ROADMAP.md, "Decisions (exploration, 2026-11-23)")
- **Repository:** a private non-fork mirror with an `upstream` remote on `OpenVAA/voting-advice-application`. It diverges only by **added** files. An upstream file it would have to edit is a missing upstream seam, and the seam is fixed upstream.
- **Sync:** while the deployment stack is being restacked, downstream commits move with `git rebase --onto <new-upstream> <old-upstream>`. Once the stack is on `main`, downstream merges `main` and never rebases again.
- **Customisation:** config and settings only, through an instance overlay (this phase). No code changes are expected downstream.
- Phase 192's CI guard allowlists `instance/` as a downstream path, so the overlay directory is **`instance/` at the repo root**.

### Phase success criteria (treated as the requirements)
1. Overlay files under one instance directory replace values of `staticSettings` by deep merge, validated against `StaticSettings` at build time.
2. Static assets (logo, favicon, fonts) and translation overrides in the instance directory take precedence over the frontend's own.
3. With no instance directory the built output is the same as today's, and the existing unit and E2E suites pass unchanged.

### Brief constraints
- Built on a branch off the deployment stack (the current checkout, HEAD `8f2bb68a7`) and shipped as upstream PR 2.
- The Docker build (`apps/frontend/Dockerfile`, `.github/workflows/deploy.yml` → `infra/scripts/build-push-image.sh`) must pick up the instance directory.

### Claude's Discretion (no user decision yet; recommendations below)
Overlay file format, directory layout, where the merge runs, how assets and messages are layered, how a missing seam (theme colours, logo) is closed, and the test strategy.

### Deferred Ideas (OUT OF SCOPE)
- The Nuorten vaalikone overlay content itself (Phase 194).
- `dynamicSettings` / `app_settings` rows (Phase 194, through the database).
- Edge Function mail texts (`apps/supabase/supabase/functions/account-access/mailTemplates.ts`). These are hard-coded per locale and cannot be overlaid. Recorded under Open Questions.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SC-1 | `instance/` overlay deep-merges over `staticSettings` and is validated at build time | Merge in app-shared's tsup build through an esbuild `onLoad` plugin. Prototyped here: with no overlay the dist is byte-identical, and with an overlay the merged literal is inlined. Validation uses a zod v4 `strictObject` schema with `z.prettifyError`, verified on this tree's zod 4.6.5. Reuse the existing `mergeSettings` (Pattern 1). |
| SC-2 | Instance static assets and translation overrides take precedence | Assets: a merged copy of `static/` with `instance/static/` laid over it, used as `kit.files.assets` only when instance assets exist (Pattern 3). Messages: a generated inlang project whose `pathPattern` ends with `instance/messages/{locale}.json`. "Last file wins" and "missing file ignored" were both measured with Paraglide 2.25.4 here (Pattern 4). The logo and the theme colours/font need new seams (Patterns 5 and 6). |
| SC-3 | No instance means the same output, and suites pass unchanged | Each layer is a no-op when its input is absent: the tsup plugin returns early (measured byte-identical), `kit.files.assets` stays `'static'`, and Paraglide keeps `./project.inlang`. The theme transform is the identity on the base settings, enforced by a unit test. Proof plan under Validation Architecture. |
</phase_requirements>

## Summary

`staticSettings` is a TypeScript literal in `packages/app-shared/src/settings/staticSettings.ts`. tsup bundles it into `packages/app-shared/dist/index.js`. The frontend's SSR build does **not** bundle app-shared. `apps/frontend/build/server` contains 66 `from '@openvaa/app-shared'` imports, so the server loads the package dist at runtime, while the client bundle inlines it. `@openvaa/llm`, `@openvaa/argument-condensation`, `@openvaa/dev-seed` and `apps/docs` also read the dist [VERIFIED: grep of build output and package.json files]. **The merge therefore has to happen in app-shared's own build.** A Vite-side alias would give the server and the client different settings. An esbuild `onLoad` plugin in `packages/app-shared/tsup.config.ts` was prototyped in this session. With no overlay it returns before registering anything, and `dist/index.js` and its map came out byte-identical to the unmodified build. With an overlay it replaces the `staticSettings.ts` module with the merged, validated JSON literal [VERIFIED: scratch build].

The frontend side has three layers. **Assets:** SvelteKit takes exactly one `kit.files.assets` directory and uses it for dev serving, the manifest and the build copy. The overlay is therefore a generated merged copy (`apps/frontend/.instance/static`), selected in `svelte.config.js` only when `instance/static/` exists. **Messages:** the inlang message-format plugin merges array `pathPattern` entries with the last file winning and silently ignores missing files. A generated project that appends `instance/messages/{locale}.json` overrides compiled messages at the leaf-key level. This was measured with Paraglide 2.25.4. **Theme:** this is a real missing seam. `apps/frontend/src/app.css` hard-codes every DaisyUI colour and the `'Inter'` font family, so `staticSettings.colors` and `font.name` reach the frontend today only as `<meta name="theme-color">` and `ensureColors`. Overriding the colours in an overlay would change nothing visible. A `pre` Vite transform of `app.css` that writes the colour/font values from `staticSettings` closes this seam. It is the identity when the values equal today's literals, which they all do.

**Primary recommendation:**
- Use a JSON overlay at `instance/staticSettings.json`, merged and zod-validated inside app-shared's tsup build.
- Lay `instance/static/` over the frontend's `static/` through a generated `kit.files.assets` directory.
- Lay `instance/messages/{locale}.json` last in a generated inlang project.
- Add two seams: an always-on `app.css` theme transform driven by `staticSettings`, and an optional static logo fallback.
- Every layer is a strict no-op when its input is absent.
- Add `$TURBO_ROOT$/instance/...` turbo inputs to `@openvaa/app-shared` and `@openvaa/frontend`, a tracked `instance/README.md`, and `COPY instance instance` in the Dockerfile.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Settings overlay merge + validation | Build: `@openvaa/app-shared` (tsup) | — | The SSR server, client, llm, argument-condensation, dev-seed and docs all read app-shared's dist, so there is one merge point |
| Locale-set validation (supportedLocales ⊆ compiled catalogues) | Build: frontend (Vite config) | — | The frontend owns `project.inlang`, so app-shared must not read it |
| Static asset precedence | Build/dev: frontend (`svelte.config.js` → `kit.files.assets`) | CDN/static at runtime (adapter-node sirv serves `build/client`) | Kit accepts one assets directory |
| Translation precedence | Build: frontend (Paraglide compile) | Browser/SSR runtime: DB `translationOverrides` still win via `t()` | Compile-time keeps inlang format, plurals and types. Runtime overrides keep their existing priority |
| Theme colours / font | Build: frontend (Vite `pre` transform of `app.css`, before Tailwind) | — | DaisyUI theme vars are emitted CSS, so they must be set before Tailwind compiles |
| Logo fallback | Browser/SSR: `AppLogo.svelte` | DB `appCustomization.publisherLogo` (wins) | A static fallback below the backend value |
| Cache correctness | Turborepo task inputs | — | The instance dir lies outside both workspaces |
| Image build | Docker (`apps/frontend/Dockerfile`) | `build-push-image.sh` (git-archive context) | The context is the commit's tracked tree, so downstream's committed `instance/` arrives |

## Standard Stack

No new dependencies. Everything needed is already in the tree [VERIFIED: node require of installed package.json].

### Core
| Library | Version (installed) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tsup | 8.5.1 | app-shared build. The `esbuildPlugins` option hosts the overlay plugin | Already the package's bundler. `esbuildPlugins` is in `tsup/dist/index.d.ts:395` [VERIFIED] |
| zod | 4.6.5 (catalog) | `StaticSettingsSchema`: strict, readable errors (`z.prettifyError`), optional `z.toJSONSchema` | Already an app-shared dependency, used by every `*.schema.ts` there [VERIFIED: ran prettifyError/toJSONSchema] |
| `mergeSettings` (in-repo) | — | Deep merge: plain objects merged, arrays replaced whole, `__proto__`/`constructor`/`prototype` skipped | `packages/app-shared/src/utils/mergeSettings.ts`, already the single source of truth for settings merges. Don't write another |
| @inlang/paraglide-js | 2.25.4 | Message compile. `pathPattern` array merges, last wins | Already used, via `paraglide.options.ts` |
| @sveltejs/kit | 2.70.3 | `kit.files.assets` (deprecated-but-supported) | The only supported way to change the asset directory [VERIFIED: `types/index.d.ts:507-524`] |
| @tailwindcss/vite | 4.3.3 | Its transforms are `enforce: 'pre'` and compile the `code` they receive | So a `pre` plugin placed before `tailwindcss()` can rewrite `app.css` first [VERIFIED: dist source] |
| turbo | 2.11.4 | `$TURBO_ROOT$` and `$TURBO_EXTENDS$` input microsyntax in package `turbo.json` | Measured in a scratch monorepo (see Pitfall 5) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON overlay | `instance/staticSettings.ts` with `satisfies DeepPartial<StaticSettings>` | Gives IDE type-checking, but no workspace type-checks `instance/`. Node-only guards (`scripts/lib/static-settings.mjs`) cannot read TS without a build, and the merge would have to execute downstream code in the tsup config. JSON + zod gives better error paths and is read by plain Node |
| Merge in app-shared tsup | Vite `resolve.alias` of `@openvaa/app-shared` in the frontend | Wrong: SSR externalises app-shared, so the server would read base settings and the client merged ones. llm/argument-condensation/docs would also diverge |
| Generated `kit.files.assets` dir | Vite plugin serving `instance/static` in dev and copying in `closeBundle` | Ordering against kit's own copy (`exports/vite/index.js:1535`) and kit's asset manifest (`create_manifest_data` lists `files.assets`) gets fragile. A file that exists only in the overlay would be missing from the manifest |
| Generated inlang project (compile-time) | Runtime instance layer in `src/lib/i18n/overrides.ts` (`import.meta.glob`) | A runtime layer needs ICU strings, unlike the inlang-format catalogues. It changes the bundle even with no instance, loses compile-time placeholder typing, and ranks against DB overrides in a new way |
| Paraglide `fs` option (overlay fs) | — | Documented as "Useful for testing", so it is not a stable seam |

**Installation:** none.

## Package Legitimacy Audit

This phase installs no external packages: every library above is already in `yarn.lock` and on disk. slopcheck was not run because there is nothing to check.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| (none new) | — | — | — | — | n/a | — |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 downstream repo (adds files only)            upstream code (this phase)
 ───────────────────────────────              ─────────────────────────────────────────────
 instance/staticSettings.json ──┐
                                ├──> app-shared tsup build ──[esbuild onLoad plugin]──┐
 packages/app-shared/src/       │      reads base literal (staticSettings.ts)         │
   settings/staticSettings.ts ──┘      mergeSettings(base, overlay)                   │
                                       StaticSettingsSchema.parse  ──fail──> build error (exit≠0)
                                                                                      v
                                                              packages/app-shared/dist/index.js
                                                              (merged literal, or byte-identical)
                                                                      │
              ┌──────────────────────────┬────────────────────────────┼──────────────┬──────────────┐
              v                          v                            v              v              v
     frontend SSR (runtime import)  frontend client bundle      vite.config.ts   llm/arg-cond.   docs tailwind
                                                                 │
 instance/messages/{locale}.json ─> paraglide options ─[has msgs?]─ no ──> ./project.inlang (unchanged)
                                    │                   yes ──> .instance/project.inlang (generated;
                                    │                           base pathPattern + instance last)
                                    v                                     v
                              validate keys/placeholders/locales ──> Paraglide compile ──> src/lib/paraglide
                                                                 │
 apps/frontend/src/app.css ──> [pre transform: colours/font from merged staticSettings] ──> Tailwind/DaisyUI ──> CSS
                                                                 │
 instance/static/** ─┐                                           │
 apps/frontend/static/** ─┴─> svelte.config.js ─[instance/static?]─ no ──> kit.files.assets='static'
                                           yes ──> copy static/ then instance/static/ over it
                                                   into .instance/static ──> kit.files.assets

 runtime precedence for text: DB appCustomization.translationOverrides > instance messages > base messages
 runtime precedence for logo: DB appCustomization.publisherLogo > staticSettings.logo (instance) > OpenVAA logo

 Docker: context = git archive of HEAD (tracked instance/ included)
   base stage:  COPY instance instance   (instance/README.md is always tracked upstream, so COPY never fails)
   shared:      yarn build  (app-shared merges; frontend prepares assets/messages)
   production:  COPY --from=shared /opt/instance instance; frontend build again
```

### Recommended Project Structure
```
instance/                                  # repo root; upstream tracks only README.md
├── README.md                              # (upstream) layout, precedence, validation rules
├── staticSettings.json                    # (downstream) deep-partial StaticSettings
├── static/                                # (downstream) overlays apps/frontend/static by path
│   ├── favicon.png
│   ├── images/hero.png
│   └── fonts/<family>.css, *.woff2
└── messages/                              # (downstream) inlang-format, nested keys, partial
    ├── fi.json
    └── sv.json

packages/app-shared/
├── src/settings/staticSettings.schema.ts        # zod schema + compile-time equality with StaticSettings
├── src/settings/staticSettings.schema.test.ts
├── src/settings/resolveStaticSettings.ts        # pure: (base, overlay: unknown) => StaticSettings | throws
├── src/settings/resolveStaticSettings.test.ts
├── tsup.config.ts                               # reads ../../instance/staticSettings.json; esbuild plugin
└── turbo.json                                   # NEW: extends //, inputs $TURBO_EXTENDS$ + $TURBO_ROOT$/instance/staticSettings.json

apps/frontend/
├── vite.instance.ts / vite.instance.test.ts     # theme transform plugin, locale check, message overlay project
├── instanceAssets.js (+ test)                   # plain JS for svelte.config.js: merged assets dir
├── paraglide.options.ts                         # becomes instance-aware (shared by vite.config + compile script)
├── .gitignore                                   # + /.instance
└── turbo.json                                   # + $TURBO_ROOT$/instance/static/**, instance/messages/**
```
The `vite.<concern>.ts` + `.test.ts` pairs and their listing in `apps/frontend/tsconfig.json` `"files"` follow the existing `vite.projectIdEnv.ts` / `vite.restartOnRootEnv.ts` pattern [VERIFIED: tsconfig.json].

### Pattern 1: Build-time settings merge in tsup (prototyped)
**What:** an esbuild plugin replaces the `staticSettings.ts` module's contents with the merged literal, only when the overlay exists.
**Example (the scratch prototype; it built and inlined `x@y.fi`, and with no overlay the dist js+map were `cmp`-identical):**
```ts
// packages/app-shared/tsup.config.ts (sketch; add schema validation via resolveStaticSettings)
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';
import { staticSettings as base } from './src/settings/staticSettings';
import { mergeSettings } from './src/utils/mergeSettings';

const OVERLAY = fileURLToPath(new URL('../../instance/staticSettings.json', import.meta.url));
const STATIC = fileURLToPath(new URL('./src/settings/staticSettings.ts', import.meta.url));

function instanceStaticSettings() {
  return {
    name: 'openvaa-instance-static-settings',
    setup(build) {
      if (!existsSync(OVERLAY)) return;                       // no instance: plugin inert, dist unchanged
      const merged = mergeSettings(base, JSON.parse(readFileSync(OVERLAY, 'utf8')));
      // resolveStaticSettings(base, overlay) should do merge + StaticSettingsSchema.parse + prettifyError
      build.onLoad({ filter: /settings[\\/]staticSettings\.ts$/ }, (args) =>
        args.path === STATIC
          ? { contents: `export const staticSettings = ${JSON.stringify(merged, null, 2)};\n`, loader: 'ts' }
          : undefined);
    }
  };
}
export default defineConfig({ entry: ['src/index.ts'], format: ['esm'], outDir: 'dist', clean: true, sourcemap: true,
  esbuildPlugins: [instanceStaticSettings()] });
```
Notes:
- The `.d.ts` comes from `tsc --emitDeclarationOnly` over the unchanged source, so consumers still see `StaticSettings`.
- Strip a top-level `$schema` key from the overlay before the merge, if an editor JSON schema is offered.
- Types the `plugin` parameter with esbuild's `Plugin` type (no `any`; the checklist forbids it).

### Pattern 2: Schema kept equal to the type
**What:** `StaticSettingsSchema` (zod `strictObject` at every level; `z.array(...).readonly()` for `supportedLocales`; a discriminated union for `dataAdapter`), with a compile-time mutual-assignability assertion against `StaticSettings`. A drift then fails `typecheck`, and the shipped literal is asserted to parse in a unit test.
- Colours: validate with a hex regex. The values are substituted into CSS (Pattern 6), so this is also an injection control.
- `font.url`: allow a same-origin path or an `https:` URL only.
- Enforce at most one `isDefault`.
- **Reject `dataAdapter` in the overlay** (see Pitfall 4).
- Strictness catches typos (`colours`, `primay`), which a TS `DeepPartial` cannot catch in JSON.

### Pattern 3: Asset overlay via a generated `kit.files.assets`
`svelte.config.js` (loaded by `svelte-kit sync`, `vite dev`, `vite build`, svelte-check) calls a plain-JS helper:
- If `instance/static/` does not exist, keep `assets: 'static'`. This is the default, so the config is unchanged in effect.
- Otherwise `rm -rf apps/frontend/.instance/static`, copy `static/` into it, copy `instance/static/` over it, and return that path.

Notes:
- Copy dereferencing nothing: refuse symlinks in `instance/static` (Security).
- `%sveltekit.assets%/favicon.png` in `src/app.html` and the `/images/hero*.png` fallbacks then resolve to instance files of the same name, with no code change.
- `svelte.config.test.ts` already tests the config's `kit.env.dir` and `kit.version.name`. Add `kit.files.assets` cases there.

### Pattern 4: Message overlay via a generated inlang project (measured)
**Measured (Paraglide 2.25.4, this session):**
- A generated `gen/project.inlang/settings.json` with `pathPattern = [...base patterns rebased, '<rel>/instance/messages/{locale}/overrides.json']` compiled an `en` override (`dynamic.appName` → `INSTANCE NAME`).
- The other six locales kept their base text. No `fi` override file existed and the compile still succeeded.
- `pathPattern` entries resolve against the **parent directory of the `.inlang` folder**, not against the project folder or the cwd.

The plugin README confirms: "Messages from all matching files will be merged", "the value from the last file in the array will override earlier ones", "Missing translation files are silently ignored", and "Nested objects are flattened using dot notation" [CITED: cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/README.md].

Recommended shape:
- Make `paraglide.options.ts` export the options through a function that, when `instance/messages/` holds files, writes `apps/frontend/.instance/project.inlang/settings.json` (base settings with `pathPattern` rebased plus `…/instance/messages/{locale}.json` appended last) and returns that project path. Otherwise it returns `./project.inlang` exactly as today.
- Both `vite.config.ts` and `scripts/compile-paraglide.ts` use it.
- **Validate before compiling.** Every override key must already exist in the base `en` catalogue: an unknown key compiles silently into a new message outside `TranslationKey`. The `{placeholder}` set must equal the base message's (messages/README rules 3–4). The locale must be in `project.inlang` `locales`. Reuse the flatten/placeholder logic of `src/lib/i18n/tests/translations.test.ts` by extracting it, not by copying it ("no repeated code").

### Pattern 5: Logo seam
Today the logo is `appCustomization.current.publisherLogo`, a DB storage path, with the OpenVAA logo as the fallback (`src/lib/dynamic-components/appLogo/AppLogo.svelte`). No static file can supply it. Recommend an optional `StaticSettings.logo?: { url: string; urlDark?: string }` (or a name chosen in planning) used as the fallback: `publisherLogo` > `staticSettings.logo` > OpenVAA logo. With the field absent, behaviour is unchanged. Alternatively the logo goes through the DB in Phase 194 (see Open Questions).

### Pattern 6: Theme seam: `app.css` driven by `staticSettings`
`app.css` hard-codes the DaisyUI light/dark themes and `--font-base: 'Inter', …`, and `staticSettings.colors`, `font.name` and `font.style` are read nowhere in the frontend's CSS [VERIFIED: grep]. The docs page claims colours are "the main DaisyUI theme colours", which is now false for the frontend. Add a Vite plugin `{ enforce: 'pre' }` placed **before** `tailwindcss()` in `vite.config.ts` that transforms only `src/app.css`. Inside the `name: 'light'` / `name: 'dark'` `@plugin 'daisyui/theme'` blocks it sets:
- `--color-primary` and `--color-success` ← `primary`
- `--color-accent` and `--color-info` ← `accent`
- `--color-warning` and `--color-error` ← `warning`
- `secondary`, `neutral` and `base-100/200/300` each ← the key of the same name
- `--line-color` in `:root,[data-theme='light']` / `[data-theme='dark']`
- the first family of `--font-base` ← `font.name`, and the fallback list ← `font.style` (sans|serif; the docs app's `fontFallbacks` is the reference)

Every current base value equals the `app.css` literal (checked: all nine keys in both themes), so the transform is the identity with no instance. A unit test must assert exactly that, plus "each mapped declaration occurs exactly once" to catch `app.css` drift. Tailwind's build transform compiles the `code` it is handed (`y.generate(l, …)` in `@tailwindcss/vite` 4.3.3), so a preceding transform takes effect [VERIFIED: dist source]. The `*-content` colours are not in `StaticSettings`. Whether to add optional content keys is an Open Question.

### Anti-Patterns to Avoid
- **Editing `staticSettings.ts` in place or generating it into `src/`:** downstream must not edit it, and a generated `src/` file breaks the "tracked = hashed" turbo gate and the Deno test that imports the source.
- **Merging in the frontend only:** SSR reads app-shared's dist (Summary).
- **Committing `apps/frontend/.instance/`:** it is generated, so gitignore it (`/.instance` in `apps/frontend/.gitignore`).
- **Detecting "instance present" by directory existence:** upstream tracks `instance/README.md`. Detect each layer by its own input (`staticSettings.json` exists; `static/` and `messages/` non-empty).
- **An env var overriding the instance path:** turbo hashes `$TURBO_ROOT$/instance/**`, not an arbitrary directory. A path override would replay stale caches unless it were also in `env` and the inputs. Keep the path fixed, and let tests call the pure functions with fixture directories.
- **Historical comments:** CLAUDE.md Comment Hygiene applies to every new comment (no "previously", no plan ids).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deep merge | a new merge util | `mergeSettings` from `@openvaa/app-shared` | Already handles arrays-replace-whole, prototype keys and undefined-skip, and is tested |
| Settings validation | hand-written key walks | zod `strictObject` + `z.prettifyError` | Gives path-precise errors and unknown-key rejection (verified output: `✖ Unrecognized key: "c" → at a`) |
| Message merging | your own JSON merge into copies of every catalogue file | inlang `pathPattern` array, last wins | Native, measured, and keeps the plugin's flattening/variant semantics |
| Placeholder extraction | a new regex | extract `getPlaceholders`/`flattenMessageKeys` from `translations.test.ts` into a shared module | Keeps a single rule for what a placeholder is |
| Assets precedence middleware | a Vite dev middleware + build copy | `kit.files.assets` pointing at a merged dir | Kit's manifest, dev server, preview and build copy all follow it |

**Key insight:** every layer already has a native "one input" seam (tsup module load, `kit.files.assets`, inlang project, a CSS transform before Tailwind). The phase swaps that input for a merged one only when instance content exists, which is what makes SC-3 provable.

## Common Pitfalls

### Pitfall 1: Theme overrides that change nothing
**What goes wrong:** an overlay sets `colors.light.primary`, the build passes, and the app is still OpenVAA blue.
**Why:** `app.css` hard-codes DaisyUI theme values (Pattern 6).
**How to avoid:** ship the `app.css` transform in this phase and cover it with an "overlay colour appears in emitted CSS" test.
**Warning signs:** only `<meta name="theme-color">` changes.

### Pitfall 2: SSR and client settings diverge
**What goes wrong:** the merge happens in Vite, so the client shows the instance locales while SSR uses the base ones, causing a hydration mismatch.
**How to avoid:** merge in app-shared's dist only.
**Warning signs:** `build/server` still contains `first.last@openvaa.org` when the overlay changed `admin.email`.

### Pitfall 3: Unknown or re-signatured message keys compile silently
An instance key absent from base becomes a new, unreachable message. A changed `{placeholder}` changes the generated function's input type. Missing locale files are ignored silently, so a misnamed `instance/messages/fi-FI.json` simply does nothing. Validate keys, placeholders and file names (Pattern 4) and fail the build.

### Pitfall 4: `dataAdapter.pageSize` drift against the hosted-settings guards
`scripts/lib/static-settings.mjs` `readPageSize` reads **the text of `staticSettings.ts`** for `assert:hosted-settings-parity` and `infra/scripts/probe` (`expected.mjs:407-419`, `checks.mjs:304`), and `hosted-settings.json` is upstream-owned and shared. An overlay `pageSize` would leave those guards checking the wrong value. **Recommend rejecting `dataAdapter` in the overlay schema.** The alternative is to teach `readPageSize` to read the JSON overlay (possible because it is JSON).

### Pitfall 5: Turborepo inputs replace, not extend
Measured with turbo 2.11.4 in a scratch monorepo:
- A package `turbo.json` with `"inputs": ["$TURBO_ROOT$/instance/**"]` **drops** the root's `src/**`.
- `["$TURBO_EXTENDS$", "$TURBO_ROOT$/instance/**"]` keeps them. The hashed keys appear as `../../instance/staticSettings.json`.
- An absent instance dir is harmless.

So:
- `packages/app-shared/turbo.json` must use `$TURBO_EXTENDS$`.
- `apps/frontend/turbo.json` already lists `$TURBO_DEFAULT$`, so append `$TURBO_ROOT$/instance/static/**` and `$TURBO_ROOT$/instance/messages/**`.
- Extend `packages/dev-seed/tests/turboBuildInputsGate.test.ts`, which already asserts the frontend's resolved inputs, with the instance inputs for both tasks.

Adding `packages/app-shared/turbo.json` also adds that file to app-shared's hash. That is expected.

### Pitfall 6: Docker `COPY` of a missing directory fails
`COPY instance instance` errors when the source is absent, and wildcard tricks behave inconsistently across BuildKit versions [CITED: moby copy.go "no source files were specified"; moby/buildkit#4900]. Tracking `instance/README.md` upstream makes the directory always present. Then:
- base stage: `COPY instance instance`
- production stage: `COPY --from=shared /opt/instance instance`, because production re-runs the frontend build, which reads `instance/static` and `instance/messages`

The alternative is `RUN --mount=type=bind,target=/ctx … cp -R /ctx/instance …` (BuildKit). The build context is `git archive` of the commit (`build-push-image.sh:189-201`), so only tracked overlay files arrive, which is correct. `.dockerignore` does not exclude `instance`. Update the `docker-image-build` comment in `main.yaml`, which lists what the image copies.

### Pitfall 7: Downstream CI running upstream unit tests against an instance
Upstream tests import app-shared's dist (frontend vitest) or pin base values (`nameRule.test.ts`, the `perm-localisation-positive` comments assume en/fi/sv, `visual-regression` assumes Inter). Downstream, with an overlay present, some would fail. This is not an upstream failure, but Phase 192/195 should know. Recommend that downstream CI not run the upstream unit/E2E suites with the overlay, or that it runs them with `instance/` removed. Record this in `instance/README.md`.

### Pitfall 8: Generated paths, prettier and lint
Root `prettier --check .` will format-check `instance/*.json` and `instance/README.md`, which is fine and keeps downstream tidy. Add `apps/frontend/.instance/` to `.gitignore` (prettier respects `.gitignore` by default since v3 [ASSUMED]) and to any eslint ignores, if eslint globs reach it.

### Pitfall 9: Dev loop staleness
`yarn dev` runs `turbo watch build --filter=./packages/*`. Whether turbo watch reacts to `$TURBO_ROOT$` inputs is unverified [ASSUMED], and the merged assets dir is built at config load. Extend `vite.restartOnRootEnv.ts`'s idea (restart on a root file change) to `instance/`, or document "restart `yarn dev` after editing `instance/`".

## Code Examples

### Strict schema + readable build error (verified API)
```ts
// Source: zod 4.6.5 in this tree (z.strictObject, z.prettifyError verified by running them)
import { z } from 'zod';
const r = StaticSettingsSchema.safeParse(merged);
if (!r.success) throw new Error(`instance/staticSettings.json does not produce valid StaticSettings:\n${z.prettifyError(r.error)}`);
```

### Generated inlang project (measured)
```js
// settings.json for apps/frontend/.instance/project.inlang — patterns resolve against apps/frontend/.instance/
const s = structuredClone(baseSettings);
s['plugin.inlang.messageFormat'].pathPattern = [
  ...s['plugin.inlang.messageFormat'].pathPattern.map((p) => p.replace('./messages', '../messages')),
  '../../../instance/messages/{locale}.json' // last wins; a missing locale file is ignored
];
```

### Package turbo config (measured semantics)
```json
{ "extends": ["//"], "tasks": { "build": { "inputs": ["$TURBO_EXTENDS$", "$TURBO_ROOT$/instance/staticSettings.json"] } } }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind 3 config reading `staticSettings` (still in `apps/docs/tailwind.config.mjs`) | Tailwind 4 CSS-first `app.css` with literal DaisyUI 5 themes | frontend TW4/DaisyUI5 migration | Breaks the settings→theme link (Pattern 6) |
| `kit.files.*` | still supported, marked `@deprecated` in favour of monorepos | SvelteKit 2.x | Usable. Watch for removal in Kit 3 |
| zod 3 `.deepPartial()` | removed in zod 4 | zod 4 | Validate the **merged** object against the full strict schema instead of the partial overlay |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prettier 3 ignores `.gitignore`d paths by default | Pitfall 8 | `.instance/` gets format-checked; fix with `.prettierignore` |
| A2 | `turbo watch` does not reliably rebuild on `$TURBO_ROOT$` inputs | Pitfall 9 | Only dev ergonomics |
| A3 | The tsup `onLoad` path equality holds on every OS (posix paths in CI/Docker) | Pattern 1 | Windows dev builds ignore the overlay; normalise with `path.resolve` |
| A4 | Tailwind's `@reference "./app.css"` consumers do not need the substituted values (they emit no theme CSS) | Pattern 6 | Some component CSS keeps base literals; verify by grepping the built CSS for the overlay colour |
| A5 | Downstream wants the instance theme only in the frontend; docs picking up overlay colours from app-shared dist is acceptable | Arch map | Cosmetic |

## Open Questions (RESOLVED)

All seven were resolved in planning (auto mode) by adopting the recommended default.

1. **Logo seam: static fallback or DB only?** Recommend adding optional `staticSettings.logo` (Pattern 5) so "logo" in SC-2 is met by files. The other way is to upload it in Phase 194 into `public-assets` and `app_settings.customization.publisherLogo`.
   RESOLVED: optional static fallback `staticSettings.logo`; precedence `publisherLogo` > `staticSettings.logo` > OpenVAA logo (Plans 01, 02).
2. **Content colours** (`primary-content` etc.) are not in `StaticSettings`. A light instance primary would keep white text and could fail WCAG AA. Recommend adding optional `*-content` keys to both themes now, at no cost when absent (identity transform). Otherwise Phase 194 would need another upstream PR.
   RESOLVED: optional `*-content` keys added to both themes now; absent in the shipped literal, so the transform stays the identity (Plans 01, 02).
3. **May the overlay set `dataAdapter`?** Recommend no, rejected by the schema (Pitfall 4).
   RESOLVED: no; `resolveStaticSettings` rejects a `dataAdapter` key in the overlay (Plan 01).
4. **Overlay `dynamicSettings` defaults too?** Recommend no. Dynamic settings belong to the DB rows of Phase 194.
   RESOLVED: no `dynamicSettings` overlay; dynamic settings stay in the database rows of Phase 194 (documented in `instance/README.md`, Plan 05).
5. **Edge Function mail texts** cannot be overlaid (they are hard-coded in `mailTemplates.ts`, and an Edge Function cannot import catalogues). Recommend recording this as a known non-overlayable surface in `instance/README.md`. If Nuorten needs custom mail copy, that is a later upstream seam.
   RESOLVED: not overlayable; recorded as a known non-overlayable surface in `instance/README.md` (Plan 05).
6. **The messages README says "a pattern entry with no file is a build error"**, but the plugin README and this session's measurement say missing files are ignored. Recommend correcting `apps/frontend/messages/README.md` rule 2 while touching it, and checking the base pattern with a test instead.
   RESOLVED: `apps/frontend/messages/README.md` rule 2 corrected; file completeness stays enforced by `translations.test.ts` (Plan 04).
7. **Overlay messages file granularity:** one file per locale (`instance/messages/fi.json`, nested keys) is recommended over mirroring the 48 namespace files. It is simpler for downstream, and last-wins works at the flattened-key level.
   RESOLVED: one file per locale, `instance/messages/<locale>.json` with nested keys (Plan 04).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | builds, tests | ✓ | 24.21.0 | — |
| Yarn | workspaces | ✓ | 4.18.1 | — |
| turbo | builds, gate test | ✓ | 2.11.4 | — |
| Docker | image build check, Supabase for E2E | ✓ (binary; daemon not started at boot) | 29.10.0 | run `openvaa-stack-up` first |
| Supabase CLI | E2E | ✓ | — | — |
| `openvaa-stack-up` | E2E pre-step | ✓ | — | — |
| Network to cdn.jsdelivr.net | Paraglide plugin modules (`project.inlang` `modules`) | ✓ (compiled fine in this session) | — | — |
| `E2E_SLOW_HOST` support in `tests/playwright.config.ts` | full suite on 4 CPUs | ✓ (present on this branch) | — | `--project` runs |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (per workspace, `vitest run`); Playwright for E2E |
| Config files | `packages/app-shared/vitest.config.ts`, `apps/frontend/vitest.config.ts`, `packages/dev-seed` (repo-meta gates), `tests/playwright.config.ts` |
| Quick run | `yarn workspace @openvaa/app-shared test:unit` · `yarn workspace @openvaa/frontend test:unit` · `yarn workspace @openvaa/dev-seed vitest run tests/turboBuildInputsGate.test.ts` |
| Full unit | `yarn test:unit` |
| E2E (targeted) | `openvaa-stack-up` then `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/191-<plan>-<project> --no-db-reset --no-watch --project <p>` (one project per run; the wrapper keeps only the last `--project`) |
| E2E (full) | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/191-full --no-db-reset --no-watch` (final plan only) |

### Phase Requirements → Test Map
| Req | Behavior | Type | Automated Command | File Exists? |
|-----|----------|------|-------------------|-------------|
| SC-1 | Shipped literal parses under `StaticSettingsSchema`; schema ≡ type (compile-time) | unit + typecheck | `yarn workspace @openvaa/app-shared test:unit` + `yarn workspace @openvaa/app-shared typecheck` | ❌ Wave 0 |
| SC-1 | `resolveStaticSettings`: no overlay → deep-equal base; overlay merges (objects deep, `supportedLocales` whole); unknown key / bad hex / `dataAdapter` / two defaults → throws with path | unit | same | ❌ Wave 0 |
| SC-1 | tsup build with fixture overlay inlines merged values; with none, `dist/index.js` byte-identical | build smoke script (temp copy, as prototyped) | `node .planning/.../191-build-identity.mjs` (planning artifact) or a vitest that runs tsup into a temp dir | ❌ |
| SC-2 | Assets helper: absent → `'static'`; present → merged dir where instance file wins and base-only files remain; refuses symlinks | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ Wave 0 |
| SC-2 | `kit.files.assets` cases in `svelte.config.test.ts` | unit | same | ✅ (extend) |
| SC-2 | Message overlay: generated settings pathPattern = base (rebased) + instance last; unknown key / placeholder mismatch / unknown locale → error; none → `./project.inlang` | unit | same | ❌ Wave 0 |
| SC-2 | Compile with fixture overlay yields overridden message, other locales untouched (as measured) | integration (Paraglide `compile` into temp outdir) | same | ❌ |
| SC-2 | Theme transform: base settings → output === input; overlay colour → replaced in both theme blocks; each mapped declaration occurs once | unit | same | ❌ Wave 0 |
| SC-2 | AppLogo: `publisherLogo` > `staticSettings.logo` > OpenVAA | component unit (jsdom) | same | ❌ |
| SC-3 | turbo inputs include instance paths for app-shared and frontend | repo-meta unit | dev-seed gate test | ✅ (extend) |
| SC-3 | UI unchanged with no instance | E2E | `visual-regression` (pixel baselines: strongest proof that CSS, fonts and favicon are identical), `voter-dark-mode`, `perm-localisation-positive`, `a11y-smoke`, `voter-journey` | ✅ |
| SC-3 | Whole suite unchanged | E2E full | full run in the final plan, judged against the last full run | ✅ |
| Docker | image builds with and without overlay | manual/CI | `docker build --file apps/frontend/Dockerfile --target production .` (needs dockerd) | ✅ CI job `docker-image-build` |

### "No instance = same output" proof (final plan)
Build the base commit (`8f2bb68a7`, in a `git worktree`) and HEAD, both without `instance/` overlay files. Compare:
1. `packages/app-shared/dist/index.js`, `staticSettings` section: identical literal.
2. `apps/frontend/src/lib/paraglide/**`: byte-identical.
3. `apps/frontend/build/client`, every non-`_app` file (the static copy): byte-identical.
4. `build/client/_app/immutable/assets/*.css`: identical names and bytes. Vite content-hashes them, so equal names mean equal CSS, which proves the theme transform is the identity.

Differences are expected only in JS chunks containing new code (AppLogo, for example). List them in the plan summary.

### Sampling Rate
- **Per task commit:** the affected workspace's `test:unit`, plus `typecheck` for app-shared/frontend.
- **Per plan:** for each new or rewritten test, a red run then a green one. After the plan's last code commit, one targeted `--project` run per affected project. Frontend-wide changes (`app.css` transform, `svelte.config.js`, `paraglide.options.ts`, AppLogo) touch every page, so run at least `visual-regression`, `voter-dark-mode`, `perm-localisation-positive`, `a11y-smoke` and `voter-journey`. Record project test-count deltas and title pins against the last full run.
- **Phase gate:** the final plan runs one full suite plus the build-identity comparison above, plus `yarn lint:check` (it includes `assert:hosted-settings-parity` and `assert:comment-hygiene`) and `yarn format:check`.

### Wave 0 Gaps
- [ ] `packages/app-shared/src/settings/staticSettings.schema.test.ts` and `resolveStaticSettings.test.ts`
- [ ] `apps/frontend/vite.instance.test.ts` (theme transform, message project, locale check), with fixture overlays under `apps/frontend/tests/fixtures/instance/` or similar
- [ ] the assets helper's test, and `svelte.config.test.ts` extensions
- [ ] `turboBuildInputsGate.test.ts` extension
- [ ] a shared i18n flatten/placeholder module extracted from `translations.test.ts`

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (build-time input from a repo directory) | zod strict schema; hex regex for colours; URL/path rule for `font.url`/`logo.url`; key/placeholder validation for messages |
| V6 Cryptography | no | — |
| V14 Configuration | yes | Fixed instance path, no env override; overlay cannot change `dataAdapter` |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| CSS injection through colour/font values substituted into `app.css` | Tampering | Hex-only colours; font name restricted to a quoted family charset |
| Prototype pollution through overlay JSON keys | Tampering | `mergeSettings` skips `__proto__`/`constructor`/`prototype`; `strictObject` rejects unknown keys |
| Symlink in `instance/static` copying files from outside the repo into the image | Information disclosure | Refuse symlinks (`lstat`) when building the merged dir |
| HTML in overridden messages | XSS | Existing sanitiser path for HTML messages applies unchanged; the instance is trusted repo content, but keep the tag-set check against base |
| Untracked/ignored files leaking into the image | Information disclosure | Already mitigated: the context is `git archive` of the commit |

## Project Constraints (from CLAUDE.md)
- E2E hard rule: no failing, flaky or "did not run" tests. Targeted `--project` runs per plan, one full suite in the final plan. A void run (exit 8) is re-run.
- Run `openvaa-stack-up` before any E2E or `yarn dev` (cloud env).
- Comment Hygiene in `apps/`, `packages/`, `tests/` and `infra/`: no history, no plan references beyond `see phase N`, nothing addressed to the reviewer.
- TypeScript strict, no `any` (type esbuild plugins with `esbuild`'s `Plugin`).
- Every exported symbol carries TSDoc.
- Docs: update `apps/docs/.../configuration/static-settings/+page.md` (overlay, precedence, the colours now actually theme the app), `packages/app-shared/src/settings/README.md` and `apps/frontend/messages/README.md`, and add `instance/README.md`.
- Localization: overlays cannot introduce a locale without catalogues, so validate `supportedLocales` ⊆ `project.inlang` `locales`. This also keeps `SIGN_IN_MAIL_LOCALES` covering every offered locale.
- WCAG 2.1 AA: instance colours can break contrast. See Open Question 2. `a11y-smoke` is in the targeted runs.
- Follow `.agents/code-review-checklist.md`: no duplicated code (extract the i18n helpers), errors handled with clear messages, docs updated.
- `@openvaa/app-shared` stays ESM-only, and its `exports` map is unchanged: the schema/resolver stay internal or join the existing barrel. Do not add a node-only module to the barrel.

## Sources

### Primary (HIGH confidence)
- Codebase:
  - `packages/app-shared/{src/settings/*,src/utils/mergeSettings.ts,tsup.config.ts,package.json}`
  - `apps/frontend/{vite.config.ts,svelte.config.js,paraglide.options.ts,project.inlang/settings.json,turbo.json,src/app.css,src/app.html,src/routes/+layout.svelte,src/lib/i18n/*,src/lib/dynamic-components/appLogo/AppLogo.svelte,Dockerfile}`
  - `turbo.json`, `packages/dev-seed/tests/turboBuildInputsGate.test.ts`, `scripts/lib/static-settings.mjs`, `infra/scripts/build-push-image.sh`, `.github/workflows/main.yaml`
- Measurements in this session:
  - the tsup overlay plugin prototype (byte-identical without an overlay)
  - the Paraglide 2.25.4 compile with an appended `pathPattern` (last wins, missing ignored, base = parent of `.inlang`)
  - turbo 2.11.4 dry runs (`$TURBO_ROOT$`, `$TURBO_EXTENDS$`, replace semantics)
  - zod 4.6.5 `prettifyError`/`toJSONSchema`
  - `@tailwindcss/vite` 4.3.3 dist (`enforce: 'pre'`, compiles the passed code)
  - `@sveltejs/kit` 2.70.3 source and types for `files.assets`
  - the built `apps/frontend/build/server` imports
- [inlang plugin-message-format v4 README](https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/README.md): array merge, last wins, missing files ignored, nested flattening

### Secondary (MEDIUM confidence)
- [moby copy.go](https://fuchsia.googlesource.com/third_party/github.com/moby/moby/+/807e415260380b55af87ef50d72abcef9466e43b/builder/dockerfile/copy.go): "no source files were specified"
- [moby/buildkit#4900](https://www.github.com/moby/buildkit/issues/4900): wildcard no-match behaviour differs by version
- [Docker COPY "no source files" guide](https://oneuptime.com/blog/post/2026-02-08-how-to-fix-docker-copy-failed-no-source-files-were-specified-errors/view)

### Not reachable
- turborepo.com docs could not be fetched (host not in the session's allowed network domains). Turbo semantics were measured locally instead.

## Metadata

**Confidence breakdown:**
- Settings merge: HIGH (prototyped).
- Messages: HIGH (measured).
- Turbo: HIGH (measured).
- Assets: MEDIUM-HIGH (kit source read; not built end to end).
- Theme transform: MEDIUM (reasoned from the Tailwind source; needs the CSS-in-build check).
- Docker: MEDIUM (the tracked-README approach is simple; not built here because dockerd was not started).

**Research date:** 2026-11-23
**Valid until:** 2026-12-23 (re-check if Kit, Paraglide, Tailwind or turbo are upgraded)
