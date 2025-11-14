import { getOnboardingMessage } from '@openvaa/chatbot';

/**
 * UIMessage interface matching the chatbot page structure
 */
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
        type: string;
        toolCallId: string;
        state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
        input?: any;
        output?: any;
        errorText?: string;
      }
  >;
}

/**
 * Configuration for streaming simulation
 */
interface StreamingConfig {
  /**
   * Delay between characters in milliseconds
   * Default: 12ms (approximately 83 characters per second)
   */
  charDelayMs?: number;

  /**
   * Whether to add slight random variation to character delays
   * Makes streaming feel more natural
   * Default: true
   */
  randomizeDelay?: boolean;
}

/**
 * Simulate character-by-character streaming of a message
 *
 * @param text - Full message text to stream
 * @param onChunk - Callback invoked for each character
 * @param config - Streaming configuration
 */
export async function simulateStreamingMessage(
  text: string,
  onChunk: (char: string) => void,
  config: StreamingConfig = {}
): Promise<void> {
  const { charDelayMs = 5, randomizeDelay = true } = config;

  for (const char of text) {
    onChunk(char);

    // Calculate delay with optional randomization
    let delay = charDelayMs;
    if (randomizeDelay) {
      // Add random variation ±30% of base delay
      const variation = charDelayMs * 0.3;
      delay = charDelayMs + (Math.random() * variation * 2 - variation);
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Create and stream an onboarding message
 * Returns a function to update the messages array reactively
 *
 * @param locale - User's locale for message content
 * @param config - Streaming configuration
 * @returns Object with message and streaming controller
 */
export function createOnboardingStream(locale: string = 'en', config: StreamingConfig = {}) {
  const messageText = getOnboardingMessage(locale);

  // Create initial empty assistant message
  const message: UIMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: '',
        state: 'streaming'
      }
    ]
  };

  // Start streaming asynchronously
  const streamPromise = (async () => {
    await simulateStreamingMessage(
      messageText,
      (char) => {
        // Append character to message
        const textPart = message.parts[0] as { type: 'text'; text: string; state?: 'streaming' | 'done' };
        textPart.text += char;
      },
      config
    );

    // Mark as done when streaming completes
    const textPart = message.parts[0] as { type: 'text'; text: string; state?: 'streaming' | 'done' };
    textPart.state = 'done';
  })();

  return {
    message,
    streamPromise
  };
}

/**
 * Simple helper to start onboarding with callback for reactivity
 * Useful for Svelte reactive statements
 *
 * @param locale - User's locale
 * @param config - Streaming configuration
 * @param onUpdate - Callback invoked after each character (for Svelte reactivity)
 * @returns The onboarding message (mutated during streaming)
 */
export async function startOnboarding(
  locale: string = 'en',
  config: StreamingConfig = {},
  onUpdate?: () => void
): Promise<UIMessage> {
  const messageText = getOnboardingMessage(locale);

  const message: UIMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: '',
        state: 'streaming'
      }
    ]
  };

  await simulateStreamingMessage(
    messageText,
    (char) => {
      const textPart = message.parts[0] as { type: 'text'; text: string; state?: 'streaming' | 'done' };
      textPart.text += char;
      onUpdate?.(); // Trigger reactivity in Svelte
    },
    config
  );

  // Mark as done
  const textPart = message.parts[0] as { type: 'text'; text: string; state?: 'streaming' | 'done' };
  textPart.state = 'done';

  return message;
}
