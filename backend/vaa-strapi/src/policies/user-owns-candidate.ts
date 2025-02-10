import { StrapiContext } from '../../types/customStrapiTypes';
import { getUsersCandidate } from '../util/getUsersCandidate';
import { warn } from '../util/logger';

/**
 * A policy that requires the `User` to be authenticated and own the `Candidate` targeted.
 */
export default async function userOwnsCandidate({ params, state }: StrapiContext): Promise<boolean> {
  // NB. The documentId is called id because it's parsed from the route, e.g., `/api/candidates/:id`
  const candidateId = params?.id;
  const userId = state?.user?.id;
  if (!candidateId || !userId) {
    warn('[global:user-owns-candidate] triggered because there was no candidateId or userId by', { params, state });
    return false;
  }

  const candidate = await getUsersCandidate(userId);
  if (!candidate || candidate.documentId !== candidateId) {
    warn(
      '[global:user-owns-candidate] triggered because candidate.documentId !== candidateId by',
      { candidate, candidateId },
      { params, state }
    );
    return false;
  }

  return true;
}
