import { PolychoricOptions, PolychoricResult } from '../types';
/**
 * Performs polychoric correlation estimation using maximum likelihood
 * @param x First ordinal variable array
 * @param y Second ordinal variable array
 * @param options Configuration options for estimation
 * @returns Correlation estimate and computation details
 * @implementation
 * - Step 1: Normalizes and categorizes input data
 * - Step 2: Creates smoothed contingency table
 * - Step 3: Estimates thresholds using normal quantiles
 * - Step 4: Uses Newton-Raphson with stability enhancements
 * @mathematical_background
 * - Based on assumption of underlying bivariate normal distribution
 * - Maximizes likelihood of observed contingency table
 * - Handles special case for binary (2x2) tables using tetrachoric correlation
 * @numerical_properties
 * - Convergence typically within 10-20 iterations for well-behaved data
 * - Uses adaptive step sizes to prevent oscillation
 * - Maintains best solution in case of non-convergence
 * @edge_cases
 * - Perfect correlations detected and handled separately
 * - Small cell frequencies handled via smoothing
 * - Binary variables use specialized tetrachoric estimation
 * @parameters
 * - maxIterations: Maximum number of optimization iterations (default: 100)
 * - tolerance: Convergence criterion for parameter changes (default: 1e-3)
 * - smoothing: Amount of frequency smoothing (default: 0.5)
 * - returnDetails: Whether to return additional computation details
 */
export declare function polychoricCorrelation({ x, y, options }: {
    x: Array<number>;
    y: Array<number>;
    options?: PolychoricOptions;
}): PolychoricResult;
//# sourceMappingURL=correlation.d.ts.map