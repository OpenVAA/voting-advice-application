<!--
  SPIKE 008 — SSR + hydration test.

  Side-by-side comparison of two appSettings rune context variants:
    A: $effect-only merge (production today + Spike 001) — DB override merged
       in $effect, which does NOT run server-side.
    B: SSR-aware init (page.data merged synchronously at $state init) — DB
       override present in initial value, $effect only handles nav cases.

  Each panel uses STABLE markers in the rendered HTML so a curl-based check
  can read the SSR-output value directly:

    data-test-A-effectfired="false|true"
    data-test-A-headershowfeedback="(value)"
    data-test-B-effectfired="false|true"
    data-test-B-headershowfeedback="(value)"
    data-test-B-initialmergedb="true|false"

  Verification via curl:
    curl -s http://localhost:5173/runes-test/ssr-hydration | grep "data-test-"

  Expected SSR output:
    data-test-A-headershowfeedback="false"   ← DB override MISSED (gap)
    data-test-A-effectfired="false"
    data-test-B-headershowfeedback="true"    ← DB override INCLUDED (fix)
    data-test-B-effectfired="false"
    data-test-B-initialmergedb="true"

  Expected after client hydration (both panels):
    data-test-A-headershowfeedback="true"    ← $effect fired, merge applied
    data-test-A-effectfired="true"
    data-test-B-headershowfeedback="true"    ← unchanged
    data-test-B-effectfired="true"
-->
<script lang="ts">
  import { getAppSettingsVariantA } from './appSettingsVariantA.svelte';
  import { getAppSettingsVariantB } from './appSettingsVariantB.svelte';

  const a = getAppSettingsVariantA();
  const b = getAppSettingsVariantB();

  // .ts $derived aliases for ergonomic template binding.
  //
  // CRITICAL field choice: `results.sections` is set in dynamicSettings.ts to
  // ['candidate', 'organization']. The DB seed (default template app_settings
  // row) overrides it to ['candidate', 'organization', 'alliance']. mergeAppSettings
  // shallow-merges by root key, so the DB-merged value REPLACES the default
  // 'results' block — meaning 'alliance' presence is a clean indicator of
  // "DB override was applied".
  //
  // Variant A misses the DB override during SSR (effect hasn't fired) → no 'alliance'
  // Variant B includes it during SSR (synchronous init reads page.data) → has 'alliance'
  const aSectionsJoined = $derived((a.current.results?.sections ?? []).join(','));
  const aHasAlliance = $derived((a.current.results?.sections ?? []).includes('alliance'));
  const aEffectFired = $derived(a.effectFired);

  const bSectionsJoined = $derived((b.current.results?.sections ?? []).join(','));
  const bHasAlliance = $derived((b.current.results?.sections ?? []).includes('alliance'));
  const bEffectFired = $derived(b.effectFired);
  const bInitialMergeDb = $derived(b.initialMergeIncludedDbOverride);
</script>

<div class="p-6 max-w-4xl mx-auto space-y-4 font-mono text-sm">
  <header>
    <h1 class="text-xl font-bold">Spike 008 — SSR + Hydration</h1>
    <p class="text-xs text-gray-600">
      Two appSettings rune variants. Variant A ($effect-only merge) is the
      current production / Spike 001 shape — it misses DB overrides during SSR.
      Variant B (synchronous init from page.data) merges DB overrides at
      $state init, present in SSR HTML.
    </p>
    <p class="text-xs">
      <a href="/runes-test" class="text-blue-600 underline">← back to runes-test</a>
    </p>
  </header>

  <section class="grid grid-cols-2 gap-3">
    <!-- Variant A: $effect-only merge -->
    <div
      class="border-2 border-amber-500 rounded p-3 bg-amber-50 space-y-1"
      data-test-a-effectfired={aEffectFired}
      data-test-a-hasalliance={aHasAlliance}
      data-test-a-sections={aSectionsJoined}
    >
      <h3 class="text-sm font-bold text-amber-900">
        Variant A — $effect-only merge (current production / Spike 001)
      </h3>
      <table class="text-xs border-collapse w-full">
        <tbody>
          <tr><td class="pr-3 text-gray-600">results.sections:</td><td>[{aSectionsJoined}]</td></tr>
          <tr><td class="pr-3 text-gray-600">includes 'alliance':</td><td>{aHasAlliance}</td></tr>
          <tr><td class="pr-3 text-gray-600">effectFired:</td><td>{aEffectFired}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Variant B: SSR-aware init -->
    <div
      class="border-2 border-green-500 rounded p-3 bg-green-50 space-y-1"
      data-test-b-effectfired={bEffectFired}
      data-test-b-hasalliance={bHasAlliance}
      data-test-b-sections={bSectionsJoined}
      data-test-b-initialmergedb={bInitialMergeDb}
    >
      <h3 class="text-sm font-bold text-green-900">
        Variant B — SSR-aware init
      </h3>
      <table class="text-xs border-collapse w-full">
        <tbody>
          <tr><td class="pr-3 text-gray-600">results.sections:</td><td>[{bSectionsJoined}]</td></tr>
          <tr><td class="pr-3 text-gray-600">includes 'alliance':</td><td>{bHasAlliance}</td></tr>
          <tr><td class="pr-3 text-gray-600">effectFired:</td><td>{bEffectFired}</td></tr>
          <tr><td class="pr-3 text-gray-600">initialMergeDb:</td><td>{bInitialMergeDb}</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="border rounded p-3 text-xs text-gray-700 space-y-1">
    <h2 class="text-sm font-bold">How to verify SSR vs hydration</h2>
    <ol class="list-decimal pl-5 space-y-1">
      <li>
        <strong>SSR check:</strong>
        <code class="block bg-gray-100 p-1 rounded">curl -s http://localhost:5173/runes-test/ssr-hydration | grep "data-test-"</code>
        Should show Variant A's <code>headershowfeedback</code> = "false" (DB gap)
        and Variant B's = "true" (DB applied during SSR).
        Both <code>effectfired</code> attributes = "false" — $effect doesn't run on server.
      </li>
      <li>
        <strong>Post-hydration check:</strong> reload this page in the browser. Both panels should
        show <code>header.showFeedback = true</code>. Variant A "catches up" via $effect; Variant B was
        always correct.
      </li>
      <li>
        <strong>Hydration flash:</strong> Throttle to "Slow 3G" in DevTools and reload. Variant A
        may visibly flash <code>false → true</code>. Variant B should not flash.
      </li>
    </ol>
  </section>
</div>
