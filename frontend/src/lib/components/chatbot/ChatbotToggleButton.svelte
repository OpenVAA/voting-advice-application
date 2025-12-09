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
  <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 14h.5c.827 0 1.5-.673 1.5-1.5v-9c0-.827-.673-1.5-1.5-1.5h-13C2.673 2 2 2.673 2 3.5V18l5.333-4H16zm-9.333-2L4 14V4h12v8H6.667z"/>
    <path d="M20.5 8H20v6.001c0 1.1-.893 1.993-1.99 1.999H8v.5c0 .827.673 1.5 1.5 1.5h7.167L22 22V9.5c0-.827-.673-1.5-1.5-1.5z"/>
  </svg>
</button>
