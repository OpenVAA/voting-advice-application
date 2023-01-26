<script>
  import {_} from 'svelte-i18n';
  import {GetFullNameInOrder} from '../../../utils/internationalisation';
  export let data;
  let candidates = data?.candidates?.data;
</script>

{#if data}
  <section class="card m-8 w-96 bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">{data.party}</h2>
      <h3>Placeholder text</h3>
      <p><strong>{$_('candidates.candidates')}:</strong></p>
      <ul>
        {#each candidates || [] as candidate}
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
