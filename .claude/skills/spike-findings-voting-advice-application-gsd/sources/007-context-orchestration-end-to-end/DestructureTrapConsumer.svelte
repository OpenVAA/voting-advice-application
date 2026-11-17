<!--
  SPIKE 007 — Destructure-trap consumer.

  This component DELIBERATELY destructures the reactive accessors out of the
  context object. Per CLAUDE.md "Context Destructuring Rule", this captures the
  initial value at component-init time and binds it to a static local. Reads of
  the local are NOT reads through the getter, so they don't propagate dependency
  invalidation.

  Expected behavior in the browser demo:
    - Counts shown here STAY AT ZERO when the user clicks "select election" /
      "set demo answers" buttons.
    - Counts in the sibling CanonicalConsumer update correctly.
    - This visual divergence is the diagnostic signal — any consumer that
      displays "0" while the canonical sibling shows non-zero has the trap.
-->
<script lang="ts">
  import { getVoterRuneContext } from './voterRuneContext.svelte';

  //  ANTI-PATTERN — DELIBERATE DEMONSTRATION ONLY
  // Reactive accessors destructured into locals = captured at init time.
  // svelte-warning: accepted — intentional anti-pattern for spike demonstration
  const {
    selectedElections,
    opinionQuestions,
    matchesCount,
    profileComplete
  } = getVoterRuneContext();
</script>

<div class="border-2 border-red-500 rounded p-3 bg-red-50 space-y-1">
  <h3 class="text-sm font-bold text-red-900">✗ Destructure-trap consumer (broken — intentional)</h3>
  <p class="text-xs text-gray-600">
    These reads are bound to the init-time values. Click the controls in the page
    header — the canonical consumer above will update; this one will NOT.
  </p>
  <table class="text-xs border-collapse w-full">
    <tbody>
      <tr><td class="pr-3 text-gray-600">selectedElections.length:</td><td>{selectedElections.length}</td></tr>
      <tr><td class="pr-3 text-gray-600">opinionQuestions.length:</td><td>{opinionQuestions.length}</td></tr>
      <tr><td class="pr-3 text-gray-600">matchesCount:</td><td>{matchesCount}</td></tr>
      <tr><td class="pr-3 text-gray-600">profileComplete:</td><td>{profileComplete}</td></tr>
    </tbody>
  </table>
</div>
