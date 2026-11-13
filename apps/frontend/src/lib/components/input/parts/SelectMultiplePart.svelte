<!--
@component The options dropdown and selected-chips region `Input` renders for its `select-multiple` kind. The dropdown offers only the not-yet-selected options; each selected one gets a row with a delete button.

The dropdown names `describedBy` in its `aria-describedby` and is marked `aria-required` when `required`.

Internal to the `input` package — not exported from its barrel. See `./README.md`.

### Properties
See `SelectMultiplePart.type.ts`.

### Callbacks
- `onChange`: triggered when an option is selected in the dropdown.
- `onDeleteOption`: triggered when a selected option's delete button is pressed.

### Bindable functions
- `focus`: Moves focus to the dropdown.
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
    required,
    describedBy,
    options,
    selectedOptions,
    unselectedOptions,
    restProps,
    onChange,
    onDeleteOption
  }: SelectMultiplePartProps = $props();

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Keyboard navigation
  ////////////////////////////////////////////////////////////////////

  /** The dropdown. Absent when there are no options to offer. */
  let dropdown: HTMLSelectElement | undefined = $state();

  /**
   * Move focus to the dropdown. Does nothing when it is not rendered.
   */
  export function focus(): void {
    dropdown?.focus();
  }
</script>

<div class="join join-vertical items-stretch {joinGap}">
  <div class="{inputContainerClass} join-item">
    <label class={inputLabelClass} for={id}>{label}</label>
    <div class={inputAndIconContainerClass}>
      {#if options?.length}
        <select
          {id}
          aria-describedby={describedBy}
          aria-required={required ? 'true' : undefined}
          {disabled}
          {...concatClass(restProps ?? {}, selectClass)}
          bind:this={dropdown}
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
        <div class="text-warning">
          <Icon name="required" class={iconBadgeClass} /><span class="sr-only">{t('common.required')}</span>
        </div>
      {/if}
      {#if locked}
        <div class="text-secondary">
          <Icon name="locked" class={iconBadgeClass} /><span class="sr-only">{t('common.locked')}</span>
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
