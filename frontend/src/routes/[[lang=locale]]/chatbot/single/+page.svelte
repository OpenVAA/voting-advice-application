<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { createChatStore, isTextPart } from '$lib/chatbot';
  import type { RAGRetrievalResult } from '@openvaa/chatbot';

  // Metadata tracking interfaces (dev-specific)
  interface CostInfo {
    llm: {
      input: number;
      output: number;
      reasoning?: number;
      total: number;
    };
    filtering: {
      input: number;
      output: number;
      total: number;
    };
    reranking: {
      total: number;
    };
    total: number;
    timestamp: number;
  }

  interface LatencyInfo {
    retrievalDuration: number; // ms to fetch from vector store (0 if RAG not used)
    timeToFirstToken: number; // ms from LLM stream start to first token (LLM latency only)
    messageTime: number; // ms from LLM stream start to completion (LLM generation time)
    totalTime: number; // ms end-to-end (retrieval + message generation)
    timestamp: number;
    tokensPerSecond?: number; // output tokens / second
  }

  // Dev-specific state for RAG and metadata tracking
  let ragContexts: Array<RAGRetrievalResult> = [];
  let costs: Array<CostInfo> = [];
  let latencies: Array<LatencyInfo> = [];
  let input = '';

  // Create the chat store with extended callbacks for dev features
  const locale = $page.params.lang || 'en';
  const chatStore = createChatStore({
    locale,
    extendedCallbacks: {
      onRagContexts: (contexts) => {
        console.log('[Chatbot Dev] Received RAG contexts:', contexts);
        ragContexts = [...ragContexts, ...contexts];
      },
      onMetadata: (data) => {
        console.log('[Chatbot Dev] Received metadata info:', data);

        // Store cost info
        if (data.cost) {
          costs = [
            ...costs,
            {
              llm: data.cost.llm,
              filtering: data.cost.filtering,
              reranking: { total: data.cost.reranking.cost },
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
              retrievalDuration: data.latency.retrievalDuration,
              timeToFirstToken: data.latency.timeToFirstToken,
              messageTime: data.latency.messageTime,
              totalTime: data.latency.totalTime,
              tokensPerSecond: data.latency.tokensPerSecond,
              timestamp: data.timestamp
            }
          ];
        }

        // Attach toolsUsed to the last assistant message
        if (data.rag?.toolsUsed && data.rag.toolsUsed.length > 0) {
          const lastAssistantMessage = [...$chatStore.messages].reverse().find((m) => m.role === 'assistant');
          if (lastAssistantMessage) {
            lastAssistantMessage.metadata = {
              ...lastAssistantMessage.metadata,
              toolsUsed: data.rag.toolsUsed
            };
            // Force reactivity update
            messages = [...messages];
          }
        }
      }
    }
  });

  // Derived state from store
  $: messages = $chatStore.messages;
  $: loading = $chatStore.loading;

  // Cost calculation helpers
  $: lastCost = costs.length > 0 ? costs[costs.length - 1].total : 0;
  $: averageCost = costs.length > 0 ? costs.reduce((sum, c) => sum + c.total, 0) / costs.length : 0;
  $: last3CostAverage =
    costs.length > 0 ? costs.slice(-3).reduce((sum, c) => sum + c.total, 0) / Math.min(3, costs.length) : 0;
  $: totalSessionCost = costs.reduce((sum, c) => sum + c.total, 0);
  $: minCost = costs.length > 0 ? Math.min(...costs.map((c) => c.total)) : 0;
  $: maxCost = costs.length > 0 ? Math.max(...costs.map((c) => c.total)) : 0;

  // Latency calculation helpers
  // RAG Retrieval metrics
  $: lastRetrievalDuration = latencies.length > 0 ? latencies[latencies.length - 1].retrievalDuration : 0;
  $: averageRetrievalDuration =
    latencies.length > 0 ? latencies.reduce((sum, l) => sum + l.retrievalDuration, 0) / latencies.length : 0;

  // Time to First Token metrics
  $: lastTTFT = latencies.length > 0 ? latencies[latencies.length - 1].timeToFirstToken : 0;
  $: averageTTFT =
    latencies.length > 0 ? latencies.reduce((sum, l) => sum + l.timeToFirstToken, 0) / latencies.length : 0;
  $: last3TTFTAverage =
    latencies.length > 0
      ? latencies.slice(-3).reduce((sum, l) => sum + l.timeToFirstToken, 0) / Math.min(3, latencies.length)
      : 0;
  $: minTTFT = latencies.length > 0 ? Math.min(...latencies.map((l) => l.timeToFirstToken)) : 0;
  $: maxTTFT = latencies.length > 0 ? Math.max(...latencies.map((l) => l.timeToFirstToken)) : 0;

  // Message Generation Time metrics
  $: lastMessageTime = latencies.length > 0 ? latencies[latencies.length - 1].messageTime : 0;
  $: averageMessageTime =
    latencies.length > 0 ? latencies.reduce((sum, l) => sum + l.messageTime, 0) / latencies.length : 0;
  $: minMessageTime = latencies.length > 0 ? Math.min(...latencies.map((l) => l.messageTime)) : 0;
  $: maxMessageTime = latencies.length > 0 ? Math.max(...latencies.map((l) => l.messageTime)) : 0;

  // Total Time metrics
  $: lastTotalTime = latencies.length > 0 ? latencies[latencies.length - 1].totalTime : 0;
  $: averageTotalTime =
    latencies.length > 0 ? latencies.reduce((sum, l) => sum + l.totalTime, 0) / latencies.length : 0;
  $: last3TotalTimeAverage =
    latencies.length > 0
      ? latencies.slice(-3).reduce((sum, l) => sum + l.totalTime, 0) / Math.min(3, latencies.length)
      : 0;
  $: minTotalTime = latencies.length > 0 ? Math.min(...latencies.map((l) => l.totalTime)) : 0;
  $: maxTotalTime = latencies.length > 0 ? Math.max(...latencies.map((l) => l.totalTime)) : 0;

  // Tokens per second
  $: averageTokensPerSecond =
    latencies.length > 0 && latencies.filter((l) => l.tokensPerSecond).length > 0
      ? latencies.filter((l) => l.tokensPerSecond).reduce((sum, l) => sum + (l.tokensPerSecond || 0), 0) /
        latencies.filter((l) => l.tokensPerSecond).length
      : 0;

  async function handleSendMessage() {
    if (!input.trim() || loading) return;
    const messageText = input;
    input = '';
    await chatStore.sendMessage(messageText);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  }

  function handleNewConversation() {
    // Reset chat store
    chatStore.resetConversation();

    // Clear dev-specific tracking state
    ragContexts = [];
    costs = [];
    latencies = [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function formatToolCall(tool: { name: string; args: any }): string {
    const argsStr =
      tool.args && Object.keys(tool.args).length > 0
        ? Object.values(tool.args)
            .map((v) => (typeof v === 'string' ? `"${v}"` : v))
            .join(', ')
        : '';
    return `${tool.name}(${argsStr})`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderMessagePart(part: any) {
    if (part.type === 'text') {
      return part.text;
    } else if (part.type === 'tool-findCandidateInfo') {
      if (part.state === 'input-streaming' || part.state === 'input-available') {
        return `Looking up candidate: ${part.input?.candidateId || '...'}`;
      } else if (part.state === 'output-available') {
        return `Found candidate: ${part.output?.name} (${part.output?.party})`;
      } else if (part.state === 'output-error') {
        return `Error: ${part.errorText}`;
      }
    }
    return '';
  }

  onMount(() => {
    chatStore.initialize();
  });

  onDestroy(() => {
    chatStore.destroy();
  });
</script>

<div class="flex h-screen w-full gap-4 p-4">
  <!-- Left side: Chat conversation -->
  <div class="flex flex-1 flex-col">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-2xl font-bold">Chat</h2>
      <button on:click={handleNewConversation} class="rounded bg-gray-200 px-4 py-2 text-black hover:bg-gray-300">
        New conversation
      </button>
    </div>
    <div class="mb-4 flex-1 space-y-4 overflow-y-auto rounded border border-gray-300 bg-white p-4">
      {#each messages as message}
        <div class="p-3 rounded {message.role === 'user' ? 'ml-8 bg-blue-100' : 'mr-8 bg-gray-100'}">
          <div class="font-semibold mb-1">
            {#if message.role === 'user'}
              You
            {:else}
              Assistant
              {#if message.metadata?.category || (message.metadata?.toolsUsed && message.metadata.toolsUsed.length > 0)}
                <span class="text-xs text-gray-500">
                  ({#if message.metadata.category}category: {message.metadata
                      .category}{/if}{#if message.metadata.category && message.metadata.toolsUsed && message.metadata.toolsUsed.length > 0},
                  {/if}{#if message.metadata.toolsUsed && message.metadata.toolsUsed.length > 0}tools: {message.metadata.toolsUsed
                      .map(formatToolCall)
                      .join(', ')}{/if})
                </span>
              {/if}
            {/if}
          </div>
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
        on:click={handleSendMessage}
        disabled={loading || !input.trim()}
        class="py-3 rounded bg-blue-600 px-6 text-white disabled:bg-gray-300">
        Send
      </button>
    </div>
  </div>

  <!-- Middle: RAG Context -->
  <div class="flex flex-1 flex-col">
    <h2 class="mb-4 text-2xl font-bold">Retrieved Context (RAG)</h2>
    <div class="flex-1 overflow-y-auto rounded border border-gray-300 bg-gray-50 p-4">
      {#if ragContexts.length === 0}
        <div class="mt-8 text-center text-gray-500">
          <p>No RAG context yet.</p>
          <p class="mt-2 text-sm">Ask a question to see retrieved information.</p>
        </div>
      {:else}
        <div class="space-y-6">
          {#each ragContexts.slice().reverse() as ragResult, idx}
            <div class="rounded border border-gray-300 bg-white p-4 shadow-sm">
              <div class="mb-3 border-b border-gray-200 pb-2">
                <div class="text-xs text-gray-500">
                  Search #{ragContexts.length - idx}
                </div>
                <div class="font-semibold mt-1 text-blue-700">{ragResult.canonicalQuery}</div>
                <div class="mt-1 text-xs text-gray-600">
                  Found {ragResult.searchResult.results.length} results
                </div>
                <div class="mt-1 text-xs text-gray-500">
                  Retrieved in {ragResult.durationMs.toFixed(0)}ms
                  {#if ragResult.rerankingCosts}
                    • Reranking cost: ${ragResult.rerankingCosts.cost.toFixed(6)}
                  {/if}
                </div>
              </div>

              {#if ragResult.searchResult.results.length === 0}
                <div class="text-sm italic text-gray-500">No relevant context found.</div>
              {:else}
                <div class="space-y-3">
                  {#each ragResult.searchResult.results as result, resultIdx}
                    <div class="p-3 rounded border border-gray-200 bg-gray-50">
                      <div class="mb-2 flex items-center justify-between">
                        <div class="font-semibold text-xs text-gray-700">
                          Result {resultIdx + 1}
                        </div>
                        <div class="text-xs text-gray-500">
                          Source: {result.segment.metadata.source || 'Unknown'}
                          <span class="ml-2 text-gray-600">Vector: {result.vectorSearchScore.toFixed(3)}</span>
                          {#if result.rerankScore !== undefined}
                            <span class="font-semibold ml-2 text-purple-600"
                              >Rerank: {result.rerankScore.toFixed(3)}</span>
                          {/if}
                        </div>
                      </div>
                      <div class="mb-2 whitespace-pre-wrap text-sm text-gray-700">
                        {result.segment.content}
                      </div>
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
  <div class="flex flex-1 flex-col">
    <h2 class="mb-4 text-2xl font-bold">Response Metadata</h2>

    <div class="flex-1 overflow-y-auto rounded border border-gray-300 bg-gray-50 p-4">
      <!-- Cost Metrics Section -->
      <div class="mb-6">
        <h3 class="mb-3 border-b border-gray-300 pb-2 text-lg font-bold text-gray-800">💰 Cost Metrics</h3>
        <div class="mb-4 grid grid-cols-2 gap-2">
          <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
            <div class="mb-1 text-xs text-gray-500">Last Response</div>
            <div class="text-xl font-bold text-blue-600">
              ${lastCost.toFixed(6)}
            </div>
            {#if costs.length > 0}
              <div class="mt-1 text-xs text-gray-500">
                LLM: ${costs[costs.length - 1].llm.total.toFixed(7)}<br />
                Filter: ${costs[costs.length - 1].filtering.total.toFixed(7)}<br />
                Reranking: ${costs[costs.length - 1].reranking.total.toFixed(7)}
              </div>
            {/if}
          </div>

          <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
            <div class="mb-1 text-xs text-gray-500">Average Cost</div>
            <div class="text-xl font-bold text-green-600">
              ${averageCost.toFixed(6)}
            </div>
          </div>

          <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
            <div class="mb-1 text-xs text-gray-500">Last 3 Avg</div>
            <div class="text-xl font-bold text-purple-600">
              ${last3CostAverage.toFixed(6)}
            </div>
          </div>

          <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
            <div class="mb-1 text-xs text-gray-500">Total Session</div>
            <div class="text-xl font-bold text-orange-600">
              ${totalSessionCost.toFixed(6)}
            </div>
          </div>

          <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
            <div class="mb-1 text-xs text-gray-500">Min Cost</div>
            <div class="font-semibold text-lg text-teal-600">
              ${minCost.toFixed(6)}
            </div>
          </div>

          <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
            <div class="mb-1 text-xs text-gray-500">Max Cost</div>
            <div class="font-semibold text-lg text-red-600">
              ${maxCost.toFixed(6)}
            </div>
          </div>
        </div>
      </div>

      <!-- Latency Metrics Section -->
      <div class="mb-6">
        <h3 class="mb-3 border-b border-gray-300 pb-2 text-lg font-bold text-gray-800">⚡ Latency Metrics</h3>

        <!-- RAG Timing -->
        <div class="mb-4">
          <h4 class="font-semibold mb-2 text-sm text-gray-700">RAG Timing</h4>
          <div class="mb-2 grid grid-cols-2 gap-2">
            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Retrieval (Last)</div>
              <div class="text-lg font-bold text-blue-600">
                {lastRetrievalDuration.toFixed(0)}ms
              </div>
            </div>

            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Retrieval (Avg)</div>
              <div class="text-lg font-bold text-green-600">
                {averageRetrievalDuration.toFixed(0)}ms
              </div>
            </div>
          </div>
          <div class="rounded bg-gray-100 p-2 text-xs text-gray-600">Retrieval: fetching from vector store</div>
        </div>

        <!-- Time to First Token -->
        <div class="mb-4">
          <h4 class="font-semibold mb-2 text-sm text-gray-700">Time to First Token (LLM Latency)</h4>
          <div class="grid grid-cols-2 gap-2">
            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Last Response</div>
              <div class="text-xl font-bold text-blue-600">
                {lastTTFT.toFixed(0)}ms
              </div>
            </div>

            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Average</div>
              <div class="text-xl font-bold text-green-600">
                {averageTTFT.toFixed(0)}ms
              </div>
            </div>

            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Last 3 Avg</div>
              <div class="text-xl font-bold text-purple-600">
                {last3TTFTAverage.toFixed(0)}ms
              </div>
            </div>

            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Min / Max</div>
              <div class="font-semibold text-sm text-gray-700">
                {minTTFT.toFixed(0)} / {maxTTFT.toFixed(0)}ms
              </div>
            </div>
          </div>
        </div>

        <!-- Message Generation Time -->
        <div class="mb-4">
          <h4 class="font-semibold mb-2 text-sm text-gray-700">Message Generation Time</h4>
          <div class="grid grid-cols-2 gap-2">
            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Last Response</div>
              <div class="text-lg font-bold text-blue-600">
                {(lastMessageTime / 1000).toFixed(2)}s
              </div>
            </div>

            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Average</div>
              <div class="text-lg font-bold text-green-600">
                {(averageMessageTime / 1000).toFixed(2)}s
              </div>
            </div>

            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Min / Max</div>
              <div class="font-semibold text-sm text-gray-700">
                {(minMessageTime / 1000).toFixed(2)} / {(maxMessageTime / 1000).toFixed(2)}s
              </div>
            </div>

            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Tokens/Second</div>
              <div class="text-lg font-bold text-indigo-600">
                {averageTokensPerSecond.toFixed(1)} tok/s
              </div>
            </div>
          </div>
        </div>

        <!-- Total Time -->
        <div class="mb-4">
          <h4 class="font-semibold mb-2 text-sm text-gray-700">Total Response Time (End-to-End)</h4>
          <div class="grid grid-cols-2 gap-2">
            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Last Response</div>
              <div class="text-xl font-bold text-blue-600">
                {(lastTotalTime / 1000).toFixed(2)}s
              </div>
            </div>

            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Average</div>
              <div class="text-xl font-bold text-green-600">
                {(averageTotalTime / 1000).toFixed(2)}s
              </div>
            </div>

            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Last 3 Avg</div>
              <div class="text-xl font-bold text-purple-600">
                {(last3TotalTimeAverage / 1000).toFixed(2)}s
              </div>
            </div>

            <div class="p-3 rounded border border-gray-200 bg-white shadow-sm">
              <div class="mb-1 text-xs text-gray-500">Min / Max</div>
              <div class="font-semibold text-sm text-gray-700">
                {(minTotalTime / 1000).toFixed(2)} / {(maxTotalTime / 1000).toFixed(2)}s
              </div>
            </div>
          </div>
          <div class="mt-2 rounded bg-gray-100 p-2 text-xs text-gray-600">Total = Retrieval + Message Generation</div>
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
                    ${cost.total.toFixed(6)}
                  </span>
                </div>
                <div class="space-y-1 mb-2 text-xs text-gray-600">
                  <div class="font-semibold text-gray-700">Cost Breakdown:</div>
                  <div class="gap-1 grid grid-cols-2">
                    <div>LLM: ${cost.llm.total.toFixed(6)}</div>
                    <div>Filter: ${cost.filtering.total.toFixed(6)}</div>
                    <div>Reranking: ${cost.reranking.total.toFixed(6)}</div>
                  </div>
                </div>
                {#if latency}
                  <div class="space-y-1 text-xs text-gray-600">
                    <div class="font-semibold text-gray-700">Timing Breakdown:</div>
                    <div class="gap-1 grid grid-cols-2">
                      <div>Retrieval: {latency.retrievalDuration.toFixed(0)}ms</div>
                      <div>TTFT: {latency.timeToFirstToken.toFixed(0)}ms</div>
                      <div>Message: {(latency.messageTime / 1000).toFixed(2)}s</div>
                      <div class="font-semibold col-span-2 text-gray-700">
                        Total: {(latency.totalTime / 1000).toFixed(2)}s
                      </div>
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
