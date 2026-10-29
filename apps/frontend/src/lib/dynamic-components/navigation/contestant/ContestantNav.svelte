<!--
@component A template part that outputs the navigation menu for the Contestant App for use in `Layout`.

### Dynamic component

- Accesses the `ContestantContext`.

### What the menu shows

- Signed in: the home item, Help and Privacy on every page. The items of the entity being edited are shown only on a page whose URL names an entity the user edits, because their links are built from the entity in the URL. They are, in this order: nominations, profile, questions, preview and settings.
- The menu keeps one shape: an item whose page the entity cannot open is disabled, not removed, and no icon changes with the entity's state. What is closed is read from the context's task state. The profile and the questions items are closed while the entity has no nomination, and the preview item is closed until the state says the preview is open. The nominations and the settings items are never closed.
- A closed item has no link target and is dimmed. While the reason it is closed is known, it is a button announced as unavailable, which shows the reason under it when it is clicked and hides it when it is clicked again, through `NavItem`'s `disabledReason`. The reason is one sentence, the same as on the entity's home. The menu shows no reason by itself, and no item is described by one.
- Until the entity's question data is loaded the profile and the questions items are open and the preview item is closed with no reason: it is then not a tab stop and is announced as an unavailable link.
- The questions item is left out for an entity that is known to be asked no opinion question. It is rendered until that is known, so it does not disappear and come back for an entity that has questions. Its badge shows the number of unanswered opinion questions while there is one.
- On such a page the group of those items is titled with the type and the name of that entity, and marked `contestant-nav-entity-group`. Both come from the list of the entities the user edits, so the title is right before the entity's data has loaded.
- A user who edits several entities gets one more item on such a page, the last of that group: a link to the app root, where they choose another entity. It is absent on a page whose URL names no entity, where the home item leads to the same place.
- Signed out: the login item, one registration item, and the forgotten-password, Help and Privacy items. The registration item leads to the registration page and is shown exactly when the application settings list at least one registration mode, which is when that page is served.

### Properties

- Any valid properties of a `Navigation` component

### Usage

```tsx
<ContestantNav>
  <NavItem onclick={closeMenu} icon="close" text="Close"/>
</ContestantNav>
```
-->

<script lang="ts">
  import { InfoBadge } from '$lib/components/infoBadge';
  import { entityDescriptorOf } from '$lib/contestant/utils/entityDescriptor';
  import { listedRegistrationModes } from '$lib/contestant/utils/registrationOffer';
  import { userEntityDisplayName } from '$lib/contestant/utils/userEntityDisplayName';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { NavGroup, Navigation, NavItem } from '$lib/dynamic-components/navigation';
  import { LanguageSelection } from '../languages';
  import type { ContestantNavProps } from './ContestantNav.type';

  let { onKeyboardFocusOut, ...restProps }: ContestantNavProps = $props();

  const { navigation } = getLayoutContext();
  // Read reactive context getters via contestantCtx.X, never destructured.
  const contestantCtx = getContestantContext();
  const { getRoute, openFeedbackModal, t } = contestantCtx;
  /** Whether registration is offered: the settings list at least one registration mode. `appSettings` is a reactive accessor, read inside this scope. */
  const registrationOffered = $derived(listedRegistrationModes(contestantCtx.appSettings).length > 0);
  /**
   * What the items of the entity the URL names show of its tasks, read from the context's task state inside this scope: which items are closed, whether the questions item is offered, the figure of its badge, and the reason a closed item shows.
   *
   * The reason is the one the entity's home gives: the entity has no nomination, or the preview is not open yet. While the state is not known no reason is given.
   */
  const entityItems = $derived.by(() => {
    const taskState = contestantCtx.taskState;
    const nomination = taskState.tasks.find((task) => task.id === 'nomination');
    const profile = taskState.tasks.find((task) => task.id === 'profile');
    const questions = taskState.tasks.find((task) => task.id === 'questions');
    const previewClosed = !contestantCtx.previewOpen;
    let reason: { reason: 'noNomination' | 'previewNotReady'; sentence: string } | undefined;
    if (nomination?.status === 'incomplete') {
      reason = {
        reason: 'noNomination',
        sentence: t(entityDescriptorOf(contestantCtx.selectedEntity?.type).closedReasonNoNomination)
      };
    } else if (taskState.known && previewClosed) {
      reason = {
        reason: 'previewNotReady',
        sentence: questions
          ? t('contestantApp.common.closedReason.preview')
          : t('contestantApp.common.closedReason.previewNoQuestions')
      };
    }
    return {
      profileClosed: profile?.status === 'blocked',
      questionsClosed: questions?.status === 'blocked',
      previewClosed,
      // Left out only once the state is known and lists no questions task. An entity with no nomination always has the task, blocked.
      questionsOffered: !taskState.known || !!questions,
      unansweredQuestions: questions?.count ?? 0,
      reason
    };
  });
  /** The title naming the entity the URL names, when the user edits it. selectedEntity and dataRoot are read inside the tracking scope. */
  const entityTitle = $derived.by(() => {
    const selected = contestantCtx.selectedEntity;
    if (!selected) return undefined;
    return t('contestantApp.entitySelection.current', {
      entityType: t(`common.${selected.type}.singular`),
      name: userEntityDisplayName(selected, contestantCtx.dataRoot)
    });
  });

  /**
   * What an item is passed beside `disabled` while it is closed: the dimming of a disabled label, and, while no reason is known, the link role, on which its unavailable state is announced although it has no link target. An item closed for a known reason is a button that shows the reason, so it is passed no role. An open item is passed nothing, because its link target gives it its role.
   * @param closed - Whether the item is closed.
   * @returns The attributes to spread onto the item.
   */
  function closedItemProps(closed: boolean) {
    if (!closed) return {};
    if (entityItems.reason) return { class: '!text-neutral/20' } as const;
    return { role: 'link', class: '!text-neutral/20' } as const;
  }

  /**
   * The reason a closed item shows, while one is known, or nothing.
   * @param closed - Whether the item is closed.
   * @returns The sentence to pass as the item's `disabledReason`.
   */
  function reasonOf(closed: boolean): string | undefined {
    return closed ? entityItems.reason?.sentence : undefined;
  }

  /** The attributes of a shown reason: its test id and the reason it gives. */
  const reasonProps = $derived({
    'data-testid': 'contestant-nav-closed-reason',
    'data-reason': entityItems.reason?.reason
  });
