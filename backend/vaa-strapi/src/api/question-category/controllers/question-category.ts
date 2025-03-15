/**
 * question-category controller
 */

import { factories } from '@strapi/strapi';
//import { validateYupSchema, yup } from '@strapi/utils';

/*
const validateQuery = validateYupSchema(
  yup.object({
    filters: yup
      .object({
        $or: yup.array(yup.object({})).optional()
      })
      .optional()
  })
);
*/

export default factories.createCoreController('api::question-category.question-category', ({ strapi }) => ({
  /**
   * Fetches question-categories with optional filtering by election.
   *
   * This function provides a performance-optimized alternative to the default Strapi `/api/question-categories` endpoint.
   *
   * ### Filters
   * The function accepts an optional `filters` object to refine the query:
   *
   * ```ts
   * filters = {
   *   $or: [
   *     { elections: { documentId: { $in: string[] } },
   *     { elections: { documentId: { $null: 'true' } } }
   *   ]
   * };
   * ```
   *
   * ### Populated Relations
   * The following related entities are automatically populated:
   *
   * ```ts
   * populate = {
   *   constituencies: 'true',
   *   elections: 'true',
   *   questions: {
   *     populate: {
   *       constituencies: 'true',
   *       questionType: 'true'
   *     }
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
        $or?: Array<{ elections: { documentId: { $in: Array<string> } | { $null: 'true' } } }>;
      };
    };

    const electionSqlInFilter = {
      enabled: Boolean(query?.filters?.$or?.some((condition) => '$in' in condition.elections.documentId)),
      values: query?.filters?.$or?.flatMap((condition) =>
        '$in' in condition.elections.documentId ? condition.elections.documentId.$in : []
      )
    };
    const electionSqlNullFilter = {
      enabled: Boolean(query?.filters?.$or?.some((condition) => '$null' in condition.elections.documentId))
    };

    try {
      const { rows: questionCategories } = await strapi.db.connection.raw<{ rows: Array<{ data: object }> }>(
        `
          with question_categories_constituencies as (
            select
              question_categories_constituencies_lnk.question_category_id,
              json_agg(json_build_object(
                'documentId', constituencies.document_id,
                'name', constituencies.name,
                'shortName', constituencies.short_name,
                'info', constituencies.info,
                'keywords', constituencies.keywords
              ) order by constituencies.id) as constituencies
            from question_categories_constituencies_lnk
            join constituencies on constituencies.id = question_categories_constituencies_lnk.constituency_id
            group by question_categories_constituencies_lnk.question_category_id
          ),
          question_categories_elections as (
            select
              question_categories_elections_lnk.question_category_id,
              json_agg(json_build_object(
                'documentId', elections.document_id,
                'electionStartDate', elections.election_start_date,
                'electionDate', elections.election_date,
                'electionType', elections.election_type,
                'name', elections.name,
                'shortName', elections.short_name,
                'info', elections.info
              ) order by elections.id) as elections,
              bool_or(elections.document_id = any(?)) as is_election_document_id_in
            from question_categories_elections_lnk
            join elections on elections.id = question_categories_elections_lnk.election_id
            group by question_categories_elections_lnk.question_category_id
          ),
          questions_constituencies as (
            select
              questions_constituencies_lnk.question_id,
              json_agg(json_build_object(
                'documentId', constituencies.document_id,
                'name', constituencies.name,
                'shortName', constituencies.short_name,
                'info', constituencies.info,
                'keywords', constituencies.keywords
              ) order by constituencies.id) as constituencies
            from questions_constituencies_lnk
            join constituencies on constituencies.id = questions_constituencies_lnk.constituency_id
            group by questions_constituencies_lnk.question_id
          ),
          questions_category as (
            select
              questions_category_lnk.question_category_id,
              json_agg(json_build_object(
                'documentId', questions.document_id,
                'allowOpen', questions.allow_open,
                'customData', questions.custom_data,
                'entityType', questions.entity_type,
                'fillingInfo', questions.filling_info,
                'filterable', questions.filterable,
                'info', questions.info,
                'order', questions.order,
                'required', questions.required,
                'shortName', questions.short_name,
                'text', questions.text,
                'questionType', json_build_object(
                  'documentId', question_types.document_id,
                  'info', question_types.info,
                  'name', question_types.name,
                  'settings', question_types.settings
                ),
                'constituencies', coalesce(questions_constituencies.constituencies, '[]'::json)
              ) order by questions.id) questions
            from questions_category_lnk
            join questions on questions.id = questions_category_lnk.question_id
            left join questions_question_type_lnk on questions_question_type_lnk.question_id = questions.id
            left join question_types on question_types.id = questions_question_type_lnk.question_type_id
            left join questions_constituencies on questions_constituencies.question_id = questions.id
            group by questions_category_lnk.question_category_id
          )
          select
            json_build_object(
              'documentId', question_categories.document_id,
              'color', question_categories.color,
              'colorDark', question_categories.color_dark,
              'customData', question_categories.custom_data,
              'info',  question_categories.info,
              'name', question_categories.name,
              'order', question_categories.order,
              'shortName', question_categories.short_name,
              'type', question_categories.type,
              'constituencies', coalesce(question_categories_constituencies.constituencies, '[]'::json),
              'elections', coalesce(question_categories_elections.elections, '[]'::json),
              'questions', coalesce(questions_category.questions, '[]'::json)
            ) "data"
          from question_categories
          left join question_categories_constituencies on question_categories_constituencies.question_category_id = question_categories.id
          left join question_categories_elections on question_categories_elections.question_category_id = question_categories.id
          left join questions_category on questions_category.question_category_id =  question_categories.id
          where
            (? = false or question_categories_elections.is_election_document_id_in) or
            (? = false or question_categories_elections.elections is null)
          order by question_categories.id
        `,
        [electionSqlInFilter.values, electionSqlInFilter.enabled, electionSqlNullFilter.enabled]
      );

      return {
        data: questionCategories.map(({ data }) => data),
        meta: {
          pagination: {
            page: 1,
            pageSize: questionCategories.length,
            pageCount: 1,
            total: questionCategories.length
          }
        }
      };
    } catch {
      ctx.throw(500);
    }
  }
}));
