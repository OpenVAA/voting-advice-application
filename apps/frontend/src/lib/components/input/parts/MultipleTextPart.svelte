<!--
@component The row list `Input` renders for its multi-text kinds: one text input per value, with add / remove / reorder controls. Absorbed from the former standalone `MultipleTextInput` component, which had no multilingual mode; each row now behaves much the same as a normal multilingual text item.

Internal to the `input` package — not exported from its barrel. See `./README.md`.

### Behaviour
- Empty rows are dropped on save (`onChange`); duplicates are preserved; array
  order equals on-screen row order.
- When `multilingual`, a row carries one text per locale and is dropped only when
  EVERY locale is empty, so a row written in a language the user is not currently viewing is never silently discarded. Emptiness is the same trim rule, applied per locale. Only the locales actually written are emitted.
- `minItems > 1` renders that many rows initially and disables per-row removal
  below the floor (`max(minItems ?? 1, 1)`). Reorder is allowed even at the floor.
- `maxItems` reached → the Add button is disabled.
- Values are opaque strings: no numeric coercion, no dedup, no sorting, no case
  folding, no Unicode normalization.

### Properties
See `MultipleTextPart.type.ts`.

### Callbacks
- `onChange`: triggered on every edit / add / remove / reorder with the filtered,
  order-preserving value array.
-->

