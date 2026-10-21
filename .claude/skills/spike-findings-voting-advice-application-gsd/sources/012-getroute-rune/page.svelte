<!--
  SPIKE 012 — getRoute rune-native, side-by-side variant demo.

  Compares 4 candidate shapes against the SAME `$app/state.page` updates,
  driven by internal navigation between this route + the nested sibling
  + the top-level /runes-test route + a query-param variant of nested.

  Variants exercised (see getRouteRuneStore.svelte.ts for rationale):
    A — Snapshot at init       — must stay stale
    B — Per-call getter        — must always match ground-truth
    C — $derived.by per-field  — PRIMARY: must always match B
    D — C + afterNavigate bump — must always match C (proves the
                                 belt-and-suspenders is redundant)

  Verification gate (from .planning/spikes/012-getroute-rune/.continue-here.md):
    - C output matches B on every nav
    - A output stays at the initial-mount snapshot
    - Zero `effect_update_depth_exceeded` warnings in console
    - No hydration mismatches
-->
<script lang="ts">
  import { page } from '$app/state';
  import { getSpike012Variants } from './spike012Context.svelte';
  import type { RouteOptions } from '$lib/utils/route';

  // Variants are layout-scoped (./+layout.svelte) — same instances survive
  // client-side navigation between sibling routes. This is what makes
  // variant A's mount-time snapshot observable: navigating to ./nested/
  // unmounts THIS page but NOT the layout, so A keeps its captured fields.
  const { a, b, c, d } = getSpike012Variants();

  // The three test inputs we render for each variant. Chosen to exercise
  // different code paths inside buildRoute:
  //   1. {} → rebuild current URL (persistent params + current route id)
  //   2. { route: 'About' } → static target route (no dynamic params)
  //   3. { route: 'Questions', questionId: 'demo-q' } → dynamic param fill
  //
  // Each variant's `current` is called with each input. For B/C/D the
  // output should reflect the CURRENT page; for A it should reflect the
  // page state at mount time.
  const inputs: ReadonlyArray<{ label: string; opts: RouteOptions }> = [
    { label: 'current ({})', opts: {} },
    { label: 'About', opts: { route: 'About' } },
    { label: 'Questions/demo-q', opts: { route: 'Questions', questionId: 'demo-q' } }
  ];

  // PAGE-scoped mount snapshot — captured each time this +page.svelte
  // (re-)mounts. Distinct from variant A's snapshot, which is LAYOUT-scoped
  // and survives client-side route hops within /runes-test/getroute-rune/*.
  // Comparing the two surfaces the difference between page-mount and
  // layout-mount lifetimes.
  const mountPathname = page.url.pathname;
  const mountRouteId = page.route.id;

  // History strip — records each nav as it happens via Variant D's navCount
  // increment. Tap into `$effect` over `page.url.pathname` rather than D's
  // counter so A's "stays stale" claim is visible on FIRST render as well.
  let navHistory = $state<Array<{ at: string; path: string; routeId: string | null }>>([]);
  let prevPath = $state(mountPathname);
  $effect(() => {
    const currentPath = page.url.pathname;
    if (currentPath !== prevPath) {
      prevPath = currentPath;
      navHistory = [
        ...navHistory,
        {
          at: new Date().toISOString().slice(11, 23),
          path: currentPath,
          routeId: page.route.id
        }
      ];
    }
  });
</script>

