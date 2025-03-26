<!--@component

# Admin app landing page

- This page is only shown if the user is not logged in or not authorized
- In normal use, they will be redirected to login or protected area

-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Loading } from '$lib/components/loading';
  import MainContent from '../MainContent.svelte';

  onMount(() => {
    // Attempt to redirect to the admin dashboard (will be handled by layout)
    goto('/admin/dashboard');
  });
</script>

<MainContent title="Admin">
  <div class="flex h-full w-full items-center justify-center">
    <Loading />
  </div>
</MainContent>
