<script>
  import {_} from 'svelte-i18n';
  import {GetFullNameInOrder} from '../../../utils/internationalisation';
  export let data;
  let party = data?.party?.data;
</script>

{#if data}
  <section class="card m-8 w-96 bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">{GetFullNameInOrder(data.firstName, data.lastName)}</h2>
      <h3><a href={`/parties/${party?.id}`}>{party?.attributes?.party}</a></h3>
      <p><strong>{$_('candidate.politicalExperience')}:</strong> {data.politicalExperience}</p>
    </div>
  </section>
{/if}
