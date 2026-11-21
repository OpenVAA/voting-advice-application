<!--
@component A card of one nomination: its election as the heading, a list of labelled rows, and what the caller puts under them.

### Properties

- `title`: The card's heading: the name of the nomination's election.
- `titleTestId`: The test id of the card's heading.
- `rows`: The rows of the card, in order. Each has a `label`, a `value` rendered as text, the `testId` of the value and, optionally, a `line` with its own `testId`, shown under the value in the value's own element.
- `children`: What the card holds under its rows, such as its notes and its buttons.
- Any valid attributes of an `<article>` element.

### Accessibility

- The card is an `<article>` named by its heading.
- A label and its value are a `<dt>` and `<dd>` pair, the label above the value at every width, and a long value wraps at any character.

### Usage

```tsx
<NominationCard
  title={nomination.electionName}
  titleTestId="nomination-election"
  rows={[{ label: t('common.constituency'), value: nomination.constituencyName, testId: 'nomination-constituency' }]}
  data-testid="contestant-nomination">
  <p class="small-info mt-md">{t('contestantApp.nominations.state.pendingInfo')}</p>
</NominationCard>
```
-->

<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { NominationCardProps } from './NominationCard.type';

  let { title, titleTestId, rows, children, ...restProps }: NominationCardProps = $props();

  const headingId = $props.id();
</script>

<article {...concatClass(restProps, 'bg-base-100 p-lg rounded-lg')} aria-labelledby={headingId}>
  <h2 class="text-lg" id={headingId} data-testid={titleTestId}>{title}</h2>
  <dl class="mt-md gap-md flex flex-col">
    {#each rows as row (row.testId)}
      <div>
        <dt class="small-info uc-first">{row.label}</dt>
        <dd class="mt-xs wrap-anywhere" data-testid={row.testId}>
          {row.value}
          {#if row.line}
            <p class="small-info mt-xs" data-testid={row.line.testId}>{row.line.text}</p>
          {/if}
        </dd>
      </div>
    {/each}
  </dl>
  {@render children?.()}
</article>
