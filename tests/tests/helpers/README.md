# tests/tests/helpers/

## Intent

Thin generic Playwright wrappers around recurring API shapes (settle /
navigation / select / DB-precondition / fixture-iteration). Each helper
distils one recurring Playwright shape into a small documented function
that takes raw Playwright primitives (`Page`, `Locator`,
`SupabaseAdminClient`) — no domain knowledge. The goal is to keep the
suite's repeated wait/race/probe patterns in one place so they can be
fixed once rather than copy-pasted inline.

## When to add a new helper

Add a `*.helper.ts` file here when ALL of the following hold:

1. ≥2 inline sites in the suite already share the same Playwright-API shape (settle, navigation race, combobox iteration, DB count probe, voter-iteration walk).
2. The shape is generic enough to live without domain knowledge (operates on `Page` / `Locator` / `SupabaseAdminClient`, not on page-object instances or `testIds` lookups specific to one route).
3. The contract the wrapper guarantees is documented in the helper's docstring (what it waits for, what it swallows, what it does NOT swallow) so callers can rely on it without re-reading the body.

Otherwise, leave the pattern inline with a `// reason:` block explaining why.

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

## Fixture boundary

Helpers do NOT call fixture methods. Helpers take raw `Page` / `Locator`,
never a fixture instance. This keeps them reusable across every spec
regardless of which fixtures it composes. (The suite models page surfaces
as Playwright fixtures under `tests/tests/fixtures/`, not classic page
objects.)

If a helper would benefit from a fixture's encapsulated state, the right
move is to enrich the fixture, not to import it into the helper layer.

## Helper contracts

Three contracts are load-bearing; each helper file's docstring documents
the one(s) it implements:

- **`settleNetworkIdle` does NOT swallow timeouts.** It surfaces a timeout to the caller so a genuinely stuck page fails loudly. Callers that intentionally want a best-effort settle add `.catch(() => null)` at the call site. `clickAndRaceSettle` is the distinct contract that DOES internally swallow on click.
- **`iterateSelectOptions` targets the `combobox + listbox` ARIA contract.** The OpenVAA `Select.svelte` exposes its options as a `combobox` opening a `listbox` (NOT a `radiogroup`). The helper's docstring records this so a future change to `Select.svelte`'s role does not silently break option iteration.
- **`walkVoterIteration` defaults `maxSteps` to 6.** Lowering the default silently regresses the `answeredVoterPage` fixture, which relies on 6 steps to walk past the number opinion question. Keep the default at 6 unless the voter question flow length changes.
