<script lang="ts">
  import {getContext} from 'svelte';
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import Footer from '$lib/components/footer/Footer.svelte';
  import type {AuthContext} from './authenticationStore';

  const authContext = getContext<AuthContext>('auth');

  let email = '';
  let password = '';
  let wrongCredentials = false;
  const onLogin = async () => {
    if (!(await authContext?.logIn(email, password))) {
      wrongCredentials = true;
    }
  };
</script>

<div class="flex w-full flex-grow flex-col items-center bg-base-300">
  <figure class="hero bg-[#d4dbef]">
    <img
      class="h-[30vh] w-full max-w-lg bg-white object-cover"
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
        <form class="flex flex-col flex-nowrap items-center" on:submit|preventDefault={onLogin}>
          <p class="text-center">
            {$_('candidate.enter_email_and_password')}
          </p>
          <label for="email" class="hidden">{$_('candidate.email')}</label>
          <input
            type="email"
            name="email"
            id="email"
            class="input mb-md w-full max-w-md"
            placeholder={$_('candidate.email_placeholder')}
            bind:value={email}
            autocomplete="email"
            required />
          <label for="password" class="hidden">{$_('candidate.password')}</label>
          <input
            type="password"
            name="password"
            id="password"
            class="input mb-md w-full max-w-md"
            placeholder={$_('candidate.password_placeholder')}
            bind:value={password}
            autocomplete="current-password"
            required />
          {#if wrongCredentials}
            <p class="text-center text-error">{$_('candidate.wrong_email_or_password')}</p>
          {/if}
          <button type="submit" class="btn-primary btn mb-md w-full max-w-md"
            >{$_('candidate.sign_in')}</button>
          <a href="/help" class="btn-ghost btn w-full max-w-md"
            >{$_('candidate.contact_support')}</a>
          <a href="/" class="btn-ghost btn w-full max-w-md"
            >{$_('candidate.election_compass_for_voters')}</a>
        </form>
      </div>
    </div>
  </main>

  <Footer />
</div>
