import type { AnyQuestionVariant, Id } from '@openvaa/data';
import type {
  FactorLoadingData,
  QuestionFactorLoading
} from './factorLoading.type';

export class FactorLoading {
  readonly data: FactorLoadingData;

  // This will be set when we create the class
  private getQuestionFunc: (id: Id) => AnyQuestionVariant;

  constructor(
    data: FactorLoadingData,
    getQuestion: (id: Id) => AnyQuestionVariant
  ) {
    this.data = data;
    this.getQuestionFunc = getQuestion;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Property getters
  //////////////////////////////////////////////////////////////////////////////

  get electionId(): Id {
    return this.data.electionId;
  }

  get metadata(): FactorLoadingData['metadata'] {
    return this.data.metadata;
  }

  get questionFactorLoadings(): FactorLoadingData['questionFactorLoadings'] {
    return this.data.questionFactorLoadings;
  }

  get timestamp(): Date {
    return new Date(this.data.metadata.timestamp);
  }

  get numberOfQuestions(): number {
    return this.data.metadata.numberOfQuestions;
  }

  get numberOfResponses(): number {
    return this.data.metadata.numberOfResponses;
  }

  get converged(): boolean {
    return this.data.metadata.converged;
  }

  get explainedVariancePerFactor(): Array<number> {
    return this.data.explainedVariancePerFactor;
  }

  get totalExplainedVariance(): number {
    return this.data.totalExplainedVariance;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Methods
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get factor loadings for a specific question
   */
  getFactorsForQuestion(questionId: Id): Array<number> | undefined {
    return this.data.questionFactorLoadings.find(
      (loading: QuestionFactorLoading) => loading.questionId === questionId
    )?.factors;
  }

  /**
   * Get questions ordered by their loading on a specific factor
   */
  getQuestionsOrderedByFactor(factorIndex: number): Array<AnyQuestionVariant> {
    return this.data.questionFactorLoadings
      .slice()
      .sort(
        (a, b) =>
          Math.abs(b.factors[factorIndex]) - Math.abs(a.factors[factorIndex])
      )
      .map((loading: QuestionFactorLoading) =>
        this.getQuestionFunc(loading.questionId)
      );
  }

  /**
   * Get the highest loading questions for a factor
   */
  getTopQuestionsForFactor(
    factorIndex: number,
    count: number = 5
  ): Array<AnyQuestionVariant> {
    return this.getQuestionsOrderedByFactor(factorIndex).slice(0, count);
  }
}
