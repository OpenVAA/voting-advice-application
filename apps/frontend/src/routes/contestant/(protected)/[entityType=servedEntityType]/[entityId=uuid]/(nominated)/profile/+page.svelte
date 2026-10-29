<!--@component

# Contestant app profile basic info page

Shows the basic information of the entity the user edits, a candidate or an organization, some of which is editable.

- The identity section holds the entity's name fields: a candidate's first and last name, or an organization's name and short name by locale. They are editable while the entity is unconfirmed and answers are not locked, and locked otherwise; the section says which. The locked info questions follow them.
- The editable section holds the image, an organization's colour and the editable info questions. They are locked only while answers are locked. Beside an image that is shown, a Remove button stages its removal, which a save stores; it is not shown while answers are locked.
- One Save button stores every edit of the page. A stored save leads on: to the questions list when the profile is then complete and an opinion question is unanswered, and to the entity's home otherwise. The button's label says which before the save, from the saved data with the draft. A save that fails, and one in which the backend refuses a changed name because the entity has been confirmed, stay on the page: each puts its own sentence into the message region above the button, which is in the document from the start so that the message is announced, and focus returns to the button. A save that fails reads the page's data again first: when that read finds answers locked, the note that answers can no longer be edited says why in place of the failure, and focus moves to the Return button that replaces Save.

Which fields a profile has, and every text that differs between the two entity types, is read from the descriptor of the selected entity's type. Whether a name field is editable is one rule for both types. Both are read from the list of the user's entities, so they are right on the server and before the entity's data is in the store.

### Settings

- `entities.hideIfMissingAnswers`: Affects message shown. The key read is that of the selected entity's type.
- `access.answersLocked`: Locks every field and removes the Save button.
-->

