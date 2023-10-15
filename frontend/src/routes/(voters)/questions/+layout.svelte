<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {LayoutServerData} from './$types';

  export let data: LayoutServerData;
</script>

{#if !data.questions.length}
  <p>{$_('error.noQuestions')}</p>
{:else}
  <slot />
{/if}
