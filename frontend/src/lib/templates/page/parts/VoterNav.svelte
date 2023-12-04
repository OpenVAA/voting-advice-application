<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {candidateRankings} from '$lib/utils/stores';
  import {type NavigationProps, Navigation, NavGroup, NavItem} from '$lib/components/navigation';

  type $$Props = NavigationProps;
</script>

<!--
@component
A template part that outputs the navigation menu for the Voter App for use in the 
`Page` template.

### Slots

- default: Any elements to insert at the beginning of the navigation menu, in most
  cases the close button for the navigation menu. Use `NavItem` for this with an 
  `on:click` handler for that.

### Properties

- Any valid properties of a `Navigation` component.

### Usage

```tsx
<VoterNav>
  <NavItem slot="close" on:click={closeMenu} icon="close" text="Close"/>
</VoterNav>
```
-->

<Navigation slot="nav" on:keyboardFocusOut {...$$restProps}>
  <slot />
  <NavGroup>
    <NavItem href={getRoute(Route.Home)} icon="home" text={$t('actionLabels.home')} />
    <NavItem href={getRoute(Route.Questions)} icon="opinion" text={$t('actionLabels.opinions')} />
    <!-- Only output the link to results if they are available -->
    {#if $candidateRankings.length > 0}
      <NavItem href={getRoute(Route.Results)} icon="results" text={$t('actionLabels.results')} />
    {/if}
  </NavGroup>
  <NavGroup>
    <NavItem
      href={getRoute(Route.Candidates)}
      icon="candidates"
      text={$t('candidates.viewAllCandidates')} />
    <NavItem href={getRoute(Route.Parties)} icon="party" text={$t('parties.viewAllParties')} />
  </NavGroup>
  <NavGroup>
    <NavItem href={getRoute(Route.Info)} icon="info" text={$t('actionLabels.electionInfo')} />
    <NavItem href={getRoute(Route.About)} icon="info" text={$t('actionLabels.howItWorks')} />
  </NavGroup>
</Navigation>
