/**
 * Analytics from a golden dataset run. Compares the results to previous ones. 
 * 
 * @property currentScore - The current score of the model.
 * @property last5Average - The average score of the last 5 batch runs.
 * @property globalAverage - The average score of all batch runs.
 * @property bestScore - The best score of all batch runs.
 * @property testCaseScores - The scores of the test cases.
 */
export interface PerformanceAnalyticsResult {
  currentScore: number;
  last5Average: number;
  globalAverage: number;
  bestScore: number;
  testCaseScores: { testCaseId: string; score: number }[];
}