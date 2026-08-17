<!--
@component
Used to show a label-content pair in a Candidate's basic information.

### Properties

- `label`: The label of the information.
- `vertical`: Layout mode for the item. Default: `false`
- Any valid attributes of a `<div>` element

### Slots

- default: the information contents.

### Usage

```tsx
<InfoItem label={$t('candidateApp.common.firstNameLabel')}>
  {candidate.firstName}
</InfoItem>
```
-->

<script lang="ts">
  import type { InfoItemProps } from './InfoItem.type';

  type $$Props = InfoItemProps;

  export let label: $$Props['label'];
  export let vertical: $$Props['vertical'] = false;
</script>

<div class="grid justify-start gap-md {vertical ? 'vertical-grid' : 'horizontal-grid'}">
  <!-- pt-[0.3rem] matches the baselines of the small label and the content text -->
  <div class="test-label small-label pt-[0.3rem] text-left align-top {vertical ? 'w-auto' : 'min-w-[10rem]'}">
    {label}
  </div>
  <div class="overflow-hidden align-top">
    <slot />
  </div>
</div>

<style lang="postcss">
  .vertical-grid {
    @apply grid-flow-row grid-rows-[min-content_auto] pb-8;
  }

  .horizontal-grid {
    @apply grid-flow-col grid-cols-[min-content_auto];
  }
</style>
