<script lang="ts">
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {translate} from '$lib/i18n/utils/translate';
  import {answerContext} from '$lib/utils/answerStore';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {Expander} from '$lib/components/expander';
  import {LikertResponseButtons} from '$lib/components/questions';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Icon} from '$lib/components/icon';

  const questions = $page.data.questions;
  const categories = [...new Set(questions.map((question) => question.category))];

  const store = answerContext.answers;
  $: answerStore = $store;

  let numUnansweredQuestions = 0;
  let loading = true;
  $: {
    if (answerStore) {
      numUnansweredQuestions = questions.length - Object.entries(answerStore).length;
      loading = false;
    }
  }
</script>

<BasicPage title={$t('candidateApp.allQuestions.title')}>
  <svelte:fragment slot="note">
    {#if numUnansweredQuestions != 0 && !loading}
      <div class="text-warning">
        <Icon name="important" />
        {$t('candidateApp.allQuestions.warning', {numUnansweredQuestions})}
      </div>
    {/if}
  </svelte:fragment>

  <p class="text-center">
    {$t('candidateApp.allQuestions.info')}
  </p>

  {#each categories as category}
    <Expander title={category ?? ''} variant="category">
      {#each questions as question, i}
        <!-- Show questions based on categories -->
        {#if category === question.category}
          <!-- Question has been answered -->
          {#if answerStore?.[question.id]}
            <div class="pb-20 pt-20">
              <div class="text-accent">
                {question.category}
              </div>

              <Expander title={question.text ?? ''} variant="question">
                {question.info}
              </Expander>

              <div class="pt-10">
                <!-- This gives empty form label error from Wave Extension for every empty dot, but fix should come from LikertResponseButton -->
                <LikertResponseButtons
                  name={question.id}
                  mode="display"
                  options={question.values}
                  selectedKey={answerStore[question.id].key} />

                {#if answerStore[question.id].openAnswer}
                  <div class="pt-10">
                    <label for="openAnswer{i}" class="text-m uppercase"
                      >{$t('candidateApp.allQuestions.commentOnThisIssue')}
                    </label>
                    <textarea
                      value={translate(answerStore[question.id].openAnswer)}
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

              <Expander title={question.text ?? ''} variant="question" titleClass="text-warning">
                {question.info}
              </Expander>

              <!-- Navigate to unsanswered question -->
              <a
                class="flex justify-center pt-10"
                href={getRoute({route: Route.CandAppQuestion, id: question.id})}>
                <Button variant="main" text={$t('candidateApp.allQuestions.answerButton')} />
              </a>
            </div>
          {/if}
        {/if}
      {/each}
    </Expander>
  {/each}
</BasicPage>
