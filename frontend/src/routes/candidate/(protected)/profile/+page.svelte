<script lang="ts">
  import FieldGroup from '$lib/components/common/form/FieldGroup.svelte';
  import Field from '$lib/components/common/form/Field.svelte';
  import {BasicPage} from '$lib/templates/basicPage';
  import {_} from 'svelte-i18n';
  import {authContext} from '$lib/utils/authenticationStore';
  import {get} from 'svelte/store';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {LogoutButton} from '$candidate/components/logoutButton';
  import {Button} from '$lib/components/button';
  import AvatarSelect from './AvatarSelect.svelte';
  import {updateBasicInfo} from '$lib/api/candidate';
  import {getLanguages} from '$lib/api/candidate';
  import type {StrapiLanguageData} from '$lib/api/getData.type';
  import type {Language} from '$lib/types/candidateAttributes';

  // get the user from authContext
  const user = get(authContext.user);

  // get initial values from backend
  let gender = user?.candidate?.gender;
  let motherTongues = user?.candidate?.motherTongues;
  let age = user?.candidate?.age;
  let photo = user?.candidate?.photo;
  let unaffiliated = user?.candidate?.unaffiliated;
  let manifesto = user?.candidate?.manifesto;
  const nominations = user?.candidate?.nominations;

  // all fields filled
  $: allFilled =
    gender &&
    motherTongues &&
    motherTongues.length > 0 &&
    age &&
    photo &&
    manifesto &&
    unaffiliated &&
    true
      ? true
      : false;

  const basicInfoFields = ['firstName', 'lastName', 'party'];

  const fieldOptions = new Map([
    ['gender', ['male', 'female', 'nonBinary', 'other', 'preferNotToSay']],
    // TODO: i18n localization
    ['motherTongue', ['English', 'Suomi', 'Svenska']]
  ]);

  const labelClass = 'w-6/12 label-sm label mx-6 my-2 text-secondary';
  const disclaimerClass = 'mx-6 my-0 p-0 text-sm text-secondary';
  const headerClass = 'uppercase mx-6 my-0 p-0 text-m text-secondary';
  const inputClass =
    'input-ghost input input-sm w-full pr-2 text-right disabled:border-none disabled:bg-base-100';
  const iconClass = 'text-secondary';

  let uploadPhoto: () => Promise<void>;

  const submitForm = async () => {
    await uploadPhoto();
    await updateBasicInfo(manifesto, age, gender, photo, unaffiliated, motherTongues);
  };

  // the dot symbol for separating info string
  const dot = '\u22C5';

  // map nominations into objects
  const nominationFields = nominations?.map((nom) => ({
    nominationID: nom.id.toString(),
    constituency: nom.constituency?.name,
    party: nom.party.shortName,
    electionSymbol: nom.electionSymbol,
    fieldText: `${nom.constituency?.name} ${dot} ${nom.party.shortName} ${
      nom.electionSymbol ? dot + ' ' + nom.electionSymbol : ''
    }`
  }));

  // basic information
  const basicInfoData: Record<string, string | number | undefined> = {
    firstName: user?.candidate?.firstName,
    lastName: user?.candidate?.lastName,
    party: user?.candidate?.party?.shortName
  };

  // Mother tongue selection logic

  let allLanguages: StrapiLanguageData[] | undefined = undefined;
  getLanguages().then((languages) => (allLanguages = languages));

  $: motherTongueLocales = motherTongues?.map((lang) => lang.localisationCode);
  $: availableLanguages = allLanguages?.filter(
    (lang) => !motherTongueLocales?.includes(lang.attributes.localisationCode)
  );

  let motherTongueSelect: HTMLSelectElement | undefined;

  const handleLanguageSelect = (e: any) => {
    const language = availableLanguages
      ? availableLanguages.find((lang) => lang.attributes.localisationCode === e.target.value)
      : undefined;
    if (language && motherTongues) {
      const gg: Language = {
        id: language.id,
        localisationCode: language?.attributes.localisationCode,
        name: language.attributes.name
      };
      motherTongues = [...motherTongues, gg];
      if (motherTongueSelect) {
        motherTongueSelect.selectedIndex = 0;
      }
    }
  };
</script>

