<script lang="ts">
  import {type NavigationProps, Navigation, NavGroup, NavItem} from '$lib/components/navigation';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {t} from '$lib/i18n';

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
    <NavItem
      href={getRoute(Route.CandAppHome)}
      icon="home"
      text={$t('candidateApp.navbar.start')} />
    <NavItem
      href={getRoute(Route.CandAppProfile)}
      icon="profile"
      text={$t('candidateApp.navbar.basicInfo')} />
    <NavItem
      href={getRoute(Route.CandAppQuestions)}
      icon="optinion"
      text={$t('candidateApp.navbar.yourOpinions')} />
    <NavItem
      href={getRoute(Route.CandAppSettings)}
      icon="settings"
      text={$t('candidateApp.navbar.settings')} />
    <NavItem
      href={getRoute(Route.CandAppPreview)}
      icon="previewProfile"
      text={$t('candidateApp.navbar.preview')} />
    <NavItem href={getRoute(Route.CandAppHelp)} icon="help" text={$t('candidateApp.navbar.help')} />
  </NavGroup>
  <NavGroup>
    <NavItem
      href={getRoute(Route.CandAppInfo)}
      icon="info"
      text={$t('candidateApp.navbar.electionInformation')} />
    <NavItem
      href={getRoute(Route.CandAppFAQ)}
      icon="info"
      text={$t('candidateApp.navbar.useInformation')} />
  </NavGroup>
  <NavGroup>
    <NavItem
      href={getRoute(Route.CandAppFeedback)}
      icon="feedback"
      text={$t('candidateApp.navbar.feedback')} />
  </NavGroup>
</Navigation>
