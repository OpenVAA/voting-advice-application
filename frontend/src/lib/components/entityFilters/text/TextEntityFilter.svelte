<script lang="ts">
  import {onDestroy} from 'svelte';
  import {t} from '$lib/i18n';
  import {concatClass} from '$lib/utils/components';
  import {Icon} from '$lib/components/icon';
  import type {TextEntityFilterProps} from './TextEntityFilter.type';

  type $$Props = TextEntityFilterProps;

  export let filter: $$Props['filter'];
  export let placeholder: $$Props['placeholder'] = undefined;
  export let variant: $$Props['variant'] = 'default';

  let value: string;
  updateText();

  // Update filter values when selection changes
  $: filter.include = value;

  // Update selection when filter values change
  filter.onChange(updateText);

  // Cleanup
  onDestroy(() => filter.onChange(updateText, false));

  function updateText() {
    value = filter.include;
  }

  let labelClass: string;
  $: {
    labelClass = 'input flex items-center gap-2';
    switch (variant) {
      case 'discrete':
        labelClass += ' bg-base-200';
        break;
      default:
        labelClass += ' input-bordered';
    }
  }
</script>

<!--
@component
Render a text filter for entities.

### Properties

- `filter`: The text filter object to render.
- `placeholder`: The placeholder text. @default `$t('entityFilters.text.placeholder')`
- Any valid attributes of a `<form>` element

### Usage

```tsx
<TextEntityFilter {filter}/>
```
-->

<form {...concatClass($$restProps, '')}>
  <label class={labelClass}>
    <span class="sr-only">{$t('entityFilters.text.ariaLabel')}</span>
    <input
      bind:value
      type="text"
      class="max-w-[8rem]"
      placeholder={placeholder ?? $t('entityFilters.text.placeholder')} />
    {#if value === ''}
      <Icon name="search" />
    {:else}
      <button
        on:click={() => (value = '')}
        aria-label={$t('common.clear')}
        title={$t('common.clear')}>
        <Icon name="close" />
      </button>
    {/if}
  </label>
</form>
