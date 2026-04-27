<!--@component

# Results — list / detail page (Phase 62 D-08, D-11, D-12)

Single page file serving the four URL shapes of `/results`:

  1. `/results/candidates?electionId=X`                        — list only, default plural tab (`+layout.ts` redirects bare `/results`)
  2. `/results/[plural]?electionId=X`                          — list only, explicit plural tab
  3. `/results/[plural]/[singular]/[id]?electionId=X`          — list + drawer (matching types)
  4. `/results/organizations/candidate/[id]?electionId=X`      — list + drawer (cross-type edge)

## Plan 62-03 ownership split

After Plan 62-03 the **parent `+layout.svelte` renders both the list AND the drawer
overlay**. The drawer uses `<EntityDetailsDrawer>` and paints first thanks to
source-order markup + `content-visibility: auto` on the list container (D-10).
That means this page file is deliberately empty when a detail URL is visited —
the layout consumes `page.params.entityTypeSingular` + `page.params.id` and
renders the overlay itself.

Route params:
- `entityTypePlural`  (optional, matcher-gated)  — `candidates` | `organizations`
- `entityTypeSingular` (optional, matcher-gated) — `candidate` | `organization`
- `id` (optional)                                — entity id for the drawer

electionId + constituencyId travel as persistent search params (see
`$lib/utils/route/params.ts`).

The coupling-guard (`+page.ts`) handles the impossible `singular-without-id`
and `id-without-singular` URL shapes with a 307 redirect back to the parent
list route.
-->

<script lang="ts">
  // Intentionally empty — layout owns both list and drawer rendering.
</script>
