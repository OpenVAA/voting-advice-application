<!--
@component Display any data input, its associated label and possible info. The HTML element used to for the input is defined by the `type` property.

The input itself is wrapped in multiple container elements, the outermost of which can be passed the `containerProps` prop.

Multilingual features are only available if the `locales` store contains more than one locale.

### Properties

- `type`: The type of input element to use. This also defines the type of the `value` prop, which of the other properties are allowed or required, and the HTML element rendered.
  - `boolean`: A boolean toggle.
  - `color`: A colour as a hex code: a text field for the code, and the platform colour picker over a round swatch. The value is lowercase `#rrggbb` or nothing; an entry that is not a hex colour stays in the field, shows an error and leaves the value as it was.
  - `date`: A date input.
  - `image`: An image file input.
  - `multiple-text`: A row list of plain text inputs, one per value.
  - `multiple-text-multilingual`: A row list whose every row is a multilingual text input.
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
- `autocomplete`: The `autocomplete` token of the control, for an input that collects a value the browser can fill in, such as the user's own name. @default undefined
- `required`: If `true`, a badge will be displayed next to the input when its value is empty, and the control of a kind that renders one control is marked `aria-required`. @default false
- `requiredLocale`: The locale whose entry must not be blank, for the `text-multilingual` and `textarea-multilingual` kinds. On a `required` input, `required` is then judged on that entry instead of on the whole value, that locale's field is shown even while the translations are hidden, and the required language is named in the info line. A locale that is not a supported one is ignored. @default undefined
- `value`: Bindable: the value of the input. Depends on the `type` prop.
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default false
- `options`: The options to show for a `select` or `select-multiple` input.
- `ordered`: If `true`, enables ordering of the values of a `select-multiple` input. @default false
- `minItems`: The minimum number of rows for a `multiple-text` input. @default 1
- `maxItems`: The maximum number of rows for a `multiple-text` input.
- `maxFilesize`: The maximum file size for `image` inputs. @default `20 * 1024**2` (20MB)
- `multilingualInfo`: Additional info displayed below the input for multilingual input together with possible `info`. @default t('components.input.multilingualInfo')
- Any valid attributes of the HTML element (`input`, `select` or `textarea`) used for the input, except in the case of `image` whose input is hidden.

### Accessibility

