<script lang="ts">
  import {MainContent, PageConfig} from './parts';
</script>

<PageConfig containerClass="text-warning" />

<MainContent>
  <h1>Main page content</h1>
  <p>Text should be red</p>
  <p>
    <a href="/_test/templates-v2-poc/subpage">Subpage</a>
  </p>
  <ul>
    <li>Add another layout for cand/voter, but check if we can slot in navigation this way</li>
    <li>Figure out main role</li>
  </ul>
</MainContent>
