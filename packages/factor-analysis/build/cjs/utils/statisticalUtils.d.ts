import { CategoryInfo } from '../types';
/**
 * Detects the number and type of categories in an ordinal variable
 * @param x Array of ordinal/categorical responses
 * @returns Information about the categories including min, max, count, and if binary
 * @throws Error if variable has only one category
 * @assumes Input values are discrete/ordinal and can be ordered
 */
export declare function detectCategories(x: Array<number>): CategoryInfo;
/**
 * Normalizes categorical data to zero-based consecutive integers
 * @param x Original ordinal/categorical data array
 * @param info Category information from detectCategories
 * @returns Array with normalized values (0 to nCategories-1)
 * @assumes Original categories can be mapped to ordered integers
 */
export declare function normalizeData(x: Array<number>): Array<number>;
/**
 * Calculates bivariate normal cumulative distribution function
 * @param x First standardized value
 * @param y Second standardized value
 * @param rho Correlation parameter (-1 ≤ rho ≤ 1)
 * @returns Probability P(X ≤ x, Y ≤ y) for standard bivariate normal
 * @assumes Values are from standard normal distribution
 * @implementation
 * - Uses tetrachoric series approximation for numerical stability
 * - Handles infinite and perfect correlation cases separately
 * - Employs Hermite polynomial expansion for accuracy
 * @numerical_properties
 * - Accuracy typically better than 1e-15 for |rho| < 0.9999
 * - Stable for inputs up to ±8.5 standard deviations
 * - Adaptive series length based on input magnitude
 */
export declare function bivariateNormalCDF({ x, y, rho }: {
    x: number;
    y: number;
    rho: number;
}): number;
export declare function hermitePolynomial(n: number, x: number): number;
/**
 * Calculates bivariate normal probability and its derivative
 * @param a1 Lower bound for first variable
 * @param a2 Upper bound for first variable
 * @param b1 Lower bound for second variable
 * @param b2 Upper bound for second variable
 * @param rho Correlation parameter
 * @returns Object containing probability and derivative with respect to rho
 * @implementation
 * - Uses rectangle probability method: P(a1 < X ≤ a2, b1 < Y ≤ b2)
 * - Computes numerical derivative using centered difference
 * - Adapts step size for derivative based on correlation magnitude
 * @numerical_properties
 * - Minimum probability clamped to 1e-10 for numerical stability
 * - Derivative computation accurate to approximately 1e-7
 * - Handles near-perfect correlations carefully
 */
export declare function bivariateNormalProbability({ a1, a2, b1, b2, rho }: {
    a1: number;
    a2: number;
    b1: number;
    b2: number;
    rho: number;
}): {
    probability: number;
    derivative: number;
};
//# sourceMappingURL=statisticalUtils.d.ts.map