<script lang="ts">
  import { isLocalizedString } from '@openvaa/app-shared';
  import { Button } from '$lib/components/button';
  import { getComponentContext } from '$lib/contexts/component';
  import { assertTranslationKey } from '$lib/i18n/utils';
  import { inputLabelClass } from '../shared';
  import type { MultipleTextPartProps } from './MultipleTextPart.type';

  let {
    value,
    id,
    multilingual,
    isTranslationsVisible,
    disabled,
    minItems,
    maxItems,
    mainInputs,
    onChange
  }: MultipleTextPartProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // `locale` here is the i18n plain-string locale from ComponentContext (NOT the flattened AppContext rune handle); read off `ctx` to keep the audit grep clean.
  const ctx = getComponentContext();
  const { locales, t } = ctx;
  const currentLocale = ctx.locale;

  /**
   * The key a non-multilingual row's single text is stored under. Rows are held in one uniform shape — a record keyed by locale — so that emptiness, ordering and emission are decided by ONE rule in both modes rather than by two that could drift apart. This key is internal and never emitted; the plain branch of `emit` unwraps it.
   */
  const PLAIN = '';

  /** The locales a row renders a field for, displayed locale first. A single plain field otherwise. */
  const fieldLocales = $derived(
    multilingual ? [currentLocale, ...locales.filter((l) => l !== currentLocale)] : [PLAIN]
  );

  ////////////////////////////////////////////////////////////////////
  // State
  ////////////////////////////////////////////////////////////////////

  /** The minimum number of rows to render / keep. Never below 1. */
  const floor = $derived(Math.max(minItems ?? 1, 1));

  /**
   * Local rows array, initialized from the `value` prop and padded with empty rows up to the floor. Non-reactive to later prop changes by design (the value is edited in place here and emitted via `onChange`), mirroring the `Input` "clone the initial value" convention.
   */
  let rows = $state<Array<Record<string, string>>>(initRows());

  function initRows(): Array<Record<string, string>> {
    const initial = (Array.isArray(value) ? value : []).map((row) => toRow(row));
    // Pad to the floor: `minItems > 1` renders `minItems` rows initially.
    while (initial.length < Math.max(minItems ?? 1, 1)) initial.push({});
    return initial;
  }

  /**
   * Read one authored row into the uniform record shape. A plain string arriving in multilingual mode is read as the displayed locale's text — the same accommodation `Input` makes when a single-language multilingual kind receives a plain string, and what keeps answers written before this kind existed readable.
   */
  function toRow(row: string | LocalizedString): Record<string, string> {
    if (!multilingual) return { [PLAIN]: typeof row === 'string' ? row : '' };
    if (typeof row === 'string') return { [currentLocale]: row };
    return isLocalizedString(row) ? { ...row } : {};
  }

  const isDisabled = $derived(!!disabled);
  /** Add is disabled once the row count reaches `maxItems`. */
  const canAdd = $derived(maxItems == null || rows.length < maxItems);
  /** Removal is prevented below the floor. */
  const canRemove = $derived(rows.length > floor);

  ////////////////////////////////////////////////////////////////////
  // Value handling
  ////////////////////////////////////////////////////////////////////

  /**
   * Emit the current rows with empty rows dropped, order preserved, duplicates kept (no dedup / Set). All-empty → `[]` (empty/absent answer). Values are opaque strings — no numeric coercion. In multilingual mode a row survives when ANY locale is non-empty, and carries only the locales that are.
   */
  function emit(): void {
    if (!multilingual) {
      onChange?.(rows.map((row) => row[PLAIN] ?? '').filter((text) => text.trim() !== ''));
      return;
    }
    const next = new Array<LocalizedString>();
    for (const row of rows) {
      const localized: LocalizedString = {};
      for (const [locale, text] of Object.entries(row)) {
        if (text.trim() !== '') localized[locale] = text;
      }
      if (Object.keys(localized).length > 0) next.push(localized);
    }
    onChange?.(next);
  }

  /** The text currently shown in one row's field for `locale`. */
  function fieldValue(index: number, locale: string): string {
    return rows[index]?.[locale] ?? '';
  }

  function handleInput(index: number, locale: string, event: Event): void {
    rows[index][locale] = (event.currentTarget as HTMLInputElement).value;
    emit();
  }

  function addRow(): void {
    if (isDisabled || !canAdd) return;
    rows = [...rows, {}];
    emit();
  }

  function removeRow(index: number): void {
    if (isDisabled || !canRemove) return;
    rows = rows.filter((_, i) => i !== index);
    emit();
  }

  /** Swap a row with its previous sibling (reorder allowed even at the floor). */
  function moveUp(index: number): void {
    if (isDisabled || index <= 0) return;
    const next = [...rows];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    rows = next;
    emit();
  }

  /** Swap a row with its next sibling (reorder allowed even at the floor). */
  function moveDown(index: number): void {
    if (isDisabled || index >= rows.length - 1) return;
    const next = [...rows];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    rows = next;
    emit();
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  const rowInputClass =
    'input input-sm input-ghost grow bg-[var(--inputBgColor)] rounded-lg min-h-touch disabled:border-none disabled:bg-[var(--inputBgColor)] disabled:text-neutral';
</script>

<!-- a11y note: each row <input> is associated with the group <label> the owning
     `Input` renders, via `aria-labelledby`; that label uses an `id` rather than `for=` because it labels the whole group, not a single control. In multilingual mode each field additionally references its own language label,
     exactly as the single-language multilingual fields do. -->
<div class="flex flex-col gap-4">
  {#each rows as _row, index (index)}
    <div class="flex flex-col gap-2">
      {#each fieldLocales as locale, localeIndex}
        {#if !multilingual || locale === currentLocale || isTranslationsVisible}
          <div class="flex items-center gap-2">
            {#if multilingual}
              <!-- The language label beside the field -->
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <label
                id="{id}-label-{index}-{locale}"
                class="{inputLabelClass} transition-opacity"
                class:opacity-0={!isTranslationsVisible}>{t(assertTranslationKey(`lang.${locale}`))}</label>
            {/if}
            <!-- bind: keep — $state target for bind:this; mainInputs is $state([]) in the owning Input. -->
            <input
              type="text"
              data-testid="multiple-text-row"
              id={multilingual ? `${id}-${index}-${locale}` : `${id}-${index}`}
              aria-labelledby={multilingual ? `${id}-label ${id}-label-${index}-${locale}` : `${id}-label`}
              disabled={isDisabled}
              class={rowInputClass}
              bind:this={mainInputs[index * fieldLocales.length + localeIndex]}
              value={fieldValue(index, locale)}
              oninput={(e) => handleInput(index, locale, e)} />
            {#if localeIndex === 0}
              <div class="flex flex-shrink-0 items-center gap-2">
                <!-- Reorder: `collapse`/`expand` are the up/down chevrons
                     (expand_less / expand_more); vertical stack, buttons not drag. -->
                <Button
                  variant="icon"
                  icon="collapse"
                  text={t('components.multipleTextInput.moveUp')}
                  data-testid="multiple-text-move-up"
                  disabled={isDisabled || index === 0}
                  onclick={() => moveUp(index)} />
                <Button
                  variant="icon"
                  icon="expand"
                  text={t('components.multipleTextInput.moveDown')}
                  data-testid="multiple-text-move-down"
                  disabled={isDisabled || index === rows.length - 1}
                  onclick={() => moveDown(index)} />
                <Button
                  variant="icon"
                  icon="removeFromList"
                  color="warning"
                  text={t('components.multipleTextInput.remove')}
                  data-testid="multiple-text-remove"
                  disabled={isDisabled || !canRemove}
                  onclick={() => removeRow(index)} />
              </div>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  {/each}
</div>

<!-- Add row -->
{#if !isDisabled}
  <div class="mt-4">
    <Button
      variant="normal"
      icon="addToList"
      text={t('components.multipleTextInput.add')}
      data-testid="multiple-text-add"
      class="!w-auto"
      disabled={!canAdd}
      onclick={addRow} />
  </div>
{/if}
