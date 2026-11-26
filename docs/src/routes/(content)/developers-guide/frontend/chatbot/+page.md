# Chatbot

The chatbot is an AI assistant that helps voters understand elections, parties, and policies. It provides real-time assistance using RAG (Retrieval-Augmented Generation) and appears as a floating widget on the pages that include VAA questions (only the questions pages are supported due to resource constraints). There is also a [development view](#development-view).

See chatbotHandoff.md for essential improvements needed and a description of potential issues.

See README.md and HANDOFF.md in the chatbot package for a comprehensive description of the system, its configuration and usage & future improvements needed.

## Architecture

The chatbot follows a four-layer architecture:

1. **UI Layer**: Svelte components (`ChatbotWidget`, `ChatbotToggleButton`)
2. **State Layer**: Svelte stores via `createChatStore()`
3. **Communication Layer**: SSE client for streaming responses
4. **API Layer**: SvelteKit endpoints at `/api/chat`

The API layer sends the full conversation state to the chatbot package API, which is stateless. State is managed in the frontend's State Layer.

## Components

### ChatbotToggleButton

**Location**: `$lib/components/chatbot/ChatbotToggleButton.svelte`

Floating action button that opens/closes the chatbot.

**Usage**:

```svelte
<script>
  import { ChatbotToggleButton } from '$lib/components/chatbot';
  let chatbotOpen = false;
</script>

<ChatbotToggleButton bind:isOpen={chatbotOpen} on:click={() => (chatbotOpen = !chatbotOpen)} />
```

### ChatbotWidget

**Location**: `$lib/components/chatbot/ChatbotWidget.svelte`

Main chat interface with messages, input, and conversation management.

**Properties**:

- `isOpen: boolean` - Widget visibility
- `locale: string` - Language locale, currently only English is supported!!!!
- `questionContext?: ChatbotQuestionContext` - Optional context about current question
- `onClose?: () => void` - Close callback

**Features**:

- Real-time streaming responses
- Persistent sessions (localStorage + Redis)
- Manual "New conversation" reset, this is the default way to reset a conversation

**Usage**:

```svelte
<script>
  import { ChatbotWidget } from '$lib/components/chatbot';
  let chatbotOpen = false;
</script>

<ChatbotWidget bind:isOpen={chatbotOpen} locale="en" onClose={() => (chatbotOpen = false)} />
```

### Development View

Full-page interface showing:

- **Left**: Chat conversation
- **Middle**: Retrieved RAG contexts
- **Right**: Cost and latency metrics

Access at: `http://localhost:5173/en/chatbot/single`

## State Management

### Chat Store

**Location**: `$lib/chatbot/chatStore.ts`

The `createChatStore()` function manages chat state:

```typescript
interface ChatState {
  messages: Array<UIMessage>;
  loading: boolean;
  sessionId: string | null;
  clientId: string | null;
}
```

**Key Methods**:

- `initialize()` - Loads history or shows onboarding
- `sendMessage(text)` - Sends message and handles streaming
- `resetConversation()` - Clears session
- `destroy()` - Cleanup

**Example**:

```svelte
<script>
  import { createChatStore } from '$lib/chatbot';
  import { onMount, onDestroy } from 'svelte';

  const chatStore = createChatStore({ locale: 'en' });

  $: messages = $chatStore.messages;
  $: loading = $chatStore.loading;

  onMount(() => chatStore.initialize());
  onDestroy(() => chatStore.destroy());
</script>
```

### Session Persistence

**Client-Side**:

- `sessionId` stored in `localStorage` as `chatbot_sessionId`
- `clientId` stored as `chatbot_client_id` (for rate limiting)
- History automatically loaded on page reload

**Server-Side**:

- Full conversation state in Redis
- TTL-based expiration
- Includes all messages and metadata

## Communication

### SSE Client

**Location**: `$lib/chatbot/utils/sseClient.ts`

Parses Server-Sent Events from the API:

| Event Type      | Purpose                      |
| --------------- | ---------------------------- |
| `session-id`    | Session identifier           |
| `text-delta`    | Streaming text chunks        |
| `finish`        | Stream completion            |
| `rag-contexts`  | Retrieved context (dev mode) |
| `metadata-info` | Cost/latency data (dev mode) |

### Onboarding

**Location**: `$lib/chatbot/utils/onboarding.ts`

First-time visitors see an animated typing effect:

- Character-by-character streaming (5ms ± 30% delay)
- Natural typing simulation
- Uses localized welcome message (though currently only english is supported. To add language support, see the chatbot package's ChatbotController.)

## API Integration

### Chat Endpoint

**Location**: `routes/[[lang=locale]]/api/chat/+server.ts`

#### POST `/api/chat`

Send message and receive SSE stream.

**Request**:

```typescript
{
  message: string;
  sessionId?: string;
  clientId?: string;
  questionContext?: ChatbotQuestionContext;
}
```

**Response**: SSE stream with text deltas and metadata

**Rate Limiting**:

- Per-client: 60 requests / 60s
- Per-session: 30 requests / 60s
- Per-IP: 300 requests / 60s

#### GET `/api/chat?sessionId={id}`

Retrieve conversation history. Returns 404 if not found.

#### DELETE `/api/chat?sessionId={id}`

Delete conversation. Returns 204.

### Backend Integration

The endpoint uses `@openvaa/chatbot` package:

```typescript
import { ChatbotController } from '@openvaa/chatbot/server';

const response = await ChatbotController.handleQuery({
  locale,
  state,
  vectorStore,
  chatProvider,
  rerankConfig: {
    enabled: true,
    apiKey: constants.COHERE_API_KEY,
    model: 'rerank-v3.5'
  },
  nResultsTarget: 5
});
```

## Message Flow

1. User sends message via `ChatbotWidget`
2. `chatStore.sendMessage()` adds user message to UI
3. POST request to `/api/chat` with message and session info
4. API checks rate limits, loads session from Redis
5. `ChatbotController` processes query with RAG retrieval if needed
6. LLM streams response tokens via SSE
7. `SSEClient` parses events and updates store
8. UI updates reactively as tokens arrive
9. Completed state saved to Redis

## Type System

**Location**: `$lib/chatbot/types.ts`

**UIMessage**: Frontend message structure

```typescript
interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<UIMessagePart>;
  metadata?: {
    category?: string;
    toolsUsed?: Array<{ name: string; args: any }>;
  };
}
```

**UIMessagePart**: Content pieces

```typescript
interface UITextPart {
  type: 'text';
  text: string;
  state?: 'streaming' | 'done';
}
```

## Development Features

### Extended Callbacks

Track RAG and performance metrics:

```typescript
const chatStore = createChatStore({
  locale: 'en',
  extendedCallbacks: {
    onRagContexts: (contexts) => {
      console.log('Retrieved segments:', contexts);
    },
    onMetadata: (data) => {
      console.log('Cost:', data.cost);
      console.log('Latency:', data.latency);
    }
  }
});
```

### Metrics Available

**Cost**:

- LLM costs (input/output tokens)
- Reranking costs (Cohere API)
- Per-request and session totals

**Latency**:

- Time to first token (TTFT)
- RAG retrieval duration
- Tokens per second
- Total end-to-end time

## Usage Examples

### Basic Integration

```svelte
<script>
  import { ChatbotToggleButton, ChatbotWidget } from '$lib/components/chatbot';
  import { page } from '$app/stores';

  let chatbotOpen = false;
  $: locale = $page.params.lang || 'en';
</script>

<ChatbotToggleButton isOpen={chatbotOpen} on:click={() => (chatbotOpen = !chatbotOpen)} />

<ChatbotWidget bind:isOpen={chatbotOpen} {locale} onClose={() => (chatbotOpen = false)} />
```

### With Question Context

```svelte
<script>
  import { ChatbotWidget } from '$lib/components/chatbot';
  export let question;

  $: questionContext = {
    questionId: question.id,
    questionText: question.text,
    category: question.category
  };
</script>

<ChatbotWidget bind:isOpen={chatbotOpen} {questionContext} locale="en" />
```

## Styling

**ChatbotWidget**:

- Fixed position: bottom-right corner
- Responsive width (400px max)
- Z-index: 40
- Color scheme: White with teal accents (#10a37f)

**ChatbotToggleButton**:

- Uses Tailwind classes
- Primary theme colors
- Hover scale animation

Customize by editing:

- Widget: `<style>` in `ChatbotWidget.svelte`
- Button: Tailwind classes in `ChatbotToggleButton.svelte`

## Troubleshooting

### "No context found" errors

**Cause**: Reranking score below threshold (0.75)

**Solutions**:

- Lower `MIN_RERANK_SCORE` in `packages/chatbot/src/core/rag/ragService.ts`
- Add more content to vector store via `@openvaa/file-processing`
- Increase `nResultsTarget` in API endpoint

### Session not persisting

**Check**:

- localStorage enabled in browser
- Redis running and accessible

### Slow responses

**Debug** using development view (`/[[lang=locale]]/chatbot/single`):

- High retrieval time → Vector store performance
- High reranking cost → Cohere API latency

**Optimize**:

- Reduce `nResultsTarget` (fewer segments)
- Disable reranking (faster but lower quality)
- Use faster LLM model

### Rate limit adjustments

Edit limits in `routes/[[lang=locale]]/api/chat/+server.ts`:

```typescript
const clientRateLimiter = new RateLimiter(redisClient, 60, 60);
const sessionRateLimiter = new RateLimiter(redisClient, 30, 60);
const ipRateLimiter = new RateLimiter(redisClient, 300, 60);
```

Format: `new RateLimiter(redis, maxRequests, windowSeconds)`

## Testing

**Manual Testing Checklist**:

1. Send messages and verify responses
2. Reload page, check history loads
3. Click "New conversation", verify reset
4. Test rate limiting with rapid messages
5. Clear localStorage, verify onboarding

**Development View**:
Navigate to `/[lang]/chatbot/single` to inspect:

- RAG retrieval quality and scores
- API costs breakdown
- Response latency metrics
- Tool usage

## Related Documentation

- [Chatbot Package](../../packages/chatbot/README.md) - Backend implementation
- [File Processing](../../packages/file-processing/README.md) - Adding RAG content
- [Vector Store](../../packages/vector-store/README.md) - Vector store logic and local data storage
- [Contexts](./contexts.md) - Svelte context system
- [Components](./components.md) - Component conventions
- [Data API](./data-api.md) - Data loading patterns
