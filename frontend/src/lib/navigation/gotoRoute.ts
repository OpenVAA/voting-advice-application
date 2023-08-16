/*
 * A utility to build routes urls.
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
  electionIds?: Id[];
  constituencyIds?: Id[];
  questionCategoryIds?: Id[];
  questionId?: Id;
  candidateId?: Id;
};

export function gotoRoute(params: GotoRouteParams) {
  let url = '/';
  if (params.page === PageType.FrontPage) {
    url += '';
  } else if (params.page === PageType.SelectElections) {
    url += 'elections';
  }
  goto(url);
}
