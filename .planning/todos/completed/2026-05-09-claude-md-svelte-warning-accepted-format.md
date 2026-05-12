# Follow-up: Document `// svelte-warning: accepted —` convention in CLAUDE.md

**Captured:** 2026-05-09 (Phase 70 RESEARCH.md Open Question Q2)
**Source:** `.planning/phases/70-svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup/70-RESEARCH.md` §"Open Questions (RESOLVED)" Q2

## What

Add a 3-line note to CLAUDE.md (either §"Important Implementation Notes" or a new §"Svelte Warning Conventions") documenting `// svelte-warning: accepted — <reason>` as the standing format for accepted-warning sentinels.

## Why deferred from Phase 70

- Plan-70-03's `<files>` lists only `apps/frontend/src/lib/components/input/Input.svelte`. Folding a CLAUDE.md edit into that plan would inflate scope.
- Phase 70's actual a11y fix surface uses Pattern 3 **Option A** (structural — promote to `<button>`), so currently 0 sites adopt Option B `// svelte-warning: accepted —`. The doc note would be preemptive against a convention with 0 in-tree examples.

## When to action

After Phase 70 (or any later phase) lands the **first** real Option B accepted-warning case in the codebase. At that point the CLAUDE.md note becomes documentation of an actually-used convention.

## Anchor

Phase 70 D-05 specifies the format: `// svelte-warning: accepted — <reason>`. Carry that wording verbatim into CLAUDE.md when this todo is actioned.

## Resolution

**Resolved:** 2026-05-12 — Phase 78 Plan 03 (CLEAN-03c). Commit `f5793f78f`.
Added `### Svelte Warning-Accepted Format` sub-section under `## Important
Implementation Notes` in CLAUDE.md (line 340), positioned after `### Context
Destructuring Rule (Svelte 5)` to keep Svelte conventions clustered (CONTEXT
D-10 default). Documents the canonical `// svelte-warning: accepted —
<one-sentence-rationale>` format with Phase 70 Cat A `// reason:` precedent.
See `.planning/phases/78-cleanup-hygiene-phase/78-03-SUMMARY.md`.
