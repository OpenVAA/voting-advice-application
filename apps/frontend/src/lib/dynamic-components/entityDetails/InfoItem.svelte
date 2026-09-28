<!--
@component Used to show a label-content pair in a Candidate's basic information.

### Properties

- `label`: The label of the information.
- `vertical`: Layout mode for the item. Default: `false`
- `children`: The information contents.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<InfoItem label={t('candidateApp.common.firstNameLabel')}>
  {candidate.firstName}
</InfoItem>
```
-->

<script lang="ts">
  import { cn } from '$lib/utils/components';
  import type { InfoItemProps } from './InfoItem.type';

  let { label, vertical = false, children }: InfoItemProps = $props();
</script>

<div
  class={cn(
    'gap-md grid justify-start',
    vertical ? 'grid-flow-row grid-rows-[min-content_auto] pb-8' : 'grid-flow-col grid-cols-[min-content_auto]'
  )}
  data-testid="info-item">
  <div class="test-label small-label pt-[0.3rem] text-left align-top {vertical ? 'w-auto' : 'min-w-[10rem]'}">
    {label}
  </div>
  <div class="overflow-hidden align-top">
    {@render children?.()}
  </div>
</div>
