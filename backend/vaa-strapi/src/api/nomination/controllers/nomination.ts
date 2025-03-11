/**
 * nomination controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::nomination.nomination', ({ strapi }) => ({
  /**
   * Fetches nominations with optional filtering by election and constituency.
   *
   * This function provides a performance-optimized alternative to the default Strapi `/api/nominations` endpoint.
   *
   * ### Filters
   * The function accepts an optional `filters` object to refine the query:
   *
   * ```ts
   * filters = {
   *   election?: {
   *     documentId?: {
   *       $in?: string[];
   *     };
   *   };
   *   constituency?: {
   *     documentId?: {
   *       $in?: string[];
   *     };
   *   };
   *   unconfirmed?: {
   *     $ne?: 'true' | 'false';
   *   };
   * };
   * ```
   *
   * ### Populated Relations
   * The following related entities are automatically populated:
   *
   * ```ts
   * populate = {
   *   constituency: true,
   *   election: true,
   *   candidate: {
   *     populate: {
   *       image: true,
   *       party: true
   *     }
   *   },
   *   party: {
   *     populate: { image: true }
   *   }
   * };
   * ```
   *
   * ### Pagination
   *
   * Not supported.
   */
  async withRelations(ctx) {
    const query = ctx.query as {
      filters?: {
        election?: {
          documentId?: {
            $in?: Array<string>;
          };
        };
        constituency?: {
          documentId?: {
            $in?: Array<string>;
          };
        };
        unconfirmed?: {
          $ne?: 'true' | 'false';
        };
      };
    };

    function sqlInFilter($in: Array<string> = []) {
      const values = $in.filter(Boolean);
      const enabled = Boolean(values.length);
      return {
        enabled,
        values: enabled ? values : [''] // IN cannot be empty.
      };
    }

    const electionSqlInFilter = sqlInFilter(query.filters?.election?.documentId?.$in);
    const constituencySqlInFilter = sqlInFilter(query.filters?.constituency?.documentId?.$in);
    const unconfirmedSqlNotEqualFilter = {
      enabled: Boolean(query.filters?.unconfirmed?.$ne),
      value: query.filters?.unconfirmed?.$ne
    };

    try {
      const { rows: nominations } = await strapi.db.connection.raw<{ rows: Array<{ data: object }> }>(
        `
        with _elections as (
          select
            elections.id,
            json_build_object(
              'documentId', elections.document_id,
              'electionStartDate', elections.election_start_date,
              'electionDate', elections.election_date,
              'electionType', elections.election_type,
              'name', elections.name,
              'shortName', elections.short_name,
              'info', elections.info
            ) data
           from elections
           where (? = false or elections.document_id in (${electionSqlInFilter.values.map(() => '?').join(',')}))
        ),
        _constituencies as (
          select
            constituencies.id,
            json_build_object(
              'documentId', constituencies.document_id,
              'name', constituencies.name,
              'shortName', constituencies.short_name,
              'info', constituencies.info,
              'keywords', constituencies.keywords
            ) data
          from constituencies
          where (? = false or constituencies.document_id in (${constituencySqlInFilter.values.map(() => '?').join(',')}))
        ),
        _images as (
          select
            files_related_mph.related_id,
            json_build_object(
              'id', files.id,
              'name', files.name,
              'alternativeText', files.alternative_text,
              'caption', files.caption,
              'width', files.width,
              'height', files.height,
              'formats', files.formats,
              'ext', files.ext,
              'size', files.size,
              'url', files.url
            ) data
          from files_related_mph
          join files on files.id = files_related_mph.file_id
        ),
        _parties as (
          select
            id,
            json_build_object(
              'documentId', parties.document_id,
              'color', parties.color,
              'name', parties.name,
              'shortName', parties.short_name,
              'info', parties.info,
              'colorDark', parties.color_dark,
              'answers', parties.answers,
              'image', _images.data
            ) data
          from parties
          left join _images on _images.related_id = parties.id
        )
        select
          json_build_object(
            'documentId', nominations.document_id,
            'electionSymbol', nominations.election_symbol,
            'electionRound', nominations.election_round,
            'unconfirmed', nominations.unconfirmed,
            'constituency', _constituencies.data,
            'election', _elections.data,
            'candidate', json_build_object(
              'documentId', candidates.document_id,
              'firstName', candidates.first_name,
              'lastName', candidates.last_name,
              'answers', candidates.answers,
              'image', candidates_images.data,
              'party', candidates_parties.data
            ),
            'party', nominations_parties.data
          ) data
        from nominations
        -- Election
        join nominations_election_lnk on nominations_election_lnk.nomination_id = nominations.id
        join _elections on _elections.id = nominations_election_lnk.election_id
        -- Constituency
        join nominations_constituency_lnk on nominations_constituency_lnk.nomination_id = nominations.id
        join _constituencies on _constituencies.id = nominations_constituency_lnk.constituency_id
        -- Candidate
        join nominations_candidate_lnk on nominations_candidate_lnk.nomination_id = nominations.id
        join candidates on candidates.id = nominations_candidate_lnk.candidate_id
        left join _images candidates_images on candidates_images.related_id = candidates.id
        -- Candidate's party
        left join candidates_party_lnk on candidates_party_lnk.candidate_id = candidates.id
        left join _parties candidates_parties on candidates_parties.id = candidates_party_lnk.party_id
        -- Nomination's party
        left join nominations_party_lnk on nominations_party_lnk.nomination_id = nominations.id
        left join _parties nominations_parties on nominations_parties.id = nominations_party_lnk.party_id
        where (? = false or nominations.unconfirmed != ?::boolean)
        order by nominations.id
      `,
        [
          electionSqlInFilter.enabled,
          ...electionSqlInFilter.values,
          constituencySqlInFilter.enabled,
          ...constituencySqlInFilter.values,
          unconfirmedSqlNotEqualFilter.enabled,
          unconfirmedSqlNotEqualFilter.value
        ]
      );

      return {
        data: nominations.map(({ data }) => data),
        meta: {
          pagination: {
            page: 1,
            pageSize: nominations.length,
            pageCount: 1,
            total: nominations.length
          }
        }
      };
    } catch {
      ctx.throw(500);
    }
  }
}));
