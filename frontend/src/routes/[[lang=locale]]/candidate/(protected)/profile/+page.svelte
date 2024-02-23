<script lang="ts">
  import {get} from 'svelte/store';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {translate} from '$lib/i18n/utils/translate';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {getLanguages, updateBasicInfo} from '$lib/api/candidate';
  import {authContext} from '$lib/utils/authenticationStore';
  import {loadUserData} from '$lib/utils/authenticationStore';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {Button} from '$lib/components/button';
  import FieldGroup from '$lib/components/common/form/FieldGroup.svelte';
  import Field from '$lib/components/common/form/Field.svelte';
  import {BasicPage} from '$lib/templates/basicPage';
  import AvatarSelect from './AvatarSelect.svelte';
  import type {StrapiLanguageData} from '$lib/api/getData.type';
  import type {Language} from '$lib/types/candidateAttributes';
  import {TextArea} from '$candidate/components/textArea';

  const basicInfoFields = ['firstName', 'lastName', 'party'];

  const genders = ['male', 'female', 'nonBinary', 'other', 'preferNotToSay'];

  const labelClass =
    'pointer-events-none label-sm whitespace-nowrap label mx-6 my-2 text-secondary';
  const disclaimerClass = 'mx-6 my-0 p-0 text-sm text-secondary';
  const headerClass = 'uppercase mx-6 my-0 p-0 text-m text-secondary';
  const selectClass = 'select select-sm w-full text-right text-primary';
  const inputClass =
    'input-ghost flex justify-end text-right input input-sm w-full pr-2 disabled:border-none disabled:bg-base-100';
  const iconClass = 'text-secondary my-auto flex-shrink-0';
  const buttonContainerClass = 'pr-6';
  const inputContainerClass = 'flex w-full pr-6';

  // get the user from authContext
  const user = get(authContext.user);

  // get initial values for basic data
  let gender = user?.candidate?.gender;
  let motherTongues = user?.candidate?.motherTongues;
  let birthday = user?.candidate?.birthday;
  let photo = user?.candidate?.photo;
  let unaffiliated = user?.candidate?.unaffiliated;
  let manifesto = user?.candidate?.manifesto;
  const nominations = user?.candidate?.nominations;

  let manifestoTextArea: TextArea; // Used to clear the local storage from the parent component
  let savedManifesto = user?.candidate?.manifesto; // Used to detect changes in the manifesto

  // all necessary fields filled boolean
  $: allFilled =
    gender && motherTongues && motherTongues.length > 0 && birthday && manifesto ? true : false;

  let errorMessage: string | undefined;

  let uploadPhoto: () => Promise<void>;

  const submitForm = async () => {
    try {
      await uploadPhoto();
      await updateBasicInfo(manifesto, birthday, gender, photo, unaffiliated, motherTongues);

      // Update the database-saved manifesto in order to detect changes
      savedManifesto = manifesto;
      manifestoTextArea.deleteLocal();

      await loadUserData(); // reload user data so it's up to date
      await goto(getRoute(Route.CandAppQuestions));
    } catch (error) {
      errorMessage = $t('candidateApp.basicInfo.errorMessage');
    }
  };

  // the dot symbol for separating info string
  const dot = '\u22C5';

  // map nominations into objects
  const nominationFields = nominations?.map((nom) => {
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
</script>

<BasicPage title={$t('candidateApp.basicInfo.title')} mainClass="bg-base-200">
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
            <div class={inputContainerClass}>
              <input
                type="text"
                disabled
                id={field}
                value={basicInfoData[field]}
                class={inputClass} />
              <Icon name="locked" class={iconClass} />
            </div>
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
            <div class={inputContainerClass}>
              <input
                disabled
                type="text"
                id={nomination.nominationID}
                value={nomination.electionSymbol ? null : $t('candidateApp.basicInfo.pending')}
                class={inputClass} />
              <Icon name="locked" class={iconClass} />
            </div>
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
          <div class={inputContainerClass}>
            <div class={inputClass}>
              <input class="dark:bg-black" type="date" id="birthday" bind:value={birthday} />
            </div>
          </div>
        </Field>
        <Field>
          <label for="gender" class={labelClass}>
            {$t('candidateApp.basicInfo.fields.gender')}
          </label>
          <select
            id="gender"
            class={selectClass}
            bind:value={gender}
            style="text-align-last: right; direction: rtl;">
            <option disabled selected style="display: none;" />
            {#each genders as option}
              <option value={option} selected={option === gender}
                >{$t(`candidateApp.genders.${option}`)}</option>
            {/each}
          </select>
        </Field>
      </FieldGroup>

      <FieldGroup>
        <p class={headerClass} slot="header">
          {$t('candidateApp.basicInfo.fields.motherTongue')}
        </p>

        <Field>
          <label for="motherTongue" class={labelClass}>
            {#if motherTongues}
              {motherTongues.length > 0
                ? $t('candidateApp.basicInfo.addAnother')
                : $t('candidateApp.basicInfo.selectFirst')}
            {/if}
          </label>
          <select
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
        </Field>
        {#each motherTongues ?? [] as tongue}
          <Field>
            <label for={tongue.name} class={labelClass}>
              {tongue.name}
            </label>
            <div class={buttonContainerClass}>
              <button
                title="remove"
                type="button"
                id={tongue.name}
                on:click={() => (motherTongues = motherTongues?.filter((m) => m.id !== tongue.id))}>
                <Icon name="removeFromList" class={iconClass} />
              </button>
            </div>
          </Field>
        {/each}
      </FieldGroup>

      <FieldGroup>
        <AvatarSelect bind:photo bind:uploadPhoto />
      </FieldGroup>

      <FieldGroup>
        <Field>
          <label for="unaffiliated" class={labelClass}>
            {$t('candidateApp.basicInfo.fields.unaffiliated')}
          </label>

          <input
            id="unaffiliated"
            type="checkbox"
            class="toggle toggle-primary mr-8"
            bind:checked={unaffiliated} />
        </Field>
        <p class={disclaimerClass} slot="footer">
          {$t('candidateApp.basicInfo.unaffiliatedDescription')}
        </p>
      </FieldGroup>
      <FieldGroup>
        <TextArea
          id="manifesto"
          localStorageId="candidate-app-manifesto"
          previouslySaved={savedManifesto}
          bind:text={manifesto}
          bind:this={manifestoTextArea}>
          <label for="manifesto" class={headerClass} slot="header"
            >{$t('candidateApp.basicInfo.electionManifesto')}</label>
        </TextArea>
      </FieldGroup>
      <Button
        disabled={!allFilled}
        text={$t('candidateApp.opinions.continue')}
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
