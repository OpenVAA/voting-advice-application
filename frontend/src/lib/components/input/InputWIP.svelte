<script lang="ts">
  import type {HTMLInputTypeAttribute} from 'svelte/elements';
  import {locale as currentLocale, locales, t} from '$lib/i18n';
  import {concatClass, getUUID} from '$lib/utils/components';
  import {Button} from '$lib/components/button';
  import {Icon} from '$lib/components/icon';
  import type {InputProps, Key} from './Input.type';

  type $$Props = InputProps;

  export let type: $$Props['type'];
  export let label: $$Props['label'];
  export let containerProps: $$Props['containerProps'] = undefined;
  export let id: $$Props['id'] = getUUID();
  export let info: $$Props['info'] = undefined;
  export let locked: $$Props['locked'] = undefined;
  export let value: $$Props['value'] = undefined;
  export let onChange: $$Props['onChange'] = undefined;
  export let placeholder: $$Props['placeholder'] = undefined;
  export let options: $$Props['options'] = undefined;
  export let ordered: $$Props['ordered'] = undefined;
  export let disabled: $$Props['disabled'] = undefined;

  const multilingual = type.endsWith('-multilingual');
  const multiple = type.endsWith('-multiple');
  const hasLabelOutside = multiple || type.startsWith('textarea');

  let inputType: HTMLInputTypeAttribute;
  switch (type) {
    case 'boolean':
      inputType = 'checkbox';
      break;
    case 'date':
      inputType = 'date';
      break;
    case 'number':
      inputType = 'number';
      break;
    default:
      inputType = 'text';
  }

  if (value && inputType === 'date') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      value = date.toISOString().split('T')[0];
    } else {
      // Invalid value, use an empty date
      value = '';
    }
  }
  if (!value && multilingual) {
    value = Object.fromEntries($locales.map((loc) => [loc, '']));
  }

  let isMultilingualVisible = false;
  let isDisabled: boolean;
  $: isDisabled = !!(disabled || locked);

  /**
   * Get a string value for display based on the type of `value` and possible `locale` if multilingual.
   */
  function getDisplayValue(value: $$Props['value'], locale?: string): string {
    locale ??= $currentLocale;
    // TODO: Return the value as string using the locale or the defaultLocale if multilingual
    if (multilingual) return value[locale] ?? '';
  }

  /**
   * Called internally whenever an input's value changes.
   */
  function handleChange(
    event: {
      currentTarget: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    },
    locale?: string
  ): void {
    // TODO: Update value here based on the event target's value and other options
    // TODO: Maybe add another argument to flag multilingual changes
    // TODO: For multilingual inputs, iterate over all the locale fields
    // TODO: For multiple selects add value to the values array
    if (multilingual) {
      if (locale) value[locale] = event.currentTarget.value;
    } else {
      value = event.currentTarget.value;
    }
    handleValueUpdate();
  }

  /**
   * Delete an option when multiple can be selected.
   */
  function deleteOption(key: Key): void {
    value = value.filter((v) => v !== key);
    handleValueUpdate();
  }

  /**
   * Called whenever the selected value changes due to any reason
   */
  function handleValueUpdate(): void {
    // TODO: Implement localStorage caching here
    if (onChange) onChange(value);
  }
</script>

<!-- Add containarProps to the outer container and set styles for it -->
<div {...concatClass(containerProps ?? {}, 'w-full')}>
  <!-- The label in small caps above the input -->
  {#if hasLabelOutside}
    <label class="small-label mx-8" for={id}>{label}</label>
  {/if}

  <!-- The block of fields -->

  {#if multilingual}
    <div class="relative bg-base-100">
      {#if isMultilingualVisible}
        <div class="m-md mb-0">
          <label for="{id}-{$currentLocale}" class="small-label"
            >{$t(`lang.${$currentLocale}`)}</label>
        </div>
      {/if}
      <div class="relative bg-base-100">
        <textarea
          id="{id}-{$currentLocale}"
          {placeholder}
          disabled={isDisabled}
          class="textarea w-full resize-none px-md py-6 !outline-none disabled:bg-base-100"
          on:change={(e) => handleChange(e, $currentLocale)}
          rows="4">{getDisplayValue(value, $currentLocale)}</textarea>
        {#if locked}
          <div class="absolute bottom-0 right-0 m-md">
            <Icon name="locked" class="my-auto flex-shrink-0 text-secondary" />
          </div>
        {/if}
      </div>
    </div>
    {#if isMultilingualVisible}
      {#each $locales.filter((loc) => loc !== $currentLocale) as locale}
        <div class="relative bg-base-100">
          <div class="m-md mb-0">
            <label for="{id}-{locale}" class="small-label">{$t(`lang.${locale}`)}</label>
          </div>
          <textarea
            id="{id}-{locale}"
            {placeholder}
            disabled={isDisabled}
            class="textarea w-full resize-none px-md py-6 !outline-none disabled:bg-base-100"
            on:change={(e) => handleChange(e, locale)}
            rows="4"
            bind:value={value[locale]} />
          {#if locked}
            <div class="absolute bottom-0 right-0 m-md">
              <Icon name="locked" class="my-auto flex-shrink-0 text-secondary" />
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  {/if}

  {#if type === 'boolean' || type === 'text' || type === 'number' || type === 'date'}
    <div
      class="my-6 flex h-full w-full items-center justify-between gap-2 overflow-hidden rounded-lg bg-base-100">
      <label
        class="label-sm label pointer-events-none mx-6 my-2 whitespace-nowrap text-secondary"
        for={id}>
        {label}
      </label>
      <div class="flex w-full justify-end pr-6">
        {#if type === 'boolean'}
          <input
            type="checkbox"
            {id}
            disabled={isDisabled}
            class="toggle toggle-primary"
            bind:checked={value}
            on:change={handleChange}
            {placeholder} />
        {:else if type === 'text'}
          <input
            type="text"
            disabled={isDisabled}
            {id}
            bind:value
            on:change={handleChange}
            {placeholder}
            class="input input-sm input-ghost flex w-full justify-end pr-2 text-right disabled:border-none disabled:bg-base-100" />
        {:else if type === 'number'}
          <input
            type="number"
            disabled={isDisabled}
            {id}
            bind:value
            on:change={handleChange}
            {placeholder}
            class="input input-sm input-ghost flex w-full justify-end pr-2 text-right disabled:border-none disabled:bg-base-100" />
        {:else if type === 'date'}
          <input
            type="date"
            disabled={isDisabled}
            {id}
            min="1800-01-01"
            max={new Date().toISOString().split('T')[0]}
            bind:value
            on:change={handleChange}
            {placeholder}
            class="input input-sm input-ghost flex w-full justify-end pr-2 text-right disabled:border-none disabled:bg-base-100" />
        {/if}
        {#if locked}
          <Icon name="locked" class="my-auto flex-shrink-0 text-secondary" />
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Optional elements below the form widgets -->

{#if info}
  <div class="mx-8 text-sm text-secondary">{info}</div>
{/if}

{#if multilingual}
  <Button
    text={isMultilingualVisible ? 'Hide translations' : 'Show translations'}
    icon="language"
    on:click={() => (isMultilingualVisible = !isMultilingualVisible)} />
{/if}

<style lang="postcss">
  .field {
    @apply flex h-full items-center justify-between gap-md bg-base-100 first-of-type:rounded-t-lg last-of-type:rounded-b-lg;
  }
  .field-vertical {
    @apply flex-col;
  }
</style>
