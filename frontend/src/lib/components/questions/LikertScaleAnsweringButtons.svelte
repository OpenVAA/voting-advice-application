<script lang="ts">
  import {createEventDispatcher} from 'svelte';

  export let name: QuestionProps['id'];
  export let options: QuestionProps['options'];
  export let selectedKey: number | undefined | null = undefined;
  export let disabled = false;

  const dispatch = createEventDispatcher();

  let selected: number | undefined | null = undefined;

  if (selectedKey != null) {
    selected = selectedKey;
  }

  /** We use this to capture clicks on an already selected input. */
  function onClick(event: MouseEvent) {
    // We only call the `onChange` handler if the input was originally checked
    // If it wasn't, the `change` event will be triggered after this.
    if (selectedKey != null && (event.target as HTMLInputElement).value == '' + selectedKey) {
      onChange(event);
    }
  }

  function onChange(event: Event) {
    dispatch('change', {id: name, value: selected, originalEvent: event});
  }
  // TODO: Fix outer white ring when input is selected
  // TODO: Enable use for displaying the candidate's and voter's answers
</script>

<div class="relative grid w-full auto-cols-fr grid-flow-col gap-0">
  {#each options as { key, label }}
    <label class="grid grid-flow-row auto-rows-max justify-items-center gap-md">
      <input
        type="radio"
        class="radio-primary radio z-10 h-32 w-32 border-lg bg-base-100 ring-4 ring-base-100 disabled:opacity-100"
        {name}
        value={key}
        {disabled}
        bind:group={selected}
        on:change={onChange}
        on:click={onClick} />
      <div class="small-label text-center">{label}</div>
    </label>
  {/each}
  <!-- The line behind the options -->
  <div
    aria-hidden="true"
    class="absolute top-16 z-0 h-4 -translate-y-1/2 bg-base-300"
    style="width: calc(100% / {options.length} * {options.length -
      1}); left: calc(50% / {options.length})" />
</div>
