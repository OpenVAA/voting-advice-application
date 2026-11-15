import { Constants } from '@openvaa/supabase-types';
import { z } from 'zod';
import type { Json } from '@openvaa/supabase-types';

/** A contest an option is nominated at: an election and a constituency of it. */
const ContestSchema = z.object({
  election_id: z.string().min(1),
  constituency_id: z.string().min(1)
});

/**
 * One element of the answer of the `get_nomination_parent_options` RPC, in the database's own column names.
 *
 * Every member is always stated; a column that holds nothing is a JSON null. An option is an organization or an alliance and no other entity type. The two names, the colour and the image are kept as JSON and read by whoever maps the row. Unknown members are dropped rather than refused, in an element and in a contest, so a fact added to the answer later does not fail the read.
 */
export const NominationParentOptionRowSchema = z.object({
  id: z.string().min(1),
  entity_type: z.enum(Constants.public.Enums.entity_type).extract(['organization', 'alliance']),
  name: z.json(),
  short_name: z.json(),
  color: z.json(),
  image: z.json(),
  nominated: z.array(ContestSchema)
});

/** One entity a nomination may be placed under, as the `get_nomination_parent_options` RPC states it. */
export type NominationParentOptionRow = z.infer<typeof NominationParentOptionRowSchema>;

const NominationParentOptionsSchema = z.array(NominationParentOptionRowSchema);

/**
 * Narrow the answer of the `get_nomination_parent_options` RPC, which has three outcomes.
 *
 * - `null` is a refused read: the function answers it whenever the entity is not one the caller edits in the project, and for contests it cannot read as a list of pairs, without saying which. It is returned as `null` and never as an empty list, because an empty list says that the project lists nothing the entity may be nominated under, and an editor shown that would be offered a typed name where a listed entity is required.
 * - An array, empty or not, is the options.
 * - Anything else is a failed read and throws. The message names the paths the schema refused and never a stored value.
 * @param raw - The unvalidated value the RPC returned.
 * @returns The options, in the order the RPC listed them, or `null` when the read was refused.
 * @throws Error when the value is neither `null` nor an array of elements matching {@link NominationParentOptionRowSchema}, which includes a call that gave no answer.
 */
export function parseNominationParentOptions(raw: Json | undefined): Array<NominationParentOptionRow> | null {
  if (raw === null) return null;
  const result = NominationParentOptionsSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.path.join('.') || '(root)');
    throw new Error(`The answer of get_nomination_parent_options did not match its schema at: ${issues.join(', ')}`);
  }
  return result.data;
}
