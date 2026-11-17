<!--
  SPIKE 012 — nested sub-route. Exists only as a destination for the
  navigation links on the parent /runes-test/getroute-rune/ demo page so
  that `page.url.pathname` + `page.route.id` change in a controlled way.
-->
<script lang="ts">
  import { page } from '$app/state';
  import { getSpike012Variants } from '../spike012Context.svelte';
  import type { RouteOptions } from '$lib/utils/route';

  // Consume the SAME variant instances initialized by ../+layout.svelte.
  // Crucially: variant A's snapshot was captured when the layout mounted
  // (i.e. on the FIRST page in the sub-route), not when this nested page
  // mounted. So A here should still reflect the layout-mount route, not
  // /nested/.
  const { a, b, c, d } = getSpike012Variants();

  const inputs: ReadonlyArray<{ label: string; opts: RouteOptions }> = [
    { label: 'current ({})', opts: {} },
    { label: 'About', opts: { route: 'About' } }
  ];
</script>

<div class="p-8 max-w-5xl mx-auto space-y-6 font-mono text-sm">
  <header>
    <h1 class="text-2xl font-bold">Spike 012 — nested route</h1>
    <p class="text-xs text-gray-500">Variants are LAYOUT-scoped (see ../+layout.svelte). Same instances that the parent page used — so variant A's snapshot is locked at the layout's mount route, not this page's. C/D should reflect /nested/.</p>
  </header>

  <section class="border rounded p-4 space-y-2">
    <h2 class="text-lg font-bold">Ground truth</h2>
    <table class="border-collapse">
      <tbody>
        <tr><td class="pr-4 text-gray-500">page.url.pathname:</td><td><code>{page.url.pathname}</code></td></tr>
        <tr><td class="pr-4 text-gray-500">page.url.search:</td><td><code>{page.url.search || '∅'}</code></td></tr>
        <tr><td class="pr-4 text-gray-500">page.route.id:</td><td><code>{page.route.id ?? '∅'}</code></td></tr>
        <tr><td class="pr-4 text-gray-500">D.navCount:</td><td>{d.navCount}</td></tr>
      </tbody>
    </table>
  </section>

  <section class="border rounded p-4 space-y-2">
    <h2 class="text-lg font-bold">Variant outputs</h2>
    <table class="border-collapse text-xs">
      <thead>
        <tr class="text-left border-b">
          <th class="pr-4 py-1">input</th>
          <th class="pr-4 py-1">A snapshot</th>
          <th class="pr-4 py-1">B per-call</th>
          <th class="pr-4 py-1">C $derived.by</th>
          <th class="pr-4 py-1">D + afterNavigate</th>
          <th class="py-1">C ≡ B ?</th>
        </tr>
      </thead>
      <tbody>
        {#each inputs as { label, opts } (label)}
          {@const outA = a.current(opts)}
          {@const outB = b.current(opts)}
          {@const outC = c.current(opts)}
          {@const outD = d.current(opts)}
          <tr class="border-b align-top">
            <td class="pr-4 py-1 text-gray-500">{label}</td>
            <td class="pr-4 py-1 break-all"><code>{outA}</code></td>
            <td class="pr-4 py-1 break-all"><code>{outB}</code></td>
            <td class="pr-4 py-1 break-all"><code>{outC}</code></td>
            <td class="pr-4 py-1 break-all"><code>{outD}</code></td>
            <td class="py-1">{outC === outB ? '✓' : '✗ DIVERGED'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <section class="border rounded p-4">
    <h2 class="text-lg font-bold mb-2">Back</h2>
    <a href="/runes-test/getroute-rune/" class="text-blue-600 underline">← back to spike 012</a>
    &nbsp;|&nbsp;
    <a href="/runes-test/getroute-rune/nested?demo=2" class="text-blue-600 underline">→ same route, ?demo=2</a>
  </section>
</div>
