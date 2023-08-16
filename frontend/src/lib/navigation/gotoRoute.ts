/*
 * A utility to build routes urls.
 *
 * TO DO: Reduce redundancy.
 * TO DO: Separate url building into another function so that we can
 * use it in server.ts redirects.
 */

import {goto} from '$app/navigation';
import type {Id} from '$lib/vaa-data';

export enum PageType {
  FrontPage,
  SelectElections,
  SelectConstituencies,
  SelectQuestionCategories,
  ShowQuestion,
  ShowResults,
  ShowCandidate
}

export type GotoRouteParams = {
  page: PageType;
  electionIds?: Id | Id[] | undefined;
  constituencyIds?: Id | Id[] | undefined;
  questionCategoryIds?: Id | Id[] | undefined;
  questionId?: Id;
  candidateId?: Id;
  currentUrl?: string;
};

export function gotoRoute({
  page,
  electionIds,
  constituencyIds,
  questionCategoryIds,
  questionId,
  candidateId,
  currentUrl
}: GotoRouteParams) {
  let url = '/';
  if (page === PageType.FrontPage) {
    url += '';
  } else if (page === PageType.SelectElections) {
    url += 'elections';
  } else if (page === PageType.SelectConstituencies) {
    url += `elections/${combineIds(electionIds)}/constituencies`;
  } else if (page === PageType.SelectQuestionCategories) {
    const eidsString = electionIds
      ? combineIds(electionIds)
      : extractIdsString('elections', currentUrl);
    const cidsString = constituencyIds
      ? combineIds(constituencyIds)
      : extractIdsString('constituencies', currentUrl);
    url += `elections/${eidsString}/constituencies/${cidsString}/questions`;
  } else if (page === PageType.ShowQuestion) {
    const eidsString = electionIds
      ? combineIds(electionIds)
      : extractIdsString('elections', currentUrl);
    const cidsString = constituencyIds
      ? combineIds(constituencyIds)
      : extractIdsString('constituencies', currentUrl);
    const qcidsString = questionCategoryIds
      ? combineIds(questionCategoryIds)
      : extractIdsString('questions', currentUrl);
    if (questionId == undefined || questionId == '') {
      throw new Error('This route must have a questionId');
    }
    url += `elections/${eidsString}/constituencies/${cidsString}/questions/${qcidsString}/question/${questionId}`;
  }
  goto(url);
}

function extractIdsString(after: string, url = '', throwOnEmpty = true): string {
  const match = url.match(new RegExp(`(?<=/${after}/)[^/]+`));
  if (!match && throwOnEmpty) {
    throw new Error('This route must have ids');
  }
  return match ? match[0] : '';
}

function combineIds(ids: Id | Id[] | undefined, throwOnEmpty = true) {
  if (ids == null || ids.length === 0) {
    if (throwOnEmpty) {
      throw new Error('This route must have ids');
    }
    return '';
  }
  if (Array.isArray(ids)) {
    return ids.join(',');
  }
  return ids;
}
