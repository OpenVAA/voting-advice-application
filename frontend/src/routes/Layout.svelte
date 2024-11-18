<script lang="ts">
  import { t } from '$lib/i18n';
  import type { BasicPageProps } from '$lib/templates/basicPage';

  export let title: BasicPageProps['title'];
  export let noteClass: BasicPageProps['noteClass'] = 'text-secondary text-center max-w-xl';
  export let noteRole: BasicPageProps['noteRole'] = 'note';
  export let primaryActionsLabel: BasicPageProps['primaryActionsLabel'] = undefined;
  export let titleClass: BasicPageProps['titleClass'] = '';

  /** We use `videoHeight` and `videoWidth` as proxies to check for the presence of content in the `video` slot. Note that we cannot merely check if the slot is provided, because it might be empty. */
  // let videoHeight = 0;
  // let videoWidth = 0;
  // let hasVideo = videoWidth > 0 && videoHeight > 0;
</script>

<!-- Note -->
{#if $$slots.note}
  <div class={noteClass} role={noteRole}>
    <slot name="note" />
  </div>
{/if}

<div class="flex w-full flex-grow flex-col items-stretch justify-center sm:items-center">
  <!-- Video -->
  <!-- {#if $$slots.video}
    <div
      bind:clientHeight={videoHeight}
      bind:clientWidth={videoWidth}
      class="-ml-safelgl -mr-safelgr -mt-lg flex w-screen justify-center sm:w-full {hasVideo
        ? 'grow'
        : ''} sm:mt-[1.75rem] sm:grow-0">
      <slot name="video" />
    </div>
  {/if} -->

  <!-- Hero image -->
  <slot name="hero" />

  <!-- Title block -->
  <div class="w-full max-w-xl py-lg text-center {titleClass}">
    <slot name="heading">
      <h1>{title}</h1>
    </slot>
  </div>

  <!-- Main content -->
  <div class="flex w-full max-w-xl flex-col items-center">
    <slot />
  </div>
</div>

<!-- Main actions -->
{#if $$slots.primaryActions}
  <section
    class="flex w-full max-w-xl flex-col items-center justify-end"
    aria-label={primaryActionsLabel ?? $t('common.primaryActions')}>
    <slot name="primaryActions" />
  </section>
{/if}
