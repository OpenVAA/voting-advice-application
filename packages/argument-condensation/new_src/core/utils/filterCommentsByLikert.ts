import { VAAComment } from '../types/condensationInput';

/**
 * Filter comments based on Likert values.
 * For each Likert value, randomly selects up to the specified number of comments.
 * @param comments Array of all comments
 * @param likertLimits Array of integers representing max comments per Likert value (index 0 = Likert 1, etc.)
 * @returns Filtered array of comments
 */
export function filterCommentsByLikert(comments: Array<VAAComment>, likertLimits: Array<number>): Array<VAAComment> {
  // Group comments by Likert value
  const commentsByLikert = new Map<number, Array<VAAComment>>();

  for (const comment of comments) {
    const likertValue =
      typeof comment.candidateAnswer === 'number'
        ? comment.candidateAnswer
        : parseInt(comment.candidateAnswer as string);
    if (!commentsByLikert.has(likertValue)) {
      commentsByLikert.set(likertValue, []);
    }
    commentsByLikert.get(likertValue)!.push(comment);
  }

  // Filter comments for each Likert value
  const filteredComments: Array<VAAComment> = [];

  for (const [likertValue, likertComments] of commentsByLikert.entries()) {
    // likertLimits array is 0-indexed, so Likert value 1 is at index 0
    const maxComments = likertLimits[likertValue - 1];
    let selectedComments = likertComments;

    if (maxComments !== undefined && maxComments > 0 && likertComments.length > maxComments) {
      // Randomly shuffle and select the specified number of comments
      const shuffled = [...likertComments].sort(() => Math.random() - 0.5);
      selectedComments = shuffled.slice(0, maxComments);
    } else if (maxComments === 0) {
      // Skip comments with this Likert value
      selectedComments = [];
    }

    filteredComments.push(...selectedComments);
  }

  return filteredComments;
}
