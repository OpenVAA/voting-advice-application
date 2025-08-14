<!--@component
# Admin Jobs Monitoring Page

Page for monitoring all active jobs across different admin features
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import MainContent from '../../../MainContent.svelte';
  import ProgressBar from '$lib/components/logger/ProgressBar.svelte';
  import InfoMessages from '$lib/components/logger/InfoMessages.svelte';
  import WarningMessages from '$lib/components/logger/WarningMessages.svelte';

  const { t, getRoute } = getAppContext();

  // Mock data for demonstration
  const mockInfoMessages = [
    'Starting argument condensation process...',
    'Processing batch 1 of 5 questions',
    'LLM API call completed successfully',
    'Generated 12 arguments for question 1',
    'Merging duplicate arguments...',
    'Progress: 60% complete',
    'Saving results to database...',
    'Quality check passed',
    'Finalizing condensation...',
    'Process completed successfully!'
  ];

  const mockWarningMessages = [
    'Warning: Question 3 has fewer than 5 comments, may affect quality',
    'Warning: LLM response time exceeded 30 seconds',
    'Warning: Some arguments were too similar and merged',
    'Warning: Rate limit approaching, slowing down requests'
  ];

  const mockErrorMessages = [
    'Error: Failed to connect to LLM API',
    'Error: Database connection timeout',
    'Error: Invalid question format detected'
  ];

  // State for each feature
  let argumentCondensationMonitoring = false;
  let factorAnalysisMonitoring = false;
  let questionInfoMonitoring = false;

  // Mock progress values
  let argumentCondensationProgress = 0.65;
  let factorAnalysisProgress = 0.25;
  let questionInfoProgress = 0.0;

  function startTestMonitoring(feature: string) {
    switch (feature) {
      case 'argument-condensation':
        argumentCondensationMonitoring = true;
        break;
      case 'factor-analysis':
        factorAnalysisMonitoring = true;
        break;
      case 'question-info':
        questionInfoMonitoring = true;
        break;
    }
  }

  function stopTestMonitoring(feature: string) {
    switch (feature) {
      case 'argument-condensation':
        argumentCondensationMonitoring = false;
        argumentCondensationProgress = 0;
        break;
      case 'factor-analysis':
        factorAnalysisMonitoring = false;
        factorAnalysisProgress = 0;
        break;
      case 'question-info':
        questionInfoMonitoring = false;
        questionInfoProgress = 0;
        break;
    }
  }
</script>

<MainContent title="Jobs Monitoring" contentClass="max-w-none">
  <p class="mb-lg text-center">Monitor all active jobs across admin features</p>

  <div class="flex w-full flex-col gap-lg px-4">
    <!-- Argument Condensation Box -->
    <div class="card mx-auto w-full max-w-none bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-primary">Argument Condensation</h2>

        {#if !argumentCondensationMonitoring}
          <p class="mb-4 text-sm text-neutral">Condense candidate arguments into coherent positions</p>
          <Button
            text="Test Monitoring"
            variant="main"
            class="w-full"
            on:click={() => startTestMonitoring('argument-condensation')} />
        {:else}
          <!-- Monitoring View -->
          <div class="space-y-4">
            <!-- Progress Bar -->
            <ProgressBar progress={argumentCondensationProgress} color="primary" size="md" />

            <!-- Info Messages -->
            <InfoMessages messages={mockInfoMessages} maxMessages={8} height="max-h-96" />

            <!-- Warning Messages -->
            <WarningMessages warnings={mockWarningMessages} errors={mockErrorMessages} height="max-h-96" />

            <Button
              text="Stop Monitoring"
              variant="secondary"
              on:click={() => stopTestMonitoring('argument-condensation')} />
          </div>
        {/if}
      </div>
    </div>

    <!-- Factor Analysis Box -->
    <div class="card mx-auto w-full max-w-none bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-secondary">Factor Analysis</h2>

        {#if !factorAnalysisMonitoring}
          <p class="mb-4 text-sm text-neutral">Analyze question factors and correlations</p>
          <Button
            text="Test Monitoring"
            variant="main"
            class="w-full"
            on:click={() => startTestMonitoring('factor-analysis')} />
        {:else}
          <!-- Monitoring View -->
          <div class="space-y-4">
            <!-- Progress Bar -->
            <ProgressBar progress={factorAnalysisProgress} color="secondary" size="md" />

            <!-- Info Messages -->
            <InfoMessages
              messages={[
                'Starting factor analysis...',
                'Loading question data...',
                'Calculating correlations...',
                'Processing 45 questions...',
                'Generating factor matrix...'
              ]}
              maxMessages={5}
              height="max-h-96" />

            <!-- Warning Messages -->
            <WarningMessages
              warnings={[
                'Warning: Some questions have low variance',
                'Warning: Factor loading below threshold for Q12'
              ]}
              errors={[]}
              height="max-h-96" />

            <Button text="Stop Monitoring" variant="secondary" on:click={() => stopTestMonitoring('factor-analysis')} />
          </div>
        {/if}
      </div>
    </div>

    <!-- Question Info Box -->
    <div class="card mx-auto w-full max-w-none bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-accent">Question Info</h2>

        {#if !questionInfoMonitoring}
          <p class="mb-4 text-sm text-neutral">Generate detailed question information</p>
          <Button
            text="Test Monitoring"
            variant="main"
            class="w-full"
            on:click={() => startTestMonitoring('question-info')} />
        {:else}
          <!-- Monitoring View -->
          <div class="space-y-4">
            <!-- Progress Bar -->
            <ProgressBar progress={questionInfoProgress} color="accent" size="md" />

            <!-- Info Messages -->
            <InfoMessages
              messages={['Initializing question analysis...', 'Waiting for input...']}
              maxMessages={2}
              height="max-h-96" />

            <!-- Warning Messages -->
            <WarningMessages warnings={[]} errors={[]} height="max-h-96" />

            <Button text="Stop Monitoring" variant="secondary" on:click={() => stopTestMonitoring('question-info')} />
          </div>
        {/if}
      </div>
    </div>
  </div>
</MainContent>
