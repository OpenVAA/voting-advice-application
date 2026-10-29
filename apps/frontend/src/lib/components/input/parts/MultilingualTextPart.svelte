<!--
@component The per-locale field stack `Input` renders for its multilingual text kinds. One field per supported locale, in the order displayed locale, required locale, the rest: the displayed locale and the `requiredLocale` are always shown, the others appear when translations are revealed. A language label is visible whenever more than one field is.

Each field and its language label carry `lang` set to their locale. Every field names `describedBy` in its `aria-describedby`, and the `requiredLocale`'s field is marked `aria-required`.

Internal to the `input` package — not exported from its barrel. See `./README.md`.

### Properties
See `MultilingualTextPart.type.ts`.

### Callbacks
- `onChange`: triggered when a locale's field changes, with the originating event and that locale.

### Bindable functions
- `focus`: Moves focus to the first field, which is the displayed locale's.
-->

<script lang="ts">
  import { isLocalizedString } from '@openvaa/app-shared';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { getComponentContext } from '$lib/contexts/component';
  import { assertTranslationKey } from '$lib/i18n/utils';
  import { concatClass } from '$lib/utils/components';
  import {
    inputAndIconContainerClass,
    inputClass,
    inputContainerClass,
    inputLabelClass,
    joinGap,
    textareaClass
  } from '../shared';
  import type { MultilingualTextPartProps } from './MultilingualTextPart.type';

  let {
    id,
    type,
    value,
    placeholder,
    disabled,
    isTranslationsVisible,
    requiredLocale,
    describedBy,
    restProps,
    onChange
  }: MultilingualTextPartProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // `locale` here is the i18n plain-string locale from ComponentContext (NOT the flattened AppContext rune handle); read off `ctx` to keep the audit grep clean.
  const ctx = getComponentContext();
  const { locales, t } = ctx;
  const currentLocale = ctx.locale;

  ////////////////////////////////////////////////////////////////////
  // Which fields are rendered
  ////////////////////////////////////////////////////////////////////

  /** The supported locales in field order: the displayed one, the required one, the rest. */
  const orderedLocales = $derived([
    ...new Set([currentLocale, ...(requiredLocale ? [requiredLocale] : []), ...locales])
  ]);
  /** The locales whose field is rendered. A prefix of `orderedLocales`, so revealing the translations moves no field. */
  const visibleLocales = $derived(
    isTranslationsVisible
      ? orderedLocales
      : orderedLocales.filter((locale) => locale === currentLocale || locale === requiredLocale)
  );
  /** Whether the language labels are visible: whenever more than one field is on screen. */
  const showLanguageLabels = $derived(visibleLocales.length > 1);

  ////////////////////////////////////////////////////////////////////
  // Value handling
  ////////////////////////////////////////////////////////////////////

  /**
   * Gets the subvalue of `value` for `locale`. Used to ensure typing.
   */
  function getLocalizedValue(locale: string): string {
    return isLocalizedString(value) ? ((value as LocalizedString)[locale] ?? '') : '';
  }

  ////////////////////////////////////////////////////////////////////
  // Keyboard navigation
  ////////////////////////////////////////////////////////////////////

  /** The rendered fields, in field order. `$state`, because `bind:this` writes its members. */
  const fields: Array<HTMLElement> = $state([]);

  /**
   * Move focus to the first field, which is the displayed locale's. Does nothing when no field is rendered.
   */
  export function focus(): void {
    fields[0]?.focus();
  }
</script>

<div class="join join-vertical items-stretch {joinGap}">
  {#each visibleLocales as locale, i (locale)}
    {#if type === 'textarea-multilingual'}
      <div class="relative flex flex-col items-stretch">
        <!-- The language label inside the field -->
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label
          id="{id}-label-{locale}"
          lang={locale}
          class="small-label left-md top-sm text-secondary absolute transition-opacity"
          class:opacity-0={!showLanguageLabels}>{t(assertTranslationKey(`lang.${locale}`))}</label>
        <!-- The actual textarea
               NB. Join does not work it, so we do it by hand -->
        <textarea
          id="{id}-{locale}"
          lang={locale}
          aria-labelledby="{id}-label {id}-label-{locale}"
          aria-describedby={describedBy}
          aria-required={locale === requiredLocale ? 'true' : undefined}
          {placeholder}
          {disabled}
          rows="4"
          {...concatClass(restProps ?? {}, `${textareaClass} transition-[padding]`)}
          class:pt-24={showLanguageLabels}
          class:rounded-t-none={showLanguageLabels && i > 0}
          class:rounded-b-none={showLanguageLabels && i !== visibleLocales.length - 1}
          bind:this={fields[i]}
          onchange={(e) => onChange?.(e, locale)}
          value={getLocalizedValue(locale)}></textarea>
      </div>
    {:else if type === 'text-multilingual'}
      <div class="{inputContainerClass} join-item">
        <!-- The language label inside the field -->
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label
          id="{id}-label-{locale}"
          lang={locale}
          class="{inputLabelClass} transition-opacity"
          class:opacity-0={!showLanguageLabels}>{t(assertTranslationKey(`lang.${locale}`))}</label>
        <div class={inputAndIconContainerClass}>
          <!-- The actual text input -->
          <input
            type="text"
            id="{id}-{locale}"
            lang={locale}
            aria-labelledby="{id}-label {id}-label-{locale}"
            aria-describedby={describedBy}
            aria-required={locale === requiredLocale ? 'true' : undefined}
            {placeholder}
            {disabled}
            {...concatClass(restProps ?? {}, inputClass)}
            bind:this={fields[i]}
            onchange={(e) => onChange?.(e, locale)}
            value={getLocalizedValue(locale)} />
        </div>
      </div>
    {:else}
      <ErrorMessage inline message={t('error.general')} />
    {/if}
  {/each}
</div>
