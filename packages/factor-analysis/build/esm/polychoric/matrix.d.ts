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
export declare function computePolychoricMatrix(responses: Array<Array<number>>): Array<Array<number>>;
//# sourceMappingURL=matrix.d.ts.map