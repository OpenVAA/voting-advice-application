/*
 * A utility to build routes urls.
 *
 * TO DO: Use createRoute in server.ts redirects.
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
  ShowPerson
}

export type GotoRouteParams = {
  page: PageType;
  electionIds?: Id | Id[] | undefined;
  constituencyIds?: Id | Id[] | undefined;
  questionCategoryIds?: Id | Id[] | undefined;
  questionId?: Id;
  personNominationId?: Id;
  currentUrl?: string;
};

export function gotoRoute(params: GotoRouteParams) {
  goto(createRoute(params));
}

export function createRoute({
  page,
  electionIds,
  constituencyIds,
  questionCategoryIds,
  questionId,
  personNominationId,
  currentUrl
}: GotoRouteParams): string {
  let url = '/';
  if (page === PageType.FrontPage) return url;

  url += 'elections';
  if (page === PageType.SelectElections) return url;

  const eidsString = electionIds
    ? combineIds(electionIds)
    : extractIdsString('elections', currentUrl);
  url += `/${eidsString}/constituencies`;
  if (page === PageType.SelectConstituencies) return url;

  const cidsString = constituencyIds
    ? combineIds(constituencyIds)
    : extractIdsString('constituencies', currentUrl);
  url += `/${cidsString}`;

  if ([PageType.SelectQuestionCategories, PageType.ShowQuestion].includes(page)) {
    url += '/questions';
    if (page === PageType.SelectQuestionCategories) return url;
    // ShowQuestion
    const qcidsString = questionCategoryIds
      ? combineIds(questionCategoryIds)
      : extractIdsString('questions', currentUrl);
    if (questionId == undefined || questionId == '') {
      throw new Error('This route must have a questionId');
    }
    url += `/${qcidsString}/question/${questionId}`;
    return url;
  }

  if ([PageType.ShowResults, PageType.ShowPerson].includes(page)) {
    url += '/results';
    if (page === PageType.ShowResults) return url;
    // ShowCandidate
    if (personNominationId == undefined || personNominationId == '') {
      throw new Error('This route must have a candidateId');
    }
    url += `/person/${personNominationId}`;
    return url;
  }

  throw new Error(`Unknown page type: ${page}`);
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
