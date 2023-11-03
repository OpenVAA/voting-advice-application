<script lang="ts">
  import {page} from '$app/stores';
</script>

<div class="flex w-full flex-grow flex-col items-center bg-base-300">
  <figure class="hero bg-[#d4dbef]">
    <img
      class="max-h-[30vh] w-full max-w-lg bg-white object-cover"
      src="/images/hero-candidate.png"
      alt=""
      srcset="" />
  </figure>

  <main class="flex-grow">
    <div class="flex max-w-xl flex-col items-center p-lg pl-safelgl pr-safelgr">
      <div class="flex flex-col flex-nowrap items-center">
        <hgroup class="py-lg">
          <p class="text-2xl font-bold text-primary">{$page.data.appLabels.appTitle}</p>
          <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
        </hgroup>
        <p class="text-center">
          Enter the passkey you've received from your party to edit your data and opinions. <!-- TODO: locale -->
        </p>
        <input
          type="password"
          name="passkey"
          id="passkey"
          class="input mb-md"
          placeholder="E.g. CP23-174a-f4%&-aHAB"
          required />
        <button on:click={() => {}} class="btn-primary btn mb-md w-full max-w-md">Sign in</button>
        <!-- TODO: locale, login functionality -->
        <a href="/help" class="btn-ghost btn w-full max-w-md">Contact Support</a>
        <!-- TODO: locale, link -->
        <a href="/candidate" class="btn-ghost btn w-full max-w-md">Election Compass for Voters</a>
        <!-- TODO: locale, link -->
      </div>
    </div>
  </main>

  <footer class="p-lg text-center text-sm text-secondary">
    {$page.data.appLabels.viewTexts.publishedBy.replace('{{0}}', '')}
    <img class="inline w-14" src={'/icons/publisher.svg'} alt="governmental" srcset="" />
    Institution • {$page.data.appLabels.viewTexts.madeWith.replace('{{0}}', '')}
    <img class="inline w-14" src="/icons/vote.svg" alt="" srcset="" /> OpenVAA
  </footer>
</div>