<div class="p-8 max-w-5xl mx-auto space-y-6 font-mono text-sm">
  <header>
    <h1 class="text-2xl font-bold">Spike 012 — getRoute rune-native</h1>
    <p class="text-gray-600">
      Producer comparison: four rune-native candidate shapes for the
      <code>createGetRoute</code> bridge in
      <code>apps/frontend/src/lib/contexts/app/getRoute.svelte.ts</code>. The
      production file documents a Svelte 5 <code>toStore</code> short-circuit
      trap on the <code>$app/state.page</code> proxy; this spike proves whether
      pure <code>$derived.by</code> over per-field reads dodges it.
    </p>
    <p class="text-xs text-gray-500 pt-1">
      Banned in this spike: <code>svelte/store</code> imports,
      <code>toStore</code>/<code>fromStore</code>, <code>get(store)</code>,
      template <code>$store.X</code> auto-subscribe.
    </p>
  </header>

  <!-- ─────────────────────────────────────────────────────────────── -->
  <!-- Ground truth                                                    -->
  <!-- ─────────────────────────────────────────────────────────────── -->
  <section class="border rounded p-4 space-y-2">
    <h2 class="text-lg font-bold">Ground truth (live <code>page</code>)</h2>
    <table class="border-collapse">
      <tbody>
        <tr><td class="pr-4 text-gray-500">page.url.pathname:</td><td><code>{page.url.pathname}</code></td></tr>
        <tr><td class="pr-4 text-gray-500">page.url.search:</td><td><code>{page.url.search || '∅'}</code></td></tr>
        <tr><td class="pr-4 text-gray-500">page.route.id:</td><td><code>{page.route.id ?? '∅'}</code></td></tr>
        <tr><td class="pr-4 text-gray-500">page.params:</td><td><code>{JSON.stringify(page.params)}</code></td></tr>
        <tr><td class="pr-4 text-gray-500">page-mount pathname (resets per nav):</td><td><code>{mountPathname}</code></td></tr>
        <tr><td class="pr-4 text-gray-500">page-mount routeId:</td><td><code>{mountRouteId ?? '∅'}</code></td></tr>
        <tr><td class="pr-4 text-gray-500">D.navCount (afterNavigate fires):</td><td>{d.navCount}</td></tr>
      </tbody>
    </table>
  </section>

  <!-- ─────────────────────────────────────────────────────────────── -->
  <!-- Navigation controls                                              -->
  <!-- ─────────────────────────────────────────────────────────────── -->
  <section class="border rounded p-4 space-y-2">
    <h2 class="text-lg font-bold">Navigation</h2>
    <p class="text-xs text-gray-600">
      Click each link to drive a navigation. Variants A vs B/C/D will diverge
      because A captures at mount.
    </p>
    <div class="space-x-3 space-y-1">
      <a href="/runes-test/getroute-rune/" class="text-blue-600 underline">→ here</a>
      <a href="/runes-test/getroute-rune/nested/" class="text-blue-600 underline">→ nested</a>
      <a href="/runes-test/getroute-rune/nested?demo=1" class="text-blue-600 underline">→ nested?demo=1</a>
      <a href="/runes-test/" class="text-blue-600 underline">→ /runes-test (cross-spike)</a>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────── -->
  <!-- Side-by-side variant table                                       -->
  <!-- ─────────────────────────────────────────────────────────────── -->
  <section class="border rounded p-4 space-y-2">
    <h2 class="text-lg font-bold">Variant outputs (same inputs, all four shapes)</h2>
    <p class="text-xs text-gray-600">
      Each row shows the SAME <code>RouteOptions</code> fed through all four
      variants. After any navigation: A should stay frozen at mount;
      B/C/D should all agree with each other and with the live ground truth.
    </p>

    <div class="overflow-x-auto">
      <table class="border-collapse text-xs w-full">
        <thead>
          <tr class="text-left border-b">
            <th class="pr-4 py-1">input</th>
            <th class="pr-4 py-1">A snapshot</th>
            <th class="pr-4 py-1">B per-call</th>
            <th class="pr-4 py-1">C $derived.by</th>
            <th class="pr-4 py-1">D C + afterNavigate</th>
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
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────── -->
  <!-- Navigation history                                               -->
  <!-- ─────────────────────────────────────────────────────────────── -->
  <section class="border rounded p-4 space-y-2">
    <h2 class="text-lg font-bold">Nav history (this session)</h2>
    {#if navHistory.length === 0}
      <p class="text-xs text-gray-500">∅ (no navigations yet — click a link above)</p>
    {:else}
      <pre class="text-xs whitespace-pre-wrap">{navHistory.map((h) => `${h.at}  ${h.routeId ?? '∅'}  ${h.path}`).join('\n')}</pre>
    {/if}
  </section>

  <!-- ─────────────────────────────────────────────────────────────── -->
  <!-- Decision notes                                                   -->
  <!-- ─────────────────────────────────────────────────────────────── -->
  <section class="border rounded p-4 space-y-2 bg-gray-50">
    <h2 class="text-lg font-bold">Expected outcomes</h2>
    <ul class="text-xs list-disc pl-5 space-y-1">
      <li>
        <b>A (snapshot):</b> outputs reflect <code>mountPathname</code>
        forever. Any cell that includes the current pathname/route should
        stay frozen at mount values.
      </li>
      <li>
        <b>B (per-call):</b> always reflects the live <code>page</code>.
        The "C ≡ B" column is the truth oracle.
      </li>
      <li>
        <b>C ($derived.by):</b> should match B on every nav. If C diverges,
        the page-proxy fine-grained tracking has a gap and Approach C is
        REJECTED.
      </li>
      <li>
        <b>D (C + afterNavigate):</b> if D always matches C, the defensive
        layer is redundant and can be omitted from the production
        migration. If D ever differs from C, keep the belt-and-suspenders.
      </li>
      <li>
        Browser console must have ZERO <code>effect_update_depth_exceeded</code>
        warnings across all nav transitions.
      </li>
    </ul>
  </section>
</div>
