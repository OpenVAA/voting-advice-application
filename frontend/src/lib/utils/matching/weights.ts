import type { QuestionWeights } from '@openvaa/app-shared';

/**
 * The available question weight configurations.
 */
export const QUESTION_WEIGHTS: Record<QuestionWeights, QuestionWeightConfig> = {
  none: {},
  'half-normal-double': {
    half: 0.5,
    normal: 1,
    double: 2
  }
};

/** A translation `questions.weights.weightLabels` subkey and weight pair */
export type QuestionWeightConfig = Record<string, number>;
