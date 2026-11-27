# Phase 189 — UI safety gate override

| Date (UTC) | Observation |
|---|---|
| 2026-11-20 | The `execute:wave:post` `ui.safety-gate` returned `block: true` after wave 1 ("UI files changed in this wave but no UI-SPEC.md exists"). The files that tripped it are docs-site content and tooling: three new `+page.md` pages, the generated `apps/docs/src/lib/navigation.config.ts` entry and its generator, and comment-only edits. No visual design changed. The operator chose "Override and continue" in the main session, for this phase's docs-content waves; planning had already skipped UI-SPEC for this phase on the same grounds (the plan-time `ui.plan-gate` matched "frontend" in "the frontend copy agrees"). |
