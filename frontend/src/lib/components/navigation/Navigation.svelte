<script lang="ts">
  import {_} from 'svelte-i18n';
  import {candidateAppRoute} from '$candidate/placeholder.json';
  import Modal from './modal.svelte';
  import {goto} from '$app/navigation';
  import {authContext} from '../authentication/authenticationStore';

  const user = authContext.user;

  // functions for logout button
  // TODO: add proper check of unfilled data
  let unfilledData = true;
  const logoutModalTimer = 30; // time until automatic logout for modal
  let timerInSeconds = logoutModalTimer;

  const triggerLogout = () => {
    // TODO: check if candidate has filled all the data
    if (unfilledData) {
      // isOpen = true;
      toggleModal();
    } else {
      logout();
    }
  };

  const logout = async () => {
    authContext.logOut();
    await goto(candidateAppRoute);
  };

  let toggleModal: () => void;
</script>

<!-- TODO: Replace with the proper Navigation component when it is available.
    This is a temporary solution to navigation to help with the development.
-->
<div class="drawer">
  <Modal
    bind:timerInSeconds
    bind:toggleModal
    onClick={logout}
    timerDuration={logoutModalTimer}
    buttonText={$_('candidateApp.navbar.logOut')}>
    <div class="notification text-center text-black">
      <h1>Some Of Your Data Is Still Missing</h1>
      <br />
      <p>
        There are still 10 items of basic info and 25 opinions to fill. Your data won’t be shown in
        the Election Compass until you have filled these, but you can login later to continue.
      </p>
      <p>
        Are you sure you want to logout? You will be automatically logged out after {timerInSeconds}
        seconds.
      </p>
    </div>
  </Modal>
  <input id="sidebar" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex flex-col">
    <!-- Navbar -->
    <div class="navbar w-full bg-base-300">
      <div class="flex-none">
        <label for="sidebar" aria-label="open sidebar" class="btn-ghost btn-square btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            color="black"
            viewBox="0 0 24 24"
            class="inline-block h-24 w-24 stroke-current"
            ><path stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </label>
      </div>
      <div class="mx-2 flex-1 px-2">PubLogo</div>
      <div class="flex-none">
        <ul class="menu menu-horizontal">
          <!-- Navbar menu content here -->
          <li>
            {#if $user}
              <button on:click={triggerLogout}>{$_('candidateApp.navbar.logOut')}</button>
            {/if}
          </li>
        </ul>
      </div>
    </div>
    <!-- Page content here -->
    <slot />
  </div>
  <div class="drawer-side">
    <label for="sidebar" aria-label="close sidebar" class="drawer-overlay" />
    <ul class="menu min-h-full w-3/4 bg-base-200 p-4">
      <!-- Sidebar content here -->
      <label for="sidebar" aria-label="close sidebar" class="btn-ghost btn-square btn">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-24 w-24"
          fill="none"
          color="black"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12" /></svg>
      </label>

      <!-- TODO: Replace with a NavigationItem component and use Icon component for the icons. -->
      <li>
        <a href={candidateAppRoute}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 20 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8.00001 16V11H12V16C12 16.55 12.45 17 13 17H16C16.55 17 17 16.55 17 16V8.99997H18.7C19.16 8.99997 19.38 8.42997 19.03 8.12997L10.67 0.599971C10.29 0.259971 9.71001 0.259971 9.33001 0.599971L0.970007 8.12997C0.630007 8.42997 0.840006 8.99997 1.30001 8.99997H3.00001V16C3.00001 16.55 3.45001 17 4.00001 17H7.00001C7.55001 17 8.00001 16.55 8.00001 16Z"
              fill="#333333" />
          </svg>
          {$_('candidateApp.navbar.start')}
        </a>
      </li>

      <li>
        <a href={`${candidateAppRoute}/profile`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_365_3488)">
              <path
                d="M9 11.75C8.31 11.75 7.75 12.31 7.75 13C7.75 13.69 8.31 14.25 9 14.25C9.69 14.25 10.25 13.69 10.25 13C10.25 12.31 9.69 11.75 9 11.75ZM15 11.75C14.31 11.75 13.75 12.31 13.75 13C13.75 13.69 14.31 14.25 15 14.25C15.69 14.25 16.25 13.69 16.25 13C16.25 12.31 15.69 11.75 15 11.75ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 11.71 4.02 11.42 4.05 11.14C6.41 10.09 8.28 8.16 9.26 5.77C11.07 8.33 14.05 10 17.42 10C18.2 10 18.95 9.91 19.67 9.74C19.88 10.45 20 11.21 20 12C20 16.41 16.41 20 12 20Z"
                fill="#333333" />
            </g>
            <defs>
              <clipPath id="clip0_365_3488">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>

          {$_('candidateApp.navbar.basicInfo')}
        </a>
      </li>

      <li>
        <a href={`${candidateAppRoute}/opinions`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_365_3490)">
              <path
                d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z"
                fill="#333333" />
            </g>
            <defs>
              <clipPath id="clip0_365_3490">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>

          {$_('candidateApp.navbar.yourOpinions')}
        </a>
      </li>

      <li>
        <a href={`${candidateAppRoute}/settings`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_365_3489)">
              <path
                d="M19.14 12.9399C19.18 12.6399 19.2 12.3299 19.2 11.9999C19.2 11.6799 19.18 11.3599 19.13 11.0599L21.16 9.4799C21.34 9.3399 21.39 9.0699 21.28 8.8699L19.36 5.5499C19.24 5.3299 18.99 5.2599 18.77 5.3299L16.38 6.2899C15.88 5.9099 15.35 5.5899 14.76 5.3499L14.4 2.8099C14.36 2.5699 14.16 2.3999 13.92 2.3999H10.08C9.84 2.3999 9.65 2.5699 9.61 2.8099L9.25 5.3499C8.66 5.5899 8.12 5.9199 7.63 6.2899L5.24 5.3299C5.02 5.2499 4.77 5.3299 4.65 5.5499L2.74 8.8699C2.62 9.0799 2.66 9.3399 2.86 9.4799L4.89 11.0599C4.84 11.3599 4.8 11.6899 4.8 11.9999C4.8 12.3099 4.82 12.6399 4.87 12.9399L2.84 14.5199C2.66 14.6599 2.61 14.9299 2.72 15.1299L4.64 18.4499C4.76 18.6699 5.01 18.7399 5.23 18.6699L7.62 17.7099C8.12 18.0899 8.65 18.4099 9.24 18.6499L9.6 21.1899C9.65 21.4299 9.84 21.5999 10.08 21.5999H13.92C14.16 21.5999 14.36 21.4299 14.39 21.1899L14.75 18.6499C15.34 18.4099 15.88 18.0899 16.37 17.7099L18.76 18.6699C18.98 18.7499 19.23 18.6699 19.35 18.4499L21.27 15.1299C21.39 14.9099 21.34 14.6599 21.15 14.5199L19.14 12.9399ZM12 15.5999C10.02 15.5999 8.4 13.9799 8.4 11.9999C8.4 10.0199 10.02 8.3999 12 8.3999C13.98 8.3999 15.6 10.0199 15.6 11.9999C15.6 13.9799 13.98 15.5999 12 15.5999Z"
                fill="#333333" />
            </g>
            <defs>
              <clipPath id="clip0_365_3489">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
          {$_('candidateApp.navbar.settings')}
        </a>
      </li>

      <li>
        <a href={`${candidateAppRoute}/preview`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_365_3491)">
              <path
                d="M4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6ZM20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM14 4C15.66 4 17 5.34 17 7C17 8.66 15.66 10 14 10C12.34 10 11 8.66 11 7C11 5.34 12.34 4 14 4ZM20 16H8V14.5C8 12.51 12 11.5 14 11.5C16 11.5 20 12.51 20 14.5V16Z"
                fill="#333333" />
            </g>
            <defs>
              <clipPath id="clip0_365_3491">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
          {$_('candidateApp.navbar.preview')}
        </a>
      </li>

      <li>
        <a href={`${candidateAppRoute}/help`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_364_3731)">
              <path
                d="M11 18H13V16H11V18ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 6C9.79 6 8 7.79 8 10H10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 12 11 11.75 11 15H13C13 12.75 16 12.5 16 10C16 7.79 14.21 6 12 6Z"
                fill="#333333" />
            </g>
            <defs>
              <clipPath id="clip0_364_3731">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
          {$_('candidateApp.navbar.help')}
        </a>
      </li>

      <hr class="my-8 h-px border-0 bg-secondary" />

      <li>
        <a href={`${candidateAppRoute}/electioninfo`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_327_2534)">
              <path
                d="M11 7H13V9H11V7ZM11 11H13V17H11V11ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                fill="#333333" />
            </g>
            <defs>
              <clipPath id="clip0_327_2534">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>

          {$_('candidateApp.navbar.electionInformation')}
        </a>
      </li>

      <li>
        <a href={`${candidateAppRoute}/faq`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_327_2534)">
              <path
                d="M11 7H13V9H11V7ZM11 11H13V17H11V11ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                fill="#333333" />
            </g>
            <defs>
              <clipPath id="clip0_327_2534">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
          {$_('candidateApp.navbar.useInformation')}
        </a>
      </li>

      <hr class="border-1 my-8 h-px bg-secondary" />

      <li>
        <a href={`${candidateAppRoute}/feedback`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_2341_11378)">
              <path
                d="M20 2H4.00999C2.90999 2 2.00999 2.9 2.00999 4V22L5.99999 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM13 14H11V12H13V14ZM13 9C13 9.55 12.55 10 12 10C11.45 10 11 9.55 11 9V7C11 6.45 11.45 6 12 6C12.55 6 13 6.45 13 7V9Z"
                fill="#333333" />
            </g>
            <defs>
              <clipPath id="clip0_2341_11378">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
          {$_('candidateApp.navbar.feedback')}
        </a>
      </li>
    </ul>
  </div>
</div>
