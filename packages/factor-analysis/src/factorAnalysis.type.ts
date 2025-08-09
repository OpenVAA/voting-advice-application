/** Configuration options for factor analysis computation */
export interface FactorAnalysisOptions {
  /** Maximum number of iterations (default: 100) */
  maxIterations?: number;
  /** Convergence criterion (default: 1e-4) */
  tolerance?: number;
  /** Whether to apply varimax rotation (default: true) */
  rotateFactors?: boolean;
  /** Minimum eigenvalue for factor extraction (default: 1e-10) */
  minEigenvalue?: number;
  /** Matrix regularization parameter (default: 1e-6) */
  regularization?: number;
}

/** Results from factor analysis computation */
export interface FactorAnalysisResult {
  /** Factor loadings matrix */
  loadings: Array<Array<number>>;
  /** Uniqueness values per variable */
  uniquenesses: Array<number>;
  /** Communality values per variable */
  communalities: Array<number>;
  /** Explained variance per factor */
  explained: Array<number>;
  /** Total explained variance */
  totalVariance: number;
  /** Number of iterations performed */
  iterations?: number;
  /** Whether the algorithm converged */
  converged: boolean;
  /** Eigenvalues of correlation matrix */
  eigenvalues?: Array<number>;
}
