<!--
  SPIKE 006 — Demo page. Toggleable nested mock routes prove the registry
  handles arbitrary mount/unmount orderings without index drift.

  Tests exercised:
    A. Single overlay mount/unmount — registry returns to base.
    B. Two stacked overlays, parent destroyed first — child overlay correctly
       remains as the effective setting (vs index-based revert which would
       drop the child).
    C. Two stacked overlays, child destroyed first — parent's overlay remains.
    D. Three overlays from three routes mixed merge — order-of-mount drives
       merge precedence (LIFO equivalent).
    E. Same component re-mounted (toggle off → on) — overlays re-applied with
       fresh tokens.
-->
<script lang="ts">
  import { getLayoutSettingsRune } from './layoutSettingsRune.svelte';
  import MockRoute from './MockRoute.svelte';

  const layout = getLayoutSettingsRune();

  // Toggles for each mock route. Toggling off destroys the component →
  // $effect cleanup removes the overlay.
  let routeA = $state(false);
  let routeB = $state(false);
  let routeC = $state(false);

  // .ts $derived aliases — same idiom we used in spikes 001-005.
  const topBarCurrent = $derived(layout.topBar.current);
  const pageStylesCurrent = $derived(layout.pageStyles.current);
  const navCurrent = $derived(layout.navigation.current);
</script>

<div class="p-6 max-w-3xl mx-auto space-y-4 font-mono text-sm">
  <header>
    <h1 class="text-xl font-bold">Spike 006 — Layout Overlay Rune</h1>
    <p class="text-gray-600 text-xs">
      Token-keyed overlay registry with `$effect` auto-cleanup. Toggle mock
      routes in any order; the effective merged settings (top panel) should
      always reflect the live set of mounted overlays.
    </p>
    <p class="text-xs"><a href="/runes-test" class="text-blue-600 underline">← back to runes-test</a></p>
  </header>

  <!-- Effective merged settings (live, $derived) -->
  <section class="border-2 border-green-500 rounded p-3 space-y-1 bg-green-50">
    <h2 class="text-sm font-bold">Effective merged settings (live $derived)</h2>
    <table class="text-xs border-collapse w-full">
      <tbody>
        <tr><td class="pr-3 text-gray-500 align-top w-1/3">topBar:</td><td><code class="text-xs">{JSON.stringify(topBarCurrent, null, 2)}</code></td></tr>
        <tr><td class="pr-3 text-gray-500 align-top">pageStyles:</td><td><code class="text-xs">{JSON.stringify(pageStylesCurrent)}</code></td></tr>
        <tr><td class="pr-3 text-gray-500 align-top">navigation:</td><td><code class="text-xs">{JSON.stringify(navCurrent)}</code></td></tr>
      </tbody>
    </table>
    <p class="text-xs text-gray-500 pt-1">
      overlay counts: topBar={layout.topBar.size}, pageStyles={layout.pageStyles.size}, navigation={layout.navigation.size}
    </p>
  </section>

  <!-- Toggle controls -->
  <section class="border rounded p-3 space-y-2">
    <h2 class="text-sm font-bold">Toggle mock routes (mount / unmount)</h2>
    <div class="space-x-3 text-xs">
      <label><input type="checkbox" bind:checked={routeA} /> Route A (parent layout)</label>
      <label><input type="checkbox" bind:checked={routeB} /> Route B (child layout)</label>
      <label><input type="checkbox" bind:checked={routeC} /> Route C (page)</label>
    </div>

    <div class="border-t pt-2 mt-2">
      {#if routeA}
        <MockRoute
          label="Route A"
          topBar={{ progress: 'fixed-bottom', actions: { feedback: 'show' } }}
          pageStyles={{ drawer: { background: 'bg-base-200' } }}
        />
      {/if}
      {#if routeB}
        <MockRoute
          label="Route B"
          topBar={{ actions: { return: 'show' } }}
          navigation={{ hide: true }}
        />
      {/if}
      {#if routeC}
        <MockRoute
          label="Route C"
          topBar={{ progress: 'fixed-top', actions: { help: 'show' } }}
          pageStyles={{ drawer: { background: 'bg-base-300' } }}
        />
      {/if}
      {#if !routeA && !routeB && !routeC}
        <p class="text-xs text-gray-400 italic">(no mock routes mounted — effective settings = defaults)</p>
      {/if}
    </div>
  </section>

  <!-- Predicted merge guide -->
  <section class="border rounded p-3 text-xs text-gray-700 space-y-1">
    <h2 class="text-sm font-bold">Predicted merged values</h2>
    <ul class="list-disc pl-5 space-y-0.5">
      <li><strong>None mounted:</strong> defaults — topBar.progress="hide", pageStyles.drawer.bg="bg-base-100", navigation.hide=false.</li>
      <li><strong>A only:</strong> progress="fixed-bottom", feedback="show", drawer="bg-base-200".</li>
      <li><strong>A+B:</strong> A's overlay first, B's overlay merged on top. progress still "fixed-bottom" (B doesn't touch it), feedback="show" (A), return="show" (B), nav.hide=true (B).</li>
      <li><strong>A+B+C:</strong> all three merged in mount order. progress="fixed-top" (C wins), drawer="bg-base-300" (C wins), feedback="show" (A), return="show" (B), help="show" (C), nav.hide=true (B).</li>
      <li><strong>Toggle A off while B+C still on:</strong> progress="fixed-top" (C wins), feedback="hide" (A's overlay gone), return="show", help="show", drawer="bg-base-300". <em>This is the robustness test — with index-based revert, this case is ambiguous.</em></li>
    </ul>
  </section>
</div>
