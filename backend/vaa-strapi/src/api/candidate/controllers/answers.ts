import { StrapiContext } from '../../../../types/customStrapiTypes';
import { EntityData } from '../../../../types/entities';
import { setEntityProperties } from '../../../util/setEntityProperties';

export default {
  /**
   * Update the `Candidate`s answers by merging the provided answers with the existing ones.
   */
  async update(ctx: StrapiContext) {
    const data = await setCandidateAnswers(ctx, false);
    ctx.response.status = 200;
    ctx.response.body = { data };
  },

  /**
   * Overwrite the `Candidate`s answers with the provided ones.
   */
  async overwrite(ctx: StrapiContext) {
    const data = await setCandidateAnswers(ctx, true);
    ctx.response.status = 200;
    ctx.response.body = { data };
  }
};

function setCandidateAnswers({ params, request }: StrapiContext, overwrite = false): Promise<EntityData<'candidate'>> {
  const answers = request.body?.data;
  if (!answers || typeof answers !== 'object') throw new Error('[setCandidateAnswers] Invalid answers provided.');
  return setEntityProperties({
    entityType: 'candidate',
    entityId: params.id,
    properties: { answers },
    options: {
      overwriteAnswers: overwrite
    }
  });
}
