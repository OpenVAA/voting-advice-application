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
  import { ENTITY_TYPE, QUESTION_CATEGORY_TYPE } from '@openvaa/data';
  import { DISTANCE_METRIC, MatchingAlgorithm, MISSING_VALUE_METHOD } from '@openvaa/matching';
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
  import { matchStore } from '$lib/contexts/voter/matchStore.svelte';
  import { nominationAndQuestionStore } from '$lib/contexts/voter/nominationAndQuestionStore.svelte';
  import { getAppSettingsRuneContext } from './contexts/appSettingsRuneContext.svelte';
  import { candidateAnswerRuneStore } from './contexts/candidateAnswerRuneStore.svelte';
  import { getDataRootRuneContext } from './contexts/dataRootRuneContext.svelte';
  import { voterAnswerRuneStore } from './contexts/voterAnswerRuneStore.svelte';
  import type { AnyQuestionVariant } from '@openvaa/data';

  const appSettingsCtx = getAppSettingsRuneContext();
  const dataRootCtx = getDataRootRuneContext();

  // ─────────────────────────────────────────────────────────────────────
  // Spike 003 — voter answer store (rune-native, no svelte/store)
  // Spike 004 — matchStore integration (verifying the existing rune-native
  //             matchStore works against the rune-native voterAnswerRuneStore)
  // Spike 005 — candidate answer store (rune-native edited-answer overlay)
  // ─────────────────────────────────────────────────────────────────────

  const voterAnswers = voterAnswerRuneStore();
  const candidateAnswers = candidateAnswerRuneStore();

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

  // ─────────────────────────────────────────────────────────────────────
  // Spike 004 — matchStore integration
  // ─────────────────────────────────────────────────────────────────────
  //
  // The existing production `matchStore.svelte.ts` is already fully rune-native
  // (uses $derived.by + getter callbacks, zero svelte/store imports). The only
  // thing tying it to legacy stores was its consumption of the legacy
  // AnswerStore.answers getter (which went through fromStore).
  //
  // This panel proves that matchStore works identically when fed the new
  // rune-native `voterAnswerRuneStore` — answering a question triggers a
  // $derived.by re-evaluation inside matchStore, recomputing all matches.

  const algorithm = new MatchingAlgorithm({
    distanceMetric: DISTANCE_METRIC.Manhattan,
    missingValueOptions: { method: MISSING_VALUE_METHOD.RelativeMaximum }
  });

  // Pick the first election + all its constituencies. Spike-grade — production
  // uses selectedElections / selectedConstituencies from voterContext.
  const firstElection = $derived(dataRootCtx.current.elections?.[0]);
  const allConstituencies = $derived(dataRootCtx.current.constituencies);

  // Wire the production nominationAndQuestionStore with rune getters — it
  // doesn't care that the answers are now rune-native.
  const _nq = nominationAndQuestionStore({
    dataRoot: () => dataRootCtx.current,
    elections: () => (firstElection ? [firstElection] : undefined),
    constituencies: () => allConstituencies,
    entityTypes: () => [ENTITY_TYPE.Candidate],
    hideIfMissingAnswers: () => ({
      [ENTITY_TYPE.Candidate]: false,
      [ENTITY_TYPE.Organization]: false,
      [ENTITY_TYPE.Faction]: false,
      [ENTITY_TYPE.Alliance]: false
    })
  });

  // Pick first 3 opinion questions to expose as answer pickers in the demo.
  // `opinionQuestions` lives inside the NQ tree per [electionId][entityType];
  // for the demo we just grab the first election's candidate-type slice.
  const opinionQuestionsToShow = $derived.by(() => {
    const electionId = firstElection?.id;
    if (!electionId) return [] as Array<AnyQuestionVariant>;
    const slice = _nq.value[electionId]?.[ENTITY_TYPE.Candidate];
    return slice?.opinionQuestions?.slice(0, 3) ?? [];
  });

  // matchStore — note the SAME function imported from production code.
  const _matches = matchStore({
    answers: voterAnswers,
    nominationsAndQuestions: () => _nq.value,
    algorithm,
    minAnswers: () => 1,
    calcSubmatches: () => [],
    parentMatchingMethod: () => 'none'
  });

  // Top-5 candidate matches for the first election. Re-evaluates whenever the
  // voterAnswerRuneStore changes — that's the integration proof.
  //
  // Type note: matchStore returns `MaybeWrappedEntityVariant[]` which can be
  // either Match-wrapped (when answers exist) or raw entity arrays (when no
  // answers). We runtime-check for `distance` to filter.
  // Match objects from @openvaa/matching expose `.distance` (getter), `.score`
  // (0-100 percentage getter), and `.target` (the CandidateNomination).
  // `target.entity` is the Candidate with `.firstName`, `.lastName`, `.name`.
  const topMatches = $derived.by(() => {
    const electionId = firstElection?.id;
    if (!electionId) return [] as Array<{ name: string; id: string; score: string }>;
    const matches = _matches.value[electionId]?.[ENTITY_TYPE.Candidate] ?? [];
    // Match-vs-raw runtime check.
    return (matches as Array<unknown>)
      .filter((m): m is { score: number; target: { entity: { id: string; name: string; firstName: string; lastName: string } } } =>
        typeof m === 'object' && m !== null && 'target' in m && 'score' in m
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((m) => ({
        name: m.target.entity.name,
        id: m.target.entity.id,
        score: `${m.score}%`
      }));
  });

  function getQuestionLabel(q: AnyQuestionVariant): string {
    return typeof q.name === 'string' ? q.name : q.id;
  }

  // For singleChoiceOrdinal: choices live on the question. For the spike we
  // expose the raw 1..N keys as selectable values. Production would use
  // QuestionInput.
  function getQuestionChoices(q: AnyQuestionVariant): Array<{ id: number; label: string }> {
    const choices = (q as unknown as { choices?: Array<{ id: number; label: string }> }).choices;
    return choices ?? [];
  }

  function getCurrentAnswer(qId: string): unknown {
    return voterAnswers.answers[qId]?.value;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Spike 005 — candidate answer store init helper
  // ─────────────────────────────────────────────────────────────────────

  function initCandidateMock() {
    candidateAnswers.init({
      id: 'mock-candidate-1',
      firstName: 'Mock',
      lastName: 'Candidate',
      answers: {
        'q-mock-1': { value: 'pre-saved answer A' },
        'q-mock-2': { value: 42 }
      }
    });
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
  <!-- Spike 003 — voterAnswerStore rune                              -->
  <!-- ─────────────────────────────────────────────────────────────── -->
  <section class="border rounded p-4 space-y-2">
    <h2 class="text-lg font-bold">Spike 003 — `voterAnswerRuneStore`</h2>
    <p class="text-gray-600 text-xs">
      Replaces `localStorageWritable + fromStore` with `runeLocalStorage`. Reads
      via `voterAnswers.answers[qId]?.value` getter. Writes via `setAnswer`.
      Persisted to `localStorage` under `runes-test-VoterAnswerRuneStore`.
    </p>
    <table class="border-collapse">
      <tbody>
        <tr><td class="pr-4 text-gray-500">answer count:</td><td>{Object.keys(voterAnswers.answers).length}</td></tr>
        <tr><td class="pr-4 text-gray-500">raw answers:</td><td><code class="text-xs">{JSON.stringify(voterAnswers.answers)}</code></td></tr>
      </tbody>
    </table>
    <div class="space-x-2 pt-2">
      <button class="border px-3 py-1" onclick={() => voterAnswers.setAnswer('demo-q1', 3)}>setAnswer('demo-q1', 3)</button>
      <button class="border px-3 py-1" onclick={() => voterAnswers.setAnswer('demo-q2', 'opinion-a')}>setAnswer('demo-q2', 'opinion-a')</button>
      <button class="border px-3 py-1" onclick={() => voterAnswers.deleteAnswer('demo-q1')}>deleteAnswer('demo-q1')</button>
      <button class="border px-3 py-1" onclick={() => voterAnswers.reset()}>reset</button>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────── -->
  <!-- Spike 004 — matchStore integration                              -->
  <!-- ─────────────────────────────────────────────────────────────── -->
  <section class="border rounded p-4 space-y-3">
    <h2 class="text-lg font-bold">Spike 004 — `matchStore` integration</h2>
    <p class="text-gray-600 text-xs">
      Wires the production-grade `matchStore` (already rune-native — zero
      `svelte/store` imports) against the new `voterAnswerRuneStore`. Pick
      answers for opinion questions below; the top-5 candidate matches
      re-compute via `$derived.by` inside matchStore. (Requires step 3 in
      Spike 002 — DataRoot must have entities + nominations loaded.)
    </p>

    {#if !firstElection || (dataRootCtx.current.candidateNominations?.length ?? 0) === 0}
      <p class="text-amber-700 text-xs">⚠ Click Spike 002 steps 1–3 first to load DataRoot before matching can run.</p>
    {:else if opinionQuestionsToShow.length === 0}
      <p class="text-amber-700 text-xs">⚠ No opinion questions found for the first election.</p>
    {:else}
      <div class="space-y-2">
        <p class="text-xs">Answer opinion questions (election: <code>{firstElection.id}</code>):</p>
        {#each opinionQuestionsToShow as q (q.id)}
          <div class="border-l-2 border-gray-300 pl-3 py-1">
            <div class="text-xs font-bold">{getQuestionLabel(q)}</div>
            <div class="space-x-1 pt-1">
              {#each getQuestionChoices(q) as c (c.id)}
                <button
                  class="border px-2 py-0.5 text-xs"
                  class:bg-blue-100={getCurrentAnswer(q.id) === c.id}
                  onclick={() => voterAnswers.setAnswer(q.id, c.id)}
                >{c.id}</button>
              {/each}
              <button class="border px-2 py-0.5 text-xs italic" onclick={() => voterAnswers.deleteAnswer(q.id)}>clear</button>
              <span class="text-xs text-gray-500">current: <code>{String(getCurrentAnswer(q.id) ?? '∅')}</code></span>
            </div>
          </div>
        {/each}
      </div>

      <div class="pt-2 border-t">
        <p class="text-xs font-bold">Top-5 candidate matches (live, reactive on every answer change):</p>
        {#if topMatches.length === 0}
          <p class="text-xs text-gray-500">∅ (no matches — answer at least one opinion question)</p>
        {:else}
          <ol class="text-xs space-y-0.5 pt-1">
            {#each topMatches as m (m.id)}
              <li>{m.score} — {m.name} <span class="text-gray-400">({m.id})</span></li>
            {/each}
          </ol>
        {/if}
      </div>
    {/if}
  </section>

  <!-- ─────────────────────────────────────────────────────────────── -->
  <!-- Spike 005 — candidateAnswerRuneStore                           -->
  <!-- ─────────────────────────────────────────────────────────────── -->
  <section class="border rounded p-4 space-y-2">
    <h2 class="text-lg font-bold">Spike 005 — `candidateAnswerRuneStore`</h2>
    <p class="text-gray-600 text-xs">
      Scoped rewrite of `candidateUserDataStore` — only the edited-answer
      persistence layer that currently uses `localStorageWritable + fromStore`.
      Saved-state ($state) merged with edited-overrides
      (`runeLocalStorage`) in a `$derived.by` composite. Mirrors production
      lines 38-42, 130, 138, 144 exactly, minus the svelte/store imports.
    </p>

    <table class="border-collapse">
      <tbody>
        <tr><td class="pr-4 text-gray-500">candidate (current composite):</td><td><code class="text-xs">{JSON.stringify(candidateAnswers.current)}</code></td></tr>
        <tr><td class="pr-4 text-gray-500">hasUnsaved:</td><td>{candidateAnswers.hasUnsaved}</td></tr>
        <tr><td class="pr-4 text-gray-500">unsavedIds:</td><td><code class="text-xs">{JSON.stringify(candidateAnswers.unsavedIds)}</code></td></tr>
      </tbody>
    </table>

    <div class="space-x-2 pt-2">
      <button class="border px-3 py-1" onclick={initCandidateMock}>init(mock saved data)</button>
      <button class="border px-3 py-1" onclick={() => candidateAnswers.setAnswer('q-mock-1', 'EDITED override')}>setAnswer('q-mock-1', edited)</button>
      <button class="border px-3 py-1" onclick={() => candidateAnswers.setAnswer('q-mock-3', 'new answer')}>setAnswer('q-mock-3', new)</button>
      <button class="border px-3 py-1" onclick={() => candidateAnswers.resetAnswer('q-mock-1')}>resetAnswer('q-mock-1')</button>
      <button class="border px-3 py-1" onclick={() => candidateAnswers.resetAll()}>resetAll (edits only)</button>
      <button class="border px-3 py-1" onclick={() => candidateAnswers.reset()}>reset (incl. saved)</button>
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
