<script lang="ts">
  import {page} from '$app/stores';
  import {Button} from '$lib/components/button';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Expander} from '$lib/components/expander';
  import LikertResponseButtons from '$lib/components/questions/LikertResponseButtons.svelte';
  import {get} from 'svelte/store';
  import {answerContext} from '$lib/utils/answerStore';
  import {goto} from '$app/navigation';

  const questions = $page.data.questions;
  let categories = questions.map((question) => question.category);
  categories = [...new Set(categories)];

  /**
   * A small delay before moving to the next question.
   * TODO: Make this a global variable used throughout the app.
   */
  const DELAY_M_MS = 350;

  const answers = get(answerContext.answers);

  function gotoToQuestion(id: string) {
    const questionUrl = $page.url.pathname.replace(/\/all$/, '/' + id);
    setTimeout(() => goto(questionUrl), DELAY_M_MS);
  }
</script>

<BasicPage title="Your opinions" mainClass="pr-0 pl-0">
  {#each categories as category}
    <Expander title={category || ''} variant="category">
      {#each questions as question}
        {#if category === question.category}
          {#if answers[question.id]}
            <Expander title={question.text || ''} variant="question">
              {question.info}
            </Expander>

            <LikertResponseButtons
              aria-labelledby={question.text}
              name={question.id}
              options={question.options}
              mode="display"
              selectedKey={parseInt(answers[question.id].key)} />
          {:else}
            <Expander title={question.text || ''} variant="question" titleClass="text-warning">
              {question.info}
            </Expander>
            <Button
              on:click={() => gotoToQuestion(question.id)}
              variant="main"
              text="Answer this question." />
          {/if}
        {/if}
      {/each}
    </Expander>
  {/each}
</BasicPage>
