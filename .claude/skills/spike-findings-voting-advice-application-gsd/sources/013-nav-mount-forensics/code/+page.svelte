<!--
  Spike 013 — Index page. Read me first.
-->
<script lang="ts">
  import { trackMount } from './mountLedger.svelte';
  const ledger = trackMount('NavForensicsIndex');
</script>

<article data-mount-id={ledger.instanceId}>
  <h1>Spike 013 — nav-mount-forensics</h1>

  <p>
    This route tree mimics the production voter app's layout hierarchy
    (<code>/runes-test/nav-forensics/questions/[questionId]</code> and
    <code>/runes-test/nav-forensics/results/[electionTab]/[entityTab]</code>).
    Every layout and page registers <code>mount</code>/<code>destroy</code>
    events to the shared ledger panel on the right.
  </p>

  <h2>Run protocol</h2>
  <ol>
    <li>Click <strong>Clear</strong> in the panel.</li>
    <li>Click <strong>Q1</strong> → <strong>Q2</strong> → <strong>Q3</strong>. Watch which components stay mounted.</li>
    <li>Click <strong>Results</strong>. Note how many things destroy + remount when crossing the questions/results boundary.</li>
    <li>Inside results, switch electionTab (<strong>eu</strong> → <strong>local</strong>) and entityTab (<strong>candidates</strong> → <strong>organizations</strong>). Compare to the prior step.</li>
    <li>Click <strong>Copy JSON</strong>. Paste the result into the spike README's Investigation Trail.</li>
  </ol>

  <h2>What to expect (hypothesis)</h2>
  <ul>
    <li><code>NavForensicsOuterLayout</code> mounts exactly once.</li>
    <li><code>QuestionsLayout</code> mounts once, stays mounted across Q→Q.</li>
    <li><code>QuestionPage</code> destroys + remounts on every Q→Q hop — this is the symptom.</li>
    <li><code>ResultsLayout</code> mounts once, persists across electionTab + entityTab swaps.</li>
    <li><code>EntityList</code> destroys + remounts on every (electionTab, entityTab) tuple change — production's <code>&lbrace;#key&rbrace;</code> block.</li>
  </ul>
</article>

<style>
  article {
    max-width: 50rem;
    line-height: 1.5;
  }
  h1 {
    margin-top: 0;
  }
  ol,
  ul {
    padding-left: 1.5rem;
  }
</style>
