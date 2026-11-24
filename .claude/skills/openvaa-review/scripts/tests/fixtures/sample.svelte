<script lang="ts">
  // comment
  let count = $state(0);
</script>

<!-- a template comment -->
<!--
  multi-line template comment
-->
<button onclick={() => count++}>{count}</button>

<style>
  /* css comment */
  button { color: red; }
</style>
