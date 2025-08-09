import { polychoricCorrelation } from './correlation';

/**
 * Computes matrix of polychoric correlations for multiple ordinal variables
 * @param responses Matrix where each row is a response and each column is a variable
 * @returns Square symmetric matrix of polychoric correlations
 * @assumes
 * - All variables are ordinal
 * - All responses are complete (no missing values)
 * - Variables have at least 2 categories
 * @note Uses parallel computation for upper triangle only
 */
export function computePolychoricMatrix(responses: Array<Array<number>>): Array<Array<number>> {
  if (!responses?.length || !responses[0]?.length) {
    throw new Error('Empty response matrix');
  }
  const nQuestions = responses.length;
  const nResponses = responses[0]?.length;
  const MIN_VALID_PAIRS = 1; // TODO make this configurable. be also wary of UTs

  if (!nResponses) {
    throw new Error('Empty response matrix');
  }

  // Validate input dimensions and data
  for (const row of responses) {
    if (row.length !== nResponses) {
      throw new Error('All response rows must have same length');
    }
    if (row.some((val) => !isNaN(val) && !Number.isInteger(val))) {
      throw new Error('All values must be integers');
    }
  }

  // Initialize correlation matrix with 1's on diagonal
  const matrix = Array.from({ length: nQuestions }, () => Array(nQuestions).fill(1));

  // Compute correlations for upper triangle
  for (let i = 0; i < nQuestions; i++) {
    for (let j = i + 1; j < nQuestions; j++) {
      // Extract columns i and j from responses
      const var1 = [];
      const var2 = [];

      // Single sweep collecting pairs where both values exist
      for (let k = 0; k < nResponses; k++) {
        if (!isNaN(responses[i][k]) && !isNaN(responses[j][k])) {
          var1.push(responses[i][k]);
          var2.push(responses[j][k]);
        }
      }

      if (var1.length < MIN_VALID_PAIRS) {
        matrix[i][j] = matrix[j][i] = NaN;
        continue;
      } // TODO this should probably throw an error

      // Compute polychoric correlation
      const { correlation } = polychoricCorrelation({
        x: var1,
        y: var2,
        options: {
          maxIterations: 100,
          tolerance: 1e-6
        }
      });

      // Fill both upper and lower triangle (symmetric matrix)
      matrix[i][j] = correlation;
      matrix[j][i] = correlation;
    }
  }

  return matrix;
}
