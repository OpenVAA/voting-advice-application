<script lang="ts">
  import {get} from 'svelte/store';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {translate} from '$lib/i18n/utils/translate';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {getLanguages, getGenders, updateBasicInfo} from '$lib/api/candidate';
  import {Icon} from '$lib/components/icon';
  import {Button} from '$lib/components/button';
  import {Field, FieldGroup} from '$lib/components/common/form';
  import {BasicPage} from '$lib/templates/basicPage';
  import AvatarSelect from './AvatarSelect.svelte';
  import {MultilangTextInput} from '$candidate/components/textArea';
  import {PreventNavigation} from '$lib/components/preventNavigation';
  import {getContext} from 'svelte';
  import type {StrapiGenderData, StrapiLanguageData} from '$lib/api/getData.type';
  import type {Language} from '$lib/types/candidateAttributes';
  import Warning from '$lib/components/warning/Warning.svelte';
  import InputContainer from './InputContainer.svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';

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
  // const inputContainerClass = 'flex w-full pr-6';

  // get the user from authContext
  const {
    userStore,
    questionsLockedStore,
    opinionQuestionsFilledStore,
    basicInfoFilledStore,
    loadUserData
  } = getContext<CandidateContext>('candidate');
  const user = get(userStore);
  $: questionsLocked = $questionsLockedStore;
  $: opinionQuestionsFilled = $opinionQuestionsFilledStore;
  $: basicInfoFilled = $basicInfoFilledStore;

  let loading = false;

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
  $: allFilled =
    !!genderID &&
    !!motherTongues &&
    motherTongues.length > 0 &&
    !!birthday &&
    Object.values(manifesto).some((value) => value !== '');

  let errorMessage: string | undefined;

  let uploadPhoto: () => Promise<void>;

  const submitForm = async () => {
    loading = true;
    dirty = false;
    try {
      if (!questionsLocked) {
        await uploadPhoto();
        await updateBasicInfo(
          manifesto,
          birthday,
          genderID ?? undefined,
          photo,
          unaffiliated,
          motherTongues
        );
      }

      // Update the database-saved manifesto in order to detect changes
      savedManifesto = manifesto;
      manifestoTextArea.deleteLocal();

      await loadUserData(); // reload user data so it's up to date
      if (!opinionQuestionsFilled && !questionsLocked)
        await goto($getRoute(Route.CandAppQuestions));
      else await goto($getRoute(Route.CandAppHome));
    } catch (error) {
      errorMessage = $t('candidateApp.basicInfo.errorMessage');
    } finally {
      loading = false;
    }
  };

  // the dot symbol for separating info string
  const dot = '\u22C5';

  // map nominations into objects
  const nominationFields = (nomination ? [nomination] : []).map((nom) => {
    const constituency = translate(nom.constituency?.name);
    const party = translate(nom.party?.shortName);
    const electionSymbol = nom.electionSymbol;
    return {
      nominationID: nom.id.toString(),
      constituency,
      party,
      electionSymbol,
      fieldText: `${constituency} ${dot} ${party} ${
        electionSymbol ? dot + ' ' + electionSymbol : ''
      }`
    };
  });

  // basic information
  const basicInfoData: Record<string, string | number | undefined> = {
    firstName: user?.candidate?.firstName,
    lastName: user?.candidate?.lastName,
    party: translate(user?.candidate?.party?.shortName)
  };

  // fetch languages from backend
  let allLanguages: StrapiLanguageData[] | undefined;
  getLanguages().then((languages) => (allLanguages = languages));

  let allGenders: StrapiGenderData[] | undefined;
  getGenders().then((genders) => (allGenders = genders));

  // map the languages to their respective locales for easier use
  $: motherTongueLocales = motherTongues?.map((lang) => lang.localisationCode);
  $: availableLanguages = allLanguages?.filter(
    (lang) => !motherTongueLocales?.includes(lang.attributes.localisationCode)
  );

  // html element for selecting html language
  let motherTongueSelect: HTMLSelectElement;

  // handle the change when a language is selected
  const handleLanguageSelect = (e: Event) => {
    const language = availableLanguages
      ? availableLanguages.find(
          (lang) => lang.attributes.localisationCode === (e.target as HTMLSelectElement).value
        )
      : undefined;
    if (language && motherTongues) {
      const languageObj: Language = {
        id: language.id,
        localisationCode: language?.attributes.localisationCode,
        name: language.attributes.name
      };
      motherTongues = [...motherTongues, languageObj];
      // set the hidden element as the selected one
      motherTongueSelect.selectedIndex = 0;
    }
  };

  const birthdayMin = '1800-01-01';
  const birthdayMax = new Date().toISOString().split('T')[0];
</script>

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
            <InputContainer locked={true}>
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

        {#each nominationFields ?? [] as nomination}
          <Field>
            <label for={nomination.nominationID} class={labelClass}>{nomination.fieldText}</label>
            <InputContainer locked={true}>
              <input
                disabled
                type="text"
                id={nomination.nominationID}
                value={nomination.electionSymbol ? null : $t('candidateApp.basicInfo.pending')}
                class={inputClass} />
            </InputContainer>
          </Field>
        {/each}
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
              {#if allGenders}
                {#each allGenders as option}
                  <option value={option.id} selected={option.id === genderID}
                    >{$t(`candidateApp.genders.${option.attributes.name}`)}</option>
                {/each}
              {/if}
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
                class={selectClass}
                on:change={handleLanguageSelect}>
                <option disabled selected value style="display: none;" />
                {#each availableLanguages ?? [] as option}
                  <option value={option.attributes.localisationCode}
                    >{$t(`candidateApp.languages.${option.attributes.name}`)}</option>
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
        text={!opinionQuestionsFilled && !questionsLocked
          ? $t('candidateApp.basicInfo.saveAndContinue')
          : questionsLocked
            ? $t('candidateApp.basicInfo.return')
            : $t('candidateApp.basicInfo.saveAndReturn')}
        type="submit"
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
