<!--@component

# Contestant app entity home page

Shows the user what is left to do for the entity they edit, a candidate or an organization, to be included in the VAA. The page is the entity's task list, and everything it shows of the tasks is read from the context's task state: each row's status, whether the preview is open, why an entry is closed and where the main action leads. The page holds no completeness rule of its own.

Everything that differs by entity type is read from the descriptor of the selected entity's type.

### What the page shows

- A user who edits more than one entity is offered Switch profile at the top of the page, above the title: a link to the app root, where another entity is chosen, which leads with the sync icon. A user who edits one is not.
- The title greets the user by the name of the selected entity, which is known on the server. Once every task is complete the title says the entity is ready instead, above a success emoji.
- An explanation says what is left: what a nomination is for an entity that has none, what there is to fill in for one that has, and that nothing is left once every task is complete, followed then by a tip about the preview.
- While the account's address awaits the link mailed to it, the list's first row is the task of confirming it: a link to the settings page, where the link can be mailed again and another address given, whose label names the address and which leads with a mail icon. It is not one of the entity's tasks: it shows no status, closes nothing and the main action does not lead to it. Whichever entity's home the user opens shows it; an account whose address is proved, or that did not register with an identity provider, sees nothing of it.
- The entity's tasks — its nomination, its profile and its opinion questions — are the next items of that ordered list. Each row is a button that leads where the task state says the task leads — for an entity with no nomination, into the nomination editor while nominations can be edited and to the nominations view while they cannot — and says the task's status three ways: by its leading icon, by a badge on an incomplete task, and by a sentence inside the button's own name. A row whose task is blocked is shown disabled. An entity that is asked no opinion question has no questions row.
- The preview entry is the list's last item and is not a task. It is disabled while the preview is closed.
- Every entry that cannot be entered, a blocked row and the closed preview alike, leads with a lock in place of its own icon.
- The list is at least as wide as the small container, or as the content where that is narrower, so that short labels do not leave it narrow.
- One sentence under the entries says why the closed ones are closed, and is absent when none is.
- The main action leads to the first incomplete task and carries that row's label, and leads to the preview once every task is complete.
- While answers are locked a note above the title says so and, for an entity that has a nomination, that the entity is hidden from voters when it is.

### While the task state is not known

An entity with no nomination is known on the server, so its page waits for nothing. For an entity that has a nomination the question lists are loaded in the browser, and until they are the page says nothing of what is left: the nomination row is complete, the other rows are links with no status, the preview entry is disabled with no reason and the main action is a disabled button in its loading form. The places of the explanation and of the reason sentence are held by invisible paragraphs hidden from assistive technology, so the rows do not move when the sentences appear.

### Settings

- `entities.hideIfMissingAnswers`: Whether the note says the entity is hidden from voters while an opinion question is unanswered. The key read is that of the selected entity's type.
- `access.answersLocked`: Whether the note is shown, and whether the profile's and the questions' labels read "view". Read as the context's `answersLocked`.

### Accessibility

- The email task's address is part of its link's name. It is never hyphenated, and it wraps at any character rather than overflowing.
- The task list is an `<ol>` named by a label, so each row is announced with its position. It states its role, so that it stays a list where its markers are styled away.
- A row's status sentence is part of its button's accessible name and is heard once; the badge is hidden from assistive technology.
- A closed entry is a button with no link target that is not a tab stop, announced as unavailable and described by the reason sentence, which follows the entries it explains in reading order.
-->

