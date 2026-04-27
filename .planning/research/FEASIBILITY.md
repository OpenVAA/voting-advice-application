# Feasibility Assessment: Full Node.js to Deno Replacement

**Verdict:** MAYBE -- feasible as runtime-only replacement; NOT feasible as full toolchain replacement
**Confidence:** MEDIUM-HIGH

## Summary

Deno 2.7.7 is a technically capable runtime that can execute the OpenVAA monorepo's SvelteKit application, run Vitest tests, and align with the existing Supabase Edge Functions. The Node.js compatibility layer is mature enough for most npm packages, and the official recommendation from both Deno and Svelte teams is to use adapter-node with Deno as runtime -- a low-risk approach.

However, a **full replacement** of Node.js + Yarn 4 + Turborepo with Deno's native toolchain is not feasible today. The blockers are:
1. Deno does not support Yarn 4 workspaces (only npm workspaces, with open bugs)
2. Deno's task runner lacks caching and topological ordering (both on roadmap, not shipped)
3. Deno's linter cannot parse Svelte templates (same blocker that prevented oxlint adoption)

The practical path is **runtime-only migration** (Strategy B): keep the entire build toolchain, swap only the execution runtime from Node to Deno. This captures ~70% of Deno's value proposition (native TS, security model, Edge Function alignment, faster startup) with ~10% of the migration risk.

## Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| SvelteKit runs on Deno | Available | adapter-node on Deno, officially recommended |
| npm packages resolve | Available | npm: specifiers, nodeModulesDir: "auto" |
| Workspace cross-imports | Partial | npm workspaces work; Yarn workspaces not supported; open bugs |
| Cached builds | Missing | Turborepo has no Deno equivalent; deno task lacks caching |
| Topological build ordering | Missing | deno task --recursive has no topology sort |
| Svelte template linting | Missing | deno lint cannot parse .svelte AST |
| Unit test execution | Available | Vitest runs on Deno runtime |
| E2E test execution | Available | Playwright via npx; version-sensitive for direct Deno execution |
| npm publishing | Available | tsup + tsc continue working; Changesets unverified |
| Docker deployment | Available | Deno Alpine images, adapter-node output |
| CI/CD | Available | denoland/setup-deno action |
| Edge Function alignment | Available | Already running Deno; workspace sharing possible |

## Blockers

| Blocker | Severity | Mitigation |
|---------|----------|------------|
| Yarn 4 not supported | HIGH | Keep Yarn; use Deno only as runtime (Strategy B) |
| No task caching in Deno | HIGH | Keep Turborepo; Deno roadmap item |
| No topological task ordering | HIGH | Keep Turborepo; Deno roadmap item |
| No Svelte template linting | MEDIUM | Keep ESLint + eslint-plugin-svelte |
| Paraglide FsWatcher issue | MEDIUM | Custom Vite plugin wrapper workaround |
| Playwright version sensitivity | MEDIUM | Pin Deno version; use npx for Playwright |
| npm workspace bugs (#28157) | MEDIUM | Keep Yarn as primary resolver |

## Recommendation

**Proceed with Strategy B PoC (runtime-only migration).** This has a clear validation path:

1. Run @openvaa/core unit tests with Vitest on Deno (~1 hour to validate)
2. Start SvelteKit dev server under Deno (~1 hour to validate)
3. Run 5-10 Playwright E2E specs (~1 hour to validate)
4. Measure startup and test execution time vs Node.js baseline (~30 min)

If PoC succeeds, the migration is a Dockerfile change + CI config change. No application code changes. Rollback cost is ~1 hour.

If PoC fails on any table-stakes item, the assessment is "not yet" with specific blockers documented for future re-evaluation.

**Do NOT attempt Strategy A (full toolchain replacement).** The blockers are real, the risk is high, and the marginal benefit over Strategy B does not justify it.

## Sources

- All sources listed in STACK.md, FEATURES.md, ARCHITECTURE.md, and PITFALLS.md
