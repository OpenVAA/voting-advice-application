# Phase 8: Build Orchestration - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate Turborepo for fast, cached, dependency-aware builds across all workspace packages. Fix the app-shared ESM build typo (FIX-01). Evaluate Turborepo's impact on future Deno compatibility. This phase does NOT cover lint/typecheck pipelines (Phase 12), tsup migration (Phase 11), or directory restructuring (Phase 9).

</domain>

<decisions>
## Implementation Decisions

### Developer command interface
- `yarn build` becomes the primary command, mapped to `turbo run build`
- Remove old `build:shared` and `build:app-shared` scripts entirely (clean break, no aliases)
- `yarn dev` uses Turborepo for the initial package build step (replaces `yarn build:shared` in the dev script)
- All root scripts that currently reference `build:shared` or `build:app-shared` (format, format:check, lint:fix, lint:check, docs:prepare) get updated to turbo equivalents
- Update CLAUDE.md and docs to reflect new commands

### Turborepo task scope
- turbo.json defines two task pipelines: `build` and `test:unit`
- `build` has `dependsOn: ["^build"]` for topological ordering and `outputs: ["build/**"]` for caching
- `test:unit` has `dependsOn: ["build"]` so packages are built before tests run
- Root `yarn test:unit` script replaced with `turbo run test:unit`
- `watch:shared` replaced with `turbo watch build --filter='./packages/*'` (dependency-aware file watching)
- Lint and typecheck pipelines deferred to Phase 12

### Deno evaluation
- Quick feasibility note (~1 page), focused specifically on Turborepo's Deno compatibility
- Does NOT cover the tsc-esm-fix → tsup build chain (that's Phase 11's concern)
- Document lives at `.planning/deno-compatibility.md`

### Claude's Discretion
- Exact turbo.json configuration details (inputs, env passthrough, etc.)
- How to handle app-shared's dual ESM/CJS output in turbo cache config
- How to handle packages with asset copying (argument-condensation, question-info prompts)
- Whether incomplete TypeScript project references need fixing alongside Turborepo setup
- How turbo watch integrates with the Docker frontend container restart

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard Turborepo conventions.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- TypeScript incremental compilation (`.tsbuildinfo` files) already exists — Turborepo caching layers on top
- Yarn 4.6 workspace protocol (`workspace:^`) handles package linking — Turborepo respects this

### Established Patterns
- All packages use `tsc --build` + `tsc-esm-fix` for ESM output (except app-shared which has dual ESM/CJS)
- Two packages (argument-condensation, question-info) copy prompt assets as part of build
- Build dependency flow: core → data/matching → filters → app-shared → llm/frontend/strapi

### Integration Points
- Root `package.json` scripts: build, dev, test:unit, watch:shared, format, lint, docs
- Docker Compose dev stack (`docker-compose.dev.yml`): needs packages built before containers start
- CI pipeline (GitHub Actions): uses root build commands
- `onchange` watcher: will be replaced by `turbo watch`

### Known Issues
- FIX-01: `packages/app-shared/package.json` line 7 — `packagec.json` typo (creates wrong filename in ESM build output)
- Several packages have incomplete TypeScript project references (e.g., llm missing app-shared reference)

</code_context>

<deferred>
## Deferred Ideas

- Native frontend dev without Docker (run SvelteKit directly on host during development, keep Docker for production deployment) — evaluate during Phase 12 or add as new phase

</deferred>

---

*Phase: 08-build-orchestration*
*Context gathered: 2026-03-12*
