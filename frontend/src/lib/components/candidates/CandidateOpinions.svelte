<script lang="ts">
  import {t} from '$lib/i18n';
  import {page} from '$app/stores';
  import {answeredQuestions} from '$lib/utils/stores';
  import {LikertResponseButtons} from '$lib/components/questions';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';

  export let candidate: CandidateProps;

  let questions: QuestionProps[];
  $: questions = $page.data.questions;

  const shortName = `${candidate.firstName[0].toLocaleUpperCase()}. ${candidate.lastName}`;

  function getAnswer(questionId: string) {
    const match = candidate.answers?.find((a) => a.questionId === questionId);
    return {
      answer: match?.answer,
      openAnswer: match?.openAnswer
    };
  }
</script>

<section class="p-lg">
  {#each questions as question}
    {@const {id, text, type, options, category, info} = question}
    {@const {answer, openAnswer} = getAnswer(id)}
    {@const voterAnswer = $answeredQuestions[id]}
    {@const headingId = `questionHeading-${id}`}

    <div class="mb-60 mt-20">
      <HeadingGroup id={headingId} class="mb-lg text-center">
        <PreHeading class="text-accent">{category}</PreHeading>
        <h3>{text}</h3>
      </HeadingGroup>

      {#if voterAnswer == null && answer == null}
        <div class="small-label mb-16 text-center">
          {$t('questions.bothHaventAnswered').replace('{{candidate}}', shortName)}
        </div>
      {:else if voterAnswer == null}
        <div class="small-label mb-16 text-center">
          {$t('questions.youHaventAnswered')}
        </div>
      {:else if answer == null}
        <div class="small-label mb-16 text-center">
          {$t('questions.candidateHasntAnswered').replace('{{candidate}}', shortName)}
        </div>
      {/if}

      {#if type === 'Likert'}
        <LikertResponseButtons
          aria-labelledby={headingId}
          name={id}
          mode="display"
          selectedKey={voterAnswer}
          entityKey={answer}
          entityLabel={shortName}
          {options} />
      {:else}
        {$t('error.general')}
      {/if}

      {#if openAnswer}
        <div
          class="mt-16 rounded-md bg-base-200 p-md text-center
          before:content-[open-quote] after:content-[close-quote]">
          {openAnswer}
        </div>
      {/if}
    </div>
  {/each}
</section>
