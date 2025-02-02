<!--
@component
Display any data input, its associated label and possible info. The HTML element used to for the input is defined by the `type` property.

The input itself is wrapped in multiple container elements, the outermost of which can be passed the `containerProps` prop.

### Properties

- `type`: The type of input element to use. This also defines the type of the `value` prop, which of the other properties are allowed or required, and the HTML element rendered.
  - `boolean`: A boolean toggle.render
  - `date`: A date input.
  - `image`: An image file input.
  - `number`: A numeric input.
  - `select`: A select dropdown.
  - `select-multiple`: A select dropdown from which multiple options can be selected. See also the `ordered` prop.
  - `text`: A single-line text input.
  - `text-multilingual`: A multilingual single-line text input.
  - `textarea`: A multi-line text input.
  - `textarea-multilingual`: A multilingual multi-line text input.
- `label`:  The label to show for the input or group of inputs if `multilingual`.
- `containerProps`: Any additional props to be passed to the container element of the input. @default {}
- `id`: The id of the input. If not provided, a unique id will be generated.
- `info`: Additional info displayed below the input.
- `disabled`: Works the same way as a normal `input`'s `disabled` attribute.
- `locked`: If `locked` the input will be disabled and a lock icon is displayed.
- `value`: Bindable: the value of the input. Depends on the `type` prop.
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default false
- `options`: The options to show for a `select` or `select-multiple` input.
- `ordered`: If `true`, enables ordering of the values of a `select-multiple` input. @default false
- Any valid attributes of the HTML element (`input`, `select` or `textarea`) used for the input.

### Callbacks

- `onChange`: Event handler triggered when the value changes with the new `value`.

### Usage

