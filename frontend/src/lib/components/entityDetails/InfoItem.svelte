<script lang="ts">
  /** The info label */
  export let label: string;
</script>

<!--
@component
Used to show a label-content pair in a Candidate's basic information.

### Properties

- `label`: the label of the information

### Slots

- default: the information contents.

### Usage

```tsx
<InfoItem label={$t('candidate.firstNameLabel')}>
  {candidate.firstName}
</InfoItem>
```
-->

<div class="infoItem flex flex-row gap-md">
  <!-- pt-[0.3rem] matches the baselines of the small label and the content text -->
  <div class="small-label w-min min-w-[7rem] pt-[0.3rem] text-left align-top">{label}</div>
  <div class="align-top first-letter:uppercase">
    <slot />
  </div>
</div>
