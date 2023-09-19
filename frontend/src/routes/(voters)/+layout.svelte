<script lang="ts">
  import {page} from '$app/stores';
  import {beforeNavigate} from '$app/navigation';
  import {_} from 'svelte-i18n';

  // TODO: This navigation system may be obsolete. Most of the navigation in mobile
  // devices is done by using the back button. We need to analize if having this navigation menu is
  // necessary.
  let userNavigation: string[] = [];
  let from = '/';

  beforeNavigate((navigate) => {
    if (from === navigate?.to?.url.pathname) {
      userNavigation.shift();
    } else if (navigate?.from?.url.pathname) {
      userNavigation.unshift(navigate.from.url.pathname);
    }
    if (userNavigation.length > 0) {
      from = userNavigation[0];
    } else {
      from = '/';
    }
  });
</script>

<header class="fixed left-0 right-0 top-0 z-50">
  <nav class="bg-primary p-4">
    <ul class="flex items-center justify-between">
      <li class="mr-6">
        <a class="text-primary hover:text-secondary" href={from}>
          <svg
            width="12"
            height="14"
            class="inline fill-link hover:fill-link-hover"
            viewBox="0 2 12 18"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M11.67 1.8701L9.9 0.100098L0 10.0001L9.9 19.9001L11.67 18.1301L3.54 10.0001L11.67 1.8701Z" />
          </svg>
          {$page.data.appLabels.actionLabels.previous}</a>
      </li>
      {#if $page.url.pathname === '/questions'}
        <h2 class="flex justify-center text-xl font-bold max-md:hidden">
          {$_('questions.questionsTitle')}
        </h2>
      {/if}
      <li class="mr-6">
        <a class="text-primary hover:text-secondary" href="/help"
          >{$page.data.appLabels.actionLabels.help}
          <svg
            width="22"
            height="22"
            viewBox="0 0 29 28"
            class="inline fill-link hover:fill-link-hover"
            xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_282_3907)">
              <path
                d="M13.3333 21.0002H15.6667V18.6668H13.3333V21.0002ZM14.5 2.3335C8.06001 2.3335 2.83334 7.56016 2.83334 14.0002C2.83334 20.4402 8.06001 25.6668 14.5 25.6668C20.94 25.6668 26.1667 20.4402 26.1667 14.0002C26.1667 7.56016 20.94 2.3335 14.5 2.3335ZM14.5 23.3335C9.35501 23.3335 5.16668 19.1452 5.16668 14.0002C5.16668 8.85516 9.35501 4.66683 14.5 4.66683C19.645 4.66683 23.8333 8.85516 23.8333 14.0002C23.8333 19.1452 19.645 23.3335 14.5 23.3335ZM14.5 7.00016C11.9217 7.00016 9.83334 9.0885 9.83334 11.6668H12.1667C12.1667 10.3835 13.2167 9.3335 14.5 9.3335C15.7833 9.3335 16.8333 10.3835 16.8333 11.6668C16.8333 14.0002 13.3333 13.7085 13.3333 17.5002H15.6667C15.6667 14.8752 19.1667 14.5835 19.1667 11.6668C19.1667 9.0885 17.0783 7.00016 14.5 7.00016Z" />
            </g>
            <defs>
              <clipPath id="clip0_282_3907">
                <rect width="28" height="28" fill="white" transform="translate(0.5)" />
              </clipPath>
            </defs>
          </svg>
        </a>
      </li>
    </ul>
  </nav>
</header>

<main class="h-full pb-14 pt-14">
  <slot />
</main>

<footer class="fixed bottom-0 w-full">
  {#if $page.url.pathname === '/'}
    <div class="mb-4 flex flex-col items-center justify-between gap-3 text-secondary">
      <p class="text-center text-xs">
        {$page.data.appLabels.viewTexts.publishedBy.replace('{{0}}', '')}
        <img
          class="inline w-6"
          src={'/icons/publisher.svg'}
          alt="governmental"
          srcset="" />institution • {$page.data.appLabels.viewTexts.madeWith.replace('{{0}}', '')}
        <img class="inline w-6" src="/icons/vote.svg" alt="" srcset="" />GIPVAA
      </p>
    </div>
  {:else if $page.url.pathname === '/questions'}
    <div class="mb-4 flex flex-col items-center justify-between gap-3 text-secondary">
      <p class="text-center text-sm">
        <img class="inline w-6" src="/icons/tip.svg" alt="" srcset="" />
        {$page.data.appLabels.viewTexts.questionsTip}
      </p>
    </div>
  {/if}
  <nav class="bg-primary p-4">
    <ul class="flex items-center justify-between">
      <li class="mr-6">
        <p>
          {$page.params.slug ? `${$page.params.slug} statements answered` : ''}
        </p>
      </li>
      <li class="mr-6">
        {#if $page.url.pathname === '/results'}
          <a class="text-primary hover:text-secondary" href="/questions">Questions</a>
        {:else}
          <a class="text-primary hover:text-secondary" href="/results"
            >{$page.data.appLabels.actionLabels.results}</a>
        {/if}
      </li>
    </ul>
  </nav>
</footer>

<style>
  header nav {
    border-bottom: 1px solid #eee;
  }
  :target {
    scroll-margin-top: 5rem;
  }

  footer nav {
    border-top: 1px solid #eee;
  }
</style>
