<!--
@component
A floating chat widget for helping voters with questions.

### Properties

- `isOpen`: Whether the widget is currently visible
- `questionContext`: Optional context about the current question the voter is viewing
- `locale`: The language locale for the chatbot
- `onClose`: Callback for when the close button is clicked

### Usage

```svelte
<ChatbotWidget
  bind:isOpen={chatbotOpen}
  {questionContext}
  {locale}
  onClose={() => chatbotOpen = false} />
```
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { createChatStore } from '$lib/chatbot';
  import type { ChatbotWidgetProps } from './ChatbotWidget.type';

  type $$Props = ChatbotWidgetProps;

  export let isOpen: $$Props['isOpen'] = false;
  export let questionContext: $$Props['questionContext'] = undefined;
  export let locale: $$Props['locale'];
  export let onClose: $$Props['onClose'] = undefined;

  // Create the chat store
  const chatStore = createChatStore({ locale, questionContext });

  // Derived state from store
  $: messages = $chatStore.messages;
  $: loading = $chatStore.loading;

  let input = '';
  let messagesContainer: HTMLDivElement;

  async function handleSendMessage() {
    if (!input.trim() || loading) return;
    const messageText = input;
    input = '';
    await chatStore.sendMessage(messageText);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  function adjustTextareaHeight(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  onMount(() => {
    chatStore.initialize();
  });

  onDestroy(() => {
    chatStore.destroy();
  });
</script>

{#if isOpen}
  <div class="widget-wrapper" transition:fly={{ y: 20, duration: 200 }}>
    <div class="header">
      <div class="header-content">
        <div class="header-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div class="header-title">Chat Assistant</div>
      </div>
      <div class="header-actions">
        <button class="new-conversation-button" type="button" on:click={() => chatStore.resetConversation()}>
          New conversation
        </button>
        <button class="close-button" on:click={onClose} aria-label="Close chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <div class="messages" bind:this={messagesContainer}>
      {#each messages as message}
        <div class="message-wrapper {message.role}">
          <div class="avatar {message.role}">
            {#if message.role === 'user'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>
              </svg>
            {:else}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            {/if}
          </div>
          <div class="message">
            {#each message.parts as part}
              {#if part.type === 'text' && 'text' in part}
                {part.text}
              {/if}
            {/each}
          </div>
        </div>
      {/each}

      {#if loading}
        <div class="message-wrapper assistant">
          <div class="assistant avatar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </div>
        </div>
      {/if}
    </div>

    <div class="input-container">
      <form
        on:submit={(event) => {
          event.preventDefault();
          handleSendMessage();
        }}>
        <div class="input-wrapper">
          <textarea
            bind:value={input}
            placeholder="Send a message..."
            on:keydown={handleKeydown}
            on:input={adjustTextareaHeight}
            disabled={loading}></textarea>
          <button class="send-button" type="submit" aria-label="Send message" disabled={!input.trim() || loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .widget-wrapper {
    position: fixed;
    bottom: 5.5rem;
    right: 1rem;
    width: 400px;
    max-width: calc(100vw - 2rem);
    height: 600px;
    max-height: calc(100vh - 8rem);
    display: flex;
    flex-direction: column;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    color: #202123;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    z-index: 40;
  }

  .header {
    padding: 1rem 1.25rem;
    background: #ffffff;
    border-bottom: 1px solid #e5e5e5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .header-icon {
    width: 28px;
    height: 28px;
    background: #10a37f;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 16px;
  }

  .header-title {
    font-size: 1rem;
    font-weight: 600;
    color: #202123;
  }

  .close-button {
    padding: 0.25rem;
    border: none;
    background: transparent;
    color: #8e8ea0;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;
  }

  .close-button:hover {
    background: #f7f7f8;
    color: #202123;
  }

  .new-conversation-button {
    padding: 0.35rem 0.7rem;
    border-radius: 9999px;
    border: 1px solid #e5e5e5;
    background: #f7f7f8;
    color: #202123;
    font-size: 0.75rem;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .new-conversation-button:hover {
    background: #ffffff;
    border-color: #10a37f;
    color: #10a37f;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0;
    background: #ffffff;
    scroll-behavior: smooth;
  }

  .messages::-webkit-scrollbar {
    width: 8px;
  }

  .messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .messages::-webkit-scrollbar-thumb {
    background: #c5c5d2;
    border-radius: 4px;
  }

  .messages::-webkit-scrollbar-thumb:hover {
    background: #9a9aa8;
  }

  .message-wrapper {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .message-wrapper.user {
    background: #f7f7f8;
  }

  .message-wrapper.assistant {
    background: #ffffff;
  }

  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 13px;
    color: white;
  }

  .avatar.user {
    background: #5436da;
  }

  .avatar.assistant {
    background: #10a37f;
  }

  .message {
    flex: 1;
    line-height: 1.6;
    font-size: 0.875rem;
    color: #202123;
    word-wrap: break-word;
    white-space: pre-wrap;
  }

  .loading-dots {
    display: flex;
    gap: 3px;
    padding: 0.5rem 0;
  }

  .loading-dot {
    width: 6px;
    height: 6px;
    background: #8e8ea0;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }

  .loading-dot:nth-child(1) {
    animation-delay: -0.32s;
  }

  .loading-dot:nth-child(2) {
    animation-delay: -0.16s;
  }

  .input-container {
    padding: 0.75rem 1rem 1rem;
    background: #ffffff;
    border-top: 1px solid #e5e5e5;
    flex-shrink: 0;
  }

  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    background: #ffffff;
    border: 1px solid #d9d9e3;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    transition: border-color 0.2s ease;
  }

  .input-wrapper:focus-within {
    border-color: #10a37f;
  }

  textarea {
    flex: 1;
    border: none;
    outline: none;
    resize: none;
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #202123;
    background: transparent;
    min-height: 20px;
    max-height: 120px;
    padding: 0.25rem 0;
  }

  textarea::placeholder {
    color: #8e8ea0;
  }

  .send-button {
    padding: 0.375rem;
    border: none;
    border-radius: 4px;
    background: #ffffff;
    color: #8e8ea0;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
  }

  .send-button:hover:not(:disabled) {
    color: #202123;
  }

  .send-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
</style>
