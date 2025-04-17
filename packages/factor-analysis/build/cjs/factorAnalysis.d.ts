import { FactorAnalysisOptions, FactorAnalysisResult } from './types';
export declare class FactorAnalysis {
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
    private static readonly DEFAULT_OPTIONS;
    static compute({ correlationMatrix, numFactors, options }: {
        correlationMatrix: Array<Array<number>>;
        numFactors?: number;
        options?: FactorAnalysisOptions;
    }): FactorAnalysisResult;
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
    private static maximumLikelihoodEstimation;
    private static initialUniqueness;
    private static calculateLoadings;
    private static updateUniqueness;
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
    private static varimaxRotation;
    private static calculateCommunalities;
    private static calculateExplained;
    /**
     * Regularizes correlation matrix to ensure positive definiteness
     * @param matrix Input correlation matrix
     * @param epsilon Base regularization parameter
     * @returns Regularized matrix with improved numerical properties
     * @assumes Original matrix is approximately positive definite
     * @note Uses adaptive regularization based on minimum eigenvalue
     */
    private static regularizeMatrix;
    private static isValidCorrelationMatrix;
    private static eigenDecomposition;
    private static determineFactorCount;
    private static verifyFactorStructure;
    private static getPermutations;
}
//# sourceMappingURL=factorAnalysis.d.ts.map