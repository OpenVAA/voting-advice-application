<!--
@component A radio and its label: the native `<input type="radio">`, styled with a visible border, before its text inside one `<label>` that covers the row. The radios of a group are separate `Radio`s that share one `name` and are bound to one value.

### Properties

- `group`: Bindable: the value of the group's chosen radio. This radio is checked while it equals `value`, and choosing this radio writes `value` to it.
- `value`: The value this radio stands for.
- `name`: The name the group's radios share.
- `label`: The text of the radio. Ignored when `children` is given.
- `children`: The content of the label after the radio, in place of `label`.
- `disabled`: Works as a native radio's `disabled`. @default false
- `containerProps`: Any attributes of the `<label>`. A `class` is merged with the label's own classes.
- Any valid attributes of an `<input>` element. They reach the radio, and a `class` is merged with the radio's own classes.

### Accessibility

- The radio is native, so radios that share a name are one tab stop and the arrow keys move and choose.
- The radio is named by the label's text, and the label covers the whole row, so a press anywhere on the row chooses it.
- The radio's border is drawn in every state, so a radio that is not chosen is still seen.

### Usage

```tsx
{#each modes as mode (mode)}
  <Radio bind:group={selected} name="registrationMode" value={mode} label={t(OPTION_TEXT[mode])} />
{/each}
```
-->

<script lang="ts" generics="TValue extends string">
  import { concatClass } from '$lib/utils/components';
  import type { RadioProps } from './Radio.type';

  let {
    group = $bindable(),
    value,
    name,
    label,
    children,
    disabled = false,
    containerProps = {},
    ...restProps
  }: RadioProps<TValue> = $props();
</script>

<label
  {...concatClass(
    containerProps,
    `gap-sm min-h-touch flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`
  )}>
  <input {...concatClass(restProps, 'radio radio-primary border')} bind:group type="radio" {name} {value} {disabled} />
  {#if children}
    {@render children()}
  {:else}
    <span>{label}</span>
  {/if}
</label>
