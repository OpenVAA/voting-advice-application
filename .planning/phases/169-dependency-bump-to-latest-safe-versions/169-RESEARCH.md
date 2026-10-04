# Phase 169: Dependency Bump to Latest Safe Versions - Research

**Researched:** 2026-10-01 (registry, Node release index, GitHub releases and the live `yarn audit:deps` all observed that day; worktree `fix/888-review-findings`, HEAD `ec0cd7810`)
**Domain:** Monorepo dependency and toolchain upgrade (Yarn 4 catalog, Node 24, TS 6, ESLint 10, Vite 8, Vitest 5, Supabase CLI and local Postgres 17, Deno Edge Function imports, GitHub Actions majors, audit gate)
**Confidence:** HIGH on versions, dates, engines, peers and in-repo anchors (all measured this session); MEDIUM on framework migration details (official migration guides, fetched); LOW only where flagged `[ASSUMED]`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied verbatim from `169-CONTEXT.md` `<decisions>`.

Decision IDs map one-to-one onto the discussion document's Phase 169 IDs, given in parentheses.
33 decisions → D-01..D-33. Every decision below is locked; the planner does not re-open them. Only
the chosen option is stated; the non-chosen options are dead.

#### A — Factual baseline

- **D-01 (169-A1):** Accept all 20 facts of 169-A as the phase's factual baseline; they are
  restated in *Factual baseline (169-A)* below. Facts 1, 3, 7, 8, 9, 11 and 12 are not in the
  roadmap and each changes the work. Fact 14 (Node pins) and the "Postgres `major_version = 15`"
  observation remain true as **starting state**; the overrules change the target, not the facts.
  Per D-33 the numbers are a 2026-10-01 snapshot, re-measured at plan time and at execution start.
- **D-02 (169-A2) ⚠:** **Amend the ROADMAP entry and criterion 3 at planning.** Replace the
  "7 new high+ advisories (`vitest`, `@vitest/browser`, …)" sentence with the measured set (9 NEW:
  `brace-expansion`, `devalue`, `undici`) and state that every accepted row now has a fixed version.
  Criterion 3 becomes: "every row with a published fix is fixed; the baseline keeps only no-fix or
  recorded-hold rows". Rationale: the standing re-verification lesson — a premise corrected only in
  an addendum carries forward into later phases. *Reversible:* a docs edit.

#### B — What "safe" means

- **D-03 (169-B1) ⚠:** **Minimum release age.** Any version taken must be **≥ 7 days old at bump
  time**. A **new major line** additionally needs its `x.0.0` release **≥ 30 days old**; otherwise
  the package stays on the latest release of its current major and the reason is recorded.
  **Exception:** a patch fixing an open high+ advisory may be taken once it is **≥ 2 days old**.
  Evaluated on the execution date (D-33). On 2026-10-01 this holds back Kit 3, `adapter-node` 6 and
  `adapter-static` 4 (0 days old) and nothing else that matters. Node 24 is not an npm package and
  is not subject to the 30-day rule (24.x has been Active LTS for months); `@types/node` 24.x versions
  still obey the 7-day rule.
- **D-04 (169-B2):** **Enforce permanently via `npmMinimalAgeGate` in `.yarnrc.yml`** at the D-03
  base value (7 days), so every future `yarn up` obeys it. An urgent security patch younger than the
  gate gets a per-package `npmPreapprovedPackages` exception (the D-03 2-day exception is applied
  this way). Confirm the key is not in `FORBIDDEN_YARNRC_KEYS` in
  `packages/dev-seed/tests/auditBaselineShape.test.ts` (it forbids advisory-ignore keys, so it should
  not be). The 30-day major rule is applied by hand/recorded (Yarn has no separate major knob).
  *Reversible:* one config line.
- **D-05 (169-B3):** A chosen version must have **no open high+ advisory** (the gate threshold).
  Moderate and low advisories on chosen versions are **listed in the phase summary**.
- **D-06 (169-B4):** Majors blocked by a peer that has not caught up: **use a supported replacement
  where one exists; otherwise hold the major and record the blocking peer in a todo with a re-check
  trigger.** No `packageExtensions`/peer overrides. Per-case: D-16 (TS 7 held), D-17 (ESLint 10 via
  import-x), D-18 (Vite 8 via inline restart plugin).

#### C — Scope

- **D-07 (169-C1):** **Direct deps to latest safe AND refresh every transitive within its declared
  range** (`yarn up -R`, then dedupe). No new `resolutions` to force transitives. In-range fixes
  exist for `brace-expansion` (1.1.21 / 2.1.7 / 5.0.12), `minimatch`, `picomatch`, `nanoid`,
  `postcss`, `rollup`, `ws`, `flatted`, `form-data` 4.0.6, `glob` 10.5, `kysely` 0.28.17 (via
  `@inlang/sdk`), `linkify-it` 5.0.2, `ip-address` 10.7 (via `socks` 2.8.10), `tar` (via `node-gyp`
  13). Direct bumps needed for: `vitest` (≥ 3.2.7), `@vitest/browser-playwright` (≥ 4.1.11), `vite`
  (≥ 6.4.3 / 7.3.6), `@sveltejs/kit` 2.70.3, `concurrently` 9.2.4 (pins `shell-quote` 1.9.0),
  `cheerio` 1.2.0 (moves to `undici ^7`), `supabase` CLI 2.119 (drops `tar`), `@faker-js/faker` 10.6.
- **D-08 (169-C2):** **Delete the root resolution `isomorphic-dompurify/jsdom: ^26.1.0`** in the
  same commit that moves `isomorphic-dompurify` to 4.x (which depends on `jsdom ^30`). Before
  deleting, read the commit that added it (`git log -S` on the root `package.json`) to confirm what
  it worked around.
- **D-09 (169-C3) ⚠:** **Deno Edge Function imports are in scope.** `npm:nodemailer@6.9.10` → latest
  10.0.x (≥ 10.0.6; 10.0.13 on 2026-10-01); `https://deno.land/x/jose@v5.9.6` → `npm:jose@6.2.x`
  (the version the npm side uses); the floating `https://esm.sh/@supabase/supabase-js@2` → an
  **exact** 2.x pin. Files: `send-email/index.ts`, `identity-callback/index.ts`,
  `invite-candidate/index.ts` under `apps/supabase/supabase/functions/`. Gates: the functions' vitest
  suites, the email and invite flows, bank-auth E2E under its 3× determinism gate. **File a todo**
  that `yarn audit:deps` cannot see Deno imports. Rationale: `send-email` is a production path with
  known high advisories (GHSA-p6gq-j5cr-w38f, GHSA-2x7j-588g-ccc2, GHSA-v53p-9fqp-m79j). Rebase onto
  Phase 166's final shape of `identity-callback` and `invite-candidate`.
