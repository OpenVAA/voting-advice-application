<!--
@component
Display the question's expandable information content.

### Properties

- `info`: The info content to show as a plain or HTML string.
- `onCollapse`: A callback triggered when the info content is collapsed. Mostly used for tracking.
- `onExpand`: A callback triggered when the info content is expanded.  Mostly used for tracking.
- Any valid properties of an `<Expander>` component

### Usage

```tsx
<QuestionInfo {info}/>
```
-->

<script lang="ts">
  import { Drawer } from '$lib/components/drawer';
  import { getComponentContext } from '$lib/contexts/component';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { Button } from '../button';
  import { Expander } from '../expander';
  import Modal from '../modal/Modal.svelte';
  import type { QuestionInfoProps } from './QuestionInfo.type';
  import { page } from '$app/stores';

  type InfoSection = {
    title: { en: string };
    text: { en: string };
    visible: boolean;
  };

  type $$Props = QuestionInfoProps;

  export let title: $$Props['title'];
  export let info: $$Props['info'];
  export let infoSections: Array<{ title: string; content: string }> = [];
  export let onCollapse: $$Props['onCollapse'] = undefined;
  export let onExpand: $$Props['onExpand'] = undefined;
  export let questionId: string;

  const { t } = getComponentContext();

  let isGenerating = false;

  async function generateArguments() {
    isGenerating = true;
    try {
      // TODO: Replace with actual API call to get candidates' opinions
      const candidateOpinions = ['I support this because...', 'I am against this because...'];

      // Get current language from URL
      const lang = $page.params.lang || 'en';

      console.info('Making request to generate arguments...', { questionId, opinions: candidateOpinions });
      const response = await fetch(`/${lang}/api/generate-arguments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId,
          opinions: candidateOpinions
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to generate arguments:', error);
        throw new Error('Failed to generate arguments');
      }

      const result = await response.json();
      const sections = Object.values(result.infoSections as Record<string, InfoSection>);

      // Merge the new sections with existing ones
      infoSections = [
        ...infoSections,
        ...sections
          .filter((section): section is InfoSection => section.visible)
          .map(({ title, text }) => ({
            title: title?.en ?? '',
            content: text?.en ?? ''
          }))
      ];
      console.info('Generated arguments:', result);
    } catch (error) {
      console.error('Failed to generate arguments:', error);
    } finally {
      isGenerating = false;
    }
  }
</script>

<Drawer {title} on:close={() => onCollapse?.()}>
  {@html sanitizeHtml(info)}
  <div class="mt-16">
    {#each infoSections ?? [] as { title, content }}
      <Expander {title} {...$$restProps} titleClass="flex justify-between font-bold" contentClass="!text-left">
        {@html sanitizeHtml(content)}
      </Expander>
    {/each}

    <div class="mt-4">
      <Button
        text={isGenerating ? 'Generating...' : 'Generate Arguments'}
        disabled={isGenerating}
        on:click={generateArguments} />
    </div>
  </div>
</Drawer>
