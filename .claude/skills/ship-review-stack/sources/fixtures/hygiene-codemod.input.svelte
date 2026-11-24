<!--@component

# Results layout

Architecture (Phase 62 Plan 62-03 refactor; updated by Phase 88 Plan 88-02)

- URL is the single source of truth (D-09, D-13).
- As of Plan 88-02 the selected election lives in the route segment.
-->

<script lang="ts">
  // appSettings/dataRoot are reactive accessors (Phase 113 flatten) — read via ctx.X.
  // `.planning/spikes/CONVENTIONS.md` §9 (Spike-024). Phase 117 COLD-01.
  const label = 'Phase 117 COLD-01 appears in this string and must survive';
</script>

<p title="Phase 88 D-11 inside an attribute is not a comment">{label}</p>
<!-- an inline markup comment: Phase 69 ALLIANCE-01 -->
