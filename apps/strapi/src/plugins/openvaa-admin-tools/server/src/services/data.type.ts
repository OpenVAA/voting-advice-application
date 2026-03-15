import type { Data, UID } from '@strapi/strapi';
import type { ActionResult } from './actionResult.type';
import type { IMPORTABLE_COLLECTIONS } from './utils/importableCollections';

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

export interface ImportDataResult extends ActionResult {
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

export interface DeleteDataResult extends ActionResult {
  deleted?: Record<string, number>;
}

export interface FindDataResult extends ActionResult {
  data?: Array<Data.Entity>;
}

/**
 * The registration status of a candidate.
 */
export type RegistrationStatus = 'all' | 'unregistered' | 'registered';