- The info line has the id `{id}-info` and the inline error the id `{id}-error`. Every control of the input names the ones that are rendered in its `aria-describedby`, after any `aria-describedby` the caller passed.
- The inline error has `role="alert"`, and the control is `aria-invalid` while it is shown.
- Each locale's field of a multilingual kind, and its language label, carries `lang`.

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
  import { isLocalizedString, log } from '@openvaa/app-shared';
  import { isEmptyValue } from '@openvaa/core';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { assertTranslationKey } from '$lib/i18n/utils';
  import { parseColorString } from '$lib/utils/color/parseColorString';
  import { rgbToHex } from '$lib/utils/color/rgbToHex';
  import { concatClass, getUUID } from '$lib/utils/components';
  import { checkUrl } from '$lib/utils/links';
  import { missingRequiredLocale } from '$lib/utils/localizedText';
  import ImagePart from './parts/ImagePart.svelte';
  import MultilingualTextPart from './parts/MultilingualTextPart.svelte';
  import MultipleTextPart from './parts/MultipleTextPart.svelte';
  import SelectMultiplePart from './parts/SelectMultiplePart.svelte';
  import {
    iconBadgeClass,
    infoClass,
    inputAndIconContainerClass,
    inputClass,
    inputContainerClass,
    inputLabelClass,
    outsideLabelClass,
    selectClass,
    textareaClass
  } from './shared';
  import type { Id } from '@openvaa/core';
  import type { AnyChoice } from '@openvaa/data';
  import type { TranslationsPayload } from '$lib/i18n/types';
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
    requiredLocale,
    value = $bindable(),
    onShadedBg,
    onChange,
    placeholder,
    options,
    ordered,
    disabled,
    maxFilesize = 20 * 1024 * 1024,
    multilingualInfo,
    minItems,
    maxItems,
    'aria-describedby': callerDescribedBy,
    ...restProps
  }: InputProps = $props();

  // reason: pragmatic regex catches obvious typos; server-side does final validation. The 3 disjoint [^\s@]+ groups have no nested quantifiers, so this regex is ReDoS-safe by construction.
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // const SAVE_INTERVAL_MS = 1000;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // `locale` here is the plain-string locale of ComponentContext, not the AppContext rune handle.
  const ctx = getComponentContext();
  const { locales, t } = ctx;
  const currentLocale = ctx.locale;

  ////////////////////////////////////////////////////////////////////
  // Handling multilinguality, disabled and other cases
  ////////////////////////////////////////////////////////////////////

  const maxFilesizeInMB = $derived(Math.floor((maxFilesize ?? 0) / (1024 * 1024)));
  const multilingual = $derived(type.endsWith('-multilingual'));
  /** Whether the multi-text row list is rendered instead of a single field. */
  const isMultipleText = $derived(type.startsWith('multiple-text'));
  /** Whether the label is above the field or inside it */
  const isLabelOutside = $derived(multilingual || isMultipleText || type.startsWith('textarea'));

  /** The locale the `required` rule is judged on, when the per-locale rule is in effect: a `required` input of a multilingual text kind whose `requiredLocale` is a supported locale. */
  const effectiveRequiredLocale = $derived(
    required && multilingual && !isMultipleText && requiredLocale && locales.includes(requiredLocale)
      ? requiredLocale
      : undefined
  );

  /*** Extend info — derived so the prop isn't mutated. */
  const effectiveMultilingualInfo = $derived(
    multilingual && locales.length > 1 && multilingualInfo != ''
      ? (multilingualInfo ?? t('components.input.multilingualInfo'))
      : ''
  );
  const requiredLocaleInfo = $derived(
    effectiveRequiredLocale && locales.length > 1
      ? t('components.input.requiredLocaleInfo', {
          language: t(assertTranslationKey(`lang.${effectiveRequiredLocale}`))
        })
      : ''
  );
  const effectiveInfo = $derived.by(() => {
    let result = info ?? '';
    if (effectiveMultilingualInfo) result += ` ${effectiveMultilingualInfo}`;
    if (requiredLocaleInfo) result += ` ${requiredLocaleInfo}`;
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
  let showRequired = $derived(
    effectiveRequiredLocale
      ? !!required && missingRequiredLocale(value as LocalizedString | null | undefined, effectiveRequiredLocale)
      : !!required && isEmptyValue(value)
  );

  /** The ids of what is rendered under the field, after any description the caller passed. */
  const describedBy = $derived(
    [callerDescribedBy, effectiveInfo ? `${id}-info` : undefined, error ? `${id}-error` : undefined]
      .filter(Boolean)
      .join(' ') || undefined
  );
  /** What the control of a kind that renders exactly one carries: its description, its error state and whether it is required. */
  const controlAria = $derived({
    'aria-describedby': describedBy,
    'aria-invalid': error ? ('true' as const) : undefined,
    'aria-required': required ? ('true' as const) : undefined
  });

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
      // Compute into a local first so the effect never reads the `selectedOptions` state it also writes — reading + writing the same state inside an effect creates a self-invalidating cycle (effect_update_depth_exceeded).
      const selected = ordered
        ? (value as Array<Id>).map((v) => options.find((o) => o.id === v)!) // We can be sure all ids are valid bc we checked it above
        : options.filter((o) => (value as Array<Id>).includes(o.id));
      selectedOptions = selected;
      unselectedOptions = options.filter((o) => !selected.includes(o));
    }
  });

  /**
   * Ensure that the value is valid for the given type.
   */
  function ensureValue(): void {
    // Empty string values
    if (type === 'text' || type === 'textarea' || type === 'url' || type === 'email') {
      value ??= '';
    }
    // Multi-text values are collections; the row list pads them to its own floor.
    if (isMultipleText) {
      if (!Array.isArray(value)) value = [];
      return;
    }
    // Initialize the value for an empty `LocalizedString`
    if (multilingual && !isLocalizedString(value)) {
      value = typeof value === 'string' ? { [currentLocale]: value } : {};
    }
    // Ensure `select` values are present in the options
    if (type.startsWith('select') && options) {
      if (type === 'select-multiple') {
        if (!Array.isArray(value)) value = [];
        // Narrowed by hand: `Array.isArray` cannot tell the union's two array-valued kinds apart, and this branch is reached only for `select-multiple`.
        else value = (value as Array<Id>).filter((v) => options.some((o) => o.id === v));
      } else {
        if (!value || !options.some((o) => o.id === value)) value = undefined;
      }
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Keyboard navigation
  ////////////////////////////////////////////////////////////////////

  /** The rendered part that holds the field focus returns to. Undefined for the kinds that render no such part. */
  let focusablePart: MultilingualTextPart | MultipleTextPart | SelectMultiplePart | undefined = $state();

  /**
   * Return focus to the main input after a multilingual item has been expanded or an option has been deleted in select-multiple.
   */
  function refocus(): void {
    focusablePart?.focus();
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
      else log.debug('Multilingual handleChange called without locale!');

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
    } else if (type === 'email') {
      // Only update the value if it's an empty string or a valid email
      const currentValue = currentTarget.value.trim();
      if (currentValue === '') {
        value = '';
      } else {
        if (!EMAIL_REGEX.test(currentValue)) return handleError('components.input.error.invalidEmail');
        value = currentValue;
      }

      // Number — coerce the DOM string value to a real JS number (or undefined when cleared).
    } else if (type === 'number' && currentTarget instanceof HTMLInputElement) {
      // `valueAsNumber` is NaN for an empty or non-numeric field — map that to a cleared value.
      const numericValue = currentTarget.valueAsNumber;
      value = Number.isNaN(numericValue) ? undefined : numericValue;

      // All other types
    } else {
      value = currentTarget.value;
    }
    error = undefined;
    onChange?.(value);
  }

  /**
   * Called by the multi-text row list, which owns its own rows and emits the whole collection.
   */
  function handleMultipleTextChange(next: Array<string> | Array<LocalizedString>): void {
    value = next;
    error = undefined;
    onChange?.(value);
  }

  ////////////////////////////////////////////////////////////////////
  // The colour kind
  ////////////////////////////////////////////////////////////////////

  /** A typed colour: three or six hexadecimal digits, with or without the leading `#`. Narrower than `parseColorString`, which also reads functional notation. */
  const TYPED_COLOR_REGEX = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
  /** The one form in which a colour is emitted and painted. */
  const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/;
  /** Where the platform picker opens when there is no colour. */
  const COLOR_PICKER_START = '#808080';

  /** The text of the hex field while it holds an entry that was refused. */
  let refusedColorText: string | undefined = $state();
  /** The committed colour as lowercase `#rrggbb`, or `undefined` when there is none or the value is not a colour. The swatch is painted from this alone. */
  const committedColor = $derived(type === 'color' && typeof value === 'string' ? toHexColor(value) : undefined);

  /**
   * Called when the hex field is committed. An entry that is not a hex colour stays in the field and changes neither the value nor the swatch.
   */
  function handleColorTextChange({ currentTarget }: { currentTarget: HTMLInputElement }): void {
    const text = currentTarget.value.trim();
    const color = TYPED_COLOR_REGEX.test(text) ? toHexColor(text) : undefined;
    if (text !== '' && !color) {
      refusedColorText = currentTarget.value;
      return handleError('components.input.error.invalidColor');
    }
    // Written by hand: the field's bound expression does not change when the committed colour is entered again in another form.
    currentTarget.value = color ?? '';
    commitColor(color);
  }

  /**
   * Called when a colour is chosen in the platform picker.
   */
  function handleColorPick({ currentTarget }: { currentTarget: HTMLInputElement }): void {
    const color = toHexColor(currentTarget.value);
    if (color) commitColor(color);
  }

  function commitColor(color: string | undefined): void {
    value = color;
    refusedColorText = undefined;
    error = undefined;
    onChange?.(value);
  }

  /**
   * Normalise a colour to lowercase `#rrggbb`.
   * @returns The colour, or `undefined` when `color` is not one.
   */
  function toHexColor(color: string): string | undefined {
    const rgb = parseColorString(color);
    const hex = rgb ? rgbToHex(rgb) : undefined;
    return hex && HEX_COLOR_REGEX.test(hex) ? hex : undefined;
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
  //   onMount(() => { saveInterval = setInterval(() => { // Handle value changes }, SAVE_INTERVAL_MS); }); onDestroy(() => clearInterval(saveInterval)); };
</script>

<!-- Add containerProps to the outer container and set styles for it -->
<!-- a11y note: every <label> in this file uses an `id` referenced by an
     `aria-labelledby` on the actual <input>/<textarea>/<select>. The a11y_label_has_associated_control rule fires because the label doesn't use `for=""`, but the WCAG association is still satisfied via aria-labelledby. The svelte-ignore comments below are
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
        <div class="text-warning"><Icon name="required" /><span class="sr-only">{t('common.required')}</span></div>
      {/if}
      {#if locked}
        <div class="text-secondary"><Icon name="locked" /><span class="sr-only">{t('common.locked')}</span></div>
      {/if}
    </div>
  {/if}

  <!-- 1. The multi-text row list -->
  {#if isMultipleText}
    <MultipleTextPart
      bind:this={focusablePart}
      {id}
      value={value as Array<string> | Array<LocalizedString> | null | undefined}
      {multilingual}
      {isTranslationsVisible}
      disabled={isDisabled}
      {minItems}
      {maxItems}
      {describedBy}
      onChange={handleMultipleTextChange} />

    <!-- 2. Multilingual text inputs and textareas -->
  {:else if multilingual}
    <MultilingualTextPart
      bind:this={focusablePart}
      {id}
      type={type as 'text-multilingual' | 'textarea-multilingual'}
      {value}
      {placeholder}
      disabled={isDisabled}
      {isTranslationsVisible}
      requiredLocale={effectiveRequiredLocale}
      {describedBy}
      {restProps}
      onChange={handleChange} />

    <!-- 3. Single-language textareas -->
  {:else if type === 'textarea'}
    <div class="relative flex flex-col items-stretch">
      <!-- The actual textarea -->
      <textarea
        {id}
        aria-labelledby="{id}-label"
        {...controlAria}
        {placeholder}
        disabled={isDisabled}
        rows="4"
        {...concatClass(restProps, `${textareaClass} vaa-group-join-item`)}
        onchange={handleChange}
        value={`${value}`}></textarea>
    </div>

    <!-- 4. Select multiple -->
  {:else if type === 'select-multiple'}
    <SelectMultiplePart
      bind:this={focusablePart}
      {id}
      {label}
      {placeholder}
      disabled={isDisabled}
      {locked}
      {showRequired}
      {required}
      {describedBy}
      {options}
      {selectedOptions}
      {unselectedOptions}
      {restProps}
      onChange={handleChange}
      onDeleteOption={handleDeleteOption} />

    <!-- 5. Image input -->
  {:else if type === 'image'}
    <ImagePart
      {id}
      {label}
      {value}
      {isLoading}
      disabled={isDisabled}
      {locked}
      {showRequired}
      {describedBy}
      invalid={!!error}
      onChange={handleChange} />

    <!-- 6. Other single-row inputs -->
  {:else}
    <div class="{inputContainerClass} vaa-group-join-item">
      <label id={type === 'color' ? `${id}-label` : undefined} class={inputLabelClass} for={id}>{label}</label>
      <div class={inputAndIconContainerClass}>
        <!-- 6.1 Boolean -->
        {#if type === 'boolean'}
          <input
            type="checkbox"
            {id}
            {...controlAria}
            disabled={isDisabled}
            {placeholder}
            {...concatClass(restProps, 'toggle toggle-primary mr-md')}
            checked={!!value}
            onchange={handleChange} />

          <!-- 6.2 Select -->
        {:else if type === 'select'}
          {#if options?.length}
            <select
              {id}
              {...controlAria}
              disabled={isDisabled}
              {...concatClass(restProps, selectClass)}
              onchange={handleChange}>
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

          <!-- 6.3 Colour: a hex text field, and the platform picker laid over a decorative swatch -->
        {:else if type === 'color'}
          {#if isDisabled && !committedColor}
            <div class="text-secondary me-8 flex items-center">{t('components.input.noColor')}</div>
          {:else}
            <input
              type="text"
              {id}
              {...controlAria}
              disabled={isDisabled}
              maxlength="7"
              spellcheck="false"
              autocapitalize="off"
              autocomplete="off"
              {...concatClass(restProps, inputClass)}
              value={refusedColorText ?? committedColor ?? ''}
              onchange={handleColorTextChange} />
            <!-- The picker is transparent, so its wrapper shows the focus ring -->
            <span
              class="min-h-touch min-w-touch relative flex items-center justify-center rounded-full focus-within:ring focus-within:ring-offset-2">
              <span
                aria-hidden="true"
                class="border-md border-secondary h-24 w-24 rounded-full"
                class:border-dashed={!committedColor}
                style:background-color={committedColor}></span>
              <input
                type="color"
                id="{id}-picker"
                aria-labelledby="{id}-label {id}-picker-label"
                disabled={isDisabled}
                class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                value={committedColor ?? COLOR_PICKER_START}
                onchange={handleColorPick} />
              <span id="{id}-picker-label" class="sr-only">{t('components.input.colorPicker')}</span>
            </span>
          {/if}

          <!-- 6.4 All other inputs: date, number, text -->
        {:else}
          <input
            {type}
            {id}
            {...controlAria}
            disabled={isDisabled}
            {placeholder}
            {...concatClass(restProps, inputClass)}
            {value}
            onchange={handleChange} />
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
  {/if}

  <!-- Error messages -->

  {#if error}
    <ErrorMessage
      inline
      message={error}
      id="{id}-error"
      role="alert"
      data-testid="input-error"
      class="my-sm text-center" />
  {/if}

  <!-- Optional elements below the form widgets -->

  {#if (multilingual && locales.length > 1) || effectiveInfo}
    <!-- If both info and the multilingual button are shown, they're arranged side by side -->
    <div class="gap-md flex {multilingual && effectiveInfo ? 'flex-row items-start' : 'flex-col'}">
      {#if effectiveInfo}
        <!-- pt-4 aligns the info more nicely with the multilingual button -->
        <div id="{id}-info" class="{infoClass} {multilingual ? 'pt-4' : ''} grow">{effectiveInfo}</div>
      {/if}
      {#if multilingual && locales.length > 1}
        <Button
          data-testid="multilingual-toggle"
          text={isTranslationsVisible ? t('components.input.hideTranslations') : t('components.input.showTranslations')}
          icon={isTranslationsVisible ? 'hide' : 'language'}
          class="!w-auto"
          onclick={handleToggleTranslations} />
      {/if}
    </div>
  {/if}
</div>
