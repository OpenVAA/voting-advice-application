import { z } from 'zod';
import type { Json } from '@openvaa/supabase-types';

/**
 * The answer of the `set_entity_nominations` RPC, in the database's own names: how many of the entity's nominations the write inserted, updated, deleted and left unchanged, and how many nominations it created for the entities named as parents.
 *
 * Unknown members are dropped rather than refused, so a fact added to the answer later does not fail the write's report.
 */
export const SetEntityNominationsAnswerSchema = z.object({
  inserted: z.number().int(),
  updated: z.number().int(),
  deleted: z.number().int(),
  unchanged: z.number().int(),
  parents_created: z.number().int()
});

/** The counts of one write of an entity's nominations, as the `set_entity_nominations` RPC states them. */
export type SetEntityNominationsAnswer = z.infer<typeof SetEntityNominationsAnswerSchema>;

/**
 * Narrow the answer of the `set_entity_nominations` RPC to its counts.
 *
 * The function answers a write it made with the five counts and raises for every write it did not make, so anything else, a `null` included, is an answer that cannot be read and throws. The message names the paths the schema refused and never a stored value.
 * @param raw - The unvalidated value the RPC returned.
 * @returns The counts.
 * @throws Error when the value does not match {@link SetEntityNominationsAnswerSchema}, which includes a call that gave no answer.
 */
export function parseSetEntityNominationsAnswer(raw: Json | undefined): SetEntityNominationsAnswer {
  const result = SetEntityNominationsAnswerSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.path.join('.') || '(root)');
    throw new Error(`The answer of set_entity_nominations did not match its schema at: ${issues.join(', ')}`);
  }
  return result.data;
}
