<script lang="ts">
  import {createEventDispatcher} from 'svelte';
  export let tabs: any[] = [];
  export let activeItem = '';

  const dispatch = createEventDispatcher();
</script>

<ul class="flex items-center justify-center bg-base-300 px-lg py-8">
  {#each tabs as tab}
    <li
      class="btn-outline btn m-0 h-[2.2rem] min-h-[2.2rem] w-auto flex-grow truncate rounded-sm px-12 text-md text-secondary hover:bg-base-100 hover:text-primary focus:bg-base-100 focus:text-primary"
      tabindex="0"
      role="tab"
      on:click={() => dispatch('changeTab', tab)}
      on:keydown,
      on:keyup={(e) => {
        if (e.key === 'Enter') {
          dispatch('changeTab', tab);
        }
      }}
      class:text-primary={tab === activeItem}
      class:bg-white={tab === activeItem}>
      {tab}
    </li>
  {/each}
</ul>
