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
- `required`: If `true`, a badge will be displayed next to the input when its value is empty. @default false
- `value`: Bindable: the value of the input. Depends on the `type` prop.
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default false
- `options`: The options to show for a `select` or `select-multiple` input.
- `ordered`: If `true`, enables ordering of the values of a `select-multiple` input. @default false
- `maxFilesize`: The maximum file size for `image` inputs. @default `20 * 1024**2` (20MB)
- `multilingualInfo`: Additional info displayed below the input for multilingual input together with possible `info`. @default $t('components.input.multilingualInfo')
- Any valid attributes of the HTML element (`input`, `select` or `textarea`) used for the input, except in the case of `image` whose input is hidden.

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
  import { isLocalizedString } from '@openvaa/app-shared';
  import { type Id, isEmptyValue } from '@openvaa/core';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Icon } from '$lib/components/icon';
  import { Loading } from '$lib/components/loading';
  import { getComponentContext } from '$lib/contexts/component';
  import { assertTranslationKey } from '$lib/i18n/utils';
  import { concatClass, getUUID } from '$lib/utils/components';
  import { checkUrl } from '$lib/utils/links';
  import { logDebugError } from '$lib/utils/logger';
  import { iconBadgeClass, infoClass, joinGap, outsideLabelClass } from './shared';
  import type { AnyChoice, Image } from '@openvaa/data';
  import type { TranslationsPayload } from '$lib/i18n/translations';
  import type { TranslationKey } from '$types';
  import type { InputProps } from './Input.type';

  type $$Props = InputProps;

  export let type: 'text' | 'email' | 'password' | 'url' | 'select' | 'textarea' | 'date' = 'text';
  export let label: $$Props['label'];
  // export let variant: $$Props['variant'] = 'default';
  export let containerProps: $$Props['containerProps'] = undefined;
  export let id: $$Props['id'] = getUUID();
  export let info: $$Props['info'] = undefined;
  export let locked: $$Props['locked'] = undefined;
  export let required: $$Props['required'] = undefined;
  export let value: $$Props['value'] = undefined;
  export let onShadedBg: $$Props['onShadedBg'] = undefined;
  export let onChange: ((value: $$Props['value']) => void) | undefined = undefined;
  export let placeholder: $$Props['placeholder'] = undefined;
  export let options: $$Props['options'] = undefined;
  export let ordered: $$Props['ordered'] = undefined;
  export let disabled: $$Props['disabled'] = undefined;
  export let maxFilesize: $$Props['maxFilesize'] = 20 * 1024 * 1024;
  export let multilingualInfo: $$Props['multilingualInfo'] = undefined;

  // const SAVE_INTERVAL_MS = 1000;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { locale: currentLocale, locales, t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Handling multilinguality, disabled and other cases
  ////////////////////////////////////////////////////////////////////

  const maxFilesizeInMB = Math.floor((maxFilesize ?? 0) / (1024 * 1024));
  const multilingual = type.endsWith('-multilingual');
  /** Whether the label is above the field or inside it */
  const isLabelOutside = multilingual || type.startsWith('textarea');

  /*** Extend info */
  if (multilingual && multilingualInfo != '') {
    multilingualInfo ??= $t('components.input.multilingualInfo');
    info ??= '';
    info += ` ${multilingualInfo}`;
  }
  if (type === 'image') {
    info ??= '';
    info += ` ${$t('components.input.imageInfo', { maxFilesize: maxFilesizeInMB })}`;
  }

  let error: string | undefined;
  let isDisabled: boolean;
  /** For image input */
  let isLoading = false;
  let isTranslationsVisible = false;
  let showRequired = false;
  $: isDisabled = !!(disabled || locked);

  function handleToggleTranslations(): void {
    isTranslationsVisible = !isTranslationsVisible;
    if (isTranslationsVisible) refocus();
  }

  ////////////////////////////////////////////////////////////////////
  // Value initialization and handling in special cases
  ////////////////////////////////////////////////////////////////////

  // Make a clone of the initial value to prevent modification of the original value
  if (typeof value === 'object' && value !== null) value = structuredClone(value);
  // Make sure the initial value is valid
  ensureValue();

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
   * Ensure that the value is valid for the given type.
   */
  function ensureValue(): void {
    // Empty string values
    if (type === 'text' || type === 'textarea' || type === 'url') {
      value ??= '';
    }
    // Initialize the value for an empty `LocalizedString`
    if (multilingual && !isLocalizedString(value)) {
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
  }

  /**
   * Gets the subvalue of `value` for `locale`. Used to ensure typing.
   */
  function getLocalizedValue(locale: string): string {
    return isLocalizedString(value) ? ((value as LocalizedString)[locale] ?? '') : '';
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
    ensureValue();
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
      if (!file || !file.type.startsWith('image/')) return handleError('components.input.error.invalidFile');
      if (maxFilesize && file.size > maxFilesize)
        return handleError('components.input.error.oversizeFile', { maxFilesize: maxFilesizeInMB });
      const reader = new FileReader();
      const success = await new Promise<boolean>((resolve) => {
        isLoading = true;
        reader.onload = () => {
          value = reader.result
            ? ({
                url: `${new URL(reader.result.toString())}`,
                file
              } as ImageWithFile)
            : undefined;
          isLoading = false;
          resolve(true);
        };
        reader.readAsDataURL(file);
      }).catch(() => false);
      if (!success) return handleError('components.input.error.fileLoadingError');
    } else if (type === 'url') {
      // Only update the value if it's an empty string or a valid URL
      const currentValue = currentTarget.value.replaceAll(/\s+/g, '');
      if (currentValue == '') {
        value = '';
      } else {
        const url = checkUrl(currentValue);
        if (url == null) return handleError('components.input.error.invalidUrl');
        value = url;
      }

      // All other types
    } else {
      value = currentTarget.value;
    }
    error = undefined;
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
  // Errors
  ////////////////////////////////////////////////////////////////////

  function handleError(key: TranslationKey, payload?: TranslationsPayload): void {
    error = $t(key, payload);
  }

  ////////////////////////////////////////////////////////////////////
  // Periodical onChange firing with textarea
  ////////////////////////////////////////////////////////////////////

  // TODO: Save focused element as the target, and call handleChange(target) periodically

  // let saveInterval: NodeJS.Timeout;

  // if (type.startsWith('textarea')) {
  //   onMount(() => {
  //     saveInterval = setInterval(() => {
  //       // Handle value changes
  //     }, SAVE_INTERVAL_MS);
  //   });
  //   onDestroy(() => clearInterval(saveInterval));
  // };

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  // Show required icon only if the input is empty
  $: showRequired = !!required && isEmptyValue(value);

  // TODO[Svelte 5]: Use snippets instead of these clunky class variables
  const inputContainerClass =
    'flex min-h-touch items-center justify-between gap-2 overflow-hidden rounded-lg bg-[var(--inputBgColor)]';
  const inputLabelClass = 'label-sm label pointer-events-none min-w-[4rem] mx-md my-2 px-0 text-secondary';
  const inputAndIconContainerClass = 'flex grow justify-end items-center pr-8';
  const inputClass =
    'input input-sm input-ghost grow justify-end px-0 text-end w-full disabled:border-none disabled:bg-[var(--inputBgColor)] disabled:text-neutral';
  const selectClass =
    'select select-sm grow text-end w-full !bg-transparent disabled:border-none disabled:bg-[var(--inputBgColor)]';
  const textareaClass =
    'textarea bg-[var(--inputBgColor)] resize-none px-md py-sm !outline-none disabled:bg-[var(--inputBgColor)] disabled:text-neutral';
</script>

<!-- Add containarProps to the outer container and set styles for it -->
<div
  {...concatClass(containerProps ?? {}, 'w-full flex flex-col items-stretch')}
  style:--inputBgColor={onShadedBg ? 'oklch(var(--b1))' : 'oklch(var(--b3))'}>
  <!-- The label in small caps above the input -->
  {#if isLabelOutside}
    <div class="{outsideLabelClass} me-8 flex flex-row items-center justify-between">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label id="{id}-label">{label}</label>
      {#if showRequired}
        <div class="required-badge"><Icon name="required" /><span>{$t('common.required')}</span></div>
      {/if}
      {#if locked}
        <div class="locked-badge"><Icon name="locked" /><span>{$t('common.locked')}</span></div>
      {/if}
    </div>
  {/if}

  <!-- 1. Multilingual text inputs and textareas -->
  {#if multilingual}
    <div class="join join-vertical items-stretch {joinGap}">
      <!-- Show the field for the current locale and for all others, if translations are visible -->
      {#each [$currentLocale, ...$locales.filter((l) => l !== $currentLocale)] as locale, i}
        {#if locale === $currentLocale || isTranslationsVisible}
          {#if type === 'textarea-multilingual'}
            <div class="relative flex flex-col items-stretch">
              <!-- The language label inside the field -->
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label
                id="{id}-label-{locale}"
                class="small-label absolute left-md top-sm text-secondary transition-opacity"
                class:opacity-0={!isTranslationsVisible}>{$t(assertTranslationKey(`lang.${locale}`))}</label>
              <!-- The actual textarea 
                   NB. Join does not work it, so we do it by hand -->
              <textarea
                id="{id}-{locale}"
                aria-labelledby="{id}-label {id}-label-{locale}"
                {placeholder}
                disabled={isDisabled}
                rows="4"
                {...concatClass($$restProps, `${textareaClass} transition-[padding]`)}
                class:pt-24={isTranslationsVisible}
                class:rounded-t-none={isTranslationsVisible && i > 0}
                class:rounded-b-none={isTranslationsVisible && i !== $locales.length - 1}
                bind:this={mainInputs[i]}
                on:change={(e) => handleChange(e, locale)}
                value={getLocalizedValue(locale)} />
            </div>
          {:else if type === 'text-multilingual'}
            <div class="{inputContainerClass} join-item">
              <!-- The language label inside the field -->
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label
                id="{id}-label-{locale}"
                class="{inputLabelClass} transition-opacity"
                class:opacity-0={!isTranslationsVisible}>{$t(assertTranslationKey(`lang.${locale}`))}</label>
              <div class={inputAndIconContainerClass}>
                <!-- The actual text input -->
                <input
                  type="text"
                  id="{id}-{locale}"
                  aria-labelledby="{id}-label {id}-label-{locale}"
                  {placeholder}
                  disabled={isDisabled}
                  {...concatClass($$restProps, inputClass)}
                  bind:this={mainInputs[i]}
                  on:change={(e) => handleChange(e, locale)}
                  value={getLocalizedValue(locale)} />
              </div>
            </div>
          {:else}
            <ErrorMessage inline message={$t('error.general')} />
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
        rows="4"
        {...concatClass($$restProps, `${textareaClass} vaa-group-join-item`)}
        on:change={handleChange}
        value={`${value}`} />
    </div>

    <!-- 3. Select multiple -->
  {:else if type === 'select-multiple'}
    <div class="join join-vertical items-stretch {joinGap}">
      <div class="{inputContainerClass} join-item">
        <label class={inputLabelClass} for={id}>{label}</label>
        <div class={inputAndIconContainerClass}>
          {#if options?.length}
            <select
              {id}
              disabled={isDisabled}
              {...concatClass($$restProps, selectClass)}
              bind:this={mainInputs[0]}
              on:change={handleChange}>
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
            <ErrorMessage inline message={$t('error.general')} />
          {/if}
          {#if showRequired}
            <div class="required-badge">
              <Icon name="required" class={iconBadgeClass} /><span>{$t('common.required')}</span>
            </div>
          {/if}
          {#if locked}
            <div class="locked-badge">
              <Icon name="locked" class={iconBadgeClass} /><span>{$t('common.locked')}</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Selected options -->
      {#each selectedOptions as option}
        {@const buttonLabel = $t('components.input.deleteOption', { option: option.label })}
        <div class="{inputContainerClass} join-item !justify-end">
          <span class={inputLabelClass}>{option.label}</span>
          <div class="{inputAndIconContainerClass} grow-0">
            {#if !locked}
              <button type="button" title={buttonLabel} on:click={() => handleDeleteOption(option.id)}>
                <span class="sr-only">{buttonLabel}, {label}</span>
                <Icon name="close" class={iconBadgeClass} />
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- 4. Image input -->
  {:else if type === 'image'}
    {@const url = getImageUrl(value)}
    <div class="{inputContainerClass} vaa-group-join-item">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label id="{id}-label" class={inputLabelClass}>{label}</label>
      <div class={inputAndIconContainerClass}>
        <!-- svelte-ignore a11y-no-noninteractive-tabindex a11y-no-noninteractive-element-interactions a11y-label-has-associated-control -->
        <label
          id="{id}-image-label"
          tabindex="0"
          class="flex h-60 justify-stretch text-primary"
          class:cursor-pointer={!isDisabled}
          on:click={() => fileInput?.click()}
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
        {#if showRequired}
          <div class="required-badge">
            <Icon name="required" class={iconBadgeClass} /><span>{$t('common.required')}</span>
          </div>
        {/if}
        {#if locked}
          <div class="locked-badge">
            <Icon name="locked" class={iconBadgeClass} /><span>{$t('common.locked')}</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- 5. Other single-row inputs -->
  {:else}
    <div class="{inputContainerClass} vaa-group-join-item">
      <label class={inputLabelClass} for={id}>{label}</label>
      <div class={inputAndIconContainerClass}>
        <!-- 5.1 Boolean -->
        {#if type === 'boolean'}
          <input
            type="checkbox"
            {id}
            disabled={isDisabled}
            {placeholder}
            {...concatClass($$restProps, 'toggle toggle-primary mr-md')}
            checked={!!value}
            on:change={handleChange} />

          <!-- 5.2 Select -->
        {:else if type === 'select'}
          {#if options?.length}
            <select {id} disabled={isDisabled} {...concatClass($$restProps, selectClass)} on:change={handleChange}>
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
          <input
            {type}
            {id}
            disabled={isDisabled}
            {placeholder}
            {...concatClass($$restProps, inputClass)}
            {value}
            on:change={handleChange} />
        {/if}

        {#if showRequired}
          <div class="required-badge">
            <Icon name="required" class={iconBadgeClass} /><span>{$t('common.required')}</span>
          </div>
        {/if}
        {#if locked}
          <div class="locked-badge">
            <Icon name="locked" class={iconBadgeClass} /><span>{$t('common.locked')}</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Error messages -->

  {#if error}
    <ErrorMessage inline message={error} class="my-sm text-center" />
  {/if}

  <!-- Optional elements below the form widgets -->

  {#if multilingual || info}
    <!-- If both info and the multilingual button are shown, they're arranged side by side -->
    <div class="flex gap-md {multilingual && info ? 'flex-row items-start' : 'flex-col'}">
      {#if info}
        <!-- pt-4 aligns the info more nicely with the multilingual button -->
        <div class="{infoClass} {multilingual ? 'pt-4' : ''} grow">{info}</div>
      {/if}
      {#if multilingual}
        <Button
          text={isTranslationsVisible
            ? $t('components.input.hideTranslations')
            : $t('components.input.showTranslations')}
          icon={isTranslationsVisible ? 'hide' : 'language'}
          class="!w-auto"
          on:click={handleToggleTranslations} />
      {/if}
    </div>
  {/if}
</div>

<style lang="postcss">
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
