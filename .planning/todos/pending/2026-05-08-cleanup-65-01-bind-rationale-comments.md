# Cleanup: remove rationale comments from Phase 65 Plan 01 `bind:*` annotations

**Captured:** 2026-05-08 (originally requested by user via `/gsd-do` mid-session during
Phase 67 execution; deferred while a runtime crash was being fixed; captured at Phase 67
close-out per the HANDOFF.json human-actions-pending list).

## Problem

Phase 65 Plan 01 (Svelte 5 audit sweep) annotated 92 `bind:*` directives across
`apps/frontend/src/lib/**/*.svelte` with inline `// bind: keep — <rationale>` comments
explaining why each binding was justified. The comments served their purpose during
the audit (making each call site's reasoning auditable) but now constitute long-term
noise: the audit has been conducted and accepted, the rationale is captured in the
Phase 65 SUMMARY.md + the CLAUDE.md Context Destructuring Rule subsection.

## Scope

Remove the rationale comments while leaving the underlying `bind:` directives in place.

Suggested approach:

1. Enumerate the comments:
   ```
   git grep -nE "// bind: keep" apps/frontend/src/lib/
   ```
   (alternative patterns: `// bind: ok`, `// bind: justified`, `bind: keep —`)

2. Verify the count matches Phase 65 P01 expectations (~92 sites).

3. Strip the comment line above / on the same line as each `bind:` directive,
   preserving the directive itself. A targeted `sed` or codemod is fine — but
   audit the diff before committing; some sites may have multi-line comments
   that need manual review.

4. Run `yarn workspace @openvaa/frontend dev` and confirm no svelte-check / Vite
   warnings emerge from removing the comments (they should be inert).

5. Single atomic commit:
   ```
   chore(svelte5): remove Phase 65-01 bind: rationale comments — audit complete
   ```

## Why now

User's explicit deferred request: *"After this phase, perform a clean-up of the bind
comments created in 65-01. Now that we've checked and justified all bind call sites,
we can remove all the comments detailing their rationale."*

## Suggested phase placement

- **Inline cleanup task in Phase 68** if Phase 68 has any bandwidth (Dev-Tooling Trio
  is mostly tooling — small Svelte cleanup might fit).
- **Or queued for v2.7 close-out / v2.8 Svelte 5 hardening sweep** alongside the
  consolidated Svelte 5 / SSR / a11y warning sweep at
  `.planning/todos/pending/2026-05-08-results-layout-missing-slot-render-tag.md`.

## Related

- Phase 65 Plan 01 SUMMARY.md (audit context — 92 sites, justified)
- CLAUDE.md §"Context Destructuring Rule (Svelte 5)" (rationale codified there)
- `.planning/todos/pending/2026-05-08-results-layout-missing-slot-render-tag.md`
  (consolidated Svelte 5 sweep — natural co-traveller for this cleanup if v2.8
  Svelte 5 hardening lands)
