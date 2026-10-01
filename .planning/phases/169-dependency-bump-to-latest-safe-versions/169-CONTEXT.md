# Phase 169: Dependency Bump to Latest Safe Versions - Context

**Gathered:** 2026-10-01
**Status:** Ready for planning

**Source of decisions:** `.planning/v2.15-166-169-DISCUSSION-POINTS.md` § *Phase 169* — a shared
checkbox document covering Phases 166–169 that the operator filled in one pass (recorded in commit
`e65bed5cf`, "docs(166-169): record the filled discussion decisions"). Its rule: an unticked
decision accepts the `★ RECOMMENDED` option; a ticked box overrules the ★; `**EDIT:**`/`**NOTE:**`
free text beats every box. In Phase 169's 33 decisions the operator ticked **two boxes, both
overrules of the ★**, and wrote **no EDIT or NOTE text**:

1. **169-C4 → (b): move to Node 24 (Active LTS) everywhere** — CI, the Dockerfile, `engines` and
   `@types/node` 24 — instead of the ★ "stay on Node 22". See D-11.
2. **169-C7 → (b): Postgres 15 → 17 in scope** — instead of the ★ "out of scope; record it". See D-14.

Every other decision takes its ★ option as written, except where the ★ text assumed Node 22 or an
out-of-scope Postgres. Those places are rewritten **and flagged inline as "reconciled with the D-11
overrule" / "reconciled with the D-14 overrule"** so the planner can see what changed and why. The
full list of reconciliations is under *Reconciliations* at the end of `<decisions>`.

<domain>
## Phase Boundary

Every dependency in every workspace (root, `apps/*`, `packages/*`, plus the Deno imports of the
Supabase Edge Functions) moves to its latest **safe** version, new majors included, with the code
migrated to each breaking change, grouped so a red gate points at one upgrade, and with every gate
green at the end: typecheck, lint, svelte-check, unit, pgTAP, production builds (frontend and docs),
`yarn audit:deps`, then the full E2E suite under the cardinal rule. Fixed by `.planning/ROADMAP.md`
§ *Phase 169* (criteria 1–4, "draft, to be firmed at planning").

Because of the two overrules, the phase also changes two pieces of runtime infrastructure that are
not npm dependencies: **the Node runtime (22 → 24, including the deployed Render container)** and
**the local Supabase Postgres major (15 → 17)**.

**Correction to the roadmap's premise (D-02):** the roadmap says the sweep saw 7 new high+
advisories in `vitest`, `@vitest/browser`, `@sveltejs/kit`, `tar`, `shell-quote`, `brace-expansion`,
… — that is wrong. The 7 NEW findings were `brace-expansion` ×6 and `undici` ×1; the others are
already-ACCEPTED baseline rows. Today the gate shows 9 NEW (adds `devalue` ×2). The roadmap entry is
amended at planning.

**Not in this phase:** TypeScript 7, forced peer overrides, Dependabot/Renovate config changes,
upgrading the **hosted/production** Postgres (an operator/hosting action — see D-14), Node 26.
Holds are recorded with reasons, not silently skipped.

</domain>

<decisions>
## Implementation Decisions

Decision IDs map one-to-one onto the discussion document's Phase 169 IDs, given in parentheses.
33 decisions → D-01..D-33. Every decision below is locked; the planner does not re-open them. Only
the chosen option is stated; the non-chosen options are dead.

### A — Factual baseline

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

### B — What "safe" means

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

### C — Scope

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

### D — Majors: migrate or hold

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

### E — Grouping and gates

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

### F — The audit gate and its baseline

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

### G — Automation

- **D-31 (169-G1):** **Do not touch `.github/dependabot.yml` in this phase.** File a todo to widen it
  after v2.15 merges (`directories` covering root, `apps/*` and `packages/*`, grouped updates);
  before the merge it resolves against the pre-v2 `main`.

### H — Plan shape

