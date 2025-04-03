<!--@component
# Admin Home Page

Main landing page for admin section showing available tools
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import MainContent from '../../../MainContent.svelte';

  const { t } = getAppContext();
  const title = 'Hello, Admin!';
</script>

<MainContent {title}>
  <p class="text-center">Use the tools below to manage the voting advice application.</p>

  <div class="flex flex-col gap-sm">
    <Button href="/en/admin/factor-analysis" text="Factor analysis" icon="create" iconPos="left" variant="normal">
      <svelte:fragment slot="badge">
        <span class="text-primary-600 font-mono"></span>
      </svelte:fragment>
    </Button>

    <Button
      href="/en/admin/question-info"
      text="Question info generation"
      icon="create"
      iconPos="left"
      variant="normal">
      <svelte:fragment slot="badge">
        <span class="font-mono text-gray-400"></span>
      </svelte:fragment>
    </Button>

    <Button text="Argument condensation" icon="create" iconPos="left" variant="normal" disabled>
      <svelte:fragment slot="badge">
        <span class="font-mono text-gray-400"></span>
      </svelte:fragment>
    </Button>
  </div>
</MainContent>
