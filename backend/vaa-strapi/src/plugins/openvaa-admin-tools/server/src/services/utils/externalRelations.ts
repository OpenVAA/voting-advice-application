import type { UID } from '@strapi/strapi';
import type { ExternalRelation, ExternalRelationConfig, ImportDatum } from '../data.type';

/**
 * Convert any `ExternalRelation`s in `datum` to actual Strapi document IDs, including the `answersByExternalId` property.
 * @param config - A mapping of relation property names and their corresponding Strapi content types.
 * @param datum - The data to parse.
 * @param strapi - The Strapi client instance.
 * @returns The datum with parsed external relations.
 * @throws Error relations or not found or they match multiple Strapi documents.
 */
export async function parseExternalRelations<TData extends ImportDatum>({
  config,
  datum,
  strapi,
}: {
  config: ExternalRelationConfig<TData>;
  datum: TData;
  strapi;
}): Promise<ImportDatum> {
  // Convert answersByExternalId to answers
  const { answersByExternalId, answers, ...rest } = datum;
  let combinedAnswers: object = answers && typeof answers === 'object' ? answers : {};
  if (answersByExternalId) {
    combinedAnswers = {
      ...combinedAnswers,
      ...(await parseAnswersByExternalId(answersByExternalId as object)),
    };
  }
  const parsed = { ...rest, answers: combinedAnswers } as ImportDatum;
  // Convert external relations to document IDs
  for (const [key, api] of Object.entries(config)) {
    const value = parsed[key];
    if (!isExternalRelation(value)) continue;
    let ids = [value.externalId].flat();
    ids = await Promise.all(
      ids.map(async (externalId) => {
        const doc = await findOneByExternalId({ api, externalId, strapi });
        if (!doc) throw new Error(`No ${api} found for externalId ${externalId}`);
        return doc.documentId;
      })
    );
    parsed[key] = ids;
  }
  return parsed;
}

/**
 * Convert `externalId` keys to `Question.documentId`s in an answers dictionary.
 * @param answers - The answers dictionary with `externalId`s as keys.
 * @returns The same answers with `documentId`s as keys.
 */
export async function parseAnswersByExternalId(answers: object): Promise<object> {
  if (!answers || typeof answers !== 'object' || !Object.keys(answers).length) return {};

  const questionMap = new Map(
    (await strapi.documents('api::question.question').findMany({ fields: ['externalId'] })).map(
      (q) => [q.externalId, q.documentId]
    )
  );

  return Object.fromEntries(
    Object.entries(answers).map(([externalId, answer]) => {
      const documentId = questionMap.get(externalId);
      if (documentId) return [documentId, answer];
      throw new Error(`No question found for externalId ${externalId}`);
    })
  );
}

/**
 * Find a single document by `externalId`. Returns the document or `undefined` if not found.
 * @param api - The Strapi content type.
 * @param externalId - The `externalId` to find.
 * @param strapi - The Strapi client instance.
 * @returns The document or `undefined` if not found.
 * @thwrows Error if multiple documents are found.
 */
export async function findOneByExternalId({
  api,
  externalId,
  strapi,
}: {
  api: UID.ContentType;
  externalId: string;
  strapi;
}): Promise<(object & { documentId: string }) | undefined> {
  const results = await strapi.documents(api).findMany({
    filters: { externalId: { $eq: externalId } },
  });
  if (!results.length) return undefined;
  if (results.length > 1)
    throw new Error(
      `Multiple ${api} objects (${results.length}) with externalId ${externalId} found`
    );
  return results[0];
}

function isExternalRelation(value: unknown): value is ExternalRelation {
  return value && typeof value === 'object' && 'externalId' in value;
}
