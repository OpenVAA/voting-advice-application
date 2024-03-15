<script lang="ts">
  import {t} from '$lib/i18n';
  import {answeredQuestions} from '$lib/utils/stores';
  import {CategoryTag} from '$lib/components/categoryTag';
  import {LikertResponseButtons, QuestionOpenAnswer} from '$lib/components/questions';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {getLikertAnswer} from '$lib/utils/answers';

  /** An optinal props to define wether component is used on the candidate or voter's side*/
  export let candidateView: CandidateDetailsCardProps['candidateView'] = false;

  export let candidate: CandidateProps;
  export let questions: QuestionProps[];

  const shortName = `${candidate.firstName[0].toLocaleUpperCase()}. ${candidate.lastName}`;
</script>

<div class="p-lg">
  {#each questions as question}
    {@const {id, text, type, values, category} = question}
    {@const {answer, openAnswer} = getLikertAnswer(candidate, question)}
    {@const voterAnswer = $answeredQuestions[id]}
    {@const headingId = `questionHeading-${id}`}

    <div class="mb-60 mt-20">
      <HeadingGroup id={headingId} class="mb-lg text-center">
        <PreHeading><CategoryTag {category} /></PreHeading>
        <h3>{text}</h3>
      </HeadingGroup>

      {#if voterAnswer == null && answer == null && !candidateView}
        <div class="small-label mb-16 text-center">
          {$t('questions.bothHaventAnswered').replace('{{candidate}}', shortName)}
        </div>
      {:else if voterAnswer == null && answer == null && candidateView}
        <div class="small-label mb-16 text-center">
          {$t('questions.youHaventAnswered')}
        </div>
      {:else if voterAnswer == null && !candidateView}
        <div class="small-label mb-16 text-center">
          {$t('questions.youHaventAnswered')}
        </div>
      {:else if answer == null}
        <div class="small-label mb-16 text-center">
          {$t('questions.candidateHasntAnswered').replace('{{candidate}}', shortName)}
        </div>
      {/if}

      {#if type === 'singleChoiceOrdinal'}
        <LikertResponseButtons
          aria-labelledby={headingId}
          name={id}
          mode="display"
          selectedKey={voterAnswer}
          entityKey={answer}
          entityLabel={shortName}
          options={values} />
      {:else}
        {$t('error.general')}
      {/if}

      {#if openAnswer}
        <QuestionOpenAnswer>
          {openAnswer}
        </QuestionOpenAnswer>
      {/if}
    </div>
  {/each}
</div>
