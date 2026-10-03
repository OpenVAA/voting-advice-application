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

The two bold rows were published after planning (2026-10-01) and have **no fixed version on the registry**,
so no in-range refresh can clear them. See § 3 and § 7.

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

## 3. Holds

| Package | Held at | Newer line | Reason | Decision ref | Re-check date or trigger |
|---|---|---|---|---|---|

## 4. Gate runs

Runner: `bash 169-gates.sh <label>` (`TURBO_FORCE=true`; each status read directly). E2E runner:
`bash 169-e2e.sh <label>`.

| Plan | Label | HEAD | install | dedupe | typecheck | lint | format | check-fe | check-docs | unit | build | audit | docs-links | docs-rq | E2E (total / passed / failed / flaky / did-not-run) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 169-01 | `169-01-baseline` (only the age-gate line changed) | `5ed82f437` + `.yarnrc.yml` | 0 | **1** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **1** | 0 | 0 | — |

Notes on `169-01-baseline` (2026-10-03T06:43:09Z–06:45:43Z, `tests/e2e-runs/169-gates/169-01-baseline/`):

- `10-audit` exit 1 — the 11 NEW rows of § 1, as expected.
- `02-dedupe` exit 1 — **pre-existing, not a regression**: `yarn dedupe --check` reports 71 dedupable
  descriptors ("70 packages can be deduped using the highest strategy") on the unmodified lockfile. No
  workflow, script or hook in the repository runs `yarn dedupe` (`grep -rn dedupe .github/ package.json` →
  nothing), so the starting tree was never held to it; the gate is new with this phase. The plan expected 0
  here. Group 0's `yarn dedupe` is what brings it to 0, and `169-01-group0` must show it at 0.
- Every forced turbo gate reported `0 cached` (`03-typecheck` 23/23 and `09-build` 25/25 tasks executed).

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

## 6. Diffs and traces

## 7. Operator follow-ups

## 8. Moderate and low advisories on chosen versions

Listed at phase end (169-13).
