<!--
@component A note saying that something cannot be edited, with the way to support: the sentence of the reason, an optional second sentence, and one Contact support button under the text.

The note builds no route into the pages of an entity.

### Dynamic component

Accesses `ContestantContext`.

### Properties

- `reason`: Why the content cannot be edited. Selects the sentence the note shows.
  - `'answersLocked'`: Answers can no longer be edited.
  - `'nominationsLocked'`: Nominations can no longer be changed in the application.
  - `'nominationsAnswersLocked'`: Nominations can no longer be changed because editing has ended in the application. A page gives it where it shows nominations while answers are locked and nominations are not.
- `children`: An optional second sentence rendered after the reason, e.g. that the profile is hidden because answers are missing.
- Any valid attributes of a `<div>` element.

### Accessibility

- The note belongs in the `note` snippet of `MainContent`, whose wrapper has `role="note"` and precedes the page title in reading order.
- The support button is a link at least as high as the minimum touch target, laid out from the start of the row with its icon first.

### Usage

```tsx
<MainContent title="Your Answers">
  {#snippet note()}
    <NotEditableNote reason="answersLocked" data-testid="contestant-answers-locked-warning">
      {t('contestantApp.common.isHiddenBecauseMissing')}
    </NotEditableNote>
  {/snippet}
</MainContent>
```
-->

<script lang="ts">
  import { ContactSupport } from '$contestant/components/contactSupport';
  import { Warning } from '$lib/components/warning';
  import { getContestantContext } from '$lib/contexts/contestant';
  import type { TranslationKey } from '$types';
  import type { NotEditableNoteProps } from './NotEditableNote.type';

  let { reason, children, ...restProps }: NotEditableNoteProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getContestantContext();

  ////////////////////////////////////////////////////////////////////
  // The sentence of each reason
  ////////////////////////////////////////////////////////////////////

  const REASON_MESSAGE: Record<NotEditableNoteProps['reason'], TranslationKey> = {
    answersLocked: 'contestantApp.common.editingNotAllowed',
    nominationsLocked: 'contestantApp.common.nominationsNotEditable',
    nominationsAnswersLocked: 'contestantApp.common.nominationsNotEditableAnswersLocked'
  };
</script>

<Warning {...restProps} data-reason={reason}>
  {t(REASON_MESSAGE[reason])}
  {@render children?.()}
  <ContactSupport variant="normal" iconPos="left" class="mt-sm" />
</Warning>
