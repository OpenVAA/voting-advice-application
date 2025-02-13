import { createOrUpdate } from './utils/createOrUpdate';
import { IMPORTABLE_COLLECTIONS } from './utils/importableCollections';
import type { Core } from '@strapi/strapi';
import type { DeleteData, DeleteDataResult, ImportData, ImportDataResult } from './utils/data.type';

export default function service({ strapi }: { strapi: Core.Strapi }) {
  return {
    /**
     * Import data into Strapi or update existing data based on `externalId` or `documentId` if provided.
     * @param data - The data as `Array`s of `ImportData` objects collected by their collection name.
     * @returns A `ImportDataResult` object with counts of created and updated objects.
     * @throws Error if both `externalId` and `documentId` are provided.
     */
    import: async (data: ImportData): Promise<ImportDataResult> => {
      const result:
        | Error
        | {
            type: 'success';
            created: Record<string, number>;
            updated: Record<string, number>;
          } = await strapi.db.transaction(async ({ rollback, commit }) => {
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
      });
      if (result instanceof Error) {
        return {
          type: 'failure',
          cause: result instanceof Error ? result.message : 'There was an error importing the data',
        };
      }
      return {
        ...result,
        type: 'success',
      };
    },

    /**
     * Delete data based on `externalId`s. Objects whose `externalId`s start with the provided prefixes will be deleted.
     * @param data - A record of case-sensitive `externalId`-prefixes by their collection name.
     * @returns A `DeleteDataResult` object with counts of deleted objects.
     */
    delete: async (data: DeleteData): Promise<DeleteDataResult> => {
      const result:
        | Error
        | {
            type: 'success';
            deleted: Record<string, number>;
          } = await strapi.db.transaction(async ({ rollback, commit }) => {
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
      });
      if (result instanceof Error) {
        return {
          type: 'failure',
          cause: result instanceof Error ? result.message : 'There was an error deleting the data',
        };
      }
      return {
        ...result,
        type: 'success',
      };
    },
  };
}
