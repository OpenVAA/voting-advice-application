import { get, readable } from 'svelte/store';
import { logDebugError } from '$lib/utils/logger';
import { parsimoniusDerived } from './parsimoniusDerived';
import { sessionStorageWritable } from '../utils/storageStore';
import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, QuestionCategory } from '@openvaa/data';
import type { Readable } from 'svelte/store';
import type { QuestionOrderer } from '../voter/questionOrderer';
import type { QuestionBlock, QuestionBlocks } from './questionBlockStore.type';

/**
 * Create a derived store containing all `QuestionBlock`s
 */
export function questionBlockStore({
  firstQuestionId = readable(null),
  opinionQuestionCategories,
  selectedQuestionCategoryIds = readable([]),
  selectedElections,
  selectedConstituencies,
  questionOrderer
}: {
  firstQuestionId?: Readable<Id | null>;
  opinionQuestionCategories: Readable<Array<QuestionCategory>>;
  selectedQuestionCategoryIds?: Readable<Array<Id>>;
  selectedElections: Readable<Array<Election>>;
  selectedConstituencies: Readable<Array<Constituency>>;
  questionOrderer: Readable<QuestionOrderer>;
}): Readable<QuestionBlocks> {
  // Store for shown questions
  const shownQuestionIds = sessionStorageWritable<Array<Id>>('voterContext-shownQuestions', []);

  // Cache for question choices (for performance)
  const nextQuestionCache = sessionStorageWritable<{
    lastShownIds: string;
    nextQuestionIds: Array<Id>;
  }>('voterContext-nextQuestionCache', { lastShownIds: '', nextQuestionIds: [] });

  return parsimoniusDerived(
    [
      firstQuestionId,
      opinionQuestionCategories,
      selectedQuestionCategoryIds,
      selectedElections,
      selectedConstituencies,
      shownQuestionIds,
      questionOrderer
    ],
    ([firstId, categories, categoryIds, elections, constituencies, shown, orderer]) => {
      if (categoryIds.length) categories = categories.filter((c) => categoryIds.includes(c.id));
      let blocks = categories
        .map((c) => c.getApplicableQuestions({ elections, constituencies }))
        .filter((c) => c.length > 0);

      // If firstId is defined, we need to do some ordering
      if (firstId) {
        const firstBlock = getByQuestionId(blocks, firstId);
        if (!firstBlock) {
          logDebugError(`Bypassing invalid first question id: ${firstId}.`);
        } else {
          // Move the firstId question first within the first block
          const newFirstBlock = [firstBlock.block.splice(firstBlock.indexInBlock, 1)[0], ...firstBlock.block];
          // Move the block first within all blocks
          blocks.splice(firstBlock.indexOfBlock, 1);
          blocks = [newFirstBlock, ...blocks];
        }
      }

      // Return with wrapped utilities
      return {
        blocks,
        get questions() {
          return blocks.flat();
        },
        shownQuestionIds: shown,
        getByCategory: ({ id }: QuestionCategory) => getByCategoryId(blocks, id),
        getByQuestion: ({ id }: AnyQuestionVariant) => getByQuestionId(blocks, id),
        addShownQuestionId: (id: Id) => {
          shownQuestionIds.update((ids) => {
            if (!ids.includes(id)) {
              return [...ids, id];
            }
            return ids;
          });
        },
        resetShownQuestionIds: () => shownQuestionIds.set([]),
        // Get multiple next question choices
        getNextQuestionChoices: (numSuggestions = 3): Array<AnyQuestionVariant> => {
          const allQuestions = blocks.flat();
          const unshownQuestions = allQuestions.filter((q) => !shown.includes(q.id));
          if (unshownQuestions.length === 0) {
            return [];
          }
          // Check if cache is valid for current shown questions
          const cache = get(nextQuestionCache);
          const shownIdsKey = shown.join(',');
          if (cache.lastShownIds === shownIdsKey && cache.nextQuestionIds.length > 0) {
            // Convert IDs back to question objects
            const cachedQuestions = cache.nextQuestionIds
              .map((id) => allQuestions.find((q) => q.id === id))
              .filter(Boolean) as Array<AnyQuestionVariant>;
            // Only use cache if all questions were found
            if (cachedQuestions.length === cache.nextQuestionIds.length) {
              return cachedQuestions;
            }
          }
          // Get random choices
          const randomChoices = unshownQuestions.sort(() => Math.random() - 0.5).slice(0, numSuggestions);
          let nextChoices: Array<AnyQuestionVariant>;
          // Use question orderer if available
          if (orderer) {
            const suggestions = orderer.getNextQuestions(shown, numSuggestions);
            if (suggestions.length > 0) {
              nextChoices = suggestions;
            } else {
              nextChoices = randomChoices;
            }
          } else {
            nextChoices = randomChoices;
          }
          nextQuestionCache.set({
            lastShownIds: shownIdsKey,
            nextQuestionIds: nextChoices.map((q) => q.id)
          });
          return nextChoices;
        }
      };
    },
    // Default value
    {
      initialValue: {
        blocks: [],
        questions: [],
        shownQuestionIds: [],
        getByCategory: () => undefined,
        getByQuestion: () => undefined,
        addShownQuestionId: () => {},
        resetShownQuestionIds: () => {},
        getNextQuestionChoices: () => []
      }
    }
  );
}

function getByCategoryId(
  blocks: Array<QuestionBlock>,
  categoryId: Id
): { block: QuestionBlock; index: number } | undefined {
  const block = blocks.find((b) => b[0]?.category.id === categoryId);
  if (!block) return undefined;
  return { block, index: blocks.indexOf(block) };
}

function getByQuestionId(
  blocks: Array<QuestionBlock>,
  questionId: Id
): { block: QuestionBlock; index: number; indexInBlock: number; indexOfBlock: number } | undefined {
  const indexOfBlock = blocks.findIndex((b) => b.find((q) => q.id === questionId));
  if (indexOfBlock === -1) return undefined;
  const block = blocks[indexOfBlock];
  const index = blocks.flat().findIndex((q) => q.id === questionId);
  const indexInBlock = block.findIndex((q) => q.id === questionId);
  if (index === -1 || indexInBlock === -1) return undefined;
  return { block, index, indexInBlock, indexOfBlock };
}