- **D-32 (169-H1):** **One plan per E1 group (~12), run strictly in sequence** (they share
  `yarn.lock`). The Kit 3 plan (group 10) is **non-autonomous**, with an operator checkpoint before it
  lands. (The Node 24 and Postgres 17 commits sit inside the group 1 and group 5 plans respectively;
  no extra checkpoint was chosen for them, but the planner records the production-runtime and
  hosted-Postgres follow-ups as operator-facing items in those plans' summaries — reconciled with the
  D-11 and D-14 overrules.)
- **D-33 (169-H2):** **Registry data goes stale:** re-run the version scan and `audit:deps` at plan
  time and again at execution start. CONTEXT/plan artefacts carry the refreshed table; D-03's age
  rule is evaluated on the execution date.

### Reconciliations with the two overrules

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

</decisions>

<factual_baseline>
## Factual baseline (169-A, accepted under D-01; snapshot 2026-10-01 at HEAD `89a4bd9ff`)

1. **The roadmap names the wrong advisories.** The 7 NEW high+ findings the sweep saw were
   `brace-expansion` ×6 (1240104/05/07/08/09/11) and `undici` ×1 (1240042). `vitest`,
   `@vitest/browser`, `@sveltejs/kit`, `tar`, `shell-quote`, `@faker-js/faker` are ACCEPTED rows
   already in the baseline. (`gate-evidence/t3-audit-deps.log`)
2. **Today the gate fails with 9 NEW, not 7.** The extra 2 are `devalue` GHSA-j22f-vq7h-c4qm and
   GHSA-mcm9-63f2-9j32. Same run: 66 accepted, 4 stale baseline ids (`js-yaml` 1123911/12,
   1138114/15). (`node scripts/assert-dependency-audit.mjs` → exit 1)
3. **Every one of the 75 high+ findings has a fixed version published.** Most are fixed in-range or
   within the same major; only `@faker-js/faker` needs a major (fixed `>10.4.0`; tree has 8.4.1).
4. 84 distinct registry deps declared directly across 16 manifests: **13 current, 36 behind by
   minor/patch, 35 behind by a major** (a `0.x` minor counts as a major).
5. **Brand-new majors published 2026-10-01:** `@sveltejs/kit` 3.0.0, `adapter-node` 6.0.0,
   `adapter-static` 4.0.0. Kit 3 requires `vite ^8.0.12`, `vite-plugin-svelte ^7`, `svelte ^5.57.1`,
   `typescript ^6`, `node >=22.17`.
6. **Kit 2.70.3 (latest 2.x) already accepts `vite ^8`, `vite-plugin-svelte ^7`, TS `^6`**, fixes the
   `BODY_SIZE_LIMIT` advisory (`<=2.57.0`) and allows `devalue ^5.8.1` → 5.9.4 (fixes all 3 devalue rows).
7. **TypeScript 7.0.2 cannot be installed:** `typescript-eslint` 8.71.0 needs `>=4.8.4 <6.1.0`,
   `svelte-check` 4.7.6 needs `^5 || ^6`, Kit 3 needs `^6`. Newest TS every peer accepts: 6.0.3
   (`6.0.0` never published).
8. **ESLint 10 is blocked by `eslint-plugin-import` 2.32.0** (peer up to `^9`; latest). Shared-config
   uses only 4 of its rules. `eslint-plugin-import-x` 4.17.1 accepts `eslint ^10`.
9. **Frontend Vite 8 is blocked by `vite-plugin-restart` 2.0.0** (peer up to `^7`; latest), used only
   to restart the dev server when `../../.env` changes.
10. **The two apps are on different majors:** frontend `vite ^6.4.1`, `vite-plugin-svelte ^5.1.1`,
    catalog `vitest ^3.2.4`, catalog `eslint-plugin-svelte ^2.46.1`; docs `vite ^7.2.6`,
    `vite-plugin-svelte ^6.2.1`, `vitest ^4.0.15`, `eslint-plugin-svelte ^3.13.1`.
