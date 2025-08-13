<!--@component

# Select component with list autocomplete support

Displays a select input with optional autocomplete support.

If there’s only one option available, the selected value will be set automatically and a non-interactive 'input' will be displayed.

### Properties

- `label`: The `aria-label` and `placeholder` text for the select input.
- `options`: A list of selectable options. @default `[]`.
- `selected`: A bindable value for the `Id` of the selected option. @default `undefined` if multiple options are available, the first option if `options.length === 1`.
- `onChange`: A callback function triggered when the selection changes.
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default `false`
- `autocomplete`: Controls autocomplete behavior; supported values: `on` or `off`. @default `off`
- Any valid attributes of a `<select>` element (although when `autocomplete` is set to `on`, the props will be passed to a similarly styled `<input>` element).


### Accessiblity

In the `autocomplete` mode, the input can be controlled using the keyboard:

- Move between options using the `Up` and `Down` arrow keys. If `Shift` is pressed, the focus moves by 10. The focused option is scrolled into view and outlined.
- Select an option using the `Enter` key
- The focused option is automatically selected when defocusing the input by `Tab`
- Defocus without selecting with `Esc`

The component follows the [WGAI Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-both/).

### Usage

```tsx
<Select
  label="Select option"
  options={[{ id: '1', label: "Label" }]}
  bind:selected
  autocomplete="on" />
```
-->

