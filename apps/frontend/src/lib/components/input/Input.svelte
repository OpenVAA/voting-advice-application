<!--
@component
Display any data input, its associated label and possible info. The HTML element used to for the input is defined by the `type` property.

The input itself is wrapped in multiple container elements, the outermost of which can be passed the `containerProps` prop.

Multilingual features are only available if the `locales` store contains more than one locale.Button

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
- `containerProps`: Any additional props to be passed to the container element of the input.
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
- `multilingualInfo`: Additional info displayed below the input for multilingual input together with possible `info`. @default t('components.input.multilingualInfo')
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
  import { isEmptyValue } from '@openvaa/core';
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
  import type { Id } from '@openvaa/core';
  import type { AnyChoice, Image } from '@openvaa/data';
  import type { TranslationsPayload } from '$lib/i18n/translations';
  import type { TranslationKey } from '$types';
  import type { InputProps } from './Input.type';

  let {
    type,
    label,
    containerProps,
    id = getUUID(),
    info,
    locked,
    required,
    value = $bindable(),
    onShadedBg,
    onChange,
    placeholder,
    options,
    ordered,
    disabled,
    maxFilesize = 20 * 1024 * 1024,
    multilingualInfo,
    ...restProps
  }: InputProps = $props();

  // const SAVE_INTERVAL_MS = 1000;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { locale: currentLocale, locales, t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Handling multilinguality, disabled and other cases
  ////////////////////////////////////////////////////////////////////

  const maxFilesizeInMB = $derived(Math.floor((maxFilesize ?? 0) / (1024 * 1024)));
  const multilingual = $derived(type.endsWith('-multilingual'));
  /** Whether the label is above the field or inside it */
  const isLabelOutside = $derived(multilingual || type.startsWith('textarea'));

  /*** Extend info — derived so the prop isn't mutated. */
  const effectiveMultilingualInfo = $derived(
    multilingual && locales.length > 1 && multilingualInfo != ''
      ? (multilingualInfo ?? t('components.input.multilingualInfo'))
      : ''
  );
  const effectiveInfo = $derived.by(() => {
    let result = info ?? '';
    if (effectiveMultilingualInfo) result += ` ${effectiveMultilingualInfo}`;
    if (type === 'image') {
      result += ` ${t('components.input.imageInfo', { maxFilesize: maxFilesizeInMB })}`;
    }
    return result || undefined;
  });

  let error: string | undefined = $state(undefined);
  let isDisabled = $derived(!!(disabled || locked));
  /** For image input */
  let isLoading = $state(false);
  let isTranslationsVisible = $state(false);
  let showRequired = $derived(!!required && isEmptyValue(value));

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
  let selectedOptions = $state(new Array<AnyChoice>());
  let unselectedOptions = $state(new Array<AnyChoice>());
  $effect(() => {
    if (type === 'select-multiple' && options) {
      // If the values can be ordered, we maintain their order in the options array
      selectedOptions = ordered
        ? (value as Array<Id>).map((v) => options.find((o) => o.id === v)!) // We can be sure all ids are valid bc we checked it above
        : options.filter((o) => (value as Array<Id>).includes(o.id));
      unselectedOptions = options.filter((o) => !selectedOptions.includes(o));
    }
  });

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
      value = typeof value === 'string' ? { [currentLocale]: value } : {};
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
  function getImageUrl(value: InputProps['value']): string {
    return value && typeof value === 'object' && 'url' in value ? (value as Image).url : '';
  }

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

  // bind: migrate — `mainInputs` must be $state in Svelte 5 because
  // `bind:this={mainInputs[i]}` mutates a property on it. A plain array
  // triggers `binding_property_non_reactive`. Mirrors the Phase 64 fix
  // at QuestionChoices.svelte:122-124.
  const mainInputs: Array<HTMLElement> = $state([]);
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
    error = t(key, payload);
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
<!-- a11y note: every <label> in this file uses an `id` referenced by an
     `aria-labelledby` on the actual <input>/<textarea>/<select>. The
     a11y_label_has_associated_control rule fires because the label
     doesn't use `for=""`, but the WCAG association is still satisfied
     via aria-labelledby. The svelte-ignore comments below are
     intentional. -->
