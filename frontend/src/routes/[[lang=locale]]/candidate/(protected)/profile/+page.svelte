<script lang="ts">
  import {writable} from 'svelte/store';
  import {t, defaultLocale} from '$lib/i18n';
  import {isTranslation, translate} from '$lib/i18n/utils/translate';
  import {Field, FieldGroup} from '$lib/components/common/form';
  import {BasicPage} from '$lib/templates/basicPage';
  import {getContext} from 'svelte';
  import Warning from '$lib/components/warning/Warning.svelte';
  import type {CandidateContext} from '$lib/utils/candidateContext';
  import {Button} from '$lib/components/button';
  import {goto} from '$app/navigation';
  import {getRoute, Route} from '$lib/utils/navigation';
  import type {CandidateAnswer, Nomination} from '$lib/types/candidateAttributes';
  import {addAnswer, updateAnswer} from '$lib/api/candidate';
  import PreventNavigation from '$lib/components/preventNavigation/PreventNavigation.svelte';
  import InputContainer from '$candidate/components/input/InputContainer.svelte';
  import {
    PhotoInput,
    SingleChoiceInput,
    MultipleChoiceInput,
    BooleanInput,
    TextInput,
    DateInput
  } from '$candidate/components/input';
  import {answerIsEmpty} from '$lib/utils/answers';
  import type {TranslationKey} from '$types';

  const disclaimerClass = 'mx-6 my-0 p-0 text-sm text-secondary';
  const headerClass = 'uppercase mx-6 my-0 p-0 small-label';
  const inputClass =
    'input-ghost flex justify-end text-right input input-sm w-full pr-2 disabled:border-none disabled:bg-base-100';

  // get the user and necessary information from CandidateContext
  const {
    user,
    infoAnswers,
    questionsLocked,
    infoQuestions,
    unansweredOpinionQuestions,
    unansweredRequiredInfoQuestions,
    parties
  } = getContext<CandidateContext>('candidate');

  const unsavedInfoAnswers = writable<AnswerDict>({});

  // initialize infoQuestions and unsavedInfoAnswers
  let unsavedInfoAnswersInitialized = false;
  $: {
    if ($infoQuestions && !unsavedInfoAnswersInitialized) {
      $infoQuestions.forEach((question) => {
        if ($infoAnswers?.[question.id]) {
          $unsavedInfoAnswers[question.id] = {value: $infoAnswers[question.id].value};
        } else {
          // Initialize unsavedInfoAnswers with undefined values for type consistency
          $unsavedInfoAnswers[question.id] = {value: undefined};
        }
      });
      unsavedInfoAnswersInitialized = true;
    }
  }

  // Hash form state in order to detect changes
  let previousStateHash: string | undefined;
  let dirty = false;

  // Check if the form is dirty
  $: {
    const currentStateHash = JSON.stringify(Object.values($unsavedInfoAnswers));
    previousStateHash = previousStateHash ?? currentStateHash;
    dirty = currentStateHash !== previousStateHash;
  }

  // follow allFilledPrivate to check if all the required questions are answered.
  let allFilledPrivate: boolean = false;
  $: {
    if ($infoQuestions) {
      const requiredQuestions = $infoQuestions.filter((question) => question.required);
      allFilledPrivate = requiredQuestions.every((question) => {
        return !answerIsEmpty(question, $unsavedInfoAnswers[question.id]);
      });
    }
  }

  // basic information
  type InfoField = ('firstName' | 'lastName' | 'party') & keyof CandidateProps;

  const basicInfoFields = new Array<InfoField>('firstName', 'lastName', 'party');

  const basicInfoLabels: Record<InfoField, TranslationKey> = {
    firstName: 'common.firstName',
    lastName: 'common.lastName',
    party: 'common.party.singular'
  };

  const basicInfoData: Record<InfoField, string | undefined> = {
    firstName: $user?.candidate?.firstName,
    lastName: $user?.candidate?.lastName,
    party: translate($user?.candidate?.party?.shortName)
  };

  let nomination = $user?.candidate?.nomination;
  let photo = $user?.candidate?.photo;

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
    if ($questionsLocked) {
      await goto($getRoute(Route.CandAppHome));
      return;
    }

    if (!allFilledPrivate) {
      return;
    }

    loading = true;

    if (!$infoQuestions) return;

    await Promise.all(
      $infoQuestions.map((question) => {
        saveToServer(question);
      })
    );
    await uploadPhoto();
    if ($user?.candidate) {
      $user.candidate.photo = photo;
    }

    loading = false;

    if ($unansweredOpinionQuestions?.length !== 0 && !$questionsLocked)
      await goto($getRoute(Route.CandAppQuestions));
    else await goto($getRoute(Route.CandAppHome));
  };

  const updateInfoAnswerStore = (
    answerId: CandidateAnswer['id'],
    question: QuestionProps,
    value: AnswerProps['value']
  ) => {
    if ($infoAnswers) {
      $infoAnswers[question.id] = {
        id: answerId,
        value
      };
    }
  };

  let clearLocalStorage: () => void;

  const saveToServer = async (question: QuestionProps) => {
    if (!$infoAnswers || !$unsavedInfoAnswers[question.id].value === undefined) return;
    if ($infoAnswers[question.id] === undefined) {
      // New answer
      const response = await addAnswer(question.id, $unsavedInfoAnswers[question.id].value);
      if (!response?.ok) {
        showError($t('candidateApp.questions.answerSaveError'));
        return;
      } else if (question.type === 'text') {
        clearLocalStorage();
      }
      const data = await response.json();
      const answerId = data.data.id;
      updateInfoAnswerStore(answerId, question, $unsavedInfoAnswers[question.id].value);
    } else if ($unsavedInfoAnswers[question.id].value !== undefined) {
      // Editing existing answer
      const savedAnswer = $infoAnswers[question.id];
      const unsavedAnswer = $unsavedInfoAnswers[question.id];
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
    if ($unansweredOpinionQuestions?.length && !$questionsLocked)
      submitButtonText = $t('common.saveAndContinue');
    else if ($questionsLocked) submitButtonText = $t('common.return');
    else submitButtonText = $t('common.saveAndReturn');
  }

  /**
   * This is a hacky, temporary way of ensuring that the inputs to `TextInput` are always `LocalizedString` instances even when only one locale is supported.
   * TODO: This will be deprecated when all the input components are refactored in [PR #580](https://github.com/OpenVAA/voting-advice-application/pull/580)
   * @param value A `LocalizedString` or a `string`
   */
  function ensureLocalizedString(value: AnswerPropsValue): LocalizedString | undefined {
    return !value ? undefined : isTranslation(value) ? value : {[defaultLocale]: `${value}`};
  }

  function onChange(details: {questionId: string; value: AnswerPropsValue}) {
    $unsavedInfoAnswers[details.questionId].value = details.value;
  }

  /**
   * Format a nomination for display.
   */
  function formatNomination(nomination: Nomination): string {
    return [
      translate(nomination.constituency?.shortName ?? nomination.constituency?.name),
      translate(nomination.party?.shortName),
      nomination.electionSymbol
    ]
      .filter((v) => v != null && v !== '')
      .join($t('common.multipleAnswerSeparator'));
  }
</script>

{#if $parties && $infoAnswers && $infoQuestions}
  <BasicPage title={$t('candidateApp.basicInfo.title')} mainClass="bg-base-200">
    <Warning display={!!$questionsLocked} slot="note">
      <p>{$t('candidateApp.common.editingNotAllowed')}</p>
      {#if $unansweredOpinionQuestions?.length !== 0 || $unansweredRequiredInfoQuestions?.length !== 0}
        <p>{$t('candidateApp.common.editingNotAllowedPartiallyFilled')}</p>
      {/if}
    </Warning>

    <PreventNavigation active={dirty && !loading && !$questionsLocked} />
    <form on:submit|preventDefault={submitForm}>
      <p class="text-center">
        {$t('candidateApp.basicInfo.instructions')}
      </p>

      <div class="flex flex-col items-center gap-16">
        <FieldGroup>
          <!-- Don't show the party field if no parties exist -->
          {#each basicInfoFields.filter((f) => f !== 'party' || $parties.length) as field}
            <Field id={field} label={$t(basicInfoLabels[field])}>
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
            {$t('candidateApp.basicInfo.nominations.title')}
          </p>
          {#if nomination}
            <Field id="nomination" label={formatNomination(nomination)}>
              <InputContainer locked>
                <input
                  disabled
                  type="text"
                  id="nomination"
                  value={nomination.electionSymbol ? null : $t('common.pending')}
                  class={inputClass} />
              </InputContainer>
            </Field>
          {/if}

          <p class={disclaimerClass} slot="footer">
            {$t('candidateApp.basicInfo.nominations.description')}
          </p>
        </FieldGroup>

        <FieldGroup>
          <PhotoInput
            bind:photo
            bind:uploadPhoto
            disabled={$questionsLocked}
            onChange={() => (dirty = true)} />
        </FieldGroup>

        {#each $infoQuestions as question}
          {@const value = $unsavedInfoAnswers[question.id].value}
          {#if question.type === 'singleChoiceCategorical' && (typeof value === 'number' || value == null)}
            <SingleChoiceInput
              questionId={question.id}
              options={question.values}
              headerText={question.text}
              locked={$questionsLocked}
              {value}
              {onChange} />
          {:else if question.type === 'multipleChoiceCategorical' && ((Array.isArray(value) && value.every((v) => typeof v === 'number')) || value == null)}
            <MultipleChoiceInput
              questionId={question.id}
              options={question.values}
              headerText={question.text}
              locked={$questionsLocked}
              {value}
              {onChange} />
          {:else if question.type === 'boolean' && (typeof value === 'boolean' || value == null)}
            <BooleanInput
              questionId={question.id}
              headerText={question.text}
              locked={$questionsLocked}
              footerText={$t('xxx.basicInfo.unaffiliatedDescription')}
              value={value ? value : false}
              {onChange} />
          {:else if question.type === 'text'}
            <TextInput
              questionId={question.id}
              headerText={question.text}
              locked={$questionsLocked}
              compact={question.textType === 'short'}
              bind:clearLocalStorage
              value={ensureLocalizedString(value)}
              previousValue={ensureLocalizedString($infoAnswers[question.id]?.value)}
              {onChange} />
          {:else if question.type === 'date' && (typeof value === 'string' || value == null)}
            <DateInput
              questionId={question.id}
              headerText={question.text}
              locked={$questionsLocked}
              {value}
              {onChange} />
          {:else}
            {showError(
              $t('candidateApp.basicInfo.error.invalidQuestion', {questionId: question.id})
            )}
          {/if}
        {/each}

        <Button
          disabled={!allFilledPrivate}
          text={submitButtonText}
          type="submit"
          id="submitButton"
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
