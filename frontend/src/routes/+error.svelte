<script lang="ts">
  import {page} from '$app/stores';
</script>

<div class="flex h-screen flex-col justify-center">
  <h1 class="text-center text-2xl">{$page.status}</h1>
  <h2 class="text-center text-xl">{$page.error?.message}</h2>
</div>
