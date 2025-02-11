import { FactorAnalysis } from './factorAnalysis';
import { computePolychoricMatrix } from './polychoric/matrix';
import type {
  CandidateData,
  FactorAnalysisInput,
  FactorAnalysisOutput,
  Question,
  QuestionData,
  QuestionDimension
} from './api.type';

const MIN_VALID_RESPONSES = 30;

/**
 * Prepares question and candidate data for factor analysis
 * This function was moved from transformAnswersForAnalysis
 */
export function prepareDataForAnalysis(
  questions: Array<Question>,
  candidates: Array<CandidateData>
): {
  responses: Array<Array<number>>;
  dimensions: Array<QuestionDimension>;
  uniqueQuestionIds: Array<string>;
} {
  // Get question settings and types
  const questionData: Array<QuestionData> = questions.map((q) => {
    const settings =
      typeof q.questionType?.settings === 'string'
        ? JSON.parse(q.questionType?.settings)
        : q.questionType?.settings || {};
    return {
      id: String(q.id),
      documentId: q.documentId,
      type: settings?.type || '',
      choices: settings?.choices || []
    };
  });

  // Collection of all question dimensions
  const allDimensions: Array<QuestionDimension> = [];

  // Process each question to create dimensions
  questionData.forEach((question) => {
    if (question.type === 'singleChoiceOrdinal') {
      // Single dimension for ordinal questions
      allDimensions.push({
        id: `q_${question.id}`,
        questionId: question.id,
        documentId: question.documentId,
        answers: Array(candidates.length).fill(NaN)
      });
    } else if (question.type === 'singleChoiceCategorical') {
      if (question.choices.length === 2) {
        // Binary categorical questions are single-dimensional
        allDimensions.push({
          id: `q_${question.id}`,
          questionId: question.id,
          documentId: question.documentId,
          answers: Array(candidates.length).fill(NaN)
        });
      } else {
        // Multi-choice categorical questions are multi-dimensional
        question.choices.forEach((choice, idx) => {
          allDimensions.push({
            id: `q_${question.id}_c${idx}`,
            questionId: question.id,
            documentId: question.documentId,
            choiceIndex: idx,
            answers: Array(candidates.length).fill(NaN)
          });
        });
      }
    } else if (question.type === 'multipleChoiceCategorical') {
      // Each choice becomes its own dimension
      question.choices.forEach((choice, idx) => {
        allDimensions.push({
          id: `q_${question.id}_c${idx}`,
          questionId: question.id,
          documentId: question.documentId,
          choiceIndex: idx,
          answers: Array(candidates.length).fill(NaN)
        });
      });
    }
  });

  // Create lookup maps for processing answers
  // Remove the unused dimensionsById variable to fix linting error
  const dimensionsByQuestionId = new Map<string, Array<QuestionDimension>>();
  allDimensions.forEach((d) => {
    if (!dimensionsByQuestionId.has(d.questionId)) {
      dimensionsByQuestionId.set(d.questionId, []);
    }
    dimensionsByQuestionId.get(d.questionId)!.push(d);
  });

  const documentIdToQuestionData = new Map<string, QuestionData>(
    questionData.map((q) => [q.documentId, q])
  );

  // Process candidate answers
  candidates.forEach((candidate, candidateIndex) => {
    if (!candidate.answers) return;

    Object.entries(candidate.answers).forEach(([docId, data]) => {
      // Remove explicit type annotation here
      const question = documentIdToQuestionData.get(docId);
      if (!question) return;

      const dimensions = dimensionsByQuestionId.get(question.id);
      if (!dimensions?.length) return;

      // Process based on question type
      if (
        question.type === 'singleChoiceOrdinal' &&
        data.value &&
        !isNaN(Number(data.value))
      ) {
        dimensions[0].answers[candidateIndex] = Number(data.value);
      } else if (question.type === 'singleChoiceCategorical' && data.value) {
        if (question.choices.length === 2) {
          // Binary case
          const value = question.choices[0].id === data.value ? 0 : 1;
          dimensions[0].answers[candidateIndex] = value;
        } else {
          // Multi-choice case
          const selectedIndex = question.choices.findIndex(
            (c) => c.id === data.value
          );
          dimensions.forEach((dim, idx) => {
            dim.answers[candidateIndex] = idx === selectedIndex ? 1 : 0;
          });
        }
      } else if (
        question.type === 'multipleChoiceCategorical' &&
        Array.isArray(data.value)
      ) {
        // Set each dimension based on whether it was selected
        dimensions.forEach((dim) => {
          if (dim.choiceIndex !== undefined) {
            const choiceIdx = dim.choiceIndex;
            const choiceId = question.choices[choiceIdx]?.id;
            // Add type check to ensure data.value is an array
            if (Array.isArray(data.value)) {
              dim.answers[candidateIndex] = data.value.includes(choiceId)
                ? 1
                : 0;
            }
          }
        });
      }
    });
  });

  // Filter for dimensions with sufficient valid responses
  const validDimensions = allDimensions.filter(
    (dim) => dim.answers.filter((v) => !isNaN(v)).length >= MIN_VALID_RESPONSES
  );

  if (validDimensions.length === 0) {
    throw new Error(
      `No questions had sufficient valid responses (minimum ${MIN_VALID_RESPONSES})`
    );
  }

  // Sort for consistent ordering
  validDimensions.sort((a, b) => a.id.localeCompare(b.id));

  return {
    responses: validDimensions.map((d) => d.answers),
    dimensions: validDimensions,
    uniqueQuestionIds: [...new Set(validDimensions.map((d) => d.documentId))]
  };
}

