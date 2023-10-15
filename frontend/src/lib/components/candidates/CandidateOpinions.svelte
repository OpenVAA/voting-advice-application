<script lang="ts">
  import LikertScaleAnsweringButtons from '../questions/LikertScaleAnsweringButtons.svelte';

  export let candidate: CandidateProps;
  export let questions: QuestionProps[];

  // TODO: Implement Candidate object or convert answers to a dict
  function getAnswer(questionId: string): AnswerProps | undefined {
    if (!candidate) {
      return undefined;
    }
    return candidate.answers?.find((a) => a.questionId === questionId);
  }
</script>

<section class="flex flex-col gap-lg p-lg">
  <!-- TODO: Convert to use a generic Question component -->
  {#each questions as { id, text, category, options }}
    {@const answer = getAnswer(id)}
    <fieldset>
      <legend>
        <hgroup class="mb-lg text-center">
          {#if category && category !== ''}
            <!-- TODO: Set color based on category -->
            <p class="capitalize text-accent">{category}</p>
          {/if}
          <h3>{text}</h3>
        </hgroup></legend>
      {#if answer != null}
        <LikertScaleAnsweringButtons name={id} {options} selected={answer.answer} disabled={true} />
        {#if answer.openAnswer}
          <div class="my-lg rounded-lg bg-base-200 p-md">”{answer.openAnswer}”</div>
        {/if}
      {:else}
        <p>$_('questions.noCandidateAnswer')</p>
      {/if}
    </fieldset>
  {:else}
    <p class="text-error text-center">$_('error.noQuestions')</p>
  {/each}
</section>
