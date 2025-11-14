import type { EnrichedSearchResult } from '../vectorStore.type';

/**
 * Result from deduplication: final segments to return
 */
export interface DeduplicatedResults {
  /** Final deduplicated segments in priority order */
  results: Array<EnrichedSearchResult>;
  /** How many segments were allocated per topic */
  topicAllocations: Record<string, number>;
  /** Which topics each segment was found in */
  segmentTopics: Map<string, Array<string>>;
}

/**
 * Deduplicate and select final results from per-topic reranked results
 *
 * Strategy:
 * 1. For each topic, take top N results (from minSegmentsPerTopic config)
 * 2. Track which segments appear in multiple topics
 * 3. If a segment appears in multiple topics, count it towards all but only include once
 * 4. Keep adding segments until we satisfy minimum requirements for all topics
 * 5. Stop when we reach nResultsTarget
 *
 * @param rerankedResultsPerTopic - Map of topic to its reranked results (sorted by rerank score)
 * @param minSegmentsPerTopic - Minimum segments to include per topic
 * @param nResultsTarget - Maximum total segments to return
 * @returns Deduplicated results ready to return
 */
export function deduplicateAndSelectResults(
  rerankedResultsPerTopic: Record<string, Array<EnrichedSearchResult>>,
  minSegmentsPerTopic: Record<string, number>,
  nResultsTarget: number
): DeduplicatedResults {
  const topics = Object.keys(rerankedResultsPerTopic);

  // Track which segments we've added and which topics they satisfy
  const addedSegments = new Map<string, EnrichedSearchResult>();
  const segmentTopics = new Map<string, Array<string>>();
  const topicCounts = new Map<string, number>();

  // Initialize topic counts
  for (const topic of topics) {
    topicCounts.set(topic, 0);
  }

  // Track current position in each topic's result list
  const topicIndices = new Map<string, number>();
  for (const topic of topics) {
    topicIndices.set(topic, 0);
  }

  // Greedy selection: keep adding segments until all topics meet minimum requirements
  let totalAdded = 0;

  while (totalAdded < nResultsTarget) {
    // Find which topic needs more segments most urgently
    let selectedTopic: string | null = null;
    let maxDeficit = -1;

    for (const topic of topics) {
      const currentCount = topicCounts.get(topic) || 0;
      const required = minSegmentsPerTopic[topic] || 0;
      const deficit = required - currentCount;

      if (deficit > maxDeficit && topicIndices.get(topic)! < rerankedResultsPerTopic[topic].length) {
        maxDeficit = deficit;
        selectedTopic = topic;
      }
    }

    // If no topic needs more segments, we're done
    if (selectedTopic === null || maxDeficit <= 0) {
      break;
    }

    // Get next segment from selected topic
    const topicResults = rerankedResultsPerTopic[selectedTopic];
    const currentIndex = topicIndices.get(selectedTopic)!;

    if (currentIndex >= topicResults.length) {
      // No more results for this topic, skip
      topicIndices.set(selectedTopic, currentIndex + 1);
      continue;
    }

    const segment = topicResults[currentIndex];
    const segmentId = segment.segment.id;

    // Move to next result for this topic
    topicIndices.set(selectedTopic, currentIndex + 1);

    // Check if we've already added this segment
    if (addedSegments.has(segmentId)) {
      // Segment already added - just update topic tracking
      const existingTopics = segmentTopics.get(segmentId)!;
      if (!existingTopics.includes(selectedTopic)) {
        existingTopics.push(selectedTopic);
        topicCounts.set(selectedTopic, (topicCounts.get(selectedTopic) || 0) + 1);
      }
    } else {
      // New segment - add it
      addedSegments.set(segmentId, segment);
      segmentTopics.set(segmentId, [selectedTopic]);
      topicCounts.set(selectedTopic, (topicCounts.get(selectedTopic) || 0) + 1);
      totalAdded++;
    }
  }

  // Convert to array, maintaining rerank score ordering
  const results = Array.from(addedSegments.values()).sort(
    (a, b) => (b.rerankScore ?? b.vectorSearchScore) - (a.rerankScore ?? a.vectorSearchScore)
  );

  return {
    results,
    topicAllocations: Object.fromEntries(topicCounts),
    segmentTopics
  };
}