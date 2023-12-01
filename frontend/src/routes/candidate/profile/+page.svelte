<script lang="ts">
  import FieldGroup from '$lib/components/common/FieldGroup.svelte';
  import {_} from 'svelte-i18n';

  const disabledFields = ['firstName', 'lastName', 'electionList', 'electionNumber'];
  const editableFields = ['gender', 'motherTongue', 'age'];
  const fieldOptions = new Map([
    [
      'gender',
      ['male', 'female', 'nonBinary', 'other', 'preferNotToSay'].map((a) =>
        $_(`candidateApp.genders.${a}`)
      )
    ],
    ['motherTongue', ['English', 'Suomi', 'Svenska']]
  ]);

  const labelClass = 'label-sm label mx-6 my-2 text-secondary';
  const disclaimerClass = 'm-0 p-0 text-sm text-secondary';
</script>

<div class="bg-base-200">
  <div class="mx-40 my-20 flex flex-col items-center gap-20">
    <h2>{$_('candidateApp.basicInfo.title')}</h2>

    <p class="text-center">
      {$_('candidateApp.basicInfo.instructions')}
    </p>

    <FieldGroup fields={disabledFields} let:field>
      <div class="flex items-center justify-between bg-base-100 px-4">
        <label for={field} class={labelClass}>
          {$_(`candidateApp.basicInfo.fields.${field}`)}
        </label>
        <input
          type="text"
          id={field}
          placeholder="PLACEHOLDER"
          class="input-ghost input input-sm w-6/12 text-right" />
      </div>
      <p class={disclaimerClass} slot="footer">
        {$_('candidateApp.basicInfo.disclaimer')}
      </p>
    </FieldGroup>

    <FieldGroup fields={editableFields} let:field>
      <div class="flex items-center justify-between bg-base-100 px-4">
        <label for={field} class={labelClass}>
          {$_(`candidateApp.basicInfo.fields.${field}`)}
        </label>
        {#if field === 'age'}
          <input
            type="number"
            id={field}
            placeholder="0"
            class="input-ghost input input-sm w-6/12 text-right" />
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

    <FieldGroup let:field customStyle="height: 60px">
      <div class="flex h-full items-center justify-between bg-base-100 px-4">
        <span class={labelClass}>
          {$_('candidateApp.basicInfo.fields.portrait')}
        </span>
        <label for="portrait" class="mr-20 cursor-pointer text-primary"
          >{$_('candidateApp.basicInfo.tapToAddPhoto')}</label>
        <input type="file" id="portrait" placeholder="PLACEHOLDER" class="hidden" />
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
      <label for="message" class={disclaimerClass} slot="header"
        >{$_('candidateApp.basicInfo.electionManifesto')}</label>
      <!-- <p class={disclaimerClass} slot="header">
        {$_('candidateApp.basicInfo.electionManifesto')}
      </p> -->
      <textarea id="message" rows="4" class="w-full resize-none bg-base-100 p-6 !outline-none" />
    </FieldGroup>
  </div>
</div>
