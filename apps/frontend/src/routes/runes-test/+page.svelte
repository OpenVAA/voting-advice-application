<!--
  SPIKE 001 + 002 — Demo page.

  Demonstrates fully idiomatic Svelte 5 consumption of two rune contexts that
  replace the current toStore/writable bridges in appContext/dataContext.

  Idioms exercised on this page:
    1. Template direct read     — {appSettingsCtx.current.publisher.name}
    2. .ts $derived alias        — const platform = $derived(appSettingsCtx.current.analytics?.platform)
    3. Non-reactive producer     — untrack(() => dataRootCtx.instance.provideElectionData(snapshot))

  Banned idioms (must not appear anywhere on this page or in the contexts):
    - import from 'svelte/store'
    - $appSettings / $dataRoot template auto-subscribe
    - get(appSettings) / get(dataRoot)
    - toStore / fromStore / writable / readable / derived (the store-derived, not the rune)
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
  import { getAppSettingsRuneContext } from './contexts/appSettingsRuneContext.svelte';
  import { getDataRootRuneContext } from './contexts/dataRootRuneContext.svelte';

  const appSettingsCtx = getAppSettingsRuneContext();
  const dataRootCtx = getDataRootRuneContext();

  // ─────────────────────────────────────────────────────────────────────
  // Spike 001 — appSettings consumer patterns
  // ─────────────────────────────────────────────────────────────────────

  // Pattern: .ts $derived alias for ergonomic re-use in templates / handlers.
  // Establishes a dependency on the rune-context's `current` getter, which
  // internally tracks the underlying $state. No svelte/store, no $appSettings.
  const adminEmail = $derived(appSettingsCtx.current.admin?.email);
  const fontName = $derived(appSettingsCtx.current.font?.name);
  const analyticsPlatform = $derived(appSettingsCtx.current.analytics?.platform?.name);
  const electionsDisallowSelection = $derived(
    appSettingsCtx.current.elections?.disallowSelection ?? false
  );
  const headerShowFeedback = $derived(appSettingsCtx.current.header?.showFeedback ?? false);

  // ─────────────────────────────────────────────────────────────────────
  // Spike 002 — dataRoot consumer patterns
  // ─────────────────────────────────────────────────────────────────────

  // Pattern (read-side): .ts $derived over `ctx.current`. The version-counter
  // bump inside dataRoot.subscribe propagates through `current` and forces
  // re-evaluation of every downstream $derived. Tests stable-identity reactivity.
  const electionCount = $derived(dataRootCtx.current.elections?.length ?? 0);
  const constituencyCount = $derived(dataRootCtx.current.constituencies?.length ?? 0);
  const questionCount = $derived(dataRootCtx.current.questions?.length ?? 0);
  const candidateCount = $derived(dataRootCtx.current.candidates?.length ?? 0);
  const nominationCount = $derived(
    dataRootCtx.current.candidateNominations?.length ?? 0
  );

  // Pattern (write-side): producer $effect that reads tracked input (page.data)
  // and applies the mutation via `instance` inside untrack(). No `get(store)`.
  // The instance handle does NOT read the version counter, so writing inside
  // untrack() is sufficient to break the read-write loop — the OUTER effect
  // only re-runs when page.data inputs change.
  let autoProvideEnabled = $state(false);
  $effect(() => {
    if (!autoProvideEnabled) return;
    const electionData = page.data?.electionData;
    const constituencyData = page.data?.constituencyData;
    if (!electionData || !constituencyData) return;
    if (electionData instanceof Error || constituencyData instanceof Error) return;
    untrack(() => {
      dataRootCtx.instance.update(() => {
        dataRootCtx.instance.provideElectionData(electionData);
        dataRootCtx.instance.provideConstituencyData(constituencyData);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // Manual sequential-provide controls
  // ─────────────────────────────────────────────────────────────────────
  //
  // The user clicks step-by-step to FEEL the rune updates propagate. Each
  // handler uses `instance` (non-reactive write handle) and DataRoot's own
  // `update()` transaction wrapper to batch a single subscribe notification.

  let log = $state<Array<string>>([]);
  let loading = $state(false);

  function push(line: string) {
    log = [...log, `${new Date().toISOString().slice(11, 23)}  ${line}`];
  }

  async function step1_loadElections() {
    loading = true;
    push('step 1: provideElectionData + provideConstituencyData (from page.data)');
    const electionData = page.data?.electionData;
    const constituencyData = page.data?.constituencyData;
    if (!electionData || electionData instanceof Error || !constituencyData || constituencyData instanceof Error) {
      push('  ✗ no electionData/constituencyData in page.data');
      loading = false;
      return;
    }
    dataRootCtx.instance.update(() => {
      dataRootCtx.instance.provideElectionData(electionData);
      dataRootCtx.instance.provideConstituencyData(constituencyData);
    });
    push(`  ✓ elections=${dataRootCtx.instance.elections.length}  constituencies=${dataRootCtx.instance.constituencies.length}`);
    loading = false;
  }

  async function step2_loadQuestions() {
    loading = true;
    push('step 2: fetch + provideQuestionData');
    const dataProvider = await dataProviderPromise;
    dataProvider.init({ fetch });
    const result = await dataProvider.getQuestionData({}).catch((e) => e as Error);
    if (result instanceof Error) {
      push(`  ✗ ${result.message}`);
      loading = false;
      return;
    }
    dataRootCtx.instance.provideQuestionData(result);
    push(`  ✓ questions=${dataRootCtx.instance.questions.length}  categories=${dataRootCtx.instance.questionCategories.length}`);
    loading = false;
  }

  async function step3_loadNominations() {
    loading = true;
    push('step 3: fetch + provideEntityData + provideNominationData');
    const dataProvider = await dataProviderPromise;
    dataProvider.init({ fetch });
    const result = await dataProvider.getNominationData({}).catch((e) => e as Error);
    if (result instanceof Error) {
      push(`  ✗ ${result.message}`);
      loading = false;
      return;
    }
    dataRootCtx.instance.update(() => {
      dataRootCtx.instance.provideEntityData(result.entities);
      dataRootCtx.instance.provideNominationData(result.nominations);
    });
    push(`  ✓ candidates=${dataRootCtx.instance.candidates.length}  nominations=${dataRootCtx.instance.candidateNominations.length}`);
    loading = false;
  }

  function reset() {
    log = [];
    push('reset (note: DataRoot collections are append-only — refresh page for true reset)');
  }
</script>

<div class="p-8 max-w-4xl mx-auto space-y-8 font-mono text-sm">
  <header>
    <h1 class="text-2xl font-bold">Spike 001 + 002 — Native Svelte 5 Runes</h1>
    <p class="text-gray-600">
      Tests rune-only replacements for the `toStore` / `writable(dataRoot)` /
      `get(dataRoot)` patterns. Zero `svelte/store` imports on this page.
    </p>
  </header>

  <!-- ─────────────────────────────────────────────────────────────── -->
  <!-- Spike 001 — appSettings via rune context                       -->
  <!-- ─────────────────────────────────────────────────────────────── -->
  <section class="border rounded p-4 space-y-2">
    <h2 class="text-lg font-bold">Spike 001 — `appSettings` rune</h2>
    <p class="text-gray-600 text-xs">
      Reads via `appSettingsCtx.current.X` (no `$appSettings`). The effective
      merge (staticSettings ∪ dynamicSettings ∪ page.data.appSettingsData) lives
      inside the context's `$effect` and is invisible to consumers.
    </p>

    <table class="border-collapse">
      <tbody>
        <tr><td class="pr-4 text-gray-500">admin.email (template direct):</td><td>{appSettingsCtx.current.admin?.email ?? '∅'}</td></tr>
        <tr><td class="pr-4 text-gray-500">admin.email ($derived alias):</td><td>{adminEmail ?? '∅'}</td></tr>
        <tr><td class="pr-4 text-gray-500">font.name:</td><td>{fontName ?? '∅'}</td></tr>
        <tr><td class="pr-4 text-gray-500">analytics.platform.name:</td><td>{analyticsPlatform ?? '∅'}</td></tr>
        <tr><td class="pr-4 text-gray-500">elections.disallowSelection:</td><td>{electionsDisallowSelection}</td></tr>
        <tr><td class="pr-4 text-gray-500">header.showFeedback:</td><td>{headerShowFeedback}</td></tr>
        <tr><td class="pr-4 text-gray-500">colors.light.primary:</td><td>{appSettingsCtx.current.colors?.light?.primary ?? '∅'}</td></tr>
      </tbody>
    </table>
  </section>

  <!-- ─────────────────────────────────────────────────────────────── -->
  <!-- Spike 002 — dataRoot via rune context                          -->
  <!-- ─────────────────────────────────────────────────────────────── -->
  <section class="border rounded p-4 space-y-3">
    <h2 class="text-lg font-bold">Spike 002 — `dataRoot` rune (live counts)</h2>
    <p class="text-gray-600 text-xs">
      Reads via `dataRootCtx.current.X` (no `$dataRoot`). Writes via
      `dataRootCtx.instance.provide*` (no `get(dataRoot)`). The version-counter
      $state inside the context bridges DataRoot's `Updatable.subscribe()` to
      Svelte's reactivity graph.
    </p>

    <table class="border-collapse">
      <tbody>
        <tr><td class="pr-4 text-gray-500">elections.length:</td><td>{electionCount}</td></tr>
        <tr><td class="pr-4 text-gray-500">constituencies.length:</td><td>{constituencyCount}</td></tr>
        <tr><td class="pr-4 text-gray-500">questions.length:</td><td>{questionCount}</td></tr>
        <tr><td class="pr-4 text-gray-500">candidates.length:</td><td>{candidateCount}</td></tr>
        <tr><td class="pr-4 text-gray-500">candidateNominations.length:</td><td>{nominationCount}</td></tr>
        <tr><td class="pr-4 text-gray-500">template direct read:</td><td>{dataRootCtx.current.elections?.length ?? 0} elections</td></tr>
      </tbody>
    </table>

    <div class="space-x-2 pt-2 border-t">
      <button class="border px-3 py-1" disabled={loading} onclick={step1_loadElections}>1. provide elections + constituencies</button>
      <button class="border px-3 py-1" disabled={loading} onclick={step2_loadQuestions}>2. provide questions</button>
      <button class="border px-3 py-1" disabled={loading} onclick={step3_loadNominations}>3. provide entities + nominations</button>
      <button class="border px-3 py-1" onclick={reset}>clear log</button>
    </div>

    <div class="space-x-2 pt-2 text-xs">
      <label>
        <input type="checkbox" bind:checked={autoProvideEnabled} />
        Enable producer-$effect (auto-provide elections+constituencies from page.data — tests untrack pattern)
      </label>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────── -->
  <!-- Log                                                             -->
  <!-- ─────────────────────────────────────────────────────────────── -->
  <section class="border rounded p-4">
    <h2 class="text-lg font-bold mb-2">Log</h2>
    <pre class="text-xs whitespace-pre-wrap">{log.join('\n') || '(empty — click a step button)'}</pre>
  </section>
</div>
