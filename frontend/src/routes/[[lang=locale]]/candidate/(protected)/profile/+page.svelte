<script lang="ts">
  import {get, writable, type Writable} from 'svelte/store';
  import {t} from '$lib/i18n';
  import {translate} from '$lib/i18n/utils/translate';
  import {Field, FieldGroup} from '$lib/components/common/form';
  import {BasicPage} from '$lib/templates/basicPage';
  import AvatarSelect from './AvatarSelect.svelte';
  import {getContext} from 'svelte';
  import Warning from '$lib/components/warning/Warning.svelte';
  import InputContainer from './InputContainer.svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {infoQuestions as infoQuestionsStore} from '$lib/stores';
  import MultipleChoice from './RenderMultipeChoice.svelte';
  import SingleChoice from './RenderSingleChoice.svelte';
  import RenderBoolean from './RenderBoolean.svelte';
  import RenderDate from './RenderDate.svelte';
  import {Button} from '$lib/components/button';
  import {goto} from '$app/navigation';
  import {getRoute, Route} from '$lib/utils/navigation';
  import type {candidateAnswer} from '$lib/types/candidateAttributes';
  import {addAnswer, updateAnswer} from '$lib/api/candidate';
  import RenderTextQuestions from './RenderTextQuestions.svelte';

  const basicInfoFields = ['firstName', 'lastName', 'party'];

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

  // get the user from authContext
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

  $: infoAnswers = $infoAnswerStore;

  let infoQuestionsPromise = $infoQuestionsStore;
  let infoQuestions: QuestionProps[] = [];
  const selectedValues: Writable<AnswerDict> = writable({});

  const infoValues = $selectedValues;

  infoQuestionsPromise.then((questions) => {
    infoQuestions = questions;
    infoQuestions.forEach((question) => {
      if (infoAnswers?.[question.id]) {
        selectedValues.update((values) => {
          values[question.id] = {value: infoAnswers[question.id].value};
          return values;
        });
      } else {
        selectedValues.update((values) => {
          values[question.id] = {value: undefined};
          return values;
        });
      }
    });
  });

  let photo = user?.candidate?.photo;
  let nomination = user?.candidate?.nomination;

  // Hash form state in order to detect changes
  let previousStateHash: string | undefined;
  let dirty = false;

  $: {
    const getCurrentHash = () =>
      JSON.stringify(
        {
          selectedValues
        },
        function (k, v) {
          return v === undefined ? null : v;
        }
      );
    previousStateHash = previousStateHash ?? getCurrentHash();
    if (!dirty) {
      const currentStateHash = getCurrentHash();
      dirty = currentStateHash !== previousStateHash;
    }
  }

  $: allFilledPrivate = Object.entries(infoValues).every((value) => {
    return value[1].value === false || !!value[1].value;
  });

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

  const saveToServer = async (question: QuestionProps) => {
    if (infoAnswers && !infoAnswers[question.id]) {
      // New answer

      // Likert is required for an answer to be saved
      if (!infoValues[question.id].value) {
        return;
      }

      const response = await addAnswer(question.id, infoValues[question.id].value);
      if (!response?.ok) {
        showError($t('candidateApp.questions.answerSaveError'));
        return;
      }

      const data = await response.json();
      const answerId = data.data.id;
      updateInfoAnswerStore(answerId, question, infoValues[question.id].value);
    } else if (infoAnswers) {
      // Editing existing answer
      const existingAnswer = infoAnswers[question.id];
      const likertAnswer = infoValues[question.id] ?? infoAnswers[question.id];
      const response = await updateAnswer(existingAnswer.id, likertAnswer.value);
      if (!response?.ok) {
        showError($t('candidateApp.questions.answerSaveError'));
        return;
      }
      updateInfoAnswerStore(existingAnswer.id, question, likertAnswer.value);
    }
  };

  const updateInfoAnswerStore = (
    answerId: candidateAnswer['id'],
    question: QuestionProps,
    value: AnswerProps['value']
  ) => {
    if (infoAnswers) {
      infoAnswers[question.id] = {
        id: answerId,
        value
      };
      infoAnswerStore.set(infoAnswers);
    }
  };

  // const submitForm = async () => {};
  const submitForm = async () => {
    if (questionsLocked) {
      await goto($getRoute(Route.CandAppHome));
      return;
    }

    if (!allFilledPrivate) {
      return;
    }

    infoQuestions.forEach((question) => {
      saveToServer(question);
    });

    if (!opinionQuestionsFilled && !questionsLocked) await goto($getRoute(Route.CandAppQuestions));
    else await goto($getRoute(Route.CandAppHome));
  };

  // the dot symbol for separating info string
  const dot = '\u22C5';

  // basic information
  const basicInfoData: Record<string, string | number | undefined> = {
    firstName: user?.candidate?.firstName,
    lastName: user?.candidate?.lastName,
    party: translate(user?.candidate?.party?.shortName)
  };

  let submitButtonText = '';
  $: {
    if (!opinionQuestionsFilled && !questionsLocked)
      submitButtonText = $t('candidateApp.basicInfo.saveAndContinue');
    else if (questionsLocked) submitButtonText = $t('candidateApp.basicInfo.return');
    else submitButtonText = $t('candidateApp.basicInfo.saveAndReturn');
  }
</script>

{#if infoQuestions.length > 0}
  <BasicPage title={$t('candidateApp.basicInfo.title')} mainClass="bg-base-200">
    <Warning display={!!questionsLocked} slot="note">
      <p>{$t('candidateApp.homePage.editingNotAllowedNote')}</p>
      {#if !opinionQuestionsFilled || !basicInfoFilled}
        <p>{$t('candidateApp.homePage.editingNotAllowedPartiallyFilled')}</p>
      {/if}
    </Warning>
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
              <InputContainer locked={true}>
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

            {JSON.stringify(infoValues[question.id].value, null, 2)}

            {#if question.type === 'singleChoiceCategorical'}
              <SingleChoice
                bind:value={infoValues[question.id].value}
                {question}
                {selectClass}
                {labelClass}
                {questionsLocked} />
            {:else if question.type === 'multipleChoiceCategorical'}
              <MultipleChoice
                bind:values={infoValues[question.id].value}
                {question}
                {labelClass}
                {questionsLocked}
                {selectClass}
                {buttonContainerClass}
                {iconClass} />
            {:else if question.type === 'boolean'}
              <RenderBoolean
                {question}
                {labelClass}
                {disclaimerClass}
                {inputClass}
                {questionsLocked}
                bind:checked={infoValues[question.id].value} />
            {:else if question.type === 'text'}
              <RenderTextQuestions
                {question}
                {questionsLocked}
                {user}
                bind:text={infoValues[question.id].value} />
            {:else if question.type === 'date'}
              <RenderDate
                {question}
                {labelClass}
                {questionsLocked}
                {inputClass}
                bind:value={infoValues[question.id].value} />
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
