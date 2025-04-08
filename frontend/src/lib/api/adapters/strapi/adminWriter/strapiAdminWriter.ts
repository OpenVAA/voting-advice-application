import { UniversalAdminWriter } from '$lib/api/base/universalAdminWriter';
import { strapiAdapterMixin } from '../strapiAdapter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { GenerateQuestionInfoOptionsData } from '$lib/api/base/adminWriter.type';
import type { DWReturnType } from '$lib/api/base/dataWriter.type';

export class StrapiAdminWriter extends strapiAdapterMixin(UniversalAdminWriter) {
  protected async _generateQuestionInfo({
    questionIds,
    authToken
  }: GenerateQuestionInfoOptionsData): DWReturnType<DataApiActionResult> {
    const { type } = await this.apiPost({
      endpoint: 'generateQuestionInfo',
      body: {
        questionIds
      },
      authToken
    });
    return { type };
  }

  protected async _computeFactorLoadings(): DWReturnType<DataApiActionResult> {
    try {
      const response = await this.apiPost({
        endpoint: 'computeFactorLoadings'
      });

      return {
        type: response?.type || 'success'
      };
    } catch (error) {
      console.error('Error computing factor loadings:', error);
      return {
        type: 'failure'
      };
    }
  }
}
