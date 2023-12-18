<script lang="ts">
  import {type NavigationProps, Navigation, NavGroup, NavItem} from '$lib/components/navigation';
  import {candidateAppRoute} from '$candidate/placeholder.json';
  import {_} from 'svelte-i18n';

  type $$Props = NavigationProps;
</script>

<!--
@component
A template part that outputs the navigation menu for the Candidate App for use in the 
`Page` template.

### Slots

- default: Any elements to insert at the beginning of the navigation menu, in most
  cases the close button for the navigation menu. Use `NavItem` for this with an 
  `on:click` handler for that.

### Usage

```tsx
<CandidateNav>
  <NavItem slot="close" on:click={closeMenu} icon="close" text="Close"/>
</CandidateNav>
```
-->

<Navigation slot="nav" on:navFocusOut {...$$restProps}>
  <slot />
  <NavGroup>
    <NavItem href={candidateAppRoute} icon="home" text={$_('candidateApp.navbar.start')} />
    <NavItem
      href={`${candidateAppRoute}/profile`}
      icon="profile"
      text={$_('candidateApp.navbar.basicInfo')} />
    <NavItem
      href={`${candidateAppRoute}/opinions`}
      icon="optinion"
      text={$_('candidateApp.navbar.yourOpinions')} />
    <NavItem
      href={`${candidateAppRoute}/settings`}
      icon="settings"
      text={$_('candidateApp.navbar.settings')} />
    <NavItem
      href={`${candidateAppRoute}/preview`}
      icon="previewProfile"
      text={$_('candidateApp.navbar.preview')} />
    <NavItem href={`${candidateAppRoute}/help`} icon="help" text={$_('candidateApp.navbar.help')} />
  </NavGroup>
  <NavGroup>
    <NavItem
      href={`${candidateAppRoute}/electioninfo`}
      icon="info"
      text={$_('candidateApp.navbar.electionInformation')} />
    <NavItem
      href={`${candidateAppRoute}/faq`}
      icon="info"
      text={$_('candidateApp.navbar.useInformation')} />
  </NavGroup>
  <NavGroup>
    <NavItem
      href={`${candidateAppRoute}/feedback`}
      icon="feedback"
      text={$_('candidateApp.navbar.feedback')} />
  </NavGroup>
</Navigation>