<script lang="ts">
  import { tick } from 'svelte';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { Id } from '@openvaa/core';
  import type { SelectProps } from './Select.type';

  type $$Props = SelectProps;

  export let options: $$Props['options'] = [];
  export let label: $$Props['label'] = undefined;
  export let onShadedBg: $$Props['onShadedBg'] = undefined;
  export let selected: $$Props['selected'] = '';
  export let onChange: $$Props['onChange'] = undefined;
  export let autocomplete: $$Props['autocomplete'] = undefined;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Intialization
  ////////////////////////////////////////////////////////////////////

  const id = getUUID();
  const selectedPrefix = '✔︎ ';
  let autocompleteInput: HTMLInputElement | undefined;

  let inputValue = '';
  let isOptionListOpen = false;
  let focusIndex = -1;

  function normalize(text: string): string {
    return text
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  $: filteredOptions = options.filter(function (option) {
    return normalize(option.label).includes(normalize(inputValue));
  });

  $: if (options.length === 1 && !selected) {
    handleSelect(options[0]);
  }

  $: if (!isOptionListOpen || focusIndex > filteredOptions.length - 1) {
    focusIndex = -1;
  }

  ////////////////////////////////////////////////////////////////////
  // Main change handler
  ////////////////////////////////////////////////////////////////////

  /**
   * Called when `selected` changes
   */
  function handleChange(): void {
    onChange?.(selected);
  }

  ////////////////////////////////////////////////////////////////////
  // Handle interactions without autocomplete
  ////////////////////////////////////////////////////////////////////

  /**
   * Called when the non-autocomplete input is clicked to ensure selection of the only option
   */
  function handleClick(): void {
    if (options.length === 1) {
      handleChange();
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Handle interactions with autocomplete
  ////////////////////////////////////////////////////////////////////

  /*
   * The interactions are based on four event handlers which may be triggered by pointer or keyboard in this order:
   * 1. handleFocus (on the text input)
   * 2. handleKeyDown
   * 3. handleSelect
   * 4. handleFocusOut (from the text input or option list)
   */

  async function handleFocus(): Promise<void> {
    // Clear the input (without changing the selected option)
    inputValue = '';
    // Wait for the value to update before selecting it (for easier overwriting)
    await tick();
    autocompleteInput?.select();
    isOptionListOpen = true;
  }

  function handleKeydown(
    event: KeyboardEvent & {
      currentTarget: EventTarget & HTMLInputElement;
    }
  ): void {
    switch (event.key) {
      case 'Alt':
      case 'Control':
      case 'Meta':
      case 'Shift':
      case 'CapsLock':
      case 'F1':
      case 'F2':
      case 'F3':
      case 'F4':
      case 'F5':
      case 'F6':
      case 'F7':
      case 'F8':
      case 'F9':
      case 'F10':
      case 'F11':
      case 'F12':
        // Don't capture control keys
        return;
      case 'Enter':
        event.preventDefault();
        if (focusIndex >= 0) handleSelect(filteredOptions[focusIndex]);
        break;
      case 'Down':
      case 'ArrowDown':
        event.preventDefault();
        changeFocusedOptionBy(event.shiftKey ? 10 : 1);
        break;
      case 'Up':
      case 'ArrowUp':
        event.preventDefault();
        changeFocusedOptionBy(event.shiftKey ? -10 : -1);
        break;
      case 'Esc':
      case 'Escape':
      case 'Tab':
        // Defocus the input to trigger handleFocusOut and auto-select if Tab was pressed
        if (event.key === 'Tab' && focusIndex >= 0) handleSelect(filteredOptions[focusIndex]);
        else autocompleteInput?.blur();
        break;
      default:
        // Select the first option by default
        focusIndex = 0;
        break;
    }
  }

  function handleSelect(option: { id: Id; label: string }) {
    selected = option.id;
    handleChange();
    closeOptionList();
  }

  function handleFocusOut(
    event: FocusEvent & {
      currentTarget: EventTarget | null;
      relatedTarget: EventTarget | null;
    }
  ): void {
    // Do nothing if the focus is still be within the container
    if (
      event.currentTarget instanceof HTMLElement &&
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    )
      return;
    if (!isOptionListOpen) return;
    closeOptionList();
  }

  function changeFocusedOptionBy(steps: number): void {
    focusIndex = Math.min(Math.max(focusIndex + steps, 0), filteredOptions.length - 1);
    // When moving back to the first option, ensure that the input is also visible
    const element = focusIndex > 0 ? document.getElementById(`option-${focusIndex}-${id}`) : autocompleteInput;
    element?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  }

  function closeOptionList(): void {
    if (selected && !inputValue.startsWith(selectedPrefix))
      inputValue = `${selectedPrefix}${options.find((o) => o.id === selected)?.label}`;
    else inputValue = '';
    isOptionListOpen = false;
    // Make sure the input is no longer focused
    autocompleteInput?.blur();
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  let inputClass: string;
  $: inputClass = `w-full max-w-md place-self-center ${onShadedBg ? 'bg-base-100' : 'bg-base-300'}`;
</script>

{#if options.length === 1}
  <div
    aria-label={label}
    {...concatClass(
      $$restProps,
      'flex items-center h-[3rem] rounded-lg px-[1rem] w-full max-w-md place-self-center text-secondary'
    )}>
    {selectedPrefix}
    {options[0].label}
  </div>
{:else if autocomplete === 'on'}
  <div class="w-full max-w-md place-self-center" on:focusout={handleFocusOut}>
    <input
      {...concatClass($$restProps, `select ${inputClass}`)}
      class:text-secondary={selected === ''}
      placeholder={label}
      bind:this={autocompleteInput}
      bind:value={inputValue}
      on:focus={handleFocus}
      on:keydown={handleKeydown}
      role="combobox"
      aria-label={label}
      aria-autocomplete="list"
      aria-controls="menu-{id}"
      aria-expanded={isOptionListOpen}
      aria-activedescendant={focusIndex >= 0 ? `option-${focusIndex}-${id}` : ''} />
    {#if isOptionListOpen}
      <div class="relative">
        <ul
          id="menu-{id}"
          role="listbox"
          class="menu absolute left-0 top-6 z-10 mb-xl w-full max-w-md place-self-center rounded-lg border-none {onShadedBg
            ? 'bg-base-100'
            : 'bg-base-300'}">
          {#each filteredOptions as option, optionIndex}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- tabindex is necessary for the parents on:focusout to be able to detect focus held by the li element -->
            <li
              id="option-{optionIndex}-{id}"
              class="cursor-pointer rounded-lg"
              role="option"
              tabindex="0"
              aria-selected={option.id === selected}
              on:click={() => handleSelect(option)}>
              <span
                class={optionIndex === focusIndex
                  ? 'bg-neutral/10 !outline !outline-2 !outline-offset-0 !outline-neutral'
                  : ''}>
                {option.label}
              </span>
            </li>
          {:else}
            <li class="pointer-events-none rounded-lg text-secondary">
              <span>{$t('components.select.noMatchingOptions')}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
{:else}
  <select
    aria-label={label}
    {...concatClass($$restProps, `select ${inputClass}`)}
    class:text-secondary={selected === ''}
    bind:value={selected}
    on:click={handleClick}
    on:change={handleChange}>
    <option disabled selected value="">
      {label}
    </option>
    {#each options as { id, label }}
      <option value={id}>
        {#if selected === id}{selectedPrefix}{/if}
        {label}
      </option>
    {/each}
  </select>
{/if}
