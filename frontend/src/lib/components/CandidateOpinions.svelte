<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {MatchableQuestionBase, PersonNomination} from '$lib/vaa-data';
  import {displayAnswer} from '$lib/utils/answers';

  export let candidate: PersonNomination;
  export let questions: MatchableQuestionBase[] = [];
</script>

<section class="mt-4">
  <h1>Under construction!</h1>
  <div class="w-full px-10 pt-3">
    <div class="flex justify-between">
      <div class="flex-col">
        <!-- TO DO: Group by category -->
        {#each questions as qst}
          <div class="mb-3.5 flex items-start">
            <p class="mr-1.5 w-16 text-xs uppercase text-secondary">{qst.text}</p>
            <p class="flex text-sm">
              {@html displayAnswer(qst, candidate, `<em>${$_('candidate.noAnswer')}</em>`)}
            </p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
