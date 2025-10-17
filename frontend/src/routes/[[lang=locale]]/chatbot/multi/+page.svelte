<script lang="ts">
  import type { MultiVectorSearchResult } from '@openvaa/vector-store';

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

  interface CostInfo {
    input: number;
    output: number;
    reasoning?: number;
    total: number;
    timestamp: number;
  }

  interface ChatSession {
    id: number;
    messages: UIMessage[];
    ragContexts: MultiVectorSearchResult[];
    costs: CostInfo[];
    input: string;
    loading: boolean;
  }

  // Initialize 4 chat sessions
  let sessions: ChatSession[] = [
    { id: 1, messages: [], ragContexts: [], costs: [], input: '', loading: false },
    { id: 2, messages: [], ragContexts: [], costs: [], input: '', loading: false },
    { id: 3, messages: [], ragContexts: [], costs: [], input: '', loading: false },
    { id: 4, messages: [], ragContexts: [], costs: [], input: '', loading: false }
  ];

  const chatColors = [
    { bg: 'bg-blue-50', accent: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200' },
    { bg: 'bg-purple-50', accent: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-200' },
    { bg: 'bg-emerald-50', accent: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'bg-amber-50', accent: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200' }
  ];

  async function sendMessage(sessionIndex: number) {
    const session = sessions[sessionIndex];
    if (!session.input.trim() || session.loading) return;

    const userMessage: UIMessage = {
      id: Math.random().toString(),
      role: 'user',
      parts: [{ type: 'text', text: session.input, state: 'done' }]
    };
    session.messages = [...session.messages, userMessage];
    session.input = '';
    session.loading = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: session.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            parts: msg.parts
          }))
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const assistantMessage: UIMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        parts: []
      };
      session.messages = [...session.messages, assistantMessage];

      const decoder = new TextDecoder();
      let sseBuffer = '';
      let eventName = '';
      let dataBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = sseBuffer.indexOf('\n')) !== -1) {
          const line = sseBuffer.slice(0, newlineIndex);
          sseBuffer = sseBuffer.slice(newlineIndex + 1);

          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataBuffer += line.slice(5).trimStart() + '\n';
          } else if (line === '') {
            const raw = dataBuffer.trim();
            const currentEvent = eventName;
            eventName = '';
            dataBuffer = '';

            if (!raw || raw === '[DONE]') {
              if (raw === '[DONE]') handleStreamChunk(sessionIndex, { type: 'finish' });
              continue;
            }

            try {
              const payload = JSON.parse(raw);
              const withType = payload.type ? payload : { type: currentEvent || payload.type, ...payload };
              handleStreamChunk(sessionIndex, withType);
            } catch {
              console.warn('Failed to parse SSE payload:', raw);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      session.messages = [
        ...session.messages,
        {
          id: Math.random().toString(),
          role: 'assistant',
          parts: [{ type: 'text', text: 'Error occurred.', state: 'done' }]
        }
      ];
    } finally {
      session.loading = false;
      sessions = [...sessions];
    }
  }

  function handleStreamChunk(sessionIndex: number, data: any) {
    const session = sessions[sessionIndex];

    if (data.type === 'rag-context') {
      // data is a MultiVectorSearchResult
      session.ragContexts = [...session.ragContexts, data];
      sessions = [...sessions];
      return;
    }

    if (data.type === 'cost-info') {
      session.costs = [
        ...session.costs,
        {
          input: data.input,
          output: data.output,
          reasoning: data.reasoning,
          total: data.total,
          timestamp: data.timestamp
        }
      ];
      sessions = [...sessions];
      return;
    }

    const lastMessage = session.messages[session.messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;

    if (data.type === 'text-delta') {
      const textPart = lastMessage.parts.find((p) => p.type === 'text') as any;
      if (textPart) {
        textPart.text += data.delta;
        textPart.state = 'streaming';
      } else {
        lastMessage.parts.push({ type: 'text', text: data.delta, state: 'streaming' });
      }
      sessions = [...sessions];
    } else if (data.type === 'finish') {
      lastMessage.parts.forEach((part) => {
        if (part.type === 'text') (part as any).state = 'done';
      });
      sessions = [...sessions];
    }
  }

  function handleKeydown(event: KeyboardEvent, sessionIndex: number) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(sessionIndex);
    }
  }

  function getTotalCost(session: ChatSession): number {
    return session.costs.reduce((sum, c) => sum + c.total, 0);
  }

  function getLastCost(session: ChatSession): number {
    return session.costs.length > 0 ? session.costs[session.costs.length - 1].total : 0;
  }
</script>

