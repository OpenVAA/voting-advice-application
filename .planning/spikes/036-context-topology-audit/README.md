---
spike: 036
idea: drawer-context-scoping
name: context-topology-audit
type: standard
validates: "Given the frontend's 10 Svelte contexts (i18n, component, data, app, layout, auth at root; voter+filter, candidate, admin per subtree), when each is weighed on lifecycle, namespace, SSR isolation, bundle, testability and trap exposure against fewer/one/no contexts, then the split's real benefits and real costs are named with evidence"
verdict: VALIDATED
related: [035, 034, 017, 019]
tags: [svelte5, context, architecture, audit, ssr, lifecycle, bundle]
---

# Spike 036: context-topology-audit

## What This Validates

Owner's question: *what is the actual benefit for us of using multiple contexts in different parts of the application?*
Answered with a static audit — full evidence, per-context inventory, alternatives matrix: **[AUDIT.md](./AUDIT.md)**.

## How to Run

Read-only. Consumer counts: `grep -l "get<X>Context("` over `apps/frontend/src/{lib,routes}` minus `lib/contexts/`.
Reachability: `node .planning/spikes/035-drawer-context-scoping/context-closure.mjs <entry.svelte>`.

## Investigation Trail

1. Inventory of the 10 contexts: init site, composition, owned state, constructor effects, consumer counts (AUDIT §1).
2. Lifecycle cost of hoisting each to root (§2) — voter (5 effects + filter effect that pulls matching) and candidate (private `userData`) are the ones that would cost/leak.
3. Mutual exclusion (§3): 8 same-named members with different semantics in voter vs candidate, `userData` in candidate vs admin; 0 `hasContext` guards outside `lib/contexts`, 4 shared components guard on the runtime `appType` flag instead.
4. Bundle (§4a): **checked by hand** — `layouts/main/Banner.svelte` statically imports `getVoterContext` and both logout buttons, so voter context code (matching + filters) is reachable from candidate/admin apps. The split does not buy bundle separation.
5. Destructure-trap exposure (§4c) → found a live instance (below).

## Results

**Verdict: VALIDATED — the split earns its keep, but for fewer reasons than assumed.**

Real benefits (keep):
- **Framework-managed lifecycle** — voter/candidate/admin state and their constructor `$effect`s exist only while their subtree is mounted.
- **Namespace separation** — 8 + 1 colliding member names with different semantics; merging would force `ctx.voter.*` namespacing, i.e. rebuild the split by hand.
- **Per-request SSR isolation** — any context-based design has it; module singletons (option D) would leak locale/settings/session/candidate data across requests on adapter-node.
- **Narrow base-component surface** — 43 base components depend only on `ComponentContext`; tests mock one tiny module.

Not real benefits:
- **Bundle splitting** — absent for voter/candidate context code (Banner import chain).
- **Type-enforced exclusion** — it's a runtime `appType` convention.

**The cost the owner feels is inheritance, not multiplicity:** voter/candidate/admin are typed `AppContext & …` and re-expose every app member → `inheritContextMembers`, 81 redeclaration lines, a 205-line spread test, the `logout` override hazard, and two shapes of `darkMode`.

**Live defect found (confirmed by reading, not yet reproduced at runtime):** `lib/components/image/Image.svelte` does `const { darkMode } = getComponentContext();` — `darkMode` is a prototype getter returning a boolean, so the value is frozen at mount and images do not switch to their dark variant when the OS theme changes. Fix: read `getComponentContext().darkMode` in the template/`$derived`, then unify the `darkMode` shape across `ComponentContext` / `AppContext`.

**Relation to the drawer (035):** the ContextBridge friction is about *where the host is mounted*, not how many contexts exist. Merging root contexts (B) or flattening inheritance (E) leaves it untouched; only a single app-wide context (C, rejected) or singletons (D, unsafe) remove it — and so does moving the host into `(voters)/+layout.svelte` (035b), at near-zero cost.

**Recommended follow-ups, by value/cost:** (1) fix `Image.svelte` + unify `darkMode`; (2) adopt 035b; (3) optional: fold `i18n`/`data` (0 external consumers) into the app provider; (4) optional larger: "flatten, don't merge" (~51 mechanical consumer edits) to delete the inheritance machinery; (5) correct any docs that claim the split keeps voter/candidate code out of other bundles.
