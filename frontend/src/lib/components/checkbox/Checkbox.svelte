<!--@component
Checkbox component with label and description slot
-->
<script lang="ts">
  export let checked = false;
  export let name: string;
  export let label: string;
  export let disabled = false;
</script>

<label class="flex items-start">
  <div class="h-5 flex items-center">
    <input
      type="checkbox"
      {name}
      bind:checked
      {disabled}
      class="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-300" />
  </div>
  <div class="ml-3">
    <span class="font-medium text-sm text-gray-700">{label}</span>
    {#if $$slots.description}
      <div class="mt-1">
        <slot name="description" />
      </div>
    {/if}
  </div>
</label>
