<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
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

<Navigation slot="nav" on:navFocusOut {...$$restProps}>
  <slot />
  <NavGroup>
    <NavItem href="/" icon="home" text={$page.data.appLabels.actionLabels.home} />
    <NavItem href="/questions" icon="opinion" text={$page.data.appLabels.actionLabels.opinions} />
    <!-- Only output the link to results if they are available -->
    {#if $candidateRankings.length > 0}
      <NavItem href="/results" icon="results" text={$page.data.appLabels.actionLabels.results} />
    {/if}
  </NavGroup>
  <NavGroup>
    <NavItem href="/candidates" icon="candidates" text={$_('candidates.viewAllCandidates')} />
    <NavItem href="/parties" icon="party" text={$_('parties.viewAllParties')} />
  </NavGroup>
  <NavGroup>
    <NavItem
      href="/information"
      icon="info"
      text={$page.data.appLabels.actionLabels.electionInfo} />
    <NavItem href="/about" icon="info" text={$page.data.appLabels.actionLabels.howItWorks} />
  </NavGroup>
</Navigation>
