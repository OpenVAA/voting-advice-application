# Phase 169 — Evidence Ledger

Every figure below is copied from a log or a command's own output. No secret, token or `.env` value is
recorded. Logs live under `tests/e2e-runs/169-gates/` and `tests/e2e-runs/169-e2e/` (gitignored).

## 0. Environment

Recorded at the start of 169-01 (2026-10-03T06:36:59Z).

| Item | Value |
|---|---|
| Date | 2026-10-03 |
| Phase base revision (HEAD at execution start) | `5ed82f437ea68337a4994a914abff513351f7635` |
| Branch | `fix/888-review-findings` |
| `node -v` | v24.14.1 |
| `yarn --version` | 4.13.0 |
| Docker VM free space (`docker run --rm alpine df -k /`) | 26 576 896 KiB available (25.35 GiB) of 107 016 164 KiB |
| Working tree | clean (`git status --porcelain` → 0 lines) |

Upstream gate (169-01 Task 1 step 1): every `*-PLAN.md` under phases 166, 167 and 168 has its
`*-SUMMARY.md` — 166: 4/4, 167: 6/6, 168: 9/9. `168…/gate-evidence/base-rev.txt` =
`0ec229dfe7ee26eafa21882fa37f6d49817e51f9`; `component-base-rev.txt` =
`6090476cc44aa995e3b36368b8a605c96e4ccc1a`. Both 168 docs scripts (`validate:links`,
`check:research-quotes`) exist in `apps/docs/package.json`.

Roadmap premise (D-02): `roadmap.get-phase 169 --pick section` already contains the measured advisory set
(`brace-expansion` ×6, `devalue` ×2, `undici` ×1) and criterion 3 reads "every row with a published fix is
fixed" — **applied at planning**; 169-01 made no ROADMAP edit.

## 1. Re-measurement at execution start

**Version/age table:** `node 169-version-probe.mjs --out 169-VERSION-TABLE.md --node 24.14.1` at
2026-10-03T06:39:46Z → exit 0, **72 distinct registry packages** across 16 manifests. Verdicts:
current 12 · in-major 32 · major 27 · HOLD-30d 1 (`@sveltejs/adapter-static`, 4.0.0 clears
2026-10-31T17:21Z). No `UNASSIGNED-MAJOR` (no G0 package needs a major). The snapshot's 84 packages fell to 72
with Phase 167's removals.

Holds the probe measured on 2026-10-03 (re-measured by each later group on its own start day):

- 30-day major rule: `@sveltejs/kit` 3 / `adapter-node` 6 / `adapter-static` 4 (clear 2026-10-31T17:2xZ),
  `vitest` 5 and `@vitest/browser-playwright` 5 (clear **2026-10-03T12:24Z / 12:22Z** — later today),
  `intl-messageformat` 12 (2026-10-15T12:27Z), `dotenv` 18 (2026-10-17T21:18Z).
- 7-day rule, newest patch held: `vite` 8.3.2, `eslint` 10.12.0, `supabase` 2.119.0, `@types/node` 26.6.4 /
  24.19.1, `globals` 17.13.0, `daisyui` 5.7.47, `turbo` 2.11.5–2.11.7, `typescript-eslint` 8.71.0, the
  `ai` / `@ai-sdk/*` / `openai` patch stream.
- Engines: the probe's `--node 24.14.1` (this host) is refused by `jsdom` 30.1.1 and `isomorphic-dompurify`
  4.4.0 (`^22.22.2 || ^24.15.0 || >=26.0.0`) — RESEARCH Pitfall 2, owned by 169-02/169-04.

**Audit at execution start:** `node scripts/assert-dependency-audit.mjs` →
`tests/e2e-runs/169-gates/00-audit-start.log`, **exit 1**. `Summary: 11 new advisory(ies) at high+, 63
accepted`; 4 stale baseline ids (1123911, 1123912, 1138114, 1138115 — the `js-yaml` rows).

NEW ids (11, not the 9 the planning snapshot recorded):

| id | package | GHSA | tree version | vulnerable range | dependent | fixed version published? |
|---|---|---|---|---|---|---|
| 1240104 | brace-expansion | GHSA-qhr7-859c-m2p7 | 1.1.11 | <1.1.20 | minimatch@3.1.2 | yes (in range) |
| 1240105 | brace-expansion | GHSA-qhr7-859c-m2p7 | 2.0.1 | >=2.0.0 <2.1.6 | minimatch@9.0.5 | yes (in range) |
| 1240107 | brace-expansion | GHSA-qhr7-859c-m2p7 | 5.0.4 | >=4.0.0 <5.0.11 | minimatch@10.2.4 | yes (in range) |
| 1240108 | brace-expansion | GHSA-6j4f-fj2g-mc7p | 1.1.11 | <1.1.19 | minimatch@3.1.2 | yes (in range) |
| 1240109 | brace-expansion | GHSA-6j4f-fj2g-mc7p | 2.0.1 | >=2.0.0 <2.1.5 | minimatch@9.0.5 | yes (in range) |
| 1240111 | brace-expansion | GHSA-6j4f-fj2g-mc7p | 5.0.4 | >=4.0.0 <5.0.10 | minimatch@10.2.4 | yes (in range) |
| 1240870 | devalue | GHSA-j22f-vq7h-c4qm | 5.6.4 | >=5.1.0 <=5.9.2 | @sveltejs/kit@2.55.0 | yes (in range) |
| 1240872 | devalue | GHSA-mcm9-63f2-9j32 | 5.6.4 | <=5.9.2 | @sveltejs/kit@2.55.0 | yes (in range) |
| 1240042 | undici | GHSA-rfgv-xxqx-mfg5 | 6.21.0 | >=6.7.0 <6.28.1 | cheerio@1.0.0 | yes (in range) |
| **1240992** | **braces** | GHSA-vfj7-8cjw-p6xm | 3.0.3 | **<=3.0.3** | micromatch@4.0.8 | **no — 3.0.3 (2024-05-21) is the latest release** |
| **1240991** | **http-cache-semantics** | GHSA-ch52-4w7c-c8xp | 4.1.1 | **<=4.2.0** | make-fetch-happen@14.0.3 | **no — 4.2.0 (2025-05-09) is the latest release** |

The two bold rows were published after planning (2026-10-01) and have **no fixed version on the registry**.
`http-cache-semantics` was cleared anyway, by removal: `node-gyp@npm:latest` (requested by Yarn's `fsevents`
compat patch) refreshed 11.0.0 → 13.0.2, which drops `make-fetch-happen`. `braces` stays (see below).

**Audit after the group-0 refresh** (169-01 Task 3, `tests/e2e-runs/169-gates/01-t3-audit*.log`):

