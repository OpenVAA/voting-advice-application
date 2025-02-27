<!--@component
Card component for displaying content in a box with shadow
-->
<script lang="ts">
  let className = '';
  export { className as class };
</script>

<div class="rounded-lg bg-white shadow-sm {className}">
  <slot />
</div>