<script lang="ts">
  import { NotEditableNote } from '$contestant/components/notEditableNote';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { InfoBadge } from '$lib/components/infoBadge';
  import { LogoutButton } from '$lib/contestant/components/logoutButton';
  import { homeAction, taskLabelKey } from '$lib/contestant/tasks';
  import { entityDescriptorOf } from '$lib/contestant/utils/entityDescriptor';
  import { isHiddenIfMissingAnswers } from '$lib/contestant/utils/hideIfMissingAnswers';
  import { getContestantContext } from '$lib/contexts/contestant';
  import type { IconName } from '$lib/components/icon';
  import type { Task, TaskId } from '$lib/contestant/tasks';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Read the reactive context getters via contestantCtx.X.
  const contestantCtx = getContestantContext();
  const { getRoute, t } = contestantCtx;
  // appSettings is a reactive accessor — read via contestantCtx.X, never destructure.
  const appSettings = $derived(contestantCtx.appSettings);

  ////////////////////////////////////////////////////////////////////
  // The task state
  ////////////////////////////////////////////////////////////////////

  /** The id of the reason sentence, which every closed entry names as its description. */
  const CLOSED_REASON_ID = 'contestant-home-closed-reason';

  /** Each task's own icon. */
  const TASK_ICON: Record<TaskId, IconName> = { nomination: 'election', profile: 'profile', questions: 'opinion' };

  /** The test id of each task's button. */
  const TASK_TEST_ID: Record<TaskId, string> = {
    nomination: 'contestant-home-nomination',
    profile: 'contestant-home-profile',
    questions: 'contestant-home-questions'
  };

  const answersLocked = $derived(contestantCtx.answersLocked);

  /** Everything that differs by entity type. Read from the selected entity, which is known on the server. */
  const descriptor = $derived(entityDescriptorOf(contestantCtx.selectedEntity?.type));

  /** The state of the entity's tasks. The context replaces it whole, so it is read as one value and never destructured. */
  const taskState = $derived(contestantCtx.taskState);

  /** Whether the task state is not known yet. Nothing is then said of what is left to do. */
  const pending = $derived(!taskState.known);

  /** Whether every task the entity has is complete. */
  const allComplete = $derived(contestantCtx.profileComplete);

  /** Whether the entity is asked opinion questions, as far as the task state lists them. */
  const hasQuestionsTask = $derived(taskState.tasks.some((task) => task.id === 'questions'));

  /**
   * Why entries are closed, with the sentence that says so, or `undefined` when no sentence applies: nothing is closed, or the state is not known. While the entity has no nomination every entry but the nomination is closed for that; otherwise only the preview can be.
   */
  const closedReason = $derived.by(() => {
    if (taskState.tasks.some((task) => task.id === 'nomination' && task.status === 'incomplete')) {
      return { reason: 'noNomination', sentence: t(descriptor.closedReasonNoNomination) } as const;
    }
    if (taskState.known && !taskState.previewOpen) {
      return {
        reason: 'previewNotReady',
        sentence: hasQuestionsTask
          ? t('contestantApp.common.closedReason.preview')
          : t('contestantApp.common.closedReason.previewNoQuestions')
      } as const;
    }
    return undefined;
  });

  ////////////////////////////////////////////////////////////////////
  // The title and the sentences
  ////////////////////////////////////////////////////////////////////

  /** The name the title greets the user by: that of the selected entity. */
  const selectedName = $derived.by(() => {
    const selected = contestantCtx.selectedEntity;
    return selected ? descriptor.greetingName(selected) : undefined;
  });

  /** The title: the greeting, and once every task is complete the sentence that says the entity is ready. */
  const title = $derived(
    allComplete ? t('contestantApp.home.ready') : t('contestantApp.common.greeting', { username: selectedName ?? '' })
  );

  /** The explanation under the title, for a task state that is known. */
  const explanation = $derived.by(() => {
    if (allComplete) return t('contestantApp.home.ingress.ready');
    if (closedReason?.reason === 'noNomination') return t(descriptor.homeNoNomination);
    return t(hasQuestionsTask ? descriptor.homeNotDone : descriptor.homeNotDoneNoQuestions);
  });

  /**
   * Whether the note says the entity is hidden from voters: a required info question is unanswered, or an opinion question is and the setting hides an entity of this type for that. An entity with no nomination and a state that is not known list no such task.
   */
  const hiddenForMissingAnswers = $derived(
    taskState.tasks.some((task) => task.id === 'profile' && task.count !== undefined) ||
      (taskState.tasks.some((task) => task.id === 'questions' && task.status === 'incomplete') &&
        isHiddenIfMissingAnswers({ entityType: contestantCtx.selectedEntity?.type, appSettings }))
  );

  ////////////////////////////////////////////////////////////////////
  // The rows and the main action
  ////////////////////////////////////////////////////////////////////

  /** The main action. */
  const action = $derived(homeAction(contestantCtx.taskState));

  /** The main action's label: that of the row of the task it leads to, and otherwise the preview's. */
  const actionLabel = $derived.by(() => {
    const task = action.kind === 'task' ? taskState.tasks.find(({ id }) => id === action.task) : undefined;
    return task ? t(taskLabelKey(task, answersLocked)) : t('contestantApp.home.preview');
  });

  /**
   * The address that awaits the link mailed to it, which the email task names, or `undefined` while there is none: the account's address is proved, or the account did not register with an identity provider.
   */
  const pendingEmail = $derived(
    contestantCtx.user?.addressState === 'pending' ? contestantCtx.user.pendingEmail || undefined : undefined
  );

  /**
   * The icon an entry leads with: a lock for one that cannot be entered, and otherwise its own.
   */
  function entryIcon(enterable: boolean, own: IconName): IconName {
    return enterable ? own : 'locked';
  }

  /**
   * The icon a row leads with: a check for a complete task, a lock for a blocked one, and otherwise the task's own.
   */
  function rowIcon(task: Task): IconName {
    if (task.status === 'complete') return 'check';
    return entryIcon(task.status !== 'blocked', TASK_ICON[task.id]);
  }

  /**
   * The sentence that says a row's status to assistive technology, or `undefined` for a task whose status is not known yet.
   */
  function statusSentence(task: Task): string | undefined {
    switch (task.status) {
      case 'complete':
        return t('contestantApp.home.taskStatus.complete');
      case 'blocked':
        return t('contestantApp.home.taskStatus.blocked');
      case 'incomplete':
        return task.count === undefined
          ? t('contestantApp.home.taskStatus.incomplete')
          : t('contestantApp.home.taskStatus.incompleteCount', { count: task.count });
      default:
        return undefined;
    }
  }
