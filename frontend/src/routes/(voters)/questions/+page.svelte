<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';

  const firstQuestionUrl = `${$page.url.pathname.replace(/\/$/, '')}/${$page.data.questions[0].id}`;
</script>

<div class="flex max-w-xl flex-grow flex-col justify-center p-lg">
  <h1 class="my-lg">
    {$page.data.appLabels.viewTexts.yourOpinionsTitle}
  </h1>
  <p class="text-center">{$page.data.appLabels.viewTexts.yourOpinionsDescription}</p>
  <a href={firstQuestionUrl} class="btn-primary btn"
    >{$page.data.appLabels.actionLabels.startQuestions}</a>
</div>
<div class="mb-60 p-lg text-center text-sm text-secondary">
  <img class="inline w-14" src="/icons/tip.svg" alt="" srcset="" />
  {$page.data.appLabels.viewTexts.questionsTip}
</div>
