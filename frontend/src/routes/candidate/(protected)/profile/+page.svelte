<script lang="ts">
  import FieldGroup from '$lib/components/common/FieldGroup.svelte';
  import {Page} from '$lib/templates/page';
  import {_} from 'svelte-i18n';
  import {authContext} from '$lib/utils/authenticationStore';
  import {get} from 'svelte/store';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {onDestroy, onMount} from 'svelte';
  import {LogoutButton} from '$candidate/components/logoutButton';

  const basicInfoFields = ['firstName', 'lastName', 'party'];
  const editableFields = ['gender', 'motherTongue', 'age'];
  const fieldOptions = new Map([
    [
      'gender',
      ['male', 'female', 'nonBinary', 'other', 'preferNotToSay'].map((a) =>
        $_(`candidateApp.genders.${a}`)
      )
    ],
    // TODO: i18n localization
    ['motherTongue', ['English', 'Suomi', 'Svenska']]
  ]);

  const labelClass = 'w-6/12 label-sm label mx-6 my-2 text-secondary';
  const disclaimerClass = 'mx-6 my-0 p-0 text-sm text-secondary';
  const headerClass = 'uppercase mx-6 my-0 p-0 text-m text-secondary';
  const inputClass =
    'input-ghost input input-sm w-full pr-2 text-right disabled:border-none disabled:bg-base-100';

  let portraitInput: HTMLElement | null;
  let portraitLabel: HTMLElement | null;

  // function for clicking the portrait input field with space
  const handlePortraitInput = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault(); // Prevent default behavior (e.g., scrolling the page)
      portraitInput?.click();
    }
  };

  // TODO: consider refactoring file input to a different component

  // add an event listener to the portrait label for keyboard navigation
  onMount(() => {
    portraitLabel?.addEventListener('keydown', handlePortraitInput);
  });

  // remove the event listener on unmount
  onDestroy(() => {
    portraitLabel?.removeEventListener('keydown', handlePortraitInput);
  });

  // get the user from authContext
  const user = get(authContext.user);
  const nominations = user?.candidate?.nominations;

  // the dot symbol for separating info string
  const dot = '\u22C5';

  // map nominations into objects
  const nominationFields = nominations?.map((nom) => ({
    nominationID: nom.id,
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
</script>

<Page title={$_('candidateApp.basicInfo.title')} mainClass="bg-base-200">
  <LogoutButton slot="banner" />

  <div class="flex flex-col items-center gap-16">
    <h1>{$_('candidateApp.basicInfo.title')}</h1>

    <p class="text-center">
      {$_('candidateApp.basicInfo.instructions')}
    </p>

    <FieldGroup fields={basicInfoFields} let:field>
      <div class="flex items-center justify-between bg-base-100 px-4">
        <label for={field} class={labelClass}>
          {$_(`candidateApp.basicInfo.fields.${field}`)}
        </label>
        <div class="w-6/12 text-right text-secondary">
          <input type="text" disabled id={field} value={basicInfoData[field]} class={inputClass} />
        </div>
        <Icon name="locked" class="text-secondary" />
      </div>
      <p class={disclaimerClass} slot="footer">
        {$_('candidateApp.basicInfo.disclaimer')}
      </p>
    </FieldGroup>

    <FieldGroup fields={nominationFields} let:field>
      <p class={headerClass} slot="header">
        {$_('candidateApp.basicInfo.nominations')}
      </p>

      <div class="flex items-center justify-between bg-base-100 px-4">
        <label for={field.nominationID} class="label-sm label mx-6 my-2 w-8/12 text-secondary"
          >{`${field.fieldText}`}</label>
        <div class="w-4/12 text-right text-secondary">
          <input
            disabled
            type="text"
            id={field.nominationID}
            value={field.electionSymbol ? null : $_('candidateApp.basicInfo.pending')}
            class={inputClass} />
        </div>
        <Icon name="locked" class="text-secondary" />
      </div>
      <p class={disclaimerClass} slot="footer">
        {$_('candidateApp.basicInfo.nominationsDescription')}
      </p>
    </FieldGroup>

    <FieldGroup fields={editableFields} let:field>
      <div class="flex items-center justify-between bg-base-100 px-4">
        <label for={field} class={labelClass}>
          {$_(`candidateApp.basicInfo.fields.${field}`)}
        </label>
        {#if field === 'age'}
          <input type="number" id={field} placeholder="0" class={inputClass} />
        {:else}
          <select id={field} class="select select-sm w-6/12 text-primary">
            <option disabled selected value style="display: none;" />
            {#each fieldOptions.get(field) ?? [] as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        {/if}
      </div>
    </FieldGroup>

    <FieldGroup let:field>
      <div class="flex h-full items-center justify-between bg-base-100 px-4">
        <span class={labelClass}>
          {$_('candidateApp.basicInfo.fields.portrait')}
        </span>
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <label
          bind:this={portraitLabel}
          id="portraitLabel"
          tabindex="0"
          for="portrait"
          class="cursor-pointer text-primary"
          >{$_('candidateApp.basicInfo.tapToAddPhoto')}
          <Icon name="photo" />
        </label>
        <input
          bind:this={portraitInput}
          type="file"
          id="portrait"
          placeholder="PLACEHOLDER"
          class="hidden" />
      </div>
    </FieldGroup>

    <FieldGroup let:field>
      <div class="flex items-center justify-between bg-base-100 px-4">
        <label for="unaffiliated" class={labelClass}>
          {$_('candidateApp.basicInfo.fields.unaffiliated')}
        </label>
        <input id="unaffiliated" type="checkbox" class="toggle-primary toggle mr-8" checked />
      </div>
      <p class={disclaimerClass} slot="footer">
        {$_('candidateApp.basicInfo.unaffiliatedDescription')}
      </p>
    </FieldGroup>
    <FieldGroup>
      <label for="message" class={headerClass} slot="header"
        >{$_('candidateApp.basicInfo.electionManifesto')}</label>
      <textarea id="message" rows="4" class="w-full bg-base-100 p-6 !outline-none" />
    </FieldGroup>
  </div>
</Page>
