"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.standardNormalQuantile = standardNormalQuantile;
exports.standardNormalPDF = standardNormalPDF;
exports.standardNormalCDF = standardNormalCDF;
const mathjs_1 = require("mathjs");
/**
 * Computes the standard normal quantile (inverse cumulative distribution function)
 * @param p Probability value between 0 and 1
 * @returns Corresponding z-score from standard normal distribution
 * @assumes Input probability is valid (0 ≤ p ≤ 1)
 * @note Uses numerical approximation for improved accuracy at extreme values
 */
function standardNormalQuantile(p) {
    if (p <= 0)
        return -Infinity;
    if (p >= 1)
        return Infinity;
    if (p === 0.5)
        return 0;
    // Improved handling of extreme probabilities
    const pClamp = Math.max(1e-10, Math.min(1 - 1e-10, p));
    const q = pClamp - 0.5;
    if (Math.abs(q) <= 0.425) {
        const a = [
            2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637
        ];
        const b = [
            -8.4735109309, 23.08336743743, -21.06224101826, 3.13082909833
        ];
        let num = a[0];
        let den = 1;
        for (let i = 1; i < 4; i++) {
            num = num * q + a[i];
            den = den * q + b[i];
        }
        return (q * num) / den;
    }
    const r = pClamp < 0.5
        ? Math.sqrt(-Math.log(pClamp))
        : Math.sqrt(-Math.log(1 - pClamp));
    let num = 0.3374754822726147;
    for (const coef of [
        0.9761690190917186, 0.1607979714918209, 0.0276438810333863
    ]) {
        num = num * r + coef;
    }
    return ((pClamp < 0.5 ? -1 : 1) * num) / r;
}
function standardNormalPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}
function standardNormalCDF(x) {
    if (!isFinite(x))
        return x > 0 ? 1 : 0;
    return 0.5 * (1 + (0, mathjs_1.erf)(x / Math.sqrt(2)));
}
