import type { Data } from '@strapi/strapi';

/**
 * Get the `Candidate` associated with a given `userId`.
 * @param userId The `id` (not `documentId`) of the `User`.
 * @returns The `Candidate` associated with the given `userId` or `null` if no `Candidate` is found.
 * @throws If multiple `Candidate`s are found for the same `User`.
 */
export async function getUsersCandidate(userId: number): Promise<Data.ContentType<'api::candidate.candidate'> | null> {
  const candidates = await strapi.documents('api::candidate.candidate').findMany({
    populate: ['user'],
    where: { user: { id: userId } }
  });
  if (candidates.length === 0) return null;
  if (candidates.length > 1) throw new Error('Multiple candidates found for the same user');
  return candidates[0];
}
