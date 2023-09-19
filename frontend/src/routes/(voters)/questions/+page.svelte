<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';

  const firstQuestionUrl = `${$page.url.pathname.replace(/\/$/, '')}/${$page.data.questions[0].id}`;
</script>

<div class="flex flex-col items-center gap-4 p-4">
  <h1 class="text-3xl font-medium leading-6 text-gray-500">
    {$page.data.appLabels.viewTexts.yourOpinionsTitle}
  </h1>
  <div class="my-2">
    <p>{$page.data.appLabels.viewTexts.yourOpinionsDescription}</p>
  </div>
  <a href={firstQuestionUrl} class="btn-primary btn"
    >{$page.data.appLabels.actionLabels.startQuestions}</a>
</div>
