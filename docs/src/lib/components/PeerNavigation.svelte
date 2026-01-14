<script lang="ts">
  import { page } from '$app/stores';
  import { getPeerNavigation } from '$lib/utils/navigation';

  $: peerNav = getPeerNavigation($page.url);
</script>

{#if peerNav.prev || peerNav.next}
  <nav class="peer-navigation max-w-[60rem] border-t border-t-base-300 pt-lg" aria-label="Page navigation">
    <div class="flex justify-between gap-md">
      {#if peerNav.prev}
        <a href={peerNav.prev.route} class="peer-nav-link peer-nav-prev">
          <span class="peer-nav-label">Previous</span>
          <span class="peer-nav-title">{peerNav.prev.title}</span>
        </a>
      {:else}
        <div></div>
      {/if}

      {#if peerNav.next}
        <a href={peerNav.next.route} class="peer-nav-link peer-nav-next">
          <span class="peer-nav-label">Next</span>
          <span class="peer-nav-title">{peerNav.next.title}</span>
        </a>
      {/if}
    </div>
  </nav>
{/if}

<style>
  .peer-navigation {
    width: 100%;
  }

  .peer-nav-link {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: var(--color-base-200);
    transition: all 0.2s ease;
    text-decoration: none;
    max-width: 48%;
  }

  .peer-nav-link:hover {
    background-color: var(--color-base-300);
  }

  .peer-nav-prev {
    align-items: flex-start;
  }

  .peer-nav-next {
    align-items: flex-end;
    margin-left: auto;
  }

  .peer-nav-label {
    font-size: 0.875rem;
    color: var(--color-base-content);
    opacity: 0.7;
    margin-bottom: 0.25rem;
  }

  .peer-nav-title {
    font-weight: 600;
    color: var(--color-base-content);
  }
</style>
