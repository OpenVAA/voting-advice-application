# @openvaa/factor-analysis

Factor analysis implementation for the OpenVAA project, including polychoric correlation computation.

## Installation

```bash
yarn add @openvaa/factor-analysis
```

## Data Format

The package expects questionnaire data in the following format:

```typescript
const responses = [
  [4, 2, 5, 1, 3], // All responses to question 1
  [3, 4, 1, 2, 5], // All responses to question 2
  [1, 5, 3, 4, 2]  // All responses to question 3
];
// responses[questionIndex][responseIndex]
// Shape: [nQuestions × nResponses]
```

Important notes:
- Each row represents all responses to one question
- Each column represents one respondent's answers
- All rows must have the same length (same number of responses)
- Values should be integers representing ordinal categories (e.g., 1-5)


## Usage

```typescript
import { analyzeFactors } from '@openvaa/factor-analysis';

const analysis = analyzeFactors({
  responses: questionsXresponses, // [questions × responses] matrix
  numFactors: 2,                 // Optional: auto-determined if not specified
  options: {
    rotateFactors: true,
    maxIterations: 100,
    tolerance: 1e-4
  }
});

console.info(analysis.questionFactorLoadings);    // Factor loadings per question
console.info(analysis.explainedVariancePerFactor); // Variance explained by each factor
console.info(analysis.totalExplainedVariance);     // Total explained variance
```

## Performance Considerations

- Performance scales primarily with number of questions, not responses
- Efficiently handles large response counts (tested up to 5000+ responses)
- Memory usage is O(nQuestions²) for correlation matrix
- Computation time is O(nQuestions²) for pairwise correlations

## Configuration Options

```typescript
interface FactorAnalysisOptions {
  maxIterations?: number;   // Maximum iterations (default: 100)
  tolerance?: number;       // Convergence criterion (default: 1e-4)
  rotateFactors?: boolean;  // Apply varimax rotation (default: true)
  minEigenvalue?: number;   // Minimum eigenvalue for factor extraction (default: 1e-10)
  regularization?: number;  // Matrix regularization parameter (default: 1e-6)
}
