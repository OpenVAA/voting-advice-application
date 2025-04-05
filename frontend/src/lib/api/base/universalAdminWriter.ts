import { UniversalAdapter } from './universalAdapter';
import type { DataApiActionResult } from './actionResult.type';
import type { AdminWriter, GenerateQuestionInfoOptionsData } from './adminWriter.type';
import type { DWReturnType } from './dataWriter.type';

/**
 * The abstract base class that all universal `AdminWriter`s should extend. It implements error handling and pre-processing of raw data before it is posted.
 *
 * The subclasses must implement the protected `_postAdmin` method. The implementation may freely throw errors.
 */
export abstract class UniversalAdminWriter extends UniversalAdapter implements AdminWriter {
  generateQuestionInfo(data: GenerateQuestionInfoOptionsData): DWReturnType<DataApiActionResult> {
    return this._generateQuestionInfo(data);
  }

  protected abstract _generateQuestionInfo(data: GenerateQuestionInfoOptionsData): DWReturnType<DataApiActionResult>;
}
