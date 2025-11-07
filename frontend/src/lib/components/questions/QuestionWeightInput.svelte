<!--
@component
Display a toggle for selecting a question’s weight.

### Properties

- `selected`: The initial value for the weight. Not reactive.
- `options`: The allowed options.

### Callbacks

- `onChange`: A callback function that is called when the toggle value changes.

### Usage

```tsx
<QuestionWeightInput
  selected={1}
  onChange={(w) => console.info(`Selected weight: ${w}`)}
  options={QUESTION_WEIGHTS['half-normal-double']} />
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { Toggle } from '$lib/components/toggle';
  import type { QuestionWeightInputProps } from './QuestionWeightInput.type';
  import { assertTranslationKey } from '$lib/i18n/utils';

  type $$Props = QuestionWeightInputProps;

  export let options: $$Props['options'];
  export let onChange: $$Props['onChange'] = undefined;
  export let selected: $$Props['selected'];
  export let mode: $$Props['mode'] = undefined;

  const { t } = getComponentContext();

  const toggleOptions = Object.entries(options).map(([key, value]) => ({
    label: $t(assertTranslationKey(`questions.weights.weightLabels.${key}`)),
    key: `${value}`,
    value
  }));

  let selectedKey: string;
  $: selectedKey = `${selected}`;

  function handleChange(key: string) {
    if (mode === 'display') return;
    const value = toggleOptions.find((o) => o.key === key)?.value;
    if (value == null) {
      console.error('Invalid toggle key:', key);
      return;
    }
    onChange?.(value);
  }
</script>

<div {...concatClass($$restProps, 'flex flex-col items-center gap-sm')}>
  <Toggle
    label={$t('questions.weights.title')}
    onChange={handleChange}
    selected={selectedKey}
    options={toggleOptions}
    disabled={mode === 'display'}
    labelsClass={mode !== 'display' ? 'text-md min-w-[3rem]' : 'min-w-[2rem]'}
    class="bg-base-300 {mode !== 'display' ? 'px-s' : ''} border-none" />
  <div class="small-label">{$t('questions.weights.title')}</div>
</div>
