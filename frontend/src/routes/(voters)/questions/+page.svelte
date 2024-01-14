<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {Button} from '$lib/components/button';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {Icon} from '$lib/components/icon';
  import {BasicPage} from '$lib/templates/basicPage';

  const title = $page.data.appLabels.viewTexts.yourOpinionsTitle;
  const emoji = $_('questions.heroEmoji');

  const firstQuestionUrl = `${$page.url.pathname.replace(/\/$/, '')}/${$page.data.questions[0].id}`;

  const questionCategories = new Set<string>();
  $page.data.questions.forEach((question) => {
    if (question.category) questionCategories.add(question.category);
  });

  const opinionsDescriptionText = $page.data.appLabels.viewTexts.yourOpinionsDescription
    .replace('{{0}}', $page.data.questions.length.toString())
    .replace('{{1}}', questionCategories.size.toString());
</script>

<BasicPage {title}>
  <svelte:fragment slot="note">
    <Icon name="tip" />
    {$page.data.appLabels.viewTexts.questionsTip}
  </svelte:fragment>

  <svelte:fragment slot="hero">
    {#if emoji}
      <HeroEmoji>{emoji}</HeroEmoji>
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="banner">
    <Button href="/help" variant="icon" icon="help" text={$page.data.appLabels.actionLabels.help} />
  </svelte:fragment>

  <p class="text-center">
    {opinionsDescriptionText}
  </p>

  <svelte:fragment slot="primaryActions">
    <Button
      href={firstQuestionUrl}
      variant="main"
      icon="next"
      text={$page.data.appLabels.actionLabels.startQuestions} />
  </svelte:fragment>
</BasicPage>