</script>

{#snippet successHero()}
  <figure role="presentation">
    <HeroEmoji emoji={t('dynamic.success.heroEmoji')} />
  </figure>
{/snippet}

<MainContent {title} hero={allComplete ? successHero : undefined}>
  {#snippet note()}
    <!-- The app root is where a user with several entities chooses one. -->
    {#if contestantCtx.entities.length > 1}
      <Button
        text={t('contestantApp.entitySelection.switch')}
        icon="sync"
        iconPos="left"
        href={getRoute.current('ContestantAppHome')}
        data-testid="contestant-home-switch-profile" />
    {/if}
    {#if answersLocked}
      <NotEditableNote reason="answersLocked" data-testid="contestant-answers-locked-warning">
        {#if hiddenForMissingAnswers}
          {t('contestantApp.common.isHiddenBecauseMissing')}
        {/if}
      </NotEditableNote>
    {/if}
  {/snippet}

  {#if pending}
    <p class="invisible text-center" aria-hidden="true">
      {t(descriptor.homeNotDone)}
    </p>
  {:else}
    <p class="text-center" data-testid="contestant-home-status">
      {explanation}
    </p>
  {/if}

  {#if allComplete}
    <p class="text-center" data-testid="contestant-home-tip">
      {t('contestantApp.home.previewTip')}
    </p>
  {/if}

  <ol
    class="mt-lg soft-min-w-sm list-none pl-0"
    role="list"
    aria-label={t('contestantApp.home.tasksLabel')}
    data-testid="contestant-home-tasks"
    data-task-state={pending ? 'pending' : 'ready'}>
    {#if pendingEmail}
      <li data-testid="contestant-home-email-pending">
        <Button
          text={t('contestantApp.home.emailTask', { email: pendingEmail })}
          icon="mail"
          iconPos="left"
          href={getRoute.current('ContestantAppSettings')}
          class="wrap-anywhere hyphens-none" />
      </li>
    {/if}
    {#each taskState.tasks as task (task.id)}
      {@const blocked = task.status === 'blocked'}
      {@const sentence = statusSentence(task)}
      <li data-testid="contestant-home-task" data-task={task.id} data-status={task.status ?? 'pending'}>
        <Button
          text={t(taskLabelKey(task, answersLocked))}
          icon={rowIcon(task)}
          iconPos="left"
          href={getRoute.current(task.route)}
          disabled={blocked}
          aria-describedby={blocked && closedReason ? CLOSED_REASON_ID : undefined}
          data-testid={TASK_TEST_ID[task.id]}>
          {#snippet badge()}
            {#if task.status === 'incomplete'}
              <span aria-hidden="true" data-testid="contestant-home-task-badge">
                <InfoBadge text={task.count ?? '!'} />
              </span>
            {/if}
            {#if sentence}
              <span class="sr-only">{sentence}</span>
            {/if}
          {/snippet}
        </Button>
      </li>
    {/each}
    <li>
      <Button
        text={t('contestantApp.home.preview')}
        icon={entryIcon(taskState.previewOpen, 'previewProfile')}
        iconPos="left"
        href={getRoute.current('ContestantAppPreview')}
        disabled={!taskState.previewOpen}
        aria-describedby={!taskState.previewOpen && closedReason ? CLOSED_REASON_ID : undefined}
        data-testid="contestant-home-preview"
        data-preview={taskState.previewOpen ? 'open' : 'closed'} />
    </li>
  </ol>

  {#if pending}
    <p class="small-info mt-sm invisible text-center" aria-hidden="true">
      {t('contestantApp.common.closedReason.preview')}
    </p>
  {:else if closedReason}
    <p
      class="small-info mt-sm text-center"
      id={CLOSED_REASON_ID}
      data-testid="contestant-home-closed-reason"
      data-reason={closedReason.reason}>
      {closedReason.sentence}
    </p>
  {/if}

  {#snippet primaryActions()}
    <div class="flex w-full flex-col items-center justify-center">
      {#if action.kind === 'pending'}
        <Button variant="main" text={actionLabel} loading data-testid="contestant-home-continue" />
      {:else}
        <Button
          variant="main"
          text={actionLabel}
          icon="next"
          href={getRoute.current(action.route)}
          data-testid="contestant-home-continue"
          data-next-step={action.kind === 'task' ? action.task : 'preview'} />
      {/if}
      <LogoutButton variant="normal" icon={undefined} data-testid="contestant-home-logout" />
    </div>
  {/snippet}
</MainContent>
