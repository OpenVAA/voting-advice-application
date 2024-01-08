<script lang="ts">
  import {page} from '$app/stores';
  import {_} from 'svelte-i18n';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {BasicPage} from '$lib/templates/basicPage';
  import Button from '$lib/components/button/Button.svelte';

  const firstQuestionUrl = `${$page.url.pathname.replace(/\/$/, '')}/${$page.data.questions[0].id}`;

  const questionCategories = new Set<string>();
  $page.data.questions.forEach((question) => {
    if (question.category) questionCategories.add(question.category);
  });

  const numQuestions = $page.data.questions.length.toString();
</script>

<BasicPage title={$_('candidateApp.opinions.title')}>
  <svelte:fragment slot="note">
    <Icon name="tip" />
    {$_('candidateApp.opinions.tip')}
  </svelte:fragment>

  <p class="text-center">
    {$_('candidateApp.opinions.instructions', {values: {numQuestions}})}
  </p>

  <svelte:fragment slot="primaryActions">
    <Button
      href={firstQuestionUrl}
      variant="main"
      icon="next"
      text={$_('candidateApp.opinions.continue')} />
  </svelte:fragment>
</BasicPage>
