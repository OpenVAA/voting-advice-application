<!--@component

# Admin app unauthorized page

- Shows when a user is authenticated but doesn't have admin permissions

-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import MainContent from '../../MainContent.svelte';
</script>

<MainContent title="Unauthorized Access">
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji="🔒" />
  </figure>

  <div class="flex flex-col items-center gap-8 py-8 text-center">
    <h2 class="font-semibold text-xl">You don't have permission to access the Admin area</h2>
    <p>
      Your account does not have the required admin privileges. If you believe this is an error, please contact the
      system administrator.
    </p>

    <div class="mt-8">
      <Button href="/" text="Return to Home" variant="main" />
    </div>
  </div>
</MainContent>