```tsx
<Input type="text" label="Name" placeholder="Enter your name" onChange={(v) => console.info(v)} />

<Input type="select-multiple" label="Favourite colours" ordered value={['c3', 'c1']} options={[
    { id: 'c1', label: 'Red' },
    { id: 'c2', label: 'Blue' },
    { id: 'c3', label: 'Green' },
  ]}
  onChange={(v) => console.info(v)}
  info="Select any number of colours in the order you prefer them." />
```
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Icon } from '$lib/components/icon';
  import { Loading } from '$lib/components/loading';
  import { getComponentContext } from '$lib/contexts/component';
  import { assertTranslationKey, isTranslation } from '$lib/i18n/utils';
  import { concatClass, getUUID } from '$lib/utils/components';
  import { logDebugError } from '$lib/utils/logger';
  import type { Id } from '@openvaa/core';
  import type { AnyChoice, Image } from '@openvaa/data';
  import type { InputProps } from './Input.type';

  type $$Props = InputProps;

  export let type: $$Props['type'];
  export let label: $$Props['label'];
  // export let variant: $$Props['variant'] = 'default';
  export let containerProps: $$Props['containerProps'] = undefined;
  export let id: $$Props['id'] = getUUID();
  export let info: $$Props['info'] = undefined;
  export let locked: $$Props['locked'] = undefined;
  export let value: $$Props['value'] = undefined;
  export let onShadedBg: $$Props['onShadedBg'] = undefined;
  export let onChange: ((value: $$Props['value']) => void) | undefined = undefined;
  export let placeholder: $$Props['placeholder'] = undefined;
  export let options: $$Props['options'] = undefined;
  export let ordered: $$Props['ordered'] = undefined;
  export let disabled: $$Props['disabled'] = undefined;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { locale: currentLocale, locales, t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Handling multlinguality, disabled and other cases
  ////////////////////////////////////////////////////////////////////

  const multilingual = type.endsWith('-multilingual');
  /** Whether the label is above the field or inside it */
  const isLabelOutside = multilingual || type.startsWith('textarea');

  // Switches
  let isDisabled: boolean;
  /** For image input */
  let isLoading = false;
  let isTranslationsVisible = false;
  $: isDisabled = !!(disabled || locked);

  function handleToggleTranslations(): void {
    isTranslationsVisible = !isTranslationsVisible;
    if (isTranslationsVisible) refocus();
  }

  ////////////////////////////////////////////////////////////////////
  // Value initialization and handling in special cases
  ////////////////////////////////////////////////////////////////////

  if (type === 'text' || type === 'textarea') {
    value ??= '';
  }

  // Initialize the value for an empty `LocalizedString`
  if (multilingual && !isTranslation(value)) {
    value = typeof value === 'string' ? { [$currentLocale]: value } : {};
  }

  // Ensure `select` values are present in the options
  if (type.startsWith('select') && options) {
    if (type === 'select-multiple') {
      if (!Array.isArray(value)) value = [];
      else value = value.filter((v) => options.some((o) => o.id === v));
    } else {
      if (!value || !options.some((o) => o.id === value)) value = undefined;
    }
  }

  // For easier handling of selected options when multiple can be selected
  let selectedOptions = new Array<AnyChoice>();
  let unselectedOptions = new Array<AnyChoice>();
  $: if (type === 'select-multiple' && options) {
    // If the values can be ordered, we maintain their order in the options array
    selectedOptions = ordered
      ? (value as Array<Id>).map((v) => options.find((o) => o.id === v)!) // We can be sure all ids are valid bc we checked it above
      : options.filter((o) => (value as Array<Id>).includes(o.id));
    unselectedOptions = options.filter((o) => !selectedOptions.includes(o));
  }

  /**
   * Gets the subvalue of `value` for `locale`. Used to ensure typing.
   */
  function getLocalizedValue(locale: string): string {
    return isTranslation(value) ? ((value as LocalizedString)[locale] ?? '') : '';
  }

  /**
   * Gets the url of the image.
   */
  function getImageUrl(value: $$Props['value']): string {
    return value && typeof value === 'object' && 'url' in value ? (value as Image).url : '';
  }

  ////////////////////////////////////////////////////////////////////
  // Keyboard navigation
  ////////////////////////////////////////////////////////////////////

  /** The input is hidden and triggered when the image preview or custom button is pressed */
  let fileInput: HTMLInputElement | undefined;

  /**
   * Open the file dialog when the label or image label when `Space` or `Enter` is pressed.
   */
  function handleFileInputLabelKeydown(event: KeyboardEvent): void {
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    event.preventDefault(); // Prevent default behavior (e.g., scrolling the page)
    fileInput?.click();
  }

  let mainInputs = new Array<HTMLElement>();
  /**
   * Return focus to the main input after a multilingual item has been expanded or an option has been deleted in select-multiple.
   */
  function refocus(): void {
    mainInputs[0]?.focus();
  }

  ////////////////////////////////////////////////////////////////////
  // Handle value updates
  ////////////////////////////////////////////////////////////////////

  /**
   * Called internally whenever an input's value changes.
   */
  async function handleChange(
    {
      currentTarget
    }: {
      currentTarget: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    },
    locale?: string
  ): Promise<void> {
    // We use strong assertions below, because we've already checked the validity of `options`, `value` etc. earlier

    // Any multilingual inputs
    if (multilingual) {
      if (locale) (value as LocalizedString)[locale] = currentTarget.value;
      else logDebugError('Multilingual handleChange called without locale!');

      // Boolean
    } else if (currentTarget instanceof HTMLInputElement && currentTarget.type === 'checkbox') {
      value = currentTarget.checked;

      // Select-multiple
    } else if (type === 'select-multiple') {
      if (!(currentTarget instanceof HTMLSelectElement)) return;
      // Reassign to trigger reactive update and possibly reorder
      const newValues = [...(value as Array<Id>), currentTarget.value];
      value = ordered
        ? newValues // Keep the same order in which the values've been selected
        : options!.filter((o) => newValues.includes(o.id)).map((o) => o.id); // Order based on the `options` array
      // Select the placeholder
      currentTarget.selectedIndex = 0;

      // Image
    } else if (currentTarget instanceof HTMLInputElement && currentTarget.type === 'file') {
      const file = currentTarget.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        isLoading = true;
        reader.onload = () => {
          value = reader.result ? { url: `${new URL(reader.result.toString())}` } : undefined;
          isLoading = false;
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    // All other types
    else {
      value = currentTarget.value;
    }
    onChange?.(value);
  }

  /**
   * Called when an option is deleted in `select-multiple`
   */
  function handleDeleteOption(id: Id): void {
    value = selectedOptions.filter((o) => o.id !== id).map((o) => o.id);
    refocus();
    onChange?.(value);
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  // TODO[Svelte 5]: Use snippets instead of these clunky class variables
  const inputContainerClass =
    'flex min-h-touch items-center justify-between gap-2 overflow-hidden rounded-lg bg-[var(--inputBgColor)]';
  const inputLabelClass = 'label-sm label pointer-events-none mx-md my-2 px-0 whitespace-nowrap text-secondary';
  const inputAndLockContainerClass = 'flex grow justify-end pr-8';
  const inputClass =
    'input input-sm input-ghost grow justify-end px-0 text-right disabled:border-none disabled:bg-[var(--inputBgColor)]';
  const lockClass = 'my-auto flex-shrink-0 text-secondary';
  const selectClass =
    'select select-sm grow text-end !bg-transparent disabled:border-none disabled:bg-[var(--inputBgColor)]';
  const textareaLockPosition = 'absolute bottom-sm right-md';
  const textareaClass =
    'textarea bg-[var(--inputBgColor)] resize-none px-md py-sm !outline-none disabled:bg-[var(--inputBgColor)]';
</script>

<!-- Add containarProps to the outer container and set styles for it -->
<div
  {...concatClass(containerProps ?? {}, 'w-full flex flex-col items-stretch')}
  style:--inputBgColor={onShadedBg ? 'oklch(var(--b1))' : 'oklch(var(--b3))'}>

  <!-- The label in small caps above the input -->
  {#if isLabelOutside}
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label id="{id}-label" class="small-label mx-md my-8">{label}</label>
  {/if}

  <!-- 1. Multilingual text inputs and textareas -->
  {#if multilingual}
    <div class="join join-vertical items-stretch gap-xs">
      <!-- Show the field for the current locale and for all others, if translations are visible -->
      {#each [$currentLocale, ...$locales.filter((l) => l !== $currentLocale)] as locale, i}
        {#if locale === $currentLocale || isTranslationsVisible}
          {#if type === 'textarea-multilingual'}
            <div class="relative flex flex-col items-stretch">
              <!-- The language label inside the field -->
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label id="{id}-label-{locale}" class="small-label absolute left-md top-sm text-secondary"
                >{$t(assertTranslationKey(`lang.${locale}`))}</label>
              <!-- The actual textarea 
                   NB. Join does not work it, so we do it by hand -->
              <textarea
                id="{id}-{locale}"
                aria-labelledby="{id}-label {id}-label-{locale}"
                {placeholder}
                disabled={isDisabled}
                class="{textareaClass} pt-24"
                class:rounded-t-none={isTranslationsVisible && i > 0}
                class:rounded-b-none={isTranslationsVisible && i !== $locales.length - 1}
                rows="4"
                bind:this={mainInputs[i]}
                on:change={(e) => handleChange(e, locale)}
                value={getLocalizedValue(locale)} />
              <!-- Possible lock icon, shown for each translation -->
              {#if locked}
                <div class={textareaLockPosition}>
                  <Icon name="locked" class={lockClass} />
                </div>
              {/if}
            </div>
          {:else if type === 'text-multilingual'}
            <div class="{inputContainerClass} join-item">
              <!-- The language label inside the field -->
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label id="{id}-label-{locale}" class={inputLabelClass}
                >{$t(assertTranslationKey(`lang.${locale}`))}</label>
              <div class={inputAndLockContainerClass}>
                <!-- The actual text input -->
                <input
                  type="text"
                  id="{id}-{locale}"
                  aria-labelledby="{id}-label {id}-label-{locale}"
                  {placeholder}
                  disabled={isDisabled}
                  class={inputClass}
                  bind:this={mainInputs[i]}
                  on:change={(e) => handleChange(e, locale)}
                  value={getLocalizedValue(locale)} />
                <!-- Possible lock icon, shown for each translation -->
                {#if locked}
                  <Icon name="locked" class={lockClass} />
                {/if}
              </div>
            </div>
          {:else}
            <ErrorMessage message={$t('error.general')} />
          {/if}
        {/if}
      {/each}
    </div>

    <!-- 2. Single-language textareas -->
  {:else if type === 'textarea'}
    <div class="relative flex flex-col items-stretch">
      <!-- The actual textarea -->
      <textarea
        {id}
        aria-labelledby="{id}-label"
        {placeholder}
        disabled={isDisabled}
        class={textareaClass}
        rows="4"
        on:change={handleChange}
        value={`${value}`} />
      <!-- Possible lock icon, shown for each translation -->
      {#if locked}
        <div class={textareaLockPosition}>
          <Icon name="locked" class={lockClass} />
        </div>
      {/if}
    </div>

    <!-- 3. Select multiple -->
  {:else if type === 'select-multiple'}
    <div class="join join-vertical items-stretch gap-xs">
      <div class="{inputContainerClass} join-item">
        <label class={inputLabelClass} for={id}>{label}</label>
        <div class={inputAndLockContainerClass}>
          {#if options?.length}
            <select {id} disabled={isDisabled} class={selectClass} bind:this={mainInputs[0]} on:change={handleChange}>
              <option disabled selected
                >{placeholder ||
                  (selectedOptions.length > 0
                    ? selectedOptions.length === options.length
                      ? $t('components.input.allSelected')
                      : $t('components.input.selectAnother')
                    : $t('components.input.selectFirst'))}</option>
              {#each unselectedOptions as option}
                <option value={option.id}>{option.label}</option>
              {/each}
            </select>
          {:else}
            <ErrorMessage message={$t('error.general')} />
          {/if}
        </div>
      </div>

      <!-- Selected options -->
      {#each selectedOptions as option}
        {@const buttonLabel = $t('components.input.deleteOption', { option: option.label })}
        <div class="{inputContainerClass} join-item !justify-end !bg-base-200">
          <span class={inputLabelClass}>{option.label}</span>
          <div class="{inputAndLockContainerClass} grow-0">
            {#if !locked}
              <button type="button" title={buttonLabel} on:click={() => handleDeleteOption(option.id)}>
                <span class="sr-only">{buttonLabel}, {label}</span>
                <Icon name="close" class={lockClass} />
              </button>
            {:else}
              <Icon name="locked" class={lockClass} />
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- 4. Image input -->
  {:else if type === 'image'}
    {@const url = getImageUrl(value)}
    <div class={inputContainerClass}>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label id="{id}-label" class={inputLabelClass}>{label}</label>
      <div class={inputAndLockContainerClass}>
        <!-- svelte-ignore a11y-no-noninteractive-tabindex a11y-no-noninteractive-element-interactions a11y-label-has-associated-control -->
        <label
          id="{id}-image-label"
          tabindex="0"
          class="flex h-60 justify-stretch text-primary"
          class:cursor-pointer={!isDisabled}
          on:keydown={handleFileInputLabelKeydown}>
          {#if isLoading}
            <Loading inline />
          {:else if url}
            <div class="flex w-60 items-center justify-center overflow-hidden {locked ? 'mr-8' : '-mr-8'}">
              <img src={url} alt={label} class="h-full w-full object-cover" class:rounded-r-lg={!locked} />
            </div>
            <span class="sr-only">{$t('components.input.changeImage')}</span>
          {:else if !isDisabled}
            <div class="flex items-center gap-sm">
              {$t('components.input.addImage')}
              <Icon name="photo" />
            </div>
          {:else}
            <div class="me-8 flex items-center text-secondary">
              {$t('components.input.noImage')}
            </div>
          {/if}
        </label>
        <input
          type="file"
          {id}
          aria-labelledby="{id}-label {id}-image-label"
          disabled={isDisabled}
          class="hidden"
          bind:this={fileInput}
          on:change={handleChange}
          accept="image/jpeg, image/png, image/gif" />
        {#if locked}
          <Icon name="locked" class={lockClass} />
        {/if}
      </div>
    </div>

    <!-- 5. Other single-row inputs -->
  {:else}
    <div class={inputContainerClass}>
      <label class={inputLabelClass} for={id}>{label}</label>
      <div class={inputAndLockContainerClass}>
        <!-- 5.1 Boolean -->
        {#if type === 'boolean'}
          <input
            type="checkbox"
            {id}
            disabled={isDisabled}
            class="toggle toggle-primary mr-md"
            {placeholder}
            checked={!!value}
            on:change={handleChange} />

          <!-- 5.2 Select -->
        {:else if type === 'select'}
          {#if options?.length}
            <select {id} disabled={isDisabled} class={selectClass} on:change={handleChange}>
              <option disabled selected={!value}>{placeholder || $t('components.input.selectOne')}</option>
              {#each options as { id, label }}
                <option value={id} selected={value === id}>
                  {label}
                </option>
              {/each}
            </select>
          {:else}
            <ErrorMessage message={$t('error.general')} />
          {/if}

          <!-- 5.3 All other inputs: date, number, text -->
        {:else}
          <input {type} {id} disabled={isDisabled} class={inputClass} {placeholder} {value} on:change={handleChange} />
        {/if}

        {#if locked}
          <Icon name="locked" class={lockClass} />
        {/if}
      </div>
    </div>
  {/if}

  <!-- Optional elements below the form widgets -->

  {#if info}
    <div class="m-md text-sm text-secondary">{info}</div>
  {/if}

  {#if multilingual}
    <Button
      text={isTranslationsVisible ? $t('components.input.hideTranslations') : $t('components.input.showTranslations')}
      icon={isTranslationsVisible ? 'hide' : 'language'}
      class="!w-auto self-end"
      on:click={handleToggleTranslations} />
  {/if}
</div>
