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

<div class="relative grid auto-cols-fr grid-flow-col gap-3">
  {#each options as { value, label }}
    <label class="grid grid-flow-row auto-rows-max justify-items-center gap-2">
      <input
        type="radio"
        class="radio-primary radio min-h-[2.5rem] min-w-[2.5rem] border-2 bg-base-100 ring-4 ring-base-100"
        {name}
        {value}
        bind:group={selected}
        on:change={onChange} />
      <div class="text-center text-xs uppercase text-secondary">{label}</div>
    </label>
  {/each}
  <!-- The line behind the options -->
  <div
    aria-hidden="true"
    class="absolute top-[1.25rem] -z-50 h-0.5 -translate-y-1/2 bg-secondary"
    style="width: calc(100% / {options.length} * {options.length -
      1}); left: calc(50% / {options.length})" />
</div>
