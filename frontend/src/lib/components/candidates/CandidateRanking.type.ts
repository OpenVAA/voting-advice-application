/**
 * These conform to `vaa-matching.Match`
 */
export interface RankingProps {
  // distance: number;
  // entity: {
  //   id: string;
  // }
  score: number;
  subMatches?: {
    // distance: number;
    score: number;
    questionGroup: {
      label?: string;
    };
  }[];
}
