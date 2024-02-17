<script lang="ts">
  import {t} from '$lib/i18n';

  export let candidate: CandidateProps;
</script>

<section class="p-lg">
  <table>
    <tr>
      <th class="small-label">{$t('candidate.list')}</th>
      <td class="flex gap-sm">
        <img class="mr-2" src="/icons/list.svg" alt="List Icon" />
        {candidate.party.name} ({candidate.party.shortName})
      </td>
    </tr>
    {#if candidate.electionSymbol}
      <tr>
        <th class="small-label">{$t('candidate.electionSymbol')}</th>
        <td>
          {candidate.electionSymbol}
        </td>
      </tr>
    {/if}
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
