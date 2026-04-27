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
<InfoItem label={t('candidateApp.common.firstNameLabel')}>
  {candidate.firstName}
</InfoItem>
```
-->

<script lang="ts">
  import type { InfoItemProps } from './InfoItem.type';

  let { label, vertical = false, children }: InfoItemProps = $props();
</script>

<div class="gap-md grid justify-start {vertical ? 'vertical-grid' : 'horizontal-grid'}">
  <div class="test-label small-label pt-[0.3rem] text-left align-top {vertical ? 'w-auto' : 'min-w-[10rem]'}">
    {label}
  </div>
  <div class="overflow-hidden align-top">
    {@render children?.()}
  </div>
</div>

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  .vertical-grid {
    @apply grid-flow-row grid-rows-[min-content_auto] pb-8;
  }
  .horizontal-grid {
    @apply grid-flow-col grid-cols-[min-content_auto];
  }
</style>
