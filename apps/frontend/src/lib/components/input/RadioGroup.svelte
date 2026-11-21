<!--
@component A group of radios that asks for one choice: a `<fieldset>` named by its `<legend>`, one `Radio` per option, each in a block of its own, and the group's error under the options. Content of the caller's can be shown under the chosen option, inside its block.

Nothing is chosen until the user chooses or the caller writes `selected`. Choosing an option clears the error.

### Properties

- `legend`: The text of the group's `<legend>`, which names the group.
- `name`: The name the group's radios share.
- `options`: The options, in the order they are shown, each a `value` and its `label`.
- `selected`: Bindable: The chosen option's value.
- `error`: Bindable: The message shown under the options while the group is in error. Cleared when an option is chosen.
- `option`: What is shown under the chosen option, inside that option's block. Rendered for the chosen option alone.
- `onchoose`: Called with the option's value each time the user chooses an option, after the error is cleared.
- `id`: The id of the fieldset. The error takes the id `<id>-error`. Default: a generated id
- `legendProps`: Any attributes of the `<legend>`. A `class` is merged with the legend's own classes.
- `optionProps`: Any attributes of an option's block, given per option.
- `radioProps`: Any further props of an option's `Radio`, given per option.
- `errorTestId`: The `data-testid` of the error.
- Any valid attributes of a `<fieldset>` element. A `class` is merged with the fieldset's own classes.

### Bindable functions

- `focusFirst`: Set focus to the first radio.

### Accessibility

- The group is a `<fieldset>` named by its `<legend>`, with native radios and no added role.
- The radios share one `name`, so the group is one tab stop, and the arrow keys move and choose.
- Content under the chosen option follows its radio in the document, so its first field is the next tab stop. Choosing an option moves no focus.
- Each radio is named by its option's text, through a label that covers the whole row.
- The error has `role="alert"` and is named as the fieldset's description, after whatever the caller named in `aria-describedby`.

### Usage

```tsx
<RadioGroup
  bind:this={typeGroup}
  bind:selected={selectedType}
  bind:error={typeError}
  legend={t('contestantApp.register.identityProvider.types.legend')}
  name="entityType"
  options={typeOptions} />
```
-->

<script lang="ts" generics="TValue extends string">
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { concatClass, getUUID } from '$lib/utils/components';
  import Radio from './Radio.svelte';
  import type { RadioGroupProps } from './RadioGroup.type';

  let {
    legend,
    name,
    options,
    selected = $bindable(),
    error = $bindable(),
    option,
    onchoose,
    id: idProp = undefined,
    legendProps = {},
    optionProps,
    radioProps,
    errorTestId,
    'aria-describedby': describedByProp = undefined,
    ...restProps
  }: RadioGroupProps<TValue> = $props();

  export function focusFirst(): void {
    fieldset?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
  }

  // Generated once, so that the id is the same on every read.
  const fallbackId = getUUID();
  const id = $derived(idProp ?? fallbackId);
  const errorId = $derived(`${id}-error`);

  let fieldset: HTMLFieldSetElement | undefined = $state();

  /** What describes the group: whatever the caller named, then the error while it is rendered. */
  const describedBy = $derived([describedByProp, error ? errorId : undefined].filter(Boolean).join(' ') || undefined);

  function handleChoose(value: TValue): void {
    error = undefined;
    onchoose?.(value);
  }
</script>

<fieldset
  bind:this={fieldset}
  {id}
  aria-describedby={describedBy}
  {...concatClass(restProps, 'flex w-full min-w-0 flex-col gap-md')}>
  <legend {...concatClass(legendProps, 'font-bold')}>{legend}</legend>
  {#each options as { value, label } (value)}
    <div {...optionProps?.(value)}>
      <Radio
        {...radioProps?.(value)}
        bind:group={selected}
        {name}
        {value}
        {label}
        onchange={() => handleChoose(value)} />
      {#if option && selected === value}
        {@render option(value)}
      {/if}
    </div>
  {/each}
  {#if error}
    <ErrorMessage inline message={error} id={errorId} role="alert" data-testid={errorTestId} />
  {/if}
</fieldset>
