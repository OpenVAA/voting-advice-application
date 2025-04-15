import { UniversalAdminWriter } from '$lib/api/base/universalAdminWriter';
import { strapiAdapterMixin } from '../strapiAdapter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { ComputeFactorLoadingsOptions, GenerateQuestionInfoOptionsData } from '$lib/api/base/adminWriter.type';
import type { DWReturnType } from '$lib/api/base/dataWriter.type';

export class StrapiAdminWriter extends strapiAdapterMixin(UniversalAdminWriter) {
  protected async _generateQuestionInfo(options: GenerateQuestionInfoOptionsData): DWReturnType<DataApiActionResult> {
    const response = await this.apiPost({
      endpoint: 'generateQuestionInfo',
      body: {
        questionIds: options.questionIds
      },
      authToken: options.authToken
    });

    return {
      type: response.type
    };
  }

  protected async _computeFactorLoadings(options?: ComputeFactorLoadingsOptions): DWReturnType<DataApiActionResult> {
    try {
      // If election IDs are provided, compute for each election
      if (options?.electionIds && options.electionIds.length > 0) {
        // For multiple elections, call each one separately
        const results = await Promise.all(
          options.electionIds.map(async (electionId) => {
            try {
              const response = await this.apiPost({
                endpoint: 'computeFactorLoadingsById',
                endpointParams: { id: electionId }
              });
              return response;
            } catch (err) {
              console.error(`Error computing factors for election ${electionId}:`, err);
              return { type: 'failure' };
            }
          })
        );

        // If any computation failed, return failure
        if (results.some((result) => result.type === 'failure')) {
          return { type: 'failure' };
        }
        return { type: 'success' };
      } else {
        // Compute for all elections
        const response = await this.apiPost({
          endpoint: 'computeFactorLoadings'
        });

        return {
          type: response?.type || 'success'
        };
      }
    } catch (error) {
      console.error('Error computing factor loadings:', error);
      return {
        type: 'failure'
      };
    }
  }
}
