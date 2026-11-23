---
phase: 191-instance-overlay-upstream
verified: 2026-11-23T18:50:00Z
status: passed
score: 3/3 must-haves verified
overrides_applied: 0
---

# Phase 191: Instance overlay (upstream) Verification Report

**Phase Goal:** a downstream repository customises an instance by adding files only.
**Verified:** 2026-11-23
**Status:** passed
**Re-verification:** No (initial verification)

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP SC) | Status | Evidence |
| - | ------------------ | ------ | -------- |
| 1 | Overlay files under one instance directory replace `staticSettings` values by deep merge, validated against `StaticSettings` at build time | VERIFIED | `packages/app-shared/tsup.config.ts` registers the `instanceStaticSettings` esbuild plugin. It reads `<root>/instance/staticSettings.json`, merges it with `mergeSettings` and validates it with the strict zod `StaticSettingsSchema` (`resolveStaticSettings.ts`). It then replaces the `staticSettings.ts` module with the merged literal. With no file it registers no hook. The overlay is applied in app-shared's own build, so SSR (which loads the dist) and the client (which inlines it) see the same settings. Invalid JSON, an unknown key (`Unrecognized key`), `dataAdapter` or bad values fail the build and name the path. Turbo inputs include `$TURBO_ROOT$/instance/staticSettings.json` (`packages/app-shared/turbo.json`). The colours and font reach the CSS through `vite.instanceTheme.ts` (wired first in `vite.config.ts`), and `logo` reaches `AppLogo.svelte`. I ran the app-shared tests here: 227/227 pass, including `tsup.config.test.ts` and the schema/resolve tests. The 191-05 smoke evidence shows the overlaid admin email in the dist, in the SSR view and in the Docker image, plus `#123456` and `Smoke Sans` in the compiled CSS. |
| 2 | Static assets and translation overrides in the instance directory take precedence over the frontend's own | VERIFIED | Assets: `apps/frontend/instanceAssets.js` builds `.instance/static` (base `static/` with `instance/static/` laid over it by path, and symlinks refused). `svelte.config.js` sets `kit.files.assets` to it only when instance files exist. Messages: `paraglide.options.ts` takes its project from `instanceMessagesProject`, which validates each override (key exists, same placeholders, same HTML tags, known locale) and appends `instance/messages/{locale}.json` last to `pathPattern`. **Independent check:** I compiled a scratch copy of the project with `instance/messages/en.json` = `{common:{closeDialog:"VERIFIER OVERRIDE"}}`. `en_common_closedialog1` returned the override, and fi/sv/da/et kept their base text, so last-file-wins holds. The smoke evidence (34/34 PASS) shows `build/client/favicon.png` = the instance file, base-only `fonts/inter.css` kept, the instance font served over HTTP and linked, the instance message text in the Paraglide output, and the same results in the production image. Frontend overlay tests run here: 1476/1476 pass in 11 files. |
| 3 | With no instance directory the built output is the same as today's, and the existing unit and E2E suites pass unchanged | VERIFIED | Only `instance/README.md` is tracked. Build identity against base 8f2bb68a7 (`tests/e2e-runs/191-06-identity/pairing.txt`): app-shared `dist/index.js`, the Paraglide output, the static copy and the CSS assets are byte-identical. Of 934 files, 926 are equal once content hashes are normalised. The 3 that differ (one client chunk, one server chunk and its map) hold AppLogo's static-logo tier. That tier is inert when `logo` is absent, and RESEARCH expected new-code chunks to differ. Full E2E `191-06-full` at tree 782a6e5c6 passed 742/742, with wrapper exit 0, no void marker, preflight failures 0, 0 flaky, 0 did-not-run, and per-project counts equal to the base listing. Commits after 782a6e5c6 touch only `.planning/`. `git diff 8f2bb68a7 HEAD -- tests/` is empty. Visual regression is green 8/8 in the pinned container. On the host it is red, but identically at base, with sha256-identical PNGs. |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Status | Details |
| -------- | ------ | ------- |
| `packages/app-shared/tsup.config.ts` (overlay plugin) | VERIFIED | Wired into `defineConfig.esbuildPlugins` |
| `packages/app-shared/src/settings/resolveStaticSettings.ts`, `staticSettings.schema.ts` | VERIFIED | Used by the plugin. Strict schema |
| `packages/app-shared/turbo.json` | VERIFIED | Build input on `instance/staticSettings.json` |
| `apps/frontend/vite.instanceTheme.ts` | VERIFIED | First plugin in `vite.config.ts`, fed the merged `staticSettings` |
| `apps/frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte` | VERIFIED | Logo order is `publisherLogo` > `staticSettings.logo` > OpenVAA. No reactive accessor is destructured |
| `apps/frontend/instanceAssets.js` | VERIFIED | Called from `svelte.config.js` |
| `apps/frontend/src/lib/i18n/utils/instanceMessages.ts`, `messageCatalog.ts` | VERIFIED | Called from `paraglide.options.ts`, which the Vite plugin and the compile script both use |
| `apps/frontend/turbo.json` | VERIFIED | Inputs include `instance/static/**` and `instance/messages/**`. The smoke run showed cache misses |
| `apps/frontend/Dockerfile` | VERIFIED | `COPY instance instance`. Images build with and without the overlay |
| `instance/README.md` and the docs pages | VERIFIED | Layout, merge rules, precedence and validation are documented |

