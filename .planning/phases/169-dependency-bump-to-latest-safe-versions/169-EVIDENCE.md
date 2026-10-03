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

### 169-03 (group 2) re-measurement, 2026-10-03

`node 169-version-probe.mjs --only eslint,@eslint/js,eslint-plugin-import,@eslint/eslintrc,eslint-plugin-svelte,svelte-eslint-parser,@typescript-eslint/eslint-plugin,@typescript-eslint/parser,eslint-plugin-unused-imports,eslint-plugin-playwright,eslint-config-prettier,eslint-plugin-simple-import-sort,prettier,prettier-plugin-svelte,prettier-plugin-tailwindcss --node 24.21.0`
at 2026-10-03T10:34:07Z → exit 0, 15 packages (`eslint-plugin-import-x` is not yet declared, so it was measured
with `npm view`). Verdicts: current 7 · major 6 · HOLD-7d 2.

| Package | Resolved | Target (published, age) | Target line x.0.0 | Verdict / hold |
|---|---|---|---|---|
| `eslint` | 9.39.5 | **10.11.0** (2026-09-18, 14.6 d) | 10.0.0 2026-02-06 | major; 10.12.0 (2026-10-02T20:08Z, 0.6 d) held by the 7-day rule |
| `@eslint/js` | 9.39.5 | **10.0.1** (2026-02-06, 238.5 d) | 10.0.0 | major |
| `eslint-plugin-import-x` (new) | — | **4.17.1** (2026-06-28, 97.1 d; `latest`) | 4.0.0 long past | peer `eslint ^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0` admits both 9 and 10 |
| `eslint-plugin-svelte` | 2.46.1 (frontend) / 3.23.0 (docs) | **3.23.0** (2026-08-13, 51.4 d) | 3.0.0 2025-02-26 | major (frontend) |
| `eslint-plugin-simple-import-sort` | 12.1.1 | **14.0.0** (2026-07-16, 78.6 d) | 14.0.0 2026-07-16 (78.6 d) | major |
| `prettier-plugin-svelte` | 3.5.2 | **4.1.1** (2026-06-15, 109.7 d) | 4.0.0 2026-05-20 (136 d) | major |
| `prettier-plugin-tailwindcss` | 0.7.4 | **0.8.1** (2026-07-15, 80.0 d) | 0.8.0 2026-04-27 (159 d) | major |
| `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` | 8.70.1 | 8.70.1 | 8.0.0 | HOLD-7d: 8.71.0 (2026-09-28T17:1xZ, 4.7 d) |
| `@eslint/eslintrc` | 3.3.7 | 3.3.7 | — | current (removed by this plan) |
| `eslint-plugin-import` | 2.32.0 | 2.32.0 | — | current (removed by this plan) |
| `svelte-eslint-parser` 1.8.1, `eslint-plugin-unused-imports` 4.4.1, `eslint-plugin-playwright` 2.12.0, `eslint-config-prettier` 10.1.8, `prettier` 3.9.9 | = target | — | — | current |

### 169-04 (group 4) re-measurement, 2026-10-03

`node 169-version-probe.mjs --only <pkgs> --node 24.21.0`, one run per upgrade, each just before it:
`isomorphic-dompurify,jsdom` at 11:08:10Z (`04-t2-probe.md`); the Playwright / Tailwind / DaisyUI / Vitest set at
11:12:07Z (`04-t3-probe-preview.md`); `daisyui` again at 11:26:06Z (`04-t3-daisyui-probe.md`);
`vitest,@vitest/browser-playwright` at 2026-10-03T12:25:04Z (`04-t1-probe.md`). Logs under `tests/e2e-runs/169-gates/`.

| Package | Resolved before | Target (published, age) | Target line x.0.0 | Verdict / hold |
|---|---|---|---|---|
| `isomorphic-dompurify` | 3.19.0 | **4.4.0** (2026-09-25, 7.7 d) | 4.0.0 2026-09-01 (32 d) | major; engines `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0` admits the host's 24.21.0 |
| `jsdom` | 26.1.0 (held by the root resolution) | **30.1.1** (2026-09-22, 11.4 d) | 30.0.0 2026-07-27 | major; same engines |
| `@playwright/test`, `playwright` (docs) | 1.58.2 | **1.63.0** (2026-09-04, 28.5 d) | — | in-major; 1.63.0 is `latest` |
| `tailwindcss`, `@tailwindcss/vite` | 4.2.1 | **4.3.3** (2026-07-16, 79.0 d) | — | in-major; `@tailwindcss/vite` peer `vite ^5.2.0 \|\| ^6 \|\| ^7 \|\| ^8` admits the frontend's 6.4.3 and the docs app's 7.3.6 |
| `@tailwindcss/typography` (docs) | 0.5.19 | **0.5.20** (2026-06-08, 117.0 d) | — | in-major |
| `daisyui` | 5.5.14 | **5.7.46** (2026-09-24, 8.7 d) | — | in-major; HOLD-7d 5.7.47 (2026-09-30T00:29Z, 3.45 d) |
| `vitest` (catalog; the docs app had its own `^4.0.15`) | 3.2.7 / 4.1.11 (docs) | **5.0.2** (2026-09-25, 8.1 d) | 5.0.0 2026-09-03T12:24:30Z (30.0 d at the probe) | major (docs app: 4 → 5); HOLD-7d 5.0.3 (2026-09-30T11:30Z, 3.04 d); engines `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0`; peer `vite ^6.4.0 \|\| ^7.0.0 \|\| ^8.0.0` |
| `@vitest/browser-playwright` (docs) | 4.1.11 | **5.0.2** (2026-09-25, 8.1 d) | 5.0.0 2026-09-03T12:22:01Z | major; HOLD-7d 5.0.3 (2026-09-30T11:29Z); peer `vitest 5.0.2`, `playwright *` |

`vitest` 5.0.0 was published 2026-09-03T12:24:30Z and `@vitest/browser-playwright` 5.0.0 at 12:22:01Z, so the
30-day major rule cleared at 12:24:30Z today. At the 11:12Z preview the probe still reported `HOLD-30d`. The
migration was prepared in the working tree from 11:30Z and committed only after the probe re-run named 5.x
(2026-10-03T12:25:04Z). The tree's only record of Vitest 5 is that commit.

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

### 169-03 (group 2)

