# Phase 169 — Proposed Requirement IDs

The roadmap entry says "Requirements: TBD — registered at planning". These IDs come from
`169-RESEARCH.md` § Phase Requirements. The `DEPS-` prefix has no clash in `.planning/REQUIREMENTS.md`.
The orchestrator registers them in `REQUIREMENTS.md` and in the ROADMAP `**Requirements**:` line.
Every ID appears in at least one plan's `requirements` frontmatter.

| ID | Description | Roadmap criterion | Decisions | Plans |
|----|-------------|-------------------|-----------|-------|
| DEPS-01 | "Safe" is defined and enforced: `npmMinimalAgeGate: 7d` in `.yarnrc.yml`, observed binding on a real resolution; every chosen version is recorded with publish date, age and verdict in a version table regenerated at execution start and at phase end | 1 | D-03, D-04, D-05, D-33 | 169-01, 169-13 |
| DEPS-02 | Group 0: one lockfile-refresh commit inside the declared ranges clears every NEW high+ finding without a new `resolutions` entry, leaving the packages that later groups own at their pre-phase resolutions | 3 | D-07, D-25, D-27 | 169-01 |
| DEPS-03 | Toolchain: Yarn 4.18.x at every pin site; Node 24 everywhere (CI pins incl. both halves of the engine negative control, Dockerfile, both `engines` at `>=24.15.0`, `@types/node` 24.x) as an isolated commit with its own gate run, a production-image build and smoke start, an E2E run and an observed CI run; TypeScript 6.0.3 with the tsconfig defaults reviewed | 1, 2, 4 | D-11, D-12, D-16, D-25, D-26 | 169-02 |
| DEPS-04 | Lint and format: `eslint-plugin-import-x` replaces `eslint-plugin-import` with the four rules shown firing on planted violations before and after; ESLint 10 with the config-lookup flag removed at every site and FlatCompat gone; `eslint-plugin-svelte` 3 through the catalog; the prettier/sort plugin majors each followed by their own reformat commit | 1, 2, 4 | D-13, D-17, D-23 | 169-03 |
| DEPS-05 | Build: Kit 2.70.x with the latest adapter-node 5.x / adapter-static 3.x; both apps on Vite 8 and vite-plugin-svelte 7 through the catalog; an inline root-`.env` restart plugin replaces `vite-plugin-restart` and is observed restarting the dev server; the build-output diff and the visual gate are recorded | 1, 2, 4 | D-13, D-15, D-18 | 169-05 |
| DEPS-06 | Test stack: one Vitest major across the catalog (docs included) with the root workspace file replaced by `test.projects`; jsdom 30 and isomorphic-dompurify 4 with the root resolution deleted; Playwright 1.63 with the visual container digest; DaisyUI/Tailwind minors; per-workspace unit-test counts unchanged | 1, 2, 4 | D-08, D-13, D-19, D-24 | 169-04 |
| DEPS-07 | Supabase CLI: the catalog entry and all six `setup-cli` pins at one version; `database.ts` regenerated with every hunk explained; pgTAP and an E2E run after the CLI commit; supabase-js 2.117.x and `@supabase/ssr` 0.12.x with `assert:cookie-names`, the `safeGetSession` round-trip test and the cookie-adapter tests green | 1, 2, 4 | D-10, D-22, D-25 | 169-06, 169-07 |
| DEPS-08 | Local Postgres 17: `major_version = 17`; a clean `db:reset` applies every migration; `show server_version` proves 17; `database.ts` regenerated and pgTAP (incl. Phase 166's anon-exposure census) green on 17; PG15-validity of migrations recorded as a standing constraint; hosted upgrade filed as an operator todo | 4 | D-14 | 169-06, 169-13 |
| DEPS-09 | Deno Edge Function imports pinned exactly (`nodemailer` ≥ 10.0.6, `jose` 6.2.x via `npm:`, supabase-js exact 2.x matching the npm side); the functions' vitest suites, the email and invite flows in the full E2E suite, and bank-auth E2E 3× green; the audit blind spot filed as a todo | 1, 3 | D-09 | 169-07, 169-13 |
| DEPS-10 | `@faker-js/faker` 10.x as its own group, with the old-vs-new seed output diffed for the `default` and `e2e/base` templates before the bump lands; visual re-baselines only where a diff traces to a recorded seed change | 1, 2 | D-20 | 169-08 |
| DEPS-11 | LLM SDK stack migrated (`ai` and `@ai-sdk/*` to the latest safe majors) with package, admin-job and E2E gates green; the importer-less `openai` (and `jsonrepair` if still present) removed | 1, 2 | D-21 | 169-09 |
| DEPS-12 | Remaining small majors, one commit each, each formatter/sorter major followed by its own reformat commit; `@types/cheerio` removed; consumer-less catalog entries dropped; any major the probe reports as unassigned is bumped or held with a reason | 1, 2 | D-13, D-23 | 169-10 |
| DEPS-13 | GitHub Actions majors, the trufflehog patch and the Pages actions, with the CI-shape tests updated, observed through `ci-evidence/**` at job level; the two workflows that cannot run there recorded as unobservable until merge | 1, 4 | D-10 | 169-11 |
| DEPS-14 | Kit 3 + adapter-node 6 + adapter-static 4 land behind an operator checkpoint if they clear the 30-day rule on the execution date; otherwise held with a dated todo | 1 | D-15, D-32 | 169-12 |
| DEPS-15 | The audit gate's liveness is keyed on the audit's own exit status (not the baseline size), with the network-blocked negative control observed; every surviving baseline row carries a current note; the roadmap premise is amended; the phase's todos are filed or updated | 3 | D-02, D-28, D-29, D-30, D-31 | 169-01, 169-13 |
| DEPS-16 | Final gates on one HEAD: typecheck, `lint:check`, `format:check`, svelte-check (frontend and docs), unit, pgTAP, production builds, `audit:deps`, the docs link check and ResearchQuote byte-identity, then the full E2E suite under the cardinal rule after a clean `db:reset` on PG17 | 4 | D-26 | 169-13 |

## D-02: the ROADMAP amendment to apply at planning

D-02 says the roadmap premise is amended **at planning**, which is the orchestrator's edit (the planners
do not edit `ROADMAP.md`). 169-01 Task 1 checks that it landed and applies it if it did not.

