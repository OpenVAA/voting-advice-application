<script lang="ts">
  import {get} from 'svelte/store';
  //import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {translate} from '$lib/i18n/utils/translate';
  //import {getRoute, Route} from '$lib/utils/navigation';
  //import {getLanguages, getGenders, updateBasicInfo} from '$lib/api/candidate';
  //import {Icon} from '$lib/components/icon';
  //import {Button} from '$lib/components/button';
  import {Field, FieldGroup} from '$lib/components/common/form';
  import {BasicPage} from '$lib/templates/basicPage';
  import AvatarSelect from './AvatarSelect.svelte';
  import {MultilangTextInput} from '$candidate/components/textArea';
  //import {PreventNavigation} from '$lib/components/preventNavigation';
  import {getContext} from 'svelte';
  import Warning from '$lib/components/warning/Warning.svelte';
  import InputContainer from './InputContainer.svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {infoQuestions as infoQuestionsStore} from '$lib/stores';
  import MultipleChoice from './RenderMultipeChoice.svelte';
  import SingleChoice from './RenderSingleChoice.svelte';
  import RenderBoolean from './RenderBoolean.svelte';
  import RenderDate from './RenderDate.svelte';

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
  const {userStore, questionsLockedStore, opinionQuestionsFilledStore, basicInfoFilledStore} =
    getContext<CandidateContext>('candidate');
  const user = get(userStore);
  $: questionsLocked = $questionsLockedStore;
  $: opinionQuestionsFilled = $opinionQuestionsFilledStore;
  $: basicInfoFilled = $basicInfoFilledStore;

  let infoQuestionsPromise = $infoQuestionsStore;
  let infoQuestions: QuestionProps[] = [];

  infoQuestionsPromise.then((questions) => {
    infoQuestions = questions;
  });

  // let loading = false;

  let {gender, motherTongues, birthday, photo, unaffiliated, manifesto, nomination} = {
    gender: {
      id: undefined
    },
    manifesto: {},
    ...user?.candidate
  };

  // Default to null because Strapi returns null if not defined
  $: genderID = gender?.id ?? null;

  let manifestoTextArea: MultilangTextInput; // Used to clear the local storage from the parent component
  let savedManifesto = user?.candidate?.manifesto; // Used to detect changes in the manifesto

  // Hash form state in order to detect changes
  let previousStateHash: string | undefined;
  let dirty = false;

  $: {
    const getCurrentHash = () =>
      JSON.stringify({
        genderID,
        motherTongues,
        birthday,
        photo,
        unaffiliated,
        nomination,
        manifesto: Object.values(manifesto).join('')
      });
    previousStateHash = previousStateHash ?? getCurrentHash();
    if (!dirty) {
      const currentStateHash = getCurrentHash();
      dirty = currentStateHash !== previousStateHash;
    }
  }

  // all necessary fields filled boolean
  // $: allFilled =
  //   !!genderID &&
  //   !!motherTongues &&
  //   motherTongues.length > 0 &&
  //   !!birthday &&
  //   Object.values(manifesto).some((value) => value !== '');

  // let errorMessage: string | undefined;

  let uploadPhoto: () => Promise<void>;

  // const submitForm = async () => {};

  // the dot symbol for separating info string
  const dot = '\u22C5';

  // basic information
  const basicInfoData: Record<string, string | number | undefined> = {
    firstName: user?.candidate?.firstName,
    lastName: user?.candidate?.lastName,
    party: translate(user?.candidate?.party?.shortName)
  };

  // const fetchQuestionOptions = (questionId: string) => {
  //   const questionForDisplay = infoQuestions.find((q) => q.id === questionId);
  //   if (questionForDisplay) {
  //     return questionForDisplay.values;
  //   } else {
  //     console.error('Found no question values');
  //   }
  // };

  // let submitButtonText = '';
  // $: {
  //   if (!opinionQuestionsFilled && !questionsLocked)
  //     submitButtonText = $t('candidateApp.basicInfo.saveAndContinue');
  //   else if (questionsLocked) submitButtonText = $t('candidateApp.basicInfo.return');
  //   else submitButtonText = $t('candidateApp.basicInfo.saveAndReturn');
  // }
</script>

