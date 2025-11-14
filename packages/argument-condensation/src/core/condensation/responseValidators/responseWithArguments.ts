import { z } from 'zod';
import type { ResponseWithArguments } from '../../types/llm/responseWithArguments';

/**
 * Contract for validating `ResponseWithArguments` (see example below).
 * This ensures that the LLM output conforms to the expected structure
 * containing arguments and reasoning before it is used further in the application.
 *
 * @example
 * const response: ResponseWithArguments = {
 *   arguments: [{ id: '123', text: 'This is an argument' }],
 *   reasoning: 'This is a reason'
 * };
 *
 * const isValid = RESPONSE_WITH_ARGUMENTS_CONTRACT.validate(response); // returns true for this example
 *
 */
export const ResponseWithArgumentsSchema = z.object({
  arguments: z.array(
    z.object({
      id: z.string(),
      text: z.string()
    })
  ),
  reasoning: z.string()
}) satisfies z.ZodType<ResponseWithArguments>;
