<script lang="ts">
  import {onMount, onDestroy} from 'svelte';
  import type {TextAreaProps} from './TextArea.type';

  type $$Props = TextAreaProps;

  export let id: $$Props['id'];
  export let text: $$Props['text'];

  export let headerText: $$Props['headerText'] = undefined;
  export let localStorageId: $$Props['localStorageId'] = undefined;
  export let previouslySaved: $$Props['previouslySaved'] = undefined;
  export let rows: $$Props['rows'] = 4;
  export let disabled: $$Props['disabled'] = false;

  const SAVE_INTERVAL_MS = 1000;
  let saveInterval: NodeJS.Timeout;
  onMount(() => {
    if (localStorageId) {
      const savedText = localStorage.getItem(localStorageId);
      if (savedText) {
        text = savedText;
      } else {
        text = previouslySaved ?? '';
      }
      saveInterval = setInterval(() => {
        saveToLocalStorage();
      }, SAVE_INTERVAL_MS);
    } else {
      text = previouslySaved ?? '';
    }
  });

  onDestroy(() => {
    clearInterval(saveInterval);
  });

  const saveToLocalStorage = () => {
    if (!localStorageId) {
      return;
    }

    if (!text || text === '' || previouslySaved === text) {
      // Remove from local storage if there is nothing to save
      removeFromLocalStorage();
      return;
    }

    localStorage.setItem(localStorageId, text.toString());
  };

  const removeFromLocalStorage = () => {
    if (!localStorageId) {
      return;
    }
    localStorage.removeItem(localStorageId);
  };

  // Used to clear the local storage from a parent component
  export const deleteLocal = () => {
    removeFromLocalStorage();
  };
</script>

<!--
@component
TextArea is a text area component with a header and a local storage save feature.

### Slots

- header: Optional header for the text area, can be used instead of the default one.

### Bindable functions

- `deleteLocal`: Deletes the local storage for the text area. Used to clear the local storage from a parent component.

### Properties

- `id` (required): The id for the text area and its label.
- `text` (required): Variable to bind the text area value to.
- `headerText` (optional): The header text for the text area. If not provided, the header slot will be used.
- `localStorageId` (optional): Local storage id for the saved text. If provided, content is saved to local storage periodically.
- `previouslySaved` (optional): Previously saved text from the database, i.e. not locally saved. Is shown if there is no locally saved text.
- `rows` (optional): The number of rows for the text area. Default is 4.
- `disabled` (optional): Whether the text area is disabled. Default is false.

### Usage

Usage without local saving:

```tsx
<TextArea
  headerText="Example Header"
  id="example-id"
  bind:text={exampleTextVariable} />
```

Usage with local saving:

```tsx
<TextArea
  headerText="Example Header"
  id="example-id"
  localStorageId="example-id"
  previouslySaved="Example text"
  disabled={isDisabled}
  bind:text={textVariable}
  bind:this={textAreaVariable} />
```
-->

<div class="w-full">
  {#if headerText}
    <label for={id} class="text-m mx-6 my-6 p-0 uppercase text-secondary">{headerText}</label>
  {:else}
    <slot name="header" field={undefined} />
  {/if}

  <textarea
    {id}
    {rows}
    {disabled}
    class="textarea my-6 w-full resize-none bg-base-100 p-6 !outline-none disabled:bg-base-300"
    bind:value={text}
    on:focusout={saveToLocalStorage} />
</div>