**Box A re-read (Task 1 precondition, 2026-10-03T10:33Z):** `169-LEGITIMACY-APPROVALS.md` § A is `[x]`
(`eslint-plugin-import-x` + `unrs-resolver`'s postinstall).

**`unrs-resolver` postinstall, printed before the install commit.** `npm view unrs-resolver@1.12.2 scripts` →
`{ "postinstall": "node postinstall.js" }`; its only dependency is `napi-postinstall ^0.3.4`, and its 22
`optionalDependencies` are the `@unrs/resolver-binding-<platform>` packages at the same version. After the
install, `node_modules/unrs-resolver/postinstall.js` reads in full:

```js
const { checkAndPreparePackage } = require("napi-postinstall");

const packageJson = require("./package.json");

checkAndPreparePackage(packageJson, true);
```

i.e. it checks that the platform binding (`@unrs/resolver-binding-darwin-arm64` here, installed as an optional
dependency) is present and only falls back to fetching it from the npm registry when it is not. The install log
(`tests/e2e-runs/169-gates/03/t1-install.log`) shows `YN0007: unrs-resolver@npm:1.12.2 must be built` and no
`YN0004` / `YN0009`: it ran because it is on the allow-list, which now reads `esbuild`, `supabase`,
`unrs-resolver` (root `package.json` `dependenciesMeta.<name>.built: true`; `enableScripts: false` unchanged;
no `approvedGitRepositories`). The lockfile's root-workspace entry gained the matching 2-line
`dependenciesMeta` hunk.

**Every package name new to `yarn.lock`** (30, `tests/e2e-runs/169-gates/03/t1-new-names.txt`), checked with
`gsd-tools query package-legitimacy check --ecosystem npm` (`t1-legit.json`):

| Package | Verdict | Reasons | Weekly downloads | Repository | Postinstall | Resolved (published, age on 2026-10-03) |
|---|---|---|---|---|---|---|
| `eslint-plugin-import-x` | OK | — | 8176981 | github.com/un-ts/eslint-plugin-import-x | — | 4.17.1 (2026-06-28, 97.2 d) |
| `unrs-resolver` | OK | — | 68533880 | github.com/unrs/unrs-resolver | `node postinstall.js` | 1.12.2 (2026-05-19, 136.9 d) |
| `@unrs/resolver-binding-*` (22 platform packages) | OK ×22 | — | 1.56 M – 60.9 M | github.com/unrs/unrs-resolver | — | 1.12.2 (2026-05-19, 136.9 d) |
| `napi-postinstall` | OK | — | 66837104 | github.com/un-ts/napi-postinstall | — | 0.3.4 (2025-10-04, 364.2 d) |
| `eslint-import-context` | OK | — | 13071697 | github.com/un-ts/eslint-import-context | — | 0.1.9 (2025-06-26, 464.2 d) |
| `stable-hash-x` | OK | — | 13235935 | github.com/un-ts/stable-hash-x | — | 0.2.0 (2025-06-25, 464.8 d) |
| `get-tsconfig` | OK | — | 130497396 | github.com/privatenumber/get-tsconfig | — | 4.14.3 (2026-08-17, 46.9 d) |
| `resolve-pkg-maps` | OK | — | 112686313 | github.com/privatenumber/resolve-pkg-maps | — | 1.0.0 (2022-12-14) |
| `comment-parser` | SUS | too-new (its `latest`) | 15271812 | github.com/yavorskiy/comment-parser | — | 1.4.9 (2026-09-08, 24.7 d) |

No `SLOP`; the one `SUS` is `too-new` on an established package, and the version actually resolved is 24.7 days
old.

### 169-04 (group 4)

New lockfile names per upgrade (`tests/e2e-runs/169-gates/04/t*-new-names.txt`), each run through
`gsd-tools query package-legitimacy check --ecosystem npm` (`t*-legit.json`). Every new `name@version` resolved
was listed with its publish date (`t*-new-versions.txt`); the youngest is `@asamuzakjp/css-color@7.1.0` at 7.2 days,
so every one clears the 7-day rule (`npmMinimalAgeGate: 7d` applied). None declares an install script.

| Upgrade | New name | Verdict | Reasons | Weekly downloads | Repository | Resolved (published, age) |
|---|---|---|---|---|---|---|
| isomorphic-dompurify 4 + jsdom 30 | `@exodus/bytes` | SUS | too-new (its `latest`) | 49909933 | github.com/ExodusOSS/bytes | 1.16.0 (2026-09-22, 10.9 d) |
| | `@asamuzakjp/dom-selector` | SUS | too-new | 54477804 | github.com/asamuzaK/domSelector | 9.2.1 (2026-09-20, 13.0 d) |
| | `@csstools/css-syntax-patches-for-csstree` | SUS | too-new | 56549128 | github.com/csstools/postcss-plugins | 1.1.14 (2026-09-15, 18.1 d) |
| | `bidi-js` | SUS | too-new | 60263939 | github.com/lojjic/bidi-js | 1.1.0 (2026-09-06, 26.6 d) |
| | `mdn-data` | SUS | too-new | 148718646 | github.com/mdn/data | 2.27.1 (2026-02-13, 231.5 d) |
| | `@bramus/specificity` | OK | — | 42559857 | github.com/bramus/specificity | 2.4.2 (2025-06-02) |
| | `css-tree` | OK | — | 144114785 | github.com/csstree/csstree | 3.2.1 (2026-03-05) |
| Playwright 1.63.0 | — (no new name) | | | | | `@playwright/test`, `playwright`, `playwright-core` 1.63.0 (28.5 d) |
| Tailwind 4.3.3 | — (no new name) | | | | | `tailwindcss`, `@tailwindcss/{vite,node,oxide,oxide-*}` 4.3.3 (79.0 d); `lightningcss` 1.32.0 (208 d) |
| DaisyUI 5.7.46 | — (no new name) | | | | | 5.7.46 (8.7 d) |
| Vitest 5 | `@vitest/ui` | SUS | too-new | 17139732 | github.com/vitest-dev/vitest | 5.0.2 (2026-09-25, 8.1 d); a dependency of `@vitest/browser` 5 |

Every `SUS` is `too-new` on an established package (tens of millions of weekly downloads): the check reads the
package's newest publish, not the version resolved. No `SLOP`; no new direct package (the Vitest move adds a
`vite` declaration to eleven workspaces, a package already in the tree, see § 6).

Removed by the jsdom move: `cssstyle`, `http-proxy-agent`, `nwsapi`, `rrweb-cssom`, `symbol-tree`. Removed by the
Vitest move: Vitest 3's `vite-node`, `tinypool`, `tinyspy`, `@vitest/{expect,runner,snapshot}`, `loupe` and its
chain, and the Rolldown/Oxc packages the docs app's Vitest 4 had pulled in through Vite 8. Every new `name@version` resolved is at least 7 days old (`npmMinimalAgeGate: 7d` applied; youngest
`comment-parser@1.4.9`). `@emnapi/core` / `@emnapi/runtime` / `@emnapi/wasi-threads` gained a 1.10.0 / 1.2.1
version (the `@unrs/resolver-binding-wasm32-wasi` chain; names already in the lockfile, published 2026-04, ≥ 170
d). The swap removed 91 package versions that only `eslint-plugin-import` pulled in (the `es-abstract` /
`array.prototype.*` / `is-*` shim family, `tsconfig-paths`, `eslint-module-utils`, `resolve` 2.0.0-next).

## 3. Holds

