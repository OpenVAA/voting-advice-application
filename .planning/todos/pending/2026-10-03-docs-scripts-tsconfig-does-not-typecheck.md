---
title: "`apps/docs/scripts/tsconfig.json` does not type-check and no gate runs it"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: low
suggested_phase: any docs-tooling slot
keywords: [docs, typescript, tsconfig, scripts, typecheck, deferred-item]
re_check_trigger: "any time; or before the next TypeScript major"
---

# Ungated docs-scripts tsconfig (169-02 deferred item)

`tsc -p apps/docs/scripts/tsconfig.json --noEmit` exits 2 under TypeScript 5.9.3 (`mdsvex/dist/main.d.ts`: cannot find
module `unified`) and under 6.0.3 (that error plus TS7016 for the untyped `../../mdsvex.config.js` import, because TS 6
turns `strict` on by default and this config sets none). The config does not extend `@openvaa/shared-config/ts`; the
docs `typecheck`/`check` scripts run `svelte-check --tsconfig ./tsconfig.json`, which does not include `scripts/`; the
scripts run through `tsx` (no type-check) and are green in every gate. Full detail:
`.planning/phases/169-dependency-bump-to-latest-safe-versions/deferred-items.md`.

**What to do (pick one):** bring `scripts/` under a gated type-check (extend the shared base, add `unified` types and a
declaration for `mdsvex.config.js`, add `tsc -p scripts/tsconfig.json --noEmit` to the docs `typecheck`), or delete the
config if nothing is meant to type-check the scripts.