<div class="p-3 flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100">
  <!-- Header -->
  <div class="mb-3 rounded-lg bg-white p-4 shadow-sm">
    <h1 class="text-2xl font-bold text-gray-800">Multi-Chat Testing Interface</h1>
    <p class="text-sm text-gray-600">Run 4 simultaneous chatbot conversations for testing</p>
  </div>

  <!-- Chat Windows Grid (Top Row - 70%) -->
  <div class="mb-3 gap-3 grid grid-cols-4" style="height: 70vh;">
    {#each sessions as session, idx}
      <div class="border-2 flex flex-col rounded-lg {chatColors[idx].border} {chatColors[idx].bg} shadow-md">
        <!-- Chat Header -->
        <div class="flex items-center justify-between rounded-t-lg {chatColors[idx].accent} px-3 py-2">
          <span class="font-semibold text-sm text-white">Chat {session.id}</span>
          <span class="text-xs text-white/80">{session.messages.length} msgs</span>
        </div>

        <!-- Messages Area -->
        <div class="p-3 flex-1 space-y-2 overflow-y-auto">
          {#each session.messages as message}
            <div
              class="rounded-lg p-2 text-sm {message.role === 'user' ? 'ml-4 bg-white shadow-sm' : 'mr-4 bg-white/50'}">
              <div class="mb-1 font-semibold text-xs {chatColors[idx].text}">
                {message.role === 'user' ? 'You' : 'AI'}
              </div>
              <div class="whitespace-pre-wrap text-xs text-gray-700">
                {#each message.parts as part}
                  {#if part.type === 'text'}
                    {part.text}
                  {/if}
                {/each}
              </div>
            </div>
          {/each}
          {#if session.loading}
            <div class="mr-4 rounded-lg bg-white/50 p-2 text-sm">
              <div class="mb-1 font-semibold text-xs {chatColors[idx].text}">AI</div>
              <div class="text-xs text-gray-500">Thinking...</div>
            </div>
          {/if}
        </div>

        <!-- Input Area -->
        <div class="border-t {chatColors[idx].border} bg-white/50 p-2">
          <div class="flex gap-2">
            <input
              bind:value={session.input}
              on:keydown={(e) => handleKeydown(e, idx)}
              placeholder="Type message..."
              class="flex-1 rounded border {chatColors[idx].border} py-1 px-2 text-sm focus:outline-none focus:ring-1"
              disabled={session.loading} />
            <button
              on:click={() => sendMessage(idx)}
              disabled={session.loading || !session.input.trim()}
              class="rounded {chatColors[idx].accent} px-3 py-1 font-semibold text-xs text-white disabled:opacity-40">
              Send
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Info Grid (Bottom Row - 30%) -->
  <div class="gap-3 grid grid-cols-4" style="height: 28vh;">
    {#each sessions as session, idx}
      <div class="flex flex-col rounded-lg border {chatColors[idx].border} bg-white shadow-md">
        <!-- Info Tabs/Header -->
        <div class="border-b {chatColors[idx].border} flex">
          <div class="flex-1 border-r {chatColors[idx].border} py-1 px-2 text-center">
            <div class="font-semibold text-xs {chatColors[idx].text}">Costs</div>
            <div class="text-lg font-bold {chatColors[idx].text}">
              ${getTotalCost(session).toFixed(4)}
            </div>
          </div>
          <div class="py-1 flex-1 px-2 text-center">
            <div class="font-semibold text-xs {chatColors[idx].text}">RAG Queries</div>
            <div class="text-lg font-bold {chatColors[idx].text}">
              {session.ragContexts.length}
            </div>
          </div>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-2 text-xs">
          <!-- Cost Details -->
          {#if session.costs.length > 0}
            <div class="mb-2">
              <div class="mb-1 font-semibold text-gray-700">Recent Costs:</div>
              <div class="space-y-1">
                {#each session.costs.slice(-3).reverse() as cost}
                  <div class="py-1 rounded bg-gray-50 px-2">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Total:</span>
                      <span class="font-semibold">${cost.total.toFixed(4)}</span>
                    </div>
                    <div class="text-[10px] text-gray-500">
                      In: ${cost.input.toFixed(5)} | Out: ${cost.output.toFixed(5)}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- RAG Context -->
          {#if session.ragContexts.length > 0}
            <div>
              <div class="mb-1 font-semibold text-gray-700">Latest RAG:</div>
              <div class="rounded bg-gray-50 p-2">
                <div class="mb-1 font-semibold text-[10px] text-gray-600">
                  Query: {session.ragContexts[session.ragContexts.length - 1].query.slice(0, 50)}...
                </div>
                <div class="text-[10px] text-gray-600">
                  {session.ragContexts[session.ragContexts.length - 1].results.length} segment(s) retrieved
                </div>
                {#each session.ragContexts[session.ragContexts.length - 1].results.slice(0, 2) as result}
                  <div class="mt-1 pt-1 border-t border-gray-200">
                    <div class="text-[10px] text-gray-500">
                      {result.segment.metadata.source || 'Unknown'} (via {result.foundWith})
                    </div>
                    <div class="text-[10px] text-gray-700">
                      {result.segment.segment.slice(0, 80)}...
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if session.costs.length === 0 && session.ragContexts.length === 0}
            <div class="mt-4 text-center text-gray-400">No data yet</div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
