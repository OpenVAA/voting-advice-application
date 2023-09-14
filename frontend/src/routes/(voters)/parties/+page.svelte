<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {parties} from '$lib/utils/stores';

  const urlRoot = $page.url.pathname.replace(/\/$/, '');
</script>

<div class="bg-primary">
  <div class="p-5">
    <h1 class="ml-2.5 mt-14 text-center text-3xl font-medium leading-6 text-gray-500">
      {$_('parties.parties')}
    </h1>
    {#each $parties as party}
      <section class="w-256 card m-8 bg-base-100 shadow-xl">
        <a href={`${urlRoot}/${party.id}`}>
          <h1>{party.name}</h1>
        </a>
      </section>
    {:else}
      <p>{$_('parties.notFound')}</p>
    {/each}
  </div>
</div>