</script>

<Navigation {onKeyboardFocusOut} {...restProps}>
  <NavItem onclick={navigation.close} icon="close" text={t('common.closeMenu')} class="pt-16" id="drawerCloseButton" />
  {#if contestantCtx.isAuthenticated}
    <NavGroup title={entityTitle} data-testid={entityTitle ? 'contestant-nav-entity-group' : undefined}>
      <NavItem
        href={contestantCtx.homeRoute}
        icon="home"
        text={t('contestantApp.common.home')}
        data-testid="contestant-nav-home" />
      <!-- The links below are built from the entity in the URL, so they exist only where the URL names one. -->
      {#if contestantCtx.selectedEntity}
        <NavItem
          href={getRoute.current('ContestantAppNominations')}
          icon="election"
          text={t('contestantApp.nominations.title')}
          data-testid="contestant-nav-nominations" />
        <NavItem
          href={getRoute.current('ContestantAppProfile')}
          icon="profile"
          text={t('contestantApp.basicInfo.title')}
          disabled={entityItems.profileClosed}
          disabledReason={reasonOf(entityItems.profileClosed)}
          disabledReasonProps={reasonProps}
          {...closedItemProps(entityItems.profileClosed)}
          data-testid="contestant-nav-profile" />
        {#if entityItems.questionsOffered}
          <NavItem
            href={getRoute.current('ContestantAppQuestions')}
            icon="opinion"
            text={t('contestantApp.questions.title')}
            disabled={entityItems.questionsClosed}
            disabledReason={reasonOf(entityItems.questionsClosed)}
            disabledReasonProps={reasonProps}
            {...closedItemProps(entityItems.questionsClosed)}
            data-testid="contestant-nav-questions">
            {#if entityItems.unansweredQuestions > 0}
              <InfoBadge text={String(entityItems.unansweredQuestions)} classes="-left-8 -top-4" />
            {/if}
          </NavItem>
        {/if}
        <NavItem
          href={getRoute.current('ContestantAppPreview')}
          icon="previewProfile"
          text={t('contestantApp.preview.title')}
          disabled={entityItems.previewClosed}
          disabledReason={reasonOf(entityItems.previewClosed)}
          disabledReasonProps={reasonProps}
          {...closedItemProps(entityItems.previewClosed)}
          data-testid="contestant-nav-preview" />
        <NavItem
          href={getRoute.current('ContestantAppSettings')}
          icon="settings"
          text={t('contestantApp.settings.title')}
          data-testid="contestant-nav-settings" />
        <!-- The app root is where a user with several entities chooses one. -->
        {#if contestantCtx.entities.length > 1}
          <NavItem
            href={getRoute.current('ContestantAppHome')}
            icon="sync"
            text={t('contestantApp.entitySelection.switch')}
            data-testid="contestant-nav-switch-entity" />
        {/if}
      {/if}
    </NavGroup>
    <NavGroup>
      <NavItem href={getRoute.current('ContestantAppHelp')} icon="help" text={t('contestantApp.help.title')} />
      <NavItem
        href={getRoute.current('ContestantAppPrivacy')}
        icon="privacy"
        text={t('contestantApp.privacy.shortTitle')} />
    </NavGroup>
  {:else}
    <NavGroup>
      <NavItem href={getRoute.current('ContestantAppLogin')} icon="login" text={t('common.login')} />
      {#if registrationOffered}
        <NavItem
          href={getRoute.current('ContestantAppRegister')}
          icon="create"
          text={t('contestantApp.register.register')} />
      {/if}
    </NavGroup>
    <NavGroup>
      <NavItem
        href={getRoute.current('ContestantAppForgotPassword')}
        icon="help"
        text={t('contestantApp.login.forgotPassword')} />
      <NavItem href={getRoute.current('ContestantAppHelp')} icon="help" text={t('contestantApp.help.title')} />
      <NavItem
        href={getRoute.current('ContestantAppPrivacy')}
        icon="privacy"
        text={t('contestantApp.privacy.shortTitle')} />
    </NavGroup>
  {/if}
  {#if openFeedbackModal.current}
    <NavGroup>
      <NavItem onclick={openFeedbackModal.current} icon="feedback" text={t('feedback.send')} />
    </NavGroup>
  {/if}
  <LanguageSelection />
</Navigation>
