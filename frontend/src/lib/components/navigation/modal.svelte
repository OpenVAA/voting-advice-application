<!-- Modal.svelte -->
<script lang="ts">
  import {_} from 'svelte-i18n';
  export let isOpen = true;
  export let onClick: () => void;
  export let buttonText: string;
</script>

<div class:none={!isOpen} class:modal2={isOpen}>
  <div class="modal-content">
    <slot />
    <div class="float-left">
      <button class="btn-success btn" on:click={() => (isOpen = false)}
        >{$_('candidateApp.navbar.close')}</button>
    </div>
    <div class="float-right">
      <button class="btn-error btn" on:click={onClick}>{buttonText}</button>
    </div>
  </div>
</div>

<style>
  .none {
    display: none;
  }

  .modal2 {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    z-index: 999;
    justify-content: center;
    align-items: center;
  }

  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
  }
</style>
