<script lang="ts">
  import {page} from '$app/stores';
  import {Button} from '$lib/components/button';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Expander} from '$lib/components/expander';
  import LikertResponseButtons from '$lib/components/questions/LikertResponseButtons.svelte';
  import {answerContext} from '$lib/utils/answerStore';
  import {goto} from '$app/navigation';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {_} from 'svelte-i18n';

  /**
   * A small delay before moving to the unaswered question.
   * TODO: Make this a global variable used throughout the app.
   */
  const DELAY_M_MS = 350;

  const questions = $page.data.questions;
  const categories = [...new Set(questions.map((question) => question.category))];

  const store = answerContext.answers;
  $: answerStore = $store;

  let nofUnasweredQuestions = 0;
  $: nofUnasweredQuestions = questions.length - Object.entries(answerStore).length;

  function gotoToQuestion(id: string) {
    const questionUrl = $page.url.pathname.replace(/\/all$/, '/' + id);
    setTimeout(() => goto(questionUrl), DELAY_M_MS);
  }
</script>

<BasicPage title={$_('candidateApp.allQuestions.title')}>
  <svelte:fragment slot="note">
    <div class="text-warning">
      <Icon name="important" />
      {$_('candidateApp.allQuestions.warning', {values: {nofUnasweredQuestions}})}
    </div>
  </svelte:fragment>

  <p class="text-center">
    {$_('candidateApp.allQuestions.info')}
  </p>

  <p>
    {#each categories as category}
      <div class="edgetoedge-x">
        <Expander title={category || ''} variant="category">
          {#each questions as question, i}
            <!-- Show questions based on categories -->
            {#if category === question.category}
              <!-- Question has been answered -->
              {#if answerStore[question.id]}
                <div class="pb-20 pt-20">
                  <div class="text-accent">
                    {question.category}
                  </div>

                  <Expander title={question.text || ''} variant="question">
                    {question.info}
                  </Expander>

                  <div class="pt-10">
                    <!-- This gives empty form label error for every empty dot, but fix should come from LikertResponseButton -->
                    <LikertResponseButtons
                      name={question.id}
                      mode="display"
                      options={question.options}
                      selectedKey={answerStore[question.id].key} />

                    {#if answerStore[question.id].openAnswer}
                      <div class="pt-10">
                        <label for="openAnswer{i}" class="text-m uppercase"
                          >{$_('candidateApp.allQuestions.commentOnThisIssue')}
                        </label>
                        <textarea
                          bind:value={answerStore[question.id].openAnswer}
                          disabled={true}
                          id="openAnswer{i}"
                          rows="4"
                          class="textarea textarea-primary w-full" />
                      </div>
                    {/if}
                  </div>
                </div>
                <!-- Question not yet answered -->
              {:else}
                <div class="pt-30 pb-20">
                  <div class="text-accent">
                    {question.category}
                  </div>

                  <Expander
                    title={question.text || ''}
                    variant="question"
                    titleClass="text-warning">
                    {question.info}
                  </Expander>

                  <div class="flex justify-center pt-10">
                    <Button
                      on:click={() => gotoToQuestion(question.id)}
                      variant="main"
                      text={$_('candidateApp.allQuestions.answerButton')} />
                  </div>
                </div>
              {/if}
            {/if}
          {/each}
        </Expander>
      </div>
    {/each}
  </p>
</BasicPage>

<style>
  .edgetoedge-x {
    padding-left: 0;
    padding-right: 0;
  }
</style>
