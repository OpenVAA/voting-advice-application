<!--
@component The options dropdown and selected-chips region `Input` renders for its `select-multiple` kind. The dropdown offers only the not-yet-selected options; each selected one gets a row with a delete button.

Internal to the `input` package — not exported from its barrel. See `./README.md`.

### Properties
See `SelectMultiplePart.type.ts`.

### Callbacks
- `onChange`: triggered when an option is selected in the dropdown.
- `onDeleteOption`: triggered when a selected option's delete button is pressed.
-->

<script lang="ts">
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import {
    iconBadgeClass,
    inputAndIconContainerClass,
    inputContainerClass,
    inputLabelClass,
    joinGap,
    selectClass
  } from '../shared';
  import type { SelectMultiplePartProps } from './SelectMultiplePart.type';

  let {
    id,
    label,
    placeholder,
    disabled,
    locked,
    showRequired,
    options,
    selectedOptions,
    unselectedOptions,
    mainInputs,
    restProps,
    onChange,
    onDeleteOption
  }: SelectMultiplePartProps = $props();

  const { t } = getComponentContext();
</script>

<div class="join join-vertical items-stretch {joinGap}">
  <div class="{inputContainerClass} join-item">
    <label class={inputLabelClass} for={id}>{label}</label>
    <div class={inputAndIconContainerClass}>
      {#if options?.length}
        <!-- bind: keep — $state target for bind:this; mainInputs is $state([]) in the owning Input. -->
        <select
          {id}
          {disabled}
          {...concatClass(restProps ?? {}, selectClass)}
          bind:this={mainInputs[0]}
          onchange={(e) => onChange?.(e)}>
          <option disabled selected
            >{placeholder ||
              (selectedOptions.length > 0
                ? selectedOptions.length === options.length
                  ? t('components.input.allSelected')
                  : t('components.input.selectAnother')
                : t('components.input.selectFirst'))}</option>
          {#each unselectedOptions as option}
            <option value={option.id}>{option.label}</option>
          {/each}
        </select>
      {:else}
        <ErrorMessage inline message={t('error.general')} />
      {/if}
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

  <!-- Selected options -->
  {#each selectedOptions as option}
    {@const buttonLabel = t('components.input.deleteOption', { option: option.label })}
    <div class="{inputContainerClass} join-item !justify-end">
      <span class={inputLabelClass}>{option.label}</span>
      <div class="{inputAndIconContainerClass} grow-0">
        {#if !locked}
          <button type="button" title={buttonLabel} onclick={() => onDeleteOption?.(option.id)}>
            <span class="sr-only">{buttonLabel}, {label}</span>
            <Icon name="close" class={iconBadgeClass} />
          </button>
        {/if}
      </div>
    </div>
  {/each}
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
