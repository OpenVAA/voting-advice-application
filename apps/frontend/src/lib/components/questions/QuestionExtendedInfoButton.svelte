<!--
@component A button that opens the question's extended information content in the app's drawer host.

The dialog itself is the app's `DrawerHost` (`$lib/components/modal/drawerHost`), so this component hands the host a payload rather than rendering an overlay of its own: the content snippet and the accessible name. The questions route subtree is a different subtree from the results tree that also opens the host, which is why the host is mounted in the app's root layout rather than in either route.

### Properties

- `question`: The question whose expanded info to show.
- Any valid properties of a `<Button>` component

### Callback properties

- `onOpen`: A callback function to be executed when the drawer is opened, mostly for tracking.
- `onSectionCollapse`: A callback triggered when an info section is collapsed. Mostly used for tracking.
- `onSectionExpand`: A callback triggered when an info section is expanded.  Mostly used for tracking.

### Usage

```tsx
<QuestionExtendedInfoButton {question} />
```
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { drawerHost } from '$lib/components/modal/drawerHost';
  import { getComponentContext } from '$lib/contexts/component';
  import { QuestionExtendedInfo } from '.';
  import type { QuestionExtendedInfoButtonProps } from './QuestionExtendedInfoButton.type';

  let {
    question,
    onOpen = undefined,
    onSectionCollapse = undefined,
    onSectionExpand = undefined,
    ...restProps
  }: QuestionExtendedInfoButtonProps = $props();

  const { t } = getComponentContext();

  const key = drawerHost.newKey('question-info');

  // ⚠ The host keeps rendering `content` through its close animation — i.e. potentially AFTER this component is destroyed, when the `question` prop no longer reads a value. Rendering straight from the prop would crash `QuestionExtendedInfo` mid-flush and abort the host's close (spike 034, D-12). So the payload renders from the last defined question, which outlives the prop.
  // svelte-ignore state_referenced_locally -- seeded once; kept current by the pre-effect below
  let shownQuestion = $state.raw(question);
  $effect.pre(() => {
    if (question) shownQuestion = question;
  });

  function handleClick(): void {
    drawerHost.open({
      key,
      title: () => shownQuestion.text,
      content
      // No payload `testId` on purpose: `voter-questions-popup-info-modal` stays on the info BODY inside the payload (below), where `questionInfo.fixture.ts` has always read it. Moving it onto the host's persistent `<dialog>` would change what the fixture's expander-branch `toBeHidden()` measures — a dialog that exists but is closed, rather than one that was never mounted (D-13).
    });
    onOpen?.();
  }

  // Close by key when this control stops standing for the question the host is showing. The effect deliberately READS the question id, so the teardown runs on a question → question navigation too, not only on destroy: the questions layout keeps this component mounted across that navigation (both the popup gate and the `{#if}` around it stay true), so a destroy-only teardown would leave the previous question's info body on screen.
  $effect(() => {
    void question?.id;
    return () => drawerHost.close(key);
  });
</script>

{#snippet content()}
  <QuestionExtendedInfo
    question={shownQuestion}
    title={shownQuestion.text}
    {onSectionCollapse}
    {onSectionExpand}
    class="p-lg"
    data-testid="voter-questions-popup-info-modal" />
{/snippet}

<Button
  text={t('components.questionExtendedInfo.title')}
  icon="info"
  iconPos="left"
  onclick={handleClick}
  data-testid="voter-questions-popup-info-button"
  {...restProps} />