| Package | Held at | Newer line | Reason | Decision ref | Re-check date or trigger |
|---|---|---|---|---|---|
| `ai`, `@ai-sdk/google`, `@ai-sdk/openai` (+ their exact pins `@ai-sdk/gateway`, `@ai-sdk/provider`, `@ai-sdk/provider-utils`) | pre-phase resolutions: `ai` 5.0.60, `@ai-sdk/google` 2.0.23, `@ai-sdk/openai` 2.0.42, gateway 1.0.33, provider 2.0.0, provider-utils 3.0.10 / 3.0.12 | in-range `ai` 5.0.267, google 2.0.99, openai 2.0.130 (→ provider-utils 3.0.39) | **Narrowed out of the group-0 refresh.** `@ai-sdk/provider-utils` ≥ 3.0.35 (2026-08-26) depends on `undici ^5.29.0`; the in-range refresh pulled `undici` 5.29.0 and `@fastify/busboy` 2.1.1 back into the tree, adding NEW high 1240982 (`@fastify/busboy` <3.2.1, no in-range fix under `undici` 5's `^2.0.0`) and re-attaching accepted `undici` rows 1114638 / 1114640 / 1121245 to a new dependent. Moved into the excluded set per 169-01 Task 3 step 6; the family's majors are 169-09's | D-07, D-21, D-25 (G7) | 169-09 (AI SDK majors); re-check that the target `ai` / `@ai-sdk/*` majors do not depend on `undici` 5 |
| `braces` | 3.0.3 | none published | No fixed version exists (GHSA-vfj7-8cjw-p6xm covers `<=3.0.3`; 3.0.3 is the latest). Accepted in the baseline with a rationale (§ 7) | D-02 (baseline keeps no-fix rows), D-05 | when `braces` publishes a fix; or once `vite-plugin-restart` (169-05) and `@changesets/cli` 2's `micromatch` path (169-10) are both gone, the row goes stale |
| `@types/node` | **24.19.0** (catalog `^24.19.0`; 169-02, `968113336`) | 26.6.3 / 26.6.4 (`latest`), 25.x; 24.19.1 (1.4 d old on 2026-10-03) | **Types track the runtime major** (Node 24 at every pin site). 24.19.1 is inside the 7-day window | D-11, R3, D-03 | when the runtime moves to a newer major; 24.19.1 clears 2026-10-08T22:38Z |
| `typescript` | **6.0.3** (catalog `^6.0.3`; 169-02, `ebeaafa5c`) | 7.0.2 (2026-07-08, x.0.0 86.7 d old — the age rule alone would admit it) | Blocking peers measured 2026-10-03: `@typescript-eslint/eslint-plugin` / `@typescript-eslint/parser` / `typescript-eslint` 8.70.1 `typescript: >=4.8.4 <6.1.0` (8.71.0, the newest, is inside the 7-day window); `svelte-check` 4.7.6 `^5.0.0 \|\| ^6.0.0`; `@sveltejs/kit@3` `typescript: ^6.0.0`. 6.0.3 is the newest 6.x (6.0.0 was never published) | D-16 | typescript-eslint and svelte-check admit 7 (and Kit 3's peer, once Kit 3 lands) |
| `eslint`, `@eslint/js` | **9.39.5** (catalog `^9.39.2` / `^9.39.1`, unchanged) | 10.11.0 / 10.0.1 (age rule admits both) | **Upstream false positive.** ESLint 10's recommended `no-useless-assignment` reports every write-only `$bindable` prop (3 sites: `OpinionQuestionInput.svelte` `valid`, `Video.svelte` `mode`, `EntityList.svelte` `itemsShown`). eslint-plugin-svelte#1478 has been open since 2026-02-23 and 3.23.0 is the newest release. PROH-169-07 forbids disabling the rule, and a dummy read would bend the code. One real `no-unassigned-vars` defect (`Layout.svelte` `drawerOpenElement`, the drawer focus return is never wired) needs a behaviour decision. The 15 other ESLint-10 findings are fixed (`14b62f26c`). The config-lookup flag stays at all 19 sites, because ESLint 9 needs it | D-06, D-17, PROH-169-07 | eslint-plugin-svelte#1478 fixed in a release at least 7 days old, or an operator overrule (todo `2026-10-03-eslint-10-held-on-bindable-no-useless-assignment.md`, options A/B) |
| `vitest`, `@vitest/browser-playwright` | **5.0.2** (catalog `^5.0.2`; 169-04) | 5.0.3 (2026-09-30T11:30Z / 11:29Z, 3.0 d old on 2026-10-03) | Inside the 7-day window; 5.0.2 is the newest 5.x old enough | D-03 | 5.0.3 clears 2026-10-07T11:30Z |
| `daisyui` | **5.7.46** (catalog `^5.7.46`; 169-04) | 5.7.47 (2026-09-30T00:29Z, 3.45 d old on 2026-10-03) | Inside the 7-day window | D-03 | 5.7.47 clears 2026-10-07T00:29Z |

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
| 169-03 | `169-03-group2` (import-x, eslint-plugin-svelte 3, no FlatCompat, the 15 ESLint-10 source fixes, prettier-plugin-svelte 4, prettier-plugin-tailwindcss 0.8.1, simple-import-sort 14; ESLint held on 9.39.5) | `2e3a79846` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | — (no E2E in group 2, D-26) |
| 169-04 | `169-04-precommit-dryrun` (Vitest 5 uncommitted; informational) | `5408452ab` + working tree | 0 | 0 | **1** | **1** | **1** | **1** | 0 | 0 | 0 | 0 | 0 | 0 | — |
| 169-04 | `169-04-group4` (isomorphic-dompurify 4 + jsdom 30, Playwright 1.63.0 + image digest, Tailwind 4.3.3, DaisyUI 5.7.46 + its reformat, Vitest 5.0.2 + `test.projects`) | `7b41eb90a` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **171 / 171 / 0 / 0 / 0** (`169-e2e/169-04-group4`) |

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

Notes on `169-03-group2` (2026-10-03T10:58:56Z–11:01:13Z, `tests/e2e-runs/169-gates/169-03-group2/`):
- Run on a clean tree (`porcelain_lines: 0`).
- Forced turbo runs: `03-typecheck` 23/23 and `09-build` 14/14 tasks executed.
- `04-lint` reports 0 errors and the same 17 baseline warnings as before the plan (normalised list, `diff` exit 0).
- `10-audit`: `0 new advisory(ies) at high+`.

Notes on `169-04-precommit-dryrun` (`tests/e2e-runs/169-gates/169-04-precommit-dryrun/`). This was an informational run on the
uncommitted Vitest tree, made while waiting for Vitest 5.0.0 to clear the 30-day rule.
- `03-typecheck`, `04-lint` and `06-check-frontend` were red on the same 2 svelte-check errors: Vitest 5's stricter
  `Mock` / `MockInstance` types in two frontend tests (§ 6, Task 1 fix 4).
- `05-format` was red on one docs file, the DaisyUI 5.7 class sort (§ 6, Task 3; reformatted in `a376b16d1`).
- Both were fixed before the Vitest commit.

Notes on `169-04-group4` (2026-10-03T12:27:19Z–12:29:31Z, `tests/e2e-runs/169-gates/169-04-group4/`):
- `porcelain_lines: 1` (this ledger, uncommitted).
- Forced turbo runs: `03-typecheck` 23/23, `08-unit` 25/25 and `09-build` 14/14 tasks executed, none cached.
- `04-lint` reports 0 errors and 17 warnings. The normalised finding list (path + rule + message, 33 lines) is
  identical to `169-03-group2`'s (`diff` exit 0).
- `10-audit`: `0 new advisory(ies) at high+, 6 accepted`.
- `12-docs-rq`: every `<ResearchQuote>` span identical to the base and the three frozen components identical to
  the component base.

E2E `169-04-group4` (`bash 169-e2e.sh 169-04-group4`, the full default suite):
- Docker VM 22.01 GiB free after `docker builder prune -af`.
- `e2e-run.sh` at HEAD `7b41eb90a` with `db_reset=true` and project `…0000e2`, 2026-10-03T12:31:00Z–12:35:23Z.
- Wrapper exit 0; preflight successes 1, failures 0.
- `summary.json`: **total 171, passed 171, failed 0, flaky 0, skipped 0, didNotRun 0**.
- No listener left on 5273.
- This run is the first full E2E run on Playwright 1.63.0 and Vitest 5, and it is the runner's own proof after the
  move.

Final visual run `169-04-visual-final` at `7b41eb90a`, image `eff16c30e6f3…`: exit 0, 7 expected / 0 unexpected /
0 flaky.

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

### 169-02 CI evidence (`ci-evidence/169-deps`, `main.yaml`)

Each evidence commit is a source-only tree (`GIT_INDEX_FILE` scratch index, `.planning` and `.bg-shell` removed,
`git ls-tree -r --name-only` → 0 paths under `.planning/`) with parent `59f8dacdd` (origin/main). Job lists:
`tests/e2e-runs/169-gates/02-t2-ci-jobs-run1.json`, `02-t3-ci-jobs-run2.json`, `02-t3-ci-jobs-run3.json`. The
pending todo `2026-09-03-ci-e2e-ssr-500.md` (dev server answering HTTP 500) does not describe any red here, so it
exempts no job. `release.yml` and `docs.yml` (both edited for Node 24 / Yarn 4.18) do not trigger on
`ci-evidence/**`. They cannot be observed until merge.

| Job | Run 1 `37110493184` (`91e58711a` = tree of `77d3ce8bf`) | Run 2 `37111729145` (`3eaa31396` = tree of `d01096223`), attempts 1 and 2 | Run 3 `37115289953` (`2cf0e8416` = tree of `8d91d37f8`) |
|---|---|---|---|
| `node-engine-range-negative-control` | success | success | **success** |
| `docker-image-build` | success | success | **success** |
| `supabase-tests` | success | success | **success** |
| `skill-drift-check` | success | success | **success** |
| `secret-scan` | failure (trufflehog: the `localSupabaseUrl.test.ts` userinfo fixture URL, pre-existing since `214cf8d3b`) | success | **success** |
| `dependency-audit` | failure (step "Setup Yarn 4.18") | success | **success** |
| `sql-lint` | failure (step "Setup Yarn 4.18") | success | **success** |
| `supabase-types-drift` | failure (step "Setup Yarn 4.18") | success | **success** |
| `dev-seed-integration` | failure (step "Setup Yarn 4.18") | success | **success** |
| `frontend-and-shared-module-validation` | failure (step "Setup Yarn 4.18") | success | **success** |
| `e2e-visual` | failure (step "Setup Yarn 4.18") | success | **success** (7 passed) |
| `e2e-tests` | failure (step "Setup Yarn 4.18") | **failure, both attempts** (step "Run E2E tests"; 82 passed / 1 failed / 88 did-not-run) | **success** (171 passed; no failed, flaky or did-not-run line in the job log) |
| **Run conclusion** | failure | failure | **success** (2026-10-03T10:06:21Z–10:26:35Z, attempt 1) |

- **Run 1.**
  - The seven "Setup Yarn 4.18" failures: `setup-yarn` ran its install while the runner was still on its default
    Node 22, and the new preinstall guard (`engines.node >=24.15.0`) refused it. That is the guard working. The
    workflow ordered its steps wrong. Fixed in `4dbc7aeed`: Node is set up before Yarn in 9 jobs, and
    setup-node's `cache: "yarn"` is dropped.
  - `secret-scan` fixed in `d01096223` (the fixture URL is now built from parts).
- **Run 2.**
  - `e2e-tests` failed on both attempts, each time in a different test but at the same helper line,
    `voter-journey.spec.ts:385` (`expectElectionOptionAndSelect`: `expect(visibleOptions).toHaveCount(1, { timeout:
    TIMEOUTS.element })`, 2000 ms; got 2). Attempt 1 failed in `number-scale boundary matching › all-min walk`
    (line 1412). Attempt 2 failed in `full voter journey end-to-end` (line 472). Each time, this happened right
    after another election was clicked in the results accordion.
  - The attempt-2 trace has screencast frames at +0.87 s and +2.0 s after the click. Both show the accordion
    still expanded, with the list below still showing the PREVIOUS election ("13 candidates in constituency
    [co-reg-n]"). For about 1.1 s there are no frames at all, a busy main thread.
  - The only network traffic in that window is storage image GETs, with no `__data.json` or other server
    request. The wait is therefore on client-side results re-rendering, which the dev server's Node version
    does not affect.
  - The attempt-1 error-context snapshot, taken right after the timeout, shows the accordion already
    collapsed, i.e. the collapse landed just past 2 s.
  - **Verdict:** a fixed-window race on the slower CI runner, not a Node 24 or TypeScript 6 regression. Locally
    the same suite is 171/171 on Node 24 (`169-e2e/169-02-node24`). **Component mechanism UNCONFIRMED**: whether
    a collapse timer or a remount-then-reconcile of the results subtree delays the collapse was not traced.
  - **Fix forward, `8d91d37f8`:** both copies of the helper (`expectElectionOptionAndSelect` in
    `voter-journey.spec.ts` and `selectElectionByName` in `tests/tests/utils/selectElection.ts`) now wait with
    `TIMEOUTS.page` (5 s), because what they wait on is a route transition. The assertion (`toHaveCount(1)`) is
    unchanged.
  - Diagnosis artifacts (scratchpad copies of the run's `results.json`, trace and error-context) were not kept
    in the repository. They can be downloaded again with `gh run download 37111729145` while GitHub retains them.
- **Run 3** carries the whole of group 1: Yarn 4.18.1, Node 24, the CI step order, the secret-scan fixture,
  `@types/node` 24, TypeScript 6.0.3 and the E2E budget fix. **Every job concluded `success`**, including the
  negative control (both halves bound under Node 24.21.0). This is the observed CI run D-11 requires.

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

### The four import rules on planted violations (D-17) — 169-03

Runner: `bash 169-planted-import-rules.sh <namespace>` (committed in the phase directory). It writes one fixture
per rule under `packages/core/src/__planted_169__/`, lints them from `packages/core` with the repository's
`node_modules/.bin/eslint` (the root config, i.e. the shared config) in JSON form, requires each fixture's
messages to include `<namespace>/<rule>`, removes the fixtures and requires `git status --porcelain --
packages/core/src` to be empty. The config-lookup flag is passed only when ESLint reports major 9.

| When | ESLint | Command | Exit | Output |
|---|---|---|---|---|
| before the swap (HEAD `81687aa55`) | 9.39.5 | `… import` | 0 | `import/first: fired` · `import/newline-after-import: fired` · `import/no-duplicates: fired` · `import/consistent-type-specifier-style: fired` |
| before the swap — negative control | 9.39.5 | `… import-x` | **1** | all four `import-x/…: MISSING` (the plugin is not registered yet, so the script can say MISSING) |
| after the swap (working tree of `d3383c7e4`) | 9.39.5 | `… import-x` | 0 | `import-x/first: fired` · `import-x/newline-after-import: fired` · `import-x/no-duplicates: fired` · `import-x/consistent-type-specifier-style: fired` |
| after the swap — negative control | 9.39.5 | `… import` | **1** | all four `import/…: MISSING` (the old namespace is gone) |

`TURBO_FORCE=true yarn lint:check`, each status read from its own exit file:

| When | Exit | Findings (`turbo run lint` + `eslint tests`) | Log |
|---|---|---|---|
| before the swap | 0 | 0 errors, **17 warnings**: 15 `unused-imports/no-unused-vars` in `packages/dev-seed/src/generators/*`, 1 in `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts`, 1 unused `eslint-disable` directive in `tests/tests/support/mockOidcIssuerEntry.ts` | `tests/e2e-runs/169-gates/03/t1-lint-before.log`, normalised list `t1-findings-before.tsv` |
| after the swap | 0 | the same 17 (normalised `file / severity / rule / message` lists: `diff` exit 0) | `t1-lint-after.log`, `t1-findings-after.tsv` |

The starting state is "0 errors and 17 pre-existing warnings", not "zero findings"; D-17's "zero new findings" is
held by equality of the normalised lists from here on.

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

### 169-03 Task 2 — `eslint-plugin-svelte` 3, the FlatCompat removal, the ESLint 10 attempt

Logs and JSON: `tests/e2e-runs/169-gates/03/t2*`.

**Commit A `51e22ea78` (`eslint-plugin-svelte` 3.23.0 through the catalog).**
- Catalog `^2.46.1` → `^3.23.0`; `apps/docs` `^3.13.1` → `catalog:`; the frontend spread goes from
  `svelte.configs['flat/prettier']` to `svelte.configs.prettier`.
- `yarn why eslint-plugin-svelte` → only `3.23.0`, for both apps.
- The install removed 8 versions (`eslint-plugin-svelte` 2.46.1, `eslint-compat-utils`, `espree` 9 …) and added no
  package name.
- Frontend findings (`eslint --format json src/` from `apps/frontend`, normalised to `file / severity / rule /
  message`):
  - before: 849 files, 1 finding (`candidateContext.svelte.test.ts` warning `unused-imports/no-unused-vars`);
  - after: 849 files, the same 1 finding (`diff` exit 0).
- Docs `eslint .`: exit 0 before and after.

**Commit B `087697975` (no FlatCompat).**
- `compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier')` is replaced, in
  that order, by `js.configs.recommended`, `...typescriptEslint.configs['flat/recommended']` and
  `eslint-config-prettier`'s default export.
- Removed: the `FlatCompat` import, `compat`, and the `path` / `fileURLToPath` / `__dirname` setup.
- `@eslint/eslintrc` is removed from the catalog and from `packages/shared-config/package.json`, the only
  manifest that declared it. On ESLint 9 it stays in the lockfile as ESLint's own dependency.
- `--print-config` before vs after:

| File (linted from its workspace) | Rules before | Rules after | Rule differences (severity-normalised) | Other keys |
|---|---|---|---|---|
| `packages/core/src/index.ts` | 460 | 460 | 0 | identical |
| `apps/frontend/src/lib/utils/components.ts` | 472 | 472 | 0 | identical |
| `apps/frontend/src/lib/components/alert/Alert.svelte` | 470 | 470 | 0 | identical |
| `tests/tests/utils/selectElection.ts` | 499 | 499 | 0 | identical |
| `apps/docs/src/routes/+layout.svelte` | 470 | 470 | 0 | identical |

- `TURBO_FORCE=true yarn lint:check` → 0, the same 17 findings (`diff` exit 0).
- Planted proof `import-x` → 4/4 fired.

**Commit C — ESLint 10: attempted, measured, held (§ 3).**

Peer ranges at the resolved versions (`npm view <pkg>@<v> peerDependencies`, 2026-10-03). All admit ESLint 10:

| Package@resolved | `eslint` peer |
|---|---|
| `@typescript-eslint/eslint-plugin`, `parser`, `utils` @8.70.1 | `^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0` |
| `eslint-plugin-unused-imports@4.4.1` | `^10.0.0 \|\| ^9.0.0 \|\| ^8.0.0` |
| `eslint-plugin-playwright@2.12.0` | `>=8.40.0` |
| `eslint-config-prettier@10.1.8` | `>=7.0.0` |
| `eslint-plugin-svelte@3.23.0` | `^8.57.1 \|\| ^9.0.0 \|\| ^10.0.0` |
| `svelte-eslint-parser@1.8.1` | (no eslint peer) |
| `eslint-plugin-import-x@4.17.1` | `^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0` |
| `eslint-plugin-simple-import-sort@12.1.1` / `@14.0.0` | `>=5.0.0` |
| `@eslint/js@10.0.1` | `^10.0.0` |

The attempt in the working tree:
- Catalog `eslint ^10.11.0`, `@eslint/js ^10.0.1`; `yarn why eslint` → 6 × `10.11.0`.
- Removed the flag at all 19 sites: root `lint:fix` / `lint:check`, 11 workspace `lint` scripts,
  `.lintstagedrc.json`, the 4 guard `new ESLint()` calls and `packages/README.md`.
- Rewrote the guard docblocks.
- New lockfile names (9): `@cacheable/memory`, `@cacheable/utils`, `@keyv/bigmap`, `@keyv/serialize`,
  `@types/esrecurse`, `cacheable`, `hashery`, `hookified`, `qified`. Legitimacy: 6 OK, 3 SUS `too-new` only
  (their `latest`); the resolved versions are 97–441 d old; no postinstall (`t2c-legit.json`).

Results on ESLint 10.11.0:
- Planted proof `import-x` → 4/4 fired (no flag passed).
- `yarn workspace @openvaa/frontend vitest run src/lib/_guards/` → 0 (5 files, 390 tests).
- `turbo run lint --continue` + `eslint tests` → **19 errors** from the new recommended rules:

| File | Rule | Disposition |
|---|---|---|
| `packages/dev-seed/src/cli/resolve-template.ts` (JSON parse, module import) ×2 | `preserve-caught-error` | fixed: `{ cause: err }` |
| `packages/dev-seed/src/writer.ts` (portrait assets) | `preserve-caught-error` | fixed: `{ cause: err }` |
| `packages/question-info/src/core/infoGeneration.ts` `exampleOutput` | `no-useless-assignment` | fixed: declared without a dead initial value |
| `packages/question-info/src/core/infoGeneration.ts` (outer catch) | `preserve-caught-error` | fixed: `{ cause: error }` |
| `packages/argument-condensation/src/core/condensation/condenser.ts` ×2 | `preserve-caught-error` | fixed: `{ cause: error }` |
| `packages/argument-condensation/src/core/utils/condensation/calculateLLMCallCounts.ts` `llmCallCount` | `no-useless-assignment` | fixed: every `switch` arm assigns or throws |
| `apps/frontend/src/lib/contexts/tests/noDataRootDerivedAlias.test.ts` | `preserve-caught-error` | fixed: `{ cause }` |
| `apps/frontend/src/lib/layouts/tests/noRelativeLayoutImports.test.ts` | `preserve-caught-error` | fixed: `{ cause }` |
| `apps/frontend/src/lib/server/admin/requireAdminIdentity.ts` `administersProject` | `no-useless-assignment` | fixed: `try` and `catch` both assign |
| `apps/frontend/src/lib/utils/color/PreviewColorContrast.svelte` `parsedColor`, `bgLum` | `no-useless-assignment` | fixed: both branches assign |
| `tests/tests/support/preflight.ts` `lastStatus`, `lastError` | `no-useless-assignment` | fixed: every loop path assigns before the read |
| `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` `valid` | `no-useless-assignment` | **false positive**: write-only `$bindable` (eslint-plugin-svelte#1478) → hold |
| `apps/frontend/src/lib/components/video/Video.svelte` `mode` | `no-useless-assignment` | **false positive**, same → hold |
| `apps/frontend/src/lib/dynamic-components/entityList/EntityList.svelte` `itemsShown` | `no-useless-assignment` | **false positive**, same → hold |
| `apps/frontend/src/lib/layouts/main/Layout.svelte` `drawerOpenElement` | `no-unassigned-vars` | **real defect**: the drawer focus return is never wired; a behaviour decision → hold, todo |

- After the 15 fixes, the same ESLint 10 run reported exactly the 4 hold rows (`t2c-lint-continue2.log`).
- No `eslint-env` comment exists in the tree, and none was reported.

Resolution:
- The 15 fixes landed as `14b62f26c` `fix(lint): …`. On ESLint 9:
  - `TURBO_FORCE=true yarn lint:check` → 0, with the same 17 findings as the plan's baseline (`diff` exit 0);
  - `test:unit` for dev-seed (901), question-info (22) and argument-condensation (30) → 0;
  - the frontend specs for the touched files plus the guards → 0 (420 tests).
- The ESLint 10 bump, the flag removal and the docblock rewrite were reverted file by file (`git checkout -- <the
  19 files and yarn.lock>`), and `yarn install` brought back 9.39.5.
- The attempt's diff is kept locally as `t2c-eslint10-config.patch` (gitignored) for the re-application.

### 169-03 Task 3 — the formatter and sorter majors, each with its reformat (D-23)

Each bump was a catalog change plus `yarn install`. Each lockfile diff touched only that package's own entry: 4–5
lines, one version swapped, no new name. The age rule held for all three (§ 1, 169-03 table).

| Order | Bump commit | Changelog breaking items that apply here | Reformat command | Result | `check:research-quotes` (two-base form) |
|---|---|---|---|---|---|
| 1 | `cb266766b` `prettier-plugin-svelte` 3.5.2 → **4.1.1** | 4.0.0 requires Svelte 5 (the tree resolves only `svelte` 5.57.1) and removes `svelteBracketNewLine` / `svelteStrictMode`, which no prettier config in the repository sets (`git grep` → nothing) | `yarn format` (root Prettier and `yarn workspace @openvaa/docs format`), exit 0; 188 `.svelte` paths in the log | **no diff** (`git status --porcelain` empty) | 0 |
| 2 | `59f6acf8a` `prettier-plugin-tailwindcss` 0.7.4 → **0.8.1** | 0.8.0 requires Prettier ≥ 3.7 (the tree has 3.9.9). 0.8.1 restores class sorting in Svelte markup under `prettier-plugin-svelte` 4. No option this repository sets was renamed (`tailwindStylesheet` in the docs config) | `yarn format`, exit 0 | 2 files: `Select.svelte` and `routes/candidate/help/+page.svelte`. In each, a `class` list inside an `{#each} … {:else}` branch was re-sorted to the order the plugin already gives `text-secondary` elsewhere in the frontend (unknown/theme class first). Neither run on the 0.7 line, with svelte plugin 3 or 4, had touched them, so the 0.7 line evidently did not visit those branches → `4fa365e41` `style: reformat for prettier-plugin-tailwindcss 0.8.1` | 0 |
| 3 | `2e3a79846` `eslint-plugin-simple-import-sort` 12.1.1 → **14.0.0** | 13.0.0 orders imports from one source by import style; 14.0.0 handles string-literal export names. The rule options are unchanged | `TURBO_FORCE=true yarn lint:fix`, exit 0 | **no diff from the sorter.** The run's only change was ESLint's own autofix of the pre-existing unused `eslint-disable-next-line no-console` directive in `tests/tests/support/mockOidcIssuerEntry.ts`, one of the 17 baseline warnings. It replaced the line with whitespace, is unrelated to the sorter and was reverted (`git checkout -- <that file>`) | 0 |

No ResearchQuote span changed in any of the three, and no `prettier-ignore` was needed.

### 169-04 Task 2 — isomorphic-dompurify 4, jsdom 30 and the root resolution (D-08, D-23), commit `668dc5675`

Logs: `tests/e2e-runs/169-gates/04/t2*`.

**What the deleted resolution worked around.** `git log -S'"isomorphic-dompurify/jsdom"' -- package.json` names
`3d75e3e27` ("chore: update the monorepo and frontend-app build, lint, CI and deployment plumbing", 2026-08-17).
That commit is a squash whose message gives no reason. Its `package.json` hunk adds
`"resolutions": { "isomorphic-dompurify/jsdom": "^26.1.0" }`, while `apps/frontend` moves `isomorphic-dompurify`
^2.19.0 → ^3.3.0 and `jsdom` ^24.1.3 → ^26.1.0. The pre-squash commit is still reachable:
`git log --all -S'isomorphic-dompurify/jsdom'` → `5555f42a6` "fix: resolve jsdom ESM incompatibility and IPv6 test
baseURL". Its message: "Pin isomorphic-dompurify/jsdom to ^26.1.0 via yarn resolutions to avoid
html-encoding-sniffer@6 -> @exodus/bytes ESM-only module breaking SSR … Temporary workaround — revert resolution
once upstream fixes land." So the 3.x line's own newer jsdom required the ESM-only `@exodus/bytes` from CommonJS,
and the resolution held it down to jsdom 26, which predates that chain.

**Why it can go now.** jsdom 30.1.1 still depends on `@exodus/bytes ^1.15.1` (`"type":"module"`). It loads because
Node ≥ 24.15 (the host and every pin, 169-02) supports `require()` of ES modules without a flag. Measured on the
installed tree (`t2-node-entry.log`): `import('isomorphic-dompurify')` (the `node` → `import` entry) and
`require('isomorphic-dompurify')` (the `node` → `require` entry) both construct their jsdom window. Both strip
`onerror`, `<script>` and the `javascript:` href from a sample.

**Resolution after the move.** `yarn why jsdom` → one `jsdom@npm:30.1.1`, used by both `@openvaa/frontend` (its
test environment) and `isomorphic-dompurify@npm:4.4.0` (`^30.0.0`). `yarn why isomorphic-dompurify` → `4.4.0` only.
`dompurify` → 3.4.16: isomorphic-dompurify 4 still wraps DOMPurify 3, so "DOMPurify 4" in the plan means the
wrapper's major. The root `resolutions` object is gone
(`node -p "JSON.stringify(require('./package.json').resolutions ?? null)"` → `null`).

**Sanitiser tests.** No unit test covered `sanitizeHtml` before this plan
(`git grep -l sanitize -- 'apps/frontend/src/**/*.test.ts'` named only an unrelated data-writer test). The commit adds
`apps/frontend/src/lib/utils/sanitize.test.ts` (6 tests): empty input; ordinary markup kept verbatim; `<script>`
removed; inline event handler removed; `javascript:` URL removed; SVG/MathML dropped under the html-only profile.
They pass on jsdom 30 (`t2-sanitize-test.log`).

**Gates for the commit:** `yarn workspace @openvaa/frontend test:unit` → 2018/2018 before the test file was added,
then 2024/2024; `check` → 0 errors / 0 warnings over 2705 files; `build` → exit 0. In the SSR output the server
chunk `sanitize.js` keeps `from "isomorphic-dompurify"` external, so production loads the `node` entry tested
above. No `ssr.noExternal` / `ssr.external` change was needed.

### 169-04 Task 3 — Playwright 1.63.0, the visual container image, Tailwind 4.3.3, DaisyUI 5.7.46 (D-24)

**Image.** `docker pull --platform linux/amd64 mcr.microsoft.com/playwright:v1.63.0-noble` →
`mcr.microsoft.com/playwright@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27` (amd64,
created 2026-09-04T23:42:21Z). The pre-plan default was `sha256:6446946a1d9f…` (v1.58.2-noble, not present locally).
The first pull stalled with no output. `docker-credential-desktop get` never returned: the documented host wedge
(136-05 / 136-06). The stalled pull and its helper process were killed, and the pull was repeated with a scratch
`DOCKER_CONFIG` holding `{}` plus `DOCKER_HOST=unix://$HOME/.docker/run/docker.sock`. The registry is
anonymous, so no credential is involved.

**Measured in the new image** (`t3pw-socat.log`, `t3pw-fontprobe.log`):
- `command -v`: `socat` not found; `curl` /usr/bin/curl, `npx` /usr/bin/npx, `node` /usr/bin/node (v24.20.0).
- Browsers: `chromium-1243`, `chromium_headless_shell-1243`, `firefox-1543`, `webkit-2359`.
- `document.fonts.check('1em Inter')` in Chromium 153.0.8010.12, through a probe script run in the image against
  the repo's own `inter-latin-400-normal.woff2`:
  - unreachable `src` → `check=false size=1`;
  - zero `@font-face` rules → `check=true size=0`;
  - valid `src` → `check=true size=1`.
  These are the three cases the visual spec's `settleFonts` docblock states, so the docblock now names this image.

**Visual container runs** (`tests/scripts/visual-container.sh`). The host prerequisites were `yarn build`,
`yarn db:reset`, `yarn db:seed --template e2e/base`, then the frontend dev server with `--host 0.0.0.0`:

| Run dir | After commit | Image digest | Playwright | Result |
|---|---|---|---|---|
| `169-04-visual-playwright-attempt1-wrong-project` | Playwright | `eff16c30e6f3…` | 1.63.0 | exit 1 before any test: the served-project preflight refused. The dev server had been started without `PUBLIC_PROJECT_ID`, so it served the default project. A harness setup error, not a visual result |
| `169-04-visual-playwright` | `34670ea56` Playwright | `eff16c30e6f3…` | 1.63.0 | **exit 0**, 7 expected / 0 unexpected / 0 flaky: 4 screenshots + setup/teardown |
| `169-04-visual-tailwind` | `b9dc939fa` Tailwind | `eff16c30e6f3…` | 1.63.0 | **exit 0**, 7 / 0 / 0 |
| `169-04-visual-daisyui` | `5408452ab` DaisyUI | `eff16c30e6f3…` | 1.63.0 | **exit 0**, 7 / 0 / 0 |
| `169-04-visual-final` | `7b41eb90a` (plan HEAD, after Vitest 5 and the reformat) | `eff16c30e6f3…` | 1.63.0 | **exit 0**, 7 / 0 / 0 |

From the second run on, the dev server ran with `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2`, the
project `e2e-run.sh` gives its own server. It was restarted after each CSS bump, so the run saw the new CSS. Each
app's production build passed after each bump.

**DaisyUI 5.7 changes the class sort, `a376b16d1`.** The gate dry run's `05-format` was red on one file: the docs app's
`src/lib/components/Header.svelte`. `prettier-plugin-tailwindcss` reads the docs stylesheet, which loads DaisyUI,
and now sorts `btn-ghost` before `text-lg`. Attribution was measured by formatting the unchanged file through
`--stdin-filepath`, comparing two package sets:
- DaisyUI temporarily back on 5.5.14, Tailwind 4.3.3: no class change;
- DaisyUI 5.7.46: the reorder.

The manifest and lockfile were restored byte-for-byte from copies afterwards. The reorder is committed alone as
`style: reformat for the DaisyUI 5.7 class order`. `check:research-quotes` (two-base form) → 0; this file is not one
of the three frozen components. A class attribute's order does not change the cascade, and the docs app is not in
the visual suite.

**No diff, so no re-baseline.** None of the four snapshots (`voter-results-{desktop,mobile}`,
`candidate-preview-{desktop,mobile}`) mismatched on the new browser build or on either CSS bump. No snapshot file
changed and no `test(visual): re-baseline` commit exists.

### 169-04 Task 1 — one Vitest 5 through the catalog, `test.projects` (D-19, D-13), commit `7b41eb90a`

**Per-workspace unit counts** (`TURBO_FORCE=true yarn test:unit`):
- before: `04-t1-unit-before.log`, at `5408452ab` on Vitest 3.2.7;
- after: `04-t1-unit-after.log`, on 5.0.2, with `NO_COLOR=1`, because Vitest 5 colours its summary under turbo and
  the extraction reads plain text;
- earlier "before" runs kept as `04-t1-unit-before.at-61dfb2fb2.log` and `.at-668dc5675.log`: identical except
  the frontend's +6 sanitiser tests.

| Workspace | Test files before | Tests passed before | Test files after | Tests passed after |
|---|---|---|---|---|
| `@openvaa/supabase` | 15 | 205 | 15 | 205 |
| `@openvaa/core` | 3 | 8 | 3 | 8 |
| `@openvaa/matching` | 5 | 43 | 5 | 43 |
| `@openvaa/data` | 47 | 244 | 47 | 244 |
| `@openvaa/filters` | 1 | 22 | 1 | 22 |
| `@openvaa/app-shared` | 9 | 92 | 9 | 92 |
| `@openvaa/llm` | 2 | 39 | 2 | 39 |
| `@openvaa/question-info` | 2 | 22 | 2 | 22 |
| `@openvaa/argument-condensation` | 6 | 30 | 6 | 30 |
| `@openvaa/dev-seed` | 66 | 901 | 66 | 901 |
| `@openvaa/frontend` | 127 | 2024 | 127 | 2024 |

The plan's equality check (the `node -e` over both logs) → "11 workspaces equal", exit 0. `yarn assert:unit-coverage` → 0
violations, 11 workspaces executed (4 unwired: dev-tools, docs, shared-config, supabase-types — unchanged).

**Root runner.** `yarn vitest run --config vitest.config.ts` → exit 0, 141 files / 1401 tests. These are exactly
the sums over the 9 package projects (the 9 `packages/*/vitest.config.ts`). `vitest list --json` names those 9
projects. `apps/supabase` and `apps/frontend` are not in `test.projects`, as before (the deleted file listed
`packages/**` only). `apps/docs`: `vitest run --passWithNoTests` loads both the `server` and the
`client (chromium)` projects through `@vitest/browser-playwright` 5 (exit 0, no test files). `check` → 0 / 0 over
729 files; `build` → exit 0.

**Migration fixes at source** (no test skipped, deleted or `.todo`-ed; each count above unchanged):
1. `packages/matching/tests/space.test.ts` — a `describe('MatchingSpace.fromQuestions', …)` called inside
   `test('MatchingSpace', …)`. Vitest 5 throws on it ("Calling the suite function inside test function is not
   allowed"). The block held no test, only two `expect`s. It became a plain block inside the test. Once it ran, its
   second assertion failed: `delete questionWeights[2]` deletes the key `"2"`, but the weights are keyed by question
   id (`mockQuestion_<random>`). The test now deletes `questionWeights[questions[2].id]`, which is what its comment
   ("the last should default to one") describes. `MatchingSpace.fromQuestions` was already correct. These two
   assertions evidently never executed on Vitest 3: a suite registered inside a running test was never collected.
   That mechanism is **UNCONFIRMED**; the failing assertion on first execution is measured.
2. `packages/dev-seed/tests/writer.test.ts` — the mocked `SupabaseAdminClient` constructor used an arrow
   `mockImplementation`. Since Vitest 4, `new` on a mock constructs, and an arrow function cannot be constructed
   (28 failures, "The vi.fn() mock did not use 'function' or 'class'"). It is now a `function` implementation
   that returns the instance, with a one-line reason.
3. `apps/frontend/src/lib/utils/motion.test.ts` — `vi.spyOn(window, 'matchMedia')` failed ("can only spy on a
   function. Received undefined"), because jsdom implements no `matchMedia`. The stub is now
   `vi.stubGlobal('matchMedia', vi.fn(…))`; the existing `afterEach` already calls `vi.unstubAllGlobals()`. Both
   directions (matches → `true`, no match → `false`) still assert. Why `spyOn` passed on Vitest 3 is
   **UNCONFIRMED**.
4. Types, found by a gate dry run on the uncommitted tree (`169-04-precommit-dryrun`: typecheck, lint and
   check-frontend red, with 2 svelte-check errors). Vitest 5 types `ReturnType<typeof vi.fn>` as
   `Mock<Procedure | Constructable>`, which is no longer assignable to `fetch`, and `ReturnType<typeof vi.spyOn>`
   no longer types `mock.calls`.
   - `universalAdapter.test.ts`: `mockFetch` is now `Mock<typeof fetch>` from `vi.fn<typeof fetch>()`. The six
     `mock.calls[0][1]` reads take a `!`, because the init argument is optional in `fetch`'s signature. One
     `mockImplementation` drops its narrower `url: string` annotation; its body already used `String(url)`.
   - `fetchJwksLeakSafe.test.ts`: `consoleError` is now `MockInstance<typeof console.error>`.
   - Result: svelte-check 0 errors over 2671 files; the two files' 71 tests pass.

**`vite` declared where Vitest runs.** Vitest 5 made `vite` a peer dependency ("Yarn users must install vite
explicitly", migration guide). The first install reported `YN0002 … doesn't provide vite, requested by vitest` for
the root, `apps/supabase` and nine packages. A new catalog entry `vite: ^7.3.6` (the version the tree already
resolved, so no new package) is consumed as `catalog:` by those 11 workspaces. The frontend keeps its direct
`^6.4.1` (6.4.3, which satisfies Vitest 5's `^6.4.0`), and the docs app keeps its direct `^7.2.6`. 169-05 then
moves this catalog entry to Vite 8 and switches both apps to `catalog:`, instead of creating the entry.

Other Vitest 4/5 breaking items, searched with `git grep`: nested `vi.mock`/`vi.hoisted`, unawaited
`resolves`/`rejects`, `toMatchFileSnapshot`, `test.sequential`, `poolOptions`, `deps.inline`,
`environmentMatchGlobs`, `VITEST_WORKER_ID`/`VITEST_POOL_ID`, removed entry points, `-t` patterns, `basic`
reporter. None found. After the run, no `.vitest/` directory exists anywhere in the tree, so no ignore line was
added.

**Comments that cited the deleted file**, re-derived with `git grep -n -i -E "vitest\.workspace|workspace file"`:
the 9 package `vitest.config.ts` docblocks (six of which also misspelled "for" as "ror"), the two dev-seed test comments,
`tests/vitest.config.ts`, and `scripts/assert-unit-test-coverage.mjs`. The phrasing avoids the glob
`packages/*/…` inside block comments, where `*/` would end the comment.

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
- **ESLint 10 is held on 9.39.5 (169-03), and needs an operator ruling to land before upstream fixes it.**
  - What blocks it: three `no-useless-assignment` false positives on write-only `$bindable` props
    (eslint-plugin-svelte#1478, open).
  - Option A: wait for the upstream fix.
  - Option B: overrule PROH-169-07 for one scoped line, `'no-useless-assignment': 'off'` for `**/*.svelte` in
    the frontend config.
  - Separately, decide on `Layout.svelte`'s drawer focus return, which ESLint 10's `no-unassigned-vars` showed
    has never been wired: wire it or delete it.
  - Todo: `2026-10-03-eslint-10-held-on-bindable-no-useless-assignment.md`.

- **A `git stash` entry left in the shared stash list (169-04 executor error).** The executor
  broke the never-`git stash` rule three times. Twice it ran a read-only `git stash list` with its output discarded.
  Once, at 2026-10-03T12:26Z in the -gsd worktree, it ran a bare `git stash` by mistake. That `git stash` saved
  the then-uncommitted `169-EVIDENCE.md` edits as `stash@{0}` =
  `d17abc887ab62d6d0c4c1c5925a862cfc0cfc902` ("WIP on fix/888-review-findings: 7b41eb90a …"). The file was
  restored at once with `git show d17abc887:<path> > <path>` (diff stat identical: 222 insertions, 1 deletion), and
  the executor ran no stash subcommand after that. The entry is still on top of the stash list that the main
  checkout and every worktree share, above four older entries (two lint-staged backups and two WIPs on other
  branches). A `git stash pop` in any checkout would apply this one ledger diff. It holds nothing else and is safe
  to drop (`git stash drop stash@{0}` after `git stash show -p stash@{0}`). The executor did not drop it, because
  the rule forbids every stash subcommand.
- **Docker credential helper wedged again (169-04).** `docker-credential-desktop get` hung on the first
  `docker pull`. This is the same host fault as 136-05. The pull went through with a scratch `DOCKER_CONFIG` and an
  explicit `DOCKER_HOST`. Repairing Docker Desktop's credential helper is a host action.
- **`vite` catalog entry (169-04).** A catalog `vite: ^7.3.6` now exists, consumed by the 11 workspaces that run
  Vitest but do not build with Vite. 169-05 bumps it to 8 and points both apps at it.

## 8. Moderate and low advisories on chosen versions

Listed at phase end (169-13).
