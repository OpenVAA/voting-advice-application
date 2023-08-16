<script lang="ts">
  import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
  import Question from '$lib/components/questions/Question.svelte';
  import {page} from '$app/stores';
  import {gotoRoute, PageType} from '$lib/navigation';
  import {currentQuestion, nextQuestion, userData} from '$lib/stores';
  import {LikertQuestion, QuestionType} from '$lib/vaa-data';

  // Store question number and answer value in a store
  // TODO: define the detail type in the Likert component and import here
  function answerQuestion(event: CustomEvent) {
    const {question, key} = event.detail;
    if (key == null) {
      throw new Error('Key not returned');
    }
    // Set answer
    $userData.answers[question.id] = key;
    // Select where to go next
    if ($nextQuestion == null) {
      gotoRoute({
        page: PageType.ShowResults,
        currentUrl: $page.url.pathname
      });
    } else {
      gotoRoute({
        page: PageType.ShowQuestion,
        questionId: $nextQuestion.id,
        currentUrl: $page.url.pathname
      });
    }
  }

  let selectedKey: number | undefined;
  $: if ($currentQuestion) {
    selectedKey = $userData.answers?.[$currentQuestion?.id] as number;
  }
</script>

{#if $currentQuestion}
  <section class="flex h-screen flex-col">
    <main class="grid flex-1 content-center px-3">
      {#key $currentQuestion}
        {#if $currentQuestion instanceof LikertQuestion}
          <Question question={$currentQuestion} {selectedKey} on:change={answerQuestion} />
        {:else}
          Cannot currently display non-Likert questions: {$currentQuestion.type}
        {/if}
      {/key}
    </main>
  </section>
{:else}
  <LoadingIndicator />
{/if}
