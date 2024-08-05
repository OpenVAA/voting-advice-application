<script lang="ts">
  import {getVoterContext} from '$lib/_contexts/voter';
  import {Loading} from '$lib/components/loading';
  import {BasicPage} from '$lib/templates/basicPage';

  const {answers, constituency, matchedCandidates} = getVoterContext();
  const questionIds = ['a1'];

  function handleAnswerChange({currentTarget}: {currentTarget: HTMLInputElement}) {
    const {id, value} = currentTarget;
    console.info(`[debug] /_test/voter/page.svelte: handleAnswerChange for question ${id}`);
    answers.setAnswer(id, value);
  }
</script>

<BasicPage title="Matched Candidates for {$constituency?.name ?? 'UNKNOWN'}">
  {#await $matchedCandidates}
    <Loading />
  {:then matches}
    <h2>Voter Answers</h2>

    NB! We're faking matching by just randomizing the scores whenever the answer is changed.

    {#each questionIds as id}
      <label class="label gap-md">
        <span class="label-text">Question {id}</span>
        <input
          {id}
          class="input input-primary"
          type="text"
          value={$answers[id]?.value ?? ''}
          on:change={handleAnswerChange} />
      </label>
    {/each}

    <h2>Matched Nominations</h2>
    <ol>
      {#each matches as match}
        <li>{match.entity.electionSymbol} • {match.entity.entity?.name ?? 'UNKNOWN'} • {match}</li>
      {:else}
        <p>No candidates found for this constituency.</p>
      {/each}
    </ol>
  {/await}
</BasicPage>