- Replace the `**Added 2026-10-01.**` sentence of § Phase 169 with: "The 261001-n8y sweep observed
  `yarn audit:deps` failing with 7 new high+ advisories that predate it — `brace-expansion` ×6 and
  `undici` ×1. Re-measured at planning (2026-10-01) the gate shows 9 NEW (`brace-expansion` ×6,
  `devalue` ×2, `undici` ×1). The `vitest`, `@vitest/browser`, `@sveltejs/kit`, `tar`, `shell-quote`
  and `@faker-js/faker` findings are accepted baseline rows, and every accepted row now has a fixed
  version published."
- Replace success criterion 3 with: "**`yarn audit:deps` passes**: every row with a published fix is
  fixed; `security/audit-baseline.json` keeps only no-fix or recorded-hold rows, each with a current
  note; todo `2026-09-03-dependabot-alert-list-is-stale-against-main.md` is updated and stays pending
  until v2.15 merges."
- `**Requirements**:` → `DEPS-01 … DEPS-16`.

## Plan map and the one ordering deviation from D-25

| Plan | D-25 group | Content |
|------|-----------|---------|
| 169-01 | 0 | age gate, audit liveness re-key, in-range lockfile refresh |
| 169-02 | 1 | Yarn 4.18 → Node 24 (isolated) → `@types/node` 24 → TypeScript 6 |
| 169-03 | 2 | import-x → `eslint-plugin-svelte` 3 → no FlatCompat → ESLint 10 → formatter/sorter majors |
| 169-04 | **4** (test) | Vitest (one major via the catalog, `test.projects`) → jsdom 30 + dompurify 4 → Playwright 1.63 + DaisyUI/Tailwind minors |
| 169-05 | **3** (build) | restart plugin → Kit 2.70 + adapters → Vite 8 + vite-plugin-svelte 7 |
| 169-06 | 5a | Supabase CLI → Postgres 17 |
| 169-07 | 5b | supabase-js → `@supabase/ssr` → Deno imports |
| 169-08 | 6 | faker 10 |
| 169-09 | 7 | AI SDK majors |
| 169-10 | 8 | small majors, catalog sweep |
| 169-11 | 9 | GitHub Actions majors |
| 169-12 | 10 | Kit 3 (non-autonomous) or recorded hold |
| 169-13 | 11 | baseline notes, todos, final version table, final full gate |

**Why groups 3 and 4 swap.** Measured at planning: `vitest@3.2.x` declares `dependencies.vite`
`^5.0.0 || ^6.0.0 || ^7.0.0-0`, so on the catalog's Vitest 3 line the frontend's unit runner would load
its own nested Vite 7 while `vite.config`'s `@sveltejs/vite-plugin-svelte` 7 requires Vite 8 (its peer is
`vite ^8.0.0-beta.7 || ^8.0.0`). Vitest 4.x and 5.x declare `vite ^6 || ^7 || ^8`. Vite 8 therefore
cannot land before the catalog leaves Vitest 3, and Vitest 5 runs on the apps' current Vite 6.4/7. Running
group 4 before group 3 keeps every group intact as one plan with its own gates; the alternative — pulling
only the Vitest commit forward into group 3 — would split group 4. D-26's E2E schedule is unchanged in
substance: the "after group 3" run is at the end of 169-05.

**Why group 5 spans two plans.** Five upgrade commits, four `database.ts`/pgTAP checkpoints, three E2E runs
and the bank-auth 3× gate exceed one executor's context budget; 169-06 and 169-07 run back to back and each
ends on the full gate set. D-32's "~12" plans becomes 13.
