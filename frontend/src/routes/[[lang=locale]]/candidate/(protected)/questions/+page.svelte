<script lang="ts">
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {Icon} from '$lib/components/icon';
  import {BasicPage} from '$lib/templates/basicPage';

  const firstQuestionUrl = $getRoute({
    route: Route.CandAppQuestions,
    id: $page.data.opinionQuestionsSync?.[0]?.id
  });
  const questionCategories = new Set<string>();

  if ($page.data.opinionQuestionsSync)
    $page.data.opinionQuestionsSync.forEach((question) => {
      if (question.category) questionCategories.add(question.category.id);
    });

  const numQuestions = $page.data.opinionQuestionsSync?.length ?? 0;
</script>

<BasicPage title={$t('candidateApp.opinions.title')}>
  <svelte:fragment slot="note">
    <Icon name="tip" />
    {$t('candidateApp.opinions.tip')}
  </svelte:fragment>

  <p class="text-center">
    {$t('candidateApp.opinions.instructions', {numQuestions})}
  </p>

  <Button
    slot="primaryActions"
    href={firstQuestionUrl}
    variant="main"
    icon="next"
    text={$t('candidateApp.opinions.continue')} />
</BasicPage>
