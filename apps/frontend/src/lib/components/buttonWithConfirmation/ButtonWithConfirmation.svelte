<!--
@component A button which asks the user to confirm before the action is executed, in a confirmation modal or inline, in place of the button.

A destructive action confirms inline when it acts on one item among several shown together, such as a card in a list, so that the question stays beside the item it concerns and the rest of the page stays in view; an action on the page or the whole of its data confirms in the modal.

### Properties

- `modalTitle`: The question the confirmation asks: the title of the confirmation modal, or the inline prompt.
- `onConfirm`: Callback triggered when the user confirms the action.
- `onCancel`: Callback triggered when the user cancels the action.
- `cancelLabel`: The label for the cancel button. @default t('common.cancel')
- `confirmLabel`: The label for the confirm button. @default t('common.continue')
- `confirmationType`: Whether the confirmation is asked in a modal dialog or inline. @default 'dialog'
- `open`: Bindable. Whether the inline prompt is shown in place of the button. Not used with `confirmationType='dialog'`. @default false
- Any valid properties of a `<Button>` component except `href` and `onclick`.

### Inline confirmation

Pressing the button replaces it with a warning that asks `modalTitle`, followed by Confirm and Cancel. Confirm has the button's `icon`, `iconPos` and `color`, and is described by the question.

- Pressing the button moves focus to Confirm; Cancel closes the prompt and moves focus back to the button.
- While the promise `onConfirm` returns is pending, Confirm shows its loading state and Cancel is disabled. The prompt then closes and focus is left to the caller, whose action may have removed the button.
- With a `data-testid` on the button, the prompt, Confirm and Cancel carry it followed by `-prompt`, `-confirm` and `-cancel`.

### Reactivity

Reactivity is not supported for the properties: `variant`, `iconPos`.

### Usage

```tsx
<ButtonWithConfirmation
  text="Delete"
  modalTitle="Delete the job?"
  onConfirm={deleteJob} />

<ButtonWithConfirmation
  confirmationType="inline"
  bind:open={confirming}
  text="Delete"
  icon="removeFromList"
  color="warning"
  modalTitle="Delete this nomination?"
  confirmLabel="Delete"
  onConfirm={deleteNomination} />
```
-->

<script lang="ts">
  import { tick } from 'svelte';
  import { Button } from '$lib/components/button';
  import { ConfirmationModal } from '$lib/components/modal/confirmation';
  import { Warning } from '$lib/components/warning';
  import { getComponentContext } from '$lib/contexts/component';
  import type { ButtonWithConfirmationProps } from './ButtonWithConfirmation.type';

  let {
    text,
    onConfirm,
    modalTitle,
    onCancel,
    cancelLabel,
    confirmLabel,
    confirmationType = 'dialog',
    open = $bindable(false),
    icon,
    iconPos,
    color,
    children,
    ...restProps
  }: ButtonWithConfirmationProps = $props();

  const { t } = getComponentContext();

  let confirmModalRef = $state<ConfirmationModal | undefined>();

  ////////////////////////////////////////////////////////////////////
  // Inline confirmation
  ////////////////////////////////////////////////////////////////////

  const promptId = $props.id();
  const testId = $derived(restProps['data-testid'] as string | undefined);

  /** Whether the promise `onConfirm` returned is pending. */
  let confirmPending = $state(false);
  /** Holds the button or the prompt, through which focus is moved between them. */
  let root = $state<HTMLElement | undefined>();

  async function focusOn(part: 'trigger' | 'confirm'): Promise<void> {
    await tick();
    root?.querySelector<HTMLElement>(`[data-confirmation-part="${part}"]`)?.focus();
  }

  async function openPrompt(): Promise<void> {
    open = true;
    await focusOn('confirm');
  }

  async function cancelPrompt(): Promise<void> {
    open = false;
    onCancel?.();
    await focusOn('trigger');
  }

  async function confirmPrompt(): Promise<void> {
    if (confirmPending) return;
    confirmPending = true;
    try {
      await onConfirm();
    } finally {
      confirmPending = false;
      open = false;
    }
  }
</script>

{#if confirmationType === 'inline'}
  <div class="contents" bind:this={root}>
    {#if open}
      <div class="gap-sm flex w-full flex-col">
        <Warning id={promptId} data-testid={testId ? `${testId}-prompt` : undefined}>
          {modalTitle}
          {@render children?.()}
        </Warning>
        <div class="gap-sm flex flex-wrap">
          <Button
            text={confirmLabel || t('common.continue')}
            {icon}
            {iconPos}
            {color}
            loading={confirmPending}
            aria-describedby={promptId}
            onclick={confirmPrompt}
            data-confirmation-part="confirm"
            data-testid={testId ? `${testId}-confirm` : undefined} />
          <Button
            text={cancelLabel || t('common.cancel')}
            disabled={confirmPending}
            onclick={cancelPrompt}
            data-confirmation-part="cancel"
            data-testid={testId ? `${testId}-cancel` : undefined} />
        </div>
      </div>
    {:else}
      <Button {text} {icon} {iconPos} {color} onclick={openPrompt} data-confirmation-part="trigger" {...restProps} />
    {/if}
  </div>
{:else}
  <Button {text} {icon} {iconPos} {color} onclick={() => confirmModalRef?.openModal()} {...restProps}></Button>

  <!-- bind: keep — confirmModalRef is a $state single ref; read in onclick -->
  <ConfirmationModal
    bind:this={confirmModalRef}
    title={modalTitle}
    {...{ onConfirm, onCancel, cancelLabel, confirmLabel }}>
    {@render children?.()}
  </ConfirmationModal>
{/if}
