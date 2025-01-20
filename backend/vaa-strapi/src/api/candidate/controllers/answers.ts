import { LocalizedAnswer } from '@openvaa/app-shared';
import { StrapiContext } from '../../../../types/customStrapiTypes';
import { setEntityAnswers } from '../../../util/setEntityAnswers';

export default {
  /**
   * Update the `Candidate`s answers by merging the provided answers with the existing ones.
   */
  async update(ctx: StrapiContext) {
    const answers = await setCandidateAnswers(ctx, false);
    ctx.response.status = 200;
    ctx.response.body = { answers };
  },

  /**
   * Overwrite the `Candidate`s answers with the provided ones.
   */
  async overwrite(ctx: StrapiContext) {
    const answers = await setCandidateAnswers(ctx, true);
    ctx.response.status = 200;
    ctx.response.body = { answers };
  }
};

function setCandidateAnswers(
  { params, request }: StrapiContext,
  overwrite = false
): Promise<Record<string, LocalizedAnswer>> {
  const answers = request.body?.data ?? {};
  return setEntityAnswers({
    entityType: 'candidate',
    entityId: params.id,
    answers,
    overwrite
  });
}
