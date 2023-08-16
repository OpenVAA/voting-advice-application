/*
 * A utility to build routes urls.
 *
 * TO DO: Separate url building into another function so that we can
 * use it in server.ts redirects.
 */

import {goto} from '$app/navigation';
import type {Id} from '$lib/vaa-data';

export enum PageType {
  FrontPage,
  SelectElections,
  SelectConstituencies,
  SelectQuetionCategories,
  ShowQuestions,
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
};

export function gotoRoute(params: GotoRouteParams) {
  let url = '/';
  if (params.page === PageType.FrontPage) {
    url += '';
  } else if (params.page === PageType.SelectElections) {
    url += 'elections';
  } else if (params.page === PageType.SelectConstituencies) {
    url += `elections/${combineIds(params.electionIds)}/constituencies`;
  } else if (params.page === PageType.SelectQuetionCategories) {
    url += `elections/${combineIds(params.electionIds)}/constituencies/${combineIds(
      params.constituencyIds
    )}/questions`;
  }
  goto(url);
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
