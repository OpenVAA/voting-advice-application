---
created: 2026-08-12
source: Phase 136 D-136-06-1 follow-through
resolves_phase: null
severity: medium
area: CI / packages
---

# Five packages still declare no `test:unit`, so no CI command runs their tests

## State after the D-136-06-1 fix

`@openvaa/data` and `@openvaa/filters` were wired into `yarn test:unit` on 2026-08-12 (the eleven
F12 assertions now execute; `yarn test:unit --force` → exit 0, 21/21 tasks). That closed the
**instance**. It did not close the **class**.

Verified via `npx turbo run test:unit --dry=json`:

| Package | `test:unit` | Test files |
|---|---|---|
| `@openvaa/core` | `<NONEXISTENT>` | 3 |
| `@openvaa/matching` | `<NONEXISTENT>` | 5 |
| `@openvaa/argument-condensation` | `<NONEXISTENT>` | 6 |
| `@openvaa/llm` | `<NONEXISTENT>` | 2 |
| `@openvaa/question-info` | `<NONEXISTENT>` | 2 |

**18 test files run under no CI command.** They execute only under a bare root `vitest`, which
nothing in `.github/workflows/main.yaml` invokes.

`@openvaa/matching` is the one that should be looked at first: it is core product logic (the
distance metrics and position mapping the whole product rests on), not experimental. `llm`,
`question-info` and `argument-condensation` are flagged **Experimental** in CLAUDE.md and may
legitimately need API keys or an explicit skip contract rather than plain wiring — that is a
decision, not a mechanical fix.

## Why this was not just done

Wiring `data` + `filters` was the decided scope (D-136-06-1) and had a known, resolved blocker.
Wiring five more packages is a different change with its own failure surface — at minimum, each needs
its tests actually run and confirmed green before the script is added, or the wiring turns CI red on
somebody else's schedule. Adding a script that fails is worse than the hole it closes.

## Suggested shape

1. Run each package's tests locally first; record pass/fail per package.
2. Wire the green ones (`vitest run --passWithNoTests`, matching `app-shared`'s shape).
3. For any red or key-dependent one, decide explicitly: fix, or an honest documented skip.
4. **Then add the invariant guard** — every `packages/*` workspace containing test files must declare
   a `test:unit` script, failing by name otherwise. Phase 136 plan 03 added exactly this shape of
   check for orphaned Playwright probe files (`playwright.config.ts:34-48`, proven to discriminate).
   Without it this hole simply reopens with the next package.

## Related

- `.planning/todos/pending/2026-08-12-data-filters-unit-tests-not-in-ci.md` — the instance, now fixed
- `.planning/audits/2026-08-11-fake-guard-sweep.md` — F5, the same pathology in CI env wiring
- `VERIFICATION.md` human_verification[0] — where the class was named
