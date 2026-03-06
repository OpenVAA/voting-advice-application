import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import type { CandidateStatsResult } from 'src/services/candidateStats.type';

export default function controller({ strapi }: { strapi: Core.Strapi }) {
  return {
    getStats: async (ctx: Context) => {
      try {
        const result: CandidateStatsResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('candidateStats')
          .getStats();

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('candidateStats.getStats controller error', error);
        return ctx.internalServerError('An error occurred while fetching candidate statistics');
      }
    },
  };
}
