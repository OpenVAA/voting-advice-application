# Phase 153 — External API Coverage Declaration

**Written:** 2026-08-28 (planning)
**Detector:** external-API / SDK detector, run over the phase scope
**Verdict:** **Not applicable.**

## Declaration

> No external API integration: this phase edits build/tooling configuration (package manifests,
> `.lintstagedrc.json`, `.gitignore`, vitest config and CI YAML) and adds one repo guard script; no
> third-party service surface is touched.

## Reasoning

The detector's keyword surface fires on three incidental hits in the phase's file set. None is an
external API integration:

1. **`.github/workflows/main.yaml` references first-party GitHub Actions** (`actions/checkout@v4`,
   `actions/setup-node@v4`, `threeal/setup-yarn-action@v2`). These are CI build steps consumed by
   GitHub's own runner, not application calls to a third-party service. The phase changes only which
   *input* `actions/setup-node` reads (`node-version: 22.22.1` → `node-version-file: package.json`)
   and appends one job. No credential, no request, no response parsing enters the product.
2. **`packages/supabase-types/src/index.ts` is in scope**, and `supabase` is an external service.
   The edit is to four `export … from './database.js'` specifiers — dropping the `.js` extension per
   `packages/README.md:18`. The file is a **generated types barrel**: no network call, no client
   construction, no schema definition. `packages/supabase-types/package.json` declares
   `"build": "echo 'Raw .ts source — no build step needed'"` and points `exports`/`module`/`types`
   at `./src/index.ts` (153-RESEARCH.md § F.2).
3. **The `gh` CLI is used at execute time** to read a historical GitHub Actions run
   (`gh run view 32058994754`) as evidence for REVIEW-CFG-05, and possibly to observe a future run.
   That is an observation of this repository's own CI by an already-authenticated operator tool. It
   is not an integration shipped in any artefact this phase produces.

Every other file in scope — `package.json` ×10, `.yarnrc.yml`, `yarn.lock`, `.lintstagedrc.json`,
`.prettierignore`, `.gitignore`, `apps/frontend/vitest.config.ts`,
`packages/shared-config/README.md`, `packages/core/src/controller/controller.ts`,
`.claude/scripts/audit-skill-drift.sh`, two `SKILL.md` files, one new `scripts/*.mjs` guard and one
new dev-seed spec — has no service surface at all.

**No capability matrix is written**, because there is no external capability to enumerate.

## Schema gate

**No `[BLOCKING]` schema-push task is required, and this conclusion should not be re-opened.**

The schema-gate scan matched `packages/supabase-types/src/index.ts`. That file is a **generated
TypeScript types barrel**, not a schema definition. No file under `apps/supabase/migrations/*.sql`
or `apps/supabase/supabase/schema/**` is in this phase's scope, no ORM model file is edited, and no
migration is authored. (Phase 156 and Phase 163 own the SQL surfaces; see the ROADMAP entries for
both.)

## Assumption delta

**Not fired.** The assumption-delta detector was run over the phase scope. This phase introduces no
singular→plural identity change and no identity-model change of any kind — it renames two JSON keys
(`engine` → `engines`), two function parameters (`operationId` → `_operationId`,
`subOperations` → `_subOperations`) and four import specifiers.

```
<assumption_delta_decision>
verdict: no-change
rationale: The only renames are a JSON manifest key, two unused function parameters and four import
specifiers; no entity, cardinality or identity relationship is altered anywhere in the phase scope.
</assumption_delta_decision>
```

## Package legitimacy

**No package-manager install introduces a new package in this phase.**
`153-RESEARCH.md` § Package Legitimacy Audit records the two rows that were audited:

| Package | Verdict | Disposition |
|---|---|---|
| `tsup` | **OK** | Already a root devDependency at `^8.5.1`; already a single `"tsup@npm:^8.5.1"` entry in `yarn.lock`; already the binary all 8 builds invoke. Declaring it in 8 more manifests (as `catalog:`) introduces no new resolution. |
| `yarn-plugin-engines` (devoto13) | **SUS** | **REJECTED — must not be adopted.** 64★, MIT, last pushed 2024-04-07, no releases, **not published to npm** (`npm view` → E404). `.gitignore:29` is `!.yarn/plugins`, so it would be *committed into this repo and executed on every install by every developer and every CI runner*. Recorded as threat `T-153-04`. |

**Packages removed due to [SLOP]:** none.
**Packages flagged [SUS]:** `yarn-plugin-engines` — reported as a rejected option only; no plan
contains a task that adopts it. Because no plan installs it, no `checkpoint:human-verify` legitimacy
gate is engaged. If the operator ever reverses that rejection (see OQ-2 in `153-02-PLAN.md`), a
blocking human checkpoint becomes mandatory before the install.

`yarn install` **is** run by `153-01-PLAN.md` — to materialise the 8 already-locked `tsup`
descriptors. That is a lockfile-descriptor change against an existing resolution, not a new package
introduction, so the package-legitimacy gate is satisfied by the table above.
</content>
</invoke>
