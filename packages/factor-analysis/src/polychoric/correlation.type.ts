/** Information about categorical variable */
export interface CategoryInfo {
  /** Minimum category value */
  min: number;
  /** Maximum category value */
  max: number;
  /** Number of distinct categories */
  nCategories: number;
  /** Whether variable is binary (2 categories) */
  isBinary: boolean;
}

/** Configuration options for polychoric correlation */
export interface PolychoricOptions {
  /** Maximum number of iterations */
  maxIterations?: number;
  /** Convergence tolerance */
  tolerance?: number;
  /** Smoothing parameter */
  smoothing?: number;
  /** Whether to return computation details */
  returnDetails?: boolean;
}

/** Result of polychoric correlation computation */
export interface PolychoricResult {
  /** Estimated correlation */
  correlation: number;
  /** Standard error of estimate */
  standardError?: number;
  /** Number of iterations performed */
  iterations?: number;
  /** Whether algorithm converged */
  converged?: boolean;
}
