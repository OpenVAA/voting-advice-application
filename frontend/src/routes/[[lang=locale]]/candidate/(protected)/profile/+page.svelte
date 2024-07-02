<script lang="ts">
  import {get, writable} from 'svelte/store';
  import {t} from '$lib/i18n';
  import {translate} from '$lib/i18n/utils/translate';
  import {Field, FieldGroup} from '$lib/components/common/form';
  import {BasicPage} from '$lib/templates/basicPage';
  import AvatarSelect from '$lib/candidate/components/profilePage/AvatarSelect.svelte';
  import {getContext} from 'svelte';
  import Warning from '$lib/components/warning/Warning.svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {infoQuestions as infoQuestionsStore} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {goto} from '$app/navigation';
  import {getRoute, Route} from '$lib/utils/navigation';
  import type {candidateAnswer} from '$lib/types/candidateAttributes';
  import {addAnswer, updateAnswer} from '$lib/api/candidate';
  import PreventNavigation from '$lib/components/preventNavigation/PreventNavigation.svelte';
  import RenderSingleChoice from '$lib/candidate/components/profilePage/RenderSingleChoice.svelte';
  import RenderBoolean from '$lib/candidate/components/profilePage/RenderBoolean.svelte';
  import RenderTextQuestions from '$lib/candidate/components/profilePage/RenderTextQuestions.svelte';
  import RenderDate from '$lib/candidate/components/profilePage/RenderDate.svelte';
  import RenderMultipeChoice from '$lib/candidate/components/profilePage/RenderMultipeChoice.svelte';
  import InputContainer from '$lib/candidate/components/profilePage/InputContainer.svelte';

  const labelClass =
    'pointer-events-none label-sm whitespace-nowrap label mx-6 my-2 text-secondary';
  const disclaimerClass = 'mx-6 my-0 p-0 text-sm text-secondary';
  const headerClass = 'uppercase mx-6 my-0 p-0 small-label';
  const selectClass =
    'select select-sm w-full text-right text-primary disabled:bg-base-100 disabled:border-none';
  const inputClass =
    'input-ghost flex justify-end text-right input input-sm w-full pr-2 disabled:border-none disabled:bg-base-100';
  const iconClass = 'text-secondary my-auto flex-shrink-0';
  const buttonContainerClass = 'pr-6';

  // get the user and necessary information from CandidateContext
  const {
    userStore,
    infoAnswerStore,
    questionsLockedStore,
    opinionQuestionsFilledStore,
    basicInfoFilledStore
  } = getContext<CandidateContext>('candidate');

  const user = get(userStore);
  $: questionsLocked = $questionsLockedStore;
  $: opinionQuestionsFilled = $opinionQuestionsFilledStore;
  $: basicInfoFilled = $basicInfoFilledStore;
  $: savedInfoAnswers = $infoAnswerStore;

  // infoQuestionsStore are loaded from +layout.server.ts
  let infoQuestionsPromise = $infoQuestionsStore;
  let infoQuestions = Array<QuestionProps>();

  const selectedAnswers = writable<AnswerDict>({});
  const unsavedInfoAnswers = $selectedAnswers;

  // initialize infoQuestions and unsavedInfoAnswers
  infoQuestionsPromise.then((questions) => {
    infoQuestions = questions;
    infoQuestions.forEach((question) => {
      if (savedInfoAnswers?.[question.id]) {
        unsavedInfoAnswers[question.id] = {value: savedInfoAnswers[question.id].value};
      } else {
        // Initialize unsavedInfoAnswers with undefined values for type consistency
        unsavedInfoAnswers[question.id] = {value: undefined};
      }
    });
  });

  // Hash form state in order to detect changes
  let previousStateHash: string | undefined;
  let dirty = false;

  // Check if the form is dirty
  $: {
    const answersLoaded = Object.values(unsavedInfoAnswers).every(
      (infoAnswer) => infoAnswer.value !== undefined
    );
    if (Object.entries(unsavedInfoAnswers).length > 0 && answersLoaded && !dirty) {
      const getCurrentHash = () => JSON.stringify(unsavedInfoAnswers);
      previousStateHash = previousStateHash ?? getCurrentHash();
      const currentStateHash = getCurrentHash();
      dirty = currentStateHash !== previousStateHash;
    }
  }

  // follow allFilledPrivate to check if all the questions are answered.
  // TODO: we should be able to define which questions are mandatory
  $: allFilledPrivate = Object.entries(unsavedInfoAnswers).every((value) => {
    return value[1].value === false || !!value[1].value;
  });

  // basic information
  const basicInfoFields = ['firstName', 'lastName', 'party'];

  const basicInfoData: Record<string, string | number | undefined> = {
    firstName: user?.candidate?.firstName,
    lastName: user?.candidate?.lastName,
    party: translate(user?.candidate?.party?.shortName)
  };

  let nomination = user?.candidate?.nomination;
  let photo = user?.candidate?.photo;

  // the dot symbol for separating info string
  const dot = '\u22C5';

  let uploadPhoto: () => Promise<void>;

  let errorMessage = '';
  let errorTimeout: NodeJS.Timeout;

  const showError = (message: string) => {
    errorMessage = message;
    clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
      errorMessage = '';
    }, 5000);
  };

  let loading = false;

  const submitForm = async () => {
    if (questionsLocked) {
      await goto($getRoute(Route.CandAppHome));
      return;
    }

    if (!allFilledPrivate) {
      return;
    }

    loading = true;

    await Promise.all(
      infoQuestions.map((question) => {
        saveToServer(question);
      })
    );
    await uploadPhoto();

    loading = false;

    if (!opinionQuestionsFilled && !questionsLocked) await goto($getRoute(Route.CandAppQuestions));
    else await goto($getRoute(Route.CandAppHome));
  };

  const updateInfoAnswerStore = (
    answerId: candidateAnswer['id'],
    question: QuestionProps,
    value: AnswerProps['value']
  ) => {
    if (savedInfoAnswers) {
      savedInfoAnswers[question.id] = {
        id: answerId,
        value
      };
      infoAnswerStore.set(savedInfoAnswers);
    }
  };

  let clearLocalStorage: () => void;

  const saveToServer = async (question: QuestionProps) => {
    if (savedInfoAnswers && !savedInfoAnswers[question.id]) {
      // New answer

      if (!unsavedInfoAnswers[question.id].value) {
        return;
      }
      const response = await addAnswer(question.id, unsavedInfoAnswers[question.id].value);
      if (!response?.ok) {
        showError($t('candidateApp.questions.answerSaveError'));
        return;
      } else if (question.type === 'text') {
        clearLocalStorage();
      }
      const data = await response.json();
      const answerId = data.data.id;
      updateInfoAnswerStore(answerId, question, unsavedInfoAnswers[question.id].value);
    } else if (savedInfoAnswers) {
      // Editing existing answer

      const savedAnswer = savedInfoAnswers[question.id];
      const unsavedAnswer = unsavedInfoAnswers[question.id] ?? savedInfoAnswers[question.id];
      const response = await updateAnswer(savedAnswer.id, unsavedAnswer.value);

      if (!response?.ok) {
        showError($t('candidateApp.questions.answerSaveError'));
        return;
      } else if (question.type === 'text') {
        clearLocalStorage();
      }
      updateInfoAnswerStore(savedAnswer.id, question, unsavedAnswer.value);
    }
  };

  let submitButtonText = '';

  $: {
    if (!opinionQuestionsFilled && !questionsLocked)
      submitButtonText = $t('candidateApp.basicInfo.saveAndContinue');
    else if (questionsLocked) submitButtonText = $t('candidateApp.basicInfo.return');
    else submitButtonText = $t('candidateApp.basicInfo.saveAndReturn');
  }
