<script>
  import {_} from 'svelte-i18n';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  export let data;
</script>

{#if data}
  <section class="card m-8 w-96 bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">{data.name}</h2>
      <h3>{data.info}</h3>
      <p><strong>{$_('candidates.candidates')}:</strong></p>
      <ul>
        {#each data.candidates || [] as candidate}
          <li>
            <a href={`/candidates/${candidate.id}`}>
              {GetFullNameInOrder(candidate.attributes.firstName, candidate.attributes.lastName)}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </section>
{/if}
