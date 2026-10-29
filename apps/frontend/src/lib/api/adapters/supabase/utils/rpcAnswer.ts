import type { z } from 'zod';

/**
 * Narrow the unvalidated answer of an RPC or of a function operation against its schema.
 *
 * The message names the call and the paths the schema refused, each once. It never holds a value of the answer, which can be a stored value or a session token.
 * @param schema - The schema the answer must match.
 * @param raw - The unvalidated answer.
 * @param call - The name of the RPC or the operation, for the message.
 * @returns The answer as the schema types it.
 * @throws Error when the answer does not match the schema, which includes a call that gave no answer.
 */
export function parseRpcAnswer<TSchema extends z.ZodType>(
  schema: TSchema,
  raw: unknown,
  call: string
): z.infer<TSchema> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const paths = new Set(result.error.issues.map((issue) => issue.path.join('.') || '(root)'));
    throw new Error(`The answer of ${call} did not match its schema at: ${[...paths].join(', ')}`);
  }
  return result.data;
}