{#if infoQuestions.length > 0}
  <BasicPage title={$t('candidateApp.basicInfo.title')} mainClass="bg-base-200">
    <Warning display={!!questionsLocked} slot="note">
      <p>{$t('candidateApp.homePage.editingNotAllowedNote')}</p>
      {#if !opinionQuestionsFilled || !basicInfoFilled}
        <p>{$t('candidateApp.homePage.editingNotAllowedPartiallyFilled')}</p>
      {/if}
    </Warning>
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

          {#if question.type === 'singleChoiceCategorical'}
            <SingleChoice {question} {selectClass} {labelClass} {questionsLocked} />
          {:else if question.type === 'multipleChoiceCategorical'}
            <MultipleChoice
              {question}
              {labelClass}
              {questionsLocked}
              {selectClass}
              {buttonContainerClass}
              {iconClass} />
          {:else if question.type === 'boolean'}
            <RenderBoolean
              {question}
              {disclaimerClass}
              {labelClass}
              {questionsLocked}
              {inputClass} />
          {:else if question.type === 'text'}
            <MultilangTextInput
              locked={questionsLocked}
              id="manifesto"
              localStorageId={`candidate-app-${question.text}`}
              previouslySavedMultilang={savedManifesto}
              placeholder="—"
              bind:multilangText={manifesto}
              bind:this={manifestoTextArea} />
          {:else if question.type === 'date'}
            <RenderDate {question} {labelClass} {questionsLocked} {inputClass} />
          {/if}
        </FieldGroup>
      {/each}
    </div>
  </BasicPage>
{/if}

<!-- 
{#if infoQuestions.length > 0}
  <BasicPage title={$t('candidateApp.basicInfo.title')} mainClass="bg-base-200">
    <Warning display={!!questionsLocked} slot="note">
      <p>{$t('candidateApp.homePage.editingNotAllowedNote')}</p>
      {#if !opinionQuestionsFilled || !basicInfoFilled}
        <p>{$t('candidateApp.homePage.editingNotAllowedPartiallyFilled')}</p>
      {/if}
    </Warning>

    <PreventNavigation active={dirty && !loading} />
    <form on:submit|preventDefault={submitForm}>
      <div class="flex flex-col items-center gap-16">
        <p class="text-center">
          {$t('candidateApp.basicInfo.instructions')}
        </p>

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
          <Field>
            <label for="birthday" class={labelClass}>
              {$t('candidateApp.basicInfo.fields.birthday')}
            </label>
            <InputContainer locked={questionsLocked}>
              <div class={inputClass}>
                <input
                  disabled={questionsLocked}
                  class="dark:bg-black"
                  type="date"
                  min={birthdayMin}
                  max={birthdayMax}
                  id="birthday"
                  bind:value={birthday} />
              </div>
            </InputContainer>
          </Field>
          <Field>
            <label for="gender" class={labelClass}>
              {$t('candidateApp.basicInfo.fields.gender')}
            </label>
            <InputContainer locked={questionsLocked}>
              <select
                disabled={questionsLocked}
                id="gender"
                class={selectClass}
                bind:value={genderID}
                style="text-align-last: right; direction: rtl;">
                {#each fetchQuestionOptions('17') ?? [] as option}
                  <option value={option.label}>{$t(`candidateApp.genders.${option.label}`)}</option>
                {/each}
              </select>
            </InputContainer>
          </Field>
        </FieldGroup>

        <FieldGroup>
          <p class={headerClass} slot="header">
            {$t('candidateApp.basicInfo.fields.motherTongue')}
          </p>
          {#if !questionsLocked}
            <Field>
              <label for="motherTongue" class={labelClass}>
                {#if motherTongues}
                  {motherTongues.length > 0
                    ? $t('candidateApp.basicInfo.addAnother')
                    : $t('candidateApp.basicInfo.selectFirst')}
                {/if}
              </label>
              <InputContainer locked={questionsLocked}>
                <select
                  disabled={questionsLocked}
                  bind:this={motherTongueSelect}
                  id="motherTongue"
                  data-testid="motherTongue"
                  class={selectClass}
                  on:change={handleLanguageSelect}
                  style="text-align-last: right; direction: rtl;">
                  <option disabled selected value style="display: none;" />
                  {#each fetchQuestionOptions('15') ?? [] as option}
                    <option value={option.label}
                      >{$t(`candidateApp.languages.${option.label}`)}</option>
                  {/each}
                </select>
              </InputContainer>
            </Field>
          {/if}
          {#each motherTongues ?? [] as tongue}
            <Field>
              <label for={tongue.name} class={labelClass}>
                {tongue.name}
              </label>
              <div class={buttonContainerClass}>
                {#if !questionsLocked}
                  <button
                    title="remove"
                    type="button"
                    id={tongue.name}
                    on:click={() =>
                      (motherTongues = motherTongues?.filter((m) => m.id !== tongue.id))}>
                    <Icon name="close" class={iconClass} />
                  </button>
                {:else}
                  <Icon name="locked" class={iconClass} />
                {/if}
              </div>
            </Field>
          {/each}
        </FieldGroup>

        <FieldGroup>
          <AvatarSelect bind:photo bind:uploadPhoto disabled={questionsLocked} />
        </FieldGroup>

        <FieldGroup>
          <Field>
            <label for="unaffiliated" class={labelClass}>
              {$t('candidateApp.basicInfo.fields.unaffiliated')}
            </label>
            <InputContainer locked={questionsLocked}>
              {#if !questionsLocked}
                <input
                  id="unaffiliated"
                  type="checkbox"
                  class="toggle toggle-primary mr-8"
                  bind:checked={unaffiliated} />
              {:else}
                <input id="unaffiliated" disabled value="yes" class={inputClass} />
              {/if}
            </InputContainer>
          </Field>
          <p class={disclaimerClass} slot="footer">
            {$t('candidateApp.basicInfo.unaffiliatedDescription')}
          </p>
        </FieldGroup>

        <MultilangTextInput
          locked={questionsLocked}
          id="manifesto"
          headerText={$t('candidateApp.basicInfo.electionManifesto')}
          localStorageId="candidate-app-manifesto"
          previouslySavedMultilang={savedManifesto}
          placeholder="—"
          bind:multilangText={manifesto}
          bind:this={manifestoTextArea} />

        <Button
          disabled={!allFilled || loading}
          text={submitButtonText}
          type="submit"
          data-testid="submitButton"
          variant="main"
          icon="next"
          slot="primaryActions" />
        {#if opinionQuestionsFilled && !questionsLocked}
          <Button
            color="error"
            on:click={async (event) => {
              event.preventDefault();
              await goto($getRoute(Route.CandAppHome));
            }}
            text={$t('candidateApp.navbar.cancel')} />
        {/if}
        {#if errorMessage}
          <div class="text-error">
            {errorMessage}
          </div>
        {/if}
      </div>
    </form>
  </BasicPage>
{/if} -->
