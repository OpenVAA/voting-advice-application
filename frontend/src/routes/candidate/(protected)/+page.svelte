<script lang="ts">
  import {LogoutButton} from '$lib/candidate/components/logoutButton';
  import {BasicPage} from '$lib/templates/basicPage';
</script>

<!-- TODO: Add i18n translations -->
<BasicPage title="Welcome to the Candidate App">
  <LogoutButton slot="banner" />
</BasicPage>
