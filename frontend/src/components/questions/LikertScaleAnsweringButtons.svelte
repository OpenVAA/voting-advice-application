<script lang="ts">
  import {createEventDispatcher} from 'svelte';
  import {_} from 'svelte-i18n';

  export let name!: string;
  export let options!: {value: number; label: string}[];

  const dispatch = createEventDispatcher();
  let selected: number;

  function onChange(event: Event) {
    dispatch('change', {value: selected, originalEvent: event});
  }
</script>

<section class="flex items-center justify-center">
  <div class="grid grid-cols-{options.length}">
    {#each options as { value, label }}
      <label>
        <input type="radio" {name} {value} bind:group={selected} on:change={onChange} />
        {label}
      </label>
    {/each}
  </div>
</section>
