<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {PersonNomination} from '$lib/vaa-data';
  import {createEventDispatcher} from 'svelte';

  // TO DO

  // TO DO: Convert to sparse interface with necessary props only
  export let candidate: PersonNomination;

  const dispatch = createEventDispatcher();

  function onSelect() {
    dispatch('select', {candidate});
  }
</script>

<section class="card m-8 w-96 bg-base-100 shadow-xl">
  <div class="card-body cursor-pointer" on:click={onSelect} on:keydown={onSelect}>
    <h2 class="card-title">{candidate.name}</h2>
    <h3>{candidate.organization ? candidate.organization.name : $_('candidate.independent')}</h3>
  </div>
</section>
