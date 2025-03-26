<!--@component

# Admin protected index page

- Redirects to the dashboard
- This avoids the route conflict between /admin and /admin/(protected)

-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Loading } from '$lib/components/loading';

  onMount(() => {
    // Redirect to the dashboard
    goto('/admin/dashboard');
  });
</script>

<div class="flex h-screen w-screen items-center justify-center">
  <Loading />
</div>
