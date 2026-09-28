<!--
@component The per-locale field stack `Input` renders for its multilingual text kinds. One field per supported locale: the displayed locale is always shown, the rest appear when translations are revealed.

Internal to the `input` package — not exported from its barrel. See `./README.md`.

### Properties
See `MultilingualTextPart.type.ts`.

### Callbacks
- `onChange`: triggered when a locale's field changes, with the originating event and that locale.
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
    mainInputs,
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
  // Value handling
  ////////////////////////////////////////////////////////////////////

  /**
   * Gets the subvalue of `value` for `locale`. Used to ensure typing.
   */
  function getLocalizedValue(locale: string): string {
    return isLocalizedString(value) ? ((value as LocalizedString)[locale] ?? '') : '';
  }
</script>

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
          <!-- bind: keep — $state target for bind:this; mainInputs is $state([]) in the owning Input. -->
          <textarea
            id="{id}-{locale}"
            aria-labelledby="{id}-label {id}-label-{locale}"
            {placeholder}
            {disabled}
            rows="4"
            {...concatClass(restProps ?? {}, `${textareaClass} transition-[padding]`)}
            class:pt-24={isTranslationsVisible}
            class:rounded-t-none={isTranslationsVisible && i > 0}
            class:rounded-b-none={isTranslationsVisible && i !== locales.length - 1}
            bind:this={mainInputs[i]}
            onchange={(e) => onChange?.(e, locale)}
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
            <!-- bind: keep — $state target for bind:this; mainInputs is $state([]) in the owning Input. -->
            <input
              type="text"
              id="{id}-{locale}"
              aria-labelledby="{id}-label {id}-label-{locale}"
              {placeholder}
              {disabled}
              {...concatClass(restProps ?? {}, inputClass)}
              bind:this={mainInputs[i]}
              onchange={(e) => onChange?.(e, locale)}
              value={getLocalizedValue(locale)} />
          </div>
        </div>
      {:else}
        <ErrorMessage inline message={t('error.general')} />
      {/if}
    {/if}
  {/each}
</div>
