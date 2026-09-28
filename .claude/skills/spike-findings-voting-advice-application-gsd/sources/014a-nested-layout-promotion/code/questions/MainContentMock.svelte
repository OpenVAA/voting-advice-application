<!--
  Spike 014a — MainContent stand-in
  Mirrors the production MainContent.svelte shape (title slot, hero snippet,
  heading snippet, children, primaryActions). Instrumented so we can prove
  it stays mounted across Q→Q.
-->
<script lang="ts">
  import { trackMount } from '../../nav-forensics/mountLedger.svelte';
  import type { Snippet } from 'svelte';

  let {
    title,
    hero,
    heading,
    children,
    primaryActions
  }: {
    title: string;
    hero?: Snippet;
    heading?: Snippet;
    children?: Snippet;
    primaryActions?: Snippet;
  } = $props();

  const ledger = trackMount('PromotedMainContent');
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<div class="main-content" data-mount-id={ledger.instanceId}>
  {#if hero}
    <div class="hero-slot">
      {@render hero()}
    </div>
  {/if}

  <div class="title-block">
    {#if heading}
      {@render heading()}
    {:else}
      <h1>{title}</h1>
    {/if}
  </div>

  {#if children}
    <div class="body">
      {@render children()}
    </div>
  {/if}

  {#if primaryActions}
    <div class="actions">
      {@render primaryActions()}
    </div>
  {/if}
</div>

<style>
  .main-content {
    border: 2px solid #f59e0b;
    padding: 1rem;
    background: #fffbeb;
  }
  .hero-slot {
    background: #fef3c7;
    padding: 0.5rem;
    text-align: center;
    margin-bottom: 0.5rem;
  }
  .title-block {
    text-align: center;
    margin-bottom: 0.8rem;
  }
  .title-block :global(h1) {
    margin: 0;
    color: #b45309;
  }
  .body {
    margin-bottom: 0.8rem;
  }
  .actions {
    border-top: 1px dashed #d97706;
    padding-top: 0.6rem;
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }
</style>
