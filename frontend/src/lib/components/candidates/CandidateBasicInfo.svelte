<script lang="ts">
  import {_} from 'svelte-i18n';

  export let candidate: CandidateProps;
  export let questions: QuestionProps[] = [];
  const politicalExperience = questions.find((q) => q.text === 'Political experience');
</script>

<section class="p-lg">
  <table>
    <tr>
      <th class="small-label">{$_('candidate.list')}</th>
      <td class="flex gap-sm">
        <img class="mr-2" src="/icons/list.svg" alt="List Icon" />
        {candidate.party.name} ({candidate.party.shortName})
      </td>
    </tr>
    {#if candidate.electionSymbol}
      <tr>
        <th class="small-label">{$_('candidate.electionSymbol')}</th>
        <td>
          {candidate.electionSymbol}
        </td>
      </tr>
    {/if}
  </table>
  <div class="my-5 divider h-px" />
  <table>
    <tr>
      <th class="small-label">{$_('candidate.motherTongue')}</th>
      <td>
        <ul class="list-disc">
          {#each candidate.motherTongues as lang}
            <li>{lang}</li>
          {/each}
        </ul>
      </td>
    </tr>
    <tr>
      <th class="small-label">{$_('candidate.otherLanguages')}</th>
      <td>
        <ul class="list-disc">
          {#each candidate.otherLanguages as lang}
            <li>{lang}</li>
          {/each}
        </ul>
      </td>
    </tr>
    <tr>
      <th class="small-label">{$_('candidate.politicalExperience')}</th>
      <td>
        {candidate.answers?.filter((answer) => answer.questionId === politicalExperience?.id)[0]
          .openAnswer}
      </td>
    </tr>
  </table>
</section>

<style>
  th {
    /* We cannot apply small-label bc it's a custom style */
    @apply pb-md pr-lg pt-4 text-left align-top;
  }
  td {
    @apply pb-md align-top;
  }
  tr:last-of-type td,
  tr:last-of-type th {
    @apply pb-0;
  }
</style>
