<!--
@component The image file input `Input` renders for its `image` kind: a hidden file input, a button that opens the file dialog, and a preview of the current image.

Internal to the `input` package — not exported from its barrel. See `./README.md`.

### Properties
See `ImagePart.type.ts`.

### Callbacks
- `onChange`: triggered when a file is chosen, with the originating change event.
-->

<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import { Loading } from '$lib/components/loading';
  import { getComponentContext } from '$lib/contexts/component';
  import { iconBadgeClass, inputAndIconContainerClass, inputContainerClass, inputLabelClass } from '../shared';
  import type { Image } from '@openvaa/data';
  import type { ImagePartProps } from './ImagePart.type';

  let { id, label, value, isLoading, disabled, locked, showRequired, onChange }: ImagePartProps = $props();

  const { t } = getComponentContext();

  /**
   * Gets the url of the image.
   */
  function getImageUrl(value: unknown): string {
    return value && typeof value === 'object' && 'url' in value ? (value as Image).url : '';
  }

  const url = $derived(getImageUrl(value));

  ////////////////////////////////////////////////////////////////////
  // Keyboard navigation
  ////////////////////////////////////////////////////////////////////

  /** The input is hidden and triggered when the image preview or custom button is pressed */
  let fileInput: HTMLInputElement | undefined = $state();

  /**
   * Open the file dialog when the label or image label when `Space` or `Enter` is pressed.
   */
  function handleFileInputLabelKeydown(event: KeyboardEvent): void {
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    event.preventDefault(); // Prevent default behavior (e.g., scrolling the page)
    fileInput?.click();
  }
</script>

<div class="{inputContainerClass} vaa-group-join-item">
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label id="{id}-label" class={inputLabelClass}>{label}</label>
  <div class={inputAndIconContainerClass}>
    <button
      type="button"
      id="{id}-image-label"
      class="text-primary flex h-60 justify-stretch"
      class:cursor-pointer={!disabled}
      {disabled}
      onclick={() => fileInput?.click()}
      onkeydown={handleFileInputLabelKeydown}>
      {#if isLoading}
        <Loading inline />
      {:else if url}
        <div class="flex w-60 items-center justify-center overflow-hidden {locked ? 'mr-8' : '-mr-8'}">
          <img src={url} alt={label} class="h-full w-full object-cover" class:rounded-r-lg={!locked} />
        </div>
        <span class="sr-only">{t('components.input.changeImage')}</span>
      {:else if !disabled}
        <div class="gap-sm flex items-center">
          {t('components.input.addImage')}
          <Icon name="photo" />
        </div>
      {:else}
        <div class="text-secondary me-8 flex items-center">
          {t('components.input.noImage')}
        </div>
      {/if}
    </button>
    <!-- bind: keep — fileInput is $state(); single ref read in event handlers -->
    <input
      bind:this={fileInput}
      type="file"
      {id}
      aria-labelledby="{id}-label {id}-image-label"
      {disabled}
      class="hidden"
      onchange={(e) => onChange?.(e)}
      accept="image/jpeg, image/png, image/gif" />
    {#if showRequired}
      <div class="required-badge">
        <Icon name="required" class={iconBadgeClass} /><span>{t('common.required')}</span>
      </div>
    {/if}
    {#if locked}
      <div class="locked-badge">
        <Icon name="locked" class={iconBadgeClass} /><span>{t('common.locked')}</span>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference "../../../../tailwind-theme.css";
  .locked-badge {
    @apply text-secondary;
  }
  .required-badge {
    @apply text-warning;
  }
  .locked-badge > span,
  .required-badge > span {
    @apply sr-only;
  }
</style>
