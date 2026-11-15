import { z } from 'zod';
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
 * Unknown members are dropped rather than refused, at the top level and inside an entry, so a fact added to the answer later does not fail the read. The answer's `password_set` is such a member: {@link parseCallerPasswordSet} reads it.
 */
export const UserEntitiesSchema = z.object({
  entities: z.array(z.discriminatedUnion('entity_type', [CandidateEntrySchema, OrganizationEntrySchema]))
});

/** One entity the user edits, as the list RPC states it: the card fields, in the database's own column names. */
export type UserEntityEntry = z.infer<typeof UserEntitiesSchema>['entities'][number];

/**
 * Narrow the answer of the `get_user_entities` RPC to its entries.
 *
 * A malformed answer is a failed read and throws: answering with an empty list instead would tell a user who edits entities that they edit none. The message names the paths the schema refused and never a stored value.
 * @param raw - The unvalidated value the RPC returned.
 * @returns The entries, in the order the RPC listed them.
 * @throws Error when the value does not match {@link UserEntitiesSchema}.
 */
export function parseUserEntities(raw: Json | undefined): Array<UserEntityEntry> {
  const result = UserEntitiesSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.path.join('.') || '(root)');
    throw new Error(`The list of the user's entities did not match its schema at: ${issues.join(', ')}`);
  }
  return result.data.entities;
}

/** The one member of the `get_user_entities` answer that is a fact about the caller and not about an entity. */
const CallerPasswordSetSchema = z.object({ password_set: z.boolean() });

/**
 * Read one fact about the caller from the answer of the `get_user_entities` RPC: whether the caller's own account has a password.
 *
 * Anything but a boolean throws. An absent, null or otherwise malformed fact is a failed read, neither "has a password" nor "has none", and answering either for it would be a guess. The message names the path the schema refused and never a stored value.
 * @param answer - The unvalidated value the RPC returned.
 * @returns `true` when the account has a password and `false` when it has none.
 * @throws Error when the value is no object or its `password_set` is not a boolean.
 */
export function parseCallerPasswordSet(answer: unknown): boolean {
  const result = CallerPasswordSetSchema.safeParse(answer);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.path.join('.') || '(root)');
    throw new Error(`The caller's password fact did not match its schema at: ${issues.join(', ')}`);
  }
  return result.data.password_set;
}