<div
  {...concatClass(containerProps ?? {}, 'w-full flex flex-col items-stretch')}
  style:--inputBgColor={onShadedBg ? 'var(--color-base-100)' : 'var(--color-base-300)'}>
  <!-- The label in small caps above the input -->
  {#if isLabelOutside}
    <div class="{outsideLabelClass} me-8 flex flex-row items-center justify-between">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label id="{id}-label">{label}</label>
      {#if showRequired}
        <div class="required-badge"><Icon name="required" /><span>{t('common.required')}</span></div>
      {/if}
      {#if locked}
        <div class="locked-badge"><Icon name="locked" /><span>{t('common.locked')}</span></div>
      {/if}
    </div>
  {/if}

  <!-- 1. Multilingual text inputs and textareas -->
  {#if multilingual}
    <div class="join join-vertical items-stretch {joinGap}">
      <!-- Show the field for the current locale and for all others, if translations are visible -->
      {#each [currentLocale, ...locales.filter((l) => l !== currentLocale)] as locale, i}
        {#if locale === currentLocale || isTranslationsVisible}
          {#if type === 'textarea-multilingual'}
            <div class="relative flex flex-col items-stretch">
              <!-- The language label inside the field -->
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <label
                id="{id}-label-{locale}"
                class="small-label left-md top-sm text-secondary absolute transition-opacity"
                class:opacity-0={!isTranslationsVisible}>{t(assertTranslationKey(`lang.${locale}`))}</label>
              <!-- The actual textarea
                   NB. Join does not work it, so we do it by hand -->
              <!-- bind: keep — Pattern 1 ($state target for bind:this; mainInputs is $state([]) per declaration above) -->
              <textarea
                bind:this={mainInputs[i]}
                id="{id}-{locale}"
                aria-labelledby="{id}-label {id}-label-{locale}"
                {placeholder}
                disabled={isDisabled}
                rows="4"
                {...concatClass(restProps, `${textareaClass} transition-[padding]`)}
                class:pt-24={isTranslationsVisible}
                class:rounded-t-none={isTranslationsVisible && i > 0}
                class:rounded-b-none={isTranslationsVisible && i !== locales.length - 1}
                onchange={(e) => handleChange(e, locale)}
                value={getLocalizedValue(locale)}></textarea>
            </div>
          {:else if type === 'text-multilingual'}
            <div class="{inputContainerClass} join-item">
              <!-- The language label inside the field -->
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <label
                id="{id}-label-{locale}"
                class="{inputLabelClass} transition-opacity"
                class:opacity-0={!isTranslationsVisible}>{t(assertTranslationKey(`lang.${locale}`))}</label>
              <div class={inputAndIconContainerClass}>
                <!-- The actual text input -->
                <!-- bind: keep — Pattern 1 ($state target for bind:this; mainInputs is $state([]) per declaration above) -->
                <input
                  bind:this={mainInputs[i]}
                  type="text"
                  id="{id}-{locale}"
                  aria-labelledby="{id}-label {id}-label-{locale}"
                  {placeholder}
                  disabled={isDisabled}
                  {...concatClass(restProps, inputClass)}
                  onchange={(e) => handleChange(e, locale)}
                  value={getLocalizedValue(locale)} />
              </div>
            </div>
          {:else}
            <ErrorMessage inline message={t('error.general')} />
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
        {...concatClass(restProps, `${textareaClass} vaa-group-join-item`)}
        onchange={handleChange}
        value={`${value}`}></textarea>
    </div>

    <!-- 3. Select multiple -->
  {:else if type === 'select-multiple'}
    <div class="join join-vertical items-stretch {joinGap}">
      <div class="{inputContainerClass} join-item">
        <label class={inputLabelClass} for={id}>{label}</label>
        <div class={inputAndIconContainerClass}>
          {#if options?.length}
            <!-- bind: keep — Pattern 1 ($state target for bind:this; mainInputs is $state([]) per declaration above) -->
            <select
              bind:this={mainInputs[0]}
              {id}
              disabled={isDisabled}
              {...concatClass(restProps, selectClass)}
              onchange={handleChange}>
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
              <button type="button" title={buttonLabel} onclick={() => handleDeleteOption(option.id)}>
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
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label id="{id}-label" class={inputLabelClass}>{label}</label>
      <div class={inputAndIconContainerClass}>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions a11y_label_has_associated_control -->
        <label
          id="{id}-image-label"
          tabindex="0"
          class="text-primary flex h-60 justify-stretch"
          class:cursor-pointer={!isDisabled}
          onclick={() => fileInput?.click()}
          onkeydown={handleFileInputLabelKeydown}>
          {#if isLoading}
            <Loading inline />
          {:else if url}
            <div class="flex w-60 items-center justify-center overflow-hidden {locked ? 'mr-8' : '-mr-8'}">
              <img src={url} alt={label} class="h-full w-full object-cover" class:rounded-r-lg={!locked} />
            </div>
            <span class="sr-only">{t('components.input.changeImage')}</span>
          {:else if !isDisabled}
            <div class="gap-sm flex items-center">
              {t('components.input.addImage')}
              <Icon name="photo" />
            </div>
          {:else}
            <div class="text-secondary me-8 flex items-center">
              {t('components.input.noImage')}
            </div>
          {/if}
        </label>
        <!-- bind: keep — fileInput is $state(); single ref read in event handlers -->
        <input
          bind:this={fileInput}
          type="file"
          {id}
          aria-labelledby="{id}-label {id}-image-label"
          disabled={isDisabled}
          class="hidden"
          onchange={handleChange}
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
            {...concatClass(restProps, 'toggle toggle-primary mr-md')}
            checked={!!value}
            onchange={handleChange} />

          <!-- 5.2 Select -->
        {:else if type === 'select'}
          {#if options?.length}
            <select {id} disabled={isDisabled} {...concatClass(restProps, selectClass)} onchange={handleChange}>
              <option disabled selected={!value}>{placeholder || t('components.input.selectOne')}</option>
              {#each options as { id, label }}
                <option value={id} selected={value === id}>
                  {label}
                </option>
              {/each}
            </select>
          {:else}
            <ErrorMessage message={t('error.general')} />
          {/if}

          <!-- 5.3 All other inputs: date, number, text -->
        {:else}
          <input
            {type}
            {id}
            disabled={isDisabled}
            {placeholder}
            {...concatClass(restProps, inputClass)}
            {value}
            onchange={handleChange} />
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
  {/if}

  <!-- Error messages -->

  {#if error}
    <ErrorMessage inline message={error} class="my-sm text-center" />
  {/if}

  <!-- Optional elements below the form widgets -->

  {#if (multilingual && locales.length > 1) || effectiveInfo}
    <!-- If both info and the multilingual button are shown, they're arranged side by side -->
    <div class="gap-md flex {multilingual && effectiveInfo ? 'flex-row items-start' : 'flex-col'}">
      {#if effectiveInfo}
        <!-- pt-4 aligns the info more nicely with the multilingual button -->
        <div class="{infoClass} {multilingual ? 'pt-4' : ''} grow">{effectiveInfo}</div>
      {/if}
      {#if multilingual && locales.length > 1}
        <Button
          text={isTranslationsVisible ? t('components.input.hideTranslations') : t('components.input.showTranslations')}
          icon={isTranslationsVisible ? 'hide' : 'language'}
          class="!w-auto"
          onclick={handleToggleTranslations} />
      {/if}
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
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
