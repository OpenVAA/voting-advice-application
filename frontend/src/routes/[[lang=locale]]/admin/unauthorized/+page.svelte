<!--@component

# Admin app unauthorized page

- Shows when a user is authenticated but doesn't have admin permissions

-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import MainContent from '../../MainContent.svelte';
</script>

<MainContent title="Admin Access Required">
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji="🔒" />
  </figure>

  <div class="flex flex-col items-center gap-8 py-8 text-center">
    <h2 class="font-semibold text-xl">You need admin privileges to access this area</h2>
    <div class="max-w-md space-y-4">
      <p>Your account has been authenticated, but you don't have the required admin privileges.</p>
      <p>
        This section is reserved for system administrators only. If you believe you should have access, please contact
        the system administrator.
      </p>
    </div>

    <div class="mt-8 flex flex-col gap-4">
      <Button href="/" text="Return to Home" variant="main" />
      <Button href="/admin/login" text="Try Another Account" variant="normal" />
    </div>
  </div>
</MainContent>
