---
phase: 56
slug: generator-foundations-plumbing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-22
---

# Phase 56 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution of
> `@openvaa/dev-seed` generator + plumbing work. Sourced from
> 56-RESEARCH.md §"Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^3.2.4 (catalog) |
| **Config file** | `packages/dev-seed/vitest.config.ts` (empty marker) + root `vitest.workspace.ts` picks it up |
| **Quick run command** | `yarn workspace @openvaa/dev-seed test:unit` |
| **Full suite command** | `yarn test:unit` (Turborepo across all packages + apps) |
| **Typecheck command** | `yarn workspace @openvaa/dev-seed typecheck` (or `yarn build` for full graph) |
| **Lint command** | `yarn workspace @openvaa/dev-seed lint` |
| **Estimated runtime** | ~5–10 seconds (pure I/O, no DB) |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/dev-seed test:unit`
  (fast — no DB, no network, pure input/output per D-22)
- **After every plan wave:** Run `yarn test:unit` (full monorepo)
- **Before `/gsd-verify-work`:** Full suite + `yarn lint:check` +
  `yarn format:check` + typecheck must all be green
- **Max feedback latency:** 15 seconds (quick run) / 60 seconds (full suite)

---

## Per-Task Verification Map

Task IDs will be assigned by the planner. The requirement → command mapping
below is the authoritative contract — the planner MUST wire each task's
`<automated>` block to the matching command.

| Requirement | Behavior Validated | Test Type | Automated Command | File Exists? |
|-------------|--------------------|-----------|-------------------|--------------|
| GEN-01 | 16 generator modules return typed rows | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/generators/` | ❌ Wave 0 |
| GEN-02 | Rows match `TablesInsert<'X'>` from `@openvaa/supabase-types` | typecheck + unit | `yarn workspace @openvaa/dev-seed typecheck && yarn workspace @openvaa/dev-seed test:unit` | ❌ Wave 0 |
| GEN-03 | Override map fully replaces built-in per `(fragment, ctx) => Rows[]` (D-25) | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/pipeline.test.ts -t "override"` | ❌ Wave 0 |
| GEN-04 | Every row carries `external_id` with configurable prefix (default `seed_`) | unit (per generator) | `yarn workspace @openvaa/dev-seed test:unit -- -t "external_id prefix"` | ❌ Wave 0 |
| GEN-05 | Writes go through `SupabaseAdminClient` (D-24 split base) with service-role key | unit (mocked client) | `yarn workspace @openvaa/dev-seed test:unit -- tests/writer.test.ts` | ❌ Wave 0 |
| GEN-07 | Answer stub emits shape-valid per question type (Likert / categorical); subdimension logic stays in `@openvaa/matching` | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/generators/candidate.test.ts -t "answers shape"` | ❌ Wave 0 |
| GEN-08 | Nominations wire candidates × elections × constituencies with in-memory FK validation (no orphan refs reach the DB) | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/generators/nomination.test.ts` | ❌ Wave 0 |
| TMPL-01 | Single `Template` TS type covers counts + per-entity fixed/count + top-level `seed` / `externalIdPrefix` / `projectId` | typecheck | `yarn workspace @openvaa/dev-seed typecheck` | ❌ Wave 0 |
| TMPL-02 | `{}` template produces valid non-empty row-set for every entity | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/pipeline.test.ts -t "empty template"` | ❌ Wave 0 |
| TMPL-08 | `seed: 42` produces byte-identical output across two runs | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/determinism.test.ts` | ❌ Wave 0 |
| TMPL-09 | Zod validation errors include offending field path (`error.issues[].path`) | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/template.test.ts -t "error path"` | ❌ Wave 0 |
| NF-01 | Write path uses bulk RPCs (`bulk_import` + `importAnswers` + `linkJoinTables`), no row-at-a-time inserts | code review + unit (mocked client call count) | `yarn workspace @openvaa/dev-seed test:unit -- tests/writer.test.ts -t "bulk call shape"` | ❌ Wave 0 |
| NF-02 | Writer throws with descriptive message when `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` missing (D-15) | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/writer.test.ts -t "env enforcement"` | ❌ Wave 0 |
| NF-03 | No `any` in public surface | typecheck + lint | `yarn workspace @openvaa/dev-seed typecheck && yarn workspace @openvaa/dev-seed lint` | ❌ Wave 0 |
| NF-05 | `bulk_import`'s single-transaction rollback behavior documented in writer JSDoc (D-12) | grep-review | `grep -q "single transaction" packages/dev-seed/src/writer.ts` | ❌ Wave 0 |
| DX-02 | Each of the 16 generators has a unit test file | file-existence | `ls packages/dev-seed/tests/generators/*.test.ts \| wc -l` returns ≥ 16 | ❌ Wave 0 |

---

## Wave 0 Requirements

All test infrastructure is greenfield for `@openvaa/dev-seed`:

- [ ] `packages/dev-seed/package.json` — `test:unit`, `lint`, `typecheck`,
      `build` (no-op) scripts per D-28; deps on
      `@openvaa/supabase-types`, `@openvaa/core`, `@openvaa/data`,
      `@supabase/supabase-js` (catalog), `@faker-js/faker` (catalog),
      `zod` (catalog); devDeps on `vitest` (catalog),
      `@openvaa/shared-config`
- [ ] `packages/dev-seed/tsconfig.json` — extends shared-config TS base +
      project references to `@openvaa/supabase-types`, `@openvaa/core`,
      `@openvaa/data`
- [ ] `packages/dev-seed/vitest.config.ts` — empty marker (`export default
      {}`) so root `vitest.workspace.ts` discovers the package
- [ ] `packages/dev-seed/tests/` directory — 16 generator test files + 1
      writer test file + 1 pipeline test file + 1 determinism test file +
      1 template-validator test file
- [ ] `packages/dev-seed/src/` directory — generator classes, ctx factory,
      pipeline, writer, template schema + validator, default random-valid
      emitter
- [ ] Root `package.json` — `"@openvaa/dev-seed": "workspace:^"` added to
      `devDependencies` (note: `tests/` has no `package.json`, so the
      workspace link goes in the root per research §correction)
- [ ] `tests/tests/utils/supabaseAdminClient.ts` — rewrite as thin subclass
      of the dev-seed base per D-24 (auth + E2E utility helpers stay)
- [ ] `REQUIREMENTS.md` — one-line amendment on GEN-03 to extend the
      override signature to `(fragment, ctx) => Rows[]` per D-25

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `bulk_import` RPC observed to actually roll back on mid-collection failure | NF-05 | End-to-end RPC rollback requires live local Supabase; Phase 58's DX-03 covers the integration smoke | Document is JSDoc + link to migration §bulk_import single-txn semantics. Reviewer confirms by reading; no automated assertion in Phase 56. |
| `@openvaa/dev-seed` workspace dep actually resolves from the root package | Wave 0 infra | Requires `yarn install` run and a downstream `import` from the root or from `tests/` to truly prove resolution | Reviewer runs `yarn install` and spot-imports `import type { Template } from '@openvaa/dev-seed'` from a `tests/` file to confirm IDE + tsc both resolve. |

---

## Validation Sign-Off

- [ ] All 16 phase requirements have `<automated>` verify or Wave 0
      dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (package.json, tsconfig.json,
      vitest.config.ts, tests/ dir, src/ dir, root workspace dep,
      admin client split, GEN-03 amendment)
- [ ] No watch-mode flags in test commands (all use `test:unit`, not
      `test:unit:watch`)
- [ ] Feedback latency < 15s for quick run / < 60s for full suite
- [ ] `nyquist_compliant: true` set in frontmatter once the planner wires
      every task to a command from this map

**Approval:** pending
