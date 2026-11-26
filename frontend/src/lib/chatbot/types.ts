/**
 * Shared type definitions for chatbot functionality
 * Centralizes types to avoid duplication across components
 */

/**
 * Text part of a UI message
 */
export interface UITextPart {
  type: 'text';
  text: string;
  state?: 'streaming' | 'done';
}

/**
 * Tool call part of a UI message
 */
export interface UIToolPart {
  type: string; // 'tool-{toolName}' pattern
  toolCallId: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output?: any;
  errorText?: string;
}

/**
 * A part of a UI message - can be text or a tool call
 */
export type UIMessagePart = UITextPart | UIToolPart;

/**
 * Type guard to check if a message part is a text part
 */
export function isTextPart(part: UIMessagePart): part is UITextPart {
  return part.type === 'text';
}

/**
 * A message in the chat UI, representing user or assistant messages
 */
export interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<UIMessagePart>;
  metadata?: {
    phase?: string;
    category?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toolsUsed?: Array<{ name: string; args: any }>;
  };
}

/**
 * Model message format (for API communication)
 */
export interface ModelMessage {
  role: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: string | Array<{ type: string; text?: string } & Record<string, any>>;
}

/**
 * Request body for chat API
 */
export interface ChatRequestBody {
  message: string;
  sessionId?: string;
  clientId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  questionContext?: any; // ChatbotQuestionContext from @openvaa/chatbot
}

/**
 * SSE event types
 */
export type SSEEvent =
  | {
      type: 'session-id';
      sessionId: string;
    }
  | {
      type: 'text-delta';
      delta: string;
    }
  | {
      type: 'finish';
    }
  | {
      type: 'rag-contexts';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contexts: Array<any>;
    }
  | {
      type: 'metadata-info';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cost: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      latency: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rag: any;
      timestamp: number;
    };
