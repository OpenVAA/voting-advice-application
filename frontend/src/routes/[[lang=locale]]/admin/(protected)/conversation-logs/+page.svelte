<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/button';
  import { getAdminContext } from '$lib/contexts/admin';
  import MainContent from '../../../MainContent.svelte';
  import type { ConversationLog, ConversationSummary } from '@openvaa/chatbot';

  const { t } = getAdminContext();

  // State
  let sessions: Array<ConversationSummary> = [];
  let selectedSessionId: string | null = null;
  let selectedLog: ConversationLog | null = null;
  let loading = false;
  let error: string | null = null;

  // Fetch all conversation sessions
  async function fetchSessions() {
    try {
      loading = true;
      error = null;
      const response = await fetch('/api/conversation-logs');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      sessions = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching sessions:', err);
    } finally {
      loading = false;
    }
  }

  // Fetch specific conversation log
  async function fetchConversationLog(sessionId: string) {
    try {
      loading = true;
      error = null;
      console.log('[UI] Fetching conversation log for:', sessionId);
      const response = await fetch(`/api/conversation-logs/${sessionId}`);
      console.log('[UI] Response status:', response.status);
      if (!response.ok) throw new Error('Failed to fetch conversation log');
      const data = await response.json();
      console.log('[UI] Received data:', data);
      console.log('[UI] Data has phases:', data?.phases?.length);
      selectedLog = data;
      selectedSessionId = sessionId;
      console.log('[UI] selectedLog set:', !!selectedLog);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching conversation log:', err);
      selectedLog = null;
    } finally {
      loading = false;
    }
  }

  // Delete conversation
  async function deleteConversation(sessionId: string) {
    if (!confirm('Are you sure you want to delete this conversation log?')) {
      return;
    }

    try {
      const response = await fetch(`/api/conversation-logs/${sessionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete conversation');

      // Refresh sessions list
      await fetchSessions();

      // Clear selected log if it was deleted
      if (selectedSessionId === sessionId) {
        selectedSessionId = null;
        selectedLog = null;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error deleting conversation:', err);
    }
  }

  // Download conversation as text
  async function downloadAsText(sessionId: string) {
    try {
      const response = await fetch(`/api/conversation-logs/${sessionId}?format=text`);
      if (!response.ok) throw new Error('Failed to download conversation');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${sessionId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error downloading conversation:', err);
    }
  }

  // Copy to clipboard
  async function copyToClipboard() {
    if (!selectedLog) return;

    try {
      const textContent = formatLogAsText(selectedLog);
      await navigator.clipboard.writeText(textContent);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      alert('Failed to copy to clipboard');
    }
  }

  // Format log as text (simple version, could use formatConversationAsText from backend)
  function formatLogAsText(log: ConversationLog): string {
    let text = `SESSION: ${log.sessionId}\nSTARTED: ${new Date(log.startedAt).toLocaleString()}\n\n`;

    for (const phase of log.phases) {
      text += `>>> PHASE: ${phase.phase}\n\n`;
      for (const exchange of phase.exchanges) {
        const time = new Date(exchange.timestamp).toLocaleTimeString();
        text += `[USER @ ${time}]\n${exchange.userMessage}\n\n`;
        text += `[ASSISTANT @ ${time}]\n${exchange.assistantMessage}\n\n`;
      }
    }

    return text;
  }

  // Format timestamp for display
  function formatTimestamp(date: string | Date): string {
    return new Date(date).toLocaleString();
  }

  // Format relative time
  function formatRelativeTime(date: string | Date): string {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  onMount(() => {
    fetchSessions();
  });
</script>

<MainContent title="Conversation Logs">
  <div slot="primaryActions" class="flex gap-2">
    <Button variant="secondary" text="Refresh" on:click={fetchSessions} disabled={loading} />
  </div>

  <div slot="fullWidth" class="px-1 flex h-[calc(100vh-200px)] gap-4">
    <!-- Left Sidebar: Session List -->
    <div class="flex w-1/3 flex-col rounded border border-gray-300 bg-white">
      <div class="border-b border-gray-300 bg-gray-50 p-4">
        <h3 class="font-semibold text-lg">Active Sessions ({sessions.length})</h3>
      </div>

      <div class="flex-1 overflow-y-auto p-2">
        {#if loading && sessions.length === 0}
          <div class="p-4 text-center text-gray-500">Loading sessions...</div>
        {:else if error && sessions.length === 0}
          <div class="p-4 text-center text-red-600">{error}</div>
        {:else if sessions.length === 0}
          <div class="p-4 text-center text-gray-500">
            No conversation logs yet. Start a chat to see logs appear here.
          </div>
        {:else}
          <div class="space-y-2">
            {#each sessions as session}
              <button
                class="p-3 w-full rounded border text-left transition-colors hover:bg-blue-50
                  {selectedSessionId === session.sessionId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}"
                on:click={() => fetchConversationLog(session.sessionId)}>
                <div class="mb-1 flex items-center justify-between">
                  <span class="font-semibold text-xs text-gray-600">
                    {session.sessionId.slice(0, 8)}...
                  </span>
                  <span class="text-xs text-gray-500">
                    {formatRelativeTime(session.lastActivity)}
                  </span>
                </div>
                <div class="text-sm text-gray-700">
                  {session.messageCount} messages
                </div>
                <div class="mt-1 flex items-center gap-2">
                  <span class="py-0.5 rounded bg-purple-100 px-2 text-xs text-purple-700">
                    {session.currentPhase}
                  </span>
                </div>
                <div class="mt-1 text-xs text-gray-500">
                  Started: {formatTimestamp(session.startedAt)}
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Right Main Content: Selected Conversation Log -->
    <div class="flex flex-1 flex-col rounded border border-gray-300 bg-white">
      {#if !selectedLog}
        <div class="flex h-full items-center justify-center text-gray-500">Select a conversation to view its log</div>
      {:else}
        <div class="flex items-center justify-between border-b border-gray-300 bg-gray-50 p-4">
          <div>
            <h3 class="font-semibold text-lg">Session: {selectedLog.sessionId}</h3>
            <p class="text-sm text-gray-600">Started: {formatTimestamp(selectedLog.startedAt)}</p>
          </div>
          <div class="flex gap-2">
            <Button variant="secondary" text="Copy" on:click={copyToClipboard} title="Copy to clipboard" />
            <Button
              variant="secondary"
              text="Download"
              on:click={() => downloadAsText(selectedLog.sessionId)}
              title="Download as text file" />
            <Button
              variant="danger"
              text="Delete"
              on:click={() => deleteConversation(selectedLog.sessionId)}
              title="Delete this conversation" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          {#each selectedLog.phases as phase, phaseIdx}
            <!-- Phase Header -->
            <div class="p-3 mb-4 rounded bg-purple-50 {phaseIdx > 0 ? 'mt-6' : ''}">
              <div class="flex items-center justify-between">
                <h4 class="font-semibold text-purple-900">PHASE: {phase.phase}</h4>
                <span class="text-sm text-purple-700">
                  Started: {formatTimestamp(phase.startedAt)}
                </span>
              </div>
              <div class="mt-1 text-sm text-purple-700">
                {phase.exchanges.length} exchanges in this phase
              </div>
            </div>

            <!-- Messages in this phase -->
            <div class="space-y-4">
              {#each phase.exchanges as exchange}
                <div class="ml-4 space-y-2">
                  <!-- User Message -->
                  <div class="p-3 rounded border border-blue-200 bg-blue-50">
                    <div class="mb-1 flex items-center justify-between">
                      <span class="font-semibold text-xs text-blue-700">USER</span>
                      <span class="text-xs text-blue-600">
                        {new Date(exchange.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div class="whitespace-pre-wrap text-sm text-gray-800">
                      {exchange.userMessage}
                    </div>
                  </div>

                  <!-- Assistant Message -->
                  <div class="p-3 rounded border border-gray-200 bg-gray-50">
                    <div class="mb-1 flex items-center justify-between">
                      <span class="font-semibold text-xs text-gray-700">ASSISTANT</span>
                      <span class="text-xs text-gray-600">
                        {new Date(exchange.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div class="whitespace-pre-wrap text-sm text-gray-800">
                      {exchange.assistantMessage}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</MainContent>
