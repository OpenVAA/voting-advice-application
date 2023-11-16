<script lang="ts">
  import {page} from '$app/stores';

  const firstQuestionUrl = `${$page.url.pathname.replace(/\/$/, '')}/${$page.data.questions[0].id}`;

  const questionCategories = new Set<string>();
  $page.data.questions.forEach((question) => {
    if (question.category) questionCategories.add(question.category);
  });

  const opinionsDescriptionText = $page.data.appLabels.viewTexts.yourOpinionsDescription
    .replace('{{0}}', $page.data.questions.length.toString())
    .replace('{{1}}', questionCategories.size.toString());
</script>

<div class="flex max-w-xl flex-grow flex-col justify-center p-lg">
  <h1 class="my-lg">
    {$page.data.appLabels.viewTexts.yourOpinionsTitle}
  </h1>
  <p class="text-center">{opinionsDescriptionText}</p>
  <a href={firstQuestionUrl} class="btn btn-primary"
    >{$page.data.appLabels.actionLabels.startQuestions}</a>
</div>
<div class="mb-60 p-lg text-center text-sm text-secondary">
  <img class="inline w-14" src="/icons/tip.svg" alt="" srcset="" />
  {$page.data.appLabels.viewTexts.questionsTip}
</div>
