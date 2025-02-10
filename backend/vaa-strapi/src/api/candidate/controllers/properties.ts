import { StrapiContext } from '../../../../types/customStrapiTypes';
import { EntityData } from '../../../../types/entities';
import { error } from '../../../util/logger';
import { setEntityProperties } from '../../../util/setEntityProperties';

export default {
  /**
   * Update the `Candidate`s editable properties.
   */
  async update(ctx: StrapiContext) {
    const data = await setCandidateProperties(ctx);
    ctx.response.status = 200;
    ctx.response.body = { data };
  }
};

function setCandidateProperties({ params, request }: StrapiContext): Promise<EntityData<'candidate'>> {
  const image = request.body?.data?.image;
  if (image === undefined || !(image === null || typeof image === 'string'))
    error(`[setCandidateProperties] Invalid image provided: ${image}.`);
  return setEntityProperties({
    entityType: 'candidate',
    entityId: params.id,
    properties: { image }
  });
}
