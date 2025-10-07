<script lang="ts">
  interface UIMessage {
    id: string;
    role: 'user' | 'assistant';
    parts: Array<
      | {
          type: 'text';
          text: string;
          state?: 'streaming' | 'done';
        }
      | {
          type: 'tool-findCandidateInfo';
          toolCallId: string;
          state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
          input?: any;
          output?: any;
          errorText?: string;
        }
    >;
  }

  let messages: UIMessage[] = [];
  let input = '';
  let loading = false;

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: UIMessage = {
      id: Math.random().toString(),
      role: 'user',
      parts: [{ type: 'text', text: input, state: 'done' }]
    };
    messages = [...messages, userMessage];
    input = '';
    loading = true;

    try {
      console.log('[Chatbot] Starting API request for assistant response');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            parts: msg.parts
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      // Add empty assistant message
      const assistantMessage: UIMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        parts: []
      };
      messages = [...messages, assistantMessage];
      console.log('[Chatbot] Started processing SSE stream for assistant message:', assistantMessage.id);

      const decoder = new TextDecoder();

      // SSE state
      let sseBuffer = '';
      let eventName = '';
      let dataBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line; dispatch on blank line
        let newlineIndex;
        while ((newlineIndex = sseBuffer.indexOf('\n')) !== -1) {
          const line = sseBuffer.slice(0, newlineIndex);
          sseBuffer = sseBuffer.slice(newlineIndex + 1);

          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            // Accumulate multi-line data
            dataBuffer += line.slice(5).trimStart() + '\n';
          } else if (line === '') {
            // Message boundary: dispatch accumulated event/data
            const raw = dataBuffer.trim();

            // Reset buffers for next message
            const currentEvent = eventName;
            eventName = '';
            dataBuffer = '';

            if (!raw) continue;
            if (raw === '[DONE]') {
              handleStreamChunk({ type: 'finish' });
              continue;
            }

            try {
              const payload = JSON.parse(raw);
              const withType = payload.type ? payload : { type: currentEvent || payload.type, ...payload };
              console.log(
                '[Chatbot] Received stream chunk:',
                withType.type,
                withType.type === 'text-delta' ? `"${withType.delta}"` : withType
              );
              handleStreamChunk(withType);
            } catch {
              console.warn('Failed to parse SSE payload:', raw);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      messages = [
        ...messages,
        {
          id: Math.random().toString(),
          role: 'assistant',
          parts: [{ type: 'text', text: 'Sorry, there was an error.', state: 'done' }]
        }
      ];
    } finally {
      loading = false;
    }
  }

  function handleStreamChunk(data: any) {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;

    if (data.type === 'text-delta') {
      // Handle text streaming
      const textPart = lastMessage.parts.find((p) => p.type === 'text') as any;
      if (textPart) {
        textPart.text += data.delta;
        textPart.state = 'streaming';
      } else {
        lastMessage.parts.push({
          type: 'text',
          text: data.delta,
          state: 'streaming'
        });
      }
      messages = [...messages]; // Trigger reactivity
    } else if (data.type === 'tool-call') {
      // Handle tool calls
      console.log('[Chatbot] AI is calling tool:', data.toolName, 'with args:', data.args);
      lastMessage.parts.push({
        type: `tool-${data.toolName}` as any,
        toolCallId: data.toolCallId,
        state: 'input-streaming',
        input: data.args
      });
      messages = [...messages]; // Trigger reactivity
    } else if (data.type === 'tool-result') {
      // Handle tool results
      console.log('[Chatbot] Tool execution completed:', data.toolName, 'result:', data.result);
      const toolPart = lastMessage.parts.find(
        (p) => p.type === `tool-${data.toolName}` && (p as any).toolCallId === data.toolCallId
      ) as any;
      if (toolPart) {
        toolPart.state = 'output-available';
        toolPart.output = data.result;
      }
      messages = [...messages]; // Trigger reactivity
    } else if (data.type === 'finish') {
      // Mark text parts as done
      console.log('[Chatbot] Assistant message completed for:', lastMessage.id);
      lastMessage.parts.forEach((part) => {
        if (part.type === 'text') {
          (part as any).state = 'done';
        }
      });
      messages = [...messages]; // Trigger reactivity
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  }

  function renderMessagePart(part: any) {
    if (part.type === 'text') {
      return part.text;
    } else if (part.type === 'tool-findCandidateInfo') {
      if (part.state === 'input-streaming' || part.state === 'input-available') {
        return `🔍 Looking up candidate: ${part.input?.candidateId || '...'}`;
      } else if (part.state === 'output-available') {
        return `✅ Found candidate: ${part.output?.name} (${part.output?.party})`;
      } else if (part.state === 'output-error') {
        return `❌ Error: ${part.errorText}`;
      }
    }
    return '';
  }
</script>

<div class="mx-auto flex h-screen max-w-2xl flex-col p-4">
  <div class="mb-4 flex-1 space-y-6 overflow-y-auto">
    {#each messages as message}
      <div class="p-3 rounded {message.role === 'user' ? 'ml-8 bg-blue-100' : 'mr-8 bg-gray-100'}">
        <div class="font-semibold mb-1">{message.role === 'user' ? 'You' : 'Assistant'}</div>
        <div class="whitespace-pre-wrap">
          {#each message.parts as part}
            <div>{renderMessagePart(part)}</div>
          {/each}
        </div>
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