<script lang="ts">
  import { getCustomData, isLocalizedString, log } from '@openvaa/app-shared';
  import { tick } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { NotEditableNote } from '$contestant/components/notEditableNote';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Icon } from '$lib/components/icon';
  import { iconBadgeClass, Input, InputGroup, QuestionInput } from '$lib/components/input';
  import PreventNavigation from '$lib/components/preventNavigation/PreventNavigation.svelte';
  import { SuccessMessage } from '$lib/components/successMessage';
  import { hasNomination, profileSaveTarget, taskStateOf, unansweredQuestionsOf } from '$lib/contestant/tasks';
  import { entityDescriptorOf } from '$lib/contestant/utils/entityDescriptor';
  import { isHiddenIfMissingAnswers } from '$lib/contestant/utils/hideIfMissingAnswers';
  import { isNameEditable, isRequiredNameMissing, nameState, requiredNameLocale } from '$lib/contestant/utils/nameRule';
  import { opinionQuestionsStateOf } from '$lib/contestant/utils/opinionQuestionsState';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import type { LocalizedAnswer } from '@openvaa/app-shared';
  import type { Id } from '@openvaa/core';
  import type { AnyQuestionVariant } from '@openvaa/data';
  import type { EditableEntityProps } from '$lib/api/base/dataWriter.type';
  import type { IdentityFieldDescriptor } from '$lib/contestant/utils/entityDescriptor';
  import type { NameState } from '$lib/contestant/utils/nameRule';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Read the reactive context getters via contestantCtx.X.
  const contestantCtx = getContestantContext();
  const { getRoute, t, userData } = contestantCtx;
  // appSettings is a reactive accessor — read via contestantCtx.X, never destructure.
  const appSettings = $derived(contestantCtx.appSettings);
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // State variables
  ////////////////////////////////////////////////////////////////////

  let bypassPreventNavigation = $state(false);
  let status = $state<ActionStatus>('idle');

  /** What the last save left to say, while it did not lead on to another page: which of the two outcomes, and the sentence for it. */
  let saveMessage = $state<{ outcome: 'failed' | 'name-refused'; text: string } | undefined>();
  /** The entity whose changed name the backend has refused. A refusal means that the entity has been confirmed, whatever the list of the user's entities says until it is read again. */
  let nameRefusedFor = $state<Id | undefined>();
  /** The element that holds the page's buttons, through which focus is returned to the Save button. */
  let actions = $state<HTMLElement | undefined>();
  /** The element that holds the editable fields, through which focus is moved to the image field once its image is removed. */
  let editableFields = $state<HTMLElement | undefined>();

  ////////////////////////////////////////////////////////////////////
  // The entity's type and the name rule
  ////////////////////////////////////////////////////////////////////

  /** Everything that differs by entity type. Read from the selected entity, which is known on the server and before the store holds the entity's data. */
  const descriptor = $derived(entityDescriptorOf(contestantCtx.selectedEntity?.type));

  /** The selected entity as the name rule reads it: confirmed once a save of its names was refused. */
  const nameRuleEntity = $derived.by(() => {
    const entity = contestantCtx.selectedEntity;
    return entity && entity.id === nameRefusedFor ? { confirmed: true } : entity;
  });

  /** Why the name fields are or are not editable, and whether they are. One rule for every name field of both entity types. */
  const currentNameState = $derived(nameState(nameRuleEntity, contestantCtx.answersLocked));
  const nameEditable = $derived(isNameEditable(nameRuleEntity, contestantCtx.answersLocked));

  /** The id of the sentence above the name fields, which is their description. */
  const NAME_NOTE_ID = 'profile-name-note';

  /** Which of the descriptor's two name sentences a name state shows. A name locked by the answers lock has none: the page's note explains it. */
  const NAME_SENTENCE: Record<NameState, 'editable' | 'locked' | undefined> = {
    editable: 'editable',
    'locked-confirmed': 'locked',
    'locked-answers': undefined
  };

  const nameSentence = $derived.by(() => {
    const member = NAME_SENTENCE[currentNameState];
    return member ? t(descriptor.nameSentence[member]) : undefined;
  });

  /** The name fields with one field for each locale, which stand on their own, and those with a single line, which are rows of the group the locked info questions are in. */
  const localizedNameFields = $derived(
    descriptor.identityFields.filter((field) => field.inputType === 'text-multilingual')
  );
  const singleLineNameFields = $derived(descriptor.identityFields.filter((field) => field.inputType === 'text'));

  const lockedInfoQuestions = $derived(contestantCtx.infoQuestions.filter((q) => getCustomData(q).locked));

  /** Whether the store holds the entity's data. It does not on the server, nor in the browser before the entity's layout has filled it. */
  const entityLoaded = $derived(userData.current !== undefined);

  /** The colour field's texts, for an entity type that is offered one. */
  const colorField = $derived.by(() => {
    const field = descriptor.colorField;
    return field.offered ? { label: t(field.label), info: t(field.info) } : undefined;
  });

  /** Whether the entity is told that missing answers hide it from voters: the setting's key is that of the entity's type. */
  const hiddenIfMissingAnswers = $derived(
    isHiddenIfMissingAnswers({ entityType: contestantCtx.selectedEntity?.type, appSettings })
  );

  /** The instructions name the opinion questions only for an entity that has some to answer, or whose questions are not loaded yet. */
  const instructions = $derived(
    t(
      opinionQuestionsStateOf({
        questionsReady: contestantCtx.questionsReady,
        questionCount: contestantCtx.opinionQuestions.length
      }) === 'none'
        ? descriptor.instructionsNoQuestions
        : descriptor.instructions
    )
  );

  /**
   * A member of an object that may not have it, read by its name.
   */
  function memberOf(source: object | undefined, name: string): unknown {
    return source && Object.hasOwn(source, name) ? (source as Record<string, unknown>)[name] : undefined;
  }

  /**
   * The text of a single-line name field: the store's, unsaved edits included, and the listed entity's while the store is empty.
   */
  function singleLineName(property: IdentityFieldDescriptor['property']): string | undefined {
    const value = memberOf(userData.current?.entity, property) ?? memberOf(contestantCtx.selectedEntity, property);
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * The entries by locale of a name field that has one for each locale, unsaved edits included. A plain object, as an `Input` needs its value.
   */
  function localizedName(property: IdentityFieldDescriptor['property']): LocalizedString | undefined {
    const value = memberOf(userData.current?.localizedNames, property);
    return isLocalizedString(value) ? value : undefined;
  }

  /**
   * Whether a name field is marked as required: only while the names are editable, and only a field the descriptor requires.
   */
  function isRequired(field: IdentityFieldDescriptor): boolean {
    return nameEditable && field.required !== 'never';
  }

  /** Whether a required name is missing in what the page shows, once the entity's data is in the store. A locked name is never missing. */
  const requiredNameMissing = $derived.by(() => {
    const current = userData.current;
    if (!nameEditable || !current) return false;
    const names = { text: current.entity, byLocale: current.localizedNames ?? {} };
    return descriptor.identityFields.some((field) => isRequiredNameMissing(field, names));
  });

  ////////////////////////////////////////////////////////////////////
  // Handle saving answers and define submit label and notes
  ////////////////////////////////////////////////////////////////////

  /** How many required info questions have no answer in what the page shows: the saved data with the draft. */
  const shownUnansweredRequiredInfoCount = $derived(
    unansweredQuestionsOf(contestantCtx.requiredInfoQuestions, userData.current?.entity.answers).length
  );

  let allRequiredFilled = $derived(shownUnansweredRequiredInfoCount === 0 && !requiredNameMissing);

  let canSubmit = $derived(status !== 'loading');

  /**
   * Where a save would lead, for the label: asked of the entity's task state as it will be once the page's draft is saved, with the required info and the names counted over what the page shows in place of the saved ones. Nothing is decided from a draft while the saved state is not known.
   */
  const prospectiveTarget = $derived.by(() => {
    const saved = contestantCtx.taskState;
    if (!saved.known) return profileSaveTarget(saved);
    const unansweredOpinionQuestions = contestantCtx.unansweredOpinionQuestions;
    return profileSaveTarget(
      taskStateOf({
        // A known state is one whose entity is known and, where the entity has a nomination, whose question lists are loaded.
        entityKnown: true,
        hasNomination: hasNomination(contestantCtx.nominations),
        questionsReady: true,
        unansweredRequiredInfoCount: shownUnansweredRequiredInfoCount,
        requiredNameMissing,
        opinionCount: contestantCtx.opinionQuestions.length,
        unansweredOpinionCount: unansweredOpinionQuestions.length,
        firstUnansweredOpinionId: unansweredOpinionQuestions[0]?.id
      })
    );
  });

  const submitLabel = $derived.by(() => {
    if (prospectiveTarget.continues && !contestantCtx.answersLocked) {
      return userData.hasUnsaved ? t('common.saveAndContinue') : t('common.continue');
    }
    return contestantCtx.answersLocked || !userData.hasUnsaved ? t('common.return') : t('common.saveAndReturn');
  });

  /** The label of the button that removes the image, which names a candidate's portrait or an organization's logo, while an image is shown and can be removed. */
  const imageRemoveLabel = $derived(
    contestantCtx.answersLocked || !userData.current?.entity.image ? undefined : t(descriptor.imageRemoveLabel)
  );

  /**
   * Stage the removal of the image. The Remove button goes with the image, so focus moves to the image field's button.
   */
  async function handleImageRemove(): Promise<void> {
    userData.setImage(null);
    await tick();
    editableFields?.querySelector<HTMLElement>('[data-testid="profile-image-upload"] button')?.focus();
  }

  function handleImageInputChange(value: unknown): void {
    if (!value) {
      userData.resetImage();
      return;
    }
    const image = value as ImageWithFile;
    userData.setImage(image);
  }

  /**
   * Hand an edited name field to the store, as a plain value: a multilingual `Input` emits the object it edits in place.
   */
  function handleNameChange(property: IdentityFieldDescriptor['property'], value: unknown): void {
    userData.setProperty(property, $state.snapshot(value) as Exclude<EditableEntityProps[typeof property], undefined>);
  }

  /**
   * Hand an edited colour to the store: the one colour the user chose, or none.
   */
  function handleColorChange(value: unknown): void {
    userData.setProperty('color', typeof value === 'string' ? { normal: value } : null);
  }

  function handleQuestionInputChange({ value, question }: { value: unknown; question: AnyQuestionVariant }): void {
    const answer = { value } as LocalizedAnswer;
    userData.setAnswer(question.id, answer);
  }

  /**
   * Save every edit of the page, and lead on to the next page when it was stored. A save that was not stored whole stays on the page and says why.
   */
  async function handleSubmit(): Promise<void> {
    if (!canSubmit) {
      log.debug('[Contestant app profile page]: handleSubmit called when canSubmit is false');
      return;
    }
    status = 'loading';
    saveMessage = undefined;
    // A rejection's message can hold the backend's own text, so it is logged and never shown.
    const result = await userData.save().catch((e) => {
      log.error(`[Contestant app profile page] Error saving userData: ${e?.message}`);
      return undefined;
    });
    if (result?.type === 'success') {
      if (result.listedPropertySaved) await rereadEntityList();
      status = 'success';
      // The target is asked only now, of the state the save and the list's re-read left.
      goto(getRoute.current(profileSaveTarget(contestantCtx.taskState).route));
      return;
    }
    if (result?.type === 'nameRefused') {
      nameRefusedFor = contestantCtx.selectedEntity?.id;
      saveMessage = { outcome: 'name-refused', text: t(descriptor.nameRefusedMessage) };
      await rereadEntityList();
      status = 'idle';
    } else {
      // The page's data is read again, so that answers locked since the page was opened are seen: the database refuses the write without naming the lock where a row it hides answers with no row.
      await invalidateAll().catch((e) => {
        log.error(`[Contestant app profile page] Error reading the page data again: ${e?.message}`);
      });
      // What the re-read brought has reached the settings after one tick.
      await tick();
      if (contestantCtx.answersLocked) {
        // The note says why the save was not stored, so no failure is said.
        status = 'idle';
      } else {
        saveMessage = { outcome: 'failed', text: t('contestantApp.error.saveFailed') };
        status = 'error';
      }
    }
    // The button was disabled while the save ran, which can cost it its focus. While answers are locked the Return button stands in its place.
    await tick();
    actions?.querySelector<HTMLElement>('[data-testid="profile-submit"], [data-testid="profile-return"]')?.focus();
  }

  /**
   * Read the page's loads again, so that the list of the user's entities shows what is stored: the menu's title, and whether the entity is confirmed. It follows a save that has been stored and is never part of it, so a failure here is not a failed save. It is logged, and handled where the failure of a load is.
   */
  async function rereadEntityList(): Promise<void> {
    await invalidateAll().catch((e) => {
      log.error(`[Contestant app profile page] Error reading the page data again: ${e?.message}`);
    });
  }

  /**
   * Handle cancel button click.
   */
  function handleCancel(): void {
    bypassPreventNavigation = true;
    userData.resetUnsaved();
    goto(getRoute.current('ContestantAppEntityHome')).then(() => (bypassPreventNavigation = false));
  }

  /**
   * Reset saved answers when leaving the page.
   */
  function handleNavigationConfirm(): void {
    userData.resetUnsaved();
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-200' } });

  const subheadingClass = 'text-lg mt-lg mb-md mx-md';
</script>

<PreventNavigation
  active={() => !bypassPreventNavigation && userData.hasUnsaved && !contestantCtx.answersLocked}
  onConfirm={handleNavigationConfirm} />

<MainContent title={t('contestantApp.basicInfo.title')}>
  {#snippet note()}
    {#if contestantCtx.answersLocked}
      <NotEditableNote reason="answersLocked" data-testid="contestant-answers-locked-warning">
        {#if contestantCtx.unansweredRequiredInfoQuestions?.length !== 0 || (hiddenIfMissingAnswers && contestantCtx.unansweredOpinionQuestions?.length !== 0)}
          {t('contestantApp.common.isHiddenBecauseMissing')}
        {/if}
      </NotEditableNote>
    {:else if contestantCtx.profileComplete}
      <SuccessMessage inline message={t('contestantApp.common.fullyCompleted')} />
    {/if}
  {/snippet}

  <p class="text-center">{instructions}</p>

  <!-- The entity's names and the locked info questions -->

  <section
    class="mt-lg self-stretch"
    data-testid="contestant-profile-identity"
    data-entity-type={contestantCtx.selectedEntity?.type}
    data-name-state={currentNameState}
    data-entity-loaded={entityLoaded ? 'true' : 'false'}>
    <h2 class={subheadingClass}>{t(descriptor.identityTitle)}</h2>
    {#if nameSentence}
      <p class="mx-md" id={NAME_NOTE_ID} data-testid="contestant-profile-name-note">{nameSentence}</p>
    {/if}
    {#if lockedInfoQuestions.length}
      <p class="mx-md mt-md">{t('dynamic.contestantAppBasicInfo.identity.lockedInfo')}</p>
    {/if}

    <!-- Name fields with one field for each locale. The test id is on the container: on the control it would repeat on every locale's field. -->
    {#if localizedNameFields.length}
      <div class="gap-md mt-lg flex flex-col">
        {#each localizedNameFields as field (field.property)}
          <Input
            type="text-multilingual"
            label={t(field.label)}
            value={localizedName(field.property)}
            info={nameEditable && field.info ? t(field.info) : undefined}
            multilingualInfo=""
            locked={!nameEditable}
            required={isRequired(field)}
            requiredLocale={nameEditable && field.required === 'requiredLocale' ? requiredNameLocale() : undefined}
            onShadedBg
            aria-describedby={nameSentence ? NAME_NOTE_ID : undefined}
            containerProps={{ 'data-testid': field.testId }}
            onChange={(value) => handleNameChange(field.property, value)} />
        {/each}
      </div>
    {/if}

    <!-- Single-line name fields and the locked info questions, as the rows of one group -->
    {#if singleLineNameFields.length || lockedInfoQuestions.length}
      <InputGroup class="mt-lg">
        {#each singleLineNameFields as field (field.property)}
          <Input
            type="text"
            label={t(field.label)}
            value={singleLineName(field.property)}
            locked={!nameEditable}
            required={isRequired(field)}
            onShadedBg
            aria-describedby={nameSentence ? NAME_NOTE_ID : undefined}
            autocomplete={field.autocomplete}
            data-testid={field.testId}
            onChange={(value) => handleNameChange(field.property, value)} />
        {/each}

        {#each lockedInfoQuestions as question (question.id)}
          {@const answer = userData.current?.entity.answers?.[question.id]}
          <QuestionInput
            {question}
            {answer}
            locked
            onShadedBg
            disableMultilingual
            placeholder={t(descriptor.lockedInfoPlaceholder)} />
        {/each}
      </InputGroup>
    {/if}
  </section>

  <!-- Editable data -->

  <section class="mt-lg self-stretch">
    <h2 class={subheadingClass}>{t('contestantApp.basicInfo.editableInfos.title')}</h2>

    <div class="gap-md flex flex-col" bind:this={editableFields}>
      <!-- Image -->

      <!-- Image upload: a candidate's portrait or an organization's logo. The error surface is Input's own <ErrorMessage>, which already carries the shared `input-error` testid; tests address it scoped inside this instance's `profile-image-upload` container. That container is what disambiguates this Input from the others on the page, so no wrapper element is needed to carry a testid of its own. -->
      <Input
        type="image"
        label={t(descriptor.imageLabel)}
        info={descriptor.imageInfo ? t(descriptor.imageInfo) : undefined}
        value={userData.current?.entity.image}
        onChange={handleImageInputChange}
        locked={contestantCtx.answersLocked}
        onShadedBg
        containerProps={{ 'data-testid': 'profile-image-upload' }} />
      {#if imageRemoveLabel}
        <Button
          text={imageRemoveLabel}
          onclick={handleImageRemove}
          color="warning"
          class="self-center"
          data-testid="profile-image-remove" />
      {/if}

      <!-- Colour. The value is the stored colour, which the field shows as it is and never the colours adjusted for display. The test id among the rest props lands on the hex field. -->
      {#if colorField}
        <Input
          type="color"
          label={colorField.label}
          info={colorField.info}
          value={userData.current?.entity.color?.normal}
          onChange={handleColorChange}
          locked={contestantCtx.answersLocked}
          onShadedBg
          containerProps={{ 'data-testid': 'profile-color' }}
          data-testid="profile-color-hex" />
      {/if}

      <!-- Editable Info questions -->

      <!-- {#each}: keyed — QuestionInput carries per-item interactive state (bind:value, focus, uncommitted draft); positional reuse on reorder/filter would corrupt state across questions -->
      {#each contestantCtx.infoQuestions.filter((q) => !getCustomData(q).locked) as question (question.id)}
        {@const answer = userData.current?.entity.answers?.[question.id]}
        <div data-testid="contestant-profile-info-item">
          <QuestionInput
            {question}
            {answer}
            onChange={handleQuestionInputChange}
            locked={contestantCtx.answersLocked}
            onShadedBg />
        </div>
      {/each}
    </div>
  </section>

  <!-- Submit button and error messages -->

  {#snippet primaryActions()}
    {#if !contestantCtx.answersLocked}
      <div class="mx-md mb-lg mt-md transition-opacity" class:opacity-0={status === 'loading' || allRequiredFilled}>
        <Icon name="required" class="{iconBadgeClass} text-warning" /><span class="sr-only"
          >{t('common.required')}</span>
        {t('contestantApp.basicInfo.requiredInfo')}
      </div>
    {/if}

    <!-- The message of a save that stayed on the page. The region is always rendered, so that a message put into it is announced. -->
    <div role="alert" data-testid="profile-save-message" data-outcome={saveMessage?.outcome}>
      {#if saveMessage}
        <ErrorMessage inline message={saveMessage.text} class="mb-lg mt-md" />
      {/if}
    </div>

    <div class="grid w-full justify-items-center" bind:this={actions}>
      {#if !contestantCtx.answersLocked}
        <Button
          text={submitLabel}
          onclick={handleSubmit}
          disabled={!canSubmit}
          loading={status === 'loading'}
          loadingText={t('common.saving')}
          type="submit"
          data-testid="profile-submit"
          variant="main"
          icon="next" />
        <Button
          text={t('common.cancel')}
          disabled={!userData.hasUnsaved}
          onclick={handleCancel}
          color="warning"
          data-testid="profile-cancel" />
      {:else}
        <Button
          text={t('common.return')}
          href={getRoute.current('ContestantAppEntityHome')}
          variant="main"
          data-testid="profile-return" />
      {/if}
    </div>
  {/snippet}
</MainContent>
