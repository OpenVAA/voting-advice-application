<!--
  SPIKE 007 — Demo page.

  Side-by-side canonical vs destructure-trap consumers, fed by a rune-native
  voterContext orchestrator that draws from Spike 002's dataRoot rune + Spike
  003's voterAnswerRuneStore. Buttons mutate state; the two consumers should
  diverge visually — proving the destructure trap is locally observable and the
  canonical pattern is reactive.

  Steps to verify (manual):
    1. Click "1. Load DataRoot" — populates elections/questions/candidates via
       Spike 002's mechanism.
    2. Click "2. Select first election" — canonical shows selectedElections=1,
       trap stays at 0.
    3. Click "3. Set 3 demo answers" — canonical shows profileComplete=true,
       matchesCount > 0; trap stays false / 0.
    4. Reload page — destructure trap re-initializes; both show 0 again;
       repeat the sequence — same divergence reappears (deterministic).
-->
<script lang="ts">
  import { page } from '$app/state';
  import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
  import { getDataRootRuneContext } from '../contexts/dataRootRuneContext.svelte';
  import { getVoterRuneContext } from './voterRuneContext.svelte';
  import CanonicalConsumer from './CanonicalConsumer.svelte';
  import DestructureTrapConsumer from './DestructureTrapConsumer.svelte';

  const dataRoot = getDataRootRuneContext();
  const ctx = getVoterRuneContext();

  let log = $state<Array<string>>([]);
  let loading = $state(false);

  function pushLog(line: string) {
    log = [...log, `${new Date().toISOString().slice(11, 23)}  ${line}`];
  }

  async function loadDataRoot() {
    loading = true;
    pushLog('loading DataRoot (elections + constituencies + questions + nominations)…');
    const electionData = page.data?.electionData;
    const constituencyData = page.data?.constituencyData;
    if (
      !electionData ||
      electionData instanceof Error ||
      !constituencyData ||
      constituencyData instanceof Error
    ) {
      pushLog('  ✗ no electionData/constituencyData in page.data');
      loading = false;
      return;
    }
    dataRoot.instance.update(() => {
      dataRoot.instance.provideElectionData(electionData);
      dataRoot.instance.provideConstituencyData(constituencyData);
    });
    const dataProvider = await dataProviderPromise;
    dataProvider.init({ fetch });
    const questionData = await dataProvider.getQuestionData({}).catch((e) => e as Error);
    if (questionData instanceof Error) {
      pushLog(`  ✗ questions fetch failed: ${questionData.message}`);
      loading = false;
      return;
    }
    dataRoot.instance.provideQuestionData(questionData);
    const nominationData = await dataProvider.getNominationData({}).catch((e) => e as Error);
    if (nominationData instanceof Error) {
      pushLog(`  ✗ nominations fetch failed: ${nominationData.message}`);
      loading = false;
      return;
    }
    dataRoot.instance.update(() => {
      dataRoot.instance.provideEntityData(nominationData.entities);
      dataRoot.instance.provideNominationData(nominationData.nominations);
    });
    pushLog(
      `  ✓ elections=${dataRoot.instance.elections.length}  candidates=${dataRoot.instance.candidates.length}  questions=${dataRoot.instance.questions.length}`
    );
    loading = false;
  }

  function selectFirstElection() {
    const first = dataRoot.instance.elections?.[0];
    if (!first) {
      pushLog('  ✗ no elections loaded yet — click step 1 first');
      return;
    }
    ctx.selectElection(first);
    pushLog(`selectElection(${first.id})`);
  }

  function setAnswers() {
    ctx.setDemoAnswers();
    pushLog('setDemoAnswers() — answered q1=3, q2=5, q3=1');
  }

  function clearAnswers() {
    ctx.voterAnswers.reset();
    pushLog('voterAnswers.reset()');
  }

  function deselectElection() {
    ctx.selectElection(undefined);
    pushLog('selectElection(undefined) — back to empty');
  }
</script>

<div class="p-6 max-w-4xl mx-auto space-y-4 font-mono text-sm">
  <header>
    <h1 class="text-xl font-bold">Spike 007 — Voter Context Orchestration</h1>
    <p class="text-xs text-gray-600">
      Rune-native voterContext factory wired through the dataRoot rune (Spike 002) +
      voterAnswerRuneStore (Spike 003). Two consumers below should DIVERGE — the
      canonical one updates, the destructure-trap one doesn't. The divergence is
      the diagnostic.
    </p>
    <p class="text-xs">
      <a href="/runes-test" class="text-blue-600 underline">← back to runes-test</a>
    </p>
  </header>

  <!-- Controls -->
  <section class="border rounded p-3 space-y-2">
    <h2 class="text-sm font-bold">Controls</h2>
    <div class="flex flex-wrap gap-2">
      <button class="border px-3 py-1 text-xs" disabled={loading} onclick={loadDataRoot}>
        1. Load DataRoot
      </button>
      <button class="border px-3 py-1 text-xs" onclick={selectFirstElection}>
        2. Select first election
      </button>
      <button class="border px-3 py-1 text-xs" onclick={setAnswers}>
        3. Set 3 demo answers
      </button>
      <button class="border px-3 py-1 text-xs" onclick={deselectElection}>
        Deselect election
      </button>
      <button class="border px-3 py-1 text-xs" onclick={clearAnswers}>
        Clear answers
      </button>
    </div>
  </section>

  <!-- Side-by-side consumers -->
  <section class="grid grid-cols-2 gap-3">
    <CanonicalConsumer />
    <DestructureTrapConsumer />
  </section>

  <!-- Predicted divergence -->
  <section class="border rounded p-3 text-xs text-gray-700 space-y-1">
    <h2 class="text-sm font-bold">Predicted divergence</h2>
    <ul class="list-disc pl-5 space-y-0.5">
      <li><strong>After step 1 (load data):</strong> both consumers still show all zeros — no selection yet.</li>
      <li><strong>After step 2 (select election):</strong> canonical shows selectedElections.length=1, opinionQuestions.length&gt;0; <em>trap stays at 0</em>.</li>
      <li><strong>After step 3 (set 3 answers):</strong> canonical shows profileComplete=true, matchesCount&gt;0; <em>trap stays at 0 / false</em>.</li>
      <li><strong>Click "Deselect" / "Clear answers":</strong> canonical reverts to zeros; trap (already-stale) remains at its captured initial values.</li>
    </ul>
  </section>

  <!-- Log -->
  <section class="border rounded p-3">
    <h2 class="text-sm font-bold mb-1">Log</h2>
    <pre class="text-xs whitespace-pre-wrap">{log.join('\n') || '(empty — click a control button)'}</pre>
  </section>
</div>
