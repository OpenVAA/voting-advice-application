import { z } from 'zod';
import { parseRpcAnswer } from './rpcAnswer';
import type { Json } from '@openvaa/supabase-types';

/** The members every entry of the list carries, whatever its type. The JSONB members are kept as JSON and parsed by whoever renders them. */
const sharedEntryMembers = {
  id: z.string().min(1),
  short_name: z.json(),
  image: z.json(),
  color: z.json(),
  confirmed: z.boolean()
};

const CandidateEntrySchema = z.object({
  entity_type: z.literal('candidate'),
  first_name: z.string(),
  last_name: z.string(),
  ...sharedEntryMembers
});

const OrganizationEntrySchema = z.object({
  entity_type: z.literal('organization'),
  name: z.json(),
  ...sharedEntryMembers
});

/**
 * The list in the answer of the `get_user_entities` RPC: one object whose `entities` array holds one entry per entity the caller edits in the project.
 *
 * Unknown members are dropped rather than refused, at the top level and inside an entry, so a fact added to the answer later does not fail the read.
 */
export const UserEntitiesSchema = z.object({
  entities: z.array(z.discriminatedUnion('entity_type', [CandidateEntrySchema, OrganizationEntrySchema]))
});

/** One entity the user edits, as the list RPC states it: the card fields, in the database's own column names. */
export type UserEntityEntry = z.infer<typeof UserEntitiesSchema>['entities'][number];

/**
 * Narrow the answer of the `get_user_entities` RPC to its entries.
 *
 * A malformed answer is a failed read and throws: answering with an empty list instead would tell a user who edits entities that they edit none.
 * @param raw - The unvalidated value the RPC returned.
 * @returns The entries, in the order the RPC listed them.
 * @throws Error when the value does not match {@link UserEntitiesSchema}, naming the paths the schema refused and never a stored value.
 */
export function parseUserEntities(raw: Json | undefined): Array<UserEntityEntry> {
  return parseRpcAnswer(UserEntitiesSchema, raw, 'get_user_entities').entities;
}

/**
 * The answer of the `get_caller_account_state` RPC: two facts about the caller's own account. Unknown members are dropped rather than refused.
 */
const CallerAccountStateSchema = z.object({
  password_set: z.boolean(),
  pending_email_taken: z.boolean()
});

/** The two facts about the caller's own account, as the frontend names them. */
export type CallerAccountState = {
  /** Whether the account has a password. */
  passwordSet: boolean;
  /** Whether the address the account is changing to is already another account's; `false` when nothing is pending. */
  pendingEmailTaken: boolean;
};

/**
 * Narrow the answer of the `get_caller_account_state` RPC.
 *
 * Anything but a boolean for either fact throws. An absent, null or otherwise malformed fact is a failed read, neither "yes" nor "no", and answering either for it would be a guess.
 * @param raw - The unvalidated value the RPC returned.
 * @returns The two facts.
 * @throws Error when the value is no object or either fact is not a boolean, naming the paths the schema refused and never a stored value.
 */
export function parseCallerAccountState(raw: unknown): CallerAccountState {
  const { password_set, pending_email_taken } = parseRpcAnswer(
    CallerAccountStateSchema,
    raw,
    'get_caller_account_state'
  );
  return { passwordSet: password_set, pendingEmailTaken: pending_email_taken };
}
