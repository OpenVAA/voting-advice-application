<!--
  SPIKE 007 — Canonical consumer of the voterRuneContext.

  Pattern (correct, recommended): read reactive accessors via `ctx.X` directly,
  or alias through `$derived(ctx.X)` for ergonomics. Both establish a tracking
  edge at the call site.
-->
<script lang="ts">
  import { getVoterRuneContext } from './voterRuneContext.svelte';

  // KEEP `ctx` — do not destructure. Destructuring is the trap (see sibling).
  const ctx = getVoterRuneContext();

  // .ts $derived aliases — convenient and reactive. The $derived re-evaluates
  // every time the underlying $state/$derived in the context changes, because
  // `ctx.X` invokes the getter at the call site INSIDE $derived's tracking scope.
  const selectedElections = $derived(ctx.selectedElections);
  const opinionQuestions = $derived(ctx.opinionQuestions);
  const matchesCount = $derived(ctx.matchesCount);
  const profileComplete = $derived(ctx.profileComplete);
</script>

<div class="border-2 border-green-500 rounded p-3 bg-green-50 space-y-1">
  <h3 class="text-sm font-bold text-green-900">✓ Canonical consumer (ctx.X reads + $derived alias)</h3>
  <table class="text-xs border-collapse w-full">
    <tbody>
      <tr><td class="pr-3 text-gray-600">selectedElections.length:</td><td>{selectedElections.length}</td></tr>
      <tr><td class="pr-3 text-gray-600">opinionQuestions.length:</td><td>{opinionQuestions.length}</td></tr>
      <tr><td class="pr-3 text-gray-600">matchesCount:</td><td>{matchesCount}</td></tr>
      <tr><td class="pr-3 text-gray-600">profileComplete:</td><td>{profileComplete}</td></tr>
      <tr><td class="pr-3 text-gray-600">template direct (ctx.selectedElections.length):</td><td>{ctx.selectedElections.length}</td></tr>
    </tbody>
  </table>
</div>
