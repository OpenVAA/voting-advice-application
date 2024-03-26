<script lang="ts">
  import {Icon} from '$lib/components/icon';
  import {t} from '$lib/i18n';
  import {concatClass} from '$lib/utils/components';
  import type {TextEntityFilterProps} from './TextEntityFilter.type';

  type $$Props = TextEntityFilterProps;

  export let filter: $$Props['filter'];

  let value = filter.include ?? '';

  $: filter.include = value.trim();
</script>

<!--
@component
Render a text filter for entities.

### Properties

- `filter`: The text filter object to render.
- Any valid attributes of a `<form>` element

### Usage

```tsx
<EntityFilters {filters}/>
```
-->

<form {...concatClass($$restProps, 'grid')}>
  <label class="input input-bordered flex items-center gap-2">
    <input
      bind:value
      type="text"
      class="grow"
      placeholder={$t('components.entityFilters.text.placeholder')} />
    <Icon name="search" />
  </label>
</form>
