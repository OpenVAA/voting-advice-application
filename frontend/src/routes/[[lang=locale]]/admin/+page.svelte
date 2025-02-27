<!--@component
# Admin Home Page

Main landing page for admin section showing available tools
-->

<script lang="ts">
  import { getAppContext } from '$lib/contexts/app';
  import { Card } from '$lib/components/card';

  const { t } = getAppContext();
</script>

<div class="container mx-auto p-6">
  <div class="mb-8">
    <h1 class="text-3xl font-bold">Hello, Admin!</h1>
    <p class="mt-2 text-gray-600">Use the tools below to manage the voting advice application.</p>
  </div>

  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <a href="/admin/factor-analysis" class="block h-full p-6">
        <div class="flex items-center gap-4">
          <span class="material-icons text-primary-600 text-3xl">analytics</span>
          <div>
            <h2 class="font-semibold text-xl">Factor analysis</h2>
            <p class="mt-2 text-gray-600">
              Compute the latent factors from the answers given by candidates and parties.
            </p>
          </div>
        </div>
      </a>
    </Card>

    <!-- These cards will be implemented later -->
    <Card>
      <div class="pointer-events-none opacity-50">
        <div class="block h-full p-6">
          <div class="flex items-center gap-4">
            <span class="material-icons text-primary-600 text-3xl">help</span>
            <div>
              <h2 class="font-semibold text-xl">Question info generation</h2>
              <p class="mt-2 text-gray-600">Generate additional information for questions using AI.</p>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <Card>
      <div class="pointer-events-none opacity-50">
        <div class="block h-full p-6">
          <div class="flex items-center gap-4">
            <span class="material-icons text-primary-600 text-3xl">format_align_left</span>
            <div>
              <h2 class="font-semibold text-xl">Argument condensation</h2>
              <p class="mt-2 text-gray-600">Condense candidate arguments using AI.</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</div>
