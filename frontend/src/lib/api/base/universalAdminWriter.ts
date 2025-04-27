import { UniversalAdapter } from './universalAdapter';
import type { DataApiActionResult } from './actionResult.type';
import type { AdminWriter, ComputeFactorLoadingsOptions, GenerateQuestionInfoOptionsData } from './adminWriter.type';
import type { DWReturnType } from './dataWriter.type';

/**
 * The abstract base class that all universal `AdminWriter`s should extend. It implements error handling and pre-processing of raw data before it is posted.
 *
 * The subclasses must implement the protected methods. The implementations may freely throw errors.
 */
export abstract class UniversalAdminWriter extends UniversalAdapter implements AdminWriter {
  generateQuestionInfo(data: GenerateQuestionInfoOptionsData): DWReturnType<DataApiActionResult> {
    return this._generateQuestionInfo(data);
  }

  computeFactorLoadings(options?: ComputeFactorLoadingsOptions): DWReturnType<DataApiActionResult> {
    return this._computeFactorLoadings(options);
  }

  protected abstract _generateQuestionInfo(data: GenerateQuestionInfoOptionsData): DWReturnType<DataApiActionResult>;

  protected abstract _computeFactorLoadings(options?: ComputeFactorLoadingsOptions): DWReturnType<DataApiActionResult>;
}
