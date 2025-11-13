/**
 * Allocate minimum number of segments to return per topic
 *
 * Simple strategy: divide total available segments equally among topics
 * with a minimum of 2 segments per topic (unless total is too small)
 *
 * @param topics - Array of topic names
 * @param nResultsTarget - Total number of segments to return
 * @returns Object mapping topic names to minimum segments to retrieve
 *
 * @example
 * ```typescript
 * allocateSegmentsPerTopic(['policy', 'background', 'record'], 10)
 * // Returns: { 'policy': 3, 'background': 3, 'record': 4 } (equal distribution with remainder)
 * ```
 */
export function allocateSegmentsPerTopic(
  topics: Array<string>,
  nResultsTarget: number
): Record<string, number> {
  if (topics.length === 0) {
    return {};
  }

  // Simple equal distribution
  const baseAllocation = Math.floor(nResultsTarget / topics.length);
  const remainder = nResultsTarget % topics.length;

  const allocation: Record<string, number> = {};

  topics.forEach((topic, i) => {
    // Distribute remainder to first topics
    allocation[topic] = baseAllocation + (i < remainder ? 1 : 0);
  });

  return allocation;
}