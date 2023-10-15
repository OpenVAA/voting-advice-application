<script lang="ts">
  import {page} from '$app/stores';
  import {BasicPage} from '$lib/components/basicPage';
  import {TipIcon} from '$lib/components/icons';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {NextButton} from '$lib/components/nextButton';

  const firstQuestionUrl = `${$page.url.pathname.replace(/\/$/, '')}/${$page.data.questions[0].id}`;

  const questionCategories = new Set<string>();
  $page.data.questions.forEach((question) => {
    if (question.category) questionCategories.add(question.category);
  });

  const opinionsDescriptionText = $page.data.appLabels.viewTexts.yourOpinionsDescription
    .replace('{{0}}', $page.data.questions.length.toString())
    .replace('{{1}}', questionCategories.size.toString());
</script>

<BasicPage title={$page.data.appLabels.viewTexts.yourOpinionsTitle}>
  <svelte:fragment slot="aside">
    <TipIcon />
    {$page.data.appLabels.viewTexts.questionsTip}
  </svelte:fragment>

  <HeroEmoji slot="hero">💬</HeroEmoji>

  <p class="text-center">{opinionsDescriptionText}</p>

  <svelte:fragment slot="primaryActions">
    <NextButton href={firstQuestionUrl}
      >{$page.data.appLabels.actionLabels.startQuestions}</NextButton>
  </svelte:fragment>
</BasicPage>
