<script lang="ts">
  import {page} from '$app/stores';
  import {Button} from '$lib/components/button';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Expander} from '$lib/components/expander';
  import LikertResponseButtons from '$lib/components/questions/LikertResponseButtons.svelte';
  import {answerContext} from '$lib/utils/answerStore';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {_} from 'svelte-i18n';
  import {candidateAppRoute} from '$lib/utils/routes';

  const questions = $page.data.questions;
  const categories = [...new Set(questions.map((question) => question.category))];

  const store = answerContext.answers;
  $: answerStore = $store;

  let nofUnasweredQuestions = 0;
  let loading = true;
  $: {
    if (answerStore) {
      nofUnasweredQuestions = questions.length - Object.entries(answerStore).length;
      loading = false;
    }
  }
</script>

<BasicPage title={$_('candidateApp.allQuestions.title')}>
  <svelte:fragment slot="note">
    {#if nofUnasweredQuestions != 0 && !loading}
      <div class="text-warning">
        <Icon name="important" />
        {$_('candidateApp.allQuestions.warning', {values: {nofUnasweredQuestions}})}
      </div>
    {/if}
  </svelte:fragment>

  <p class="text-center">
    {$_('candidateApp.allQuestions.info')}
  </p>

  {#each categories as category}
    <div class="edgetoedge-x">
      <Expander title={category || ''} variant="category">
        {#each questions as question, i}
          <!-- Show questions based on categories -->
          {#if category === question.category}
            <!-- Question has been answered -->
            {#if answerStore?.[question.id]}
              <div class="pb-20 pt-20">
                <div class="text-accent">
                  {question.category}
                </div>

                <Expander title={question.text || ''} variant="question">
                  {question.info}
                </Expander>

                <div class="pt-10">
                  <!-- This gives empty form label error from Wave Extension for every empty dot, but fix should come from LikertResponseButton -->
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
                        disabled
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

                <Expander title={question.text || ''} variant="question" titleClass="text-warning">
                  {question.info}
                </Expander>

                <!-- Navigate to unsanswered question -->
                <a
                  class="flex justify-center pt-10"
                  href="{candidateAppRoute}/questions/{question.id}">
                  <Button variant="main" text={$_('candidateApp.allQuestions.answerButton')} />
                </a>
              </div>
            {/if}
          {/if}
        {/each}
      </Expander>
    </div>
  {/each}
</BasicPage>

<style>
  /* Hotfix for making the expander span the whole width of the page */
  .edgetoedge-x {
    padding-left: 0;
    padding-right: 0;
  }
</style>
