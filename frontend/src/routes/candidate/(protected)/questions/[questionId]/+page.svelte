<script lang="ts">
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {answerContext} from '$lib/utils/answerStore';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {LikertResponseButtons, QuestionActions, QuestionInfo} from '$lib/components/questions';
  import {BasicPage} from '$lib/templates/basicPage';
  import {addAnswer, updateAnswer} from '$lib/api/candidate';
  import {get} from 'svelte/store';

  const answers = get(answerContext.answers);
  const answerStore = answerContext.answers;

  /**
   * A small delay before moving to the next question.
   * TODO: Make this a global variable used throughout the app.
   */
  const DELAY_M_MS = 350;

  let currentQuestion: QuestionProps | undefined;
  $: currentQuestion = $page.data.questions.find(
    (q) => q.id.toString() === $page.params.questionId.toString()
  );

  $: answer = $answerStore[$page.params.questionId];

  // Store question id and answer value in a store
  async function answerQuestion({detail}: CustomEvent) {
    if (!answer) {
      const response = await addAnswer(detail.id, detail.value);

      if (!response?.ok) {
        return;
      }

      const data = await response.json();
      const answerId = data.data.id;
      answers[$page.params.questionId] = {id: answerId, key: detail.value};
    } else {
      const response = await updateAnswer(answer.id, detail.value);

      if (!response?.ok) {
        return;
      }

      answers[$page.params.questionId] = {
        id: answer.id,
        key: detail.value
      };
    }

    // Update the answer store
    answerContext.answers.set(answers);
  }

  // Skip to next question
  // TODO: Later we might want to add an explicit note that this question was skipped
  // TODO: This needs to take into account as well whether the question is already answered
  function skipQuestion() {
    gotoNextQuestion();
  }

  function gotoNextQuestion() {
    if (!currentQuestion) {
      return;
    }
    const currentIndex = $page.data.questions.indexOf(currentQuestion);
    if (currentIndex < $page.data.questions.length - 1) {
      const nextId = $page.data.questions[currentIndex + 1].id;
      const currentUrl = $page.url.pathname.replace(/\/$/, '');
      const nextQuestionUrl = `${currentUrl.substring(0, currentUrl.lastIndexOf('/'))}/${nextId}`;
      setTimeout(() => goto(nextQuestionUrl), DELAY_M_MS);
    } else {
      setTimeout(() => goto('/results'), DELAY_M_MS);
    }
  }
</script>

{#if currentQuestion}
  {#key currentQuestion}
    <BasicPage title={currentQuestion.text}>
      <!--

        NB! These are quickly hacked in because the Question component
        is deprecated. Please, check everything and preferably rewrite.
        Note that the AnswerOption interface's key is of type number,
        so please update all type defs to use AnswerOption['key']
        instead of a hard-coded type.

      -->

      <HeadingGroup slot="heading" id="hgroup-{currentQuestion.id}">
        {#if currentQuestion.category && currentQuestion.category !== ''}
          <!-- TODO: Set color based on category -->
          <PreHeading class="text-accent">{currentQuestion.category}</PreHeading>
        {/if}
        <h1>{currentQuestion.text}</h1>
      </HeadingGroup>

      {#if currentQuestion.info && currentQuestion.info !== ''}
        <QuestionInfo info={currentQuestion.info} />
      {/if}

      <svelte:fragment slot="primaryActions">
        {#if currentQuestion.type === 'Likert'}
          <LikertResponseButtons
            aria-labelledby="hgroup-{currentQuestion.id}"
            name={currentQuestion.id}
            options={currentQuestion.options}
            selectedKey={parseInt(answer.key)}
            on:change={answerQuestion} />
        {:else}
          {$_('error.general')}
        {/if}
        <QuestionActions
          answered={answer.key != null}
          separateSkip={false}
          on:previous={() => console.error('previous')}
          on:delete={() => console.error('delete')}
          on:next={skipQuestion} />
      </svelte:fragment>
    </BasicPage>
  {/key}
{:else}
  {$_('question.notFound')}
{/if}
