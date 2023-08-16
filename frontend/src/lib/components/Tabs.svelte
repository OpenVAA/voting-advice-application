<script lang="ts">
  import {createEventDispatcher} from 'svelte';

  export let tabs: any[] = [];
  export let activeItem = '';

  const dispatch = createEventDispatcher();
</script>

<div class="flex items-center justify-center bg-secondary px-5 py-1">
  <ul>
    {#each tabs as tab}
      <li
        class="btn-outline btn mr-1 h-8 min-h-0 rounded-sm border-none px-12 py-2 font-medium normal-case text-secondary hover:bg-white hover:text-primary focus:bg-white focus:text-primary"
        tabindex="0"
        role="tab"
        on:click={() => dispatch('changeTab', tab)}
        on:keydown={(e) => {
          if (e.key === 'Enter') {
            dispatch('changeTab', tab);
          }
        }}
        on:keyup={(e) => {
          if (e.key === 'Enter') {
            dispatch('changeTab', tab);
          }
        }}
        class:text-primary={tab === activeItem}
        class:bg-white={tab === activeItem}>
        <div>{tab}</div>
      </li>
    {/each}
  </ul>
</div>
