<script lang="ts">
  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import {currentQuestionIndex, visibleQuestions} from '$lib/stores/stores';
  import type {Question} from '$lib/api/dataObjects';

  let currentQuestion: Question;
  $: if ($visibleQuestions.nonEmpty && $currentQuestionIndex != null) {
    currentQuestion = $visibleQuestions.all[$currentQuestionIndex];
  }

  function gotoNextQuestion() {
    if (!($visibleQuestions?.nonEmpty && $currentQuestionIndex != null)) {
      throw new Error('Cannot call gotoNextQuestion before stores are loaded!');
    }
    const root = $page.url.pathname.replace(/(\/question)\/.*$/, '$1');
    const nextIndex = $currentQuestionIndex + 1;
    if (nextIndex >= $visibleQuestions.all.length) {
      alert('Congrats! This is the last question!');
    }
    const nextId = $visibleQuestions.all[nextIndex].id;
    goto(`${root}/${nextId}`);
  }
</script>

{#if currentQuestion}
  <h1>Question: {currentQuestion.text}</h1>
  <button on:click={gotoNextQuestion} class="btn">Continue to Next Question</button>
{:else}
  <!-- TO DO: <Loading /> -->
  <h1>Loading...</h1>
{/if}
