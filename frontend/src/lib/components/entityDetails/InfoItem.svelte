<script lang="ts">
  /** The info label */
  export let label: string;
  /** The info layout mode */
  export let vertical = false;
</script>

<!--
@component
Used to show a label-content pair in a Candidate's basic information.

### Properties

- `label`: the label of the information
- `vertical`: layout mode for the item

### Slots

- default: the information contents.

### Usage

```tsx
<InfoItem label={$t('candidateApp.common.firstNameLabel')}>
  {candidate.firstName}
</InfoItem>
```
-->

<div class="grid justify-start gap-md {vertical ? 'vertical-grid' : 'horizontal-grid'}">
  <!-- pt-[0.3rem] matches the baselines of the small label and the content text -->
  <div
    class="test-label small-label pt-[0.3rem] text-left align-top {vertical
      ? 'w-max'
      : 'min-w-[10rem]'}">
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
