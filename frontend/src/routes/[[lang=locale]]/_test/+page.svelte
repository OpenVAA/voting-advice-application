<script lang="ts">
  import InputWIP from '$lib/components/input/InputWIP.svelte';
  import {BasicPage} from '$lib/templates/basicPage';

  function onChange(value: Date | undefined) {
    console.log('New value:', value);
  }
</script>

<BasicPage title="Test" mainClass="bg-base-200">
  <div class="w-full">
    <InputWIP type="boolean" label="Boolean" info="This is info" />
    <InputWIP type="number" label="Locked number" locked={true} value="123" />
    <InputWIP type="text" label="Text" placeholder="This is placeholder :-)" />
    <InputWIP type="date" label="Date" {onChange} value="lörs" />
    <InputWIP type="text-multilingual" label="Multilingual" locked={false} />
  </div>
</BasicPage>
