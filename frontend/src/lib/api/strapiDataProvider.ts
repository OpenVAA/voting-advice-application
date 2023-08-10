/*
 * Contains an incomplete mock implementation of DataProvider for use with
 * Strapi.
 */

import {error} from '@sveltejs/kit';
import type {AppLabels} from './dataProvider.types';
import type {CandidateData} from './dataObjects/candidate';
import {DataProvider} from './dataProvider';

export interface StrapiDataProviderOptions {
  backendUrl: string;
  strapiToken: string;
  /**
   * In the future, this can be set to target a specific election group if the
   * data for multiple election groups (e.g. different years) is contained in
   * the same Strapi instance.
   */
  electionGroupId?: string;
}

export class StrapiDataProvider extends DataProvider {
  constructor(public options: StrapiDataProviderOptions) {
    super();
  }

  // TODO: Define what type of data this returns instead of just any
  async getData(endpoint: string, params: URLSearchParams = new URLSearchParams({})): Promise<any> {
    const url = `${this.options.backendUrl}/${endpoint}?${params}`;
    return await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.options.strapiToken}`
      }
    })
      .then((response) => {
        return response.json();
      })
      .catch((error) => console.error('Error in getting data from backend: ', error));
  }

  async getAppLabels(): Promise<AppLabels> {
    const election = await this.getData(
      'api/elections',
      new URLSearchParams({populate: 'electionAppLabel'})
    ).then((result) => {
      if (result?.data[0]?.attributes) {
        return result.data[0].attributes;
      }
      throw error(404, 'election not found');
    });
    const appLabelId = election.electionAppLabel?.data?.id;
    if (appLabelId == null) {
      throw error(404, 'appLabelId not found');
    }
    // TODO add filter to get the labels for the correct election
    return this.getData(
      'api/election-app-labels',
      new URLSearchParams({
        'filters[id][$eq]': appLabelId,
        populate: '*'
      })
    )
      .then((result) => {
        if (result?.data[0]?.attributes) {
          return result.data[0].attributes;
        }
        throw error(404, 'appLabels not found');
      })
      .catch((err) => {
        console.error('Error in getting layout data from Strapi: ', ' - - - ', err);
      }) as Promise<AppLabels>;
  }

  async getCandidatesData(): Promise<CandidateData[]> {
    // Todo: apply query options?: EntityQueryOptions
    return (await this.getData('api/candidates', new URLSearchParams({populate: '*'})).then(
      (result) => {
        if (result && result.data) return result.data;
        else console.error('Could not retrieve result for all candidates');
      }
    )) as Promise<CandidateData[]>;
  }
}