</script>

{#if savedInfoAnswers && infoQuestions.length > 0}
  <BasicPage title={$t('candidateApp.basicInfo.title')} mainClass="bg-base-200">
    <Warning display={!!questionsLocked} slot="note">
      <p>{$t('candidateApp.homePage.editingNotAllowedNote')}</p>
      {#if !opinionQuestionsFilled || !basicInfoFilled}
        <p>{$t('candidateApp.homePage.editingNotAllowedPartiallyFilled')}</p>
      {/if}
    </Warning>

    <PreventNavigation active={dirty && !loading && !questionsLocked} />
    <form on:submit|preventDefault={submitForm}>
      <p class="text-center">
        {$t('candidateApp.basicInfo.instructions')}
      </p>

      <div class="flex flex-col items-center gap-16">
        <FieldGroup>
          {#each basicInfoFields as field}
            <Field>
              <label for={field} class={labelClass}>
                {$t(`candidateApp.basicInfo.fields.${field}`)}
              </label>
              <InputContainer locked>
                <input
                  type="text"
                  disabled
                  id={field}
                  value={basicInfoData[field]}
                  class={inputClass} />
              </InputContainer>
            </Field>
          {/each}
          <p class={disclaimerClass} slot="footer">
            {$t('candidateApp.basicInfo.disclaimer')}
          </p>
        </FieldGroup>
        <FieldGroup>
          <p class={headerClass} slot="header">
            {$t('candidateApp.basicInfo.nominations')}
          </p>
          {#if nomination}
            <Field>
              <label for="nomination" class={labelClass}
                >{`${translate(nomination.constituency?.shortName)} ${dot} ${translate(nomination.party.shortName)} ${
                  nomination.electionSymbol ? dot + ' ' + nomination.electionSymbol : ''
                }`}</label>
              <InputContainer locked>
                <input
                  disabled
                  type="text"
                  id="nomination"
                  value={nomination.electionSymbol ? null : $t('candidateApp.basicInfo.pending')}
                  class={inputClass} />
              </InputContainer>
            </Field>
          {/if}

          <p class={disclaimerClass} slot="footer">
            {$t('candidateApp.basicInfo.nominationsDescription')}
          </p>
        </FieldGroup>

        <FieldGroup>
          <AvatarSelect bind:photo bind:uploadPhoto disabled={questionsLocked} />
        </FieldGroup>

        {#each infoQuestions as question}
          <FieldGroup>
            <p class={headerClass} slot="header">
              {question.text}
            </p>

            {#if question.type === 'singleChoiceCategorical'}
              <RenderSingleChoice
                {question}
                {selectClass}
                {labelClass}
                {questionsLocked}
                bind:value={unsavedInfoAnswers[question.id].value} />
            {:else if question.type === 'multipleChoiceCategorical'}
              <RenderMultipeChoice
                {question}
                {labelClass}
                {questionsLocked}
                {selectClass}
                {buttonContainerClass}
                {iconClass}
                bind:selectedValues={unsavedInfoAnswers[question.id].value} />
            {:else if question.type === 'boolean'}
              <RenderBoolean
                {question}
                {labelClass}
                {disclaimerClass}
                {inputClass}
                {questionsLocked}
                bind:checked={unsavedInfoAnswers[question.id].value} />
            {:else if question.type === 'text'}
              {#if savedInfoAnswers[question.id]}
                <RenderTextQuestions
                  {question}
                  {questionsLocked}
                  bind:clearLocalStorage
                  bind:text={unsavedInfoAnswers[question.id].value}
                  bind:previousText={savedInfoAnswers[question.id].value} />
              {:else}
                <RenderTextQuestions
                  {question}
                  {questionsLocked}
                  bind:clearLocalStorage
                  bind:text={unsavedInfoAnswers[question.id].value} />
              {/if}
            {:else if question.type === 'date'}
              <RenderDate
                {question}
                {labelClass}
                {questionsLocked}
                {inputClass}
                bind:value={unsavedInfoAnswers[question.id].value} />
            {/if}
          </FieldGroup>
        {/each}

        <Button
          disabled={!allFilledPrivate}
          text={submitButtonText}
          type="submit"
          data-testid="submitButton"
          variant="main"
          icon="next"
          slot="primaryActions" />
        {#if errorMessage}
          <div class="text-error">
            {errorMessage}
          </div>
        {/if}
      </div>
    </form>
  </BasicPage>
{/if}
