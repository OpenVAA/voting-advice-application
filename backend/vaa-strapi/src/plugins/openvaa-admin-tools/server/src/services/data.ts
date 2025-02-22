import { createOrUpdate } from './utils/createOrUpdate';
import { IMPORTABLE_COLLECTIONS } from './utils/importableCollections';
import type { Core, Data } from '@strapi/strapi';
import type {
  DeleteData,
  DeleteDataResult,
  FindDataResult,
  ImportableCollection,
  ImportData,
  ImportDataResult,
  RegistrationStatus,
} from './data.type';

export default function service({ strapi }: { strapi: Core.Strapi }) {
  return {
    /**
     * Import data into Strapi or update existing data based on `externalId` or `documentId` if provided.
     * @param data - The data as `Array`s of `ImportData` objects collected by their collection name.
     * @returns A `ImportDataResult` object with counts of created and updated objects.
     * @fails If both `externalId` and `documentId` are provided.
     * @fails If any of the collections are not importable.
     */
    import: async (data: ImportData): Promise<ImportDataResult> => {
      const result: Error | ImportDataResult = await strapi.db.transaction(
        async ({ rollback, commit }) => {
          const created = {};
          const updated = {};
          try {
            for (const [collection, collectionData] of Object.entries(data)) {
              if (!(collection in IMPORTABLE_COLLECTIONS))
                throw new Error(`Invalid collection ${collection}`);
              for (const datum of collectionData) {
                const result = await createOrUpdate({ collection, datum, strapi });
                if (result === 'created') {
                  created[collection] ??= 0;
                  created[collection]++;
                } else if (result === 'updated') {
                  updated[collection] ??= 0;
                  updated[collection]++;
                } else {
                  throw new Error(`Invalid result from createOrUpdate: ${result}`);
                }
              }
            }
          } catch (e) {
            await rollback();
            return e;
          }
          await commit();
          return { type: 'success', created, updated };
        }
      );
      if (result instanceof Error) {
        return {
          type: 'failure',
          cause: result instanceof Error ? result.message : 'There was an error importing the data',
        };
      }
      return {
        type: 'success',
        ...result,
      };
    },

    /**
     * Delete data based on `externalId`s. Objects whose `externalId`s start with the provided prefixes will be deleted.
     * @param data - A record of case-sensitive `externalId`-prefixes by their collection name.
     * @returns A `DeleteDataResult` object with counts of deleted objects.
     * @fails If any of the collections are not importable.
     */
    delete: async (data: DeleteData): Promise<DeleteDataResult> => {
      const result: Error | DeleteDataResult = await strapi.db.transaction(
        async ({ rollback, commit }) => {
          const deleted = {};
          try {
            for (const [collection, externalId] of Object.entries(data)) {
              if (!(collection in IMPORTABLE_COLLECTIONS))
                throw new Error(`Invalid collection ${collection}`);
              if (!externalId || typeof externalId !== 'string')
                throw new Error(`Invalid externalId ${externalId} for collection ${collection}`);
              const api = IMPORTABLE_COLLECTIONS[collection].api;
              const found = await strapi.documents(api).findMany({
                filters: { externalId: { $startsWith: externalId } },
              });
              await Promise.all(
                found.map(async ({ documentId }) => strapi.documents(api).delete({ documentId }))
              );
              deleted[collection] ??= 0;
              deleted[collection] += found.length;
            }
          } catch (e) {
            await rollback();
            return e;
          }
          await commit();
          return { type: 'success', deleted };
        }
      );
      if (result instanceof Error) {
        return {
          type: 'failure',
          cause: result instanceof Error ? result.message : 'There was an error deleting the data',
        };
      }
      return {
        type: 'success',
        ...result,
      };
    },

    /**
     * Arbitraritly find data and receive the the results.
     * @param collection - The collection name.
     * @param filters - The filters to apply to the find operation.
     * @returns A `FindDataResult` object with the found data.
     * @fails If the collection is invalid.
     */
    find: async ({
      collection,
      filters,
    }: {
      collection: ImportableCollection;
      filters: object;
    }): Promise<FindDataResult> => {
      if (!(collection in IMPORTABLE_COLLECTIONS))
        return {
          type: 'failure',
          cause: `Invalid collection ${collection}`,
        };
      const data = await strapi
        .documents(IMPORTABLE_COLLECTIONS[collection].api)
        .findMany({
          filters,
        })
        .catch((e) => e);
      if (data instanceof Error) {
        return {
          type: 'failure',
          cause: data instanceof Error ? data.message : 'There was an error finding the data',
        };
      }
      return {
        type: 'success',
        data,
      };
    },

    /**
     * Find Candidates based on specified criteria.
     * @param registrationStatus - The registration status of the candidates.
     * @param constituency - Optional constituency in which the candidates have to be nominated in.
     * @returns A `FindDataResult` object with the found data.
     */
    findCandidates: async ({
      registrationStatus,
      constituency,
    }: {
      registrationStatus: RegistrationStatus;
      constituency?: string;
    }): Promise<FindDataResult> => {
      // Build filters
      const filters: Record<string, unknown> = {};
      switch (registrationStatus) {
        case 'registered':
          filters.candidate = {
            $or: [{ registrationKey: { $eq: '' } }, { registrationKey: { $null: true } }],
          };
          break;
        case 'unregistered':
          filters.candidate = {
            $and: [{ registrationKey: { $ne: '' } }, { registrationKey: { $notNull: true } }],
          };
          break;
        case 'all':
          break;
        default:
          return {
            type: 'failure',
            cause: `Invalid registrationStatus ${registrationStatus}`,
          };
      }
      if (constituency) filters.constituency = { documentId: { $eq: constituency } };
      const nominations = await strapi
        .documents('api::nomination.nomination')
        .findMany({
          filters,
          populate: { candidate: true },
        })
        .catch((e) => e);
      if (nominations instanceof Error) {
        return {
          type: 'failure',
          cause:
            nominations instanceof Error
              ? nominations.message
              : 'There was an error finding the candidates',
        };
      }
      const candidates = [
        ...new Set(
          nominations
            // Because of the complexity of building a suitable filter, we filter out non-candidate nominations manually
            .filter((n) => n.candidate)
            .map(({ candidate: c }) => ({
              documentId: c.documentId,
              email: c.email,
              firstName: c.firstName,
              lastName: c.lastName,
              identifier: c.identifier,
            }))
        ),
      ] as Array<Data.Entity>;
      return {
        type: 'success',
        data: candidates,
      };
    },
  };
}
