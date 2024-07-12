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
  const hasLabelOutside = multiple || type === 'textarea';

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

  let isMultilingualVisible = false;
  let isDisabled: boolean;
  $: isDisabled = !!(disabled || locked);

  /**
   * Get a string value for display based on the type of `value` and possible `locale` if multilingual.
   */
  function getDisplayValue(value: $$Props['value'], locale?: string): string {
    locale ??= $currentLocale;
    // TODO: Return the value as string using the locale or the defaultLocale if multilingual
  }

  /**
   * Called internally whenever an input's value changes.
   */
  function handleChange(event: {
    currentTarget: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  }): void {
    // TODO: Update value here based on the event target's value and other options
    // TODO: Maybe add another argument to flag multilingual changes
    // TODO: For multilingual inputs, iterate over all the locale fields
    // TODO: For multiple selects add value to the values array
    value = event.currentTarget.value;
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
<div {...concatClass(containerProps ?? {}, 'TODO')}>
  <!-- The label in small caps above the input -->
  {#if hasLabelOutside}
    <label class="label" for={id}>{label}</label>
  {/if}

  <!-- The block of fields -->
  <div class="flex flex-col gap-2">
    <!-- Pick the right type of form element -->
    {#if type === 'textarea'}
      <div class="field field-vertical">
        {#if isMultilingualVisible}
          <label class="small-label" for={id}>{$t(`lang.${$currentLocale}`)}</label>
        {/if}
        <textarea
          disabled={isDisabled}
          {...concatClass($$restProps, 'TODO')}
          {id}
          on:change={handleChange}>
          {getDisplayValue(value)}
        </textarea>
      </div>
      {#if isMultilingualVisible}
        {#each $locales.filter((l) => l !== $currentLocale) as locale}
          <div class="field field-vertical">
            <label class="small-label" for="{id}-{locale}">{$t(`lang.${locale}`)}</label>
            <textarea
              disabled={isDisabled}
              {...concatClass($$restProps, 'TODO')}
              id="{id}-{locale}"
              placeholder="—"
              on:change={handleChange}>
              {getDisplayValue(value, locale)}
            </textarea>
          </div>
        {/each}
      {/if}
    {:else if type === 'select'}
      {#if options}
        <div class="field">
          <label class="label" for={id}>
            {#if multiple}
              <!-- TODO: If all selected, show some other label -->
              {value.length === 0
                ? $t('candidateApp.basicInfo.selectFirst')
                : $t('candidateApp.basicInfo.addAnother')}
            {:else}
              {label}
            {/if}
          </label>
          {#if !(multiple && locked)}
            <select
              disabled={isDisabled}
              {...concatClass($$restProps, 'TODO')}
              {id}
              on:change={handleChange}>
              {#each options.filter((o) => !multiple || !value.includes(o.key)) as option}
                <option value={option.key}>{option.label}</option>
              {/each}
            </select>
          {/if}
          {#if locked}
            <Icon name="locked" text={$t('MISSING.locked')} />
          {/if}
        </div>

        {#if multiple}
          <!-- TODO: Enable ordering of options -->
          {#each value as selectedOption}
            <div class="field">
              <div>{selectedOption.label}</div>
              {#if !locked}
                <Button
                  icon="close"
                  text={$t('MISSING.removeThisOption')}
                  disabled={isDisabled}
                  on:click={() => deleteOption(selectedOption.key)} />
              {/if}
            </div>
          {/each}
        {/if}
      {:else}
        <!-- No options defined for select, display some kind of error -->
        <Error />
      {/if}
    {:else}
      <div class="field">
        {#if !hasLabelOutside}
          <label class="label" for={id}>{label}</label>
        {/if}
        <input
          {...concatClass($$restProps, 'TODO')}
          {id}
          disabled={isDisabled}
          type={inputType}
          value={getDisplayValue(value)}
          on:change={handleChange} />
        {#if locked}
          <Icon name="locked" text={$t('MISSING.locked')} />
        {/if}
      </div>
      {#if isMultilingualVisible}
        {#each $locales.filter((l) => l !== $currentLocale) as locale}
          <div class="field">
            <label class="label" for="{id}-{locale}">{$t(`lang.${locale}`)}</label>
            <input
              {...concatClass($$restProps, 'TODO')}
              id="{id}-{locale}"
              disabled={isDisabled}
              placeholder="—"
              value={getDisplayValue(value, locale)}
              on:change={handleChange} />
          </div>
        {/each}
      {/if}
    {/if}
  </div>

  <!-- Optional elements below the form widgets -->

  {#if info}
    <div class="text-sm">{info}</div>
  {/if}

  {#if multilingual}
    <Button
      text={isMultilingualVisible ? 'Hide translations' : 'Show translations'}
      icon="language"
      on:click={() => (isMultilingualVisible = !isMultilingualVisible)} />
  {/if}
</div>

<style lang="postcss">
  .field {
    @apply flex h-full items-center justify-between gap-md bg-base-100 first-of-type:rounded-t-lg last-of-type:rounded-b-lg;
  }
  .field-vertical {
    @apply flex-col;
  }
</style>
