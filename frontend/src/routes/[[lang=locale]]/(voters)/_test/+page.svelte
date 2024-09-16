<script lang="ts">
  import {getAppContext} from '$lib/_contexts/app';
  import {Loading} from '$lib/components/loading';
  import {BasicPage} from '$lib/templates/basicPage';
  import TestComponent from './TestComponent.svelte';

  const {dataRoot, locale} = getAppContext();
</script>

<BasicPage title="Test">
  {#if $dataRoot.elections}
    <h1>App Root</h1>
    <p>This page only has access to the App context</p>
    <TestComponent key="common.party.singular" />
    <h2>Choose Election</h2>
    <ol>
      {#each $dataRoot.elections as { id, name }}
        <li><a href="/{$locale}/_test/{id}">{name}</a></li>
      {/each}
    </ol>
  {:else}
    <Loading />
  {/if}
</BasicPage>
