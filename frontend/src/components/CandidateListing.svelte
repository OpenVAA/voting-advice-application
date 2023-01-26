<script>
  import {GetFullNameInOrder} from '../utils/internationalisation';
  export let id;
  export let candidate;
  let party = candidate?.party?.data?.attributes?.party;
</script>

<section class="card m-8 w-96 bg-base-100 shadow-xl">
  {#if candidate && id}
    <a href={`/candidates/${id}`}>
      <div class="card-body">
        <h2 class="card-title">{GetFullNameInOrder(candidate.firstName, candidate.lastName)}</h2>
        <h3>{party}</h3>
      </div>
    </a>
  {:else}
    <p>Error displaying candidate info</p>
  {/if}
</section>
