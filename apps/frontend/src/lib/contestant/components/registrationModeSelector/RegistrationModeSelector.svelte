<!--
@component A choice among the ways to register: a `RadioGroup` of the input library with one radio per mode, and under the chosen radio that mode's panel. The panel's content is a snippet of the caller's, which is given the mode it is rendered for.

Only the chosen mode's panel is in the document, so a browser finds no field of another mode to fill. Nothing is chosen until the user chooses. A panel opens and closes without an animation.

With exactly one mode there is nothing to choose: the same snippet is rendered directly, with no group, no question and no block around it, and `selected` is not written. With no mode nothing is rendered.

The radios are in no form. They choose and are never sent: the snippet holds the panel's own form, so the form that is open holds that mode's fields alone.

### Properties

- `modes`: The registration modes to choose among, in the order they are shown.
- `selected`: Bindable: The chosen mode. Nothing is chosen until the user chooses, and with a single mode it is never written.
- `panel`: What a mode's panel holds. Rendered for the chosen mode alone, and directly for a single mode.
- `error`: Bindable: The message shown under the options while the group is in error. Cleared when a mode is chosen.
- `id`: The id of the fieldset. The error takes the id `<id>-error`. Default: a generated id
- `focusFirst`: Bindable: Function to set focus to the first radio.
- Any valid attributes of a `<fieldset>` element. They reach the fieldset, which is rendered only with several modes.

### Tracking events

- `registration_modeChosen`: Sent with the chosen `mode` each time the user chooses a mode among several. Nothing is sent with a single mode.

### Accessibility

- The group is a `<fieldset>` named by its `<legend>`, with native radios and no added role.
- The radios share one `name`, so the group is one tab stop, and the arrow keys move and choose.
- A panel follows its radio in the document, so its first field is the next tab stop. Choosing a mode moves no focus.
- Each radio is named by its option's text, through a label that covers the whole row.
- The error has `role="alert"` and is named as the fieldset's description.

### Usage

```tsx
<RegistrationModeSelector {modes} bind:selected bind:error={modesError} bind:this={selector}>
  {#snippet panel(mode)}
    {#if mode === 'code'}
      <form id="register-code-form" novalidate onsubmit={checkCode}>…</form>
    {:else}
      …
    {/if}
  {/snippet}
</RegistrationModeSelector>
```
-->

<script lang="ts">
  import { RadioGroup } from '$lib/components/input';
  import { getAppContext } from '$lib/contexts/app';
  import { getComponentContext } from '$lib/contexts/component';
  import type { RegistrationMode } from '@openvaa/app-shared';
  import type { TranslationKey } from '$types';
  import type { RegistrationModeSelectorProps } from './RegistrationModeSelector.type';

  let {
    modes,
    selected = $bindable(),
    panel,
    error = $bindable(),
    ...restProps
  }: RegistrationModeSelectorProps = $props();

  export function focusFirst(): void {
    group?.focusFirst();
  }

  const { t } = getComponentContext();
  const { track } = getAppContext();

  /** The text of each mode's option. */
  const OPTION_TEXT: Record<RegistrationMode, TranslationKey> = {
    identity_provider: 'contestantApp.register.modes.identityProvider',
    email: 'contestantApp.register.modes.email',
    code: 'contestantApp.register.modes.code'
  };

  const options = $derived(modes.map((mode) => ({ value: mode, label: t(OPTION_TEXT[mode]) })));

  let group: RadioGroup<RegistrationMode> | undefined = $state();

  function handleChoose(mode: RegistrationMode): void {
    track('registration_modeChosen', { mode });
  }
</script>

{#if modes.length === 1}
  {@render panel(modes[0])}
{:else if modes.length > 1}
  <RadioGroup
    bind:this={group}
    bind:selected
    bind:error
    {...restProps}
    legend={t('contestantApp.register.modes.legend')}
    name="registrationMode"
    {options}
    onchoose={handleChoose}
    legendProps={{ class: 'mb-md text-center' }}
    optionProps={(mode) => ({
      class: 'bg-base-100 rounded-lg',
      'data-testid': 'register-mode-option',
      'data-mode': mode
    })}
    radioProps={() => ({ containerProps: { class: 'p-lg' }, 'data-testid': 'register-mode-input' })}
    errorTestId="register-modes-error">
    {#snippet option(mode)}
      <div class="px-lg pb-lg" data-testid="register-mode-panel" data-mode={mode}>
        {@render panel(mode)}
      </div>
    {/snippet}
  </RadioGroup>
{/if}
