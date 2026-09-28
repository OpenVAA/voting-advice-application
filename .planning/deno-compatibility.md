# Deno Compatibility Evaluation: Turborepo Impact

**Last reviewed:** 2026-03-12

## Summary

Turborepo has no native Deno support and this is unlikely to change in the near term. The impact on a future Deno migration is minimal because Turborepo would be replaced entirely by Deno's native task runner rather than adapted to work alongside it. The patterns established by Turborepo (dependency-aware builds, content-hashed caching, topological ordering) transfer directly to Deno's emerging workspace tooling.

## Current State

- Turborepo requires Node.js package managers and reads `package.json` files and lockfiles (`yarn.lock`, `package-lock.json`, `pnpm-lock.yaml`) to discover workspaces and dependencies.
- Deno 2.x can read `package.json` for Node.js compatibility, but this is not the native Deno workflow; the idiomatic approach uses `deno.json` with import maps and task definitions.
- Deno 2.1+ introduced its own workspace support and is building native monorepo task dependencies with caching, inspired by Google's Wireit project. This is still evolving but aims to provide Turborepo-like functionality natively.
- Turborepo maintainers have stated that Deno support is "not immediately on the roadmap" and there is no active work to add it (see GitHub Discussion #3057, Issue #6368).

## Impact on OpenVAA

- If and when OpenVAA migrates to Deno, Turborepo would be replaced entirely with Deno's native task runner and workspace tooling, not adapted to coexist with it.
- The `turbo.json` task definitions (dependency graph, outputs, inputs) map cleanly to `deno.json` task definitions. The concepts are the same; only the configuration format differs.
- Build caching concepts (content-hashed inputs, restored outputs) transfer directly. Deno's task caching uses the same fundamental approach of fingerprinting inputs to determine cache validity.
- The investment in establishing proper dependency graphs, topological build ordering, and explicit input/output declarations is not wasted work. These patterns are build-tool-agnostic and will transfer to any future orchestration tool.

## Recommendation

Turborepo is the right choice for OpenVAA today. It provides immediate, significant value (cached parallel builds, dependency-aware orchestration) with the existing Yarn 4 workspace setup. A future Deno migration would replace Turborepo entirely rather than trying to make them coexist, which is a clean and straightforward substitution. The patterns established now -- dependency-aware builds, content-hashed caching, topological ordering, explicit inputs/outputs -- will transfer to any future build tool, whether that is Deno's native task runner or something else entirely.

## References

- [Turborepo GitHub Discussion #3057](https://github.com/vercel/turbo/discussions/3057) -- Deno support request and maintainer response
- [Turborepo GitHub Issue #6368](https://github.com/vercel/turbo/issues/6368) -- Deno compatibility tracking
- [Turborepo GitHub Discussion #7454](https://github.com/vercel/turbo/discussions/7454) -- Community discussion on non-Node package manager support
- [Deno 2.1 Release Notes](https://deno.com/blog/v2.1) -- Workspace and task runner improvements
