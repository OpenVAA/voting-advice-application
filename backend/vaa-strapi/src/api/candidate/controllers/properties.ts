import { error } from '../../../util/logger';
import { setEntityProperties } from '../../../util/setEntityProperties';
import type { StrapiContext } from '../../../../types/customStrapiTypes';
import type { EntityData } from '../../../../types/entities';

export default {
  /**
   * Update the `Candidate`s editable properties:
   * - image
   * - termsOfUseAccepted
   */
  async update(ctx: StrapiContext) {
    const data = await setCandidateProperties(ctx);
    ctx.response.status = 200;
    ctx.response.body = { data };
  }
};

function setCandidateProperties({ params, request }: StrapiContext): Promise<EntityData<'candidate'>> {
  const { image, termsOfUseAccepted } = request.body?.data ?? {};
  if (image === undefined && termsOfUseAccepted === undefined) error('No properties provided.');
  if (image !== undefined && !(image === null || typeof image === 'string'))
    error(`[setCandidateProperties] Invalid image provided: ${image}.`);
  if (termsOfUseAccepted !== undefined && isNaN(Date.parse(termsOfUseAccepted)))
    error(`[setCandidateProperties] Invalid termsOfUseAccepted provided: ${termsOfUseAccepted}.`);
  return setEntityProperties({
    entityType: 'candidate',
    entityId: params.id,
    properties: { image, termsOfUseAccepted }
  });
}
