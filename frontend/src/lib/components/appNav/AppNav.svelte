<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {
    CandidatesIcon,
    HomeIcon,
    InfoIcon,
    OpinionIcon,
    PartyIcon,
    ResultsIcon
  } from '$lib/components/icons';
  import type {AppNavProps} from './AppNav.type';

  type $$Props = AppNavProps;

  // TODO: Make this dynamic based on application state and settings.
</script>

<!--
@component
Outputs the main navigation items for the application.

### Properties

- Any valid attributes of a `div` element.

### Usage

```tsx
<AppNav/>
```
-->

<div {...$$restProps}>
  <ul class="menu-group">
    <li>
      <a href="/" class="menu-item">
        <HomeIcon aria-hidden="true" />
        {$_('header.goHome')}
      </a>
    </li>
    <li>
      <a href="/questions" class="menu-item">
        <OpinionIcon aria-hidden="true" />
        {$page.data.appLabels.actionLabels.opinions}
      </a>
    </li>
    <li>
      <a href="/results" class="menu-item">
        <ResultsIcon aria-hidden="true" />
        {$page.data.appLabels.actionLabels.results}
      </a>
    </li>
  </ul>
  <ul class="menu-group">
    <li>
      <a href="/candidates" class="menu-item">
        <CandidatesIcon aria-hidden="true" />
        {$_('candidates.viewAllCandidates')}
      </a>
    </li>
    <li>
      <a href="/parties" class="menu-item">
        <PartyIcon aria-hidden="true" />
        {$_('parties.viewAllParties')}
      </a>
    </li>
  </ul>
  <ul class="menu-group">
    <li>
      <a href="/information" class="menu-item">
        <InfoIcon aria-hidden="true" />
        {$page.data.appLabels.actionLabels.electionInfo}
      </a>
    </li>
    <li>
      <a href="/about" class="menu-item">
        <InfoIcon aria-hidden="true" />
        {$page.data.appLabels.actionLabels.howItWorks}
      </a>
    </li>
  </ul>
</div>

<style lang="postcss">
  .menu-item {
    /* The pseudoclass prefixes are legal even though they are flagged as errors.
     * There's currently no easy and safe way to disable the warning */
    @apply flex min-h-touch items-center gap-md px-16 py-md !text-neutral hover:bg-base-200 active:bg-base-200;
  }
  .menu-group::before {
    content: '';
    @apply mx-16 my-md block border-t-md border-t-[var(--line-color)];
  }
</style>
