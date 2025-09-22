import type { z } from 'zod';

/**
 * Recreation of the Vercel AI SDK Tool type. Contains only the essential fields.
 */
export interface Tool<TInput, TOutput> {
  /** Description of what the tool does - used by LLM for tool selection */
  description: string;

  /** Zod schema defining the expected input structure */
  inputSchema: z.ZodSchema<TInput>;

  /** Function that executes the tool logic */
  execute: (input: TInput) => Promise<TOutput> | TOutput;
}

/**
 * Options for tool inclusion.
 */
export interface ToolOptions {
  includeVectorSearch?: boolean;
  includeWebSearch?: boolean;
  includeCustomTools?: boolean;
}