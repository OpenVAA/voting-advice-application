import { Constants } from '@openvaa/supabase-types';
import { z } from 'zod';
import { parseRpcAnswer } from './rpcAnswer';
import type { Json } from '@openvaa/supabase-types';

/** The entity a nomination is nominated under: its type, its id and its two names. The names are kept as JSON and localized by whoever maps the row. */
const ParentSchema = z.object({
  entity_type: z.enum(Constants.public.Enums.entity_type),
  entity_id: z.string().min(1),
  name: z.json(),
  short_name: z.json()
});

/**
 * One element of the answer of the `get_entity_nominations` RPC, in the database's own column names.
 *
 * Every member is always stated; a column that holds nothing is a JSON null. `updated_at` is never null: a write of the entity's nominations is checked against it. The two names and the custom data are kept as JSON and read by whoever maps the row. Unknown members are dropped rather than refused, in an element and in its parent, so a fact added to the answer later does not fail the read.
 */
export const EntityNominationRowSchema = z.object({
  id: z.string().min(1),
  election_id: z.string().min(1),
  election_name: z.json(),
  constituency_id: z.string().min(1),
  constituency_name: z.json(),
  election_round: z.number().int().nullable(),
  election_symbol: z.string().nullable(),
  confirmed: z.boolean(),
  custom_data: z.json(),
  updated_at: z.string().min(1),
  parent: ParentSchema.nullable()
});

/** One nomination of an entity, as the `get_entity_nominations` RPC states it. */
export type EntityNominationRow = z.infer<typeof EntityNominationRowSchema>;

const EntityNominationsSchema = z.array(EntityNominationRowSchema);

/**
 * Narrow the answer of the `get_entity_nominations` RPC, which has three outcomes.
 *
 * - `null` is a refused read: the function answers it whenever the entity is not one the caller edits in the project, without saying why. It is returned as `null` and never as an empty list, because an empty list says that the caller's own entity has no nomination, and a caller shown that for an entity it may not read would be shown another state as true.
 * - An array, empty or not, is the entity's nominations.
 * - Anything else is a failed read and throws: answering it with an empty list would tell an entity that has nominations that it has none. The message names the paths the schema refused and never a stored value.
 * @param raw - The unvalidated value the RPC returned.
 * @returns The nominations, in the order the RPC listed them, or `null` when the read was refused.
 * @throws Error when the value is neither `null` nor an array of elements matching {@link EntityNominationRowSchema}, which includes a call that gave no answer.
 */
export function parseEntityNominations(raw: Json | undefined): Array<EntityNominationRow> | null {
  if (raw === null) return null;
  return parseRpcAnswer(EntityNominationsSchema, raw, 'get_entity_nominations');
}
