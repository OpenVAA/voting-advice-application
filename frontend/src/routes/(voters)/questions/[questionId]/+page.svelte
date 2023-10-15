<script lang="ts">
  import {_} from 'svelte-i18n';
  import {get} from 'svelte/store';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {answeredQuestions} from '$lib/utils/stores';
  import {logDebugError} from '$lib/utils/logger';
  import {BasicPage} from '$lib/components/basicPage';
  import LikertScaleAnsweringButtons from '$lib/components/questions/LikertScaleAnsweringButtons.svelte';
  import {IconButton} from '$lib/components/iconButton';
  import {HelpIcon, PreviousIcon, ResultsIcon, SkipIcon} from '$lib/components/icons';

  // TODO! THIS IS A TEMPORARY QUICK FIX!
  // NEED TO CREATE ANOTHER TEMPLATE FOR QUESTIONS TO USE FIELDSET/LEGEND
  // TODO: Add a button remove the voter answer

  /**
   * A small delay before moving to the next question.
   * TODO: Make this a global variable used throughout the app.
   */
  const DELAY_M_MS = 350;

  let currentQuestion: QuestionProps | undefined;
  let currentQuestionIndex = 0;
  let selectedKey: number | undefined = undefined;
  $: {
    currentQuestion = $page.data.questions.find((q) => '' + q.id === '' + $page.params.questionId);
    if (currentQuestion) {
      currentQuestionIndex = $page.data.questions.indexOf(currentQuestion);
      // We need to use `get` to read the value without subscribing to it.
      // Otherwise an additional page update will be triggered which breaks the layout momentarily.
      selectedKey = get(answeredQuestions)[currentQuestion.id];
    }
  }

  // Store question id and answer value in a store
  function answerQuestion({detail}: CustomEvent) {
    $answeredQuestions[detail.id] = detail.value;
    logDebugError(
      `Answered question ${detail.id} with value ${detail.value}. Store length: ${
        Object.values($answeredQuestions).length
      }.`
    );
    gotoNextQuestion();
  }

  /** Skip to next question */
  function skipQuestion() {
    gotoNextQuestion();
  }

  function gotoNextQuestion() {
    if (!currentQuestion) {
      return;
    }
    if (currentQuestionIndex < $page.data.questions.length - 1) {
      const nextId = $page.data.questions[currentQuestionIndex + 1].id;
      setTimeout(() => goto(`/questions/${nextId}`), DELAY_M_MS);
    } else {
      setTimeout(() => goto('/results'), DELAY_M_MS);
    }
  }

  function gotoPreviousQuestion() {
    if (!currentQuestion) {
      return;
    }
    if (currentQuestionIndex > 0) {
      const prevId = $page.data.questions[currentQuestionIndex - 1].id;
      setTimeout(() => goto(`/questions/${prevId}`), DELAY_M_MS);
    } else {
      setTimeout(() => goto('/questions'), DELAY_M_MS);
    }
  }
</script>

{#key currentQuestion}
  {#if currentQuestion}
    {@const {id, text, type, options, category, info} = currentQuestion}
    <BasicPage
      title={text}
      progressMin={0}
      progressMax={$page.data.questions.length + 1}
      progress={currentQuestionIndex + 1}>
      <svelte:fragment slot="secondaryActions">
        <IconButton href="/results" aria-label={$page.data.appLabels.actionLabels.results}>
          <ResultsIcon title={$page.data.appLabels.actionLabels.results} />
        </IconButton>
        <IconButton href="/help" aria-label={$page.data.appLabels.actionLabels.help}>
          <HelpIcon />
        </IconButton>
      </svelte:fragment>

      <svelte:fragment slot="heading">
        {#if category && category !== ''}
          <!-- TODO: Set color based on category -->
          <p class="capitalize text-accent">{category}</p>
        {/if}
        <h1>{text}</h1>
      </svelte:fragment>

      {#if info && info !== ''}
        <div class="flex items-center justify-center">
          <!-- TODO: Convert to Expander component -->
          <button class="btn-ghost btn">{$_('questions.readMore')}</button>
        </div>
      {/if}

      <svelte:fragment slot="primaryActions">
        {#if type === 'Likert'}
          <LikertScaleAnsweringButtons
            name={id}
            {options}
            {selectedKey}
            on:change={answerQuestion} />
        {:else}
          {$_('error.general')}
        {/if}
        <div class="mt-lg grid w-full grid-cols-4 items-stretch gap-md">
          <IconButton type="secondary" style="grid-column: 1" on:click={gotoPreviousQuestion}>
            <PreviousIcon />
            <svelte:fragment slot="label">
              {$_('questions.previous')}
            </svelte:fragment>
          </IconButton>
          <IconButton type="secondary" style="grid-column: 4" on:click={skipQuestion}>
            <SkipIcon />
            <svelte:fragment slot="label">
              {$_('questions.skip')}
            </svelte:fragment>
          </IconButton>
        </div>
      </svelte:fragment>
    </BasicPage>
  {/if}
{/key}
