<!--
@component A single-choice group whose options are entities, each shown as a compact `EntityCard`, with plain options before and after them: "none of these", "another one", and so on.

The component is given its options and knows nothing of what a choice means. It reads no entity that is not passed to it: an option exists only for an entry of `options`.

### Dynamic component

This is a dynamic component, because it renders the dynamic `EntityCard` component.

### Properties

- `legend`: The group's name, rendered as its legend.
- `options`: The options, rendered in the order given. Each has a `value`, unique within the group, a `name`, an optional `hint` and a `kind`:
  - `'entity'`: An option with an `entity`, an object of the data root, shown as its card.
  - `'none'`, `'other'`, `'unlisted'`: A plain option, shown as its name.
- `required`: Whether a choice is required. The group is then marked `aria-required`, and a badge is shown beside the legend until something is chosen. @default `false`
- `error`: The error line. Its presence puts the group in error.
- `emptyMessage`: A line shown under the legend while none of the options is an entity.
- `detail`: A snippet rendered directly under the chosen option's row, given that option.
- `onChange`: Called with the chosen option's `value` when the user chooses.
- Any valid attributes of a `<fieldset>` element.

### Bindable properties

- `selected`: The `value` of the chosen option, `undefined` while nothing is chosen.

### Accessibility

- The group is a `<fieldset>` with the role `radiogroup`, named by its legend. In error it is `aria-invalid` and described by its error line, which is an alert.
- The options are native radios that share one `name`, so the group is one tab stop, and the arrow keys move and choose. Choosing an option does not move focus.
- Each radio is named by its option's `name` alone, through a label that covers the whole row and so is the pointer target. The card and the visible name are hidden from assistive technology, and the card holds nothing focusable and takes no pointer events, so a press on it reaches the label. A hint describes its radio.
- The chosen option is told twice: by the radio's own mark and by the row's fill.
- Every option is a row of at least the touch target's height. There is no search, no paging and no inner scroll region.

### Usage

```tsx
<EntitySelector
  legend="Party"
  options={[
    { kind: 'none', value: 'none', name: 'No party' },
    ...parties.map((party) => ({ kind: 'entity', value: party.id, name: party.name, entity: party })),
    { kind: 'other', value: 'other', name: 'Another party' }
  ]}
  bind:selected
  required>
  {#snippet detail(option)}
    {#if option.kind === 'other'}
      <Input type="text" label="The party's name" bind:value={otherName} />
    {/if}
  {/snippet}
</EntitySelector>
```
-->

<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { EntityCard } from '$lib/dynamic-components/entityCard';
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { EntitySelectorProps } from './EntitySelector.type';

  let {
    legend,
    options,
    selected = $bindable(),
    required = false,
    error,
    emptyMessage,
    detail,
    onChange,
    'aria-describedby': describedBy,
    ...restProps
  }: EntitySelectorProps = $props();

  const { t } = getComponentContext();

  const id = getUUID();
  const legendId = `${id}-legend`;
  const errorId = `${id}-error`;

  const selectedOption = $derived(options.find((option) => option.value === selected));
  const hasEntityOption = $derived(options.some((option) => option.kind === 'entity'));
  /** The ids the group is described by: the caller's, then the error line while it is shown. */
  const describedByIds = $derived([describedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined);
</script>

<fieldset
  role="radiogroup"
  aria-labelledby={legendId}
  aria-required={required || undefined}
  aria-invalid={error ? 'true' : undefined}
  aria-describedby={describedByIds}
  data-testid="entity-selector"
  data-selected-kind={selectedOption?.kind ?? ''}
  {...concatClass(restProps, 'min-w-0')}>
  <legend id={legendId} class="small-info uc-first">
    {legend}
    {#if required && !selectedOption}
      <Icon name="required" class="text-warning" /><span class="sr-only">{t('common.required')}</span>
    {/if}
  </legend>
  {#if emptyMessage && !hasEntityOption}
    <p class="small-info mt-sm" data-testid="entity-selector-empty">{emptyMessage}</p>
  {/if}
  <div class="mt-sm gap-sm flex flex-col">
    {#each options as option, index (option.value)}
      {@const inputId = `${id}-option-${index}`}
      {@const hintId = `${inputId}-hint`}
      <div
        class="p-sm gap-md min-h-touch has-[:checked]:bg-base-200 relative flex items-center rounded-lg"
        data-testid="entity-selector-option"
        data-option-kind={option.kind}
        data-option-value={option.value}>
        <!-- bind: keep — two-way DOM radio group bind:group={selected}; selected is $bindable() -->
        <input
          type="radio"
          class="radio radio-primary shrink-0"
          id={inputId}
          name={id}
          value={option.value}
          bind:group={selected}
          aria-describedby={option.hint ? hintId : undefined}
          data-testid="entity-selector-option-input"
          onchange={() => onChange?.(option.value)} />
        <label for={inputId} class="absolute inset-0 cursor-pointer rounded-lg">
          <span class="sr-only">{option.name}</span>
        </label>
        <div class="min-w-0 grow">
          {#if option.kind === 'entity'}
            <!-- The card's own element is positioned, so it lies above the label: without pointer events a press on it reaches the label. -->
            <div aria-hidden="true" class="pointer-events-none">
              <EntityCard entity={option.entity} variant="subcard" headerOnly action={false} />
            </div>
          {:else}
            <span aria-hidden="true" class="[overflow-wrap:anywhere]">{option.name}</span>
          {/if}
          {#if option.hint}
            <p class="small-info mt-xs" id={hintId} data-testid="entity-selector-option-hint">{option.hint}</p>
          {/if}
        </div>
      </div>
      {#if detail && option.value === selected}
        {@render detail(option)}
      {/if}
    {/each}
  </div>
  {#if error}
    <p class="text-warning mt-sm" role="alert" id={errorId} data-testid="entity-selector-error">{error}</p>
  {/if}
</fieldset>
