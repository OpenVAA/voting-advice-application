import { UniversalAdminWriter } from '$lib/api/base/universalAdminFeedbackWriter';
import { strapiAdapterMixin } from '../strapiAdapter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { GenerateQuestionInfoOptionsData } from '$lib/api/base/adminWriter.type';
import type { DWReturnType } from '$lib/api/base/dataWriter.type';

export class StrapiAdminWriter extends strapiAdapterMixin(UniversalAdminWriter) {
  protected async _generateQuestionInfo(data: GenerateQuestionInfoOptionsData): DWReturnType<DataApiActionResult> {
    const response = await this.apiPost({
      endpoint: 'generateQuestionInfo',
      body: data
    });

    return {
      type: response.type
    };
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