| Step | Exit | NEW | ACCEPTED | stale baseline ids |
|---|---|---|---|---|
| attempt 1: whole tree minus the planned excluded set | 1 | 2 — `@fastify/busboy` 1240982 (**introduced by the refresh**) and `braces` 1240992 | 8 | 59 |
| attempt 2: attempt 1 minus the AI SDK family (§ 3) | 1 | 1 — `braces` 1240992 (no fix published) | 5 | 62 |
| after the braces row is accepted (`c97bc9898`, § 7) | **0** | **0** — `Summary: 0 new advisory(ies) at high+, 6 accepted` | 6 | 62 |

The 6 accepted rows still present: `tar` 1123940 (critical) / 1123941 / 1145647 via `supabase@2.83.0` (169-06),
`@faker-js/faker` 1158500 (169-08), `@sveltejs/kit` 1116433 (169-05), `braces` 1240992 (no fix). The 62 stale
ids are left in the baseline for 169-13's reviewed rewrite (PROH-169-02: no `--update-baseline` here).

### 169-02 (group 1) re-measurement, 2026-10-03

- **Yarn target 4.18.1**, published 2026-09-24T20:40:35Z (`gh release list -R yarnpkg/berry`: the `Latest`
  release), 8.5 days old at 2026-10-03T08:45Z, so it clears the 7-day rule; no newer 4.x exists. 4.14.0
  (berry PR #7089) made `enableScripts: false` the default, 4.14.1/4.16.0 fix the Node 24.15+ EBADF bug
  (PRs #7104, #7152), 4.15.0 made `npmMinimalAgeGate: 1d` the default (this repo sets 7d).
- `git grep -n -E "ignoreDeprecations|@ts-ignore" -- '*.json' 'apps/**/*.ts' 'packages/**/*.ts'` at
  `520dcfb80` (pre-plan) → **0 lines**.
- Packages with install scripts in the installed tree (scan of every `node_modules` under the repository for
  `preinstall`/`install`/`postinstall` or a `binding.gyp`): `esbuild` 0.25.12 / 0.27.7 / 0.28.2
  (`postinstall: node install.js`) and `supabase` 2.83.0 (`postinstall: node scripts/postinstall.js`). Nothing
  else; no `binding.gyp` anywhere.

## 2. Package legitimacy

**Operator approvals (step 0, run before any repository change, 2026-10-03T06:37Z):** the box check printed
`boxes A and B ticked`. `169-LEGITIMACY-APPROVALS.md`: A `[x]` (`eslint-plugin-import-x` + `unrs-resolver`
postinstall, for 169-03), B `[x]` (Supabase CLI platform packages, for 169-06), C `[x]` (`sv`, for 169-12) —
all ticked on the operator's explicit approval, 2026-10-03.

`gsd-tools query package-legitimacy check --ecosystem npm` on every `major`-verdict target in the table, on
`eslint-plugin-import-x` / `unrs-resolver`, and on the `supabase@2.118.0` (current target)
`optionalDependencies` platform packages, 2026-10-03:

| Package | Verdict | Reasons | Weekly downloads | Repository | Postinstall | Deprecated |
|---|---|---|---|---|---|---|
| `@ai-sdk/google` | SUS | too-new | 10698160 | https://github.com/vercel/ai | — | no |
| `@ai-sdk/openai` | SUS | too-new | 17329617 | https://github.com/vercel/ai | — | no |
| `@changesets/changelog-github` | SUS | too-new | 1361053 | git+https://github.com/changesets/changesets.git | — | no |
| `@changesets/cli` | SUS | too-new | 6802614 | git+https://github.com/changesets/changesets.git | — | no |
| `@eslint/js` | OK | — | 171902358 | git+https://github.com/eslint/eslint.git | — | no |
| `@faker-js/faker` | OK | — | 21617775 | git+https://github.com/faker-js/faker.git | — | no |
| `@supabase/ssr` | SUS | too-new | 10750757 | git+https://github.com/supabase/ssr.git | — | no |
| `@sveltejs/vite-plugin-svelte` | SUS | too-new | 4571892 | git+https://github.com/sveltejs/vite-plugin-svelte.git | — | no |
| `@types/cheerio` | SUS | no-repository, deprecated | 3124701 | — | — | yes |
| `@types/node` | SUS | too-new | 535387792 | https://github.com/DefinitelyTyped/DefinitelyTyped.git | — | no |
| `ai` | SUS | too-new | 33670560 | https://github.com/vercel/ai | — | no |
| `concurrently` | OK | — | 26421657 | git+https://github.com/open-cli-tools/concurrently.git | — | no |
| `eslint` | SUS | too-new | 193336881 | git+https://github.com/eslint/eslint.git | — | no |
| `eslint-plugin-simple-import-sort` | OK | — | 7635851 | git+https://github.com/lydell/eslint-plugin-simple-import-sort.git | — | no |
| `eslint-plugin-svelte` | OK | — | 1851069 | git+https://github.com/sveltejs/eslint-plugin-svelte.git | — | no |
| `glob` | OK | — | 476912980 | git+ssh://git@github.com/isaacs/node-glob.git | — | no |
| `globals` | SUS | too-new | 320588437 | git+https://github.com/sindresorhus/globals.git | — | no |
| `isomorphic-dompurify` | SUS | too-new | 6961542 | kkomelin/isomorphic-dompurify | — | no |
| `js-yaml` | SUS | too-new | 363074459 | git+https://github.com/nodeca/js-yaml.git | — | no |
| `jsdom` | SUS | too-new | 126645829 | git+https://github.com/jsdom/jsdom.git | — | no |
| `lint-staged` | SUS | too-new | 35706014 | git+https://github.com/lint-staged/lint-staged.git | — | no |
| `openai` | SUS | too-new | 48664904 | git+https://github.com/openai/openai-node.git | — | no |
| `prettier-plugin-svelte` | OK | — | 1995984 | git+https://github.com/sveltejs/prettier-plugin-svelte.git | — | no |
| `prettier-plugin-tailwindcss` | OK | — | 11375828 | git+https://github.com/tailwindlabs/prettier-plugin-tailwindcss.git | — | no |
| `typescript` | OK | — | 354808929 | git+https://github.com/microsoft/TypeScript.git | — | no |
| `vite` | SUS | too-new | 225080956 | git+https://github.com/vitejs/vite.git | — | no |
| `vitest` | SUS | too-new | 135418923 | git+https://github.com/vitest-dev/vitest.git | — | no |
| `eslint-plugin-import-x` | OK | — | 8176981 | git+https://github.com/un-ts/eslint-plugin-import-x.git | — | no |
| `unrs-resolver` | OK | — | 68533880 | git+https://github.com/unrs/unrs-resolver.git | node postinstall.js | no |
| `@supabase/cli-linux-x64` | SUS | too-new | 4434591 | https://github.com/supabase/cli.git | — | no |
| `@supabase/cli-darwin-x64` | SUS | too-new | 74549 | https://github.com/supabase/cli.git | — | no |
| `@supabase/cli-linux-arm64` | SUS | too-new | 132642 | https://github.com/supabase/cli.git | — | no |
| `@supabase/cli-windows-x64` | SUS | too-new | 227566 | https://github.com/supabase/cli.git | — | no |
| `@supabase/cli-darwin-arm64` | SUS | too-new | 197164 | https://github.com/supabase/cli.git | — | no |
| `@supabase/cli-windows-arm64` | SUS | too-new | 65491 | https://github.com/supabase/cli.git | — | no |
| `@supabase/cli-linux-x64-musl` | SUS | too-new | 1746652 | https://github.com/supabase/cli.git | — | no |
| `@supabase/cli-linux-arm64-musl` | SUS | too-new | 92969 | https://github.com/supabase/cli.git | — | no |

No `SLOP`. Every `SUS` is `too-new` on an established package (the age gate removes it by construction),
except `@types/cheerio` (`no-repository, deprecated`): it is already in `yarn.lock`, it is not installed or
moved by any plan, and 169-10 removes it (D-23). No stop.

### 169-02 (group 1)

**Vendored Yarn release (169-02 Task 1):** `yarn set version 4.18.1` downloaded
`https://repo.yarnpkg.com/4.18.1/packages/yarnpkg-cli/bin/yarn.js` into `.yarn/releases/yarn-4.18.1.cjs`;
`shasum -a 256` → `a28ad591febb769f939c11f82f89bacad0b0fac0c884d3b78fa2aaaee970907e` (matches
repo.yarnpkg.com). `yarn-4.13.0.cjs` deleted; `ls .yarn/releases` lists only the new file.

**Install-script posture — operator ruling, 2026-10-03 (Option B, given through the orchestrator after the
first 169-02 executor stopped at a blocking-human decision).** Yarn 4.18 defaults to `enableScripts: false`;
`supabase@2.83.0` (its postinstall fetches the CLI binary) and `esbuild` (`node install.js`) need theirs.
The operator chose: scripts stay off globally with a per-package allow-list of `supabase` and `esbuild`
only (`unrs-resolver` joins when 169-03 lands, already approved under box A); `approvedGitRepositories`
keeps its empty default (no git dependencies); `enableScripts: true` globally was explicitly rejected.

Mechanism, from the Yarn 4.18.1 source (tag `@yarnpkg/cli/4.18.1`):

- `packages/plugin-pnp/sources/jsInstallUtils.ts` `extractBuildRequest` — the node-modules linker
  (`packages/plugin-nm/sources/NodeModulesLinker.ts`) calls it for every package with build scripts:
  `if (dependencyMeta && dependencyMeta.built === false)` → skipped; then
  `if (!configuration.get('enableScripts') && !dependencyMeta.built)` → skipped with
  `"… lists build scripts, but all build scripts have been disabled."` So `built: true` re-enables one
  package while `enableScripts` is false.
- `packages/yarnpkg-core/sources/Project.ts` `getDependencyMeta` reads `dependenciesMeta` from the
  **top-level workspace manifest only**.
- `packages/yarnpkg-core/sources/Configuration.ts`: `enableScripts` default `false`.
- Yarn's own docs (berry PR #7089, `docs/features/security.mdx`): "Yarn doesn't run postinstalls by default
  ever since 4.14. You must either enable them globally … or on a by-package basis using `dependenciesMeta` in
  your top-level `package.json`."
- The same PR adds a lockfile-migration rule (`plugin-essentials` `install.ts`): an install that migrates a
  lockfile older than version 9 writes `enableScripts: true` into `.yarnrc.yml`. The committed lockfile is at
  version 10 and `.yarnrc.yml` states `enableScripts: false` explicitly, so that migration cannot flip it.

Applied (commit `ee5c3d620`): `.yarnrc.yml` `enableScripts: false` (with a two-line comment pointing at the
allow-list); root `package.json` `"dependenciesMeta": { "esbuild": { "built": true }, "supabase": { "built":
true } }`. Yarn records the root workspace's `dependenciesMeta` in `yarn.lock` (`--immutable` refused the first
install with exactly that 5-line hunk), so it is part of the same commit.

## 3. Holds

| Package | Held at | Newer line | Reason | Decision ref | Re-check date or trigger |
|---|---|---|---|---|---|
| `ai`, `@ai-sdk/google`, `@ai-sdk/openai` (+ their exact pins `@ai-sdk/gateway`, `@ai-sdk/provider`, `@ai-sdk/provider-utils`) | pre-phase resolutions: `ai` 5.0.60, `@ai-sdk/google` 2.0.23, `@ai-sdk/openai` 2.0.42, gateway 1.0.33, provider 2.0.0, provider-utils 3.0.10 / 3.0.12 | in-range `ai` 5.0.267, google 2.0.99, openai 2.0.130 (→ provider-utils 3.0.39) | **Narrowed out of the group-0 refresh.** `@ai-sdk/provider-utils` ≥ 3.0.35 (2026-08-26) depends on `undici ^5.29.0`; the in-range refresh pulled `undici` 5.29.0 and `@fastify/busboy` 2.1.1 back into the tree, adding NEW high 1240982 (`@fastify/busboy` <3.2.1, no in-range fix under `undici` 5's `^2.0.0`) and re-attaching accepted `undici` rows 1114638 / 1114640 / 1121245 to a new dependent. Moved into the excluded set per 169-01 Task 3 step 6; the family's majors are 169-09's | D-07, D-21, D-25 (G7) | 169-09 (AI SDK majors); re-check that the target `ai` / `@ai-sdk/*` majors do not depend on `undici` 5 |
| `braces` | 3.0.3 | none published | No fixed version exists (GHSA-vfj7-8cjw-p6xm covers `<=3.0.3`; 3.0.3 is the latest). Accepted in the baseline with a rationale (§ 7) | D-02 (baseline keeps no-fix rows), D-05 | when `braces` publishes a fix; or once `vite-plugin-restart` (169-05) and `@changesets/cli` 2's `micromatch` path (169-10) are both gone, the row goes stale |
| `@types/node` | **24.19.0** (catalog `^24.19.0`; 169-02, `968113336`) | 26.6.3 / 26.6.4 (`latest`), 25.x; 24.19.1 (1.4 d old on 2026-10-03) | **Types track the runtime major** (Node 24 at every pin site). 24.19.1 is inside the 7-day window | D-11, R3, D-03 | when the runtime moves to a newer major; 24.19.1 clears 2026-10-08T22:38Z |
| `typescript` | **6.0.3** (catalog `^6.0.3`; 169-02, `ebeaafa5c`) | 7.0.2 (2026-07-08, x.0.0 86.7 d old — the age rule alone would admit it) | Blocking peers measured 2026-10-03: `@typescript-eslint/eslint-plugin` / `@typescript-eslint/parser` / `typescript-eslint` 8.70.1 `typescript: >=4.8.4 <6.1.0` (8.71.0, the newest, is inside the 7-day window); `svelte-check` 4.7.6 `^5.0.0 \|\| ^6.0.0`; `@sveltejs/kit@3` `typescript: ^6.0.0`. 6.0.3 is the newest 6.x (6.0.0 was never published) | D-16 | typescript-eslint and svelte-check admit 7 (and Kit 3's peer, once Kit 3 lands) |

## 4. Gate runs

Runner: `bash 169-gates.sh <label>` (`TURBO_FORCE=true`; each status read directly). E2E runner:
`bash 169-e2e.sh <label>`.

| Plan | Label | HEAD | install | dedupe | typecheck | lint | format | check-fe | check-docs | unit | build | audit | docs-links | docs-rq | E2E (total / passed / failed / flaky / did-not-run) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 169-01 | `169-01-baseline` (only the age-gate line changed) | `5ed82f437` + `.yarnrc.yml` | 0 | **1** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **1** | 0 | 0 | — |
| 169-01 | `169-01-group0-attempt1` (after the refresh + braces row) | `c97bc9898` | 0 | 0 | **2** | **2** | **1** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | — |
| 169-01 | `169-01-group0` | `54041714e` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **171 / 171 / 0 / 0 / 0** (`169-e2e/169-01-group0`) |
| 169-02 | `169-02-node24` (interrupted, see notes) | `77d3ce8bf` | 0 | 0 | 0 | — | — | — | — | — | — | — | — | — | — |
| 169-02 | `169-02-node24-r2` (the Node 24 commit alone) | `77d3ce8bf` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **171 / 171 / 0 / 0 / 0** (`169-e2e/169-02-node24`) |
| 169-02 | `169-02-group1` (+ CI step order, secret-scan fixture, `@types/node` 24, TS 6) | `ebeaafa5c` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | — |

Notes on `169-01-baseline` (2026-10-03T06:43:09Z–06:45:43Z, `tests/e2e-runs/169-gates/169-01-baseline/`):

- `10-audit` exit 1 — the 11 NEW rows of § 1, as expected.
- `02-dedupe` exit 1 — **pre-existing, not a regression**: `yarn dedupe --check` reports 71 dedupable
  descriptors ("70 packages can be deduped using the highest strategy") on the unmodified lockfile. No
  workflow, script or hook in the repository runs `yarn dedupe` (`grep -rn dedupe .github/ package.json` →
  nothing), so the starting tree was never held to it; the gate is new with this phase. The plan expected 0
  here. Group 0's `yarn dedupe` is what brings it to 0, and `169-01-group0` must show it at 0.
- Every forced turbo gate reported `0 cached` (`03-typecheck` 23/23 and `09-build` 25/25 tasks executed).

Notes on `169-01-group0-attempt1` (06:56:47Z–06:59:11Z, kept at `tests/e2e-runs/169-gates/169-01-group0-attempt1/`):

- `03-typecheck` exit 2 and `04-lint` exit 2 — `@openvaa/llm` (and `typecheck:tests` inside `lint:check`)
  type-checked `packages/app-shared/dist/index.js` (TS7006 / TS2339 / TS7053) because `dist/index.d.ts` was
  missing. **Mechanism, confirmed by reproduction:** turbo runs `@openvaa/app-shared:typecheck` alongside
  `@openvaa/app-shared:build` (log: both "force executing" two lines apart; `typecheck` depends on `^build`
  only). On these composite projects `tsc --noEmit` writes `dist/tsconfig.tsbuildinfo`; when that write lands
  after tsup's "Cleaning output folder", the build's `tsc --emitDeclarationOnly` takes the stale buildinfo as up
  to date and emits nothing. By hand: a current buildinfo copied into an emptied `dist` → `tsc
  --emitDeclarationOnly` exit 0 with only `tsconfig.tsbuildinfo` in `dist`. **Trigger UNCONFIRMED:** it fired
  on the first two forced turbo runs after the lockfile refresh (turbo 2.8.17 → 2.11.4 and several `@types/*`
  moved) and in none of 6 forced `yarn typecheck` re-runs in isolation afterwards; a dependency change widening
  the window is the likely but unproven reason. Fixed forward in `0c98a4621` (`tsc --noEmit --composite false`
  in the 8 tsup packages: the typecheck no longer touches `dist`, mtime unchanged per package; a planted
  `TS2322` in `@openvaa/app-shared` still fails it with exit 2; 3 further forced runs green).
- `05-format` exit 1 — 19 files reformatted by Prettier 3.9.9 (refreshed from 3.7.4); `yarn format` and nothing
  else, committed separately as `54041714e`. The docs app's own format pass changed nothing, and `12-docs-rq`
  stayed green (22 spans identical).

`169-01-group0` (07:07:13Z–07:09:52Z): all twelve gates 0.

E2E `169-01-group0` (`bash 169-e2e.sh 169-01-group0`, full default suite): Docker VM 25.31 GiB free after
`docker builder prune -af`, port 5273 free; `e2e-run.sh` at HEAD `54041714e` with `db_reset=true`,
2026-10-03T07:10:03Z–07:16:01Z, wrapper exit 0, preflight successes 1 / failures 0. `summary.json`: **total 171,
passed 171, failed 0, flaky 0, skipped 0, didNotRun 0**. No listener left on 5273. This is the measured-green
tree 169-02's Node 24 commit is judged against (D-11 attribution).

### 169-02 Task 2 — the Node 24 commit (`77d3ce8bf`), measured alone

**Target.** `https://nodejs.org/dist/index.json`: **24.21.0** (2026-09-07, LTS "Krypton", 26.3 d old; newest
24.x). `docker pull node:24-alpine` → `node@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1`;
`docker run --rm node:24-alpine node -v` → `v24.21.0`.

**Host.** Before: `node -v` → v24.14.1, `nvm alias default` → `24` (→ v24.14.1). `nvm install 24.21.0`
(checksum matched) and `nvm alias default 24.21.0`. A fresh interactive shell with a clean environment
(`env -i HOME=… PATH=/usr/bin:/bin:/usr/sbin:/sbin zsh -ic 'node -v'`) → `v24.21.0`. Restore command in § 7.
The executor's own tool shell keeps the PATH it started with, so every 169-02 command from here on ran with
`~/.nvm/versions/node/v24.21.0/bin` prepended (each gate/E2E log's `env.txt` / `node -v` line shows
v24.21.0). Observed, not changed: a non-interactive login shell (`zsh -lc`) does not load nvm and resolves
`/usr/local/bin/node` v22.5.1.

**Sites (population `git grep -n -E "22\.22\.1|node:22|\">=22\"|20\.x"` over the plan's paths).** 10 CI
`node-version: 22.22.1` + step names → 24.21.0 (main.yaml 8, docs.yml 1, release.yml 1); the negative control's
rejecting step `"20.x"` → `"22.x"` with its comment ("every 22.x is outside the declared \">=24.15.0\"", "widened
to admit Node 22"); `FROM node:24-alpine AS base`; `engines.node` `">=24.15.0"` in both manifests; the
declared-binaries literal; the two `requireAdminIdentity.test.ts` `reason:` comments no longer name a CI-pinned
Node. Docs prose naming the project's Node major (`git grep -n -i -E "node(\.js)? ?22\b|node 22|nvm use 22"`
over CLAUDE.md, README.md, apps, packages, docs, tests, plus a wider `node(\.js)?[ @:v-]*(>=)?22|22\.x` sweep):
**none**. Two hits left as they are: `packages/dev-seed/src/cli/{seed,teardown}.ts` "Node 22+ built-in" — they
state the minimum Node for `process.loadEnvFile`, not the project's Node. `yarn install` under v24.21.0: lockfile
unchanged, the allowed builds re-ran (`YN0008 … dependency tree changed`), preinstall `v24.21.0 satisfies
"engines.node": ">=24.15.0" — OK`. `git show --stat 77d3ce8bf`: 8 files, 30/30 lines, no `yarn.lock`.

**Gate run.** `169-02-node24` (08:05:16Z) stopped after `03-typecheck`: `04-lint` sat for 24 m 44 s in
`turbo run lint` with `@openvaa/core#lint` and `@openvaa/dev-tools#lint` started and no output, and turbo then
force-killed both (the executor's session hit a stream-watchdog stall over the same window and the background
job was lost). Re-tested in isolation under v24.21.0: `TURBO_FORCE=true yarn turbo run lint --filter
@openvaa/core --filter @openvaa/dev-tools` → exit 0 in 2.4 s. **Cause UNCONFIRMED** (not reproducible; the
overlap with the session stall is the likely but unproven reason). Re-run from the start as **`169-02-node24-r2`**
(08:33:15Z–08:36:23Z, node v24.21.0, yarn 4.18.1, HEAD `77d3ce8bf`, porcelain 0): **all twelve gates 0**;
forced turbo `0 cached` (typecheck 23/23, unit 25/25, build 14/14); audit `0 new advisory(ies) at high+, 6
accepted`. `04-lint` 43 s.

**Image build and smoke (R6, Pitfall 5).** `docker build --file apps/frontend/Dockerfile --target production
--tag openvaa-frontend:169-node24 .` → **0** (`tests/e2e-runs/169-gates/02-t2-docker.log`; base
`node:24-alpine`, in-image Yarn 4.18.1 built `esbuild` ×3, `supabase@npm:2.83.0` and the root workspace, whose
preinstall guard passed under the image's Node). `docker run --rm openvaa-frontend:169-node24 node -v` →
**`v24.21.0`** (Yarn 4.18.1, Alpine 3.24.2). With this project's Supabase stack up: `docker run -d --name
openvaa-169-smoke -p 3169:3000 --env-file .env -e PUBLIC_SUPABASE_URL=http://host.docker.internal:54321
openvaa-frontend:169-node24` → log `Listening on http://0.0.0.0:3000`; `curl -s -o /dev/null -w '%{http_code}'
http://localhost:3169/` → **`200`** after 2 s (`<title>Election Compass</title>`); `/fi` 200, `/candidate/login`
200, `/en/elections` 307; `docker exec … node -v` → v24.21.0; no `error`/`warn` lines in the container log.
`docker rm -f openvaa-169-smoke` and `docker rmi openvaa-frontend:169-node24` → 0. No env value recorded.

**E2E.** `bash 169-e2e.sh 169-02-node24` (shell on v24.21.0): Docker VM 25.04 GiB free after `docker builder
prune -af`, port 5273 free; `e2e-run.sh` at HEAD `77d3ce8bf`, `db_reset=true`, 2026-10-03T08:39:58Z–08:46:07Z,
wrapper exit 0, preflight failures 0 / successes 1. `summary.json`: **total 171, passed 171, failed 0, flaky 0,
skipped 0, didNotRun 0** — identical to the group-0 tree, so the runtime move changed no E2E outcome.

### 169-02 Task 3 — `@types/node` 24 and TypeScript 6

Probe: `node 169-version-probe.mjs --only @types/node,typescript,@typescript-eslint/eslint-plugin,@typescript-eslint/parser,svelte-check
--node 24.21.0` (`tests/e2e-runs/169-gates/02-t3-probe.md`, 2026-10-03T09:03:59Z; `typescript-eslint` itself is not a
declared package, so the probe refused it by name and the two declared `@typescript-eslint/*` packages stand in).
Newest 24.x `@types/node` at least 7 days old: **24.19.0** (2026-09-25T22:09Z, 7.46 d). TypeScript: 6.0.2
(2026-03-23), **6.0.3** (2026-04-16), 7.0.2 (2026-07-08). Peer ranges as in § 3. Neither commit added a package name
to `yarn.lock` (`@types/node` 24.19.0 brings `undici-types` 7.24.6, a name already present), so no legitimacy check
was due.

- **`@types/node` (`968113336`).** `yarn why @types/node`: root, `apps/docs`, `apps/frontend`, `packages/dev-seed`,
  `packages/dev-tools` → `24.19.0`. Third-party transitive copies are untouched (`@types/node@*` from `@types/ws`,
  `@types/node-fetch`, `@types/cheerio` → 26.6.3; `openai` → 18.19.130; `@manypkg/find-root` → 12.20.55).
  `TURBO_FORCE=true yarn typecheck` → 0 (23/23, 0 cached); `yarn typecheck:tests` → 0.
- **TypeScript 6.0.3 (`ebeaafa5c`).** First pass, catalog only: `yarn typecheck` → **2**: `@openvaa/core`
  `src/controller/controller.ts` TS2584 "Cannot find name 'console'" ×4 — TS 6's `types: []` default dropped the
  automatically included `@types/node` (`lib: ["es2022"]` has no `console`); `typecheck:tests` → 2 as a knock-on
  (core's `dist` had no declarations, so `dist/index.js` was checked); both apps' `check` → 0. Fix:
  `"types": ["node"]` in `packages/shared-config/tsconfig.base.json` (frontend keeps `["vitest/globals"]`;
  dev-seed, dev-tools, tests already set `["node"]`). Second pass: typecheck 0 (23/23), typecheck:tests 0,
  frontend check 0 (2117 files, 0 errors, 0 warnings), docs check 0 (648 files), build 0. No other TS 6 default
  surfaced in a gated config: no tsconfig sets `baseUrl`, `moduleResolution: node10`, `outFile`,
  `downlevelIteration` or `ignoreDeprecations`; every `moduleResolution` is `bundler`; side-effect imports
  (`noUncheckedSideEffectImports`) raised nothing in typecheck or either `check`. `yarn why typescript` → only
  6.0.3 (14 workspaces, through Yarn's compat patch). `git grep -n -E "ignoreDeprecations|@ts-ignore" -- '*.json'
  'apps/**/*.ts' 'packages/**/*.ts'` → 0 lines, as before the plan.
  Remaining peer warning (`YN0060`): `@sveltejs/kit` 2.55.0's optional `typescript: ^5.3.3` (frontend, docs);
  Kit 2.70.3 declares `^5.3.3 || ^6.0.0` and lands in 169-05.
- **Ungated config, pre-existing red (deferred).** `apps/docs/scripts/tsconfig.json` (not extending the base and
  run by no script or gate): `tsc -p apps/docs/scripts/tsconfig.json --noEmit` → exit 2 under **both** TS 5.9.3
  (`mdsvex/dist/main.d.ts` cannot resolve `unified`) and 6.0.3 (that error plus TS7016 for the untyped
  `../../mdsvex.config.js` import — TS 6's `strict` default now applies there, the config sets no `strict`). Left
  as found; recorded in `deferred-items.md`.

**`169-02-group1`** (09:08:41Z–09:11:08Z, node v24.21.0, yarn 4.18.1, HEAD `ebeaafa5c`, porcelain 0): all twelve
gates 0; forced turbo `0 cached` (typecheck 23/23, unit 25/25, build 14/14); audit `0 new advisory(ies) at high+, 6
accepted`.

## 5. Negative controls

### Age gate binding proof (D-04)

`yarn config get npmMinimalAgeGate` → `10080` (minutes = 7 days); `grep -c '^npmMinimalAgeGate: 7d$'
.yarnrc.yml` → `1`.

Scratch project made with `mktemp -d` under the session scratchpad (outside the repository): `package.json`
`{ "name": "agegate-proof", "private": true }`, an empty `yarn.lock`, and a `.yarnrc.yml` with
`yarnPath: <repo>/.yarn/releases/yarn-4.13.0.cjs`, `nodeLinker: node-modules`, `npmMinimalAgeGate: 7d`
(plus `enableTelemetry: false`). The package was taken from the probe's "youngest releases" list.

| Command | Exit | Output |
|---|---|---|
| `yarn add globals@17.13.0` (published 2026-10-01T03:57:11Z, 2.1 d old) | **1** | `YN0016: │ globals@npm:17.13.0: All versions satisfying "17.13.0" are quarantined` |
| `yarn add 'globals@^17'` | **0** | resolved `globals@npm:17.12.0`, published 2026-09-01T11:00:43Z (31.8 d before the run) |

The scratch directory was deleted afterwards.

### Audit liveness (D-28) — 169-01 Task 2

"Blocked" = `YARN_NPM_AUDIT_REGISTRY=http://127.0.0.1:9 YARN_HTTP_RETRY=0` (the audit's request is refused;
stderr carries a Yarn `RequestError … ECONNREFUSED` stack, stdout is empty, `yarn npm audit` exits 1).
"Emptied copy" = the working-copy `security/audit-baseline.json` rewritten with `accepted: []`, the real file
saved aside first and copied back after the run. Logs: `tests/e2e-runs/169-gates/01-t2-nc*.log`.

| Control | Gate version | Command | Exit | What it showed | Revert proof |
|---|---|---|---|---|---|
| RED | test-first | `yarn workspace @openvaa/dev-seed vitest run tests/auditBaselineShape.test.ts` (commit `78b2950d3`) | 1 | 5 failed / 9 passed: every `the gate proves the audit ran` case failed with `Cannot find module '…/scripts/lib/audit-run.mjs'` | — |
| **NC-1** | **pre-change** (`78b2950d3`) | emptied copy + blocked → `node scripts/assert-dependency-audit.mjs` | **0** | `[ACCEPTED] 0 · [NEW] 0 · Summary: 0 new advisory(ies) at high+, 0 accepted` — **the silent pass**: a failed audit reads as a clean tree once the baseline is empty | `git diff --exit-code -- security/audit-baseline.json` → 0 |
| **NC-2** | post-change (`06bb72877`) | emptied copy + blocked → gate | **2** | `ERROR: \`yarn npm audit …\` printed no findings and exited with status 1, so the audit did not run against http://127.0.0.1:9 …` | `git diff --exit-code -- security/audit-baseline.json` → 0 |
| **NC-3** | post-change | real baseline + blocked → gate | **2** | same ERROR line | — (baseline untouched) |
| **NC-4** | post-change | real baseline + blocked → `--update-baseline` | **2** | same ERROR line; no `Rewrote …` line | `git diff --exit-code -- security/audit-baseline.json` → 0 (file untouched) |
| **NC-5** | post-change, working copy only | `classifyAuditRun` perturbed to return `clean` for any empty output (status ignored) → shape test (`--reporter=verbose`) | **1** | 3 failed / 11 passed — `reads empty output with a non-zero exit as an audit that did not run`, `reads empty output from an audit killed by a signal as an audit that did not run`, `classifies the real audit as did-not-run when the registry is unreachable` | original copied back; `cmp` → 0, and after the commit `git diff --exit-code -- scripts/lib/audit-run.mjs` → 0 |
| GREEN | post-change | shape test | 0 | 14 passed (the real blocked-registry case ran in ~0.8 s) | — |
| findings path | post-change | `yarn audit:deps` (network open) | **1** | `Summary: 11 new advisory(ies) at high+, 63 accepted` — unchanged | — |

`yarn workspace @openvaa/dev-seed typecheck` → 0; `TURBO_FORCE=true yarn lint:check` → 0;
`yarn assert:unit-coverage` → 0; Prettier clean on all three touched files.

### Install-script allow-list (169-02 Task 1, Yarn 4.18.1, host Node v24.14.1)

Logs: `tests/e2e-runs/169-gates/02-t1-*.log`. Every row ran with `.yarnrc.yml` `enableScripts: false`
(`yarn config get enableScripts` → `false`).

| Control | Setup | Command | Exit | What Yarn printed / what the tree showed |
|---|---|---|---|---|
| **POS** (clean reinstall, both allowed) | every `node_modules` under the repository and `.yarn/install-state.gz` deleted; allow-list `esbuild`, `supabase` | `yarn install --inline-builds` (`02-t1-clean-install.log`) | 0 | `YN0007 … must be built` for `esbuild@npm:0.28.2`, `0.25.12`, `0.27.7` and `supabase@npm:2.83.0`; supabase's postinstall STDOUT: `Downloading …/v2.83.0/supabase_darwin_arm64.tar.gz` · `Checksum verified.` · `Installed Supabase CLI successfully`; root `preinstall` (a workspace script, always run): `assert-node-engine: v24.14.1 satisfies "engines.node": ">=22" — OK`. No `YN0004`. Afterwards `node_modules/supabase/bin/supabase` exists (91 MB), `yarn workspace @openvaa/supabase supabase --version` → `2.83.0` (exit 0); `require('esbuild').transformSync('export const x: number = 1', {loader: 'ts'})` → `"export const x = 1;\n"` (esbuild 0.27.7), `node_modules/.bin/esbuild --version` → `0.27.7` |
| **NEG** (a package not on the list) | working copy only: `supabase` removed from `dependenciesMeta` (allow-list = `esbuild`), `node_modules/supabase` deleted | `yarn install --inline-builds` (`02-t1-nc-supabase-not-allowed.log`) | 0 | `YN0004: │ supabase@npm:2.83.0 lists build scripts, but all build scripts have been disabled.` — no `YN0007` and no postinstall output for it. `node_modules/supabase/bin` absent; `yarn workspace @openvaa/supabase supabase --version` → exit **1** (`node:internal/modules/cjs/loader` throw) |
| **Restore** | `package.json` and `yarn.lock` copied back from the saved copies (`cmp` → 0) | `yarn install --immutable --inline-builds` (`02-t1-nc-restore.log`) | 0 | `YN0007 … supabase@npm:2.83.0 must be built`, `Installed Supabase CLI successfully`; `supabase --version` → `2.83.0` |

No package in the tree other than the two allowed ones has an install script (§ 1, 169-02 re-measurement), so
the negative control removes one allowed package rather than relying on a third. It shows both halves: the
allow-list is what makes a script run (removing the entry stops it, with Yarn's own `YN0004` naming the
package), and the global setting is what stops the rest.

Task 1 checks at `ee5c3d620` (Node v24.14.1): `yarn --version` → `4.18.1`; `grep -c "yarnPath:
.yarn/releases/yarn-4.18.1.cjs" .yarnrc.yml` → 1; `git grep -n -E "4\.13" -- package.json
apps/frontend/package.json apps/frontend/Dockerfile .github .yarnrc.yml
packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts` → nothing (exit 1); `yarn install --immutable` → 0;
`yarn workspace @openvaa/dev-seed vitest run tests/assertDeclaredBinariesGate.test.ts tests/nodeEngineGate.test.ts
tests/ciDockerImageBuildGate.test.ts` → 0 (3 files, 22 tests); `docker build --file apps/frontend/Dockerfile
--target production --tag openvaa-frontend:169-yarn .` → **0** (`02-t1-docker.log`; in the image Yarn 4.18.1
built exactly `esbuild` ×3, `supabase@npm:2.83.0` and the root workspace, no `YN0004`; image removed after).
Docker VM free before the build: 23 791 272 KiB (22.7 GiB).

### Node-engine guard binds in both directions (169-02 Task 2, at `77d3ce8bf`)

Log: `tests/e2e-runs/169-gates/02-t2-guard-old.log`.

| Runtime | Command | Exit | Output |
|---|---|---|---|
| previous host Node v24.14.1 (`~/.nvm/versions/node/v24.14.1/bin/node`) | `node scripts/assert-node-engine.mjs` | **1** | `assert-node-engine: this Node is v24.14.1, and the root manifest declares "engines.node": ">=24.15.0". Switch to a Node satisfying that range, or change the declared range deliberately.` |
| v22.22.1 (the old CI pin) | same | **1** | `assert-node-engine: this Node is v22.22.1, …` |
| pinned v24.21.0 | same | 0 | `assert-node-engine: v24.21.0 satisfies "engines.node": ">=24.15.0" — OK` |
| pinned v24.21.0 | `node scripts/assert-node-engine.mjs --self-test` | 0 | `assert-node-engine --self-test: 23 cases OK` |

`yarn workspace @openvaa/dev-seed vitest run tests/nodeEngineGate.test.ts tests/assertDeclaredBinariesGate.test.ts
tests/ciDockerImageBuildGate.test.ts` → 0 (22 tests): the rejecting toolchain's major (22) sits below the declared
floor (24).

## 6. Diffs and traces

### Group 0 lockfile refresh (169-01 Task 3, commit `27a209c99`)

Procedure: the include list is every package name with an `npm:` descriptor in `yarn.lock` (811) minus
`@openvaa/*` and the planned excluded set (11) → 800 names; minus the AI SDK family (§ 3) → **794**
(`tests/e2e-runs/169-gates/01-t3-include-list.v2.txt`). One `yarn up -R <794 names>` passed as a bash array
(zsh hands an unquoted list over as ONE argument, which Yarn rejects with "Ranges aren't allowed when using
--recursive"), then `yarn dedupe` ("No packages can be deduped"). `yarn.lock`: 2473 insertions / 2654
deletions; descriptors 1240 → 1254.

Boundaries proven:

- Excluded set (`supabase`, `@playwright/test`, `playwright`, `@sveltejs/kit`, `@sveltejs/adapter-node`,
  `@sveltejs/adapter-static`, `@supabase/supabase-js`, `daisyui`, `tailwindcss`, `@tailwindcss/vite`,
  `@tailwindcss/typography`): their full `yarn.lock` blocks before vs after — `diff` exit 0
  (`01-t3-excluded-{before,after}.txt`). AI SDK family blocks before vs after: `diff` exit 0.
- `git diff --exit-code` over every `package.json` and `.yarnrc.yml` → 0; the manifest / `.yarnrc.yml` sha256
  list re-checked OK. `git grep -n '"resolutions"'` → only the pre-existing root block
  (`isomorphic-dompurify/jsdom: ^26.1.0`).
- Age backstop: every one of the **405** `name@version` pairs new to `yarn.lock` checked against its registry
  publish time as of 2026-10-03T06:52Z (before the refresh): **0 under 7 days**, 0 registry errors; youngest
  `esrap@2.3.14` (2026-09-25T23:16Z, 7.32 d) (`01-t3-agecheck.log`). No `npmPreapprovedPackages` entry was
  needed or added.
- 79 package names are new to `yarn.lock` and 50 left it (`01-t3-{new,gone}-names.txt`). The new names were
  legitimacy-checked (`01-t3-legit-new.json`): 0 `SLOP`; 2 OK and 77 `SUS` for `too-new` and/or
  `unknown-downloads` only; none has a postinstall. Each comes from its parent package's own upstream
  repository: `rolldown`, 15 `@rolldown/binding-*` and `@rolldown/pluginutils` (vite 8.3.1, which vitest
  4.1.11's own `vite ^6 || ^7 || ^8` dependency now resolves to — the docs app's declared `vite` stays on 7.3.6);
  `@lix-js/sdk-*`, `@bytecodealliance/jco-*`, `binaryen`, `oxc-minify`, 20 `@oxc-minify/binding-*`,
  `@oxc-project/types` and `valibot` (`@inlang/paraglide-js` 2.25.4 → `@inlang/sdk` 3); `@turbo/*` (turbo
  2.11's renamed platform packages); `@vercel/cli-config`, `@vercel/cli-exec`, `xdg-*`, `os-paths`
  (`@vercel/oidc` 3.8.9, in range under `@ai-sdk/gateway` 1.0.33); `@blazediff/core` (`@vitest/browser`
  4.1.11); `@sveltejs/load-config` (svelte-check 4.7.6); small `ljharb` / `inspect-js` shims.

Direct-dependency resolutions that moved (declared range: before → after):

- `@axe-core/playwright` (^4.11.3): 4.11.3 → 4.13.0
- `@changesets/cli` (^2.30.0): 2.30.0 → 2.31.1
- `@eslint/eslintrc` (^3.2.0): 3.2.0 → 3.3.7
- `@eslint/js` (^9.39.1): 9.39.2 → 9.39.5
- `@inlang/paraglide-js` (^2.15.0): 2.15.0 → 2.25.4
- `@sveltejs/vite-plugin-svelte` (^6.2.1, docs): 6.2.1 → 6.2.4
- `@types/node` (^22.19.15): 22.19.15 → 22.20.4
- `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` (^8.57.0): 8.57.1 → 8.70.1
- `@vitest/browser-playwright` (^4.0.15): 4.0.15 → 4.1.11
- `cheerio` (^1.0.0): 1.0.0 → 1.2.0 (moves to `undici ^7`)
- `concurrently` (^9.0.0): 9.2.1 → 9.2.4
- `dotenv` (^17.3.1): 17.3.1 → 17.4.2
- `eslint` (^9.39.2): 9.39.2 → 9.39.5
- `eslint-plugin-playwright` (^2.9.0): 2.9.0 → 2.12.0
- `eslint-plugin-svelte` (^3.13.1, docs): 3.13.1 → 3.23.0
- `globals` (^15.14.0): 15.14.0 → 15.15.0
- `intl-messageformat` (^11.1.3): 11.1.3 → 11.2.15
- `isomorphic-dompurify` (^3.3.0): 3.3.0 → 3.19.0
- `jose` (^6.2.1): 6.2.1 → 6.2.12
- `mdsvex` (^0.12.6): 0.12.6 → 0.12.8
- `prettier` (^3.7.4): 3.7.4 → 3.9.9
- `prettier-plugin-svelte` (^3.5.1): 3.5.1 → 3.5.2
- `prettier-plugin-tailwindcss` (^0.7.2): 0.7.2 → 0.7.4
- `qs` (^6.15.0): 6.15.0 → 6.16.0
- `serve` (^14.2.3): 14.2.4 → 14.2.6
- `svelte` (^5.53.12): 5.53.12 → 5.57.1
- `svelte-check` (^4.4.5): 4.4.5 → 4.7.6
- `svelte-eslint-parser` (^1.6.0): 1.6.0 → 1.8.1
- `tsx` (^4.19.2): 4.19.2 → 4.23.15
- `turbo` (^2.8.17): 2.8.17 → 2.11.4
- `vite` (^6.4.1, frontend): 6.4.1 → 6.4.3; (^7.2.6, docs): 7.3.0 → 7.3.6
- `vite-plugin-devtools-json` (^1.0.0): 1.0.0 → 1.1.0
- `vitest` (^3.2.4, catalog): 3.2.4 → 3.2.7; (^4.0.15, docs): 4.0.15 → 4.1.11
- `zod` (^4.3.6): 4.3.6 → 4.6.5

Not moved although declared: the excluded set and the AI SDK family (above), and `eslint-plugin-svelte` ^2.46.1
(frontend; 2.46.1 is already the newest 2.x).

## 7. Operator follow-ups

- **Review the `braces` baseline row (169-01, `c97bc9898`).** GHSA-vfj7-8cjw-p6xm (id 1240992) was published
  after planning and covers every `braces` release, so the gate could not reach 0 NEW by any refresh. Under D-02
  ("the baseline keeps only no-fix or recorded-hold rows") the row was added BY HAND (no `--update-baseline`,
  PROH-169-02) with a written rationale in the existing dev-tooling style: reached only through `micromatch` 4
  from `vite-plugin-restart` and `@changesets/cli`, every expanded pattern repo-authored. 169-13's reviewed
  baseline rewrite keeps or drops it; the operator may prefer to rule on it sooner.
- `02-dedupe` is a gate this phase introduced; the starting lockfile failed it (71 dedupable descriptors), and
  nothing in CI runs it. Group 0 brought it to 0. Whether CI should hold the lockfile to `yarn dedupe --check`
  is an operator call (not changed here).
- The typecheck/build race fixed in `0c98a4621` exists in CI's `turbo run typecheck` too; the fix applies there
  unchanged.
- Handoffs carried forward untouched by group 0 (each belongs to a later group): the unused
  `eslint-config-prettier` devDependency in `apps/docs` (168 review, IN-01 → 169-03/169-10); the undeclared
  `globals` import in `@openvaa/shared-config` (167 review WR-02, todo `2026-10-02-declare-globals-in-shared-config.md`
  → 169-10; the refresh moved the hoisted `globals` 15.14.0 → 15.15.0); stale `via` descriptions in the
  baseline (167 review WR-01 → 169-13's rewrite).

- **Dev host Node default (169-02).** `nvm alias default` moved from `24` (→ v24.14.1) to `24.21.0`. Restore with
  `nvm alias default 24` (or `nvm alias default 24.14.1`). Note that v24.14.1 is now below `engines.node`
  (`>=24.15.0`), so the preinstall guard refuses installs under it. A non-interactive login shell on this host
  resolves `/usr/local/bin/node` v22.5.1, which the guard also refuses.
- **Render runs Node 24 from the next deploy (169-02).** Render builds `apps/frontend/Dockerfile`
  (`runtime: docker`), whose base is now `node:24-alpine` (v24.21.0 at the pull of 2026-10-03). Change any Render
  service setting that pins a Node version outside the Dockerfile to 24 (none is expected for a Docker service —
  unverified), and watch the first production deploy after merge. Rollback after that deploy is a redeploy of the
  previous image, not a revert. Not deployed by this phase.

## 8. Moderate and low advisories on chosen versions

Listed at phase end (169-13).
