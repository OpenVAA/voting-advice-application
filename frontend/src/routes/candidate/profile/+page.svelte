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

  const labelClass = 'label-sm label mx-6 my-2';
</script>

<div class="mx-40 my-20 flex flex-col items-center gap-20">
  <h2>{$_('candidateApp.basicInfo.title')}</h2>

  <p class="text-center">
    {$_('candidateApp.basicInfo.instructions')}
  </p>

  <FieldGroup fields={disabledFields} let:field>
    <div class="flex items-center justify-between px-4">
      <label for={field} class={labelClass}>
        {$_(`candidateApp.basicInfo.fields.${field}`)}
      </label>
      <input
        type="text"
        id={field}
        placeholder="PLACEHOLDER"
        class="input-ghost input input-sm w-6/12 text-right" />
    </div>
    <p class="m-0 p-0 text-sm text-secondary" slot="footer">
      {$_('candidateApp.basicInfo.disclaimer')}
    </p>
  </FieldGroup>

  <FieldGroup fields={editableFields} let:field>
    <div class="flex items-center justify-between px-4">
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
        <select id={field} class="select-bordered select select-sm w-6/12">
          <option value="">{$_(`candidateApp.basicInfo.fields.${field}`)}</option>
          {#each fieldOptions.get(field) ?? [] as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      {/if}
    </div>
  </FieldGroup>

  <FieldGroup let:field customStyle="height: 60px">
    <div class="flex h-full items-center justify-between px-4">
      <label for="portrait" class={labelClass}>
        {$_(`candidateApp.basicInfo.fields.portrait`)}
      </label>
      <label for="portrait" class="mr-20 text-indigo-700">Tap to add photo</label>
      <input type="file" id="portrait" placeholder="PLACEHOLDER" class="hidden" />
    </div>
  </FieldGroup>
</div>
