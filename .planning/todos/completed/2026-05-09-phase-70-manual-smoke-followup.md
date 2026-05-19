# Phase 70 — Manual Smoke + Parity Gate Follow-up

**Captured:** 2026-05-09
**Source:** Phase 70 verifier (PASS-WITH-DEFERRALS)
**Phase ref:** `.planning/phases/70-svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup/70-VERIFICATION.md`

Phase 70 (Svelte 5 / SSR / a11y warning sweep + BIND strip) verified PASS-WITH-DEFERRALS — all 5 autonomous gates green, but three operator-driven smokes remain. None block Phase 71 (typing cleanup); fold into the next operator session that brings up the dev server.

## Deferred items

1. **Voter-flow happy-path cold-start verification** — `rm -rf apps/frontend/.svelte-kit node_modules/.vite/ && yarn dev`, then walk home → election → constituency → questions → results. Confirm zero un-justified A/B/C/D warnings on the dev-server log + reactive smokes (Expander expand/collapse; EnumeratedEntityFilter / NumericEntityFilter interaction). Backs CONTEXT.md D-04 cold-start protocol; covers SC-1 reactivity-preserved + SC-2 children-render + SC-3 lived-UX.
2. **Authenticated admin/jobs DevTools polling smoke** — sign in to admin, navigate to `/admin/jobs`, open DevTools Network tab, confirm polling fetch fires after page mount and continues on the configured interval, and ceases on unmount. Backs Plan-70-04 SC-1b/D runtime confirmation (auto-chain could not authenticate).
3. **Playwright parity baseline (SC-5)** — `yarn test:e2e` against `yarn dev:reset` baseline. Verify v2.7-close parity preserved post-Phase-70. Likely bundleable with the existing Phase 69 parity-gate follow-up at `.planning/todos/pending/2026-05-09-phase-69-parity-gate-followup.md` — same baseline, same operator session.

## Cosmetic cleanup

- `.planning/REQUIREMENTS.md` `## Traceability` table rows for WARN-01 / BIND-01 still read "In Progress" / "Pending" while the canonical `[x]` checklist marks both complete. One-line docs sync; not gating.

## Out of scope (do NOT pull in)

- 54 `<!-- bind: (keep|ok|justified) -->` HTML-comment-style annotations (separate cleanup; Plan 70-05 SUMMARY flagged).
- 11 unrelated existing `// svelte-ignore state_referenced_locally` lines (RESEARCH.md Q3 RESOLVED out-of-scope).
- 142 pre-existing repo-wide format issues (Plan 70-05 verified pre-existing via stash).
- 160 pre-existing TypeScript errors → Phase 71 / TYPING-01.
