import { eigs } from 'mathjs';
import { FactorAnalysisOptions, FactorAnalysisResult } from './types';

export class FactorAnalysis {
  /**
   * Performs factor analysis on a correlation matrix
   * @param correlationMatrix Square symmetric matrix of correlations
   * @param numFactors Optional number of factors to extract (auto-determined if not specified)
   * @param options Configuration options for the analysis
   * @returns Factor analysis results including loadings and explained variance
   * @assumes
   * - Input matrix is a valid correlation matrix (symmetric, ones on diagonal)
   * - Variables share common factors (suitable for factor analysis)
   * - Sample size was adequate for stable correlations
   */
  private static readonly DEFAULT_OPTIONS: Required<FactorAnalysisOptions> = {
    maxIterations: 100,
    tolerance: 1e-4,
    rotateFactors: true,
    minEigenvalue: 1e-10,
    regularization: 1e-6
  };

  public static compute({
    correlationMatrix,
    numFactors,
    options
  }: {
    correlationMatrix: Array<Array<number>>;
    numFactors?: number;
    options?: FactorAnalysisOptions;
  }): FactorAnalysisResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    // Validate and prepare correlation matrix
    if (!this.isValidCorrelationMatrix(correlationMatrix)) {
      throw new Error('Invalid correlation matrix');
    }

    const R = this.regularizeMatrix({
      matrix: correlationMatrix,
      epsilon: opts.regularization
    });
    const n = R.length;

    // Determine number of factors if not specified
    const eigenDecomp = this.eigenDecomposition(R);
    const k =
      numFactors ??
      this.determineFactorCount({
        eigenvalues: eigenDecomp.values as Array<number>,
        minEigenvalue: opts.minEigenvalue
      });

    if (k < 1 || k >= n) {
      throw new Error(`Invalid number of factors: ${k}`);
    }

    // Perform ML estimation
    const result = this.maximumLikelihoodEstimation({
      R,
      k,
      options: opts
    });

    // Rotate factors if requested
    const finalLoadings = opts.rotateFactors
      ? this.varimaxRotation(result.loadings)
      : result.loadings;

    // Calculate final statistics
    const communalities = this.calculateCommunalities(finalLoadings);
    const explained = this.calculateExplained({
      loadings: finalLoadings,
      R
    });

