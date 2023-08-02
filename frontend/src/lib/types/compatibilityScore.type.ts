export interface CompatibilityScore {
  candidateId: number;
  score: number;
  policyTopics?: [{name: string; score: number}];
}
