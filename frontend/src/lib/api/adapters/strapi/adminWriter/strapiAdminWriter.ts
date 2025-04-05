import { UniversalAdminWriter } from '$lib/api/base/universalAdminFeedbackWriter';
import { strapiAdapterMixin } from '../strapiAdapter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { GenerateQuestionInfoOptionsData } from '$lib/api/base/adminWriter.type';
import type { DWReturnType } from '$lib/api/base/dataWriter.type';

export class StrapiAdminWriter extends strapiAdapterMixin(UniversalAdminWriter) {
  protected async _generateQuestionInfo(data: GenerateQuestionInfoOptionsData): DWReturnType<DataApiActionResult> {
    const { type } = await this.apiPost({
      endpoint: 'generateQuestionInfo',
      body: data
    });

    return {
      type
    };
  }
}