    return {
      loadings: finalLoadings,
      uniquenesses: result.uniquenesses,
      communalities,
      explained: explained.factorVariances,
      totalVariance: explained.totalVariance,
      iterations: result.iterations,
      converged: result.converged,
      eigenvalues: eigenDecomp.values.map((v) => Number(v)) // Explicit cast to number[]
    };
  }

  /**
   * Performs maximum likelihood factor analysis estimation
   * @param R Regularized correlation matrix
   * @param k Number of factors to extract
   * @param options Algorithm configuration
   * @returns Factor loadings and uniquenesses
   * @implementation
   * - Uses EM-like algorithm with eigendecomposition
   * - Tracks best solution during iteration
   * - Applies bounds to prevent Heywood cases
   * @mathematical_background
   * - Based on common factor model: R = LL' + U
   * - Maximizes likelihood under normality assumption
   * - Uses reduced correlation approach for stability
   * @numerical_properties
   * - Regularization prevents singular matrices
   * - Bounded uniqueness estimates (0.1 to 0.9)
   * - Adaptive convergence checking
   * @diagnostics
   * - Tracks log-likelihood improvements
   * - Reports convergence status
   * - Provides iteration count
   */
  private static maximumLikelihoodEstimation({
    R,
    k,
    options
  }: {
    R: Array<Array<number>>;
    k: number;
    options: Required<FactorAnalysisOptions>;
  }) {
    const n = R.length;

    let uniquenesses = Array(n).fill(0.2);

    let iterations = 0;
    let converged = false;
    let bestLogLik = -Infinity;
    let bestLoadings: Array<Array<number>> | null = null;
    let bestUnique: Array<number> | null = null;
    let currentLoadings: Array<Array<number>> = [];

    while (iterations < options.maxIterations) {
      const Rred = R.map((row, i) =>
        row.map((val, j) =>
          i === j ? Math.max(0.001, val - uniquenesses[i]) : val
        )
      );

      const { values, vectors } = this.eigenDecomposition(Rred);

      currentLoadings = vectors
        .slice(0, k)
        .map((v, i) => v.map((x) => x * Math.sqrt(Math.abs(values[i]))));

      const modelR = currentLoadings.reduce(
        (acc, f) => {
          return acc.map((row, i) => row.map((val, j) => val + f[i] * f[j]));
        },
        Array(n)
          .fill(0)
          .map(() => Array(n).fill(0))
      );

      const logLik =
        -0.5 *
        R.reduce(
          (sum, row, i) =>
            sum +
            row.reduce(
              (s, val, j) =>
                s + (i === j ? 0 : Math.pow(val - modelR[i][j], 2)),
              0
            ),
          0
        );

      if (logLik > bestLogLik) {
        bestLogLik = logLik;
        bestLoadings = currentLoadings;
        bestUnique = uniquenesses;
      }

      const newUnique = currentLoadings[0].map((_, i) => {
        const h2 = currentLoadings.reduce((sum, f) => sum + f[i] * f[i], 0);
        return Math.max(0.1, Math.min(0.9, 1 - h2));
      });

      const maxDiff = Math.max(
        ...newUnique.map((u, i) => Math.abs(u - uniquenesses[i]))
      );

      if (maxDiff < options.tolerance) {
        converged = true;
        break;
      }

      uniquenesses = newUnique;
      iterations++;
    }

    return {
      loadings: bestLoadings || currentLoadings,
      uniquenesses: bestUnique || uniquenesses,
      iterations,
      converged
    };
  }

  private static initialUniqueness(R: Array<Array<number>>): Array<number> {
    const n = R.length;
    return R.map((row, i) => {
      // Use squared multiple correlation (SMC)
      const others = Array(n)
        .fill(0)
        .map((_, j) => (j !== i ? row[j] * row[j] : 0))
        .reduce((a, b) => a + b, 0);
      const smc = Math.min(Math.max(1 - others, 0.1), 0.9);
      return smc;
    });
  }

  private static calculateLoadings({
    vectors,
    values,
    k
  }: {
    vectors: Array<Array<number>>;
    values: Array<number>;
    k: number;
  }): Array<Array<number>> {
    // First normalize eigenvectors
    const normalizedVectors = vectors.map((vector) => {
      const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
      return vector.map((v) => v / norm);
    });

    const loadings = [];
    for (let i = 0; i < k; i++) {
      const lambda = Math.sqrt(Math.abs(values[i]));
      const loadingVector = normalizedVectors[i].map((v) => v * lambda);

      // Find maximum loading for sign orientation
      const maxAbs = Math.max(...loadingVector.map(Math.abs));
      const sign = Math.sign(
        loadingVector[loadingVector.findIndex((v) => Math.abs(v) === maxAbs)]
      );

      loadings.push(loadingVector.map((v) => v * sign));
    }

    return loadings;
  }

  private static updateUniqueness({
    loadings,
    R
  }: {
    loadings: Array<Array<number>>;
    R: Array<Array<number>>;
  }): Array<number> {
    const n = R.length;
    return Array(n)
      .fill(0)
      .map((_, i) => {
        const communality = loadings.reduce(
          (sum, factor) => sum + factor[i] * factor[i],
          0
        );
        // Adjust bounds to prevent Heywood cases more aggressively
        return Math.max(0.01, Math.min(0.99, 1 - communality));
      });
  }

  /**
   * Performs varimax rotation of factor loadings
   * @param loadings Matrix of unrotated factor loadings [factors × variables]
   * @returns Rotated loading matrix maximizing variance of squared loadings
   * @implementation
   * - Step 1: Kaiser normalization of loadings
   * - Step 2: Iterative pairwise rotation of factors
   * - Step 3: Denormalization and variance-based reordering
   * @mathematical_background
   * - Maximizes sum of variances of squared loadings
   * - Maintains orthogonality between factors
   * - Uses Kaiser normalization to equalize variable weights
   * @numerical_properties
   * - Usually converges in less than 50 iterations
   * - Maintains numerical accuracy to approximately 1e-12
   * - Handles near-zero loadings safely
   * @post_processing
   * - Reorders factors by explained variance
   * - Ensures consistent factor orientation
   * - Preserves orthogonality of solution
   */
  private static varimaxRotation(
    loadings: Array<Array<number>>
  ): Array<Array<number>> {
    const nVars = loadings[0].length;
    const nFactors = loadings.length;

    // Deep copy initial loadings
    let rotated = loadings.map((row) => [...row]);

    // Kaiser normalization
    const h = Array(nVars)
      .fill(0)
      .map((_, i) =>
        Math.sqrt(
          rotated.reduce((sum, factor) => sum + factor[i] * factor[i], 0)
        )
      );

    // Normalize
    const normalized = rotated.map((factor) =>
      factor.map((loading, i) => (h[i] > 1e-10 ? loading / h[i] : 0))
    );

    const maxIter = 1000;
    const tolerance = 1e-12; // Tighter tolerance
    let prevCriterion = -Infinity;

    for (let iter = 0; iter < maxIter; iter++) {
      let criterion = 0;

      // Pairwise rotations
      for (let i = 0; i < nFactors - 1; i++) {
        for (let j = i + 1; j < nFactors; j++) {
          let a = 0,
            b = 0,
            c = 0,
            d = 0;

          for (let k = 0; k < nVars; k++) {
            const x = normalized[i][k];
            const y = normalized[j][k];

            a += x * x * x * x;
            b += y * y * y * y;
            c += x * x * y * y;
            d += x * x * x * y - x * y * y * y;
          }

          criterion += a + b - 2 * c;

          if (Math.abs(d) > 1e-10) {
            const s = 2 * d;
            const cosv = Math.sqrt(0.5 + Math.sqrt(0.25 - (d * d) / (s * s)));
            const sinv = d / (s * cosv);

            for (let k = 0; k < nVars; k++) {
              const x = normalized[i][k];
              const y = normalized[j][k];
              normalized[i][k] = x * cosv + y * sinv;
              normalized[j][k] = -x * sinv + y * cosv;
            }
          }
        }
      }

      if (Math.abs(criterion - prevCriterion) < tolerance) break;
      prevCriterion = criterion;
    }

    // Denormalize and reorder by variance
    rotated = normalized.map((factor) => factor.map((v, i) => v * h[i]));

    // Calculate variances for sorting
    const variances = rotated.map((factor) =>
      factor.reduce((sum, loading) => sum + loading * loading, 0)
    );

    // Sort factors by variance and ensure consistent direction
    const sortedIndices = variances
      .map((_, i) => i)
      .sort((a, b) => variances[b] - variances[a]);

    return sortedIndices.map((i) => {
      const factor = rotated[i];
      const maxLoading = Math.max(...factor.map(Math.abs));
      const maxIndex = factor.findIndex((v) => Math.abs(v) === maxLoading);
      return factor.map((v) => v * Math.sign(factor[maxIndex]));
    });
  }

  private static calculateCommunalities(
    loadings: Array<Array<number>>
  ): Array<number> {
    return loadings[0].map((_, i) =>
      loadings.reduce((sum, factor) => sum + factor[i] * factor[i], 0)
    );
  }

  private static calculateExplained({
    loadings,
    R
  }: {
    loadings: Array<Array<number>>;
    R: Array<Array<number>>;
  }): { factorVariances: Array<number>; totalVariance: number } {
    const totalVariance = R.reduce((sum, row, i) => sum + row[i], 0);

    const factorVariances = loadings.map((factor) => {
      const variance = factor.reduce(
        (sum, loading) => sum + loading * loading,
        0
      );
      return (variance / totalVariance) * 100;
    });

    return {
      factorVariances,
      totalVariance: factorVariances.reduce((sum, v) => sum + v, 0)
    };
  }

  /**
   * Regularizes correlation matrix to ensure positive definiteness
   * @param matrix Input correlation matrix
   * @param epsilon Base regularization parameter
   * @returns Regularized matrix with improved numerical properties
   * @assumes Original matrix is approximately positive definite
   * @note Uses adaptive regularization based on minimum eigenvalue
   */
  private static regularizeMatrix({
    matrix,
    epsilon
  }: {
    matrix: Array<Array<number>>;
    epsilon: number;
  }): Array<Array<number>> {
    const n = matrix.length;
    // Use stronger effect for near-singular matrices
    const minEig = Math.min(...this.eigenDecomposition(matrix).values);
    const adaptiveEpsilon = minEig < 0.1 ? epsilon * 10 : epsilon;

    return matrix.map((row, i) =>
      row.map((val, j) => (i === j ? val + adaptiveEpsilon : val))
    );
  }

  private static isValidCorrelationMatrix(
    matrix: Array<Array<number>>
  ): boolean {
    const n = matrix.length;

    if (!matrix.every((row) => row.length === n)) return false;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        if (i === j && Math.abs(matrix[i][j] - 1) > 1e-10) return false;
        if (Math.abs(matrix[i][j] - matrix[j][i]) > 1e-10) return false;
        if (Math.abs(matrix[i][j]) > 1 + 1e-10) return false;
      }
    }

    return true;
  }

  private static eigenDecomposition(matrix: Array<Array<number>>) {
    try {
      const result = eigs(matrix);

      // Convert values to number array
      const values = Array.isArray(result.values)
        ? result.values.map(Number)
        : [Number(result.values)];

      // Convert vectors to number arrays
      const vectors = result.eigenvectors.map((ev) =>
        Array.isArray(ev.vector) ? ev.vector.map(Number) : [Number(ev.vector)]
      );

      // Sort by absolute eigenvalue magnitude
      const pairs = values.map((value, i) => ({
        value,
        vector: vectors[i]
      }));

      pairs.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

      return {
        values: pairs.map((p) => p.value),
        vectors: pairs.map((p) => p.vector)
      };
    } catch (error) {
      console.error('Eigendecomposition error:', error);
      throw new Error('Failed to compute eigendecomposition');
    }
  }

  private static determineFactorCount({
    eigenvalues,
    minEigenvalue
  }: {
    eigenvalues: Array<number>;
    minEigenvalue: number;
  }): number {
    const significant = eigenvalues.filter((ev) => ev > 1.0).length;
    return Math.max(
      1,
      Math.min(significant, Math.floor(eigenvalues.length / 2))
    );
  }

  private static verifyFactorStructure({
    loadings,
    expectedPattern
  }: {
    loadings: Array<Array<number>>;
    expectedPattern: Array<Array<number>>;
  }): boolean {
    const k = loadings.length;
    const n = loadings[0].length;

    // Try all possible factor permutations
    const permutations = this.getPermutations(k);

    return permutations.some((perm) => {
      const reordered = perm.map((i) => loadings[i]);

      // Check if this permutation matches the expected pattern
      return expectedPattern.every((pattern, factorIdx) =>
        pattern.every((expected, varIdx) => {
          const actual = Math.abs(reordered[factorIdx][varIdx]);
          return expected ? actual > 0.6 : actual < 0.3;
        })
      );
    });
  }

  private static getPermutations(n: number): Array<Array<number>> {
    if (n === 1) return [[0]];
    const perms = [];
    for (let i = 0; i < n; i++) {
      const subPerms = this.getPermutations(n - 1);
      for (const perm of subPerms) {
        perms.push([i, ...perm.map((x) => (x >= i ? x + 1 : x))]);
      }
    }
    return perms;
  }
}
