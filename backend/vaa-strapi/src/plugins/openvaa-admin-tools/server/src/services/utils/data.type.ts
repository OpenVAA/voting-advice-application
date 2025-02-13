import { UID } from '@strapi/strapi';
import { IMPORTABLE_COLLECTIONS } from './importableCollections';

/**
 * Any importable collection.
 */
export type ImportableCollection = keyof typeof IMPORTABLE_COLLECTIONS;

/**
 * The format for imported data.
 */
export type ImportData = {
  [KCollection in ImportableCollection]?: Array<ImportDatum>;
};

/**
 * The format for imported data.
 */
export type ImportDatum = Record<string, unknown>;

export interface ImportDataResult extends DataResult {
  created?: Record<string, number>;
  updated?: Record<string, number>;
}

/**
 * An external relation, i.e., relation to one or more objects by their `externalId`.
 */
export type ExternalRelation = { externalId: string | Array<string> };

/**
 * A mapping of relation property names and their corresponding Strapi content types.
 */
export type ExternalRelationConfig<TData extends ImportDatum = ImportDatum> = Partial<
  Record<keyof TData, UID.ContentType>
>;

/**
 * The format for deleting data. The values are `externalId`-prefixes matching the data to delete.
 */
export type DeleteData = {
  [KCollection in ImportableCollection]?: string;
};

export interface DeleteDataResult extends DataResult {
  deleted?: Record<string, number>;
}

export interface DataResult {
  type: 'success' | 'failure';
  cause?: string;
}