11. **Edge Functions import Deno packages `yarn audit:deps` cannot see:** `npm:nodemailer@6.9.10`
    (high GHSA-p6gq-j5cr-w38f, GHSA-2x7j-588g-ccc2, GHSA-v53p-9fqp-m79j; first full fix 10.0.6),
    `https://deno.land/x/jose@v5.9.6` (npm side: jose 6.2.x), floating
    `https://esm.sh/@supabase/supabase-js@2`.
12. **The baseline can never be empty under current guards:** `auditBaselineShape.test.ts` asserts
    `accepted.length > 0`; the gate's empty-instrument check only fires when the baseline is
    non-empty, so an empty baseline + empty audit would pass silently.
13. **Yarn 4.13 supports `npmMinimalAgeGate`, unset (`0`).** Latest Yarn 4.18.1. Yarn pinned in 4
    places: `packageManager`, `engines.yarn: "4.13"`, `yarnPath`, CI `version: 4.13` (×9).
14. **Node pins: 22.22.1 in CI (×10), `node:22-alpine` in the Dockerfile, `engines >=22`.** Latest:
    22.23.3 (Maintenance LTS), 24.21.0 (Active LTS), 26.10.0 (not LTS). Vitest 5 needs `^22.12`,
    Kit 3 `>=22.17`. *(Starting state; target is Node 24 per D-11.)*
15. **Supabase CLI pinned to 2.83.0 in 6 `setup-cli` steps and as the devDep.** Latest 2.119.0 drops
    the `tar` dependency behind the critical tar row. `main.yaml` says a CLI bump can change the type
    generator's output.
16. **LocalStack no longer appears in code**; only 3 `apps/docs` pages mention it (Phase 168), so the
    "don't bump the LocalStack image" pin rule no longer applies here.
17. **Dependabot watches only `/apps/frontend` (npm) and `/` (actions), targets `main`,
    `open-pull-requests-limit: 0`.** No Renovate config.
18. **GitHub Actions several majors behind:** `checkout`/`setup-node`/`upload-artifact` v4 → v7,
    `paths-filter` v3 → v4, `supabase/setup-cli` v1 → v3, `changesets/action` v1 → v2, trufflehog
    3.97.2 → 3.97.9.
19. **Root `vitest.workspace.ts` still exists** (deprecated in Vitest 3.2 for `test.projects`, dropped
    in a later major — confirm at research).
20. **Phase 167 removes 3 of the 35 majors** (`@testing-library/jest-dom`, `@eslint/compat`,
    `vitest-browser-svelte`), a fourth if `@vitest/coverage-v8` goes, plus several minors and the
    docs/frontend ESLint duplicates — about 32 majors left for this phase.