<BasicPage title={$_('candidateApp.basicInfo.title')} mainClass="bg-base-200">
  <svelte:fragment slot="banner">
    <LogoutButton />
  </svelte:fragment>

  <form on:submit|preventDefault={submitForm}>
    <div class="mx-20 my-20 flex flex-col items-center gap-16">
      <p class="text-center">
        {$_('candidateApp.basicInfo.instructions')}
      </p>

      <FieldGroup>
        {#each basicInfoFields as field}
          <Field>
            <label for={field} class={labelClass}>
              {$_(`candidateApp.basicInfo.fields.${field}`)}
            </label>
            <div class="w-6/12 text-right text-secondary">
              <input
                type="text"
                disabled
                id={field}
                value={basicInfoData[field]}
                class={inputClass} />
            </div>
            <Icon name="locked" class={iconClass} />
          </Field>
        {/each}
        <p class={disclaimerClass} slot="footer">
          {$_('candidateApp.basicInfo.disclaimer')}
        </p>
      </FieldGroup>

      <FieldGroup>
        <p class={headerClass} slot="header">
          {$_('candidateApp.basicInfo.nominations')}
        </p>

        {#each nominationFields ?? [] as nomination}
          <Field>
            <label for={nomination.nominationID} class={labelClass}>{nomination.fieldText}</label>
            <div class="w-4/12 text-right text-secondary">
              <input
                disabled
                type="text"
                id={nomination.nominationID}
                value={nomination.electionSymbol ? null : $_('candidateApp.basicInfo.pending')}
                class={inputClass} />
            </div>
            <Icon name="locked" class={iconClass} />
          </Field>
        {/each}
        <p class={disclaimerClass} slot="footer">
          {$_('candidateApp.basicInfo.nominationsDescription')}
        </p>
      </FieldGroup>

      <FieldGroup>
        <Field>
          <label for="age" class={labelClass}>
            {$_('candidateApp.basicInfo.fields.age')}
          </label>
          <input type="number" id="age" placeholder="0" class={inputClass} bind:value={age} />
        </Field>
        <Field>
          <label for="age" class={labelClass}>
            {$_('candidateApp.basicInfo.fields.gender')}
          </label>
          <select id="gender" class="select select-sm w-6/12 text-primary" bind:value={gender}>
            <option disabled selected style="display: none;" />
            {#each fieldOptions.get('gender') ?? [] as option}
              <option value={option} selected={option === gender}
                >{$_(`candidateApp.genders.${option}`)}</option>
            {/each}
          </select>
        </Field>
      </FieldGroup>

      <FieldGroup>
        <p class={headerClass} slot="header">
          {$_('candidateApp.basicInfo.fields.motherTongue')}
        </p>

        <Field>
          <label for="motherTongue" class={labelClass}>
            {#if motherTongues}
              {motherTongues.length > 0 ? 'Add another' : 'Select first'}
            {/if}
          </label>
          <select
            bind:this={motherTongueSelect}
            id="motherTongue"
            class="select select-sm w-6/12 text-primary"
            on:change={handleLanguageSelect}>
            <option disabled selected value style="display: none;" />
            {#each availableLanguages ?? [] as option}
              <option value={option.attributes.localisationCode}
                >{$_(`candidateApp.languages.${option.attributes.name}`)}</option>
            {/each}
          </select>
        </Field>
        {#each motherTongues ?? [] as tongue}
          <Field>
            <label for={tongue.name} class={labelClass}>
              {tongue.name}
            </label>
            <button
              id={tongue.name}
              on:click={() => (motherTongues = motherTongues?.filter((m) => m.id !== tongue.id))}>
              <Icon name="removeFromList" class={iconClass} />
            </button>
          </Field>
        {/each}
      </FieldGroup>

      <FieldGroup>
        <AvatarSelect bind:photo bind:uploadPhoto />
      </FieldGroup>

      <FieldGroup>
        <Field>
          <label for="unaffiliated" class={labelClass}>
            {$_('candidateApp.basicInfo.fields.unaffiliated')}
          </label>
          <input
            id="unaffiliated"
            type="checkbox"
            class="toggle toggle-primary mr-8"
            bind:checked={unaffiliated} />
        </Field>
        <p class={disclaimerClass} slot="footer">
          {$_('candidateApp.basicInfo.unaffiliatedDescription')}
        </p>
      </FieldGroup>
      <FieldGroup>
        <label for="message" class={headerClass} slot="header"
          >{$_('candidateApp.basicInfo.electionManifesto')}</label>
        <textarea
          id="message"
          rows="4"
          class="w-full resize-none bg-base-100 p-6 !outline-none"
          bind:value={manifesto} />
      </FieldGroup>
      <Button
        disabled={!allFilled}
        text="hello"
        type="submit"
        variant="main"
        icon="next"
        slot="primaryActions" />
    </div>
  </form>
</BasicPage>
