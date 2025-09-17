<script lang="ts">
  let messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  let input = '';
  let loading = false;

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user' as const, content: input };
    messages = [...messages, userMessage];
    input = '';
    loading = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((msg) => ({
            id: Math.random().toString(),
            role: msg.role,
            parts: [{ type: 'text', text: msg.content }]
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      messages = [...messages, { role: 'assistant', content: '' }];
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        messages = messages.map((msg, index) =>
          index === messages.length - 1 ? { ...msg, content: msg.content + chunk } : msg
        );
      }
    } catch (error) {
      console.error('Error:', error);
      messages = [...messages, { role: 'assistant', content: 'Sorry, there was an error.' }];
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="mx-auto flex h-screen max-w-2xl flex-col p-4">
  <h1 class="mb-4 text-2xl font-bold">OpenVAA Chat</h1>

  <div class="mb-4 flex-1 space-y-6 overflow-y-auto">
    {#each messages as message}
      <div class="p-3 rounded {message.role === 'user' ? 'ml-8 bg-blue-100' : 'mr-8 bg-gray-100'}">
        <div class="font-semibold mb-1">{message.role === 'user' ? 'You' : 'Assistant'}</div>
        <div class="whitespace-pre-wrap">{message.content}</div>
      </div>
    {/each}

    {#if loading}
      <div class="p-3 mr-8 rounded bg-gray-100">
        <div class="font-semibold mb-1">Assistant</div>
        <div>Thinking...</div>
      </div>
    {/if}
  </div>

  <div class="gap-3 flex">
    <input
      bind:value={input}
      on:keydown={handleKeydown}
      placeholder="Ask a question..."
      class="py-3 flex-1 rounded border px-4 text-lg"
      disabled={loading} />
    <button
      on:click={sendMessage}
      disabled={loading || !input.trim()}
      class="py-3 rounded bg-blue-600 px-6 text-white disabled:bg-gray-300">
      Send
    </button>
  </div>
</div>