Additional starting-state observation behind D-14 (from 169-C7's heading): local Supabase
`apps/supabase/supabase/config.toml` `[db] major_version = 15`.

### Majors behind (appendix, 2026-10-01; † = removed by Phase 167, ‡ = 167 decides)

| Package | Current | Latest | Workspaces | Migration | Decision → outcome |
|---|---|---|---|---|---|
| `@sveltejs/kit` | 2.55.0 | 3.0.0 (released 2026-10-01) | frontend, docs | L | D-15: 2.70.x now; 3.x in group 10 if ≥ 30 days old, else held |
| `@sveltejs/adapter-node` / `-static` | 5.5.4 / 3.0.10 | 6.0.0 / 4.0.0 (released 2026-10-01) | frontend / docs | M | D-15: latest 5.x/3.x now; 6/4 with Kit 3 |
| `vite` | 6.4.1 / 7.3.x | 8.3.2 | frontend / docs | M (Rolldown) | D-18: migrate both |
| `@sveltejs/vite-plugin-svelte` | 5.1.1 / 6.2.1 | 7.3.1 | frontend / docs | S–M | D-18: migrate both |
| `vitest` | 3.2.4 / 4.0.15 | 5.0.3 | all 13 test workspaces | M (workspace → projects) | D-19: one 5.x via catalog |
| `@vitest/browser-playwright` ‡, `@vitest/coverage-v8` ‡ | 4.0.15 / 3.2.4 | 5.0.3 | docs / frontend | S | D-19: 5.x if 167 kept them |
| `typescript` | 5.9.3 | 7.0.2 (6.0.3 newest every peer accepts) | 14 workspaces | M | D-16: 6.0.3, hold 7 |
| `eslint`, `@eslint/js` | 9.39.2 | 10.11.0 / 10.0.1 | 6 workspaces | M (import-x swap) | D-17: migrate |
| `eslint-plugin-simple-import-sort` | 12.1.1 | 14.0.0 | root, docs, shared-config | S (re-sort) | D-23 |
| `@faker-js/faker` | 8.4.1 | 10.6.0 | root, dev-seed | M (seed drift) | D-20: own group |
| `@supabase/ssr` | 0.9.0 | 0.12.7 | frontend | M (auth cookies) | D-22 |
| `ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `openai` | 5 / 2 / 2 / 4 | 7 / 4 / 4 / 7 | llm | L | D-21: own group |
| `jsdom`, `isomorphic-dompurify` | 26.1.0 / 3.3.0 | 30.1.1 / 4.4.0 | frontend | S (+ resolution) | D-08, D-23 |
| `intl-messageformat` | 11.1.3 | 12.1.2 | frontend | S–M | D-23 |
| `prettier-plugin-svelte`, `prettier-plugin-tailwindcss` | 3.5.1 / 0.7.2 | 4.1.1 / 0.8.1 | frontend, docs | S (reformat) | D-23 |
| `concurrently`, `lint-staged`, `glob` | 9.2.1 / 16.4.0 / 11.1.0 | 10.0.5 / 17.6.0 / 13.0.6 | root | S | D-23 |
| `@changesets/cli`, `@changesets/changelog-github` | 2.30.0 / 0.6.0 | 3.0.3 / 1.0.1 | root | S | D-23 |
| `dotenv`, `js-yaml` | 17.3.1 / 4.x | 18.0.5 / 5.4.2 | root, arg-cond. (†partly) | S | D-23 |
| `globals` | 15.14 / 16.5 | 17.13.0 | frontend, docs | S | D-13, D-23 |
| `@types/node` | 22.19.15 | 26.6.3 | 5 workspaces | — | **D-11 → latest 24.x** (reconciled; was "stays on 22.x") |
| `@types/cheerio` | 0.22.35 | 1.0.0 (deprecated stub) | root | remove | D-23: remove |
| `@testing-library/jest-dom` †, `@eslint/compat` †, `vitest-browser-svelte` † | — | — | frontend / docs | — | Phase 167 |
| Deno: `nodemailer`, `jose` | 6.9.10 / 5.9.6 | 10.0.13 / 6.2.12 | Edge Functions | M / S | D-09 |
| Actions: `checkout`/`setup-node`/`upload-artifact`, `setup-cli`, `paths-filter`, `changesets/action` | v4 / v1 / v3 / v1 | v7 / v3 / v4 / v2 | CI | S each | D-10 |
| *Runtime (not a package):* Node | 22.22.1 / `node:22-alpine` | 24.21.0 (Active LTS) | CI, Dockerfile, engines | M (deploy runtime) | **D-11 overrule** |
| *Infra (not a package):* local Postgres | 15 | 17 | `config.toml` | M (migration + pgTAP risk) | **D-14 overrule** |

S = config or version line only · M = code/config migration plus a targeted E2E run · L = framework
or SDK migration across many files. The last two rows are added here to make the overrules visible
in the table; they were not in the appendix.

</factual_baseline>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The phase's own contract
- `.planning/v2.15-166-169-DISCUSSION-POINTS.md` § *Phase 169* (and § *Cross-phase picture*) — the
  filled decision document; the source of every D-entry.
- `.planning/ROADMAP.md` § *Phase 169* — goal and draft criteria (premise amended per D-02).
- `.planning/quick/261001-n8y-*/261001-n8y-{VESTIGES,SUMMARY}.md` and its
  `gate-evidence/t3-audit-deps{,-base}.log` — the sweep that motivated the phase.

### Audit gate
- `scripts/assert-dependency-audit.mjs` — the gate; empty-instrument check (D-28).
- `security/audit-baseline.json` — the baseline and its top-level `note` (D-29).
- `packages/dev-seed/tests/auditBaselineShape.test.ts` — `accepted.length > 0` and
  `FORBIDDEN_YARNRC_KEYS` (D-04, D-28).
- `.planning/todos/pending/2026-09-03-dependabot-alert-list-is-stale-against-main.md` (D-30).

### Manifests, toolchain and infra
- Root `package.json` (`packageManager`, `engines`, `resolutions` incl. `isomorphic-dompurify/jsdom`),
  every `apps/*/package.json` and `packages/*/package.json`; `.yarnrc.yml` (catalog, `yarnPath`,
  future `npmMinimalAgeGate`).
- `.github/workflows/*.y*ml` (`node-version`, Yarn `version`, `supabase/setup-cli` pins, trufflehog,
  Actions majors; the CLI-bump/type-generator warning in `main.yaml`); `.github/dependabot.yml`.
- `apps/frontend/Dockerfile` — `FROM node:22-alpine` (D-11; the Render deploy image).
- `apps/supabase/supabase/config.toml` — `[db] major_version` and its "must match remote" comment (D-14).
- `apps/supabase/supabase/functions/{send-email,identity-callback,invite-candidate}/index.ts` (D-09).
- `packages/shared-config/eslint.config.mjs` (D-17), `packages/shared-config/tsconfig.base.json` (D-16),
  `apps/frontend/vite.config.ts` (D-18), root `vitest.workspace.ts` (D-19).
- `packages/llm` and `apps/frontend/src/lib/server/admin/features/{condenseArguments,generateQuestionInfo}.ts` (D-21).
- `packages/dev-seed` `ctx.ts` (the "v10 API surface" comment) and the default / `e2e/base` templates (D-20).

### Standing project rules that bind this phase
- `CLAUDE.md` and `.agents/code-review-checklist.md`.
- E2E: one fresh dev server on :5173 + clean `db:reset` before the full-suite gate; "did not run"
  counts as failure; bank-auth determinism 3×.
- `ci-evidence/**` channel — the only way to observe CI on an integration branch (D-10, D-12, D-11's
  CI pins).
- Never read a gate's status through a pipe; content anchors, never line numbers.

</canonical_refs>

<code_context>
## Existing Code Insights

Figures are the discussion document's 2026-10-01 snapshot (HEAD `89a4bd9ff`), spot-checked on this
worktree while writing this file (`node-version: 22.22.1` in `main.yaml`/`docs.yml`,
`FROM node:22-alpine AS base`, `"node": ">=22"` in root and frontend `package.json`,
`major_version = 15`). Per D-33 the planner re-derives every population at run time.

### Reusable Assets
- `scripts/assert-dependency-audit.mjs` with `--update-baseline` — the reviewed path for D-29.
- `yarn assert:unit-coverage` and the `test:unit`-invariant guard (Phase 141) — prove D-19 lost no tests.
- `yarn assert:cookie-names` — D-22's auth-cookie gate.
- The Phase 146 visual gate — D-18, D-20, D-24 re-baselines must trace to a named upgrade.
- pgTAP suite incl. Phase 166's anon-exposure census — D-10 and D-14 gates.

### Established Patterns
- **Catalog-first versions** in `.yarnrc.yml`; D-13 extends it to the docs app.
- **Negative controls are recorded** (command, exit code, counts) — D-17's planted violations and
  D-28's network-blocked failure follow this.
- **One commit per upgrade, lockfile confined to its subtree** (D-27).

### Integration Points
- **Render** deploys the frontend from `apps/frontend/Dockerfile`; D-11 changes its base image.
  Research checks for any Render-side Node setting outside the repo.
- **Hosted Supabase Postgres** remains 15 after this phase (D-14); local 17. Any migration added
  after this phase must stay PG15-valid until hosted migrates.
- `database.ts` (Supabase generated types) is regenerated by D-10 and again under D-14.

</code_context>

<specifics>
## Specific Ideas

- The operator's two overrules are the only free choices recorded; no EDIT/NOTE text was written.
  The doc's own risk statements accompanying them, verbatim:
  - Node 24: "This changes the deployment runtime too (Render) in the same phase, and a failure would
    then be ambiguous between the runtime and a library."
  - Postgres 17: "the local stack would differ from hosted until production also migrates, and it
    adds pgTAP and migration risk to a dependency phase."
- Group 0 alone is expected to turn `audit:deps` green; every later group starts from green.

</specifics>

<cross_phase>
## Cross-phase Notes

- **Execution is serial: 166 → 167 → 168 → 169; 169 runs last.** Planning may run in parallel, but
  each plan names its upstream phase as a precondition.
- **166 → 169:** 169 regenerates `database.ts` against the **post-166 schema** (and, per D-14, on
  PG17), and its pgTAP gate **re-runs 166's anon-exposure census**. 166 edits `identity-callback` and
  `invite-candidate` — the same files D-09 bumps imports in — so D-09 rebases onto 166's final shape.
- **167 → 169:** 167 removes 3–4 majors and part of the catalog's consumers (fact 20); re-run the scan
  after it lands (D-33). **167-F2 `audit:deps` interplay:** 167's own `audit:deps` gate meets the 9
  NEW findings; 167-F2 decides whether 167 carries a reviewed baseline update or waits for this
  phase's group 0. Whatever 167 does, group 0 here starts from the baseline 167 leaves, and D-29/D-28
  reconcile it (including the empty-baseline case). D-22 relies on the `safeGetSession` round-trip
  test 167 adds; D-19 relies on whether 167 kept `@vitest/browser-playwright`/`@vitest/coverage-v8`.
- **168 → 169:** 169's gate **re-runs 168's link check and the ResearchQuote byte-identity diff**
  (docs app moves Kit/Vite/Vitest here, after the rewrite). 168 rewrites the LocalStack pages (fact
  16) and documents the env model; if D-18's inline restart plugin changes how `.env` reloading
  works, or D-11 changes a documented Node version, or D-14 changes the documented local Postgres
  version, 169 updates those docs pages.
- **CI-only changes** (D-10 Actions majors and setup-cli pins, D-12 Yarn CI pin, D-11 Node CI pins)
  are observable only through `ci-evidence/**`.
- **Visual gate (Phase 146):** recorded re-baselines may come from D-18, D-20, D-24 — and possibly
  D-11 (Node 24 should not change rendering; any diff after the Node commit is a finding, not a
  re-baseline).

</cross_phase>

<deferred>
## Deferred Ideas

- **TypeScript 7** — held (D-16); todo with blocking peers and re-check trigger.
- **Kit 3 / adapter-node 6 / adapter-static 4** — held if they fail D-03's 30-day rule at execution
  start (D-15); todo with re-check date.
- **Upgrading hosted/production Postgres to 17** — operator/hosting action outside this phase (D-14);
  todo. Until done, local ≠ hosted.
- **Widening Dependabot (or adopting Renovate)** — after v2.15 merges (D-31); todo.
- **`audit:deps` cannot see Deno imports** — todo (D-09); also added to the 2026-09-03 todo (D-30).
- **Dependabot-alert reconciliation against `main`** — stays pending until v2.15 merges (D-30).
- **Node 26** — not LTS as of 2026-10-01; not considered.

</deferred>

---

*Phase: 169-Dependency Bump to Latest Safe Versions*
*Context gathered: 2026-10-01*
