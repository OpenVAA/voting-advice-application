<!--@component
# Factor Analysis Page

Page for computing and managing factor analysis for elections
-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { getAppContext } from '$lib/contexts/app';
  import { Button } from '$lib/components/button';
  import { Card } from '$lib/components/card';
  import { Checkbox } from '$lib/components/checkbox';

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

<div class="container mx-auto p-6">
  <div class="mb-8">
    <h1 class="text-3xl font-bold">Factor analysis</h1>
    <p class="mt-2 text-gray-600">Compute the latent factors from the answers given by candidates and parties.</p>
  </div>

  <Card class="max-w-2xl">
    <div class="p-6">
      <h2 class="font-semibold text-xl">Compute factors</h2>
      <p class="mt-2 text-gray-600">Select the elections for which to compute the factors.</p>

      <form method="POST" class="mt-6 space-y-4" use:enhance={handleSubmit}>
        <div class="space-y-4">
          <Checkbox name="parliamentary" bind:checked={selectedElections.parliamentary} label="Parliamentary Elections">
            <span slot="description" class="text-sm text-gray-500">250 candidates and 0 parties have answered</span>
          </Checkbox>

          <Checkbox name="municipal" bind:checked={selectedElections.municipal} label="Municipal Elections">
            <span slot="description" class="text-sm text-gray-500">
              1,050 candidates and 13 parties have answered
            </span>
          </Checkbox>

          <Checkbox name="mayoral" bind:checked={selectedElections.mayoral} label="Mayoral Elections">
            <span slot="description" class="text-sm text-gray-500">16 candidates and no parties have answered</span>
          </Checkbox>
        </div>

        {#if error}
          <p class="text-sm text-red-600">{error}</p>
        {/if}

        <Button
          text={isComputing ? 'Computing factors...' : 'Compute factors'}
          type="submit"
          variant="main"
          disabled={isComputing || !Object.values(selectedElections).some(Boolean)} />

        {#if isComputing}
          <p class="text-center text-sm text-gray-500">This may take some time.</p>
        {/if}
      </form>
    </div>
  </Card>
</div>
