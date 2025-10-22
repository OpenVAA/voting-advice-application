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

  // Metadata tracking interfaces
  interface CostInfo {
    llm: {
      input: number;
      output: number;
      reasoning?: number;
      total: number;
    };
    reformulation: {
      input: number;
      output: number;
      total: number;
    };
    filtering: {
      input: number;
      output: number;
      total: number;
    };
    total: number;
    timestamp: number;
  }

  interface LatencyInfo {
    reformulationDuration: number; // ms to reformulate query into standalone version
    retrievalDuration: number; // ms to fetch from vector store (0 if RAG not used)
    timeToFirstToken: number; // ms from LLM stream start to first token (LLM latency only)
    messageTime: number; // ms from LLM stream start to completion (LLM generation time)
    totalTime: number; // ms end-to-end (reformulation + retrieval + message generation)
    tokensPerSecond?: number; // output tokens / second
    timestamp: number;
  }

  let messages: UIMessage[] = [];
  let ragContexts: MultiVectorSearchResult[] = [];
  let costs: CostInfo[] = [];
  let latencies: LatencyInfo[] = [];
  let input = '';
  let loading = false;

  // Request timing tracking
  let requestStartTime = 0;
  let firstTokenTime = 0;

  // Cost calculation helpers
  $: lastCost = costs.length > 0 ? costs[costs.length - 1].total : 0;
  $: averageCost = costs.length > 0 ? costs.reduce((sum, c) => sum + c.total, 0) / costs.length : 0;
  $: last3CostAverage =
    costs.length > 0 ? costs.slice(-3).reduce((sum, c) => sum + c.total, 0) / Math.min(3, costs.length) : 0;
  $: totalSessionCost = costs.reduce((sum, c) => sum + c.total, 0);
  $: minCost = costs.length > 0 ? Math.min(...costs.map(c => c.total)) : 0;
  $: maxCost = costs.length > 0 ? Math.max(...costs.map(c => c.total)) : 0;

  // Latency calculation helpers
  // Query Reformulation metrics
  $: lastReformulationDuration = latencies.length > 0 ? latencies[latencies.length - 1].reformulationDuration : 0;
  $: averageReformulationDuration = latencies.length > 0 ? latencies.reduce((sum, l) => sum + l.reformulationDuration, 0) / latencies.length : 0;
  $: minReformulationDuration = latencies.length > 0 ? Math.min(...latencies.map(l => l.reformulationDuration)) : 0;
  $: maxReformulationDuration = latencies.length > 0 ? Math.max(...latencies.map(l => l.reformulationDuration)) : 0;

  // RAG Retrieval metrics
  $: lastRetrievalDuration = latencies.length > 0 ? latencies[latencies.length - 1].retrievalDuration : 0;
  $: averageRetrievalDuration = latencies.length > 0 ? latencies.reduce((sum, l) => sum + l.retrievalDuration, 0) / latencies.length : 0;
  $: minRetrievalDuration = latencies.length > 0 ? Math.min(...latencies.map(l => l.retrievalDuration)) : 0;
  $: maxRetrievalDuration = latencies.length > 0 ? Math.max(...latencies.map(l => l.retrievalDuration)) : 0;

  // Time to First Token metrics
  $: lastTTFT = latencies.length > 0 ? latencies[latencies.length - 1].timeToFirstToken : 0;
  $: averageTTFT = latencies.length > 0 ? latencies.reduce((sum, l) => sum + l.timeToFirstToken, 0) / latencies.length : 0;
  $: last3TTFTAverage =
    latencies.length > 0 ? latencies.slice(-3).reduce((sum, l) => sum + l.timeToFirstToken, 0) / Math.min(3, latencies.length) : 0;
  $: minTTFT = latencies.length > 0 ? Math.min(...latencies.map(l => l.timeToFirstToken)) : 0;
  $: maxTTFT = latencies.length > 0 ? Math.max(...latencies.map(l => l.timeToFirstToken)) : 0;

  // Message Generation Time metrics
  $: lastMessageTime = latencies.length > 0 ? latencies[latencies.length - 1].messageTime : 0;
  $: averageMessageTime = latencies.length > 0 ? latencies.reduce((sum, l) => sum + l.messageTime, 0) / latencies.length : 0;
  $: minMessageTime = latencies.length > 0 ? Math.min(...latencies.map(l => l.messageTime)) : 0;
  $: maxMessageTime = latencies.length > 0 ? Math.max(...latencies.map(l => l.messageTime)) : 0;

  // Total Time metrics
  $: lastTotalTime = latencies.length > 0 ? latencies[latencies.length - 1].totalTime : 0;
  $: averageTotalTime = latencies.length > 0 ? latencies.reduce((sum, l) => sum + l.totalTime, 0) / latencies.length : 0;
  $: last3TotalTimeAverage =
    latencies.length > 0 ? latencies.slice(-3).reduce((sum, l) => sum + l.totalTime, 0) / Math.min(3, latencies.length) : 0;
  $: minTotalTime = latencies.length > 0 ? Math.min(...latencies.map(l => l.totalTime)) : 0;
  $: maxTotalTime = latencies.length > 0 ? Math.max(...latencies.map(l => l.totalTime)) : 0;

  // Tokens per second
  $: averageTokensPerSecond = latencies.length > 0 && latencies.filter(l => l.tokensPerSecond).length > 0
    ? latencies.filter(l => l.tokensPerSecond).reduce((sum, l) => sum + (l.tokensPerSecond || 0), 0) / latencies.filter(l => l.tokensPerSecond).length
    : 0;

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

    // Track request start time
    requestStartTime = performance.now();
    firstTokenTime = 0;

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
    // Handle RAG context events (not tied to specific messages)
    if (data.type === 'rag-context') {
      console.log('[Chatbot] Received RAG context:', data);
      // data is a MultiVectorSearchResult with query, results, retrievalSources, timestamp
      ragContexts = [...ragContexts, data];
      return;
    }

    // Handle metadata information (cost + latency)
    if (data.type === 'metadata-info') {
      console.log('[Chatbot] Received metadata info:', data);

      // Store cost info
      if (data.cost) {
        costs = [
          ...costs,
          {
            llm: data.cost.llm,
            reformulation: data.cost.reformulation,
            filtering: data.cost.filtering,
            total: data.cost.total,
            timestamp: data.timestamp
          }
        ];
      }

      // Store latency info
      if (data.latency) {
        latencies = [
          ...latencies,
          {
            reformulationDuration: data.latency.reformulationDuration,
            retrievalDuration: data.latency.retrievalDuration,
            timeToFirstToken: data.latency.timeToFirstToken,
            messageTime: data.latency.messageTime,
            totalTime: data.latency.totalTime,
            tokensPerSecond: data.latency.tokensPerSecond,
            timestamp: data.timestamp
          }
        ];
      }
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;

    if (data.type === 'text-delta') {
      // Track time to first token
      if (firstTokenTime === 0) {
        firstTokenTime = performance.now();
      }

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

<div class="flex h-screen gap-4 p-4">
  <!-- Left side: Chat conversation -->
  <div class="flex w-1/3 flex-col">
    <h2 class="mb-4 text-2xl font-bold">Chat</h2>
    <div class="mb-4 flex-1 space-y-4 overflow-y-auto rounded border border-gray-300 bg-white p-4">
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

  <!-- Middle: RAG Context -->
  <div class="flex w-1/3 flex-col">
    <h2 class="mb-4 text-2xl font-bold">Retrieved Context (RAG)</h2>
    <div class="flex-1 overflow-y-auto rounded border border-gray-300 bg-gray-50 p-4">
      {#if ragContexts.length === 0}
        <div class="mt-8 text-center text-gray-500">
          <p>No RAG context yet.</p>
          <p class="mt-2 text-sm">Ask a question to see retrieved information.</p>
        </div>
      {:else}
        <div class="space-y-6">
          {#each ragContexts as context, idx}
            <div class="rounded border border-gray-300 bg-white p-4 shadow-sm">
              <div class="mb-3 border-b border-gray-200 pb-2">
                <div class="text-xs text-gray-500">
                  Query #{ragContexts.length - idx}
                </div>
                <div class="font-semibold mt-1 text-blue-700">{context.query}</div>
                <div class="mt-1 text-xs text-gray-600">
                  Found via: {context.retrievalSources.fromSegments} segments,
                  {context.retrievalSources.fromSummaries} summaries,
                  {context.retrievalSources.fromFacts} facts
                </div>
              </div>

              {#if context.results.length === 0}
                <div class="text-sm italic text-gray-500">No relevant context found.</div>
              {:else}
                <div class="space-y-3">
                  {#each context.results as result, resultIdx}
                    <div class="p-3 rounded border border-gray-200 bg-gray-50">
                      <div class="mb-2 flex items-center justify-between">
                        <div class="font-semibold text-xs text-gray-700">
                          Result {resultIdx + 1}
                        </div>
                        <div class="text-xs text-gray-500">
                          Source: {result.segment.metadata.source || 'Unknown'}
                          <span class="ml-2">Score: {result.score.toFixed(3)}</span>
                          <span class="ml-2 text-purple-600">via {result.foundWith}</span>
                        </div>
                      </div>
                      <div class="whitespace-pre-wrap text-sm text-gray-700 mb-2">
                        {result.segment.segment}
                      </div>

                      <!-- Dev debugging: show AI-generated content -->
                      <details class="mt-2">
                        <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          Debug: AI-generated content (not shown to LLM)
                        </summary>
                        <div class="mt-2 space-y-2 text-xs">
                          {#if result.segment.summary}
                            <div class="p-2 bg-blue-50 rounded">
                              <div class="font-semibold text-blue-700">Summary:</div>
                              <div class="text-gray-700">{result.segment.summary}</div>
                            </div>
                          {/if}
                          {#if result.segment.standaloneFacts && result.segment.standaloneFacts.length > 0}
                            <div class="p-2 bg-green-50 rounded">
                              <div class="font-semibold text-green-700">Facts:</div>
                              <ul class="list-disc list-inside text-gray-700">
                                {#each result.segment.standaloneFacts as fact}
                                  <li class="{fact === result.factFound ? 'font-bold bg-yellow-200 px-1 rounded' : ''}">{fact}</li>
                                {/each}
                              </ul>
                            </div>
                          {/if}
                        </div>
                      </details>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Right side: Metadata (Cost + Latency) -->
  <div class="flex w-1/3 flex-col">
    <h2 class="mb-4 text-2xl font-bold">Response Metadata</h2>

    <div class="flex-1 overflow-y-auto rounded border border-gray-300 bg-gray-50 p-4">
      <!-- Cost Metrics Section -->
      <div class="mb-6">
        <h3 class="font-bold mb-3 text-lg text-gray-800 border-b border-gray-300 pb-2">💰 Cost Metrics</h3>
        <div class="gap-2 grid grid-cols-2 mb-4">
          <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
            <div class="mb-1 text-xs text-gray-500">Last Response</div>
            <div class="text-xl font-bold text-blue-600">
              ${lastCost.toFixed(4)}
            </div>
            {#if costs.length > 0}
              <div class="text-xs text-gray-500 mt-1">
                LLM: ${costs[costs.length - 1].llm.total.toFixed(4)}<br/>
                Reformulate: ${costs[costs.length - 1].reformulation.total.toFixed(4)}<br/>
                Filter: ${costs[costs.length - 1].filtering.total.toFixed(4)}
              </div>
            {/if}
          </div>

          <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
            <div class="mb-1 text-xs text-gray-500">Average Cost</div>
            <div class="text-xl font-bold text-green-600">
              ${averageCost.toFixed(4)}
            </div>
          </div>

          <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
            <div class="mb-1 text-xs text-gray-500">Last 3 Avg</div>
            <div class="text-xl font-bold text-purple-600">
              ${last3CostAverage.toFixed(4)}
            </div>
          </div>

          <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
            <div class="mb-1 text-xs text-gray-500">Total Session</div>
            <div class="text-xl font-bold text-orange-600">
              ${totalSessionCost.toFixed(4)}
            </div>
          </div>

          <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
            <div class="mb-1 text-xs text-gray-500">Min Cost</div>
            <div class="text-lg font-semibold text-teal-600">
              ${minCost.toFixed(4)}
            </div>
          </div>

          <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
            <div class="mb-1 text-xs text-gray-500">Max Cost</div>
            <div class="text-lg font-semibold text-red-600">
              ${maxCost.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      <!-- Latency Metrics Section -->
      <div class="mb-6">
        <h3 class="font-bold mb-3 text-lg text-gray-800 border-b border-gray-300 pb-2">⚡ Latency Metrics</h3>

        <!-- RAG Timing -->
        <div class="mb-4">
          <h4 class="font-semibold text-sm text-gray-700 mb-2">RAG Timing</h4>
          <div class="gap-2 grid grid-cols-2 mb-2">
            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Reformulation (Last)</div>
              <div class="text-lg font-bold text-blue-600">
                {lastReformulationDuration.toFixed(0)}ms
              </div>
            </div>

            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Reformulation (Avg)</div>
              <div class="text-lg font-bold text-green-600">
                {averageReformulationDuration.toFixed(0)}ms
              </div>
            </div>

            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Retrieval (Last)</div>
              <div class="text-lg font-bold text-blue-600">
                {lastRetrievalDuration.toFixed(0)}ms
              </div>
            </div>

            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Retrieval (Avg)</div>
              <div class="text-lg font-bold text-green-600">
                {averageRetrievalDuration.toFixed(0)}ms
              </div>
            </div>
          </div>
          <div class="text-xs text-gray-600 bg-gray-100 p-2 rounded">
            Reformulation: converts follow-ups to standalone queries | Retrieval: fetching from vector store
          </div>
        </div>

        <!-- Time to First Token -->
        <div class="mb-4">
          <h4 class="font-semibold text-sm text-gray-700 mb-2">Time to First Token (LLM Latency)</h4>
          <div class="gap-2 grid grid-cols-2">
            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Last Response</div>
              <div class="text-xl font-bold text-blue-600">
                {lastTTFT.toFixed(0)}ms
              </div>
            </div>

            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Average</div>
              <div class="text-xl font-bold text-green-600">
                {averageTTFT.toFixed(0)}ms
              </div>
            </div>

            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Last 3 Avg</div>
              <div class="text-xl font-bold text-purple-600">
                {last3TTFTAverage.toFixed(0)}ms
              </div>
            </div>

            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Min / Max</div>
              <div class="text-sm font-semibold text-gray-700">
                {minTTFT.toFixed(0)} / {maxTTFT.toFixed(0)}ms
              </div>
            </div>
          </div>
        </div>

        <!-- Message Generation Time -->
        <div class="mb-4">
          <h4 class="font-semibold text-sm text-gray-700 mb-2">Message Generation Time</h4>
          <div class="gap-2 grid grid-cols-2">
            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Last Response</div>
              <div class="text-lg font-bold text-blue-600">
                {(lastMessageTime / 1000).toFixed(2)}s
              </div>
            </div>

            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Average</div>
              <div class="text-lg font-bold text-green-600">
                {(averageMessageTime / 1000).toFixed(2)}s
              </div>
            </div>

            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Min / Max</div>
              <div class="text-sm font-semibold text-gray-700">
                {(minMessageTime / 1000).toFixed(2)} / {(maxMessageTime / 1000).toFixed(2)}s
              </div>
            </div>

            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Tokens/Second</div>
              <div class="text-lg font-bold text-indigo-600">
                {averageTokensPerSecond.toFixed(1)} tok/s
              </div>
            </div>
          </div>
        </div>

        <!-- Total Time -->
        <div class="mb-4">
          <h4 class="font-semibold text-sm text-gray-700 mb-2">Total Response Time (End-to-End)</h4>
          <div class="gap-2 grid grid-cols-2">
            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Last Response</div>
              <div class="text-xl font-bold text-blue-600">
                {(lastTotalTime / 1000).toFixed(2)}s
              </div>
            </div>

            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Average</div>
              <div class="text-xl font-bold text-green-600">
                {(averageTotalTime / 1000).toFixed(2)}s
              </div>
            </div>

            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Last 3 Avg</div>
              <div class="text-xl font-bold text-purple-600">
                {(last3TotalTimeAverage / 1000).toFixed(2)}s
              </div>
            </div>

            <div class="rounded border border-gray-200 bg-white p-3 shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Min / Max</div>
              <div class="text-sm font-semibold text-gray-700">
                {(minTotalTime / 1000).toFixed(2)} / {(maxTotalTime / 1000).toFixed(2)}s
              </div>
            </div>
          </div>
          <div class="text-xs text-gray-600 bg-gray-100 p-2 rounded mt-2">
            Total = Reformulation + Retrieval + Message Generation
          </div>
        </div>
      </div>

      <!-- Detailed History -->
      <div class="border-t border-gray-300 pt-4">
        <h3 class="font-semibold mb-3 text-sm text-gray-700">Response History</h3>
        {#if costs.length === 0}
          <div class="text-center text-sm text-gray-500">No responses yet</div>
        {:else}
          <div class="space-y-2">
            {#each costs.slice().reverse() as cost, idx}
              {@const latency = latencies[latencies.length - 1 - idx]}
              <div class="p-3 rounded border border-gray-200 bg-white text-sm">
                <div class="mb-2 flex items-center justify-between">
                  <span class="font-semibold text-gray-700">
                    #{costs.length - idx}
                  </span>
                  <span class="font-bold text-blue-600">
                    ${cost.total.toFixed(4)}
                  </span>
                </div>
                <div class="space-y-1 text-xs text-gray-600 mb-2">
                  <div class="font-semibold text-gray-700">Cost Breakdown:</div>
                  <div class="grid grid-cols-2 gap-1">
                    <div>LLM: ${cost.llm.total.toFixed(4)}</div>
                    <div>Reformulate: ${cost.reformulation.total.toFixed(4)}</div>
                    <div>Filter: ${cost.filtering.total.toFixed(4)}</div>
                  </div>
                </div>
                {#if latency}
                  <div class="space-y-1 text-xs text-gray-600">
                    <div class="font-semibold text-gray-700">Timing Breakdown:</div>
                    <div class="grid grid-cols-2 gap-1">
                      <div>Reformulation: {latency.reformulationDuration.toFixed(0)}ms</div>
                      <div>Retrieval: {latency.retrievalDuration.toFixed(0)}ms</div>
                      <div>TTFT: {latency.timeToFirstToken.toFixed(0)}ms</div>
                      <div>Message: {(latency.messageTime / 1000).toFixed(2)}s</div>
                      <div class="col-span-2 font-semibold text-gray-700">Total: {(latency.totalTime / 1000).toFixed(2)}s</div>
                      {#if latency.tokensPerSecond}
                        <div class="col-span-2">{latency.tokensPerSecond.toFixed(1)} tok/s</div>
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>