# Research Summary: Deno 2.x Feasibility Study

**Domain:** Runtime migration (Node.js -> Deno) for monorepo
**Researched:** 2026-03-26
**Overall confidence:** MEDIUM-HIGH

## Executive Summary

Deno 2.7.7 has made remarkable progress in Node.js compatibility. The runtime can execute SvelteKit with adapter-node, runs TypeScript natively without a compilation step, starts ~50% faster than Node.js for JavaScript and ~5x faster for TypeScript, and shares the same runtime as the project's existing Supabase Edge Functions. The npm package compatibility story is strong for most packages, with `npm:` specifiers and `nodeModulesDir: "auto"` enabling transparent npm usage.

However, a **full replacement of the Node.js toolchain is not feasible today**. The two hard blockers are (1) Yarn 4 workspaces are not supported by Deno -- only npm workspaces have partial support, and even that has open bugs (#28157), and (2) Turborepo has no Deno equivalent -- Deno's task runner lacks task output caching and topological sorting, both explicitly on the roadmap but not yet shipped. These gaps mean the monorepo's build orchestration (sub-5-second cached builds, dependency-ordered compilation) would regress significantly.

The recommended approach is **Strategy B: Deno as runtime only**. Keep Yarn 4, Turborepo, tsup, ESLint, and Prettier. Use Deno as the execution runtime for the SvelteKit dev/production server and potentially for running unit tests. This captures Deno's DX benefits (native TypeScript, faster startup, security model, Edge Function alignment) without disrupting proven build infrastructure. A proof of concept should validate this by running @openvaa/core tests on Deno, starting the SvelteKit dev server under Deno, and running a subset of Playwright E2E tests.

The Supabase Edge Function alignment is a genuine synergy -- all 3 Edge Functions already run on Deno 2.1.4, and unifying the runtime could enable direct workspace imports between frontend code and Edge Functions, eliminating the current esm.sh CDN pattern.

## Key Findings

**Stack:** Deno 2.7.7 as runtime-only replacement for Node 22 is low-risk and provides native TS, faster startup, and Edge Function alignment. Full toolchain replacement is blocked by Yarn/Turborepo incompatibility.

**Architecture:** adapter-node on Deno is the officially recommended SvelteKit deployment pattern -- NOT community Deno adapters. Keep the existing build pipeline entirely.

**Critical pitfall:** Attempting to replace Turborepo with `deno task` loses content-based caching and topological build ordering -- these features are on Deno's roadmap but not shipped.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Validation Phase** -- Prove Deno runtime works with existing toolchain
   - Addresses: Runtime compatibility, SvelteKit adapter-node, Vitest on Deno, Playwright on Deno
   - Avoids: Premature toolchain migration (P3: Turborepo replacement)
   - Scope: @openvaa/core tests, SvelteKit dev server, 5-10 E2E specs

2. **Benchmarking Phase** -- Quantify actual benefits
   - Addresses: Startup time measurement, build time comparison, Docker image size
   - Avoids: Assuming blog benchmarks apply to this specific project
   - Scope: Side-by-side Node vs Deno measurements

3. **Decision Phase** -- Go/no-go recommendation
   - Addresses: Full findings synthesis, migration effort estimate, benefit-cost analysis
   - Avoids: Open-ended experimentation
   - Scope: Written recommendation document with clear criteria

4. **Optional: Edge Function Integration** -- If go decision
   - Addresses: Shared types between frontend and Edge Functions
   - Avoids: Over-engineering before validation
   - Scope: One shared type definition imported by both frontend and Edge Function

**Phase ordering rationale:**
- Validation before benchmarking because if the runtime does not work, benchmarks are moot
- Benchmarking before decision because "5x faster TS startup" from blogs may not apply to SvelteKit dev server
- Edge Function integration is optional bonus, not gating

**Research flags for phases:**
- Phase 1: Needs hands-on testing (Paraglide FsWatcher issue, Playwright version sensitivity)
- Phase 2: Standard benchmarking, unlikely to need research
- Phase 3: Synthesis of phases 1-2, no new research needed
- Phase 4: May need research on Supabase CLI limitations with workspace imports

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack compatibility | HIGH | Verified via official Deno docs, SvelteKit tutorial, multiple blog confirmations |
| Hard blockers (Yarn, Turborepo) | HIGH | Verified via GitHub issues, Turborepo maintainer statements, Deno task docs |
| SvelteKit on Deno | HIGH | Official tutorial exists, adapter-node recommended by both teams |
| Playwright on Deno | MEDIUM | Works but version-sensitive; specific version regressions documented |
| Vitest on Deno | MEDIUM | Runs but edge cases in workspace integration; needs hands-on validation |
| Paraglide on Deno | LOW | Single community report of FsWatcher issue; workaround unverified |
| Performance claims | MEDIUM | Multiple independent sources agree on direction; specific numbers vary |
| Edge Function synergy | HIGH | Already running Deno; Supabase docs confirm import patterns |

## Gaps to Address

- Paraglide JS FsWatcher issue needs hands-on validation (only one community report)
- Exact Playwright Deno version compatibility matrix not fully documented
- Changesets CLI on Deno entirely untested -- may just work via npx or may have subtle issues
- Whether `deno compile` SvelteKit bug (#26155) is fixed in 2.7.x is unverified
- Long-term Deno roadmap delivery reliability for caching and topology sorting is uncertain
