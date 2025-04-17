/**
 * Computes the standard normal quantile (inverse cumulative distribution function)
 * @param p Probability value between 0 and 1
 * @returns Corresponding z-score from standard normal distribution
 * @assumes Input probability is valid (0 ≤ p ≤ 1)
 * @note Uses numerical approximation for improved accuracy at extreme values
 */
export declare function standardNormalQuantile(p: number): number;
export declare function standardNormalPDF(x: number): number;
export declare function standardNormalCDF(x: number): number;
//# sourceMappingURL=normalDistribution.d.ts.map