- **D-10 (169-C5):** **CI and tool pins in scope.** The Supabase CLI devDep catalog entry and all 6
  `supabase/setup-cli` `version:` pins move **together** (2.83.0 → latest safe, 2.119.0 on
  2026-10-01), `supabase-types` (`database.ts`) is regenerated (`main.yaml` warns a CLI bump can
  change the generator's output), and pgTAP runs. The trufflehog patch (3.97.2 → 3.97.9) is in
  scope. The GitHub Actions majors (`checkout`/`setup-node`/`upload-artifact` v4 → v7, `paths-filter`
  v3 → v4, `supabase/setup-cli` v1 → v3, `changesets/action` v1 → v2) are in scope as their own
  group, proven green through the `ci-evidence/**` channel.
- **D-11 (169-C4) — OPERATOR OVERRULE of the ★ (ticked (b)): Move to Node 24 (Active LTS)
  everywhere.** Concretely:
  - CI: every `node-version: 22.22.1` (×10, `main.yaml` and `docs.yml`) → the latest safe **24.x**
    (24.21.0 on 2026-10-01).
  - `apps/frontend/Dockerfile`: `FROM node:22-alpine` → `node:24-alpine` (this is the **deployed
    runtime on Render** — reconciled with the D-11 overrule; the C7 ★ said the image "follows C4",
    which now means 24).
  - `engines.node` in root `package.json` and `apps/frontend/package.json` (both `">=22"` today) →
    `">=24"` (reconciled with the D-11 overrule: the C4 ★ would have set `>=22.17`, Kit 3's floor;
    Node 24 satisfies Kit 3's `>=22.17` and Vitest 5's `^22.12`-style floor — **research must
    confirm Vitest 5's and every other `engines` range literally admits 24.x**, since a `^22.x`
    caret range would not).
  - `@types/node` → latest **24.x** in all 5 workspaces (reconciled with the D-11 overrule: the
    appendix row "C4 (stays on 22.x)" becomes "C4 → 24.x"; the hold vs the 26.x latest is recorded
    as "types track the runtime major").
  - **Risk the operator accepted (from the doc):** this changes the deployment runtime (Render) in
    the same phase, so a failure is **ambiguous between the runtime and a library**. Mitigation
    (planner's obligation, derived from the doc's own E1/E2 shape): the Node move lands in group 1
    **as its own commit, before any library major**, on top of group 0's in-range refresh, and the
    full per-group gate set (D-26) runs on that commit alone, so a runtime regression is attributed
    before library majors pile on. A targeted E2E run after the Node commit is added (reconciled with
    the D-11 overrule: the E2 ★ ran targeted E2E only after groups 3, 5, 6, 7, 10). The production
    image must be built (`docker build` of `apps/frontend/Dockerfile`) and smoke-started locally as
    part of that commit's gate.
  - Research must also check: native addons rebuilt under Node 24 (e.g. anything pulling `node-gyp`),
    any Render service setting that pins a Node version outside the Dockerfile, and whether docs or
    `CLAUDE.md` state "Node 22" (update them; coordinate with Phase 168's env/deploy pages).
  - Edge Functions run on Deno and are unaffected by this decision.
  - *Reversible:* yes, by reverting one commit, but only before production is redeployed on 24;
    after that, rollback is a redeploy.
- **D-12 (169-C6):** **Yarn 4.13.0 → latest safe 4.18.x in scope, as one commit** updating
  `packageManager`, `engines.yarn` (`"4.13"`), `yarnPath` and the 9 CI `version:` lines together.
- **D-13 (169-C8):** **Converge both apps on one version through the catalog** for `vite`,
  `@sveltejs/vite-plugin-svelte`, `vitest`, `eslint-plugin-svelte`, `globals`. The docs app's direct
  ranges become `catalog:`. Catalog entries left with no consumer after Phase 167 are dropped.
- **D-14 (169-C7) — OPERATOR OVERRULE of the ★ (ticked (b)): Postgres 15 → 17 in scope.**
  Concretely:
  - `apps/supabase/supabase/config.toml` `[db] major_version = 15` → `17`.
  - **Risks the operator accepted (from the doc):** the **local stack will differ from hosted
    until production also migrates**, and it **adds pgTAP and migration risk to a dependency
    phase.** Note that `config.toml`'s own comment says `major_version` "has to be the same as your
    remote database's" — this phase knowingly breaks that until the hosted upgrade.
  - **Hosted/production Postgres is NOT upgraded by this phase** (that is a Supabase-dashboard /
    hosting action). Until it is: every migration must remain valid on PG15 — no PG16/17-only syntax
    or functions; the planner records this as a standing constraint, and a todo tracks "upgrade
    hosted Postgres to 17, then this divergence closes", owned by the operator.
  - Gates: a clean `db:reset` on the PG17 image applies every migration; the full pgTAP suite
    (including Phase 166's anon-exposure census) passes on 17; `database.ts` regenerated against 17
    shows no unexplained diff; bank-auth E2E 3× and the full E2E suite run on the PG17 stack.
    Research must check PG16/17 behaviour changes relevant to this schema (e.g. `search_path`
    handling for maintenance operations, removed/renamed functions or GUCs, extension availability
    in the Supabase PG17 image — `pgtap`, `pg_net`, etc.) and `db diff`'s shadow database.
  - Local-environment knock-on: the existing PG15 data volume cannot be reused; switching requires
    `supabase stop --no-backup` (or equivalent volume removal) and the new image pull. Record the
    operator-facing step. Mind the known disk-space sink on the `-gsd` host (prune Docker builder
    cache first).
  - **Placement (reconciled with the D-14 overrule):** the E1 ★ order has no Postgres slot. It lands
    in **group 5 (Supabase)**, as its own commit **after** the CLI bump (the newer CLI brings the
    PG17 image tooling), with pgTAP and `database.ts` regeneration run once after the CLI commit and
    again after the Postgres commit, so a pgTAP failure is attributable to one of them.
  - *Reversible:* locally yes (set back to 15, reset); it becomes one-way only when production
    migrates.

#### D — Majors: migrate or hold

- **D-15 (169-D1) ⚠:** **SvelteKit in two steps.** Step 1 (group 3): Kit 2.70.x (2.70.3 on
  2026-10-01) plus latest `adapter-node` 5.x and `adapter-static` 3.x — closes the Kit
  `BODY_SIZE_LIMIT` advisory and lets `devalue` resolve to ≥ 5.9.4 (fixes all 3 devalue rows). Step 2
  (group 10, the last upgrade group): Kit 3 with `adapter-node` 6 and `adapter-static` 4, **only if
  they clear D-03's 30-day rule on the day execution starts**; otherwise held, with a todo recording
  the re-check date. All of Kit 3's peers (Vite 8, vite-plugin-svelte 7, TS 6) land under Kit 2.70
  first, so the Kit 3 commit carries only Kit 3's own migration. Kit 3 needs `node >=22.17` — already
  met by Node 24 (D-11).
- **D-16 (169-D2):** **TypeScript → 6.0.3; hold TS 7** and record the blocking peers
  (`typescript-eslint` `>=4.8.4 <6.1.0`, `svelte-check` `^5 || ^6`, Kit 3 `^6`). Review TS 6's
  default changes and deprecations against `packages/shared-config/tsconfig.base.json` and every
  `tsconfig` that extends it. Note: `6.0.0` was never published.
- **D-17 (169-D3) ⚠:** **ESLint 10 via `eslint-plugin-import` → `eslint-plugin-import-x` swap.**
  Port the same 4 rules (`import/first`, `newline-after-import`, `no-duplicates`,
  `consistent-type-specifier-style`) in `packages/shared-config/eslint.config.mjs`, then move
  `eslint` and `@eslint/js` to 10. Check whether `--flag v10_config_lookup_from_file` must come out
  of `lint:check`/`lint:fix` (v10 default) and whether `FlatCompat`/`@eslint/eslintrc` is still
  needed. Proof: lint in every workspace shows zero new findings, and each of the 4 rules is shown
  firing on a planted violation before and after the swap.
- **D-18 (169-D4):** **Both apps → Vite 8 and `@sveltejs/vite-plugin-svelte` 7.** Replace
  `vite-plugin-restart` in `apps/frontend/vite.config.ts` with a small inline plugin
  (`server.watcher.add` on the root `.env` + `server.restart()`), and check by hand that the dev
  server restarts when the root `.env` changes. Vite 8 switches the bundler to Rolldown: diff the
  frontend production build output and run the visual gate.
- **D-19 (169-D5):** **One Vitest 5 across the catalog; the docs app joins the catalog.** Migrate
  the root `vitest.workspace.ts` to `test.projects` (confirm at research the exact major that drops
  workspace files). Keep `@vitest/browser-playwright` and `@vitest/coverage-v8` only if Phase 167
  kept them, at the matching 5.x. `yarn assert:unit-coverage` and the `test:unit`-invariant guard
  confirm every package's tests still run and still count.
- **D-20 (169-D6) ⚠:** **`@faker-js/faker` 8.4.1 → 10.6 as its own group.** First diff the
  generated seed rows (old vs new, same seed) for the default and `e2e/base` templates. Re-baseline
  a Phase 146 visual snapshot **only** when its diff traces to a recorded seed-value change. Check the
  `ctx.ts` comment that already describes "the v10 API surface" while the tree resolves 8.4.1.
- **D-21 (169-D7):** **Migrate the LLM SDK stack in `packages/llm` as its own group:** `ai` 5 → 7,
  `@ai-sdk/google` and `@ai-sdk/openai` 2 → 4, `openai` 4 → 7. Consumers:
  `apps/frontend/src/lib/server/admin/features/{condenseArguments,generateQuestionInfo}.ts`. Gates:
  package unit tests, admin-job tests and E2E.
- **D-22 (169-D8):** **Bump `@supabase/ssr` 0.9 → 0.12 and `supabase-js` 2.99 → 2.117 in the
  Supabase group** alongside the CLI (D-10). ssr 0.12 requires `supabase-js >=2.114`. Gates:
  `assert:cookie-names`, the `safeGetSession` round-trip test Phase 167 adds, candidate E2E,
  bank-auth E2E at 3×.
- **D-23 (169-D9):** **Remaining small majors, one commit per upgrade inside a "tooling majors"
  group:** `concurrently` 10, `lint-staged` 17, `@changesets/cli` 3 + `@changesets/changelog-github`
  1, `glob` 13, `dotenv` 18, `js-yaml` 5, `intl-messageformat` 12, `isomorphic-dompurify` 4 + `jsdom`
  30 (with D-08), `globals` 17, `prettier-plugin-svelte` 4, `prettier-plugin-tailwindcss` 0.8,
  `eslint-plugin-simple-import-sort` 14. `@types/cheerio` is **removed**, not bumped (deprecated stub;
  cheerio ships its own types). A formatter or sorter major is followed by its own repo-wide reformat
  commit. (Prettier/sort plugins sit in group 2 and dompurify/jsdom in group 4 per D-25's order; the
  rest are group 8.)
- **D-24 (169-D10):** **Playwright 1.58 → 1.63 and the DaisyUI/Tailwind minors in the test/UI
  group.** If the visual gate diffs, trace each diff to the browser build or the CSS change and
  re-baseline as a recorded step.

#### E — Grouping and gates

- **D-25 (169-E1) ⚠:** **Group order** (the ★ order, with the overrule placements flagged):
  - **0** — lockfile refresh plus latest within each current major, no majors (should alone turn
    `audit:deps` green, so every later group starts from a green gate).
  - **1** — toolchain: Yarn (D-12), **the Node 24 move (D-11) as its own commit with its own gate
    run and targeted E2E** (reconciled with the D-11 overrule: the ★ said "the Node pin", meaning a
    22.x patch), `@types/node` 24 (reconciled with the D-11 overrule), TS 6 (D-16).
  - **2** — lint and format: ESLint 10 + import-x (D-17), prettier/sort plugins, then a reformat.
  - **3** — build: Vite 8, vite-plugin-svelte 7, the restart plugin (D-18), Kit 2.70 + 2.x-line
    adapters (D-15 step 1).
  - **4** — test: Vitest 5 (D-19), jsdom 30, dompurify 4 (D-08), Playwright (D-24).
  - **5** — Supabase: the CLI with its CI pins and types (D-10), **then Postgres 15 → 17 as its own
    commit (D-14)** (reconciled with the D-14 overrule: not in the ★ order), supabase-js, ssr (D-22),
    the Deno imports (D-09).
  - **6** — faker 10 (D-20).
  - **7** — the LLM SDKs (D-21).
  - **8** — small majors (D-23).
  - **9** — CI Actions majors (D-10).
  - **10** — Kit 3 and the adapters, only if D-03's age rule allows (D-15 step 2).
  - **11** — baseline and todo reconciliation (D-28, D-29, D-30, plus the todos filed by D-06, D-09,
    D-14, D-15, D-31).
- **D-26 (169-E2):** **Gates after every group:** typecheck, `lint:check`, svelte-check, unit,
  production builds (frontend and docs) and `audit:deps`. pgTAP after group 5 (run twice inside it —
  after the CLI commit and after the Postgres commit; reconciled with the D-14 overrule). Targeted E2E
  after groups 3, 5, 6, 7 and 10 **and after the Node 24 commit in group 1** (reconciled with the
  D-11 overrule), with bank-auth at 3× in group 5. Group 1 additionally builds the production Docker
  image (reconciled with the D-11 overrule). The **full E2E suite under the cardinal rule** after
  group 10, on one fresh dev server on :5173 and a clean `db:reset` (now on PG17). "Did not run"
  tests count as failures. Read every gate's exit status directly, never through a pipe.
- **D-27 (169-E3):** **One commit per upgrade:** manifest, lockfile and its migration together, the
  lockfile diff confined to that upgrade's subtree. Exception: group 0 is a single lockfile-refresh
  commit.

#### F — The audit gate and its baseline

- **D-28 (169-F1) ⚠:** **Re-key the liveness check on the audit itself, not on the baseline size.**
  `scripts/assert-dependency-audit.mjs` requires a well-formed audit response — e.g. a second run at
  `--severity info` that returns parseable NDJSON, or an explicit empty-result marker — and the
  empty-instrument check no longer depends on the baseline being non-empty. In
  `packages/dev-seed/tests/auditBaselineShape.test.ts` the `accepted.length > 0` assertion becomes
  "the gate proves the audit ran". **Both are observed to fail with the network blocked before the
  change is accepted** (negative control). Rationale: if every fixable row is fixed the baseline may
  hold zero rows, which today's guard rejects and today's gate would then pass silently.
- **D-29 (169-F2):** **Every surviving baseline row gets a current note** — either "no fixed version
  published" or "held: <reason> (see D/B decision), re-check <date or trigger>" — written through a
  reviewed `--update-baseline`. The 4 stale `js-yaml` ids (1123911/12, 1138114/15) are dropped. The
  top-level `note` in `security/audit-baseline.json` (counts 70 rows, talks about Strapi) is rewritten
  to the new numbers.
- **D-30 (169-F3):** **Update todo `2026-09-03-dependabot-alert-list-is-stale-against-main.md` and
  keep it pending:** add the post-phase `audit:deps` numbers and the Deno-import blind spot. Its
  reconciliation still waits for v2.15 to merge to `main`.

#### G — Automation

- **D-31 (169-G1):** **Do not touch `.github/dependabot.yml` in this phase.** File a todo to widen it
  after v2.15 merges (`directories` covering root, `apps/*` and `packages/*`, grouped updates);
  before the merge it resolves against the pre-v2 `main`.

#### H — Plan shape

- **D-32 (169-H1):** **One plan per E1 group (~12), run strictly in sequence** (they share
  `yarn.lock`). The Kit 3 plan (group 10) is **non-autonomous**, with an operator checkpoint before it
  lands. (The Node 24 and Postgres 17 commits sit inside the group 1 and group 5 plans respectively;
  no extra checkpoint was chosen for them, but the planner records the production-runtime and
  hosted-Postgres follow-ups as operator-facing items in those plans' summaries — reconciled with the
  D-11 and D-14 overrules.)
- **D-33 (169-H2):** **Registry data goes stale:** re-run the version scan and `audit:deps` at plan
  time and again at execution start. CONTEXT/plan artefacts carry the refreshed table; D-03's age
  rule is evaluated on the execution date.

#### Reconciliations with the two overrules

| # | ★ text that assumed the old target | Reconciled to | Overrule |
|---|---|---|---|
| R1 | C4 ★ "bump the CI pin to 22.23.3" | CI pins → latest safe 24.x | D-11 |
| R2 | C4 ★ "tighten `engines.node` to `>=22.17`" | `engines.node` → `>=24`; research confirms every dep's `engines` admits 24 | D-11 |
| R3 | C4 ★ / appendix "`@types/node` stays on 22.x (22.20.4)" | `@types/node` → latest 24.x; hold vs 26.x recorded as "types track runtime" | D-11 |
| R4 | C7 ★ "`node:22-alpine` follows C4" | Dockerfile → `node:24-alpine`; production (Render) runtime changes in this phase | D-11 |
| R5 | E1 ★ group 1 "the Node pin" (a 22.x patch) | Node 24 as its own commit in group 1 with an isolated gate run | D-11 |
| R6 | E2 ★ targeted E2E after groups 3, 5, 6, 7, 10 only | + targeted E2E and a production Docker image build after the Node 24 commit | D-11 |
| R7 | C7 ★ "Postgres out of scope; record it" | `config.toml` `major_version` 15 → 17; hosted Postgres stays a recorded operator follow-up; migrations must stay PG15-valid meanwhile | D-14 |
| R8 | E1 ★ order has no Postgres slot | Postgres 17 = own commit in group 5, after the CLI bump | D-14 |
| R9 | E2 ★ "pgTAP after group 5" (once) | pgTAP + `database.ts` regen after the CLI commit and again after the Postgres commit | D-14 |
| R10 | H1 ★ — only Kit 3 is non-autonomous | unchanged (no extra checkpoint), but Node-24-on-Render and hosted-PG17 follow-ups recorded as operator items | D-11, D-14 |

### Claude's Discretion

The document leaves only these to the planner/researcher:
- The exact liveness mechanism in D-28 ("for example a second run at `--severity info` … or an
  explicit empty-result marker") — any mechanism that is proven to fail with the network blocked.
- Which Vitest major actually dropped workspace files (D-19, "confirm the exact version at research").
- Whether `--flag v10_config_lookup_from_file` and `FlatCompat`/`@eslint/eslintrc` survive (D-17,
  "check whether").
- The exact version numbers at execution time, re-derived under D-33 and D-03.

### Deferred Ideas (OUT OF SCOPE)

- **TypeScript 7** — held (D-16); todo with blocking peers and re-check trigger.
- **Kit 3 / adapter-node 6 / adapter-static 4** — held if they fail D-03's 30-day rule at execution
  start (D-15); todo with re-check date.
- **Upgrading hosted/production Postgres to 17** — operator/hosting action outside this phase (D-14);
  todo. Until done, local ≠ hosted.
- **Widening Dependabot (or adopting Renovate)** — after v2.15 merges (D-31); todo.
- **`audit:deps` cannot see Deno imports** — todo (D-09); also added to the 2026-09-03 todo (D-30).
- **Dependabot-alert reconciliation against `main`** — stays pending until v2.15 merges (D-30).
- **Node 26** — not LTS as of 2026-10-01; not considered.
</user_constraints>

<phase_requirements>
## Phase Requirements (proposed IDs, to be registered at planning)

The roadmap says "Requirements: TBD — registered at planning". Proposed prefix `DEPS-` (no clash with
existing IDs in `.planning/REQUIREMENTS.md`). Each maps to roadmap criteria 1–4 and to the locked
decisions.

| ID | Description | Roadmap crit. | Decisions | Research support |
|----|-------------|---------------|-----------|------------------|
| DEPS-01 | "Safe" is defined and enforced: `npmMinimalAgeGate: 7d` in `.yarnrc.yml`; every chosen version recorded with publish date, age, and its high+ advisory status in a refreshed version table at plan time and at execution start | 1 | D-03, D-04, D-05, D-33 | §Standard Stack (age table), §Pitfall 1, Yarn 4.15 default-1d finding |
| DEPS-02 | Group 0: one lockfile-refresh commit (`yarn up -R '*'` + `yarn dedupe`) clears all 9 NEW high+ findings with no new `resolutions` | 3 | D-07, D-25(0), D-27 | §Audit map (which bump fixes which row) |
| DEPS-03 | Toolchain: Yarn 4.18.x in every pin; Node 24 everywhere (CI pins incl. the engine negative-control job, Dockerfile, both `engines`, `@types/node` 24.x) as an isolated commit with its own gate run, Docker image build + smoke, and an E2E run; TS 6.0.3 with tsconfig defaults reviewed | 1, 2, 4 | D-11, D-12, D-16, D-25(1), D-26 | §Node 24 findings, §TS 6 findings, §Pitfalls 2–5 |
| DEPS-04 | Lint/format: ESLint 10 + `eslint-plugin-import-x` with the 4 rules proven firing on planted violations before and after; the `v10_config_lookup_from_file` flag removed at all 19 sites; prettier/sort plugin majors with their own reformat commits | 1, 2, 4 | D-17, D-23 | §ESLint 10 findings, §Pitfall 6 |
| DEPS-05 | Build: both apps on Vite 8 + vite-plugin-svelte 7 via the catalog; inline root-`.env` restart plugin replaces `vite-plugin-restart` (manually verified); Kit 2.70.x + latest adapter-node 5.x / adapter-static 3.x; build-output diff and visual gate recorded | 1, 2, 4 | D-13, D-15(1), D-18 | §Vite 8 findings, §Code Examples |
| DEPS-06 | Test stack: one Vitest 5 via the catalog (docs included), root `vitest.workspace.ts` → `test.projects`; jsdom 30 + isomorphic-dompurify 4 with the root resolution deleted; Playwright 1.63 incl. the visual container image digest; `assert:unit-coverage` counts unchanged | 1, 2, 4 | D-08, D-19, D-24 | §Vitest 5 findings, §jsdom resolution origin, §Pitfall 9 |
| DEPS-07 | Supabase: CLI catalog entry and all 6 `setup-cli` pins at one version; `database.ts` regenerated with no unexplained diff; supabase-js 2.117.x / ssr 0.12.x; `assert:cookie-names` and `safeGetSession` test green; pgTAP after the CLI commit | 1, 2, 4 | D-10, D-22, D-25(5) | §Supabase CLI findings, §Pitfall 10 |
| DEPS-08 | Local Postgres 17: `major_version = 17`; clean `db:reset` on the PG17 image; `SHOW server_version` proves 17; pgTAP + `database.ts` regen again; PG15-validity of migrations recorded as a standing constraint; operator todo for hosted | 4 | D-14 | §Postgres 17 findings, §Runtime State Inventory |
| DEPS-09 | Deno Edge Function imports pinned exactly (`nodemailer` ≥ 10.0.6, `jose` 6.2.x via `npm:`, `supabase-js` exact 2.x); functions vitest, email/invite flows and bank-auth E2E 3× green; todo for the audit blind spot | 1, 3 | D-09 | §Deno findings |
| DEPS-10 | `@faker-js/faker` 10.x as its own group with the old-vs-new seed diff recorded; visual re-baselines only where traced | 1, 2 | D-20 | §Faker findings |
| DEPS-11 | LLM SDK stack migrated (`ai` 7, `@ai-sdk/*` 4) with package and admin-job tests and E2E green | 1, 2 | D-21 | §AI SDK findings, Open Question 2 |
| DEPS-12 | Tooling majors, one commit each; `@types/cheerio` removed | 1, 2 | D-23 | §Standard Stack |
| DEPS-13 | GitHub Actions majors + trufflehog patch, with CI-shape tests updated, observed via `ci-evidence/**` at job level | 1, 4 | D-10 | §Actions findings, §Pitfall 12 |
| DEPS-14 | Kit 3 + adapter-node 6 + adapter-static 4 landed behind an operator checkpoint, or held with a dated todo | 1 | D-15(2), D-32 | §Kit 3 findings |
| DEPS-15 | Audit gate liveness re-keyed on the audit's own exit status (not baseline size), negative control observed with the network blocked; baseline rows each carry a current note; roadmap premise amended; todos filed/updated | 3 | D-02, D-28, D-29, D-30, D-31 | §D-28 measured behaviour, §Code Examples |
| DEPS-16 | Final gates: typecheck, `lint:check`, svelte-check (frontend + docs), unit, pgTAP, production builds (frontend + docs), `audit:deps`, docs link check + ResearchQuote diff, then the full E2E suite under the cardinal rule on PG17 | 4 | D-26 | §Validation Architecture |
</phase_requirements>

## Summary

The locked plan is sound, and most of its premises held when re-measured on 2026-10-01: today `yarn audit:deps` exits 1 with **9 NEW / 66 ACCEPTED / 4 stale** high+ findings. Every NEW finding has an in-range fix: `brace-expansion` reaches 1.1.21 / 2.1.7 / 5.0.12, `devalue` reaches 5.9.4 within Kit 2.55's own `^5.6.4` range, and `undici` reaches 6.29.0 within cheerio's `^6.19.5`. So group 0's refresh alone turns the gate green. Some premises need correcting before planning, because they change the work:

1. **D-03's "nothing else that matters" is wrong.** On 2026-10-01 the 30-day major rule also holds back **Vitest 5** (5.0.0 published 2026-09-03; it clears on 2026-10-03), **nodemailer 10** (clears 2026-10-04), **intl-messageformat 12** (clears 2026-10-15) and **dotenv 18** (clears 2026-10-17). `isomorphic-dompurify` 4 clears on 2026-10-01T08:14Z. Kit 3 and its adapters clear on 2026-10-31T17:22Z. The 7-day rule also holds the newest patch of `vite` (8.3.2), `globals` (17.13.0), `supabase` (2.119.0) and `vitest` (5.0.3).
2. **`engines.node: ">=24"` admits Node versions that two chosen deps refuse.** `jsdom` 30 and `isomorphic-dompurify` 4 both declare `^22.22.2 || ^24.15.0 || >=26.0.0`. This dev host runs Node **v24.14.1**, below that floor.
3. **The Node and Yarn pins live in more places than CONTEXT counts.** Besides the ×10 `node-version: 22.22.1` pins:
   - the CI negative-control job has a `"20.x"` out-of-range step, and its "in range" step must move to 24;
   - `assertDeclaredBinariesGate.test.ts:65` pins `{ node: '>=22', yarn: '4.13', … }` exactly;
   - the Dockerfile has a fifth Yarn pin, `ENV YARN_VERSION=4.13.0`.
4. **ESLint 10 errors on `--flag v10_config_lookup_from_file`.** The flag appears at **19 sites**: 13 lint scripts, `.lintstagedrc.json`, 4 frontend guard tests that construct `new ESLint({ flags: [...] })`, and `packages/README.md`.
5. **Two LLM dependencies have no importer.** `openai` and `jsonrepair` in `packages/llm` are imported nowhere.
6. **The final baseline will be empty.** After groups 5 (CLI drops `tar`) and 6 (faker 10), no high+ finding remains. Today's gate then exits **2** ("every accepted advisory vanished"), and an emptied baseline fails `auditBaselineShape.test.ts`. So D-28 must land **before group 5**; the safest place is group 0.

Two infrastructure moves carry more risk than their size suggests.

**Supabase CLI 2.83 → 2.119.** The CLI ships per-platform `optionalDependencies` since 2.100 (no postinstall, no `tar`). The bump also silently moves every local service image, with no config change:

- PostgREST v14.5 → v16.4
- GoTrue v2.187 → v2.197
- storage-api v1.41 → v1.79
- edge-runtime v1.71 → v1.77.1
- the PG15 image 15.8.1.085 → 15.19.0.002

**Postgres 17.** `major_version = 17` selects `supabase/postgres:17.11.0.002`. The schema is low-risk for PG17's known behaviour changes:

- no expression indexes and no materialized views;
- 27 functions pin `search_path = ''` (27 occurrences of `search_path = '' AS $$` in the migration);
- the only extensions are `pg_net` and `pgtap`, and none of the PG17-dropped extensions (`pgjwt`, `plv8`, `timescaledb`, `plls`, `plcoffee`) is used;
- privilege assertions filter `privilege_type`, so PG17's new `MAINTAIN` privilege does not shift counts.

**Primary recommendation:** plan the 12 sequential group plans exactly as D-25 orders them, with four changes:

- land D-28's audit-liveness re-key in group 0, before the baseline can empty;
- set `npmMinimalAgeGate: 7d` before the group-0 refresh, so the refresh itself obeys the rule;
- run every gate with `TURBO_FORCE=true`, because turbo does not hash the Node version or the shared ESLint and TS base configs;
- treat each "pin" commit (Node, Yarn, CLI, Playwright, Actions) as a multi-file edit whose complete site list is given in this document.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dependency resolution, age gate, catalog | Build tooling (Yarn 4, `.yarnrc.yml`, `yarn.lock`) | CI (`yarn install --frozen-lockfile`) | Versions are decided at resolve time; the lockfile is the single artefact every tier consumes |
| Node runtime | Frontend Server (SSR, adapter-node in Docker on Render) | CI runners, dev host | The Dockerfile base image is the deployed runtime; CI pins and `engines` must match it |
| Vite/Rolldown build, Kit, vite-plugin-svelte | Frontend Server (SSR build) + Browser (client bundle) | CDN/static (docs app via adapter-static) | Build output for both tiers changes; diff and visual gate cover it |
| `@supabase/ssr` cookies, `safeGetSession` | Frontend Server (hooks, `locals`) | Browser (`createBrowserClient`) | Auth cookie writes happen server-side through `createSupabaseCookieAdapter` |
| DOMPurify/jsdom sanitising | Frontend Server (SSR via `isomorphic-dompurify` → jsdom) | Browser (native DOMPurify) | jsdom only loads on the server, which is where the ESM-only chain matters |
| Postgres 17, pgTAP, `database.ts` | Database / Storage (local Supabase) | API (PostgREST v16 from the CLI images) | Schema, RLS and types are database-owned; hosted stays PG15 |
| Edge Function imports (nodemailer, jose, supabase-js) | API / Backend (Deno edge runtime) | — | Resolved by Deno at function boot; invisible to the npm audit |
| Audit gate, CI-shape tests | CI / repo guards (`scripts/*.mjs`, `packages/dev-seed/tests`) | — | Repo-meta guards run under `yarn test:unit` and `lint:check` |

## Project Constraints (from CLAUDE.md)

- **E2E cardinal rule:** failing E2E is a cardinal failure; no "known-flaky" exemptions; "did not run" counts as failure. The full suite is the trusted signal. The wrapper is `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name>`, which spawns its own Supabase and dev server. Its port defaults to `FRONTEND_PORT=5273` on this host, because a Docker sibling holds 5173.
- **Never commit sensitive data;** CI evidence is pushed only as source-only trees to `ci-evidence/**` (memory: the CI evidence channel).
- **TypeScript strictly** (avoid `any`); **WCAG 2.1 AA** is preserved, and the visual and a11y gates must stay green.
- **Comment hygiene** (CLAUDE.md § Comment Hygiene). Comments must not narrate history or cite `D-NN` or `.planning` paths. This matters for the version-pin comments touched by this phase, for example `flowConformance.test.ts` and `verifyConfig.test.ts`, which quote `jose@v5.9.6` and `npm:nodemailer@6.9.10`, and the four `eslint-*-guard.test.ts` docblocks that explain the flag.
- **Code review checklist** `.agents/code-review-checklist.md` applies.
- **Environment:** only the root `.env` is edited. `PUBLIC_PROJECT_ID` is required.
- **Read gate exit status directly, never through a pipe** (D-26 plus the standing memory); use content anchors, not line numbers, in plans.

## Standard Stack

All versions observed 2026-10-01 via `npm view <pkg> dist-tags time engines peerDependencies`. These are `[VERIFIED: npm registry]` for version, date, engines and peers. Age is days to 2026-10-01T12:00Z. A "clears" date is the earliest timestamp the D-03 rule admits it. **Re-derive at execution start (D-33).**

### Runtime and toolchain

| Item | Current | Target (latest safe) | Published | Notes |
|---|---|---|---|---|
| Node | 22.22.1 CI / `node:22-alpine` | **24.21.0** (Active LTS "Krypton") | 2026-09-07 | `[VERIFIED: nodejs.org/dist/index.json]`. Docker tags `24-alpine` and `24.21.0-alpine` exist `[VERIFIED: hub.docker.com tags API]`. Node 24.21.0 still bundles corepack; corepack is no longer distributed starting with v25 `[CITED: nodejs.org/dist/v24.21.0/docs/api/corepack.html]` |
| Yarn | 4.13.0 | **4.18.1** | 2026-09-24 (7d on 10-01T20:48Z) | 4.15.0 made `npmMinimalAgeGate: 1d` the default. 4.14.1/4.16.0 fix the EBADF fstat bug on Node 24.15+ `[CITED: github.com/yarnpkg/berry releases + PRs #7104, #7135, #7152]` |
| TypeScript | 5.9.3 | **6.0.3** (hold 7.0.2) | 2026-04-16 | `typescript-eslint` 8.71.0 peer `>=4.8.4 <6.1.0`; `svelte-check` 4.7.6 peer `^5.0.0 \|\| ^6.0.0` |
| `@types/node` | 22.19.15 | **24.19.0** (latest 24.x; 26.6.3 is `latest`) | 2026-09-25 (clears 7d on 10-02) | Vitest 5 peer `@types/node: ^22.0.0 \|\| >=24.0.0` |

### Build (group 3)

| Package | Current | Target | Published / major x.0.0 | Peers / engines |
|---|---|---|---|---|
| `@sveltejs/kit` | 2.55.0 | **2.70.3** | 2026-08-18 | peers `vite ^5.0.3 \|\| ^6 \|\| ^7.0.0-beta.0 \|\| ^8.0.0`, `@sveltejs/vite-plugin-svelte … \|\| ^7.0.0`, `typescript ^5.3.3 \|\| ^6.0.0` |
| `@sveltejs/kit` 3 (group 10) | — | 3.0.0 | 2026-10-01T17:22Z → **clears 2026-10-31T17:22Z** | peers `vite ^8.0.12`, `svelte ^5.57.1`, `typescript ^6.0.0`, `@sveltejs/vite-plugin-svelte ^7.0.0`; engines `node >=22.17` |
| `@sveltejs/adapter-node` | 5.5.4 | **5.5.7** (6.0.0 held, clears 10-31) | — | 5.5.7 peer `@sveltejs/kit ^2.4.0` |
| `@sveltejs/adapter-static` | 3.0.10 | 3.0.10 (already latest 3.x; 4.0.0 held) | — | peer `@sveltejs/kit ^2.0.0` |
| `vite` | 6.4.1 (frontend) / ^7.2.6 (docs) | **latest 8.x ≥ 7 days old** (8.3.2 is 0d) | 8.0.0 2026-03-12 | engines `^20.19.0 \|\| >=22.12.0` |
| `@sveltejs/vite-plugin-svelte` | 5.1.1 / 6.2.1 | **7.3.1** | 2026-09-23 | peer `vite ^8.0.0-beta.7 \|\| ^8.0.0`, `svelte ^5.46.4`; engines `^20.19 \|\| ^22.12 \|\| >=24` |
| `svelte` | ^5.53.12 | **5.57.1** | 2026-09-18 | Kit 3 needs `^5.57.1` |
| `@tailwindcss/vite`, `tailwindcss` | ^4.2.1 | **4.3.3** | 2026-07-16 | peer `vite ^5.2.0 \|\| ^6 \|\| ^7 \|\| ^8` |
| `vite-plugin-devtools-json` (docs) | ^1.0.0 | 1.1.0 | 2026-07-20 | peer includes `^8.0.0` |
| `@inlang/paraglide-js` | ^2.15.0 | **2.25.4** (in range) | 2026-09-17 | depends on `@inlang/sdk ^3.0.6`, which brings `kysely ^0.28.12`; this fixes the 3 kysely rows |
| `vite-plugin-restart` | ^2.0.0 | **removed** (D-18) | — | peer only up to vite 7 (CONTEXT fact 9) |

### Test (group 4)

| Package | Current | Target | Published / x.0.0 | Notes |
|---|---|---|---|---|
| `vitest` (catalog + docs) | ^3.2.4 / ^4.0.15 | **5.0.x ≥ 7 days** (5.0.3 is 1d; 5.0.2 is 2026-09-25) | 5.0.0 2026-09-03T12:24Z → **clears 2026-10-03T12:24Z** | engines `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0` (admits 24); peer `vite ^6.4.0 \|\| ^7 \|\| ^8` |
| `@vitest/browser-playwright` (docs) | ^4.0.15 | 5.0.x (same clear date) | — | peer `vitest 5.0.3`, `playwright *`. The docs app has **zero** test files; see Open Question 3 |
| `jsdom` | ^26.1.0 | **30.1.1** | 30.0.0 2026-07-27 | engines `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0`. Depends on `@exodus/bytes ^1.15.1` (`"type":"module"`), `html-encoding-sniffer ^7.0.0` and `undici ^8.10.2` |
| `isomorphic-dompurify` | ^3.3.0 | **4.4.0** | 4.0.0 2026-09-01T08:14Z → clears 2026-10-01T08:14Z | engines as jsdom; depends on `jsdom ^30.0.0` |
| `@playwright/test`, `playwright` | ^1.58.2 | **1.63.0** | 2026-09-04 | the local visual container image digest must move too (Pitfall 9) |
| `@axe-core/playwright` | ^4.11.3 | 4.13.0 | 2026-08-11 | in range |

### Lint and format (group 2)

| Package | Current | Target | Notes |
|---|---|---|---|
| `eslint` | ^9.39.2 | **10.11.0** (2026-09-18) | engines `^20.19.0 \|\| ^22.13.0 \|\| >=24` |
| `@eslint/js` | ^9.39.1 | **10.0.1** | — |
| `eslint-plugin-import-x` (new) | — | **4.17.1** (2026-06-28) | peer `eslint ^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0`. Optional peers `@typescript-eslint/utils`, `eslint-import-resolver-node`. Dep `unrs-resolver` has a `postinstall: node postinstall.js` (napi binding check) |
| `eslint-plugin-import` | ^2.32.0 | **removed** | peer stops at eslint ^9 |
| `@eslint/eslintrc` (FlatCompat) | ^3.2.0 | **remove** after replacing `compat.extends` (Pattern 4) | used in `shared-config` and `apps/frontend` |
| `typescript-eslint` / `@typescript-eslint/*` | ^8.57.0 / docs ^8.48.1 | **8.71.0** | peer `eslint … \|\| ^10.0.0`, `typescript >=4.8.4 <6.1.0` |
| `eslint-plugin-svelte` | catalog ^2.46.1 / docs ^3.13.1 | **3.23.0** via catalog (frontend crosses 2 → 3) | v3 is ESM-only with new recommended rules `[CITED: eslint-plugin-svelte@3.0.0 release notes]` |
| `svelte-eslint-parser` | ^1.6.0 | 1.8.1 | — |
| `eslint-plugin-unused-imports` | ^4.4.1 | 4.4.1 | peer `eslint ^10.0.0 \|\| ^9 \|\| ^8` |
| `eslint-plugin-playwright` | ^2.9.0 | 2.12.0 | peer `eslint >=8.40.0` |
| `eslint-config-prettier` | ^10.1.8 | 10.1.8 | peer `eslint >=7.0.0` |
| `eslint-plugin-simple-import-sort` | ^12.1.1 | **14.0.0** (2026-07-16) | followed by its own re-sort commit |
| `prettier` | ^3.7.4 | 3.9.9 | in range |
| `prettier-plugin-svelte` | ^3.5.1 | **4.1.1** | peer `svelte ^5.0.0`; reformat commit |
| `prettier-plugin-tailwindcss` | ^0.7.2 | **0.8.1** | reformat commit |
| `globals` | ^15.14.0 / docs ^16.5.0 | **17.x ≥ 7 days** (17.13.0 is 0d) | catalog convergence (D-13) |

### Supabase (group 5)

| Package / pin | Current | Target | Notes |
|---|---|---|---|
| `supabase` CLI (catalog `^2.78.1`, resolves 2.83.0) + 6 `setup-cli` `version:` | 2.83.0 | **latest ≥ 7 days** (2.119.0 2026-09-30; 2.118.0 2026-09-25; 2.117.0 2026-09-07) | 2.119.0 deps are `jose`, `eciesjs`; per-platform `optionalDependencies` `@supabase/cli-<os>-<arch>[-musl]`; no install script (packaging changed at ≥ 2.100) |
| `supabase/setup-cli` | @v1 | **@v3** (v3.0.0 2026-07-07) | v3 installs the CLI **from the npm package** and removes the `github-token` input `[CITED: github.com/supabase/setup-cli releases v3.0.0]` |
| `@supabase/supabase-js` | catalog ^2.49.4; root direct ^2.99.3 | **2.117.x** (2.117.2 is 2026-09-25) | engines `node >=22.0.0`. Recommend the root direct range also becomes `catalog:` |
| `@supabase/ssr` | ^0.9.0 | **0.12.7** (2026-09-08) | peer `@supabase/supabase-js ^2.114.0`. 0.10 added a headers parameter to `setAll` for cache headers. 0.12 is a getAll/setAll rewrite with base64url+length chunk encoding `[CITED: github.com/supabase/ssr CHANGELOG]` |
| local Postgres | `major_version = 15` | **17** | CLI 2.119.0 pins `supabase/postgres:17.11.0.002 AS pg` and `supabase/postgres:15.19.0.002 AS pg15` `[VERIFIED: supabase/cli v2.119.0 apps/cli-go/pkg/config/templates/Dockerfile]` |

### Deno Edge Function imports (group 5)

| Import (verbatim today) | Target |
|---|---|
| `import nodemailer from 'npm:nodemailer@6.9.10';` `[VERIFIED: send-email/index.ts:2]` | `npm:nodemailer@10.0.x` (≥ 10.0.6). The 10.x line is ESM with `export default nodemailer` `[VERIFIED: unpkg nodemailer@10.0.13/dist/esm/nodemailer.js]`. **10.0.0 clears the 30-day rule on 2026-10-04T07:45Z** |
| `import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts';` `[VERIFIED: identity-callback/index.ts:28]` | `npm:jose@6.2.12`. v6 drops RSA1_5 JWE, Ed448/X448 and secp256k1, and `importJWK` yields `CryptoKey` `[CITED: github.com/panva/jose releases v6.0.0]`. The frontend already runs jose 6 for the same decrypt→verify flow |
| `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';` `[VERIFIED: send-email/index.ts:1, identity-callback/index.ts:27, invite-candidate/index.ts:1]` | exact pin, e.g. `npm:@supabase/supabase-js@2.117.2` (recommended for uniformity with the other two `npm:` specifiers) |

### Faker, LLM and tooling majors (groups 6–8)

| Package | Current | Target | Clears / notes |
|---|---|---|---|
| `@faker-js/faker` | ^8.4.1 | **10.6.0** (2026-08-14) | engines `^20.19.0 \|\| ^22.13.0 \|\| ^23.5.0 \|\| >=24.0.0`; ESM-only |
| `ai` | ^5.0.0 | **7.x** (7.0.126 is 0d) | engines `>=22`; ESM-only |
| `@ai-sdk/google`, `@ai-sdk/openai` | ^2 | **4.x** | v7 renames `createGoogleGenerativeAI` → `createGoogle` `[CITED: ai-sdk.dev migration-guide-7-0]` |
| `openai` | ^4.96.0 | 7.25.0 — **no importer in the repo**, see Open Question 2 | — |
| `jsonrepair` | ^3.13.0 | 3.15.0 — **no importer**, see Open Question 2 | — |
| `concurrently` | ^9.0.0 | **10.0.5** | engines `>=22` |
| `lint-staged` | ^16.4.0 | **17.6.0** | engines `>=22.22.1` |
| `glob` | ^11.0.0 | **13.0.6** | engines `18 \|\| 20 \|\| >=22`; only importers are `apps/docs/scripts/*` |
| `@changesets/cli` / `changelog-github` | ^2.30.0 / ^0.6.0 | **3.0.3 / 1.0.1** | engines `node ^22.11 \|\| ^24 \|\| >=26`, `yarn >=4.5.2` |
| `dotenv` | ^17.3.1 | **18.x** | 18.0.0 2026-09-17T21:18Z → **clears 2026-10-17T21:18Z** |
| `js-yaml` | ^4.1.0 | **5.4.2** | 5.0.0 2026-06-20 |
| `intl-messageformat` | ^11.1.3 | **12.1.2** | 12.0.0 2026-09-15T12:27Z → **clears 2026-10-15T12:27Z** |
| `cheerio` | ^1.0.0 | **1.2.0** (in-range, undici ^7) | engines `>=20.18.1` |
| `@types/cheerio` | ^0.22.35 | **remove** | deprecated stub |

### GitHub Actions (group 9)

`[VERIFIED: GitHub releases API 2026-10-01]`

| Action | Pinned | Latest | Count in workflows | Notes |
|---|---|---|---|---|
| `actions/checkout` | @v4 | v7.0.1 | **17** (main 9, docs 1, release 1, claude* 3+3) | v7: blocks fork-PR checkout for `pull_request_target`/`workflow_run` |
| `actions/setup-node` | @v4 | v7.0.0 | 11 | v5: auto-cache from `packageManager`; v6: auto-cache limited to npm; v7: ESM. The explicit `cache: "yarn"` keeps working |
| `actions/upload-artifact` | @v4 | v7.0.1 | 2 | v6+ runs on node24 runtime |
| `dorny/paths-filter` | @v3 | v4.0.3 | 1 | node24 runtime only |
| `supabase/setup-cli` | @v1 | v3.0.1 | 6 | see Supabase table |
| `changesets/action` | @v1 | v2.1.2 | 1 (`release.yml`) | **v2 requires an explicit `github-token` input** (the `GITHUB_TOKEN` env is no longer used for credentials); `commit-mode` → `push-with-git-cli` |
| `trufflesecurity/trufflehog` | @v3.97.2 + `version: "3.97.2"` | v3.97.9 | 1 (two literals) | `ciSecretScanFlags.test.ts` requires `@v\d+.\d+.\d+` |
| *Not in D-10's list:* `actions/configure-pages` @v4, `actions/upload-pages-artifact` @v3, `actions/deploy-pages` @v4 (docs.yml) | | v6.0.0 / v5.0.0 / v5.0.1 | 1 each | see Open Question 4 |
| `threeal/setup-yarn-action` @v2, `anthropics/claude-code-action` @v1 | | already latest major | — | none |

## Package Legitimacy Audit

Run: `gsd-tools query package-legitimacy check --ecosystem npm …` on 2026-10-01. Every `SUS` verdict below is **only** `too-new` (the latest version is days old) and/or `unknown-downloads` (the downloads API returned null), applied to long-established packages already in this lockfile. No package is `SLOP`.

| Package | Registry | Latest published | Downloads/wk | Source repo | Verdict | Disposition |
|---|---|---|---|---|---|---|
| eslint-plugin-import-x (**new to repo**) | npm | 2026-06-28 | 7.9M | github.com/un-ts/eslint-plugin-import-x | OK | Approved; its dep `unrs-resolver` runs `postinstall: node postinstall.js` (napi binding check, may fetch the platform binding from the npm registry). Flagged for the human-verify checkpoint |
| @supabase/cli-{darwin-arm64, linux-x64, linux-x64-musl, linux-arm64} (**new to lockfile**, CLI optional deps) | npm | 2026-09-30 | 0.18M–4.1M (arm64: null) | github.com/supabase/cli | SUS (too-new; arm64 unknown-downloads) | Flagged; the age gate selects an older version at execution; checkpoint |
| nodemailer (Deno) | npm | 2026-09-30 | 27M | github.com/nodemailer/nodemailer | SUS (too-new) | Flagged; the 30-day major rule applies until 2026-10-04 |
| jose | npm | 2026-09-05 | 164M | github.com/panva/jose | SUS (too-new) | Flagged (already in tree) |
| jsdom / isomorphic-dompurify | npm | 2026-09-22 / 09-25 | 122M / 6.8M | jsdom/jsdom, kkomelin/isomorphic-dompurify | SUS (too-new) | Flagged |
| @sveltejs/kit, adapter-node, adapter-static | npm | 2026-10-01 | 3.4M / 1.1M / 1.1M | sveltejs/kit | SUS (too-new) | Flagged; Kit 3 held anyway |
| vite, @sveltejs/vite-plugin-svelte, vitest, @vitest/browser-playwright | npm | 09-23 … 10-01 | 4M–219M | vitejs/vite, sveltejs/vite-plugin-svelte, vitest-dev/vitest | SUS (too-new) | Flagged |
| eslint, @supabase/ssr, @supabase/supabase-js, supabase, ai, @ai-sdk/google, @ai-sdk/openai, openai, intl-messageformat, lint-staged, @changesets/changelog-github, playwright | npm | 2026-09-04 … 09-30 | 1.3M–188M | (official repos) | SUS (too-new) | Flagged |
| @changesets/cli, dotenv, js-yaml, globals, @types/node, @playwright/test, eslint-plugin-simple-import-sort, eslint-plugin-svelte, daisyui | npm | various | null | (official repos) | SUS (unknown-downloads ± too-new) | Flagged |
| typescript, @eslint/js, @faker-js/faker, prettier-plugin-svelte, prettier-plugin-tailwindcss, concurrently, glob, cheerio | npm | — | — | (official repos) | OK | Approved |
| @ai-sdk/codemod (tool, run via `npx`) | npm | 2026-09-30 | 2.3K | github.com/vercel/ai | SUS (too-new) | Optional tool for D-21; checkpoint before running |
| sv (Kit 3 migrator, `npx sv@next migrate sveltekit-3`) | npm | 2026-10-01 | 27K | github.com/sveltejs/cli | SUS (too-new) | Group 10 only; checkpoint |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** every row marked SUS above.

The `too-new` signal is time-relative: once D-04's `npmMinimalAgeGate: 7d` is set, Yarn will not resolve a version younger than 7 days, so most of these flags disappear by construction. Recommendation: **one `checkpoint:human-verify` per group plan**, listing that group's SUS packages and the exact versions the age-gated resolution picked (re-run `gsd-tools query package-legitimacy check` against them), rather than one checkpoint per package. The only genuinely new names are `eslint-plugin-import-x` with its `unrs-resolver` postinstall, and the `@supabase/cli-*` platform packages.

## Architecture Patterns

### System Architecture Diagram (the upgrade pipeline)

```
 registry (npm, nodejs.org, GH releases)
        │  version scan at plan time + execution start (D-33)
        ▼
 [age/advisory filter] ── 7d (npmMinimalAgeGate) ── 30d for x.0.0 (by hand) ── high+ advisory? ──► HOLD + todo
        │ pass
        ▼
 group N plan ──► per-upgrade commit (manifest + yarn.lock + migration, lockfile confined to subtree)
        │                  │
        │                  ├─ Node/Yarn/CLI/Playwright/Actions "pin" commits: every site in the site list
        │                  └─ formatter/sorter majors: + separate reformat commit
        ▼
 per-group gates (TURBO_FORCE=true; exit status read directly)
   typecheck · lint:check · format:check · frontend+docs svelte-check · test:unit · build (frontend, docs) · audit:deps
        │        └─ group 1: + docker build/run smoke + E2E after the Node commit
        │        └─ group 5: + db:types diff + pgTAP (after CLI commit, after PG17 commit) + bank-auth 3×
        │        └─ groups 3,5,6,7,10: + E2E (e2e-run.sh)
        ▼
 red? ──► attributable to exactly one upgrade commit ──► fix-forward or revert that commit
        │ green
        ▼
 group 11: --update-baseline (reviewed) · notes · todos · ROADMAP amend
        ▼
 final: full E2E (cardinal rule) on fresh dev server + clean db:reset on PG17 · docs link check · ResearchQuote diff
```

### Recommended group-plan skeleton (one PLAN.md per group, strictly sequential)

```
169-00  age gate + audit liveness re-key (D-04, D-28) + lockfile refresh (D-07) + version table
169-01  Yarn 4.18 → Node 24 (isolated) → @types/node 24 → TS 6
169-02  import-x swap → ESLint 10 (+flag removal, FlatCompat removal) → prettier/sort majors → reformat
169-03  Vite 8 + vps 7 (catalog, both apps) + inline restart plugin → Kit 2.70 floor + adapters
169-04  Vitest 5 (catalog, projects) → jsdom 30 + dompurify 4 (− resolution) → Playwright 1.63 (+ image digest)
169-05  CLI + setup-cli pins + database.ts → [pgTAP] → PG17 → [pgTAP, db:types] → supabase-js → ssr → Deno imports
169-06  faker 10 (seed diff first)
169-07  AI SDK 7 / @ai-sdk 4 (codemods) [+ openai/jsonrepair disposition]
169-08  tooling majors, one commit each (+ @types/cheerio removal)
169-09  Actions majors + trufflehog (+ CI-shape tests) → ci-evidence run
169-10  Kit 3 (non-autonomous; or recorded hold)
169-11  baseline notes, todos, ROADMAP amend, final full gate
```

### Pattern 1: Group 0 is "refresh within ranges", and it moves Kit
**What:** `yarn up -R '*'` re-resolves every descriptor within its declared range and does not touch manifests. `yarn dedupe` then collapses duplicates. Yarn's own help text: *"When operating under this mode `yarn up` will force all ranges matching the selected packages to be resolved again (often to the highest available versions) … It however won't touch your manifests anymore"* `[VERIFIED: yarn up --help, Yarn 4.13.0]`. Glob patterns are accepted.

**Consequence the plan must state:** the catalog has `'@sveltejs/kit': ^2.55.0` `[VERIFIED: .yarnrc.yml:25]`, so the group-0 refresh already resolves Kit to **2.70.3**. Likewise vite to 6.4.3 / 7.3.6, vitest to 3.2.7, docs vitest/@vitest/browser to 4.1.11, `@inlang/paraglide-js` to 2.25.4 (which brings `@inlang/sdk` 3 and kysely 0.28), and concurrently to 9.2.x. Group 3's "Kit 2.70" step therefore reduces to raising the manifest floor and the adapters. Running the refresh *after* setting the age gate makes it pick only versions ≥ 7 days old.

### Pattern 2: A "pin" commit is a site list, not a value
Each runtime/tool pin lives in several files, and some of those files are guard tests that assert the old value. Each pin's site list is below. Every entry was observed this session.

- **Node 24 commit:**
  - 10 × `node-version: 22.22.1` (`release.yml` 1, `main.yaml` 8, `docs.yml` 1), plus the step names `Setup Node.js 22.22.1`;
  - `main.yaml` job `node-engine-range-negative-control`: `node-version: "20.x"` (out-of-range control) and `- name: "Setup Node.js 22.22.1 (in range)"` `[VERIFIED: main.yaml:684,694,713]`;
  - `apps/frontend/Dockerfile:1` `FROM node:22-alpine AS base`;
  - `package.json:93` and `apps/frontend/package.json:54` `"node": ">=22",`;
  - `packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts:65` `expect(readManifest('package.json').engines).toEqual({ node: '>=22', yarn: '4.13', npm: 'please-use-yarn' });`.

  `packages/dev-seed/tests/nodeEngineGate.test.ts` requires the negative-control `<major>.x` to be below the declared `>=<major>` (`expect(Number(selected?.[1])).toBeLessThan(Number(declared?.[1]));`). 20 < 24 passes, but **recommend moving the control to `"22.x"`**, the previous floor and the most realistic wrong Node.
- **Yarn commit:**
  - `.yarnrc.yml:3` `yarnPath: .yarn/releases/yarn-4.13.0.cjs` (use `yarn set version 4.18.1`, then delete the old `.cjs` if it remains);
  - `package.json:102` and `apps/frontend/package.json:81` `"packageManager": "yarn@4.13.0"`;
  - `engines.yarn` `"4.13"` in both manifests;
  - `apps/frontend/Dockerfile:6` `ENV YARN_VERSION=4.13.0` (**not in D-12's list**);
  - 9 × `version: 4.13` and the step names `Setup Yarn 4.13`;
  - the `assertDeclaredBinariesGate.test.ts:65` literal;
  - the `.github/trufflehog-exclude-paths.txt:8` comment naming `yarn-4.13.0.cjs` (the regex on line 24, `^\.yarn/releases/.*\.cjs$`, already covers the new file).
- **Supabase CLI commit:**
  - catalog `supabase: ^2.78.1` `[VERIFIED: .yarnrc.yml:40]`;
  - 6 × `version: 2.83.0` under `supabase/setup-cli@v1`.

  `rpcNullabilityGate.test.ts` asserts every setup-cli `version:` equals the `supabase@npm:` version resolved in `yarn.lock`. `security/audit-baseline.json` rows name `supabase@2.83.0` in `via`.
- **Playwright commit:**
  - catalog `'@playwright/test': ^1.58.2`, docs `"playwright": "^1.58.2"`;
  - `tests/scripts/visual-container.sh:76` `PW_IMAGE="${PW_IMAGE:-mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d}"` (the v1.58.2-noble digest; the script refuses to pull, exit 4);
  - comments naming `playwright:v1.58.2-noble` in `tcp-forward.mjs` and `visual-regression.spec.ts`.
- **Actions commit(s):**
  - `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts:105` `expect(uses).toEqual(['actions/checkout@v4']);`;
  - the `main.yaml` comment "A bump of the pinned `supabase/setup-cli@v1` version" and the matching `rpcNullabilityGate.test.ts` comments.

### Pattern 3: Audit liveness keyed on the audit's exit status (D-28)
**Measured this session** (read-only probes, no file changed):

| Run | stdout | exit |
|---|---|---|
| Findings (`yarn npm audit --all --recursive --severity high --json`) | 75 NDJSON lines | 1 |
| Clean (`yarn workspace @openvaa/core npm audit --environment production --json --severity info`) | **empty** | **0** |
| Clean, text mode | `➤ YN0001: No audit suggestions` | 0 |
| Network blocked (`YARN_NPM_AUDIT_REGISTRY=http://127.0.0.1:9 yarn npm audit … --json`) | **empty** (stack trace on stderr) | **1** |

So **empty stdout + exit 0 = clean; empty stdout + non-zero exit = did not run.** Today's `runAudit` swallows the status (`catch (error) { … stdout = error.stdout; }`) `[VERIFIED: scripts/assert-dependency-audit.mjs:167-172]`. Its empty-instrument check is `if (findings.length === 0 && baseline.accepted.length > 0)` `[VERIFIED: :282]`, so with an empty baseline a blocked network exits 0 (CONTEXT fact 12, now observed).

**Recommended mechanism:** classify on `(status, stdout)`:
- non-empty stdout → parse NDJSON (every line must parse, as today);
- empty stdout and `status === 0` → clean;
- empty stdout and `status !== 0` → `cannotRun` (exit 2), regardless of baseline size.

Export the classifier as a pure function, following `assert-node-engine.mjs`'s exported `satisfies`. `auditBaselineShape.test.ts` can then unit-test all three rows offline, replacing `expect(baseline.accepted.length).toBeGreaterThan(0)` `[VERIFIED: auditBaselineShape.test.ts:66-68]`. Negative control: `YARN_NPM_AUDIT_REGISTRY=http://127.0.0.1:9 node scripts/assert-dependency-audit.mjs` → must exit 2, observed against an empty-baseline scratch copy before acceptance. `npmMinimalAgeGate` and `npmPreapprovedPackages` are **not** in `const FORBIDDEN_YARNRC_KEYS = ['npmAuditIgnoreAdvisories', 'npmAuditExcludePackages'];` `[VERIFIED: auditBaselineShape.test.ts:38]`, so D-04 passes that test unchanged.

### Pattern 4: ESLint 10 config without FlatCompat
`packages/shared-config/eslint.config.mjs` uses `...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'),` `[VERIFIED: :39]`. `apps/frontend/eslint.config.mjs` uses `...compat.extends('plugin:svelte/prettier'),` `[VERIFIED: :188]`. Replace these with the native flat exports:

- `js.configs.recommended`;
- the `typescript-eslint` flat recommended config;
- `eslint-config-prettier` (the docs app already imports it as a flat config: `import prettier from 'eslint-config-prettier';` `[VERIFIED: apps/docs/eslint.config.js:2]`);
- `...svelte.configs.prettier` (the docs app's existing pattern, `export default [prettier, ...svelte.configs.prettier, ...sharedConfig];` `[VERIFIED: apps/docs/eslint.config.js:5]`).

`@eslint/eslintrc` can then be dropped from the catalog, `shared-config` and the frontend. This is a recommendation `[ASSUMED]` that FlatCompat's `plugin:svelte/prettier` cannot load eslint-plugin-svelte v3's flat-array configs; the docs pattern is proven in-repo either way.

### Anti-Patterns to Avoid
- **Reading `turbo run` results after a toolchain or shared-config change without `TURBO_FORCE=true`.** `turbo.json` `lint.inputs` is `["$TURBO_DEFAULT$", "eslint.config.*"]` and `typecheck.inputs` is `["$TURBO_DEFAULT$", "tsconfig.json", "tsconfig.*.json"]` `[VERIFIED: turbo.json]`, both per workspace. An edit to `packages/shared-config/eslint.config.mjs` or `tsconfig.base.json`, or a Node version change, can replay a cached green. Phase 143 set the precedent: `TURBO_FORCE=true yarn lint:check`.
- **Piping a gate.** `lint:check` is a long `&&` chain; a red early link hides every later guard (memory).
- **`yarn up` on a `catalog:` dependency without checking the manifest diff afterwards.** Edit the catalog entry in `.yarnrc.yml`, then `yarn install`, and confirm no workspace manifest lost its `catalog:` value `[ASSUMED: yarn up's catalog-rewrite behaviour was not verified this session]`.
- **Regenerating `database.ts` after `supabase test db`.** `00-helpers.test.sql` commits helpers into `public`, and `yarn db:types` then leaks them into the types (memory). Regenerate on a fresh `db:reset`, before pgTAP.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Minimum release age | a script comparing `npm view time` | `npmMinimalAgeGate: 7d` (+ `npmPreapprovedPackages` exceptions) | Built into Yarn ≥ 4.10. `YARN_NPM_MINIMAL_AGE_GATE=7d yarn config get npmMinimalAgeGate` → `10080` (type DURATION, unit minutes) `[VERIFIED: yarn config, 4.13.0]` |
| Transitive refresh | new `resolutions` | `yarn up -R '*'` + `yarn dedupe` | D-07; every NEW row has an in-range fix |
| AI SDK 5→6→7 rewrites | manual find/replace | `npx @ai-sdk/codemod` (v6, then v7 transforms) | Official codemods cover `system→instructions`, usage-token fields and Google provider renames `[CITED: ai-sdk.dev/docs/migration-guides/migration-guide-7-0]` |
| Kit 3 migration (if not held) | manual config moves | `npx sv@next migrate sveltekit-3 --tasks all --confirm` | Kit 3 moves config into the Vite plugin and `$lib` → `#lib` subpath imports `[CITED: svelte.dev/blog/sveltekit-3-release-candidate via search]` |
| Dev-server restart on root `.env` | a file watcher process | a 10-line inline Vite plugin using `server.watcher.add` + `server.restart()` | Documented `ViteDevServer` API: `restart(forceOptimize?: boolean): Promise<void>` `[CITED: vite.dev/guide/api-javascript]` |
| Audit-ran detection | a second audit run at `--severity info` | the audit's own exit status (Pattern 3) | One call; measured discriminating; no assumption that info-level findings always exist |
| Platform CLI binaries in Docker | postinstall downloads | Yarn's optional-dependency platform selection (supabase ≥ 2.100) | No network postinstall; the musl variant `@supabase/cli-linux-x64-musl`/`-arm64-musl` exists |

**Key insight:** in this repo the expensive failure is a gate that quietly stops measuring: a replayed turbo cache, a piped exit code, an emptied baseline, or a guard test asserting an old pin. Every upgrade commit must carry its guard-test edits, and every gate must be forced and read by exit code.

## Runtime State Inventory

This phase migrates runtime infrastructure (the Node runtime and the Postgres major), so all 5 categories are answered.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | Local Docker volume `supabase_db_openvaa-local` holds a **PG15** data directory `[VERIFIED: docker volume ls]`. PG17 cannot open it. Seeded E2E/default data regenerates from `seed.sql` and dev-seed. `tests/e2e-runs/` holds evidence and must **not** be deleted (memory). Hosted Supabase Postgres stays 15 (D-14) | Operator-facing step in the PG17 commit: `yarn db:stop` → `yarn workspace @openvaa/supabase exec supabase stop --no-backup` (removes volumes) → `yarn db:reset`. **Data migration: none** locally (re-seed). Hosted: a todo (operator) |
| Live service config | **Render** service: `runtime: docker`, `dockerfilePath: ./apps/frontend/Dockerfile` `[VERIFIED: render.example.yaml]`, so the base image is the Node runtime. Any Render dashboard env such as `NODE_VERSION` applies to native Node services, not Docker `[ASSUMED: Render docs page did not state it]`. **Hosted Supabase** runs its own PostgREST/GoTrue versions, independent of the local CLI images (local becomes PostgREST v16.4, GoTrue v2.197) `[VERIFIED: CLI v2.119.0 Dockerfile]`. GitHub branch-protection required-check names are unchanged (job names are not renamed) | Operator item: confirm the Render service is Docker runtime and redeploy after merge (rollback = redeploy, D-11). Operator item: hosted PG17 upgrade todo |
| OS-registered state | Dev host Node **v24.14.1** via nvm `[VERIFIED: which node]`, below jsdom 30's `^24.15.0`. Cached Docker images: `supabase/postgres:15.8.1.085`, `mcr.microsoft.com/playwright:v1.58.2-noble` `[VERIFIED: docker images]`. New pulls needed: `supabase/postgres:17.11.0.002` (and `15.19.0.002` after the CLI bump), the Playwright v1.63 image, `node:24-alpine`. `apps/supabase/supabase/.temp/` exists (holds only `cli-latest`; no `postgres-version`) `[VERIFIED: ls]`. Worktree `core.hooksPath=/dev/null` override (memory) | `nvm install 24.21.0 && nvm use` **after** the Yarn bump. Pull and record new image digests (visual-container refuses to pull). Keep `.temp/postgres-version` absent (Pitfall 11) |
| Secrets/env vars | No env var is renamed. `release.yml` passes `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` as **env** to `changesets/action@v1`, but v2 requires the token as the `github-token` **input**. `setup-cli` v3 removes the `github-token` input (none is passed today) | Code edit in `release.yml` (group 9). No secret value changes |
| Build artifacts / installed packages | `node_modules` (no `binding.gyp` native addons; install scripts only in `esbuild` ×3 and `supabase@2.83.0`; after the bump also `unrs-resolver`) `[VERIFIED: node_modules scan]`. Old `.yarn/releases/yarn-4.13.0.cjs`. `.svelte-kit/`, `node_modules/.vite`, package `dist/`, the turbo cache. Vitest 5 writes a new `.vitest/` artefact dir | Full `yarn install` after the Node switch; delete the old Yarn release file; `yarn dev:clean`; `TURBO_FORCE=true` on gates; add `.vitest` to `.gitignore` and `.prettierignore` if Vitest 5 creates it (Pitfall 8) |

**After every file in the repo is updated, what still holds the old state?** The local PG15 volume, the dev host's Node 24.14.1, cached Docker images and turbo caches. Hosted Postgres 15 and the hosted Supabase service versions remain until the operator acts.

## Common Pitfalls

### Pitfall 1: The age rule is evaluated once, on the wrong day
**What goes wrong:** the plan copies CONTEXT's "only Kit 3 is held". Execution then takes Vitest 5 on 2026-10-02, or nodemailer 10 on 2026-10-03, against D-03.
**How to avoid:** at execution start, regenerate the age table with the probe below. Hold any major whose `x.0.0` is under 30 days old; take the latest version ≥ 7 days old. Clears (UTC): vitest 5 / @vitest/browser-playwright 5 → 2026-10-03T12:24, nodemailer 10 → 10-04T07:45, intl-messageformat 12 → 10-15T12:27, dotenv 18 → 10-17T21:18, Kit 3 / adapter-node 6 / adapter-static 4 → 10-31T17:22.
```bash
npm view <pkg> time --json | node -e '…print x.0.0 and latest…'
```
**Warning signs:** a lockfile entry whose `npm view <pkg>@<v> time` is under 7 days old, which `npmMinimalAgeGate` will refuse at the next resolve.

### Pitfall 2: `engines.node: ">=24"` admits Node that jsdom 30 / isomorphic-dompurify 4 refuse
**What goes wrong:** a developer on 24.0–24.14 (this host is on 24.14.1) passes `assert-node-engine` and then hits jsdom 30 on an unsupported runtime. Yarn does not enforce `engines` (the guard's docblock measured this).
**How to avoid:** see Open Question 1. Recommend `">=24.15.0"`, which is in the guard's accepted grammar (full triple under `>=`). `nodeEngineGate.test.ts` reads the major with `/^>=\s*(\d+)/`, so it still parses. Pin CI to 24.21.0 and upgrade the dev host.

### Pitfall 3: Yarn 4.13 on Node ≥ 24.15
**What goes wrong:** Yarn 4.13 predates the EBADF fstat fix for Node 24.15+ (berry PR #7104 in 4.14.1, superseded by #7152 in 4.16.0). The fix concerns loading zipped modules; this repo uses `nodeLinker: node-modules`, so impact here is `[ASSUMED]` low.
**How to avoid:** keep D-25's order. Yarn 4.18 lands first (on the current Node), then Node 24.21.

### Pitfall 4: TS 6 `types` now defaults to `[]`
**What goes wrong:** `packages/{data,app-shared,llm,question-info,argument-condensation}` use Node globals or `node:` modules in `src` and set no `types`. Their typecheck fails with "Cannot find name 'process'" or "Cannot find module 'node:…'". Other TS 6 default changes:
- `strict` true (already set);
- `module` esnext;
- `noUncheckedSideEffectImports` true (side-effect imports exist: `import '../app.css'` in `apps/frontend/src/routes/+layout.svelte`, and `import './prompts'` in two packages);
- `rootDir` defaults to `.`;
- `baseUrl` and `moduleResolution node10` are deprecated `[CITED: devblogs.microsoft.com/typescript/announcing-typescript-6-0]`.

**How to avoid:** add `"types": ["node"]` to `packages/shared-config/tsconfig.base.json`. The base currently has none; it sets `"moduleResolution": "Bundler"`, `"target": "es2020"`, `"strict": true` `[VERIFIED: tsconfig.base.json]`. Workspaces that already set `types` keep theirs (frontend `["vitest/globals"]`, dev-seed, dev-tools and tests `["node"]`). Run `TURBO_FORCE=true yarn typecheck` and both apps' `check`.

### Pitfall 5: The Docker image installs everything, including platform binaries
**What goes wrong:** `RUN yarn install --immutable` in `node:24-alpine` (musl, arm64 locally, amd64 on Render) runs install scripts (`esbuild`, `unrs-resolver`) and needs the musl CLI optional package. `ENV YARN_VERSION` and `corepack prepare` must match `packageManager`.
**How to avoid:** the group-1 gate builds the `production` target and runs it, mirroring CI's `docker-image-build` job:
```bash
docker build --file apps/frontend/Dockerfile --target production --tag openvaa-frontend:169 .
docker compose -f docker-compose.dev.yml up --build   # serves :3000
curl -fsS http://localhost:3000/
```

### Pitfall 6: ESLint 10 breaks the guard tests and lint-staged through the flag
**What goes wrong:** ESLint 10 makes config-lookup-from-file the default, and *"attempting to use the flag results in an error"* `[CITED: eslint.org/docs/latest/use/migrate-to-10.0.0]`. ESLint 10's `eslint:recommended` also adds `no-unassigned-vars`, `no-useless-assignment` and `preserve-caught-error`, which can produce real new findings; `eslint-env` comments become errors.
**Sites:**
- `package.json` `lint:fix` and `lint:check`;
- 10 package `lint` scripts plus `apps/frontend/package.json:10`;
- `.lintstagedrc.json:4` `"eslint --fix --flag v10_config_lookup_from_file"`;
- `new ESLint({ flags: ['v10_config_lookup_from_file'] })` in `eslint-{adapter-boundary,adapter-singleton,parse-posture,store}-guard.test.ts` (with docblocks saying the flag is MANDATORY);
- `packages/README.md:14`.

**How to avoid:** remove the flag at all 19 sites in the ESLint-10 commit; rewrite the guard-test docblocks. Treat new recommended-rule hits as code fixes (or explicitly configured rules) and record them. D-17's "zero new findings" means zero *unexplained* findings.

### Pitfall 7: The audit baseline empties mid-phase and the gate goes exit 2
**What goes wrong:** after group 5 (the CLI drops `tar`) and group 6 (faker 10), `yarn npm audit` at high+ returns nothing while the baseline still lists rows. Line 282 then exits 2. Running `--update-baseline` empties the file, and `auditBaselineShape.test.ts` fails.
**How to avoid:** land the D-28 re-key in plan 169-00. Run a reviewed `--update-baseline` at the end of each group that changes the findings; it re-emits only current findings, so stale rows drop automatically.

### Pitfall 8: Vitest 5 behaviour changes
Each of these is `[CITED: vitest.dev/guide/migration]`.

**What goes wrong:**
- `clearMocks` now defaults to `true`, so mock history is cleared before every test;
- unawaited `resolves`/`rejects` assertions fail the test;
- hoisted `vi.mock` calls inside functions or blocks now throw;
- worker IDs are 1-based;
- artifacts consolidate into `.vitest/` at the project root.

Vitest 4 had already removed workspace files: *"you cannot specify another file as the source of your workspace"* `[CITED: v4.vitest.dev/guide/migration]`. **This answers D-19's discretion item: `vitest.workspace.ts` stopped working in Vitest 4.0** (deprecated in 3.2).

**How to avoid:** replace `export default ['packages/**/vitest.config.ts'];` `[VERIFIED: vitest.workspace.ts:1]` with a root `vitest.config.ts`, `test: { projects: ['packages/*/vitest.config.ts'] }`. It is used only by root `test:unit:watch`; `test:unit` runs per workspace through turbo. Update the 8 package `vitest.config.ts` docblocks and the 2 dev-seed test comments that cite `/vitest.workspace.ts`. Compare `assert:unit-coverage` output and per-workspace test counts before and after. Run `git status --porcelain` after `yarn test:unit` to catch a new `.vitest/` directory, and add it to `.gitignore` and `.prettierignore` (`format:check` runs `prettier --check .`).

### Pitfall 9: Playwright bump vs the pinned visual container
**What goes wrong:** the local visual re-baseline container is pinned by digest to v1.58.2-noble and refuses to pull. With `@playwright/test` 1.63 the in-container browsers mismatch, or a re-baseline happens against the old browser build. CI's `e2e-visual` installs browsers on the runner (`yarn playwright install --with-deps`) and has never passed (todo `2026-09-03-ci-e2e-ssr-500.md`).
**How to avoid:** in the Playwright commit, update `PW_IMAGE` to the `mcr.microsoft.com/playwright:v1.63.0-noble` digest. Pull it explicitly first, then record the digest. Run the visual gate per `tests/scripts/visual-container.sh`. Attribute every diff to the browser build or a CSS change (D-24).

### Pitfall 10: "CLI pin" commit is really a backend-stack upgrade
**What goes wrong:** CLI 2.83 → 2.119 moves PostgREST v14.5 → v16.4, GoTrue v2.187.0 → v2.197.0, storage-api v1.41.8 → v1.79.28, realtime, edge-runtime v1.71.0 → v1.77.1, mailpit, postgres-meta (the type generator) v0.96.1 → v0.99.0, and the PG15 image 15.8.1.085 → 15.19.0.002 `[VERIFIED: supabase/cli v2.83.0 and v2.119.0 Dockerfile templates]`. PostgREST v16 deprecates filters named after an aliased embedded table (warning header) `[CITED: PostgREST v16.0 release notes]`.
**How to avoid:** run E2E (not just pgTAP) after the CLI commit, before PG17, so a PostgREST/GoTrue regression is attributed to the CLI and not to Postgres. Regenerate `database.ts` and expect generator-driven diffs; explain each one.

### Pitfall 11: A linked project silently pins the local Postgres image
**What goes wrong:** in CLI v2.119.0 `config.go`, when `major_version > 14` and `supabase/.temp/postgres-version` exists (written by `supabase link`), the image is replaced with `Images.Pg` tagged with that file's version `[VERIFIED: supabase/cli v2.119.0 apps/cli-go/pkg/config/config.go]`. An operator who links to the PG15 hosted project would run PG15 locally while `config.toml` says 17.
**How to avoid:** the PG17 gate asserts the server version, not the config value: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -Atc 'show server_version'` → `17.*` (psql 17.6 is on the host). Today `.temp/` holds only `cli-latest`.

### Pitfall 12: CI evidence is partial by construction
**What goes wrong:** `release.yml` (push to `main` only) and `docs.yml` (`main` + `workflow_dispatch`) never run on `ci-evidence/**`, so `changesets/action` v2 and the docs pages actions cannot be observed before merge. In `main.yaml`, `e2e-tests` and `e2e-visual` have never passed in CI (HTTP 500 todo), so a run concludes `failure` at run level.
**How to avoid:** read job-level results. Record the two workflows as "unobservable until merge", with an operator follow-up to watch the first `main` run. Do not claim them green.

### Pitfall 13: Deno imports have no static gate
**What goes wrong:** nothing typechecks `apps/supabase/supabase/functions/*/index.ts`. There is no `deno check` in CI, Deno is not installed on the host, and vitest suites read `index.ts` as **source text** because remote specifiers cannot be imported. A bad specifier fails only when the edge runtime boots the function.
**How to avoid:** after the import edits, `supabase start` (or `supabase functions serve`) and invoke each function: bank-auth E2E for `identity-callback`, the invite flow, and the email bucket fixture for `send-email`. Update the source-text tests' comments that quote the old pins (comment hygiene).

## Code Examples

### `.yarnrc.yml` age gate (D-04)
```yaml
# Source: yarn config --json (npmMinimalAgeGate: type DURATION, unit "m"; "7d" parses to 10080)
npmMinimalAgeGate: 7d
# Only when D-03's 2-day security exception applies, one descriptor per entry:
# npmPreapprovedPackages:
#   - "some-package@1.2.4"
```

### Inline root-`.env` restart plugin (D-18) — replaces `ViteRestart({ restart: ['../../.env'] })` `[VERIFIED: apps/frontend/vite.config.ts:26-28]`
```ts
// Source: ViteDevServer.watcher / restart() — vite.dev/guide/api-javascript
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

function restartOnRootEnv(repoRoot: string): Plugin {
  const envFile = resolve(repoRoot, '.env');
  return {
    name: 'openvaa:restart-on-root-env',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add(envFile);
      server.watcher.on('change', (file) => {
        if (resolve(file) === envFile) void server.restart();
      });
    }
  };
}
// plugins: [tailwindcss(), paraglideVitePlugin(...), sveltekit(), restartOnRootEnv(repoRoot)]
```
`repoRoot` already exists in that file: `const repoRoot = fileURLToPath(new URL('../../', import.meta.url));` `[VERIFIED: vite.config.ts:11]`. Manual check (D-18): run `yarn workspace @openvaa/frontend dev`, touch the root `.env`, and the log shows a server restart.

### import-x swap (D-17) in `packages/shared-config/eslint.config.mjs`
```js
// Source: eslint-plugin-import-x 4.17.1 (peer eslint ^10); rule names verbatim from :180-186
import importX from 'eslint-plugin-import-x';
// plugins: { ..., 'import-x': importX }
// rules:
'import-x/first': 'error',
'import-x/newline-after-import': 'error',
'import-x/no-duplicates': 'error',
'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
```
No `eslint-disable … import/…` comment exists in the repo `[VERIFIED: git grep]`, so renaming the namespace to `import-x/*` breaks nothing. Keeping the key `import` is also valid. Planted-violation proof: one fixture per rule, linted before (old plugin) and after (import-x), with each red naming its rule.

### Root Vitest projects (D-19)
```ts
// vitest.config.ts (repo root) — replaces vitest.workspace.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { projects: ['packages/*/vitest.config.ts'] } });
```

### Audit classifier (D-28)
```js
// scripts/assert-dependency-audit.mjs — exported, unit-tested from auditBaselineShape.test.ts
export function classifyAuditRun({ status, stdout }) {
  const lines = stdout.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length > 0) return { kind: 'findings', lines };
  if (status === 0) return { kind: 'clean' };           // measured: clean audit → empty stdout, exit 0
  return { kind: 'did-not-run', status };              // measured: network blocked → empty stdout, exit 1
}
```
`runAudit` keeps `error.status` instead of discarding it. `main()` calls `cannotRun` on `did-not-run` independently of `baseline.accepted.length`.

### Deno imports (D-09)
```ts
import nodemailer from 'npm:nodemailer@10.0.13';          // ≥10.0.6, ≥30d major rule from 2026-10-04
import * as jose from 'npm:jose@6.2.12';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
```
Exact versions are re-derived at execution start. `config.toml` sets `deno_version = 2` `[VERIFIED: config.toml:404]`.

### PG17 switch (D-14)
```toml
# apps/supabase/supabase/config.toml — today: "major_version = 15" [VERIFIED: :47]
major_version = 17
```
Operator step:
```bash
yarn db:stop
(cd apps/supabase && yarn supabase stop --no-backup)
docker builder prune -af
yarn db:reset
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -Atc 'show server_version'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact here |
|--------------|------------------|--------------|-------------|
| `vitest.workspace.ts` | `test.projects` in the root config | deprecated 3.2, removed 4.0 | D-19 migration |
| eslintrc / FlatCompat; `--flag v10_config_lookup_from_file` | flat config only; lookup-from-file default; flag errors | ESLint 10.0.0 (2026-02-06) | 19 flag sites; drop `@eslint/eslintrc` |
| `eslint-plugin-import` | `eslint-plugin-import-x` | import stalled at eslint ^9 | D-17 |
| Rollup/esbuild in Vite | Rolldown + Oxc; `build.rollupOptions` → `rolldownOptions`; `esbuild` option → `oxc`; consistent CJS default-import interop; browser targets raised (Chrome 111, Safari 16.4, Firefox 114) | Vite 8.0.0 (2026-03-12) | diff build output; no `rollupOptions`/`esbuild` keys in `apps/frontend/vite.config.ts` `[VERIFIED]` |
| supabase npm CLI with `postinstall` + `tar` download | per-platform `optionalDependencies` | ≥ 2.100.0 | `tar` rows vanish; Docker/CI fetch platform packages |
| `setup-cli` installing from GitHub releases | `setup-cli` v3 installs from npm | v3.0.0 (2026-07-07) | — |
| `generateObject` | `generateText({ output: Output.object(...) })` (deprecated in AI SDK 6); v7: ESM-only, Node 22+, `system` → `instructions` | AI SDK 6 / 7 | `packages/llm` imports `generateObject`, `streamText`, `NoObjectGeneratedError`, `LanguageModelUsage`, `CallSettings`, `Prompt`, `StopCondition`, `ToolSet`, `Provider` |
| Faker 32-bit randomizer | 53-bit; same seed → different values (v9); v10 ESM-only; word-module strategy default `'fail'` | Faker 9 / 10 | seed-row diff (D-20); 4 `faker.word.*` call sites take no length options `[VERIFIED: git grep]`, so `'fail'` does not bite |
| Postgres 15 maintenance ops using the caller's `search_path` | PG17 uses a safe `search_path` for ANALYZE/CLUSTER/CREATE INDEX/REFRESH MATVIEW/REINDEX/VACUUM `[ASSUMED: training knowledge]` | PG17 | no expression indexes, no matviews, and only partial unique indexes on plain columns (`WHERE external_id IS NOT NULL`) `[VERIFIED: migration grep]` → no impact |

**Deprecated/outdated in this tree:**
- `@types/cheerio` (deprecated stub);
- `vite-plugin-restart` (peer stops at vite 7);
- `https://deno.land/x/jose` (moves to `npm:`);
- `node-engine-range-negative-control`'s `"20.x"` (Node 20 EOL; recommend `22.x`).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | FlatCompat cannot load eslint-plugin-svelte v3's `plugin:svelte/prettier` (flat-array configs) | Pattern 4 | Low: the replacement pattern is proven in the docs app anyway |
| A2 | `yarn up <pkg>` may rewrite a `catalog:` manifest value instead of the catalog entry | Anti-patterns | Medium: catalog drift; mitigated by editing `.yarnrc.yml` and checking the manifest diff |
| A3 | Render's `NODE_VERSION` / engines settings do not apply to `runtime: docker` services | Runtime State Inventory | Low–Medium: the operator confirms in the Render dashboard |
| A4 | Yarn 4.13's EBADF bug on Node 24.15+ does not affect `nodeLinker: node-modules` installs | Pitfall 3 | Low: D-25 already orders Yarn before Node |
| A5 | PG17's safe-`search_path` maintenance change is the main PG16/17 behaviour change relevant to this schema; no other removed GUC/function is used | State of the Art, Summary | Medium: the pgTAP run on 17 is the real gate |
| A6 | `npm:` specifiers work in edge-runtime v1.77.1 (Deno 2) for all three imports | Code Examples | Low: `npm:nodemailer` already works today; E2E proves it |
| A7 | `npmMinimalAgeGate` acts at resolution time and does not reject already-locked versions on `--immutable` installs | Pattern 1 | Medium: if wrong, a lockfile resolved before the gate could fail CI; mitigated by setting the gate before the refresh |
| A8 | The 4 import rules behave identically under import-x's default resolver | Code Examples | Low: the planted-violation proof in D-17 detects any difference |

## Open Questions

1. **`engines.node`: `">=24"` (locked literal) vs `">=24.15.0"`?**
   - What we know: D-11/R2 says `>=24` and asks research to confirm every dep's engines admits 24. jsdom 30 and isomorphic-dompurify 4 declare `^24.15.0`; this host runs 24.14.1. Vitest 5 (`^24.0.0`), faker 10, ESLint 10, lint-staged 17, changesets 3, ai 7 and supabase-js all admit any 24.x.
   - Recommendation: `">=24.15.0"` (or match the CI pin `>=24.21.0`). The planner should surface this as a one-line operator confirmation, since it refines a locked value. Either way, update `assertDeclaredBinariesGate.test.ts:65`.
2. **`openai` and `jsonrepair` have no importer.** D-21 says to migrate `openai` 4 → 7, but `git grep` finds no `from 'openai'` or `from 'jsonrepair'` anywhere (only `provider: 'openai'` strings). Recommendation: remove both, as in commit `ec30a1500` "remove dependencies nothing imports" and D-23's `@types/cheerio` removal, behind a one-line operator confirmation. Otherwise bump `openai` to 7.25.0 as written.
3. **Docs app `@vitest/browser-playwright` + `vitest` with zero docs tests.** `apps/docs/vite.config.ts` imports `playwright` from `@vitest/browser-playwright` and defines two projects, but `apps/docs` has no `*.test.*`/`*.spec.*` files and no `test:unit` script. D-19 keeps it at 5.x "if 167 kept it" (167 does not remove it). Recommendation: bump per D-19, and file a todo (or ask) to remove the dead docs test config and its two deps; that would also delete the critical `@vitest/browser` advisory surface for good.
4. **docs.yml Actions** (`configure-pages` v4→v6, `upload-pages-artifact` v3→v5, `deploy-pages` v4→v5) are not in D-10's enumerated list, but are "GitHub Actions majors". Recommendation: include them in group 9 as one commit, recorded as unobservable until a `main` docs deploy (Pitfall 12).
5. **Where do the ResearchQuote diff and extended link check live?** Phase 168 creates them (168-D7, D-12); their script names are not yet fixed. The final gate references them by whatever name 168 lands, with the docs production build as well.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | everything | ✓ (nvm) | v24.14.1 | `nvm install 24.21.0`; required ≥ 24.15 for jsdom 30 |
| Yarn | everything | ✓ | 4.13.0 (yarnPath) | `yarn set version 4.18.1` |
| Docker | Supabase, image build, visual container | ✓ | 29.7.2, linux/aarch64, 8 GB VM | — |
| Disk | image pulls, E2E artefacts | ✓ | 216 GiB free on `/`; Docker images 17.6 GB (6.6 GB reclaimable) | `docker builder prune -af` first (memory) |
| Supabase CLI | db, pgTAP, types | ✓ (devDep) | 2.83.0 | bumped in group 5 |
| psql | `db:lint:sql`, server-version check | ✓ | 17.6 (Homebrew) | — |
| Playwright browsers | E2E | ✓ | 1.58.2 | `yarn playwright install` after the bump |
| Deno | — (functions run in the edge-runtime container) | ✗ | — | not needed; edge runtime is a Docker image |
| gh CLI | ci-evidence observation | ✓ | 2.97.0 | — |
| Network to npm/GitHub/Docker Hub/ECR | installs, pulls | ✓ | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** Node ≥ 24.15 on the host (install via nvm in group 1, after Yarn).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 today → 5.0.x (group 4); Playwright 1.58.2 → 1.63.0; pgTAP via `supabase test db` (pg_prove 3.36 image) |
| Config files | `packages/*/vitest.config.ts`, `apps/{frontend,supabase}/vitest.config.ts`, `apps/docs/vite.config.ts`, root `vitest.workspace.ts` (→ `vitest.config.ts`), `tests/playwright.config.ts`, `apps/supabase/supabase/tests/database/*.test.sql` |
| Quick run command | `yarn test:unit` (runs `assert:unit-coverage`, then `turbo run test:unit`) |
| Full suite command | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/169-<group>` (spawns Supabase + one fresh dev server; exit 0 = success, other codes documented in its header) |

### Standard per-group gate set (D-26)
Every command runs with its status captured: `cmd > log 2>&1; s=$?; [ $s -eq 0 ] || exit $s`.

| Gate | Command | Failure signal |
|---|---|---|
| typecheck | `TURBO_FORCE=true yarn typecheck` | non-zero exit |
| lint (+ 17 chained guards) | `TURBO_FORCE=true yarn lint:check` | non-zero exit (never `--force`, which yarn appends past the `&&` chain) |
| format | `yarn format:check` | non-zero exit |
| svelte-check | `yarn workspace @openvaa/frontend check` and `yarn workspace @openvaa/docs check` | non-zero; frontend uses `--fail-on-warnings` |
| unit | `yarn test:unit` | non-zero; `assert:unit-coverage` failure names a workspace |
| builds | `TURBO_FORCE=true yarn build && yarn workspace @openvaa/frontend build && yarn workspace @openvaa/docs build` | non-zero |
| audit | `yarn audit:deps` | exit 1 = NEW advisory; exit 2 = could not run / malformed baseline |
| lockfile hygiene | `yarn dedupe --check` | exit 1 = duplicates |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | Failure signal | File Exists? |
|--------|----------|-----------|-------------------|----------------|-------------|
| DEPS-01 | age gate set and obeyed | config + probe | `yarn config get npmMinimalAgeGate` → `10080`; the version-table script reports 0 versions < 7d and 0 majors < 30d | value ≠ 10080, or any row flagged | ❌ Wave 0: version-table probe script (scratch or `scripts/`) |
| DEPS-02 | 9 NEW → 0 after refresh | gate | `yarn audit:deps` | exit ≠ 0; `[NEW]` count > 0 | ✅ |
| DEPS-03 | Node 24 binds; image builds and serves; TS 6 typechecks | guard + smoke + E2E | `node scripts/assert-node-engine.mjs && node scripts/assert-node-engine.mjs --self-test`; `docker build --file apps/frontend/Dockerfile --target production --tag openvaa-frontend:169 .`; `docker compose -f docker-compose.dev.yml up --build -d && curl -fsS localhost:3000/`; `yarn workspace @openvaa/dev-seed test:unit` (nodeEngineGate, assertDeclaredBinariesGate, ciDockerImageBuildGate); full E2E via `e2e-run.sh` | non-zero exits; curl non-2xx; E2E any failed/skipped/did-not-run | ✅ (tests need value edits) |
| DEPS-04 | 4 import rules fire before/after; flag gone | negative control | `npx eslint <planted-fixture>` per rule (before: old plugin, after: import-x); `git grep -c v10_config_lookup_from_file -- ':!.planning'` → 0 | a rule not reported on its fixture; grep count > 0 | ❌ Wave 0: 4 planted fixtures (scratch, never committed) |
| DEPS-05 | Vite 8 builds; `.env` restart; visual unchanged or traced | build + manual + visual | builds as above; build-output diff (`find apps/frontend/build -type f \| sort` + sizes before/after); manual `.env` touch; `PLAYWRIGHT_VISUAL=1 tests/scripts/visual-container.sh --run-dir tests/e2e-runs/169-visual` | build exit ≠ 0; no restart log line; visual exit 1 with an untraced diff | ✅ (manual step recorded) |
| DEPS-06 | Vitest 5 runs every package's tests; jsdom SSR works; Playwright 1.63 | unit + E2E | `yarn test:unit` (compare per-workspace counts with pre-bump); `yarn assert:unit-coverage`; `git status --porcelain` (no `.vitest/`); E2E full | count drop; guard failure; untracked artefacts | ✅ |
| DEPS-07 | CLI pins agree; types regenerate; auth cookies intact | unit + db | `yarn db:reset && yarn db:types && git diff --exit-code -- packages/supabase-types/src/database.ts` (before pgTAP); `yarn workspace @openvaa/supabase test:db`; `yarn db:lint:sql`; `yarn assert:cookie-names`; `yarn workspace @openvaa/frontend vitest run src/lib/supabase/safeGetSession.test.ts src/lib/supabase/server.test.ts`; `yarn workspace @openvaa/dev-seed test:unit` (rpcNullabilityGate); E2E | diff with unexplained hunks; pgTAP `not ok`; non-zero exits | ✅ |
| DEPS-08 | PG17 really running; schema and pgTAP pass | db | `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -Atc 'show server_version'` → starts `17.`; `yarn db:reset`; `yarn workspace @openvaa/supabase test:db`; `yarn db:types` diff; bank-auth 3× + full E2E | version ≠ 17.x; reset/pgTAP failure | ✅ |
| DEPS-09 | Edge Functions boot with new imports | unit + E2E | `yarn workspace @openvaa/supabase test:unit`; bank-auth 3× per `tests/IDURA-TEST-RUNBOOK.md` (`PLAYWRIGHT_BANK_AUTH=1`, projects `bank-auth` + `bank-auth-journey`); email/invite specs in the full suite | any failed/did-not-run | ✅ |
| DEPS-10 | seed drift recorded; templates still valid | unit + diff | `yarn workspace @openvaa/dev-seed test:unit` (determinism, template); seed-row diff old vs new for `default` and `e2e/base` (same seed); E2E | determinism failure; untraced visual diff | ❌ Wave 0: seed-diff capture script/procedure |
| DEPS-11 | LLM SDK migrated | unit + E2E | `yarn workspace @openvaa/llm test:unit`, `…/argument-condensation test:unit`, `…/question-info test:unit`, admin-job tests in frontend `test:unit`; E2E | non-zero | ✅ |
| DEPS-12 | tooling majors | per-group gates | standard gate set; `yarn format:check` after each formatter major | non-zero | ✅ |
| DEPS-13 | CI green at job level | CI evidence | push a source-only tree to `ci-evidence/169-*`; `gh run view <id> --json jobs` → every job except the known-red e2e pair is `success`; `yarn workspace @openvaa/dev-seed test:unit` (ciDockerImageBuildGate, ciSecretScanFlags, ciTypecheckGate, rpcNullabilityGate, nodeEngineGate) | job conclusion ≠ success | ✅ |
| DEPS-14 | Kit 3 or hold | checkpoint + gates | operator checkpoint; full gate set + E2E | — | ✅ |
| DEPS-15 | liveness re-keyed; negative control | unit + negative control | `yarn workspace @openvaa/dev-seed vitest run tests/auditBaselineShape.test.ts`; `YARN_NPM_AUDIT_REGISTRY=http://127.0.0.1:9 node scripts/assert-dependency-audit.mjs` → **must exit 2**, run against an empty-baseline scratch copy and the real one | exit ≠ 2 under the block; shape test passes on a stubbed did-not-run | ❌ Wave 0: classifier unit cases |
| DEPS-16 | everything at the end | full | standard gate set + pgTAP + `yarn workspace @openvaa/docs validate:links` (168's `--check` mode) + 168's ResearchQuote diff script + `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/169-final` after `yarn db:reset` on PG17 | any non-zero; any E2E failed/skipped/did-not-run | ✅ (168's scripts by then) |

### Sampling Rate
- **Per upgrade commit:** the narrowest relevant gate (e.g. typecheck after TS 6; `lint:check` after ESLint 10), with the exit status recorded.
- **Per group (plan) end:** the standard gate set, plus the group-specific extras above.
- **Phase gate:** the full suite under the cardinal rule plus all static gates on one HEAD before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] Version/age table probe (shell or `scripts/` one-off): `npm view` time/engines/peers for every direct dep. It is the D-33 artefact.
- [ ] D-17 planted-violation fixtures (scratch only), one per rule.
- [ ] D-28 classifier + its unit cases in `auditBaselineShape.test.ts`.
- [ ] D-20 seed-row diff procedure (`yarn db:reset-with-data` old vs new, export the rows, diff).
- [ ] Build-output diff procedure for Vite 8 (file list + sizes).

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | bank-auth OIDC via `jose` (Edge Function moves to jose 6). The gates are bank-auth E2E 3× and the frontend's `decryptAndVerifyIdToken` tests |
| V3 Session Management | yes | `@supabase/ssr` 0.12 cookie chunking and encoding; `assert:cookie-names`, `server.test.ts`, the `safeGetSession` round-trip test. Consider forwarding 0.10's `setAll` cache headers so auth responses are not CDN-cached `[CITED: supabase/ssr CHANGELOG 0.10.0]` |
| V4 Access Control | yes (indirect) | pgTAP RLS suite on PG17, incl. Phase 166's census |
| V5 Input Validation | yes | DOMPurify via `isomorphic-dompurify` 4 / jsdom 30 (SSR sanitising in `apps/frontend/src/lib/utils/sanitize.ts`); zod 4 unchanged |
| V6 Cryptography | yes | jose only, never hand-rolled. jose 6 removes RSA1_5 JWE; confirm the IdP's JWE `alg` is RSA-OAEP family. The code defaults to `header.alg \|\| 'RSA-OAEP'` `[VERIFIED: identity-callback/index.ts:66]` |
| V10 Malicious Code / V14 Dependencies | yes | age gate (D-04), high+ advisory gate (D-05), legitimacy audit, postinstall review (`unrs-resolver`, `esbuild`) |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Compromised fresh release (supply-chain) | Tampering | `npmMinimalAgeGate: 7d`; 30-day major rule; preapproval only for named security patches |
| Malicious or networked postinstall | Elevation | review new install scripts (`unrs-resolver`: napi binding check); none use `binding.gyp` |
| Silent audit gate (empty instrument) | Repudiation | D-28 exit-status liveness + negative control |
| SMTP header/command injection in `send-email` | Tampering | nodemailer ≥ 10.0.6 (advisories in CONTEXT D-09). v9 made remote-content fetches validate TLS by default `[CITED: nodemailer CHANGELOG]` |
| Sanitizer regression after a jsdom major | Tampering (XSS) | unit tests for `sanitize.ts` + E2E pages rendering sanitized HTML |
| Auth-response caching | Information disclosure | ssr ≥ 0.10 cache headers via `setAll`'s headers parameter |

## Sources

### Primary (HIGH confidence)
- **npm registry** (`npm view … dist-tags time engines peerDependencies dependencies optionalDependencies scripts`, 2026-10-01): every version, date, engine and peer in Standard Stack.
- **nodejs.org/dist/index.json** (Node 24.21.0, 2026-09-07, LTS Krypton) and `nodejs.org/dist/v24.21.0/docs/api/corepack.html`.
- **Docker Hub tags API** (`node:24-alpine`, `24.21.0-alpine`).
- **GitHub releases API:** actions/checkout, setup-node, upload-artifact, dorny/paths-filter, supabase/setup-cli, changesets/action, trufflehog, yarnpkg/berry (4.10–4.18 + PRs 7104/7135/7152), eslint-plugin-svelte 3.0.0, PostgREST v16.0, panva/jose v6.0.0.
- **supabase/cli source** at tags v2.83.0 (`pkg/config/templates/Dockerfile`, `constants.go`) and v2.119.0 (`apps/cli-go/pkg/config/templates/Dockerfile`, `config.go`).
- **Codebase reads this session:** `package.json`, `apps/*/package.json`, `packages/*/package.json`, `.yarnrc.yml`, `apps/frontend/Dockerfile`, `render.example.yaml`, `docker-compose.dev.yml`, `.github/workflows/*.y*ml`, `.github/trufflehog-exclude-paths.txt`, `scripts/assert-node-engine.mjs`, `scripts/assert-dependency-audit.mjs`, `packages/dev-seed/tests/{auditBaselineShape,nodeEngineGate,assertDeclaredBinariesGate,ciDockerImageBuildGate,rpcNullabilityGate}.test.ts`, `apps/supabase/supabase/config.toml`, `apps/supabase/supabase/migrations/00001_initial_schema.sql` (greps), the pgTAP tests (greps), `apps/supabase/supabase/functions/*/index.ts`, `packages/shared-config/{eslint.config.mjs,tsconfig.base.json}`, `apps/frontend/{vite,vitest}.config.ts`, `apps/frontend/eslint.config.mjs`, `apps/docs/{vite.config.ts,eslint.config.js}`, `vitest.workspace.ts`, `turbo.json`, `.lintstagedrc.json`, `tests/scripts/{e2e-run,visual-container,determinism-batch}.sh`, `packages/dev-seed/src/ctx.ts`, git commit `5555f42a6`.
- **Live probes:** `node scripts/assert-dependency-audit.mjs` (exit 1, 9 NEW / 66 ACCEPTED / 4 stale); raw `yarn npm audit` NDJSON (75 rows); the clean-audit and network-blocked probes; `yarn up --help`; `yarn config --json`; `yarn why node-gyp|tar`; the node_modules install-script scan.

### Secondary (MEDIUM confidence)
- [Vitest migration guide (v5)](https://vitest.dev/guide/migration.html), [Vitest v4 migration](https://v4.vitest.dev/guide/migration)
- [ESLint v10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0)
- [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)
- [Vite migration guide (v8)](https://vite.dev/guide/migration), [Vite JS API](https://vite.dev/guide/api-javascript)
- [Faker upgrading (v10)](https://fakerjs.dev/guide/upgrading), [Faker v9 upgrading](https://v9.fakerjs.dev/guide/upgrading)
- [AI SDK 6 migration](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0), [AI SDK 7 migration](https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0)
- [@supabase/ssr CHANGELOG](https://raw.githubusercontent.com/supabase/ssr/main/CHANGELOG.md), [nodemailer CHANGELOG](https://raw.githubusercontent.com/nodemailer/nodemailer/master/CHANGELOG.md)
- [Supabase forthcoming Postgres 17 release notes](https://supabase.com/changelog/35851-forthcoming-postgres-17-release-notes), [Supabase upgrading guide](https://supabase.com/docs/guides/platform/upgrading.md)

### Tertiary (LOW confidence)
- [SvelteKit 3 release candidate blog](https://svelte.dev/blog/sveltekit-3-release-candidate) and [migrating-to-sveltekit-3 (next docs)](https://next.svelte.dev/docs/kit/migrating-to-sveltekit-3), via search summary only (the stable docs URL returned 404).
- [Render Node version docs](https://render.com/docs/node-version) (silent on Docker runtime).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Registry-measured on the research date; re-derive at execution (D-33).
- Architecture / sequencing: HIGH. Derived from locked decisions plus measured site lists.
- Pitfalls: HIGH for the in-repo ones (site lists, guards, audit probes, CLI image pins); MEDIUM for upstream migration details (official guides fetched via summariser).
- PG17 schema impact: MEDIUM. The schema scan is solid, but the authoritative gate is pgTAP on 17.

**Research date:** 2026-10-01
**Valid until:** about 7 days for versions and ages (fast-moving: Kit 3 just released; Vitest 5, nodemailer 10, dotenv 18 and intl-messageformat 12 cross the 30-day line during October). About 30 days for migration patterns and in-repo site lists, provided Phases 166–168 do not move them; re-grep at execution.