### Key Link Verification

| From | To | Via | Status |
| ---- | -- | --- | ------ |
| `instance/staticSettings.json` | app-shared dist | tsup `onLoad` plugin | WIRED |
| merged `staticSettings` | compiled CSS | `instanceTheme` pre-transform of `app.css` | WIRED |
| `instance/static/**` | `build/client` | `kit.files.assets` = merged dir | WIRED |
| `instance/messages/*.json` | Paraglide output | generated inlang project, last `pathPattern` | WIRED (independently reproduced) |
| `instance/` | production image | Dockerfile `COPY` and turbo inputs | WIRED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Settings overlay plugin and schema | `yarn workspace @openvaa/app-shared test:unit` | 14 files, 227 passed | PASS |
| Assets, theme, svelte config, i18n and AppLogo | `vitest run instanceAssets.test.ts vite.instanceTheme.test.ts svelte.config.test.ts src/lib/i18n src/lib/dynamic-components/appLogo` | 11 files, 1476 passed | PASS |
| Message override precedence | scratch compile through `instanceMessagesProject` and `compile()` | en overridden, other locales are base | PASS |

### Probe Execution

The phase declares no `probe-*.sh`. `191-05-instance-smoke.sh` is an evidence script that needs Docker and a clean tree, so I did not rerun it, as instructed. Its recorded evidence (`tests/e2e-runs/191-05-instance-smoke/evidence.log`) is 34 passed, 0 failed.

### Requirements Coverage

The phase is tracked by SC-1..SC-3 only. No REQUIREMENTS.md IDs map to phase 191. All three SCs are satisfied, as shown above.

### Anti-Patterns Found

None was introduced. The only marker in a touched file is a pre-existing `TODO[Svelte 5]` in `.prettierignore`, which this phase did not add.

### Known host-only issues (evaluated, non-blocking)

| Issue | Judgement |
| ----- | --------- |
| 7 unit failures: `tests/tests/utils/tcpForward.test.ts` (1) and `infra/scripts/workflow-errexit.test.ts` (6) | Not caused by the phase. Both fail identically at base 8f2bb68a7 in a fresh worktree. The phase changes no file under `tests/` or `infra/`. The first has a host cause: TEST-NET-2 is refused at once instead of being black-holed. SC-3 asks that the suites pass *unchanged*, and the phase changes their outcome by zero. Recorded in `deferred-items.md`. |
| `yarn lint:check` fails at `@openvaa/supabase#typecheck` under turbo strict env mode (DENO_CERT stripped) | This is a proxy CA issue on this host. It passes under `TURBO_ENV_MODE=loose`, and `yarn typecheck` in `apps/supabase` exits 0. The phase did not touch the Edge Functions. Not blocking. The follow-up (`globalPassThroughEnv`) is in `deferred-items.md`. |
| visual-regression red on the host | Red identically at base, with sha256-identical PNGs, so it is a host rendering difference. The verdict-bearing pinned container run is green 8/8. Not blocking. |

None of these bears on the goal, and the E2E hard rule is met (full run 742/742 green, nothing void). I recommend confirming the two unit suites and `lint:check` on CI's normal network when the upstream PR runs. That check is about the host, not a phase gap.

### Human Verification Required

None. The overlay's visible effect is proven by assertions on the CSS, the assets, the served pages and the image. The no-instance UI is proven by the green container visual-regression run and the full E2E run.

### Gaps Summary

No gaps. A downstream repository can change settings (validated), theme colours, the font, the logo, static assets and messages by adding files under `instance/` only. With nothing there, the build matches base apart from the inert AppLogo code, and the E2E suite is fully green.

---

_Verified: 2026-11-23_
_Verifier: Claude (gsd-verifier)_
