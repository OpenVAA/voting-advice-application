import { derived, get, writable } from 'svelte/store';
import { logDebugError } from '$lib/utils/logger';
import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, QuestionCategory } from '@openvaa/data';
import type { Readable, Writable } from 'svelte/store';
import type { QuestionBlock, QuestionBlocks } from './questionBlockStore.type';

export function questionBlockStore({
  firstQuestionId,
  opinionQuestionCategories,
  selectedQuestionCategoryIds,
  selectedElections,
  selectedConstituencies
}: {
  firstQuestionId: Writable<Id | null>;
  opinionQuestionCategories: Readable<Array<QuestionCategory>>;
  selectedQuestionCategoryIds: Writable<Array<Id>>;
  selectedElections: Readable<Array<Election>>;
  selectedConstituencies: Readable<Array<Constituency>>;
}): Readable<QuestionBlocks> {
  // Store for shown questions
  const shownQuestions = writable<Array<AnyQuestionVariant>>([]);

  return derived(
    [
      firstQuestionId,
      opinionQuestionCategories,
      selectedQuestionCategoryIds,
      selectedElections,
      selectedConstituencies
    ],
    ([firstId, categories, categoryIds, elections, constituencies]) => {
      // Get all questions
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
        shownQuestions: get(shownQuestions),
        getByCategory: ({ id }: QuestionCategory) => getByCategoryId(blocks, id),
        getByQuestion: ({ id }: AnyQuestionVariant) => getByQuestionId(blocks, id),
        addShownQuestion: (question: AnyQuestionVariant) => {
          shownQuestions.update((questions) => {
            if (!questions.find((q) => q.id === question.id)) {
              return [...questions, question];
            }
            return questions;
          });
        }
      };
    },
    {
      blocks: [],
      questions: [],
      shownQuestions: [],
      getByCategory: () => undefined,
      getByQuestion: () => undefined,
      addShownQuestion: () => {}
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
