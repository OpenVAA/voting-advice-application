<script lang="ts">
  import {createEventDispatcher} from 'svelte';
  export let tabs: string[] = [];
  export let activeIndex = 0;

  const dispatch = createEventDispatcher();

  function activate(index: number) {
    activeIndex = index;
    dispatch('changeTab', index);
  }
</script>

<ul class="flex items-center justify-center bg-base-300 px-lg py-8">
  {#each tabs as tab, i}
    <li
      class="btn btn-outline m-0 h-[2.2rem] min-h-[2.2rem] w-auto flex-grow truncate rounded-sm px-12 text-md text-secondary hover:bg-base-100 hover:text-primary focus:bg-base-100 focus:text-primary"
      class:text-primary={i === activeIndex}
      class:bg-base-100={i === activeIndex}
      tabindex="0"
      role="tab"
      on:click={() => activate(i)}
      on:keyup={(e) => {
        if (e.key === 'Enter') activate(i);
      }}>
      {tab}
    </li>
  {/each}
</ul>
