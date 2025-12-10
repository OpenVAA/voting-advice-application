<!--
@component
A small circular floating action button that toggles the chatbot widget.

### Properties

- `isOpen`: Whether the chatbot widget is currently open

### Callbacks

- `on:click`: Callback for when the button is clicked
-->

<script lang="ts">
  import type { ChatbotToggleButtonProps } from './ChatbotToggleButton.type';

  type $$Props = ChatbotToggleButtonProps;

  export let isOpen: $$Props['isOpen'] = false;
</script>

<button
  on:click
  class="fixed bottom-10 right-10 z-50 flex h-42 w-42 items-center justify-center rounded-full bg-primary text-primary-content shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
  aria-label={isOpen ? 'Close chatbot' : 'Open chatbot'}>
  <!-- Chatbot icon -->
  <img
    src="/icons/chatbot_icon.svg"
    alt=""
    aria-hidden="true"
    class="h-60 w-60"
  />
</button>