/**
 * Performs factor analysis on questionnaire responses
 */
export function analyzeFactors(
  input: FactorAnalysisInput
): FactorAnalysisOutput {
  // Validate input
  if (!input.responses?.length) {
    throw new Error('Empty response matrix');
  }
  for (const questionResponses of input.responses) {
    if (!questionResponses?.length) {
      throw new Error('Empty response array');
    }
    // Check that we have at least some valid responses
    const validCount = questionResponses.filter(
      (r) => typeof r === 'number' && !Number.isNaN(r)
    ).length;
    if (validCount === 0) {
      throw new Error('No valid responses for question');
    }
  }

  // Compute polychoric correlation matrix
  const correlationMatrix = computePolychoricMatrix(input.responses);

  // Perform factor analysis
  const { loadings, explained, totalVariance, communalities, converged } =
    FactorAnalysis.compute({
      correlationMatrix,
      numFactors: input.numFactors,
      options: input.options
    });

  // Transform the loadings matrix to be [questions × factors]
  const questionFactorLoadings = loadings[0].map((_, questionIndex) =>
    loadings.map((factor) => factor[questionIndex])
  );

  return {
    questionFactorLoadings,
    explainedVariancePerFactor: explained,
    totalExplainedVariance: totalVariance,
    communalities: communalities,
    converged: converged
  };
}

/**
 * Process analysis results for storage
 */
export function processAnalysisResults(
  result: FactorAnalysisOutput,
  dimensions: Array<QuestionDimension>,
  uniqueQuestionIds: Array<string>,
  electionId: number
): {
  election: number;
  results: {
    questionFactorLoadings: Array<{
      questionId: string;
      factors: Array<number>;
    }>;
    explainedVariancePerFactor: Array<number>;
    totalExplainedVariance: number;
  };
  metadata: {
    timestamp: string;
    numberOfQuestions: number;
    numberOfDimensions: number;
    numberOfResponses: number;
    converged: boolean;
  };
} {
  // Group factor loadings by question document ID
  const loadingsByQuestionId = uniqueQuestionIds.map((documentId) => {
    // Find all dimensions for this question
    const questionDimensions = dimensions.filter(
      (d) => d.documentId === documentId
    );
    // Get factor loadings for each dimension
    const dimensionLoadings = questionDimensions.map((dim) => {
      const dimIndex = dimensions.findIndex((d) => d.id === dim.id);
      return result.questionFactorLoadings[dimIndex];
    });

    // Aggregate loadings - for multi-dimensional questions, use max absolute values
    const numFactors = dimensionLoadings[0]?.length || 0;
    const aggregatedFactors = Array(numFactors).fill(0);

    for (let factorIdx = 0; factorIdx < numFactors; factorIdx++) {
      // Find max absolute loading for this factor across all dimensions
      let maxAbsLoading = 0;
      let maxLoadingValue = 0;

      dimensionLoadings.forEach((loadings) => {
        const absValue = Math.abs(loadings[factorIdx]);
        if (absValue > maxAbsLoading) {
          maxAbsLoading = absValue;
          maxLoadingValue = loadings[factorIdx];
        }
      });

      aggregatedFactors[factorIdx] = maxLoadingValue;
    }

    return {
      questionId: documentId, // Use documentId for frontend compatibility
      factors: aggregatedFactors
    };
  });

  return {
    election: electionId,
    results: {
      questionFactorLoadings: loadingsByQuestionId,
      explainedVariancePerFactor: result.explainedVariancePerFactor,
      totalExplainedVariance: result.totalExplainedVariance
    },
    metadata: {
      timestamp: new Date().toISOString(),
      numberOfQuestions: uniqueQuestionIds.length,
      numberOfDimensions: dimensions.length,
      numberOfResponses: dimensions[0]?.answers.length || 0,
      converged: result.converged
    }
  };
}
