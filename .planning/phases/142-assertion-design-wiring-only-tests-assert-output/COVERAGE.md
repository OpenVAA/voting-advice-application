# Phase 142 — External API Coverage Declaration

**Written:** 2026-08-20 (planning)
**Detector:** `ai-integration` API-coverage
**Verdict:** **Not applicable.**

## Declaration

> No external API integration: the phase edits test assertions plus three small product fixes; all
> provider calls in scope are mocked.

## Reasoning

`packages/question-info` and `packages/argument-condensation` do call LLM providers in production, so
the detector's keyword surface fires. It does not apply here, for three measured reasons:

1. **Every test in scope is fully mocked.** `questionTypes.test.ts:14-17` supplies a bare
   `vi.fn()` as `generateObjectParallel`; the `argument-condensation` corpus tests drive
   `Condenser.run()` against canned responses. No corpus test opens a socket
   (`142-RESEARCH.md` § Runtime State Inventory: *"No corpus test touches Supabase, Postgres, or any
   datastore; every one is pure in-process"*).
2. **D-01's product change is to prompt-variable assembly, not to any provider surface.** It adds two
   entries (`questionType`, `choices`) to the literal at
   `packages/question-info/src/core/infoGeneration.ts:75-82` and three `params` entries to the `en/`
   prompt YAMLs. The `@openvaa/llm` provider registry, its request shape, and its transport are
   untouched (`142-RESEARCH.md` § C.1 — *"no signature change, no API surface change"*).
3. **The other two product changes are HTTP-local.** D-02 re-throws an `HttpError` from a SvelteKit
   catch arm; A-07 attaches an error `code` to a locally-thrown `Error`. Neither adds, removes, or
   reshapes a call to any external service.

## Package legitimacy

**No package-manager install occurs in this phase.** `142-RESEARCH.md` § Package Legitimacy Audit
records this explicitly: *"Packages removed due to [SLOP]: none. Packages flagged [SUS]: none."* No
`npm install` / `yarn add` / `pip install` / `cargo add` task exists in any of the six plans, so the
package-legitimacy gate and its blocking human checkpoint are not engaged.
