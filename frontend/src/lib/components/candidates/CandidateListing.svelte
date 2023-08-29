<script lang="ts">
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import type {CandidateProps} from './CandidateProps.type';
  export let candidate: CandidateProps;
  export let href: string;
</script>

<section class="card m-8 w-96 bg-base-100 shadow-xl">
  {#if candidate}
    <a {href}>
      <div class="card-body">
        <h2 class="card-title">{GetFullNameInOrder(candidate.firstName, candidate.lastName)}</h2>
        <h3>{candidate.party.name}</h3>
      </div>
    </a>
  {:else}
    <p>Error displaying candidate info</p>
  {/if}
</section>
