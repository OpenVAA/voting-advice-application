<!--
@component
A row-list input for `MultipleTextQuestion`s (info questions): one plain text
input per value, with add / remove / reorder controls. Its value is an
`Array<string>` — opaque strings, no numeric coercion, no dedup.

Multilingual `multipleText` values are out of this phase's input scope: rows are
PLAIN text inputs bound to `Array<string>`.

### Behaviour
- Empty rows are dropped on save (`onChange`); duplicates are preserved; array
  order equals on-screen row order.
- `minItems > 1` renders that many rows initially and disables per-row removal
  below the floor (`max(minItems ?? 1, 1)`). Reorder is allowed even at the floor.
- `maxItems` reached → the Add button is disabled.

### Properties
See `MultipleTextInput.type.ts`.

### Callbacks
- `onChange`: triggered on every edit / add / remove / reorder with the filtered,
  order-preserving value array.

### Usage
```tsx
<MultipleTextInput label="Languages" value={['fi', 'sv']} minItems={1} maxItems={5}
  onChange={(v) => console.info(v)} />
```
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass, getUUID } from '$lib/utils/components';
  import { infoClass, outsideLabelClass } from './shared';
  import type { MultipleTextInputProps } from './MultipleTextInput.type';

  let {
    value,
    label,
    info,
    locked,
    id = getUUID(),
    minItems,
    maxItems,
    onShadedBg,
    onChange,
    ...restProps
  }: MultipleTextInputProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // State
  ////////////////////////////////////////////////////////////////////

  /** The minimum number of rows to render / keep. Never below 1. */
  const floor = $derived(Math.max(minItems ?? 1, 1));

  /**
   * Local rows array, initialized from the `value` prop and padded with empty
   * rows up to the floor. Non-reactive to later prop changes by design (the
   * value is edited in place here and emitted via `onChange`), mirroring the
   * `Input` "clone the initial value" convention.
   */
  let rows = $state<Array<string>>(initRows());

  function initRows(): Array<string> {
    const initial = Array.isArray(value) ? [...value] : [];
    // Pad to the floor: `minItems > 1` renders `minItems` rows initially.
    while (initial.length < Math.max(minItems ?? 1, 1)) initial.push('');
    return initial;
  }

  const isDisabled = $derived(!!locked);
  /** Add is disabled once the row count reaches `maxItems`. */
  const canAdd = $derived(maxItems == null || rows.length < maxItems);
  /** Removal is prevented below the floor. */
  const canRemove = $derived(rows.length > floor);

  ////////////////////////////////////////////////////////////////////
  // Value handling
  ////////////////////////////////////////////////////////////////////

  /**
   * Emit the current rows with empty rows dropped, order preserved, duplicates
   * kept (no dedup / Set). All-empty → `[]` (empty/absent answer). Values are
   * opaque strings — no numeric coercion.
   */
  function emit(): void {
    onChange?.(rows.filter((r) => r.trim() !== ''));
  }

  function handleInput(index: number, event: Event): void {
    rows[index] = (event.currentTarget as HTMLInputElement).value;
    emit();
  }

  function addRow(): void {
    if (isDisabled || !canAdd) return;
    rows = [...rows, ''];
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

<!-- a11y note: each row <input> is associated with the group <label> via
     `aria-labelledby`; the label uses an `id` rather than `for=` because it
     labels the whole group, not a single control. -->
<div
  {...concatClass(restProps, 'flex w-full flex-col items-stretch')}
  style:--inputBgColor={onShadedBg ? 'var(--color-base-100)' : 'var(--color-base-300)'}>
  <!-- Group label above the rows -->
  <div class="{outsideLabelClass} me-8 flex flex-row items-center justify-between">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label id="{id}-label">{label}</label>
    {#if locked}
      <div class="locked-badge"><Icon name="locked" /><span>{t('common.locked')}</span></div>
    {/if}
  </div>

  <!-- Row list -->
  <div class="flex flex-col gap-4">
    {#each rows as row, index (index)}
      <div class="flex items-center gap-2">
        <input
          type="text"
          data-testid="multiple-text-row"
          id="{id}-{index}"
          aria-labelledby="{id}-label"
          disabled={isDisabled}
          class={rowInputClass}
          value={row}
          oninput={(e) => handleInput(index, e)} />
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

  <!-- Info -->
  {#if info}
    <div class={infoClass}>{info}</div>
  {/if}
</div>

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  .locked-badge {
    @apply text-secondary;
  }
  .locked-badge > span {
    @apply sr-only;
  }
</style>
