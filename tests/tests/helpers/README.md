# tests/tests/helpers/

## Intent

Thin generic Playwright wrappers extracted from Phase 86.1 post-fix inline
patterns. The goal is to reduce the maintenance surface of the 15
`// Phase 86.1 post-fix:` inline workarounds before Phase 86.3 authors
8 new tests against the same patterns.

Each helper distils a recurring Playwright API shape (settle / navigation
/ select / DB-precondition / fixture-iteration) into a small documented
function that takes raw Playwright primitives (`Page`, `Locator`) — no
domain knowledge.

## When to add a new helper

Add a `*.helper.ts` file here when ALL of the following hold:

1. ≥2 inline sites in the suite already share the same Playwright-API
   shape (settle, navigation race, combobox iteration, DB count probe,
   voter-iteration walk).
2. The shape is generic enough to live without domain knowledge
   (operates on `Page` / `Locator` / `SupabaseAdminClient`, not on
   page-object instances or `testIds` lookups specific to one route).
3. The lineage of the inline pattern is documented (Phase N post-fix RCA
   citation) so the helper's docstring can cite it.

Otherwise, leave the pattern inline with a `// reason:` block (per the
Phase 86.1 inline-workaround convention).

## helpers/ vs utils/ boundary

| Layer                    | Purpose                                                       | Examples                                                                          |
| ------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `tests/tests/helpers/`   | Thin generic Playwright wrappers, NO domain knowledge.        | `settle.helper.ts`, `navigation.helper.ts`, `select.helper.ts`                    |
| `tests/tests/utils/`     | Domain-specific assemblers + catalogs.                        | `voterNavigation.ts`, `supabaseAdminClient.ts`, `testIds.ts`, `buildRoute.ts`     |

Helpers operate on raw Playwright primitives. Utils operate on the
voter/candidate domain (the voter journey, the testId catalog, the
Supabase test client, the route builder).

When in doubt, prefer `utils/` — domain assemblers can always be
de-duplicated later by extracting a generic helper, but a premature
helper that bakes in a domain assumption is hard to undo.

## Page-object boundary

Helpers do NOT call page-object methods (per
`86.2-RESEARCH.md §"Page-Object Boundary (Question 5 answer)"`).
Helpers take `Page` / `Locator`, not `QuestionsPage` instances. This
keeps helpers reusable across page-object hierarchies (voter, candidate,
admin) and across non-page-object test code.

If a helper would benefit from a page-object's encapsulated state, the
right move is usually to make the page-object's method richer (or to
add a new page-object method), not to import a page-object into the
helper layer.

## Pitfall references

Three Pitfalls govern helper authoring; each helper file's docstring
cites the relevant one(s):

- **Pitfall #1 — Helper #1 (`settleNetworkIdle`) does NOT swallow timeouts.**
  Callers add `.catch(() => null)` post-call where the original semantic
  was defensive. Helper #3 (`clickAndRaceSettle`) DOES internally swallow
  on click — distinct contract.
- **Pitfall #2 — Helper #4 (`iterateSelectOptions`) docstring cites the
  `Select.svelte` `combobox + listbox` ARIA contract.** The original
  Phase 86.1 RCA mis-identified the role as `radiogroup`; the helper's
  docstring exists to prevent the same regression.
- **Pitfall #3 — Helper #6 (`walkVoterIteration`) default `maxSteps`
  is 6.** Changing the default silently regresses the
  `answeredVoterPage` fixture (which relies on 6 to walk past the
  sort-19 number opinion question).

## Cite

See `86.2-RESEARCH.md §"Open Questions (RESOLVED)" Q3` for the resolution
record establishing this README + the per-helper docstring conventions.
