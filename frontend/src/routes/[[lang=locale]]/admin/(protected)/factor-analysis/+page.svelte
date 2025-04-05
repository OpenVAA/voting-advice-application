<!--@component
# Factor Analysis Page

Page for computing and managing factor analysis for elections
-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { getAppContext } from '$lib/contexts/app';
  import { Button } from '$lib/components/button';
  import { Checkbox } from '$lib/components/checkbox';
  import MainContent from '../../../MainContent.svelte';

  const { t } = getAppContext();

  let selectedElections = {
    parliamentary: true,
    municipal: true,
    mayoral: true
  };

  let isComputing = false;
  let error: string | null = null;

  const handleSubmit = () => {
    isComputing = true;
    error = null;

    return async ({ result }: { result: { type: string } }) => {
      isComputing = false;
      if (result.type === 'error') {
        error = 'Failed to compute factors';
      }
    };
  };
</script>

<MainContent title="Factor analysis">
  <div class="flex flex-col items-center">
    <p class="mb-lg max-w-xl text-center">
      Compute the latent factors from the answers given by candidates and parties.
    </p>

    <form method="POST" class="grid w-full max-w-xl gap-lg" use:enhance={handleSubmit}>
      <h2 class="font-medium">Compute factors</h2>

      <p class="mb-lg max-w-xl">Select the elections for which to compute the factors.</p>

      <div class="grid gap-md">
        <label class="flex items-start">
          <input
            type="checkbox"
            name="parliamentary"
            bind:checked={selectedElections.parliamentary}
            class="checkbox-primary checkbox checkbox-lg" />
          <div class="ml-4">
            <span class="font-medium">Parliamentary Elections</span>
            <div class="mt-1">
              <span class="text-sm text-neutral">250 candidates and 0 parties have answered</span>
            </div>
          </div>
        </label>

        <label class="flex items-start">
          <input
            type="checkbox"
            name="municipal"
            bind:checked={selectedElections.municipal}
            class="checkbox-primary checkbox checkbox-lg" />
          <div class="ml-4">
            <span class="font-medium">Municipal Elections</span>
            <div class="mt-1">
              <span class="text-sm text-neutral">1,050 candidates and 13 parties have answered</span>
            </div>
          </div>
        </label>

        <label class="flex items-start">
          <input
            type="checkbox"
            name="mayoral"
            bind:checked={selectedElections.mayoral}
            class="checkbox-primary checkbox checkbox-lg" />
          <div class="ml-4">
            <span class="font-medium">Mayoral Elections</span>
            <div class="mt-1">
              <span class="text-sm text-neutral">16 candidates and no parties have answered</span>
            </div>
          </div>
        </label>
      </div>

      {#if error}
        <p class="text-sm text-error">{error}</p>
      {/if}

      <div class="flex flex-col items-center gap-sm">
        <Button
          text={isComputing ? 'Computing factors...' : 'Compute factors'}
          type="submit"
          variant="main"
          disabled={isComputing || !Object.values(selectedElections).some(Boolean)}
          on:click={(e) => {
            e.preventDefault();
            isComputing = true;
            setTimeout(() => {
              isComputing = false;
            }, 3000);
          }} />

        {#if isComputing}
          <p class="text-sm text-neutral">This may take some time.</p>
        {/if}
      </div>
    </form>
  </div>
</MainContent>
