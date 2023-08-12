export interface CompatibilityScore {
  candidateNumber: number;
  score: number;
  policyTopics?: [{name: string; score: number}];
}
