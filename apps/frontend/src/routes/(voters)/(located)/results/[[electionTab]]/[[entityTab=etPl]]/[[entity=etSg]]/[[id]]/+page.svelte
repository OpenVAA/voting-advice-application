<!--@component

# Results — list / detail page (see phase 62; renamed to the
# 4-segment shape, see phase 88)

Single page file serving the URL shapes of `/results`:

  1. `/results/[electionTab]/candidates?electionId=X`              — list only, default plural tab (`+layout.ts` redirects bare `/results`)
  2. `/results/[electionTab]/[entityTab]?electionId=X`             — list only, explicit plural tab
  3. `/results/[electionTab]/[entityTab]/[entity]/[id]?electionId=X` — list + drawer (matching types)
  4. `/results/[electionTab]/organizations/candidate/[id]?electionId=X` — list + drawer (cross-type edge)

## Layout / page ownership split (preserved through 88-02)

The **parent `+layout.svelte` renders both the list AND the drawer
overlay**. The drawer uses `<EntityDetailsDrawer>` and paints first thanks to
source-order markup + `content-visibility: auto` on the list container.
That means this page file is deliberately empty when a detail URL is visited —
the layout consumes `page.params.entity` + `page.params.id` and
renders the overlay itself.

Route params (see phase 88 renames):
- `electionTab`   (optional, freeform)             — SELECTED election id for the active results tab
- `entityTab`     (optional, matcher-gated by etPl) — `candidates` | `organizations` | `alliances`
- `entity`        (optional, matcher-gated by etSg) — `candidate` | `organization` | `alliance`
- `id`            (optional)                        — entity id for the drawer

Name-disjoint dissociation: `electionTab` (route key, SELECTED singular) and
`electionId` (search key, AVAILABLE array; PERSISTENT_SEARCH_PARAMS member at
`$lib/utils/route/params.ts`) are literally different identifiers throughout
the codebase. `constituencyId` continues to travel as a persistent search
param.

The coupling-guard (`+page.ts`) handles the impossible `entity-without-id`
and `id-without-entity` URL shapes with a 307 redirect back to the parent
list route.
-->

<script lang="ts">
  // Intentionally empty — layout owns both list and drawer rendering.
</script>
