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

**169-06 Task 1 step 0 (before any change, 2026-10-03T13:19Z):** `docker builder prune -af`, then
`docker run --rm alpine df -k /` → **23 078 048 KiB available (22.01 GiB)** of 107 016 164 KiB. That is above the
15 GiB floor, so the task went ahead. The new CLI's service images then took about 5 GiB: the 169-06-cli E2E
preflight read 16.87 GiB.

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

### 169-05 (group 3) re-measurement, 2026-10-03

`node 169-version-probe.mjs --only <pkgs> --node 24.21.0`, one run per upgrade, each just before it:
`@sveltejs/kit,@sveltejs/adapter-node,@sveltejs/adapter-static,svelte` at 12:48:21Z (`05-t2-probe.md`);
`vite,@sveltejs/vite-plugin-svelte,@tailwindcss/vite,vite-plugin-devtools-json,@inlang/paraglide-js` after the Kit
commit (`05-t3-probe.md`). Logs under `tests/e2e-runs/169-gates/`.

| Package | Resolved before | Target (published, age) | Target line x.0.0 | Verdict / hold |
|---|---|---|---|---|
| `@sveltejs/kit` | 2.55.0 | **2.70.3** (2026-08-18, 45.9 d) | — | in-major; HOLD-30d 3.x (3.0.0 2026-10-01T17:22Z, clears 2026-10-31T17:22Z, 169-12's) |
| `@sveltejs/adapter-node` | 5.5.4 | **5.5.7** (2026-06-24, 100.6 d) | — | in-major; HOLD-30d 6.x (6.0.0 2026-10-01T17:24Z, clears 2026-10-31T17:24Z) |
| `@sveltejs/adapter-static` | 3.0.10 | **3.0.10** (already the newest 3.x, 365.9 d) | — | unchanged; HOLD-30d 4.x (4.0.0 2026-10-01T17:21Z, clears 2026-10-31T17:21Z) |
| `svelte` | 5.57.1 (catalog floor `^5.53.12`) | **5.57.1** (2026-09-18, 14.5 d) | — | current; floor raised to `^5.57.1` (Kit 3's peer) |
| `vite` | 6.4.3 (frontend) / 7.3.6 (docs, catalog) | **8.3.1** (2026-09-24, 9.0 d) | 8.0.0 2026-03-12 | major; HOLD-7d 8.3.2 (2026-10-01T10:17Z, 2.11 d); engines `^20.19.0 \|\| >=22.12.0` |
| `@sveltejs/vite-plugin-svelte` | 5.1.1 (frontend) / 6.2.4 (docs) | **7.3.1** (2026-09-23, 10.1 d) | 7.0.0 2026-02-23 | major; peer `vite ^8.0.0-beta.7 \|\| ^8.0.0`, `svelte ^5.46.4` |
| `@tailwindcss/vite` | 4.3.3 | 4.3.3 | — | current; peer `vite ^5.2.0 \|\| ^6 \|\| ^7 \|\| ^8` |
| `vite-plugin-devtools-json` (docs) | 1.1.0 | 1.1.0 | — | current; peer includes `^8.0.0` |
| `@inlang/paraglide-js` | 2.25.4 | 2.25.4 | — | current; peer `vite >=5.0.0` |

Every plugin in both configs admits Vite 8 at its resolved version, and so do Kit 2.70.3 (`vite … || ^8.0.0`,
`@sveltejs/vite-plugin-svelte … || ^7.0.0`, `typescript ^5.3.3 || ^6.0.0`) and Vitest 5.0.2 (`vite ^6.4.0 || ^7.0.0 ||
^8.0.0`). Nothing blocks Vite 8, so no D-06 hold applies.

### 169-06 (group 5, first half) re-measurement, 2026-10-03

`node 169-version-probe.mjs --only supabase --node 24.21.0` at 2026-10-03T13:20:07Z (`tests/e2e-runs/169-gates/06/t1-probe.md`):

| Package | Resolved before | Target (published, age) | Target line x.0.0 | Verdict / hold |
|---|---|---|---|---|
| `supabase` (CLI, catalog) | 2.83.0 (catalog `^2.78.1`) | **2.118.0** (2026-09-25, 8.0 d) | 2.0.0 2024-12-04 | in-major; HOLD-7d 2.119.0 (2026-09-30T21:36Z, 2.66 d) |

`npm view supabase@2.118.0`: dependencies `jose ^6.2.10`, `eciesjs ^0.5.0`; eight `optionalDependencies`
`@supabase/cli-{darwin-arm64,darwin-x64,linux-arm64,linux-arm64-musl,linux-x64,linux-x64-musl,windows-arm64,windows-x64}`
at exactly 2.118.0; no install script (`scripts` has no `preinstall`/`install`/`postinstall`); `bin` `dist/supabase.js`.
The GitHub release `v2.118.0` (2026-09-25T13:23Z) carries the `supabase_linux_amd64.tar.gz` asset that
`supabase/setup-cli@v1` downloads, so the six CI pins can move to the same version.

**Service images of the local stack.** Before (CLI 2.83.0, from `docker ps`, project containers only): postgres
15.8.1.085, postgrest v14.5, gotrue v2.187.0, storage-api v1.41.8, realtime v2.78.10, edge-runtime v1.71.0,
postgres-meta v0.96.1, studio 2026.03.04-sha-0043607, mailpit v1.22.3, logflare 1.34.7, vector 0.28.1-alpine,
kong 2.8.1, imgproxy v3.8.0.

After `yarn db:stop` → `yarn db:start` → `yarn db:reset` on CLI 2.118.0 (`06/t1-images.txt`, every name ending in
`_openvaa-local`):

| Service | Image |
|---|---|
| db | `public.ecr.aws/supabase/postgres:15.8.1.085` (unchanged: CLI 2.118.0 keeps it for major 15) |
| rest | `public.ecr.aws/supabase/postgrest:v16.3` |
| auth | `public.ecr.aws/supabase/gotrue:v2.197.0` |
| storage | `public.ecr.aws/supabase/storage-api:v1.77.0` |
| realtime | `public.ecr.aws/supabase/realtime:v2.135.3` |
| edge_runtime | `public.ecr.aws/supabase/edge-runtime:v1.76.2` |
| pg_meta (type generator) | `public.ecr.aws/supabase/postgres-meta:v0.99.0` |
| studio | `public.ecr.aws/supabase/studio:2026.09.14-sha-4dd8a95` |
| inbucket | `public.ecr.aws/supabase/mailpit:v1.30.2` |
| analytics | `public.ecr.aws/supabase/logflare:1.50.12` |
| vector | `public.ecr.aws/supabase/vector:0.53.0-alpine` |
| kong | `public.ecr.aws/supabase/kong:2.8.1` |
| imgproxy | `public.ecr.aws/supabase/imgproxy:v3.8.0` |

The CLI 2.118.0 binary pins `supabase/postgres:17.6.1.171` for major 17 (its embedded Dockerfile, `FROM
supabase/postgres:17.6.1.171 AS pg`). RESEARCH's `17.11.0.002` / `15.19.0.002` belong to 2.119.0, which is held.

**Image pull.** The CLI's own `docker pull`s hung in `docker-credential-desktop get` (the 169-04 host fault). The
first `yarn db:start` made no progress for 30 minutes and was stopped by the harness's background time limit; no
container had been created, and the stack was down in that window. The ten new images were then pulled with a scratch
`DOCKER_CONFIG` (`{}`) and `DOCKER_HOST=unix://$HOME/.docker/run/docker.sock`, plus `postgres:17.6.1.171` for Task 2
(`06/t1-prepull*.log`; four pulls hit ECR's `toomanyrequests` and went through on retry). The second `yarn db:start`,
with the same environment, exited 0 with every image already local.

**Postgres before and after the major switch (169-06 Task 2).** All values come from `psql
postgresql://postgres:postgres@127.0.0.1:54322/postgres` (`06/t2-pg15-*.txt`, `06/t2-pg17-*.txt`).

| | PG15 stack (CLI 2.118.0, before the switch) | PG17 stack (after the volume reset and `db:reset`) |
|---|---|---|
| `show server_version` | `15.8` | **`17.6`** (`PostgreSQL 17.6 on aarch64-unknown-linux-gnu`) |
| db image | `postgres:15.8.1.085` | `postgres:17.6.1.171` |
| installed extensions | pg_graphql 1.5.11, pg_net 0.14.0, pg_stat_statements 1.10, pgcrypto 1.3, pgjwt 0.2.0, plpgsql 1.0, supabase_vault 0.3.1, uuid-ossp 1.1 | pg_net **0.20.4**, pg_stat_statements 1.11, pgcrypto 1.3, plpgsql 1.0, supabase_vault 0.3.1, uuid-ossp 1.1 |
| available: pgtap / plpgsql_check / pgjwt / pg_graphql | 1.2.0 / 2.7 / 0.2.0 (installed) / 1.5.11 (installed) | **1.3.3 / 2.8** / 0.2.0 (not installed) / 1.6.1 (not installed) |

`pgtap` and `plpgsql_check` are created on demand by `supabase test db` (`00-helpers.test.sql`) and `supabase db lint`,
so neither is installed after a reset on either major. The schema never names `pgjwt` (`git grep -i pgjwt
apps/supabase/supabase` → nothing). On PG17 the base image no longer pre-installs it or `pg_graphql`.
`graphql_public.graphql` still exists, and `database.ts` did not change. `apps/supabase/supabase/.temp/` holds
`cli-latest` and `start-secrets` only; there is no `postgres-version`, so nothing overrides the image (RESEARCH
Pitfall 11).

### 169-07 (group 5, second half) re-measurement, 2026-10-03

`node 169-version-probe.mjs --only @supabase/supabase-js,@supabase/ssr,jose --node 24.21.0` at 2026-10-03T14:26:32Z
(`tests/e2e-runs/169-gates/07/t1-probe.md`):

| Package | Resolved before | Target (published, age) | Target line x.0.0 | Verdict / hold |
|---|---|---|---|---|
| `@supabase/supabase-js` | 2.99.3 (catalog `^2.49.4`, root direct `^2.99.3`) | **2.117.2** (2026-09-25, 8.2 d) | 2.0.0 2022-10-11 | in-major; meets ssr 0.12's `^2.114.0` peer |
| `@supabase/ssr` | 0.9.0 (catalog `^0.9.0`) | **0.12.7** (2026-09-08, 25.3 d) | 0.12.0 2026-06-09 (116 d) | major (a 0.x minor), both rules met |
| `jose` | 6.2.12 | 6.2.12 (2026-09-05, 28.2 d) | 6.0.0 2025-02-22 | current. This is the version the Deno `npm:jose@` pin takes |

`nodemailer` is not an npm dependency, so the probe does not cover it. It was measured with `npm view nodemailer time`
at 2026-10-03T14:27Z:
- The newest 10.x is 10.0.14 (0.03 d old).
- 10.0.11 is 6.27 d old and clears the 7-day rule at 2026-10-04T07:50:47Z.
- 10.0.10 (19.06 d) is the newest 10.x at least 7 days old.
- The line start, **10.0.0, is 29.28 d old** (published 2026-09-04T07:45:32Z) and clears the 30-day new-major rule at
  2026-10-04T07:45:32Z.

So no 10.x version can be taken on the execution date, and every older line carries an open high advisory (§ 2).
Per PROH-169-16 the nodemailer pin waits (§ 3).

### 169-08 (group 6) re-measurement, 2026-10-03

`node 169-version-probe.mjs --only @faker-js/faker --node 24.21.0` at 2026-10-03T15:55:51Z:

| Package | Resolved before | Target (published, age) | Target line x.0.0 | Verdict / hold |
|---|---|---|---|---|
| `@faker-js/faker` | 8.4.1 (catalog `^8.4.1`; root and `@openvaa/dev-seed` on `catalog:`) | **10.6.0** (2026-08-14, 50.0 d) | 10.0.0 2025-08-24 | major; both rules met. `engines.node` `^20.19.0 \|\| ^22.13.0 \|\| ^23.5.0 \|\| >=24.0.0` admits 24.21.0. No faker release is under 7 days old |

### 169-09 (group 7) re-measurement, 2026-10-03

`node 169-version-probe.mjs --only ai,@ai-sdk/google,@ai-sdk/openai` at 2026-10-03T16:17:57Z. The probe picks the
newest release at least 7 days old; each pick's `@ai-sdk/provider` pin was then read with `npm view <pkg>@<v>
dependencies`, and the ages of the exact transitive pins were measured from `npm view <pkg> time`:

| Package | Resolved before | Target (published, age) | Target line x.0.0 | Verdict / hold |
|---|---|---|---|---|
| `ai` | 5.0.60 (`^5.0.0`) | **7.0.116** (2026-09-25T20:41Z, 7.82 d) | 7.0.0 2026-06-25 | major; both rules met. `engines.node >=22`, ESM-only. 7.0.117–7.0.127 are inside the 7-day window (HOLD-7d) |
| `@ai-sdk/google` | 2.0.23 (`^2.0.20`) | **4.0.82** (2026-09-25T20:40Z, 7.82 d) | 4.0.0 2026-06-25 | major; both rules met. 4.0.83–4.0.87 inside the window |
| `@ai-sdk/openai` | 2.0.42 (`^2.0.31`) | **4.0.78** (2026-09-26T02:01Z, 7.60 d) | 4.0.0 2026-06-25 | major; both rules met. 4.0.79–4.0.83 inside the window |

The three picks pin the same core: `@ai-sdk/provider` **4.0.18** (10.32 d) and `@ai-sdk/provider-utils` **5.0.49**
(7.82 d); `ai` also pins `@ai-sdk/gateway` **4.0.94** (7.82 d), which pins `@vercel/oidc` 3.2.0 (234.6 d).
`provider-utils` 5.0.49 adds `@workflow/serde` 4.1.0 (178.7 d). Every version taken is at least 7 days old, and the
majors match (ai 7 with provider 4), so nothing in group 7 is held. `openai` is removed rather than bumped (orchestrator
ruling 2): `git grep` finds no `from 'openai'`, `require('openai')` or `import('openai')` outside `.planning`.
`jsonrepair` was already gone from `packages/llm/package.json` (nothing to remove).

### 169-10 (group 8) re-measurement, 2026-10-03

`node 169-version-probe.mjs --node 24.21.0 --out tests/e2e-runs/169-gates/10/t0-probe.md` (the whole tree, so the
completeness sweep reads the same table) at 2026-10-03T16:45:55Z, exit 0: 69 distinct registry packages; verdicts
HOLD-30d 5 · HOLD-7d 12 · current 42 · major 10; **no `UNASSIGNED-MAJOR` row**. The group-8 rows:

| Package | Resolved before | Target (published, age) | Target line x.0.0 | Verdict / hold |
|---|---|---|---|---|
| `concurrently` | 9.2.4 (`^9.0.0`, root) | **10.0.5** (2026-08-15, 49.6 d) | 10.0.0 2026-05-28 | major; both rules met. `engines.node >=22` |
| `lint-staged` | 16.4.0 (`^16.4.0`, root) | **17.6.0** (2026-09-26, 7.4 d) | 17.0.0 2026-05-06 | major; both rules met. `engines.node >=22.22.1` admits 24.21.0 |
| `@changesets/cli` | 2.31.1 (`^2.30.0`, root) | **3.0.3** (2026-09-14, 19.1 d) | 3.0.0 2026-08-11 | major; both rules met. `engines.node ^22.11 \|\| ^24 \|\| >=26` |
| `@changesets/changelog-github` | 0.6.0 (`^0.6.0`, root) | **1.0.1** (2026-09-04, 29.4 d) | 1.0.0 2026-08-11 | major; both rules met |
| `glob` | 11.1.0 (`^11.0.0`, root and `apps/docs`) | **13.0.6** (2026-02-19, 226.0 d) | 13.0.0 2025-11-19 | major; both rules met |
| `@types/cheerio` | 0.22.35 (root) | 1.0.0 (deprecated stub) | — | **removed**, not bumped (D-23) |
| `dotenv` | 17.4.2 (catalog `^17.3.1`, root) | 17.4.2 (2026-04-12, 174.0 d), the newest 17.x | 18.0.0 **2026-09-17T21:18:40Z** (16.8 d) | **HOLD-30d**: 18.x clears 2026-10-17T21:18Z (§ 3) |
| `js-yaml` | 4.3.2 (catalog `^4.1.0`, `packages/llm`) | **5.4.2** (2026-09-13, 20.7 d) | 5.0.0 2026-06-20 | major; both rules met. Ships its own types (`dist/js-yaml.d.ts`) |
| `intl-messageformat` | 11.2.15 (`^11.1.3`, `apps/frontend`) | 11.2.15 (2026-09-12, 21.0 d), the newest 11.x | 12.0.0 **2026-09-15T12:27Z** (18.2 d) | **HOLD-30d**: 12.x clears 2026-10-15T12:27Z (§ 3) |
| `globals` | 15.15.0 (catalog `^15.14.0`, `apps/frontend`) | **17.12.0** (2026-09-01, 32.2 d) | 17.0.0 2026-01-01 | major; both rules met. 17.13.0 (2026-10-01, 2.5 d) is inside the 7-day window (HOLD-7d) |

The other two `major` rows are not group 8's: `@types/node` 26 and `typescript` 7 (G1, held in § 3 with their
reasons). The three HOLD-30d rows outside group 8 are Kit 3 / `adapter-node` 6 / `adapter-static` 4 (169-12, clear
2026-10-31T17:2xZ). Nothing in this group was taken from the youngest-releases list.

### 169-11 (group 9) re-measurement, 2026-10-03

The version probe reads manifests only, so the Actions were measured from the GitHub releases API at
2026-10-03T17:09:32Z (`gh api repos/<owner>/<repo>/releases`, non-draft, non-prerelease;
`tests/e2e-runs/169-gates/11/t0-action-releases.tsv`). Each major tag was then resolved to its commit
(`gh api repos/<owner>/<repo>/commits/<tag>`): every floating major tag points at the same commit as the newest
release of that major, so `@vN` runs exactly the release measured below. The inputs of every target were read from
its `action.yml` at that tag (`11/t0-action-inputs.txt`).

| Action | Pinned before | Target (newest release, published, age) | Target line x.0.0 (published, age) | Verdict |
|---|---|---|---|---|
| `actions/checkout` | `@v4` (17 steps, six workflows) | **v7** = v7.0.1 (2026-07-20, 75.1 d) | v7.0.0 2026-06-18 (107.1 d) | major; both rules met |
| `actions/setup-node` | `@v4` (11) | **v7** = v7.0.0 (2026-07-14, 81.6 d) | same | major; both rules met |
| `actions/upload-artifact` | `@v4` (2) | **v7** = v7.0.1 (2026-04-10, 176.0 d) | v7.0.0 2026-02-26 (219.0 d) | major; both rules met |
| `dorny/paths-filter` | `@v3` (1) | **v4** = v4.0.3 (2026-08-05, 59.2 d) | v4.0.0 2026-03-12 (204.8 d) | major; both rules met |
| `supabase/setup-cli` | `@v1` (6) | **v3** = v3.0.1 (2026-09-24, 9.5 d) | v3.0.0 2026-07-07 (88.2 d) | major; both rules met |
| `changesets/action` | `@v1` (1, `release.yml`) | **v2** = v2.1.2 (2026-09-07, 26.2 d) | v2.0.0 2026-08-11 (53.2 d) | major; both rules met |
| `actions/configure-pages` | `@v4` (1, `docs.yml`) | **v6** = v6.0.0 (2026-03-25, 192.0 d) | same | major; both rules met |
| `actions/upload-pages-artifact` | `@v3` (1) | **v5** = v5.0.0 (2026-04-10, 175.9 d) | same | major; both rules met |
| `actions/deploy-pages` | `@v4` (1) | **v5** = v5.0.1 (2026-09-01, 31.8 d) | v5.0.0 2026-03-25 (192.0 d) | major; both rules met |
| `trufflesecurity/trufflehog` | `@v3.97.2` + `version: "3.97.2"` | **3.97.9** (2026-09-24, 9.3 d), the newest 3.x | — (patch) | patch; 7-day rule met |
| `threeal/setup-yarn-action` | `@v2` (9) | v2.0.0 is the newest release | — | current; untouched |
| `anthropics/claude-code-action` | `@v1` (3) | v1.0.240 is the newest; still major 1 | — | current; untouched |

Nothing was held. No workflow is triggered by `pull_request_target` or `workflow_run` (`git grep` over the six
`on:` blocks), so checkout v7's new block on checking out fork-PR code in those two events (actions/checkout#2454)
changes nothing here; the `claude.yml` events (`issue_comment`, `pull_request_review*`, `issues`) check out the
default ref as before.

### 169-12 (group 10) re-measurement, 2026-10-03 — Kit 3 verdict: **HOLD-AGE**

Measured live at 2026-10-03T18:49:51Z. The age clock comes from `npm view <pkg> time --json`. The peers come from
`npm view @sveltejs/kit@3.0.0 peerDependencies peerDependenciesMeta engines --json`. Each peer was compared with its
`yarn.lock` resolution, using the hoisted `semver` 7.8.5 (`satisfies(v, range, { includePrerelease: true })`).
Verdict file: `tests/e2e-runs/169-gates/12-kit3-verdict.json` (gitignored).

| Package | Held at | x.0.0 published (age) | Clears (x.0.0 + 30 d) | Releases in the major | Target (≥ 7 d) | Age OK |
|---|---|---|---|---|---|---|
| `@sveltejs/kit` | 2.70.3 | 3.0.0, 2026-10-01T17:22:34.593Z (2.06 d) | **2026-10-31T17:22:34Z** | 3.0.0 only (`latest`; `next` 3.0.0-next.32) | none | no |
| `@sveltejs/adapter-node` | 5.5.7 | 6.0.0, 2026-10-01T17:24:31.997Z (2.06 d) | **2026-10-31T17:24:31Z** | 6.0.0 only | none | no |
| `@sveltejs/adapter-static` | 3.0.10 | 4.0.0, 2026-10-01T17:21:55.874Z (2.06 d) | **2026-10-31T17:21:55Z** | 4.0.0 only | none | no |

No 3.x / 6.x / 4.x release is 7 days old yet, so the peers were measured against 3.0.0, the only 3.x:

| Kit 3.0.0 peer | Range | Resolved in the tree | OK |
|---|---|---|---|
| `vite` | `^8.0.12` | 8.3.1 | yes |
| `@sveltejs/vite-plugin-svelte` | `^7.0.0` | 7.3.1 | yes |
| `svelte` | `^5.57.1` | 5.57.1 | yes |
| `typescript` (optional) | `^6.0.0` | 6.0.3 | yes |
| `@opentelemetry/api` (optional) | `^1.0.0` | not installed | yes (optional, absent) |
| `engines.node` | `>=22.17` | declared `>=24.15.0` (floor 24.15.0, a subset of the range); CI pin 24.21.0 | yes |

The peers are ready. All of them landed under Kit 2.70: TypeScript 6 and Node 24 in 169-02, Vite 8 and
vite-plugin-svelte 7 in 169-05. A Kit-3-only commit is possible, but the age rule blocks it. Kit 3 was not
installed, and neither its migrator nor `sv` was run (PROH-169-22). `yarn why @sveltejs/kit` shows only
`2.70.3`, in both apps (`tests/e2e-runs/169-gates/12-kit-why.txt`). The adapters are still on
`adapter-node` 5.5.7 and `adapter-static` 3.0.10. Task 2, the operator checkpoint, is skipped because the verdict
is not `CLEARS`. Task 3's land branch is skipped for the same reason. The hold is in § 3. Todo:
`2026-10-03-sveltekit-3-held-by-the-age-rule.md`.

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

### 169-05 (group 3)

New lockfile names per upgrade (`tests/e2e-runs/169-gates/05/t*-new-names.txt`), each run through
`gsd-tools query package-legitimacy check --ecosystem npm` (`t2-legit.json`, `t3-legit.json`). Install ran under
`npmMinimalAgeGate: 7d`; no new name declares an install script (`postinstall: null` for all).

| Upgrade | New name | Verdict | Reasons | Weekly downloads | Repository | Resolved (published, age) |
|---|---|---|---|---|---|---|
| `vite-plugin-restart` removal | — (removed: `vite-plugin-restart`) | | | | | |
| Svelte floor | — (descriptor only) | | | | | 5.57.1 unchanged |
| Kit 2.70.3 + adapter-node 5.5.7 | `@rollup/plugin-replace` | OK | — | 17207858 | github.com/rollup/plugins | 6.0.3 (2025-10-29); a dependency of adapter-node 5.5.7 |
| Vite 8.3.1 + vite-plugin-svelte 7.3.1 | `rolldown` | SUS | too-new (its `latest`) | 124979918 | github.com/rolldown/rolldown | 1.2.11 (2026-09-24, 8.9 d) |
| | `@rolldown/binding-*` (15 platform packages: android-arm-eabi, android-arm64, darwin-arm64, darwin-x64, freebsd-x64, linux-arm-gnueabihf, linux-arm64-gnu, linux-arm64-musl, linux-ppc64-gnu, linux-s390x-gnu, linux-x64-gnu, linux-x64-musl, openharmony-arm64, win32-arm64-msvc, win32-x64-msvc) | SUS ×15 | too-new | 0.9 M – 107 M each | github.com/rolldown/rolldown | 1.2.11 (darwin-arm64 2026-09-24T13:54Z, 9.0 d) |
| | `@oxc-project/types` | SUS | too-new | 195151104 | github.com/oxc-project/oxc | 0.151.0 (2026-09-21, 12.0 d) |
| | `@rolldown/pluginutils` | OK | — | 200034410 | github.com/rolldown/plugins | 1.0.1 (2026-05-13, 143.4 d) |

Every `SUS` is `too-new` on an established package; the check reads the package's newest publish, not the version
resolved. No `SLOP`; no new direct package (`vite` and `@sveltejs/vite-plugin-svelte` were already direct in both
apps). Other new versions of names already in the lockfile: `vite` 8.3.1 (9.0 d), `@sveltejs/vite-plugin-svelte`
7.3.1 (10.1 d), `lightningcss` 1.33.0 and its platform packages (2026-07-20, 75.3 d; Vite 8 depends on it,
Tailwind keeps its exact 1.32.0). Removed by the Vite move: `@sveltejs/vite-plugin-svelte-inspector` (now inside
vite-plugin-svelte 7) and esbuild 0.25.12's platform packages that Vite 6/7 pulled in.

### 169-06 (group 5, first half)

Box B (Supabase CLI platform packages) was re-read before the install: `[x]` (the plan's precondition, met). New
lockfile names from `yarn up -R supabase` (`tests/e2e-runs/169-gates/06/t1-new-names.txt`, key diff
`t1-lock-keys-{before,after}.txt`), checked with `gsd-tools query package-legitimacy check --ecosystem npm`
(`06/t1-legit.json`). Install ran under `npmMinimalAgeGate: 7d`. The check ran right after `yarn up`, not before it.
`yarn up` is what yields the new-name list, so the check came before the commit and before anything executed the new
packages.

| New name | Verdict | Reasons | Weekly downloads | Repository | Resolved (published) | postinstall |
|---|---|---|---|---|---|---|
| `@supabase/cli-darwin-arm64` | SUS | too-new | 197 164 | github.com/supabase/cli | 2.118.0 (2026-09-25) | none |
| `@supabase/cli-darwin-x64` | SUS | too-new | 74 549 | github.com/supabase/cli | 2.118.0 | none |
| `@supabase/cli-linux-arm64` | SUS | too-new | 132 642 | github.com/supabase/cli | 2.118.0 | none |
| `@supabase/cli-linux-arm64-musl` | SUS | too-new | 92 969 | github.com/supabase/cli | 2.118.0 | none |
| `@supabase/cli-linux-x64` | SUS | too-new | 4 434 591 | github.com/supabase/cli | 2.118.0 | none |
| `@supabase/cli-linux-x64-musl` | SUS | too-new | 1 746 652 | github.com/supabase/cli | 2.118.0 | none |
| `@supabase/cli-windows-arm64` | SUS | too-new | 65 491 | github.com/supabase/cli | 2.118.0 | none |
| `@supabase/cli-windows-x64` | SUS | too-new | 227 566 | github.com/supabase/cli | 2.118.0 | none |
| `eciesjs` | OK | — | 13 191 197 | github.com/ecies/js | 0.5.0 (2026-04-03) | none |
| `@ecies/ciphers` | OK | — | 12 955 131 | github.com/ecies/js-ciphers | 0.2.6 (2026-03-31) | none |
| `@noble/ciphers` | OK | — | 40 963 067 | github.com/paulmillr/noble-ciphers | 1.3.0 (2025-04-24) | none |
| `@noble/curves` | OK | — | 38 335 008 | github.com/paulmillr/noble-curves | 1.9.7 (2025-08-15) | none |
| `@noble/hashes` | OK | — | 109 155 238 | github.com/paulmillr/noble-hashes | 1.8.0 (2025-04-21) | none |

Every `SUS` is `too-new`, read from the package's newest publish (2.119.0, 2026-09-30), on the official
per-platform packages that box B approves. No `SLOP`; no new direct package. `jose` keeps its single resolution 6.2.12
(the new `^6.2.10` descriptor merged into the existing entry). Removed with the old CLI's downloader:
`bin-links`, `cmd-shim`, `read-cmd-shim`, `npm-normalize-package-bin`, `proc-log`, `write-file-atomic` 7,
`https-proxy-agent` 7 / `agent-base` 7, `node-fetch` 3 (+ `fetch-blob`, `formdata-polyfill`, `data-uri-to-buffer`,
`web-streams-polyfill`) and **`tar` 7.5.11**. With that, the accepted `tar` rows 1123940 / 1123941 / 1145647 (via
`supabase@2.83.0`) left the findings. The lockfile diff is confined to `supabase`'s subtree, plus the two descriptor
merges that removal causes (`debug@npm:4`, `node-domexception@npm:^1.0.0` dropped from shared entries; same versions).

### 169-07 (group 5, second half)

**npm side.** The new lockfile names were computed from a key snapshot taken before and after each install
(`tests/e2e-runs/169-gates/07/t{1,2}-names-{before,after}.txt`), and checked with `gsd-tools query
package-legitimacy check --ecosystem npm` (`07/t1-legit.json`). Both installs ran under `npmMinimalAgeGate: 7d`.

| Install | New name | Verdict | Reasons | Weekly downloads | Repository | Resolved (published) | postinstall |
|---|---|---|---|---|---|---|---|
| supabase-js 2.117.2 | `@supabase/phoenix` | OK | — | 23 116 330 | github.com/supabase/phoenix | 0.4.5 (2026-07-15) | none |
| ssr 0.12.7 | (none) | — | — | — | — | — | — |

- supabase-js 2.117.2 replaces the 2.99.3 family (`auth-js`, `functions-js`, `postgrest-js`, `realtime-js`,
  `storage-js`, all at 2.117.2) and adds `@supabase/phoenix` 0.4.5, which realtime-js now uses.
- It drops `@types/phoenix` and `@types/ws`, and the `ws@npm:^8.18.2` descriptor (it merges into `ws@npm:^8.21.3`).
- ssr 0.12.7 changes only its own entry. Its single dependency, `cookie ^1.0.2`, already resolves to 1.1.1.
- Neither is a new direct package. There is no `SLOP` and no `SUS`.

**Deno side (D-09, D-05).** The GitHub advisory database was queried on 2026-10-03 for each exact pin
(`07/t3-adv-*.tsv`):

| Query | High / critical | All advisories |
|---|---|---|
| `gh api "/advisories?ecosystem=npm&affects=@supabase/supabase-js@2.117.2"` | 0 | 0 |
| `gh api "/advisories?ecosystem=npm&affects=jose@6.2.12"` | 0 | 0 |
| `gh api "/advisories?ecosystem=npm&affects=nodemailer@10.0.11"` (the target once the hold clears; not taken) | 0 | 0 |
| `gh api "/advisories?ecosystem=npm&affects=nodemailer@6.9.10"` (still pinned, unchanged) | 6 high (GHSA-p6gq-j5cr-w38f, GHSA-2x7j-588g-ccc2, GHSA-v53p-9fqp-m79j, GHSA-rcmh-qjqh-p98v, and the duplicates GHSA-h3hj-cmcx-xc66 and GHSA-jj37-3377-m6vv) | 17 |

Older lines are no way out. `nodemailer@9.1.1` and `nodemailer@6.10.1` both still match GHSA-v53p-9fqp-m79j
(`<= 10.0.5`, first patched in 10.0.6), and each carries other highs too.

### 169-08 (group 6)

- `@faker-js/faker` is not a new lockfile name, and 10.6.0 has no dependencies, so the install added no name to
  `yarn.lock`. The lockfile diff is the one `@faker-js/faker@npm:^10.6.0` entry (4 insertions, 4 deletions).
  Installed under `npmMinimalAgeGate: 7d`. RESEARCH § Package Legitimacy Audit lists it as approved (official repo).
- `gh api "/advisories?ecosystem=npm&affects=@faker-js/faker@10.6.0"` on 2026-10-03: **0** advisories of any
  severity. 8.4.1 carried GHSA-qxc2-j82w-r537 (high, `helpers.fake` code execution), the accepted baseline row 1158500.

### 169-09 (group 7)

- **One name new to `yarn.lock`: `@workflow/serde` 4.1.0** (a dependency of `@ai-sdk/provider-utils` 5.0.49).
  `package-legitimacy check` → `SUS`, reason `too-new` only (that is the package's newest release, 2026-09-30; the
  version taken is 4.1.0 from 2026-04-07). 21.07M weekly downloads, repository `github.com/vercel/workflow`, no
  postinstall, not deprecated, published by Vercel maintainers. Under the 169-01 conventions a `too-new`-only `SUS`
  on an established package does not stop the plan.
- `ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/gateway`, `@ai-sdk/provider`, `@ai-sdk/provider-utils`: all
  already in the lockfile; `package-legitimacy check` → `SUS`, `too-new` only (33.7M / 10.7M / 17.3M / 32.0M / 75.2M /
  53.1M weekly downloads, repository `github.com/vercel/ai`, no postinstall).
- Names that left the lockfile with the old SDK: `@opentelemetry/api`, `@vercel/cli-config`, `@vercel/cli-exec`,
  `os-paths`, `xdg-app-paths`, `xdg-portable` (plus `jose` 5.10.0, `zod` 4.1.11 and the `execa` 5.1.1 alias). Note
  `@vercel/oidc` moves *down* from 3.8.9 to 3.2.0, because `@ai-sdk/gateway` 4.0.94 pins it exactly.
- Removing `openai` 4 took 20 more names out: `@types/node-fetch`, `@types/node` 18.19.130, `abort-controller`,
  `agentkeepalive`, `asynckit`, `combined-stream`, `delayed-stream`, `es-set-tostringtag`, `event-target-shim`,
  `form-data-encoder`, `form-data`, `formdata-node`, `has-tostringtag`, `humanize-ms`, `mime-db`, `mime-types`,
  `node-domexception`, `openai`, `undici-types` 5.26.x, `web-streams-polyfill` 4.0.0-beta.3.
- **The 169-01 key check: `undici` 5 / `@fastify/busboy` do not come back.** `@ai-sdk/provider-utils` 5.0.49 depends
  on `undici ^7.29.0`, which resolves to the `undici` 7.30.0 already in the tree (cheerio). After the bump `yarn why
  undici` lists only 7.30.0 (provider-utils, cheerio) and 8.11.2 (jsdom, node-gyp); `yarn why @fastify/busboy` prints
  nothing, and `grep -c '@fastify/busboy' yarn.lock` is 0. `yarn audit:deps` right after the install: `0 new
  advisory(ies) at high+, 1 accepted` (`braces`). No override, no baseline row.
- `gh api "/advisories?ecosystem=npm&affects=<pkg>@<v>"` on 2026-10-03: **0** advisories of any severity for
  `ai@7.0.116`, `@ai-sdk/google@4.0.82`, `@ai-sdk/openai@4.0.78`, `@ai-sdk/provider-utils@5.0.49`,
  `@ai-sdk/gateway@4.0.94`, `@ai-sdk/provider@4.0.18`, `@workflow/serde@4.1.0`, `@vercel/oidc@3.2.0`, `undici@7.30.0`.
- Installed under `npmMinimalAgeGate: 7d` with the caret ranges `^7.0.116` / `^4.0.82` / `^4.0.78`; the gate resolved
  each to the measured target. No codemod was run (`@ai-sdk/codemod` was not fetched).

### 169-10 (group 8)

- Every direct package moved here was already in `yarn.lock` and is in the § 2 table above (`concurrently` and `glob`
  OK; `lint-staged`, the changesets pair, `globals` and `js-yaml` `SUS` for `too-new` only). No direct package is
  new to the repository, so no box in `169-LEGITIMACY-APPROVALS.md` was needed.
- Names new to `yarn.lock` all come from the changesets pair; `concurrently`, `lint-staged`, `glob`, `js-yaml`,
  `globals` and the `@types/cheerio` removal added none. `package-legitimacy check --ecosystem npm`, 2026-10-03
  (`tests/e2e-runs/169-gates/10/t2-cs-legit.json`):

| Package (version taken) | Verdict | Reasons | Weekly downloads | Repository | Postinstall | Deprecated |
|---|---|---|---|---|---|---|
| `@changesets/format` (0.1.2) | OK | — | 1718836 | git+https://github.com/changesets/format.git | — | no |
| `@clack/core` (1.5.1) | SUS | too-new | 31520911 | git+https://github.com/bombshell-dev/clack.git | — | no |
| `@clack/prompts` (1.8.1) | SUS | too-new | 31525886 | git+https://github.com/bombshell-dev/clack.git | — | no |
| `@manypkg/tools` (2.1.2) | OK | — | 3010335 | git+https://github.com/Thinkmill/manypkg.git | — | no |
| `@pnpm/deps.graph-sequencer` (1100.0.1) | OK | — | 1739629 | https://github.com/pnpm/pnpm/tree/main/pnpm11/deps/graph-sequencer | — | no |
| `fast-string-truncated-width` (3.0.3) | OK | — | 44314373 | git+https://github.com/fabiospampinato/fast-string-truncated-width.git | — | no |
| `fast-string-width` (3.0.2) | OK | — | 44270355 | git+https://github.com/fabiospampinato/fast-string-width.git | — | no |
| `fast-wrap-ansi` (0.2.2) | OK | — | 45154982 | git+https://github.com/43081j/fast-wrap-ansi.git | — | no |
| `import-meta-resolve` (4.2.0) | OK | — | 39722083 | git+https://github.com/wooorm/import-meta-resolve.git | — | no |
| `jju` (1.4.0) | OK | — | 15496672 | git://github.com/rlidwka/jju | — | no |
| `jsonc-parser` (3.3.1) | OK | — | 85194487 | git+https://github.com/microsoft/node-jsonc-parser.git | — | no |
| `launch-editor` (2.14.1) | OK | — | 37842317 | git+https://github.com/vitejs/launch-editor.git | — | no |
| `sisteransi` (1.0.5) | OK | — | 87964662 | git+https://github.com/terkelg/sisteransi.git | — | no |

  No `SLOP`. The two `SUS` rows are `too-new` only, on established packages: the `@clack` packages' newest release is
  from 2026-09-13, and the versions taken passed `npmMinimalAgeGate: 7d`. No new name runs an install script.
- `gh api "/advisories?ecosystem=npm&affects=<pkg>@<v>"` on 2026-10-03: **0** advisories of any severity for
  `concurrently@10.0.5`, `lint-staged@17.6.0`, `@changesets/cli@3.0.3`, `@changesets/changelog-github@1.0.1`,
  `@changesets/config@4.0.1`, `glob@13.0.6`, `js-yaml@5.4.2`, `globals@17.12.0`, `@clack/prompts@1.8.1`,
  `@clack/core@1.5.1` and `yargs@18.0.0`, and for the held `dotenv@17.4.2` and `intl-messageformat@11.2.15`.
- **The `braces` path is gone.** `@changesets/cli` 3 globs with `picomatch` instead of `micromatch`. The changesets
  commit (`40a426cb1`) therefore took `micromatch` 4.0.8, `braces` 3.0.3, `fill-range`, `to-regex-range` and
  `is-number` out of the tree. Right after that install, `yarn why braces` and `yarn why micromatch` print nothing.
  `yarn audit:deps` says `Summary: 0 new advisory(ies) at high+, 0 accepted` and lists **1240992** (`braces`) among
  the accepted ids that no longer appear. `security/audit-baseline.json` was **not** edited; 169-13 reconciles it
  (§ 7).

## 3. Holds

| Package | Held at | Newer line | Reason | Decision ref | Re-check date or trigger |
|---|---|---|---|---|---|
| `ai`, `@ai-sdk/google`, `@ai-sdk/openai` (+ their exact pins `@ai-sdk/gateway`, `@ai-sdk/provider`, `@ai-sdk/provider-utils`) | pre-phase resolutions: `ai` 5.0.60, `@ai-sdk/google` 2.0.23, `@ai-sdk/openai` 2.0.42, gateway 1.0.33, provider 2.0.0, provider-utils 3.0.10 / 3.0.12 | in-range `ai` 5.0.267, google 2.0.99, openai 2.0.130 (→ provider-utils 3.0.39) | **Narrowed out of the group-0 refresh.** `@ai-sdk/provider-utils` ≥ 3.0.35 (2026-08-26) depends on `undici ^5.29.0`; the in-range refresh pulled `undici` 5.29.0 and `@fastify/busboy` 2.1.1 back into the tree, adding NEW high 1240982 (`@fastify/busboy` <3.2.1, no in-range fix under `undici` 5's `^2.0.0`) and re-attaching accepted `undici` rows 1114638 / 1114640 / 1121245 to a new dependent. Moved into the excluded set per 169-01 Task 3 step 6; the family's majors are 169-09's | D-07, D-21, D-25 (G7) | **RELEASED 2026-10-03 by 169-09** (`0bf2782a7`): `ai` 7.0.116, `@ai-sdk/google` 4.0.82, `@ai-sdk/openai` 4.0.78 on provider 4.0.18 / provider-utils 5.0.49, which depend on `undici ^7.29.0`; `undici` 5 and `@fastify/busboy` stay out of the tree (§ 2, 169-09) |
| `braces` | 3.0.3 | none published | No fixed version exists (GHSA-vfj7-8cjw-p6xm covers `<=3.0.3`; 3.0.3 is the latest). Accepted in the baseline with a rationale (§ 7) | D-02 (baseline keeps no-fix rows), D-05 | when `braces` publishes a fix; or once `@changesets/cli` 2's `micromatch` path (169-10) is gone, the row goes stale. `vite-plugin-restart` left the tree in 169-05 (`f88e60568`), and the baseline rationale now names only the `@changesets/cli` path. **Path GONE 2026-10-03 (169-10, `40a426cb1`):** `@changesets/cli` 3 uses `picomatch`, so `micromatch` and `braces` left the tree; `yarn why braces` prints nothing and the audit lists 1240992 as no longer appearing (`0 accepted`). The baseline row is now stale; 169-13 drops it in the reviewed rewrite (the baseline file was not edited here) |
| `@types/node` | **24.19.0** (catalog `^24.19.0`; 169-02, `968113336`) | 26.6.3 / 26.6.4 (`latest`), 25.x; 24.19.1 (1.4 d old on 2026-10-03) | **Types track the runtime major** (Node 24 at every pin site). 24.19.1 is inside the 7-day window | D-11, R3, D-03 | when the runtime moves to a newer major; 24.19.1 clears 2026-10-08T22:38Z |
| `typescript` | **6.0.3** (catalog `^6.0.3`; 169-02, `ebeaafa5c`) | 7.0.2 (2026-07-08, x.0.0 86.7 d old — the age rule alone would admit it) | Blocking peers measured 2026-10-03: `@typescript-eslint/eslint-plugin` / `@typescript-eslint/parser` / `typescript-eslint` 8.70.1 `typescript: >=4.8.4 <6.1.0` (8.71.0, the newest, is inside the 7-day window); `svelte-check` 4.7.6 `^5.0.0 \|\| ^6.0.0`; `@sveltejs/kit@3` `typescript: ^6.0.0`. 6.0.3 is the newest 6.x (6.0.0 was never published) | D-16 | typescript-eslint and svelte-check admit 7 (and Kit 3's peer, once Kit 3 lands) |
| `eslint`, `@eslint/js` | ~~9.39.5~~ **RELEASED 2026-10-03 → 10.11.0 / 10.0.1** (`34ce0d51c`, operator ruling) | 10.12.0 (2026-10-02T20:08Z, 0.81 d old on 2026-10-03T15:30Z) | **Hold released by operator ruling 2026-10-03.** ESLint 10 landed with three scoped one-line `eslint-disable-next-line no-useless-assignment` comments on the write-only `$bindable` props (eslint-plugin-svelte#1478), overruling PROH-169-07 for exactly those lines. The drawer focus return was wired (`e3a661517`), clearing `no-unassigned-vars` at source. The config-lookup flag is gone from all 21 live sites. 10.12.0 is inside the 7-day window | D-06, D-17, PROH-169-07 (overruled for 3 lines) | 10.12.0 clears 2026-10-09T20:08Z; the three disables go when #1478 ships (todo `2026-10-03-remove-bindable-no-useless-assignment-disables.md`) |
| `vitest`, `@vitest/browser-playwright` | **5.0.2** (catalog `^5.0.2`; 169-04) | 5.0.3 (2026-09-30T11:30Z / 11:29Z, 3.0 d old on 2026-10-03) | Inside the 7-day window; 5.0.2 is the newest 5.x old enough | D-03 | 5.0.3 clears 2026-10-07T11:30Z |
| `daisyui` | **5.7.46** (catalog `^5.7.46`; 169-04) | 5.7.47 (2026-09-30T00:29Z, 3.45 d old on 2026-10-03) | Inside the 7-day window | D-03 | 5.7.47 clears 2026-10-07T00:29Z |
| `@sveltejs/kit` | **2.70.3** (catalog `^2.70.3`; 169-05) | 3.0.0 (2026-10-01T17:22:34Z; 2.06 d old at the 169-12 re-measurement, 2026-10-03T18:49Z; the only 3.x) | **New major line inside the 30-day window** (169-12 Task 1 verdict `HOLD-AGE`, § 1). Every Kit 3.0.0 peer and engine is already satisfied by the tree (vite 8.3.1, vite-plugin-svelte 7.3.1, svelte 5.57.1, typescript 6.0.3, Node floor 24.15.0), so only the age clock holds it. Not installed; neither its migrator nor `sv` was run (PROH-169-22) | D-03, D-15, D-32, ruling 11 | **2026-10-31T17:22:34Z**. Then re-measure, take the operator checkpoint (D-32) and land it with the adapters as one commit. Todo `2026-10-03-sveltekit-3-held-by-the-age-rule.md` |
| `@sveltejs/adapter-node` (frontend) | **5.5.7** (169-05) | 6.0.0 (2026-10-01T17:24:31Z; 2.06 d old at the 169-12 re-measurement; the only 6.x) | **New major line inside the 30-day window** (169-12 Task 1, `HOLD-AGE`). It moves with Kit 3 (D-15 step 2) | D-03, D-15 | **2026-10-31T17:24:31Z**, the latest of the three; same todo |
| `@sveltejs/adapter-static` (docs) | **3.0.10** (169-05) | 4.0.0 (2026-10-01T17:21:55Z; 2.06 d old at the 169-12 re-measurement; the only 4.x) | **New major line inside the 30-day window** (169-12 Task 1, `HOLD-AGE`). It moves with Kit 3 (D-15 step 2) | D-03, D-15 | **2026-10-31T17:21:55Z**; same todo |
| `vite` | **8.3.1** (catalog `^8.3.1`; 169-05) | 8.3.2 (2026-10-01T10:17Z, 2.11 d old on 2026-10-03) | Inside the 7-day window | D-03 | 8.3.2 clears 2026-10-08T10:17Z |
| `supabase` (CLI) + the six `setup-cli` `version:` pins | **2.118.0** (catalog `^2.118.0`; 169-06, `cb14c57d2`) | 2.119.0 (2026-09-30T21:36Z, 2.66 d old on 2026-10-03) | Inside the 7-day window. The CLI and the CI pins must move together (`rpcNullabilityGate.test.ts`), and a CLI move changes the service images and the type generator, so 2.119.0 needs its own db:types / pgTAP / E2E pass | D-03, D-10 | 2.119.0 clears 2026-10-07T21:36Z |
| `nodemailer` (Deno `npm:` import in `send-email/index.ts`) | **6.9.10** (unchanged; 6 high advisories, § 2) | 10.0.x (10.0.0 published 2026-09-04T07:45:32Z, 29.28 d old on 2026-10-03; 10.0.11 6.27 d old) | **New major inside the 30-day window.** Every older line still carries an open high advisory (GHSA-v53p-9fqp-m79j covers `<= 10.0.5`), so PROH-169-16 says wait rather than take 6.10 / 7 / 8 / 9. supabase-js and jose were pinned without it. DEPS-09 stays Pending | D-03, D-09, PROH-169-16 | 10.0.0 clears 2026-10-04T07:45:32Z and 10.0.11 clears 2026-10-04T07:50:47Z. Resume steps in todo `2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md` |
| `dotenv` | **17.4.2** (catalog `^17.3.1`, the newest 17.x; root, used by `tests/playwright.config.ts` and `tests/seed-test-data.ts`) | 18.0.0–18.0.5 (18.0.0 published 2026-09-17T21:18:40Z, 16.8 d old on 2026-10-03) | **New major inside the 30-day window** (RESEARCH Pitfall 1). The current line has no advisory (§ 2, 169-10). `npx playwright test --list -c tests/playwright.config.ts` still loads the config on 17.4.2 (exit 0, 173 tests, no `.env` value or dotenv banner in the output) | D-03, D-23 | 18.x clears **2026-10-17T21:18Z**; then bump the catalog, check 18's default logging (no env value may print) and re-run `typecheck:tests` and the `--list` config load |
| `intl-messageformat` | **11.2.15** (`apps/frontend` `^11.1.3`, the newest 11.x) | 12.0.0–12.1.2 (12.0.0 published 2026-09-15T12:27Z, 18.2 d old on 2026-10-03) | **New major inside the 30-day window** (RESEARCH Pitfall 1). The current line has no advisory (§ 2, 169-10) | D-03, D-23 | 12.x clears **2026-10-15T12:27Z**; then bump, adapt `overrides.ts` if needed, run the frontend i18n tests and `check` |
| `globals` | **17.12.0** (catalog `^17.12.0`; 169-10, `5017d4a17`) | 17.13.0 (2026-10-01T03:57Z, 2.53 d old on 2026-10-03) | Inside the 7-day window. `eslint-plugin-svelte` 3.23.0 keeps its own nested `globals` 16.5.0 (`^16.0.0`, not a declarer) | D-03, D-13 | 17.13.0 clears 2026-10-08T03:57Z |

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
| 169-05 | `169-05-group3` (`restartOnRootEnv` replacing vite-plugin-restart, Svelte floor `^5.57.1`, Kit 2.70.3 + adapter-node 5.5.7, Vite 8.3.1 + vite-plugin-svelte 7.3.1 through the catalog) | `bf828a1da` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **171 / 171 / 0 / 0 / 0** (`169-e2e/169-05-group3`) |

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

Notes on `169-05-group3` (2026-10-03T12:59:16Z–13:01:52Z, `tests/e2e-runs/169-gates/169-05-group3/`):
- `porcelain_lines: 0`.
- Forced turbo runs: `03-typecheck` 23/23, `08-unit` 25/25 and `09-build` 14/14 tasks executed, none cached.
- `01-install`: the only YN0060 left is `zod` against `openai` (169-09's). Kit's `typescript ^5.3.3` warning is gone.
- `02-dedupe`: nothing to dedupe.
- `04-lint` reports 0 errors and 17 warnings. The normalised finding list (path, position, rule and message, 33 lines)
  is identical to `169-04-group4`'s (`diff` exit 0, `05/lint-norm-{before,after}.txt`). ESLint stays on 9.39.5, with
  the config-lookup flag kept.
- `10-audit`: `0 new advisory(ies) at high+, 5 accepted`. The `@sveltejs/kit` row 1116433 left with Kit 2.70.3.
- `12-docs-rq` (two-base form): every `<ResearchQuote>` span is identical to the base, and the three frozen
  components are identical to the component base.

E2E `169-05-group3` (`bash 169-e2e.sh 169-05-group3`, the full default suite):
- Docker VM had 22.01 GiB free after `docker builder prune -af`.
- `e2e-run.sh` ran at HEAD `bf828a1da` with `db_reset=true` and project `…0000e2`, 2026-10-03T13:02:15Z–13:07:53Z.
- Wrapper exit 0; preflight successes 1, failures 0.
- `summary.json`: **total 171, passed 171, failed 0, flaky 0, skipped 0, didNotRun 0**.
- No listener was left on 5273.
- This is the first full E2E run on Vite 8 (Rolldown) and SvelteKit 2.70.3. Both this run and the visual gate drive a Vite 8
  dev server. The Rolldown production bundle is exercised only by `09-build` (exit 0) and measured by the § 6
  build-output diff; no browser test ran against `apps/frontend/build`.

Final visual run `169-05-visual-final` at `bf828a1da`, image `eff16c30e6f3…`, after a fresh `db:reset` + `db:seed
--template e2e/base` and a Vite 8.3.1 dev server with `PUBLIC_PROJECT_ID=…0000e2`: exit 0, 7 expected / 0
unexpected / 0 flaky.

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

### 169-06 Task 1 — after the CLI commit (`cb14c57d2`), before Postgres 17

pgTAP, `db:lint:sql`, the CI-pin gate test and the audit after this commit are in § 6 (169-06 Task 1). All exited 0.

E2E `169-06-cli` (`bash 169-e2e.sh 169-06-cli`, the full default suite):
- Docker VM had 16.87 GiB free after `docker builder prune -af` (the new service images took about 5 GiB).
- `e2e-run.sh` ran at HEAD `cb14c57d2` with a `db:reset` and project `…0000e2`, Playwright start
  2026-10-03T13:56:23Z, 4.6 min.
- The stack ran PostgREST v16.3, GoTrue v2.197.0, storage-api v1.77.0, realtime v2.135.3 and edge-runtime v1.76.2,
  on Postgres 15.8.1.085.
- Wrapper exit 0.
- `summary.json`: **total 171, passed 171, failed 0, flaky 0, skipped 0, didNotRun 0**.
- No listener was left on 5273.
- The run is attributed to the CLI's service images alone, because Postgres was still 15.

Tracer gate (`<verify>` re-run after the E2E run): `test:db` exit 0 (`Files=36, Tests=1335`, `PASS`), `db:lint:sql`
exit 0, `rpcNullabilityGate.test.ts` exit 0 (`06/t1-tracer-*.log`). Postgres 17 went ahead on this proven slice.

Gate run `169-06-group5a`, **12/12 zero**. It covers what is committed (CLI 2.118.0, local stack back on PG15 after
the Task 2 deferral). It ran 2026-10-03T14:17:52Z–14:20:29Z at HEAD `e454371c2`, `tests/e2e-runs/169-gates/169-06-group5a/`.
- `porcelain_lines: 0`.
- Forced turbo runs: `03-typecheck` 23/23, `08-unit` 25/25 and `09-build` 14/14 tasks executed, none cached.
- `01-install`: one YN0060, the same `zod` against `openai` warning as before (169-09's).
- `04-lint`: 0 errors and 17 warnings. The normalised finding list (33 lines) is identical to 169-05's
  (`06/lint-norm-after.txt` vs `05/lint-norm-after.txt`, sorted `diff` exit 0). ESLint stays on 9.39.5.
- `10-audit`: `0 new advisory(ies) at high+, 2 accepted`.
- `12-docs-rq` (two-base form): exit 0.
- No full E2E re-run: `169-06-cli` (171/171) already covers the CLI commit, and every commit since is `.planning`-only.

### 169-06 Task 2 — local Postgres 17, STOPPED at the SQL lint (not committed)

The `config.toml` edit (`major_version = 17`) is **uncommitted**. The checks below ran on the PG17 stack with that edit
in the working tree, at HEAD `b0532f674`.

| Check | Result |
|---|---|
| `show server_version` | `17.6` (passes the `17.*` gate) |
| `yarn db:types` on the fresh PG17 reset, before pgTAP | exit 0, **no diff** to `database.ts` |
| `yarn workspace @openvaa/supabase test:db > tests/e2e-runs/169-gates/06-t2-pgtap.log` | **exit 0**, `Files=36, Tests=1335`, `Result: PASS`, 0 `not ok`; `36-entity-identity.test.sql` `ok` |
| `yarn db:lint:sql` (`06/t2-db-lint.log`) | **exit 1**: two `plpgsql_check` warnings on `public.is_valid_choice_id`, "routine is marked as IMMUTABLE, but expression is STABLE" (body line 9, the `SELECT jsonb_agg(c -> 'id') … FROM jsonb_array_elements(…)`; body line 16, `RETURN p_choice_ids @> jsonb_build_array(p_value)`). `--fail-on warning` makes this red |
| migrations / schema / seed diff against the phase base `5ed82f437` | empty (`git diff --stat` prints nothing) |
| E2E `169-06-pg17-uncommitted-probe` (information only; the official `169-06-pg17` label is unused) | Docker VM 30.59 GiB free; HEAD `b0532f674` plus the uncommitted `config.toml`; Playwright start 2026-10-03T14:07:34Z, 4.5 min; wrapper exit 0; **171 / 171 passed, 0 failed, 0 flaky, 0 didNotRun** |
| group gates on PG17 | not run |

**Deferred (orchestrator ruling 2026-10-03, a deferral, not an operator decision).** Task 2 was parked so the phase
can continue. The A/B/C choice stays with the operator (todo
`2026-10-03-pg17-local-blocked-on-is-valid-choice-id-volatility.md`).

- **Saved for re-applying** (both `git apply --check` clean on HEAD):
  - `tests/e2e-runs/169-gates/06/t2-pg17-config.patch` (`major_version = 17` plus the PG15-constraint comment);
  - `tests/e2e-runs/169-gates/06/t2-option-a-stable.patch` (IMMUTABLE → STABLE in `schema/011-validation-functions.sql`
    and `migrations/00001_initial_schema.sql`). It was produced with `git diff` on a temporary working-tree edit,
    then reverted with `git checkout -- <the two files>`. It was not committed.
- **Back on PG15** (Option-B sequence, `06/t2b-*`):
  - `git checkout -- apps/supabase/supabase/config.toml` (`major_version = 15`), then `yarn db:stop` and `yarn
    workspace @openvaa/supabase exec supabase stop --no-backup`. Both printed `project_id_filter: openvaa-local`.
    Afterwards no `_openvaa-local` container or volume was left, and `my-redis` was untouched.
  - `docker builder prune -af`, then `yarn db:reset` → exit 0.
  - `show server_version` → **`15.8`** (`postgres:15.8.1.085`). The other services are still on the CLI 2.118.0
    images.
  - `yarn db:types` → exit 0, no diff (`git status --short` empty).
  - `test:db` → exit 0, `Files=36, Tests=1335`, `PASS`, 0 `not ok`, `36-entity-identity.test.sql` ok.
  - `db:lint:sql` → exit 0 (`{"results":[]}`; schema lint `0 error(s), 3 warning(s)`).

### 169-07 — supabase-js, ssr, the Edge Function pins (group 5, second half)

**Task 1, supabase-js 2.117.2 (`3f4fe2ebf`).** Logs are in `tests/e2e-runs/169-gates/07/t1-*`.
- `TURBO_FORCE=true yarn typecheck` first exited 2 on `@openvaa/dev-seed` (TS2345 at the join-table `upsert`; see § 6).
  After the fix it ran 23/23.
- `yarn workspace @openvaa/dev-seed test:unit` first gave 898/901. The three teardown locality-guard cases that get
  past the guard timed out at 5 s, because postgrest-js now retries a failed read (§ 6). After the fix it gave 901/901.
- `TURBO_FORCE=true yarn test:unit` 25/25.
- `vitest run src/lib/supabase/` 22/22, and the `safeGetSession` round-trip counts are unchanged.
- `yarn assert:cookie-names` 0 violations.
- E2E `169-07-supabase-js` (`--project auth-setup`, a real candidate login with `data-setup-base` first): 3/3/0/0/0.
- Tracer gate: the `<verify>` was re-run on the committed tree (`169-07-supabase-js-tracer`, 3/3/0/0/0; vitest 22/22;
  cookie names 0) before expanding.

**Task 2, ssr 0.12.7 (`fd8b72ce7` RED, `9075a027b` GREEN).**
- RED: `server.test.ts` gave 2 failed / 7 passed. The two failures were `expected "vi.fn()" to be called 1 times, but
  got 0 times`. The no-headers case passes by construction.
- GREEN: `vitest run src/lib/supabase/` 25/25.
- `yarn assert:cookie-names` 0.
- `yarn workspace @openvaa/frontend check`: 2099 files, 0 errors, 0 warnings.
- E2E `169-07-ssr` (`--project auth-setup`): 3/3/0/0/0, with no header error in `devserver.log`.

**Task 3, the Edge Function pins (`cce9b5b16`).**
- Static gates:
  - `yarn workspace @openvaa/supabase test:unit` 206/206 in 15 files, including the new jose-pin case.
  - Negative control for that case: changing the pin to `6.2.11` reddens it with `expected '6.2.11' to be '6.2.12'`.
  - `yarn assert:edge-function-env` 0 violations; `yarn assert:edge-env-defaults` 0; `yarn assert:comment-hygiene` 0.
- Boot checks after `yarn db:stop && yarn db:start` (edge-runtime v1.76.2, Deno 2.1.4), recorded in
  `07/t3-boot-codes.txt`:

  | Function | `OPTIONS` status | Edge-runtime log |
  |---|---|---|
  | `send-email` | 200 | `serving the request with supabase/functions/send-email`, no boot error |
  | `invite-candidate` | 200 | served, no boot error |
  | `identity-callback` | 200 | served, no boot error |

  - Negative control: pointing `invite-candidate` at `npm:@supabase/supabase-js@2.0.0-does-not-exist` gave `503
    {"code":"BOOT_ERROR"}` and `worker boot error: … Could not find npm package`. With the file restored it gave 200,
    so the check catches a bad specifier.
  - Functional probe of the two functions no E2E spec calls, with an anon bearer token:
    - `invite-candidate` and `send-email` both answered `401 {"error":"Invalid or expired authentication token"}`.
    - That answer comes after `createClient(...)` from the new `npm:` import and its `auth.getUser()` round trip to
      GoTrue.
    - There is no E2E caller for either function; this matches the 168-03 F2 finding.
- Gate run `169-07-group5`: **12/12 zero**, at HEAD `cce9b5b16`, in `tests/e2e-runs/169-gates/169-07-group5/`.
  - `porcelain_lines: 0`.
  - `03-typecheck` 23/23, `08-unit` 25/25 and `09-build` 14/14 executed, none cached.
  - `01-install`: the same single `zod`-against-`openai` YN0060.
  - `04-lint`: 0 errors, 17 warnings. The normalised list (33 lines) is identical to 169-06's (`07/lint-norm-after.txt`
    vs `06/lint-norm-after.txt`, sorted `diff` exit 0).
  - `10-audit`: `0 new advisory(ies) at high+, 2 accepted`.
  - `12-docs-rq` (two-base form): exit 0.
- Full E2E:
  - **`169-07-group5`** (first attempt, at `cce9b5b16`) gave 171 / 82 passed / **1 failed** / 0 flaky / 88 did not run.
    - The failure was `voter-journey` › "full voter journey end-to-end". At Base-6 (number scale), `question-delete`
      stayed disabled and the test timed out at 240 s.
    - The 88 did-not-run are its serial-chain dependants.
    - The trace shows the spec pressing `End` on the slider and clicking Next 14 ms later. When Base-6 was revisited,
      the slider read 5 and no answer was stored.
    - Nothing in this plan touches the voter answer path, which is client-side. The root cause is **UNCONFIRMED**:
      likely a race between the keyboard answer commit and the Next navigation in the spec helper.
    - Re-tested in isolation: `169-07-voter-journey-iso-{1,2,3}` gave 4/4 each. The `voter-journey` project then also
      passed inside all three bank-auth-journey chains below.
    - Logged in `deferred-items.md`.
  - **`169-07-group5-r2`** (re-run at `cce9b5b16`, fresh dev server, `db:reset`, Docker VM 30.23 GiB free): **171
    passed, 0 failed, 0 flaky, 0 skipped, 0 did not run**, 4.8 min, `ENOSPC` 0. This is the group's full-suite verdict.
- Bank-auth 3×.
  - Setup:
    - One baseline `yarn db:reset`. Storage `GET /storage/v1/bucket` answered 200 and listed `public-assets` and
      `private-assets`.
    - The test JWKS (`sigPubJwk`) was served on 8777 (`GET /jwks` 200).
    - The env files were generated from `testKeys.ts` and `DEFAULT_TOKEN_OPTS` into the session scratchpad only.
    - Each run went through `tests/scripts/e2e-run.sh --no-db-reset`, which spawns and kills its own dev server, so
      every run had a fresh one.
  - The plan's single combined command cannot work, because one served function has one `IDENTITY_PROVIDER_ISSUER`.
    The synthetic `bank-auth` token is issued by `https://test-idp.example.com` and the journey's token by the mock
    issuer, `https://127.0.0.1:9443`. So, as 166-04 did, each project ran three times consecutively. The Edge env files
    differ only in the issuer, and each was read back from the running container by key:

  | Project | Edge env (read back) | Runs (HEAD `cce9b5b16`) | Totals each | Verdict |
  |---|---|---|---|---|
  | `bank-auth` | issuer `https://test-idp.example.com`, project `…0e2`, `SITE_URL` `http://127.0.0.1:5273` | `169-07-bankauth-{1,2,3}`, started 15:06:13Z / 15:06:29Z / 15:06:44Z | 8 / 8 passed / 0 / 0 / 0 / 0 | PASS ×3 |
  | `bank-auth-journey` | issuer `https://127.0.0.1:9443`, same project and `SITE_URL`; the wrapper shell exported `PUBLIC_PROJECT_ID=…0e2` and sourced the journey IdP env | `169-07-bankauth-journey-{1,2,3}`, ended 15:12:17Z / 15:16:26Z / 15:20:46Z | 131 / 131 passed / 0 / 0 / 0 / 0 | PASS ×3 |

  - In every `bank-auth` run, "should create candidate via identity-callback Edge Function (Idura sub-based identity)"
    (the keys-configured create path, asserted loudly), "should return session with magic link when candidate is
    created" and "should reject an id_token encrypted with a mismatched (wrong) decryption key" passed. That is the jose
    6 `importJWK` / `compactDecrypt` / `jwtVerify` path, with RSA-OAEP-256 / A256GCM.
  - In every journey run, "full bank-auth self-registration journey through to authenticated candidate" passed, along
    with the whole perm serial chain.
- After the runs:
  - The function server and the JWKS server were stopped. Ports 8777, 9443 and 5273 have no listener, and no
    `vite.js dev` is alive.
  - The stack was restored with `yarn db:stop && yarn db:start`. Read back by key: issuer
    `https://openvaa.test.idura.broker`, project `…0001`.
  - Orphans, through psql: `@test.openvaa.local` users 0, `@bank-auth.placeholder` users 0, and E2E-project candidates
    and organizations with a null `external_id` 0.
  - Leak check: `git status --porcelain` lists only the new todo. No env file, and nothing under `functions/`.
  - Docker was not restarted, and the other stack was not touched.

### 169-08 — `@faker-js/faker` 10.6.0 (group 6)

| Plan | Label | HEAD | install | dedupe | typecheck | lint | format | check-fe | check-docs | unit | build | audit | docs-links | docs-rq | E2E (total / passed / failed / flaky / did-not-run) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 169-08 | `169-08-group6` (faker 10.6.0, `ctx.ts` comment) | `5c338398f` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **171 / 171 / 0 / 0 / 0** (`169-e2e/169-08-group6`) |

Notes on `169-08-group6` (2026-10-03T16:00:22Z–16:02:59Z, `tests/e2e-runs/169-gates/169-08-group6/`):
- `porcelain_lines: 0`, `TURBO_FORCE: true`, Node v24.21.0, Yarn 4.18.1.
- `01-install`: the only YN0060 left is `zod` against `openai` (169-09's).
- `04-lint`: 0 errors, 17 warnings. The normalised list (33 lines, `08/lint-norm-after.txt`) is identical to the
  rulings run's (`rulings/gates-r2-lint-norm.txt`, sorted `diff` exit 0). No new finding, no new disable.
- `10-audit`: exit 0, `Summary: 0 new advisory(ies) at high+, 1 accepted`. The one remaining accepted finding is
  `braces` (no fix published). The faker row 1158500 left the findings; the audit lists it, with the other stale rows,
  as droppable at the next reviewed baseline update (169-13). A high+ finding still remains, so the gate passes on
  "nothing new", not on an empty audit.
- `12-docs-rq` (two-base form): every `<ResearchQuote>` span identical to the base; the frozen components identical to
  the component base.

E2E `169-08-group6` (`bash 169-e2e.sh 169-08-group6`, the full default suite):
- Docker VM 30.15 GiB free after `docker builder prune -af`.
- `e2e-run.sh` at HEAD `5c338398f` with `db_reset=true`, Playwright start 2026-10-03T16:04:49Z, 4.5 min.
- Wrapper exit 0. `summary.json`: **total 171, passed 171, failed 0, flaky 0, skipped 0, didNotRun 0**. The
  voter-journey Base-6 slider flake did not recur.

Visual gate at `5c338398f`, image `sha256:eff16c30e6f3…` (present locally, not pulled), after `yarn db:reset && yarn
db:seed --template e2e/base` (143 rows, 30 portraits) and `PUBLIC_PROJECT_ID=…0000e2 yarn workspace @openvaa/frontend
dev --host 0.0.0.0`:
- `169-08-visual`: exit 0, 7 expected / 0 unexpected / 0 flaky.
- `169-08-visual-final`: exit 0, 7 expected / 0 unexpected / 0 flaky.
- **No visual diff, so no re-baseline** (PROH-169-17 held trivially). This is what § 6 predicts: the visual specs
  read the `e2e/base` dataset, which is byte-identical on 10.6.0.
- The dev server was stopped afterwards; no listener is left on 5173 or 5273.

### 169-09 — the AI SDK majors and the `openai` removal (group 7)

| Plan | Label | HEAD | install | dedupe | typecheck | lint | format | check-fe | check-docs | unit | build | audit | docs-links | docs-rq | E2E (total / passed / failed / flaky / did-not-run) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 169-09 | `169-09-group7-attempt1` (ai 7.0.116, @ai-sdk/* 4, openai removed) | `32a0eed8a` | 0 | 0 | 0 | **1** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | — |
| 169-09 | `169-09-group7` (+ the comment-hygiene fix `6ab069778`) | `6ab069778` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **171 / 171 / 0 / 0 / 0** (`169-e2e/169-09-group7`) |

Notes:
- `169-09-group7-attempt1` (directory renamed from `169-09-group7` after the run, so the label could be reused):
  `04-lint` exit 1 on one finding, `assert:comment-hygiene` rule 2 in `llmProvider.ts` — a new two-line comment
  broke one sentence across lines. Fixed by joining it (`6ab069778`, comment only); ESLint itself reported nothing new.
- `169-09-group7` (2026-10-03T16:33:21Z–16:35:36Z, `tests/e2e-runs/169-gates/169-09-group7/`): `porcelain_lines: 1`
  (this evidence file, uncommitted), `TURBO_FORCE: true`, Node v24.21.0, Yarn 4.18.1.
  - `01-install`: the `YN0060` about `zod` against `openai` is gone; the only peer notice left is the long-standing
    `YN0002` (`playwright-core` for `@axe-core/playwright`).
  - `04-lint`: 0 errors, 17 warnings. The normalised list (33 lines, `09/lint-norm-after.txt`) is identical to
    169-08's (`08/lint-norm-after.txt`, sorted `diff` exit 0). No new finding, no new disable.
  - `08-unit`: `@openvaa/llm` 43 tests (39 before; four added), `argument-condensation` 6 files, `question-info`
    2 files, frontend 129 files, dev-seed 66 files, all passing.
  - `09-build`: the frontend production build bundles the ESM-only `ai` 7 into the server output without error.
  - `10-audit`: exit 0, `Summary: 0 new advisory(ies) at high+, 1 accepted` (`braces`). No AI SDK advisory, no
    `undici` 5, no `@fastify/busboy`.
  - `12-docs-rq` (two-base form): every `<ResearchQuote>` span identical to the base; the frozen components identical
    to the component base.

E2E `169-09-group7` (`bash 169-e2e.sh 169-09-group7`, the full default suite):
- Docker VM 30.01 GiB free after `docker builder prune -af`.
- `e2e-run.sh` at HEAD `6ab069778` with `db_reset=true`, one fresh dev server on 5273; finished 2026-10-03T16:41Z.
- Wrapper exit 0. `summary.json`: **total 171, passed 171, failed 0, flaky 0, skipped 0, didNotRun 0**. The
  voter-journey Base-6 slider flake did not recur. No E2E spec drives the LLM admin jobs (they need a provider key),
  so the runtime proof of the SDK path is the § 6 smoke run, not E2E.
- No listener is left on 5173 or 5273 afterwards.

### 169-10 — the small majors (group 8)

| Plan | Label | HEAD | install | dedupe | typecheck | lint | format | check-fe | check-docs | unit | build | audit | docs-links | docs-rq | E2E (total / passed / failed / flaky / did-not-run) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 169-10 | `169-10-group8` (concurrently 10, lint-staged 17, changesets 3, glob 13, `@types/cheerio` removed, js-yaml 5, globals 17) | `5017d4a17` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | — (D-26: no E2E after group 8) |

Notes:
- `169-10-group8` (2026-10-03T16:57:18Z–16:59:58Z, `tests/e2e-runs/169-gates/169-10-group8/`): `porcelain_lines: 0`,
  `TURBO_FORCE: true`, Node v24.21.0, Yarn 4.18.1; every turbo task ran uncached (typecheck 23/23, unit 25/25, build
  14/14, `0 cached`).
  - `01-install`: the only peer notice is the long-standing `YN0002` (`playwright-core` for `@axe-core/playwright`).
  - `04-lint`: 0 errors, 17 warnings. The normalised list (33 lines, `10/lint-norm-after.txt`) is identical to
    169-09's (`09/lint-norm-after.txt`, sorted `diff` exit 0). No new finding, no new disable. The globals commit was
    also checked alone before it was committed: `TURBO_FORCE=true yarn lint:check` exit 0, same 33-line list
    (`10/t3-globals-lint-norm.txt`).
  - `08-unit`: every workspace green, including `@openvaa/llm` (prompt loading through js-yaml 5), `argument-condensation`
    and `question-info` (both register their real prompt directories in their test setup), and frontend 129 files.
  - `10-audit`: exit 0, **`Summary: 0 new advisory(ies) at high+, 0 accepted`**. `braces` (1240992) is now among the
    baseline ids that no longer appear (§ 2, 169-10).
  - `11-docs-links`: 0 findings. `12-docs-rq` (two-base form, base `0ec229dfe`, component base `6090476cc`): every
    `<ResearchQuote>` span identical to the base and the frozen components identical to the component base.
- Exercises recorded per upgrade (logs under `tests/e2e-runs/169-gates/10/`):
  - `concurrently` 10.0.5: `yarn concurrently -n a,b -c blue,green --kill-others-on-fail "node -e 0" "node -e 0"` exit 0
    (`t1-conc-exercise.log`); negative control, one command exiting 3 → the other is sent SIGTERM and the run exits 1
    (`t1-conc-negative.log`), so `--kill-others-on-fail` still binds.
  - `lint-staged` 17.6.0, with nothing staged (`git diff --cached --quiet` checked first, so its backup stash is never
    reached): `yarn lint-staged --debug` exit 0; the debug output shows `.lintstagedrc.json` found and loaded with both
    globs (`*.{html,js,…,yml}` → `prettier --write`, `eslint --fix`; `*.{css,json,md}` → `prettier --write`) and ends
    `lint-staged could not find any staged files.` (`t1-ls-exercise.log`). The tracer gate re-ran both commands after
    the second commit: exit 0.
  - changesets 3.0.3 / changelog-github 1.0.1: see § 6 (`yarn changeset status` exit 1 is the documented "packages
    changed, no changesets" outcome, unchanged from 2.x; `--since=HEAD` exit 0; config 4 `readConfig` → no warnings,
    no errors).
  - `glob` 13.0.6: `yarn workspace @openvaa/docs generate:docs` exit 0 (103 components, the route map, `yarn format`
    reports every file unchanged); afterwards `git status --porcelain -- apps/docs` is empty once the manifest is
    committed (`t2-glob-generate.log`). The 104 + 1 generated pages are tracked, not ignored.
  - `@types/cheerio` removed: `yarn typecheck:tests` exit 0 (`t2-tc-typecheck-tests.log`); `cheerio` 1.2.0's own
    `dist/esm/index.d.ts` types `emailBucket.fixture.ts`.
  - `dotenv` (held): `npx playwright test --list -c tests/playwright.config.ts` exit 0, `Total: 173 tests in 100 files`,
    no `.env` value and no dotenv banner in the output (`t2-dotenv-list.log`).
  - `js-yaml` 5.4.2: `@openvaa/llm` typecheck + 43/43, `argument-condensation` 30/30, `question-info` 22/22 (with the
    rebuilt `@openvaa/llm` dist); the 31-file parse comparison is in § 6.

### 169-11 CI evidence (`ci-evidence/169-deps`, `main.yaml`) — the first CI observation of groups 2–9

Same procedure as 169-02: a source-only tree of HEAD (scratch `GIT_INDEX_FILE`, `.planning` and `.bg-shell`
removed; `git ls-tree -r --name-only <sha>` → **0** paths under `.planning/` for each of the three commits below;
the only non-`.planning` difference from HEAD is the removed `.bg-shell/manifest.json`), parent `59f8dacdd`, pushed
with `--force-with-lease` to `ci-evidence/169-deps` (2cf0e8416 → 3a27c98fc → d69c5d62a → 59607e5cd). Job lists:
`tests/e2e-runs/169-gates/11-t3-ci-run1.json`, `11-t3-ci-run2.json`, `11-t3-ci.json` (run 3, the plan's verify
command). The run before these (37115289953, tree of `8d91d37f8`) carried group 1 only, so run 1 below is the first
CI run of groups 2–8 as well as of the Actions majors: ESLint 10, Vite 8, Vitest 5, Playwright 1.63 (`PW_IMAGE`
digest), Postgres 17 locally and in CI, faker 10, AI SDK 7 and the small majors. The pending todo
`2026-09-03-ci-e2e-ssr-500.md` (dev server answering HTTP 500) describes none of the reds below, so it exempts no job.

| Job | Run 1 `37139970902` (`3a27c98fc` = tree of `70c397a8c`) | Run 2 `37142651706` (`d69c5d62a` = tree of `549f6a60d`) | Run 3 `37144076939` (`59607e5cd` = tree of `edaa28205`) |
|---|---|---|---|
| `node-engine-range-negative-control` | success | success | **success** |
| `docker-image-build` | success (its only `uses:` is `actions/checkout@v7`) | success | **success** |
| `supabase-tests` | success (setup-cli v3 → CLI 2.118.0; `postgres:17.6.1.171`; pgTAP `Files=36, Tests=1335`, `Result: PASS`) | success | **success** (pgTAP `Files=36, Tests=1335`, `Result: PASS`) |
| `skill-drift-check` | success | success | **success** |
| `secret-scan` | success (trufflehog 3.97.9) | success | **success** |
| `dependency-audit` | success | success | **success** |
| `sql-lint` | success | success | **success** |
| `supabase-types-drift` | success | success | **success** |
| `dev-seed-integration` | success | success | **success** |
| `frontend-and-shared-module-validation` | success | success | **success** |
| `e2e-visual` | success (Playwright 1.63 container) | success | **success** (7 passed) |
| `e2e-tests` | **failure** (step "Run E2E tests": 81 passed / 2 failed / 88 did not run) | **failure** (82 passed / 1 failed / 88 did not run) | **success** (171 passed; no failed, flaky or did-not-run line in the job log) |
| **Run conclusion** | failure | failure | **success** (2026-10-03T18:24:31Z–18:42:09Z, attempt 1; 12/12 jobs `success`) |

- **Run 1, red 1 — `performance` › "voter results page renders matches within budget": `timeToMatches` 5901 ms
  against the 5000 ms budget** (`resultsFetches` 11, ttfb 403 ms). Run 37115289953 had measured 1329 ms.
  **Attributed to group 4 (Playwright 1.63, `34670ea56`), harness-side, not the app.** Local full-suite runs had
  already moved from ~210–300 ms (`169-01`, `169-02`) to 690–1160 ms from `169-04-group4` onwards, under budget
  locally and so unnoticed. A bisect on an isolated scratch clone (`git clone` of this repository; the running
  stack untouched: `db:start` neutralised in the clone's copy of `e2e-run.sh`, `--no-db-reset`, port 5273), the
  `performance` project alone, 3 runs per point, idle dev server:

  | Point | `timeToMatches` (ms) | ttfb (ms) |
  |---|---|---|
  | `8d91d37f8` (CI run 37115289953's tree) | 243, 310, 325 | 34–36 |
  | `668dc5675` (group 4, before Playwright; Playwright 1.58.2, Chromium 145) | 243, 237, 213 | 32–37 |
  | `34670ea56` (Playwright 1.63.0, Chromium 153) | 512, 535, 506 | 30–33 |
  | `7b41eb90a` (end of group 4) | 521, 482, 492 | 24–35 |
  | `70c397a8c` (HEAD), traced (config default) | 611, 584, 585 | 33–36 |
  | `70c397a8c` (HEAD), `--trace=off` | 242, 244, 241 | 39–40 |

  The step is the Playwright commit, which changes no app code, and untraced HEAD equals traced 1.58: the cost is
  Playwright 1.63's trace recording inside the measured window (the config records a trace for every test). Fix
  (`f6bbc68ab`): `trace: 'off'` for the `performance` project only, with the measurements in the config comment; the
  budget, the window and every assertion are unchanged. Locally afterwards: 255 ms (`169-e2e/169-11-fix-performance`,
  3/3). Run 2 measured **3045 ms** (pass). That is higher than the 1329 ms of run 37115289953; the CI runner's share
  of that gap was not isolated (UNCONFIRMED), and the margin is recorded as a follow-up (§ 7).
- **Run 1, red 2 — `voter-journey` › "full voter journey end-to-end", step "customData.terms": the term popup was
  never visible within 2000 ms after `termTrigger.focus()`.** The trace: the Base-3 heading text matched (DOM swapped)
  at +4.169 s, focus at +4.205 s; the screencast frames at +0.05 s and +0.33 s after the focus still show Base-2 (the
  View Transition's old snapshot), Base-3 appears by +0.84 s with no popup and no focus on the trigger. The root
  layout's `afterNavigate` → rAF focus reset (`focusNavigationTarget`) runs only after the transition ends
  (`tests/tests/helpers/navigation.ts` records the same ordering), takes focus to the heading, and `Term.svelte`
  hides the popup on `focusout`. A test race exposed by the slower page, not a product defect. Fix (`549f6a60d`): the
  step polls until focus sits on `[data-focus-on-nav] ?? h1` with `TIMEOUTS.page` before focusing the trigger; the
  popup assertions keep `TIMEOUTS.element`. Run 2 passed the step.
- **Run 2, red — `voter-journey` › "full voter journey end-to-end", step "answer remaining base questions…":
  `question-delete` stayed disabled on Base-6 until the 240 s test timeout.** This is the intermittent recorded in
  `deferred-items.md` since 169-07 (seen once locally, root cause UNCONFIRMED), now seen in CI. The CI trace shows
  the same window as red 2: Base-6's heading matched, the slider was focused and `End` pressed (+0.000 s), Next
  clicked at +0.094 s, while the frame at +0.013 s still shows Base-5. Why the press was not stored is
  **UNCONFIRMED** (the slider persists in its `change` handler); the press demonstrably landed inside the transition
  window. Fix (`edaa28205`): one helper, `waitForNavigationFocusReset`, now used by the term step and by
  `expectNumberQuestionAndAdvance`, which also waits for the stored answer (`question-delete` enabled,
  `TIMEOUTS.element`) before clicking Next, so a lost press fails at the press instead of as a 240 s timeout two
  steps later. Locally `voter-journey` passed 2/2 afterwards (`169-11-fix2-voter-journey-{1,2}`).
- Observed in run 1 besides the reds: `supabase/setup-cli@v3` installs CLI 2.118.0 in every job that uses it; image
  pulls default to `public.ecr.aws` and fall back to `ghcr.io` (§ 7). Postgres 17 (`config.toml` `major_version =
  17`) starts in CI and passes pgTAP. `release.yml` and `docs.yml` did not run (they do not trigger on
  `ci-evidence/**`); § 7 records the follow-up.
- **Run 3 is the observed run D-10 requires: every job concluded `success`**, no todo exemption used. The plan's
  verify command (`11-t3-ci.json`, allowed list `e2e-tests e2e-visual`) printed `12 jobs read`, exit 0. Its
  `performance` test passed at **4603 ms** (ttfb 707 ms) against the 5000 ms budget: green, but with less than 10 %
  margin (§ 7).
- Fix-forward budget: two iterations (runs 2 and 3), within the plan's limit.

## 5. Negative controls

### Operator rulings 2026-10-03 (between 169-07 and 169-08)

- Gate run **`169-rulings`** at `34ce0d51c` (after R1-R3): **12/12 zero**. `porcelain_lines: 1` (the new `.planning`
  todo). `04-lint`: 0 errors, 17 warnings, and the normalised list equals `07/lint-norm-after.txt`.
- `bf47b1e96` (test-only: the reactive fake `video` context) followed, so the set was re-run on the final code HEAD.
- Gate run **`169-rulings-r2`** at `bf47b1e96`: **12/12 zero**, 2026-10-03T15:42:31Z–15:44:46Z, on ESLint 10.11.0 and
  local Postgres 17.6. `porcelain_lines: 5`, all `.planning` (todo moves, evidence, handoff).
  - `01-install`: the same single `zod`/`openai` YN0060.
  - `03-typecheck` 23/23, `08-unit` 25/25 and `09-build` 14/14 executed, none cached.
  - `08-unit`: frontend 129 files / 2035 tests (169-07: 128 / 2033; the delta is the new `Layout.svelte.test.ts`, 2
    tests), with no `binding_property_non_reactive` on stderr.
  - `04-lint`: 0 errors, 17 warnings. The normalised list (33 lines) is identical to 169-07's (sorted `diff` exit 0).
  - `10-audit`: `0 new advisory(ies) at high+, 2 accepted`.
  - `12-docs-rq` (two-base form): exit 0.
- pgTAP and the SQL lint on Postgres 17.6 after a clean reset are recorded in § 6 (operator rulings, R1):
  `Files=36, Tests=1335`, PASS; `db:lint:sql` exit 0.
- Full E2E **`169-rulings`** at `bf47b1e96` on **Postgres 17.6**: `169-e2e.sh` ran `docker builder prune -af` (30.38 GiB
  free in the Docker VM), started one fresh dev server on 5273 and ran a `db:reset`. Result: **171 passed, 0 failed,
  0 flaky, 0 skipped, 0 did not run**, 4.45 min, `ENOSPC` 0. No suspected flake, so no isolation re-test was needed.
  - This is the first full suite on PG17 that counts. 169-06's PG17 run was information-only, because the SQL lint was
    red then.
  - After the run, no listener remained on 5273 and no `vite.js dev` process was alive.

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

### Dev-server restart on the root `.env` (D-18) — 169-05

Unit: `yarn workspace @openvaa/frontend vitest run vite.restartOnRootEnv.test.ts`. RED at `8fe8e3455` (exit 1,
the module did not exist yet; `05/t1-red.log`), GREEN at `f88e60568` (exit 0, 6 passed; `05/t1-green.log`):
name and `apply: 'serve'`; the watcher gets `add(<repoRoot>/.env)`; `change` and `add` of the root `.env`
each restart once; a non-normalised path to the same file restarts; `apps/frontend/.env`, `.env.example`,
`.env.local` and a source file never restart.

Live: `bash 169-restart-probe.sh <label>` (committed in the phase directory). It starts
`FRONTEND_PORT=5199 yarn workspace @openvaa/frontend dev` in its own process group, waits for Vite's ready line,
`touch`es the root `.env` (mtime only, the contents are never read), and waits 60 s for `server restarted`. Logs
`tests/e2e-runs/169-gates/<label>-dev.log`.

| When | Vite | Label | Exit | Restart log line |
|---|---|---|---|---|
| plugin wired (`f88e60568` tree) | 6.4.3 | `169-05-t1-restart` | 0 | `15.46.37 [vite] server restarted.` (touched 2026-10-03T12:46:37Z) |
| negative control: the `restartOnRootEnv(repoRoot)` entry commented out, then restored with `git checkout -- apps/frontend/vite.config.ts` | 6.4.3 | `169-05-t1-restart-negative` | **1** | none within 60 s (touched 12:46:54Z): Vite alone does not watch the repo-root `.env` |
| plugin on Vite 8 (working tree of `bf828a1da`) | 8.3.1 | `169-05-t3-restart` | 0 | `15.54.57 [vite] server restarted.` (touched 12:54:57Z). The first start took 26.6 s (`Forced re-optimization of dependencies` after the Vite move); later starts take about 0.5 s |

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

### 169-05 — SvelteKit 2.70.3, Vite 8.3.1, vite-plugin-svelte 7.3.1 (D-15 step 1, D-18, D-13)

**Kit 2.70.3, `a6495d823`.**
- The changelog from 2.55.0 to 2.70.3 marks breaking changes only for the experimental remote functions (`query.run()`,
  `requested`, refresh semantics). The repository has no `*.remote.*` file and no `remoteFunctions` setting, so
  nothing changed at source.
- `yarn install` no longer prints Kit's `typescript ^5.3.3` YN0060. The only YN0060 left is `zod` against `openai`,
  which belongs to the AI SDK and to 169-09.
- `yarn audit:deps`: the accepted `@sveltejs/kit` row 1116433 (GHSA-2crg-3p73-43xp, the `BODY_SIZE_LIMIT` DoS) left
  the findings: 6 accepted → 5, 0 new. `devalue` resolves to 5.9.4 everywhere.
- Both apps' `check` → 0 / 0. `TURBO_FORCE=true yarn build` → 0, with the same warning set as 169-04's build (sorted
  diff of warning lines → none). Frontend `test:unit` → 128 files / 2030 tests.

**Svelte floor, `830196b65`.** The catalog floor moved from `^5.53.12` to `^5.57.1`; the resolution is unchanged at
5.57.1, and the lockfile diff is the descriptor line only.

**Vite 8.3.1 + vite-plugin-svelte 7.3.1, `bf828a1da`.**
- `yarn why vite` → `vite@npm:8.3.1` only (13 consumers); `yarn why @sveltejs/vite-plugin-svelte` → 7.3.1 only. The
  docs app's Vitest-driven nested Vite is gone, so the workspace has one Vite.
- One migration fix at source: vite-plugin-svelte 7 removed the inline `hot` option. It logged `invalid plugin option
  \`hot\` in inline config` on the first unit run, which was green anyway. `apps/frontend/vitest.config.ts` now
  passes `compilerOptions: { hmr: !process.env.VITEST }`, the replacement the plugin's changelog names, and the
  warning is gone.
- No `rollupOptions`, `rolldownOptions`, `esbuild`, `oxc` or `ssr` key was added to either config (PROH-169-11).
- Both apps' `check` → 0 / 0; build → 0; frontend `test:unit` → 128 files / 2030 tests.

**One new build-time notice (not fixed, see § 7).** Vite 8 prints `(!) Your Vite config uses features that are
unsupported by configLoader: 'native'` for the three extensionless relative imports in
`apps/frontend/vite.config.ts` (`./paraglide.options`, `./vite.projectIdEnv`, `./vite.restartOnRootEnv`). The
default loader (`bundle`) is unaffected. Adding `.ts` extensions needs `allowImportingTsExtensions` in a tsconfig
the config shares with the app, so this is left as a follow-up rather than changed in a dependency commit. The
notice was not suppressed with `VITE_CONFIG_NATIVE_IGNORE_WARNING`.

**Build-output diff.** `find <app>/build -type f -exec stat -f '%z %N'`, before at `a6495d823` (Kit 2.70.3 on Vite
6.4.3 / 7.3.6) and after at the `bf828a1da` tree (Vite 8.3.1). Files `tests/e2e-runs/169-gates/05-build-before.txt`,
`05-build-after.txt` and `05-build-{before,after}-docs.txt`. Each diff was computed from those files
(`05-build-diff-frontend.md`, `05-build-diff-docs.md`). In the per-file table, content hashes are stripped from
names, and pure-hash chunk names cannot be matched across builds, so they are only counted.

Frontend (`apps/frontend/build`, adapter-node):

| Measure | Vite 6.4.3 | Vite 8.3.1 | Delta |
|---|---|---|---|
| files | 1097 | 1073 | −24 |
| total bytes | 14 457 035 | 13 511 028 | −946 007 (−6.5 %) |
| `.js` files / bytes | 434 / 4 856 508 | 425 / 4 377 001 | −9 / −479 507 |
| client chunks (`_app/immutable/chunks/*.js`) | 126 | 120 | −6 |
| client JS (`_app/immutable/**/*.js`) files / bytes | 183 / 1 559 601 | 177 / 1 480 530 | −6 / −79 071 (−5.1 %) |
| server chunks (`server/chunks/**/*.js`) | 247 | 244 | −3 |
| `.css` files | 4 | 4 | 0 |
| source maps / precompressed (`.br`, `.gz`) | 251 / 390 | 248 / 378 | −3 / −12 |

Ten largest per-file deltas (frontend):

| File (hash-normalised) | Before | After | Delta |
|---|---|---|---|
| `server/chunks/chunks/server.js-#.js` | 454 | 120058 | +119604 |
| `server/chunks/chunks/shared.js-#.js` | 194 | 58164 | +57970 |
| `server/chunks/chunks/entities.js-#.js` | 493 | 52578 | +52085 |
| `server/chunks/chunks/dataProvider.js-#.js` | 40028 | 79119 | +39091 |
| `server/chunks/chunks/utils.js-#.js` | 1131 | 39683 | +38552 |
| `server/chunks/chunks/internal2.js-#.js` | 2817 | 39124 | +36307 |
| `server/chunks/chunks/runtime.js-#.js` | 15370 | 31266 | +15896 |
| `server/chunks/entries/pages/(voters)/(located)/questions/_layout.svelte.js-#.js` | 24161 | 11253 | −12908 |
| `server/chunks/entries/hooks.server.js-#.js` | 15013 | 24530 | +9517 |
| `client/_app/immutable/nodes/4.#.js` | 13215 | 5832 | −7383 |

Notable deltas (frontend):
- The large per-file deltas are on the server side and come from Rolldown's chunking. Rolldown names shared server
  chunks after their module (`server.js`, `shared.js`, `entities.js`, …) and pulls code that Rollup had spread over
  small `index*.js` and component chunks into them. 63 named chunks exist only before (`index2.js` … `index10.js`,
  `Footer.js`, `Hero.js`, …) and 60 only after (`footer.js`, `hero.js`, `i18n.js`, `env.js`, …), lower-cased by
  Rolldown's naming. Server JS as a whole shrank.
- The client ships 6 fewer chunks and 79 KB (5.1 %) less JS.
- The main stylesheet grew from 186 506 to 191 698 bytes (+5 192, +2.8 %). The per-component CSS files were renamed
  by the new chunking (`EntityListControls.css` → `entityList.css`, `Layout.css` → `main.css`; within 70 bytes
  each).

Docs (`apps/docs/build`, adapter-static, before on Vite 7.3.6):

| Measure | Vite 7.3.6 | Vite 8.3.1 | Delta |
|---|---|---|---|
| files | 278 | 272 | −6 |
| total bytes | 8 264 555 | 8 250 311 | −14 244 |
| `.js` files / bytes | 240 / 1 074 821 | 234 / 1 055 108 | −6 / −19 713 |
| client chunks | 21 | 15 | −6 |
| `.css` files | 2 | 2 | 0 |

Ten largest per-file deltas (docs): `entry/start.#.js` 22741 → 77 (−22664, now a re-export stub; the code moved into
the shared chunks); `assets/0.#.css` 143888 → 149781 (+5893); `entry/app.#.js` 55403 → 51452 (−3951);
`nodes/0.#.js` 8408 → 7096 (−1312); `404.html` 2354 → 1999 (−355); `nodes/3.#.js` −149; `nodes/168.#.js`,
`nodes/172.#.js`, `nodes/33.#.js`, `nodes/51.#.js` −82 each. Every named file exists in both builds.

**The CSS growth (both apps), partly attributed.** Two docs-only builds with a temporary `build` key, each restored
with `git checkout -- apps/docs/vite.config.ts` afterwards (logs `05/t3-docs-*.log`):
- `cssMinify: 'esbuild'`: the main stylesheet is byte-identical to the Vite 8 default (149 781 bytes, same hash).
- `cssTarget` set to Vite 7's default (`chrome107`, `edge107`, `firefox104`, `safari16`): 154 125 bytes.

So the stylesheet size follows the CSS target, and Vite 8's raised default target is the lever that moves it.
What makes the Vite 8 output larger than Vite 7's at its own default target is UNCONFIRMED. Candidates are
Lightning CSS 1.33 (Vite 8's own) and Vite 8's CSS pipeline; the second build shows that the minifier choice alone
does not explain it. The visual gate found no pixel difference (below).

**Production-bundle smoke (added; neither the E2E suite nor the visual gate runs the production build).** The frontend
was built and served with `vite preview --port 3999` and `PUBLIC_PROJECT_ID=…0000e2`, which serves the SvelteKit
production output, on the e2e/base seed. Six routes and one immutable asset were requested. The same script ran
twice:
- on the `bf828a1da` tree (Vite 8.3.1);
- on a temporary checkout of `a6495d823`'s `.yarnrc.yml`, `yarn.lock`, both app manifests and `vitest.config.ts`
  (Vite 6.4.3). Those files were restored with `git checkout HEAD -- <the same files>` plus `yarn install`, and the
  frontend was rebuilt. `git status` afterwards showed only this ledger.

| Request | Vite 6.4.3 | Vite 8.3.1 |
|---|---|---|
| `/`, `/en` | 200 (6622 B) | 200 (6620 B) |
| `/en/elections`, `/en/info` | 200 (6628 B) | 200 (6626 B) |
| `/en/questions` | 307 | 307 |
| `/en/candidate/login` | 200 (6711 B) | 200 (6709 B) |
| `_app/immutable/entry/start.*.js` | 200 (118 B) | 200 (82 B) |
| server log `level: 50` records | 6 × `DataProvider returned an invalid result` (`reason: 'empty'`) | the same 6 |

The six `empty` records appear identically on both bundlers, so they are not a Vite 8 change. Their cause in the
preview setup is UNCONFIRMED. Logs: `05/prod-smoke-server-vite{6,8}.log`.

**Vite 8 forwards browser console errors to the dev-server terminal when it detects a coding agent**
(`server.forwardConsole` defaults to `determineAgent().isAgent`, `resolveForwardConsoleOptions` in Vite's
`node.js`). So the E2E `devserver.log` now carries 7 `(client) [console.error] … DataProvider returned an invalid
result … reason: "error"` lines that 169-04's log could not show. The suite passed 171/171. Most likely they are
newly visible rather than new, because Vite 6/7 did not forward browser console output. That was not measured
(169-04 kept no browser console log), and which tests emit them is not traced: UNCONFIRMED.

**Visual gate.** Host prerequisites: the `bf828a1da` tree built, `yarn db:reset`, `yarn db:seed --template
e2e/base`, then the frontend dev server on Vite 8.3.1 with `PUBLIC_PROJECT_ID=…0000e2` and `--host 0.0.0.0`.
`tests/scripts/visual-container.sh --run-dir tests/e2e-runs/169-05-visual`, image `eff16c30e6f3…`, Playwright 1.63.0:
**exit 0**, 7 expected / 0 unexpected / 0 flaky (4 screenshots plus setup and teardown). No snapshot changed, so
there is no re-baseline commit.

### 169-06 Task 1 — the Supabase CLI 2.118.0 and the regenerated `database.ts` (D-10), commit `cb14c57d2`

**Order.** `yarn db:stop` → `yarn db:start` (new images) → `yarn db:reset` (exit 0, `Applying migration
00001_initial_schema.sql`, seed, both storage buckets) → `yarn db:types` (exit 0) on that fresh reset, **before** any
pgTAP run → pgTAP → `db:lint:sql`. Before/after copies: `tests/e2e-runs/169-gates/06/t1-database-{before,after}.ts`.

**The `database.ts` diff (18 hunks, +27 / −100).** No migration, schema or seed file changed in the commit
(`git diff HEAD~1 HEAD --stat -- apps/supabase/supabase/{migrations,schema,seed.sql}` prints nothing), so every hunk
comes from the generator. postgres-meta moved v0.96.1 → v0.99.0, and v0.99.0's one feature is "consume
@supabase/postgrest-typegen for type generation" (supabase/postgres-meta#1084, release 2026-08-31). A
whitespace-insensitive token diff (`06/t1-database-semantic.diff`) splits the hunks into three kinds:

| Kind | Hunks | What changed | Why |
|---|---|---|---|
| Layout | 16 | Short object types (`graphql`'s args, most `Functions` `Args` blocks, `_bulk_upsert_record`, `delete_storage_object`, `get_localized`, `is_valid_choice_id`, `jsonb_recursive_merge`, `merge_jsonb_column`, the `DatabaseWithoutInternals` helper generics, …) are emitted on one line; Prettier keeps an object on one line when its input has no newline after `{` and it fits 120 columns. The token diff shows only a dropped `;` before `}` | the new typegen's printer |
| `NonNullable<Json>` | 1 (Row / Insert / Update of `app_settings.settings`) | `Json` → `NonNullable<Json>` | `app_settings.settings` is the schema's only `jsonb NOT NULL` column (`106-app-settings.sql`). `Json` includes `null`, so the new typegen narrows NOT NULL json columns. That is more accurate, and no write site passes `null` |
| `never` | 1 (Insert and Update of `nominations.entity_type`) | `Database['public']['Enums']['entity_type']` → `never` | `nominations.entity_type` is `GENERATED ALWAYS AS (…)` (`104-nominations.sql`), so Postgres refuses any written value. The new typegen marks generated columns unwritable. That is more accurate, and no write site sets it |

`TURBO_FORCE=true yarn typecheck` on the regenerated file → exit 0, 23/23 tasks (`06/t1-typecheck.log`), so no
consumer wrote `entity_type` or a `null` setting. `prettier --check` on the three edited files → clean. CI's
`supabase-tests` drift check regenerates with the same CLI version, because the six `setup-cli` pins equal the
lockfile.

**pgTAP and lint after the CLI commit** (stack on the 2.118.0 images, PG 15.8.1.085):
- `yarn workspace @openvaa/supabase test:db > tests/e2e-runs/169-gates/06-t1-pgtap.log` → **exit 0**: `Files=36,
  Tests=1335`, `Result: PASS`, 0 lines starting `not ok`. The census file `36-entity-identity.test.sql` is listed
  `ok`, the same count as 166-04's run.
- `yarn db:lint:sql` → **exit 0**: `db lint` `{"results":[]}`; Splinter-derived schema lint `0 error(s), 3
  warning(s)`, the same as 166's (`06/t1-db-lint.log`).
- `yarn workspace @openvaa/dev-seed vitest run tests/rpcNullabilityGate.test.ts` → **exit 0**, 9/9. That run
  includes "the Supabase CLI that CI pins is the one the workspace resolves" (six pins = `supabase@npm:2.118.0`).
- `yarn audit:deps` → exit 0, `0 new advisory(ies) at high+, 2 accepted` (`@faker-js/faker` 1158500, `braces`
  1240992). The three `tar` rows via `supabase@2.83.0` are now among the 66 stale ids left for 169-13.
- `config.toml` warns `config section [inbucket] is deprecated. Please use [local_smtp] instead` on every CLI call
  (§ 7).

### 169-06 Task 2 — the PG17 SQL-lint red and where it comes from

**The finding.** On the PG17 stack, `supabase db lint --schema public --fail-on warning` reports `public.is_valid_choice_id`
(`011-validation-functions.sql`, mirrored in `00001_initial_schema.sql`). The function is declared `LANGUAGE plpgsql
IMMUTABLE`, and its body calls `jsonb_agg` and `jsonb_build_array`, which `pg_proc` marks `s` (STABLE).

**Attribution probe** (`06/t2-probe.sh`, `06/t2-plpgsql-check-probe.log`): throwaway containers with no published
port and only a read-only bind mount of the log directory, which exit when the probe finishes: `docker run --rm
--name probe_openvaa-local --user postgres -v <06 dir>:/probe:ro --entrypoint bash <image> /probe/t2-probe.sh`. Each probe ran `initdb`, `create extension plpgsql_check`, loaded only
this function's `CREATE` statement from the schema file, then ran `plpgsql_check_function(…, format:='json')`, the
call `supabase db lint` makes.

| Image | Postgres | plpgsql_check | Result |
|---|---|---|---|
| `postgres:15.8.1.085` | 15.8 | 2.7 | no issues |
| `postgres:17.6.1.171` | 17.6 | 2.8 | the same two warnings |

`provolatile` for `jsonb_agg(anyelement)`, `jsonb_agg_transfn`, `jsonb_build_array("any")` and `jsonb_build_array()` is
`s` on **both** 15.8 and 17.6. The functions' volatility did not change. What changed is that the PG17 image's checker
now reports the mismatch. The red is attributable to the Postgres commit, through the image it selects. Whether
plpgsql_check 2.8 or a PG17 planner change makes the checker see it is **UNCONFIRMED**: each image bundles one
checker version, and the upstream source was not traced to a commit.

**Why it was not fixed here.** The finding is real: an IMMUTABLE function calls STABLE functions. The only caller,
`validate_answer_value`, is VOLATILE, and no index, generated column or other IMMUTABLE function depends on it. A fix
means editing a schema file and the migration, either by marking it `STABLE` or by rewriting the body to use only
immutable operators. PROH-169-12 forbids that edit, and so do the plan's empty migrations/schema/seed diff and its
"no migration or schema file changed in this phase" truth. Silencing it (`--fail-on`, an ignore) would weaken a gate.
The plan has no hold provision for D-14, which is an operator overrule, so execution stopped for an operator decision
(§ 7).

**Option A checked two ways.**
- Call sites (orchestrator check, confirmed by `git grep -n is_valid_choice_id -- apps/supabase packages`): the only
  references are two calls inside `validate_answer_value`'s plpgsql body, plus comments. No index, constraint or
  generated column uses the function. `validate_answer_value` is VOLATILE, so declaring `is_valid_choice_id` STABLE
  is legal and cascades nowhere.
- Probe (`06/t2-probe-stable.sh`, `06/t2-option-a-probe.log`): the same function declared `STABLE`, loaded alone into a
  throwaway `postgres:17.6.1.171` container, gives **no issues** from plpgsql_check 2.8.

### 169-07 — supabase-js 2.117.2, ssr 0.12.7 and the Edge Function pins (D-22, D-09)

**supabase-js 2.117.2 (`3f4fe2ebf`).**
- Lockfile: the diff (44 insertions, 50 deletions) stays inside the supabase-js family (§ 2). `yarn why
  @supabase/supabase-js` lists one 2.117.2 for the root, `@openvaa/frontend` and `@openvaa/dev-seed`. The root's
  direct range is now `catalog:`.
- Two behaviour changes in postgrest-js surfaced, and both were adapted in the same commit:
  - **Row-type inference on `upsert`.** `upsert<Row extends Insert>(values: RejectExcessProperties<Insert, Row> | …)`
    is new. With the untyped admin client, `Insert` is `any`, and from the inline `{ [target.parentColumn]: …,
    [target.childColumn]: … }` TypeScript infers `Row = string`. The call then fails with TS2345 (`'{ [x: string]:
    string; }' is not assignable to … RejectExcessProperties<any, string>`). Naming the row `Record<string, string>`
    fixes the inference. Runtime behaviour is unchanged.
  - **Read retries.** `fetchWithRetry` retries a GET/HEAD whose fetch rejects, up to `DEFAULT_MAX_RETRIES = 3` times
    with `1000 * 2 ** n` ms back-off, and on a 503 or 520 answer.
    - The teardown CLI's first call past the locality guard is a read. Against an unreachable host it now reports
      "Cannot reach Supabase" after about 7 s; measured `secs=7` for `teardown.ts` against `http://127.0.0.1:9`.
    - The three guard tests asserting that message ran into Vitest's 5 s default. They now carry a 30 s budget,
      `PAST_TEARDOWN_GUARD = { timeout: 30000 }`. No assertion changed.
    - The seed CLI's first call is an RPC POST, which is not retried, so its cases stay fast.
    - Side effect: the CLIs now ride out the 503 PostgREST answers while its schema cache loads after a reset.

**ssr 0.12.7 (`9075a027b`).**
- `SetAllCookies` gains a second argument, `headers: Record<string, string>`. A server client passes it with the first
  cookie write and then `{}` (0.12.6: once per client). The values are `Cache-Control: private, no-cache, no-store,
  must-revalidate, max-age=0`, `Expires: 0` and `Pragma: no-cache`.
- `createSupabaseCookieAdapter` now forwards them through `event.setHeaders`, each lower-cased name at most once per
  adapter. One adapter serves one request: `hooks.server.ts` is the only caller of `createSupabaseServerClient`, and no
  route calls `setHeaders` itself (`git grep -n setHeaders -- apps/frontend/src` outside tests finds only the adapter).
- **Old sessions are still read; no sign-out on deploy.** The 0.12.7 and 0.9.0 tarballs were compared:
  - both default `cookieEncoding` to `"base64url"`;
  - both write `"base64-" + base64url(value)`;
  - both decode prefixed and unprefixed values;
  - `utils/chunker.js` is identical (`MAX_CHUNK_SIZE = 3180`, `.0`/`.1` names).
  - The base64url+length encoding listed in the 0.12.0 notes was reverted in the same release train (#100), and the new
    `cookies.encode: "tokens-only"` is opt-in and not used here.
- `browser.ts` passes no options, so the changelog renames nothing it uses.

**Edge Function pins (`cce9b5b16`).**
- Before:
  - `https://esm.sh/@supabase/supabase-js@2` (floating) in all three functions;
  - `https://deno.land/x/jose@v5.9.6/index.ts` in `identity-callback`;
  - `npm:nodemailer@6.9.10` in `send-email`.
- After:
  - `npm:@supabase/supabase-js@2.117.2` in all three;
  - `npm:jose@6.2.12` in `identity-callback`;
  - nodemailer unchanged (held, § 3).
- `git grep -n -E "from '(https://esm\.sh|https://deno\.land)"` and the major-only `npm:` pattern both find nothing.
- jose 6 needs no code change here:
  - `decodeProtectedHeader`, `importJWK`, `compactDecrypt`, `jwtVerify`, `createRemoteJWKSet`, `JWK` and `JWTPayload`
    all keep their names;
  - `importJWK` resolving to `CryptoKey | Uint8Array` is what `compactDecrypt` accepts;
  - the removed algorithms (RSA1_5, Ed448/X448, secp256k1) are not used. The test JWE uses `RSA-OAEP-256`, the
    frontend's tests use RSA-OAEP and RSA-OAEP-256, and the code's fallback is `'RSA-OAEP'`.
- The `// reason:` comment on the untyped admin client now gives a reason that is true for an `npm:` import: no
  generated `Database` type, and nothing type-checks the file.
- The docblocks in `envReadSites.test.ts` and both `flowConformance.test.ts` files, and the two byte-identical
  `callerAuthority.ts` copies, now describe `npm:` specifiers that only Deno resolves, without quoting a version.
- The `verifyConfig.test.ts` "version skew" paragraph now says what is true and enforced: the new case `the jose this
  file runs › is the exact version the Edge Function pins` compares `npm:jose@<v>` in `index.ts` with the installed
  `jose/package.json`.
- The 168-06 F7 nonce finding is in the SvelteKit OIDC callback (`apps/frontend/src/routes/api/oidc/callback`), not in
  `identity-callback/index.ts`, so these edits do not touch it.

### Operator rulings 2026-10-03 — applied between 169-07 and 169-08 (`169-RULINGS-SUMMARY.md`)

The operator gave four rulings in chat to the orchestrator on 2026-10-03; an executor applied them on HEAD `59be299ca`.
Evidence files are under `tests/e2e-runs/169-gates/rulings/` (gitignored).

**R1 — local Postgres 17 with option A (overrules PROH-169-12 for this one fix).**

- `f1ac8164a` fix(supabase): `public.is_valid_choice_id` `IMMUTABLE` → `STABLE` in `schema/011-validation-functions.sql`
  and the generated `migrations/00001_initial_schema.sql`, applied from `06/t2-option-a-stable.patch`. Checks:
  - `assert:schema-migration-parity`: 26 schema files → 6372 lines = `00001` 6372 lines, generated copy current;
  - `assert:comment-hygiene` 0; Prettier clean.
- Stack switch, this project only:
  - Before: 13 `*_openvaa-local` containers plus the unrelated `my-redis` (`r1-containers-before.txt`).
  - `yarn db:stop`, then `supabase stop --no-backup` (`{"project_id_filter":"openvaa-local","backup":false}`).
    Afterwards only `my-redis` runs and no `openvaa` volume is left.
  - `docker builder prune -af` reclaimed 0 B. 30.70 GiB free in the Docker VM.
  - `yarn db:reset` (scratch `DOCKER_CONFIG`) exit 0.
- Measured on the fresh reset:
  - `show server_version` = `17.6` on `public.ecr.aws/supabase/postgres:17.6.1.171`, and
    `apps/supabase/supabase/.temp/postgres-version` is absent.
  - `pg_proc.provolatile` for `is_valid_choice_id` = `s`.
  - `yarn db:types` exit 0, and `packages/supabase-types` shows no diff.
  - pgTAP: `Files=36, Tests=1335`, `Result: PASS`, `36-entity-identity.test.sql … ok`, no `not ok`.
  - `yarn db:lint:sql` exit 0: `No schema errors found`, `{"results":[]}`. The Splinter-derived summary is
    `0 error(s), 3 warning(s)` (the three unindexed foreign keys), the same as the PG15 run in `06/t1-db-lint.log`.
- `bfdc1afc3` chore(supabase): local Postgres 17 (`config.toml` from `06/t2-pg17-config.patch`).

**R2 — ESLint 10 (overrules PROH-169-07 for exactly three lines).** `34ce0d51c`:

- **Age rule, re-measured 2026-10-03T15:30Z:** `eslint` 10.11.0 (2026-09-18, 14.80 d) is the newest 10.x at least 7 days
  old; 10.12.0 is 0.81 d old. `@eslint/js` 10.0.1 (238.71 d).
- **Peers admit `eslint` 10** (`r2-peers.txt`): `@typescript-eslint/*` 8.70.1 `^8.57.0 || ^9.0.0 || ^10.0.0`;
  `eslint-plugin-unused-imports` 4.4.1 `^10.0.0 || …`; `eslint-plugin-playwright` 2.12.0 `>=8.40.0`;
  `eslint-config-prettier` 10.1.8 `>=7.0.0`; `eslint-plugin-svelte` 3.23.0 `… || ^10.0.0`; `eslint-plugin-import-x`
  4.17.1 `… || ^10.0.0`; `eslint-plugin-simple-import-sort` 14.0.0 `>=5.0.0`. `svelte-eslint-parser` 1.8.1 declares no
  `eslint` peer.
- **Install:** `yarn install` exit 0, with the same single `zod`/`openai` YN0060 as before. New lockfile names:
  `@cacheable/memory`, `@cacheable/utils`, `@keyv/bigmap`, `@keyv/serialize`, `@types/esrecurse`, `cacheable`,
  `hashery`, `hookified`, `qified`. That is the same nine names 169-03 measured and legitimacy-checked
  (`03/t2c-new-names.txt`, `03/t2c-legit.json`). Gone: `@eslint/eslintrc`, `callsites`, `import-fresh`, `json-buffer`,
  `lodash.merge`, `parent-module`. `yarn dedupe --check` 0.
- **Flag removal:** the saved `03/t2c-eslint10-config.patch` applied cleanly to every file except `.yarnrc.yml`.
  That file's context had moved in later plans, so its two catalog lines were edited by hand.
  - Population, re-derived live with `git grep -n -e v10_config_lookup -- ':!.planning'`: 21 lines in 18 files.
    169-03 counted 19.
  - After the change the grep finds nothing (exit 1).
  - Prettier collapsed the shortened `.lintstagedrc.json` array onto one line.
- **Findings on ESLint 10 before the disables:** the 17 baseline warnings plus exactly the four expected errors
  (`r2-lint-raw.log`):
  - `OpinionQuestionInput.svelte:50:5`, `Video.svelte:132:5` and `EntityList.svelte:45:5`, all `no-useless-assignment`;
  - `Layout.svelte:42:7` `no-unassigned-vars`.
- **Disables:** one comment each, directly above the three props inside the `$props()` destructuring:
  `// eslint-disable-next-line no-useless-assignment -- false positive on write-only $bindable prop; remove when
  https://github.com/sveltejs/eslint-plugin-svelte/issues/1478 is fixed`. ESLint reports none of them as unused.
  `git grep -n 'eslint-disable-next-line no-useless-assignment'` finds exactly 3.
- **After the disables and R3:**
  - `TURBO_FORCE=true yarn lint:check` exit 0.
  - The normalised list (33 lines; 0 errors, 17 warnings) equals `07/lint-norm-after.txt` (sorted `diff` exit 0).
  - **Delta against the prior list: none.** The four ESLint-10 errors were absorbed by the three disables and the R3
    source fix.
- **Proofs on 10.11.0:**
  - `169-planted-import-rules.sh import-x` exit 0, 4/4 fired.
  - The four `eslint-*-guard.test.ts` specs: 4 files, 385 tests, passing. Per-file counts 30 / 88 / 91 / 176 equal
    169-03's ESLint-10 run, which also included the 5-test `spike-scaffolding.test.ts`.

**R3 — drawer focus return wired (WCAG 2.4.3).**

- `05f88a2a6` (RED) adds `apps/frontend/src/lib/layouts/main/Layout.svelte.test.ts`. It mounts `Layout` for real
  against fake contexts and covers both close paths, `LayoutContext.navigation.close()` and the overlay click.
  - Two of two failed: `expected <button …(2)> to be <button …(5)>`. Focus stayed on `#drawerCloseButton`.
- `e3a661517` (GREEN):
  - `Header`'s `drawerOpenElement = $bindable()`;
  - `Layout`'s `let drawerOpenElement = $state<HTMLButtonElement>()` with `bind:drawerOpenElement`;
  - the `closeDrawer()` docblock corrected.
  - Result: 2 of 2 pass, and `svelte-check` reports 0 errors / 0 warnings.
- `bf47b1e96` makes the fake `video` context a `$state` object. The plain object had caused
  `binding_property_non_reactive` dev warnings on stderr.
  - Re-checked: still RED against the pre-fix `Layout` / `Header` (restored from `05f88a2a6` for one run, then put back
    with `git checkout -- <file>`), and GREEN with no stderr at HEAD.
- Rendered pixels: unchanged. The fix only changes which element `focus()` targets after a close. No visual spec opens
  or closes the drawer, so no visual gate was run.

**R4 — browser support floor.** No code change. Recorded in § 7.

**Optional R5 — voter-journey Base-6 slider race.** Left deferred, because the cause is still UNCONFIRMED and the
suggested wait may not fix it. The reasoning is in `deferred-items.md`.

### 169-08 — `@faker-js/faker` 10.6.0 and the seed diff at the same seed (D-20), commit `5c338398f`

**Method.** A scratch script (`tests/e2e-runs/169-08-faker/dump-seed.ts`, gitignored) does what the seed CLI does
before it writes: `BUILT_IN_TEMPLATES[name]`, `BUILT_IN_OVERRIDES[name]`, `runPipeline(template, overrides)`, then
`fanOutLocales(rows, template, seed)`. It runs one template per process, as the CLI does, because generators mutate a
template's `fixed[]` in place. It writes key-sorted JSON plus the per-table row counts, offline (no Writer, no
database). Both templates run at their own seed, 42. A second `before` run was byte-identical to the first (`cmp`), so
the instrument itself is reproducible. `diff-seed.mjs` matches rows by index and counts differing leaf values.

**Row counts per table: identical before and after, for both templates.**

| Table | `default` 8.4.1 → 10.6.0 | rows with a changed value | changed leaves | `e2e/base` 8.4.1 → 10.6.0 | changed leaves |
|---|---|---|---|---|---|
| elections | 1 → 1 | 0 | 0 | 2 → 2 | 0 |
| constituency_groups | 1 → 1 | 0 | 0 | 2 → 2 | 0 |
| constituencies | 5 → 5 | 0 | 0 | 6 → 6 | 0 |
| organizations | 8 → 8 | 0 | 0 | 5 → 5 | 0 |
| alliances | 2 → 2 | 0 | 0 | 2 → 2 | 0 |
| factions | 0 → 0 | 0 | 0 | 0 → 0 | 0 |
| question_categories | 4 → 4 | 0 | 0 | 8 → 8 | 0 |
| questions | 26 → 26 | 26 | 126 | 26 → 26 | 0 |
| candidates | 327 → 327 | 327 | 6 893 | 30 → 30 | 0 |
| nominations | 377 → 377 | 0 | 0 | 61 → 61 | 0 |
| app_settings | 1 → 1 | 0 | 0 | 1 → 1 | 0 |
| accounts, projects, feedback | 0 → 0 | 0 | 0 | 0 → 0 | 0 |

- **`e2e/base` is byte-identical** (sha256 `b8958a28…` before and after). Every row it emits is a fixed row, so no
  faker value reaches it.
- **Which templates can change at all.** Every built-in template was run under 10.6.0 at its seed and at seed + 1
  (`seed-sensitivity.ts`, `seed-sensitivity.txt`). Only `default` changes with the seed. The other 30 (`e2e/base` and
  every `perm-*` / `show-feedback-survey`) are seed-independent, so the faker major cannot have changed what they
  write. The E2E suite and the visual gate seed only those templates. `default` is seeded by `yarn db:seed`, the
  `@probe` spec (excluded from the gate) and the dev-seed integration test.
- **`default`: what changed** (same seed, new values; Faker 9 moved to a 53-bit Mersenne randomiser):
  - `candidates.first_name` (326 rows) and `last_name` (325 rows); 325 distinct full names now, 326 before.
  - `candidates.answersByExternalId.*.value`: 6 242 leaves across the 26 questions (ordinal, categorical and the
    multiple-choice `seed_q_025` arrays).
  - `questions.name.{en,fi,sv}` (26 each), `choices[].label.en`, `custom_data.terms[]` content / title / triggers.
  - The choice count of four `singleChoiceCategorical` questions, which `QuestionsGenerator` draws from faker:
    `seed_q_018` 5 → 4, `seed_q_019` 3 → 5, `seed_q_020` 3 → 5, `seed_q_021` 3 → 4. This is a value inside a JSONB
    column, not a row; the table shapes are unchanged.
- **Three sample differences** (`default`, seed 42):
  1. `seed_cand_0000` name: `Garnet Wiegand` → `Nikita Crist`.
  2. `seed_cand_0000` answer to `seed_q_000`: `"4"` → `"1"`.
  3. `seed_q_000` `name.en`: `Theca virga auctus synagoga tergum patruus patria armarium?` → `Virga synagoga patruus
     armarium armarium adsum usitas paulatim?`
- **No call-site migration.** Every faker API dev-seed calls (`person.firstName/lastName`, `company.name/buzzNoun`,
  `lorem.sentence/word/words`, `word.adjective/noun` with no length options, `number.int/float` with `min`/`max`,
  `datatype.boolean`, `date.recent/future` with `refDate`, `location.country/state`, `color.rgb`) exists in 10.6.0
  with the same arguments; `yarn workspace @openvaa/dev-seed typecheck` exit 0. The word module's `'fail'` length
  strategy does not apply, because no `faker.word.*` call passes a length.
- **`ctx.ts` comment.** 10.6.0's `FakerOptions` has `seed?: number` (since 10.5.0). Measured: `new Faker({ locale:
  [en], seed: 42 })` and `new Faker({ locale: [en] }).seed(42)` yield the same sequence. The comment now says so, and
  that `.seed()` stays because `makeLocaleFaker` and the tests seed the same way. The old text said the option did not
  exist in v10, which was false for the installed version.
- **Tests.** `yarn workspace @openvaa/dev-seed test:unit` 66 files / 901 tests pass with **no expectation changed**:
  the determinism cases hold run to run on 10.6.0, and no unit test pins a generated `default` value. The live
  `default-template.integration.test.ts` (PG17 local stack) passes 3/3: 327 candidates written, the operation budget
  met, anon reads OK.
- **Visual and E2E traces.** None needed: the templates they seed are byte-identical (see § 4 for the runs).

### 169-09 — the AI SDK majors in `packages/llm` (D-21), commits `0bf2782a7` and `32a0eed8a`

The import surface at execution (`git grep -n -E "from '(ai|@ai-sdk/[a-z-]+)'" -- ':!.planning'`): four `packages/llm/src`
files plus `index.ts`'s type re-export, and `packages/llm/tests/llmProvider.test.ts`. The migration followed the 6.0
and 7.0 guides bundled in the installed package (`node_modules/ai/docs/08-migration-guides/`), by hand:

| SDK change (guide section) | Where it bites | What changed |
|---|---|---|
| `createGoogleGenerativeAI` → `createGoogle` (7.0, Google provider; old name kept as a deprecated alias) | `llmProvider.ts` `initProvider` | uses `createGoogle` |
| `generateObject` deprecated for `generateText({ output: Output.object(...) })` (6.0) — **still exported in 7.0.116** | `llmProvider.ts` `generateObject` | kept, per the plan's "else keep it". The zod schema is still passed and still validates; `NoObjectGeneratedError` still drives the validation retry (smoke run below) |
| **System messages in `messages` are rejected by default** (7.0, "Prompt Messages") | every caller: `argument-condensation` (`condenser.ts`, two calls) and `question-info` (`infoGeneration.ts`) send their whole prompt as `[{ role: 'system', content: promptText }]` | `generateObject` passes `allowSystemInMessages: true`. Moving the prompt to `instructions` is not possible without rewriting the callers' prompts as a user turn: `standardizePrompt` throws `messages must not be empty` for `instructions` with no message. The callers' unit tests mock `LLMProvider`, so **no existing test would have caught this**; it would have failed every admin condensation and question-info job at runtime |
| `system` → `instructions` (7.0; `system` kept as a deprecated fallback) | `llmProvider.ts` `streamText` | passes `instructions: options.instructions ?? options.system`; `streamText` stays on the SDK default (system messages in `messages` rejected) — it has no caller outside the tests |
| `cachedInputTokens` / `reasoningTokens` removed from `LanguageModelUsage` (6.0 deprecation, 7.0 removal) | `costCalculation.ts` | reads `inputTokenDetails.cacheReadTokens` and `outputTokenDetails.reasoningTokens`. Before this, the reasoning and cached-input costs were read from fields 7.0 no longer has |
| `LanguageModelUsage` gained required `inputTokenDetails` / `outputTokenDetails` | `condenser.ts` builds `llmMetrics.tokens` (typed `TokenUsage`) from per-call totals | adds the two detail objects with `undefined` members (the per-call records keep only totals). `TokenUsage` stays the SDK type, re-exported under the same name |
| `CallSettings` → `LanguageModelCallOptions & Omit<RequestOptions, 'timeout'>` (7.0; old name deprecated) | `provider.types.ts` | a local `CallSettings` alias with that definition; the public option types keep their names |
| `StreamTextResult` takes `<TOOLS, RUNTIME_CONTEXT, OUTPUT>` | `provider.types.ts` `LLMStreamResult` | `StreamTextResult<NonNullable<TOOLS>, Record<string, unknown>, never>` (`Context` is not exported from `ai`) |
| `usage` on `streamText` now totals all steps (7.0) | `streamText` cost promise | no code change; a multi-step tool loop is now charged for every step, not only the last |
| OpenAI `strictJsonSchema` defaults to `true` (6.0) | structured output on OpenAI | no change needed: the callers' schemas (`ResponseWithArgumentsSchema`, `chooseQInfoSchema`) have only required fields, which strict mode accepts. Strict mode makes the provider enforce the schema too; our zod parse still runs |

**Tests.** `llmProvider.test.ts` mocks now use the 7.0 shapes (a `makeUsage()` helper for the full usage record; the
seven new `StreamTextResult` members, typed `as never` rather than with new `any` disables). Added cases: the Google
factory is `createGoogle`; `generateObject` forwards `allowSystemInMessages: true` with a system-only prompt;
`system` → `instructions` and `instructions` wins over `system`; and the **real** `calculateLLMCost` on the 7.0 usage
shape (cached input from `cacheReadTokens`, reasoning from `outputTokenDetails`). The test file also typechecks clean
against 7.0 under an ad-hoc `tsc` run that includes `tests/` (the package tsconfig excludes them). `eslint-disable`
count in the file: 61 before, 61 after.

**Smoke run against the real 7.0 runtime (no network, no API key).** A throwaway script (deleted after the run) built
`LLMProvider` from `dist/`, replaced its provider with `MockLanguageModelV4` from `ai/test`, and called it:
- `generateObject` with `[{ role: 'system', content: 'Condense these.' }]` and `ResponseWithArgumentsSchema`'s shape →
  the object came back parsed, the model saw one `system` message, and `usage` carried the detail objects.
- The same call where the model returns `{"arguments":"nope"}` with `validationRetries: 2` → `Failed to generate
  object after 2 validation attempts. Last error: No object generated: …`, i.e. the zod schema still rejects a
  non-conforming object and the retry path still keys on `NoObjectGeneratedError`.
- Plain `generateObject` from `ai` with a system message and no opt-in → `Invalid prompt: System messages are not
  allowed in the prompt or messages fields. Use the instructions option instead.` (the runtime hazard above,
  confirmed).
- `LLMProvider.streamText` (provider `google`) with `system: 'Be brief.'` → streamed `Hello`; the model saw
  `[["system","Be brief."],["user","Hi"]]`; the cost promise resolved.

**Results before the gates** (`0bf2782a7` working tree): `@openvaa/llm` build 0 and 43/43 tests;
`argument-condensation` 30/30; `question-info` 22/22; `apps/frontend` `src/lib/server/admin/` 42/42;
`TURBO_FORCE=true yarn typecheck` 23/23 tasks. After `32a0eed8a` (`openai` removed): `llm` build 0, 43/43; the
`YN0060` warning about `zod` against `openai` is gone from `yarn install`.

**Security read of the migrated paths (T-169-30).** `initProvider` hands `config.apiKey` only to `createOpenAI` /
`createGoogle`. The error paths are unchanged in what they print: `Unsupported provider: <name>`, `Failed to generate
object after N validation attempts. Last error: <SDK message>`, and the original SDK error rethrown for non-validation
failures. None logs `config`, the key or the provider object. `getModelPricing` logs only provider and model names.
The admin features (`condenseArguments.ts`, `generateQuestionInfo.ts`) record `(error as Error).message` and
`jobRecord.recordFailure(error)` as before; neither changed. 7.0 also stops putting request and response bodies on
results by default (7.0, "Request and Response Bodies Are Excluded by Default"). The `allowSystemInMessages` opt-in
admits only the `system` entries the callers build server-side from prompt templates; no caller passes user-authored
message arrays, so this restores the 5.x behaviour without adding a path for role injection.

### 169-10 — the small majors, one commit each (D-23, D-13)

| Commit | Upgrade | Lockfile names (new / gone / moved) | Code or config change |
|---|---|---|---|
| `797196ee4` | `concurrently` 9.2.4 → 10.0.5 | gone `require-directory`; moved `yargs` 18, `yargs-parser` 22, `cliui` 9, `supports-color` 10 | none. 10.0.0 dropped Node < 22, went ESM-only, removed `--name-separator` and the `killOthers` API option, and defaults prefix colours to automatic; `_dev:concurrent` sets `-c blue,green` explicitly and uses none of the removed options |
| `893da1fdd` | `lint-staged` 16.4.0 → 17.6.0 | gone `listr2` and its renderer (`ansi-escapes`, `cli-cursor`, `cli-truncate`, `colorette`, `eventemitter3`, `log-update`, `restore-cursor`, `rfdc`, `slice-ansi`, …) and `commander` 14 | none. 17 needs Node ≥ 22.22.1 and Git ≥ 2.32 (host Git 2.50.1), makes `yaml` optional (the config is JSON) and keeps the JSON config format |
| `40a426cb1` | `@changesets/cli` 2.31.1 → 3.0.3, `@changesets/changelog-github` 0.6.0 → 1.0.1 | 13 new (§ 2, 169-10), 48 gone (among them `micromatch`, `braces`, `fill-range`, `to-regex-range`, `is-number`, `fast-glob`, `globby`, `fs-extra` 7/8, `enquirer`, `@inquirer/external-editor`, `spawndamnit`, `node-fetch` 2, `prettier` 2.8.8, `js-yaml` 3, `@types/node` 12, `dotenv` 8), 37 moved | `.changeset/config.json` `$schema` → `@changesets/config@4.0.1/schema.json`. Every key is valid under config 4 (`baseBranch`, `access`, `ignore`, `fixed`, `linked`, `updateInternalDependencies`, `privatePackages`, `changelog`, `commit`); there is no `prettier` key to migrate; `privatePackages: { version: true, tag: false }` stays explicit, so the new "private packages not versioned by default" does not change behaviour |
| `e268a7d19` | `glob` 11.1.0 → 13.0.6 (root and `apps/docs`) | gone `jackspeak`, `@isaacs/cliui`, `foreground-child`, `package-json-from-dist`, `signal-exit` 4 | none. 12 removed the CLI's unsafe `--shell`, 13 moved the CLI to `glob-bin`; the promise API (`import { glob } from 'glob'`) in the five docs scripts is unchanged, and nothing runs the glob CLI |
| `876970adb` | `@types/cheerio` 0.22.35 removed | gone `@types/cheerio`; `@types/node` 26.6.3 and `undici-types` 8 (pulled only by the stub's `@types/node: *`) | none |
| `d1b3332d5` | `js-yaml` 4.3.2 → 5.4.2 (catalog), `@types/js-yaml` dropped from the catalog and `packages/llm` | gone `@types/js-yaml`; `js-yaml` now resolves once (5.4.2) | none in `promptRegistry.ts`: `import * as yaml from 'js-yaml'` + `yaml.load(content)` works on 5's named exports and keeps the default safe load (CORE_SCHEMA, no custom tags). The 5.0 change "`load()` throws on empty input" lands in `scanDirectory`'s existing per-file `try/catch`, which warns and skips the file as before |
| `5017d4a17` | `globals` 15.15.0 → 17.12.0 (catalog), plus `globals: catalog:` in `@openvaa/shared-config` | `globals` 15.15.0 gone; `eslint-plugin-svelte` keeps its own 16.5.0 | `packages/shared-config/package.json` declares the `globals` its `eslint.config.mjs` imports (Rule 2 deviation; resolves todo `2026-10-02-declare-globals-in-shared-config.md`) |

**changesets on the new major.** `yarn changeset status` prints `🦋 changeset v3.0.3` and `Some packages have been
changed but no changesets were found`, exit 1 (`t2-cs-status.log`). That is the CLI's documented outcome when the
branch has package changes and no changeset; 2.x has the same branch and exit code
(`packages/cli/src/commands/status/index.ts` at `@changesets/cli@2.29.7`: `if (changedPackages.length > 0 &&
changesets.length === 0) { … process.exit(1) }`), and this branch is far ahead of `main` with no `.changeset/*.md`.
`yarn changeset status --since=HEAD` exits 0 (`Packages to be bumped:` with an empty list), and config 4's
`readConfig(cwd, packages)` returns `warnings: []`, `errors: undefined` with the expected `changelog`,
`privatePackages` and `baseBranch` (`t2-cs-readconfig.log`). `@changesets/changelog-github` 1.0.1 imports and exposes
`getReleaseLine` / `getDependencyReleaseLine`. `release.yml`'s `changesets/action@v1` only calls `changeset version`
when changesets exist, so 3.0's "`version` exits 1 with no changesets" does not affect it; the action's own major is
169-11's.

**js-yaml 5 parses every prompt file to the same value.** A throwaway script loaded all 31 tracked prompt YAML files
(`git ls-files 'packages/*/src/**/*.yaml'`: 28 under `argument-condensation`, 3 under `question-info`) with the
`js-yaml` that `packages/llm` resolves, once on 4.3.2 before the bump and once on 5.4.2 after it, and wrote the
results as JSON. The two outputs are byte-identical (sha256 `c631134c38ae…527568c` both). None of the files uses `<<`
merge keys, `!!` tags or date-like scalars, the three places where 5.0's CORE_SCHEMA default differs from 4's.
T-169-33: the loader keeps `yaml.load` with its default schema; no unsafe or custom schema was introduced.

**globals 17 and the lint config.** `@openvaa/shared-config` imported `globals` without declaring it, so every
workspace linting through it got whichever `globals` was hoisted to the root (15.15.0 before this plan, 15.14.0
after 167-04, 16.5.0 before that). With the declaration, both `@openvaa/shared-config` and `apps/frontend` resolve
17.12.0. `eslint --print-config` on `apps/frontend/src/lib/i18n/overrides.ts` and on `packages/core/src/index.ts`
shows 1227 `languageOptions.globals` names, against 1151 for `browser` + `node` + `jest` from 15.15.0 (read from the
Yarn cache copy). 84 names were added; 8 were removed: the audio-worklet scope names (`AudioWorkletGlobalScope`,
`AudioWorkletProcessor`, `currentFrame`, `currentTime`, `registerProcessor`, `sampleRate`, `WorkletGlobalScope`,
which 17.0 split out of `browser`) and `Float16Array`. `no-undef` is off (`[0]`) in both resolved configs, so no
finding moved. The lint list is unchanged.

**The completeness sweep (Task 3 steps 4–5).**
- Fresh probe `node 169-version-probe.mjs --node 24.21.0 --out tests/e2e-runs/169-gates/10-t3-probe.md` at
  2026-10-03T16:56:32Z, exit 0: 67 distinct registry packages; verdicts HOLD-30d 5 · HOLD-7d 13 · current 47 ·
  major 2; **0 `UNASSIGNED-MAJOR` rows**. The two `major` rows are `@types/node` 26 and `typescript` 7 (G1, both held
  in § 3: types track the Node 24 runtime; typescript-eslint 8.70.1 and svelte-check cap TypeScript below 7). The five
  HOLD-30d rows are Kit 3 / `adapter-node` 6 / `adapter-static` 4 (169-12) and `dotenv` 18 / `intl-messageformat` 12
  (held here, § 3). The probe reads manifests only; the GitHub Actions majors (169-11) and the Deno `npm:` pins
  (`nodemailer`, held to 2026-10-04T07:51Z by its own todo) are outside it and assigned.
- Catalog: 35 keys after the plan (36 before; `@types/js-yaml` left with the js-yaml commit). The plan's check prints
  `35 catalog keys, all consumed` (`t3-catalog-check.txt`); each key has at least one `"<key>": "catalog:"` reference
  in a tracked manifest. No "drop consumer-less entries" commit was needed.

### 169-11 — the GitHub Actions majors, the Pages actions and trufflehog, one commit each (D-10, ruling 4)

After every commit: all six workflows parse with `js-yaml` (`6 workflows parse`), the five CI-shape files pass
(`ciDockerImageBuildGate`, `ciSecretScanFlags`, `ciTypecheckGate`, `rpcNullabilityGate`, `nodeEngineGate`: 5 files,
38 tests) and Prettier accepts the changed files (`tests/e2e-runs/169-gates/11/t*-shape.log`). No lockfile change;
no npm package installed. `.github/dependabot.yml` is unchanged (`git diff --quiet 64065412f HEAD --
.github/dependabot.yml`).

| Commit | Upgrade | Input changes, checked against the target's `action.yml` |
|---|---|---|
| `ca501461c` | `actions/checkout` v4 → v7 (17 steps) | none; `fetch-depth` is still an input. `ciDockerImageBuildGate.test.ts` now expects `['actions/checkout@v7']` |
| `0f366de0a` | `actions/setup-node` v4 → v7 (11) | none; `node-version` and `registry-url` are still inputs. No step sets `cache:`, and v6+ limits the automatic package-manager cache to npm (`packageManager` is `yarn@4.18.1`), so no cache appears. v7 no longer exports a dummy `NODE_AUTH_TOKEN` (actions/setup-node#1558); `release.yml` sets no token |
| `242c5d1a7` | `actions/upload-artifact` v4 → v7 (2) | none; `name`, `path`, `retention-days` unchanged; the new `archive` input keeps its zipped default |
| `810083443` | `dorny/paths-filter` v3 → v4 (1) | none (`filters`) |
| `32c9336ea` | `supabase/setup-cli` v1 → v3 (6) | none; every step keeps `version: 2.118.0`, so `rpcNullabilityGate.test.ts` still binds them to the lockfile. v3 installs the CLI from npm into a `$RUNNER_TEMP` prefix added to `PATH`, so a later `setup-node` does not hide it; it needs Node ≥ 20 and npm on the runner when it runs (the image default before `setup-node`). For CLI ≥ 2.108.0 it no longer forces `SUPABASE_INTERNAL_IMAGE_REGISTRY=ghcr.io` (v3.0.1). The three comments naming `setup-cli@v1` now describe the pinned CLI `version:` |
| `2e9f5d343` | `changesets/action` v1 → v2 (1) | `title` → `pr-title`, `commit` → `commit-message`, `publish` → `publish-script` (values unchanged); `github-token: ${{ secrets.GITHUB_TOKEN }}` added; the step's `env: GITHUB_TOKEN` removed; `push-with-git-cli: true` added. See below |
| `8fe98ace5` | `actions/configure-pages` v4 → v6 | none (no input set; v5's only breaking change is for `static_site_generator: next`) |
| `bba6dc891` | `actions/upload-pages-artifact` v3 → v5 | none (`path`). v4+ leaves dotfiles out unless `include-hidden-files` is set; `apps/docs/static` and the routes contain no dot-named file, and adapter-static writes none |
| `82f0991fb` | `actions/deploy-pages` v4 → v5 | none; the workflow's `pages: write` / `id-token: write` and the `github-pages` environment are unchanged |
| `70c397a8c` | trufflehog 3.97.2 → 3.97.9 (`uses:` and `version:`) | `action.yml` byte-identical between the two tags. The comment's tag examples and the `ciSecretScanFlags.test.ts` docblock now quote `v3.97.9` / `3.97.9`; ghcr.io answers 200 for `trufflehog:3.97.9` and 404 for `:v3.97.9`, as the comment says |

**`changesets/action` v2 and the token (T-169-34).** v2's `src/index.ts` takes the `github-token` input as its only
credential and warns when a `GITHUB_TOKEN` env var differs from it; `src/run.ts` runs `changeset version` and the
publish script with `env: { ...process.env, GITHUB_TOKEN: github.getToken() }`. `@changesets/get-github-info` (the
changelog generator's helper) reads `process.env.GITHUB_TOKEN`, so it still gets the token without the step's env
entry. v1's `commitMode` defaulted to `"git-cli"`; v2's `push-with-git-cli` defaults to `false` (GitHub API), so it
is set to `true` to keep the push path. `create-github-releases` keeps its default (`true`, as v1's
`createGithubReleases`), and `push-git-tags` defaults to `true`. v2 refuses Changesets CLI 2; the root declares
`@changesets/cli ^3.0.3`. The job's `permissions` (`contents`, `pull-requests`, `id-token` write) and
`NPM_CONFIG_PROVENANCE: true` are unchanged. v2 also drops its `.npmrc` handling for `NPM_TOKEN`; the job sets none.

**trufflehog over the evidence range, locally, before the push.** `ghcr.io/trufflesecurity/trufflehog:3.97.9` over a
scratch copy of the evidence commit with the Action's own arguments (`git file://… --since-commit 59f8dacdd --branch
3a27c98fc --fail --no-update --github-actions --config=.github/trufflehog-openvaa.yml
--exclude-paths=.github/trufflehog-exclude-paths.txt`): exit 0, 2632 chunks, `verified_secrets: 0,
unverified_secrets: 0`. CI's `secret-scan` agreed (§ 4).

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
  - **RESOLVED 2026-10-03 by operator ruling (operator, in chat).** ESLint 10 landed (`34ce0d51c`) with three scoped
    one-line `eslint-disable-next-line no-useless-assignment` comments, one per write-only `$bindable` prop, each
    citing eslint-plugin-svelte#1478 (PROH-169-07 overruled for exactly those three lines; the rule stays on
    everywhere else, narrower than option B). The drawer focus return was **wired**, not deleted (`05f88a2a6` RED,
    `e3a661517` fix). Follow-up todo `2026-10-03-remove-bindable-no-useless-assignment-disables.md`. Details in § 6
    (operator rulings).

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
  **Resolved:** the orchestrator verified that every line of the entry was already committed, then dropped it
  (2026-10-03, before 169-05). No action remains.
- **Docker credential helper wedged again (169-04).** `docker-credential-desktop get` hung on the first
  `docker pull`. This is the same host fault as 136-05. The pull went through with a scratch `DOCKER_CONFIG` and an
  explicit `DOCKER_HOST`. Repairing Docker Desktop's credential helper is a host action.
- **`vite` catalog entry (169-04).** A catalog `vite: ^7.3.6` now exists, consumed by the 11 workspaces that run
  Vitest but do not build with Vite. 169-05 bumps it to 8 and points both apps at it. **Done in 169-05** (`bf828a1da`: `vite ^8.3.1`, both apps on `catalog:`).

- **Vite 8 raises the supported-browser floor (169-05).** Vite 8's default build target is
  `chrome111`, `edge111`, `firefox114`, `safari16.4`, `ios16.4` (`ESBUILD_BASELINE_WIDELY_AVAILABLE_TARGET` in
  `vite/dist/node/chunks/node.js`). The frontend moved from Vite 6's `modules` default (`es2020`, `chrome87`,
  `edge88`, `firefox78`, `safari14`) and the docs app from Vite 7's (`chrome107`, `edge107`, `firefox104`,
  `safari16`). Voters on older browsers (for example Safari before 16.4 / iOS before 16.4) may get syntax the browser
  cannot parse. Confirm that this floor is acceptable for the voter app, or set `build.target`. Neither config sets
  it now.
  **RESOLVED 2026-10-03 (operator, in chat): the operator accepted Vite 8's default build target** (`chrome111`,
  `edge111`, `firefox114`, `safari16.4`, `ios16.4`) for both apps. No `build.target` override is set, and no code
  changed. 169-13's follow-up todo list no longer needs a browser-floor confirmation item.
- **`configLoader: 'native'` notice (169-05).** Vite 8 warns that `apps/frontend/vite.config.ts` imports three local
  modules without file extensions. This is harmless under the default bundle loader, but it would break the native
  loader, which Vite plans to make the default in a later major. The fix needs `.ts` import extensions, and with
  them `allowImportingTsExtensions`, in the tsconfig that type-checks the config. It is a small config change to
  make at the next Vite major or in 169-12.
  **Carried forward 2026-10-03 (169-12):** Kit 3 is held (§ 3), so this item now sits under "Related item" in
  `2026-10-03-sveltekit-3-held-by-the-age-rule.md`. It should land next to the Kit 3 migration, which rewrites the
  same config files. Nothing was changed here.

- **RESOLVED 2026-10-03 (option A, operator in chat) — was: DECISION NEEDED — the PG17 SQL lint red (169-06 Task 2, § 6).** Applied as `f1ac8164a` (STABLE in both SQL files) and `bfdc1afc3` (local `major_version = 17`); the local stack runs Postgres 17.6. See § 6 (operator rulings). Original entry: On the PG17 image, `yarn db:lint:sql` fails on
  `public.is_valid_choice_id`: it is declared IMMUTABLE but calls the STABLE `jsonb_agg` / `jsonb_build_array`. The
  PG15 image's checker does not report it. pgTAP (1335/1335) and the full E2E run (171/171) pass on PG17. The fix is a
  schema + migration edit, which PROH-169-12 forbids, so 169-06 stopped before the Postgres commit. On the
  orchestrator's ruling, Task 2 is **deferred**: the local stack is back on PG15, and both patches are saved. Todo
  `2026-10-03-pg17-local-blocked-on-is-valid-choice-id-volatility.md` has the resume steps. The ruling blocks 169-13's
  PG17 pgTAP gate and DEPS-08 only. Options:
  - (A) Allow one schema fix: mark `is_valid_choice_id` `STABLE` in `011-validation-functions.sql` and
    `00001_initial_schema.sql`. That is valid on PG15 and PG17, and it fixes a mislabel that is real on both. The
    only caller (`validate_answer_value`) is VOLATILE, so nothing cascades. The cost: the phase's "no schema change"
    proof becomes "one reviewed volatility fix".
  - (B) Hold Postgres 17 locally: revert `major_version` to 15, reset this project's stack to PG15, and record the
    hold plus a todo. DEPS-08 stays Pending.
  - (C) Keep the body IMMUTABLE by rewriting it with immutable operators only. This is also a schema edit, and it must
    keep the "empty choice list admits any value" behaviour.
- **Hosted Postgres stays 15 (169-06).** The local stack moves to 17 with the Postgres commit (once it lands).
  Hosted is not upgraded by this phase. Until the operator upgrades hosted to 17 (a Supabase dashboard / hosting
  action), local and hosted diverge. 169-13 files the todo.
- **Standing constraint until hosted runs 17:** every migration must stay valid on Postgres 15, with no PG16/17-only
  syntax, function or GUC. The parked config patch (`t2-pg17-config.patch`) writes this rule into `config.toml`'s
  `[db]` comment; the committed file still says `major_version = 15`, matching hosted. This phase changed no migration,
  schema or seed file (diff against `5ed82f437` is empty), unless option (A) above is chosen.
  **Update 2026-10-03:** option (A) was chosen. `config.toml` now says `major_version = 17` with this rule in its
  `[db]` comment, and the one schema/migration change in the phase is the reviewed `is_valid_choice_id` volatility fix
  (`f1ac8164a`).
- **Operator-facing local step for the PG17 switch.** A PG15 data volume cannot be opened by PG17, so every
  developer machine needs this once after pulling the Postgres commit:
  `yarn db:stop && yarn workspace @openvaa/supabase exec supabase stop --no-backup && yarn db:reset`. Local data is
  re-seeded, not migrated. Run `docker builder prune -af` first if disk is tight.
- **Docker credential helper wedged again (169-06).** The CLI's own `docker pull`s hung in
  `docker-credential-desktop get` for 30 minutes during `yarn db:start`. Ten images went through with a scratch
  `DOCKER_CONFIG` and `DOCKER_HOST`. Until the helper is repaired, the first `yarn db:start` after any CLI bump on
  this host needs that workaround.
  - I tried to kill the hung `docker pull` / `docker-credential-desktop get` processes (pids 46052, 46089–46098,
    46099–46108); the permission classifier refused, and I did not retry.
  - They ended when the harness's 30-minute background limit stopped the `yarn db:start` task (16:51:51 local).
    `ps` showed none left afterwards, and none was killed by hand.
- **Old Supabase images can be reclaimed (169-06, operator only).** The CLI 2.83.0 images (postgrest v14.5, gotrue
  v2.187.0, storage-api v1.41.8, realtime v2.78.10, edge-runtime v1.71.0, postgres-meta v0.96.1, studio
  2026.03.04, mailpit v1.22.3, logflare 1.34.7, vector 0.28.1) and, after the PG17 switch, `postgres:15.8.1.085` are
  no longer used by this project. Pruning images is an operator action on this host.
- **`[inbucket]` is deprecated in CLI 2.118.0.** Every CLI call warns `config section [inbucket] is deprecated.
  Please use [local_smtp] instead`. Renaming the section in `config.toml` is a small follow-up that changes the
  local mail config. The plan did not name it, so it was not changed here.

- **nodemailer 10 pin waits on the calendar (169-07).** `send-email` still runs `npm:nodemailer@6.9.10`, which has six
  high advisory entries (four distinct). The 10.x line clears the 30-day rule at 2026-10-04T07:45:32Z, and 10.0.11
  clears the 7-day rule at 07:50:47Z. Todo `2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md` has the resume
  steps: re-measure, advisory query, a one-line edit, boot check, full E2E. Until it lands, DEPS-09 stays Pending.
- **`send-email` and `invite-candidate` have no E2E caller (169-07, confirms 168-03 F2).** Their runtime proof in this
  plan is a boot check plus an anon-token probe that reaches `auth.getUser()` through the new client. The plan's "email
  and invite specs" do not exist as Edge-Function callers.
- **The cookie adapter now sets `Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0` on every
  response that writes auth cookies (169-07).** That is intended (RESEARCH § Security Domain V3). Any future route that
  calls `setHeaders({ 'cache-control': … })` on a request that also refreshes a session will hit SvelteKit's
  duplicate-header throw. The adapter skips names it has already forwarded, but it cannot know about a route's own
  call.

- **The faker baseline row is now stale (169-08).** `yarn audit:deps` no longer reports 1158500
  (`@faker-js/faker`, GHSA-qxc2-j82w-r537); `10-audit` says `0 new advisory(ies) at high+, 1 accepted` (`braces`), and
  lists 1158500 among the accepted rows that could be dropped. The baseline file is unchanged here; 169-13 reconciles
  it by hand.
- **`yarn db:seed` (the `default` template) now writes different names, answers and question texts at seed 42
  (169-08).** Anyone holding screenshots or notes of the default dev dataset will see new values. Row counts are
  unchanged.

- **AI SDK 7 system-message opt-in (169-09).** `LLMProvider.generateObject` passes `allowSystemInMessages: true`,
  because every caller (`argument-condensation`, `question-info`) sends its server-built prompt as a `system` message
  and AI SDK 7 rejects that by default. It restores the 5.x behaviour for that one method; `streamText` keeps the
  SDK's rejecting default. If the prompts are ever restructured into `instructions` plus a user turn, the opt-in can
  go. No E2E spec runs the LLM admin jobs (they need a provider key); the runtime proof is a mock-model smoke run.

- **The `braces` baseline row is now stale (169-10).** `@changesets/cli` 3 (`40a426cb1`) replaced `micromatch` with
  `picomatch`, so the only path to `braces` 3.0.3 is gone. `yarn audit:deps` reports `0 new advisory(ies) at high+, 0
  accepted` and lists 1240992 among the ids that no longer appear. The operator's pending review of that row becomes
  "drop it". `security/audit-baseline.json` is unchanged here; 169-13's reviewed rewrite removes it with the other
  stale rows.
- **Residue for 169-13 (169-10, recorded, not removed):**
  - The root `glob` devDependency (`^13.0.6`) has no importer in the root workspace's own files: `git grep` for
    `from 'glob'` / `require('glob')` in `tests/`, `scripts/` and root `*.mjs` exits 1. Only `apps/docs/scripts/*`
    import `glob`, and `apps/docs` declares it itself. It was bumped with the docs declaration, per the plan.
  - `apps/docs`'s `eslint-config-prettier` devDependency (`catalog:`) is still unused by its own config
    (`apps/docs/eslint.config.js` imports only `@openvaa/shared-config/eslint` and `eslint-plugin-svelte`;
    `@openvaa/shared-config` declares `eslint-config-prettier` itself). 168 review IN-01. The plan's sweep covers
    unassigned majors and consumer-less catalog keys, not unused declarations, so it was left in place. The catalog
    key stays consumed either way (`@openvaa/shared-config` references it).
- **`yarn changeset status` exits 1 on this branch (169-10).** The cause is "packages changed, no changesets found",
  which 2.x reports the same way. It is not a new failure and no gate runs it. Release flow note: `changeset version`
  now exits 1 when there is nothing to release, but `changesets/action@v1` calls it only when changesets exist.
- **Held to the calendar (169-10):** `intl-messageformat` 12 clears 2026-10-15T12:27Z and `dotenv` 18 clears
  2026-10-17T21:18Z (§ 3). Both clear before 169-12's own hold (Kit 3, 2026-10-31), so whichever run comes first after
  those dates can take them, each as a one-commit bump with the exercise named in its § 3 row. Todo
  `2026-10-03-dotenv-18-and-intl-messageformat-12-held.md` has the steps.
- **Undeclared `globals` import resolved (169-10).** `@openvaa/shared-config` now declares `globals: catalog:`
  (`5017d4a17`). This closes 167 review WR-02 / todo `2026-10-02-declare-globals-in-shared-config.md`, which was moved
  to `done/`.
- **Watch the first `main` run of `release.yml` and `docs.yml` after merge (169-11).** Neither workflow triggers on
  `ci-evidence/**` (`release.yml`: push to `main`; `docs.yml`: push to `main` under `apps/docs/**`, or manual
  dispatch), so their changes are **unobservable until merge**:
  - `release.yml`: checkout v7, setup-node v7 (no dummy `NODE_AUTH_TOKEN` any more) and `changesets/action` v2 with
    the `github-token` input, renamed inputs and `push-with-git-cli: true`. On the first `main` push, check that the
    step runs `changeset version` (or skips it with no changesets) without the "GITHUB_TOKEN environment variable is
    set and does not match" warning, and that a release PR, if one is due, is opened and pushed as before.
  - `docs.yml`: checkout v7, setup-node v7, `configure-pages` v6, `upload-pages-artifact` v5 (dotfiles excluded) and
    `deploy-pages` v5. A manual `workflow_dispatch` after merge exercises all of them; check the deployed site loads.
- **Playwright 1.63's trace recording slows render-heavy pages (169-11).** Measured on the results reload
  (`performance` spec, idle dev server, 3 runs each, 2026-10-03): Playwright 1.58 traced 213–243 ms; Playwright 1.63
  traced 584–611 ms, untraced 241–244 ms. The app did not get slower across groups 2–8 (untraced HEAD equals traced
  1.58). The suite records a trace for every test (`retain-on-failure` records like `'on'`), so every spec now runs
  under that extra browser-side cost, and on the ~4.3× slower CI runner it widens every fixed-window race. 169-11
  turned tracing off for the `performance` project only (`f6bbc68ab`). Whether to keep global `retain-on-failure`, move
  to `on-first-retry` in CI, or report the overhead upstream is an operator call. Which part of the trace recorder
  costs the time (DOM snapshots or the screencast) was not isolated: **UNCONFIRMED**.
- **`supabase/setup-cli` v3 no longer forces ghcr.io (169-11).** For CLI ≥ 2.108.0 the action leaves the registry to
  the CLI, which pulls from `public.ecr.aws` and falls back to `ghcr.io` (run 37139970902 `supabase-tests`: 22
  "Retrying after" lines, 34 ECR and 16 ghcr image references, `Start Supabase` green). No action needed; if ECR
  throttling ever makes the start step slow, pin `SUPABASE_INTERNAL_IMAGE_REGISTRY=ghcr.io` in the job env.
- **The CI `performance` margin is thin (169-11) — likely next CI flake.** Untraced, runs 37142651706 and
  37144076939 measured `timeToMatches` 3045 ms (ttfb 290 ms) and **4603 ms (ttfb 707 ms)** against the 5000 ms
  budget; the last pre-group-2 run (37115289953, traced on Playwright 1.58, Vite 7) measured 1329 ms (ttfb 51 ms). The
  ttfb share points at the server side under the suite's parallel load; local full-suite ttfb also moved from 21–27 ms
  (169-01/02) to 38–174 ms from 169-04/05 on. Locally the untraced window is back at the pre-group-4 value (241–255 ms), so the remaining CI gap is in
  the runner (Vite 8 dev server under the suite's parallel load is one candidate) and was not isolated:
  **UNCONFIRMED**. Watch the next CI runs; if `timeToMatches` keeps climbing, measure it per stage before touching the
  budget, which the spec forbids raising to make a red test green.

## 8. Moderate and low advisories on chosen versions

Listed at phase end (169-13).
