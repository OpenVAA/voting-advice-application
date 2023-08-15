<script lang="ts">
  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import {currentQuestion, nextQuestion} from '$lib/stores';
  import {QuestionType} from '$lib/vaa-data';

  function gotoNextQuestion() {
    if (!$currentQuestion) {
      throw new Error('Cannot call gotoNextQuestion before $currentQuestion is loaded!');
    }
    if ($nextQuestion == null) {
      const resRoot = $page.url.pathname.replace(/\/questions\/.*$/, '');
      goto(`${resRoot}/results`);
    } else {
      const root = $page.url.pathname.replace(/(\/question)\/.*$/, '$1');
      goto(`${root}/${$nextQuestion.id}`);
    }
  }

  const qst = currentQuestion;
</script>

{#if $qst}
  <h1>Question: {$qst.text}</h1>
  <button on:click={gotoNextQuestion} class="btn">Continue to Next Question</button>
  {#if $qst.type === QuestionType.Likert}
    {#each $qst.values as value}
      <div>{value.key}: {value.label}</div>
    {/each}
  {/if}
{:else}
  <!-- TO DO: <Loading /> -->
  <h1>Loading...</h1>
{/if}
